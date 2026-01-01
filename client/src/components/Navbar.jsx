import React from "react";

export default function Navbar({ navigate, currentPage }) {
  const linkClasses = (page) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
      currentPage === page
        ? "text-white bg-blue-500 shadow-md"
        : "text-gray-600 hover:bg-blue-100 hover:text-blue-600"
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div
          className="cursor-pointer font-bold text-xl text-blue-600"
          onClick={() => navigate("dashboard")}
        >
          🧠 Aether Clinic
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("dashboard")}
            className={linkClasses("dashboard")}
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate("consultation")}
            className={linkClasses("consultation")}
          >
            Consultation
          </button>

          {/* ✅ NEW — Report Analyzer (ADDED ONLY) */}
          <button
            onClick={() => navigate("report")}
            className={linkClasses("report")}
          >
            Report Analyzer
          </button>
          <button onClick={() => navigate("heart")}>
            Heart Risk
          </button>

          <button
            onClick={() => navigate("about")}
            className={linkClasses("about")}
          >
            About
          </button>
        </div>
      </nav>
    </header>
  );
}