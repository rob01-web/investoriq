import assert from "node:assert/strict";

import {
  assertPhase8ArtifactIdentity,
  assertPhase8ArtifactTextIdentity,
  assertPhase8SourceBindingIdentity,
  PHASE8_ARTIFACT_IDENTITY_FINGERPRINTS,
} from "../../scripts/phase8-artifact-identity-fingerprint.js";
import {
  buildPhase8CertificationRequests,
  buildPhase8CertificationSourceProvenance,
} from "../../scripts/phase8-visual-certification-fixtures.js";
import { buildCanonicalSourceTruthPackage } from "../../api/_lib/source-truth-package.js";

function completeHtml(body) {
  return `<!DOCTYPE html><html><body>${body}</body></html>`;
}

const validScreening = completeHtml(`
  <h1>InvestorIQ Screening Report</h1><h2>Harbourstone</h2>
  <p>Total Units 48 | Occupied Units 46 | Vacant Units 2 | Occupancy 95.8%</p>
  <p>Gross Potential Rent $1,850,000 | Effective Gross Income $1,100,000</p>
  <p>Total Operating Expenses $450,000 | Net Operating Income $650,000</p>
  <p>Annual In-Place Rent $1,036,800 | Annual Market Rent $1,137,600</p>
  <p>Full_Render_T12.xlsx | Full_Render_Rent_Roll.xlsx</p>
`);
assert.equal(assertPhase8ArtifactIdentity({ report: "screening", html: validScreening }).core_facts_verified, true);

const validUnderwriting = completeHtml(`
  <h1>InvestorIQ Underwriting Report</h1><h2>Stonebridge Lofts</h2>
  <p>Total Units 64 | Occupied Units 60 | Vacant Units 4 | Occupancy 93.75%</p>
  <p>T12 Gross Potential Rent $1,612,800 | Effective Gross Income $1,500,000</p>
  <p>Total Operating Expenses $555,000 | Net Operating Income $945,000</p>
  <p>Rent Roll Annual In-Place Rent $1,432,800 | Rent Roll Annual Market Rent $1,718,400</p>
  <p>T12_Stonebridge_Lofts_Attack_Test_8.xlsx | Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx</p>
`);
assert.equal(assertPhase8ArtifactIdentity({ report: "underwriting", html: validUnderwriting }).core_facts_verified, true);
assert.equal(
  assertPhase8ArtifactTextIdentity({ report: "underwriting", text: validUnderwriting.replace(/<[^>]+>/g, " ") }).core_facts_verified,
  true
);

const mislabeledHarbourstone = completeHtml(`
  <h1>InvestorIQ Underwriting Report</h1><h2>Stonebridge Lofts</h2>
  <p>Total Units 48 | Occupied Units 46 | Vacant Units 2 | Occupancy 95.8%</p>
  <p>Gross Potential Rent $1,850,000 | Effective Gross Income $1,100,000</p>
  <p>Total Operating Expenses $450,000 | Net Operating Income $650,000</p>
  <p>Annual In-Place Rent $1,036,800 | Annual Market Rent $1,137,600</p>
  <p>Full_Render_T12.xlsx | Full_Render_Rent_Roll.xlsx</p>
`);
assert.throws(
  () => assertPhase8ArtifactIdentity({ report: "underwriting", html: mislabeledHarbourstone }),
  /PHASE8_ARTIFACT_IDENTITY_MISMATCH:underwriting:/
);
assert.throws(
  () => assertPhase8ArtifactTextIdentity({ report: "underwriting", text: mislabeledHarbourstone.replace(/<[^>]+>/g, " ") }),
  /PHASE8_ARTIFACT_IDENTITY_MISMATCH:underwriting:/
);

const contaminatedValidUnderwriting = validUnderwriting.replace(
  "</body>",
  "<p>Hidden contamination Annual In-Place Rent $1,036,800</p></body>"
);
assert.throws(
  () => assertPhase8ArtifactIdentity({ report: "underwriting", html: contaminatedValidUnderwriting }),
  /PHASE8_ARTIFACT_IDENTITY_MISMATCH:underwriting:forbidden_annual_in_place_rent:/
);

