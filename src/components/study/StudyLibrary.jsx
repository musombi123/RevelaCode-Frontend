// components/study/StudyLibrary.jsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, BookOpen } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";

const API = "https://revelacode-backend.onrender.com";

export default function StudyLibrary({ onOpen }) {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      const res = await fetch(`${API}/study/materials`);

      if (!res.ok) {
        throw new Error("Failed to load study materials.");
      }

      const data = await res.json();

      setMaterials(data.materials ?? []);
    } catch (err) {
      console.error("Study Library Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return materials.filter((material) =>
      (material.title ?? "").toLowerCase().includes(query)
    );
  }, [materials, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Study Library</h2>

        <p className="text-gray-500">
          Loading study materials...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">
        Study Library
      </h2>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lessons..."
          className="w-full rounded-xl border p-4 pl-12 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-gray-50 p-8 text-center text-gray-500">
          No study materials found.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((material) => (
            <Card
              key={material.id}
              className="cursor-pointer transition-shadow hover:shadow-xl"
              onClick={() => onOpen?.(material)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">
                    {material.title}
                  </h3>

                  <BookOpen className="h-5 w-5 text-indigo-600" />
                </div>

                <p className="mt-3 text-sm text-gray-500">
                  {(material.content ?? "").slice(0, 120)}
                  {(material.content ?? "").length > 120 && "..."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700">
                    {material.category ?? "General"}
                  </span>

                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                    {material.year ?? "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}