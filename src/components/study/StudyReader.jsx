// components/study/StudyReader.jsx

"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Download } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";
import AIStudyPanel from "./AIStudyPanel";

const API = "https://revelacode-backend.onrender.com";

export default function StudyReader({ materialId, onBack }) {
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    if (materialId) {
      loadMaterial();
    }
  }, [materialId]);

  async function loadMaterial() {
    try {
      setLoading(true);

      const res = await fetch(`${API}/study/material/${materialId}`);

      if (!res.ok) {
        throw new Error("Failed to load lesson.");
      }

      const data = await res.json();

      setMaterial(data.material ?? null);
    } catch (err) {
      console.error("Study Reader Error:", err);
      setMaterial(null);
    } finally {
      setLoading(false);
    }
  }

  async function bookmark() {
    if (bookmarking) return;

    try {
      setBookmarking(true);

      const res = await fetch(`${API}/study/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "001",
          material_id: materialId,
        }),
      });

      if (!res.ok) {
        throw new Error("Bookmark failed.");
      }
    } catch (err) {
      console.error("Bookmark Error:", err);
    } finally {
      setBookmarking(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-gray-500">
        Loading lesson...
      </div>
    );
  }

  if (!material) {
    return (
      <div className="p-10 text-center text-gray-500">
        Lesson not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-gray-100"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold">
                  {material.title}
                </h1>

                <div className="flex gap-2">
                  <button
                    onClick={bookmark}
                    disabled={bookmarking}
                    className="rounded border p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Bookmark lesson"
                  >
                    <Bookmark className="h-5 w-5" />
                  </button>

                  <button
                    className="rounded border p-2 transition hover:bg-gray-100"
                    title="Download lesson"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                  {material.category ?? "General"}
                </span>

                <span className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700">
                  {material.year ?? "N/A"}
                </span>
              </div>

              <div className="mt-8 whitespace-pre-wrap leading-8 text-gray-700">
                {material.content}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <AIStudyPanel material={material} />
        </div>
      </div>
    </div>
  );
}