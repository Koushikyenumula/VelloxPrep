/**
 * ═══════════════════════════════════════════════════════════════════
 * INTERVIEW GENERATE PAGE — JavaScript
 * VelloxPrep Platform
 *
 * Handles:
 *  - Auth guard (redirect to login if no token)
 *  - Form validation (skill + difficulty required)
 *  - POST /api/interviews/generate API call
 *  - Success message and redirect to session page
 *  - Sidebar toggle and logout
 * ═══════════════════════════════════════════════════════════════════
 */

// ── DOM Elements ────────────────────────────────────────────────────
const generateForm     = document.getElementById('generateForm');
const skillSelect      = document.getElementById('skillSelect');
const generateBtn      = document.getElementById('generateBtn');
const btnText          = document.getElementById('btnText');
const btnLoader        = document.getElementById('btnLoader');
const alertContainer   = document.getElementById('alertContainer');
const difficultyError  = document.getElementById('difficultyError');
const testTypeInputs   = document.querySelectorAll('input[name="testType"]');



// ── Initialization ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Auth guard
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize reusable sidebar
    Sidebar.init();

    // Removed resume toggling logic

    // Form submission
    generateForm.addEventListener('submit', handleGenerate);

    // Real-time validation — clear errors on change
    skillSelect.addEventListener('change', () => {
        skillSelect.classList.remove('is-invalid');
        skillSelect.classList.add('is-valid');
    });

    document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
        radio.addEventListener('change', () => {
            difficultyError.classList.remove('show');
        });
    });
});

// ── (Resume Loading Removed) ─────────────────────────────────────────

// ── Form Submission Handler ─────────────────────────────────────────
async function handleGenerate(event) {
    event.preventDefault();
    clearAlert();

    // 1. Validate
    if (!validateForm()) return;

    // 2. Show loading state
    setLoading(true);

    // 3. Build payload matching GenerateQuestionsRequest DTO
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
    const selectedTestType = document.querySelector('input[name="testType"]:checked');
    
    const payload = {
        skill:      skillSelect.value,
        difficulty: selectedDifficulty.value,
        resumeId:   null
    };

    try {
        if (selectedTestType.value === 'MCQ') {
            // Call MCQ generate API
            const data = await API.generateMcq(payload.skill, payload.difficulty, 5); // Default 5 questions
            
            showAlert(`MCQ Quiz created! Redirecting…`, 'success');
            
            setTimeout(() => {
                window.location.href = `mcq-session.html?id=${data.id}`;
            }, 1200);
        } else {
            // Call subjective interview API
            const data = await API.generateInterview(payload.skill, payload.difficulty, payload.resumeId);
            
            showAlert(
                `Session created! ${data.totalQuestions || ''} ${data.skill || ''} questions generated. Redirecting…`,
                'success'
            );

            // Redirect to the interview session page
            setTimeout(() => {
                window.location.href = `interview-session.html?id=${data.sessionId}`;
            }, 1200);
        }

    } catch (error) {
        console.error('Generate error:', error);
        showAlert(error.message || 'Unable to connect to the server. Please try again later.', 'danger');
        setLoading(false);
    }
}

// ── Validation ──────────────────────────────────────────────────────
function validateForm() {
    let isValid = true;

    // Skill validation
    if (!skillSelect.value) {
        skillSelect.classList.add('is-invalid');
        const errorEl = document.getElementById('skillError');
        if (errorEl) {
            errorEl.textContent = 'Please select a skill or topic.';
            errorEl.style.display = 'block';
        }
        isValid = false;
    } else {
        skillSelect.classList.remove('is-invalid');
        skillSelect.classList.add('is-valid');
    }

    // Difficulty validation
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
    if (!selectedDifficulty) {
        difficultyError.classList.add('show');
        isValid = false;
    } else {
        difficultyError.classList.remove('show');
    }

    return isValid;
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
    generateBtn.disabled = isLoading;
    skillSelect.disabled = isLoading;

    // Disable radio buttons
    document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
        radio.disabled = isLoading;
    });

    if (isLoading) {
        btnText.classList.add('d-none');
        btnLoader.classList.remove('d-none');
    } else {
        btnText.classList.remove('d-none');
        btnLoader.classList.add('d-none');
    }
}
