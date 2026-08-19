// src/components/ProphecyDashboard.jsx

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { useHistory } from "@/context/HistoryContext";

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  History,
  Info,
  Landmark,
  Layers3,
  Lightbulb,
  Link2,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const REVELAAI_URL =
  import.meta.env.VITE_REVELAAI_URL;

const PROPHECY_DECODE_ENDPOINT =
  `${API_URL}/api/prophecy/decode`;

/* =========================================================
   HELPERS
========================================================= */

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const cleanUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "";
  }

  const markdownMatch = url.match(
    /^\[.*?\]\((https?:\/\/[^)]+)\)$/
  );

  if (markdownMatch) {
    return markdownMatch[1];
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return "";
};

const titleCase = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const safeObject = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value)
    ? value
    : {};

/* =========================================================
   SAFE DATA NORMALIZATION
========================================================= */

const normalizeDecodedArray = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((entry) => {
    if (
      !entry ||
      typeof entry !== "object"
    ) {
      return [];
    }

    /* Already normalized */

    if (
      entry.symbol &&
      entry.data &&
      typeof entry.data === "object" &&
      !Array.isArray(entry.data)
    ) {
      return [
        {
          symbol: entry.symbol,
          data: entry.data,
        },
      ];
    }

    /* { "666": {...} } */

    const nestedEntries =
      Object.entries(entry);

    const symbolEntries =
      nestedEntries.filter(
        ([, value]) =>
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          (
            value.symbol ||
            value.title ||
            value.summary ||
            value.primary_reference ||
            value.primaryReference
          )
      );

    if (symbolEntries.length > 0) {
      return symbolEntries.map(
        ([symbol, data]) => ({
          symbol,
          data,
        })
      );
    }

    /* Direct prophecy */

    if (
      entry.symbol ||
      entry.title ||
      entry.summary ||
      entry.primary_reference ||
      entry.primaryReference
    ) {
      return [
        {
          symbol:
            entry.symbol ||
            entry.title ||
            "Prophecy",
          data: entry,
        },
      ];
    }

    return [];
  });
};

const normalizeDecoded = (
  result,
  query = ""
) => {
  if (!result) {
    return [];
  }

  const normalizedQuery =
    normalizeText(query);

  /* Full dataset */

  if (
    result.symbols &&
    typeof result.symbols === "object" &&
    !Array.isArray(result.symbols)
  ) {
    const entries = Object.entries(
      result.symbols
    );

    if (!normalizedQuery) {
      return entries.map(
        ([symbol, data]) => ({
          symbol,
          data: data || {},
        })
      );
    }

    const matching = entries.filter(
      ([symbol, data]) => {
        const normalizedSymbol =
          normalizeText(symbol);

        const normalizedDataSymbol =
          normalizeText(data?.symbol);

        const normalizedTitle =
          normalizeText(data?.title);

        const normalizedReference =
          normalizeText(
            data?.primary_reference
          );

        const normalizedSummary =
          normalizeText(
            data?.summary
          );

        return (
          normalizedSymbol === normalizedQuery ||
          normalizedDataSymbol === normalizedQuery ||
          normalizedTitle === normalizedQuery ||
          normalizedSymbol.includes(normalizedQuery) ||
          normalizedTitle.includes(normalizedQuery) ||
          normalizedReference.includes(normalizedQuery) ||
          normalizedSummary.includes(normalizedQuery)
        );
      }
    );

    return matching.map(
      ([symbol, data]) => ({
        symbol,
        data: data || {},
      })
    );
  }

  /* decoded */

  if (Array.isArray(result.decoded)) {
    return normalizeDecodedArray(
      result.decoded
    );
  }

  /* data.decoded */

  if (
    Array.isArray(
      result?.data?.decoded
    )
  ) {
    return normalizeDecodedArray(
      result.data.decoded
    );
  }

  /* data array */

  if (Array.isArray(result?.data)) {
    return normalizeDecodedArray(
      result.data
    );
  }

  /* direct object */

  if (
    typeof result === "object" &&
    !Array.isArray(result) &&
    (
      result.symbol ||
      result.title ||
      result.summary ||
      result.primary_reference ||
      result.primaryReference
    )
  ) {
    return [
      {
        symbol:
          result.symbol ||
          result.title ||
          "Prophecy",
        data: result,
      },
    ];
  }

  /* keyed symbol object */

  if (
    typeof result === "object" &&
    !Array.isArray(result)
  ) {
    const entries =
      Object.entries(result);

    const valid =
      entries.filter(
        ([, value]) =>
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          (
            value.symbol ||
            value.title ||
            value.summary ||
            value.primary_reference ||
            value.primaryReference
          )
      );

    if (valid.length > 0) {
      return valid.map(
        ([symbol, data]) => ({
          symbol,
          data,
        })
      );
    }
  }

  if (Array.isArray(result)) {
    return normalizeDecodedArray(
      result
    );
  }

  return [];
};

/* =========================================================
   STATUS
========================================================= */

const getStatusConfig = (status) => {
  const normalized =
    String(status || "unknown")
      .toLowerCase()
      .replace(/\s+/g, "_");

  const configs = {
    debated: {
      label: "Debated",
      icon: AlertTriangle,
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    },

    future: {
      label: "Future",
      icon: Clock3,
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    },

    ongoing: {
      label: "Ongoing",
      icon: Clock3,
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
    },

    fulfilled: {
      label: "Fulfilled",
      icon: CheckCircle2,
      className:
        "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
    },

    interpretive_association: {
      label: "Interpretive",
      icon: Brain,
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    },

    historical_and_interpretive: {
      label: "Historical + Interpretive",
      icon: Brain,
      className:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
    },

    textually_defined: {
      label: "Textually Defined",
      icon: CheckCircle2,
      className:
        "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
    },

    theological: {
      label: "Theological",
      icon: Brain,
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
    },

    interpreted: {
      label: "Interpreted",
      icon: Brain,
      className:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
    },
  };

  return (
    configs[normalized] || {
      label:
        titleCase(normalized) ||
        "Unknown",
      icon: Info,
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    }
  );
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SectionHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            bg-gray-100
            text-gray-600
            dark:bg-gray-800
            dark:text-gray-300
          "
        >
          <Icon size={17} />
        </div>

        <h3
          className="
            text-sm
            font-black
            text-gray-900
            dark:text-white
          "
        >
          {title}
        </h3>
      </div>

      {description && (
        <p
          className="
            mt-2
            text-xs
            leading-5
            text-gray-500
            dark:text-gray-400
          "
        >
          {description}
        </p>
      )}
    </div>
  );
}

