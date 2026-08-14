"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/harness");

function withHarness(fn) {
  return () => {
    const h = createHarness();
    try { return fn(h); } finally { h.close(); }
  };
}

test("REGRESSION: alternate answer field used by the question bank is honored", withHarness(h => {
  assert.equal(h.api.accepted("three hundred and sixty six", { a: "366", alts: ["three hundred and sixty six"] }), true);
}));
