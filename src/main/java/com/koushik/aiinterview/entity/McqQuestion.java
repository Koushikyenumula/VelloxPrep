package com.koushik.aiinterview.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mcq_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class McqQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionA;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionB;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionC;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionD;

    @Column(nullable = false, length = 1)
    private String correctOption; // A, B, C, or D

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(length = 1)
    private String userSelectedOption; // A, B, C, or D

    // ── Relationships ──────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mcq_session_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_mcq_questions_session"))
    private McqSession mcqSession;
}
