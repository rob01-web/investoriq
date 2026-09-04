import { buildPhase8CertificationRequests } from "./phase8-visual-certification-fixtures.js";
import { buildCanonicalSourceTruthPackage } from "../api/_lib/source-truth-package.js";
import { buildCanonicalInstitutionalFinancialIntelligence } from "../api/_lib/institutional-financial-intelligence.js";

const request = buildPhase8CertificationRequests().underwriting;
const payloads = request?.body?.__test_payloads || {};
const sourceTruthPackage = buildCanonicalSourceTruthPackage({
  jobId: "phase8a_dscr_diagnostic",
  propertyName: request?.body?.property_name || "Stonebridge Lofts",
  uploadedFiles: payloads.documentSources || [],
  artifacts: payloads.coverageArtifacts || [],
});
const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
  sourceTruthPackage,
  asOfDate: "2026-09-04",
});

const support = Array.isArray(sourceTruthPackage?.support?.accepted)
  ? sourceTruthPackage.support.accepted.map((entry) => ({
      canonical_role: entry?.canonical_role,
      primary_for_role: entry?.primary_for_role,
      file_id: entry?.file_id,
      accepted_facts: entry?.accepted_facts,
      accepted_fact_evidence: entry?.accepted_fact_evidence,
      authority_decision: entry?.authority_decision,
    }))
  : [];

const debtReceipts = (financialIntelligence?.calculationReceipts || []).filter((receipt) =>
  /DebtService$|Dscr$/i.test(receipt?.calculationKey || "")
);

console.log(JSON.stringify({
  source_truth_core_publishable: sourceTruthPackage?.core_publishable,
  support,
  debt_contract: financialIntelligence?.contracts?.debtServiceInput,
  debt_service_analysis: financialIntelligence?.analyses?.debtService,
  dscr_analysis: financialIntelligence?.analyses?.dscr,
  debt_receipts: debtReceipts,
  debt_customer_section: financialIntelligence?.customerSections?.debtServiceCoverage,
}, null, 2));
