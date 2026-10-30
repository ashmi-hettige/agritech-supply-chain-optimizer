package com.agritech.optimizer.service;

import com.agritech.optimizer.dto.trip.TripResponse;
import com.agritech.optimizer.dto.trip.VehicleRequest;
import com.agritech.optimizer.dto.trip.VehicleResponse;
import com.agritech.optimizer.entity.Notification;
import com.agritech.optimizer.entity.Order;
import com.agritech.optimizer.entity.OrderStatus;
import com.agritech.optimizer.entity.Trip;
import com.agritech.optimizer.entity.TripStatus;
import com.agritech.optimizer.entity.User;
import com.agritech.optimizer.entity.Vehicle;
import com.agritech.optimizer.exception.BusinessRuleException;
import com.agritech.optimizer.exception.ResourceNotFoundException;
import com.agritech.optimizer.repository.NotificationRepository;
import com.agritech.optimizer.repository.TripRepository;
import com.agritech.optimizer.repository.UserRepository;
import com.agritech.optimizer.repository.VehicleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * A transporter's vehicles and the progress of their trips. Trips are built in DeliveryService.
 *
 * <pre>
 * PLANNED ──start──▶ IN_PROGRESS (orders IN_TRANSIT) ──finish──▶ COMPLETED (orders DELIVERED)
 * </pre>
 *
 * @author Ashmi Hettige
 */
@Service
@Transactional(readOnly = true)
public class TripService {

    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public TripService(VehicleRepository vehicleRepository,
                       TripRepository tripRepository,
                       UserRepository userRepository,
                       NotificationRepository notificationRepository) {
        this.vehicleRepository = vehicleRepository;
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
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

    private void notify(User user, String message) {
        notificationRepository.save(new Notification(user, message, "TRIP"));
    }

    private User currentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
