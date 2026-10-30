package com.agritech.optimizer.optimizer;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Puts orders onto vehicles with the First-Fit Decreasing bin-packing rule:
 * <ol>
 *   <li>sort orders from heaviest to lightest;</li>
 *   <li>put each order on the first vehicle that still has room
 *       (and a refrigerated one if the order has cold-chain produce);</li>
 *   <li>orders that fit nowhere stay unassigned for another day.</li>
 * </ol>
 * Vehicles are tried smallest first, so big lorries stay free for big orders.
 * No Spring or database code, so it can be unit tested on its own.
 *
 * @author Ashmi Hettige
 */
public final class LoadPlanner {

    public record Load(Long orderId, double kg, boolean needsColdChain) {
    }

    public record Truck(Long vehicleId, double capacityKg, boolean refrigerated) {
    }

    public record Plan(Map<Long, List<Load>> loadsByVehicle, List<Load> unassigned) {
    }

    private LoadPlanner() {
    }

    public static Plan plan(List<Load> loads, List<Truck> trucks) {
        List<Load> heaviestFirst = new ArrayList<>(loads);
        heaviestFirst.sort(Comparator.comparingDouble(Load::kg).reversed());

        List<Truck> smallestFirst = new ArrayList<>(trucks);
        smallestFirst.sort(Comparator.comparingDouble(Truck::capacityKg));

        Map<Long, List<Load>> loadsByVehicle = new LinkedHashMap<>();
        Map<Long, Double> spaceLeft = new LinkedHashMap<>();
        for (Truck truck : smallestFirst) {
            spaceLeft.put(truck.vehicleId(), truck.capacityKg());
        }

        List<Load> unassigned = new ArrayList<>();
        for (Load load : heaviestFirst) {
            Truck chosen = null;
            for (Truck truck : smallestFirst) {
                boolean coldOk = !load.needsColdChain() || truck.refrigerated();
                if (coldOk && spaceLeft.get(truck.vehicleId()) >= load.kg()) {
                    chosen = truck;
                    break; // first fit
                }
            }
            if (chosen == null) {
                unassigned.add(load);
            } else {
                spaceLeft.merge(chosen.vehicleId(), -load.kg(), Double::sum);
                loadsByVehicle.computeIfAbsent(chosen.vehicleId(), id -> new ArrayList<>()).add(load);
            }
        }
        return new Plan(loadsByVehicle, unassigned);
    }
}
