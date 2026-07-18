import assert from "node:assert/strict";

import {
  validateAcquisitionMemoRenderAgainstBossContract,
} from "../../api/_lib/acquisition-memo-boss-contract.js";
import {
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} from "../../api/_lib/acquisition-memo-v2-customer-surface-model.js";
import { renderCompleteAcquisitionMemoV2Html } from "../../api/_lib/acquisition-memo-v2-document.js";
import { buildInstitutionalGate10ReportFixture } from "./fixtures/institutional-gate-10-report.js";

function visibleText(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const fixture = buildInstitutionalGate10ReportFixture("gate-10v-elite-underwriting-report");
const { html, bossContract, customerSurfaceModel } = fixture;
const text = visibleText(html);

assert.equal(bossContract.coreGate.publishAllowed, true);
assert.equal(validateAcquisitionMemoRenderAgainstBossContract(bossContract, html).ok, true);
assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel).ok, true);
const htmlValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, customerSurfaceModel);
assert.equal(htmlValidation.ok, true, JSON.stringify(htmlValidation.issues, null, 2));

for (const sectionName of ["appraisalContext", "renovationContext", "marketSurveyContext", "environmentalContext"]) {
  assert.equal(bossContract.sections[sectionName].status, "required", sectionName);
  assert.equal(customerSurfaceModel.sections[sectionName].status, "required", sectionName);
  assert.equal(customerSurfaceModel.sections[sectionName].factAvailability.sourceBacked, true, sectionName);
}

assert.deepEqual(customerSurfaceModel.sections.appraisalContext.facts, {
  appraisal_value: 14200000,
  stabilized_cap_rate: 0.074,
  stabilized_noi: 1050000,
});
assert.deepEqual(customerSurfaceModel.sections.marketSurveyContext.facts.market_rent_ranges, [
  { unit_type: "1BR", low_monthly_rent: 2100, high_monthly_rent: 2250 },
  { unit_type: "2BR", low_monthly_rent: 2500, high_monthly_rent: 2700 },
]);
assert.equal(customerSurfaceModel.sections.environmentalContext.facts.phase_i_status, "none_identified_in_summary");
assert.equal(customerSurfaceModel.sections.renovationContext.facts.renovation_plan_rows[0].cost_per_unit, 18500);
assert.equal(customerSurfaceModel.sections.renovationContext.facts.renovation_plan_rows[0].stated_amount, null);

for (const exactSurface of [
  "UNDERWRITING REPORT",
  "Investment Committee Overview",
  "Transaction Context",
  "Valuation & Reconciliation",
  "$14,200,000",
  "$1,050,000",
  "7.4%",
  "$1,280,000",
  "$18,500 / unit",
  "$225 / month",
  "Months 1-18",
  "$2,100",
  "$2,250",
  "$2,500",
  "$2,700",
  "None identified in this summary",
  "34.4%",
]) {
  assert.match(text, new RegExp(exactSurface.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), exactSurface);
}
assert.doesNotMatch(text, /Acquisition Memo|Capital Intelligence Memorandum/i);
assert.doesNotMatch(text, /\$370,000|\$432,000/);
assert.doesNotMatch(text, /renovation roi|payback|refi|refinance|value impact/i);
assert.doesNotMatch(text, /Institutional Gate 10 Property\s*\|\s*100 Main Street\s*\|\s*Institutional Gate 10 Property/i);

const chapterOrder = [
  "committee-overview",
  "operating-performance",
  "transaction-context",
  "debt-capital-structure",
  "valuation-reconciliation",
  "source-appendix",
].map((chapter) => html.indexOf(`data-iq-chapter="${chapter}"`));
assert.ok(chapterOrder.every((index) => index >= 0));
assert.deepEqual([...chapterOrder].sort((left, right) => left - right), chapterOrder);
assert.match(html, /\.no-break\s*\{[^}]*break-inside:avoid-page;[^}]*page-break-inside:avoid;/i);
assert.match(html, /\.allow-break\s*\{[^}]*break-inside:auto;[^}]*page-break-inside:auto;/i);
assert.match(html, /class="card allow-break"[\s\S]*class="detail-table source-register-table"[\s\S]*<thead>/i);
assert.match(html, /\.source-register-table thead\s*\{\s*display:table-header-group;/i);

const collapsedMarketBoss = {
  ...bossContract,
  sections: {
    ...bossContract.sections,
    marketSurveyContext: {
      ...bossContract.sections.marketSurveyContext,
      status: "collapsed",
      requiredFacts: [],
      factAvailability: {
        ...bossContract.sections.marketSurveyContext.factAvailability,
        required: [],
        sourceBacked: false,
      },
    },
  },
};
const collapsedMarketModel = {
  ...customerSurfaceModel,
  sections: {
    ...customerSurfaceModel.sections,
    marketSurveyContext: {
      ...customerSurfaceModel.sections.marketSurveyContext,
      status: "collapsed",
      facts: { market_rent_ranges: [] },
      requiredFacts: [],
      factAvailability: {
        ...customerSurfaceModel.sections.marketSurveyContext.factAvailability,
        required: [],
        available: [],
        missing: [],
        sourceBacked: false,
      },
    },
  },
};
const collapsedHtml = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: fixture.acquisitionMemoProjection,
  renderedAcquisitionMemo: fixture.renderedAcquisitionMemo,
  sourcePackage: fixture.sourcePackage,
  t12Payload: fixture.sourceTruthPackage.core.t12.accepted_facts,
  coreMetrics: fixture.coreMetrics,
  reportMeta: fixture.reportMeta,
  propertyProfile: fixture.propertyProfile,
  bossContract: collapsedMarketBoss,
  customerSurfaceModel: collapsedMarketModel,
  financialIntelligence: fixture.financialIntelligence,
});
assert.match(visibleText(collapsedHtml), /UNDERWRITING REPORT/i);
assert.match(visibleText(collapsedHtml), /\$945,000/);
assert.doesNotMatch(visibleText(collapsedHtml), /Low Monthly Rent|High Monthly Rent|\$2,100|\$2,250|\$2,500|\$2,700/i);
assert.equal(collapsedMarketBoss.coreGate.publishAllowed, true);

console.log("Gate 10V elite underwriting report smoke PASS");
