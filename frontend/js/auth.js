/**
 * ═══════════════════════════════════════════════════════════════════
 * GLOBAL AUTHENTICATION MODULE — JavaScript
 * VelloxPrep Platform
 * ═══════════════════════════════════════════════════════════════════
 */

const Auth = (() => {
    'use strict';

    const AUTH_KEYS = ['token', 'email', 'role', 'name', 'createdAt', 'profileImageUrl'];

    function saveToken(token, email, role, name, createdAt, profileImageUrl, rememberMe = true) {
        // Clear both storages first to ensure clean state
        removeToken();

        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem('token', token);
        storage.setItem('email', email);
        if (role) {
            storage.setItem('role', role);
        }
        if (name) {
            storage.setItem('name', name);
        }
        if (createdAt) {
            storage.setItem('createdAt', createdAt);
        }
        if (profileImageUrl) {
            const finalImg = profileImageUrl.startsWith('http') 
                ? profileImageUrl 
                : ('https://velloxprep.onrender.com' + (profileImageUrl.startsWith('/') ? '' : '/') + profileImageUrl);
            storage.setItem('profileImageUrl', finalImg);
        }
    }

    function getToken() {
        return sessionStorage.getItem('token') || localStorage.getItem('token');
    }

    function getItem(key) {
        return sessionStorage.getItem(key) || localStorage.getItem(key);
    }

    function removeToken() {
        AUTH_KEYS.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }

    // Proxy localStorage.getItem to transparently support session-only tokens across all app scripts
    try {
        const originalGetItem = localStorage.getItem.bind(localStorage);
        localStorage.getItem = function(key) {
            const sessionVal = sessionStorage.getItem(key);
            if (sessionVal !== null) {
                return sessionVal;
            }
            return originalGetItem(key);
        };
    } catch (e) {
        console.warn('Storage proxy warning:', e);
    }

    function processOAuthCallback() {
        try {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            const email = params.get('email');
            const name = params.get('name');
            const role = params.get('role');
            const picture = params.get('picture');

            if (token && email) {
                saveToken(
                    token,
                    email,
                    role || 'USER',
                    name || email.split('@')[0],
                    new Date().toISOString(),
                    picture || null
                );
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
                // Immediately go to dashboard
                const target = window.location.pathname.replace(/login\.html.*/i, 'dashboard.html');
                window.location.replace(target.includes('dashboard.html') ? target : 'dashboard.html');
                return true;
            }
        } catch (e) {
            console.warn('OAuth callback extraction:', e);
        }
        return false;
    }

    function checkGuard() {
        // First, check if this is an incoming OAuth redirect with tokens
        if (processOAuthCallback()) {
            return;
        }

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
            const target = window.location.pathname.replace(/login\.html.*/i, 'dashboard.html');
            window.location.replace(target.includes('dashboard.html') ? target : 'dashboard.html');
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

            // Clear credentials and redirect on authorization failure (excluding social auth sessions)
            if (response.status === 401 || response.status === 403) {
                const path = window.location.pathname.toLowerCase();
                const isPublicPage = path.includes('login.html') || path.includes('register.html');
                const isSocialToken = token && (token.startsWith('google-') || token.startsWith('demo-'));

                if (!isPublicPage && !isSocialToken) {
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
