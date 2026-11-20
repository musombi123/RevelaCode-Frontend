import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

const codeIde = read("src/components/RevelaAICodeIDE.jsx");
const workspacePanel = read("src/components/RevelaAIWorkspacePanel.jsx");
const dashboard = read("src/components/AIAssistantDashboard.jsx");
const inputBar = read("src/components/InputBar.jsx");
const client = read("src/ai/revelaAIClient.js");
const runners = read("src/ide/runners.js");
const jsWorker = read("src/ide/jsWorker.js");
const pythonWorker = read("src/ide/pythonWorker.js");

test("generated code artifacts open directly in the existing RevelaAI workspace IDE", () => {
  assert.match(workspacePanel, /artifact\?\.type === "code"/);
  assert.match(workspacePanel, /artifact\?\.artifact\?\.type === "code"/);
  assert.match(workspacePanel, /<RevelaAICodeIDE/);
  assert.match(workspacePanel, /setTab\(artifact\?\.project \|\| hasEditableCodeIDE \? "ide" : "preview"\)/);
  assert.match(codeIde, /<CodeMirror/);
  assert.match(codeIde, /getEditableArtifact/);
});

test("Code generation tool provides distinct Generate and Debug modes", () => {
  assert.match(inputBar, /"\/code": \{ kind: "code-studio"/);
  assert.match(inputBar, /value:"generate",label:"Generate code"/);
  assert.match(inputBar, /value:"debug",label:"Debug & repair"/);
  assert.match(inputBar, /command === "code" \? \{ mode: activeMode \|\| "generate" \}/);
  assert.match(dashboard, /workspaceCommand === "\/code"/);
  assert.match(dashboard, /task: "code"/);
  assert.match(dashboard, /codeMode === "debug"/);
});

test("IDE supports bounded JS and Python execution, HTML preview and static validation", () => {
  assert.match(codeIde, /runCode\(language, source/);
  assert.match(codeIde, /validateLocalWorkspaceSource/);
  assert.match(codeIde, /language === "html"/);
  assert.match(codeIde, /language === "json"/);
  assert.match(codeIde, /language === "css"/);
  assert.match(codeIde, /sandbox="allow-scripts"/);
  assert.match(runners, /STARTUP_TIMEOUT_MS = 45000/);
  assert.match(runners, /EXECUTION_TIMEOUT_MS = 10000/);
  assert.match(runners, /export function stopCode/);
});

test("runtime errors can create an AI repair proposal and require explicit confirmation", () => {
  assert.match(codeIde, /lastFailure/);
  assert.match(codeIde, /proposeRevelaAIArtifactEdit/);
  assert.match(codeIde, /confirmRevelaAIArtifactEdit/);
  assert.match(codeIde, /Apply as new version/);
  assert.match(codeIde, /Review the replacement before applying it/);
  assert.match(codeIde, /It has not been executed again/);
  assert.match(client, /body: \{ action: "propose", instruction:/);
  assert.match(client, /action: "confirm"/);
  assert.match(client, /proposal_id: String\(proposalId/);
});

test("manual source saves use the existing immutable artifact version API", () => {
  assert.match(codeIde, /saveRevelaAIArtifactSource/);
  assert.match(codeIde, /expectedVersion: Number\(manifest\?\.version/);
  assert.match(codeIde, /kind: "code"/);
  assert.match(codeIde, /onArtifactUpdated\?\.\(updated\)/);
  assert.match(client, /path: "\/api\/artifacts\/" \+ encodeURIComponent\(String\(artifactId \|\| ""\)\) \+ "\/content"/);
});

test("browser code workers have no host shell access and block runtime network APIs", () => {
  assert.match(jsWorker, /Network access is disabled/);
  assert.match(jsWorker, /XMLHttpRequest/);
  assert.match(jsWorker, /WebSocket/);
  assert.match(pythonWorker, /Network access is disabled/);
  assert.match(pythonWorker, /restoreNetworkAccess/);
  assert.match(codeIde, /does not have an in-browser runtime/);
  assert.match(codeIde, /Static validation does not prove that a program works in production/);
});

test("a real run error is passed into the AI repair prompt with its source file", () => {
  assert.match(codeIde, /Observed error output/);
  assert.match(codeIde, /lastFailure\.slice\(0, 5000\)/);
  assert.match(dashboard, /Actual error and console output/);
  assert.match(dashboard, /Current source code/);
  assert.match(dashboard, /Return the complete corrected source file/);
});
