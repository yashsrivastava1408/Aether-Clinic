import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import LegalModal from "../LegalModal";
import {
  Chat, ChevronLeft, ChevronRight, Close, Drop, FileText, Heart, Home, Info, LogOut, Logo, Menu, Moon, Settings, Sun,
} from "../Icons";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ path: "/dashboard", label: "Home", icon: Home }],
  },
  {
    label: "Care",
    items: [
      { path: "/consultation", label: "Consultation", icon: Chat },
      { path: "/report", label: "Lab report", icon: FileText },
    ],
  },
  {
    label: "Risk checks",
    items: [
      { path: "/heart", label: "Heart risk", icon: Heart },
      { path: "/diabetes", label: "Diabetes risk", icon: Drop },
    ],
  },
  {
    label: "More",
    items: [
      { path: "/settings", label: "Settings", icon: Settings },
      { path: "/about", label: "About", icon: Info },
    ],
  },
];

const TITLES = {
  "/": "Home", "/dashboard": "Home", "/consultation": "Consultation", "/report": "Lab report", "/heart": "Heart risk",
  "/diabetes": "Diabetes risk", "/settings": "Settings", "/about": "About", "/review": "Clinician review",
};

const COLLAPSE_KEY = "sidebar-collapsed";

const readCollapsed = () => {
  try { return localStorage.getItem(COLLAPSE_KEY) === "yes"; } catch { return false; }
};

function Avatar({ user, size = "h-9 w-9" }) {
  return (
    <span className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-semibold text-brand`}>
      {user?.avatar
        ? <img src={user.avatar} alt="" className="h-full w-full object-cover" />
        : (user?.name?.charAt(0).toUpperCase() || "G")}
    </span>
  );
}

function NavItems({ collapsed, isActive }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {!collapsed && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80">{group.label}</p>}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? "justify-center" : ""} ${active
                      ? "bg-brand-soft text-brand"
                      : "text-muted hover:bg-surface-2 hover:text-ink"}`}
                  >
                    <span className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand transition-transform duration-300 ${active ? "scale-y-100" : "scale-y-0"}`} />
                    <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function AccountBlock({ collapsed }) {
  const { user, logout, showSignIn } = useAuth();
  const signedIn = user && !user.isGuest;

  if (collapsed) {
    return (
      <div className="flex justify-center border-t border-line p-3">
        {signedIn
          ? <button onClick={logout} className="btn btn-ghost px-2.5" aria-label="Sign out" title="Sign out"><LogOut /></button>
          : <button onClick={showSignIn} className="rounded-full" aria-label="Sign in" title="Sign in"><Avatar user={user} /></button>}
      </div>
    );
  }

  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <Avatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
          <p className="truncate text-xs text-muted">{signedIn ? user.email : "Not signed in"}</p>
        </div>
        {signedIn && (
          <button onClick={logout} className="btn btn-ghost px-2" aria-label="Sign out" title="Sign out"><LogOut className="h-4 w-4" /></button>
        )}
      </div>
      {!signedIn && <button onClick={showSignIn} className="btn btn-primary mt-2 w-full">Sign in</button>}
    </div>
  );
}

/**
 * The frame around every page: a sidebar on large screens (it can be
 * narrowed to icons), a drawer on small ones, and a top bar.
 */
export default function AppShell({ children, fullHeight = false }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const drawerRef = useRef(null);

  const isActive = (path) => location.pathname === path
    || (path === "/dashboard" && location.pathname === "/")
    || (path === "/consultation" && location.pathname.startsWith("/chatbot"))
    || (path === "/settings" && location.pathname === "/review");

  const title = TITLES[location.pathname]
    || (location.pathname.startsWith("/chatbot") ? "Consultation" : location.pathname.startsWith("/followup") ? "Check-in" : "MedNexus");

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    drawerRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try { localStorage.setItem(COLLAPSE_KEY, prev ? "no" : "yes"); } catch { /* the choice just is not remembered */ }
      return !prev;
    });
  };

  const brand = (compact) => (
    <Link to="/dashboard" className={`flex items-center gap-2.5 ${compact ? "justify-center" : ""}`} aria-label="MedNexus home">
      <Logo className="h-8 w-8 shrink-0" />
      {!compact && <span className="text-lg font-semibold tracking-tight text-ink">MedNexus</span>}
    </Link>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar, large screens */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-300 ease-out lg:flex ${collapsed ? "w-[76px]" : "w-64"}`}>
        <div className={`flex h-16 shrink-0 items-center border-b border-line ${collapsed ? "justify-center px-2" : "px-5"}`}>
          {brand(collapsed)}
        </div>
        <NavItems collapsed={collapsed} isActive={isActive} />
        <AccountBlock collapsed={collapsed} />
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-[4.6rem] flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-soft transition-colors hover:text-ink"
          aria-label={collapsed ? "Widen the sidebar" : "Narrow the sidebar"}
          title={collapsed ? "Widen the sidebar" : "Narrow the sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Drawer, small screens */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="backdrop-in absolute inset-0 bg-black/55" onClick={() => setDrawerOpen(false)} />
          <div ref={drawerRef} tabIndex={-1} className="drawer-in relative flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-surface shadow-float outline-none">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
              {brand(false)}
              <button onClick={() => setDrawerOpen(false)} className="btn btn-ghost px-2" aria-label="Close menu"><Close /></button>
            </div>
            <NavItems collapsed={false} isActive={isActive} />
            <AccountBlock collapsed={false} />
          </div>
        </div>
      )}

      {/* Page column */}
      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-out ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <header className={`sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-bg/85 px-4 backdrop-blur transition-[border-color,box-shadow] duration-200 sm:px-8 ${scrolled ? "border-line shadow-soft" : "border-transparent"}`}>
          <button onClick={() => setDrawerOpen(true)} className="btn btn-ghost -ml-2 px-2.5 lg:hidden" aria-label="Open menu" aria-expanded={drawerOpen}>
            <Menu />
          </button>
          <span className="lg:hidden">{brand(true)}</span>
          <p className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{title}</p>
          <button
            onClick={toggleTheme}
            className="btn btn-ghost px-2.5"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span key={theme} className="fade-in">{theme === "dark" ? <Sun /> : <Moon />}</span>
          </button>
        </header>

        <main className={fullHeight ? "min-h-0 flex-1" : "flex-1"}>
          <div key={location.pathname} className={`page-enter ${fullHeight ? "h-full" : ""}`}>
            {children}
          </div>
        </main>

        {!fullHeight && (
          <footer className="border-t border-line">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-muted sm:px-8 md:flex-row md:items-center md:justify-between">
              <p>MedNexus gives general health information. It is not a doctor. In an emergency, call your local emergency number.</p>
              <button onClick={() => setShowLegal(true)} className="shrink-0 text-left font-medium hover:text-ink">Terms and privacy</button>
            </div>
          </footer>
        )}
      </div>

      <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} />
    </div>
  );
}