function Pill({
  children,
  className = "",
}) {
  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-2.5
        py-1.5
        text-[11px]
        font-bold
        ${className}
      `}
    >
      {children}
    </span>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
}) {
  if (!value) {
    return null;
  }

  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        bg-gray-50
        p-3
        dark:border-gray-800
        dark:bg-gray-900
      "
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon
            size={14}
            className="text-gray-400"
          />
        )}

        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-wider
            text-gray-400
          "
        >
          {label}
        </p>
      </div>

      <p
        className="
          mt-1
          text-sm
          font-semibold
          leading-6
          text-gray-900
          dark:text-white
        "
      >
        {value}
      </p>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  children,
  open,
  onToggle,
}) {
  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        dark:border-gray-800
        dark:bg-gray-950
      "
    >
      <button
        type="button"
        onClick={onToggle}
        className="
          flex
          w-full
          items-center
          justify-between
          gap-3
          px-4
          py-4
          text-left
          transition
          hover:bg-gray-50
          dark:hover:bg-gray-900
          sm:px-5
        "
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-gray-100
              text-gray-600
              dark:bg-gray-800
              dark:text-gray-300
            "
          >
            <Icon size={17} />
          </span>

          <span
            className="
              truncate
              text-sm
              font-black
              text-gray-900
              dark:text-white
            "
          >
            {title}
          </span>
        </span>

        {open ? (
          <ChevronUp
            size={17}
            className="shrink-0 text-gray-400"
          />
        ) : (
          <ChevronDown
            size={17}
            className="shrink-0 text-gray-400"
          />
        )}
      </button>

      {open && (
        <div
          className="
            border-t
            border-gray-100
            px-4
            py-5
            dark:border-gray-800
            sm:px-5
          "
        >
          {children}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function ProphecyDashboard() {
  const { isGuest } = useAuth();
  const { addProphecyHistory } = useHistory();

  const [searchInput, setSearchInput] =
    useState("");

  const [decodedData, setDecodedData] =
    useState([]);

  const [timestamp, setTimestamp] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [guestDecodeCount, setGuestDecodeCount] =
    useState(0);

  const [copiedKey, setCopiedKey] =
    useState("");

  const [aiInsight, setAiInsight] =
    useState("");

  const [isDark, setIsDark] =
    useState(() =>
      document.documentElement.classList.contains(
        "dark"
      )
    );

  const [openSections, setOpenSections] =
    useState({});

  /* =======================================================
     THEME
  ======================================================= */

  useEffect(() => {
    const root =
      document.documentElement;

    const updateTheme = () => {
      setIsDark(
        root.classList.contains("dark")
      );
    };

    updateTheme();

    const observer =
      new MutationObserver(
        updateTheme
      );

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () =>
      observer.disconnect();
  }, []);

  /* =======================================================
     GUEST COUNT
  ======================================================= */

  useEffect(() => {
    try {
      const stored =
        Number(
          localStorage.getItem(
            "guestDecodeCount"
          ) || 0
        );

      if (Number.isFinite(stored)) {
        setGuestDecodeCount(stored);
      }
    } catch (error) {
      console.error(
        "Failed to load guest decode count:",
        error
      );
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "guestDecodeCount",
        String(guestDecodeCount)
      );
    } catch (error) {
      console.error(
        "Failed to save guest decode count:",
        error
      );
    }
  }, [guestDecodeCount]);

  /* =======================================================
     AI INSIGHT
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadInsight = async () => {
      try {
        if (!REVELAAI_URL) {
          setAiInsight(
            "Explore a prophecy to examine its biblical context, interpretations, evidence, and related symbols."
          );
          return;
        }

        const response =
          await fetch(
            `${REVELAAI_URL}/daily-insights`
          );

        if (!response.ok) {
          throw new Error(
            `AI request failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        if (!cancelled) {
          setAiInsight(
            data?.insight ||
              "Explore a prophecy to examine its biblical context, interpretations, evidence, and related symbols."
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch AI insight:",
          error
        );

        if (!cancelled) {
          setAiInsight(
            "Explore a prophecy to examine its biblical context, interpretations, evidence, and related symbols."
          );
        }
      }
    };

    loadInsight();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     SECTION MANAGEMENT
  ======================================================= */

  const toggleSection = useCallback(
    (key) => {
      setOpenSections((current) => ({
        ...current,
        [key]: !current[key],
      }));
    },
    []
  );

  const shouldOpen = useCallback(
    (key, fallback = false) =>
      openSections[key] ??
      fallback,
    [openSections]
  );

  /* =======================================================
     DECODE
  ======================================================= */

  const handleDecode = useCallback(
    async (override = null) => {
      const query = String(
        override ?? searchInput ?? ""
      ).trim();

      if (!query) {
        return;
      }

      if (
        isGuest &&
        guestDecodeCount >= 5
      ) {
        window.alert(
          "Guest limit reached: 5 prophecy decodes per day."
        );
        return;
      }

      setLoading(true);
      setDecodedData([]);
      setTimestamp("");
      setCopiedKey("");
      setOpenSections({});

      try {
        if (!API_URL) {
          throw new Error(
            "VITE_API_URL is not configured."
          );
        }

        const response =
          await fetch(
            PROPHECY_DECODE_ENDPOINT,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                verse: query,
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          setDecodedData([
            {
              message:
                data?.message ||
                `Decode failed (HTTP ${response.status}).`,
            },
          ]);
          return;
        }

        const normalized =
          normalizeDecoded(
            data,
            query
          );

        const validated =
          normalized.filter(
            (entry) =>
              entry &&
              typeof entry === "object" &&
              entry.symbol &&
              entry.data &&
              typeof entry.data === "object"
          );

        if (!validated.length) {
          setDecodedData([
            {
              message:
                `No verified prophecy record matched "${query}".`,
            },
          ]);
          return;
        }

        const results = isGuest
          ? validated.slice(0, 5)
          : validated;

        setDecodedData(results);

        const now =
          new Date().toLocaleString();

        setTimestamp(now);

        if (
          !isGuest &&
          addProphecyHistory
        ) {
          await addProphecyHistory({
            query,
            results,
            timestamp: now,
          });
        }

        if (isGuest) {
          setGuestDecodeCount(
            (current) => current + 1
          );
        }

        requestAnimationFrame(() => {
          document
            .getElementById(
              "prophecy-results"
            )
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
        });
      } catch (error) {
        console.error(
          "Prophecy decode failed:",
          error
        );

        setDecodedData([
          {
            message:
              error?.message ||
              "Server error. Please try again later.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      searchInput,
      isGuest,
      guestDecodeCount,
      addProphecyHistory,
    ]
  );

  const triggerDecode = useCallback(
    (value) => {
      const cleaned =
        String(value || "").trim();

      if (!cleaned) {
        return;
      }

      setSearchInput(cleaned);

      requestAnimationFrame(() => {
        handleDecode(cleaned);
      });
    },
    [handleDecode]
  );

  const handleSearchKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleDecode();
    }
  };

  /* =======================================================
     COPY
  ======================================================= */

  const handleCopy = async (
    key,
    value
  ) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        typeof value === "string"
          ? value
          : JSON.stringify(
              value,
              null,
              2
            )
      );

      setCopiedKey(key);

      window.setTimeout(() => {
        setCopiedKey("");
      }, 1800);
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  };

  /* =======================================================
     QUICK SEARCHES
  ======================================================= */

  const quickSearches =
    useMemo(
      () => [
        {
          label: "666",
          description:
            "Number of the beast",
        },
        {
          label: "beast",
          description:
            "Beast from the sea",
        },
        {
          label: "dragon",
          description:
            "Dragon in Revelation",
        },
        {
          label: "false prophet",
          description:
            "Second beast / false prophet",
        },
        {
          label: "mark of the beast",
          description:
            "Worship, allegiance and commerce",
        },
      ],
      []
    );

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  const renderEmptyState = () => (
    <div
      className="
        px-4
        py-14
        text-center
        sm:px-8
        sm:py-20
      "
    >
      <div
        className="
          mx-auto
          flex
          h-20
          w-20
          items-center
          justify-center
          rounded-3xl
          bg-gradient-to-br
          from-purple-100
          to-indigo-100
          text-purple-600
          dark:from-purple-950
          dark:to-indigo-950
          dark:text-purple-300
        "
      >
        <Sparkles size={32} />
      </div>

      <h2
        className="
          mt-6
          text-2xl
          font-black
          tracking-tight
          text-gray-900
          dark:text-white
        "
      >
        Prophecy Explorer
      </h2>

      <p
        className="
          mx-auto
          mt-3
          max-w-2xl
          text-sm
          leading-7
          text-gray-500
          dark:text-gray-400
        "
      >
        Explore prophetic symbols and passages
        through Scripture, historical context,
        interpretive traditions, evidence,
        SDA perspective, related symbols,
        textual variants, and source material.
      </p>

      <div
        className="
          mx-auto
          mt-7
          grid
          max-w-3xl
          grid-cols-1
          gap-3
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >
        {quickSearches.map(
          (item) => (
            <button
              key={item.label}
              type="button"
              onClick={() =>
                triggerDecode(
                  item.label
                )
              }
              className="
                rounded-2xl
                border
                border-gray-200
                bg-gray-50
                p-4
                text-left
                transition
                hover:-translate-y-0.5
                hover:border-purple-300
                hover:bg-purple-50
                hover:shadow-sm
                dark:border-gray-800
                dark:bg-gray-900
                dark:hover:border-purple-800
                dark:hover:bg-purple-950/30
              "
            >
              <p
                className="
                  text-sm
                  font-bold
                  text-gray-900
                  dark:text-white
                "
              >
                {item.label}
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-gray-500
                  dark:text-gray-400
                "
              >
                {item.description}
              </p>
            </button>
          )
        )}
      </div>
    </div>
  );

  /* =======================================================
     RESULT RENDERER
  ======================================================= */

  const renderResult = (
    entry,
    index
  ) => {
    if (entry?.message) {
      return (
        <div
          key={`message-${index}`}
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-5
            text-sm
            leading-7
            text-red-700
            dark:border-red-900/60
            dark:bg-red-950/30
            dark:text-red-300
          "
        >
          {entry.message}
        </div>
      );
    }

    const symbolKey =
      entry.symbol ||
      "unknown";

    const data =
      safeObject(entry.data);

    const title =
      data.title ||
      data.symbol ||
      symbolKey;

    const summary =
      data.summary ||
      data.meaning ||
      "";

    const category =
      data.category ||
      "Prophetic Study";

    const statusInfo =
      getStatusConfig(
        data.status
      );

    const StatusIcon =
      statusInfo.icon;

    const primaryReference =
      data.primary_reference ||
      data.primaryReference ||
      "";

    const crossReferences =
      safeArray(
        data.cross_references
      );

    const textualContext =
      safeObject(
        data.textual_context
      );

    const historicalContext =
      safeObject(
        data.historical_context
      );

    const interpretations =
      safeArray(
        data.interpretations
      );

    const sdaPerspective =
      safeObject(
        data.sda_perspective
      );

    const textualVariants =
      safeArray(
        data.textual_variants
      );

    const curiosity =
      safeArray(
        data.curiosity
      );

    const relatedSymbols =
      safeArray(
        data.related_symbols
      );

    const sources =
      safeArray(data.sources);

    const evidence =
      safeObject(
        data.evidence_vs_interpretation
      );

    const confidence =
      safeObject(
        data.confidence
      );

    const chapterFlow =
      safeArray(
        textualContext.chapter_flow
      );

    const evidenceGroups = [
      {
        key: "facts",
        title: "Biblical Facts",
        description:
          "What the text itself states or directly presents.",
        items: safeArray(
          evidence.textual_facts
        ),
        className:
          "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20",
      },
      {
        key: "historical",
        title: "Historical Evidence",
        description:
          "Historical information relevant to the reading.",
        items: safeArray(
          evidence.historical_evidence
        ),
        className:
          "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20",
      },
      {
        key: "interpretive",
        title: "Interpretive Claims",
        description:
          "Conclusions developed through interpretation.",
        items: safeArray(
          evidence.interpretive_claims
        ),
        className:
          "border-purple-200 bg-purple-50 dark:border-purple-900/50 dark:bg-purple-950/20",
      },
      {
        key: "speculation",
        title: "Speculation",
        description:
          "Claims requiring stronger evidence or future confirmation.",
        items: safeArray(
          evidence.speculation
        ),
        className:
          "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20",
      },
    ];

    return (
      <article
        key={`${symbolKey}-${index}`}
        className="
          overflow-hidden
          rounded-3xl
          border
          border-gray-200
          bg-white
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-950
        "
      >
        {/* =================================================
            RESULT HERO
        ================================================= */}

        <div
          className="
            relative
            overflow-hidden
            border-b
            border-gray-200
            bg-gradient-to-br
            from-indigo-50
            via-white
            to-purple-50
            p-5
            dark:border-gray-800
            dark:from-indigo-950/30
            dark:via-gray-950
            dark:to-purple-950/30
            sm:p-7
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-56
              w-56
              rounded-full
              bg-purple-500/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10
              grid
              gap-6
              xl:grid-cols-[minmax(0,1fr)_280px]
            "
          >
            <div>
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <Pill
                  className="
                    bg-purple-100
                    text-purple-700
                    dark:bg-purple-950
                    dark:text-purple-300
                  "
                >
                  <Sparkles
                    size={13}
                    className="mr-1.5"
                  />
                  {category}
                </Pill>

                <Pill
                  className={
                    statusInfo.className
                  }
                >
                  <StatusIcon
                    size={13}
                    className="mr-1.5"
                  />
                  {statusInfo.label}
                </Pill>

                <Pill
                  className="
                    bg-white
                    text-gray-500
                    shadow-sm
                    ring-1
                    ring-gray-200
                    dark:bg-gray-900
                    dark:text-gray-400
                    dark:ring-gray-800
                  "
                >
                  {symbolKey}
                </Pill>
              </div>

              <h2
                className="
                  mt-5
                  text-3xl
                  font-black
                  tracking-tight
                  text-gray-950
                  dark:text-white
                  sm:text-4xl
                "
              >
                {title}
              </h2>

              {primaryReference && (
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `${symbolKey}-reference`,
                      primaryReference
                    )
                  }
                  className="
                    mt-3
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-blue-200
                    bg-blue-50
                    px-3
                    py-2
                    text-sm
                    font-bold
                    text-blue-700
                    transition
                    hover:bg-blue-100
                    dark:border-blue-900/60
                    dark:bg-blue-950/30
                    dark:text-blue-300
                  "
                >
                  <BookOpen size={15} />

                  {primaryReference}

                  <Copy
                    size={13}
                    className="ml-1 opacity-60"
                  />

                  {copiedKey ===
                    `${symbolKey}-reference` && (
                    <span className="ml-1 text-[10px] text-green-600 dark:text-green-400">
                      Copied
                    </span>
                  )}
                </button>
              )}

              {summary && (
                <p
                  className="
                    mt-5
                    max-w-4xl
                    text-sm
                    leading-7
                    text-gray-600
                    dark:text-gray-300
                    sm:text-base
                  "
                >
                  {summary}
                </p>
              )}

              {data.key_question && (
                <div
                  className="
                    mt-5
                    rounded-2xl
                    border
                    border-purple-200
                    bg-purple-50/80
                    p-4
                    dark:border-purple-900/50
                    dark:bg-purple-950/20
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-black
                      uppercase
                      tracking-wider
                      text-purple-700
                      dark:text-purple-300
                    "
                  >
                    <Target size={14} />
                    Key Question
                  </div>

                  <p
                    className="
                      mt-2
                      text-sm
                      font-semibold
                      leading-7
                      text-purple-950
                      dark:text-purple-100
                    "
                  >
                    {data.key_question}
                  </p>
                </div>
              )}
            </div>

            {/* Intelligence Panel */}

            <aside
              className="
                h-fit
                rounded-2xl
                border
                border-gray-200
                bg-white/80
                p-4
                shadow-sm
                backdrop-blur-sm
                dark:border-gray-800
                dark:bg-gray-900/80
              "
            >
              <div className="flex items-center gap-2">
                <Layers3
                  size={16}
                  className="text-indigo-500"
                />

                <h3
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-wider
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  Intelligence Profile
                </h3>
              </div>

              <div className="mt-4 space-y-2">
                {Object.entries(
                  confidence
                ).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="
                        rounded-xl
                        bg-gray-50
                        p-3
                        dark:bg-gray-800
                      "
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {titleCase(key)}
                      </p>

                      <p className="mt-1 text-xs font-bold text-gray-800 dark:text-gray-200">
                        {String(value)}
                      </p>
                    </div>
                  )
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* =================================================
            SCRIPTURE CONNECTIONS
        ================================================= */}

        {crossReferences.length > 0 && (
          <div
            className="
              border-b
              border-gray-200
              px-5
              py-5
              dark:border-gray-800
              sm:px-7
            "
          >
            <SectionHeader
              icon={Link2}
              title="Scripture Connections"
              description="Related passages available directly from the knowledge base."
            />

            <div className="flex flex-wrap gap-2">
              {crossReferences.map(
                (reference) => (
                  <button
                    key={reference}
                    type="button"
                    onClick={() =>
                      triggerDecode(
                        reference
                      )
                    }
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      px-3
                      py-2
                      text-xs
                      font-bold
                      text-gray-700
                      transition
                      hover:border-blue-300
                      hover:bg-blue-50
                      dark:border-gray-800
                      dark:bg-gray-900
                      dark:text-gray-300
                      dark:hover:border-blue-800
                      dark:hover:bg-blue-950/30
                    "
                  >
                    <BookOpen size={13} />
                    {reference}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* =================================================
            CONTENT GRID
        ================================================= */}

        <div className="space-y-4 p-4 sm:p-5 lg:p-6">

          {/* Biblical Context */}

          {(chapterFlow.length > 0 ||
            data.notes) && (
            <CollapsibleSection
              title="Biblical Context"
              icon={BookOpen}
              open={shouldOpen(
                `${symbolKey}-context`,
                true
              )}
              onToggle={() =>
                toggleSection(
                  `${symbolKey}-context`
                )
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {chapterFlow.length >
                  0 && (
                  <div>
                    <h4
                      className="
                        text-xs
                        font-black
                        uppercase
                        tracking-wider
                        text-gray-400
                      "
                    >
                      Passage Flow
                    </h4>

                    <div className="mt-3 space-y-2">
                      {chapterFlow.map(
                        (
                          item,
                          flowIndex
                        ) => (
                          <div
                            key={
                              flowIndex
                            }
                            className="
                              flex
                              gap-3
                              rounded-xl
                              bg-gray-50
                              p-3
                              dark:bg-gray-900
                            "
                          >
                            <span
                              className="
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-indigo-100
                                text-xs
                                font-black
                                text-indigo-700
                                dark:bg-indigo-950
                                dark:text-indigo-300
                              "
                            >
                              {flowIndex + 1}
                            </span>

                            <p
                              className="
                                text-sm
                                leading-6
                                text-gray-700
                                dark:text-gray-300
                              "
                            >
                              {item}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {data.notes && (
                  <div
                    className="
                      rounded-xl
                      border
                      border-gray-200
                      p-4
                      dark:border-gray-800
                    "
                  >
                    <h4
                      className="
                        text-xs
                        font-black
                        uppercase
                        tracking-wider
                        text-gray-400
                      "
                    >
                      Study Notes
                    </h4>

                    <p
                      className="
                        mt-3
                        text-sm
                        leading-7
                        text-gray-600
                        dark:text-gray-300
                      "
                    >
                      {data.notes}
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Historical Context */}

          {Object.keys(
            historicalContext
          ).length > 0 && (
            <CollapsibleSection
              title="Historical Context"
              icon={Landmark}
              open={shouldOpen(
                `${symbolKey}-history`,
                false
              )}
              onToggle={() =>
                toggleSection(
                  `${symbolKey}-history`
                )
              }
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <InfoCard
                  label="Period"
                  value={
                    historicalContext.period
                  }
                />

                <InfoCard
                  label="Region"
                  value={
                    historicalContext.region
                  }
                />

                <div className="lg:col-span-1">
                  {historicalContext.description && (
                    <InfoCard
                      label="Context"
                      value={
                        historicalContext.description
                      }
                    />
                  )}
                </div>
              </div>

              {historicalContext.description && (
                <p
                  className="
                    mt-4
                    text-sm
                    leading-7
                    text-gray-600
                    dark:text-gray-300
                  "
                >
                  {
                    historicalContext.description
                  }
                </p>
              )}

              {historicalContext.why_it_matters && (
                <div
                  className="
                    mt-4
                    rounded-2xl
                    border
                    border-amber-200
                    bg-amber-50
                    p-4
                    dark:border-amber-900/50
                    dark:bg-amber-950/20
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-black
                      uppercase
                      tracking-wider
                      text-amber-700
                      dark:text-amber-300
                    "
                  >
                    <Lightbulb size={14} />
                    Why It Matters
                  </div>

                  <p
                    className="
                      mt-2
                      text-sm
                      leading-7
                      text-amber-950
                      dark:text-amber-100
                    "
                  >
                    {
                      historicalContext.why_it_matters
                    }
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Interpretations */}

          {interpretations.length >
            0 && (
            <CollapsibleSection
              title={`Interpretations (${interpretations.length})`}
              icon={Brain}
              open={shouldOpen(
                `${symbolKey}-interpretations`,
                true
              )}
              onToggle={() =>
                toggleSection(
                  `${symbolKey}-interpretations`
                )
              }
            >
              <div className="grid gap-4 xl:grid-cols-2">
                {interpretations.map(
                  (
                    interpretation,
                    interpretationIndex
                  ) => (
                    <article
                      key={
                        interpretation.name ||
                        interpretationIndex
                      }
                      className="
                        rounded-2xl
                        border
                        border-gray-200
                        bg-gray-50
                        p-4
                        dark:border-gray-800
                        dark:bg-gray-900
                      "
                    >
                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          justify-between
                          gap-2
                        "
                      >
                        <h4
                          className="
                            text-base
                            font-black
                            text-gray-900
                            dark:text-white
                          "
                        >
                          {
                            interpretation.name
                          }
                        </h4>

                        {interpretation.type && (
                          <Pill
                            className="
                              bg-indigo-100
                              text-indigo-700
                              dark:bg-indigo-950
                              dark:text-indigo-300
                            "
                          >
                            {
                              interpretation.type
                            }
                          </Pill>
                        )}
                      </div>

                      {interpretation.summary && (
                        <p
                          className="
                            mt-3
                            text-sm
                            leading-7
                            text-gray-600
                            dark:text-gray-300
                          "
                        >
                          {
                            interpretation.summary
                          }
                        </p>
                      )}

                      {safeArray(
                        interpretation.evidence
                      ).length >
                        0 && (
                        <div className="mt-4">
                          <p
                            className="
                              text-[10px]
                              font-black
                              uppercase
                              tracking-wider
                              text-green-600
                              dark:text-green-400
                            "
                          >
                            Evidence
                          </p>

                          <div className="mt-2 space-y-2">
                            {interpretation.evidence.map(
                              (
                                point,
                                pointIndex
                              ) => (
                                <div
                                  key={
                                    pointIndex
                                  }
                                  className="
                                    flex
                                    gap-2
                                    text-sm
                                    leading-6
                                    text-gray-600
                                    dark:text-gray-300
                                  "
                                >
                                  <CheckCircle2
                                    size={15}
                                    className="
                                      mt-1
                                      shrink-0
                                      text-green-500
                                    "
                                  />
                                  <span>
                                    {point}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {safeArray(
                        interpretation.challenges
                      ).length >
                        0 && (
                        <div className="mt-4">
                          <p
                            className="
                              text-[10px]
                              font-black
                              uppercase
                              tracking-wider
                              text-amber-600
                              dark:text-amber-400
                            "
                          >
                            Challenges
                          </p>

                          <div className="mt-2 space-y-2">
                            {interpretation.challenges.map(
                              (
                                point,
                                pointIndex
                              ) => (
                                <div
                                  key={
                                    pointIndex
                                  }
                                  className="
                                    flex
                                    gap-2
                                    text-sm
                                    leading-6
                                    text-gray-600
                                    dark:text-gray-300
                                  "
                                >
                                  <AlertTriangle
                                    size={15}
                                    className="
                                      mt-1
                                      shrink-0
                                      text-amber-500
                                    "
                                  />
                                  <span>
                                    {point}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  )
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* SDA Perspective */}

          {sdaPerspective.summary && (
            <CollapsibleSection
              title="SDA Perspective"
              icon={ShieldCheck}
              open={shouldOpen(
                `${symbolKey}-sda`,
                true
              )}
              onToggle={() =>
                toggleSection(
                  `${symbolKey}-sda`
                )
              }
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-green-200
                  bg-green-50
                  p-5
                  dark:border-green-900/50
                  dark:bg-green-950/20
                "
              >
                <p
                  className="
                    text-sm
                    leading-7
                    text-green-950
                    dark:text-green-100
                  "
                >
                  {
                    sdaPerspective.summary
                  }
                </p>

                {sdaPerspective.source && (
                  <div
                    className="
                      mt-4
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      bg-white/80
                      px-3
                      py-2
                      text-xs
                      font-bold
                      text-green-700
                      dark:bg-gray-900/60
                      dark:text-green-300
                    "
                  >
                    <ShieldCheck size={14} />
                    {sdaPerspective.source}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Evidence vs Interpretation */}

          {evidenceGroups.some(
            (group) =>
              group.items.length > 0
          ) && (
            <CollapsibleSection
              title="Evidence vs Interpretation"
              icon={Lightbulb}
              open={shouldOpen(
                `${symbolKey}-evidence`,
                false
              )}
              onToggle={() =>
                toggleSection(
                  `${symbolKey}-evidence`
                )
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {evidenceGroups.map(
                  (group) =>
                    group.items.length >
                      0 && (
                      <article
                        key={group.key}
                        className={`
                          rounded-2xl
                          border
                          p-4
                          ${group.className}
                        `}
                      >
                        <h4
                          className="
                            text-sm
                            font-black
                            text-gray-900
                            dark:text-white
                          "
                        >
                          {group.title}
                        </h4>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-gray-500
                            dark:text-gray-400
                          "
                        >
                          {
                            group.description
                          }
                        </p>

                        <div className="mt-4 space-y-2">
                          {group.items.map(
                            (
                              item,
                              itemIndex
                            ) => (
                              <div
                                key={
                                  itemIndex
                                }
                                className="
                                  flex
                                  gap-2
                                  text-sm
                                  leading-6
                                  text-gray-700
                                  dark:text-gray-300
                                "
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />

                                <span>
                                  {item}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </article>
                    )
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Textual Variants */}

          {textualVariants.length >
            0 && (
            <CollapsibleSection
              title={`Textual Variants (${textualVariants.length})`}
              icon={FileText}
              open={shouldOpen(
                `${symbolKey}-variants`,
                false
              )}
              onToggle={() =>
                toggleSection(
                  `${symbolKey}-variants`
                )
              }
            >
              <div className="space-y-3">
                {textualVariants.map(
                  (
                    variant,
                    variantIndex
                  ) => (
                    <article
                      key={
                        `${variant.variant || "variant"}-${variantIndex}`
                      }
                      className="
                        rounded-2xl
                        border
                        border-gray-200
                        bg-gray-50
                        p-4
                        dark:border-gray-800
                        dark:bg-gray-900
                      "
                    >
                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          gap-2
                        "
                      >
                        <Pill
                          className="
                            bg-indigo-100
                            text-indigo-700
                            dark:bg-indigo-950
                            dark:text-indigo-300
                          "
                        >
                          Variant
                        </Pill>

                        {variant.variant && (
                          <span
                            className="
                              text-lg
                              font-black
                              text-gray-900
                              dark:text-white
                            "
                          >
                            {variant.variant}
                          </span>
                        )}
                      </div>

                      {variant.description && (
                        <p
                          className="
                            mt-3
                            text-sm
                            leading-7
                            text-gray-600
                            dark:text-gray-300
                          "
                        >
                          {
                            variant.description
                          }
                        </p>
                      )}

                      {variant.significance && (
                        <div
                          className="
                            mt-3
                            rounded-xl
                            border
                            border-blue-200
                            bg-blue-50
                            p-3
                            dark:border-blue-900/50
                            dark:bg-blue-950/20
                          "
                        >
                          <p
                            className="
                              text-xs
                              font-bold
                              uppercase
                              tracking-wider
                              text-blue-700
                              dark:text-blue-300
                            "
                          >
                            Significance
                          </p>

                          <p
                            className="
                              mt-1
                              text-sm
                              leading-6
                              text-blue-950
                              dark:text-blue-100
                            "
                          >
                            {
                              variant.significance
                            }
                          </p>
                        </div>
                      )}
                    </article>
                  )
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Curiosity */}

          {curiosity.length >
            0 && (
            <CollapsibleSection
              title="Explore Next"
              icon={Search}
              open={shouldOpen(
                `${symbolKey}-curiosity`,
                true
              )}
              onToggle={() =>
                toggleSection(
                  `${symbolKey}-curiosity`
                )
              }
            >
              <div
                className="
                  grid
                  gap-3
                  md:grid-cols-2
                "
              >
                {curiosity.map(
                  (
                    question,
                    questionIndex
                  ) => (
                    <button
                      key={
                        questionIndex
                      }
                      type="button"
                      onClick={() =>
                        triggerDecode(
                          question
                        )
                      }
                      className="
                        group
                        flex
                        items-start
                        gap-3
                        rounded-2xl
                        border
                        border-gray-200
                        bg-gray-50
                        p-4
                        text-left
                        transition
                        hover:-translate-y-0.5
                        hover:border-purple-300
                        hover:bg-purple-50
                        hover:shadow-sm
                        dark:border-gray-800
                        dark:bg-gray-900
                        dark:hover:border-purple-800
                        dark:hover:bg-purple-950/20
                      "
                    >
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-purple-100
                          text-purple-600
                          dark:bg-purple-950
                          dark:text-purple-300
                        "
                      >
                        <Search size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="
                            text-sm
                            font-bold
                            leading-6
                            text-gray-800
                            dark:text-gray-200
                          "
                        >
                          {question}
                        </p>

                        <div
                          className="
                            mt-2
                            flex
                            items-center
                            gap-1
                            text-xs
                            font-bold
                            text-purple-600
                            dark:text-purple-400
                          "
                        >
                          Explore
                          <ChevronRight
                            size={14}
                            className="
                              transition-transform
                              group-hover:translate-x-0.5
                            "
                          />
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Related Symbols */}

          {relatedSymbols.length >
            0 && (
            <CollapsibleSection
              title={`Related Symbols (${relatedSymbols.length})`}
              icon={Link2}
              open={shouldOpen(
                `${symbolKey}-related`,
                true
              )}
              onToggle={() =>
                toggleSection(
                  `${symbolKey}-related`
                )
              }
            >
              <div className="flex flex-wrap gap-2">
                {relatedSymbols.map(
                  (related) => (
                    <button
                      key={related}
                      type="button"
                      onClick={() =>
                        triggerDecode(
                          related
                        )
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-gray-200
                        bg-gray-50
                        px-3
                        py-2.5
                        text-sm
                        font-bold
                        text-gray-700
                        transition
                        hover:border-indigo-300
                        hover:bg-indigo-50
                        dark:border-gray-800
                        dark:bg-gray-900
                        dark:text-gray-300
                        dark:hover:border-indigo-800
                        dark:hover:bg-indigo-950/20
                      "
                    >
                      {related}
                      <ArrowRight
                        size={13}
                      />
                    </button>
                  )
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Sources */}

          {sources.length > 0 && (
            <CollapsibleSection
              title={`Sources (${sources.length})`}
              icon={ExternalLink}
              open={shouldOpen(
                `${symbolKey}-sources`,
                false
              )}
              onToggle={() =>
                toggleSection(
                  `${symbolKey}-sources`
                )
              }
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {sources.map(
                  (
                    source,
                    sourceIndex
                  ) => {
                    const url =
                      cleanUrl(
                        source?.url
                      );

                    return (
                      <article
                        key={`${source?.title || "source"}-${sourceIndex}`}
                        className="
                          rounded-2xl
                          border
                          border-gray-200
                          bg-gray-50
                          p-4
                          dark:border-gray-800
                          dark:bg-gray-900
                        "
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="
                              flex
                              h-10
                              w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-white
                              text-indigo-600
                              shadow-sm
                              dark:bg-gray-950
                              dark:text-indigo-300
                            "
                          >
                            <ExternalLink
                              size={16}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                  text-sm
                                  font-bold
                                  text-indigo-600
                                  hover:underline
                                  dark:text-indigo-400
                                "
                              >
                                {source.title ||
                                  "Source"}
                              </a>
                            ) : (
                              <h4
                                className="
                                  text-sm
                                  font-bold
                                  text-gray-900
                                  dark:text-white
                                "
                              >
                                {source.title ||
                                  "Source"}
                              </h4>
                            )}

                            <p
                              className="
                                mt-1
                                text-xs
                                text-gray-500
                                dark:text-gray-400
                              "
                            >
                              {source.publisher ||
                                "Unknown publisher"}

                              {source.type
                                ? ` • ${source.type}`
                                : ""}
                            </p>

                            {safeArray(
                              source.supports
                            ).length >
                              0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {source.supports.map(
                                  (
                                    support
                                  ) => (
                                    <span
                                      key={
                                        support
                                      }
                                      className="
                                        rounded-full
                                        bg-white
                                        px-2
                                        py-1
                                        text-[10px]
                                        font-semibold
                                        text-gray-500
                                        dark:bg-gray-950
                                        dark:text-gray-400
                                      "
                                    >
                                      {support}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Result Actions */}

          <div
            className="
              flex
              flex-col
              gap-3
              rounded-2xl
              border
              border-gray-200
              bg-gray-50
              p-4
              dark:border-gray-800
              dark:bg-gray-900
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="flex items-center gap-2">
              <History
                size={16}
                className="text-gray-400"
              />

              <p
                className="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Verified result saved to your
                prophecy history when signed in.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopy(
                  `${symbolKey}-full`,
                  entry
                )
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-2.5
                text-xs
                font-bold
                text-gray-700
                transition
                hover:bg-gray-100
                dark:border-gray-700
                dark:bg-gray-950
                dark:text-gray-300
                dark:hover:bg-gray-800
              "
            >
              <Copy size={14} />

              {copiedKey ===
              `${symbolKey}-full`
                ? "Copied"
                : "Copy Result"}
            </button>
          </div>
        </div>
      </article>
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className={`
        min-w-0
        w-full
        px-3
        py-4
        sm:px-5
        sm:py-6
        lg:px-7
        ${
          isDark
            ? "bg-gray-950 text-white"
            : "bg-gray-50 text-gray-900"
        }
      `}
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1500px]
          space-y-5
        "
      >
        {/* =================================================
            TOP BAR
        ================================================= */}

        <section
          className="
            overflow-hidden
            rounded-3xl
            border
            border-gray-200
            bg-white
            shadow-sm
            dark:border-gray-800
            dark:bg-gray-950
          "
        >
          <div
            className="
              border-b
              border-gray-100
              bg-gradient-to-r
              from-indigo-50
              via-white
              to-purple-50
              p-4
              dark:border-gray-800
              dark:from-indigo-950/20
              dark:via-gray-950
              dark:to-purple-950/20
              sm:p-6
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4
                lg:flex-row
                lg:items-end
                lg:justify-between
              "
            >
              <div>
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-indigo-200
                    bg-indigo-50
                    px-3
                    py-1.5
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.14em]
                    text-indigo-700
                    dark:border-indigo-900/50
                    dark:bg-indigo-950/30
                    dark:text-indigo-300
                  "
                >
                  <Sparkles size={13} />
                  Prophecy Intelligence
                </div>

                <h1
                  className="
                    mt-4
                    text-2xl
                    font-black
                    tracking-tight
                    text-gray-950
                    dark:text-white
                    sm:text-3xl
                  "
                >
                  Explore Scripture, history & interpretation
                </h1>

                <p
                  className="
                    mt-2
                    max-w-3xl
                    text-sm
                    leading-7
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  A structured prophecy workspace
                  designed to distinguish biblical text,
                  historical evidence, interpretation,
                  and speculation.
                </p>
              </div>

              {isGuest && (
                <div
                  className="
                    inline-flex
                    w-fit
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-yellow-200
                    bg-yellow-50
                    px-3
                    py-2
                    text-xs
                    font-bold
                    text-yellow-700
                    dark:border-yellow-900/50
                    dark:bg-yellow-950/20
                    dark:text-yellow-300
                  "
                >
                  <Clock3 size={14} />

                  {Math.max(
                    0,
                    5 - guestDecodeCount
                  )}
                  /5 guest decodes
                </div>
              )}
            </div>
          </div>

          {/* Search */}

          <div className="p-4 sm:p-5">
            <div
              className="
                flex
                flex-col
                gap-2
                rounded-2xl
                border
                border-gray-200
                bg-gray-50
                p-2
                sm:flex-row
                dark:border-gray-800
                dark:bg-gray-900
              "
            >
              <div
                className="
                  flex
                  min-w-0
                  flex-1
                  items-center
                  gap-3
                  px-3
                "
              >
                <Search
                  size={20}
                  className="shrink-0 text-gray-400"
                />

                <input
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleSearchKeyDown
                  }
                  placeholder="Search a symbol, verse, phrase, or prophetic topic..."
                  aria-label="Prophecy explorer search"
                  className="
                    h-12
                    min-w-0
                    flex-1
                    border-0
                    bg-transparent
                    text-sm
                    text-gray-900
                    outline-none
                    placeholder:text-gray-400
                    dark:text-white
                    dark:placeholder:text-gray-500
                  "
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  handleDecode()
                }
                disabled={
                  loading ||
                  !searchInput.trim() ||
                  (isGuest &&
                    guestDecodeCount >= 5)
                }
                className="
                  inline-flex
                  h-12
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-indigo-600
                  px-6
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-indigo-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Exploring...
                  </>
                ) : (
                  <>
                    <Search size={17} />
                    Explore
                  </>
                )}
              </button>
            </div>

            {/* Quick Searches */}

            <div className="mt-3">
              <div
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-wider
                    text-gray-400
                  "
                >
                  Quick Topics
                </span>
              </div>

              <div
                className="
                  flex
                  gap-2
                  overflow-x-auto
                  pb-1
                  scrollbar-thin
                "
              >
                {quickSearches.map(
                  (item) => (
                    <button
                      key={
                        item.label
                      }
                      type="button"
                      onClick={() =>
                        triggerDecode(
                          item.label
                        )
                      }
                      className="
                        shrink-0
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        px-3
                        py-2
                        text-left
                        transition
                        hover:border-indigo-300
                        hover:bg-indigo-50
                        dark:border-gray-800
                        dark:bg-gray-950
                        dark:hover:border-indigo-800
                        dark:hover:bg-indigo-950/20
                      "
                    >
                      <span
                        className="
                          block
                          text-xs
                          font-bold
                          text-gray-800
                          dark:text-gray-200
                        "
                      >
                        {item.label}
                      </span>

                      <span
                        className="
                          mt-0.5
                          block
                          text-[10px]
                          text-gray-400
                        "
                      >
                        {item.description}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            AI INSIGHT
        ================================================= */}

        {aiInsight && (
          <section
            className="
              rounded-2xl
              border
              border-purple-200
              bg-purple-50
              p-4
              dark:border-purple-900/50
              dark:bg-purple-950/20
              sm:p-5
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-purple-600
                  shadow-sm
                  dark:bg-gray-900
                  dark:text-purple-300
                "
              >
                <Sparkles size={18} />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.14em]
                    text-purple-600
                    dark:text-purple-400
                  "
                >
                  Daily AI Insight
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-7
                    text-purple-950
                    dark:text-purple-100
                  "
                >
                  {aiInsight}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            RESULTS
        ================================================= */}

        <section
          id="prophecy-results"
          className="scroll-mt-5"
        >
          {loading ? (
            <div
              className="
                rounded-3xl
                border
                border-gray-200
                bg-white
                px-5
                py-20
                text-center
                shadow-sm
                dark:border-gray-800
                dark:bg-gray-950
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-indigo-100
                  text-indigo-600
                  dark:bg-indigo-950
                  dark:text-indigo-300
                "
              >
                <Loader2
                  size={28}
                  className="animate-spin"
                />
              </div>

              <h2
                className="
                  mt-5
                  text-lg
                  font-black
                  text-gray-900
                  dark:text-white
                "
              >
                Exploring the prophecy...
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
                Organizing biblical context,
                interpretations, evidence,
                history, related symbols,
                textual variants, and sources.
              </p>
            </div>
          ) : decodedData.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-5">
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-black
                      uppercase
                      tracking-wider
                      text-gray-400
                    "
                  >
                    Explorer Results
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-gray-500
                      dark:text-gray-400
                    "
                  >
                    {decodedData.length}{" "}
                    {decodedData.length === 1
                      ? "record"
                      : "records"}
                    {timestamp
                      ? ` • ${timestamp}`
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDecodedData([])
                  }
                  className="
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-3
                    py-2
                    text-xs
                    font-bold
                    text-gray-600
                    transition
                    hover:bg-gray-100
                    dark:border-gray-800
                    dark:bg-gray-950
                    dark:text-gray-300
                    dark:hover:bg-gray-900
                  "
                >
                  Clear Results
                </button>
              </div>

              {decodedData.map(
                (entry, index) =>
                  renderResult(
                    entry,
                    index
                  )
              )}
            </div>
          )}
        </section>

        {/* =================================================
            FOOTER NOTE
        ================================================= */}

        <div
          className="
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-4
            dark:border-gray-800
            dark:bg-gray-950
          "
        >
          <Info
            size={16}
            className="
              mt-0.5
              shrink-0
              text-gray-400
            "
          />

          <p
            className="
              text-xs
              leading-6
              text-gray-500
              dark:text-gray-400
            "
          >
            Prophecy Explorer distinguishes
            biblical text, historical evidence,
            interpretation, and speculation.
            Interpretive traditions should not be
            presented as uncontested facts.
          </p>
        </div>
      </div>
    </div>
  );
}
