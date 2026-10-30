package com.agritech.optimizer.service;

import com.agritech.optimizer.dto.delivery.DeliveryRequestCreate;
import com.agritech.optimizer.dto.delivery.DeliveryRequestResponse;
import com.agritech.optimizer.dto.delivery.OpenOrder;
import com.agritech.optimizer.dto.delivery.TransportOption;
import com.agritech.optimizer.dto.delivery.TripSuggestion;
import com.agritech.optimizer.dto.trip.TripResponse;
import com.agritech.optimizer.entity.DeliveryRequest;
import com.agritech.optimizer.entity.DeliveryRequestStatus;
import com.agritech.optimizer.entity.Notification;
import com.agritech.optimizer.entity.Order;
import com.agritech.optimizer.entity.OrderStatus;
import com.agritech.optimizer.entity.ProduceListing;
import com.agritech.optimizer.entity.Role;
import com.agritech.optimizer.entity.Trip;
import com.agritech.optimizer.entity.TripSlot;
import com.agritech.optimizer.entity.TripStatus;
import com.agritech.optimizer.entity.User;
import com.agritech.optimizer.entity.Vehicle;
import com.agritech.optimizer.exception.BusinessRuleException;
import com.agritech.optimizer.exception.ResourceNotFoundException;
import com.agritech.optimizer.optimizer.LoadPlanner;
import com.agritech.optimizer.optimizer.RoutePlanner;
import com.agritech.optimizer.repository.DeliveryRequestRepository;
import com.agritech.optimizer.repository.NotificationRepository;
import com.agritech.optimizer.repository.OrderRepository;
import com.agritech.optimizer.repository.TripRepository;
import com.agritech.optimizer.repository.UserRepository;
import com.agritech.optimizer.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Farmers book transporters for confirmed orders; transporters accept, decline, or fill free space.
 * No admin step is needed.
 *
 * <pre>
 * Farmer: choose date + slot → see transporters with room → send request (PENDING)
 * Transporter: accept → the order joins their trip for that date + slot (a new trip if they have none)
 *              decline → the farmer picks someone else
 * Rules: one trip per transporter per date + slot; a trip takes orders while its lorry has room;
 *        cold-chain produce only on refrigerated vehicles.
 * </pre>
 *
 * @author Ashmi Hettige
 */
@Service
@Transactional(readOnly = true)
public class DeliveryService {

    private final OrderRepository orderRepository;
    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final DeliveryRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final double roadFactor;

    public DeliveryService(OrderRepository orderRepository,
                           TripRepository tripRepository,
                           VehicleRepository vehicleRepository,
                           DeliveryRequestRepository requestRepository,
                           UserRepository userRepository,
                           NotificationRepository notificationRepository,
                           @Value("${app.transport.road-factor}") double roadFactor) {
        this.orderRepository = orderRepository;
        this.tripRepository = tripRepository;
        this.vehicleRepository = vehicleRepository;
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.roadFactor = roadFactor;
    }

    // ---------- Farmer ----------

    // transporters who can take this order on that date and slot, fullest lorries first
    public List<TransportOption> options(Long orderId, LocalDate date, TripSlot slot, String email) {
        Order order = farmersConfirmedOrder(orderId, email);
        BigDecimal kg = OpenOrder.totalKg(order);
        boolean cold = OpenOrder.needsColdChain(order);

        // each transporter's vehicles, grouped by the transporter's id
        Map<Long, List<Vehicle>> fleets = vehicleRepository.findByTransporterEnabledTrue().stream()
                .collect(Collectors.groupingBy(vehicle -> vehicle.getTransporter().getId()));

        List<TransportOption> options = new ArrayList<>();
        for (List<Vehicle> fleet : fleets.values()) {
            User transporter = fleet.get(0).getTransporter();
            Optional<Trip> trip = tripRepository.findFirstByVehicleTransporterIdAndTripDateAndSlot(
                    transporter.getId(), date, slot);
            if (trip.isPresent()) {
                Trip existing = trip.get();
                if (fits(existing, kg, cold)) {
                    Vehicle vehicle = existing.getVehicle();
                    options.add(new TransportOption(transporter.getId(), transporter.getFullName(),
                            transporter.getDistrict(), transporter.getPhone(), vehicle.getPlateNo(), vehicle.getType(),
                            vehicle.isRefrigerated(), spaceLeft(existing), true, existing.getOrders().size()));
                }
            } else {
                smallestVehicleFor(fleet, kg, cold).ifPresent(vehicle -> options.add(new TransportOption(
                        transporter.getId(), transporter.getFullName(), transporter.getDistrict(),
                        transporter.getPhone(), vehicle.getPlateNo(), vehicle.getType(), vehicle.isRefrigerated(),
                        vehicle.getCapacityKg(), false, 0)));
            }
        }
        // sharing a lorry that is already going cuts trips and cost, so those come first
        options.sort(Comparator.comparing(TransportOption::joinsTrip).reversed()
                .thenComparing(TransportOption::spaceLeftKg));
        return options;
    }

