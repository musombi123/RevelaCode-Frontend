import React, { useState } from "react";
import { Send, Sparkles, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

export default function SdaLessonAIChat({ material, onClose }) {
  const { authFetch } = useAuth();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const meta = material?.metadata && typeof material.metadata === "object" ? material.metadata : {};
  const lessonTitle = material?.title || meta.lesson_title || "Daily lesson";
  const lessonContext = [
    lessonTitle, meta.lesson_date, meta.day, meta.memory_text,
    material?.description, material?.content,
  ].filter(Boolean).join("\n\n").slice(0, 18000);

  const ask = async (event) => {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      if (typeof authFetch !== "function") throw new Error("Sign in to use lesson AI chat.");
      const response = await authFetch("https://revelaai.onrender.com/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          message: prompt,
          hub: "faith",
          context: [
            { role: "system", content: "You are a Sabbath School study assistant. Use the supplied lesson as primary context. Explain Scripture carefully, distinguish lesson text from interpretation, and encourage direct Bible reading.\n\nLESSON CONTEXT:\n" + lessonContext },
            { role: "user", content: prompt },
          ],
        }),
      });
      const payload = await response.json().catch(() => ({}));
      const data = payload?.data || payload;
      const result = data?.response || data?.content || data?.answer || data?.text;
      if (!response.ok || typeof result !== "string" || !result.trim()) throw new Error("Poor connection. Please try your lesson question again.");
      setAnswer(result.trim());
      setQuestion("");
      window.dispatchEvent(new CustomEvent("revelacode:connection-restored"));
    } catch (err) {
      const network = err instanceof TypeError || /fetch|network|timeout|temporarily unavailable/i.test(String(err?.message || ""));
      if (network) window.dispatchEvent(new CustomEvent("revelacode:connection-poor"));
      setError(network ? "Poor connection. Your lesson is still available; reconnect and try AI chat again." : (err?.message || "Lesson AI is temporarily unavailable."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black text-indigo-950 dark:text-indigo-100"><Sparkles size={15}/> AI Chat · {lessonTitle}</div>
        <button type="button" onClick={onClose} aria-label="Close lesson AI chat" className="rounded-lg p-1.5 text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-900/40"><X size={14}/></button>
      </div>
      <p className="mt-1 text-[11px] leading-5 text-indigo-800 dark:text-indigo-200">Ask questions about this day’s reading. RevelaAI receives the selected lesson as context.</p>
      {answer && <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-indigo-200 bg-white p-3 text-sm leading-6 text-slate-800 dark:border-indigo-900/50 dark:bg-slate-950 dark:text-slate-100">{answer}</div>}
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
      <form onSubmit={ask} className="mt-3 flex items-end gap-2">
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={2} placeholder="Ask about today’s lesson…" className="min-h-11 min-w-0 flex-1 resize-y rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-indigo-900/60 dark:bg-slate-950 dark:text-white"/>
        <button type="submit" disabled={busy || !question.trim()} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50 dark:bg-indigo-300 dark:text-indigo-950">{busy ? <RefreshCw size={14} className="animate-spin"/> : <Send size={14}/>} Ask</button>
      </form>
    </section>
  );
}
