// src/Dashboard/Community/CommunityGroups.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Bell,
  Briefcase,
  Check,
  ChevronRight,
  GraduationCap,
  Leaf,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

// ============================================================
// CATEGORIES
// ============================================================

const GROUP_CATEGORIES = [
  { value: "all", label: "All groups" },
  { value: "community", label: "Community" },
  { value: "biashara", label: "Biashara" },
  { value: "shamba", label: "Shamba" },
  { value: "elimu", label: "Elimu" },
];

const CREATE_CATEGORIES = GROUP_CATEGORIES.filter(
  (category) => category.value !== "all",
);

const EMPTY_GROUP_FORM = {
  name: "",
  description: "",
  category: "community",
  location: "",
};

// ============================================================
// HELPERS
// ============================================================

function getDisplayName(user) {
  return (
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Member"
  );
}

function getInitials(name) {
  const parts = String(name || "Member")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`
    .toUpperCase();
}

function formatNumber(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-KE").format(
    Number.isFinite(number) ? number : 0,
  );
}

function formatCategory(value) {
  return String(value || "community")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getGroupIcon(category) {
  switch (category) {
    case "biashara":
      return Briefcase;
    case "shamba":
      return Leaf;
    case "elimu":
      return GraduationCap;
    default:
      return Users;
  }
}

function normalizeGroup(group) {
  if (!group || typeof group !== "object") {
    return null;
  }

  const id = group.id || group._id;

  if (!id) {
    return null;
  }

  return {
    ...group,
    id: String(id),
    name: String(group.name || "Untitled group"),
    description: String(group.description || ""),
    category: String(group.category || "community"),
    location: String(group.location || "Online"),
    members: Number(group.members ?? group.member_count ?? 0),
    posts: Number(group.posts ?? group.posts_count ?? 0),
    activeToday: Number(
      group.activeToday ?? group.active_today ?? 0,
    ),
    featured: Boolean(group.featured),
    joined: Boolean(group.joined),
  };
}

function getApiErrorMessage(error) {
  return (
    error?.message ||
    "The request failed. Please try again."
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div
      className="
        flex flex-col items-center justify-center
        rounded-3xl border border-dashed border-slate-200
        bg-white px-6 py-12 text-center
        dark:border-white/10 dark:bg-slate-900
      "
    >
      <div
        className="
          flex h-14 w-14 items-center justify-center
          rounded-2xl bg-emerald-50 text-emerald-600
          dark:bg-emerald-950/40 dark:text-emerald-400
        "
      >
        <Users size={25} />
      </div>

      <h3 className="mt-4 text-sm font-black text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="
            mt-5 inline-flex items-center gap-2 rounded-xl
            bg-emerald-600 px-4 py-3 text-xs font-bold
            text-white transition hover:bg-emerald-700
          "
        >
          <Plus size={15} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ============================================================
// GROUP CARD
// ============================================================

function GroupCard({
  group,
  busy,
  onOpen,
  onToggleMembership,
}) {
  const GroupIcon = getGroupIcon(group.category);

  return (
    <article
      className="
        flex h-full flex-col rounded-3xl border
        border-slate-200 bg-white p-5 shadow-sm
        transition hover:-translate-y-0.5 hover:shadow-md
        dark:border-white/10 dark:bg-slate-900
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="
            flex h-12 w-12 shrink-0 items-center justify-center
            rounded-2xl bg-emerald-50 text-emerald-700
            dark:bg-emerald-950/40 dark:text-emerald-400
          "
        >
          <GroupIcon size={21} />
        </div>

        {group.featured && (
          <span
            className="
              inline-flex items-center gap-1 rounded-full
              bg-amber-50 px-2.5 py-1.5 text-[10px]
              font-bold text-amber-700
              dark:bg-amber-950/30 dark:text-amber-400
            "
          >
            <Sparkles size={12} />
            Featured
          </span>
        )}
      </div>

      <div className="mt-4 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-black leading-6 text-slate-900 dark:text-white">
            {group.name}
          </h3>

          <span
            className="
              rounded-full bg-slate-100 px-2 py-1
              text-[9px] font-bold text-slate-500
              dark:bg-slate-800 dark:text-slate-400
            "
          >
            {formatCategory(group.category)}
          </span>
        </div>

        <p className="mt-2 line-clamp-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
          {group.description || "A community for people with shared interests."}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} />
            {formatNumber(group.members)} members
          </span>

          <span className="inline-flex items-center gap-1.5">
            <MessageCircle size={13} />
            {formatNumber(group.posts)} posts
          </span>

          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} />
            {group.location}
          </span>
        </div>
      </div>

      <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
        <button
          type="button"
          onClick={() => onOpen(group)}
          className="
            inline-flex min-h-10 flex-1 items-center
            justify-center gap-1.5 rounded-xl border
            border-slate-200 px-3 py-2 text-xs font-bold
            text-slate-700 transition hover:bg-slate-50
            dark:border-white/10 dark:text-slate-200
            dark:hover:bg-white/5
          "
        >
          View group
          <ChevronRight size={14} />
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => onToggleMembership(group)}
          className={`
            inline-flex min-h-10 flex-1 items-center
            justify-center gap-2 rounded-xl px-3 py-2
            text-xs font-bold transition disabled:cursor-wait
            disabled:opacity-60
            ${
              group.joined
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }
          `}
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : group.joined ? (
            <Check size={14} />
          ) : (
            <Plus size={14} />
          )}

          {busy
            ? "Saving"
            : group.joined
              ? "Joined"
              : "Join"}
        </button>
      </div>
    </article>
  );
}

// ============================================================
// CREATE GROUP MODAL
// ============================================================

function CreateGroupModal({
  saving,
  error,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_GROUP_FORM);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const succeeded = await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      location: form.location.trim(),
    });

    if (succeeded) {
      onClose();
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-[100] flex items-end justify-center
        bg-slate-950/60 p-0 backdrop-blur-sm
        sm:items-center sm:p-5
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-community-group-title"
        className="
          max-h-[92vh] w-full max-w-xl overflow-y-auto
          rounded-t-3xl bg-white p-5 shadow-2xl
          dark:bg-slate-900 sm:rounded-3xl sm:p-7
        "
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
              Community
            </p>

            <h2
              id="create-community-group-title"
              className="mt-2 text-xl font-black text-slate-900 dark:text-white"
            >
              Create a group
            </h2>

            <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
              Bring people together around a shared interest, location or goal.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close create group form"
            className="
              rounded-xl p-2 text-slate-500
              transition hover:bg-slate-100
              dark:hover:bg-white/10
            "
          >
            <X size={19} />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="community-group-name"
              className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              Group name
            </label>

            <input
              id="community-group-name"
              value={form.name}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
              required
              maxLength={100}
              placeholder="e.g. Coast Entrepreneurs Network"
              className="
                w-full rounded-xl border border-slate-200
                bg-white px-4 py-3 text-sm text-slate-900
                outline-none transition
                focus:border-emerald-500 focus:ring-2
                focus:ring-emerald-500/15
                dark:border-white/10 dark:bg-slate-950
                dark:text-white
              "
            />
          </div>

          <div>
            <label
              htmlFor="community-group-category"
              className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              Category
            </label>

            <select
              id="community-group-category"
              value={form.category}
              onChange={(event) =>
                updateField("category", event.target.value)
              }
              required
              className="
                w-full rounded-xl border border-slate-200
                bg-white px-4 py-3 text-sm text-slate-900
                outline-none focus:border-emerald-500
                dark:border-white/10 dark:bg-slate-950
                dark:text-white
              "
            >
              {CREATE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="community-group-location"
              className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              Location <span className="font-normal text-slate-400">(optional)</span>
            </label>

            <input
              id="community-group-location"
              value={form.location}
              onChange={(event) =>
                updateField("location", event.target.value)
              }
              maxLength={120}
              placeholder="e.g. Mombasa, Kenya or Online"
              className="
                w-full rounded-xl border border-slate-200
                bg-white px-4 py-3 text-sm text-slate-900
                outline-none focus:border-emerald-500
                dark:border-white/10 dark:bg-slate-950
                dark:text-white
              "
            />
          </div>

          <div>
            <label
              htmlFor="community-group-description"
              className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              Description
            </label>

            <textarea
              id="community-group-description"
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              required
              maxLength={1500}
              rows={4}
              placeholder="What is this group about, and who should join?"
              className="
                w-full resize-y rounded-xl border
                border-slate-200 bg-white px-4 py-3
                text-sm text-slate-900 outline-none
                focus:border-emerald-500 focus:ring-2
                focus:ring-emerald-500/15
                dark:border-white/10 dark:bg-slate-950
                dark:text-white
              "
            />

            <p className="mt-1 text-right text-[10px] text-slate-400">
              {form.description.length}/1500
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="
                rounded-xl border border-rose-200 bg-rose-50
                px-4 py-3 text-xs leading-5 text-rose-700
                dark:border-rose-900/50 dark:bg-rose-950/30
                dark:text-rose-300
              "
            >
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="
                flex-1 rounded-xl border border-slate-200
                px-4 py-3 text-xs font-bold text-slate-600
                transition hover:bg-slate-50
                dark:border-white/10 dark:text-slate-300
                dark:hover:bg-white/5
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                inline-flex flex-1 items-center justify-center
                gap-2 rounded-xl bg-emerald-600 px-4 py-3
                text-xs font-bold text-white transition
                hover:bg-emerald-700 disabled:opacity-60
              "
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              {saving ? "Creating..." : "Create group"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// ============================================================
// GROUP DETAILS MODAL
// ============================================================

function GroupDetailsModal({
  group,
  loading,
  error,
  busy,
  onClose,
  onToggleMembership,
}) {
  if (!group) {
    return null;
  }

  const GroupIcon = getGroupIcon(group.category);

  return (
    <div
      className="
        fixed inset-0 z-[100] flex items-end justify-center
        bg-slate-950/60 p-0 backdrop-blur-sm
        sm:items-center sm:p-5
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-group-detail-title"
        className="
          max-h-[90vh] w-full max-w-xl overflow-y-auto
          rounded-t-3xl bg-white p-5 shadow-2xl
          dark:bg-slate-900 sm:rounded-3xl sm:p-7
        "
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className="
              flex h-14 w-14 items-center justify-center
              rounded-2xl bg-emerald-50 text-emerald-700
              dark:bg-emerald-950/40 dark:text-emerald-400
            "
          >
            <GroupIcon size={25} />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close group details"
            className="
              rounded-xl p-2 text-slate-500
              transition hover:bg-slate-100
              dark:hover:bg-white/10
            "
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            {formatCategory(group.category)}
          </span>

          {group.featured && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              Featured group
            </span>
          )}
        </div>

        <h2
          id="community-group-detail-title"
          className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white"
        >
          {group.name}
        </h2>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
          {group.description || "No description has been added yet."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <Users size={17} className="text-emerald-600 dark:text-emerald-400" />
            <p className="mt-3 text-lg font-black text-slate-900 dark:text-white">
              {formatNumber(group.members)}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Members
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <MapPin size={17} className="text-emerald-600 dark:text-emerald-400" />
            <p className="mt-3 break-words text-sm font-black text-slate-900 dark:text-white">
              {group.location}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Location
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="
              mt-4 rounded-xl border border-rose-200
              bg-rose-50 px-4 py-3 text-xs leading-5
              text-rose-700 dark:border-rose-900/50
              dark:bg-rose-950/30 dark:text-rose-300
            "
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onToggleMembership(group)}
            disabled={busy || loading}
            className={`
              inline-flex min-h-12 flex-1 items-center
              justify-center gap-2 rounded-xl px-4 py-3
              text-xs font-bold transition disabled:opacity-60
              ${
                group.joined
                  ? "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }
            `}
          >
            {busy || loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : group.joined ? (
              <Check size={15} />
            ) : (
              <Plus size={15} />
            )}

            {busy
              ? "Saving..."
              : group.joined
                ? "Leave group"
                : "Join group"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="
              min-h-12 rounded-xl border border-slate-200
              px-5 py-3 text-xs font-bold text-slate-600
              transition hover:bg-slate-50
              dark:border-white/10 dark:text-slate-300
              dark:hover:bg-white/5
            "
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CommunityGroups({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getCommunityGroups,
    getCommunityGroup,
    createCommunityGroup,
    joinCommunityGroup,
    leaveCommunityGroup,
  } = useJumuiyaApi();

  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenError, setScreenError] = useState("");
  const [notice, setNotice] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [activeGroup, setActiveGroup] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [busyGroupId, setBusyGroupId] = useState("");

  const hasLoadedRef = useRef(false);

  const displayName = useMemo(
    () => getDisplayName(user),
    [user],
  );

  const initials = useMemo(
    () => getInitials(displayName),
    [displayName],
  );

  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  const navigate = useCallback(
    (destination) => {
      if (typeof onNavigate === "function") {
        onNavigate(destination);
      }
    },
    [onNavigate],
  );

  // ----------------------------------------------------------
  // FETCH GROUPS FROM THE BACKEND
  // ----------------------------------------------------------

  const loadGroups = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setScreenError("");

      try {
        const result = await getCommunityGroups({
          category: selectedCategory,
          search: searchTerm,
          limit: 100,
        });

        const rows = Array.isArray(result?.groups)
          ? result.groups
          : Array.isArray(result)
            ? result
            : [];

        setGroups(
          rows
            .map(normalizeGroup)
            .filter(Boolean),
        );

        hasLoadedRef.current = true;
      } catch (error) {
        setScreenError(getApiErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      getCommunityGroups,
      selectedCategory,
      searchTerm,
    ],
  );

  // Debounce search input so every keystroke does not create
  // an immediate backend request.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadGroups({
        quiet: hasLoadedRef.current,
      });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadGroups]);

  // ----------------------------------------------------------
  // FETCH ONE GROUP'S LATEST DETAILS
  // ----------------------------------------------------------

  const handleOpenGroup = useCallback(
    async (group) => {
      setActiveGroup(group);
      setDetailError("");
      setDetailLoading(true);

      try {
        const result = await getCommunityGroup(group.id);
        const latest = normalizeGroup(
          result?.group || result,
        );

        if (latest) {
          setActiveGroup(latest);
        }
      } catch (error) {
        setDetailError(getApiErrorMessage(error));
      } finally {
        setDetailLoading(false);
      }
    },
    [getCommunityGroup],
  );

  // ----------------------------------------------------------
  // JOIN OR LEAVE VIA THE BACKEND
  // ----------------------------------------------------------

  const handleToggleMembership = useCallback(
    async (group) => {
      const groupId = String(group.id);

      if (!groupId || busyGroupId) {
        return;
      }

      setBusyGroupId(groupId);
      setScreenError("");
      setDetailError("");

      try {
        const result = group.joined
          ? await leaveCommunityGroup(groupId)
          : await joinCommunityGroup(groupId);

        const updated = normalizeGroup(
          result?.group || result,
        );

        if (updated) {
          setGroups((current) =>
            current.map((item) =>
              item.id === groupId ? updated : item,
            ),
          );

          setActiveGroup((current) =>
            current?.id === groupId ? updated : current,
          );

          setNotice(
            updated.joined
              ? `You joined ${updated.name}.`
              : `You left ${updated.name}.`,
          );
        }

        await loadGroups({ quiet: true });
      } catch (error) {
        const message = getApiErrorMessage(error);

        if (activeGroup?.id === groupId) {
          setDetailError(message);
        } else {
          setScreenError(message);
        }
      } finally {
        setBusyGroupId("");
      }
    },
    [
      activeGroup,
      busyGroupId,
      joinCommunityGroup,
      leaveCommunityGroup,
      loadGroups,
    ],
  );

  // ----------------------------------------------------------
  // CREATE GROUP VIA THE BACKEND
  // ----------------------------------------------------------

  const handleCreateGroup = useCallback(
    async (form) => {
      setCreating(true);
      setCreateError("");
      setScreenError("");

      try {
        const result = await createCommunityGroup(form);
        const createdGroup = normalizeGroup(
          result?.group || result,
        );

        if (!createdGroup) {
          throw new Error(
            "The server created no readable group response.",
          );
        }

        setCreateOpen(false);
        setNotice(
          `Your group "${createdGroup.name}" was created.`,
        );
        setActiveGroup(createdGroup);
        setDetailError("");

        // The backend automatically makes the creator a member.
        await loadGroups({ quiet: true });

        return true;
      } catch (error) {
        setCreateError(getApiErrorMessage(error));
        return false;
      } finally {
        setCreating(false);
      }
    },
    [
      createCommunityGroup,
      loadGroups,
    ],
  );

  // ----------------------------------------------------------
  // VIEW DATA
  // ----------------------------------------------------------

  const myGroups = useMemo(
    () => groups.filter((group) => group.joined),
    [groups],
  );

  const discoverGroups = useMemo(
    () => groups.filter((group) => !group.joined),
    [groups],
  );

  const featuredGroups = useMemo(
    () => discoverGroups.filter((group) => group.featured),
    [discoverGroups],
  );

  const remainingGroups = useMemo(
    () => discoverGroups.filter((group) => !group.featured),
    [discoverGroups],
  );

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <>
      <div className="space-y-6 pb-10">
        {/* HERO */}

        <section
          className="
            overflow-hidden rounded-[28px]
            border border-emerald-200/70
            bg-gradient-to-br from-emerald-600
            via-emerald-600 to-teal-700
            px-5 py-6 text-white shadow-xl
            shadow-emerald-900/10
            dark:border-emerald-500/20
            sm:px-7 sm:py-8
          "
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <Users size={21} />
                </div>

                <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-50/90">
                  Community Groups
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Find communities where you belong.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/90">
                Connect with people, exchange knowledge and
                build something meaningful together across
                RevelaCode and Jumuiya.
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setCreateError("");
                    setCreateOpen(true);
                  }}
                  className="
                    inline-flex min-h-11 items-center
                    justify-center gap-2 rounded-xl
                    bg-white px-4 py-3 text-xs
                    font-black text-emerald-700
                    transition hover:bg-emerald-50
                  "
                >
                  <Plus size={16} />
                  Create a group
                </button>

                <button
                  type="button"
                  onClick={() => navigate("community-discover")}
                  className="
                    inline-flex min-h-11 items-center
                    justify-center gap-2 rounded-xl
                    border border-white/20 bg-white/10
                    px-4 py-3 text-xs font-bold
                    text-white transition hover:bg-white/15
                  "
                >
                  <Sparkles size={15} />
                  Discover people
                </button>
              </div>
            </div>

            <div
              className="
                hidden h-24 w-24 shrink-0
                items-center justify-center rounded-[30px]
                border border-white/20 bg-white/10
                text-3xl font-black lg:flex
              "
              aria-label={`Signed-in user initials ${initials}`}
            >
              {initials}
            </div>
          </div>
        </section>

        {/* SUMMARY */}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Groups available",
              value: formatNumber(groups.length),
              icon: Users,
            },
            {
              label: "Your memberships",
              value: formatNumber(myGroups.length),
              icon: Check,
            },
            {
              label: "Categories",
              value: formatNumber(
                new Set(groups.map((group) => group.category)).size,
              ),
              icon: Sparkles,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="
                  flex items-center gap-4 rounded-2xl
                  border border-slate-200 bg-white p-4
                  dark:border-white/10 dark:bg-slate-900
                "
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Icon size={18} />
                </div>

                <div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* SEARCH AND FILTERS */}

        <section
          className="
            rounded-3xl border border-slate-200
            bg-white p-4 dark:border-white/10
            dark:bg-slate-900 sm:p-5
          "
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search groups, interests or locations..."
                aria-label="Search community groups"
                className="
                  min-h-12 w-full rounded-xl border
                  border-slate-200 bg-slate-50 pl-11
                  pr-4 text-sm text-slate-900 outline-none
                  transition focus:border-emerald-500
                  focus:bg-white focus:ring-2
                  focus:ring-emerald-500/15
                  dark:border-white/10 dark:bg-slate-950
                  dark:text-white dark:focus:bg-slate-950
                "
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {GROUP_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setSelectedCategory(category.value)}
                  aria-pressed={selectedCategory === category.value}
                  className={`
                    rounded-full px-3.5 py-2.5 text-[10px]
                    font-bold transition
                    ${
                      selectedCategory === category.value
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }
                  `}
                >
                  {category.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => loadGroups({ quiet: true })}
                disabled={refreshing}
                aria-label="Refresh groups"
                className="
                  inline-flex h-10 w-10 items-center
                  justify-center rounded-xl border
                  border-slate-200 text-slate-500
                  transition hover:bg-slate-50
                  disabled:opacity-60 dark:border-white/10
                  dark:hover:bg-white/5
                "
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </section>

        {/* API STATUS */}

        {notice && (
          <div
            role="status"
            className="
              flex items-start justify-between gap-4
              rounded-2xl border border-emerald-200
              bg-emerald-50 px-4 py-3
              text-xs leading-5 text-emerald-800
              dark:border-emerald-900/50
              dark:bg-emerald-950/30 dark:text-emerald-300
            "
          >
            <span className="flex items-start gap-2">
              <Check size={15} className="mt-0.5 shrink-0" />
              {notice}
            </span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {screenError && (
          <div
            role="alert"
            className="
              flex items-start justify-between gap-3
              rounded-2xl border border-rose-200
              bg-rose-50 px-4 py-3 text-xs
              leading-5 text-rose-700
              dark:border-rose-900/50
              dark:bg-rose-950/30 dark:text-rose-300
            "
          >
            <span>{screenError}</span>

            <button
              type="button"
              onClick={() => setScreenError("")}
              aria-label="Dismiss error"
              className="shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* INITIAL LOADING */}

        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
            <Loader2 size={20} className="animate-spin text-emerald-600" />
            Loading community groups...
          </div>
        )}

        {/* MEMBERSHIPS */}

        {!loading && myGroups.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                  Your communities
                </p>

                <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  My groups
                </h2>
              </div>

              <span className="text-xs font-semibold text-slate-400">
                {formatNumber(myGroups.length)} joined
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {myGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  busy={busyGroupId === group.id}
                  onOpen={handleOpenGroup}
                  onToggleMembership={handleToggleMembership}
                />
              ))}
            </div>
          </section>
        )}

        {/* FEATURED GROUPS */}

        {!loading && featuredGroups.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Recommended
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                Featured groups
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {featuredGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  busy={busyGroupId === group.id}
                  onOpen={handleOpenGroup}
                  onToggleMembership={handleToggleMembership}
                />
              ))}
            </div>
          </section>
        )}

        {/* OTHER GROUPS */}

        {!loading && remainingGroups.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Explore
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                Discover more groups
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {remainingGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  busy={busyGroupId === group.id}
                  onOpen={handleOpenGroup}
                  onToggleMembership={handleToggleMembership}
                />
              ))}
            </div>
          </section>
        )}

        {/* EMPTY DIRECTORY */}

        {!loading && groups.length === 0 && !screenError && (
          <EmptyState
            title="No groups found"
            description={
              searchTerm.trim() || selectedCategory !== "all"
                ? "Try another search or category, or create a group for your community."
                : "There are no groups to display yet. Create the first group and invite people to join."
            }
            actionLabel="Create a group"
            onAction={() => {
              setCreateError("");
              setCreateOpen(true);
            }}
          />
        )}

        {/* NAVIGATION */}

        <div className="flex flex-col items-center gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate("community")}
            className="
              inline-flex items-center gap-2 text-xs
              font-bold text-slate-500 transition
              hover:text-emerald-600 dark:hover:text-emerald-400
            "
          >
            <ArrowLeft size={14} />
            Community Home
          </button>

          <span className="hidden text-slate-300 sm:block">·</span>

          <button
            type="button"
            onClick={() => navigate("community-notifications")}
            className="
              inline-flex items-center gap-2 text-xs
              font-bold text-slate-500 transition
              hover:text-emerald-600 dark:hover:text-emerald-400
            "
          >
            <Bell size={14} />
            Notifications
          </button>
        </div>
      </div>

      {createOpen && (
        <CreateGroupModal
          saving={creating}
          error={createError}
          onClose={() => {
            if (!creating) {
              setCreateOpen(false);
              setCreateError("");
            }
          }}
          onSubmit={handleCreateGroup}
        />
      )}

      {activeGroup && (
        <GroupDetailsModal
          group={activeGroup}
          loading={detailLoading}
          error={detailError}
          busy={busyGroupId === activeGroup.id}
          onClose={() => {
            setActiveGroup(null);
            setDetailError("");
          }}
          onToggleMembership={handleToggleMembership}
        />
      )}
    </>
  );
}