import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Copy, HelpCircle,
  Library, RefreshCw, ShieldCheck, Sparkles, Lightbulb,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE = String(import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/+$/, "");

const PAGE_META = {
  quarterly: { title: "SDA Quarterly", description: "Sabbath School lessons, weekly readings and class preparation.", chips: ["Sabbath School", "Weekly lesson", "KJV"], action: "Open today's lesson", placeholder: "Ask about this week's lesson or memory verse…" },
  bible: { title: "Bible", description: "Read Scripture, compare passages and record your observations.", chips: ["Scripture", "Cross references", "KJV"], action: "Continue reading", placeholder: "Ask about a verse, passage or biblical word…" },
  prophecy: { title: "Prophecy", description: "Investigate prophetic passages, historic context and interpretive views.", chips: ["Daniel", "Revelation", "Interpretive views"], action: "Open prophecy study", placeholder: "Ask about a prophecy, symbol or timeline…" },
  events: { title: "Events", description: "Review world developments with sources and careful biblical context.", chips: ["World events", "Source review", "Context"], action: "Refresh events", placeholder: "Ask about an event and its biblical context…" },
  referential: { title: "Referential", description: "Trace themes and connections across the biblical text.", chips: ["Themes", "Cross references", "Study chain"], action: "Explore references", placeholder: "Ask how passages or themes connect…" },
  missionpulse: { title: "MissionPulse", description: "Coordinate church outreach, community care and measurable mission.", chips: ["Church mission", "Community care", "Outreach"], action: "New outreach", placeholder: "Ask about mission planning, service or outreach…" },
  academy: { title: "Faith Academy", description: "Structured courses, lessons, assessments and study groups.", chips: ["Courses", "Lessons", "Learning"], action: "Browse courses", placeholder: "Ask about a course, lesson or study method…" },
  atlas: { title: "Faith Atlas", description: "Explore linked Bible topics while keeping interpretation clearly labeled.", chips: ["Daniel", "Revelation", "Study map"], action: "Explore Atlas", placeholder: "Ask how these passages or themes connect…" },
  library: { title: "Study Library", description: "Browse published study materials and source-linked resources.", chips: ["Materials", "Research", "Saved"], action: "Browse materials", placeholder: "Ask about a study resource or topic…" },
  "word-roots": { title: "Ancient Word Roots", description: "Study biblical words in their language, grammar and context.", chips: ["Hebrew", "Greek", "Language"], action: "Explore word roots", placeholder: "Ask about a Hebrew or Greek word…" },
};

function stringifyContext(contextType, contextData) {
  const data = contextData && typeof contextData === "object" ? contextData : {};
  const details = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => key + ": " + (typeof value === "string" ? value : JSON.stringify(value)))
    .join(" · ");
  return "Faith workspace: " + (contextType || "faith") + (details ? " · " + details : "");
}

function needsDeepStudy(question) {
  const words = String(question || "").trim().split(/\s+/).filter(Boolean);
  const questionMarks = (String(question || "").match(/\?/g) || []).length;
  return words.length > 25 || questionMarks >= 2 || /\b(compare|explain\s+in\s+depth|history\s+of|write)\b/i.test(question);
}

function normalizeSources(payload) {
  const list = Array.isArray(payload?.sources) ? payload.sources : Array.isArray(payload?.data?.sources) ? payload.data.sources : Array.isArray(payload?.meta?.sources) ? payload.meta.sources : Array.isArray(payload?.data?.meta?.sources) ? payload.data.meta.sources : [];
  return list.map((source, index) => {
    const url = String(source?.url || source?.uri || source?.link || "").trim();
    return {
      id: String(source?.id || source?.source_id || index),
      label: String(source?.label || source?.title || source?.name || source?.source || "Source " + (index + 1)),
      url: /^https?:\/\//i.test(url) ? url : "",
    };
  });
}

export function AIHandoffBar({ question, contextType, contextData, onOpenAI }) {
  const [copied, setCopied] = useState(false);
  const contextLine = stringifyContext(contextType, contextData);
  const copyText = String(question || "").trim() + "\n" + contextLine;

  const copyQuestion = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      try {
        const field = document.createElement("textarea");
        field.value = copyText;
        field.setAttribute("readonly", "true");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const ok = document.execCommand("copy");
        field.remove();
        if (!ok) throw new Error("copy_failed");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        setCopied(false);
      }
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-indigo-100 bg-white p-3 dark:border-indigo-900/50 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Continue this question in RevelaAI</p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{contextLine}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={() => onOpenAI?.({ question: String(question || "").trim(), contextType, contextData })} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:flex-none">
          <Sparkles size={15} /> Open in RevelaAI
        </button>
        <button type="button" onClick={copyQuestion} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 sm:flex-none">
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy question"}
        </button>
      </div>
    </div>
  );
}

