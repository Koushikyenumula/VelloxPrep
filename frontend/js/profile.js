/**
 * ═══════════════════════════════════════════════════════════════════
 *  CANDIDATE PROFILE — Controller & Physics Engine
 *  VelloxPrep Platform (Aesthetic & Neural Motion Synchronized)
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

(function () {
    // ── DOM References ──────────────────────────────────────────────────
    const DOM = {
        canvas:                 document.getElementById('aiNetworkCanvas'),
        cursorGlow:             document.getElementById('cursorGlow'),
        themeToggleBtn:         document.getElementById('themeToggleBtn'),
        themeToggleIcon:        document.getElementById('themeToggleIcon'),
        currentDateEl:          document.getElementById('currentDate'),

        profileName:            document.getElementById('profileName'),
        profileEmail:           document.getElementById('profileEmail'),
        profileRole:            document.getElementById('profileRole'),
        profileInitials:        document.getElementById('profileInitials'),
        profileImage:           document.getElementById('profileImage'),
        profileAvatarContainer: document.getElementById('profileAvatarContainer'),
        profileJoinedDate:      document.getElementById('profileJoinedDate'),

        statsSkeleton:          document.getElementById('statsSkeleton'),
        statsContent:           document.getElementById('statsContent'),
        statInterviews:         document.getElementById('statInterviews'),
        statAverage:            document.getElementById('statAverage'),
        statBest:               document.getElementById('statBest'),
        statResumes:            document.getElementById('statResumes'),

        editProfileForm:        document.getElementById('editProfileForm'),
        editProfileName:        document.getElementById('editProfileName'),
        editProfileImage:       document.getElementById('editProfileImage'),
        saveProfileBtn:         document.getElementById('saveProfileBtn'),

        changePasswordForm:     document.getElementById('changePasswordForm'),
        oldPassword:            document.getElementById('oldPassword'),
        newPassword:            document.getElementById('newPassword'),
        confirmPassword:        document.getElementById('confirmPassword'),
        savePasswordBtn:        document.getElementById('savePasswordBtn')
    };

    const State = {
        isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        currentTheme: localStorage.getItem('theme') || 'dark'
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

        // 2. Initialize Reusable Sidebar
        if (typeof Sidebar !== 'undefined' && typeof Sidebar.init === 'function') {
            Sidebar.init();
        }

        // 3. Visual Engine
        initTheme();
        initCanvasNetwork();
        initCursorGlow();
        initCardSpotlights();
        initScrollReveal();

        // 4. Live Date
        setCurrentDate();

        // 5. Populate Profile Data
        populateProfileData();

        // 6. Fetch Performance Stats
        loadPerformanceStats();

        // 7. Bind Modal Forms
        if (DOM.changePasswordForm) {
            DOM.changePasswordForm.addEventListener('submit', handleChangePassword);
        }
        if (DOM.oldPassword) {
            DOM.oldPassword.addEventListener('input', () => DOM.oldPassword.classList.remove('is-invalid'));
        }
        if (DOM.confirmPassword) {
            DOM.confirmPassword.addEventListener('input', () => DOM.confirmPassword.classList.remove('is-invalid'));
        }
        if (DOM.editProfileForm) {
            DOM.editProfileForm.addEventListener('submit', handleEditProfile);
        }
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

            // Pulses
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

        const cards = document.querySelectorAll('.stat-mini-box, .glass-panel, .dashboard-hero-banner');
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
            threshold: 0.08
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
    // 3. PROFILE DATA & PERFORMANCE
    // ═══════════════════════════════════════════════════════════════════
    function populateProfileData() {
        const name = localStorage.getItem('name') || 'Candidate';
        const email = localStorage.getItem('email') || 'candidate@velloxprep.com';
        const role = localStorage.getItem('role') || 'Candidate';
        const imageUrl = localStorage.getItem('profileImageUrl');

        if (DOM.profileName) DOM.profileName.textContent = name.charAt(0).toUpperCase() + name.slice(1);
        if (DOM.profileEmail) DOM.profileEmail.textContent = email;
        if (DOM.profileRole) DOM.profileRole.textContent = role;

        if (DOM.profileInitials) {
            DOM.profileInitials.textContent = name.charAt(0).toUpperCase() || 'U';
        }

        if (imageUrl && DOM.profileImage && DOM.profileInitials) {
            DOM.profileImage.src = imageUrl;
            DOM.profileImage.classList.remove('d-none');
            DOM.profileInitials.classList.add('d-none');
        } else if (DOM.profileImage && DOM.profileInitials) {
            DOM.profileImage.classList.add('d-none');
            DOM.profileInitials.classList.remove('d-none');
        }

        if (DOM.profileJoinedDate) {
            const createdAt = localStorage.getItem('createdAt');
            if (createdAt) {
                const date = new Date(createdAt);
                DOM.profileJoinedDate.textContent = date.toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                });
            } else {
                DOM.profileJoinedDate.textContent = 'Active Member';
            }
        }

        if (DOM.editProfileName) {
            DOM.editProfileName.value = name;
        }
    }

    async function loadPerformanceStats() {
        try {
            const data = await API.getDashboard();

            if (DOM.statsSkeleton) DOM.statsSkeleton.classList.add('d-none');
            if (DOM.statsContent) DOM.statsContent.classList.remove('d-none');

            animateCounter(DOM.statInterviews, data.totalInterviews || 0);
            animateCounter(DOM.statAverage, Math.round(data.averageScore || 0));
            animateCounter(DOM.statBest, Math.round(data.highestScore || 0));
            animateCounter(DOM.statResumes, data.totalResumes || 0);

        } catch (error) {
            console.error('Error fetching performance stats:', error);
            if (DOM.statsSkeleton) DOM.statsSkeleton.classList.add('d-none');
            if (DOM.statsContent) DOM.statsContent.classList.remove('d-none');
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. MODAL ACTIONS
    // ═══════════════════════════════════════════════════════════════════
    async function handleEditProfile(event) {
        event.preventDefault();

        const nameInput = DOM.editProfileName ? DOM.editProfileName.value.trim() : '';
        const fileInput = DOM.editProfileImage;
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        const btn = DOM.saveProfileBtn;

        if (!nameInput && !file) {
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('Please provide a name or select an image to update.', 'warning');
            }
            return;
        }

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving…';
            }

            const result = await API.updateProfile(nameInput, file);

            if (result && result.name) {
                localStorage.setItem('name', result.name);
            }
            if (result && result.profileImageUrl) {
                localStorage.setItem('profileImageUrl', 'https://velloxprep.onrender.com' + result.profileImageUrl);
            }

            const modalEl = document.getElementById('editProfileModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('Profile updated successfully!', 'success');
            }
            
            if (DOM.editProfileForm) DOM.editProfileForm.reset();
            populateProfileData();

            // Direct Sidebar DOM Update
            const sidebarNameEl = document.querySelector('.sidebar-user-name');
            if (sidebarNameEl) {
                const rawName = localStorage.getItem('name') || '';
                sidebarNameEl.textContent = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            }

        } catch (err) {
            console.error('Update profile error:', err);
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show(err.message || 'Failed to update profile.', 'danger');
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Save Changes';
            }
        }
    }

    async function handleChangePassword(event) {
        event.preventDefault();

        const oldPwd = DOM.oldPassword ? DOM.oldPassword.value : '';
        const newPwd = DOM.newPassword ? DOM.newPassword.value : '';
        const confirmPwd = DOM.confirmPassword ? DOM.confirmPassword.value : '';
        const btn = DOM.savePasswordBtn;

        if (DOM.oldPassword) DOM.oldPassword.classList.remove('is-invalid');
        if (DOM.confirmPassword) DOM.confirmPassword.classList.remove('is-invalid');

        if (newPwd !== confirmPwd) {
            if (DOM.confirmPassword) DOM.confirmPassword.classList.add('is-invalid');
            return;
        }

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating…';
            }

            await API.changePassword(oldPwd, newPwd);

            const modalEl = document.getElementById('changePasswordModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('Password updated successfully!', 'success');
            }

            if (DOM.changePasswordForm) DOM.changePasswordForm.reset();

        } catch (err) {
            console.error('Password change error:', err);
            const msg = err.message || 'Incorrect current password.';

            if (DOM.oldPassword) {
                DOM.oldPassword.classList.add('is-invalid');
                const errEl = document.getElementById('oldPasswordError');
                if (errEl) errEl.textContent = msg;
            }

            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show(msg, 'danger');
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Update Password';
            }
        }
    }

    function animateCounter(element, targetValue, duration = 800) {
        if (!element) return;
        const target = Number(targetValue) || 0;
        const start = 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (target - start) * easeOut);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        }

        requestAnimationFrame(updateCounter);
    }

})();
