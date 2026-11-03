import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isRevelaCodePlatformHostname } from "../src/utils/platformHost.mjs";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("recognises the Tauri Windows production WebView hostname as the platform", () => {
  assert.equal(isRevelaCodePlatformHostname("tauri.localhost"), true);
  assert.equal(isRevelaCodePlatformHostname("TAURI.LOCALHOST"), true);
});

test("recognises built-in RevelaCode web and local development hosts", () => {
  for (const hostname of [
    "localhost",
    "127.0.0.1",
    "revelacode.co.ke",
    "www.revelacode.co.ke",
    "dashboard.onrender.com",
  ]) {
    assert.equal(isRevelaCodePlatformHostname(hostname), true, hostname);
  }
});

test("recognises configured first-party hostnames and known hub hosts", () => {
  assert.equal(
    isRevelaCodePlatformHostname("desktop.revelacode.co.ke", ["desktop.revelacode.co.ke"]),
    true
  );
  assert.equal(isRevelaCodePlatformHostname("biashara.revelacode.co.ke", [], true), true);
});

test("does not classify unknown customer vanity domains as the platform", () => {
  assert.equal(isRevelaCodePlatformHostname("example-school.ac.ke"), false);
  assert.equal(isRevelaCodePlatformHostname("school.example.com"), false);
  assert.equal(isRevelaCodePlatformHostname(""), false);
});

test("normalises hostnames without accepting unrelated suffixes", () => {
  assert.equal(isRevelaCodePlatformHostname(" Tauri.Localhost. "), true);
  assert.equal(isRevelaCodePlatformHostname("not-tauri.localhost.example.com"), false);
});

test("the app uses the tested resolver before selecting custom school-domain mode", () => {
  assert.match(app, /isRevelaCodePlatformHostname\(\s*window\.location\.hostname/);
  assert.match(app, /if \(!isPlatformHostname\(\)\)\s*\{\s*return <ElimuPublicSchoolPage customDomainMode \/>;\s*\}/);
  assert.match(app, /return <PlatformWelcomePage \/>;/);
});


test("native Android and Windows builds bypass the marketing welcome screen", () => {
  assert.match(app, /VITE_ANDROID_APP === "true"/);
  assert.match(app, /VITE_TAURI_APP === "true"/);
  assert.match(app, /return <InternalDashboard initialHub="home" \/>/);
  assert.match(app, /<Navigate to="\/app" replace \/>/);
});

test("RevelaAI is exposed as a top-level workspace navigation entry", async () => {
  const dashboardConfig = await readFile(new URL("../src/components/dashboardConfig.jsx", import.meta.url), "utf8");
  const mainDashboard = await readFile(new URL("../src/components/MainDashboardV2.jsx", import.meta.url), "utf8");
  const aiStart = dashboardConfig.indexOf('key: "ai"');
  assert.notEqual(aiStart, -1);
  const aiEntry = dashboardConfig.slice(aiStart, dashboardConfig.indexOf("},", aiStart));
  assert.doesNotMatch(aiEntry, /hidden:\s*true/);
  assert.match(mainDashboard, /keys:\s*\["home",\s*"ai"\]/);
});
