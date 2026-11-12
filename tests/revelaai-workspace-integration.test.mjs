import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const client = read("../src/ai/revelaAIClient.js");
const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const composer = read("../src/components/InputBar.jsx");
const shamba = read("../src/Dashboard/ShambaMobileExperience.jsx");
const diagnostics = read("../src/Dashboard/ShambaDiagnosticsPanel.jsx");
const panel = read("../src/components/RevelaAIWorkspacePanel.jsx");

test("workspace and Live Vision use the existing single RevelaAI API base", () => {
  assert.match(client, /const API_BASE = String\(/);
  assert.match(client, /export const REVELAAI_API_BASE = API_BASE/);
  assert.match(client, /export async function executeRevelaAIWorkspace/);
  assert.match(client, /\$\{API_BASE\}\/api\/workspace\/execute/);
  assert.match(client, /\/execute\/multipart/);
  assert.match(client, /export async function analyzeRevelaAIVision/);
  assert.match(client, /\$\{API_BASE\}\/api\/vision\/analyze/);
  assert.doesNotMatch(client, /VITE_REVELAAI_(?:WORKSPACE|DOCS|ANALYTICS|IMAGE)_URL/);
});

test("multipart tool exports preserve the browser boundary and forward user-selected logos", () => {
  const multipartBranch = client.slice(client.indexOf("if (hasAttachments)"), client.indexOf("} else {", client.indexOf("if (hasAttachments)")));
  assert.match(multipartBranch, /new FormData\(\)/);
  assert.match(multipartBranch, /body\.append\(fieldName, file/);
  assert.doesNotMatch(multipartBranch, /Content-Type/);
  assert.match(dashboard, /fieldName: "logo"/);
  assert.match(dashboard, /image_placement: "header"/);
  assert.match(dashboard, /image_placement: "title_slide"/);
});

test("AI artifact commands route through the unified authenticated workspace", () => {
  for (const command of ["/doc", "/deck", "/sheet", "/data", "/ledger", "/paper", "/code", "/ui", "/promo", "/image"]) {
    assert.ok(dashboard.includes(command), `Workspace command missing: ${command}`);
    assert.ok(composer.includes(command), `Composer command missing: ${command}`);
  }
  assert.match(dashboard, /executeRevelaAIWorkspace\(/);
  assert.match(dashboard, /inferWorkspaceCommand\(/);
  assert.match(dashboard, /<RevelaAIWorkspacePanel/);
  assert.match(panel, /artifact\.image_url/);
  assert.match(panel, /artifact\.campaign/);
  assert.match(panel, /artifact\.analysis\?\.columns/);
});

test("Shamba camera sends authenticated explicit leaf or soil diagnostic context", () => {
  const run = shamba.slice(shamba.indexOf("const runDiagnostic"), shamba.indexOf("const saveLeafDiagnostic"));
  assert.match(run, /analyzeRevelaAIVision\(/);
  assert.match(run, /authFetch/);
  assert.match(run, /hub: "shamba"/);
  assert.match(run, /analysisType: diagnosticMode === "leaf" \? "leaf" : "soil"/);
  assert.match(run, /analysisContext:/);
  assert.match(run, /soil_test_method: soilMethod/);
  assert.match(run, /measured_ph:/);
  assert.match(run, /crop_name:/);
  assert.match(run, /analysis: data\.analysis/);
  assert.doesNotMatch(run, /localStorage\.getItem/);
  assert.doesNotMatch(run, /fetch\(apiBase/);
});

test("Shamba results render structured expert fields and explicitly guard unmeasured pH", () => {
  for (const fragment of [
    "likely_causes",
    "visual_evidence",
    "differential",
    "integrated_pest_management",
    "field_checks",
    "physical_assessment",
    "pH_test",
    "recommended_field_tests",
    "Bare-soil colour is not a pH test",
    "not confirmed diagnoses",
  ]) assert.ok(diagnostics.includes(fragment), `Missing diagnostic UI field: ${fragment}`);
  assert.match(diagnostics, /soil pH and nutrients are never measured from bare-soil colour/i);
});

test("mislabeled SVG logos are detected from their content and rasterized before upload", () => {
  assert.match(client, /const declaredSvg = String\(file\.type \|\| ""\)\.toLowerCase\(\)/);
  assert.match(client, /file\.slice\(0, Math\.min\(file\.size, 8192\)\)\.text\(\)/);
  assert.match(client, /const contentLooksSvg = \/<svg/);
  assert.match(client, /const isSvg = declaredSvg \|\| contentLooksSvg/);
  assert.match(client, /new File\(\[png\], baseName \+ "\.png", \{ type: "image\/png"/);
});
