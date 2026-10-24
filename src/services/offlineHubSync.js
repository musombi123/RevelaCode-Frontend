const DB_NAME = "revelacode-offline-workspace-v1";
const DB_VERSION = 1;
const CACHE_TTL = 14 * 24 * 60 * 60 * 1000;
const QUEUE_STORE = "mutations";
const CACHE_STORE = "apiCache";
const SESSION_STORE = "sessions";
const ACTIVITY_STORE = "activity";
const locks = new Set();

function hasIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function safeScope(scope) {
  return String(scope || "").trim().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function offlineScopeForUser(user) {
  const id = user && (user.id || user._id || user.user_id || user.userId || user.uid);
  return id === undefined || id === null || String(id).trim() === ""
    ? ""
    : "user:" + safeScope(id);
}

export function isBrowserOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function openDatabase() {
  if (!hasIndexedDb()) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(CACHE_STORE)) db.createObjectStore(CACHE_STORE, { keyPath: "key" });
      if (!db.objectStoreNames.contains(SESSION_STORE)) db.createObjectStore(SESSION_STORE, { keyPath: "key" });
      if (!db.objectStoreNames.contains(ACTIVITY_STORE)) db.createObjectStore(ACTIVITY_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Offline storage could not be opened."));
  });
}

function localFallbackKey(store, key) {
  return "revelacode_offline_v1:" + store + ":" + key;
}

async function storeGet(storeName, key) {
  try {
    const db = await openDatabase();
    if (!db) {
      const raw = localStorage.getItem(localFallbackKey(storeName, key));
      return raw ? JSON.parse(raw) : null;
    }
    return await new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
      request.onsuccess = () => {
        const value = request.result || null;
        db.close();
        if (value) {
          resolve(value);
          return;
        }
        try {
          const raw = localStorage.getItem(localFallbackKey(storeName, key));
          resolve(raw ? JSON.parse(raw) : null);
        } catch {
          resolve(null);
        }
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    try {
      const raw = localStorage.getItem(localFallbackKey(storeName, key));
      return raw ? JSON.parse(raw) : null;
    } catch {
      console.warn("[Offline workspace] IndexedDB and fallback read failed:", error);
      return null;
    }
  }
}

async function storePut(storeName, item) {
  try {
    const db = await openDatabase();
    if (!db) {
      localStorage.setItem(localFallbackKey(storeName, item.key || item.id), JSON.stringify(item));
      return true;
    }
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put(item);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Offline storage transaction aborted."));
    });
    db.close();
    try { localStorage.removeItem(localFallbackKey(storeName, item.key || item.id)); } catch { /* IndexedDB is the durable primary store. */ }
    return true;
  } catch (error) {
    try {
      localStorage.setItem(localFallbackKey(storeName, item.key || item.id), JSON.stringify(item));
      return true;
    } catch {
      console.warn("[Offline workspace] IndexedDB and fallback write failed:", error);
      return false;
    }
  }
}

async function storeDelete(storeName, key) {
  try {
    const db = await openDatabase();
    if (!db) {
      localStorage.removeItem(localFallbackKey(storeName, key));
      return;
    }
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).delete(key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
    try { localStorage.removeItem(localFallbackKey(storeName, key)); } catch { /* Fall back is optional when storage is restricted. */ }
  } catch (error) {
    try {
      localStorage.removeItem(localFallbackKey(storeName, key));
    } catch {
      console.warn("[Offline workspace] IndexedDB and fallback delete failed:", error);
    }
  }
}

async function storeAll(storeName) {
  try {
    const db = await openDatabase();
    if (!db) {
      const prefix = "revelacode_offline_v1:" + storeName + ":";
      const values = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith(prefix)) continue;
        try { values.push(JSON.parse(localStorage.getItem(key))); } catch { /* Ignore corrupted local entries. */ }
      }
      return values;
    }
    return await new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
      request.onsuccess = () => {
        const indexed = Array.isArray(request.result) ? request.result : [];
        db.close();
        const prefix = "revelacode_offline_v1:" + storeName + ":";
        const localRows = [];
        try {
          for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (!key || !key.startsWith(prefix)) continue;
            try { localRows.push(JSON.parse(localStorage.getItem(key))); } catch { /* Ignore corrupted local entries. */ }
          }
        } catch { /* IndexedDB rows remain available if localStorage is blocked. */ }
        const merged = new Map();
        localRows.forEach((item) => merged.set(item?.key || item?.id, item));
        indexed.forEach((item) => merged.set(item?.key || item?.id, item));
        resolve(Array.from(merged.values()).filter(Boolean));
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    try {
      const prefix = "revelacode_offline_v1:" + storeName + ":";
      const values = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith(prefix)) continue;
        try { values.push(JSON.parse(localStorage.getItem(key))); } catch { /* Ignore corrupted entries. */ }
      }
      return values;
    } catch {
      console.warn("[Offline workspace] IndexedDB and fallback list failed:", error);
      return [];
    }
  }
}

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("revelacode:offline-sync-change"));
  }
}

