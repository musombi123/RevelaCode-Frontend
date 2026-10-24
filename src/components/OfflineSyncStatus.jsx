import React, { useCallback, useEffect, useState } from "react";
import { Activity, CloudOff, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  flushOfflineQueue,
  getOfflineQueueStatus,
  getRecentOfflineActivity,
  isBrowserOffline,
  offlineScopeForUser,
  subscribeOfflineSync,
} from "@/services/offlineHubSync.js";

export default function OfflineSyncStatus() {
  const { user, authFetch, isAuthenticated } = useAuth();
  const scope = isAuthenticated ? offlineScopeForUser(user) : "";
  const [offline, setOffline] = useState(isBrowserOffline());
  const [queue, setQueue] = useState({ pending: 0, failed: 0, total: 0, latest: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(async () => {
    setOffline(isBrowserOffline());
    if (!scope) {
      setQueue({ pending: 0, failed: 0, total: 0, latest: [] });
      setRecentActivity([]);
      return;
    }

    if (!isBrowserOffline() && typeof authFetch === "function") {
      setSyncing(true);
      try {
        await flushOfflineQueue({ scope, authFetch });
      } catch (error) {
        console.warn("[Offline workspace] Background sync will retry.", error);
      } finally {
        setSyncing(false);
      }
    }
    const [nextQueue, nextActivity] = await Promise.all([
      getOfflineQueueStatus(scope),
      getRecentOfflineActivity(scope, 6),
    ]);
    setQueue(nextQueue);
    setRecentActivity(nextActivity);
    setOffline(isBrowserOffline());
  }, [scope, authFetch]);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeOfflineSync(refresh);
    const ticker = window.setInterval(refresh, 20000);
    return () => {
      unsubscribe();
      window.clearInterval(ticker);
    };
  }, [refresh]);

  if (!isAuthenticated || !scope) return null;

  const title = offline
    ? "Offline mode"
    : syncing
      ? "Syncing saved changes"
      : queue.failed
        ? "Some changes need attention"
        : queue.pending
          ? "Changes waiting to sync"
          : "Workspace saved on this device";
  const description = offline
    ? "Your saved local changes remain on this device. Sync resumes when the connection returns."
    : queue.failed
      ? queue.failed + " change(s) were rejected by the server. Review the affected form when online."
      : syncing
        ? "Sending queued changes to RevelaCode securely."
        : queue.pending
          ? queue.pending + " saved change(s) are waiting for sync."
          : "Your last hub and recent activity are saved on this device.";

  return (
    <div className="fixed right-3 top-[calc(env(safe-area-inset-top,0px)+12px)] z-[10000] max-w-[min(94vw,360px)]">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={title + ". " + description}
        className="flex min-h-10 items-center gap-2 rounded-full border border-slate-300 bg-white/95 px-3 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-100"
      >
        {offline ? <CloudOff size={15} className="shrink-0 text-amber-600 dark:text-amber-300" /> : queue.failed ? <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-300" /> : syncing ? <RefreshCw size={15} className="shrink-0 animate-spin text-blue-600 dark:text-blue-300" /> : queue.pending ? <RefreshCw size={15} className="shrink-0 text-blue-600 dark:text-blue-300" /> : <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />}
        <span className="max-w-[245px] truncate">{offline ? "Offline" : syncing ? "Syncing" : queue.failed ? queue.failed + " need attention" : queue.pending ? queue.pending + " waiting to sync" : "Workspace saved"}</span>
        {(queue.pending || queue.failed) ? <span className="rounded-full bg-slate-100 px-2 py-0.5 tabular-nums dark:bg-slate-800">{queue.pending + queue.failed}</span> : null}
      </button>

      {expanded && (
        <section role="status" aria-live="polite" className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600 shadow-xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          <p className="font-extrabold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-1">{description}</p>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Your recent hub and scroll position are saved locally. Sensitive actions such as payments, account access, and verification decisions are never queued offline.
          </p>
          <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              <Activity size={13} /> Recent local activity
            </p>
            {recentActivity.length ? (
              <div className="mt-2 space-y-2">
                {recentActivity.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-2 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-900">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-bold text-slate-800 dark:text-slate-100">{item.title || "Platform activity"}</p>
                      {item.detail ? <p className="mt-0.5 break-words text-[11px] text-slate-500 dark:text-slate-400">{item.detail}</p> : null}
                      <p className="mt-0.5 text-[10px] text-slate-400">{Number.isFinite(Number(item.createdAt)) ? new Date(Number(item.createdAt)).toLocaleString() : "Saved locally"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Your recent hub visits and queued edits will appear here.</p>
            )}
          </div>
          {queue.failed > 0 && (
            <div className="mt-3 space-y-2">
              {queue.latest.filter((item) => item.status === "failed" || item.status === "blocked").slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  <p className="font-bold">{item.method} request not accepted</p>
                  <p>{item.lastError || "Reopen the relevant workspace and review this change."}</p>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={refresh} disabled={offline || syncing} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 font-bold text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:text-white">
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} /> Retry sync
          </button>
        </section>
      )}
    </div>
  );
}
