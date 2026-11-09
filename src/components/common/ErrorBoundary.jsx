import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("RevelaCode render boundary caught an error:", error, info);
    this.setState({ error, info });
  }

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
    } finally {
      window.location.reload();
    }
  };

  copyDiagnostics = async () => {
    const details = [
      "RevelaCode render error",
      this.state.error?.name || "Error",
      this.state.error?.message || "No error message captured",
      this.state.error?.stack || "",
      this.state.info?.componentStack || "",
      "URL: " + window.location.href,
      "User agent: " + navigator.userAgent,
    ].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
    } catch {
      console.error(details);
      window.prompt("Copy this error report:", details);
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const errorMessage = this.state.error?.message || "The application threw an error without a message.";
    const componentStack = this.state.info?.componentStack || "";

    return (
      <main role="alert" className="flex min-h-screen items-center justify-center bg-[#0a0f16] p-6 text-white">
        <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-xl font-bold text-emerald-300">R</div>
          <h1 className="text-center text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-center text-sm leading-6 text-slate-300">
            RevelaCode caught a workspace error. Copy the diagnostic below and share it with the development team.
          </p>
          <div className="mt-5 rounded-xl border border-red-400/20 bg-red-950/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-300">{this.state.error?.name || "Runtime error"}</p>
            <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-red-100">{errorMessage}</pre>
          </div>
          {componentStack && (
            <details className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-200">Component trace</summary>
              <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-400">{componentStack}</pre>
            </details>
          )}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Reload</button>
            <button type="button" onClick={this.clearAndReload} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white">Clear cache &amp; reload</button>
            <button type="button" onClick={this.copyDiagnostics} className="rounded-xl border border-emerald-400/30 px-4 py-3 text-sm font-semibold text-emerald-200">{this.state.copied ? "Copied" : "Copy error report"}</button>
          </div>
        </section>
      </main>
    );
  }
}
