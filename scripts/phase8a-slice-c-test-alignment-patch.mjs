import fs from "node:fs";

const filePath = "tests/qa/phase8a-owner-acceptance-authority-smoke.js";
let source = fs.readFileSync(filePath, "utf8");

function replaceExact(before, after) {
  if (!source.includes(before)) {
    throw new Error(`PHASE8A_SLICE_C_TEST_ALIGNMENT_MISSING:${before}`);
  }
  source = source.replace(before, after);
}

replaceExact(
  "assert.match(screening, /Screening Disposition/);",
  "assert.match(screening, /Screening Decision Snapshot/);"
);

fs.writeFileSync(filePath, source, "utf8");
console.log("phase8a-slice-c-test-alignment-patch: PATCHED");
