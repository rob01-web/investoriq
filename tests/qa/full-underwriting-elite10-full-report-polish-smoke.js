import assert from "node:assert/strict";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";
import { validateAcquisitionMemoRenderAgainstBossContract } from "../../api/_lib/acquisition-memo-boss-contract.js";
import { validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel } from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";

function visibleText(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const fixture = buildInstitutionalGate10ReportFixture("elite10-full-report-polish");
const { html, bossContract, customerSurfaceModel } = fixture;
const text = visibleText(html);
const htmlWithoutSoftBreaks = String(html || "").replace(/<wbr\s*\/?\s*>/gi, "");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const match = (value, regex, message) => { assert.match(String(value), regex, message); checks += 1; };
const noMatch = (value, regex, message) => { assert.doesNotMatch(String(value), regex, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };

// Constitutional validators remain the first veto authority.
equal(validateAcquisitionMemoRenderAgainstBossContract(bossContract, html).ok, true, "Boss Contract remains satisfied");
const customerValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, customerSurfaceModel);
equal(customerValidation.ok, true, JSON.stringify(customerValidation.issues, null, 2));

// Customer-language hygiene discovered during the page-by-page polish review.
noMatch(text, /[\u2013\u2014]/, "customer-visible en/em dashes are prohibited");
noMatch(text, /\[object Object\]/i, "raw object serialization is prohibited");
noMatch(text, /\b(?:undefined|null|NaN)\b/i, "raw JS sentinel values are prohibited");
noMatch(text, /none_identified_in_summary/i, "raw snake-case environmental status is prohibited");
noMatch(text, /\bELITE-\d+\b/i, "internal ELITE implementation labels are prohibited on customer surfaces");
noMatch(text, /\bv1\b/i, "internal version shorthand is prohibited on customer surfaces");
noMatch(text, /\bcanonical\b/i, "internal canonical terminology is prohibited on customer surfaces");
noMatch(text, /\bgoverned\b/i, "internal governed engineering terminology is prohibited on customer surfaces");
noMatch(text, /\bIRR\b|\bMOIC\b/i, "unsupported return metrics are prohibited");
noMatch(text, /investment recommendations?/i, "recommendation boilerplate is prohibited");
match(text, /None identified in this summary/i, "accepted environmental status remains visible in human language");
match(text, /Recognized Environmental Conditions \(source summary\)/i, "environmental status retains its source-summary subject");
match(text, /not independent verification of site condition/i, "environmental source boundary remains explicit");

// Global visual system: reduce nested boxes/rules and enforce balanced summary geometry.
match(html, /\.section\s*>\s*\.card\s*\{[^}]*border\s*:\s*0[^}]*padding\s*:\s*0/i, "ordinary sections render without nested card boxes");
match(html, /\.section\[data-iq-elite-operating="overview"\]\s+\.summary-strip\s*\{[^}]*grid-template-columns\s*:\s*repeat\(4/i, "operating overview uses a balanced four-metric rail");
match(html, /\.institutional-visual-grid\s*\{[^}]*grid-template-columns\s*:\s*repeat\(3/i, "operating evidence visuals use balanced three-column geometry");
match(html, /\.summary-strip\s+div\s*\{[^}]*border\s*:\s*0[^}]*border-top/i, "summary metrics avoid boxed-dashboard treatment");
match(html, /\.source-register-table\s+\.source-filename\s*\{[^}]*overflow-wrap\s*:\s*normal[^}]*word-break\s*:\s*normal/i, "legacy base filename rule remains visible for migration detection");
match(html, /\.source-register-table\s+\.source-filename\s*\{[^}]*white-space\s*:\s*normal\s*!important[^}]*overflow-wrap\s*:\s*anywhere\s*!important[^}]*word-break\s*:\s*break-word\s*!important/i, "publication-wide filename overflow protection supersedes the legacy collision-prone rule");
match(html, /Institutional_<wbr>T12_<wbr>Operating_/i, "long source filenames retain controlled soft-break opportunities");

