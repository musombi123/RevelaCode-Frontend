// src/components/UserAccountDashboard.jsx

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  Suspense,
} from "react";

import {
  Settings,
  Bell,
  History,
  HelpCircle,
  BookOpen,
  FileText,
  Shield,
  Trash2,
  LogOut,
  ChevronRight,
  UserCircle2,
  LockKeyhole,
  WalletCards,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BadgeCheck,
  MoreHorizontal,
  X,
} from "lucide-react";

import Loading from "./common/Loading";
import UserProfile from "./accounts/UserProfile";
import { useAuth } from "@/context/AuthContext.jsx";

/* =========================================================
   LAZY DASHBOARDS
========================================================= */

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

/* =========================================================
   API BASE
========================================================= */

const API_BASE = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

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
    key: "payments",
    label: "Payments & Wallet",
    description: "Balance, transfers and transaction history",
    icon: WalletCards,
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
    return new Date(date).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  } catch {
    return "—";
  }
}

function getInitials(value = "") {
  const clean = String(value).trim();

  if (!clean) return "RC";

  const parts = clean.split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/*
 * Safely extract a user object from common
 * RevelaCode API response shapes.
 */
function extractUserData(payload) {
  if (!payload) return null;

  if (
    payload.user &&
    typeof payload.user === "object"
  ) {
    return payload.user;
  }

  if (
    payload.data &&
    typeof payload.data === "object"
  ) {
    if (
      payload.data.user &&
      typeof payload.data.user === "object"
    ) {
      return payload.data.user;
    }

    if (
      payload.data.data &&
      typeof payload.data.data === "object"
    ) {
      if (
        payload.data.data.user &&
        typeof payload.data.data.user === "object"
      ) {
        return payload.data.data.user;
      }

      return payload.data.data;
    }

    return payload.data;
  }

  return payload;
}

/*
 * Safely extract history from common
 * RevelaCode API response shapes.
 */
function extractHistory(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    Array.isArray(payload.history)
  ) {
    return payload.history;
  }

  if (
    payload &&
    Array.isArray(payload.data)
  ) {
    return payload.data;
  }

  if (
    payload?.data &&
    Array.isArray(payload.data.history)
  ) {
    return payload.data.history;
  }

  if (
    payload?.data?.data &&
    Array.isArray(payload.data.data)
  ) {
    return payload.data.data;
  }

  return [];
}

/*
 * Extract useful backend error information.
 */
async function getResponseError(response, fallback) {
  let data = null;

  try {
    data = await response
      .clone()
      .json();
  } catch {
    try {
      const text = await response
        .clone()
        .text();

      if (text) {
        data = {
          raw: text,
        };
      }
    } catch {
      data = null;
    }
  }

  return (
    data?.message ||
    data?.error ||
    data?.detail ||
    data?.raw ||
    `${fallback} (${response.status})`
  );
}


/* =========================================================
   PRESENTATION HELPERS
   These helpers format existing data for display only.
========================================================= */

