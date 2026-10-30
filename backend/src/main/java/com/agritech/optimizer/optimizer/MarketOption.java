package com.agritech.optimizer.optimizer;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One row of the advisor's answer: what the farmer would earn by selling at this centre.
 * netValue = grossValue − transportCost.
 *
 * @author Ashmi Hettige
 */
public record MarketOption(
        Long centreId,
        String centreName,
        String district,
        LocalDate priceDate,
        BigDecimal pricePerKg,
        BigDecimal sevenDayAvgPrice,
        BigDecimal distanceKm,
        BigDecimal grossValue,
        BigDecimal transportCost,
        BigDecimal netValue,
        BigDecimal netPerKg) {
}
