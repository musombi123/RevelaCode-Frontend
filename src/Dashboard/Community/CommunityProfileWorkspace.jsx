import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  FileImage,
  MapPin,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

const EMPTY_PROFILE = {
  full_name: "",
  bio: "",
  avatar_url: "",
  cover_url: "",
  avatar_position: "50%",
  cover_position: "50%",
  county: "",
  town: "",
};

function displayName(user) {
  return user?.name || user?.full_name || user?.fullName ||
    user?.username || user?.email?.split("@")[0] || "Community member";
}

function imageUrlFrom(result) {
  const attachment = result?.attachment || result?.data?.attachment ||
    result?.result?.attachment || null;
  const url = attachment?.url || attachment?.secure_url || "";
  if (!url || !/^https:\/\//i.test(url)) {
    throw new Error("The image service did not return a secure image URL.");
  }
  return url;
}

function cleanPosition(value) {
  const parsed = Number.parseInt(String(value || "50").replace("%", ""), 10);
  return `${Math.max(0, Math.min(100, Number.isFinite(parsed) ? parsed : 50))}%`;
}

export default function CommunityProfileWorkspace({ onNavigate, onProfileUpdated }) {
  const { user } = useAuth();
  const { getIdentity, updateIdentityProfile, uploadCommunityMedia } = useJumuiyaApi();
  const avatarInput = useRef(null);
  const coverInput = useRef(null);
  const [profile, setProfile] = useState(() => ({
    ...EMPTY_PROFILE,
    full_name: displayName(user),
    avatar_url: user?.avatar_url || user?.avatar || user?.profile_image || "",
  }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    getIdentity()
      .then((result) => {
        if (!mounted) return;
        const source = result?.profile || result?.data?.profile || {};
        const account = result?.account || result?.data?.account || user || {};
        setProfile((current) => ({
          ...current,
          ...EMPTY_PROFILE,
          full_name: String(source.full_name || account.full_name || account.name || current.full_name || displayName(user)),
          bio: String(source.bio || ""),
          avatar_url: String(source.avatar_url || account.avatar_url || current.avatar_url || ""),
          cover_url: String(source.cover_url || ""),
          avatar_position: cleanPosition(source.avatar_position),
          cover_position: cleanPosition(source.cover_position),
          county: String(source.county || ""),
          town: String(source.town || ""),
        }));
      })
      .catch((caught) => {
        if (mounted) setError(caught?.message || "Your Community profile could not be loaded.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [getIdentity, user]);

  const initials = useMemo(() => {
    const names = String(profile.full_name || "Member").trim().split(/\s+/).filter(Boolean);
    return (names.length > 1 ? names[0][0] + names[names.length - 1][0] : names[0]?.slice(0, 2) || "M").toUpperCase();
  }, [profile.full_name]);

  const changeField = useCallback((key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setNotice("");
  }, []);

  const handleImage = useCallback(async (kind, event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    const extensionAllowed = /\.(jpe?g|png|webp|gif)$/i.test(file.name || "");
    if (!allowedTypes.has(file.type) && !extensionAllowed) {
      setError("Choose a JPG, PNG, WEBP or GIF image.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("Community images must be 12 MB or smaller.");
      return;
    }

    setError("");
    setNotice("");
    setUploading(kind);
    try {
      const result = await uploadCommunityMedia(file);
      const url = imageUrlFrom(result);
      const key = kind === "avatar" ? "avatar_url" : "cover_url";
      setProfile((current) => ({ ...current, [key]: url }));
      setSaved(false);
      setNotice(kind === "avatar" ? "Profile photo uploaded. Save changes to publish it." : "Cover photo uploaded. Adjust the crop, then save changes.");
    } catch (caught) {
      setError(caught?.message || "The image could not be uploaded. Check the connection and try again.");
    } finally {
      setUploading("");
    }
  }, [uploadCommunityMedia]);

  const saveProfile = useCallback(async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const payload = {
        full_name: String(profile.full_name || "").trim(),
        bio: String(profile.bio || "").trim(),
        avatar_url: String(profile.avatar_url || "").trim(),
        cover_url: String(profile.cover_url || "").trim(),
        avatar_position: cleanPosition(profile.avatar_position),
        cover_position: cleanPosition(profile.cover_position),
        county: String(profile.county || "").trim(),
        town: String(profile.town || "").trim(),
      };
      if (!payload.full_name) throw new Error("Enter the name you want members to see.");
      await updateIdentityProfile(payload);
      setProfile((current) => ({ ...current, ...payload }));
      onProfileUpdated?.(payload);
      setSaved(true);
      setNotice("Your Community profile has been saved.");
    } catch (caught) {
      setError(caught?.message || "Your profile could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [profile, updateIdentityProfile]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4 pb-6">
      <header className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="relative h-36 overflow-hidden sm:h-52 lg:h-60">
          {profile.cover_url ? (
            <img
              src={profile.cover_url}
              alt="Community profile cover"
              className="h-full w-full object-cover"
              style={{ objectPosition: `center ${profile.cover_position}` }}
            />
          ) : (
            <div className="relative h-full overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-800">
              <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/15" />
              <div className="absolute right-12 top-8 h-40 w-40 rounded-full border border-cyan-200/20" />
              <div className="absolute bottom-[-56px] left-[34%] h-44 w-44 rotate-45 border border-white/10" />
              <div className="absolute bottom-5 left-5 sm:left-8">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200/80">Jumuiya · Community</p>
                <p className="mt-2 text-lg font-black tracking-tight text-white sm:text-2xl">Your story. Your people.</p>
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/50 to-transparent" />
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            disabled={Boolean(uploading)}
            className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-slate-950/70 px-3 py-2.5 text-xs font-black text-white shadow-lg backdrop-blur transition hover:bg-slate-950 disabled:opacity-60 sm:right-5 sm:top-5"
          >
            {uploading === "cover" ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
            <span className="hidden sm:inline">{uploading === "cover" ? "Uploading…" : "Change cover"}</span>
            <span className="sm:hidden">Cover</span>
          </button>
          <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => handleImage("cover", event)} />
        </div>

        <div className="px-4 pb-5 sm:px-7">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 sm:-mt-16">
            <div className="flex min-w-0 items-end gap-3 sm:gap-4">
              <div className="relative h-24 w-24 shrink-0 rounded-full border-4 border-white bg-slate-950 shadow-xl dark:border-slate-900 sm:h-32 sm:w-32">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                    style={{ objectPosition: `center ${profile.avatar_position}` }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-700 text-2xl font-black text-white sm:text-3xl">{initials}</div>
                )}
                <button type="button" onClick={() => avatarInput.current?.click()} disabled={Boolean(uploading)} aria-label="Change profile picture" className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-cyan-500 text-slate-950 shadow-md transition hover:bg-cyan-300 disabled:opacity-60 dark:border-slate-900">
                  {uploading === "avatar" ? <RefreshCw size={15} className="animate-spin" /> : <Camera size={15} />}
                </button>
                <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => handleImage("avatar", event)} />
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Community profile</p>
                <h1 className="mt-1 max-w-full break-words text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">{profile.full_name || displayName(user)}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><ShieldCheck size={13} /> Your RevelaCode identity</p>
              </div>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button type="button" onClick={() => onNavigate?.("community-home")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600 transition hover:border-cyan-400 dark:border-white/10 dark:text-slate-300 sm:flex-none">
                <ArrowLeft size={14} /> Community
              </button>
              <button type="submit" form="community-profile-form" disabled={saving || Boolean(uploading)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                {saving ? "Saving…" : saved ? "Saved" : "Save profile"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {error ? <div role="alert" className="rounded-2xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-200">{error}</div> : null}
      {notice ? <div role="status" className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-cyan-100">{notice}</div> : null}

      <form id="community-profile-form" onSubmit={saveProfile} className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
        <div className="space-y-4">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center gap-2"><Sparkles size={16} className="text-cyan-600 dark:text-cyan-300" /><h2 className="text-sm font-black text-slate-950 dark:text-white">Identity & introduction</h2></div>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Show other members who you are and what you are building.</p>
            <label className="mt-5 block"><span className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-200">Display name</span><input value={profile.full_name} onChange={(event) => changeField("full_name", event.target.value)} maxLength={160} required disabled={loading || saving} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white" placeholder="Your name" /></label>
            <label className="mt-4 block"><span className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-200">About you</span><textarea value={profile.bio} onChange={(event) => changeField("bio", event.target.value)} maxLength={1000} rows={4} disabled={loading || saving} className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white" placeholder="Your work, interests, skills, or community focus…" /><span className="mt-1 block text-right text-[10px] text-slate-400">{profile.bio.length}/1000</span></label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label><span className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-200">County</span><input value={profile.county} onChange={(event) => changeField("county", event.target.value)} maxLength={100} disabled={loading || saving} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" placeholder="e.g. Mombasa" /></label>
              <label><span className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-200">Town / area</span><input value={profile.town} onChange={(event) => changeField("town", event.target.value)} maxLength={100} disabled={loading || saving} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" placeholder="e.g. Nyali" /></label>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center gap-2"><FileImage size={16} className="text-cyan-600 dark:text-cyan-300" /><h2 className="text-sm font-black text-slate-950 dark:text-white">Photo framing</h2></div>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Adjust which part of each photo appears in your profile. Your original image remains unchanged.</p>
            <label className="mt-5 block"><span className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-200"><span>Profile picture vertical position</span><span className="tabular-nums text-slate-400">{profile.avatar_position}</span></span><input type="range" min="0" max="100" value={Number.parseInt(profile.avatar_position, 10)} onChange={(event) => changeField("avatar_position", cleanPosition(event.target.value))} disabled={saving} className="w-full accent-cyan-500" /></label>
            <label className="mt-5 block"><span className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-200"><span>Cover photo vertical position</span><span className="tabular-nums text-slate-400">{profile.cover_position}</span></span><input type="range" min="0" max="100" value={Number.parseInt(profile.cover_position, 10)} onChange={(event) => changeField("cover_position", cleanPosition(event.target.value))} disabled={saving} className="w-full accent-cyan-500" /></label>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-950 dark:text-slate-400"><UploadCloud size={15} className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-300" /><p>JPG, PNG, WEBP or GIF · maximum 12 MB per image. Images are stored using RevelaCode's existing Community media service.</p></div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-5">
            <h2 className="text-sm font-black text-slate-950 dark:text-white">Live profile preview</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">A mobile-friendly preview of how members see you.</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="relative h-24 overflow-hidden bg-gradient-to-br from-blue-950 to-cyan-700">
                {profile.cover_url ? <img src={profile.cover_url} alt="" className="h-full w-full object-cover" style={{ objectPosition: `center ${profile.cover_position}` }} /> : null}
              </div>
              <div className="bg-white p-4 dark:bg-slate-950">
                <div className="-mt-10"><div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-cyan-400 to-blue-700 dark:border-slate-950">{profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" style={{ objectPosition: `center ${profile.avatar_position}` }} /> : <div className="flex h-full items-center justify-center text-lg font-black text-white">{initials}</div>}</div></div>
                <h3 className="mt-2 break-words text-base font-black text-slate-950 dark:text-white">{profile.full_name || "Your name"}</h3>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400"><MapPin size={11} />{[profile.town, profile.county].filter(Boolean).join(", ") || "Add your location"}</p>
                {profile.bio ? <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-slate-600 dark:text-slate-300">{profile.bio}</p> : <p className="mt-3 text-xs leading-5 text-slate-400">Your introduction will appear here.</p>}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-500 dark:border-white/10 dark:text-slate-400"><User size={12} /> RevelaCode member <span className="ml-auto text-cyan-600 dark:text-cyan-300">Profile preview</span></div>
              </div>
            </div>
          </section>
          <section className="rounded-[24px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4 dark:border-cyan-500/15">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white"><ShieldCheck size={16} className="text-cyan-600 dark:text-cyan-300" /><h2 className="text-sm font-black">Profile control</h2></div>
            <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">Only information you choose to publish is shown here. Your login credentials are never editable from this page.</p>
          </section>
        </aside>
      </form>
    </section>
  );
}
