/**
 * RevelaAI v2.0 client-side routing and local-memory utilities.
 * This module supplies routing metadata and local attachment analysis only.
 * Generative chat and image requests must use the RevelaAI server API.
 */
import { assessEmotion, analyzeImageFile, analyzeVideoFile } from "./localIntelligence";
import { loadLocalVisionAssets, scanCanvas } from "../freeVisionEngine";

export const LIVING_BRAIN_VERSION = "2.0";
export const LIVING_BRAIN_LOG = "RevelaAI v2.0 - Living AGI - 5 Hubs - Self-Healing - Self-Learning - Free";

export const LIVING_HUBS = [
  { id: "mkulima", label: "Mkulima", subtitle: "Agriculture", icon: "Sprout", terms: /\b(farm|farmer|farming|crop|maize|corn|beans|soil|irrigat|harvest|livestock|poultry|dairy|pest|fertili[sz]er|shamba|mkulima|rainfall|seedlings?)\b/i },
  { id: "biashara", label: "Biashara", subtitle: "Business", icon: "Briefcase", terms: /\b(business|biashara|sales|revenue|profit|margin|customer|marketing|price|pricing|negotia|contract|cash flow|inventory|startup|tender|invoice|costs?)\b/i },
  { id: "elimu", label: "Elimu", subtitle: "Education", icon: "GraduationCap", terms: /\b(teach|teacher|student|school|classroom|learn|lesson|exam|curriculum|cbc|elimu|timetable|assessment|homework|education|study plan)\b/i },
  { id: "mahubiri", label: "Mahubiri", subtitle: "Scripture", icon: "BookOpen", terms: /\b(bible|biblical|scripture|verse|jesus|christ|god|sermon|preach|theolog|mahubiri|prayer|sabbath|prophecy|kjv|niv|psalm|gospel|church|faith)\b/i },
  { id: "general", label: "General", subtitle: "Everyday + technical", icon: "Sparkles", terms: /$^/ },
];

export function routeLivingHub(message, preferredHub = "auto", workspace = "") {
  const text = String(message || "");
  const selected = String(preferredHub || "auto").toLowerCase();
  if (selected !== "auto" && LIVING_HUBS.some((hub) => hub.id === selected)) {
    return { hub: selected, reason: "explicit hub selected" };
  }
  // Preserve the active workspace only when it is one of the five brain hubs.
  if (selected === "auto" && LIVING_HUBS.some((hub) => hub.id === String(workspace || "").toLowerCase())) {
    const workspaceId = String(workspace).toLowerCase();
    const workspaceHub = LIVING_HUBS.find((hub) => hub.id === workspaceId);
    if (workspaceHub && workspaceHub.terms.test(text)) return { hub: workspaceId, reason: "active workspace and message matched" };
  }
  const ranked = LIVING_HUBS.filter((hub) => hub.id !== "general")
    .map((hub) => ({ hub, count: (text.match(new RegExp(hub.terms.source, "ig")) || []).length }))
    .sort((a, b) => b.count - a.count);
  if (ranked[0]?.count > 0) return { hub: ranked[0].hub.id, reason: "local keyword routing" };
  return { hub: "general", reason: "no specialist keyword match" };
}

function currentDataRequest(text) {
  return /\\b(latest|today|right now|current price|current news|weather today|live score|current exchange rate)\\b/i.test(String(text || ""));
}

/**
 * Routing and local memory metadata only.
 *
 * This module deliberately does not generate user-facing answers. Normal chat
 * and image generation must be handled by RevelaAI's server-side model/API.
 * Returning an empty reply prevents this heuristic router from masquerading as
 * a generative model when the API is unavailable.
 */
export function composeLivingResponse(message, preferredHub = "auto", workspace = "", memory = null) {
  const text = String(message || "").trim();
  const emotion = assessEmotion(text);
  const route = routeLivingHub(text, preferredHub, workspace);
  const hub = LIVING_HUBS.find((item) => item.id === route.hub) || LIVING_HUBS[LIVING_HUBS.length - 1];

  return {
    reply: "",
    hub: route.hub,
    hubLabel: hub.label,
    routeReason: route.reason,
    emotionEstimate: emotion?.emotion || "neutral",
    intent: !text
      ? "empty"
      : currentDataRequest(text)
        ? "current_information_needs_source"
        : "routed_to_generative_ai",
    engine: "local-intent-router",
    networkUsed: false,
    confidence: "heuristic",
  };
}

