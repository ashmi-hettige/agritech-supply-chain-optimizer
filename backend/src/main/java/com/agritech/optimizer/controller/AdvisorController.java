package com.agritech.optimizer.controller;

import com.agritech.optimizer.dto.advisor.AdvisorQuery;
import com.agritech.optimizer.dto.advisor.AdvisorResponse;
import com.agritech.optimizer.service.AdvisorService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Best-market advisor for farmers, e.g. /api/advisor?cropId=1&quantityKg=500&lat=7.47&lng=80.62
 *
 * @author Ashmi Hettige
 */
@RestController
@RequestMapping("/api/advisor")
public class AdvisorController {

    private final AdvisorService advisorService;

    public AdvisorController(AdvisorService advisorService) {
        this.advisorService = advisorService;
    }

    // @ModelAttribute fills the record from the query string; @Valid checks it like a form
    @GetMapping
    public AdvisorResponse advise(@Valid @ModelAttribute AdvisorQuery query, Authentication authentication) {
        return advisorService.advise(query, authentication.getName());
    }
}
