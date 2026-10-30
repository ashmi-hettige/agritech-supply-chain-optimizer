package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Role;
import com.agritech.optimizer.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    long countByRole(Role role);

    // admin Users page: both filters are optional (null means "any")
    @Query("""
            select u from User u
            where (:role is null or u.role = :role)
              and (:q is null
                   or lower(u.fullName) like lower(concat('%', :q, '%'))
                   or lower(u.email) like lower(concat('%', :q, '%')))
            """)
    Page<User> search(@Param("role") Role role, @Param("q") String q, Pageable pageable);
}
