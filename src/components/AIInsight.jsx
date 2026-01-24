import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Upload, Copy, Share2, Download, RefreshCw } from "lucide-react";

/**
 * AIAssistantDashboard (Refactored)
 * - Primary purpose: Generate Daily Insights from RevelaAI automatically
 * - Output is structured in H1/H2/H3/P format
 * - Stores insights in localStorage so Home page can read + display huge
 * - Still supports manual refresh + file upload + copy/download/share
 */

const STORAGE_KEY = "revelacode_daily_insights_v1";
const STORAGE_DATE_KEY = "revelacode_daily_insights_date_v1";

function getTodayKey() {
  // YYYY-MM-DD (stable daily key)
  return new Date().toISOString().slice(0, 10);
}

/* ---------------- UTIL: Extract readable blocks from AI output ---------------- */
function parseStructuredInsights(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return {
      h1: "Daily Insight",
      h2: "No response",
      h3: "Try again",
      paragraphs: ["⚠️ RevelaAI did not return a valid response."],
      raw: rawText || "",
    };
  }

  // If AI already returns H1/H2/H3 etc, keep it raw but also create fallback blocks.
  // We'll do a lightweight parse:
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let h1 = "";
  let h2 = "";
  let h3 = "";
  const paragraphs = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect explicit headings
    if (lower.startsWith("h1:") || lower.startsWith("# ")) {
      h1 = line.replace(/^h1:\s*/i, "").replace(/^#\s*/, "");
      continue;
    }
    if (lower.startsWith("h2:") || lower.startsWith("## ")) {
      if (!h2) h2 = line.replace(/^h2:\s*/i, "").replace(/^##\s*/, "");
      else paragraphs.push(line);
      continue;
    }
    if (lower.startsWith("h3:") || lower.startsWith("### ")) {
      if (!h3) h3 = line.replace(/^h3:\s*/i, "").replace(/^###\s*/, "");
      else paragraphs.push(line);
      continue;
    }

    // Detect bullets -> convert to sentence-like paragraphs
    if (line.startsWith("- ") || line.startsWith("• ")) {
      paragraphs.push(line.replace(/^[-•]\s*/, "• "));
      continue;
    }

    paragraphs.push(line);
  }

  return {
    h1: h1 || "🔥 Daily Insight From RevelaAI",
    h2: h2 || "Your Top Priority Today",
    h3: h3 || "Action Steps You Can Execute",
    paragraphs:
      paragraphs.length > 0
        ? paragraphs
        : ["No details returned. Try refreshing your daily insight."],
    raw: rawText,
  };
}

/* ---------------- PROMPT: Common Questions + Advice Generator ---------------- */
function buildDailyInsightsPrompt() {
  return `
You are RevelaAI — an AI assistant for RevelaCode.

TASK:
Generate "Daily Insights" for today in a clean structured format that can be displayed on a home page.

OUTPUT RULES (IMPORTANT):
1) Start with the MOST IMPORTANT thing first.
2) Use this exact structure and labels:
H1: (1 powerful headline)
H2: (1 main focus area)
H3: (1 execution plan title)
P: (multiple paragraphs, short and punchy)

3) Make it motivational, practical, and faith-grounded (not preachy).
4) Keep it Gen Z friendly, confident, and clear.
5) Keep it specific and actionable. Avoid vague advice.

CONTENT TO INCLUDE (common questions/advice):
- What should I focus on today?
- What should I avoid today?
- What habit will level me up fastest?
- What mindset shift do I need?
- What is one bold move I should make?
- What scripture principle can guide my decisions today? (1 verse reference only, no long quote)
- What is my productivity plan (morning / afternoon / evening)?
- What is one relationship/social advice for today?
- What is one health/energy advice for today?
- What is one money/discipline advice for today?
- What is one coding/learning advice for today (since user is a student developer)?

FINAL NOTE:
Make it sound like a daily briefing from a high-level mentor.
End with a short one-line "Challenge of the Day".

Return ONLY the structured format (H1/H2/H3/P).
`.trim();
}

/* ---------------- API CALL ---------------- */
async function fetchRevelaAIResponse(promptText) {
  const url = `${import.meta.env.VITE_REVELAAI_URL}/ai`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: promptText }),
  });

  const data = await res.json();
  const content = data?.data?.content || "⚠️ Something went wrong.";
  return content;
}

