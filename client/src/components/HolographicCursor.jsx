import React, { useEffect, useRef, useState } from "react";

const HolographicCursor = () => {
    const dotRef = useRef(null);
    const ringRef = useRef(null);

    const mouse = useRef({ x: 0, y: 0 });
    const ringPos = useRef({ x: 0, y: 0 });

    const [hovering, setHovering] = useState(false);
    const [clicked, setClicked] = useState(false);

    useEffect(() => {
        const onMouseMove = (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;

            if (dotRef.current) {
                dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
        };

        const animate = () => {
            // Smooth magnetic lag
            ringPos.current.x += (mouse.current.x - ringPos.current.x) * 0.15;
            ringPos.current.y += (mouse.current.y - ringPos.current.y) * 0.15;

            if (ringRef.current) {
                ringRef.current.style.transform = `
          translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)
          rotate(${hovering ? 225 : 45}deg)
          scale(${clicked ? 0.8 : hovering ? 1.15 : 1})
        `;
            }

            requestAnimationFrame(animate);
        };

        const onMouseDown = () => {
            setClicked(true);
            setTimeout(() => setClicked(false), 150);
        };

        const onHoverCheck = (e) => {
            const el = e.target.closest("button, a, input, textarea");
            setHovering(!!el);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseover", onHoverCheck);

        animate();

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mouseover", onHoverCheck);
        };
    }, [hovering, clicked]);

    // Disable on touch devices
    if (typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent)) {
        return null;
    }

    return (
        <>
            {/* Core dot */}
            <div
                ref={dotRef}
                className="fixed top-0 left-0 z-[9999] w-2 h-2 rounded-full bg-cyan-200 pointer-events-none
                   shadow-[0_0_12px_#67e8f9] mix-blend-screen"
                style={{ marginLeft: -4, marginTop: -4 }}
            />

            {/* Holographic ring */}
            <div
                ref={ringRef}
                className="fixed top-0 left-0 z-[9998] w-8 h-8 pointer-events-none
                   border border-cyan-400/70 rounded-sm
                   shadow-[0_0_25px_rgba(34,211,238,0.45)]
                   bg-cyan-500/10
                   transition-colors duration-300"
                style={{ marginLeft: -16, marginTop: -16 }}
            />
        </>
    );
};

export default HolographicCursor;