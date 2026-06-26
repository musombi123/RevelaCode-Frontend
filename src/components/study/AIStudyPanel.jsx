// components/study/AIStudyPanel.jsx

"use client";

import React, { useState } from "react";
import { Bot } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";

const API = "https://revelacode-backend.onrender.com";

export default function AIStudyPanel({ material }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function askAI() {
    if (!question.trim() || !material?.id || loading) return;

    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch(`${API}/study/ask-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          material_id: material.id,
          question: question.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get AI response.");
      }

      const data = await res.json();

      setAnswer(data.answer ?? "No response available.");
    } catch (err) {
      console.error("AI Study Error:", err);
      setAnswer("AI is currently unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-600" />

          <h2 className="font-bold text-lg">
            AI Study Assistant
          </h2>
        </div>

        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              askAI();
            }
          }}
          placeholder="Ask a question about this lesson..."
          disabled={loading}
          className="w-full rounded-lg border p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
        />

        <button
          onClick={askAI}
          disabled={loading || !question.trim()}
          className="mt-4 w-full rounded-lg bg-indigo-600 p-3 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>

        {answer && (
          <div className="mt-5 rounded-lg bg-gray-100 p-4 whitespace-pre-wrap">
            {answer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}