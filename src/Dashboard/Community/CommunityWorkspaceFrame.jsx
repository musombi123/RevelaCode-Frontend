import React from "react";
import { useTheme } from "@/components/hooks/useTheme.jsx";
import {
  Bell,
  BookOpen,
  Briefcase,
  Compass,
  GraduationCap,
  Heart,
  Home,
  Leaf,
  MessageCircle,
  MoreHorizontal,
  Plus,
  ShoppingBag,
  Store,
  Users,
  User,
  UserPlus,
} from "lucide-react";

/**
 * Shared RevelaCode / Jumuiya frame for inner Community workspaces.
 * Keeps the Feed and Marketplace visually aligned with the Community home.
 */
export default function CommunityWorkspaceFrame({
  children,
  header,
  user,
  profile,
  displayName = "Community member",
  activePage = "feed",
  onNavigate,
  onCreatePost,
  onOpenPillar,
  onBackToApp,
}) {
  const { resolvedTheme } = useTheme();
  const avatar =
    profile?.avatar_url ||
    user?.avatar_url ||
    user?.avatar ||
    user?.profile_image ||
    "";

  const navItems = [
    { label: "Community", helper: "Jumuiya", icon: Home, page: "feed", action: () => onNavigate("community-home") },
    { label: "Discover", helper: "Explore more", icon: Compass, page: "discover", action: () => onNavigate("community-discover") },
    { label: "Marketplace", helper: "Buy & sell", icon: Store, page: "marketplace", action: () => onNavigate("community-marketplace") },
    { label: "Groups", helper: "Join & engage", icon: Users, page: "groups", action: () => onNavigate("community-circles") },
    { label: "Messages", helper: "Chat & connect", icon: MessageCircle, page: "messages", action: () => onNavigate("community-chats") },
    { label: "Notifications", helper: "Stay updated", icon: Bell, page: "notifications", action: () => onNavigate("community-notifications") },
    { label: "My Space", helper: "Profile & settings", icon: User, page: "profile", action: () => onNavigate("community-me") },
  ];

  const quickLinks = [
    { label: "Community feed", icon: MessageCircle, action: () => onNavigate("community-feed") },
    { label: "Marketplace", icon: ShoppingBag, action: () => onNavigate("community-marketplace") },
    { label: "Member directory", icon: User, action: () => onNavigate("community-people") },
    { label: "Invite members", icon: UserPlus, action: () => onNavigate("community-invite-members") },
  ];

  const pillars = [
    { label: "Biashara", key: "biashara", icon: Briefcase, color: "bg-cyan-500" },
    { label: "Shamba", key: "shamba", icon: Leaf, color: "bg-emerald-500" },
    { label: "Elimu", key: "elimu", icon: GraduationCap, color: "bg-violet-500" },
    { label: "Faith", key: "faith", icon: Heart, color: "bg-sky-500" },
    { label: "Health", key: "health", icon: Heart, color: "bg-rose-500" },
  ];

  return (
    <div data-community-workspace="true" data-theme={resolvedTheme} className={"min-h-screen w-full lg:h-full lg:min-h-0 lg:overflow-hidden " + (resolvedTheme === "dark" ? "dark bg-[#050b1d] text-slate-100" : "light bg-slate-50 text-slate-900")}>
      <div className="min-h-screen lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[208px_minmax(0,1fr)]">
        <aside className="relative z-20 hidden min-w-0 overflow-hidden bg-gradient-to-b from-[#071a3d] via-[#08265b] to-[#061b40] text-white lg:block lg:h-full lg:min-h-0">
          <div className="pointer-events-none absolute -bottom-20 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-[55%] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="sticky top-0 flex h-full min-h-0 flex-col overflow-y-auto overscroll-y-contain px-4 pb-5 pt-5">
            <button type="button" onClick={onBackToApp} className="mb-7 flex items-center gap-2.5 px-1 text-left">
              <img src="/Logo.png" alt="RevelaCode" className="h-10 w-10 rounded-xl object-contain" />
              <span>
                <span className="block text-[15px] font-black tracking-tight">RevelaCode</span>
                <span className="block text-[9px] font-medium tracking-wide text-blue-100/70">Learn · Connect · Grow</span>
              </span>
            </button>

            <nav aria-label="Community workspace navigation" className="space-y-1">
              {navItems.map(({ label, helper, icon: Icon, page, action }) => {
                const active = activePage === page || (activePage === "feed" && page === "feed");
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={action}
                    aria-current={active ? "page" : undefined}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-950/25" : "text-blue-50/90 hover:bg-white/10"}`}
                  >
                    <Icon size={18} className={active ? "text-white" : "text-blue-100"} />
                    <span className="min-w-0">
                      <span className="block text-xs font-extrabold">{label}</span>
                      <span className={`mt-0.5 block text-[10px] ${active ? "text-blue-100" : "text-blue-100/60"}`}>{helper}</span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="my-5 h-px bg-white/15" />
            <p className="px-2 text-[11px] font-extrabold text-blue-50">Our Pillars</p>
            <div className="mt-3 space-y-1">
              {pillars.map(({ label, key, icon: Icon, color }) => (
                <button key={key} type="button" onClick={() => onOpenPillar?.(key)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold text-blue-50/90 transition hover:bg-white/10">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${color} text-white`}><Icon size={13} /></span>
                  {label}
                </button>
              ))}
              <button type="button" onClick={onBackToApp} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold text-blue-100/70 transition hover:bg-white/10">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10"><MoreHorizontal size={15} /></span>
                More
              </button>
            </div>

            <div className="mt-auto pt-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <p className="text-[10px] font-extrabold text-blue-50">A trusted community</p>
                <p className="mt-1.5 text-[10px] leading-4 text-blue-100/65">Connect with people, knowledge and opportunities across Jumuiya.</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:overscroll-y-contain">
          <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#071226]/95 px-3 py-2.5 backdrop-blur-xl sm:px-5 lg:px-7">
            <div className="mx-auto w-full max-w-[1500px]">{header}</div>
          </div>

          <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-4 px-3 pb-28 pt-4 sm:px-5 lg:px-7 xl:grid-cols-[minmax(0,1fr)_245px]">
            <main className="min-w-0">{children}</main>

            <aside className="hidden min-w-0 space-y-3 xl:block">
              <section className="rounded-[20px] border border-white/[0.08] bg-[#0d1729] p-4 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Your space</p>
                <div className="mt-3 flex min-w-0 items-center gap-2.5">
                  {avatar ? (
                    <img src={avatar} alt="" className="h-10 w-10 rounded-xl border border-white/10 object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-xs font-black text-slate-950">{String(displayName).trim().slice(0, 2).toUpperCase()}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-black text-white">{displayName}</span>
                    <span className="block text-[10px] text-slate-400">Jumuiya member</span>
                  </span>
                </div>
                <button type="button" onClick={() => onNavigate("community-me")} className="mt-4 w-full rounded-xl border border-white/10 px-3 py-2.5 text-left text-[10px] font-bold text-slate-300 transition hover:border-cyan-400/50 hover:bg-white/[0.04]">
                  Open my space <span className="float-right text-cyan-300">→</span>
                </button>
              </section>

              <section className="rounded-[20px] border border-white/[0.08] bg-[#0d1729] p-3 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
                <p className="px-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Shortcuts</p>
                <div className="mt-2 space-y-1">
                  {quickLinks.map(({ label, icon: Icon, action }) => (
                    <button key={label} type="button" onClick={action} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
                      <Icon size={14} className="text-blue-200" /> {label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-[20px] border border-cyan-500/15 bg-gradient-to-br from-[#0b2346] to-[#0b354b] p-4">
                <div className="flex items-center gap-2 text-cyan-200"><BookOpen size={15} /><p className="text-[10px] font-black">Grow with Jumuiya</p></div>
                <p className="mt-2 text-[10px] leading-4 text-blue-100/75">Share what you know, discover useful services and build trusted connections.</p>
                <button type="button" onClick={onCreatePost} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-3 py-2 text-[10px] font-black text-slate-950 transition hover:bg-cyan-300"><Plus size={12} /> Share an update</button>
              </section>
            </aside>
          </div>
        </div>
      </div>

      <nav aria-label="Jumuiya mobile navigation" className="fixed inset-x-3 bottom-[max(9px,env(safe-area-inset-bottom))] z-40 mx-auto grid max-w-[460px] grid-cols-5 items-end gap-1 rounded-[23px] border border-white/[0.10] bg-[#101c30]/95 p-2 shadow-[0_12px_35px_rgba(0,0,0,.4)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => onNavigate("community-home")} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-extrabold text-slate-400"><Home size={18} />Home</button>
        <button type="button" onClick={() => onNavigate("community-discover")} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-extrabold text-slate-400"><Compass size={18} />Discover</button>
        <button type="button" onClick={onCreatePost} aria-label="Create post" className="flex flex-col items-center gap-1 pb-0.5 text-[9px] font-extrabold text-cyan-200">
          <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/40"><Plus size={23} /></span>
          Create
        </button>
        <button type="button" onClick={() => onNavigate("community-circles")} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-extrabold text-slate-400"><Users size={18} />Networks</button>
        <button type="button" onClick={() => onNavigate("community-me")} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-extrabold text-slate-400"><User size={18} />Me</button>
      </nav>
    </div>
  );
}
