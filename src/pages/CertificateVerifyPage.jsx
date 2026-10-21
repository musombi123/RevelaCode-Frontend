import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

const API_BASE = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

export default function CertificateVerifyPage() {
  const { certId = "" } = useParams();
  const [state, setState] = useState("loading");
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setState("loading");
    setRecord(null);
    setError("");
    const url = `${API_BASE}/api/verify/certificate/${encodeURIComponent(certId)}`;
    fetch(url, { method: "GET", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!active) return;
        setRecord(payload);
        if (response.ok && payload?.valid === true) {
          setState("valid");
        } else if (payload?.valid === false) {
          setState("invalid");
          setError(payload?.reason === "signature_invalid"
            ? "The signature could not be validated with the configured RevelaCode public key."
            : "No matching issued certificate was found.");
        } else {
          setState("error");
          setError(payload?.detail?.message || payload?.message || `Verification service returned HTTP ${response.status}.`);
        }
      })
      .catch((requestError) => {
        if (!active) return;
        setState("error");
        setError(requestError?.message || "Certificate verification is unavailable.");
      });
    return () => { active = false; };
  }, [certId]);

  return (
    <main className="mx-auto max-w-3xl p-4 py-10 md:py-16">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
        <header className="bg-gradient-to-r from-blue-800 to-emerald-700 p-6 text-white md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">RevelaCode • Credential verification</p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">Certificate verification</h1>
          <p className="mt-2 break-all text-sm text-blue-100">Certificate ID: {certId}</p>
        </header>
        <div className="p-6 md:p-8">
          {state === "loading" && <div role="status" className="flex items-center gap-3 text-slate-600 dark:text-slate-300"><Loader2 className="h-5 w-5 animate-spin" /> Checking the issuer signature and certificate record…</div>}
          {state === "valid" && record && (
            <div>
              <div className="flex items-start gap-3"><CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" /><div><h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Valid RevelaCode certificate</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">The issued record matches its server-side integrity signature.</p></div></div>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900"><dt className="text-xs text-slate-500">Learner</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{record.user?.name || "Not recorded"}</dd><dd className="mt-1 text-xs text-slate-500">Roles: {(record.user?.roles || []).join(", ") || "Not recorded"}</dd></div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900"><dt className="text-xs text-slate-500">Learning hub</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{record.hub?.name || "Not recorded"}</dd><dd className="mt-1 text-xs text-slate-500">{record.hub?.completed_lessons || 0} of {record.hub?.total_lessons || 0} lessons</dd></div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900"><dt className="text-xs text-slate-500">Certification authority</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{record.certified_by || "RevelaCode"}</dd><dd className="mt-1 text-xs text-slate-500">{record.issuer_role || "RevelaCode Certification Authority"}</dd></div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900"><dt className="text-xs text-slate-500">Issued</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{record.issued_at ? new Date(record.issued_at).toLocaleDateString() : "Not recorded"}</dd><dd className="mt-1 text-xs text-slate-500">Signature algorithm: {record.signature_algorithm || "Not reported"}</dd></div>
              </dl>
              <div className="mt-5"><h3 className="font-semibold text-slate-900 dark:text-slate-100">Certified roles</h3><div className="mt-2 flex flex-wrap gap-2">{(record.roles || []).map((role) => <span key={role} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">{role}</span>)}</div></div>
              <div className="mt-5"><h3 className="font-semibold text-slate-900 dark:text-slate-100">Skills recorded</h3><div className="mt-2 flex flex-wrap gap-2">{(record.skills || []).map((skill) => <span key={skill} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-200">{skill}</span>)}</div></div>
              {record.signature_fingerprint_sha256 && <p className="mt-5 break-all text-xs text-slate-500">Signature fingerprint (SHA-256): {record.signature_fingerprint_sha256}</p>}
            </div>
          )}
          {state === "invalid" && <div role="alert" className="flex items-start gap-3 text-rose-800 dark:text-rose-200"><AlertCircle className="h-7 w-7 shrink-0" /><div><h2 className="font-bold">Certificate not verified</h2><p className="mt-1 text-sm">{error}</p></div></div>}
          {state === "error" && <div role="alert" className="flex items-start gap-3 text-amber-800 dark:text-amber-200"><AlertCircle className="h-7 w-7 shrink-0" /><div><h2 className="font-bold">Verification service unavailable</h2><p className="mt-1 text-sm">{error}</p><p className="mt-2 text-xs">The service must be configured with the same RSA public key used to verify the issued credential.</p></div></div>}
          <div className="mt-8 border-t border-slate-200 pt-5 dark:border-slate-700"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"><ShieldCheck className="h-4 w-4" /> Return to RevelaCode</Link></div>
        </div>
      </section>
    </main>
  );
}
