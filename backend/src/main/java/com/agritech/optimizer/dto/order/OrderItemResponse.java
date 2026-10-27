package com.agritech.optimizer.dto.order;

import com.agritech.optimizer.entity.OrderItem;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * One line of an order as shown in My orders and Incoming orders.
 *
 * @author Ashmi Hettige
 */
public record OrderItemResponse(
        Long listingId,
        String cropName,
        String cropImageUrl,
        String grade,
        BigDecimal quantityKg,
        BigDecimal unitPrice,
        BigDecimal lineTotal) {

    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getListing().getId(),
                item.getListing().getCrop().getName(),
                item.getListing().getCrop().getImageUrl(),
                item.getListing().getGrade(),
                item.getQuantityKg(),
                item.getUnitPrice(),
                item.getLineTotal().setScale(2, RoundingMode.HALF_UP));
    }
}