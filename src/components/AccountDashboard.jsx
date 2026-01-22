import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Facebook, Instagram, MessageCircle, Bot, Twitter, Linkedin } from "lucide-react";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const integrations = [
  { name: "Google", icon: Mail, oauth: false, connected: false },
  { name: "Facebook", icon: Facebook, oauth: false, connected: false },
  { name: "Instagram", icon: Instagram, oauth: false, connected: false },
  { name: "TikTok", icon: MessageCircle, oauth: false, connected: false },
  { name: "LinkedIn", icon: Linkedin, oauth: false, connected: false },
  { name: "Twitter", icon: Twitter, oauth: false, connected: false },
  { name: "WhatsApp", icon: MessageCircle, oauth: false, connected: false },
  { name: "ChatGPT", icon: Bot, oauth: false, connected: true }
];

export default function AccountDashboard() {
  const handleConnect = async (platform) => {
    try {
      // Only handle OAuth for platforms that have backend routes
      if (platform.oauth) {
        alert(`🔐 OAuth login not yet implemented for ${platform.name}`);
        return;
      }

      // For non-OAuth platforms, example: guest account check
      if (platform.name === "ChatGPT") {
        alert("Already connected to ChatGPT");
        return;
      }

      // Example: call backend guest route
      const response = await fetch(`${baseUrl}/api/guest`);
      const data = await response.json();

      if (data.success) {
        alert(`✅ Guest account access granted: ${data.message}`);
      } else {
        alert(`❌ Could not connect: ${data.message}`);
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
                  disabled={platform.connected}
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
