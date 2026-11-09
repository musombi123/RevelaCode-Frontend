import React from "react";
export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("RevelaCode render boundary caught an error:", error, info); }
  clearAndReload = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
      try { sessionStorage.removeItem("revelacode-chunk-reload"); } catch {}
    } finally { window.location.reload(); }
  };
  render() {
    if (!this.state.hasError) return this.props.children;
    return <main role="alert" className="flex min-h-screen items-center justify-center bg-[#0a0f16] p-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-xl font-bold text-emerald-300">R</div>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">RevelaCode could not render this workspace. Reload the app or clear its cached files and try again.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Reload</button>
          <button type="button" onClick={this.clearAndReload} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white">Clear cache &amp; reload</button>
        </div>
      </section>
    </main>;
  }
}
