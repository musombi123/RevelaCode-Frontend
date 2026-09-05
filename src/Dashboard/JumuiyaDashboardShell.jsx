import React, { useState } from "react";

import {
  Bell,
  ChevronRight,
  Home,
  Leaf,
  Menu,
  ShoppingCart,
  Users,
  WalletCards,
  X,
} from "lucide-react";


/* =========================================================
   JUMUIYA HUBS
========================================================= */

const HUBS = [
  {
    key: "biashara",
    label: "Biashara",
    description: "Business & commerce",
    icon: ShoppingCart,
  },
  {
    key: "shamba",
    label: "Shamba",
    description: "Farming & agriculture",
    icon: Leaf,
  },
  {
    key: "education",
    label: "Education",
    description: "Schools & learning",
    icon: Users,
  },
  {
    key: "community",
    label: "Community",
    description: "People & connection",
    icon: Users,
  },
];


/* =========================================================
   SHELL
========================================================= */

export default function JumuiyaDashboardShell({
  title = "Jumuiya",
  subtitle = "One ecosystem. One identity.",
  activeHub = "",
  user = null,
  onNavigate,
  children,
}) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const fullName =
    user?.fullName ||
    user?.full_name ||
    "User";

  const initials =
    fullName
      .trim()
      .charAt(0)
      .toUpperCase() || "U";


  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigate = (key) => {
    if (typeof onNavigate === "function") {
      onNavigate(key);
    }

    setMobileOpen(false);
  };


  return (
    <div
      className="
        min-h-screen
        bg-slate-50
        text-slate-900
        dark:bg-slate-950
        dark:text-white
      "
    >

      {/* ===================================================
          MOBILE OVERLAY
      =================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setMobileOpen(false)
          }
          className="
            fixed
            inset-0
            z-40
            bg-slate-950/50
            backdrop-blur-sm
            lg:hidden
          "
        />
      )}


      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-72
          border-r
          border-slate-200
          bg-white
          transition-transform
          duration-300
          dark:border-white/10
          dark:bg-slate-900
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <div
          className="
            flex
            h-full
            flex-col
          "
        >

          {/* =================================================
              BRAND
          ================================================= */}

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-200
              px-5
              py-5
              dark:border-white/10
            "
          >
            <div>
              <div
                className="
                  flex
                  items-center
                  gap-2.5
                  text-lg
                  font-black
                  tracking-tight
                "
              >
                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-xl
                    bg-emerald-600
                    text-white
                  "
                >
                  <Users size={18} />
                </div>

                Jumuiya
              </div>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                RevelaCode ecosystem
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setMobileOpen(false)
              }
              className="
                rounded-xl
                p-2
                text-slate-400
                hover:bg-slate-100
                hover:text-slate-900
                dark:hover:bg-white/5
                dark:hover:text-white
                lg:hidden
              "
            >
              <X size={19} />
            </button>
          </div>


          {/* =================================================
              NAVIGATION
          ================================================= */}

          <div
            className="
              flex-1
              overflow-y-auto
              p-4
            "
          >

            {/* Home */}

            <button
              type="button"
              onClick={() =>
                navigate("home")
              }
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-sm
                font-medium
                transition
                hover:bg-slate-100
                dark:hover:bg-white/5
              "
            >
              <Home size={18} />

              Home
            </button>


            {/* Section */}

            <div
              className="
                mb-2
                mt-6
                px-3
                text-[11px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              Jumuiya Hubs
            </div>


            {/* Hubs */}

            <div className="space-y-1">
              {HUBS.map((hub) => {
                const Icon =
                  hub.icon;

                const active =
                  activeHub ===
                  hub.key;

                return (
                  <button
                    key={hub.key}
                    type="button"
                    onClick={() =>
                      navigate(
                        hub.key
                      )
                    }
                    className={`
                      flex
                      w-full
                      items-center
                      justify-between
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      transition
                      ${
                        active
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                      }
                    `}
                  >
                    <div
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                      "
                    >
                      <Icon
                        size={18}
                        className="shrink-0"
                      />

                      <div className="min-w-0">
                        <div
                          className="
                            text-sm
                            font-semibold
                          "
                        >
                          {hub.label}
                        </div>

                        <div
                          className={`
                            mt-0.5
                            truncate
                            text-[11px]
                            ${
                              active
                                ? "text-emerald-100"
                                : "text-slate-400"
                            }
                          `}
                        >
                          {hub.description}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      size={15}
                      className="shrink-0"
                    />
                  </button>
                );
              })}
            </div>


            {/* Wallet */}

            <div
              className="
                mb-2
                mt-6
                px-3
                text-[11px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              Shared Services
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("payments")
              }
              className="
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                px-3
                py-3
                text-left
                text-sm
                font-medium
                transition
                hover:bg-slate-100
                dark:hover:bg-white/5
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <WalletCards size={18} />

                Wallet
              </div>

              <ChevronRight
                size={15}
              />
            </button>


            {/* Marketplace */}

            <button
              type="button"
              onClick={() =>
                navigate("marketplace")
              }
              className="
                mt-1
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                px-3
                py-3
                text-left
                text-sm
                font-medium
                transition
                hover:bg-slate-100
                dark:hover:bg-white/5
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <ShoppingCart size={18} />

                Marketplace
              </div>

              <ChevronRight
                size={15}
              />
            </button>


            {/* Info panel */}

            <div
              className="
                mt-6
                rounded-2xl
                border
                border-emerald-100
                bg-emerald-50
                p-4
                dark:border-emerald-900/40
                dark:bg-emerald-950/20
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-emerald-900
                  dark:text-emerald-300
                "
              >
                <Users size={17} />

                One identity
              </div>

              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Your RevelaCode account
                connects the entire
                Jumuiya ecosystem.
              </p>
            </div>
          </div>


          {/* =================================================
              USER
          ================================================= */}

          <div
            className="
              border-t
              border-slate-200
              p-4
              dark:border-white/10
            "
          >
            <button
              type="button"
              onClick={() =>
                navigate("profile")
              }
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-2xl
                bg-slate-50
                p-3
                text-left
                transition
                hover:bg-slate-100
                dark:bg-white/5
                dark:hover:bg-white/10
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
                  rounded-full
                  bg-slate-900
                  text-sm
                  font-black
                  text-white
                  dark:bg-white
                  dark:text-slate-900
                "
              >
                {initials}
              </div>

              <div className="min-w-0">
                <div
                  className="
                    truncate
                    text-sm
                    font-semibold
                  "
                >
                  {fullName}
                </div>

                <div
                  className="
                    mt-0.5
                    truncate
                    text-xs
                    text-slate-400
                  "
                >
                  Connected account
                </div>
              </div>

              <ChevronRight
                size={15}
                className="
                  ml-auto
                  shrink-0
                  text-slate-400
                "
              />
            </button>
          </div>
        </div>
      </aside>


      {/* ===================================================
          MAIN
      =================================================== */}

      <div className="lg:pl-72">

        {/* =================================================
            TOP BAR
        ================================================= */}

        <header
          className="
            sticky
            top-0
            z-30
            border-b
            border-slate-200
            bg-white/90
            backdrop-blur-xl
            dark:border-white/10
            dark:bg-slate-950/90
          "
        >
          <div
            className="
              flex
              min-h-16
              items-center
              justify-between
              gap-4
              px-4
              sm:px-6
              lg:px-8
            "
          >

            {/* Left */}

            <div
              className="
                flex
                min-w-0
                items-center
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  setMobileOpen(true)
                }
                className="
                  rounded-xl
                  p-2
                  hover:bg-slate-100
                  dark:hover:bg-white/5
                  lg:hidden
                "
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <h1
                  className="
                    truncate
                    text-lg
                    font-black
                    tracking-tight
                    sm:text-xl
                  "
                >
                  {title}
                </h1>

                <p
                  className="
                    hidden
                    truncate
                    text-xs
                    text-slate-400
                    sm:block
                  "
                >
                  {subtitle}
                </p>
              </div>
            </div>


            {/* Right */}

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <button
                type="button"
                className="
                  relative
                  rounded-xl
                  p-2.5
                  transition
                  hover:bg-slate-100
                  dark:hover:bg-white/5
                "
                aria-label="Notifications"
              >
                <Bell size={18} />

                <span
                  className="
                    absolute
                    right-2
                    top-2
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-red-500
                  "
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("profile")
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  px-2
                  py-1.5
                  text-sm
                  font-medium
                  dark:border-white/10
                "
              >
                <div
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-full
                    bg-emerald-600
                    text-xs
                    font-bold
                    text-white
                  "
                >
                  {initials}
                </div>

                <span
                  className="
                    hidden
                    max-w-[140px]
                    truncate
                    sm:block
                  "
                >
                  {fullName}
                </span>
              </button>
            </div>
          </div>
        </header>


        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main
          className="
            px-4
            py-5
            sm:px-6
            sm:py-6
            lg:px-8
            lg:py-8
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-7xl
            "
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}