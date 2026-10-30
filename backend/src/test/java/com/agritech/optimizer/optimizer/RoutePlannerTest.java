package com.agritech.optimizer.optimizer;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Nearest neighbour from a farm in Matale (7.47, 80.62): Kandy is closest, then Gampaha, then Colombo.
 *
 * @author Ashmi Hettige
 */
class RoutePlannerTest {

    @Test
    void alwaysDrivesToTheClosestStopNext() {
        RoutePlanner.Route route = RoutePlanner.nearestNeighbour(7.47, 80.62, List.of(
                new RoutePlanner.Stop(1L, 6.93, 79.86),    // Colombo
                new RoutePlanner.Stop(2L, 7.29, 80.63),    // Kandy
                new RoutePlanner.Stop(3L, 7.09, 80.00)));  // Gampaha

        List<Long> order = route.stops().stream().map(RoutePlanner.Stop::orderId).toList();

        assertEquals(List.of(2L, 3L, 1L), order);
        assertTrue(route.straightLineKm() > 110 && route.straightLineKm() < 125);
    }
}
