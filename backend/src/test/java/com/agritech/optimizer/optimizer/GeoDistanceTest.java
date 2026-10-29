package com.agritech.optimizer.optimizer;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Checks the Haversine formula against known straight-line distances.
 *
 * @author Ashmi Hettige
 */
class GeoDistanceTest {

    @Test
    void samePointIsZeroKilometres() {
        assertEquals(0.0, GeoDistance.km(7.2906, 80.6337, 7.2906, 80.6337), 1e-9);
    }

    @Test
    void colomboToKandyIsAbout94Kilometres() {
        double km = GeoDistance.km(6.9271, 79.8612, 7.2906, 80.6337);

        assertEquals(94.3, km, 0.5);
    }

    @Test
    void distanceIsTheSameInBothDirections() {
        double there = GeoDistance.km(6.9271, 79.8612, 7.8742, 80.6511);
        double back = GeoDistance.km(7.8742, 80.6511, 6.9271, 79.8612);

        assertEquals(there, back, 1e-9);
    }
}
