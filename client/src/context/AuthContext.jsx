import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
    user: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasOnboarded, setHasOnboarded] = useState(false);

    // Token Limits
    const GUEST_DAILY_LIMIT = 10000;
    const USER_LIMIT = 100000; // High limit for signed-in users

    const [tokenUsage, setTokenUsage] = useState(0);

    const [tokenUsage, setTokenUsage] = useState(0);

    // Auto-Logout Constants
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutes
    let inactivityTimer;

    useEffect(() => {
        loadUser();
        setupActivityListeners();
        return () => cleanupActivityListeners();
    }, []);

    const setupActivityListeners = () => {
        window.addEventListener('mousemove', resetInactivityTimer);
        window.addEventListener('keypress', resetInactivityTimer);
        window.addEventListener('click', resetInactivityTimer);
        window.addEventListener('scroll', resetInactivityTimer);
        resetInactivityTimer();
    };

    const cleanupActivityListeners = () => {
        window.removeEventListener('mousemove', resetInactivityTimer);
        window.removeEventListener('keypress', resetInactivityTimer);
        window.removeEventListener('click', resetInactivityTimer);
        window.removeEventListener('scroll', resetInactivityTimer);
        clearTimeout(inactivityTimer);
    };

    const resetInactivityTimer = () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);

        // Only set timer if user is logged in (or guest session active)
        const storedUser = localStorage.getItem('user_session'); // Direct check to avoid stale state
        if (storedUser) {
            inactivityTimer = setTimeout(() => {
                console.log("Auto-logging out due to inactivity...");
                logout();
                alert("For your security, you have been logged out due to inactivity.");
            }, INACTIVITY_LIMIT);
        }
    };

    const loadUser = async () => {
        try {
            // Check onboarding status
            const onboarded = localStorage.getItem('has_onboarded');
            setHasOnboarded(onboarded === 'true');

            // Load Token Usage for Guest
            const savedUsage = localStorage.getItem('guest_token_usage');
            const resetTime = localStorage.getItem('guest_token_reset');

            if (resetTime && new Date() > new Date(resetTime)) {
                // Reset if 24h passed
                setTokenUsage(0);
                localStorage.setItem('guest_token_usage', '0');
                localStorage.removeItem('guest_token_reset');
            } else {
                setTokenUsage(savedUsage ? parseInt(savedUsage) : 0);
            }

            // Check for existing session in localStorage
            const storedUser = localStorage.getItem('user_session');

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                // Persistent Guest ID
                let guestId = localStorage.getItem('guest_id');
                if (!guestId) {
                    guestId = 'guest-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
                    localStorage.setItem('guest_id', guestId);
                }

                const guestUser = {
                    id: guestId,
                    isGuest: true,
                    name: 'Guest User',
                };
                setUser(guestUser);
            }
        } catch (error) {
            console.error('Auth loading error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkTokenLimit = (amount) => {
        const limit = user?.isGuest ? GUEST_DAILY_LIMIT : USER_LIMIT;
        return (tokenUsage + amount) <= limit;
    };

    const consumeTokens = (amount) => {
        const newUsage = tokenUsage + amount;
        setTokenUsage(newUsage);

        if (user?.isGuest) {
            localStorage.setItem('guest_token_usage', newUsage.toString());

            // Set reset time if not set
            if (!localStorage.getItem('guest_token_reset')) {
                const nextDay = new Date();
                nextDay.setHours(nextDay.getHours() + 24);
                localStorage.setItem('guest_token_reset', nextDay.toISOString());
            }
        }
    };

    const continueAsGuest = () => {
        localStorage.setItem('has_onboarded', 'true');
        setHasOnboarded(true);
    };

    const login = async (email) => {
        // MOCK LOGIN
        const mockUser = {
            id: 'u-' + Date.now().toString(36),
            isGuest: false,
            name: email.split('@')[0],
            email: email,
            avatar: 'https://ui-avatars.com/api/?name=' + email.split('@')[0] + '&background=10b981&color=fff'
        };

        localStorage.setItem('user_session', JSON.stringify(mockUser));
        localStorage.setItem('has_onboarded', 'true');
        setUser(mockUser);
        setHasOnboarded(true);
        // Reset token usage on login? Or keep it? 
        // Usually login grants fresh high limits, so the guest usage doesn't matter as much 
        // unless we want to carry it over. Let's just rely on the limit check switching to USER_LIMIT.
    };

    const logout = async () => {
        localStorage.removeItem('user_session');
        // Optional: Reset onboarding on logout? 
        // Typically logout -> goes to guest mode or login screen. 
        // For this flow, let's keep them onboarded but in guest mode, 
        // OR reset onboarding to show the choice screen again.
        // Let's reset onboarding to show the choice screen again for clear demonstration.
        localStorage.removeItem('has_onboarded');
        setHasOnboarded(false);

        await loadUser();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, hasOnboarded, login, logout, continueAsGuest, checkTokenLimit, consumeTokens, tokenUsage }}>
            {children}
        </AuthContext.Provider>
    );
};
