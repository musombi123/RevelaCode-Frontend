import React, { useState, useRef } from "react";
import { Mic } from "lucide-react";

export default function RevelaAIVoiceChat({ onVoiceResult }) {
  const [state, setState] = useState("idle"); 
  // idle | listening | processing | responding

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      setState("listening");
      chunksRef.current = [];

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current.start();

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = sendAudio;

      // Safety auto-stop (mobile friendly)
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        }
      }, 6000);
    } catch (err) {
      console.error("Mic error:", err);
      setState("idle");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setState("processing");
  };

  const sendAudio = async () => {
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

      /* 🎙️ AUTO-SEND TEXT */
      if (data?.heard) {
        onVoiceResult(data.heard);
      }

      /* 🧠 STREAM-LIKE RESPONSE AUDIO */
      if (data?.audio_file) {
        setState("responding");

        const audio = new Audio(
          `${import.meta.env.VITE_REVELAAI_URL}${data.audio_file}`
        );

        audio.onended = () => setState("idle");
        audio.play();
      } else {
        setState("idle");
      }
    } catch (err) {
      console.error("Voice request failed:", err);
      setState("idle");
    }
  };

  const handleClick = () => {
    if (state === "idle") startRecording();
    else if (state === "listening") stopRecording();
  };

  return (
    <button
      onClick={handleClick}
      className={`p-3 rounded-full transition-all
        ${
          state === "listening"
            ? "bg-red-600 animate-pulse"
            : state === "processing"
            ? "bg-yellow-600"
            : state === "responding"
            ? "bg-green-600"
            : "bg-blue-600 hover:bg-blue-700"
        }
        text-white`}
      title={
        state === "listening"
          ? "Tap to stop"
          : state === "responding"
          ? "Speaking…"
          : "Tap to speak"
      }
    >
      <Mic size={20} />
    </button>
  );
}
