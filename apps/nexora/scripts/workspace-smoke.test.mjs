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
    "AndroidBuildConsole",
    "NexoraDeviceBridge",
    "CreatorFlowPanel",
    "NexoraDesktopFactoryPanel",
    "NexoraSceneInspector",
    "NexoraWorldBuilderPanel",
  ]) {
    assert.match(workspace, new RegExp(`const ${moduleName} = lazy\\(\\(\\) => import\\(`));
  }
});

test("build, device lab and AI panels mount only when selected", () => {
  assert.match(workspace, /studioView === "build" &&/);
  assert.match(workspace, /studioView === "device-lab" &&/);
  assert.match(workspace, /studioView === "ai" &&/);
  assert.doesNotMatch(workspace, /<div hidden=\\{studioView !== "(?:build|device-lab|ai)"\\}>/);
});

test("factory panel is rendered once to prevent duplicate workspace UI", () => {
  assert.equal((workspace.match(/<NexoraDesktopFactoryPanel/g) || []).length, 1);
});

test("primary navigation is compact and advanced workspace routes remain accessible", () => {
  assert.equal((shell.match(/id: "(?:overview|projects|game-editor|ai|assets|build|device-lab)"/g) || []).length, 7);
  assert.match(shell, /TOOLS & INFRASTRUCTURE/);
  for (const route of ["world", "team", "analytics", "marketplace", "settings", "factory", "toolchains", "backups", "release-center"]) {
    assert.match(shell, new RegExp('id: "' + route + '"'));
  }
});

test("Local Agent status uses paired session and reported capability data", () => {
  assert.match(workspace, /setLocalAgentCapabilities\\(connected \\? \\(capabilities \\|\\| null\\) : null\\)/);
  assert.match(workspace, /localAgentCapabilities=\\{localAgentCapabilities\\}/);
  assert.match(shell, /Local Agent/);
  assert.match(overview, /Toolchain verification/);
  assert.doesNotMatch(overview, /healthScore|healthChecks/);
});

test("overview does not invent job progress or sample projects", () => {
  assert.match(overview, /Worker progress not reported/);
  assert.match(overview, /No projects to resume yet/);
  assert.doesNotMatch(overview, /Orbit concept|Neon concept|Wildwood concept/);
  assert.match(overview, /latestBuild\\?\\.progress/);
});

test("collapsed sidebar width remains controlled by the responsive nav classes", () => {
  assert.doesNotMatch(css, /\\.nexora-shell aside\\.fixed\\s*\\{\\s*width:\\s*230px/);
});

test("production build defines shared React and icon vendor chunks", () => {
  assert.match(viteConfig, /vendor-react/);
  assert.match(viteConfig, /vendor-icons/);
});
