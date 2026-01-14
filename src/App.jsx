import Layout from "./components/Layout.jsx";
import MainDashboardV2 from "./components/MainDashboardV2.jsx";
import StartModal from "./components/StartModal.jsx";

import { HistoryProvider } from "./context/HistoryContext.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function AppContent() {
  const { hasStarted, login, continueAsGuest } = useAuth();

  return (
    <>
      {!hasStarted && (
        <StartModal
          onLoginSuccess={login}
          onGuest={continueAsGuest}
        />
      )}

      {hasStarted && (
        <Layout>
          <MainDashboardV2 />
        </Layout>
      )}
    </>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <HistoryProvider>
          <AppContent />
        </HistoryProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
