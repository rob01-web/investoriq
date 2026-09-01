import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "tests", "qa", "generate-client-report-rent-roll-smoke.js");
const artifactDir = path.resolve(process.env.PHASE7_ARTIFACT_DIR || path.join(root, "tmp", "phase7-visual-artifacts"));

fs.mkdirSync(artifactDir, { recursive: true });

const outputs = {
  underwritingHarbourstone: path.join(artifactDir, "phase7-underwriting-harbourstone.html"),
  screeningHarbourstone: path.join(artifactDir, "phase7-screening-harbourstone.html"),
  underwritingStonebridge: path.join(artifactDir, "phase7-underwriting-stonebridge.html"),
};

let source = fs.readFileSync(sourcePath, "utf8");

function injectCapture(variableName, responseName, envName) {
  const exact = `const ${variableName} = String(${responseName}.body?.final_html || "");`;
  if (!source.includes(exact)) {
    throw new Error(`PHASE7_ARTIFACT_CAPTURE_SEAM_MISSING:${variableName}`);
  }
  const capture = `${exact}\nif (process.env.${envName}) fs.writeFileSync(process.env.${envName}, ${variableName}, "utf8");`;
  source = source.replace(exact, capture);
}

injectCapture("fullRenderHtml", "fullRenderHarnessResponse", "PHASE7_UNDERWRITING_HARBOURSTONE_HTML");
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
      PHASE7_UNDERWRITING_HARBOURSTONE_HTML: outputs.underwritingHarbourstone,
      PHASE7_SCREENING_HARBOURSTONE_HTML: outputs.screeningHarbourstone,
      PHASE7_UNDERWRITING_STONEBRIDGE_HTML: outputs.underwritingStonebridge,
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

for (const [label, outputPath] of Object.entries(outputs)) {
  if (!fs.existsSync(outputPath)) throw new Error(`PHASE7_ARTIFACT_MISSING:${label}`);
  const html = fs.readFileSync(outputPath, "utf8");
  if (!/<!DOCTYPE html>/i.test(html)) throw new Error(`PHASE7_ARTIFACT_NOT_HTML:${label}`);
  if (!/data-iq-phase7="elite-report-redesign-v1"/i.test(html)) throw new Error(`PHASE7_PRESENTATION_MARKER_MISSING:${label}`);
  if (!/Evidence Conviction Matrix/i.test(html)) throw new Error(`PHASE7_EVIDENCE_MATRIX_MISSING:${label}`);
  if (!/What Changes the Decision/i.test(html)) throw new Error(`PHASE7_DECISION_DRIVERS_MISSING:${label}`);
  if (/\u2013|\u2014/.test(html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ""))) {
    throw new Error(`PHASE7_CUSTOMER_DASH_PUNCTUATION_FOUND:${label}`);
  }
}

const manifest = {
  generated_at: new Date().toISOString(),
  source_harness: "tests/qa/generate-client-report-rent-roll-smoke.js",
  production_services_used: false,
  artifacts: Object.fromEntries(
    Object.entries(outputs).map(([label, outputPath]) => [label, {
      file: path.basename(outputPath),
      bytes: fs.statSync(outputPath).size,
    }])
  ),
};
fs.writeFileSync(path.join(artifactDir, "phase7-visual-artifact-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`phase7-generate-visual-artifacts: PASS (${artifactDir})`);
