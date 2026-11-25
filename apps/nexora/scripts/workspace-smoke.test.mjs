import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workspacePath = new URL("../src/components/nexora/NexoraFoundryWorkspace.jsx", import.meta.url);
const shellPath = new URL("../src/components/nexora/NexoraStudioShell.jsx", import.meta.url);
const overviewPath = new URL("../src/components/nexora/NexoraStudioOverview.jsx", import.meta.url);
const cssPath = new URL("../src/index.css", import.meta.url);
const viteConfigPath = new URL("../vite.config.js", import.meta.url);

const [workspace, shell, overview, css, viteConfig] = await Promise.all([
  readFile(workspacePath, "utf8"),
  readFile(shellPath, "utf8"),
  readFile(overviewPath, "utf8"),
  readFile(cssPath, "utf8"),
  readFile(viteConfigPath, "utf8"),
]);

test("heavy workspace tools are split into lazy-loaded modules", () => {
  for (const moduleName of [
    "NexoraBuildTestCenter",
    "NexoraDeviceBridge",
    "CreatorFlowPanel",
    "NexoraDesktopFactoryPanel",
    "NexoraSceneInspector",
    "NexoraWorldBuilderPanel",
  ]) {
    assert.ok(workspace.includes("const " + moduleName + " = lazy("));
  }
});

test("build, device lab and AI panels mount only when selected", () => {
  assert.ok(workspace.includes('studioView === "build" &&'));
  assert.ok(workspace.includes('studioView === "device-lab" &&'));
  assert.ok(workspace.includes('studioView === "ai" &&'));
  assert.ok(!workspace.includes('hidden={studioView !== "build"'));
  assert.ok(!workspace.includes('hidden={studioView !== "device-lab"'));
  assert.ok(!workspace.includes('hidden={studioView !== "ai"'));
});

test("factory panel is rendered once to prevent duplicate workspace UI", () => {
  assert.equal((workspace.match(/<NexoraDesktopFactoryPanel/g) || []).length, 1);
});

test("primary navigation is compact and advanced workspace routes remain accessible", () => {
  assert.equal((shell.match(/id: "(?:overview|projects|game-editor|ai|assets|build|device-lab)"/g) || []).length, 7);
  assert.ok(shell.includes("TOOLS & INFRASTRUCTURE"));
  for (const route of ["world", "team", "analytics", "marketplace", "settings", "factory", "toolchains", "backups", "release-center"]) {
    assert.ok(shell.includes('id: "' + route + '"'));
  }
});

test("Local Agent status uses paired session and reported capability data", () => {
  assert.ok(workspace.includes("setLocalAgentCapabilities(connected ? (capabilities || null) : null)"));
  assert.ok(workspace.includes("localAgentCapabilities={localAgentCapabilities}"));
  assert.ok(shell.includes("Local Agent"));
  assert.ok(overview.includes("Toolchain verification"));
  assert.ok(!overview.includes("healthScore") && !overview.includes("healthChecks"));
});

test("overview does not invent job progress or sample projects", () => {
  assert.ok(overview.includes("Worker progress not reported"));
  assert.ok(overview.includes("No projects to resume yet"));
  assert.ok(!overview.includes("Orbit concept") && !overview.includes("Neon concept") && !overview.includes("Wildwood concept"));
  assert.ok(overview.includes("latestBuild?.progress"));
});

test("collapsed sidebar width remains controlled by the responsive nav classes", () => {
  assert.ok(!css.includes(".nexora-shell aside.fixed {\n  width: 230px;"));
});

test("production build defines shared React and icon vendor chunks", () => {
  assert.ok(viteConfig.includes("vendor-react"));
  assert.ok(viteConfig.includes("vendor-icons"));
});
