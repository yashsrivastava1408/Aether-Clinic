import React, { useState, useEffect } from "react";

export default function Navbar({ navigate, currentPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkClasses = (page) =>
    `px-4 py-2 text-sm font-medium transition-all duration-300 ${currentPage === page
      ? "text-emerald-500"
      : "text-gray-400 hover:text-white"
    }`;

  const navLinks = [
    { page: "dashboard", label: "Home" },
    { page: "consultation", label: "Consultation" },
    { page: "report", label: "Report Analyzer" },
    { page: "heart", label: "Heart Risk" },
    { page: "about", label: "About" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-[#030303]/95 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
        }`}
    >
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div
          className="cursor-pointer group flex items-center gap-3"
          onClick={() => navigate("dashboard")}
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
            <span className="text-lg">🧠</span>
          </div>
          <span className="font-semibold text-lg text-white hidden sm:block">
            Aether <span className="text-emerald-500">Clinic</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => (
            <button
              key={link.page}
              onClick={() => navigate(link.page)}
              className={linkClasses(link.page)}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden lg:block">
          <button
            onClick={() => navigate("consultation")}
            className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden absolute top-full left-0 right-0 bg-[#030303]/98 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ${mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
      >
        <div className="container mx-auto px-6 py-4 flex flex-col space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.page}
              onClick={() => {
                navigate(link.page);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left py-3 ${linkClasses(link.page)}`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              navigate("consultation");
              setMobileMenuOpen(false);
            }}
            className="w-full mt-4 px-5 py-3 bg-emerald-600 text-white text-sm font-medium rounded-lg text-center"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}