// src/Dashboard/Community/mattersAdapter.js
//
// Thin adapter for persistent Community matters and messages.
// All mutations call the authenticated Jumuiya API; no local/demo messages
// are generated. Optional capabilities (voice, presence, trust) stay disabled
// until their real backend contracts exist.

function rowsFrom(response, collectionKey) {
  let payload = response?.data ?? response;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) break;
    if (payload.success === false || payload.ok === false) {
      throw new Error(payload.message || payload.error?.message || "Community request failed.");
    }
    if (payload.data && typeof payload.data === "object") {
      payload = payload.data;
      continue;
    }
    if (payload.result && typeof payload.result === "object") {
      payload = payload.result;
      continue;
    }
    break;
  }
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[collectionKey])) return payload[collectionKey];
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function objectFrom(response, key) {
  let payload = response?.data ?? response;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) break;
    if (payload.success === false || payload.ok === false) {
      throw new Error(payload.message || payload.error?.message || "Community request failed.");
    }
    if (payload.data && typeof payload.data === "object") {
      payload = payload.data;
      continue;
    }
    if (payload.result && typeof payload.result === "object") {
      payload = payload.result;
      continue;
    }
    break;
  }
  return payload?.[key] || payload;
}

export function createCommunityMattersAdapter(api = {}) {
  const ports = {
    list: typeof api.getCommunityMatters === "function",
    create: typeof api.createCommunityMatter === "function",
    messages: typeof api.getCommunityMatterMessages === "function",
    sendMessage: typeof api.sendCommunityMatterMessage === "function",
    status: typeof api.updateCommunityMatterStatus === "function",
    voiceNotes: typeof api.uploadCommunityVoiceNote === "function",
    presence: typeof api.getCommunityMemberPresence === "function",
    trust: typeof api.getCommunityMemberTrust === "function",
  };

  return {
    capabilities: Object.freeze(ports),

    async list() {
      if (!ports.list) {
        return {
          supported: false,
          items: [],
          message: "The connected API client does not expose Community matters.",
        };
      }
      try {
        const response = await api.getCommunityMatters();
        return { supported: true, items: rowsFrom(response, "matters"), message: "" };
      } catch (error) {
        return {
          supported: true,
          items: [],
          message: error?.message || "Matters could not be loaded from the connected backend.",
        };
      }
    },

    async create(participantUserId, { title = "", linkedPostId = "" } = {}) {
      if (!ports.create) throw new Error("Community conversation creation is not connected.");
      const response = await api.createCommunityMatter({
        participant_user_id: participantUserId,
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(linkedPostId ? { linked_post_id: linkedPostId } : {}),
      });
      return objectFrom(response, "matter");
    },

    async messages(matterId) {
      if (!ports.messages) {
        return { supported: false, items: [], message: "Matter messages are not available from the backend." };
      }
      try {
        const response = await api.getCommunityMatterMessages(matterId);
        return { supported: true, items: rowsFrom(response, "messages"), message: "" };
      } catch (error) {
        return {
          supported: true,
          items: [],
          message: error?.message || "Messages could not be loaded from the connected backend.",
        };
      }
    },

    async sendMessage(matterId, body) {
      if (!ports.sendMessage) throw new Error("Community messaging is not connected.");
      return api.sendCommunityMatterMessage(matterId, { body });
    },

    async updateStatus(matterId, status) {
      if (!ports.status) throw new Error("Community matter status updates are not connected.");
      return api.updateCommunityMatterStatus(matterId, { status });
    },

    async uploadVoiceNote(matterId, file) {
      if (!ports.voiceNotes) throw new Error("The backend does not expose voice-note uploads yet.");
      return api.uploadCommunityVoiceNote(matterId, file);
    },
  };
}
