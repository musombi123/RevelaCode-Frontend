// src/App.jsx

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

function ElimuPortalRoute({ portal }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const schoolSlug = new URLSearchParams(location.search).get("school") || "";
  const getAuthHeaders = async () => {
    const token = typeof auth?.getAccessToken === "function" ? await auth.getAccessToken() : "";
    const tokenType = typeof auth?.getTokenType === "function" ? await auth.getTokenType() : "Bearer";
    return token ? { Authorization: `${tokenType || "Bearer"} ${String(token).replace(/^Bearer\s+/i, "")}` } : {};
  };
  const onLoginRequired = () => navigate("/", { replace: false });
  const onBack = () => navigate(-1);
  return portal === "parent"
    ? <ElimuParentPortal schoolSlug={schoolSlug} getAuthHeaders={getAuthHeaders} onLoginRequired={onLoginRequired} onBack={onBack} />
    : <ElimuStudentPortal schoolSlug={schoolSlug} getAuthHeaders={getAuthHeaders} onLoginRequired={onLoginRequired} onBack={onBack} />;
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <HistoryProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<SPAWrapper><Layout><MainDashboardV2 /></Layout></SPAWrapper>} />
              <Route path="/pages" element={<SPAWrapper><Layout><Pages /></Layout></SPAWrapper>} />
              <Route path="/bible" element={<SPAWrapper><Layout><BibleDashboard /></Layout></SPAWrapper>} />
              <Route path="/jumuiya" element={<Navigate to="/" replace />} />
              <Route path="/jumuiya/biashara" element={<InternalDashboard />} />
              <Route path="/jumuiya/shamba" element={<InternalDashboard />} />
              <Route path="/jumuiya/elimu/parent" element={<ElimuPortalRoute portal="parent" />} />
              <Route path="/jumuiya/elimu/student" element={<ElimuPortalRoute portal="student" />} />
              <Route path="/jumuiya/elimu" element={<InternalDashboard />} />
              <Route path="/jumuiya/community" element={<InternalDashboard />} />
              <Route path="/jumuiya/payments" element={<InternalDashboard />} />
              <Route path="/jumuiya/marketplace" element={<InternalDashboard />} />

              {/*
                Public school website routes. The slug is the first segment;
                any second segment selects a public subpage. These routes are
                intentionally outside SPAWrapper so visitors do not need an
                internal RevelaCode session to view published school content.

                /school-slug             Home
                /school-slug/about       About
                /school-slug/events      Events
                /school-slug/academics   Academics
                /school-slug/media       Photos and videos
                /school-slug/documents  Public documents
                /school-slug/contact     Contact
              */}
              <Route path="/elimu-invitation" element={<SPAWrapper><ElimuInvitationPage /></SPAWrapper>} />
              <Route path="/:schoolSlug/*" element={<ElimuPublicSchoolPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </HistoryProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
