/** Download a remote file without leaving the current workspace. */
export async function downloadFile(url, filename = "download") {
  const source = String(url || "").trim();
  if (!/^https?:\/\//i.test(source)) {
    throw new Error("This download link is not valid.");
  }

  const safeName = String(filename || "download")
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "-")
    .trim() || "download";
  let pathExtension = "";
  try {
    pathExtension = new URL(source).pathname.match(/\.([a-z0-9]{2,6})$/i)?.[1] || "";
  } catch {
    // The URL has already passed the HTTP(S) scheme check.
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

    const mimeType = String(response.headers.get("content-type") || blob.type)
      .split(";")[0]
      .toLowerCase();
    const mimeExtension = ({
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "video/mp4": "mp4",
      "video/webm": "webm",
      "text/csv": "csv",
      "application/zip": "zip",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    })[mimeType];
    const extension = pathExtension || mimeExtension || "";
    const finalName = /\.[a-z0-9]{2,6}$/i.test(safeName) || !extension
      ? safeName
      : safeName + "." + extension;

    objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = finalName;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    return true;
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const fallbackName = /\.[a-z0-9]{2,6}$/i.test(safeName) || !pathExtension
      ? safeName
      : safeName + "." + pathExtension;
    const anchor = document.createElement("a");
    anchor.href = source;
    anchor.download = fallbackName;
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    if (error?.message?.startsWith("Download failed")) throw error;
    return true;
  }
}