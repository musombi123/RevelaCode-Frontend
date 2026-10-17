// src/components/MessageActions.jsx

import React, { useCallback, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Share2,
  Trash2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { downloadSmartOutput, inferOutputFormat } from "@/components/utils/smartExport";

function ActionButton({
  label,
  onClick,
  active = false,
  activeClass = "text-emerald-400",
  danger = false,
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
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/10 disabled:cursor-wait ${
        active ? activeClass : danger ? "text-red-400 hover:text-red-300" : "text-gray-500 hover:text-white"
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
  onDelete,
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [downloadLabel, setDownloadLabel] = useState("");

  const text = message.text || "";
  const isError = message.status === "error";
  const outputFormat = inferOutputFormat(message.sourcePrompt || "", text);
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";
  const sourcePrompt = String(message.sourcePrompt || "");
  const outputType = String(message.contentType || message.metadata?.outputType || message.metadata?.renderType || "");
  const explicitChartMarkup =
    /(?:\x60\x60\x60\s*(?:mermaid|chart|vega|vegalite)|\b(?:bar chart|line chart|pie chart|scatter plot|flowchart)\b|\b(?:chart|graph|plot|visualization)\b.{0,70}\b(?:data|series|axis|trend|bar|line|pie|values)\b)/i.test(text);
  const chartIntent = /\b(?:chart|graph|plot|visuali[sz]ation|data dashboard)\b/i.test(sourcePrompt);
  const chartTypeHint = [
    message.contentType,
    message.metadata?.outputType,
    message.metadata?.visualizationType,
    message.metadata?.chartType,
    message.metadata?.renderAs,
  ].filter(Boolean).join(" ");
  const isChartOutput =
    explicitChartMarkup ||
    /\b(?:chart|graph|plot|visuali[sz]ation|mermaid|vega)\b/i.test(outputType) ||
    (chartIntent && (
      (Array.isArray(message.imageUrls) && message.imageUrls.length > 0) ||
      /\b(?:image|visual|graphic)\b/i.test(outputType) ||
      /\b(?:chart|graph|plot|visuali[sz]ation)\b/i.test(text)
    )) ||
    /(?:```\s*(?:mermaid|chart|vega|vegalite|echarts|plotly|graphviz)\b|\b(?:bar chart|line chart|pie chart|scatter plot|flowchart|data visualization)\b|\b(?:chart|graph|plot|visualization)\b.{0,80}\b(?:data|series|axis|trend|bar|line|pie|render|display|show)\b)/i.test(text) ||
    /\b(?:chart|graph|visualization|plot)\b/i.test(chartTypeHint) ||
    Boolean(message.chart || message.visualization || message.metadata?.chart || message.metadata?.visualization);
  const handleDelete = useCallback(() => {
    if (!isChartOutput || typeof onDelete !== "function") return;
    if (typeof window !== "undefined" && window.confirm("Delete this chart and its assistant response from this conversation?")) {
      onDelete(message.id);
    }
  }, [isChartOutput, onDelete, message.id]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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
      const result = await downloadSmartOutput({
        prompt: message.sourcePrompt || "",
        answer: text,
      });
      setDownloadLabel(result.label);
    } catch (error) {
      console.error("RevelaAI smart export failed:", error);
      setDownloadFailed(true);
      setTimeout(() => setDownloadFailed(false), 2500);
    } finally {
      setDownloading(false);
    }
  }, [text, downloading, message.sourcePrompt]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share({ title: "RevelaAI", text });
    } catch {
      // The user may cancel the native share sheet.
    }
  }, [text]);

  const downloadTitle = downloadFailed
    ? "Download failed, try again"
    : `Download as ${outputFormat.label}`;

  return (
    <div className="mt-1.5 flex items-center gap-0.5">
      {!isError && (
        <>
          <ActionButton label={copied ? "Copied" : "Copy"} onClick={handleCopy}>
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </ActionButton>

          <ActionButton
            label={downloadTitle}
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

          <span className="sr-only" aria-live="polite">
            {downloadLabel ? `Last export format: ${downloadLabel}` : `Suggested export format: ${outputFormat.label}`}
          </span>

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

      {isChartOutput && (
        <ActionButton
          label="Delete chart"
          onClick={handleDelete}
          activeClass="text-red-400"
          danger
        >
          <Trash2 size={14} />
        </ActionButton>
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
