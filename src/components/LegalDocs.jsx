// frontend/components/LegalDocs.jsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function LegalDocs({ activeTab: activeTabProp = "privacy", onBack, onClose }) {
  const baseUrl = import.meta.env.VITE_REVELACODE_URL 
                || import.meta.env.VITE_BACKEND_URL 
                || import.meta.env.VITE_API_URL;

  const [activeTab, setActiveTab] = useState(activeTabProp);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDocFromBackend = async (type) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${baseUrl}/api/legal/${type}`);
      if (!res.ok) throw new Error("Failed to load document");
      const data = await res.json();
      setContent(data?.content || `<p>No ${type} document found.</p>`);
    } catch (err) {
      setError(err.message || "❌ Could not load document");
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(activeTabProp);
  }, [activeTabProp]);

  useEffect(() => {
    loadDocFromBackend(activeTab);
  }, [activeTab]);

  const renderHTML = () => {
    return <div dangerouslySetInnerHTML={{ __html: content || "" }} />;
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
          onClick={() => loadDocFromBackend(activeTab)}
          className="ml-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 border rounded-lg dark:border-gray-700 prose prose-sm dark:prose-invert bg-white dark:bg-gray-900">
        {loading ? (
          <p className="text-center text-gray-500">🔄 Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          renderHTML()
        )}
      </div>
    </div>
  );
}
