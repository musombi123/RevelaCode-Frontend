import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, MessageSquare, PanelLeftClose, PanelLeftOpen, Sparkles, MessageCircle,
  GraduationCap, Trash2, Pencil, Check, X, Mic, Camera, WifiOff, Search,
  Pin, Settings2, FileText, History, ChevronDown, Wrench
} from "lucide-react";
import { resolveChatTitle } from "@/components/utils/chatTitle";
import { useAuth } from "@/context/AuthContext.jsx";
import { useRevelaAISettings } from "@/ai/revelaAISettingsStore";
import RevelaAIQuickSettings from "@/components/RevelaAIQuickSettings";

const MAX_RENAME_LENGTH = 60;
const PIN_STORAGE_KEY = "revelaai.pinned_chats.v1";
const COLLAPSE_STORAGE_KEY = "revelaai.sidebar.collapsed.v1";

function readStoredSet(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(value) ? value.map(String) : []);
  } catch {
    return new Set();
  }
}

function hubIconFor(chat) {
  const hub = String(chat.hub || chat.activeBrainHub || "auto").toLowerCase();
  if (hub.includes("shamba") || hub.includes("mkulima")) return Sparkles;
  if (hub.includes("biashara")) return MessageCircle;
  if (hub.includes("elimu")) return GraduationCap;
  if (hub.includes("mahubiri") || hub.includes("faith") || hub.includes("scripture")) return MessageCircle;
  return MessageSquare;
}

function dateBucket(value) {
  const date = new Date(value || Date.now());
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const day = Math.round((startToday - startDate) / 86400000);
  if (day <= 0) return "Today";
  if (day === 1) return "Yesterday";
  if (day <= 7) return "Previous 7 days";
  return "Earlier";
}

