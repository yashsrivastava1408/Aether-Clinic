import React, { useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import SplashScreen from "./components/SplashScreen";
import HolographicCursor from "./components/HolographicCursor";
import PageTransition from "./components/PageTransition";
import SystemFooter from "./components/SystemFooter";
import ThemeTransition from "./components/ThemeTransition";
import WelcomeScreen from "./components/WelcomeScreen";
import TrackingConsentModal from "./components/TrackingConsentModal";

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
  const [showConsent, setShowConsent] = useState(false); // New State for Consent
  const { hasOnboarded } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide splash screen callback
  const handleSplashComplete = React.useCallback(() => {
    setShowSplash(false);

    // Check if user has already given consent
    const hasConsented = localStorage.getItem('tracking_consent');
    if (!hasConsented) {
      setShowConsent(true); // Show modal if no choice made yet
    }
  }, []);

  const handleConsent = (choice) => {
    // Save choice to localStorage (persists across reloads)
    localStorage.setItem('tracking_consent', choice ? 'allowed' : 'declined');
    setShowConsent(false);

    // Get current user session if exists
    const storedUser = JSON.parse(localStorage.getItem('user_session') || '{}');
    const email = storedUser.email; // Might be null if guest not fully set up

    if (choice) {
      // 📍 User Allowed: Get Location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log("📍 Location captured:", latitude, longitude);

            // Send to Backend
            try {
              if (email) {
                await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/auth/location`, {
                  email,
                  consent: true,
                  location: { lat: latitude, lng: longitude }
                });
                console.log("✅ Location saved to DB");
              }
            } catch (err) {
              console.error("❌ Failed to save location:", err);
            }
          },
          (error) => {
            console.warn("⚠️ Location permission allowed but retrieval failed:", error.message);
          }
        );
      }
    } else {
      // 🚫 User Declined
      if (email) {
        axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/auth/location`, {
          email,
          consent: false
        }).catch(e => console.error("Failed to update consent:", e));
      }
    }
  };

  // Redirect to Dashboard on Refresh (Mount)
  // If user refreshes on Consultation or Chatbot, force them back to Dashboard
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes("/consultation") || path.includes("/chatbot")) {
      console.log("🔄 Detected deep link/refresh on restricted route. Redirecting to Dashboard.");
      navigate("/dashboard", { replace: true });
    }
  }, []); // Empty dependency array = Runs ONLY on Mount (Initial Load/Refresh)

  return (
    <div className="bg-slate-50 dark:bg-[#030303] min-h-screen text-slate-900 dark:text-gray-100 font-sans transition-colors duration-500 app-container">
      {/* Splash Screen - Overlays everything */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Consent Modal - Appears after Splash if needed */}
      {!showSplash && showConsent && (
        <TrackingConsentModal
          onAccept={() => handleConsent(true)}
          onDecline={() => handleConsent(false)}
        />
      )}

      <ThemeTransition />

      {/* Only show app content if Splash IS DONE and Consent IS DONE */}
      {!showSplash && !showConsent && !hasOnboarded && (
        <WelcomeScreen />
      )}

      {/* Hide Navbar during splash, consent, or welcome screen */}
      {!showSplash && !showConsent && hasOnboarded && (
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