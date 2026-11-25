import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const sidebar = read("../src/components/Sidebar.jsx");
const composer = read("../src/components/InputBar.jsx");
const voice = read("../src/ai/RevelaAIVoiceChat.jsx");
const voiceOrb = read("../src/ai/v2-free/VoiceOrbFree.jsx");
const premiumStar = read("../src/premium/PremiumPlansStar.jsx");
const message = read("../src/components/Message.jsx");
const appShell = read("../src/components/MainDashboardV2.jsx");
const offlineStatus = read("../src/components/OfflineSyncStatus.jsx");

test("AI sidebar exposes user actions and a persistent weak-network mode toggle", () => {
  for (const label of [
    "AI Identity",
    "Voice",
    "Vision",
    "Weak-network free mode",
  ]) {
    assert.ok(sidebar.includes(label), `Missing sidebar action: ${label}`);
  }
  assert.doesNotMatch(sidebar, /Plans|onOpenPlans/);
  assert.match(sidebar, /onToggleFreeMode/);
  assert.match(sidebar, /aria-controls="revelaai-sidebar-tools"/);
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
    "onToggleFreeMode",
  ]) {
    assert.ok(dashboard.includes(prop), `Dashboard does not wire ${prop}`);
  }
});

test("assistant chat hides internal USECT/Core Mesh status and strips it from response metadata", () => {
  assert.doesNotMatch(message, /USECT Core Mesh|Advisory route|Route selection is advisory only|Core Mesh routing status|Execution details/);
  assert.doesNotMatch(message, /USECT-ZERO|Genesis · Core-One|Infinite Mind · Core-Two/);
  for (const key of ["core_mesh", "coreMesh", "usect_zero_tool", "usectZeroTool"]) {
    assert.match(dashboard, new RegExp("delete responseMeta\\." + key));
  }
  assert.doesNotMatch(dashboard, /usect_zero_tool:\s*payload\?\.meta/);
});

test("Premium plans are opened by the global star event, not a RevelaAI dashboard section", () => {
  assert.match(premiumStar, /data-premium-plans-star="true"/);
  assert.match(premiumStar, /revelacode:premium-open/);
  assert.match(appShell, /addEventListener\("revelacode:premium-open"/);
  assert.match(appShell, /<PlansModal/);
  assert.doesNotMatch(dashboard, /revela-ai-revenue-panel|HubRevenueOffers|aiRevenueOpen/);
  assert.doesNotMatch(sidebar, /Plans|onOpenPlans/);
});

test("fullscreen AI close button stays above the Workspace saved status pill", () => {
  assert.match(appShell, /function FullscreenAIAssistant/);
  assert.match(appShell, /z-\[10050\]/);
  assert.match(appShell, /aria-label="Close AI"/);
  assert.match(appShell, /onClick=\{onClose\}/);
  assert.match(offlineStatus, /z-\[10000\]/);
  assert.ok(
    appShell.indexOf("z-[10050]") >= 0 &&
      offlineStatus.indexOf("z-[10000]") >= 0,
    "Fullscreen AI must render above the global Workspace saved status pill.",
  );
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
  assert.match(voiceOrb, /setError/);
  assert.match(voiceOrb, /role="alert"/);
  assert.match(voiceOrb, /role="status"/);
  assert.match(composer, /onClick=\{\(\) => onMic\?\.\(\)\}/);
});


test("AI composer awaits send acceptance and preserves rejected drafts", () => {
  assert.match(composer, /const submit = async \(\) =>/);
  assert.match(composer, /const accepted = await onSend\?\.\(/);
  assert.match(composer, /if \(accepted === false\) return;/);
  assert.match(composer, /finally \{\s*setSubmitting\(false\);\s*\}/);
  assert.match(dashboard, /setComplianceError\("Read and acknowledge the current RevelaAI use notice before sending a chat message\."\);\s*return false;/);
  assert.equal((dashboard.match(/onSend=\{async \(\.\.\.args\) => \{/g) || []).length, 2);
  assert.equal((dashboard.match(/const accepted = await sendMessage\(\.\.\.args\);/g) || []).length, 2);
  assert.equal((dashboard.match(/return accepted;/g) || []).length, 2);
});


test("AI compliance notice loading has a recovery action when the notice API is unavailable", () => {
  assert.match(dashboard, /complianceRetryKey/);
  assert.match(dashboard, /complianceStatus === "error" && \([\s\S]*?Retry loading notices/);
  assert.match(dashboard, /setComplianceRetryKey\(\(current\) => current \+ 1\)/);
});


test("Bible dashboard retains labels for all supported return destinations", () => {
  const bibleDashboard = read("../src/components/BibleDashboard.jsx");
  const labelsBlock = bibleDashboard.match(
    /const dashboardLabels = Object\.freeze\(\{([\s\S]*?)\}\);/,
  );
  assert.ok(labelsBlock, "Bible dashboard must define dashboardLabels before using the back-navigation label.");
  for (const [key, label] of Object.entries({
    home: "Home",
    faith: "Faith",
    education: "Education",
    shamba: "Shamba",
    biashara: "Biashara",
    community: "Community",
    events: "Events",
    prophecy: "Prophecy",
    referential: "Referential",
    profile: "Profile",
    settings: "Settings",
  })) {
    assert.match(
      labelsBlock[1],
      new RegExp("\\b" + key + ":\\s*\\"" + label + "\\""),
      "Missing Bible return-navigation label: " + key,
    );
  }
  assert.match(bibleDashboard, /dashboardLabels\[previousDashboard\]/);
  assert.match(bibleDashboard, /\.replace\(\/[ -_]\/g, " "\)/);
});
