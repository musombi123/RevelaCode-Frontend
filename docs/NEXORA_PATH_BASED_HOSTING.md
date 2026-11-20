# NEXORA path-based hosting

## Public URL

`https://revelacode.co.ke/dev_nexora`

The browser must remain on this URL. Do not use a redirect to
`nexora.revelacode.co.ke` or to the NEXORA Render hostname.

## Independent NEXORA deployment

Create a separate Render **Static Site** using:

- Repository: `musombi123/Procedural-Game-Foundry`
- Branch: `main`
- Root directory: `apps/nexora-frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment: `VITE_NEXORA_API_URL=https://nexora-foundry-api.onrender.com`

Keep the Render-generated `*.onrender.com` hostname. Do not add a custom
domain to this service. NEXORA is built and deployed independently; the
Render hostname is the private-to-the-product upstream origin for the public
path proxy.

The NEXORA Vite production base is `/dev_nexora/`. This ensures that its
HTML references scripts and styles beneath the same public path.

## Configure the existing RevelaCode Static Site

In Render Dashboard, open the **existing RevelaCode Static Site** and go to
**Settings → Redirects/Rewrites**. Add these two rules with Action **Rewrite**:

| Source | Destination |
| --- | --- |
| `/dev_nexora` | `https://<NEXORA-STATIC-SITE>.onrender.com/` |
| `/dev_nexora/*` | `https://<NEXORA-STATIC-SITE>.onrender.com/*` |

Replace `<NEXORA-STATIC-SITE>` with the exact host assigned by Render to
the standalone NEXORA Static Site.

Place both rules above any broad catch-all rule such as `/* → /index.html`.
The exact rule serves NEXORA's index document; the wildcard rule forwards
asset requests such as `/dev_nexora/assets/...` to the corresponding
`/assets/...` path on the NEXORA origin. A Rewrite keeps the browser URL
unchanged. A Redirect is incorrect because it changes the address bar.

Do not add a `/dev_nexora` SPA route to RevelaCode's React router. The
rewrite must happen at the static-site hosting layer before the RevelaCode
`index.html` is served.

## NEXORA API CORS

On the NEXORA API Render service, set:

`NEXORA_CORS_ORIGINS=https://revelacode.co.ke,http://localhost:5173,http://127.0.0.1:5173`

The production browser origin is `https://revelacode.co.ke`, even though
the NEXORA frontend files come from a separate Render Static Site. The
browser calls `https://nexora-foundry-api.onrender.com` directly.

Keep `NEXORA_DATABASE_URL`, `NEXORA_AUTH_REQUIRED=true`, payment
verification secrets, payment reconciliation and user sessions on the
NEXORA backend. Do not put any of those secrets in the frontend or
RevelaCode environment.

## Verification

1. Confirm the standalone NEXORA Static Site has a successful deploy.
2. Confirm the two external Rewrite rules are saved on the RevelaCode Static
   Site and precede the catch-all rule.
3. Redeploy the NEXORA API after changing `NEXORA_CORS_ORIGINS`.
4. Open `https://revelacode.co.ke/dev_nexora` in a private browser window.
5. Confirm NEXORA's own registration/sign-in page appears and the address
   bar stays on `revelacode.co.ke/dev_nexora`.
6. Register a dedicated NEXORA account and verify it does not use the
   RevelaCode session.

A source-code commit does not configure Render dashboard routing. The
external Rewrite rules and separate Static Site must both exist before the
public URL can work.
