package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Role;
import com.agritech.optimizer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Data access for users. Login looks users up by email.
 *
 * @author Ashmi Hettige
 */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);
}