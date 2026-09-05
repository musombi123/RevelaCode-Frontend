// /workspaces/RevelaCode-Frontend/src/App.jsx

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


// =========================================================
// GLOBAL CONTEXT
// =========================================================

import {
  HistoryProvider,
} from "./context/HistoryContext.jsx";

import {
  PreferencesProvider,
} from "./context/PreferencesContext.jsx";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext.jsx";


// =========================================================
// SPA AUTH WRAPPER
// =========================================================

function SPAWrapper({
  children,
}) {
  const {
    hasStarted,
    loading,
  } = useAuth();


  // -------------------------------------------------------
  // AUTH BOOT
  // -------------------------------------------------------

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-50
          p-6
          text-sm
          text-slate-500
          dark:bg-slate-950
          dark:text-slate-400
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              h-5
              w-5
              animate-spin
              rounded-full
              border-2
              border-slate-300
              border-t-emerald-600
            "
          />

          Booting secure session…
        </div>
      </div>
    );
  }


  // -------------------------------------------------------
  // START MODAL
  // -------------------------------------------------------

  if (!hasStarted) {
    return (
      <StartModal />
    );
  }


  // -------------------------------------------------------
  // AUTHENTICATED APPLICATION
  // -------------------------------------------------------

  return children;
}


// =========================================================
// APP
// =========================================================

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <HistoryProvider>
          <BrowserRouter>

            <Routes>

              {/* =================================================
                  MAIN ECOSYSTEM
              ================================================= */}

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


              {/* =================================================
                  GENERAL PAGES
              ================================================= */}

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


              {/* =================================================
                  BIBLE
                  Existing RevelaCode direct route.
              ================================================= */}

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


              {/* =================================================
                  JUMUIYA ENTRY
                  The actual hubs still render through
                  MainDashboardV2 + dashboardConfig.jsx.
              ================================================= */}

              <Route
                path="/jumuiya"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />


              {/* =================================================
                  BIASHARA ENTRY
                  Deep-link support.
                  MainDashboardV2 can interpret the requested
                  dashboard through the query state if you add
                  that behavior there.
              ================================================= */}

              <Route
                path="/jumuiya/biashara"
                element={
                  <SPAWrapper>
                    <Layout>
                      <MainDashboardV2 />
                    </Layout>
                  </SPAWrapper>
                }
              />


              {/* =================================================
                  SHAMBA ENTRY
              ================================================= */}

              <Route
                path="/jumuiya/shamba"
                element={
                  <SPAWrapper>
                    <Layout>
                      <MainDashboardV2 />
                    </Layout>
                  </SPAWrapper>
                }
              />


              {/* =================================================
                  ELIMU ENTRY
              ================================================= */}

              <Route
                path="/jumuiya/elimu"
                element={
                  <SPAWrapper>
                    <Layout>
                      <MainDashboardV2 />
                    </Layout>
                  </SPAWrapper>
                }
              />


              {/* =================================================
                  COMMUNITY ENTRY
              ================================================= */}

              <Route
                path="/jumuiya/community"
                element={
                  <SPAWrapper>
                    <Layout>
                      <MainDashboardV2 />
                    </Layout>
                  </SPAWrapper>
                }
              />


              {/* =================================================
                  WALLET / PAYMENTS ENTRY
              ================================================= */}

              <Route
                path="/jumuiya/payments"
                element={
                  <SPAWrapper>
                    <Layout>
                      <MainDashboardV2 />
                    </Layout>
                  </SPAWrapper>
                }
              />


              {/* =================================================
                  MARKETPLACE ENTRY
              ================================================= */}

              <Route
                path="/jumuiya/marketplace"
                element={
                  <SPAWrapper>
                    <Layout>
                      <MainDashboardV2 />
                    </Layout>
                  </SPAWrapper>
                }
              />


              {/* =================================================
                  FALLBACK
              ================================================= */}

              <Route
                path="*"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />

            </Routes>

          </BrowserRouter>
        </HistoryProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}