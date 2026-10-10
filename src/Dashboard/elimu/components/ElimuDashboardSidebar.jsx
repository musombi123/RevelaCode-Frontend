import React from "react";
import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  BarChart3,
  CheckSquare,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,
  School,
  Settings2,
  ShieldCheck,
  Users,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";

const NAVIGATION = [
  {
    label: "Workspace",
    items: [
      {
        id: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        path: "elimu",
        roles: ["owner", "principal", "bursar", "registrar", "teacher"],
      },
      {
        id: "school",
        label: "School profile",
        icon: School,
        path: "elimu/school",
        roles: ["owner", "principal"],
      },
      {
        id: "staff",
        label: "Staff & access",
        icon: Users,
        path: "elimu/staff",
        roles: ["owner", "principal"],
      },
    ],
  },
  {
    label: "Academic management",
    items: [
      {
        id: "students",
        label: "Student records",
        icon: GraduationCap,
        path: "elimu/students",
        roles: ["owner", "principal", "registrar", "teacher"],
      },
      {
        id: "classes",
        label: "Classes",
        icon: Library,
        path: "elimu/classes",
        roles: ["owner", "principal", "registrar", "teacher"],
      },
      {
        id: "lessons",
        label: "Lessons",
        icon: BookOpen,
        path: "elimu/lessons",
        roles: ["owner", "principal", "teacher"],
      },
      {
        id: "assignments",
        label: "Assignments",
        icon: ClipboardCheck,
        path: "elimu/assignments",
        roles: ["owner", "principal", "teacher"],
      },
      {
        id: "assessments",
        label: "Assessments",
        icon: CheckSquare,
        path: "elimu/assessments",
        roles: ["owner", "principal", "teacher"],
      },
      {
        id: "attendance",
        label: "Attendance",
        icon: UserCheck,
        path: "elimu/attendance",
        roles: ["owner", "principal", "registrar", "teacher"],
      },
      {
        id: "timetable",
        label: "Timetable",
        icon: CalendarDays,
        path: "elimu/timetable",
        roles: ["owner", "principal", "teacher"],
      },
      {
        id: "cbc",
        label: "CBC projects",
        icon: ListChecks,
        path: "elimu/cbc",
        roles: ["owner", "principal", "teacher"],
      },
    ],
  },
  {
    label: "Finance & reports",
    items: [
      {
        id: "fees",
        label: "School fees",
        icon: Wallet,
        path: "elimu/fees",
        roles: ["owner", "principal", "bursar"],
      },
      {
        id: "reports",
        label: "Reports",
        icon: BarChart3,
        path: "elimu/reports",
        roles: ["owner", "principal", "bursar", "registrar", "teacher"],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        id: "automation",
        label: "Automation",
        icon: Activity,
        path: "elimu/automation",
        roles: ["owner", "principal"],
      },
      {
        id: "sync",
        label: "Synchronization",
        icon: ArrowLeftRight,
        path: "elimu/sync",
        roles: ["owner", "principal"],
      },
      {
        id: "settings",
        label: "School settings",
        icon: Settings2,
        path: "elimu/settings",
        roles: ["owner"],
      },
    ],
  },
];

const ROLE_LABELS = {
  owner: "Owner / School Director",
  principal: "Principal",
  bursar: "Bursar",
  registrar: "Registrar",
  teacher: "Teacher",
};

function normalizeRole(access) {
  const role =
    access?.role ??
    access?.membership?.role ??
    access?.access?.role ??
    access?.membership?.role_label ??
    "";

  const normalized = String(role).trim().toLowerCase();

  if (normalized.includes("owner") || normalized.includes("director")) {
    return "owner";
  }

  if (normalized.includes("principal")) return "principal";
  if (normalized.includes("bursar") || normalized.includes("finance")) {
    return "bursar";
  }
  if (normalized.includes("registrar") || normalized.includes("admission")) {
    return "registrar";
  }
  if (normalized.includes("teacher") || normalized.includes("educator")) {
    return "teacher";
  }

  return normalized;
}

