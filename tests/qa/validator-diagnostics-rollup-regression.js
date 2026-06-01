import assert from "node:assert/strict";
import {
  buildValidatorDiagnosticsRollup,
  classifyDiagnosticOwnerArea,
} from "../../api/_lib/validator-diagnostics-rollup.js";

const artifacts = [
  {
    type: "t12_parsed",
    payload: {
      parser_diagnostics: {
        validation_reasons: [],
        accepted_fields: ["effective_gross_income", "net_operating_income"],
        derived_fields: ["net_operating_income_derived_from_egi_minus_opex"],
      },
    },
  },
  {
    type: "rent_roll_parse_error",
    payload: {
      parser_diagnostics: {
        validation_reasons: ["vague_rent_roll_no_reliable_totals"],
        field_diagnostics: [{ reason_codes: ["missing_unit_rows"] }],
      },
    },
  },
  {
    type: "ai_support_doc_recovery_diagnostic",
    payload: {
      validation_diagnostics: {
        validation_reasons: ["row_evidence_unmatched"],
      },
      provider_error_class: "insufficient_quota",
    },
  },
  {
    type: "worker_event",
    payload: {
      flags: [{ code: "DOCRAPTOR_NOT_PRODUCTION_MODE" }],
    },
  },
  {
    type: "t12_parse_error",
    payload: {
      validation_reasons: ["DOCUMENT_FINANCIAL_SCALE_MISMATCH"],
      core_t12_validation: {
        failures: ["core_t12_equation_mismatch"],
      },
    },
  },
  {
    type: "supporting_doc_received",
    payload: {
      file_id: "abc123",
    },
  },
  {
    type: "derived_signal_artifact",
    payload: {
      validation_reasons: ["net_operating_income_derived_from_egi_minus_opex"],
    },
  },
];

const rollup = buildValidatorDiagnosticsRollup({
  jobId: "job_123",
  reportType: "underwriting",
  artifacts,
  timestamp: "2026-05-16T00:00:00.000Z",
});

assert.equal(rollup.event, "validator_diagnostics_rollup");
assert.equal(rollup.job_id, "job_123");
assert.equal(rollup.report_type, "underwriting");
assert.equal(rollup.reason_code_counts.vague_rent_roll_no_reliable_totals, 1);
assert.equal(rollup.reason_code_counts.row_evidence_unmatched, 1);
assert.equal(rollup.reason_code_counts.insufficient_quota, 1);
assert.equal(rollup.reason_code_counts.DOCRAPTOR_NOT_PRODUCTION_MODE, 1);
assert.equal(rollup.reason_code_counts.DOCUMENT_FINANCIAL_SCALE_MISMATCH, 1);
assert.equal(rollup.derived_field_counts.net_operating_income_derived_from_egi_minus_opex, 1);
assert.equal(rollup.accepted_validators.includes("t12_parsed"), true);
assert.equal(rollup.rejected_validators.includes("derived_signal_artifact"), false);
assert.equal(
  rollup.parser_validator_issue_codes.includes("row_evidence_unmatched"),
  true
);
assert.equal(
  rollup.platform_infrastructure_issue_codes.includes("insufficient_quota"),
  true
);
assert.equal(
  rollup.source_document_issue_codes.includes("vague_rent_roll_no_reliable_totals"),
  true
);
assert.equal(
  rollup.production_config_issue_codes.includes("DOCRAPTOR_NOT_PRODUCTION_MODE"),
  true
);
assert.equal(
  rollup.source_reconciliation_issue_codes.includes("DOCUMENT_FINANCIAL_SCALE_MISMATCH"),
  true
);
assert.equal(Array.isArray(rollup.top_reason_codes), true);
assert.ok(rollup.top_reason_codes.length > 0);
assert.equal("raw_text" in rollup, false);
assert.equal(classifyDiagnosticOwnerArea("core_t12_equation_mismatch"), "source_reconciliation");
assert.equal(classifyDiagnosticOwnerArea("unknown_code_123"), null);

console.log("validator diagnostics rollup regression PASS");
