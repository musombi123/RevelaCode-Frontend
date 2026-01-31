import React, { useState, useRef } from "react";
import { Mic } from "lucide-react";

export default function RevelaAIVoiceChat({ onVoiceResult }) {
  const [state, setState] = useState("idle"); // idle | listening | processing | responding
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioQueueRef = useRef([]); // Queue for multiple audio responses
  const isPlayingRef = useRef(false);

  /* ---------------- START RECORDING ---------------- */
  const startRecording = async () => {
    try {
      setState("listening");
      chunksRef.current = [];

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current.start();

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = sendAudio;

      // Auto-stop after 6s
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") stopRecording();
      }, 6000);
    } catch (err) {
      console.error("Mic error:", err);
      setState("idle");
    }
  };

  /* ---------------- STOP RECORDING ---------------- */
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setState("processing");
    }
  };

  /* ---------------- PLAY QUEUED AUDIO ---------------- */
  const playNextAudio = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setState("idle");
      return;
    }

    const nextUrl = audioQueueRef.current.shift();
    isPlayingRef.current = true;
    setState("responding");

    const audio = new Audio(nextUrl);
    audio.onended = () => playNextAudio();
    audio.play().catch((err) => {
      console.error("Audio play failed:", err);
      playNextAudio();
    });
  };

  /* ---------------- SEND AUDIO TO SERVER ---------------- */
  const sendAudio = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob, "voice.webm");

    try {
      const res = await fetch(`${import.meta.env.VITE_REVELAAI_URL}/voice`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Voice response:", data);

      // Send recognized text back
      if (data?.heard) onVoiceResult(data.heard);

      // Queue audio for playback
      if (data?.audio_url) {
        const audioUrl =
          data.audio_url.startsWith("/") ? data.audio_url : `/${data.audio_url}`;
        const fullUrl = `${import.meta.env.VITE_REVELAAI_URL}${audioUrl}`;

        audioQueueRef.current.push(fullUrl);

        // If nothing is playing, start playback immediately
        if (!isPlayingRef.current) playNextAudio();
      } else {
        if (!isPlayingRef.current) setState("idle");
      }
    } catch (err) {
      console.error("Voice request failed:", err);
      if (!isPlayingRef.current) setState("idle");
    }
  };

  /* ---------------- BUTTON CLICK ---------------- */
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
        } text-white`}
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
