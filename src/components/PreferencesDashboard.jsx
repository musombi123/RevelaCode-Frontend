import React, { useMemo, useState } from "react";

import {
  Globe,
  Shield,
  FileText,
  HelpCircle,
  Copy,
  Check,
  Moon,
  Sun,
  Type,
  Languages,
  ExternalLink,
  ChevronRight,
  Settings2,
} from "lucide-react";

import { toast } from "react-hot-toast";

import usePreferences from "./hooks/usePreferences.jsx";
import { useTheme } from "./hooks/useTheme.jsx";

export default function PreferencesDashboard({ userData }) {
  const { fontSize, setFontSize } =
    usePreferences();

  const { theme, setTheme } =
    useTheme();

  const [copied, setCopied] =
    useState(false);

  const username =
    userData?.name ||
    userData?.username ||
    userData?.contact?.split("@")?.[0] ||
    "RevelaCode User";

  const contact =
    userData?.contact || "";

  const memberSince =
    userData?.created_at
      ? new Date(
          userData.created_at
        ).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "—";

  const avatarUrl = useMemo(
    () =>
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        username
      )}`,
    [username]
  );

  const copySupportEmail = async () => {
    const email =
      "support@revelacode.com";

    try {
      await navigator.clipboard.writeText(
        email
      );

      setCopied(true);

      toast.success(
        "Support email copied"
      );

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      toast.error(
        "Unable to copy email"
      );
    }
  };

  return (
    <div className="w-full">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          <Settings2 className="h-3 w-3" />
          Preferences
        </div>

        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Preferences & Experience
        </h2>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Customize how RevelaCode looks, reads, and feels
          across your devices.
        </p>
      </div>

      <div className="space-y-5">
        {/* ===================================================
            PROFILE SNAPSHOT
        =================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <img
                src={avatarUrl}
                alt=""
                className="h-14 w-14 flex-shrink-0 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
              />

              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {username}
                </p>

                {contact && (
                  <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                    {contact}
                  </p>
                )}

                <p className="mt-1 text-xs text-slate-400">
                  Member since {memberSince}
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Preferences synced
            </div>
          </div>
        </section>

        {/* ===================================================
            APPEARANCE
        =================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Sun className="h-5 w-5 text-slate-500 dark:text-slate-300" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Appearance
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Control how RevelaCode looks on your device.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {/* Theme */}
            <div className="p-5 sm:p-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Theme
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Choose a visual mode for the interface.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-3">
                <ThemeOption
                  icon={Sun}
                  label="Light"
                  active={theme === "light"}
                  onClick={() =>
                    setTheme("light")
                  }
                />

                <ThemeOption
                  icon={Moon}
                  label="Dark"
                  active={theme === "dark"}
                  onClick={() =>
                    setTheme("dark")
                  }
                />

                <ThemeOption
                  icon={Settings2}
                  label="System"
                  active={theme === "system"}
                  onClick={() =>
                    setTheme("system")
                  }
                />
              </div>
            </div>

            {/* Font size */}
            <div className="p-5 sm:p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-slate-400" />

                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Reading size
                  </p>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Adjust text size across compatible screens.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:max-w-xl">
                <FontOption
                  value="sm"
                  label="Small"
                  preview="Aa"
                  active={fontSize === "sm"}
                  onClick={() =>
                    setFontSize("sm")
                  }
                />

                <FontOption
                  value="md"
                  label="Medium"
                  preview="Aa"
                  active={fontSize === "md"}
                  onClick={() =>
                    setFontSize("md")
                  }
                />

                <FontOption
                  value="lg"
                  label="Large"
                  preview="Aa"
                  active={fontSize === "lg"}
                  onClick={() =>
                    setFontSize("lg")
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            LANGUAGE
        =================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
                <Languages className="h-5 w-5 text-blue-500" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Language
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Set your preferred display language.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <label
              htmlFor="language"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              Interface language
            </label>

            <div className="relative max-w-xl">
              <select
                id="language"
                defaultValue="English"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
              >
                <option>
                  English
                </option>

                <option>
                  Swahili
                </option>

                <option>
                  French
                </option>
              </select>

              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
            </div>

            <p className="mt-2 text-[11px] text-slate-400">
              More languages can be added as localization support
              expands.
            </p>
          </div>
        </section>

        {/* ===================================================
            LEGAL & SUPPORT
        =================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Legal & Support
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Policies, documentation, and help resources.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <LegalLink
                href="/privacy-policy"
                icon={Shield}
                title="Privacy Policy"
                description="How your information is handled"
              />

              <LegalLink
                href="/terms-of-service"
                icon={FileText}
                title="Terms of Service"
                description="Rules governing platform use"
              />
            </div>

            {/* Support */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900">
                    <HelpCircle className="h-4 w-4 text-slate-500" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Need help?
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Contact RevelaCode support.
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                      support@revelacode.com
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    copySupportEmail
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}

                  {copied
                    ? "Copied"
                    : "Copy email"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="flex items-center justify-between gap-4 px-1 pb-4">
          <p className="text-[11px] leading-5 text-slate-400">
            Your preferences are stored locally and applied across
            compatible RevelaCode interfaces.
          </p>

          <span className="hidden text-[11px] font-medium text-slate-400 sm:block">
            RevelaCode
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   THEME OPTION
========================================================= */

function ThemeOption({
  icon: Icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition
        ${
          active
            ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-900"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        }
      `}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />

      <span className="text-xs font-semibold">
        {label}
      </span>
    </button>
  );
}

/* =========================================================
   FONT OPTION
========================================================= */

function FontOption({
  label,
  preview,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-1.5 rounded-xl border px-4 py-4 transition
        ${
          active
            ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        }
      `}
    >
      <span
        className={`
          font-serif
          ${
            label === "Small"
              ? "text-lg"
              : label === "Medium"
              ? "text-xl"
              : "text-2xl"
          }
        `}
      >
        {preview}
      </span>

      <span className="text-[11px] font-semibold">
        {label}
      </span>
    </button>
  );
}

/* =========================================================
   LEGAL LINK
========================================================= */

function LegalLink({
  href,
  icon: Icon,
  title,
  description,
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
          {description}
        </p>
      </div>

      <ExternalLink className="h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-300" />
    </a>
  );
}
