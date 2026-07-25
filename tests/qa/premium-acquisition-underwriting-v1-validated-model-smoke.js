import assert from 'node:assert/strict';

import { buildInstitutionalGate10ReportFixture } from './fixtures/institutional-gate-10-report.js';
import {
  buildCanonicalReportIdentityReceipt,
} from '../../api/_lib/report-identity-authority.js';
import {
  buildCanonicalInstitutionalFinancialIntelligence,
} from '../../api/_lib/institutional-financial-intelligence.js';
import {
  buildCanonicalInstitutionalUnderwritingScenarioPolicyContract,
} from '../../api/_lib/institutional-underwriting-scenario-policy-contract.js';
import {
  buildCanonicalInstitutionalUnderwritingInputContract,
} from '../../api/_lib/institutional-underwriting-input-contract.js';
import {
  buildDeterministicSourceCaseUnderwritingAnalysis,
} from '../../api/_lib/deterministic-source-case-underwriting-analysis.js';
import {
  buildDeterministicAcquisitionValuationAnalysis,
} from '../../api/_lib/deterministic-acquisition-valuation-analysis.js';
import {
  buildDeterministicAcquisitionCapitalStructureAnalysis,
} from '../../api/_lib/deterministic-acquisition-capital-structure-analysis.js';
import {
  buildPremiumAcquisitionUnderwritingV1ValidatedModel,
  validatePremiumAcquisitionUnderwritingV1ValidatedModel,
} from '../../api/_lib/premium-acquisition-underwriting-v1-validated-model.js';

function canonicalSourceTruth(jobId = 'premium-validated-model-job') {
  const sourceTruth = structuredClone(
    buildInstitutionalGate10ReportFixture(jobId).sourceTruthPackage,
  );
  for (const entry of sourceTruth.support.accepted) {
    entry.artifact_id ||= `${entry.file_id}-artifact`;
    entry.fact_conflicts = [];
    entry.authority_decision.fileId = entry.file_id;
  }
  const appraisal = sourceTruth.support.accepted.find(
    (entry) => entry.canonical_role === 'appraisal_context',
  );
  appraisal.accepted_facts = {
    appraised_value: appraisal.accepted_facts.appraisal_value,
    appraisal_noi: appraisal.accepted_facts.stabilized_noi,
    appraisal_cap_rate: appraisal.accepted_facts.stabilized_cap_rate,
  };
  appraisal.accepted_fact_evidence = {
    appraised_value: appraisal.accepted_fact_evidence.appraisal_value,
    appraisal_noi: appraisal.accepted_fact_evidence.stabilized_noi,
    appraisal_cap_rate: appraisal.accepted_fact_evidence.stabilized_cap_rate,
  };
  appraisal.authority_decision.acceptedFacts = appraisal.accepted_facts;
  appraisal.authority_decision.acceptedFactEvidence = appraisal.accepted_fact_evidence;
  sourceTruth.core.rent_roll.accepted_facts.unit_mix = [
    {
      label: '1BR',
      count: 32,
      current_rent: 1850,
      market_rent: 2050,
      avg_sqft: 720,
      occupied_count: 30,
      vacant_count: 2,
    },
    {
      label: '2BR',
      count: 32,
      current_rent: 1881.25,
      market_rent: 2425,
      avg_sqft: 940,
    },
  ];
  sourceTruth.support.adjudication_decisions = sourceTruth.support.accepted.map(
    (entry) => entry.authority_decision,
  );
  return sourceTruth;
}

function buildInputs(sourceTruthPackage = canonicalSourceTruth()) {
  const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
    sourceTruthPackage,
    asOfDate: '2026-07-25',
  });
  const underwritingInputContract = buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage,
    financialIntelligence,
    scenarioPolicyContract: buildCanonicalInstitutionalUnderwritingScenarioPolicyContract(),
  });
  return {
    sourceTruthPackage,
    reportIdentityReceipt: buildCanonicalReportIdentityReceipt({
      reportMode: 'v1_core',
      reportType: 'underwriting',
    }),
    financialIntelligence,
    underwritingInputContract,
    sourceCaseAnalysis: buildDeterministicSourceCaseUnderwritingAnalysis({
      underwritingInputContract,
    }),
    valuationAnalysis: buildDeterministicAcquisitionValuationAnalysis({
      underwritingInputContract,
    }),
    capitalStructureAnalysis: buildDeterministicAcquisitionCapitalStructureAnalysis({
      underwritingInputContract,
    }),
  };
}

const inputs = buildInputs();
const model = buildPremiumAcquisitionUnderwritingV1ValidatedModel(inputs);

assert.equal(model.validation.ok, true);
assert.equal(model.validation.status, 'valid_disconnected_expansion_model');
assert.equal(model.validation.premiumCertified, false);
assert.equal(model.validation.certificationStage, 'not_started');
assert.ok(model.validation.eligibleSectionCount >= 10);
assert.equal(model.phase, 'validated_disconnected_expansion_model');
assert.equal(model.identity.canonicalTitle, 'Underwriting Report');
assert.equal(model.integration.connected, false);
assert.equal(model.integration.rendererInsertionPresent, false);
assert.equal(model.integration.featureFlagEvaluated, false);
assert.equal(model.certification.premiumCertified, false);
assert.equal(model.certification.coreDeliveryEligibilityChanged, false);
assert.equal(model.reportPublicationBlocker, false);
assert.equal(Object.isFrozen(model), true);
assert.equal(Object.isFrozen(model.sections.operatingPerformance), true);

