import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveLocalEngineUrl } from "../src/components/nexora/localEngineRouting.js";
import {
  isWorldSnapshotPending,
  readWorldSnapshot,
  writeWorldSnapshot,
} from "../src/components/nexora/localWorldStorage.js";
import {
  listProjectRecoveries,
  readProjectRecovery,
  removeProjectRecovery,
  writeProjectRecovery,
} from "../src/components/nexora/localProjectRecovery.js";

const componentRoot = new URL("../src/components/nexora/", import.meta.url);
const readComponent = (name) => readFile(new URL(name, componentRoot), "utf8");

class MemoryStorage {
  #values = new Map();
  get length() { return this.#values.size; }
  key(index) { return Array.from(this.#values.keys())[index] ?? null; }
  getItem(key) { return this.#values.has(String(key)) ? this.#values.get(String(key)) : null; }
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


test("Local Engine routing rejects untrusted absolute and protocol-relative URLs", () => {
  const apiBase = "https://nexora-foundry-api.onrender.com";
  const localAgent = "http://127.0.0.1:8765";
  assert.throws(
    () => resolveLocalEngineUrl("https://evil.example/collect", apiBase, localAgent),
    /untrusted external URL/,
  );
  assert.throws(
    () => resolveLocalEngineUrl("//evil.example/collect", apiBase, localAgent),
    /untrusted external URL/,
  );
  assert.throws(
    () => resolveLocalEngineUrl("http://192.168.1.10:8080/collect", apiBase, localAgent),
    /untrusted external URL/,
  );
  assert.equal(
    resolveLocalEngineUrl(localAgent + "/engine/api/v1/workspace/projects/demo/world", apiBase, localAgent),
    localAgent + "/engine/api/v1/workspace/projects/demo/world",
  );
});

test("Local project recovery snapshots preserve pending edits without binary payloads", () => {
  const storage = new MemoryStorage();
  const project = {
    id: "world-1",
    name: "Offline World",
    _remoteVersion: 7,
    _pendingLocalRecovery: true,
    scene: { objects: [{ id: "beacon", name: "Recovered beacon" }] },
    assets: [{ id: "asset-1", name: "tree.glb", type: "glb", size: 2048, blob: new Blob(["not persisted"]) }],
    revisions: [{ version: 1 }],
  };

  assert.equal(writeProjectRecovery(storage, "creator-1", project, { pending: true, remoteVersion: 7 }), true);
  const recovered = readProjectRecovery(storage, "creator-1", "world-1");
  assert.equal(recovered.pending, true);
  assert.equal(recovered.remote_version, 7);
  assert.equal(recovered.project.scene.objects[0].name, "Recovered beacon");
  assert.equal(recovered.project.assets[0].name, "tree.glb");
  assert.equal("blob" in recovered.project.assets[0], false);
  assert.deepEqual(recovered.project.revisions, []);
  assert.equal(listProjectRecoveries(storage, "creator-1").length, 1);
  assert.equal(readProjectRecovery(storage, "other-user", "world-1"), null);

  assert.equal(removeProjectRecovery(storage, "creator-1", "world-1"), true);
  assert.equal(readProjectRecovery(storage, "creator-1", "world-1"), null);
});

test("project API documents omit local recovery bookkeeping", async () => {
  const workspace = await readComponent("NexoraFoundryWorkspace.jsx");
  assert.match(workspace, /_pendingLocalRecovery[\s\S]*?_recoveryConflict[\s\S]*?\.\.\.document/);
  assert.match(workspace, /writeProjectRecovery\(localStorage, storageUserId, project/);
  assert.match(workspace, /listProjectRecoveries\(localStorage, storageUserId\)/);
  assert.match(workspace, /expected_version: Number\(row.version \|\| 1\)/);
  assert.match(workspace, /activeProject\?\._recoveryConflict/);
  assert.match(workspace, /project\._recoveryConflict && previous\?\.remote_version/);
  assert.match(workspace, /APPLY BROWSER RECOVERY COPY/);
  assert.ok(workspace.indexOf("resolveLocalEngineUrl(input, API_BASE, LOCAL_AGENT_BASE)") < workspace.indexOf('headers.set("Authorization", "Bearer " + token)'));
});


test("Pending device recovery survives an offline browser reload", async () => {
  const workspace = await readComponent("NexoraFoundryWorkspace.jsx");
  assert.match(workspace, /const pending = Boolean\(previous\?\.pending\) \|\|/);
  assert.match(workspace, /_offlineRecovery: true/);
  assert.match(workspace, /if \(recovery\?\.pending && recovery\.project\)/);
});

test("Keep-device-version action only clears recovery after authoritative data loads", async () => {
  const workspace = await readComponent("NexoraFoundryWorkspace.jsx");
  const handler = workspace.slice(
    workspace.indexOf("const resolveProjectRecoveryConflict"),
    workspace.indexOf("const quickAction", workspace.indexOf("const resolveProjectRecoveryConflict")),
  );
  const listProjects = handler.indexOf('apiRequest("/api/v1/workspace/projects")');
  const findProject = handler.indexOf("if (!row)");
  const fetchAssets = handler.indexOf('/assets`');
  const writeRecovery = handler.indexOf("writeProjectRecovery(localStorage, storageUserId, latest");
  assert.ok(listProjects >= 0);
  assert.ok(findProject > listProjects);
  assert.ok(fetchAssets > findProject);
  assert.ok(writeRecovery > fetchAssets);
  assert.match(handler, /catch \(error\)[\s\S]*browser recovery copy has been kept/);
});


test("NEXORA desktop sidebar occupies its own responsive layout column", async () => {
  const shell = await readComponent("NexoraStudioShell.jsx");
  assert.match(shell, /lg:grid/);
  assert.match(shell, /gridTemplateColumns: collapsed \? "76px minmax\(0, 1fr\)" : "230px minmax\(0, 1fr\)"/);
  assert.match(shell, /lg:sticky lg:top-0 lg:col-start-1/);
  assert.match(shell, /lg:col-start-2 lg:row-start-1/);
  assert.doesNotMatch(shell, /fixed inset-y-0 left-0 z-40/);
});

test("Local Agent pairing is code-free and requires a signed-in user's explicit approval", async () => {
  const bridge = await readComponent("NexoraDeviceBridge.jsx");
  assert.doesNotMatch(bridge, /pairCode|setPairCode|One-time local pairing code|8-digit code shown/);
  assert.match(bridge, /consent: true/);
  assert.match(bridge, /account_access_token: accountAccessToken/);
  assert.match(bridge, /Allow & connect this computer/);
  assert.match(bridge, /disabled=\{busy \|\| !agentReachable \|\| Boolean\(token\) \|\| !accountAccessToken\}/);
});



test("Asset Library displays the server-installed toolchain and persistent workspace readiness", async () => {
  const workspace = await readComponent("NexoraFoundryWorkspace.jsx");
  const panel = await readComponent("NexoraManagedComputeStatus.jsx");
  assert.match(workspace, /NexoraManagedComputeStatus accountAccessToken/);
  for (const tool of ["blender", "godot", "ffmpeg", "ffprobe", "java", "adb", "android_sdk"]) {
    assert.ok(panel.includes('"'+tool+'"'));
  }
  assert.ok(panel.includes("/api/compute/capabilities"));
  assert.ok(panel.includes("Persistent workspace volume is mounted and writable."));
  assert.ok(panel.includes("Tool readiness is not job-execution readiness"));
});

test("Signed-in users get a server-only toolchain check before pairing the local device", async () => {
  const bridge = await readComponent("NexoraDeviceBridge.jsx");
  assert.ok(bridge.includes("requestManagedPlan(null, workloadProfile, false)"));
  assert.ok(bridge.includes("The default placement check sends no local device information"));
  assert.ok(bridge.includes("SERVER-MANAGED PRODUCTION TOOLCHAIN"));
  assert.ok(bridge.includes("Local device metrics: not shared. Local capacity is treated as unknown."));
  assert.ok(bridge.includes("LOCAL DEVICE BRIDGE NOT CONNECTED · OPTIONAL"));
  assert.ok(bridge.includes('navigator.permissions.query({ name: "loopback-network" })'));
  assert.ok(bridge.includes("installerRelease.url"));
  assert.ok(bridge.includes("job execution are not enabled yet"));
});


test("Device Lab sends local resource metrics only after explicit consent", async () => {
  const bridge = await readComponent("NexoraDeviceBridge.jsx");
  assert.match(bridge, /shareHardwareMetrics, setShareHardwareMetrics/);
  assert.match(bridge, /consent_to_share_hardware_metrics: metricsShared/);
  assert.match(bridge, /local_profile: metricsShared \? systemProfile : \{\}/);
  assert.match(bridge, /setHardwareMetricsConsent/);
  assert.match(bridge, /No file paths, device IDs, project files or source media are included/);
  assert.match(bridge, /job execution are not enabled yet/);
  assert.doesNotMatch(bridge, /Hardware details remain local; only the final game build/);
});

test("Local Agent installation is user-friendly and discovery retries automatically after install", async () => {
  const bridge = await readComponent("NexoraDeviceBridge.jsx");
  assert.ok(bridge.includes("const checkAgent = useCallback"));
  assert.ok(bridge.includes("api.github.com/repos/musombi123/Procedural-Game-Foundry/releases/latest"));
  assert.ok(bridge.includes("starts it automatically when you sign in again"));
  assert.ok(bridge.includes("No Git, Python, terminal or pasted commands are required"));
  assert.ok(bridge.includes("attempts < 18"));
  assert.ok(bridge.includes("window.setTimeout"));
  assert.ok(bridge.includes("Check again"));
  assert.ok(!bridge.includes("Copy PowerShell install command"));
  assert.ok(!bridge.includes("install-nexora-local-agent.ps1"));
  assert.ok(!bridge.includes("Set-ExecutionPolicy"));
  assert.ok(!bridge.includes("git clone"));
});


test("NEXORA gates Local Agent discovery on Chrome Loopback Network permission", async () => {
  const [bridge, workspace] = await Promise.all([
    readComponent("NexoraDeviceBridge.jsx"),
    readComponent("NexoraFoundryWorkspace.jsx"),
  ]);
  assert.ok(bridge.includes('navigator.permissions.query({ name: "loopback-network" })'));
  assert.ok(bridge.includes('if (permissionStatus.state === "granted")'));
  assert.ok(bridge.includes("Do not trigger Chrome's local-network permission prompt on page load."));
  assert.ok(bridge.includes('targetAddressSpace: "loopback"'));
  assert.ok(bridge.includes('loopbackPermission !== "granted"'));
  assert.ok(bridge.includes("Loopback Network"));
  assert.equal((workspace.match(/targetAddressSpace: "loopback"/g) || []).length, 3);
});


test("Device Lab only offers the Windows installer after a signed release asset is published", async () => {
  const bridge = await readComponent("NexoraDeviceBridge.jsx");
  assert.ok(bridge.includes("releases/latest"));
  assert.ok(bridge.includes('item?.name === "NEXORA-Local-Agent-Setup.exe"'));
  assert.ok(bridge.includes('state: "not_published"'));
  assert.ok(bridge.includes('installerRelease.state === "available" && <a href={installerRelease.url}'));
  assert.ok(bridge.includes("The signed Windows installer is not published yet."));
  assert.ok(bridge.includes("Check release"));
});


test("Managed Toolchain separates core workload tools from optional Android SDK readiness", async () => {
  const panel = await readComponent("NexoraManagedComputeStatus.jsx");
  assert.match(panel, /core_toolchain_ready \?\? status\?\.toolchain_ready/);
  assert.match(panel, /workloadCapabilities\[key\]/);
  assert.match(panel, /procedural_3d/);
  assert.match(panel, /movie_processing/);
  assert.match(panel, /android_export/);
  assert.match(panel, /Android export is optional/);
  assert.match(panel, /absence does not disable 3D or movie-processing tools/);
  assert.match(panel, /Tool readiness is not job-execution readiness/);
  assert.match(panel, /Secure project transfer, durable remote job submission and artifact retrieval remain disabled/);
});

test("Android SDK and ADB are displayed as optional capabilities, not core toolchain failures", async () => {
  const panel = await readComponent("NexoraManagedComputeStatus.jsx");
  assert.match(panel, /\["adb", "ADB", true\]/);
  assert.match(panel, /\["android_sdk", "Android SDK", true\]/);
  assert.match(panel, /\["blender", "Blender", false\]/);
  assert.match(panel, /\["godot", "Godot 4", false\]/);
});
