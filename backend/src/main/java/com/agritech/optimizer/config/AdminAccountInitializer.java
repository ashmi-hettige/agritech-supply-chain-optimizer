package com.agritech.optimizer.config;

import com.agritech.optimizer.entity.Role;
import com.agritech.optimizer.entity.User;
import com.agritech.optimizer.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the logistics admin account at startup from environment variables, and keeps its
 * name and password in step with them. Admins cannot sign up, so this is the only way one is made.
 * To change the admin password, change ADMIN_PASSWORD in .env and restart the backend.
 *
 * @author Ashmi Hettige
 */
@Component
public class AdminAccountInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminName;

    public AdminAccountInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                   @Value("${app.admin.email}") String adminEmail,
                                   @Value("${app.admin.password}") String adminPassword,
                                   @Value("${app.admin.name}") String adminName) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail.trim().toLowerCase();
        this.adminPassword = adminPassword;
        this.adminName = adminName.trim();
    }

    @Override
    public void run(String... args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            return;
        }
        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        if (admin == null) {
            admin = new User(adminName, adminEmail, passwordEncoder.encode(adminPassword), Role.ADMIN);
            userRepository.save(admin);
            log.info("Created admin account {}", adminEmail);
            return;
        }
        if (admin.getRole() != Role.ADMIN) {
            log.warn("{} belongs to a non-admin account, so it was not changed", adminEmail);
            return;
        }
        // .env is the source of truth: update the name, and the password only if it changed
        boolean changed = !admin.getFullName().equals(adminName);
        admin.setFullName(adminName);
        if (!passwordEncoder.matches(adminPassword, admin.getPassword())) {
            admin.setPassword(passwordEncoder.encode(adminPassword));
            changed = true;
        }
        if (changed) {
            userRepository.save(admin);
            log.info("Updated admin account {}", adminEmail);
        }
    }
}