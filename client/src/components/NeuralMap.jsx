import React, { useEffect, useRef, useState } from 'react';

const NeuralMap = () => {
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);
    const containerRef = useRef(null);
    const mouse = useRef({ x: 0, y: 0, active: false });
    const nodes = useRef([]);
    const packets = useRef([]);

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        setContext(ctx);

        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
                initNodes(canvas.width, canvas.height);
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    // Initialize Nodes
    const initNodes = (width, height) => {
        const nodeCount = 40;
        nodes.current = Array.from({ length: nodeCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 2,
            connections: [],
            pulse: 0,
            pulseSpeed: 0.05 + Math.random() * 0.05
        }));
    };

    // Handle Mouse
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            mouse.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                active: true
            };
        };

        const handleMouseLeave = () => {
            mouse.current.active = false;
        };

        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            if (canvas) {
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, []);

    // Animation Loop
    useEffect(() => {
        if (!context) return;
        let animationFrameId;

        const animate = () => {
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;
            context.clearRect(0, 0, width, height);

            // Update Nodes
            nodes.current.forEach(node => {
                // Move
                node.x += node.vx;
                node.y += node.vy;

                // Bounce
                if (node.x < 0 || node.x > width) node.vx *= -1;
                if (node.y < 0 || node.y > height) node.vy *= -1;

                // Mouse Repel/Attract
                if (mouse.current.active) {
                    const dx = mouse.current.x - node.x;
                    const dy = mouse.current.y - node.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        node.x += dx * 0.01;
                        node.y += dy * 0.01;
                        node.pulse = 1; // Highlight
                    }
                }

                // Pulse decay
                if (node.pulse > 0) node.pulse -= 0.02;
                if (node.pulse < 0) node.pulse = 0;
            });

            // Draw Connections & Packets
            nodes.current.forEach((node, i) => {
                nodes.current.slice(i + 1).forEach(other => {
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        // Draw Line
                        context.beginPath();
                        context.moveTo(node.x, node.y);
                        context.lineTo(other.x, other.y);
                        context.strokeStyle = `rgba(16, 185, 129, ${0.15 * (1 - dist / 100) + node.pulse * 0.5})`;
                        context.lineWidth = 1;
                        context.stroke();

                        // Randomly spawn packet
                        if (Math.random() < 0.005) {
                            packets.current.push({
                                x: node.x,
                                y: node.y,
                                tx: other.x,
                                ty: other.y,
                                progress: 0,
                                speed: 0.02 + Math.random() * 0.03
                            });
                        }
                    }
                });

                // Draw Node
                context.beginPath();
                context.arc(node.x, node.y, node.radius + node.pulse * 3, 0, Math.PI * 2);
                context.fillStyle = `rgba(16, 185, 129, ${0.5 + node.pulse})`;
                context.shadowBlur = 10 * node.pulse;
                context.shadowColor = '#10b981';
                context.fill();
                context.shadowBlur = 0;
            });

            // Update & Draw Packets
            for (let i = packets.current.length - 1; i >= 0; i--) {
                const p = packets.current[i];
                p.progress += p.speed;

                if (p.progress >= 1) {
                    packets.current.splice(i, 1);
                    continue;
                }

                const currX = p.x + (p.tx - p.x) * p.progress;
                const currY = p.y + (p.ty - p.y) * p.progress;

                context.beginPath();
                context.arc(currX, currY, 1.5, 0, Math.PI * 2);
                context.fillStyle = '#fff';
                context.fill();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, [context]);

    return (
        <div ref={containerRef} className="w-full h-[400px] bg-[#030303] rounded-xl overflow-hidden relative border border-white/5 group">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <canvas ref={canvasRef} className="block" />

            {/* Overlay Text */}
            <div className="absolute bottom-4 left-4 pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Neural_Net_Active</span>
                </div>
                <div className="text-[10px] text-emerald-500/50 font-mono mt-1">Nodes: 40 | Connections: Dynamic</div>
            </div>
        </div>
    );
};

export default NeuralMap;
