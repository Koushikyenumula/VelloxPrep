package com.koushik.aiinterview.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

/**
 * Service responsible for JWT token generation and validation.
 * Reads configuration from {@code app.jwt.*} properties in application.yml.
 */
@Slf4j
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;
    private final String issuer;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            @Value("${app.jwt.issuer}") String issuer) {

        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expirationMs = expirationMs;
        this.issuer = issuer;
    }

    /**
     * Generate a JWT token for the given email and role.
     *
     * @param email the user's email (used as the subject)
     * @param role  the user's role (stored as a custom claim)
     * @return signed JWT token string
     */
    public String generateToken(String email, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .issuer(issuer)
                .issuedAt(now)
                .expiration(expiry)
                .claims(Map.of("role", role))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Extract the subject (email) from a JWT token.
     *
     * @param token the JWT token string
     * @return the email stored as the subject
     */
    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * Extract the role claim from a JWT token.
     *
     * @param token the JWT token string
     * @return the role string
     */
    public String extractRole(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role", String.class);
    }

    /**
     * Validate whether a token is structurally valid and not expired.
     *
     * @param token the JWT token string
     * @return true if valid, false otherwise
     */
    public boolean isTokenValid(String token) {
        try {
            Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());
            return false;
        }
    }
}
