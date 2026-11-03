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
    "src/Dashboard/JumuiyaDashboardShell.jsx",
  ];
  for (const file of dashboardFiles) {
    assert.doesNotMatch(source(file), /HubRevenueOffers/);
  }

  const appShell = source("src/components/MainDashboardV2.jsx");
  const accountCenter = source("src/components/UserAccountDashboard.jsx");
  const modal = source("src/premium/PlansModal.jsx");
  const biasharaHeader = source("src/Dashboard/Biashara/BiasharaHeader.jsx");
  const elimuHeader = source("src/Dashboard/elimu/components/ElimuDashboardHeader.jsx");
  const shambaHeader = source("src/Dashboard/ShambaHub.jsx");
  const communityHeader = source("src/Dashboard/CommunityDashboard.jsx");
  const faithHeader = source("src/components/FaithDashboard.jsx");
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

test("all plan entry points use the standalone Premium modal, not dashboard plan sections", () => {
  const appShell = source("src/components/MainDashboardV2.jsx");
  const jumuiyaShell = source("src/Dashboard/JumuiyaDashboardShell.jsx");
  const aiDashboard = source("src/components/AIAssistantDashboard.jsx");
  const sidebar = source("src/components/Sidebar.jsx");
  const modal = source("src/premium/PlansModal.jsx");

  assert.match(appShell, /<PremiumPlansStar\s*\/>/);
  assert.match(appShell, /<PlansModal/);
  assert.match(source("src/premium/PremiumPlansStar.jsx"), /data-premium-plans-star="true"/);
  assert.doesNotMatch(jumuiyaShell, /HubRevenueOffers|Plans and upgrade/);
  assert.doesNotMatch(aiDashboard, /AI trial &amp; plans|HubRevenueOffers|aiRevenueOpen/);
  assert.doesNotMatch(sidebar, /Plans|onOpenPlans/);
  assert.match(modal, /revenueApi\.listPlans\(/);
  assert.match(modal, /revenueApi\.startCheckout\(/);
  assert.match(modal, /revenueApi\.getCheckout\(/);
});
