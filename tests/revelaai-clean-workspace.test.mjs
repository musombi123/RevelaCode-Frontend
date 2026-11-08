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
  assert.ok(!welcome.includes("<button"));
  assert.ok(!welcome.includes("<button"));
  assert.ok(welcome.includes("What would you like to work on?"));
});

test("voice, vision and weak-network mode remain in Tools while Humanizer is invoked from chat", () => {
  assert.ok(sidebar.includes('aria-controls="revelaai-sidebar-tools"'));
  assert.ok(sidebar.includes("toolsOpen &&"));
  assert.ok(sidebar.includes("onOpenVoice"));
  assert.ok(sidebar.includes("onOpenVision"));
  assert.ok(!sidebar.includes("onOpenHumanizer"));
  assert.ok(!sidebar.includes("Selective Humanizer"));
  assert.ok(sidebar.includes("Weak-network free mode"));
  assert.ok(sidebar.includes("AI Identity"));
  assert.ok(sidebar.includes("<RevelaAIQuickSettings"));
  assert.ok(sidebar.includes('aria-controls="revelaai-account-menu"'));
  assert.ok(sidebar.includes("revelaai:settings-open"));
});

test("AI header controls are removed and appearance/search settings live in the sidebar account menu", () => {
  assert.ok(!dashboard.includes("RevelaAIHeaderControls"));
  assert.ok(sidebar.includes("<RevelaAIQuickSettings"));
  assert.ok(quickSettings.includes("Appearance"));
  assert.ok(quickSettings.includes("Search mode"));
  for (const mode of ["quick", "deep", "extreme"]) assert.ok(quickSettings.includes(mode));
});

test("new-chat composer sits directly below the welcome message instead of a separate bottom dock", () => {
  const welcomeIndex = dashboard.indexOf("<WelcomeScreen />");
  const composer = dashboard.indexOf('data-demo="ai-chat-input"', welcomeIndex);
  const chatBranch = dashboard.indexOf('aria-label="Conversation workspace"');
  assert.ok(welcomeIndex >= 0 && composer > welcomeIndex && composer < chatBranch);
  assert.ok(dashboard.includes("max-w-[700px]"));
  assert.ok(!dashboard.includes("<ProductivityToolsPanel"));
});

test("the compact InputBar exposes upload, vision and local selectable AI tools from the paperclip menu", () => {
  assert.ok(input.includes('label="Attachments and tools"'));
  assert.ok(input.includes("Upload a file or document"));
  assert.ok(input.includes("Capture with camera / Vision"));
  assert.ok(input.includes("AI tools"));
  assert.ok(input.includes("TOOL_COMMANDS.map"));
  assert.ok(input.includes("selectedToolCommand"));
  assert.ok(input.includes("setSelectedToolCommand(selected)"));
  assert.ok(input.includes("onSend?.(value, attachedFile, { toolCommand:"));
  assert.ok(!input.includes("setWorkspaceToolsOpen"));
  assert.ok(!input.includes("Productivity tools and workspace"));
  assert.ok(!input.includes("<ProductivityToolsPanel"));
  assert.ok(input.includes("h-10 w-10 min-h-10 min-w-10"));
  assert.ok(!input.includes("Grounded when evidence is available"));
  assert.ok(!input.includes('label="Open tools"'));
});

test("fullscreen and AI header heights are compact and redundant mode labels are removed", () => {
  const shell = read("../src/components/MainDashboardV2.jsx");
  assert.ok(shell.includes("h-10 shrink-0 items-center justify-between"));
  assert.ok(!shell.includes("FULLSCREEN MODE"));
  assert.ok(dashboard.includes("h-11 shrink-0 items-center justify-between"));
  assert.ok(!dashboard.includes("RevelaAIHeaderControls"));
});

test("composer no longer renders a nested rounded border box", () => {
  assert.ok(input.includes('"relative bg-transparent"'));
  assert.ok(!input.includes('"relative rounded-2xl border bg-input"'));
  assert.ok(input.includes('"flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-xl'));
  assert.ok(input.includes('label="Attachments and tools"'));
  assert.ok(input.includes('data-demo="ai-send-message"'));
});

test("Humanizer keeps PDF and text workflows with concise privacy guidance", () => {
  assert.ok(humanizer.includes("Open a PDF"));
  assert.ok(humanizer.includes("Privacy: PDFs are processed in memory"));
  assert.ok(!humanizer.includes("Private by design"));
  assert.ok(humanizer.includes("Produce with Gemini"));
  assert.ok(humanizer.includes("Local suggestions"));
  assert.ok(humanizer.includes("Paste or type the text you want to refine"));
});

test("Humanizer is invoked in chat only on request and returns approved text to the conversation", () => {
  assert.ok(dashboard.includes("<HumanizerWorkspace"));
  assert.ok(dashboard.includes("embedded"));
  assert.ok(dashboard.includes("initialText={humanizerSeedText}"));
  assert.ok(dashboard.includes("onExportToChat={"));
  assert.ok(dashboard.includes("const humanizerIntent"));
  assert.ok(dashboard.includes("Back to chat"));
  assert.ok(humanizer.includes("Humanizer Studio"));
  assert.ok(humanizer.includes("Send revised text to AI chat"));
});
