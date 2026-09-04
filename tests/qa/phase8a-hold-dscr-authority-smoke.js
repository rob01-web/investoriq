import assert from "node:assert/strict";
import fs from "node:fs";
import { repairAcquisitionMemoV2HtmlForRepairPlan } from "../../api/_lib/acquisition-memo-v2-boss-repair.js";

const bossContractSource = fs.readFileSync("api/_lib/acquisition-memo-boss-contract.js", "utf8");
const customerSurfaceSource = fs.readFileSync("api/_lib/acquisition-memo-v2-customer-surface-model.js", "utf8");
const orchestratorSource = fs.readFileSync("api/_lib/acquisition-memo-v2-orchestrator.js", "utf8");

assert.match(
  bossContractSource,
  /forbiddenRecommendationScanHtml = htmlString\.replace\(\/\\bLIGHT VALUE-ADD HOLD\\b\/gi, ""\)/
);
assert.match(
  customerSurfaceSource,
  /normalizedHtml\.replace\(\/\\bLIGHT VALUE-ADD HOLD\\b\/gi, ""\)/
);
assert.match(
  orchestratorSource,
  /financialIntelligence:\s*bossContract\?\.financialIntelligence[\s\S]*customerSurfaceModel\?\.financialIntelligence/
);

const repairPlan = {
  forbiddenSurface: [{ code: "HTML_FORBIDDEN_SURFACES_PRESENT", path: "html.forbiddenSurfaces" }],
};
const sourceHtml = "<section><p>Current Debt DSCR 2.01x. Proposed Financing DSCR 1.40x. refinance DCF</p></section>";

const authorized = repairAcquisitionMemoV2HtmlForRepairPlan(sourceHtml, repairPlan, {
  financialIntelligence: {
    customerSections: {
      debtServiceCoverage: { displayReady: true },
    },
  },
});
assert.match(authorized, /Current Debt DSCR 2\.01x/);
assert.match(authorized, /Proposed Financing DSCR 1\.40x/);
assert.doesNotMatch(authorized, /\brefinance\b/i);
assert.doesNotMatch(authorized, /\bDCF\b/i);

const unauthorized = repairAcquisitionMemoV2HtmlForRepairPlan(sourceHtml, repairPlan);
assert.doesNotMatch(unauthorized, /\bDSCR\b/i);
assert.doesNotMatch(unauthorized, /\brefinance\b/i);
assert.doesNotMatch(unauthorized, /\bDCF\b/i);

console.log("phase8a-hold-dscr-authority-smoke: PASS");
