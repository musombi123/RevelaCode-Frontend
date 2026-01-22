import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Facebook, Instagram, MessageCircle, Bot, Twitter, Linkedin } from "lucide-react";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  const [integrations, setIntegrations] = useState(
    initialIntegrations.map((i) => ({ ...i, connected: false }))
  );
  const [loading, setLoading] = useState(false);

  // --- Fetch connected accounts from backend ---
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/user/connections`);
        const data = await res.json();
        if (res.ok && data.success) {
          setIntegrations((prev) =>
            prev.map((i) => ({
              ...i,
              connected: data.connectedAccounts?.includes(i.name) || i.name === "ChatGPT",
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to fetch connected accounts:", err);
      }
    };
    fetchConnections();
  }, []);

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
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">
            🔗 Connected Accounts
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your linked platforms for a personalized experience.
          </p>
        </div>

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
