package com.agritech.optimizer.controller;

import com.agritech.optimizer.dto.trip.TripResponse;
import com.agritech.optimizer.dto.trip.TripStatusRequest;
import com.agritech.optimizer.dto.trip.VehicleRequest;
import com.agritech.optimizer.dto.trip.VehicleResponse;
import com.agritech.optimizer.service.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * A transporter's vehicles and trips (/api/transporter/**, TRANSPORTER role in SecurityConfig).
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
}
