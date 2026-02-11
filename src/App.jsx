import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import MainDashboardV2 from "./components/MainDashboardV2.jsx";
import StartModal from "./components/StartModal.jsx";

import Pages from "./app/pages.jsx";
import { HistoryProvider } from "./context/HistoryContext.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// SPA wrapper: shows StartModal if not started, else redirects to target page
function SPAWrapper({ children, target }) {
  const { hasStarted, login, continueAsGuest, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (hasStarted) {
      navigate(target, { replace: true });
    }
  }, [hasStarted, navigate, target]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!hasStarted) {
    return <StartModal onLoginSuccess={login} onGuest={continueAsGuest} />;
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
              {/* Root / shows MainDashboardV2 after StartModal */}
              <Route
                path="/"
                element={
                  <SPAWrapper target="/">
                    <Layout>
                      <MainDashboardV2 />
                    </Layout>
                  </SPAWrapper>
                }
              />

              {/* /pages shows Pages after StartModal */}
              <Route
                path="/pages"
                element={
                  <SPAWrapper target="/pages">
                    <Layout>
                      <Pages />
                    </Layout>
                  </SPAWrapper>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </HistoryProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
