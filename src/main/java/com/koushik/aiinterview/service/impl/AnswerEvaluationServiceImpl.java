package com.koushik.aiinterview.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koushik.aiinterview.dto.request.SubmitAnswerRequest;
import com.koushik.aiinterview.dto.response.AnswerEvaluationResponse;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.entity.AnswerEvaluation;
import com.koushik.aiinterview.entity.InterviewQuestion;
import com.koushik.aiinterview.entity.InterviewSession;
import com.koushik.aiinterview.entity.Progress;
import com.koushik.aiinterview.entity.SessionStatus;
import com.koushik.aiinterview.entity.User;
import com.koushik.aiinterview.exception.GeminiApiException;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.AnswerEvaluationRepository;
import com.koushik.aiinterview.repository.InterviewQuestionRepository;
import com.koushik.aiinterview.repository.InterviewSessionRepository;
import com.koushik.aiinterview.repository.ProgressRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.AnswerEvaluationService;
import com.koushik.aiinterview.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementation of {@link AnswerEvaluationService}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnswerEvaluationServiceImpl implements AnswerEvaluationService {

    private final AnswerEvaluationRepository answerEvaluationRepository;
    private final InterviewQuestionRepository questionRepository;
    private final InterviewSessionRepository sessionRepository;
    private final ProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_INSTRUCTION = """
            You are an expert technical interviewer.
            You must evaluate the candidate's answer to the technical question based on the expected answer.
            You must respond ONLY with a valid JSON object — no markdown, no code fences, no extra text.
            The JSON object must have exactly two fields:
            - "score": a numeric double value between 0.0 and 100.0 representing the accuracy and quality of the user's answer compared to the expected answer.
            - "aiFeedback": a detailed feedback string explaining the score, pointing out correct and incorrect/missing aspects, and how the user can improve.
            """;

    private static final String PROMPT_TEMPLATE = """
            Question: %s
            Expected Answer: %s
            Candidate's Answer: %s
            
            Please evaluate this answer.
            """;

    @Override
    @Transactional
    public ApiResponse<AnswerEvaluationResponse> submitAnswer(SubmitAnswerRequest request, String email) {
        log.info("Submitting answer for questionId: {}, user: {}", request.getQuestionId(), email);

        // 1. Fetch user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // 2. Fetch question
        InterviewQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("InterviewQuestion", "id", request.getQuestionId()));

        // 3. Verify session ownership and status
        InterviewSession session = question.getInterviewSession();
        if (!session.getUser().getEmail().equals(email)) {
            throw new ResourceNotFoundException("InterviewQuestion", "id", request.getQuestionId());
        }

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Interview session is not in progress. Current status: " + session.getStatus());
        }

        // 4. Generate AI evaluation using Gemini
        String prompt = String.format(PROMPT_TEMPLATE, question.getQuestion(), question.getExpectedAnswer(), request.getAnswer());
        String geminiResponse = geminiService.generateContent(SYSTEM_INSTRUCTION, prompt);

        // Parse response robustly using substring extraction
        String jsonString = geminiResponse;
        int startIndex = jsonString.indexOf('{');
        int endIndex = jsonString.lastIndexOf('}');
        
        if (startIndex != -1 && endIndex != -1 && startIndex < endIndex) {
            jsonString = jsonString.substring(startIndex, endIndex + 1);
        } else {
            log.error("Failed to find a JSON object in Gemini response: {}", geminiResponse);
            throw new GeminiApiException("Invalid JSON object format returned by AI.");
        }

        Double score;
        String aiFeedback;
        try {
            JsonNode node = objectMapper.readTree(jsonString);
            score = node.has("score") ? node.get("score").asDouble() : 0.0;
            aiFeedback = node.has("aiFeedback") ? node.get("aiFeedback").asText() : "";
        } catch (Exception ex) {
            log.error("Failed to parse Gemini evaluation JSON: {}", geminiResponse, ex);
            throw new GeminiApiException("Failed to parse AI evaluation response", ex);
        }

        // 5. Check if evaluation already exists for this question
        AnswerEvaluation evaluation = answerEvaluationRepository.findByInterviewQuestionId(question.getId())
                .orElse(null);

        if (evaluation == null) {
            evaluation = AnswerEvaluation.builder()
                    .userAnswer(request.getAnswer())
                    .aiFeedback(aiFeedback)
                    .score(score)
                    .interviewQuestion(question)
                    .interviewSession(session)
                    .build();
            session.addEvaluation(evaluation);
        } else {
            evaluation.setUserAnswer(request.getAnswer());
            evaluation.setAiFeedback(aiFeedback);
            evaluation.setScore(score);
        }

        AnswerEvaluation savedEvaluation = answerEvaluationRepository.save(evaluation);

        // 6. Check if all questions in the session have been evaluated
        int totalQuestions = session.getInterviewQuestions().size();
        int evaluatedCount = session.getAnswerEvaluations().size();

        if (evaluatedCount == totalQuestions) {
            log.info("All {} questions evaluated. Completing session id: {}", totalQuestions, session.getId());

            // Complete session
            double avgScore = session.getAnswerEvaluations().stream()
                    .mapToDouble(AnswerEvaluation::getScore)
                    .average()
                    .orElse(0.0);

            session.setScore(avgScore);
            session.setStatus(SessionStatus.COMPLETED);
            sessionRepository.save(session);

            // Update Progress Metrics
            updateProgressMetrics(user, avgScore);
        }

        AnswerEvaluationResponse response = AnswerEvaluationResponse.builder()
                .id(savedEvaluation.getId())
                .userAnswer(savedEvaluation.getUserAnswer())
                .aiFeedback(savedEvaluation.getAiFeedback())
                .score(savedEvaluation.getScore())
                .questionId(question.getId())
                .build();

        return ApiResponse.success("Answer evaluated and stored successfully", response);
    }

    private void updateProgressMetrics(User user, double newSessionScore) {
        try {
            String email = user.getEmail();
            long totalCompleted = sessionRepository.countCompletedByUserEmail(email);
            Double avgScoreOpt = sessionRepository.findAverageScoreByUserEmail(email);
            double avgScore = avgScoreOpt != null ? avgScoreOpt : 0.0;
            
            Double bestScoreOpt = sessionRepository.findBestScoreByUserEmail(email);
            double bestScore = bestScoreOpt != null ? bestScoreOpt : 0.0;

            double accuracy = avgScore;

            // Calculate improvement percentage:
            // Compare the newSessionScore to the average of previous completed sessions (excluding the current one).
            double improvement = 0.0;
            if (totalCompleted > 1) {
                double totalScoreSum = avgScore * totalCompleted;
                double prevScoreSum = totalScoreSum - newSessionScore;
                double prevAvg = prevScoreSum / (totalCompleted - 1);
                if (prevAvg > 0.0) {
                    improvement = ((newSessionScore - prevAvg) / prevAvg) * 100.0;
                }
            }

            Progress progress = Progress.builder()
                    .totalInterviews((int) totalCompleted)
                    .averageScore(avgScore)
                    .accuracy(accuracy)
                    .improvementPercentage(improvement)
                    .bestScore(bestScore)
                    .user(user)
                    .build();

            progressRepository.save(progress);
            user.addProgress(progress);
            log.info("Progress record created for user: {}, totalInterviews: {}, avgScore: {}, improvement: {}%",
                    user.getEmail(), totalCompleted, avgScore, improvement);
        } catch (Exception ex) {
            log.error("Failed to update user progress metrics: {}", ex.getMessage(), ex);
        }
    }
}