const DB_NAME = "revelaai-living-memory-v2";
const DB_VERSION = 1;
const STORE_TURNS = "turns";
const STORE_PROFILE = "profile";
const STORE_DIAGNOSTICS = "diagnostics";
const safeText = (value, limit = 2000) => String(value || "").slice(0, limit);
const userKey = (scope) => safeText(scope || "guest", 160) || "guest";

function openMemoryDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is unavailable"));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_TURNS)) {
        const store = db.createObjectStore(STORE_TURNS, { keyPath: "id" });
        store.createIndex("scope", "scope", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PROFILE)) {
        const store = db.createObjectStore(STORE_PROFILE, { keyPath: "id" });
        store.createIndex("scope", "scope", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_DIAGNOSTICS)) {
        db.createObjectStore(STORE_DIAGNOSTICS, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
    request.onblocked = () => reject(new Error("IndexedDB upgrade blocked"));
  });
}

function putRecord(storeName, record) {
  return openMemoryDatabase().then((db) => new Promise((resolve, reject) => {
    let tx;
    try {
      tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(record);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { const error = tx.error; db.close(); reject(error || new Error("IndexedDB write failed")); };
      tx.onabort = () => { db.close(); reject(new Error("IndexedDB write aborted")); };
    } catch (error) {
      db.close();
      reject(error);
    }
  }));
}

function getAllFromStore(storeName) {
  return openMemoryDatabase().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => { const result = request.result || []; db.close(); resolve(result); };
    request.onerror = () => { const error = request.error; db.close(); reject(error || new Error("IndexedDB read failed")); };
  }));
}

export async function recordConversationTurn({ scope, userText, assistantText, hub = "general", emotion = "neutral" }) {
  const normalizedScope = userKey(scope);
  const record = {
    id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2),
    scope: normalizedScope,
    userText: safeText(userText),
    assistantText: safeText(assistantText),
    hub: safeText(hub, 32),
    emotionEstimate: safeText(emotion, 32),
    createdAt: Date.now(),
  };
  try {
    await putRecord(STORE_TURNS, record);
    const all = await getAllFromStore(STORE_TURNS);
    const owned = all.filter((item) => item.scope === normalizedScope).sort((a, b) => a.createdAt - b.createdAt);
    // Keep memory bounded on lower-end Android devices.
    const staleIds = owned.slice(0, Math.max(0, owned.length - 500)).map((item) => item.id);
    if (staleIds.length) {
      const db = await openMemoryDatabase();
      await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_TURNS, "readwrite");
          const store = tx.objectStore(STORE_TURNS);
          staleIds.forEach((id) => store.delete(id));
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); resolve(); };
          tx.onabort = () => { db.close(); resolve(); };
        } catch {
          db.close();
          resolve();
        }
      });
    }
    try {
      const summaryKey = "revelaai.living.memory.v2:" + encodeURIComponent(normalizedScope);
      const existing = JSON.parse(localStorage.getItem(summaryKey) || '{"turns":0,"lastHub":"general","recent":[]}');
      const next = {
        turns: Number(existing.turns || 0) + 1,
        lastHub: record.hub,
        recent: [...(Array.isArray(existing.recent) ? existing.recent : []), {
          at: record.createdAt, hub: record.hub, userText: record.userText.slice(0, 180),
        }].slice(-20),
      };
      localStorage.setItem(summaryKey, JSON.stringify(next));
    } catch { /* Browser storage may be disabled or full. IndexedDB is primary. */ }
    // Learn narrowly from explicit, low-risk self-descriptions only.
    await learnExplicitPreference(normalizedScope, record.userText);
    return { ok: true, id: record.id };
  } catch (error) {
    await recordLocalDiagnostic("memory-write", error);
    // Existing chat history remains available through the dashboard's own localStorage.
    return { ok: false, reason: "local-memory-unavailable" };
  }
}

