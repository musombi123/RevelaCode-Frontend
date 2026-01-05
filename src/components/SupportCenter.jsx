import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Bug, BookOpen, Clipboard } from "lucide-react";

const SupportCenter = () => {
  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@revelacode.com");
  };

  return (
    <Card className="max-w-lg mx-auto my-8 rounded-2xl shadow-sm">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">RevelaCode Support Center</h2>
        <p className="text-gray-500 text-sm">
          Need help? Contact us or explore our resources below.
        </p>

        <div className="flex items-center justify-between p-2 rounded-md border">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">support@revelacode.com</span>
          </div>
          <Button size="icon" variant="ghost" onClick={handleCopyEmail} title="Copy email">
            <Clipboard className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a href="/bug-report" className="flex items-center gap-2 text-blue-600 hover:underline">
            <Bug className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Report a bug</span>
          </a>
          <a href="/docs" className="flex items-center gap-2 text-blue-600 hover:underline">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Docs & FAQ</span>
          </a>
        </div>

        <div className="text-xs text-gray-400 mt-2">
          RevelaCode v1.0.0 &bull; Updated July 2025
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportCenter;
