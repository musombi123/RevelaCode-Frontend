import React, { useState } from "react";
import { Mic } from "lucide-react";

export default function RevelaAIVoiceChat({ onVoiceResult }) {
  const [listening, setListening] = useState(false);

  const startVoice = async () => {
    setListening(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_REVELAAI_URL}/voice`
      );
      const data = await res.json();

      if (data?.heard && data?.response) {
        onVoiceResult(data.heard, data.response);
      }
    } catch (e) {
      console.error("Voice error", e);
    } finally {
      setListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <button
        onClick={startVoice}
        className={`p-6 rounded-full text-white transition
          ${listening ? "bg-red-600 animate-pulse" : "bg-blue-600"}
        `}
      >
        <Mic size={32} />
      </button>

      <p className="text-sm text-gray-500">
        {listening ? "Listening…" : "Tap to speak"}
      </p>
    </div>
  );
}
