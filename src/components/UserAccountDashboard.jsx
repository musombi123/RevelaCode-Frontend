import React, {
  useState,
  useEffect,
  Suspense,
  useMemo,
} from "react";

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
  Trash2,
  LogOut,
  ChevronRight,
  UserCircle2,
  LockKeyhole,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import Loading from "./common/Loading";
import UserProfile from "./accounts/UserProfile";
import { useAuth } from "@/context/AuthContext.jsx";

// Lazy dashboards
const PreferencesDashboard = React.lazy(
  () => import("./PreferencesDashboard")
);

const AccountDashboard = React.lazy(
  () => import("./AccountDashboard")
);

const ReferentialDashboard = React.lazy(
  () => import("./ReferentialDashboard")
);

const HelpModal = React.lazy(
  () => import("./HelpModal.jsx")
);

const LegalDocs = React.lazy(
  () => import("./LegalDocs.jsx")
);

const Notifications = React.lazy(
  () => import("./Notifications.jsx")
);

const API_BASE = import.meta.env.VITE_API_URL;

/* =========================================================
   MENU CONFIG
========================================================= */

const accountMenu = [
  {
    key: "profile",
    label: "Profile",
    description: "Your personal information",
    icon: UserCircle2,
  },
  {
    key: "settings",
    label: "Preferences",
    description: "Customize your experience",
    icon: Settings,
  },
  {
    key: "accounts",
    label: "Account & Security",
    description: "Password and account access",
    icon: LockKeyhole,
  },
];

const activityMenu = [
  {
    key: "notifications",
    label: "Notifications",
    description: "Alerts and updates",
    icon: Bell,
  },
  {
    key: "history",
    label: "Activity History",
    description: "Your recent activity",
    icon: History,
  },
];

const resourceMenu = [
  {
    key: "help",
    label: "Help & Documentation",
    description: "Guides and support",
    icon: HelpCircle,
  },
  {
    key: "referential",
    label: "Referential",
    description: "Reference tools and resources",
    icon: BookOpen,
  },
];

