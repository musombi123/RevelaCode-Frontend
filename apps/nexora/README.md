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

NEXORA Studio is designed for desktop/laptop computers only. It is not an
Android application and must not be bundled into the RevelaCode mobile APK.
Mobile browsers receive a clear desktop-required message instead of
attempting to open the game factory.

The static React application is the desktop control interface. Game creation,
file access, SDK management, generation, building and testing are performed
by the authenticated NEXORA Local Agent on the creator's computer. The web
application must never send heavy production tasks to Render.

### Creator workflow

1. Create/sign in to an independent NEXORA account.
2. Install and pair the signed desktop Local Agent.
3. Run first-use setup to inspect the machine and select target platforms.
   Install only the required, version-pinned local toolchains after showing
   downloads, disk requirements and third-party license prompts.
4. Create or open a project in a creator-selected local workspace folder.
5. Design, generate and edit the same on-disk game project.
6. Test locally, then export Web, Android APK/AAB or Windows output from
   the Build Center.
7. Keep the project locally, create a local snapshot, or optionally back it
   up to the creator's Google Drive account.
8. Connect the creator's own publisher account and explicitly approve any
   store submission.

### Engine and tooling strategy

Godot is the first supported engine. NEXORA owns the integrated design,
AI-assisted production, asset workflow, orchestration, IDE experience,
testing, export and release workflow. It must not recreate Godot's entire
renderer and scene editor. Provide an advanced Godot Editor handoff for
scene workflows that need the full native editor.

The Local Agent owns project files, local job execution, toolchain inventory,
local previews, build outputs and optional ADB device operations. Cloud owns
identity, subscriptions, project ownership metadata and optional backup
indexes. A phone is not required to build an Android package.

### Output targets

- **Web:** complete static export bundle with a local preview and smoke test.
- **Android:** APK for local testing and AAB for Google Play. SDK/JDK and
  Godot export templates run on the desktop.
- **Windows:** runnable desktop build first, followed by MSIX packaging for
  the Microsoft Store.
- **Apple:** final iOS builds require supported macOS/Xcode. A Windows
  creator can use an explicitly paired Mac they own; do not send the build
  to Render.

### Project ownership and saving

Local workspace files are the source of truth. A creator must be able to
copy/export the raw project folder and open it in Godot without a live NEXORA
session. Every project has a stable project ID, owner account ID, build
manifest and asset provenance record. These records provide traceability;
they do not replace license terms or prove copyright ownership by themselves.

Google Drive backup is optional and uses the creator's OAuth grant with the
narrow `drive.file` scope, versioned project archives and resumable uploads.
Never request unrestricted access to the creator's Drive. Publisher accounts
belong to creators; NEXORA assists with preflight and draft submissions, but
store approval remains with the platform.

### Monetization

NEXORA uses its own subscriptions and optional storage/publishing services.
It is not ad-supported and must not use AdMob or rewarded-ad tool access.

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

## Desktop Factory control area

Open **Desktop Factory** from the Studio sidebar after pairing the Local Agent in **Device Lab**.

- **Workspace:** select the local projects directory, import a Godot project ZIP, open the native Godot Editor, or export a portable project archive.
- **Toolchains:** inspect installed Godot, Blender, FFmpeg, Java and Android SDK components; run workload preflight and record detected versions and fingerprints in the project toolchain lock.
- **Create / Test / Build:** jump into the existing NEXORA scene, asset, Creator Flow, Godot validation, playtest, Android build and device workflows. These continue to use the paired local Foundry engine.
- **Backup & Versions:** create full-project snapshots, download archives, and restore a checksum-verified snapshot. A safety snapshot is taken before restoring.
- **Publishing:** prepare a local, checksummed handoff ZIP for a supported store artifact. The feature does not upload or publish anything automatically.

Third-party software installation and licence acceptance remain in the creator's hands. Google Drive OAuth and direct store upload connectors remain unconfigured until their OAuth and publisher-account prerequisites exist. The interface shows those states as unavailable rather than simulating a successful connection.
