// src/utils/chatTitle.js
//
// Smart chat titles for RevelaAI.
//
// Problem this solves: the first message is often "hello", and the old
// behaviour locked that in as the chat name. Now a chat keeps a placeholder
// until the user sends a message that actually has a topic, and then it is
// titled from that message ("Fix my login bug", "Maize planting dates").
//
// A chat stops being renamed automatically in two cases:
//   1. it already has a meaningful title, or
//   2. the user renamed it by hand (chat.titleLocked === true).

export const DEFAULT_TITLE = "New chat";
const MAX_TITLE_LENGTH = 44;

/* ---------------------------------------------------------
   Greetings and filler, English and Kiswahili
--------------------------------------------------------- */

const GREETING_WORDS = [
  "hi", "hello", "hey", "heya", "hiya", "yo", "sup", "howdy", "greetings",
  "good morning", "good afternoon", "good evening", "good night",
  "how are you", "how are you doing", "how is it going", "what's up", "whats up",
  "thanks", "thank you", "ok", "okay", "test", "testing", "hmm", "yes", "no",
  // Kiswahili / Sheng
  "habari", "habari yako", "habari za asubuhi", "habari za mchana", "habari za jioni",
  "hujambo", "hamjambo", "jambo", "mambo", "mambo vipi", "niaje", "sasa", "vipi",
  "salaam", "shikamoo", "marahaba", "asante", "sawa", "poa", "karibu",
];

const GREETING_ONLY = new RegExp(
  `^(?:${GREETING_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?:\\s+(?:there|revela|revelaai|ai|bro|boss|sir|madam|mzee|rafiki))?[\\s!?.,:;]*$`,
  "i"
);

const LEADING_GREETING = new RegExp(
  `^(?:${GREETING_WORDS.filter((w) => w.split(" ").length <= 3)
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})(?:\\s+(?:there|revela|revelaai|ai|bro|boss|sir|madam|mzee|rafiki))?[\\s!?.,:;-]+`,
  "i"
);

const FILLER_PREFIXES = [
  /^(?:can|could|would|will) you (?:please )?(?:help me (?:to |with )?|tell me |show me |explain |write |make |create |give me )?/i,
  /^(?:please|pls|plz|kindly)[\s,]+/i,
  /^(?:i (?:want|need|would like|'d like|wanna|gotta) (?:you )?to )/i,
  /^(?:i (?:want|need|would like|'d like)) /i,
  /^(?:help me (?:to |with )?)/i,
  /^(?:tell me (?:about |how to )?)/i,
  /^(?:show me (?:how to )?)/i,
  /^(?:how (?:do|can|should) i )/i,
  /^(?:what is|what's|what are|what does) /i,
  /^(?:explain (?:to me )?)/i,
  /^(?:i have (?:a )?(?:question|problem|issue) (?:about|with|on) )/i,
  // Kiswahili
  /^(?:tafadhali|naomba|nisaidie|nisaidieni|naomba msaada(?: wa| na)?|ninataka|nataka|nahitaji|niambie|nieleze|elezea)[\s,]+/i,
  /^(?:unaweza|tunaweza|naweza) (?:kunisaidia|kuniambia|kunielezea)[\s,]*/i,
];

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

const messageText = (message) => {
  const raw = message?.content ?? message?.text ?? "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join(" ");
  }
  return String(raw || "");
};

const isUser = (message) => {
  const role = String(message?.role || message?.sender || "").toLowerCase();
  return role === "user" || role === "human";
};

const stripNoise = (text) =>
  text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[*_#>~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (text) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const truncateAtWord = (text, max = MAX_TITLE_LENGTH) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const clean = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut)
    .replace(/[\s,;:.\-–—(]+$/, "");
  return `${clean}…`;
};

export function isGreetingOnly(text) {
  const clean = stripNoise(String(text || ""));
  return clean.length === 0 || GREETING_ONLY.test(clean);
}

/** Turn one raw user message into a short, readable title (or "" if it has no topic). */
export function titleFromText(rawText) {
  let text = stripNoise(String(rawText || ""));
  if (!text || GREETING_ONLY.test(text)) return "";

  // First sentence or line only.
  text = text.split(/(?<=[.!?])\s+|\n/)[0] || text;

  // "Hello, can you help me plan..." -> "plan..."
  text = text.replace(LEADING_GREETING, "");

  // Peel filler prefixes (a couple of passes handles "hi please can you ...").
  for (let pass = 0; pass < 3; pass += 1) {
    const before = text;
    for (const pattern of FILLER_PREFIXES) text = text.replace(pattern, "");
    if (text === before) break;
  }

  text = text
    .replace(/[?!.,;:\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 3 || GREETING_ONLY.test(text)) return "";
  return truncateAtWord(titleCase(text));
}

/** Title from a whole conversation: the first user message that has a real topic. */
export function generateChatTitle(messages = []) {
  for (const message of messages) {
    if (!isUser(message)) continue;

    const title = titleFromText(messageText(message));
    if (title) return title;

    // A message that is only a file still deserves a name.
    const file = message?.file || message?.attachment || message?.attachments?.[0];
    const fileName = file?.name || message?.fileName;
    if (fileName) return truncateAtWord(`File: ${fileName}`);
  }
  return "";
}

/** True when a stored title is a placeholder we are allowed to replace. */
export function isPlaceholderTitle(title) {
  const clean = String(title || "").trim();
  if (!clean) return true;
  if (/^(?:new chat|new conversation|untitled(?: chat)?)$/i.test(clean)) return true;
  return GREETING_ONLY.test(clean.replace(/…$/, ""));
}

/**
 * The title a chat should currently show.
 * Manual names always win. Otherwise placeholders ("hello", "New chat")
 * are upgraded as soon as the conversation has a real topic.
 */
export function resolveChatTitle(chat) {
  const stored = String(chat?.title || "").trim();
  if (chat?.titleLocked && stored) return stored;
  if (stored && !isPlaceholderTitle(stored)) return stored;
  return generateChatTitle(chat?.messages) || DEFAULT_TITLE;
}
