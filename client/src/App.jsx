import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import SplashScreen from "./components/SplashScreen";
import Dashboard from "./pages/Dashboard";
import Consultation from "./pages/Consultation";
import About from "./pages/About";
import Chatbot from "./pages/Chatbot";
import ReportAnalyzer from "./pages/ReportAnalyzer";
import HeartRisk from "./pages/HeartRisk";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  // Hide splash screen after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
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
  };

  return (
    <div className="bg-slate-950 min-h-screen text-gray-100 font-sans">
      {/* Splash Screen */}
      {showSplash && <SplashScreen />}

      <Navbar
        navigate={setCurrentPage}
        currentPage={currentPage}
      />
      <main className="pt-20">
        {renderContent()}
      </main>
    </div>
  );
}