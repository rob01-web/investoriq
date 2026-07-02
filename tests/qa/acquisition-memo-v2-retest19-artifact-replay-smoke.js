import assert from "assert";
import { readFileSync } from "fs";

process.env.NODE_ENV ||= "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS ||= "true";
process.env.SUPABASE_URL ||= "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-key";
process.env.ADMIN_RUN_KEY ||= "test-admin-run-key";
process.env.DOCRAPTOR_API_KEY ||= "test-docractor-key";
process.env.QA_REVIEW_ENABLED ||= "false";
process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY ||= "true";

const { buildCanonicalSourcePackage } = await import("../../api/_lib/canonical-source-package.js");
const { buildAcquisitionMemoProjection } = await import("../../api/_lib/acquisition-memo-projection.js");
const { renderAcquisitionMemo } = await import("../../api/_lib/acquisition-memo-renderer.js");
const {
  buildAcquisitionMemoBossContract,
  validateAcquisitionMemoBossContract,
  validateAcquisitionMemoRenderAgainstBossContract,
} = await import("../../api/_lib/acquisition-memo-boss-contract.js");
const {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} = await import("../../api/_lib/acquisition-memo-v2-customer-surface-model.js");
const { runAcquisitionMemoV2Pipeline } = await import("../../api/_lib/acquisition-memo-v2-pipeline.js");
const { reconcileAcquisitionMemoV2SupportDocRole } = await import("../../api/_lib/acquisition-memo-v2-role-reconciler.js");

const replayRowsPath = new URL("./fixtures/acquisition-memo-v2-retest19-analysis-artifacts-rows.json", import.meta.url);
const replayExport = JSON.parse(readFileSync(replayRowsPath, "utf8"));
const replayRows = Array.isArray(replayExport)
  ? replayExport
  : Array.isArray(replayExport?.analysis_artifacts_rows)
    ? replayExport.analysis_artifacts_rows
    : Array.isArray(replayExport?.rows)
      ? replayExport.rows
      : [];

assert.ok(Array.isArray(replayRows) && replayRows.length > 0, "replay artifact rows must exist");

