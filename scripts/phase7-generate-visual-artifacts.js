import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "tests", "qa", "generate-client-report-rent-roll-smoke.js");
const artifactDir = path.resolve(process.env.PHASE7_ARTIFACT_DIR || path.join(root, "tmp", "phase7-visual-artifacts"));

fs.mkdirSync(artifactDir, { recursive: true });

const authoritativeOutputs = {
  screeningHarbourstone: path.join(artifactDir, "phase7-screening-harbourstone.html"),
  underwritingStonebridge: path.join(artifactDir, "phase7-underwriting-stonebridge.html"),
};
const diagnosticOutputs = {
  underwritingHarbourstoneLegacy: path.join(artifactDir, "phase7-underwriting-harbourstone-legacy-diagnostic.html"),
};
const outputs = { ...authoritativeOutputs, ...diagnosticOutputs };

let source = fs.readFileSync(sourcePath, "utf8");

// The historical giant smoke contains static source-shape assertions that are not
// part of Phase 7 visual artifact authority and may legitimately age as upstream
// architecture evolves. The temporary copy reuses its proven render fixtures only.
// Generated authoritative artifacts receive fresh Phase 7 assertions below.
const historicalAssertImport = 'import assert from "assert";';
if (!source.includes(historicalAssertImport)) {
  throw new Error("PHASE7_ARTIFACT_ASSERT_SEAM_MISSING");
}
source = source.replace(
  historicalAssertImport,
  'const assert = new Proxy(() => {}, { get: () => () => {} });'
);

function injectCapture(variableName, responseName, envName) {
  const exact = `const ${variableName} = String(${responseName}.body?.final_html || "");`;
  if (!source.includes(exact)) {
    throw new Error(`PHASE7_ARTIFACT_CAPTURE_SEAM_MISSING:${variableName}`);
  }
  const capture = `${exact}\nif (process.env.${envName}) fs.writeFileSync(process.env.${envName}, ${variableName}, "utf8");`;
  source = source.replace(exact, capture);
}

injectCapture("fullRenderHtml", "fullRenderHarnessResponse", "PHASE7_UNDERWRITING_HARBOURSTONE_LEGACY_HTML");
injectCapture("screeningHtml", "screeningHarnessResponse", "PHASE7_SCREENING_HARBOURSTONE_HTML");
injectCapture("attackRenderHtml", "attackRenderHarnessResponse", "PHASE7_UNDERWRITING_STONEBRIDGE_HTML");

const tempRunnerPath = path.join(root, "tests", "qa", `.phase7-visual-artifact-runner-${process.pid}.js`);
fs.writeFileSync(tempRunnerPath, source, "utf8");

try {
  const result = spawnSync(process.execPath, [tempRunnerPath], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "test",
      INVESTORIQ_ENABLE_TEST_HOOKS: "true",
      SUPABASE_URL: process.env.SUPABASE_URL || "http://127.0.0.1",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key",
      ADMIN_RUN_KEY: process.env.ADMIN_RUN_KEY || "test-admin-run-key",
      DOCRAPTOR_API_KEY: process.env.DOCRAPTOR_API_KEY || "test-docraptor-key",
      QA_REVIEW_ENABLED: "false",
      PHASE7_UNDERWRITING_HARBOURSTONE_LEGACY_HTML: diagnosticOutputs.underwritingHarbourstoneLegacy,
      PHASE7_SCREENING_HARBOURSTONE_HTML: authoritativeOutputs.screeningHarbourstone,
      PHASE7_UNDERWRITING_STONEBRIDGE_HTML: authoritativeOutputs.underwritingStonebridge,
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`PHASE7_ARTIFACT_HARNESS_FAILED:${result.status}`);
  }
} finally {
  fs.rmSync(tempRunnerPath, { force: true });
}

