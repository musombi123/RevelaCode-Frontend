import React, { useMemo, useState } from "react";
import { ExternalLink, Link2, Share2, Users, X } from "lucide-react";
import { savePendingCommunityShareDraft } from "@/lib/communityShare.js";

function normalizeHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function defaultHubUrl(hub) {
  if (typeof window === "undefined") return "";
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("hub", String(hub || "home"));
    return url.toString();
  } catch {
    return window.location.href;
  }
}

export default function HubShareAction({
  activeHub,
  activeHubLabel,
  onNavigate,
}) {
  const hubKey = String(activeHub || "").trim().toLowerCase();
  const hubLabel = String(activeHubLabel || hubKey || "RevelaCode").trim();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [workUrl, setWorkUrl] = useState(() => defaultHubUrl(hubKey));
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const safeUrl = useMemo(() => normalizeHttpUrl(workUrl), [workUrl]);
  const canShare = Boolean(title.trim() && summary.trim() && (!workUrl.trim() || safeUrl) && !busy);

  if (!hubKey || ["home", "community"].includes(hubKey)) return null;

  const openShare = () => {
    setFeedback("");
    setTitle((current) => current || `${hubLabel} update`);
    setWorkUrl((current) => current || defaultHubUrl(hubKey));
    setOpen(true);
  };

  const shareText = () => [
    summary.trim(),
    `Shared from ${hubLabel} on RevelaCode.`,
  ].filter(Boolean).join("\n\n");

  const copyShare = async (value, successMessage) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
      await navigator.clipboard.writeText(value);
      setFeedback(successMessage);
    } catch {
      setFeedback("Copying is unavailable in this browser. Select and copy the link above.");
    }
  };

  const publishToCommunity = () => {
    setFeedback("");
    if (!canShare) {
      setFeedback(workUrl.trim() && !safeUrl ? "Enter a valid http:// or https:// link, or clear the link field." : "Add a title and a short description before sharing.");
      return;
    }
    const saved = savePendingCommunityShareDraft({
      title: title.trim(),
      body: shareText(),
      sourceHub: hubKey,
      sourceHubLabel: hubLabel,
      sourceUrl: safeUrl,
    });
    if (!saved) {
      setFeedback("This browser could not prepare the Community draft. Check storage permissions and try again.");
      return;
    }
    setOpen(false);
    if (typeof onNavigate === "function") {
      onNavigate("community");
    } else {
      setFeedback("The Community destination is not available from this workspace.");
    }
  };

  const shareOutside = async () => {
    if (!canShare) {
      setFeedback(workUrl.trim() && !safeUrl ? "Enter a valid http:// or https:// link, or clear the link field." : "Add a title and a short description before sharing.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      const payload = {
        title: title.trim(),
        text: safeUrl ? `${shareText()}\n\n${safeUrl}` : shareText(),
        ...(safeUrl ? { url: safeUrl } : {}),
      };
      if (typeof navigator.share === "function") {
        await navigator.share(payload);
        setFeedback("The system share sheet was opened.");
      } else {
        await copyShare(`${payload.title}\n\n${payload.text}`, "Your share text and link were copied. Paste them into the platform you use.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        try {
          await copyShare(`${title.trim()}\n\n${shareText()}\n\n${safeUrl}`.trim(), "Your share text and link were copied.");
        } catch {
          setFeedback(error?.message || "Sharing is unavailable right now.");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openShare}
        aria-label={`Share work from ${hubLabel}`}
        title="Share work"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-2.5 text-[11px] font-extrabold text-cyan-800 transition hover:border-cyan-400 hover:bg-cyan-500/15 dark:text-cyan-200 sm:px-3"
      >
        <Share2 size={15} />
        <span className="hidden sm:inline">Share work</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[11000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="hub-share-title"
            className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:rounded-3xl sm:p-6"
          >
            <header className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                <Share2 size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">{hubLabel} workspace</p>
                <h2 id="hub-share-title" className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-white">Share what you’ve been working on</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Prepare a short update, then publish it to Community or share it through another app.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close share panel" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">
                <X size={18} />
              </button>
            </header>

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value.slice(0, 180))}
                  maxLength={180}
                  placeholder="Give your work a clear title"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                What would you like people to know?
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value.slice(0, 8000))}
                  maxLength={8000}
                  rows={5}
                  placeholder="Share the result, an insight, a question, or what you learned. Keep private information out of the post."
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
                <span className="mt-1 block text-right text-[10px] font-medium text-slate-400">{summary.length}/8000</span>
              </label>

              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Link to your work <span className="font-normal text-slate-400">(optional)</span>
                <span className="relative mt-1.5 block">
                  <Link2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={workUrl}
                    onChange={(event) => setWorkUrl(event.target.value)}
                    placeholder="https://…"
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  />
                </span>
                {workUrl.trim() && !safeUrl ? <span className="mt-1 block text-[10px] font-semibold text-rose-600">Use a valid http:// or https:// link.</span> : null}
              </label>
            </div>

            {feedback ? <p role="status" className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 text-xs leading-5 text-slate-700 dark:text-cyan-100">{feedback}</p> : null}

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={publishToCommunity}
                disabled={!canShare}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Users size={16} /> Publish to Community
              </button>
              <button
                type="button"
                onClick={shareOutside}
                disabled={!canShare}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition hover:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ExternalLink size={16} /> Share outside RevelaCode
              </button>
            </div>
            <p className="mt-3 text-[10px] leading-4 text-slate-400">Only share information you are allowed to make public. Publishing to Community opens a prefilled post; you review and publish it yourself.</p>
          </section>
        </div>
      ) : null}
    </>
  );
}
