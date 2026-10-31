import React from "react";
import {
  ArrowRight,
  Download,
  ExternalLink,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

const ANDROID_RELEASES_URL =
  "https://github.com/musombi123/RevelaCode-Frontend/releases";

const ANDROID_DOWNLOAD_URL =
  String(import.meta.env.VITE_ANDROID_APK_URL || "").trim() ||
  ANDROID_RELEASES_URL;

const capabilities = [
  {
    title: "One connected ecosystem",
    description: "Business, agriculture, education and community tools in one place.",
  },
  {
    title: "Built for real work",
    description: "Practical digital workflows, with AI and offline support across the ecosystem.",
  },
  {
    title: "Choose how you access it",
    description: "Use the Android app on your phone or continue in your browser.",
  },
];

export default function PlatformWelcomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F5F7FB] text-slate-950">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-emerald-200/35 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-8">
        <header className="flex items-center justify-between border-b border-slate-200/80 py-5">
          <a href="/" className="flex min-w-0 items-center gap-3" aria-label="RevelaCode home">
            <img
              src="/Logo.png"
              alt="RevelaCode"
              className="h-11 w-11 rounded-xl object-contain"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <span className="min-w-0">
              <span className="block text-lg font-black tracking-tight text-slate-950">
                RevelaCode
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Code. Innovate. Transform.
              </span>
            </span>
          </a>

          <a
            href="/app"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-slate-700 transition hover:bg-white hover:text-blue-700"
          >
            Web app <ArrowRight size={16} />
          </a>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-blue-800 shadow-sm">
              <Sparkles size={14} />
              A smarter way to move forward
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-[1.06] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              Your ideas deserve{" "}
              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
                better technology.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Welcome to RevelaCode. Explore a connected digital ecosystem for
              business, agriculture, education and communities — powered by
              practical software, AI and tools built around real needs.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={ANDROID_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-blue-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
              >
                <Download size={19} />
                Download Android app
                <ExternalLink size={15} className="opacity-75" />
              </a>

              <a
                href="/app"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white/90 px-6 py-3.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                <Monitor size={19} />
                Continue to web app
                <ArrowRight size={16} />
              </a>
            </div>

            <p className="mt-4 text-xs leading-6 text-slate-500">
              Android downloads open the official Releases page unless a direct
              APK URL is configured. The web app opens in this browser.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 pt-6 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-700" />
                Secure account access
              </span>
              <span className="inline-flex items-center gap-2">
                <Smartphone size={15} className="text-blue-700" />
                Android and web
              </span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div className="relative rounded-[2rem] border border-white/80 bg-white/80 p-4 shadow-[0_28px_90px_rgba(15,35,70,0.12)] backdrop-blur-xl sm:p-6">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-300/30 blur-2xl" />
              <div className="relative rounded-[1.5rem] bg-slate-950 p-6 text-white sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-200">
                    RevelaCode ecosystem
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold text-emerald-200">
                    Connected
                  </span>
                </div>
                <h2 className="mt-8 max-w-sm text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  One platform.
                  <br />
                  More possibilities.
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
                  Move between the tools you need without losing sight of the bigger picture.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  {[
                    ["Biashara", "Business"],
                    ["Shamba", "Agriculture"],
                    ["Elimu", "Education"],
                    ["Jumuiya", "Community"],
                  ].map(([name, label]) => (
                    <div
                      key={name}
                      className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"
                    >
                      <span className="block text-base font-extrabold text-white">{name}</span>
                      <span className="mt-1 block text-xs text-slate-400">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-300/15 text-emerald-200">
                    <Sparkles size={19} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-white">RevelaAI</span>
                    <span className="block text-xs text-slate-300">Intelligence across your workflow</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-3">
              {capabilities.map((item, index) => (
                <div key={item.title} className="min-w-0">
                  <span className="text-[11px] font-black tracking-[0.18em] text-blue-700">
                    0{index + 1}
                  </span>
                  <h3 className="mt-2 text-sm font-extrabold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-slate-200/80 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} RevelaCode Software Solutions</span>
          <span>Built to code. Built to innovate. Built to transform.</span>
        </footer>
      </div>
    </main>
  );
}
