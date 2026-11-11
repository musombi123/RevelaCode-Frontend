import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Copy, HelpCircle,
  HeartHandshake, Home, Library, RefreshCw, ShieldCheck, SlidersHorizontal,
  Sparkles, Lightbulb, UserCircle, WifiOff, X,
} from "lucide-react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
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

export function useFaithAndroidBack({ isHome = false, enabled = true, onBack, onBackAction, onPrompt } = {}) {
  const handlersRef = useRef({ isHome, enabled, onBack, onBackAction, onPrompt });
  const lastBackAtRef = useRef(0);
  useEffect(() => {
    handlersRef.current = { isHome, enabled, onBack, onBackAction, onPrompt };
  }, [isHome, enabled, onBack, onBackAction, onPrompt]);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    let nativeListener = null;
    const handleBack = async () => {
      const current = handlersRef.current;
      if (current.onBackAction?.()) return;
      if (!current.isHome) {
        current.onBack?.();
        return;
      }
      const now = Date.now();
      if (now - lastBackAtRef.current < 2200) {
        try { await CapacitorApp.exitApp(); } catch { current.onPrompt?.("Press back again to exit"); }
      } else {
        lastBackAtRef.current = now;
        current.onPrompt?.("Press back again to exit");
      }
    };
    CapacitorApp.addListener("backButton", handleBack).then((listener) => {
      if (!active) listener.remove();
      else nativeListener = listener;
    }).catch(() => {
      // The hook is also used in browsers where the native back event is absent.
    });
    return () => {
      active = false;
      nativeListener?.remove?.();
    };
  }, [enabled]);
}

