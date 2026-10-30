package com.agritech.optimizer.dto.advisor;

import com.agritech.optimizer.optimizer.MarketOption;

import java.math.BigDecimal;
import java.util.List;

/**
 * The advisor's answer: every centre ranked by net value, best first, plus the cost settings used.
 * extraVsNearest = how much more the best centre pays than simply going to the nearest one.
 *
 * @author Ashmi Hettige
 */
public record AdvisorResponse(
        Long cropId,
        String cropName,
        BigDecimal quantityKg,
        double fromLat,
        double fromLng,
        BigDecimal ratePerKgKm,
        BigDecimal fixedCost,
        double roadFactor,
        String nearestCentreName,
        BigDecimal extraVsNearest,
        List<MarketOption> options) {
}
