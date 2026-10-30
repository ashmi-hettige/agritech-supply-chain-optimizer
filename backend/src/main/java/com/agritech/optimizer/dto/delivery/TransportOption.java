package com.agritech.optimizer.dto.delivery;

import java.math.BigDecimal;

/**
 * A transporter who can take an order on the chosen date and slot.
 * joinsTrip = true means the order would share a lorry that already has other stops.
 *
 * @author Ashmi Hettige
 */
public record TransportOption(
        Long transporterId,
        String transporterName,
        String district,
        String phone,
        String plateNo,
        String vehicleType,
        boolean refrigerated,
        BigDecimal spaceLeftKg,
        boolean joinsTrip,
        int stopsAlready) {
}
