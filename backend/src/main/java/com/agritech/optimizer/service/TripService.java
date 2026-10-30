package com.agritech.optimizer.service;

import com.agritech.optimizer.dto.trip.PlanResult;
import com.agritech.optimizer.dto.trip.TripResponse;
import com.agritech.optimizer.dto.trip.VehicleRequest;
import com.agritech.optimizer.dto.trip.VehicleResponse;
import com.agritech.optimizer.entity.Notification;
import com.agritech.optimizer.entity.Order;
import com.agritech.optimizer.entity.OrderItem;
import com.agritech.optimizer.entity.OrderStatus;
import com.agritech.optimizer.entity.ProduceListing;
import com.agritech.optimizer.entity.Trip;
import com.agritech.optimizer.entity.TripStatus;
import com.agritech.optimizer.entity.User;
import com.agritech.optimizer.entity.Vehicle;
import com.agritech.optimizer.exception.BusinessRuleException;
import com.agritech.optimizer.exception.ResourceNotFoundException;
import com.agritech.optimizer.optimizer.LoadPlanner;
import com.agritech.optimizer.optimizer.RoutePlanner;
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
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Vehicles, trip planning and trip progress.
 *
 * <pre>
 * Admin plans a day:   CONFIRMED orders ──First-Fit Decreasing──▶ vehicles ──nearest neighbour──▶ stop order
 * Transporter drives:  PLANNED ──start──▶ IN_PROGRESS (orders IN_TRANSIT) ──finish──▶ COMPLETED (orders DELIVERED)
 * </pre>
 *
 * @author Ashmi Hettige
 */
@Service
@Transactional(readOnly = true)
public class TripService {

    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final double roadFactor;

    public TripService(VehicleRepository vehicleRepository,
                       TripRepository tripRepository,
                       OrderRepository orderRepository,
                       UserRepository userRepository,
                       NotificationRepository notificationRepository,
                       @Value("${app.transport.road-factor}") double roadFactor) {
        this.vehicleRepository = vehicleRepository;
        this.tripRepository = tripRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.roadFactor = roadFactor;
    }

    // ---------- Transporter: vehicles ----------

    public List<VehicleResponse> myVehicles(String email) {
        User transporter = currentUser(email);
        return vehicleRepository.findByTransporterIdOrderByPlateNoAsc(transporter.getId()).stream()
                .map(VehicleResponse::from)
                .toList();
    }

    @Transactional
    public VehicleResponse addVehicle(VehicleRequest request, String email) {
        User transporter = currentUser(email);
        String plate = request.plateNo().trim().toUpperCase();
        if (vehicleRepository.existsByPlateNo(plate)) {
            throw new BusinessRuleException("A vehicle with plate " + plate + " is already registered");
        }
        Vehicle vehicle = new Vehicle(transporter, plate, request.type().trim(), request.capacityKg(),
                request.refrigerated());
        return VehicleResponse.from(vehicleRepository.save(vehicle));
    }

