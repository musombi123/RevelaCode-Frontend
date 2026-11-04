import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildDemoChapters } from "../src/demo/demoScript.js";
import {
  DEMO_SHOP,
  DEMO_FARM,
  DEMO_SCHOOL,
  DEMO_SCHOOL_ACCESS,
  DEMO_PRESENTATION_DATA,
  DEMO_STUDENTS,
  DEMO_CLASSES,
  DEMO_STAFF,
  DEMO_ATTENDANCE,
  DEMO_ASSESSMENTS,
  DEMO_FEES,
  DEMO_PARENTS,
  DEMO_SCHOOL_INVENTORY,
  DEMO_SCHOOL_RECEIPTS,
  DEMO_FEE_REMINDERS,
  DEMO_SCHOOL_SYNC_JOBS,
  DEMO_SCHOOL_REPORTS,
  DEMO_BUSINESS_INVOICES,
  DEMO_BUSINESS_AUTOMATIONS,
  DEMO_FACTORY_MACHINES,
  DEMO_FACTORY_QUALITY_CHECKS,
  DEMO_BUSINESS_ATTENDANCE,
  DEMO_BUSINESS_TEAM,
  DEMO_FARM_CROPS,
  DEMO_FARM_ACTIVITIES,
  DEMO_HARVESTS,
  DEMO_SOIL_TESTS,
  DEMO_FARM_RIGHTS_QUEUE,
  DEMO_SHAMBA_SAFETY_REPORTS,
  DEMO_PRODUCTS,
  DEMO_ORDERS,
  DEMO_SALES,
  DEMO_EXPENSES,
  DEMO_COMMUNITY_POSTS,
  DEMO_STUDY_MATERIALS,
  getDemoPayload,
} from "../src/demo/mockData.js";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("the curated demo chapters follow the required ecosystem order", () => {
  const core = ["biashara", "shamba", "education", "faith", "community"];
  const hubs = [
    ...core.map((key) => ({ key, title: key })),
    { key: "marketplace", title: "Marketplace" },
  ];
  const dashboards = [
    ...core.map((key) => ({ key, title: key })),
    { key: "marketplace", title: "Marketplace" },
    { key: "hidden-lab", title: "Hidden lab", hidden: true },
  ];

  const ids = buildDemoChapters(hubs, dashboards).map((chapter) => chapter.id);
  assert.deepEqual(ids, [
    "welcome", "home", ...core, "marketplace", "ai", "account", "finish",
  ]);
  assert.equal(ids.includes("hidden-lab"), false);
});

test("every guided chapter has bilingual, short, actionable step data", () => {
  const core = ["biashara", "shamba", "education", "faith", "community"];
  const chapters = buildDemoChapters(core.map((key) => ({ key, title: key })), []);
  const guided = chapters.filter((chapter) => chapter.id !== "finish");

  for (const chapter of guided) {
    assert.ok(chapter.whoFor?.en && chapter.whoFor?.sw, chapter.id + " needs a bilingual audience line");
    assert.ok(chapter.summary?.en && chapter.summary?.sw, chapter.id + " needs a bilingual summary");
    assert.ok(chapter.benefits.length <= 3, chapter.id + " has too many benefits");
    assert.ok(chapter.steps.length >= 3 && chapter.steps.length <= 5, chapter.id + " needs 3–5 steps");
    for (const item of chapter.steps) {
      assert.ok(item.title?.en && item.title?.sw, chapter.id + " step title is not bilingual");
      assert.ok(item.body?.en && item.body?.sw, chapter.id + " step body is not bilingual");
      assert.ok(item.body.en.trim().split(/\s+/).length <= 25, chapter.id + " step is too long in English");
      assert.ok(item.body.sw.trim().split(/\s+/).length <= 25, chapter.id + " step is too long in Kiswahili");
      assert.ok(["none", "click", "type"].includes(item.action));
      assert.equal(item.mobilePlacement, "sheet");
    }
  }
});

