import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearStoredTokens,
  persistTokens,
  readAccessToken,
  readRefreshToken,
  readTokenType,
} from "../src/auth/tokenStorage.mjs";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values.entries()); },
  };
}

test("persists the canonical revela_jwt key and backward-compatible aliases", () => {
  const local = memoryStorage();
  const session = memoryStorage();
  assert.equal(persistTokens({
    accessToken: "eyJ.access.signature",
    tokenType: "Bearer",
    refreshToken: "refresh-123",
  }, local, session), true);

  assert.equal(local.getItem(ACCESS_TOKEN_KEY), "eyJ.access.signature");
  assert.equal(local.getItem("revelacode_access_token"), "eyJ.access.signature");
  assert.equal(local.getItem("access_token"), "eyJ.access.signature");
  assert.equal(local.getItem("token"), "eyJ.access.signature");
  assert.equal(readAccessToken(local, session), "eyJ.access.signature");
  assert.equal(readRefreshToken(local, session), "refresh-123");
  assert.equal(readTokenType(local, session), "Bearer");
});

test("restores a legacy token from sessionStorage after reload", () => {
  const local = memoryStorage();
  const session = memoryStorage();
  session.setItem("access_token", "Bearer legacy-token");
  assert.equal(readAccessToken(local, session), "legacy-token");
});

test("logout cleanup clears access and refresh tokens from both stores", () => {
  const local = memoryStorage();
  const session = memoryStorage();
  persistTokens({ accessToken: "access", refreshToken: "refresh" }, local, session);
  clearStoredTokens(local, session);
  assert.equal(readAccessToken(local, session), "");
  assert.equal(readRefreshToken(local, session), "");
  assert.equal(local.getItem(REFRESH_TOKEN_KEY), null);
  assert.equal(session.getItem(ACCESS_TOKEN_KEY), null);
});

test("does not persist an empty access token", () => {
  const local = memoryStorage();
  assert.equal(persistTokens({ accessToken: "" }, local, memoryStorage()), false);
  assert.deepEqual(local.snapshot(), {});
});
