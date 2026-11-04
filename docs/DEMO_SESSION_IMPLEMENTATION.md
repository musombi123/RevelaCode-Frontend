# RevelaCode / Jumuiya Demo Session

The Demo Session is a guided, bilingual tour of the real RevelaCode/Jumuiya React application. It runs in the browser and in the Capacitor Android WebView. It uses bundled chapter data and fixtures, not a separate demo app.

## Complete source files

| File | Responsibility |
|---|---|
| `src/demo/DemoProvider.jsx` | Context state, start/next/back/skip/jump/exit/restart, localStorage progress and network-guard lifecycle. |
| `src/demo/demoScript.js` | Complete English/Kiswahili chapters, one-line audience hooks, summaries, benefits, action steps and HOME_HUBS/DASHBOARDS chapter generation. |
| `src/demo/DemoOverlay.jsx` | Spotlight, desktop tooltip, mobile bottom sheet, chapter drawer, progress, finish recap, rating, focus trap, narration and Android Back. |
| `src/demo/DemoLauncher.jsx` | Try the Demo, Resume demo and persistent Demo mode status. |
| `src/demo/demoApi.js` | Fetch, XMLHttpRequest (Axios browser adapter) and sendBeacon guards, plus the single `trackDemo()` analytics adapter. |
| `src/demo/mockData.js` | Sample shop, farm, school/access, Study Library materials, Community posts, Account Center data and RevelaAI answer. |
| `src/demo/demo.css` | Plain CSS spotlight/sheet, safe-area layout, high-contrast controls, 48px action targets and reduced-motion support. |
| `tests/demo-session.test.mjs` | Automated registry order, bilingual text-length, fixture, stable-target, keyboard and responsive contracts. |

**Full copy-ready bilingual chapter script:** `src/demo/demoScript.js`. That file is the single source of truth; do not maintain a second list of chapters elsewhere.

## Chapter sequence

The curated chapters follow this order:

1. Welcome and account access — StartModal and guest mode.
2. Home hub.
3. Biashara — business overview, Products and stock, sample product name, simulated product creation.
4. Shamba — farmer overview, Farms navigation and farm record.
5. Elimu — school workspace, school pages, learner records.
6. Faith & Scripture — Study Library.
7. Community / Jumuiya — feed, sample post draft, return to feed and Chats.
8. RevelaAI — sample question, simulated reply, voice and vision entry points.
9. Account Center — profile, wallet, security, notifications and help.
10. Finish — recap, rating/comment, create account, continue as guest, restart.

The builder reads `HOME_HUBS` and `DASHBOARDS` from `src/components/dashboardConfig.jsx`. New visible registry entries without curated content receive generated bilingual chapters; hidden dashboards are excluded. Registry extensions appear after the five core hubs and before RevelaAI / Account Center.

Every curated chapter has 3–5 steps, a `whoFor` hook, bilingual summary, up to three benefits and a short optional challenge. Each step body is limited to 25 words per language.

## App entry integration

The provider wraps the routed application after AuthProvider, and one overlay is mounted inside BrowserRouter. The chapter array is built from the live registries.

```jsx
import DemoProvider from "./demo/DemoProvider.jsx";
import DemoOverlay from "./demo/DemoOverlay.jsx";
import { buildDemoChapters } from "./demo/demoScript.js";
import { HOME_HUBS, DASHBOARDS } from "./components/dashboardConfig.jsx";

const DEMO_CHAPTERS = buildDemoChapters(HOME_HUBS, DASHBOARDS);

<AuthProvider>
  <DemoProvider chapters={DEMO_CHAPTERS}>
    <HistoryProvider>
      <BrowserRouter>
        <Routes>{/* existing application routes */}</Routes>
        <DemoOverlay />
      </BrowserRouter>
    </HistoryProvider>
  </DemoProvider>
</AuthProvider>
```

Do not put DemoProvider outside AuthProvider: the overlay uses the existing auth context for guest continuation.

