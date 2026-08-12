import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import MainDashboardV2 from "./components/MainDashboardV2.jsx";
import Pages from "./app/pages.jsx";
import BibleDashboard from "./components/BibleDashboard.jsx";
import StartModal from "./components/StartModal.jsx";

import { HistoryProvider } from "./context/HistoryContext.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function SPAWrapper({ children }) {
  const { hasStarted, login, guestMode, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        Booting secure session…
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <StartModal
        onLoginSuccess={login}
        onGuest={guestMode}
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <HistoryProvider>
          <BrowserRouter>
            <Routes>

              {/* HOME */}
              <Route
                path="/"
                element={
                  <SPAWrapper>
                    <Layout>
                      <MainDashboardV2 />
                    </Layout>
                  </SPAWrapper>
                }
              />

              {/* PAGES */}
              <Route
                path="/pages"
                element={
                  <SPAWrapper>
                    <Layout>
                      <Pages />
                    </Layout>
                  </SPAWrapper>
                }
              />

              {/* BIBLE */}
              <Route
                path="/bible"
                element={
                  <SPAWrapper>
                    <Layout>
                      <BibleDashboard />
                    </Layout>
                  </SPAWrapper>
                }
              />

              {/* FALLBACK */}
              <Route
                path="*"
                element={<Navigate to="/pages" replace />}
              />

            </Routes>
          </BrowserRouter>
        </HistoryProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
