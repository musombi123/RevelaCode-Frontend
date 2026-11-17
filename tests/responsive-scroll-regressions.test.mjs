import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the shared app content pane is the native Android vertical scroll owner", () => {
  const shell = read("../src/components/MainDashboardV2.jsx");
  const css = read("../src/index.css");
  assert.match(shell, /data-app-scroll-root="true"/);
  assert.match(shell, /overflow-x-hidden overflow-y-auto overscroll-y-contain/);
  assert.match(shell, /height: 0, minHeight: 0/);
  assert.match(css, /html\[data-revelacode-native-app="true"\] \[data-app-scroll-root="true"\]/);
  assert.match(css, /overflow-y: auto/);
  assert.match(css, /-webkit-overflow-scrolling: touch/);
  assert.match(css, /touch-action: pan-y/);
});

test("Community, Elimu, Shamba and Biashara retain natural mobile document height", () => {
  const community = read("../src/Dashboard/Community/CommunityWorkspaceFrame.jsx");
  const elimu = read("../src/Dashboard/ElimuDashboardWorkspace.jsx");
  const shamba = read("../src/Dashboard/ShambaMobileExperience.jsx");
  const biashara = read("../src/Dashboard/Biashara/biashara-overview.css");

  assert.match(community, /min-h-screen w-full lg:h-full lg:min-h-0 lg:overflow-hidden/);
  assert.match(community, /lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto/);
  assert.match(elimu, /<main className="min-w-0 flex-1[^"]*lg:overflow-y-auto/);
  assert.match(elimu, /min-h-screen bg-slate-50[^"]*lg:overflow-hidden/);
  assert.match(shamba, /data-shamba-mobile-ui="reference-v1" className="shamba-mobile min-h-\[100svh\] overflow-x-hidden/);
  assert.match(biashara, /@media \(max-width:700px\)\s*\{\s*\.biashara-shell \{ display:block;height:auto;min-height:100svh;overflow:visible; \}/);
  assert.match(biashara, /\.biashara-shell-workspace \{ height:auto;min-height:100svh;overflow:visible; \}/);
});

test("Faith mobile content expands naturally inside the shared app scroller", () => {
  const faith = read("../src/components/faith/faith-dashboard.css");
  const layout = read("../src/components/faith/workspace/FaithWorkspaceLayout.jsx");
  assert.match(faith, /\.faith-home-shell \{ display: block; height: auto; min-height: 100svh; overflow: visible; \}/);
  assert.match(faith, /\.faith-home-main \{ height: auto; min-height: 100svh; overflow: visible;/);
  assert.match(faith, /html\[data-revelacode-native-app="true"\] \.faith-home-main/);
  assert.match(layout, /data-faith-workspace-content/);
  assert.match(faith, /\[data-faith-workspace-content\] \{[\s\S]*?overflow: visible;/);
});

test("RevelaAI keeps welcome content and conversation history independently scrollable", () => {
  const ai = read("../src/components/AIAssistantDashboard.jsx");
  assert.match(ai, /aria-label="RevelaAI welcome workspace"[^>]*className="flex min-h-0 flex-1 flex-col overflow-y-auto/);
  assert.match(ai, /aria-label="Conversation workspace"[^>]*className="flex min-h-0 flex-1 flex-col overflow-hidden/);
  assert.match(ai, /min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6/);
});
