import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = join(process.cwd(), "public", "vision-assets");
const ASSETS = [
  ["tf.min.js", "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"],
  ["coco-ssd.min.js", "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js"],
  ["opencv.js", "https://docs.opencv.org/4.9.0/opencv.js"],
  ["tesseract.min.js", "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"],
  ["tesseract/worker.min.js", "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js"],
  ["tesseract/tesseract-core.wasm.js", "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core.wasm.js"],
  ["tesseract/tesseract-core.wasm", "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core.wasm"],
  ["tesseract/lang/eng.traineddata.gz", "https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz"],
];

async function download(path, url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await mkdir(dirname(join(ROOT, path)), { recursive: true });
  await writeFile(join(ROOT, path), bytes);
  process.stdout.write(`Downloaded ${path} (${bytes.byteLength.toLocaleString()} bytes)\n`);
}

async function downloadModel() {
  const url = "https://storage.googleapis.com/tfhub-tfjs-modules/tensorflow/tfjs-models/coco-ssd/1/default/1/model.json";
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`COCO-SSD manifest download failed (${response.status}).`);
  const manifestBytes = new Uint8Array(await response.arrayBuffer());
  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
  const folder = join(ROOT, "coco-ssd");
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, "model.json"), manifestBytes);
  const paths = [...new Set((manifest.weightsManifest || []).flatMap((group) => group.paths || []))];
  if (!paths.length) throw new Error("COCO-SSD model manifest contains no weight shards.");
  const base = new URL(".", url);
  for (const path of paths) {
    const shardUrl = new URL(path, base).toString();
    const shardResponse = await fetch(shardUrl, { redirect: "follow" });
    if (!shardResponse.ok) throw new Error(`COCO-SSD shard download failed (${shardResponse.status}): ${shardUrl}`);
    const bytes = new Uint8Array(await shardResponse.arrayBuffer());
    await mkdir(dirname(join(folder, path)), { recursive: true });
    await writeFile(join(folder, path), bytes);
    process.stdout.write(`Downloaded coco-ssd/${path} (${bytes.byteLength.toLocaleString()} bytes)\n`);
  }
}

async function main() {
  await mkdir(ROOT, { recursive: true });
  for (const [path, url] of ASSETS) await download(path, url);
  await downloadModel();
  process.stdout.write("\nAll runtime files are stored under public/vision-assets.\n");
  process.stdout.write("Test the built app with network disabled before claiming full offline operation.\n");
  process.stdout.write("Review and retain each upstream licence notice before redistribution.\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
