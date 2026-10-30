package com.agritech.optimizer.dto.trip;

import com.agritech.optimizer.entity.TripStatus;
import jakarta.validation.constraints.NotNull;

/** Transporter starts or completes a trip. @author Ashmi Hettige */
public record TripStatusRequest(@NotNull(message = "Status is required") TripStatus status) {
}
