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

export const FAITH_LIBRARY_CACHE_SCOPE = STUDY_API_BASE + "/faith-library-v4-clean";

const FAITH_TOPIC_PATTERN = /\b(faith|scripture|bible|biblical|christian|theolog(?:y|ical|ian)?|religious? studies|devotional|prophecy|adventist|sda|catholic|interfaith|jewish|judaism|islam|qur['’]?an|muslim|spiritual|church|worship|sanctuary|gospel|prayer|comparative|daily[\s-]+life|faith[\s-]+academy)\b/i;
const NON_FAITH_TOPIC_PATTERN = /\b(cpa|accounting|entrepreneurship|software development|technology(?:\s*&\s*innovation)?|business|inventory|finance|stock management|computer science|programming|agriculture|farming|chemistry|physics|biology|mathematics|economics)\b/i;
// Common test/admin artefacts are excluded while legitimate studies discussing
// testing faith, prophecy, or testimony remain eligible.
const TEST_ARTIFACT_PATTERN = /\b(?:lorem\s+ipsum|placeholder(?:\s+(?:text|content|material|lesson|data))?|dummy(?:\s+(?:data|content|material|lesson|entry))?|mock(?:\s+(?:data|content|material|lesson|entry))?|fake\s+(?:data|content|material|lesson|entry)|test(?:ing)?[-\s]*(?:only|record|material|lesson|entry|document|content|data|item)|(?:record|material|lesson|entry|document|content|data|item)[-\s]*test|sample[-\s]*(?:material|lesson|entry|data|content)|demo[-\s]*(?:data|content|material|lesson|entry)|delete\s+me|do\s+not\s+use|qwerty|asdfghjkl)\b/i;
const TEST_TITLE_PATTERN = /^(?:untitled(?:\s+material)?|new\s+(?:material|lesson|document)|test(?:$|\s+(?:\d+|material|lesson|record|entry|document|content|data|item|only)|[-:#_]\S.*)|testing(?:$|\s+(?:\d+|material|lesson|record|entry|content|data|item|only)|[-:#_]\S.*)|(?:sample|demo)(?:$|\s+(?:\d+|material|lesson|record|entry|content|data|item|only)|[-:#_]\S.*)|dummy(?:$|\s+.*)|mock(?:$|\s+(?:\d+|data|content|material|lesson|entry)|[-:#_]\S.*)|placeholder(?:$|\s+.*)|lorem\s+ipsum.*|temp(?:orary)?(?:$|\s+.*)|asdf\w*|qwerty\w*|foo(?:\s+bar)?|xxx+|123+)$/i;
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
      let settled = false;
      let timeoutId = null;
      const finish = (db) => {
        if (settled) {
          try { db?.close(); } catch { /* ignore late database handles */ }
          return;
        }
        settled = true;
        if (timeoutId !== null) clearTimeout(timeoutId);
        if (db) db.onversionchange = () => db.close();
        resolve(db || null);
      };

      // Do not let an Android WebView IndexedDB stall leave study-cache reads pending.
      timeoutId = setTimeout(() => finish(null), 1800);
      try {
        request = indexedDB.open(DB_NAME, DB_VERSION);
      } catch {
        finish(null);
        return;
      }

      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "key" });
          }
        } catch {
          finish(null);
        }
      };
      request.onsuccess = () => finish(request.result);
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
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
    const titleText = plainText(raw.title);
    const statusText = plainText(raw.status || metadata.status || raw.workflow_status || metadata.workflow_status).toLowerCase();
    const explicitlyTestData = [
      raw.is_test, raw.is_demo, raw.test_data, raw.is_placeholder,
      metadata.is_test, metadata.is_demo, metadata.test_data, metadata.is_placeholder,
    ].some((flag) => flag === true || String(flag || "").toLowerCase() === "true");
    const qualityText = [
      titleText, raw.description, raw.summary, metadata.editorial_title,
      metadata.editorial_summary, raw.content, metadata.notes,
    ].map(plainText).join("\n").slice(0, 12000);
    if (
      !titleText ||
      titleText.length < 4 ||
      TEST_TITLE_PATTERN.test(titleText) ||
      TEST_ARTIFACT_PATTERN.test(qualityText) ||
      explicitlyTestData ||
      /^(?:draft|test|testing|demo|sample|placeholder|deleted|archived|private|unpublished)$/i.test(statusText)
    ) continue;

    const taxonomicFields = [
      raw.category, raw.subcategory, raw.subject, raw.topic, raw.hub,
      raw.discipline, raw.tags, metadata.category, metadata.subcategory,
      metadata.subject, metadata.topic, metadata.hub, metadata.discipline,
      metadata.tags,
    ].map(plainText).filter(Boolean);

    if (taxonomicFields.some((field) => NON_FAITH_TOPIC_PATTERN.test(field))) continue;

    const hasFaithClassification = taxonomicFields.some((field) => FAITH_TOPIC_PATTERN.test(field));
    const hasCuratedEditorialSlug = Boolean(plainText(metadata.catalog_slug));
    const isPublishedCatalogue = raw.published === true || (raw.published !== false && hasCuratedEditorialSlug);
    const titleAndDescription = [
      raw.title, raw.description, raw.summary,
      metadata.editorial_summary, metadata.tradition,
    ].map(plainText).join(" ");
    if (NON_FAITH_TOPIC_PATTERN.test(titleAndDescription)) continue;
    if (!isPublishedCatalogue) continue;
    if (!hasFaithClassification && !hasCuratedEditorialSlug) continue;

    const title = titleText.toLowerCase();
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
      previous = { ...previous, materials: sanitized };
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

    let normalized = normalizeFaithStudyMaterials(raw);

    // The catalogue endpoint may contain only lesson summaries. Download the
    // actual published lesson bodies from the existing material endpoint, in
    // small batches, so they are ready for the shared offline reader cache.
    // This is non-blocking for app startup and never creates synthetic lessons.
    const needsBody = normalized.filter((material) =>
      material.id && !(typeof material.content === "string" && material.content.trim())
    ).slice(0, 60);
    const detailById = new Map();

    for (let offset = 0; offset < needsBody.length; offset += 4) {
      const batch = needsBody.slice(offset, offset + 4);
      const results = await Promise.all(batch.map(async (material) => {
        try {
          const detailResponse = await fetch(
            STUDY_API_BASE + "/api/study/material/" + encodeURIComponent(material.id),
            {
              method: "GET",
              headers: { Accept: "application/json" },
              credentials: "include",
              cache: "no-store",
            },
          );
          if (!detailResponse.ok) return null;
          const detailPayload = await detailResponse.json().catch(() => ({}));
          const body = detailPayload?.material;
          if (!body || typeof body.content !== "string" || !body.content.trim()) return null;
          return {
            ...material,
            ...body,
            id: material.id,
            category: body.category || material.category,
            subcategory: body.subcategory || material.subcategory,
            metadata: {
              ...(material.metadata && typeof material.metadata === "object" ? material.metadata : {}),
              ...(body.metadata && typeof body.metadata === "object" ? body.metadata : {}),
            },
          };
        } catch {
          return null;
        }
      }));
      results.filter(Boolean).forEach((material) => detailById.set(material.id, material));
    }

    normalized = normalized.map((material) => detailById.get(material.id) || material);
    normalized = normalizeFaithStudyMaterials(normalized);
    await saveCachedLibrary(FAITH_LIBRARY_CACHE_SCOPE, normalized);
    return {
      source: "network",
      count: normalized.length,
      fullTextCached: normalized.filter((material) => typeof material.content === "string" && material.content.trim()).length,
    };
  } catch {
    return { source: previous ? "cache" : "unavailable", count: previous?.materials?.length || 0 };
  }
}


