import test from "node:test";
import assert from "node:assert/strict";
import { inferWorkspaceCommand, selectWorkspaceCommand } from "../src/ai/workspaceIntent.js";

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
