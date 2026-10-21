# Elimu Learning UI, JWT Persistence and Account Profile

The Elimu learning screen, account profile exports and account certificate UI use the existing RevelaCode backend API. The course-learning endpoints are registered on the existing study blueprint, use the shared `backend.db` Mongo connection, and authenticate with the existing Jumuiya permission/JWT layer. The school-management UI remains at `/jumuiya/elimu`; the course-learning UI remains at `/elimu`.

## Environment

Set `VITE_API_URL` to the deployed RevelaCode backend origin without a path suffix. For the current Render service, that origin is expected to be `https://revelacode-backend.onrender.com`; use the actual API hostname configured for production if it differs.

The backend must have the existing `MONGO_URI` and `JWT_SECRET` configured. `REVELACODE_CERTIFICATE_SIGNING_KEY` is recommended for certificate signatures; when unset, the backend uses a domain-separated key derived from `JWT_SECRET`. The existing backend CORS allow-list uses `FRONTEND_ORIGINS` plus the default `https://revelacode.co.ke` and `https://www.revelacode.co.ke` origins.

## Routes

- `/login`: StartModal authentication entry.
- `/elimu`: authenticated course-learning hub, progress tracking and Elimu learning certificate UI.
- `/accounts`: authenticated account profile, PDF/JSON download and global account-certificate issue/download flow.
- `/verify/certificate/:certId`: public verifier for account certificates (`RC-AC-...`) and Elimu learning certificates (`RC-EL-...`).

Learning API endpoints are served by the existing study blueprint:

- `GET /api/study/elimu/hubs`
- `GET /api/study/elimu/hubs/:hubId`
- `GET /api/study/elimu/progress?hub_id=elimu-education`
- `POST /api/study/elimu/progress`
- `POST /api/study/elimu/certificates/generate`
- `GET /api/study/elimu/certificates/:certificateId`
- `GET /api/study/elimu/certificates/verify/:certificateId` (public)

Global account documents remain on the account-document routes:

- `GET /api/accounts/profile/download?format=pdf|json`
- `POST /api/accounts/certificates`
- `GET /api/accounts/certificates/:certificateId/download`
- `POST /api/accounts/certificates/:certificateId/revoke` (platform administrator)
- `GET /api/verify/certificate/:certificateId` (public)

## JWT lifecycle

The canonical access-token key is `revela_jwt`, with compatibility reads for legacy access-token keys. `AuthContext` owns persistence of access and refresh tokens. StartModal passes returned token fields into the shared `login()` method and does not independently write JWT values. Shared `authFetch` adds the Bearer header and performs at most one refresh attempt/retry on a 401 when a refresh token is available. Explicit logout is the path that clears the saved credentials.

This uses browser local storage rather than HttpOnly cookies, so an XSS compromise can read an access token. Keep a strict CSP, sanitize rendered content, review dependencies and maintain short access-token lifetimes and safe refresh-token handling.

## Profile exports and certificates

The authenticated account profile API returns identity, current account roles and recorded hub affiliations sourced from the existing user record and active Elimu school-membership records. It never fabricates missing learning progress or skills. The PDF/JSON download controls in the account profile use the same authenticated endpoint.

Global account certificates confirm RevelaCode account identity and recorded platform participation. Elimu learning certificates separately confirm completion recorded by the learning hub. Both categories have unique IDs, issuer/date/scope metadata, HMAC-SHA256 integrity validation, a public verification endpoint and account/admin-protected download or revocation operations where defined. Neither certificate represents government accreditation, a formal academic qualification or a professional licence.

A source review or successful build does not prove remote production behavior. Production acceptance requires checking the deployed frontend's API origin/CORS, logging in as a real account, saving progress, downloading a profile/certificate, and opening the public verification URL.

