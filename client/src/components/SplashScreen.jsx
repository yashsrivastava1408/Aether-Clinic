import React, { useEffect, useState } from "react";

// 🔥 Letter-by-Letter Animation Component
const AnimatedLetters = ({ text, className = "", delay = 0, staggerMs = 60 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <span className={`inline-flex flex-wrap justify-center ${className}`}>
            {text.split("").map((letter, i) => (
                <span
                    key={i}
                    className="inline-block"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible
                            ? 'translateY(0) rotateX(0) scale(1)'
                            : 'translateY(100px) rotateX(-90deg) scale(0.3)',
                        filter: isVisible ? 'blur(0px)' : 'blur(10px)',
                        transition: `all 0.9s cubic-bezier(0.16, 1, 0.3, 1)`,
                        transitionDelay: `${i * staggerMs}ms`,
                    }}
                >
                    {letter === " " ? "\u00A0" : letter}
                </span>
            ))}
        </span>
    );
};

// Scramble Text Effect
const ScrambleText = ({ text, className = "", delay = 0 }) => {
    const [displayText, setDisplayText] = useState("");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    useEffect(() => {
        const startTimer = setTimeout(() => {
            let iteration = 0;
            const interval = setInterval(() => {
                setDisplayText(
                    text.split("").map((letter, index) => {
                        if (index < iteration) return letter;
                        if (letter === " ") return " ";
                        return chars[Math.floor(Math.random() * chars.length)];
                    }).join("")
                );

                if (iteration >= text.length) clearInterval(interval);
                iteration += 1 / 3;
            }, 30);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(startTimer);
    }, [text, delay]);

    return <span className={className}>{displayText || text.replace(/./g, " ")}</span>;
};

export default function SplashScreen() {
    return (
        <div className="fixed inset-0 z-[100] bg-[#030303] flex items-center justify-center overflow-hidden animate-splash-exit">
            {/* Subtle ambient glow */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px] bg-emerald-900/20" />
            </div>

            {/* Minimal ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none">
                <div className="absolute inset-0 border border-white/5 rounded-full animate-spin-slow" />
            </div>

            {/* Logo Container */}
            <div className="relative z-10 text-center">
                {/* Logo */}
                <div className="animate-logo-bounce">
                    <div className="relative w-28 h-28 mx-auto mb-10">
                        {/* Subtle glow */}
                        <div className="absolute -inset-4 rounded-2xl bg-emerald-500/10 blur-2xl" />

                        {/* Main Icon */}
                        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-900/30 animate-logo-reveal">
                            <span className="text-6xl animate-icon-pop" style={{ animationDelay: '0.3s' }}>🧠</span>
                        </div>
                    </div>
                </div>

                {/* 🔥 CRAZY Brand Name with Letter Animation */}
                <div className="overflow-hidden mb-2">
                    <h1 className="text-5xl md:text-6xl font-bold">
                        <AnimatedLetters
                            text="Aether"
                            className="text-emerald-500"
                            delay={600}
                            staggerMs={80}
                        />
                    </h1>
                </div>

                <div className="overflow-hidden">
                    <h1 className="text-5xl md:text-6xl font-bold">
                        <AnimatedLetters
                            text="Clinic"
                            className="text-white"
                            delay={1200}
                            staggerMs={80}
                        />
                    </h1>
                </div>

                {/* Scramble Tagline */}
                <p className="text-gray-500 mt-6 text-sm tracking-widest uppercase">
                    <ScrambleText
                        text="AI-POWERED HEALTHCARE"
                        delay={1800}
                    />
                </p>

                {/* Loading Bar */}
                <div className="mt-10 w-40 h-0.5 mx-auto bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{
                            animation: 'loadingBar 2.5s ease-out forwards',
                        }}
                    />
                </div>
            </div>

            <style>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
        </div>
    );
}
