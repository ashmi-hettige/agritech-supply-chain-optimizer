package com.agritech.optimizer.dto.delivery;

import com.agritech.optimizer.entity.TripSlot;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** Farmer asks a transporter to deliver an order. @author Ashmi Hettige */
public record DeliveryRequestCreate(

        @NotNull(message = "Order is required")
        Long orderId,

        @NotNull(message = "Choose a transporter")
        Long transporterId,

        @NotNull(message = "Delivery date is required")
        @FutureOrPresent(message = "Delivery date cannot be in the past")
        LocalDate tripDate,

        @NotNull(message = "Choose morning or afternoon")
        TripSlot slot) {
}