async function learnExplicitPreference(scope, text) {
  const rules = [
    { key: "name", re: /\bmy name is ([A-Za-z][A-Za-z '-]{1,60})/i },
    { key: "preference", re: /\b(prefer|please use|i like answers)\s+([^.!?\n]{2,120})/i },
    { key: "project", re: /\bmy project is ([^.!?\n]{2,100})/i },
  ];
  for (const rule of rules) {
    const match = String(text || "").match(rule.re);
    if (!match) continue;
    const value = safeText(rule.key === "name" ? match[1].trim() : (match[2] || match[1]).trim(), 140);
    // Do not persist credentials, payment data, or high-risk health details.
    if (/password|passcode|api.?key|token|secret|bank account|medical|diagnos/i.test(value)) continue;
    const id = scope + ":" + rule.key;
    try {
      const db = await openMemoryDatabase();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROFILE, "readwrite");
        tx.objectStore(STORE_PROFILE).put({ id, scope, key: rule.key, value, updatedAt: Date.now() });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error("Profile write failed"));
        tx.onabort = () => reject(new Error("Profile write aborted"));
      });
      db.close();
      const localKey = "revelaai.living.profile.v2:" + encodeURIComponent(scope);
      const profile = JSON.parse(localStorage.getItem(localKey) || "{}");
      profile[rule.key] = value;
      localStorage.setItem(localKey, JSON.stringify(profile));
    } catch (error) {
      await recordLocalDiagnostic("profile-memory", error);
    }
  }
}

export async function getLocalBrainMemory(scope) {
  const normalizedScope = userKey(scope);
  try {
    const [turns, profiles] = await Promise.all([getAllFromStore(STORE_TURNS), getAllFromStore(STORE_PROFILE)]);
    return {
      turns: turns.filter((item) => item.scope === normalizedScope).sort((a, b) => b.createdAt - a.createdAt).slice(0, 30),
      profile: profiles.filter((item) => item.scope === normalizedScope).reduce((memo, item) => { memo[item.key] = item.value; return memo; }, {}),
    };
  } catch {
    try {
      const localKey = "revelaai.living.memory.v2:" + encodeURIComponent(normalizedScope);
      const summary = JSON.parse(localStorage.getItem(localKey) || '{"turns":0,"lastHub":"general","recent":[]}');
      return { turns: summary.recent || [], profile: JSON.parse(localStorage.getItem("revelaai.living.profile.v2:" + encodeURIComponent(normalizedScope)) || "{}") };
    } catch { return { turns: [], profile: {} }; }
  }
}

export async function recordLocalDiagnostic(operation, error) {
  const item = {
    id: Date.now() + "-" + Math.random().toString(16).slice(2),
    operation: safeText(operation, 80),
    errorType: safeText(error?.name || "Error", 80),
    at: Date.now(),
  };
  try {
    await putRecord(STORE_DIAGNOSTICS, item);
  } catch {
    try {
      const key = "revelaai.living.diagnostics.v2";
      const items = JSON.parse(localStorage.getItem(key) || "[]");
      items.push(item);
      localStorage.setItem(key, JSON.stringify(items.slice(-50)));
    } catch { /* A diagnostics failure must never crash chat. */ }
  }
}

export async function analyzeLocalImageForChat(file, prompt = "") {
  try {
    // Pixel-math fallback runs first so model/asset loading can never block a basic answer.
    const fallback = await analyzeImageFile(file);
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const scale = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return { ...fallback, prompt, engine: "pixel-math-fallback", fallback: true };
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        try {
          const assets = await loadLocalVisionAssets();
          const result = await scanCanvas(canvas, assets, { readText: true });
          return { ...result, fileName: file.name, prompt, engine: "local-vision-optional-assets", fallback: !result.objectModelReady && !result.text, summary: result.description || fallback.summary };
        } catch (error) {
          await recordLocalDiagnostic("vision-assets", error);
          return { ...fallback, prompt, engine: "pixel-math-fallback", fallback: true };
        }
      } finally {
        bitmap.close?.();
      }
    } catch (error) {
      await recordLocalDiagnostic("vision-canvas", error);
      return { ...fallback, prompt, engine: "pixel-math-fallback", fallback: true };
    }
  } catch (error) {
    await recordLocalDiagnostic("vision-primary", error);
    // Don't crash the conversation when browser image decoding or canvas access fails.
    return {
      fileName: file?.name || "image",
      summary: "I couldn't read this image on the device. Chat is still working. Try another image or describe the area you want inspected.",
      fallback: true, engine: "safe-vision-fallback",
    };
  }
}

export async function analyzeLocalVideoForChat(file, onProgress) {
  try {
    const video = await analyzeVideoFile(file, onProgress);
    return { ...video, fallback: false, engine: "local-video-frame-math" };
  } catch (error) {
    await recordLocalDiagnostic("video-analysis", error);
    return {
      duration: 0, frames: [], averageMotion: null,
      summary: "I couldn't decode this video in the browser. The chat still works. Try a shorter MP4/WebM clip or send a still frame instead.",
      fallback: true, engine: "safe-video-fallback",
    };
  }
}

console.log(LIVING_BRAIN_LOG);
