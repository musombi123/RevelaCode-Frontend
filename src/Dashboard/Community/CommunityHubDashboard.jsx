import React, { useRef } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Compass,
  Globe2,
  GraduationCap,
  Heart,
  Home,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";

import CommunityMediaCards from "@/Dashboard/Community/CommunityMediaCards.jsx";
import CommunityPostCard from "@/Dashboard/Community/components/CommunityPostCard.jsx";
import WorldEventsDesk from "@/Dashboard/Community/WorldEventsDesk.jsx";

// Pexels free-to-use community lifestyle photo by Kewal Nagda.
const HERO_IMAGE =
  "https://images.pexels.com/photos/33235949/pexels-photo-33235949.jpeg?auto=compress&cs=tinysrgb&w=1800";
const CITY_IMAGE =
  "https://images.unsplash.com/photo-1741991110666-88115e724741?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1200";

function initials(name = "Community member") {
  return String(name)
    .trim()
    .split(/\\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "RC";
}

function shortNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat("en-KE", {
    notation: number >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(number);
}

function getPostAuthor(post) {
  return (
    post?.author?.name ||
    post?.author?.full_name ||
    post?.author_name ||
    post?.username ||
    "Community member"
  );
}

function getPostText(post) {
  return (
    post?.body ||
    post?.content ||
    post?.text ||
    post?.description ||
    post?.title ||
    ""
  );
}

function HubButton({ icon: Icon, title, subtitle, color = "blue", onClick }) {
  const palettes = {
    blue: "bg-blue-100 text-blue-700 ring-blue-200",
    teal: "bg-teal-100 text-teal-700 ring-teal-200",
    coral: "bg-orange-100 text-orange-700 ring-orange-200",
    violet: "bg-violet-100 text-violet-700 ring-violet-200",
    amber: "bg-amber-100 text-amber-700 ring-amber-200",
    pink: "bg-pink-100 text-pink-700 ring-pink-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 flex-col items-center justify-center rounded-[19px] border border-white/80 bg-white px-2 py-3 text-center shadow-[0_5px_18px_rgba(32,52,109,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_24px_rgba(32,52,109,0.10)] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ring-1 ${palettes[color] || palettes.blue}`}>
        <Icon size={19} strokeWidth={2.2} />
      </span>
      <span className="mt-2 text-[11px] font-extrabold leading-4 text-[#172344] sm:text-xs">{title}</span>
      <span className="mt-0.5 text-[10px] leading-4 text-slate-500">{subtitle}</span>
    </button>
  );
}

function QuickAction({ icon: Icon, title, color, onClick }) {
  const palette = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    teal: "bg-teal-100 text-teal-700",
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    pink: "bg-pink-100 text-pink-700",
  }[color] || "bg-blue-100 text-blue-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-transparent px-2 py-3 text-center transition hover:border-white hover:bg-white hover:shadow-sm"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette}`}>
        <Icon size={18} />
      </span>
      <span className="text-[10px] font-bold leading-4 text-[#172344] sm:text-[11px]">{title}</span>
    </button>
  );
}

function SectionHeading({ title, action, onAction }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[14px] font-black tracking-tight text-[#111c3b] sm:text-[15px]">{title}</h2>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 text-[10px] font-extrabold text-blue-600 hover:text-blue-800 sm:text-[11px]"
        >
          {action} <ArrowRight size={12} />
        </button>
      ) : null}
    </div>
  );
}

export default function CommunityHubDashboard({
  user,
  profile,
  displayName = "Member",
  searchQuery = "",
  onSearchChange,
  onSearchSubmit,
  onNavigate,
  onCreatePost,
  onCreateEvent,
  onCreateAd,
  onNotifications,
  onProfile,
  onSelectIntent,
  onSelectSurface,
  onOpenPillar,
  onBackToApp,
  posts = [],
  aroundYouItems = [],
  loading = false,
  error = "",
  refreshing = false,
  onRefresh,
  onLike,
  onOpenFeed,
  onOpenPost,
  selectedPost,
  onClosePost,
  promotionPosts = [],
}) {
  const searchRef = useRef(null);
  const avatar =
    profile?.avatar_url ||
    user?.avatar_url ||
    user?.avatar ||
    user?.profile_image ||
    "";
  const author = posts[0] ? getPostAuthor(posts[0]) : "";
  const firstPostText = posts[0] ? getPostText(posts[0]) : "";
  const activeOpportunities = aroundYouItems.length;
  const contributionCount =
    profile?.stats?.contributions ??
    profile?.contributions ??
    posts.length;
  const reachCount =
    profile?.stats?.reach ??
    profile?.community_reach ??
    profile?.reach;
  const levelLabel =
    profile?.level_label ||
    profile?.level_name ||
    (profile?.level ? `Level ${profile.level}` : "Community member");

  const navItems = [
    { label: "Community", helper: "Jumuiya", icon: Home, action: () => onNavigate("community-home"), active: true },
    { label: "Discover", helper: "Explore more", icon: Compass, action: () => onNavigate("community-discover") },
    { label: "Marketplace", helper: "Buy & sell", icon: Store, action: () => onNavigate("community-marketplace") },
    { label: "Groups", helper: "Join & engage", icon: UsersRound, action: () => onNavigate("community-circles") },
    { label: "Messages", helper: "Chat & connect", icon: MessageCircle, action: () => onNavigate("community-chats") },
    { label: "Notifications", helper: "Stay updated", icon: Bell, action: onNotifications },
    { label: "My Space", helper: "Profile & settings", icon: UserRound, action: onProfile },
  ];

  const quickLinks = [
    { label: "Saved posts", icon: Heart, action: () => onNavigate("community-feed") },
    { label: "Your groups", icon: Users, action: () => onNavigate("community-circles") },
    { label: "Marketplace listings", icon: ShoppingBag, action: () => onNavigate("community-marketplace") },
    { label: "Settings", icon: Settings, action: () => onNavigate("community-contact-settings") },
  ];

  return (
    <div data-demo="community-overview" className="min-h-screen w-full bg-[#f1f3ff] text-[#111c3b]">
      <div className="min-h-screen lg:grid lg:grid-cols-[208px_minmax(0,1fr)]">
        {/* Desktop navigation rail */}
        <aside className="relative z-20 hidden min-h-screen overflow-hidden bg-gradient-to-b from-[#071a3d] via-[#08265b] to-[#061b40] text-white lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -bottom-20 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute right-[-90px] top-[55%] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative flex min-h-screen flex-col px-4 pb-5 pt-5">
            <button type="button" onClick={onBackToApp} className="mb-7 flex items-center gap-2.5 px-1 text-left">
              <img src="/Logo.png" alt="RevelaCode" className="h-10 w-10 rounded-xl object-contain" />
              <span>
                <span className="block text-[15px] font-black tracking-tight">RevelaCode</span>
                <span className="block text-[9px] font-medium tracking-wide text-blue-100/70">Learn · Connect · Grow</span>
              </span>
            </button>

            <nav aria-label="Community navigation" className="space-y-1">
              {navItems.map(({ label, helper, icon: Icon, action, active }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  aria-current={active ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-950/25" : "text-blue-50/90 hover:bg-white/10"}`}
                >
                  <Icon size={19} className={active ? "text-white" : "text-blue-100"} />
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold">{label}</span>
                    <span className={`mt-0.5 block text-[10px] ${active ? "text-blue-100" : "text-blue-100/60"}`}>{helper}</span>
                  </span>
                  {label === "Notifications" && promotionPosts.length > 0 ? (
                    <span className="ml-auto h-2 w-2 rounded-full bg-rose-400" />
                  ) : null}
                </button>
              ))}
            </nav>

            <div className="my-5 h-px bg-white/15" />
            <div className="flex items-center justify-between px-2">
              <p className="text-[11px] font-extrabold text-blue-50">Our Pillars</p>
              <ChevronDown size={13} className="text-blue-200/60" />
            </div>
            <div className="mt-3 space-y-1">
              {[
                { label: "Biashara", emoji: "🛍️", key: "biashara" },
                { label: "Shamba", emoji: "🌱", key: "shamba" },
                { label: "Elimu", emoji: "🎓", key: "elimu" },
                { label: "Faith", emoji: "✝️", key: "faith" },
                { label: "Health", emoji: "❤️", key: "health" },
              ].map((pillar) => (
                <button key={pillar.key} type="button" onClick={() => onOpenPillar(pillar.key)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold text-blue-50/90 transition hover:bg-white/10">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-[13px]">{pillar.emoji}</span>
                  {pillar.label}
                </button>
              ))}
              <button type="button" onClick={onBackToApp} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold text-blue-100/70 transition hover:bg-white/10">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10"><MoreHorizontal size={15} /></span>
                More
              </button>
            </div>

            <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-300" />
                <span className="text-[10px] font-extrabold text-blue-50">A trusted community</span>
              </div>
              <p className="mt-1.5 text-[10px] leading-4 text-blue-100/65">Connect with people, knowledge and opportunities across Jumuiya.</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Top navigation */}
          <header className="sticky top-0 z-30 border-b border-[#e6e9f6] bg-white/90 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-7">
            <div className="mx-auto flex max-w-[1500px] items-center gap-3">
              <button type="button" onClick={onBackToApp} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff3ff] text-[#0c2c62] lg:hidden" aria-label="Open workspace menu">
                <Menu size={18} />
              </button>
              <form onSubmit={onSearchSubmit} className="flex h-10 min-w-0 max-w-[700px] flex-1 items-center gap-2.5 rounded-full border border-[#edf0fa] bg-[#f8f9fe] px-3.5 sm:px-4">
                <Search size={17} className="shrink-0 text-[#17376f]" />
                <input
                  ref={searchRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  maxLength={100}
                  placeholder="Search people, opportunities, communities..."
                  aria-label="Search people, opportunities and communities"
                  className="h-full min-w-0 flex-1 bg-transparent text-xs font-medium text-[#172344] outline-none placeholder:text-slate-400 sm:text-[13px]"
                />
                {searchQuery ? (
                  <button type="button" onClick={() => onSearchChange("")} aria-label="Clear search" className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/70">
                    <X size={13} />
                  </button>
                ) : null}
              </form>
              <div className="ml-auto flex shrink-0 items-center gap-2.5">
                <button type="button" onClick={onNotifications} aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#17376f] transition hover:bg-[#f0f3fc]">
                  <Bell size={19} />
                  <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </button>
                <button type="button" onClick={onProfile} className="flex min-w-0 items-center gap-2 rounded-full p-0.5 pr-1.5 transition hover:bg-slate-50">
                  {avatar ? (
                    <img src={avatar} alt="" className="h-8 w-8 rounded-full border border-slate-200 object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-700 text-[10px] font-black text-white">{initials(displayName)}</span>
                  )}
                  <span className="hidden max-w-[110px] truncate text-[11px] font-extrabold text-[#152344] sm:block">{displayName}</span>
                  <ChevronDown size={13} className="hidden text-slate-500 sm:block" />
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-4 px-3 pb-28 pt-4 sm:px-5 lg:px-7 xl:grid-cols-[minmax(0,1fr)_245px]">
            <main className="min-w-0 space-y-4">
              {/* Community hero */}
              <section
                className="relative isolate flex min-h-[208px] overflow-hidden rounded-[23px] bg-[#082758] shadow-[0_12px_28px_rgba(16,44,105,0.12)] sm:min-h-[226px] lg:min-h-[225px]"
                style={{
                  backgroundImage: `linear-gradient(90deg,rgba(5,25,62,.96) 0%,rgba(5,32,75,.82) 42%,rgba(5,34,73,.04) 100%),url("${HERO_IMAGE}")`,
                  backgroundPosition: "center, 64% 43%",
                  backgroundSize: "cover, cover",
                }}
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#05245a]/50 via-transparent to-[#06265a]/10" />
                <div className="relative flex w-full flex-col items-start justify-center px-5 py-6 sm:px-8 sm:py-7">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.15)]" />
                    Community Pulse
                  </span>
                  <h1 className="mt-3 text-[34px] font-black leading-none tracking-tight text-white sm:text-[42px]">Jumuiya</h1>
                  <p className="mt-2 max-w-[470px] text-[13px] font-semibold leading-5 text-white/95 sm:text-[15px]">Your community. Your opportunities. Your world.</p>
                  <button
                    type="button"
                    onClick={() => searchRef.current?.focus()}
                    className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-[#102f68] shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    <Search size={15} /> Explore what's happening...
                  </button>
                </div>
                <div className="pointer-events-none absolute bottom-5 right-5 hidden max-w-[165px] text-right text-white drop-shadow-lg sm:block">
                  <p className="font-serif text-[20px] italic leading-[1.05]">Together</p>
                  <p className="font-serif text-[20px] italic leading-[1.05]">We Thrive</p>
                  <span className="ml-auto mt-2 block h-1 w-20 rotate-[-7deg] rounded-full bg-amber-300" />
                </div>
              </section>

              {/* Main destinations */}
              <section aria-label="Community destinations" className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-2.5">
                <HubButton icon={UsersRound} title="People" subtitle="Connect" color="blue" onClick={() => onNavigate("community-people")} />
                <HubButton icon={BriefcaseBusiness} title="Opportunities" subtitle="Find work" color="teal" onClick={() => onSelectIntent("work")} />
                <HubButton icon={CalendarDays} title="Events" subtitle="Join events" color="coral" onClick={onCreateEvent} />
                <HubButton icon={Users} title="Groups" subtitle="Belong" color="blue" onClick={() => onNavigate("community-circles")} />
                <HubButton icon={ShoppingBag} title="Marketplace" subtitle="Trade" color="amber" onClick={() => onNavigate("community-marketplace")} />
                <HubButton icon={GraduationCap} title="Learn" subtitle="Grow" color="violet" onClick={() => onSelectIntent("learn")} />
              </section>

              {/* Featured story and live community activity */}
              <section className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(250px,.88fr)]">
                <article className="min-w-0 overflow-hidden rounded-[20px] border border-[#e4e8f6] bg-white p-3.5 shadow-[0_4px_18px_rgba(25,48,104,.045)] sm:p-4">
                  <SectionHeading title="🌍 World & Community Matters" action="Featured" onAction={() => onNavigate("community-feed")} />
                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                    <img src={CITY_IMAGE} alt="Nairobi skyline, Kenya" loading="lazy" className="h-[150px] w-full rounded-xl object-cover sm:h-[150px]" />
                    <div className="flex min-w-0 flex-col justify-center">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">Featured insight</p>
                      <h2 className="mt-1.5 text-[16px] font-black leading-[1.18] tracking-tight text-[#142348] sm:text-[17px]">Africa's Digital Future: Opportunities for Our Youth</h2>
                      <p className="mt-2 text-[11px] leading-[1.55] text-slate-600">Innovation, practical skills and inclusion can transform our continent.</p>
                      <button type="button" onClick={() => onNavigate("community-feed")} className="mt-3 inline-flex w-fit items-center gap-1 text-[11px] font-extrabold text-blue-600 hover:text-blue-800">Read the full story <ArrowRight size={13} /></button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-1.5" aria-label="Featured story 1 of 5">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                  </div>
                </article>

                <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#e4e8f6] bg-white p-3.5 shadow-[0_4px_18px_rgba(25,48,104,.045)] sm:p-4">
                  <SectionHeading title="Around Your Community" action="See all" onAction={onOpenFeed} />
                  {loading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-10 w-32 rounded-full bg-slate-100" />
                      <div className="h-16 rounded-xl bg-slate-100" />
                      <div className="h-20 rounded-xl bg-slate-100" />
                    </div>
                  ) : posts.length ? (
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        {posts[0]?.author?.avatar_url ? (
                          <img src={posts[0].author.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-[10px] font-black text-white">{initials(author)}</span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-[11px] font-black text-[#172344]">{author}</span>
                          <span className="block text-[9px] text-slate-500">{posts[0]?.created_at ? new Date(posts[0].created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : "Recently shared"}</span>
                        </span>
                      </div>
                      <button type="button" onClick={() => onOpenPost(posts[0])} className="mt-3 block w-full text-left">
                        <p className="line-clamp-3 text-[12px] font-semibold leading-[1.5] text-[#192747]">{firstPostText || "A new update has been shared with the community."}</p>
                      </button>
                      {posts[0]?.media?.[0]?.url || posts[0]?.image_url ? (
                        <img src={posts[0]?.media?.[0]?.url || posts[0]?.image_url} alt="" loading="lazy" className="mt-3 h-[88px] w-full rounded-xl object-cover" />
                      ) : null}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] text-slate-500">
                        <button type="button" onClick={() => onLike?.(posts[0])} className="inline-flex items-center gap-1.5 font-bold hover:text-rose-600"><Heart size={13} /> Appreciate</button>
                        <button type="button" onClick={() => onOpenPost(posts[0])} className="inline-flex items-center gap-1.5 font-bold hover:text-blue-600"><MessageCircle size={13} /> Join conversation</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[156px] flex-col items-center justify-center rounded-xl bg-[#f7f9ff] px-4 text-center">
                      <UsersRound size={22} className="text-blue-500" />
                      <p className="mt-2 text-xs font-extrabold text-[#172344]">Your community is waiting</p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">Be the first to share an update or invite someone in.</p>
                      <button type="button" onClick={onCreatePost} className="mt-3 text-[10px] font-extrabold text-blue-600">Create an update <ArrowRight size={11} className="inline" /></button>
                    </div>
                  )}
                </section>
              </section>

              {/* Quick access and shortcuts */}
              <section className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(220px,1fr)]">
                <div className="rounded-[20px] border border-[#e4e8f6] bg-white p-3.5 shadow-[0_4px_18px_rgba(25,48,104,.045)] sm:p-4">
                  <SectionHeading title="Quick Access" />
                  <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
                    <QuickAction icon={UsersRound} title="Join a Group" color="blue" onClick={() => onNavigate("community-circles")} />
                    <QuickAction icon={Plus} title="Post an Update" color="amber" onClick={onCreatePost} />
                    <QuickAction icon={Store} title="Find Services" color="teal" onClick={() => onSelectIntent("help")} />
                    <QuickAction icon={BookOpen} title="Explore Courses" color="sky" onClick={() => onSelectIntent("learn")} />
                    <QuickAction icon={BriefcaseBusiness} title="Check Jobs" color="violet" onClick={() => onSelectIntent("work")} />
                    <QuickAction icon={CalendarDays} title="Plan an Event" color="pink" onClick={onCreateEvent} />
                  </div>
                </div>
                <div className="rounded-[20px] border border-[#e4e8f6] bg-white p-3.5 shadow-[0_4px_18px_rgba(25,48,104,.045)] sm:p-4">
                  <SectionHeading title="Your Quick Links" action="View all" onAction={onProfile} />
                  <div className="space-y-1">
                    {quickLinks.map(({ label, icon: Icon, action }) => (
                      <button key={label} type="button" onClick={action} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold text-[#243253] transition hover:bg-[#f4f7ff]">
                        <Icon size={14} className="text-[#1d3c79]" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {error ? (
                <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                  <span>{error}</span>
                  <button type="button" onClick={onRefresh} className="shrink-0 font-extrabold underline">Retry</button>
                </div>
              ) : null}

              {/* Events stay visible on smaller screens; desktop uses the insight rail. */}
              <div className="xl:hidden">
                <WorldEventsDesk user={user} compact initialLimit={3} />
              </div>

              {/* Existing, data-backed media and feed workspaces */}
              <CommunityMediaCards
                posts={posts}
                onOpenPost={onOpenPost}
                onCreatePost={onCreatePost}
              />

              <section className="rounded-[20px] border border-[#e4e8f6] bg-white p-3.5 shadow-[0_4px_18px_rgba(25,48,104,.045)] sm:p-4">
                <SectionHeading title="Community stream" action="View all" onAction={onOpenFeed} />
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-14 rounded-xl bg-slate-100" />
                    <div className="h-14 rounded-xl bg-slate-100" />
                  </div>
                ) : posts.length ? (
                  <div className="space-y-3">
                    {posts.slice(0, 2).map((post, index) => (
                      <CommunityPostCard
                        key={post?.id || post?._id || `community-post-${index}`}
                        post={post}
                        currentUser={{ ...(user || {}), community_profile: profile }}
                        onOpen={() => onOpenPost(post)}
                        onLike={onLike}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#f7f9ff] px-4 py-6 text-center">
                    <p className="text-xs font-extrabold text-[#172344]">No updates in this feed yet</p>
                    <p className="mt-1 text-[10px] text-slate-500">Start a conversation and help the community grow.</p>
                    <button type="button" onClick={onCreatePost} className="mt-3 text-[10px] font-extrabold text-blue-600">Create a post <ArrowRight size={11} className="inline" /></button>
                  </div>
                )}
              </section>
            </main>

            {/* Right-hand insight rail */}
            <aside className="hidden min-w-0 space-y-3 xl:block">
              <section className="rounded-[20px] border border-[#e4e8f6] bg-white p-4 shadow-[0_4px_18px_rgba(25,48,104,.045)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Trophy size={17} /></span>
                  <h2 className="text-[12px] font-black text-[#172344]">Your Community Impact</h2>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[22px] font-black leading-none tracking-tight text-[#13234a]">{shortNumber(contributionCount)}</p>
                    <p className="mt-1 text-[10px] text-slate-500">Contributions</p>
                  </div>
                  <div className="flex items-start justify-end text-teal-500"><TrendingUp size={26} /></div>
                  <div>
                    <p className="text-[22px] font-black leading-none tracking-tight text-[#13234a]">{reachCount == null ? shortNumber(activeOpportunities) : shortNumber(reachCount)}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{reachCount == null ? "Needs & opportunities" : "Community reach"}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold text-amber-700">{levelLabel}</span>
                  </div>
                </div>
                <button type="button" onClick={onProfile} className="mt-4 inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600">View your impact <ArrowRight size={11} /></button>
              </section>

              <section className="overflow-hidden rounded-[20px] border border-[#e4e8f6] bg-white p-3 shadow-[0_4px_18px_rgba(25,48,104,.045)]">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <h2 className="text-[12px] font-black text-[#172344]">What's happening</h2>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-extrabold text-blue-700">Live</span>
                </div>
                <WorldEventsDesk user={user} compact initialLimit={2} />
              </section>

              <section
                className="relative min-h-[170px] overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0e563f] via-[#087d66] to-[#c7a52d] p-4 text-white shadow-[0_8px_20px_rgba(13,82,65,.12)]"
                style={{
                  backgroundImage: `linear-gradient(90deg,rgba(5,55,48,.94),rgba(5,70,56,.45)),url("${HERO_IMAGE}")`,
                  backgroundPosition: "center, 75% 40%",
                  backgroundSize: "cover, cover",
                }}
              >
                <p className="relative text-[16px] font-black leading-5">Grow Your Business on RevelaCode</p>
                <p className="relative mt-2 max-w-[180px] text-[10px] leading-4 text-white/90">Reach more people and build trust in your community.</p>
                <button type="button" onClick={onCreateAd} className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-2 text-[10px] font-black text-[#30220a] shadow hover:bg-amber-200">List your business <ArrowRight size={12} /></button>
              </section>

              {promotionPosts.length ? (
                <section className="rounded-[18px] border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[10px] font-black text-amber-900">Community promotions</p>
                  <p className="mt-1 text-[10px] leading-4 text-amber-800/80">{promotionPosts.length} live promotion{promotionPosts.length === 1 ? "" : "s"} in your feed.</p>
                  <button type="button" onClick={() => onOpenPost(promotionPosts[0])} className="mt-2 text-[10px] font-extrabold text-amber-900 underline">View promotion</button>
                </section>
              ) : null}
            </aside>
          </div>
        </div>

        {/* Bottom dock on desktop, aligned to the content area beside the rail */}
        <nav aria-label="Jumuiya desktop navigation" className="fixed bottom-0 left-[208px] right-0 z-30 hidden border-t border-[#e4e8f6] bg-white/90 px-6 py-2 shadow-[0_-8px_28px_rgba(11,30,74,.07)] backdrop-blur-xl lg:flex">
          <div className="mx-auto grid w-full max-w-[760px] grid-cols-5 items-center gap-3">
            <button type="button" onClick={() => onNavigate("community-home")} className="flex flex-col items-center gap-1 py-1 text-[10px] font-extrabold text-blue-700"><Home size={18} />Home</button>
            <button type="button" onClick={() => onNavigate("community-discover")} className="flex flex-col items-center gap-1 py-1 text-[10px] font-extrabold text-slate-500"><Compass size={18} />Discover</button>
            <button type="button" onClick={onCreatePost} aria-label="Create post" className="flex flex-col items-center gap-1 py-1 text-[10px] font-extrabold text-blue-700"><span className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25"><Plus size={22} /></span>Create</button>
            <button type="button" onClick={() => onNavigate("community-circles")} className="flex flex-col items-center gap-1 py-1 text-[10px] font-extrabold text-slate-500"><UsersRound size={18} />Networks</button>
            <button type="button" onClick={onProfile} className="flex flex-col items-center gap-1 py-1 text-[10px] font-extrabold text-slate-500">{avatar ? <img src={avatar} alt="" className="h-[18px] w-[18px] rounded-full object-cover" /> : <UserRound size={18} />}Me</button>
          </div>
        </nav>

        {/* Bottom dock on mobile */}
        <nav aria-label="Jumuiya navigation" className="fixed inset-x-3 bottom-[max(9px,env(safe-area-inset-bottom))] z-40 mx-auto grid max-w-[460px] grid-cols-5 items-end gap-1 rounded-[23px] border border-[#e2e7f7] bg-white/95 p-2 shadow-[0_12px_35px_rgba(11,30,74,.18)] backdrop-blur-xl lg:hidden">
          <button type="button" onClick={() => onNavigate("community-home")} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-extrabold text-blue-700"><Home size={18} />Home</button>
          <button type="button" onClick={() => onNavigate("community-discover")} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-extrabold text-slate-500"><Compass size={18} />Discover</button>
          <button type="button" onClick={onCreatePost} aria-label="Create post" className="flex flex-col items-center gap-1 pb-0.5 text-[9px] font-extrabold text-blue-700">
            <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25"><Plus size={23} /></span>
            Create
          </button>
          <button type="button" onClick={() => onNavigate("community-circles")} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-extrabold text-slate-500"><UsersRound size={18} />Networks</button>
          <button type="button" onClick={onProfile} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-extrabold text-slate-500">
            {avatar ? <img src={avatar} alt="" className="h-[18px] w-[18px] rounded-full object-cover" /> : <UserRound size={18} />}
            Me
          </button>
        </nav>

        {selectedPost ? (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#07132d]/65 p-3 backdrop-blur-sm sm:items-center" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClosePost(); }}>
            <section role="dialog" aria-modal="true" aria-label="Community post details" className="w-full max-w-xl overflow-hidden rounded-[24px] border border-white/20 bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Community update</p>
                  <h2 className="mt-1 text-lg font-black text-[#172344]">{selectedPost?.title || "Community conversation"}</h2>
                </div>
                <button type="button" onClick={onClosePost} aria-label="Close post" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><X size={16} /></button>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{getPostText(selectedPost) || "No further details were shared."}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => { onClosePost(); onOpenFeed(); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white">Open community feed <ArrowRight size={13} /></button>
                <button type="button" onClick={() => onLike?.(selectedPost)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700"><Heart size={13} /> Appreciate</button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
