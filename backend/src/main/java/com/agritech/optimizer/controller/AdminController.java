package com.agritech.optimizer.controller;

import com.agritech.optimizer.dto.admin.AdminStats;
import com.agritech.optimizer.dto.admin.AdminUserResponse;
import com.agritech.optimizer.dto.admin.CentreRequest;
import com.agritech.optimizer.dto.admin.CropRequest;
import com.agritech.optimizer.dto.admin.EnabledRequest;
import com.agritech.optimizer.dto.admin.PriceRequest;
import com.agritech.optimizer.dto.admin.PriceRowResponse;
import com.agritech.optimizer.dto.common.PageResponse;
import com.agritech.optimizer.dto.reference.CentreResponse;
import com.agritech.optimizer.dto.reference.CropResponse;
import com.agritech.optimizer.entity.Role;
import com.agritech.optimizer.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Logistics admin endpoints. SecurityConfig allows /api/admin/** for the ADMIN role only.
 * Crops and centres are read through the public /api/crops and /api/centres endpoints.
 *
 * @author Ashmi Hettige
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public AdminStats stats() {
        return adminService.stats();
    }

    // ---------- Crops ----------

    @PostMapping("/crops")
    public ResponseEntity<CropResponse> createCrop(@Valid @RequestBody CropRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createCrop(request));
    }

    @PutMapping("/crops/{id}")
    public CropResponse updateCrop(@PathVariable Long id, @Valid @RequestBody CropRequest request) {
        return adminService.updateCrop(id, request);
    }

    @DeleteMapping("/crops/{id}")
    public ResponseEntity<Void> deleteCrop(@PathVariable Long id) {
        adminService.deleteCrop(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Economic centres ----------

    @PostMapping("/centres")
    public ResponseEntity<CentreResponse> createCentre(@Valid @RequestBody CentreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createCentre(request));
    }

    @PutMapping("/centres/{id}")
    public CentreResponse updateCentre(@PathVariable Long id, @Valid @RequestBody CentreRequest request) {
        return adminService.updateCentre(id, request);
    }

    @DeleteMapping("/centres/{id}")
    public ResponseEntity<Void> deleteCentre(@PathVariable Long id) {
        adminService.deleteCentre(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Daily prices ----------

    // e.g. /api/admin/prices?date=2026-10-29&cropId=1
    @GetMapping("/prices")
    public List<PriceRowResponse> prices(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                         @RequestParam Long cropId) {
        return adminService.prices(date, cropId);
    }

    @PutMapping("/prices")
    public PriceRowResponse savePrice(@Valid @RequestBody PriceRequest request) {
        return adminService.savePrice(request);
    }

    @DeleteMapping("/prices/{id}")
    public ResponseEntity<Void> deletePrice(@PathVariable Long id) {
        adminService.deletePrice(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Users ----------

    // e.g. /api/admin/users?role=FARMER&q=perera&page=0
    @GetMapping("/users")
    public PageResponse<AdminUserResponse> users(@RequestParam(required = false) Role role,
                                                 @RequestParam(required = false) String q,
                                                 @RequestParam(defaultValue = "0") int page) {
        return adminService.users(role, q, page);
    }

    @PatchMapping("/users/{id}/enabled")
    public AdminUserResponse setEnabled(@PathVariable Long id, @Valid @RequestBody EnabledRequest request,
                                        Authentication authentication) {
        return adminService.setEnabled(id, request.enabled(), authentication.getName());
    }
}
