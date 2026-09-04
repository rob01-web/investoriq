import fs from "node:fs";

const target = "scripts/phase7-generate-visual-artifacts.js";
let source = fs.readFileSync(target, "utf8");

const before = `  if (!/Evidence Conviction Matrix/i.test(html)) {\n    console.error(\`PHASE7_ARTIFACT_HEADING_DIAGNOSTIC:\${label}:\${JSON.stringify(collectArtifactHeadings(html))}\`);\n    throw new Error(\`PHASE7_EVIDENCE_MATRIX_MISSING:\${label}\`);\n  }`;

const after = `  const phase8aOwnerAcceptance = /data-iq-phase8a="owner-acceptance-recovery-v1"/i.test(html);\n  const evidenceSurfacePresent = phase8aOwnerAcceptance\n    ? label === "screening"\n      ? /Evidence Coverage/i.test(html)\n      : label === "underwriting"\n        ? /Decision Evidence Map/i.test(html)\n        : false\n    : /Evidence Conviction Matrix/i.test(html);\n  if (!evidenceSurfacePresent) {\n    console.error(\`PHASE7_ARTIFACT_HEADING_DIAGNOSTIC:\${label}:\${JSON.stringify(collectArtifactHeadings(html))}\`);\n    throw new Error(\`PHASE7_EVIDENCE_SURFACE_MISSING:\${label}:phase8a=\${phase8aOwnerAcceptance}\`);\n  }`;

if (!source.includes(before)) {
  throw new Error("PHASE8A_SLICE_D_GENERATOR_ASSERTION_MISSING");
}
source = source.replace(before, after);

const manifestBefore = `    "Evidence Conviction Matrix when supported",`;
const manifestAfter = `    "decision evidence surface required for the active presentation authority",`;
if (!source.includes(manifestBefore)) {
  throw new Error("PHASE8A_SLICE_D_GENERATOR_MANIFEST_ASSERTION_MISSING");
}
source = source.replace(manifestBefore, manifestAfter);

fs.writeFileSync(target, source, "utf8");
console.log("phase8a-slice-d-generator-alignment-patch: PATCHED");
