// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import MainDashboardV2 from "./components/MainDashboardV2.jsx";
import StartModal from "./components/StartModal.jsx";

import { HistoryProvider } from "./context/HistoryContext.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Handles SPA logic (show start modal or redirect to /pages)
function AppContent() {
  const { hasStarted, login, continueAsGuest } = useAuth();

  if (!hasStarted) {
    return (
      <StartModal onLoginSuccess={login} onGuest={continueAsGuest} />
    );
  }

  return <Navigate to="/pages" replace />;
}

function PagesWrapper() {
  return (
    <Layout>
      <MainDashboardV2 />
    </Layout>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <HistoryProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppContent />} />
              <Route path="/pages" element={<PagesWrapper />} />
              {/* Catch-all redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </HistoryProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
