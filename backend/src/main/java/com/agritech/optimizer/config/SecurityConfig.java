package com.agritech.optimizer.config;

import com.agritech.optimizer.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Security rules: stateless JWT authentication and role-based access to each API route.
 *
 * @author Ashmi Hettige
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final String allowedOrigin;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter,
                          @Value("${app.cors.allowed-origin}") String allowedOrigin) {
        this.jwtFilter = jwtFilter;
        this.allowedOrigin = allowedOrigin;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // no cookies or sessions are used, so CSRF protection is not needed
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/error").permitAll()
                        // must come before the public GET rule below: the first matching rule wins
                        .requestMatchers(HttpMethod.GET, "/api/listings/mine").hasRole("FARMER")
                        .requestMatchers(HttpMethod.GET,
                                "/api/crops/**", "/api/centres/**", "/api/prices/**", "/api/farms/**", "/api/listings/**")                        .permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/listings/**").hasRole("FARMER")
                        .requestMatchers(HttpMethod.PUT, "/api/listings/**").hasRole("FARMER")
                        .requestMatchers(HttpMethod.PATCH, "/api/listings/**").hasRole("FARMER")
                        .requestMatchers(HttpMethod.DELETE, "/api/listings/**").hasRole("FARMER")
                        .requestMatchers(HttpMethod.POST, "/api/orders").hasRole("BUYER")
                        .requestMatchers(HttpMethod.GET, "/api/orders/mine").hasRole("BUYER")
                        .requestMatchers(HttpMethod.GET, "/api/orders/incoming", "/api/orders/summary").hasRole("FARMER")
                        .requestMatchers("/api/advisor/**").hasRole("FARMER")
                        .anyRequest().authenticated())
                // return 401 instead of a login page when no valid token is sent
                .exceptionHandling(ex -> ex.authenticationEntryPoint(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // stores "{bcrypt}$2a$10$...": 8 + 60 characters, hence the 68-character password column
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}