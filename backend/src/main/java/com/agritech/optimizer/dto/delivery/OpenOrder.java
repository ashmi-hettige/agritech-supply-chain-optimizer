package com.agritech.optimizer.dto.delivery;

import com.agritech.optimizer.entity.Order;
import com.agritech.optimizer.entity.OrderItem;

import java.math.BigDecimal;

/**
 * A confirmed order as a transporter sees it: where to collect, where to deliver, how heavy.
 *
 * @author Ashmi Hettige
 */
public record OpenOrder(
        Long orderId,
        String farmerName,
        String farmerPhone,
        String pickupDistrict,
        String deliveryAddress,
        BigDecimal kg,
        String items,
        boolean needsColdChain) {

    public static BigDecimal totalKg(Order order) {
        return order.getItems().stream().map(OrderItem::getQuantityKg).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public static boolean needsColdChain(Order order) {
        return order.getItems().stream().anyMatch(item -> item.getListing().getCrop().isNeedsColdChain());
    }

    public static OpenOrder from(Order order) {
        String items = String.join(", ", order.getItems().stream()
                .map(item -> item.getQuantityKg().stripTrailingZeros().toPlainString() + " kg "
                        + item.getListing().getCrop().getName())
                .toList());
        return new OpenOrder(order.getId(), order.getFarmer().getFullName(), order.getFarmer().getPhone(),
                order.getItems().get(0).getListing().getDistrict(), order.getDeliveryAddress(),
                totalKg(order), items, needsColdChain(order));
    }
}
