import assert from "assert";
import { readFileSync } from "fs";

import { inferSupportingDocTypeFromText } from "../../api/parse/parse-doc.js";
import { buildCanonicalSourcePackage } from "../../api/_lib/canonical-source-package.js";
import { buildSourceReportCoverageQa } from "../../api/_lib/source-report-coverage-qa.js";
import {
  buildCanonicalSourceTruthPackage,
  constrainCanonicalSourcePackageToSourceTruth,
  isCanonicalSourceTruthPackage,
} from "../../api/_lib/source-truth-package.js";
import {
  buildCanonicalDeliveryDecisionState,
  buildDeliveryGateDecision,
  isCoreValidRequiredCoverageState,
} from "../../api/_lib/qa-action-plan.js";

const fixturePath = new URL("./fixtures/stonebridge-retest21-source-authority.json", import.meta.url);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

function expandRentRollUnits(payload = {}) {
  return (Array.isArray(payload.unit_groups) ? payload.unit_groups : []).flatMap((group, groupIndex) =>
    Array.from({ length: Number(group.count || 0) }, (_, index) => ({
      unit: `${groupIndex + 1}-${String(index + 1).padStart(2, "0")}`,
      unit_type: group.unit_type,
      status: group.status,
      sqft: group.sqft,
      in_place_rent: group.in_place_rent,
      market_rent: group.market_rent,
    }))
  );
}

function assertPublicSurfaceDoctrine(text, label) {
  const value = String(text || "");
  assert.equal(value.includes("\u2014"), false, `${label} must not contain an em dash`);
  assert.equal(
    /\bAI\b|artificial intelligence|language model|\bLLM\b|prompt|parser|recovery system|Boss Contract|CustomerSurfaceModel|canonical source package|internal authority/i.test(value),
    false,
    `${label} must not expose implementation machinery`
  );
}

const t12 = structuredClone(fixture.artifacts.t12.payload);
const rentRoll = structuredClone(fixture.artifacts.rent_roll.payload);
rentRoll.units = expandRentRollUnits(rentRoll);
delete rentRoll.unit_groups;

const misleadingRenovation = fixture.artifacts.misclassified_renovation;
const uploadedFiles = [
  {
    id: t12.file_id,
    original_filename: t12.original_filename,
    doc_type: "t12",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    parse_status: "parsed",
    parse_error: null,
  },
  {
    id: rentRoll.file_id,
    original_filename: rentRoll.original_filename,
    doc_type: "rent_roll",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    parse_status: "parsed",
    parse_error: null,
  },
  {
    id: misleadingRenovation.file_id,
    original_filename: misleadingRenovation.original_filename,
    doc_type: misleadingRenovation.contaminated_doc_type,
    mime_type: "application/pdf",
    parse_status: "failed",
    parse_error: misleadingRenovation.parse_error,
  },
];

const artifacts = [
  {
    id: fixture.artifacts.t12.artifact_id,
    type: fixture.artifacts.t12.type,
    payload: t12,
  },
  {
    id: fixture.artifacts.rent_roll.artifact_id,
    type: fixture.artifacts.rent_roll.type,
    payload: rentRoll,
  },
  {
    id: misleadingRenovation.text_artifact_id,
    type: "document_text_extracted",
    payload: {
      file_id: misleadingRenovation.file_id,
      original_filename: misleadingRenovation.original_filename,
      text: misleadingRenovation.text,
    },
  },
  {
    id: misleadingRenovation.parse_error_artifact_id,
    type: "rent_roll_parse_error",
    payload: {
      file_id: misleadingRenovation.file_id,
      original_filename: misleadingRenovation.original_filename,
      error_message: misleadingRenovation.parse_error,
    },
  },
];

const sourceTruthPackage = buildCanonicalSourceTruthPackage({
  jobId: fixture.source_export.job_id,
  propertyName: fixture.source_export.property_name,
  uploadedFiles,
  artifacts,
});

