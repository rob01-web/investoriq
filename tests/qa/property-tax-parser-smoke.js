import assert from "node:assert/strict";
import { extractAnnualPropertyTaxFromText } from "../../api/parse/parse-doc.js";

const result = extractAnnualPropertyTaxFromText("2025 Municipal Property Taxes $38,400");
assert.equal(result.value, 38400);

const yearOnly = extractAnnualPropertyTaxFromText("Property Taxes Tax Year 2025");
assert.equal(yearOnly.value, null);
assert.equal(yearOnly.rejectedCandidate, true);

console.log("property-tax-parser smoke PASS");
