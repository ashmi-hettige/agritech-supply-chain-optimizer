package com.agritech.optimizer.controller;

import com.agritech.optimizer.dto.common.PageResponse;
import com.agritech.optimizer.dto.listing.*;
import com.agritech.optimizer.service.ListingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * REST endpoints for produce listings.
 *
 * @author Ashmi Hettige
 */
@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public PageResponse<ListingResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long cropId,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return listingService.search(q, cropId, district, minPrice, maxPrice, sort, page, size);
    }

    @GetMapping("/mine")
    public List<ListingResponse> mine(Authentication authentication) {
        return listingService.myListings(authentication.getName());
    }

    @GetMapping("/{id}")
    public ListingResponse getById(@PathVariable Long id) {
        return listingService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ListingResponse> create(@Valid @RequestBody ListingRequest request,
                                                  Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(listingService.create(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ListingResponse update(@PathVariable Long id, @Valid @RequestBody ListingRequest request,
                                  Authentication authentication) {
        return listingService.update(id, request, authentication.getName());
    }

    @PatchMapping("/{id}/status")
    public ListingResponse changeStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest request,
                                        Authentication authentication) {
        return listingService.changeStatus(id, request.status(), authentication.getName());
    }

    @DeleteMapping("/{id}")
    public DeleteResult delete(@PathVariable Long id, Authentication authentication) {
        return listingService.delete(id, authentication.getName());
    }
}