function isSensitiveOrUnsafePath(url) {
  let path = "";
  try {
    path = new URL(url, typeof window !== "undefined" ? window.location.origin : "https://localhost").pathname.toLowerCase();
  } catch {
    path = String(url || "").toLowerCase();
  }
  return /\/(auth|login|logout|password|token|otp|checkout|payment|payments|wallet|billing|subscription|subscriptions|entitlement|entitlements|fees|invoice|invoices|receipt|receipts|reconcile|refund|admin|moderation|verification|review|invite|invitations|permissions|access|media|upload|documents?\/upload)(\/|$)/i.test(path);
}

function hasSensitivePayload(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 8) return false;
  if (Array.isArray(value)) return value.some((item) => hasSensitivePayload(item, depth + 1));
  return Object.entries(value).some(([key, item]) =>
    /password|passkey|token|secret|otp|pin|credential|authorization|auth_code|private_key/i.test(key) ||
    hasSensitivePayload(item, depth + 1)
  );
}


export function shouldQueueOfflineMutation(url, method, body) {
  const verb = String(method || "GET").toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(verb)) return false;
  if (body === undefined || body === null || typeof body === "string") return false;
  if (hasSensitivePayload(body)) return false;
  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  if (body instanceof Blob || body instanceof ArrayBuffer || body instanceof URLSearchParams) return false;
  let path = "";
  try { path = new URL(url, window.location.origin).pathname.toLowerCase(); }
  catch { return false; }
  if (isSensitiveOrUnsafePath(path)) return false;
  const allowed = [
    "/api/jumuiya/biashara/",
    "/api/jumuiya/elimu/",
    "/api/jumuiya/shamba/",
    "/api/jumuiya/community/",
    "/api/jumuiya/marketplace/",
  ].some((prefix) => path.startsWith(prefix));
  const profileWrite = path === "/api/jumuiya/identity/profile";
  // User history is a small JSON mutation with a stable entry ID. The backend
  // deduplicates it by ID, so replay after reconnect is safe.
  const historyWrite = path === "/api/user/history" && verb === "POST";
  return (allowed || profileWrite || historyWrite) && Boolean(path);
}

export function createOfflineQueuedError() {
  const error = new Error("No connection. Your change has been saved on this device and will sync automatically when you reconnect.");
  error.name = "OfflineQueuedError";
  error.status = 0;
  error.code = "offline_queued";
  error.queued = true;
  return error;
}

export async function readCachedApiResponse(scope, url) {
  const owner = safeScope(scope);
  if (!owner || isSensitiveOrUnsafePath(url)) return { hit: false, payload: null };
  const key = owner + "::" + String(url);
  const item = await storeGet(CACHE_STORE, key);
  if (!item || !Number.isFinite(item.savedAt) || Date.now() - item.savedAt > CACHE_TTL) {
    if (item) await storeDelete(CACHE_STORE, key);
    return { hit: false, payload: null };
  }
  return { hit: true, payload: item.payload, savedAt: item.savedAt };
}

export async function writeCachedApiResponse(scope, url, payload) {
  const owner = safeScope(scope);
  if (!owner || isSensitiveOrUnsafePath(url)) return false;
  if (payload === undefined) return false;
  const key = owner + "::" + String(url);
  const saved = await storePut(CACHE_STORE, { key, scope: owner, url: String(url), payload, savedAt: Date.now() });
  if (saved) emitChange();
  return saved;
}

export async function queueOfflineMutation({ scope, url, method, body }) {
  const owner = safeScope(scope);
  if (!owner || !shouldQueueOfflineMutation(url, method, body)) return false;
  let serializedBody;
  try { serializedBody = JSON.stringify(body); }
  catch { return false; }
  if (typeof serializedBody !== "string" || serializedBody.length > 1024 * 1024) return false;
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "offline-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  const item = {
    id,
    key: id,
    scope: owner,
    url: String(url),
    method: String(method).toUpperCase(),
    body: serializedBody,
    status: "pending",
    createdAt: Date.now(),
    attempts: 0,
    lastError: "",
  };
  const saved = await storePut(QUEUE_STORE, item);
  if (saved) {
    await storePut(ACTIVITY_STORE, {
      id: "activity:" + id,
      scope: owner,
      kind: "offline_change_queued",
      title: "Change saved for sync",
      detail: item.method + " " + new URL(item.url, typeof window !== "undefined" ? window.location.origin : "https://localhost").pathname,
      createdAt: item.createdAt,
    });
    emitChange();
  }
  return saved;
}

export async function getOfflineQueueStatus(scope) {
  const owner = safeScope(scope);
  if (!owner) return { pending: 0, failed: 0, total: 0, latest: [] };
  const rows = (await storeAll(QUEUE_STORE)).filter((item) => item && item.scope === owner);
  const pending = rows.filter((item) => item.status === "pending" || item.status === "sending").length;
  const failed = rows.filter((item) => item.status === "failed" || item.status === "blocked").length;
  return { pending, failed, total: rows.length, latest: rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5) };
}

