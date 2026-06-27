"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

const API = "https://revelacode-backend.onrender.com";

export default function StudyFeed({ onOpen }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      setLoading(true);

      const res = await fetch(`${API}/study/materials`);

      if (!res.ok) {
        throw new Error("Unable to load materials");
      }

      const data = await res.json();

      setMaterials(data.materials || []);
    } catch (err) {
      console.error("Study feed error:", err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">
        Loading study materials...
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="py-16 text-center">
        <BookOpen className="mx-auto mb-4 h-10 w-10 text-gray-400" />

        <h2 className="text-xl font-bold">No materials available</h2>

        <p className="mt-2 text-gray-500">
          Upload study content from the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Study Library</h1>

        <p className="mt-2 text-gray-500">
          Browse lessons and study resources.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {materials.map((material) => {
          const id = material.id || material._id;

          return (
            <Card
              key={id}
              className="cursor-pointer transition hover:-translate-y-1 hover:shadow-xl"
              onClick={() =>
                onOpen?.({
                  ...material,
                  id,
                })
              }
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                  <Bookmark className="h-5 w-5 text-gray-400" />
                </div>

                <h2 className="mt-4 font-bold">
                  {material.title || "Untitled"}
                </h2>

                <p className="mt-3 line-clamp-3 text-sm text-gray-500">
                  {material.content
                    ? material.content.slice(0, 120) +
                      (material.content.length > 120 ? "..." : "")
                    : "No preview"}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700">
                    {material.category || "General"}
                  </span>

                  <span className="text-xs text-gray-400">
                    Open →
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}