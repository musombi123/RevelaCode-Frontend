import React, { useState, useEffect, Suspense, useMemo } from "react";
import {
  User,
  Settings,
  Bell,
  History,
  HelpCircle,
  BookOpen,
  FileText,
  Shield,
  Link2,
} from "lucide-react";

import Loading from "./common/Loading";
import UserProfile from "./accounts/UserProfile";
import { useAuth } from "@/context/AuthContext.jsx";

// Lazy dashboards
const PreferencesDashboard = React.lazy(() => import("./PreferencesDashboard"));
const AccountDashboard = React.lazy(() => import("./AccountDashboard"));
const ReferentialDashboard = React.lazy(() => import("./ReferentialDashboard"));
const HelpModal = React.lazy(() => import("./HelpModal.jsx"));
const LegalDocs = React.lazy(() => import("./LegalDocs.jsx"));

const API_BASE = import.meta.env.VITE_API_URL;

export default function UserAccountDashboard({ onLogout }) {
  const { user: authUser } = useAuth();
  const isGuest = useMemo(() => !authUser || authUser.role === "guest", [authUser]);

  const [activeView, setActiveView] = useState("profile");
  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* ===================== LOAD USER ===================== */
  useEffect(() => {
    if (isGuest || !authUser?.contact) return;

    setLoadingUser(true);
    setError("");

    fetch(`${API_BASE}/api/user/${encodeURIComponent(authUser.contact)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load user");
        return res.json();
      })
      .then(setUserData)
      .catch((err) => {
        console.error(err);
        setError("Failed to load user profile");
      })
      .finally(() => setLoadingUser(false));
  }, [authUser?.contact, isGuest]);

  /* ===================== LOAD HISTORY ===================== */
  useEffect(() => {
    if (activeView !== "history" || !userData?.contact) return;

    setLoadingHistory(true);
    fetch(`${API_BASE}/api/user/history?contact=${encodeURIComponent(userData.contact)}`)
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [activeView, userData?.contact]);

  /* ===================== API POST ===================== */
  const apiPost = async (path, payload) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  /* ===================== DELETE ACCOUNT ===================== */
  const confirmDeleteAccount = async (code) => {
    try {
      await apiPost("/api/confirm-delete", { contact: userData.contact, code });
      onLogout?.();
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
    }
  };

  /* ===================== RESET PASSWORD ===================== */
  const confirmResetPassword = async (payload) => {
    try {
      await apiPost("/api/reset-password", { contact: userData.contact, ...payload });
      setMessage("Password reset successful");
    } catch (err) {
      setError(err.message);
    }
  };

  /* ===================== CONTENT ===================== */
  const renderContent = () => {
    if (isGuest) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-bold">🔒 Login Required</h2>
          <p className="text-gray-500 mt-1">
            Please log in to access your account dashboard.
          </p>
        </div>
      );
    }

    if (loadingUser || !userData) return <Loading />;

    switch (activeView) {
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
            <p className="text-gray-500">No notifications yet.</p>
          </div>
        );

      case "history":
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">📜 History</h2>
            {loadingHistory && <Loading />}
            {!loadingHistory && history.length === 0 && (
              <p className="text-gray-500">No history recorded.</p>
            )}
            <ul className="space-y-2">
              {history.map((h, i) => (
                <li
                  key={i}
                  className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800"
                >
                  <p className="text-sm">{h.action || "Activity"}</p>
                  <p className="text-xs text-gray-500">
                    {h.timestamp ? new Date(h.timestamp).toLocaleString() : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        );

      case "help":
        return <HelpModal />;

      case "referential":
        return <ReferentialDashboard />;

      case "privacy":
        return <LegalDocs activeTab="privacy" />;

      case "terms":
        return <LegalDocs activeTab="terms" />;

      default:
        return <div className="p-6">Select a menu item</div>;
    }
  };

  const menuItems = [
    { key: "profile", label: "Profile", icon: User },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "accounts", label: "Accounts", icon: Link2 },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "history", label: "History", icon: History },
    { key: "help", label: "Help & Docs", icon: HelpCircle },
    { key: "referential", label: "Referential", icon: BookOpen },
    { key: "privacy", label: "Privacy Policy", icon: Shield },
    { key: "terms", label: "Terms of Service", icon: FileText },
    { key: "delete", label: "Delete Account", icon: User }, // Delete Account button
  ];

  /* ===================== LAYOUT ===================== */
  return (
    <div className="flex h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
      <aside className="w-64 border-r bg-gray-50 dark:bg-gray-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-indigo-600 mb-4">RevelaCode</h2>

        {userData && (
          <div className="mb-4 p-3 rounded-lg border bg-white dark:bg-gray-900">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm font-semibold">{userData.contact}</p>
            <p className="text-xs text-gray-500">
              Joined{" "}
              {userData.created_at
                ? new Date(userData.created_at).toLocaleDateString()
                : ""}
            </p>
          </div>
        )}

        <nav className="space-y-1">
          {menuItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() =>
                key === "delete"
                  ? confirmDeleteAccount(prompt("Type 'DELETE' to confirm"))
                  : setActiveView(key)
              }
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition ${
                activeView === key
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
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
            className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md text-sm font-semibold"
          >
            Logout
          </button>
        )}

        {message && <p className="text-green-500 mt-2 text-sm">{message}</p>}
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </aside>

      <main className="flex-1 overflow-y-auto p-4">
        <Suspense fallback={<Loading />}>{renderContent()}</Suspense>
      </main>
    </div>
  );
}
