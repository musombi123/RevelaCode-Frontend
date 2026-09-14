import React, { useMemo, useState } from "react";

import {
  ArrowLeft,
  Bell,
  Briefcase,
  ChevronRight,
  GraduationCap,
  Leaf,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";

import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";

// ============================================================
// GROUP CATEGORIES
// ============================================================

const GROUP_CATEGORIES = [
  {
    value: "all",
    label: "All groups",
  },
  {
    value: "community",
    label: "Community",
  },
  {
    value: "biashara",
    label: "Biashara",
  },
  {
    value: "shamba",
    label: "Shamba",
  },
  {
    value: "elimu",
    label: "Elimu",
  },
];

// ============================================================
// SAMPLE GROUP DIRECTORY
// ============================================================
// UI-ready data only.
// Replace with API data when group endpoints are connected.
// ============================================================

const GROUPS = [
  {
    id: "grp-001",
    name: "Kenya Small Business Network",
    description:
      "Business owners sharing ideas, opportunities, services and practical support.",
    category: "biashara",
    location: "Kenya",
    members: 428,
    posts: 86,
    activeToday: 34,
    icon: Briefcase,
    featured: true,
    joined: false,
  },
  {
    id: "grp-002",
    name: "Coastal Farmers Community",
    description:
      "Farmers discussing crops, markets, seasonal planning and agricultural opportunities.",
    category: "shamba",
    location: "Coast Region",
    members: 316,
    posts: 71,
    activeToday: 27,
    icon: Leaf,
    featured: true,
    joined: true,
  },
  {
    id: "grp-003",
    name: "TUM Students Community",
    description:
      "A student community for learning, collaboration, opportunities and campus discussions.",
    category: "elimu",
    location: "Mombasa",
    members: 672,
    posts: 154,
    activeToday: 91,
    icon: GraduationCap,
    featured: true,
    joined: false,
  },
  {
    id: "grp-004",
    name: "Parents & Family Network",
    description:
      "A supportive community for parents, families and people sharing practical experiences.",
    category: "community",
    location: "Kenya",
    members: 281,
    posts: 49,
    activeToday: 18,
    icon: Users,
    featured: false,
    joined: true,
  },
  {
    id: "grp-005",
    name: "Kenya Developers Hub",
    description:
      "Developers discussing software, AI, careers, projects and technology.",
    category: "community",
    location: "Kenya",
    members: 514,
    posts: 129,
    activeToday: 63,
    icon: Users,
    featured: false,
    joined: false,
  },
  {
    id: "grp-006",
    name: "Elimu & Learning Support",
    description:
      "Students, teachers and parents sharing study resources and education opportunities.",
    category: "elimu",
    location: "Kenya",
    members: 395,
    posts: 93,
    activeToday: 48,
    icon: GraduationCap,
    featured: false,
    joined: false,
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

function formatNumber(value) {
  if (typeof value !== "number") {
    return "0";
  }

  return new Intl.NumberFormat("en-KE").format(
    value
  );
}

function formatCategory(value) {
  if (!value) return "Community";

  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

// ============================================================
// COMPONENT
// ============================================================

export default function CommunityGroups({
  onNavigate,
}) {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [joinedGroups, setJoinedGroups] =
    useState(() =>
      GROUPS
        .filter((group) => group.joined)
        .map((group) => group.id)
    );

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
  // GROUP STATE
  // ==========================================================

  const toggleMembership = (groupId) => {
    setJoinedGroups((current) => {
      if (current.includes(groupId)) {
        return current.filter(
          (id) => id !== groupId
        );
      }

      return [...current, groupId];
    });
  };

  // ==========================================================
  // FILTER GROUPS
  // ==========================================================

  const filteredGroups = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    return GROUPS.filter((group) => {
      const categoryMatches =
        selectedCategory === "all" ||
        group.category === selectedCategory;

      if (!categoryMatches) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        group.name
          .toLowerCase()
          .includes(query) ||
        group.description
          .toLowerCase()
          .includes(query) ||
        group.location
          .toLowerCase()
          .includes(query) ||
        group.category
          .toLowerCase()
          .includes(query)
      );
    });
  }, [searchTerm, selectedCategory]);

  const featuredGroups = useMemo(
    () =>
      GROUPS.filter(
        (group) => group.featured
      ),
    []
  );

  const myGroups = useMemo(
    () =>
      GROUPS.filter((group) =>
        joinedGroups.includes(
          group.id
        )
      ),
    [joinedGroups]
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <JumuiyaDashboardShell
      title="Community Groups"
      subtitle="Join communities built around shared interests and goals."
      activeHub="community"
      user={user}
      onNavigate={onNavigate}
    >
      <div className="space-y-6 pb-10">

        {/* ====================================================
            HERO
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
                  <Users size={20} />
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
                  Community Groups
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
                Find communities where you belong.
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
                Join focused communities for
                business, farming, education,
                technology, family and more.
              </p>

              <div
                className="
                  mt-5
                  flex
                  flex-col
                  gap-2
                  sm:flex-row
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "community-create-group"
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-white
                    px-4
                    py-3
                    text-xs
                    font-black
                    text-emerald-700
                    transition
                    hover:bg-emerald-50
                  "
                >
                  <Plus size={16} />
                  Create a group
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "community-discover"
                    )
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
                    px-4
                    py-3
                    text-xs
                    font-bold
                    text-white
                    backdrop-blur
                    transition
                    hover:bg-white/15
                  "
                >
                  <Sparkles size={15} />
                  Discover people
                </button>
              </div>
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
            MY GROUPS
        ==================================================== */}

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
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
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
                <Sparkles
                  size={16}
                  className="text-emerald-500"
                />
                My groups
              </div>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                Communities you've joined.
              </p>
            </div>

            <span
              className="
                text-[10px]
                font-bold
                text-slate-400
              "
            >
              {myGroups.length}{" "}
              {myGroups.length === 1
                ? "group"
                : "groups"}
            </span>
          </div>

          {myGroups.length === 0 ? (
            <div
              className="
                mt-4
                rounded-2xl
                border
                border-dashed
                border-slate-200
                px-5
                py-8
                text-center
                dark:border-white/10
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-slate-100
                  text-slate-400
                  dark:bg-slate-800
                "
              >
                <Users size={20} />
              </div>

              <p
                className="
                  mt-3
                  text-xs
                  font-bold
                  text-slate-700
                  dark:text-slate-200
                "
              >
                You haven't joined a group yet.
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  leading-5
                  text-slate-400
                "
              >
                Explore the groups below and
                join communities that interest you.
              </p>
            </div>
          ) : (
            <div
              className="
                mt-4
                grid
                gap-3
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              {myGroups.map((group) => {
                const Icon = group.icon;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `community-group-${group.id}`
                      )
                    }
                    className="
                      group
                      flex
                      items-center
                      gap-3
                      rounded-2xl
                      border
                      border-slate-100
                      bg-slate-50/60
                      p-3
                      text-left
                      transition
                      hover:border-emerald-100
                      hover:bg-white
                      dark:border-white/5
                      dark:bg-white/[0.025]
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
                        bg-emerald-100
                        text-emerald-700
                        dark:bg-emerald-950/40
                        dark:text-emerald-400
                      "
                    >
                      <Icon size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className="
                          truncate
                          text-xs
                          font-black
                          text-slate-800
                          dark:text-slate-100
                        "
                      >
                        {group.name}
                      </div>

                      <div
                        className="
                          mt-1
                          text-[10px]
                          text-slate-400
                        "
                      >
                        {formatNumber(
                          group.members
                        )}{" "}
                        members
                      </div>
                    </div>

                    <ChevronRight
                      size={15}
                      className="
                        shrink-0
                        text-slate-300
                        transition
                        group-hover:translate-x-0.5
                      "
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ====================================================
            SEARCH + FILTERS
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
          <div
            className="
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-center
            "
          >
            <div className="relative flex-1">
              <Search
                size={17}
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
                placeholder="Search groups..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  py-3.5
                  pl-11
                  pr-10
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
                    h-7
                    w-7
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-400
                    hover:bg-slate-200
                    hover:text-slate-700
                    dark:hover:bg-white/10
                    dark:hover:text-white
                  "
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              {GROUP_CATEGORIES.map(
                (category) => {
                  const active =
                    selectedCategory ===
                    category.value;

                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(
                          category.value
                        )
                      }
                      className={`
                        rounded-xl
                        px-3
                        py-2.5
                        text-xs
                        font-bold
                        transition
                        ${
                          active
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-white/5"
                        }
                      `}
                    >
                      {category.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ====================================================
            FEATURED GROUPS
        ==================================================== */}

        <section>
          <div
            className="
              mb-4
              flex
              items-end
              justify-between
              gap-3
            "
          >
            <div>
              <div
                className="
                  text-sm
                  font-black
                  text-slate-900
                  dark:text-white
                "
              >
                Featured communities
              </div>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                Communities with active
                conversations and members.
              </p>
            </div>

            <div
              className="
                hidden
                text-[10px]
                font-bold
                text-slate-400
                sm:block
              "
            >
              {featuredGroups.length} featured
            </div>
          </div>

          <div
            className="
              grid
              gap-4
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {featuredGroups.map(
              (group) => {
                const Icon = group.icon;

                const joined =
                  joinedGroups.includes(
                    group.id
                  );

                return (
                  <article
                    key={group.id}
                    className="
                      overflow-hidden
                      rounded-[24px]
                      border
                      border-slate-200
                      bg-white
                      shadow-sm
                      transition
                      hover:-translate-y-0.5
                      hover:shadow-md
                      dark:border-white/10
                      dark:bg-slate-900
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        bg-gradient-to-br
                        from-emerald-50
                        to-teal-50
                        p-5
                        dark:from-emerald-950/20
                        dark:to-teal-950/20
                      "
                    >
                      <div
                        className="
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center
                          rounded-2xl
                          bg-white
                          text-emerald-600
                          shadow-sm
                          dark:bg-slate-900
                          dark:text-emerald-400
                        "
                      >
                        <Icon size={21} />
                      </div>

                      <span
                        className="
                          rounded-full
                          bg-white/80
                          px-2.5
                          py-1
                          text-[9px]
                          font-black
                          text-emerald-700
                          dark:bg-slate-900/60
                          dark:text-emerald-400
                        "
                      >
                        {formatCategory(
                          group.category
                        )}
                      </span>
                    </div>

                    <div className="p-5">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `community-group-${group.id}`
                          )
                        }
                        className="
                          text-left
                        "
                      >
                        <h2
                          className="
                            text-sm
                            font-black
                            leading-5
                            text-slate-900
                            dark:text-white
                          "
                        >
                          {group.name}
                        </h2>

                        <p
                          className="
                            mt-2
                            line-clamp-3
                            text-xs
                            leading-5
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          {group.description}
                        </p>
                      </button>

                      <div
                        className="
                          mt-4
                          flex
                          items-center
                          gap-3
                          text-[10px]
                          text-slate-400
                        "
                      >
                        <span>
                          {formatNumber(
                            group.members
                          )}{" "}
                          members
                        </span>

                        <span>·</span>

                        <span>
                          {formatNumber(
                            group.posts
                          )}{" "}
                          posts
                        </span>
                      </div>

                      <div
                        className="
                          mt-2
                          text-[10px]
                          font-semibold
                          text-emerald-600
                          dark:text-emerald-400
                        "
                      >
                        {formatNumber(
                          group.activeToday
                        )}{" "}
                        active today
                      </div>

                      <div
                        className="
                          mt-4
                          flex
                          gap-2
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `community-group-${group.id}`
                            )
                          }
                          className="
                            flex
                            flex-1
                            items-center
                            justify-center
                            gap-1.5
                            rounded-xl
                            border
                            border-slate-200
                            px-3
                            py-2.5
                            text-xs
                            font-bold
                            text-slate-600
                            transition
                            hover:bg-slate-50
                            dark:border-white/10
                            dark:text-slate-300
                            dark:hover:bg-white/5
                          "
                        >
                          View group
                          <ChevronRight
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleMembership(
                              group.id
                            )
                          }
                          className={`
                            inline-flex
                            items-center
                            justify-center
                            gap-1.5
                            rounded-xl
                            px-4
                            py-2.5
                            text-xs
                            font-bold
                            transition
                            ${
                              joined
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }
                          `}
                        >
                          {joined ? (
                            "Joined"
                          ) : (
                            <>
                              <Plus
                                size={14}
                              />
                              Join
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>

        {/* ====================================================
            ALL GROUPS
        ==================================================== */}

        <section
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
                <Users
                  size={17}
                  className="text-emerald-600"
                />
                Explore groups
              </div>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                {filteredGroups.length} communities
                match your selection.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "community-create-group"
                )
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-emerald-600
                px-4
                py-2.5
                text-xs
                font-bold
                text-white
                transition
                hover:bg-emerald-700
              "
            >
              <Plus size={15} />
              Create group
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredGroups.length ===
            0 ? (
              <div
                className="
                  px-6
                  py-14
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
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
                  <Search size={21} />
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
                  No matching groups
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Try another search or category.
                </p>
              </div>
            ) : (
              filteredGroups.map(
                (group) => {
                  const Icon = group.icon;

                  const joined =
                    joinedGroups.includes(
                      group.id
                    );

                  return (
                    <div
                      key={group.id}
                      className="
                        flex
                        flex-col
                        gap-4
                        px-5
                        py-5
                        sm:flex-row
                        sm:items-center
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
                          bg-emerald-50
                          text-emerald-600
                          dark:bg-emerald-950/30
                          dark:text-emerald-400
                        "
                      >
                        <Icon size={20} />
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
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `community-group-${group.id}`
                              )
                            }
                            className="
                              text-left
                              text-sm
                              font-black
                              text-slate-900
                              hover:text-emerald-600
                              dark:text-white
                              dark:hover:text-emerald-400
                            "
                          >
                            {group.name}
                          </button>

                          <span
                            className="
                              rounded-full
                              bg-slate-100
                              px-2
                              py-1
                              text-[9px]
                              font-bold
                              text-slate-500
                              dark:bg-slate-800
                              dark:text-slate-400
                            "
                          >
                            {formatCategory(
                              group.category
                            )}
                          </span>
                        </div>

                        <p
                          className="
                            mt-1
                            line-clamp-2
                            text-xs
                            leading-5
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          {group.description}
                        </p>

                        <div
                          className="
                            mt-2
                            flex
                            flex-wrap
                            items-center
                            gap-3
                            text-[10px]
                            text-slate-400
                          "
                        >
                          <span>
                            {formatNumber(
                              group.members
                            )}{" "}
                            members
                          </span>

                          <span>
                            {formatNumber(
                              group.activeToday
                            )}{" "}
                            active today
                          </span>

                          <span>
                            {group.location}
                          </span>
                        </div>
                      </div>

                      <div
                        className="
                          flex
                          shrink-0
                          gap-2
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `community-group-${group.id}`
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-xl
                            border
                            border-slate-200
                            px-3
                            py-2.5
                            text-xs
                            font-bold
                            text-slate-600
                            transition
                            hover:bg-slate-50
                            dark:border-white/10
                            dark:text-slate-300
                            dark:hover:bg-white/5
                          "
                        >
                          Open
                          <ChevronRight
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleMembership(
                              group.id
                            )
                          }
                          className={`
                            rounded-xl
                            px-4
                            py-2.5
                            text-xs
                            font-bold
                            transition
                            ${
                              joined
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }
                          `}
                        >
                          {joined
                            ? "Joined"
                            : "Join"}
                        </button>
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

        {/* ====================================================
            GROUP CREATION PROMPT
        ==================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[26px]
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                flex
                items-start
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
                  rounded-2xl
                  bg-emerald-50
                  text-emerald-600
                  dark:bg-emerald-950/30
                  dark:text-emerald-400
                "
              >
                <MessageCircle size={19} />
              </div>

              <div>
                <h3
                  className="
                    text-sm
                    font-black
                    text-slate-900
                    dark:text-white
                  "
                >
                  Can't find the community you need?
                </h3>

                <p
                  className="
                    mt-1
                    max-w-xl
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  Create a focused group and bring
                  people together around a shared
                  interest, location or goal.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "community-create-group"
                )
              }
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-emerald-600
                px-5
                py-3
                text-xs
                font-bold
                text-white
                transition
                hover:bg-emerald-700
              "
            >
              <Plus size={15} />
              Create a group
            </button>
          </div>
        </section>

        {/* ====================================================
            MOBILE COMMUNITY LINKS
        ==================================================== */}

        <div
          className="
            flex
            flex-col
            items-center
            gap-3
            sm:flex-row
            sm:justify-center
          "
        >
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
            Community Home
          </button>

          <span className="hidden text-slate-300 sm:block">
            ·
          </span>

          <button
            type="button"
            onClick={() =>
              navigate(
                "community-notifications"
              )
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
            <Bell size={14} />
            Notifications
          </button>
        </div>
      </div>
    </JumuiyaDashboardShell>
  );
}
