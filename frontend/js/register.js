/**
 * ═══════════════════════════════════════════════════════════════════
 * REGISTER PAGE - JavaScript
 * VelloxPrep Platform
 *
 * Handles:
 *  - Form validation (required fields, email format, password match)
 *  - POST /api/auth/register API call
 *  - Success message and redirect to login page
 *  - Error display and loading states
 * ═══════════════════════════════════════════════════════════════════
 */

// ── DOM Elements ────────────────────────────────────────────────────
const registerForm          = document.getElementById('registerForm');
const nameInput             = document.getElementById('nameInput');
const emailInput            = document.getElementById('emailInput');
const passwordInput         = document.getElementById('passwordInput');
const confirmPasswordInput  = document.getElementById('confirmPasswordInput');
const registerBtn           = document.getElementById('registerBtn');
const btnText               = document.getElementById('btnText');
const btnLoader             = document.getElementById('btnLoader');
const alertContainer        = document.getElementById('alertContainer');
const togglePassword        = document.getElementById('togglePassword');
const togglePasswordIcon    = document.getElementById('togglePasswordIcon');
const toggleConfirmPassword     = document.getElementById('toggleConfirmPassword');
const toggleConfirmPasswordIcon = document.getElementById('toggleConfirmPasswordIcon');

// ── Initialization ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    if (Auth.getToken()) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Attach event listeners
    registerForm.addEventListener('submit', handleRegister);
    togglePassword.addEventListener('click', handleTogglePassword);
    toggleConfirmPassword.addEventListener('click', handleToggleConfirmPassword);

    // Real-time validation - clear errors on input
    nameInput.addEventListener('input', () => clearFieldError(nameInput));
    emailInput.addEventListener('input', () => clearFieldError(emailInput));
    passwordInput.addEventListener('input', () => clearFieldError(passwordInput));
    confirmPasswordInput.addEventListener('input', () => {
        clearFieldError(confirmPasswordInput);
        // Also re-check match if confirm field has value
        if (confirmPasswordInput.value && passwordInput.value) {
            if (confirmPasswordInput.value !== passwordInput.value) {
                setFieldError(confirmPasswordInput, 'confirmPasswordError', 'Passwords do not match.');
            } else {
                setFieldValid(confirmPasswordInput);
            }
        }
    });
});

// ── Form Submission Handler ─────────────────────────────────────────
async function handleRegister(event) {
    event.preventDefault();
    clearAlert();

    // 1. Validate fields
    if (!validateForm()) return;

    // 2. Show loading state
    setLoading(true);

    // 3. Build request payload
    const payload = {
        name:     nameInput.value.trim(),
        email:    emailInput.value.trim(),
        password: passwordInput.value
    };

    try {
        // 4. Call register API
        await API.register(payload.name, payload.email, payload.password);

        showAlert('Account created successfully! Redirecting to login…', 'success');

        // Brief delay so user sees the success message
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);

    } catch (error) {
        console.error('Registration error:', error);
        showAlert(error.message || 'Unable to connect to the server. Please try again later.', 'danger');
        setLoading(false);
    }
}

// ── Client-Side Validation ──────────────────────────────────────────
function validateForm() {
    let isValid = true;

    // Name validation
    const name = nameInput.value.trim();
    if (!name) {
        setFieldError(nameInput, 'nameError', 'Full name is required.');
        isValid = false;
    } else if (name.length < 2) {
        setFieldError(nameInput, 'nameError', 'Name must be at least 2 characters.');
        isValid = false;
    } else {
        setFieldValid(nameInput);
    }

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

    // Confirm password validation
    const confirmPassword = confirmPasswordInput.value;
    if (!confirmPassword) {
        setFieldError(confirmPasswordInput, 'confirmPasswordError', 'Please confirm your password.');
        isValid = false;
    } else if (confirmPassword !== password) {
        setFieldError(confirmPasswordInput, 'confirmPasswordError', 'Passwords do not match.');
        isValid = false;
    } else {
        setFieldValid(confirmPasswordInput);
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
    registerBtn.disabled = isLoading;
    nameInput.disabled = isLoading;
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    confirmPasswordInput.disabled = isLoading;

    if (isLoading) {
        btnText.classList.add('d-none');
        btnLoader.classList.remove('d-none');
    } else {
        btnText.classList.remove('d-none');
        btnLoader.classList.add('d-none');
    }
}

// ── Password Visibility Toggles ─────────────────────────────────────
function handleTogglePassword() {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordIcon.className = isPassword ? 'bi bi-eye' : 'bi bi-eye-slash';
}

function handleToggleConfirmPassword() {
    const isPassword = confirmPasswordInput.type === 'password';
    confirmPasswordInput.type = isPassword ? 'text' : 'password';
    toggleConfirmPasswordIcon.className = isPassword ? 'bi bi-eye' : 'bi bi-eye-slash';
}
