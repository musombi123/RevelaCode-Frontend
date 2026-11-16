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
