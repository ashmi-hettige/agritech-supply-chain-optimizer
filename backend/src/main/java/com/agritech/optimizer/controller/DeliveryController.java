package com.agritech.optimizer.controller;

import com.agritech.optimizer.dto.delivery.DeliveryRequestCreate;
import com.agritech.optimizer.dto.delivery.DeliveryRequestResponse;
import com.agritech.optimizer.dto.delivery.RequestDecision;
import com.agritech.optimizer.dto.delivery.TransportOption;
import com.agritech.optimizer.dto.delivery.TripSuggestion;
import com.agritech.optimizer.dto.trip.TripResponse;
import com.agritech.optimizer.entity.TripSlot;
import com.agritech.optimizer.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Booking transport. /api/delivery/** is for farmers, /api/transporter/** for transporters
 * (both set in SecurityConfig).
 *
 * @author Ashmi Hettige
 */
@RestController
@RequestMapping("/api")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    // e.g. /api/delivery/options?orderId=12&date=2026-11-02&slot=MORNING
    @GetMapping("/delivery/options")
    public List<TransportOption> options(@RequestParam Long orderId,
                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                         @RequestParam TripSlot slot,
                                         Authentication authentication) {
        return deliveryService.options(orderId, date, slot, authentication.getName());
    }

    @PostMapping("/delivery/requests")
    public ResponseEntity<DeliveryRequestResponse> request(@Valid @RequestBody DeliveryRequestCreate request,
                                                           Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(deliveryService.requestTransport(request, authentication.getName()));
    }

    @GetMapping("/delivery/requests")
    public List<DeliveryRequestResponse> sent(Authentication authentication) {
        return deliveryService.sentRequests(authentication.getName());
    }

    @PatchMapping("/delivery/requests/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable Long id, Authentication authentication) {
        deliveryService.cancelRequest(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/transporter/requests")
    public List<DeliveryRequestResponse> incoming(Authentication authentication) {
        return deliveryService.incomingRequests(authentication.getName());
    }

    @PatchMapping("/transporter/requests/{id}")
    public DeliveryRequestResponse decide(@PathVariable Long id, @Valid @RequestBody RequestDecision decision,
                                          Authentication authentication) {
        return deliveryService.decide(id, decision.accept(), authentication.getName());
    }

    @GetMapping("/transporter/suggestions")
    public List<TripSuggestion> suggestions(Authentication authentication) {
        return deliveryService.suggestions(authentication.getName());
    }

    @PostMapping("/transporter/trips/{tripId}/orders/{orderId}")
    public TripResponse takeOrder(@PathVariable Long tripId, @PathVariable Long orderId,
                                  Authentication authentication) {
        return deliveryService.takeOrder(tripId, orderId, authentication.getName());
    }
}
