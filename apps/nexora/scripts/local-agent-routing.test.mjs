import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveLocalEngineUrl } from "../src/components/nexora/localEngineRouting.js";
import {
  isWorldSnapshotPending,
  readWorldSnapshot,
  writeWorldSnapshot,
} from "../src/components/nexora/localWorldStorage.js";

const componentRoot = new URL("../src/components/nexora/", import.meta.url);
const readComponent = (name) => readFile(new URL(name, componentRoot), "utf8");

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(String(key), String(value)); }
  removeItem(key) { this.#values.delete(String(key)); }
}

test("World Builder GET/PUT use the paired Local Agent transport", async () => {
  const [workspace, worldBuilder] = await Promise.all([
    readComponent("NexoraFoundryWorkspace.jsx"),
    readComponent("NexoraWorldBuilderPanel.jsx"),
  ]);
  assert.match(workspace, /NexoraWorldBuilderPanel[\s\S]*?localAgentFetch=\{localEngineFetch\}/);
  assert.match(worldBuilder, /localAgentFetch\("\/api\/v1\/workspace\/projects\/".*?\/world/);
  assert.doesNotMatch(worldBuilder, /nexoraAuthFetch|fetch\(API_BASE/);
});

test("Creator Flow assembly download calls the Local Agent with a relative Foundry route", async () => {
  const [workspace, creatorFlow] = await Promise.all([
    readComponent("NexoraFoundryWorkspace.jsx"),
    readComponent("CreatorFlowPanel.jsx"),
  ]);
  assert.match(workspace, /CreatorFlowPanel[\s\S]*?localAgentFetch=\{localEngineFetch\}/);
  assert.match(creatorFlow, /localAgentFetch\(\`\/api\/projects\/\$\{encodeURIComponent\(projectId\)\}\/movie-pipeline\/assembly\/download\`/);
  assert.doesNotMatch(creatorFlow, /API_BASE|nexora-foundry-api\.onrender\.com/);
  assert.match(creatorFlow, /blob\.size/);
});

test("Creator Flow production stages use the Local Agent-backed workspace API client", async () => {
  const [workspace, creatorFlow] = await Promise.all([
    readComponent("NexoraFoundryWorkspace.jsx"),
    readComponent("CreatorFlowPanel.jsx"),
  ]);
  assert.ok(workspace.includes("cloudControlRequest"));
  assert.ok(workspace.includes("await localEngineFetch(path, { ...options, headers })"));
  assert.ok(creatorFlow.includes("apiRequest(\x60/api/v1/workspace/projects/\x24{projectId}/creator-workflow/\x24{path}"));
  assert.ok(creatorFlow.includes("const buildStage = (stage, path) => run"));
  assert.ok(creatorFlow.includes("const createPipeline = () => run"));
});

test("World Builder and Creator Flow paths resolve to the mounted local Foundry app", () => {
  const apiBase = "https://nexora-foundry-api.onrender.com";
  const localAgent = "http://127.0.0.1:8765";
  assert.equal(
    resolveLocalEngineUrl("/api/v1/workspace/projects/demo/world", apiBase, localAgent),
    "http://127.0.0.1:8765/engine/api/v1/workspace/projects/demo/world",
  );
  assert.equal(
    resolveLocalEngineUrl("/api/projects/demo/movie-pipeline/assembly/download", apiBase, localAgent),
    "http://127.0.0.1:8765/engine/api/projects/demo/movie-pipeline/assembly/download",
  );
  assert.equal(
    resolveLocalEngineUrl(apiBase + "/api/projects/demo/movie-pipeline/assembly/download", apiBase, localAgent),
    "http://127.0.0.1:8765/engine/api/projects/demo/movie-pipeline/assembly/download",
  );
});

test("World Builder recovery snapshots survive an agent outage and remain marked pending", () => {
  const storage = new MemoryStorage();
  const documentKey = "nexora.world-document.v1:creator:project-1";
  const pendingKey = documentKey + ":pending-local-agent";
  const world = {
    seed: 42,
    world: { width: 144, depth: 96 },
    objects: [{ id: "beacon-1", name: "Saved offline beacon" }],
    terrain_edits: [{ id: "raise-1", operation: "raise", x: 4, z: 8, radius: 5, strength: 2 }],
  };

  writeWorldSnapshot(storage, documentKey, pendingKey, world, true);

  // A fresh component/agent session reads the persisted browser copy.
  assert.deepEqual(readWorldSnapshot(storage, documentKey), world);
  assert.equal(isWorldSnapshotPending(storage, pendingKey), true);

  // A successful Local Agent replay clears the pending marker without changing the data.
  writeWorldSnapshot(storage, documentKey, pendingKey, world, false);
  assert.deepEqual(readWorldSnapshot(storage, documentKey), world);
  assert.equal(isWorldSnapshotPending(storage, pendingKey), false);
});

test("World Builder attempts pending local recovery before loading the device document", async () => {
  const worldBuilder = await readComponent("NexoraWorldBuilderPanel.jsx");
  const replayIndex = worldBuilder.indexOf("if (pending && cached)");
  const localLoadIndex = worldBuilder.indexOf('localAgentFetch("/api/v1/workspace/projects/"');
  assert.ok(replayIndex >= 0 && localLoadIndex > replayIndex);
  assert.match(worldBuilder, /Your browser recovery copy has been preserved/);
  assert.match(worldBuilder, /if \(!loaded && !recoveryCopy\)/);
  assert.match(worldBuilder, /will not queue a default document that could overwrite existing work/);
});
