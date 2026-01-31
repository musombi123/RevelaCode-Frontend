import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, RefreshCw } from "lucide-react";

/* ==============================
   LOCAL LEGAL CONTENT (NO API)
   ============================== */

const PRIVACY_DOC = `
<h3>Privacy Policy</h3>
<p>Your privacy matters. We collect only what is necessary to run the application effectively.</p>

<h4>Data Collection</h4>
<p>We may collect basic usage data such as interaction patterns and preferences.</p>

<h4>Data Usage</h4>
<p>Your information is used strictly to improve your experience within this platform.</p>

<h4>Security</h4>
<p>We implement reasonable safeguards to protect your data from unauthorized access.</p>
`;

const TERMS_DOC = `
<h3>Terms of Service</h3>
<p>By using this application, you agree to use it responsibly and ethically.</p>

<h4>Acceptable Use</h4>
<p>No malicious activity, exploitation, or abuse of the platform is permitted.</p>

<h4>Liability</h4>
<p>We are not responsible for third-party content accessed through external links.</p>

<h4>Modifications</h4>
<p>These terms may be updated from time to time without prior notice.</p>
`;

export default function LegalDocs({
  activeTab: activeTabProp = "privacy",
  onBack,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(activeTabProp);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const loadLocalDoc = (type) => {
    setLoading(true);

    // Simulate a tiny async delay so the UX still feels "professional"
    setTimeout(() => {
      setContent(type === "privacy" ? PRIVACY_DOC : TERMS_DOC);
      setLoading(false);
    }, 200);
  };

  useEffect(() => {
    setActiveTab(activeTabProp);
  }, [activeTabProp]);

  useEffect(() => {
    loadLocalDoc(activeTab);
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
          onClick={() => loadLocalDoc(activeTab)}
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
        ) : (
          renderHTML()
        )}
      </div>
    </div>
  );
}