export default function Sidebar({
  open, setOpen, chats = [], onNewChat, onSelectChat, onDeleteChat, onRenameChat,
  onOpenVoice, onOpenVision, onOpenHumanizer, onOpenIdentity, freeMode = false, onToggleFreeMode,
  activeChatId = null,
}) {
  const { user } = useAuth();
  const { settings, updateSection } = useRevelaAISettings();
  const [collapsed, setCollapsed] = useState(() => {
    try { return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true"; }
    catch { return false; }
  });
  const [search, setSearch] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [pinnedIds, setPinnedIds] = useState(() => readStoredSet(PIN_STORAGE_KEY));
  const [confirmId, setConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const asideRef = useRef(null);
  const accountMenuRef = useRef(null);
  const finishedRef = useRef(false);
  const autoRenamed = useRef(new Set());

  const rows = useMemo(() => chats.map((chat) => ({
    chat, title: resolveChatTitle(chat), auto: !chat.titleLocked,
  })), [chats]);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    if (!onRenameChat) return;
    rows.forEach(({ chat, title, auto }) => {
      if (!auto || !chat.id || title === chat.title || title === "New chat") return;
      const key = String(chat.id) + ":" + title;
      if (autoRenamed.current.has(key)) return;
      autoRenamed.current.add(key);
      onRenameChat(chat.id, title, { manual: false });
    });
  }, [rows, onRenameChat]);

  useEffect(() => {
    try { window.localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "true" : "false"); }
    catch { /* UI preference only. */ }
  }, [collapsed]);

  useEffect(() => {
    try { window.localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(Array.from(pinnedIds))); }
    catch { /* Pinning still works during this session. */ }
  }, [pinnedIds]);

  useEffect(() => {
    if (!open) { setConfirmId(null); setEditingId(null); }
  }, [open]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    const focusSearch = () => {
      setCollapsed(false);
      setOpen(true);
      window.setTimeout(() => searchRef.current?.focus(), 0);
    };
    const toggleCollapse = () => setCollapsed((value) => !value);
    const renameActiveChat = (event) => {
      const id = event?.detail?.chatId;
      const row = rowsRef.current.find((item) => String(item.chat.id) === String(id));
      if (!row) return;
      finishedRef.current = false;
      setConfirmId(null);
      setDraft(row.title);
      setEditingId(row.chat.id);
      setCollapsed(false);
      setOpen(true);
    };
    window.addEventListener("revelaai:focus-chat-search", focusSearch);
    window.addEventListener("revelaai:toggle-sidebar-collapse", toggleCollapse);
    window.addEventListener("revelaai:rename-active-chat", renameActiveChat);
    return () => {
      window.removeEventListener("revelaai:focus-chat-search", focusSearch);
      window.removeEventListener("revelaai:toggle-sidebar-collapse", toggleCollapse);
      window.removeEventListener("revelaai:rename-active-chat", renameActiveChat);
    };
  }, []);

  useEffect(() => {
    if (!open || window.matchMedia("(min-width: 1024px)").matches) return undefined;
    const aside = asideRef.current;
    if (!aside) return undefined;
    const focusable = () => Array.from(aside.querySelectorAll("button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"));
    const first = focusable()[0];
    first?.focus();
    const trap = (event) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const firstItem = items[0], lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) { event.preventDefault(); lastItem.focus(); }
      else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); firstItem.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [open, setOpen]);

  useEffect(() => {
    if (!accountOpen) return undefined;
    const closeOutside = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const closeEscape = (event) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!confirmId) return undefined;
    const onKey = (event) => { if (event.key === "Escape") setConfirmId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmId]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(({ title, chat }) => !query ||
      title.toLowerCase().includes(query) ||
      (chat.messages || []).some((message) => String(message.text || "").toLowerCase().includes(query))
    ).sort((a, b) => {
      const pinDifference = Number(pinnedIds.has(String(b.chat.id))) - Number(pinnedIds.has(String(a.chat.id)));
      return pinDifference || new Date(b.chat.updatedAt || b.chat.createdAt || 0).getTime() - new Date(a.chat.updatedAt || a.chat.createdAt || 0).getTime();
    });
  }, [rows, search, pinnedIds]);

  const groups = useMemo(() => {
    const order = ["Pinned", "Today", "Yesterday", "Previous 7 days", "Earlier"];
    const grouped = new Map(order.map((label) => [label, []]));
    filteredRows.forEach((row) => {
      if (pinnedIds.has(String(row.chat.id))) {
        grouped.get("Pinned").push(row);
      } else {
        const bucket = dateBucket(row.chat.updatedAt || row.chat.createdAt);
        grouped.get(bucket).push(row);
      }
    });
    return order.map((label) => ({ label, rows: grouped.get(label) })).filter((group) => group.rows.length);
  }, [filteredRows, pinnedIds]);

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
      onRenameChat?.(chat.id, "", { manual: false });
      return;
    }
    if (next !== currentTitle) onRenameChat?.(chat.id, next, { manual: true });
  };

  const togglePin = (chatId) => {
    const key = String(chatId);
    setPinnedIds((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openTool = () => {
    setToolsOpen(false);
    onOpenHumanizer?.();
    setOpen(false);
  };

  const initials = String(user?.name || user?.full_name || user?.contact || "R")
    .trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const planLabel = user?.subscription?.plan_name || user?.plan_name || user?.plan?.name || "Free";

  return (
    <>
      {open && <button type="button" aria-label="Close RevelaAI sidebar" onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 bg-overlay/55 backdrop-blur-[2px] lg:hidden" />}
      <aside ref={asideRef} aria-label="RevelaAI conversation navigation" data-demo="sidebar" data-theme-surface="sidebar"
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-line bg-sidebar text-fg shadow-2xl",
          "transition-[width,transform,background-color,border-color] duration-200 ease-out w-[min(88vw,280px)]",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:z-auto lg:translate-x-0 lg:shadow-none",
          collapsed ? "lg:w-[72px]" : "lg:w-[280px]"
        ].join(" ")}>
        <div className={"flex h-16 shrink-0 items-center justify-between border-b border-line px-3 " + (collapsed ? "lg:justify-center lg:px-2" : "")}>
          <div className={"flex min-w-0 items-center gap-3 " + (collapsed ? "lg:hidden" : "")}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-inverse shadow-sm" aria-hidden="true">
              <span className="text-2xl font-black leading-none">r</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black tracking-tight">RevelaAI</span>
              <span className="block truncate text-[10px] text-muted">Adaptive intelligence</span>
            </span>
          </div>
          <span className={"hidden h-9 w-9 items-center justify-center rounded-xl bg-accent text-inverse font-black text-2xl " + (collapsed ? "lg:flex" : "")} aria-hidden="true">r</span>
          <button type="button" onClick={() => {
            if (window.matchMedia("(min-width: 1024px)").matches) setCollapsed((value) => !value);
            else setOpen(false);
          }} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-12 w-12 min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl text-fg-secondary hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:ml-auto">
            {collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}
          </button>
        </div>

        <div className={"shrink-0 space-y-2 border-b border-line p-3 " + (collapsed ? "lg:px-2" : "")}>
          <button type="button" data-demo="sidebar-new-chat" onClick={() => { onNewChat?.(); setToolsOpen(false); setOpen(false); }}
            title="New chat" aria-label="New chat"
            className={"flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-3 text-sm font-bold text-accent hover:bg-accent/15 active:scale-[.99] " + (collapsed ? "lg:px-0" : "lg:justify-start")}>
            <Plus size={18}/><span className={collapsed ? "lg:hidden" : ""}>New chat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (collapsed) setCollapsed(false);
              setToolsOpen((value) => !value);
            }}
            aria-expanded={toolsOpen}
            aria-controls="revelaai-sidebar-tools"
            title="Open voice, vision and specialist tools"
            className={"flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-xs font-semibold text-fg-secondary hover:border-accent/35 hover:text-accent " + (collapsed ? "lg:px-0" : "lg:justify-start")}
          >
            <Wrench size={16}/>
            <span className={collapsed ? "lg:hidden" : ""}>Tools</span>
            <ChevronDown size={14} className={"ml-auto transition-transform " + (toolsOpen ? "rotate-180" : "") + (collapsed ? "lg:hidden" : "")}/>
          </button>

          {toolsOpen && (
            <div id="revelaai-sidebar-tools" className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-surface p-2">
              <button type="button" onClick={() => { onOpenVoice?.(); setToolsOpen(false); setOpen(false); }}
                title="Talk to RevelaAI" aria-label="Voice"
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface-2 px-2 text-xs font-semibold text-fg-secondary hover:border-accent/40 hover:text-accent">
                <Mic size={15}/>Voice
              </button>
              <button type="button" onClick={() => { onOpenVision?.(); setToolsOpen(false); setOpen(false); }}
                title="Explore with vision" aria-label="Vision"
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface-2 px-2 text-xs font-semibold text-fg-secondary hover:border-accent/40 hover:text-accent">
                <Camera size={15}/>Vision
              </button>
              <button type="button" onClick={openTool} title="Open Selective Humanizer" aria-label="Open Humanizer"
                className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-xs font-semibold text-fg-secondary hover:border-accent/40 hover:text-accent">
                <FileText size={15}/>Selective Humanizer
              </button>
              <button type="button" role="switch" aria-checked={freeMode} onClick={() => onToggleFreeMode?.()}
                title={freeMode ? "Turn off weak-network mode" : "Enable weak-network mode"}
                className="col-span-2 flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 text-left hover:border-accent/35"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <WifiOff size={15} className={freeMode ? "text-accent" : "text-muted"}/>
                  <span className="min-w-0 text-xs font-semibold text-fg-secondary">Weak-network free mode</span>
                </span>
                <span className={"relative h-5 w-9 shrink-0 rounded-full " + (freeMode ? "bg-accent" : "bg-line-strong")}>
                  <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all " + (freeMode ? "left-[18px]" : "left-0.5")}/>
                </span>
              </button>
            </div>
          )}
        </div>

        <div className={"shrink-0 px-3 pb-2 pt-3 " + (collapsed ? "lg:px-2" : "")}>
          {!collapsed && <label className="relative block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
            <input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats"
              aria-label="Search conversations"
              className="min-h-10 w-full rounded-xl border border-line bg-input pl-9 pr-3 text-xs text-fg placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"/>
          </label>}
          {collapsed && <button type="button" onClick={() => setCollapsed(false)} title="Search chats" aria-label="Expand sidebar to search"
            className="hidden h-10 w-full items-center justify-center rounded-xl text-muted hover:bg-surface-2 lg:flex"><Search size={17}/></button>}
          <div className="mt-3 flex items-center justify-between px-1">
            <span className={"text-[10px] font-bold uppercase tracking-[.16em] text-muted " + (collapsed ? "lg:hidden" : "")}>Conversations</span>
            <History size={14} className={"text-muted " + (collapsed ? "lg:mx-auto" : "")}/>
          </div>
        </div>

        <nav aria-label="Conversation history" className={"min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3 " + (collapsed ? "lg:px-1" : "")}>
          {rows.length === 0 && !search ? (
            <div className={"flex flex-col items-center justify-center px-4 py-10 text-center " + (collapsed ? "lg:px-1" : "")}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-muted"><MessageSquare size={19}/></span>
              <p className={"mt-3 text-xs font-semibold text-fg-secondary " + (collapsed ? "lg:hidden" : "")}>No conversations yet</p>
              <p className={"mt-1 max-w-[190px] text-[11px] leading-5 text-muted " + (collapsed ? "lg:hidden" : "")}>Start a new chat and it will appear here.</p>
            </div>
          ) : null}
          {search && filteredRows.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted">No chats match this search.</p>}
          {groups.map(({label, rows: groupRows}) => (
            <section key={label} className="mb-3">
              <h2 className={"px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted " + (collapsed ? "lg:hidden" : "")}>{label}</h2>
              <ul className="space-y-1">
                {groupRows.map(({chat,title}) => {
                  const active = activeChatId === chat.id;
                  const confirming = confirmId === chat.id;
                  const editing = editingId === chat.id;
                  const HubIcon = hubIconFor(chat);
                  const count = chat.messages?.length || 0;
                  const pinned = pinnedIds.has(String(chat.id));
                  return <li key={chat.id} className="group relative">
                    {editing ? (
                      <div className="flex items-center gap-2 rounded-xl border border-accent/35 bg-surface-2 p-2">
                        <input ref={inputRef} value={draft} maxLength={MAX_RENAME_LENGTH}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") { event.preventDefault(); commitRename(chat,title); }
                            else if (event.key === "Escape") { event.preventDefault(); finishedRef.current = true; setEditingId(null); }
                          }}
                          onBlur={() => commitRename(chat,title)} aria-label="Chat name" placeholder="Chat name"
                          className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted"/>
                        <button type="button" onMouseDown={(event) => { event.preventDefault(); commitRename(chat,title); }}
                          aria-label="Save chat name" className="rounded-lg p-2 text-accent"><Check size={15}/></button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => { if (!confirming) { onSelectChat?.(chat); setOpen(false); } }}
                          onDoubleClick={() => startRename(chat,title)} aria-current={active ? "page" : undefined}
                          title={title} className={"flex min-h-12 w-full min-w-0 items-center gap-2 rounded-xl px-2.5 text-left transition " + (collapsed ? "lg:justify-center lg:px-1 " : "") + (confirming ? "bg-danger/10 text-danger" : active ? "bg-accent/12 text-accent ring-1 ring-accent/20" : "text-fg-secondary hover:bg-surface-2 hover:text-fg")}>
                          <span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " + (active ? "bg-accent/12 text-accent" : "bg-surface-2 text-muted")}>
                            {confirming ? <Trash2 size={15}/> : <HubIcon size={15}/>}
                          </span>
                          <span className={"min-w-0 flex-1 " + (collapsed ? "lg:hidden" : "")}>
                            <span className="block truncate text-xs font-semibold">{title}</span>
                            <span className="mt-0.5 block truncate text-[10px] text-muted">{confirming ? "Confirm deletion below" : count + (count === 1 ? " message" : " messages")}</span>
                          </span>
                          {pinned && <Pin size={12} className={"shrink-0 text-accent " + (collapsed ? "lg:hidden" : "")}/>}
                        </button>
                        <div className={"absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 " + (collapsed ? "lg:hidden" : "")}>
                          {confirming ? <>
                            <button type="button" onClick={() => handleDelete(chat.id)} aria-label="Confirm delete chat" title="Delete permanently"
                              className="rounded-lg bg-danger/10 p-2 text-danger hover:bg-danger/20"><Check size={14}/></button>
                            <button type="button" onClick={() => setConfirmId(null)} aria-label="Cancel delete" title="Cancel"
                              className="rounded-lg p-2 text-muted hover:bg-surface-3"><X size={14}/></button>
                          </> : <>
                            <button type="button" onClick={() => togglePin(chat.id)} aria-label={pinned ? "Unpin chat" : "Pin chat"} title={pinned ? "Unpin" : "Pin"}
                              className="rounded-lg p-2 text-muted opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 hover:bg-surface-3 hover:text-accent"><Pin size={13}/></button>
                            {onRenameChat && <button type="button" onClick={() => startRename(chat,title)} aria-label={"Rename chat: " + title} title="Rename"
                              className="rounded-lg p-2 text-muted opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-surface-3 hover:text-fg"><Pencil size={13}/></button>}
                            <button type="button" onClick={() => setConfirmId(chat.id)} aria-label={"Delete chat: " + title} title="Delete"
                              className="rounded-lg p-2 text-muted opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-danger/10 hover:text-danger"><Trash2 size={13}/></button>
                          </>}
                        </div>
                      </>
                    )}
                  </li>;
                })}
              </ul>
            </section>
          ))}
        </nav>

        <div className={"shrink-0 border-t border-line p-2.5 " + (collapsed ? "lg:px-2" : "")}>
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
              aria-controls="revelaai-account-menu"
              aria-label="Open account and settings"
              title="Account and settings"
              className={"flex min-h-11 w-full items-center gap-2 rounded-xl bg-surface-2 px-2.5 py-2 text-left transition hover:bg-surface-3 " + (collapsed ? "lg:justify-center lg:px-0" : "")}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-inverse">{initials}</span>
              <span className={"min-w-0 flex-1 " + (collapsed ? "lg:hidden" : "")}>
                <span className="block truncate text-xs font-bold text-fg">{user?.name || user?.full_name || "Your account"}</span>
                <span className="block truncate text-[10px] text-muted">Account · AI settings</span>
              </span>
              <span className={"rounded-full border border-accent/20 bg-accent/10 px-2 py-1 text-[9px] font-bold text-accent " + (collapsed ? "lg:hidden" : "")}>{planLabel}</span>
              <Settings2 size={15} className={"shrink-0 text-muted " + (collapsed ? "lg:hidden" : "")}/>
            </button>

            {accountOpen && (
              <div
                id="revelaai-account-menu"
                role="dialog"
                aria-label="RevelaAI account and settings"
                className={"absolute bottom-[calc(100%+8px)] left-0 z-[100] w-[min(320px,calc(100vw-1rem))] max-h-[min(76dvh,680px)] overflow-y-auto rounded-2xl border border-line bg-popover p-3 text-fg shadow-2xl " + (collapsed ? "lg:left-[calc(100%+8px)] lg:bottom-0" : "")}
              >
                <div className="mb-3 flex items-center gap-2 border-b border-line pb-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-inverse">{initials}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-fg">{user?.name || user?.full_name || "Your account"}</p>
                    <p className="truncate text-[10px] text-muted">{user?.contact || user?.email || planLabel}</p>
                  </div>
                </div>

                <RevelaAIQuickSettings
                  settings={settings}
                  updateSection={updateSection}
                  onOpenFull={() => {
                    setAccountOpen(false);
                    window.dispatchEvent(new CustomEvent("revelaai:settings-open"));
                  }}
                />

                <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-line pt-3">
                  <button type="button" onClick={() => { setAccountOpen(false); onOpenIdentity?.(); }}
                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2 text-[11px] font-semibold text-fg-secondary hover:bg-surface-2 hover:text-fg">
                    <Sparkles size={14}/> AI Identity
                  </button>
                  <button type="button" onClick={() => { setAccountOpen(false); window.dispatchEvent(new CustomEvent("revelaai:research-open")); }}
                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2 text-[11px] font-semibold text-fg-secondary hover:bg-surface-2 hover:text-fg">
                    <Search size={14}/> Search
                  </button>
                  <button type="button" onClick={() => { setAccountOpen(false); window.dispatchEvent(new CustomEvent("revelaai:settings-open")); }}
                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2 text-[11px] font-semibold text-fg-secondary hover:bg-surface-2 hover:text-fg">
                    <Settings2 size={14}/> All settings
                  </button>
                  <button type="button" onClick={() => { setAccountOpen(false); window.dispatchEvent(new CustomEvent("revelacode:premium-open", { detail: { planCode: "" } })); }}
                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-accent/25 bg-accent/5 px-2 text-[11px] font-semibold text-accent hover:bg-accent/10">
                    <Sparkles size={14}/> Plans
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
