const CREATION_VERB = /\b(?:create|make|prepare|generate|produce|build|draft|write|design|export|convert|turn|save|need|want|require|download|provide|deliver|attach|give)\b/i;
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
  xml: { command: "/code", language: "xml" },
  yaml: { command: "/code", language: "yaml" },
  yml: { command: "/code", language: "yml" },
  toml: { command: "/code", language: "toml" },
  ini: { command: "/code", language: "ini" },
};

const UNSUPPORTED_EXTENSIONS = new Set([
  "doc", "xls", "ppt", "odt", "ods", "odp", "rtf", "gif", "mp4", "webp", "zip", "7z",
]);

function fileExtensionRequest(text) {
  const value = String(text || "");
  const target = value.match(
    /\b(?:as|to|into|in|format|export|save|download)\s+(?:(?:a|an|the)\s+)?(?:file\s+as\s+)?(pptx|docx|xlsx|csv|markdown|md|txt|pdf|png|jpe?g|svg|jsx|tsx|typescript|javascript|python|json|html|css|sql|bash|shell|golang|rust|java|cpp|csharp|php|ruby|swift|kotlin|xml|yaml|yml|toml|ini|doc|xls|ppt|odt|ods|odp|rtf|gif|mp4|webp|zip|7z)\b/i
  );
  if (target) {
    const raw = String(target[1] || "").toLowerCase();
    return ({
      markdown: "md", jpeg: "jpg", typescript: "ts", javascript: "js",
      python: "py", golang: "go", rust: "rs", csharp: "cs",
      bash: "sh", shell: "sh", ruby: "rb", kotlin: "kt",
    })[raw] || raw;
  }
  const dotted = value.match(
    /\b(?:as|to|into|format|extension|file|export|save|download)\s+(?:(?:a|an|the)\s+)?(?:[\w-]+\s+){0,2}\.([a-z0-9]{1,8})\b/i
  );
  if (dotted) return String(dotted[1] || "").toLowerCase();

  const direct = value.match(/\.([a-z0-9]{1,8})\b/i);
  const directExtension = String(direct?.[1] || "").toLowerCase();
  if (directExtension && (
    Object.prototype.hasOwnProperty.call(EXTENSION_OUTPUTS, directExtension)
    || UNSUPPORTED_EXTENSIONS.has(directExtension)
  )) return directExtension;

  const named = value.match(
    /\b(pptx|docx|xlsx|csv|markdown|md|txt|pdf|png|jpe?g|svg|jsx|tsx|typescript|javascript|python|json|html|css|sql|bash|shell|golang|rust|java|cpp|csharp|php|ruby|swift|kotlin|xml|yaml|yml|toml|ini|doc|xls|ppt|odt|ods|odp|rtf|gif|mp4|zip)\b/i
  );
  if (!named) return "";

  const rawToken = String(named[1] || "").toLowerCase();
  const token = ({
    markdown: "md", jpeg: "jpg", typescript: "ts", javascript: "js",
    python: "py", golang: "go", rust: "rs", csharp: "cs",
    bash: "sh", shell: "sh", ruby: "rb", kotlin: "kt",
  })[rawToken] || rawToken;
  const before = value.slice(Math.max(0, named.index - 28), named.index);
  const after = value.slice(named.index + named[0].length, named.index + named[0].length + 24);
  const exportCue = /\b(?:as|to|into|format|extension|export|save|download)\s*$/i.test(before)
    || /^\s*(?:file|format|export|output|document|workbook|deck)\b/i.test(after)
    || /^(?:pptx|docx|xlsx|csv|pdf|markdown|md|txt)$/i.test(token)
    || UNSUPPORTED_EXTENSIONS.has(token);
  return exportCue ? token : "";
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
      if (extension === "html" && /\b(?:ui|interface|website|prototype|dashboard|web app)\b/i.test(text)) {
        return { ...mapped, extension, command: "/ui" };
      }
      if (["png", "jpg", "jpeg", "svg"].includes(extension) || (extension === "pdf" && imageContext)) {
        return { ...mapped, extension, command: "/image", outputFormat: extension === "pdf" ? "pdf" : mapped.outputFormat };
      }
      return { ...mapped, extension };
    }
    return {
      command: "/export-unsupported",
      extension,
      message: "RevelaAI does not currently generate ." + extension + " files. It will not substitute another extension. Supported exports include DOCX, PDF, PPTX, XLSX, CSV, TXT, Markdown, PNG, JPG, SVG and the registered source-code formats.",
    };
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


/**
 * Resolve referential export requests against the latest available assistant
 * text. Source text is bounded and explicitly marked as content, not commands.
 */
export function buildWorkspaceExportPrompt(prompt, previousAssistantText) {
  const instruction = String(prompt || "").trim();
  const source = String(previousAssistantText || "").trim();
  const refersToPrior = /\b(?:this|that|it|above|previous|last|same|the answer|the response|the content)\b/i.test(instruction);
  const asksToExport = /\b(?:export|convert|save|download|turn|format|make|create|produce)\b/i.test(instruction);
  if (!instruction || !source || !refersToPrior || !asksToExport) return instruction;

  const instructionLimit = Math.min(instruction.length, 2500);
  const boundedInstruction = instruction.slice(0, instructionLimit);
  const sourceLimit = Math.max(0, 10000 - boundedInstruction.length);
  const boundedSource = source.slice(0, sourceLimit);
  return [
    "User export instruction:",
    boundedInstruction,
    "",
    "Create the requested file using the following existing conversation content as the source. Preserve its meaning, named entities, structure and factual details. Do not answer with a description of how to create the file.",
    "",
    "<conversation_source>",
    boundedSource,
    "</conversation_source>",
  ].join("\n");
}
