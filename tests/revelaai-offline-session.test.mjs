import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const aiDashboard = read("../src/components/AIAssistantDashboard.jsx");
const inputBar = read("../src/components/InputBar.jsx");
const humanizer = read("../src/pages/HumanizerWorkspace.jsx");

test("typed AI chat and durable history use the shared authenticated request service", () => {
  assert.match(aiDashboard, /authFetch\(.*\/api\/memory\//s);
  assert.match(aiDashboard, /authFetch\(.*\/ai/s);
  assert.doesNotMatch(aiDashboard, /revelacode_access_token|revelacode_token_type|getRevelaCodeAuthHeaders|Authorization:/);
});

test("the offline chat completion path never reads branch-local hosted payload metadata", () => {
  const sendStart = aiDashboard.indexOf("const sendMessage");
  const sendEnd = aiDashboard.indexOf("TEXT COMPATIBILITY HANDLER", sendStart);
  assert.ok(sendStart >= 0 && sendEnd > sendStart, "sendMessage callback must exist");
  const send = aiDashboard.slice(sendStart, sendEnd);

  const responseMetaDeclaration = send.indexOf("const responseMeta = sanitizeAIResponseMetadata(payload?.meta)");
  const responseMetaSpread = send.indexOf("...responseMeta");
  const normalized = send.indexOf("const normalized = {", responseMetaSpread);

  assert.ok(responseMetaDeclaration >= 0, "hosted metadata is declared inside the hosted response branch");
  assert.ok(responseMetaSpread > responseMetaDeclaration, "metadata must be initialized before it is spread");
  assert.ok(normalized > responseMetaSpread, "shared completion follows hosted metadata extraction");
  assert.doesNotMatch(send.slice(normalized, normalized + 1800), /payload\?\.meta|\bpayload\b/);
  assert.match(send, /localText = answerLocally\(cleaned \|\| requestMessage, recentContext\)/);
});

test("Live Vision and Humanizer do not parse or construct JWT headers", () => {
  for (const [name, source] of [["InputBar", inputBar], ["Humanizer", humanizer]]) {
    assert.match(source, /authFetch|requireAuthenticatedFetch/);
    assert.doesNotMatch(source, /revelacode_access_token|revelacode_token_type|getAccessToken\(|getTokenType\(|Authorization:/, name + " must delegate session handling");
  }
});
