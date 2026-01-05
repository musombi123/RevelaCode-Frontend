import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function LegalDocs({ onClose }) {
  const [activeTab, setActiveTab] = useState("privacy"); // "privacy" | "terms"
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_API_URL;

  const fetchDoc = async (type) => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/legal/${type}`);
      const data = await res.json();
      if (res.ok) {
        setContent(data.content);
      } else {
        setContent(`❌ Failed to load ${type}: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      setContent("❌ Error loading document.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc(activeTab);
  }, [activeTab]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 text-xl hover:text-red-500"
        >
          ✖
        </button>

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
            <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }} />
          )}
        </div>
      </div>
    </div>
  );
}