function normalizePath(path) {
  return String(path || "")
    .split("?")[0]
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
}

function isItemActive(item, currentPath) {
  const current = normalizePath(currentPath);
  const target = normalizePath(item.path);

  if (!current || !target) return false;
  if (current === target) return true;

  return current.startsWith(`${target}/`);
}

export default function ElimuDashboardSidebar({
  access,
  currentPath = "elimu",
  onNavigate,
  collapsed = false,
  mobileOpen = false,
  onClose,
  school,
  className = "",
}) {
  const role = normalizeRole(access);
  const roleLabel = ROLE_LABELS[role] || access?.role_label || "School member";

  const schoolName =
    school?.name ||
    school?.school_name ||
    school?.institution_name ||
    access?.school?.name ||
    "Your school";

  const permissions = Array.isArray(access?.permissions)
    ? access.permissions
    : Array.isArray(access?.membership?.permissions)
      ? access.membership.permissions
      : [];

  const hasPermission = (permission) =>
    !permissions.length || permissions.includes(permission);

  const visibleGroups = NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.roles.includes(role)) return false;

      if (item.id === "staff" && !hasPermission("staff.manage")) {
        return role === "owner" || role === "principal";
      }

      return true;
    }),
  })).filter((group) => group.items.length > 0);

  const handleNavigate = (path) => {
    if (typeof onNavigate === "function") {
      onNavigate(path);
    }

    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        aria-label="Elimu dashboard navigation"
        className={[
          "flex h-full min-h-0 flex-col border-r border-slate-200 bg-white",
          "transition-[width,transform] duration-200 ease-out",
          "dark:border-slate-800 dark:bg-slate-950",
          collapsed ? "w-[76px]" : "w-[272px]",
          "fixed inset-y-0 left-0 z-50 lg:sticky lg:top-0 lg:z-20",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={[
            "flex min-h-[76px] items-center border-b border-slate-200 px-4",
            "dark:border-slate-800",
            collapsed ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => handleNavigate("elimu")}
            className="flex min-w-0 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Elimu workspace"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <GraduationCap size={23} strokeWidth={2.2} />
            </span>

            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Elimu
                </span>
                <span className="block truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  School workspace
                </span>
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="border-b border-slate-200 p-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleNavigate("elimu/school")}
            title={collapsed ? schoolName : undefined}
            className={[
              "flex w-full items-center gap-3 rounded-xl border border-slate-200",
              "bg-slate-50 p-3 text-left transition-colors",
              "hover:border-blue-200 hover:bg-blue-50/70",
              "dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-blue-950/30",
              collapsed ? "justify-center" : "",
            ].join(" ")}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-blue-300 dark:ring-slate-700">
              <School size={18} />
            </span>

            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {schoolName}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                  {roleLabel}
                </span>
              </span>
            )}

            {!collapsed && (
              <ChevronRight
                size={16}
                className="shrink-0 text-slate-400"
              />
            )}
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  {group.label}
                </h2>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item, currentPath);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.path)}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={[
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
                        "text-sm font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        collapsed ? "justify-center" : "",
                        active
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                      ].join(" ")}
                    >
                      <Icon
                        size={19}
                        strokeWidth={active ? 2.3 : 1.9}
                        className={[
                          "shrink-0",
                          active
                            ? "text-blue-600 dark:text-blue-300"
                            : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200",
                        ].join(" ")}
                      />

                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate text-left">
                            {item.label}
                          </span>

                          {active && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-300" />
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div
            className={[
              "flex items-center gap-3 rounded-xl bg-slate-50 p-3",
              "dark:bg-slate-900",
              collapsed ? "justify-center" : "",
            ].join(" ")}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck size={18} />
            </span>

            {!collapsed && (
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
                  School workspace
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                  Your access follows your school role.
                </span>
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}





