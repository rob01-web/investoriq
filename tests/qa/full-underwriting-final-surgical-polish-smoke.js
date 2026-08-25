import assert from "node:assert/strict";
import { polishFullUnderwritingFinalHtml } from "../../api/_lib/full-underwriting-final-surgical-polish.js";

const input = `<!doctype html><html><head><style>.x::after{content:"A - B"}</style></head><body>
<section class="section section-break"><div class="section-header"><span class="section-header-title">Methodology &amp; Data Transparency</span></div><div class="card">Method text</div></section>
<p>Scenario Analysis - Not Source Evidence</p>
<p>Modeled output — not source evidence.</p>
<p>Months 1–18 and source range $100 - $200.</p>
<p>Going-In | In-Place | Document-Backed | -11.16% | 2029-11-01</p>
<script>const x = "A - B";</script>
</body></html>`;

const output = polishFullUnderwritingFinalHtml(input, { reportMode: "full_underwriting" });
assert.match(output, /<section class="section"><div class="section-header"><span class="section-header-title">Methodology &amp; Data Transparency<\/span>/);
assert.match(output, /Scenario Analysis: Not Source Evidence/);
assert.match(output, /Modeled output; not source evidence\./);
assert.match(output, /Months 1-18 and source range \$100 - \$200\./);
assert.match(output, /Going-In \| In-Place \| Document-Backed \| -11\.16% \| 2029-11-01/);
assert.match(output, /<style>\.x::after\{content:"A - B"\}<\/style>/);
assert.match(output, /<script>const x = "A - B";<\/script>/);

const customerOnly = output
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace("$100 - $200", "");
assert.doesNotMatch(customerOnly, /\s-\s/);
assert.doesNotMatch(customerOnly, /[\u2013\u2014]|&(?:n|m)dash;|&#(?:8211|8212);|&#x(?:2013|2014);/i);

const acquisitionInput = "<p>Historical - acquisition memo</p>";
assert.equal(
  polishFullUnderwritingFinalHtml(acquisitionInput, { reportMode: "acquisition_memo_v2" }),
  acquisitionInput
);

console.log("full-underwriting-final-surgical-polish-smoke: PASS");
