import { Capacitor, registerPlugin } from "@capacitor/core";

const RevelaDownload = registerPlugin("RevelaDownload");

const NATIVE_FILE_LIMIT_BYTES = 20 * 1024 * 1024;

function getNativeDownloadPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  return RevelaDownload;
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
    let result;
    try {
      result = await nativePlugin.saveFile({
        fileName: safeName,
        mimeType: String(mimeType || blob.type || "application/octet-stream"),
        data,
      });
    } catch (error) {
      const detail = String(error?.message || error || "");
      if (/not implemented|plugin.*not found|not registered|does not exist/i.test(detail)) {
        throw new Error(
          "This installed RevelaCode app does not include native file saving. Update to the Android build with the RevelaDownload bridge, then retry."
        );
      }
      throw new Error(detail || "Android could not save this file.");
    }
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


const REVELAAI_API_BASE = String(
  import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com"
).trim().replace(/\/+$/, "");

export function resolveRevelaAIArtifactUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) throw new Error("The generated artifact does not have a download URL.");
  let base;
  let resolved;
  try {
    base = new URL(REVELAAI_API_BASE);
    resolved = new URL(raw, base);
  } catch {
    throw new Error("The generated artifact download URL is invalid.");
  }

  const isLocalDevelopment =
    import.meta.env.DEV &&
    ["localhost", "127.0.0.1"].includes(base.hostname) &&
    resolved.origin === base.origin;
  if ((!["https:"].includes(resolved.protocol) && !isLocalDevelopment) || resolved.origin !== base.origin) {
    throw new Error("The generated file link does not belong to the configured RevelaAI service.");
  }
  return resolved.toString();
}

export async function downloadRemoteArtifact(
  value,
  { fileName = "revelacode-download", mimeType = "application/octet-stream" } = {}
) {
  const url = resolveRevelaAIArtifactUrl(value);
  const safeName = String(fileName || "revelacode-download")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .slice(0, 120);

  const nativePlugin = getNativeDownloadPlugin();
  if (nativePlugin) {
    let result;
    try {
      result = await nativePlugin.downloadUrl({
        url,
        fileName: safeName,
        mimeType: String(mimeType || "application/octet-stream"),
      });
    } catch (error) {
      const detail = String(error?.message || error || "");
      if (/not implemented|plugin.*not found|not registered|does not exist/i.test(detail)) {
        throw new Error(
          "This installed RevelaCode app does not include native downloads. Update to the Android build with the RevelaDownload bridge, then retry."
        );
      }
      throw new Error(detail || "Android could not start the generated file download.");
    }
    return {
      method: "native",
      fileName: safeName,
      downloadId: result?.downloadId ?? null,
    };
  }

  if (typeof document === "undefined") {
    throw new Error("This browser cannot open generated file downloads.");
  }
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
  }
  return { method: "browser", fileName: safeName, url };
}
