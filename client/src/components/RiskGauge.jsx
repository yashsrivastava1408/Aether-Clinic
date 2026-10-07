import React, { useEffect, useState } from 'react';
import CountUp from './ui/CountUp';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const colourFor = (level) => (level === "High" ? "var(--danger)" : level === "Medium" ? "var(--warn)" : "var(--ok)");

/** A ring showing the model's risk estimate, coloured by its level (Low, Medium or High). */
const RiskGauge = ({ percentage = 0, level = "Low" }) => {
    const value = Math.min(100, Math.max(0, Number(percentage) || 0));
    const colour = colourFor(level);
    const [drawn, setDrawn] = useState(0);

    // The ring starts empty and fills to the value
    useEffect(() => {
        const frame = requestAnimationFrame(() => setDrawn(value));
        return () => cancelAnimationFrame(frame);
    }, [value]);

    return (
        <div className="relative h-44 w-44" role="img" aria-label={`${value}% estimated risk, ${level}`}>
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="9" />
                <circle
                    cx="60"
                    cy="60"
                    r={RADIUS}
                    fill="none"
                    stroke={colour}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - drawn / 100)}
                    style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
                <span className="text-3xl font-semibold text-ink"><CountUp value={value} decimals={1} duration={1000} suffix="%" /></span>
                <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide" style={{ color: colour }}>{level} risk</span>
            </div>
        </div>
    );
};

export default RiskGauge;
