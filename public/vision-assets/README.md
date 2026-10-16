# Free Vision Math assets (local/offline only)

The scanner has a pixel-math fallback and does not call remote APIs. To enable object labels, OpenCV contours, and OCR, place these self-hosted files under `public/vision-assets/`:

- `tf.min.js` — TensorFlow.js browser bundle.
- `coco-ssd.min.js` — TensorFlow.js COCO-SSD package browser bundle.
- `coco-ssd/model.json` and referenced weight shards — COCO-SSD lite model.
- `opencv.js` — OpenCV.js WebAssembly bundle.
- `tesseract.min.js`, `tesseract/worker.min.js`, `tesseract/tesseract-core.wasm.js`, and `tesseract/lang/eng.traineddata.gz` — Tesseract.js and English trained data.

The code uses same-origin asset paths only; it never loads model code or weights from a CDN at runtime. Missing assets degrade gracefully to pixel math. A truly offline first launch requires all JS, WASM, model JSON/shards, and trained data to be packaged with the app. Review each upstream license before redistribution.

Performance note: COCO-SSD, OpenCV WASM and OCR can be large for low-RAM Android devices. OCR is throttled to at most once every six seconds during live scanning (or on a tapped crop).
