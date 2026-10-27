package com.agritech.optimizer.dto.order;

import com.agritech.optimizer.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

/** Used to confirm, reject, cancel or deliver an order. @author Ashmi Hettige */
public record OrderStatusRequest(@NotNull(message = "Status is required") OrderStatus status) {
}