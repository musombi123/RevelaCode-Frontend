# Elimu Learning UI, JWT Persistence and Account Profile

This branch adds the React entry points and UI for the Elimu learning API defined on the `RevelaAI/feat/elimu-jwt-profile-certificate` branch. It does not claim that a production API or its learning data is already deployed.

## Environment

Set the actual FastAPI API origin in the frontend build environment:

```text
VITE_API_URL=https://<your-deployed-fastapi-api-host>
```

Use the real deployment hostname in your environment; do not ship a placeholder hostname. The existing RevelaCode backend `main` branch is Flask and does not expose these new FastAPI endpoints. If `VITE_API_URL` points to that service, Elimu/Profile/AuthGate routes return an API error rather than simulated data.

The backend deployment must set `CORS_ORIGINS` to the exact deployed browser origins and configure `JWT_SECRET`, Mongo access, and the certificate RSA key pair as described in the backend guide: [ELIMU-END-TO-END.md](https://github.com/musombi123/RevelaAI/blob/feat/elimu-jwt-profile-certificate/docs/ELIMU-END-TO-END.md).

## Routes

- `/login`: StartModal authentication entry
- `/elimu`: AuthGate-protected learning hub list, course/lesson progress and certificate UI
- `/accounts`: AuthGate-protected account dashboard with profile/hub detail and PDF/JSON export
- `/verify/certificate/:certId`: public certificate verification screen used by certificate QR codes

The prior `/jumuiya/elimu` route continues to point to the Jumuiya education/school-management dashboard. The new course-learning interface has a distinct `/elimu` route so the two Elimu concepts do not silently replace each other.

## JWT lifecycle

The canonical access-token storage key is `revela_jwt`. Legacy access keys are read for compatibility and mirrored on successful login. When supplied, `refresh_token` is stored as `revela_refresh_token`. Shared `authFetch` reads the latest values from storage, sets `Authorization: Bearer ...`, sends optional `X-Revela-License` from local storage, and on a 401 attempts `POST /api/auth/refresh` followed by exactly one retry. The StartModal closes/resets without clearing tokens. Explicit logout is the only path through AuthContext that clears stored credentials.

This is browser local-storage persistence, not an HttpOnly-cookie architecture; an XSS compromise can read an access token. Continue to use a strict CSP, output escaping, careful dependency review, short-lived access tokens, and secure refresh-token lifecycle controls.

## Profile downloads

The account Profile panel fetches `GET /api/accounts/profile/download?format=json` to display server-recorded identity and hub activity. Its PDF and JSON buttons call the same authenticated endpoint with the requested format and download the returned response body. Hub progress, completion, skills, instructors and certificate status are drawn only from the API; absent values are visibly reported as missing/not recorded.

## Tests

Run these on Node 20:

```powershell
npm ci
npm run test:auth
npm run build
```

The Node tests cover token-key compatibility and the StartModal/AuthGate source contract. A successful local build/test run does not validate remote login, CORS/DNS, the upstream account service, or the production database; run the browser acceptance path against the deployed FastAPI host after deployment and configuration.
