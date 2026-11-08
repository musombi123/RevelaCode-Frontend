export const COMMUNITY_SHARE_DRAFT_KEY = "revelacode.community.shareDraft.v1";

const MAX_DRAFT_AGE_MS = 60 * 60 * 1000;

export function savePendingCommunityShareDraft(draft) {
  if (typeof window === "undefined" || !window.sessionStorage) return false;
  try {
    window.sessionStorage.setItem(
      COMMUNITY_SHARE_DRAFT_KEY,
      JSON.stringify({ ...draft, createdAt: Date.now() }),
    );
    return true;
  } catch (error) {
    console.warn("[Community share] Could not save the pending draft:", error);
    return false;
  }
}

export function consumePendingCommunityShareDraft() {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(COMMUNITY_SHARE_DRAFT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(COMMUNITY_SHARE_DRAFT_KEY);
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) return null;
    const createdAt = Number(draft.createdAt || 0);
    if (!createdAt || Date.now() - createdAt > MAX_DRAFT_AGE_MS || createdAt > Date.now() + 60000) return null;
    const title = String(draft.title || "").trim().slice(0, 180);
    const body = String(draft.body || "").trim().slice(0, 10000);
    if (!title || !body) return null;
    const sourceUrl = String(draft.sourceUrl || "").trim();
    let safeSourceUrl = "";
    if (sourceUrl) {
      try {
        const parsed = new URL(sourceUrl);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") safeSourceUrl = parsed.toString();
      } catch {
        safeSourceUrl = "";
      }
    }
    return {
      title,
      body,
      hub: "community",
      category: "general",
      sourceHub: String(draft.sourceHub || "revelacode").trim().slice(0, 40),
      sourceHubLabel: String(draft.sourceHubLabel || "RevelaCode").trim().slice(0, 80),
      sourceUrl: safeSourceUrl,
    };
  } catch (error) {
    console.warn("[Community share] Could not read the pending draft:", error);
    try { window.sessionStorage.removeItem(COMMUNITY_SHARE_DRAFT_KEY); } catch {}
    return null;
  }
}
