package com.agritech.optimizer.dto.reference;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Latest price of one crop at one centre, plus its 7-day average. @author Ashmi Hettige */
public record CentrePriceResponse(
        Long centreId,
        String centreName,
        String district,
        LocalDate latestDate,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        BigDecimal latestAvgPrice,
        BigDecimal sevenDayAvgPrice) {
}