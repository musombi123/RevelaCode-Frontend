/**
 * Small, versioned browser-side recovery copy for World Builder documents.
 * The Local Agent remains the authoritative project workspace; this cache
 * protects edits when the agent is temporarily disconnected.
 */
export function readWorldSnapshot(storage, documentKey) {
  try {
    const value = storage.getItem(documentKey);
    if (!value) return null;
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isWorldSnapshotPending(storage, pendingKey) {
  try {
    return storage.getItem(pendingKey) === "1";
  } catch {
    return false;
  }
}

export function writeWorldSnapshot(storage, documentKey, pendingKey, document, pending = false) {
  storage.setItem(documentKey, JSON.stringify(document));
  if (pending) storage.setItem(pendingKey, "1");
  else storage.removeItem(pendingKey);
}
