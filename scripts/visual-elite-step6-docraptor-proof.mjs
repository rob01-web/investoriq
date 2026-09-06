import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import pdfParse from "pdf-parse";

for (const envFile of [".env.local", ".env.production.local", ".env"]) {
  if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: false, quiet: true });
}

process.env.NODE_ENV = "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS = "true";
process.env.SUPABASE_URL ||= "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-key";
process.env.ADMIN_RUN_KEY ||= "test-admin-run-key";
process.env.QA_REVIEW_ENABLED ||= "false";
process.env.REPORT_DOWNLOAD_ARTIFACT_MODE = "docraptor_test_pdf";
process.env.DOCRAPTOR_MODE = "test";
process.env.ALLOW_PRODUCTION_PDF = "false";
process.env.DOCRAPTOR_PRODUCTION_OWNER_AUTHORIZED = "false";

const apiKey = String(process.env.DOCRAPTOR_API_KEY || "").trim();
if (!apiKey) throw new Error("STEP6_DOCRAPTOR_API_KEY_MISSING_LOCAL_ENV");

const { default: generateClientReport } = await import("../api/generate-client-report.js");
const {
  buildPhase8CertificationRequests,
  renderPhase8CertificationArtifacts,
} = await import("./phase8-visual-certification-fixtures.js");
const { requestDocRaptorPdf } = await import("../api/_lib/docraptor-request.js");
const { resolveDocRaptorModeGovernanceReceipt } = await import("../api/_lib/docraptor-mode-governance.js");

