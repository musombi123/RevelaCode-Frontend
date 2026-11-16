import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const card = read("../src/components/ArtifactResultCard.jsx");
const actions = read("../src/components/MessageActions.jsx");
const message = read("../src/components/Message.jsx");
const chatWindow = read("../src/components/ChatWindow.jsx");
const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const save = read("../src/components/utils/saveGeneratedFile.js");

test("assistant messages include a read-aloud control with stop and browser support checks", () => {
  assert.match(actions, /Read response aloud/);
  assert.match(actions, /Stop reading response/);
  assert.match(actions, /speechSynthesis\.speak/);
  assert.match(actions, /speechSynthesis\.cancel/);
  assert.match(actions, /Volume2/);
  assert.match(chatWindow, /<MessageActions/);
});

test("chat renders every first-class artifact as a result card", () => {
  assert.match(message, /import ArtifactResultCard/);
  assert.match(message, /message\.artifacts\.length/);
  assert.match(message, /onAction=\{onArtifactAction\}/);
  assert.match(chatWindow, /onArtifactAction/);
  assert.match(dashboard, /artifact: artifactView\.artifact/);
});

test("artifact cards expose preview, refreshed downloads, Canva and share", () => {
  assert.match(card, /artifact\.preview_url/);
  assert.match(card, /refresh_export/);
  assert.match(card, /Download/);
  assert.match(card, /Open in Canva|connect_canva/);
  assert.match(card, /Share2/);
  assert.match(card, /format_downloads/);
  assert.match(save, /export async function downloadRemoteArtifact/);
  assert.match(save, /export function resolveRevelaAIArtifactUrl/);
});

test("Canva OAuth and editing state are connected to the protected backend routes", () => {
  assert.match(dashboard, /\/api\/artifacts\/canva\/status/);
  assert.match(dashboard, /\/api\/artifacts\/canva\/connect/);
  assert.match(dashboard, /\/canva/);
  assert.match(dashboard, /user_opened/);
  assert.match(dashboard, /return_from_editor/);
  assert.match(dashboard, /review_changes/);
  assert.match(card, /Need help\?/);
  assert.match(card, /I’m back in chat/);
});

test("AI changes are proposed one at a time and require explicit confirmation", () => {
  assert.match(card, /propose_edit/);
  assert.match(card, /Before/);
  assert.match(card, /After/);
  assert.match(card, /Apply this change/);
  assert.match(card, /Cancel/);
  assert.match(card, /Guide me/);
  assert.match(card, /Do it for me/);
  assert.match(dashboard, /expected_version/);
  assert.match(dashboard, /proposal_id/);
});

test("artifact history exposes undo and redo without replacing previous files", () => {
  assert.match(card, /undo_version/);
  assert.match(card, /redo_version/);
  assert.match(card, /artifact\.can_undo/);
  assert.match(card, /artifact\.can_redo/);
});
