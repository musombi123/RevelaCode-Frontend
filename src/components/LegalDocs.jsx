import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function LegalDocs({ onClose }) {
  const [activeTab, setActiveTab] = useState("privacy"); // "privacy" | "terms"
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Use environment variable or fallback
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // --- Fetch document from backend ---
  const fetchDoc = async (type) => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/legal/${type}`);
      if (!res.ok) {
        throw new Error(`Failed to load ${type}: ${res.status}`);
      }
      const data = await res.json();

      // Use content from backend or fallback
      if (typeof data.content === "string") {
        setContent(data.content);
      } else {
        setContent(
          type === "privacy"
            ? "<h3>Privacy Policy</h3><p>Your privacy is important. Lorem ipsum dolor sit amet...</p>"
            : "<h3>Terms of Service</h3><p>Use this app responsibly. Lorem ipsum dolor sit amet...</p>"
        );
      }
    } catch (err) {
      console.warn(err);
      setContent(
        type === "privacy"
          ? "<h3>Privacy Policy</h3><p>Your privacy is important. Lorem ipsum dolor sit amet...</p>"
          : "<h3>Terms of Service</h3><p>Use this app responsibly. Lorem ipsum dolor sit amet...</p>"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch content whenever activeTab changes
  useEffect(() => {
    fetchDoc(activeTab);
  }, [activeTab]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 text-xl hover:text-red-500"
          aria-label="Close Legal Docs"
        >
          ✖
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold mb-4 text-center text-indigo-600 dark:text-indigo-300">
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
        <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-lg dark:border-gray-700 prose prose-sm dark:prose-invert">
          {loading ? (
            <p>🔄 Loading...</p>
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
