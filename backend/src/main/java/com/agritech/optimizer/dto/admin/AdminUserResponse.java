package com.agritech.optimizer.dto.admin;

import com.agritech.optimizer.entity.Role;
import com.agritech.optimizer.entity.User;

import java.time.LocalDateTime;

/** A user as listed on the admin Users page. The password hash is never sent. @author Ashmi Hettige */
public record AdminUserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role role,
        String district,
        boolean enabled,
        LocalDateTime createdAt) {

    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                user.getRole(), user.getDistrict(), user.isEnabled(), user.getCreatedAt());
    }
}
