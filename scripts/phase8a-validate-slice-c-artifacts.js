import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.env.PHASE8_ARTIFACT_DIR || "phase8a-artifacts");
const screeningPath = path.join(dir, "phase7-screening-harbourstone.html");
const underwritingPath = path.join(dir, "phase7-underwriting-stonebridge.html");

function readRequired(filePath, label) {
  if (!fs.existsSync(filePath)) throw new Error(`PHASE8A_SLICE_C_ARTIFACT_MISSING:${label}`);
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

function requireText(text, pattern, label) {
  if (!pattern.test(text)) throw new Error(`PHASE8A_SLICE_C_REQUIRED_TEXT_MISSING:${label}:${pattern}`);
}

function forbidText(text, pattern, label) {
  if (pattern.test(text)) throw new Error(`PHASE8A_SLICE_C_FORBIDDEN_TEXT_FOUND:${label}:${pattern}`);
}

const screeningHtml = readRequired(screeningPath, "screening");
const underwritingHtml = readRequired(underwritingPath, "underwriting");
const screeningText = visibleText(screeningHtml);
const underwritingText = visibleText(underwritingHtml);

// Screening must perform triage, not expose internal matrix terminology.
if (/data-iq-phase8b="cross-product-publication-system-v1"/.test(screeningHtml)) {
  requireText(screeningText, /Screening Decision Snapshot/i, "screening-snapshot");
  requireText(screeningText, /Screening Thesis/i, "screening-thesis");
  requireText(screeningText, /What Can Stop Advancement/i, "screening-stop-case");
  requireText(screeningText, /What Must Be True to Advance/i, "screening-conditions");
  requireText(screeningText, /Occupancy is 95\.8%/i, "screening-occupancy");
  requireText(screeningText, /NOI margin is 59\.1%/i, "screening-noi-margin");
  requireText(screeningText, /Operating Cushion\s+71\.5 pp above break-even/i, "screening-cushion");
  requireText(screeningText, /Documented market rent exceeds in-place rent by \$100,800 annually/i, "screening-rent-gap");
  requireText(screeningText, /Decision Evidence Map/i, "screening-evidence-map");
  requireText(screeningText, /Data Coverage/i, "screening-data-coverage");
  requireText(screeningText, /Multifamily\s*\|\s*48 Units/i, "screening-human-unit-label");
} else {
  requireText(screeningText, /Screening Decision Profile/i, "screening-profile");
  requireText(screeningText, /Why the property remains competitive/i, "screening-competitive-case");
  requireText(screeningText, /Why the disposition is HOLD/i, "screening-hold-reason");
  requireText(screeningText, /Conditions to advance/i, "screening-conditions");
  requireText(screeningText, /Occupancy is 95\.8%/i, "screening-occupancy");
  requireText(screeningText, /NOI margin is 59\.1%/i, "screening-noi-margin");
  requireText(screeningText, /Operating occupancy cushion is 71\.5 percentage points/i, "screening-cushion");
  requireText(screeningText, /Rent Roll market rent is 9\.7% above in-place rent/i, "screening-rent-gap");
  requireText(screeningText, /Evidence Coverage/i, "screening-evidence-coverage");
  requireText(screeningText, /Screening Scope/i, "screening-scope");
  requireText(screeningText, /48 Unit Multifamily/i, "screening-human-unit-label");
}
forbidText(screeningText, /Evidence Conviction Matrix/i, "screening-internal-matrix-label");
forbidText(screeningText, /Framework Note/i, "screening-framework-note");
forbidText(screeningText, /\b48-Unit\b/i, "screening-dash-unit-label");

// Capital-plan synthesis must use only arithmetic from the accepted source plan.
requireText(underwritingText, /Capital Program Economics/i, "capital-heading");
requireText(underwritingText, /Interior Units in Stated Program\s+38 of 64 \(59\.4%\)/i, "capital-unit-share");
requireText(underwritingText, /Interior Capital\s+\$802,000/i, "capital-interior");
requireText(underwritingText, /Other Stated Capital\s+\$478,000/i, "capital-other");
requireText(underwritingText, /Documented Annual Gross Rent Lift\s+\$124,200/i, "capital-gross-lift");
requireText(underwritingText, /Gross Rent Lift \/ Total Budget\s+9\.7%/i, "capital-lift-ratio");
requireText(underwritingText, /Simple Gross Payback on Total Budget\s+10\.31 years/i, "capital-total-payback");
requireText(underwritingText, /Interior-Only Simple Gross Payback\s+6\.46 years/i, "capital-interior-payback");
requireText(underwritingText, /Gross rent lift is document-based rent arithmetic, not NOI/i, "capital-boundary");

// Market evidence must be synthesized against the Rent Roll without replacing it.
requireText(underwritingText, /Rent Roll vs Market Survey/i, "market-comparison-heading");
requireText(underwritingText, /1BR\s+\$2,050\s+\$2,100 to \$2,250\s+\$50 below survey low/i, "market-1br");
requireText(underwritingText, /2BR\s+\$2,425\s+\$2,500 to \$2,700\s+\$75 below survey low/i, "market-2br");
requireText(underwritingText, /Rent Roll market rents are below the supplied survey floors for every matched unit type/i, "market-conclusion");

// Debt-service coverage must remain explicitly labeled when source-authorized.
requireText(underwritingText, /Current DSCR\s+2\.01x/i, "current-dscr-label");
requireText(underwritingText, /Proposed DSCR\s+1\.40x/i, "proposed-dscr-label");
requireText(underwritingText, /Proposed financing tightens DSCR from 2\.01x currently to 1\.40x/i, "dscr-comparison-copy");

// Source presence must not be presented as diligence sufficiency.
forbidText(underwritingText, /Complete for this analysis/i, "diligence-overstatement");
requireText(underwritingText, /Source facts available/i, "source-facts-available");
requireText(underwritingText, /Source presence does not by itself establish diligence sufficiency/i, "diligence-boundary");

// Incomparable sensitivity families may not be ranked against one another.
requireText(underwritingText, /Sensitivity Reference/i, "sensitivity-reference");
requireText(underwritingText, /not ranked against one another because the shock magnitudes and target outputs differ/i, "sensitivity-no-rank");
requireText(underwritingText, /Relative Movement Within Target/i, "sensitivity-relative-column");
requireText(underwritingText, /Sensitivity Interpretation/i, "sensitivity-interpretation");
requireText(underwritingText, /does not assign a cross-output rank/i, "sensitivity-cross-output-boundary");
forbidText(underwritingText, /Primary driver|Material driver|Secondary driver/i, "sensitivity-materiality-rank");
forbidText(underwritingText, /#1\s+Occupancy|#2\s+Cap Rate|#3\s+Operating Expenses/i, "sensitivity-numbered-rank");

// NOI / cap-rate math must be framed as a transaction-basis consistency check.
requireText(underwritingText, /NOI \/ Cap-Rate Cross-Check/i, "valuation-cross-check-heading");
requireText(underwritingText, /NOI \/ Cap-Rate Cross-Check Value/i, "valuation-cross-check-value");
requireText(underwritingText, /this is a consistency cross-check, not an independent valuation opinion/i, "valuation-honesty");
forbidText(underwritingText, /InvestorIQ Implied Value/i, "valuation-old-independent-label");

console.log("phase8a-validate-slice-c-artifacts: PASS");
