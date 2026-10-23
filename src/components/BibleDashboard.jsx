// src/components/BibleDashboard.jsx

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { getCachedBibleBook, saveCachedBibleBook } from "./study/studyMaterialCache.js";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

const dashboardLabels = {
  home: "Home",
  faith: "Faith",
  education: "Education",
  shamba: "Shamba",
  biashara: "Biashara",
  community: "Community",
  events: "Events",
  prophecy: "Prophecy",
  referential: "Referential",
  profile: "Profile",
  settings: "Settings",
};

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

/* =========================================================
   GLOBAL BIBLE DASHBOARD
========================================================= */

export default function BibleDashboard({
  onNavigate,
  onBack,
}) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [bibleData, setBibleData] = useState({});
  const [webData, setWebData] = useState({});
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
    useState("");
  const [selectedChapterIndex, setSelectedChapterIndex] =
    useState(null);
  const [verses, setVerses] = useState([]);
  const [viewLevel, setViewLevel] = useState("books");
  const [searchInput, setSearchInput] = useState("");
  const [highlightedVerseRange, setHighlightedVerseRange] =
    useState(null);
  const [searchError, setSearchError] =
    useState("");

  const verseRefs = useRef({});
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

  const displayName =
    user?.fullName?.trim() ||
    user?.name?.trim() ||
    user?.username?.trim() ||
    "Guest";

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
          setSearchError(
            "Unable to load the Bible dataset. Please refresh the page."
          );
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

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        w-full
        max-w-full
        min-w-0
        space-y-4
        p-3
        sm:p-4
      "
    >
      {/* =====================================================
          GLOBAL BACK / BIBLE HEADER
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-3
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-900
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-4
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          <BackButton
            label={
              previousDashboard
                ? `Back to ${previousDashboardLabel}`
                : "Back"
            }
            onClick={
              handleGlobalBack
            }
            title={
              previousDashboard
                ? `Return to ${previousDashboardLabel}`
                : "Return to the previous dashboard"
            }
            className="
              shrink-0
            "
          />

          <div
            className="
              hidden
              min-w-0
              sm:block
            "
          >
            <p
              className="
                truncate
                text-xs
                font-semibold
                uppercase
                tracking-[0.12em]
                text-gray-400
                dark:text-gray-500
              "
            >
              Faith
            </p>

            <h1
              className="
                truncate
                text-base
                font-black
                text-gray-900
                dark:text-white
              "
            >
              Bible
            </h1>
          </div>
        </div>

        <div
          className="
            hidden
            text-right
            text-xs
            text-gray-500
            dark:text-gray-400
            md:block
          "
        >
          Welcome,{" "}
          <span
            className="
              font-semibold
              text-gray-700
              dark:text-gray-200
            "
          >
            {displayName}
          </span>
        </div>
      </div>

      {/* =====================================================
          SEARCH BAR
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-2
          sm:flex-row
        "
      >
        <input
          type="text"
          placeholder="🔍 e.g. John 3:16, John 1:1-3, John 3vs5"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(
              e.target.value
            );
            setSearchError("");
          }}
          onKeyDown={(e) => {
            if (
              e.key === "Enter"
            ) {
              handleSearch();
            }
          }}
          className="
            min-w-0
            flex-1
            rounded-lg
            border
            border-gray-300
            bg-white
            p-2.5
            text-gray-900
            outline-none
            transition
            focus:ring-2
            focus:ring-blue-500
            dark:border-gray-700
            dark:bg-gray-900
            dark:text-white
          "
        />

        <button
          type="button"
          onClick={
            handleSearch
          }
          disabled={
            !searchInput.trim()
          }
          className="
            w-full
            rounded-lg
            bg-blue-600
            px-4
            py-2
            text-white
            transition
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:w-auto
          "
        >
          Search
        </button>

        <label className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:w-auto">
          <span className="shrink-0">Version</span>
          <select
            aria-label="Bible version"
            value={bibleVersion}
            onChange={handleBibleVersionChange}
            disabled={loadingVersionBook}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none disabled:opacity-60 sm:w-48"
          >
            <option value="kjv">KJV · King James Version (offline)</option>
            <option value="web">WEB · World English Bible (online)</option>
          </select>
        </label>
      </div>

      {/* =====================================================
          SEARCH ERROR
      ===================================================== */}

      {bibleVersion === "web" && (
        <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
          World English Bible · loads one book at a time and uses browser caching. The KJV remains available offline.
          {" "}<a href="https://ebible.org/web/" target="_blank" rel="noreferrer" className="font-semibold text-blue-600 underline dark:text-blue-400">About the WEB text</a>
        </p>
      )}
      {loadingVersionBook && (
        <div role="status" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
          Loading {bibleVersion === "web" ? "World English Bible" : "Bible"} book…
        </div>
      )}
      {searchError && (
        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
            dark:border-red-900/40
            dark:bg-red-950/20
            dark:text-red-300
          "
        >
          {searchError}
        </div>
      )}

      {/* =====================================================
          BIBLE HOME / BOOKS
      ===================================================== */}

      {viewLevel === "books" && (
        <div className="space-y-8">
          {/* Bible Header */}

          <div
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              dark:border-gray-800
              dark:bg-gray-900
              sm:p-6
            "
          >
            <div
              className="
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-end
                sm:justify-between
              "
            >
              <div>
                <h2
                  className="
                    text-2xl
                    font-bold
                    text-gray-900
                    dark:text-white
                  "
                >
                  📖 Bible
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Choose a book to begin reading
                  Scripture.
                </p>
              </div>

              <span
                className="
                  w-fit
                  rounded-full
                  bg-gray-100
                  px-3
                  py-1.5
                  text-xs
                  font-bold
                  text-gray-600
                  dark:bg-gray-800
                  dark:text-gray-300
                "
              >
                {bookKeys.length} books
              </span>
            </div>
          </div>

          {/* =================================================
              OLD TESTAMENT
          ================================================= */}

          <section>
            <div className="mb-4">
              <h3
                className="
                  text-lg
                  font-bold
                  text-gray-900
                  dark:text-white
                "
              >
                📜 Old Testament
              </h3>

              <p
                className="
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                "
              >
                {oldBooks.length} books
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-1
                gap-3
                min-[420px]:grid-cols-2
                md:grid-cols-3
                lg:grid-cols-4
                xl:grid-cols-5
              "
            >
              {oldBooks.map(
                (
                  key,
                  index
                ) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      handleBookClick(
                        key
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      p-4
                      text-left
                      transition
                      hover:border-blue-500
                      hover:bg-blue-50
                      active:scale-[0.98]
                      dark:border-gray-800
                      dark:bg-gray-900
                      dark:hover:bg-blue-950
                    "
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-blue-100
                          text-sm
                          font-bold
                          text-blue-700
                          dark:bg-blue-900
                          dark:text-blue-300
                        "
                      >
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <div
                          className="
                            truncate
                            font-semibold
                            text-gray-900
                            dark:text-white
                          "
                        >
                          {
                            displayedBibleData[
                              key
                            ]?.book
                          }
                        </div>

                        <div
                          className="
                            text-xs
                            text-gray-500
                            dark:text-gray-400
                          "
                        >
                          {
                            displayedBibleData[
                              key
                            ]?.chapters
                              ?.length ||
                            0
                          }{" "}
                          chapters
                        </div>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          </section>

          {/* =================================================
              NEW TESTAMENT
          ================================================= */}

          <section>
            <div className="mb-4">
              <h3
                className="
                  text-lg
                  font-bold
                  text-gray-900
                  dark:text-white
                "
              >
                ✝️ New Testament
              </h3>

              <p
                className="
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                "
              >
                {newBooks.length} books
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-1
                gap-3
                min-[420px]:grid-cols-2
                md:grid-cols-3
                lg:grid-cols-4
                xl:grid-cols-5
              "
            >
              {newBooks.map(
                (
                  key,
                  index
                ) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      handleBookClick(
                        key
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      p-4
                      text-left
                      transition
                      hover:border-green-500
                      hover:bg-green-50
                      active:scale-[0.98]
                      dark:border-gray-800
                      dark:bg-gray-900
                      dark:hover:bg-green-950
                    "
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-green-100
                          text-sm
                          font-bold
                          text-green-700
                          dark:bg-green-900
                          dark:text-green-300
                        "
                      >
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <div
                          className="
                            truncate
                            font-semibold
                            text-gray-900
                            dark:text-white
                          "
                        >
                          {
                            displayedBibleData[
                              key
                            ]?.book
                          }
                        </div>

                        <div
                          className="
                            text-xs
                            text-gray-500
                            dark:text-gray-400
                          "
                        >
                          {
                            displayedBibleData[
                              key
                            ]?.chapters
                              ?.length ||
                            0
                          }{" "}
                          chapters
                        </div>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================
          CHAPTERS
      ===================================================== */}

      {viewLevel === "chapters" &&
        selectedBook && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-6 space-y-3">
                <BackButton
                  label="Books"
                  onClick={
                    handleBack
                  }
                />

                <div>
                  <h3
                    className="
                      text-xl
                      font-bold
                      text-gray-900
                      dark:text-white
                      sm:text-2xl
                    "
                  >
                    📘{" "}
                    {selectedBook.book}
                  </h3>

                  <p
                    className="
                      text-sm
                      text-gray-500
                      dark:text-gray-400
                    "
                  >
                    Select a chapter
                  </p>
                </div>
              </div>

              <div
                className="
                  grid
                  grid-cols-5
                  gap-2
                  min-[420px]:grid-cols-6
                  sm:grid-cols-8
                  md:grid-cols-10
                  lg:grid-cols-12
                "
              >
                {selectedBook.chapters.map(
                  (
                    chapter,
                    idx
                  ) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        handleChapterClick(
                          idx
                        )
                      }
                      className="
                        aspect-square
                        rounded-lg
                        border
                        border-gray-200
                        bg-gray-100
                        font-semibold
                        text-gray-800
                        transition
                        hover:bg-blue-600
                        hover:text-white
                        dark:border-gray-700
                        dark:bg-gray-800
                        dark:text-white
                      "
                    >
                      {chapter.chapter}
                    </button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* =====================================================
          VERSES
      ===================================================== */}

      {viewLevel === "verses" &&
        selectedBook &&
        selectedBook.chapters[
          selectedChapterIndex
        ] && (
          <Card>
            <CardContent className="p-0">
              {/* Verse Header */}

              <div
                className="
                  sticky
                  top-0
                  z-10
                  flex
                  items-center
                  justify-between
                  gap-2
                  border-b
                  border-gray-200
                  bg-white/95
                  px-3
                  py-3
                  backdrop-blur
                  dark:border-gray-800
                  dark:bg-gray-900/95
                  sm:px-5
                "
              >
                <BackButton
                  label="Chapters"
                  onClick={
                    handleBack
                  }
                />

                <h4
                  className="
                    min-w-0
                    truncate
                    text-sm
                    font-semibold
                    text-gray-900
                    dark:text-white
                    sm:text-base
                  "
                >
                  {selectedBook.book}{" "}
                  {
                    selectedBook
                      .chapters[
                      selectedChapterIndex
                    ].chapter
                  }
                </h4>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleChapterClick(
                        selectedChapterIndex -
                          1
                      )
                    }
                    disabled={
                      selectedChapterIndex ===
                      0
                    }
                    aria-label="Previous chapter"
                    className="
                      rounded-lg
                      p-1.5
                      text-gray-600
                      transition
                      hover:bg-gray-100
                      disabled:opacity-30
                      dark:text-gray-300
                      dark:hover:bg-gray-800
                    "
                  >
                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleChapterClick(
                        selectedChapterIndex +
                          1
                      )
                    }
                    disabled={
                      selectedChapterIndex >=
                      selectedBook.chapters
                        .length -
                        1
                    }
                    aria-label="Next chapter"
                    className="
                      rounded-lg
                      p-1.5
                      text-gray-600
                      transition
                      hover:bg-gray-100
                      disabled:opacity-30
                      dark:text-gray-300
                      dark:hover:bg-gray-800
                    "
                  >
                    <ChevronRight
                      size={18}
                    />
                  </button>
                </div>
              </div>

              {/* Verses */}

              <div className="py-2">
                {verses.map(
                  (
                    v,
                    idx
                  ) => {
                    const isHighlighted =
                      highlightedVerseRange &&
                      idx >=
                        highlightedVerseRange.start &&
                      idx <=
                        highlightedVerseRange.end;

                    return (
                      <div
                        key={idx}
                        id={`verse-${idx}`}
                        ref={(el) => {
                          verseRefs.current[
                            idx
                          ] = el;
                        }}
                        className={`
                          border-l-4
                          px-4
                          py-3
                          text-sm
                          leading-7
                          transition-colors
                          sm:px-6
                          sm:py-3.5
                          sm:text-base
                          ${
                            isHighlighted
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-400/10"
                              : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/60"
                          }
                        `}
                      >
                        <sup
                          className={`
                            mr-1.5
                            text-xs
                            font-bold
                            ${
                              isHighlighted
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-gray-400 dark:text-gray-500"
                            }
                          `}
                        >
                          {v.verse}
                        </sup>

                        <span
                          className="
                            text-gray-800
                            dark:text-gray-100
                          "
                        >
                          {v.text}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}