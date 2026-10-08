import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Minus,
  Plus,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

import { toast } from "react-hot-toast";

import usePreferences from "./hooks/usePreferences.jsx";
import { useTheme } from "./hooks/useTheme.jsx";

/* =========================================================
   Constants
========================================================= */

const LANGUAGE_STORAGE_KEY = "revelacode_language";

const LANGUAGE_OPTIONS = [
  {
    value: "en",
    label: "English",
    nativeLabel: "English",
    description: "English interface",
  },
  {
    value: "sw",
    label: "Swahili",
    nativeLabel: "Kiswahili",
    description: "Kiolesura cha Kiswahili",
  },
  {
    value: "fr",
    label: "French",
    nativeLabel: "Français",
    description: "Interface française",
  },
];

/* =========================================================
   Main Component
========================================================= */

export default function PreferencesDashboard({
  userData,
}) {
  const {
    fontSize,
    setFontSize,
  } = usePreferences();

  const {
    theme,
    setTheme,
  } = useTheme();

  const [copied, setCopied] =
    useState(false);

  const [language, setLanguage] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            LANGUAGE_STORAGE_KEY
          ) || "en"
        );
      } catch {
        return "en";
      }
    });

  /*
   * Keep an explicit reading-scale state so the preference
   * has an immediate visual effect even if the hook only
   * stores the selected size.
   */
  const [readingScale, setReadingScale] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            "revelacode_reading_scale"
          );

        const parsed = Number(saved);

        if (
          Number.isFinite(parsed) &&
          parsed >= 0.9 &&
          parsed <= 1.3
        ) {
          return parsed;
        }
      } catch {
        /* Ignore malformed local storage */
      }

      return 1;
    });

  /* =======================================================
     User information
  ======================================================= */

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
        ).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )
      : "—";

  const avatarUrl = useMemo(
    () =>
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        username
      )}`,
    [username]
  );

  /* =======================================================
     Language persistence
  ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        language
      );

      /*
       * Expose the selected language to the rest of the
       * application through the root HTML element.
       */
      document.documentElement.lang =
        language;

      /*
       * Dispatch an event so components that implement
       * translations can react immediately without a full
       * page reload.
       */
      window.dispatchEvent(
        new CustomEvent(
          "revelacode:languagechange",
          {
            detail: {
              language,
            },
          }
        )
      );
    } catch (error) {
      console.error(
        "Failed to save language preference:",
        error
      );
    }
  }, [language]);

  /* =======================================================
     Reading scale persistence
  ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        "revelacode_reading_scale",
        String(readingScale)
      );

      /*
       * Apply the scale to the document so the preference
       * actually affects readable UI instead of only changing
       * the selected button.
       */
      document.documentElement.style.setProperty(
        "--revelacode-reading-scale",
        String(readingScale)
      );

      document.documentElement.dataset.readingScale =
        String(readingScale);

      window.dispatchEvent(
        new CustomEvent(
          "revelacode:readingscalechange",
          {
            detail: {
              scale: readingScale,
            },
          }
        )
      );
    } catch (error) {
      console.error(
        "Failed to save reading scale:",
        error
      );
    }
  }, [readingScale]);

  /* =======================================================
     Sync with existing usePreferences hook
  ======================================================= */

  useEffect(() => {
    if (
      fontSize !== "sm" &&
      fontSize !== "md" &&
      fontSize !== "lg"
    ) {
      return;
    }

    const scaleMap = {
      sm: 0.92,
      md: 1,
      lg: 1.12,
    };

    const scale =
      scaleMap[fontSize];

    if (
      Math.abs(
        readingScale - scale
      ) > 0.001
    ) {
      setReadingScale(scale);
    }
  }, [fontSize]);

  /* =======================================================
     Reading size handlers
  ======================================================= */

  const changeReadingSize =
    useCallback(
      (size) => {
        const scaleMap = {
          sm: 0.92,
          md: 1,
          lg: 1.12,
        };

        const scale =
          scaleMap[size];

        if (!scale) {
          return;
        }

        /*
         * Preserve the application's existing preference hook.
         */
        setFontSize(size);

        /*
         * Immediately update the actual reading scale.
         */
        setReadingScale(scale);

        toast.success(
          `${capitalize(size)} reading size applied`
        );
      },
      [setFontSize]
    );

  const decreaseReadingSize =
    useCallback(() => {
      const sizes = [
        "sm",
        "md",
        "lg",
      ];

      const currentIndex =
        sizes.indexOf(fontSize);

      const nextIndex =
        currentIndex <= 0
          ? 0
          : currentIndex - 1;

      changeReadingSize(
        sizes[nextIndex]
      );
    }, [
      fontSize,
      changeReadingSize,
    ]);

  const increaseReadingSize =
    useCallback(() => {
      const sizes = [
        "sm",
        "md",
        "lg",
      ];

      const currentIndex =
        sizes.indexOf(fontSize);

      const nextIndex =
        currentIndex < 0 ||
        currentIndex >=
          sizes.length - 1
          ? sizes.length - 1
          : currentIndex + 1;

      changeReadingSize(
        sizes[nextIndex]
      );
    }, [
      fontSize,
      changeReadingSize,
    ]);

  /* =======================================================
     Support email
  ======================================================= */

  const copySupportEmail =
    async () => {
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

  /* =======================================================
     Language handler
  ======================================================= */

  const handleLanguageChange =
    (event) => {
      const nextLanguage =
        event.target.value;

      setLanguage(
        nextLanguage
      );

      const selected =
        LANGUAGE_OPTIONS.find(
          (item) =>
            item.value ===
            nextLanguage
        );

      toast.success(
        `${selected?.label || "Language"} selected`
      );
    };

  /* =======================================================
     Legal document navigation
  ======================================================= */

  const openLegalDocument =
    (documentType) => {
      /*
       * LegalDocs.jsx should be responsible for fetching and
       * rendering the actual document.
       *
       * These query parameters allow one LegalDocs component
       * to serve multiple legal documents.
       */
      const params =
        new URLSearchParams({
          document:
            documentType,
        });

      window.location.href =
        `/legal?${params.toString()}`;
    };

  return (
    <div
      className="w-full"
      style={{
        fontSize: `${readingScale}rem`,
      }}
    >
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
          Customize how RevelaCode looks, reads,
          and feels across your devices.
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
                  Control how RevelaCode looks on your
                  device.
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
                  Choose a visual mode for the
                  interface.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-3">
                <ThemeOption
                  icon={Sun}
                  label="Light"
                  active={
                    theme === "light"
                  }
                  onClick={() =>
                    setTheme("light")
                  }
                />

                <ThemeOption
                  icon={Moon}
                  label="Dark"
                  active={
                    theme === "dark"
                  }
                  onClick={() =>
                    setTheme("dark")
                  }
                />

                <ThemeOption
                  icon={Settings2}
                  label="System"
                  active={
                    theme === "system"
                  }
                  onClick={() =>
                    setTheme("system")
                  }
                />
              </div>
            </div>

            {/* Reading size */}

            <div className="p-5 sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-slate-400" />

                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Reading size
                    </p>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Increase or decrease readable text
                    across compatible RevelaCode screens.
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
                  <button
                    type="button"
                    aria-label="Decrease reading size"
                    onClick={
                      decreaseReadingSize
                    }
                    disabled={
                      fontSize === "sm"
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="min-w-[70px] text-center text-[11px] font-bold text-slate-500 dark:text-slate-300">
                    {capitalize(
                      fontSize || "md"
                    )}
                  </span>

                  <button
                    type="button"
                    aria-label="Increase reading size"
                    onClick={
                      increaseReadingSize
                    }
                    disabled={
                      fontSize === "lg"
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:max-w-xl">
                <FontOption
                  value="sm"
                  label="Small"
                  preview="Aa"
                  active={
                    fontSize === "sm"
                  }
                  onClick={() =>
                    changeReadingSize(
                      "sm"
                    )
                  }
                />

                <FontOption
                  value="md"
                  label="Medium"
                  preview="Aa"
                  active={
                    fontSize === "md"
                  }
                  onClick={() =>
                    changeReadingSize(
                      "md"
                    )
                  }
                />

                <FontOption
                  value="lg"
                  label="Large"
                  preview="Aa"
                  active={
                    fontSize === "lg"
                  }
                  onClick={() =>
                    changeReadingSize(
                      "lg"
                    )
                  }
                />
              </div>

              {/* Live preview */}

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-slate-400" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Reading preview
                  </span>
                </div>

                <p className="font-serif leading-7 text-slate-700 dark:text-slate-300">
                  RevelaCode is designed to make
                  knowledge, technology, education,
                  and community resources easier to
                  access and understand.
                </p>
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
                value={language}
                onChange={
                  handleLanguageChange
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500"
              >
                {LANGUAGE_OPTIONS.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.nativeLabel}
                    </option>
                  )
                )}
              </select>

              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
              <Globe className="h-3.5 w-3.5" />

              <span>
                {
                  LANGUAGE_OPTIONS.find(
                    (item) =>
                      item.value ===
                      language
                  )?.description
                }
              </span>
            </div>

            <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-[11px] leading-5 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
              Language preference is saved locally and
              exposed to RevelaCode components through the
              <code className="mx-1 rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-900/50">
                revelacode:languagechange
              </code>
              event.
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
                  Read policies, platform terms, documentation,
                  and support resources.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <LegalButton
                icon={Shield}
                title="Privacy Policy"
                description="Read how RevelaCode handles information and privacy."
                onClick={() =>
                  openLegalDocument(
                    "privacy"
                  )
                }
              />

              <LegalButton
                icon={FileText}
                title="Terms of Service"
                description="Read the rules, responsibilities, and conditions of platform use."
                onClick={() =>
                  openLegalDocument(
                    "terms"
                  )
                }
              />
            </div>

            {/* Additional legal/document reader entry */}

            <button
              type="button"
              onClick={() =>
                openLegalDocument(
                  "all"
                )
              }
              className="group mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-left transition hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-950/30 dark:hover:border-slate-600 dark:hover:bg-slate-900"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                <BookOpen className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Legal Documents Reader
                </p>

                <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
                  Open the full legal documentation reader
                  and read the available documents.
                </p>
              </div>

              <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-300" />
            </button>

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
            Your preferences are stored locally and applied
            across compatible RevelaCode interfaces.
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
   Theme Option
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
   Font Option
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
      aria-pressed={active}
      className={`
        flex flex-col items-center justify-center gap-1.5 rounded-xl border px-4 py-4 transition
        ${
          active
            ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-900"
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

      {active && (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/* =========================================================
   Legal Button
========================================================= */

function LegalButton({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700"
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

      <ExternalLink className="h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-300" />
    </button>
  );
}

/* =========================================================
   Utility
========================================================= */

function capitalize(value) {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}