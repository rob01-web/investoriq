import assert from 'node:assert/strict';
import { buildInstitutionalGate10ReportFixture } from './fixtures/institutional-gate-10-report.js';
import { validateAcquisitionMemoRenderAgainstBossContract } from '../../api/_lib/acquisition-memo-boss-contract.js';
import { validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel } from '../../api/_lib/acquisition-memo-v2-customer-surface-model.js';

function visibleText(html) {
  return String(html || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const fixture = buildInstitutionalGate10ReportFixture('gate-10b-information-architecture');
const { html, bossContract, customerSurfaceModel } = fixture;
const htmlWithoutSoftBreaks = String(html || "").replace(/<wbr\s*\/?\s*>/gi, "");
const text = visibleText(html);

assert.equal(validateAcquisitionMemoRenderAgainstBossContract(bossContract, html).ok, true);
const customerValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, customerSurfaceModel);
assert.equal(customerValidation.ok, true, JSON.stringify(customerValidation.issues, null, 2));

const chapterKeys = [
  'committee-overview',
  'operating-performance',
  'transaction-context',
  'debt-capital-structure',
  'valuation-reconciliation',
  'source-appendix',
];
let previousChapterIndex = -1;
for (const key of chapterKeys) {
  const index = html.indexOf(`data-iq-chapter="${key}"`);
  assert.ok(index > previousChapterIndex, `${key} chapter is missing or out of order`);
  previousChapterIndex = index;
}

for (const redundantHeading of [
  'Acquisition Memo Summary',
  'Operating Snapshot',
  'Operating Support',
  'Rent Position Support',
  'Key Upside Drivers',
]) {
  assert.doesNotMatch(text, new RegExp(redundantHeading, 'i'));
}
assert.match(text, /Underwriting Observations/i);
assert.match(text, /Underwriting Report/i);
assert.doesNotMatch(text, /Capital Intelligence Memorandum/i);
assert.doesNotMatch(html, /<td>ACQUISITION MEMO<\/td><td[^>]*>InvestorIQ<\/td>/i);
assert.match(html, /<span>Property Scale<\/span><strong>64 Units<\/strong>/i);
assert.doesNotMatch(html, /<span>Asset Class<\/span><strong>64-Unit<\/strong>/i);

for (const internalPhrase of [
  /canonical source truth/i,
  /canonical rent roll/i,
  /fact bundle/i,
  /source-backed/i,
  /parser/i,
  /authority object/i,
]) {
  assert.doesNotMatch(text, internalPhrase);
}

for (const filename of [
  'Institutional_T12_Operating_Statement_With_Long_Source_Name.xlsx',
  'Institutional_Rent_Roll_With_Long_Source_Name.xlsx',
  'Institutional_Acquisition_Assumptions_With_Long_Source_Name.pdf',
  'Institutional_Current_Debt_Statement_With_Long_Source_Name.pdf',
  'Institutional_Capital_Plan_With_Long_Source_Name.pdf',
]) {
  assert.equal((htmlWithoutSoftBreaks.match(new RegExp(filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1);
}

for (const requiredValue of [
  '$945,000',
  '$1,432,800',
  '$1,718,400',
  '$13,500,000',
  '$6,800,000',
  '$9,450,000',
]) {
  assert.match(text, new RegExp(requiredValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

console.log('institutional-pdf-information-architecture-smoke: PASS');
