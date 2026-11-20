import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";

const dist = resolve(process.cwd(), "dist");
const mainEntry = resolve(dist, "index.html");
const nexoraEntry = resolve(dist, "dev_nexora", "index.html");

function fail(message) {
  console.error("[nexora-build-check] " + message);
  process.exitCode = 1;
}

if (!existsSync(mainEntry) || !statSync(mainEntry).isFile()) {
  fail("RevelaCode dist/index.html is missing.");
}
if (!existsSync(nexoraEntry) || !statSync(nexoraEntry).isFile()) {
  fail("NEXORA dist/dev_nexora/index.html is missing. The nested application was not published.");
}

if (!process.exitCode) {
  const html = readFileSync(nexoraEntry, "utf8");
  const references = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match => match[1]);
  const appAssets = references.filter(value => value.startsWith("/dev_nexora/assets/"));
  const javascript = appAssets.filter(value => /\.m?js(?:\?|$)/i.test(value));
  const stylesheet = appAssets.filter(value => /\.css(?:\?|$)/i.test(value));

  if (!javascript.length) fail("NEXORA entry does not reference a built JavaScript asset under /dev_nexora/assets/.");
  if (!stylesheet.length) fail("NEXORA entry does not reference a built stylesheet under /dev_nexora/assets/.");

  for (const reference of appAssets) {
    const relative = reference.split("?")[0].replace(/^\/+/, "");
    const outputPath = resolve(dist, relative);
    if (!outputPath.startsWith(dist + sep) || !existsSync(outputPath) || !statSync(outputPath).isFile()) {
      fail("Referenced NEXORA asset is missing from the published directory: " + reference);
    }
  }

  if (references.some(value => value.startsWith("/assets/"))) {
    fail("NEXORA entry contains a root-level /assets/ reference and may collide with RevelaCode assets.");
  }
}

if (!process.exitCode) {
  console.log("[nexora-build-check] Verified RevelaCode and independent NEXORA entries plus nested JS/CSS assets.");
}
