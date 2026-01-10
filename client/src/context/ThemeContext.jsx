/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Default to 'dark' as requested
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('app-theme');
        return savedTheme || 'dark';
    });

    // Transition state for splash screen
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        localStorage.setItem('app-theme', theme);
        // Add/remove global class for Tailwind dark mode if we were using it standardly
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        if (isTransitioning) return; // Prevent double clicks

        setIsTransitioning(true);

        // Wait for animation to cover screen before switching theme
        // 2000ms matches the transition duration we'll build
        setTimeout(() => {
            setTheme(prev => prev === 'dark' ? 'light' : 'dark');

            // Allow theme to render, then finish transition
            setTimeout(() => {
                setIsTransitioning(false);
            }, 500);
        }, 2000);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isTransitioning }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
