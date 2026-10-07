import React, { useEffect, useState } from "react";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Counts from 0 up to `value` once, then shows the exact value. */
export default function CountUp({ value, decimals = 0, duration = 900, suffix = "" }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(prefersReducedMotion() ? target : 0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(target);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(progress === 1 ? target : target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  // The final frame shows the value exactly as given (12.34 stays 12.34)
  const text = shown === target ? String(target) : shown.toFixed(decimals);
  return <span className="tabular-nums">{text}{suffix}</span>;
}
