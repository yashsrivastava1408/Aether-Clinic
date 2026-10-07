import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Close } from "../Icons";

/**
 * A dialog over the page. Closes on Escape or a click outside, moves focus
 * into itself when it opens and gives it back when it closes.
 */
export default function Modal({ isOpen, onClose, title, children, footer, size = "max-w-md" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="backdrop-in absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={panelRef} tabIndex={-1} className={`modal-in relative flex max-h-[88vh] w-full ${size} flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-float outline-none`}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost -mr-2 -mt-1 px-2" aria-label="Close">
            <Close />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
