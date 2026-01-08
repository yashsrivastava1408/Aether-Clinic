import React, { useEffect, useState, useRef } from 'react';

const ScanningHUD = ({ active, children }) => {
    const [targets, setTargets] = useState([]);
    const [magnifierPos, setMagnifierPos] = useState({ x: 50, y: 50 });
    const containerRef = useRef(null);

    useEffect(() => {
        if (!active) {
            setTargets([]);
            return;
        }

        // Generate random "lock-on" targets
        const newTargets = Array.from({ length: 8 }, (_, i) => ({
            id: i,
            top: 10 + Math.random() * 80,
            left: 10 + Math.random() * 80,
            width: 15 + Math.random() * 20,
            height: 5 + Math.random() * 10,
            delay: Math.random() * 2
        }));
        setTargets(newTargets);

        // Magnifier movement logic
        const moveMagnifier = () => {
            setMagnifierPos(prev => ({
                x: 30 + Math.sin(Date.now() / 1000) * 40 + 20,
                y: 30 + Math.cos(Date.now() / 1500) * 40 + 20
            }));
        };

        const interval = setInterval(moveMagnifier, 50);
        return () => clearInterval(interval);
    }, [active]);

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden group/hud">
            {children}

            {/* Targeting Boxes */}
            {active && targets.map(target => (
                <div
                    key={target.id}
                    className="absolute border border-emerald-500/50 bg-emerald-500/5 transition-all duration-1000 animate-pulse"
                    style={{
                        top: `${target.top}%`,
                        left: `${target.left}%`,
                        width: `${target.width}%`,
                        height: `${target.height}%`,
                        animationDelay: `${target.delay}s`
                    }}
                >
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-400" />

                    {/* Label */}
                    <div className="absolute -top-4 left-0 text-[8px] font-mono text-emerald-400 bg-black/80 px-1 whitespace-nowrap">
                        {Math.random() > 0.5 ? 'IDENT_TAG_OCR' : 'BIO_MARKER_DETECT'}
                    </div>
                </div>
            ))}

            {/* Floating Magnifier HUD */}
            {active && (
                <div
                    className="absolute w-32 h-32 rounded-full border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] pointer-events-none overflow-hidden z-20 transition-all duration-300 ease-out"
                    style={{
                        top: `${magnifierPos.y}%`,
                        left: `${magnifierPos.x}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {/* Magnifier Lens (Simulated zoom with brighter overlay) */}
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-brightness-150 flex flex-col items-center justify-center">
                        <div className="text-[10px] font-mono text-emerald-400 animate-pulse">ANALYZING...</div>
                        <div className="text-[8px] font-mono text-white/40 mt-1">X-RAY_SPEC: 4.2</div>
                    </div>
                    {/* Crosshair */}
                    <div className="absolute top-1/2 left-0 w-full h-px bg-emerald-500/50" />
                    <div className="absolute left-1/2 top-0 w-px h-full bg-emerald-500/50" />
                </div>
            )}

            {/* Critical Data Readouts */}
            {active && (
                <div className="absolute bottom-4 left-4 font-mono text-[8px] text-emerald-500/60 z-30 pointer-events-none">
                    <div>LAT: {magnifierPos.x.toFixed(2)}%</div>
                    <div>LNG: {magnifierPos.y.toFixed(2)}%</div>
                    <div className="mt-1 animate-pulse">STREAMING_HL7_DATA...</div>
                </div>
            )}
        </div>
    );
};

export default ScanningHUD;
