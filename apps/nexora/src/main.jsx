import React from "react";
import { createRoot } from "react-dom/client";
import { Monitor, Laptop, Smartphone } from "lucide-react";
import NexoraFoundryWorkspace from "./components/nexora/NexoraFoundryWorkspace.jsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("NEXORA root element is missing.");
}

const mobileDevice = /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(
  window.navigator.userAgent || "",
);

function DesktopOnlyNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b12] p-6 text-slate-100">
      <section className="w-full max-w-lg border border-violet-700/50 bg-[#0e1520] p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border border-violet-500/50 bg-violet-950/40 text-violet-200">
          <Monitor size={30} aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-black tracking-[0.24em] text-violet-300">
          NEXORA DESKTOP STUDIO
        </p>
        <h1 className="mt-3 text-2xl font-black text-white">
          Open NEXORA on a desktop computer
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          NEXORA is a desktop game-development factory. Its IDE, local project
          files, game engines and export toolchains run on your computer. This
          workspace is not available on phones or tablets.
        </p>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          <div className="border border-slate-700 bg-[#080d14] p-3">
            <Laptop size={19} className="text-cyan-300" aria-hidden="true" />
            <p className="mt-2 text-xs font-bold text-white">Create on desktop</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              Install the NEXORA Local Agent, create your game and build it
              using your computer's hardware.
            </p>
          </div>
          <div className="border border-slate-700 bg-[#080d14] p-3">
            <Smartphone size={19} className="text-emerald-300" aria-hidden="true" />
            <p className="mt-2 text-xs font-bold text-white">Phone is optional</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              You can export an Android APK or AAB on desktop. Connect a
              physical phone only when you want to test an APK.
            </p>
          </div>
        </div>
        <p className="mt-6 text-[10px] text-slate-500">
          Your projects and builds stay on the computer you choose.
        </p>
      </section>
    </main>
  );
}

createRoot(rootElement).render(
  <React.StrictMode>
    {mobileDevice ? <DesktopOnlyNotice /> : <NexoraFoundryWorkspace />}
  </React.StrictMode>
);
