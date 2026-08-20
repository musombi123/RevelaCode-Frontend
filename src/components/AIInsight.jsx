import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import {
  Sparkles,
  Mic,
  Upload,
  Copy,
  Share2,
  Download,
  RefreshCw,
  Send,
  Check,
  FileText,
  ArrowUpRight,
  Zap,
  Target,
  Compass,
  Brain,
  CircleAlert,
} from "lucide-react";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "revelacode_daily_insights_v1";
const STORAGE_DATE_KEY = "revelacode_daily_insights_date_v1";

/* =========================================================
   DATE
========================================================= */

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/* =========================================================
   STRUCTURED RESPONSE PARSER
========================================================= */

function parseStructuredInsights(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return {
      h1: "Your Daily Insight",
      h2: "Start with what matters most",
      h3: "Your execution plan",
      paragraphs: [
        "RevelaAI has not returned a valid insight yet.",
      ],
      raw: rawText || "",
    };
  }

  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let h1 = "";
  let h2 = "";
  let h3 = "";

  const paragraphs = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (
      lower.startsWith("h1:") ||
      line.startsWith("# ")
    ) {
      h1 = line
        .replace(/^h1:\s*/i, "")
        .replace(/^#\s*/, "")
        .trim();

      continue;
    }

    if (
      lower.startsWith("h2:") ||
      line.startsWith("## ")
    ) {
      const value = line
        .replace(/^h2:\s*/i, "")
        .replace(/^##\s*/, "")
        .trim();

      if (!h2) {
        h2 = value;
      } else {
        paragraphs.push(value);
      }

      continue;
    }

    if (
      lower.startsWith("h3:") ||
      line.startsWith("### ")
    ) {
      const value = line
        .replace(/^h3:\s*/i, "")
        .replace(/^###\s*/, "")
        .trim();

      if (!h3) {
        h3 = value;
      } else {
        paragraphs.push(value);
      }

      continue;
    }

    if (lower.startsWith("p:")) {
      paragraphs.push(
        line.replace(/^p:\s*/i, "").trim()
      );

      continue;
    }

    paragraphs.push(
      line.startsWith("- ") || line.startsWith("• ")
        ? line.replace(/^[-•]\s*/, "• ")
        : line
    );
  }

  return {
    h1: h1 || "🔥 Your Daily Insight",
    h2: h2 || "Focus on what moves the needle",
    h3: h3 || "Your execution plan",
    paragraphs:
      paragraphs.length > 0
        ? paragraphs
        : [
            "No additional details were returned. Try refreshing your insight.",
          ],
    raw: rawText,
  };
}

/* =========================================================
   PROMPT
========================================================= */

function buildDailyInsightsPrompt() {
  return `
You are RevelaAI — an intelligent assistant inside RevelaCode.

Generate a high-quality Daily Briefing for today.

OUTPUT FORMAT:
H1: one powerful headline
H2: one main focus area
H3: one execution plan title
P: multiple concise paragraphs

CONTENT:
- What matters most today?
- What should be avoided?
- Which habit will create the highest leverage?
- Which mindset shift is needed?
- What bold move should be made?
- One scripture principle with ONLY a verse reference.
- Morning, afternoon, and evening productivity plan.
- One relationship/social insight.
- One health/energy insight.
- One money/discipline insight.
- One coding/learning insight.

STYLE:
- intelligent
- practical
- motivational
- concise
- Gen Z friendly
- confident
- faith-grounded without being preachy
- specific rather than vague

End with:
Challenge of the Day: ...

Return ONLY H1/H2/H3/P structured content.
`.trim();
}

/* =========================================================
   API
========================================================= */

async function fetchRevelaAIResponse(promptText) {
  const baseUrl = import.meta.env.VITE_REVELAAI_URL;

  if (!baseUrl) {
    throw new Error(
      "RevelaAI API URL is not configured."
    );
  }

  const res = await fetch(`${baseUrl}/ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      message: promptText,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        "RevelaAI request failed."
    );
  }

  return (
    data?.data?.content ||
    data?.content ||
    "RevelaAI returned an empty response."
  );
}

/* =========================================================
   SPEECH
========================================================= */

function speak(text) {
  if (!text || typeof window === "undefined") return;

  try {
    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.rate = 0.95;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Speech synthesis failed:", error);
  }
}

/* =========================================================
   MAIN
========================================================= */

export default function AIAssistantDashboard() {
  const todayKey = useMemo(
    () => getTodayKey(),
    []
  );

  const [loading, setLoading] = useState(false);
  const [dailyRaw, setDailyRaw] = useState("");
  const [error, setError] = useState("");

  const [manualInput, setManualInput] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [debugOpen, setDebugOpen] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const structured = useMemo(
    () => parseStructuredInsights(dailyRaw),
    [dailyRaw]
  );

  /* =======================================================
     TEXTAREA AUTO RESIZE
  ======================================================= */

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";

    textareaRef.current.style.height =
      `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
  }, [manualInput]);

  /* =======================================================
     LOAD DAILY INSIGHT
  ======================================================= */

  const generateDailyInsights = useCallback(
    async ({ speakOut = false } = {}) => {
      setLoading(true);
      setError("");

      try {
        const prompt =
          buildDailyInsightsPrompt();

        const aiText =
          await fetchRevelaAIResponse(prompt);

        setDailyRaw(aiText);

        localStorage.setItem(
          STORAGE_KEY,
          aiText
        );

        localStorage.setItem(
          STORAGE_DATE_KEY,
          todayKey
        );

        if (speakOut) {
          speak(aiText);
        }
      } catch (err) {
        console.error(err);

        setError(
          err?.message ||
            "Unable to generate your daily insight."
        );
      } finally {
        setLoading(false);
      }
    },
    [todayKey]
  );

  useEffect(() => {
    const cachedDate =
      localStorage.getItem(
        STORAGE_DATE_KEY
      );

    const cachedInsights =
      localStorage.getItem(STORAGE_KEY);

    if (
      cachedDate === todayKey &&
      cachedInsights
    ) {
      setDailyRaw(cachedInsights);
      return;
    }

    generateDailyInsights({
      speakOut: false,
    });
  }, [todayKey, generateDailyInsights]);

  /* =======================================================
     COPY
  ======================================================= */

  const copyText = async (text) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const downloadText = (text) => {
    if (!text) return;

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      `RevelaAI_Daily_Insights_${todayKey}.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  /* =======================================================
     SHARE
  ======================================================= */

  const shareText = async (text) => {
    if (!text) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "RevelaAI Daily Insight",
          text,
        });
      } else {
        await copyText(text);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error(
          "Share failed:",
          err
        );
      }
    }
  };

  /* =======================================================
     FILE UPLOAD
  ======================================================= */

  const handleUpload = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setLoading(true);
    setError("");

    const reader =
      new FileReader();

    reader.onload = async () => {
      try {
        const fileContent =
          typeof reader.result === "string"
            ? reader.result
            : "";

        const prompt = `
You are RevelaAI.

Analyze the following uploaded document.

Return:
H1
H2
H3
P

Put the most important insight first.

Document:
${fileContent}
`.trim();

        const aiText =
          await fetchRevelaAIResponse(prompt);

        setDailyRaw(aiText);

        localStorage.setItem(
          STORAGE_KEY,
          aiText
        );

        localStorage.setItem(
          STORAGE_DATE_KEY,
          todayKey
        );
      } catch (err) {
        console.error(err);

        setError(
          "RevelaAI could not analyze this file."
        );
      } finally {
        setUploading(false);
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setUploading(false);
      setLoading(false);

      setError(
        "Unable to read the selected file."
      );
    };

    reader.readAsText(file);

    event.target.value = "";
  };

  /* =======================================================
     MANUAL PROMPT
  ======================================================= */

  const sendManualPrompt = async () => {
    const promptValue =
      manualInput.trim();

    if (!promptValue || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const prompt = `
You are RevelaAI.

User request:
${promptValue}

Return the answer using:
H1
H2
H3
P

Put the most useful information first.
Be practical, concise, and intelligent.
`.trim();

      const aiText =
        await fetchRevelaAIResponse(prompt);

      setDailyRaw(aiText);

      localStorage.setItem(
        STORAGE_KEY,
        aiText
      );

      localStorage.setItem(
        STORAGE_DATE_KEY,
        todayKey
      );

      setManualInput("");
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "RevelaAI could not process your request."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     ENTER KEY
  ======================================================= */

  const handlePromptKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendManualPrompt();
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
              <Sparkles
                className="h-5 w-5"
                strokeWidth={2}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  RevelaAI
                </span>

                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block dark:bg-slate-700" />

                <span className="hidden text-[10px] font-medium text-slate-400 sm:block">
                  Intelligence Workspace
                </span>
              </div>

              <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">
                Daily Briefing
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              generateDailyInsights({
                speakOut: false,
              })
            }
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            <span className="hidden sm:inline">
              {loading
                ? "Generating..."
                : "New briefing"}
            </span>
          </button>
        </div>
      </header>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* =================================================
              PRIMARY COLUMN
          ================================================= */}

          <section className="min-w-0">
            {/* Status */}
            {(loading || error) && (
              <div className="mb-5">
                {loading && (
                  <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-900">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        RevelaAI is generating your briefing
                      </p>

                      <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                        Building today's highest-value insights.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-3 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
                    <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />

                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                HERO INSIGHT
            ================================================= */}

            <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                {/* decorative background */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl dark:bg-emerald-950/20" />

                <div className="relative">
                  {/* eyebrow */}
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      TODAY'S INTELLIGENCE
                    </span>

                    <span className="text-[11px] font-medium text-slate-400">
                      {todayKey}
                    </span>
                  </div>

                  {/* H1 */}
                  <h2 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                    {structured.h1}
                  </h2>

                  {/* H2 */}
                  <p className="mt-5 max-w-3xl text-xl font-bold leading-tight text-slate-600 dark:text-slate-300 sm:text-2xl">
                    {structured.h2}
                  </p>

                  {/* H3 */}
                  <div className="mt-7 flex items-start gap-3 border-l-2 border-emerald-500 pl-4">
                    <Target className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-500" />

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                        Execution plan
                      </p>

                      <p className="mt-1 text-base font-semibold leading-6 text-slate-800 dark:text-slate-200">
                        {structured.h3}
                      </p>
                    </div>
                  </div>

                  {/* Paragraphs */}
                  <div className="mt-8 max-w-4xl space-y-4">
                    {structured.paragraphs.map(
                      (paragraph, index) => (
                        <p
                          key={`${index}-${paragraph.slice(
                            0,
                            20
                          )}`}
                          className={`
                            leading-7 text-slate-600 dark:text-slate-300
                            ${
                              index ===
                              structured.paragraphs.length - 1
                                ? "font-semibold"
                                : "text-base sm:text-lg"
                            }
                          `}
                        >
                          {paragraph}
                        </p>
                      )
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-9 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-6 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        speak(dailyRaw)
                      }
                      disabled={!dailyRaw}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      <Mic className="h-4 w-4" />
                      Listen
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        copyText(dailyRaw)
                      }
                      disabled={!dailyRaw}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}

                      {copied ? "Copied" : "Copy"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        shareText(dailyRaw)
                      }
                      disabled={!dailyRaw}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        downloadText(dailyRaw)
                      }
                      disabled={!dailyRaw}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Download className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* =================================================
                ASK REVELAAI
            ================================================= */}

            <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Brain className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Ask RevelaAI
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Ask a question, request advice, or
                      analyze a document.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/50">
                  <textarea
                    ref={textareaRef}
                    value={manualInput}
                    onChange={(event) =>
                      setManualInput(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handlePromptKeyDown
                    }
                    disabled={loading}
                    placeholder="Ask something like: Help me build a study plan for today..."
                    className="min-h-[96px] w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                  />

                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-200 px-1 pt-2 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        disabled={
                          loading ||
                          uploading
                        }
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        <Upload className="h-4 w-4" />

                        <span className="hidden sm:inline">
                          {uploading
                            ? "Analyzing..."
                            : "Upload"}
                        </span>
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        onChange={
                          handleUpload
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          speak(manualInput)
                        }
                        disabled={
                          !manualInput.trim()
                        }
                        className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white sm:inline-flex"
                      >
                        <Mic className="h-4 w-4" />
                        Voice
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={sendManualPrompt}
                      disabled={
                        !manualInput.trim() ||
                        loading
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      Ask
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">
                    Press Enter to send · Shift + Enter
                    for a new line
                  </p>

                  <span className="hidden text-[11px] text-slate-400 sm:block">
                    Powered by RevelaAI
                  </span>
                </div>
              </div>
            </section>

            {/* =================================================
                DEBUG
            ================================================= */}

            <section className="mt-6">
              <button
                type="button"
                onClick={() =>
                  setDebugOpen((value) => !value)
                }
                className="text-xs font-semibold text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                {debugOpen
                  ? "Hide developer output"
                  : "Show developer output"}
              </button>

              {debugOpen && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 dark:border-slate-800">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-xs font-bold text-white">
                      Raw RevelaAI response
                    </p>
                  </div>

                  <pre className="max-h-[400px] overflow-auto p-4 text-xs leading-6 text-slate-300">
                    {dailyRaw ||
                      "No raw response available."}
                  </pre>
                </div>
              )}
            </section>
          </section>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="space-y-4">
            {/* Daily status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <Zap className="h-4 w-4 text-emerald-500" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Today's briefing
                  </p>

                  <p className="text-xs text-slate-400">
                    Automatically refreshed daily
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Status
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Ready
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Date
                  </span>

                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {todayKey}
                  </span>
                </div>
              </div>
            </div>

            {/* Capability card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Capabilities
              </p>

              <div className="mt-4 space-y-3">
                <Capability
                  icon={Compass}
                  title="Daily guidance"
                  text="Personalized insights and priorities."
                />

                <Capability
                  icon={FileText}
                  title="Document analysis"
                  text="Upload content and extract useful insights."
                />

                <Capability
                  icon={Brain}
                  title="Reasoning"
                  text="Ask questions and explore ideas."
                />
              </div>
            </div>

            {/* Home integration */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Home integration
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-700/75 dark:text-emerald-400/70">
                    Today's insight is cached locally so
                    the Home dashboard can display it.
                  </p>
                </div>

                <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-emerald-500" />
              </div>

              <code className="mt-4 block overflow-x-auto rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[10px] text-slate-600 dark:border-emerald-900/40 dark:bg-slate-900 dark:text-slate-400">
                {STORAGE_KEY}
              </code>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   CAPABILITY
========================================================= */

function Capability({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
          {text}
        </p>
      </div>
    </div>
  );
}
