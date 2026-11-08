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

  assert.ok(dashboard.includes('import HumanizerWorkspace from "@/pages/HumanizerWorkspace"'));
  assert.ok(dashboard.includes("const humanizerIntent ="));
  assert.ok(dashboard.includes("if (humanizerIntent)"));
  assert.ok(dashboard.includes("initialText={humanizerSeedText}"));
  assert.ok(dashboard.includes("onExportToChat={"));
  assert.ok(!sidebar.includes("onOpenHumanizer"));
  assert.ok(!sidebar.includes("Selective Humanizer"));
  assert.ok(app.includes('path="/humanizer" element={<Navigate to="/app?hub=humanizer" replace />}'));
  assert.ok(registry.includes('key: "humanizer"'));
  assert.ok(registry.includes('onNavigate?.("humanizer")'));
  assert.ok(humanizer.includes("const authFetch = auth?.authFetch;"));
  assert.ok(humanizer.includes("function requireAuthenticatedFetch()"));
  assert.ok(humanizer.includes("return authFetch;"));
  assert.ok(!humanizer.includes("Please sign in to use the Humanizer"));
  assert.ok(humanizer.includes("mapAcceptedRangeToOriginal"));
  assert.ok(humanizer.includes("accepted_replacements"));
  assert.ok(humanizer.includes("/api/humanizer/pdf/reconstruct"));
  assert.ok(humanizer.includes("async function exportPdf"));
  assert.ok(humanizer.includes("canExportPdf = Boolean(file && acceptedEdits.length && !manualTextEdited && !pdfExportUnsupported)"));
  assert.ok(humanizer.includes("layoutSupported: Boolean(page.layout_supported)"));
  assert.ok(humanizer.includes("loadPastedText"));
  assert.ok(humanizer.includes("Paste or type the text you want to refine"));
  assert.ok(humanizer.includes("Send revised text to AI chat"));
  assert.ok(humanizer.includes("xl:grid-cols-[220px_minmax(0,1fr)_minmax(19rem,0.82fr)]"));
});

test("Composer tool selection is local and executes only with the submitted chat message", () => {
  const dashboard = read("../src/components/AIAssistantDashboard.jsx");
  const input = read("../src/components/InputBar.jsx");
  const tools = read("../src/components/ProductivityToolsPanel.jsx");
  assert.equal((dashboard.match(/<InputBar/g) || []).length, 2);
  assert.ok(input.includes('label="Attachments and tools"'));
  assert.ok(input.includes("Upload a file or document"));
  assert.ok(input.includes("AI tools"));
  assert.ok(input.includes("selectedToolCommand"));
  assert.ok(input.includes("setSelectedToolCommand(selected)"));
  assert.ok(input.includes("onSend?.(value, attachedFile, { toolCommand:"));
  assert.ok(dashboard.includes('if (selectedToolCommand === "/humanize" && !attachedFile)'));
  assert.ok(dashboard.includes("setHumanizerSeedText(cleaned);"));
  assert.ok(!input.includes("setWorkspaceToolsOpen"));
  assert.ok(!input.includes("<ProductivityToolsPanel"));
  assert.ok(tools.includes("/api/productivity/catalog"));
  assert.ok(tools.includes("/api/productivity/research"));
  assert.ok(!dashboard.includes("<ProductivityToolsPanel"));
});
