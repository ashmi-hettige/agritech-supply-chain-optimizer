package com.agritech.optimizer.controller;

import com.agritech.optimizer.dto.order.CheckoutRequest;
import com.agritech.optimizer.dto.order.FarmerSalesSummary;
import com.agritech.optimizer.dto.order.OrderResponse;
import com.agritech.optimizer.dto.order.OrderStatusRequest;
import com.agritech.optimizer.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for orders. Who may call each one is set in SecurityConfig.
 *
 * @author Ashmi Hettige
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // buyer: place the whole cart; returns one order per farmer
    @PostMapping
    public ResponseEntity<List<OrderResponse>> checkout(@Valid @RequestBody CheckoutRequest request,
                                                        Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.checkout(request, authentication.getName()));
    }

    @GetMapping("/mine")
    public List<OrderResponse> mine(Authentication authentication) {
        return orderService.myOrders(authentication.getName());
    }

    @GetMapping("/incoming")
    public List<OrderResponse> incoming(Authentication authentication) {
        return orderService.incomingOrders(authentication.getName());
    }

    @GetMapping("/summary")
    public FarmerSalesSummary summary(Authentication authentication) {
        return orderService.farmerSummary(authentication.getName());
    }

    // farmer confirms, rejects or delivers; buyer cancels
    @PatchMapping("/{id}/status")
    public OrderResponse changeStatus(@PathVariable Long id, @Valid @RequestBody OrderStatusRequest request,
                                      Authentication authentication) {
        return orderService.changeStatus(id, request.status(), authentication.getName());
    }
}