import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AndroidBuildConsole from "./AndroidBuildConsole.jsx";
import NexoraDeviceBridge from "./NexoraDeviceBridge.jsx";
import CreatorFlowPanel from "./CreatorFlowPanel.jsx";
import NexoraAuthGate from "./NexoraAuthGate.jsx";
import {
  Activity, ArrowDownToLine, Box, Check, ChevronRight, CircleHelp, Code2,
  FilePlus2, FolderOpen, Gamepad2, HardDrive, ImagePlus, Layers3, Loader2,
  MoreHorizontal, Play, Plus, RefreshCw, Save, Settings2, ShieldCheck,
  Sparkles, Trash2, UploadCloud, WandSparkles, X
} from "lucide-react";

const STORAGE_KEY = "nexora.foundry.projects.v1";
const ACTIVE_KEY = "nexora.foundry.active-project.v1";
const NEXORA_SESSION_KEY = "nexora.account.session.v1";
const DB_NAME = "nexora-foundry-assets";
const DB_STORE = "files";
const API_BASE = String(import.meta.env.VITE_NEXORA_API_URL || "https://nexora-foundry-api.onrender.com").replace(/\/$/, "");

const makeId = (prefix = "item") => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

function readNexoraSession() {
  try { return JSON.parse(localStorage.getItem(NEXORA_SESSION_KEY) || "null"); }
  catch { return null; }
}

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
    timeline: {
      duration_seconds: 330, playhead_seconds: 0,
      tracks: [
        { id: "video", name: "VIDEO CLIP", clips: [] },
        { id: "levels", name: "LEVEL SCENE", clips: [] },
        { id: "events", name: "GAMEPLAY EVENTS", clips: [] },
        { id: "audio", name: "AUDIO/SFX", clips: [] },
      ],
    },
    revisions: [],
  };
}

function projectStorageKey(userId) {
  return userId ? STORAGE_KEY + ":" + String(userId) : STORAGE_KEY;
}

function activeProjectStorageKey(userId) {
  return userId ? ACTIVE_KEY + ":" + String(userId) : ACTIVE_KEY;
}

function readProjects(userId = "anonymous") {
  try {
    const parsed = JSON.parse(localStorage.getItem(projectStorageKey(userId)) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id && item.scene) : [];
  } catch { return []; }
}

function openAssetDb(userId = "anonymous") {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("This browser does not support local asset storage."));
    const scopedDatabase = DB_NAME + "-" + String(userId || "anonymous").replace(/[^a-zA-Z0-9_-]/g, "_");
    const request = indexedDB.open(scopedDatabase, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open asset storage."));
  });
}

async function readStoredAssetBlob(assetId, userId) {
  const db = await openAssetDb(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const request = tx.objectStore(DB_STORE).get(assetId);
    request.onsuccess = () => { const record = request.result; db.close(); resolve(record?.blob || null); };
    request.onerror = () => { db.close(); reject(request.error || new Error("Stored asset could not be read.")); };
  });
}

async function storeAsset(file, projectId, assetId, userId) {
  const db = await openAssetDb(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put({ blob: file, name: file.name, type: file.type, size: file.size, projectId }, assetId);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("Asset could not be stored.")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("Asset storage transaction was aborted.")); };
  });
}

