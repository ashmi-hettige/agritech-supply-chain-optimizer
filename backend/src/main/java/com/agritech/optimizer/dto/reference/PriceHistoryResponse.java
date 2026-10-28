package com.agritech.optimizer.dto.reference;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Daily prices of one crop at one centre, oldest first, for the price chart.
 *
 * @author Ashmi Hettige
 */
public record PriceHistoryResponse(Long centreId, String centreName, List<DayPrice> days) {

    public record DayPrice(LocalDate date, BigDecimal minPrice, BigDecimal avgPrice, BigDecimal maxPrice) {
    }
}
