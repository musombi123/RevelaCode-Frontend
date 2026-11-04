import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { resolveAdminBackendUrl } from "@/services/adminApi.jsx";

export default function SupportPaymentRetryPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token") || "";
  const [plan, setPlan] = useState(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function validate() {
      if (authLoading) return;
      if (!user || !token) {
        setLoading(false);
        return;
      }
      try {
        const response = await authFetch(`${resolveAdminBackendUrl()}/api/support-center/plans/retry/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) throw new Error(payload.message || "This retry link is not valid.");
        if (active) setPlan(payload.plan);
      } catch (err) {
        if (active) setError(err.message || "Retry link validation failed.");
      } finally {
        if (active) setLoading(false);
      }
    }
    validate();
    return () => { active = false; };
  }, [authFetch, authLoading, token, user]);

  async function confirmRetry(event) {
    event.preventDefault();
    if (!plan || !phone.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const idempotency = globalThis.crypto?.randomUUID?.() || `support-retry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await authFetch(`${resolveAdminBackendUrl()}/api/revenue/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotency, Accept: "application/json" },
        body: JSON.stringify({ plan_code: plan.plan_code, phone: phone.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.message || "A fresh STK prompt could not be started.");
      const checkoutRequestId = payload.checkout?.checkout_request_id || payload.checkout?.CheckoutRequestID || "";
      if (!checkoutRequestId) throw new Error("Safaricom did not return a checkout reference. Contact Support before retrying.");
      const completed = await authFetch(`${resolveAdminBackendUrl()}/api/support-center/plans/retry/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token, checkout_request_id: checkoutRequestId }),
      });
      const completedPayload = await completed.json().catch(() => ({}));
      if (!completed.ok || !completedPayload.success) throw new Error(completedPayload.message || "STK started but retry confirmation could not be recorded. Contact Support.");
      setMessage("Your new STK request was submitted. Check your phone and follow the Safaricom prompt. Do not submit another request while this one is pending.");
      setPlan(null);
    } catch (err) {
      setError(err.message || "The retry request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 dark:bg-slate-950">
      <section className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950"><Smartphone size={22} /></span><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">RevelaCode Support</p><h1 className="text-xl font-black text-slate-950 dark:text-white">Confirm M-Pesa retry</h1></div></div>
        {(loading || authLoading) && <p role="status" className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} /> Validating secure link…</p>}
        {!loading && !authLoading && !user && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><p>Sign in to the RevelaCode account associated with this payment, then reopen this email link. The link does not grant account access.</p><Link to="/login" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-4 font-bold text-white">Sign in</Link></div>}
        {error && <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle size={17} className="mt-0.5" />{error}</div>}
        {message && <div role="status" className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={17} className="mt-0.5" />{message}</div>}
        {plan && <form onSubmit={confirmRetry} className="space-y-4"><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950"><p className="text-xs text-slate-500">Plan</p><p className="mt-1 font-bold">{plan.hub} · {plan.plan_code}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{plan.currency} {plan.amount}</p></div><label className="block text-sm font-semibold">M-Pesa phone number<input required value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-transparent px-3 dark:border-slate-700" placeholder="07XXXXXXXX or 2547XXXXXXXX" /></label><p className="text-xs leading-5 text-slate-500">You are authorizing one new STK prompt for this plan. The amount comes from the server's published plan price. Do not confirm if you did not request this retry.</p><button disabled={busy || !phone.trim()} className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 font-bold text-white disabled:opacity-50">{busy ? "Sending STK request…" : "Confirm and send STK prompt"}</button></form>}
        <p className="text-center text-xs text-slate-500">Need help? Reply to the support email you received.</p>
      </section>
    </main>
  );
}