## Existing entry points and exact small edits

The StartModal, Home launcher and Account Center Help launcher were already present in the repository when this implementation was extended. These are the concrete integration points to retain.

### StartModal — keep the entry and guest targets

```jsx
import DemoLauncher from "@/demo/DemoLauncher.jsx";

// Inside the default welcome panel:
<div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3">
  <p className="mb-2 text-sm font-bold">New to RevelaCode? Take a guided tour.</p>
  <DemoLauncher compact />
</div>

// Existing StartModal dialog and guest button:
<div role="dialog" aria-modal="true" data-demo="welcome-entry">
  {/* existing sign-in / register / guest UI */}
  <button type="button" data-demo="welcome-guest" onClick={handleGuestLogin}>
    Continue as guest
  </button>
</div>
```

### Home dashboard — launcher and stable hub target

The launcher already exists in both compact Android and responsive web home views:

```jsx
<DemoLauncher startAt="home" compact />
// Web:
<DemoLauncher startAt="home" />
```

Hub cards use the registry key, so a future hub receives a matching target without hard-coding another target:

**Before**

```jsx
<button key={hub.key} type="button" onClick={() => handleHubOpen(hub.key)}>
  {/* hub card */}
</button>
```

**After**

```jsx
<button
  key={hub.key}
  type="button"
  onClick={() => handleHubOpen(hub.key)}
  data-demo={`home-hub-${hub.key}`}
>
  {/* hub card */}
</button>
```

### Account Center Help — relaunch from Help

The current Help view retains its CTA and target:

```jsx
case "help":
  return (
    <div data-demo="account-help-workspace">
      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-sm font-bold">Need a guided tour?</p>
        <p className="text-xs">Learn the main workspaces step by step.</p>
        <DemoLauncher startAt="welcome" compact />
      </div>
      <HelpModal />
    </div>
  );
```

During an active guest tour only, the Account Center exposes a sample profile and wallet view with `DEMO_ACCOUNT` data. Normal guest account restrictions remain unchanged when Demo mode is off. Wallet copy explicitly says that payments, M-Pesa and transfers are disabled.

## Demo mode safety

While `state.active` is true:

- Every `POST`, `PUT`, `PATCH` and `DELETE` is intercepted before it is sent, regardless of destination.
- API `GET` and `HEAD` requests return local sample data.
- XMLHttpRequest is guarded for Axios' default browser adapter; fetch is guarded directly.
- sendBeacon is suppressed except for recognised analytics providers or explicit first-party analytics/telemetry endpoints.
- The AI sample question returns a local sample answer. It does not call the RevelaAI service.
- Business writes and payment-provider requests are simulated; nothing is saved and no money moves.
- `trackDemo(eventName, detail)` is the only analytics entry point. It no-ops when no supported analytics adapter is configured.
- Progress and language survive reload in localStorage inside try/catch. The bundled script and fixtures allow the tour to run offline.

### Fully populated presentation records

The guided Demo Session now exposes a coherent synthetic presentation dataset across the three operational hubs. It is loaded only while Demo mode is active; it does not create database rows or change live tenant records.

| Hub | Included presentation records |
|---|---|
| Elimu | One **Jumuiya Demonstration School**, explicitly labelled **DEMO SCHOOL — NOT VERIFIED**; 320 synthetic learners, 12 classes, 18 staff, 48 lessons, 6 assignments, 90 attendance entries, 96 assessment records, 120 fee ledgers, 30 timetable entries, CBC projects, school events and library catalogue entries. |
| Shamba | Synthetic farmer profile; 3 farms, 4 crop records, 4 field activities, 2 harvests, 2 sample soil-test records, market prices, weather, alerts, recommendations, farmer-profile review cases, farm-rights review cases, safety reports and soil-service requests. |
| Biashara | Synthetic retail business; 30 products, 18 customers, 18 orders, 40 sales, 12 expenses, 8 employees, 3 services, production batches, finance transactions, storefront settings and sample website inquiries. |