export function InlineAskBar({ contextType = "faith", contextData = {}, placeholder = "Ask a question about this workspace…", onOpenAI }) {
  const { authFetch } = useAuth();
  const [question, setQuestion] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [visibleAnswer, setVisibleAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [deepStudy, setDeepStudy] = useState(false);
  const abortRef = useRef(null);
  const contextLine = useMemo(() => stringifyContext(contextType, contextData), [contextType, contextData]);

  useEffect(() => {
    if (!answer) { setVisibleAnswer(""); return undefined; }
    let cursor = 0;
    setVisibleAnswer("");
    const timer = window.setInterval(() => {
      cursor = Math.min(answer.length, cursor + 7);
      setVisibleAnswer(answer.slice(0, cursor));
      if (cursor >= answer.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [answer]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async (event) => {
    event?.preventDefault?.();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || busy) return;
    if (needsDeepStudy(cleanQuestion)) {
      setDeepStudy(true); setError(""); setAnswer(""); setSources([]);
      return;
    }

    setDeepStudy(false); setError(""); setRateLimited(false); setAnswer(""); setSources([]);
    if (typeof authFetch !== "function") {
      setError("Sign in or reconnect your session to ask RevelaAI. Your question is still here.");
      return;
    }

    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const stamp = String(Date.now());
    const contextPrompt = [
      "You are answering a short question inside RevelaCode Faith.",
      "Use a Seventh-day Adventist-first framing while accurately representing the biblical text and credible evidence.",
      "Keep the answer to about 120 words maximum.",
      "Cite identifiable sources or Bible references and return source metadata when available.",
      "Clearly label interpretive claims with labels such as 'Historicist view' and 'Interpretation, not fact'.",
      "Do not present contested interpretations, current-event matches, or speculation as established fact.",
      "If evidence is uncertain, say so briefly.",
      contextLine,
      "PAGE CONTEXT DATA: " + JSON.stringify(contextData || {}),
    ].join("\n");

    try {
      const response = await authFetch(API_BASE + "/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: cleanQuestion,
          hub: "faith",
          sessionId: "faith-inline-" + String(contextType) + "-" + stamp,
          conversationId: "faith-inline-" + String(contextType) + "-" + stamp,
          context: [
            { role: "system", content: contextPrompt },
            { role: "user", content: cleanQuestion },
          ],
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 429) {
        setRateLimited(true);
        throw new Error("You have reached the AI question allowance for your current plan. Your study content is still available.");
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("Your session needs attention before RevelaAI can answer. Your question has been kept.");
      }
      if (!response.ok) {
        throw new Error(response.status >= 500 ? "RevelaAI is temporarily unavailable. Please retry in a moment." : (payload?.message || payload?.error?.message || "RevelaAI could not answer that question."));
      }
      const result = payload?.data || payload || {};
      const text = result?.response || result?.content || result?.answer || result?.text || payload?.response || payload?.answer || payload?.message;
      if (typeof text !== "string" || !text.trim()) throw new Error("RevelaAI returned an empty answer. Please retry.");
      const cleanAnswer = text.trim();
      const words = cleanAnswer.split(/\s+/).filter(Boolean);
      setSources(normalizeSources(payload));
      setAnswer(words.length > 120 ? words.slice(0, 120).join(" ") + "…" : cleanAnswer);
    } catch (requestError) {
      if (requestError?.name !== "AbortError") setError(requestError?.message || "The answer could not be loaded. Please retry.");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const retry = () => { setError(""); setDeepStudy(false); void submit(); };
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(event); }
  };

  return (
    <section className="rounded-2xl border border-indigo-200 bg-white p-3 shadow-sm dark:border-indigo-900/50 dark:bg-slate-900 sm:p-4" aria-label="Ask RevelaAI about this page">
      <form onSubmit={submit} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><Sparkles size={19} /></span>
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">Ask RevelaAI · {String(contextType).replaceAll("-", " ")}</span>
            <textarea rows={expanded ? 3 : 1} maxLength={1200} value={question} onChange={(event) => setQuestion(event.target.value)} onFocus={() => setExpanded(true)} onBlur={() => { if (!question.trim()) setExpanded(false); }} onKeyDown={handleKeyDown} placeholder={placeholder} aria-label={placeholder} className="max-h-24 min-h-11 w-full resize-none rounded-xl border border-transparent bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus-visible:border-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500" />
            <span className="mt-1 block text-[10px] text-slate-400">Enter to ask · Shift + Enter for a new line</span>
          </label>
        </div>
        <button type="submit" disabled={busy || !question.trim()} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />} {busy ? "Thinking" : "Ask"}
        </button>
      </form>

      {busy && <div className="mt-3 animate-pulse rounded-xl bg-slate-50 p-4 dark:bg-slate-950" role="status" aria-live="polite"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><Sparkles size={14} /> Thinking through the passage…</div><div className="h-3 w-11/12 rounded bg-slate-200 dark:bg-slate-800" /><div className="mt-2 h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-800" /><div className="mt-2 h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" /></div>}

      {deepStudy && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20"><p className="text-sm font-semibold text-amber-950 dark:text-amber-100">This needs a deeper study</p><p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200">This question is broader than the short-answer bar. Continue it in RevelaAI with the page context attached.</p><AIHandoffBar question={question} contextType={contextType} contextData={contextData} onOpenAI={onOpenAI} /></div>}

      {error && !busy && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-950/20" role="alert"><div className="flex items-start gap-2"><HelpCircle size={16} className="mt-0.5 shrink-0 text-rose-700 dark:text-rose-300" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-rose-900 dark:text-rose-100">{rateLimited ? "AI plan limit reached" : "We couldn't load that answer"}</p><p className="mt-1 text-xs leading-5 text-rose-800 dark:text-rose-200">{error}</p><div className="mt-3 flex flex-wrap gap-2">{!rateLimited && <button type="button" onClick={retry} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><RefreshCw size={14} /> Retry</button>}{rateLimited && <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("revelacode:premium-open", { detail: { planCode: "" } }))} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">View plans <ArrowRight size={14} /></button>}</div><AIHandoffBar question={question} contextType={contextType} contextData={contextData} onOpenAI={onOpenAI} /></div></div></div>}

      {answer && !busy && <div className="mt-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">RevelaAI · Short answer</p><span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"><ShieldCheck size={12} /> SDA-first framing</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800 dark:text-slate-100">{visibleAnswer}</p>{sources.length > 0 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Answer sources">{sources.map((source) => source.url ? <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 max-w-full items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-800 transition-all duration-200 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-900/60 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-indigo-950/50"><Library size={12} /><span className="line-clamp-1">{source.label}</span></a> : <span key={source.id} className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{source.label}</span>)}</div>}{/\binterpretation|historicist|view\b/i.test(answer) && <p className="mt-3 text-[10px] font-semibold text-amber-700 dark:text-amber-300">Interpretive claims are study perspectives, not established facts.</p>}<AIHandoffBar question={question} contextType={contextType} contextData={contextData} onOpenAI={onOpenAI} /></div>}
    </section>
  );
}

export function WorkspaceHeader({ page, title, description, filterChips, primaryActionLabel, onPrimaryAction, onBack, backLabel = "Back to Faith", primaryDisabled = false }) {
  const meta = PAGE_META[page] || {};
  const chips = Array.isArray(filterChips) ? filterChips : (meta.chips || []);
  const heading = title || meta.title || "Faith workspace";
  const intro = description || meta.description || "Study, reflect and explore Scripture.";
  const action = primaryActionLabel || meta.action || "Continue";
  return (
    <header className="sticky top-0 z-30 -mx-1 rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        {onBack && <button type="button" onClick={onBack} aria-label={backLabel} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-all duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 sm:hidden"><ArrowLeft size={18} /></button>}
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[10px] font-semibold text-slate-400"><span>Faith</span><span aria-hidden="true">/</span><span className="truncate text-indigo-700 dark:text-indigo-300">{heading}</span></nav>
          <div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">{heading}</h1><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">Faith</span></div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{intro}</p>
          {chips.length > 0 && <div className="mt-2 flex max-w-full gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{chips.map((chip, index) => { const item = typeof chip === "string" ? { label: chip } : chip; return <span key={item.id || item.label || index} className="inline-flex min-h-8 shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{item.label || item}</span>; })}</div>}
        </div>
        <button type="button" onClick={onPrimaryAction} disabled={primaryDisabled || !onPrimaryAction} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"><ArrowRight size={15} /><span className="hidden max-w-28 truncate sm:inline">{action}</span><span className="sm:hidden">{action.split(" ").slice(0, 2).join(" ")}</span></button>
      </div>
    </header>
  );
}

