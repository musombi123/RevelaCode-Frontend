import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const startModal = await readFile(new URL("../src/components/StartModal.jsx", import.meta.url), "utf8");
const account = await readFile(new URL("../src/components/AccountDashboard.jsx", import.meta.url), "utf8");
const callback = await readFile(new URL("../src/pages/OAuthCallbackPage.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("identity gateway exposes Microsoft and GitHub only when configured for sign-in", () => {
  assert.match(startModal, /identityProviders\.microsoft\?\.enabled/);
  assert.match(startModal, /handleProviderSignIn\("microsoft"\)/);
  assert.match(startModal, /identityProviders\.github\?\.enabled/);
  assert.match(startModal, /handleProviderSignIn\("github"\)/);
  assert.match(startModal, /\/api\/oauth\/\" \+ provider \+ \"\/start/);
  assert.match(startModal, /provider, \"client\"/);
});

test("phone OTP login uses a separate challenge and six-digit verification step", () => {
  assert.match(startModal, /\/api\/identity\/phone\/login\/request/);
  assert.match(startModal, /\/api\/identity\/phone\/login\/verify/);
  assert.match(startModal, /step === "phone-verify"/);
  assert.match(startModal, /replace\(\/\\D\/g, ""\)\.slice\(0, 6\)/);
  assert.match(startModal, /phoneChallengeId/);
});

test("passkey sign-in uses browser WebAuthn and the backend authentication ceremony", () => {
  assert.match(startModal, /navigator\.credentials\.get/);
  assert.match(startModal, /\/api\/identity\/passkeys\/authentication\/options/);
  assert.match(startModal, /\/api\/identity\/passkeys\/authentication\/verify/);
  assert.match(startModal, /serialisePublicKeyCredential/);
  assert.match(startModal, /PublicKeyCredential/);
});

test("account security links identities through an authenticated API before redirecting", () => {
  assert.match(account, /\/api\/oauth\/" \+ provider \+ \"\/link\/start/);
  assert.match(account, /authFetch/);
  assert.match(account, /authorizationUrl\.protocol !== "https:"/);
  assert.match(account, /accounts\.google\.com/);
  assert.match(account, /login\.microsoftonline\.com/);
  assert.match(account, /github\.com/);
  assert.match(account, /\/api\/identity\/providers\//);
});

test("account security provides actual SMS verification and passkey management", () => {
  assert.match(account, /\/api\/identity\/phone\/link\/request/);
  assert.match(account, /\/api\/identity\/phone\/link\/verify/);
  assert.match(account, /\/api\/identity\/passkeys\/registration\/options/);
  assert.match(account, /\/api\/identity\/passkeys\/registration\/verify/);
  assert.match(account, /\/api\/identity\/passkeys\/\" \+ encodeURIComponent/);
});

test("OAuth completion exchanges one-time tickets and enforces the existing MFA step", () => {
  assert.match(callback, /\/api\/oauth\/exchange/);
  assert.match(callback, /payload\.mfa_required/);
  assert.match(callback, /\/api\/auth\/mfa\/login-verify/);
  assert.match(callback, /login\(payload\)/);
  assert.match(app, /parsed\.pathname === \"\/oauth\/android-callback\"/);
  assert.match(app, /navigate\(localPath, \{ replace: true \}\)/);
});
