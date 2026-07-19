package com.koushik.aiinterview.service.impl;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.DashboardResponse;
import com.koushik.aiinterview.dto.response.RecentActivityResponse;
import com.koushik.aiinterview.entity.InterviewSession;
import com.koushik.aiinterview.entity.McqSession;
import com.koushik.aiinterview.entity.Resume;
import com.koushik.aiinterview.entity.SessionStatus;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.InterviewSessionRepository;
import com.koushik.aiinterview.repository.McqSessionRepository;
import com.koushik.aiinterview.repository.ResumeRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Implementation of {@link DashboardService}.
 * <p>
 * Uses optimized JPQL aggregate queries for stats (COUNT, AVG, MAX)
 * instead of loading full entity graphs into memory.
 * Recent activities are fetched as lightweight projections.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final InterviewSessionRepository sessionRepository;
    private final McqSessionRepository mcqSessionRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;

    private static final double ACCURACY_THRESHOLD = 60.0;
    private static final int RECENT_ACTIVITY_LIMIT = 10;

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<DashboardResponse> getDashboard(String email) {

        // 1. Verify user exists
        userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // 2. Optimized aggregate queries for subjective sessions
        long totalSubjInterviews = sessionRepository.countCompletedByUserEmail(email);
        Double avgSubjScore = sessionRepository.findAverageScoreByUserEmail(email);
        Double bestSubjScore = sessionRepository.findBestScoreByUserEmail(email);
        long accurateSubjCount = sessionRepository.countAccurateByUserEmail(email, ACCURACY_THRESHOLD);

        // 2b. Aggregate queries for MCQ sessions
        long totalMcqInterviews = mcqSessionRepository.countCompletedByUserEmail(email);
        Double avgMcqScore = mcqSessionRepository.findAverageScoreByUserEmail(email);
        Double bestMcqScore = mcqSessionRepository.findBestScoreByUserEmail(email);
        long accurateMcqCount = mcqSessionRepository.countAccurateByUserEmail(email, ACCURACY_THRESHOLD);

        // Combine
        long totalInterviews = totalSubjInterviews + totalMcqInterviews;

        // Weighted average for score
        Double averageScore = 0.0;
        if (totalInterviews > 0) {
            double subjTotal = (avgSubjScore != null ? avgSubjScore : 0.0) * totalSubjInterviews;
            double mcqTotal = (avgMcqScore != null ? avgMcqScore : 0.0) * totalMcqInterviews;
            averageScore = (subjTotal + mcqTotal) / totalInterviews;
        }

        Double bestScore = 0.0;
        if (bestSubjScore != null) bestScore = Math.max(bestScore, bestSubjScore);
        if (bestMcqScore != null) bestScore = Math.max(bestScore, bestMcqScore);

        long totalResumes = resumeRepository.countByUserEmail(email);

        // Fetch latest ATS score
        Double latestAtsScore = 0.0;
        List<Resume> latestResumes = resumeRepository.findTop10ByUserEmailOrderByUploadedAtDesc(email);
        if (!latestResumes.isEmpty() && latestResumes.get(0).getAtsScore() != null) {
            latestAtsScore = latestResumes.get(0).getAtsScore();
        }

        // 3. Accuracy — % of completed sessions scoring >= threshold
        double accuracy = 0.0;
        if (totalInterviews > 0) {
            long accurateCount = accurateSubjCount + accurateMcqCount;
            accuracy = ((double) accurateCount / totalInterviews) * 100.0;
        }

        // 4. Recent activities — combine latest sessions + resume uploads
        List<RecentActivityResponse> recentActivities = buildRecentActivities(email);

        // 5. Build response
        DashboardResponse dashboard = DashboardResponse.builder()
                .totalInterviews(totalInterviews)
                .averageScore(round(averageScore))
                .accuracy(round(accuracy))
                .bestScore(round(bestScore))
                .totalResumes(totalResumes)
                .latestAtsScore(round(latestAtsScore))
                .recentActivities(recentActivities)
                .build();

        log.info("Dashboard loaded for user: {} — interviews: {}, resumes: {}, avgScore: {}",
                email, totalInterviews, totalResumes, dashboard.getAverageScore());

        return ApiResponse.success("Dashboard analytics retrieved successfully", dashboard);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Build a combined, time-sorted list of recent interview sessions, MCQ sessions, and resume uploads.
     * Limited to the most recent {@value #RECENT_ACTIVITY_LIMIT} items.
     */
    private List<RecentActivityResponse> buildRecentActivities(String email) {
        List<RecentActivityResponse> activities = new ArrayList<>();

        // Recent subjective interview sessions
        List<InterviewSession> recentSessions = sessionRepository.findTop10ByUserEmailOrderByCreatedAtDesc(email);
        for (InterviewSession session : recentSessions) {
            activities.add(RecentActivityResponse.builder()
                    .type("INTERVIEW")
                    .title(session.getSkill() + " (Subjective)")
                    .score(session.getScore())
                    .status(session.getStatus().name())
                    .timestamp(session.getCreatedAt())
                    .build());
        }

        // Recent MCQ sessions
        List<McqSession> recentMcqSessions = mcqSessionRepository.findTop10ByUserEmailOrderByCreatedAtDesc(email);
        for (McqSession session : recentMcqSessions) {
            activities.add(RecentActivityResponse.builder()
                    .type("INTERVIEW") // use INTERVIEW type to match dashboard icon mapping
                    .title(session.getSkill() + " (MCQ)")
                    .score(session.getScore())
                    .status(session.getStatus().name())
                    .timestamp(session.getCreatedAt())
                    .build());
        }

        // Recent resume uploads
        List<Resume> recentResumes = resumeRepository.findTop10ByUserEmailOrderByUploadedAtDesc(email);
        for (Resume resume : recentResumes) {
            activities.add(RecentActivityResponse.builder()
                    .type("RESUME_UPLOAD")
                    .title("Uploaded: " + resume.getFileName())
                    .score(resume.getAtsScore())
                    .status("COMPLETED")
                    .timestamp(resume.getUploadedAt())
                    .build());
        }

        // Sort by timestamp descending and limit
        return activities.stream()
                .sorted(Comparator.comparing(RecentActivityResponse::getTimestamp).reversed())
                .limit(RECENT_ACTIVITY_LIMIT)
                .toList();
    }

    /** Round to one decimal place. */
    private Double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
