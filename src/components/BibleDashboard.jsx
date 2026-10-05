// src/components/BibleDashboard.jsx

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
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

  const openVerseReference = (
    reference
  ) => {
    if (
      !reference ||
      !bibleData ||
      !bookKeys.length
    ) {
      return false;
    }

    let cleanedReference =
      decodeURIComponent(
        reference
      )
        .trim()
        .replace(/\s+/g, " ");

    /*
      Accept formats like:

      John 3:16
      John 3:16-18
      John 1:1-1
      John 3vs5
      John 3 vs 5
      John 3 verse 5
      John 3 5
      Jonh 3vs5
    */

    cleanedReference = cleanedReference
      .replace(
        /\bverses?\b/gi,
        ":"
      )
      .replace(
        /\bvs\.?\b/gi,
        ":"
      )
      .replace(
        /\s*:\s*/g,
        ":"
      )
      .replace(
        /\s*-\s*/g,
        "-"
      );

    /*
      Match:

      Book + chapter + verse + optional range
    */

    let match =
      cleanedReference.match(
        /^(.+?)\s+(\d+)(?::|\s+)(\d+)(?:-(\d+))?$/i
      );

    /*
      Also support:

      John3:16
      1John3:16
    */

    if (!match) {
      match =
        cleanedReference.match(
          /^(.+?)(\d+):(\d+)(?:-(\d+))?$/i
        );
    }

    if (!match) {
      return false;
    }

    const [
      ,
      bookNameRaw,
      chapterNum,
      verseStart,
      verseEnd,
    ] = match;

    const normalizedBook =
      normalizeBookName(
        bookNameRaw
      );

    const bookKey =
      bookKeys.find((key) => {
        const bookName =
          bibleData[key]?.book;

        if (!bookName) {
          return false;
        }

        return (
          normalizeBookName(
            bookName
          ) === normalizedBook
        );
      });

    if (!bookKey) {
      return false;
    }

    const chapterIndex =
      Number(chapterNum) - 1;

    const verseStartIndex =
      Number(verseStart) - 1;

    const verseEndIndex = verseEnd
      ? Number(verseEnd) - 1
      : verseStartIndex;

    const chapters =
      bibleData[bookKey]?.chapters ||
      [];

    const chapter =
      chapters[chapterIndex];

    if (!chapter) {
      return false;
    }

    const versesArray =
      chapter.verses || [];

    if (!versesArray.length) {
      return false;
    }

    if (
      verseStartIndex < 0 ||
      verseStartIndex >=
        versesArray.length
    ) {
      return false;
    }

    if (
      verseEndIndex <
        verseStartIndex ||
      verseEndIndex >=
        versesArray.length
    ) {
      return false;
    }

    setSelectedBookKey(
      bookKey
    );

    setSelectedChapterIndex(
      chapterIndex
    );

    setVerses([
      ...versesArray,
    ]);

    setViewLevel(
      "verses"
    );

    setHighlightedVerseRange({
      start: verseStartIndex,
      end: verseEndIndex,
    });

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

  const handleSearch = () => {
    if (!searchInput.trim()) {
      return;
    }

    setSearchError("");

    const success =
      openVerseReference(
        searchInput.trim()
      );

    if (!success) {
      setSearchError(
        "❌ Verse not found. Example: John 3:16"
      );
    }
  };

  /* =======================================================
     OPEN VERSE FROM URL
  ======================================================= */

  useEffect(() => {
    if (
      !bookKeys.length ||
      !Object.keys(bibleData).length
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        location.search
      );

    const verse =
      params.get("verse");

    if (!verse) {
      return;
    }

    const success =
      openVerseReference(
        verse
      );

    if (!success) {
      setSearchError(
        "❌ Reference not found. Try formats like John 3:16, John 1:1-3, John 3vs5, or Jonh 3vs5."
      );
    }
  }, [
    location.search,
    bookKeys,
    bibleData,
  ]);

  /* =======================================================
     ASK REVELAAI
  ======================================================= */

  const askAI = async () => {
    const prompt =
      searchInput.trim();

    if (!prompt) {
      return;
    }

    const aiBaseUrl =
      import.meta.env
        .VITE_REVELAAI_URL;

    if (!aiBaseUrl) {
      alert(
        "RevelaAI is not configured in this environment."
      );
      return;
    }

    try {
      const response =
        await fetch(
          `${aiBaseUrl.replace(
            /\/$/,
            ""
          )}/ai`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message: prompt,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          `AI request failed: ${response.status}`
        );
      }

      const data =
        await response.json();

      const content =
        data?.data?.content ||
        data?.content ||
        data?.message ||
        "RevelaAI returned no response.";

      alert(
        `🤖 RevelaAI says:\n${content}`
      );
    } catch (error) {
      console.error(
        "❌ AI request failed:",
        error
      );

      alert(
        "RevelaAI could not be reached right now. Please try again."
      );
    }
  };

  /* =======================================================
     BOOK SELECTION
  ======================================================= */

  const handleBookClick = (
    key
  ) => {
    setSelectedBookKey(
      key
    );

    setSelectedChapterIndex(
      null
    );

    setVerses([]);

    setViewLevel(
      "chapters"
    );

    setHighlightedVerseRange(
      null
    );

    setSearchError("");
  };

  /* =======================================================
     CHAPTER SELECTION
  ======================================================= */

  const handleChapterClick = (
    index
  ) => {
    const selectedBookData =
      bibleData[
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
    bibleData[
      selectedBookKey
    ];

  /* =======================================================
     SORT OLD TESTAMENT
  ======================================================= */

  const oldBooks =
    bookKeys
      .filter((key) =>
        oldTestament.includes(
          bibleData[key]?.book
        )
      )
      .sort(
        (a, b) =>
          oldTestament.indexOf(
            bibleData[a].book
          ) -
          oldTestament.indexOf(
            bibleData[b].book
          )
      );

  /* =======================================================
     SORT NEW TESTAMENT
  ======================================================= */

  const newBooks =
    bookKeys
      .filter((key) =>
        newTestament.includes(
          bibleData[key]?.book
        )
      )
      .sort(
        (a, b) =>
          newTestament.indexOf(
            bibleData[a].book
          ) -
          newTestament.indexOf(
            bibleData[b].book
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

        <button
          type="button"
          onClick={
            askAI
          }
          disabled={
            !searchInput.trim()
          }
          className="
            w-full
            rounded-lg
            bg-green-600
            px-4
            py-2
            text-white
            transition
            hover:bg-green-700
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:w-auto
          "
        >
          Ask RevelaAI
        </button>
      </div>

      {/* =====================================================
          SEARCH ERROR
      ===================================================== */}

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
                            bibleData[
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
                            bibleData[
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
                            bibleData[
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
                            bibleData[
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