    @Transactional
    public void deleteVehicle(Long id, String email) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle " + id + " not found"));
        if (!vehicle.getTransporter().getId().equals(currentUser(email).getId())) {
            throw new AccessDeniedException("You can only remove your own vehicles");
        }
        if (tripRepository.existsByVehicleId(id)) {
            throw new BusinessRuleException(vehicle.getPlateNo() + " has trips, so it cannot be removed");
        }
        vehicleRepository.delete(vehicle);
    }

    // ---------- Transporter: trips ----------

    public List<TripResponse> myTrips(String email) {
        User transporter = currentUser(email);
        return tripRepository.findByVehicleTransporterIdOrderByTripDateDesc(transporter.getId()).stream()
                .map(TripResponse::from)
                .toList();
    }

    @Transactional
    public TripResponse changeTripStatus(Long id, TripStatus next, String email) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip " + id + " not found"));
        if (!trip.getVehicle().getTransporter().getId().equals(currentUser(email).getId())) {
            throw new AccessDeniedException("This is not your trip");
        }

        TripStatus now = trip.getStatus();
        if (now == TripStatus.PLANNED && next == TripStatus.IN_PROGRESS) {
            for (Order order : trip.getOrders()) {
                order.setStatus(OrderStatus.IN_TRANSIT);
                notify(order.getBuyer(), "Your order #" + order.getId() + " is on the way");
            }
        } else if (now == TripStatus.IN_PROGRESS && next == TripStatus.COMPLETED) {
            for (Order order : trip.getOrders()) {
                order.setStatus(OrderStatus.DELIVERED);
                notify(order.getBuyer(), "Your order #" + order.getId() + " was delivered");
                notify(order.getFarmer(), "Order #" + order.getId() + " was delivered");
            }
        } else {
            throw new BusinessRuleException("A " + now.name().toLowerCase().replace('_', ' ')
                    + " trip cannot be changed to " + next.name().toLowerCase().replace('_', ' '));
        }
        trip.setStatus(next);
        return TripResponse.from(trip);
    }

    // ---------- Admin: planning ----------

    public List<TripResponse> tripsOn(LocalDate date) {
        return tripRepository.findByTripDateOrderByIdAsc(date).stream().map(TripResponse::from).toList();
    }

    public long ordersWaitingForTrip() {
        return orderRepository.findByStatusAndTripIsNull(OrderStatus.CONFIRMED).size();
    }

    @Transactional
    public PlanResult plan(LocalDate date) {
        List<Order> waiting = orderRepository.findByStatusAndTripIsNull(OrderStatus.CONFIRMED);
        if (waiting.isEmpty()) {
            return new PlanResult(List.of(), List.of(), "No confirmed orders are waiting for a trip.");
        }

        // vehicles of active transporters that are not already out on an unfinished trip that day
        List<Vehicle> vehicles = vehicleRepository.findByTransporterEnabledTrue().stream()
                .filter(vehicle -> !tripRepository.existsByVehicleIdAndTripDateAndStatusNot(
                        vehicle.getId(), date, TripStatus.COMPLETED))
                .toList();
        if (vehicles.isEmpty()) {
            throw new BusinessRuleException("No free vehicles on " + date + ". Transporters need to add vehicles first.");
        }

        // 1. load: First-Fit Decreasing by weight, cold-chain orders only on refrigerated vehicles
        Map<Long, Order> ordersById = waiting.stream().collect(Collectors.toMap(Order::getId, Function.identity()));
        List<LoadPlanner.Load> loads = waiting.stream()
                .map(order -> new LoadPlanner.Load(order.getId(), totalKg(order).doubleValue(), needsColdChain(order)))
                .toList();
        List<LoadPlanner.Truck> trucks = vehicles.stream()
                .map(vehicle -> new LoadPlanner.Truck(vehicle.getId(), vehicle.getCapacityKg().doubleValue(),
                        vehicle.isRefrigerated()))
                .toList();
        LoadPlanner.Plan plan = LoadPlanner.plan(loads, trucks);

        Map<Long, Vehicle> vehiclesById = vehicles.stream()
                .collect(Collectors.toMap(Vehicle::getId, Function.identity()));
        List<TripResponse> created = new ArrayList<>();

        for (Map.Entry<Long, List<LoadPlanner.Load>> entry : plan.loadsByVehicle().entrySet()) {
            Vehicle vehicle = vehiclesById.get(entry.getKey());
            List<Order> tripOrders = entry.getValue().stream().map(load -> ordersById.get(load.orderId())).toList();

            // 2. route: start at the farm of the heaviest order, then nearest delivery point each time
            ProduceListing firstPickup = tripOrders.get(0).getItems().get(0).getListing();
            List<RoutePlanner.Stop> stops = tripOrders.stream()
                    .map(order -> new RoutePlanner.Stop(order.getId(), order.getDeliveryLat(), order.getDeliveryLng()))
                    .toList();
            RoutePlanner.Route route = RoutePlanner.nearestNeighbour(
                    firstPickup.getPickupLat(), firstPickup.getPickupLng(), stops);

            Trip trip = tripRepository.save(new Trip(vehicle, date));
            BigDecimal load = BigDecimal.ZERO;
            int sequence = 1;
            for (RoutePlanner.Stop stop : route.stops()) {
                Order order = ordersById.get(stop.orderId());
                order.assignToTrip(trip, sequence++);
                trip.getOrders().add(order);
                load = load.add(totalKg(order));
                notify(order.getBuyer(), "Your order #" + order.getId() + " is planned for delivery on " + date);
            }
            trip.setTotalLoadKg(load);
            trip.setTotalDistanceKm(BigDecimal.valueOf(route.straightLineKm() * roadFactor)
                    .setScale(1, RoundingMode.HALF_UP));
            notify(vehicle.getTransporter(), "New trip on " + date + " with " + tripOrders.size() + " stops");
            created.add(TripResponse.from(trip));
        }

        List<Long> unassigned = plan.unassigned().stream().map(LoadPlanner.Load::orderId).toList();
        String message = created.size() + " trip(s) planned"
                + (unassigned.isEmpty() ? "." : ". " + unassigned.size() + " order(s) did not fit on any free vehicle.");
        return new PlanResult(created, unassigned, message);
    }

    private static BigDecimal totalKg(Order order) {
        return order.getItems().stream().map(OrderItem::getQuantityKg).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static boolean needsColdChain(Order order) {
        return order.getItems().stream().anyMatch(item -> item.getListing().getCrop().isNeedsColdChain());
    }

    private void notify(User user, String message) {
        notificationRepository.save(new Notification(user, message, "TRIP"));
    }

    private User currentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
