import fs from "node:fs";

function patchExact(filePath, before, after, expected = 1) {
  let source = fs.readFileSync(filePath, "utf8");
  const count = source.split(before).length - 1;
  if (count !== expected) {
    throw new Error(`PHASE8A_VALUATION_BRIDGE_EXACT_MISMATCH:${filePath}:expected=${expected}:actual=${count}:${before}`);
  }
  source = source.split(before).join(after);
  fs.writeFileSync(filePath, source, "utf8");
}

// The NOI / cap-rate arithmetic is a transaction-basis consistency check, not
// an independent InvestorIQ valuation opinion. Keep that framing all the way
// through the model so bridge rows cannot reintroduce the retired label.
patchExact(
  "api/_lib/full-underwriting-valuation-reconciliation-v1.js",
  `baseSupported ? { label: "InvestorIQ Implied Value", value: impliedValue, valuePerUnit, evidenceClass: "deterministic_calculated" } : null,`,
  `baseSupported ? { label: "NOI / Cap-Rate Cross-Check Value", value: impliedValue, valuePerUnit, evidenceClass: "deterministic_calculated" } : null,`
);

// Align the focused model smoke with the new customer-facing semantic label.
patchExact(
  "tests/qa/full-underwriting-valuation-reconciliation-v1-smoke.js",
  `check(model.valuationBridge.some((row) => row.label === "InvestorIQ Implied Value" && row.evidenceClass === "deterministic_calculated"), "bridge includes deterministic InvestorIQ value");`,
  `check(model.valuationBridge.some((row) => row.label === "NOI / Cap-Rate Cross-Check Value" && row.evidenceClass === "deterministic_calculated"), "bridge includes deterministic NOI / cap-rate cross-check value");`
);

console.log("phase8a-slice-c-valuation-bridge-label-patch: PATCHED");
