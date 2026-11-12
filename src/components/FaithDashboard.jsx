// src/components/FaithDashboard.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CalendarCheck,
  Home,
  Leaf,
  Menu,
  Moon,
  Settings,
  Users,
  UserCircle,
  ArrowRight,
  BadgeCheck,
  Compass,
  Flame,
  Map,
  Play,
  RefreshCw,
  ScrollText,
  Sun,
  X,
  Book,
  BookOpen,
  Bookmark,
  ChevronRight,
  ChevronDown,
  Clock3,
  Globe,
  GraduationCap,
  History,
  HeartHandshake,
  Layers,
  Library,
  Search,
  Sparkles,
  Star,
} from "lucide-react";

import "./faith/faith-dashboard.css";
import { useTheme } from "./hooks/useTheme.jsx";

import StudyLibrary from "./study/StudyLibrary.jsx";
import BookmarksPanel from "./study/BookmarksPanel.jsx";
import RecommendationsPanel from "./study/RecommendationsPanel.jsx";
import StudyReader from "./study/StudyReader.jsx";
import FaithAtlas from "./faith/FaithAtlas.jsx";
import FaithPremiumWorkspace from "./faith/FaithPremiumWorkspace.jsx";
import SDAQuarterlyWorkspace from "./faith/SDAQuarterlyWorkspace.jsx";
import AncientWordRootsWorkspace from "./faith/AncientWordRootsWorkspace.jsx";
import StudyResourceViewer from "./study/StudyResourceViewer.jsx";
import CommunityAdSenseUnit from "@/components/CommunityAdSenseUnit.jsx";
import { useHistory } from "@/context/HistoryContext.jsx";
import { useRevenueApi } from "@/services/revenueApi.jsx";
import FaithWorkspaceLayout, { FaithMobileBottomNav, FaithOfflineBanner, PullToRefreshSurface } from "./faith/workspace/FaithWorkspaceLayout.jsx";

function isNativeAndroid() {
  return (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") || import.meta.env.VITE_ANDROID_APP === "true";
}

function FaithAndroidHubHeader({ title = "Faith Hub", onOpenAI }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#041726]/95 px-4 py-3 text-white shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-[760px] items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300">
          <BookOpen size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold tracking-tight">RevelaCode</p>
          <p className={"truncate text-[11px] " + (resolvedTheme === "dark" ? "text-slate-400" : "text-slate-500")}>Faith Hub · {title}</p>
        </div>
        
        <button type="button" onClick={() => onOpenAI?.()} aria-label="Open RevelaAI" className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 active:scale-95">
          <Sparkles size={18} />
        </button>
      </div>
    </header>
  );
}

function FaithAndroidWorkspaceFrame({ title, children, onBack, onNavigate, onOpenAI, onHome, onStudy, active = "study" }) {
  const nativeAndroid = isNativeAndroid();
  const { resolvedTheme } = useTheme();
  if (!nativeAndroid) return children;
  return (
    <div className={"faith-android-shell min-h-[100svh] " + (resolvedTheme === "dark" ? "dark bg-[#031321] text-white" : "light bg-slate-50 text-slate-900")}>
      <header className={"sticky top-0 z-40 border-b px-3 py-3 backdrop-blur-xl " + (resolvedTheme === "dark" ? "border-white/10 bg-[#041726]/95 text-white" : "border-slate-200 bg-white/95 text-slate-900")}>
        <div className="mx-auto flex max-w-[760px] items-center gap-2.5">
          <button type="button" onClick={onBack} aria-label="Back to Faith" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1D4057] bg-[#0A2237] text-white active:scale-95">
            <ArrowLeft size={18} />
          </button>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><BookOpen size={18} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">RevelaCode</p>
            <p className="truncate text-[11px] text-slate-400">Faith Hub · {title}</p>
          </div>
          <button type="button" onClick={() => onOpenAI?.()} aria-label="Ask RevelaAI" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 active:scale-95"><Sparkles size={18} /></button>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-[760px] px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3">
        {children}
      </main>
      <FaithMobileBottomNav
        active={active}
        onHome={onHome}
        onStudy={onStudy}
        onAskAI={() => onOpenAI?.()}
        onMission={() => { window.location.assign("/faith/missionpulse"); }}
        onMe={() => onNavigate?.("profile")}
      />
    </div>
  );
}

