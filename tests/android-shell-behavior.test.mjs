import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (file) => readFileSync(path.join(root, file), "utf8");

test("Android uses one touch-scroll owner for the shared hub workspace", () => {
  const shell = source("src/components/MainDashboardV2.jsx");
  const styles = source("src/index.css");

  assert.match(shell, /data-app-scroll-root="true"/);
  assert.match(shell, /height: 0, minHeight: 0/);
  assert.match(shell, /root\.dataset\.revelacodeNativeApp = "true"/);
  assert.match(styles, /html\[data-revelacode-native-app="true"\] body/);
  assert.match(styles, /overflow-y: auto/);
  assert.match(styles, /-webkit-overflow-scrolling: touch/);
  assert.match(styles, /touch-action: pan-y/);
});

test("Android shows only the active hub's own mobile navigation dock", () => {
  const shell = source("src/components/MainDashboardV2.jsx");
  const shamba = source("src/Dashboard/ShambaMobileExperience.jsx");
  const biashara = source("src/Dashboard/Biashara/BiasharaShell.jsx");
  const biasharaStyles = source("src/Dashboard/Biashara/biashara-overview.css");
  const community = source("src/Dashboard/CommunityDashboard.jsx");
  const faith = source("src/components/FaithDashboard.jsx");

  assert.match(shell, /new Set\(\["community", "shamba", "biashara", "faith"\]\)/);
  assert.match(shell, /!HUBS_WITH_OWN_MOBILE_NAV\.has\(activeView\)/);
  assert.match(shamba, /fixed bottom-0 left-0 right-0/);
  assert.match(biashara, /biashara-mobile-bottom-nav/);
  assert.match(biasharaStyles, /\.biashara-mobile-bottom-nav \{/);
  assert.match(community, /aria-label="Jumuiya Community navigation"/);
  assert.match(faith, /FaithMobileBottomNav/);
});

test("Android device Back returns any active hub to the Home dashboard", () => {
  const shell = source("src/components/MainDashboardV2.jsx");

  assert.match(shell, /CapacitorApp\.addListener\("backButton", handleAndroidBack\)/);
  assert.match(shell, /else if \(activeView !== "home"\) \{\s*setActiveView\("home"\);/);
  assert.match(shell, /nextParams\.delete\("hub"\)/);
  assert.match(shell, /dashboardContentRef\.current\?\.scrollTo\(\{ top: 0/);
});

test("Light, Dark and System theme is mirrored to the document and portal host", () => {
  const theme = source("src/components/hooks/useTheme.jsx");

  assert.match(theme, /root\.classList\.toggle\("dark", dark\)/);
  assert.match(theme, /root\.dataset\.theme = resolved/);
  assert.match(theme, /body\.classList\.toggle\("dark", dark\)/);
  assert.match(theme, /body\.dataset\.theme = resolved/);
  assert.match(theme, /body\.style\.colorScheme = resolved/);
});
