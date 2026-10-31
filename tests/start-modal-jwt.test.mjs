import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const startModal = await readFile(new URL("../src/components/StartModal.jsx", import.meta.url), "utf8");
const authContext = await readFile(new URL("../src/context/AuthContext.jsx", import.meta.url), "utf8");
const authGate = await readFile(new URL("../src/components/AuthGate.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const mainDashboard = await readFile(new URL("../src/components/MainDashboardV2.jsx", import.meta.url), "utf8");
const dashboardConfig = await readFile(new URL("../src/components/dashboardConfig.jsx", import.meta.url), "utf8");
const preferences = await readFile(new URL("../src/components/PreferencesDashboard.jsx", import.meta.url), "utf8");
const mfaSettings = await readFile(new URL("../src/components/accounts/MfaSettings.jsx", import.meta.url), "utf8");

test("direct routes preserve lazy loading for dashboards and legal documents", () => {
  assert.match(app, /const BibleDashboard = React\.lazy\(\(\) => import\("\.\/components\/BibleDashboard\.jsx"\)\)/);
  assert.match(app, /const UserAccountDashboard = React\.lazy\(\(\) => import\("\.\/components\/UserAccountDashboard\.jsx"\)\)/);
  assert.match(app, /<React\.Suspense[\s\S]*?<UserAccountDashboard \/>[\s\S]*?<\/React\.Suspense>/);
  assert.match(app, /<React\.Suspense[\s\S]*?<BibleDashboard \/>[\s\S]*?<\/React\.Suspense>/);
  assert.match(startModal, /const LegalDocs = React\.lazy\(\(\) => import\("\.\/LegalDocs\.jsx"\)\)/);
  assert.match(startModal, /<React\.Suspense[\s\S]*?<LegalDocs[\s\S]*?<\/React\.Suspense>/);
});

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
  assert.match(authContext, /if \(response\.status === 401 && requestWasAuthenticated\)\s*\{[\s\S]*?clearToken\(\)/);
});

test("guest and public 401 responses preserve the guest identity", () => {
  assert.match(authContext, /let requestWasAuthenticated = Boolean\(\s*headers\.has\("Authorization"\) \|\| readRefreshToken\(\)\s*\)/);
  assert.match(authContext, /requestWasAuthenticated = true;[\s\S]*?headers: retryHeaders/);
  assert.match(authContext, /if \(response\.status === 401 && requestWasAuthenticated\)/);
});

test("AuthGate fails closed unless the server confirms an identity and current roles", () => {
  assert.match(authGate, /\/api\/auth\/me/);
  assert.match(authGate, /state === "unauthenticated"/);
  assert.match(authGate, /Navigate to="\/login"/);
  assert.match(authGate, /setState\("authenticated"\)/);
  assert.match(authGate, /return <>\{children\}<\/>;/);
});


test("first entry gives visitors an immediate guest-exploration choice", () => {
  assert.match(startModal, /const \[mode, setMode\] = useState\(null\)/);
  assert.match(startModal, /onClick=\{\s*handleGuestLogin/);
  assert.match(startModal, /Continue as guest/);
  assert.match(authContext, /const guestMode\s*=\s*useCallback/);
  assert.match(authContext, /isGuest:\s*true/);
});

test("guest navigation excludes identity, settings, security, and payment areas", () => {
  assert.match(mainDashboard, /dashboard\.restricted/);
  assert.match(mainDashboard, /\["accounts", "profile", "settings", "payments"\]/);
  assert.match(dashboardConfig, /dashboard\.restricted/);
});

test("optional two-step verification is manageable from Settings", () => {
  assert.match(preferences, /MfaSettings/);
  assert.match(mfaSettings, /Enable two-step verification/);
  assert.match(mfaSettings, /Disable 2FA/);
  assert.match(mfaSettings, /mfa\/setup/);
  assert.match(mfaSettings, /mfa\/enable/);
});
