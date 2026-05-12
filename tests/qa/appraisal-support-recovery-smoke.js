import assert from "node:assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test";

const { buildSourceReportCoverageQa } = await import("../../api/_lib/source-report-coverage-qa.js");
const {
  __test__: supportDocRecoveryTestHelpers,
  shouldAttemptAppraisalRecovery,
  validateAppraisalCandidate,
} = await import("../../lib/ai-support-doc-recovery.js");

const formalAppraisalText = [
  "Formal Appraisal Report",
  "As-Is Value: $12,500,000",
  "Valuation Date: 2025-03-31",
  "Cap Rate: 4.99%",
  "Effective Gross Income: $1,250,000",
  "NOI: $625,000",
  "Value Basis: as-is",
  "Appraisal Type: full appraisal",
].join("\n");

assert.equal(shouldAttemptAppraisalRecovery(formalAppraisalText), true);

const appraisalCandidate = validateAppraisalCandidate(
  {
    is_appraisal_support: true,
    confidence: 0.96,
    appraised_value: 12500000,
    valuation_date: "2025-03-31",
    cap_rate: 4.99,
    effective_gross_income: 1250000,
    noi: 625000,
    value_basis: "as-is",
    appraisal_type: "full appraisal",
    evidence: {
      appraised_value: ["As-Is Value: $12,500,000"],
      valuation_date: ["Valuation Date: 2025-03-31"],
      cap_rate: ["Cap Rate: 4.99%"],
      effective_gross_income: ["Effective Gross Income: $1,250,000"],
      noi: ["NOI: $625,000"],
      value_basis: ["Value Basis: as-is"],
      appraisal_type: ["Appraisal Type: full appraisal"],
      warnings: [],
    },
  },
  formalAppraisalText
);

assert.equal(appraisalCandidate.method, "ai_support_doc_recovery_validated");
assert.equal(appraisalCandidate.appraised_value, 12500000);
assert.equal(appraisalCandidate.cap_rate, 4.99);
assert.equal(appraisalCandidate.value_basis, "as_is");

assert.equal(
  validateAppraisalCandidate(
    {
      is_appraisal_support: true,
      confidence: 0.96,
      appraised_value: 34500000,
      valuation_date: null,
      cap_rate: 4.99,
      effective_gross_income: null,
      noi: null,
      value_basis: "as-is",
      appraisal_type: null,
      evidence: {
        appraised_value: ["Purchase Price: $34,500,000"],
        valuation_date: [],
        cap_rate: ["Going-in Cap Rate: 4.99%"],
        effective_gross_income: [],
        noi: [],
        value_basis: ["Value Basis: as-is"],
        appraisal_type: [],
        warnings: [],
      },
    },
    "Purchase assumptions with financing terms."
  ),
  null
);

assert.equal(
  validateAppraisalCandidate(
    {
      is_appraisal_support: true,
      confidence: 0.96,
      appraised_value: null,
      valuation_date: null,
      cap_rate: 4.99,
      effective_gross_income: null,
      noi: null,
      value_basis: "market_survey",
      appraisal_type: null,
      evidence: {
        appraised_value: [],
        valuation_date: [],
        cap_rate: ["Cap Rate: 4.99%"],
        effective_gross_income: [],
        noi: [],
        value_basis: ["Market survey"],
        appraisal_type: [],
        warnings: [],
      },
    },
    "Market survey cap rate only."
  ),
  null
);

const appraisalCoverage = buildSourceReportCoverageQa({
  jobId: "generic-appraisal-smoke",
  userId: "user-smoke",
  propertyName: "Generic Property",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "Generic_Appraisal.pdf", doc_type: "appraisal", mime_type: "application/pdf", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "appraisal_parsed",
      payload: {
        appraised_value: 12500000,
        cap_rate: 4.99,
        valuation_date: "2025-03-31",
        value_basis: "as_is",
      },
    },
  ],
  html: "<html><body><p>Appraisal and cap-rate support acknowledged.</p></body></html>",
});

assert.equal(appraisalCoverage.artifact_inventory.appraisal_parsed.present, true);
assert.equal(appraisalCoverage.artifact_inventory.appraisal_parsed.has_appraised_value, true);
assert.equal(appraisalCoverage.artifact_inventory.appraisal_parsed.has_cap_rate, true);

assert.deepEqual(supportDocRecoveryTestHelpers.buildAppraisalResponseSchema().required, [
  "is_appraisal_support",
  "confidence",
  "appraised_value",
  "valuation_date",
  "cap_rate",
  "effective_gross_income",
  "noi",
  "value_basis",
  "appraisal_type",
  "evidence",
]);

console.log("appraisal-support-recovery smoke PASS");
