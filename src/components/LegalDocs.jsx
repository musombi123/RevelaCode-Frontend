import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function LegalDocs({
  activeTab: activeTabProp = "privacy", // default tab if used in dashboard
  onBack, // optional dashboard back button
  onClose, // optional close button for modal
}) {
  const [activeTab, setActiveTab] = useState(activeTabProp); // "privacy" | "terms"
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchDoc = async (type) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${baseUrl}/api/legal/${type}`);
      if (!res.ok) throw new Error(`Failed to load ${type}: ${res.status}`);

      const data = await res.json();

      // supports both {content: "..."} and {html: "..."}
      const raw =
        typeof data?.content === "string"
          ? data.content
          : typeof data?.html === "string"
          ? data.html
          : "";

      if (!raw) throw new Error("Backend returned empty legal document.");

      setContent(raw);
    } catch (err) {
      console.warn(err);
      setErrorMsg("Backend unavailable. Showing fallback legal content.");

      // Fallback content
      setContent(
        type === "privacy"
          ? `<h3>Privacy Policy</h3><p>Your privacy is important. This document could not be loaded from the server.</p>`
          : `<h3>Terms of Service</h3><p>Use this app responsibly. This document could not be loaded from the server.</p>`
      );
    } finally {
      setLoading(false);
    }
  };

  // sync with dashboard prop
  useEffect(() => {
    setActiveTab(activeTabProp);
  }, [activeTabProp]);

  // fetch whenever tab changes
  useEffect(() => {
    fetchDoc(activeTab);
  }, [activeTab]);

  const renderHTML = () => {
    const safe =
      typeof content === "string" ? content.replace(/\n/g, "<br/>") : "";
    return <div dangerouslySetInnerHTML={{ __html: safe }} />;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <h2 className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-300">
            📜 Legal Documents
          </h2>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 text-2xl hover:text-red-500 transition"
            aria-label="Close Legal Docs"
          >
            ✖
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          variant={activeTab === "privacy" ? "default" : "outline"}
          onClick={() => setActiveTab("privacy")}
        >
          Privacy Policy
        </Button>

        <Button
          variant={activeTab === "terms" ? "default" : "outline"}
          onClick={() => setActiveTab("terms")}
        >
          Terms of Service
        </Button>

        <Button
          variant="outline"
          onClick={() => fetchDoc(activeTab)}
          className="ml-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Note */}
      {errorMsg && (
        <div className="mb-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 text-sm">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 border rounded-lg dark:border-gray-700 prose prose-sm dark:prose-invert bg-white dark:bg-gray-900">
        {loading ? (
          <p className="text-center text-gray-500">🔄 Loading...</p>
        ) : (
          renderHTML()
        )}
      </div>
    </div>
  );
}
