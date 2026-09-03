import fs from "node:fs";
import path from "node:path";

import {
  assertPhase8ArtifactIdentity,
  assertPhase8SourceBindingIdentity,
  PHASE8_ARTIFACT_IDENTITY_FINGERPRINTS,
  visibleArtifactText,
} from "./phase8-artifact-identity-fingerprint.js";
import { buildPhase8CertificationRequests } from "./phase8-visual-certification-fixtures.js";

const artifactDir = path.resolve(process.env.PHASE8_ARTIFACT_DIR || "phase8-artifacts");
const artifacts = {
  screening: path.join(artifactDir, "phase7-screening-harbourstone.html"),
  underwriting: path.join(artifactDir, "phase7-underwriting-stonebridge.html"),
};
const certificationRequests = buildPhase8CertificationRequests();

function readRequired(filePath, label) {
  if (!fs.existsSync(filePath)) throw new Error(`PHASE8_ARTIFACT_MISSING:${label}:${filePath}`);
  const html = fs.readFileSync(filePath, "utf8");
  if (!/<!DOCTYPE html>/i.test(html)) throw new Error(`PHASE8_ARTIFACT_NOT_COMPLETE_HTML:${label}`);
  return html;
}

function visibleText(html = "") {
  return visibleArtifactText(html);
}

function assertSharedCustomerAuthority(html, label) {
  const text = visibleText(html);
  if (!/data-iq-phase8="elite-customer-facing-authority-v1"/i.test(html)) {
    throw new Error(`PHASE8_AUTHORITY_MARKER_MISSING:${label}`);
  }
  if (/[\u2013\u2014]/.test(text) || /&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);/i.test(html.replace(/<style[\s\S]*?<\/style>/gi, ""))) {
    throw new Error(`PHASE8_CUSTOMER_DASH_PUNCTUATION_FOUND:${label}`);
  }
  if (/\b(?:AI|LLM|parser|prompt|worker|runtime|database)\b|stack trace/i.test(text)) {
    throw new Error(`PHASE8_INTERNAL_TECHNICAL_LANGUAGE_FOUND:${label}`);
  }
  if (/\{\{[A-Z0-9_]+\}\}/.test(text)) {
    throw new Error(`PHASE8_UNRESOLVED_TEMPLATE_TOKEN_FOUND:${label}`);
  }
  if (/\b(?:undefined|null|NaN)\b/.test(text)) {
    throw new Error(`PHASE8_BROKEN_VALUE_TOKEN_FOUND:${label}`);
  }
  return text;
}

const screeningHtml = readRequired(artifacts.screening, "screening");
const screeningText = assertSharedCustomerAuthority(screeningHtml, "screening");
if (!/InvestorIQ Screening Report/i.test(screeningText)) throw new Error("PHASE8_SCREENING_IDENTITY_MISSING");
if (/Capital Intelligence Memorandum/i.test(screeningText)) throw new Error("PHASE8_LEGACY_SCREENING_IDENTITY_FOUND");
if (!/Operating Evidence & Diligence Priorities/i.test(screeningText)) throw new Error("PHASE8_SCREENING_EVIDENCE_SECTION_MISSING");
if (!/T12 Operating Evidence/i.test(screeningText)) throw new Error("PHASE8_SCREENING_T12_EVIDENCE_MISSING");
if (!/Rent Roll Evidence/i.test(screeningText)) throw new Error("PHASE8_SCREENING_RENT_ROLL_EVIDENCE_MISSING");
if (!/Source Reconciliation/i.test(screeningText)) throw new Error("PHASE8_SCREENING_RECONCILIATION_MISSING");
if (!/Diligence Priorities/i.test(screeningText)) throw new Error("PHASE8_SCREENING_DILIGENCE_PRIORITIES_MISSING");
const screeningIdentity = assertPhase8ArtifactIdentity({ report: "screening", html: screeningHtml });
const screeningSourceBinding = assertPhase8SourceBindingIdentity({ report: "screening", request: certificationRequests.screening });

const underwritingHtml = readRequired(artifacts.underwriting, "underwriting");
const underwritingText = assertSharedCustomerAuthority(underwritingHtml, "underwriting");
if (!/InvestorIQ Underwriting Report/i.test(underwritingText)) throw new Error("PHASE8_UNDERWRITING_IDENTITY_MISSING");
if (/InvestorIQ Investment Committee Memorandum/i.test(underwritingText)) throw new Error("PHASE8_LEGACY_UNDERWRITING_IDENTITY_FOUND");
const underwritingIdentity = assertPhase8ArtifactIdentity({ report: "underwriting", html: underwritingHtml });
const underwritingSourceBinding = assertPhase8SourceBindingIdentity({ report: "underwriting", request: certificationRequests.underwriting });
if (!/Source Register|Evidence & Diligence Register|Source Appendix/i.test(underwritingText)) {
  throw new Error("PHASE8_UNDERWRITING_SOURCE_TRANSPARENCY_MISSING");
}

const manifest = {
  authority: "phase8_elite_customer_facing_visual_authority_v1",
  artifact_dir: artifactDir,
  screening: {
    file: path.basename(artifacts.screening),
    bytes: fs.statSync(artifacts.screening).size,
    identity: "InvestorIQ Screening Report",
    evidence_section: true,
    identity_fingerprint: PHASE8_ARTIFACT_IDENTITY_FINGERPRINTS.screening,
    identity_validation: screeningIdentity,
    source_binding_validation: screeningSourceBinding,
  },
  underwriting: {
    file: path.basename(artifacts.underwriting),
    bytes: fs.statSync(artifacts.underwriting).size,
    identity: "InvestorIQ Underwriting Report",
    identity_fingerprint: PHASE8_ARTIFACT_IDENTITY_FINGERPRINTS.underwriting,
    identity_validation: underwritingIdentity,
    source_binding_validation: underwritingSourceBinding,
    harbourstone_contamination_absent: true,
    source_transparency_present: true,
  },
  customer_surface: {
    phase8_marker_required: true,
    literal_or_encoded_em_en_dashes_allowed: false,
    internal_technical_language_allowed: false,
    unresolved_template_tokens_allowed: false,
    broken_value_tokens_allowed: false,
  },
};

fs.writeFileSync(
  path.join(artifactDir, "phase8-visual-authority-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
);

console.log(`phase8-validate-visual-artifacts: PASS (${artifactDir})`);
