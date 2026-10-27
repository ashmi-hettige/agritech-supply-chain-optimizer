package com.agritech.optimizer.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Everything the cart page sends when the buyer presses "Place order".
 *
 * @author Ashmi Hettige
 */
public record CheckoutRequest(

        // @Valid checks every item in the list as well
        @NotEmpty(message = "Your cart is empty")
        @Size(max = 20, message = "A cart can have at most 20 items")
        List<@Valid CartItemRequest> items,

        @NotBlank(message = "Delivery address is required")
        @Size(max = 255, message = "Delivery address must be at most 255 characters")
        String deliveryAddress,

        @NotNull(message = "Delivery location is required")
        @DecimalMin(value = "5.9", message = "Delivery location must be in Sri Lanka")
        @DecimalMax(value = "9.9", message = "Delivery location must be in Sri Lanka")
        Double deliveryLat,

        @NotNull(message = "Delivery location is required")
        @DecimalMin(value = "79.5", message = "Delivery location must be in Sri Lanka")
        @DecimalMax(value = "81.9", message = "Delivery location must be in Sri Lanka")
        Double deliveryLng) {
}