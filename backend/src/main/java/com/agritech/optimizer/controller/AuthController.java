package com.agritech.optimizer.controller;

import com.agritech.optimizer.dto.auth.AuthResponse;
import com.agritech.optimizer.dto.auth.LoginRequest;
import com.agritech.optimizer.dto.auth.RegisterRequest;
import com.agritech.optimizer.dto.auth.UserSummary;
import com.agritech.optimizer.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoints for sign-up, login and the current user.
 *
 * @author Ashmi Hettige
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserSummary me(Authentication authentication) {
        return authService.currentUser(authentication.getName());
    }
}