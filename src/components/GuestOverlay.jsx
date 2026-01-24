import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GuestOverlay({ onLogin }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60">
      <div className="flex flex-col items-center justify-center text-center p-6 bg-yellow-100 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded-xl shadow-lg space-y-4 max-w-md mx-4">
        <AlertTriangle className="w-12 h-12" />
        <h3 className="text-xl font-semibold">Limited Guest Access</h3>
        <p className="text-sm max-w-md">
          You’re currently browsing as a guest. To unlock prophecy tools, linked accounts,
          and personalization, please create an account or log in.
        </p>
        <button
          onClick={onLogin}
          className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
        >
          Create Account / Login
        </button>
      </div>
    </div>
  );
}
