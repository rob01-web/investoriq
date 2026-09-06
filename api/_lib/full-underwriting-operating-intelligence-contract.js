import {
  buildFullUnderwritingOperatingIntelligenceContract as buildBaseOperatingIntelligenceContract,
  validateFullUnderwritingOperatingIntelligenceContract as validateBaseOperatingIntelligenceContract,
  FULL_UNDERWRITING_OPERATING_INTELLIGENCE_VERSION,
  FULL_UNDERWRITING_OPERATING_INTELLIGENCE_EVIDENCE_CLASSES,
} from "./full-underwriting-operating-intelligence-contract-base.js";

export {
  FULL_UNDERWRITING_OPERATING_INTELLIGENCE_VERSION,
  FULL_UNDERWRITING_OPERATING_INTELLIGENCE_EVIDENCE_CLASSES,
} from "./full-underwriting-operating-intelligence-contract-base.js";

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function removeCrossBasisOccupancyComparison(contract) {
  const qualification = "Formula: accepted operating expenses / accepted T12 gross potential rent. This is a GPR-basis operating-cost ratio, not a physical occupancy threshold.";
  for (const receipt of [contract?.metrics?.breakEvenOccupancy, contract?.noiAnalysis?.breakEvenOccupancy]) {
    if (receipt?.displayReady === true) {
      receipt.label = "Operating Cost Coverage Ratio";
      receipt.qualification = qualification;
    }
  }

  for (const receipt of [contract?.metrics?.occupancyBreakEvenSpread, contract?.noiAnalysis?.occupancyBreakEvenSpread]) {
    if (!receipt) continue;
    receipt.label = "Physical Occupancy Comparison Not Applicable";
    receipt.value = null;
    receipt.displayReady = false;
    receipt.evidenceClass = FULL_UNDERWRITING_OPERATING_INTELLIGENCE_EVIDENCE_CLASSES.MISSING_UNSUPPORTED;
    receipt.authorityPath = null;
    receipt.formula = null;
    receipt.inputs = null;
    receipt.provenance = [];
    receipt.qualification = "Physical occupancy is not subtracted from a GPR-basis operating-cost ratio.";
  }

  if (Array.isArray(contract?.operatingInterpretation?.items)) {
    contract.operatingInterpretation.items = contract.operatingInterpretation.items.filter(
      (item) => item?.code !== "OCCUPANCY_BREAK_EVEN_POSITION"
    );
  }
  const surviving = contract?.sectionDispositions?.noiAnalysis?.minimumSurvivingFactKeys;
  if (Array.isArray(surviving)) {
    contract.sectionDispositions.noiAnalysis.minimumSurvivingFactKeys = surviving.filter(
      (key) => key !== "occupancyBreakEvenSpread"
    );
  }
}

function addTieAwareUnitConcentration(contract) {
  const concentration = contract?.unitRentConcentration;
  const rows = Array.isArray(concentration?.rows)
    ? concentration.rows.filter((row) => Number.isFinite(Number(row?.unitShare)))
    : [];
  if (!rows.length) return;

  const maxShare = Math.max(...rows.map((row) => Number(row.unitShare)));
  const leaders = rows.filter((row) => Math.abs(Number(row.unitShare) - maxShare) <= 1e-12);
  concentration.largestUnitCategories = leaders;
  concentration.largestUnitCategoryTied = leaders.length > 1;
  concentration.largestUnitCategoryUnique = leaders.length === 1;

  const interpretation = Array.isArray(contract?.operatingInterpretation?.items)
    ? contract.operatingInterpretation.items.find((item) => item?.code === "UNIT_MIX_CONCENTRATION")
    : null;
  if (!interpretation || leaders.length <= 1) return;

  const labels = leaders.map((row) => row.label).filter(Boolean);
  interpretation.statement = `${labels.join(" and ")} are tied as the largest accepted unit categories at ${(maxShare * 100).toFixed(1)}% each of units represented in the accepted unit mix.`;
  interpretation.provenance = [...new Set(leaders.map((row) => row.authorityPath).filter(Boolean))];
  interpretation.qualification = "No single largest unit category is asserted when multiple accepted categories share the maximum unit count.";
}

export function buildFullUnderwritingOperatingIntelligenceContract(args = {}) {
  const contract = clone(buildBaseOperatingIntelligenceContract(args));
  removeCrossBasisOccupancyComparison(contract);
  addTieAwareUnitConcentration(contract);
  return deepFreeze(contract);
}

export function validateFullUnderwritingOperatingIntelligenceContract(contract) {
  return validateBaseOperatingIntelligenceContract(contract);
}

export default buildFullUnderwritingOperatingIntelligenceContract;
