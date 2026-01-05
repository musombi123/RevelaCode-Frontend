import React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/Dialog.jsx";
import { Button } from "./ui/Button.jsx";
import { Mail, Bug, BookOpen, Clipboard } from "lucide-react";

const HelpModal = () => {
  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@revelacode.com");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 rounded-2xl shadow-sm hover:shadow-md">
          <Mail className="w-4 h-4" aria-hidden="true" />
          Contact Support
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
          <DialogDescription>
            We’re here to help. Choose an option below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 rounded-md border">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">support@revelacode.com</span>
            </div>
            <Button size="icon" variant="ghost" onClick={handleCopyEmail} title="Copy email">
              <Clipboard className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          <a href="/bug-report" className="flex items-center gap-2 text-blue-600 hover:underline">
            <Bug className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Report a bug</span>
          </a>

          <a href="/docs" className="flex items-center gap-2 text-blue-600 hover:underline">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Read our FAQ / Docs</span>
          </a>

          <div className="text-xs text-gray-500 mt-2">RevelaCode v1.0.0</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
