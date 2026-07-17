import { buildCanonicalSourceTruthPackage } from '../../../api/_lib/source-truth-package.js';
import { buildCanonicalInstitutionalFinancialIntelligence } from '../../../api/_lib/institutional-financial-intelligence.js';
import { buildCanonicalInstitutionalUnderwritingScenarioPolicyContract } from '../../../api/_lib/institutional-underwriting-scenario-policy-contract.js';
import { buildCanonicalInstitutionalUnderwritingInputContract } from '../../../api/_lib/institutional-underwriting-input-contract.js';
import { buildDeterministicSourceCaseUnderwritingAnalysis } from '../../../api/_lib/deterministic-source-case-underwriting-analysis.js';
import { buildDeterministicAcquisitionValuationAnalysis } from '../../../api/_lib/deterministic-acquisition-valuation-analysis.js';
import { buildDeterministicAcquisitionCapitalStructureAnalysis } from '../../../api/_lib/deterministic-acquisition-capital-structure-analysis.js';
import { buildCanonicalInstitutionalUnderwritingReturnReadinessContract } from '../../../api/_lib/institutional-underwriting-return-readiness-contract.js';
import { buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract } from '../../../api/_lib/institutional-investment-committee-memo-authority-contract.js';
import { buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract } from '../../../api/_lib/institutional-investment-committee-memo-methodology-contract.js';
import { buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract } from '../../../api/_lib/institutional-investment-committee-memo-component-evidence-contract.js';
import { buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract } from '../../../api/_lib/institutional-investment-committee-memo-dependency-sequencing-contract.js';
import { buildCanonicalInstitutionalScenarioEngineInputAuthorityContract } from '../../../api/_lib/institutional-scenario-engine-input-authority-contract.js';
import { buildCanonicalInstitutionalScenarioEngineStressSetAuthorityContract } from '../../../api/_lib/institutional-scenario-engine-stress-set-authority-contract.js';
import { buildCanonicalInstitutionalScenarioEngineFormulaEligibilityContract } from '../../../api/_lib/institutional-scenario-engine-formula-eligibility-contract.js';
import { buildCanonicalInstitutionalScenarioEngineExecutionContract } from '../../../api/_lib/institutional-scenario-engine-execution-contract.js';

export function buildGate7SourceTruth(jobId = 'gate-7-chain-job') {
  return buildCanonicalSourceTruthPackage({
    jobId,
    propertyName: 'Gate 7 Chain Property',
    artifacts: [
      {
        id: 't12-artifact',
        file_id: 't12-file',
        original_filename: 'Operating Statement.xlsx',
        type: 't12_parsed',
        payload: {
          validated: true,
          gross_potential_rent: 1718400,
          effective_gross_income: 1500000,
          total_operating_expenses: 555000,
          net_operating_income: 945000,
          income_lines: [{ label: 'Effective Gross Income', amount: 1500000 }],
          expense_lines: [{ label: 'Operating Expenses', amount: 555000 }],
        },
      },
      {
        id: 'rent-roll-artifact',
        file_id: 'rent-roll-file',
        original_filename: 'Rent Roll.xlsx',
        type: 'rent_roll_parsed',
        payload: {
          validated: true,
          total_units: 64,
          occupancy: 0.9375,
          annual_in_place_rent: 1432800,
          annual_market_rent: 1718400,
          unit_mix: [{ label: 'All Units', count: 64 }],
          units: [{ unit_number: '101', current_rent: 1865.625, market_rent: 2237.5 }],
        },
      },
    ],
  });
}

export function buildCanonicalGate7B(jobId = 'gate-7-chain-job') {
  const sourceTruthPackage = buildGate7SourceTruth(jobId);
  const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
    sourceTruthPackage,
    asOfDate: '2026-07-17',
  });
  const underwritingInputContract = buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage,
    financialIntelligence,
    scenarioPolicyContract: buildCanonicalInstitutionalUnderwritingScenarioPolicyContract(),
  });
  const returnReadinessContract = buildCanonicalInstitutionalUnderwritingReturnReadinessContract({
    sourceCaseAnalysis: buildDeterministicSourceCaseUnderwritingAnalysis({ underwritingInputContract }),
    valuationAnalysis: buildDeterministicAcquisitionValuationAnalysis({ underwritingInputContract }),
    capitalStructureAnalysis: buildDeterministicAcquisitionCapitalStructureAnalysis({ underwritingInputContract }),
  });
  const memoAuthorityContract = buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract({
    returnReadinessContract,
  });
  const methodologyContract = buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract({
    memoAuthorityContract,
  });
  const componentEvidenceContract = buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract({
    methodologyContract,
  });
  const dependencySequencingContract =
    buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract({
      componentEvidenceContract,
    });
  const inputAuthorityContract = buildCanonicalInstitutionalScenarioEngineInputAuthorityContract({
    dependencySequencingContract,
  });
  return buildCanonicalInstitutionalScenarioEngineStressSetAuthorityContract({
    inputAuthorityContract,
  });
}

export function buildCanonicalGate7C(jobId = 'gate-7-chain-job') {
  return buildCanonicalInstitutionalScenarioEngineFormulaEligibilityContract({
    stressSetAuthorityContract: buildCanonicalGate7B(jobId),
  });
}

export function buildCanonicalGate7D(jobId = 'gate-7-chain-job') {
  return buildCanonicalInstitutionalScenarioEngineExecutionContract({
    formulaEligibilityContract: buildCanonicalGate7C(jobId),
  });
}
