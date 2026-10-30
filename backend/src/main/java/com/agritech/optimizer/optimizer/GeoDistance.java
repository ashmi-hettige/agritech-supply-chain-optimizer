package com.agritech.optimizer.optimizer;

/**
 * Straight-line distance between two points on Earth, using the Haversine formula.
 *
 * <pre>
 * a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)
 * d = 2R · atan2(√a, √(1 − a))        φ = latitude, λ = longitude (radians), R = 6371 km
 * </pre>
 *
 * @author Ashmi Hettige
 */
public final class GeoDistance {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private GeoDistance() {
    }

    public static double km(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
