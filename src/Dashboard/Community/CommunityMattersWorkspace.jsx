// src/Dashboard/Community/CommunityMattersWorkspace.jsx
//
// Matter-first chat UI. All message data and actions pass through
// mattersAdapter.js; missing backend contracts are shown honestly.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Info,
  MessageCircle,
  Mic,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { createCommunityMattersAdapter } from "@/Dashboard/Community/mattersAdapter.js";

const MATTER_STAGES = [
  { value: "open", label: "Open" },
  { value: "agreed", label: "Agreed" },
  { value: "done", label: "Done" },
];

const QUICK_REPLIES = [
  "I'm interested",
  "Can you share details?",
  "I can help",
];

function itemId(item) {
  return item?.id || item?._id || item?.matter_id || null;
}

function itemStatus(item) {
  return String(item?.status || "unknown").trim().toLowerCase();
}

function itemTitle(item) {
  return (
    item?.linked_post?.title ||
    item?.post?.title ||
    item?.post_title ||
    item?.need_title ||
    item?.offer_title ||
    item?.title ||
    "Matter details not supplied"
  );
}

function itemLocation(item) {
  return (
    item?.linked_post?.location ||
    item?.post?.location ||
    item?.location ||
    item?.place ||
    "Location not shared"
  );
}

function messageText(message) {
  return message?.body || message?.text || message?.content || "";
}

function presenceLabel(matter) {
  const participant =
    matter?.counterparty ||
    matter?.other_participant ||
    matter?.participant ||
    null;
  if (!participant) return "Presence unavailable";
  const value =
    participant.is_online ??
    participant.online ??
    participant.presence?.online;
  if (typeof value !== "boolean") return "Presence unavailable";
  return value ? "Online" : "Offline";
}

function trustLabel(matter) {
  const participant =
    matter?.counterparty ||
    matter?.other_participant ||
    matter?.participant ||
    null;
  if (!participant) return "Trust status unavailable";
  if (participant.is_trusted === true || participant.trusted === true) return "Trusted";
  const level = String(participant.trust_level || participant.trust?.level || "").toLowerCase();
  if (level === "trusted" || level === "verified" || level === "established") {
    return level === "verified" ? "Verified" : "Trusted";
  }
  if (level) return level.replace(/_/g, " ");
  return "Trust status unavailable";
}

