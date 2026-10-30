package com.agritech.optimizer.dto.admin;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One day's price of a crop at a centre, entered by the admin. Saving the same crop, centre
 * and day again updates that row (the table has a unique key on those three columns).
 *
 * @author Ashmi Hettige
 */
public record PriceRequest(

        @NotNull(message = "Choose a crop")
        Long cropId,

        @NotNull(message = "Choose a centre")
        Long centreId,

        @NotNull(message = "Date is required")
        @PastOrPresent(message = "Date cannot be in the future")
        LocalDate priceDate,

        @NotNull(message = "Lowest price is required")
        @DecimalMin(value = "1.00", message = "Prices must be at least Rs 1")
        @DecimalMax(value = "10000", message = "Prices must be at most Rs 10,000")
        @Digits(integer = 8, fraction = 2, message = "At most 2 decimal places")
        BigDecimal minPrice,

        @NotNull(message = "Average price is required")
        @DecimalMin(value = "1.00", message = "Prices must be at least Rs 1")
        @DecimalMax(value = "10000", message = "Prices must be at most Rs 10,000")
        @Digits(integer = 8, fraction = 2, message = "At most 2 decimal places")
        BigDecimal avgPrice,

        @NotNull(message = "Highest price is required")
        @DecimalMin(value = "1.00", message = "Prices must be at least Rs 1")
        @DecimalMax(value = "10000", message = "Prices must be at most Rs 10,000")
        @Digits(integer = 8, fraction = 2, message = "At most 2 decimal places")
        BigDecimal maxPrice) {

    // cross-field rule: lowest <= average <= highest (missing values are reported by @NotNull)
    @AssertTrue(message = "Prices must go lowest ≤ average ≤ highest")
    public boolean isPriceOrderValid() {
        if (minPrice == null || avgPrice == null || maxPrice == null) {
            return true;
        }
        return minPrice.compareTo(avgPrice) <= 0 && avgPrice.compareTo(maxPrice) <= 0;
    }
}
