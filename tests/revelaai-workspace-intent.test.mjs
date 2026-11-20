import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkspaceExportPrompt, inferWorkspaceCommand, inferWorkspaceExport, selectWorkspaceCommand } from "../src/ai/workspaceIntent.js";

test("routes the user's exact natural-language request to the PowerPoint workspace", () => {
  assert.equal(
    inferWorkspaceCommand("Generate power point slides explaining how you use RevelaAI ability"),
    "/deck",
  );
});

test("recognizes common PowerPoint synonyms and file requests", () => {
  for (const prompt of [
    "Make me a PowerPoint about RevelaAI.",
    "Create a PPTX for our product demonstration.",
    "Build a slide deck explaining our workflow.",
    "Prepare a presentation for the leadership team.",
    "Generate 10 slides showing how to use the platform.",
  ]) {
    assert.equal(inferWorkspaceCommand(prompt), "/deck", prompt);
  }
});

test("does not route questions about PowerPoint to file generation", () => {
  assert.equal(inferWorkspaceCommand("What is Microsoft PowerPoint?"), null);
});

test("keeps an explicit Word or PDF deliverable on the document path", () => {
  assert.equal(
    inferWorkspaceCommand("Create a Word document explaining how to prepare a presentation."),
    "/doc",
  );
  assert.equal(
    inferWorkspaceCommand("Generate a PDF report about good slide design."),
    "/doc",
  );
});

test("natural-language artifact intent overrides an unrelated selected shortcut", () => {
  const commands = new Set(["/doc", "/deck", "/sheet", "/search"]);
  assert.equal(selectWorkspaceCommand("/search", "/deck", commands), "/deck");
  assert.equal(selectWorkspaceCommand("/deck", null, commands), "/deck");
  assert.equal(selectWorkspaceCommand("/search", null, commands), "/search");
});



test("routes every registered Office and text extension to the matching exporter", () => {
  const cases = [
    ["Create a document as .docx", "/doc"],
    ["Export this report as .pdf", "/doc"],
    ["Generate slides as .pptx", "/deck"],
    ["Create an Excel workbook as .xlsx", "/sheet"],
    ["Create a data export as .csv", "/sheet"],
    ["Create a Markdown guide as .md", "/doc"],
    ["Create a plain text file as .txt", "/doc"],
  ];
  for (const [prompt, command] of cases) {
    assert.equal(inferWorkspaceCommand(prompt), command, prompt);
  }
});

test("preserves the exact Office or text output format in the export descriptor", () => {
  const cases = [
    ["Create a document as .docx", "word"],
    ["Export this report as .pdf", "pdf"],
    ["Generate slides as .pptx", "powerpoint"],
    ["Create an Excel workbook as .xlsx", "spreadsheet"],
    ["Create a data export as .csv", "csv"],
    ["Create a Markdown guide as .md", "markdown"],
    ["Create a plain text file as .txt", "text"],
  ];
  for (const [prompt, format] of cases) {
    assert.equal(inferWorkspaceExport(prompt)?.format, format, prompt);
  }
});

test("routes registered source-code extensions to code generation with the requested language", () => {
  const cases = [
    [".py", "python"], [".js", "javascript"], [".jsx", "jsx"], [".ts", "typescript"],
    [".tsx", "tsx"], [".html", "html"], [".css", "css"], [".json", "json"],
    [".sql", "sql"], [".sh", "bash"], [".go", "go"], [".rs", "rust"],
    [".java", "java"], [".c", "c"], [".cpp", "cpp"], [".cs", "csharp"],
    [".php", "php"], [".rb", "ruby"], [".swift", "swift"], [".kt", "kotlin"],
    [".xml", "xml"], [".yaml", "yaml"], [".yml", "yml"], [".toml", "toml"], [".ini", "ini"],
  ];
  for (const [extension, language] of cases) {
    const request = inferWorkspaceExport("Generate source code as " + extension);
    assert.equal(request?.command, "/code", extension);
    assert.equal(request?.language, language, extension);
  }
});

test("routes image exports to Image Studio with the requested format", () => {
  for (const extension of ["png", "jpg", "jpeg", "svg"]) {
    const request = inferWorkspaceExport("Generate a poster as ." + extension);
    assert.equal(request?.command, "/image", extension);
    assert.equal(request?.outputFormat, extension === "jpeg" ? "jpg" : extension, extension);
  }
  const pdfImage = inferWorkspaceExport("Create a promotional poster as .pdf");
  assert.equal(pdfImage?.command, "/image");
  assert.equal(pdfImage?.outputFormat, "pdf");
});

test("unsupported legacy or media formats are surfaced rather than silently substituted", () => {
  for (const extension of ["doc", "xls", "ppt", "odt", "ods", "odp", "rtf", "gif", "mp4", "webp", "zip"]) {
    const request = inferWorkspaceExport("Export this file as ." + extension);
    assert.equal(request?.command, "/export-unsupported", extension);
    assert.match(request?.message || "", /will not substitute/i);
  }
});

test("ordinary topic mentions do not trigger an export tool", () => {
  assert.equal(inferWorkspaceCommand("Explain how CSV data is structured."), null);
  assert.equal(inferWorkspaceCommand("What is a PDF document?"), null);
});



test("conversion requests use the destination extension, not the source file extension", () => {
  const request = inferWorkspaceExport("Convert this DOCX report to PDF.");
  assert.equal(request?.command, "/doc");
  assert.equal(request?.format, "pdf");
  assert.equal(request?.extension, "pdf");
});

test("a bare registered extension is routed to its matching tool", () => {
  const request = inferWorkspaceExport("Generate .py");
  assert.equal(request?.command, "/code");
  assert.equal(request?.language, "python");
});

test("a website domain is not mistaken for an export extension", () => {
  assert.equal(inferWorkspaceExport("Create a website for revelacode.co.ke"), null);
});



test("referential exports include the previous assistant response as source content", () => {
  const result = buildWorkspaceExportPrompt(
    "Convert this to PDF.",
    "RevelaAI is the intelligence layer of RevelaCode. It routes requests to tools and returns verified artifacts.",
  );
  assert.match(result, /User export instruction:/);
  assert.match(result, /Create the requested file/);
  assert.match(result, /RevelaAI is the intelligence layer/);
});

test("new export requests do not absorb unrelated prior conversation content", () => {
  const result = buildWorkspaceExportPrompt(
    "Create a new PDF about export workflows.",
    "An earlier answer about agriculture.",
  );
  assert.equal(result, "Create a new PDF about export workflows.");
});

test("referential export source is bounded to the workspace prompt limit", () => {
  const result = buildWorkspaceExportPrompt("Export this as .txt", "A".repeat(20000));
  assert.ok(result.length <= 10300);
});
