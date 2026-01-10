import React, { useEffect, useRef, useState } from "react";

const HolographicCursor = () => {
    const cursorRef = useRef(null);
    const ringRef = useRef(null);
    const [clicked, setClicked] = useState(false);
    const [hovering, setHovering] = useState(false);

    useEffect(() => {
        const moveCursor = (e) => {
            const { clientX: x, clientY: y } = e;

            // Dot follows instantly
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            }

            // Ring follows with slight delay (magnetic feel)
            if (ringRef.current) {
                // Using a slight optimized requestAnimationFrame lag could be cooler, 
                // but direct CSS transition handles the "lag" feel automatically 
                // if we set the transform properly.
                // For 'magnet' effect, we just move it to the spot.

                ringRef.current.animate({
                    transform: `translate3d(${x}px, ${y}px, 0)`
                }, {
                    duration: 500,
                    fill: "forwards",
                    easing: "ease-out"
                });
            }
        };

        const handleClick = () => {
            setClicked(true);
            setTimeout(() => setClicked(false), 300);
        };

        const handleMouseOver = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
                setHovering(true);
            } else {
                setHovering(false);
            }
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mousedown", handleClick);
        window.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mousedown", handleClick);
            window.removeEventListener("mouseover", handleMouseOver);
        };
    }, []);

    // Return nothing on mobile/touch devices
    if (typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) {
        return null;
    }

    return (
        <>
            {/* Center High-Precision Dot */}
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 w-2 h-2 bg-emerald-400 rounded-full z-[9999] pointer-events-none mix-blend-screen shadow-[0_0_10px_#34d399]"
                style={{ marginTop: -4, marginLeft: -4 }}
            />

            {/* Outer Magnetic Ring */}
            <div
                ref={ringRef}
                className={`fixed top-0 left-0 border border-emerald-500/50 rounded-full z-[9998] pointer-events-none transition-all duration-300 ease-out
                    ${hovering ? "w-12 h-12 bg-emerald-500/10 border-emerald-400" : "w-8 h-8"}
                    ${clicked ? "scale-150 opacity-0 border-[3px]" : "scale-100 opacity-100"}
                `}
                style={{ marginTop: hovering ? -24 : -16, marginLeft: hovering ? -24 : -16 }}
            />
        </>
    );
};

export default HolographicCursor;
