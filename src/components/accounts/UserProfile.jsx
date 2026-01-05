// src/components/accounts/UserProfile.jsx
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { User, Mail, Phone, Shield } from "lucide-react";

export default function UserProfile({ user }) {
  if (!user) {
    return (
      <div className="p-6 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
        ⚠ No user data loaded.
      </div>
    );
  }

  return (
    <Card className="shadow-md rounded-lg m-4 bg-white dark:bg-gray-900">
      <CardHeader className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-600 text-white text-lg font-bold">
          {user.full_name?.[0]?.toUpperCase() || <User className="w-6 h-6" />}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {user.full_name || "Guest"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Role: {user.role || "normal"}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 text-sm">
        {user.contact && (
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            {user.contact.includes("@") ? (
              <Mail className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            <span>{user.contact}</span>
          </div>
        )}

        {user.role && (
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Shield className="w-4 h-4" />
            <span>{user.role}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
