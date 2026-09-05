import React, { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  Heart,
  MessageCircle,
  Plus,
  Send,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// COMMUNITY DASHBOARD
// =========================================================

export default function CommunityDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getCommunityFeed,
    createCommunityPost,
    getCommunityComments,
    addCommunityComment,
    reactToCommunityPost,
  } = useJumuiyaApi();

  const [posts, setPosts] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedHub, setSelectedHub] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [showComposer, setShowComposer] =
    useState(false);

  const [postTitle, setPostTitle] =
    useState("");

  const [postBody, setPostBody] =
    useState("");

  const [postCategory, setPostCategory] =
    useState("general");

  const [postHub, setPostHub] =
    useState("community");

  const [postLocation, setPostLocation] =
    useState("");

  const [posting, setPosting] =
    useState(false);

  const [expandedComments, setExpandedComments] =
    useState({});

  const [comments, setComments] =
    useState({});

  const [commentInputs, setCommentInputs] =
    useState({});


  // =======================================================
  // LOAD FEED
  // =======================================================

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getCommunityFeed({
          hub: selectedHub,
          category: selectedCategory,
          limit: 50,
        });

      setPosts(
        Array.isArray(result)
          ? result
          : result?.posts || []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load community feed."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadFeed();
  }, [
    selectedHub,
    selectedCategory,
  ]);


  // =======================================================
  // CREATE POST
  // =======================================================

  const submitPost = async (e) => {
    e.preventDefault();

    if (!postTitle.trim()) {
      return;
    }

    if (!postBody.trim()) {
      return;
    }

    try {
      setPosting(true);

      await createCommunityPost({
        title: postTitle.trim(),
        body: postBody.trim(),
        category:
          postCategory ||
          "general",
        hub:
          postHub ||
          "community",
        location:
          postLocation.trim(),
      });

      setPostTitle("");
      setPostBody("");
      setPostCategory("general");
      setPostHub("community");
      setPostLocation("");

      setShowComposer(false);

      await loadFeed();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to publish post."
      );
    } finally {
      setPosting(false);
    }
  };


  // =======================================================
  // COMMENTS
  // =======================================================

  const toggleComments = async (
    postId
  ) => {
    const currentlyOpen =
      expandedComments[postId];

    setExpandedComments((current) => ({
      ...current,
      [postId]: !currentlyOpen,
    }));

    if (
      !currentlyOpen &&
      !comments[postId]
    ) {
      try {
        const result =
          await getCommunityComments(
            postId
          );

        setComments((current) => ({
          ...current,
          [postId]: Array.isArray(result)
            ? result
            : result?.comments || [],
        }));
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load comments."
        );
      }
    }
  };


  const submitComment = async (
    postId
  ) => {
    const body =
      commentInputs[postId]
        ?.trim();

    if (!body) {
      return;
    }

    try {
      await addCommunityComment(
        postId,
        body
      );

      setCommentInputs(
        (current) => ({
          ...current,
          [postId]: "",
        })
      );

      const result =
        await getCommunityComments(
          postId
        );

      setComments(
        (current) => ({
          ...current,
          [postId]:
            Array.isArray(result)
              ? result
              : result?.comments || [],
        })
      );

      setPosts(
        (current) =>
          current.map((post) =>
            String(
              post.id ||
                post._id
            ) === String(postId)
              ? {
                  ...post,
                  comments_count:
                    Number(
                      post.comments_count ||
                        0
                    ) + 1,
                }
              : post
          )
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to add comment."
      );
    }
  };


  // =======================================================
  // REACTION
  // =======================================================

  const react = async (
    postId
  ) => {
    try {
      const result =
        await reactToCommunityPost(
          postId
        );

      setPosts(
        (current) =>
          current.map((post) =>
            String(
              post.id ||
                post._id
            ) === String(postId)
              ? {
                  ...post,
                  likes_count:
                    result?.likes_count ??
                    post.likes_count,
                  liked:
                    result?.liked ??
                    !post.liked,
                }
              : post
          )
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to react to post."
      );
    }
  };


  return (
    <JumuiyaDashboardShell
      title="Community"
      subtitle="Connect with people across the Jumuiya ecosystem."
      activeHub="community"
      user={user}
      onNavigate={onNavigate}
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="
          overflow-hidden
          rounded-3xl
          bg-slate-950
          px-5
          py-7
          text-white
          shadow-xl
          sm:px-7
          sm:py-8
        "
      >
        <div
          className="
            flex
            flex-col
            gap-6
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div>
            <div
              className="
                mb-3
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-white/10
                px-3
                py-1.5
                text-xs
                font-medium
                text-emerald-200
              "
            >
              <Users size={14} />
              Jumuiya Community
            </div>

            <h2
              className="
                text-2xl
                font-bold
                tracking-tight
                sm:text-3xl
              "
            >
              Your community, one place.
            </h2>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-slate-300
              "
            >
              Discover announcements, jobs,
              opportunities, conversations and
              updates from across Biashara,
              Shamba, Elimu and Community.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowComposer(true)
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-emerald-600
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              hover:bg-emerald-500
            "
          >
            <Plus size={17} />
            Create post
          </button>
        </div>
      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="
            mt-5
            flex
            items-center
            justify-between
            gap-3
            rounded-2xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
            dark:border-red-900/40
            dark:bg-red-950/20
            dark:text-red-300
          "
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={17} />
          </button>
        </div>
      )}


      {/* =====================================================
          FILTERS
      ===================================================== */}

      <section
        className="
          mt-5
          flex
          flex-col
          gap-3
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-4
          dark:border-white/10
          dark:bg-slate-900
          sm:flex-row
        "
      >
        <div className="relative flex-1">
          <select
            value={selectedHub}
            onChange={(e) =>
              setSelectedHub(
                e.target.value
              )
            }
            className="
              w-full
              appearance-none
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              pr-10
              text-sm
              outline-none
              focus:border-emerald-500
              dark:border-white/10
              dark:bg-slate-950
            "
          >
            <option value="">
              All hubs
            </option>
            <option value="community">
              Community
            </option>
            <option value="biashara">
              Biashara
            </option>
            <option value="shamba">
              Shamba
            </option>
            <option value="elimu">
              Elimu
            </option>
          </select>

          <ChevronDown
            size={16}
            className="
              pointer-events-none
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />
        </div>

        <div className="relative flex-1">
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
            className="
              w-full
              appearance-none
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              pr-10
              text-sm
              outline-none
              focus:border-emerald-500
              dark:border-white/10
              dark:bg-slate-950
            "
          >
            <option value="">
              All categories
            </option>
            <option value="general">
              General
            </option>
            <option value="announcement">
              Announcements
            </option>
            <option value="jobs">
              Jobs
            </option>
            <option value="lost_found">
              Lost & Found
            </option>
            <option value="opportunity">
              Opportunities
            </option>
          </select>

          <ChevronDown
            size={16}
            className="
              pointer-events-none
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />
        </div>
      </section>


      {/* =====================================================
          CREATE POST
      ===================================================== */}

      {showComposer && (
        <div
          className="
            mt-5
            rounded-2xl
            border
            border-emerald-200
            bg-white
            p-5
            shadow-lg
            dark:border-emerald-900/40
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <div>
              <h3 className="font-semibold">
                Create a community post
              </h3>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                Share something useful with
                the Jumuiya community.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowComposer(false)
              }
            >
              <X
                size={18}
                className="text-slate-400"
              />
            </button>
          </div>

          <form
            onSubmit={submitPost}
            className="mt-5 space-y-3"
          >
            <input
              value={postTitle}
              onChange={(e) =>
                setPostTitle(
                  e.target.value
                )
              }
              placeholder="Post title"
              maxLength={180}
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                text-sm
                outline-none
                focus:border-emerald-500
                dark:border-white/10
                dark:bg-white/5
              "
            />

            <textarea
              value={postBody}
              onChange={(e) =>
                setPostBody(
                  e.target.value
                )
              }
              placeholder="What would you like to share?"
              rows={5}
              maxLength={10000}
              className="
                w-full
                resize-none
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                text-sm
                outline-none
                focus:border-emerald-500
                dark:border-white/10
                dark:bg-white/5
              "
            />

            <div
              className="
                grid
                gap-3
                sm:grid-cols-3
              "
            >
              <select
                value={postCategory}
                onChange={(e) =>
                  setPostCategory(
                    e.target.value
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  py-3
                  text-sm
                  dark:border-white/10
                  dark:bg-slate-950
                "
              >
                <option value="general">
                  General
                </option>
                <option value="announcement">
                  Announcement
                </option>
                <option value="jobs">
                  Jobs
                </option>
                <option value="lost_found">
                  Lost & Found
                </option>
                <option value="opportunity">
                  Opportunity
                </option>
              </select>

              <select
                value={postHub}
                onChange={(e) =>
                  setPostHub(
                    e.target.value
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  py-3
                  text-sm
                  dark:border-white/10
                  dark:bg-slate-950
                "
              >
                <option value="community">
                  Community
                </option>
                <option value="biashara">
                  Biashara
                </option>
                <option value="shamba">
                  Shamba
                </option>
                <option value="elimu">
                  Elimu
                </option>
              </select>

              <input
                value={postLocation}
                onChange={(e) =>
                  setPostLocation(
                    e.target.value
                  )
                }
                placeholder="Location"
                maxLength={160}
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  py-3
                  text-sm
                  dark:border-white/10
                  dark:bg-slate-950
                "
              />
            </div>

            <button
              type="submit"
              disabled={posting}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-emerald-600
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                hover:bg-emerald-700
                disabled:opacity-60
              "
            >
              <Send size={16} />

              {posting
                ? "Publishing..."
                : "Publish post"}
            </button>
          </form>
        </div>
      )}


      {/* =====================================================
          FEED
      ===================================================== */}

      <section className="mt-5">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="
                    h-56
                    animate-pulse
                    rounded-2xl
                    bg-slate-200
                    dark:bg-slate-800
                  "
                />
              )
            )}
          </div>
        ) : posts.length === 0 ? (
          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-slate-300
              bg-white
              p-10
              text-center
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <Users
              size={34}
              className="
                mx-auto
                text-slate-400
              "
            />

            <h3
              className="
                mt-4
                font-semibold
              "
            >
              No community posts yet
            </h3>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              Be the first person to start
              a conversation.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowComposer(true)
              }
              className="
                mt-4
                rounded-xl
                bg-emerald-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
              "
            >
              Create first post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const postId =
                post.id ||
                post._id;

              const postComments =
                comments[postId] ||
                [];

              return (
                <article
                  key={postId}
                  className="
                    rounded-2xl
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
                      items-start
                      justify-between
                      gap-4
                    "
                  >
                    <div
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-3
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
                          bg-emerald-100
                          font-bold
                          text-emerald-700
                          dark:bg-emerald-950/30
                          dark:text-emerald-400
                        "
                      >
                        {(post.author_name ||
                          post.author_user_id ||
                          "U")
                          .toString()
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div
                          className="
                            truncate
                            text-sm
                            font-semibold
                          "
                        >
                          {post.author_name ||
                            "Jumuiya member"}
                        </div>

                        <div
                          className="
                            mt-0.5
                            flex
                            flex-wrap
                            gap-2
                            text-xs
                            text-slate-400
                          "
                        >
                          <span>
                            {post.hub ||
                              "community"}
                          </span>

                          {post.location && (
                            <>
                              <span>•</span>

                              <span>
                                {post.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className="
                        rounded-full
                        bg-slate-100
                        px-2.5
                        py-1
                        text-[11px]
                        font-medium
                        text-slate-500
                        dark:bg-white/5
                        dark:text-slate-400
                      "
                    >
                      {post.category ||
                        "general"}
                    </span>
                  </div>

                  <h3
                    className="
                      mt-5
                      text-lg
                      font-bold
                    "
                  >
                    {post.title}
                  </h3>

                  <p
                    className="
                      mt-2
                      whitespace-pre-wrap
                      text-sm
                      leading-6
                      text-slate-600
                      dark:text-slate-300
                    "
                  >
                    {post.body}
                  </p>

                  <div
                    className="
                      mt-5
                      flex
                      items-center
                      gap-2
                      border-t
                      border-slate-100
                      pt-4
                      dark:border-white/5
                    "
                  >
                    <button
                      type="button"
                      onClick={() =>
                        react(
                          postId
                        )
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        px-3
                        py-2
                        text-sm
                        transition
                        hover:bg-slate-100
                        dark:hover:bg-white/5
                      "
                    >
                      <Heart
                        size={17}
                        className={
                          post.liked
                            ? "fill-current text-red-500"
                            : "text-slate-400"
                        }
                      />

                      <span>
                        {post.likes_count ||
                          0}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleComments(
                          postId
                        )
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        px-3
                        py-2
                        text-sm
                        transition
                        hover:bg-slate-100
                        dark:hover:bg-white/5
                      "
                    >
                      <MessageCircle
                        size={17}
                        className="text-slate-400"
                      />

                      <span>
                        {post.comments_count ||
                          0}
                      </span>
                    </button>
                  </div>


                  {/* Comments */}

                  {expandedComments[
                    postId
                  ] && (
                    <div
                      className="
                        mt-4
                        rounded-xl
                        bg-slate-50
                        p-4
                        dark:bg-white/5
                      "
                    >
                      {postComments.length >
                      0 ? (
                        <div className="space-y-3">
                          {postComments.map(
                            (comment) => (
                              <div
                                key={
                                  comment.id ||
                                  comment._id
                                }
                                className="
                                  rounded-xl
                                  bg-white
                                  p-3
                                  dark:bg-slate-900
                                "
                              >
                                <div
                                  className="
                                    text-xs
                                    font-semibold
                                  "
                                >
                                  {comment.author_name ||
                                    "Member"}
                                </div>

                                <div
                                  className="
                                    mt-1
                                    text-sm
                                    text-slate-600
                                    dark:text-slate-300
                                  "
                                >
                                  {comment.body}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p
                          className="
                            text-xs
                            text-slate-400
                          "
                        >
                          No comments yet.
                        </p>
                      )}

                      <div
                        className="
                          mt-3
                          flex
                          gap-2
                        "
                      >
                        <input
                          value={
                            commentInputs[
                              postId
                            ] || ""
                          }
                          onChange={(e) =>
                            setCommentInputs(
                              (current) => ({
                                ...current,
                                [postId]:
                                  e.target.value,
                              })
                            )
                          }
                          placeholder="Write a comment..."
                          className="
                            min-w-0
                            flex-1
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-2.5
                            text-sm
                            outline-none
                            focus:border-emerald-500
                            dark:border-white/10
                            dark:bg-slate-900
                          "
                        />

                        <button
                          type="button"
                          onClick={() =>
                            submitComment(
                              postId
                            )
                          }
                          className="
                            rounded-xl
                            bg-emerald-600
                            px-3
                            text-white
                            hover:bg-emerald-700
                          "
                        >
                          <Send
                            size={16}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>


      {/* =====================================================
          COMMUNITY CONNECTION
      ===================================================== */}

      <section
        className="
          mt-5
          rounded-2xl
          border
          border-emerald-100
          bg-emerald-50
          p-5
          dark:border-emerald-900/40
          dark:bg-emerald-950/20
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <Bell
            size={19}
            className="text-emerald-600"
          />

          <div>
            <div className="font-semibold">
              One community across all hubs
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
              Business opportunities, farming
              updates, education announcements
              and local conversations can all
              meet here.
            </p>
          </div>
        </div>
      </section>
    </JumuiyaDashboardShell>
  );
}