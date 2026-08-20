package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.dto.response.*;
import com.koushik.aiinterview.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for admin-only operations.
 * All endpoints require the ADMIN role (enforced via both method-level
 * {@code @PreAuthorize} and route-level security in {@code SecurityConfig}).
 * <p>
 * Base path: /api/admin (context-path "/api" is set in application.yml).
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // ── View Users ──────────────────────────────────────────────────────

    /**
     * GET /api/admin/users
     * Retrieve all registered users with summary counts.
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAllUsers() {
        ApiResponse<List<AdminUserResponse>> response = adminService.getAllUsers();
        return ResponseEntity.ok(response);
    }

    // ── View Resumes ────────────────────────────────────────────────────

    /**
     * GET /api/admin/resumes
     * Retrieve all resumes across the platform.
     */
    @GetMapping("/resumes")
    public ResponseEntity<ApiResponse<List<AdminResumeResponse>>> getAllResumes() {
        ApiResponse<List<AdminResumeResponse>> response = adminService.getAllResumes();
        return ResponseEntity.ok(response);
    }

    // ── View Interview Sessions ─────────────────────────────────────────

    /**
     * GET /api/admin/sessions
     * Retrieve all interview sessions across the platform.
     */
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<AdminInterviewSessionResponse>>> getAllInterviewSessions() {
        ApiResponse<List<AdminInterviewSessionResponse>> response = adminService.getAllInterviewSessions();
        return ResponseEntity.ok(response);
    }

    // ── Platform Statistics ─────────────────────────────────────────────

    /**
     * GET /api/admin/statistics
     * Retrieve aggregated platform-wide statistics.
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<PlatformStatisticsResponse>> getPlatformStatistics() {
        ApiResponse<PlatformStatisticsResponse> response = adminService.getPlatformStatistics();
        return ResponseEntity.ok(response);
    }

    // ── Delete User ─────────────────────────────────────────────────────

    /**
     * DELETE /api/admin/users/{id}
     * Delete a user and all their associated data.
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        ApiResponse<Void> response = adminService.deleteUser(id);
        return ResponseEntity.ok(response);
    }

    // ── Update User Role ────────────────────────────────────────────────

    /**
     * PUT /api/admin/users/{id}/role?role=ADMIN
     * Update a user's role (e.g., from USER to ADMIN).
     */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(@PathVariable Long id, @RequestParam String role) {
        ApiResponse<Void> response = adminService.updateUserRole(id, role);
        return ResponseEntity.ok(response);
    }
}
