/**
 * RevelaAI v2.0 Living Brain — client-side, local-first brain adapter.
 * Hub routing is heuristic, emotion is only a text estimate, and answers are
 * transparent scaffolds. No hidden model, network request, or API key is used.
 */
import { assessEmotion, analyzeImageFile, analyzeVideoFile } from "./localIntelligence";
import { loadLocalVisionAssets, scanCanvas } from "../freeVisionEngine";

export const LIVING_BRAIN_VERSION = "2.0";
export const LIVING_BRAIN_LOG = "RevelaAI v2.0 - Living AGI - 5 Hubs - Self-Healing - Self-Learning - Free";

export const LIVING_HUBS = [
  { id: "mkulima", label: "Mkulima", subtitle: "Agriculture", icon: "Sprout", terms: /\b(farm|farmer|farming|crop|maize|corn|beans|soil|irrigat|harvest|livestock|poultry|dairy|pest|fertili[sz]er|shamba|mkulima|rainfall|seedlings?)\b/i },
  { id: "biashara", label: "Biashara", subtitle: "Business", icon: "Briefcase", terms: /\b(business|biashara|sales|revenue|profit|margin|customer|marketing|price|pricing|negotia|contract|cash flow|inventory|startup|tender|invoice|costs?)\b/i },
  { id: "elimu", label: "Elimu", subtitle: "Education", icon: "GraduationCap", terms: /\b(teach|teacher|student|school|classroom|learn|lesson|exam|curriculum|cbc|elimu|timetable|assessment|homework|education|study plan)\b/i },
  { id: "mahubiri", label: "Mahubiri", subtitle: "Scripture", icon: "BookOpen", terms: /\b(bible|biblical|scripture|verse|jesus|christ|god|sermon|preach|theolog|mahubiri|prayer|sabbath|prophecy|kjv|niv|psalm|gospel|church|faith)\b/i },
  { id: "general", label: "General", subtitle: "Everyday + technical", icon: "Sparkles", terms: /$^/ },
];

const HUB_METHODS = {
  mkulima: "Check crop or livestock, growth stage, location, weather, soil/water conditions and exact symptoms. Diagnose before spending on inputs; verify chemical labels and local extension advice.",
  biashara: "Start with the paying customer, urgent problem, price, variable cost, fixed cost, collection time, repeat sales and risk. Set a target and walk-away threshold before negotiating.",
  elimu: "State the learning objective, teach the core concept, show one worked example, ask a short practice question, then correct the learner's misconception.",
  mahubiri: "Read the passage in context, identify genre and historical setting, compare related Scripture, distinguish explicit text from interpretation, and derive a practical application.",
  general: "Clarify goal, constraints, evidence, options and trade-offs; choose a small reversible test and define how success will be measured.",
};

export function routeLivingHub(message, preferredHub = "auto", workspace = "") {
  const text = String(message || "");
  const selected = String(preferredHub || "auto").toLowerCase();
  if (selected !== "auto" && LIVING_HUBS.some((hub) => hub.id === selected)) {
    return { hub: selected, reason: "explicit hub selected" };
  }
  // Preserve the active workspace only when it is one of the five brain hubs.
  if (selected === "auto" && LIVING_HUBS.some((hub) => hub.id === String(workspace || "").toLowerCase())) {
    const workspaceId = String(workspace).toLowerCase();
    const workspaceHub = LIVING_HUBS.find((hub) => hub.id === workspaceId);
    if (workspaceHub && workspaceHub.terms.test(text)) return { hub: workspaceId, reason: "active workspace and message matched" };
  }
  const ranked = LIVING_HUBS.filter((hub) => hub.id !== "general")
    .map((hub) => ({ hub, count: (text.match(new RegExp(hub.terms.source, "ig")) || []).length }))
    .sort((a, b) => b.count - a.count);
  if (ranked[0]?.count > 0) return { hub: ranked[0].hub.id, reason: "local keyword routing" };
  return { hub: "general", reason: "no specialist keyword match" };
}

function greeting(text) {
  return /^\s*(hi|hello|hey|habari|jambo|mambo|good morning|good evening)[!,.?\s]*$/i.test(text);
}

