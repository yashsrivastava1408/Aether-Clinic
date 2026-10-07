import React from "react";

// Outline icons, 24x24, drawn with the current text colour.
const icon = (...paths) => function Icon({ className = "h-5 w-5", ...rest }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
};

export const ArrowRight = icon("M5 12h14", "M13 6l6 6-6 6");
export const ArrowLeft = icon("M19 12H5", "M11 6l-6 6 6 6");
export const Check = icon("M5 13l4 4L19 7");
export const Close = icon("M6 6l12 12", "M18 6L6 18");
export const Menu = icon("M4 7h16", "M4 12h16", "M4 17h16");
export const Sun = icon("M12 3v2", "M12 19v2", "M3 12h2", "M19 12h2", "M5.6 5.6l1.4 1.4", "M17 17l1.4 1.4", "M5.6 18.4L7 17", "M17 7l1.4-1.4", "M12 8a4 4 0 100 8 4 4 0 000-8z");
export const Moon = icon("M20.4 14.5A8.5 8.5 0 019.5 3.6 8.5 8.5 0 1020.4 14.5z");
export const Send = icon("M4 12l16-8-6 16-2.5-6.5L4 12z");
export const Camera = icon("M4 8h3l1.5-2h7L17 8h3v11H4V8z", "M12 16a3 3 0 100-6 3 3 0 000 6z");
export const Upload = icon("M12 16V4", "M7 9l5-5 5 5", "M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2");
export const ThumbUp = icon("M7 11v9H4v-9h3z", "M7 11l4-7a2 2 0 012 2v4h5a2 2 0 012 2.3l-1 6A2 2 0 0117 20H7");
export const ThumbDown = icon("M17 13V4h3v9h-3z", "M17 13l-4 7a2 2 0 01-2-2v-4H6a2 2 0 01-2-2.3l1-6A2 2 0 017 4h10");
export const Alert = icon("M12 9v4", "M12 17h.01", "M10.3 3.9L2.5 17.5A2 2 0 004.2 20.5h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z");
export const Info = icon("M12 21a9 9 0 100-18 9 9 0 000 18z", "M12 11v5", "M12 8h.01");
export const Lock = icon("M6 11h12v9H6v-9z", "M8 11V8a4 4 0 018 0v3");
export const User = icon("M12 12a4 4 0 100-8 4 4 0 000 8z", "M5 20a7 7 0 0114 0");
export const Settings = icon("M4 6h10", "M18 6h2", "M4 12h2", "M10 12h10", "M4 18h10", "M18 18h2", "M16 4v4", "M8 10v4", "M16 16v4");
export const LogOut = icon("M10 4H5v16h5", "M15 8l4 4-4 4", "M19 12H9");

// Feature and specialist icons
export const Chat = icon("M4 5h16v11H9l-5 4V5z");
export const FileText = icon("M7 3h7l5 5v13H7V3z", "M14 3v5h5", "M10 13h6", "M10 17h6");
export const Heart = icon("M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z");
export const Drop = icon("M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z");
export const Brain = icon("M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 0V7a3 3 0 00-3-3z", "M15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 0");
export const Lungs = icon("M12 4v9", "M12 10c-1-2-3-3-4-3-2 0-4 5-4 9 0 2 1 3 3 3s5-2 5-5", "M12 10c1-2 3-3 4-3 2 0 4 5 4 9 0 2-1 3-3 3s-5-2-5-5");
export const Stomach = icon("M9 3v4a3 3 0 003 3h1a5 5 0 010 10H9a5 5 0 01-5-5", "M4 15c0-2 2-3 4-3");
export const Bone = icon("M8.5 15.5l7-7", "M6 13a2.5 2.5 0 11-1 4.9A2.5 2.5 0 116 13z", "M18 11a2.5 2.5 0 101-4.9A2.5 2.5 0 1018 11z");
export const Stethoscope = icon("M6 3v6a4 4 0 008 0V3", "M10 13v3a4 4 0 008 0v-2", "M18 14a2 2 0 100-4 2 2 0 000 4z");
export const Flower = icon("M12 14a2 2 0 100-4 2 2 0 000 4z", "M12 10V5a2.5 2.5 0 015 0c0 2-2.5 3-5 5z", "M12 14v5a2.5 2.5 0 01-5 0c0-2 2.5-3 5-5z", "M10 12H5a2.5 2.5 0 010-5c2 0 3 2.5 5 5z", "M14 12h5a2.5 2.5 0 010 5c-2 0-3-2.5-5-5z");
export const Hand = icon("M8 13V6a1.5 1.5 0 013 0v5", "M11 11V4.5a1.5 1.5 0 013 0V11", "M14 11V6a1.5 1.5 0 013 0v8a6 6 0 01-6 6h-1a5 5 0 01-4-2l-3-4.5a1.5 1.5 0 012.5-1.6L8 13");
export const Mind = icon("M12 21a9 9 0 100-18 9 9 0 000 18z", "M8.5 14.5a4.5 4.5 0 007 0", "M9 10h.01", "M15 10h.01");

// The MedNexus mark: a rounded square with a medical cross.
export function Logo({ className = "h-8 w-8" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path d="M16 9v14M9 16h14" stroke="var(--brand-ink)" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
