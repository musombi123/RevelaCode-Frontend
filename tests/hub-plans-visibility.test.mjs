import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

test("each subscription hub renders its own plans in its primary workspace", () => {
  const contracts = [
    ["src/Dashboard/BiasharaDashboard.jsx", '<HubRevenueOffers hub="biashara" compact />'],
    ["src/Dashboard/ShambaDashboard.jsx", '<HubRevenueOffers hub="shamba" compact />'],
    ["src/Dashboard/ElimuDashboardWorkspace.jsx", '<HubRevenueOffers hub="elimu" compact />'],
    ["src/components/FaithDashboard.jsx", '<HubRevenueOffers hub="faith" compact />'],
    ["src/Dashboard/Community/CommunityMarketplace.jsx", '<HubRevenueOffers hub="marketplace" compact />'],
    ["src/components/AIAssistantDashboard.jsx", '<HubRevenueOffers hub="smart_ai" compact />'],
  ];

  for (const [file, marker] of contracts) {
    assert.ok(
      source(file).includes(marker),
      `Expected the ${marker} plan panel in ${file}`,
    );
  }
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
