import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
if (!fs.existsSync(dist) || !fs.statSync(dist).isDirectory()) {
  throw new Error("Vite dist/ output is missing. Run the rpsvi-staging build first.");
}

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:js|mjs|html|css|json|map)$/i.test(entry.name)) files.push(full);
  }
}
walk(dist);
if (!files.length) throw new Error("No inspectable static build artifacts were found.");

const bundle = files.map(file => fs.readFileSync(file, "utf8")).join("\n");
const required = [
  "revelacode-rpsvi-staging.onrender.com",
  "revelaai-rpsvi-staging.onrender.com",
];
const forbidden = [
  "revelacode-backend.onrender.com",
  "revelaai.onrender.com",
];

for (const host of required) {
  if (!bundle.includes(host)) {
    throw new Error(`Staging bundle is missing required service origin: ${host}`);
  }
}
for (const host of forbidden) {
  if (bundle.includes(host)) {
    throw new Error(`Production service origin leaked into staging bundle: ${host}`);
  }
}
console.log(`RPSVI staging bundle verified across ${files.length} built assets.`);