test("the demo API returns sample GET data and simulated write success", () => {
  const shop = getDemoPayload("/api/jumuiya/biashara/products");
  const farm = getDemoPayload("/api/jumuiya/shamba/farms");
  const schoolAccess = getDemoPayload("/api/jumuiya/elimu/access");
  const community = getDemoPayload("/api/jumuiya/community/posts");
  const finance = getDemoPayload("/api/jumuiya/biashara/finance/transactions");
  const account = getDemoPayload("/api/jumuiya/account/payments");
  const studies = getDemoPayload("https://revelacode-backend.onrender.com/api/study/materials?category=faith&limit=100");
  const aiReply = getDemoPayload("https://revelaai.onrender.com/ai", "POST", JSON.stringify({ message: "Show me three ways to improve my work today." }));
  const schoolStudents = getDemoPayload("/api/jumuiya/elimu/students");
  const schoolClasses = getDemoPayload("/api/jumuiya/elimu/classes");
  const schoolFees = getDemoPayload("/api/jumuiya/elimu/fees");
  const farmCrops = getDemoPayload("/api/jumuiya/shamba/farms/demo-farm-001/crops");
  const farmRightsQueue = getDemoPayload("/api/jumuiya/shamba/trust/verification-queue");
  const businessOrders = getDemoPayload("/api/jumuiya/biashara/orders");
  const businessExpenses = getDemoPayload("/api/jumuiya/biashara/expenses");
  const schoolInventory = getDemoPayload("/api/jumuiya/elimu/inventory/items");
  const schoolParents = getDemoPayload("/api/jumuiya/elimu/portal/parents");
  const schoolReports = getDemoPayload("/api/jumuiya/elimu/reports/dashboard");
  const businessInvoices = getDemoPayload("/api/jumuiya/biashara/finance/invoices");
  const businessAutomation = getDemoPayload("/api/jumuiya/biashara/automations/rules");
  const businessMachines = getDemoPayload("/api/jumuiya/biashara/factory/machines");
  const write = getDemoPayload(
    "https://revelacode-backend.onrender.com/api/jumuiya/biashara/products",
    "POST",
    JSON.stringify({ name: "Demo maize flour" }),
  );

  assert.equal(shop.demo, true);
  assert.ok(Array.isArray(shop.products) && shop.products.length > 0);
  assert.equal(farm.demo, true);
  assert.ok(Array.isArray(farm.farms) && farm.farms.length > 0);
  assert.equal(schoolAccess.demo, true);
  assert.equal(schoolAccess.access.allowed, true);
  assert.equal(schoolAccess.access.role, "owner");
  assert.equal(schoolStudents.students.length, 320);
  assert.equal(schoolClasses.classes.length, 12);
  assert.ok(schoolFees.fees.length >= 100);
  assert.equal(farmCrops.crops.length, 4);
  assert.equal(farmRightsQueue.items.length, 2);
  assert.equal(businessOrders.orders.length, 18);
  assert.equal(businessExpenses.expenses.length, 12);
  assert.ok(schoolInventory.items.length >= 10);
  assert.ok(schoolParents.parents.length >= 50);
  assert.equal(schoolReports.reports.enrolment.total, 320);
  assert.equal(businessInvoices.invoices.length, 12);
  assert.equal(businessAutomation.rules.length, 3);
  assert.equal(businessMachines.machines.length, 2);
  assert.equal(community.demo, true);
  assert.ok(Array.isArray(community.posts) && community.posts.length > 0);
  assert.equal(finance.demo, true);
  assert.ok(Array.isArray(finance.transactions) && finance.transactions.length > 0);
  assert.equal(account.demo, true);
  assert.equal(account.payments.currency, "KES");
  assert.equal(studies.demo, true);
  assert.ok(Array.isArray(studies.materials) && studies.materials.length > 0);
  assert.ok(DEMO_STUDY_MATERIALS.length > 0);
  assert.equal(aiReply.demo, true);
  assert.match(aiReply.response, /^Demo reply:/);
  assert.equal(aiReply.data.model, "demo-sample");
  assert.equal(write.demo, true);
  assert.equal(write.data.status, "simulated");
  assert.match(write.message, /nothing was saved/i);

  // Keep the fixture exports live so fixture shape changes remain covered.
  assert.ok(DEMO_SHOP.business);
  assert.ok(DEMO_FARM.farmer);
  assert.ok(DEMO_SCHOOL.school);
  assert.equal(DEMO_SCHOOL.school.verification_status, "demo");
  assert.equal(DEMO_SCHOOL.school.is_demo, true);
  assert.equal(DEMO_SCHOOL_ACCESS.allowed, true);
  assert.equal(DEMO_PRESENTATION_DATA.persistence, "disabled");
  assert.equal(DEMO_SCHOOL_REPORTS.fees.billed, DEMO_SCHOOL_REPORTS.fees.collected + DEMO_SCHOOL_REPORTS.fees.outstanding);
  assert.equal(DEMO_SCHOOL_REPORTS.attendance.present + DEMO_SCHOOL_REPORTS.attendance.absent + DEMO_SCHOOL_REPORTS.attendance.late, DEMO_SCHOOL_REPORTS.attendance.total);
  assert.equal(DEMO_SHOP.finance.income_total - DEMO_SHOP.finance.expenses_total, DEMO_SHOP.finance.net_estimate);
  assert.equal(DEMO_STUDENTS.length, 320);
  assert.equal(DEMO_CLASSES.length, 12);
  assert.equal(DEMO_STAFF.length, 18);
  assert.ok(DEMO_ATTENDANCE.length >= 90);
  assert.ok(DEMO_ASSESSMENTS.length >= 90);
  assert.ok(DEMO_FEES.length >= 100);
  assert.ok(DEMO_PARENTS.length >= 50);
  assert.equal(DEMO_SCHOOL_INVENTORY.length, 10);
  assert.ok(DEMO_SCHOOL_RECEIPTS.length >= 20);
  assert.ok(DEMO_FEE_REMINDERS.length >= 20);
  assert.equal(DEMO_SCHOOL_SYNC_JOBS.length, 3);
  assert.equal(DEMO_SCHOOL_REPORTS.enrolment.total, 320);
  assert.equal(DEMO_BUSINESS_INVOICES.length, 12);
  assert.equal(DEMO_BUSINESS_AUTOMATIONS.length, 3);
  assert.equal(DEMO_FACTORY_MACHINES.length, 2);
  assert.equal(DEMO_FACTORY_QUALITY_CHECKS.length, 2);
  assert.equal(DEMO_BUSINESS_ATTENDANCE.length, 8);
  assert.equal(DEMO_BUSINESS_TEAM.length, 8);
  assert.equal(DEMO_FARM_CROPS.length, 4);
  assert.ok(DEMO_FARM_ACTIVITIES.length >= 4);
  assert.ok(DEMO_HARVESTS.length >= 2);
  assert.ok(DEMO_SOIL_TESTS.length >= 2);
  assert.equal(DEMO_FARM_RIGHTS_QUEUE.length, 2);
  assert.equal(DEMO_SHAMBA_SAFETY_REPORTS.length, 2);
  assert.equal(DEMO_PRODUCTS.length, 30);
  assert.equal(DEMO_ORDERS.length, 18);
  assert.equal(DEMO_SALES.length, 40);
  assert.equal(DEMO_EXPENSES.length, 12);
  assert.ok(DEMO_COMMUNITY_POSTS.length > 0);
});