export function FaithMobileBottomNav({
  active = "home",
  onHome,
  onStudy,
  onAskAI,
  onMission,
  onMe,
  hidden = false,
}) {
  if (hidden) return null;
  const keepDockInAndroidLandscape = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const items = [
    { key: "home", label: "Home", icon: Home, action: onHome },
    { key: "study", label: "Study", icon: BookOpen, action: onStudy },
    { key: "ask", label: "Ask AI", icon: Sparkles, action: onAskAI },
    { key: "mission", label: "Mission", icon: HeartHandshake, action: onMission },
    { key: "me", label: "Me", icon: UserCircle, action: onMe },
  ];
  return (
    <nav aria-label="Faith mobile navigation" className={"fixed inset-x-0 bottom-0 z-50 grid h-[calc(3.5rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/95 " + (keepDockInAndroidLandscape ? "" : "sm:hidden")}>
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.action}
            aria-label={item.label}
            aria-current={selected ? "page" : undefined}
            className={"flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[0.625rem] font-semibold transition-colors duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 " + (selected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400")}
          >
            <span className={"flex h-7 w-9 items-center justify-center rounded-xl " + (selected ? "bg-indigo-50 dark:bg-indigo-950/60" : "")}><Icon size={19} strokeWidth={selected ? 2.4 : 1.9} /></span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function FaithOfflineBanner({ offline = null }) {
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  const visible = offline === null ? isOffline : offline;
  if (!visible) return null;
  return (
    <div role="status" className="flex min-w-0 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <WifiOff size={15} className="shrink-0" />
      <span className="min-w-0">Offline mode · Cached study materials remain available. AI and live events need an internet connection.</span>
    </div>
  );
}

export function PullToRefreshSurface({ onRefresh, children, className = "" }) {
  const touchStart = useRef(null);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const start = (event) => {
    const scroller = document.scrollingElement;
    if ((scroller?.scrollTop || window.scrollY || 0) <= 2) {
      touchStart.current = event.touches?.[0]?.clientY ?? null;
    } else {
      touchStart.current = null;
    }
  };
  const end = async (event) => {
    if (touchStart.current === null) return;
    const endY = event.changedTouches?.[0]?.clientY ?? touchStart.current;
    const distance = endY - touchStart.current;
    touchStart.current = null;
    setPulling(false);
    if (distance < 76 || refreshing || typeof onRefresh !== "function") return;
    setPulling(false);
    setRefreshing(true);
    try { await onRefresh(); } finally { setRefreshing(false); }
  };
  return (
    <div
      className={"min-w-0 overscroll-y-contain " + className}
      onTouchStart={start}
      onTouchMove={(event) => { if (touchStart.current !== null && (event.touches?.[0]?.clientY ?? 0) - touchStart.current > 20) setPulling(true); }}
      onTouchEnd={end}
    >
      {(pulling || refreshing) && <div className="flex min-h-9 items-center justify-center gap-2 text-[0.6875rem] font-semibold text-indigo-700 dark:text-indigo-300" role="status"><RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Refreshing…" : "Release to refresh"}</div>}
      {children}
    </div>
  );
}

function SheetBackdrop({ onClose, children, labelledBy, onTouchStart, onTouchEnd }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" onClick={onClose} role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="w-full max-w-2xl overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        {children}
      </section>
    </div>
  );
}

export function AIHandoffBar({ question, contextType, contextData, onOpenAI, compact = false }) {
  const [copied, setCopied] = useState(false);
  const contextLine = stringifyContext(contextType, contextData);
  const copyText = String(question || "").trim() + "\n" + contextLine;

  const copyQuestion = async () => {
    try {
      try { sessionStorage.setItem("revelacode_faith_ai_draft", copyText); } catch { /* Clipboard can still work without session storage. */ }
      if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
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
        window.setTimeout(() => setCopied(false), 1200);
      } catch {
        setCopied(false);
      }
    }
  };

  const openAI = () => {
    try { sessionStorage.setItem("revelacode_faith_ai_handoff", JSON.stringify({ question: String(question || "").trim(), contextType, contextData })); } catch { /* Router state is the primary handoff. */ }
    onOpenAI?.({ question: String(question || "").trim(), contextType, contextData });
  };

  return (
    <div className={"flex min-w-0 flex-col gap-2 rounded-xl border border-indigo-100 bg-white p-3 dark:border-indigo-900/50 dark:bg-slate-900 " + (compact ? "" : "mt-3 sm:flex-row sm:items-center sm:justify-between")}>
      {!compact && <div className="min-w-0"><p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Continue this question in RevelaAI</p><p className="mt-1 line-clamp-2 text-[0.6875rem] leading-4 text-slate-500 dark:text-slate-400">{contextLine}</p></div>}
      <div className="flex w-full min-w-0 gap-2">
        <button type="button" onClick={openAI} className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-all duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><Sparkles size={15} /> Open in RevelaAI</button>
        <button type="button" onClick={copyQuestion} className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}</button>
      </div>
    </div>
  );
}

export function InlineAskBar({
  contextType = "faith",
  contextData = {},
  placeholder = "Ask a question about this workspace…",
  onOpenAI,
  onKeyboardVisibilityChange,
  onOverlayChange,
}) {
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const touchStart = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);
  const contextLine = useMemo(() => stringifyContext(contextType, contextData), [contextType, contextData]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => { window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); };
  }, []);

  useEffect(() => {
    if (!answer) { setVisibleAnswer(""); return undefined; }
    let cursor = 0;
    setVisibleAnswer("");
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setVisibleAnswer(answer);
      return undefined;
    }
    const timer = window.setInterval(() => {
      cursor = Math.min(answer.length, cursor + 7);
      setVisibleAnswer(answer.slice(0, cursor));
      if (cursor >= answer.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [answer]);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    const dismiss = () => { setSheetOpen(false); };
    window.addEventListener("revelacode:faith-dismiss-overlay", dismiss);
    return () => window.removeEventListener("revelacode:faith-dismiss-overlay", dismiss);
  }, []);
  useEffect(() => {
    onOverlayChange?.(sheetOpen);
    return () => { if (sheetOpen) onOverlayChange?.(false); };
  }, [sheetOpen, onOverlayChange]);

  const openSheet = () => { setSheetOpen(true); onOverlayChange?.(true); };
  const closeSheet = () => { setSheetOpen(false); onOverlayChange?.(false); };

  const submit = async (event) => {
    event?.preventDefault?.();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || busy) return;
    if (!online) {
      setDeepStudy(false);
      setRateLimited(false);
      setError("You are offline. Your study materials remain available, but RevelaAI needs an internet connection.");
      if (isMobile) openSheet();
      return;
    }
    if (needsDeepStudy(cleanQuestion)) {
      setDeepStudy(true);
      setError("");
      setAnswer("");
      setSources([]);
      if (isMobile) openSheet();
      return;
    }

    setDeepStudy(false);
    setError("");
    setRateLimited(false);
    setAnswer("");
    setSources([]);
    if (typeof authFetch !== "function") {
      setError("Sign in or reconnect your session to ask RevelaAI. Your question is still here.");
      if (isMobile) openSheet();
      return;
    }

    setBusy(true);
    if (isMobile) openSheet();
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
      if (isMobile) openSheet();
    } catch (requestError) {
      if (requestError?.name !== "AbortError") {
        setError(requestError?.message || "The answer could not be loaded. Please retry.");
        if (isMobile) openSheet();
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const retry = () => { setError(""); setDeepStudy(false); void submit(); };
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(event); }
  };
  const onFocus = () => {
    setExpanded(true);
    onKeyboardVisibilityChange?.(true);
    window.setTimeout(() => textareaRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" }), 120);
  };
  const onBlur = () => {
    window.setTimeout(() => {
      const viewport = window.visualViewport;
      const keyboardVisible = viewport ? window.innerHeight - viewport.height > 120 : document.activeElement === textareaRef.current;
      onKeyboardVisibilityChange?.(keyboardVisible);
    }, 160);
    if (!question.trim()) setExpanded(false);
  };

  const sourceChips = sources.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Answer sources">
      {sources.map((source) => source.url
        ? <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 max-w-full items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-[0.6875rem] font-semibold text-indigo-800 transition-colors active:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-900/60 dark:bg-slate-900 dark:text-indigo-200"><Library size={12} /><span className="line-clamp-1">{source.label}</span></a>
        : <span key={source.id} className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[0.6875rem] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{source.label}</span>
      )}
    </div>
  );

  const answerContent = (
    <div className="min-w-0">
      {busy && <div className="animate-pulse motion-reduce:animate-none rounded-xl bg-slate-50 p-4 dark:bg-slate-950" role="status" aria-live="polite"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><Sparkles size={14} /> Thinking through the passage…</div><div className="h-3 w-11/12 rounded bg-slate-200 dark:bg-slate-800" /><div className="mt-2 h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-800" /><div className="mt-2 h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" /></div>}
      {deepStudy && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20"><p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Need a deeper study?</p><p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200">This question is broader than the short-answer bar. Continue it in RevelaAI with the page context attached.</p><AIHandoffBar compact question={question} contextType={contextType} contextData={contextData} onOpenAI={onOpenAI} /></div>}
      {error && !busy && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-950/20" role="alert"><div className="flex items-start gap-2"><HelpCircle size={16} className="mt-0.5 shrink-0 text-rose-700 dark:text-rose-300" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-rose-900 dark:text-rose-100">{rateLimited ? "AI plan limit reached" : "We couldn't load that answer"}</p><p className="mt-1 text-xs leading-5 text-rose-800 dark:text-rose-200">{error}</p><div className="mt-3 flex flex-wrap gap-2">{!rateLimited && online && <button type="button" onClick={retry} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><RefreshCw size={14} /> Retry</button>}{rateLimited && <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("revelacode:premium-open", { detail: { planCode: "" } }))} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">View plans <ArrowRight size={14} /></button>}</div><AIHandoffBar compact question={question} contextType={contextType} contextData={contextData} onOpenAI={onOpenAI} /></div></div></div>}
      {answer && !busy && <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">RevelaAI · Short answer</p><span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-[0.625rem] font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"><ShieldCheck size={12} /> SDA-first framing</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800 dark:text-slate-100">{visibleAnswer}</p>{sourceChips}{/\binterpretation|historicist|view\b/i.test(answer) && <p className="mt-3 text-[0.625rem] font-semibold text-amber-700 dark:text-amber-300">Interpretive claims are study perspectives, not established facts.</p>}<AIHandoffBar compact question={question} contextType={contextType} contextData={contextData} onOpenAI={onOpenAI} /></div>}
    </div>
  );

  return (
    <section className="min-w-0 rounded-2xl border border-indigo-200 bg-white p-3 shadow-sm dark:border-indigo-900/50 dark:bg-slate-900 sm:p-4" aria-label="Ask RevelaAI about this page">
      <form onSubmit={submit} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><Sparkles size={19} /></span>
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[0.625rem] font-bold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">Ask RevelaAI · {String(contextType).replaceAll("-", " ")}</span>
            <textarea ref={textareaRef} rows={expanded ? 3 : 1} maxLength={1200} value={question} onChange={(event) => setQuestion(event.target.value)} onFocus={onFocus} onBlur={onBlur} onKeyDown={handleKeyDown} placeholder={placeholder} aria-label={placeholder} className="max-h-24 min-h-11 w-full resize-none rounded-xl border border-transparent bg-slate-50 px-3 py-2.5 text-base leading-5 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus-visible:border-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-500 sm:text-sm dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500" />
            <span className="mt-1 block text-[0.625rem] text-slate-400">Enter to ask · Shift + Enter for a new line</span>
          </label>
        </div>
        <button type="submit" disabled={busy || !question.trim() || !online} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <RefreshCw size={16} className="animate-spin motion-reduce:animate-none" /> : <Sparkles size={16} />} {busy ? "Thinking" : !online ? "Offline" : "Ask"}</button>
      </form>
      {!online && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[0.6875rem] leading-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">AI questions are paused while offline. You can continue reading cached materials.</p>}
      {(answer || error || deepStudy) && !sheetOpen && isMobile && <button type="button" onClick={openSheet} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200"><Sparkles size={14} /> View answer</button>}
      {!isMobile && (busy || answer || error || deepStudy) && <div className="mt-3">{answerContent}</div>}

      {isMobile && sheetOpen && (
        <SheetBackdrop
          onClose={closeSheet}
          labelledBy="faith-ai-answer-title"
          onTouchStart={(event) => { touchStart.current = event.touches?.[0]?.clientY ?? null; }}
          onTouchEnd={(event) => { const endY = event.changedTouches?.[0]?.clientY ?? 0; if (touchStart.current !== null && endY - touchStart.current > 65) closeSheet(); touchStart.current = null; }}
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
            <div className="min-w-0"><h2 id="faith-ai-answer-title" className="text-sm font-semibold text-slate-950 dark:text-white">RevelaAI · Faith answer</h2><p className="mt-0.5 line-clamp-1 text-[0.625rem] text-slate-500 dark:text-slate-400">{contextLine}</p></div>
            <button type="button" onClick={closeSheet} aria-label="Close AI answer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:active:bg-slate-800"><X size={18} /></button>
          </div>
          <div className="max-h-[60vh] max-h-[60dvh] overflow-y-auto overscroll-contain px-4 pb-5 pt-1">{answerContent}</div>
        </SheetBackdrop>
      )}
    </section>
  );
}

export function WorkspaceHeader({
  page,
  title,
  description,
  filterChips,
  primaryActionLabel,
  onPrimaryAction,
  onBack,
  backLabel = "Back to Faith",
  primaryDisabled = false,
  onOpenFilters,
}) {
  const meta = PAGE_META[page] || {};
  const chips = Array.isArray(filterChips) ? filterChips : (meta.chips || []);
  const heading = title || meta.title || "Faith workspace";
  const intro = description || meta.description || "Study, reflect and explore Scripture.";
  return (
    <header className="sticky top-0 z-30 -mx-1 rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:p-4">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={onBack} aria-label={backLabel} disabled={!onBack} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:active:bg-slate-800">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[0.625rem] font-semibold text-slate-400"><span>Faith</span><span aria-hidden="true">/</span><span className="truncate text-indigo-700 dark:text-indigo-300">{heading}</span></nav>
          <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">{heading}</h1>
        </div>
        <button type="button" onClick={onOpenFilters} aria-label="Open filters and page actions" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:active:bg-slate-800"><SlidersHorizontal size={18} /></button>
      </div>
      <div className="mt-2 hidden text-xs leading-5 text-slate-500 dark:text-slate-400 sm:block">{intro}</div>
      {chips.length > 0 && <div className="sr-only">{chips.map((chip, index) => { const item = typeof chip === "string" ? { label: chip } : chip; return <span key={item.id || item.label || index}>{item.label || item}</span>; })}</div>}
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
      <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><BookOpen size={18} /></span><div className="min-w-0"><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Study panel</h2><p className="text-[0.625rem] text-slate-500 dark:text-slate-400">{copy.title}</p></div></div>
      <div className="mt-4 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Study panel sections">{panelTabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={"min-h-11 shrink-0 rounded-lg px-2.5 text-[0.625rem] font-semibold transition-colors active:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 " + (activeTab === tab ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/50")}>{tab}</button>)}</div>
      {isNotesTab ? <div className="mt-3"><label className="text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor={"faith-note-" + page}>Personal study notes</label><textarea id={"faith-note-" + page} value={note} onChange={(event) => saveNote(event.target.value)} rows={7} placeholder="Write an observation, question or application…" className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-base leading-5 text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /><p className="mt-2 inline-flex items-center gap-1 text-[0.625rem] text-slate-500 dark:text-slate-400">{saved ? <Check size={12} className="text-emerald-600" /> : <Clock3 size={12} />}{saved ? "Saved on this device" : "Autosave available on this device"}</p></div> : <div className="mt-3 space-y-2">{(page === "bible" && activeTab === "Cross-references" ? ["Read the parallel passage in its own setting.", "Compare repeated words and themes."] : page === "bible" && activeTab === "Word roots" ? ["Check lemma, morphology and a lexicon entry.", "Read the word in the complete sentence."] : page === "bible" && activeTab === "EGW" ? ["Open a reviewed Ellen G. White source.", "Compare the quotation with its cited biblical passage."] : copy.items).map((item) => <div key={item} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-950 dark:text-slate-300"><Lightbulb size={14} className="mt-0.5 shrink-0 text-indigo-500" /><span>{item}</span></div>)}{contextData?.reference && <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20"><p className="text-[0.625rem] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Current reference</p><p className="mt-1 text-sm font-semibold text-indigo-950 dark:text-indigo-100">{contextData.reference}</p></div>}</div>}
    </aside>
  );
}

export default function FaithWorkspaceLayout({
  page, title, description, filterChips, primaryActionLabel, onPrimaryAction, onBack,
  onOpenAI, onNavigate, onHome, onStudy, onMission, onMe, contextData = {},
  placeholder, children, panelTabs, panel = true,
}) {
  const meta = PAGE_META[page] || {};
  const [overlay, setOverlay] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  const [backPrompt, setBackPrompt] = useState("");
  const overlayRef = useRef("");
  useEffect(() => { overlayRef.current = overlay; }, [overlay]);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  useEffect(() => {
    const isTextEntry = (element) => {
      if (!element) return false;
      if (element.tagName === "TEXTAREA" || element.isContentEditable) return true;
      if (element.tagName !== "INPUT") return false;
      return !["button", "submit", "reset", "checkbox", "radio", "file", "hidden"].includes(String(element.type || "").toLowerCase());
    };
    const onFocusIn = () => {
      const element = document.activeElement;
      if (!isTextEntry(element)) return;
      setKeyboardOpen(true);
      window.setTimeout(() => element?.scrollIntoView?.({ behavior: "smooth", block: "center" }), 120);
    };
    const onFocusOut = () => {
      window.setTimeout(() => {
        const viewport = window.visualViewport;
        const element = document.activeElement;
        const viewportShowsKeyboard = viewport ? window.innerHeight - viewport.height > 100 : false;
        setKeyboardOpen(isTextEntry(element) && viewportShowsKeyboard);
      }, 160);
    };
    const onViewportResize = () => {
      const viewport = window.visualViewport;
      const element = document.activeElement;
      const viewportShowsKeyboard = viewport ? window.innerHeight - viewport.height > 100 : false;
      setKeyboardOpen(isTextEntry(element) && viewportShowsKeyboard);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", onViewportResize);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", onViewportResize);
    };
  }, []);

  const handleNativeBack = useCallback(() => {
    if (overlayRef.current) {
      if (overlayRef.current === "answer") window.dispatchEvent(new CustomEvent("revelacode:faith-dismiss-overlay"));
      setOverlay("");
      return true;
    }
    if (keyboardOpen) { document.activeElement?.blur?.(); setKeyboardOpen(false); return true; }
    return false;
  }, [keyboardOpen]);
  useFaithAndroidBack({ isHome: false, onBack, onBackAction: handleNativeBack });

  const goHome = onHome || onBack || (() => onNavigate?.("faith"));
  const goStudy = onStudy || (() => onNavigate?.("bible"));
  const goMission = onMission || (() => window.location.assign("/faith/missionpulse"));
  const goMe = onMe || (() => onNavigate?.("profile"));
  const navActive = page === "missionpulse" ? "mission" : page === "profile" ? "me" : ["quarterly", "bible", "prophecy", "events", "referential", "library", "word-roots", "academy", "atlas"].includes(page) ? "study" : "home";
  const chips = Array.isArray(filterChips) ? filterChips : (meta.chips || []);
  const touchStart = useRef(null);
  const handleAskOverlay = useCallback((open) => setOverlay((current) => open ? "answer" : current === "answer" ? "" : current), []);
  const closeOverlay = () => setOverlay("");

  return (
    <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-3 overflow-x-hidden overscroll-y-contain pb-24 sm:space-y-5 sm:px-1 sm:pb-6">
      <FaithOfflineBanner offline={offline} />
      <WorkspaceHeader page={page} title={title} description={description} filterChips={chips} onOpenFilters={() => setOverlay("filters")} onBack={onBack} />
      <InlineAskBar contextType={page} contextData={contextData} placeholder={placeholder || meta.placeholder} onOpenAI={onOpenAI} onKeyboardVisibilityChange={setKeyboardOpen} onOverlayChange={handleAskOverlay} />
      <div className={panel ? "grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]" : "min-w-0"}>
        <main data-faith-workspace-content className="min-w-0 space-y-4 max-sm:[&_.grid-cols-2]:!grid-cols-1 max-sm:[&_.grid-cols-3]:!grid-cols-1 max-sm:[&_.grid-cols-4]:!grid-cols-1">{children}</main>
        {panel && <StudyPanel page={page} contextData={contextData} tabs={panelTabs} />}
      </div>

      {overlay === "filters" && (
        <SheetBackdrop
          onClose={closeOverlay}
          labelledBy="faith-filter-sheet-title"
          onTouchStart={(event) => { touchStart.current = event.touches?.[0]?.clientY ?? null; }}
          onTouchEnd={(event) => { const y = event.changedTouches?.[0]?.clientY ?? 0; if (touchStart.current !== null && y - touchStart.current > 60) closeOverlay(); touchStart.current = null; }}
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center justify-between px-4 pb-2 pt-3"><h2 id="faith-filter-sheet-title" className="text-sm font-semibold text-slate-950 dark:text-white">Page filters & actions</h2><button type="button" onClick={closeOverlay} aria-label="Close filters" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><X size={18} /></button></div>
          <div className="max-h-[60vh] max-h-[60dvh] space-y-4 overflow-y-auto overscroll-contain px-4 pb-5">
            {chips.length > 0 && <div><p className="mb-2 text-[0.625rem] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Filters & topics</p><div className="flex flex-wrap gap-2">{chips.map((chip, index) => { const item = typeof chip === "string" ? { label: chip } : chip; return <span key={item.id || item.label || index} className="inline-flex min-h-10 items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200">{item.label || item}</span>; })}</div></div>}
            {onPrimaryAction && <button type="button" disabled={offline && page === "events"} onClick={() => { closeOverlay(); onPrimaryAction(); }} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"><ArrowRight size={16} /> {primaryActionLabel || meta.action || "Continue"}</button>}
          </div>
        </SheetBackdrop>
      )}

      {backPrompt && <div role="status" className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-[65] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg sm:bottom-5">{backPrompt}</div>}
      <FaithMobileBottomNav
        active={navActive}
        hidden={keyboardOpen || Boolean(overlay)}
        onHome={goHome}
        onStudy={goStudy}
        onAskAI={() => onOpenAI?.()}
        onMission={goMission}
        onMe={goMe}
      />
    </div>
  );
}