const outDir = path.resolve(process.env.STEP6_ARTIFACT_DIR || "step6-docraptor-proof");
fs.mkdirSync(outDir, { recursive: true });

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function visibleText(html = "") {
  return String(html || "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assertFinalHtml(html, lane) {
  const text = visibleText(html);
  if (!/<!DOCTYPE html>/i.test(html)) throw new Error(`STEP6_INCOMPLETE_HTML:${lane}`);
  if (!/Stonebridge Lofts/i.test(text)) throw new Error(`STEP6_STONEBRIDGE_IDENTITY_MISSING:${lane}`);
  if (!/data-iq-phase8b="cross-product-publication-system-v1"/i.test(html)) throw new Error(`STEP6_PHASE8B_MARKER_MISSING:${lane}`);
  if (!/InvestorIQ Cormorant Garamond/i.test(html)) throw new Error(`STEP6_CORMORANT_MISSING:${lane}`);
  if (!/InvestorIQ DM Sans/i.test(html)) throw new Error(`STEP6_DM_SANS_MISSING:${lane}`);
  if (!/InvestorIQ DM Mono/i.test(html)) throw new Error(`STEP6_DM_MONO_MISSING:${lane}`);
  if (!/--iq-ve-forest:#143e34/i.test(html)) throw new Error(`STEP6_FOREST_VISUAL_AUTHORITY_MISSING:${lane}`);
  if (/[\u2013\u2014]/.test(text)) throw new Error(`STEP6_CUSTOMER_DASH_PUNCTUATION_FOUND:${lane}`);
  if (/\{\{[A-Z0-9_]+\}\}/.test(text) || /\b(?:undefined|NaN)\b/.test(text)) throw new Error(`STEP6_BROKEN_VALUE_TOKEN_FOUND:${lane}`);
  if (lane === "screening") {
    if (!/InvestorIQ Screening Report/i.test(text)) throw new Error("STEP6_SCREENING_IDENTITY_MISSING");
    if (!/Screening Decision Snapshot/i.test(text)) throw new Error("STEP6_SCREENING_DECISION_MISSING");
    if (!/Decision Evidence (?:&|and) Key Metrics/i.test(text)) throw new Error("STEP6_SCREENING_EVIDENCE_MISSING");
  } else {
    if (!/InvestorIQ Underwriting Report/i.test(text)) throw new Error("STEP6_UNDERWRITING_IDENTITY_MISSING");
    if (!/data-iq-visual-elite-exhibit="t12-earnings-bridge-v1"/i.test(html)) throw new Error("STEP6_EARNINGS_BRIDGE_MISSING");
    if (!/Source Register|Evidence & Diligence Register|Source Appendix/i.test(text)) throw new Error("STEP6_SOURCE_TRANSPARENCY_MISSING");
  }
  return {
    html_bytes: Buffer.byteLength(html),
    html_sha256: sha256(Buffer.from(html, "utf8")),
    visible_text_bytes: Buffer.byteLength(text),
  };
}

const baseRequests = buildPhase8CertificationRequests();
const underwritingRequest = structuredClone(baseRequests.underwriting);
underwritingRequest.body.userId = "visual_elite_step6_stonebridge_underwriting";
underwritingRequest.body.report_type = "underwriting";
underwritingRequest.body.property_name = "Stonebridge Lofts";
underwritingRequest.body.__test_return_final_html = true;

const screeningRequest = structuredClone(baseRequests.underwriting);
screeningRequest.body.userId = "visual_elite_step6_stonebridge_screening";
screeningRequest.body.report_type = "screening";
screeningRequest.body.property_name = "Stonebridge Lofts";
screeningRequest.body.__test_return_final_html = true;
delete screeningRequest.body.__test_acq_memo_v2_render_context;

const rendered = await renderPhase8CertificationArtifacts(generateClientReport, {
  screening: screeningRequest,
  underwriting: underwritingRequest,
});

const governance = resolveDocRaptorModeGovernanceReceipt({
  reportDownloadArtifactMode: "docraptor_test_pdf",
  allowProductionPdf: false,
  docraptorMode: "test",
  hasDocRaptorApiKey: true,
  productionOwnerAuthorized: false,
});
if (governance.resolved_docraptor_mode !== "test" || governance.resolved_report_download_artifact_mode !== "docraptor_test_pdf") {
  throw new Error(`STEP6_MODE_GOVERNANCE_REJECTED:${JSON.stringify(governance)}`);
}
if (governance.production_provider_allowed !== false) throw new Error("STEP6_PRODUCTION_PROVIDER_MUST_REMAIN_BLOCKED");

const receipt = {
  authority: "visual_elite_step6_docraptor_test_proof_v1",
  generated_at: new Date().toISOString(),
  branch: process.env.GITHUB_REF_NAME || null,
  workflow_sha: process.env.GITHUB_SHA || null,
  step5_base_commit: "32c639d2006e1ef15b533526028d2d174367f7d8",
  owner_authorization_scope: "Stonebridge Screening and Underwriting final fixture HTML to DocRaptor TEST mode only",
  production_services_used: false,
  production_provider_allowed: false,
  docraptor_test_mode: true,
  governance,
  reports: {},
};

for (const lane of ["screening", "underwriting"]) {
  const html = rendered[lane].html;
  const htmlProof = assertFinalHtml(html, lane);

  const response = await requestDocRaptorPdf({
    documentContent: html,
    apiKey,
    docraptorMode: "test",
    attempt: `visual_elite_step6_${lane}`,
    timeoutMs: 45_000,
  });
  if (Number(response?.status) < 200 || Number(response?.status) >= 300) {
    throw new Error(`STEP6_DOCRAPTOR_HTTP_FAILURE:${lane}:${response?.status}`);
  }

  const pdfBuffer = Buffer.from(response.data);
  if (pdfBuffer.length < 1000 || pdfBuffer.subarray(0, 4).toString("ascii") !== "%PDF") {
    throw new Error(`STEP6_INVALID_PDF_BYTES:${lane}:${pdfBuffer.length}`);
  }

  const parsed = await pdfParse(pdfBuffer);
  const pdfText = String(parsed.text || "").replace(/\s+/g, " ").trim();
  if (!Number.isInteger(parsed.numpages) || parsed.numpages < 1) throw new Error(`STEP6_INVALID_PAGE_COUNT:${lane}:${parsed.numpages}`);
  if (!/Stonebridge Lofts/i.test(pdfText)) throw new Error(`STEP6_PDF_STONEBRIDGE_IDENTITY_MISSING:${lane}`);
  if (!/945,?000/.test(pdfText)) throw new Error(`STEP6_PDF_NOI_MISSING:${lane}`);
  if (lane === "screening" && !/Screening Report/i.test(pdfText)) throw new Error("STEP6_PDF_SCREENING_IDENTITY_MISSING");
  if (lane === "underwriting") {
    if (!/Underwriting Report/i.test(pdfText)) throw new Error("STEP6_PDF_UNDERWRITING_IDENTITY_MISSING");
    if (!/13,?500,?000/.test(pdfText)) throw new Error("STEP6_PDF_PURCHASE_PRICE_MISSING");
  }

  const filename = `Stonebridge_${lane === "screening" ? "Screening" : "Underwriting"}_Visual_ELITE_DocRaptor_TEST.pdf`;
  fs.writeFileSync(path.join(outDir, filename), pdfBuffer);
  receipt.reports[lane] = {
    ...htmlProof,
    handler_response: rendered[lane].response,
    pdf_file: filename,
    pdf_bytes: pdfBuffer.length,
    pdf_sha256: sha256(pdfBuffer),
    pdf_pages: parsed.numpages,
    provider_http_status: Number(response.status),
    stonebridge_identity_present: true,
    t12_noi_945000_present: true,
    purchase_price_13500000_present: lane === "underwriting" ? true : null,
  };
}

const receiptPath = path.join(outDir, "Visual_ELITE_Step6_DocRaptor_TEST_Receipt.json");
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
console.log(JSON.stringify(receipt, null, 2));
console.log(`Visual ELITE Step 6 DocRaptor TEST proof: PASS (${outDir})`);
