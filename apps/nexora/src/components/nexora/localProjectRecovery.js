const PREFIX = "nexora.project-recovery.v1:";
const MAX_RECOVERY_CHARS = 3_500_000;

export function projectRecoveryKey(userId, projectId) {
  return PREFIX + encodeURIComponent(String(userId || "anonymous")) + ":" +
    encodeURIComponent(String(projectId || ""));
}

function withoutBinaryPayloads(project) {
  const value = { ...project };
  delete value._remoteVersion;
  delete value._localOnly;
  delete value._pendingLocalRecovery;
  delete value._offlineRecovery;
  delete value._recoveryConflict;

  // Store lightweight asset references only. Source files and binary blobs
  // remain on the paired computer or in the existing IndexedDB asset store.
  value.assets = Array.isArray(project?.assets) ? project.assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    mimeType: asset.mimeType,
    size: asset.size,
    addedAt: asset.addedAt,
    status: asset.status,
    remote: asset.remote,
    kind: asset.kind,
    metadata: asset.metadata,
    sha256: asset.sha256,
  })) : [];
  value.revisions = [];
  return value;
}

export function writeProjectRecovery(storage, userId, project, options = {}) {
  if (!storage || !userId || !project?.id) return false;
  try {
    const record = {
      schema_version: 1,
      user_id: String(userId),
      project_id: String(project.id),
      saved_at: new Date().toISOString(),
      pending: Boolean(options.pending),
      remote_version: Number(options.remoteVersion || project._remoteVersion || 0) || null,
      project: withoutBinaryPayloads(project),
    };
    const serialized = JSON.stringify(record);
    if (serialized.length > MAX_RECOVERY_CHARS) return false;
    storage.setItem(projectRecoveryKey(userId, project.id), serialized);
    return true;
  } catch {
    return false;
  }
}

export function readProjectRecovery(storage, userId, projectId) {
  if (!storage || !userId || !projectId) return null;
  try {
    const raw = storage.getItem(projectRecoveryKey(userId, projectId));
    if (!raw || raw.length > MAX_RECOVERY_CHARS) return null;
    const record = JSON.parse(raw);
    if (
      record?.schema_version !== 1 ||
      String(record.user_id) !== String(userId) ||
      String(record.project_id) !== String(projectId) ||
      !record.project ||
      String(record.project.id) !== String(projectId)
    ) return null;
    return record;
  } catch {
    return null;
  }
}

export function listProjectRecoveries(storage, userId) {
  if (!storage || !userId) return [];
  const prefix = PREFIX + encodeURIComponent(String(userId)) + ":";
  const records = [];
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key || !key.startsWith(prefix)) continue;
      const record = readProjectRecovery(storage, userId, decodeURIComponent(key.slice(prefix.length)));
      if (record) records.push(record);
    }
  } catch {
    return records;
  }
  return records.sort((a, b) => String(b.saved_at).localeCompare(String(a.saved_at)));
}

export function removeProjectRecovery(storage, userId, projectId) {
  if (!storage || !userId || !projectId) return false;
  try {
    storage.removeItem(projectRecoveryKey(userId, projectId));
    return true;
  } catch {
    return false;
  }
}
