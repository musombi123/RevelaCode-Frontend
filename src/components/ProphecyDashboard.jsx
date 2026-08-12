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

// Backend decode endpoint
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
        if (!REVELAAI_URL) return setAiInsight("⚠️ Missing REVELAAI URL.");
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

  // Normalize backend response
  const normalizeDecoded = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.decoded)) return result.decoded;
    if (Array.isArray(result?.data?.decoded)) return result.data.decoded;
    return [{ message: "⚠️ Unexpected response from backend." }];
  };

  // Handle decoding prophecy
  const handleDecode = async () => {
    if (!searchInput.trim()) return;
    if (isGuest && guestDecodeCount >= 5) {
      alert("⚠ Guest limit reached: 5 decodes per day.");
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
        body: JSON.stringify({ verse: searchInput.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDecodedData([{ message: data?.message || `❌ Decode failed (HTTP ${res.status})` }]);
        return;
      }

      const decodedArray = normalizeDecoded(data);
      const finalDecoded = isGuest ? decodedArray.slice(0, 5) : decodedArray;

      setDecodedData(finalDecoded);
      const now = new Date().toLocaleString();
      setTimestamp(now);

      // Only save history for logged-in users
      if (!isGuest && addToHistory) {
        addToHistory({
          id: Date.now(),
          timestamp: now,
          input: searchInput.trim(),
          output: JSON.stringify(finalDecoded, null, 2),
        });
      }

      if (isGuest) setGuestDecodeCount((prev) => prev + 1);
    } catch (err) {
      console.error("❌ Decode error:", err);
      setDecodedData([{ message: "❌ Server error. Try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  // Copy decoded data to clipboard
  const handleCopy = () => {
    if (!decodedData.length) return;
    navigator.clipboard.writeText(JSON.stringify(decodedData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDark = document.documentElement.classList.contains("dark");

  const renderDecoded = () => {
    if (!decodedData.length) return (
      <p className={`text-sm italic ${isDark ? "text-white/70" : "text-black/70"}`}>
        🧘 Enter a prophecy above and press "Decode" to see symbolic insights.
      </p>
    );

    return decodedData.map((entry, idx) => {
      if (entry?.message) return (
        <div key={idx} className={`border rounded-lg p-3 ${isDark ? "bg-red-900 text-red-300" : "bg-red-50 text-red-600"}`}>
          {entry.message}
        </div>
      );

      const symbolKey = Object.keys(entry)[0];
      const data = entry[symbolKey];

      return (
        <div key={idx} className={`border rounded-lg p-3 space-y-1 ${isDark ? "bg-gray-800 text-white" : "bg-gray-50 text-black"}`}>
          <h3 className={`text-lg font-semibold ${isDark ? "text-purple-400" : "text-purple-600"}`}>
            🔮 {symbolKey}
          </h3>
          {data.meaning && <p><strong>🗝 Meaning:</strong> {data.meaning}</p>}
          {data.interpretation && <p><strong>🧠 Interpretation:</strong> {data.interpretation}</p>}
          {data.status && <p><strong>🚦 Status:</strong> {data.status}</p>}
          {data.fulfilled && <p><strong>✅ Fulfilled:</strong> {data.fulfilled}</p>}
          {data.reference && <p className={`text-blue-600 ${isDark ? "dark:text-blue-400" : ""}`}>📖 {data.reference}</p>}
          {data.notes && <p className={`italic ${isDark ? "text-white/70" : "text-black/70"}`}>💡 {data.notes}</p>}
          {Array.isArray(data.tags) && <p className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Tags: {data.tags.join(", ")}</p>}
        </div>
      );
    });
  };

  return (
    <div className={` 
      w-full min-w-0
      px-3 sm:px-5 lg:px-8
      py-4 sm:py-6
      ${isDark ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}
    `}
   >

      {/* Decode Input */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="✍️ Enter prophecy, verse, or symbolic message..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={`text-base ${isDark ? "text-white bg-gray-900" : "text-black bg-white"}`}
        />
        <Button
          onClick={handleDecode}
          disabled={loading || !searchInput.trim() || (isGuest && guestDecodeCount >= 5)}
          className="sm:w-auto"
        >
          {loading ? <span className="flex items-center gap-1"><Loader2 className="animate-spin h-4 w-4" />Decoding...</span> : "Decode"}
        </Button>
      </div>

      {/* Guest info */}
      {isGuest && (
        <div className={`flex items-center justify-between px-4 py-2 mb-4 rounded text-xs ${isDark ? "bg-yellow-800 text-yellow-200" : "bg-yellow-100 text-yellow-700"}`}>
          👤 Guest Mode - Uses left: {Math.max(0, 5 - guestDecodeCount)}/5
        </div>
      )}

      {/* Decoded Results */}
      <Card className={`${isDark ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-2xl shadow-md flex-1 overflow-y-auto`}>
        <CardHeader>
          <h2 className="text-xl font-bold">🧾 Decoded Prophecy</h2>
          <p className="text-sm text-gray-500">{timestamp || "No prophecy decoded yet."}</p>
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
