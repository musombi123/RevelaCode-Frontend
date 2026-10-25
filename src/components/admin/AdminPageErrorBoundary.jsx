import React from "react";

export default class AdminPageErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(
      `Admin page render failed: ${this.props.pageTitle || "Unknown page"}`,
      error,
      info,
    );
  }

  retry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const pageTitle = this.props.pageTitle || "this admin page";

    if (!error) return this.props.children;

    const message =
      typeof error?.message === "string" && error.message.trim()
        ? error.message.trim()
        : "An unexpected rendering error occurred.";

    return (
      <div
        role="alert"
        className="mx-auto my-4 max-w-3xl rounded-2xl border border-rose-300 bg-rose-50 p-5 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100 sm:p-6"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">
          Admin page error
        </p>
        <h2 className="mt-2 text-lg font-bold">
          {pageTitle} could not be displayed
        </h2>
        <p className="mt-2 text-sm leading-6">
          The page encountered a rendering error. The rest of the Admin Console
          remains available; use the details below to identify the failing value
          or component.
        </p>
        <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-rose-200 bg-white/80 p-3 text-xs dark:border-rose-900/50 dark:bg-black/20">
          {message}
        </pre>
        {error?.stack ? (
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer font-semibold">
              Technical details
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white/80 p-3 dark:bg-black/20">
              {String(error.stack)}
            </pre>
          </details>
        ) : null}
        <button
          type="button"
          onClick={this.retry}
          className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-rose-700 px-4 text-xs font-bold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }
}
