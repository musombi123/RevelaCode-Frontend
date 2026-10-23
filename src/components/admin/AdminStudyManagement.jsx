"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

const API = (
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");

export default function AdminStudyManagement() {

  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "",
    category: "",
    subcategory: "",
    content: "",
    year: "",
    tags: "",
  });

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const [seeding, setSeeding] = useState(false);

  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  }

  async function uploadMaterial() {

    if (
      !form.title.trim() ||
      !form.category.trim() ||
      !form.subcategory.trim()
    ) {
      setMessage("Title, Category and Subcategory are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {

      // ---------------- FILE UPLOAD ----------------

      if (file) {

        const data = new FormData();

        data.append("file", file);
        data.append("title", form.title);
        data.append("category", form.category);
        data.append("subcategory", form.subcategory);
        data.append("year", form.year);

        data.append(
          "tags",
          JSON.stringify(
            form.tags
              .split(",")
              .map(t => t.trim())
              .filter(Boolean)
          )
        );

        const response = await fetch(
          `${API}/api/admin/study/upload-file`,
          {
            method: "POST",
            headers: {
              "X-API-KEY": user?.apiKey || "",
            },
            body: data,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Upload failed.");
        }

        setMessage(result.message);

      }

      // ---------------- TEXT UPLOAD ----------------

      else {

        if (!form.content.trim()) {
          throw new Error("Study content is required.");
        }

        const payload = {

          ...form,

          tags: form.tags
            .split(",")
            .map(t => t.trim())
            .filter(Boolean)

        };

        const response = await fetch(
          `${API}/api/study/upload`,
          {
            method: "POST",
            headers: {

              "Content-Type": "application/json",

              "X-API-KEY": user?.apiKey || ""

            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Upload failed.");
        }

        setMessage(result.message);

      }

      setForm({
        title: "",
        category: "",
        subcategory: "",
        content: "",
        year: "",
        tags: "",
      });

      setFile(null);

    }

    catch (err) {

      console.error(err);

      setMessage(err.message);

    }

    finally {

      setLoading(false);

    }

  }

  async function publishFaithStarterLibrary() {
    if (seeding) return;
    setSeeding(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/study/seed-faith-catalog`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "X-API-KEY": user?.apiKey || "",
        },
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || result?.error || `Catalogue publish failed (${response.status}).`);
      }

      const inserted = Number(result.inserted || 0);
      const updated = Number(result.updated || 0);
      const skipped = Number(result.skipped_existing || 0);
      const errors = Array.isArray(result.errors) ? result.errors.length : 0;
      setMessage(
        `Faith starter catalogue processed: ${inserted} added, ${updated} refreshed, ${skipped} existing title(s) preserved, ${errors} error(s). Open Faith → Study Library and refresh to load the curated lessons.`
      );
    } catch (err) {
      console.error("Faith catalogue publish error:", err);
      setMessage(err?.message || "Could not publish the Faith starter catalogue.");
    } finally {
      setSeeding(false);
    }
  }

  return (

    <Card className="shadow-lg">

      <CardContent className="p-6 space-y-5">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Study Hub Management
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
              Publish original, source-linked Faith lessons into the existing study library. Re-running the action refreshes only RevelaCode-curated records and preserves ordinary uploaded materials.
            </p>
          </div>
          <button
            type="button"
            onClick={publishFaithStarterLibrary}
            disabled={seeding}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {seeding ? "Publishing catalogue…" : "Publish Faith starter studies"}
          </button>
        </div>

        {message && (

          <div className="rounded-lg bg-gray-100 border p-3">

            {message}

          </div>

        )}

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Title"
          value={form.title}
          onChange={(e)=>updateField("title",e.target.value)}
        />

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Category"
          value={form.category}
          onChange={(e)=>updateField("category",e.target.value)}
        />

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Subcategory"
          value={form.subcategory}
          onChange={(e)=>updateField("subcategory",e.target.value)}
        />

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Year"
          value={form.year}
          onChange={(e)=>updateField("year",e.target.value)}
        />

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={(e)=>updateField("tags",e.target.value)}
        />

        <textarea
          rows={10}
          className="w-full border rounded-lg p-3"
          placeholder="Study Material (leave empty if uploading a file)"
          value={form.content}
          onChange={(e)=>updateField("content",e.target.value)}
        />

        <div className="border-2 border-dashed rounded-xl p-6">

          <label className="font-semibold block mb-2">

            Upload PDF / DOCX / TXT

          </label>

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e)=>setFile(e.target.files[0])}
          />

          {file && (

            <p className="mt-3 text-sm text-green-600">

              Selected: {file.name}

            </p>

          )}

        </div>

        <Button
          className="w-full"
          disabled={loading}
          onClick={uploadMaterial}
        >

          {loading
            ? "Uploading..."
            : "Upload Study Material"}

        </Button>

      </CardContent>

    </Card>

  );

}
