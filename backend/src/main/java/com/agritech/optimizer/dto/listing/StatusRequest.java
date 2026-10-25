package com.agritech.optimizer.dto.listing;

import com.agritech.optimizer.entity.ListingStatus;
import jakarta.validation.constraints.NotNull;

/** Used to pause or resume a listing. @author Ashmi Hettige */
public record StatusRequest(@NotNull(message = "Status is required") ListingStatus status) {
}