test("required stable tour targets exist in the real application surfaces", () => {
  const sources = {
    start: read("src/components/StartModal.jsx"),
    home: read("src/components/dashboardConfig.jsx"),
    biashara: read("src/Dashboard/BiasharaDashboard.jsx") + read("src/Dashboard/Biashara/BiasharaInternalWorkspace.jsx") + read("src/Dashboard/Biashara/BiasharaShell.jsx"),
    shamba: read("src/Dashboard/ShambaMobileExperience.jsx") + read("src/Dashboard/ShambaHub.jsx"),
    elimu: read("src/Dashboard/ElimuDashboardWorkspace.jsx") + read("src/Dashboard/elimu/components/ElimuDashboardSidebar.jsx"),
    faith: read("src/components/FaithDashboard.jsx") + read("src/components/study/StudyLibrary.jsx"),
    community: read("src/Dashboard/CommunityDashboard.jsx") + read("src/Dashboard/Community/CommunityComposer.jsx"),
    ai: read("src/components/AIAssistantDashboard.jsx") + read("src/components/InputBar.jsx"),
    account: read("src/components/UserAccountDashboard.jsx"),
    admin: read("src/components/admin/AdminDashboard.jsx"),
  };

  const required = {
    start: ["welcome-entry", "welcome-guest"],
    home: ["home-welcome", "home-hubs", "home-hub-"],
    biashara: ["biashara-overview", "biashara-nav-products", "biashara-product-name", "biashara-create-product"],
    shamba: ["shamba-overview", "shamba-nav-", "shamba-farms-screen"],
    elimu: ["elimu-overview", "elimu-open-nav", "elimu-nav-", "elimu-school-pages"],
    faith: ["faith-overview", "faith-study-library", "faith-study-root"],
    community: ["community-overview", "community-create-post", "community-composer-title", "community-back-feed", "community-chat-nav"],
    ai: ["ai-overview", "ai-chat-input", "ai-send-message", "ai-vision-tools"],
    account: ["account-overview", "account-menu-", "account-payments-preview"],
    admin: ["DemoLauncher", 'startAt="welcome"', "showPresentation"],
  };

  for (const [surface, markers] of Object.entries(required)) {
    for (const marker of markers) {
      assert.ok(sources[surface].includes(marker), surface + " is missing tour target " + marker);
    }
  }
});

