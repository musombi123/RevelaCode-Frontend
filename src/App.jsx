
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Layout from "./components/Layout.jsx";
import MainDashboardV2 from "./components/MainDashboardV2.jsx";
import Pages from "./app/pages.jsx";
import BibleDashboard from "./components/BibleDashboard.jsx";
import StartModal from "./components/StartModal.jsx";
import ElimuPublicSchoolPage from "./pages/jumuiya/ElimuPublicSchoolPage.jsx";
import ElimuInvitationPage from "./pages/ElimuInvitationPage.jsx";
import ElimuParentPortal from "./pages/jumuiya/ElimuParentPortal.jsx";
import ElimuStudentPortal from "./pages/jumuiya/ElimuStudentPortal.jsx";
import BiasharaPublicWebsitePage from "./pages/jumuiya/BiasharaPublicWebsitePage.jsx";

import { HistoryProvider } from "./context/HistoryContext.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

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

  if (!hasStarted) return <StartModal />;

  return children;
}

function InternalDashboard() {
  return (
    <SPAWrapper>
      <Layout>
        <MainDashboardV2 />
      </Layout>
    </SPAWrapper>
  );
}

/*
 * Explicitly handle platform-admin and support dashboard URLs.
 * These paths must never be interpreted as public-school slugs.
 *
 * Pages already selects AdminDashboard or SupportDashboard
 * according to the authenticated user's role.
 */
function PlatformDashboardRoute({ requiredRole, initialAdminTab = "overview" }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
          Checking platform access…
        </div>
      </div>
    );
  }

  const role = String(user?.role || "").trim().toLowerCase();

  if (!user || role !== requiredRole) {
    return <Navigate to="/pages" replace />;
  }

  return (
    <Layout>
      <Pages initialAdminTab={initialAdminTab} />
    </Layout>
  );
}

function isPlatformHostname() {
  const hostname = String(window.location.hostname || "").trim().toLowerCase();
  const configured = String(import.meta.env.VITE_PLATFORM_HOSTNAMES || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".onrender.com") ||
    configured.includes(hostname)
  );
}

function PlatformHomeRoute() {
  if (!isPlatformHostname()) {
    return <ElimuPublicSchoolPage customDomainMode />;
  }
  return (
    <SPAWrapper>
      <Layout>
        <MainDashboardV2 />
      </Layout>
    </SPAWrapper>
  );
}

function PlatformSchoolRoute() {
  return isPlatformHostname()
    ? <ElimuPublicSchoolPage />
    : <ElimuPublicSchoolPage customDomainMode />;
}

function ElimuPortalRoute({ portal }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const schoolSlug =
    new URLSearchParams(location.search).get("school") || "";

  const getAuthHeaders = async () => {
    const token =
      typeof auth?.getAccessToken === "function"
        ? await auth.getAccessToken()
        : "";

    const tokenType =
      typeof auth?.getTokenType === "function"
        ? await auth.getTokenType()
        : "Bearer";

    return token
      ? {
          Authorization: `${tokenType || "Bearer"} ${String(token).replace(/^Bearer\s+/i, "")}`,
        }
      : {};
  };

  const onLoginRequired = () => navigate("/", { replace: false });
  const onBack = () => navigate(-1);

  return portal === "parent" ? (
    <ElimuParentPortal
      schoolSlug={schoolSlug}
      getAuthHeaders={getAuthHeaders}
      onLoginRequired={onLoginRequired}
      onBack={onBack}
    />
  ) : (
    <ElimuStudentPortal
      schoolSlug={schoolSlug}
      getAuthHeaders={getAuthHeaders}
      onLoginRequired={onLoginRequired}
      onBack={onBack}
    />
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <HistoryProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PlatformHomeRoute />} />

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

              {/* Platform administration routes */}
              <Route
                path="/admin"
                element={<Navigate to="/admin/dashboard" replace />}
              />

              <Route
                path="/admin/dashboard"
                element={<PlatformDashboardRoute requiredRole="admin" />}
              />

              {/* Use the regular authentication flow, not a public-school slug. */}
              <Route
                path="/admin/login"
                element={<Navigate to="/pages" replace />}
              />

              <Route
                path="/admin/*"
                element={<Navigate to="/admin/dashboard" replace />}
              />

              <Route path="/meta-engineer" element={<PlatformDashboardRoute requiredRole="admin" initialAdminTab="metaEngineer" />} />

              <Route path="/sci-core" element={<PlatformDashboardRoute requiredRole="admin" initialAdminTab="sciCore" />} />

              {/* Support routes */}
              <Route
                path="/support"
                element={<Navigate to="/support/dashboard" replace />}
              />

              <Route
                path="/support/dashboard"
                element={<PlatformDashboardRoute requiredRole="support" />}
              />

              <Route
                path="/support/login"
                element={<Navigate to="/pages" replace />}
              />

              <Route
                path="/support/*"
                element={<Navigate to="/support/dashboard" replace />}
              />

              {/* Jumuiya application routes */}
              <Route
                path="/jumuiya"
                element={<Navigate to="/" replace />}
              />

              <Route
                path="/jumuiya/biashara"
                element={<InternalDashboard />}
              />

              <Route
                path="/jumuiya/shamba"
                element={<InternalDashboard />}
              />

              <Route
                path="/jumuiya/elimu/parent"
                element={<ElimuPortalRoute portal="parent" />}
              />

              <Route
                path="/jumuiya/elimu/student"
                element={<ElimuPortalRoute portal="student" />}
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

              {/* Public Biashara storefronts are isolated from school vanity URLs. */}
              <Route path="/b/:businessSlug" element={<BiasharaPublicWebsitePage />} />

              {/* Public school websites: /school-slug, /school-slug/about, etc. */}
              <Route
                path="/elimu-invitation"
                element={
                  <SPAWrapper>
                    <ElimuInvitationPage />
                  </SPAWrapper>
                }
              />

              <Route
                path="/:schoolSlug/*"
                element={<PlatformSchoolRoute />}
              />

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
