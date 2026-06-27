"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

const API = import.meta.env.VITE_API_URL;

export default function SupportResolveModal({
  open,
  ticket,
  onClose,
  onResolved,
}) {
  const { user } = useAuth();

  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !ticket) return null;

  async function handleResolve() {
    if (loading) return;

    if (!resolution.trim()) {
      alert("Please enter a resolution.");
      return;
    }

    if (!user?.apiKey) {
      alert("Support session expired. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/support/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": user.apiKey,
        },
        body: JSON.stringify({
          ticket_id: ticket.id || ticket._id,
          resolution,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to resolve ticket.");
      }

      onResolved?.(data.ticket);

      setResolution("");
      onClose();
    } catch (err) {
      alert(err.message || "Unable to resolve ticket.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setResolution("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-5">
          <div>
            <h2 className="text-xl font-bold">
              Resolve Ticket
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {ticket.subject}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-red-500"
          >
            <X />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label
              htmlFor="resolution"
              className="text-sm font-medium"
            >
              Resolution
            </label>

            <textarea
              id="resolution"
              rows={6}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="mt-2 w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950"
              placeholder="Explain how the issue was resolved..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 p-5 dark:border-gray-800">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={handleResolve}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Resolving...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Resolve Ticket
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
