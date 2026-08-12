// src/components/ProphecyDashboard.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHistory } from "@/context/HistoryContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  ExternalLink,
  Landmark,
  Lightbulb,
  Link2,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const REVELAAI_URL = import.meta.env.VITE_REVELAAI_URL;

const PROPHECY_DECODE_ENDPOINT =
  `${API_URL}/api/prophecy/decode`;

export default function ProphecyDashboard() {
  const { isGuest } = useAuth();
  const { addProphecyHistory } = useHistory();

  const [searchInput, setSearchInput] = useState("");
  const [decodedData, setDecodedData] = useState([]);
  const [timestamp, setTimestamp] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestDecodeCount, setGuestDecodeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [aiInsight, setAiInsight] = useState("");

  const [expandedSections, setExpandedSections] = useState({
    context: true,
    history: false,
    interpretations: true,
    sda: true,
    evidence: false,
    curiosity: true,
    related: false,
    sources: false,
  });

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  /* =========================================================
     THEME
  ========================================================= */

  useEffect(() => {
    const root = document.documentElement;

    const updateTheme = () => {
      setIsDark(root.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  /* =========================================================
     GUEST DECODE COUNT
  ========================================================= */

  useEffect(() => {
    try {
      const savedCount =
        localStorage.getItem("guestDecodeCount");

      if (savedCount) {
        setGuestDecodeCount(Number(savedCount));
      }
    } catch (err) {
      console.error(
        "❌ Failed to load guest decode count:",
        err
      );
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "guestDecodeCount",
        String(guestDecodeCount)
      );
    } catch (err) {
      console.error(
        "❌ Failed to save guest decode count:",
        err
      );
    }
  }, [guestDecodeCount]);

  /* =========================================================
     DAILY AI INSIGHT
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchAIInsight = async () => {
      try {
        if (!REVELAAI_URL) {
          if (!cancelled) {
            setAiInsight(
              "Daily AI insight is currently unavailable."
            );
          }
          return;
        }

        const res = await fetch(
          `${REVELAAI_URL}/daily-insights`
        );

        if (!res.ok) {
          throw new Error(
            `AI insight request failed: ${res.status}`
          );
        }

        const data = await res.json();

        if (!cancelled) {
          setAiInsight(
            data?.insight ||
              "Explore a prophecy to discover its context, interpretations, and connections."
          );
        }
      } catch (err) {
        console.error(
          "❌ Failed to fetch AI insight:",
          err
        );

        if (!cancelled) {
          setAiInsight(
            "Explore a prophecy to discover its context, interpretations, and connections."
          );
        }
      }
    };

    fetchAIInsight();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    return "";
  };

  /* =========================================================
     NORMALIZE ARRAY
  ========================================================= */

  const normalizeDecodedArray = (items) => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.flatMap((entry) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      /*
       * Already normalized:
       *
       * {
       *   symbol: "666",
       *   data: {...}
       * }
       */

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

      /*
       * Backend returned:
       *
       * {
       *   "666": {...}
       * }
       */

      const nestedEntries = Object.entries(entry);

      const validSymbols = nestedEntries.filter(
        ([key, value]) =>
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

      if (validSymbols.length > 0) {
        return validSymbols.map(
          ([symbol, data]) => ({
            symbol,
            data,
          })
        );
      }

      /*
       * Backend returned one prophecy directly:
       *
       * {
       *   symbol: "666",
       *   title: "...",
       *   ...
       * }
       */

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

  /* =========================================================
     NORMALIZE BACKEND RESPONSE
  ========================================================= */

  const normalizeDecoded = (result, query = "") => {
    if (!result) {
      return [];
    }

    const normalizedQuery =
      normalizeText(query);

    /*
     * 1. COMPLETE KNOWLEDGE DATASET
     *
     * {
     *   schema_version: "2.0",
     *   symbols: {
     *      "666": {...},
     *      "beast": {...}
     *   }
     * }
     *
     * IMPORTANT:
     * Only return matching symbol(s) instead of
     * dumping the whole dataset into the UI.
     */

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

          return (
            normalizedSymbol === normalizedQuery ||
            normalizedDataSymbol === normalizedQuery ||
            normalizedTitle === normalizedQuery ||
            normalizedSymbol.includes(normalizedQuery) ||
            normalizedTitle.includes(normalizedQuery) ||
            normalizedReference.includes(normalizedQuery)
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

    /*
     * 2. {
     *      decoded: [...]
     *    }
     */

    if (Array.isArray(result.decoded)) {
      return normalizeDecodedArray(
        result.decoded
      );
    }

    /*
     * 3. {
     *      data: {
     *        decoded: [...]
     *      }
     *    }
     */

    if (
      Array.isArray(result?.data?.decoded)
    ) {
      return normalizeDecodedArray(
        result.data.decoded
      );
    }

    /*
     * 4. {
     *      data: [...]
     *    }
     */

    if (Array.isArray(result?.data)) {
      return normalizeDecodedArray(
        result.data
      );
    }

    /*
     * 5. Direct prophecy object
     *
     * {
     *   symbol: "666",
     *   title: "...",
     *   summary: "...",
     * }
     */

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

    /*
     * 6. {
     *      "666": {...}
     *    }
     */

    if (
      typeof result === "object" &&
      !Array.isArray(result)
    ) {
      const entries = Object.entries(result);

      const symbolEntries =
        entries.filter(
          ([key, value]) =>
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
    }

    /*
     * 7. Direct array response
     */

    if (Array.isArray(result)) {
      return normalizeDecodedArray(
        result
      );
    }

    return [];
  };

  /* =========================================================
     VALIDATE NORMALIZED RESPONSE
  ========================================================= */

  const validateDecodedResults = (results) => {
    if (!Array.isArray(results)) {
      return [];
    }

    return results.filter((entry) => {
      if (
        !entry ||
        typeof entry !== "object"
      ) {
        return false;
      }

      if (entry.message) {
        return true;
      }

      if (
        !entry.symbol ||
        !entry.data ||
        typeof entry.data !== "object" ||
        Array.isArray(entry.data)
      ) {
        return false;
      }

      return true;
    });
  };

  /* =========================================================
     RELATED / CURIOSITY DECODE
  ========================================================= */

  const triggerDecode = (value) => {
    const cleaned = String(value || "").trim();

    if (!cleaned) {
      return;
    }

    setSearchInput(cleaned);

    setTimeout(() => {
      handleDecode(cleaned);
    }, 0);
  };

  /* =========================================================
     DECODE
  ========================================================= */

  const handleDecode = async (
    overrideValue = null
  ) => {
    const query = String(
      overrideValue ?? searchInput ?? ""
    ).trim();

    if (!query) {
      return;
    }

    if (
      isGuest &&
      guestDecodeCount >= 5
    ) {
      alert(
        "⚠ Guest limit reached: 5 decodes per day."
      );
      return;
    }

    setLoading(true);
    setDecodedData([]);
    setTimestamp("");
    setCopied(false);

    try {
      if (!API_URL) {
        throw new Error(
          "VITE_API_URL is not configured."
        );
      }

      const res = await fetch(
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

      const data = await res
        .json()
        .catch(() => ({}));

      console.log(
        "🔍 Prophecy backend response:",
        data
      );

      if (!res.ok) {
        setDecodedData([
          {
            message:
              data?.message ||
              `❌ Decode failed (HTTP ${res.status})`,
          },
        ]);
        return;
      }

      /*
       * Normalize according to the real
       * backend response shape.
       */

      const normalized =
        normalizeDecoded(
          data,
          query
        );

      console.log(
        "🔍 Normalized prophecy response:",
        normalized
      );

      /*
       * Verify the normalized structure.
       */

      const validated =
        validateDecodedResults(
          normalized
        );

      console.log(
        "✅ Validated prophecy response:",
        validated
      );

      /*
       * Backend responded successfully,
       * but nothing matched the query.
       */

      if (!validated.length) {
        setDecodedData([
          {
            message:
              `🔎 No verified prophecy record matched "${query}".`,
          },
        ]);
        return;
      }

      /*
       * Guest users get a maximum of five
       * returned records.
       */

      const finalDecoded =
        isGuest
          ? validated.slice(0, 5)
          : validated;

      setDecodedData(
        finalDecoded
      );

      const now =
        new Date().toLocaleString();

      setTimestamp(now);

      /*
       * Save the exact verified result
       * into history.
       */

      if (
        !isGuest &&
        addProphecyHistory
      ) {
        await addProphecyHistory({
          query,
          results: finalDecoded,
          timestamp: now,
        });
      }

      if (isGuest) {
        setGuestDecodeCount(
          (prev) => prev + 1
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
    } catch (err) {
      console.error(
        "❌ Decode error:",
        err
      );

      setDecodedData([
        {
          message:
            err?.message ||
            "❌ Server error. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

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

  /* =========================================================
     COPY
  ========================================================= */

  const handleCopy = async (
    specificData = null
  ) => {
    const payload =
      specificData || decodedData;

    if (!payload?.length) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "❌ Clipboard copy failed:",
        err
      );
    }
  };

  /* =========================================================
     STATUS UI
  ========================================================= */

  const getStatusConfig = (
    status
  ) => {
    const normalized = String(
      status || "unknown"
    )
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
        icon: AlertTriangle,
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
          normalized.replaceAll(
            "_",
            " "
          ) || "Unknown",
        icon: Brain,
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      }
    );
  };

  /* =========================================================
     SECTION COMPONENT
  ========================================================= */

  const ExplorerSection = ({
    id,
    title,
    icon: Icon,
    children,
    defaultOpen = false,
  }) => {
    const isOpen =
      expandedSections[id] ??
      defaultOpen;

    return (
      <div className="border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() =>
            toggleSection(id)
          }
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
            dark:hover:bg-gray-900/60
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
                rounded-lg
                bg-gray-100
                dark:bg-gray-800
              "
            >
              <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </span>

            <span className="truncate font-semibold text-gray-900 dark:text-white">
              {title}
            </span>
          </span>

          {isOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          )}
        </button>

        {isOpen && (
          <div className="px-4 pb-5 sm:px-5">
            {children}
          </div>
        )}
      </div>
    );
  };

  /* =========================================================
     DECODED RESULT RENDERER
  ========================================================= */

  const renderDecoded = () => {
    if (!decodedData.length) {
      return (
        <div className="px-4 py-14 text-center sm:px-6">
          <div
            className="
              mx-auto
              mb-5
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-purple-100
              dark:bg-purple-950/60
            "
          >
            <Sparkles className="h-7 w-7 text-purple-600 dark:text-purple-400" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Explore a prophecy
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-gray-500 dark:text-gray-400">
            Enter a prophetic symbol, verse,
            or biblical phrase to explore
            its meaning, context, historical
            background, interpretations,
            related prophecies, and sources.
          </p>

          <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-3">
            {[
              "666",
              "Daniel 7",
              "Mark of the beast",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() =>
                  triggerDecode(
                    suggestion
                  )
                }
                className="
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  font-medium
                  text-gray-700
                  transition
                  hover:border-purple-300
                  hover:bg-purple-50
                  dark:border-gray-800
                  dark:bg-gray-900
                  dark:text-gray-300
                  dark:hover:border-purple-800
                  dark:hover:bg-purple-950/30
                "
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return decodedData.map(
      (entry, idx) => {
        if (entry?.message) {
          return (
            <div
              key={idx}
              className="
                m-4
                rounded-xl
                border
                border-red-200
                bg-red-50
                p-4
                text-sm
                leading-6
                text-red-700
                dark:border-red-900
                dark:bg-red-950/40
                dark:text-red-300
              "
            >
              {entry.message}
            </div>
          );
        }

        /*
         * IMPORTANT:
         *
         * normalizeDecoded() already converts
         * everything to:
         *
         * {
         *   symbol: "666",
         *   data: {...}
         * }
         */

        const symbolKey =
          entry.symbol ||
          "Unknown Prophecy";

        const data =
          entry.data || {};

        const title =
          data.title ||
          data.symbol ||
          symbolKey;

        const summary =
          data.summary ||
          data.meaning ||
          data.notes ||
          "";

        const primaryReference =
          data.primary_reference ||
          data.reference ||
          "";

        const statusInfo =
          getStatusConfig(
            data.status
          );

        const StatusIcon =
          statusInfo.icon;

        const crossReferences =
          Array.isArray(
            data.cross_references
          )
            ? data.cross_references
            : [];

        const historicalContext =
          data.historical_context;

        const textualContext =
          data.textual_context;

        const interpretations =
          Array.isArray(
            data.interpretations
          )
            ? data.interpretations
            : [];

        const sdaPerspective =
          data.sda_perspective;

        const evidence =
          data.evidence_vs_interpretation ||
          {};

        const curiosity =
          Array.isArray(
            data.curiosity
          )
            ? data.curiosity
            : [];

        const related =
          Array.isArray(
            data.related_symbols
          )
            ? data.related_symbols
            : [];

        const sources =
          Array.isArray(
            data.sources
          )
            ? data.sources
            : [];

        return (
          <article
            key={`${symbolKey}-${idx}`}
            className="
              overflow-hidden
              rounded-2xl
              border
              border-gray-200
              bg-white
              shadow-sm
              dark:border-gray-800
              dark:bg-gray-950
            "
          >
            {/* ============================================
                HERO
            ============================================ */}

            <div
              className="
                border-b
                border-gray-200
                bg-gradient-to-br
                from-purple-50
                via-white
                to-blue-50
                p-5
                dark:border-gray-800
                dark:from-purple-950/40
                dark:via-gray-950
                dark:to-blue-950/30
                sm:p-7
              "
            >
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      bg-purple-100
                      px-3
                      py-1.5
                      text-xs
                      font-bold
                      text-purple-700
                      dark:bg-purple-950
                      dark:text-purple-300
                    "
                  >
                    <Sparkles className="h-3.5 w-3.5" />

                    {data.category ||
                      "Prophetic Symbol"}
                  </span>

                  <span
                    className={`
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      px-3
                      py-1.5
                      text-xs
                      font-bold
                      ${statusInfo.className}
                    `}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />

                    {statusInfo.label}
                  </span>
                </div>

                <div>
                  <h3
                    className="
                      text-2xl
                      font-bold
                      tracking-tight
                      text-gray-950
                      dark:text-white
                      sm:text-3xl
                    "
                  >
                    {title}
                  </h3>

                  {primaryReference && (
                    <div
                      className="
                        mt-2
                        flex
                        items-center
                        gap-2
                        text-sm
                        font-semibold
                        text-blue-600
                        dark:text-blue-400
                      "
                    >
                      <BookOpen className="h-4 w-4" />

                      {primaryReference}
                    </div>
                  )}
                </div>

                {summary && (
                  <p
                    className="
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
                      rounded-xl
                      border
                      border-purple-200
                      bg-white/80
                      p-4
                      dark:border-purple-900
                      dark:bg-gray-900/70
                    "
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />

                      <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Key Question
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-medium leading-7 text-gray-800 dark:text-gray-200">
                      {data.key_question}
                    </p>
                  </div>
                )}

                {data.confidence &&
                  typeof data.confidence ===
                    "object" && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        data.confidence
                      ).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="
                              rounded-lg
                              border
                              border-gray-200
                              bg-white/70
                              px-3
                              py-2
                              dark:border-gray-800
                              dark:bg-gray-900/60
                            "
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              {key.replaceAll(
                                "_",
                                " "
                              )}
                            </p>

                            <p className="mt-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {String(value)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* ============================================
                BIBLICAL CONNECTIONS
            ============================================ */}

            {crossReferences.length >
              0 && (
              <div className="px-4 py-4 sm:px-5">
                <div className="mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-blue-500" />

                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Biblical Connections
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {crossReferences.map(
                    (ref) => (
                      <button
                        key={ref}
                        type="button"
                        onClick={() =>
                          triggerDecode(
                            ref
                          )
                        }
                        className="
                          rounded-lg
                          border
                          border-gray-200
                          bg-gray-50
                          px-3
                          py-2
                          text-xs
                          font-semibold
                          text-gray-700
                          transition
                          hover:border-blue-300
                          hover:bg-blue-50
                          dark:border-gray-700
                          dark:bg-gray-900
                          dark:text-gray-300
                          dark:hover:border-blue-800
                          dark:hover:bg-blue-950/30
                        "
                      >
                        {ref}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* ============================================
                BIBLICAL CONTEXT
            ============================================ */}

            {(textualContext ||
              primaryReference) && (
              <ExplorerSection
                id="context"
                icon={BookOpen}
                title="Biblical Context"
                defaultOpen
              >
                <div className="space-y-5">
                  {textualContext?.chapter_flow?.length >
                    0 && (
                    <div>
                      <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">
                        Passage Flow
                      </h4>

                      <div className="space-y-2">
                        {textualContext.chapter_flow.map(
                          (item, i) => (
                            <div
                              key={i}
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
                                  h-6
                                  w-6
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-blue-100
                                  text-xs
                                  font-bold
                                  text-blue-700
                                  dark:bg-blue-950
                                  dark:text-blue-300
                                "
                              >
                                {i + 1}
                              </span>

                              <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                                {item}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {data.notes && (
                    <div>
                      <h4 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">
                        Notes
                      </h4>

                      <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
                        {data.notes}
                      </p>
                    </div>
                  )}
                </div>
              </ExplorerSection>
            )}

            {/* ============================================
                HISTORICAL CONTEXT
            ============================================ */}

            {historicalContext && (
              <ExplorerSection
                id="history"
                icon={Landmark}
                title="Historical Context"
              >
                <div className="space-y-5">
                  {historicalContext.period && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Period
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {historicalContext.period}
                      </p>
                    </div>
                  )}

                  {historicalContext.region && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Region
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {historicalContext.region}
                      </p>
                    </div>
                  )}

                  {historicalContext.description && (
                    <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
                      {
                        historicalContext.description
                      }
                    </p>
                  )}

                  {historicalContext.why_it_matters && (
                    <div
                      className="
                        rounded-xl
                        border
                        border-amber-200
                        bg-amber-50
                        p-4
                        dark:border-amber-900
                        dark:bg-amber-950/30
                      "
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />

                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                          Why It Matters
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-7 text-amber-900 dark:text-amber-200">
                        {
                          historicalContext.why_it_matters
                        }
                      </p>
                    </div>
                  )}
                </div>
              </ExplorerSection>
            )}

            {/* ============================================
                INTERPRETATIONS
            ============================================ */}

            {interpretations.length >
              0 && (
              <ExplorerSection
                id="interpretations"
                icon={Brain}
                title="Interpretations"
                defaultOpen
              >
                <div className="space-y-4">
                  {interpretations.map(
                    (item, i) => (
                      <div
                        key={i}
                        className="
                          rounded-xl
                          border
                          border-gray-200
                          p-4
                          dark:border-gray-800
                        "
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {item.name}
                          </h4>

                          {item.type && (
                            <span
                              className="
                                rounded-full
                                bg-gray-100
                                px-2.5
                                py-1
                                text-[11px]
                                font-bold
                                text-gray-600
                                dark:bg-gray-800
                                dark:text-gray-300
                              "
                            >
                              {item.type}
                            </span>
                          )}
                        </div>

                        {item.summary && (
                          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
                            {item.summary}
                          </p>
                        )}

                        {item.evidence?.length >
                          0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                              Supporting Evidence
                            </p>

                            <ul className="space-y-2">
                              {item.evidence.map(
                                (
                                  point,
                                  j
                                ) => (
                                  <li
                                    key={j}
                                    className="text-sm leading-6 text-gray-600 dark:text-gray-300"
                                  >
                                    <span className="mr-2 text-green-500">
                                      •
                                    </span>

                                    {point}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {item.challenges?.length >
                          0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              Challenges
                            </p>

                            <ul className="space-y-2">
                              {item.challenges.map(
                                (
                                  point,
                                  j
                                ) => (
                                  <li
                                    key={j}
                                    className="text-sm leading-6 text-gray-600 dark:text-gray-300"
                                  >
                                    <span className="mr-2 text-amber-500">
                                      •
                                    </span>

                                    {point}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </ExplorerSection>
            )}

            {/* ============================================
                SDA PERSPECTIVE
            ============================================ */}

            {sdaPerspective?.summary && (
              <ExplorerSection
                id="sda"
                icon={ShieldCheck}
                title="SDA Perspective"
              >
                <div
                  className="
                    rounded-xl
                    border
                    border-green-200
                    bg-green-50
                    p-4
                    dark:border-green-900
                    dark:bg-green-950/30
                  "
                >
                  <p className="text-sm leading-7 text-green-900 dark:text-green-200">
                    {
                      sdaPerspective.summary
                    }
                  </p>

                  {sdaPerspective.source && (
                    <div className="mt-4 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />

                      <span className="text-xs font-bold text-green-700 dark:text-green-400">
                        {sdaPerspective.source}
                      </span>
                    </div>
                  )}
                </div>
              </ExplorerSection>
            )}

            {/* ============================================
                EVIDENCE VS INTERPRETATION
            ============================================ */}

            {(
              evidence.textual_facts?.length ||
              evidence.historical_evidence?.length ||
              evidence.interpretive_claims?.length ||
              evidence.speculation?.length
            ) > 0 && (
              <ExplorerSection
                id="evidence"
                icon={Lightbulb}
                title="Evidence vs Interpretation"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    {
                      title: "Textual Facts",
                      items:
                        evidence.textual_facts,
                      className:
                        "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30",
                    },
                    {
                      title:
                        "Historical Evidence",
                      items:
                        evidence.historical_evidence,
                      className:
                        "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30",
                    },
                    {
                      title:
                        "Interpretive Claims",
                      items:
                        evidence.interpretive_claims,
                      className:
                        "border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/30",
                    },
                    {
                      title: "Speculation",
                      items:
                        evidence.speculation,
                      className:
                        "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
                    },
                  ].map(
                    ({
                      title,
                      items,
                      className,
                    }) =>
                      items?.length > 0 ? (
                        <div
                          key={title}
                          className={`rounded-xl border p-4 ${className}`}
                        >
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {title}
                          </h4>

                          <ul className="mt-3 space-y-2">
                            {items.map(
                              (item, i) => (
                                <li
                                  key={i}
                                  className="text-sm leading-6 text-gray-700 dark:text-gray-300"
                                >
                                  • {item}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      ) : null
                  )}
                </div>
              </ExplorerSection>
            )}

            {/* ============================================
                CURIOSITY
            ============================================ */}

            {curiosity.length > 0 && (
              <ExplorerSection
                id="curiosity"
                icon={Search}
                title="Curiosity"
                defaultOpen
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {curiosity.map(
                    (question, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          triggerDecode(
                            question
                          )
                        }
                        className="
                          rounded-xl
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
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold leading-6 text-gray-800 dark:text-gray-200">
                            {question}
                          </p>

                          <Search className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                        </div>

                        <span className="mt-3 block text-xs font-bold text-purple-600 dark:text-purple-400">
                          Explore →
                        </span>
                      </button>
                    )
                  )}
                </div>
              </ExplorerSection>
            )}

            {/* ============================================
                RELATED
            ============================================ */}

            {related.length > 0 && (
              <ExplorerSection
                id="related"
                icon={Link2}
                title="Related Prophecies"
              >
                <div className="flex flex-wrap gap-2">
                  {related.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        triggerDecode(
                          item
                        )
                      }
                      className="
                        rounded-lg
                        border
                        border-gray-200
                        bg-gray-50
                        px-3
                        py-2
                        text-sm
                        font-semibold
                        text-gray-700
                        transition
                        hover:border-blue-300
                        hover:bg-blue-50
                        dark:border-gray-700
                        dark:bg-gray-900
                        dark:text-gray-300
                        dark:hover:border-blue-800
                        dark:hover:bg-blue-950/30
                      "
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </ExplorerSection>
            )}

            {/* ============================================
                SOURCES
            ============================================ */}

            {sources.length > 0 && (
              <ExplorerSection
                id="sources"
                icon={BookOpen}
                title="Sources"
              >
                <div className="space-y-3">
                  {sources.map(
                    (item, i) => {
                      const url = cleanUrl(
                        item?.url
                      );

                      return (
                        <div
                          key={`${item?.title || "source"}-${i}`}
                          className="
                            rounded-xl
                            border
                            border-gray-200
                            p-4
                            transition
                            hover:border-blue-300
                            hover:bg-blue-50
                            dark:border-gray-800
                            dark:hover:border-blue-800
                            dark:hover:bg-blue-950/20
                          "
                        >
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {item.title ||
                                      "Source"}
                                  </h4>

                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {item.publisher ||
                                      "Unknown publisher"}

                                    {item.type
                                      ? ` • ${item.type}`
                                      : ""}
                                  </p>
                                </div>

                                <ExternalLink className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-blue-500" />
                              </div>
                            </a>
                          ) : (
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {item.title ||
                                  "Source"}
                              </h4>

                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {item.publisher ||
                                  "Unknown publisher"}

                                {item.type
                                  ? ` • ${item.type}`
                                  : ""}
                              </p>

                              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                Source URL unavailable.
                              </p>
                            </div>
                          )}

                          {item.supports?.length >
                            0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.supports.map(
                                (topic) => (
                                  <span
                                    key={topic}
                                    className="
                                      rounded-full
                                      bg-gray-100
                                      px-2
                                      py-1
                                      text-[11px]
                                      font-medium
                                      text-gray-600
                                      dark:bg-gray-800
                                      dark:text-gray-300
                                    "
                                  >
                                    {topic}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </ExplorerSection>
            )}

            {/* ============================================
                COPY
            ============================================ */}

            <div className="flex justify-end border-t border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-5">
              <Button
                variant="ghost"
                onClick={() =>
                  handleCopy([entry])
                }
                className="rounded-xl"
              >
                <Copy className="mr-2 h-4 w-4" />

                {copied
                  ? "Copied!"
                  : "Copy Result"}
              </Button>
            </div>
          </article>
        );
      }
    );
  };

  /* =========================================================
     QUICK EXAMPLES
  ========================================================= */

  const quickSearches = useMemo(
    () => [
      {
        label: "666",
        description:
          "The number of the beast",
      },
      {
        label: "Mark of the beast",
        description:
          "Allegiance, worship and commerce",
      },
      {
        label: "Daniel 7",
        description:
          "Four beasts and the little horn",
      },
      {
        label: "Babylon",
        description:
          "The great apocalyptic city",
      },
    ],
    []
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className={`
        w-full
        min-w-0
        px-3
        py-4
        sm:px-5
        sm:py-6
        lg:px-8
        ${
          isDark
            ? "bg-gray-950 text-white"
            : "bg-gray-50 text-gray-900"
        }
      `}
    >
      <div className="mx-auto w-full max-w-7xl space-y-5">

        {/* ===================================================
            DAILY AI INSIGHT
        =================================================== */}

        {aiInsight && (
          <Card
            className={`
              overflow-hidden
              rounded-2xl
              border
              shadow-sm
              ${
                isDark
                  ? "border-gray-800 bg-gray-900"
                  : "border-gray-200 bg-white"
              }
            `}
          >
            <CardContent className="p-4 sm:p-5">
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
                    bg-purple-100
                    dark:bg-purple-950
                  "
                >
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Daily AI Insight
                  </p>

                  <p className="mt-1 text-sm leading-7 text-gray-600 dark:text-gray-300">
                    {aiInsight}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===================================================
            DECODER COMMAND BAR
        =================================================== */}

        <section>
          <div
            className={`
              flex
              flex-col
              gap-2
              rounded-2xl
              border
              p-2
              sm:flex-row
              ${
                isDark
                  ? "border-gray-800 bg-gray-900"
                  : "border-gray-200 bg-white"
              }
            `}
          >
            <Input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleSearchKeyDown
              }
              placeholder="Explore a prophecy, verse, or symbol..."
              aria-label="Prophecy search"
              className={`
                h-12
                border-0
                bg-transparent
                text-base
                shadow-none
                focus:ring-0
                ${
                  isDark
                    ? "text-white placeholder:text-gray-500"
                    : "text-gray-900 placeholder:text-gray-400"
                }
              `}
            />

            <Button
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
                h-12
                shrink-0
                rounded-xl
                px-6
              "
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Decoding...
                </span>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Explore
                </>
              )}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
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
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    px-3
                    py-2
                    text-left
                    transition
                    hover:border-purple-300
                    hover:bg-purple-50
                    dark:border-gray-800
                    dark:bg-gray-900
                    dark:hover:border-purple-800
                    dark:hover:bg-purple-950/30
                  "
                >
                  <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                    {item.label}
                  </span>

                  <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
                    {item.description}
                  </span>
                </button>
              )
            )}
          </div>
        </section>

        {/* ===================================================
            GUEST INFO
        =================================================== */}

        {isGuest && (
          <div
            className="
              flex
              flex-col
              gap-2
              rounded-xl
              border
              border-yellow-200
              bg-yellow-50
              px-4
              py-3
              text-sm
              text-yellow-800
              dark:border-yellow-900
              dark:bg-yellow-950/30
              dark:text-yellow-200
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />

              <span>
                Guest mode
              </span>
            </div>

            <span className="font-semibold">
              {Math.max(
                0,
                5 - guestDecodeCount
              )}
              /5 decodes remaining
            </span>
          </div>
        )}

        {/* ===================================================
            RESULTS
        =================================================== */}

        <section id="prophecy-results">
          <Card
            className={`
              overflow-hidden
              rounded-2xl
              border
              shadow-sm
              ${
                isDark
                  ? "border-gray-800 bg-gray-900"
                  : "border-gray-200 bg-white"
              }
            `}
          >
            <CardHeader className="border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />

                    <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                      Prophecy Explorer
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {timestamp
                      ? `Explored ${timestamp}`
                      : "Decode a prophecy to begin exploring"}
                  </p>
                </div>

                {decodedData.length >
                  0 && (
                  <div className="text-xs font-medium text-gray-400">
                    {decodedData.length}{" "}
                    {decodedData.length ===
                    1
                      ? "result"
                      : "results"}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="px-4 py-16 text-center sm:px-6">
                  <div
                    className="
                      mx-auto
                      mb-4
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-purple-100
                      dark:bg-purple-950
                    "
                  >
                    <Loader2 className="h-7 w-7 animate-spin text-purple-600 dark:text-purple-400" />
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Exploring the prophecy...
                  </h3>

                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Gathering context,
                    interpretations,
                    connections, and
                    sources.
                  </p>
                </div>
              ) : (
                renderDecoded()
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
