import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Humanizer opens inline inside the existing AI workspace", () => {
  const dashboard = read("../src/components/AIAssistantDashboard.jsx");
  const sidebar = read("../src/components/Sidebar.jsx");
  const app = read("../src/App.jsx");
  const humanizer = read("../src/pages/HumanizerWorkspace.jsx");

  assert.match(dashboard, /import HumanizerWorkspace from ["']@\/pages\/HumanizerWorkspace["']/);
  assert.match(dashboard, /setHumanizerOpen\(true\)/);
  assert.match(dashboard, /<HumanizerWorkspace embedded \/>/);
  assert.match(dashboard, /onOpenHumanizer=\{\(\) => setHumanizerOpen\(true\)\}/);
  assert.match(sidebar, /onOpenHumanizer/);
  assert.doesNotMatch(sidebar, /navigate\(["']\/humanizer["']\)/);
  assert.match(app, /path="\/humanizer" element=\{<Navigate to="\/app\?hub=ai&tool=humanizer" replace \/>\}/);
  assert.match(humanizer, /if \(!token\) return \{\};/);
  assert.doesNotMatch(humanizer, /Please sign in to use the Humanizer/);
});

test("Productivity tools remain available from both AI composer states", () => {
  const dashboard = read("../src/components/AIAssistantDashboard.jsx");
  assert.equal((dashboard.match(/<ProductivityToolsPanel onSend=\{sendTextMessage\} \/>/g) || []).length, 2);
});
