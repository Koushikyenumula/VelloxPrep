package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.dto.CodingRunDto;
import com.koushik.aiinterview.dto.CodingSessionDto;
import com.koushik.aiinterview.dto.CodingSubmissionDto;
import com.koushik.aiinterview.entity.CodingSession;
import com.koushik.aiinterview.entity.CodingSubmission;
import com.koushik.aiinterview.entity.User;
import com.koushik.aiinterview.service.CodingTestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/coding")
@RequiredArgsConstructor
public class CodingController {

    private final CodingTestService codingTestService;

    @PostMapping("/generate")
    public ResponseEntity<java.util.Map<String, Long>> generateSession(Authentication authentication,
                                                         @RequestBody CodingSessionDto sessionDto) {
        CodingSession session = codingTestService.generateCodingSession(authentication.getName(), sessionDto.getDomain());
        return ResponseEntity.ok(java.util.Map.of("id", session.getId()));
    }

    @PostMapping("/{sessionId}/run/{questionId}")
    public ResponseEntity<java.util.Map<String, String>> runCode(Authentication authentication,
                                                       @PathVariable Long sessionId,
                                                       @PathVariable Long questionId,
                                                       @RequestBody CodingRunDto runDto) {
        java.util.Map<String, String> result = codingTestService.runCode(authentication.getName(), sessionId, questionId, runDto);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{sessionId}/submit/{questionId}")
    public ResponseEntity<CodingSubmission> submitCode(Authentication authentication,
                                                       @PathVariable Long sessionId,
                                                       @PathVariable Long questionId,
                                                       @RequestBody CodingSubmissionDto submissionDto) {
        CodingSubmission submission = codingTestService.submitCode(authentication.getName(), sessionId, questionId, submissionDto);
        return ResponseEntity.ok(submission);
    }

    @PostMapping("/{sessionId}/finish")
    public ResponseEntity<Void> finishSession(Authentication authentication,
                                              @PathVariable Long sessionId,
                                              @RequestBody CodingSessionDto sessionDto) {
        codingTestService.finishSession(authentication.getName(), sessionId, sessionDto.getWarningsCount());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<CodingSession> getSessionDetails(Authentication authentication,
                                                           @PathVariable Long sessionId) {
        CodingSession session = codingTestService.getSessionDetails(authentication.getName(), sessionId);
        return ResponseEntity.ok(session);
    }
}
