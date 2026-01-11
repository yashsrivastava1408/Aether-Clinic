import React, { useEffect, useState } from 'react';

const MLResultGauge = ({ percentage = 0, level = "Low", isDark = true }) => {
    const [offset, setOffset] = useState(283); // Full circle offset (2 * PI * 45)

    useEffect(() => {
        const progress = (percentage / 100) * 283;
        setOffset(283 - progress);
    }, [percentage]);

    const getColor = () => {
        if (level === "High") return "#ef4444"; // red-500
        if (level === "Medium") return "#f59e0b"; // amber-500
        return "#10b981"; // emerald-500
    };

    const color = getColor();

    return (
        <div className="relative flex flex-col items-center justify-center group">
            {/* Outer Glow Ring */}
            <div
                className="absolute w-48 h-48 rounded-full blur-2xl opacity-20 transition-colors duration-1000"
                style={{ backgroundColor: color }}
            />

            {/* SVG Gauge */}
            <svg className="w-48 h-48 transform -rotate-90 relative z-10">
                {/* Background Track */}
                <circle
                    cx="96"
                    cy="96"
                    r="45"
                    fill="transparent"
                    stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                    strokeWidth="8"
                />
                {/* Progress Bar */}
                <circle
                    cx="96"
                    cy="96"
                    r="45"
                    fill="transparent"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 8px ${color})`,
                    }}
                />

                {/* Small Decorative Dots */}
                {[...Array(8)].map((_, i) => (
                    <circle
                        key={i}
                        cx={96 + 55 * Math.cos((i * 45 * Math.PI) / 180)}
                        cy={96 + 55 * Math.sin((i * 45 * Math.PI) / 180)}
                        r="1.5"
                        fill={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
                    />
                ))}
            </svg>

            {/* Center Display */}
            <div className="absolute flex flex-col items-center justify-center text-center z-20">
                <span className={`text-4xl font-bold font-mono tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {percentage}%
                </span>
                <span
                    className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 transition-colors duration-500"
                    style={{ color }}
                >
                    {level} Risk
                </span>
            </div>

            {/* Scanning HUD Decals */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none border border-white/5 rounded-full scale-110 animate-pulse" />
            <div className="absolute bottom-[-20px] px-3 py-0.5 rounded-md border border-white/10 bg-black/40 backdrop-blur-md">
                <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest">
                    Biometric Analysis Active
                </span>
            </div>
        </div>
    );
};

export default MLResultGauge;
