import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AndroidBuildConsole from "./AndroidBuildConsole.jsx";
import NexoraDeviceBridge from "./NexoraDeviceBridge.jsx";
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
const API_BASE = String(import.meta.env.VITE_NEXORA_API_URL || "https://nexora-foundry-api.onrender.com").replace(/\/$/, "");

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
  const [androidBuild, setAndroidBuild] = useState({ app_name: "NEXORA Game", package_id: "com.nexora.game", version_name: "1.0.0", version_code: 1, build_type: "debug", artifact_format: "apk", orientation: "landscape", internet_permission: true, camera_permission: false, microphone_permission: false, icon_asset_id: null });
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
      // Clear any previously hydrated account-owned projects from component
      // state on logout/account switch. Keep only device-only drafts.
      const deviceProjects = readProjects().filter((item) => !item._remoteVersion);
      setProjects(deviceProjects);
      setActiveId((current) => deviceProjects.some((item) => item.id === current)
        ? current
        : deviceProjects[0]?.id || "");
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

  const queueProductionJob = async (kind, target = "desktop", android = null) => {
    if (!cloudProjectActive || !activeProject) {
      setNotice("Select a cloud-synced project before queueing Godot production jobs.");
      return;
    }
    const issues = validateProject();
    if (issues.length) {
      setNotice(issues.join(" "));
      return;
    }
    if (android?.build_type === "release" && !window.confirm("Queue a signed release candidate? The worker must have a protected release keystore configured. This does not publish the game.")) return;
    try {
      const result = await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/jobs`, {
        method: "POST",
        body: JSON.stringify({ kind, target, ...(android ? { android } : {}) }),
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

  const studioAssets = activeProject?.assets || [];
  const pipelineRows = [["Video Intake","Source media",studioAssets.length?"Ready":"Waiting"],["Character Extraction","Characters & rigging",studioAssets.some(a=>a.type==="glb")?"Ready":"Waiting"],["Motion Capture","Motion cleanup","Waiting"],["World Builder","Environment generation","Waiting"],["Enemy AI","Behavior data",activeProject?.gameplay?.enemies?.length?"Ready":"Waiting"],["Quest Logic","Objectives & triggers",activeProject?.gameplay?.objectives?.length?"Ready":"Waiting"]];
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#070b10] text-slate-100">
      <div className="mx-auto flex max-w-[1900px] flex-col gap-2 p-2">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/50 bg-[#080d12] px-3 py-2">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center border border-cyan-400/50 bg-cyan-950/40 text-cyan-300"><Box size={25}/></div><div><div className="text-xl font-black tracking-[.16em]">NEXORA</div><div className="text-[9px] tracking-[.4em] text-cyan-300">STUDIO PRO</div></div></div>
          <nav className="flex flex-wrap justify-center gap-1">{["PROJECT","TIMELINE","BUILD","AI PIPELINE","PREVIEW","EXPORT","SETTINGS"].map((item,i)=><button key={item} type="button" onClick={()=>{if(i===0)setNotice("Project selector and project creation are available in the asset-library header.");if(i===2)queueProductionJob("scene.generate","desktop");if(i===3)setNotice("AI pipeline is shown at left. Add source media to start intake.");if(i===4)setNotice("The preview panel requires the connected Godot preview runtime.");if(i===5)exportProject();if(i===6)checkService();}} className="border border-cyan-900/50 bg-[#101820] px-3 py-2 text-[10px] font-black text-cyan-100 hover:bg-cyan-950">{item}</button>)}</nav>
          <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-cyan-200">{apiStatus.state==="online"?"Cloud Synced":apiStatus.state==="checking"?"Connecting":"Cloud Offline"}</span><span className={"h-2 w-2 rounded-full "+(apiStatus.state==="online"?"bg-emerald-400":"bg-amber-400")}/><button type="button" onClick={()=>activeProject?queueProductionJob("playtest","desktop"):createNewProject()} className="border border-amber-400/50 bg-amber-300/10 px-3 py-2 text-[10px] font-black text-amber-100">▶ RUN PLAYTEST</button></div>
        </header>
        <section className="border border-slate-700 bg-[#0b1016] p-2">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-[11px] font-black uppercase tracking-wider text-cyan-200">TIMELINE EDITOR — VIDEO CLIP → GAME LEVELS</h2><button type="button" onClick={()=>queueProductionJob("scene.generate","desktop")} className="border border-amber-400/40 bg-amber-300/10 px-2 py-1 text-[9px] font-bold text-amber-100">▶ CONVERT TO GAME LEVEL</button></div>
          <div className="mt-1 overflow-x-auto"><div className="min-w-[850px]"><div className="grid grid-cols-[110px_1fr] text-[9px] text-slate-500"><span>TIME</span><div className="flex justify-between"><span>00:00</span><span>00:30</span><span>01:00</span><span>02:00</span><span>03:00</span><span>05:30</span></div></div>{["VIDEO CLIP","LEVEL SCENE","GAMEPLAY EVENTS","AUDIO/SFX"].map((t,i)=><div key={t} className="grid grid-cols-[110px_1fr] border-t border-slate-800 text-[9px]"><span className="py-2 font-bold text-cyan-300">{t}</span><div className="flex gap-1 py-1">{(i===0?["intro_scene.mp4","city_exterior","combat_encounter","boss_arena"]:i===1?["intro_scene","city_exterior","combat_scene","boss_arena"]:i===2?["spawn","checkpoint","combat_trigger"]:["ambience","combat_sfx"]).map(n=><div key={n} className="min-w-0 flex-1 truncate border border-cyan-800/50 bg-cyan-900/40 px-2 py-1 text-cyan-100">{n}</div>)}</div></div>)}</div></div>
        </section>
        <main className="grid min-w-0 gap-2 xl:grid-cols-[230px_minmax(0,1fr)_270px]">
          <section className="min-w-0 border border-cyan-900/60 bg-[#0b1118]"><h2 className="border-b border-cyan-900/50 px-3 py-3 text-lg font-black text-cyan-300">◉ AI PIPELINE</h2><div className="space-y-1 p-2">{pipelineRows.map(([name,sub,status],i)=><div key={name} className="border border-slate-800 bg-[#111922] p-2"><div className="flex items-center gap-2"><span className="text-lg text-cyan-300">{["▣","♙","⌁","✧","☠","▤"][i]}</span><div className="min-w-0 flex-1"><div className="text-xs font-bold">{name}</div><div className="text-[9px] text-slate-400">{sub}</div></div><span className="text-emerald-300">{status==="Ready"?"✓":"○"}</span></div><div className="mt-1 text-[9px] text-slate-500">{status}</div></div>)}</div><div className="border-t border-slate-800 p-3 text-[9px] text-cyan-200"><b>AI MODELS</b><div className="mt-2 flex justify-between"><span>Neural Physics</span><span>● ON</span></div><div className="mt-1 flex justify-between"><span>Generative Dialogue</span><span>● ON</span></div></div></section>
          <section className="flex min-h-[480px] min-w-0 flex-col border border-cyan-900/60 bg-[#0b1118]"><div className="px-2 pt-2 text-center"><h2 className="text-2xl font-black text-cyan-200">3D GAME PREVIEW <span className="border border-red-500/40 bg-red-950/40 px-1 text-[9px] text-red-300">LIVE</span></h2><div className="text-[10px] font-bold tracking-widest text-cyan-300">LIVESTREAM RENDER</div></div><div className="grid flex-1 grid-cols-1 gap-1 p-2 md:grid-cols-2">{[["PC ULTRA","4K | RAYTRACING ON","FPS — | LATENCY —"],["MOBILE LOW","1080p | OPTIMIZED","FPS — | LATENCY — | BATTERY SAVER"]].map(([mode,quality,stat])=><div key={mode} className="flex min-h-[300px] flex-col justify-between border border-cyan-800/60 bg-[radial-gradient(circle_at_50%_30%,rgba(20,80,112,.55),transparent_60%),linear-gradient(135deg,#111a25,#05080d)] p-3"><div><div className="text-sm font-black text-amber-200">{mode}</div><div className="text-[10px] text-cyan-100">{quality}</div></div><div className="flex flex-1 items-center justify-center"><div className="flex h-40 w-28 items-center justify-center rounded-[40%] border border-cyan-400/30 bg-gradient-to-b from-cyan-400/20 via-slate-600/30 to-amber-400/10 text-5xl text-cyan-200">♙</div></div><div className="border-t border-cyan-900/50 pt-2 text-[9px] font-bold text-cyan-100">{stat}</div></div>)}</div><div className="flex justify-center gap-2 px-2 pb-2">{["Ⅱ PAUSE","▶ PLAY","POSSESS"].map(label=><button key={label} type="button" onClick={()=>setNotice("Preview controls need the live Godot runtime worker.")} className="border border-cyan-800 bg-cyan-950/40 px-4 py-1.5 text-[10px] font-bold text-cyan-200">{label}</button>)}</div><div className="border-t border-slate-800 px-2 py-1 text-center text-[9px] text-slate-500">Camera: Orbit · Character: {selectedObject?.name||"Protagonist"} · Project: {activeProject?.name||"No project"}</div></section>
          <aside className="min-w-0 border border-amber-700/50 bg-[#0b1118] p-2"><h2 className="text-center text-sm font-black text-amber-200">PERFORMANCE & EXPORT</h2><div className="mt-2 border border-slate-700 bg-[#111922] p-2"><b className="text-xs text-cyan-200">PROJECT TARGET</b>{activeProject&&<select className="mt-2 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-cyan-100" value={activeProject.settings.target} onChange={e=>patchProject(p=>({...p,settings:{...p.settings,target:e.target.value}}))}><option>Desktop</option><option>Android</option><option>iOS</option><option>Web</option><option>Desktop + Android</option><option>All supported targets</option></select>}</div><div className="mt-2 border border-slate-700 bg-[#111922] p-2"><b className="text-xs text-cyan-200">GPU CHECKER · BENCHMARK</b><div className="mt-2 flex h-20 items-end gap-1 border-b border-cyan-900/50">{[12,18,25,19,38,64,48,22,30,18,14,8].map((h,i)=><span key={i} className="flex-1 bg-cyan-500/40" style={{height:h+"%"}}/>)}</div><div className="mt-2 grid grid-cols-3 gap-1 text-center text-[9px]"><div className="border border-slate-800 p-1">FPS<div className="text-cyan-200">—</div></div><div className="border border-slate-800 p-1">VRAM<div className="text-cyan-200">—</div></div><div className="border border-slate-800 p-1">TEMP<div className="text-cyan-200">—</div></div></div></div><div className="mt-2 text-xs font-black text-amber-200">EXPORT TO TARGETS</div><div className="mt-1 grid grid-cols-2 gap-1">{[["PC / STEAM","desktop"],["MOBILE","android"],["WEB","web"],["ALL TARGETS","desktop_android"]].map(([label,target])=><button key={target} type="button" disabled={!cloudProjectActive} onClick={()=>queueProductionJob("build.export",target)} className="border border-slate-700 bg-[#111922] p-2 text-[9px] font-bold text-cyan-100 disabled:opacity-40">⬡ EXPORT<br/><span className="text-slate-400">{label}</span></button>)}</div><div className="mt-2 flex gap-1"><button type="button" onClick={createNewProject} className="flex-1 border border-cyan-800 bg-cyan-950/30 p-2 text-[9px] font-bold text-cyan-100">＋ NEW PROJECT</button><button type="button" disabled={!activeProject} onClick={exportProject} className="flex-1 border border-slate-700 p-2 text-[9px] font-bold text-slate-200 disabled:opacity-40">BACKUP</button></div></aside>
        </main>
        <section className="border border-cyan-900/60 bg-[#0b1118] p-2"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-black text-cyan-200">ASSET LIBRARY</h2><p className="text-[9px] uppercase tracking-wider text-slate-500">Auto-generated from production media</p></div><div className="flex flex-wrap gap-1"><select aria-label="Switch project" value={activeProject?.id||""} onChange={e=>setActiveId(e.target.value)} className="max-w-[180px] border border-slate-700 bg-[#080d12] p-2 text-xs text-cyan-100">{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button type="button" onClick={()=>importInputRef.current?.click()} className="border border-slate-700 px-2 py-1.5 text-[10px] font-bold text-cyan-100">IMPORT</button><button type="button" disabled={!activeProject||busy} onClick={()=>fileInputRef.current?.click()} className="border border-cyan-700 bg-cyan-950/40 px-2 py-1.5 text-[10px] font-bold text-cyan-100 disabled:opacity-40">＋ ADD ASSETS</button><button type="button" onClick={createNewProject} className="border border-amber-700/40 px-2 py-1.5 text-[10px] font-bold text-amber-100">＋ NEW</button></div></div><input ref={importInputRef} type="file" accept=".json,.nexora.json,application/json" className="hidden" onChange={importProject}/><input ref={fileInputRef} type="file" multiple accept=".glb,.png,.jpg,.jpeg,.webp,.wav,.ogg,.mp3" className="hidden" onChange={uploadAssets}/><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="border border-cyan-900/40 bg-[#111922] p-2 text-[10px] font-bold text-cyan-200">CHARACTERS ({assets.filter(a=>["glb","gltf"].includes(a.type)).length})</div><div className="border border-cyan-900/40 bg-[#111922] p-2 text-[10px] font-bold text-cyan-200">PROPS ({assets.filter(a=>!["glb","gltf","wav","ogg","mp3"].includes(a.type)).length})</div><div className="border border-cyan-900/40 bg-[#111922] p-2 text-[10px] font-bold text-cyan-200">ANIMATIONS ({assets.filter(a=>["wav","ogg","mp3"].includes(a.type)).length})</div><div className="border border-cyan-900/40 bg-[#111922] p-2 text-[10px] font-bold text-cyan-200">ENVIRONMENTS (0)</div></div><div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{assets.slice(0,12).map(asset=><div key={asset.id} className="min-w-0 border border-slate-800 bg-[#111922] p-2"><div className="flex h-20 items-center justify-center bg-gradient-to-br from-cyan-950/60 to-slate-900 text-cyan-300"><ImagePlus size={24}/></div><div className="mt-1 truncate text-[10px] font-bold" title={asset.name}>{asset.name}</div><div className="truncate text-[9px] text-slate-500">{asset.type.toUpperCase()} · {asset.remote?asset.status:"LOCAL"}</div><div className="mt-1 flex gap-1"><button type="button" onClick={()=>asset.remote&&asset.type==="glb"?processAsset(asset):setNotice("Selected asset: "+asset.name)} className="flex-1 border border-slate-700 px-1 py-1 text-[9px] text-cyan-200">OPEN</button><button type="button" onClick={()=>removeAsset(asset)} className="border border-slate-700 px-1 py-1 text-[9px] text-rose-300">DEL</button></div></div>)}</div>{!assets.length&&<div className="mt-3 border border-dashed border-slate-700 p-5 text-center text-xs text-slate-500">No assets yet. Add source media, models, textures or audio.</div>}</section>
        <footer className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-[#080d12] px-3 py-2 text-[9px] text-slate-500"><div className="flex flex-wrap gap-3"><span>PROJECT: {activeProject?.name||"—"}</span><span>AUTO-SAVE: {activeProject?.updatedAt?new Date(activeProject.updatedAt).toLocaleTimeString():"—"}</span><span>VERSION: NEXORA STUDIO</span><span>{cloudProjectActive?"CLOUD PROJECT":"LOCAL DRAFT"}</span></div><div className="flex gap-3"><span>MEMORY: {sceneNodes.length} NODES</span><span>GPU LOAD: NOT MEASURED</span></div></footer>
        {notice&&<div role="status" className="flex items-start justify-between gap-3 border border-cyan-800/50 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-100"><span>{notice}</span><button type="button" onClick={()=>setNotice("")} aria-label="Dismiss"><X size={14}/></button></div>}
      </div>
    </div>
  );
}
