// components/study/RecommendationsPanel.jsx

"use client";

import React, { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/Card";

const API = "https://revelacode-backend.onrender.com";

export default function RecommendationsPanel({ onOpen }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      const res = await fetch(`${API}/study/recommend/001`);

      if (!res.ok) {
        throw new Error("Failed to fetch recommendations.");
      }

      const data = await res.json();

      setMaterials(data.materials ?? []);
    } catch (err) {
      console.error("Recommendations Error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-bold">
          Recommended For You
        </h2>

        <p className="text-gray-500">
          Loading recommendations...
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">
        Recommended For You
      </h2>

      {materials.length === 0 ? (
        <p className="text-gray-500">
          No recommendations available.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {materials.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer transition-shadow hover:shadow-xl"
              onClick={() => onOpen?.(item)}
            >
              <CardContent className="p-5">
                <h3 className="font-bold">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm text-gray-500">
                  {(item.content ?? "").slice(0, 90)}
                  {(item.content ?? "").length > 90 && "..."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}