import React, { useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import SplashScreen from "./components/SplashScreen";
import HolographicCursor from "./components/HolographicCursor";
import PageTransition from "./components/PageTransition";
import SystemFooter from "./components/SystemFooter";
import ThemeTransition from "./components/ThemeTransition";
import WelcomeScreen from "./components/WelcomeScreen";

import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Lazy Load Pages for Performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Consultation = lazy(() => import("./pages/Consultation"));
const About = lazy(() => import("./pages/About"));
const Chatbot = lazy(() => import("./pages/Chatbot"));
const ReportAnalyzer = lazy(() => import("./pages/ReportAnalyzer"));
const HeartRisk = lazy(() => import("./pages/HeartRisk"));
const Settings = lazy(() => import("./pages/Settings"));

// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#030303]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      <div className="text-emerald-500 font-mono text-sm animate-pulse">LOADING_MODULE...</div>
    </div>
  </div>
);

// Main Content Wrapper to handle Routing
const MainContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { hasOnboarded } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide splash screen callback
  const handleSplashComplete = React.useCallback(() => {
    setShowSplash(false);
  }, []);

  // Redirect to Dashboard on Refresh (Mount)
  // If user refreshes on Consultation or Chatbot, force them back to Dashboard
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes("/consultation") || path.includes("/chatbot")) {
      console.log("🔄 Detected deep link/refresh on restricted route. Redirecting to Dashboard.");
      navigate("/dashboard", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = Runs ONLY on Mount (Initial Load/Refresh)

  return (
    <div className="bg-slate-50 dark:bg-[#030303] min-h-screen text-slate-900 dark:text-gray-100 font-sans transition-colors duration-500 app-container">
      {/* Splash Screen - Overlays everything */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <ThemeTransition />

      {/* Only show app content if Splash IS DONE */}
      {!showSplash && !hasOnboarded && (
        <WelcomeScreen />
      )}

      {/* Hide Navbar during splash or welcome screen */}
      {!showSplash && hasOnboarded && (
        <>
          <Navbar currentPath={location.pathname} />
          {/* Global Sci-Fi Cursor */}
          <HolographicCursor />

          <main className="pt-20">
            <PageTransition key={location.pathname}>
              <Suspense fallback={<PageLoader />}>
                <Routes location={location}>
                  <Route path="/" element={<Dashboard navigate={navigate} />} />
                  <Route path="/dashboard" element={<Dashboard navigate={navigate} />} />
                  <Route path="/consultation" element={<Consultation />} />

                  <Route path="/chatbot/:specialization" element={<Chatbot />} />
                  <Route path="/report" element={<ReportAnalyzer />} />
                  <Route path="/heart" element={<HeartRisk />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                </Routes>
              </Suspense>
            </PageTransition>
          </main>

          <SystemFooter />
        </>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <MainContent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}