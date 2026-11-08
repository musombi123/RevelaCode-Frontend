import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Humanizer is a standalone Home workspace with a natural-language inline chat handoff", () => {
  const dashboard = read("../src/components/AIAssistantDashboard.jsx");
  const sidebar = read("../src/components/Sidebar.jsx");
  const app = read("../src/App.jsx");
  const registry = read("../src/components/dashboardConfig.jsx");
  const humanizer = read("../src/pages/HumanizerWorkspace.jsx");

  assert.match(dashboard, /import HumanizerWorkspace from ["']@\\/pages\\/HumanizerWorkspace["']/);
  assert.match(dashboard, /const humanizerIntent =/);
  assert.match(dashboard, /if \\(humanizerIntent\\)/);
  assert.match(dashboard, /initialText=\\{humanizerSeedText\\}/);
  assert.match(dashboard, /onExportToChat=\\{/);
  assert.doesNotMatch(sidebar, /onOpenHumanizer|Selective Humanizer/);
  assert.match(app, /path="\\/humanizer" element=\\{<Navigate to="\\/app\\?hub=humanizer" replace \\/>\\}/);
  assert.match(registry, /key: "humanizer"/);
  assert.match(registry, /onNavigate\\?\\.\\("humanizer"\\)/);
  assert.match(humanizer, /if \\(!token\\) return \\{\\};/);
  assert.doesNotMatch(humanizer, /Please sign in to use the Humanizer/);
  assert.match(humanizer, /mapAcceptedRangeToOriginal/);
  assert.match(humanizer, /accepted_replacements/);
  assert.match(humanizer, /\\/api\\/humanizer\\/pdf\\/reconstruct/);
  assert.match(humanizer, /async function exportPdf/);
  assert.match(humanizer, /canExportPdf = Boolean\\(file && acceptedEdits\\.length && !manualTextEdited && !pdfExportUnsupported\\)/);
  assert.match(humanizer, /layoutSupported: Boolean\\(page\\.layout_supported\\)/);
  assert.match(humanizer, /loadPastedText/);
  assert.match(humanizer, /Paste or type the text you want to refine/);
  assert.match(humanizer, /Send revised text to AI chat/);
  assert.ok(humanizer.includes("xl:grid-cols-[220px_minmax(0,1fr)_minmax(19rem,0.82fr)]"));
});

test("Productivity tools open from the InputBar attachment menu in both chat states", () => {
  const dashboard = read("../src/components/AIAssistantDashboard.jsx");
  const input = read("../src/components/InputBar.jsx");
  const tools = read("../src/components/ProductivityToolsPanel.jsx");
  assert.equal((dashboard.match(/<InputBar/g) || []).length, 2);
  assert.match(input, /label="Attachments and tools"/);
  assert.match(input, /Upload a file or document/);
  assert.match(input, /AI tools/);
  assert.match(input, /setWorkspaceToolsOpen\\(true\\)/);
  assert.match(input, /<ProductivityToolsPanel/);
  assert.match(tools, /triggerless = false/);
  assert.doesNotMatch(dashboard, /<ProductivityToolsPanel/);
});
