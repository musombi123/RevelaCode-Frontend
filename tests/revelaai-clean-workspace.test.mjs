import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const welcome = read("../src/components/WelcomeScreen.jsx");
const sidebar = read("../src/components/Sidebar.jsx");
const header = read("../src/components/RevelaAIHeaderControls.jsx");
const quickSettings = read("../src/components/RevelaAIQuickSettings.jsx");
const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const humanizer = read("../src/pages/HumanizerWorkspace.jsx");

test("welcome state is a clean empty state with no prompt templates or tool chips", () => {
  assert.doesNotMatch(welcome, /EXPLORERS|TOOLS|prompt:|tool-chip|onSuggestion/);
  assert.doesNotMatch(welcome, /<button\b/);
  assert.match(welcome, /What would you like to work on\?/);
});

test("voice, vision, Humanizer and weak-network mode are grouped in one sidebar Tools menu", () => {
  assert.match(sidebar, /aria-controls="revelaai-sidebar-tools"/);
  assert.match(sidebar, /toolsOpen &&/);
  assert.match(sidebar, /onOpenVoice/);
  assert.match(sidebar, /onOpenVision/);
  assert.match(sidebar, /onOpenHumanizer/);
  assert.match(sidebar, /Weak-network free mode/);
  assert.match(sidebar, /AI Identity and settings/);
  assert.doesNotMatch(sidebar, /Tools · Humanizer/);
});

test("search depth and quota are available in settings but not permanently displayed in the header", () => {
  assert.doesNotMatch(header, /modeButtons/);
  assert.match(header, /<RevelaAIQuickSettings/);
  assert.match(header, /\{quota\}/);
  assert.match(quickSettings, /Search mode/);
  for (const mode of ["quick", "deep", "extreme"]) assert.ok(quickSettings.includes(mode));
});

test("Humanizer uses one compact upload card and keeps privacy guidance without a second info panel", () => {
  assert.match(humanizer, /Open a PDF/);
  assert.match(humanizer, /Privacy: the PDF is processed in memory/);
  assert.doesNotMatch(humanizer, /Private by design/);
  assert.doesNotMatch(humanizer, /grid gap-5 lg:grid-cols-\[minmax\(0,1\.5fr\)/);
  assert.match(humanizer, /Produce with Gemini/);
  assert.match(humanizer, /Local suggestions/);
});

test("Humanizer has one title and remains embedded in the chat workspace", () => {
  assert.match(dashboard, /<HumanizerWorkspace embedded \/>/);
  assert.match(dashboard, /Back to chat/);
  assert.doesNotMatch(dashboard, /Work on selected PDF text without leaving RevelaAI/);
  assert.match(humanizer, /Selective Humanizer/);
});
