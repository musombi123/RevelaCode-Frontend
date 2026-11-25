import React, { useCallback, useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { REVELAAI_ORIGIN } from "@/config/serviceOrigins.js";

export default function SdaLessonAIChat({ material, onClose, initialQuestion = "" }) {
  const { authFetch } = useAuth();
  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const initialSent = useRef("");

  const meta = material?.metadata && typeof material.metadata === "object" ? material.metadata : {};
  const lessonTitle = material?.title || meta.lesson_title || "Daily lesson";
  const lessonContext = [
    lessonTitle, meta.lesson_date, meta.day, meta.memory_text,
    material?.description, material?.content,
  ].filter(Boolean).join("\n\n").slice(0, 18000);

  const askPrompt = useCallback(async (promptValue) => {
    const prompt = String(promptValue || "").trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      if (typeof authFetch !== "function") throw new Error("Sign in to use lesson AI chat.");
      if (!REVELAAI_ORIGIN) throw new Error("RevelaAI is not configured for this build environment.");
      const response = await authFetch(`${REVELAAI_ORIGIN}/ai`, {
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
  }, [authFetch, busy, lessonContext]);

  useEffect(() => {
    const prompt = String(initialQuestion || "").trim();
    if (!prompt || initialSent.current === prompt) return;
    initialSent.current = prompt;
    setQuestion(prompt);
    askPrompt(prompt);
  }, [initialQuestion, askPrompt]);

  const ask = event => {
    event.preventDefault();
    askPrompt(question);
  };

  return (
    <section className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black text-indigo-950 dark:text-indigo-100"><Sparkles size={15}/> AI Chat · {lessonTitle}</div>
        <button type="button" onClick={onClose} aria-label="Close lesson AI chat" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-indigo-700 dark:text-indigo-300"><X size={14}/></button>
      </div>
      <p className="mt-1 text-[11px] leading-5 text-indigo-800 dark:text-indigo-200">Ask questions about this day’s reading. RevelaAI receives the selected lesson as context.</p>
      {busy && <div role="status" className="mt-3 flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-200"><RefreshCw size={14} className="animate-spin motion-reduce:animate-none"/> Studying the lesson…</div>}
      {answer && <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-indigo-200 bg-white p-3 text-sm leading-6 text-slate-800 dark:border-indigo-900/50 dark:bg-slate-950 dark:text-slate-100">{answer}</div>}
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
      <form onSubmit={ask} className="mt-3 flex items-end gap-2">
        <textarea value={question} onChange={event => setQuestion(event.target.value)} rows={2} placeholder="Ask about today’s lesson…" className="min-h-11 min-w-0 flex-1 resize-y rounded-lg border border-indigo-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-indigo-500 dark:border-indigo-900/60 dark:bg-slate-950 dark:text-white"/>
        <button type="submit" disabled={busy || !question.trim()} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50 dark:bg-indigo-300 dark:text-indigo-950">{busy ? <RefreshCw size={14} className="animate-spin motion-reduce:animate-none"/> : <Send size={14}/>} Ask</button>
      </form>
    </section>
  );
}
