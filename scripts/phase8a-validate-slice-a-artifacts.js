import fs from "node:fs";
import path from "node:path";

const artifactDir = path.resolve(process.env.PHASE8_ARTIFACT_DIR || "phase8-artifacts");
const screeningPath = path.join(artifactDir, "phase7-screening-harbourstone.html");
const underwritingPath = path.join(artifactDir, "phase7-underwriting-stonebridge.html");

function read(filePath, label) {
  if (!fs.existsSync(filePath)) throw new Error(`PHASE8A_ARTIFACT_MISSING:${label}`);
  return fs.readFileSync(filePath, "utf8");
}

function visibleText(html = "") {
  return String(html || "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const screening = read(screeningPath, "screening");
const underwriting = read(underwritingPath, "underwriting");
const screeningText = visibleText(screening);
const underwritingText = visibleText(underwriting);

for (const [label, html, text] of [
  ["screening", screening, screeningText],
  ["underwriting", underwriting, underwritingText],
]) {
  if (!/data-iq-phase8a="owner-acceptance-recovery-v1"/i.test(html)) {
    throw new Error(`PHASE8A_MARKER_MISSING:${label}`);
  }
  if (!/id="investoriq-phase8a-owner-acceptance-authority"/i.test(html)) {
    throw new Error(`PHASE8A_STYLE_MISSING:${label}`);
  }
  if (/[\u2013\u2014]/.test(text) || /&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);/i.test(text)) {
    throw new Error(`PHASE8A_CUSTOMER_DASH_FOUND:${label}`);
  }
  if (!/\.iq-phase8a \.cover-cell \{ background:#fff !important/i.test(html)) {
    throw new Error(`PHASE8A_WHITE_COVER_CELL_AUTHORITY_MISSING:${label}`);
  }
  if (!/\.iq-phase8a \.cover-wrap::after \{[^}]*width:1\.05in !important;[^}]*height:3px !important;/i.test(html)) {
    throw new Error(`PHASE8A_GOLD_RULE_RESET_MISSING:${label}`);
  }
}

if (!/Screening Decision Snapshot\s+HOLD/i.test(screeningText)) throw new Error("PHASE8A_SCREENING_HOLD_MISSING");
if (!/Underwriting Readiness\s+HOLD/i.test(screeningText)) throw new Error("PHASE8A_SCREENING_READINESS_MISSING");
if (!/Source Consistency\s+44\.0% material variance/i.test(screeningText)) throw new Error("PHASE8A_SCREENING_SOURCE_CONSISTENCY_MISSING");
if (!/Operating Cushion\s+71\.5 pp above break-even/i.test(screeningText)) throw new Error("PHASE8A_SCREENING_OPERATING_CUSHION_MISSING");
if (!/data-iq-phase8a-methodology="true"/i.test(screening)) throw new Error("PHASE8A_SCREENING_METHODOLOGY_MISSING");
if (!/Full_Render_T12\.xlsx/i.test(screeningText) || !/Full_Render_Rent_Roll\.xlsx/i.test(screeningText)) throw new Error("PHASE8A_SCREENING_SOURCE_NAMES_MISSING");
if (/\$-813,200/.test(screeningText)) throw new Error("PHASE8A_SCREENING_NEGATIVE_MONEY_STYLE_REGRESSION");
if (!/\(\$813,200\)/.test(screeningText)) throw new Error("PHASE8A_SCREENING_NEGATIVE_MONEY_INSTITUTIONAL_FORMAT_MISSING");
if (/Multifamily\s*-\s*48 Units/i.test(screeningText)) throw new Error("PHASE8A_SCREENING_COVER_LEGACY_DASH_LABEL");
if (!/Multifamily\s*\|\s*48 Units/i.test(screeningText)) throw new Error("PHASE8A_SCREENING_COVER_FAMILY_LABEL_MISSING");

if (/\b64-Unit\b/i.test(underwritingText)) throw new Error("PHASE8A_UNDERWRITING_DASH_ASSET_LABEL_FOUND");
if (!/\b64 Unit\b/i.test(underwritingText)) throw new Error("PHASE8A_UNDERWRITING_ASSET_LABEL_MISSING");
if (/\ba 11\.16%\b/i.test(underwritingText)) throw new Error("PHASE8A_UNDERWRITING_GRAMMAR_REGRESSION");
if (/0\.61x less DSCR/i.test(underwritingText)) throw new Error("PHASE8A_UNDERWRITING_DSCR_COPY_REGRESSION");
if (/Document-backed committee framing using verified source facts and deterministic calculations/i.test(underwritingText)) throw new Error("PHASE8A_UNDERWRITING_QA_OPENING_REGRESSION");

console.log("phase8a-validate-slice-a-artifacts: PASS");
