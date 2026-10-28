package com.agritech.optimizer.dto.admin;

import jakarta.validation.constraints.NotNull;

/** Turns a user account on or off. @author Ashmi Hettige */
public record EnabledRequest(@NotNull(message = "Enabled is required") Boolean enabled) {
}
