import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dashboardConfig = await readFile(
  new URL("../src/components/dashboardConfig.jsx", import.meta.url),
  "utf8",
);

test("Android home exposes Humanizer and Security Academy as direct quick tools", () => {
  assert.match(dashboardConfig, /data-demo="home-quick-tools"/);
  assert.match(dashboardConfig, /data-demo="home-tool-humanizer"/);
  assert.match(dashboardConfig, /onNavigate\?\.\("humanizer"\)/);
  assert.match(dashboardConfig, /data-demo="home-tool-security-academy"/);
  assert.match(dashboardConfig, /onNavigate\?\.\("security-academy"\)/);
});

test("Android home quick tools remain reachable on short screens", () => {
  assert.match(
    dashboardConfig,
    /data-demo="home-hubs"[^>]*overflow-y-auto overscroll-contain/,
  );
});
