import assert from "node:assert/strict";
import { validateAcquisitionPurchaseAssumptionsCandidateWithDiagnostics } from "../../lib/ai-support-doc-recovery.js";

const sourceText = [
  "Purchase assumptions / proposed acquisition financing",
  "Purchase Price $13,500,000",
  "LTV 70%",
  "Interest Rate 5.95%",
  "Amortization 30 years",
].join("\n");

const baseCandidate = {
  is_acquisition_purchase_assumptions: true,
  confidence: 0.99,
  purchase_price: 13500000,
  ltv: 70,
  interest_rate: 5.95,
  amortization_years: 30,
  going_in_cap_rate: null,
  closing_costs_percent: null,
  evidence: {
    purchase_price: ["Purchase Price $13,500,000"],
    ltv: ["LTV 70%"],
    interest_rate: ["Interest Rate 5.95%"],
    amortization_years: ["Amortization 30 years"],
    going_in_cap_rate: [],
    closing_costs_percent: [],
    warnings: [],
  },
};

const accepted = validateAcquisitionPurchaseAssumptionsCandidateWithDiagnostics(baseCandidate, sourceText);
assert.equal(accepted.payload?.purchase_price, 13500000);
assert.equal(accepted.payload?.candidate_only, true);
assert.equal(accepted.payload?.candidate_span_validated, true);

const mismatched = validateAcquisitionPurchaseAssumptionsCandidateWithDiagnostics(
  {
    ...baseCandidate,
    purchase_price: 14500000,
    evidence: { ...baseCandidate.evidence, purchase_price: ["Purchase Price $13,500,000"] },
  },
  sourceText
);
assert.equal(mismatched.payload?.purchase_price, null);
assert.ok(mismatched.diagnostics.validation_reasons.includes("unverified_purchase_price"));

console.log("support-document AI evidence binding smoke PASS");