// Known duplicate/orphan surfaces removed or consolidated.
noMatch(text, /Rent Position \/ Whole-Property Value Context/i, "duplicative rent/value orphan surface is removed");
noMatch(text, /Governed Debt Capacity Result/i, "raw governed debt-capacity object row is removed");
noMatch(text, /Governed Binding Constraint/i, "raw governed binding-constraint object row is removed");
match(text, /Sensitivity Families Outside This Driver Matrix/i, "driver-matrix boundaries remain visible without implying absence elsewhere in the report");
match(text, /Proposed-financing interest-rate sensitivity is presented in Debt Capacity & Coverage when accepted proposed financing terms support it/i, "rate-stress cross-reference is accurate and conditional");
match(text, /Scenario Analysis - Not Source Evidence/i, "scenario/evidence boundary remains explicit");
ok((text.match(/Scenario Analysis - Not Source Evidence/gi) || []).length <= 2, "scenario boundary labeling is not repeated on every scenario table");
match(text, /Operating Cost Coverage Ratio/i, "operating GPR-basis coverage metric is precisely labeled");
match(text, /total operating expenses \/ T12 gross potential rent/i, "operating coverage formula is printed");
match(text, /not a point-in-time physical occupancy threshold/i, "operating coverage ratio is not misrepresented as physical occupancy");
noMatch(text, /Occupancy less Break-Even Occupancy/i, "mechanical occupancy spread label is removed");
noMatch(text, /Occupancy vs Operating Break-Even/i, "cross-basis occupancy comparison is removed");
match(text, /Base \$[0-9,]+\s*\|\s*Operating-expense stress/i, "operating-expense driver base retains its dollar sign");
noMatch(text, /Acquisition Request Context/i, "legacy acquisition request presentation is suppressed when transaction intelligence renders");
noMatch(text, /Debt \/ Financing Context/i, "legacy debt context presentation is suppressed when debt intelligence renders");
equal((text.match(/Debt Service and Coverage/gi) || []).length, 1, "debt service coverage renders once");
equal((text.match(/Debt Term and Maturity Analysis/gi) || []).length, 1, "debt maturity analysis renders once");
equal((text.match(/Debt Capacity and Coverage/gi) || []).length, 1, "debt capacity analysis renders once");
noMatch(text, /uploaded support context did not provide display-ready detail/i, "capital plan omission copy cannot contradict rendered renovation detail");
noMatch(text, /Future maturity|Maturity Position\s*future/i, "raw maturity status is removed");
noMatch(text, /-0\.0%/i, "display-rounded negative zero is normalized");
noMatch(text, /Not shown because supporting evidence is unavailable:\s*cap-rate sensitivity/i, "visible scenario sensitivity cannot be called unavailable in valuation");
noMatch(text, /Reduced \/ omitted sections:\s*Core Source Reconciliation|Reduced \/ omitted sections:[\s\S]{0,100}Debt Capacity & Coverage/i, "manifest does not misstate integrated replacement coverage");
match(text, /Tracked Diligence Coverage/i, "diligence summary identifies its tracked scope");
match(text, /not a certification that overall transaction diligence, reserves, closing costs, or analyses outside these tracked areas are complete/i, "diligence counts cannot imply overall completeness");
match(text, /Methodology & Data Transparency/i, "methodology remains compactly included in the Source Appendix");

// Certified seven-chapter architecture remains intact.
const chapterKeys = [
  "committee-overview",
  "operating-performance",
  "scenario-underwriting-drivers",
  "transaction-context",
  "debt-capital-structure",
  "valuation-reconciliation",
  "source-appendix",
];
let previous = -1;
for (const key of chapterKeys) {
  const index = html.indexOf(`data-iq-chapter="${key}"`);
  ok(index > previous, `${key} chapter survives in order`);
  previous = index;
}

// Source-register completeness survives safe wrapping.
for (const filename of [
  "Institutional_T12_Operating_Statement_With_Long_Source_Name.xlsx",
  "Institutional_Rent_Roll_With_Long_Source_Name.xlsx",
  "Institutional_Acquisition_Assumptions_With_Long_Source_Name.pdf",
  "Institutional_Current_Debt_Statement_With_Long_Source_Name.pdf",
  "Institutional_Capital_Plan_With_Long_Source_Name.pdf",
  "Institutional_Appraisal_Context_With_Long_Source_Name.pdf",
  "Institutional_Renovation_Context_With_Long_Source_Name.pdf",
  "Institutional_Market_Survey_Context_With_Long_Source_Name.pdf",
  "Institutional_Phase_I_ESA_Context_With_Long_Source_Name.pdf",
]) {
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  equal((htmlWithoutSoftBreaks.match(new RegExp(escaped, "g")) || []).length, 1, `${filename} appears exactly once`);
}

console.log(`PASS full-underwriting-elite10-full-report-polish-smoke (${checks}/${checks})`);
