import React, { useRef, useEffect } from "react";

export default function RevelaAIVoiceChat({ onVoiceResult, onClose }) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationIdRef = useRef(null);
  const canvasRef = useRef(null);

  // Convert WebM -> 16kHz WAV
  const convertToWav = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
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
      onClose?.();

      if (data?.audio_url) {
        const audioUrl = data.audio_url.startsWith("/") ? data.audio_url : `/${data.audio_url}`;
        const audio = new Audio(`${import.meta.env.VITE_REVELAAI_URL}${audioUrl}`);
        audio.play().catch(console.error);
      }
    } catch (err) {
      console.error("Voice request failed:", err);
      onClose?.();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animationIdRef.current);
      audioContextRef.current?.close();
    }
  };

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current.start();

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = sendAudio;

      // Setup waveform
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const draw = () => {
        animationIdRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

        ctx.fillStyle = "#1f2937";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#10b981";
        ctx.beginPath();

        const sliceWidth = canvas.width / dataArrayRef.current.length;
        let x = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const v = dataArrayRef.current[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };
      draw();

      // Auto-stop after 6s
      setTimeout(() => stopRecording(), 6000);
    } catch (err) {
      console.error("Mic error:", err);
      onClose?.();
    }
  };

  useEffect(() => {
    startRecording();
    return () => stopRecording();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg flex flex-col items-center gap-4">
        <p>🎤 Listening...</p>
        <canvas ref={canvasRef} width={300} height={100} className="rounded border border-gray-300" />
        <button onClick={stopRecording} className="bg-red-600 text-white px-4 py-2 rounded">
          Stop
        </button>
      </div>
    </div>
  );
}
