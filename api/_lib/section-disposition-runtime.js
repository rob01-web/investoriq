/**
 * Gate 2 runtime consumer wiring for section-disposition-contract-v1.
 * Does not redesign the contract. Applies dispositions, compact HTML,
 * intentional-disposition PDF Boss filtering, and single semantic recomposition.
 */
import {
  SECTION_DISPOSITION_CONTRACT_VERSION,
  SECTION_DISPOSITIONS,
  SECTION_CLASSIFICATIONS,
  DETAILED_LINEAGE_PLACEMENTS,
  applySectionDisposition,
  buildDispositionManifestEntry,
  compactDenseSourceTablesInApprovedHtml,
  isCollapseEligibleBossIssue,
} from "./section-disposition-contract.js";

export const GATE2_CSS_RECOVERY_MAX = 1;
export const GATE2_SEMANTIC_RECOMPOSITION_MAX = 1;

/** Lender-useful Debt Capacity minimum surviving fact keys when available. */
export const DEBT_CAPACITY_MINIMUM_FACT_KEYS = Object.freeze([
  "proposedMortgageConstant",
  "proposedDebtYield",
  "dscr",
  "ltv",
  "debtCapacityResult",
  "bindingConstraint",
  "breakEvenMetrics",
  "proposedDebtInclusiveBreakEvenOccupancy",
  "currentDebtInclusiveBreakEvenOccupancy",
  "proposedDebtInclusiveBreakEvenMonthlyRentPerUnit",
  "currentDebtInclusiveBreakEvenMonthlyRentPerUnit",
]);

export function resolveGovernedSurfaceDisposition({
  sectionKey = "",
  classification = SECTION_CLASSIFICATIONS.ANALYTICAL,
  availableFactKeys = [],
  requiredFactKeys = [],
  sourceBacked = false,
  compactRendererEligible = false,
  preferCompact = false,
} = {}) {
  const available = new Set((availableFactKeys || []).map(String));
  const required = (requiredFactKeys || []).map(String);
  const missing = required.filter((k) => !available.has(k));
  const hasAny = available.size > 0 || sourceBacked === true;

  let requested = SECTION_DISPOSITIONS.INCLUDE;
  if (!hasAny && classification === SECTION_CLASSIFICATIONS.OPTIONAL) {
    requested = SECTION_DISPOSITIONS.OMIT;
  } else if (!hasAny && classification === SECTION_CLASSIFICATIONS.SUPPLEMENTARY) {
    requested = SECTION_DISPOSITIONS.COLLAPSE;
  } else if ((preferCompact || compactRendererEligible) && hasAny) {
    requested = SECTION_DISPOSITIONS.COMPACT;
  } else if (missing.length > 0 && hasAny) {
    requested = SECTION_DISPOSITIONS.INCLUDE_QUALIFIED;
  }

  const minimumSurvivingFactKeys =
    sectionKey === "debtCapacityAndCoverage"
      ? DEBT_CAPACITY_MINIMUM_FACT_KEYS.filter((k) => available.has(k))
      : required.filter((k) => available.has(k));

  return applySectionDisposition({
    sectionKey,
    classification,
    requestedDisposition: requested,
    minimumSurvivingFactKeys,
    missingFactOrLimitationReason:
      missing.length > 0 ? `unsupported_or_missing: ${missing.join(", ")}` : null,
    compactRendererEligible:
      compactRendererEligible ||
      requested === SECTION_DISPOSITIONS.COMPACT ||
      sectionKey === "debtCapacityAndCoverage",
    detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
    certificationExpectation: "require_minimum_facts",
  });
}

export function applyDispositionsToCustomerSurfaceSections(sections = {}) {
  const out = {};
  const dispositionReceipts = {};
  const qualityManifestEntries = [];

  for (const [key, section] of Object.entries(sections || {})) {
    const facts = section?.facts && typeof section.facts === "object" ? section.facts : {};
    const available =
      Array.isArray(section?.availableFacts)
        ? section.availableFacts
        : Array.isArray(section?.factAvailability?.available)
          ? section.factAvailability.available
          : Object.keys(facts).filter((k) => {
              const v = facts[k];
              if (v == null) return false;
              if (typeof v === "object" && v.displayReady === false) return false;
              if (typeof v === "object" && "result" in v) return Number.isFinite(Number(v.result));
              return true;
            });
    const required =
      Array.isArray(section?.requiredFacts)
        ? section.requiredFacts
        : Array.isArray(section?.factAvailability?.required)
          ? section.factAvailability.required
          : [];

    const isCore =
      key === "unitMix" ||
      key === "operatingStatementTTMSummary" ||
      key === "capRateValueIndication" ||
      section?.classification === "core_required";

    const classification = isCore
      ? SECTION_CLASSIFICATIONS.CORE_REQUIRED
      : key === "debtCapacityAndCoverage"
        ? SECTION_CLASSIFICATIONS.ANALYTICAL
        : section?.status === "collapsed"
          ? SECTION_CLASSIFICATIONS.SUPPLEMENTARY
          : SECTION_CLASSIFICATIONS.ANALYTICAL;

    const preferCompact = key === "debtCapacityAndCoverage";
    const disposition = resolveGovernedSurfaceDisposition({
      sectionKey: key,
      classification,
      availableFactKeys: available,
      requiredFactKeys: required.length ? required : available,
      sourceBacked: section?.factAvailability?.sourceBacked === true || section?.sourceBacked === true,
      compactRendererEligible: preferCompact,
      preferCompact,
    });

    dispositionReceipts[key] = disposition;
    qualityManifestEntries.push(buildDispositionManifestEntry(disposition));

    out[key] = {
      ...section,
      sectionDisposition: disposition,
      disposition: disposition.disposition,
      classification: disposition.classification,
      minimumSurvivingFactKeys: disposition.minimumSurvivingFactKeys,
      detailedLineagePlacement: disposition.detailedLineagePlacement,
    };
  }

  return {
    sections: out,
    dispositionReceipts,
    qualityManifestEntries,
    contractVersion: SECTION_DISPOSITION_CONTRACT_VERSION,
  };
}

