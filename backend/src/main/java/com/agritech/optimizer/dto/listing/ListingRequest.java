package com.agritech.optimizer.dto.listing;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Data from the add and edit listing forms.
 *
 * @author Ashmi Hettige
 */
public record ListingRequest(

        @NotNull(message = "Choose a crop")
        Long cropId,

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "1.0", message = "Quantity must be at least 1 kg")
        @DecimalMax(value = "100000", message = "Quantity must be at most 100,000 kg")
        @Digits(integer = 8, fraction = 2, message = "Quantity can have at most 2 decimal places")
        BigDecimal quantityKg,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "1.00", message = "Price must be at least Rs 1 per kg")
        @DecimalMax(value = "10000", message = "Price must be at most Rs 10,000 per kg")
        @Digits(integer = 8, fraction = 2, message = "Price can have at most 2 decimal places")
        BigDecimal pricePerKg,

        @NotNull(message = "Harvest date is required")
        @PastOrPresent(message = "Harvest date cannot be in the future")
        LocalDate harvestDate,

        @NotBlank(message = "Grade is required")
        @Pattern(regexp = "^[ABC]$", message = "Grade must be A, B or C")
        String grade,

        @NotBlank(message = "District is required")
        @Size(max = 40, message = "District must be at most 40 characters")
        String district,

        @NotNull(message = "Pickup location is required")
        @DecimalMin(value = "5.9", message = "Pickup location must be in Sri Lanka")
        @DecimalMax(value = "9.9", message = "Pickup location must be in Sri Lanka")
        Double pickupLat,

        @NotNull(message = "Pickup location is required")
        @DecimalMin(value = "79.5", message = "Pickup location must be in Sri Lanka")
        @DecimalMax(value = "81.9", message = "Pickup location must be in Sri Lanka")
        Double pickupLng) {
}