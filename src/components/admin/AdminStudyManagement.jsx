"use client";

import React, { useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card.jsx";
import { useAdminApi } from "@/services/adminApi.jsx";

const EMPTY_FORM = {
  title: "",
  category: "",
  subcategory: "",
  content: "",
  year: "",
  tags: "",
};

export default function AdminStudyManagement() {
  const adminApi = useAdminApi();
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadMaterial(event) {
    event.preventDefault();
    if (loading) return;
    if (!form.title.trim() || !form.category.trim() || !form.subcategory.trim()) {
      setMessageType("error");
      setMessage("Title, category and subcategory are required.");
      return;
    }
    if (!file && !form.content.trim()) {
      setMessageType("error");
      setMessage("Add study content or select a PDF, DOCX or TXT file.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      let payload;
      if (file) {
        payload = new FormData();
        payload.append("file", file);
        payload.append("title", form.title.trim());
        payload.append("category", form.category.trim());
        payload.append("subcategory", form.subcategory.trim());
        payload.append("year", form.year.trim());
        payload.append("tags", JSON.stringify(form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)));
      } else {
        payload = {
          title: form.title.trim(),
          category: form.category.trim(),
          subcategory: form.subcategory.trim(),
          year: form.year.trim(),
          content: form.content.trim(),
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        };
      }

      const response = await adminApi.platform.uploadStudyMaterial(payload);
      setMessageType("success");
      setMessage(response?.message || response?.result?.message || "Study material was submitted to the existing Study service.");
      setForm(EMPTY_FORM);
      setFile(null);
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "Study material could not be uploaded.");
    } finally {
      setLoading(false);
    }
  }

  async function publishFaithStarterLibrary() {
    if (seeding) return;
    if (!window.confirm("Publish or refresh the reviewed RevelaCode Faith starter catalogue in the existing Study library? Ordinary uploaded materials are preserved.")) return;
    setSeeding(true);
    setMessage("");
    try {
      const response = await adminApi.post("/api/study/seed-faith-catalog", {});
      const inserted = Number(response?.inserted || 0);
      const updated = Number(response?.updated || 0);
      const skipped = Number(response?.skipped_existing || 0);
      const errors = Array.isArray(response?.errors) ? response.errors.length : 0;
      setMessageType(errors ? "error" : "success");
      setMessage(`Faith starter catalogue processed: ${inserted} added, ${updated} refreshed, ${skipped} existing title(s) preserved, ${errors} reported error(s). Open Faith → Study Library and refresh to load the lessons.`);
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "Could not publish the Faith starter catalogue.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><BookOpen size={22} /></div>
            <div><h2 className="text-2xl font-black text-slate-950 dark:text-white">Study Hub Management</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Manage the existing study material service. Publish reviewed, source-linked Faith lessons, or upload material with clear category metadata. New records use the existing RevelaCode database and API.</p></div>
          </div>
          <button type="button" onClick={publishFaithStarterLibrary} disabled={seeding} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><Sparkles size={15} />{seeding ? "Publishing…" : "Publish Faith starter studies"}</button>
        </div>
      </section>

      {message ? <div role={messageType === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${messageType === "error" ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"}`}>{messageType === "error" ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}{message}</div> : null}

      <Card><CardContent className="space-y-4 p-4 sm:p-6">
        <div><h3 className="font-black text-slate-950 dark:text-white">Upload a study resource</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The content is written to the existing study material catalogue, not a new separate library.</p></div>
        <form onSubmit={uploadMaterial} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Title</span><input required maxLength={180} value={form.title} onChange={(event) => updateField("title", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Category</span><select required value={form.category} onChange={(event) => updateField("category", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">Choose a category</option><option value="faith">Faith & Scripture</option><option value="education">Elimu / Education</option><option value="general">General</option><option value="science">Science</option><option value="technology">Technology</option></select></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Subcategory</span><input required maxLength={100} value={form.subcategory} onChange={(event) => updateField("subcategory", event.target.value)} placeholder="e.g. Bible study, SDA quarterly, lesson" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Year (optional)</span><input maxLength={20} value={form.year} onChange={(event) => updateField("year", event.target.value)} placeholder="e.g. 2026" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold">Tags (comma separated)</span><input value={form.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="scripture, reference, beginner" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold">Text content</span><textarea rows={9} value={form.content} onChange={(event) => updateField("content", event.target.value)} placeholder="Paste or write the source-grounded lesson text…" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
            <label className="flex items-center gap-2 text-sm font-semibold"><FileText size={16} /> Or upload PDF / DOCX / TXT</label>
            <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-bold dark:text-slate-300 dark:file:bg-slate-800" />
            {file ? <p className="mt-2 text-xs text-slate-500">Selected: {file.name}. When a file is chosen, the upload uses its contents and metadata.</p> : null}
          </div>
          <button type="submit" disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><FileText size={16} />{loading ? "Submitting material…" : "Upload study material"}</button>
        </form>
      </CardContent></Card>
    </div>
  );
}
