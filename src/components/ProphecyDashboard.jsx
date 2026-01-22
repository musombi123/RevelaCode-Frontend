// src/components/ProphecyDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHistory } from "@/context/HistoryContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { CopyIcon, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const REVELAAI_URL = import.meta.env.VITE_REVELAAI_URL;

// 👇 Always build endpoints like this so it stays consistent everywhere
const PROPHECY_DECODE_ENDPOINT = `${API_URL}/api/prophecy/decode`;

export default function ProphecyDashboard() {
  const { user, isGuest } = useAuth();
  const { addToHistory } = useHistory();

  const [searchInput, setSearchInput] = useState("");
  const [decodedData, setDecodedData] = useState([]);
  const [timestamp, setTimestamp] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestDecodeCount, setGuestDecodeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [aiInsight, setAiInsight] = useState("");

  // Persist guest decode count
  useEffect(() => {
    const savedCount = localStorage.getItem("guestDecodeCount");
    if (savedCount) setGuestDecodeCount(Number(savedCount));
  }, []);

  useEffect(() => {
    localStorage.setItem("guestDecodeCount", guestDecodeCount);
  }, [guestDecodeCount]);

  // Fetch daily AI insight
  useEffect(() => {
    const fetchAIInsight = async () => {
      try {
        if (!REVELAAI_URL) {
          setAiInsight("⚠️ Missing REVELAAI URL in env.");
          return;
        }

        const res = await fetch(`${REVELAAI_URL}/daily-insights`);
        const data = await res.json();

        setAiInsight(data?.insight || "No insight available today.");
      } catch (err) {
        console.error("❌ Failed to fetch AI insight:", err);
        setAiInsight("⚠️ Failed to load daily AI insight.");
      }
    };

    fetchAIInsight();
  }, []);

  const normalizeDecoded = (result) => {
    /**
     * We accept multiple backend shapes:
     * 1) { decoded: [...] }
     * 2) { data: { decoded: [...] } }
     * 3) { symbols: [...] }
     * 4) direct array [...]
     */
    if (Array.isArray(result)) return result;

    if (Array.isArray(result?.decoded)) return result.decoded;
    if (Array.isArray(result?.data?.decoded)) return result.data.decoded;

    if (Array.isArray(result?.symbols)) return result.symbols;
    if (Array.isArray(result?.data?.symbols)) return result.data.symbols;

    return [];
  };

  const handleDecode = async () => {
    if (isGuest && guestDecodeCount >= 5) {
      alert("⚠ Guest mode limit reached: Only 5 decodes per day.");
      return;
    }

    const trimmedInput = searchInput.trim();
    if (!trimmedInput) return;

    if (!API_URL) {
      setDecodedData([{ message: "❌ Missing API URL in env (VITE_API_URL)." }]);
      return;
    }

    setLoading(true);
    setDecodedData([]);
    setTimestamp("");
    setCopied(false);

    try {
      const res = await fetch(PROPHECY_DECODE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verse: trimmedInput }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        setDecodedData([
          {
            message:
              result?.error ||
              result?.message ||
              `❌ Decode failed (HTTP ${res.status})`,
          },
        ]);
        return;
      }

      const decodedArray = normalizeDecoded(result);

      if (!decodedArray.length) {
        setDecodedData([
          { message: "⚠️ No symbolic meaning detected in this prophecy." },
        ]);
        return;
      }

      const finalDecoded = isGuest ? decodedArray.slice(0, 5) : decodedArray;

      setDecodedData(finalDecoded);

      const now = new Date().toLocaleString();
      setTimestamp(now);

      addToHistory?.({
        id: Date.now(),
        timestamp: now,
        input: trimmedInput,
        output: JSON.stringify(finalDecoded, null, 2),
      });

      if (isGuest) setGuestDecodeCount((prev) => prev + 1);
    } catch (err) {
      console.error("❌ Decode error:", err);
      setDecodedData([{ message: "❌ Server error. Try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!decodedData.length) return;
    navigator.clipboard.writeText(JSON.stringify(decodedData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDark = document.documentElement.classList.contains("dark");

  const renderDecoded = () => {
    if (!decodedData.length) {
      return (
        <p
          className={`text-sm italic ${
            isDark ? "text-white/70" : "text-black/70"
          }`}
        >
          🧘 Enter a prophecy above and press "Decode" to see symbolic insights.
        </p>
      );
    }

    return decodedData.map((entry, idx) => {
      // if backend sends message-only objects
      if (entry?.message) {
        return (
          <div
            key={idx}
            className={`border rounded-lg p-3 ${
              isDark
                ? "bg-red-900 text-red-300"
                : "bg-red-50 text-red-600"
            }`}
          >
            {entry.message}
          </div>
        );
      }

      // Expected structure: { "symbol": { meaning, interpretation, ... } }
      if (typeof entry !== "object" || entry === null) {
        return (
          <div
            key={idx}
            className={`border rounded-lg p-3 ${
              isDark ? "bg-gray-800 text-white" : "bg-gray-50 text-black"
            }`}
          >
            ⚠️ Unexpected decode format
          </div>
        );
      }

      const symbolKey = Object.keys(entry)[0];
      const data = entry?.[symbolKey] || {};

      return (
        <div
          key={idx}
          className={`border rounded-lg p-3 space-y-1 ${
            isDark ? "bg-gray-800 text-white" : "bg-gray-50 text-black"
          }`}
        >
          <h3
            className={`text-lg font-semibold ${
              isDark ? "text-purple-400" : "text-purple-600"
            }`}
          >
            🔮 {symbolKey || "Unknown Symbol"}
          </h3>

          {data.meaning && (
            <p>
              <strong>🗝 Meaning:</strong> {data.meaning}
            </p>
          )}
          {data.interpretation && (
            <p>
              <strong>🧠 Interpretation:</strong> {data.interpretation}
            </p>
          )}
          {data.status && (
            <p>
              <strong>🚦 Status:</strong> {data.status}
            </p>
          )}
          {data.fulfilled && (
            <p>
              <strong>✅ Fulfilled:</strong> {data.fulfilled}
            </p>
          )}
          {data.reference && (
            <p className={`text-blue-600 ${isDark ? "dark:text-blue-400" : ""}`}>
              📖 {data.reference}
            </p>
          )}
          {data.notes && (
            <p className={`italic ${isDark ? "text-white/70" : "text-black/70"}`}>
              💡 {data.notes}
            </p>
          )}
          {Array.isArray(data.tags) && data.tags.length > 0 && (
            <p className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>
              Tags: {data.tags.join(", ")}
            </p>
          )}
        </div>
      );
    });
  };

  return (
    <div
      className={`flex flex-col min-h-screen p-6 ${
        isDark ? "bg-gray-950" : "bg-gray-100"
      }`}
    >
      {/* Greeting & AI Insight */}
      <div className="space-y-2 mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-black"}`}>
          🌟 Welcome, {user?.full_name || "Guest"}!
        </h1>

        <Card
          className={`${
            isDark ? "bg-gray-800 text-white" : "bg-white text-black"
          } rounded-2xl shadow-md`}
        >
          <CardContent>
            <h2 className="font-semibold text-lg">🤖 Daily AI Insight</h2>
            <p className="text-sm mt-1">{aiInsight}</p>
          </CardContent>
        </Card>
      </div>

      {/* Decode Input */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="✍️ Enter prophecy, verse, or symbolic message..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={`text-base ${
            isDark ? "text-white bg-gray-900" : "text-black bg-white"
          }`}
        />

        <Button
          onClick={handleDecode}
          disabled={loading || !searchInput.trim() || (isGuest && guestDecodeCount >= 5)}
          className="sm:w-auto"
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="animate-spin h-4 w-4" />
              Decoding...
            </span>
          ) : (
            "Decode"
          )}
        </Button>
      </div>

      {/* Guest info */}
      {isGuest && (
        <div
          className={`flex items-center justify-between px-4 py-2 mb-4 rounded text-xs ${
            isDark
              ? "bg-yellow-800 text-yellow-200"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          👤 Guest Mode - Uses left: {Math.max(0, 5 - guestDecodeCount)}/5
        </div>
      )}

      {/* Decoded Results */}
      <Card
        className={`${
          isDark ? "bg-gray-800 text-white" : "bg-white text-black"
        } rounded-2xl shadow-md flex-1 overflow-y-auto`}
      >
        <CardHeader>
          <h2 className="text-xl font-bold">🧾 Decoded Prophecy</h2>
          <p className="text-sm text-gray-500">
            {timestamp || "No prophecy decoded yet."}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {renderDecoded()}

          {decodedData.length > 0 && (
            <div className="text-right">
              <Button variant="ghost" onClick={handleCopy}>
                <CopyIcon className="w-4 h-4 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