function normalizeMimeType(fileName = "", mimeType = "") {
  if (mimeType) return mimeType;
  const lower = String(fileName || "").toLowerCase();
  if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function normalizeReplayRows(rows) {
  const uploadedFilesById = new Map();
  const parsedArtifacts = [];
  const diagnosticsRows = [];

  for (const row of rows) {
    const payload = row?.payload && typeof row.payload === "object" ? structuredClone(row.payload) : {};
    const fileId = String(row?.file_id || payload?.source_file_id || payload?.file_id || row?.id || "").trim();
    const originalFilename = String(row?.original_filename || payload?.source_original_filename || payload?.original_filename || "").trim();
    if (fileId && originalFilename && !uploadedFilesById.has(fileId)) {
      uploadedFilesById.set(fileId, {
        id: fileId,
        fileId,
        originalFilename,
        mimeType: normalizeMimeType(originalFilename, row?.mime_type || payload?.mime_type || ""),
      });
    }
    if (fileId) {
      const normalizedArtifact = {
        id: row?.id || `${fileId}-${row?.type || "artifact"}`,
        fileId,
        file_id: fileId,
        type: String(row?.type || payload?.type || "").trim(),
        created_at: row?.created_at || null,
        payload,
      };
      if (normalizedArtifact.type) {
        parsedArtifacts.push(normalizedArtifact);
      }
      if (normalizedArtifact.type === "source_package_qa_advisory" || normalizedArtifact.type === "final_acquisition_memo_v2_compliance_diagnostics") {
        diagnosticsRows.push(normalizedArtifact);
      }
    }
  }

  return {
    uploadedFiles: [...uploadedFilesById.values()],
    parsedArtifacts,
    diagnosticsRows,
  };
}

function buildCoreMetrics({ t12Parsed, rentRollParsed } = {}) {
  return {
    units: Number(rentRollParsed?.total_units || 0),
    totalUnits: Number(rentRollParsed?.total_units || 0),
    occupancy: Number(rentRollParsed?.occupancy || 0),
    annualInPlaceRent: Number(rentRollParsed?.annual_in_place_rent || rentRollParsed?.total_in_place_annual || 0),
    annualMarketRent: Number(rentRollParsed?.annual_market_rent || rentRollParsed?.total_market_annual || 0),
    annualRentUpside: Number(rentRollParsed?.annual_market_rent || rentRollParsed?.total_market_annual || 0) - Number(rentRollParsed?.annual_in_place_rent || rentRollParsed?.total_in_place_annual || 0),
    egi: Number(t12Parsed?.effective_gross_income || 0),
    opEx: Number(t12Parsed?.total_operating_expenses || 0),
    noi: Number(t12Parsed?.net_operating_income || 0),
    expenseRatio: Number(t12Parsed?.effective_gross_income || 0) ? Number(t12Parsed?.total_operating_expenses || 0) / Number(t12Parsed?.effective_gross_income || 0) : null,
    noiMargin: Number(t12Parsed?.effective_gross_income || 0) ? Number(t12Parsed?.net_operating_income || 0) / Number(t12Parsed?.effective_gross_income || 0) : null,
    breakEvenOccupancy: 0.5,
    purchasePrice: 13500000,
    goingInCapRate: 0.07,
  };
}

function buildReportMeta() {
  return {
    propertyName: "Replay Property",
    propertyTitle: "Replay Property",
    propertyAddress: "123 Replay Road",
    generatedAt: "2026-06-24T00:00:00.000Z",
    reportType: "underwriting",
    reportMode: "v1_core",
    reportTier: 2,
  };
}

function buildPropertyProfile() {
  return {
    propertyName: "Replay Property",
    propertyTitle: "Replay Property",
    propertyAddress: "123 Replay Road",
    assetClass: "Multifamily",
  };
}

const normalized = normalizeReplayRows(replayRows);
const sourcePackage = buildCanonicalSourcePackage(normalized.uploadedFiles, normalized.parsedArtifacts);
const acquisitionMemoProjection = buildAcquisitionMemoProjection(sourcePackage);
const t12Payload = structuredClone(sourcePackage.coreT12?.extractedFacts?.t12_parsed || replayRows.find((row) => row.type === "t12_parsed")?.payload?.t12_parsed || {});
const rentRollParsed = replayRows.find((row) => row.type === "rent_roll_parsed")?.payload?.rent_roll_parsed || {};
const purchaseRow = normalized.parsedArtifacts.find((row) => row.fileId === "assumptions-file") || null;
const currentDebtRow = normalized.parsedArtifacts.find((row) => row.fileId === "current-debt-file") || null;
const currentDebtReconciliation = reconcileAcquisitionMemoV2SupportDocRole({
  file: currentDebtRow,
  artifacts: normalized.parsedArtifacts,
  acceptedTruth: {
    semanticDocRole: "purchase_assumptions",
    debtBasis: "proposed_acquisition",
    semanticDocDisplayLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
  },
});
const purchaseReconciliation = reconcileAcquisitionMemoV2SupportDocRole({
  file: purchaseRow,
  artifacts: normalized.parsedArtifacts,
  acceptedTruth: {
    semanticDocRole: "purchase_assumptions",
    debtBasis: "acquisition_financing_assumption",
    semanticDocDisplayLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
  },
});

assert.equal(currentDebtReconciliation.canonicalRole, "current_debt_context");
assert.equal(currentDebtReconciliation.acceptedSemanticDocRole, "current_debt_context");
assert.equal(currentDebtReconciliation.acceptedDebtBasis, "current_debt_context");
assert.equal(purchaseReconciliation.canonicalRole, "purchase_assumptions");

assert.equal(sourcePackage.supportDocs.get("current-debt-file")?.canonicalRole, "current_debt_context");
assert.equal(sourcePackage.supportDocs.get("assumptions-file")?.canonicalRole, "purchase_assumptions");
assert.equal(sourcePackage.coreT12?.canonicalRole, "core_t12");
assert.equal(sourcePackage.coreRentRoll?.canonicalRole, "core_rent_roll");

const coreMetrics = buildCoreMetrics({
  t12Parsed: t12Payload,
  rentRollParsed,
});
const reportMeta = buildReportMeta();
const propertyProfile = buildPropertyProfile();

const bossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: sourcePackage,
  acquisitionMemoProjection,
  t12Payload,
  coreMetrics,
  propertyProfile,
  reportMeta,
  reportMode: reportMeta.reportMode,
});
const customerSurfaceModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: sourcePackage,
  acquisitionMemoProjection,
  bossContract,
  coreMetrics,
  propertyProfile,
  reportMeta,
  reportMode: reportMeta.reportMode,
});
const bossValidation = validateAcquisitionMemoBossContract(bossContract);
const modelValidation = validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel);

