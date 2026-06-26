"use client";

import React, { useState } from "react";

const API = "https://revelacode-backend.onrender.com";

export default function AdminStudyManagement() {
  const [form, setForm] = useState({
    title: "",
    category: "",
    subcategory: "",
    content: "",
    year: "",
    tags: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function uploadMaterial() {
    if (
      !form.title.trim() ||
      !form.category.trim() ||
      !form.content.trim()
    ) {
      setMessage("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch(`${API}/study/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Upload failed.");
      }

      const data = await response.json();

      setMessage(data.message || "Study material uploaded successfully.");

      setForm({
        title: "",
        category: "",
        subcategory: "",
        content: "",
        year: "",
        tags: "",
      });
    } catch (error) {
      console.error(error);
      setMessage("Unable to upload study material.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
      <h2 className="text-2xl font-bold">
        Study Hub Management
      </h2>

      {message && (
        <div className="rounded-lg bg-gray-100 p-3 text-sm">
          {message}
        </div>
      )}

      <input
        value={form.title}
        onChange={(e) => updateField("title", e.target.value)}
        placeholder="Title"
        className="w-full rounded border p-3"
      />

      <input
        value={form.category}
        onChange={(e) => updateField("category", e.target.value)}
        placeholder="Category"
        className="w-full rounded border p-3"
      />

      <input
        value={form.subcategory}
        onChange={(e) => updateField("subcategory", e.target.value)}
        placeholder="Subcategory"
        className="w-full rounded border p-3"
      />

      <input
        value={form.year}
        onChange={(e) => updateField("year", e.target.value)}
        placeholder="Year"
        className="w-full rounded border p-3"
      />

      <input
        value={form.tags}
        onChange={(e) => updateField("tags", e.target.value)}
        placeholder="Tags (comma separated)"
        className="w-full rounded border p-3"
      />

      <textarea
        rows={10}
        value={form.content}
        onChange={(e) => updateField("content", e.target.value)}
        placeholder="Study content"
        className="w-full rounded border p-3"
      />

      <button
        onClick={uploadMaterial}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Uploading..." : "Upload Study Material"}
      </button>
    </div>
  );
}