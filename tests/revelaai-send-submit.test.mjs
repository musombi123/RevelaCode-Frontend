import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const composer = read("../src/components/InputBar.jsx");
const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const ads = read("../src/components/CommunityAdSenseUnit.jsx");

test("AI composer awaits acceptance, preserves rejected drafts, and does not erase a newer draft", () => {
  assert.match(composer, /const accepted = await onSend\?\.\(value, attachedFile, \{/);
  assert.match(composer, /if \(accepted === false\) return;/);
  assert.match(composer, /setSubmitting\(true\)/);
  assert.match(composer, /finally \{\s*setSubmitting\(false\);\s*\}/);
  assert.match(composer, /setText\(\(current\) => current === submittedDraft \? "" : current\)/);
  assert.match(composer, /setAttachedFile\(\(current\) => current === submittedFile \? null : current\)/);
  const submitStart = composer.indexOf("const submit = async () => {");
  const submitEnd = composer.indexOf("const slashMatches", submitStart);
  const submitHandler = composer.slice(submitStart, submitEnd);
  assert.ok(
    submitHandler.indexOf("if (accepted === false) return;") < submitHandler.indexOf("setText((current)"),
    "The composer must check acceptance before clearing the submitted draft.",
  );
});

test("AI send control is a semantic touch-safe form submit above mobile scroll layers", () => {
  assert.match(composer, /<form onSubmit=\{handleComposerSubmit\}/);
  assert.match(composer, /<button type="submit" data-demo="ai-send-message"/);
  assert.match(composer, /event\.preventDefault\(\);\s*if \(isGenerating\) \{\s*onStop\?\.\(\);/);
  assert.match(composer, /touch-manipulation/);
  const css = read("../src/index.css");
  assert.match(css, /\.revelaai-workspace \.composer-safe-bottom \{\s*position: relative;\s*z-index: 30;\s*pointer-events: auto;/);
  assert.match(css, /\.revelaai-workspace \[data-demo="ai-send-message"\] \{[\s\S]*?pointer-events: auto;[\s\S]*?touch-action: manipulation;/);
});

test("both RevelaAI composer entry points await sendMessage and preserve compliance and duplicate-send guards", () => {
  const sendHandlers = dashboard.match(/onSend=\{async \(\.\.\.args\) => \{/g) || [];
  assert.equal(sendHandlers.length, 2, "Welcome and conversation composers must both be wired.");
  assert.equal((dashboard.match(/if \(sendLockRef\.current\) return false;/g) || []).length, 2);
  assert.equal((dashboard.match(/command !== "\/humanize" && complianceStatus !== "accepted"/g) || []).length, 2);
  assert.equal((dashboard.match(/const accepted = await sendMessage\(\.\.\.args\);/g) || []).length, 2);
  assert.equal((dashboard.match(/return accepted;/g) || []).length, 2);
});

test("production AdMob placements require valid app and native-unit IDs and never fall back to test ads", () => {
  assert.match(ads, /ca-app-pub-/);
  assert.match(ads, /import\.meta\.env\.PROD && !hasProductionIds/);
  assert.match(ads, /isTesting: !import\.meta\.env\.PROD && !hasProductionIds/);
  assert.match(ads, /NativeAdFeed\.create/);
  assert.match(ads, /NativeAdPluginEvents\.Loaded/);
  assert.match(ads, /NativeAdPluginEvents\.FailedToLoad/);
});

test("web AdSense placements push only configured numeric slots and keep publisher attribution", () => {
  assert.match(ads, /window\.adsbygoogle = window\.adsbygoogle \|\| \[\]/);
  assert.match(ads, /data-ad-client=\{ADSENSE_CLIENT\}/);
  assert.match(ads, /data-ad-slot=\{adSlot\}/);
  assert.match(ads, /Google AdSense/);
});
