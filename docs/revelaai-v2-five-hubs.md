# RevelaAI v2 — Five hubs and free local vision

This implementation enhances the existing React chat and existing Flask/Python RevelaAI service. It does not replace BibleDashboard, Biashara dashboards, or the rest of the RevelaCode app.

## Five selectable personas

- `mkulima` — farming, crops, soil, irrigation and practical English/Kiswahili guidance.
- `biashara` — sales, negotiation, unit economics and business decisions.
- `elimu` — teaching, explanations and programming help.
- `mahubiri` — contextual Bible study, sermon structure, theology and prophecy.
- `general` — cross-hub mentoring, clear next steps and respectful disagreement.

The sidebar changes the active persona. Text messages and local camera measurements are sent to `POST /api/revelaai/hubs/respond` when the backend URL is configured. The endpoint uses deterministic rules, bounded caching and local JSON memory; it does not call a paid or external AI model. If no URL is configured, the browser falls back to its existing local rule engine.

## Frontend environment

Set the Vite build variable to the **base URL of the deployed RevelaAI Flask service**:

```env
VITE_REVELAAI_HUB_API_URL=https://YOUR-REVELAAI-SERVICE
```

Do not put API keys in this variable. Rebuild/redeploy the frontend after setting it. The backend's CORS allowlist must include the exact frontend origin.

## Local camera stack

- Canvas luminance, average RGB, contrast, edge activity and a blur heuristic run on the device.
- Optional TensorFlow.js COCO-SSD lite object labels, OpenCV Canny/contours/Laplacian, and Tesseract OCR load only from same-origin `/vision-assets/` paths.
- To prepare those static files at build/setup time, run `npm run vision:assets`, then `npm run build`. Ensure the generated assets are included in the deployed build. Runtime inference uses the bundled files, not a paid API.
- The downloaded binaries/model weights are not committed in this PR. Without them, the scanner truthfully reports that semantic object labels/OCR are unavailable; pixel math still works.

## Voice

The chat composer uses Web Speech API recognition when supported, with English/Kiswahili selection. Assistant messages expose a Listen action backed by the device's `speechSynthesis`. Browser recognition may rely on browser/device services and is not guaranteed to work offline on every Android build.

## Validation

Run `npm ci`, `npm run build`, then test HTTPS camera permission, capture and cancel cleanup, image uploads, speech recognition, device playback, all five hub selections, and the backend endpoint. Test a production build with the network disabled before advertising first-launch offline support.

The deterministic persona engine is not an LLM or AGI. It should not claim supernatural powers, infer a person's inner emotions from facial geometry, invent Bible quotations, or make crop diagnoses from brightness/contours alone.
