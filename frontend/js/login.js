/**
 * ═══════════════════════════════════════════════════════════════════
 * LOGIN PAGE — JavaScript
 * VelloxPrep Platform
 *
 * Handles:
 *  - Form validation (client-side)
 *  - POST /api/auth/login API call
 *  - JWT token storage in localStorage
 *  - Redirect to dashboard on success
 *  - Error display and loading states
 * ═══════════════════════════════════════════════════════════════════
 */

// ── DOM Elements ────────────────────────────────────────────────────
const loginForm       = document.getElementById('loginForm');
const emailInput      = document.getElementById('emailInput');
const passwordInput   = document.getElementById('passwordInput');
const loginBtn        = document.getElementById('loginBtn');
const btnText         = document.getElementById('btnText');
const btnLoader       = document.getElementById('btnLoader');
const alertContainer  = document.getElementById('alertContainer');
const togglePassword  = document.getElementById('togglePassword');
const toggleIcon      = document.getElementById('togglePasswordIcon');

// ── Initialization ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    if (Auth.getToken()) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Attach event listeners
    loginForm.addEventListener('submit', handleLogin);
    togglePassword.addEventListener('click', handleTogglePassword);

    // Real-time validation — clear errors on input
    emailInput.addEventListener('input', () => clearFieldError(emailInput));
    passwordInput.addEventListener('input', () => clearFieldError(passwordInput));
});

// ── Form Submission Handler ─────────────────────────────────────────
async function handleLogin(event) {
    event.preventDefault();
    clearAlert();

    // 1. Validate fields
    if (!validateForm()) return;

    // 2. Show loading state
    setLoading(true);

    // 3. Build request payload
    const payload = {
        email:    emailInput.value.trim(),
        password: passwordInput.value
    };

    try {
        // 4. Call login API
        const data = await API.login(payload.email, payload.password);

        // Store JWT & user info using Auth module
        Auth.saveToken(data.token, data.email, data.role, data.name, data.createdAt, data.profileImageUrl);

        showAlert('Login successful! Redirecting…', 'success');

        // Brief delay so user sees the success message
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 600);

    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Unable to connect to the server. Please try again later.', 'danger');
        setLoading(false);
    }
}

// ── Client-Side Validation ──────────────────────────────────────────
function validateForm() {
    let isValid = true;

    // Email validation
    const email = emailInput.value.trim();
    if (!email) {
        setFieldError(emailInput, 'emailError', 'Email address is required.');
        isValid = false;
    } else if (!isValidEmail(email)) {
        setFieldError(emailInput, 'emailError', 'Please enter a valid email address.');
        isValid = false;
    } else {
        setFieldValid(emailInput);
    }

    // Password validation
    const password = passwordInput.value;
    if (!password) {
        setFieldError(passwordInput, 'passwordError', 'Password is required.');
        isValid = false;
    } else if (password.length < 6) {
        setFieldError(passwordInput, 'passwordError', 'Password must be at least 6 characters.');
        isValid = false;
    } else {
        setFieldValid(passwordInput);
    }

    return isValid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Field Error Helpers ─────────────────────────────────────────────
function setFieldError(input, errorId, message) {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function setFieldValid(input) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
}

function clearFieldError(input) {
    input.classList.remove('is-invalid', 'is-valid');
}

// ── Alert Display ───────────────────────────────────────────────────
function showAlert(message, type = 'danger') {
    Toast.show(message, type);
}

function clearAlert() {
    // No-op with stackable toasts
}

// ── Loading State ───────────────────────────────────────────────────
function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;

    if (isLoading) {
        btnText.classList.add('d-none');
        btnLoader.classList.remove('d-none');
    } else {
        btnText.classList.remove('d-none');
        btnLoader.classList.add('d-none');
    }
}

// ── Password Visibility Toggle ──────────────────────────────────────
function handleTogglePassword() {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleIcon.className = isPassword ? 'bi bi-eye' : 'bi bi-eye-slash';
}
