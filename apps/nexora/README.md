# NEXORA Studio Pro — independent app entry

NEXORA is a separate React application with its own Vite configuration,
`index.html`, `src/main.jsx`, components, account gate, browser session,
API client and backend. It does not import RevelaCode's application shell,
providers, authentication or React router.

NEXORA does not have a separate Render frontend service. It is independently
built into the existing RevelaCode Static Site publication directory at
`/dev_nexora`. This reuses hosting only; it does not merge the two React
applications.


## Product boundary: desktop-only Game Development Factory

NEXORA Studio is designed for desktop/laptop computers only. It is not part
of the RevelaCode Android app and must not be bundled into the mobile APK.
Mobile browsers should display a clear desktop-required message instead of
attempting to open the game factory.

The static React application is the desktop control interface. Game creation,
file access, SDK management, generation, building and testing are performed
by the authenticated NEXORA Local Agent on the creator's computer. The web
application must never send heavy production tasks to Render.

### Creator workflow

1. Create/sign in to an independent NEXORA account.
2. Install and pair the signed desktop Local Agent.
3. Run the first-use setup wizard to inspect hardware and select target
   platforms. Install only the required, version-pinned local toolchains after
   showing the creator the downloads, disk requirements and third-party
   license prompts.
4. Create or open a project in a creator-selected local workspace folder.
5. Design, generate and edit the same on-disk game project.
6. Test locally, then export Web, Android APK/AAB or Windows output from the
   Build Center.
7. Keep the project locally, create a local snapshot, or optionally back it up
   to the creator's Google Drive account.
8. Connect the creator's own publisher account and explicitly approve any
   store submission.

### Desktop agent contract

The Local Agent owns project files, local job execution, toolchain inventory,
local previews, build outputs and optional ADB device operations. It exposes
narrow authenticated APIs, not an arbitrary browser shell. It must bind to
loopback, validate the paired account, scope file operations to an approved
workspace root, validate process arguments and report logs/job states.

Cloud owns NEXORA identity, subscriptions, project index/ownership metadata,
optional backup indexes and distribution authorization. Cloud does not own
the creator's only source copy or execute Godot, Blender, FFmpeg, Android
Gradle, image-to-3D or game builds.

### Engine strategy

Godot is the first supported engine. NEXORA owns the integrated game-design,
AI-assisted production, asset pipeline, workflow, build orchestration,
project ownership and release experience. It should not attempt to recreate
Godot's full renderer and scene editor. Provide an advanced Godot Editor
handoff for workflows that require the full native scene editor. Other game
engines must be added through tested adapters rather than being implied to
work automatically.

### Output targets

- **Web:** complete static export bundle with a local preview and smoke test.
- **Android:** APK for local install/testing and AAB for Google Play. Android
  SDK/JDK/Godot templates run on the desktop; connecting a phone is optional.
- **Windows:** runnable desktop build first, then MSIX packaging and
  Microsoft Store submission connector.
- **Apple:** final iOS builds require a supported macOS/Xcode environment.
  A Windows creator may export the compatible project and use an explicitly
  paired Mac they own; do not route this build to Render.

### Save and publisher ownership

Local workspace files are the source of truth. NEXORA must always allow a raw
project-folder export that opens in Godot without a live NEXORA session.
Google Drive backup uses the creator's OAuth grant and the narrow
`drive.file` scope, with versioned archives and resumable uploads. Never
request unrestricted access to the creator's Drive.

Google Play, App Store Connect and Microsoft Store accounts belong to the
creator. NEXORA can assist with preflight, package upload and draft
submissions after the creator connects an existing publisher account. A store
upload is not store approval. Require an explicit confirmation before a
submission is committed or sent for review.

### Monetization

NEXORA uses its own subscriptions and optional service/backup quotas. It is
not ad-supported and must not use AdMob or rewarded-ad access. Local CPU/GPU
work is performed on the creator's own machine; cloud quotas should apply only
to services that NEXORA actually hosts.

See the authoritative backend architecture decision and staged acceptance
gates in
`Procedural-Game-Foundry/docs/NEXORA_DESKTOP_GAME_FACTORY_ARCHITECTURE.md`.

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
