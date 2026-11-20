# NEXORA Studio Pro — standalone frontend

NEXORA is an independent application with its own Vite/React build, startup entry point, registration/sign-in screen, browser session, API, database and subscription services. It does not import RevelaCode's application shell, providers or authentication.

## Local development

```bash
npm install
npm run dev
```

Set `VITE_NEXORA_API_URL` to the NEXORA API origin. The workspace defaults to `https://nexora-foundry-api.onrender.com`. With the production base path, open the local app at `http://localhost:5173/dev_nexora/`.

The production Vite base path is `/dev_nexora/`, matching the public entry URL. This is intentional: assets are requested below the same path and forwarded to this standalone static site by the RevelaCode Render rewrite.

## NEXORA frontend — its own Render Static Site

- Repository: `musombi123/Procedural-Game-Foundry`
- Branch: `main`
- Root Directory: `apps/nexora-frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment: `VITE_NEXORA_API_URL=https://nexora-foundry-api.onrender.com`
- Keep the Render-generated `*.onrender.com` address.
- Do **not** attach `nexora.revelacode.co.ke` or another custom domain.

The public browser URL is `https://revelacode.co.ke/dev_nexora`. The main RevelaCode Render Static Site proxies that path to this independent static site using external Rewrite rules. The browser URL remains unchanged.

## Main-domain rewrite rules

In the Render dashboard for the existing RevelaCode Static Site, open **Settings → Redirects/Rewrites** and add these rules with Action **Rewrite** (not Redirect), above any catch-all SPA rule:

| Source | Destination |
| --- | --- |
| `/dev_nexora` | `https://<NEXORA-STATIC-SITE>.onrender.com/` |
| `/dev_nexora/*` | `https://<NEXORA-STATIC-SITE>.onrender.com/*` |

Replace `<NEXORA-STATIC-SITE>` with the exact hostname Render assigns to the NEXORA static site. The wildcard rule forwards JS, CSS, images and other assets while the Vite base keeps their browser paths under `/dev_nexora/`.

## API origin / CORS

The browser calls `https://nexora-foundry-api.onrender.com` directly. Set the NEXORA API's `NEXORA_CORS_ORIGINS` to include the public page origin:

`https://revelacode.co.ke`

For local development, also include `http://localhost:5173` and `http://127.0.0.1:5173`. Do not use the NEXORA static site's `onrender.com` URL as the production browser origin; the user-facing origin is the RevelaCode apex domain.

The API, Neon database, authentication routes, payment reconciliation and entitlement service remain NEXORA-owned. Keep `NEXORA_DATABASE_URL`, authentication settings and payment secrets on the NEXORA API service only.
