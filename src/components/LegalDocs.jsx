import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function LegalDocs({ onClose }) {
  const [activeTab, setActiveTab] = useState("privacy"); // "privacy" | "terms"
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchDoc = async (type) => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/legal/${type}`);
      if (!res.ok) throw new Error(`Failed to load ${type}: ${res.status}`);
      const data = await res.json();
      setContent(typeof data.content === "string" ? data.content : "");
    } catch (err) {
      console.warn(err);
      // Fallback content if backend fails
      setContent(
        type === "privacy"
          ? `<h3>Privacy Policy</h3><p>Your privacy is important. Lorem ipsum dolor sit amet...</p>`
          : `<h3>Terms of Service</h3><p>Use this app responsibly. Lorem ipsum dolor sit amet...</p>`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc(activeTab);
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center p-2">
      <div className="relative w-full h-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 overflow-hidden flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 text-2xl hover:text-red-500"
          aria-label="Close Legal Docs"
        >
          ✖
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600 dark:text-indigo-300">
          📜 Legal Documents
        </h2>

        {/* Tabs */}
        <div className="flex justify-center mb-4 space-x-4">
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 border rounded-lg dark:border-gray-700 prose prose-sm dark:prose-invert">
          {loading ? (
            <p className="text-center text-gray-500">🔄 Loading...</p>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
