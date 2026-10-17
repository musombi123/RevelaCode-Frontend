// Free on-device vision pipeline. Runtime assets are same-origin only.
const ASSET_ROOT = "/vision-assets";
let assetsPromise = null;
let detectorPromise = null;
let ocrWorkerPromise = null;

function loadScript(path, ready) {
  if (ready()) return Promise.resolve(true);
  if (typeof document === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = path;
    script.async = true;
    script.onload = () => resolve(Boolean(ready()));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function cvReady(cv) {
  return Boolean(cv?.Mat && cv?.imread && cv?.cvtColor);
}

async function waitForCv(cv) {
  if (cvReady(cv)) return cv;
  if (!cv) return null;
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve(cvReady(cv) ? cv : null), 12000);
    const previous = cv.onRuntimeInitialized;
    cv.onRuntimeInitialized = () => {
      window.clearTimeout(timeout);
      try { previous?.(); } catch {}
      resolve(cvReady(cv) ? cv : null);
    };
  });
}

export function scanPixelMath(imageData) {
  const { data, width, height } = imageData || {};
  if (!data || !width || !height) throw new Error("Camera pixels are unavailable.");
  const total = width * height;
  let red = 0, green = 0, blue = 0, luminance = 0, min = 255, max = 0;
  const gray = new Uint8Array(total);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    red += r; green += g; blue += b; luminance += y;
    min = Math.min(min, y); max = Math.max(max, y); gray[p] = y;
  }
  let edgePixels = 0, gradientTotal = 0, gradientMean = 0, n = 0;
  const gradients = [];
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const i = y * width + x;
      const gradient = Math.abs(gray[i + 1] - gray[i - 1]) + Math.abs(gray[i + width] - gray[i - width]);
      gradients.push(gradient); gradientTotal += gradient; gradientMean += gradient; n++;
      if (gradient > 70) edgePixels++;
    }
  }
  gradientMean /= Math.max(1, n);
  let variance = 0;
  for (const value of gradients) variance += (value - gradientMean) ** 2;
  variance /= Math.max(1, gradients.length);
  const brightness = Math.round(luminance / total);
  const averageRGB = { red: Math.round(red / total), green: Math.round(green / total), blue: Math.round(blue / total) };
  const dominantColor = Object.keys(averageRGB).sort((a, b) => averageRGB[b] - averageRGB[a])[0];
  return {
    width, height, brightness,
    light: brightness < 50 ? "dark" : brightness > 200 ? "bright" : "balanced",
    averageRGB, dominantColor, contrast: max - min,
    edgeCount: edgePixels,
    edgeActivity: Math.round(gradientTotal / Math.max(1, n)),
    blurScore: Math.round(variance),
    focus: variance < 120 ? "possibly blurry" : "reasonably sharp",
  };
}

export async function loadLocalVisionAssets() {
  if (assetsPromise) return assetsPromise;
  assetsPromise = (async () => {
    const tfLoaded = await loadScript(`${ASSET_ROOT}/tf.min.js`, () => Boolean(window.tf));
    const cocoLoaded = tfLoaded && await loadScript(`${ASSET_ROOT}/coco-ssd.min.js`, () => Boolean(window.cocoSsd));
    let detector = null;
    if (cocoLoaded && window.cocoSsd?.load) {
      try {
        await window.tf.ready();
        detector = await window.cocoSsd.load({
          base: "lite_mobilenet_v2",
          modelUrl: `${ASSET_ROOT}/coco-ssd/model.json`,
        });
      } catch (error) {
        console.warn("Local COCO-SSD weights unavailable; pixel math remains enabled.", error);
      }
    }
    const cvLoaded = await loadScript(`${ASSET_ROOT}/opencv.js`, () => Boolean(window.cv));
    const cv = cvLoaded ? await waitForCv(window.cv) : null;
    const ocrLoaded = await loadScript(`${ASSET_ROOT}/tesseract.min.js`, () => Boolean(window.Tesseract?.createWorker));
    return { detector, cv, ocrAvailable: Boolean(ocrLoaded && window.Tesseract?.createWorker) };
  })();
  return assetsPromise;
}

async function getOcrWorker() {
  if (!window.Tesseract?.createWorker) return null;
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = window.Tesseract.createWorker("eng", 1, {
      workerPath: `${ASSET_ROOT}/tesseract/worker.min.js`,
      corePath: `${ASSET_ROOT}/tesseract/tesseract-core.wasm.js`,
      langPath: `${ASSET_ROOT}/tesseract/lang`,
      gzip: true,
    }).catch((error) => {
      ocrWorkerPromise = null;
      console.warn("Local OCR assets unavailable.", error);
      return null;
    });
  }
  return ocrWorkerPromise;
}