    @Transactional
    public DeliveryRequestResponse requestTransport(DeliveryRequestCreate request, String email) {
        Order order = farmersConfirmedOrder(request.orderId(), email);
        if (requestRepository.existsByOrderIdAndStatus(order.getId(), DeliveryRequestStatus.PENDING)) {
            throw new BusinessRuleException("This order already has a request waiting for an answer");
        }
        User transporter = userRepository.findById(request.transporterId())
                .filter(user -> user.getRole() == Role.TRANSPORTER && user.isEnabled())
                .orElseThrow(() -> new ResourceNotFoundException("Transporter not found"));

        DeliveryRequest saved = requestRepository.save(
                new DeliveryRequest(order, transporter, request.tripDate(), request.slot()));
        notify(transporter, order.getFarmer().getFullName() + " asked you to deliver order #" + order.getId()
                + " on " + request.tripDate() + " (" + request.slot().name().toLowerCase() + ")");
        return DeliveryRequestResponse.forFarmer(saved);
    }

    public List<DeliveryRequestResponse> sentRequests(String email) {
        User farmer = currentUser(email);
        return requestRepository.findByOrderFarmerIdOrderByCreatedAtDesc(farmer.getId()).stream()
                .map(DeliveryRequestResponse::forFarmer)
                .toList();
    }

    @Transactional
    public void cancelRequest(Long id, String email) {
        DeliveryRequest request = findRequest(id);
        if (!request.getOrder().getFarmer().getId().equals(currentUser(email).getId())) {
            throw new AccessDeniedException("This is not your request");
        }
        if (request.getStatus() != DeliveryRequestStatus.PENDING) {
            throw new BusinessRuleException("Only a waiting request can be cancelled");
        }
        request.setStatus(DeliveryRequestStatus.CANCELLED);
        notify(request.getTransporter(), "The request for order #" + request.getOrder().getId() + " was cancelled");
    }

    // ---------- Transporter ----------

    public List<DeliveryRequestResponse> incomingRequests(String email) {
        User transporter = currentUser(email);
        return requestRepository.findByTransporterIdAndStatusOrderByTripDateAsc(
                        transporter.getId(), DeliveryRequestStatus.PENDING).stream()
                .map(DeliveryRequestResponse::forTransporter)
                .toList();
    }

    @Transactional
    public DeliveryRequestResponse decide(Long id, boolean accept, String email) {
        DeliveryRequest request = findRequest(id);
        User transporter = currentUser(email);
        if (!request.getTransporter().getId().equals(transporter.getId())) {
            throw new AccessDeniedException("This request is not for you");
        }
        if (request.getStatus() != DeliveryRequestStatus.PENDING) {
            throw new BusinessRuleException("This request has already been answered");
        }
        Order order = request.getOrder();

        if (!accept) {
            request.setStatus(DeliveryRequestStatus.DECLINED);
            notify(order.getFarmer(), transporter.getFullName() + " declined order #" + order.getId()
                    + ". Please choose another transporter.");
            return DeliveryRequestResponse.forTransporter(request);
        }

        if (order.getStatus() != OrderStatus.CONFIRMED || order.getTrip() != null) {
            throw new BusinessRuleException("Order #" + order.getId() + " is no longer waiting for transport");
        }
        Trip trip = tripFor(transporter, request.getTripDate(), request.getSlot(), order);
        addToTrip(trip, order);
        request.setStatus(DeliveryRequestStatus.ACCEPTED);
        notify(order.getFarmer(), transporter.getFullName() + " will deliver order #" + order.getId()
                + " on " + request.getTripDate());
        return DeliveryRequestResponse.forTransporter(request);
    }

