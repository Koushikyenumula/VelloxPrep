/**
 * ═══════════════════════════════════════════════════════════════════
 * COMMON COMPONENTS — JavaScript
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
                        <img src="../assets/logo.png" alt="VelloxPrep Logo" style="width: 100%; height: 100%; object-fit: cover; transform: scale(1.35);">
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
                <div class="d-flex gap-2">
                    <button class="sidebar-logout-btn flex-grow-1" id="sidebarLogoutBtn" aria-label="Logout">
                        <i class="bi bi-box-arrow-right"></i>
                        <span>Logout</span>
                    </button>
                    <button class="btn btn-outline-secondary sidebar-theme-toggle" id="themeToggleBtn" aria-label="Toggle Theme" style="border-radius: var(--radius-sm); border-color: var(--border-color); color: var(--text-secondary);">
                        <i class="bi bi-moon-stars-fill" id="themeToggleIcon"></i>
                    </button>
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
