import React, { useEffect, useRef, useState } from 'react';

const NeuralSyncSequence = ({ onComplete }) => {
    const canvasRef = useRef(null);
    const [statusLogs, setStatusLogs] = useState([]);
    const [progress, setProgress] = useState(0);

    const logs = [
        "INITIALIZING NEURAL LINK...",
        "CALIBRATING SYNAPTIC INTERFACE...",
        "SYNCHRONIZING BIOMETRIC DATA...",
        "MAPPING NEURAL PATHWAYS...",
        "AETHER_CORE OPTIMIZED.",
        "SYNC_SUCCESSFUL [ID: #9X29]"
    ];

    useEffect(() => {
        let logIndex = 0;
        const logInterval = setInterval(() => {
            if (logIndex < logs.length) {
                setStatusLogs(prev => [...prev.slice(-3), logs[logIndex]]);
                logIndex++;
            } else {
                clearInterval(logInterval);
            }
        }, 400);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(onComplete, 800);
                    return 100;
                }
                return prev + 1.5;
            });
        }, 30);

        return () => {
            clearInterval(logInterval);
            clearInterval(progressInterval);
        };
    }, [onComplete]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 200;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Initialize particles (Voxels)
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                targetX: centerX + (Math.random() - 0.5) * 300,
                targetY: centerY + (Math.random() - 0.5) * 300,
                vx: 0,
                vy: 0,
                size: Math.random() * 3 + 1,
                color: `rgba(16, 185, 129, ${Math.random() * 0.5 + 0.5})`,
            });
        }

        const waveforms = Array.from({ length: 3 }, (_, i) => ({
            y: centerY + (i - 1) * 150,
            phase: Math.random() * Math.PI * 2,
            amplitude: 50 + Math.random() * 50,
            frequency: 0.005 + Math.random() * 0.01,
            speed: 0.05 + Math.random() * 0.1,
        }));

        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Voxel Assembly
            particles.forEach(p => {
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                p.vx += dx * 0.01;
                p.vy += dy * 0.01;
                p.vx *= 0.9;
                p.vy *= 0.9;
                p.x += p.vx;
                p.y += p.vy;

                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);

                // Occasional glitch jump
                if (Math.random() < 0.001) {
                    p.x += (Math.random() - 0.5) * 200;
                    p.y += (Math.random() - 0.5) * 200;
                }
            });

            // Draw Waveforms
            waveforms.forEach(w => {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
                ctx.lineWidth = 1;
                for (let x = 0; x < canvas.width; x += 5) {
                    const y = w.y + Math.sin(x * w.frequency + w.phase) * w.amplitude;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                w.phase += w.speed;

                // Add random "spikes" to mimic ECG
                if (Math.random() < 0.05) {
                    w.amplitude = 150 * Math.random();
                } else {
                    w.amplitude += (50 - w.amplitude) * 0.1;
                }
            });

            // Scanline Effect
            ctx.fillStyle = 'rgba(16, 185, 129, 0.02)';
            const scanY = (Date.now() / 10) % canvas.height;
            ctx.fillRect(0, scanY, canvas.width, 2);

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[200] bg-black overflow-hidden flex flex-col items-center justify-center">
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* HUD Elements */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Central Core Glow */}
                <div className="w-32 h-32 rounded-full bg-emerald-500/10 blur-[40px] animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

                {/* Hexagon Frame */}
                <div className="w-48 h-48 border border-emerald-500/20 relative flex items-center justify-center animate-[spin_10s_linear_infinite]"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <div className="absolute inset-2 border border-emerald-500/40"
                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                </div>

                {/* Sync Progress */}
                <div className="mt-12 text-center">
                    <div className="text-4xl font-black text-white tracking-[0.2em] mb-2 glitch-text" data-text={`${Math.floor(progress)}%`}>
                        {Math.floor(progress)}%
                    </div>
                    <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden relative">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_#10b981]"
                            style={{ width: `${progress}%` }}
                        />
                        {/* Moving light bit */}
                        <div className="absolute top-0 bottom-0 w-8 bg-white/40 blur-[4px] animate-[shimmer_1s_infinite]" style={{ left: `${progress - 10}%` }} />
                    </div>
                </div>

                {/* Status Logs Overlay */}
                <div className="mt-8 font-mono text-[10px] text-emerald-500/70 h-16 flex flex-col items-center uppercase tracking-tighter">
                    {statusLogs.map((log, i) => (
                        <div key={i} className="animate-fade-in-up">{`> ${log}`}</div>
                    ))}
                </div>
            </div>

            {/* Cyber Overlays */}
            <div className="absolute top-8 left-8 flex flex-col gap-1 opacity-40">
                <div className="text-[8px] font-mono text-emerald-500">SYS_AUTH: [GRANTED]</div>
                <div className="text-[8px] font-mono text-emerald-500">LINK_STRENGTH: 98.2%</div>
                <div className="text-[8px] font-mono text-emerald-500">ENCRYPTION: AES_256</div>
            </div>

            <div className="absolute bottom-8 right-8 flex flex-col items-end gap-1 opacity-40">
                <div className="text-[8px] font-mono text-emerald-500">BUFFER_NEURAL_STREAM: ACTIVE</div>
                <div className="text-[8px] font-mono text-emerald-500">LATENCY: 4.2ms</div>
            </div>

            {/* Extreme Flash Overlay (Triggers near end) */}
            {progress > 95 && (
                <div className="absolute inset-0 bg-white z-[300] animate-[flash_0.5s_ease-out_forwards]" />
            )}

            <style>{`
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch-text::before {
          color: #ff00c1;
          left: -2px;
          text-shadow: 2px 0 #ff00c1;
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim 5s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          color: #00fff9;
          left: 2px;
          text-shadow: -2px 0 #00fff9;
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim2 5s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim {
          0% { clip: rect(31px, 9999px, 94px, 0); }
          5% { clip: rect(70px, 9999px, 71px, 0); }
          100% { clip: rect(67px, 9999px, 98px, 0); }
        }
        @keyframes glitch-anim2 {
          0% { clip: rect(65px, 9999px, 100px, 0); }
          5% { clip: rect(52px, 9999px, 53px, 0); }
          100% { clip: rect(23px, 9999px, 100px, 0); }
        }
      `}</style>
        </div>
    );
};

export default NeuralSyncSequence;