export function runSemanticRecompositionOnce(approvedHtml = "") {
  const result = compactDenseSourceTablesInApprovedHtml(approvedHtml);
  return {
    html: result.html,
    receipt: {
      ...result.receipt,
      semanticAttemptUsed: true,
      semanticAttemptMax: GATE2_SEMANTIC_RECOMPOSITION_MAX,
      lineageDestination: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
    },
    semanticAttemptUsed: true,
  };
}

export function isIntentionalCompactDetailLoss(missingRow = {}, dispositionReceipts = {}) {
  const label = String(missingRow?.label || "").toLowerCase();
  const rowDisposition = String(
    missingRow?.tableDisposition ||
      missingRow?.sectionDisposition ||
      missingRow?.disposition ||
      ""
  ).toLowerCase();
  const rowSectionKey = String(missingRow?.sectionKey || missingRow?.tableSectionKey || "").trim();
  const hasIntentionalTableDisposition = [
    SECTION_DISPOSITIONS.COMPACT,
    SECTION_DISPOSITIONS.COLLAPSE,
    SECTION_DISPOSITIONS.OMIT,
  ].includes(rowDisposition);
  const receipt = rowSectionKey ? dispositionReceipts?.[rowSectionKey] : null;
  const hasIntentionalReceipt = Object.values(dispositionReceipts || {}).some((candidate) =>
    [
      SECTION_DISPOSITIONS.COMPACT,
      SECTION_DISPOSITIONS.COLLAPSE,
      SECTION_DISPOSITIONS.OMIT,
    ].includes(candidate?.disposition)
  );
  const hasRowIntent =
    hasIntentionalTableDisposition ||
    [
      SECTION_DISPOSITIONS.COMPACT,
      SECTION_DISPOSITIONS.COLLAPSE,
      SECTION_DISPOSITIONS.OMIT,
    ].includes(receipt?.disposition);
  if (!hasRowIntent && !hasIntentionalReceipt) return false;
  if (
    /formula|numerator|denominator|provenance|parser|source\s*id|uuid|receipt/i.test(label) ||
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(String(missingRow?.value || ""))
  ) {
    return hasRowIntent;
  }
  const debt = dispositionReceipts?.debtCapacityAndCoverage;
  if (debt?.disposition === SECTION_DISPOSITIONS.COMPACT) {
    const compactDetail = /formula|numerator|denominator|source|provenance|lineage/i.test(label);
    if (compactDetail) return true;
  }
  return false;
}

export function filterMissingFinancialRowsForIntentionalDisposition(
  missingRows = [],
  dispositionReceipts = {}
) {
  return (Array.isArray(missingRows) ? missingRows : []).filter(
    (row) => !isIntentionalCompactDetailLoss(row, dispositionReceipts)
  );
}

export {
  SECTION_DISPOSITION_CONTRACT_VERSION,
  SECTION_DISPOSITIONS,
  SECTION_CLASSIFICATIONS,
  DETAILED_LINEAGE_PLACEMENTS,
  applySectionDisposition,
  buildDispositionManifestEntry,
  compactDenseSourceTablesInApprovedHtml,
  isCollapseEligibleBossIssue,
};

export default {
  GATE2_CSS_RECOVERY_MAX,
  GATE2_SEMANTIC_RECOMPOSITION_MAX,
  DEBT_CAPACITY_MINIMUM_FACT_KEYS,
  resolveGovernedSurfaceDisposition,
  applyDispositionsToCustomerSurfaceSections,
  runSemanticRecompositionOnce,
  isIntentionalCompactDetailLoss,
  filterMissingFinancialRowsForIntentionalDisposition,
};
