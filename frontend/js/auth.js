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
            const finalImg = profileImageUrl.startsWith('http') 
                ? profileImageUrl 
                : ('https://velloxprep.onrender.com' + (profileImageUrl.startsWith('/') ? '' : '/') + profileImageUrl);
            localStorage.setItem('profileImageUrl', finalImg);
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
