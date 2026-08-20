/**
 * ═══════════════════════════════════════════════════════════════════
 * VELLOXPREP — WORLD-CLASS AI SAAS AUTHENTICATION ENGINE
 * Handles:
 *  - Atmospheric Neural Network Canvas (Particle physics & synaptic pulses)
 *  - Desktop Ambient Cursor Parallax & Glow
 *  - Fluid Single-Page State Machine (Login, Signup, Forgot, Reset Success)
 *  - Real-time Password Strength Meter & Interactive Input Micro-interactions
 *  - Validation, API Integration, and High-Fidelity Loading/Success States
 *  - Theme Synchronization (Dark/Light)
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

// ── DOM Element Cache ───────────────────────────────────────────────
const DOM = {
    // Canvas & Cursor
    canvas:             document.getElementById('aiNetworkCanvas'),
    cursorGlow:         document.getElementById('cursorGlow'),
    themeToggleBtn:     document.getElementById('themeToggleBtn'),
    themeToggleIcon:    document.getElementById('themeToggleIcon'),

    // Views
    viewLogin:          document.getElementById('viewLogin'),
    viewSignup:         document.getElementById('viewSignup'),
    viewForgot:         document.getElementById('viewForgot'),
    viewResetSuccess:   document.getElementById('viewResetSuccess'),

    // Login Elements
    loginForm:          document.getElementById('loginForm'),
    loginEmail:         document.getElementById('loginEmailInput'),
    loginPassword:      document.getElementById('loginPasswordInput'),
    loginEmailError:    document.getElementById('loginEmailError'),
    loginPasswordError: document.getElementById('loginPasswordError'),
    loginBtn:           document.getElementById('loginBtn'),
    loginBtnLabel:      document.getElementById('loginBtnLabel'),
    loginBtnLoader:     document.getElementById('loginBtnLoader'),
    toggleLoginPassword:document.getElementById('toggleLoginPassword'),
    toggleLoginIcon:    document.getElementById('toggleLoginPasswordIcon'),
    rememberMe:         document.getElementById('rememberMe'),

    // Signup Elements
    signupForm:         document.getElementById('signupForm'),
    signupName:         document.getElementById('signupNameInput'),
    signupEmail:        document.getElementById('signupEmailInput'),
    signupPassword:     document.getElementById('signupPasswordInput'),
    signupConfirm:      document.getElementById('signupConfirmPasswordInput'),
    signupNameError:    document.getElementById('signupNameError'),
    signupEmailError:   document.getElementById('signupEmailError'),
    signupPasswordError:document.getElementById('signupPasswordError'),
    signupConfirmError: document.getElementById('signupConfirmError'),
    signupBtn:          document.getElementById('signupBtn'),
    signupBtnLabel:     document.getElementById('signupBtnLabel'),
    signupBtnLoader:    document.getElementById('signupBtnLoader'),
    toggleSignupPassword: document.getElementById('toggleSignupPassword'),
    toggleSignupIcon:   document.getElementById('toggleSignupPasswordIcon'),
    toggleConfirmPassword: document.getElementById('toggleConfirmPassword'),
    toggleConfirmIcon:  document.getElementById('toggleConfirmPasswordIcon'),
    passwordStrengthBox:document.getElementById('passwordStrengthBox'),
    passwordStrengthLabel: document.getElementById('passwordStrengthLabel'),
    termsCheck:         document.getElementById('termsCheck'),

    // Forgot Elements
    forgotForm:         document.getElementById('forgotForm'),
    forgotEmail:        document.getElementById('forgotEmailInput'),
    forgotEmailError:   document.getElementById('forgotEmailError'),
    forgotBtn:          document.getElementById('forgotBtn'),
    forgotBtnLabel:     document.getElementById('forgotBtnLabel'),
    forgotBtnLoader:    document.getElementById('forgotBtnLoader'),

    // Navigation Links
    linkToSignup:       document.getElementById('linkToSignup'),
    linkToLogin:        document.getElementById('linkToLogin'),
    linkToForgot:       document.getElementById('linkToForgot'),
    linkBackFromForgot: document.getElementById('linkBackFromForgot'),
    linkBackFromSuccess:document.getElementById('linkBackFromSuccess'),

    // Social buttons
    btnGoogleLogin:     document.getElementById('btnGoogleLogin'),
    btnGithubLogin:     document.getElementById('btnGithubLogin'),
    btnGoogleSignup:    document.getElementById('btnGoogleSignup'),
    btnGithubSignup:    document.getElementById('btnGithubSignup')
};

// ── State Management ────────────────────────────────────────────────
const AuthState = {
    currentView: 'login',
    isSubmitting: false,
    isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

// ── Backend API URL for OAuth ───────────────────────────────────────
const BACKEND_URL = 'https://velloxprep.onrender.com/api';

// ── Initialization ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for OAuth callback params FIRST (backend redirects here with ?token=xxx)
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('token');
    const oauthEmail = urlParams.get('email');
    const oauthName = urlParams.get('name');
    const oauthRole = urlParams.get('role');
    const oauthProvider = urlParams.get('provider');
    const oauthPicture = urlParams.get('picture');
    const oauthError = urlParams.get('oauth_error');
    const oauthDetails = urlParams.get('details');

    // Handle OAuth error
    if (oauthError) {
        console.error('OAuth error from backend:', oauthError, oauthDetails);
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => {
            if (typeof Toast !== 'undefined') {
                const errorMessages = {
                    'google_denied': 'Google sign-in was cancelled.',
                    'github_denied': 'GitHub sign-in was cancelled.',
                    'google_failed': oauthDetails ? `Google sign-in failed: ${oauthDetails}` : 'Google sign-in failed. Please try again.',
                    'github_failed': oauthDetails ? `GitHub sign-in failed: ${oauthDetails}` : 'GitHub sign-in failed. Please try again.',
                    'github_no_email': 'Could not retrieve email from GitHub. Please make your email public in GitHub settings.',
                    'github_token_failed': 'GitHub authorization failed. Please try again.'
                };
                Toast.show(errorMessages[oauthError] || 'OAuth sign-in failed.', 'error');
            }
        }, 300);
    }

    // Handle successful OAuth callback — save token and redirect to dashboard
    if (oauthToken && oauthEmail) {
        if (typeof Auth !== 'undefined') {
            Auth.saveToken(
                oauthToken,
                oauthEmail,
                oauthRole || 'USER',
                oauthName || oauthEmail.split('@')[0],
                new Date().toISOString(),
                oauthPicture || null
            );
        }
        // Clean the URL and redirect to dashboard
        window.history.replaceState({}, '', window.location.pathname);
        const targetDashboard = window.location.pathname.replace(/login\.html.*/i, 'dashboard.html');
        window.location.assign(targetDashboard.includes('dashboard.html') ? targetDashboard : 'dashboard.html');
        return;
    }

    // 2. If already authenticated, redirect directly to dashboard
    if (typeof Auth !== 'undefined' && Auth.getToken()) {
        window.location.href = 'dashboard.html';
        return;
    }

    initTheme();
    initCanvasNetwork();
    initCursorGlow();
    initViewRouting();
    initFormHandlers();
    initPasswordInteractions();
    initSocialHandlers();
});

