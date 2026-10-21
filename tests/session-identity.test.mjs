import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeSessionIdentity } from "../src/auth/sessionIdentity.mjs";

test("removes direct access and refresh credentials from cached profile identity", () => {
  const input = {
    id: "user-123",
    fullName: "Example User",
    accessToken: "access-secret",
    access_token: "access-secret-2",
    refreshToken: "refresh-secret",
    refresh_token: "refresh-secret-2",
    token: "legacy-secret",
    apiKey: "private-api-key",
    api_key: "private-api-key-2",
    password: "private-password",
    role: "user",
  };

  assert.deepEqual(sanitizeSessionIdentity(input), {
    id: "user-123",
    fullName: "Example User",
    role: "user",
  });
});

test("removes credential-like fields recursively without altering safe nested profile data", () => {
  const input = {
    id: "user-123",
    preferences: { theme: "dark", authorization: "Bearer hidden" },
    school: {
      name: "Example School",
      staff: [{ name: "Teacher", private_key: "hidden", role: "teacher" }],
    },
  };

  assert.deepEqual(sanitizeSessionIdentity(input), {
    id: "user-123",
    preferences: { theme: "dark" },
    school: {
      name: "Example School",
      staff: [{ name: "Teacher", role: "teacher" }],
    },
  });
});

test("does not mutate the source account object", () => {
  const input = { fullName: "Example User", credentials: { accessToken: "secret" } };
  const original = structuredClone(input);
  sanitizeSessionIdentity(input);
  assert.deepEqual(input, original);
});
