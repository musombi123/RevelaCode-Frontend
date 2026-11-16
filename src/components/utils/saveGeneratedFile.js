const NATIVE_FILE_LIMIT_BYTES = 20 * 1024 * 1024;

function getNativeDownloadPlugin() {
  const capacitor = typeof window !== "undefined" ? window.Capacitor : null;
  if (!capacitor?.isNativePlatform?.()) return null;
  const plugin = capacitor?.Plugins?.RevelaDownload;
  if (!plugin?.saveFile) {
    throw new Error(
      "This installed RevelaCode app does not include native file saving. Update to the Android build with the RevelaDownload bridge, then retry."
    );
  }
  return plugin;
}

async function blobToBase64(blob) {
  if (typeof FileReader === "undefined") {
    throw new Error("This device cannot prepare the generated file for native saving.");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the generated file for saving."));
    reader.onload = () => {
      const value = String(reader.result || "");
      const separator = value.indexOf(",");
      if (separator < 0) {
        reject(new Error("The generated file could not be encoded for Android storage."));
        return;
      }
      resolve(value.slice(separator + 1));
    };
    reader.readAsDataURL(blob);
  });
}

export async function saveGeneratedFile(
  blob,
  { fileName = "revelacode-download.bin", mimeType = "application/octet-stream" } = {}
) {
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("There is no valid file data to save.");
  }

  const safeName = String(fileName || "revelacode-download.bin")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .slice(0, 120);

  const nativePlugin = getNativeDownloadPlugin();
  if (nativePlugin) {
    if (blob.size > NATIVE_FILE_LIMIT_BYTES) {
      throw new Error("This file exceeds the 20 MB native-save limit. Export a smaller file.");
    }
    const data = await blobToBase64(blob);
    const result = await nativePlugin.saveFile({
      fileName: safeName,
      mimeType: String(mimeType || blob.type || "application/octet-stream"),
      data,
    });
    return {
      method: "native",
      fileName: result?.fileName || safeName,
      uri: result?.uri || null,
      bytes: Number(result?.bytes) || blob.size,
    };
  }

  if (typeof document === "undefined" || typeof URL?.createObjectURL !== "function") {
    throw new Error("This browser does not support generated-file downloads.");
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = safeName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    // Give mobile browsers time to consume the object URL after the click.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
  }
  return { method: "browser", fileName: safeName, bytes: blob.size };
}
