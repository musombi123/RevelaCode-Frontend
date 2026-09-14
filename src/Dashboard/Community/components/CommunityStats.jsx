import React, { useMemo } from "react";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Heart,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

function formatNumber(value) {
  const number = Number(value) || 0;

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return number.toLocaleString();
}

function getValue(data, keys, fallback = 0) {
  for (const key of keys) {
    if (
      data &&
      data[key] !== undefined &&
      data[key] !== null
    ) {
      return data[key];
    }
  }

  return fallback;
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  trend,
  trendLabel,
  iconClassName = "",
  iconWrapperClassName = "",
}) {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200
        bg-white
        p-4
        shadow-sm
        transition
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
        dark:border-white/10
        dark:bg-slate-900
      "
    >
      {/* Decorative background */}

      <div
        className="
          pointer-events-none
          absolute
          -right-8
          -top-8
          h-24
          w-24
          rounded-full
          bg-slate-100/70
          blur-2xl
          dark:bg-white/5
        "
      />

      {/* Top row */}

      <div
        className="
          relative
          flex
          items-start
          justify-between
          gap-3
        "
      >
        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${iconWrapperClassName}
          `}
        >
          <Icon
            size={18}
            className={iconClassName}
          />
        </div>

        {trend !== undefined &&
          trend !== null && (
            <div
              className={`
                inline-flex
                items-center
                gap-1
                rounded-full
                px-2
                py-1
                text-[9px]
                font-black
                ${
                  Number(trend) >= 0
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                }
              `}
            >
              <TrendingUp
                size={10}
              />

              {Number(trend) > 0
                ? "+"
                : ""}
              {trend}%
            </div>
          )}
      </div>

      {/* Value */}

      <div className="relative mt-4">
        <p
          className="
            text-2xl
            font-black
            tracking-tight
            text-slate-900
            dark:text-white
          "
        >
          {formatNumber(value)}
        </p>

        <p
          className="
            mt-1
            text-[10px]
            font-black
            uppercase
            tracking-[0.08em]
            text-slate-400
          "
        >
          {label}
        </p>
      </div>

      {/* Description */}

      {description && (
        <p
          className="
            relative
            mt-2
            line-clamp-2
            text-[10px]
            leading-5
            text-slate-500
            dark:text-slate-400
          "
        >
          {description}
        </p>
      )}

      {/* Trend label */}

      {trendLabel && (
        <div
          className="
            relative
            mt-3
            flex
            items-center
            gap-1
            text-[9px]
            font-semibold
            text-slate-400
          "
        >
          <ArrowUpRight
            size={11}
          />

          {trendLabel}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CommunityStats({
  stats = {},
  loading = false,
  compact = false,
  onOpenActivity,
}) {
  // ==========================================================
  // NORMALIZE STATS
  // ==========================================================

  const normalized = useMemo(() => {
    return {
      members: getValue(
        stats,
        [
          "members",
          "members_count",
          "total_members",
          "community_members",
          "users",
        ]
      ),

      posts: getValue(
        stats,
        [
          "posts",
          "posts_count",
          "total_posts",
          "community_posts",
        ]
      ),

      comments: getValue(
        stats,
        [
          "comments",
          "comments_count",
          "total_comments",
        ]
      ),

      reactions: getValue(
        stats,
        [
          "reactions",
          "reactions_count",
          "likes",
          "likes_count",
          "total_reactions",
        ]
      ),

      groups: getValue(
        stats,
        [
          "groups",
          "groups_count",
          "total_groups",
          "community_groups",
        ]
      ),

      activity: getValue(
        stats,
        [
          "activity",
          "activity_count",
          "total_activity",
          "activities",
        ]
      ),

      activeToday: getValue(
        stats,
        [
          "active_today",
          "active_members_today",
          "today_active",
        ]
      ),

      postsTrend: stats?.posts_trend,
      membersTrend: stats?.members_trend,
      commentsTrend: stats?.comments_trend,
      reactionsTrend:
        stats?.reactions_trend,
    };
  }, [stats]);

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <section
        className="
          grid
          grid-cols-2
          gap-3
          lg:grid-cols-4
        "
      >
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="
                h-36
                animate-pulse
                rounded-[22px]
                border
                border-slate-200
                bg-slate-100
                dark:border-white/10
                dark:bg-slate-800
              "
            />
          )
        )}
      </section>
    );
  }

  // ==========================================================
  // COMPACT MODE
  // ==========================================================

  if (compact) {
    return (
      <section
        className="
          rounded-[22px]
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
            items-center
            justify-between
            gap-3
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-black
                uppercase
                tracking-[0.1em]
                text-slate-400
              "
            >
              Community Overview
            </p>

            <h3
              className="
                mt-1
                text-sm
                font-black
                text-slate-900
                dark:text-white
              "
            >
              Community activity
            </h3>
          </div>

          {onOpenActivity && (
            <button
              type="button"
              onClick={
                onOpenActivity
              }
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-slate-100
                text-slate-500
                transition
                hover:bg-emerald-50
                hover:text-emerald-600
                dark:bg-slate-800
                dark:hover:bg-emerald-950/30
                dark:hover:text-emerald-400
              "
              aria-label="View activity"
            >
              <ArrowUpRight
                size={15}
              />
            </button>
          )}
        </div>

        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-3
          "
        >
          <MiniStat
            icon={Users}
            label="Members"
            value={
              normalized.members
            }
          />

          <MiniStat
            icon={Activity}
            label="Activity"
            value={
              normalized.activity
            }
          />

          <MiniStat
            icon={BarChart3}
            label="Posts"
            value={
              normalized.posts
            }
          />

          <MiniStat
            icon={Heart}
            label="Reactions"
            value={
              normalized.reactions
            }
          />
        </div>
      </section>
    );
  }

  // ==========================================================
  // FULL MODE
  // ==========================================================

  return (
    <section className="space-y-4">
      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <div
            className="
              inline-flex
              items-center
              gap-1.5
              text-[9px]
              font-black
              uppercase
              tracking-[0.12em]
              text-emerald-600
              dark:text-emerald-400
            "
          >
            <Sparkles
              size={12}
            />

            Community Insights
          </div>

          <h2
            className="
              mt-1
              text-lg
              font-black
              tracking-tight
              text-slate-900
              dark:text-white
            "
          >
            Community at a glance
          </h2>

          <p
            className="
              mt-1
              max-w-xl
              text-[11px]
              leading-5
              text-slate-500
              dark:text-slate-400
            "
          >
            See how people are connecting,
            sharing ideas and participating
            across the Community Hub.
          </p>
        </div>

        {onOpenActivity && (
          <button
            type="button"
            onClick={
              onOpenActivity
            }
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3
              py-2
              text-[10px]
              font-black
              text-slate-600
              shadow-sm
              transition
              hover:border-emerald-200
              hover:text-emerald-600
              dark:border-white/10
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:text-emerald-400
            "
          >
            View activity
            <ArrowUpRight
              size={13}
            />
          </button>
        )}
      </div>

      {/* PRIMARY STATS */}

      <div
        className="
          grid
          grid-cols-2
          gap-3
          lg:grid-cols-4
        "
      >
        <StatCard
          icon={Users}
          label="Members"
          value={
            normalized.members
          }
          trend={
            normalized.membersTrend
          }
          trendLabel={
            normalized.activeToday
              ? `${formatNumber(
                  normalized.activeToday
                )} active today`
              : "Growing community"
          }
          description="People connected through the Community Hub."
          iconClassName="
            text-blue-600
            dark:text-blue-400
          "
          iconWrapperClassName="
            bg-blue-50
            dark:bg-blue-950/30
          "
        />

        <StatCard
          icon={BarChart3}
          label="Posts"
          value={
            normalized.posts
          }
          trend={
            normalized.postsTrend
          }
          trendLabel="Shared across the community"
          description="Announcements, ideas, questions and useful updates."
          iconClassName="
            text-emerald-600
            dark:text-emerald-400
          "
          iconWrapperClassName="
            bg-emerald-50
            dark:bg-emerald-950/30
          "
        />

        <StatCard
          icon={MessageCircle}
          label="Comments"
          value={
            normalized.comments
          }
          trend={
            normalized.commentsTrend
          }
          trendLabel="Conversations happening"
          description="Replies and discussions building around community posts."
          iconClassName="
            text-violet-600
            dark:text-violet-400
          "
          iconWrapperClassName="
            bg-violet-50
            dark:bg-violet-950/30
          "
        />

        <StatCard
          icon={Heart}
          label="Reactions"
          value={
            normalized.reactions
          }
          trend={
            normalized.reactionsTrend
          }
          trendLabel="Community engagement"
          description="Likes and other reactions from community members."
          iconClassName="
            text-rose-600
            dark:text-rose-400
          "
          iconWrapperClassName="
            bg-rose-50
            dark:bg-rose-950/30
          "
        />
      </div>

      {/* SECONDARY SUMMARY */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-3
        "
      >
        <SummaryCard
          icon={Users}
          label="Community Groups"
          value={
            normalized.groups
          }
          description="Spaces built around shared interests and goals."
        />

        <SummaryCard
          icon={Activity}
          label="Recent Activity"
          value={
            normalized.activity
          }
          description="Recent interactions across the Community Hub."
        />

        <SummaryCard
          icon={TrendingUp}
          label="Active Today"
          value={
            normalized.activeToday
          }
          description="Members participating in the community today."
        />
      </div>
    </section>
  );
}

// ============================================================
// MINI STAT
// ============================================================

function MiniStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        rounded-2xl
        bg-slate-50
        p-3
        dark:bg-slate-800/70
      "
    >
      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <Icon
          size={14}
          className="
            text-emerald-600
            dark:text-emerald-400
          "
        />

        <span
          className="
            text-[9px]
            font-black
            uppercase
            tracking-wide
            text-slate-400
          "
        >
          {label}
        </span>
      </div>

      <p
        className="
          mt-2
          text-lg
          font-black
          text-slate-900
          dark:text-white
        "
      >
        {formatNumber(value)}
      </p>
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-[20px]
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
          h-10
          w-10
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
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-black
            uppercase
            tracking-wide
            text-slate-400
          "
        >
          {label}
        </p>

        <p
          className="
            mt-0.5
            text-lg
            font-black
            text-slate-900
            dark:text-white
          "
        >
          {formatNumber(value)}
        </p>

        <p
          className="
            mt-0.5
            line-clamp-1
            text-[9px]
            text-slate-400
          "
        >
          {description}
        </p>
      </div>
    </div>
  );
}

