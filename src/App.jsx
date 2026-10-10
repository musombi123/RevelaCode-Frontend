// src/App.jsx

import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// =========================================================
// EXISTING REVELACODE COMPONENTS
// =========================================================

import Layout from "./components/Layout.jsx";
import MainDashboardV2 from "./components/MainDashboardV2.jsx";
import Pages from "./app/pages.jsx";
import BibleDashboard from "./components/BibleDashboard.jsx";
import StartModal from "./components/StartModal.jsx";

import ElimuPublicSchoolPage from "./pages/jumuiya/ElimuPublicSchoolPage.jsx";

// =========================================================
// GLOBAL CONTEXT
// =========================================================

import { HistoryProvider } from "./context/HistoryContext.jsx";

import { PreferencesProvider } from "./context/PreferencesContext.jsx";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext.jsx";

// =========================================================
// SPA AUTH WRAPPER
// Internal RevelaCode dashboards remain behind startup/auth.
// Public school websites do not use this wrapper.
// =========================================================

function SPAWrapper({ children }) {
  const { hasStarted, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
          Booting secure session…
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return <StartModal />;
  }

  return children;
}

// =========================================================
// INTERNAL DASHBOARD ROUTE
// =========================================================

function InternalDashboard() {
  return (
    <SPAWrapper>
      <Layout>
        <MainDashboardV2 />
      </Layout>
    </SPAWrapper>
  );
}

// =========================================================
// APP ROUTES
// =========================================================

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <HistoryProvider>
          <BrowserRouter>
            <Routes>
              {/* Main RevelaCode ecosystem */}
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

              {/* General pages */}
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

              {/* Bible */}
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

              {/* Jumuiya entry */}
              <Route
                path="/jumuiya"
                element={<Navigate to="/" replace />}
              />

              {/* Jumuiya hubs */}
              <Route
                path="/jumuiya/biashara"
                element={<InternalDashboard />}
              />

              <Route
                path="/jumuiya/shamba"
                element={<InternalDashboard />}
              />

              <Route
                path="/jumuiya/elimu"
                element={<InternalDashboard />}
              />

              <Route
                path="/jumuiya/community"
                element={<InternalDashboard />}
              />

              <Route
                path="/jumuiya/payments"
                element={<InternalDashboard />}
              />

              <Route
                path="/jumuiya/marketplace"
                element={<InternalDashboard />}
              />

              {/* =================================================
                  PUBLIC SCHOOL WEBSITES

                  Example:
                  https://revelacode.com/namarambi

                  A school slug is resolved by the public Elimu API.
                  This route is intentionally outside SPAWrapper so
                  visitors can view published school pages without
                  opening the private dashboard first.
              ================================================= */}

              <Route
                path="/:schoolSlug"
                element={<ElimuPublicSchoolPage />}
              />

              {/* Unknown multi-segment URLs */}
              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />
            </Routes>
          </BrowserRouter>
        </HistoryProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}