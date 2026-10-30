package com.agritech.optimizer.dto.trip;

import com.agritech.optimizer.entity.Order;
import com.agritech.optimizer.entity.OrderItem;
import com.agritech.optimizer.entity.OrderStatus;
import com.agritech.optimizer.entity.Trip;
import com.agritech.optimizer.entity.TripStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * A planned trip with its stops in driving order.
 *
 * @author Ashmi Hettige
 */
public record TripResponse(
        Long id,
        LocalDate tripDate,
        TripStatus status,
        String plateNo,
        String vehicleType,
        BigDecimal capacityKg,
        boolean refrigerated,
        String transporterName,
        BigDecimal totalLoadKg,
        BigDecimal totalDistanceKm,
        List<StopResponse> stops) {

    public record StopResponse(
            int sequence,
            Long orderId,
            OrderStatus orderStatus,
            String pickupFrom,
            String buyerName,
            String buyerPhone,
            String deliveryAddress,
            double deliveryLat,
            double deliveryLng,
            BigDecimal kg,
            String items) {

        static StopResponse from(Order order) {
            BigDecimal kg = order.getItems().stream()
                    .map(OrderItem::getQuantityKg)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            // e.g. "50 kg Carrot, 20 kg Leeks"
            String items = String.join(", ", order.getItems().stream()
                    .map(item -> item.getQuantityKg().stripTrailingZeros().toPlainString() + " kg "
                            + item.getListing().getCrop().getName())
                    .toList());
            return new StopResponse(order.getStopSequence() == null ? 0 : order.getStopSequence(),
                    order.getId(), order.getStatus(), order.getFarmer().getFullName() + ", "
                    + order.getItems().get(0).getListing().getDistrict(),
                    order.getBuyer().getFullName(), order.getBuyer().getPhone(), order.getDeliveryAddress(),
                    order.getDeliveryLat(), order.getDeliveryLng(), kg, items);
        }
    }

    public static TripResponse from(Trip trip) {
        return new TripResponse(trip.getId(), trip.getTripDate(), trip.getStatus(),
                trip.getVehicle().getPlateNo(), trip.getVehicle().getType(), trip.getVehicle().getCapacityKg(),
                trip.getVehicle().isRefrigerated(), trip.getVehicle().getTransporter().getFullName(),
                trip.getTotalLoadKg(), trip.getTotalDistanceKm(),
                trip.getOrders().stream().map(StopResponse::from).toList());
    }
}
