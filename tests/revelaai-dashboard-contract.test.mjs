import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const sidebar = read("../src/components/Sidebar.jsx");
const composer = read("../src/components/InputBar.jsx");
const voice = read("../src/ai/RevelaAIVoiceChat.jsx");

test("AI sidebar exposes user actions and a persistent weak-network mode toggle", () => {
  for (const label of [
    "AI Identity",
    "Voice",
    "Vision",
    "Plans",
    "Weak-network free mode",
  ]) {
    assert.ok(sidebar.includes(label), `Missing sidebar action: ${label}`);
  }
  assert.match(sidebar, /onToggleFreeMode/);
  assert.match(sidebar, /onDeleteChat/);
  assert.match(sidebar, /onRenameChat/);
  assert.match(dashboard, /revelaai\.free_mode\.v1/);
});

test("user-facing dashboard has no Guardian/core-tool dock", () => {
  assert.doesNotMatch(dashboard, /RevelaAIGuardianDock/);
  assert.doesNotMatch(dashboard, /Guardian tool dock/);
  for (const prop of [
    "onOpenIdentity",
    "onOpenVoice",
    "onOpenVision",
    "onOpenPlans",
    "onToggleFreeMode",
  ]) {
    assert.ok(dashboard.includes(prop), `Dashboard does not wire ${prop}`);
  }
});

test("plans opens the existing authoritative trial/subscription/checkout component", () => {
  assert.match(dashboard, /id="revela-ai-revenue-panel"/);
  assert.match(dashboard, /aria-controls="revela-ai-revenue-panel"/);
  assert.match(dashboard, /<HubRevenueOffers hub="smart_ai" compact \/>/);
});

test("the identity panel describes local mode and distinguishes its limitations", () => {
  assert.match(dashboard, /Meet RevelaAI/);
  assert.match(dashboard, /not a complete local language model|not a full local language model/i);
  assert.match(dashboard, /pixel statistics cannot prove object identity|pixel measurements cannot prove object identity/i);
});

test("Free mode uses local text and never takes the hosted text branch", () => {
  assert.match(dashboard, /answerLocally\(cleaned \|\| requestMessage/);
  assert.match(dashboard, /revelaai-free-local-rules/);
  assert.match(dashboard, /!freeMode/);
  assert.match(dashboard, /localFallbackNotice/);
});

test("Live Vision can run on-device in Free mode and reports pixel-analysis limits", () => {
  assert.match(composer, /if \(freeMode\)/);
  assert.match(composer, /analyzePixels\(context\.getImageData/);
  assert.match(composer, /visionProvider: freeMode \? "local-pixel-math"/);
  assert.match(composer, /does not identify objects, read text/);
});

test("voice respects Free mode and microphone errors are visible", () => {
  assert.match(voice, /if \(!freeMode && isAuthenticated/);
  assert.match(voice, /Free voice mode uses this device's speech recognition/);
  assert.match(composer, /setVoiceError/);
  assert.match(composer, /role="status"/);
});
