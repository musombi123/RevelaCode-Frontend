import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/study/studyMaterialCache.js", import.meta.url),
  "utf8",
);

test("test-title punctuation regex is not mistaken for a Tailwind arbitrary property", () => {
  assert.ok(source.includes(String.raw`[\x2d:#_]`));
  assert.equal(source.includes("[-:#_]"), false);

  const punctuation = /[\x2d:#_]/;
  for (const character of ["-", ":", "#", "_"]) {
    assert.equal(punctuation.test(character), true, `Expected regex to keep matching ${character}`);
  }
  assert.equal(punctuation.test("a"), false);
});
