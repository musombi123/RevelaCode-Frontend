# RPSVI staging frontend

This frontend is a separate static site for the RevelaCode Public System Verification Initiative. It is not connected to the production backend or production RevelaAI gateway.

## Build configuration

- Vite mode: `rpsvi-staging`
- Environment file: `.env.rpsvi-staging`
- Backend origin: `https://revelacode-rpsvi-staging.onrender.com`
- RevelaAI origin: `https://revelaai-rpsvi-staging.onrender.com`
- Render Blueprint: `render.rpsvi-staging.yaml`
- Static output: `dist/`

The values in `.env.rpsvi-staging` are public URLs embedded into the JavaScript bundle. Never add secrets, provider keys, bearer tokens, database credentials or service-to-service keys to any `VITE_*` variable.

## Manual Render setup

1. Create a new independent Render Blueprint from this frontend repository.
2. Select branch `verification/rpsvi-staging-frontend` and file `render.rpsvi-staging.yaml`.
3. Inspect the preview; it must create only `revelacode-rpsvi-frontend`.
4. Apply it only after confirming the site settings and static build command.
5. Confirm the assigned public hostname. The expected default is `revelacode-rpsvi-frontend.onrender.com`, but use the actual hostname shown by Render.
6. Enter that exact frontend origin in the backend staging `FRONTEND_ORIGINS` and RevelaAI staging `CORS_ORIGINS` variables. Do not add the production frontend origin.
7. Confirm the backend staging `REVELA_AI_URL` resolves to the AI staging gateway and the AI staging `REVELACODE_BACKEND_URL` resolves to the backend staging service.
8. Open the staging frontend and use only test identities created for RPSVI.

The Blueprint has `autoDeployTrigger: off`; subsequent changes should be deployed manually after CI. Render's static-site Blueprint uses `runtime: static`, a build command and `staticPublishPath`; see the [official Blueprint specification](https://render.com/docs/blueprint-spec).

## Build and bundle guard

Run:

```powershell
npm ci
npm run build -- --mode rpsvi-staging
node scripts/verify-rpsvi-staging-bundle.mjs
```

The verification script checks the generated bundle for both required staging service origins and rejects the known production API origins. If an active frontend code path still falls back to a production API origin, fix the environment/configuration before inviting testers.

## Boundaries

The staging frontend is not a mock. It uses the real staging backend and AI service once provisioned. Until those services are deployed and their readiness checks pass, the frontend Blueprint is only a prepared configuration—not an operational tester environment.
