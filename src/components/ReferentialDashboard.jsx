import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  BookOpen,
  Link2,
  Brain,
  Clock,
  Languages,
  Bot
} from "lucide-react";

const FEATURES = [
  {
    key: "cross",
    title: "Biblical Cross-References",
    description: "Navigate connected verses and themes",
    icon: Link2,
    status: "planned"
  },
  {
    key: "commentary",
    title: "Commentary & Historical Context",
    description: "Understand the time, place, and language",
    icon: BookOpen,
    status: "planned"
  },
  {
    key: "symbols",
    title: "Symbol / Number Decoder",
    description: "Explore symbolic meanings in scripture",
    icon: Brain,
    status: "active"
  },
  {
    key: "timeline",
    title: "Prophetic Timeline Viewer",
    description: "Interactive view of prophecy fulfillment",
    icon: Clock,
    status: "future"
  },
  {
    key: "roots",
    title: "Root Word Explorer",
    description: "Hebrew / Greek word origins",
    icon: Languages,
    status: "planned"
  },
  {
    key: "ai",
    title: "AI-Assisted Insights",
    description: "RevelaAI correlations & doctrine",
    icon: Bot,
    status: "active"
  }
];

export default function ReferentialDashboard() {
  const [activeFeature, setActiveFeature] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorAI, setErrorAI] = useState("");

  const REVELAAI_URL = import.meta.env.VITE_REVELAAI_URL || "https://revelaai.onrender.com";

  // --- Fetch AI insights whenever the AI feature is active ---
  useEffect(() => {
    if (activeFeature?.key !== "ai") return;

    const fetchInsights = async () => {
      setLoadingAI(true);
      setErrorAI("");
      try {
        const res = await fetch(`${REVELAAI_URL}/api/daily-insights`);
        if (!res.ok) throw new Error(`Failed to fetch AI insights: ${res.status}`);
        const data = await res.json();
        setAiInsights(data.insights || "No insights available today.");
      } catch (err) {
        console.error(err);
        setErrorAI("❌ Unable to load AI insights. Try again later.");
      } finally {
        setLoadingAI(false);
      }
    };

    fetchInsights();
  }, [activeFeature]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">
          📚 Referential Study
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Deep scriptural connections, symbolism, and prophetic context
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;

          return (
            <Card
              key={f.key}
              onClick={() => setActiveFeature(f)}
              className="cursor-pointer hover:shadow-xl transition border dark:border-gray-800 relative overflow-hidden"
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="font-medium">{f.title}</h3>
                  <p className="text-xs text-gray-500">{f.description}</p>
                </div>
              </CardHeader>

              <CardContent>
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded ${
                    f.status === "active"
                      ? "bg-green-100 text-green-700"
                      : f.status === "planned"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {f.status === "active"
                    ? "Available"
                    : f.status === "planned"
                    ? "Coming Soon"
                    : "Planned"}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Panel */}
      {activeFeature && (
        <Card className="border dark:border-gray-800">
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{activeFeature.title}</h3>
            <button
              onClick={() => setActiveFeature(null)}
              className="text-sm text-gray-500 hover:underline"
            >
              Close
            </button>
          </CardHeader>

          <CardContent>
            {activeFeature.status !== "active" ? (
              <div className="text-sm text-gray-500 space-y-2">
                <p>🚧 This feature is under development.</p>
                <p>Backend endpoints and AI models will power this module in upcoming versions.</p>
              </div>
            ) : activeFeature.key === "ai" ? (
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {loadingAI ? (
                  <p>🔄 Fetching today’s AI insights...</p>
                ) : errorAI ? (
                  <p>{errorAI}</p>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: aiInsights }} />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This module is live and integrated with RevelaCode’s symbolic prophecy engine.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
