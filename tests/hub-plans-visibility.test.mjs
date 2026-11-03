import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

test("premium plans are launched globally, not embedded in hub dashboards", () => {
  const dashboardFiles = [
    "src/Dashboard/BiasharaDashboard.jsx",
    "src/Dashboard/ShambaDashboard.jsx",
    "src/Dashboard/ElimuDashboardWorkspace.jsx",
    "src/Dashboard/Community/CommunityMarketplace.jsx",
    "src/components/AIAssistantDashboard.jsx",
  ];
  for (const file of dashboardFiles) {
    assert.doesNotMatch(source(file), /HubRevenueOffers/);
  }

  const appShell = source("src/components/MainDashboardV2.jsx");
  const accountCenter = source("src/components/UserAccountDashboard.jsx");
  const modal = source("src/premium/PlansModal.jsx");
  assert.match(appShell, /<PremiumPlansStar\s*\/>/);
  assert.match(appShell, /<PlansModal/);
  assert.match(accountCenter, /<PremiumPlansStar\s*\/>/);
  assert.match(modal, /revenueApi\.listPlans\(/);
  assert.match(modal, /revenueApi\.startCheckout\(/);
  assert.match(modal, /revenueApi\.getCheckout\(/);
});

test("Faith Hub is permanently free and does not render subscription offers", () => {
  const dashboard = source("src/components/FaithDashboard.jsx");
  const workspace = source("src/components/faith/FaithPremiumWorkspace.jsx");

  assert.doesNotMatch(dashboard, /HubRevenueOffers/);
  assert.doesNotMatch(workspace, /\/api\/revenue\//);
  assert.doesNotMatch(workspace, /startCheckout|startTrial|Plans & access/);
  assert.match(workspace, /Free Faith Hub access/);
});

test("Community is permanently free and does not render membership subscription offers", () => {
  const dashboard = source("src/Dashboard/CommunityDashboard.jsx");
  const widget = source("src/Dashboard/HubRevenueOffers.jsx");

  assert.match(dashboard, /Community is free for everyone/);
  assert.match(dashboard, /Sponsored advertisements help keep Community open/);
  assert.doesNotMatch(dashboard, /HubRevenueOffers/);
  assert.match(widget, /apiHub === "community"/);
  assert.match(widget, /Community is permanently free/);
});

test("hub plan cards load the central catalogue, show per-hub trial status, and gate payment", () => {
  const widget = source("src/Dashboard/HubRevenueOffers.jsx");

  assert.match(widget, /revenueApi\.listPlans\(stream/);
  assert.match(widget, /revenueApi\.listTrials\(/);
  assert.match(widget, /revenueApi\.listSubscriptions\(/);
  assert.match(widget, /revenueApi\.startCheckout\(/);
  assert.match(widget, /plan\.status === "available"/);
  assert.match(widget, /provider-confirmed payment/);
  assert.match(widget, /\{trialDays\}-day free \{label\} trial/);
});