export async function recordOfflineActivity(scope, activity = {}) {
  const owner = safeScope(scope);
  if (!owner) return false;
  const id = "activity:" + owner + ":" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2));
  const entry = {
    id,
    scope: owner,
    kind: String(activity.kind || "platform_activity").slice(0, 80),
    title: String(activity.title || "Platform activity").slice(0, 160),
    detail: String(activity.detail || "").slice(0, 400),
    createdAt: Date.now(),
  };
  const saved = await storePut(ACTIVITY_STORE, entry);
  if (saved) emitChange();
  return saved;
}

export async function getRecentOfflineActivity(scope, limit = 12) {
  const owner = safeScope(scope);
  if (!owner) return [];
  return (await storeAll(ACTIVITY_STORE))
    .filter((item) => item && item.scope === owner)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, Math.max(1, Math.min(50, Number(limit) || 12)));
}

export async function saveOfflineSession(scope, data = {}) {
  const owner = safeScope(scope);
  if (!owner) return false;
  const key = owner + "::session";
  return storePut(SESSION_STORE, {
    key,
    scope: owner,
    activeHub: String(data.activeHub || ""),
    pathname: String(data.pathname || "/"),
    search: String(data.search || ""),
    scrollY: Math.max(0, Number(data.scrollY) || 0),
    savedAt: Date.now(),
  });
}

export async function readOfflineSession(scope) {
  const owner = safeScope(scope);
  if (!owner) return null;
  return storeGet(SESSION_STORE, owner + "::session");
}

export async function flushOfflineQueue({ scope, authFetch }) {
  const owner = safeScope(scope);
  if (!owner || !authFetch || isBrowserOffline()) return { synced: 0, pending: 0, failed: 0 };
  if (locks.has(owner)) return getOfflineQueueStatus(owner);
  locks.add(owner);
  let synced = 0;
  try {
    const rows = (await storeAll(QUEUE_STORE))
      .filter((item) => item && item.scope === owner && item.status === "pending")
      .sort((a, b) => a.createdAt - b.createdAt);
    for (const item of rows) {
      if (isBrowserOffline()) break;
      await storePut(QUEUE_STORE, { ...item, status: "sending", attempts: (item.attempts || 0) + 1 });
      let response;
      try {
        response = await authFetch(item.url, {
          method: item.method,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Idempotency-Key": item.id,
            "X-Offline-Mutation-Id": item.id,
          },
          body: item.method === "DELETE" && (!item.body || item.body === "null") ? undefined : item.body,
        });
      } catch (error) {
        await storePut(QUEUE_STORE, { ...item, status: "pending", attempts: (item.attempts || 0) + 1, lastError: error?.message || "Network unavailable." });
        break;
      }
      if (response && response.ok) {
        await storeDelete(QUEUE_STORE, item.id);
        await storePut(ACTIVITY_STORE, {
          id: "activity:synced:" + item.id,
          scope: owner,
          kind: "offline_change_synced",
          title: "Offline change synced",
          detail: item.method + " " + new URL(item.url, window.location.origin).pathname,
          createdAt: Date.now(),
        });
        synced += 1;
        emitChange();
        continue;
      }
      let message = "Server rejected the offline change (HTTP " + (response ? response.status : "unknown") + ").";
      try {
        const payload = await response.clone().json();
        message = payload?.message || payload?.error?.message || payload?.error || message;
      } catch { /* Response body may not be JSON. */ }
      const status = response && [400, 401, 403, 404, 409, 422].includes(response.status) ? "failed" : "pending";
      await storePut(QUEUE_STORE, { ...item, status, attempts: (item.attempts || 0) + 1, lastError: String(message).slice(0, 500) });
      emitChange();
      if (status === "pending") break;
    }
  } finally {
    locks.delete(owner);
  }
  const status = await getOfflineQueueStatus(owner);
  emitChange();
  return { synced, pending: status.pending, failed: status.failed };
}

export async function retryFailedOfflineMutation(scope, id) {
  const owner = safeScope(scope);
  const item = await storeGet(QUEUE_STORE, id);
  if (!owner || !item || item.scope !== owner || !["failed", "blocked"].includes(item.status)) return false;
  const saved = await storePut(QUEUE_STORE, { ...item, status: "pending", lastError: "" });
  if (saved) emitChange();
  return saved;
}

export async function clearFailedOfflineMutation(scope, id) {
  const owner = safeScope(scope);
  const item = await storeGet(QUEUE_STORE, id);
  if (!owner || !item || item.scope !== owner || !["failed", "blocked"].includes(item.status)) return false;
  await storeDelete(QUEUE_STORE, id);
  emitChange();
  return true;
}

export function subscribeOfflineSync(listener) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  window.addEventListener("focus", listener);
  document.addEventListener("visibilitychange", listener);
  window.addEventListener("revelacode:offline-sync-change", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
    window.removeEventListener("focus", listener);
    document.removeEventListener("visibilitychange", listener);
    window.removeEventListener("revelacode:offline-sync-change", listener);
  };
}
