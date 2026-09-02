import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function write(rel, content) {
  fs.writeFileSync(path.join(root, rel), content, "utf8");
}

function replaceExact(rel, beforeLines, afterLines, expected = 1) {
  const before = Array.isArray(beforeLines) ? beforeLines.join("\n") : String(beforeLines);
  const after = Array.isArray(afterLines) ? afterLines.join("\n") : String(afterLines);
  const source = read(rel);
  const count = source.split(before).length - 1;
  if (count !== expected) {
    throw new Error(`PHASE8_PATCH_SEAM_MISMATCH:${rel}:expected=${expected}:actual=${count}:needle=${before.slice(0, 160)}`);
  }
  write(rel, source.split(before).join(after));
}

function replaceAtLeast(rel, beforeLines, afterLines, minimum = 1) {
  const before = Array.isArray(beforeLines) ? beforeLines.join("\n") : String(beforeLines);
  const after = Array.isArray(afterLines) ? afterLines.join("\n") : String(afterLines);
  const source = read(rel);
  const count = source.split(before).length - 1;
  if (count < minimum) {
    throw new Error(`PHASE8_PATCH_SEAM_MISSING:${rel}:minimum=${minimum}:actual=${count}:needle=${before.slice(0, 160)}`);
  }
  write(rel, source.split(before).join(after));
}

// 1. Canonical rent-roll reconciliation authority.
// Property-wide totals must outrank a partial row excerpt.
const contracts = "api/_lib/report-surface-contracts.js";
replaceExact(
  contracts,
  [
    "  const rowCoveragePartial =",
    "    Number.isFinite(totalUnits) &&",
    "    totalUnits > 0 &&",
    "    representedUnitCount > 0 &&",
    "    representedUnitCount < totalUnits;",
  ],
  [
    "  const rowCoveragePartial =",
    "    Number.isFinite(totalUnits) &&",
    "    totalUnits > 0 &&",
    "    representedUnitCount > 0 &&",
    "    representedUnitCount < totalUnits;",
    "  const propertyWidePartialSignal =",
    "    payloadPartialSignal ||",
    "    rowCoveragePartial ||",
    "    sampleOrExcerptSignal ||",
    "    explicitControllingSummarySignal;",
  ]
);

replaceExact(
  contracts,
  [
    "      value: metricKey === \"market\"",
    "        ? rentRollPayload?.total_market_annual",
    "        : rentRollPayload?.total_in_place_annual,",
    "      source_path: metricKey === \"market\"",
    "        ? \"rentRollPayload.total_market_annual\"",
    "        : \"rentRollPayload.total_in_place_annual\",",
  ],
  [
    "      value: metricKey === \"market\"",
    "        ? rentRollPayload?.total_market_annual ?? rentRollPayload?.total_annual_market ?? rentRollPayload?.annual_market_rent",
    "        : rentRollPayload?.total_in_place_annual ?? rentRollPayload?.total_annual_in_place ?? rentRollPayload?.annual_in_place_rent,",
    "      source_path: metricKey === \"market\"",
    "        ? (rentRollPayload?.total_market_annual != null ? \"rentRollPayload.total_market_annual\" : rentRollPayload?.total_annual_market != null ? \"rentRollPayload.total_annual_market\" : \"rentRollPayload.annual_market_rent\")",
    "        : (rentRollPayload?.total_in_place_annual != null ? \"rentRollPayload.total_in_place_annual\" : rentRollPayload?.total_annual_in_place != null ? \"rentRollPayload.total_annual_in_place\" : \"rentRollPayload.annual_in_place_rent\"),",
  ]
);

replaceExact(
  contracts,
  [
    "      value: metricKey === \"market\"",
    "        ? computedRentRoll?.total_market_annual",
    "        : computedRentRoll?.total_in_place_annual,",
    "      source_path: metricKey === \"market\"",
    "        ? \"computedRentRoll.total_market_annual\"",
    "        : \"computedRentRoll.total_in_place_annual\",",
  ],
  [
    "      value: metricKey === \"market\"",
    "        ? computedRentRoll?.total_market_annual ?? computedRentRoll?.total_annual_market ?? computedRentRoll?.annual_market_rent",
    "        : computedRentRoll?.total_in_place_annual ?? computedRentRoll?.total_annual_in_place ?? computedRentRoll?.annual_in_place_rent,",
    "      source_path: metricKey === \"market\"",
    "        ? (computedRentRoll?.total_market_annual != null ? \"computedRentRoll.total_market_annual\" : computedRentRoll?.total_annual_market != null ? \"computedRentRoll.total_annual_market\" : \"computedRentRoll.annual_market_rent\")",
    "        : (computedRentRoll?.total_in_place_annual != null ? \"computedRentRoll.total_in_place_annual\" : computedRentRoll?.total_annual_in_place != null ? \"computedRentRoll.total_annual_in_place\" : \"computedRentRoll.annual_in_place_rent\"),",
  ]
);