async function removeStoredAsset(assetId, userId) {
  const db = await openAssetDb(userId);
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
    kind: asset.kind, metadata: asset.metadata, sha256: asset.sha256,
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
  const [nexoraSession, setNexoraSession] = useState(readNexoraSession);
  const [nexoraUser, setNexoraUser] = useState(() => readNexoraSession()?.user || null);
  const [nexoraAuthLoading, setNexoraAuthLoading] = useState(() => Boolean(readNexoraSession()?.access_token));
  const storageUserId = nexoraUser?.id || "anonymous";
  const initialStorageUserId = readNexoraSession()?.user?.id || "anonymous";
  const [projectsScopeId, setProjectsScopeId] = useState(initialStorageUserId);
  const authenticatedCloudSession = Boolean(nexoraSession?.access_token && nexoraUser && !nexoraAuthLoading);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [projects, setProjects] = useState(() => readProjects(initialStorageUserId));
  const [activeId, setActiveId] = useState(() => localStorage.getItem(activeProjectStorageKey(initialStorageUserId)) || "");
  const [tab, setTab] = useState("overview");
  const [jobs, setJobs] = useState([]);
  const [androidBuild, setAndroidBuild] = useState({ app_name: "NEXORA Game", package_id: "com.nexora.game", version_name: "1.0.0", version_code: 1, build_type: "debug", artifact_format: "apk", orientation: "landscape", internet_permission: true, camera_permission: false, microphone_permission: false, icon_asset_id: null });
  const cloudBaseline = useRef(new Map());
  const cloudSaveTimer = useRef(null);
  const [selectedObjectId, setSelectedObjectId] = useState("");
  const [apiStatus, setApiStatus] = useState({ state: API_BASE ? "checking" : "not_configured", label: API_BASE ? "Checking NEXORA service" : "API not connected" });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [assetConversionRole, setAssetConversionRole] = useState("prop");
  const [desktopViewport, setDesktopViewport] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 1200px) and (pointer: fine)").matches);
  const [templates, setTemplates] = useState([
    { id:"sci_fi_crate", name:"Neon Cargo Crate", category:"Props", kind:"crate", description:"Modular industrial cargo container", default_scale:1 },
    { id:"signal_beacon", name:"Signal Beacon", category:"Props", kind:"beacon", description:"Glowing navigation marker", default_scale:1 },
    { id:"alien_tree", name:"Alien Tree", category:"Environments", kind:"tree", description:"Procedural alien vegetation", default_scale:1 },
    { id:"rock_formation", name:"Rock Formation", category:"Environments", kind:"rock", description:"Natural terrain landmark", default_scale:1 },
    { id:"sci_fi_outpost", name:"Sci-Fi Outpost", category:"Environments", kind:"outpost", description:"Modular player shelter / mission site", default_scale:1 },
    { id:"tactical_android", name:"Tactical Android", category:"Characters", kind:"character", description:"Original low-poly humanoid character blockout", default_scale:1 },
    { id:"scout_drone", name:"Scout Drone", category:"Props", kind:"drone", description:"Compact reconnaissance drone", default_scale:1 },
    { id:"heavy_door", name:"Sci-Fi Heavy Door", category:"Props", kind:"door", description:"Industrial sliding bulkhead door", default_scale:1 },
  ]);
  const [previewSelection, setPreviewSelection] = useState({ type:"template", id:"sci_fi_crate" });
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewAutoRotate, setPreviewAutoRotate] = useState(true);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [videoRightsConfirmed, setVideoRightsConfirmed] = useState(false);
  const [originalAssetsConfirmed, setOriginalAssetsConfirmed] = useState(true);
  const [moviePipeline, setMoviePipeline] = useState(null);
  const timelineRef = useRef(null);
  const pipelineRef = useRef(null);
  const previewRef = useRef(null);
  const exportRef = useRef(null);

  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);
  const activeProject = projectsScopeId === storageUserId ? (projects.find((item) => item.id === activeId) || projects[0] || null) : null;
  const selectedObject = activeProject?.scene.objects.find((item) => item.id === selectedObjectId) || activeProject?.scene.objects[0] || null;
  const cloudMode = Boolean(API_BASE && authenticatedCloudSession && cloudLoaded && projectsScopeId === storageUserId);
  const cloudProjectActive = Boolean(cloudMode && activeProject?._remoteVersion);

  const nexoraAuthFetch = useCallback(async (input, options = {}) => {
    if (!API_BASE) throw new Error("NEXORA API URL is not configured.");
    if (!nexoraSession?.access_token) throw new Error("Sign in to your NEXORA account.");
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", "Bearer " + nexoraSession.access_token);
    headers.set("Accept", headers.get("Accept") || "application/json");
    const requestedUrl = String(input);
    const isAbsoluteUrl = requestedUrl.startsWith("https://") || requestedUrl.startsWith("http://");
    const url = isAbsoluteUrl ? requestedUrl : API_BASE + (requestedUrl.startsWith("/") ? requestedUrl : "/" + requestedUrl);
    return fetch(url, { ...options, headers, cache: "no-store" });
  }, [nexoraSession?.access_token]);

  useEffect(() => {
    const token = nexoraSession?.access_token;
    if (!token) {
      setNexoraAuthLoading(false);
      setNexoraUser(null);
      return undefined;
    }
    let cancelled = false;
    setNexoraAuthLoading(true);
    fetch(API_BASE + "/api/v1/auth/me", {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      cache: "no-store",
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload?.detail || "Your NEXORA session could not be restored.");
        error.status = response.status;
        throw error;
      }
      return payload.user;
    }).then((user) => {
      if (cancelled) return;
      const nextSession = { ...nexoraSession, user };
      localStorage.setItem(NEXORA_SESSION_KEY, JSON.stringify(nextSession));
      setNexoraSession(nextSession);
      setNexoraUser(user);
    }).catch((error) => {
      if (cancelled) return;
      if (error.status === 401) {
        try { localStorage.removeItem(NEXORA_SESSION_KEY); } catch {}
        setNexoraSession(null);
        setNexoraUser(null);
      } else {
        // Preserve the stored credential during a temporary network outage.
        setNexoraUser(nexoraSession?.user || null);
        setApiStatus({ state: "offline", label: error.message || "Could not verify the NEXORA session" });
      }
    }).finally(() => {
      if (!cancelled) setNexoraAuthLoading(false);
    });
    return () => { cancelled = true; };
  }, [nexoraSession?.access_token]);

  const acceptNexoraSession = useCallback((session) => {
    const normalized = { ...session, user: session.user };
    localStorage.setItem(NEXORA_SESSION_KEY, JSON.stringify(normalized));
    setNexoraSession(normalized);
    setNexoraUser(normalized.user);
    setNexoraAuthLoading(false);
  }, []);

  const signOutNexora = useCallback(async () => {
    const token = nexoraSession?.access_token;
    if (token) {
      try {
        await fetch(API_BASE + "/api/v1/auth/logout", {
          method: "POST",
          headers: { Authorization: "Bearer " + token, Accept: "application/json" },
          cache: "no-store",
        });
      } catch {}
    }
    try { localStorage.removeItem(NEXORA_SESSION_KEY); } catch {}
    setNexoraSession(null);
    setNexoraUser(null);
    setNexoraAuthLoading(false);
    setNotice("You have signed out of your NEXORA account.");
  }, [nexoraSession?.access_token]);

  const apiRequest = useCallback(async (path, options = {}) => {
    if (!API_BASE) throw new Error("NEXORA API URL is not configured.");
    if (!nexoraSession?.access_token) throw new Error("Sign in to your NEXORA account.");
    const headers = new Headers(options.headers || {});
    if (options.body && !(typeof FormData !== "undefined" && options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    const response = await nexoraAuthFetch(path, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        try { localStorage.removeItem(NEXORA_SESSION_KEY); } catch {}
        setNexoraSession(null);
        setNexoraUser(null);
      }
      const detail = payload?.detail;
      throw new Error(typeof detail === "string" ? detail : detail?.message || payload?.message || `NEXORA request failed (HTTP ${response.status}).`);
    }
    return payload;
  }, [nexoraSession?.access_token, nexoraAuthFetch]);

  useEffect(() => {
    if (!API_BASE || nexoraAuthLoading) return undefined;
    if (!authenticatedCloudSession) {
      setCloudLoaded(false);
      // Clear any previously hydrated account-owned projects from component
      // state on logout/account switch. Keep only device-only drafts.
      const deviceProjects = readProjects(storageUserId).filter((item) => !item._remoteVersion);
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
      const localOnly = readProjects(storageUserId)
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
  }, [nexoraAuthLoading, authenticatedCloudSession, apiRequest, storageUserId]);

  useEffect(() => {
    // Retain only device-only drafts in browser storage. Cloud-owned project
    // documents remain authoritative in PostgreSQL and aren't copied on logout.
    const localProjects = projects.filter((item) => !item._remoteVersion);
    if (projectsScopeId !== storageUserId) return;
    try { localStorage.setItem(projectStorageKey(storageUserId), JSON.stringify(localProjects)); } catch { setNotice("Browser storage is full. Export this project to keep a portable copy."); }
  }, [projects, projectsScopeId, storageUserId]);

  useEffect(() => {
    if (projectsScopeId === storageUserId) return;
    const scopedProjects = readProjects(storageUserId);
    setProjects(scopedProjects);
    setActiveId(localStorage.getItem(activeProjectStorageKey(storageUserId)) || scopedProjects[0]?.id || "");
    setCloudLoaded(false);
    setProjectsScopeId(storageUserId);
  }, [storageUserId, projectsScopeId]);

  useEffect(() => {
    if (activeProject?.id) {
      setActiveId(activeProject.id);
      if (!cloudMode && !activeProject._remoteVersion && projectsScopeId === storageUserId) localStorage.setItem(activeProjectStorageKey(storageUserId), activeProject.id);
      if (!selectedObjectId || !activeProject.scene.objects.some((item) => item.id === selectedObjectId)) {
        setSelectedObjectId(activeProject.scene.objects[0]?.id || "");
      }
    } else {
      setActiveId("");
      if (!cloudMode && projectsScopeId === storageUserId) localStorage.removeItem(activeProjectStorageKey(storageUserId));
    }
  }, [activeProject?.id, cloudMode, projectsScopeId, storageUserId]);

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
          if (!asset.remote) await removeStoredAsset(asset.id, nexoraUser?.id || "anonymous");
        }
      } catch (error) {
        setNotice(error.message || "Could not clean local project assets.");
        return;
      }
    }
    setProjects((current) => current.filter((project) => project.id !== activeProject.id));
    setSelectedObjectId("");
  };

  const addTemplateToScene = (template) => {
    if(!activeProject || !template) return;
    const scale=Number(template.default_scale || 1);
    const object={id:makeId("object"),name:template.name,type:"MeshInstance3D",position:[0,0,0],rotation:[0,0,0],scale:[scale,scale,scale],visible:true,template_id:template.id};
    patchProject(project=>({...project,scene:{...project.scene,objects:[...project.scene.objects,object]}}));
    setSelectedObjectId(object.id);
    setPreviewSelection({type:"template",id:template.id});
    setNotice(`${template.name} added to the scene. Its procedural mesh is generated by the Foundry scene assembler.`);
  };

  const addAssetToScene = (asset) => {
    if(!activeProject || !asset || !["glb","gltf"].includes(asset.type)) return;
    const object={id:makeId("object"),name:asset.name.replace(/\.(glb|gltf)$/i,""),type:"MeshInstance3D",position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],visible:true,asset_id:asset.id};
    patchProject(project=>({...project,scene:{...project.scene,objects:[...project.scene.objects,object]}}));
    setSelectedObjectId(object.id);
    setPreviewSelection({type:"asset",id:asset.id});
    setNotice(`${asset.name} added to the scene as an imported 3D model.`);
  };

  const updateTimeline = (updater) => {
    if(!activeProject) return;
    patchProject(project=>{
      const defaultTimeline={duration_seconds:330,playhead_seconds:0,tracks:[
        {id:"video",name:"VIDEO CLIP",clips:[]},
        {id:"levels",name:"LEVEL SCENE",clips:[]},
        {id:"events",name:"GAMEPLAY EVENTS",clips:[]},
        {id:"audio",name:"AUDIO/SFX",clips:[]},
      ]};
      const timeline=project.timeline || defaultTimeline;
      return {...project,timeline:typeof updater==="function"?updater(timeline):{...timeline,...updater}};
    });
  };

  const addAssetToTimeline = (asset) => {
    const trackId=["mp4","mov","mkv","webm","avi"].includes(asset.type)?"video":["wav","ogg","mp3"].includes(asset.type)?"audio":"levels";
    updateTimeline(timeline=>{
      const clips=(timeline.tracks||[]).map(track=>track.id===trackId
        ? {...track,clips:[...(track.clips||[]),{id:makeId("clip"),asset_id:asset.id,label:asset.name,start_seconds:Number(timeline.playhead_seconds||0),duration_seconds:30}]}
        : track);
      return {...timeline,tracks:clips};
    });
    setNotice(`${asset.name} added to the ${trackId.toUpperCase()} timeline.`);
  };

  const seekTimeline = (time) => updateTimeline(timeline=>({...timeline,playhead_seconds:Number(time)}));

  const approveVideoAnalysis = async () => {
    if(!activeProject?._remoteVersion || !moviePipeline) return;
    try {
      const saved=await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/movie-pipeline/stages/analysis/approve`,{method:"POST",body:JSON.stringify({note:"Reviewed by creator in NEXORA Studio Pro"})});
      setMoviePipeline(saved);
      setNotice("Video analysis approved. Downstream creator stages are now unlocked.");
    } catch(error) { setNotice(error.message || "Could not approve the analysis stage."); }
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
    const incoming = Array.from(event.target.files || []);
    event.target.value = "";
    if (!incoming.length || !activeProject) return;
    const isVideo = (file) => ["mp4","mov","mkv","webm","avi"].includes(file.name.split(".").pop()?.toLowerCase());
    const rank = (file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      return ext === "gltf" ? 2 : ["glb","mp4","mov","mkv","webm","avi","wav","ogg","mp3"].includes(ext) ? 1 : 0;
    };
    setBusy(true);
    try {
      const accepted = [];
      for (const file of incoming.sort((a,b)=>rank(a)-rank(b))) {
        const extension = file.name.split(".").pop()?.toLowerCase();
        if (!["glb","gltf","obj","fbx","ply","bin","png","jpg","jpeg","webp","wav","ogg","mp3","mp4","mov","mkv","webm","avi"].includes(extension)) continue;
        if (file.size > (isVideo(file) ? 8 * 1024 * 1024 * 1024 : 512 * 1024 * 1024)) {
          setNotice(`Skipped ${file.name}: file exceeds its permitted upload size.`);
          continue;
        }
        if (isVideo(file) && cloudProjectActive) {
          if (!videoRightsConfirmed || !originalAssetsConfirmed) {
            throw new Error("Before video intake, confirm your rights to the clip and that NEXORA will generate original game assets.");
          }
          const form = new FormData();
          form.append("file",file);
          form.append("has_video_rights","true");
          form.append("accepts_original_assets_only","true");
          const result = await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/video-intake`,{method:"POST",body:form});
          const clip = { id:makeId("clip"), asset_id:result.source_video?.sha256 || result.source_video?.filename || makeId("video"), label:file.name, start_seconds:Number(activeProject.timeline?.playhead_seconds||0), duration_seconds:30, source:"movie-pipeline" };
          patchProject((project)=>({...project,timeline:{...(project.timeline||{}),duration_seconds:project.timeline?.duration_seconds||330,playhead_seconds:clip.start_seconds,tracks:(project.timeline?.tracks||[]).map(track=>track.id==="video"?{...track,clips:[...(track.clips||[]),clip]}:track)}}));
          setJobs((current)=>[{...result,kind:"video.analysis",artifacts:[]},...current]);
          setMoviePipeline(result.pipeline || null);
          setNotice(`Video accepted and analysis queued: ${result.job_id}. NEXORA will extract scene boundaries and keyframes for creator review.`);
          continue;
        }
        if (cloudProjectActive) {
          const form = new FormData();
          form.append("file",file);
          form.append("kind",["glb","gltf"].includes(extension)?"model":["bin","png","jpg","jpeg","webp"].includes(extension)?"dependency":["wav","ogg","mp3"].includes(extension)?"animation":"source_media");
          form.append("license_name","Creator confirms ownership or permission to use this asset");
          form.append("source","NEXORA Studio Pro creator upload");
          const result = await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/assets`,{method:"POST",body:form});
          accepted.push(cloudAssetFromApi(result.asset));
        } else {
          const asset = {id:makeId("asset"),name:file.name,type:extension,mimeType:file.type||"application/octet-stream",size:file.size,addedAt:now(),status:"ingested_local",remote:false};
          await storeAsset(file,activeProject.id,asset.id,nexoraUser?.id || "anonymous");
          accepted.push(asset);
        }
      }
      if (accepted.length) {
        patchProject((project)=>({...project,assets:[...project.assets,...accepted]}));
        const firstModel=accepted.find((asset)=>["glb","gltf"].includes(asset.type));
        if(firstModel) setPreviewSelection({type:"asset",id:firstModel.id});
        setNotice(`${accepted.length} creator asset(s) imported. GLB/glTF models can be previewed and placed into the game scene.`);
      } else if (!incoming.some(isVideo)) {
        setNotice("No supported assets found. Supported: GLB, glTF, BIN, images, audio and video.");
      }
    } catch(error) {
      setNotice(error.message || "Asset intake failed.");
    } finally { setBusy(false); }
  };

  const removeAsset = async (asset) => {
    try {
      if (cloudMode && asset.remote) {
        await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/assets/${asset.id}`, { method: "DELETE" });
      } else {
        await removeStoredAsset(asset.id,nexoraUser?.id || "anonymous");
      }
      patchProject((project) => ({ ...project, assets: project.assets.filter((item) => item.id !== asset.id) }));
      setNotice(`Removed ${asset.name} from ${cloudMode ? "private cloud storage" : "this browser"}.`);
    } catch (error) {
      setNotice(error.message || "Could not remove the stored asset.");
    }
  };

  const processAsset = async (asset) => {
    if (!["glb","gltf"].includes(asset.type)) {
      setNotice("Only validated GLB/glTF models can be attached to a 3D scene.");
      return;
    }
    addAssetToScene(asset);
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
      const assetResponse = await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/assets`);
      const nextAssets = (assetResponse.assets || []).map(cloudAssetFromApi);
      setProjects((current) => current.map((project) =>
        project.id === activeProject.id ? { ...project, assets: nextAssets } : project
      ));
    } catch (error) {
      setNotice(error.message || "Could not refresh production job status.");
    }
  }, [activeProject?.id, apiRequest, cloudProjectActive]);

  const convertAssetToGameAsset = async (asset, targetRole = "prop") => {
    if (!cloudProjectActive || !activeProject) {
      setNotice("Upload and save this asset to your NEXORA account-owned cloud project before conversion.");
      return;
    }
    const acceptedTypes = ["png","jpg","jpeg","webp","glb","gltf","obj","fbx","ply"];
    if (!acceptedTypes.includes(asset.type)) {
      setNotice("Conversion accepts images and 3D model formats only.");
      return;
    }
    const confirmed = window.confirm("Confirm that you own this asset or have permission to create and use a derivative game asset from it.");
    if (!confirmed) return;
    try {
      const response = await apiRequest(`/api/v1/workspace/projects/${activeProject.id}/assets/${asset.id}/convert`, {
        method: "POST",
        body: JSON.stringify({ target_role: targetRole, confirm_rights: true, max_faces: 50000 }),
      });
      setNotice(`Asset conversion queued · ${response.id || response.job_id}. The result will appear in the asset library when the worker finishes.`);
      await refreshJobs();
    } catch (error) {
      setNotice(error.message || "Asset conversion could not be queued.");
    }
  };

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
      setNotice(`Queued ${kind} job ${result.job_id || result.id}. NEXORA will report the actual worker result.`);
      await refreshJobs();
    } catch (error) {
      setNotice(error.message || "Could not queue the production job.");
    }
  };

  useEffect(() => {
    if (!cloudProjectActive || !activeProject) return undefined;
    refreshJobs();
    const timer = window.setInterval(refreshJobs, 5000);
    return () => window.clearInterval(timer);
  }, [activeProject?.id, cloudProjectActive, refreshJobs]);

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
      const response = await fetch(`${API_BASE}/health`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Health check returned HTTP ${response.status}`);
      setApiStatus({ state: "online", label: "NEXORA API and PostgreSQL/R2 ready" });
    } catch (error) {
      setApiStatus({ state: "offline", label: error.message || "NEXORA API or cloud dependency unavailable" });
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1200px) and (pointer: fine)");
    const update = () => setDesktopViewport(media.matches);
    update();
    media.addEventListener?.("change",update);
    return () => media.removeEventListener?.("change",update);
  }, []);

  useEffect(() => { checkService(); }, [checkService]);

  useEffect(() => {
    if (!authenticatedCloudSession || nexoraAuthLoading) return undefined;
    let live = true;
    Promise.all([
      apiRequest("/api/v1/studio/templates"),
      activeProject?._remoteVersion ? apiRequest(`/api/v1/workspace/projects/${activeProject.id}/movie-pipeline`).catch(()=>null) : Promise.resolve(null),
    ]).then(([catalog,pipeline])=>{
      if (!live) return;
      if (Array.isArray(catalog.templates)) setTemplates(catalog.templates);
      if (pipeline) setMoviePipeline(pipeline);
    }).catch(error=>{ if(live) setNotice(error.message || "Could not load NEXORA studio resources."); });
    return ()=>{live=false;};
  },[authenticatedCloudSession,nexoraAuthLoading,apiRequest,activeProject?.id,activeProject?._remoteVersion]);

  useEffect(() => {
    if (!desktopViewport) return undefined;
    let live=true;
    let currentUrl="";
    const loadModel = async () => {
      setPreviewLoading(true);
      setPreviewUrl("");
      try {
        let blob=null;
        if (previewSelection.type==="template") {
          if (!authenticatedCloudSession) throw new Error("Sign in to your NEXORA account to load the template service.");
          const response=await nexoraAuthFetch(`/api/v1/studio/templates/${encodeURIComponent(previewSelection.id)}/model`,{headers:{Accept:"model/gltf-binary"},cache:"no-store"});
          if(!response.ok) throw new Error(`3D template request failed (HTTP ${response.status}).`);
          blob=await response.blob();
        } else {
          const asset=activeProject?.assets?.find(item=>item.id===previewSelection.id);
          if(!asset) throw new Error("Select a 3D model from the asset library.");
          if(asset.remote) {
            const response=await nexoraAuthFetch(`/api/v1/workspace/projects/${activeProject.id}/assets/${asset.id}/file`,{headers:{Accept:"model/gltf-binary"},cache:"no-store"});
            if(!response.ok) throw new Error(`Model file request failed (HTTP ${response.status}).`);
            blob=await response.blob();
          } else {
            blob=await readStoredAssetBlob(asset.id,nexoraUser?.id || "anonymous");
          }
        }
        if(!(blob instanceof Blob) || !blob.size) throw new Error("The selected model file is missing or empty.");
        currentUrl=URL.createObjectURL(blob);
        if(live) setPreviewUrl(currentUrl); else URL.revokeObjectURL(currentUrl);
      } catch(error) {
        if(live) setNotice(error.message || "3D preview could not be loaded.");
      } finally {
        if(live) setPreviewLoading(false);
      }
    };
    loadModel();
    return ()=>{live=false;if(currentUrl)URL.revokeObjectURL(currentUrl);};
  },[previewSelection,activeProject?.id,activeProject?.assets,desktopViewport,authenticatedCloudSession,nexoraAuthFetch]);

  useEffect(() => {
    if (typeof window==="undefined" || window.customElements?.get("model-viewer")) return;
    if (document.querySelector('script[data-nexora-model-viewer="true"]')) return;
    const script=document.createElement("script");
    script.type="module";
    script.src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    script.dataset.nexoraModelViewer="true";
    script.onerror=()=>setNotice("The 3D model viewer library could not load. Check internet access on this desktop.");
    document.head.appendChild(script);
  },[]);

  const validationIssues = useMemo(() => activeProject ? validateProject() : [], [activeProject]);
  const validationPassed = activeProject && validationIssues.length === 0;
  const exportProject = () => activeProject && downloadJson(activeProject, `${activeProject.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "nexora-project"}.nexora.json`);

  const studioAssets = activeProject?.assets || [];
  const pipelineRows = [["Video Intake","Source media",studioAssets.length?"Ready":"Waiting"],["Character Extraction","Characters & rigging",studioAssets.some(a=>a.type==="glb")?"Ready":"Waiting"],["Motion Capture","Motion cleanup","Waiting"],["World Builder","Environment generation","Waiting"],["Enemy AI","Behavior data",activeProject?.gameplay?.enemies?.length?"Ready":"Waiting"],["Quest Logic","Objectives & triggers",activeProject?.gameplay?.objectives?.length?"Ready":"Waiting"]];

  if (!desktopViewport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b10] p-8 text-center text-cyan-100">
        <div className="max-w-xl border border-cyan-700/60 bg-[#0b1118] p-8 shadow-[0_0_60px_rgba(34,211,238,.08)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-cyan-400/50 bg-cyan-950/40 text-cyan-300"><Box size={34}/></div>
          <h1 className="text-2xl font-black tracking-[.18em]">NEXORA STUDIO PRO</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">NEXORA is a desktop-only game-production workstation. Open it on a desktop computer with a mouse and a display at least 1200 pixels wide.</p>
          <p className="mt-3 text-xs text-slate-500">Games produced by NEXORA can target Android, Web and desktop platforms. Mobile is a game output target, not a NEXORA workstation layout.</p>
        </div>
      </div>
    );
  }

  const studioTimeline = activeProject?.timeline || {duration_seconds:330,playhead_seconds:0,tracks:[
    {id:"video",name:"VIDEO CLIP",clips:[]},{id:"levels",name:"LEVEL SCENE",clips:[]},{id:"events",name:"GAMEPLAY EVENTS",clips:[]},{id:"audio",name:"AUDIO/SFX",clips:[]},
  ]};
  const modelAssets = studioAssets.filter(asset=>["glb","gltf"].includes(asset.type));
  const mediaAssets = studioAssets.filter(asset=>["mp4","mov","mkv","webm","avi","wav","ogg","mp3"].includes(asset.type));
  const sceneNodes = activeProject?.scene?.objects || [];
  const recentJobs = jobs.slice(0,3);
  const scrollTo = (ref) => ref.current?.scrollIntoView({behavior:"smooth",block:"center"});
  const addTimelineClip = () => {
    const fileAsset=mediaAssets[0];
    if(!fileAsset) { setNotice("Import a video or audio asset before adding a clip to the timeline."); return; }
    addAssetToTimeline(fileAsset);
  };

  const downloadArtifact = async (artifact) => {
    try {
      const response = await nexoraAuthFetch(artifact.download_url);
      if (!response.ok) throw new Error("Artifact download failed (HTTP " + response.status + ").");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = artifact.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      setNotice(error.message || "Artifact download failed.");
    }
  };

  if (nexoraAuthLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#05090f] text-sm text-cyan-100"><span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-cyan-900 border-t-cyan-300"/>Checking NEXORA account session…</div>;
  }
  if (!nexoraSession?.access_token || !nexoraUser) {
    return <NexoraAuthGate apiBase={API_BASE} onAuthenticated={acceptNexoraSession} />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#070b10] text-slate-100">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-2 p-2">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/60 bg-[#080d12] px-3 py-2">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0" aria-label="NEXORA Studio Pro mark">
              <path d="M32 3 57 17v30L32 61 7 47V17Z" fill="#071e2a" stroke="#55e7ed" strokeWidth="2"/>
              <path d="M32 10 50 20v24L32 54 14 44V20Z" fill="none" stroke="#1c9eae" strokeWidth="1.4"/>
              <path d="M32 18 43 25v14L32 46 21 39V25Z" fill="#c5a55a" stroke="#f1d58a" strokeWidth="1.4"/>
              <path d="M32 18V4M43 25l12-8M43 39l12 8M21 39 9 47M21 25 9 17" stroke="#6ef3f4" strokeWidth="1.4"/>
            </svg>
            <div><div className="text-2xl font-black tracking-[.16em] text-white">NEXORA</div><div className="text-[9px] font-bold tracking-[.44em] text-amber-200">STUDIO PRO</div></div>
          </div>
          <nav className="flex flex-wrap justify-center gap-1">
            {["PROJECT","TIMELINE","BUILD","AI PIPELINE","PREVIEW","EXPORT","SETTINGS"].map((item,i)=><button key={item} type="button" onClick={()=>{
              if(i===0) createNewProject();
              if(i===1) scrollTo(timelineRef);
              if(i===2) queueProductionJob("scene.generate","desktop");
              if(i===3) scrollTo(pipelineRef);
              if(i===4) scrollTo(previewRef);
              if(i===5) scrollTo(exportRef);
              if(i===6) setSettingsOpen(value=>!value);
            }} className="border border-cyan-900/60 bg-[#101820] px-3 py-2 text-[10px] font-black tracking-wide text-cyan-100 hover:border-cyan-400/70 hover:bg-cyan-950/70">{item}</button>)}
          </nav>
          <div className="flex items-center gap-2">
            <div className="text-right"><div className="text-[10px] font-bold text-cyan-200">{cloudProjectActive?"CLOUD SYNCED":apiStatus.state==="online"?"FOUNDRY ONLINE":"SERVICE OFFLINE"}</div><div className="text-[9px] text-slate-500">{nexoraUser?.display_name || nexoraUser?.email || "NEXORA account"}</div></div>
            <span className={"h-2 w-2 rounded-full "+(apiStatus.state==="online"?"bg-emerald-400":"bg-amber-400")}/>
            <button type="button" onClick={signOutNexora} className="border border-slate-700 px-2 py-2 text-[9px] font-bold text-slate-300 hover:border-rose-500/60 hover:text-rose-200">SIGN OUT</button>
            <button type="button" disabled={!cloudProjectActive||busy} onClick={()=>queueProductionJob("playtest","desktop")} className="border border-amber-400/50 bg-amber-300/10 px-3 py-2 text-[10px] font-black text-amber-100 disabled:opacity-40">▶ RUN PLAYTEST</button>
          </div>
        </header>

        {!authenticatedCloudSession && <div className="border border-amber-700/50 bg-[#1b1710] px-3 py-2 text-[11px] text-amber-100">Sign in with your independent NEXORA account to access your cloud projects and production tools.</div>}
        {authenticatedCloudSession&&!cloudLoaded&&<div className="border border-cyan-800/50 bg-cyan-950/20 px-3 py-2 text-[11px] text-cyan-100">Connecting your NEXORA account to Studio Pro…</div>}
        {notice&&<div role="status" className="flex items-start justify-between gap-3 border border-cyan-800/50 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-100"><span>{notice}</span><button type="button" onClick={()=>setNotice("")} aria-label="Dismiss"><X size={14}/></button></div>}

        <section ref={timelineRef} className="border border-slate-700 bg-[#0b1016] p-2">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-[11px] font-black uppercase tracking-wider text-cyan-200">TIMELINE EDITOR — VIDEO CLIP → GAME LEVELS</h2><div className="flex items-center gap-2">
            <label className="text-[9px] text-slate-500">ZOOM <input aria-label="Timeline zoom" type="range" min="0.5" max="2.5" step="0.1" value={timelineZoom} onChange={event=>setTimelineZoom(Number(event.target.value))} className="ml-2 align-middle accent-cyan-400"/></label>
            <button type="button" onClick={addTimelineClip} className="border border-cyan-800 px-2 py-1 text-[9px] font-bold text-cyan-100">＋ ADD CLIP</button>
            <button type="button" disabled={!cloudProjectActive||busy} onClick={()=>queueProductionJob("scene.generate","desktop")} className="border border-amber-400/40 bg-amber-300/10 px-2 py-1 text-[9px] font-bold text-amber-100 disabled:opacity-40">▶ BUILD SCENE</button>
          </div></div>
          <div className="mt-1 flex flex-wrap items-center gap-3 border-b border-slate-800 pb-2 text-[9px] text-slate-500">
            <span>PLAYHEAD {(Number(studioTimeline.playhead_seconds||0)).toFixed(1)}s</span><span>DURATION {(Number(studioTimeline.duration_seconds||330)).toFixed(0)}s</span>
            {moviePipeline?.source_video&&<span className="text-emerald-300">SOURCE VIDEO ATTACHED · {moviePipeline.stages?.find(item=>item.stage==="analysis")?.state||"PENDING"}</span>}
          </div>
          <div className="overflow-x-auto"><div className="min-w-[950px]">
            <div className="grid grid-cols-[135px_1fr] text-[9px] text-slate-500"><span>TRACK / TIME</span><div className="flex justify-between px-1"><span>00:00</span><span>00:30</span><span>01:00</span><span>02:00</span><span>03:00</span><span>05:30</span></div></div>
            {(studioTimeline.tracks||[]).map(track=><div key={track.id} className="grid grid-cols-[135px_1fr] border-t border-slate-800 text-[9px]">
              <div className="flex items-center justify-between gap-1 pr-2 font-bold text-cyan-300"><span>{track.name}</span><button type="button" onClick={()=>updateTimeline(current=>({...current,tracks:current.tracks.map(row=>row.id===track.id?{...row,clips:[...(row.clips||[]),{id:makeId("clip"),label:"New clip",start_seconds:Number(current.playhead_seconds||0),duration_seconds:15}]}:row)}))} aria-label={"Add "+track.name+" clip"}>＋</button></div>
              <div className="relative border-l border-slate-800" style={{minWidth:Math.round(800*timelineZoom),height:34}}>
                {(track.clips||[]).map(clip=><div key={clip.id} className="absolute top-1 flex h-7 items-center border border-cyan-600/70 bg-cyan-800/60" style={{left:`${Math.max(0,Number(clip.start_seconds||0))/(studioTimeline.duration_seconds||330)*100}%`,width:`${Math.max(6,Number(clip.duration_seconds||15)/(studioTimeline.duration_seconds||330)*100)}%`}}>
                  <button type="button" title={clip.label} onClick={()=>seekTimeline(clip.start_seconds||0)} className="min-w-0 flex-1 truncate px-2 text-left text-[9px] text-cyan-50">{clip.label}</button>
                  <button type="button" aria-label={"Remove "+clip.label} onClick={()=>updateTimeline(current=>({...current,tracks:current.tracks.map(row=>row.id===track.id?{...row,clips:row.clips.filter(item=>item.id!==clip.id)}:row)}))} className="px-1 text-rose-200">×</button>
                </div>)}
              </div>
            </div>)}
            <div className="flex items-center gap-3 border-t border-slate-800 pt-2"><span className="w-[135px] text-[9px] text-slate-500">GLOBAL PLAYHEAD</span><input aria-label="Timeline playhead" type="range" min="0" max={studioTimeline.duration_seconds||330} step="0.1" value={Math.min(Number(studioTimeline.playhead_seconds||0),Number(studioTimeline.duration_seconds||330))} onChange={event=>seekTimeline(event.target.value)} className="flex-1 accent-cyan-300"/></div>
          </div></div>
        </section>

        <main className="grid min-w-0 gap-2 xl:grid-cols-[minmax(220px,19%)_minmax(0,1fr)_minmax(250px,21%)]">
          <section ref={pipelineRef} className="min-w-0 border border-cyan-900/60 bg-[#0b1118]">
            <h2 className="border-b border-cyan-900/50 px-3 py-3 text-lg font-black text-cyan-300">◉ AI PIPELINE</h2>
            <div className="space-y-1 p-2">{pipelineRows.map(([name,desc,status],i)=><button key={name} type="button" onClick={()=>{if(i===0)fileInputRef.current?.click();else if(i===1)setNotice("Import a GLB/glTF character model and use ADD TO SCENE. Character rigging depends on compatible source skeleton data.");else if(i===2)setNotice("Import animated GLB/glTF files. Motion capture cleaning is not reported as complete unless a worker returns a verified result.");else if(i===3)queueProductionJob("scene.generate","desktop");else setTab("gameplay");}} className="w-full border border-slate-800 bg-[#111922] p-2 text-left hover:border-cyan-700/60">
              <div className="flex items-center gap-2"><span className="text-lg text-cyan-300">{["▣","♙","⌁","✧","☠","▤"][i]}</span><div className="min-w-0 flex-1"><div className="text-xs font-bold">{name}</div><div className="text-[9px] text-slate-400">{desc}</div></div><span className={"text-[10px] "+(status==="Ready"?"text-emerald-300":"text-amber-300")}>{status==="Ready"?"✓":"○"}</span></div><div className="mt-1 text-[9px] text-slate-500">{status}</div>
            </button>)}</div>
            <div className="border-t border-slate-800 p-3 text-[9px] text-cyan-200"><b>PRODUCTION SYSTEMS</b><div className="mt-2 flex justify-between"><span>Procedural scene engine</span><span className="text-emerald-300">● AVAILABLE</span></div><div className="mt-1 flex justify-between"><span>glTF validation</span><span className="text-emerald-300">● AVAILABLE</span></div>
              {moviePipeline?.stages?.map(stage=><div key={stage.stage} className="mt-1 flex justify-between gap-2"><span>{stage.stage.replace("_"," ")}</span><span className={stage.state==="REVIEW"?"text-amber-300":stage.state==="APPROVED"?"text-emerald-300":"text-slate-400"}>{stage.state}</span></div>)}
              {moviePipeline?.stages?.some(stage=>stage.stage==="analysis"&&stage.state==="REVIEW")&&<button type="button" onClick={approveVideoAnalysis} className="mt-2 w-full border border-amber-600/50 bg-amber-300/10 px-2 py-1.5 text-[9px] font-bold text-amber-100">APPROVE VIDEO ANALYSIS</button>}
            </div>
          </section>

          <section ref={previewRef} className="flex min-h-[520px] min-w-0 flex-col border border-cyan-900/60 bg-[#0b1118]">
            <div className="px-2 pt-2 text-center"><h2 className="text-2xl font-black text-cyan-200">3D GAME PREVIEW <span className="border border-red-500/40 bg-red-950/40 px-1 text-[9px] text-red-300">LIVE</span></h2><div className="text-[10px] font-bold tracking-widest text-cyan-300">INTERACTIVE 3D MODEL VIEW · DRAG TO ORBIT</div></div>
            <div className="grid flex-1 grid-cols-1 gap-1 p-2 md:grid-cols-2">
              {[["PC ULTRA","4K PROFILE"],["MOBILE LOW","OPTIMIZED PREVIEW PROFILE"]].map(([mode,quality])=><div key={mode} className="flex min-h-[320px] flex-col border border-cyan-800/60 bg-[radial-gradient(circle_at_50%_30%,rgba(20,80,112,.55),transparent_60%),linear-gradient(135deg,#111a25,#05080d)] p-2">
                <div className="flex items-start justify-between"><div><div className="text-sm font-black text-amber-200">{mode}</div><div className="text-[10px] text-cyan-100">{quality}</div></div><span className="border border-cyan-800 px-1 text-[9px] text-cyan-200">{previewSelection.type==="template"?"TEMPLATE":"CREATOR MODEL"}</span></div>
                {previewUrl ? <model-viewer src={previewUrl} alt="Selected NEXORA 3D model" camera-controls auto-rotate={previewAutoRotate} shadow-intensity="1" exposure={mode==="PC ULTRA"?"1.1":"0.8"} environment-image="neutral" style={{width:"100%",height:"245px",background:"transparent"}}/> : <div className="flex flex-1 flex-col items-center justify-center text-center text-xs text-slate-500"><Box size={42} className="mb-3 text-cyan-400/50"/>{previewLoading?"Loading 3D model…":"Choose a built-in template or import a GLB/glTF model."}</div>}
                <div className="border-t border-cyan-900/50 pt-2 text-[9px] font-bold text-cyan-100">{mode==="PC ULTRA"?"MODEL PREVIEW · HIGH QUALITY PROFILE":"MODEL PREVIEW · LOW QUALITY PROFILE"}</div>
              </div>)}
            </div>
            <div className="flex justify-center gap-2 px-2 pb-2"><button type="button" onClick={()=>setPreviewAutoRotate(false)} className="border border-cyan-800 bg-cyan-950/40 px-4 py-1.5 text-[10px] font-bold text-cyan-200">Ⅱ PAUSE ROTATION</button><button type="button" onClick={()=>setPreviewAutoRotate(true)} className="border border-cyan-800 bg-cyan-950/40 px-4 py-1.5 text-[10px] font-bold text-cyan-200">▶ ROTATE</button><button type="button" onClick={()=>queueProductionJob("playtest","desktop")} disabled={!cloudProjectActive||busy} className="border border-cyan-800 bg-cyan-950/40 px-4 py-1.5 text-[10px] font-bold text-cyan-200 disabled:opacity-40">RUN GODOT SMOKE TEST</button></div>
            <div className="border-t border-slate-800 px-2 py-1 text-center text-[9px] text-slate-500">Selected: {previewSelection.id} · {previewSelection.type} · Project: {activeProject?.name||"No project"}</div>
          </section>

          <aside ref={exportRef} className="min-w-0 border border-amber-700/50 bg-[#0b1118] p-2">
            <h2 className="text-center text-sm font-black text-amber-200">PERFORMANCE & EXPORT</h2>
            <div className="mt-2 border border-slate-700 bg-[#111922] p-2"><b className="text-xs text-cyan-200">PLATFORM TARGET</b>{activeProject&&<select aria-label="Project target" className="mt-2 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-cyan-100" value={activeProject.settings?.target||"Desktop"} onChange={event=>patchProject(project=>({...project,settings:{...project.settings,target:event.target.value}}))}><option>Desktop</option><option>Android</option><option>Desktop + Android</option></select>}</div>
            <div className="mt-2 border border-slate-700 bg-[#111922] p-2"><b className="text-xs text-cyan-200">ENGINE TELEMETRY</b><div className="mt-2 text-[10px] text-slate-400">{apiStatus.state==="online"?"Foundry API reachable":"Foundry API unavailable"}</div><div className="mt-2 border border-slate-800 p-2 text-[9px] text-slate-400">GPU / VRAM / temperature sensors are not exposed by this browser. A trusted desktop sensor agent must be installed before NEXORA can report these values.</div><div className="mt-2 text-[9px] text-slate-500">No estimated or fabricated benchmark values are displayed.</div><button type="button" onClick={checkService} className="mt-2 w-full border border-slate-700 p-1.5 text-[9px] text-cyan-100"><RefreshCw size={12} className="mr-1 inline"/> CHECK FOUNDRY SERVICE</button></div>
            <div className="mt-2 text-xs font-black text-amber-200">EXPORT TO TARGETS</div><div className="mt-1 grid grid-cols-2 gap-1">{[["WINDOWS","windows"],["LINUX","linux"],["ANDROID","android"],["WEB","web"]].map(([label,target])=><button key={target} type="button" disabled={!cloudProjectActive||busy} onClick={()=>queueProductionJob("build.export",target)} className="border border-slate-700 bg-[#111922] p-2 text-[9px] font-bold text-cyan-100 hover:border-cyan-400/50 disabled:opacity-40">⬡ EXPORT<br/><span className="text-slate-400">{label}</span></button>)}</div>
            {settingsOpen&&<div className="mt-2 border border-cyan-800/50 bg-[#111922] p-2"><div className="text-xs font-black text-cyan-200">STUDIO SETTINGS</div><label className="mt-2 flex items-center justify-between text-[10px] text-slate-300">Model auto-rotate<input type="checkbox" checked={previewAutoRotate} onChange={event=>setPreviewAutoRotate(event.target.checked)}/></label><label className="mt-2 flex items-center justify-between text-[10px] text-slate-300">Timeline zoom<input type="range" min="0.5" max="2.5" step="0.1" value={timelineZoom} onChange={event=>setTimelineZoom(Number(event.target.value))}/></label><button type="button" onClick={checkService} className="mt-2 w-full border border-slate-700 p-1 text-[9px]">VERIFY AUTHENTICATED SERVICE</button><button type="button" onClick={deleteProject} className="mt-2 w-full border border-rose-900/60 p-1 text-[9px] text-rose-300">DELETE CURRENT PROJECT</button></div>}
            <div className="mt-2 text-[9px] font-black text-amber-200">RECENT JOBS</div>
            <div className="mt-1 space-y-1">
              {jobs.slice(0, 4).map((job) => (
                <div key={job.id} className="border border-slate-800 bg-[#111922] p-2">
                  <div className="flex justify-between gap-2 text-[9px]">
                    <b className="truncate">{job.kind || "Foundry job"}</b>
                    <span className={job.state === "completed" ? "text-emerald-300" : job.state === "failed" ? "text-rose-300" : "text-amber-200"}>{job.state} {job.progress}%</span>
                  </div>
                  <div className="mt-1 text-[9px] text-slate-500">{job.message}</div>
                  {(job.artifacts || []).map((artifact) => (
                    <button key={artifact.id} type="button" onClick={() => downloadArtifact(artifact)} className="mt-1 block truncate text-[9px] text-cyan-300 underline">
                      {artifact.filename} · DOWNLOAD
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>
        </main>

        <section className="border border-cyan-900/60 bg-[#0b1118] p-2">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-black text-cyan-200">ASSET LIBRARY</h2><p className="text-[9px] uppercase tracking-wider text-slate-500">Procedural templates · creator GLB/glTF models · video and audio</p></div><div className="flex flex-wrap gap-1">
            <select aria-label="Switch NEXORA project" value={activeProject?.id||""} onChange={event=>setActiveId(event.target.value)} className="max-w-[180px] border border-slate-700 bg-[#080d12] p-2 text-xs text-cyan-100">{projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select>
            <button type="button" onClick={createNewProject} className="border border-amber-700/40 px-2 py-1.5 text-[10px] font-bold text-amber-100">＋ NEW PROJECT</button>
            <button type="button" onClick={()=>importInputRef.current?.click()} className="border border-slate-700 px-2 py-1.5 text-[10px] font-bold text-cyan-100">IMPORT PROJECT</button>
            <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={!activeProject||busy} className="border border-cyan-700 bg-cyan-950/40 px-2 py-1.5 text-[10px] font-bold text-cyan-100 disabled:opacity-40">＋ IMPORT 3D / MEDIA</button>
          </div></div>
          <div className="mt-2 flex flex-wrap items-center gap-3 border border-amber-800/40 bg-[#18140d] p-2 text-[10px] text-amber-100">
            <label className="flex items-center gap-2"><input type="checkbox" checked={videoRightsConfirmed} onChange={event=>setVideoRightsConfirmed(event.target.checked)}/> I own this video or have permission to use it</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={originalAssetsConfirmed} onChange={event=>setOriginalAssetsConfirmed(event.target.checked)}/> Generate original assets; do not copy protected source assets</label>
          </div>
          <input ref={importInputRef} type="file" accept=".json,.nexora.json,application/json" className="hidden" onChange={importProject}/>
          <input ref={fileInputRef} type="file" multiple accept=".glb,.gltf,.obj,.fbx,.ply,.bin,.png,.jpg,.jpeg,.webp,.wav,.ogg,.mp3,.mp4,.mov,.mkv,.webm,.avi" className="hidden" onChange={uploadAssets}/>
          <AndroidBuildConsole
            settings={androidBuild}
            onChange={setAndroidBuild}
            onBuild={(settings)=> {
              if (settings.artifact_format === "aab" && settings.build_type !== "release") {
                setNotice("Android App Bundles are release-only in NEXORA. Select Release before building an AAB.");
                return;
              }
              queueProductionJob("build.export","android",settings);
            }}
            iconAssets={studioAssets.filter((asset)=>asset.type === "png")}
            disabled={!cloudProjectActive || busy}
            deviceStatus="Android builds are exported by the NEXORA worker. USB/wireless installation and logcat use the paired local desktop bridge below."
          />
          <NexoraDeviceBridge packageId={androidBuild.package_id || "com.nexora.game"} />

          <div className="mt-3"><h3 className="mb-2 text-[10px] font-black tracking-widest text-amber-200">BUILT-IN 3D TEMPLATES · ADD TO SCENE</h3><div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">{templates.map(template=><div key={template.id} className="border border-slate-800 bg-[#111922] p-2"><button type="button" onClick={()=>setPreviewSelection({type:"template",id:template.id})} className="flex h-20 w-full items-center justify-center border border-cyan-900/30 bg-[#0a1118] text-cyan-200"><Box size={30}/></button><div className="mt-1 truncate text-[10px] font-bold">{template.name}</div><div className="text-[9px] text-slate-500">{template.category} · 3D template</div><button type="button" disabled={!activeProject} onClick={()=>addTemplateToScene(template)} className="mt-2 w-full border border-cyan-800 px-2 py-1 text-[9px] font-bold text-cyan-200 disabled:opacity-40">＋ ADD TO SCENE</button></div>)}</div></div>
          <div className="mt-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-[10px] font-black tracking-widest text-amber-200">YOUR 3D MODELS & MEDIA</h3><label className="text-[9px] text-slate-400">CONVERT AS <select value={assetConversionRole} onChange={e=>setAssetConversionRole(e.target.value)} className="ml-1 border border-slate-700 bg-[#080d12] px-2 py-1 text-[9px] text-cyan-100"><option value="prop">PROP</option><option value="character">CHARACTER</option><option value="environment">ENVIRONMENT</option></select></label></div><div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{studioAssets.map(asset=><div key={asset.id} className="min-w-0 border border-slate-800 bg-[#111922] p-2"><button type="button" onClick={()=>setPreviewSelection({type:"asset",id:asset.id})} className="flex h-20 w-full items-center justify-center bg-gradient-to-br from-cyan-950/60 to-slate-900 text-cyan-300"><ImagePlus size={24}/></button><div className="mt-1 truncate text-[10px] font-bold" title={asset.name}>{asset.name}</div><div className="truncate text-[9px] text-slate-500">{asset.type.toUpperCase()} · {asset.remote?asset.status:"LOCAL"}</div><div className="mt-1 flex gap-1">{["glb","gltf"].includes(asset.type)&&<button type="button" onClick={()=>addAssetToScene(asset)} className="flex-1 border border-cyan-800 px-1 py-1 text-[9px] text-cyan-200">USE MODEL</button>}{["png","jpg","jpeg","webp","glb","gltf","obj","fbx","ply"].includes(asset.type)&&<button type="button" onClick={()=>convertAssetToGameAsset(asset,assetConversionRole)} className="flex-1 border border-violet-800 px-1 py-1 text-[9px] text-violet-200">CONVERT</button>}{["mp4","mov","mkv","webm","avi","wav","ogg","mp3"].includes(asset.type)&&<button type="button" onClick={()=>addAssetToTimeline(asset)} className="flex-1 border border-cyan-800 px-1 py-1 text-[9px] text-cyan-200">ADD TO TIMELINE</button>}<button type="button" onClick={()=>removeAsset(asset)} className="border border-slate-700 px-1 py-1 text-[9px] text-rose-300">DEL</button></div></div>)}</div>{!studioAssets.length&&<div className="mt-3 border border-dashed border-slate-700 p-5 text-center text-xs text-slate-500">Import source media, 3D models and templates to begin.</div>}</div>
        </section>

        <CreatorFlowPanel activeProject={activeProject} apiRequest={apiRequest} cloudProjectActive={cloudProjectActive} setNotice={setNotice} nexoraAuthFetch={nexoraAuthFetch} />

        <section className="grid gap-2 lg:grid-cols-2">
          <div className="border border-cyan-900/60 bg-[#0b1118] p-3"><h2 className="text-xs font-black text-cyan-200">SCENE HIERARCHY / INSPECTOR</h2><div className="mt-2 grid grid-cols-1 gap-3 xl:grid-cols-2"><div className="max-h-48 overflow-auto">{sceneNodes.map(object=><button key={object.id} type="button" onClick={()=>setSelectedObjectId(object.id)} className={"mb-1 block w-full truncate border px-2 py-1.5 text-left text-[10px] "+(selectedObject?.id===object.id?"border-cyan-500 bg-cyan-950/40":"border-slate-800 bg-[#101820]")}>{object.name} · {object.type}</button>)}<button type="button" onClick={addSceneObject} className="mt-1 w-full border border-cyan-800 px-2 py-1.5 text-[9px]">＋ ADD SCENE NODE</button></div>
            {selectedObject&&<div className="space-y-2"><label className="block text-[9px] text-slate-400">OBJECT NAME<input className={fieldClass+" mt-1"} value={selectedObject.name} onChange={event=>updateSelected("name",event.target.value)}/></label>{["position","rotation","scale"].map(field=><fieldset key={field}><legend className="text-[9px] uppercase text-slate-500">{field}</legend><div className="grid grid-cols-3 gap-1">{(selectedObject[field]||[0,0,0]).map((value,index)=><input key={index} aria-label={field+" "+index} className={fieldClass} type="number" step="0.1" value={value} onChange={event=>{const next=[...(selectedObject[field]||[0,0,0])];next[index]=Number(event.target.value);updateSelected(field,next);}}/>)}</div></fieldset>)}<button type="button" onClick={()=>patchProject(project=>({...project,scene:{...project.scene,objects:project.scene.objects.filter(item=>item.id!==selectedObject.id)}}))} className="border border-rose-900 px-2 py-1 text-[9px] text-rose-300">DELETE SELECTED OBJECT</button></div>}</div></div>
          <div className="border border-cyan-900/60 bg-[#0b1118] p-3"><h2 className="text-xs font-black text-cyan-200">WORKSPACE OPERATIONS</h2><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={saveRevision} className="border border-slate-700 px-3 py-2 text-[9px]">SAVE CHECKPOINT</button><button type="button" onClick={exportProject} className="border border-slate-700 px-3 py-2 text-[9px]">EXPORT PROJECT JSON</button><button type="button" onClick={deleteProject} className="border border-rose-900 px-3 py-2 text-[9px] text-rose-300">DELETE PROJECT</button><button type="button" onClick={checkService} className="border border-slate-700 px-3 py-2 text-[9px]">CHECK SERVICE</button></div>{validationIssues.length>0&&<div className="mt-2 text-[9px] text-amber-200">{validationIssues.join(" · ")}</div>}</div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-[#080d12] px-3 py-2 text-[9px] text-slate-500"><div className="flex flex-wrap gap-3"><span>PROJECT: {activeProject?.name||"—"}</span><span>AUTO-SAVE: {activeProject?.updatedAt?new Date(activeProject.updatedAt).toLocaleTimeString():"—"}</span><span>VERSION: NEXORA STUDIO PRO</span><span>{cloudProjectActive?"CLOUD PROJECT":"LOCAL DRAFT"}</span></div><div className="flex gap-3"><span>MEMORY: {sceneNodes.length} SCENE NODES</span><span>GPU LOAD: NOT MEASURED BY BROWSER</span></div></footer>
      </div>
    </div>
  );

}
