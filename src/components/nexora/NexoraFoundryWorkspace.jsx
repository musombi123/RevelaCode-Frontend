import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  Activity, ArrowDownToLine, Box, Check, ChevronRight, CircleHelp, Code2,
  FilePlus2, FolderOpen, Gamepad2, HardDrive, ImagePlus, Layers3, Loader2,
  MoreHorizontal, Play, Plus, RefreshCw, Save, Settings2, ShieldCheck,
  Sparkles, Trash2, UploadCloud, WandSparkles, X
} from "lucide-react";

const STORAGE_KEY = "nexora.foundry.projects.v1";
const ACTIVE_KEY = "nexora.foundry.active-project.v1";
const DB_NAME = "nexora-foundry-assets";
const DB_STORE = "files";
const API_BASE = String(import.meta.env.VITE_NEXORA_API_URL || "").replace(/\/$/, "");

const makeId = (prefix = "item") => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

function createProject(name = "Untitled Game") {
  const id = makeId("project");
  return {
    schemaVersion: 1,
    id,
    name,
    description: "",
    createdAt: now(),
    updatedAt: now(),
    engine: "Godot 4",
    settings: { target: "Desktop", orientation: "Landscape", renderPipeline: "Forward+" },
    scene: {
      id: makeId("scene"),
      name: "Main Scene",
      objects: [
        { id: makeId("object"), name: "World", type: "Node3D", position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
        { id: makeId("object"), name: "Player Start", type: "Marker3D", position: [0, 1, 4], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
        { id: makeId("object"), name: "Directional Light", type: "DirectionalLight3D", position: [0, 6, 0], rotation: [-45, 35, 0], scale: [1, 1, 1], visible: true },
      ],
    },
    assets: [],
    gameplay: { enemies: [], mechanics: [], objectives: [] },
    build: { lastBuildAt: null, lastBuildStatus: "not_started", artifacts: [] },
    revisions: [],
  };
}

function readProjects() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id && item.scene) : [];
  } catch { return []; }
}

function openAssetDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("This browser does not support local asset storage."));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open asset storage."));
  });
}

async function storeAsset(file, projectId, assetId) {
  const db = await openAssetDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put({ blob: file, name: file.name, type: file.type, size: file.size, projectId }, assetId);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("Asset could not be stored.")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("Asset storage transaction was aborted.")); };
  });
}

async function removeStoredAsset(assetId) {
  const db = await openAssetDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(assetId);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("Stored asset could not be removed.")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("Asset removal transaction was aborted.")); };
  });
}

function workspaceProjectFromCloud(row, assets = []) {
  const document = row.document && typeof row.document === "object" ? row.document : {};
  return {
    ...document,
    id: String(row.id),
    name: String(row.name || document.name || "Untitled Game"),
    description: String(row.description || document.description || ""),
    createdAt: row.created_at || document.createdAt || now(),
    updatedAt: row.updated_at || document.updatedAt || now(),
    _remoteVersion: Number(row.version || 1),
    assets,
    revisions: Array.isArray(document.revisions) ? document.revisions : [],
  };
}

function workspaceProjectDocument(project) {
  const {
    _remoteVersion,
    _localOnly,
    assets,
    revisions,
    createdAt,
    updatedAt,
    ...document
  } = project;
  return { ...document, assets: [], revisions: [] };
}

function cloudAssetFromApi(asset) {
  const extension = String(asset.filename || "").split(".").pop()?.toLowerCase() || "file";
  return {
    id: asset.id, name: asset.filename, type: extension,
    mimeType: asset.content_type, size: Number(asset.size || 0),
    addedAt: asset.created_at || now(), status: asset.status, remote: true,
  };
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "scene", label: "Scene editor", icon: Layers3 },
  { id: "assets", label: "Asset factory", icon: Box },
  { id: "gameplay", label: "Gameplay", icon: Gamepad2 },
  { id: "build", label: "Build centre", icon: Code2 },
];

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const panelClass = "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