const FAITH_VERSES = [
  { reference: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { reference: "John 17:17", text: "Sanctify them through thy truth: thy word is truth." },
  { reference: "Revelation 14:12", text: "Here are they that keep the commandments of God, and the faith of Jesus." },
  { reference: "Genesis 2:3", text: "And God blessed the seventh day, and sanctified it." },
  { reference: "Exodus 20:8", text: "Remember the sabbath day, to keep it holy." },
  { reference: "Mark 2:27", text: "The sabbath was made for man, and not man for the sabbath." },
  { reference: "Isaiah 58:13", text: "Call the sabbath a delight, the holy of the LORD, honourable." },
  { reference: "Luke 4:16", text: "As his custom was, he went into the synagogue on the sabbath day." },
  { reference: "Daniel 2:22", text: "He revealeth the deep and secret things." },
  { reference: "Daniel 7:27", text: "The kingdom and dominion, and the greatness of the kingdom under the whole heaven, shall be given to the people of the saints of the most High." },
  { reference: "Revelation 1:3", text: "Blessed is he that readeth, and they that hear the words of this prophecy." },
  { reference: "John 14:1", text: "Let not your heart be troubled: ye believe in God, believe also in me." },
  { reference: "John 14:3", text: "I will come again, and receive you unto myself." },
  { reference: "Matthew 24:14", text: "And this gospel of the kingdom shall be preached in all the world." },
  { reference: "Hebrews 4:9", text: "There remaineth therefore a rest to the people of God." },
  { reference: "Psalm 46:10", text: "Be still, and know that I am God." },
  { reference: "Micah 6:8", text: "What doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?" },
  { reference: "Matthew 5:16", text: "Let your light so shine before men, that they may see your good works." },
  { reference: "James 1:5", text: "If any of you lack wisdom, let him ask of God." },
  { reference: "1 Thessalonians 5:21", text: "Prove all things; hold fast that which is good." },
  { reference: "1 Corinthians 10:31", text: "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God." },
  { reference: "Acts 1:8", text: "Ye shall receive power, after that the Holy Ghost is come upon you." },
  { reference: "Revelation 21:4", text: "And God shall wipe away all tears from their eyes." },
  { reference: "Isaiah 40:31", text: "They that wait upon the LORD shall renew their strength." },
  { reference: "Romans 8:28", text: "All things work together for good to them that love God." },
  { reference: "Ephesians 2:8", text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God." },
  { reference: "2 Timothy 3:16", text: "All scripture is given by inspiration of God." },
  { reference: "Psalm 34:8", text: "O taste and see that the LORD is good." },
  { reference: "1 Peter 3:15", text: "Be ready always to give an answer to every man that asketh you a reason of the hope that is in you." },
  { reference: "Hebrews 11:1", text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
  { reference: "Revelation 22:20", text: "Surely I come quickly. Amen. Even so, come, Lord Jesus." },
];

function faithLocalDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function faithKenyaQuarter(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, quarter: Math.ceil(month / 3) };
}

function faithLessonMeta(material) {
  return material?.metadata && typeof material.metadata === "object"
    ? material.metadata
    : {};
}

function faithRelativeTime(value) {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 7) return days + "d ago";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function faithSabbathStatus(now, sunsetHour = 18) {
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const active = (day === 5 && hour >= sunsetHour) || (day === 6 && hour < sunsetHour);
  if (active) {
    return { active: true, label: "Sabbath today", countdown: "" };
  }

  let daysUntilFriday = (5 - day + 7) % 7;
  if (daysUntilFriday === 0 && hour >= sunsetHour) daysUntilFriday = 7;
  const target = new Date(now);
  target.setDate(target.getDate() + daysUntilFriday);
  target.setHours(sunsetHour, 0, 0, 0);
  const totalMinutes = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(days + "d");
  parts.push(hours + "h");
  parts.push(minutes + "m");
  return { active: false, label: "Sabbath in " + parts.join(" "), countdown: parts.join(" ") };
}

function FaithSponsoredBanner({ enabled }) {
  const hostRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoaded(false);
      return undefined;
    }
    const host = hostRef.current;
    if (!host) return undefined;

    let settled = false;
    const inspect = () => {
      const slot = host.querySelector("ins.adsbygoogle");
      const status = slot?.getAttribute("data-ad-status");
      const frame = slot?.querySelector("iframe") || host.querySelector("iframe");
      const nativeAd = host.querySelector("capacitor-admob-native");
      const nativeLoaded = Boolean(
        nativeAd && ((nativeAd.shadowRoot && nativeAd.shadowRoot.childElementCount > 0) || nativeAd.childElementCount > 0)
      );

      if (status === "filled" || frame || nativeLoaded) {
        settled = true;
        setLoaded(true);
      } else if (status === "unfilled") {
        settled = true;
        setLoaded(false);
      }
    };

    let observer;
    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(inspect);
      observer.observe(host, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-ad-status"],
      });
    }
    const timeoutId = window.setTimeout(() => {
      if (!settled) setLoaded(false);
    }, 16000);
    inspect();

    return () => {
      if (observer) observer.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={hostRef}
      aria-label="Sponsored placement"
      className={loaded ? "max-h-[90px] overflow-hidden transition-all duration-200" : "pointer-events-none max-h-0 overflow-hidden opacity-0"}
    >
      <div className="[&>aside]:!my-0 [&>aside]:!max-h-[90px] [&>aside]:!overflow-hidden [&>aside]:!border-0 [&>aside]:!bg-transparent [&>aside]:!p-0 [&>aside]:!shadow-none [&_ins]:!max-h-[90px] [&_ins]:!min-h-0">
        <CommunityAdSenseUnit placement="faith-overview" />
      </div>
    </div>
  );
}


/* =========================================================
   FAITH DASHBOARD
   ---------------------------------------------------------
   Main Faith hub for:
   - Bible
   - Prophecy
   - Events
   - Referential
   - Study Library
   - Saved Bookmarks
   - Recommendations
   - Study Reader
   - Continue where you left off
   - Recent activity

   Study-related views remain INTERNAL to Faith and are not
   added to the global dashboard registry.
========================================================= */