const PANEL_COPY = {
  quarterly: { title: "Lesson companion", items: ["Read the Bible passage before the commentary.", "Write one observation and one question for class.", "Keep the memory verse in its immediate context."] },
  bible: { title: "Study references", items: ["Read the surrounding paragraph.", "Compare cross-references in context.", "Record observation before interpretation."] },
  prophecy: { title: "Interpretation guide", items: ["Start with the passage and its literary setting.", "Separate historical evidence from theological interpretation.", "Label views rather than presenting them as facts."] },
  events: { title: "Source check", items: ["Open the original publisher report.", "Check the publication date and primary evidence.", "A current event match does not prove prophetic fulfilment."] },
  referential: { title: "Build a study chain", items: ["Record the shared theme between passages.", "Read each passage in its own literary context.", "Save the link and the reason for connecting it."] },
  missionpulse: { title: "Mission focus", items: ["Keep care requests confidential and consent-based.", "Assign a clear owner and follow-up date.", "Measure service delivered, not only activities planned."] },
  academy: { title: "Learning guide", items: ["Set one learning goal for this session.", "Support conclusions with passage references.", "Use notes to capture questions for group study."] },
  atlas: { title: "Atlas reading guide", items: ["Start with the quoted biblical passage.", "Follow links only where the text supports them.", "Keep each interpretation clearly labeled for investigation."] },
  library: { title: "Research checklist", items: ["Check author, publication and date.", "Follow the primary source when one is cited.", "Save the key passage and your own summary."] },
  "word-roots": { title: "Word study method", items: ["Check the original lemma and morphology.", "Read the word in its sentence and book context.", "Do not derive doctrine from etymology alone."] },
};
const PANEL_TABS = { bible: ["Cross-references", "Word roots", "EGW", "My notes"] };

