package com.koushik.aiinterview.service.impl;

import com.koushik.aiinterview.dto.response.*;
import com.koushik.aiinterview.entity.Resume;
import com.koushik.aiinterview.entity.SessionStatus;
import com.koushik.aiinterview.entity.User;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.InterviewSessionRepository;
import com.koushik.aiinterview.repository.ResumeRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link AdminService}.
 * Provides platform-wide read access and user management for administrators.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final InterviewSessionRepository interviewSessionRepository;

    // ── View Users ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<AdminUserResponse>> getAllUsers() {
        log.info("Admin: Fetching all users");

        List<AdminUserResponse> users = userRepository.findAll().stream()
                .map(this::toAdminUserResponse)
                .collect(Collectors.toList());

        return ApiResponse.success("Users retrieved successfully", users);
    }

    // ── View Resumes ────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<AdminResumeResponse>> getAllResumes() {
        log.info("Admin: Fetching all resumes");

        List<AdminResumeResponse> resumes = resumeRepository.findAll().stream()
                .map(this::toAdminResumeResponse)
                .collect(Collectors.toList());

        return ApiResponse.success("Resumes retrieved successfully", resumes);
    }

    // ── View Interview Sessions ─────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<AdminInterviewSessionResponse>> getAllInterviewSessions() {
        log.info("Admin: Fetching all interview sessions");

        List<AdminInterviewSessionResponse> sessions = interviewSessionRepository.findAll().stream()
                .map(session -> AdminInterviewSessionResponse.builder()
                        .id(session.getId())
                        .skill(session.getSkill())
                        .difficulty(session.getDifficulty().name())
                        .score(session.getScore())
                        .status(session.getStatus().name())
                        .createdAt(session.getCreatedAt())
                        .userName(session.getUser().getName())
                        .userEmail(session.getUser().getEmail())
                        .build())
                .collect(Collectors.toList());

        return ApiResponse.success("Interview sessions retrieved successfully", sessions);
    }

    // ── Platform Statistics ─────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<PlatformStatisticsResponse> getPlatformStatistics() {
        log.info("Admin: Computing platform statistics");

        long totalUsers = userRepository.count();
        long totalResumes = resumeRepository.count();
        long totalSessions = interviewSessionRepository.count();
        long completedSessions = interviewSessionRepository.countByStatus(SessionStatus.COMPLETED);
        Double averageScore = interviewSessionRepository.findGlobalAverageScore();
        Double bestScore = interviewSessionRepository.findGlobalBestScore();

        PlatformStatisticsResponse stats = PlatformStatisticsResponse.builder()
                .totalUsers(totalUsers)
                .totalResumes(totalResumes)
                .totalSessions(totalSessions)
                .completedSessions(completedSessions)
                .averageScore(averageScore != null ? averageScore : 0.0)
                .bestScore(bestScore != null ? bestScore : 0.0)
                .build();

        return ApiResponse.success("Platform statistics retrieved successfully", stats);
    }

    // ── Delete User ─────────────────────────────────────────────────────

    @Override
    @Transactional
    public ApiResponse<Void> deleteUser(Long userId) {
        log.info("Admin: Deleting user with id={}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Delete physical resume files before deleting user (which cascades deletion in DB)
        for (Resume resume : user.getResumes()) {
            try {
                Path filePath = Paths.get(resume.getFilePath());
                Files.deleteIfExists(filePath);
                log.info("Deleted physical file: {}", resume.getFilePath());
            } catch (IOException ex) {
                log.warn("Could not delete physical file: {} — {}", resume.getFilePath(), ex.getMessage());
            }
        }

        userRepository.delete(user);
        log.info("Admin: Successfully deleted user '{}' (id={})", user.getEmail(), userId);

        return ApiResponse.success("User deleted successfully");
    }

    // ── Update User Role ────────────────────────────────────────────────

    @Override
    @Transactional
    public ApiResponse<Void> updateUserRole(Long userId, String role) {
        log.info("Admin: Updating user id={} to role={}", userId, role);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        try {
            com.koushik.aiinterview.entity.Role newRole = com.koushik.aiinterview.entity.Role.valueOf(role.toUpperCase());
            user.setRole(newRole);
            userRepository.save(user);
            log.info("Admin: Successfully updated user '{}' to role '{}'", user.getEmail(), newRole);
            return ApiResponse.success("User role updated successfully");
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
    }

    // ── Private mapping helpers ─────────────────────────────────────────

    private AdminUserResponse toAdminUserResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .resumeCount(user.getResumes().size())
                .sessionCount(user.getInterviewSessions().size())
                .build();
    }

    private AdminResumeResponse toAdminResumeResponse(Resume resume) {
        List<String> skills = Collections.emptyList();
        if (resume.getExtractedSkills() != null && !resume.getExtractedSkills().isBlank()) {
            skills = Arrays.stream(resume.getExtractedSkills().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        return AdminResumeResponse.builder()
                .id(resume.getId())
                .fileName(resume.getFileName())
                .atsScore(resume.getAtsScore())
                .extractedSkills(skills)
                .uploadedAt(resume.getUploadedAt())
                .userName(resume.getUser().getName())
                .userEmail(resume.getUser().getEmail())
                .build();
    }
}
