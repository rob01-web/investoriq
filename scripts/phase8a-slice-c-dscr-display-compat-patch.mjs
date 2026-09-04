import fs from "node:fs";

const target = "api/_lib/full-underwriting-chapter1-elite-renderer.js";
let source = fs.readFileSync(target, "utf8");

const replacements = [
  [
    `snapshotCell("Current DSCR", snapshotMetricValue(contract, "currentDebtDscr"), "Existing debt context"),`,
    `snapshotCell("Current DSCR", snapshotDisplayValue(executiveMetric(contract, "currentDebtDscr")?.value, "ratio_x"), "Existing debt context"),`,
  ],
  [
    `snapshotCell("Proposed DSCR", snapshotMetricValue(contract, "proposedFinancingDscr"), "Stated proposed terms"),`,
    `snapshotCell("Proposed DSCR", snapshotDisplayValue(executiveMetric(contract, "proposedFinancingDscr")?.value, "ratio_x"), "Stated proposed terms"),`,
  ],
  [
    `? \`Proposed financing tightens coverage from \${snapshotMetricValue(contract, "currentDebtDscr")} to \${snapshotMetricValue(contract, "proposedFinancingDscr")}.\``,
    `? \`Proposed financing tightens coverage from \${snapshotDisplayValue(executiveMetric(contract, "currentDebtDscr")?.value, "ratio_x")} to \${snapshotDisplayValue(executiveMetric(contract, "proposedFinancingDscr")?.value, "ratio_x")}.\``,
  ],
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`PHASE8A_SLICE_C_DSCR_DISPLAY_SOURCE_MISSING:${before}`);
  source = source.replace(before, after);
}

fs.writeFileSync(target, source, "utf8");
console.log("phase8a-slice-c-dscr-display-compat-patch: PATCHED");
