import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = async (path) =>
  readFile(new URL(path, import.meta.url), "utf8");

test("composer microphone launches the voice workspace rather than typing a transcript", async () => {
  const inputBar = await read("../src/components/InputBar.jsx");
  assert.match(inputBar, /onClick=\{\(\) => onMic\?\.\(\)\}/);
  assert.match(inputBar, /aria-label="Start voice conversation"/);
  assert.doesNotMatch(inputBar, /SpeechRecognition|startSpeechRecognition|Dictate with your voice/);
  assert.doesNotMatch(inputBar, /setText\(\s*transcript\s*\)/);
});

test("voice input uses native Capacitor recognition on mobile with a browser fallback", async () => {
  const voiceOrb = await read("../src/ai/v2-free/VoiceOrbFree.jsx");
  assert.match(voiceOrb, /@capgo\/capacitor-speech-recognition/);
  assert.match(voiceOrb, /Capacitor\.isNativePlatform\(\)/);
  assert.match(voiceOrb, /SpeechRecognition\.requestPermissions\(\)/);
  assert.match(voiceOrb, /SpeechRecognition\.start\(/);
  assert.match(voiceOrb, /window\.SpeechRecognition\s*\|\|\s*window\.webkitSpeechRecognition/);
});

test("assistant speech uses native device text-to-speech on mobile", async () => {
  const voiceChat = await read("../src/ai/RevelaAIVoiceChat.jsx");
  assert.match(voiceChat, /@capgo\/capacitor-speech-synthesis/);
  assert.match(voiceChat, /SpeechSynthesis\.speak\(/);
  assert.match(voiceChat, /window\.speechSynthesis\.speak\(/);
});

test("recognition resumes only after the assistant voice response completes", async () => {
  const voiceOrb = await read("../src/ai/v2-free/VoiceOrbFree.jsx");
  const voiceChat = await read("../src/ai/RevelaAIVoiceChat.jsx");
  assert.match(voiceOrb, /await onTranscriptRef\.current\?\.\(/);
  assert.match(voiceOrb, /if \(activeRef\.current\) scheduleRestart\(\)/);
  assert.match(voiceChat, /await speakResponse\(response,/);
});

test("assistant playback and manual replay pause recognition to prevent audio feedback", async () => {
  const voiceOrb = await read("../src/ai/v2-free/VoiceOrbFree.jsx");
  assert.match(voiceOrb, /const speakingRef = useRef\(Boolean\(speaking\)\)/);
  assert.match(voiceOrb, /if \(speaking\) \{/);
  assert.match(voiceOrb, /void SpeechRecognition\.stop\(\)\.catch/);
  assert.match(voiceOrb, /recognitionRef\.current\?\.stop\?\.\(\)/);
  assert.match(voiceOrb, /if \(wasSpeaking && activeRef\.current && !processingRef\.current\)/);
  assert.match(voiceOrb, /if \(!activeRef\.current \|\| processingRef\.current \|\| speakingRef\.current\) return/);
});
