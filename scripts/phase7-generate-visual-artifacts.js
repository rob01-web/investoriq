import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertPhase8ArtifactIdentity,
  assertPhase8SourceBindingIdentity,
} from "./phase8-artifact-identity-fingerprint.js";
import {
  buildPhase8CertificationRequests,
  buildPhase8CertificationSourceProvenance,
  renderPhase8CertificationArtifacts,
} from "./phase8-visual-certification-fixtures.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const artifactDir = path.resolve(process.env.PHASE7_ARTIFACT_DIR || path.join(root, "tmp", "phase7-visual-artifacts"));

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";
process.env.SUPABASE_URL ||= "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-key";
process.env.ADMIN_RUN_KEY ||= "test-admin-run-key";
process.env.DOCRAPTOR_API_KEY ||= "test-docraptor-key";
process.env.QA_REVIEW_ENABLED ||= "false";

const { default: generateClientReport } = await import("../api/generate-client-report.js");

fs.mkdirSync(artifactDir, { recursive: true });

const authoritativeOutputs = {
  screening: path.join(artifactDir, "phase7-screening-harbourstone.html"),
  underwriting: path.join(artifactDir, "phase7-underwriting-stonebridge.html"),
};

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
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

function assertPhase7PresentationAuthority(html, label) {
  if (!/data-iq-phase7="elite-report-redesign-v1"/i.test(html)) {
    throw new Error(`PHASE7_PRESENTATION_MARKER_MISSING:${label}`);
  }
  if (!/Evidence Conviction Matrix/i.test(html)) {
    console.error(`PHASE7_ARTIFACT_HEADING_DIAGNOSTIC:${label}:${JSON.stringify(collectArtifactHeadings(html))}`);
    throw new Error(`PHASE7_EVIDENCE_MATRIX_MISSING:${label}`);
  }

  const hasUpsideDrivers = /Key Upside Drivers/i.test(html);
  const hasPrimaryConstraints = /Primary Constraints/i.test(html);
  const decisionDriverInputsPresent = hasUpsideDrivers && hasPrimaryConstraints;
  const decisionDriverFramePresent = /What Changes the Decision/i.test(html);
  if (decisionDriverInputsPresent !== decisionDriverFramePresent) {
    throw new Error(`PHASE7_DECISION_DRIVER_EVIDENCE_GATING_MISMATCH:${label}`);
  }

  const customerHtml = html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  if (/(?:\u2013|\u2014|&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);)/i.test(customerHtml)) {
    throw new Error(`PHASE7_CUSTOMER_DASH_PUNCTUATION_FOUND:${label}`);
  }

  return {
    evidence_conviction_matrix: true,
    decision_driver_inputs_present: decisionDriverInputsPresent,
    what_changes_the_decision_present: decisionDriverFramePresent,
    evidence_gating_consistent: true,
  };
}

const requests = buildPhase8CertificationRequests();
const sourceBindingValidation = Object.fromEntries(
  Object.entries(requests).map(([report, request]) => [
    report,
    assertPhase8SourceBindingIdentity({ report, request }),
  ])
);
const rendered = await renderPhase8CertificationArtifacts(generateClientReport, requests);
const validation = {};
for (const [report, outputPath] of Object.entries(authoritativeOutputs)) {
  const html = rendered[report].html;
  fs.writeFileSync(outputPath, html, "utf8");
  validation[report] = {
    ...assertPhase7PresentationAuthority(html, report),
    source_binding: sourceBindingValidation[report],
    artifact_identity: assertPhase8ArtifactIdentity({ report, html }),
    handler_response: rendered[report].response,
  };
}

const manifest = {
  generated_at: new Date().toISOString(),
  generator: "dedicated Phase 8 source-bound handler requests",
  production_services_used: false,
  historical_smoke_harness_rewritten_or_executed: false,
  assertions_disabled: false,
  visual_authority: {
    screening: "Harbourstone source-bound current-branch Screening handler render",
    underwriting: "Stonebridge Lofts source-bound current-branch Underwriting handler render",
  },
  source_provenance: buildPhase8CertificationSourceProvenance(),
  fresh_artifact_checks: [
    "complete HTML document",
    "Phase 7 presentation marker",
    "Evidence Conviction Matrix when supported",
    "What Changes the Decision evidence gating",
    "no customer-visible literal or encoded em/en dash punctuation",
    "hard report identity and authorized core-fact fingerprint",
    "exact core source filenames",
    "Stonebridge artifact rejects Harbourstone core-value contamination",
  ],
  authoritative_validation: validation,
  authoritative_artifacts: Object.fromEntries(
    Object.entries(authoritativeOutputs).map(([report, outputPath]) => {
      const html = fs.readFileSync(outputPath);
      return [report, {
        file: path.basename(outputPath),
        bytes: html.length,
        sha256: sha256(html),
      }];
    })
  ),
};

fs.writeFileSync(
  path.join(artifactDir, "phase7-visual-artifact-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
);

console.log(`phase7-generate-visual-artifacts: PASS (${artifactDir})`);
