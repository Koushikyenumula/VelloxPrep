/**
 * ═══════════════════════════════════════════════════════════════════
 * CENTRAL API CLIENT — JavaScript
 * VelloxPrep Platform
 *
 * Exposes all REST endpoint mappings under the global `API` namespace.
 * Requires `auth.js` to be loaded beforehand for automatic JWT injection.
 * ═══════════════════════════════════════════════════════════════════
 */

const API = (() => {
    'use strict';

    const BASE_URL = 'https://velloxprep.onrender.com/api';

    // Core helper to process responses and handle errors
    async function handleResponse(response) {
        let result;
        try {
            result = await response.json();
        } catch (e) {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return null;
        }

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! Status: ${response.status}`);
        }

        return result.data !== undefined ? result.data : result;
    }

    // ── Authentication ──────────────────────────────────────────────────
    async function login(email, password) {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return handleResponse(response);
    }

    async function register(name, email, password) {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        return handleResponse(response);
    }

    // ── Resume Management ───────────────────────────────────────────────
    async function uploadResume(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${BASE_URL}/resumes/upload`, {
            method: 'POST',
            // Note: browser sets Content-Type to multipart/form-data with boundary
            body: formData
        });
        return handleResponse(response);
    }

    async function getResumes() {
        const response = await fetch(`${BASE_URL}/resumes`);
        return handleResponse(response);
    }

    async function deleteResume(id) {
        const response = await fetch(`${BASE_URL}/resumes/${id}`, {
            method: 'DELETE'
        });
        return handleResponse(response);
    }

    // ── Interview Operations ────────────────────────────────────────────
    async function generateInterview(skill, difficulty, resumeId = null) {
        const body = { skill, difficulty };
        if (resumeId) body.resumeId = resumeId;
        const response = await fetch(`${BASE_URL}/interviews/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return handleResponse(response);
    }

    async function generateCodingSession(domain) {
        const response = await fetch(`${BASE_URL}/coding/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain })
        });
        return handleResponse(response);
    }

    async function runCode(sessionId, questionId, userCode, language, customInput) {
        const response = await fetch(`${BASE_URL}/coding/${sessionId}/run/${questionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userCode, language, customInput })
        });
        return handleResponse(response);
    }

    async function submitCodingAnswer(sessionId, questionId, userCode, language) {
        const response = await fetch(`${BASE_URL}/coding/${sessionId}/submit/${questionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userCode, language })
        });
        return handleResponse(response);
    }

    async function finishCodingSession(sessionId, warningsCount) {
        const response = await fetch(`${BASE_URL}/coding/${sessionId}/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ warningsCount })
        });
        return handleResponse(response);
    }

    async function getCodingSessionDetails(sessionId) {
        const response = await fetch(`${BASE_URL}/coding/${sessionId}`);
        return handleResponse(response);
    }

    async function getInterviewSession(sessionId) {
        const response = await fetch(`${BASE_URL}/interview-sessions/${sessionId}`);
        return handleResponse(response);
    }

    async function getInterviewSessions() {
        const response = await fetch(`${BASE_URL}/interview-sessions`);
        return handleResponse(response);
    }

    async function submitAnswer(sessionId, questionId, answer) {
        const response = await fetch(`${BASE_URL}/interview/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, questionId, answer })
        });
        return handleResponse(response);
    }

    async function getInterviewResults(sessionId) {
        const response = await fetch(`${BASE_URL}/interviews/results/${sessionId}`);
        return handleResponse(response);
    }

    // ── Dashboard Metrics ───────────────────────────────────────────────
    async function getDashboard() {
        const response = await fetch(`${BASE_URL}/dashboard`);
        return handleResponse(response);
    }

    // ── MCQ Operations ──────────────────────────────────────────────────
    async function generateMcq(skill, difficulty, questionCount = 5) {
        const response = await fetch(`${BASE_URL}/mcq/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skill, difficulty, questionCount })
        });
        return handleResponse(response);
    }

    async function getMcqSessions() {
        const response = await fetch(`${BASE_URL}/mcq/sessions`);
        return handleResponse(response);
    }

    async function getMcqSession(sessionId) {
        const response = await fetch(`${BASE_URL}/mcq/sessions/${sessionId}`);
        return handleResponse(response);
    }

    async function submitMcqAnswer(sessionId, questionId, selectedOption) {
        const response = await fetch(`${BASE_URL}/mcq/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, questionId, selectedOption })
        });
        return handleResponse(response);
    }

    // ── Admin ───────────────────────────────────────────────────────────
    async function getAdminStatistics() {
        const response = await fetch(`${BASE_URL}/admin/statistics`);
        return handleResponse(response);
    }

    async function getAdminUsers() {
        const response = await fetch(`${BASE_URL}/admin/users`);
        return handleResponse(response);
    }

    async function deleteUser(id) {
        const response = await fetch(`${BASE_URL}/admin/users/${id}`, {
            method: 'DELETE'
        });
        return handleResponse(response);
    }

    async function changePassword(oldPassword, newPassword) {
        const response = await fetch(`${BASE_URL}/users/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ oldPassword, newPassword })
        });
        return handleResponse(response);
    }

    async function updateProfile(name, file) {
        const formData = new FormData();
        if (name) formData.append('name', name);
        if (file) formData.append('profileImage', file);

        const response = await fetch(`${BASE_URL}/users/profile`, {
            method: 'POST',
            body: formData
        });
        return handleResponse(response);
    }

    return {
        login: login,
        register: register,
        changePassword: changePassword,
        updateProfile: updateProfile,
        uploadResume: uploadResume,
        getResumes: getResumes,
        deleteResume: deleteResume,
        generateInterview: generateInterview,
        generateCodingSession: generateCodingSession,
        runCode: runCode,
        submitCodingAnswer: submitCodingAnswer,
        finishCodingSession: finishCodingSession,
        getCodingSessionDetails: getCodingSessionDetails,
        getInterviewSession: getInterviewSession,
        getInterviewSessions: getInterviewSessions,
        submitAnswer: submitAnswer,
        getInterviewResults: getInterviewResults,
        getDashboard: getDashboard,
        generateMcq: generateMcq,
        getMcqSessions: getMcqSessions,
        getMcqSession: getMcqSession,
        submitMcqAnswer: submitMcqAnswer,
        getAdminStatistics: getAdminStatistics,
        getAdminUsers: getAdminUsers,
        deleteUser: deleteUser
    };
})();
