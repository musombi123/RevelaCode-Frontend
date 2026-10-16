import React, { useCallback, useState } from "react";
import { ExternalLink, LoaderCircle, MessageCircle } from "lucide-react";

import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

export default function WhatsAppButton({ memberId, postId, compact = false }) {
  const { getCommunityWhatsAppContact } = useJumuiyaApi();
  const [loading, setLoading] = useState(false);
  const [contactUrl, setContactUrl] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const resolveContact = useCallback(async () => {
    const normalizedId = memberId === undefined || memberId === null
      ? ""
      : String(memberId).trim();

    if (!normalizedId) {
      setMessage("This post does not include a verified member identity.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setContactUrl("");

    try {
      const response = await getCommunityWhatsAppContact(
        normalizedId,
        postId || null,
      );
      const available = response?.available ?? response?.data?.available;
      const candidateUrl = response?.contact_url ?? response?.data?.contact_url;

      if (!available || !candidateUrl) {
        setMessage("This member has not enabled private WhatsApp contact.");
        setMessageType("info");
        return;
      }

      let parsed;
      try {
        parsed = new URL(candidateUrl);
      } catch {
        throw new Error("The contact link returned by the server is invalid.");
      }

      if (parsed.protocol !== "https:" || parsed.hostname !== "wa.me") {
        throw new Error("The contact link returned by the server is not trusted.");
      }

      setContactUrl(parsed.toString());
      setMessage("Private contact is available. Open WhatsApp when you're ready.");
      setMessageType("success");
    } catch (error) {
      setMessage(error?.message || "WhatsApp contact is temporarily unavailable.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [getCommunityWhatsAppContact, memberId, postId]);

  return (
    <div className="mt-3 min-w-0">
      {!contactUrl ? (
        <button
          type="button"
          onClick={resolveContact}
          disabled={loading}
          className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-extrabold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50 ${compact ? "w-full sm:w-auto" : ""}`}
        >
          {loading ? <LoaderCircle size={14} className="animate-spin" /> : <MessageCircle size={14} />}
          {loading ? "Checking contact…" : "Ask to chat on WhatsApp"}
        </button>
      ) : (
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-extrabold text-white transition hover:bg-emerald-700"
        >
          <MessageCircle size={14} />
          Open WhatsApp chat
          <ExternalLink size={12} />
        </a>
      )}

      {message ? (
        <p
          role="status"
          className={`mt-2 text-[10px] leading-4 ${messageType === "error" ? "text-rose-600 dark:text-rose-300" : messageType === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
