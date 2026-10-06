// src/components/MessageActions.jsx

import React, { useCallback, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { downloadAsPdf } from "@/components/utils/exportPdf";

function ActionButton({
  label,
  onClick,
  active = false,
  activeClass = "text-emerald-400",
  disabled = false,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-white/10 disabled:cursor-wait ${
        active ? activeClass : "text-gray-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function MessageActions({
  message,
  regenerableId,
  onRegenerate,
  onFeedback,
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  const text = message.text || "";
  const isError = message.status === "error";
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers / non-secure contexts
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  const handleDownload = useCallback(async () => {
    if (downloading) return;

    setDownloading(true);
    setDownloadFailed(false);

    try {
      await downloadAsPdf(text);
    } catch (error) {
      console.error("❌ PDF export failed:", error);
      setDownloadFailed(true);
      setTimeout(() => setDownloadFailed(false), 2500);
    } finally {
      setDownloading(false);
    }
  }, [text, downloading]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share({ title: "RevelaAI", text });
    } catch {
      // User cancelled the share sheet
    }
  }, [text]);

  return (
    <div className="mt-1.5 flex items-center gap-0.5">
      {!isError && (
        <>
          <ActionButton label={copied ? "Copied" : "Copy"} onClick={handleCopy}>
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </ActionButton>

          <ActionButton
            label={downloadFailed ? "Download failed, try again" : "Download PDF"}
            onClick={handleDownload}
            disabled={downloading}
            active={downloadFailed}
            activeClass="text-red-400"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
          </ActionButton>

          {canShare && (
            <ActionButton label="Share" onClick={handleShare}>
              <Share2 size={14} />
            </ActionButton>
          )}

          <ActionButton
            label="Good response"
            active={message.feedback === "like"}
            onClick={() => onFeedback?.(message.id, "like")}
          >
            <ThumbsUp size={14} />
          </ActionButton>

          <ActionButton
            label="Bad response"
            active={message.feedback === "dislike"}
            activeClass="text-red-400"
            onClick={() => onFeedback?.(message.id, "dislike")}
          >
            <ThumbsDown size={14} />
          </ActionButton>
        </>
      )}

      {regenerableId === message.id && (
        <ActionButton
          label={isError ? "Try again" : "Refresh answer"}
          onClick={() => onRegenerate?.(message.id)}
        >
          <RefreshCw size={14} />
        </ActionButton>
      )}
    </div>
  );
}