replaceExact(
  contracts,
  [
    "    const coherent =",
    "      (preferTrustedSummaryAuthority && (candidate.kind === \"summary_annual\" || candidate.kind === \"summary_monthly\")) ||",
    "      matchesReferences.length > 0 ||",
    "      ((!(Number.isFinite(rowAnnual) && rowAnnual > 0)) && (!(Number.isFinite(weightedAnnual) && weightedAnnual > 0)));",
  ],
  [
    "    const propertyWideCandidate = [\"summary_annual\", \"summary_monthly\", \"payload_total_annual\", \"computed_total_annual\"].includes(candidate.kind);",
    "    const coherent =",
    "      (preferTrustedSummaryAuthority && (candidate.kind === \"summary_annual\" || candidate.kind === \"summary_monthly\")) ||",
    "      (propertyWidePartialSignal && propertyWideCandidate) ||",
    "      matchesReferences.length > 0 ||",
    "      ((!(Number.isFinite(rowAnnual) && rowAnnual > 0)) && (!(Number.isFinite(weightedAnnual) && weightedAnnual > 0)));",
  ]
);

replaceExact(
  contracts,
  [
    "  const preferenceOrder = preferTrustedSummaryAuthority",
    "    ? new Map([",
    "        [\"summary_annual\", 0],",
    "        [\"summary_monthly\", 1],",
    "        [\"row_derived_annual\", 2],",
    "        [\"weighted_avg_implied_annual\", 3],",
    "        [\"payload_total_annual\", 4],",
    "        [\"computed_total_annual\", 5],",
    "      ])",
  ],
  [
    "  const preferPropertyWideAuthority = preferTrustedSummaryAuthority || propertyWidePartialSignal;",
    "  const preferenceOrder = preferPropertyWideAuthority",
    "    ? new Map([",
    "        [\"summary_annual\", 0],",
    "        [\"summary_monthly\", 1],",
    "        [\"payload_total_annual\", 2],",
    "        [\"computed_total_annual\", 3],",
    "        [\"row_derived_annual\", 4],",
    "        [\"weighted_avg_implied_annual\", 5],",
    "      ])",
  ]
);

// 2. Keep the Phase 7 artifact fixture consistent with its canonical accepted
// rent-roll totals. The prior overlay used a different property-wide total.
replaceAtLeast(
  "tests/qa/generate-client-report-rent-roll-smoke.js",
  [
    "        total_annual_in_place: 1000000,",
    "        total_annual_market: 1100800,",
  ],
  [
    "        total_annual_in_place: 1036800,",
    "        total_annual_market: 1137600,",
  ],
  2
);

// 3. Wire Phase 8 authority into the sealed Screening lane.
const screeningPipeline = "api/_lib/screening-report-pipeline.js";
replaceExact(
  screeningPipeline,
  'import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";',
  [
    'import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";',
    'import { applyPhase8CustomerFacingVisualAuthority } from "./phase8-customer-facing-visual-authority.js";',
  ]
);
replaceExact(
  screeningPipeline,
  [
    "  const decisionSupportHtml = applyPhase7DecisionSupport(presentationHtml, { reportMode });",
    "  return {",
    "    html: decisionSupportHtml,",
  ],
  [
    "  const decisionSupportHtml = applyPhase7DecisionSupport(presentationHtml, { reportMode });",
    "  const phase8Html = applyPhase8CustomerFacingVisualAuthority(decisionSupportHtml, {",
    "    reportMode,",
    "    sourceTruthPackage,",
    "  });",
    "  return {",
    "    html: phase8Html,",
  ]
);

// 4. Wire Phase 8 authority into Full Underwriting final polish.
const underwritingPolish = "api/_lib/full-underwriting-final-surgical-polish.js";
replaceExact(
  underwritingPolish,
  'import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";',
  [
    'import { applyPhase7DecisionSupport } from "./phase7-decision-support.js";',
    'import { applyPhase8CustomerFacingVisualAuthority } from "./phase8-customer-facing-visual-authority.js";',
  ]
);
replaceExact(
  underwritingPolish,
  "export function polishFullUnderwritingFinalHtml(html, { reportMode = null } = {}) {",
  "export function polishFullUnderwritingFinalHtml(html, { reportMode = null, sourceTruthPackage = null } = {}) {"
);
replaceExact(
  underwritingPolish,
  [
    "  const decisionSupported = applyPhase7DecisionSupport(elitePresented, { reportMode });",
    "  return decisionSupported",
    "    .split",
  ],
  [
    "  const decisionSupported = applyPhase7DecisionSupport(elitePresented, { reportMode });",
    "  const phase8Authorized = applyPhase8CustomerFacingVisualAuthority(decisionSupported, { reportMode, sourceTruthPackage });",
    "  return phase8Authorized",
    "    .split",
  ]
);

// 5. Pass canonical source truth through the Acquisition Memo V2 orchestrator.
const orchestrator = "api/_lib/acquisition-memo-v2-orchestrator.js";
replaceExact(
  orchestrator,
  [
    "    const baseHtml = polishFullUnderwritingFinalHtml(renderedHtml, {",
    "      reportMode: customerSurfaceModel?.reportMode || acquisitionMemoV2DocumentArgs?.reportMode || null,",
    "    });",
  ],
  [
    "    const baseHtml = polishFullUnderwritingFinalHtml(renderedHtml, {",
    "      reportMode: customerSurfaceModel?.reportMode || acquisitionMemoV2DocumentArgs?.reportMode || null,",
    "      sourceTruthPackage: acquisitionMemoV2DocumentArgs?.sourceTruthPackage || null,",
    "    });",
  ]
);

console.log("phase8-apply-repair: PATCHED");
