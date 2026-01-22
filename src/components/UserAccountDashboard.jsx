import React, { useState, Suspense } from "react";
import {
  User,
  Settings,
  Bell,
  History,
  Bot,
  HelpCircle,
  LifeBuoy,
  BookOpen,
  FileText,
  Shield,
  Link2,
} from "lucide-react";
import Loading from "./common/Loading";

// Lazy-loaded dashboards
const PreferencesDashboard = React.lazy(() => import("./PreferencesDashboard"));
const HistoryDashboard = React.lazy(() => import("./HistoryDashboard"));
const AIAssistantDashboard = React.lazy(() => import("./AIAssistantDashboard"));
const AccountDashboard = React.lazy(() => import("./AccountDashboard"));
const ReferentialDashboard = React.lazy(() => import("./ReferentialDashboard"));
const SupportCenter = React.lazy(() => import("./SupportCenter"));
const HelpModal = React.lazy(() => import("./HelpModal"));
const LegalDocs = React.lazy(() => import("./LegalDocs"));

// Profile panel
function ProfileView({ user }) {
  if (!user) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        ⚠️ No user data loaded.
      </div>
    );
  }
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-300">
        👤 Profile
      </h2>
      <p className="text-gray-700 dark:text-gray-200">
        <strong>Name:</strong> {user.full_name}
      </p>
      <p className="text-gray-700 dark:text-gray-200">
        <strong>Contact:</strong> {user.contact || "N/A"}
      </p>
      <p className="text-gray-700 dark:text-gray-200">
        <strong>Role:</strong> {user.role || "Normal"}
      </p>
    </div>
  );
}

export default function UserAccountDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState("profile");

  const menuItems = [
    { key: "profile", label: "Profile", icon: User },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "accounts", label: "Accounts", icon: Link2 },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "history", label: "History", icon: History },
    { key: "ai", label: "RevelaAI", icon: Bot },
    { key: "support", label: "Support Center", icon: LifeBuoy },
    { key: "help", label: "Help & Docs", icon: HelpCircle },
    { key: "referential", label: "Referential", icon: BookOpen },
    { key: "privacy", label: "Privacy Policy", icon: Shield },
    { key: "terms", label: "Terms of Service", icon: FileText },
  ];

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case "profile":
        return <ProfileView user={user} />;
      case "settings":
        return <PreferencesDashboard />;
      case "accounts":
        return <AccountDashboard />;
      case "notifications":
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold">🔔 Notifications</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Your notifications will appear here.
            </p>
          </div>
        );
      case "history":
        return <HistoryDashboard />;
      case "ai":
        return <AIAssistantDashboard />;
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
        return (
          <div className="p-6 text-gray-500 dark:text-gray-400">
            ⚠️ Select a menu item to continue.
          </div>
        );
    }
  };

  return (
    <div className="flex h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-300 mb-4">
          RevelaCode
        </h2>
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

        {/* Logout button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md text-sm"
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
