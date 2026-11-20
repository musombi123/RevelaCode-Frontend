const CREATION_VERB = /\b(?:create|make|prepare|generate|produce|build|draft|write|design|export|convert|turn|save)\b/i;
const PRESENTATION_REQUEST = /\b(?:power\s*point|pptx|presentation(?:s)?|slide\s*deck|slides?)\b/i;
const DOCUMENT_REQUEST = /\b(?:document|documents|pdf|pdfs|proposal|introduction|letter|memo|report|submission|letterhead|word)\b/i;
const IMAGE_REQUEST = /\b(?:image|picture|photo|graphic|illustration|poster|flyer|leaflet|invitation|logo|banner|thumbnail|diagram|chart|visual|artwork)\b/i;
const DATA_REQUEST = /\b(?:spreadsheet|workbook|excel|xlsx|csv|comma[- ]separated)\b/i;

const EXTENSION_OUTPUTS = {
  pptx: { command: "/deck", format: "powerpoint" },
  docx: { command: "/doc", format: "word" },
  pdf: { command: "/doc", format: "pdf" },
  xlsx: { command: "/sheet", format: "spreadsheet" },
  csv: { command: "/sheet", format: "csv" },
  md: { command: "/doc", format: "markdown" },
  markdown: { command: "/doc", format: "markdown" },
  txt: { command: "/doc", format: "text" },
  png: { command: "/image", outputFormat: "png" },
  jpg: { command: "/image", outputFormat: "jpg" },
  jpeg: { command: "/image", outputFormat: "jpg" },
  svg: { command: "/image", outputFormat: "svg" },
  py: { command: "/code", language: "python" },
  js: { command: "/code", language: "javascript" },
  jsx: { command: "/code", language: "jsx" },
  ts: { command: "/code", language: "typescript" },
  tsx: { command: "/code", language: "tsx" },
  html: { command: "/code", language: "html" },
  css: { command: "/code", language: "css" },
  json: { command: "/code", language: "json" },
  sql: { command: "/code", language: "sql" },
  sh: { command: "/code", language: "bash" },
  go: { command: "/code", language: "go" },
  rs: { command: "/code", language: "rust" },
  java: { command: "/code", language: "java" },
  c: { command: "/code", language: "c" },
  cpp: { command: "/code", language: "cpp" },
  cs: { command: "/code", language: "csharp" },
  php: { command: "/code", language: "php" },
  rb: { command: "/code", language: "ruby" },
  swift: { command: "/code", language: "swift" },
  kt: { command: "/code", language: "kotlin" },
};

const UNSUPPORTED_EXTENSIONS = new Set([
  "doc", "xls", "ppt", "odt", "ods", "odp", "rtf", "gif", "mp4", "zip", "7z",
]);

function fileExtensionRequest(text) {
  const value = String(text || "");
  const dotted = value.match(/(?:\b(?:as|to|into|format|extension|file|export|save)\b[\s\S]{0,45}?)\.([a-z0-9]{1,8})\b/i)
    || value.match(/\b\.([a-z0-9]{1,8})\b/i);
  if (dotted) return String(dotted[1] || "").toLowerCase();
  const named = value.match(/\b(pptx|docx|xlsx|csv|markdown|md|txt|pdf|png|jpe?g|svg|jsx|tsx|typescript|javascript|python|json|html|css|sql|bash|shell|golang|rust|java|cpp|csharp|php|ruby|swift|kotlin|odt|ods|odp|rtf|gif|mp4|zip)\b/i);
  return named ? String(named[1]).toLowerCase() : "";
}

/**
 * Resolve the exact export requested by a user before sending the turn to chat.
 * A supported extension carries its destination format into the workspace API.
 * An unsupported extension is surfaced as an explicit error, never replaced
 * with a different file type or a text-only explanation.
 */
export function inferWorkspaceExport(prompt, attachedFile = null) {
  const text = String(prompt || "").trim();
  if (!text || !CREATION_VERB.test(text)) return null;

  const extension = fileExtensionRequest(text);
  const imageAttached = Boolean(
    attachedFile?.type?.startsWith("image/") || /\.(?:svg|png|jpe?g)$/i.test(attachedFile?.name || "")
  );
  const imageContext = IMAGE_REQUEST.test(text) || imageAttached;

  if (extension) {
    if (UNSUPPORTED_EXTENSIONS.has(extension)) {
      return {
        command: "/export-unsupported",
        extension,
        message: "RevelaAI does not currently generate ." + extension + " files. It will not substitute another extension. Supported exports include DOCX, PDF, PPTX, XLSX, CSV, TXT, Markdown, PNG, JPG, SVG and the registered source-code formats.",
      };
    }
    const mapped = EXTENSION_OUTPUTS[extension];
    if (mapped) {
      if (["png", "jpg", "jpeg", "svg"].includes(extension) || (extension === "pdf" && imageContext)) {
        return { ...mapped, extension, command: "/image" };
      }
      return { ...mapped, extension };
    }
  }

  if (PRESENTATION_REQUEST.test(text)) return { command: "/deck", format: "powerpoint", extension: "pptx" };
  if (/\b(?:comma[- ]separated values|csv export|export csv|as csv)\b/i.test(text)) {
    return { command: "/sheet", format: "csv", extension: "csv" };
  }
  if (/\b(?:excel|spreadsheet|workbook|xlsx)\b/i.test(text)) {
    return { command: "/sheet", format: "spreadsheet", extension: "xlsx" };
  }
  if (/\b(?:plain text|text file|txt file)\b/i.test(text)) {
    return { command: "/doc", format: "text", extension: "txt" };
  }
  if (/\b(?:markdown|md file)\b/i.test(text)) {
    return { command: "/doc", format: "markdown", extension: "md" };
  }
  if (/\b(?:pdf|portable document format)\b/i.test(text) && !imageContext) {
    return { command: "/doc", format: "pdf", extension: "pdf" };
  }
  if (/\b(?:word document|docx|editable document)\b/i.test(text)) {
    return { command: "/doc", format: "word", extension: "docx" };
  }
  if (IMAGE_REQUEST.test(text) && !attachedFile) {
    return { command: "/image", outputFormat: "png", extension: "png" };
  }
  if (/\b(?:source code|python script|javascript|typescript|sql query|program|function|class)\b/i.test(text)) {
    const language = text.match(/\b(python|javascript|typescript|tsx|jsx|html|css|json|sql|bash|go|rust|java|c\+\+|c#|php|ruby|swift|kotlin)\b/i)?.[1]?.toLowerCase() || "";
    return { command: "/code", language, extension: language || "txt" };
  }
  if (/\b(?:responsive web|website prototype|web app interface|ui prototype|dashboard interface|html interface)\b/i.test(text)) {
    return { command: "/ui", language: "html", extension: "html" };
  }
  if (DATA_REQUEST.test(text)) return { command: "/sheet", format: "spreadsheet", extension: "xlsx" };
  if (DOCUMENT_REQUEST.test(text)) return { command: "/doc", format: "word", extension: "docx" };
  return null;
}

export function inferWorkspaceCommand(prompt, attachedFile = null) {
  return inferWorkspaceExport(prompt, attachedFile)?.command || null;
}

export function selectWorkspaceCommand(selectedToolCommand, inferredCommand, validCommands) {
  const selected = String(selectedToolCommand || "").trim().toLowerCase();
  const inferred = String(inferredCommand || "").trim().toLowerCase();
  const valid = validCommands instanceof Set ? validCommands : new Set(validCommands || []);
  if (inferred && valid.has(inferred)) return inferred;
  if (selected && valid.has(selected)) return selected;
  return selected || inferred || null;
}
