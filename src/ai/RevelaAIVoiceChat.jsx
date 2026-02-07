import React, { useState, useRef } from "react";
import { Mic } from "lucide-react";

export default function RevelaAIVoiceChat({ onVoiceResult }) {
  const [state, setState] = useState("idle"); // idle | listening | processing | responding
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  // Convert WebM Blob to 16kHz mono WAV
  const convertToWav = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Mono channel
    const channelData = audioBuffer.getChannelData(0);
    const buffer = new ArrayBuffer(channelData.length * 2);
    const view = new DataView(buffer);

    let offset = 0;
    for (let i = 0; i < channelData.length; i++) {
      let s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([view], { type: "audio/wav" });
  };

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

      // Stop recording automatically after 6s
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") stopRecording();
      }, 6000);
    } catch (err) {
      console.error("Mic error:", err);
      setState("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setState("processing");
    }
  };

  const sendAudio = async () => {
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const wavBlob = await convertToWav(blob);

      const formData = new FormData();
      formData.append("audio", wavBlob, "voice.wav");

      const res = await fetch(`${import.meta.env.VITE_REVELAAI_URL}/voice`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data?.heard) onVoiceResult(data.heard);

      if (data?.audio_url) {
        setState("responding");
        const audioUrl =
          data.audio_url.startsWith("/") ? data.audio_url : `/${data.audio_url}`;
        const audio = new Audio(`${import.meta.env.VITE_REVELAAI_URL}${audioUrl}`);
        audio.onended = () => setState("idle");
        audio.play().catch((err) => {
          console.error("Audio play failed:", err);
          setState("idle");
        });
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
