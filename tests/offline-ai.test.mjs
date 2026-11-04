import test from "node:test";
import assert from "node:assert/strict";
import {
  answerLocally,
  reasonLocally,
} from "../src/ai/v2-free/localIntelligence.js";

test("generic offline requests return a structured reasoning checklist", () => {
  const response = answerLocally("Give me a practical way to improve my work.");

  assert.match(response, /LOCAL REASONING CHECKLIST/);
  assert.match(response, /Request type: general/);
  assert.match(response, /Key terms:/);
  assert.match(response, /improve/);
  assert.match(response, /deterministic on-device rules/);
});

test("reasonLocally handles research, decision, planning, and troubleshooting requests", () => {
  assert.equal(reasonLocally("Why does this happen?").kind, "research");
  assert.equal(reasonLocally("Compare the two options").kind, "decision");
  assert.equal(reasonLocally("Create a project roadmap").kind, "planning");
  assert.equal(reasonLocally("Debug this initialization error").kind, "troubleshooting");
});

test("the troubleshooting fallback gives useful diagnostic steps", () => {
  const response = answerLocally("Help me debug an initialization error.");

  assert.match(response, /TROUBLESHOOTING/);
  assert.match(response, /stack trace/i);
  assert.match(response, /regression test/i);
});

test("the business fallback still performs local CSV arithmetic", () => {
  const response = answerLocally("business revenue and cost\n100,40\n200,80");

  assert.match(response, /revenue 300\.00/i);
  assert.match(response, /costs 120\.00/i);
  assert.match(response, /profit 180\.00/i);
});

test("specialist fallback routes remain available", () => {
  assert.match(answerLocally("Hello"), /RevelaAI Free/);
  assert.match(answerLocally("Teach me this concept"), /Let's break it down/);
  assert.match(answerLocally("Write a caption for my project"), /CREATOR/);
  assert.match(answerLocally("Plan the project launch"), /PROJECT PLAN/);
  assert.match(answerLocally("Help me compose a prayer"), /compose a prayer/i);
  assert.match(answerLocally("How should I study this Bible passage?"), /Faith-study approach/);
});

test("empty and non-string input do not crash the offline response path", () => {
  assert.equal(answerLocally(""), "Tell me what you want to work through.");
  assert.match(answerLocally(null), /Tell me what you want to work through/);
  assert.equal(typeof reasonLocally(null).summary, "string");
});