test("the tour overlay provides keyboard, dialog and responsive safeguards", () => {
  const overlay = read("src/demo/DemoOverlay.jsx");
  const css = read("src/demo/demo.css");
  const provider = read("src/demo/DemoProvider.jsx");
  const api = read("src/demo/demoApi.js");
  const app = read("src/App.jsx");

  assert.match(overlay, /role="dialog"/);
  assert.match(overlay, /aria-labelledby=/);
  assert.match(overlay, /aria-live="polite"/);
  assert.match(overlay, /ArrowRight/);
  assert.match(overlay, /ArrowLeft/);
  assert.match(overlay, /event\.key === "Escape"/);
  assert.match(overlay, /backButton/);
  assert.match(overlay, /focusin/);
  assert.match(overlay, /isVisibleDemoTarget/);
  assert.match(overlay, /3000/);
  assert.match(overlay, /rc-demo-finish-actions/);
  assert.match(overlay, /if \(!voice\) return undefined/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(provider, /localStorage\.getItem/);
  assert.match(provider, /localStorage\.setItem/);
  assert.match(provider, /startPresentation/);
  assert.match(provider, /exitPresentation/);
  assert.match(provider, /presentationOnly/);
  assert.match(overlay, /if \(!active \|\| presentationOnly\) return null/);
  assert.match(read("src/demo/DemoLauncher.jsx"), /Browse demo systems/);
  assert.match(read("src/demo/DemoLauncher.jsx"), /Exit presentation/);
  assert.match(api, /prototype\.send = function demoSafeSend/);
  assert.match(api, /navigator\.sendBeacon/);
  assert.match(api, /shouldMockRequest/);
  assert.match(api, /firstPartyHost/);
  assert.match(read("src/components/UserAccountDashboard.jsx"), /isGuest && isDemoApiActive/);
  assert.match(read("src/components/UserAccountDashboard.jsx"), /DEMO_ACCOUNT\.payments/);
  assert.match(app, /buildDemoChapters\(HOME_HUBS, DASHBOARDS\)/);
  assert.match(app, /<DemoProvider chapters=\{DEMO_CHAPTERS\}>/);
  assert.match(app, /<DemoOverlay \/>/);
});
