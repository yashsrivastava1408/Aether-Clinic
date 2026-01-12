import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const generateGuestId = () => {
    return 'guest-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

type User = {
    id: string;
    isGuest: boolean;
    name?: string;
    email?: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    hasOnboarded: boolean;
    login: (email: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    hasOnboarded: false,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasOnboarded, setHasOnboarded] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            // Check onboarding status
            const onboarded = await SecureStore.getItemAsync('has_onboarded');
            setHasOnboarded(onboarded === 'true');

            // Check for existing session
            const storedUser = await SecureStore.getItemAsync('user_session');

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                // No user found? Create a PERSISTENT GUEST ID.
                let guestId: string | null = await SecureStore.getItemAsync('guest_id');

                if (!guestId) {
                    guestId = generateGuestId();
                    await SecureStore.setItemAsync('guest_id', guestId);
                }

                const guestUser: User = {
                    id: guestId!,
                    isGuest: true,
                    name: 'Guest User',
                };

                // We don't save guestUser to 'user_session' to differentiate 
                // between a "logged in" user and a "guest" state, 
                // but for the app's logical flow, we set them as the current user.
                setUser(guestUser);
            }
        } catch (error) {
            console.error('Auth loading error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string) => {
        // MOCK LOGIN for Phase 1
        const mockUser: User = {
            id: 'u-' + generateGuestId().split('-')[2],
            isGuest: false,
            name: email.split('@')[0],
            email: email,
        };

        await SecureStore.setItemAsync('user_session', JSON.stringify(mockUser));
        await SecureStore.setItemAsync('has_onboarded', 'true'); // Login implies onboarding
        setUser(mockUser);
        setHasOnboarded(true);
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('user_session');
        // We do NOT clear has_onboarded, user typically returns to Login/Guest choice or just guest
        // If we want to force onboarding again, we could delete it.
        // For now, let's revert to Guest Mode immediately.
        await loadUser();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, hasOnboarded }}>
            {children}
        </AuthContext.Provider>
    );
};
