/**
 * ═══════════════════════════════════════════════════════════════════
 * ANSWER SUBMISSION MODULE
 * VelloxPrep Platform
 *
 * Standalone module for submitting user answers to interview questions.
 *
 * API:     POST /api/interview/answer
 * Request: { sessionId, questionId, answer }
 *
 * Features:
 *  - Loading spinner on the submit button
 *  - Success toast notification
 *  - Auto-move to the next question after success
 *  - Error handling with inline alerts
 *
 * Usage:
 *   This module exposes `AnswerSubmission` on the global `window` object.
 *   The session page should call:
 *
 *     AnswerSubmission.init({ ... })   — once, on page load
 *     AnswerSubmission.submit()        — on submit button click
 * ═══════════════════════════════════════════════════════════════════
 */

const AnswerSubmission = (() => {
    'use strict';

    // ── Configuration ───────────────────────────────────────────────
    const TOAST_DURATION_MS = 3000;
    const AUTO_ADVANCE_DELAY_MS = 1500;

    // ── Module State ────────────────────────────────────────────────
    let config = {
        /** Returns the current session ID */
        getSessionId:      () => null,
        /** Returns the current question object { id, question, ... } */
        getCurrentQuestion: () => null,
        /** Returns the answer text from the textarea */
        getAnswerText:     () => '',
        /** Called to store the evaluation result after a successful submit */
        onEvaluationReceived: (questionId, evaluation) => {},
        /** Called to advance to the next question */
        onAdvanceNext:     () => {},
        /** Called when all questions have been answered */
        onAllAnswered:     () => {},
        /** Submit button element */
        submitBtn:         null,
        /** Submit button text span */
        submitBtnText:     null,
        /** Submit button loader span */
        submitBtnLoader:   null,
        /** Answer textarea element */
        answerTextarea:    null,
    };

    // ── Toast Container (created once) ──────────────────────────────
    let toastContainer = null;

    // ── Public: Initialise ──────────────────────────────────────────
    function init(options) {
        Object.assign(config, options);
    }

    // ── Public: Submit Answer ───────────────────────────────────────
    async function submit() {
        const question = config.getCurrentQuestion();
        const answer   = config.getAnswerText().trim();
        const sessionId = config.getSessionId();

        // Validate
        if (!question || !question.id) {
            showToast('No question selected.', 'danger');
            return { success: false };
        }

        if (!answer) {
            showToast('Please enter your answer before submitting.', 'warning');
            if (config.answerTextarea) config.answerTextarea.focus();
            return { success: false };
        }

        // Show loading spinner
        setLoading(true);

        // Build request payload
        const payload = {
            sessionId:  sessionId,
            questionId: question.id,
            answer:     answer
        };

        try {
            const data = await API.submitAnswer(payload.sessionId, payload.questionId, payload.answer);

                const evaluation = {
                    id:         data.id,
                    userAnswer: data.userAnswer,
                    aiFeedback: data.aiFeedback,
                    score:      data.score,
                    questionId: data.questionId
                };

                // Notify the session page
                config.onEvaluationReceived(question.id, evaluation);

                // Show success toast
                const scoreDisplay = evaluation.score != null
                    ? `${Math.round(evaluation.score)}%`
                    : '';
                showToast(
                    `Answer submitted successfully! ${scoreDisplay ? `Score: ${scoreDisplay}` : ''}`,
                    'success'
                );

                // Disable textarea + button (already answered)
                if (config.answerTextarea) config.answerTextarea.disabled = true;
                if (config.submitBtn)      config.submitBtn.disabled = true;
                if (config.submitBtnText)  {
                    config.submitBtnText.innerHTML = '<i class="bi bi-check-circle-fill"></i> Answered';
                }

                // Auto-advance to next question after delay
                setTimeout(() => {
                    config.onAdvanceNext();
                }, AUTO_ADVANCE_DELAY_MS);

                return { success: true, evaluation };

        } catch (error) {
            console.error('AnswerSubmission error:', error);
            showToast(error.message || 'Unable to connect to the server. Please try again later.', 'danger');
            return { success: false, message: error.message };

        } finally {
            setLoading(false);
        }
    }

    // ── Loading Spinner ─────────────────────────────────────────────
    function setLoading(isLoading) {
        if (config.submitBtn)      config.submitBtn.disabled    = isLoading;
        if (config.answerTextarea) config.answerTextarea.disabled = isLoading;

        if (config.submitBtnText && config.submitBtnLoader) {
            if (isLoading) {
                config.submitBtnText.classList.add('d-none');
                config.submitBtnLoader.classList.remove('d-none');
            } else {
                config.submitBtnText.classList.remove('d-none');
                config.submitBtnLoader.classList.add('d-none');
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  TOAST NOTIFICATION SYSTEM
    // ══════════════════════════════════════════════════════════════════

    function showToast(message, type = 'success') {
        Toast.show(message, type);
    }

    // ── Utility ─────────────────────────────────────────────────────
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── Public API ──────────────────────────────────────────────────
    return {
        init,
        submit,
        showToast
    };
})();

// Export for global use
window.AnswerSubmission = AnswerSubmission;