function StatusPill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${tones[tone] || tones.slate}`}>{children}</span>;
}

function Metric({ label, value, helper }) {
  return <div className={`${panelClass} p-4`}><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{helper}</p></div>;
}

export default function NexoraFoundryWorkspace() {
  const auth = useAuth() || {};
  const accessToken = auth.getAccessToken?.() || "";
  const tokenType = auth.getTokenType?.() || "Bearer";
  const authenticatedCloudSession = Boolean(accessToken && !auth.isGuest && !auth.loading);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [projects, setProjects] = useState(readProjects);
  const [activeId, setActiveId] = useState(() => localStorage.getItem(ACTIVE_KEY) || "");
  const [tab, setTab] = useState("overview");
  const [jobs, setJobs] = useState([]);
  const cloudBaseline = useRef(new Map());
  const cloudSaveTimer = useRef(null);
  const [selectedObjectId, setSelectedObjectId] = useState("");
  const [apiStatus, setApiStatus] = useState({ state: API_BASE ? "checking" : "not_configured", label: API_BASE ? "Checking NEXORA service" : "API not connected" });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);
  const activeProject = projects.find((item) => item.id === activeId) || projects[0] || null;
  const selectedObject = activeProject?.scene.objects.find((item) => item.id === selectedObjectId) || activeProject?.scene.objects[0] || null;
  const cloudMode = Boolean(API_BASE && authenticatedCloudSession && cloudLoaded);
  const cloudProjectActive = Boolean(cloudMode && activeProject?._remoteVersion);

  const apiRequest = useCallback(async (path, options = {}) => {
    if (!API_BASE) throw new Error("NEXORA API URL is not configured.");
    if (!accessToken || auth.isGuest) throw new Error("Sign in with a verified RevelaCode account to use NEXORA cloud storage.");
    const headers = new Headers(options.headers || {});
    if (options.body && !(typeof FormData !== "undefined" && options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    const authenticatedFetch = typeof auth.authFetch === "function" ? auth.authFetch : fetch;
    if (authenticatedFetch === auth.authFetch) {
      // AuthContext performs the platform's single refresh retry and always
      // reads the current token at request time.
      headers.delete("Authorization");
    } else {
      headers.set("Authorization", `${tokenType || "Bearer"} ${String(accessToken).replace(/^Bearer\\s+/i, "")}`);
    }
    const response = await authenticatedFetch(`${API_BASE}${path}`, { ...options, headers, cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.detail;
      throw new Error(typeof detail === "string" ? detail : detail?.message || payload?.message || `NEXORA request failed (HTTP ${response.status}).`);
    }
    return payload;
  }, [accessToken, auth.authFetch, auth.isGuest, tokenType]);

  useEffect(() => {
    if (!API_BASE || auth.loading) return undefined;
    if (!authenticatedCloudSession) {
      setCloudLoaded(false);
      setApiStatus({ state: "auth_required", label: "Sign in to connect NEXORA cloud" });
      return undefined;
    }
    let cancelled = false;
    setApiStatus({ state: "checking", label: "Connecting secure NEXORA workspace" });
    (async () => {
      const response = await apiRequest("/api/v1/workspace/projects");
      const rows = Array.isArray(response.projects) ? response.projects : [];
      const hydrated = await Promise.all(rows.map(async (row) => {
        let assets = [];
        try {
          const assetResponse = await apiRequest(`/api/v1/workspace/projects/${row.id}/assets`);
          assets = (assetResponse.assets || []).map(cloudAssetFromApi);
        } catch {
          // Project metadata remains usable while an asset listing is retried.
        }
        const project = workspaceProjectFromCloud(row, assets);
        cloudBaseline.current.set(project.id, JSON.stringify(workspaceProjectDocument(project)));
        return project;
      }));
      if (cancelled) return;
      // Keep unsynced projects created by earlier browser-only workspace builds.
      // Do not pull previously cloud-versioned records from another account into
      // this user's workspace.
      const cloudIds = new Set(hydrated.map((item) => item.id));
      const localOnly = readProjects()
        .filter((item) => !item._remoteVersion && !cloudIds.has(item.id))
        .map((item) => ({ ...item, _localOnly: true }));
      const visibleProjects = [...hydrated, ...localOnly];
      setProjects(visibleProjects);
      setActiveId((current) => visibleProjects.some((item) => item.id === current)
        ? current
        : hydrated[0]?.id || localOnly[0]?.id || "");
      setCloudLoaded(true);
      setApiStatus({ state: "online", label: "NEXORA API, PostgreSQL and private asset storage connected" });
    })().catch((error) => {
      if (!cancelled) {
        setCloudLoaded(false);
        setApiStatus({ state: "offline", label: error.message || "NEXORA cloud workspace unavailable" });
        setNotice(error.message || "Could not load NEXORA cloud projects.");
      }
    });
    return () => { cancelled = true; };
  }, [auth.loading, authenticatedCloudSession, apiRequest]);

  useEffect(() => {
    // Retain only device-only drafts in browser storage. Cloud-owned project
    // documents remain authoritative in PostgreSQL and aren't copied on logout.
    const localProjects = projects.filter((item) => !item._remoteVersion);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(localProjects)); } catch { setNotice("Browser storage is full. Export this project to keep a portable copy."); }
  }, [projects]);

  useEffect(() => {
    if (activeProject?.id) {
      setActiveId(activeProject.id);
      if (!cloudMode && !activeProject._remoteVersion) localStorage.setItem(ACTIVE_KEY, activeProject.id);
      if (!selectedObjectId || !activeProject.scene.objects.some((item) => item.id === selectedObjectId)) {
        setSelectedObjectId(activeProject.scene.objects[0]?.id || "");
      }
    } else {
      setActiveId("");
      if (!cloudMode) localStorage.removeItem(ACTIVE_KEY);
    }
  }, [activeProject?.id, cloudMode]);

  const patchProject = useCallback((updater) => {
    if (!activeProject) return;
    setProjects((current) => current.map((project) => {
      if (project.id !== activeProject.id) return project;
      const next = typeof updater === "function" ? updater(project) : { ...project, ...updater };
      return { ...next, updatedAt: now() };
    }));
  }, [activeProject?.id]);

  const migrateLocalProject = async () => {
    if (!cloudMode || !activeProject?._localOnly) return;
    const localId = activeProject.id;
    const baseDocument = workspaceProjectDocument(activeProject);
    const cleanDocument = {
      ...baseDocument,
      assets: [],
      revisions: [],
      scene: {
        ...baseDocument.scene,
        objects: (baseDocument.scene?.objects || []).map(({ asset_id, ...object }) => object),
      },
    };
    try {
      const saved = await apiRequest("/api/v1/workspace/projects", {
        method: "POST",
        body: JSON.stringify({
          name: activeProject.name,
          description: activeProject.description,
          document: cleanDocument,
        }),
      });
      const remoteProject = workspaceProjectFromCloud(saved, []);
      cloudBaseline.current.set(remoteProject.id, JSON.stringify(workspaceProjectDocument(remoteProject)));
      setProjects((current) => current.map((item) => item.id === localId ? remoteProject : item));
      setActiveId(remoteProject.id);
      setSelectedObjectId(remoteProject.scene.objects[0]?.id || "");
      setNotice("Project metadata migrated to NEXORA PostgreSQL. Re-upload the original GLB/media files to private cloud storage; browser-only binary assets are not copied by this migration.");
    } catch (error) {
      setNotice(error.message || "Could not migrate this device-only project to NEXORA cloud.");
    }
  };

  const createNewProject = async () => {
    const name = window.prompt("Name your new game project", "Untitled Game");
    if (name === null) return;
    const project = createProject(name.trim() || "Untitled Game");
    if (API_BASE && authenticatedCloudSession) {
      if (!cloudLoaded) {
        setNotice("The cloud workspace has not finished loading. Retry after the secure connection is ready.");
        return;
      }
      try {
        const saved = await apiRequest("/api/v1/workspace/projects", {
          method: "POST",
          body: JSON.stringify({ name: project.name, description: project.description, document: workspaceProjectDocument(project) }),
        });
        const remoteProject = workspaceProjectFromCloud(saved, []);
        cloudBaseline.current.set(remoteProject.id, JSON.stringify(workspaceProjectDocument(remoteProject)));
        setProjects((current) => [remoteProject, ...current]);
        setActiveId(remoteProject.id);
        setSelectedObjectId(remoteProject.scene.objects[0]?.id || "");
        setTab("scene");
        setNotice("Project created in NEXORA PostgreSQL cloud storage.");
        return;
      } catch (error) {
        setNotice(error.message || "Cloud project creation failed.");
        return;
      }
    }
    setProjects((current) => [project, ...current]);
    setActiveId(project.id);
    setSelectedObjectId(project.scene.objects[0]?.id || "");
    setTab("scene");
  };

  const deleteProject = async () => {
    if (!activeProject || !window.confirm(`Delete "${activeProject.name}" from ${cloudProjectActive ? "NEXORA cloud storage" : "this browser"}?`)) return;
    if (cloudProjectActive) {
      try {
        await apiRequest(`/api/v1/workspace/projects/${activeProject.id}`, { method: "DELETE" });
        cloudBaseline.current.delete(activeProject.id);
        setNotice("Cloud project, private assets and artifacts were deleted.");
      } catch (error) {
        setNotice(error.message || "Could not delete cloud project.");
        return;
      }
    } else if (!activeProject._remoteVersion) {
      try {
        for (const asset of activeProject.assets || []) {
          if (!asset.remote) await removeStoredAsset(asset.id);
        }
      } catch (error) {
        setNotice(error.message || "Could not clean local project assets.");
        return;
      }
    }
    setProjects((current) => current.filter((project) => project.id !== activeProject.id));
    setSelectedObjectId("");
  };

  const addSceneObject = () => {
    const object = { id: makeId("object"), name: "New Mesh", type: "MeshInstance3D", position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true };
    patchProject((project) => ({ ...project, scene: { ...project.scene, objects: [...project.scene.objects, object] } }));
    setSelectedObjectId(object.id);
  };

  const updateSelected = (field, value) => {
    if (!selectedObject) return;
    patchProject((project) => ({
      ...project,
      scene: { ...project.scene, objects: project.scene.objects.map((item) => item.id === selectedObject.id ? { ...item, [field]: value } : item) },
    }));
  };

  const validateProject = () => {
    const issues = [];
    if (!activeProject?.name?.trim()) issues.push("Project name is required.");
    if (!activeProject?.scene?.objects?.length) issues.push("Add at least one scene node.");
    if ((activeProject?.scene?.objects || []).length > 500) issues.push("Scene exceeds the 500-node workspace safety limit.");
    for (const object of activeProject?.scene?.objects || []) {
      if (!object.name?.trim()) issues.push(`Node ${object.id} has no name.`);
      for (const vector of ["position", "rotation", "scale"]) {
        if (!Array.isArray(object[vector]) || object[vector].length !== 3 || object[vector].some((n) => !Number.isFinite(Number(n)))) {
          issues.push(`${object.name || object.id}: invalid ${vector} values.`);
        }
      }
    }
    return issues;
  };

  const saveRevision = () => {
    if (!activeProject) return;
    patchProject((project) => ({ ...project, revisions: [...(project.revisions || []), { id: makeId("revision"), createdAt: now(), snapshot: { ...JSON.parse(JSON.stringify(project)), revisions: [] } }].slice(-20) }));
    setNotice("Revision checkpoint saved in this browser.");
  };

  const importProject = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Project files are limited to 10 MB.");
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || !parsed.scene || !Array.isArray(parsed.scene.objects)) throw new Error("This file is not a supported NEXORA project.");
      if (parsed.scene.objects.length > 500) throw new Error("Imported scenes are limited to 500 nodes.");
      const validObjects = parsed.scene.objects.every((object) =>
        object && typeof object === "object" &&
        typeof object.name === "string" &&
        ["position", "rotation", "scale"].every((key) =>
          Array.isArray(object[key]) && object[key].length === 3 &&
          object[key].every((value) => Number.isFinite(Number(value)))
        )
      );
      if (!validObjects) throw new Error("The project contains invalid scene node transforms or names.");
      const imported = {
        ...parsed,
        id: makeId("project"),
        schemaVersion: 1,
        updatedAt: now(),
        scene: {
          ...parsed.scene,
          id: makeId("scene"),
          objects: parsed.scene.objects.map((object) => ({ ...object, id: makeId("object") })),
        },
        assets: Array.isArray(parsed.assets) ? parsed.assets.slice(0, 1000).map((asset) => ({ ...asset, id: makeId("asset"), status: "metadata_only" })) : [],
        gameplay: {
          enemies: Array.isArray(parsed.gameplay?.enemies) ? parsed.gameplay.enemies : [],
          mechanics: Array.isArray(parsed.gameplay?.mechanics) ? parsed.gameplay.mechanics : [],
          objectives: Array.isArray(parsed.gameplay?.objectives) ? parsed.gameplay.objectives : [],
        },
        settings: parsed.settings && typeof parsed.settings === "object" ? parsed.settings : { target: "Desktop", orientation: "Landscape", renderPipeline: "Forward+" },
        revisions: [],
      };
      if (cloudMode) {
        // A .nexora.json file contains project metadata, not the private binary
        // assets. Strip old asset bindings and ask the creator to upload assets
        // again so no foreign object key can be reused.
        const cloudImport = {
          ...imported,
          assets: [],
          scene: {
            ...imported.scene,
            objects: imported.scene.objects.map(({ asset_id, ...object }) => object),
          },
        };
        const saved = await apiRequest("/api/v1/workspace/projects", {
          method: "POST",
          body: JSON.stringify({
            name: cloudImport.name,
            description: cloudImport.description,
            document: workspaceProjectDocument(cloudImport),
          }),
        });
        const remoteProject = workspaceProjectFromCloud(saved, []);
        cloudBaseline.current.set(remoteProject.id, JSON.stringify(workspaceProjectDocument(remoteProject)));
        setProjects((current) => [remoteProject, ...current]);
        setActiveId(remoteProject.id);
        setSelectedObjectId(remoteProject.scene.objects[0]?.id || "");
        setTab("scene");
        setNotice("Project definition imported into PostgreSQL. Re-upload its original GLB and media files to the private NEXORA bucket.");
        return;
      }
      setProjects((current) => [imported, ...current]);
      setActiveId(imported.id);
      setSelectedObjectId(imported.scene.objects[0]?.id || "");
      setTab("scene");
      setNotice("Project imported into this browser. Sign in to move it into private NEXORA cloud storage.");
    } catch (error) { setNotice(error.message || "Could not import project."); }
  };

  const uploadAssets = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || !activeProject) return;
    setBusy(true);
    try {
      const accepted = [];
      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase();
        if (!["glb", "png", "jpg", "jpeg", "webp", "wav", "ogg", "mp3"].includes(extension)) continue;
        if (file.size > 100 * 1024 * 1024) {
          setNotice(`Skipped ${file.name}: each asset must be 100 MB or smaller.`);
          continue;
        }
        if (cloudProjectActive) {
          const contentTypes = {
            glb: "model/gltf-binary", png: "image/png",
            jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
            wav: "audio/wav", ogg: "audio/ogg", mp3: "audio/mpeg",
          };
          const contentType = contentTypes[extension];
          const intent = await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/assets/upload-url`, {
            method: "POST",
            body: JSON.stringify({ filename: file.name, content_type: contentType, size: file.size }),
          });
          const upload = await fetch(intent.upload_url, {
            method: "PUT",
            headers: intent.headers || { "Content-Type": contentType },
            body: file,
          });
          if (!upload.ok) throw new Error(`Private asset upload failed for ${file.name} (HTTP ${upload.status}).`);
          const completed = await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/assets/${intent.asset_id}/complete`, { method: "POST" });
          accepted.push({
            id: completed.asset_id, name: file.name, type: extension, mimeType: contentType,
            size: completed.size, addedAt: now(), status: completed.status, remote: true,
          });
        } else {
          const asset = { id: makeId("asset"), name: file.name, type: extension, mimeType: file.type || "application/octet-stream", size: file.size, addedAt: now(), status: "ingested_local" };
          await storeAsset(file, activeProject.id, asset.id);
          accepted.push(asset);
        }
      }
      if (accepted.length) {
        patchProject((project) => ({ ...project, assets: [...project.assets, ...accepted] }));
        setNotice(cloudProjectActive
          ? `${accepted.length} asset(s) uploaded to private NEXORA object storage.`
          : `${accepted.length} asset(s) ingested into this browser's private local storage.`);
      } else setNotice("No supported assets found. Accepted: GLB, images and audio (maximum 100 MB each).");
    } catch (error) { setNotice(error.message || "Asset ingestion failed."); }
    finally { setBusy(false); }
  };

  const removeAsset = async (asset) => {
    try {
      if (cloudMode && asset.remote) {
        await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/assets/${asset.id}`, { method: "DELETE" });
      } else {
        await removeStoredAsset(asset.id);
      }
      patchProject((project) => ({ ...project, assets: project.assets.filter((item) => item.id !== asset.id) }));
      setNotice(`Removed ${asset.name} from ${cloudMode ? "private cloud storage" : "this browser"}.`);
    } catch (error) {
      setNotice(error.message || "Could not remove the stored asset.");
    }
  };

  const processAsset = async (asset) => {
    if (!cloudMode || !asset.remote) {
      setNotice("Blender processing requires an authenticated NEXORA cloud workspace and a registered build worker.");
      return;
    }
    try {
      const result = await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/assets/${asset.id}/process`, { method: "POST" });
      setNotice(`Blender job queued: ${result.job_id}. Track it in Build centre.`);
      setTab("build");
      await refreshJobs();
    } catch (error) {
      setNotice(error.message || "Could not queue Blender asset processing.");
    }
  };

  const refreshJobs = useCallback(async () => {
    if (!cloudProjectActive || !activeProject) return;
    try {
      const response = await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/jobs`);
      const nextJobs = await Promise.all((response.jobs || []).map(async (job) => {
        if (job.state !== "completed") return job;
        try {
          const downloads = await apiRequest(`/api/v1/workspace/jobs/${job.id}/artifacts`);
          return { ...job, artifacts: downloads.artifacts || [] };
        } catch { return job; }
      }));
      setJobs(nextJobs);
    } catch (error) {
      setNotice(error.message || "Could not refresh production job status.");
    }
  }, [activeProject?.id, apiRequest, cloudProjectActive]);

  const queueProductionJob = async (kind, target = "desktop") => {
    if (!cloudProjectActive || !activeProject) {
      setNotice("Select a cloud-synced project before queueing Godot production jobs.");
      return;
    }
    const issues = validateProject();
    if (issues.length) {
      setNotice(issues.join(" "));
      return;
    }
    try {
      const result = await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/jobs`, {
        method: "POST",
        body: JSON.stringify({ kind, target }),
      });
      setNotice(`Queued ${kind} job ${result.job_id}. A dedicated Blender/Godot worker must be online to execute it.`);
      await refreshJobs();
    } catch (error) {
      setNotice(error.message || "Could not queue the production job.");
    }
  };

  useEffect(() => {
    if (!cloudProjectActive || tab !== "build" || !activeProject) return undefined;
    refreshJobs();
    const timer = window.setInterval(refreshJobs, 5000);
    return () => window.clearInterval(timer);
  }, [activeProject?.id, cloudProjectActive, refreshJobs, tab]);

  useEffect(() => {
    if (!cloudMode || !cloudLoaded || !activeProject?._remoteVersion) return undefined;
    const projectId = activeProject.id;
    const document = workspaceProjectDocument(activeProject);
    const serialized = JSON.stringify(document);
    if (cloudBaseline.current.get(projectId) === serialized) return undefined;
    window.clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = window.setTimeout(async () => {
      try {
        const saved = await apiRequest(`/api/v1/workspace/projects/${projectId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: activeProject.name,
            description: activeProject.description,
            document,
            expected_version: activeProject._remoteVersion,
          }),
        });
        const updatedDocument = { ...document, id: saved.id };
        cloudBaseline.current.set(projectId, JSON.stringify(updatedDocument));
        setProjects((current) => current.map((item) =>
          item.id === projectId ? { ...item, _remoteVersion: saved.version, updatedAt: saved.updated_at } : item
        ));
        setApiStatus({ state: "online", label: "NEXORA cloud changes saved" });
      } catch (error) {
        setApiStatus({ state: "offline", label: error.message || "Cloud save failed" });
        setNotice(error.message || "Cloud autosave failed. Export a backup before continuing.");
      }
    }, 850);
    return () => window.clearTimeout(cloudSaveTimer.current);
  }, [activeProject?.id, activeProject?.updatedAt, activeProject?._remoteVersion, cloudLoaded, cloudMode, apiRequest]);

  const checkService = useCallback(async () => {
    if (!API_BASE) {
      setApiStatus({ state: "not_configured", label: "API not connected" });
      return;
    }
    setApiStatus({ state: "checking", label: "Checking NEXORA service" });
    try {
      const response = await fetch(`${API_BASE}/health/ready`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Health check returned HTTP ${response.status}`);
      setApiStatus({ state: "online", label: "NEXORA API and PostgreSQL/R2 ready" });
    } catch (error) {
      setApiStatus({ state: "offline", label: error.message || "NEXORA API or cloud dependency unavailable" });
    }
  }, []);

  useEffect(() => { checkService(); }, [checkService]);

  const validationIssues = useMemo(() => activeProject ? validateProject() : [], [activeProject]);
  const validationPassed = activeProject && validationIssues.length === 0;
  const exportProject = () => activeProject && downloadJson(activeProject, `${activeProject.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "nexora-project"}.nexora.json`);

  return (
    <div className="min-h-full min-w-0 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-3 pb-28 sm:p-5 lg:p-7 lg:pb-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-5 text-white shadow-xl sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-violet-200">NEXORA Interactive Studios</span><StatusPill tone="violet">Foundry workspace</StatusPill></div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Build worlds. Ship playable experiences.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">A creator workspace for game projects, editable scenes, private cloud asset intake, Blender processing, Godot generation and release preparation.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => importInputRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/15"><FolderOpen size={15}/> Import project</button>
            <button type="button" onClick={createNewProject} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-500 px-4 text-xs font-black text-white shadow-lg hover:bg-violet-400"><Plus size={16}/> New project</button>
            <input ref={importInputRef} type="file" accept=".json,.nexora.json,application/json" className="hidden" onChange={importProject}/>
          </div>
        </header>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"><Gamepad2 size={20}/></div>
            <div className="min-w-0"><p className="truncate text-sm font-black">{activeProject?.name || "No project selected"}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">{activeProject ? `Updated ${new Date(activeProject.updatedAt).toLocaleString()}` : "Create or import a project to begin"}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {projects.length > 1 && <select aria-label="Switch NEXORA project" className="min-h-10 max-w-[180px] rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" value={activeProject?.id || ""} onChange={(event) => setActiveId(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}{project._localOnly ? " · Device-only" : ""}</option>)}</select>}
            {activeProject?._localOnly && <StatusPill tone="amber">Device-only draft</StatusPill>}<StatusPill tone={apiStatus.state === "online" ? "green" : apiStatus.state === "checking" ? "amber" : "slate"}>{apiStatus.label}</StatusPill>
            <button type="button" className={buttonClass} onClick={checkService}><RefreshCw size={14}/> Check service</button>
            {cloudMode && activeProject?._localOnly && <button type="button" className={buttonClass} onClick={migrateLocalProject}><UploadCloud size={14}/> Move project to cloud</button>}
            {activeProject && <button type="button" className={buttonClass} onClick={exportProject}><ArrowDownToLine size={14}/> Export</button>}
            {activeProject && <button type="button" className={buttonClass} onClick={saveRevision}><Save size={14}/> Checkpoint</button>}
          </div>
        </div>

        {notice && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs leading-5 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-100"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={14}/></button></div>}

        <nav aria-label="NEXORA workspace sections" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-950">
          {TABS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${tab === id ? "bg-slate-950 text-white dark:bg-violet-500" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"}`}><Icon size={15}/>{label}</button>)}
        </nav>

        {!activeProject ? (
          <section className={`${panelClass} flex min-h-[320px] flex-col items-center justify-center p-8 text-center`}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"><Gamepad2 size={28}/></div>
            <h2 className="mt-5 text-xl font-black">Start your first game project</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Create a project to begin composing scenes, organizing creator assets and preparing a validated project package.</p>
            <button type="button" onClick={createNewProject} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white hover:bg-violet-500"><Plus size={16}/> Create project</button>
          </section>
        ) : (
          <>
            {tab === "overview" && <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Metric label="Scene nodes" value={activeProject.scene.objects.length} helper="Current scene hierarchy"/><Metric label="Creator assets" value={activeProject.assets.length} helper="Stored in this browser"/><Metric label="Gameplay systems" value={activeProject.gameplay.mechanics.length + activeProject.gameplay.enemies.length + activeProject.gameplay.objectives.length} helper="Planned project systems"/><Metric label="Project revisions" value={activeProject.revisions.length} helper="Local checkpoints"/></div>
              <div className="grid gap-4 xl:grid-cols-[1.4fr_.8fr]">
                <section className={`${panelClass} p-5`}><div className="flex items-center justify-between gap-3"><div><h2 className="font-black">Project configuration</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Core metadata and target settings</p></div><Settings2 size={18} className="text-slate-400"/></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Project name<input className={`${fieldClass} mt-1.5`} value={activeProject.name} onChange={(e) => patchProject({ name: e.target.value })}/></label><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Target platform<select className={`${fieldClass} mt-1.5`} value={activeProject.settings.target} onChange={(e) => patchProject((p) => ({...p, settings:{...p.settings,target:e.target.value}}))}><option>Desktop</option><option>Android</option><option>Desktop + Android</option></select></label><label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Project description<textarea className={`${fieldClass} mt-1.5 min-h-20`} value={activeProject.description} onChange={(e) => patchProject({ description: e.target.value })} placeholder="Describe the game world, player fantasy and core loop."/></label></div>
                </section>
                <section className={`${panelClass} p-5`}><h2 className="font-black">Production readiness</h2><div className="mt-4 space-y-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Project structure</span><StatusPill tone={validationPassed ? "green" : "amber"}>{validationPassed ? "Valid" : `${validationIssues.length} issues`}</StatusPill></div><div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Asset storage</span><StatusPill tone="green">Local ready</StatusPill></div><div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Cloud workspace</span><StatusPill tone={apiStatus.state === "online" ? "green" : "amber"}>{apiStatus.state === "online" ? "API reachable" : "Not connected"}</StatusPill></div><div className="rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500 dark:bg-slate-900 dark:text-slate-400">A reachable API does not yet mean cloud project storage or build workers are enabled. Project edits currently remain on this device.</div></div></section>
              </div>
              <section className={`${panelClass} p-5`}><div className="flex items-center justify-between"><h2 className="font-black">Recent project work</h2><button type="button" className="text-xs font-bold text-violet-600" onClick={() => setTab("scene")}>Open editor <ChevronRight size={14} className="inline"/></button></div><div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{activeProject.scene.objects.slice(0,5).map((object) => <div key={object.id} className="flex items-center gap-3 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900"><Box size={15}/></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{object.name}</span><span className="text-[10px] text-slate-500">{object.type}</span></span><StatusPill tone="green">In scene</StatusPill></div>)}</div></section>
            </div>}

            {tab === "scene" && <div className="grid min-w-0 gap-4 xl:grid-cols-[250px_minmax(0,1fr)_290px]">
              <section className={`${panelClass} min-w-0 p-3`}><div className="flex items-center justify-between gap-2 px-1"><h2 className="text-sm font-black">Scene hierarchy</h2><button type="button" onClick={addSceneObject} className="rounded-lg p-2 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40" aria-label="Add scene node"><Plus size={16}/></button></div><div className="mt-3 space-y-1">{activeProject.scene.objects.map((object) => <button key={object.id} type="button" onClick={() => setSelectedObjectId(object.id)} className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${selectedObject?.id === object.id ? "bg-violet-50 font-bold text-violet-800 dark:bg-violet-950/50 dark:text-violet-200" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"}`}><Box size={14}/><span className="truncate">{object.name}</span></button>)}</div></section>
              <section className={`${panelClass} flex min-h-[340px] min-w-0 flex-col overflow-hidden`}><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800"><div><h2 className="text-sm font-black">Scene preview</h2><p className="text-[10px] text-slate-500">Structural editor • Godot-oriented node model</p></div><StatusPill tone="amber">Preview only</StatusPill></div><div className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(139,92,246,.12),transparent_55%),linear-gradient(rgba(148,163,184,.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.10)_1px,transparent_1px)] bg-[size:auto,28px_28px,28px_28px]"><div className="absolute left-3 top-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">3D viewport placeholder</div><div className="flex flex-col items-center gap-4"><div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-violet-300/50 bg-violet-500/10 text-violet-600 shadow-[0_0_60px_rgba(139,92,246,.14)] dark:text-violet-300"><Box size={54}/></div><div className="text-center"><p className="text-sm font-black">{selectedObject?.name || "Select a scene node"}</p><p className="mt-1 text-[10px] text-slate-500">{selectedObject?.type || "No node selected"}</p></div></div></div><div className="flex flex-wrap gap-2 border-t border-slate-100 p-3 dark:border-slate-800"><button type="button" onClick={addSceneObject} className={buttonClass}><Plus size={14}/> Add node</button><button type="button" onClick={() => setNotice("A live Godot viewport will be enabled when the NEXORA editor runtime is connected.")} className={buttonClass}><Play size={14}/> Run preview</button></div></section>
              <section className={`${panelClass} min-w-0 p-4`}><h2 className="text-sm font-black">Inspector</h2>{selectedObject ? <div className="mt-4 space-y-3"><label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Node name<input className={`${fieldClass} mt-1.5`} value={selectedObject.name} onChange={(e) => updateSelected("name", e.target.value)}/></label><label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Node type<select className={`${fieldClass} mt-1.5`} value={selectedObject.type} onChange={(e) => updateSelected("type", e.target.value)}>{["Node3D","MeshInstance3D","CharacterBody3D","StaticBody3D","Area3D","Marker3D","Camera3D","DirectionalLight3D"].map((type) => <option key={type}>{type}</option>)}</select></label>{cloudProjectActive && <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Creator GLB model<select className={`${fieldClass} mt-1.5`} value={selectedObject.asset_id || ""} onChange={(e) => updateSelected("asset_id", e.target.value || null)}><option value="">Use procedural primitive</option>{activeProject.assets.filter((asset) => asset.remote && asset.type === "glb" && ["ready","processed"].includes(asset.status)).map((asset) => <option key={asset.id} value={asset.id}>{asset.name}{asset.status === "processed" ? " · Blender processed" : ""}</option>)}</select><span className="mt-1 block text-[10px] font-normal text-slate-500">Selected GLB files are copied into the Godot project and instantiated in the scene by the build worker.</span></label>}{["position","rotation","scale"].map((field) => <fieldset key={field}><legend className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">{field}</legend><div className="grid grid-cols-3 gap-1.5">{selectedObject[field].map((value,index) => <input key={index} aria-label={`${field} ${"XYZ"[index]}`} className={fieldClass} type="number" step="0.1" value={value} onChange={(e) => {const next=[...selectedObject[field]];next[index]=Number(e.target.value);updateSelected(field,next);}}/>)}</div></fieldset>)}<label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={selectedObject.visible !== false} onChange={(e) => updateSelected("visible",e.target.checked)}/> Visible</label><button type="button" className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => {patchProject((p)=>({...p,scene:{...p.scene,objects:p.scene.objects.filter((o)=>o.id!==selectedObject.id)}}));setSelectedObjectId("");}}><Trash2 size={14}/> Delete node</button></div> : <p className="mt-3 text-xs text-slate-500">Select a node to edit its properties.</p>}</section>
            </div>}

            {tab === "assets" && <div className="space-y-4">
              <section className={`${panelClass} p-5`}><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">Creator asset intake</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Bring your own 3D models, textures and audio into this project. Original files stay in this browser's IndexedDB storage.</p></div><button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={15}/> : <UploadCloud size={15}/>} Add assets</button><input ref={fileInputRef} type="file" multiple accept=".glb,.png,.jpg,.jpeg,.webp,.wav,.ogg,.mp3" className="hidden" onChange={uploadAssets}/></div><div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/50">Supported: GLB, glTF, PNG, JPG, WebP, WAV, OGG, MP3</div></section>
              <section className={`${panelClass} p-5`}><h2 className="font-black">Project assets <span className="ml-1 text-xs font-semibold text-slate-400">(${activeProject.assets.length})</span></h2>{activeProject.assets.length ? <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{activeProject.assets.map((asset)=><div key={asset.id} className="flex min-w-0 flex-wrap items-center gap-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"><ImagePlus size={16}/></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{asset.name}</p><p className="text-[10px] text-slate-500">{asset.type.toUpperCase()} • {(asset.size/1024/1024).toFixed(2)} MB</p></div><StatusPill tone={asset.status === "processed" || asset.status === "ready" ? "green" : "amber"}>{asset.remote ? asset.status : "Stored locally"}</StatusPill>{cloudMode && asset.remote && asset.type === "glb" && <button type="button" className={buttonClass} onClick={()=>processAsset(asset)}>Process with Blender</button>}<button type="button" aria-label={`Remove ${asset.name}`} onClick={()=>removeAsset(asset)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14}/></button></div>)}</div>:<p className="mt-3 text-xs text-slate-500">No assets added yet.</p>}</section>
            </div>}

            {tab === "gameplay" && <div className="grid gap-4 md:grid-cols-3"><section className={`${panelClass} p-5`}><h2 className="font-black">Enemies</h2><p className="mt-1 text-xs text-slate-500">Define enemy archetypes for later runtime integration.</p><button type="button" className={`${buttonClass} mt-4`} onClick={()=>patchProject((p)=>({...p,gameplay:{...p.gameplay,enemies:[...p.gameplay.enemies,{id:makeId("enemy"),name:`Enemy ${p.gameplay.enemies.length+1}`,behavior:"patrol"}]}}))}><Plus size={14}/> Add enemy</button>{activeProject.gameplay.enemies.map((enemy)=><div key={enemy.id} className="mt-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900"><p className="font-bold">{enemy.name}</p><p className="mt-1 text-slate-500">Behavior: {enemy.behavior}</p></div>)}</section><section className={`${panelClass} p-5`}><h2 className="font-black">Mechanics</h2><p className="mt-1 text-xs text-slate-500">Capture core player interactions and systems.</p><button type="button" className={`${buttonClass} mt-4`} onClick={()=>patchProject((p)=>({...p,gameplay:{...p.gameplay,mechanics:[...p.gameplay.mechanics,{id:makeId("mechanic"),name:`Mechanic ${p.gameplay.mechanics.length+1}`,status:"proposed"}]}}))}><Plus size={14}/> Add mechanic</button>{activeProject.gameplay.mechanics.map((item)=><div key={item.id} className="mt-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900"><p className="font-bold">{item.name}</p><p className="mt-1 text-slate-500">Status: {item.status}</p></div>)}</section><section className={`${panelClass} p-5`}><h2 className="font-black">Objectives</h2><p className="mt-1 text-xs text-slate-500">Plan mission and progression goals.</p><button type="button" className={`${buttonClass} mt-4`} onClick={()=>patchProject((p)=>({...p,gameplay:{...p.gameplay,objectives:[...p.gameplay.objectives,{id:makeId("objective"),name:`Objective ${p.gameplay.objectives.length+1}`,status:"draft"}]}}))}><Plus size={14}/> Add objective</button>{activeProject.gameplay.objectives.map((item)=><div key={item.id} className="mt-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900"><p className="font-bold">{item.name}</p><p className="mt-1 text-slate-500">Status: {item.status}</p></div>)}</section></div>}

            {tab === "build" && <div className="grid gap-4 xl:grid-cols-[1fr_340px]"><section className={`${panelClass} p-5`}><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"><Code2 size={19}/></div><div><h2 className="font-black">Build and release centre</h2><p className="text-xs text-slate-500">Godot scene generation and export queue</p></div></div><div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4 text-xs leading-5 text-violet-900 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200"><strong>Cloud worker pipeline.</strong> Requests are persisted in NEXORA PostgreSQL. A dedicated worker must be online with Blender, Godot 4 and platform export templates to execute them.</div><div className="mt-4 flex flex-wrap gap-2"><button type="button" className={buttonClass} onClick={()=>{const issues=validateProject();setNotice(issues.length?issues.join(" "):"Browser-side structural validation passed. This is not a Godot runtime test.");}}><ShieldCheck size={14}/> Validate document</button><button type="button" className={buttonClass} onClick={exportProject}><ArrowDownToLine size={14}/> Export JSON backup</button><button type="button" className={buttonClass} disabled={!cloudProjectActive} onClick={()=>queueProductionJob("scene.generate","desktop")}><Layers3 size={14}/> Generate Godot scene</button><button type="button" className={buttonClass} disabled={!cloudProjectActive} onClick={()=>queueProductionJob("build.export","desktop")}><Play size={14}/> Build desktop</button><button type="button" className={buttonClass} disabled={!cloudProjectActive} onClick={()=>queueProductionJob("build.export","android")}><ArrowDownToLine size={14}/> Build Android</button><button type="button" className={buttonClass} disabled={!cloudProjectActive} onClick={()=>queueProductionJob("build.export","desktop_android")}><Gamepad2 size={14}/> Build all targets</button></div><div className="mt-5 flex items-center justify-between gap-3"><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Production jobs</h3><button type="button" className={buttonClass} onClick={refreshJobs} disabled={!cloudMode}><RefreshCw size={13}/> Refresh</button></div>{cloudProjectActive && jobs.length ? <div className="mt-3 space-y-2">{jobs.map((job)=><div key={job.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold">{job.kind} · {job.id.slice(0,8)}</p><StatusPill tone={job.state === "completed" ? "green" : job.state === "failed" ? "amber" : "violet"}>{job.state} · {job.progress}%</StatusPill></div><p className="mt-1 text-[11px] text-slate-500">{job.message}</p>{job.error && <p className="mt-2 text-[11px] text-rose-600">{job.error}</p>}{job.artifacts?.map((artifact)=><a key={artifact.id} className="mt-2 mr-3 inline-flex text-xs font-bold text-violet-600 underline" href={artifact.download_url} target="_blank" rel="noreferrer">{artifact.filename}</a>)}</div>)}</div>:<p className="mt-3 text-xs text-slate-500">No production jobs yet.</p>}<div className="mt-5"><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Document validation</h3>{validationPassed?<p className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-600"><Check size={14}/> No structural issues detected</p>:<ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700 dark:text-amber-300">{validationIssues.map((issue,index)=><li key={index}>{issue}</li>)}</ul>}</div></section><section className={`${panelClass} p-5`}><h2 className="font-black">Service connection</h2><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">NEXORA verifies your RevelaCode session, then stores game project data in its own PostgreSQL database and private R2 bucket.</p><div className="mt-4 flex items-center gap-2 text-xs"><span className={`h-2 w-2 rounded-full ${apiStatus.state === "online" ? "bg-emerald-500" : apiStatus.state === "checking" ? "animate-pulse bg-amber-500" : "bg-slate-400"}`}/>{apiStatus.label}</div><p className="mt-3 text-[11px] text-slate-500">{cloudMode ? "Authenticated cloud session active." : "Cloud project operations require verified sign-in and a configured API."}</p><button type="button" onClick={checkService} className={`${buttonClass} mt-4 w-full`}><RefreshCw size={14}/> Check cloud readiness</button></section></div>}
          </>
        )}

        {activeProject && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] text-slate-400">{cloudProjectActive ? "PostgreSQL cloud autosave active" : "Local autosave active"}</span><span className={`h-1 w-1 rounded-full ${cloudProjectActive ? "bg-emerald-500" : "bg-amber-500"}`}/><span className="text-[10px] text-slate-400">{cloudProjectActive ? "Private R2 assets enabled" : activeProject._localOnly ? "Device-only project; move it to cloud when ready" : "Project data stays in this browser until cloud sign-in is ready"}</span></div><div className="flex gap-2"><button type="button" onClick={deleteProject} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 size={13}/> Delete project</button><button type="button" onClick={exportProject} className={buttonClass}><ArrowDownToLine size={13}/> Export .nexora.json</button></div></div>}
      </div>
    </div>
  );
}
