"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button.jsx";

const API = import.meta.env.VITE_API_URL;

export default function SupportResolveModal({
  open,
  ticket,
  onClose,
  onResolved,
}) {
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !ticket) return null;

  async function handleResolve() {
    if (!resolution.trim()) {
      alert("Please enter a resolution.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/support/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_id: ticket.id,
          resolution,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to resolve ticket.");
      }

      onResolved?.(data.ticket);

      setResolution("");

      onClose();

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">

        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-5">

          <div>

            <h2 className="text-xl font-bold">
              Resolve Ticket
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {ticket.subject}
            </p>

          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500"
          >
            <X />
          </button>

        </div>

        <div className="p-5 space-y-4">

          <div>

            <label className="text-sm font-medium">
              Resolution
            </label>

            <textarea
              rows={6}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="
              mt-2
              w-full
              rounded-xl
              border
              border-gray-300
              dark:border-gray-700
              bg-white
              dark:bg-gray-950
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-indigo-500
              resize-none"
              placeholder="Explain how the issue was resolved..."
            />

          </div>

        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800 p-5">

          <Button
            variant="outline"
            onClick={onClose}
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
                <Loader2
                  className="animate-spin"
                  size={18}
                />
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