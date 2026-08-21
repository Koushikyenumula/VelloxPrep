/**
 * ═══════════════════════════════════════════════════════════════════
 *  STANDARD INTERVIEW GENERATE — Controller & Animation Engine
 *  VelloxPrep Platform (Aesthetic & Neural Motion Synchronized)
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

(function () {
    // ── DOM References ──────────────────────────────────────────────────
    const DOM = {
        canvas:            document.getElementById('aiNetworkCanvas'),
        cursorGlow:        document.getElementById('cursorGlow'),
        themeToggleBtn:    document.getElementById('themeToggleBtn'),
        themeToggleIcon:   document.getElementById('themeToggleIcon'),
        currentDateEl:     document.getElementById('currentDate'),

        // Form elements
        generateForm:      document.getElementById('generateForm'),
        skillSelect:       document.getElementById('skillSelect'),
        skillError:        document.getElementById('skillError'),
        difficultyError:   document.getElementById('difficultyError'),
        generateBtn:       document.getElementById('generateBtn'),
        btnText:           document.getElementById('btnText'),
        btnLoader:         document.getElementById('btnLoader'),
        alertContainer:    document.getElementById('alertContainer')
    };

    const State = {
        isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        currentTheme: localStorage.getItem('theme') || 'dark',
        isSubmitting: false
    };

    // ── Initialization ──────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Auth Guard
        const token = (typeof Auth !== 'undefined' && typeof Auth.getToken === 'function') 
            ? Auth.getToken() 
            : localStorage.getItem('token');

        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // 2. Initialize Common Sidebar
        if (typeof Sidebar !== 'undefined' && typeof Sidebar.init === 'function') {
            Sidebar.init();
        }

        // 3. Visual Engine
        initTheme();
        initCanvasNetwork();
        initCursorGlow();
        initCardSpotlights();
        initScrollReveal();

        // 4. Set Dynamic User Information & Live Date
        setCurrentDate();

        // 5. Form & Selection Events
        bindFormEvents();
    });

    // ═══════════════════════════════════════════════════════════════════
    // 1. THEME ENGINE & SYNCHRONIZATION
    // ═══════════════════════════════════════════════════════════════════
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);

        if (DOM.themeToggleBtn) {
            DOM.themeToggleBtn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
                const next = current === 'light' ? 'dark' : 'light';
                applyTheme(next);
            });
        }
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            if (DOM.themeToggleIcon) DOM.themeToggleIcon.className = 'bi bi-sun-fill';
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (DOM.themeToggleIcon) DOM.themeToggleIcon.className = 'bi bi-moon-stars';
        }
        localStorage.setItem('theme', theme);
        State.currentTheme = theme;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. ATMOSPHERIC NEURAL NETWORK CANVAS
    // ═══════════════════════════════════════════════════════════════════
    function initCanvasNetwork() {
        const canvas = DOM.canvas;
        if (!canvas || State.isReducedMotion) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        let width = 0;
        let height = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);

        let nodes = [];
        let pulses = [];
        const MAX_NODES = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 14000), 85);
        const CONNECT_DIST = 140;

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
                const depth = 0.4 + Math.random() * 0.6;
                nodes.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.22 * depth,
                    vy: (Math.random() - 0.5) * 0.22 * depth,
                    radius: (1.2 + Math.random() * 1.5) * depth,
                    depth: depth,
                    alpha: 0.15 + depth * 0.45
                });
            }
        }

        window.addEventListener('mousemove', (e) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
        }, { passive: true });

        function spawnPulse(nodeA, nodeB) {
            if (pulses.length > 8) return;
            pulses.push({
                startX: nodeA.x,
                startY: nodeA.y,
                endX: nodeB.x,
                endY: nodeB.y,
                progress: 0,
                speed: 0.015 + Math.random() * 0.015
            });
        }

        let isVisible = true;
        document.addEventListener('visibilitychange', () => {
            isVisible = !document.hidden;
        });

        function render() {
            requestAnimationFrame(render);
            if (!isVisible) return;

            mouse.x += (mouse.targetX - mouse.x) * 0.04;
            mouse.y += (mouse.targetY - mouse.y) * 0.04;

            const offsetX = (mouse.x - width / 2) / (width / 2);
            const offsetY = (mouse.y - height / 2) / (height / 2);

            ctx.clearRect(0, 0, width, height);

            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const nodeColor = isLight ? 'rgba(70, 85, 125,' : 'rgba(180, 195, 235,';
            const lineColor = isLight ? 'rgba(100, 120, 170,' : 'rgba(140, 160, 215,';

            // Lines
            for (let i = 0; i < nodes.length; i++) {
                const na = nodes[i];
                const posX = na.x + offsetX * 15 * na.depth;
                const posY = na.y + offsetY * 15 * na.depth;

                for (let j = i + 1; j < nodes.length; j++) {
                    const nb = nodes[j];
                    const pbx = nb.x + offsetX * 15 * nb.depth;
                    const pby = nb.y + offsetY * 15 * nb.depth;

                    const dx = posX - pbx;
                    const dy = posY - pby;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONNECT_DIST) {
                        const alpha = (1 - dist / CONNECT_DIST) * 0.18 * na.depth * nb.depth;
                        ctx.beginPath();
                        ctx.moveTo(posX, posY);
                        ctx.lineTo(pbx, pby);
                        ctx.strokeStyle = `${lineColor} ${alpha})`;
                        ctx.lineWidth = 0.75;
                        ctx.stroke();

                        if (Math.random() < 0.0003) {
                            spawnPulse(na, nb);
                        }
                    }
                }
            }

            // Synaptic Pulses
            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i];
                p.progress += p.speed;

                if (p.progress >= 1) {
                    pulses.splice(i, 1);
                    continue;
                }

                const curX = p.startX + (p.endX - p.startX) * p.progress;
                const curY = p.startY + (p.endY - p.startY) * p.progress;

                ctx.beginPath();
                ctx.arc(curX, curY, 2.2, 0, Math.PI * 2);
                ctx.fillStyle = isLight ? 'rgba(99, 102, 241, 0.9)' : 'rgba(167, 139, 250, 0.95)';
                ctx.shadowColor = isLight ? '#6366f1' : '#a78bfa';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Nodes
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                n.x += n.vx;
                n.y += n.vy;

                if (n.x < 0) n.x = width;
                else if (n.x > width) n.x = 0;
                if (n.y < 0) n.y = height;
                else if (n.y > height) n.y = 0;

                const posX = n.x + offsetX * 15 * n.depth;
                const posY = n.y + offsetY * 15 * n.depth;

                ctx.beginPath();
                ctx.arc(posX, posY, n.radius, 0, Math.PI * 2);
                ctx.fillStyle = `${nodeColor} ${n.alpha})`;
                ctx.fill();
            }
        }

        window.addEventListener('resize', resize, { passive: true });
        resize();
        requestAnimationFrame(render);
    }

    // ── Desktop Cursor Ambient Glow ─────────────────────────────────────
    function initCursorGlow() {
        const glow = DOM.cursorGlow;
        if (!glow || State.isReducedMotion || window.innerWidth < 1024) return;

        let glowX = window.innerWidth / 2;
        let glowY = window.innerHeight / 2;
        let targetX = glowX;
        let targetY = glowY;
        let isVisible = false;

        window.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
            if (!isVisible) {
                isVisible = true;
                glow.style.opacity = '1';
            }
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            isVisible = false;
            glow.style.opacity = '0';
        });

        function updateGlow() {
            glowX += (targetX - glowX) * 0.12;
            glowY += (targetY - glowY) * 0.12;
            glow.style.left = `${glowX}px`;
            glow.style.top  = `${glowY}px`;
            requestAnimationFrame(updateGlow);
        }
        requestAnimationFrame(updateGlow);
    }

    // ── Interactive Card Mouse Follower Spotlight ───────────────────────
    function initCardSpotlights() {
        if (State.isReducedMotion || window.innerWidth < 992) return;

        const cards = document.querySelectorAll('.generate-card, .glass-panel, .dashboard-hero-banner, .quick-action-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }, { passive: true });
        });
    }

    // ── Viewport Scroll Reveal Engine ───────────────────────────────────
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.scroll-reveal, .reveal-from-left, .reveal-from-right, .reveal-from-bottom');
        if (!revealElements.length) return;

        if (State.isReducedMotion || !('IntersectionObserver' in window)) {
            revealElements.forEach(el => el.classList.add('revealed'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -40px 0px',
            threshold: 0.10
        });

        revealElements.forEach(el => observer.observe(el));
    }

    function setCurrentDate() {
        if (DOM.currentDateEl) {
            DOM.currentDateEl.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. FORM VALIDATION & GENERATION DISPATCH
    // ═══════════════════════════════════════════════════════════════════
    function bindFormEvents() {
        if (!DOM.generateForm) return;

        DOM.generateForm.addEventListener('submit', handleGenerate);

        if (DOM.skillSelect) {
            DOM.skillSelect.addEventListener('change', () => {
                DOM.skillSelect.classList.remove('is-invalid');
                DOM.skillSelect.classList.add('is-valid');
            });
        }

        document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (DOM.difficultyError) DOM.difficultyError.classList.remove('show');
            });
        });
    }

    async function handleGenerate(event) {
        event.preventDefault();
        clearAlert();

        if (State.isSubmitting) return;

        // 1. Validate Form
        if (!validateForm()) return;

        // 2. Set Loading State
        setLoading(true);

        const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
        const selectedTestType = document.querySelector('input[name="testType"]:checked');
        
        const payload = {
            skill:      DOM.skillSelect.value,
            difficulty: selectedDifficulty ? selectedDifficulty.value : 'Medium',
            resumeId:   null
        };

        try {
            if (selectedTestType && selectedTestType.value === 'MCQ') {
                const data = await API.generateMcq(payload.skill, payload.difficulty, 5);
                
                if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                    Toast.show(`MCQ Quiz created! Initializing questions…`, 'success');
                }
                
                setTimeout(() => {
                    window.location.href = `mcq-session.html?id=${data.id}`;
                }, 1000);
            } else {
                const data = await API.generateInterview(payload.skill, payload.difficulty, payload.resumeId);
                
                if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                    Toast.show(`Session created! ${data.totalQuestions || ''} ${data.skill || ''} questions generated.`, 'success');
                }

                setTimeout(() => {
                    window.location.href = `interview-session.html?id=${data.sessionId}`;
                }, 1000);
            }
        } catch (error) {
            console.error('Interview Generation error:', error);
            const message = error.message || 'Failed to generate interview questions. Please try again.';
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show(message, 'danger');
            } else {
                showAlert(message, 'danger');
            }
            setLoading(false);
        }
    }

    function validateForm() {
        let isValid = true;

        if (!DOM.skillSelect || !DOM.skillSelect.value) {
            if (DOM.skillSelect) {
                DOM.skillSelect.classList.add('is-invalid');
                DOM.skillSelect.classList.remove('is-valid');
            }
            isValid = false;
        }

        const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
        if (!selectedDifficulty) {
            if (DOM.difficultyError) DOM.difficultyError.classList.add('show');
            isValid = false;
        }

        return isValid;
    }

    function setLoading(isLoading) {
        State.isSubmitting = isLoading;
        if (!DOM.generateBtn) return;

        DOM.generateBtn.disabled = isLoading;
        if (DOM.btnText) DOM.btnText.classList.toggle('d-none', isLoading);
        if (DOM.btnLoader) DOM.btnLoader.classList.toggle('d-none', !isLoading);
    }

    function showAlert(message, type = 'danger') {
        if (!DOM.alertContainer) return;
        DOM.alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <div>${message}</div>
                <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }

    function clearAlert() {
        if (DOM.alertContainer) DOM.alertContainer.innerHTML = '';
    }

})();
