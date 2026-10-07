import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WelcomeScreen from "./components/WelcomeScreen";
import { Spinner } from "./components/Icons";

import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages are loaded when they are first opened
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Consultation = lazy(() => import("./pages/Consultation"));
const About = lazy(() => import("./pages/About"));
const Chatbot = lazy(() => import("./pages/Chatbot"));
const ReportAnalyzer = lazy(() => import("./pages/ReportAnalyzer"));
const HeartRisk = lazy(() => import("./pages/HeartRisk"));
const DiabetesRisk = lazy(() => import("./pages/DiabetesRisk"));
const Settings = lazy(() => import("./pages/Settings"));
const FollowUp = lazy(() => import("./pages/FollowUp"));
const Review = lazy(() => import("./pages/Review"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-muted" role="status" aria-label="Loading">
    <Spinner className="h-6 w-6" />
  </div>
);

const MainContent = () => {
  const { hasOnboarded, isLoading } = useAuth();
  const location = useLocation();
  const isChat = location.pathname.startsWith("/chatbot");

  // Each page starts at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isLoading) return <PageLoader />;
  if (!hasOnboarded) return <WelcomeScreen />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/consultation" element={<Consultation />} />
            <Route path="/chatbot/:specialization" element={<Chatbot />} />
            <Route path="/report" element={<ReportAnalyzer />} />
            <Route path="/heart" element={<HeartRisk />} />
            <Route path="/diabetes" element={<DiabetesRisk />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/followup/:token" element={<FollowUp />} />
            <Route path="/review" element={<Review />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {/* The chat fills the screen, so it has no footer under it */}
      {!isChat && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