assert.equal(bossValidation.ok, true, JSON.stringify(bossValidation, null, 2));
assert.equal(modelValidation.ok, true, JSON.stringify(modelValidation, null, 2));

const acquisitionMemoV2DocumentArgs = {
  sourcePackage,
  acquisitionMemoProjection,
  renderedAcquisitionMemo: renderAcquisitionMemo(acquisitionMemoProjection),
  t12Payload,
  acquisitionTermsPayload: structuredClone(purchaseRow?.payload || {}),
  loanTermSheetTermsPayload: structuredClone(currentDebtRow?.payload || {}),
  mortgagePayload: structuredClone(currentDebtRow?.payload?.current_debt_parsed || currentDebtRow?.payload?.loan_term_sheet_parsed || {}),
  coreMetrics,
  reportMeta,
  propertyProfile,
  bossContract,
  customerSurfaceModel,
};

const finalization = await runAcquisitionMemoV2Pipeline({
  acquisitionMemoV2DocumentArgs,
  acquisitionMemoBossContract: bossContract,
});

const finalHtml = String(finalization?.html || "");
assert.equal(Boolean(finalHtml), true, JSON.stringify(finalization || {}, null, 2));
assert.equal(finalization?.sealedCustomerOutput, true);
assert.equal(finalization?.acquisitionMemoV2OwnsFinalHtml, true);
assert.equal(finalization?.compliance?.ok, true, JSON.stringify(finalization || {}, null, 2));
assert.equal(validateAcquisitionMemoRenderAgainstBossContract(bossContract, finalHtml).ok, true, JSON.stringify(finalization || {}, null, 2));
assert.equal(validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(finalHtml, customerSurfaceModel).ok, true, JSON.stringify(finalization || {}, null, 2));

assert.match(finalHtml, /1BR/i);
assert.match(finalHtml, /2BR/i);
assert.match(finalHtml, /Current Outstanding Balance/i);
assert.match(finalHtml, /Purchase Assumptions/i);
assert.equal(/DSCR|refi|refinance|DCF|waterfall|equity return|deal score|\bBUY\b|\bSELL\b|\bHOLD\b|final recommendation|loan approval|lender commitment/i.test(finalHtml), false);
assert.equal(/\b(Boss Contract|CustomerSurfaceModel|Source Authority|V2 Canonical Package|canonical source package|V2 projection|semantic_doc_role|parser|stack trace|assertion code names)\b/i.test(finalHtml), false);
assert.equal(finalization?.finalComplianceDiagnostics?.repairPlan?.coreFatal?.length || 0, 0);
assert.notEqual(finalization?.finalDeliveryDecision?.fatalCategory, "true_core_fatal");
assert.equal(finalization?.finalDeliveryDecision?.report_publishable, true);
assert.equal(finalization?.finalDeliveryDecision?.customer_publish_eligible, true);

assert.ok(normalized.diagnosticsRows.some((row) => row.type === "source_package_qa_advisory"), "replay should include source package diagnostics");
assert.ok(normalized.diagnosticsRows.some((row) => row.type === "final_acquisition_memo_v2_compliance_diagnostics"), "replay should include final compliance diagnostics");

console.log(
  JSON.stringify(
    {
      coreGate: bossContract?.coreGate || null,
      repairPlan: finalization?.finalComplianceDiagnostics?.repairPlan || null,
      repairAttempted: finalization?.finalComplianceDiagnostics?.repairAttempted || false,
      repairedHtmlRevalidated: finalization?.finalComplianceDiagnostics?.repairedHtmlRevalidated || false,
      finalDecision: finalization?.finalDeliveryDecision || null,
      finalHtmlLength: finalHtml.length,
      currentDebtCanonicalRole: sourcePackage.supportDocs.get("current-debt-file")?.canonicalRole || null,
      purchaseCanonicalRole: sourcePackage.supportDocs.get("assumptions-file")?.canonicalRole || null,
    },
    null,
    2
  )
);

console.log("acquisition-memo-v2 retest19 artifact replay smoke PASS");
