import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  collectWorkspaceRoles,
  hasPlatformAdminRole,
  hasSupportAdminRole,
  hasSupportWorkspaceRole,
  resolveWorkspaceRole,
} from "../src/auth/workspaceRoles.mjs";
import { resolveBackendBaseUrl } from "../src/auth/backendUrl.mjs";

test("support agents are recognized from singular and plural role fields", () => {
  assert.equal(hasSupportWorkspaceRole({ role: "support_agent" }), true);
  assert.equal(hasSupportWorkspaceRole({ roles: ["user", "support_agent"] }), true);
  assert.equal(resolveWorkspaceRole({ roles: ["user", "support_agent"] }), "support_agent");
});

test("workspace selection gives platform owner precedence over secondary roles", () => {
  assert.equal(
    resolveWorkspaceRole({ role: "user", roles: ["user", "support_admin", "super_admin"] }),
    "super_admin",
  );
  assert.equal(hasPlatformAdminRole({ roles: ["user", "super_admin"] }), true);
  assert.equal(hasSupportAdminRole({ roles: ["support_admin"] }), true);
});

test("the role collector accepts nested login and session response shapes", () => {
  assert.deepEqual(
    collectWorkspaceRoles({ data: { user: { role: "support_agent", roles: ["user", "support_agent"] } } }),
    ["support_agent", "user"],
  );
});

test("backend URL resolution uses the backend deployment variable and has a production fallback", () => {
  assert.equal(
    resolveBackendBaseUrl({ VITE_BACKEND_URL: "https://api.example.test/" }),
    "https://api.example.test",
  );
  assert.equal(
    resolveBackendBaseUrl({}),
    "https://revelacode-backend.onrender.com",
  );
});

test("admin and support entry points use backend-verified role data", async () => {
  const [login, pages, gate, auth] = await Promise.all([
    readFile(new URL("../src/components/admin/AdminLogin.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/pages.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/AuthGate.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/context/AuthContext.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(login, /\/api\/auth\/me/);
  assert.match(login, /hasSupportWorkspaceRole/);
  assert.match(pages, /hasSupportWorkspaceRole/);
  assert.match(gate, /applyVerifiedUser/);
  assert.match(gate, /resolveBackendBaseUrl/);
  assert.match(auth, /applyVerifiedUser/);
});
