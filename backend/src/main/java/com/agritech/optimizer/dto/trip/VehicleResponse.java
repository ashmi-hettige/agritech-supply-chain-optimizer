package com.agritech.optimizer.dto.trip;

import com.agritech.optimizer.entity.Vehicle;

import java.math.BigDecimal;

/** @author Ashmi Hettige */
public record VehicleResponse(Long id, String plateNo, String type, BigDecimal capacityKg, boolean refrigerated) {

    public static VehicleResponse from(Vehicle vehicle) {
        return new VehicleResponse(vehicle.getId(), vehicle.getPlateNo(), vehicle.getType(),
                vehicle.getCapacityKg(), vehicle.isRefrigerated());
    }
}
