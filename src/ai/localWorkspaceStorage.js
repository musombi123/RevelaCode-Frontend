const DB_NAME = "revelaai-local-workspace";
const DB_VERSION = 1;
const FILES_STORE = "files";
const META_STORE = "meta";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser does not support local workspace storage."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        const store = db.createObjectStore(FILES_STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local storage."));
  });
}

async function withStore(storeName, mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    try { result = operation(store); } catch (error) { reject(error); db.close(); return; }
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("Local storage operation failed.")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("Local storage operation was cancelled.")); };
  });
}

export async function saveLocalFile(file, metadata = {}) {
  if (!(file instanceof Blob)) throw new TypeError("A file or Blob is required.");
  const id = metadata.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
  const record = {
    id,
    name: String(metadata.name || file.name || "Untitled file").slice(0, 240),
    type: String(metadata.type || file.type || "application/octet-stream").slice(0, 160),
    size: file.size,
    blob: file,
    createdAt: metadata.createdAt || Date.now(),
    updatedAt: Date.now(),
    category: String(metadata.category || "workspace").slice(0, 60),
  };
  await withStore(FILES_STORE, "readwrite", store => store.put(record));
  return { ...record, blob: undefined };
}

export async function listLocalFiles() {
  return withStore(FILES_STORE, "readonly", store => {
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve((request.result || []).map(({ blob, ...item }) => item).sort((a,b) => b.updatedAt-a.updatedAt));
      request.onerror = () => reject(request.error);
    });
  });
}

export async function readLocalFile(id) {
  return withStore(FILES_STORE, "readonly", store => {
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function deleteLocalFile(id) {
  return withStore(FILES_STORE, "readwrite", store => store.delete(id));
}

export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return { supported: false, granted: false };
  const granted = await navigator.storage.persist();
  return { supported: true, granted };
}

export async function getLocalStorageEstimate() {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return { usage: estimate.usage || 0, quota: estimate.quota || 0 };
}

export async function chooseWorkspaceFolder() {
  if (typeof window.showDirectoryPicker !== "function") {
    throw new Error("Direct folder access is not supported in this browser. You can still use the built-in local workspace.");
  }
  const handle = await window.showDirectoryPicker({ id: "revelaai-workspace", mode: "readwrite" });
  const permission = await handle.requestPermission({ mode: "readwrite" });
  if (permission !== "granted") throw new Error("Folder access was not granted.");
  await withStore(META_STORE, "readwrite", store => store.put(handle, "directoryHandle"));
  return handle.name;
}

export async function getWorkspaceFolder() {
  const handle = await withStore(META_STORE, "readonly", store => {
    const request = store.get("directoryHandle");
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
  if (!handle) return null;
  const permission = await handle.queryPermission({ mode: "readwrite" });
  return permission === "granted" ? handle : null;
}

export async function writeFileToWorkspaceFolder(file) {
  const directory = await getWorkspaceFolder();
  if (!directory) throw new Error("Choose and authorize a workspace folder first.");
  const safeName = String(file.name || "revelaai-file").replace(/[\\/:*?"<>|]/g, "_").slice(0, 180);
  const handle = await directory.getFileHandle(safeName, { create: true });
  const writable = await handle.createWritable();
  await writable.write(file.blob || file);
  await writable.close();
  return safeName;
}
