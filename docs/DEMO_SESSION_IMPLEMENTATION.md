# RevelaCode Demo Session

The Demo Session is a guided, bilingual tour of the RevelaCode/Jumuiya ecosystem. It is implemented in the existing React/Vite application and is bundled with the web and Capacitor Android builds.

## Source files

- `src/demo/DemoProvider.jsx` — tour context, progress persistence and actions.
- `src/demo/demoScript.js` — English/Kiswahili chapters and the HOME_HUBS/DASHBOARDS chapter builder.
- `src/demo/DemoOverlay.jsx` — spotlight, bottom sheet, chapter menu, keyboard/focus handling, voice and Finish recap.
- `src/demo/DemoLauncher.jsx` — Try the Demo, Resume demo and active demo-mode badge.
- `src/demo/demoApi.js` — fetch, XMLHttpRequest (Axios browser adapter) and sendBeacon guard; `trackDemo()`.
- `src/demo/mockData.js` — sample shop, farm, school, community and account data.
- `src/demo/demo.css` — spotlight, responsive sheet, contrast, touch targets and reduced-motion styles.
- `tests/demo-session.test.mjs` — registry, chapter, mock API, target and accessibility smoke tests.

The source-level demo module already existed in this repository. This work completes and extends that module rather than creating a second tour framework.

## Chapter sequence

1. Welcome and account — StartModal and guest access.
2. Home hub.
3. Biashara — business overview, Products and stock, sample product entry.
4. Shamba — farm overview and farm records.
5. Elimu — school navigation and public school pages.
6. Faith & Scripture — Study Library.
7. Community — create a draft, return to feed and open Jumuiya chat.
8. RevelaAI — sample prompt, voice and vision.
9. Account Center — profile, payments, security, notifications; Help is the final challenge.
10. Finish — recap, rating/comment, Create free account, Continue as guest, Restart and Done.

The curated chapters are generated in order from the current HOME_HUBS and visible DASHBOARDS registries. New visible hub entries are automatically added as guided chapters before RevelaAI and Account Center. Hidden dashboards are excluded.

## Existing app integration

These hooks were already present and are retained.

### App entry

The app builds chapters from the live registries and mounts the provider around the routed app. The overlay is rendered inside BrowserRouter so it can navigate between hubs.

```jsx
const DEMO_CHAPTERS = buildDemoChapters(HOME_HUBS, DASHBOARDS);

<DemoProvider chapters={DEMO_CHAPTERS}>
  <HistoryProvider>
    <BrowserRouter>
      {/* application Routes */}
      <DemoOverlay />
    </BrowserRouter>
  </HistoryProvider>
</DemoProvider>
```

### StartModal

The authentication/start screen imports and displays the compact launcher. The Welcome chapter uses stable targets on the entry and guest actions.

```jsx
import DemoLauncher from "@/demo/DemoLauncher.jsx";

// inside the StartModal welcome panel
<DemoLauncher compact />
```

### Home hub

The home screen offers a Home-started tour and stable targets on the welcome area and hub cards.

```jsx
<DemoLauncher startAt="home" />
<button data-demo={`home-hub-${hub.key}`} onClick={() => handleHubOpen(hub.key)}>
  {/* hub card */}
</button>
```

### Account Center help

The Help workspace also offers a launcher so members can start or resume the tour from Account Center.

```jsx
case "help":
  return (
    <div data-demo="account-help-workspace">
      <DemoLauncher startAt="welcome" compact />
      <HelpModal />
    </div>
  );
```

## Demo safety

While `state.active` is true:

- POST, PUT, PATCH and DELETE requests are simulated, regardless of destination.
- API GET/HEAD requests are answered from `mockData.js`.
- XMLHttpRequest is guarded for Axios' browser XHR adapter; fetch is guarded directly.
- sendBeacon is blocked unless it targets a recognised analytics provider or an explicit analytics endpoint on a first-party RevelaCode service.
- Analytics calls go through `trackDemo()`; it is a no-op unless a compatible analytics adapter is configured.
- Progress and language preference use localStorage inside try/catch. The demo works offline because the script and fixtures are bundled. Read-aloud uses a matching sw-KE/en-KE voice (or language-region match) when installed; otherwise it remains silent rather than switching to an unrelated voice.

Do not add a direct payment SDK/network call to a demo action. Keep payment and business writes behind the existing API gateway so the demo guard can simulate them.

## Commands

```bash
npm ci
npm run test:demo
npm run build
```

The Android workflow also runs `npm run test:demo` against the frontend revision before packaging the native app.

## Manual test checklist

### Web
- [ ] Start from StartModal; check Try the Demo and Continue as guest.
- [ ] Start from Home and resume an interrupted session.
- [ ] Complete the Biashara sample product flow; verify no product is saved.
- [ ] Complete Shamba, Elimu, Faith, Community and RevelaAI chapters.
- [ ] Open Account Center profile, payments, security and notifications; use Help challenge.
- [ ] Switch English/Kiswahili and reload; language and progress persist.
- [ ] Finish the recap, submit a rating/comment, create an account or continue as guest.

### Android APK
- [ ] Start/resume the tour in the WebView.
- [ ] Verify the bottom-sheet layout respects the status/navigation safe areas.
- [ ] Press Android Back on a middle step; it goes to the previous step.
- [ ] Press Back on step one; the exit confirmation appears; a second Back confirms.
- [ ] Test the Elimu mobile drawer, Community draft-to-feed transition and Shamba navigation.
- [ ] Verify the persistent Demo mode — nothing is saved indicator.

### Keyboard only
- [ ] Tab and Shift+Tab remain inside the tour dialog.
- [ ] Enter activates launcher, chapter, action and navigation buttons.
- [ ] Left/Right arrows move back/forward when focus is not in a text field.
- [ ] Escape opens exit confirmation; a second Escape confirms.
- [ ] Focus returns to the visible launcher after exit.

### Screen reader
- [ ] The tour announces its dialog title and the current step through aria-live.
- [ ] Only the tour dialog is modal while the StartModal is behind it.
- [ ] Step buttons, chapter menu, language, voice and rating controls have accessible names.
- [ ] A missing/slow target falls back to a centred card after three seconds.
