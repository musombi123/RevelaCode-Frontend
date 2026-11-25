# RevelaCode frontend architecture

**Evidence snapshot:** 25 November 2026  
**Primary source:** `package.json`, `src/main.jsx`, `src/App.jsx`, `src/context/`, `src/auth/`, `src/config/`, `src/services/`, `src/Dashboard/` and `src/pages/`.

## 1. Purpose

The RevelaCode frontend is the client application layer. It renders pages and workspaces, owns user interaction and local application state, obtains authenticated sessions, and calls platform APIs. It is not the authoritative owner of user permissions, financial calculations, tenant selection or server-side records.

## 2. Technology baseline

The inspected root package declares:

- React and React DOM;
- Vite build and development tooling;
- React Router for client navigation;
- Tailwind CSS for utility styling;
- Capacitor packages for Android packaging and native APIs;
- CodeMirror language/editor packages;
- Framer Motion and supporting UI libraries;
- REST-style HTTP API integrations.

The repository uses Node.js 22 as its declared runtime engine. Dependency versions are recorded in the package manifests and lockfile. A dependency list is not a performance or security certification.

## 3. Runtime boot sequence

The main browser entry is `src/main.jsx`. It loads the React application, establishes the application-level providers, handles platform-specific startup tasks, and performs selected offline cache warm-up after the initial native Android screen has had time to render.

The inspected entry imports:

- `AuthProvider` for user and session state;
- `HistoryProvider` for application history;
- `ThemeProvider` for theme state;
- study-material cache helpers for optional offline data;
- an error boundary for component failure containment.

The app's root composition is in `src/App.jsx`. It configures React Router, page routes, authentication gates, layout, dashboards, invitation callbacks, public pages and lazy-loaded dashboards.

## 4. Application layers

```text
src/
  main.jsx                 Application boot and provider wiring
  App.jsx                  Router and application composition
  auth/                    Token, identity, role and backend URL helpers
  context/                 Authentication, history and preferences state
  config/                  Backend and AI service origins
  services/                API clients, offline queue and sync contracts
  Dashboard/               Elimu, Biashara, Shamba, Community workspaces
  pages/                   Public, portal, Faith and account pages
  components/              Shared UI, layouts, navigation and reusable views
  ai/                      RevelaAI client and client-side capability surfaces
  native/                  Native/mobile integrations
  ide/                     Developer/IDE workspace
  premium/                 Premium-facing UI and access surfaces
  utils/                   Shared utilities and host/platform helpers
```

This map is intentionally a directory-level map. It should be expanded into a component catalogue before a formal full-codebase handover; directory names are not a complete dependency graph.

## 5. Routing and presentation

The main application uses React Router. The root route tree imports the main layout and dashboard, public school pages, parent/student portals, Biashara websites, invitation flows, Elimu, Community, Faith/MissionPulse, certificates, legal documents, support/admin screens and other public pages.

Large dashboards are lazy-loaded to keep them in separate production chunks where configured. The application also includes an error boundary and a controlled one-time reload path for Vite preload errors caused by stale deployment chunks.

A UI surface is not an authorization boundary. Protected backend operations must still require server-side authentication, role checks and tenant ownership.

## 6. Authentication and service boundaries

The frontend's `AuthContext` owns client session hydration and state. The inspected implementation:

1. Reads the stored session/profile and access token.
2. Sanitizes cached identity fields before retaining them.
3. Revalidates an existing non-guest session with the backend's `/api/auth/me` route.
4. Clears the same credential after an authoritative 401.
5. Avoids allowing a late response for an older token to erase a newer login.
6. Preserves a cached offline session when the server cannot be reached; that state must not be described as a freshly verified online session.

The canonical token helper uses `revela_jwt`, a refresh-token key and compatibility aliases. It falls back to session storage if local storage cannot be written. It does not make the browser token immune to cross-site scripting; secure frontend coding, CSP, dependency hygiene and server controls remain important.

`src/config/serviceOrigins.js` resolves the RevelaCode backend and RevelaAI origins. The RPSVI staging mode deliberately does not fall back to production URLs if staging variables are missing, reducing the risk of accidentally sending test credentials or traffic to production.

The RevelaAI client sends authenticated requests to the separate RevelaAI API. The frontend owns presentation and request handling; RevelaAI owns its model/provider orchestration and its independent technical research.

## 7. Domain API clients

The `src/services/` directory contains domain-specific API clients, including a Jumuiya client and service wrappers for Elimu, revenue and administration. The Jumuiya client:

- builds the API root from the configured RevelaCode backend origin;
- accepts API-relative paths rather than arbitrary full external URLs;
- serializes query parameters;
- parses JSON and non-JSON responses;
- normalizes server errors;
- integrates user/tenant-scoped offline caching and mutation queue helpers.

The server remains authoritative for the response and access decision. Cached responses are a resilience aid, not a source of truth for permission.

## 8. Build and quality controls

The root package provides separate scripts for application builds and several focused test groups (authentication, Community, platform host, offline AI, invitations, RevelaAI workspace, studio library, Capacitor and others). NEXORA has a separate build target.

Before a release, record the exact commit, install from the lockfile, run relevant unit/integration tests, build production assets, inspect output paths and run browser/device smoke tests. Do not treat the presence of a test script as evidence that tests passed in the current release.

## 9. Architectural principles

- Backend owns authorization and authoritative domain data.
- The frontend presents workflows and communicates through explicit API clients.
- RevelaAI remains a separate service.
- NEXORA remains an independent app entry, not another route injected into the RevelaCode React shell.
- Offline support must preserve mutation identity and reconcile with server state.
- Native Android packaging and plugin behavior are maintained separately from browser-only deployment.

## 10. Topics for a deeper source review

For a full engineering handover, expand this document with:

1. Route-by-route catalogue with auth requirement and API destination.
2. Context/provider dependency graph.
3. Dashboard/component inventory by hub.
4. API contract and error schema per service.
5. Bundle-size and route-level performance report.
6. Accessibility and responsive-device test report.
7. Frontend threat model, CSP and storage review.
8. Browser/device release matrix and rollback procedure.
