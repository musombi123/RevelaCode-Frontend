import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the shared Android shell owns the vertical scroll container", () => {
  const shell = read("../src/components/MainDashboardV2.jsx");
  assert.ok(shell.includes('data-app-scroll-root="true"'));
  assert.ok(shell.includes("overflow-y-auto overscroll-y-contain"));
  assert.ok(shell.includes("height: 0, minHeight: 0"));
  assert.ok(shell.includes("WebkitOverflowScrolling: \"touch\""));
  assert.ok(shell.includes('touchAction: "pan-y"'));
});

test("Community and Elimu use scrollable content panes without clipping mobile document height", () => {
  const community = read("../src/Dashboard/Community/CommunityWorkspaceFrame.jsx");
  const elimu = read("../src/Dashboard/ElimuDashboardWorkspace.jsx");
  assert.ok(community.includes('data-community-workspace-main="true" className="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto'));
  assert.ok(elimu.includes('data-demo="elimu-overview" className="min-h-screen'));
  assert.ok(elimu.includes("lg:overflow-hidden"));
  assert.ok(elimu.includes("lg:overflow-y-auto"));
});

test("Shamba and Biashara expand naturally on narrow screens", () => {
  const shamba = read("../src/Dashboard/ShambaMobileExperience.jsx");
  const biashara = read("../src/Dashboard/Biashara/biashara-overview.css");
  assert.ok(shamba.includes('data-shamba-mobile-ui="reference-v1" data-theme={resolvedTheme} className="shamba-mobile min-h-[100svh] overflow-x-hidden'));
  assert.ok(biashara.includes("@media (max-width:700px)"));
  assert.ok(biashara.includes(".biashara-shell { display:block;height:auto;min-height:100svh;overflow:visible; }"));
  assert.ok(biashara.includes(".biashara-shell-workspace { height:auto;min-height:100svh;overflow:visible; }"));
});

test("Faith workspace content remains in the shared mobile scroller", () => {
  const css = read("../src/components/faith/faith-dashboard.css");
  const layout = read("../src/components/faith/workspace/FaithWorkspaceLayout.jsx");
  assert.ok(css.includes(".faith-home-shell { display: block; height: auto; min-height: 100svh; overflow: visible; }"));
  assert.ok(css.includes(".faith-home-main { height: auto; min-height: 100svh; overflow: visible;"));
  assert.ok(css.includes('html[data-revelacode-native-app="true"] [data-faith-workspace-content]'));
  assert.ok(layout.includes("data-faith-workspace-content"));
});

test("RevelaAI welcome and conversation content have dedicated vertical scroll areas", () => {
  const ai = read("../src/components/AIAssistantDashboard.jsx");
  assert.ok(ai.includes('aria-label="RevelaAI welcome workspace"'));
  assert.ok(ai.includes('aria-label="Conversation workspace"'));
  assert.ok(ai.includes("min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6"));
});
