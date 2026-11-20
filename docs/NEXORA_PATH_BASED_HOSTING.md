# NEXORA path-based hosting

## Public URL

`https://revelacode.co.ke/dev_nexora`

NEXORA does not have a dedicated Render frontend service. Both application
frontends are served by the existing RevelaCode Render Static Site, but
they are built as separate React applications with separate HTML documents
and separate JavaScript entry points.

## Independent NEXORA app source

NEXORA's frontend source lives at `apps/nexora` in this repository:

- `apps/nexora/index.html` — NEXORA document entry.
- `apps/nexora/src/main.jsx` — NEXORA React startup.
- `apps/nexora/src/components/nexora/` — workspace and account components.
- `apps/nexora/vite.config.js` — independent Vite base and build output.

It does not import RevelaCode's `App`, React providers, authentication,
router or service-worker setup. The two apps share the deployed static
hosting service and HTTPS origin only.

## Build

The root `package.json` provides:

- `npm run build:nexora` — builds the independent NEXORA entry into
  `public/dev_nexora`.
- `npm run build:web` — runs the NEXORA build first, then builds the
  RevelaCode frontend. Vite copies the generated NEXORA files into
  `dist/dev_nexora`.

Configure the existing RevelaCode Static Site in Render:

- Build command: `npm ci && npm run build:web`
- Publish directory: `dist`
- Build environment:
  `VITE_NEXORA_API_URL=https://nexora-foundry-api.onrender.com`

Keep the existing Render service and custom domain. Do not create a second
static site or assign `nexora.revelacode.co.ke`.

## Render route rules

In the existing RevelaCode Static Site, open
**Settings → Redirects/Rewrites**. Add these rules with Action **Rewrite**:

| Source | Destination |
| --- | --- |
| `/dev_nexora` | `/dev_nexora/index.html` |
| `/dev_nexora/*` | `/dev_nexora/index.html` |

Put both rules above the broad RevelaCode SPA fallback
`/* → /index.html`. Render serves real NEXORA assets such as
`/dev_nexora/assets/...` directly when the files exist; the rules provide
the HTML entry for the app root and its client-side routes. A Rewrite keeps
the original browser URL unchanged.

## Service-worker boundary

RevelaCode's service worker explicitly skips `/dev_nexora` and every child
path. It cannot intercept or cache NEXORA's HTML, JS, CSS or other assets.

## NEXORA API CORS and identity

The NEXORA browser app calls `https://nexora-foundry-api.onrender.com`
directly. Configure the NEXORA API Render service with:

`NEXORA_CORS_ORIGINS=https://revelacode.co.ke,http://localhost:5174,http://127.0.0.1:5174`

The public production origin is `https://revelacode.co.ke`. The NEXORA API,
Neon database, account sessions, payment reconciliation and entitlements
remain NEXORA-owned. Keep `NEXORA_DATABASE_URL`, authentication settings
and payment verification secrets on the NEXORA API service only.

## Verification

1. Deploy the existing RevelaCode Static Site using the updated web build
   command.
2. Confirm `dist/dev_nexora/index.html` and its assets are published.
3. Confirm the two Render rewrite rules appear above the catch-all rule.
4. Open `https://revelacode.co.ke/dev_nexora` in a private browser window.
5. Confirm the NEXORA registration/sign-in page appears without changing
   the browser URL.
6. Register a NEXORA test account and verify that its session is independent
   from the RevelaCode account session.

A commit does not change the Render dashboard build command or route rules.
Those two existing-service settings must also be saved before the path is
live.
