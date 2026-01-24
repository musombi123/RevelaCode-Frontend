import React, { useState, useRef } from "react";
import { Mic } from "lucide-react";

export default function RevelaAIVoiceChat({ onVoiceResult }) {
  const [listening, setListening] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startVoice = async () => {
    setListening(true);
    chunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.start();

    mediaRecorderRef.current.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("audio", blob, "voice.webm");

      try {
        const res = await fetch(
          `${import.meta.env.VITE_REVELAAI_URL}/voice`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();
        onVoiceResult(data.heard, data.response);

        if (data.audio_file) {
          const audio = new Audio(
            `${import.meta.env.VITE_REVELAAI_URL}${data.audio_file}`
          );
          audio.play();
        }
      } catch (e) {
        console.error("Voice error", e);
      }

      setListening(false);
    };

    // Auto-stop after 5 seconds
    setTimeout(() => mediaRecorderRef.current.stop(), 5000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={startVoice}
        className={`p-6 rounded-full text-white transition
          ${listening ? "bg-red-600 animate-pulse" : "bg-blue-600"}`}
      >
        <Mic size={32} />
      </button>

      <p className="text-sm text-gray-500">
        {listening ? "Listening…" : "Tap to speak"}
      </p>
    </div>
  );
}
