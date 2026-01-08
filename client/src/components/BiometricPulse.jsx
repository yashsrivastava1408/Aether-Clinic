import React, { useEffect, useState } from 'react';

const BiometricPulse = ({ color = "#10b981", speed = "2s" }) => {
    const [points, setPoints] = useState([]);

    useEffect(() => {
        // Basic Path: Flat -> P -> Q -> RS -> T -> Flat
        const path = "M 0 50 L 20 50 L 25 45 L 30 50 L 35 50 L 40 20 L 45 80 L 50 50 L 65 50 L 70 40 L 75 50 L 100 50";
        setPoints(path);
    }, []);

    return (
        <div className="relative w-full h-12 overflow-hidden flex items-center justify-center">
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full"
            >
                {/* Static Background Path */}
                <path
                    d="M 0 50 L 100 50"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                    fill="none"
                />

                {/* Animated ECG Path */}
                <path
                    d={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ecg-line"
                    style={{
                        strokeDasharray: "1000",
                        strokeDashoffset: "1000",
                        animation: `draw-pulse ${speed} linear infinite`,
                        filter: `drop-shadow(0 0 5px ${color})`
                    }}
                />
            </svg>
            {/* Moving Dot */}
            <div
                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full blur-[2px] animate-pulse"
                style={{
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}`,
                    left: '0%',
                    animation: `move-dot ${speed} linear infinite`
                }}
            />

            <style>{`
        @keyframes draw-pulse {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes move-dot {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>
        </div>
    );
};

export default BiometricPulse;
