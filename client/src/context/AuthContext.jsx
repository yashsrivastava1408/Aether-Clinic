import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const AuthContext = createContext({
    user: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

// Usage limits, counted in characters sent and received
const GUEST_DAILY_LIMIT = 10000;
const USER_LIMIT = 100000;

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ['mousemove', 'keypress', 'click', 'scroll'];

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasOnboarded, setHasOnboarded] = useState(false);
    const [tokenUsage, setTokenUsage] = useState(0);
    const [signedOutForInactivity, setSignedOutForInactivity] = useState(false);
    const inactivityTimer = useRef(null);

    useEffect(() => {
        loadUser();

        // Signed-in sessions end after 15 minutes without activity
        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer.current);
            if (!localStorage.getItem('user_session')) return;
            inactivityTimer.current = setTimeout(() => {
                setSignedOutForInactivity(true);
                logout();
            }, INACTIVITY_LIMIT);
        };

        ACTIVITY_EVENTS.forEach(name => window.addEventListener(name, resetInactivityTimer, { passive: true }));
        resetInactivityTimer();
        return () => {
            ACTIVITY_EVENTS.forEach(name => window.removeEventListener(name, resetInactivityTimer));
            clearTimeout(inactivityTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadUser = async () => {
        try {
            setHasOnboarded(localStorage.getItem('has_onboarded') === 'true');

            // Guest usage resets 24 hours after the first message
            const savedUsage = localStorage.getItem('guest_token_usage');
            const resetTime = localStorage.getItem('guest_token_reset');

            if (resetTime && new Date() > new Date(resetTime)) {
                setTokenUsage(0);
                localStorage.setItem('guest_token_usage', '0');
                localStorage.removeItem('guest_token_reset');
            } else {
                setTokenUsage(savedUsage ? parseInt(savedUsage) : 0);
            }

            const storedUser = localStorage.getItem('user_session');

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                // Guests keep the same id in this browser
                let guestId = localStorage.getItem('guest_id');
                if (!guestId) {
                    guestId = 'guest-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
                    localStorage.setItem('guest_id', guestId);
                }

                setUser({ id: guestId, isGuest: true, name: 'Guest' });
            }
        } catch (error) {
            console.error('Auth loading error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const usageLimit = user?.isGuest ? GUEST_DAILY_LIMIT : USER_LIMIT;

    const checkTokenLimit = (amount) => (tokenUsage + amount) <= usageLimit;

    const consumeTokens = (amount) => {
        const newUsage = tokenUsage + amount;
        setTokenUsage(newUsage);

        if (user?.isGuest) {
            localStorage.setItem('guest_token_usage', newUsage.toString());

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
        setSignedOutForInactivity(false);
    };

    const login = async (email, userData = null) => {
        const name = userData?.name || email.split('@')[0];
        const sessionUser = {
            id: 'u-' + Date.now().toString(36),
            isGuest: false,
            name,
            email,
            avatar: userData?.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=0f766e&color=fff'
        };

        // Create or update the user on the server and keep its id
        try {
            const res = await api.post('/api/auth/login', {
                email: sessionUser.email,
                name: sessionUser.name,
                picture: sessionUser.avatar,
                isGuest: false
            });
            if (res.data.user?._id) sessionUser.dbId = res.data.user._id;
        } catch (error) {
            console.error('Could not save the user on the server:', error);
        }

        localStorage.setItem('user_session', JSON.stringify(sessionUser));
        localStorage.setItem('has_onboarded', 'true');
        setUser(sessionUser);
        setHasOnboarded(true);
        setSignedOutForInactivity(false);
    };

    // Signing out goes back to the welcome screen
    const logout = async () => {
        localStorage.removeItem('user_session');
        localStorage.removeItem('has_onboarded');
        setHasOnboarded(false);
        await loadUser();
    };

    // The welcome screen, opened from inside the app by a guest who wants to sign in
    const showSignIn = () => setHasOnboarded(false);

    return (
        <AuthContext.Provider value={{ user, isLoading, hasOnboarded, login, logout, continueAsGuest, showSignIn, checkTokenLimit, consumeTokens, tokenUsage, usageLimit, signedOutForInactivity }}>
            {children}
        </AuthContext.Provider>
    );
};
