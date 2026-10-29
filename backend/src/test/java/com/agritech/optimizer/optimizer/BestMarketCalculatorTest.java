package com.agritech.optimizer.optimizer;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Worked example for the best-market rule, with the same settings as application.properties:
 * transport = 500 + 0.05 × kg × road km, road km = straight-line km × 1.3.
 *
 * <pre>
 * Farm at (7.47, 80.62), 100 kg
 * Dambulla: 45.08 km × 1.3 = 58.6 km  → transport 500 + 0.05 × 100 × 58.6  =   793.00
 *           gross 200 × 100 = 20,000  → net 19,207.00
 * Meegoda:  94.49 km × 1.3 = 122.8 km → transport 500 + 0.05 × 100 × 122.8 = 1,114.00
 *           gross 203 × 100 = 20,300  → net 19,186.00
 * </pre>
 * Meegoda pays more per kg, but Dambulla is the better market once transport is paid.
 *
 * @author Ashmi Hettige
 */
class BestMarketCalculatorTest {

    private static final LocalDate DAY = LocalDate.of(2026, 10, 28);

    private final BestMarketCalculator calculator =
            new BestMarketCalculator(new BigDecimal("0.05"), new BigDecimal("500"), 1.3);

    private final CentrePrice dambulla = new CentrePrice(1L, "Dambulla", "Matale", 7.8742, 80.6511, DAY,
            new BigDecimal("200.00"), new BigDecimal("198.00"));
    private final CentrePrice meegoda = new CentrePrice(2L, "Meegoda", "Colombo", 6.8447, 80.04, DAY,
            new BigDecimal("203.00"), new BigDecimal("201.00"));

    @Test
    void nearerCentreWinsWhenTransportEatsTheHigherPrice() {
        List<MarketOption> ranked = calculator.rank(7.47, 80.62, new BigDecimal("100"), List.of(meegoda, dambulla));

        MarketOption best = ranked.get(0);
        MarketOption second = ranked.get(1);

        assertEquals("Dambulla", best.centreName());
        assertEquals(new BigDecimal("58.6"), best.distanceKm());
        assertEquals(new BigDecimal("793.00"), best.transportCost());
        assertEquals(new BigDecimal("19207.00"), best.netValue());

        assertEquals("Meegoda", second.centreName());
        assertEquals(new BigDecimal("122.8"), second.distanceKm());
        assertEquals(new BigDecimal("1114.00"), second.transportCost());
        assertEquals(new BigDecimal("19186.00"), second.netValue());
    }

    @Test
    void sellingAtTheCentreItselfOnlyCostsTheFixedFee() {
        List<MarketOption> ranked = calculator.rank(7.8742, 80.6511, new BigDecimal("50"), List.of(dambulla));

        assertEquals(new BigDecimal("0.0"), ranked.get(0).distanceKm());
        assertEquals(new BigDecimal("500.00"), ranked.get(0).transportCost());
        assertEquals(new BigDecimal("9500.00"), ranked.get(0).netValue());
    }
}
