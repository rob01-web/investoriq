import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const stages = [
  ["ELITE-02 through ELITE-08 cumulative stack", path.join(here, "full-underwriting-elite-02-08-pipeline-regression.js")],
  ["ELITE-09 Quality Manifest institutional full-document proof", path.join(here, "full-underwriting-quality-manifest-institutional-regression.js")],
];

for (const [label, script] of stages) {
  const result = spawnSync(process.execPath, [script], { cwd: process.cwd(), stdio: "inherit" });
  assert.equal(result.error, undefined, `${label} could not execute: ${result.error?.message || "unknown error"}`);
  assert.equal(result.status, 0, `${label} failed with exit code ${result.status}`);
}

console.log("PASS full-underwriting-elite-02-09-pipeline-regression");
