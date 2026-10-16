import { useCallback, useEffect, useRef, useState } from "react";

/**
 * On-device live expression cues. Camera frames are processed locally and never
 * uploaded or persisted. This estimates visible cues; it cannot infer a person's
 * actual feelings or diagnose mood.
 */
export default function useLiveVision() {
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const timerRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState("off");
  const [context, setContext] = useState("");
  const [notice, setNotice] = useState("");

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    modelRef.current = null;
    setEnabled(false);
    setStatus("off");
    setContext("");
    setNotice("");
  }, []);

  const start = useCallback(async () => {
    if (enabled) { stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice("Live camera is unavailable in this browser. Try HTTPS or use photo upload.");
      setStatus("unavailable");
      return;
    }
    const approved = window.confirm(
      "Enable Live Vision? RevelaAI can estimate visible facial cues to respond naturally. The camera stays on this device; frames are not recorded or uploaded. Allow?"
    );
    if (!approved) { setStatus("off"); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) {
        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        Object.assign(video.style, { position: "fixed", width: "1px", height: "1px", opacity: "0", pointerEvents: "none", left: "-10px", top: "-10px" });
        document.body.appendChild(video);
        videoRef.current = video;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      canvasRef.current = canvas;
      setEnabled(true);
      setStatus("loading");
      setNotice("");

      // The model is downloaded once and performs inference in the browser.
      const tf = await import("@tensorflow/tfjs-core");
      await import("@tensorflow/tfjs-backend-webgl");
      const faceLandmarks = await import("@tensorflow-models/face-landmarks-detection");
      await tf.setBackend("webgl");
      await tf.ready();
      const model = await faceLandmarks.createDetector(
        faceLandmarks.SupportedModels.MediaPipeFaceMesh,
        { runtime: "tfjs", refineLandmarks: true, maxFaces: 1 }
      );
      modelRef.current = model;
      setStatus("live");
      console.log("Live Vision: On-Device Frown Detection - Permission + Green Dot - No Full Screen");

      const analyze = async () => {
        if (!streamRef.current || !videoRef.current || videoRef.current.readyState < 2 || !modelRef.current) return;
        const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        try {
          const faces = await modelRef.current.estimateFaces(canvasRef.current, { flipHorizontal: true });
          if (!faces?.length) { setContext(""); return; }
          const points = faces[0].keypoints || [];
          const point = (name) => points.find((p) => p.name === name);
          const leftBrow = point("left眉") || point("leftEyebrow");
          const rightBrow = point("right眉") || point("rightEyebrow");
          const leftEye = point("leftEye");
          const rightEye = point("rightEye");
          const leftMouth = point("mouthLeft");
          const rightMouth = point("mouthRight");
          const cues = [];
          // Landmark names vary by model version. Only report cues when matching
          // landmarks are actually present; avoid fabricating expression labels.
          if (leftBrow && leftEye && rightBrow && rightEye) {
            const browGap = ((leftEye.y - leftBrow.y) + (rightEye.y - rightBrow.y)) / 2;
            if (browGap < 8) cues.push("eyebrows appear lowered");
            else if (browGap > 18) cues.push("eyebrows appear raised");
          }
          if (leftMouth && rightMouth) {
            const delta = leftMouth.y - rightMouth.y;
            if (Math.abs(delta) > 5) cues.push("mouth corners appear uneven");
          }
          const pixels = ctx.getImageData(0, 0, 320, 240).data;
          let sum = 0;
          for (let i = 0; i < pixels.length; i += 16) sum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
          const brightness = sum / (pixels.length / 16);
          cues.push(brightness < 55 ? "lighting is dim" : brightness > 205 ? "lighting is bright" : "lighting is moderate");
          setContext("Live Vision cues (on-device, uncertain): " + (cues.length ? cues.join("; ") : "face visible; no clear expression cue") + ". These are visual estimates, not certainty about the user's feelings.");
        } catch (error) {
          console.warn("Live Vision frame analysis failed; camera remains optional.", error);
          setNotice("Expression analysis paused. Camera remains on until you turn it off.");
        }
      };
      await analyze();
      timerRef.current = window.setInterval(analyze, 1500);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setEnabled(false);
      setStatus("error");
      setNotice(error?.name === "NotAllowedError"
        ? "Camera permission was denied. You can still use photo upload."
        : "Live Vision could not start on this device. Photo upload remains available.");
      console.warn("Live Vision unavailable:", error);
    }
  }, [enabled, stop]);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (videoRef.current?.parentNode) videoRef.current.parentNode.removeChild(videoRef.current);
  }, []);

  return { enabled, status, context, notice, toggle: start, stop };
}
