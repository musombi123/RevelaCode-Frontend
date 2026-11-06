import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("local workspace uses IndexedDB and explicit folder permission", async () => {
  const source = await readFile(new URL("../src/ai/localWorkspaceStorage.js", import.meta.url), "utf8");
  assert.match(source, /indexedDB\.open/);
  assert.match(source, /showDirectoryPicker/);
  assert.match(source, /requestPermission\(\{ mode: "readwrite" \}\)/);
  assert.match(source, /requestPersistentStorage/);
  assert.match(source, /export async function deleteLocalFile/);
});

test("productivity workspace exposes local storage and saves generated artifacts locally", async () => {
  const panel = await readFile(new URL("../src/components/ProductivityToolsPanel.jsx", import.meta.url), "utf8");
  const storageUi = await readFile(new URL("../src/components/LocalWorkspaceStoragePanel.jsx", import.meta.url), "utf8");
  assert.match(panel, /LocalWorkspaceStoragePanel/);
  assert.match(panel, /saveLocalFile/);
  assert.match(panel, /Save to local workspace/);
  assert.match(storageUi, /AI learning and approved knowledge remain on RevelaAI's MongoDB backend/);
});
