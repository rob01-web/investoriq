import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.env.PHASE8_ARTIFACT_DIR || "phase8a-artifacts");
const screeningPath = path.join(dir, "phase7-screening-harbourstone.html");
const underwritingPath = path.join(dir, "phase7-underwriting-stonebridge.html");

function readRequired(filePath, label) {
  if (!fs.existsSync(filePath)) throw new Error(`PHASE8A_SLICE_D_ARTIFACT_MISSING:${label}`);
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

function requirePattern(source, pattern, label) {
  if (!pattern.test(source)) throw new Error(`PHASE8A_SLICE_D_REQUIRED_MISSING:${label}:${pattern}`);
}

function forbidPattern(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`PHASE8A_SLICE_D_FORBIDDEN_FOUND:${label}:${pattern}`);
}

const screeningHtml = readRequired(screeningPath, "screening");
const underwritingHtml = readRequired(underwritingPath, "underwriting");
const screeningText = visibleText(screeningHtml);
const underwritingText = visibleText(underwritingHtml);

// Preserve the Screening owner-acceptance authority while Slice D edits Underwriting only.
requirePattern(screeningText, /Screening Report/i, "screening-title");
requirePattern(screeningText, /Methodology\s*&\s*Data Transparency/i, "screening-methodology");
requirePattern(screeningText, /Screening Decision Profile/i, "screening-decision-profile");

// Cover subtitle is editorial, while canonical product identity remains Underwriting Report.
requirePattern(underwritingHtml, /<div class="cover-prop-sub">\s*Investment Committee Memorandum\s*<\/div>/i, "underwriting-cover-subtitle");
forbidPattern(underwritingHtml, /<div class="cover-prop-sub">\s*Underwriting Report\s*<\/div>/i, "underwriting-old-cover-subtitle");
requirePattern(underwritingText, /InvestorIQ Underwriting Report/i, "canonical-product-identity-retained");

// Decision evidence page must read as a reader-facing map, not internal framework language.
requirePattern(underwritingText, /Decision Evidence Map/i, "decision-evidence-map");
requirePattern(underwritingHtml, /<th>Report Sections<\/th>/i, "decision-evidence-report-sections-header");
requirePattern(underwritingText, /Where the report supports each core committee question\./i, "decision-evidence-intro");
forbidPattern(underwritingText, /Evidence Conviction Matrix/i, "old-evidence-matrix-label");
forbidPattern(underwritingHtml, /<th>report sections<\/th>/i, "lowercase-report-sections-header");

// Customer-facing copy remains free of typographic em/en dashes.
forbidPattern(screeningText, /[\u2013\u2014]/u, "screening-unicode-dash");
forbidPattern(underwritingText, /[\u2013\u2014]/u, "underwriting-unicode-dash");

console.log("phase8a-validate-slice-d-artifacts: PASS");