assert.equal(isCanonicalSourceTruthPackage(sourceTruthPackage), true);
assert.equal(Object.isFrozen(sourceTruthPackage), true);
assert.equal(Object.isFrozen(sourceTruthPackage.core), true);
assert.equal(sourceTruthPackage.core.t12?.status, "accepted_complete");
assert.equal(sourceTruthPackage.core.t12?.validated_role, "t12");
assert.equal(sourceTruthPackage.core.rent_roll?.status, "accepted_complete");
assert.equal(sourceTruthPackage.core.rent_roll?.validated_role, "rent_roll");
assert.equal(sourceTruthPackage.core_publishable, true);
assert.deepEqual(sourceTruthPackage.true_blockers, []);
assert.equal(sourceTruthPackage.core_input_sufficiency_state?.publishability_bucket, "disclose_only_publishable");
assert.equal(sourceTruthPackage.section_policy.source_reconciliation, "disclose");
assert.equal(sourceTruthPackage.section_policy.renovation_strategy, "render");
assert.equal(
  sourceTruthPackage.support.accepted.some(
    (entry) => entry.file_id === misleadingRenovation.file_id && entry.canonical_role === "renovation_capex_context"
  ),
  true
);
assert.equal(sourceTruthPackage.disclosures.length, 1);
assertPublicSurfaceDoctrine(sourceTruthPackage.disclosures[0]?.text, "Source Truth Package reconciliation disclosure");

const legacyCanonicalSourcePackage = buildCanonicalSourcePackage(uploadedFiles, artifacts);
const constrainedCanonicalSourcePackage = constrainCanonicalSourcePackageToSourceTruth(
  legacyCanonicalSourcePackage,
  sourceTruthPackage
);
assert.equal(constrainedCanonicalSourcePackage.sourceTruthAuthority?.core_publishable, true);
assert.equal(constrainedCanonicalSourcePackage.coreT12?.fileId, t12.file_id);
assert.equal(constrainedCanonicalSourcePackage.coreRentRoll?.fileId, rentRoll.file_id);
assert.equal(constrainedCanonicalSourcePackage.supportDocs.has(misleadingRenovation.file_id), true);

const invalidLaterT12Candidate = {
  id: "invalid-later-t12-candidate",
  type: "t12_parsed",
  created_at: "2099-01-01T00:00:00.000Z",
  payload: {
    ...structuredClone(t12),
    file_id: "invalid-later-t12-file",
    original_filename: "Misleading_Later_T12_Candidate.pdf",
    core_t12_validation: { ok: false, failures: ["validated_role_rejected"] },
  },
};
const duplicateCandidatePackage = buildCanonicalSourceTruthPackage({
  jobId: `${fixture.source_export.job_id}-duplicate-candidate`,
  propertyName: fixture.source_export.property_name,
  uploadedFiles,
  artifacts: [...artifacts, invalidLaterT12Candidate],
});
assert.equal(duplicateCandidatePackage.core.t12?.artifact_id, fixture.artifacts.t12.artifact_id);
assert.equal(duplicateCandidatePackage.core_publishable, true);

const constrainedT12 = structuredClone(t12);
delete constrainedT12.gross_potential_rent;
const constrainedPackage = buildCanonicalSourceTruthPackage({
  jobId: `${fixture.source_export.job_id}-constrained`,
  propertyName: fixture.source_export.property_name,
  uploadedFiles,
  artifacts: artifacts.map((artifact) =>
    artifact.type === "t12_parsed" ? { ...artifact, payload: constrainedT12 } : artifact
  ),
});
assert.equal(constrainedPackage.core.t12?.status, "accepted_constrained");
assert.equal(constrainedPackage.core_publishable, true);
assert.deepEqual(constrainedPackage.true_blockers, []);
assert.equal(constrainedPackage.section_policy.rent_upside, "collapse");

const catastrophicT12Package = buildCanonicalSourceTruthPackage({
  jobId: `${fixture.source_export.job_id}-catastrophic-t12`,
  propertyName: fixture.source_export.property_name,
  uploadedFiles,
  artifacts: artifacts.map((artifact) =>
    artifact.type === "t12_parsed"
      ? {
          ...artifact,
          payload: {
            file_id: t12.file_id,
            original_filename: t12.original_filename,
            core_t12_validation: { ok: false, failures: ["core_operating_totals_unusable"] },
          },
        }
      : artifact
  ),
});
assert.equal(catastrophicT12Package.core.t12, null);
assert.equal(catastrophicT12Package.core_publishable, false);
assert.equal(catastrophicT12Package.true_blockers.includes("CORE_T12_NOT_VALIDATED"), true);

