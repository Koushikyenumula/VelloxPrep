package com.koushik.aiinterview.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koushik.aiinterview.dto.CodingRunDto;
import com.koushik.aiinterview.dto.CodingSubmissionDto;
import com.koushik.aiinterview.entity.*;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.CodingQuestionRepository;
import com.koushik.aiinterview.repository.CodingSessionRepository;
import com.koushik.aiinterview.repository.CodingSubmissionRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.CodingTestService;
import com.koushik.aiinterview.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CodingTestServiceImpl implements CodingTestService {

    private final CodingSessionRepository codingSessionRepository;
    private final CodingQuestionRepository codingQuestionRepository;
    private final CodingSubmissionRepository codingSubmissionRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    private static final Map<String, List<String>> DOMAIN_SUBTHEMES = Map.of(
            "Java", List.of(
                    "String Parsing & Lexical Tokenization",
                    "Custom Thread-Safe Bounded Blocking Queue & Concurrency",
                    "Streams API Data Transformation & Aggregation",
                    "LRU / LFU Cache Design with O(1) Operations",
                    "Transaction Rollback Simulation & Stack-based State",
                    "Custom HashMap Implementation with Collision Resolution",
                    "Interval Scheduling & Resource Allocation",
                    "Binary Tree Serialization & Deserialization",
                    "Graph Dependency Resolver & Topological Sort",
                    "Dynamic Memory / Matrix Garbage Collection Simulation"
            ),
            "DSA", List.of(
                    "Sliding Window Dynamic Subarray Extremes",
                    "Monotonic Stack & Next Greater Element Variations",
                    "Trie-based Auto-complete & Wildcard Prefix Search",
                    "Graph Shortest Path with Dijkstra / BFS on 2D Grids",
                    "Two-Pointer Cycle Detection & Fast-Slow Inversions",
                    "Binary Search on Answer Space / Capacity Optimization",
                    "Segment Tree / Fenwick Tree Range Sum Queries",
                    "Dynamic Programming 2D Grid Knapsack & State Transitions",
                    "Disjoint Set Union (DSU) Connected Components in Networks",
                    "Median of Stream with Dual Heaps (Min/Max Heap)"
            ),
            "Spring Boot", List.of(
                    "Rate Limiter & Token Bucket Filter Simulation",
                    "Circuit Breaker State Machine & Fallback Mechanism",
                    "JWT Token Claims Validator & Expiration Parser",
                    "Event Dispatcher & Observer Pattern with Priority Queues",
                    "Custom Dependency Injection Container Resolution",
                    "REST Request Payload Query Filter & Dynamic Predicates",
                    "Idempotency Key Deduplication Cache Store",
                    "Retry Mechanism with Exponential Backoff Algorithm"
            ),
            "MySQL", List.of(
                    "Query Execution Plan Cost Estimator Simulation",
                    "B+ Tree Index Range Scan & Leaf Node Traversal",
                    "Deadlock Detection in Transaction Dependency Graph",
                    "Database Buffer Pool Eviction with Clock Algorithm",
                    "SQL Parser & Lexer for WHERE Clause Filtering",
                    "Row-Level Lock Manager with Shared & Exclusive Locks",
                    "Write-Ahead Logging (WAL) Log Record Recovery Replay"
            ),
            "React", List.of(
                    "Virtual DOM Diffing & Reconciliation Algorithm",
                    "Custom Hooks State Management & Dependency Array Comparator",
                    "Event Batching & Scheduler Priority Queue",
                    "Fiber Tree Traversal & Work In Progress Rebuilding",
                    "Component Memoization Cache with Shallow Equality Check",
                    "Flux / Redux Action Reducer State Tree Cloner"
            ),
            "Hibernate", List.of(
                    "First-Level / Second-Level Cache Dirty Checking Tracker",
                    "Entity State Transitions (Transient, Persistent, Detached)",
                    "N+1 Query Detection & Batch Fetch Optimizer",
                    "Optimistic Locking Version Conflict Resolver",
                    "Lazy Loading Proxy Interceptor & Bytecode Enhancer"
            )
    );

    @Override
    @Transactional
    public CodingSession generateCodingSession(String email, String domain) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CodingSession session = CodingSession.builder()
                .user(user)
                .domain(domain)
                .status(SessionStatus.IN_PROGRESS)
                .build();
        
        session = codingSessionRepository.save(session);

        // 1. Pick 4 random sub-themes to ensure uniqueness on every run
        List<String> themePool = new java.util.ArrayList<>(DOMAIN_SUBTHEMES.getOrDefault(domain, DOMAIN_SUBTHEMES.get("DSA")));
        java.util.Collections.shuffle(themePool);
        
        String theme1 = themePool.size() > 0 ? themePool.get(0) : "Algorithmic Logic";
        String theme2 = themePool.size() > 1 ? themePool.get(1) : "Data Structure Manipulation";
        String theme3 = themePool.size() > 2 ? themePool.get(2) : "Optimization & Search";
        String theme4 = themePool.size() > 3 ? themePool.get(3) : "Complex System / Graph Architecture";

        String sessionSeed = java.util.UUID.randomUUID().toString().substring(0, 8);
        long timestamp = System.currentTimeMillis();

        String systemInstruction = """
                You are a senior technical interviewer creating a fresh, novel, and highly creative coding assessment.
                You must NEVER generate repetitive, boilerplate, or textbook questions (e.g. do NOT generate basic Two Sum, Reverse String, or Fibonnaci).
                Each question must have an engaging, realistic storyline (such as financial systems, server metric processing, drone navigation, packet routing, cloud task scheduling, or gaming leaderboards).
                """;

        String prompt = String.format("""
                Generate exactly 4 distinct, completely unique coding interview questions for the domain "%s".
                Session Randomization Seed: %s-%d.
                
                Target sub-themes for this session:
                - Question 1 (Difficulty: EASY): Theme "%s"
                - Question 2 (Difficulty: MEDIUM): Theme "%s"
                - Question 3 (Difficulty: MEDIUM): Theme "%s"
                - Question 4 (Difficulty: HARD): Theme "%s"
                
                REQUIREMENTS:
                1. Return ONLY a valid JSON array of 4 objects.
                2. Each object must contain:
                   - "title": (String) A creative, descriptive problem title.
                   - "description": (String) Problem statement with background context, input/output specifications, constraints, and 1 example with explanation (formatted with clean markdown).
                   - "difficulty": (String) Exactly "EASY", "MEDIUM", or "HARD".
                   - "baseCode": (String) Valid starter code skeleton in Java (public class Solution with method signature and helpful comments using proper \\n newlines).
                   - "testCases": (Array of exactly 3 objects) Each object must have "input" (String) and "expectedOutput" (String).
                """, domain, sessionSeed, timestamp, theme1, theme2, theme3, theme4);

        String jsonResponse = geminiService.generateContent(systemInstruction, prompt);

        // Extract JSON array robustly
        int startIndex = jsonResponse.indexOf("[");
        int endIndex = jsonResponse.lastIndexOf("]");
        if (startIndex != -1 && endIndex != -1) {
            jsonResponse = jsonResponse.substring(startIndex, endIndex + 1).trim();
        }

        try {
            List<Map<String, Object>> questions = objectMapper.readValue(jsonResponse, new TypeReference<List<Map<String, Object>>>() {});
            
            for (Map<String, Object> qData : questions) {
                String testCasesStr = "[]";
                if (qData.get("testCases") != null) {
                    testCasesStr = objectMapper.writeValueAsString(qData.get("testCases"));
                }
                
                CodingQuestion question = CodingQuestion.builder()
                        .title((String) qData.get("title"))
                        .description((String) qData.get("description"))
                        .difficulty(Difficulty.valueOf(((String) qData.get("difficulty")).toUpperCase()))
                        .baseCode((String) qData.get("baseCode"))
                        .testCasesJson(testCasesStr)
                        .codingSession(session)
                        .build();
                codingQuestionRepository.save(question);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI generated questions: " + e.getMessage(), e);
        }

        return session;
    }

    @Override
    @Transactional
    public java.util.Map<String, String> runCode(String email, Long sessionId, Long questionId, CodingRunDto runDto) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CodingSession session = codingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        CodingQuestion question = codingQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        String systemInstruction = "You are a precise code execution engine simulator.";
        String prompt = "Simulate the execution of the following " + runDto.getLanguage() + " code for the problem: '" + question.getTitle() + "'.\n" +
                "User Code: \n" + runDto.getUserCode() + "\n\n" +
                "Custom Input Test Cases (if any): \n" + runDto.getCustomInput() + "\n\n" +
                "Run the code in your mind against the custom input (or default edge cases if empty). " +
                "Return a JSON object with two keys: 'output' (the simulated stdout console output) and 'error' (any simulated compilation or runtime errors, or empty string if success).";

        String jsonResponse = geminiService.generateContent(systemInstruction, prompt);

        int startIndex = jsonResponse.indexOf("{");
        int endIndex = jsonResponse.lastIndexOf("}");
        if (startIndex != -1 && endIndex != -1) {
            jsonResponse = jsonResponse.substring(startIndex, endIndex + 1).trim();
        }

        try {
            return objectMapper.readValue(jsonResponse, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            return Map.of("output", "", "error", "Simulation failed: " + e.getMessage() + "\nRaw response:\n" + jsonResponse);
        }
    }

    @Override
    @Transactional
    public CodingSubmission submitCode(String email, Long sessionId, Long questionId, CodingSubmissionDto submissionDto) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CodingSession session = codingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        CodingQuestion question = codingQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        String systemInstruction = "You are an expert technical interviewer evaluating code.";
        String prompt = "Evaluate the following " + submissionDto.getLanguage() + " code for the problem: '" + question.getTitle() + "'.\\n" +
                "Description: " + question.getDescription() + "\\n" +
                "User Code: \\n" + submissionDto.getUserCode() + "\\n\\n" +
                "Analyze the correctness, time complexity, space complexity, and edge cases. " +
                "Return a JSON object with two keys: 'score' (a number from 0 to 100) and 'feedback' (a detailed string of your feedback).";

        String jsonResponse = geminiService.generateContent(systemInstruction, prompt);

        if (jsonResponse.startsWith("```json")) {
            jsonResponse = jsonResponse.substring(7, jsonResponse.length() - 3).trim();
        } else if (jsonResponse.startsWith("```")) {
            jsonResponse = jsonResponse.substring(3, jsonResponse.length() - 3).trim();
        }

        double score = 0.0;
        String feedback = "";

        try {
            Map<String, Object> result = objectMapper.readValue(jsonResponse, new TypeReference<Map<String, Object>>() {});
            score = Double.parseDouble(result.get("score").toString());
            feedback = result.get("feedback").toString();
        } catch (Exception e) {
            feedback = "Failed to parse AI feedback. Code was recorded.";
        }

        CodingSubmission submission = CodingSubmission.builder()
                .codingSession(session)
                .codingQuestion(question)
                .userCode(submissionDto.getUserCode())
                .language(submissionDto.getLanguage())
                .aiFeedback(feedback)
                .score(score)
                .build();

        return codingSubmissionRepository.save(submission);
    }

    @Override
    @Transactional
    public void finishSession(String email, Long sessionId, int warningsCount) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CodingSession session = codingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        session.setWarningCount(warningsCount);
        session.setStatus(SessionStatus.COMPLETED);

        // Calculate total score
        List<CodingSubmission> submissions = codingSubmissionRepository.findAll();
        double totalScore = 0;
        int count = 0;
        for (CodingSubmission sub : submissions) {
            if (sub.getCodingSession().getId().equals(sessionId)) {
                totalScore += sub.getScore();
                count++;
            }
        }
        
        session.setScore(count > 0 ? totalScore / 4 : 0.0); // Assuming 4 questions max
        codingSessionRepository.save(session);
    }

    @Override
    @Transactional(readOnly = true)
    public CodingSession getSessionDetails(String email, Long sessionId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CodingSession session = codingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
                
        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        // Ensure lazy collections are initialized if needed, though they are fetched usually or we return DTOs in Controller.
        session.getCodingQuestions().size();
        session.getCodingSubmissions().size();
        
        return session;
    }
}
