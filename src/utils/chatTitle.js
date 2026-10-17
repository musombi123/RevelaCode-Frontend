/**
 * Resolve a useful, stable label for a RevelaAI conversation.
 *
 * Manual titles remain authoritative. Otherwise prefer an existing meaningful
 * title, then use the first user message as a topic-aware fallback.
 */
const GENERIC_TITLES = new Set([
  "",
  "new chat",
  "new conversation",
  "untitled",
  "conversation",
  "failed to fetch",
]);

const GREETINGS_ONLY = /^(?:hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|ok|okay|yo)[.!?,\s]*$/i;

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[\s"']+|[\s"']+$/g, "")
    .trim();
}

function clipTitle(value, maxLength = 52) {
  const text = normalizeText(value);
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const phrase = lastSpace >= Math.floor(maxLength * 0.55) ? cut.slice(0, lastSpace) : cut;
  return phrase.trimEnd() + "…";
}

export function resolveChatTitle(chat) {
  if (!chat || typeof chat !== "object") return "New chat";

  const storedTitle = normalizeText(chat.title);
  if (chat.titleLocked === true && storedTitle) {
    return clipTitle(storedTitle, 60);
  }

  const normalizedStored = storedTitle.toLowerCase();
  if (!GENERIC_TITLES.has(normalizedStored)) {
    return clipTitle(storedTitle, 60);
  }

  const messages = Array.isArray(chat.messages) ? chat.messages : [];
  const firstUserMessage = messages.find((message) =>
    message && (
      message.role === "user" ||
      message.sender === "user" ||
      message.from === "user"
    )
  );

  const candidate = normalizeText(
    firstUserMessage?.text ??
    firstUserMessage?.content ??
    firstUserMessage?.message ??
    ""
  );

  if (!candidate || GREETINGS_ONLY.test(candidate)) return "New chat";
  return clipTitle(candidate, 52) || "New chat";
}

export default resolveChatTitle;
