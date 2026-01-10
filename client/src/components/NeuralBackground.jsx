import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const NeuralBackground = () => {
    const canvasRef = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const particles = [];
        const particleCount = 80;
        const connectionDistance = 150;

        // Theme-based colors
        const isDark = theme === 'dark';
        const particleColor = isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(15, 23, 42, 0.3)'; // Blue vs Dark Slate
        const lineColor = isDark ? '59, 130, 246' : '100, 116, 139'; // extracted for template literal
        const pulseColor = isDark ? 'rgba(16, 185, 129, 0.8)' : 'rgba(37, 99, 235, 0.8)'; // Emerald vs Blue

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * Math.random() * canvas.height; // Concentrate at top
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.fill();
            }
        }

        class Pulse {
            constructor(p1, p2) {
                this.p1 = p1;
                this.p2 = p2;
                this.progress = 0;
                this.speed = 0.01 + Math.random() * 0.02;
            }

            draw() {
                const x = this.p1.x + (this.p2.x - this.p1.x) * this.progress;
                const y = this.p1.y + (this.p2.y - this.p1.y) * this.progress;

                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = pulseColor;
                ctx.fill();

                this.progress += this.speed;
            }
        }

        const pulses = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.update();
                p.draw();

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(${lineColor}, ${0.2 * (1 - dist / connectionDistance)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();

                        // Occasionally spawn a pulse
                        if (Math.random() < 0.001 && pulses.length < 20) {
                            pulses.push(new Pulse(p, p2));
                        }
                    }
                }
            });

            pulses.forEach((pulse, index) => {
                pulse.draw();
                if (pulse.progress >= 1) {
                    pulses.splice(index, 1);
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme]); // Re-run effect when theme changes

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[-1] opacity-30"
        />
    );
};

export default NeuralBackground;