function FaithHomeDashboard({
  user,
  isGuest,
  displayName,
  globalSearch,
  setGlobalSearch,
  submitGlobalSearch,
  askAIAboutSearch,
  navigateTo,
  openStudy,
  openSDAQuarterly,
  openFaithAcademy,
  openMaterial,
  featuredLesson,
  featuredLessonTitle,
  continueDescription,
  hasContinueActivity,
  continueTab,
  setContinueTab,
  setFaithSection,
  verseOfDay,
  studyStreak,
  studyDaysKey,
  onNavigate,
  onOpenAI,
  setComingSoonFeature,
  comingSoonFeature,
  homeKeyboardOpen,
  setHomeKeyboardOpen,
  loadHomeSnapshot,
  adSubscriptionStatus,
}) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const initials = String(displayName || "Guest")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "G";

  const prayerAction = () => {
    const question = "Help me prepare a personal prayer from Scripture. Include gratitude, confession, guidance, intercession for others, and a closing prayer.";
    try {
      window.localStorage.setItem("revelacode_pending_ai_prompt", question);
    } catch {
      // RevelaAI still receives the prayer request through the handoff.
    }
    onOpenAI?.({
      question,
      contextType: "prayer",
      contextData: { workspace: "Prayer", source: "Faith dashboard" },
    });
  };

  const continueAction = () => {
    if (featuredLesson) {
      openMaterial(featuredLesson);
      return;
    }
    if (hasContinueActivity) {
      navigateTo(continueTab);
      return;
    }
    navigateTo("bible");
  };

  const navigationItems = [
    { label: "Home", icon: Home, action: () => onNavigateHome(), active: true },
    { label: "Study Library", icon: Library, action: () => openStudy("all") },
    { label: "Sabbath School", icon: CalendarCheck, action: openSDAQuarterly },
    { label: "Faith Academy", icon: GraduationCap, action: openFaithAcademy },
    { label: "Prayer", icon: HeartHandshake, action: prayerAction },
    { label: "Community", icon: Users, action: () => onNavigate?.("community") },
    { label: "Settings", icon: Settings, action: () => onNavigate?.("settings") },
  ];

  function onNavigateHome() {
    setFaithSection("home");
  }

  const runNavigation = (item) => {
    setMobileMenuOpen(false);
    item.action?.();
  };

  const renderSidebarItems = () => (
    <nav className="faith-home-sidebar-nav" aria-label="Faith workspace navigation">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => runNavigation(item)}
            aria-current={item.active ? "page" : undefined}
            className={"faith-home-nav-item" + (item.active ? " is-active" : "")}
          >
            <Icon size={19} strokeWidth={2.25} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const submitPrayerSearch = (event) => {
    event.preventDefault();
    askAIAboutSearch();
  };

  const toggleTheme = () => {
    setTheme(theme === "system" ? "light" : theme === "light" ? "dark" : "system");
  };

  return (
    <div className="faith-home-shell">
      <aside className="faith-home-sidebar" aria-label="Faith dashboard sidebar">
        <button type="button" className="faith-home-brand" onClick={onNavigateHome}>
          <img src="/Logo.png" alt="RevelaCode" />
          <strong>RevelaCode</strong>
          <small>Code. Innovate. Transform.</small>
        </button>
        {renderSidebarItems()}        <button type="button" className="faith-home-user" onClick={() => onNavigate?.("profile")}>
          <span className="faith-home-avatar">{initials}</span>
          <span className="faith-home-user-copy">
            <strong>{displayName}</strong>
            <small>{user?.email || (isGuest ? "Guest session" : "Faith account")}</small>
          </span>
          <ChevronDown size={15} />
        </button>
      </aside>

      <main className="faith-home-main">
        <div className="faith-home-main-inner">
          <header className="faith-home-mobile-header">
            <button
              type="button"
              className="faith-home-mobile-menu"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Faith navigation"
            >
              <Menu size={24} />
            </button>
            <div className="faith-home-mobile-brand">
              <img src="/Logo.png" alt="" />
              <span>
                <strong>Revela<span>Code</span></strong>
                <small>Code. Innovate. Transform.</small>
              </span>
            </div>
            <button
              type="button"
              className="faith-home-icon-button"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label="Open notification information"
              aria-expanded={notificationsOpen}
            >
              <Bell size={22} />
            </button>
          </header>

          <div className="faith-home-topbar">
            <form className="faith-home-search" role="search" onSubmit={submitGlobalSearch}>
              <Search size={21} />
              <input
                type="search"
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                onFocus={() => setHomeKeyboardOpen(true)}
                onBlur={() => setHomeKeyboardOpen(false)}
                placeholder="Search Bible, topics or ask RevelaAI..."
                aria-label="Search Bible, topics or ask RevelaAI"
              />
            </form>
            <div className="faith-home-top-actions">
              <button
                type="button"
                className="faith-home-icon-button"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={21} />
              </button>
              <button
                type="button"
                className="faith-home-theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === "system" ? "Switch to light theme" : theme === "dark" ? "Switch to system theme" : "Switch to dark theme"}
                title={theme === "system" ? "System theme" : theme === "dark" ? "Dark theme" : "Light theme"}
              >
                {theme === "system" ? (resolvedTheme === "dark" ? <Moon size={16} /> : <Sun size={16} />) : theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                <span className="sr-only">{theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>

          <section className="faith-home-hero" aria-labelledby="faith-home-title">
            <span className="faith-home-cross" aria-hidden="true"><i /><b /></span>
            <h1 id="faith-home-title">
              Grow in Faith<br />
              with <span>RevelaCode</span>
            </h1>
            <p>Study. Reflect. Apply. Transform.</p>
            <form className="faith-home-hero-ask" onSubmit={submitPrayerSearch}>
              <Sparkles size={22} />
              <input
                type="text"
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                onFocus={() => setHomeKeyboardOpen(true)}
                onBlur={() => setHomeKeyboardOpen(false)}
                placeholder="Ask RevelaAI anything about the Bible..."
                aria-label="Ask RevelaAI anything about the Bible"
              />
              <button type="submit" className="faith-home-ask-submit" aria-label="Ask RevelaAI">
                <ArrowRight size={23} />
              </button>
            </form>
          </section>

          <form className="faith-home-mobile-search" role="search" onSubmit={submitGlobalSearch}>
            <Search size={19} />
            <input
              type="search"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              onFocus={() => setHomeKeyboardOpen(true)}
              onBlur={() => setHomeKeyboardOpen(false)}
              placeholder="Search or ask RevelaAI..."
              aria-label="Search or ask RevelaAI"
            />
            <button type="submit" aria-label="Search"><ArrowRight size={21} /></button>
          </form>

          <section className="faith-home-feature-grid" aria-label="Featured Faith workspaces">
            <button type="button" className="faith-home-feature-card faith-home-feature-blue" onClick={() => openStudy("all")}>
              <BookOpen size={34} fill="currentColor" />
              <strong>Study Library</strong>
              <small>Explore Scripture</small>
              <span className="faith-home-feature-arrow"><ArrowRight size={20} /></span>
            </button>
            <button type="button" className="faith-home-feature-card faith-home-feature-green" onClick={openSDAQuarterly}>
              <GraduationCap size={37} fill="currentColor" />
              <strong>Sabbath School</strong>
              <small>Learn &amp; Grow</small>
              <span className="faith-home-feature-arrow"><ArrowRight size={20} /></span>
            </button>
            <button type="button" className="faith-home-feature-card faith-home-feature-purple" onClick={prayerAction}>
              <HeartHandshake size={35} fill="currentColor" />
              <strong>Prayer</strong>
              <small>Connect with God</small>
              <span className="faith-home-feature-arrow"><ArrowRight size={20} /></span>
            </button>
            <button type="button" className="faith-home-feature-card faith-home-feature-gold" onClick={() => onNavigate?.("community")}>
              <Users size={36} fill="currentColor" />
              <strong>Community</strong>
              <small>Be Part of the Family</small>
              <span className="faith-home-feature-arrow"><ArrowRight size={20} /></span>
            </button>
          </section>

          <section className="faith-home-content-grid">
            <div className="faith-home-continue-wrap">
              <div className="faith-home-section-heading">
                <h2><Clock3 size={22} /> Continue Where You Left Off</h2>
                <button type="button" onClick={() => setContinueTab("bible")}>View All <ArrowRight size={15} /></button>
              </div>
              <article className="faith-home-continue-card">
                <img
                  src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=85"
                  alt="A book open for study"
                  loading="lazy"
                />
                <div className="faith-home-continue-copy">
                  <h3>Your next study session</h3>
                  <p>{featuredLessonTitle || (hasContinueActivity ? continueDescription : "Bible · The Four Gospels")}</p>
                  <button type="button" onClick={continueAction}>
                    <Play size={14} fill="currentColor" /> Continue Study
                  </button>
                </div>
              </article>
            </div>

            <aside className="faith-home-verse-card" aria-label="Verse of the day">
              <span className="faith-home-quote-mark">“</span>
              <blockquote>“{verseOfDay.text}”</blockquote>
              <cite>{verseOfDay.reference}</cite>
              <BookOpen size={27} />
            </aside>
          </section>

          <section className="faith-home-quick-access" aria-labelledby="faith-home-quick-title">
            <h2 id="faith-home-quick-title" className="faith-home-quick-heading">
              <Star size={22} /> Quick Access
            </h2>
            <div className="faith-home-quick-grid">
              <button type="button" className="faith-home-quick-card" onClick={() => navigateTo("bible")}>
                <BookOpen size={25} fill="currentColor" /><strong>Bible</strong>
              </button>
              <button type="button" className="faith-home-quick-card" onClick={() => navigateTo("prophecy")}>
                <Leaf size={25} /><strong>Prophecy</strong>
              </button>
              <button type="button" className="faith-home-quick-card" onClick={() => navigateTo("events")}>
                <CalendarDays size={25} /><strong>Events</strong>
              </button>
              <button type="button" className="faith-home-quick-card" onClick={() => navigateTo("referential")}>
                <Users size={25} /><strong>Referrals</strong>
              </button>
              <button type="button" className="faith-home-quick-card" onClick={() => window.location.assign("/faith/missionpulse")}>
                <Globe size={25} /><strong>MissionPulse</strong>
              </button>
            </div>
          </section>

          <div className="faith-home-bottom-space" />
          <FaithOfflineBanner />
          <div className="faith-home-ad-slot"><FaithSponsoredBanner enabled={adSubscriptionStatus === "free"} /></div>
        </div>
      </main>

      {mobileMenuOpen && (
        <div className="faith-home-mobile-drawer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileMenuOpen(false); }}>
          <section className="faith-home-mobile-drawer-panel" role="dialog" aria-modal="true" aria-label="Faith navigation">
            <div className="faith-home-mobile-drawer-head">
              <img src="/Logo.png" alt="RevelaCode" />
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button>
            </div>
            {renderSidebarItems()}          </section>
        </div>
      )}

      {notificationsOpen && (
        <section className="faith-home-notification-popover" role="dialog" aria-label="Notifications">
          <div className="flex items-center justify-between gap-3">
            <h3>RevelaCode updates</h3>
            <button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications" className="!min-h-8 !rounded-lg !bg-slate-100 !px-2 !text-slate-700"><X size={15} /></button>
          </div>
          <p>Review account alerts, activity updates and notification preferences in your workspace settings.</p>
          <button type="button" onClick={() => { setNotificationsOpen(false); onNavigate?.("settings"); }}>Open Settings</button>
        </section>
      )}

      <nav className="faith-home-bottom-nav" aria-label="Mobile navigation">
        <button type="button" className="is-active" onClick={() => onNavigateHome()}>
          <Home size={21} /><span>Home</span>
        </button>
        <button type="button" onClick={() => openStudy("all")}>
          <BookOpen size={21} /><span>Study</span>
        </button>
        <button type="button" onClick={openFaithAcademy}>
          <HeartHandshake size={21} /><span>Faith</span>
        </button>
        <button type="button" onClick={() => onNavigate?.("community")}>
          <Users size={21} /><span>Community</span>
        </button>
        <button type="button" onClick={() => onNavigate?.("profile")}>
          <UserCircle size={21} /><span>Me</span>
        </button>
      </nav>


      {comingSoonFeature && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setComingSoonFeature(""); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="faith-coming-soon-title" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><BookOpen size={20} /></div>
              <button type="button" onClick={() => setComingSoonFeature("")} aria-label="Close coming soon message" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <h2 id="faith-coming-soon-title" className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{comingSoonFeature} is coming to Faith</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">This study collection is being prepared. Its reviewed materials and study tools will appear here when they are ready.</p>
            <button type="button" onClick={() => setComingSoonFeature("")} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Got it</button>
          </section>
        </div>
      )}
    </div>
  );
}


