import fs from "node:fs";

const target = "tests/qa/phase7-decision-support-smoke.js";
let source = fs.readFileSync(target, "utf8");

const before = `const polishedUnderwriting = polishFullUnderwritingFinalHtml(underwritingHtml, { reportMode: "full_underwriting" });\nassert.match(polishedUnderwriting, /Evidence Conviction Matrix/);\nassert.match(polishedUnderwriting, /What Changes the Decision/);`;

const after = `const polishedUnderwriting = polishFullUnderwritingFinalHtml(underwritingHtml, { reportMode: "full_underwriting" });\nassert.match(polishedUnderwriting, /Decision Evidence Map/);\nassert.doesNotMatch(polishedUnderwriting, /Evidence Conviction Matrix/);\nassert.match(polishedUnderwriting, /What Changes the Decision/);`;

if (!source.includes(before)) {
  throw new Error("PHASE8A_SLICE_D_DECISION_SUPPORT_EXPECTATION_MISSING");
}

source = source.replace(before, after);
fs.writeFileSync(target, source, "utf8");
console.log("phase8a-slice-d-test-alignment-patch: PATCHED");
