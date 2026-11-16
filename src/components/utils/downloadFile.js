/** Download a remote file without leaving the current workspace. */
export async function downloadFile(url, filename = "download") {
  const source = String(url || "").trim();
  if (!/^https?:\/\//i.test(source)) throw new Error("This download link is not valid.");
  const safeName = String(filename || "download").replace(/[\\/:*?"<>|\u0000-\u001F]/g, "-").trim() || "download";
  const pathExtension = (() => {\n    try { return new URL(source).pathname.match(/\\.([a-z0-9]{2,6})$/i)?.[1] || ""; }\n    catch { return ""; }\n  })();\n  let objectUrl = "";
  try {
    const response = await fetch(source, { credentials: "omit" });
    if (!response.ok) throw new Error(`Download failed (HTTP ${response.status}).`);
    const blob = await response.blob();
    if (!blob.size) throw new Error("The downloaded file is empty.");
    objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl; anchor.download = finalName; anchor.rel = "noopener";
    anchor.style.display = "none"; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    return true;
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const anchor = document.createElement("a");
    anchor.href = source; anchor.download = safeName; anchor.rel = "noopener noreferrer"; anchor.target = "_blank";
    anchor.style.display = "none"; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    if (error?.message?.startsWith("Download failed")) throw error;
    return true;
  }
}