// RevelaAI Free Vision Math — local-only browser pipeline.
// Optional model/OCR/OpenCV assets are loaded exclusively from same-origin /vision-assets paths.
// Pixel math continues to work when optional assets are not installed.
const ASSET = "/vision-assets";
const scriptPromises = new Map();

function loadLocalScript(path, ready) {
  if (ready()) return Promise.resolve(true);
  if (scriptPromises.has(path)) return scriptPromises.get(path);
  const promise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = path;
    script.async = true;
    script.onload = () => resolve(Boolean(ready()));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  scriptPromises.set(path, promise);
  return promise;
}

async function waitForOpenCv(cv) {
  if (!cv) return false;
  if (cv.Mat && cv.imread) return true;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(Boolean(cv.Mat && cv.imread)), 12000);
    cv.onRuntimeInitialized = () => {
      clearTimeout(timeout);
      resolve(true);
    };
  });
}

export async function loadLocalVisionAssets() {
  const tensorflow = await loadLocalScript(`${ASSET}/tf.min.js`, () => Boolean(window.tf));
  const detectorScript = tensorflow
    ? await loadLocalScript(`${ASSET}/coco-ssd.min.js`, () => Boolean(window.cocoSsd))
    : false;
  let detector = null;
  if (detectorScript && window.cocoSsd?.load) {
    try {
      await window.tf.ready();
      detector = await window.cocoSsd.load({
        base: "lite_mobilenet_v2",
        modelUrl: `${ASSET}/coco-ssd/model.json`,
      });
    } catch (error) {
      console.warn("Local COCO-SSD weights unavailable; using pixel math.", error);
    }
  }

  const cvScript = await loadLocalScript(`${ASSET}/opencv.js`, () => Boolean(window.cv));
  const cvReady = cvScript ? await waitForOpenCv(window.cv) : false;
  const ocrScript = await loadLocalScript(`${ASSET}/tesseract.min.js`, () => Boolean(window.Tesseract));
  return { detector, cv: cvReady ? window.cv : null, ocrAvailable: ocrScript && Boolean(window.Tesseract) };
}

export function scanPixelMath(imageData) {
  const { data, width, height } = imageData;
  if (!data || !width || !height) throw new Error("No readable image pixels.");
  const total = width * height;
  let rgb = [0, 0, 0], luminance = 0, minLuma = 255, maxLuma = 0;
  const gray = new Uint8Array(total);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    rgb[0] += r; rgb[1] += g; rgb[2] += b;
    luminance += y; minLuma = Math.min(minLuma, y); maxLuma = Math.max(maxLuma, y);
    gray[p] = y;
  }
  const brightness = Math.round(luminance / total);
  // A lightweight gradient estimate is retained as a fallback when OpenCV isn't bundled.
  let edgePixels = 0, gradientSum = 0, blurVariance = 0, gradientN = 0, gradientMean = 0;
  const gradients = [];
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const i = y * width + x;
      const gx = Math.abs(gray[i + 1] - gray[i - 1]);
      const gy = Math.abs(gray[i + width] - gray[i - width]);
      const grad = gx + gy;
      gradients.push(grad); gradientSum += grad; gradientMean += grad; gradientN++;
      if (grad > 70) edgePixels++;
    }
  }
  gradientMean /= Math.max(1, gradientN);
  for (const grad of gradients) blurVariance += (grad - gradientMean) ** 2;
  blurVariance /= Math.max(1, gradients.length);
  const averageRGB = rgb.map((v) => Math.round(v / total));
  const contrast = maxLuma - minLuma;
  return {
    width, height, brightness, averageRGB, contrast,
    light: brightness < 50 ? "dark" : brightness > 200 ? "bright" : "balanced",
    edgeCount: edgePixels,
    edgeActivity: Math.round(gradientSum / Math.max(1, gradientN)),
    blurScore: Math.round(blurVariance),
    focus: blurVariance < 120 ? "possibly blurry" : "reasonably sharp",
    dominantColor: ["red", "green", "blue"][averageRGB.indexOf(Math.max(...averageRGB))],
  };
}

