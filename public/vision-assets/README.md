# Free Vision assets (same-origin at runtime)

The camera scanner uses local canvas math immediately. Optional COCO-SSD object labels, OpenCV contours/Laplacian blur score, and Tesseract OCR are enabled only when the following files exist under this directory.

From the frontend repository root, while setup internet is available:

```powershell
node scripts/fetch-free-vision-assets.mjs
npm run build
```

The script downloads the open-source browser runtimes, COCO-SSD lite model manifest and weights, OpenCV.js, and Tesseract.js English data. Runtime requests use `/vision-assets/` on the same origin; no model inference API or paid provider is called.

The downloaded binaries are not committed in source control by default. Ensure the generated files are present during the static build/deployment (or package them with the Android app). For a genuine offline-first install, cache/package every JS, WASM, model JSON, weight shard and language-data file, then disable network and test again. Camera permission requires a secure context such as HTTPS or localhost.

Large model and OCR assets can strain low-RAM devices. COCO-SSD uses the lite MobileNet v2 backbone; OCR is on demand. Review upstream licenses before redistributing assets. Face landmarks are not included and facial geometry must not be presented as reliable evidence of a person's emotions.
