// src/components/FaithDashboard.jsx

import React, { useMemo } from "react";

import {
  Book,
  BookOpen,
  Globe,
  Layers,
  ArrowRight,
  History,
  Clock3,
  Search,
  Sparkles,
  Bookmark,
  ChevronRight,
} from "lucide-react";

/* =========================================================
   FAITH DASHBOARD
   ---------------------------------------------------------
   Main Faith hub for:
   - Bible
   - Prophecy
   - Events
   - Referential
   - Continue where you left off
   - Recent activity
   - Study shortcuts
========================================================= */

export default function FaithDashboard({
  user,
  isGuest,
  onNavigate,
  onOpenAI,
  onLogin,
}) {
  /* =======================================================
     USER
  ======================================================= */

  const displayName =
    user?.fullName?.trim() || "Guest";

  /* =======================================================
     LOCAL ACTIVITY
  ======================================================= */

  const activity = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        lastDashboard: "",
        lastActivity: "",
        lastActivityTime: "",
        historyCount: 0,
      };
    }

    const lastDashboard =
      localStorage.getItem(
        "revelacode_last_dashboard"
      ) || "";

    const lastActivity =
      localStorage.getItem(
        "revelacode_last_activity"
      ) || "";

    const lastActivityTime =
      localStorage.getItem(
        "revelacode_last_activity_time"
      ) || "";

    const historyCount = Number(
      localStorage.getItem(
        "revelacode_history_count"
      ) || 0
    );

    return {
      lastDashboard,
      lastActivity,
      lastActivityTime,
      historyCount: Number.isFinite(historyCount)
        ? historyCount
        : 0,
    };
  }, []);

  /* =======================================================
     TIME FORMAT
  ======================================================= */

  const formattedActivityTime =
    activity.lastActivityTime
      ? (() => {
          const date = new Date(
            activity.lastActivityTime
          );

          if (Number.isNaN(date.getTime())) {
            return "";
          }

          return date.toLocaleString();
        })()
      : "";

  /* =======================================================
     FAITH TOOLS
  ======================================================= */

  const faithTools = [
    {
      key: "bible",
      title: "Bible",
      label: "Scripture",
      description:
        "Read, search, and explore Scripture across books, chapters, verses, and references.",
      icon: Book,
      gradient:
        "from-blue-600 to-indigo-700",
      badge: "Read Scripture",
    },

    {
      key: "prophecy",
      title: "Prophecy",
      label: "Prophecy",
      description:
        "Study biblical prophecy, symbols, timelines, interpretations, and prophetic connections.",
      icon: BookOpen,
      gradient:
        "from-purple-600 to-violet-700",
      badge: "Decode Prophecy",
    },

    {
      key: "events",
      title: "Events",
      label: "Prophecy Events",
      description:
        "Follow current developments and events connected to biblical prophecy and world affairs.",
      icon: Globe,
      gradient:
        "from-orange-500 to-red-600",
      badge: "View Events",
    },

    {
      key: "referential",
      title: "Referential",
      label: "Cross References",
      description:
        "Connect verses, themes, symbols, concepts, and related passages across Scripture.",
      icon: Layers,
      gradient:
        "from-emerald-600 to-green-700",
      badge: "Explore References",
    },
  ];

  /* =======================================================
     STUDY SHORTCUTS
  ======================================================= */

  const shortcuts = [
    {
      key: "bible",
      title: "Continue Bible Study",
      description:
        "Return to Scripture reading and verse exploration.",
      icon: Book,
    },

    {
      key: "prophecy",
      title: "Continue Prophecy Study",
      description:
        "Return to prophecy decoding and investigation.",
      icon: BookOpen,
    },

    {
      key: "referential",
      title: "Continue Referencing",
      description:
        "Continue connecting passages and biblical concepts.",
      icon: Layers,
    },

    {
      key: "events",
      title: "Check Prophecy Events",
      description:
        "See the latest event and prophecy-related developments.",
      icon: Globe,
    },
  ];

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigateTo = (key) => {
    if (!key || !onNavigate) {
      return;
    }

    onNavigate(key);
  };

  /* =======================================================
     CONTINUE TARGET
  ======================================================= */

  const validContinueTargets = [
    "bible",
    "prophecy",
    "events",
    "referential",
  ];

  const continueTarget =
    validContinueTargets.includes(
      activity.lastDashboard
    )
      ? activity.lastDashboard
      : "bible";

  const continueTitle =
    continueTarget === "bible"
      ? "Continue Bible Study"
      : continueTarget === "prophecy"
      ? "Continue Prophecy Study"
      : continueTarget === "events"
      ? "Continue Prophecy Events"
      : "Continue Referential Study";

  const continueDescription =
    activity.lastActivity ||
    "Pick up your Faith journey from where you last stopped.";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1500px]
        space-y-5
      "
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-gradient-to-br
          from-indigo-700
          via-purple-700
          to-violet-800
          p-5
          text-white
          shadow-xl
          sm:p-7
          lg:p-9
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            h-72
            w-72
            rounded-full
            bg-white/10
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-24
            -left-24
            h-72
            w-72
            rounded-full
            bg-black/10
            blur-3xl
          "
        />

        <div className="relative z-10 max-w-4xl">
          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-white/20
              bg-white/10
              px-3
              py-1.5
              text-xs
              font-bold
              uppercase
              tracking-[0.12em]
              backdrop-blur-sm
            "
          >
            <Sparkles size={14} />
            Faith & Scripture
          </div>

          <div
            className="
              mt-5
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div>
              <h1
                className="
                  text-3xl
                  font-black
                  tracking-tight
                  sm:text-4xl
                  lg:text-5xl
                "
              >
                Welcome to Faith, {displayName}
              </h1>

              <p
                className="
                  mt-4
                  max-w-3xl
                  text-sm
                  leading-7
                  text-white/90
                  sm:text-base
                "
              >
                Your connected Scripture workspace for
                Bible study, prophecy, events, and
                intelligent cross-referencing.
              </p>
            </div>

            <div
              className="
                inline-flex
                w-fit
                shrink-0
                items-center
                gap-2
                rounded-full
                border
                border-white/15
                bg-white/10
                px-3
                py-2
                text-xs
                font-semibold
                backdrop-blur-sm
              "
            >
              {isGuest ? "Guest Session" : "Verified Account"}
            </div>
          </div>

          {/* Hero Actions */}

          <div
            className="
              mt-7
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >
            <button
              type="button"
              onClick={() =>
                navigateTo("bible")
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white
                px-5
                py-3
                font-bold
                text-indigo-700
                shadow-lg
                transition
                hover:bg-gray-100
                active:scale-[0.99]
              "
            >
              Open Bible
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={() =>
                navigateTo("prophecy")
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-white/20
                bg-white/10
                px-5
                py-3
                font-bold
                text-white
                backdrop-blur-sm
                transition
                hover:bg-white/20
                active:scale-[0.99]
              "
            >
              Explore Prophecy
              <BookOpen size={17} />
            </button>

            <button
              type="button"
              onClick={onOpenAI}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-white/20
                bg-white/10
                px-5
                py-3
                font-bold
                text-white
                backdrop-blur-sm
                transition
                hover:bg-white/20
                active:scale-[0.99]
              "
            >
              Ask RevelaAI
              <Sparkles size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTINUE WHERE YOU LEFT OFF
      ===================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-gray-200/70
          bg-white
          p-4
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-900
          sm:p-5
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-indigo-100
                text-indigo-700
                dark:bg-indigo-900/40
                dark:text-indigo-300
              "
            >
              <History size={20} />
            </div>

            <div className="min-w-0">
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <h2
                  className="
                    text-lg
                    font-black
                    text-gray-900
                    dark:text-white
                  "
                >
                  Continue where you left off
                </h2>

                {activity.historyCount > 0 && (
                  <span
                    className="
                      rounded-full
                      bg-gray-100
                      px-2.5
                      py-1
                      text-[10px]
                      font-bold
                      text-gray-500
                      dark:bg-gray-800
                      dark:text-gray-400
                    "
                  >
                    {activity.historyCount} activities
                  </span>
                )}
              </div>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-gray-500
                  dark:text-gray-400
                "
              >
                {continueDescription}
              </p>

              {formattedActivityTime && (
                <div
                  className="
                    mt-2
                    flex
                    items-center
                    gap-1.5
                    text-xs
                    text-gray-400
                  "
                >
                  <Clock3 size={13} />
                  {formattedActivityTime}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigateTo(continueTarget)
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-indigo-600
              px-4
              py-2.5
              text-sm
              font-bold
              text-white
              transition
              hover:bg-indigo-700
              active:scale-[0.99]
              lg:shrink-0
            "
          >
            {continueTitle}
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* =====================================================
          FAITH WORKSPACES
      ===================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-gray-200/70
          bg-white
          p-4
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-900
          sm:p-5
        "
      >
        <div
          className="
            flex
            flex-col
            gap-2
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <h2
              className="
                text-xl
                font-black
                text-gray-900
                dark:text-white
              "
            >
              Faith Workspaces
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              Your core Scripture study tools in one place.
            </p>
          </div>

          <span
            className="
              w-fit
              rounded-full
              border
              border-gray-200
              bg-gray-50
              px-3
              py-1
              text-[11px]
              font-bold
              text-gray-500
              dark:border-gray-700
              dark:bg-gray-800
              dark:text-gray-400
            "
          >
            {faithTools.length} workspaces
          </span>
        </div>

        <div
          className="
            mt-5
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          {faithTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button
                key={tool.key}
                type="button"
                onClick={() =>
                  navigateTo(tool.key)
                }
                className="
                  group
                  relative
                  flex
                  min-h-[235px]
                  flex-col
                  overflow-hidden
                  rounded-2xl
                  border
                  border-gray-200
                  bg-gray-50
                  p-5
                  text-left
                  transition-all
                  duration-200
                  hover:-translate-y-1
                  hover:border-gray-300
                  hover:bg-white
                  hover:shadow-lg
                  active:scale-[0.99]
                  dark:border-gray-800
                  dark:bg-gray-800/50
                  dark:hover:border-gray-700
                  dark:hover:bg-gray-800
                "
              >
                {/* Glow */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    -right-8
                    -top-8
                    h-28
                    w-28
                    rounded-full
                    bg-indigo-500/5
                    blur-2xl
                    transition
                    group-hover:bg-indigo-500/10
                  "
                />

                {/* Icon */}

                <div
                  className={`
                    relative
                    z-10
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-gradient-to-br
                    ${tool.gradient}
                    text-white
                    shadow-md
                  `}
                >
                  <Icon size={23} />
                </div>

                {/* Badge */}

                <span
                  className="
                    relative
                    z-10
                    mt-5
                    w-fit
                    rounded-full
                    border
                    border-gray-200
                    bg-white
                    px-2.5
                    py-1
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-gray-500
                    dark:border-gray-700
                    dark:bg-gray-900
                    dark:text-gray-400
                  "
                >
                  {tool.badge}
                </span>

                {/* Content */}

                <div className="relative z-10 mt-3">
                  <h3
                    className="
                      text-lg
                      font-black
                      text-gray-900
                      dark:text-white
                    "
                  >
                    {tool.title}
                  </h3>

                  <p
                    className="
                      mt-2
                      text-sm
                      leading-6
                      text-gray-500
                      dark:text-gray-400
                    "
                  >
                    {tool.description}
                  </p>
                </div>

                {/* Footer */}

                <div
                  className="
                    relative
                    z-10
                    mt-auto
                    flex
                    items-center
                    gap-1.5
                    pt-5
                    text-sm
                    font-bold
                    text-indigo-600
                    dark:text-indigo-400
                  "
                >
                  Open workspace
                  <ArrowRight
                    size={15}
                    className="
                      transition-transform
                      group-hover:translate-x-1
                    "
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          QUICK STUDY SHORTCUTS
      ===================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-gray-200/70
          bg-white
          p-4
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-900
          sm:p-5
        "
      >
        <div>
          <h2
            className="
              text-lg
              font-black
              text-gray-900
              dark:text-white
            "
          >
            Quick Study
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            Get back into your most important Faith
            workflows quickly.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;

            return (
              <button
                key={shortcut.key}
                type="button"
                onClick={() =>
                  navigateTo(shortcut.key)
                }
                className="
                  group
                  flex
                  min-w-0
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  p-3.5
                  text-left
                  transition
                  hover:border-gray-300
                  hover:bg-white
                  hover:shadow-sm
                  dark:border-gray-800
                  dark:bg-gray-800/50
                  dark:hover:border-gray-700
                  dark:hover:bg-gray-800
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-indigo-100
                    text-indigo-600
                    dark:bg-indigo-900/40
                    dark:text-indigo-300
                  "
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3
                    className="
                      truncate
                      text-sm
                      font-bold
                      text-gray-900
                      dark:text-white
                    "
                  >
                    {shortcut.title}
                  </h3>

                  <p
                    className="
                      mt-1
                      line-clamp-2
                      text-xs
                      leading-5
                      text-gray-500
                      dark:text-gray-400
                    "
                  >
                    {shortcut.description}
                  </p>
                </div>

                <ChevronRight
                  size={17}
                  className="
                    shrink-0
                    text-gray-400
                    transition-transform
                    group-hover:translate-x-0.5
                  "
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          PERSONALIZED STUDY AREA
      ===================================================== */}

      <section
        className="
          grid
          grid-cols-1
          gap-4
          lg:grid-cols-3
        "
      >
        {/* History */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200/70
            bg-white
            p-5
            shadow-sm
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-gray-100
                text-gray-600
                dark:bg-gray-800
                dark:text-gray-300
              "
            >
              <History size={18} />
            </div>

            <div>
              <h3
                className="
                  font-black
                  text-gray-900
                  dark:text-white
                "
              >
                Study History
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activity.historyCount > 0
                  ? `${activity.historyCount} recorded activities`
                  : "No recorded activities yet"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigateTo(continueTarget)
            }
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              text-sm
              font-bold
              text-indigo-600
              dark:text-indigo-400
            "
          >
            Continue studying
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Search */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200/70
            bg-white
            p-5
            shadow-sm
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-blue-600
                dark:bg-blue-900/40
                dark:text-blue-300
              "
            >
              <Search size={18} />
            </div>

            <div>
              <h3
                className="
                  font-black
                  text-gray-900
                  dark:text-white
                "
              >
                Search Scripture
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Find verses and passages quickly.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigateTo("bible")
            }
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              text-sm
              font-bold
              text-indigo-600
              dark:text-indigo-400
            "
          >
            Open Bible search
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Saved Study */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200/70
            bg-white
            p-5
            shadow-sm
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-amber-100
                text-amber-700
                dark:bg-amber-900/40
                dark:text-amber-300
              "
            >
              <Bookmark size={18} />
            </div>

            <div>
              <h3
                className="
                  font-black
                  text-gray-900
                  dark:text-white
                "
              >
                Saved Study
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Return to your saved Scripture work.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigateTo("referential")
            }
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              text-sm
              font-bold
              text-indigo-600
              dark:text-indigo-400
            "
          >
            Open study references
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* =====================================================
          ACCOUNT CTA
      ===================================================== */}

      {isGuest && (
        <section
          className="
            rounded-2xl
            border
            border-yellow-200
            bg-yellow-50
            p-5
            dark:border-yellow-900/40
            dark:bg-yellow-950/20
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h2
                className="
                  font-black
                  text-gray-900
                  dark:text-white
                "
              >
                Save your Faith journey
              </h2>

              <p
                className="
                  mt-1
                  max-w-2xl
                  text-sm
                  leading-6
                  text-gray-600
                  dark:text-gray-300
                "
              >
                Create an account to preserve your
                study history, preferences, and future
                personalized Faith features.
              </p>
            </div>

            <button
              type="button"
              onClick={onLogin}
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-indigo-600
                px-4
                py-2.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-indigo-700
                active:scale-[0.99]
              "
            >
              Login / Register
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
