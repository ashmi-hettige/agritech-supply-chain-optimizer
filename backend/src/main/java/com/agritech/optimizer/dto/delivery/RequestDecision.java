package com.agritech.optimizer.dto.delivery;

import jakarta.validation.constraints.NotNull;

/** Transporter's answer to a delivery request. @author Ashmi Hettige */
public record RequestDecision(@NotNull(message = "Accept or decline") Boolean accept) {
}