function currentDataRequest(text) {
  return /\b(latest|today|right now|current price|current news|weather today|live score|current exchange rate)\b/i.test(text);
}

function answerForHub(text, hub) {
  const lower = text.toLowerCase();
  if (hub === "mkulima") {
    return "Mkulima approach\n1. Identify crop/livestock and growth stage.\n2. Record location, recent weather, water/soil conditions and exact symptoms.\n3. Rule out basic causes before spending on inputs; verify local extension and product-label advice before applying chemicals.\n4. Compare input cost with expected yield and market-price risk.\n\n" + HUB_METHODS.mkulima + "\n\nNext step: share the crop, county/area, growth stage and symptoms.";
  }
  if (hub === "biashara") {
    return "Biashara strategy\n1. Name the paying customer and the problem they need solved.\n2. Calculate contribution per sale = price − variable cost.\n3. Track fixed costs, cash collection time, repeat purchases and stock risk.\n4. Negotiate measurable value, set a target and walk-away point, and document terms.\n\n" + HUB_METHODS.biashara + "\n\nNext step: share price, unit cost, fixed costs and expected sales (include currency) for a transparent calculation.";
  }
  if (hub === "elimu") {
    return "Elimu teaching method\n1. Set the learning outcome.\n2. Explain the core idea in plain language.\n3. Demonstrate a worked example.\n4. Give one practice question.\n5. Use the learner's answer to decide what to explain next.\n\n" + HUB_METHODS.elimu + "\n\nNext step: tell me the subject, topic, learner level and time available.";
  }
  if (hub === "mahubiri") {
    return "Mahubiri / Scripture study\n1. Start from the exact passage and surrounding chapter.\n2. Identify genre, speaker, audience and historical setting.\n3. Compare related passages.\n4. Distinguish biblical text from interpretation and state alternative readings fairly.\n5. Build a clear main point, supporting outline and practical application.\n\n" + HUB_METHODS.mahubiri + "\n\nNext step: share the passage, audience and desired sermon length.";
  }
  if (/\b(code|debug|python|javascript|react|api|function|error|build|program|circuit|electric|device|engineering)\b/i.test(lower)) {
    return "Engineering workflow\n1. Define expected behavior and exact inputs/outputs.\n2. Reproduce the issue with the smallest case.\n3. Inspect the error/log and isolate one variable at a time.\n4. Make the smallest reversible change and test success + failure paths.\n5. Keep secrets out of source control.\n\n" + HUB_METHODS.general + "\n\nShare the relevant code, full error and expected behavior for a targeted review.";
  }
  if (/\b(decide|decision|should i|which option|choose|strategy|plan)\b/i.test(lower)) {
    return "Decision frame\n1. Define the outcome and deadline.\n2. List realistic options, constraints and evidence.\n3. Compare upside, downside, reversibility and worst credible case.\n4. Choose a small test with a measurable threshold.\n5. Set a review date and change course when evidence changes.\n\nI will challenge weak assumptions rather than agree automatically. Share your options and constraints for a concrete comparison.";
  }
  if (/\b(create|write|draft|design|idea|invent|innovate|sermon|plan)\b/i.test(lower)) {
    return "Let's develop this as a working concept rather than a vague idea. Define the audience, problem, intended outcome, constraints, resources and one measurable test. I can help structure a draft or design brief, but this local rules engine will not pretend to produce expert facts without evidence.\n\n" + HUB_METHODS.general;
  }
  return "I can help organize evidence, test assumptions, compare alternatives and plan a practical next step. This is a transparent on-device rule engine rather than a generative language model, so I won't invent detailed facts. Share source text, data, options or a narrower question and I can work with that.\n\n" + HUB_METHODS.general;
}

