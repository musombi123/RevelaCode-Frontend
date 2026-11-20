import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const client = read("../src/ai/revelaAIClient.js");
const studio = read("../src/components/RevelaAIStudio.jsx");
const library = read("../src/components/RevelaAIFilesLibrary.jsx");
const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const panel = read("../src/components/RevelaAIWorkspacePanel.jsx");
const card = read("../src/components/ArtifactResultCard.jsx");

test("Files Library uses authenticated artifact list, upload, rename, restore and trash APIs", () => {
  assert.match(client, /export async function listRevelaAIArtifacts/);
  assert.match(client, /export async function uploadRevelaAIArtifact/);
  assert.match(client, /export async function updateRevelaAIArtifactMetadata/);
  assert.match(client, /export async function trashRevelaAIArtifact/);
  assert.match(library, /uploadRevelaAIArtifact/);
  assert.match(library, /Move to Trash/);
  assert.match(library, /Restore/);
  assert.match(library, /Private to your account/);
  assert.match(library, /Filter folder/);
  assert.match(library, /editingFolder/);
});

test("Studio saves versioned source with expected-version conflict protection", () => {
  assert.match(client, /expected_version: Number\(expectedVersion\)/);
  assert.match(client, /\/content/);
  assert.match(studio, /saveRevelaAIArtifactSource/);
  assert.match(studio, /Save/);
  assert.match(studio, /Autosaved as version/);
  assert.match(studio, /2200/);
  assert.match(studio, /Unsaved changes/);
  assert.match(studio, /Version history/);
});

test("Studio has native editors for documents, workbooks, presentations and code", () => {
  assert.match(studio, /function DocumentEditor/);
  assert.match(studio, /function SpreadsheetEditor/);
  assert.match(studio, /function PresentationEditor/);
  assert.match(studio, /function ImageEditor/);
  assert.match(studio, /CodeMirror/);
  assert.match(studio, /addSection/);
  assert.match(studio, /addRow/);
  assert.match(studio, /addSlide/);
});

test("Exports are explicit user actions and use the authenticated export API", () => {
  assert.match(client, /export async function exportRevelaAIArtifact/);
  assert.match(client, /\/exports/);
  assert.match(studio, /onClick=\{\(\) => setExportOpen/);
  assert.match(studio, /onClick=\{\(\) => void exportFormat\(format\)\}/);
  assert.match(studio, /disabled=\{!supportedExports.length \|\| Boolean\(busy\) \|\| dirty\}/);
});

test("Chat attachments and the quick inspector can open the same artifact in Studio", () => {
  assert.match(card, /runAction\("preview"\)/);
  assert.match(card, /runAction\("open_studio"\)/);
  assert.match(panel, /onOpenStudio/);
  assert.match(dashboard, /<RevelaAIStudio/);
  assert.match(dashboard, /<RevelaAIFilesLibrary/);
  assert.match(dashboard, /handleArtifactAction\("open_studio"/);
});

test("Imported file compatibility and non-execution boundaries are visible", () => {
  assert.match(studio, /Import compatibility/);
  assert.match(studio, /embedded media/);
  assert.match(studio, /Text-only · Not executed/);
  assert.match(client, /15 MB/);
});
