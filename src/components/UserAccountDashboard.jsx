import React, { useState, Suspense, useEffect, useMemo } from "react";
import {
  User,
  Settings,
  Bell,
  History,
  HelpCircle,
  LifeBuoy,
  BookOpen,
  FileText,
  Shield,
  Link2,
  ArrowLeft,
  LogIn,
} from "lucide-react";
import Loading from "./common/Loading";

// Lazy-loaded dashboards
const PreferencesDashboard = React.lazy(() => import("./PreferencesDashboard"));
const AccountDashboard = React.lazy(() => import("./AccountDashboard"));
const ReferentialDashboard = React.lazy(() => import("./ReferentialDashboard"));
const SupportCenter = React.lazy(() => import("./SupportCenter"));
const HelpModal = React.lazy(() => import("./HelpModal.jsx"));
const LegalDocs = React.lazy(() => import("./LegalDocs.jsx"));

// History context
import { useHistory } from "@/context/HistoryContext.jsx";

// Profile card
import UserProfile from "./accounts/UserProfile";

/**
 * 🔐 User Dashboard:
 * - Fully reactive to StartModal login
 * - Merges StartModal user with backend data
 * - Supports guest and logged-in flows
 */
export default function UserAccountDashboard({ user, onLogout, onLogin }) {
  const [activeView, setActiveView] = useState("profile");
  const [viewStack, setViewStack] = useState([]);
  const [userData, setUserData] = useState(user || null); // Immediately show StartModal user
  const [loadingUserData, setLoadingUserData] = useState(false);

  const isGuest = !user || user?.role === "guest";
  const API_BASE = import.meta.env.VITE_API_URL;

  // Fetch full backend data if not guest
  useEffect(() => {
    if (!isGuest && user?.contact) {
      setLoadingUserData(true);
      fetch(`${API_BASE}/api/user/${user.contact}`)
        .then((res) => res.json())
        .then((data) => {
          // Merge backend data with existing StartModal user info
          setUserData((prev) => ({ ...prev, ...data }));
        })
        .catch(console.error)
        .finally(() => setLoadingUserData(false));
    }
  }, [user, isGuest, API_BASE]);

  // Set initial view
  useEffect(() => {
    setActiveView(isGuest ? "login" : "profile");
  }, [isGuest]);

  // Navigation stack for back button
  useEffect(() => {
    setViewStack((prev) => {
      if (!activeView) return prev;
      if (prev.length === 0) return [activeView];
      if (prev[prev.length - 1] === activeView) return prev;
      return [...prev, activeView];
    });
  }, [activeView]);

  const goBack = () => {
    setViewStack((prev) => {
      if (prev.length <= 1) return prev;
      const updated = prev.slice(0, -1);
      setActiveView(updated[updated.length - 1]);
      return updated;
    });
  };

  const fullMenuItems = useMemo(
    () => [
      { key: "profile", label: "Profile", icon: User },
      { key: "settings", label: "Settings", icon: Settings },
      { key: "accounts", label: "Accounts", icon: Link2 },
      { key: "notifications", label: "Notifications", icon: Bell },
      { key: "history", label: "History", icon: History },
      { key: "support", label: "Support Center", icon: LifeBuoy },
      { key: "help", label: "Help & Docs", icon: HelpCircle },
      { key: "referential", label: "Referential", icon: BookOpen },
      { key: "privacy", label: "Privacy Policy", icon: Shield },
      { key: "terms", label: "Terms of Service", icon: FileText },
    ],
    []
  );

  const guestMenuItems = useMemo(() => [{ key: "login", label: "Login", icon: LogIn }], []);
  const menuItems = isGuest ? guestMenuItems : fullMenuItems;
  const showBackButton = ["privacy", "terms"].includes(activeView);

  const handleStartModalLogin = (newUser) => {
    setUserData(newUser); // instantly update dashboard
    onLogin?.(newUser);
    setActiveView("profile");
  };

  const renderContent = () => {
    if (isGuest && activeView !== "login") {
      return (
        <div className="p-6 text-gray-700 dark:text-gray-300">
          <h2 className="text-xl font-bold">🔒 Login Required</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            You’re browsing as a guest. Login to unlock profile, settings, history, and accounts.
          </p>
          <button
            onClick={() => setActiveView("login")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow transition"
          >
            <LogIn className="w-4 h-4" />
            Go to Login
          </button>
        </div>
      );
    }

    if (loadingUserData) return <Loading />;

    switch (activeView) {
      case "login":
        return (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">🔑 Login</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Login to access your profile, settings, history, and linked accounts.
            </p>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                ⚡ StartModal handles authentication and passes user data here.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleStartModalLogin({ contact: "guest@example.com", fullName: "Guest User", role: "guest" })}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow transition"
                >
                  <LogIn className="w-4 h-4" />
                  Open StartModal
                </button>
                <button
                  onClick={() => setActiveView("privacy")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </button>
                <button
                  onClick={() => setActiveView("terms")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <FileText className="w-4 h-4" />
                  Terms
                </button>
              </div>
            </div>
          </div>
        );

      case "profile":
        return <UserProfile user={userData} />;

      case "settings":
        return <PreferencesDashboard userData={userData} />;

      case "accounts":
        return <AccountDashboard userData={userData} />;

      case "notifications":
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold">🔔 Notifications</h2>
            <p className="text-gray-500 dark:text-gray-400">Your notifications will appear here.</p>
          </div>
        );

      case "history": {
        const historyList = userData?.history || [];
        const { clearHistory } = useHistory();
        return (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold">📜 History</h2>
            {historyList.length === 0 && <p className="text-gray-500 dark:text-gray-400">No history yet.</p>}
            <ul className="space-y-2">
              {historyList.map((entry, idx) => (
                <li key={idx} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <p>
                    <strong>Type:</strong> {entry.type}
                  </p>
                  <p>
                    <strong>Input:</strong> {entry.input}
                  </p>
                  <p>
                    <strong>Output:</strong> {entry.output}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
            {historyList.length > 0 && (
              <button
                onClick={clearHistory}
                className="mt-4 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow"
              >
                Clear History
              </button>
            )}
          </div>
        );
      }

      case "support":
        return <SupportCenter />;
      case "help":
        return <HelpModal />;
      case "referential":
        return <ReferentialDashboard />;
      case "privacy":
        return <LegalDocs activeTab="privacy" />;
      case "terms":
        return <LegalDocs activeTab="terms" />;

      default:
        return <div className="p-6 text-gray-500 dark:text-gray-400">⚠️ Select a menu item to continue.</div>;
    }
  };

  return (
    <div className="flex h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-300 mb-4">RevelaCode</h2>

        {/* Mini user label */}
        <div className="mb-4 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userData?.fullName || userData?.full_name || "Guest"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Role: {userData?.role || "guest"}</p>
        </div>

        <nav className="space-y-1">
          {menuItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition ${
                activeView === key ? "bg-indigo-600 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {!isGuest && onLogout && (
          <button
            onClick={onLogout}
            className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md text-sm font-semibold shadow"
          >
            Logout
          </button>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4">
        <Suspense fallback={<Loading />}>{renderContent()}</Suspense>
      </main>
    </div>
  );
}
