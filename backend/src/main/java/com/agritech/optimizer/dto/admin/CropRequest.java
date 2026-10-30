package com.agritech.optimizer.dto.admin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Admin form for adding or editing a crop.
 *
 * @author Ashmi Hettige
 */
public record CropRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 60, message = "Name must be at most 60 characters")
        String name,

        @NotBlank(message = "Category is required")
        @Size(max = 30, message = "Category must be at most 30 characters")
        String category,

        @NotNull(message = "Shelf life is required")
        @Min(value = 1, message = "Shelf life must be at least 1 day")
        @Max(value = 365, message = "Shelf life must be at most 365 days")
        Integer shelfLifeDays,

        boolean needsColdChain,

        // optional; a picture from the app's /images folder, e.g. /images/carrot.jpg
        @Size(max = 255, message = "Image path must be at most 255 characters")
        @Pattern(regexp = "^$|^/images/[\\w-]+\\.(jpg|jpeg|png|webp)$",
                message = "Use a picture path like /images/carrot.jpg")
        String imageUrl) {
}
