import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const dashboard = read("../src/components/AIAssistantDashboard.jsx");
const message = read("../src/components/Message.jsx");

test("hosted model errors preserve server diagnosis instead of replacing it with a generic message", () => {
  assert.match(dashboard, /payload\?\.error\?\.message/);
  assert.match(dashboard, /failure\.code = String\(payload\?\.error\?\.code/);
  assert.match(dashboard, /failure\.status = response\.status/);
  assert.match(dashboard, /isProviderPipelineFailure/);
  assert.match(dashboard, /!isProviderPipelineFailure && \(freeMode \|\| isNetworkFailure\)/);
});

test("regular chat exposes the Context Guard processing metadata returned by /ai", () => {
  assert.match(dashboard, /contextProcessing:/);
  assert.match(dashboard, /payload\?\.meta\?\.context_processing/);
  assert.match(message, /context_guard_map_reduce/);
  assert.match(message, /Long input processed in/);
  assert.match(message, /completed_sections/);
});

test("answer regeneration preserves Context Guard errors and successful processing metadata", () => {
  assert.match(dashboard, /failure\.contextProcessing = payload\?\.context_processing/);
  assert.match(dashboard, /RevelaAI could not regenerate the response/);
  assert.match(dashboard, /resultData\?\.context_processing/);
});


test("chat exports route generated PDF and text files through the shared native-aware saver", () => {
  const smartExport = read("../src/components/utils/smartExport.js");
  const pdfExport = read("../src/components/utils/exportPdf.js");
  const saver = read("../src/components/utils/saveGeneratedFile.js");
  const actions = read("../src/components/MessageActions.jsx");

  assert.match(smartExport, /saveGeneratedFile/);
  assert.match(smartExport, /delivery/);
  assert.match(pdfExport, /doc\.output\("blob"\)/);
  assert.match(pdfExport, /saveGeneratedFile\(blob/);
  const pluginRegistry = read("../src/native/capacitorPlugins.js");
  assert.match(saver, /import \{ NativeDownloads \} from "@\/native\/capacitorPlugins\.js"/);
  assert.match(pluginRegistry, /getRevelaCapacitorPlugin\("RevelaDownload"\)/);
  assert.match(pluginRegistry, /registerPlugin\(pluginName\)/);
  assert.match(saver, /nativePlugin\.saveFile/);
  assert.match(saver, /downloadUrl/);
  assert.match(saver, /20 MB native-save limit/);
  assert.match(actions, /Saved in Downloads\/RevelaCode/);
  assert.match(actions, /role="alert"/);
});


test("workspace artifact links resolve on the RevelaAI origin and use the native downloader on Android", () => {
  const saver = read("../src/components/utils/saveGeneratedFile.js");
  const panel = read("../src/components/RevelaAIWorkspacePanel.jsx");
  const dashboard = read("../src/components/AIAssistantDashboard.jsx");

  assert.match(saver, /resolveRevelaAIArtifactUrl/);
  assert.match(saver, /new URL\(raw, base\)/);
  assert.match(saver, /resolved\.origin !== base\.origin/);
  assert.match(saver, /nativePlugin\.downloadUrl/);
  assert.match(panel, /downloadRemoteArtifact/);
  assert.match(panel, /resolveRevelaAIArtifactUrl/);
  assert.match(panel, /Download original/);
  assert.match(dashboard, /primarySource/);
  assert.match(dashboard, /mime_type:/);
  assert.match(dashboard, /preview_filename:/);
});
