import React, { useState } from "react";
import {
  LoaderCircle,
  MessageCircle,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function getMemberId(post) {
  return (
    post?.author?.user_id ||
    post?.author?.member_id ||
    post?.author?.id ||
    post?.author?._id ||
    post?.author_id ||
    post?.user_id ||
    null
  );
}

function getPostId(post) {
  return (
    post?.id ||
    post?._id ||
    post?.post_id ||
    post?.postId ||
    null
  );
}

function isAllowedWhatsAppUrl(value) {
  try {
    const url = new URL(value);
    const allowedHosts = new Set([
      "wa.me",
      "api.whatsapp.com",
      "web.whatsapp.com",
    ]);

    return (
      url.protocol === "https:" &&
      allowedHosts.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

/**
 * Displays only when the backend marks the author's WhatsApp contact
 * option as enabled. It never reads or displays a phone number from a
 * public post. The backend returns a permission-checked click-to-chat URL.
 */
export default function CommunityWhatsAppButton({
  post = {},
  authorName = "this member",
  isOwnPost = false,
  compact = false,
}) {
  const { getCommunityWhatsAppContact } = useJumuiyaApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const memberId = getMemberId(post);
  const postId = getPostId(post);
  const canContact =
    post?.author?.can_whatsapp_contact === true ||
    post?.author?.whatsapp_contact_enabled === true ||
    post?.can_whatsapp_contact === true ||
    post?.whatsapp_contact_enabled === true;

  if (!canContact || isOwnPost || !memberId) {
    return null;
  }

  const handleContact = async () => {
    if (loading) return;

    setError("");

    // Open a blank tab during the user's click so browsers do not block
    // the later redirect after the authenticated API request completes.
    let popup = null;
    try {
      popup = window.open("about:blank", "_blank");
      if (popup) popup.opener = null;
    } catch {
      popup = null;
    }

    setLoading(true);

    try {
      const result = await getCommunityWhatsAppContact(
        memberId,
        postId,
      );

      const whatsappUrl =
        result?.whatsapp_url ||
        result?.url ||
        result?.data?.whatsapp_url ||
        null;

      if (!whatsappUrl || !isAllowedWhatsAppUrl(whatsappUrl)) {
        throw new Error(
          "The server did not return a valid WhatsApp contact link.",
        );
      }

      if (popup && !popup.closed) {
        popup.location.replace(whatsappUrl);
      } else {
        // Fallback for browsers that disallow pop-ups: continue in this tab.
        window.location.assign(whatsappUrl);
      }
    } catch (requestError) {
      try {
        if (popup && !popup.closed) popup.close();
      } catch {
        // No action is needed if the browser has already closed the window.
      }

      setError(
        requestError?.message ||
          `Unable to open a private chat with ${authorName}. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleContact}
        disabled={loading}
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-extrabold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50 ${
          compact ? "w-auto" : "w-full sm:w-auto"
        }`}
        aria-label={`Start a private WhatsApp chat with ${authorName}`}
      >
        {loading ? (
          <LoaderCircle size={15} className="animate-spin" />
        ) : (
          <MessageCircle size={15} />
        )}
        {loading ? "Opening WhatsApp…" : "Private chat on WhatsApp"}
      </button>

      {error ? (
        <p
          role="alert"
          className="mt-2 text-xs leading-5 text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
