// src/Dashboard/elimu/ElimuMediaManager.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";

import { useElimuApi } from "@/services/elimuApi.jsx";

// ============================================================
// CONFIGURATION
// ============================================================

const IMAGE_MAX_BYTES = 12 * 1024 * 1024;
const VIDEO_MAX_BYTES = 80 * 1024 * 1024;

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
];

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
];

const ACCEPTED_FILES =
  ".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.m4v,.webm";

const MEDIA_CATEGORIES = [
  { value: "hero", label: "Cover / hero" },
  { value: "gallery", label: "School gallery" },
  { value: "facilities", label: "School facilities" },
  { value: "academics", label: "Academic activities" },
  { value: "sports", label: "Sports and activities" },
  { value: "events", label: "School events" },
  {
    value: "principal_message",
    label: "Principal's message",
  },
  {
    value: "virtual_tour",
    label: "Video / virtual tour",
  },
];

const INITIAL_FORM = {
  title: "",
  caption: "",
  alt_text: "",
  category: "gallery",
  is_published: false,
};

const INITIAL_EDIT_FORM = {
  title: "",
  caption: "",
  alt_text: "",
  category: "gallery",
  sort_order: 0,
};

// ============================================================
// ROLE AND ACCESS HELPERS
// ============================================================

function normalizeRole(value) {
  const role = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (
    role === "owner" ||
    role.includes("school owner") ||
    role.includes("director")
  ) {
    return "owner";
  }

  if (role.includes("principal")) {
    return "principal";
  }

  return role;
}

function getRole(access, suppliedRole) {
  return normalizeRole(
    suppliedRole ||
      access?.role ||
      access?.membership?.role ||
      access?.access?.role ||
      access?.role_label ||
      access?.membership?.role_label
  );
}

function isPublished(item) {
  const value = item?.is_published;

  return (
    value === true ||
    value === 1 ||
    String(value).toLowerCase() === "true" ||
    String(value).toLowerCase() === "published"
  );
}

// ============================================================
// API RESPONSE HELPERS
// ============================================================

function unwrapResponse(response) {
  let current = response;

  for (let index = 0; index < 6; index += 1) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      return current;
    }

    if (
      current.success === false ||
      current.ok === false
    ) {
      const error = new Error(
        current.message ||
          current.error?.message ||
          current.error ||
          "The media operation was rejected."
      );

      error.payload = current;

      throw error;
    }

    if (
      current.data &&
      typeof current.data === "object"
    ) {
      current = current.data;
      continue;
    }

    return current;
  }

  return current;
}

function getMediaItems(response) {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) {
    return data;
  }

  for (const key of [
    "items",
    "media",
    "results",
    "records",
    "documents",
  ]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function getErrorMessage(error, fallback) {
  return (
    error?.payload?.message ||
    error?.payload?.error?.message ||
    error?.message ||
    fallback
  );
}

// ============================================================
// MEDIA HELPERS
// ============================================================

function getMediaId(item) {
  return String(
    item?.id ||
      item?._id ||
      item?.media_id ||
      item?.mediaId ||
      ""
  );
}

function getMediaUrl(item) {
  return String(
    item?.url ||
      item?.secure_url ||
      item?.secureUrl ||
      item?.media_url ||
      item?.public_url ||
      item?.file_url ||
      item?.image_url ||
      item?.video_url ||
      ""
  ).trim();
}

function getMediaTitle(item) {
  return String(
    item?.title ||
      item?.filename ||
      item?.name ||
      "School media"
  );
}

function getMediaKind(item) {
  const explicitKind = String(
    item?.kind ||
      item?.media_type ||
      item?.mime_type ||
      item?.type ||
      ""
  ).toLowerCase();

  if (
    explicitKind === "video" ||
    explicitKind.startsWith("video/")
  ) {
    return "video";
  }

  if (
    explicitKind === "image" ||
    explicitKind.startsWith("image/")
  ) {
    return "image";
  }

  const format = String(item?.format || "")
    .toLowerCase()
    .replace(/^\./, "");

  if (
    VIDEO_EXTENSIONS.some(
      (extension) => extension.slice(1) === format
    )
  ) {
    return "video";
  }

  const url = getMediaUrl(item)
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  if (
    VIDEO_EXTENSIONS.some((extension) =>
      url.endsWith(extension)
    )
  ) {
    return "video";
  }

  return "image";
}

function getFileKind(file) {
  if (file?.type?.startsWith("video/")) {
    return "video";
  }

  if (file?.type?.startsWith("image/")) {
    return "image";
  }

  const filename = String(file?.name || "").toLowerCase();

  if (
    VIDEO_EXTENSIONS.some((extension) =>
      filename.endsWith(extension)
    )
  ) {
    return "video";
  }

  return "image";
}

function formatBytes(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size < 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// ============================================================
// REUSABLE UI COMPONENTS
// ============================================================

function StatusBadge({ published }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-[11px] font-semibold",
        published
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          published ? "bg-emerald-500" : "bg-amber-500",
        ].join(" ")}
      />

      {published ? "Published" : "Draft"}
    </span>
  );
}

