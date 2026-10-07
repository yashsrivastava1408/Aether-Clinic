import React, { useState } from "react";
import { Link } from "react-router-dom";
import LegalModal from "./LegalModal";

export default function Footer() {
  const [showLegal, setShowLegal] = useState(false);

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:px-6 md:flex-row md:items-start md:justify-between">
        <p className="max-w-xl leading-relaxed">
          MedNexus gives general health information. It is not a doctor and does not diagnose or prescribe.
          In an emergency, call your local emergency number.
        </p>
        <div className="flex shrink-0 gap-5">
          <Link to="/about" className="hover:text-ink">About</Link>
          <button onClick={() => setShowLegal(true)} className="hover:text-ink">Terms and privacy</button>
        </div>
      </div>
      <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} />
    </footer>
  );
}
