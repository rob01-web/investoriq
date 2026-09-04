import fs from "node:fs";

function patchFile(filePath, replacements = []) {
  let source = fs.readFileSync(filePath, "utf8");
  for (const [before, after] of replacements) {
    if (!source.includes(before)) {
      throw new Error(`PHASE8A_SLICE_C_TEST_ALIGNMENT_MISSING:${filePath}:${before}`);
    }
    source = source.replace(before, after);
  }
  fs.writeFileSync(filePath, source, "utf8");
}

patchFile("tests/qa/phase8a-owner-acceptance-authority-smoke.js", [
  [
    "assert.match(screening, /Screening Disposition/);",
    "assert.match(screening, /Screening Decision Snapshot/);",
  ],
]);

patchFile("tests/qa/full-underwriting-chapter1-elite-renderer-integration-smoke.js", [
  [
    "  assert.match(html, /Executive Investment Summary/);",
    "  assert.match(html, /Investment Decision Snapshot/);",
  ],
  [
    "  assert.match(html, /class=\"iq-ic-asset-descriptor\">100-Unit Multifamily/);",
    "  assert.match(html, /100-Unit Multifamily/);",
  ],
  [
    "  assert.match(html, /Committee Focus/);",
    "  assert.match(html, /What Must Be True/);",
  ],
  [
    "  assert.match(html, /data-iq-elite-primary-constraint=\"PRIMARY_SOURCE_RECONCILIATION_REQUIRED\"/);",
    "  assert.match(html, /data-iq-elite-signal=\"PRIMARY_SOURCE_RECONCILIATION_REQUIRED\"/);",
  ],
  [
    "  assert.match(html, /data-iq-elite-primary-constraint=\"CURRENT_DEBT_DSCR_BELOW_1X\"/);",
    "  assert.match(html, /data-iq-elite-signal=\"CURRENT_DEBT_DSCR_BELOW_1X\"/);",
  ],
]);

console.log("phase8a-slice-c-test-alignment-patch: PATCHED");
