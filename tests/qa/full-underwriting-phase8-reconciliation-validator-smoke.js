import assert from 'node:assert/strict';
import { assertScreeningReconciliationArtifact } from '../../scripts/phase8-reconciliation-artifact-contract.js';
import { renderPublicationReconciliationAlert } from '../../api/_lib/investoriq-publication-design-system.js';
import { applyInvestorIqFinalHumanPublicationAuthority } from '../../api/_lib/investoriq-final-human-publication-authority.js';

const expected = { gross_potential_rent: 200000, annual_in_place_rent: 150000 };
const render = () => `<div class="phase8b-reconciliation-block">${renderPublicationReconciliationAlert({
  title: 'Source Reconciliation Required',
  disclosure: 'The two core income bases differ by 25.0%. The Screening remains on hold until the difference is reconciled.',
  metrics: [
    { label: 'T12 Gross Potential Rent', value: '$200,000' },
    { label: 'Rent Roll Annual In-Place', value: '$150,000' },
    { label: 'Difference', value: '($50,000)' },
    { label: 'Variance', value: '-25.0%' },
  ],
})}</div>`;
const html = applyInvestorIqFinalHumanPublicationAuthority(render(), { lane: 'screening' });
assert.doesNotThrow(() => assertScreeningReconciliationArtifact(html, expected));
for (const [name, broken] of [
  ['heading only', '<p>Source Difference Requires Review</p>'],
  ['old heading', render()],
  ['missing disclosure', html.replace(/<p class="iq-callout-copy">[\s\S]*?<\/p>/, '')],
  ['wrong basis', html.replace('$200,000', '$201,000')],
  ['wrong signed difference', html.replace('($50,000)', '$50,000')],
  ['wrong variance', html.replace('-25.0%', '25.0%')],
  ['missing basis', html.replace(/<div class="iq-ic-reconciliation-metric">[\s\S]*?<\/div>/, '')],
  ['comment only', `<!--${html}-->`],
  ['missing hold', html.replace('on hold until the difference is reconciled', 'ready for review')],
]) {
  assert.throws(() => assertScreeningReconciliationArtifact(broken, expected), /PHASE8_SCREENING_RECONCILIATION_MISSING/, name);
}
console.log('full-underwriting-phase8-reconciliation-validator-smoke: PASS (valid disclosure + 9 adverse cases)');
