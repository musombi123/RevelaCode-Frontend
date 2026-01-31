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
  LogIn,
} from "lucide-react";
import Loading from "./common/Loading";
import UserProfile from "./accounts/UserProfile";

// Lazy dashboards
const PreferencesDashboard = React.lazy(() => import("./PreferencesDashboard"));
const AccountDashboard = React.lazy(() => import("./AccountDashboard"));
const ReferentialDashboard = React.lazy(() => import("./ReferentialDashboard"));
const SupportCenter = React.lazy(() => import("./SupportCenter"));
const HelpModal = React.lazy(() => import("./HelpModal.jsx"));
const LegalDocs = React.lazy(() => import("./LegalDocs.jsx"));

export default function UserAccountDashboard({ user: initialUser, onLogout, onLogin }) {
  // --- Normalize user function ---
  const normalizeUser = (u) => ({
    fullName: u?.full_name || u?.fullName || "Guest",
    contact: u?.contact || "",
    role: u?.role || "guest",
    history: u?.history || [],
  });

  const [userData, setUserData] = useState(normalizeUser(initialUser));
  const [activeView, setActiveView] = useState(userData.role === "guest" ? "login" : "profile");
  const [viewStack, setViewStack] = useState([]);
  const [loadingUserData, setLoadingUserData] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL;

  // Dynamically compute guest status
  const isGuest = useMemo(() => userData.role === "guest", [userData]);

  // Fetch full backend data if not guest
  useEffect(() => {
    if (!isGuest && userData.contact) {
      setLoadingUserData(true);
      fetch(`${API_BASE}/api/user/${userData.contact}`)
        .then((res) => res.json())
        .then((data) => setUserData((prev) => normalizeUser({ ...prev, ...data })))
        .catch(console.error)
        .finally(() => setLoadingUserData(false));
    }
  }, [userData.contact, isGuest, API_BASE]);

  // Navigation stack
  useEffect(() => {
    setViewStack((prev) => {
      if (!activeView) return prev;
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

  // Menu
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

  // Called when user logs in via StartModal
  const handleStartModalLogin = (newUser) => {
    const normalized = normalizeUser(newUser);
    setUserData(normalized);
    onLogin?.(normalized);
    setActiveView("profile");
  };

  // --- Render content dynamically ---
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
            <h2 className="text-xl font-bold">🔑 Login</h2>
            <button
              onClick={() =>
                handleStartModalLogin({
                  contact: "user@example.com",
                  full_name: "William Musombi",
                  role: "verified",
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow"
            >
              <LogIn className="w-4 h-4" />
              Open StartModal
            </button>
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
            <p>Your notifications will appear here.</p>
          </div>
        );
      case "history":
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold">📜 History</h2>
            <p>No history yet.</p>
          </div>
        );
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
        return <div>⚠️ Select a menu item to continue.</div>;
    }
  };

  return (
    <div className="flex h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-300 mb-4">RevelaCode</h2>
        <div className="mb-4 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userData.fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Role: {userData.role}</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition ${
                activeView === key
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
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

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4">
        <Suspense fallback={<Loading />}>{renderContent()}</Suspense>
      </main>
    </div>
  );
}
