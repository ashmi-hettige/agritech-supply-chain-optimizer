package com.agritech.optimizer.optimizer;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * First-Fit Decreasing, worked by hand:
 * <pre>
 * Vehicles (smallest first): A 1000 kg, B 2000 kg refrigerated
 * Orders (heaviest first):   #5 5000, #2 1200, #4 900, #1 400, #3 300 (cold chain)
 * #5 5000 → fits nowhere           → unassigned
 * #2 1200 → A too small, B (800 left)
 * #4  900 → A (100 left)
 * #1  400 → A full, B (400 left)
 * #3  300 → cold chain, so only B (100 left)
 * </pre>
 *
 * @author Ashmi Hettige
 */
class LoadPlannerTest {

    @Test
    void heaviestFirstOntoTheFirstVehicleWithRoom() {
        LoadPlanner.Plan plan = LoadPlanner.plan(
                List.of(new LoadPlanner.Load(1L, 400, false), new LoadPlanner.Load(2L, 1200, false),
                        new LoadPlanner.Load(3L, 300, true), new LoadPlanner.Load(4L, 900, false),
                        new LoadPlanner.Load(5L, 5000, false)),
                List.of(new LoadPlanner.Truck(10L, 1000, false), new LoadPlanner.Truck(11L, 2000, true)));

        List<Long> onA = plan.loadsByVehicle().get(10L).stream().map(LoadPlanner.Load::orderId).toList();
        List<Long> onB = plan.loadsByVehicle().get(11L).stream().map(LoadPlanner.Load::orderId).toList();
        List<Long> left = plan.unassigned().stream().map(LoadPlanner.Load::orderId).toList();

        assertEquals(List.of(4L), onA);
        assertEquals(List.of(2L, 1L, 3L), onB);
        assertEquals(List.of(5L), left);
    }

    @Test
    void coldChainOrderWaitsWhenThereIsNoRefrigeratedVehicle() {
        LoadPlanner.Plan plan = LoadPlanner.plan(
                List.of(new LoadPlanner.Load(1L, 100, true)),
                List.of(new LoadPlanner.Truck(10L, 3000, false)));

        assertEquals(0, plan.loadsByVehicle().size());
        assertEquals(1, plan.unassigned().size());
    }
}