// ═══════════════════════════════════════════════════════════════════
// 1. FLUID VIEW ROUTING & STATE TRANSITIONS
// ═══════════════════════════════════════════════════════════════════
function initViewRouting() {
    // Determine initial view from URL hash or page context
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'signup' || hash === 'register') {
        switchView('signup', false);
    } else if (hash === 'forgot') {
        switchView('forgot', false);
    } else {
        switchView('login', false);
    }

    // Handle browser back / forward navigation
    window.addEventListener('hashchange', () => {
        const currentHash = window.location.hash.replace('#', '').toLowerCase();
        if (currentHash === 'signup' || currentHash === 'register') {
            switchView('signup', true);
        } else if (currentHash === 'forgot') {
            switchView('forgot', true);
        } else {
            switchView('login', true);
        }
    });

    // Navigation click bindings
    if (DOM.linkToSignup) {
        DOM.linkToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, '', '#signup');
            switchView('signup');
        });
    }

    if (DOM.linkToLogin) {
        DOM.linkToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, '', '#login');
            switchView('login');
        });
    }

    if (DOM.linkToForgot) {
        DOM.linkToForgot.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, '', '#forgot');
            switchView('forgot');
        });
    }

    if (DOM.linkBackFromForgot) {
        DOM.linkBackFromForgot.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, '', '#login');
            switchView('login');
        });
    }

    if (DOM.linkBackFromSuccess) {
        DOM.linkBackFromSuccess.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, '', '#login');
            switchView('login');
        });
    }
}

