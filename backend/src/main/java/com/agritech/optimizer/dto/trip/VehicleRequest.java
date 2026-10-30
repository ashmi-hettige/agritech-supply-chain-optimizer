package com.agritech.optimizer.dto.trip;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Transporter's form for adding a vehicle.
 *
 * @author Ashmi Hettige
 */
public record VehicleRequest(

        // Sri Lankan plates, e.g. "WP LB-1234", "CP 45-6789" or "LB-1234"
        @NotBlank(message = "Number plate is required")
        @Pattern(regexp = "^([A-Z]{2} )?[A-Z0-9]{1,3}-\\d{4}$",
                message = "Use a plate like WP LB-1234 or 45-6789")
        String plateNo,

        @NotBlank(message = "Vehicle type is required")
        @Size(max = 30, message = "Type must be at most 30 characters")
        String type,

        @NotNull(message = "Capacity is required")
        @DecimalMin(value = "100", message = "Capacity must be at least 100 kg")
        @DecimalMax(value = "20000", message = "Capacity must be at most 20,000 kg")
        BigDecimal capacityKg,

        boolean refrigerated) {
}
