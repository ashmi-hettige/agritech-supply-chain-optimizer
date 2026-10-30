package com.agritech.optimizer.dto.trip;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** The day the admin is planning trips for. @author Ashmi Hettige */
public record PlanRequest(
        @NotNull(message = "Date is required")
        @FutureOrPresent(message = "Trips can only be planned for today or later")
        LocalDate tripDate) {
}
