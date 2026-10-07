import React from 'react';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const colourFor = (level) => (level === "High" ? "var(--danger)" : level === "Medium" ? "var(--warn)" : "var(--ok)");

/** A ring showing the model's risk estimate, coloured by its level (Low, Medium or High). */
const RiskGauge = ({ percentage = 0, level = "Low" }) => {
    const value = Math.min(100, Math.max(0, Number(percentage) || 0));
    const colour = colourFor(level);

    return (
        <div className="relative h-40 w-40" role="img" aria-label={`${value}% estimated risk, ${level}`}>
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
                    strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
                    className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold tabular-nums text-ink">{value}%</span>
                <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide" style={{ color: colour }}>{level} risk</span>
            </div>
        </div>
    );
};

export default RiskGauge;
