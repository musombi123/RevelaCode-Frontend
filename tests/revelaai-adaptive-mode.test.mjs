import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dashboard = await readFile(
  new URL("../src/components/AIAssistantDashboard.jsx", import.meta.url),
  "utf8",
);

test("Adaptive hosted mode is the default and On-device mode is session-only", () => {
  assert.match(dashboard, /const \[freeMode, setFreeMode\] = useState\(false\)/);
  assert.doesNotMatch(dashboard, /revelaai\.free_mode\.v1/);
  assert.match(dashboard, /session-only privacy choice/);
});

test("network errors never silently replace the hosted model with local templates", () => {
  assert.match(dashboard, /const localFallback = !workspaceRequested && freeMode/);
  assert.doesNotMatch(
    dashboard,
    /const localFallback = !workspaceRequested && !isProviderPipelineFailure && \(freeMode \|\| isNetworkFailure\)/,
  );
  assert.match(dashboard, /did not substitute a weaker local answer/);
});

test("local template answers remain available only after explicit On-device mode selection", () => {
  assert.match(dashboard, /if \(freeMode\) \{/);
  assert.match(dashboard, /On-device mode is active/);
  assert.match(dashboard, /Switch back to Adaptive mode to use hosted exports/);
});
