package com.agritech.optimizer.dto.delivery;

import com.agritech.optimizer.entity.DeliveryRequest;
import com.agritech.optimizer.entity.DeliveryRequestStatus;
import com.agritech.optimizer.entity.TripSlot;

import java.time.LocalDate;

/**
 * A delivery request. The farmer's page uses the transporter fields; the transporter's page uses
 * the order (null on the farmer's page, where the order is already on screen).
 *
 * @author Ashmi Hettige
 */
public record DeliveryRequestResponse(
        Long id,
        Long orderId,
        Long transporterId,
        String transporterName,
        String transporterPhone,
        LocalDate tripDate,
        TripSlot slot,
        DeliveryRequestStatus status,
        OpenOrder order) {

    public static DeliveryRequestResponse forFarmer(DeliveryRequest request) {
        return new DeliveryRequestResponse(request.getId(), request.getOrder().getId(),
                request.getTransporter().getId(), request.getTransporter().getFullName(),
                request.getTransporter().getPhone(), request.getTripDate(), request.getSlot(),
                request.getStatus(), null);
    }

    public static DeliveryRequestResponse forTransporter(DeliveryRequest request) {
        return new DeliveryRequestResponse(request.getId(), request.getOrder().getId(),
                request.getTransporter().getId(), request.getTransporter().getFullName(),
                request.getTransporter().getPhone(), request.getTripDate(), request.getSlot(),
                request.getStatus(), OpenOrder.from(request.getOrder()));
    }
}
