import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("admin sample data workspace covers Community Center and every Jumuiya area", () => {
  const page = read("src/components/admin/AdminJumuiyaSamples.jsx");
  for (const marker of [
    "Community Center",
    "shamba",
    "biashara",
    "elimu",
    "marketplace",
    "Faith & MissionPulse",
    "Shared services",
    "/api/jumuiya/admin/sample-records",
    "/api/jumuiya/admin/sample-records/seed",
    "SAMPLE DATA",
    "live hub data",
    'hub === "all" && Number(data.total) === 0',
    "setSeeding(true)",
  ]) {
    assert.ok(page.includes(marker), "Sample data workspace is missing " + marker);
  }
});

test("the admin dashboard registers a reachable Jumuiya Sample Data page", () => {
  const dashboard = read("src/components/admin/AdminDashboard.jsx");
  const sidebar = read("src/components/admin/AdminSidebar.jsx");
  assert.match(dashboard, /import AdminJumuiyaSamples from "\.\/AdminJumuiyaSamples\.jsx"/);
  assert.match(dashboard, /sampleData:\s*\{/);
  assert.match(dashboard, /"sampleData"/);
  assert.match(sidebar, /key: "sampleData"/);
  const directory = read("src/components/admin/AdminJumuiyaDirectory.jsx");
  assert.match(directory, /Open Jumuiya Sample Data/);
  assert.match(directory, /typeof onOpenSamples === "function"/);
  assert.match(dashboard, /onOpenSamples=\{\(\) => setActiveTab\("sampleData"\)\}/);
});
