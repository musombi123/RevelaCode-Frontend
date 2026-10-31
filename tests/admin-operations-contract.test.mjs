import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function source(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("user management uses authenticated APIs for bans, delete and support invitations", () => {
  const file = source("src/components/admin/AdminTeamManagement.jsx");
  assert.match(file, /useAdminApi/);
  assert.match(file, /createInvitation/);
  assert.match(file, /updateUserStatus/);
  assert.match(file, /deleteUser/);
  assert.match(file, /revokeInvitation/);
  assert.match(file, /support_admin/);
  assert.match(file, /window\.confirm/);
  assert.match(file, /soft delete/i);
  assert.doesNotMatch(file, /X-API-KEY|VITE_ADMIN_API_KEY|ADMIN_API_KEY\s*=/);
});

test("support invitation acceptance uses the public preview and single-use accept API", () => {
  const page = source("src/pages/SupportInvitationPage.jsx");
  const routes = source("src/App.jsx");
  const login = source("src/components/admin/AdminLogin.jsx");
  assert.match(page, /\/api\/admin\/invitations\/preview/);
  assert.match(page, /\/api\/admin\/invitations\/accept/);
  assert.match(page, /confirm_password/);
  assert.match(page, /At least 12 characters/);
  assert.match(routes, /path="\/support-invitation"/);
  assert.match(login, /"support_admin"/);
  assert.match(login, /platformAdminRoles\.includes\(role\)/);
});

test("Support Admin receives a separate oversight, Study, policy and handbook workspace", () => {
  const pages = source("src/app/pages.jsx");
  const dashboard = source("src/components/support/SupportDashboard.jsx");
  const sidebar = source("src/components/support/SupportSidebar.jsx");
  const operations = source("src/components/support/SupportAdminOperations.jsx");
  assert.match(pages, /"support", "support_admin"/);
  for (const key of ['"team"', '"study"', '"policies"', '"handbook"']) {
    assert.ok(sidebar.includes(key), `Expected Support Admin navigation for ${key}`);
    assert.ok(dashboard.includes(`activeView === ${key}`), `Expected Support Admin view for ${key}`);
  }
  assert.match(operations, /getSupportAdminOverview/);
  assert.match(operations, /getSupportAdminTeam/);
  assert.match(operations, /assignSupportTicket/);
  assert.match(operations, /getSupportAdminActivity/);
});

test("policy, study and operational handbook are present and do not embed privileged API keys", () => {
  const policy = source("src/components/admin/AdminPolicyManagement.jsx");
  const study = source("src/components/admin/AdminStudyManagement.jsx");
  const admin = source("src/components/admin/AdminDashboard.jsx");
  const sidebar = source("src/components/admin/AdminSidebar.jsx");
  const handbook = source("src/components/admin/AdminOperationsHandbook.jsx");
  assert.match(policy, /updateLegalDocument/);
  assert.match(policy, /updatePolicy/);
  assert.match(study, /uploadStudyMaterial/);
  assert.match(study, /seed-faith-catalog/);
  assert.match(admin, /AdminOperationsHandbook/);
  assert.match(admin, /operations:/);
  assert.match(sidebar, /key: "operations"/);
  assert.match(handbook, /Revenue Management/);
  assert.match(handbook, /Support Administrator/);
  assert.doesNotMatch(policy, /ADMIN_API_KEY\s*=\s*["']/);
  assert.doesNotMatch(study, /X-API-KEY|VITE_ADMIN_API_KEY/);
});


test("Shamba admin verification is a direct, authenticated profile review workflow", () => {
  const page = source("src/components/admin/AdminShambaVerification.jsx");
  const api = source("src/services/jumuiyaApi.jsx");
  const dashboard = source("src/components/admin/AdminDashboard.jsx");
  assert.match(page, /getFarmerVerificationQueue/);
  assert.match(page, /reviewFarmerProfile/);
  assert.match(page, /Verify profile/);
  assert.match(page, /Request information/);
  assert.match(page, /REQUIRED_FIELDS/);
  assert.match(api, /getData\("\/shamba\/farmer\/verification-queue"\)/);
  assert.match(api, /\/shamba\/farmer\/\$\{encodeId\(farmerId/);
  assert.match(dashboard, /shambaVerification:/);
  assert.doesNotMatch(page, /VITE_ADMIN_API_KEY|X-API-KEY/);
});

test("Meta-Engineer Lab reuses the signed-in RevelaCode session for its protected API", () => {
  const lab = source("src/pages/MetaEngineerLab.jsx");
  assert.match(lab, /auth\.getAccessToken/);
  assert.match(lab, /authFetch/);
  assert.match(lab, /Authorization/);
  assert.doesNotMatch(lab, /AdminLogin|login\(/);
});
