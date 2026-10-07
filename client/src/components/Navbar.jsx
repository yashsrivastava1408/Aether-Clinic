import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Logo, Sun, Moon, Menu, Close, Settings, LogOut } from "./Icons";

const navLinks = [
  { path: "/dashboard", label: "Home" },
  { path: "/consultation", label: "Consultation" },
  { path: "/report", label: "Lab report" },
  { path: "/heart", label: "Heart risk" },
  { path: "/diabetes", label: "Diabetes risk" },
  { path: "/about", label: "About" },
];

function Avatar({ user, size = "h-8 w-8" }) {
  return (
    <span className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-semibold text-brand`}>
      {user.avatar
        ? <img src={user.avatar} alt="" className="h-full w-full object-cover" />
        : user.name?.charAt(0).toUpperCase()}
    </span>
  );
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout, showSignIn } = useAuth();
  const location = useLocation();
  const profileRef = useRef(null);
  const signedIn = user && !user.isGuest;

  // Menus close when the page changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // The profile menu closes on a click outside it or on Escape
  useEffect(() => {
    if (!profileOpen) return undefined;
    const onClick = (e) => { if (!profileRef.current?.contains(e.target)) setProfileOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setProfileOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  const isActive = (path) => location.pathname === path
    || (path === "/dashboard" && location.pathname === "/")
    || (path === "/consultation" && location.pathname.startsWith("/chatbot"));

  const linkClass = (path) => `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive(path)
    ? "bg-brand-soft text-brand"
    : "text-muted hover:bg-surface-2 hover:text-ink"}`;

  const themeButton = (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost px-2.5"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight text-ink">MedNexus</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink key={link.path} to={link.path} className={linkClass(link.path)} aria-current={isActive(link.path) ? "page" : undefined}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {themeButton}

          {signedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center rounded-full p-1"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Account menu"
              >
                <Avatar user={user} />
              </button>

              {profileOpen && (
                <div role="menu" className="card fade-in absolute right-0 mt-2 w-60 overflow-hidden shadow-lg">
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <Link to="/settings" role="menuitem" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-2">
                    <Settings className="h-4 w-4 text-muted" /> Settings
                  </Link>
                  <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-2">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/settings" className="btn btn-ghost hidden px-2.5 sm:inline-flex" aria-label="Settings" title="Settings">
                <Settings />
              </Link>
              <button onClick={showSignIn} className="btn btn-primary hidden sm:inline-flex">Sign in</button>
            </>
          )}

          <button
            className="btn btn-ghost px-2.5 lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <Close /> : <Menu />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-line bg-bg lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {navLinks.map((link) => (
              <NavLink key={link.path} to={link.path} className={linkClass(link.path)}>
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/settings" className={linkClass("/settings")}>Settings</NavLink>

            <div className="mt-2 border-t border-line pt-3">
              {signedIn ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar user={user} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={logout} className="btn btn-secondary shrink-0">Sign out</button>
                </div>
              ) : (
                <button onClick={showSignIn} className="btn btn-primary w-full">Sign in</button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
