import React, { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  GraduationCap,
  Image,
  Leaf,
  Link2,
  MapPin,
  MessageCircle,
  Megaphone,
  Plus,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

// ============================================================
// CONFIG
// ============================================================

const POST_CATEGORIES = [
  {
    value: "general",
    label: "General",
    description: "Share something useful with the community.",
    icon: MessageCircle,
  },
  {
    value: "discussion",
    label: "Discussion",
    description: "Start a conversation and invite opinions.",
    icon: Users,
  },
  {
    value: "question",
    label: "Question",
    description: "Ask the community for answers or guidance.",
    icon: MessageCircle,
  },
  {
    value: "announcement",
    label: "Announcement",
    description: "Share important news or updates.",
    icon: Megaphone,
  },
  {
    value: "advertisement",
    label: "Advertisement",
    description: "Promote a product or service in the Community hub.",
    icon: Megaphone,
  },
  {
    value: "opportunity",
    label: "Opportunity",
    description: "Share jobs, business or other opportunities.",
    icon: Sparkles,
  },
  {
    value: "help",
    label: "Help",
    description: "Ask for support from the community.",
    icon: Users,
  },
];

const HUBS = [
  {
    value: "community",
    label: "Community",
    description: "General community conversations.",
    icon: Users,
  },
  {
    value: "biashara",
    label: "Biashara",
    description: "Business, jobs and opportunities.",
    icon: Briefcase,
  },
  {
    value: "shamba",
    label: "Shamba",
    description: "Farming and agriculture.",
    icon: Leaf,
  },
  {
    value: "elimu",
    label: "Elimu",
    description: "Education and learning.",
    icon: GraduationCap,
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

export default function CommunityComposer({
  onNavigate,
  initialPost = null,
  initialCategory = "general",
}) {
  const { user } = useAuth();

  const {
    createCommunityPost,
    updateCommunityPost,
    uploadCommunityMedia,
  } = useJumuiyaApi();

  const initialCategoryChoice = useMemo(() => {
    const supported = new Set(POST_CATEGORIES.map((item) => item.value));
    const existingPostCategory = [
      initialPost?.type,
      initialPost?.post_type,
      initialPost?.category,
    ].map((value) => String(value || "").toLowerCase())
      .find((value) => supported.has(value));

    if (initialPost) return existingPostCategory || "general";

    const requestedCategory = String(initialCategory || "general").toLowerCase();
    return supported.has(requestedCategory) ? requestedCategory : "general";
  }, [initialPost, initialCategory]);

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [postTitle, setPostTitle] =
    useState(() => String(initialPost?.title || initialPost?.subject || ""));

  const [postBody, setPostBody] =
    useState(() => String(initialPost?.body || initialPost?.content || initialPost?.text || ""));

  const [postCategory, setPostCategory] =
    useState(initialCategoryChoice);

  const [postHub, setPostHub] =
    useState(() => String(initialPost?.hub || initialPost?.source_hub || "community"));

  const [postLocation, setPostLocation] =
    useState(() => String(initialPost?.location || ""));

  const [posting, setPosting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showCategoryMenu, setShowCategoryMenu] =
    useState(false);

  const [showHubMenu, setShowHubMenu] =
    useState(false);

  // The supported Community API accepts up to four uploaded media IDs per post.
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);

  useEffect(() => {
    const previews = attachmentFiles.map((file) => ({
      file,
      url: typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(file)
        : "",
      isVideo: file.type.startsWith("video/"),
    }));
    setAttachmentPreviews(previews);

    return () => {
      previews.forEach((preview) => {
        if (preview.url && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [attachmentFiles]);

  const [externalLink, setExternalLink] =
    useState(() => String(initialPost?.action?.target || ""));

  // ==========================================================
  // USER DATA
  // ==========================================================

  const displayName = useMemo(
    () => getDisplayName(user),
    [user]
  );

  const initials = useMemo(
    () => getInitials(displayName),
    [displayName]
  );

  const selectedCategory = useMemo(
    () =>
      POST_CATEGORIES.find(
        (item) =>
          item.value === postCategory
      ) ||
      POST_CATEGORIES[0],
    [postCategory]
  );

  const selectedHub = useMemo(
    () =>
      HUBS.find(
        (item) =>
          item.value === postHub
      ) ||
      HUBS[0],
    [postHub]
  );

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const goBack = () => {
    if (typeof onNavigate === "function") {
      onNavigate("community-feed");
      return;
    }

    window.history.back();
  };

  const openDashboard = () => {
    if (typeof onNavigate === "function") {
      onNavigate("community");
    }
  };

  // ==========================================================
  // FORM SUBMISSION
  // ==========================================================

  const submitPost = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const title =
      postTitle.trim();

    const body =
      postBody.trim();

    const location =
      postLocation.trim();

    let action = initialPost?.action && typeof initialPost.action === "object" ? initialPost.action : {};

    if (externalLink.trim()) {
      let candidate = externalLink.trim();

      if (!/^[a-z][a-z\\d+.-]*:/i.test(candidate)) {
        candidate = `https://${candidate}`;
      }

      try {
        const parsed = new URL(candidate);

        if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
          throw new Error("Only standard web links are supported.");
        }

        action = {
          type: "external_link",
          label: "Open link",
          target: parsed.toString(),
        };
      } catch {
        setError("Enter a valid website link beginning with https:// or http://.");
        return;
      }
    }

    if (!title) {
      setError(
        "Please add a title to your post."
      );
      return;
    }

    if (!body) {
      setError(
        "Please write something to share with the community."
      );
      return;
    }

    if (title.length > 180) {
      setError(
        "Your title must be 180 characters or fewer."
      );
      return;
    }

    if (body.length > 10000) {
      setError(
        "Your post must be 10,000 characters or fewer."
      );
      return;
    }

    try {
      setPosting(true);

      const attachments = [];

      if (initialPost && attachmentFiles.length) {
        throw new Error("Attachments cannot be replaced by the current post-update contract. Remove the new files and save the text changes, or publish a new post.");
      }

      if (attachmentFiles.length > 4) {
        throw new Error("A post can contain no more than four photos or videos.");
      }

      // Upload sequentially to keep mobile bandwidth and server load predictable.
      for (const file of attachmentFiles) {
        const uploadResult = await uploadCommunityMedia(file);
        const uploadedAttachment =
          uploadResult?.attachment ||
          uploadResult?.data?.attachment ||
          null;
        const mediaId = uploadedAttachment?.id ?? uploadedAttachment?.media_id ?? null;

        if (!mediaId) {
          throw new Error(
            `Media upload for "${file.name}" did not return a valid attachment ID. Please try again.`
          );
        }

        attachments.push({ media_id: String(mediaId) });
      }

      const normalizedPostType = {
        general: "discussion",
        discussion: "discussion",
        question: "question",
        announcement: "announcement",
        advertisement: "advertisement",
        opportunity: "opportunity",
        help: "help",
      }[postCategory] || "discussion";

      const preserveOriginalCategory = Boolean(
        initialPost && postCategory === initialCategoryChoice && initialPost.category
      );
      const payload = {
        title,
        body,
        category: preserveOriginalCategory ? String(initialPost.category) : (postCategory || "general"),
        type: initialPost && postCategory === initialCategoryChoice
          ? (initialPost.type || initialPost.post_type || normalizedPostType)
          : normalizedPostType,
        hub: postCategory === "advertisement" ? "community" : (postHub || "community"),
        location,
        action,
      };

      if (initialPost) {
        const postId = initialPost.id ?? initialPost._id ?? initialPost.post_id ?? initialPost.postId;
        if (postId === undefined || postId === null || !String(postId).trim()) {
          throw new Error("The post ID is missing. Refresh Community and try editing again.");
        }
        await updateCommunityPost(postId, payload);
      } else {
        await createCommunityPost({ ...payload, attachments });
      }

      setSuccess(
        initialPost ? "Your post has been updated successfully." : "Your post has been published successfully."
      );

      setPostTitle("");
      setPostBody("");
      setPostCategory("general");
      setPostHub("community");
      setPostLocation("");
      setAttachmentFiles([]);
      setExternalLink("");

      window.setTimeout(() => {
        if (
          typeof onNavigate ===
          "function"
        ) {
          onNavigate("community-feed");
        }
      }, 700);
    } catch (err) {
      console.error(
        "Community post creation failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to publish your post. Please try again."
      );
    } finally {
      setPosting(false);
    }
  };

  // ==========================================================
  // ATTACHMENT UI
  // ==========================================================

  const handleAttachment = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (initialPost) {
      setError("The current post-update contract cannot replace attachments. Publish a new post to share new media.");
      event.target.value = "";
      return;
    }

    if (attachmentFiles.length + files.length > 4) {
      setError("Choose up to four photos or videos per post.");
      event.target.value = "";
      return;
    }

    const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
    const videoExtensions = new Set(["mp4", "mov", "m4v", "webm"]);
    for (const file of files) {
      const extension = String(file.name.split(".").pop() || "").toLowerCase();
      const isImage = imageExtensions.has(extension);
      const isVideo = videoExtensions.has(extension);

      if (!isImage && !isVideo) {
        setError(`"${file.name}" is not a supported image or video. Use JPG, PNG, WEBP, GIF, MP4, MOV, M4V or WEBM.`);
        event.target.value = "";
        return;
      }

      const maxBytes = isVideo ? 50 * 1024 * 1024 : 12 * 1024 * 1024;
      if (file.size <= 0 || file.size > maxBytes) {
        setError(
          isVideo
            ? `"${file.name}" is too large. Videos must be no larger than 50 MB each.`
            : `"${file.name}" is too large. Images must be no larger than 12 MB each.`
        );
        event.target.value = "";
        return;
      }
    }

    setError("");
    setAttachmentFiles((current) => {
      const seen = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
      const uniqueFiles = files.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return [...current, ...uniqueFiles].slice(0, 4);
    });
    event.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachmentFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setError("");
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
      <div className="mx-auto w-full max-w-5xl space-y-5 pb-10">

        {/* ====================================================
            TOP NAVIGATION
        ==================================================== */}

        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          <button
            type="button"
            onClick={goBack}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              text-xs
              font-bold
              text-slate-600
              transition
              hover:bg-slate-50
              dark:border-white/10
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-white/5
            "
          >
            <ArrowLeft size={15} />
            Back to feed
          </button>

          <button
            type="button"
            onClick={openDashboard}
            className="
              text-xs
              font-bold
              text-cyan-600
              transition
              hover:text-cyan-700
              dark:text-cyan-400
            "
          >
            Community Home
          </button>
        </div>

        {/* ====================================================
            MAIN GRID
        ==================================================== */}

        <div
          className="
            grid
            gap-5
            lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]
          "
        >

          {/* ==================================================
              COMPOSER
          ================================================== */}

          <section
            className="
              overflow-hidden
              rounded-[26px]
              border
              border-slate-200
              bg-white
              shadow-sm
              dark:border-white/10
              dark:bg-slate-900
            "
          >

            {/* HEADER */}

            <div
              className="
                border-b
                border-slate-100
                px-5
                py-5
                sm:px-6
                dark:border-white/5
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
                    bg-cyan-100
                    text-cyan-700
                    dark:bg-cyan-950/40
                    dark:text-cyan-400
                  "
                >
                  <Sparkles size={20} />
                </div>

                <div>
                  <h1
                    className="
                      text-lg
                      font-black
                      tracking-tight
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {initialPost ? "Edit community post" : "Create a community post"}
                  </h1>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-slate-400
                    "
                  >
                    {initialPost
                      ? "Update the content of your existing Community post."
                      : "Share an idea, announcement, question, opportunity or update."}
                  </p>
                </div>
              </div>
            </div>

            {/* FORM */}

            <form
              onSubmit={submitPost}
              className="p-5 sm:p-6"
            >
              <div className="space-y-5">

                {/* AUTHOR */}

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    bg-slate-50
                    p-4
                    dark:bg-white/[0.025]
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
                      rounded-full
                      bg-cyan-100
                      text-xs
                      font-black
                      text-cyan-700
                      dark:bg-cyan-950/40
                      dark:text-cyan-400
                    "
                  >
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <div
                      className="
                        text-xs
                        font-black
                        text-slate-800
                        dark:text-slate-100
                      "
                    >
                      Posting as {displayName}
                    </div>

                    <div
                      className="
                        mt-0.5
                        text-[10px]
                        text-slate-400
                      "
                    >
                      Your identity is attached
                      to this community post.
                    </div>
                  </div>
                </div>

                {/* TITLE */}

                <div>
                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <label
                      htmlFor="community-title"
                      className="
                        text-xs
                        font-bold
                        text-slate-700
                        dark:text-slate-200
                      "
                    >
                      Post title
                    </label>

                    <span
                      className="
                        text-[10px]
                        text-slate-400
                      "
                    >
                      {postTitle.length}/180
                    </span>
                  </div>

                  <input
                    id="community-title"
                    type="text"
                    value={postTitle}
                    onChange={(event) =>
                      setPostTitle(
                        event.target.value
                      )
                    }
                    maxLength={180}
                    disabled={posting}
                    placeholder="Give your post a clear title"
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      py-3.5
                      text-sm
                      font-semibold
                      text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-cyan-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-cyan-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      dark:border-white/10
                      dark:bg-slate-950
                      dark:text-white
                      dark:focus:bg-slate-950
                    "
                  />
                </div>

                {/* BODY */}

                <div>
                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <label
                      htmlFor="community-body"
                      className="
                        text-xs
                        font-bold
                        text-slate-700
                        dark:text-slate-200
                      "
                    >
                      What would you like to share?
                    </label>

                    <span
                      className="
                        text-[10px]
                        text-slate-400
                      "
                    >
                      {postBody.length}/10000
                    </span>
                  </div>

                  <textarea
                    id="community-body"
                    value={postBody}
                    onChange={(event) =>
                      setPostBody(
                        event.target.value
                      )
                    }
                    maxLength={10000}
                    rows={9}
                    disabled={posting}
                    placeholder="Share an announcement, opportunity, question, idea, update or something useful to the community..."
                    className="
                      w-full
                      resize-none
                      rounded-2xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      py-4
                      text-sm
                      leading-6
                      text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-cyan-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-cyan-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      dark:border-white/10
                      dark:bg-slate-950
                      dark:text-white
                      dark:focus:bg-slate-950
                    "
                  />
                </div>

                {/* POST TYPE */}

                <div>
                  <label
                    className="
                      mb-2
                      block
                      text-xs
                      font-bold
                      text-slate-700
                      dark:text-slate-200
                    "
                  >
                    What type of post is this?
                  </label>

                  <div
                    className="
                      grid
                      grid-cols-2
                      gap-2
                      sm:grid-cols-3
                    "
                  >
                    {POST_CATEGORIES.map(
                      (category) => {
                        const Icon =
                          category.icon;

                        const active =
                          postCategory ===
                          category.value;

                        return (
                          <button
                            type="button"
                            key={
                              category.value
                            }
                            onClick={() => {
                              setPostCategory(category.value);
                              if (category.value === "advertisement") {
                                setPostHub("community");
                                setShowHubMenu(false);
                              }
                            }}
                            disabled={posting}
                            className={`
                              rounded-2xl
                              border
                              p-3
                              text-left
                              transition
                              ${
                                active
                                  ? "border-cyan-500 bg-cyan-50 dark:border-cyan-500/50 dark:bg-cyan-950/20"
                                  : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/40 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-white/[0.025]"
                              }
                            `}
                          >
                            <div
                              className={`
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-xl
                                ${
                                  active
                                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                                }
                              `}
                            >
                              <Icon size={16} />
                            </div>

                            <div
                              className={`
                                mt-2
                                text-xs
                                font-black
                                ${
                                  active
                                    ? "text-cyan-700 dark:text-cyan-400"
                                    : "text-slate-800 dark:text-slate-100"
                                }
                              `}
                            >
                              {category.label}
                            </div>

                            <p
                              className="
                                mt-1
                                line-clamp-2
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
                </div>

                {/* TARGET HUB + LOCATION */}

                <div
                  className="
                    grid
                    gap-4
                    sm:grid-cols-2
                  "
                >

                  {/* HUB */}

                  <div>
                    <label
                      className="
                        mb-2
                        block
                        text-xs
                        font-bold
                        text-slate-700
                        dark:text-slate-200
                      "
                    >
                      Publish to hub
                    </label>

                    <div className="relative">
                      <button
                        type="button"
                        disabled={posting || postCategory === "advertisement"}
                        onClick={() =>
                          setShowHubMenu(
                            (value) =>
                              !value
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-2xl
                          border
                          border-slate-200
                          bg-slate-50
                          px-3
                          py-3
                          text-left
                          transition
                          hover:bg-white
                          dark:border-white/10
                          dark:bg-slate-950
                          dark:hover:bg-slate-950
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
                            bg-cyan-100
                            text-cyan-700
                            dark:bg-cyan-950/40
                            dark:text-cyan-400
                          "
                        >
                          <selectedHub.icon
                            size={16}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div
                            className="
                              text-xs
                              font-bold
                              text-slate-800
                              dark:text-slate-100
                            "
                          >
                            {selectedHub.label}
                          </div>

                          <div
                            className="
                              mt-0.5
                              truncate
                              text-[10px]
                              text-slate-400
                            "
                          >
                            {selectedHub.description}
                          </div>
                        </div>

                        <ChevronDown
                          size={15}
                          className="
                            shrink-0
                            text-slate-400
                          "
                        />
                      </button>

                      {showHubMenu && (
                        <div
                          className="
                            absolute
                            left-0
                            right-0
                            z-30
                            mt-2
                            overflow-hidden
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            p-1
                            shadow-xl
                            dark:border-white/10
                            dark:bg-slate-900
                          "
                        >
                          {HUBS.map((hub) => {
                            const Icon =
                              hub.icon;

                            const active =
                              postHub ===
                              hub.value;

                            return (
                              <button
                                type="button"
                                key={
                                  hub.value
                                }
                                onClick={() => {
                                  setPostHub(
                                    hub.value
                                  );
                                  setShowHubMenu(
                                    false
                                  );
                                }}
                                className={`
                                  flex
                                  w-full
                                  items-center
                                  gap-3
                                  rounded-xl
                                  p-3
                                  text-left
                                  transition
                                  ${
                                    active
                                      ? "bg-cyan-50 dark:bg-cyan-950/20"
                                      : "hover:bg-slate-50 dark:hover:bg-white/5"
                                  }
                                `}
                              >
                                <Icon
                                  size={16}
                                  className={
                                    active
                                      ? "text-cyan-600"
                                      : "text-slate-400"
                                  }
                                />

                                <div className="min-w-0">
                                  <div
                                    className={`
                                      text-xs
                                      font-bold
                                      ${
                                        active
                                          ? "text-cyan-700 dark:text-cyan-400"
                                          : "text-slate-700 dark:text-slate-200"
                                      }
                                    `}
                                  >
                                    {hub.label}
                                  </div>

                                  <div
                                    className="
                                      mt-0.5
                                      text-[10px]
                                      text-slate-400
                                    "
                                  >
                                    {
                                      hub.description
                                    }
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LOCATION */}

                  <div>
                    <label
                      htmlFor="community-location"
                      className="
                        mb-2
                        block
                        text-xs
                        font-bold
                        text-slate-700
                        dark:text-slate-200
                      "
                    >
                      Location
                    </label>

                    <div className="relative">
                      <MapPin
                        size={16}
                        className="
                          pointer-events-none
                          absolute
                          left-3
                          top-1/2
                          -translate-y-1/2
                          text-slate-400
                        "
                      />

                      <input
                        id="community-location"
                        type="text"
                        value={
                          postLocation
                        }
                        onChange={(event) =>
                          setPostLocation(
                            event.target
                              .value
                          )
                        }
                        maxLength={160}
                        disabled={posting}
                        placeholder="e.g. Mombasa, Kenya"
                        className="
                          w-full
                          rounded-2xl
                          border
                          border-slate-200
                          bg-slate-50
                          py-3.5
                          pl-10
                          pr-4
                          text-sm
                          text-slate-900
                          outline-none
                          transition
                          placeholder:text-slate-400
                          focus:border-cyan-500
                          focus:bg-white
                          focus:ring-4
                          focus:ring-cyan-500/10
                          dark:border-white/10
                          dark:bg-slate-950
                          dark:text-white
                          dark:focus:bg-slate-950
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* OPTIONAL TOOLS */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-100
                    bg-slate-50/70
                    p-4
                    dark:border-white/5
                    dark:bg-white/[0.025]
                  "
                >
                  <div
                    className="
                      mb-3
                      text-xs
                      font-black
                      text-slate-700
                      dark:text-slate-200
                    "
                  >
                    Add more to your post
                  </div>

                  <div
                    className="
                      grid
                      gap-2
                      sm:grid-cols-2
                    "
                  >
                    {/* ATTACHMENT UI */}

                    <label
                      className="
                        flex
                        cursor-pointer
                        items-center
                        gap-3
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        p-3
                        transition
                        hover:border-cyan-200
                        hover:bg-cyan-50/40
                        dark:border-white/10
                        dark:bg-slate-950
                        dark:hover:bg-white/[0.025]
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
                          bg-slate-100
                          text-slate-500
                          dark:bg-slate-800
                          dark:text-slate-300
                        "
                      >
                        <Image size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className="
                            text-xs
                            font-bold
                            text-slate-700
                            dark:text-slate-200
                          "
                        >
                          {initialPost ? "Existing attachment" : "Add photo or video"}
                        </div>

                        <div
                          className="
                            mt-0.5
                            truncate
                            text-[10px]
                            text-slate-400
                          "
                        >
                          {initialPost
                            ? "The current update API does not replace existing attachments."
                            : attachmentFiles.length
                              ? `${attachmentFiles.length} of 4 selected`
                              : "Select up to 4 photos or videos · Images 12 MB each · Videos 50 MB each"}
                        </div>
                      </div>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                        multiple
                        className="hidden"
                        onChange={handleAttachment}
                        disabled={posting || Boolean(initialPost)}
                      />
                    </label>

                    {attachmentPreviews.length ? (
                      <div className="col-span-full grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {attachmentPreviews.map((preview, index) => (
                          <div key={`${preview.file.name}-${preview.file.size}-${preview.file.lastModified}`} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
                            <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
                              {preview.url ? (
                                preview.isVideo ? (
                                  <video src={preview.url} muted playsInline controls preload="metadata" className="h-full w-full object-cover" aria-label={preview.file.name} />
                                ) : (
                                  <img src={preview.url} alt={preview.file.name} className="h-full w-full object-cover" />
                                )
                              ) : (
                                <div className="flex h-full items-center justify-center text-slate-400"><Image size={24} /></div>
                              )}
                              <span className="absolute left-2 top-2 rounded-full bg-slate-950/75 px-2 py-1 text-[9px] font-black uppercase text-white">{preview.isVideo ? "Video" : "Photo"}</span>
                              <button type="button" onClick={() => removeAttachment(index)} disabled={posting} aria-label={`Remove ${preview.file.name}`} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/75 text-white transition hover:bg-rose-600 disabled:opacity-50">
                                <X size={13} />
                              </button>
                            </div>
                            <p className="truncate px-2.5 py-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300" title={preview.file.name}>{preview.file.name}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* LINK */}

                    <button
                      type="button"
                      onClick={() => {
                        const value =
                          window.prompt(
                            "Enter a link to include with this post:"
                          );

                        if (
                          value?.trim()
                        ) {
                          setExternalLink(
                            value.trim()
                          );
                        }
                      }}
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        p-3
                        text-left
                        transition
                        hover:border-cyan-200
                        hover:bg-cyan-50/40
                        dark:border-white/10
                        dark:bg-slate-950
                        dark:hover:bg-white/[0.025]
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
                          bg-slate-100
                          text-slate-500
                          dark:bg-slate-800
                          dark:text-slate-300
                        "
                      >
                        <Link2 size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className="
                            text-xs
                            font-bold
                            text-slate-700
                            dark:text-slate-200
                          "
                        >
                          Add link
                        </div>

                        <div
                          className="
                            mt-0.5
                            truncate
                            text-[10px]
                            text-slate-400
                          "
                        >
                          {externalLink ||
                            "Attach an external resource"}
                        </div>
                      </div>
                    </button>
                  </div>


                </div>

                {/* LINK NOTICE */}

                {externalLink && (
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-3
                      py-2.5
                      dark:border-white/10
                      dark:bg-slate-950
                    "
                  >
                    <div
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-2
                      "
                    >
                      <Link2
                        size={14}
                        className="shrink-0 text-cyan-500"
                      />

                      <span
                        className="
                          truncate
                          text-[10px]
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        {externalLink}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExternalLink("")
                      }
                      className="
                        shrink-0
                        text-slate-400
                        hover:text-slate-700
                        dark:hover:text-white
                      "
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* ERROR */}

                {error && (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-red-100
                      bg-red-50
                      px-4
                      py-3
                      text-xs
                      font-semibold
                      leading-5
                      text-red-700
                      dark:border-red-500/10
                      dark:bg-red-950/20
                      dark:text-red-400
                    "
                  >
                    {error}
                  </div>
                )}

                {/* SUCCESS */}

                {success && (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-cyan-100
                      bg-cyan-50
                      px-4
                      py-3
                      text-xs
                      font-semibold
                      leading-5
                      text-cyan-700
                      dark:border-cyan-500/10
                      dark:bg-cyan-950/20
                      dark:text-cyan-400
                    "
                  >
                    {success}
                  </div>
                )}

                {/* ACTION BAR */}

                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    border-t
                    border-slate-100
                    pt-5
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    dark:border-white/5
                  "
                >
                  <div
                    className="
                      text-[10px]
                      leading-5
                      text-slate-400
                    "
                  >
                    Be useful, respectful and
                    community-focused.
                  </div>

                  <div
                    className="
                      flex
                      flex-col-reverse
                      gap-2
                      sm:flex-row
                    "
                  >
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={posting}
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-200
                        px-5
                        py-3
                        text-sm
                        font-bold
                        text-slate-600
                        transition
                        hover:bg-slate-50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        dark:border-white/10
                        dark:text-slate-300
                        dark:hover:bg-white/5
                      "
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        posting ||
                        !postTitle.trim() ||
                        !postBody.trim()
                      }
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-cyan-600
                        px-5
                        py-3
                        text-sm
                        font-bold
                        text-white
                        shadow-sm
                        shadow-cyan-900/10
                        transition
                        hover:bg-cyan-700
                        active:scale-[0.98]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {posting ? (
                        <>
                          <Sparkles
                            size={16}
                            className="animate-spin"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          {initialPost ? "Save changes" : "Publish post"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>

          {/* ==================================================
              RIGHT PREVIEW / GUIDE
          ================================================== */}

          <aside className="space-y-5">

            {/* PREVIEW */}

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
                  className="text-cyan-500"
                />
                Post preview
              </div>

              <div
                className="
                  mt-4
                  rounded-2xl
                  border
                  border-slate-100
                  bg-slate-50
                  p-4
                  dark:border-white/5
                  dark:bg-slate-950
                "
              >
                <div className="flex gap-3">
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-cyan-100
                      text-[10px]
                      font-black
                      text-cyan-700
                      dark:bg-cyan-950/40
                      dark:text-cyan-400
                    "
                  >
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <div
                      className="
                        text-xs
                        font-bold
                        text-slate-800
                        dark:text-slate-100
                      "
                    >
                      {displayName}
                    </div>

                    <div
                      className="
                        mt-0.5
                        text-[9px]
                        text-slate-400
                      "
                    >
                      {selectedHub.label} · Now
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div
                    className="
                      text-sm
                      font-black
                      leading-5
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {postTitle.trim() ||
                      "Your post title"}
                  </div>

                  <p
                    className="
                      mt-2
                      line-clamp-5
                      whitespace-pre-line
                      text-xs
                      leading-5
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    {postBody.trim() ||
                      "Your post content will appear here as you write it."}
                  </p>
                </div>

                <div
                  className="
                    mt-4
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  <span
                    className="
                      rounded-full
                      bg-cyan-50
                      px-2.5
                      py-1
                      text-[9px]
                      font-bold
                      text-cyan-700
                      dark:bg-cyan-950/30
                      dark:text-cyan-400
                    "
                  >
                    {selectedCategory.label}
                  </span>

                  {postLocation.trim() && (
                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1
                        rounded-full
                        bg-slate-100
                        px-2.5
                        py-1
                        text-[9px]
                        font-bold
                        text-slate-500
                        dark:bg-slate-800
                        dark:text-slate-400
                      "
                    >
                      <MapPin size={10} />
                      {postLocation.trim()}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* GUIDELINES */}

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
                  text-sm
                  font-black
                  text-slate-900
                  dark:text-white
                "
              >
                Community guidelines
              </div>

              <div className="mt-4 space-y-3">
                {[
                  "Share information that adds value.",
                  "Respect other members and their views.",
                  "Keep opportunities and announcements clear.",
                  "Avoid spam and misleading information.",
                ].map((item) => (
                  <div
                    key={item}
                    className="
                      flex
                      items-start
                      gap-2.5
                    "
                  >
                    <div
                      className="
                        mt-1
                        h-1.5
                        w-1.5
                        shrink-0
                        rounded-full
                        bg-cyan-500
                      "
                    />

                    <p
                      className="
                        text-xs
                        leading-5
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* HUB CONNECTION */}

            <section
              className="
                rounded-[26px]
                border
                border-cyan-100
                bg-cyan-50
                p-5
                dark:border-cyan-500/10
                dark:bg-cyan-950/15
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-black
                  text-cyan-800
                  dark:text-cyan-300
                "
              >
                <Plus size={16} />
                Connected ecosystem
              </div>

              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-cyan-700/80
                  dark:text-cyan-400/80
                "
              >
                Your Community post can reach
                members interested in the selected
                Jumuiya hub.
              </p>
            </section>
          </aside>
        </div>
      </div>
  );
}
