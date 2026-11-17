import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const composer = read("../src/components/InputBar.jsx");
const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const ads = read("../src/components/CommunityAdSenseUnit.jsx");

test("AI composer preserves a draft when the parent rejects a submission", () => {
  assert.match(composer, /const accepted = await onSend\?\.\(value, attachedFile, \{/);
  assert.match(composer, /if \(accepted === false\) return;/);
  assert.ok(
    composer.indexOf("if (accepted === false) return;") < composer.indexOf('setText("");'),
    "The composer must not clear the draft before checking acceptance.",
  );
});

test("both RevelaAI composer entry points enforce the use notice and duplicate-send lock", () => {
  const sendHandlers = dashboard.match(/onSend=\{\(\.\.\.args\) => \{/g) || [];
  assert.equal(sendHandlers.length, 2, "Welcome and conversation composers must both be wired.");
  assert.equal((dashboard.match(/if \(sendLockRef\.current\) return false;/g) || []).length, 2);
  assert.equal((dashboard.match(/command !== "\/humanize" && complianceStatus !== "accepted"/g) || []).length, 2);
  assert.equal((dashboard.match(/return true;/g) || []).length >= 2, true);
});

test("production AdMob placements require valid app and native-unit IDs and never fall back to test ads", () => {
  assert.match(ads, /ca-app-pub-/);
  assert.match(ads, /import\.meta\.env\.PROD && !hasProductionIds/);
  assert.match(ads, /isTesting: !import\.meta\.env\.PROD && !hasProductionIds/);
  assert.match(ads, /NativeAdFeed\.create/);
});
