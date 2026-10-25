import React from "react";
import {
  ArrowUpRight,
  Camera,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Pencil,
  Users,
  Video,
} from "lucide-react";

function initials(name) {
  const parts = String(name || "Community member").trim().split(/\\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0]?.slice(0, 2) || "RC").toUpperCase();
}

function DefaultCoverArtwork() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#081226] via-[#0b2850] to-[#087e94]">
      <div className="absolute -right-10 -top-28 h-72 w-72 rounded-full border border-cyan-100/15" />
      <div className="absolute right-[14%] top-7 h-40 w-40 rounded-full border border-cyan-100/15" />
      <div className="absolute bottom-[-76px] left-[30%] h-52 w-52 rotate-45 border border-white/10" />
      <svg className="absolute inset-x-0 bottom-0 h-[78%] w-full opacity-80" viewBox="0 0 1200 250" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="communitySkyline" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#143a62" />
            <stop offset="100%" stopColor="#071528" />
          </linearGradient>
          <linearGradient id="communityWater" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#087e94" stopOpacity=".08" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity=".35" />
            <stop offset="100%" stopColor="#087e94" stopOpacity=".08" />
          </linearGradient>
        </defs>
        <path d="M0 172 L52 172 L52 125 L94 125 L94 160 L128 160 L128 100 L157 100 L157 166 L205 166 L205 70 L239 70 L239 163 L278 163 L278 126 L322 126 L322 166 L365 166 L365 91 L404 91 L404 167 L446 167 L446 132 L488 132 L488 164 L525 164 L525 54 L561 54 L561 164 L604 164 L604 108 L644 108 L644 165 L686 165 L686 133 L730 133 L730 169 L774 169 L774 91 L809 91 L809 168 L848 168 L848 120 L889 120 L889 165 L928 165 L928 76 L966 76 L966 165 L1009 165 L1009 131 L1056 131 L1056 167 L1099 167 L1099 111 L1138 111 L1138 166 L1200 166 L1200 250 L0 250 Z" fill="url(#communitySkyline)" />
        <path d="M0 196 Q180 177 360 196 T720 196 T1080 196 T1440 196 L1440 250 L0 250 Z" fill="url(#communityWater)" />
        <path d="M0 211 Q150 201 300 211 T600 211 T900 211 T1200 211" stroke="#67e8f9" strokeOpacity=".35" fill="none" />
        <path d="M0 228 Q150 218 300 228 T600 228 T900 228 T1200 228" stroke="#67e8f9" strokeOpacity=".18" fill="none" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/75 to-transparent" />
    </div>
  );
}

export default function CommunityIdentityHero({
  profile,
  user,
  onEditProfile,
  onCreatePost,
  onOpenFeed,
  onOpenGroups,
}) {
  const name =
    profile?.full_name ||
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Community member";
  const avatar =
    profile?.avatar_url ||
    user?.avatar_url ||
    user?.avatar ||
    user?.profile_image ||
    "";
  const cover = profile?.cover_url || "";
  const location = [profile?.town, profile?.county].filter(Boolean).join(", ");
  const username = String(profile?.username || user?.username || "").trim();
  const bio = String(profile?.bio || "").trim();

  return (
    <section className="mb-4 overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-sm shadow-slate-950/[0.04] dark:border-white/10 dark:bg-[#0d1729]">
      <div className="relative h-[150px] overflow-hidden sm:h-[205px] lg:h-[226px]">
        {cover ? (
          <img
            src={cover}
            alt="Your Community profile cover"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: `center ${profile?.cover_position || "50%"}` }}
          />
        ) : (
          <DefaultCoverArtwork />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06101f]/75 via-[#06101f]/20 to-[#06101f]/15" />
        <div className="absolute left-4 top-4 flex items-center gap-2.5 sm:left-6 sm:top-5">
          <img
            src="/Logo.png"
            alt="RevelaCode"
            className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 object-contain p-1 sm:h-11 sm:w-11"
          />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-100/90">RevelaCode</p>
            <p className="text-sm font-black text-white sm:text-base">Community</p>
          </div>
        </div>
        <div className="absolute bottom-5 left-4 max-w-[72%] sm:bottom-7 sm:left-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-100/90 sm:text-[10px]">Jumuiya · Connect, share, grow</p>
          <h2 className="mt-1 text-lg font-black leading-tight tracking-tight text-white sm:text-2xl">Real people. Real ideas. Real impact.</h2>
        </div>
        <button
          type="button"
          onClick={onEditProfile}
          className="absolute right-3 top-3 inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/20 bg-slate-950/65 px-2.5 py-2 text-[10px] font-extrabold text-white shadow-lg backdrop-blur transition hover:bg-slate-950 sm:right-5 sm:top-5 sm:gap-2 sm:px-3 sm:text-xs"
          aria-label="Edit cover photo"
        >
          <Camera size={14} />
          Edit cover
        </button>
      </div>

      <div className="px-4 pb-0 sm:px-6">
        <div className="-mt-9 flex flex-col gap-3 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-end gap-3 sm:gap-4">
            <div className="relative h-[76px] w-[76px] shrink-0 rounded-full border-[4px] border-white bg-slate-950 shadow-xl dark:border-[#0d1729] sm:h-[100px] sm:w-[100px]">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="h-full w-full rounded-full object-cover"
                  style={{ objectPosition: `center ${profile?.avatar_position || "50%"}` }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-700 text-xl font-black text-white sm:text-2xl">
                  {initials(name)}
                </div>
              )}
              <button
                type="button"
                onClick={onEditProfile}
                aria-label="Edit profile photo"
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-cyan-400 text-slate-950 shadow-md transition hover:bg-cyan-200 dark:border-[#0d1729] sm:h-8 sm:w-8"
              >
                <Camera size={14} />
              </button>
            </div>
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="max-w-full break-words text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">{name}</h1>
                <span title="Community member" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"><Users size={11} /></span>
              </div>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                {username ? "@" + username : "Community member"}
                {location ? ` · ${location}` : " · RevelaCode Community"}
              </p>
              <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-5 text-slate-600 dark:text-slate-300">
                {bio || "Build your presence, share useful knowledge, discover opportunities and connect with people across Jumuiya."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 pb-1 sm:pb-2">
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-cyan-200 sm:flex-none"
            >
              <Pencil size={13} /> Edit profile
            </button>
            <button
              type="button"
              onClick={onCreatePost}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-extrabold text-slate-950 shadow-sm transition hover:bg-cyan-300 sm:flex-none"
            >
              <ArrowUpRight size={14} /> Share
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto border-t border-slate-100 py-2.5 dark:border-white/10">
          <button type="button" onClick={onOpenFeed} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-2 text-xs font-extrabold text-cyan-800 dark:text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" /> Posts
          </button>
          <button type="button" onClick={onEditProfile} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
            About <ChevronRight size={13} />
          </button>
          <button type="button" onClick={onOpenFeed} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
            <ImageIcon size={13} /> Media
          </button>
          <button type="button" onClick={onOpenGroups} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
            <Users size={13} /> Groups
          </button>
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 text-[10px] font-semibold text-slate-400 md:inline-flex">
            <FileText size={12} /> Photos, video & group files
          </span>
        </div>
      </div>
    </section>
  );
}
