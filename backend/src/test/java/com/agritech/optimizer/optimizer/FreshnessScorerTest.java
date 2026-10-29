package com.agritech.optimizer.optimizer;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Unit tests for the freshness rule: score = daysLeft / shelfLife,
 * FRESH above 0.5, SELL_SOON above 0.2, otherwise URGENT.
 *
 * @author Ashmi Hettige
 */
class FreshnessScorerTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 28);
    private static final int CARROT_SHELF_LIFE = 14;

    @Test
    void moreThanHalfTheShelfLifeLeftIsFresh() {
        Freshness result = FreshnessScorer.score(TODAY.plusDays(10), CARROT_SHELF_LIFE, TODAY);

        assertEquals(10, result.daysLeft());
        assertEquals(0.71, result.score());
        assertEquals("FRESH", result.label());
    }

    @Test
    void exactlyHalfLeftIsSellSoonBecauseFreshNeedsMoreThanHalf() {
        Freshness result = FreshnessScorer.score(TODAY.plusDays(7), CARROT_SHELF_LIFE, TODAY);

        assertEquals(0.5, result.score());
        assertEquals("SELL_SOON", result.label());
    }

    @Test
    void lessThanAFifthLeftIsUrgent() {
        Freshness result = FreshnessScorer.score(TODAY.plusDays(2), CARROT_SHELF_LIFE, TODAY);

        assertEquals(0.14, result.score());
        assertEquals("URGENT", result.label());
    }

    @Test
    void pastExpiryCountsAsZeroDaysLeft() {
        Freshness result = FreshnessScorer.score(TODAY.minusDays(3), CARROT_SHELF_LIFE, TODAY);

        assertEquals(0, result.daysLeft());
        assertEquals(0.0, result.score());
        assertEquals("URGENT", result.label());
    }
}
