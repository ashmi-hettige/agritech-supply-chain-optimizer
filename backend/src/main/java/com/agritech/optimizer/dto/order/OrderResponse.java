package com.agritech.optimizer.dto.order;

import com.agritech.optimizer.entity.Order;
import com.agritech.optimizer.entity.OrderItem;
import com.agritech.optimizer.entity.OrderStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

/**
 * An order with its items, the buyer and the farmer, as sent to the React app.
 *
 * @author Ashmi Hettige
 */
public record OrderResponse(
        Long id,
        OrderStatus status,
        Long buyerId,
        String buyerName,
        String buyerPhone,
        Long farmerId,
        String farmerName,
        String farmerPhone,
        String farmName,
        BigDecimal totalKg,
        BigDecimal totalAmount,
        String deliveryAddress,
        double deliveryLat,
        double deliveryLng,
        LocalDateTime createdAt,
        List<OrderItemResponse> items) {

    public static OrderResponse from(Order order, String farmName) {
        BigDecimal totalKg = order.getItems().stream()
                .map(OrderItem::getQuantityKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getBuyer().getId(),
                order.getBuyer().getFullName(),
                order.getBuyer().getPhone(),
                order.getFarmer().getId(),
                order.getFarmer().getFullName(),
                order.getFarmer().getPhone(),
                farmName,
                totalKg,
                order.getTotalAmount().setScale(2, RoundingMode.HALF_UP),
                order.getDeliveryAddress(),
                order.getDeliveryLat(),
                order.getDeliveryLng(),
                order.getCreatedAt(),
                order.getItems().stream().map(OrderItemResponse::from).toList());
    }
}