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

test("the unified composer exposes inline attachments, searchable grouped tools and local selection", () => {
  assert.ok(input.includes('aria-label="Attachments and AI tools"'));
  assert.ok(input.includes("Upload file"));
  assert.ok(input.includes("Camera / Vision"));
  assert.ok(input.includes('title:"Create"'));
  assert.ok(input.includes('title:"Analyze"'));
  assert.ok(input.includes('title:"Science"'));
  assert.ok(input.includes('title:"Writing"'));
  assert.ok(input.includes("Search AI tools"));
  assert.ok(input.includes("selectedToolCommand"));
  assert.ok(input.includes("setSelectedToolCommand(selected)"));
  assert.ok(input.includes("onSend?.(value, attachedFile, {"));
  assert.ok(input.includes("toolCommand: command ?"));
  assert.ok(input.includes("aria-expanded={attachmentMenuOpen}"));
  assert.ok(input.includes("safe-area-inset-bottom"));
  assert.ok(!input.includes("setWorkspaceToolsOpen"));
  assert.ok(!input.includes("Productivity tools and workspace"));
  assert.ok(!input.includes("<ProductivityToolsPanel"));
  assert.ok(input.includes("bg-gradient-to-br from-emerald-400 to-emerald-600"));
  assert.ok(input.includes("data-demo=\"ai-send-message\""));
});
test("mode-aware tools adapt the composer in place and preserve the draft", () => {
  assert.ok(input.includes("export const TOOL_MODES"));
  assert.ok(input.includes('"/image": { kind: "image-studio"'));
  assert.ok(input.includes('"/search": { kind: "deep-search"'));
  assert.ok(input.includes("setSelectedToolCommand(selected)"));
  assert.ok(!input.includes('setText((current) => current.replace(/^\\/[a-z]+\\s*/i, ""))'));
  assert.ok(input.includes("Describe the image you want"));
  assert.ok(input.includes("What should I research?"));
  assert.ok(input.includes('aria-label="Image mode"'));
  assert.ok(input.includes('aria-label="Aspect ratio"'));
  assert.ok(input.includes('aria-label="Image style"'));
  assert.ok(input.includes('aria-label="Research depth"'));
  assert.ok(input.includes('aria-label="Research time range"'));
  assert.ok(input.includes("overflow-x-auto whitespace-nowrap"));
  assert.ok(input.includes("toolOptions:"));
  assert.ok(dashboard.includes("Image Studio request. Mode:"));
  assert.ok(dashboard.includes("Deep Search request. Depth and source preferences:"));
});

test("fullscreen and AI header heights are compact and redundant mode labels are removed", () => {
  const shell = read("../src/components/MainDashboardV2.jsx");
  assert.ok(shell.includes("h-10 shrink-0 items-center justify-between"));
  assert.ok(!shell.includes("FULLSCREEN MODE"));
  assert.ok(dashboard.includes("h-11 shrink-0 items-center justify-between"));
  assert.ok(!dashboard.includes("RevelaAIHeaderControls"));
});

test("composer uses one rounded glass surface with accessible responsive controls", () => {
  assert.ok(input.includes("rounded-3xl border border-line/90 bg-surface/90"));
  assert.ok(input.includes("focus-within:border-emerald-500/45"));
  assert.ok(input.includes("sm:bottom-[calc(100%+12px)]"));
  assert.ok(input.includes("fixed inset-x-0 bottom-0"));
  assert.ok(input.includes("h-11 w-11"));
  assert.ok(input.includes('aria-label={isGenerating?"Stop generating":activeModeDefinition?.action || "Send message"}'));
  assert.ok(input.includes("textareaFocused"));
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
