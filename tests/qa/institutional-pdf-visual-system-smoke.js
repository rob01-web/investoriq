import assert from 'node:assert/strict';
import { buildCapRateValueTable } from '../../api/_lib/acquisition-memo-v2-document.js';
import { buildInstitutionalGate10ReportFixture } from './fixtures/institutional-gate-10-report.js';

const fixture = buildInstitutionalGate10ReportFixture('gate-10c-visual-system');
const { html } = fixture;

assert.match(html, /data-iq-visual-system="institutional-v1"/i);
for (const chartKey of [
  'operating-income-composition',
  'annual-rent-position',
  'unit-rent-position',
  'debt-service-and-coverage',
]) {
  assert.match(html, new RegExp(`data-iq-chart="${chartKey}"`, 'i'));
  assert.match(html, new RegExp(`data-iq-chart-receipt="${chartKey}"`, 'i'));
}

for (const exactValue of [1500000, 555000, 945000, 1432800, 1718400, 1850, 2050, 1881.25, 2425, 471000, 676249.2, 2.01, 1.4]) {
  assert.match(html, new RegExp(`data-iq-value="${String(exactValue).replace('.', '\\.')}"`, 'i'));
}

for (const sourcePath of [
  'core.t12.accepted_facts.effective_gross_income',
  'core.t12.accepted_facts.total_operating_expenses',
  'core.t12.accepted_facts.net_operating_income',
  'core.rent_roll.accepted_facts.annual_in_place_rent',
  'core.rent_roll.accepted_facts.annual_market_rent',
  'customerSections.debtServiceCoverage.facts.currentDebt',
  'customerSections.debtServiceCoverage.facts.proposedFinancing',
]) {
  assert.match(html, new RegExp(sourcePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
}

assert.match(html, /data-iq-section="eliteValuationReconciliation"/i);
assert.match(html, /data-iq-subsection="accepted-value-indication"/i);
assert.match(html, /Accepted T12 NOI[\s\S]{0,180}\$945,000/i);
assert.match(html, /Accepted Going-In Cap Rate[\s\S]{0,180}7\.00%/i);
assert.match(html, /InvestorIQ Implied Value[\s\S]{0,180}\$13,500,000/i);
assert.match(html, /Implied Value Per Unit[\s\S]{0,180}\$210,938/i);
assert.equal((html.match(/data-iq-cap-rate-row="accepted"/gi) || []).length, 0);
assert.doesNotMatch(html, /<tr[^>]*><td>5\.0%<\/td>/i);
assert.doesNotMatch(html, /<tr[^>]*><td>6\.0%<\/td>/i);
assert.doesNotMatch(html, /standardized framework benchmark/i);
assert.doesNotMatch(html, /traffic[- ]light|risk threshold|stress scenario/i);

const exactTable = buildCapRateValueTable(945000, 64, 0.065, {
  formatCurrency: (value) => `$${Math.round(value).toLocaleString('en-US')}`,
  formatCapPercentExact: (value) => `${(value * 100).toFixed(1)}%`,
});
assert.match(exactTable, /6\.5%/i);
assert.equal((exactTable.match(/data-iq-cap-rate-row="accepted"/gi) || []).length, 1);
assert.doesNotMatch(exactTable, /5\.0%|6\.0%|7\.0%/i);
assert.equal(buildCapRateValueTable(945000, 64, null, {
  formatCurrency: (value) => `$${Math.round(value).toLocaleString('en-US')}`,
  formatCapPercentExact: (value) => `${(value * 100).toFixed(1)}%`,
}), '');

console.log('institutional-pdf-visual-system-smoke: PASS');
