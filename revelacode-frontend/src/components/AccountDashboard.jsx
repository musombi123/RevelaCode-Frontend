import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Linkedin, Facebook, Instagram, MessageCircle, Bot } from 'lucide-react';

export default function AccountDashboard() {
  const platforms = [
    { name: 'TikTok', icon: <MessageCircle className="mr-2" />, connected: false },
    { name: 'ChatGPT', icon: <Bot className="mr-2" />, connected: true },
    { name: 'Facebook', icon: <Facebook className="mr-2" />, connected: false },
    { name: 'Instagram', icon: <Instagram className="mr-2" />, connected: false },
    { name: 'WhatsApp', icon: <MessageCircle className="mr-2" />, connected: false },
    { name: 'LinkedIn', icon: <Linkedin className="mr-2" />, connected: false }
  ];

  const handleConnect = (platformName) => {
    // TODO: Integrate with real OAuth or backend sync
    alert(`You clicked connect for ${platformName}`);
  };

  return (
    <Card className="w-full shadow-md rounded-2xl">
      <CardContent className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-center">🔗 Account Integrations</h2>

        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center justify-between p-4 bg-muted rounded-xl"
            >
              <span className="flex items-center font-medium">
                {platform.icon}
                {platform.name}
              </span>
              <Button
                variant={platform.connected ? 'secondary' : 'default'}
                disabled={platform.connected}
                onClick={() => handleConnect(platform.name)}
              >
                {platform.connected ? 'Connected' : 'Connect'}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground text-sm">
          Link your accounts to personalize prophecy sharing, sync history, and expand access.
        </p>
      </CardContent>
    </Card>
  );
}
