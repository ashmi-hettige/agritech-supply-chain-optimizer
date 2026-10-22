package com.agritech.optimizer.dto.auth;

import com.agritech.optimizer.entity.Role;
import jakarta.validation.constraints.*;

/**
 * Data sent by the sign-up form. Farmers must also give their farm details.
 *
 * @author Ashmi Hettige
 */
public record RegisterRequest(

        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must be at most 100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 120, message = "Email must be at most 120 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 64, message = "Password must be 8 to 64 characters")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                 message = "Password must contain at least one letter and one number")
        String password,

        @Pattern(regexp = "^0\\d{9}$", message = "Phone must be 10 digits starting with 0")
        String phone,

        @NotNull(message = "Choose a role")
        Role role,

        @Size(max = 40, message = "District must be at most 40 characters")
        String district,

        @Size(max = 100, message = "Farm name must be at most 100 characters")
        String farmName,

        // Sri Lanka lies roughly between latitude 5.9-9.9 and longitude 79.5-81.9
        @DecimalMin(value = "5.9", message = "Farm location must be in Sri Lanka")
        @DecimalMax(value = "9.9", message = "Farm location must be in Sri Lanka")
        Double farmLatitude,

        @DecimalMin(value = "79.5", message = "Farm location must be in Sri Lanka")
        @DecimalMax(value = "81.9", message = "Farm location must be in Sri Lanka")
        Double farmLongitude) {

    // cross-field rule: checked by Bean Validation together with the annotations above
    @AssertTrue(message = "Farmers must give a farm name and farm location")
    public boolean isFarmDetailsValid() {
        return role != Role.FARMER
                || (farmName != null && !farmName.isBlank() && farmLatitude != null && farmLongitude != null);
    }

    @AssertTrue(message = "Admin accounts cannot be created by sign-up")
    public boolean isRoleAllowed() {
        return role != Role.ADMIN;
    }
}