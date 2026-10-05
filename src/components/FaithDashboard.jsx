// src/components/FaithDashboard.jsx

import React, { useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Book,
  BookOpen,
  Bookmark,
  ChevronRight,
  Clock3,
  Globe,
  History,
  Layers,
  Library,
  Search,
  Sparkles,
  Star,
} from "lucide-react";

import StudyLibrary from "./study/StudyLibrary.jsx";
import BookmarksPanel from "./study/BookmarksPanel.jsx";
import RecommendationsPanel from "./study/RecommendationsPanel.jsx";
import StudyReader from "./study/StudyReader.jsx";

/* =========================================================
   FAITH DASHBOARD
   ---------------------------------------------------------
   Main Faith hub for:
   - Bible
   - Prophecy
   - Events
   - Referential
   - Study Library
   - Saved Bookmarks
   - Recommendations
   - Study Reader
   - Continue where you left off
   - Recent activity

   Study-related views remain INTERNAL to Faith and are not
   added to the global dashboard registry.
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
    user?.fullName?.trim() ||
    user?.name?.trim() ||
    user?.username?.trim() ||
    "Guest";

  const userId =
    user?.id ||
    user?._id ||
    user?.user_id ||
    user?.userId ||
    "guest";

  /* =======================================================
     INTERNAL FAITH / STUDY NAVIGATION
  ======================================================= */

  const [faithSection, setFaithSection] = useState("home");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [studyReturnSection, setStudyReturnSection] = useState("study");

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
      localStorage.getItem("revelacode_last_dashboard") || "";

    const lastActivity =
      localStorage.getItem("revelacode_last_activity") || "";

    const lastActivityTime =
      localStorage.getItem("revelacode_last_activity_time") || "";

    const rawHistoryCount = Number(
      localStorage.getItem("revelacode_history_count") || 0
    );

    return {
      lastDashboard,
      lastActivity,
      lastActivityTime,
      historyCount: Number.isFinite(rawHistoryCount)
        ? rawHistoryCount
        : 0,
    };
  }, []);

  /* =======================================================
     TIME FORMAT
  ======================================================= */

  const formattedActivityTime = useMemo(() => {
    if (!activity.lastActivityTime) {
      return "";
    }

    const date = new Date(activity.lastActivityTime);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString();
  }, [activity.lastActivityTime]);

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
      gradient: "from-blue-600 to-indigo-700",
      badge: "Read Scripture",
    },

    {
      key: "prophecy",
      title: "Prophecy",
      label: "Prophecy",
      description:
        "Study biblical prophecy, symbols, timelines, interpretations, and prophetic connections.",
      icon: BookOpen,
      gradient: "from-purple-600 to-violet-700",
      badge: "Decode Prophecy",
    },

    {
      key: "events",
      title: "Events",
      label: "Prophecy Events",
      description:
        "Follow current developments and events connected to biblical prophecy and world affairs.",
      icon: Globe,
      gradient: "from-orange-500 to-red-600",
      badge: "View Events",
    },

    {
      key: "referential",
      title: "Referential",
      label: "Cross References",
      description:
        "Connect verses, themes, symbols, concepts, and related passages across Scripture.",
      icon: Layers,
      gradient: "from-emerald-600 to-green-700",
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
     GLOBAL NAVIGATION
  ======================================================= */

  const navigateTo = (key) => {
    if (!key || !onNavigate) {
      return;
    }

    onNavigate(key);
  };

  /* =======================================================
     INTERNAL STUDY NAVIGATION
  ======================================================= */

  const openStudy = () => {
    setSelectedMaterial(null);
    setFaithSection("study");
  };

  const openBookmarks = () => {
    setSelectedMaterial(null);
    setFaithSection("bookmarks");
  };

  const openRecommendations = () => {
    setSelectedMaterial(null);
    setFaithSection("recommendations");
  };

  const openMaterial = (material) => {
    if (!material) {
      return;
    }

    setSelectedMaterial(material);
    setStudyReturnSection(faithSection === "home" ? "study" : faithSection);
    setFaithSection("reader");
  };

  const closeStudyView = () => {
    setSelectedMaterial(null);
    setFaithSection("home");
  };

  const goBackFromReader = () => {
    setSelectedMaterial(null);
    setFaithSection(studyReturnSection || "study");
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

  const continueTarget = validContinueTargets.includes(
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
     INTERNAL STUDY HEADER
  ======================================================= */

  const renderStudyHeader = (title, description, backAction) => (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-gray-200/70
        bg-white
        shadow-sm
        dark:border-gray-800
        dark:bg-gray-900
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4
          p-4
          sm:p-5
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={backAction}
            aria-label="Back to Faith"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-gray-200
              bg-gray-50
              text-gray-600
              transition
              hover:bg-gray-100
              dark:border-gray-700
              dark:bg-gray-800
              dark:text-gray-300
              dark:hover:bg-gray-700
            "
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="
                  rounded-full
                  bg-indigo-100
                  px-2.5
                  py-1
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-indigo-700
                  dark:bg-indigo-900/40
                  dark:text-indigo-300
                "
              >
                Faith Study
              </span>

              {!isGuest && (
                <span
                  className="
                    rounded-full
                    bg-emerald-100
                    px-2.5
                    py-1
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-emerald-700
                    dark:bg-emerald-900/30
                    dark:text-emerald-300
                  "
                >
                  Account Active
                </span>
              )}
            </div>

            <h1
              className="
                mt-2
                text-xl
                font-black
                tracking-tight
                text-gray-900
                dark:text-white
                sm:text-2xl
              "
            >
              {title}
            </h1>

            {description && (
              <p
                className="
                  mt-1
                  max-w-3xl
                  text-sm
                  leading-6
                  text-gray-500
                  dark:text-gray-400
                "
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div
          className="
            flex
            flex-wrap
            gap-2
            lg:justify-end
          "
        >
          <button
            type="button"
            onClick={openStudy}
            className={`
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-3.5
              py-2.5
              text-sm
              font-bold
              transition
              ${
                faithSection === "study"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >
            <Library size={16} />
            Library
          </button>

          <button
            type="button"
            onClick={openBookmarks}
            className={`
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-3.5
              py-2.5
              text-sm
              font-bold
              transition
              ${
                faithSection === "bookmarks"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >
            <Bookmark size={16} />
            Bookmarks
          </button>

          <button
            type="button"
            onClick={openRecommendations}
            className={`
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-3.5
              py-2.5
              text-sm
              font-bold
              transition
              ${
                faithSection === "recommendations"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >
            <Star size={16} />
            Recommended
          </button>
        </div>
      </div>
    </section>
  );

  /* =======================================================
     INTERNAL STUDY VIEWS
  ======================================================= */

  if (faithSection === "study") {
    return (
      <div
        className="
          mx-auto
          w-full
          max-w-[1500px]
          space-y-4
        "
      >
        {renderStudyHeader(
          "Study Library",
          "Browse the study materials uploaded to RevelaCode and open a lesson for reading and deeper study.",
          closeStudyView
        )}

        <StudyLibrary onOpen={openMaterial} />
      </div>
    );
  }

  if (faithSection === "bookmarks") {
    return (
      <div
        className="
          mx-auto
          w-full
          max-w-[1500px]
          space-y-4
        "
      >
        {renderStudyHeader(
          "Saved Study",
          "Access the study materials you have bookmarked for later reading.",
          closeStudyView
        )}

        <BookmarksPanel
          userId={userId}
          onOpen={openMaterial}
        />
      </div>
    );
  }

  if (faithSection === "recommendations") {
    return (
      <div
        className="
          mx-auto
          w-full
          max-w-[1500px]
          space-y-4
        "
      >
        {renderStudyHeader(
          "Recommended Study",
          "Discover study materials selected from your saved study preferences.",
          closeStudyView
        )}

        <RecommendationsPanel
          userId={userId}
          onOpen={openMaterial}
        />
      </div>
    );
  }

  if (faithSection === "reader") {
    return (
      <div
        className="
          mx-auto
          w-full
          max-w-[1500px]
          space-y-4
        "
      >
        {renderStudyHeader(
          selectedMaterial?.title || "Study Reader",
          selectedMaterial
            ? "Read the complete lesson and continue your Faith study from one place."
            : "Open a study material from the library.",
          goBackFromReader
        )}

        {selectedMaterial ? (
          <StudyReader
            initialMaterial={selectedMaterial}
            materialId={
              selectedMaterial?.id ||
              selectedMaterial?._id ||
              selectedMaterial?.material_id ||
              selectedMaterial?.materialId
            }
            userId={userId}
            onBack={goBackFromReader}
          />
        ) : (
          <section
            className="
              rounded-2xl
              border
              border-gray-200/70
              bg-white
              p-8
              text-center
              shadow-sm
              dark:border-gray-800
              dark:bg-gray-900
            "
          >
            <Library
              size={38}
              className="
                mx-auto
                text-indigo-500
              "
            />

            <h2
              className="
                mt-4
                text-lg
                font-black
                text-gray-900
                dark:text-white
              "
            >
              No study material selected
            </h2>

            <p
              className="
                mx-auto
                mt-2
                max-w-md
                text-sm
                leading-6
                text-gray-500
                dark:text-gray-400
              "
            >
              Open a lesson from the Study Library to begin reading.
            </p>

            <button
              type="button"
              onClick={openStudy}
              className="
                mt-5
                inline-flex
                items-center
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
              "
            >
              Open Study Library
              <ArrowRight size={16} />
            </button>
          </section>
        )}
      </div>
    );
  }

  /* =======================================================
     MAIN FAITH DASHBOARD
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

        <div className="relative z-10 max-w-5xl">
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
              gap-5
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
                Your connected Scripture workspace for Bible study,
                prophecy, events, intelligent cross-referencing, and
                structured study materials.
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
              sm:flex-wrap
            "
          >
            <button
              type="button"
              onClick={() => navigateTo("bible")}
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
              onClick={() => navigateTo("prophecy")}
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
              onClick={openStudy}
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
              Study Library
              <Library size={17} />
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
          STUDY QUICK ACCESS
      ===================================================== */}

      <section
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
          xl:grid-cols-3
        "
      >
        <button
          type="button"
          onClick={openStudy}
          className="
            group
            rounded-2xl
            border
            border-indigo-200
            bg-indigo-50
            p-4
            text-left
            transition
            hover:-translate-y-0.5
            hover:shadow-md
            dark:border-indigo-900/50
            dark:bg-indigo-950/20
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-indigo-600
                text-white
              "
            >
              <Library size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h3
                className="
                  font-black
                  text-gray-900
                  dark:text-white
                "
              >
                Study Library
              </h3>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Browse uploaded study materials.
              </p>
            </div>

            <ChevronRight
              size={18}
              className="
                text-indigo-500
                transition-transform
                group-hover:translate-x-1
              "
            />
          </div>
        </button>

        <button
          type="button"
          onClick={openBookmarks}
          className="
            group
            rounded-2xl
            border
            border-amber-200
            bg-amber-50
            p-4
            text-left
            transition
            hover:-translate-y-0.5
            hover:shadow-md
            dark:border-amber-900/50
            dark:bg-amber-950/20
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-amber-500
                text-white
              "
            >
              <Bookmark size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h3
                className="
                  font-black
                  text-gray-900
                  dark:text-white
                "
              >
                Saved Study
              </h3>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Open your bookmarked materials.
              </p>
            </div>

            <ChevronRight
              size={18}
              className="
                text-amber-500
                transition-transform
                group-hover:translate-x-1
              "
            />
          </div>
        </button>

        <button
          type="button"
          onClick={openRecommendations}
          className="
            group
            rounded-2xl
            border
            border-purple-200
            bg-purple-50
            p-4
            text-left
            transition
            hover:-translate-y-0.5
            hover:shadow-md
            dark:border-purple-900/50
            dark:bg-purple-950/20
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-purple-600
                text-white
              "
            >
              <Star size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h3
                className="
                  font-black
                  text-gray-900
                  dark:text-white
                "
              >
                Recommended
              </h3>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Continue with relevant study materials.
              </p>
            </div>

            <ChevronRight
              size={18}
              className="
                text-purple-500
                transition-transform
                group-hover:translate-x-1
              "
            />
          </div>
        </button>
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
            onClick={() => navigateTo(continueTarget)}
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
              Your core Scripture and prophecy tools in one place.
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
                onClick={() => navigateTo(tool.key)}
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
          QUICK STUDY
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
              Get back into your most important Faith workflows quickly.
            </p>
          </div>

          <button
            type="button"
            onClick={openStudy}
            className="
              inline-flex
              w-fit
              items-center
              gap-1.5
              text-sm
              font-bold
              text-indigo-600
              dark:text-indigo-400
            "
          >
            Open Study Library
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;

            return (
              <button
                key={shortcut.key}
                type="button"
                onClick={() => navigateTo(shortcut.key)}
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
            onClick={() => navigateTo(continueTarget)}
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
            onClick={() => navigateTo("bible")}
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
                Return to your saved study materials.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openBookmarks}
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
            Open bookmarks
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* =====================================================
          STUDY LIBRARY PROMO
      ===================================================== */}

      <section
        className="
          overflow-hidden
          rounded-2xl
          border
          border-indigo-200
          bg-gradient-to-r
          from-indigo-50
          via-white
          to-purple-50
          p-5
          shadow-sm
          dark:border-indigo-900/40
          dark:from-indigo-950/20
          dark:via-gray-900
          dark:to-purple-950/20
          sm:p-6
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div className="flex items-start gap-4">
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-indigo-600
                text-white
                shadow-md
              "
            >
              <Library size={22} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className="
                    text-lg
                    font-black
                    text-gray-900
                    dark:text-white
                  "
                >
                  RevelaCode Study Library
                </h2>

                <span
                  className="
                    rounded-full
                    bg-indigo-100
                    px-2.5
                    py-1
                    text-[10px]
                    font-black
                    uppercase
                    tracking-wide
                    text-indigo-700
                    dark:bg-indigo-900/40
                    dark:text-indigo-300
                  "
                >
                  Faith
                </span>
              </div>

              <p
                className="
                  mt-1.5
                  max-w-3xl
                  text-sm
                  leading-6
                  text-gray-600
                  dark:text-gray-300
                "
              >
                Read published study materials, save important lessons,
                and continue your study directly from the Faith hub.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={openStudy}
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
              "
            >
              Browse Materials
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={openBookmarks}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-bold
                text-gray-700
                transition
                hover:bg-gray-50
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-gray-200
                dark:hover:bg-gray-700
              "
            >
              <Bookmark size={16} />
              Saved
            </button>
          </div>
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
                Create an account to preserve your study history,
                bookmarks, preferences, and future personalized Faith
                features.
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