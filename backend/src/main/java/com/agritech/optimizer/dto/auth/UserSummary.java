package com.agritech.optimizer.dto.auth;

import com.agritech.optimizer.entity.Role;
import com.agritech.optimizer.entity.User;

/**
 * Safe public view of a user. It never includes the password hash.
 *
 * @author Ashmi Hettige
 */
public record UserSummary(Long id, String fullName, String email, Role role, String district) {

    public static UserSummary from(User user) {
        return new UserSummary(user.getId(), user.getFullName(), user.getEmail(),
                user.getRole(), user.getDistrict());
    }
}