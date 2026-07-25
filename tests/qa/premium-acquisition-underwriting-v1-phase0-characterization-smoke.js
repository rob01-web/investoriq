import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "../..");

const protectedSmokes = [
  {
    file: "tests/qa/screening-report-sealed-lane-authority-smoke.js",
    marker: "screening-report-sealed-lane-authority-smoke: ok",
    protects: "Screening sealed-lane isolation",
  },
  {
    file: "tests/qa/source-truth-constitutional-matrix-smoke.js",
    marker: "source-truth constitutional matrix smoke PASS",
    protects: "canonical Source Truth constitutional behavior",
  },
  {
    file: "tests/qa/acquisition-memo-current-debt-role-reconciliation-smoke.js",
    marker: "acquisition-memo current debt role reconciliation smoke PASS",
    protects: "current-debt role separation and reconciliation",
  },
  {
    file: "tests/qa/retest29-publish-or-collapse-regression-smoke.js",
    marker: "RETEST 29 publish-or-collapse regression smoke PASS",
    protects: "canonical Publish-or-Collapse and delivery behavior",
  },
  {
    file: "tests/qa/source-report-coverage-qa-smoke.js",
    marker: "source-report-coverage-qa smoke PASS",
    protects: "source-report coverage signals and routing",
  },
  {
    file: "tests/qa/p0c-final-pdf-publication-quality-boss-smoke.js",
    marker: "P0-C final PDF Publication Quality Boss smoke PASS",
    protects: "Final PDF Boss certification rules",
  },
  {
    file: "tests/qa/gate10v-elite-underwriting-report-smoke.js",
    marker: "Gate 10V elite underwriting report smoke PASS",
    protects: "current Underwriting customer surface",
  },
  {
    file: "tests/qa/p0d-retest24-permanent-regression-replay-smoke.js",
    marker: "P0-D RETEST 24 permanent regression replay smoke PASS",
    protects: "permanent end-to-end Underwriting replay",
  },
];

for (const smoke of protectedSmokes) {
  const childEnvironment = {
    ...process.env,
    PREMIUM_ACQUISITION_UNDERWRITING_V1: "false",
  };
  const result = spawnSync(process.execPath, [smoke.file], {
    cwd: repositoryRoot,
    env: childEnvironment,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });

  assert.equal(
    result.status,
    0,
    [
      `${smoke.protects} failed with Premium Acquisition Underwriting V1 disabled.`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join("\n"),
  );
  assert.match(
    result.stdout,
    new RegExp(smoke.marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `${smoke.protects} did not emit its permanent PASS marker.`,
  );
}

console.log("Premium Acquisition Underwriting V1 Phase 0 characterization smoke PASS");
