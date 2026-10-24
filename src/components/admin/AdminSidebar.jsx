
"use client";

import React, { useEffect } from "react";

import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  BookOpen,
  ScrollText,
  BookMarked,
  Settings,
  Shield,
  CircleDollarSign,
  X,
  ChevronRight,
  Database,
  Brain,
  Cpu,
  Building2,
  BookOpenCheck,
} from "lucide-react";

// =========================================================
// ADMIN NAVIGATION
// =========================================================

const tabs = [
  {
    key: "coreMesh",
    label: "Core Mesh · ZERO / ONE / TWO",
    description: "Genesis and Infinite Mind integration",
    icon: Cpu,
    live: true,
  },
  {
    key: "usectZero",
    label: "USECT-ZERO Core",
    description: "Tool activity, core health and developer-key approvals",
    icon: Cpu,
    live: true,
  },
  {
    key: "metaEngineer",
    label: "Meta-Engineer Lab",
    description: "Self-build proposals and safety oversight",
    icon: Brain,
    live: true,
  },
  {
    key: "sciCore",
    label: "Sci-Core Defensive Core",
    description: "Research, security scans and disaster readiness",
    icon: Shield,
    live: true,
  },
  {
    key: "overview",
    label: "Dashboard",
    description: "Platform overview",
    icon: LayoutDashboard,
  },
  {
    key: "directories",
    label: "Jumuiya Directory",
    description: "Browse Jumuiya profiles and resources",
    icon: Database,
  },
  {
    key: "verification",
    label: "School Verification",
    description: "Review school applications",
    icon: ClipboardCheck,
  },
  {
    key: "biasharaVerification",
    label: "Business Verification",
    description: "Approve Biashara applications",
    icon: Building2,
  },
  {
    key: "revenue",
    label: "Revenue Management",
    description: "Pricing and transaction intents",
    icon: CircleDollarSign,
  },  {
    key: "team",
    label: "User Management",
    description: "Users and administrators",
    icon: Users,
  },
  {
    key: "study",
    label: "Study Hub",
    description: "Learning resources",
    icon: BookOpen,
  },
  {
    key: "policy",
    label: "Policies",
    description: "Legal and policy documents",
    icon: ScrollText,
  },
  {
    key: "scripture",
    label: "Scriptures",
    description: "Scripture datasets",
    icon: BookMarked,
  },
  {
    key: "operations",
    label: "Operations Handbook",
    description: "System orientation, incidents and operational duties",
    icon: BookOpenCheck,
  },
  {
    key: "settings",
    label: "Settings",
    description: "System configuration",
    icon: Settings,
  },
];

// =========================================================
// ADMIN SIDEBAR
// =========================================================

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  mobileOpen = false,
  setMobileOpen,
}) {
  // =======================================================
  // CLOSE DRAWER ON ESC
  // =======================================================

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen?.(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen, setMobileOpen]);

  // =======================================================
  // LOCK BODY SCROLL ON MOBILE
  // =======================================================

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  // =======================================================
  // NAVIGATION
  // =======================================================

  const handleNavigation = (key) => {
    setActiveTab(key);
    setMobileOpen?.(false);
  };

  // =======================================================
  // SIDEBAR CONTENT
  // =======================================================

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col">
      {/* BRAND */}

      <div className="flex-shrink-0 border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Shield
              className="h-5 w-5 text-emerald-400"
              strokeWidth={1.8}
            />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              RevelaCode
            </p>

            <h1 className="truncate text-sm font-black text-white">
              Admin Console
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen?.(false)}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close admin menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
              Control Center
            </span>
          </div>

          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Manage RevelaCode platform services and resources.
          </p>
        </div>
      </div>

      {/* NAVIGATION */}

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
          Management
        </p>

        <div className="space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleNavigation(tab.key)}
                aria-current={active ? "page" : undefined}
                className={`
                  group
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
                  text-left
                  transition-all
                  duration-200
                  ${
                    active
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }
                `}
              >
                <span
                  className={`
                    flex
                    h-9
                    w-9
                    flex-shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    transition
                    ${
                      active
                        ? "bg-slate-100 text-slate-900"
                        : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                    }
                  `}
                >
                  <Icon
                    className="h-4 w-4"
                    strokeWidth={1.8}
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {tab.label}
                    {tab.live && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-emerald-400"><span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />Live</span>}
                  </span>

                  <span
                    className={`
                      mt-0.5 block truncate text-[10px]
                      ${
                        active
                          ? "text-slate-500"
                          : "text-slate-600 group-hover:text-slate-500"
                      }
                    `}
                  >
                    {tab.description}
                  </span>
                </span>

                <ChevronRight
                  className={`
                    h-4 w-4 flex-shrink-0 transition
                    ${
                      active
                        ? "text-slate-400"
                        : "text-slate-700 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100"
                    }
                  `}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* FOOTER */}

      <div className="flex-shrink-0 border-t border-slate-800 p-4">
        <div className="rounded-xl bg-slate-950/50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Admin Panel
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              RevelaCode
            </p>

            <span className="rounded-md bg-slate-800 px-2 py-1 text-[9px] font-semibold text-slate-500">
              v1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}

      <aside className="hidden w-[280px] flex-shrink-0 border-r border-slate-800 bg-slate-900 text-white lg:block">
        {sidebarContent}
      </aside>

      {/* MOBILE OVERLAY */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close admin menu"
          onClick={() => setMobileOpen?.(false)}
          className="fixed inset-0 z-[9998] bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* MOBILE DRAWER */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-[9999]
          w-[290px]
          max-w-[85vw]
          bg-slate-900
          text-white
          shadow-2xl
          transition-transform
          duration-300
          ease-out
          lg:hidden
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}