import { TERMINAL_FAILURE_CODES } from "../../lib/terminal-failure-taxonomy.js";

const tier1Sections = Object.freeze(["t12", "rent_roll", "source_truth_package", "customer_delivery"]);
const tier2Sections = Object.freeze(["report_contract", "customer_surface", "qa"]);
const tier3Sections = Object.freeze(["renderer", "pdf_artifact", "storage_publication", "delivery_gate"]);

const makeDescriptor = (tier, affectedSections, customerMessageCategory) =>
  Object.freeze({
    tier,
    affected_sections: Object.freeze([...affectedSections]),
    customer_message_category: customerMessageCategory,
  });

export const TERMINAL_FAILURE_TIER_MAP = Object.freeze({
  [TERMINAL_FAILURE_CODES.CORE_T12_CATASTROPHICALLY_UNUSABLE]: makeDescriptor(
    1,
    ["t12", "source_truth_package", "customer_delivery"],
    "customer_document_replacement_required"
  ),
  [TERMINAL_FAILURE_CODES.CORE_RENT_ROLL_CATASTROPHICALLY_UNUSABLE]: makeDescriptor(
    1,
    ["rent_roll", "source_truth_package", "customer_delivery"],
    "customer_document_replacement_required"
  ),
  [TERMINAL_FAILURE_CODES.CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY]: makeDescriptor(
    1,
    tier1Sections,
    "customer_document_replacement_required"
  ),
  [TERMINAL_FAILURE_CODES.SOURCE_TRUTH_PACKAGE_CONSTRUCTION_FAILED]: makeDescriptor(
    1,
    ["source_truth_package", "customer_delivery"],
    "customer_document_replacement_required"
  ),
  [TERMINAL_FAILURE_CODES.REPORT_CONTRACT_FAILED]: makeDescriptor(
    2,
    tier2Sections,
    "publish_with_limitation"
  ),
  [TERMINAL_FAILURE_CODES.REPORT_RENDER_FAILED]: makeDescriptor(
    3,
    tier3Sections,
    "publication_recovery_required"
  ),
  [TERMINAL_FAILURE_CODES.PDF_ARTIFACT_FAILED]: makeDescriptor(
    3,
    ["pdf_artifact", "storage_publication", "delivery_gate"],
    "publication_recovery_required"
  ),
  [TERMINAL_FAILURE_CODES.STORAGE_PUBLICATION_FAILED]: makeDescriptor(
    3,
    ["storage_publication", "delivery_gate"],
    "publication_recovery_required"
  ),
});

export function describeTerminalFailureTier(code = "") {
  const normalized = String(code || "").trim().toUpperCase();
  return TERMINAL_FAILURE_TIER_MAP[normalized] || null;
}