All records are synthetic and visibly marked with demo metadata. The school, farmer and business are not presented as verified real entities. Demo GET requests resolve to the bundled fixtures for the corresponding module. POST, PUT, PATCH and DELETE remain simulated and return a clear “nothing was saved” response. Payments, M-Pesa and external payment-provider calls remain disabled.

The dataset is deliberately available to an authenticated administrator who starts Demo mode as well as to a guest using the guided tour. Demo mode does not grant platform-admin permissions: it only replaces data reads and blocks writes while the session is active.
- Read-aloud looks for sw-KE/en-KE or another voice in the selected language. If none is installed, narration remains silent.

Keep demo actions behind the API gateway. Do not add direct payment SDK calls or raw payment-provider requests to a guided demo action.

## Accessibility and Android behaviour

- `role="dialog"`, `aria-labelledby`, `aria-describedby`, `aria-live="polite"`.
- Tab/Shift+Tab focus containment, Enter for buttons, Escape for exit confirmation, Left/Right arrows for previous/next.
- Focus returns to the visible launcher when the tour exits.
- The Android hardware Back button moves to the previous step; on step one it opens the exit confirmation. Shamba's own listener yields while the overlay is open.
- A target is found by `data-demo`, not CSS classes. Responsive duplicates are filtered for visibility. If it remains missing for three seconds, the step uses a centred card.
- The mobile card is a bottom sheet under 768px and uses safe-area insets. Motion respects `prefers-reduced-motion`. Interactive tour controls have 48px targets.

## Commands

```bash
npm ci
npm run test:demo
npm run test:auth
npm run test:community
npm run build
```

The Android workflow runs `npm run test:demo`, verifies the required target strings in the production Vite bundle, builds a debug APK and runs an Android emulator smoke test.

## Manual test checklist

### Web
- [ ] Start from StartModal; test Try the Demo and Continue as guest.
- [ ] Start from Home and resume an interrupted session.
- [ ] Complete the Biashara sample product flow; verify no product is saved.
- [ ] Complete Shamba, Elimu, Faith and Community; verify the sample post is not published.
- [ ] Open Elimu Students, Classes, Staff, Attendance, Assessments, Fees and Timetable; confirm the synthetic sample records are populated and the school is labelled not verified.
- [ ] Open Shamba Farms, Crops, Activities, Harvests, Soil, Market and Trust Centre; confirm farmer and farm-rights review queues are sample-only.
- [ ] Open Biashara Products, Orders, Customers, Sales, Finance, HR, Factory and Website; confirm all sample records are populated.
- [ ] Send the sample RevelaAI question; verify the local demo reply appears.
- [ ] Open the sample wallet; verify no payment provider or M-Pesa request occurs.
- [ ] Exit, reload and Resume; verify chapter, step and language persist.

### Android APK / WebView
- [ ] Start/resume the tour in the WebView.
- [ ] Verify the bottom sheet respects status/navigation safe areas.
- [ ] Press Android Back on a middle step; confirm it goes back one step.
- [ ] Press Back on step one; verify exit confirmation.
- [ ] Test Elimu's mobile menu, Community draft-to-feed transition and Shamba navigation.
- [ ] Verify the Demo mode — nothing is saved indicator remains visible.

### Keyboard-only
- [ ] Tab and Shift+Tab remain inside the tour dialog.
- [ ] Enter activates buttons and sample actions.
- [ ] Left/Right arrows move backward/forward outside text fields.
- [ ] Escape opens exit confirmation; focus returns to the launcher after exit.
- [ ] Enable reduced motion and confirm transitions stop animating.

### Screen reader
- [ ] Dialog title and current step are announced.
- [ ] Only the tour dialog is exposed as modal while StartModal is behind it.
- [ ] Chapter, language, narration, navigation, rating and action controls have accessible names.
- [ ] Missing/slow targets fall back to a centred card after three seconds.
