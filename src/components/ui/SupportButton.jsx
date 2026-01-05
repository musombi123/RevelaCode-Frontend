import React from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const SupportButton = () => {
  return (
    <a
      href="mailto:support@revelacode.com"
      title="Need help? Contact our support team"
    >
      <Button
        variant="outline"
        className="flex items-center gap-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <Mail className="w-4 h-4" aria-hidden="true" />
        <span>Contact Support</span>
      </Button>
    </a>
  );
};

export default SupportButton;