export function composeLivingResponse(message, preferredHub = "auto", workspace = "", memory = null) {
  const text = String(message || "").trim();
  const emotion = assessEmotion(text);
  const route = routeLivingHub(text, preferredHub, workspace);
  const hub = LIVING_HUBS.find((item) => item.id === route.hub) || LIVING_HUBS[LIVING_HUBS.length - 1];
  let reply;
  const identityQuestion = /\b(who are you|what are you|what is revelaai|introduce yourself|your identity)\b/i.test(text);
  const capabilityQuestion = /\b(what can you do|what are you capable of|your capabilities|how can you help|what can you help me with)\b/i.test(text);
  if (!text) {
    reply = "Tell me the goal, what you have tried so far, and any constraints I should respect.";
  } else if (identityQuestion) {
    reply = "I'm RevelaAI, the local-first assistant in the RevelaCode ecosystem. I route requests across five specialist hubs: Mkulima (agriculture), Biashara (business), Elimu (education), Mahubiri (Scripture and theology), and General (technical and everyday problem-solving). In this mode I use transparent local rules and browser tools—not a hosted generative model—so I can structure plans, explain concepts, reason from information you provide, and help debug code, but I can make mistakes and won't pretend to know facts I cannot verify.";
  } else if (capabilityQuestion) {
    reply = "I can help plan and debug software, explain technical concepts, structure business strategies and budgets, work through farming questions, develop lessons and study plans, and analyze Scripture in context. In this chat I can also use supported local image/video analysis, device speech, and browser-local memory. Limits: this version is a rule-based local assistant, not a human or a general-purpose generative AGI; live facts need a current source, and image pixel measurements do not by themselves identify objects. Tell me the outcome you want and the constraints, and I'll propose a concrete next step.";
  } else if (greeting(text)) {
    reply = "Hello! I'm RevelaAI. I can help you build, learn, plan, troubleshoot, or explore an idea. What would you like to work on?";
  } else if (currentDataRequest(text)) {
    reply = "I don't have a live data feed in this local-only mode, so I won't invent a current answer. Share a trusted source or the figures you have and I'll help analyze them; verify time-sensitive decisions against a current primary source.";
  } else {
    reply = answerForHub(text, route.hub);
  }
  const profile = memory?.profile && typeof memory.profile === "object" ? memory.profile : {};
  const memoryQuestion = /\b(what do you remember|what do you know about me|what is my name|do you remember me)\b/i.test(text);
  if (memoryQuestion) {
    const saved = [];
    if (profile.name) saved.push("name: " + profile.name);
    if (profile.project) saved.push("project: " + profile.project);
    if (profile.preference) saved.push("preference: " + profile.preference);
    reply = saved.length
      ? "Here is what your browser has saved locally: " + saved.join("; ") + ". These details stay in this browser profile."
      : "I don't have any explicit profile notes saved for this browser profile yet. I do keep a limited local conversation journal when browser storage is available.";
  } else if (/\b(my project|the project i mentioned|my current project)\b/i.test(text) && profile.project) {
    reply += "\n\nLocal memory: you previously told me your project is " + profile.project + ".";
  } else if (/\b(explain|teach|answer|help me understand)\b/i.test(text) && profile.preference) {
    reply += "\n\nPersonalization applied from your local memory: " + profile.preference + ".";
  }
  const opening = emotion?.opening || "Let's work through this clearly and practically.";
  if (!greeting(text) && text && !memoryQuestion && !identityQuestion && !capabilityQuestion) {
    reply = opening + "\n\n" + reply;
  }
  return {
    reply,
    hub: route.hub,
    hubLabel: hub.label,
    routeReason: route.reason,
    emotionEstimate: emotion?.emotion || "neutral",
    intent: identityQuestion ? "identity" : capabilityQuestion ? "capabilities" : currentDataRequest(text) ? "current_information_needs_source" : "local_guidance",
    engine: "revelaai-local-global-brain-v2",
    networkUsed: false,
    confidence: "heuristic",
  };
}

const DB_NAME = "revelaai-living-memory-v2";
const DB_VERSION = 1;
const STORE_TURNS = "turns";
const STORE_PROFILE = "profile";
const STORE_DIAGNOSTICS = "diagnostics";
const safeText = (value, limit = 2000) => String(value || "").slice(0, limit);
const userKey = (scope) => safeText(scope || "guest", 160) || "guest";

function openMemoryDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is unavailable"));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_TURNS)) {
        const store = db.createObjectStore(STORE_TURNS, { keyPath: "id" });
        store.createIndex("scope", "scope", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PROFILE)) {
        const store = db.createObjectStore(STORE_PROFILE, { keyPath: "id" });
        store.createIndex("scope", "scope", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_DIAGNOSTICS)) {
        db.createObjectStore(STORE_DIAGNOSTICS, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
    request.onblocked = () => reject(new Error("IndexedDB upgrade blocked"));
  });
}

