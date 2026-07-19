package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.request.LoginRequest;
import com.koushik.aiinterview.dto.request.RegisterRequest;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.LoginResponse;

/**
 * Contract for authentication-related operations.
 */
public interface AuthService {

    /**
     * Register a new user account.
     *
     * @param request the registration details
     * @return success response with confirmation message
     */
    ApiResponse<Void> register(RegisterRequest request);

    /**
     * Authenticate a user and generate a JWT token.
     *
     * @param request the login credentials
     * @return response containing JWT token, email, and role
     */
    ApiResponse<LoginResponse> login(LoginRequest request);
}
