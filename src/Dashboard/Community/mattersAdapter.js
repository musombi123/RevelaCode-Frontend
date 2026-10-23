// src/Dashboard/Community/mattersAdapter.js
//
// Thin compatibility adapter for Community "Matters" conversations.
//
// The current Community API exposes posts, comments, reactions and groups.
// It does not expose private matter conversations, matter messages, matter
// status transitions, audio-note upload, presence, or member trust records.
// This adapter deliberately makes no network request and invents no routes.
// Once the existing Jumuiya API client exposes these methods, the same UI
// can consume them without changing the screen:
//
//   getCommunityMatters()
//   getCommunityMatterMessages(matterId)
//   sendCommunityMatterMessage(matterId, { body })
//   updateCommunityMatterStatus(matterId, { status })
//   uploadCommunityVoiceNote(matterId, file)
//
function rowsFrom(response, collectionKey) {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[collectionKey])) return payload[collectionKey];
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export function createCommunityMattersAdapter(api = {}) {
  const ports = {
    list: typeof api.getCommunityMatters === "function",
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
          message:
            "Community currently supports posts, comments, reactions and groups. A matter/conversation listing contract is not exposed by the backend yet.",
        };
      }

      try {
        const response = await api.getCommunityMatters();
        return {
          supported: true,
          items: rowsFrom(response, "matters"),
          message: "",
        };
      } catch (error) {
        return {
          supported: true,
          items: [],
          message:
            error?.message ||
            "Matters could not be loaded from the connected backend.",
        };
      }
    },

    async messages(matterId) {
      if (!ports.messages) {
        return {
          supported: false,
          items: [],
          message: "Matter messages are not available from the backend yet.",
        };
      }

      try {
        const response = await api.getCommunityMatterMessages(matterId);
        return {
          supported: true,
          items: rowsFrom(response, "messages"),
          message: "",
        };
      } catch (error) {
        return {
          supported: true,
          items: [],
          message:
            error?.message ||
            "Messages could not be loaded from the connected backend.",
        };
      }
    },

    async sendMessage(matterId, body) {
      if (!ports.sendMessage) {
        throw new Error("The backend does not expose matter messaging yet.");
      }
      return api.sendCommunityMatterMessage(matterId, { body });
    },

    async updateStatus(matterId, status) {
      if (!ports.status) {
        throw new Error("The backend does not expose matter status updates yet.");
      }
      return api.updateCommunityMatterStatus(matterId, { status });
    },

    async uploadVoiceNote(matterId, file) {
      if (!ports.voiceNotes) {
        throw new Error("The backend does not expose voice-note uploads yet.");
      }
      return api.uploadCommunityVoiceNote(matterId, file);
    },
  };
}
