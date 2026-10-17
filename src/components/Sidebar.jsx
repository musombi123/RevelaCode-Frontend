// src/components/Sidebar.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  MessageSquare,
  PanelLeftClose,
  Sparkles,
  MessageCircle,
  GraduationCap,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { resolveChatTitle } from "@/utils/chatTitle";

const MAX_RENAME_LENGTH = 60;

/* Hub -> icon, same mapping as before, kept in one place. */
function hubIconFor(chat) {
  const hub = String(chat.hub || chat.activeBrainHub || "auto").toLowerCase();
  if (hub.includes("shamba") || hub.includes("mkulima")) return Sparkles;
  if (hub.includes("biashara")) return MessageCircle;
  if (hub.includes("elimu")) return GraduationCap;
  if (hub.includes("mahubiri") || hub.includes("faith") || hub.includes("scripture")) {
    return MessageCircle;
  }
  return MessageSquare;
}

export default function Sidebar({
  open,
  setOpen,
  chats = [],
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat, // (chatId, title, { manual: boolean }) => void
  activeChatId = null,
}) {
  const [confirmId, setConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  const inputRef = useRef(null);
  const finishedRef = useRef(false); // guards Enter/Escape followed by blur
  const autoRenamed = useRef(new Set());

  /* =========================================================
     TITLES
     Each chat shows a resolved title: manual name > meaningful
     stored title > generated from the first message with a topic.
  ========================================================= */

  const rows = useMemo(
    () =>
      chats.map((chat) => ({
        chat,
        title: resolveChatTitle(chat),
        auto: !chat.titleLocked,
      })),
    [chats]
  );

  // Persist generated titles once, so "hello" is replaced everywhere
  // (storage, history) as soon as the chat has a real topic.
  useEffect(() => {
    if (!onRenameChat) return;
    rows.forEach(({ chat, title, auto }) => {
      if (!auto || !chat.id) return;
      if (title === chat.title || title === "New chat") return;
      const key = `${chat.id}:${title}`;
      if (autoRenamed.current.has(key)) return;
      autoRenamed.current.add(key);
      onRenameChat(chat.id, title, { manual: false });
    });
  }, [rows, onRenameChat]);

  /* =========================================================
     UI STATE
  ========================================================= */

  useEffect(() => {
    if (!open) {
      setConfirmId(null);
      setEditingId(null);
    }
  }, [open]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (!confirmId) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setConfirmId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmId]);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const handleDelete = (chatId) => {
    if (!chatId) return;
    setConfirmId(null);
    onDeleteChat?.(chatId);
  };

  const startRename = (chat, title) => {
    if (!onRenameChat) return;
    finishedRef.current = false;
    setConfirmId(null);
    setDraft(title);
    setEditingId(chat.id);
  };

  const commitRename = (chat, currentTitle) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const next = draft.replace(/\s+/g, " ").trim().slice(0, MAX_RENAME_LENGTH);
    setEditingId(null);

    if (!next) {
      // Empty name = give control back to automatic naming.
      onRenameChat?.(chat.id, "", { manual: false });
      return;
    }
    if (next !== currentTitle) onRenameChat?.(chat.id, next, { manual: true });
  };

  const cancelRename = () => {
    finishedRef.current = true;
    setEditingId(null);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close RevelaAI sidebar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-full min-h-0 w-[280px] shrink-0 flex-col
          overflow-hidden border-r border-white/10 bg-revela-card text-white shadow-2xl
          transition-all duration-300 ease-out
          md:static md:z-auto
          ${open ? "translate-x-0 md:translate-x-0" : "-translate-x-full md:w-0 md:border-r-0"}
        `}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 text-white shadow-lg">
              <Sparkles size={17} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">RevelaAI</p>
              <p className="truncate text-[10px] text-gray-400">Adaptive Intelligence</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="shrink-0 text-gray-400 hover:bg-white/10 hover:text-white"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </Button>
        </div>

        {/* New chat */}
        <div className="shrink-0 p-3">
          <Button
            type="button"
            onClick={() => onNewChat?.()}
            className="flex w-full items-center justify-start gap-2 rounded-xl border border-white/10 bg-revela-secondary px-3 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-revela-secondary/80 active:scale-[0.99]"
          >
            <Plus size={18} />
            New chat
          </Button>
        </div>

        {/* Label */}
        <div className="shrink-0 px-3 pb-2">
          <p className="px-2 text-xs font-semibold text-gray-500">Conversations</p>
        </div>

        {/* History */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-500">
                <MessageSquare size={20} />
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-400">No conversations yet</p>
              <p className="mt-1 max-w-[190px] text-xs leading-5 text-gray-500">
                Start a new chat and it will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {rows.map(({ chat, title }) => {
                const active = activeChatId === chat.id;
                const confirming = confirmId === chat.id;
                const editing = editingId === chat.id;
                const HubIcon = hubIconFor(chat);
                const count = chat.messages?.length || 0;

                return (
                  <li key={chat.id} className="group relative">
                    {editing ? (
                      /* ---------- Inline rename ---------- */
                      <div className="flex items-center gap-3 rounded-xl bg-white/10 py-2.5 pl-3 pr-2 ring-1 ring-emerald-400/40">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                          <Pencil size={15} aria-hidden="true" />
                        </span>
                        <input
                          ref={inputRef}
                          value={draft}
                          maxLength={MAX_RENAME_LENGTH}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitRename(chat, title);
                            } else if (event.key === "Escape") {
                              event.preventDefault();
                              cancelRename();
                            }
                          }}
                          onBlur={() => commitRename(chat, title)}
                          aria-label="Chat name"
                          placeholder="Chat name"
                          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-gray-500"
                        />
                        <button
                          type="button"
                          // mousedown fires before blur, so the click is not lost
                          onMouseDown={(event) => {
                            event.preventDefault();
                            commitRename(chat, title);
                          }}
                          aria-label="Save name"
                          title="Save name"
                          className="rounded-lg p-1.5 text-emerald-300 transition hover:bg-emerald-500/15"
                        >
                          <Check size={15} />
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* ---------- Conversation ---------- */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirming) onSelectChat?.(chat);
                          }}
                          onDoubleClick={() => startRename(chat, title)}
                          aria-current={active ? "true" : undefined}
                          className={`
                            flex w-full min-w-0 items-center gap-3 rounded-xl py-3 pl-3 text-left transition
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50
                            ${onRenameChat ? "pr-[4.5rem]" : "pr-12"}
                            ${
                              confirming
                                ? "bg-red-500/10 text-white"
                                : active
                                  ? "bg-white/10 text-white"
                                  : "text-gray-300 hover:bg-white/5 hover:text-white"
                            }
                          `}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              confirming
                                ? "bg-red-500/15 text-red-300"
                                : active
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-white/5 text-gray-500 group-hover:text-gray-300"
                            }`}
                          >
                            {confirming ? (
                              <Trash2 size={16} aria-hidden="true" />
                            ) : (
                              <HubIcon size={16} aria-hidden="true" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-sm font-semibold ${
                                active || confirming ? "text-white" : "text-gray-300"
                              }`}
                              title={title}
                            >
                              {title}
                            </span>
                            <span
                              className={`mt-0.5 block truncate text-[11px] ${
                                confirming ? "text-red-300" : "text-gray-500"
                              }`}
                            >
                              {confirming
                                ? "Delete this chat permanently?"
                                : count > 0
                                  ? `${count} ${count === 1 ? "message" : "messages"}`
                                  : "No messages yet"}
                            </span>
                          </span>
                        </button>

                        {/* ---------- Row actions ---------- */}
                        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                          {confirming ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDelete(chat.id)}
                                aria-label="Confirm delete"
                                title="Delete permanently"
                                className="rounded-lg bg-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/30 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmId(null)}
                                aria-label="Cancel delete"
                                title="Cancel"
                                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                              >
                                <X size={15} />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-0.5 transition md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                              {onRenameChat && (
                                <button
                                  type="button"
                                  onClick={() => startRename(chat, title)}
                                  aria-label={`Rename chat: ${title}`}
                                  title="Rename"
                                  className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setConfirmId(chat.id)}
                                aria-label={`Delete chat: ${title}`}
                                title="Delete"
                                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="rounded-xl bg-white/[0.03] px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles size={13} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-gray-300">RevelaAI</p>
                <p className="truncate text-[10px] text-gray-500">Powered by RevelaCode</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