assert.equal(model.policy.canonicalReceiptsOnly, true);
assert.equal(model.policy.rendererRecalculationAllowed, false);
assert.equal(model.policy.rawUploadsRetained, false);
assert.equal(model.policy.customerSurfaceModelConsumed, false);
assert.equal(model.policy.renderedHtmlConsumed, false);
assert.equal(model.policy.missingEvidenceCollapses, true);
assert.equal(model.policy.recommendationsAllowed, false);
assert.equal(model.policy.scenarioInferenceAllowed, false);
assert.equal(model.policy.premiumCertificationSeparateFromCoreDelivery, true);

const operatingFacts = model.sections.operatingPerformance.facts;
assert.equal(
  operatingFacts.find((fact) => fact.factKey === 'net_operating_income').value,
  945000,
);
assert.equal(
  model.sections.rentRollAndUnitEconomics.facts
    .find((fact) => fact.factKey === 'unit_mix').value.length,
  2,
);
assert.equal(
  model.sections.expenseStructure.facts
    .find((fact) => fact.factKey === 'expense_lines').value.length,
  6,
);
assert.equal(
  model.sections.capitalPlanEvidence.facts
    .find((fact) => fact.factKey === 'renovation_plan_rows').value.length,
  3,
);
assert.equal(
  model.sections.marketEvidence.facts
    .find((fact) => fact.factKey === 'market_rent_ranges').value.length,
  2,
);
assert.equal(
  model.sections.environmentalEvidence.facts
    .find((fact) => fact.factKey === 'phase_i_status').value,
  'none_identified_in_summary',
);

const debtFacts = model.sections.currentAndProposedDebt.facts;
assert.equal(
  debtFacts.find((fact) => fact.factKey === 'current_outstanding_balance').debtRole,
  'current_debt',
);
assert.equal(
  debtFacts.find((fact) => fact.factKey === 'proposed_loan_amount').debtRole,
  'proposed_acquisition_debt',
);
assert.equal(
  model.sections.propertyAndTransactionContext.facts
    .find((fact) => fact.factKey === 'purchase_price').debtRole,
  null,
);

const calculations = Object.values(model.sections).flatMap(
  (section) => section.calculations,
);
assert.equal(
  calculations.find(
    (receipt) => receipt.calculationKey === 'purchasePriceLessProposedLoan',
  ).label,
  'Minimum Purchase-Price Equity Before Transaction Costs',
);
assert.equal(
  calculations.find(
    (receipt) => receipt.calculationKey === 'proposedAcquisitionDebtYield',
  ).result,
  0.1,
);
assert.equal(
  calculations.find(
    (receipt) => receipt.calculationKey === 'currentDebtDscr',
  ).result,
  2.006369,
);
assert.equal(
  calculations.every(
    (receipt) =>
      receipt.customerSurfaceAuthorized === false &&
      receipt.rendererEligible === false &&
      receipt.reportPublicationBlocker === false,
  ),
  true,
);
assert.equal(
  calculations.some((receipt) => /irr|equityMultiple|cashOnCash/i.test(receipt.calculationKey)),
  false,
);

const evidenceRows = model.sections.evidenceAndDiligenceRegister.facts
  .find((fact) => fact.factKey === 'evidence_and_diligence_register').value;
assert.equal(evidenceRows.length, inputs.sourceTruthPackage.support.accepted.length);
assert.equal(evidenceRows.every((row) => row.severity === null), true);
assert.equal(evidenceRows.every((row) => row.recommendation === null), true);

const reconciliation = model.sections.sourceReconciliation.facts
  .find((fact) => fact.factKey === 'source_reconciliation').value;
assert.match(reconciliation.disclosure, /has not reconciled/i);
assert.equal(reconciliation.differenceAmount, -180000);
assert.equal(model.sections.executiveUnderwritingSummary.status, 'collapsed');
assert.equal(model.sections.executiveUnderwritingSummary.customerSurfaceEligible, false);
assert.equal(
  model.sections.executiveUnderwritingSummary.collapseReason,
  'NO_ELIGIBLE_ACCEPTED_EVIDENCE',
);

const invalidIdentity = {
  ...inputs,
  reportIdentityReceipt: buildCanonicalReportIdentityReceipt({
    reportMode: 'screening_v1',
    reportType: 'screening',
  }),
};
assert.throws(
  () => buildPremiumAcquisitionUnderwritingV1ValidatedModel(invalidIdentity),
  /CANONICAL_UNDERWRITING_REPORT_IDENTITY_REQUIRED/,
);

const tampered = structuredClone(model);
tampered.sections.operatingPerformance.calculations.push({
  calculationKey: 'irr',
  status: 'calculated',
  sourceBound: true,
  result: 0.2,
  inputProvenance: [{}],
  customerSurfaceAuthorized: false,
  rendererEligible: false,
  reportPublicationBlocker: false,
});
const tamperedValidation = validatePremiumAcquisitionUnderwritingV1ValidatedModel(tampered);
assert.equal(tamperedValidation.ok, false);
assert.equal(
  tamperedValidation.issues.some(
    (issue) => issue.code === 'PREMIUM_UNAUTHORIZED_CALCULATION_PRESENT',
  ),
  true,
);

const mismatchedSourceTruth = {
  ...inputs,
  sourceTruthPackage: {
    ...inputs.sourceTruthPackage,
    job_id: 'different-model-job',
  },
};
assert.throws(
  () => buildPremiumAcquisitionUnderwritingV1ValidatedModel(mismatchedSourceTruth),
  /UPSTREAM_JOB_IDENTITY_MISMATCH/,
);

console.log('premium-acquisition-underwriting-v1 validated-model smoke passed');
