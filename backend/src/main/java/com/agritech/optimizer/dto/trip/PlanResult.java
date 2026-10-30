package com.agritech.optimizer.dto.trip;

import java.util.List;

/**
 * What the trip planner did: the trips it made and the orders that did not fit on any vehicle.
 *
 * @author Ashmi Hettige
 */
public record PlanResult(List<TripResponse> trips, List<Long> unassignedOrderIds, String message) {
}
