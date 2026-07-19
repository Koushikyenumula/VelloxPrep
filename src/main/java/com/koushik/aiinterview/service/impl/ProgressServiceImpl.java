package com.koushik.aiinterview.service.impl;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.ProgressResponse;
import com.koushik.aiinterview.entity.InterviewSession;
import com.koushik.aiinterview.entity.SessionStatus;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.InterviewSessionRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.ProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementation of {@link ProgressService}.
 * <p>
 * Dynamically computes all progress metrics from the user's completed
 * interview sessions — nothing is hardcoded or cached.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressServiceImpl implements ProgressService {

    private final InterviewSessionRepository sessionRepository;
    private final UserRepository userRepository;

    /** Sessions scoring at or above this threshold count as "accurate". */
    private static final double ACCURACY_THRESHOLD = 60.0;

    /** Skills with an average score at or above this are "strong". */
    private static final double STRONG_SKILL_THRESHOLD = 70.0;

    /** Skills with an average score below this are "weak". */
    private static final double WEAK_SKILL_THRESHOLD = 50.0;

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<ProgressResponse> getProgress(String email) {

        // 1. Verify user exists
        userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // 2. Fetch all completed sessions
        List<InterviewSession> completedSessions =
                sessionRepository.findByUserEmailAndStatus(email, SessionStatus.COMPLETED);

        // 3. Handle the empty case early
        if (completedSessions.isEmpty()) {
            ProgressResponse empty = ProgressResponse.builder()
                    .totalInterviews(0)
                    .averageScore(0.0)
                    .accuracy(0.0)
                    .improvementPercentage(0.0)
                    .bestScore(0.0)
                    .strongSkills(Collections.emptyList())
                    .weakSkills(Collections.emptyList())
                    .build();

            return ApiResponse.success("No completed interviews yet", empty);
        }

        // 4. Core metrics
        int totalInterviews = completedSessions.size();

        double averageScore = completedSessions.stream()
                .mapToDouble(this::safeScore)
                .average()
                .orElse(0.0);

        double bestScore = completedSessions.stream()
                .mapToDouble(this::safeScore)
                .max()
                .orElse(0.0);

        // 5. Accuracy — percentage of sessions that scored >= threshold
        long accurateCount = completedSessions.stream()
                .filter(s -> safeScore(s) >= ACCURACY_THRESHOLD)
                .count();
        double accuracy = ((double) accurateCount / totalInterviews) * 100.0;

        // 6. Improvement — compare the latest session to the average of all previous sessions
        double improvementPercentage = calculateImprovement(completedSessions);

        // 7. Skill analysis — group by skill, compute average score per skill
        Map<String, Double> skillAverages = completedSessions.stream()
                .collect(Collectors.groupingBy(
                        InterviewSession::getSkill,
                        Collectors.averagingDouble(this::safeScore)
                ));

        List<String> strongSkills = skillAverages.entrySet().stream()
                .filter(e -> e.getValue() >= STRONG_SKILL_THRESHOLD)
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .toList();

        List<String> weakSkills = skillAverages.entrySet().stream()
                .filter(e -> e.getValue() < WEAK_SKILL_THRESHOLD)
                .sorted(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .toList();

        // 8. Build response
        ProgressResponse response = ProgressResponse.builder()
                .totalInterviews(totalInterviews)
                .averageScore(round(averageScore))
                .accuracy(round(accuracy))
                .improvementPercentage(round(improvementPercentage))
                .bestScore(round(bestScore))
                .strongSkills(strongSkills)
                .weakSkills(weakSkills)
                .build();

        log.info("Progress computed for user: {} — total: {}, avg: {}, best: {}, strong: {}, weak: {}",
                email, totalInterviews, round(averageScore), round(bestScore),
                strongSkills.size(), weakSkills.size());

        return ApiResponse.success("Progress retrieved successfully", response);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Calculate improvement percentage by comparing the most recent session's
     * score to the average of all previous sessions.
     */
    private double calculateImprovement(List<InterviewSession> sessions) {
        if (sessions.size() < 2) {
            return 0.0;
        }

        // Sort by createdAt ascending to find the latest session
        List<InterviewSession> sorted = sessions.stream()
                .sorted(Comparator.comparing(InterviewSession::getCreatedAt))
                .toList();

        InterviewSession latestSession = sorted.get(sorted.size() - 1);
        double latestScore = safeScore(latestSession);

        // Average of all previous sessions (excluding the latest)
        double previousAvg = sorted.subList(0, sorted.size() - 1).stream()
                .mapToDouble(this::safeScore)
                .average()
                .orElse(0.0);

        if (previousAvg == 0.0) {
            return 0.0;
        }

        return ((latestScore - previousAvg) / previousAvg) * 100.0;
    }

    /** Safely extract score from a session, defaulting to 0.0 if null. */
    private double safeScore(InterviewSession session) {
        return session.getScore() != null ? session.getScore() : 0.0;
    }

    /** Round to one decimal place. */
    private Double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
