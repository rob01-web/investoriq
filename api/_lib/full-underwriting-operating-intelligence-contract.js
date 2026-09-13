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
  addTieAwareUnitConcentration(contract);
  return deepFreeze(contract);
}

export function validateFullUnderwritingOperatingIntelligenceContract(contract) {
  return validateBaseOperatingIntelligenceContract(contract);
}

export default buildFullUnderwritingOperatingIntelligenceContract;
