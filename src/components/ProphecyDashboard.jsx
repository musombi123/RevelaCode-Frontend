// src/components/ProphecyDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { CopyIcon, Loader2 } from "lucide-react";
import { useHistory } from "@/context/HistoryContext";

export default function ProphecyDashboard() {
  const { user, isGuest } = useAuth();
  const { addToHistory } = useHistory();

  const [searchInput, setSearchInput] = useState("");
  const [decodedData, setDecodedData] = useState([]);
  const [timestamp, setTimestamp] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestDecodeCount, setGuestDecodeCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // persist guest decode limit
  useEffect(() => {
    const savedCount = localStorage.getItem("guestDecodeCount");
    if (savedCount) setGuestDecodeCount(Number(savedCount));
  }, []);

  useEffect(() => {
    localStorage.setItem("guestDecodeCount", guestDecodeCount);
  }, [guestDecodeCount]);

  const handleDecode = async () => {
    if (isGuest && guestDecodeCount >= 5) {
      alert("⚠ Guest mode limit reached: Only 5 decodes per day.");
      return;
    }

    const trimmedInput = searchInput.trim();
    if (!trimmedInput) return;

    setLoading(true);
    setDecodedData([]);
    setTimestamp("");
    setCopied(false);

    try {
      const res = await fetch(`${baseUrl}/decode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verse: trimmedInput }),
      });

      const result = await res.json();

      if (res.ok && Array.isArray(result.decoded)) {
        // ✅ Restrict to 5 results in guest mode
        const finalDecoded = isGuest
          ? result.decoded.slice(0, 5)
          : result.decoded;

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
      } else {
        setDecodedData([
          {
            message:
              result.error ||
              "⚠️ No symbolic meaning detected in this prophecy.",
          },
        ]);
      }
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

  const renderDecoded = () => {
    if (!decodedData.length) {
      return (
        <p className="text-gray-500 dark:text-gray-400 text-sm italic">
          🧘 Enter a prophecy above and press "Decode" to see symbolic insights.
        </p>
      );
    }

    return decodedData.map((entry, idx) => {
      if (entry.message) {
        return (
          <div
            key={idx}
            className="border rounded-lg p-3 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300"
          >
            {entry.message}
          </div>
        );
      }

      const symbolKey = Object.keys(entry)[0];
      const data = entry[symbolKey] || {};

      return (
        <div
          key={idx}
          className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 space-y-1"
        >
          <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            🔮 {symbolKey || "Unknown Symbol"}
          </h3>

          {data.meaning && <p><strong>🗝 Meaning:</strong> {data.meaning}</p>}
          {data.interpretation && <p><strong>🧠 Interpretation:</strong> {data.interpretation}</p>}
          {data.status && <p><strong>🚦 Status:</strong> {data.status}</p>}
          {data.fulfilled && <p><strong>✅ Fulfilled:</strong> {data.fulfilled}</p>}
          {data.reference && <p className="text-blue-600 dark:text-blue-400">📖 {data.reference}</p>}
          {data.notes && <p className="italic text-gray-500 dark:text-gray-400">💡 {data.notes}</p>}
          {data.tags?.length > 0 && (
            <p className="text-xs text-gray-500">Tags: {data.tags.join(", ")}</p>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {isGuest && (
        <div className="flex items-center justify-between bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 px-4 py-2 rounded text-xs">
          👤 <span>Guest Mode - Uses left: {Math.max(0, 5 - guestDecodeCount)}/5</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="✍️ Enter prophecy, verse, or symbolic message..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="text-base flex-1"
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

      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border p-4">
        <CardHeader>
          <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-300">
            🧾 Decoded Prophecy
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
