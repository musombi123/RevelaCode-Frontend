import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isAuthoritativeSessionCheck, isExplicitRevokedSessionResponse } from "../src/auth/sessionRequests.mjs";

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

test("Android Google sign-in launches a browser and handles OAuth deep links", () => {
  assert.match(startModal, /registerPlugin\("Browser"\)/);
  assert.match(startModal, /NativeBrowser\.open\(/);
  assert.match(startModal, /client", isNativeAndroid \? "android" : "web"/);
  assert.match(app, /appUrlOpen/);
  assert.match(app, /getLaunchUrl\(\)/);
  assert.match(app, /parsed\.protocol === "com\.revelacode\.app:"/);
  assert.match(app, /parsed\.hostname === "oauth"/);
  assert.match(app, /parsed\.pathname === "\/callback"/);
  assert.match(app, /isVerifiedAndroidAppLink/);
  assert.match(app, /parsed\.host === "revelacode\.co\.ke"/);
  assert.match(app, /parsed\.pathname === "\/oauth\/android-callback"/);
  assert.match(app, /NativeBrowser\.close\(\)/);
});

test("Android support invitation Google acceptance uses the Android callback", async () => {
  const invitationPage = await readFile(new URL("../src/pages/SupportInvitationPage.jsx", import.meta.url), "utf8");
  assert.match(invitationPage, /client: isNativeAndroid \? "android" : "web"/);
  assert.match(invitationPage, /NativeBrowser\.open\(/);
});

test("Android App Links are associated with the signed RevelaCode package", async () => {
  const statements = JSON.parse(await readFile(new URL("../public/.well-known/assetlinks.json", import.meta.url), "utf8"));
  assert.equal(statements[0].target.package_name, "com.revelacode.app");
  assert.ok(statements[0].relation.includes("delegate_permission/common.handle_all_urls"));
  assert.ok(statements[0].target.sha256_cert_fingerprints.includes("DC:05:28:00:59:31:C6:18:E7:0B:B7:0F:E2:D4:42:7E:24:29:22:B4:74:26:01:5C:16:54:AF:E4:E9:50:E5:40"));
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
  assert.match(authContext, /response\.status === 401 &&\s*requestWasAuthenticated &&\s*isAuthoritativeSessionRequest/);
  assert.match(authContext, /isAuthoritativeSessionCheck\(/);
});

test("only the primary backend can invalidate a cached login, including relayed session revocation", () => {
  const authApi = "https://backend.revelacode.co.ke";
  assert.equal(isAuthoritativeSessionCheck(authApi + "/api/auth/me", authApi, "GET"), true);
  assert.equal(isAuthoritativeSessionCheck("https://revelaai.onrender.com/api/core-mesh/dashboard", authApi, "GET"), false);
  assert.equal(isAuthoritativeSessionCheck("https://revelaai.onrender.com/api/security-academy/courses", authApi, "GET"), false);
  assert.equal(isAuthoritativeSessionCheck(authApi + "/api/users/me", authApi, "GET"), false);
  assert.equal(isAuthoritativeSessionCheck(authApi + "/api/auth/me", authApi, "POST"), false);
  assert.ok(authContext.includes("(isAuthoritativeSessionRequest || serviceReportsRevokedSession)"));
  assert.ok(authContext.includes("`${backendBaseUrl}/api/auth/me`"));
  assert.ok(authContext.includes("primarySessionRejected"));
  assert.match(authContext, /clearToken\\(\\);[\\s\\S]*?setUser\\(null\\)/);
});

test("only an explicit revoked-session 401 from a connected service triggers primary session verification", () => {
  assert.equal(
    isExplicitRevokedSessionResponse(401, { error: { code: "session_revoked", message: "This session has been revoked. Sign in again." } }),
    true,
  );
  assert.equal(
    isExplicitRevokedSessionResponse(401, { error: { code: "unauthorized", message: "Not allowed." } }),
    false,
  );
  assert.equal(
    isExplicitRevokedSessionResponse(403, { error: { code: "session_revoked" } }),
    false,
  );
  assert.match(authContext, /initiallyRevokedSession/);
  assert.match(authContext, /primarySessionRejected/);
});

test("school and business hosted websites share privacy and cookie preference controls", async () => {
  const schoolSite = await readFile(new URL("../src/pages/jumuiya/ElimuPublicSchoolPage.jsx", import.meta.url), "utf8");
  const businessSite = await readFile(new URL("../src/pages/jumuiya/BiasharaPublicWebsitePage.jsx", import.meta.url), "utf8");
  const websiteCompliance = await readFile(new URL("../src/components/compliance/WebsiteCompliance.jsx", import.meta.url), "utf8");
  assert.match(schoolSite, /<WebsiteCompliance tenantType="school"/);
  assert.match(businessSite, /<WebsiteCompliance tenantType="business"/);
  assert.match(websiteCompliance, /Cookie policy/);
  assert.match(websiteCompliance, /cookie-consent/);
  assert.match(websiteCompliance, /Reject optional/);
  assert.match(websiteCompliance, /policy_version/);
});

test("Security Academy requires per-account acknowledgement of authorized-use boundaries", async () => {
  const academy = await readFile(new URL("../src/components/SecurityAcademyDashboard.jsx", import.meta.url), "utf8");
  assert.match(academy, /SECURITY_ACADEMY_NOTICE_VERSION/);
  assert.match(academy, /explicitly authorized in writing/);
  assert.match(academy, /Acknowledge and continue/);
  assert.ok(academy.includes("if (!authenticated || !scopeAccepted)"));
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
