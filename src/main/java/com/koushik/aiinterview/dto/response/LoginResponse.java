package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for login response — returns the JWT token with user info.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String token;
    private String email;
    private String role;
    private String name;
    private String profileImageUrl;
    private java.time.LocalDateTime createdAt;
}
