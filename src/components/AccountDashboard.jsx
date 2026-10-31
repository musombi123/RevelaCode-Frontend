// frontend/components/AccountDashboard.jsx
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Facebook, Instagram, MessageCircle, Bot, Twitter, Linkedin } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import MfaSettings from "./accounts/MfaSettings.jsx";

const baseUrl = import.meta.env.VITE_REVELACODE_URL 
                || import.meta.env.VITE_BACKEND_URL 
                || import.meta.env.VITE_API_URL;

const initialIntegrations = [
  { name: "Google", icon: Mail, oauth: true },
  { name: "Facebook", icon: Facebook, oauth: true },
  { name: "Instagram", icon: Instagram, oauth: true },
  { name: "TikTok", icon: MessageCircle, oauth: true },
  { name: "LinkedIn", icon: Linkedin, oauth: true },
  { name: "Twitter", icon: Twitter, oauth: true },
  { name: "WhatsApp", icon: MessageCircle, oauth: true },
  { name: "ChatGPT", icon: Bot, oauth: false },
];

export default function AccountDashboard() {
  const { user, authFetch } = useAuth(); // use the existing central RevelaCode session
  const [integrations, setIntegrations] = useState(
    initialIntegrations.map((i) => ({ ...i, connected: false }))
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchConnections = async () => {
      if (!user?.contact || !baseUrl || typeof authFetch !== "function") return;
      try {
        const response = await authFetch(
          `${String(baseUrl).replace(/\/+$/, "")}/api/user/connections?contact=${encodeURIComponent(user.contact)}`,
          { method: "GET", headers: { Accept: "application/json" } },
        );
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && data.success) {
          setIntegrations((previous) =>
            previous.map((item) => ({
              ...item,
              connected: data.connectedAccounts?.includes(item.name) || item.name === "ChatGPT",
            }))
          );
        }
      } catch (error) {
        if (!cancelled) console.warn("Failed to fetch connected accounts:", error);
      }
    };
    fetchConnections();
    return () => { cancelled = true; };
  }, [user?.contact, authFetch]);

  const handleConnect = async (platform) => {
    try {
      if (platform.connected) {
        alert(`✅ Already connected to ${platform.name}`);
        return;
      }

      if (platform.oauth) {
        // Redirect user to OAuth route
        window.location.href = `${baseUrl}/api/oauth/${platform.name.toLowerCase()}`;
        return;
      }

      // For non-OAuth (like ChatGPT), simple connect API call
      const res = await fetch(`${baseUrl}/api/connect/${platform.name.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: user.contact }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(`✅ Connected to ${platform.name}`);
        setIntegrations((prev) =>
          prev.map((i) =>
            i.name === platform.name ? { ...i, connected: true } : i
          )
        );
      } else {
        alert(`❌ Could not connect to ${platform.name}: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert(`❌ Error connecting to ${platform.name}: ${err.message}`);
    }
  };

  return (
    <Card className="shadow-md rounded-2xl overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <MfaSettings />

        {/* --- User Info --- */}
        {user && (
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">
              👤 Welcome, {user.fullName || "User"}!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Contact: {user.contact} | Role: {user.role}
            </p>
          </div>
        )}

        {/* --- Connected Accounts Header --- */}
        <div className="text-center space-y-1">
          <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-300">
            🔗 Connected Accounts
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your linked platforms for a personalized experience.
          </p>
        </div>

        {/* --- Integrations Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {integrations.map((platform) => {
            const Icon = platform.icon;
            return (
              <div
                key={platform.name}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 transition-all"
              >
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-medium">
                  <Icon className="w-5 h-5" />
                  {platform.name}
                </div>
                <Button
                  size="sm"
                  variant={platform.connected ? "secondary" : "default"}
                  disabled={platform.connected || loading}
                  onClick={() => handleConnect(platform)}
                >
                  {platform.connected ? "✓ Connected" : "Connect"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-muted-foreground">
            Linking your accounts helps sync activity, share prophecy insights, and unlock assistant features.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
