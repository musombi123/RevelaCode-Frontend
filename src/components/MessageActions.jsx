import React, { useCallback, useState } from "react";
import {
  Copy,
  Check,
  Download,
  Share2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from "lucide-react";

function ActionButton({ label, onClick, active = false, activeClass = "text-emerald-400", children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-white/10 ${
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

  const handleDownload = useCallback(() => {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `revelaai-response-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [text]);

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

          <ActionButton label="Download" onClick={handleDownload}>
            <Download size={14} />
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