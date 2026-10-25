import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  MessageCircle,
  RefreshCw,
  Send,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import {
  asCommunityCommentList,
  extractSavedCommunityComment,
  normalizeCommunityComment,
  readCommunityPostId,
} from "@/Dashboard/Community/communityCommentsData.mjs";

function textValue(value, fallback = "") {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function normalizeDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error, fallback) {
  return typeof error?.message === "string" && error.message.trim()
    ? error.message
    : fallback;
}

export default function CommunityPostComments({
  post,
  onClose,
  onCommentAdded,
}) {
  const { user } = useAuth();
  const { getCommunityComments, addCommunityComment } = useJumuiyaApi();

  const postId = useMemo(() => readCommunityPostId(post), [post]);
  const postTitle = textValue(post?.title || post?.headline, "Community post");
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState("");

  const currentUserName = textValue(
    user?.name || user?.full_name || user?.fullName || user?.username ||
    user?.email?.split?.("@")?.[0],
    "You",
  );

  const loadComments = useCallback(async ({ quiet = false } = {}) => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      setRefreshing(false);
      setError("This post has no valid ID, so its comments cannot be loaded.");
      return;
    }

    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      if (typeof getCommunityComments !== "function") {
        throw new Error("The comments service is unavailable. Reload Community and try again.");
      }

      const response = await getCommunityComments(postId, 100);
      setComments(asCommunityCommentList(response).map(normalizeCommunityComment).filter(Boolean));
    } catch (requestError) {
      console.error("[Community comments] Load failed:", requestError);
      setError(getErrorMessage(requestError, "Comments could not be loaded. Please try again."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getCommunityComments, postId]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!postId) {
        if (active) {
          setComments([]);
          setError("This post has no valid ID, so its comments cannot be loaded.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");
      try {
        if (typeof getCommunityComments !== "function") {
          throw new Error("The comments service is unavailable. Reload Community and try again.");
        }
        const response = await getCommunityComments(postId, 100);
        if (active) setComments(asCommunityCommentList(response).map(normalizeCommunityComment).filter(Boolean));
      } catch (requestError) {
        console.error("[Community comments] Load failed:", requestError);
        if (active) setError(getErrorMessage(requestError, "Comments could not be loaded. Please try again."));
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();
    return () => { active = false; };
  }, [getCommunityComments, postId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setNotice("");

    const body = commentBody.trim();
    if (!postId) {
      setSubmitError("This post has no valid ID. Refresh the feed and try again.");
      return;
    }
    if (!body) {
      setSubmitError("Write a comment before sending it.");
      return;
    }
    if (body.length > 3000) {
      setSubmitError("Comments must be 3,000 characters or fewer.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      if (typeof addCommunityComment !== "function") {
        throw new Error("The comment submission service is unavailable. Reload Community and try again.");
      }

      const result = await addCommunityComment(postId, body);
      const returnedComment = extractSavedCommunityComment(result);
      const normalized = returnedComment
        ? normalizeCommunityComment(returnedComment, comments.length)
        : null;

      // Only render a comment record returned by the backend. A successful
      // submit still triggers a server refresh, but never inserts a fabricated
      // local record when a deployment returns an unfamiliar response shape.
      if (normalized?.body) {
        setComments((current) => {
          if (current.some((item) => String(item.id) === String(normalized.id))) return current;
          return [...current, normalized];
        });
      }
      setCommentBody("");
      setNotice("Your comment was published.");

      if (typeof onCommentAdded === "function") {
        try {
          onCommentAdded(postId, normalized);
        } catch (callbackError) {
          // The comment is already saved by the backend; a count refresh must not
          // make the successful submission appear to have failed.
          console.warn("[Community comments] Parent refresh callback failed:", callbackError);
        }
      }

      // Refresh server-authoritative comments without undoing the successful
      // submission if the follow-up read temporarily fails.
      try {
        await loadComments({ quiet: true });
      } catch {
        // loadComments handles and displays its own read error.
      }
    } catch (requestError) {
      console.error("[Community comments] Submit failed:", requestError);
      setSubmitError(getErrorMessage(requestError, "Your comment could not be published. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    if (typeof onClose === "function") onClose();
  };

  return createPortal((
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-comments-heading"
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:rounded-3xl"
      >
        <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
            <MessageCircle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="community-comments-heading" className="text-base font-black text-slate-900 dark:text-white">
              Comments
            </h2>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{postTitle}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close comments"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          {error ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <p className="min-w-0 flex-1">{error}</p>
              </div>
              <button type="button" onClick={() => { void loadComments(); }} disabled={loading || refreshing} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-bold text-rose-700 disabled:opacity-60 dark:bg-slate-900 dark:text-rose-300">
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Try again
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {loading ? "Loading comments…" : `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`}
            </p>
            <button type="button" onClick={() => { void loadComments({ quiet: true }); }} disabled={loading || refreshing} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/5">
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {loading && comments.length === 0 ? (
            <div className="space-y-3" aria-label="Loading comments">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 && !error ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-white/15">
              <MessageCircle size={25} className="mx-auto text-slate-400" />
              <p className="mt-3 text-sm font-black text-slate-800 dark:text-white">Start the conversation</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Be the first to share a helpful response.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <article key={comment.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-white/5 dark:bg-slate-800/60">
                  {comment.authorAvatar ? (
                    <img src={comment.authorAvatar} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-black text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                      {comment.authorName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{comment.authorName}</p>
                      <time className="text-[10px] text-slate-400">{normalizeDate(comment.createdAt)}</time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">{comment.body}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-4 dark:border-white/10 dark:bg-slate-900 sm:p-5">
          {notice ? <p role="status" className="mb-3 rounded-xl bg-cyan-50 px-3 py-2.5 text-xs font-semibold text-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200">{notice}</p> : null}
          {submitError ? <p role="alert" className="mb-3 rounded-xl bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{submitError}</p> : null}
          <label htmlFor="community-new-comment" className="mb-2 block text-xs font-black text-slate-800 dark:text-slate-100">Add a comment</label>
          <textarea
            id="community-new-comment"
            name="comment"
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value.slice(0, 3000))}
            maxLength={3000}
            rows={3}
            placeholder="Write something helpful or thoughtful…"
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
          <div className="mt-3 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-[10px] text-slate-400">{commentBody.length}/3000 characters · Posting as {currentUserName}</p>
            <button type="submit" disabled={submitting || !commentBody.trim() || !postId} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-xs font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? "Publishing…" : "Post comment"}
            </button>
          </div>
        </form>
      </section>
    </div>
  ), document.body);
}
