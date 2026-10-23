package com.agritech.optimizer.service;

import com.agritech.optimizer.dto.auth.AuthResponse;
import com.agritech.optimizer.dto.auth.LoginRequest;
import com.agritech.optimizer.dto.auth.RegisterRequest;
import com.agritech.optimizer.dto.auth.UserSummary;
import com.agritech.optimizer.entity.FarmerProfile;
import com.agritech.optimizer.entity.Role;
import com.agritech.optimizer.entity.User;
import com.agritech.optimizer.exception.BusinessRuleException;
import com.agritech.optimizer.exception.ResourceNotFoundException;
import com.agritech.optimizer.repository.FarmerProfileRepository;
import com.agritech.optimizer.repository.UserRepository;
import com.agritech.optimizer.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sign-up and login logic.
 *
 * @author Ashmi Hettige
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       FarmerProfileRepository farmerProfileRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    // one transaction: if saving the farm profile fails, the user row is rolled back too
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normaliseEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new BusinessRuleException("An account with this email already exists");
        }

        User user = new User(request.fullName().trim(), email,
                passwordEncoder.encode(request.password()), request.role());
        user.setPhone(request.phone());
        user.setDistrict(request.district());
        userRepository.save(user);

        if (request.role() == Role.FARMER) {
            farmerProfileRepository.save(new FarmerProfile(user, request.farmName().trim(),
                    request.farmLatitude(), request.farmLongitude()));
        }
        return new AuthResponse(jwtService.generateToken(user), UserSummary.from(user));
    }

    public AuthResponse login(LoginRequest request) {
        String email = normaliseEmail(request.email());
        // checks the BCrypt hash; throws BadCredentialsException or DisabledException on failure
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));

        User user = findByEmail(email);
        return new AuthResponse(jwtService.generateToken(user), UserSummary.from(user));
    }

    public UserSummary currentUser(String email) {
        return UserSummary.from(findByEmail(email));
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String normaliseEmail(String email) {
        return email.trim().toLowerCase();
    }
}