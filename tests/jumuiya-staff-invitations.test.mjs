import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Elimu exposes school-scoped staff invitations in the school workspace", () => {
  const page = read("src/Dashboard/elimu/ElimuStaffManagement.jsx");
  const workspace = read("src/Dashboard/ElimuDashboardWorkspace.jsx");
  const api = read("src/services/elimuApi.jsx");

  for (const marker of ["inviteStaff", "getStaffInvitations", "resendStaffInvitation", "revokeStaffInvitation"]) {
    assert.ok(page.includes(marker) || api.includes(marker), "Elimu invitation flow is missing " + marker);
  }
  assert.match(workspace, /ElimuStaffManagement/);
  assert.match(workspace, /normalizedPath === "elimu\/staff"/);
  assert.match(api, /post\("staff\/invite"/);
  assert.match(page, /result\.email_sent === true/);
  assert.match(page, /invitation\.email_status/);
  assert.match(page, /invitation\?\.email_error/);
});

test("Biashara exposes invitation creation, one-time share link, and authenticated acceptance", () => {
  const workspace = read("src/Dashboard/Biashara/BiasharaContractsWorkspace.jsx");
  const page = read("src/pages/BiasharaInvitationPage.jsx");
  const api = read("src/services/jumuiyaApi.jsx");
  const routes = read("src/App.jsx");

  assert.match(workspace, /inviteBiasharaTeamMember/);
  assert.match(workspace, /accept_token/);
  assert.match(workspace, /\/biashara\/invitation/);
  assert.match(workspace, /Copy invite link/);
  assert.match(page, /acceptBiasharaTeamInvitation/);
  assert.match(page, /emailMatches/);
  assert.match(page, /\/app\?hub=biashara/);
  assert.match(api, /team\/invitations\/accept/);
  assert.match(routes, /path="\/elimu-invitation"/);
});

test("Biashara Team remains reachable in small/simple workspaces", () => {
  const dashboard = read("src/Dashboard/BiasharaDashboard.jsx");
  assert.match(dashboard, /!\["automations", "sync"\]\.includes\(item\.key\)/);
  assert.doesNotMatch(dashboard, /!\["automations", "sync", "team"\]\.includes\(item\.key\)/);
});


test("platform admins can select a school and send protected Elimu staff invitations", () => {
  const page = read("src/components/admin/AdminSchoolStaffInvitations.jsx");
  const dashboard = read("src/components/admin/AdminDashboard.jsx");
  const sidebar = read("src/components/admin/AdminSidebar.jsx");
  assert.match(page, /\/api\/jumuiya\/admin\/schools/);
  assert.match(page, /for \(let page = 1; page <= 100; page \+= 1\)/);
  assert.match(page, /staff-invitations/);
  assert.match(page, /School Owner and Principal are intentionally excluded/);
  assert.match(page, /teacher/);
  assert.match(page, /bursar/);
  assert.match(dashboard, /AdminSchoolStaffInvitations/);
  assert.match(dashboard, /schoolStaffInvitations/);
  assert.match(sidebar, /School Staff Invitations/);
});


test("Elimu invitation links preserve login context and open through Android App Links", () => {
  const routes = read("src/App.jsx");
  const login = read("src/components/StartModal.jsx");
  const invitation = read("src/pages/ElimuInvitationPage.jsx");

  assert.match(routes, /path="\/elimu-invitation"/);
  assert.match(routes, /isVerifiedElimuInvitationLink/);
  assert.match(routes, /navigate\(localPath, \{ replace: true \}\)/);
  assert.match(login, /window\.location\.pathname === "\/elimu-invitation"/);
  assert.match(invitation, /acceptStaffInvitation/);
  assert.match(invitation, /identityMatchesInvitation/);
});


test("Elimu desktop workspace scrolls inside a viewport-bounded content pane and avoids repeated hero banners", () => {
  const workspace = read("src/Dashboard/ElimuDashboardWorkspace.jsx");
  const header = read("src/Dashboard/elimu/components/ElimuDashboardHeader.jsx");
  const styles = read("src/index.css");

  assert.match(workspace, /elimu-workspace-root/);
  assert.match(workspace, /elimu-workspace-layout/);
  assert.match(workspace, /elimu-workspace-column/);
  assert.match(workspace, /elimu-desktop-scroll-area/);
  assert.match(workspace, /isOverviewDashboard/);
  assert.match(workspace, /!isOverviewDashboard && \(/);
  assert.match(header, /border-b border-slate-200/);
  assert.doesNotMatch(header, /rounded-3xl border border-slate-800 bg-slate-950/);
  assert.match(styles, /\.elimu-workspace-root\s*\{[\s\S]*?height:\s*100dvh/);
  assert.match(styles, /\.elimu-desktop-scroll-area\s*\{[\s\S]*?overflow-y:\s*scroll\s*!important/);
});


test("Elimu uses one visible desktop scroll root and keeps owner staff actions reachable", () => {
  const workspace = read("src/Dashboard/ElimuDashboardWorkspace.jsx");
  const styles = read("src/index.css");
  const sidebar = read("src/Dashboard/elimu/components/ElimuDashboardSidebar.jsx");
  const owner = read("src/Dashboard/elimu/ElimuOwnerDashboard.jsx");

  assert.match(workspace, /elimu-workspace-root/);
  assert.match(workspace, /elimu-desktop-scroll-area/);
  assert.doesNotMatch(workspace, /lg:overflow-y-scroll/);
  assert.match(styles, /#revelacode-dashboard-content:has\(\.elimu-workspace-root\)/);
  assert.match(styles, /overflow-y:\s*auto\s*!important/);
  assert.match(styles, /::-webkit-scrollbar\s*\{\s*display:\s*block\s*!important/);
  assert.match(styles, /\.elimu-desktop-scroll-area\s*\{[\s\S]*?overflow:\s*visible\s*!important/);
  assert.match(sidebar, /hasPermission\("staff\.view"\)/);
  assert.match(sidebar, /hasPermission\("staff\.invite"\)/);
  assert.doesNotMatch(sidebar, /hasPermission\("staff\.manage"\)/);
  assert.match(owner, /Staff &amp; invitations/);
  assert.ok(owner.indexOf("{/* Leadership actions */}") < owner.indexOf("{/* School media centre */}"));
  assert.match(owner, /totalStaff === null \? "—"/);
});