const CROSS_REFERENCE_DATASET_URL = "https://raw.githubusercontent.com/midvash/bible-cross-references/main/cross-references.json";
const CROSS_REFERENCE_DATASET_KEY = "cross-reference-dataset::midvash-v1";
let crossReferenceWarmPromise = null;

export async function getCachedCrossReferenceDataset() {
  try {
    const record = await readRecord(CROSS_REFERENCE_DATASET_KEY);
    const data = record?.value;
    return data && Array.isArray(data.references) ? data : null;
  } catch {
    return null;
  }
}

/**
 * Downloads the openly licensed Midvash verse cross-reference dataset once,
 * stores it in the existing IndexedDB record store, and falls back offline.
 * Dataset attribution is displayed in the Study Reference Desk.
 */
export function warmCrossReferenceDataset() {
  if (crossReferenceWarmPromise) return crossReferenceWarmPromise;

  crossReferenceWarmPromise = (async () => {
    const saved = await getCachedCrossReferenceDataset();
    try {
      const response = await fetch(CROSS_REFERENCE_DATASET_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "force-cache",
      });
      if (!response.ok) {
        return { source: saved ? "cache" : "unavailable", dataset: saved, count: saved?.references?.length || 0 };
      }
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.references) || !payload.indexed || typeof payload.indexed !== "object") {
        throw new Error("Cross-reference dataset schema was not recognized.");
      }
      await writeRecord(CROSS_REFERENCE_DATASET_KEY, payload);
      return { source: "network", dataset: payload, count: payload.references.length };
    } catch {
      return { source: saved ? "cache" : "unavailable", dataset: saved, count: saved?.references?.length || 0 };
    }
  })().finally(() => {
    crossReferenceWarmPromise = null;
  });

  return crossReferenceWarmPromise;
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
  const materials = normalizeFaithStudyMaterials(record.value);
  // Sanitize any existing cache before a dashboard can render old test entries.
  if (JSON.stringify(materials) !== JSON.stringify(record.value)) {
    await saveCachedLibrary(scope, materials);
  }
  return { materials, savedAt: record.savedAt || null };
}

export async function saveCachedLibrary(scope, materials) {
  const safeMaterials = normalizeFaithStudyMaterials(Array.isArray(materials) ? materials : []);
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
