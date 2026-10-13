// Persistent cache for backend-processed Faith study materials.
// IndexedDB is preferred because full lesson text can exceed localStorage limits.

const DB_NAME = "revelacode-faith-study-cache";
const STORE_NAME = "records";
const DB_VERSION = 1;
const FALLBACK_PREFIX = "revelacode_faith_study_cache_v1::";
let databasePromise = null;

function normalizeScope(scope) {
  return String(scope || "default").trim().replace(/\/+$/, "") || "default";
}

function libraryKey(scope) {
  return `library::${normalizeScope(scope)}`;
}

function materialKey(scope, id) {
  return `material::${normalizeScope(scope)}::${String(id || "").trim()}`;
}

function getMaterialId(material) {
  const value = material?.id ?? material?._id ?? material?.material_id ?? material?.materialId;
  return value == null ? "" : String(value).trim();
}

function openDatabase() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  if (!databasePromise) {
    databasePromise = new Promise((resolve) => {
      let request;
      try {
        request = indexedDB.open(DB_NAME, DB_VERSION);
      } catch {
        resolve(null);
        return;
      }

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
  }

  return databasePromise;
}

function readLocalFallback(key) {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(FALLBACK_PREFIX + key);
    if (!raw) return null;
    const record = JSON.parse(raw);
    return record && typeof record === "object" ? record : null;
  } catch {
    return null;
  }
}

async function readRecord(key) {
  const db = await openDatabase();

  if (db) {
    try {
      const record = await new Promise((resolve) => {
        let transaction;
        try {
          transaction = db.transaction(STORE_NAME, "readonly");
          const request = transaction.objectStore(STORE_NAME).get(key);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
          transaction.onerror = () => resolve(null);
          transaction.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
      if (record) return record;
    } catch {
      // Try the small-data fallback below.
    }
  }

  return readLocalFallback(key);
}

async function writeRecord(key, value) {
  const record = {
    key,
    value,
    savedAt: new Date().toISOString(),
  };
  const db = await openDatabase();

  if (db) {
    try {
      const saved = await new Promise((resolve) => {
        let transaction;
        try {
          transaction = db.transaction(STORE_NAME, "readwrite");
          transaction.objectStore(STORE_NAME).put(record);
          transaction.oncomplete = () => resolve(true);
          transaction.onerror = () => resolve(false);
          transaction.onabort = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
      if (saved) return record;
    } catch {
      // Try the localStorage fallback below.
    }
  }

  try {
    if (typeof window === "undefined") return null;
    const serialized = JSON.stringify(record);
    // Avoid filling a browser's small localStorage quota with large lessons.
    if (serialized.length > 1_500_000) return null;
    window.localStorage.setItem(FALLBACK_PREFIX + key, serialized);
    return record;
  } catch {
    return null;
  }
}

export async function getCachedLibrary(scope) {
  const record = await readRecord(libraryKey(scope));
  if (!record || !Array.isArray(record.value)) return null;
  return { materials: record.value, savedAt: record.savedAt || null };
}

export async function saveCachedLibrary(scope, materials) {
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const collectionRecord = await writeRecord(libraryKey(scope), safeMaterials);

  // Cache individual content-bearing documents as well, so the reader can
  // open a lesson without first loading the complete library again.
  await Promise.all(
    safeMaterials
      .filter((material) => getMaterialId(material) && typeof material?.content === "string" && material.content.trim())
      .map((material) => writeRecord(materialKey(scope, getMaterialId(material)), material)),
  );

  return collectionRecord?.savedAt || null;
}

export async function getCachedMaterial(scope, id) {
  if (id == null || String(id).trim() === "") return null;
  const record = await readRecord(materialKey(scope, id));
  if (!record || !record.value || typeof record.value !== "object") return null;
  return { material: record.value, savedAt: record.savedAt || null };
}

export async function saveCachedMaterial(scope, id, material) {
  const resolvedId = id == null || String(id).trim() === "" ? getMaterialId(material) : String(id).trim();
  if (!resolvedId || !material || typeof material !== "object") return null;
  const record = await writeRecord(materialKey(scope, resolvedId), material);
  return record ? { savedAt: record.savedAt } : null;
}