function FieldLabel({ htmlFor, children, hint }) {
  return (
    <div className="mb-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        {children}
      </label>

      {hint && (
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function FormInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required = false,
  hint,
  disabled = false,
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>

      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </div>
  );
}

function FormTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
  hint,
  disabled = false,
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>

      <textarea
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </div>
  );
}

function Notice({
  type = "error",
  children,
  onDismiss,
}) {
  if (!children) {
    return null;
  }

  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
      : type === "info"
        ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"
        : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200";

  const Icon =
    type === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${styles}`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />

      <div className="min-w-0 flex-1">
        {children}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function MediaFallback({ kind = "image" }) {
  const Icon = kind === "video" ? Video : ImageIcon;

  return (
    <div className="flex h-full min-h-36 flex-col items-center justify-center gap-2 bg-slate-100 px-5 text-center text-slate-400 dark:bg-slate-900">
      <Icon size={34} strokeWidth={1.5} />

      <span className="text-xs">
        Media preview unavailable
      </span>
    </div>
  );
}

function MediaPreview({ item, className = "" }) {
  const kind = getMediaKind(item);
  const url = getMediaUrl(item);
  const title = getMediaTitle(item);

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  return (
    <div
      className={[
        "relative flex aspect-[4/3] items-center justify-center overflow-hidden",
        "bg-slate-100 dark:bg-slate-900",
        className,
      ].join(" ")}
    >
      {!url || failed ? (
        <MediaFallback kind={kind} />
      ) : kind === "video" ? (
        <video
          src={url}
          controls
          preload="metadata"
          playsInline
          aria-label={title}
          onError={() => setFailed(true)}
          className="h-full w-full bg-slate-950 object-contain"
        >
          Your browser does not support video playback.
        </video>
      ) : (
        <img
          src={url}
          alt={item?.alt_text || title}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="aspect-[4/3] animate-pulse bg-slate-100 dark:bg-slate-900" />

      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
        <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
      </div>
    </div>
  );
}

// ============================================================
// MAIN MEDIA MANAGER
// ============================================================

export default function ElimuMediaManager({
  access,
  school,
  role: suppliedRole,
  onNavigate,
}) {
  const api = useElimuApi();

  const role = getRole(access, suppliedRole);

  const canManage =
    role === "owner" || role === "principal";

  const apiRef = useRef(api);
  apiRef.current = api;

  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [busyId, setBusyId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [publicationFilter, setPublicationFilter] =
    useState("all");

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editForm, setEditForm] = useState({
    ...INITIAL_EDIT_FORM,
  });

  const schoolName =
    school?.name ||
    school?.school_name ||
    school?.institution_name ||
    "Your school";

  const schoolSlug =
    school?.public_slug ||
    school?.school_slug ||
    school?.website_slug ||
    school?.slug ||
    "";

  // ----------------------------------------------------------
  // Object URL management
  // ----------------------------------------------------------

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  // ----------------------------------------------------------
  // Load media library
  // ----------------------------------------------------------

  const loadMedia = useCallback(
    async ({ silent = false } = {}) => {
      if (!canManage) {
        setItems([]);
        setLoading(false);
        setError(
          "Only the school owner or an authorized principal can manage school media."
        );
        return;
      }

      setLoading(true);
      setError("");

      try {
        const request = apiRef.current?.getManagedMedia;

        if (typeof request !== "function") {
          throw new Error(
            "The media-list API method is missing. Add getManagedMedia to src/services/elimuApi.jsx."
          );
        }

        const response = await request();
        const list = getMediaItems(response);

        setItems(list);
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "School media could not be loaded. Check your connection and permissions."
          )
        );

        if (!silent) {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [canManage]
  );

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  // ----------------------------------------------------------
  // Upload form helpers
  // ----------------------------------------------------------

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setError("");
    setSuccess("");

    if (!file) {
      return;
    }

    const filename = file.name.toLowerCase();

    const isImage = IMAGE_EXTENSIONS.some((extension) =>
      filename.endsWith(extension)
    );

    const isVideo = VIDEO_EXTENSIONS.some((extension) =>
      filename.endsWith(extension)
    );

    if (!isImage && !isVideo) {
      setError(
        "Unsupported file format. Choose JPG, PNG, WEBP, GIF, MP4, MOV, M4V or WEBM."
      );

      event.target.value = "";
      return;
    }

    const maxBytes = isImage
      ? IMAGE_MAX_BYTES
      : VIDEO_MAX_BYTES;

    if (file.size > maxBytes) {
      setError(
        `${isImage ? "Images" : "Videos"} must be no larger than ${
          isImage ? "12 MB" : "80 MB"
        }.`
      );

      event.target.value = "";
      return;
    }

    if (file.size === 0) {
      setError("The selected file is empty.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const inferredKind = isVideo ? "video" : "image";

    setForm((current) => ({
      ...current,

      title:
        current.title ||
        file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[_-]+/g, " "),

      category:
        inferredKind === "video"
          ? "virtual_tour"
          : current.category === "virtual_tour"
            ? "gallery"
            : current.category,

      alt_text:
        inferredKind === "image" ? current.alt_text : "",
    }));
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setForm({ ...INITIAL_FORM });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ----------------------------------------------------------
  // Upload media
  // ----------------------------------------------------------

  const submitUpload = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!canManage) {
      setError("Your role cannot upload school media.");
      return;
    }

    if (!selectedFile) {
      setError("Choose an image or video before uploading.");
      return;
    }

    const title = form.title.trim();

    if (!title) {
      setError("Enter a title for the media.");
      return;
    }

    const uploadRequest =
      apiRef.current?.uploadSchoolMedia;

    if (typeof uploadRequest !== "function") {
      setError(
        "The media-upload API method is missing. Add uploadSchoolMedia to src/services/elimuApi.jsx."
      );
      return;
    }

    const formData = new FormData();

    formData.append("file", selectedFile);
    formData.append("title", title);
    formData.append("caption", form.caption.trim());
    formData.append("alt_text", form.alt_text.trim());
    formData.append("category", form.category);

    formData.append(
      "is_published",
      form.is_published ? "true" : "false"
    );

    setUploading(true);

    try {
      await uploadRequest(formData);

      setSuccess(
        form.is_published
          ? "Media uploaded successfully. Its final publication status is controlled by the backend."
          : "Media uploaded successfully and saved as a draft."
      );

      resetUploadForm();

      await loadMedia({ silent: true });
    } catch (uploadError) {
      setError(
        getErrorMessage(
          uploadError,
          "The file could not be uploaded. Check your storage configuration and try again."
        )
      );
    } finally {
      setUploading(false);
    }
  };

  // ----------------------------------------------------------
  // Editing helpers
  // ----------------------------------------------------------

  const startEditing = (item) => {
    const id = getMediaId(item);

    if (!id) {
      setError("This media item has no valid ID.");
      return;
    }

    setError("");
    setSuccess("");
    setEditingId(id);

    setEditForm({
      title: getMediaTitle(item),
      caption: String(item?.caption || ""),
      alt_text: String(item?.alt_text || ""),
      category: String(item?.category || "gallery"),

      sort_order:
        Number.isInteger(Number(item?.sort_order)) &&
        Number(item?.sort_order) >= 0
          ? Number(item.sort_order)
          : 0,
    });
  };

  const cancelEditing = () => {
    setEditingId("");
    setEditForm({ ...INITIAL_EDIT_FORM });
  };

  // ----------------------------------------------------------
  // Save metadata changes
  // ----------------------------------------------------------

  const saveEdit = async (event) => {
    event.preventDefault();

    const id = editingId;

    if (!id) {
      return;
    }

    if (!editForm.title.trim()) {
      setError("A media title is required.");
      return;
    }

    const sortOrder = Number(editForm.sort_order);

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > 9999
    ) {
      setError(
        "Display order must be a whole number between 0 and 9999."
      );
      return;
    }

    const updateRequest =
      apiRef.current?.updateSchoolMedia;

    if (typeof updateRequest !== "function") {
      setError(
        "The update API method is missing from src/services/elimuApi.jsx."
      );
      return;
    }

    setError("");
    setSuccess("");
    setBusyId(id);

    try {
      await updateRequest(id, {
        title: editForm.title.trim(),
        caption: editForm.caption.trim(),
        alt_text: editForm.alt_text.trim(),
        category: editForm.category,
        sort_order: sortOrder,
      });

      setSuccess("Media details updated successfully.");

      cancelEditing();

      await loadMedia({ silent: true });
    } catch (updateError) {
      setError(
        getErrorMessage(
          updateError,
          "Media details could not be updated."
        )
      );
    } finally {
      setBusyId("");
    }
  };

  // ----------------------------------------------------------
  // Publish / unpublish
  // ----------------------------------------------------------

  const togglePublication = async (item) => {
    const id = getMediaId(item);

    if (!id) {
      setError("This media item has no valid ID.");
      return;
    }

    const updateRequest =
      apiRef.current?.updateSchoolMedia;

    if (typeof updateRequest !== "function") {
      setError(
        "The publication API method is missing from src/services/elimuApi.jsx."
      );
      return;
    }

    const nextStatus = !isPublished(item);

    setError("");
    setSuccess("");
    setBusyId(id);

    try {
      await updateRequest(id, {
        is_published: nextStatus,
      });

      setSuccess(
        nextStatus
          ? "Publication status updated successfully."
          : "Media unpublished successfully."
      );

      await loadMedia({ silent: true });
    } catch (updateError) {
      setError(
        getErrorMessage(
          updateError,
          "The publication status could not be changed."
        )
      );
    } finally {
      setBusyId("");
    }
  };

  // ----------------------------------------------------------
  // Delete media
  // ----------------------------------------------------------

  const deleteMedia = async (item) => {
    const id = getMediaId(item);

    if (!id) {
      setError("This media item has no valid ID.");
      return;
    }

    const deleteRequest =
      apiRef.current?.deleteSchoolMedia;

    if (typeof deleteRequest !== "function") {
      setError(
        "The delete API method is missing from src/services/elimuApi.jsx."
      );
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      await deleteRequest(id);

      setSuccess("Media deleted successfully.");

      if (editingId === id) {
        cancelEditing();
      }

      await loadMedia({ silent: true });
    } catch (deleteError) {
      setError(
        getErrorMessage(
          deleteError,
          "The media could not be deleted."
        )
      );
    } finally {
      setDeletingId("");
    }
  };

  // ----------------------------------------------------------
  // Search, filters and metrics
  // ----------------------------------------------------------

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items
      .filter((item) => {
        const kind = getMediaKind(item);
        const published = isPublished(item);

        if (
          kindFilter !== "all" &&
          kind !== kindFilter
        ) {
          return false;
        }

        if (
          publicationFilter === "published" &&
          !published
        ) {
          return false;
        }

        if (
          publicationFilter === "drafts" &&
          published
        ) {
          return false;
        }

        if (normalizedSearch) {
          const content = [
            item.title,
            item.filename,
            item.caption,
            item.alt_text,
            item.category,
            item.format,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!content.includes(normalizedSearch)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const first = Number(a?.sort_order || 0);
        const second = Number(b?.sort_order || 0);

        return first - second;
      });
  }, [
    items,
    search,
    kindFilter,
    publicationFilter,
  ]);

  const publishedCount = items.filter(isPublished).length;
  const draftCount = items.length - publishedCount;

  // ==========================================================
  // ACCESS DENIED
  // ==========================================================

  if (!canManage) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={22}
            className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300"
          />

          <div>
            <h1 className="text-lg font-bold text-amber-950 dark:text-amber-200">
              Media management restricted
            </h1>

            <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-300">
              Only the school owner or an authorized principal may
              manage school media. The backend must also verify your
              school membership and permissions.
            </p>

            <button
              type="button"
              onClick={() => onNavigate?.("elimu")}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-900"
            >
              <ArrowLeft size={16} />
              Return to dashboard
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // MAIN DASHBOARD
  // ==========================================================

  return (
    <div className="space-y-7">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <ShieldCheck size={14} />

              {role === "owner"
                ? "Owner access"
                : "Principal access"}
            </span>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              School photos &amp; videos
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Upload school photography, showcase facilities,
              document events and keep your public school website
              updated with approved media.
            </p>

            <p className="mt-4 text-sm font-semibold text-white">
              {schoolName}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Images up to 12 MB · Videos up to 80 MB
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {schoolSlug && (
              <a
                href={`/${encodeURIComponent(schoolSlug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <Eye size={16} />
                View public website
              </a>
            )}

            <button
              type="button"
              onClick={() => void loadMedia()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Feedback */}
      <Notice
        type="error"
        onDismiss={() => setError("")}
      >
        {error}
      </Notice>

      <Notice
        type="success"
        onDismiss={() => setSuccess("")}
      >
        {success}
      </Notice>

      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total media
              </p>

              <p className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">
                {items.length}
              </p>
            </div>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <ImageIcon size={22} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Published
              </p>

              <p className="mt-2 text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {publishedCount}
              </p>
            </div>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Eye size={22} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Drafts
              </p>

              <p className="mt-2 text-3xl font-extrabold text-amber-700 dark:text-amber-300">
                {draftCount}
              </p>
            </div>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <EyeOff size={22} />
            </span>
          </div>
        </div>
      </section>

      {/* Upload form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <UploadCloud size={22} />
          </span>

          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Upload school media
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Choose a photo or video, add details, then save it
              as a draft or request publication.
            </p>
          </div>
        </div>

        <form
          onSubmit={submitUpload}
          className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"
        >
          <div className="min-w-0 space-y-5">
            <div>
              <label
                htmlFor="elimu-media-file"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Image or video file
              </label>

              <input
                ref={fileInputRef}
                id="elimu-media-file"
                type="file"
                accept={ACCEPTED_FILES}
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 file:mr-4 file:min-h-11 file:border-0 file:bg-blue-700 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Supported: JPG, JPEG, PNG, WEBP, GIF, MP4, MOV,
                M4V and WEBM.
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 dark:bg-slate-900 dark:text-blue-300">
                  {getFileKind(selectedFile) === "video" ? (
                    <Film size={20} />
                  ) : (
                    <ImageIcon size={20} />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {selectedFile.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Remove selected file"
                  disabled={uploading}
                  onClick={() => {
                    setSelectedFile(null);

                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-red-600 dark:hover:bg-slate-900"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <FormInput
              id="elimu-media-title"
              label="Media title"
              value={form.title}
              onChange={(value) => updateForm("title", value)}
              placeholder="e.g. Our modern science laboratory"
              maxLength={120}
              required
              disabled={uploading}
            />

            <FormTextarea
              id="elimu-media-caption"
              label="Caption"
              value={form.caption}
              onChange={(value) => updateForm("caption", value)}
              placeholder="Describe the photo, video, event or facility."
              maxLength={1000}
              hint="The caption helps visitors understand the media."
              disabled={uploading}
            />

            <FormInput
              id="elimu-media-alt"
              label="Accessibility description"
              value={form.alt_text}
              onChange={(value) => updateForm("alt_text", value)}
              placeholder="Describe what the image shows"
              maxLength={300}
              hint="Alternative text helps screen-reader users understand images."
              disabled={uploading}
            />

            <div>
              <FieldLabel htmlFor="elimu-media-category">
                Media category
              </FieldLabel>

              <select
                id="elimu-media-category"
                value={form.category}
                onChange={(event) =>
                  updateForm("category", event.target.value)
                }
                disabled={uploading}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {MEDIA_CATEGORIES.map((category) => (
                  <option
                    key={category.value}
                    value={category.value}
                  >
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) =>
                  updateForm(
                    "is_published",
                    event.target.checked
                  )
                }
                disabled={uploading}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  Publish immediately
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Request public publication when uploading.
                  Otherwise, save the file as a draft. The backend
                  determines the final authorized publication state.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                {uploading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Uploading media…
                  </>
                ) : (
                  <>
                    <UploadCloud size={17} />
                    Upload media
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={uploading}
                onClick={resetUploadForm}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Clear form
              </button>
            </div>
          </div>

          {/* Upload preview */}
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Preview
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Preview of the selected file.
              </p>
            </div>

            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-950">
              {previewUrl && selectedFile ? (
                getFileKind(selectedFile) === "video" ? (
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={
                      form.alt_text ||
                      form.title ||
                      "Selected school media"
                    }
                    className="h-full w-full object-contain"
                  />
                )
              ) : (
                <div className="px-6 text-center">
                  <ImageIcon
                    size={37}
                    className="mx-auto text-slate-300 dark:text-slate-700"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No file selected
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Choose an image or video to preview it here.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Title
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {form.title || "Your media title"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Category
                </p>

                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {MEDIA_CATEGORIES.find(
                    (category) =>
                      category.value === form.category
                  )?.label || "School gallery"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Visibility request
                </p>

                <div className="mt-2">
                  <StatusBadge
                    published={form.is_published}
                  />
                </div>
              </div>
            </div>
          </aside>
        </form>
      </section>

      {/* Media library */}
      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Media library
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Edit metadata, control publication and remove media.
            </p>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {visibleItems.length}{" "}
            {visibleItems.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Search and filters */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search title, caption or category..."
            aria-label="Search media"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />

          <select
            value={kindFilter}
            onChange={(event) =>
              setKindFilter(event.target.value)
            }
            aria-label="Filter by media type"
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="all">All media types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>

          <select
            value={publicationFilter}
            onChange={(event) =>
              setPublicationFilter(event.target.value)
            }
            aria-label="Filter by publication status"
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="all">All publication states</option>
            <option value="published">Published only</option>
            <option value="drafts">Drafts only</option>
          </select>
        </div>

        {/* Library results */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((number) => (
              <LoadingCard key={number} />
            ))}
          </div>
        ) : visibleItems.length ? (
          <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item, index) => {
              const id =
                getMediaId(item) || `media-${index}`;

              const isEditing = editingId === id;

              const busy =
                busyId === id || deletingId === id;

              const published = isPublished(item);
              const kind = getMediaKind(item);

              return (
                <article
                  key={id}
                  className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  {/* Card preview */}
                  <div className="relative">
                    <MediaPreview item={item} />

                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-slate-950/80 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
                      {kind === "video" ? (
                        <Video size={13} />
                      ) : (
                        <ImageIcon size={13} />
                      )}

                      {kind === "video" ? "Video" : "Image"}
                    </span>

                    <span className="absolute right-3 top-3">
                      <StatusBadge published={published} />
                    </span>
                  </div>

                  <div className="space-y-4 p-4">
                    {!isEditing ? (
                      <>
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-bold text-slate-950 dark:text-white">
                            {getMediaTitle(item)}
                          </h3>

                          {item.caption && (
                            <p className="mt-2 whitespace-pre-line break-words text-xs leading-5 text-slate-600 dark:text-slate-400">
                              {item.caption}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium capitalize text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                              {String(
                                item.category || "gallery"
                              ).replace(/[_-]+/g, " ")}
                            </span>

                            {formatBytes(
                              item.size_bytes ?? item.size
                            ) && (
                              <span className="text-[11px] text-slate-400">
                                {formatBytes(
                                  item.size_bytes ?? item.size
                                )}
                              </span>
                            )}

                            {formatDate(
                              item.created_at ||
                                item.createdAt
                            ) && (
                              <span className="text-[11px] text-slate-400">
                                {formatDate(
                                  item.created_at ||
                                    item.createdAt
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Edit and publication controls */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={busy || !getMediaId(item)}
                            onClick={() => startEditing(item)}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                          >
                            <Pencil size={14} />
                            Edit details
                          </button>

                          <button
                            type="button"
                            disabled={busy || !getMediaId(item)}
                            onClick={() =>
                              void togglePublication(item)
                            }
                            className={[
                              "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50",
                              published
                                ? "border border-amber-200 text-amber-800 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/30"
                                : "bg-emerald-700 text-white hover:bg-emerald-800",
                            ].join(" ")}
                          >
                            {busy ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : published ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}

                            {published ? "Unpublish" : "Publish"}
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={busy || !getMediaId(item)}
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Permanently delete "${getMediaTitle(item)}"? This action cannot be undone.`
                            );

                            if (confirmed) {
                              void deleteMedia(item);
                            }
                          }}
                          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          {deletingId === id ? (
                            <Loader2
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={14} />
                          )}

                          {deletingId === id
                            ? "Deleting…"
                            : "Delete media"}
                        </button>
                      </>
                    ) : (
                      <form
                        onSubmit={saveEdit}
                        className="space-y-4"
                      >
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Edit media details
                        </h3>

                        <FormInput
                          id={`edit-title-${id}`}
                          label="Title"
                          value={editForm.title}
                          onChange={(value) =>
                            setEditForm((current) => ({
                              ...current,
                              title: value,
                            }))
                          }
                          maxLength={120}
                          required
                          disabled={busy}
                        />

                        <FormTextarea
                          id={`edit-caption-${id}`}
                          label="Caption"
                          value={editForm.caption}
                          onChange={(value) =>
                            setEditForm((current) => ({
                              ...current,
                              caption: value,
                            }))
                          }
                          maxLength={1000}
                          rows={2}
                          disabled={busy}
                        />

                        <FormInput
                          id={`edit-alt-${id}`}
                          label="Accessibility description"
                          value={editForm.alt_text}
                          onChange={(value) =>
                            setEditForm((current) => ({
                              ...current,
                              alt_text: value,
                            }))
                          }
                          maxLength={300}
                          disabled={busy}
                        />

                        <div>
                          <FieldLabel
                            htmlFor={`edit-category-${id}`}
                          >
                            Category
                          </FieldLabel>

                          <select
                            id={`edit-category-${id}`}
                            value={editForm.category}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                category: event.target.value,
                              }))
                            }
                            disabled={busy}
                            className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          >
                            {MEDIA_CATEGORIES.map(
                              (category) => (
                                <option
                                  key={category.value}
                                  value={category.value}
                                >
                                  {category.label}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div>
                          <FieldLabel
                            htmlFor={`edit-order-${id}`}
                          >
                            Display order
                          </FieldLabel>

                          <input
                            id={`edit-order-${id}`}
                            type="number"
                            min={0}
                            max={9999}
                            step={1}
                            value={editForm.sort_order}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                sort_order: event.target.value,
                              }))
                            }
                            disabled={busy}
                            className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="submit"
                            disabled={busy}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                          >
                            {busy ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={14} />
                            )}

                            Save
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={cancelEditing}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-800 dark:bg-slate-950">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <ImageIcon size={27} />
            </span>

            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              {items.length
                ? "No media matches these filters"
                : "Your school gallery is ready"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {items.length
                ? "Change your search or filters to see more media."
                : "Upload your first school photo or video using the form above. Published media can then appear on your public school website."}
            </p>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setKindFilter("all");
                  setPublicationFilter("all");
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
              >
                Clear filters
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}
      </section>

      {/* Privacy guidance */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={21}
            className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300"
          />

          <div>
            <h2 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
              School media and privacy
            </h2>

            <p className="mt-2 text-sm leading-6 text-emerald-900 dark:text-emerald-300">
              Publish only school-approved images and videos.
              Obtain appropriate consent before publishing
              identifiable learners. Draft items should remain
              hidden from public visitors. The backend must enforce
              school membership, authorization and publication
              status for every operation.
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => onNavigate?.("elimu")}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
      >
        <ArrowLeft size={16} />
        Return to dashboard
      </button>
    </div>
  );
}