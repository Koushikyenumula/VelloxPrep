package com.koushik.aiinterview.entity;

/**
 * Identifies the authentication provider used to register a user.
 * <ul>
 *   <li>{@code LOCAL} — Email + password registration</li>
 *   <li>{@code GOOGLE} — Google OAuth 2.0</li>
 *   <li>{@code GITHUB} — GitHub OAuth</li>
 * </ul>
 */
public enum AuthProvider {
    LOCAL,
    GOOGLE,
    GITHUB
}
