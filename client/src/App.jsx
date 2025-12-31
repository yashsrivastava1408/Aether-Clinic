import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Consultation from "./pages/Consultation";
import About from "./pages/About";
import Chatbot from "./pages/Chatbot";
import ReportAnalyzer from "./pages/ReportAnalyzer";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

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
  };

  return (
    <div className="bg-slate-50 min-h-screen text-gray-800 font-sans">
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