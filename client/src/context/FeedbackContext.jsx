/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "../components/ui/Modal";
import { Alert, Check, Close, Info } from "../components/Icons";

const FeedbackContext = createContext({ toast: () => { }, confirm: async () => false });

const TOAST_MS = 4500;
const TONES = {
  ok: { icon: Check, className: "text-ok" },
  danger: { icon: Alert, className: "text-danger" },
  info: { icon: Info, className: "text-brand" },
};

/**
 * Short messages in the corner of the screen (`toast`) and yes/no questions
 * in a dialog (`confirm`, which resolves to true or false).
 */
export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [question, setQuestion] = useState(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback((message, tone = "ok") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    setTimeout(() => dismiss(id), TOAST_MS);
  }, [dismiss]);

  const confirm = useCallback((options) => new Promise((resolve) => setQuestion({ ...options, resolve })), []);

  const answer = (value) => {
    question?.resolve(value);
    setQuestion(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <Modal
        isOpen={!!question}
        onClose={() => answer(false)}
        title={question?.title || ""}
        footer={<>
          <button onClick={() => answer(false)} className="btn btn-secondary">{question?.cancelLabel || "Cancel"}</button>
          <button onClick={() => answer(true)} className={`btn ${question?.tone === "danger" ? "btn-danger" : "btn-primary"}`}>{question?.confirmLabel || "Confirm"}</button>
        </>}
      >
        <p className="text-sm leading-relaxed text-muted">{question?.text}</p>
      </Modal>

      {createPortal(
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[110] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6" aria-live="polite">
          {toasts.map((t) => {
            const tone = TONES[t.tone] || TONES.info;
            const Icon = tone.icon;
            return (
              <div key={t.id} role="status" className="toast-in pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-float sm:w-80">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.className}`} />
                <span className="flex-1 leading-relaxed">{t.message}</span>
                <button onClick={() => dismiss(t.id)} className="-mr-1 rounded-md p-0.5 text-muted hover:text-ink" aria-label="Dismiss">
                  <Close className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => useContext(FeedbackContext);
