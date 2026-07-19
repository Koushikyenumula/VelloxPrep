package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.ProgressResponse;
import com.koushik.aiinterview.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for user progress tracking and performance analytics.
 * Base path: /api/progress (context-path "/api" is set in application.yml).
 */
@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    /**
     * GET /api/progress
     * Retrieve the authenticated user's aggregated progress metrics.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<ProgressResponse>> getProgress(
            Authentication authentication) {

        String email = authentication.getName();
        ApiResponse<ProgressResponse> response = progressService.getProgress(email);
        return ResponseEntity.ok(response);
    }
}
