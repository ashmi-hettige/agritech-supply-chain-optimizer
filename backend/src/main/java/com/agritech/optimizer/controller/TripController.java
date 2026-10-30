package com.agritech.optimizer.controller;

import com.agritech.optimizer.dto.trip.PlanRequest;
import com.agritech.optimizer.dto.trip.PlanResult;
import com.agritech.optimizer.dto.trip.TripResponse;
import com.agritech.optimizer.dto.trip.TripStatusRequest;
import com.agritech.optimizer.dto.trip.VehicleRequest;
import com.agritech.optimizer.dto.trip.VehicleResponse;
import com.agritech.optimizer.service.TripService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Vehicles and trips. /api/transporter/** is for transporters, /api/admin/** for the logistics admin
 * (both set in SecurityConfig).
 *
 * @author Ashmi Hettige
 */
@RestController
@RequestMapping("/api")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @GetMapping("/transporter/vehicles")
    public List<VehicleResponse> myVehicles(Authentication authentication) {
        return tripService.myVehicles(authentication.getName());
    }

    @PostMapping("/transporter/vehicles")
    public ResponseEntity<VehicleResponse> addVehicle(@Valid @RequestBody VehicleRequest request,
                                                      Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.addVehicle(request, authentication.getName()));
    }

    @DeleteMapping("/transporter/vehicles/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id, Authentication authentication) {
        tripService.deleteVehicle(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/transporter/trips")
    public List<TripResponse> myTrips(Authentication authentication) {
        return tripService.myTrips(authentication.getName());
    }

    @PatchMapping("/transporter/trips/{id}/status")
    public TripResponse changeTripStatus(@PathVariable Long id, @Valid @RequestBody TripStatusRequest request,
                                         Authentication authentication) {
        return tripService.changeTripStatus(id, request.status(), authentication.getName());
    }

    // e.g. /api/admin/trips?date=2026-10-31
    @GetMapping("/admin/trips")
    public List<TripResponse> tripsOn(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return tripService.tripsOn(date);
    }

    @GetMapping("/admin/trips/waiting")
    public Map<String, Long> waiting() {
        return Map.of("confirmedOrders", tripService.ordersWaitingForTrip());
    }

    @PostMapping("/admin/trips/plan")
    public PlanResult plan(@Valid @RequestBody PlanRequest request) {
        return tripService.plan(request.tripDate());
    }
}
