package com.agritech.optimizer.optimizer;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Scores how fresh a listing is: the share of the crop's shelf life that remains.
 * score = daysLeft / shelfLifeDays, kept between 0 and 1.
 *
 * @author Ashmi Hettige
 */
public final class FreshnessScorer {

    private FreshnessScorer() {
    }

    public static Freshness score(LocalDate expiryDate, int shelfLifeDays, LocalDate today) {
        long daysLeft = Math.max(0, ChronoUnit.DAYS.between(today, expiryDate));
        double score = shelfLifeDays > 0 ? Math.min(1.0, (double) daysLeft / shelfLifeDays) : 0.0;

        String label;
        if (score > 0.5) {
            label = "FRESH";
        } else if (score > 0.2) {
            label = "SELL_SOON";
        } else {
            label = "URGENT";
        }
        return new Freshness(daysLeft, Math.round(score * 100) / 100.0, label);
    }
}