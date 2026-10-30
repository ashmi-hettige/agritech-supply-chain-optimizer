package com.agritech.optimizer.dto.auth;

/** Returned after register or login: the JWT plus who the user is. @author Ashmi Hettige */
public record AuthResponse(String token, UserSummary user) {
}