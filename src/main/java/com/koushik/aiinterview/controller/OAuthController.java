package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.entity.AuthProvider;
import com.koushik.aiinterview.entity.Role;
import com.koushik.aiinterview.entity.User;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * REST controller that implements OAuth 2.0 Authorization Code flow
 * for Google and GitHub providers.
 *
 * Flow:
 * 1. Frontend redirects browser to GET /auth/google (or /auth/github)
 * 2. This controller builds the provider's authorization URL and redirects browser there
 * 3. User picks their account on Google/GitHub
 * 4. Provider redirects browser to GET /auth/callback/google (or /auth/callback/github) with ?code=xxx
 * 5. This controller exchanges the code for user info, creates/finds user, generates JWT
 * 6. Redirects browser back to frontend with ?token=xxx&email=xxx&name=xxx
 */
@Slf4j
@RestController
@RequestMapping("/auth")
public class OAuthController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Google OAuth config
    private final String googleClientId;
    private final String googleClientSecret;
    private final String googleRedirectUri;

    // GitHub OAuth config
    private final String githubClientId;
    private final String githubClientSecret;
    private final String githubRedirectUri;

    // Frontend URL to redirect back to after OAuth
    private final String frontendUrl;

    public OAuthController(
            UserRepository userRepository,
            JwtService jwtService,
            @Value("${app.oauth.google.client-id}") String googleClientId,
            @Value("${app.oauth.google.client-secret}") String googleClientSecret,
            @Value("${app.oauth.google.redirect-uri}") String googleRedirectUri,
            @Value("${app.oauth.github.client-id}") String githubClientId,
            @Value("${app.oauth.github.client-secret}") String githubClientSecret,
            @Value("${app.oauth.github.redirect-uri}") String githubRedirectUri,
            @Value("${app.oauth.frontend-url}") String frontendUrl) {

        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.googleClientId = googleClientId;
        this.googleClientSecret = googleClientSecret;
        this.googleRedirectUri = googleRedirectUri;
        this.githubClientId = githubClientId;
        this.githubClientSecret = githubClientSecret;
        this.githubRedirectUri = githubRedirectUri;
        this.frontendUrl = frontendUrl;
    }

    // ═══════════════════════════════════════════════════════════════════
    // GOOGLE OAUTH
    // ═══════════════════════════════════════════════════════════════════

    /**
     * GET /auth/google
     * Redirects the browser to Google's official OAuth consent / account chooser.
     */
    @GetMapping("/google")
    public void redirectToGoogle(HttpServletResponse response) throws IOException {
        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + encode(googleClientId)
                + "&redirect_uri=" + encode(googleRedirectUri)
                + "&response_type=code"
                + "&scope=" + encode("openid email profile")
                + "&access_type=offline"
                + "&prompt=select_account";

        log.info("Redirecting to Google OAuth: {}", authUrl);
        response.sendRedirect(authUrl);
    }

    /**
     * GET /auth/callback/google
     * Google redirects here with ?code=xxx after user picks an account.
     * Exchanges the code for tokens, fetches user info, creates/finds user,
     * generates JWT, redirects to frontend.
     */
    @GetMapping("/callback/google")
    public void handleGoogleCallback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "error", required = false) String error,
            HttpServletResponse response) throws IOException {

        if (error != null || code == null) {
            log.warn("Google OAuth error or no code: error={}", error);
            response.sendRedirect(frontendUrl + "/login.html?oauth_error=google_denied");
            return;
        }

        try {
            // 1. Exchange authorization code for access token
            String tokenUrl = "https://oauth2.googleapis.com/token";

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("code", code);
            params.add("client_id", googleClientId);
            params.add("client_secret", googleClientSecret);
            params.add("redirect_uri", googleRedirectUri);
            params.add("grant_type", "authorization_code");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<String> tokenResponse = restTemplate.exchange(
                    tokenUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(params, headers),
                    String.class
            );

            JsonNode tokenJson = objectMapper.readTree(tokenResponse.getBody());
            String accessToken = tokenJson.get("access_token").asText();

            // 2. Fetch user info from Google
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);

            ResponseEntity<String> userResponse = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    HttpMethod.GET,
                    new HttpEntity<>(userHeaders),
                    String.class
            );

            JsonNode userJson = objectMapper.readTree(userResponse.getBody());
            String email = userJson.get("email").asText();
            String name = userJson.has("name") ? userJson.get("name").asText() : email.split("@")[0];
            String picture = userJson.has("picture") ? userJson.get("picture").asText() : null;

            log.info("Google OAuth user: email={}, name={}", email, name);

            // 3. Find or create user
            User user = findOrCreateOAuthUser(email, name, picture, AuthProvider.GOOGLE);

            // 4. Generate JWT
            String jwt = jwtService.generateToken(user.getEmail(), user.getRole().name());

            // 5. Redirect to frontend with token
            String redirectUrl = frontendUrl + "/login.html"
                    + "?token=" + encode(jwt)
                    + "&email=" + encode(user.getEmail())
                    + "&name=" + encode(user.getName())
                    + "&role=" + encode(user.getRole().name())
                    + "&provider=google";

            if (picture != null) {
                redirectUrl += "&picture=" + encode(picture);
            }

            response.sendRedirect(redirectUrl);

        } catch (Exception ex) {
            log.error("Google OAuth callback error", ex);
            response.sendRedirect(frontendUrl + "/login.html?oauth_error=google_failed");
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GITHUB OAUTH
    // ═══════════════════════════════════════════════════════════════════

    /**
     * GET /auth/github
     * Redirects the browser to GitHub's official OAuth authorization page.
     */
    @GetMapping("/github")
    public void redirectToGitHub(HttpServletResponse response) throws IOException {
        String authUrl = "https://github.com/login/oauth/authorize"
                + "?client_id=" + encode(githubClientId)
                + "&redirect_uri=" + encode(githubRedirectUri)
                + "&scope=" + encode("user:email read:user");

        log.info("Redirecting to GitHub OAuth: {}", authUrl);
        response.sendRedirect(authUrl);
    }

    /**
     * GET /auth/callback/github
     * GitHub redirects here with ?code=xxx after user authorizes.
     * Exchanges the code for access token, fetches user info, creates/finds user,
     * generates JWT, redirects to frontend.
     */
    @GetMapping("/callback/github")
    public void handleGitHubCallback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "error", required = false) String error,
            HttpServletResponse response) throws IOException {

        if (error != null || code == null) {
            log.warn("GitHub OAuth error or no code: error={}", error);
            response.sendRedirect(frontendUrl + "/login.html?oauth_error=github_denied");
            return;
        }

        try {
            // 1. Exchange authorization code for access token
            String tokenUrl = "https://github.com/login/oauth/access_token"
                    + "?client_id=" + encode(githubClientId)
                    + "&client_secret=" + encode(githubClientSecret)
                    + "&code=" + encode(code)
                    + "&redirect_uri=" + encode(githubRedirectUri);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", "application/json");

            ResponseEntity<String> tokenResponse = restTemplate.exchange(
                    tokenUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(headers),
                    String.class
            );

            JsonNode tokenJson = objectMapper.readTree(tokenResponse.getBody());

            if (tokenJson.has("error")) {
                log.error("GitHub token exchange error: {}", tokenJson.get("error_description"));
                response.sendRedirect(frontendUrl + "/login.html?oauth_error=github_token_failed");
                return;
            }

            String accessToken = tokenJson.get("access_token").asText();

            // 2. Fetch user info from GitHub
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            userHeaders.set("Accept", "application/json");

            ResponseEntity<String> userResponse = restTemplate.exchange(
                    "https://api.github.com/user",
                    HttpMethod.GET,
                    new HttpEntity<>(userHeaders),
                    String.class
            );

            JsonNode userJson = objectMapper.readTree(userResponse.getBody());
            String name = userJson.has("name") && !userJson.get("name").isNull()
                    ? userJson.get("name").asText()
                    : userJson.get("login").asText();
            String avatarUrl = userJson.has("avatar_url") ? userJson.get("avatar_url").asText() : null;

            // 3. Fetch primary email (may be private)
            String email = null;
            if (userJson.has("email") && !userJson.get("email").isNull()) {
                email = userJson.get("email").asText();
            } else {
                // Fetch from /user/emails endpoint
                ResponseEntity<String> emailsResponse = restTemplate.exchange(
                        "https://api.github.com/user/emails",
                        HttpMethod.GET,
                        new HttpEntity<>(userHeaders),
                        String.class
                );

                JsonNode emailsJson = objectMapper.readTree(emailsResponse.getBody());
                for (JsonNode emailNode : emailsJson) {
                    if (emailNode.get("primary").asBoolean()) {
                        email = emailNode.get("email").asText();
                        break;
                    }
                }

                if (email == null && emailsJson.isArray() && emailsJson.size() > 0) {
                    email = emailsJson.get(0).get("email").asText();
                }
            }

            if (email == null) {
                log.error("Could not retrieve email from GitHub");
                response.sendRedirect(frontendUrl + "/login.html?oauth_error=github_no_email");
                return;
            }

            log.info("GitHub OAuth user: email={}, name={}", email, name);

            // 4. Find or create user
            User user = findOrCreateOAuthUser(email, name, avatarUrl, AuthProvider.GITHUB);

            // 5. Generate JWT
            String jwt = jwtService.generateToken(user.getEmail(), user.getRole().name());

            // 6. Redirect to frontend with token
            String redirectUrl = frontendUrl + "/login.html"
                    + "?token=" + encode(jwt)
                    + "&email=" + encode(user.getEmail())
                    + "&name=" + encode(user.getName())
                    + "&role=" + encode(user.getRole().name())
                    + "&provider=github";

            if (avatarUrl != null) {
                redirectUrl += "&picture=" + encode(avatarUrl);
            }

            response.sendRedirect(redirectUrl);

        } catch (Exception ex) {
            log.error("GitHub OAuth callback error", ex);
            response.sendRedirect(frontendUrl + "/login.html?oauth_error=github_failed");
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Find an existing user by email or create a new OAuth user.
     * If the user already exists (e.g., registered via email/password),
     * we simply return them — they can now also login via OAuth.
     */
    private User findOrCreateOAuthUser(String email, String name, String picture, AuthProvider provider) {
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Update profile picture if not set
            if (user.getProfileImageUrl() == null && picture != null) {
                user.setProfileImageUrl(picture);
                userRepository.save(user);
            }
            return user;
        }

        // Create a new OAuth user (no password needed)
        User newUser = User.builder()
                .name(name)
                .email(email)
                .password(null)
                .role(Role.USER)
                .authProvider(provider)
                .profileImageUrl(picture)
                .build();

        userRepository.save(newUser);
        log.info("Created new OAuth user: email={}, provider={}", email, provider);
        return newUser;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
