// src/components/FaithDashboard.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowLeft,
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
  CalendarDays,
  ChevronRight,
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
import PremiumPlansStar from "@/premium/PremiumPlansStar.jsx";
import { useHistory } from "@/context/HistoryContext.jsx";
import { useRevenueApi } from "@/services/revenueApi.jsx";
import { FaithMobileBottomNav, FaithOfflineBanner, PullToRefreshSurface, useFaithAndroidBack } from "./faith/workspace/FaithWorkspaceLayout.jsx";

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
  const [backPrompt, setBackPrompt] = useState("");
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

  const handleFaithNativeBack = useCallback(() => {
    if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) { document.activeElement.blur(); setHomeKeyboardOpen(false); return true; }
    if (comingSoonFeature) { setComingSoonFeature(""); return true; }
    if (selectedSource) { setSelectedSource(null); setFaithSection(sourceReturnSection || "home"); return true; }
    if (selectedMaterial) { goBackFromReader(); return true; }
    if (faithSection !== "home") { closeStudyView(); return true; }
    return false;
  }, [comingSoonFeature, selectedSource, sourceReturnSection, selectedMaterial, faithSection, studyReturnSection]);

  const showFaithBackPrompt = useCallback((message) => {
    setBackPrompt(message);
    window.setTimeout(() => setBackPrompt(""), 1900);
  }, []);

  useFaithAndroidBack({
    enabled: faithSection === "home",
    isHome: true,
    onBackAction: handleFaithNativeBack,
    onPrompt: showFaithBackPrompt,
  });

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
                  text-[10px]
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
                    text-[10px]
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
          <PremiumPlansStar />
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
      <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="mx-auto w-full max-w-[1500px] space-y-4">
        {renderStudyHeader(
          selectedSource?.title || "Study Reference",
          "Read the selected research source inside RevelaCode where the publisher permits it, and return directly to your lesson.",
          () => { setSelectedSource(null); setFaithSection(sourceReturnSection || "study"); }
        )}
        <StudyResourceViewer source={selectedSource} />
      </div>
    );
  }

  if (faithSection === "study") {
    return (
      <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture}
        className="
          mx-auto
          w-full
          max-w-[1500px]
          space-y-4
        "
      >
        <StudyLibrary onOpen={openMaterial} userId={userId} initialTopicFilter={studyTopic} onOpenReference={openBibleReference} onOpenAtlas={openFaithAtlas} onOpenWordRoots={openAncientWordRoots} onOpenAI={onOpenAI} onBack={closeStudyView} onNavigate={onNavigate} />
      </div>
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
        {renderStudyHeader(
          "Saved Study",
          "Access the study materials you have bookmarked for later reading.",
          closeStudyView
        )}

        <BookmarksPanel
          userId={userId}
          onOpen={openMaterial}
        />
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
        {renderStudyHeader(
          "Recommended Study",
          "Discover study materials selected from your saved study preferences.",
          closeStudyView
        )}

        <RecommendationsPanel
          userId={userId}
          onOpen={openMaterial}
        />
      </div>
    );
  }

  if (faithSection === "atlas") {
    return (
      <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="mx-auto w-full max-w-[1500px] space-y-4">
        <FaithAtlas userId={userId} onOpenReference={openBibleReference} onOpenAI={onOpenAI} onBack={closeStudyView} onNavigate={onNavigate} />
      </div>
    );
  }
  if (faithSection === "premium") {
    return (
      <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="mx-auto w-full max-w-[1500px] space-y-4">
        <FaithPremiumWorkspace
          user={user}
          isGuest={isGuest}
          onLogin={onLogin}
          onNavigate={navigateTo}
          onOpenAI={onOpenAI}
          onBack={closeStudyView}
          onNavigate={onNavigate}
        />
      </div>
    );
  }
  if (faithSection === "quarterly") {
    return (
      <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="mx-auto w-full max-w-[1500px] space-y-4">
        <SDAQuarterlyWorkspace onOpen={openMaterial} onOpenAI={onOpenAI} onBack={closeStudyView} onNavigate={onNavigate} />
      </div>
    );
  }

  if (faithSection === "word-roots") {
    return (
      <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture} className="mx-auto w-full max-w-[1500px] space-y-4">
        <AncientWordRootsWorkspace
          onOpenAcademy={openFaithAcademy}
          onLogin={onLogin}
          onOpenAI={onOpenAI}
          onBack={closeStudyView}
        />
      </div>
    );
  }

  if (faithSection === "reader") {
    return (
      <div data-faith-study-root="true" onClickCapture={handleStudyLinkCapture}
        className="
          mx-auto
          w-full
          max-w-[1500px]
          space-y-4
        "
      >
        {renderStudyHeader(
          selectedMaterial?.title || "Study Reader",
          selectedMaterial
            ? "Read the complete lesson and continue your Faith study from one place."
            : "Open a study material from the library.",
          goBackFromReader
        )}

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
      <div className="mx-auto w-full max-w-[1500px] space-y-4 pb-24 sm:pb-0">
        {renderStudyHeader(
          "Study History",
          "Return to recent Scripture, prophecy and Faith study activity.",
          () => setFaithSection("home")
        )}
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
      </div>
    );
  }

  return (
    <div
      data-demo="faith-overview"
      className="mx-auto w-full max-w-[1500px] min-w-0 space-y-4 overflow-x-hidden overscroll-y-contain pb-24 sm:space-y-6 sm:p-1 sm:pb-0"
    >
      <FaithOfflineBanner />
      <PullToRefreshSurface onRefresh={loadHomeSnapshot}>
      <header aria-label="Faith and Scripture workspace" className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30 sm:p-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
              <BookOpen size={14} /> Faith &amp; Scripture
            </div>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                {sabbathInfo.active ? "Happy Sabbath" : "Welcome"}, {displayName}
              </h1>
              {!isGuest && (
                <span className="inline-flex min-h-7 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <BadgeCheck size={13} /> Verified
                </span>
              )}
              {isGuest && <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">Guest session</span>}
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600 dark:text-slate-300">A focused place to study Scripture, prepare for Sabbath School and follow Christ in daily life.</p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
            <span className={sabbathInfo.active ? "inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200" : "inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"}>
              <Sun size={16} /> {sabbathInfo.label} <span className="text-[10px] font-medium opacity-70">approx.</span>
            </span>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
              <Flame size={16} className="text-orange-500" /> {studyStreak} day{studyStreak === 1 ? "" : "s"} streak
            </span>
            <PremiumPlansStar className="!h-11 !min-h-11 !rounded-xl !px-3 focus-visible:ring-2 focus-visible:ring-indigo-500" />
          </div>
        </div>
      </header>

      <form onSubmit={submitGlobalSearch} role="search" className="flex min-w-0 flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:p-4">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search a Bible verse, topic or EGW quote</span>
          <Sparkles size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
          <input
            type="search"
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Search a verse, topic or EGW quote…"
            aria-label="Search a verse, topic or EGW quote"
            className="min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </label>
        <div className="flex min-w-0 gap-2">
          <button type="submit" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none">
            <Search size={17} /> Search
          </button>
          <button type="button" onClick={askAIAboutSearch} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-800 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-950/70 motion-reduce:transform-none motion-reduce:transition-none">
            <Sparkles size={17} /> Ask RevelaAI
          </button>
        </div>
      </form>

      <FaithSponsoredBanner enabled={adSubscriptionStatus === "free"} />

      <section aria-label="Your study for this week" className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                <CalendarDays size={14} /> This week's Sabbath School
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Make space for the Word</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Quarter {quarterInfo.quarter} · {quarterInfo.year}</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><BookOpen size={21} /></span>
          </div>

          {homeSnapshot.status === "loading" ? (
            <div className="mt-5 animate-pulse space-y-3" aria-label="Loading Sabbath School lesson">
              <div className="h-5 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="h-6 w-4/5 rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : homeSnapshot.error ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Lesson preview is unavailable.</p>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">Your Sabbath School workspace is still available.</p>
              <button type="button" onClick={loadHomeSnapshot} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><RefreshCw size={14} /> Retry</button>
            </div>
          ) : featuredLesson ? (
            <div className="mt-4 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                  {featuredLessonMeta.lesson_number ? "Lesson " + featuredLessonMeta.lesson_number : "Daily lesson"}
                </span>
                {featuredLessonMeta.day && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{featuredLessonMeta.day}</span>}
              </div>
              <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-slate-900 dark:text-white">{featuredLessonTitle}</h3>
              {featuredMemoryVerse ? (
                <blockquote className="mt-3 rounded-xl border-l-2 border-amber-400 bg-amber-50/70 px-3 py-2.5 text-xs leading-5 text-slate-700 dark:bg-amber-950/20 dark:text-slate-200">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">Memory verse</span>
                  {featuredMemoryVerse}
                </blockquote>
              ) : (
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">Open the lesson to read this week's memory verse and daily study notes.</p>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Your weekly lesson is ready to explore.</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Open Sabbath School to load the current quarter. Its saved lesson preview will appear here on your next visit.</p>
            </div>
          )}

          <div className="mt-auto pt-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">7-day study progress</span>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{weeklyStudyCount}/7 days</span>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5" aria-label={weeklyStudyCount + " of 7 study days completed"}>
              {studyWeekDays.map((day) => (
                <div key={day.key} className="min-w-0 text-center">
                  <span className="text-[10px] font-semibold text-slate-400">{day.label}</span>
                  <span className={day.active ? "mt-1 block h-1.5 rounded-full bg-indigo-600" : "mt-1 block h-1.5 rounded-full bg-slate-100 dark:bg-slate-800"} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => featuredLesson ? openMaterial(featuredLesson) : openSDAQuarterly()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transform-none motion-reduce:transition-none">
                <Play size={16} /> Open today's lesson
              </button>
              <button type="button" onClick={() => openStudy("sda")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 motion-reduce:transition-none">
                <BookOpen size={16} /> Class notes
              </button>
            </div>
          </div>
        </article>

        <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">
                <History size={14} /> Continue where you left off
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Your next study session</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pick up a recent study or choose a workspace.</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><Clock3 size={21} /></span>
          </div>

          <div className="mt-4 inline-flex w-fit max-w-full items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="group" aria-label="Choose study workspace">
            {continueTabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setContinueTab(tab.id)} aria-pressed={continueTab === tab.id} className={continueTab === tab.id ? "min-h-11 rounded-lg bg-white px-3 text-xs font-bold text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300" : "min-h-11 rounded-lg px-3 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"}>
                {tab.label}
              </button>
            ))}
          </div>

          {homeSnapshot.status === "loading" ? (
            <div className="mt-4 animate-pulse space-y-3" aria-label="Loading recent study">
              <div className="h-5 w-2/5 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : homeSnapshot.error ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Your recent study could not be read.</p>
              <button type="button" onClick={loadHomeSnapshot} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><RefreshCw size={14} /> Retry</button>
            </div>
          ) : hasContinueActivity ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Last study item</p>
              <h3 className="mt-1 break-words text-sm font-semibold leading-5 text-slate-900 dark:text-white">{continueDescription}</h3>
              {continueRelativeTime && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Last active {continueRelativeTime}</p>}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Start your first study.</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Choose Bible, Prophecy or Referencing to build your study history.</p>
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Saved study</span>
              <span className="ml-1 tabular-nums">{homeSnapshot.savedCount === null ? "—" : homeSnapshot.savedCount}</span>
            </div>
            <button type="button" onClick={() => navigateTo(continueTab)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transform-none motion-reduce:transition-none">
              Resume <ArrowRight size={16} />
            </button>
          </div>
        </article>
      </section>

      <section aria-label="SDA essentials" className="space-y-3 sm:hidden">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">SDA essentials</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Swipe to open a core study collection.</p>
        </div>
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" onClick={openSDAQuarterly} className="inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 active:scale-[0.98] dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"><CalendarDays size={16}/>Quarterly</button>
          <button type="button" onClick={() => setComingSoonFeature("EGW Writings")} className="inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><ScrollText size={16}/>EGW Writings <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] dark:bg-slate-800">Soon</span></button>
          <button type="button" onClick={() => setComingSoonFeature("28 Fundamental Beliefs")} className="inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><BookOpen size={16}/>28 Beliefs <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] dark:bg-slate-800">Soon</span></button>
          <button type="button" onClick={() => navigateTo("prophecy")} className="inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-800 active:scale-[0.98] dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200"><Compass size={16}/>Sanctuary</button>
          <button type="button" onClick={() => setComingSoonFeature("SDA Hymnal")} className="inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><Book size={16}/>Hymnal <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] dark:bg-slate-800">Soon</span></button>
        </div>
      </section>

      <section aria-labelledby="faith-essentials-heading" className="hidden space-y-3 sm:block">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="faith-essentials-heading" className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">SDA essentials</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">A few foundations to keep your study anchored.</p>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
          <button type="button" onClick={openSDAQuarterly} className="group flex min-h-[112px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-900 motion-reduce:transform-none motion-reduce:transition-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><CalendarDays size={20} /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900 dark:text-white">Quarterly</span><span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">Sabbath School</span></span>
          </button>
          <button type="button" onClick={() => setComingSoonFeature("EGW Writings")} className="group relative flex min-h-[112px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 motion-reduce:transform-none motion-reduce:transition-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"><ScrollText size={20} /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900 dark:text-white">EGW Writings</span><span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">Devotional library</span></span>
            <span className="absolute right-2 top-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Soon</span>
          </button>
          <button type="button" onClick={() => setComingSoonFeature("28 Fundamental Beliefs")} className="group relative flex min-h-[112px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 motion-reduce:transform-none motion-reduce:transition-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><BookOpen size={20} /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900 dark:text-white">28 Beliefs</span><span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">SDA foundations</span></span>
            <span className="absolute right-2 top-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Soon</span>
          </button>
          <button type="button" onClick={() => navigateTo("prophecy")} className="group flex min-h-[112px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 motion-reduce:transform-none motion-reduce:transition-none">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><Compass size={20} /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900 dark:text-white">Sanctuary</span><span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">Daniel &amp; Revelation</span></span>
          </button>
        </div>
      </section>

      <section aria-labelledby="faith-tools-heading" className="space-y-3">
        <div>
          <h2 id="faith-tools-heading" className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Study tools</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Five focused workspaces for Bible study and mission.</p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {faithTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.key}
                type="button"
                onClick={() => tool.key === "missionpulse" ? window.location.assign("/faith/missionpulse") : navigateTo(tool.key)}
                className={(tool.key === "missionpulse" ? "col-span-2 sm:col-span-1 " : "") + "group flex min-h-[154px] min-w-0 flex-col rounded-2xl border border-slate-200/70 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900 sm:min-h-[160px] sm:p-4 motion-reduce:transform-none motion-reduce:transition-none"}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><Icon size={20} /></span>
                <span className="mt-3 block min-w-0 text-sm font-semibold text-slate-900 dark:text-white">{tool.title}</span>
                <span className="mt-1 line-clamp-2 min-w-0 text-xs leading-5 text-slate-500 dark:text-slate-400">{toolDescriptions[tool.key] || tool.description}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300">Open <ArrowRight size={14} /></span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="More Faith learning" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <button type="button" onClick={openFaithAtlas} className="flex min-w-0 flex-col rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 motion-reduce:transform-none motion-reduce:transition-none">
          <div className="flex items-center justify-between gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><Map size={20} /></span><span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">New preview</span></div>
          <span className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Faith Atlas</span>
          <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Explore connections across Daniel, Revelation and sanctuary themes.</span>
          <span className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Interpretations are clearly labeled for investigation.</span>
        </button>
        <button type="button" onClick={openFaithAcademy} className="flex min-w-0 flex-col rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 motion-reduce:transform-none motion-reduce:transition-none">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"><GraduationCap size={20} /></span>
          <span className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Faith Academy</span>
          <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Structured lessons, assessments, notes and guided learning.</span>
          <span className="mt-auto pt-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300">Open Academy <ArrowRight size={14} className="inline" /></span>
        </button>
        <button type="button" onClick={openAncientWordRoots} className="flex min-w-0 flex-col rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 motion-reduce:transform-none motion-reduce:transition-none">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><BookOpen size={20} /></span>
          <span className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Ancient Word Roots</span>
          <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Explore Hebrew and Greek words in their biblical context.</span>
          <span className="mt-auto pt-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300">Explore roots <ArrowRight size={14} className="inline" /></span>
        </button>
      </section>

      <section aria-label="Verse of the day" className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><BookOpen size={20} /></span>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">Verse of the day</div>
          <blockquote className="mt-1 text-sm font-medium leading-6 text-slate-800 dark:text-slate-100">“{verseOfDay.text}”</blockquote>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{verseOfDay.reference} · KJV</p>
        </div>
      </section>

      <section aria-labelledby="faith-tracks-heading" className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 id="faith-tracks-heading" className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Study tracks</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose a guided topic and keep exploring.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => navigateTo("events")} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-900 transition-all duration-200 hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200">
              <Globe size={14} /> Current world events <ArrowRight size={13} />
            </button>
            <button type="button" onClick={() => openStudy("all")} className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-indigo-700 transition-colors hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300">
              All Faith studies <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: "biblical-literacy", label: "Bible study" },
            { id: "christian-foundations", label: "Christian foundations" },
            { id: "prophecy", label: "Prophecy research" },
            { id: "sda", label: "SDA perspective" },
            { id: "catholic", label: "Catholic perspective" },
            { id: "interfaith", label: "Islam & Christianity" },
            { id: "daily-life", label: "Daily life & reflection" },
          ].map((track) => (
            <button key={track.id} type="button" onClick={() => openStudy(track.id)} className="min-h-11 shrink-0 snap-start rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40 motion-reduce:transition-none">
              {track.label}
            </button>
          ))}
        </div>
      </section>

      <footer aria-label="Faith study shortcuts" className="grid min-w-0 grid-cols-3 gap-2 rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:gap-3 sm:p-3">
        <button type="button" onClick={() => setFaithSection("history")} className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-center text-[11px] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-slate-800 sm:gap-2 sm:text-xs">
          <History size={16} className="shrink-0 text-indigo-600 dark:text-indigo-300" /><span className="min-w-0">Study History</span>
        </button>
        <button type="button" onClick={openBookmarks} className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-center text-[11px] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-slate-800 sm:gap-2 sm:text-xs">
          <Bookmark size={16} className="shrink-0 text-amber-600 dark:text-amber-300" /><span className="min-w-0">Saved Study</span>
        </button>
        <button type="button" onClick={openStudy} data-demo="faith-study-library" className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-center text-[11px] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-slate-800 sm:gap-2 sm:text-xs">
          <Library size={16} className="shrink-0 text-indigo-600 dark:text-indigo-300" /><span className="min-w-0">Study Library</span>
        </button>
      </footer>

      {isGuest && (
        <section className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Save your Faith journey</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-emerald-800 dark:text-emerald-200">Create an account to preserve your study history, bookmarks and preferences.</p>
          </div>
          <button type="button" onClick={onLogin} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            Login / Register <ArrowRight size={16} />
          </button>
        </section>
      )}

      <FaithMobileBottomNav
        active="home"
        onHome={() => setFaithSection("home")}
        onStudy={() => openStudy("all")}
        onAskAI={() => onOpenAI?.()}
        onMission={() => window.location.assign("/faith/missionpulse")}
        onMe={() => onNavigate?.("profile")}
        hidden={homeKeyboardOpen}
      />
      {backPrompt && <div role="status" className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-[65] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg sm:bottom-5">{backPrompt}</div>}

      {comingSoonFeature && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setComingSoonFeature(""); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="faith-coming-soon-title" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><BookOpen size={20} /></div>
              <button type="button" onClick={() => setComingSoonFeature("")} aria-label="Close coming soon message" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <h2 id="faith-coming-soon-title" className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{comingSoonFeature} is coming to Faith</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">This study collection is being prepared. The tile will become an active workspace when its reviewed materials and study tools are ready.</p>
            <button type="button" onClick={() => setComingSoonFeature("")} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Got it</button>
          </section>
        </div>
      )}
      </PullToRefreshSurface>
    </div>
  );
}
