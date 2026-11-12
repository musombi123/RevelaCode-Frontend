import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

test("Biashara desktop keeps its sidebar outside the workspace scroll container", () => {
  const css = source("src/Dashboard/Biashara/biashara-overview.css");

  assert.match(css, /\.biashara-shell\s*\{[^}]*height:100%;min-height:0;[^}]*overflow:hidden;/);
  assert.match(css, /\.biashara-sidebar\s*\{[^}]*height:100%;min-height:0;/);
  assert.match(css, /\.biashara-shell-workspace\s*\{[^}]*overflow-x:hidden;overflow-y:auto;/);
  assert.match(css, /@media \(max-width:700px\)\s*\{[\s\S]*?\.biashara-shell\s*\{[^}]*height:auto;[^}]*overflow:visible;/);
});

test("Shamba desktop has a bounded sidebar and independent workspace scrolling", () => {
  const dashboard = source("src/Dashboard/ShambaHub.jsx");

  assert.match(dashboard, /className="shamba-workspace isolate h-full min-h-0[^"]*overflow-hidden/);
  assert.match(dashboard, /<aside className="sticky top-0 hidden h-full min-h-0[^"]*overflow-y-auto/);
  assert.match(dashboard, /<main className="h-full min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto/);
});

test("Elimu desktop fixes the sidebar in a viewport-height shell and scrolls its main pane", () => {
  const workspace = source("src/Dashboard/ElimuDashboardWorkspace.jsx");
  const sidebar = source("src/Dashboard/elimu/components/ElimuDashboardSidebar.jsx");

  assert.match(workspace, /lg:h-full lg:min-h-0 lg:overflow-hidden/);
  assert.match(workspace, /lg:min-h-0 lg:overflow-hidden/);
  assert.match(workspace, /lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain/);
  assert.match(sidebar, /fixed inset-y-0 left-0 z-50 lg:sticky lg:top-0/);
});

test("Community home and companion workspaces keep desktop navigation rails outside content scrolling", () => {
  const home = source("src/Dashboard/Community/CommunityHubDashboard.jsx");
  const frame = source("src/Dashboard/Community/CommunityWorkspaceFrame.jsx");

  assert.match(home, /lg:h-full lg:min-h-0 lg:overflow-hidden/);
  assert.match(home, /lg:h-full lg:min-h-0 lg:flex lg:flex-col/);
  assert.match(home, /lg:overflow-y-auto lg:overscroll-y-contain/);

  assert.match(frame, /lg:h-full lg:min-h-0 lg:overflow-hidden/);
  assert.match(frame, /flex h-full min-h-0 flex-col overflow-y-auto overscroll-y-contain/);
  assert.match(frame, /lg:h-full lg:min-h-0 lg:flex lg:flex-col lg:overflow-y-auto/);
});

test("Faith desktop sidebar remains in its own rail while the main panel scrolls", () => {
  const css = source("src/components/faith/faith-dashboard.css");

  assert.match(css, /\.faith-home-shell\s*\{[\s\S]*?height:\s*100%;[\s\S]*?min-height:\s*0;[\s\S]*?overflow:\s*hidden;/);
  assert.match(css, /\.faith-home-sidebar\s*\{[\s\S]*?height:\s*100%;[\s\S]*?min-height:\s*0;[\s\S]*?overflow-y:\s*auto;/);
  assert.match(css, /\.faith-home-main\s*\{[^}]*height:\s*100%;[^}]*overflow-x:\s*hidden;[^}]*overflow-y:\s*auto;/);
  assert.match(css, /@media \(max-width: 640px\)\s*\{[\s\S]*?\.faith-home-shell\s*\{[^}]*height: auto;[^}]*overflow: visible;/);
});
