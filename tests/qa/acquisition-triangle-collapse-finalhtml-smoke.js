import assert from "assert/strict";
import fs from "fs";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const {
  buildAcquisitionFinancingAssumptionsHtml,
} = await import("../../api/_lib/document-treatment-authority.js");

const unsafeAcquisitionHtml = buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: {
    purchase_price: 2100000,
    loan_amount: 840000,
    ltv: 0.75,
    interest_rate: 0.061,
    amortization_years: 30,
    source_text: "Acquisition financing assumptions include purchase and loan terms.",
    closing_cost_notes: "legal/appraisal costs noted",
  },
  t12Payload: {
    net_operating_income: 640000,
  },
  reportType: "underwriting",
  reportTier: 2,
});

const finalHtml = `
<section class="section">
  <div class="section-header">Debt Structure &amp; Financing</div>
  ${unsafeAcquisitionHtml}
  <p class="small">Proposed acquisition financing is not current outstanding debt.</p>
</section>
`;

const implSource = fs.readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const docHtmlDeclarationAnchor = implSource.indexOf('let docHtml = "";');
const sealedV2Anchor = implSource.indexOf("if (acquisitionMemoV2OwnsFinalHtml) {");
const docHtmlAssignmentAnchor = implSource.indexOf("docHtml = finalBossCompliance.html;", sealedV2Anchor);

assert.ok(docHtmlDeclarationAnchor >= 0, "Expected docHtml declaration not found");
assert.ok(sealedV2Anchor >= 0, "Expected sealed Acquisition Memo V2 branch not found");
assert.ok(docHtmlDeclarationAnchor < sealedV2Anchor, "docHtml must be declared before the sealed V2 branch");
assert.ok(docHtmlAssignmentAnchor > sealedV2Anchor, "docHtml assignment must occur inside the sealed V2 branch");
assert.equal(implSource.includes("let docHtml = qaHtml;"), false, "docHtml must not be redeclared after qaHtml");

assert.match(
  finalHtml,
  /Acquisition financing inputs were not safe to render as a full debt sizing table\./i
);
assert.match(
  finalHtml,
  /This section is limited to non-contradictory verified fields only\./i
);
assert.equal(/<th>Input<\/th><th>Document-Derived Value<\/th>/i.test(finalHtml), false);

assert.equal(/Purchase Price[\s\S]{0,80}\$2,100,000/i.test(finalHtml), false);
assert.equal(/Stated Acquisition Loan Amount[\s\S]{0,80}\$840,000/i.test(finalHtml), false);
assert.equal(/Derived Acquisition Loan Amount[\s\S]{0,80}\$/i.test(finalHtml), false);
assert.equal(/Documented LTV[\s\S]{0,80}75\.0%/i.test(finalHtml), false);

assert.equal(/Lender Fee[\s\S]{0,80}0\.0%/i.test(finalHtml), false);
assert.equal(/Closing Costs[\s\S]{0,80}0\.0%/i.test(finalHtml), false);

assert.match(finalHtml, /Closing Cost Notes[\s\S]{0,140}Legal\/appraisal costs noted; not quantified/i);
assert.match(finalHtml, /not current outstanding debt/i);
assert.equal(/Current Debt DSCR|DSCR \(Current Debt\)/i.test(finalHtml), false);

console.log("acquisition-triangle-collapse-finalhtml smoke PASS");
