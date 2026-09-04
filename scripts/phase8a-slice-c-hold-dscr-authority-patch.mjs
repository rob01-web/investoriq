import fs from "node:fs";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, value) {
  fs.writeFileSync(filePath, value, "utf8");
}

function replaceExact(filePath, before, after, expected = 1) {
  const source = read(filePath);
  const count = source.split(before).length - 1;
  if (count !== expected) {
    throw new Error(`PHASE8A_HOLD_DSCR_EXACT_MISMATCH:${filePath}:expected=${expected}:actual=${count}:${before.slice(0, 120)}`);
  }
  write(filePath, source.split(before).join(after));
}

// Phase 8A uses HOLD as a diligence/strategy qualifier, not as a final investment
// recommendation. Preserve the legacy final-recommendation firewall while allowing
// the exact authorized strategy label to pass validation.
replaceExact(
  "api/_lib/acquisition-memo-v2-customer-surface-model.js",
  `    /\\bHOLD\\b/i.test(normalizedHtml) ||`,
  `    /\\bHOLD\\b/i.test(normalizedHtml.replace(/\\bLIGHT VALUE-ADD HOLD\\b/gi, "")) ||`
);

replaceExact(
  "api/_lib/acquisition-memo-boss-contract.js",
  `      const hasHardFatalSurface = HARD_FATAL_FORBIDDEN_SURFACE_PATTERNS.some((pattern) => pattern.test(htmlString));\n      const hasCollapseableSurface = collapseableForbiddenPatternsFor(bossContract).some((pattern) => pattern.test(htmlString));`,
  `      const forbiddenRecommendationScanHtml = htmlString.replace(/\\bLIGHT VALUE-ADD HOLD\\b/gi, "");\n      const hasHardFatalSurface = HARD_FATAL_FORBIDDEN_SURFACE_PATTERNS.some((pattern) => pattern.test(forbiddenRecommendationScanHtml));\n      const hasCollapseableSurface = collapseableForbiddenPatternsFor(bossContract).some((pattern) => pattern.test(htmlString));`
);

replaceExact(
  "api/_lib/acquisition-memo-boss-contract.js",
  `  if (forbiddenPatterns.some((pattern) => pattern.test(htmlString))) {`,
  `  const forbiddenRecommendationScanHtml = htmlString.replace(/\\bLIGHT VALUE-ADD HOLD\\b/gi, "");\n  if (forbiddenPatterns.some((pattern) => pattern.test(forbiddenRecommendationScanHtml))) {`
);

// A generic repair retry must not strip DSCR when the canonical financial-
// intelligence receipt explicitly authorizes debt-service coverage output.
replaceExact(
  "api/_lib/acquisition-memo-v2-boss-repair.js",
  `export function repairAcquisitionMemoV2HtmlForRepairPlan(html, repairPlan = null) {`,
  `export function repairAcquisitionMemoV2HtmlForRepairPlan(html, repairPlan = null, { financialIntelligence = null } = {}) {`
);

replaceExact(
  "api/_lib/acquisition-memo-v2-boss-repair.js",
  `  for (const pattern of REPAIRABLE_ADVANCED_SURFACE_PATTERNS) {\n    repaired = repaired.replace(pattern, "");\n  }`,
  `  const dscrAuthorized = financialIntelligence?.customerSections?.debtServiceCoverage?.displayReady === true;\n  for (const pattern of REPAIRABLE_ADVANCED_SURFACE_PATTERNS) {\n    if (dscrAuthorized && pattern.source === "\\\\bDSCR\\\\b") continue;\n    repaired = repaired.replace(pattern, "");\n  }`
);

replaceExact(
  "api/_lib/acquisition-memo-v2-orchestrator.js",
  `    const repairedHtml = repairAcquisitionMemoV2HtmlForRepairPlan(\n      enforcement?.repairedHtml || baseHtml,\n      htmlRepairPlan\n    );`,
  `    const repairedHtml = repairAcquisitionMemoV2HtmlForRepairPlan(\n      enforcement?.repairedHtml || baseHtml,\n      htmlRepairPlan,\n      {\n        financialIntelligence:\n          bossContract?.financialIntelligence ||\n          customerSurfaceModel?.financialIntelligence ||\n          acquisitionMemoV2DocumentArgs?.financialIntelligence ||\n          null,\n      }\n    );`
);

// Lock the exact Stonebridge customer-facing DSCR labels and comparison into the
// Slice C artifact validator so a future scrub regression cannot hide behind values.
replaceExact(
  "scripts/phase8a-validate-slice-c-artifacts.js",
  `// Source presence must not be presented as diligence sufficiency.`,
  `// Debt-service coverage must remain explicitly labeled when source-authorized.\nrequireText(underwritingText, /Current DSCR\\s+2\\.01x/i, "current-dscr-label");\nrequireText(underwritingText, /Proposed DSCR\\s+1\\.40x/i, "proposed-dscr-label");\nrequireText(underwritingText, /Proposed financing tightens DSCR from 2\\.01x currently to 1\\.40x/i, "dscr-comparison-copy");\n\n// Source presence must not be presented as diligence sufficiency.`
);

console.log("phase8a-slice-c-hold-dscr-authority-patch: PATCHED");
