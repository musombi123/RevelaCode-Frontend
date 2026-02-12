// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import MainDashboardV2 from "./components/MainDashboardV2.jsx";
import Pages from "./app/pages.jsx";
import StartModal from "./components/StartModal.jsx";

import { HistoryProvider } from "./context/HistoryContext.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// SPAWrapper: show StartModal if not started
function SPAWrapper({ children }) {
  const { hasStarted, login, continueAsGuest, loading } = useAuth();

  if (loading) return <div className="p-6">Booting secure session…</div>;

  if (!hasStarted) {
    return <StartModal onLoginSuccess={login} onGuest={continueAsGuest} />;
  }

  // Session started → render wrapped content
  return children;
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <HistoryProvider>
          <BrowserRouter>
            <Routes>
              {/* Root route → MainDashboardV2 */}
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

              {/* /pages → PagesLoader */}
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

              {/* Catch-all → redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </HistoryProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
