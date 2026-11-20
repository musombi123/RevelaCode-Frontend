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
  assert.equal(pkg.scripts["build:web"], "npm run build:nexora && npm run build && node scripts/verify-nexora-static-output.mjs");
  assert.match(read("scripts/verify-nexora-static-output.mjs"), /dist.*dev_nexora.*index\.html/);
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

test("NEXORA Studio Pro exposes all redesigned workspace destinations", () => {
  const shell = read("apps/nexora/src/components/nexora/NexoraStudioShell.jsx");
  const workspace = read("apps/nexora/src/components/nexora/NexoraFoundryWorkspace.jsx");
  const pages = read("apps/nexora/src/components/nexora/NexoraWorkspacePages.jsx");
  for (const route of ["overview","projects","game-editor","ai","world","assets","build","device-lab","analytics","team","marketplace","settings"]) {
    assert.ok(shell.includes('"'+route+'"'), "Sidebar is missing "+route);
    assert.ok(workspace.includes('studioView === "'+route+'"') || workspace.includes('studioView !== "'+route+'"'), "Workspace does not route "+route);
  }
  assert.match(workspace, /<NexoraStudioShell/);
  assert.match(workspace, /<NexoraOverviewPage/);
  assert.match(workspace, /<NexoraProjectsPage/);
  assert.match(workspace, /<NexoraTasksPage/);
  assert.match(workspace, /<NexoraAnalyticsPage/);
  assert.match(workspace, /<NexoraMarketplacePage/);
  assert.match(workspace, /<NexoraSettingsPage/);
  assert.match(pages, /Grid/);
  assert.match(pages, /List/);
});

test("World Builder persists its WorldDocument through the NEXORA API", () => {
  const world = read("apps/nexora/src/components/nexora/NexoraWorldBuilderPanel.jsx");
  assert.match(world, /\/api\/v1\/workspace\/projects\//);
  assert.match(world, /method:\s*"PUT"/);
  assert.match(world, /terrain_edits/);
  assert.match(world, /sun_angle/);
  assert.match(world, /water_level/);
  assert.match(world, /cloudProjectActive/);
});

test("local team task board and unsupported marketplace integrations are labelled honestly", () => {
  const pages = read("apps/nexora/src/components/nexora/NexoraWorkspacePages.jsx");
  assert.match(pages, /Tasks linked to cloud projects sync/);
  assert.match(pages, /Team-member permissions, cross-member assignments and comments require a collaborative team service/);
  assert.match(pages, /Paid third-party marketplace checkout is not connected/);
  const shell = read("apps/nexora/src/components/nexora/NexoraStudioShell.jsx");
  assert.match(shell, /Account quota is not exposed by this service/);
});

test("World Builder uses owner-scoped NEXORA endpoints and canonical save documents", () => {
  const world = read("apps/nexora/src/components/nexora/NexoraWorldBuilderPanel.jsx");
  assert.match(world, /\/api\/v1\/workspace\/projects\/.*\/world/);
  assert.doesNotMatch(world, /["']\/api\/projects\//);
  assert.match(world, /payload\.document/);
  assert.match(world, /cloudProjectActive/);
  assert.match(world, /localStorage\.getItem\(localWorldKey\)/);
  assert.match(world, /localStorage\.setItem\(localWorldKey/);
  const workspace = read("apps/nexora/src/components/nexora/NexoraFoundryWorkspace.jsx");
  assert.match(workspace, /userId=\{nexoraUser\?\.id \|\| "anonymous"\}/);
});

test("NEXORA project tasks use authenticated account-scoped CRUD APIs", () => {
  const workspace = read("apps/nexora/src/components/nexora/NexoraFoundryWorkspace.jsx");
  const pages = read("apps/nexora/src/components/nexora/NexoraWorkspacePages.jsx");
  assert.match(workspace, /\/api\/v1\/workspace\/projects\/\$\{projectId\}\/tasks/);
  assert.match(workspace, /method:"POST", body:JSON\.stringify\(taskPayload\(taskDraft\)\)/);
  assert.match(workspace, /method:"PUT", body:JSON\.stringify\(taskPayload\(updated\)\)/);
  assert.match(workspace, /method:"DELETE"/);
  assert.match(workspace, /_remoteTask/);
  assert.match(workspace, /studioTasks\.filter\(task => !task\._remoteTask\)/);
  assert.match(pages, /CLOUD · ACCOUNT SYNC/);
  assert.match(pages, /LOCAL DRAFT/);
});

test("generated NEXORA output is excluded from source control", () => {
  const ignore = read(".gitignore");
  assert.match(ignore, /^public\/dev_nexora\/$/m);
});
