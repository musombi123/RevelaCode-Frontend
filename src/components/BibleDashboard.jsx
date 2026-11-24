// src/components/BibleDashboard.jsx

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { getCachedBibleBook, saveCachedBibleBook } from "./study/studyMaterialCache.js";
import StudyResourceViewer from "./study/StudyResourceViewer.jsx";
import FaithWorkspaceLayout from "./faith/workspace/FaithWorkspaceLayout.jsx";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { ArrowLeft, Settings, Sparkles, X } from "lucide-react";
import { App } from "@capacitor/app";
import { SearchRow, ContinueCard, BookGrid, VerseToolbar, StudyPanel as BibleStudyPanel } from "./faith/bible-mobile/BibleMobileComponents.jsx";
import { ConnectivityPill, AskBar } from "./faith/SharedMobileComponents.jsx";

/* =========================================================
   BIBLE BOOKS
========================================================= */

const oldTestament = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
];

const newTestament = [
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

/* =========================================================
   WORLD ENGLISH BIBLE (WEB)
   Load one book at a time to keep the KJV offline-first and
   avoid adding the full alternate dataset to the Android APK.
========================================================= */

const WEB_BOOK_IDS = {
  "Genesis": "Gen", "Exodus": "Exod", "Leviticus": "Lev",
  "Numbers": "Num", "Deuteronomy": "Deut", "Joshua": "Josh",
  "Judges": "Judg", "Ruth": "Ruth", "1 Samuel": "1Sam",
  "2 Samuel": "2Sam", "1 Kings": "1Kgs", "2 Kings": "2Kgs",
  "1 Chronicles": "1Chr", "2 Chronicles": "2Chr", "Ezra": "Ezra",
  "Nehemiah": "Neh", "Esther": "Esth", "Job": "Job",
  "Psalms": "Ps", "Proverbs": "Prov", "Ecclesiastes": "Eccl",
  "Song of Solomon": "Song", "Isaiah": "Isa", "Jeremiah": "Jer",
  "Lamentations": "Lam", "Ezekiel": "Ezek", "Daniel": "Dan",
  "Hosea": "Hos", "Joel": "Joel", "Amos": "Amos", "Obadiah": "Obad",
  "Jonah": "Jonah", "Micah": "Mic", "Nahum": "Nah", "Habakkuk": "Hab",
  "Zephaniah": "Zeph", "Haggai": "Hag", "Zechariah": "Zech", "Malachi": "Mal",
  "Matthew": "Matt", "Mark": "Mark", "Luke": "Luke", "John": "John",
  "Acts": "Acts", "Romans": "Rom", "1 Corinthians": "1Cor",
  "2 Corinthians": "2Cor", "Galatians": "Gal", "Ephesians": "Eph",
  "Philippians": "Phil", "Colossians": "Col", "1 Thessalonians": "1Thess",
  "2 Thessalonians": "2Thess", "1 Timothy": "1Tim", "2 Timothy": "2Tim",
  "Titus": "Titus", "Philemon": "Phlm", "Hebrews": "Heb", "James": "Jas",
  "1 Peter": "1Pet", "2 Peter": "2Pet", "1 John": "1John",
  "2 John": "2John", "3 John": "3John", "Jude": "Jude",
  "Revelation": "Rev",
};

function normalizeWebBook(payload, fallbackBookName) {
  return {
    book: payload?.englishName || fallbackBookName,
    chapters: Array.isArray(payload?.chapters)
      ? payload.chapters.map((chapter) => ({
          chapter: chapter.chapter,
          verses: Array.isArray(chapter.verses)
            ? chapter.verses.map((verse) => ({
                verse: verse.number ?? verse.verse,
                text: verse.text || "",
              }))
            : [],
        }))
      : [],
  };
}

/* =========================================================
   DASHBOARD LABELS
========================================================= */

/* =========================================================
   REUSABLE BACK BUTTON
========================================================= */

const BackButton = ({
  label = "Back",
  onClick,
  title,
  className = "",
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title || label}
    className={`
      inline-flex
      items-center
      gap-1.5
      rounded-lg
      border
      border-gray-200
      bg-white
      px-3
      py-1.5
      text-sm
      font-medium
      text-gray-700
      shadow-sm
      transition
      hover:bg-gray-100
      hover:border-gray-300
      active:scale-95
      dark:border-gray-700
      dark:bg-gray-900
      dark:text-gray-200
      dark:hover:bg-gray-800
      ${className}
    `}
  >
    <ArrowLeft size={16} />
    <span>{label}</span>
  </button>
);

const BIBLE_OFFLINE_CACHE_KEY = "revelacode_faith_bible_current_v1";

function readCachedBibleChapter() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BIBLE_OFFLINE_CACHE_KEY) || "null");
    if (!parsed || !Array.isArray(parsed.verses) || !parsed.verses.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

/* =========================================================
   GLOBAL BIBLE DASHBOARD
========================================================= */

export default function BibleDashboard({
  onNavigate,
  onBack,
  onOpenAI,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [cachedBibleChapter] = useState(readCachedBibleChapter);
  const [lastReadVerse, setLastReadVerse] = useState(() => cachedBibleChapter?.lastVerse || null);
  const [bibleData, setBibleData] = useState({});
  const [webData, setWebData] = useState({});
  const [sourceView, setSourceView] = useState(null);
  const [bibleVersion, setBibleVersion] = useState(() => {
    if (typeof window === "undefined") return "kjv";
    try {
      return window.localStorage.getItem("revelacode_bible_version") === "web"
        ? "web"
        : "kjv";
    } catch {
      return "kjv";
    }
  });
  const [loadingVersionBook, setLoadingVersionBook] = useState(false);
  const [bookKeys, setBookKeys] = useState([]);
  const [selectedBookKey, setSelectedBookKey] =
    useState(() => cachedBibleChapter?.book || "");
  const [selectedChapterIndex, setSelectedChapterIndex] =
    useState(() => Number.isInteger(cachedBibleChapter?.chapterIndex) ? cachedBibleChapter.chapterIndex : null);
  const [verses, setVerses] = useState(() => Array.isArray(cachedBibleChapter?.verses) ? cachedBibleChapter.verses : []);
  const [viewLevel, setViewLevel] = useState(() => cachedBibleChapter ? "chapter" : "books");
  const [searchInput, setSearchInput] = useState("");
  const [highlightedVerseRange, setHighlightedVerseRange] =
    useState(null);
  const [searchError, setSearchError] =
    useState("");
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [testament, setTestament] = useState("new");
  const [versionSheet, setVersionSheet] = useState(false);
  const [chapterSheet, setChapterSheet] = useState(false);
  const [aiSheet, setAiSheet] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [studyTab, setStudyTab] = useState("Cross-refs");
  const [textSize, setTextSize] = useState(18);
  const [chapterNote, setChapterNote] = useState(() => { try { return localStorage.getItem("revelacode_bible_note_" + (cachedBibleChapter?.book || "") + "_" + (cachedBibleChapter?.chapterIndex ?? "")) || ""; } catch { return ""; } });
  const [verseActionsMessage, setVerseActionsMessage] = useState("");
  useEffect(() => { const sync = () => setOnline(Boolean(navigator.onLine)); window.addEventListener("online", sync); window.addEventListener("offline", sync); return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); }; }, []);
  useEffect(() => { try { localStorage.setItem("revelacode_bible_note_" + (selectedBookKey || "") + "_" + (selectedChapterIndex ?? ""), chapterNote); } catch {} }, [chapterNote, selectedBookKey, selectedChapterIndex]);
  const closeSheets = () => { setVersionSheet(false); setChapterSheet(false); setAiSheet(false); };
  useEffect(() => { const onEscape = (event) => { if (event.key !== "Escape") return; if (versionSheet || aiSheet) closeSheets(); else if (viewLevel !== "books") { setChapterSheet(false); handleBack(); } }; document.addEventListener("keydown", onEscape); return () => document.removeEventListener("keydown", onEscape); }, [versionSheet, chapterSheet, aiSheet, viewLevel]);
  useEffect(() => { let subscription; App.addListener("backButton", () => { if (versionSheet || aiSheet) closeSheets(); else if (viewLevel !== "books") { setChapterSheet(false); handleBack(); } else handleGlobalBack(); }).then(result => { subscription = result; }).catch(() => {}); return () => { subscription?.remove?.(); }; }, [versionSheet, chapterSheet, aiSheet, viewLevel]);
  const askBibleAI = (question, verse = selectedVerse) => { const ref = verse && selectedBook ? selectedBook.book + " " + (selectedChapterIndex + 1) + ":" + verse.verse : currentReference; const payload = { question, contextType: "bible", contextData: { reference: ref, version: bibleVersion.toUpperCase(), verseText: verse?.text || "" } }; const complex = question.trim().split(" ").filter(Boolean).length > 25 || ["compare","explain in depth","historical","write","analyze","research"].some(term => question.toLowerCase().includes(term)); if (complex) { setAiSheet(true); window.__revelacodeBibleQuestion = payload; return; } onOpenAI?.(payload); };
  const changeVersion = (value) => handleBibleVersionChange({ target: { value } });
  const askAboutVerse = () => { const question = selectedVerse && selectedBook ? "Explain " + selectedBook.book + " " + (selectedChapterIndex + 1) + ":" + selectedVerse.verse + " in its context." : "Help me understand this Bible chapter in context."; const contextData = { reference: selectedVerse && selectedBook ? selectedBook.book + " " + (selectedChapterIndex + 1) + ":" + selectedVerse.verse : currentReference, version: bibleVersion.toUpperCase(), verseText: selectedVerse?.text || "" }; window.__revelacodeBibleQuestion = { question, contextType: "bible", contextData }; setAiSheet(true); };
  const resumeReading = () => {
    if (cachedBibleChapter?.book && Number.isInteger(cachedBibleChapter.chapterIndex)) {
      setSelectedBookKey(cachedBibleChapter.book);
      setSelectedChapterIndex(cachedBibleChapter.chapterIndex);
      setVerses(cachedBibleChapter.verses || bibleData[cachedBibleChapter.book]?.chapters?.[cachedBibleChapter.chapterIndex]?.verses || []);
      setViewLevel("verses");
      setHighlightedVerseRange(null);
      return;
    }
    const john = bookKeys.find(key => normalizeBookName(displayedBibleData[key]?.book) === "john");
    if (!john) return;
    if (bibleVersion === "web" && !webData[john]) { handleBookClick(john); setChapterSheet(true); return; }
    const firstChapter = displayedBibleData[john]?.chapters?.[0];
    if (!firstChapter) { handleBookClick(john); setChapterSheet(true); return; }
    setSelectedBookKey(john);
    setSelectedChapterIndex(0);
    setVerses(firstChapter.verses || []);
    setViewLevel("verses");
    setHighlightedVerseRange(null);
  };
  const actOnVerse = async (action) => {
    if (!selectedVerse || !selectedBook) return;
    const ref = selectedBook.book + " " + (selectedChapterIndex + 1) + ":" + selectedVerse.verse;
    if (action === "Highlight") {
      const index = verses.findIndex(item => item.verse === selectedVerse.verse);
      if (index >= 0) setHighlightedVerseRange({ start: index, end: index });
    }
    if (action === "Note") {
      setStudyTab("Notes");
      setChapterNote(current => current + (current.trim() ? "\n\n" : "") + ref + " — " + selectedVerse.text + "\n");
      setVerseActionsMessage("Verse added to your chapter notes.");
      return;
    }
    if (action === "Share") {
      const shareText = ref + " — " + selectedVerse.text;
      try { if (navigator.share) await navigator.share({ title: ref, text: shareText }); else await navigator.clipboard?.writeText(shareText); } catch {}
      return;
    }
    const storeKey = "revelacode_bible_bookmark_v1";
    try {
      const records = JSON.parse(localStorage.getItem(storeKey) || "[]");
      localStorage.setItem(storeKey, JSON.stringify([...records, { reference: ref, text: selectedVerse.text, savedAt: new Date().toISOString() }]));
      setVerseActionsMessage("Bookmark saved · " + ref);
    } catch { setVerseActionsMessage("Could not save on this device."); }
  }

  const verseRefs = useRef({});
  const chapterSwipeStartX = useRef(null);
  const displayedBibleData =
    bibleVersion === "web"
      ? { ...bibleData, ...webData }
      : bibleData;

  const loadWebBibleBook = async (bookKey) => {
    if (webData[bookKey]) return webData[bookKey];

    const bookName = bibleData[bookKey]?.book || bookKey;
    const osisId = WEB_BOOK_IDS[bookName];
    if (!osisId) {
      throw new Error(`World English Bible data is not mapped for ${bookName}.`);
    }

    // IndexedDB persists full books across platform launches and supports
    // offline rereading; the browser HTTP cache is only an additional layer.
    const savedBook = await getCachedBibleBook(bookKey).catch(() => null);
    if (savedBook?.chapters?.length) return savedBook;

    const response = await fetch(
      `https://raw.githubusercontent.com/midvash/bible-data/main/versions/en/web/books/${osisId}.json`,
      { cache: "force-cache" }
    );
    if (!response.ok) {
      throw new Error(`World English Bible book load failed (${response.status}).`);
    }

    const payload = await response.json();
    const normalized = normalizeWebBook(payload, bookName);
    if (!normalized.chapters.length) {
      throw new Error("World English Bible response contained no chapters.");
    }
    await saveCachedBibleBook(bookKey, normalized).catch(() => false);
    return normalized;
  };

  const handleBibleVersionChange = async (event) => {
    const nextVersion = event.target.value;
    setBibleVersion(nextVersion);
    setSearchError("");

    try {
      window.localStorage.setItem("revelacode_bible_version", nextVersion);
    } catch {
      // Continue to support browsing where browser storage is unavailable.
    }

    if (nextVersion === "kjv") {
      setLoadingVersionBook(false);
      if (selectedBookKey && selectedChapterIndex !== null) {
        setVerses(bibleData[selectedBookKey]?.chapters?.[selectedChapterIndex]?.verses || []);
      }
      return;
    }

    if (!selectedBookKey) return;

    setLoadingVersionBook(true);
    try {
      const book = await loadWebBibleBook(selectedBookKey);
      setWebData((current) => ({ ...current, [selectedBookKey]: book }));
      if (selectedChapterIndex !== null) {
        setVerses(book.chapters?.[selectedChapterIndex]?.verses || []);
      }
    } catch (error) {
      console.error("World English Bible loading error:", error);
      setSearchError("World English Bible could not be loaded. Check your connection and try again; KJV remains available offline.");
    } finally {
      setLoadingVersionBook(false);
    }
  };

  /* =======================================================
     USER
  ======================================================= */

  /* =======================================================
     PREVIOUS DASHBOARD
     -------------------------------------------------------
     Priority:
     1. Router state
     2. Session storage
     3. Local storage
  ======================================================= */

  const getPreviousDashboard = () => {
    const routerPrevious =
      location.state?.fromDashboard ||
      location.state?.previousDashboard ||
      location.state?.from;

    if (
      typeof routerPrevious === "string" &&
      routerPrevious.trim()
    ) {
      return routerPrevious.trim();
    }

    if (
      typeof window !== "undefined"
    ) {
      const sessionPrevious =
        sessionStorage.getItem(
          "revelacode_previous_dashboard"
        );

      if (
        sessionPrevious &&
        sessionPrevious.trim()
      ) {
        return sessionPrevious.trim();
      }

      const localPrevious =
        localStorage.getItem(
          "revelacode_previous_dashboard"
        );

      if (
        localPrevious &&
        localPrevious.trim()
      ) {
        return localPrevious.trim();
      }
    }

    return "";
  };

  const previousDashboard =
    getPreviousDashboard();

  const previousDashboardLabel =
    dashboardLabels[previousDashboard] ||
    (
      previousDashboard
        ? previousDashboard
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (char) =>
              char.toUpperCase()
            )
        : "Previous"
    );

  /* =======================================================
     GLOBAL BACK
     -------------------------------------------------------
     This exits the Bible dashboard entirely.
  ======================================================= */

  const handleGlobalBack = () => {
    /* -------------------------------------------------------
       Explicit callback from parent has highest priority.
       This is the cleanest option for dashboard shells.
    ------------------------------------------------------- */

    if (typeof onBack === "function") {
      onBack();
      return;
    }

    /* -------------------------------------------------------
       Router/dashboard state
    ------------------------------------------------------- */

    if (
      previousDashboard &&
      typeof onNavigate === "function"
    ) {
      onNavigate(previousDashboard);
      return;
    }

    /* -------------------------------------------------------
       Browser navigation fallback
    ------------------------------------------------------- */

    if (
      typeof window !== "undefined" &&
      window.history.length > 1
    ) {
      navigate(-1);
      return;
    }

    /* -------------------------------------------------------
       Final safe fallback.
    ------------------------------------------------------- */

    if (typeof onNavigate === "function") {
      onNavigate("faith");
    }
  };

  /* =======================================================
     LOAD OFFLINE BIBLE JSON
  ======================================================= */

  useEffect(() => {
    if (!selectedBookKey || selectedChapterIndex === null || !Array.isArray(verses) || !verses.length) return;
    try {
      localStorage.setItem(BIBLE_OFFLINE_CACHE_KEY, JSON.stringify({
        book: selectedBookKey,
        chapterIndex: selectedChapterIndex,
        verses,
        version: "KJV",
        savedAt: new Date().toISOString(),
      }));
    } catch {
      // The current chapter remains in the active session if device storage is full.
    }
  }, [selectedBookKey, selectedChapterIndex, verses, lastReadVerse]);

  useEffect(() => {
    let cancelled = false;

    const fetchBibleData = async () => {
      try {
        const response = await fetch(
          "/data/kjv.json",
          {
            cache: "force-cache",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Bible dataset failed: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (
          !data ||
          typeof data !== "object"
        ) {
          throw new Error(
            "Invalid Bible dataset."
          );
        }

        if (!cancelled) {
          setBibleData(data);
          setBookKeys(Object.keys(data));
          setSearchError("");
        }
      } catch (error) {
        console.error(
          "📖 Bible loading error:",
          error
        );

        if (!cancelled) {
          const cached = readCachedBibleChapter();
          if (cached) {
            setSelectedBookKey(cached.book || "");
            setSelectedChapterIndex(Number.isInteger(cached.chapterIndex) ? cached.chapterIndex : null);
            setVerses(Array.isArray(cached.verses) ? cached.verses : []);
            setViewLevel("chapter");
            setSearchError("Offline ready · Showing your last cached Bible chapter.");
          } else {
            setSearchError("The Bible text is not available offline yet. Open a chapter while connected to save it on this device.");
          }
        }
      }
    };

    fetchBibleData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     NORMALIZE BOOK NAME
  ======================================================= */

  const normalizeBookName = (name) => {
    const aliases = {
      jonh: "john",
      jhn: "john",
      gen: "genesis",
      exod: "exodus",
      lev: "leviticus",
      num: "numbers",
      deut: "deuteronomy",
      ps: "psalms",
      psa: "psalms",
      psalm: "psalms",
      "song of songs": "song of solomon",
      prov: "proverbs",
      matt: "matthew",
      mk: "mark",
      lk: "luke",
      jn: "john",
      acts: "acts",
      rom: "romans",
      rev: "revelation",
    };

    const normalized = String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    return (
      aliases[normalized] ||
      normalized
    );
  };

  /* =======================================================
     OPEN VERSE REFERENCE
  ======================================================= */

  const openVerseReference = async (reference) => {
    if (!reference || !bibleData || !bookKeys.length) return false;

    let cleanedReference = decodeURIComponent(reference)
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\bverses?\b/gi, ":")
      .replace(/\bvs\.?\b/gi, ":")
      .replace(/\s*:\s*/g, ":")
      .replace(/[–—]/g, "-")
      .replace(/\s*-\s*/g, "-");

    let match = cleanedReference.match(
      /^(.+?)\s+(\d+)(?::|\s+)(\d+)(?:-(\d+))?$/i
    );
    if (!match) {
      match = cleanedReference.match(/^(.+?)(\d+):(\d+)(?:-(\d+))?$/i);
    }
    if (!match) return false;

    const [, bookNameRaw, chapterNum, verseStart, verseEnd] = match;
    const normalizedBook = normalizeBookName(bookNameRaw);
    const bookKey = bookKeys.find((key) =>
      normalizeBookName(bibleData[key]?.book) === normalizedBook
    );
    if (!bookKey) return false;

    let selectedBookData = bibleVersion === "web"
      ? webData[bookKey]
      : bibleData[bookKey];

    if (bibleVersion === "web" && !selectedBookData) {
      setLoadingVersionBook(true);
      try {
        selectedBookData = await loadWebBibleBook(bookKey);
        setWebData((current) => ({ ...current, [bookKey]: selectedBookData }));
      } catch (error) {
        console.error("World English Bible reference load error:", error);
        setSearchError("World English Bible could not be loaded. Check your connection and try again; KJV remains available offline.");
        return false;
      } finally {
        setLoadingVersionBook(false);
      }
    }

    const chapterIndex = Number(chapterNum) - 1;
    const verseStartIndex = Number(verseStart) - 1;
    const verseEndIndex = verseEnd ? Number(verseEnd) - 1 : verseStartIndex;
    const chapter = selectedBookData?.chapters?.[chapterIndex];
    const versesArray = chapter?.verses || [];

    if (!chapter || !versesArray.length) return false;
    if (verseStartIndex < 0 || verseStartIndex >= versesArray.length) return false;
    if (verseEndIndex < verseStartIndex || verseEndIndex >= versesArray.length) return false;

    setSelectedBookKey(bookKey);
    setSelectedChapterIndex(chapterIndex);
    setVerses([...versesArray]);
    setViewLevel("verses");
    setHighlightedVerseRange({ start: verseStartIndex, end: verseEndIndex });
    setSearchError("");
    return true;
  };

  /* =======================================================
     SCROLL TO HIGHLIGHTED VERSE
  ======================================================= */

  useEffect(() => {
    if (
      !highlightedVerseRange ||
      viewLevel !== "verses"
    ) {
      return;
    }

    requestAnimationFrame(() => {
      const verseElement =
        verseRefs.current[
          highlightedVerseRange.start
        ];

      if (verseElement) {
        verseElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });
  }, [
    highlightedVerseRange,
    viewLevel,
    verses,
  ]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    setSearchError("");
    const success = await openVerseReference(searchInput.trim());
    if (!success && bibleVersion === "kjv") {
      setSearchError("❌ Verse not found. Example: John 3:16");
    }
  };

  /* =======================================================
     OPEN VERSE FROM URL
  ======================================================= */

  useEffect(() => {
    if (!bookKeys.length || !Object.keys(bibleData).length) return;

    const params = new URLSearchParams(location.search);
    const urlVerse = params.get("verse");
    let pendingVerse = "";
    try {
      pendingVerse = window.localStorage.getItem("revelacode_pending_bible_reference") || "";
    } catch {
      pendingVerse = "";
    }
    const verse = urlVerse || pendingVerse;
    if (!verse) return;

    let cancelled = false;
    const openFromUrl = async () => {
      const success = await openVerseReference(verse);
      if (success && !urlVerse) {
        try { window.localStorage.removeItem("revelacode_pending_bible_reference"); } catch {}
      }
      if (!cancelled && !success && bibleVersion === "kjv") {
        setSearchError("Reference not found. Try a reference such as John 3:16 or Daniel 7:1-8.");
      }
    };
    openFromUrl();

    return () => {
      cancelled = true;
    };
  }, [location.search, bookKeys, bibleData, bibleVersion]);


  /* =======================================================
     BOOK SELECTION
  ======================================================= */

  const handleBookClick = async (key) => {
    setSelectedBookKey(key);
    setSelectedChapterIndex(null);
    setVerses([]);
    setHighlightedVerseRange(null);
    setSearchError("");

    if (bibleVersion === "web") {
      setLoadingVersionBook(true);
      try {
        const book = await loadWebBibleBook(key);
        setWebData((current) => ({ ...current, [key]: book }));
      } catch (error) {
        console.error("World English Bible book load error:", error);
        setSearchError("Could not load the World English Bible book. Check your connection or switch back to KJV.");
        setViewLevel("books");
        return;
      } finally {
        setLoadingVersionBook(false);
      }
    }

    setViewLevel("chapters");
  };

  /* =======================================================
     CHAPTER SELECTION
  ======================================================= */

  const handleChapterClick = (
    index
  ) => {
    const selectedBookData =
      displayedBibleData[
        selectedBookKey
      ];

    const chapter =
      selectedBookData?.chapters?.[
        index
      ];

    if (!chapter) {
      return;
    }

    setSelectedChapterIndex(
      index
    );
    try { setChapterNote(localStorage.getItem("revelacode_bible_note_" + selectedBookKey + "_" + index) || ""); } catch { setChapterNote(""); }
    setSelectedVerse(null);

    setVerses(
      chapter.verses || []
    );

    setViewLevel(
      "verses"
    );

    setHighlightedVerseRange(
      null
    );

    setSearchError("");
  };

  /* =======================================================
     INTERNAL BIBLE BACK
     -------------------------------------------------------
     Verses -> Chapters
     Chapters -> Books
  ======================================================= */

  const handleBack = () => {
    setHighlightedVerseRange(
      null
    );

    setSearchError("");

    if (
      viewLevel === "verses"
    ) {
      setViewLevel(
        "chapters"
      );
      return;
    }

    if (
      viewLevel === "chapters"
    ) {
      setSelectedChapterIndex(
        null
      );
      setVerses([]);

      setViewLevel(
        "books"
      );
    }
  };

  /* =======================================================
     SELECTED BOOK
  ======================================================= */

  const selectedBook =
    displayedBibleData[
      selectedBookKey
    ];

  const currentReference = selectedBook && selectedChapterIndex !== null ? selectedBook.book + " " + (selectedChapterIndex + 1) : "Bible";
  const bookEntries = bookKeys.map(key => ({ key, name: displayedBibleData[key]?.book || key }));


  /* =======================================================
     SORT OLD TESTAMENT
  ======================================================= */

  const oldBooks =
    bookKeys
      .filter((key) =>
        oldTestament.includes(
          displayedBibleData[key]?.book
        )
      )
      .sort(
        (a, b) =>
          oldTestament.indexOf(
            displayedBibleData[a].book
          ) -
          oldTestament.indexOf(
            displayedBibleData[b].book
          )
      );

  /* =======================================================
     SORT NEW TESTAMENT
  ======================================================= */

  const newBooks =
    bookKeys
      .filter((key) =>
        newTestament.includes(
          displayedBibleData[key]?.book
        )
      )
      .sort(
        (a, b) =>
          newTestament.indexOf(
            displayedBibleData[a].book
          ) -
          newTestament.indexOf(
            displayedBibleData[b].book
          )
      );

  useEffect(() => {
    const handleSavedSource = (event) => {
      const entry = event?.detail;
      if (!entry || !/^https?:\/\//i.test(String(entry.url || ""))) return;
      setSourceView({ url: String(entry.url), title: String(entry.title || entry.url) });
    };
    window.addEventListener("revelacode:open-study-source", handleSavedSource);
    return () => window.removeEventListener("revelacode:open-study-source", handleSavedSource);
  }, []);

  /* =======================================================
     RENDER
  ======================================================= */

  if (sourceView) {
    return (
      <FaithWorkspaceLayout page="bible" title="Study reference" description="Read the selected source beside the biblical passage that led you here." contextData={{ reference: sourceView?.title || "Study reference", version: bibleVersion.toUpperCase() }} onOpenAI={onOpenAI} onBack={() => setSourceView(null)} onNavigate={onNavigate} onPrimaryAction={() => setSourceView(null)}>
      <div className="mx-auto w-full max-w-[1500px] space-y-4 p-3 sm:p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <BackButton label="Back to Bible" onClick={() => setSourceView(null)} />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-black text-gray-900 dark:text-white">Study reference</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Reference opened inside RevelaCode</p>
          </div>
        </div>
        <StudyResourceViewer source={sourceView} />
      </div>
      </FaithWorkspaceLayout>
    );
  }

  return (
    <FaithWorkspaceLayout page="bible" title="Bible" description="Read and study Scripture." contextData={{reference:currentReference,version:bibleVersion.toUpperCase()}} onOpenAI={onOpenAI} onNavigate={onNavigate} onBack={onBack || (() => onNavigate?.("faith"))} onPrimaryAction={() => selectedChapterIndex == null ? setViewLevel("books") : setViewLevel("chapter")} panel={false} showOfflineBanner={false} showHeader={false} showAskBar={false}>
      <main className="w-full min-w-0 space-y-3 overflow-x-clip pb-24">
        <header className="flex items-center justify-between gap-2 px-1 pt-1">
          <div className="flex min-w-0 items-center gap-2"><button type="button" aria-label="Back" onClick={viewLevel==="books"?handleGlobalBack:handleBack} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white"><ArrowLeft size={19}/></button><div className="min-w-0"><h1 className="text-lg font-black leading-6">Bible</h1><p className="truncate text-xs text-slate-500 dark:text-slate-400">Faith / Bible</p></div></div><button type="button" onClick={()=>setVersionSheet(true)} aria-label="Bible settings" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Settings size={18}/></button>
        </header>
        <ConnectivityPill state={online ? "online" : "offline"} offlineText="Offline · KJV saved" onClick={()=>setVerseActionsMessage("Your KJV text is available offline. Live study resources and RevelaAI require internet.")} ariaLabel="Offline. KJV saved. Tap for details."/>
        <AskBar online={online} onAsk={askBibleAI} placeholder="Ask RevelaAI about Scripture…" offlinePlaceholder="Ask AI (needs internet)" storageKey="revelacode_bible_saved_questions_v1"/>
        <SearchRow value={searchInput} onChange={e=>{setSearchInput(e.target.value);setSearchError("");}} onSearch={handleSearch} version={bibleVersion} onVersionChange={()=>setVersionSheet(true)} disabled={loadingVersionBook}/>
        {bibleVersion==="web" && <p className="px-1 text-xs leading-5 text-slate-500">WEB loads online; KJV remains offline. <button type="button" onClick={()=>setSourceView({url:"https://ebible.org/web/",title:"About the World English Bible"})} className="font-semibold underline">About WEB</button></p>}
        {loadingVersionBook && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">Loading text…</p>}
        {searchError && <p role="status" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">{searchError}</p>}
        {viewLevel==="books" && <><ContinueCard book={cachedBibleChapter?.book} chapter={cachedBibleChapter?.chapterIndex} verse={lastReadVerse} onResume={resumeReading}/><BookGrid testament={testament} books={bookEntries} onTestamentChange={setTestament} onBookSelect={key=>{handleBookClick(key);setChapterSheet(true);}}/></>}
        {viewLevel==="chapters" && selectedBook && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-2" role="dialog" aria-modal="true" aria-label="Select chapter" onClick={handleBack}><div className="max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950" onClick={e=>e.stopPropagation()}><div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700"/><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">{selectedBook.book}</h2><p className="text-xs text-slate-500">Choose a chapter</p></div><button type="button" onClick={handleBack} className="h-11 w-11 rounded-xl" aria-label="Close chapters"><X size={18}/></button></div><div className="grid grid-cols-5 gap-2 min-[390px]:grid-cols-6">{selectedBook.chapters.map((ch,idx)=><button key={idx} type="button" onClick={()=>{handleChapterClick(idx);setChapterSheet(false);}} className="aspect-square min-h-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold dark:border-slate-800 dark:bg-slate-900">{ch.chapter}</button>)}</div></div></div>}
        {viewLevel==="verses" && selectedBook && selectedBook.chapters[selectedChapterIndex] && <section className="space-y-3" onTouchStart={e=>{chapterSwipeStartX.current=e.touches?.[0]?.clientX;}} onTouchEnd={e=>{const x=e.changedTouches?.[0]?.clientX;const start=chapterSwipeStartX.current;if(typeof x==="number"&&typeof start==="number"&&Math.abs(x-start)>75)handleChapterClick(selectedChapterIndex+(x<start?1:-1));chapterSwipeStartX.current=null;}}>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"><div className="min-w-0"><h2 className="truncate text-base font-bold">{selectedBook.book} {selectedBook.chapters[selectedChapterIndex].chapter}</h2><p className="text-[0.7rem] text-slate-500">{bibleVersion==="kjv"?"King James Version · Offline":"World English Bible"}</p></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={()=>setTextSize(s=>Math.max(14,s-1))} className="min-h-11 min-w-11 rounded-lg border border-slate-200 text-sm font-bold dark:border-slate-800">A−</button><button type="button" onClick={()=>setTextSize(s=>Math.min(26,s+1))} className="min-h-11 min-w-11 rounded-lg border border-slate-200 text-sm font-bold dark:border-slate-800">A+</button></div></div>
          <article className="rounded-2xl border border-slate-200 bg-white px-3 py-4 dark:border-slate-800 dark:bg-slate-900"><div className="space-y-1.5 font-serif leading-relaxed" style={{fontSize:(textSize/16)+"rem"}}><div className="text-center text-xs font-sans text-slate-400">Chapter {selectedChapterIndex+1}</div>{verses.map((v,idx)=>{const active=selectedVerse?.verse===v.verse;const highlighted=highlightedVerseRange&&idx>=highlightedVerseRange.start&&idx<=highlightedVerseRange.end;return <button key={idx} ref={el=>verseRefs.current[idx]=el} type="button" onClick={()=>{setSelectedVerse(v);setLastReadVerse(v.verse);}} className={"block w-full rounded-lg px-1 py-1 text-left "+(active?"bg-indigo-50 dark:bg-indigo-950/40":highlighted?"bg-amber-50 dark:bg-amber-950/20":"")}><sup className="mr-1.5 align-super font-sans text-xs font-bold text-indigo-600 dark:text-indigo-300">{v.verse}</sup><span>{v.text}</span></button>})}</div></article>
          {selectedVerse&&<VerseToolbar verse={selectedVerse.verse} onAction={actOnVerse} onClose={()=>setSelectedVerse(null)}/>}
          <div className="space-y-2"><h3 className="text-sm font-bold">Study</h3><BibleStudyPanel tab={studyTab} onTabChange={setStudyTab} note={chapterNote} onNoteChange={setChapterNote} online={online}/></div>
          <button type="button" onClick={askAboutVerse} className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 text-xs font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300"><Sparkles size={15}/> Ask about this verse</button>
          <div className="grid grid-cols-2 gap-2"><button type="button" disabled={selectedChapterIndex<=0} onClick={()=>handleChapterClick(selectedChapterIndex-1)} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold disabled:opacity-40 dark:border-slate-800">← Previous</button><button type="button" disabled={selectedChapterIndex>=selectedBook.chapters.length-1} onClick={()=>handleChapterClick(selectedChapterIndex+1)} className="min-h-11 rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-40">Next chapter →</button></div>
        </section>}
        {verseActionsMessage&&<div role="status" className="fixed bottom-20 left-3 right-3 z-[60] flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-900"><span>{verseActionsMessage}</span><button type="button" onClick={()=>setVerseActionsMessage("")} aria-label="Dismiss" className="min-h-10 min-w-10"><X size={14}/></button></div>}
        {versionSheet&&<div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/40 p-2" role="dialog" aria-modal="true" aria-label="Bible version" onClick={()=>setVersionSheet(false)}><div className="w-full max-w-md rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950" onClick={e=>e.stopPropagation()}><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Bible version</h2><button onClick={()=>setVersionSheet(false)} className="min-h-11 min-w-11 rounded-xl" aria-label="Close version sheet"><X size={18}/></button></div><button type="button" onClick={()=>{changeVersion("kjv");setVersionSheet(false);}} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-800"><span><b>KJV</b><span className="ml-2 text-slate-500">King James Version · Offline</span></span>{bibleVersion==="kjv"&&<span className="text-indigo-600">✓</span>}</button><button type="button" onClick={()=>{changeVersion("web");setVersionSheet(false);}} className="mt-2 flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-800"><span><b>WEB</b><span className="ml-2 text-slate-500">World English Bible · Online</span></span>{bibleVersion==="web"&&<span className="text-indigo-600">✓</span>}</button></div></div>}
        {aiSheet&&<div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-2" role="dialog" aria-modal="true" aria-label="Question actions" onClick={()=>setAiSheet(false)}><div className="w-full max-w-md rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950" onClick={e=>e.stopPropagation()}><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Continue with RevelaAI</h2><button type="button" onClick={()=>setAiSheet(false)} className="min-h-11 min-w-11 rounded-xl" aria-label="Close AI actions"><X size={18}/></button></div><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">This is a deeper question. Open it in RevelaAI with Bible context or copy it for later.</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={()=>{setAiSheet(false);onOpenAI?.(window.__revelacodeBibleQuestion);}} className="min-h-11 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white">Open in RevelaAI</button><button type="button" onClick={()=>{const q=window.__revelacodeBibleQuestion?.question||"";navigator.clipboard?.writeText(q);setAiSheet(false);setVerseActionsMessage("Question copied.");}} className="min-h-11 rounded-xl border border-slate-200 px-3 text-xs font-bold dark:border-slate-800">Copy question</button></div></div></div>}
      
      </main>
    </FaithWorkspaceLayout>
  );
}
