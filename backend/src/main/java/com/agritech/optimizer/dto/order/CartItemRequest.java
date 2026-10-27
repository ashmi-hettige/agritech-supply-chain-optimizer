package com.agritech.optimizer.dto.order;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * One line of the buyer's cart: how many kilos of which listing.
 *
 * @author Ashmi Hettige
 */
public record CartItemRequest(

        @NotNull(message = "Listing is required")
        Long listingId,

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "1.0", message = "Order at least 1 kg")
        @DecimalMax(value = "100000", message = "Order at most 100,000 kg")
        @Digits(integer = 8, fraction = 2, message = "Quantity can have at most 2 decimal places")
        BigDecimal quantityKg) {
}