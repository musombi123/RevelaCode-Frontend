import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const startModal = await readFile(new URL("../src/components/StartModal.jsx", import.meta.url), "utf8");
const authContext = await readFile(new URL("../src/context/AuthContext.jsx", import.meta.url), "utf8");
const authGate = await readFile(new URL("../src/components/AuthGate.jsx", import.meta.url), "utf8");

test("StartModal persists the canonical JWT and any issued refresh token", () => {
  assert.match(startModal, /localStorage\.setItem\(\s*"revela_jwt"/);
  assert.match(startModal, /localStorage\.setItem\(["']revela_refresh_token["']/);
  assert.match(startModal, /authFetch\(url, requestOptions\)/);
});

test("closing/resetting StartModal does not clear the canonical JWT", () => {
  assert.doesNotMatch(startModal, /localStorage\.removeItem\(\s*["']revela_jwt["']/);
  assert.match(authContext, /clearStoredTokens\(\)/);
  assert.match(authContext, /const logout\s*=|function logout/);
});

test("authenticated requests refresh once and retry with the replacement bearer token", () => {
  assert.match(authContext, /readRefreshToken\(\)/);
  assert.match(authContext, /fetch\(refreshUrl,\s*\{/);
  assert.match(authContext, /persistToken\(nextToken, nextTokenType, nextRefreshToken\)/);
  assert.match(authContext, /response = await fetch\(url, \{ \.\.\.options, headers: retryHeaders \}\)/);
});

test("AuthGate verifies the session through /api/auth/me before rendering protected children", () => {
  assert.match(authGate, /\/api\/auth\/me/);
  assert.match(authGate, /state === "unauthenticated"/);
  assert.match(authGate, /Navigate to="\/login"/);
  assert.match(authGate, /setState\("authenticated"\)/);
  assert.match(authGate, /return <>\{children\}<\/>;/);
});
