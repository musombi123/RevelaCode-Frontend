import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function readPreferences(value) {
  const source =
    value?.preferences ||
    value?.contact_preferences ||
    value?.data ||
    value ||
    {};

  return {
    enabled: source.enabled === true,
    phoneNumber: String(
      source.phone_number ||
      source.whatsapp_number ||
      source.phone ||
      "",
    ),
  };
}

export default function CommunityContactSettings({ onBack }) {
  const {
    getCommunityContactPreferences,
    saveCommunityContactPreferences,
  } = useJumuiyaApi();

  const [enabled, setEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getCommunityContactPreferences();
      const preferences = readPreferences(result);
      setEnabled(preferences.enabled);
      setPhoneNumber(preferences.phoneNumber);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Could not load your contact preferences. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [getCommunityContactPreferences]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const result = await getCommunityContactPreferences();
        if (!active) return;
        const preferences = readPreferences(result);
        setEnabled(preferences.enabled);
        setPhoneNumber(preferences.phoneNumber);
        setError("");
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError?.message ||
            "Could not load your contact preferences. Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [getCommunityContactPreferences]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanedPhone = phoneNumber.trim();
    const digitCount = cleanedPhone.replace(/\D/g, "").length;

    if (enabled && digitCount < 8) {
      setError(
        "Enter a valid WhatsApp number in international format, for example +254712345678.",
      );
      return;
    }

    setSaving(true);

    try {
      const result = await saveCommunityContactPreferences({
        enabled,
        phone_number: cleanedPhone,
      });

      const saved = readPreferences(result);
      setEnabled(saved.enabled);
      setPhoneNumber(saved.phoneNumber || cleanedPhone);
      setSuccess(
        saved.enabled
          ? "Your WhatsApp contact preference has been saved. Eligible members can now start a private chat."
          : "WhatsApp private contact has been disabled for your Community profile.",
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "We could not save your contact preferences. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5"
          aria-label="Back to Community"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
            Community preferences
          </p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            WhatsApp private contact
          </h1>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <MessageCircle size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Let Community members contact you privately
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              When enabled, eligible members can request a WhatsApp chat from your posts. Your number is not displayed on the public post; the backend checks your preference before returning a contact link.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-12 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <LoaderCircle size={17} className="animate-spin" />
            Loading your saved preferences…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative mt-6 space-y-5">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-200 dark:border-white/10 dark:hover:border-emerald-500/30">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => {
                  setEnabled(event.target.checked);
                  setSuccess("");
                  setError("");
                }}
                className="mt-1 h-4 w-4 accent-emerald-600"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-900 dark:text-white">
                  Allow WhatsApp private chat
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {enabled
                    ? "Your posts can show a private-chat action to other members."
                    : "Your posts will not offer WhatsApp contact while this is off."}
                </span>
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${enabled ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                {enabled ? "ON" : "OFF"}
              </span>
            </label>

            <div>
              <label htmlFor="community-whatsapp-number" className="mb-2 flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
                <Smartphone size={14} />
                WhatsApp number
              </label>
              <input
                id="community-whatsapp-number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={24}
                value={phoneNumber}
                onChange={(event) => {
                  setPhoneNumber(event.target.value);
                  setSuccess("");
                  setError("");
                }}
                placeholder="+254712345678"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
              <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                Use your full international number, including the country code. Example: +254712345678. Only enable contact if you are comfortable receiving messages from other members.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p>
                You can turn this off at any time. RevelaCode will not store WhatsApp messages; conversations take place in WhatsApp.
              </p>
            </div>

            {error ? (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-semibold leading-5 text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-300">
                {error}
                <button
                  type="button"
                  onClick={loadPreferences}
                  className="ml-2 underline underline-offset-2"
                >
                  Reload settings
                </button>
              </div>
            ) : null}

            {success ? (
              <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-semibold leading-5 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Back to Community
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {saving ? "Saving preferences…" : "Save contact preferences"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