    // open orders that fit the free space of my planned trips, picked heaviest first (First-Fit Decreasing)
    public List<TripSuggestion> suggestions(String email) {
        User transporter = currentUser(email);
        Set<Long> requested = requestRepository.findByStatus(DeliveryRequestStatus.PENDING).stream()
                .map(request -> request.getOrder().getId())
                .collect(Collectors.toSet());
        List<Order> open = orderRepository.findByStatusAndTripIsNull(OrderStatus.CONFIRMED).stream()
                .filter(order -> !requested.contains(order.getId()))
                .toList();
        if (open.isEmpty()) {
            return List.of();
        }
        Map<Long, Order> byId = open.stream().collect(Collectors.toMap(Order::getId, Function.identity()));

        List<TripSuggestion> suggestions = new ArrayList<>();
        for (Trip trip : tripRepository.findByVehicleTransporterIdAndStatusAndTripDateGreaterThanEqualOrderByTripDateAsc(
                transporter.getId(), TripStatus.PLANNED, LocalDate.now())) {
            BigDecimal space = spaceLeft(trip);
            List<LoadPlanner.Load> loads = open.stream()
                    .map(order -> new LoadPlanner.Load(order.getId(), OpenOrder.totalKg(order).doubleValue(),
                            OpenOrder.needsColdChain(order)))
                    .toList();
            LoadPlanner.Plan plan = LoadPlanner.plan(loads, List.of(
                    new LoadPlanner.Truck(trip.getId(), space.doubleValue(), trip.getVehicle().isRefrigerated())));
            List<OpenOrder> fitting = plan.loadsByVehicle().getOrDefault(trip.getId(), List.of()).stream()
                    .map(load -> OpenOrder.from(byId.get(load.orderId())))
                    .toList();
            if (!fitting.isEmpty()) {
                suggestions.add(new TripSuggestion(trip.getId(), trip.getTripDate(), trip.getSlot(),
                        trip.getVehicle().getPlateNo(), trip.getVehicle().isRefrigerated(), space, fitting));
            }
        }
        return suggestions;
    }