assert.equal(t12.core_t12_validation?.ok, true);
assert.equal(t12.effective_gross_income, 1500000);
assert.equal(t12.total_operating_expenses, 555000);
assert.equal(t12.net_operating_income, 945000);
assert.equal(rentRoll.total_units, 64);
assert.equal(rentRoll.units.length, 64);
assert.equal(rentRoll.units.filter((unit) => unit.status === "Occupied").length, 60);
assert.equal(rentRoll.occupancy, 0.9375);

const replayResults = [];
for (const report of [
  { name: "Screening", reportType: "screening", reportTier: 1 },
  { name: "Acquisition Memo", reportType: "underwriting", reportTier: 2 },
]) {
  const coverage = buildSourceReportCoverageQa({
    jobId: fixture.source_export.job_id,
    propertyName: fixture.source_export.property_name,
    reportType: report.reportType,
    reportTier: report.reportTier,
    uploadedFiles,
    artifacts,
    sourceTruthPackage,
    html: "<html><body><h1>Stonebridge Lofts</h1></body></html>",
  });

  assert.equal(coverage.t12_sufficiency_state?.status, fixture.expected.t12_status);
  assert.equal(coverage.rent_roll_sufficiency_state?.status, fixture.expected.rent_roll_status);
  assert.equal(
    coverage.core_input_sufficiency_state?.publishability_bucket,
    fixture.expected.core_publishability_bucket
  );
  assert.equal(isCoreValidRequiredCoverageState(coverage), true);
  assert.ok(
    Math.abs(
      Number(coverage.source_reconciliation_state?.variance_pct) -
        Number(fixture.expected.reconciliation_variance_pct)
    ) < 1e-12
  );
  assert.equal(coverage.source_reconciliation_state?.customer_delivery_impact, "disclose_only");

  const gate = buildDeliveryGateDecision({
    sourceReportCoverageQa: coverage,
    reportContractQa: { violations: [] },
    qaActionPlan: { prioritized_actions: [] },
  });
  const state = buildCanonicalDeliveryDecisionState(gate);
  const expectedStatus = report.reportType === "screening"
    ? fixture.expected.screening_delivery_gate_status
    : fixture.expected.acquisition_memo_delivery_gate_status;

  assert.equal(gate.delivery_gate_status, expectedStatus);
  assert.equal(state.source, "canonical_delivery_decision");
  assert.equal(state.core_valid_required_coverage, true);
  assert.equal(state.delivery_gate_status, "deliverable");
  assert.equal(state.customer_delivery_allowed, true);
  assert.equal(state.hold_delivery, false);
  assert.deepEqual(state.customer_blockers, []);
  assert.equal(
    state.customer_blockers.includes("rent_roll_parse_error"),
    false,
    `${report.name} must not allow the rejected renovation candidate to poison accepted core coverage`
  );

  assertPublicSurfaceDoctrine(state.customer_message, `${report.name} customer message`);
  assertPublicSurfaceDoctrine(
    coverage.source_reconciliation_state?.source_reconciliation_disclosure,
    `${report.name} reconciliation disclosure`
  );

  replayResults.push({
    report: report.name,
    t12_status: coverage.t12_sufficiency_state?.status,
    rent_roll_status: coverage.rent_roll_sufficiency_state?.status,
    core_publishability_bucket: coverage.core_input_sufficiency_state?.publishability_bucket,
    delivery_gate_status: state.delivery_gate_status,
    customer_delivery_allowed: state.customer_delivery_allowed,
    hold_delivery: state.hold_delivery,
    customer_blockers: state.customer_blockers,
  });
}

console.log(JSON.stringify({ fixture: fixture.fixture, replay_results: replayResults }, null, 2));

const renovationCandidateRole = inferSupportingDocTypeFromText(misleadingRenovation.text, {
  filename: misleadingRenovation.original_filename,
  allowFilenameHint: false,
});

assert.equal(
  renovationCandidateRole,
  fixture.expected.renovation_role,
  "Stonebridge_Reno_Plan.pdf must remain renovation support and must never become a Rent Roll candidate from limitation text"
);

console.log("stonebridge retest21 source authority smoke PASS");
