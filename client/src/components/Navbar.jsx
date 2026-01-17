import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, login, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Helper to determine active state
  // Handles root path "/" as "dashboard"
  const isActive = (path) => {
    if (path === "/dashboard" && location.pathname === "/") return true;
    return location.pathname === path;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const messages = [
    "SYSTEM: ONLINE",
    "ENCRYPTION: AES-256",
    "LATENCY: 14ms",
    "NEURAL NET: ACTIVE",
    "NODES: 4,096"
  ];

  const StatusTicker = () => {
    const [index, setIndex] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % messages.length);
      }, 3000);
      return () => clearInterval(interval);
    }, []);

    return (
      <span className={`${theme === 'dark' ? 'text-emerald-500/50' : 'text-emerald-600/70'} min-w-[100px] animate-pulse`}>
        {messages[index]}
      </span>
    );
  };

  const linkClasses = (path) =>
    `relative px-4 py-2 text-sm font-medium transition-all duration-300 group ${isActive(path)
      ? "text-emerald-500 font-semibold"
      : theme === 'dark'
        ? "text-gray-400 hover:text-white"
        : "text-gray-500 hover:text-gray-900"
    }`;

  const navLinks = [
    { path: "/dashboard", label: "Home" },
    { path: "/consultation", label: "Talk to Doctor" },
    { path: "/report", label: "Check Report" },
    { path: "/heart", label: "Heart Health" },
    { path: "/about", label: "About Us" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
        ? theme === 'dark'
          ? "bg-[#030303]/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-emerald-900/5"
          : "bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-lg shadow-gray-200/50"
        : "bg-transparent border-b border-transparent"
        }`}
    >
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center gap-6">
          <div
            className="cursor-pointer group flex items-center gap-3"
            onClick={() => handleNavigation("/dashboard")}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]`}>
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <span className={`font-bold text-lg tracking-tight hidden sm:block ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Aether<span className="text-emerald-500">Clinic</span>
              </span>
              <span className="text-[10px] text-emerald-500/60 font-mono tracking-widest hidden sm:block uppercase">
                Neural Interface V2.0
              </span>
            </div>
          </div>

          {/* Security Badge (Desktop) */}
          <div className={`hidden xl:flex items-center gap-2 px-3 py-1 rounded-full border ${theme === 'dark' ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-emerald-400/80' : 'text-emerald-700'}`}>AES-256 ENCRYPTED</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNavigation(link.path)}
              className={linkClasses(link.path)}
            >
              {link.path === "/heart" ? (
                <span className="flex items-center gap-2 tracking-wide">
                  <span className="animate-heartbeat inline-block drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">

                  </span>
                  <span className={isActive(link.path) ? "text-red-500 font-semibold" : "group-hover:text-red-500 transition-colors"}>
                    {link.label}
                  </span>
                </span>
              ) : (
                link.label
              )}
              {/* Active Indicator Line */}
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-emerald-500 transition-all duration-300 group-hover:w-full ${isActive(link.path) ? 'w-full' : ''}`} />
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-4">

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${theme === 'dark'
              ? 'bg-white/5 hover:bg-white/10 text-yellow-400 shadow-[0_0_10px_rgba(253,224,71,0.2)]'
              : 'bg-gray-100 hover:bg-gray-200 text-slate-700 shadow-sm'
              }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              // Sun Icon
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              // Moon Icon
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* System Status Ticker */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 w-[140px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <StatusTicker />
          </div>

          {/* Auth Section */}
          {!user || user.isGuest ? (
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  await login('user@example.com'); // Simulated Login
                  handleNavigation('/dashboard');
                }}
                className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              >
                Log In
              </button>
              <button
                onClick={async () => {
                  await login('user@example.com'); // Simulated Sign Up
                  handleNavigation('/dashboard');
                }}
                className="relative overflow-hidden group px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold transition-all hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                <span className="relative z-10">Sign Up</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-emerald-500 font-bold text-xs">{user.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className={`absolute right-0 mt-4 w-48 rounded-xl border shadow-xl overflow-hidden backdrop-blur-xl animate-fade-in-up ${theme === 'dark' ? 'bg-[#0a0a0a]/90 border-white/10' : 'bg-white/90 border-gray-200'}`}>
                  <div className="p-4 border-b border-white/5">
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                    <p className="text-[10px] text-emerald-500 font-mono">{user.id.split('-').pop().toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleNavigation('/settings');
                      setProfileOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>⚙️ Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-red-400 hover:bg-white/5' : 'text-red-500 hover:bg-red-50'}`}
                  >
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex gap-4 lg:hidden">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${theme === 'dark'
              ? 'bg-white/5 text-yellow-400'
              : 'bg-gray-100 text-slate-700'
              }`}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button
            className={`p-2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
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
        </div>
      </nav>

      {/* Mobile Menu - Enhanced */}
      <div
        className={`lg:hidden absolute top-full left-0 right-0 border-b transition-all duration-300 overflow-hidden ${mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"} ${theme === 'dark' ? 'bg-[#0a0a0a]/95 border-white/5' : 'bg-white/95 border-gray-200'}`}
      >
        <div className="container mx-auto px-6 py-6 flex flex-col space-y-2">
          {/* Security Badge Mobile */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border mb-2 w-fit ${theme === 'dark' ? 'bg-emerald-900/10 border-emerald-500/10' : 'bg-emerald-50 border-emerald-200'}`}>
            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-emerald-400/80' : 'text-emerald-700'}`}>AES-256 SECURE</span>
          </div>

          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNavigation(link.path)}
              className={`w-full text-left py-3 px-4 rounded-lg transition-colors ${isActive(link.path)
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold"
                : theme === 'dark'
                  ? "text-gray-400 hover:bg-white/5 hover:text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
            >
              {link.path === "/heart" ? (
                <span className="flex items-center gap-2">
                  <span className="animate-heartbeat inline-block drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    ❤️
                  </span>
                  <span className={isActive(link.path) ? "text-red-500" : "group-hover:text-red-500"}>
                    {link.label}
                  </span>
                </span>
              ) : (
                link.label
              )}
            </button>
          ))}
          {/* Auth Buttons Mobile */}
          {!user || user.isGuest ? (
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={async () => {
                  await login('user@example.com');
                  setMobileMenuOpen(false);
                  handleNavigation('/dashboard');
                }}
                className={`w-full py-3 rounded-lg border font-medium ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-900 hover:bg-gray-50'}`}
              >
                Log In
              </button>
              <button
                onClick={async () => {
                  await login('user@example.com');
                  setMobileMenuOpen(false);
                  handleNavigation('/dashboard');
                }}
                className="w-full py-3 bg-emerald-600 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/20"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-emerald-500 font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                  <p className="text-[10px] text-emerald-500 font-mono">{user.id.split('-').pop().toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-lg flex items-center gap-2 ${theme === 'dark' ? 'text-red-400 hover:bg-white/5' : 'text-red-500 hover:bg-red-50'}`}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}