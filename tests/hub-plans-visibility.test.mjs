import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

test("Premium plan access remains in Account, not repeated across hub headers", () => {
  const appShell = source("src/components/MainDashboardV2.jsx");
  const accountCenter = source("src/components/UserAccountDashboard.jsx");
  const modal = source("src/premium/PlansModal.jsx");
  const hubHeaders = [
    "src/Dashboard/JumuiyaDashboardShell.jsx",
    "src/Dashboard/Biashara/BiasharaShell.jsx",
    "src/Dashboard/elimu/components/ElimuDashboardHeader.jsx",
    "src/Dashboard/ShambaHub.jsx",
    "src/Dashboard/CommunityDashboard.jsx",
    "src/components/FaithDashboard.jsx",
  ];

  assert.match(appShell, /<PlansModal/);
  assert.match(accountCenter, /<PremiumPlansStar\s*\/>/);
  assert.doesNotMatch(appShell, /PremiumPlansStar|HubShareAction|RevelaCode Premium|Compare plans and available hub trials/);

  for (const file of hubHeaders) {
    assert.doesNotMatch(source(file), /PremiumPlansStar|biashara-sidebar-premium|faith-home-premium/);
  }

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

test("Premium modal remains available without a global Premium/share strip", () => {
  const appShell = source("src/components/MainDashboardV2.jsx");
  const jumuiyaShell = source("src/Dashboard/JumuiyaDashboardShell.jsx");
  const aiDashboard = source("src/components/AIAssistantDashboard.jsx");
  const sidebar = source("src/components/Sidebar.jsx");
  const accountCenter = source("src/components/UserAccountDashboard.jsx");
  const premiumButton = source("src/premium/PremiumPlansStar.jsx");
  const modal = source("src/premium/PlansModal.jsx");

  assert.match(appShell, /<PlansModal/);
  assert.doesNotMatch(appShell, /PremiumPlansStar|HubShareAction|RevelaCode Premium/);
  assert.doesNotMatch(jumuiyaShell, /PremiumPlansStar|Plans and upgrade|displayName/);
  assert.match(accountCenter, /PremiumPlansStar/);
  assert.match(premiumButton, /data-premium-plans-star="true"/);
  assert.match(premiumButton, />Premium<\/span>/);
  assert.doesNotMatch(aiDashboard, /AI trial &amp; plans|HubRevenueOffers|aiRevenueOpen/);
  assert.doesNotMatch(sidebar, /Plans|onOpenPlans/);
  assert.match(modal, /revenueApi\.listPlans\(/);
  assert.match(modal, /revenueApi\.startCheckout\(/);
  assert.match(modal, /revenueApi\.getCheckout\(/);
});

test("Community profile photo is the shared avatar across hubs without a beside-avatar name", () => {
  const shell = source("src/Dashboard/JumuiyaDashboardShell.jsx");
  const avatarMenu = source("src/components/accounts/AvatarMenu.jsx");
  const profile = source("src/Dashboard/Community/CommunityProfileWorkspace.jsx");
  const community = source("src/Dashboard/CommunityDashboard.jsx");

  assert.match(avatarMenu, /getIdentity\(\)/);
  assert.match(avatarMenu, /community_avatar_url/);
  assert.doesNotMatch(avatarMenu, /\/api\/user\/avatar|updateUser/);
  assert.match(shell, /user\?\.community_avatar_url/);
  assert.doesNotMatch(shell, /displayName|getDisplayName/);
  assert.match(profile, /community_avatar_url: payload\.avatar_url/);
  assert.match(community, /communityProfile\?\.avatar_url/);
  assert.doesNotMatch(community, /communityProfile\?\.avatar_url \|\| user\?\.avatar_url/);
});

test("public welcome page does not publish subscription prices or plans", () => {
  const welcome = source("src/pages/PlatformWelcomePage.jsx");
  assert.doesNotMatch(welcome, /id="plans"|href="#plans"|revenueApi\.listPlans|Paid hub subscriptions|Plans built around each hub/);
  assert.doesNotMatch(welcome, /useRevenueApi|cataloguePlans|PAID_PLAN_HUBS/);
  const appShell = source("src/components/MainDashboardV2.jsx");
  assert.match(appShell, /<PlansModal/);
  assert.doesNotMatch(appShell, /PremiumPlansStar|HubShareAction/);
});