function scanOpenCv(canvas, cv) {
  if (!cv?.Mat) return null;
  let src, gray, edges, laplacian, contours, hierarchy;
  try {
    src = cv.imread(canvas);
    gray = new cv.Mat();
    edges = new cv.Mat();
    laplacian = new cv.Mat();
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.Canny(gray, edges, 70, 150);
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    cv.Laplacian(gray, laplacian, cv.CV_64F);
    const mean = cv.mean(gray)[0];
    const meanMat = new cv.Mat();
    const stdMat = new cv.Mat();
    cv.meanStdDev(laplacian, meanMat, stdMat);
    const blurScore = Math.round(stdMat.data64F[0] ** 2);
    meanMat.delete(); stdMat.delete();
    let contourCount = 0;
    for (let i = 0; i < contours.size(); i++) {
      const area = cv.contourArea(contours.get(i));
      if (area >= 90) contourCount++;
    }
    return { cvBrightness: Math.round(mean), contourCount, blurScore, edgePixels: cv.countNonZero(edges) };
  } catch (error) {
    console.warn("OpenCV local math failed; using pixel gradient fallback.", error);
    return null;
  } finally {
    [src, gray, edges, laplacian, contours, hierarchy].forEach((mat) => mat?.delete?.());
  }
}

async function readLocalText(canvas) {
  if (!window.Tesseract?.createWorker) return "";
  let worker;
  try {
    worker = await window.Tesseract.createWorker("eng", 1, {
      workerPath: `${ASSET}/tesseract/worker.min.js`,
      corePath: `${ASSET}/tesseract/tesseract-core.wasm.js`,
      langPath: `${ASSET}/tesseract/lang`,
      gzip: true,
    });
    const result = await worker.recognize(canvas);
    return String(result?.data?.text || "").replace(/\\s+/g, " ").trim().slice(0, 500);
  } catch (error) {
    console.warn("Local OCR assets unavailable.", error);
    return "";
  } finally {
    if (worker) await worker.terminate().catch(() => {});
  }
}

export async function scanCanvas(canvas, assets = {}) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas pixel access is unavailable.");
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const math = scanPixelMath(pixels);
  const cvStats = scanOpenCv(canvas, assets.cv || window.cv);
  let predictions = [];
  if (assets.detector) {
    try {
      predictions = (await assets.detector.detect(canvas, 10, 0.45)).map((item) => ({
        class: item.class, score: Number(item.score.toFixed(3)), bbox: item.bbox.map((v) => Math.round(v)),
      }));
    } catch (error) {
      console.warn("Local object detector failed.", error);
    }
  }
  const text = assets.ocrAvailable ? await readLocalText(canvas) : "";
  const objects = predictions.map((item) => item.class);
  const contours = cvStats?.contourCount ?? math.edgeCount;
  const blurScore = cvStats?.blurScore ?? math.blurScore;
  const brightness = cvStats?.cvBrightness ?? math.brightness;
  const result = {
    ...math, brightness, objects: predictions, objectNames: objects,
    contourCount: contours, blurScore, text,
    objectModelReady: Boolean(assets.detector),
    openCvReady: Boolean(assets.cv || window.cv?.Mat),
    ocrReady: Boolean(assets.ocrAvailable && text),
    scannedAt: new Date().toISOString(),
  };
  result.description = describeVision(result);
  return result;
}

export function describeVision(data) {
  const names = data.objectNames?.length
    ? data.objects.map((o) => `${o.class} (${Math.round(o.score * 100)}% confidence)`).join(", ")
    : "no object labels available from the local detector";
  const text = data.text ? ` Text detected: “${data.text}”.` : "";
  return `Camera scan: ${names}. Brightness ${data.brightness}/255 (${data.light}). ${data.contourCount} contours/edge regions estimated; image is ${data.focus}.${text} Pixel math is not semantic understanding; object labels depend on locally installed model weights.`;
}

export function answerWhatDoISee(data) {
  if (!data) return "Start the camera scan first so I can answer from current on-device measurements.";
  const objects = data.objects?.length
    ? data.objects.map((o) => `${o.class} (${Math.round(o.score * 100)}%)`).join(", ")
    : "I don't have object labels yet because the local COCO-SSD model assets are not installed.";
  const light = data.brightness < 50
    ? "The scene is dark; try more light or the torch if your camera supports it."
    : data.brightness > 200 ? "The scene is very bright." : "Lighting looks moderate.";
  return `From the latest local camera scan: ${objects}. Brightness is ${data.brightness}/255. ${light}${data.text ? ` The text reader detected: “${data.text}”.` : " No readable text was returned by the local OCR engine."} ${data.contourCount} contours/edge regions were measured. These are measurements, not a claim that the system understands everything in the scene.`;
}

console.log("Vision Engine: 100% Free - No Paid API");
