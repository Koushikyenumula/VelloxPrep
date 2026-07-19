package com.koushik.aiinterview.service.impl;

import com.koushik.aiinterview.dto.response.AnswerEvaluationResponse;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.InterviewQuestionResponse;
import com.koushik.aiinterview.dto.response.InterviewSessionDetailResponse;
import com.koushik.aiinterview.dto.response.InterviewSessionResponse;
import com.koushik.aiinterview.entity.InterviewSession;
import com.koushik.aiinterview.entity.User;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.InterviewSessionRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.InterviewSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementation of {@link InterviewSessionService}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewSessionServiceImpl implements InterviewSessionService {

    private final InterviewSessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<InterviewSessionResponse>> getUserSessions(String email) {
        // 1. Verify user exists
        userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // 2. Fetch sessions
        List<InterviewSession> sessions = sessionRepository.findByUserEmail(email);

        // 3. Map to DTOs
        List<InterviewSessionResponse> sessionResponses = sessions.stream()
                .map(session -> InterviewSessionResponse.builder()
                        .id(session.getId())
                        .skill(session.getSkill())
                        .difficulty(session.getDifficulty().name())
                        .score(session.getScore())
                        .status(session.getStatus().name())
                        .createdAt(session.getCreatedAt())
                        .build())
                .toList();

        log.info("Fetched {} interview sessions for user: {}", sessionResponses.size(), email);

        return ApiResponse.success("Interview sessions retrieved successfully", sessionResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<InterviewSessionDetailResponse> getSessionDetails(Long id, String email) {
        // 1. Find the session
        InterviewSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InterviewSession", "id", id));

        // 2. Verify ownership
        if (!session.getUser().getEmail().equals(email)) {
            throw new ResourceNotFoundException("InterviewSession", "id", id);
        }

        // 3. Map questions
        List<InterviewQuestionResponse> questionResponses = session.getInterviewQuestions().stream()
                .map(q -> InterviewQuestionResponse.builder()
                        .id(q.getId())
                        .question(q.getQuestion())
                        .expectedAnswer(q.getExpectedAnswer())
                        .skill(q.getSkill())
                        .difficulty(q.getDifficulty().name())
                        .build())
                .toList();

        // 4. Map evaluations
        List<AnswerEvaluationResponse> evaluationResponses = session.getAnswerEvaluations().stream()
                .map(e -> AnswerEvaluationResponse.builder()
                        .id(e.getId())
                        .userAnswer(e.getUserAnswer())
                        .aiFeedback(e.getAiFeedback())
                        .score(e.getScore())
                        .questionId(e.getInterviewQuestion() != null ? e.getInterviewQuestion().getId() : null)
                        .build())
                .toList();

        // 5. Build detail response
        InterviewSessionDetailResponse detailResponse = InterviewSessionDetailResponse.builder()
                .id(session.getId())
                .skill(session.getSkill())
                .difficulty(session.getDifficulty().name())
                .score(session.getScore())
                .status(session.getStatus().name())
                .createdAt(session.getCreatedAt())
                .questions(questionResponses)
                .evaluations(evaluationResponses)
                .build();

        log.info("Fetched details for interview session id: {}, user: {}", id, email);

        return ApiResponse.success("Interview session details retrieved successfully", detailResponse);
    }
}