/* ---------------- TEXT TO SPEECH ---------------- */
function speak(text) {
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  } catch {
    // ignore
  }
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function AIAssistantDashboard() {
  const [loading, setLoading] = useState(false);
  const [dailyRaw, setDailyRaw] = useState("");
  const [error, setError] = useState("");

  const [manualInput, setManualInput] = useState("");
  const textareaRef = useRef(null);

  const todayKey = useMemo(() => getTodayKey(), []);

  const structured = useMemo(() => parseStructuredInsights(dailyRaw), [dailyRaw]);

  /* ---------------- AUTO RESIZE TEXTAREA ---------------- */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 160) + "px";
  }, [manualInput]);

  /* ---------------- LOAD CACHED DAILY INSIGHTS ---------------- */
  useEffect(() => {
    const cachedDate = localStorage.getItem(STORAGE_DATE_KEY);
    const cachedInsights = localStorage.getItem(STORAGE_KEY);

    // If it's still today's insights, load it
    if (cachedDate === todayKey && cachedInsights) {
      setDailyRaw(cachedInsights);
      return;
    }

    // Otherwise generate new daily insight automatically
    generateDailyInsights({ speakOut: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- GENERATE DAILY INSIGHTS ---------------- */
  const generateDailyInsights = async ({ speakOut = false } = {}) => {
    setLoading(true);
    setError("");

    try {
      const prompt = buildDailyInsightsPrompt();
      const aiText = await fetchRevelaAIResponse(prompt);

      setDailyRaw(aiText);

      // cache for Home Page
      localStorage.setItem(STORAGE_KEY, aiText);
      localStorage.setItem(STORAGE_DATE_KEY, todayKey);

      // optional voice
      if (speakOut) speak(aiText);
    } catch (e) {
      setError("⚠️ Network error while generating daily insights.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UTILITIES ---------------- */
  const copyText = (text) => navigator.clipboard.writeText(text);

  const downloadText = (text) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RevelaAI_Daily_Insights_${todayKey}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareText = (text) => {
    if (navigator.share) navigator.share({ text });
    else alert("Sharing not supported.");
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setLoading(true);
      setError("");

      try {
        const prompt = `
You are RevelaAI.
Analyze the following document and return insights using:
H1, H2, H3, P format (MOST IMPORTANT first).

Document:
${reader.result}
`.trim();

        const aiText = await fetchRevelaAIResponse(prompt);
        setDailyRaw(aiText);

        // cache it too (still useful)
        localStorage.setItem(STORAGE_KEY, aiText);
        localStorage.setItem(STORAGE_DATE_KEY, todayKey);
      } catch {
        setError("⚠️ Failed to analyze uploaded file.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const sendManualPrompt = async () => {
    if (!manualInput.trim()) return;

    setLoading(true);
    setError("");

    try {
      const prompt = `
You are RevelaAI.
User request:
${manualInput}

Return the answer in structured format:
H1, H2, H3, P (MOST IMPORTANT first).
`.trim();

      const aiText = await fetchRevelaAIResponse(prompt);
      setDailyRaw(aiText);

      // Cache to show on Home page too
      localStorage.setItem(STORAGE_KEY, aiText);
      localStorage.setItem(STORAGE_DATE_KEY, todayKey);

      setManualInput("");
    } catch {
      setError("⚠️ Network error.");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* TOP BAR */}
      <div className="border-b border-gray-200/60 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold">RevelaAI — Daily Insights</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Auto-generated daily advice you can display on the Home page (huge + bold).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateDailyInsights({ speakOut: false })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow transition"
              title="Generate new daily insight"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => speak(dailyRaw)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold transition"
              title="Read aloud"
            >
              <Mic size={16} />
              Voice
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* STATUS */}
          {loading && (
            <div className="rounded-2xl p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200/60 dark:border-yellow-900/40">
              <p className="font-semibold">⏳ Generating today’s insight...</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                RevelaAI is cooking something powerful for you.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl p-4 bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40">
              <p className="font-semibold text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* MAIN DAILY INSIGHT OUTPUT (Huge + Home-page ready) */}
          <div className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 shadow-xl p-6">
            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-green-700 dark:text-green-300">
              {structured.h1}
            </h1>

            {/* H2 */}
            <h2 className="text-2xl sm:text-3xl font-bold mt-4 text-gray-900 dark:text-gray-100">
              {structured.h2}
            </h2>

            {/* H3 */}
            <h3 className="text-xl sm:text-2xl font-semibold mt-3 text-gray-700 dark:text-gray-300">
              {structured.h3}
            </h3>

            {/* P blocks */}
            <div className="mt-5 space-y-3">
              {structured.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-200"
                >
                  {p}
                </p>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => copyText(dailyRaw)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition font-semibold"
              >
                <Copy size={16} />
                Copy
              </button>

              <button
                onClick={() => downloadText(dailyRaw)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition font-semibold"
              >
                <Download size={16} />
                Download
              </button>

              <button
                onClick={() => shareText(dailyRaw)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition font-semibold"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>

            {/* RAW (debug) */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                Show raw RevelaAI output
              </summary>
              <pre className="mt-3 p-4 rounded-2xl bg-gray-100 dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800 overflow-auto text-xs">
                {dailyRaw}
              </pre>
            </details>
          </div>

          {/* MANUAL PROMPT SECTION */}
          <div className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 shadow p-5">
            <h3 className="text-lg font-bold">Ask RevelaAI (Manual Prompt)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              This also returns H1/H2/H3/P format so it stays Home-page friendly.
            </p>

            <div className="mt-4 flex items-end gap-2">
              {/* Upload */}
              <label className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition">
                <Upload size={20} />
                <input type="file" hidden onChange={handleUpload} />
              </label>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Example: Give me advice on discipline + studying C programming today..."
                className="flex-1 resize-none rounded-2xl border px-4 py-3 max-h-40 overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
              />

              {/* Send */}
              <button
                onClick={sendManualPrompt}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-semibold shadow transition"
              >
                Send
              </button>
            </div>
          </div>

          {/* HOME PAGE INTEGRATION NOTE */}
          <div className="rounded-2xl p-4 bg-green-50 dark:bg-green-950/20 border border-green-200/60 dark:border-green-900/40">
            <p className="font-semibold text-green-800 dark:text-green-200">
              ✅ Home Page Integration Ready
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Your Home page can read today’s insight from:
              <code className="ml-2 px-2 py-1 rounded bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800">
                localStorage["{STORAGE_KEY}"]
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