const requests = buildPhase8CertificationRequests();
assert.equal(assertPhase8SourceBindingIdentity({ report: "screening", request: requests.screening }).all_core_facts_verified, true);
assert.equal(assertPhase8SourceBindingIdentity({ report: "underwriting", request: requests.underwriting }).all_core_facts_verified, true);
const underwritingPayloads = requests.underwriting.body.__test_payloads;
const canonicalUnderwriting = PHASE8_ARTIFACT_IDENTITY_FINGERPRINTS.underwriting;
assert.equal(requests.underwriting.body.property_name, canonicalUnderwriting.property_name);
assert.equal(underwritingPayloads.t12Payload.gross_potential_rent, canonicalUnderwriting.gross_potential_rent);
assert.equal(underwritingPayloads.t12Payload.effective_gross_income, canonicalUnderwriting.effective_gross_income);
assert.equal(underwritingPayloads.t12Payload.total_operating_expenses, canonicalUnderwriting.total_operating_expenses);
assert.equal(underwritingPayloads.t12Payload.net_operating_income, canonicalUnderwriting.net_operating_income);
assert.equal(underwritingPayloads.rentRollPayload.total_units, canonicalUnderwriting.total_units);
assert.equal(underwritingPayloads.rentRollPayload.occupied_units, canonicalUnderwriting.occupied_units);
assert.equal(underwritingPayloads.rentRollPayload.vacant_units, canonicalUnderwriting.vacant_units);
assert.equal(underwritingPayloads.rentRollPayload.occupancy, canonicalUnderwriting.occupancy);
assert.equal(underwritingPayloads.rentRollPayload.annual_in_place_rent, canonicalUnderwriting.annual_in_place_rent);
assert.equal(underwritingPayloads.rentRollPayload.annual_market_rent, canonicalUnderwriting.annual_market_rent);
assert.equal(underwritingPayloads.rentRollPayload.units.length, 64);
assert.equal(underwritingPayloads.rentRollPayload.units.filter((unit) => unit.status === "occupied").length, 60);
assert.equal(underwritingPayloads.rentRollPayload.units.filter((unit) => unit.status === "vacant").length, 4);
const renovationArtifact = underwritingPayloads.coverageArtifacts.find((artifact) => artifact.type === "renovation_parsed");
assert.equal(renovationArtifact.payload.total_budget, 1280000);
assert.equal(renovationArtifact.payload.budget_rows.length, 5);
assert.deepEqual(
  renovationArtifact.payload.budget_rows.map((row) => row.category),
  ["1BR Interiors", "2BR Interiors", "Common Area Refresh", "Exterior / Security", "Contingency"]
);
assert.ok(renovationArtifact.payload.budget_rows.every((row) => Array.isArray(row.evidence) && row.evidence.length === 1));

const underwritingSourceTruth = buildCanonicalSourceTruthPackage({
  jobId: null,
  propertyName: requests.underwriting.body.property_name,
  uploadedFiles: underwritingPayloads.documentSources,
  artifacts: underwritingPayloads.coverageArtifacts,
});
const supportByFilename = new Map(
  underwritingSourceTruth.support.accepted.map((document) => [document.original_filename, document])
);
assert.equal(supportByFilename.size, 6);
assert.equal(supportByFilename.get("Stonebridge_Assumptions.pdf")?.accepted_facts?.purchase_price, 13500000);
assert.equal(supportByFilename.get("Current_Debt_Stonebridge.pdf")?.accepted_facts?.current_outstanding_balance, 6800000);
assert.equal(supportByFilename.get("Stonebridge_Reno_Plan.pdf")?.accepted_facts?.renovation_plan_rows?.length, 5);
assert.equal(supportByFilename.get("Stonebridge_Appraisal_Summary.pdf")?.accepted_facts?.appraisal_value, 14200000);
assert.deepEqual(
  supportByFilename.get("Stonebridge_Market_Survey.pdf")?.accepted_facts?.market_rent_ranges,
  [
    { unit_type: "1BR", low_monthly_rent: 2100, high_monthly_rent: 2250 },
    { unit_type: "2BR", low_monthly_rent: 2500, high_monthly_rent: 2700 },
  ]
);
assert.equal(
  supportByFilename.get("Stonebridge_Phase_I_ESA.pdf")?.accepted_facts?.phase_i_status,
  "none_identified_in_summary"
);

const contaminatedBinding = structuredClone(requests.underwriting);
contaminatedBinding.body.__test_payloads.rentRollPayload.annual_in_place_rent = 1036800;
assert.throws(
  () => assertPhase8SourceBindingIdentity({ report: "underwriting", request: contaminatedBinding }),
  /PHASE8_ARTIFACT_IDENTITY_MISMATCH:underwriting:source_binding_annual_in_place_rent:/
);

const sourceProvenance = buildPhase8CertificationSourceProvenance();
assert.equal(sourceProvenance.canonical_source_truth_fixture.sha256, "288bccffbf5ce87dd15e6eeeeeebc2b08a71875be7437d17df035f3c7ef566d9");
assert.equal(sourceProvenance.source_files.length, 9);
assert.equal(
  sourceProvenance.source_files.find((file) => file.filename === "T12_Stonebridge_Lofts_Attack_Test_8.xlsx")?.sha256,
  "23a0d6f1515809185f4039548d1d56f20a2a04b5e6895fe8666ff40f69decfda"
);
assert.equal(
  sourceProvenance.source_files.find((file) => file.filename === "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx")?.sha256,
  "444221956925e52e9e8c8fdc2d63ef10ca507fa1440138cc4b16a0d8718d3139"
);

console.log("phase8-artifact-identity-fingerprint-smoke: PASS");
