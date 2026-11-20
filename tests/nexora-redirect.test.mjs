import test from "node:test";
import assert from "node:assert/strict";
import { createNexoraRedirectTarget } from "../src/utils/nexoraRedirect.mjs";

test("redirects legacy NEXORA entry to the standalone host", () => {
  assert.equal(
    createNexoraRedirectTarget({ pathname: "/dev_nexora", search: "?source=menu", hash: "#studio" }),
    "https://nexora.revelacode.co.ke/?source=menu#studio",
  );
});

test("redirects nested NEXORA paths to the standalone app root", () => {
  assert.equal(
    createNexoraRedirectTarget({ pathname: "/dev_nexora/projects/1" }),
    "https://nexora.revelacode.co.ke/",
  );
});

test("does not affect ordinary RevelaCode routes", () => {
  assert.equal(createNexoraRedirectTarget({ pathname: "/dev_elimu" }), null);
});
