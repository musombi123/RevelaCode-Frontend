// Automatically select a practical download format from the user's request and the answer.
// Supported outputs: PDF, Markdown, TXT, CSV, JSON, and source code.
import { downloadAsPdf } from "@/components/utils/exportPdf";

const slug = (value = "revelaai-output") =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 56) || "revelaai-output";

const LANG_EXTENSIONS = {
  javascript: "js", js: "js", jsx: "jsx", typescript: "ts", ts: "ts", tsx: "tsx",
  python: "py", py: "py", bash: "sh", shell: "sh", powershell: "ps1",
  html: "html", css: "css", json: "json", sql: "sql", java: "java",
  c: "c", "c++": "cpp", cpp: "cpp", csharp: "cs", "c#": "cs",
  go: "go", rust: "rs", ruby: "rb", php: "php", yaml: "yaml", yml: "yaml",
  xml: "xml", markdown: "md", md: "md", plaintext: "txt", text: "txt",
};

const extractFence = (text) => {
  const match = String(text || "").match(/```([\w+#.-]*)[^\n]*\n([\s\S]*?)\n```/);
  return match ? { language: (match[1] || "").toLowerCase(), code: match[2] } : null;
};

const parseMarkdownTable = (text) => {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim());
  const tableLines = lines.filter((line) => /^\|.*\|$/.test(line));
  if (!tableLines.length) return null;
  const rows = tableLines
    .filter((line) => !/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line))
    .map((line) => line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()));
  if (!rows.length) return null;
  const width = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => Array.from({ length: width }, (_, index) => row[index] || ""));
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

export function inferOutputFormat(prompt = "", answer = "") {
  const request = String(prompt || "").toLowerCase();
  const body = String(answer || "").trim();
  const fence = extractFence(body);

  const explicitExtension = request.match(/\.(pdf|md|markdown|txt|csv|json|py|js|jsx|ts|tsx|html|css|sql|java|cpp|c|go|rs|php|rb|sh|ps1|yaml|yml|xml)\b/);
  if (explicitExtension) {
    const extension = explicitExtension[1] === "markdown" ? "md" : explicitExtension[1];
    return { extension, label: extension.toUpperCase(), reason: "requested file extension" };
  }
  if (/\b(excel|spreadsheet|csv|comma[- ]separated|downloadable table)\b/.test(request)) {
    return { extension: "csv", label: "CSV spreadsheet", reason: "spreadsheet/data request" };
  }
  if (/\b(json|structured data|api payload)\b/.test(request)) {
    return { extension: "json", label: "JSON", reason: "structured-data request" };
  }
  if (/\b(powerpoint|presentation|slides|pptx)\b/.test(request)) {
    return { extension: "pdf", label: "PDF", reason: "portable export of presentation content; PPTX generation is not enabled" };
  }
  if (/\b(word document|docx|editable word)\b/.test(request)) {
    return { extension: "md", label: "Markdown", reason: "editable text fallback; DOCX generation is not enabled" };
  }
  if (fence && (/\b(code|script|program|source file|implement|write a function|build a component)\b/.test(request) || fence.language)) {
    const extension = LANG_EXTENSIONS[fence.language] || "txt";
    return { extension, label: extension.toUpperCase() + " source", reason: "code detected in the answer" };
  }
  if (/\b(markdown|readme)\b/.test(request)) {
    return { extension: "md", label: "Markdown", reason: "Markdown requested" };
  }
  if (/\b(plain text|text file)\b/.test(request)) {
    return { extension: "txt", label: "TXT", reason: "plain-text requested" };
  }
  if (/\b(report|executive summary|proposal|business plan|formal document|brief|analysis document|pdf)\b/.test(request)) {
    return { extension: "pdf", label: "PDF", reason: "document/report request" };
  }
  if (fence) {
    const extension = LANG_EXTENSIONS[fence.language] || "txt";
    return { extension, label: extension.toUpperCase(), reason: "code block detected" };
  }
  if (parseMarkdownTable(body)) {
    return { extension: "csv", label: "CSV", reason: "tabular answer detected" };
  }
  return { extension: "pdf", label: "PDF", reason: "portable default" };
}

export async function downloadSmartOutput({ prompt = "", answer = "" } = {}) {
  const text = String(answer || "").trim();
  if (!text) throw new Error("There is no answer content to export.");

  const format = inferOutputFormat(prompt, text);
  const filename = slug(
    String(prompt || "")
      .replace(/\b(create|make|generate|export|download|write|build|please|for me)\b/gi, "")
      .trim()
      .slice(0, 70) || text.match(/^#\s+(.+)$/m)?.[1] || "revelaai-output"
  );

  if (format.extension === "pdf") {
    await downloadAsPdf(text, { filename });
    return format;
  }

  let output = text;
  let mime = "text/plain;charset=utf-8";
  const fence = extractFence(text);
  if (format.extension === "csv") {
    const rows = parseMarkdownTable(text);
    if (rows) output = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
    else if (fence?.language === "csv") output = fence.code;
    mime = "text/csv;charset=utf-8";
  } else if (format.extension === "json") {
    const candidate = fence?.language === "json" ? fence.code : text;
    try { output = JSON.stringify(JSON.parse(candidate), null, 2); }
    catch { output = candidate; }
    mime = "application/json;charset=utf-8";
  } else if (LANG_EXTENSIONS[format.extension] && fence) {
    output = fence.code;
  } else if (format.extension === "md") {
    mime = "text/markdown;charset=utf-8";
  }

  const blob = new Blob(["\uFEFF", output], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.${format.extension}`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return format;
}
