// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import MainDashboardV2 from "./components/MainDashboardV2.jsx";
import StartModal from "./components/StartModal.jsx";

import Pages from "./app/pages.jsx";
import { HistoryProvider } from "./context/HistoryContext.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Optional: SPA logic only for /pages, not /
function PagesWrapper() {
  const { hasStarted, login, continueAsGuest, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;

  if (!hasStarted) {
    return <StartModal onLoginSuccess={login} onGuest={continueAsGuest} />;
  }

  return (
    <Layout>
      <Pages />
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
              {/* Keep root / exactly as before */}
              <Route
                path="/"
                element={
                  <Layout>
                    <MainDashboardV2 />
                  </Layout>
                }
              />

              {/* /pages SPA route */}
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
