import {
  buildFullUnderwritingDebtIntelligenceV1 as buildBaseDebtIntelligenceV1,
  validateFullUnderwritingDebtIntelligenceV1 as validateBaseDebtIntelligenceV1,
  FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION,
  FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION,
  FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_V1,
  FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES,
} from "./full-underwriting-debt-intelligence-v1-base.js";

export {
  FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION,
  FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION,
  FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_V1,
  FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES,
} from "./full-underwriting-debt-intelligence-v1-base.js";

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function governDebtCoverageBasis(contract) {
  const metrics = contract?.capacityInterpretation?.metrics || {};
  const labels = [
    ["currentDebtInclusiveBreakEvenOccupancy", "Current Debt-Inclusive Cost Coverage Ratio"],
    ["proposedDebtInclusiveBreakEvenOccupancy", "Proposed Debt-Inclusive Cost Coverage Ratio"],
  ];
  for (const [key, label] of labels) {
    const receipt = metrics[key];
    if (!receipt?.displayReady) continue;
    receipt.label = label;
    receipt.formula = "(accepted_t12_operating_expenses + annual_debt_service) / accepted_t12_gross_potential_rent";
    receipt.qualification = "GPR-basis debt-inclusive cost coverage ratio. It is not a physical occupancy threshold and is not compared with accepted physical occupancy.";
  }

  if (Array.isArray(contract?.capacityInterpretation?.observations)) {
    contract.capacityInterpretation.observations = contract.capacityInterpretation.observations.filter(
      (item) => item?.key !== "occupancy_vs_debt_break_even"
    );
  }
  if (contract?.capacityInterpretation) {
    contract.capacityInterpretation.qualification = "Debt-capacity interpretation uses deterministic lender-style metrics from accepted inputs. No lender covenant, physical occupancy threshold, credit grade, or investment threshold is inferred.";
  }
  const surviving = contract?.sectionDispositions?.capacityInterpretation?.minimumSurvivingFactKeys;
  if (Array.isArray(surviving)) {
    contract.sectionDispositions.capacityInterpretation.minimumSurvivingFactKeys = surviving.map((item) =>
      item === "debt-inclusive break-even" ? "debt-inclusive cost coverage" : item
    );
  }
}

export function buildFullUnderwritingDebtIntelligenceV1(args = {}) {
  const contract = clone(buildBaseDebtIntelligenceV1(args));
  governDebtCoverageBasis(contract);
  const validation = validateBaseDebtIntelligenceV1(contract);
  if (!validation.ok) {
    throw new Error(`ELITE_DEBT_CONTRACT_INVALID:${validation.issues.join("|")}`);
  }
  return deepFreeze(contract);
}

export function validateFullUnderwritingDebtIntelligenceV1(contract = null) {
  return validateBaseDebtIntelligenceV1(contract);
}

export default {
  FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION,
  FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION,
  FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_V1,
  FULL_UNDERWRITING_DEBT_EVIDENCE_CLASSES,
  buildFullUnderwritingDebtIntelligenceV1,
  validateFullUnderwritingDebtIntelligenceV1,
};
