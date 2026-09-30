/**
 * ═══════════════════════════════════════════════════════════════════
 * COMMON COMPONENTS - JavaScript
 * VelloxPrep Platform
 *
 * Handles reusable UI components like the Sidebar and Layout Wrapper.
 * ═══════════════════════════════════════════════════════════════════
 */

// ── Theme Initialization ───────────────────────────────────────────
(function () {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

// ── Sidebar Module ──────────────────────────────────────────────────
const Sidebar = (() => {
    'use strict';

    function init() {
        // 1. Find or create sidebar container
        let sidebarEl = document.getElementById('sidebar');
        if (!sidebarEl) {
            sidebarEl = document.createElement('aside');
            sidebarEl.className = 'sidebar';
            sidebarEl.id = 'sidebar';
            document.body.insertBefore(sidebarEl, document.body.firstChild);
        }

        // 2. Find or create mobile overlay
        let overlayEl = document.getElementById('sidebarOverlay');
        if (!overlayEl) {
            overlayEl = document.createElement('div');
            overlayEl.className = 'sidebar-overlay';
            overlayEl.id = 'sidebarOverlay';
            document.body.appendChild(overlayEl);
        }

        // 3. Retrieve user profiling
        const email = localStorage.getItem('email') || 'user@email.com';
        const rawName = localStorage.getItem('name') || email.split('@')[0];
        const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

        const profileImgUrl = localStorage.getItem('profileImageUrl');
        const avatarContent = profileImgUrl && profileImgUrl !== 'null' && profileImgUrl !== 'undefined'
            ? `<img src="${profileImgUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : `<i class="bi bi-person-fill"></i>`;

        // 4. Inject sidebar structure
        sidebarEl.innerHTML = `
            <div class="sidebar-header">
                <div class="sidebar-brand">
                    <div class="sidebar-brand-icon" style="overflow: hidden; background: none; box-shadow: none;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                            <rect width="100" height="100" rx="22" fill="var(--accent)" />
                            <path d="M28 32 L50 78 L72 32" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                        </svg>
                    </div>
                    <span class="sidebar-brand-text">VelloxPrep</span>
                </div>
                <button class="sidebar-collapse-btn d-none d-lg-flex" id="sidebarCollapseBtn" aria-label="Collapse sidebar">
                    <i class="bi bi-chevron-left"></i>
                </button>
                <button class="sidebar-close-btn d-lg-none" id="sidebarCloseBtn" aria-label="Close sidebar">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <nav class="sidebar-nav">
                <ul class="sidebar-menu">
                    <li class="sidebar-menu-item" data-page="dashboard">
                        <a href="dashboard.html" class="sidebar-link">
                            <i class="bi bi-grid-1x2-fill"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li class="sidebar-menu-item" data-page="resume">
                        <a href="resume.html" class="sidebar-link">
                            <i class="bi bi-file-earmark-text-fill"></i>
                            <span>Resume Management</span>
                        </a>
                    </li>
                    <li class="sidebar-menu-item" data-page="interview-generate">
                        <a href="interview-generate.html" class="sidebar-link">
                            <i class="bi bi-cpu-fill"></i>
                            <span>Standard Interview</span>
                        </a>
                    </li>
                    <li class="sidebar-menu-item" data-page="resume-interview">
                        <a href="resume-interview.html" class="sidebar-link">
                            <i class="bi bi-file-person-fill"></i>
                            <span>Resume Interview</span>
                        </a>
                    </li>
                    <li class="sidebar-menu-item" data-page="coding-generate">
                        <a href="coding-generate.html" class="sidebar-link">
                            <i class="bi bi-code-square"></i>
                            <span>Mock Coding Test</span>
                        </a>
                    </li>
                    <li class="sidebar-menu-item" data-page="interview-history">
                        <a href="results.html" class="sidebar-link">
                            <i class="bi bi-clock-history"></i>
                            <span>Interview History</span>
                        </a>
                    </li>
                    <li class="sidebar-menu-item" data-page="profile">
                        <a href="profile.html" class="sidebar-link">
                            <i class="bi bi-person-badge-fill"></i>
                            <span>Profile</span>
                        </a>
                    </li>
                    ${localStorage.getItem('role') === 'ADMIN' ? `
                    <li class="sidebar-menu-item mt-4" data-page="admin">
                        <a href="admin.html" class="sidebar-link" style="color: var(--danger);">
                            <i class="bi bi-shield-lock-fill"></i>
                            <span>Admin Panel</span>
                        </a>
                    </li>
                    ` : ''}
                </ul>
            </nav>

            <div class="sidebar-footer">
                <div class="sidebar-user mb-3">
                    <div class="sidebar-user-avatar">
                        ${avatarContent}
                    </div>
                    <div class="sidebar-user-info">
                        <span class="sidebar-user-name">${displayName}</span>
                        <span class="sidebar-user-email">${email}</span>
                    </div>
                </div>
                <div class="d-flex gap-2 mb-2">
                    <button class="sidebar-logout-btn flex-grow-1" id="sidebarLogoutBtn" aria-label="Logout">
                        <i class="bi bi-box-arrow-right"></i>
                        <span>Logout</span>
                    </button>
                </div>
                <div class="sidebar-creator d-flex flex-column align-items-center gap-1">
                    <div>
                        <i class="bi bi-code-slash"></i>
                        <span>Created by <a href="https://www.linkedin.com/in/koushik25/" target="_blank" style="text-decoration: none; color: inherit;"><strong>Koushik Yenumula</strong></a></span>
                    </div>
                    <span class="badge" style="background: var(--bg-base); color: var(--text-muted); border: 1px solid var(--border-color); font-weight: 500; font-size: 0.65rem;">v1.2</span>
                </div>
                <div class="sidebar-legal-links d-flex justify-content-center gap-3 mt-3" style="font-size: 0.75rem;">
                    <a href="privacy.html" class="text-secondary text-decoration-none hover-accent">Privacy</a>
                    <a href="terms.html" class="text-secondary text-decoration-none hover-accent">Terms</a>
                </div>
            </div>
        `;

        // 5. Highlight current page
        highlightActivePage();

        // 6. Bind click events
        bindEvents(sidebarEl, overlayEl);

        // 7. Apply saved collapsible preference from localStorage
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    }

    function highlightActivePage() {
        const path = window.location.pathname.toLowerCase();
        const params = new URLSearchParams(window.location.search);

        let activePage = '';
        if (path.includes('dashboard.html')) {
            activePage = 'dashboard';
        } else if (path.includes('resume.html')) {
            activePage = 'resume';
        } else if (path.includes('interview-generate.html') || path.includes('interview-session.html')) {
            activePage = 'interview-generate';
        } else if (path.includes('resume-interview.html')) {
            activePage = 'resume-interview';
        } else if (path.includes('coding-generate.html') || path.includes('coding-session.html') || path.includes('coding-results.html')) {
            activePage = 'coding-generate';
        } else if (path.includes('results.html')) {
            if (params.get('id')) {
                activePage = 'results';
            } else {
                activePage = 'interview-history';
            }
        } else if (path.includes('profile.html')) {
            activePage = 'profile';
        } else if (path.includes('admin.html')) {
            activePage = 'admin';
        }

        const menuItems = document.querySelectorAll('.sidebar-menu-item');
        menuItems.forEach(item => {
            if (item.getAttribute('data-page') === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function bindEvents(sidebarEl, overlayEl) {
        // Toggle mobile menu drawer open
        const toggleBtn = document.getElementById('sidebarToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebarEl.classList.add('open');
                overlayEl.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        // Toggle mobile menu drawer closed
        const closeBtn = document.getElementById('sidebarCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                sidebarEl.classList.remove('open');
                overlayEl.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        // Overlay overlay backdrop click close
        overlayEl.addEventListener('click', () => {
            sidebarEl.classList.remove('open');
            overlayEl.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Desktop sidebar collapsing
        const collapseBtn = document.getElementById('sidebarCollapseBtn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-collapsed');
                const isCollapsed = document.body.classList.contains('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            });
        }

        // User profile logout
        const logoutBtn = document.getElementById('sidebarLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                injectLogoutModal();

                const modalEl = document.getElementById('logoutConfirmModal');
                const modal = new bootstrap.Modal(modalEl);
                modal.show();

                const confirmBtn = document.getElementById('confirmLogoutBtn');
                if (confirmBtn) {
                    confirmBtn.onclick = () => {
                        modal.hide();
                        Auth.removeToken();
                        localStorage.clear();
                        window.location.href = 'login.html';
                    };
                }
            });
        }

        // Theme Toggle
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) {
            const icon = document.getElementById('themeToggleIcon');

            // Set initial icon
            if (document.documentElement.getAttribute('data-theme') === 'light') {
                icon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
            }

            themeToggleBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                if (currentTheme === 'light') {
                    document.documentElement.removeAttribute('data-theme');
                    localStorage.setItem('theme', 'dark');
                    icon.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
                } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                    localStorage.setItem('theme', 'light');
                    icon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
                }
            });
        }
    }

    function injectLogoutModal() {
        if (document.getElementById('logoutConfirmModal')) return;

        const modalHtml = `
            <div class="modal fade" id="logoutConfirmModal" tabindex="-1" aria-labelledby="logoutConfirmModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content premium-modal">
                        <!-- Glowing Icon Badge -->
                        <div class="modal-icon-badge badge-primary">
                            <i class="bi bi-box-arrow-right"></i>
                        </div>

                        <!-- Modal Header & Content -->
                        <div class="modal-header-clean">
                            <h3 class="modal-title-clean" id="logoutConfirmModalLabel">Confirm Logout</h3>
                            <p class="modal-desc-clean">
                                Are you sure you want to end your practice session and securely log out of VelloxPrep?
                            </p>
                        </div>

                        <!-- Modal Actions -->
                        <div class="modal-actions-clean">
                            <button type="button" class="btn-modal-cancel" data-bs-dismiss="modal">
                                Cancel
                            </button>
                            <button type="button" class="btn-modal-confirm-primary" id="confirmLogoutBtn">
                                <i class="bi bi-box-arrow-right me-1"></i> Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    return {
        init: init
    };
})();

// ── Global Toast Notification Component ─────────────────────────────
const Toast = (() => {
    'use strict';

    function injectToastContainer() {
        if (document.getElementById('toastContainer')) return;
        const containerHtml = `
            <div class="toast-container" id="toastContainer"></div>
        `;
        document.body.insertAdjacentHTML('beforeend', containerHtml);
    }

    function show(message, type = 'success') {
        injectToastContainer();
        const container = document.getElementById('toastContainer');

        const iconMap = {
            success: 'bi-check-lg',
            danger:  'bi-exclamation-triangle-fill',
            warning: 'bi-exclamation-circle-fill',
            info:    'bi-info-circle-fill'
        };

        const icon = iconMap[type] || 'bi-info-circle-fill';
        const toastId = 'toast_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

        const toastHtml = `
            <div class="custom-toast" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-content-wrap">
                    <div class="toast-icon-badge badge-toast-${type}">
                        <i class="bi ${icon}"></i>
                    </div>
                    <div class="toast-text-wrap">
                        ${message}
                    </div>
                    <button type="button" class="toast-close-btn" aria-label="Close">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="toast-countdown-bar countdown-${type}"></div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', toastHtml);

        const toastEl = document.getElementById(toastId);
        if (!toastEl) return;

        const closeBtn = toastEl.querySelector('.toast-close-btn');
        let removeTimeout;

        const dismiss = () => {
            clearTimeout(removeTimeout);
            toastEl.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            toastEl.style.opacity = '0';
            toastEl.style.transform = 'translateX(40px) scale(0.92)';
            setTimeout(() => {
                toastEl.remove();
            }, 300);
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', dismiss);
        }

        removeTimeout = setTimeout(dismiss, 3800);
    }

    return {
        show: show
    };
})();

// ═══════════════════════════════════════════════════════════════════
// GLOBAL VISUAL & NEURAL PHYSICS ENGINE (HIGH-PERFORMANCE / MOBILE OPTIMIZED)
// ═══════════════════════════════════════════════════════════════════
const VisualEngine = (() => {
    'use strict';

    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth < 768);
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initTheme(toggleBtnId = 'themeToggleBtn', toggleIconId = 'themeToggleIcon') {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme, toggleIconId);

        const btn = document.getElementById(toggleBtnId);
        if (btn) {
            btn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
                const next = current === 'light' ? 'dark' : 'light';
                applyTheme(next, toggleIconId);
            });
        }
    }

    function applyTheme(theme, toggleIconId = 'themeToggleIcon') {
        const icon = document.getElementById(toggleIconId);
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            if (icon) icon.className = 'bi bi-sun-fill';
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (icon) icon.className = 'bi bi-moon-stars';
        }
        localStorage.setItem('theme', theme);
    }

    function initCanvasNetwork(canvasId = 'aiNetworkCanvas') {
        const canvas = document.getElementById(canvasId);
        if (!canvas || isReducedMotion) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        let width = 0;
        let height = 0;
        const mobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth < 768);
        const dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);

        let nodes = [];
        let pulses = [];
        const MAX_NODES = mobile ? 14 : Math.min(Math.floor((window.innerWidth * window.innerHeight) / 14000), 80);
        const CONNECT_DIST = mobile ? 80 : 140;
        const MAX_PULSES = mobile ? 0 : 8;

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
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            initNodes();
        }

        function initNodes() {
            nodes = [];
            for (let i = 0; i < MAX_NODES; i++) {
                const depth = 0.4 + Math.random() * 0.6;
                nodes.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * (mobile ? 0.12 : 0.22) * depth,
                    vy: (Math.random() - 0.5) * (mobile ? 0.12 : 0.22) * depth,
                    radius: (1.2 + Math.random() * 1.5) * depth,
                    depth: depth,
                    alpha: 0.15 + depth * 0.45
                });
            }
        }

        if (!mobile) {
            window.addEventListener('mousemove', (e) => {
                mouse.targetX = e.clientX;
                mouse.targetY = e.clientY;
            }, { passive: true });
        }

        function spawnPulse(nodeA, nodeB) {
            if (pulses.length >= MAX_PULSES) return;
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

        let isScrolling = false;
        let scrollTimeout = null;
        if (mobile) {
            window.addEventListener('scroll', () => {
                isScrolling = true;
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => { isScrolling = false; }, 90);
            }, { passive: true });
        }

        function render() {
            requestAnimationFrame(render);
            if (!isVisible || isScrolling) return;

            if (!mobile) {
                mouse.x += (mouse.targetX - mouse.x) * 0.04;
                mouse.y += (mouse.targetY - mouse.y) * 0.04;
            }

            const offsetX = mobile ? 0 : (mouse.x - width / 2) / (width / 2);
            const offsetY = mobile ? 0 : (mouse.y - height / 2) / (height / 2);

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

                        if (!mobile && Math.random() < 0.0003) {
                            spawnPulse(na, nb);
                        }
                    }
                }
            }

            // Pulses
            if (!mobile && MAX_PULSES > 0) {
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
                    ctx.fill();
                }
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

    function initCursorGlow(glowId = 'cursorGlow') {
        const glow = document.getElementById(glowId);
        if (!glow || isReducedMotion || isTouchDevice || window.innerWidth < 1024) return;

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

    function initCardSpotlights(selector = '.stat-card, .quick-action-card, .glass-panel, .eval-card, .stat-mini-box') {
        if (isReducedMotion || isTouchDevice || window.innerWidth < 992) return;

        const cards = document.querySelectorAll(selector);
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

    function initScrollReveal(selector = '.scroll-reveal, .reveal-from-left, .reveal-from-right, .reveal-from-bottom') {
        const revealElements = document.querySelectorAll(selector);
        if (!revealElements.length) return;

        if (isReducedMotion || isTouchDevice || !('IntersectionObserver' in window)) {
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

    function initAll() {
        initTheme();
        initCanvasNetwork();
        initCursorGlow();
        initCardSpotlights();
        initScrollReveal();
    }

    return {
        initAll: initAll,
        initTheme: initTheme,
        initCanvasNetwork: initCanvasNetwork,
        initCursorGlow: initCursorGlow,
        initCardSpotlights: initCardSpotlights,
        initScrollReveal: initScrollReveal,
        isTouchDevice: isTouchDevice
    };
})();

