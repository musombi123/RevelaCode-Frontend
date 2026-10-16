# Free Vision Math assets (local/offline only)

The scanner has a pixel-math fallback and does not call remote APIs. To download the open-source runtime/model assets once during setup, run from the frontend repository root while internet is available:

```powershell
node scripts/fetch-free-vision-assets.mjs
npm run build
```

The script places assets under `public/vision-assets/`. Keep these generated files available to the deployed static build (commit them if your repository policy allows large assets, or run the script in the deployment build step). Then test the built app with network disabled. The runtime scanner references only same-origin files; it does not fetch from a CDN or call a paid API.

The asset layout includes:

- `tf.min.js` — TensorFlow.js browser bundle.
- `coco-ssd.min.js` — TensorFlow.js COCO-SSD browser bundle.
- `coco-ssd/model.json` and referenced weight shards — COCO-SSD lite model.
- `opencv.js` — OpenCV.js WebAssembly bundle.
- `tesseract.min.js`, `tesseract/worker.min.js`, `tesseract/tesseract-core.wasm.js`, `tesseract/tesseract-core.wasm`, and `tesseract/lang/eng.traineddata.gz` — Tesseract.js and English trained data.

Missing assets degrade gracefully to pixel math. A truly offline first launch requires all JavaScript, WASM, model JSON/shards, and trained data to be packaged with the app. Review each upstream license before redistribution.

Performance note: these assets can be large for low-RAM Android devices. OCR is throttled to at most once every six seconds during live scanning (or on a tapped crop).
