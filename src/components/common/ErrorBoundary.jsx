import React from "react";

/* ======================================================
   Error Boundary (JSX Safe)
====================================================== */

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-red-500 text-center">
          <h2 className="text-lg font-semibold mb-2">
            ⚠️ Dashboard failed to load
          </h2>
          <p className="text-sm text-gray-400">
            Please refresh the page or contact support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
