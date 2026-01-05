import React from "react";
import { Card, CardContent, CardHeader } from "./ui/Card.jsx";

import usePreferences from "./hooks/usePreferences.jsx";
import { useTheme } from "./hooks/useTheme.jsx";

import {
  Globe,
  Shield,
  FileText,
  HelpCircle,
  Copy,
} from "lucide-react";

import { toast } from "react-hot-toast";

export default function PreferencesDashboard() {
  const { fontSize, setFontSize } = usePreferences();
  const { theme, setTheme } = useTheme();

  // Placeholder user profile (safe)
  const username = "William";
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;

  return (
    <Card className="shadow-xl rounded-2xl flex flex-col min-h-[75vh] overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      
      {/* Header */}
      <CardHeader className="bg-indigo-50 dark:bg-indigo-900/30 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt="User Avatar"
            className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600"
          />
          <div>
            <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
              {username}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              RevelaCode member since 2025
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 flex flex-col gap-8 p-6">

        {/* Font Size */}
        <section>
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            🔠 Font Size
          </h3>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="w-full border rounded p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </section>

        {/* Language */}
        <section>
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Language
          </h3>
          <select
            className="w-full border rounded p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          >
            <option>English</option>
            <option>Swahili</option>
            <option>French</option>
          </select>
        </section>

        {/* Theme */}
        <section>
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            🎨 Theme
          </h3>
          <button
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            className="w-full py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {theme === "dark"
              ? "☀ Switch to Light Mode"
              : "🌙 Switch to Dark Mode"}
          </button>
        </section>

        {/* Legal & Support */}
        <section className="flex flex-col gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex gap-2">
            <a
              href="/privacy-policy"
              className="flex-1 text-center px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs hover:underline flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3" /> Privacy Policy
            </a>
            <a
              href="/terms-of-service"
              className="flex-1 text-center px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs hover:underline flex items-center justify-center gap-1"
            >
              <FileText className="w-3 h-3" /> Terms
            </a>
          </div>

          <div className="flex items-center justify-between p-2 border rounded bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-gray-800 dark:text-gray-200">
                support@revelacode.com
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText("support@revelacode.com");
                toast.success("Copied!");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
        </section>

      </CardContent>
    </Card>
  );
}