function getRelativeTime(value) {
  if (!value) return "Time unavailable";

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Time unavailable";

  const elapsed = Math.max(0, Date.now() - time);
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + "m ago";

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";

  const days = Math.floor(hours / 24);
  if (days < 7) return days + "d ago";

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks + "w ago";

  const months = Math.floor(days / 30);
  if (months < 12) return months + "mo ago";

  return Math.floor(days / 365) + "y ago";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function UserAccountDashboard({
  onLogout,
  onNavigate,
}) {
  const {
    user: authUser,
    isGuest,
    authFetch,
  } = useAuth();

  const [activeView, setActiveView] =
    useState("profile");

  const [userData, setUserData] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [loadingUser, setLoadingUser] =
    useState(false);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [deleteCode, setDeleteCode] =
    useState("");

  const [deletingAccount, setDeletingAccount] =
    useState(false);

  const mainScrollRef = useRef(null);

  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {
    if (
      isGuest ||
      !authUser?.contact ||
      !authFetch ||
      !API_BASE
    ) {
      return;
    }

    let cancelled = false;

    const loadUser = async () => {
      setLoadingUser(true);
      setError("");
      setMessage("");

      try {
        const url =
          `${API_BASE}/api/user/${encodeURIComponent(
            authUser.contact
          )}`;

        const res = await authFetch(url);

        const data = await res
          .json()
          .catch(() => null);

        if (!res.ok) {
          const reason =
            await getResponseError(
              res,
              "Failed to load user"
            );

          throw new Error(reason);
        }

        const resolvedUser =
          extractUserData(data);

        if (!resolvedUser) {
          throw new Error(
            "The server returned an empty user response."
          );
        }

        if (!cancelled) {
          setUserData(resolvedUser);
        }
      } catch (err) {
        console.error(
          "❌ Failed to load user:",
          err
        );

        if (!cancelled) {
          setUserData(null);

          setError(
            err?.message ||
              "Unable to load your account information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [
    authUser?.contact,
    isGuest,
    authFetch,
  ]);

  /* =======================================================
     LOAD HISTORY
  ======================================================= */

  useEffect(() => {
    if (
      activeView !== "history" ||
      !userData?.contact ||
      !authFetch ||
      !API_BASE
    ) {
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setLoadingHistory(true);

      /*
       * Only clear the error here when entering
       * history. Do not destroy unrelated messages.
       */
      setError("");

      try {
        const url =
          `${API_BASE}/api/user/history?contact=${encodeURIComponent(
            userData.contact
          )}`;

        const res = await authFetch(url);

        if (!res.ok) {
          const reason =
            await getResponseError(
              res,
              "Failed to load history"
            );

          console.error(
            "❌ History request rejected:",
            {
              status: res.status,
              statusText: res.statusText,
              url,
              reason,
            }
          );

          throw new Error(reason);
        }

        const data = await res
          .json()
          .catch(() => null);

        const resolvedHistory =
          extractHistory(data);

        if (!cancelled) {
          setHistory(
            resolvedHistory
          );
        }
      } catch (err) {
        console.error(
          "❌ Failed to load history:",
          err
        );

        if (!cancelled) {
          setHistory([]);

          setError(
            err?.message ||
              "Unable to load activity history."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [
    activeView,
    userData?.contact,
    authFetch,
  ]);

  /* =======================================================
     API POST
  ======================================================= */

  const apiPost = async (
    path,
    payload
  ) => {
    if (!API_BASE) {
      throw new Error(
        "Backend API URL is not configured."
      );
    }

    if (!authFetch) {
      throw new Error(
        "Authentication request handler is unavailable."
      );
    }

    const res = await authFetch(
      `${API_BASE}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
        },
        body: JSON.stringify(
          payload
        ),
      }
    );

    const data = await res
      .json()
      .catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          data?.detail ||
          `Request failed (${res.status})`
      );
    }

    return data;
  };

  /* =======================================================
     DELETE ACCOUNT
  ======================================================= */

  const confirmDeleteAccount =
    async () => {
      if (!deleteCode.trim()) {
        setError(
          "Please enter the confirmation code."
        );

        return;
      }

      if (!userData?.contact) {
        setError(
          "Your account contact could not be resolved."
        );

        return;
      }

      try {
        setDeletingAccount(true);
        setError("");
        setMessage("");

        await apiPost(
          "/api/confirm-delete",
          {
            contact:
              userData.contact,
            code:
              deleteCode.trim(),
          }
        );

        setShowDeleteModal(false);
        setDeleteCode("");

        onLogout?.();

        window.location.href = "/";
      } catch (err) {
        console.error(
          "❌ Account deletion failed:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete your account."
        );
      } finally {
        setDeletingAccount(false);
      }
    };

  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  const confirmResetPassword =
    async (payload) => {
      if (!userData?.contact) {
        setError(
          "Your account contact could not be resolved."
        );

        return;
      }

      try {
        setError("");
        setMessage("");

        await apiPost(
          "/api/reset-password",
          {
            contact:
              userData.contact,
            ...payload,
          }
        );

        setMessage(
          "Password reset successful."
        );
      } catch (err) {
        console.error(
          "❌ Password reset failed:",
          err
        );

        setError(
          err?.message ||
            "Unable to reset your password."
        );
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
      allItems.find(
        (item) =>
          item.key === activeView
      ) || {
        key: "profile",
        label: "Profile",
        description:
          "Your personal information",
        icon: UserCircle2,
      }
    );
  }, [activeView]);

  useEffect(() => {
    if (!mainScrollRef.current) return;

    const reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    mainScrollRef.current.scrollTo?.({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeView]);

  /* =======================================================
     CHANGE VIEW
  ======================================================= */

  const changeView = (view) => {
    if (view === "payments") {
      onNavigate?.("payments");
      return;
    }

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
    <div className="mb-6">
      <p className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        {title}
      </p>

      <div className="space-y-1.5">
        {items.map(({ key, label, description, icon: Icon }) => {
          const active = activeView === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => changeView(key)}
              aria-current={active ? "page" : undefined}
              className={active
                ? "group relative flex min-h-14 w-full touch-manipulation items-center gap-3 overflow-hidden rounded-2xl bg-emerald-50 px-3 py-2.5 text-left text-emerald-950 shadow-sm ring-1 ring-inset ring-emerald-100 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-900/70 motion-reduce:transition-none"
                : "group relative flex min-h-14 w-full touch-manipulation items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-slate-600 transition duration-200 hover:bg-slate-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:bg-slate-800/80 motion-reduce:transition-none"}
            >
              <span
                aria-hidden="true"
                className={active
                  ? "absolute inset-y-2.5 left-0 w-1 rounded-r-full bg-emerald-500"
                  : "absolute inset-y-2.5 left-0 w-1 rounded-r-full bg-transparent"}
              />
              <span className={active
                ? "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-900/10"
                : "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition duration-200 group-hover:bg-white group-hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-emerald-300 motion-reduce:transition-none"}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block break-words text-[13px] font-semibold leading-5">
                  {label}
                </span>
                <span className={active
                  ? "mt-0.5 block truncate text-[11px] leading-4 text-emerald-800/80 dark:text-emerald-200/75"
                  : "mt-0.5 block truncate text-[11px] leading-4 text-slate-400 dark:text-slate-500"}>
                  {description}
                </span>
              </span>

              <ChevronRight className={active
                ? "h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-300"
                : "h-4 w-4 flex-shrink-0 text-slate-300 opacity-0 transition duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-600 motion-reduce:transition-none"} />
            </button>
          );
        })}
      </div>
    </div>
  );

  /* =======================================================
     CONTENT
  ======================================================= */

  const renderContent = () => {
    if (isGuest) {
      return (
        <section className="flex min-h-[58vh] items-center justify-center py-8">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 text-center shadow-[0_24px_70px_-40px_rgba(15,23,42,0.4)] sm:p-9 dark:border-slate-800 dark:bg-slate-900">
            <div className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" />
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-900/15 ring-1 ring-emerald-300/60">
              <LockKeyhole className="h-7 w-7" strokeWidth={1.8} />
            </div>

            <p className="relative mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              RevelaCode Account Center
            </p>
            <h2 className="relative text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Sign in to manage your account
            </h2>
            <p className="relative mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
              Access your profile, preferences, security settings, notifications, and activity from one secure place.
            </p>
            <div className="relative mt-7">
              <a
                href="/login"
                className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.99] motion-reduce:transition-none sm:w-auto sm:min-w-40"
              >
                Sign in
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <p className="relative mt-4 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
              Your account tools are available after you sign in.
            </p>
          </div>
        </section>
      );
    }

    if (loadingUser || !userData) {
      return (
        <div className="space-y-5" aria-busy="true" aria-label="Loading account information">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="h-24 rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 motion-safe:animate-pulse dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 motion-reduce:animate-none" />
            <div className="mt-5 flex items-center gap-4">
              <div className="h-16 w-16 flex-shrink-0 rounded-full bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700 motion-reduce:animate-none" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-4 w-2/5 rounded-full bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700 motion-reduce:animate-none" />
                <div className="h-3 w-3/5 max-w-64 rounded-full bg-slate-100 motion-safe:animate-pulse dark:bg-slate-800 motion-reduce:animate-none" />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-36 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm motion-safe:animate-pulse dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
            <div className="h-36 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm motion-safe:animate-pulse dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </div>
      );
    }

    switch (activeView) {
      case "profile":
        return (
          <div className="space-y-5">
            <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-44px_rgba(15,23,42,0.42)] dark:border-slate-800 dark:bg-slate-900">
              <div className="relative h-28 overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 sm:h-32">
                <div className="absolute -right-8 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-teal-200/30 blur-3xl" />
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "18px 18px" }} />
              </div>

              <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
                <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex min-w-0 items-end gap-4">
                    <div className="flex h-[76px] w-[76px] flex-shrink-0 items-center justify-center rounded-[25px] bg-gradient-to-br from-emerald-50 to-white text-lg font-bold text-emerald-800 shadow-lg ring-4 ring-white dark:from-emerald-950 dark:to-slate-900 dark:text-emerald-200 dark:ring-slate-900 sm:h-[88px] sm:w-[88px] sm:rounded-[28px]">
                      {getInitials(userData?.name || userData?.fullName || userData?.username || userData?.contact)}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="max-w-full break-words text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                          {userData?.name || userData?.fullName || userData?.username || "RevelaCode User"}
                        </h2>
                        {(userData?.verified || userData?.is_verified || userData?.email_verified || userData?.phone_verified || userData?.emailVerified) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                        {userData?.contact || authUser?.contact || "Contact not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:min-w-64">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Member since</p>
                      <p className="mt-1 break-words text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(userData?.created_at || userData?.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Account area</p>
                      <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Personal profile</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.32)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <UserProfile user={userData} />
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.32)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <PreferencesDashboard userData={userData} />
          </div>
        );

      case "accounts":
        return (
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.32)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <AccountDashboard userData={userData} onResetPassword={confirmResetPassword} />
          </div>
        );

      case "notifications":
        return (
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.32)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <Notifications />
          </div>
        );

      case "history":
        return (
          <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_60px_-38px_rgba(15,23,42,0.38)] dark:border-slate-800 dark:bg-slate-900">
            <header className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-5 py-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50">
                  <History className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Activity History</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                    A clear timeline of recent activity associated with your account.
                  </p>
                </div>
              </div>
            </header>

            <div className="p-5 sm:p-7">
              {loadingHistory ? (
                <div className="space-y-4" aria-busy="true" aria-label="Loading activity history">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex gap-4">
                      <div className="h-10 w-10 flex-shrink-0 rounded-2xl bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700 motion-reduce:animate-none" />
                      <div className="flex-1 space-y-3 rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800">
                        <div className="h-3 w-2/5 rounded-full bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700 motion-reduce:animate-none" />
                        <div className="h-3 w-3/5 rounded-full bg-slate-100 motion-safe:animate-pulse dark:bg-slate-800 motion-reduce:animate-none" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center sm:py-14">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:from-emerald-950/50 dark:to-slate-800 dark:text-emerald-300 dark:ring-emerald-900/50">
                    <History className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No activity yet</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Important account events will appear here as you use RevelaCode.
                  </p>
                  <button
                    type="button"
                    onClick={() => changeView("profile")}
                    className="mt-5 inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-300 motion-reduce:transition-none"
                  >
                    Return to profile
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <ol className="space-y-0">
                  {history.map((item, index) => {
                    const eventLabel = item.action || item.event || item.type || "Account activity";
                    const normalizedEvent = String(eventLabel).toLowerCase();
                    const isSecurityEvent = /password|security|login|auth|access/.test(normalizedEvent);
                    const isProfileEvent = /profile|user|contact|email|phone/.test(normalizedEvent);
                    const isNotificationEvent = /notification|alert|message/.test(normalizedEvent);
                    const isDeleteEvent = /delete|remove|deactivat/.test(normalizedEvent);
                    const EventIcon = isDeleteEvent
                      ? Trash2
                      : isSecurityEvent
                        ? LockKeyhole
                        : isProfileEvent
                          ? UserCircle2
                          : isNotificationEvent
                            ? Bell
                            : CheckCircle2;
                    const eventTone = isDeleteEvent
                      ? "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/50"
                      : isSecurityEvent
                        ? "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900/50"
                        : isProfileEvent
                          ? "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/50"
                          : isNotificationEvent
                            ? "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50";

                    return (
                      <li
                        key={String(item.timestamp || "activity") + "-" + String(item.id || index)}
                        className="relative flex gap-4 pb-5 last:pb-0 before:absolute before:bottom-0 before:left-5 before:top-10 before:w-px before:bg-slate-200 last:before:hidden dark:before:bg-slate-800"
                      >
                        <div className={"relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset " + eventTone}>
                          <EventIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="min-w-0 flex-1 break-words text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100">
                              {eventLabel}
                            </p>
                            <span className="inline-flex flex-shrink-0 items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                              {item.timestamp ? getRelativeTime(item.timestamp) : "Time unavailable"}
                            </span>
                          </div>
                          <p className="mt-2 break-words text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Unknown time"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </section>
        );

      case "help":
        return (
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.32)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <HelpModal />
          </div>
        );

      case "referential":
        return (
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.32)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <ReferentialDashboard />
          </div>
        );

      case "privacy":
        return (
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.32)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <LegalDocs activeTab="privacy" />
          </div>
        );

      case "terms":
        return (
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.32)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <LegalDocs activeTab="terms" />
          </div>
        );

      default:
        return null;
    }
  };

  /* =======================================================
     GUEST VIEW
  ======================================================= */

  if (isGuest) {
    return (
      <div className="min-h-[100dvh] overflow-x-hidden bg-slate-50 p-4 dark:bg-slate-950">
        {renderContent()}
      </div>
    );
  }

  /* =======================================================
     MAIN LAYOUT
  ======================================================= */

  const mobilePrimaryItems = [
    { key: "profile", label: "Profile", icon: UserCircle2 },
    { key: "settings", label: "Preferences", icon: Settings },
    { key: "accounts", label: "Security", icon: LockKeyhole },
    { key: "notifications", label: "Notifications", icon: Bell },
  ];

  const mobileMoreItems = [
    ...accountMenu,
    ...activityMenu,
    ...resourceMenu,
    ...legalMenu,
  ].filter((item) => !["profile", "settings", "accounts", "notifications"].includes(item.key));

  const moreIsActive = ["history", "help", "referential", "privacy", "terms"].includes(activeView);

  return (
    <>
      <div className="min-h-[100dvh] overflow-x-hidden bg-[#f6f8fb] text-slate-900 dark:bg-[#080f1c] dark:text-slate-100">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1680px]">
          <aside className="sticky top-0 hidden h-[100dvh] w-[300px] flex-shrink-0 flex-col border-r border-slate-200/80 bg-white/85 shadow-[18px_0_60px_-48px_rgba(15,23,42,0.3)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 lg:flex">
            <div className="border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-700 text-white shadow-[0_10px_26px_-8px_rgba(16,185,129,0.8)] ring-1 ring-emerald-300/70">
                  <span className="pr-1 text-[28px] font-black italic leading-none tracking-[-0.12em]">r</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">RevelaCode</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Account Center</p>
                </div>
              </div>
            </div>

            <div className="px-4 pt-5">
              <div className="rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 p-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-xs font-bold text-white shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950/70">
                    {getInitials(userData?.name || userData?.fullName || userData?.username || userData?.contact)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold leading-5 text-slate-900 dark:text-white">
                      {userData?.name || userData?.fullName || userData?.username || "RevelaCode User"}
                    </p>
                    <p className="mt-1 break-all text-xs leading-4 text-slate-500 dark:text-slate-400">
                      {userData?.contact || authUser?.contact}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {(userData?.verified || userData?.is_verified || userData?.email_verified || userData?.phone_verified || userData?.emailVerified) ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                      Account member
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Member since {formatDate(userData?.created_at || userData?.createdAt)}</span>
                </div>
              </div>
            </div>

            <nav aria-label="Account navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
              {renderMenuGroup("Account", accountMenu)}
              {renderMenuGroup("Activity", activityMenu)}
              {renderMenuGroup("Resources", resourceMenu)}
              {renderMenuGroup("Legal", legalMenu)}
            </nav>

            <div className="mt-auto border-t border-slate-200/80 p-4 dark:border-slate-800">
              <section className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-3 dark:border-rose-900/50 dark:bg-rose-950/20">
                <p className="mb-1 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">Danger zone</p>
                <p className="px-1 text-xs leading-5 text-rose-700/80 dark:text-rose-200/70">Account deletion is permanent.</p>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMessage("");
                    setDeleteCode("");
                    setShowDeleteModal(true);
                  }}
                  className="mt-2 flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-xl px-2.5 py-2 text-left text-rose-700 transition duration-200 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-300 dark:hover:bg-rose-950/50 motion-reduce:transition-none"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm dark:bg-rose-950/60 dark:text-rose-300">
                    <Trash2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Delete Account</span>
                    <span className="mt-0.5 block text-[11px] text-rose-600/80 dark:text-rose-300/80">Permanently remove account</span>
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-70" />
                </button>
              </section>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-3 flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-200 motion-reduce:transition-none"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              )}
            </div>
          </aside>

          <div ref={mainScrollRef} className="flex min-w-0 flex-1 flex-col lg:h-[100dvh] lg:overflow-y-auto lg:overscroll-contain">
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-[0_8px_30px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
              <div className="flex min-h-14 items-center gap-3 px-4 pb-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-700 text-white shadow-[0_8px_22px_-8px_rgba(16,185,129,0.75)] ring-1 ring-emerald-300/70">
                  <span className="pr-1 text-[26px] font-black italic leading-none tracking-[-0.12em]">r</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">{activeItem.label}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{activeItem.description}</p>
                </div>
                <span className="hidden flex-shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 sm:inline-flex dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                  Account Center
                </span>
              </div>
            </header>

            <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:pb-8 lg:pt-10">
              <div className="mx-auto w-full max-w-6xl">
                <header className="relative isolate mb-6 overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/75 p-5 shadow-[0_22px_70px_-44px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/75 sm:mb-8 sm:p-7 lg:rounded-[32px] lg:p-8">
                  <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-500/10" />
                  <div className="pointer-events-none absolute -left-24 -bottom-28 -z-10 h-52 w-80 rounded-full bg-teal-200/20 blur-3xl dark:bg-teal-500/5" />

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/80 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                        REVELACODE <span className="text-emerald-400">/</span> ACCOUNT CENTER
                      </div>
                      <h1 className="break-words text-[clamp(1.65rem,5vw,2.35rem)] font-bold leading-tight tracking-tight text-slate-950 dark:text-white">
                        {activeItem.label}
                      </h1>
                      <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {activeItem.description}
                      </p>
                    </div>

                    <div className="hidden max-w-[300px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-3 shadow-sm sm:flex dark:border-slate-800 dark:bg-slate-950/50">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-xs font-bold text-white ring-2 ring-emerald-100 dark:ring-emerald-950/70">
                        {getInitials(userData?.name || userData?.fullName || userData?.username || userData?.contact)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-xs font-bold text-slate-800 dark:text-slate-100">
                          {userData?.name || userData?.fullName || userData?.username || "RevelaCode User"}
                        </p>
                        <p className="mt-0.5 break-all text-[11px] text-slate-500 dark:text-slate-400">{userData?.contact || authUser?.contact}</p>
                      </div>
                      {(userData?.verified || userData?.is_verified || userData?.email_verified || userData?.phone_verified || userData?.emailVerified) && (
                        <BadgeCheck className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-300" aria-label="Verified account" />
                      )}
                    </div>
                  </div>
                </header>

                {(message || error) && (
                  <div className="mb-6 space-y-3">
                    {message && (
                      <div role="alert" className="motion-safe:animate-[pulse_0.55s_ease-out_1] motion-reduce:animate-none flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm leading-6 text-emerald-900 shadow-sm transition duration-200 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-100 motion-reduce:transition-none">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />
                        <p className="min-w-0 flex-1 break-words">{message}</p>
                        <button type="button" onClick={() => setMessage("")} aria-label="Dismiss success message" className="flex h-8 w-8 flex-shrink-0 touch-manipulation items-center justify-center rounded-lg text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-200 dark:hover:bg-emerald-900/60 motion-reduce:transition-none">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {error && (
                      <div role="alert" className="motion-safe:animate-[pulse_0.55s_ease-out_1] motion-reduce:animate-none flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm leading-6 text-rose-900 shadow-sm transition duration-200 dark:border-rose-900/70 dark:bg-rose-950/35 dark:text-rose-100 motion-reduce:transition-none">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-300" />
                        <p className="min-w-0 flex-1 break-words">{error}</p>
                        <button type="button" onClick={() => setError("")} aria-label="Dismiss error message" className="flex h-8 w-8 flex-shrink-0 touch-manipulation items-center justify-center rounded-lg text-rose-800 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 dark:text-rose-200 dark:hover:bg-rose-900/60 motion-reduce:transition-none">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <Suspense
                  fallback={
                    <div className="space-y-5" aria-busy="true" aria-label="Loading account section">
                      <div className="h-28 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm motion-safe:animate-pulse dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="h-36 rounded-[24px] border border-slate-200/80 bg-white shadow-sm motion-safe:animate-pulse dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
                        <div className="h-36 rounded-[24px] border border-slate-200/80 bg-white shadow-sm motion-safe:animate-pulse dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
                      </div>
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

      <nav aria-label="Account quick navigation" className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_36px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
        <div className="mx-auto grid h-14 max-w-2xl grid-cols-5 px-1">
          {mobilePrimaryItems.map(({ key, label, icon: Icon }) => {
            const active = activeView === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => changeView(key)}
                aria-current={active ? "page" : undefined}
                className={active
                  ? "relative flex h-14 min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-emerald-700 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 dark:text-emerald-300 motion-reduce:transition-none"
                  : "relative flex h-14 min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-slate-500 transition duration-150 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-slate-100 motion-reduce:transition-none"}
              >
                <span className={active ? "absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-500" : "absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-transparent"} />
                <Icon className={active ? "h-[18px] w-[18px]" : "h-[18px] w-[18px]"} strokeWidth={active ? 2.2 : 1.8} />
                <span className="max-w-full truncate text-[11px] font-semibold leading-4">{label}</span>
              </button>
            );
          })}

          <details className="relative h-14 min-w-0">
            <summary
              aria-label="More account options"
              className={moreIsActive
                ? "relative flex h-14 min-w-0 cursor-pointer list-none touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-emerald-700 outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 dark:text-emerald-300 motion-reduce:transition-none [&::-webkit-details-marker]:hidden"
                : "relative flex h-14 min-w-0 cursor-pointer list-none touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-slate-500 outline-none transition duration-150 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-slate-100 motion-reduce:transition-none [&::-webkit-details-marker]:hidden"}
            >
              <span className={moreIsActive ? "absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-500" : "absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-transparent"} />
              <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={2} />
              <span className="max-w-full truncate text-[11px] font-semibold leading-4">More</span>
            </summary>

            <section className="fixed inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-h-[90dvh] max-w-xl overflow-y-auto overscroll-contain rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.55)] dark:border-slate-700 dark:bg-slate-900 sm:inset-x-auto sm:right-4 sm:w-[min(94vw,26rem)] sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">More account tools</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Payments, activity, support, and legal information.</p>
                </div>
                <button
                  type="button"
                  onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
                  aria-label="Close more menu"
                  className="flex h-10 w-10 flex-shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 motion-reduce:transition-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {mobileMoreItems.map(({ key, label, description, icon: Icon }) => {
                  const active = activeView === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={(event) => {
                        event.currentTarget.closest("details")?.removeAttribute("open");
                        changeView(key);
                      }}
                      className={active
                        ? "flex min-h-12 w-full touch-manipulation items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-2.5 text-left text-emerald-900 ring-1 ring-inset ring-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-900/70"
                        : "flex min-h-12 w-full touch-manipulation items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-200 dark:hover:bg-slate-800 motion-reduce:transition-none"}
                    >
                      <span className={active
                        ? "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"
                        : "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}>
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm font-semibold">{label}</span>
                        <span className="mt-0.5 block break-words text-[11px] leading-4 text-slate-500 dark:text-slate-400">{description}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-rose-200/80 pt-4 dark:border-rose-900/50">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">Account danger zone</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.currentTarget.closest("details")?.removeAttribute("open");
                    setError("");
                    setMessage("");
                    setDeleteCode("");
                    setShowDeleteModal(true);
                  }}
                  className="flex min-h-12 w-full touch-manipulation items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 px-3 py-2.5 text-left text-rose-800 transition duration-150 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/60 motion-reduce:transition-none"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm dark:bg-rose-950/60 dark:text-rose-300">
                    <Trash2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Delete Account</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-rose-700/80 dark:text-rose-300/80">Permanently remove your account</span>
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest("details")?.removeAttribute("open");
                      onLogout();
                    }}
                    className="mt-2 flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 motion-reduce:transition-none"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                )}
              </div>
            </section>
          </details>
        </div>
      </nav>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[28px] border border-rose-200 bg-white shadow-[0_28px_90px_-30px_rgba(15,23,42,0.7)] dark:border-rose-900/50 dark:bg-slate-900 sm:rounded-[28px]"
          >
            <div className="sticky top-0 z-10 border-b border-rose-200 bg-gradient-to-r from-rose-50 to-white px-5 py-5 dark:border-rose-900/50 dark:from-rose-950/60 dark:to-slate-900 sm:px-7">
              <div className="mb-4 flex justify-center sm:hidden">
                <span className="h-1.5 w-12 rounded-full bg-rose-200 dark:bg-rose-900" />
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:ring-rose-900">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Irreversible action</p>
                  <h2 id="delete-account-title" className="mt-1 text-lg font-bold tracking-tight text-rose-950 dark:text-rose-100">Delete account permanently?</h2>
                  <p className="mt-1 text-sm leading-5 text-rose-800/80 dark:text-rose-200/75">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:p-7">
              <p id="delete-account-description" className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Deleting your account permanently removes your account data and access to RevelaCode.
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <label htmlFor="delete-account-code" className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Confirmation code
                </label>
                <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-400">
                  Enter the confirmation code provided by your account deletion flow.
                </p>
                <input
                  id="delete-account-code"
                  value={deleteCode}
                  onChange={(e) => setDeleteCode(e.target.value)}
                  placeholder="Enter confirmation code"
                  autoComplete="off"
                  className="mt-4 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white motion-reduce:transition-none"
                />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteCode("");
                  }}
                  className="min-h-12 touch-manipulation rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 motion-reduce:transition-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAccount}
                  disabled={deletingAccount}
                  className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-rose-900/15 transition duration-200 hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900 motion-reduce:transition-none"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingAccount ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
