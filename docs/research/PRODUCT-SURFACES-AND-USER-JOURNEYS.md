# RevelaCode product surfaces and user journeys

**Evidence snapshot:** 25 November 2026  
**Scope:** User-facing RevelaCode web and Android experience. The backend remains authoritative for data, roles and permissions.

## 1. Main application journey

The high-level journey is:

```text
Open RevelaCode
   -> initialize app providers
   -> restore or create a session
   -> confirm session with backend when online
   -> show welcome/authenticated workspace
   -> navigate to an available hub or public page
   -> request data through a domain API client
   -> backend authenticates, authorizes and returns data
   -> frontend renders result and handles network/offline state
```

The exact route availability and product entitlements depend on the deployed frontend revision, backend configuration and account state.

## 2. Product surface inventory

### Scripture, Faith and Study

The frontend contains Bible and study interfaces, study-material caching, scripture-related views and Faith/MissionPulse pages. The backend contains study routes and related scripture/domain data. Content provenance, translation licences, editorial review and theological review should be documented separately before institutional distribution.

### Elimu — education

The frontend includes Elimu dashboards and role-oriented workspaces for school ownership, principals, bursars, registrars, teachers, students and parents. It also contains public school pages, parent/student portals, school invitations, staff management, finance, reports, inventory, library, timetable and school website settings.

The backend's school verification, identity and role model govern data access. The presence of a client role dashboard does not by itself prove that an account has the role or that the corresponding backend route is enabled.

### Biashara — business operations

The frontend has a dedicated Biashara dashboard and modules for onboarding, business profile, orders/sales summaries, inventory, contracts, factory, HR, integrations, website management, analytics and intelligence. A separate dashboard configuration and workflow guides document the product's navigation and operations.

Biashara company templates alter workspace presentation and defaults. The backend decides what the current member may access. Operational financial summaries must not be called a complete audited accounting package until the backend's ledger and reconciliation gaps are closed.

### Shamba — agriculture

The frontend contains Shamba workspace areas for farms, crops, activities, buyers, orders, inputs, markets, weather, verification, diagnostics and agricultural insight surfaces. Their actual ability to provide reliable advice depends on the backend service, external data sources, sensor/field inputs and validation. A visual diagnostic panel is not a substitute for measured agronomic accuracy.

### Community / Jumuiya

Community screens cover feed, discovery, groups, post composition, comments, marketplace, notifications, people directory, profile, invitations, matters and World Events. These surfaces imply moderation, privacy, reporting and user safety requirements that need their own policy and operational evidence.

### Shared account and platform surfaces

The frontend also includes account management, certificate verification, legal documents, support/admin workspaces, invitations, history, preferences, theme controls and developer/IDE surfaces. These should be described as separate features rather than bundled into one undifferentiated claim of platform maturity.

## 3. User journey examples

### A. School onboarding

1. A school owner starts a school application.
2. The school submits the requested institution and owner details.
3. The backend verifies the school and controls when privileged services become available.
4. The owner invites staff and assigns roles through supported workflows.
5. Staff use their role-appropriate dashboards.
6. Parents and students access their public/portal entry points where enabled.
7. The owner configures public website content and, if needed, requests a custom domain.
8. A custom domain becomes active only after DNS and HTTPS verification, not merely after a hostname is entered.

### B. Business onboarding

1. The user applies to create a business.
2. The backend stores a pending verification state.
3. An authorized platform administrator reviews the application.
4. The business workspace is granted only after server-side approval and verified status.
5. The owner invites team members and the server maps membership roles to permissions.
6. Sales, stock, customers, HR, finance, factory and website workflows are available according to the company's template and member permissions.

### C. Offline use

1. The client identifies a user/tenant scope.
2. It may read a previously cached API response.
3. A supported offline mutation can be placed in a local outbox with a stable mutation identity.
4. When connectivity returns, the client attempts synchronization.
5. The backend validates the authenticated user, ownership, schema and mutation semantics.
6. The client must resolve server conflicts rather than silently overwrite newer authoritative records.

Not every endpoint or write operation is necessarily supported offline. The user interface should show queued, synced, failed and conflicted states distinctly.

## 4. Deployment and application separation

The RevelaCode React application is built as the root Vite app. Native Android packaging is maintained in the separate `RevelaCode-Android` repository, which consumes a selected frontend revision. Native permissions, Gradle/Capacitor build, signing and APK/AAB release are not performed by the web repository.

The frontend repository also contains an independent NEXORA app under `apps/nexora`. The root build can publish both apps to one existing static site, with NEXORA under `/dev_nexora`. They retain separate React runtimes, HTML documents, application entries and identity/API boundaries. This research does not treat NEXORA as a RevelaCode dashboard.

## 5. Demonstrations: what to show

A credible institutional demo should follow real user paths with controlled demo accounts:

- one normal user session;
- one school owner and a staff member with limited permissions;
- one pending and one verified business;
- one tenant-boundary denial test;
- one offline queue/reconnect example;
- one public school website and a verified domain state;
- one Community moderation/reporting scenario;
- one Android build from a known source commit.

Use synthetic records and disclose that they are test data. Never mix test data with customer data or imply that sample records are actual institutions.

## 6. Product readiness evidence

For each major screen, keep a small release record containing:

- source commit and deployed revision;
- role/account used during test;
- browser/device and OS;
- backend endpoint and response;
- expected versus observed outcome;
- screenshot or video with personal data redacted;
- test result and unresolved defects.

This provides better evidence than a large screenshot gallery without user-flow context.
