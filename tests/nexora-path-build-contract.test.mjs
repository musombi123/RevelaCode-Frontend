import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("NEXORA has its own HTML and React startup entry", () => {
  const html = read("apps/nexora/index.html");
  const entry = read("apps/nexora/src/main.jsx");
  assert.match(html, /<title>NEXORA Studio Pro<\/title>/);
  assert.match(html, /src="\/src\/main\.jsx"/);
  assert.match(entry, /NexoraFoundryWorkspace/);
  assert.doesNotMatch(entry, /from ["']\.\.\/\.\.\/App\.jsx["']/);
  assert.doesNotMatch(entry, /AuthProvider|HistoryProvider|StartModal/);
});

test("NEXORA builds into the shared static site's dedicated path", () => {
  const vite = read("apps/nexora/vite.config.js");
  assert.match(vite, /base:\s*["']\/dev_nexora\/["']/);
  assert.match(vite, /outDir:\s*["']\.\.\/\.\.\/public\/dev_nexora["']/);
  assert.match(vite, /port:\s*5174/);
});

test("web build compiles NEXORA before RevelaCode", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.scripts["build:nexora"], /vite build apps\/nexora/);
  assert.equal(pkg.scripts["build:web"], "npm run build:nexora && npm run build");
});

test("RevelaCode service worker leaves the NEXORA path untouched", () => {
  const worker = read("public/revelacode-sw.js");
  assert.match(worker, /url\.pathname === ["']\/dev_nexora["']/);
  assert.match(worker, /url\.pathname\.startsWith\(["']\/dev_nexora\/["']\)/);
});

test("NEXORA Creator Flow plans load before a cloud project exists", () => {
  const panel = read("apps/nexora/src/components/nexora/CreatorFlowPanel.jsx");
  const catalogueEffectStart = panel.indexOf('apiRequest("/api/v1/creator-flow/plans")');
  const catalogueEffectEnd = panel.indexOf("}, [apiRequest]);", catalogueEffectStart);
  assert.notEqual(catalogueEffectStart, -1, "Creator Flow must request the authenticated plan catalogue");
  assert.notEqual(catalogueEffectEnd, -1, "Plan catalogue request must have a bounded effect");
  const catalogueEffect = panel.slice(panel.lastIndexOf("useEffect", catalogueEffectStart), catalogueEffectEnd);
  assert.doesNotMatch(catalogueEffect, /if\s*\(!cloudProjectActive\)/);
  assert.match(panel, /NEXORA CREATOR PLANS/);
  assert.match(panel, /plan\.max_workload_units/);
  assert.match(panel, /requiresProject:\s*false/);
  assert.match(panel, /Price pending/);
});