const legalMenu = [
  {
    key: "privacy",
    label: "Privacy Policy",
    description: "How your data is handled",
    icon: Shield,
  },
  {
    key: "terms",
    label: "Terms of Service",
    description: "Platform terms and conditions",
    icon: FileText,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date) {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function getInitials(value = "") {
  const clean = value.trim();

  if (!clean) return "RC";

  const parts = clean.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/* =========================================================
   COMPONENT
========================================================= */

export default function UserAccountDashboard({ onLogout }) {
  const { user: authUser } = useAuth();

  const isGuest = useMemo(
    () => !authUser || authUser.role === "guest",
    [authUser]
  );

  const [activeView, setActiveView] = useState("profile");

  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState([]);

  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {
    if (isGuest || !authUser?.contact) return;

    let cancelled = false;

    setLoadingUser(true);
    setError("");
    setMessage("");

    fetch(
      `${API_BASE}/api/user/${encodeURIComponent(authUser.contact)}`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load user");
        }

        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setUserData(data);
        }
      })
      .catch((err) => {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load your account information.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingUser(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authUser?.contact, isGuest]);

  /* =======================================================
     LOAD HISTORY
  ======================================================= */

  useEffect(() => {
    if (activeView !== "history" || !userData?.contact) return;

    let cancelled = false;

    setLoadingHistory(true);

    fetch(
      `${API_BASE}/api/user/history?contact=${encodeURIComponent(
        userData.contact
      )}`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load history");
        }

        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setHistory(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.error(err);

        if (!cancelled) {
          setHistory([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeView, userData?.contact]);

  /* =======================================================
     API POST
  ======================================================= */

  const apiPost = async (path, payload) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data.message || data.error || "Request failed"
      );
    }

    return data;
  };

  /* =======================================================
     DELETE ACCOUNT
  ======================================================= */

  const confirmDeleteAccount = async () => {
    if (!deleteCode.trim()) {
      setError("Please enter the confirmation code.");

      return;
    }

    try {
      setDeletingAccount(true);
      setError("");

      await apiPost("/api/confirm-delete", {
        contact: userData.contact,
        code: deleteCode.trim(),
      });

      setShowDeleteModal(false);
      setDeleteCode("");

      onLogout?.();

      window.location.href = "/";
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingAccount(false);
    }
  };

  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  const confirmResetPassword = async (payload) => {
    try {
      setError("");

      await apiPost("/api/reset-password", {
        contact: userData.contact,
        ...payload,
      });

      setMessage("Password reset successful.");
    } catch (err) {
      setError(err.message);
    }
  };

  /* =======================================================
     ACTIVE ITEM
  ======================================================= */

  const activeItem = useMemo(() => {
    const allItems = [
      ...accountMenu,
      ...activityMenu,
      ...resourceMenu,
      ...legalMenu,
    ];

    return (
      allItems.find((item) => item.key === activeView) || {
        key: "profile",
        label: "Profile",
        description: "Your personal information",
        icon: UserCircle2,
      }
    );
  }, [activeView]);

  /* =======================================================
     CHANGE VIEW
  ======================================================= */

  const changeView = (view) => {
    setActiveView(view);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =======================================================
     RENDER MENU GROUP
  ======================================================= */

  const renderMenuGroup = (title, items) => (
    <div className="mb-7">
      <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        {title}
      </p>

      <div className="space-y-1">
        {items.map(
          ({
            key,
            label,
            description,
            icon: Icon,
          }) => {
            const active = activeView === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => changeView(key)}
                className={`
                  group relative flex w-full items-center gap-3
                  rounded-xl px-3 py-3 text-left
                  transition-all duration-200
                  ${
                    active
                      ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
                  }
                `}
              >
                <span
                  className={`
                    flex h-9 w-9 flex-shrink-0 items-center justify-center
                    rounded-lg transition
                    ${
                      active
                        ? "bg-white/10 text-white dark:bg-slate-900/10 dark:text-slate-900"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {label}
                  </span>

                  <span
                    className={`
                      mt-0.5 block truncate text-[11px]
                      ${
                        active
                          ? "text-white/65 dark:text-slate-600"
                          : "text-slate-400 dark:text-slate-500"
                      }
                    `}
                  >
                    {description}
                  </span>
                </span>

                <ChevronRight
                  className={`
                    h-4 w-4 flex-shrink-0 transition
                    ${
                      active
                        ? "opacity-100"
                        : "opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100"
                    }
                  `}
                />
              </button>
            );
          }
        )}
      </div>
    </div>
  );

  /* =======================================================
     CONTENT
  ======================================================= */

  const renderContent = () => {
    if (isGuest) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <LockKeyhole className="h-7 w-7 text-slate-500" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Login required
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Sign in to manage your profile, preferences,
              account security, notifications, and activity.
            </p>
          </div>
        </div>
      );
    }

    if (loadingUser || !userData) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loading />
        </div>
      );
    }

    switch (activeView) {
      case "profile":
        return <UserProfile user={userData} />;

      case "settings":
        return (
          <PreferencesDashboard userData={userData} />
        );

      case "accounts":
        return (
          <AccountDashboard
            userData={userData}
            onResetPassword={confirmResetPassword}
          />
        );

      case "notifications":
        return <Notifications />;

      case "history":
        return (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <History className="h-5 w-5 text-slate-500" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Activity History
                  </h2>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review actions associated with your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {loadingHistory ? (
                <div className="py-12">
                  <Loading />
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <History className="h-6 w-6 text-slate-400" />
                  </div>

                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    No activity yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Your account activity will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, index) => (
                    <div
                      key={`${item.timestamp || "activity"}-${index}`}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                          {item.action || "Account activity"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.timestamp
                            ? new Date(
                                item.timestamp
                              ).toLocaleString()
                            : "Unknown time"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        return null;
    }
  };

  /* =======================================================
     GUEST VIEW
  ======================================================= */

  if (isGuest) {
    return (
      <div className="min-h-full bg-slate-50 p-4 dark:bg-slate-950">
        {renderContent()}
      </div>
    );
  }

  /* =======================================================
     MAIN LAYOUT
  ======================================================= */

  return (
    <>
      <div className="min-h-full bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="hidden w-[290px] flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
            {/* Brand */}
            <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                  <span className="text-sm font-black">
                    R
                  </span>
                </div>

                <div>
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                    RevelaCode
                  </h1>

                  <p className="text-xs text-slate-400">
                    Account Center
                  </p>
                </div>
              </div>
            </div>

            {/* User */}
            <div className="px-5 pt-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                    {getInitials(
                      userData?.name ||
                        userData?.username ||
                        userData?.contact
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {userData?.name ||
                        userData?.username ||
                        "RevelaCode User"}
                    </p>

                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {userData?.contact}
                    </p>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">
                    Member since
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {formatDate(userData?.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {renderMenuGroup(
                "Account",
                accountMenu
              )}

              {renderMenuGroup(
                "Activity",
                activityMenu
              )}

              {renderMenuGroup(
                "Resources",
                resourceMenu
              )}

              {renderMenuGroup(
                "Legal",
                legalMenu
              )}

              {/* Danger zone */}
              <div className="mt-2 border-t border-slate-200 pt-5 dark:border-slate-800">
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-red-400">
                  Danger Zone
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setDeleteCode("");
                    setShowDeleteModal(true);
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                    <Trash2 className="h-4 w-4" />
                  </span>

                  <span className="flex-1">
                    <span className="block text-sm font-semibold">
                      Delete Account
                    </span>

                    <span className="block text-[11px] text-red-400">
                      Permanently remove your account
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* Logout */}
            {onLogout && (
              <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </aside>

          {/* =================================================
              MOBILE HEADER
          ================================================= */}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white dark:bg-white dark:text-slate-900">
                      R
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {activeItem.label}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        Account Center
                      </p>
                    </div>
                  </div>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                      aria-label="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Mobile horizontal nav */}
                <div className="mt-4 -mx-1 overflow-x-auto pb-1">
                  <div className="flex min-w-max gap-2 px-1">
                    {[
                      ...accountMenu,
                      ...activityMenu,
                      ...resourceMenu,
                    ].map(
                      ({
                        key,
                        label,
                        icon: Icon,
                      }) => {
                        const active =
                          activeView === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => changeView(key)}
                            className={`
                              flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition
                              ${
                                active
                                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                              }
                            `}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <div className="mx-auto w-full max-w-6xl">
                {/* Page heading */}
                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Account Center
                    </div>

                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                      {activeItem.label}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {activeItem.description}
                    </p>
                  </div>

                  {/* Desktop identity */}
                  <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900 sm:flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                      {getInitials(
                        userData?.name ||
                          userData?.username ||
                          userData?.contact
                      )}
                    </div>

                    <div className="max-w-[180px]">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {userData?.name ||
                          userData?.username ||
                          "RevelaCode User"}
                      </p>

                      <p className="truncate text-[10px] text-slate-400">
                        {userData?.contact}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alerts */}
                {(message || error) && (
                  <div className="mb-6">
                    {message && (
                      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{message}</span>
                      </div>
                    )}

                    {error && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <Suspense
                  fallback={
                    <div className="flex min-h-[40vh] items-center justify-center">
                      <Loading />
                    </div>
                  }
                >
                  {renderContent()}
                </Suspense>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* =====================================================
          DELETE ACCOUNT MODAL
      ===================================================== */}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-red-200 bg-white shadow-2xl dark:border-red-900/40 dark:bg-slate-900">
            <div className="border-b border-red-100 bg-red-50 px-6 py-6 dark:border-red-900/30 dark:bg-red-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <Trash2 className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
                    Delete account
                  </h2>

                  <p className="mt-0.5 text-xs text-red-500/80 dark:text-red-400/70">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Deleting your account permanently removes your
                account data and access to RevelaCode.
              </p>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Confirmation
                </p>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Enter the confirmation code provided by your
                  account deletion flow.
                </p>

                <input
                  value={deleteCode}
                  onChange={(e) =>
                    setDeleteCode(e.target.value)
                  }
                  placeholder="Enter confirmation code"
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteCode("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDeleteAccount}
                  disabled={deletingAccount}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />

                  {deletingAccount
                    ? "Deleting..."
                    : "Delete permanently"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
