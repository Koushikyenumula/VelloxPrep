/**
 * ═══════════════════════════════════════════════════════════════════
 *  ADMIN DASHBOARD — Controller & Physics Engine
 *  VelloxPrep Platform (Aesthetic & Neural Motion Synchronized)
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

(function () {
    // ── DOM Elements ────────────────────────────────────────────────────
    const DOM = {
        canvas:                 document.getElementById('aiNetworkCanvas'),
        cursorGlow:             document.getElementById('cursorGlow'),
        themeToggleBtn:         document.getElementById('themeToggleBtn'),
        themeToggleIcon:        document.getElementById('themeToggleIcon'),
        currentDateEl:          document.getElementById('currentDate'),

        loadingSkeleton:        document.getElementById('loadingSkeleton'),
        errorState:             document.getElementById('errorState'),
        adminContent:           document.getElementById('adminContent'),

        totalUsersEl:           document.getElementById('totalUsers'),
        totalResumesEl:         document.getElementById('totalResumes'),
        totalSessionsEl:        document.getElementById('totalSessions'),
        averageScoreEl:         document.getElementById('averageScore'),

        userSearch:             document.getElementById('userSearch'),
        usersListBody:          document.getElementById('usersListBody'),
        emptyUsers:             document.getElementById('emptyUsers'),

        deleteUserName:         document.getElementById('deleteUserName'),
        confirmDeleteBtn:       document.getElementById('confirmDeleteBtn')
    };

    const State = {
        isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        currentTheme: localStorage.getItem('theme') || 'dark',
        allUsers: [],
        userToDeleteId: null,
        deleteModalInstance: null
    };

    // ── Initialization ──────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Auth Guard & Role Verification
        const token = (typeof Auth !== 'undefined' && typeof Auth.getToken === 'function') 
            ? Auth.getToken() 
            : localStorage.getItem('token');
        const role = (typeof Auth !== 'undefined' && typeof Auth.getItem === 'function')
            ? Auth.getItem('role')
            : localStorage.getItem('role');

        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        if (role !== 'ADMIN') {
            window.location.href = 'dashboard.html';
            return;
        }

        // 2. Initialize Sidebar
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

        // 5. Delete Modal
        const deleteModalEl = document.getElementById('deleteUserModal');
        if (deleteModalEl && typeof bootstrap !== 'undefined') {
            State.deleteModalInstance = new bootstrap.Modal(deleteModalEl);
        }

        // 6. Bind Events
        if (DOM.confirmDeleteBtn) {
            DOM.confirmDeleteBtn.addEventListener('click', handleDeleteUser);
        }

        if (DOM.userSearch) {
            DOM.userSearch.addEventListener('input', handleSearchFilter);
        }

        // 7. Load Data
        loadAdminData();
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
                ctx.fillStyle = isLight ? 'rgba(239, 68, 68, 0.9)' : 'rgba(248, 113, 113, 0.95)';
                ctx.shadowColor = isLight ? '#ef4444' : '#f87171';
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

    // ── Cursor Ambient Glow ─────────────────────────────────────────────
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

        const cards = document.querySelectorAll('.stat-card, .glass-panel');
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
    // 3. ADMIN DATA ENGINE
    // ═══════════════════════════════════════════════════════════════════
    async function loadAdminData() {
        if (DOM.loadingSkeleton) DOM.loadingSkeleton.classList.remove('d-none');
        if (DOM.errorState) DOM.errorState.classList.add('d-none');
        if (DOM.adminContent) DOM.adminContent.classList.add('d-none');

        try {
            const [stats, users] = await Promise.all([
                API.getAdminStatistics(),
                API.getAdminUsers()
            ]);

            renderStatistics(stats);
            State.allUsers = users || [];
            renderUsers(State.allUsers);

            if (DOM.loadingSkeleton) DOM.loadingSkeleton.classList.add('d-none');
            if (DOM.adminContent) DOM.adminContent.classList.remove('d-none');
        } catch (error) {
            console.error('Failed to load admin data:', error);
            if (DOM.loadingSkeleton) DOM.loadingSkeleton.classList.add('d-none');
            if (DOM.errorState) DOM.errorState.classList.remove('d-none');
        }
    }

    function renderStatistics(stats) {
        if (!stats) return;
        animateCounter(DOM.totalUsersEl, stats.totalUsers || 0);
        animateCounter(DOM.totalResumesEl, stats.totalResumes || 0);
        animateCounter(DOM.totalSessionsEl, stats.totalSessions || 0);
        animateCounter(DOM.averageScoreEl, Math.round(stats.averageScore || 0));
    }

    function renderUsers(users) {
        if (!DOM.usersListBody) return;
        DOM.usersListBody.innerHTML = '';

        if (!users || users.length === 0) {
            if (DOM.emptyUsers) DOM.emptyUsers.classList.remove('d-none');
            return;
        }

        if (DOM.emptyUsers) DOM.emptyUsers.classList.add('d-none');

        users.forEach(user => {
            const tr = document.createElement('tr');

            const name = user.name || 'Anonymous Candidate';
            const initial = name.charAt(0).toUpperCase() || 'U';
            const email = user.email || '—';
            const role = user.role || 'USER';
            const isAdmin = role === 'ADMIN';

            const joinedDate = user.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—';

            const resumeCount = user.totalResumes != null ? user.totalResumes : (user.resumesCount != null ? user.resumesCount : 0);
            const sessionCount = user.totalSessions != null ? user.totalSessions : (user.sessionsCount != null ? user.sessionsCount : 0);

            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <div class="user-avatar-sm" style="width: 36px; height: 36px; border-radius: 50%; background: ${isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)'}; color: ${isAdmin ? '#F87171' : '#A78BFA'}; border: 1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.4)'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">
                            ${initial}
                        </div>
                        <div>
                            <span class="fw-semibold text-white d-block">${escapeHtml(name)}</span>
                            <span class="text-secondary small d-md-none">${escapeHtml(email)}</span>
                        </div>
                    </div>
                </td>
                <td class="text-secondary font-monospace small">${escapeHtml(email)}</td>
                <td>
                    <span class="session-badge ${isAdmin ? 'badge-difficulty-hard' : 'badge-difficulty-easy'} px-2.5 py-1" style="font-size: 0.75rem;">
                        ${isAdmin ? '<i class="bi bi-shield-fill me-1"></i> ADMIN' : '<i class="bi bi-person me-1"></i> CANDIDATE'}
                    </span>
                </td>
                <td class="text-secondary small">${joinedDate}</td>
                <td class="text-center">
                    <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.35rem 0.65rem;">
                        ${resumeCount}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: #A78BFA; border: 1px solid rgba(99, 102, 241, 0.3); padding: 0.35rem 0.65rem;">
                        ${sessionCount}
                    </span>
                </td>
                <td class="text-end">
                    <div class="d-inline-flex align-items-center gap-2 justify-content-end">
                        ${!isAdmin ? `
                            <button class="btn-admin-action btn-admin-action-promote role-toggle-btn" data-id="${user.id}" data-role="ADMIN" data-name="${escapeHtml(name)}" title="Promote to Admin">
                                <i class="bi bi-shield-plus"></i> Make Admin
                            </button>
                            <button class="btn-admin-action btn-admin-action-delete delete-user-btn" data-id="${user.id}" data-name="${escapeHtml(name)}" title="Purge Candidate">
                                <i class="bi bi-trash3-fill"></i>
                            </button>
                        ` : (user.email !== (localStorage.getItem('email') || '') ? `
                            <button class="btn-admin-action btn-admin-action-demote role-toggle-btn" data-id="${user.id}" data-role="USER" data-name="${escapeHtml(name)}" title="Demote to Candidate">
                                <i class="bi bi-shield-minus"></i> Revoke Admin
                            </button>
                            <button class="btn-admin-action btn-admin-action-delete delete-user-btn" data-id="${user.id}" data-name="${escapeHtml(name)}" title="Purge Admin">
                                <i class="bi bi-trash3-fill"></i>
                            </button>
                        ` : `
                            <span class="badge px-3 py-1.5" style="background: rgba(167, 139, 250, 0.15); color: #C4B5FD; border: 1px solid rgba(167, 139, 250, 0.3); font-size: 0.76rem; border-radius: var(--radius-full);">
                                <i class="bi bi-person-check-fill me-1"></i> Current Admin
                            </span>
                        `)}
                    </div>
                </td>
            `;

            DOM.usersListBody.appendChild(tr);
        });

        // Bind delete action buttons
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                openDeleteModal(id, name);
            });
        });

        // Bind role toggle buttons (Make Admin / Revoke Admin)
        document.querySelectorAll('.role-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const newRole = btn.getAttribute('data-role');
                const name = btn.getAttribute('data-name');
                await handleUpdateRole(id, newRole, name, btn);
            });
        });
    }

    async function handleUpdateRole(userId, newRole, userName, btnEl) {
        if (!userId || !newRole) return;

        const actionText = newRole === 'ADMIN' ? 'promoted to Admin' : 'demoted to Candidate';
        const originalContent = btnEl ? btnEl.innerHTML : '';

        try {
            if (btnEl) {
                btnEl.disabled = true;
                btnEl.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Updating…';
            }

            await API.updateUserRole(userId, newRole);

            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show(`Successfully ${actionText} for ${userName || 'user'}.`, 'success');
            }

            // Reload admin data to refresh table and badges
            loadAdminData();
        } catch (error) {
            console.error('Failed to update role:', error);
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show(error.message || `Failed to change role for ${userName}.`, 'danger');
            }
            if (btnEl) {
                btnEl.disabled = false;
                btnEl.innerHTML = originalContent;
            }
        }
    }

    function handleSearchFilter() {
        const query = DOM.userSearch ? DOM.userSearch.value.trim().toLowerCase() : '';
        if (!query) {
            renderUsers(State.allUsers);
            return;
        }

        const filtered = State.allUsers.filter(u => {
            const name = (u.name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            return name.includes(query) || email.includes(query);
        });

        renderUsers(filtered);
    }

    function openDeleteModal(userId, userName) {
        State.userToDeleteId = userId;
        if (DOM.deleteUserName) DOM.deleteUserName.textContent = userName;

        if (State.deleteModalInstance) {
            State.deleteModalInstance.show();
        }
    }

    async function handleDeleteUser() {
        if (!State.userToDeleteId) return;

        const btn = DOM.confirmDeleteBtn;
        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting…';
            }

            await API.deleteAdminUser(State.userToDeleteId);

            if (State.deleteModalInstance) {
                State.deleteModalInstance.hide();
            }

            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show('User and all associated data permanently purged.', 'success');
            }

            // Reload data
            loadAdminData();
        } catch (error) {
            console.error('Failed to delete user:', error);
            if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
                Toast.show(error.message || 'Failed to delete user.', 'danger');
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-trash3-fill me-1"></i> Delete Account';
            }
            State.userToDeleteId = null;
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

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

})();