function putRecord(storeName, record) {
  return openMemoryDatabase().then((db) => new Promise((resolve, reject) => {
    let tx;
    try {
      tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(record);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { const error = tx.error; db.close(); reject(error || new Error("IndexedDB write failed")); };
      tx.onabort = () => { db.close(); reject(new Error("IndexedDB write aborted")); };
    } catch (error) {
      db.close();
      reject(error);
    }
  }));
}

function getAllFromStore(storeName) {
  return openMemoryDatabase().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => { const result = request.result || []; db.close(); resolve(result); };
    request.onerror = () => { const error = request.error; db.close(); reject(error || new Error("IndexedDB read failed")); };
  }));
}

export async function recordConversationTurn({ scope, userText, assistantText, hub = "general", emotion = "neutral" }) {
  const normalizedScope = userKey(scope);
  const record = {
    id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2),
    scope: normalizedScope,
    userText: safeText(userText),
    assistantText: safeText(assistantText),
    hub: safeText(hub, 32),
    emotionEstimate: safeText(emotion, 32),
    createdAt: Date.now(),
  };
  try {
    await putRecord(STORE_TURNS, record);
    const all = await getAllFromStore(STORE_TURNS);
    const owned = all.filter((item) => item.scope === normalizedScope).sort((a, b) => a.createdAt - b.createdAt);
    // Keep memory bounded on lower-end Android devices.
    const staleIds = owned.slice(0, Math.max(0, owned.length - 500)).map((item) => item.id);
    if (staleIds.length) {
      const db = await openMemoryDatabase();
      await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_TURNS, "readwrite");
          const store = tx.objectStore(STORE_TURNS);
          staleIds.forEach((id) => store.delete(id));
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); resolve(); };
          tx.onabort = () => { db.close(); resolve(); };
        } catch {
          db.close();
          resolve();
        }
      });
    }
    try {
      const summaryKey = "revelaai.living.memory.v2:" + encodeURIComponent(normalizedScope);
      const existing = JSON.parse(localStorage.getItem(summaryKey) || '{"turns":0,"lastHub":"general","recent":[]}');
      const next = {
        turns: Number(existing.turns || 0) + 1,
        lastHub: record.hub,
        recent: [...(Array.isArray(existing.recent) ? existing.recent : []), {
          at: record.createdAt, hub: record.hub, userText: record.userText.slice(0, 180),
        }].slice(-20),
      };
      localStorage.setItem(summaryKey, JSON.stringify(next));
    } catch { /* Browser storage may be disabled or full. IndexedDB is primary. */ }
    // Learn narrowly from explicit, low-risk self-descriptions only.
    await learnExplicitPreference(normalizedScope, record.userText);
    return { ok: true, id: record.id };
  } catch (error) {
    await recordLocalDiagnostic("memory-write", error);
    // Existing chat history remains available through the dashboard's own localStorage.
    return { ok: false, reason: "local-memory-unavailable" };
  }
}

async function learnExplicitPreference(scope, text) {
  const rules = [
    { key: "name", re: /\bmy name is ([A-Za-z][A-Za-z '-]{1,60})/i },
    { key: "preference", re: /\b(prefer|please use|i like answers)\s+([^.!?\n]{2,120})/i },
    { key: "project", re: /\bmy project is ([^.!?\n]{2,100})/i },
  ];
  for (const rule of rules) {
    const match = String(text || "").match(rule.re);
    if (!match) continue;
    const value = safeText(rule.key === "name" ? match[1].trim() : (match[2] || match[1]).trim(), 140);
    // Do not persist credentials, payment data, or high-risk health details.
    if (/password|passcode|api.?key|token|secret|bank account|medical|diagnos/i.test(value)) continue;
    const id = scope + ":" + rule.key;
    try {
      const db = await openMemoryDatabase();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROFILE, "readwrite");
        tx.objectStore(STORE_PROFILE).put({ id, scope, key: rule.key, value, updatedAt: Date.now() });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error("Profile write failed"));
        tx.onabort = () => reject(new Error("Profile write aborted"));
      });
      db.close();
      const localKey = "revelaai.living.profile.v2:" + encodeURIComponent(scope);
      const profile = JSON.parse(localStorage.getItem(localKey) || "{}");
      profile[rule.key] = value;
      localStorage.setItem(localKey, JSON.stringify(profile));
    } catch (error) {
      await recordLocalDiagnostic("profile-memory", error);
    }
  }
}