export function StudyPanel({ page = "faith", contextData = {}, tabs }) {
  const { user } = useAuth();
  const noteOwner = String(user?.id || user?._id || user?.user_id || "guest");
  const panelTabs = tabs || PANEL_TABS[page] || ["Study guide", "My notes"];
  const [activeTab, setActiveTab] = useState(panelTabs[0]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const storageKey = "revelacode_faith_workspace_note_v1_" + noteOwner + "_" + String(page);

  useEffect(() => { try { setNote(localStorage.getItem(storageKey) || ""); } catch { setNote(""); } }, [storageKey]);

  const copy = PANEL_COPY[page] || PANEL_COPY.bible;
  const isNotesTab = /my notes|notes/i.test(activeTab);
  const saveNote = (value) => { setNote(value); setSaved(false); try { localStorage.setItem(storageKey, value); setSaved(true); } catch { setSaved(false); } };

  return (
    <aside className="min-w-0 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><BookOpen size={18} /></span><div className="min-w-0"><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Study panel</h2><p className="text-[10px] text-slate-500 dark:text-slate-400">{copy.title}</p></div></div>
      <div className="mt-4 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Study panel sections">{panelTabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={"min-h-10 shrink-0 rounded-lg px-2.5 text-[10px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 " + (activeTab === tab ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/50")}>{tab}</button>)}</div>
      {isNotesTab ? <div className="mt-3"><label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor={"faith-note-" + page}>Personal study notes</label><textarea id={"faith-note-" + page} value={note} onChange={(event) => saveNote(event.target.value)} rows={7} placeholder="Write an observation, question or application…" className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /><p className="mt-2 inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">{saved ? <Check size={12} className="text-emerald-600" /> : <Clock3 size={12} />}{saved ? "Saved on this device" : "Autosave available on this device"}</p></div> : <div className="mt-3 space-y-2">{(page === "bible" && activeTab === "Cross-references" ? ["Read the parallel passage in its own setting.", "Compare repeated words and themes."] : page === "bible" && activeTab === "Word roots" ? ["Check lemma, morphology and a lexicon entry.", "Read the word in the complete sentence."] : page === "bible" && activeTab === "EGW" ? ["Open a reviewed Ellen G. White source.", "Compare the quotation with its cited biblical passage."] : copy.items).map((item) => <div key={item} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-950 dark:text-slate-300"><Lightbulb size={14} className="mt-0.5 shrink-0 text-indigo-500" /><span>{item}</span></div>)}{contextData?.reference && <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20"><p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Current reference</p><p className="mt-1 text-sm font-semibold text-indigo-950 dark:text-indigo-100">{contextData.reference}</p></div>}</div>}
    </aside>
  );
}

export default function FaithWorkspaceLayout({ page, title, description, filterChips, primaryActionLabel, onPrimaryAction, onBack, onOpenAI, contextData = {}, placeholder, children, panelTabs, panel = true }) {
  const meta = PAGE_META[page] || {};
  return (
    <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-4 overflow-x-hidden pb-24 sm:space-y-5 sm:px-1 sm:pb-6">
      <WorkspaceHeader page={page} title={title} description={description} filterChips={filterChips} primaryActionLabel={primaryActionLabel} onPrimaryAction={onPrimaryAction} onBack={onBack} />
      <InlineAskBar contextType={page} contextData={contextData} placeholder={placeholder || meta.placeholder} onOpenAI={onOpenAI} />
      <div className={panel ? "grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]" : "min-w-0"}>
        <main className="min-w-0 space-y-4">{children}</main>
        {panel && <StudyPanel page={page} contextData={contextData} tabs={panelTabs} />}
      </div>
    </div>
  );
}

export { AIHandoffBar };
