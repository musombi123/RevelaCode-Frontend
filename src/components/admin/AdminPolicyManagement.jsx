"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card.jsx";
import { useAdminApi } from "@/services/adminApi.jsx";

const DOCUMENTS = [
  { value: "terms", label: "Terms of Service", description: "Rules governing use of RevelaCode and its ecosystem." },
  { value: "privacy", label: "Privacy Policy", description: "Personal data handling, access, retention and user rights." },
  { value: "cookies", label: "Cookie Policy", description: "Cookie and local-storage usage disclosures." },
  { value: "community_guidelines", label: "Community Guidelines", description: "Community safety, content rules and reporting expectations." },
  { value: "support_policy", label: "Support Policy", description: "Support channels, operating standards and escalation process." },
];

export default function AdminPolicyManagement() {
  const adminApi = useAdminApi();
  const [mode, setMode] = useState("legal");
  const [documentType, setDocumentType] = useState("terms");
  const [version, setVersion] = useState("");
  const [content, setContent] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [legacyContent, setLegacyContent] = useState("");
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const loadDocument = useCallback(async () => {
    setLoadingDocument(true);
    setMessage("");
    try {
      const result = await adminApi.platform.getLegalDocument(documentType);
      setContent(String(result?.content || ""));
      setVersion(String(result?.version || ""));
      setMessageType("info");
      setMessage(result?.content ? `Loaded the published ${DOCUMENTS.find((item) => item.value === documentType)?.label || documentType} document (version ${result.version || "unversioned"}).` : "No published version was returned.");
    } catch (error) {
      setContent("");
      setVersion("");
      if (error?.status === 404) {
        setMessageType("info");
        setMessage("No published version exists yet. Add the approved document text and publish its first version.");
      } else {
        setMessageType("error");
        setMessage(error?.message || "Could not load the public legal document.");
      }
    } finally {
      setLoadingDocument(false);
    }
  }, [adminApi, documentType]);

  useEffect(() => {
    if (mode === "legal") loadDocument();
  }, [mode, loadDocument]);

  async function saveLegalDocument() {
    if (!content.trim()) {
      setMessageType("error");
      setMessage("Document content is required before publishing.");
      return;
    }
    if (!window.confirm(`Publish a new version of ${DOCUMENTS.find((item) => item.value === documentType)?.label || documentType}? This document is public to users.`)) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await adminApi.platform.updateLegalDocument(documentType, {
        content: content.trim(),
        version: version.trim(),
      });
      setVersion(String(response?.version || version));
      setMessageType("success");
      setMessage(response?.message || "Legal document published.");
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "The legal document could not be published.");
    } finally {
      setSaving(false);
    }
  }

  async function saveLegacyPolicy() {
    if (!policyId.trim() || !legacyContent.trim()) {
      setMessageType("error");
      setMessage("Enter a policy ID and its content.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await adminApi.platform.updatePolicy({
        policy_id: policyId.trim(),
        content: legacyContent.trim(),
      });
      setMessageType("success");
      setMessage(response?.message || "Policy saved.");
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "The legacy policy could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const activeDoc = DOCUMENTS.find((item) => item.value === documentType) || DOCUMENTS[0];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"><ShieldCheck size={22} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700 dark:text-blue-300">Governance</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Policies and terms</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Publish versioned public documents through the existing RevelaCode backend. Each publish creates a new revision; it does not silently overwrite the prior document history.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setMode("legal"); setMessage(""); }} className={`min-h-10 rounded-xl px-4 py-2 text-sm font-bold ${mode === "legal" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>Public legal documents</button>
          <button type="button" onClick={() => { setMode("legacy"); setMessage(""); }} className={`min-h-10 rounded-xl px-4 py-2 text-sm font-bold ${mode === "legacy" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>Legacy internal policies</button>
        </div>
      </section>

      {message ? (
        <div role={messageType === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${messageType === "error" ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" : messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"}`}>
          {messageType === "error" ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}{message}
        </div>
      ) : null}

      {mode === "legal" ? (
        <Card><CardContent className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="text-lg font-black text-slate-950 dark:text-white">{activeDoc.label}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{activeDoc.description}</p></div>
            <button type="button" onClick={loadDocument} disabled={loadingDocument} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-50 dark:border-slate-700"><RefreshCw size={14} className={loadingDocument ? "animate-spin" : ""} /> Reload published version</button>
          </div>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Document type</span><select value={documentType} onChange={(event) => { setDocumentType(event.target.value); setContent(""); setVersion(""); }} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">{DOCUMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Version (optional)</span><input maxLength={40} value={version} onChange={(event) => setVersion(event.target.value)} placeholder="e.g. 1.0" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /><span className="mt-1 block text-xs text-slate-500">Leave blank to auto-increment.</span></label>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200"><FileText size={16} className="mb-1" />Public documents should be reviewed before publishing. The prior version is retained; confirm legal wording and effective dates before release.</div>
          </div>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Document content</span><textarea required rows={18} maxLength={250000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write or paste the approved document text…" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <button type="button" onClick={saveLegalDocument} disabled={saving || loadingDocument || !content.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Publishing…" : "Publish new version"}</button>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="space-y-5 p-4 sm:p-6">
          <div><h3 className="text-lg font-black text-slate-950 dark:text-white">Internal policy record</h3><p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">This retains the existing policies collection contract. It is separate from public privacy and terms pages.</p></div>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Policy ID</span><input required value={policyId} onChange={(event) => setPolicyId(event.target.value)} placeholder="e.g. community_moderation" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Policy content</span><textarea required rows={15} value={legacyContent} onChange={(event) => setLegacyContent(event.target.value)} placeholder="Enter approved internal policy content…" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <button type="button" onClick={saveLegacyPolicy} disabled={saving || !policyId.trim() || !legacyContent.trim()} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">{saving ? "Saving…" : "Save internal policy"}</button>
        </CardContent></Card>
      )}
    </div>
  );
}
