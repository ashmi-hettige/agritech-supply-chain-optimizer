package com.agritech.optimizer.dto.advisor;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * What the farmer asks the advisor: which crop, how many kg, and (optionally) where the produce is.
 * Without a location, the farm's location from the farmer's profile is used.
 *
 * @author Ashmi Hettige
 */
public record AdvisorQuery(

        @NotNull(message = "Choose a crop")
        Long cropId,

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "1.0", message = "Quantity must be at least 1 kg")
        @DecimalMax(value = "100000", message = "Quantity must be at most 100,000 kg")
        BigDecimal quantityKg,

        @DecimalMin(value = "5.9", message = "Location must be in Sri Lanka")
        @DecimalMax(value = "9.9", message = "Location must be in Sri Lanka")
        Double lat,

        @DecimalMin(value = "79.5", message = "Location must be in Sri Lanka")
        @DecimalMax(value = "81.9", message = "Location must be in Sri Lanka")
        Double lng) {
}
