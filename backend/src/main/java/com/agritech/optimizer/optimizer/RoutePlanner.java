package com.agritech.optimizer.optimizer;

import java.util.ArrayList;
import java.util.List;

/**
 * Orders the delivery stops of one trip with the nearest-neighbour rule:
 * from the start point, always drive to the closest stop not yet visited.
 * It is not always the shortest possible route, but it is fast and usually close.
 *
 * @author Ashmi Hettige
 */
public final class RoutePlanner {

    public record Stop(Long orderId, double lat, double lng) {
    }

    public record Route(List<Stop> stops, double straightLineKm) {
    }

    private RoutePlanner() {
    }

    public static Route nearestNeighbour(double startLat, double startLng, List<Stop> stops) {
        List<Stop> left = new ArrayList<>(stops);
        List<Stop> route = new ArrayList<>();
        double lat = startLat;
        double lng = startLng;
        double km = 0;

        while (!left.isEmpty()) {
            Stop nearest = left.get(0);
            double best = GeoDistance.km(lat, lng, nearest.lat(), nearest.lng());
            for (Stop stop : left) {
                double distance = GeoDistance.km(lat, lng, stop.lat(), stop.lng());
                if (distance < best) {
                    best = distance;
                    nearest = stop;
                }
            }
            route.add(nearest);
            left.remove(nearest);
            km += best;
            lat = nearest.lat();
            lng = nearest.lng();
        }
        return new Route(route, km);
    }
}
