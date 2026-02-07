// frontend/components/UserProfile.jsx
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { User, Mail, Phone, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

export default function UserProfile() {
  const { user } = useAuth(); // ✅ grab logged-in user from context

  if (!user) {
    return (
      <div className="p-6 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
        ⚠ No user data loaded.
      </div>
    );
  }

  // Use the exact keys stored in AuthContext
  const fullName = user.fullName || "Guest";
  const contact = user.contact || "";
  const role = user.role || "normal";

  // Generate initials
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : null;

  return (
    <Card className="shadow-md rounded-lg m-4 bg-white dark:bg-gray-900">
      <CardHeader className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-600 text-white text-lg font-bold">
          {initials || <User className="w-6 h-6" />}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {fullName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Role: {role}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 text-sm">
        {contact && (
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            {contact.includes("@") ? (
              <Mail className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            <span>{contact}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Shield className="w-4 h-4" />
          <span>{role}</span>
        </div>
      </CardContent>
    </Card>
  );
}
