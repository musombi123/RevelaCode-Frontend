import React, { useEffect, useState } from "react";
import { loadSmartIdeas, loadSmartMemory } from "@/ai/revelaAIClient";

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || "").trim());

export default function SmartMemoryPanel({ open, onClose, userId, authFetch, isAuthenticated }) {
  const [memory, setMemory] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    if (!isAuthenticated || !isObjectId(userId)) {
      setMemory(null);
      setIdeas([]);
      setError("Sign in with a RevelaCode account that returns its MongoDB user ID to view server memory.");
      return undefined;
    }
    setLoading(true);
    setError("");
    Promise.all([
      loadSmartMemory({ authFetch, userId }),
      loadSmartIdeas({ authFetch, userId }),
    ]).then(([nextMemory, nextIdeas]) => {
      if (!active) return;
      setMemory(nextMemory);
      setIdeas(nextIdeas);
    }).catch((requestError) => {
      if (!active) return;
      setError(requestError?.message || "Smart memory is temporarily unavailable.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [open, userId, authFetch, isAuthenticated]);

  if (!open) return null;
  const facts = Object.entries(memory?.bestThings || {}).filter(([, value]) =>
    typeof value === "string" && value.trim()
  );

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="RevelaAI smart memory">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close memory panel" />
      <section className="relative flex h-full max-h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-slate-950 text-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300">RevelaAI · Smart Memory v2</p>
            <h2 className="mt-1 text-lg font-bold">Your saved context</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">Only useful, non-duplicate details are retained. Greetings and noise are filtered out.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Close</button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {loading && <p className="text-sm text-slate-300">Loading memory for this account…</p>}
          {error && <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">{error}</div>}
          {!loading && !error && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
                  <p className="text-xs text-slate-400">Learn score</p>
                  <p className="mt-1 text-2xl font-bold">{Number(memory?.learnScore || 0)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
                  <p className="text-xs text-slate-400">Unique ideas</p>
                  <p className="mt-1 text-2xl font-bold">{ideas.length}</p>
                </div>
              </div>
              <section className="rounded-2xl border border-white/10 p-3">
                <h3 className="text-sm font-bold">Best things remembered</h3>
                {facts.length ? (
                  <dl className="mt-3 space-y-3">
                    {facts.map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">{key}</dt>
                        <dd className="mt-1 break-words text-sm leading-6 text-slate-200">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : <p className="mt-2 text-sm leading-6 text-slate-400">Nothing useful has been saved yet. As you share meaningful long-term details and goals, they can appear here.</p>}
              </section>
              <section className="rounded-2xl border border-white/10 p-3">
                <h3 className="text-sm font-bold">New ideas</h3>
                {ideas.length ? (
                  <div className="mt-3 space-y-3">
                    {ideas.map((idea) => (
                      <article key={idea._id} className="rounded-xl bg-white/[.03] p-3">
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{idea.ideaText}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                          <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-emerald-200">{idea.status || "new"}</span>
                          <span className="rounded-full bg-white/5 px-2 py-1 text-slate-400">{idea.source || "conversation"}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <p className="mt-2 text-sm leading-6 text-slate-400">No new ideas saved yet. Duplicate ideas are skipped.</p>}
              </section>
              <p className="text-[10px] leading-5 text-slate-500">Memory is isolated by the authenticated RevelaCode user ID. Local browser chat history is separate from this server-side memory.</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
