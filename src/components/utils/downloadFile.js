import { Capacitor, registerPlugin } from "@capacitor/core";

const NativeDownloads = registerPlugin("RevelaDownload");

const MIME_TYPES = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  csv: "text/csv",
  zip: "application/zip",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

const safeFileName = (value) =>
  String(value || "download")
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "-")
    .trim() || "download";

const extensionFromUrl = (url) => {
  try {
    return new URL(url).pathname.match(/\.([a-z0-9]{2,6})$/i)?.[1]?.toLowerCase() || "";
  } catch {
    return "";
  }
};

const withExtension = (name, extension) =>
  /\.[a-z0-9]{2,6}$/i.test(name) || !extension ? name : name + "." + extension;

/**
 * Save a user-requested file. Android uses the native DownloadManager so files
 * land in Downloads/RevelaCode; browsers use an independent Blob URL per click.
 */
export async function downloadFile(url, filename = "download") {
  const source = String(url || "").trim();
  if (!/^https?:\/\//i.test(source)) {
    throw new Error("This download link is not valid.");
  }

  const safeName = safeFileName(filename);
  const extension = extensionFromUrl(source);
  const finalName = withExtension(safeName, extension);
  const mimeType = MIME_TYPES[extension] || "application/octet-stream";

  if (Capacitor.isNativePlatform()) {
    if (!/^https:\/\//i.test(source)) {
      throw new Error("Android downloads require a secure HTTPS link.");
    }
    await NativeDownloads.downloadUrl({
      url: source,
      fileName: finalName,
      mimeType,
    });
    return true;
  }

  let objectUrl = "";
  try {
    const response = await fetch(source, { credentials: "omit" });
    if (!response.ok) {
      throw new Error("Download failed (HTTP " + response.status + ").");
    }
    const blob = await response.blob();
    if (!blob.size) {
      throw new Error("The downloaded file is empty.");
    }

    const responseMime = String(response.headers.get("content-type") || blob.type)
      .split(";")[0]
      .toLowerCase();
    const responseExtension = Object.entries(MIME_TYPES).find(([, mime]) => mime === responseMime)?.[0] || "";
    const browserName = withExtension(safeName, extension || responseExtension);

    objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = browserName;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    return true;
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (error?.message?.startsWith("Download failed")) throw error;
    // Cross-origin servers without CORS may still permit a direct browser save.
    const anchor = document.createElement("a");
    anchor.href = source;
    anchor.download = finalName;
    anchor.rel = "noopener noreferrer";
    anchor.target = "_blank";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  }
}
