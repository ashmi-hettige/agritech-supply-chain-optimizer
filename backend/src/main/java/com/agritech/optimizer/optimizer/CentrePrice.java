package com.agritech.optimizer.optimizer;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Input to the best-market calculation: one centre, where it is, and today's price there.
 *
 * @author Ashmi Hettige
 */
public record CentrePrice(
        Long centreId,
        String centreName,
        String district,
        double latitude,
        double longitude,
        LocalDate priceDate,
        BigDecimal pricePerKg,
        BigDecimal sevenDayAvgPrice) {
}
