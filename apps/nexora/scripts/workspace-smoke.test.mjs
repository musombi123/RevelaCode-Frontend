import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workspacePath = new URL("../src/components/nexora/NexoraFoundryWorkspace.jsx", import.meta.url);
const workspace = await readFile(workspacePath, "utf8");
const viteConfig = await readFile(new URL("../vite.config.js", import.meta.url), "utf8");

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

test("production build defines shared React and icon vendor chunks", () => {
  assert.match(viteConfig, /vendor-react/);
  assert.match(viteConfig, /vendor-icons/);
});