function ProgressLine({ status }) {
  const current = MATTER_STAGES.findIndex((stage) => stage.value === status);
  return (
    <div className="min-w-0">
      <div className="flex items-center">
        {MATTER_STAGES.map((stage, index) => {
          const complete = current >= 0 && index <= current;
          return (
            <React.Fragment key={stage.value}>
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <span className={"flex h-6 w-6 items-center justify-center rounded-full border " + (complete ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-slate-300 text-slate-400 dark:border-white/15 dark:text-slate-500")}>
                  {complete ? <Check size={12} /> : <Circle size={9} />}
                </span>
                <span className={"text-[10px] font-bold " + (complete ? "text-cyan-700 dark:text-cyan-300" : "text-slate-400")}>{stage.label}</span>
              </div>
              {index < MATTER_STAGES.length - 1 ? (
                <span className={"mx-2 mb-5 h-px min-w-3 flex-1 " + (current > index ? "bg-cyan-400" : "bg-slate-200 dark:bg-white/10")} />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function CommunityMattersWorkspace({ api, currentUserId }) {
  const adapter = useMemo(() => createCommunityMattersAdapter(api), [api]);
  const [matterResult, setMatterResult] = useState({
    supported: true,
    items: [],
    message: "",
  });
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [messageResult, setMessageResult] = useState({
    supported: false,
    items: [],
    message: "Select a matter to view its thread.",
  });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [newMatterOpen, setNewMatterOpen] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [recipientId, setRecipientId] = useState("");
  const [linkLatestPost, setLinkLatestPost] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const loadMatters = useCallback(async () => {
    setBusy(true);
    setActionError("");
    const result = await adapter.list();
    setMatterResult(result);
    if (selectedMatter) {
      const current = result.items.find((item) => itemId(item) === itemId(selectedMatter));
      setSelectedMatter(current || null);
    }
    setBusy(false);
  }, [adapter, selectedMatter]);

  useEffect(() => {
    let active = true;
    adapter.list().then((result) => {
      if (!active) return;
      setMatterResult(result);
      setSelectedMatter((current) => {
        if (!current) return null;
        return result.items.find((item) => itemId(item) === itemId(current)) || null;
      });
    });
    return () => {
      active = false;
    };
  }, [adapter]);

  useEffect(() => {
    let active = true;
    if (!selectedMatter) {
      setMessageResult({
        supported: false,
        items: [],
        message: "Select a matter to view its thread.",
      });
      return () => {
        active = false;
      };
    }
    if (!adapter.capabilities.messages) {
      setMessageResult({
        supported: false,
        items: [],
        message: "The backend does not expose matter messages yet. Existing post comments remain available in Community activity.",
      });
      return () => {
        active = false;
      };
    }
    adapter.messages(itemId(selectedMatter)).then((result) => {
      if (active) setMessageResult(result);
    });
    return () => {
      active = false;
    };
  }, [adapter, selectedMatter]);

  const groupedMatters = useMemo(() => {
    const items = matterResult.items || [];
    return MATTER_STAGES.map((stage) => ({
      ...stage,
      items: items.filter((item) => itemStatus(item) === stage.value),
    }));
  }, [matterResult.items]);

  const loadRecipients = useCallback(async () => {
    setLoadingRecipients(true);
    setActionError("");
    try {
      if (typeof api?.getCommunityFeed !== "function") {
        throw new Error("The Community feed API is not available in this session.");
      }
      const response = await api.getCommunityFeed({ limit: 100, mode: "recent" });
      const payload = response?.data ?? response;
      const posts = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.posts)
          ? payload.posts
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.results)
              ? payload.results
              : [];
      const byId = new Map();
      for (const post of posts) {
        const author = post?.author || post?.user || {};
        const rawId = author.user_id || author.member_id || author.id || author._id ||
          post?.author_user_id || post?.user_id;
        if (rawId === undefined || rawId === null) continue;
        const id = String(rawId).trim();
        if (!id || (currentUserId && id === String(currentUserId))) continue;
        const title = String(post?.title || post?.post_title || post?.need_title || post?.offer_title || "Community post").trim();
        const candidate = {
          id,
          name: String(author.full_name || author.name || author.fullName || author.username || post?.author_name || "Community member").trim(),
          avatar_url: author.avatar_url || author.avatar || author.profile_image || null,
          latestPostId: post?.id || post?._id || post?.post_id || "",
          latestPostTitle: title,
          latestPostCreatedAt: post?.created_at || post?.createdAt || null,
        };
        const current = byId.get(id);
        if (!current) {
          byId.set(id, candidate);
        } else if (new Date(candidate.latestPostCreatedAt || 0) > new Date(current.latestPostCreatedAt || 0)) {
          byId.set(id, candidate);
        }
      }
      const found = [...byId.values()].sort((left, right) => left.name.localeCompare(right.name));
      setRecipients(found);
      setRecipientId((current) => found.some((item) => item.id === current) ? current : (found[0]?.id || ""));
      if (!found.length) {
        setActionError("No other Community members with visible posts were found. The directory currently discovers participants from Community activity; it does not expose every registered account.");
      }
    } catch (error) {
      setRecipients([]);
      setRecipientId("");
      setActionError(error?.message || "Could not load Community members.");
    } finally {
      setLoadingRecipients(false);
    }
  }, [api, currentUserId]);

  const openNewMatter = () => {
    const willOpen = !newMatterOpen;
    setNewMatterOpen(willOpen);
    setActionError("");
    if (willOpen && !recipients.length) void loadRecipients();
  };

  const startConversation = async (event) => {
    event.preventDefault();
    const recipient = recipients.find((item) => item.id === recipientId);
    if (!recipient || !adapter.capabilities.create || busy) return;
    setBusy(true);
    setActionError("");
    try {
      const createdMatter = await adapter.create(recipient.id, {
        title: linkLatestPost ? recipient.latestPostTitle : "",
        linkedPostId: linkLatestPost ? recipient.latestPostId : "",
      });
      const matterId = itemId(createdMatter);
      const refreshed = await adapter.list();
      const found = refreshed.items.find((item) => itemId(item) === matterId);
      const selected = found || createdMatter;
      setMatterResult(refreshed.supported
        ? {
            ...refreshed,
            items: refreshed.items.some((item) => itemId(item) === matterId)
              ? refreshed.items
              : [selected, ...refreshed.items],
          }
        : { supported: true, items: [selected], message: "" });
      setSelectedMatter(selected);
      setMessageResult({
        supported: true,
        items: [],
        message: "No messages yet. Send the first message below.",
      });
      setDraft("");
      setNewMatterOpen(false);
      setLinkLatestPost(false);
    } catch (error) {
      setActionError(error?.message || "The conversation could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedMatter || !adapter.capabilities.sendMessage) return;
    setBusy(true);
    setActionError("");
    try {
      await adapter.sendMessage(itemId(selectedMatter), body);
      setDraft("");
      const [messages, matters] = await Promise.all([
        adapter.messages(itemId(selectedMatter)),
        adapter.list(),
      ]);
      setMessageResult(messages);
      setMatterResult(matters);
      setSelectedMatter(matters.items.find((item) => itemId(item) === itemId(selectedMatter)) || selectedMatter);
    } catch (error) {
      setActionError(error?.message || "The message could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status) => {
    if (!selectedMatter || !adapter.capabilities.status) return;
    setBusy(true);
    setActionError("");
    try {
      await adapter.updateStatus(itemId(selectedMatter), status);
      const result = await adapter.list();
      setMatterResult(result);
      setSelectedMatter(result.items.find((item) => itemId(item) === itemId(selectedMatter)) || null);
    } catch (error) {
      setActionError(error?.message || "The matter status could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  const matterStatus = selectedMatter ? itemStatus(selectedMatter) : "";
  const canSend = Boolean(selectedMatter && adapter.capabilities.sendMessage);
  const canChangeStatus = Boolean(selectedMatter && adapter.capabilities.status);
  const canUseVoice = Boolean(selectedMatter && adapter.capabilities.voiceNotes);
  const canLoadMessages = Boolean(selectedMatter && adapter.capabilities.messages);

  return (
    <section className="min-w-0">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
            <MessageCircle size={13} />
            Matters
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Conversations with a purpose.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Each matter should stay attached to the need or offer that started it, with an explicit Open → Agreed → Done progress.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openNewMatter} disabled={!adapter.capabilities.create || busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-500 px-3 text-xs font-black text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
            <Plus size={14} />
            {newMatterOpen ? "Close" : "New conversation"}
          </button>
          <button type="button" onClick={loadMatters} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5">
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {!matterResult.supported ? (
        <div role="status" className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
          <Info size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-black">Messaging is not connected to the backend yet.</p>
            <p className="mt-1 text-xs leading-5 opacity-85">Community currently supports posts, comments, reactions and groups. A matter/conversation listing contract is not exposed by the backend yet.</p>
            <p className="mt-2 text-xs leading-5 opacity-85">No sample conversations are shown. The list and thread remain empty until the real API contract is added.</p>
          </div>
        </div>
      ) : matterResult.message ? (
        <div role="status" className="mt-5 rounded-xl border border-rose-300/30 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:bg-rose-950/20 dark:text-rose-200">{matterResult.message}</div>
      ) : null}

      {newMatterOpen ? (
        <form onSubmit={startConversation} className="mt-5 rounded-2xl border border-cyan-500/20 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Start a real conversation</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Choose a member found through visible Community posts. No demo conversations are created.</p>
            </div>
            <button type="button" onClick={() => setNewMatterOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-300">Close</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block min-w-0 text-xs font-bold text-slate-600 dark:text-slate-300">
              Community member
              <select required value={recipientId} onChange={(event) => setRecipientId(event.target.value)} disabled={loadingRecipients || !recipients.length} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-cyan-400 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-white">
                {!recipients.length ? <option value="">{loadingRecipients ? "Loading members…" : "No eligible members found"}</option> : null}
                {recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.name}{recipient.latestPostTitle ? " · " + recipient.latestPostTitle : ""}</option>)}
              </select>
            </label>
            <button type="submit" disabled={busy || loadingRecipients || !recipientId || !adapter.capabilities.create} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-50">
              <MessageCircle size={14} /> {busy ? "Opening…" : "Start conversation"}
            </button>
          </div>
          <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={linkLatestPost} onChange={(event) => setLinkLatestPost(event.target.checked)} disabled={!recipients.find((item) => item.id === recipientId)?.latestPostId} className="mt-1" />
            <span>Link this matter to the selected member’s latest visible Community post when it represents the need or offer being discussed.</span>
          </label>
        </form>
      ) : null}

      <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(230px,0.78fr)_minmax(0,1.5fr)]">
        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Your matters</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">{matterResult.items.length}</span>
          </div>
          <div className="space-y-4">
            {groupedMatters.map((group) => (
              <section key={group.value}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{group.label}</h3>
                  <span className="text-[10px] font-bold text-slate-400">{group.items.length}</span>
                </div>
                {group.items.length ? (
                  <div className="space-y-2">
                    {group.items.map((matter) => {
                      const active = itemId(selectedMatter) === itemId(matter);
                      return (
                        <button type="button" key={itemId(matter)} onClick={() => setSelectedMatter(matter)} className={"w-full rounded-xl border p-3 text-left transition " + (active ? "border-cyan-400/60 bg-cyan-50 dark:bg-cyan-950/25" : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20")}>
                          <span className="block truncate text-xs font-black text-slate-900 dark:text-white">{itemTitle(matter)}</span>
                          <span className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400"><Clock3 size={11} />{itemLocation(matter)}</span>
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">Open matter <ArrowRight size={11} /></span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-[11px] leading-5 text-slate-400 dark:border-white/10">No {group.label.toLowerCase()} matters.</p>
                )}
              </section>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-white/10 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">Matter progress</p>
                <h2 className="mt-1 text-sm font-black text-slate-900 dark:text-white">{selectedMatter ? itemTitle(selectedMatter) : "No matter selected"}</h2>
              </div>
              {selectedMatter ? <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-[10px] font-black capitalize text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">{matterStatus.replace(/_/g, " ")}</span> : null}
            </div>
            <ProgressLine status={matterStatus} />
            {selectedMatter ? (
              <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1.5 text-slate-500 dark:border-white/10 dark:text-slate-300"><User size={12} /> {presenceLabel(selectedMatter)}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1.5 text-slate-500 dark:border-white/10 dark:text-slate-300"><ShieldCheck size={12} /> {trustLabel(selectedMatter)}</span>
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">The progress line is the matter lifecycle, not a live conversation. No matter record has been returned by the current backend.</p>
            )}
            {selectedMatter && canChangeStatus ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {MATTER_STAGES.map((stage) => (
                  <button key={stage.value} type="button" disabled={busy || stage.value === matterStatus} onClick={() => changeStatus(stage.value)} className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:border-cyan-300 hover:bg-cyan-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-cyan-950/20">{stage.label}</button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex min-h-[270px] flex-1 flex-col gap-3 bg-slate-50/70 p-4 dark:bg-slate-950/40 sm:p-5">
            {selectedMatter && canLoadMessages && messageResult.items.length ? (
              messageResult.items.map((message, index) => {
                const mine = Boolean(currentUserId) && String(message?.sender_user_id || message?.author_user_id || "") === String(currentUserId);
                return (
                  <div key={message?.id || message?._id || index} className={"max-w-[88%] rounded-2xl border px-3.5 py-2.5 text-xs leading-5 " + (mine ? "ml-auto border-cyan-300/40 bg-cyan-50 text-slate-800 dark:bg-cyan-950/30 dark:text-slate-100" : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200")}>
                    {messageText(message)}
                    <p className="mt-1 text-[9px] text-slate-400">{message?.created_at ? new Date(message.created_at).toLocaleString() : "Timestamp unavailable"}</p>
                  </div>
                );
              })
            ) : (
              <div className="m-auto max-w-sm py-7 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300"><MessageCircle size={21} /></div>
                <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{selectedMatter ? (canLoadMessages ? "No messages yet" : "Thread not available") : "Every conversation starts with a real need or offer"}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{selectedMatter ? (canLoadMessages ? (messageResult.message || "This conversation is stored in Community. Send the first message below.") : messageResult.message) : "Start a conversation from a member’s visible Community activity. Existing post comments remain separate from private matter messages."}</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-3 dark:border-white/10 sm:p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_REPLIES.map((reply) => (
                <button key={reply} type="button" disabled={!canSend || busy} onClick={() => setDraft(reply)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-cyan-300">{reply}</button>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex items-end gap-2">
              <button type="button" disabled={!canUseVoice || busy} title={canUseVoice ? "Attach a voice note" : "Voice notes require a backend upload and message-attachment contract"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10"><Mic size={17} /></button>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!canSend || busy} rows={1} maxLength={3000} placeholder={canSend ? "Write a message…" : "Messaging unavailable until the backend contract is implemented"} className="min-h-11 min-w-0 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-800 outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
              <button type="submit" disabled={!canSend || busy || !draft.trim()} title="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} /></button>
            </form>
            {actionError ? <p role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-300">{actionError}</p> : null}
            {!adapter.capabilities.voiceNotes ? <p className="mt-2 text-[10px] leading-4 text-slate-400">Voice notes are disabled because no audio upload/message-attachment endpoint is available. Online and trusted indicators only appear when the backend returns those fields.</p> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
