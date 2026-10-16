const configuredBase =
  import.meta.env.VITE_REVELAAI_HUB_API_URL ||
  import.meta.env.VITE_REVELAAI_API_URL ||
  "";

const API_BASE = String(configuredBase).replace(/\/+$/, "");

/**
 * Calls RevelaAI's deterministic, no-model five-hub endpoint.
 * A missing base URL is an intentional offline mode; callers may
 * then use the browser-side rule engine without making a request.
 */
export async function requestHubReply({
  message,
  hub = "general",
  userId = "guest",
  sessionId = "",
  vision = null,
  visionDescription = "",
  signal,
}) {
  if (!API_BASE) return null;

  const response = await fetch(`${API_BASE}/api/revelaai/hubs/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      message: String(message || "").slice(0, 8000),
      hub,
      userId: String(userId || "guest").slice(0, 256),
      sessionId: String(sessionId || "").slice(0, 256),
      vision,
      visionDescription: String(visionDescription || "").slice(0, 8000),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok || !data?.reply) {
    throw new Error(data?.error || `RevelaAI hub request failed (${response.status}).`);
  }

  return {
    text: data.reply,
    metadata: {
      engine: data.engine || "regex-cache-local-json",
      paidModel: false,
      hub: data.hub || hub,
      cached: Boolean(data.cached),
      network: true,
    },
  };
}

export function isHubApiConfigured() {
  return Boolean(API_BASE);
}


/**
 * Browser fallback for the same five hub personas. Returns null for
 * broad topics so the existing local rule engine can still help.
 */
export function answerWithLocalHubRules({ message, hub = "general", visionDescription = "" }) {
  const text = String(message || "").trim();
  const low = text.toLowerCase();
  const key = String(hub || "general").toLowerCase();
  if (visionDescription) {
    const labels = (visionDescription.match(/Detected labels:\s*([^.]*)/i) || [])[1] || "";
    const ocr = (visionDescription.match(/Text detected:\s*[“"]?([^.”"]+)/i) || [])[1] || "";
    const brightness = Number((visionDescription.match(/Brightness:\s*(\d+)/i) || [])[1]);
    const scene = labels ? "The local detector reports " + labels.trim() + ". " : "I don't have verified object labels from this scan, so I won't guess the object's identity. ";
    const textRead = ocr ? "The local text reader returned: “" + ocr.trim() + "”. " : "";
    if (key === "mkulima") return "Nimepata vipimo vya kamera. " + scene + (brightness < 50 ? "The scene is dark; improve the light before judging crop colour or plant health. " : "Image measurements alone cannot diagnose a crop. ") + textRead + "Which crop and county should we focus on?";
    if (key === "biashara") return "Camera scan received. " + scene + textRead + "For a business decision, confirm the product, selling price, unit cost, and customer segment; contours are not sales evidence.";
    if (key === "elimu") return "Let's read the scan carefully. " + scene + textRead + "Brightness and edges are pixel measurements, not a full explanation of the scene. What do you want to learn from it?";
    if (key === "mahubiri") return "Let's separate observation from interpretation. " + scene + textRead + "If this is a Bible page, verify the book, chapter, and verse before relying on OCR.";
    return "From the device's scan, " + scene + textRead + "Brightness is " + (Number.isFinite(brightness) ? brightness + "/255" : "not available") + ". These are measured clues, not proof of identity or meaning.";
  }
  if (key === "mkulima" && /\b(pest|disease|yellow leaves|wilt|mnyauko|wadudu|majani ya njano|soil|udongo|crop|mazao|farm|shamba|irrigat|fertili[sz]er)\b/i.test(low)) {
    return /\b(pest|disease|yellow leaves|wilt|mnyauko|wadudu|majani ya njano)\b/i.test(low)
      ? "Let's check the crop and growth stage, which leaves are affected, soil moisture, recent rain/irrigation, and whether symptoms spread. Avoid applying pesticides until the likely cause and label instructions are checked. Which crop and county are you in?"
      : "Tufanye hili kwa vitendo. Check soil texture, drainage, pH, water access, crop stage and recent weather before choosing an intervention. A soil test is more reliable than guessing. Which crop and county are you in?";
  }
  if (key === "biashara" && /\b(sales|price|pricing|negotiat|customer|cash flow|revenue|profit|margin|biashara|business)\b/i.test(low)) {
    return "Let's make the decision measurable: selling price, unit cost, variable expenses, fixed costs, and the customer's alternative. Protect your walk-away point, trade concessions conditionally, and write down the agreement. Share the numbers and I can help calculate margin.";
  }
  if (key === "elimu" && /\b(code|program|python|javascript|react|error|debug|algorithm|homework|explain|teach|learn|school)\b/i.test(low)) {
    return "I'll teach this step by step: first the core idea, then why it works, a worked example, and one common mistake. For code, share the exact error and smallest failing example so we can isolate the cause.";
  }
  if (key === "mahubiri" && /\b(bible|scripture|theology|sermon|mahubiri|prophecy|daniel|revelation|666|beast|verse|prayer|pray)\b/i.test(low)) {
    if (/\b(prayer|pray)\b/i.test(low)) return "May God grant you wisdom for the next decision, courage for what is difficult, compassion for the people involved, and peace while you work through what you cannot control. Amen.";
    if (/\b(prophecy|daniel|revelation|666|beast)\b/i.test(low)) return "Let's begin with the biblical passage and its historical context, then compare related passages and interpretations. I'll distinguish the text from historical claims and contemporary speculation. Which passage should we examine?";
    return "Let's read the whole passage in context, identify the speaker and audience, compare related texts, and separate observation, interpretation, and application. Share the verse or sermon topic and audience.";
  }
  if (key === "general" && /\b(i disagree|argue|counterargument|debate|challenge)\b/i.test(low)) {
    return "I won't agree just to be agreeable. Let's state the claim, examine its strongest evidence, test its assumptions and counterexamples, and then decide what the reasoning supports.";
  }
  if (key === "general" && /\b(pray|prayer|habari|niaje|hello|hi|hey)\b/i.test(low)) {
    return /\b(pray|prayer)\b/i.test(low)
      ? "May you find wisdom for the next decision, courage for what is difficult, and peace while you work through what you cannot control. Amen."
      : "Hey, I'm here with you. What are we working through today—your farm, a business decision, a learning challenge, a Bible question, or something else?";
  }
  return null;
}
