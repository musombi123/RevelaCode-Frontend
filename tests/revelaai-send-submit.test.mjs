import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const input = read("../src/components/InputBar.jsx");
const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const ads = read("../src/components/CommunityAdSenseUnit.jsx");

test("the AI send control is connected to the real submit handler and enabled only for sendable content", () => {
  assert.ok(input.includes('data-demo="ai-send-message" onClick={isGenerating?onStop:submit}'));
  assert.ok(input.includes('disabled={isGenerating?!onStop:!canSend}'));
  assert.ok(input.includes('const canSend = !disabled && !submitting && (text.trim().length > 0 || Boolean(attachedFile));'));
  assert.ok(input.includes('const accepted = await onSend?.(value, attachedFile, {'));
});

test("AI composer keeps the draft when the dashboard rejects a submission", () => {
  const rejected = input.indexOf("if (accepted === false) return;");
  const clear = input.indexOf('setText("");', rejected);
  assert.notEqual(rejected, -1);
  assert.ok(clear > rejected, "The draft must only clear after the parent accepts the send.");
});

test("both AI composers await sendMessage and return its acceptance result", () => {
  assert.equal(dashboard.split("onSend={async (...args) => {").length - 1, 2);
  assert.equal((dashboard.match(/const accepted = await sendMessage\(\.\.\.args\);/g) || []).length, 2);
  assert.equal((dashboard.match(/return accepted;/g) || []).length >= 2, true);
});

test("the AI send pipeline enforces compliance and prevents concurrent sends", () => {
  assert.ok(dashboard.includes('selectedToolCommand !== "/humanize" && complianceStatus !== "accepted"'));
  assert.ok(dashboard.includes("if (sendLockRef.current)"));
  assert.ok(dashboard.includes("sendLockRef.current = true;"));
  assert.ok(dashboard.includes("sendLockRef.current = false;"));
});

test("production AdMob requires valid app and unit IDs and never falls back to test ads", () => {
  assert.ok(ads.includes('/^ca-app-pub-\\d+~\\d+$/.test(ADMOB_APP_ID)'));
  assert.ok(ads.includes('/^ca-app-pub-\\d+\\/\\d+$/.test(config.admobUnitId)'));
  assert.ok(ads.includes("import.meta.env.PROD && !hasProductionIds"));
  assert.ok(ads.includes("isTesting: !import.meta.env.PROD && !hasProductionIds"));
  assert.ok(ads.includes("NativeAdFeed.create"));
});
