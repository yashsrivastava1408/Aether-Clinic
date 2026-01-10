import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const ThemeTransition = () => {
    const { theme, isTransitioning } = useTheme();
    // We determine correct background based on where we are heading
    // If current theme is 'dark', we are transitioning TO 'light', so the overlay should be WHITE (light).
    const targetTheme = theme === 'dark' ? 'light' : 'dark';
    const isTargetDark = targetTheme === 'dark';

    if (!isTransitioning) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">

            <style>{`
        @keyframes clip-expand {
            0% { clip-path: circle(0% at 50% 50%); }
            100% { clip-path: circle(150% at 50% 50%); }
        }
      `}</style>

            {/* 
          THE CIRCULAR REVEAL
          - Uses clip-path which is GPU accelerated and pixel-perfect smooth.
          - Easing: cubic-bezier(0.645, 0.045, 0.355, 1) -> "easeInOutCubic"
          - Duration: 1.5s matches our context delay buffer.
      */}
            <div
                className={`absolute inset-0 w-full h-full animate-[clip-expand_1.5s_cubic-bezier(0.645,0.045,0.355,1)_forwards]
          ${isTargetDark ? 'bg-[#030303]' : 'bg-slate-50'}`}
            >
                {/* Optional: A subtle centered icon that scales up slightly */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`transition-opacity duration-700 delay-300 ${isTargetDark ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {isTargetDark ? (
                            <svg className="w-20 h-20 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="w-20 h-20 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ThemeTransition;
