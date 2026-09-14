import React, { useMemo, useState } from "react";

import {
  ArrowLeft,
  Briefcase,
  Building2,
  ChevronRight,
  Compass,
  GraduationCap,
  Leaf,
  MapPin,
  Search,
  Sparkles,
  Store,
  Users,
  UserPlus,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";

// ============================================================
// DISCOVER CATEGORIES
// ============================================================

const DISCOVER_CATEGORIES = [
  {
    key: "people",
    label: "People",
    description: "Find members and connect.",
    icon: Users,
  },
  {
    key: "businesses",
    label: "Businesses",
    description: "Explore businesses and services.",
    icon: Briefcase,
  },
  {
    key: "farms",
    label: "Farms",
    description: "Discover farmers and agriculture.",
    icon: Leaf,
  },
  {
    key: "schools",
    label: "Schools",
    description: "Discover education communities.",
    icon: GraduationCap,
  },
  {
    key: "groups",
    label: "Groups",
    description: "Join communities around interests.",
    icon: Users,
  },
  {
    key: "opportunities",
    label: "Opportunities",
    description: "Jobs, business and learning.",
    icon: Sparkles,
  },
];

// ============================================================
// SAMPLE DISCOVER STRUCTURE
// ============================================================

const FEATURED_ITEMS = [
  {
    id: "business-1",
    type: "businesses",
    name: "Mombasa Digital Solutions",
    description:
      "Technology services, websites and digital business support.",
    location: "Mombasa",
    icon: Briefcase,
    tag: "Biashara",
  },
  {
    id: "farm-1",
    type: "farms",
    name: "Coastal Green Farm",
    description:
      "Fresh vegetables and farm produce for local buyers.",
    location: "Kilifi",
    icon: Leaf,
    tag: "Shamba",
  },
  {
    id: "school-1",
    type: "schools",
    name: "Jumuiya Learning Community",
    description:
      "A learning community connecting students, teachers and parents.",
    location: "Kenya",
    icon: GraduationCap,
    tag: "Elimu",
  },
  {
    id: "group-1",
    type: "groups",
    name: "Kenya Small Business Network",
    description:
      "Business owners sharing opportunities, ideas and support.",
    location: "Kenya",
    icon: Users,
    tag: "Community",
  },
];

// ============================================================
// HELPERS
// ============================================================

function getDisplayName(user) {
  if (!user) return "Member";

  return (
    user.name ||
    user.full_name ||
    user.fullName ||
    user.username ||
    user.email?.split("@")[0] ||
    "Member"
  );
}

function getInitials(name) {
  if (!name) return "M";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[
    parts.length - 1
  ].charAt(0)}`.toUpperCase();
}

// ============================================================
// COMPONENT
// ============================================================

export default function CommunityDiscover({
  onNavigate,
}) {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("people");

  const displayName = useMemo(
    () => getDisplayName(user),
    [user]
  );

  const initials = useMemo(
    () => getInitials(displayName),
    [displayName]
  );

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = (destination) => {
    if (typeof onNavigate === "function") {
      onNavigate(destination);
      return;
    }

    console.warn(
      "Community navigation requested:",
      destination
    );
  };

  // ==========================================================
  // FILTERED FEATURED ITEMS
  // ==========================================================

  const filteredFeatured = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    return FEATURED_ITEMS.filter((item) => {
      const categoryMatches =
        activeCategory === "people" ||
        activeCategory === "opportunities" ||
        item.type === activeCategory;

      if (!categoryMatches) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        item.name
          .toLowerCase()
          .includes(query) ||
        item.description
          .toLowerCase()
          .includes(query) ||
        item.location
          .toLowerCase()
          .includes(query) ||
        item.tag
          .toLowerCase()
          .includes(query)
      );
    });
  }, [activeCategory, searchTerm]);

  const selectedCategory =
    DISCOVER_CATEGORIES.find(
      (item) => item.key === activeCategory
    ) || DISCOVER_CATEGORIES[0];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <JumuiyaDashboardShell
      title="Discover"
      subtitle="Find people, communities and opportunities across Jumuiya."
      activeHub="community"
      user={user}
      onNavigate={onNavigate}
    >
      <div className="space-y-6 pb-10">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-emerald-200/70
            bg-gradient-to-br
            from-emerald-600
            via-emerald-600
            to-teal-700
            px-5
            py-6
            text-white
            shadow-xl
            shadow-emerald-900/10
            sm:px-7
            sm:py-8
            dark:border-emerald-500/20
          "
        >
          <div
            className="
              flex
              flex-col
              gap-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-white/15
                    backdrop-blur
                  "
                >
                  <Compass size={20} />
                </div>

                <span
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    text-emerald-50/90
                  "
                >
                  Community Discover
                </span>
              </div>

              <h1
                className="
                  mt-4
                  text-2xl
                  font-black
                  tracking-tight
                  sm:text-3xl
                "
              >
                Find your people and opportunities.
              </h1>

              <p
                className="
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-emerald-50/90
                  sm:text-base
                "
              >
                Explore the people, businesses,
                farms, schools and communities that
                make up the Jumuiya ecosystem.
              </p>
            </div>

            <div
              className="
                hidden
                h-24
                w-24
                shrink-0
                items-center
                justify-center
                rounded-[30px]
                border
                border-white/20
                bg-white/10
                text-3xl
                font-black
                backdrop-blur
                lg:flex
              "
            >
              {initials}
            </div>
          </div>
        </section>

        {/* ====================================================
            SEARCH
        ==================================================== */}

        <section
          className="
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
          "
        >
          <div className="relative">
            <Search
              size={18}
              className="
                pointer-events-none
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search people, businesses, farms, schools, groups..."
              className="
                w-full
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                py-3.5
                pl-11
                pr-11
                text-sm
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-emerald-500
                focus:bg-white
                focus:ring-4
                focus:ring-emerald-500/10
                dark:border-white/10
                dark:bg-slate-950
                dark:text-white
                dark:focus:bg-slate-950
              "
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() =>
                  setSearchTerm("")
                }
                className="
                  absolute
                  right-3
                  top-1/2
                  flex
                  h-8
                  w-8
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-400
                  hover:bg-slate-200
                  hover:text-slate-700
                  dark:hover:bg-white/10
                  dark:hover:text-white
                "
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </section>

        {/* ====================================================
            DISCOVERY CATEGORIES
        ==================================================== */}

        <section>
          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:grid-cols-3
              xl:grid-cols-6
            "
          >
            {DISCOVER_CATEGORIES.map(
              (category) => {
                const Icon = category.icon;

                const active =
                  activeCategory ===
                  category.key;

                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() =>
                      setActiveCategory(
                        category.key
                      )
                    }
                    className={`
                      group
                      rounded-2xl
                      border
                      p-4
                      text-left
                      transition
                      ${
                        active
                          ? "border-emerald-500 bg-emerald-50 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-950/20"
                          : "border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm dark:border-white/10 dark:bg-slate-900 dark:hover:bg-white/[0.025]"
                      }
                    `}
                  >
                    <div
                      className={`
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        ${
                          active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                        }
                      `}
                    >
                      <Icon size={18} />
                    </div>

                    <div
                      className={`
                        mt-3
                        text-xs
                        font-black
                        ${
                          active
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-slate-800 dark:text-slate-100"
                        }
                      `}
                    >
                      {category.label}
                    </div>

                    <p
                      className="
                        mt-1
                        text-[10px]
                        leading-4
                        text-slate-400
                      "
                    >
                      {category.description}
                    </p>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* ====================================================
            MAIN CONTENT
        ==================================================== */}

        <section
          className="
            grid
            gap-6
            xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]
          "
        >

          {/* ==================================================
              RESULTS / DISCOVERY
          ================================================== */}

          <div
            className="
              rounded-[26px]
              border
              border-slate-200
              bg-white
              shadow-sm
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                flex-col
                gap-3
                border-b
                border-slate-100
                px-5
                py-5
                sm:flex-row
                sm:items-center
                sm:justify-between
                dark:border-white/5
              "
            >
              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-sm
                    font-black
                    text-slate-900
                    dark:text-white
                  "
                >
                  {React.createElement(
                    selectedCategory.icon,
                    {
                      size: 17,
                      className:
                        "text-emerald-600",
                    }
                  )}

                  {selectedCategory.label}
                </div>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  {searchTerm
                    ? `Results matching "${searchTerm}"`
                    : selectedCategory.description}
                </p>
              </div>

              <span
                className="
                  text-[10px]
                  font-bold
                  text-slate-400
                "
              >
                Discover more
              </span>
            </div>

            <div className="p-5">
              {filteredFeatured.length ===
              0 ? (
                <div
                  className="
                    flex
                    min-h-[280px]
                    flex-col
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-200
                    px-6
                    text-center
                    dark:border-white/10
                  "
                >
                  <div
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-slate-100
                      text-slate-400
                      dark:bg-slate-800
                    "
                  >
                    <Search size={22} />
                  </div>

                  <h3
                    className="
                      mt-4
                      text-sm
                      font-black
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Nothing found yet
                  </h3>

                  <p
                    className="
                      mt-1
                      max-w-sm
                      text-xs
                      leading-5
                      text-slate-400
                    "
                  >
                    Try a different search or
                    explore another discovery
                    category.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setSearchTerm("")
                    }
                    className="
                      mt-4
                      rounded-xl
                      bg-emerald-600
                      px-4
                      py-2.5
                      text-xs
                      font-bold
                      text-white
                      hover:bg-emerald-700
                    "
                  >
                    Reset search
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFeatured.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            navigate(
                              `community-discover-${item.type}-${item.id}`
                            )
                          }
                          className="
                            group
                            flex
                            w-full
                            items-start
                            gap-4
                            rounded-2xl
                            border
                            border-slate-100
                            bg-slate-50/60
                            p-4
                            text-left
                            transition
                            hover:border-emerald-100
                            hover:bg-white
                            dark:border-white/5
                            dark:bg-white/[0.025]
                            dark:hover:bg-white/[0.04]
                          "
                        >
                          <div
                            className="
                              flex
                              h-12
                              w-12
                              shrink-0
                              items-center
                              justify-center
                              rounded-2xl
                              bg-emerald-100
                              text-emerald-700
                              dark:bg-emerald-950/40
                              dark:text-emerald-400
                            "
                          >
                            <Icon
                              size={20}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div
                              className="
                                flex
                                flex-wrap
                                items-center
                                gap-2
                              "
                            >
                              <h3
                                className="
                                  text-sm
                                  font-black
                                  text-slate-900
                                  dark:text-white
                                "
                              >
                                {item.name}
                              </h3>

                              <span
                                className="
                                  rounded-full
                                  bg-emerald-50
                                  px-2
                                  py-1
                                  text-[9px]
                                  font-bold
                                  text-emerald-700
                                  dark:bg-emerald-950/30
                                  dark:text-emerald-400
                                "
                              >
                                {item.tag}
                              </span>
                            </div>

                            <p
                              className="
                                mt-1
                                text-xs
                                leading-5
                                text-slate-500
                                dark:text-slate-400
                              "
                            >
                              {item.description}
                            </p>

                            <div
                              className="
                                mt-3
                                flex
                                items-center
                                gap-1.5
                                text-[10px]
                                font-semibold
                                text-slate-400
                              "
                            >
                              <MapPin
                                size={12}
                              />
                              {item.location}
                            </div>
                          </div>

                          <ChevronRight
                            size={17}
                            className="
                              mt-1
                              shrink-0
                              text-slate-300
                              transition
                              group-hover:translate-x-0.5
                              group-hover:text-emerald-500
                              dark:text-slate-600
                            "
                          />
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              RIGHT SIDEBAR
          ================================================== */}

          <div className="space-y-5">

            {/* QUICK DISCOVERY */}

            <section
              className="
                rounded-[26px]
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                dark:border-white/10
                dark:bg-slate-900
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-black
                  text-slate-900
                  dark:text-white
                "
              >
                <Sparkles
                  size={16}
                  className="text-emerald-500"
                />
                Explore
              </div>

              <div className="mt-4 space-y-2">
                {[
                  {
                    label: "People around you",
                    icon: Users,
                    target:
                      "community-discover-people",
                  },
                  {
                    label: "Nearby businesses",
                    icon: Store,
                    target:
                      "community-discover-businesses",
                  },
                  {
                    label: "Learning communities",
                    icon: GraduationCap,
                    target:
                      "community-discover-schools",
                  },
                  {
                    label: "Farming network",
                    icon: Leaf,
                    target:
                      "community-discover-farms",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        navigate(
                          item.target
                        )
                      }
                      className="
                        group
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-xl
                        border
                        border-slate-100
                        p-3
                        text-left
                        transition
                        hover:border-emerald-100
                        hover:bg-emerald-50/50
                        dark:border-white/5
                        dark:hover:bg-white/[0.025]
                      "
                    >
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-slate-100
                          text-slate-500
                          dark:bg-slate-800
                          dark:text-slate-300
                        "
                      >
                        <Icon size={16} />
                      </div>

                      <span
                        className="
                          flex-1
                          text-xs
                          font-bold
                          text-slate-700
                          dark:text-slate-200
                        "
                      >
                        {item.label}
                      </span>

                      <ChevronRight
                        size={15}
                        className="
                          text-slate-300
                          transition
                          group-hover:translate-x-0.5
                          group-hover:text-emerald-500
                        "
                      />
                    </button>
                  );
                })}
              </div>
            </section>

            {/* MEMBER CARD */}

            <section
              className="
                rounded-[26px]
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                dark:border-white/10
                dark:bg-slate-900
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-full
                    bg-emerald-100
                    text-xs
                    font-black
                    text-emerald-700
                    dark:bg-emerald-950/40
                    dark:text-emerald-400
                  "
                >
                  {initials}
                </div>

                <div className="min-w-0">
                  <div
                    className="
                      truncate
                      text-sm
                      font-black
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {displayName}
                  </div>

                  <div
                    className="
                      text-[10px]
                      text-slate-400
                    "
                  >
                    Jumuiya member
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "community-activity"
                  )
                }
                className="
                  mt-4
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-slate-100
                  px-3
                  py-3
                  text-left
                  transition
                  hover:bg-slate-50
                  dark:border-white/5
                  dark:hover:bg-white/[0.025]
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  View my activity
                </span>

                <ChevronRight
                  size={15}
                  className="text-slate-300"
                />
              </button>
            </section>

            {/* ECOSYSTEM CARD */}

            <section
              className="
                rounded-[26px]
                border
                border-emerald-100
                bg-emerald-50
                p-5
                dark:border-emerald-500/10
                dark:bg-emerald-950/15
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-black
                  text-emerald-800
                  dark:text-emerald-300
                "
              >
                <Building2 size={16} />
                One ecosystem
              </div>

              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-emerald-700/80
                  dark:text-emerald-400/80
                "
              >
                Community is the social layer
                connecting Biashara, Shamba and
                Elimu inside Jumuiya.
              </p>

              <div
                className="
                  mt-4
                  grid
                  grid-cols-3
                  gap-2
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "community-hub-biashara"
                    )
                  }
                  className="
                    rounded-xl
                    bg-white/70
                    px-2
                    py-2.5
                    text-[10px]
                    font-bold
                    text-emerald-800
                    dark:bg-slate-900/40
                    dark:text-emerald-300
                  "
                >
                  Biashara
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "community-hub-shamba"
                    )
                  }
                  className="
                    rounded-xl
                    bg-white/70
                    px-2
                    py-2.5
                    text-[10px]
                    font-bold
                    text-emerald-800
                    dark:bg-slate-900/40
                    dark:text-emerald-300
                  "
                >
                  Shamba
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "community-hub-elimu"
                    )
                  }
                  className="
                    rounded-xl
                    bg-white/70
                    px-2
                    py-2.5
                    text-[10px]
                    font-bold
                    text-emerald-800
                    dark:bg-slate-900/40
                    dark:text-emerald-300
                  "
                >
                  Elimu
                </button>
              </div>
            </section>
          </div>
        </section>

        {/* ====================================================
            MOBILE BACK
        ==================================================== */}

        <div className="flex justify-center lg:hidden">
          <button
            type="button"
            onClick={() =>
              navigate("community")
            }
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-bold
              text-slate-400
              hover:text-emerald-600
              dark:hover:text-emerald-400
            "
          >
            <ArrowLeft size={14} />
            Back to Community
          </button>
        </div>
      </div>
    </JumuiyaDashboardShell>
  );
}
