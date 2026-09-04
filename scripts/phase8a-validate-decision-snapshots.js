import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const artifactDir = path.resolve(process.env.PHASE8_ARTIFACT_DIR || "phase8a-artifacts");
const screeningPath = path.join(artifactDir, "phase7-screening-harbourstone.html");
const underwritingPath = path.join(artifactDir, "phase7-underwriting-stonebridge.html");

for (const filePath of [screeningPath, underwritingPath]) {
  assert.equal(fs.existsSync(filePath), true, `Missing artifact: ${filePath}`);
}

const screening = fs.readFileSync(screeningPath, "utf8");
const underwriting = fs.readFileSync(underwritingPath, "utf8");

assert.match(screening, /Screening Decision Snapshot/);
assert.match(screening, /data-iq-disposition="hold"/);
assert.match(screening, />HOLD</);
assert.match(screening, /LIGHT VALUE-ADD CANDIDATE/);
assert.match(screening, /48/);
assert.match(screening, /95\.8%/);
assert.match(screening, /\$650,000/);
assert.match(screening, /59\.1%/);
assert.match(screening, /40\.9%/);
assert.match(screening, /24\.3%/);
assert.match(screening, /71\.5 pp/);
assert.match(screening, /\$1,036,800/);
assert.match(screening, /\$1,137,600/);
assert.match(screening, /\$100,800 \/ 9\.7%/);
assert.match(screening, /-44\.0%/);
if (/data-iq-phase8b="cross-product-publication-system-v1"/.test(screening)) {
  assert.match(screening, /Screening Thesis/);
  assert.match(screening, /What Can Stop Advancement/);
  assert.match(screening, /What Must Be True to Advance/);
} else {
  assert.match(screening, /Why It May Work/);
  assert.match(screening, /What Can Kill or Hold It/);
  assert.match(screening, /Next Action/);
}
assert.match(screening, /Operating Strength/);
assert.match(screening, /Rent Position/);
assert.match(screening, /Source Consistency/);
assert.match(screening, /Operating Cushion/);
assert.match(screening, /Diligence Burden/);
assert.match(screening, /Underwriting Readiness/);
assert.match(screening, /@page iq-body/);
assert.match(screening, /-prince-bookmark-level:1/);

assert.match(underwriting, /Investment Decision Snapshot/);
assert.match(underwriting, /Current Decision State/);
assert.match(underwriting, /RECONCILIATION REQUIRED/);
assert.match(underwriting, /Strategy Fit/);
assert.match(underwriting, /LIGHT VALUE-ADD HOLD/);
assert.match(underwriting, /\$13,500,000/);
assert.match(underwriting, /\$210,938/);
assert.match(underwriting, /\$945,000/);
assert.match(underwriting, /93\.8%/);
assert.match(underwriting, /7\.0%/);
assert.match(underwriting, /\$14,200,000/);
assert.match(underwriting, /\$700,000 vs purchase price/);
assert.match(underwriting, /\$9,450,000/);
assert.match(underwriting, /70\.0%/);
assert.match(underwriting, /2\.01x/);
assert.match(underwriting, /1\.40x/);
assert.match(underwriting, /10\.0%/);
assert.match(underwriting, /\$285,600/);
assert.match(underwriting, /19\.9%/);
assert.match(underwriting, /\$1,280,000/);
assert.match(underwriting, /38 of 64 units/);
assert.match(underwriting, /59\.4%/);
assert.match(underwriting, /\$124,200/);
assert.match(underwriting, /What Can Kill or Reprice It/);
assert.match(underwriting, /What Must Be True/);
assert.match(underwriting, /Decision first\. Facts before prose\./);
assert.match(underwriting, /section\[data-iq-elite-section="executiveInvestmentSummary"\] \{ page:iq-decision/);

console.log("phase8a-validate-decision-snapshots: PASS");