function switchView(targetView, animate = true) {
    if (AuthState.currentView === targetView && !animate) return;

    const views = {
        'login': DOM.viewLogin,
        'signup': DOM.viewSignup,
        'forgot': DOM.viewForgot,
        'reset-success': DOM.viewResetSuccess
    };

    const currentEl = views[AuthState.currentView];
    const targetEl = views[targetView];

    if (!targetEl) return;

    if (!animate || AuthState.isReducedMotion) {
        Object.values(views).forEach(el => {
            if (el) {
                el.classList.remove('view-active', 'view-exit-left', 'view-exit-right');
                el.style.display = 'none';
            }
        });
        targetEl.style.display = 'block';
        targetEl.classList.add('view-active');
        AuthState.currentView = targetView;
        return;
    }

    // Smooth horizontal slide transition
    if (currentEl && currentEl !== targetEl) {
        currentEl.classList.remove('view-active');
        currentEl.classList.add('view-exit-left');

        setTimeout(() => {
            currentEl.style.display = 'none';
            currentEl.classList.remove('view-exit-left', 'view-exit-right');

            targetEl.style.display = 'block';
            targetEl.classList.add('view-exit-right');

            // Force repaint
            void targetEl.offsetWidth;

            targetEl.classList.remove('view-exit-right');
            targetEl.classList.add('view-active');
            AuthState.currentView = targetView;
        }, 150);
    } else {
        targetEl.style.display = 'block';
        targetEl.classList.add('view-active');
        AuthState.currentView = targetView;
    }
}