export async function getLocalBrainMemory(scope) {
  const normalizedScope = userKey(scope);
  try {
    const [turns, profiles] = await Promise.all([getAllFromStore(STORE_TURNS), getAllFromStore(STORE_PROFILE)]);
    return {
      turns: turns.filter((item) => item.scope === normalizedScope).sort((a, b) => b.createdAt - a.createdAt).slice(0, 30),
      profile: profiles.filter((item) => item.scope === normalizedScope).reduce((memo, item) => { memo[item.key] = item.value; return memo; }, {}),
    };
  } catch {
    try {
      const localKey = "revelaai.living.memory.v2:" + encodeURIComponent(normalizedScope);
      const summary = JSON.parse(localStorage.getItem(localKey) || '{"turns":0,"lastHub":"general","recent":[]}');
      return { turns: summary.recent || [], profile: JSON.parse(localStorage.getItem("revelaai.living.profile.v2:" + encodeURIComponent(normalizedScope)) || "{}") };
    } catch { return { turns: [], profile: {} }; }
  }
}

export async function recordLocalDiagnostic(operation, error) {
  const item = {
    id: Date.now() + "-" + Math.random().toString(16).slice(2),
    operation: safeText(operation, 80),
    errorType: safeText(error?.name || "Error", 80),
    at: Date.now(),
  };
  try {
    await putRecord(STORE_DIAGNOSTICS, item);
  } catch {
    try {
      const key = "revelaai.living.diagnostics.v2";
      const items = JSON.parse(localStorage.getItem(key) || "[]");
      items.push(item);
      localStorage.setItem(key, JSON.stringify(items.slice(-50)));
    } catch { /* A diagnostics failure must never crash chat. */ }
  }
}

export async function analyzeLocalImageForChat(file, prompt = "") {
  try {
    // Pixel-math fallback runs first so model/asset loading can never block a basic answer.
    const fallback = await analyzeImageFile(file);
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const scale = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return { ...fallback, prompt, engine: "pixel-math-fallback", fallback: true };
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        try {
          const assets = await loadLocalVisionAssets();
          const result = await scanCanvas(canvas, assets, { readText: true });
          return { ...result, fileName: file.name, prompt, engine: "local-vision-optional-assets", fallback: !result.objectModelReady && !result.text, summary: result.description || fallback.summary };
        } catch (error) {
          await recordLocalDiagnostic("vision-assets", error);
          return { ...fallback, prompt, engine: "pixel-math-fallback", fallback: true };
        }
      } finally {
        bitmap.close?.();
      }
    } catch (error) {
      await recordLocalDiagnostic("vision-canvas", error);
      return { ...fallback, prompt, engine: "pixel-math-fallback", fallback: true };
    }
  } catch (error) {
    await recordLocalDiagnostic("vision-primary", error);
    // Don't crash the conversation when browser image decoding or canvas access fails.
    return {
      fileName: file?.name || "image",
      summary: "I couldn't read this image on the device. Chat is still working. Try another image or describe the area you want inspected.",
      fallback: true, engine: "safe-vision-fallback",
    };
  }
}

export async function analyzeLocalVideoForChat(file, onProgress) {
  try {
    const video = await analyzeVideoFile(file, onProgress);
    return { ...video, fallback: false, engine: "local-video-frame-math" };
  } catch (error) {
    await recordLocalDiagnostic("video-analysis", error);
    return {
      duration: 0, frames: [], averageMotion: null,
      summary: "I couldn't decode this video in the browser. The chat still works. Try a shorter MP4/WebM clip or send a still frame instead.",
      fallback: true, engine: "safe-video-fallback",
    };
  }
}

console.log(LIVING_BRAIN_LOG);
