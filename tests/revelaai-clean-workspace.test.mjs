import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const welcome = read("../src/components/WelcomeScreen.jsx");
const sidebar = read("../src/components/Sidebar.jsx");
const input = read("../src/components/InputBar.jsx");
const quickSettings = read("../src/components/RevelaAIQuickSettings.jsx");
const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const humanizer = read("../src/pages/HumanizerWorkspace.jsx");

test("welcome state is a clean empty state with no prompt templates or tool chips", () => {
  assert.doesNotMatch(welcome, /EXPLORERS|TOOLS|prompt:|tool-chip|onSuggestion/);
  assert.doesNotMatch(welcome, /<button\\b/);
  assert.match(welcome, /What would you like to work on\\?/);
});

test("voice, vision and weak-network mode remain in Tools while Humanizer is invoked from chat", () => {
  assert.match(sidebar, /aria-controls="revelaai-sidebar-tools"/);
  assert.match(sidebar, /toolsOpen &&/);
  assert.match(sidebar, /onOpenVoice/);
  assert.match(sidebar, /onOpenVision/);
  assert.doesNotMatch(sidebar, /onOpenHumanizer|Selective Humanizer/);
  assert.match(sidebar, /Weak-network free mode/);
  assert.match(sidebar, /AI Identity/);
  assert.match(sidebar, /<RevelaAIQuickSettings/);
  assert.match(sidebar, /aria-controls="revelaai-account-menu"/);
  assert.match(sidebar, /revelaai:settings-open/);
  assert.doesNotMatch(sidebar, /Tools · Humanizer/);
});

test("AI header controls are removed and appearance/search settings live in the sidebar account menu", () => {
  assert.doesNotMatch(dashboard, /RevelaAIHeaderControls/);
  assert.match(sidebar, /<RevelaAIQuickSettings/);
  assert.match(quickSettings, /Appearance/);
  assert.match(quickSettings, /Search mode/);
  for (const mode of ["quick", "deep", "extreme"]) assert.ok(quickSettings.includes(mode));
});

test("new-chat composer sits directly below the welcome message instead of a separate bottom dock", () => {
  const welcomeIndex = dashboard.indexOf('<WelcomeScreen />');
  const composer = dashboard.indexOf('data-demo="ai-chat-input"', welcomeIndex);
  const chatBranch = dashboard.indexOf('aria-label="Conversation workspace"');
  assert.ok(welcomeIndex >= 0 && composer > welcomeIndex && composer < chatBranch);
  assert.match(dashboard, /max-w-\\[700px\\]/);
  assert.doesNotMatch(dashboard, /<ProductivityToolsPanel/);
});

test("the compact InputBar exposes upload, vision and productivity actions from the paperclip menu", () => {
  assert.match(input, /label="Attachments and tools"/);
  assert.match(input, /Upload a file or document/);
  assert.ok(input.includes("Capture with camera / Vision"));
  assert.match(input, /Productivity tools and workspace/);
  assert.ok(input.includes("TOOL_COMMANDS.map"));
  assert.match(input, /h-10 w-10 min-h-10 min-w-10/);
  assert.doesNotMatch(input, /Grounded when evidence is available/);
  assert.doesNotMatch(input, /label="Open tools"/);
});

test("fullscreen and AI header heights are compact and redundant mode labels are removed", () => {
  const shell = read("../src/components/MainDashboardV2.jsx");
  assert.match(shell, /h-10 shrink-0 items-center justify-between/);
  assert.doesNotMatch(shell, /FULLSCREEN MODE/);
  assert.match(dashboard, /h-11 shrink-0 items-center justify-between/);
  assert.doesNotMatch(dashboard, /RevelaAIHeaderControls/);
});

test("composer no longer renders a nested rounded border box", () => {
  assert.match(input, /"relative bg-transparent"/);
  assert.doesNotMatch(input, /"relative rounded-2xl border bg-input"/);
  assert.match(input, /"flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-xl/);
  assert.match(input, /label="Attachments and tools"/);
  assert.match(input, /data-demo="ai-send-message"/);
});

test("Humanizer keeps PDF and text workflows with concise privacy guidance", () => {
  assert.match(humanizer, /Open a PDF/);
  assert.match(humanizer, /Privacy: PDFs are processed in memory/);
  assert.doesNotMatch(humanizer, /Private by design/);
  assert.match(humanizer, /Produce with Gemini/);
  assert.match(humanizer, /Local suggestions/);
  assert.match(humanizer, /Paste or type the text you want to refine/);
});

test("Humanizer is invoked in the chat only on request and returns approved text to the conversation", () => {
  assert.match(dashboard, /<HumanizerWorkspace[\\s\\S]*?embedded[\\s\\S]*?initialText=\\{humanizerSeedText\\}/);
  assert.match(dashboard, /onExportToChat=\\{/);
  assert.match(dashboard, /const humanizerIntent/);
  assert.match(dashboard, /Back to chat/);
  assert.match(humanizer, /Humanizer Studio/);
  assert.match(humanizer, /Send revised text to AI chat/);
});
