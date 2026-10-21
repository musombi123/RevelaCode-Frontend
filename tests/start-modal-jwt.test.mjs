import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const startModal = await readFile(new URL("../src/components/StartModal.jsx", import.meta.url), "utf8");
const authContext = await readFile(new URL("../src/context/AuthContext.jsx", import.meta.url), "utf8");
const authGate = await readFile(new URL("../src/components/AuthGate.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("StartModal delegates token persistence to AuthContext and does not put credentials in the cached user", () => {
  assert.match(startModal, /login\(\{\s*user:\s*safeAuthUser,\s*access_token:\s*accessToken/);
  assert.match(authContext, /persistToken\(\s*accessToken/);
  assert.doesNotMatch(startModal, /localStorage\.setItem\(\s*["']revela_jwt["']/);
  assert.doesNotMatch(startModal, /accessToken,\s*tokenType,\s*refreshToken,\s*password/);
});

test("closing/resetting StartModal does not clear the token", () => {
  assert.doesNotMatch(startModal, /localStorage\.removeItem\(\s*["']revela_jwt["']/);
  assert.match(authContext, /clearStoredTokens\(\)/);
  assert.match(authContext, /const logout\s*=|function logout/);
});

test("credential-like data is sanitized before the cached account identity is persisted", () => {
  assert.match(authContext, /sanitizeSessionIdentity\(\s*normalizeUser\(\s*userData\s*\)\s*\)/);
  assert.match(authContext, /sanitizeSessionIdentity\(parsed\.user\)/);
  assert.doesNotMatch(authContext, /Login payload received without access token:\s*payload/);
});

test("authenticated requests refresh once and retry with the replacement bearer token", () => {
  assert.match(authContext, /readRefreshToken\(\)/);
  assert.match(authContext, /fetch\(refreshUrl,\s*\{/);
  assert.match(authContext, /persistToken\(nextToken, nextTokenType, nextRefreshToken\)/);
  assert.match(authContext, /response = await fetch\(url, \{ \.\.\.options, headers: retryHeaders \}\)/);
  assert.match(authContext, /if \(response\.status === 401\)\s*\{[\s\S]*?clearToken\(\)/);
});

test("AuthGate fails closed unless the server confirms an identity and current roles", () => {
  assert.match(authGate, /\/api\/auth\/me/);
  assert.match(authGate, /payload\?\.authenticated !== true/);
  assert.match(authGate, /const verifiedUser = payload\?\.user \|\| payload\?\.data\?\.user/);
  assert.match(authGate, /verifiedUser\.roles/);
  assert.match(app, /<AuthGate requiredRoles=\{requiredRoles\}>[\s\S]*?<Pages initialAdminTab=\{initialAdminTab\}/);
  assert.doesNotMatch(authGate, /user\?\.roles/);
  assert.match(authGate, /Navigate to="\/login" replace state=\{\{ from: location \}\}/);
});
