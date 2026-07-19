package com.koushik.aiinterview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Represents a mock coding interview session.
 */
@Entity
@Table(name = "coding_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String domain; // e.g., "Software Engineering", "Frontend"

    private Double score;

    @Column(nullable = false)
    @Builder.Default
    private Integer warningCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.NOT_STARTED;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────────────────

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_coding_sessions_user"))
    private User user;

    @OneToMany(mappedBy = "codingSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CodingQuestion> codingQuestions = new ArrayList<>();

    @OneToMany(mappedBy = "codingSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CodingSubmission> codingSubmissions = new ArrayList<>();

    // ── Convenience helpers ────────────────────────────────────────────

    public void addQuestion(CodingQuestion question) {
        codingQuestions.add(question);
        question.setCodingSession(this);
    }

    public void addSubmission(CodingSubmission submission) {
        codingSubmissions.add(submission);
        submission.setCodingSession(this);
    }
}
