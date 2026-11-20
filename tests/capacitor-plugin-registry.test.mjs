import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL("../" + path, import.meta.url), "utf8");
}

test("RevelaDownload is registered through the shared Capacitor registry", async () => {
  const [registry, downloadFile, saveGeneratedFile, exportPdf] = await Promise.all([
    source("src/native/capacitorPlugins.js"),
    source("src/components/utils/downloadFile.js"),
    source("src/components/utils/saveGeneratedFile.js"),
    source("src/components/utils/exportPdf.js"),
  ]);

  assert.match(registry, /getRevelaCapacitorPlugin\("RevelaDownload"\)/);
  assert.equal((registry.match(/registerPlugin\(/g) || []).length, 1);
  assert.match(downloadFile, /import \{ NativeDownloads \} from "@\/native\/capacitorPlugins\.js"/);
  assert.match(saveGeneratedFile, /import \{ NativeDownloads \} from "@\/native\/capacitorPlugins\.js"/);
  assert.doesNotMatch(downloadFile, /registerPlugin\(["']RevelaDownload/);
  assert.doesNotMatch(saveGeneratedFile, /registerPlugin\(["']RevelaDownload/);
  assert.doesNotMatch(exportPdf, /registerPlugin\(["']RevelaDownload/);
});
