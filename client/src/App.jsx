import React, { useState } from "react";
import Navbar from "./components/Navbar";
import SplashScreen from "./components/SplashScreen";
import Dashboard from "./pages/Dashboard";
import Consultation from "./pages/Consultation";
import About from "./pages/About";
import Chatbot from "./pages/Chatbot";
import ReportAnalyzer from "./pages/ReportAnalyzer";
import HeartRisk from "./pages/HeartRisk";
import ClinicLocations from "./pages/ClinicLocations";
import HolographicCursor from "./components/HolographicCursor";
import PageTransition from "./components/PageTransition";
import SystemFooter from "./components/SystemFooter";
import ThemeTransition from "./components/ThemeTransition";
import WelcomeScreen from "./components/WelcomeScreen";

import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Main Layout Component to access Auth Context
const MainLayout = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const { hasOnboarded } = useAuth();

  // Hide splash screen callback
  const handleSplashComplete = React.useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentPage("chatbot");
  };

  const handleBackToConsultation = () => {
    setSelectedDoctor(null);
    setCurrentPage("consultation");
  };

  const renderContent = () => {
    if (currentPage === "dashboard")
      return <Dashboard navigate={setCurrentPage} />;

    if (currentPage === "consultation")
      return <Consultation onSelectDoctor={handleSelectDoctor} />;

    if (currentPage === "chatbot")
      return (
        <Chatbot
          doctor={selectedDoctor}
          onBack={handleBackToConsultation}
        />
      );

    if (currentPage === "about")
      return <About />;

    // ✅ ONLY ADDITION — Report Analyzer
    if (currentPage === "report")
      return <ReportAnalyzer />;
    if (currentPage === "heart")
      return <HeartRisk />;
    if (currentPage === "locations")
      return <ClinicLocations />;
  };

  return (
    <div className="bg-slate-50 dark:bg-[#030303] min-h-screen text-slate-900 dark:text-gray-100 font-sans transition-colors duration-500 app-container">
      {/* Splash Screen - Overlays everything */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <ThemeTransition />

      {!showSplash && !hasOnboarded && (
        <WelcomeScreen />
      )}

      {/* Hide Navbar during splash or welcome screen */}
      {!showSplash && hasOnboarded && (
        <>
          <Navbar
            navigate={setCurrentPage}
            currentPage={currentPage}
          />
          {/* Global Sci-Fi Cursor */}
          <HolographicCursor />

          <main className="pt-20">
            <PageTransition key={currentPage}>
              {renderContent()}
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
    <AuthProvider>
      <ThemeProvider>
        <MainLayout />
      </ThemeProvider>
    </AuthProvider>
  );
}