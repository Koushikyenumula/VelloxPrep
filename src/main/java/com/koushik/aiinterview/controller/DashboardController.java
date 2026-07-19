package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.DashboardResponse;
import com.koushik.aiinterview.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for dashboard analytics.
 * Base path: /api/dashboard (context-path "/api" is set in application.yml).
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * GET /api/dashboard
     * Retrieve aggregated analytics for the authenticated user's dashboard.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(
            Authentication authentication) {

        String email = authentication.getName();
        ApiResponse<DashboardResponse> response = dashboardService.getDashboard(email);
        return ResponseEntity.ok(response);
    }
}
