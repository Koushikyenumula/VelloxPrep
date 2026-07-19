package com.koushik.aiinterview.service.impl;

import com.koushik.aiinterview.dto.request.LoginRequest;
import com.koushik.aiinterview.dto.request.RegisterRequest;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.LoginResponse;
import com.koushik.aiinterview.entity.Role;
import com.koushik.aiinterview.entity.User;
import com.koushik.aiinterview.exception.InvalidCredentialsException;
import com.koushik.aiinterview.exception.UserAlreadyExistsException;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.security.JwtService;
import com.koushik.aiinterview.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of {@link AuthService}.
 * Handles user registration and login with JWT token generation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional
    public ApiResponse<Void> register(RegisterRequest request) {

        // 1. Check if email is already registered
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("email", request.getEmail());
        }

        // 2. Build the User entity with encrypted password
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();

        // 3. Persist to database
        userRepository.save(user);

        log.info("New user registered successfully with email: {}", request.getEmail());

        return ApiResponse.created("User registered successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<LoginResponse> login(LoginRequest request) {

        // 1. Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        // 2. Verify password against the stored BCrypt hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // 3. Generate JWT token
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());

        // 4. Build login response
        LoginResponse loginResponse = LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .name(user.getName())
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt())
                .build();

        log.info("User logged in successfully: {}", user.getEmail());

        return ApiResponse.success("Login successful", loginResponse);
    }
}