function scanOpenCv(canvas, cv) {
  if (!cvReady(cv)) return null;
  let src, gray, edges, contours, hierarchy, laplacian, mean, std;
  try {
    src = cv.imread(canvas);
    gray = new cv.Mat(); edges = new cv.Mat(); contours = new cv.MatVector();
    hierarchy = new cv.Mat(); laplacian = new cv.Mat(); mean = new cv.Mat(); std = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.Canny(gray, edges, 70, 150);
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    cv.Laplacian(gray, laplacian, cv.CV_64F);
    cv.meanStdDev(laplacian, mean, std);
    let contourCount = 0;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      if (cv.contourArea(contour) >= 90) contourCount++;
      contour.delete?.();
    }
    return {
      contourCount,
      edgePixels: cv.countNonZero(edges),
      blurScore: Math.round(std.data64F[0] ** 2),
      brightness: Math.round(cv.mean(gray)[0]),
    };
  } catch (error) {
    console.warn("OpenCV scan failed; using pixel-math fallback.", error);
    return null;
  } finally {
    [src, gray, edges, contours, hierarchy, laplacian, mean, std].forEach((item) => item?.delete?.());
  }
}

export async function analyzeCanvas(canvas, { readText = true, crop = null } = {}) {
  const context = canvas?.getContext?.("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not read the camera canvas.");
  const assets = await loadLocalVisionAssets();
  let target = canvas;
  if (crop && crop.width > 0 && crop.height > 0) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(crop.width)); c.height = Math.max(1, Math.round(crop.height));
    c.getContext("2d", { willReadFrequently: true }).drawImage(canvas, crop.x, crop.y, crop.width, crop.height, 0, 0, c.width, c.height);
    target = c;
  }
  const ctx = target.getContext("2d", { willReadFrequently: true });
  const math = scanPixelMath(ctx.getImageData(0, 0, target.width, target.height));
  const cvStats = scanOpenCv(target, assets.cv);
  let objects = [];
  if (assets.detector) {
    try {
      objects = (await assets.detector.detect(target, 10, 0.45)).map((item) => ({
        class: item.class, score: Number(item.score.toFixed(3)), bbox: item.bbox.map((v) => Math.round(v)),
      }));
    } catch (error) { console.warn("Local object detection failed.", error); }
  }
  let text = "";
  if (readText && assets.ocrAvailable) {
    const worker = await getOcrWorker();
    if (worker) {
      try { text = String((await worker.recognize(target))?.data?.text || "").replace(/\s+/g, " ").trim().slice(0, 500); }
      catch (error) { console.warn("Local OCR failed.", error); }
    }
  }
  const brightness = cvStats?.brightness ?? math.brightness;
  const result = {
    ...math,
    brightness,
    light: brightness < 50 ? "dark" : brightness > 200 ? "bright" : "balanced",
    contourCount: cvStats?.contourCount ?? math.edgeCount,
    edgePixels: cvStats?.edgePixels ?? math.edgeCount,
    blurScore: cvStats?.blurScore ?? math.blurScore,
    focus: (cvStats?.blurScore ?? math.blurScore) < 120 ? "possibly blurry" : "reasonably sharp",
    objects,
    objectNames: objects.map((item) => item.class),
    text,
    objectModelReady: Boolean(assets.detector),
    openCvReady: Boolean(assets.cv),
    ocrReady: Boolean(assets.ocrAvailable),
  };
  result.summary = [
    objects.length ? "Detected labels: " + objects.map((o) => `${o.class} (${Math.round(o.score * 100)}% confidence)`).join(", ") + "." : "No semantic object labels are available from the local detector.",
    `Brightness: ${result.brightness}/255 (${result.light}); average RGB ${result.averageRGB.red}, ${result.averageRGB.green}, ${result.averageRGB.blue}.`,
    `Contour count: ${result.contourCount}; contrast range: ${result.contrast}; focus: ${result.focus}.`,
    text ? `Text detected: “${text}”.` : "No OCR text returned by the local reader.",
  ].join(" ");
  result.visionDescription = result.summary;
  return result;
}

// Backwards-compatible adapter for the existing livingBrain.js contract.
export async function scanCanvas(canvas, _loadedAssets = null, options = {}) {
  const result = await analyzeCanvas(canvas, options);
  return {
    ...result,
    description: result.summary || result.visionDescription || "",
  };
}

export async function analyzeImageFileEnhanced(file) {
  if (!file || !String(file.type || "").startsWith("image/")) throw new Error("Choose an image file.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d", { willReadFrequently: true }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { fileName: file.name, ...(await analyzeCanvas(canvas)) };
  } finally { bitmap.close?.(); }
}

export function answerFromVision(scan) {
  if (!scan) return "Capture an image first.";
  const objects = scan.objects?.length ? scan.objects.map((item) => `${item.class} (${Math.round(item.score * 100)}%)`).join(", ") : "no reliable object labels are available yet";
  return `From the on-device scan, I have ${objects}. Brightness is ${scan.brightness}/255 (${scan.light}); ${scan.contourCount} edge/contour regions were measured. ${scan.text ? `The local text reader detected: “${scan.text}”.` : "No readable text was returned."} ${scan.focus === "possibly blurry" ? "The frame may be blurry—hold steady and try again." : ""}`;
}

console.log("RevelaAI v2.0 - 5 Hubs - 100% Free - No Paid API");
