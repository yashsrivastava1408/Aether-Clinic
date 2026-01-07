import React, { useRef, useState, useCallback, useEffect } from "react";

// 🧊 3D Tilt Card Wrapper (Reusable)
const TiltCard = ({ children, className = "" }) => {
    const cardRef = useRef(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calculate rotation with reduced intensity
        const rotateXVal = ((mouseY / rect.height) * -10).toFixed(2); // Invert Y axis
        const rotateYVal = ((mouseX / rect.width) * 10).toFixed(2);

        setRotateX(rotateXVal);
        setRotateY(rotateYVal);
    }, []);

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
        setIsHovering(false);
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <div
            ref={cardRef}
            className={`transition-transform duration-200 ease-out transform-gpu preserve-3d ${className}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
            }}
        >
            {/* Gloss Effect Layer */}
            <div
                className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle at ${50 - rotateY * 5}% ${50 - rotateX * 5}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
                    opacity: isHovering ? 1 : 0,
                }}
            />
            {children}
        </div>
    );
};

export default TiltCard;
