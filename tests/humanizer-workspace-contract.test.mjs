import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Humanizer opens inline inside the existing AI workspace", () => {
  const dashboard = read("../src/components/AIAssistantDashboard.jsx");
  const sidebar = read("../src/components/Sidebar.jsx");
  const app = read("../src/App.jsx");
  const humanizer = read("../src/pages/HumanizerWorkspace.jsx");

  assert.match(dashboard, /import HumanizerWorkspace from ["']@\/pages\/HumanizerWorkspace["']/);
  assert.match(dashboard, /setHumanizerOpen\(true\)/);
  assert.match(dashboard, /<HumanizerWorkspace embedded \/>/);
  assert.match(dashboard, /onOpenHumanizer=\{\(\) => setHumanizerOpen\(true\)\}/);
  assert.match(sidebar, /onOpenHumanizer/);
  assert.doesNotMatch(sidebar, /navigate\(["']\/humanizer["']\)/);
  assert.match(app, /path="\/humanizer" element=\{<Navigate to="\/app\?hub=ai&tool=humanizer" replace \/>\}/);
  assert.match(humanizer, /if \(!token\) return \{\};/);
  assert.doesNotMatch(humanizer, /Please sign in to use the Humanizer/);
  assert.match(humanizer, /mapAcceptedRangeToOriginal/);
  assert.match(humanizer, /accepted_replacements/);
  assert.match(humanizer, /\/api\/humanizer\/pdf\/reconstruct/);
  assert.match(humanizer, /async function exportPdf/);
  assert.match(humanizer, /canExportPdf = Boolean\(file && acceptedEdits\.length && !manualTextEdited && !pdfExportUnsupported\)/);
  assert.match(humanizer, /layoutSupported: Boolean\(page\.layout_supported\)/);
  assert.match(humanizer, /Download revised text \(\.txt\)/);
});

test("Productivity tools open from the InputBar attachment menu in both chat states", () => {
  const dashboard = read("../src/components/AIAssistantDashboard.jsx");
  const input = read("../src/components/InputBar.jsx");
  const tools = read("../src/components/ProductivityToolsPanel.jsx");
  assert.equal((dashboard.match(/<InputBar/g) || []).length, 2);
  assert.match(input, /label="Attachments and tools"/);
  assert.match(input, /Upload a file or document/);
  assert.match(input, /AI tools/);
  assert.match(input, /setWorkspaceToolsOpen\(true\)/);
  assert.match(input, /<ProductivityToolsPanel/);
  assert.match(tools, /triggerless = false/);
  assert.doesNotMatch(dashboard, /<ProductivityToolsPanel/);
});
