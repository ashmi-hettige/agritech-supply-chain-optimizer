package com.agritech.optimizer.controller;

import com.agritech.optimizer.dto.admin.CropRequest;
import com.agritech.optimizer.dto.reference.CropResponse;
import com.agritech.optimizer.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lets a farmer add a crop that is not in the list yet, straight from the listing form.
 * The same name check as the admin Crops page applies (no duplicates).
 *
 * @author Ashmi Hettige
 */
@RestController
@RequestMapping("/api/crops")
public class CropController {

    private final AdminService adminService;

    public CropController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping
    public ResponseEntity<CropResponse> addCrop(@Valid @RequestBody CropRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createCrop(request));
    }
}
