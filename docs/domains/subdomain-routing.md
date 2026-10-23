# RevelaCode hub subdomains and public Community links

## Intended routing

All four reserved subdomains use the existing RevelaCode Frontend deployment. The application selects the hub from the hostname; the hostname is not a separate database or application.

| Hostname | Purpose | Access policy |
| --- | --- | --- |
| `https://revelacode.co.ke/` | Central RevelaCode home, ecosystem and all hubs | Existing platform authentication and hub permissions |
| `https://biashara.revelacode.co.ke/` | Biashara workspace | Existing Biashara verification gate applies. The full workspace requires `verification_status=verified` and `status=active`; unapproved/inactive business profiles remain in the existing verification state |
| `https://elimu.revelacode.co.ke/` | Elimu workspace | Existing Elimu school/account and role controls apply |
| `https://shamba.revelacode.co.ke/` | Shamba workspace | Existing farmer profile, verification and role controls apply |
| `https://community.revelacode.co.ke/` | Public, read-only Community feed | Public pages are readable without signing in. Use `/app` for the interactive authenticated workspace |

Public Community permalinks:

- `/profile/{profileId}` — a member profile with public posts
- `/post/{postId}` — a single public post
- `/media/{mediaId}` — media linked to a published public post
- `/app` — interactive Community workspace

The API serves public pages from the existing `jumuiya_community_posts`, `jumuiya_profiles` and embedded media records. Only posts with both `status=published` and `visibility=public` resolve on public pages. Community-only/private posts and unattached media are not returned. A public profile resolves only once that member has at least one public post. Public endpoints are read-only.

## DNS and hosting activation

Repository code cannot create DNS records, add hostnames to Render/Netlify, issue a TLS certificate, or change the domain owner’s DNS panel. Those are required for real traffic.

If the production frontend is the existing Render service `revelacode-frontend.onrender.com`, use the exact target hostname shown in that Render service's dashboard:

1. In Render, open the existing frontend service → **Settings → Custom Domains**.
2. Add these four exact hostnames to that same frontend service and complete Render's domain verification:
   - `biashara.revelacode.co.ke`
   - `elimu.revelacode.co.ke`
   - `shamba.revelacode.co.ke`
   - `community.revelacode.co.ke`
3. In HostAfrica → Domains → Manage DNS (or the active DNS provider for these nameservers), add a **CNAME** record for each subdomain:

| Type | Name / Host | Target |
| --- | --- | --- |
| CNAME | `biashara` | `revelacode-frontend.onrender.com` |
| CNAME | `elimu` | `revelacode-frontend.onrender.com` |
| CNAME | `shamba` | `revelacode-frontend.onrender.com` |
| CNAME | `community` | `revelacode-frontend.onrender.com` |

Use the exact Render-provided target if it differs. A TTL of 300 seconds or the provider's default is suitable while setting up. Do not change the working apex (`@`), `www`, MX, mail-verification or existing unrelated DNS records. For each new hostname, remove only conflicting records with the same name if they prevent the CNAME from being saved.

4. Return to Render and verify each hostname. Wait until Render shows the domain as verified and its TLS certificate as issued, then test each `https://` URL. Render's custom-domain configuration is required in addition to DNS records; CNAMEs alone are not sufficient.

5. Merge the related backend change ([RevelaCode-Backend PR #26](https://github.com/musombi123/RevelaCode-Backend/pull/26)) so the API explicitly allows the four exact HTTPS origins in its CORS allowlist and serves the public Community read endpoints. This uses an explicit origin list, not a wildcard. The frontend can be built and deployed before DNS is live, but the public pages cannot load data until the backend change is deployed.

If the live frontend is hosted somewhere other than that Render service, add the four hostnames to the actual production frontend host and use its documented DNS target instead. Do not point the subdomains at the Netlify *deploy-preview* hostname.

## Release checklist

- [ ] Merge the frontend and backend pull requests.
- [ ] Configure and verify the four hostnames with the production frontend host.
- [ ] Test the apex home plus each hub host.
- [ ] Test Community while signed out: public feed, profile, post and media routes.
- [ ] Confirm private/community-only posts return not found on public routes.
- [ ] Test Biashara with pending, verified/active, and suspended/rejected business profiles.
- [ ] Confirm HTTPS and direct URL refresh/deep-link handling for every permalink.

The four subdomains are application entry points on one existing deployment. They do not create separate databases, auth systems or service runtimes.
