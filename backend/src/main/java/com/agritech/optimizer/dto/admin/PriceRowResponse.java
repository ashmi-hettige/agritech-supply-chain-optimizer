package com.agritech.optimizer.dto.admin;

import com.agritech.optimizer.entity.MarketPrice;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One saved price row, as shown on the admin Daily prices page. @author Ashmi Hettige */
public record PriceRowResponse(
        Long id,
        Long cropId,
        String cropName,
        Long centreId,
        String centreName,
        LocalDate priceDate,
        BigDecimal minPrice,
        BigDecimal avgPrice,
        BigDecimal maxPrice) {

    public static PriceRowResponse from(MarketPrice price) {
        return new PriceRowResponse(price.getId(), price.getCrop().getId(), price.getCrop().getName(),
                price.getCentre().getId(), price.getCentre().getName(), price.getPriceDate(),
                price.getMinPrice(), price.getAvgPrice(), price.getMaxPrice());
    }
}
