// Shared, testable normalization for the authenticated Community comments API.

export function readCommunityPostId(post) {
  let value = post?.id ?? post?._id ?? post?.post_id ?? post?.postId;
  if (value && typeof value === "object") {
    value = value.$oid ?? value.oid ?? value.id ?? "";
  }
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

export function asCommunityCommentList(value, depth = 0) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object" || depth > 5) return [];

  const keys = ["comments", "items", "results", "rows", "records", "data", "payload", "result"];
  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key];
  }
  for (const key of keys) {
    const nested = value[key];
    if (nested && typeof nested === "object") {
      const found = asCommunityCommentList(nested, depth + 1);
      if (found.length) return found;
    }
  }
  return [];
}

function textValue(value, fallback = "") {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const text = String(value).trim();
  return text || fallback;
}

export function normalizeCommunityComment(comment, index = 0) {
  if (!comment || typeof comment !== "object" || Array.isArray(comment)) return null;

  const author = comment.author && typeof comment.author === "object"
    ? comment.author
    : comment.user && typeof comment.user === "object"
      ? comment.user
      : {};
  const id = comment.id ?? comment._id ?? comment.comment_id ?? `comment-${index}`;
  const avatarValue = author.avatar_url || author.avatar || author.profile_image || author.profileImage;

  return {
    ...comment,
    id: String(id),
    body: textValue(comment.body ?? comment.text ?? comment.content),
    authorName: textValue(
      author.name || author.full_name || author.fullName ||
      comment.author_name || comment.user_name || comment.username,
      "Community member",
    ),
    authorAvatar: typeof avatarValue === "string" && avatarValue.trim() ? avatarValue.trim() : "",
    createdAt: comment.created_at || comment.createdAt || comment.timestamp || null,
  };
}

// The API client normally unwraps the standard { success, data } response.
// This additionally supports comment/data/result envelopes from older clients
// without fabricating a local comment when no saved record was returned.
export function extractSavedCommunityComment(value, depth = 0) {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 5) return null;
  if (
    Object.prototype.hasOwnProperty.call(value, "body") ||
    Object.prototype.hasOwnProperty.call(value, "text") ||
    Object.prototype.hasOwnProperty.call(value, "content")
  ) {
    return value;
  }

  for (const key of ["comment", "data", "result", "payload"]) {
    const nested = value[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const found = extractSavedCommunityComment(nested, depth + 1);
      if (found) return found;
    }
  }
  return null;
}