function collectArtifactHeadings(html = "") {
  const headings = [];
  const pattern = /<span\b[^>]*class\s*=\s*(["'])[^"']*\bsection-header-title\b[^"']*\1[^>]*>([\s\S]*?)<\/span>/gi;
  let match;
  while ((match = pattern.exec(String(html || ""))) !== null) {
    const text = String(match[2] || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text && !headings.includes(text)) headings.push(text);
  }
  return headings;
}

const authoritativeValidation = {};
for (const [label, outputPath] of Object.entries(authoritativeOutputs)) {
  if (!fs.existsSync(outputPath)) throw new Error(`PHASE7_ARTIFACT_MISSING:${label}`);
  const html = fs.readFileSync(outputPath, "utf8");
  if (!/<!DOCTYPE html>/i.test(html)) throw new Error(`PHASE7_ARTIFACT_NOT_HTML:${label}`);
  if (!/data-iq-phase7="elite-report-redesign-v1"/i.test(html)) throw new Error(`PHASE7_PRESENTATION_MARKER_MISSING:${label}`);
  if (!/Evidence Conviction Matrix/i.test(html)) {
    console.error(`PHASE7_ARTIFACT_HEADING_DIAGNOSTIC:${label}:${JSON.stringify(collectArtifactHeadings(html))}`);
    console.error(`PHASE7_ARTIFACT_MARKER_DIAGNOSTIC:${label}:${JSON.stringify({
      presentation: /data-iq-phase7="elite-report-redesign-v1"/i.test(html),
      evidenceMatrixMarker: /data-iq-phase7-evidence-matrix=/i.test(html),
      decisionDriverMarker: /data-iq-phase7-decision-drivers=/i.test(html),
      executiveCloseMarker: /<!--\s*END SECTION_0_5\s*-->/i.test(html),
    })}`);
    throw new Error(`PHASE7_EVIDENCE_MATRIX_MISSING:${label}`);
  }

  const hasUpsideDrivers = /Key Upside Drivers/i.test(html);
  const hasPrimaryConstraints = /Primary Constraints/i.test(html);
  const decisionDriverInputsPresent = hasUpsideDrivers && hasPrimaryConstraints;
  const decisionDriverFramePresent = /What Changes the Decision/i.test(html);
  if (decisionDriverInputsPresent && !decisionDriverFramePresent) {
    throw new Error(`PHASE7_DECISION_DRIVERS_MISSING:${label}`);
  }
  if (!decisionDriverInputsPresent && decisionDriverFramePresent) {
    throw new Error(`PHASE7_DECISION_DRIVERS_UNSUPPORTED:${label}`);
  }

  const customerHtml = html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  if (/(?:\u2013|\u2014|&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);)/i.test(customerHtml)) {
    throw new Error(`PHASE7_CUSTOMER_DASH_PUNCTUATION_FOUND:${label}`);
  }
  if (label === "screeningHarbourstone") {
    if (!/InvestorIQ Screening Report/i.test(customerHtml)) {
      throw new Error("PHASE7_SCREENING_IDENTITY_MISSING");
    }
    if (/Capital Intelligence Memorandum/i.test(customerHtml)) {
      throw new Error("PHASE7_LEGACY_SCREENING_IDENTITY_FOUND");
    }
  }

  authoritativeValidation[label] = {
    evidence_conviction_matrix: true,
    decision_driver_inputs_present: decisionDriverInputsPresent,
    what_changes_the_decision_present: decisionDriverFramePresent,
    evidence_gating_consistent: decisionDriverInputsPresent === decisionDriverFramePresent,
  };
}

for (const [label, outputPath] of Object.entries(diagnosticOutputs)) {
  if (!fs.existsSync(outputPath)) throw new Error(`PHASE7_DIAGNOSTIC_ARTIFACT_MISSING:${label}`);
  const html = fs.readFileSync(outputPath, "utf8");
  if (!/<!DOCTYPE html>/i.test(html)) throw new Error(`PHASE7_DIAGNOSTIC_NOT_HTML:${label}`);
}

const manifest = {
  generated_at: new Date().toISOString(),
  source_harness: "tests/qa/generate-client-report-rent-roll-smoke.js",
  production_services_used: false,
  historical_static_assertions_used_as_authority: false,
  visual_authority: {
    screening: "Harbourstone handler-driven Screening render",
    underwriting: "Stonebridge source-authority handler-driven Underwriting render",
  },
  legacy_underwriting_fixture_is_visual_authority: false,
  fresh_phase7_artifact_checks: [
    "complete HTML document",
    "Phase 7 presentation marker",
    "Evidence Conviction Matrix when section evidence supports it",
    "What Changes the Decision only when both governed driver blocks are present",
    "no unsupported What Changes the Decision frame",
    "canonical Screening report identity",
    "no customer-visible literal or encoded em/en dash punctuation",
  ],
  authoritative_validation: authoritativeValidation,
  authoritative_artifacts: Object.fromEntries(
    Object.entries(authoritativeOutputs).map(([label, outputPath]) => [label, {
      file: path.basename(outputPath),
      bytes: fs.statSync(outputPath).size,
    }])
  ),
  diagnostic_artifacts: Object.fromEntries(
    Object.entries(diagnosticOutputs).map(([label, outputPath]) => [label, {
      file: path.basename(outputPath),
      bytes: fs.statSync(outputPath).size,
    }])
  ),
};
fs.writeFileSync(path.join(artifactDir, "phase7-visual-artifact-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`phase7-generate-visual-artifacts: PASS (${artifactDir})`);
