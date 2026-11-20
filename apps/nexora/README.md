# NEXORA Studio Pro — independent app entry

NEXORA is a separate React application with its own Vite configuration,
`index.html`, `src/main.jsx`, components, account gate, browser session,
API client and backend. It does not import RevelaCode's application shell,
providers, authentication or React router.

NEXORA does not have a separate Render frontend service. It is independently
built into the existing RevelaCode Static Site publication directory at
`/dev_nexora`. This reuses hosting only; it does not merge the two React
applications.

## Local development

From this directory:

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:5174`. Set
`VITE_NEXORA_API_URL` to the NEXORA API origin. It defaults to
`https://nexora-foundry-api.onrender.com`.

## Build and publish

The root RevelaCode frontend repository has these scripts:

- `npm run build:nexora` — builds this app independently into
  `public/dev_nexora`.
- `npm run build:web` — builds NEXORA first, then builds RevelaCode. Vite
  copies `public/dev_nexora` into the final `dist/dev_nexora` directory.

The existing Render Static Site should use:

- Build command: `npm ci && npm run build:web`
- Publish directory: `dist`
- Build environment: `VITE_NEXORA_API_URL=https://nexora-foundry-api.onrender.com`

No additional Render frontend service or NEXORA custom domain is needed.

## Public route

The user-facing URL is
`https://revelacode.co.ke/dev_nexora`.

On the existing RevelaCode Static Site, add these rules in
**Settings → Redirects/Rewrites**, with Action **Rewrite** and above the
general RevelaCode SPA fallback:

| Source | Destination |
| --- | --- |
| `/dev_nexora` | `/dev_nexora/index.html` |
| `/dev_nexora/*` | `/dev_nexora/index.html` |

Render serves real files such as `/dev_nexora/assets/...` directly when
they exist. The wildcard rule is the NEXORA client-side route fallback.

## API and identity boundary

The browser calls `https://nexora-foundry-api.onrender.com` directly.
Configure the NEXORA API's `NEXORA_CORS_ORIGINS` to include
`https://revelacode.co.ke` and the local development origins only.

The NEXORA API, Neon database, authentication routes, payment reconciliation
and entitlement service remain NEXORA-owned. Keep database URLs and payment
verification secrets on the NEXORA API service only.