    // transporter takes an open order into one of their planned trips
    @Transactional
    public TripResponse takeOrder(Long tripId, Long orderId, String email) {
        User transporter = currentUser(email);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip " + tripId + " not found"));
        if (!trip.getVehicle().getTransporter().getId().equals(transporter.getId())) {
            throw new AccessDeniedException("This is not your trip");
        }
        if (trip.getStatus() != TripStatus.PLANNED) {
            throw new BusinessRuleException("Orders can only be added before the trip starts");
        }
        Order order = orderRepository.findWithDetailsById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + orderId + " not found"));
        if (order.getStatus() != OrderStatus.CONFIRMED || order.getTrip() != null) {
            throw new BusinessRuleException("Order #" + orderId + " is no longer waiting for transport");
        }
        if (requestRepository.existsByOrderIdAndStatus(orderId, DeliveryRequestStatus.PENDING)) {
            throw new BusinessRuleException("The farmer has already asked another transporter for this order");
        }
        if (!fits(trip, OpenOrder.totalKg(order), OpenOrder.needsColdChain(order))) {
            throw new BusinessRuleException("Order #" + orderId + " does not fit in this lorry");
        }
        addToTrip(trip, order);
        notify(order.getFarmer(), transporter.getFullName() + " added order #" + orderId + " to a trip on "
                + trip.getTripDate());
        return TripResponse.from(trip);
    }

    // ---------- Shared rules ----------

    // the transporter's trip for this date and slot, or a new one with their smallest vehicle that fits
    private Trip tripFor(User transporter, LocalDate date, TripSlot slot, Order order) {
        BigDecimal kg = OpenOrder.totalKg(order);
        boolean cold = OpenOrder.needsColdChain(order);
        Optional<Trip> existing = tripRepository.findFirstByVehicleTransporterIdAndTripDateAndSlot(
                transporter.getId(), date, slot);
        if (existing.isPresent()) {
            if (!fits(existing.get(), kg, cold)) {
                throw new BusinessRuleException("Your trip on " + date + " (" + slot.name().toLowerCase()
                        + ") has no room for this order");
            }
            return existing.get();
        }
        Vehicle vehicle = smallestVehicleFor(vehicleRepository.findByTransporterIdOrderByPlateNoAsc(transporter.getId()),
                kg, cold)
                .orElseThrow(() -> new BusinessRuleException("None of your vehicles can carry this order"));
        return tripRepository.save(new Trip(vehicle, date, slot));
    }

    private void addToTrip(Trip trip, Order order) {
        trip.getOrders().add(order);

        // re-order all stops: start at the first order's farm, then always the nearest delivery point
        ProduceListing firstPickup = trip.getOrders().get(0).getItems().get(0).getListing();
        Map<Long, Order> byId = trip.getOrders().stream().collect(Collectors.toMap(Order::getId, Function.identity()));
        RoutePlanner.Route route = RoutePlanner.nearestNeighbour(firstPickup.getPickupLat(), firstPickup.getPickupLng(),
                trip.getOrders().stream()
                        .map(stop -> new RoutePlanner.Stop(stop.getId(), stop.getDeliveryLat(), stop.getDeliveryLng()))
                        .toList());
        int sequence = 1;
        BigDecimal load = BigDecimal.ZERO;
        for (RoutePlanner.Stop stop : route.stops()) {
            Order stopOrder = byId.get(stop.orderId());
            stopOrder.assignToTrip(trip, sequence++);
            load = load.add(OpenOrder.totalKg(stopOrder));
        }
        trip.getOrders().sort(Comparator.comparing(Order::getStopSequence));
        trip.setTotalLoadKg(load);
        trip.setTotalDistanceKm(BigDecimal.valueOf(route.straightLineKm() * roadFactor).setScale(1, RoundingMode.HALF_UP));
        notify(order.getBuyer(), "Your order #" + order.getId() + " will be delivered on " + trip.getTripDate());
    }

    private static boolean fits(Trip trip, BigDecimal kg, boolean cold) {
        return trip.getStatus() == TripStatus.PLANNED
                && (!cold || trip.getVehicle().isRefrigerated())
                && spaceLeft(trip).compareTo(kg) >= 0;
    }

    private static BigDecimal spaceLeft(Trip trip) {
        BigDecimal load = trip.getTotalLoadKg() == null ? BigDecimal.ZERO : trip.getTotalLoadKg();
        return trip.getVehicle().getCapacityKg().subtract(load);
    }

    private static Optional<Vehicle> smallestVehicleFor(List<Vehicle> vehicles, BigDecimal kg, boolean cold) {
        return vehicles.stream()
                .filter(vehicle -> vehicle.getCapacityKg().compareTo(kg) >= 0)
                .filter(vehicle -> !cold || vehicle.isRefrigerated())
                .min(Comparator.comparing(Vehicle::getCapacityKg));
    }

    private Order farmersConfirmedOrder(Long orderId, String email) {
        Order order = orderRepository.findWithDetailsById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + orderId + " not found"));
        if (!order.getFarmer().getId().equals(currentUser(email).getId())) {
            throw new AccessDeniedException("This is not your order");
        }
        if (order.getStatus() != OrderStatus.CONFIRMED || order.getTrip() != null) {
            throw new BusinessRuleException("Only confirmed orders without transport can be booked");
        }
        return order;
    }

    private DeliveryRequest findRequest(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request " + id + " not found"));
    }

    private void notify(User user, String message) {
        notificationRepository.save(new Notification(user, message, "TRIP"));
    }

    private User currentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
