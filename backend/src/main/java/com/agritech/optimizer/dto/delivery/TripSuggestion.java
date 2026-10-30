package com.agritech.optimizer.dto.delivery;

import com.agritech.optimizer.entity.TripSlot;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Open orders that would fit in the free space of one of the transporter's trips. @author Ashmi Hettige */
public record TripSuggestion(
        Long tripId,
        LocalDate tripDate,
        TripSlot slot,
        String plateNo,
        boolean refrigerated,
        BigDecimal spaceLeftKg,
        List<OpenOrder> orders) {
}
