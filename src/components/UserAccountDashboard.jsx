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
import { useAuth } from "@/context/AuthContext.jsx";

// Lazy dashboards
const PreferencesDashboard = React.lazy(() => import("./PreferencesDashboard"));
const AccountDashboard = React.lazy(() => import("./AccountDashboard"));
const ReferentialDashboard = React.lazy(() => import("./ReferentialDashboard"));
const SupportCenter = React.lazy(() => import("./SupportCenter"));
const HelpModal = React.lazy(() => import("./HelpModal.jsx"));
const LegalDocs = React.lazy(() => import("./LegalDocs.jsx"));

export default function UserAccountDashboard({ onLogout }) {
  const { user: authUser, login } = useAuth();
  const [userData, setUserData] = useState(authUser);
  const [activeView, setActiveView] = useState("profile");
  const [viewStack, setViewStack] = useState([]);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL;

  const isGuest = useMemo(() => !authUser || authUser.role === "guest", [authUser]);

  // Fetch full backend data if not guest
  useEffect(() => {
    if (!isGuest && userData.contact) {
      setLoadingUserData(true);
      fetch(`${API_BASE}/api/user/${userData.contact}`)
        .then((res) => res.json())
        .then((data) => setUserData((prev) => ({ ...prev, ...data })))
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

  // ------------------- API Helpers -------------------
  const apiPost = async (path, payload) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Request failed");
    return data;
  };

  // ------------------- Delete Account -------------------
  const requestDeleteAccount = async () => {
    try {
      setError(""); setMessage("");
      const res = await apiPost("/api/request-delete", { contact: userData.contact });
      setMessage(`Code sent: ${res.debug_code}`);
      setActiveView("delete");
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmDeleteAccount = async (code) => {
    try {
      await apiPost("/api/confirm-delete", { contact: userData.contact, code });
      onLogout?.();
      window.location.href = "/";
    } catch (err) { setError(err.message); }
  };

  // ------------------- Reset Password -------------------
  const requestResetPassword = async () => {
    try {
      setError(""); setMessage("");
      const res = await apiPost("/api/request-reset", { contact: userData.contact });
      setMessage(`Reset code sent: ${res.debug_code}`);
      setActiveView("reset");
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmResetPassword = async (code, newPassword, confirmPassword) => {
    try {
      await apiPost("/api/reset-password", {
        contact: userData.contact,
        code,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setMessage("Password reset successful!");
    } catch (err) { setError(err.message); }
  };

  // ------------------- Render content -------------------
  const renderContent = () => {
    if (isGuest) return (
      <div className="p-6 text-gray-700 dark:text-gray-300">
        <h2 className="text-xl font-bold">🔒 Login Required</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          You must log in to access your dashboard.
        </p>
      </div>
    );

    if (loadingUserData) return <Loading />;

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
            <p>No notifications yet.</p>
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
      case "delete":
        return (
          <div className="p-6 space-y-3">
            <h2 className="text-xl font-bold text-red-600">❌ Delete Account</h2>
            <p>Enter the 6-digit code sent to your email to confirm deletion.</p>
            <input placeholder="Code" className="w-full p-2 border rounded" id="deleteCode" />
            <button
              onClick={() => confirmDeleteAccount(document.getElementById("deleteCode").value)}
              className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              Confirm Delete
            </button>
          </div>
        );
      case "reset":
        return (
          <div className="p-6 space-y-3">
            <h2 className="text-xl font-bold text-blue-600">🔑 Reset Password</h2>
            <p>Enter the code and your new password:</p>
            <input placeholder="Code" className="w-full p-2 border rounded" id="resetCode" />
            <input placeholder="New Password" type="password" className="w-full p-2 border rounded" id="newPassword" />
            <input placeholder="Confirm Password" type="password" className="w-full p-2 border rounded" id="confirmPassword" />
            <button
              onClick={() =>
                confirmResetPassword(
                  document.getElementById("resetCode").value,
                  document.getElementById("newPassword").value,
                  document.getElementById("confirmPassword").value
                )
              }
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Reset Password
            </button>
          </div>
        );
      default:
        return <div>⚠️ Select a menu item to continue.</div>;
    }
  };

  const menuItems = [
    { key: "profile", label: "Profile", icon: User },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "accounts", label: "Accounts", icon: Link2 },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "history", label: "History", icon: History },
    { key: "support", label: "Support Center", icon: LifeBuoy },
    { key: "help", label: "Help & Docs", icon: HelpCircle },
    { key: "referential", label: "Referential", icon: BookOpen },
    { key: "reset", label: "Reset Password", icon: Shield },
    { key: "delete", label: "Delete Account", icon: FileText },
    { key: "privacy", label: "Privacy Policy", icon: Shield },
    { key: "terms", label: "Terms of Service", icon: FileText },
  ];

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

        {message && <p className="text-green-500 text-sm mt-2">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4">
        <Suspense fallback={<Loading />}>{renderContent()}</Suspense>
      </main>
    </div>
  );
}