export default function FaithDashboard({
  user,
  isGuest,
  onNavigate,
  onOpenAI,
  onLogin,
}) {
  /* =======================================================
     USER
  ======================================================= */

  const androidNative = isNativeAndroid();

  const displayName =
    user?.fullName?.trim() ||
    user?.name?.trim() ||
    user?.username?.trim() ||
    "Guest";

  const userId =
    user?.id ||
    user?._id ||
    user?.user_id ||
    user?.userId ||
    "guest";

  /* =======================================================
     INTERNAL FAITH / STUDY NAVIGATION
  ======================================================= */

  const [faithSection, setFaithSection] = useState("home");
  const [homeKeyboardOpen, setHomeKeyboardOpen] = useState(false);
  const homeSearchRef = useRef(null);
  const [studyTopic, setStudyTopic] = useState("all");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [studyReturnSection, setStudyReturnSection] = useState("study");
  const [selectedSource, setSelectedSource] = useState(null);
  const [sourceReturnSection, setSourceReturnSection] = useState("study");

  /* =======================================================
     LOCAL ACTIVITY
  ======================================================= */

  const activity = useMemo(() => {
    if (typeof window === "undefined") {
      return { lastDashboard: "", lastActivity: "", lastActivityTime: "", historyCount: 0 };
    }
    try {
      const lastDashboard = localStorage.getItem("revelacode_last_dashboard") || "";
      const lastActivity = localStorage.getItem("revelacode_last_activity") || "";
      const lastActivityTime = localStorage.getItem("revelacode_last_activity_time") || "";
      const rawHistoryCount = Number(localStorage.getItem("revelacode_history_count") || 0);
      return {
        lastDashboard,
        lastActivity,
        lastActivityTime,
        historyCount: Number.isFinite(rawHistoryCount) ? rawHistoryCount : 0,
      };
    } catch {
      return { lastDashboard: "", lastActivity: "", lastActivityTime: "", historyCount: 0 };
    }
  }, []);

  const { history: userHistory = [], loadingHistory, historyError, refetchHistory } = useHistory();
  const revenueApi = useRevenueApi();
  const studyDaysKey = "revelacode_faith_study_days_v1_" + String(userId || "guest");

  const [globalSearch, setGlobalSearch] = useState("");
  const [continueTab, setContinueTab] = useState(
    ["bible", "prophecy", "referential"].includes(activity.lastDashboard) ? activity.lastDashboard : "bible"
  );
  const [comingSoonFeature, setComingSoonFeature] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [sabbathSettings] = useState(() => ({
    sunsetHour: 18,
    location: null,
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "device",
  }));
  const [homeSnapshot, setHomeSnapshot] = useState({
    status: "loading",
    error: false,
    lesson: null,
    studyDays: [],
    savedCount: null,
  });
  const [adSubscriptionStatus, setAdSubscriptionStatus] = useState("checking");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isGuest || userId === "guest") {
      setAdSubscriptionStatus("free");
      return undefined;
    }
    let active = true;
    setAdSubscriptionStatus("checking");
    revenueApi.getMySubscription({ requestScope: "" })
      .then((response) => {
        if (active) setAdSubscriptionStatus(response?.isPremium === true ? "premium" : "free");
      })
      .catch(() => {
        if (active) setAdSubscriptionStatus("unknown");
      });
    return () => { active = false; };
  }, [isGuest, userId, revenueApi]);

  const loadHomeSnapshot = useCallback(() => {
    setHomeSnapshot((current) => ({ ...current, status: "loading", error: false }));
    try {
      if (typeof window === "undefined") {
        setHomeSnapshot({ status: "ready", error: false, lesson: null, studyDays: [], savedCount: null });
        return;
      }

      const storedDays = JSON.parse(localStorage.getItem(studyDaysKey) || "[]");
      const daySet = new Set(Array.isArray(storedDays) ? storedDays.filter((day) => typeof day === "string") : []);
      if (activity.lastActivityTime && /(faith|bible|scripture|prophecy|referential|quarter|missionpulse)/i.test(activity.lastDashboard || "")) {
        const lastActivityDate = new Date(activity.lastActivityTime);
        const lastActivityKey = faithLocalDateKey(lastActivityDate);
        if (lastActivityKey) daySet.add(lastActivityKey);
      }

      const quarter = faithKenyaQuarter(new Date());
      const cacheKey = "revelacode_sda_quarter:" + quarter.year + ":" + quarter.quarter;
      const cachedRaw = localStorage.getItem(cacheKey);
      const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
      const backgroundCacheRaw = localStorage.getItem("sda-quarterly:" + quarter.year + ":" + quarter.quarter);
      const backgroundCache = backgroundCacheRaw ? JSON.parse(backgroundCacheRaw) : null;
      const cachedMaterials = Array.isArray(cached?.materials)
        ? cached.materials
        : Array.isArray(backgroundCache?.payload?.materials)
          ? backgroundCache.payload.materials
          : Array.isArray(backgroundCache?.materials)
            ? backgroundCache.materials
            : [];
      const lessons = [...cachedMaterials];
      lessons.sort((left, right) => {
        const leftDate = String(faithLessonMeta(left).lesson_date || "");
        const rightDate = String(faithLessonMeta(right).lesson_date || "");
        return leftDate.localeCompare(rightDate);
      });

      const todayKey = faithLocalDateKey(new Date());
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekStartKey = faithLocalDateKey(weekStart);
      const weekEndKey = faithLocalDateKey(weekEnd);
      const thisWeek = lessons.filter((lesson) => {
        const date = String(faithLessonMeta(lesson).lesson_date || "");
        return date >= weekStartKey && date <= weekEndKey;
      });
      const completedThisWeek = thisWeek.filter((lesson) => String(faithLessonMeta(lesson).lesson_date || "") <= todayKey);
      const upcomingThisWeek = thisWeek.filter((lesson) => String(faithLessonMeta(lesson).lesson_date || "") >= todayKey);
      const lesson = lessons.find((item) => String(faithLessonMeta(item).lesson_date || "") === todayKey) || upcomingThisWeek[0] || completedThisWeek[completedThisWeek.length - 1] || lessons[0] || null;

      const countCandidates = [
        localStorage.getItem("revelacode_saved_study_count_" + String(userId || "guest")),
        localStorage.getItem("revelacode_bookmark_count_" + String(userId || "guest")),
        localStorage.getItem("revelacode_saved_study_count"),
      ];
      const countValue = countCandidates.find((value) => value !== null && value !== "");
      const parsedCount = countValue === undefined ? null : Number(countValue);
      const savedCount = Number.isFinite(parsedCount) && parsedCount >= 0 ? parsedCount : null;

      setHomeSnapshot({
        status: "ready",
        error: false,
        lesson,
        studyDays: Array.from(daySet).sort().slice(-180),
        savedCount,
      });
    } catch {
      setHomeSnapshot({ status: "error", error: true, lesson: null, studyDays: [], savedCount: null });
    }
  }, [activity.lastActivityTime, studyDaysKey, userId]);

  useEffect(() => {
    const timer = window.setTimeout(loadHomeSnapshot, 120);
    const handleQuarterlyUpdated = () => loadHomeSnapshot();
    window.addEventListener("revelacode:sda-quarterly-updated", handleQuarterlyUpdated);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("revelacode:sda-quarterly-updated", handleQuarterlyUpdated);
    };
  }, [loadHomeSnapshot]);

  const recordStudyDay = () => {
    const todayKey = faithLocalDateKey(new Date());
    let storedDays = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(studyDaysKey) || "[]");
      storedDays = Array.isArray(parsed) ? parsed.filter((day) => typeof day === "string") : [];
    } catch {
      // The in-memory streak remains available when storage is blocked.
    }
    const persistedDays = Array.from(new Set([...storedDays, todayKey])).sort().slice(-180);
    try {
      localStorage.setItem(studyDaysKey, JSON.stringify(persistedDays));
    } catch {
      // The in-memory streak remains available when storage is blocked.
    }
    setHomeSnapshot((current) => ({
      ...current,
      studyDays: Array.from(new Set([...(current.studyDays || []), todayKey])).sort().slice(-180),
    }));
  };

  useEffect(() => {
    if (["bible", "prophecy", "referential"].includes(activity.lastDashboard)) {
      setContinueTab(activity.lastDashboard);
    }
  }, [activity.lastDashboard]);

  const sabbathInfo = useMemo(
    () => faithSabbathStatus(now, sabbathSettings.sunsetHour),
    [now, sabbathSettings.sunsetHour]
  );
  const quarterInfo = useMemo(() => faithKenyaQuarter(now), [now]);
  const verseOfDay = FAITH_VERSES[now.getDate() - 1] || FAITH_VERSES[0];

  const studyWeekDays = useMemo(() => {
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const activeDays = new Set(homeSnapshot.studyDays || []);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + index);
      return {
        key: faithLocalDateKey(day),
        label: ["M", "T", "W", "T", "F", "S", "S"][index],
        active: activeDays.has(faithLocalDateKey(day)),
      };
    });
  }, [homeSnapshot.studyDays, now]);

  const weeklyStudyCount = studyWeekDays.filter((day) => day.active).length;
  const studyStreak = useMemo(() => {
    const activeDays = new Set(homeSnapshot.studyDays || []);
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    if (!activeDays.has(faithLocalDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (activeDays.has(faithLocalDateKey(cursor)) && count < 365) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [homeSnapshot.studyDays, now]);

  const featuredLesson = homeSnapshot.lesson;
  const featuredLessonMeta = faithLessonMeta(featuredLesson);
  const featuredLessonTitle = featuredLesson
    ? featuredLesson.title || featuredLessonMeta.lesson_title || "Sabbath School lesson"
    : "";
  const featuredMemoryVerse = featuredLessonMeta.memory_text || featuredLessonMeta.memory_verse || "";
  const faithHistory = useMemo(() => {
    return (Array.isArray(userHistory) ? userHistory : []).filter((entry) => {
      const searchable = [
        entry?.type,
        entry?.input,
        entry?.output,
        entry?.extra?.hub,
        entry?.extra?.workspace,
        entry?.extra?.route,
        entry?.fileName,
      ].join(" ").toLowerCase();
      return /(faith|bible|scripture|study|sda|quarter|prophecy|referential|missionpulse)/.test(searchable);
    });
  }, [userHistory]);
  const historyStudyDays = useMemo(
    () => Array.from(new Set(faithHistory
      .map((entry) => faithLocalDateKey(entry?.timestamp || entry?.createdAt || entry?.created_at))
      .filter(Boolean))).sort().slice(-180),
    [faithHistory]
  );
  useEffect(() => {
    const currentDays = homeSnapshot.studyDays || [];
    const mergedDays = Array.from(new Set([...currentDays, ...historyStudyDays])).sort().slice(-180);
    if (mergedDays.length === currentDays.length && mergedDays.every((day, index) => day === currentDays[index])) return;
    try {
      localStorage.setItem(studyDaysKey, JSON.stringify(mergedDays));
    } catch {
      // History remains the source for this session when storage is unavailable.
    }
    setHomeSnapshot((current) => ({ ...current, studyDays: mergedDays }));
  }, [historyStudyDays, homeSnapshot.studyDays, studyDaysKey]);

  const latestFaithActivity = faithHistory[0] || null;
  const hasContinueActivity = Boolean(
    activity.lastActivity || activity.lastActivityTime || latestFaithActivity
  );
  const continueDescription = activity.lastActivity ||
    latestFaithActivity?.input ||
    latestFaithActivity?.fileName ||
    "Pick up your Faith journey from where you last stopped.";
  const continueRelativeTime = faithRelativeTime(
    activity.lastActivityTime || latestFaithActivity?.timestamp || latestFaithActivity?.createdAt
  );



  /* =======================================================
     FAITH TOOLS
  ======================================================= */

  const faithTools = [
    {
      key: "bible",
      title: "Bible",
      label: "Scripture",
      description:
        "Read, search, and explore Scripture across books, chapters, verses, and references.",
      icon: Book,
      gradient: "from-blue-600 to-indigo-700",
      badge: "Read Scripture",
    },

    {
      key: "prophecy",
      title: "Prophecy",
      label: "Prophecy",
      description:
        "Study biblical prophecy, symbols, timelines, interpretations, and prophetic connections.",
      icon: BookOpen,
      gradient: "from-purple-600 to-violet-700",
      badge: "Decode Prophecy",
    },

    {
      key: "events",
      title: "Events",
      label: "Prophecy Events",
      description:
        "Follow current developments and events connected to biblical prophecy and world affairs.",
      icon: Globe,
      gradient: "from-orange-500 to-red-600",
      badge: "View Events",
    },

    {
      key: "referential",
      title: "Referential",
      label: "Cross References",
      description:
        "Connect verses, themes, symbols, concepts, and related passages across Scripture.",
      icon: Layers,
      gradient: "from-emerald-600 to-green-700",
      badge: "Explore References",
    },

    {
      key: "missionpulse",
      title: "MissionPulse",
      label: "Church & Community Mission",
      description:
        "Coordinate community care, ministry assignments, outreach programmes, volunteers and measurable impact.",
      icon: HeartHandshake,
      gradient: "from-emerald-700 to-teal-800",
      badge: "Serve Communities",
    },
  ];


  /* =======================================================
     GLOBAL NAVIGATION
  ======================================================= */

  const navigateTo = (key) => {
    if (!key || !onNavigate) {
      return;
    }
    if (["bible", "prophecy", "events", "referential", "missionpulse"].includes(key)) recordStudyDay();
    onNavigate(key);
  };

  const openBibleReference = (reference) => {
    const value = String(reference || "").trim();
    if (!value) return;
    try {
      window.localStorage.setItem("revelacode_pending_bible_reference", value);
    } catch {
      // Cross-component navigation still works when storage is restricted.
    }
    navigateTo("bible");
  };

  const handleStudyLinkCapture = (event) => {
    const anchor = event.target?.closest?.("a[href]");
    if (!anchor) return;
    let destination;
    try {
      destination = new URL(anchor.href, window.location.href);
    } catch {
      return;
    }
    if (!["http:", "https:"].includes(destination.protocol) || destination.origin === window.location.origin) return;
    event.preventDefault();
    event.stopPropagation();
    setSourceReturnSection(faithSection === "source-viewer" ? sourceReturnSection : faithSection);
    setSelectedSource({
      url: destination.href,
      title: anchor.textContent?.trim() || destination.hostname,
    });
    setFaithSection("source-viewer");
  };

  useEffect(() => {
    const openSavedSource = (event) => {
      const entry = event?.detail;
      if (!entry || !/^https?:\/\//i.test(String(entry.url || ""))) return;
      setSourceReturnSection(faithSection === "source-viewer" ? sourceReturnSection : faithSection);
      setSelectedSource({ url: String(entry.url), title: String(entry.title || entry.url) });
      setFaithSection("source-viewer");
    };
    window.addEventListener("revelacode:open-study-source", openSavedSource);
    return () => window.removeEventListener("revelacode:open-study-source", openSavedSource);
  }, [faithSection, sourceReturnSection]);

  /* =======================================================
     INTERNAL STUDY NAVIGATION
  ======================================================= */

  const openStudy = (topic = "all") => {
    recordStudyDay();
    setSelectedMaterial(null);
    setStudyTopic(topic || "all");
    setFaithSection("study");
  };

  const openBookmarks = () => {
    setSelectedMaterial(null);
    setFaithSection("bookmarks");
  };

  const openRecommendations = () => {
    setSelectedMaterial(null);
    setFaithSection("recommendations");
  };
  const openFaithAtlas = () => {
    recordStudyDay();
    setSelectedMaterial(null);
    setFaithSection("atlas");
  };

  const openFaithAcademy = () => {
    recordStudyDay();
    setSelectedMaterial(null);
    setFaithSection("premium");
  };

  const openSDAQuarterly = () => {
    recordStudyDay();
    setSelectedMaterial(null);
    setFaithSection("quarterly");
  };

  const openAncientWordRoots = () => {
    recordStudyDay();
    setSelectedMaterial(null);
    setFaithSection("word-roots");
  };

  const openMaterial = (material) => {
    if (!material) {
      return;
    }

    recordStudyDay();
    setSelectedMaterial(material);
    setStudyReturnSection(faithSection === "home" ? "study" : faithSection);
    setFaithSection("reader");
  };

  const closeStudyView = () => {
    setSelectedMaterial(null);
    setFaithSection("home");
  };

  const goBackFromReader = () => {
    setSelectedMaterial(null);
    setFaithSection(studyReturnSection || "study");
  };

  /* =======================================================
     INTERNAL STUDY HEADER
  ======================================================= */

  const renderStudyHeader = (title, description, backAction) => (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-gray-200/70
        bg-white
        shadow-sm
        dark:border-gray-800
        dark:bg-gray-900
      "
    >
      <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture}
        className="
          flex
          flex-col
          gap-4
          p-4
          sm:p-5
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={backAction}
            aria-label="Back to Faith"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-gray-200
              bg-gray-50
              text-gray-600
              transition
              hover:bg-gray-100
              dark:border-gray-700
              dark:bg-gray-800
              dark:text-gray-300
              dark:hover:bg-gray-700
            "
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="
                  rounded-full
                  bg-indigo-100
                  px-2.5
                  py-1
                  text-[0.625rem]
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-indigo-700
                  dark:bg-indigo-900/40
                  dark:text-indigo-300
                "
              >
                Faith Study
              </span>

              {!isGuest && (
                <span
                  className="
                    rounded-full
                    bg-emerald-100
                    px-2.5
                    py-1
                    text-[0.625rem]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-emerald-700
                    dark:bg-emerald-900/30
                    dark:text-emerald-300
                  "
                >
                  Account Active
                </span>
              )}
            </div>

            <h1
              className="
                mt-2
                text-xl
                font-black
                tracking-tight
                text-gray-900
                dark:text-white
                sm:text-2xl
              "
            >
              {title}
            </h1>

            {description && (
              <p
                className="
                  mt-1
                  max-w-3xl
                  text-sm
                  leading-6
                  text-gray-500
                  dark:text-gray-400
                "
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div
          className="
            flex
            flex-wrap
            gap-2
            lg:justify-end
          "
        >
          
          <button
            type="button"
            onClick={openStudy}
            className={`
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-3.5
              py-2.5
              text-sm
              font-bold
              transition
              ${
                faithSection === "study"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >
            <Library size={16} />
            Library
          </button>

          <button
            type="button"
            onClick={openBookmarks}
            className={`
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-3.5
              py-2.5
              text-sm
              font-bold
              transition
              ${
                faithSection === "bookmarks"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >
            <Bookmark size={16} />
            Bookmarks
          </button>

          <button
            type="button"
            onClick={openRecommendations}
            className={`
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-3.5
              py-2.5
              text-sm
              font-bold
              transition
              ${
                faithSection === "recommendations"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >
            <Star size={16} />
            Recommended
          </button>

          <button
            type="button"
            onClick={openFaithAcademy}
            className={"inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition " + (
              faithSection === "premium"
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <GraduationCap size={16} />
            Academy
          </button>
          <button
            type="button"
            onClick={openSDAQuarterly}
            className={"inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition " + (
              faithSection === "quarterly"
                ? "bg-amber-500 text-white"
                : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
            )}
          >
            <CalendarDays size={16} />
            SDA Quarterly
          </button>
          <button
            type="button"
            onClick={openAncientWordRoots}
            className={"inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition " + (
              faithSection === "word-roots"
                ? "bg-violet-600 text-white"
                : "border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-950/50"
            )}
          >
            <BookOpen size={16} />
            Ancient Word Roots
          </button>
        </div>
      </div>
    </section>
  );

  /* =======================================================
     INTERNAL STUDY VIEWS
  ======================================================= */

  if (faithSection === "source-viewer") {
    return (
      <FaithWorkspaceLayout
        page="library"
        title={selectedSource?.title || "Study Reference"}
        description="Read the selected research source inside RevelaCode where the publisher permits it."
        contextData={{ source: selectedSource?.title || selectedSource?.url || "Study source" }}
        onOpenAI={onOpenAI}
        onBack={() => { setSelectedSource(null); setFaithSection(sourceReturnSection || "study"); }}
        onNavigate={onNavigate}
        panel={false}
      >
        <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="min-w-0">
          <StudyResourceViewer source={selectedSource} />
        </div>
      </FaithWorkspaceLayout>
    );
  }

  if (faithSection === "study") {
    return (
      <FaithAndroidWorkspaceFrame title="Study Library" active="study" onBack={closeStudyView} onNavigate={onNavigate} onOpenAI={onOpenAI} onHome={() => setFaithSection("home")} onStudy={() => openStudy("all")}>
        <div data-demo="faith-study-library" data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="mx-auto w-full max-w-[1500px] min-w-0 space-y-4">
          <StudyLibrary onOpen={openMaterial} userId={userId} initialTopicFilter={studyTopic} onOpenReference={openBibleReference} onOpenAtlas={openFaithAtlas} onOpenWordRoots={openAncientWordRoots} onOpenAI={onOpenAI} onBack={closeStudyView} onNavigate={onNavigate} />
        </div>
      </FaithAndroidWorkspaceFrame>
    );
  }

  if (faithSection === "bookmarks") {
    return (
      <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture}
        className="
          mx-auto
          w-full
          max-w-[1500px]
          space-y-4
        "
      >
        <FaithWorkspaceLayout
          page="library"
          title="Saved Study"
          description="Access study materials bookmarked for later reading."
          contextData={{ collection: "Saved Study" }}
          onOpenAI={onOpenAI}
          onBack={closeStudyView}
          onNavigate={onNavigate}
          panel={false}
        >
          <BookmarksPanel userId={userId} onOpen={openMaterial} />
        </FaithWorkspaceLayout>
      </div>
    );
  }

  if (faithSection === "recommendations") {
    return (
      <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture}
        className="
          mx-auto
          w-full
          max-w-[1500px]
          space-y-4
        "
      >
        <FaithWorkspaceLayout
          page="library"
          title="Recommended Study"
          description="Discover study materials selected from your saved study preferences."
          contextData={{ collection: "Recommended Study" }}
          onOpenAI={onOpenAI}
          onBack={closeStudyView}
          onNavigate={onNavigate}
          panel={false}
        >
          <RecommendationsPanel userId={userId} onOpen={openMaterial} />
        </FaithWorkspaceLayout>
      </div>
    );
  }

  if (faithSection === "atlas") {
    return (
      <FaithAndroidWorkspaceFrame title="Faith Atlas" active="study" onBack={closeStudyView} onNavigate={onNavigate} onOpenAI={onOpenAI} onHome={() => setFaithSection("home")} onStudy={() => openStudy("all")}>
        <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="mx-auto w-full max-w-[1500px] min-w-0 space-y-4">
          <FaithAtlas userId={userId} onOpenReference={openBibleReference} onOpenAI={onOpenAI} onBack={closeStudyView} onNavigate={onNavigate} />
        </div>
      </FaithAndroidWorkspaceFrame>
    );
  }
  if (faithSection === "premium") {
    return (
      <FaithAndroidWorkspaceFrame title="Faith Academy" active="study" onBack={closeStudyView} onNavigate={onNavigate} onOpenAI={onOpenAI} onHome={() => setFaithSection("home")} onStudy={() => openStudy("all")}>
        <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="mx-auto w-full max-w-[1500px] min-w-0 space-y-4">
          <FaithPremiumWorkspace
            user={user}
            isGuest={isGuest}
            onLogin={onLogin}
            onNavigate={navigateTo}
            onOpenAI={onOpenAI}
            onBack={closeStudyView}
          />
        </div>
      </FaithAndroidWorkspaceFrame>
    );
  }
  if (faithSection === "quarterly") {
    return (
      <FaithAndroidWorkspaceFrame title="SDA Quarterly" active="study" onBack={closeStudyView} onNavigate={onNavigate} onOpenAI={onOpenAI} onHome={() => setFaithSection("home")} onStudy={() => openStudy("all")}>
        <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="mx-auto w-full max-w-[1500px] min-w-0 space-y-4">
          <SDAQuarterlyWorkspace onOpen={openMaterial} onOpenAI={onOpenAI} onBack={closeStudyView} onNavigate={onNavigate} />
        </div>
      </FaithAndroidWorkspaceFrame>
    );
  }

  if (faithSection === "word-roots") {
    return (
      <FaithAndroidWorkspaceFrame title="Ancient Word Roots" active="study" onBack={closeStudyView} onNavigate={onNavigate} onOpenAI={onOpenAI} onHome={() => setFaithSection("home")} onStudy={() => openStudy("all")}>
        <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="mx-auto w-full max-w-[1500px] min-w-0 space-y-4">
          <AncientWordRootsWorkspace
            onOpenAcademy={openFaithAcademy}
            onLogin={onLogin}
            onOpenAI={onOpenAI}
            onBack={closeStudyView}
            onNavigate={onNavigate}
          />
        </div>
      </FaithAndroidWorkspaceFrame>
    );
  }

  if (faithSection === "reader") {
    return (
      <FaithWorkspaceLayout
        page="library"
        title={selectedMaterial?.title || "Study Reader"}
        description="Read the complete lesson and continue your Faith study from one place."
        contextData={{ material: selectedMaterial?.title || "Study material", id: selectedMaterial?.id || selectedMaterial?._id || "" }}
        onOpenAI={onOpenAI}
        onBack={goBackFromReader}
        onNavigate={onNavigate}
      >
        <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="min-w-0">
        {selectedMaterial ? (
          <StudyReader
            onOpenReference={openBibleReference}
            initialMaterial={selectedMaterial}
            materialId={
              selectedMaterial?.id ||
              selectedMaterial?._id ||
              selectedMaterial?.material_id ||
              selectedMaterial?.materialId
            }
            userId={userId}
            onBack={goBackFromReader}
          />
        ) : (
          <section
            className="
              rounded-2xl
              border
              border-gray-200/70
              bg-white
              p-8
              text-center
              shadow-sm
              dark:border-gray-800
              dark:bg-gray-900
            "
          >
            <Library
              size={38}
              className="
                mx-auto
                text-indigo-500
              "
            />

            <h2
              className="
                mt-4
                text-lg
                font-black
                text-gray-900
                dark:text-white
              "
            >
              No study material selected
            </h2>

            <p
              className="
                mx-auto
                mt-2
                max-w-md
                text-sm
                leading-6
                text-gray-500
                dark:text-gray-400
              "
            >
              Open a lesson from the Study Library to begin reading.
            </p>

            <button
              type="button"
              onClick={openStudy}
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-indigo-600
                px-4
                py-2.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-indigo-700
              "
            >
              Open Study Library
              <ArrowRight size={16} />
            </button>
          </section>
        )}
        </div>
      </FaithWorkspaceLayout>
    );
  }

  /* =======================================================
     MAIN FAITH DASHBOARD
  ======================================================= */

  const submitGlobalSearch = (event) => {
    event.preventDefault();
    const query = globalSearch.trim();
    if (!query) return;
    try {
      localStorage.setItem("revelacode_pending_bible_reference", query);
      localStorage.setItem("revelacode_pending_faith_search", query);
    } catch {
      // Continue to Scripture search when local storage is unavailable.
    }
    navigateTo("bible");
  };

  const askAIAboutSearch = () => {
    const query = globalSearch.trim();
    if (query) {
      try {
        localStorage.setItem("revelacode_pending_ai_prompt", query);
      } catch {
        // AI can still be opened without a prefilled prompt.
      }
      window.dispatchEvent(new CustomEvent("revelacode:faith-ai-prompt", { detail: { prompt: query } }));
    }
    onOpenAI?.();
  };

  const continueTabs = [
    { id: "bible", label: "Bible" },
    { id: "prophecy", label: "Prophecy" },
    { id: "referential", label: "Referencing" },
  ];

  const toolDescriptions = {
    bible: "Read and search Scripture.",
    prophecy: "Study Daniel, Revelation and prophecy.",
    events: "Follow current events and context.",
    referential: "Connect verses and biblical themes.",
    missionpulse: "Coordinate outreach and community care.",
  };

  const openHistoryEntry = (entry) => {
    const target = String(
      entry?.extra?.route || entry?.extra?.hub || entry?.extra?.workspace || entry?.type || ""
    ).toLowerCase();
    if (target.includes("prophecy")) navigateTo("prophecy");
    else if (target.includes("referential")) navigateTo("referential");
    else if (target.includes("event")) navigateTo("events");
    else if (target.includes("mission")) window.location.assign("/faith/missionpulse");
    else if (target.includes("bible") || target.includes("scripture")) navigateTo("bible");
    else openStudy("all");
  };

  if (faithSection === "history") {
    return (
      <FaithWorkspaceLayout
        page="library"
        title="Study History"
        description="Return to recent Scripture, prophecy and Faith study activity."
        contextData={{ collection: "Study History", records: faithHistory.length }}
        onOpenAI={onOpenAI}
        onBack={() => setFaithSection("home")}
        onNavigate={onNavigate}
        panel={false}
      >
        <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Faith activity</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{faithHistory.length} matching study record{faithHistory.length === 1 ? "" : "s"}</p>
            </div>
            <button type="button" onClick={() => refetchHistory?.()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
          {loadingHistory ? (
            <div className="mt-4 space-y-3 animate-pulse" aria-label="Loading study history">
              <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : historyError ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Study history is temporarily unavailable.</p>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">Your saved study activity has not been deleted. Try loading it again.</p>
              <button type="button" onClick={() => refetchHistory?.()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                <RefreshCw size={15} /> Retry
              </button>
            </div>
          ) : faithHistory.length ? (
            <div className="mt-4 space-y-2">
              {faithHistory.slice(0, 40).map((entry, index) => (
                <button key={entry.id || entry._id || index} type="button" onClick={() => openHistoryEntry(entry)} className="flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:hover:bg-slate-800/60 motion-reduce:transform-none motion-reduce:transition-none">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><History size={19} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{entry.input || entry.fileName || entry.type || "Faith study activity"}</span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{faithRelativeTime(entry.timestamp) || "Saved activity"}</span>
                  </span>
                  <ChevronRight size={17} className="shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700">
              <History size={26} className="mx-auto text-slate-400" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Your study history starts here</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Open the Bible, a prophecy study, or a Sabbath School lesson to begin building your history.</p>
              <button type="button" onClick={() => navigateTo("bible")} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><BookOpen size={16} /> Start Bible study</button>
            </div>
          )}
        </section>
      </FaithWorkspaceLayout>
    );
  }

  return (
    <FaithHomeDashboard
      user={user}
      isGuest={isGuest}
      displayName={displayName}
      globalSearch={globalSearch}
      setGlobalSearch={setGlobalSearch}
      submitGlobalSearch={submitGlobalSearch}
      askAIAboutSearch={askAIAboutSearch}
      navigateTo={navigateTo}
      openStudy={openStudy}
      openSDAQuarterly={openSDAQuarterly}
      openFaithAcademy={openFaithAcademy}
      openMaterial={openMaterial}
      featuredLesson={featuredLesson}
      featuredLessonTitle={featuredLessonTitle}
      continueDescription={continueDescription}
      hasContinueActivity={hasContinueActivity}
      continueTab={continueTab}
      setContinueTab={setContinueTab}
      setFaithSection={setFaithSection}
      verseOfDay={verseOfDay}
      studyStreak={studyStreak}
      studyDaysKey={studyDaysKey}
      onNavigate={onNavigate}
      onOpenAI={onOpenAI}
      setComingSoonFeature={setComingSoonFeature}
      comingSoonFeature={comingSoonFeature}
      homeKeyboardOpen={homeKeyboardOpen}
      setHomeKeyboardOpen={setHomeKeyboardOpen}
      loadHomeSnapshot={loadHomeSnapshot}
      adSubscriptionStatus={adSubscriptionStatus}
    />
  );
}
