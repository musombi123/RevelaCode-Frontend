// src/components/FaithDashboard.jsx

import React from "react";
import {
  Crown,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { DASHBOARDS } from "./dashboardConfig.jsx";

/* =========================================================
   Home Dashboard
========================================================= */

export default function HomeDashboard({
  user,
  isGuest,
  dailyGreeting,
  onNavigate,
  onOpenAI,
  onLogin,
}) {
  const displayName = user?.fullName?.trim();

  const welcomeName =
    displayName || "GUEST";

  /* =========================================================
     User Badge
  ========================================================= */

  const userBadge = isGuest ? (
    <span
      className="
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        border-yellow-200/60
        bg-yellow-100
        px-3
        py-1
        text-xs
        font-semibold
        text-yellow-700
        dark:border-yellow-800/50
        dark:bg-yellow-900/40
        dark:text-yellow-300
      "
    >
      <Crown size={14} />
      Guest Session
    </span>
  ) : (
    <span
      className="
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        border-green-200/60
        bg-green-100
        px-3
        py-1
        text-xs
        font-semibold
        text-green-700
        dark:border-green-800/50
        dark:bg-green-900/30
        dark:text-green-300
      "
    >
      <ShieldCheck size={14} />
      Verified Account
    </span>
  );

  /* =========================================================
     Quick Launch
  ========================================================= */

  const quickLaunchDashboards = DASHBOARDS
    .filter(
      (dashboard) =>
        !dashboard.hidden &&
        dashboard.key !== "home"
    )
    .filter((dashboard) => {
      if (
        isGuest &&
        dashboard.key === "accounts"
      ) {
        return false;
      }

      return true;
    });

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="
          relative
          overflow-hidden
          rounded-2xl
          bg-gradient-to-br
          from-indigo-600
          via-purple-600
          to-pink-600
          p-4
          text-white
          shadow-lg
          sm:p-6
          lg:p-8
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            -right-10
            -top-10
            h-48
            w-48
            rounded-full
            bg-white/10
            blur-2xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-10
            -left-10
            h-48
            w-48
            rounded-full
            bg-black/10
            blur-2xl
          "
        />

        <div className="relative z-10 flex flex-col gap-3">

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
            <h1
              className="
                text-2xl
                font-extrabold
                tracking-tight
                sm:text-3xl
                lg:text-5xl
              "
            >
              Welcome, {welcomeName} ✨
            </h1>

            {userBadge}
          </div>

          <p
            className="
              max-w-2xl
              text-sm
              leading-7
              text-white/90
              sm:text-base
            "
          >
            RevelaCode is your AI-powered
            Bible decoding workspace —
            prophecy insights, scripture
            referencing, and intelligent
            tools built for speed and clarity.
          </p>

          <div
            className="
              mt-4
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >
            <button
              type="button"
              onClick={onOpenAI}
              className="
                rounded-xl
                border
                border-white/20
                bg-white/15
                px-4
                py-2.5
                font-semibold
                text-white
                transition
                hover:bg-white/25
                active:scale-[0.99]
              "
            >
              Open RevelaAI 🤖
            </button>

            {isGuest ? (
              <button
                type="button"
                onClick={onLogin}
                className="
                  rounded-xl
                  bg-white
                  px-4
                  py-2.5
                  font-semibold
                  text-indigo-700
                  shadow
                  transition
                  hover:bg-gray-100
                  active:scale-[0.99]
                "
              >
                Login / Register 🔐
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onNavigate("settings")
                }
                className="
                  rounded-xl
                  bg-white
                  px-4
                  py-2.5
                  font-semibold
                  text-indigo-700
                  shadow
                  transition
                  hover:bg-gray-100
                  active:scale-[0.99]
                "
              >
                Personalize Settings ⚙️
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          GREETING
      ===================================================== */}

      <section
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          rounded-2xl
          border
          border-gray-200/60
          bg-white
          p-4
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-900
        "
      >
        <div className="flex items-center gap-2">
          <Sparkles
            className="
              text-indigo-600
              dark:text-indigo-300
            "
            size={18}
          />

          <p
            className="
              font-medium
              text-gray-700
              dark:text-gray-200
            "
          >
            {dailyGreeting}
          </p>
        </div>

        <div
          className="
            text-xs
            text-gray-500
            dark:text-gray-400
          "
        >
          {isGuest
            ? "Guest mode: your session may not save permanently."
            : `Logged in as: ${
                user?.contact || "N/A"
              }`}
        </div>
      </section>

      {/* =====================================================
          MAIN WORKSPACE
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          lg:grid-cols-3
        "
      >

        {/* ===================================================
            QUICK LAUNCH
        =================================================== */}

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
            lg:col-span-2
          "
        >
          <div
            className="
              flex
              items-end
              justify-between
              gap-3
            "
          >
            <div>
              <h2
                className="
                  text-lg
                  font-bold
                  text-gray-900
                  dark:text-gray-100
                "
              >
                Quick Launch
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Access your RevelaCode workspace instantly.
              </p>
            </div>

            <span
              className="
                hidden
                rounded-full
                border
                border-gray-200
                bg-gray-50
                px-3
                py-1
                text-[11px]
                font-semibold
                text-gray-500
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-gray-400
                sm:inline-flex
              "
            >
              {quickLaunchDashboards.length} tools
            </span>
          </div>

          <div
            className="
              mt-5
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            {quickLaunchDashboards.map(
              (dashboard) => {
                const Icon = dashboard.icon;

                return (
                  <button
                    key={dashboard.key}
                    type="button"
                    onClick={() =>
                      onNavigate(
                        dashboard.key
                      )
                    }
                    className="
                      group
                      relative
                      flex
                      min-h-[152px]
                      flex-col
                      justify-between
                      overflow-hidden
                      rounded-2xl
                      border
                      border-gray-200
                      bg-gray-50
                      p-4
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
                        h-24
                        w-24
                        rounded-full
                        bg-indigo-500/5
                        blur-2xl
                        transition
                        group-hover:bg-indigo-500/10
                      "
                    />

                    {/* Top */}

                    <div
                      className="
                        relative
                        z-10
                        flex
                        items-start
                        justify-between
                        gap-3
                      "
                    >
                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-white
                          text-gray-600
                          shadow-sm
                          transition-all
                          duration-200
                          dark:bg-gray-900
                          dark:text-gray-300
                        "
                      >
                        <Icon size={20} />
                      </div>

                      <span
                        className="
                          rounded-full
                          bg-white
                          px-2
                          py-1
                          text-[10px]
                          font-bold
                          text-gray-400
                          opacity-0
                          shadow-sm
                          transition
                          group-hover:opacity-100
                          dark:bg-gray-900
                        "
                      >
                        Open
                      </span>
                    </div>

                    {/* Bottom */}

                    <div
                      className="
                        relative
                        z-10
                        mt-5
                      "
                    >
                      <h3
                        className="
                          truncate
                          text-sm
                          font-bold
                          text-gray-900
                          dark:text-gray-100
                        "
                      >
                        {dashboard.title ||
                          dashboard.label}
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
                        Explore{" "}
                        {dashboard.label?.toLowerCase() ||
                          "this workspace"}{" "}
                        and access its tools.
                      </p>

                      <div
                        className="
                          mt-3
                          flex
                          items-center
                          gap-1
                          text-xs
                          font-bold
                          text-indigo-600
                          transition
                          group-hover:gap-2
                          dark:text-indigo-400
                        "
                      >
                        Launch

                        <span
                          className="
                            transition-transform
                            group-hover:translate-x-0.5
                          "
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* ===================================================
            SESSION CARD
        =================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-gray-200/60
            bg-white
            p-5
            shadow-sm
            dark:border-gray-800
            dark:bg-gray-900
            lg:sticky
            lg:top-24
          "
        >
          <h2
            className="
              text-lg
              font-bold
              text-gray-900
              dark:text-gray-100
            "
          >
            Your Session 👤
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-gray-600
              dark:text-gray-300
            "
          >
            Account information and access level.
          </p>

          <div className="mt-4 space-y-3">

            <div
              className="
                rounded-xl
                border
                border-gray-200/60
                bg-gray-50
                p-3
                dark:border-gray-700/60
                dark:bg-gray-800/60
              "
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Name
              </p>

              <p
                className="
                  mt-1
                  font-semibold
                  text-gray-900
                  dark:text-gray-100
                "
              >
                {user?.fullName || "Guest"}
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-gray-200/60
                bg-gray-50
                p-3
                dark:border-gray-700/60
                dark:bg-gray-800/60
              "
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contact
              </p>

              <p
                className="
                  mt-1
                  break-all
                  font-semibold
                  text-gray-900
                  dark:text-gray-100
                "
              >
                {user?.contact || "N/A"}
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-gray-200/60
                bg-gray-50
                p-3
                dark:border-gray-700/60
                dark:bg-gray-800/60
              "
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Role
              </p>

              <p
                className="
                  mt-1
                  font-semibold
                  text-gray-900
                  dark:text-gray-100
                "
              >
                {user?.role || "normal"}
              </p>
            </div>

            {isGuest && (
              <div
                className="
                  rounded-xl
                  border
                  border-yellow-200/60
                  bg-yellow-50
                  p-3
                  dark:border-yellow-900/40
                  dark:bg-yellow-950/40
                "
              >
                <p
                  className="
                    text-sm
                    leading-6
                    text-gray-800
                    dark:text-gray-200
                  "
                >
                  ⚠ Guest accounts can use
                  almost everything, but{" "}
                  <span className="font-semibold">
                    Accounts Dashboard
                  </span>{" "}
                  is locked.
                </p>

                <button
                  type="button"
                  onClick={onLogin}
                  className="
                    mt-3
                    w-full
                    rounded-xl
                    bg-indigo-600
                    py-2.5
                    font-semibold
                    text-white
                    transition
                    hover:bg-indigo-700
                    active:scale-[0.99]
                  "
                >
                  Login to Unlock Accounts 🔓
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =====================================================
          UPCOMING FEATURES
      ===================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-gray-200/60
          bg-white
          p-4
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-900
          sm:p-5
        "
      >
        <h2
          className="
            font-bold
            text-gray-900
            dark:text-gray-100
          "
        >
          Upcoming Features 🔥
        </h2>

        <ul
          className="
            mt-3
            grid
            grid-cols-1
            gap-2
            text-sm
            text-gray-700
            dark:text-gray-200
            sm:grid-cols-2
          "
        >
          <li
            className="
              rounded-xl
              border
              border-gray-200/60
              bg-gray-50
              p-3
              dark:border-gray-700/60
              dark:bg-gray-800/60
            "
          >
            Enhanced AI decoding for prophecies
          </li>

          <li
            className="
              rounded-xl
              border
              border-gray-200/60
              bg-gray-50
              p-3
              dark:border-gray-700/60
              dark:bg-gray-800/60
            "
          >
            Weekly Bible study challenges
          </li>

          <li
            className="
              rounded-xl
              border
              border-gray-200/60
              bg-gray-50
              p-3
              dark:border-gray-700/60
              dark:bg-gray-800/60
            "
          >
            Customizable dashboard widgets
          </li>

          <li
            className="
              rounded-xl
              border
              border-gray-200/60
              bg-gray-50
              p-3
              dark:border-gray-700/60
              dark:bg-gray-800/60
            "
          >
            Linked account integrations
          </li>
        </ul>
      </section>
    </div>
  );
}
