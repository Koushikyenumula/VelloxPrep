/**
 * ═══════════════════════════════════════════════════════════════════
 * GLOBAL AUTHENTICATION MODULE — JavaScript
 * VelloxPrep Platform
 * ═══════════════════════════════════════════════════════════════════
 */

const Auth = (() => {
    'use strict';

    function saveToken(token, email, role, name, createdAt, profileImageUrl) {
        localStorage.setItem('token', token);
        localStorage.setItem('email', email);
        if (role) {
            localStorage.setItem('role', role);
        }
        if (name) {
            localStorage.setItem('name', name);
        }
        if (createdAt) {
            localStorage.setItem('createdAt', createdAt);
        }
        if (profileImageUrl) {
            localStorage.setItem('profileImageUrl', 'http://localhost:8080' + profileImageUrl);
        }
    }

    function getToken() {
        return localStorage.getItem('token');
    }

    function removeToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        localStorage.removeItem('createdAt');
        localStorage.removeItem('profileImageUrl');
    }

    function checkGuard() {
        const path = window.location.pathname.toLowerCase();
        const hasToken = !!getToken();
        
        // Handle root path routing
        if (path === '/' || path === '/pages/' || path === '/pages') {
            if (hasToken) {
                window.location.href = 'pages/dashboard.html';
            } else {
                window.location.href = 'pages/login.html';
            }
            return;
        }

        const isPublicPage = path.includes('login.html') || path.includes('register.html');
        
        if (isPublicPage && hasToken) {
            window.location.href = 'dashboard.html';
            return;
        }

        if (!isPublicPage && !hasToken) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Run guard check immediately upon script inclusion
    checkGuard();

    return {
        saveToken: saveToken,
        getToken: getToken,
        removeToken: removeToken,
        checkGuard: checkGuard
    };
})();

// ── Global window.fetch Interceptor ─────────────────────────────────
(() => {
    'use strict';

    const originalFetch = window.fetch;
    
    window.fetch = async (url, options = {}) => {
        const token = Auth.getToken();
        
        if (token) {
            options.headers = options.headers || {};
            if (options.headers instanceof Headers) {
                if (!options.headers.has('Authorization') && !options.headers.has('authorization')) {
                    options.headers.append('Authorization', `Bearer ${token}`);
                }
            } else {
                if (!options.headers['Authorization'] && !options.headers['authorization']) {
                    options.headers['Authorization'] = `Bearer ${token}`;
                }
            }
        }

        try {
            const response = await originalFetch(url, options);

            // Clear credentials and redirect on authorization failure
            if (response.status === 401 || response.status === 403) {
                const path = window.location.pathname.toLowerCase();
                const isPublicPage = path.includes('login.html') || path.includes('register.html');

                if (!isPublicPage) {
                    Auth.removeToken();
                    window.location.href = 'login.html';
                }
            }

            return response;
        } catch (error) {
            throw error;
        }
    };
})();