// ═══════════════════════════════════════════════════════════════════
// 2. ATMOSPHERIC NEURAL NETWORK CANVAS (CANVAS PARTICLES & SYNAPSES)
// ═══════════════════════════════════════════════════════════════════
function initCanvasNetwork() {
    const canvas = DOM.canvas;
    if (!canvas || AuthState.isReducedMotion) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let nodes = [];
    let pulses = [];
    const MAX_NODES = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 12000), 120);
    const CONNECT_DIST = 150;

    // Mouse parallax tracking
    const mouse = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2
    };

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        initNodes();
    }

    function initNodes() {
        nodes = [];
        for (let i = 0; i < MAX_NODES; i++) {
            const depth = 0.4 + Math.random() * 0.6; // 0.4 (far) to 1.0 (near)
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.25 * depth,
                vy: (Math.random() - 0.5) * 0.25 * depth,
                radius: (1.2 + Math.random() * 1.6) * depth,
                depth: depth,
                alpha: 0.15 + depth * 0.45,
                pulseTimer: Math.random() * 100
            });
        }
    }

    // Track mouse for gentle parallax
    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
    }, { passive: true });

    // Synaptic pulse spawning
    function spawnPulse(nodeA, nodeB) {
        if (pulses.length > 10) return;
        pulses.push({
            startX: nodeA.x,
            startY: nodeA.y,
            endX: nodeB.x,
            endY: nodeB.y,
            progress: 0,
            speed: 0.015 + Math.random() * 0.015,
            color: 'rgba(140, 120, 255, 0.85)'
        });
    }

    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
    });

    let lastTime = 0;
    function render(currentTime) {
        requestAnimationFrame(render);
        if (!isVisible) return;

        // Smooth mouse damping (lerp)
        mouse.x += (mouse.targetX - mouse.x) * 0.04;
        mouse.y += (mouse.targetY - mouse.y) * 0.04;

        const offsetX = (mouse.x - width / 2) / (width / 2);
        const offsetY = (mouse.y - height / 2) / (height / 2);

        ctx.clearRect(0, 0, width, height);

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const nodeColor = isLight ? 'rgba(70, 85, 125,' : 'rgba(180, 195, 235,';
        const lineColor = isLight ? 'rgba(100, 120, 170,' : 'rgba(140, 160, 215,';

        // 1. Update and draw connections
        for (let i = 0; i < nodes.length; i++) {
            const na = nodes[i];

            // Parallax position
            const posX = na.x + offsetX * 16 * na.depth;
            const posY = na.y + offsetY * 16 * na.depth;

            for (let j = i + 1; j < nodes.length; j++) {
                const nb = nodes[j];
                const pbx = nb.x + offsetX * 16 * nb.depth;
                const pby = nb.y + offsetY * 16 * nb.depth;

                const dx = posX - pbx;
                const dy = posY - pby;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECT_DIST) {
                    const lineAlpha = (1 - dist / CONNECT_DIST) * 0.16 * ((na.depth + nb.depth) / 2);
                    ctx.beginPath();
                    ctx.strokeStyle = `${lineColor} ${lineAlpha})`;
                    ctx.lineWidth = 0.75;
                    ctx.moveTo(posX, posY);
                    ctx.lineTo(pbx, pby);
                    ctx.stroke();

                    // Random synaptic trigger
                    if (Math.random() < 0.0003 && dist < 120) {
                        spawnPulse(na, nb);
                    }
                }
            }
        }

        // 2. Update and draw pulses
        for (let p = pulses.length - 1; p >= 0; p--) {
            const pulse = pulses[p];
            pulse.progress += pulse.speed;

            if (pulse.progress >= 1) {
                pulses.splice(p, 1);
                continue;
            }

            const currentX = pulse.startX + (pulse.endX - pulse.startX) * pulse.progress + offsetX * 14;
            const currentY = pulse.startY + (pulse.endY - pulse.startY) * pulse.progress + offsetY * 14;

            ctx.beginPath();
            ctx.arc(currentX, currentY, 2, 0, Math.PI * 2);
            ctx.fillStyle = isLight ? 'rgba(109, 74, 255, 0.75)' : 'rgba(140, 120, 255, 0.9)';
            ctx.fill();
        }

        // 3. Draw nodes
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];

            // Motion & subtle drift
            n.x += n.vx + 0.05 * n.depth; // Gentle horizontal flow
            n.y += n.vy;

            // Wrap around edges seamlessly
            if (n.x < -20) n.x = width + 20;
            if (n.x > width + 20) n.x = -20;
            if (n.y < -20) n.y = height + 20;
            if (n.y > height + 20) n.y = -20;

            const px = n.x + offsetX * 16 * n.depth;
            const py = n.y + offsetY * 16 * n.depth;

            ctx.beginPath();
            ctx.arc(px, py, n.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${nodeColor} ${n.alpha})`;
            ctx.fill();
        }
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(render);
}

// ═══════════════════════════════════════════════════════════════════
// 3. DESKTOP CURSOR AMBIENT GLOW
// ═══════════════════════════════════════════════════════════════════
function initCursorGlow() {
    const glow = DOM.cursorGlow;
    if (!glow || window.innerWidth < 768) return;

    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        glow.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
    });

    function updateGlow() {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        glow.style.left = `${currentX}px`;
        glow.style.top = `${currentY}px`;
        requestAnimationFrame(updateGlow);
    }
    requestAnimationFrame(updateGlow);
}

// ═══════════════════════════════════════════════════════════════════
// 4. INTERACTIVE PASSWORD INPUTS & STRENGTH METER
// ═══════════════════════════════════════════════════════════════════
function initPasswordInteractions() {
    // Password toggles helper
    function setupToggle(button, input, icon) {
        if (!button || !input || !icon) return;
        button.addEventListener('click', () => {
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            icon.className = isPass ? 'bi bi-eye' : 'bi bi-eye-slash';
        });
    }

    setupToggle(DOM.toggleLoginPassword, DOM.loginPassword, DOM.toggleLoginIcon);
    setupToggle(DOM.toggleSignupPassword, DOM.signupPassword, DOM.toggleSignupIcon);
    setupToggle(DOM.toggleConfirmPassword, DOM.signupConfirm, DOM.toggleConfirmIcon);

    // Signup password strength evaluation
    if (DOM.signupPassword && DOM.passwordStrengthBox) {
        DOM.signupPassword.addEventListener('input', () => {
            const val = DOM.signupPassword.value;
            evaluatePasswordStrength(val);
        });
    }
}

function evaluatePasswordStrength(password) {
    const box = DOM.passwordStrengthBox;
    const label = DOM.passwordStrengthLabel;
    if (!box || !label) return;

    box.classList.remove('strength-weak', 'strength-fair', 'strength-strong');

    if (!password) {
        label.textContent = 'Password strength';
        label.style.color = 'var(--text-muted)';
        return;
    }

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
        box.classList.add('strength-weak');
        label.textContent = 'Weak password';
        label.style.color = 'var(--error)';
    } else if (score <= 3) {
        box.classList.add('strength-fair');
        label.textContent = 'Good password';
        label.style.color = 'var(--warning)';
    } else {
        box.classList.add('strength-strong');
        label.textContent = 'Strong password';
        label.style.color = 'var(--success)';
    }
}

// ═══════════════════════════════════════════════════════════════════
// 5. FORM SUBMISSIONS & VALIDATION
// ═══════════════════════════════════════════════════════════════════
function initFormHandlers() {
    // Clear field errors dynamically on user input
    const inputsWithErrors = [
        { input: DOM.loginEmail, error: DOM.loginEmailError },
        { input: DOM.loginPassword, error: DOM.loginPasswordError },
        { input: DOM.signupName, error: DOM.signupNameError },
        { input: DOM.signupEmail, error: DOM.signupEmailError },
        { input: DOM.signupPassword, error: DOM.signupPasswordError },
        { input: DOM.signupConfirm, error: DOM.signupConfirmError },
        { input: DOM.forgotEmail, error: DOM.forgotEmailError }
    ];

    inputsWithErrors.forEach(({ input, error }) => {
        if (input) {
            input.addEventListener('input', () => {
                input.classList.remove('is-invalid');
                if (error) error.classList.remove('visible');
            });
        }
    });

    // ── Login Handler ───────────────────────────────────────────────
    if (DOM.loginForm) {
        DOM.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (AuthState.isSubmitting) return;

            const email = DOM.loginEmail.value.trim();
            const password = DOM.loginPassword.value;

            let valid = true;
            if (!email || !isValidEmail(email)) {
                showFieldError(DOM.loginEmail, DOM.loginEmailError, 'Enter a valid email address.');
                valid = false;
            }
            if (!password || password.length < 6) {
                showFieldError(DOM.loginPassword, DOM.loginPasswordError, 'Password must be at least 6 characters.');
                valid = false;
            }
            if (!valid) return;

            setButtonLoading(DOM.loginBtn, DOM.loginBtnLabel, DOM.loginBtnLoader, true, 'Signing you in...');

            try {
                const data = await API.login(email, password);

                // Save authentication data
                if (typeof Auth !== 'undefined') {
                    Auth.saveToken(data.token, data.email, data.role, data.name, data.createdAt, data.profileImageUrl);
                }

                // Success transition state
                DOM.loginBtn.style.backgroundColor = 'var(--success)';
                DOM.loginBtnLabel.innerHTML = `<i class="bi bi-check-lg me-1"></i> Welcome back`;
                DOM.loginBtnLabel.style.display = 'inline-flex';
                DOM.loginBtnLoader.classList.remove('visible');

                setTimeout(() => {
                    const targetUrl = window.location.pathname.replace(/login\.html.*/i, 'dashboard.html');
                    window.location.assign(targetUrl);
                }, 500);

            } catch (err) {
                console.error('Login failure:', err);
                setButtonLoading(DOM.loginBtn, DOM.loginBtnLabel, DOM.loginBtnLoader, false);
                showFieldError(DOM.loginPassword, DOM.loginPasswordError, err.message || 'Incorrect email or password.');
            }
        });
    }

    // ── Signup Handler ──────────────────────────────────────────────
    if (DOM.signupForm) {
        DOM.signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (AuthState.isSubmitting) return;

            const name = DOM.signupName.value.trim();
            const email = DOM.signupEmail.value.trim();
            const password = DOM.signupPassword.value;
            const confirm = DOM.signupConfirm.value;

            let valid = true;
            if (!name || name.length < 2) {
                showFieldError(DOM.signupName, DOM.signupNameError, 'Please enter your full name.');
                valid = false;
            }
            if (!email || !isValidEmail(email)) {
                showFieldError(DOM.signupEmail, DOM.signupEmailError, 'Enter a valid email address.');
                valid = false;
            }
            if (!password || password.length < 6) {
                showFieldError(DOM.signupPassword, DOM.signupPasswordError, 'Password must be at least 6 characters.');
                valid = false;
            }
            if (password !== confirm) {
                showFieldError(DOM.signupConfirm, DOM.signupConfirmError, 'Passwords do not match.');
                valid = false;
            }
            if (!DOM.termsCheck.checked) {
                if (typeof Toast !== 'undefined') Toast.show('Please accept the Terms of Service to continue.', 'warning');
                valid = false;
            }
            if (!valid) return;

            setButtonLoading(DOM.signupBtn, DOM.signupBtnLabel, DOM.signupBtnLoader, true, 'Creating account...');

            try {
                await API.register(name, email, password);

                DOM.signupBtn.style.backgroundColor = 'var(--success)';
                DOM.signupBtnLabel.innerHTML = `<i class="bi bi-check-lg me-1"></i> Account created`;
                DOM.signupBtnLabel.style.display = 'inline-flex';
                DOM.signupBtnLoader.classList.remove('visible');

                // Try automatic login or switch to login view
                setTimeout(async () => {
                    try {
                        const loginData = await API.login(email, password);
                        if (typeof Auth !== 'undefined') {
                            Auth.saveToken(loginData.token, loginData.email, loginData.role, loginData.name, loginData.createdAt, loginData.profileImageUrl);
                        }
                        const targetUrl = window.location.pathname.replace(/login\.html.*/i, 'dashboard.html');
                        window.location.assign(targetUrl);
                    } catch (e) {
                        setButtonLoading(DOM.signupBtn, DOM.signupBtnLabel, DOM.signupBtnLoader, false);
                        if (typeof Toast !== 'undefined') {
                            Toast.show('Account created! Please sign in with your credentials.', 'success');
                        }
                        history.pushState(null, '', '#login');
                        switchView('login');
                    }
                }, 750);

            } catch (err) {
                console.error('Registration failure:', err);
                setButtonLoading(DOM.signupBtn, DOM.signupBtnLabel, DOM.signupBtnLoader, false);
                showFieldError(DOM.signupEmail, DOM.signupEmailError, err.message || 'Unable to register account.');
            }
        });
    }

    // ── Forgot Password Handler ─────────────────────────────────────
    if (DOM.forgotForm) {
        DOM.forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (AuthState.isSubmitting) return;

            const email = DOM.forgotEmail.value.trim();
            if (!email || !isValidEmail(email)) {
                showFieldError(DOM.forgotEmail, DOM.forgotEmailError, 'Enter a valid email address.');
                return;
            }

            setButtonLoading(DOM.forgotBtn, DOM.forgotBtnLabel, DOM.forgotBtnLoader, true, 'Sending instructions...');

            // Simulate graceful API dispatch
            setTimeout(() => {
                setButtonLoading(DOM.forgotBtn, DOM.forgotBtnLabel, DOM.forgotBtnLoader, false);
                switchView('reset-success');
            }, 800);
        });
    }
}

// ── Validation & Button Helpers ─────────────────────────────────────
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(input, errorEl, message) {
    if (input) input.classList.add('is-invalid');
    if (errorEl) {
        const span = errorEl.querySelector('span');
        if (span) span.textContent = message;
        errorEl.classList.add('visible');
    }
}

function setButtonLoading(btn, label, loader, isLoading, loadingText = '') {
    AuthState.isSubmitting = isLoading;
    if (!btn) return;
    btn.disabled = isLoading;

    if (isLoading) {
        if (label) label.style.display = 'none';
        if (loader) {
            loader.classList.add('visible');
            const txt = loader.querySelector('span:last-child');
            if (txt && loadingText) txt.textContent = loadingText;
        }
    } else {
        if (label) label.style.display = 'inline-flex';
        if (loader) loader.classList.remove('visible');
    }
}

// ═══════════════════════════════════════════════════════════════════
// 6. REAL OAUTH SOCIAL AUTHENTICATION (Google & GitHub)
// ═══════════════════════════════════════════════════════════════════
function initSocialHandlers() {

    // ── Google Login: Redirect to backend which redirects to Google's official OAuth
    [DOM.btnGoogleLogin, DOM.btnGoogleSignup].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Show loading state
                btn.disabled = true;
                btn.innerHTML = '<span class="orbit-spinner" style="display:inline-flex"><span class="orbit-dot"></span><span class="orbit-dot"></span><span class="orbit-dot"></span></span> Redirecting to Google...';
                // Redirect entire browser to backend OAuth endpoint with current page return URL
                const returnUrl = window.location.origin + window.location.pathname;
                window.location.href = BACKEND_URL + '/auth/google?redirect_to=' + encodeURIComponent(returnUrl);
            });
        }
    });

    // ── GitHub Login: Redirect to backend which redirects to GitHub's official OAuth
    [DOM.btnGithubLogin, DOM.btnGithubSignup].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Show loading state
                btn.disabled = true;
                btn.innerHTML = '<span class="orbit-spinner" style="display:inline-flex"><span class="orbit-dot"></span><span class="orbit-dot"></span><span class="orbit-dot"></span></span> Redirecting to GitHub...';
                // Redirect entire browser to backend OAuth endpoint with current page return URL
                const returnUrl = window.location.origin + window.location.pathname;
                window.location.href = BACKEND_URL + '/auth/github?redirect_to=' + encodeURIComponent(returnUrl);
            });
        }
    });
}

// ═══════════════════════════════════════════════════════════════════
// 7. THEME CONTROLLER & PERSISTENCE
// ═══════════════════════════════════════════════════════════════════
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (DOM.themeToggleIcon) {
            DOM.themeToggleIcon.className = 'bi bi-sun';
        }
    }

    if (DOM.themeToggleBtn) {
        DOM.themeToggleBtn.addEventListener('click', () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            if (isLight) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
                if (DOM.themeToggleIcon) DOM.themeToggleIcon.className = 'bi bi-moon-stars';
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if (DOM.themeToggleIcon) DOM.themeToggleIcon.className = 'bi bi-sun';
            }
        });
    }
}
