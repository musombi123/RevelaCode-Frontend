// Persistent cache for backend-processed Faith study materials.
// IndexedDB is preferred because full lesson text can exceed localStorage limits.

const DB_NAME = "revelacode-faith-study-cache";
const STORE_NAME = "records";
const DB_VERSION = 1;

const STUDY_API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");

export const FAITH_LIBRARY_CACHE_SCOPE = STUDY_API_BASE + "/faith-library-v3";

const FAITH_TOPIC_PATTERN = /\b(faith|scripture|bible|biblical|christian|theolog(?:y|ical|ian)?|religious? studies|devotional|prophecy|adventist|sda|catholic|interfaith|jewish|judaism|islam|qur['’]?an|muslim|spiritual|church|worship|sanctuary|gospel|prayer|comparative|daily[\s-]+life|faith[\s-]+academy)\b/i;
const NON_FAITH_TOPIC_PATTERN = /\b(cpa|accounting|entrepreneurship|software development|technology(?:\s*&\s*innovation)?|business|inventory|finance|stock management|computer science|programming|agriculture|farming|chemistry|physics|biology|mathematics|economics)\b/i;
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


/* =========================================================
   FAITH CATALOGUE NORMALIZATION
========================================================= */

function plainText(value) {
  if (Array.isArray(value)) return value.map(plainText).filter(Boolean).join(" ");
  if (value == null || typeof value === "object") return "";
  return String(value).replace(/\s+/g, " ").trim();
}

export function normalizeFaithStudyMaterials(rawMaterials) {
  const rows = Array.isArray(rawMaterials) ? rawMaterials : [];
  const seenIds = new Set();
  const seenFingerprints = new Set();
  const output = [];

  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const id = getMaterialId(raw);
    if (!id || seenIds.has(id) || raw.published === false) continue;

    const metadata = raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {};
    const taxonomicFields = [
      raw.category, raw.subcategory, raw.subject, raw.topic, raw.hub,
      raw.discipline, raw.tags, metadata.category, metadata.subcategory,
      metadata.subject, metadata.topic, metadata.hub, metadata.discipline,
      metadata.tags,
    ].map(plainText).filter(Boolean);

    if (taxonomicFields.some((field) => NON_FAITH_TOPIC_PATTERN.test(field))) continue;

    const hasFaithClassification = taxonomicFields.some((field) => FAITH_TOPIC_PATTERN.test(field));
    const hasCuratedEditorialSlug = Boolean(plainText(metadata.catalog_slug));
    const titleAndDescription = [
      raw.title, raw.description, raw.summary,
      metadata.editorial_summary, metadata.tradition,
    ].map(plainText).join(" ");
    if (NON_FAITH_TOPIC_PATTERN.test(titleAndDescription)) continue;
    if (!hasFaithClassification && !hasCuratedEditorialSlug) continue;

    const title = plainText(raw.title).toLowerCase();
    const description = plainText(raw.description || raw.summary || metadata.editorial_summary).toLowerCase();
    const content = plainText(raw.content).slice(0, 1400).toLowerCase();
    const taxonomy = taxonomicFields.join("|").toLowerCase();
    const fingerprint = [title, taxonomy, description, content].join("::");
    if (seenFingerprints.has(fingerprint)) continue;

    seenIds.add(id);
    seenFingerprints.add(fingerprint);
    output.push({ ...raw, id: String(id) });
  }

  return output;
}

/**
 * Refresh the Faith library in the background after the platform opens.
 * The application remains usable while cached material is being warmed.
 */
export async function warmFaithStudyCache() {
  let previous = null;
  try {
    previous = await getCachedLibrary(FAITH_LIBRARY_CACHE_SCOPE);
    if (previous && Array.isArray(previous.materials)) {
      const sanitized = normalizeFaithStudyMaterials(previous.materials);
      if (JSON.stringify(sanitized) !== JSON.stringify(previous.materials)) {
        await saveCachedLibrary(FAITH_LIBRARY_CACHE_SCOPE, sanitized);
      }
    }
  } catch {
    previous = null;
  }

  if (typeof fetch !== "function" || !STUDY_API_BASE) {
    return { source: previous ? "cache" : "unavailable", count: previous?.materials?.length || 0 };
  }

  try {
    const response = await fetch(
      STUDY_API_BASE + "/api/study/materials?category=faith&limit=100",
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return { source: previous ? "cache" : "unavailable", count: previous?.materials?.length || 0 };
    }

    const payload = await response.json().catch(() => ({}));
    const raw = Array.isArray(payload?.materials)
      ? payload.materials
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    const normalized = normalizeFaithStudyMaterials(raw);
    await saveCachedLibrary(FAITH_LIBRARY_CACHE_SCOPE, normalized);
    return { source: "network", count: normalized.length };
  } catch {
    return { source: previous ? "cache" : "unavailable", count: previous?.materials?.length || 0 };
  }
}

export async function getCachedBibleBook(bookKey) {
  if (!bookKey) return null;
  const record = await readRecord("bible::web::" + String(bookKey).trim());
  return record?.value && typeof record.value === "object" ? record.value : null;
}

export async function saveCachedBibleBook(bookKey, book) {
  if (!bookKey || !book || typeof book !== "object") return false;
  const record = await writeRecord("bible::web::" + String(bookKey).trim(), book);
  return Boolean(record);
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
