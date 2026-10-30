package com.agritech.optimizer.dto.admin;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Admin form for adding or editing an economic centre.
 *
 * @author Ashmi Hettige
 */
public record CentreRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 80, message = "Name must be at most 80 characters")
        String name,

        @NotBlank(message = "District is required")
        @Size(max = 40, message = "District must be at most 40 characters")
        String district,

        @NotNull(message = "Latitude is required")
        @DecimalMin(value = "5.9", message = "Latitude must be between 5.9 and 9.9")
        @DecimalMax(value = "9.9", message = "Latitude must be between 5.9 and 9.9")
        Double latitude,

        @NotNull(message = "Longitude is required")
        @DecimalMin(value = "79.5", message = "Longitude must be between 79.5 and 81.9")
        @DecimalMax(value = "81.9", message = "Longitude must be between 79.5 and 81.9")
        Double longitude) {
}
