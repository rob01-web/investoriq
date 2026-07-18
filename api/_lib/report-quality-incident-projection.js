import { validateReportQualityManifest } from "./report-quality-manifest.js";

const PROJECTION_SOURCE = "canonical_report_quality_incident_projection";
const MANIFEST_SOURCE = "canonical_report_quality_manifest";
const DELIVERY_SOURCE = "canonical_delivery_decision";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function text(value) {
  return String(value ?? "").trim();
}

function clone(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((entry) => clone(entry));
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, clone(entry)]));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function unique(values) {
  return [...new Set(asArray(values).map(text).filter(Boolean))];
}

function severityRank(value) {
  return { critical: 4, high: 3, medium: 2, low: 1, informational: 0 }[
    text(value).toLowerCase()
  ] ?? 0;
}

function deliverySignature(value) {
  const source = asObject(value);
  return JSON.stringify({
    status: text(source.delivery_gate_status),
    allowed: source.customer_delivery_allowed === true,
    hold: source.hold_delivery === true,
    reason: text(source.customer_status_reason_code || source.fail_closed_reason_code),
  });
}

export function extractCanonicalDeliveryDecisionState(payload = null) {
  const source = asObject(payload);
  const candidates = [
    source,
    asObject(source.deliveryDecisionState),
    asObject(source.delivery_decision_state),
    asObject(source.canonical_delivery_decision),
  ];
  const canonical = candidates.find((candidate) => candidate.source === DELIVERY_SOURCE);
  return canonical ? deepFreeze(clone(canonical)) : null;
}

function event({
  code,
  family,
  severity,
  ownerArea,
  responsibility,
  message,
  scope = "report",
  customerVisible = false,
  detail = null,
}) {
  return {
    code,
    family,
    severity,
    ownerArea,
    responsibility,
    message,
    scope,
    customerVisible,
    detail: clone(detail),
  };
}

function classifySectionCollapse(section) {
  if (section?.reviewRequired === true) return "collapse_requires_review";
  return section?.expected === true ? "collapse_expected" : "collapse_unexpected";
}

function buildSectionEvents(sections) {
  const events = [];
  for (const section of asArray(sections)) {
    const outcome = text(section?.outcome).toLowerCase();
    const sectionKey = text(section?.sectionKey) || "unknown_section";
    if (["collapsed", "omitted"].includes(outcome)) {
      const classification = classifySectionCollapse(section);
      const requiresReview = classification !== "collapse_expected";
      events.push(event({
        code: classification.toUpperCase(),
        family: "section_collapse",
        severity: requiresReview ? "high" : "low",
        ownerArea: requiresReview ? "report_contract" : "source_authority",
        responsibility: requiresReview ? "investoriq_review" : "customer_source_limitation",
        message: requiresReview
          ? `${sectionKey} did not reach its expected customer surface and requires review.`
          : `${sectionKey} was withheld under its canonical section policy.`,
        scope: `section:${sectionKey}`,
        customerVisible: true,
        detail: {
          outcome,
          classification,
          reasonCodes: asArray(section?.reasonCodes),
          customerImpact: text(section?.customerImpact) || null,
        },
      }));
    } else if (["qualified", "disclosed"].includes(outcome)) {
      events.push(event({
        code: `SECTION_${outcome.toUpperCase()}`,
        family: "section_limitation",
        severity: outcome === "qualified" ? "medium" : "low",
        ownerArea: "source_authority",
        responsibility: "customer_source_limitation",
        message: `${sectionKey} was ${outcome} under its canonical section contract.`,
        scope: `section:${sectionKey}`,
        customerVisible: true,
        detail: {
          outcome,
          reasonCodes: asArray(section?.reasonCodes),
          customerImpact: text(section?.customerImpact) || null,
        },
      }));
    }
  }
  return events;
}

function buildDocumentEvents(documents) {
  const events = [];
  for (const document of asArray(documents)) {
    if (document?.documentClass !== "support") continue;
    const identity = text(document?.sourceIdentityKey || document?.documentId) || "support_document";
    const conflictState = text(document?.conflict?.state).toLowerCase();
    if (conflictState === "fact_conflict") {
      events.push(event({
        code: "SUPPORT_FACT_CONFLICT",
        family: "support_source_authority",
        severity: "medium",
        ownerArea: "support_document_authority",
        responsibility: "customer_source_limitation",
        message: "Conflicting support facts were excluded while the uncontested accepted role and facts were preserved.",
        scope: `document:${identity}`,
        customerVisible: false,
        detail: {
          conflictState,
          reasons: asArray(document?.conflict?.reasons),
          rejectedFacts: Object.keys(document?.rejectedFacts || {}),
          adjudicatedRole: document?.adjudicatedRole || null,
        },
      }));
    } else if (["conflicting", "ambiguous"].includes(conflictState)) {
      events.push(event({
        code: conflictState === "conflicting" ? "SUPPORT_SOURCE_CONFLICT" : "SUPPORT_SOURCE_AMBIGUOUS",
        family: "support_source_authority",
        severity: "medium",
        ownerArea: "support_document_authority",
        responsibility: "customer_source_limitation",
        message: `A support source was retained for traceability but was not accepted as authority because it was ${conflictState}.`,
        scope: `document:${identity}`,
        customerVisible: true,
        detail: {
          conflictState,
          reasons: asArray(document?.conflict?.reasons),
          adjudicatedRole: document?.adjudicatedRole || null,
        },
      }));
    } else if (conflictState === "duplicate" || document?.duplicate?.state === "duplicate") {
      events.push(event({
        code: "SUPPORT_SOURCE_DUPLICATE",
        family: "support_source_authority",
        severity: "low",
        ownerArea: "support_document_authority",
        responsibility: "customer_source_limitation",
        message: "A duplicate support source was excluded from independent authority.",
        scope: `document:${identity}`,
        customerVisible: false,
      }));
    } else if (document?.sourcePresent === true && document?.roleAccepted !== true) {
      events.push(event({
        code: "SUPPORT_SOURCE_PRESENT_NOT_ACCEPTED",
        family: "support_source_authority",
        severity: "low",
        ownerArea: "support_document_authority",
        responsibility: "customer_source_limitation",
        message: "A support source was present but did not satisfy an accepted semantic role contract.",
        scope: `document:${identity}`,
        customerVisible: false,
        detail: { candidateRoles: asArray(document?.candidateRoles) },
      }));
    }
    const extractionState = text(document?.extraction?.state).toLowerCase();
    if (["unreadable", "failed", "missing"].includes(extractionState)) {
      events.push(event({
        code: "OPTIONAL_SUPPORT_UNREADABLE",
        family: "source_extraction",
        severity: "medium",
        ownerArea: "document_extraction",
        responsibility: "customer_source_limitation",
        message: "An optional support source could not be used. Core publication authority remains separate.",
        scope: `document:${identity}`,
        customerVisible: true,
        detail: { extractionState, warnings: asArray(document?.extraction?.warnings) },
      }));
    }
  }
  return events;
}

function buildReceiptEvents(manifest) {
  const receipts = asObject(manifest?.receipts);
  const events = [];
  const csm = asObject(receipts.customerSurfaceModel);
  if (csm.validation && csm.validation.ok !== true) {
    events.push(event({
      code: "CUSTOMER_SURFACE_MODEL_VALIDATION_FAILED",
      family: "report_contract",
      severity: "high",
      ownerArea: "customer_surface_model",
      responsibility: "investoriq_defect",
      message: "The canonical customer surface validation did not pass.",
    }));
  }
  if (csm.htmlValidation && csm.htmlValidation.ok !== true) {
    events.push(event({
      code: "CUSTOMER_SURFACE_HTML_VALIDATION_FAILED",
      family: "report_contract",
      severity: "high",
      ownerArea: "report_renderer",
      responsibility: "investoriq_defect",
      message: "The approved HTML surface validation did not pass.",
    }));
  }
  const contractSeal = asObject(receipts.deterministicContractQaSeal);
  if (Object.keys(contractSeal).length > 0 && contractSeal.ok !== true) {
    events.push(event({
      code: "DETERMINISTIC_CONTRACT_SEAL_FAILED",
      family: "report_contract",
      severity: "high",
      ownerArea: "deterministic_contract_qa",
      responsibility: "investoriq_defect",
      message: "The deterministic report contract seal did not pass.",
    }));
  }
  const boss = asObject(receipts.boss);
  if (Object.keys(boss).length > 0 && boss.ok !== true) {
    events.push(event({
      code: "BOSS_COMPLIANCE_FAILED",
      family: "report_contract",
      severity: "high",
      ownerArea: "acquisition_memo_boss",
      responsibility: "investoriq_defect",
      message: "The final Boss compliance receipt did not pass.",
    }));
  }
  const financialIntelligence = asObject(receipts.institutionalFinancialIntelligence);
  if (Object.keys(financialIntelligence).length > 0 && (
    financialIntelligence.source !== "canonical_institutional_financial_intelligence" ||
    financialIntelligence.receiptVersion !== 1 ||
    financialIntelligence?.policy?.authorityCreating !== false ||
    financialIntelligence?.policy?.downstreamConsumeOnly !== true
  )) {
    events.push(event({
      code: "FINANCIAL_INTELLIGENCE_RECEIPT_INVALID",
      family: "calculation_receipt_integrity",
      severity: "high",
      ownerArea: "deterministic_financial_math",
      responsibility: "investoriq_defect",
      message: "The institutional financial-intelligence receipt did not preserve its canonical consume-only contract.",
    }));
  }
  return events;
}

function recommendedActions({ queue, responsibility, credit, terminal }) {
  const actions = [];
  if (queue === "BLOCKED") actions.push("mark_for_review");
  if (responsibility === "investoriq_defect" || responsibility === "mixed") {
    actions.push("request_free_corrected_rerun");
  }
  if (credit?.state && credit.state !== "reconciled" && credit.state !== "not_required") {
    actions.push("request_credit_restoration_review");
  }
  if (terminal?.customerDocumentReplacementRequired === true) {
    actions.push("record_replacement_source_required", "mark_customer_contacted");
  }
  if (queue !== "PUBLISHED_CLEAN") actions.push("link_regression_case");
  actions.push("close_incident");
  return unique(actions);
}

export function buildReportQualityIncidentProjection({
  manifest,
  canonicalDeliveryDecision = null,
  actionReceipts = [],
} = {}) {
  if (manifest?.source !== MANIFEST_SOURCE) {
    throw new Error("REPORT_QUALITY_INCIDENT_FINAL_MANIFEST_REQUIRED");
  }

  const manifestValidation = validateReportQualityManifest(manifest, { requireFinal: true });
  const manifestDelivery = extractCanonicalDeliveryDecisionState(manifest?.receipts?.deliveryGate);
  const externalDelivery = extractCanonicalDeliveryDecisionState(canonicalDeliveryDecision);
  const delivery = externalDelivery || manifestDelivery;
  const events = [];

  if (!manifestValidation.ok) {
    events.push(event({
      code: "REPORT_QUALITY_MANIFEST_INVALID",
      family: "quality_receipt_integrity",
      severity: "critical",
      ownerArea: "report_quality_manifest",
      responsibility: "investoriq_defect",
      message: "The final quality receipt failed its immutable contract validation.",
      detail: manifestValidation.issues,
    }));
  }
  if (!delivery) {
    events.push(event({
      code: "CANONICAL_DELIVERY_DECISION_MISSING",
      family: "delivery_authority",
      severity: "critical",
      ownerArea: "delivery_gate",
      responsibility: "investoriq_defect",
      message: "No canonical delivery decision is attached to this terminal quality receipt.",
    }));
  } else if (manifestDelivery && externalDelivery && deliverySignature(manifestDelivery) !== deliverySignature(externalDelivery)) {
    events.push(event({
      code: "CANONICAL_DELIVERY_DECISION_MISMATCH",
      family: "delivery_authority",
      severity: "critical",
      ownerArea: "delivery_gate",
      responsibility: "investoriq_defect",
      message: "The final Manifest and latest canonical delivery decision do not agree.",
    }));
  }

  const publicationState = text(manifest?.publication?.state).toLowerCase();
  const terminal = asObject(manifest?.terminalOutcome);
  if (publicationState === "blocked") {
    events.push(event({
      code: text(terminal.code) || "REPORT_PUBLICATION_BLOCKED",
      family: terminal.failureClass === "customer_document_failure"
        ? "catastrophic_core_evidence"
        : "publication_failure",
      severity: "critical",
      ownerArea: terminal.failureClass === "customer_document_failure"
        ? "core_source_validation"
        : "report_delivery",
      responsibility: terminal.failureClass === "customer_document_failure"
        ? "customer_source_limitation"
        : "investoriq_defect",
      message: terminal.failureClass === "customer_document_failure"
        ? "Publication stopped because required core evidence was catastrophically unusable."
        : "Publication stopped because an internal report or delivery contract failed.",
      customerVisible: true,
      detail: terminal,
    }));
  }
  if (publicationState === "published" && manifest?.publication?.pdfCertified !== true) {
    events.push(event({
      code: "PUBLISHED_PDF_NOT_CERTIFIED",
      family: "pdf_quality",
      severity: "high",
      ownerArea: "pdf_publication_boss",
      responsibility: "investoriq_defect",
      message: "A published report does not carry a certified PDF receipt.",
    }));
  }
  if (publicationState === "published" && delivery && (
    delivery.delivery_gate_status !== "deliverable" ||
    delivery.customer_delivery_allowed !== true ||
    delivery.hold_delivery === true
  )) {
    events.push(event({
      code: "PUBLISHED_WITHOUT_DELIVERY_AUTHORITY",
      family: "delivery_authority",
      severity: "critical",
      ownerArea: "delivery_gate",
      responsibility: "investoriq_defect",
      message: "The publication receipt conflicts with canonical delivery authority.",
    }));
  }

  events.push(...buildSectionEvents(manifest?.sections));
  events.push(...buildDocumentEvents(manifest?.documents));
  events.push(...buildReceiptEvents(manifest));
  for (const calculation of asArray(manifest?.calculations)) {
    if (calculation?.eligible !== true) {
      events.push(event({
        code: "CALCULATION_NOT_ELIGIBLE",
        family: "calculation_coverage",
        severity: "low",
        ownerArea: "deterministic_financial_math",
        responsibility: "customer_source_limitation",
        message: `${text(calculation?.label || calculation?.calculationKey) || "A calculation"} was withheld because required accepted inputs were incomplete.`,
        scope: `calculation:${text(calculation?.calculationKey) || "unknown"}`,
        customerVisible: true,
        detail: { collapseReason: calculation?.collapseReason || null },
      }));
    }
  }

  const highestSeverity = events.reduce(
    (current, entry) => severityRank(entry.severity) > severityRank(current) ? entry.severity : current,
    "informational"
  );
  const queue = publicationState !== "published"
    ? "BLOCKED"
    : events.length > 0
      ? "PUBLISHED_WITH_LIMITATIONS"
      : "PUBLISHED_CLEAN";
  const customerAttentionRisk = queue === "BLOCKED" || severityRank(highestSeverity) >= severityRank("high")
    ? "HIGH"
    : severityRank(highestSeverity) >= severityRank("medium")
      ? "MEDIUM"
      : "LOW";
  const responsibilities = unique(events.map((entry) => entry.responsibility));
  const terminalResponsibility = publicationState === "blocked"
    ? (terminal.failureClass === "customer_document_failure" ? "customer_source_limitation" : "investoriq_defect")
    : null;
  const responsibility = terminalResponsibility || (
    responsibilities.includes("investoriq_defect") && responsibilities.includes("customer_source_limitation")
      ? "mixed"
      : responsibilities.includes("investoriq_defect")
        ? "investoriq_defect"
        : responsibilities.includes("customer_source_limitation")
          ? "customer_source_limitation"
          : "none"
  );
  const collapseStates = unique(
    events
      .filter((entry) => entry.family === "section_collapse")
      .map((entry) => entry.detail?.classification)
  );
  const remedyLevel = queue === "BLOCKED"
    ? 3
    : collapseStates.some((state) => state !== "collapse_expected")
      ? 2
      : events.length > 0
        ? 1
        : 0;

  return deepFreeze({
    source: PROJECTION_SOURCE,
    version: 1,
    authority: {
      authorityCreating: false,
      receiptOnly: true,
      inputs: [MANIFEST_SOURCE, DELIVERY_SOURCE],
      legacyAliasFallbackAllowed: false,
    },
    jobId: text(manifest?.report?.jobId) || null,
    reportId: text(manifest?.report?.reportId) || null,
    reportFamily: text(manifest?.report?.reportFamily) || null,
    reportType: text(manifest?.report?.reportType) || null,
    propertyName: text(manifest?.report?.propertyName) || null,
    generatedAt: manifest?.generatedAt || null,
    finalizedAt: manifest?.finalizedAt || null,
    queue,
    overallQualityState: queue.toLowerCase(),
    customerAttentionRisk,
    highestSeverity,
    responsibility,
    ownerRouting: unique(events.map((entry) => entry.ownerArea)),
    collapse: {
      classifications: collapseStates,
      expectedCount: collapseStates.includes("collapse_expected")
        ? events.filter((entry) => entry.code === "COLLAPSE_EXPECTED").length
        : 0,
      unexpectedCount: events.filter((entry) => entry.code === "COLLAPSE_UNEXPECTED").length,
      reviewCount: events.filter((entry) => entry.code === "COLLAPSE_REQUIRES_REVIEW").length,
    },
    publication: clone(manifest.publication),
    terminalOutcome: clone(terminal),
    credit: clone(manifest.credit),
    remedy: {
      ...clone(asObject(manifest.remedy)),
      level: remedyLevel,
      recommendedActions: recommendedActions({
        queue,
        responsibility,
        credit: asObject(manifest.credit),
        terminal,
      }),
    },
    delivery: delivery ? {
      source: delivery.source,
      status: delivery.delivery_gate_status || null,
      customerDeliveryAllowed: delivery.customer_delivery_allowed === true,
      holdDelivery: delivery.hold_delivery === true,
      reasonCode: delivery.customer_status_reason_code || delivery.fail_closed_reason_code || null,
    } : null,
    documents: clone(asArray(manifest.documents)),
    calculations: clone(asArray(manifest.calculations)),
    financialIntelligence: {
      source: manifest?.receipts?.institutionalFinancialIntelligence?.source || null,
      receiptVersion: manifest?.receipts?.institutionalFinancialIntelligence?.receiptVersion || null,
      coverage: clone(asObject(manifest?.receipts?.institutionalFinancialIntelligence?.coverage)),
      eligibleCalculationCount: asArray(manifest.calculations).filter((calculation) => calculation?.eligible === true).length,
      totalCalculationCount: asArray(manifest.calculations).length,
    },
    sections: clone(asArray(manifest.sections)),
    events,
    actionReceipts: clone(asArray(actionReceipts)),
  });
}

export function buildReportQualityIncidentRollup(incidents = []) {
  const rows = asArray(incidents);
  const queues = {
    BLOCKED: 0,
    PUBLISHED_WITH_LIMITATIONS: 0,
    PUBLISHED_CLEAN: 0,
  };
  const risk = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const defectFamilies = {};
  for (const incident of rows) {
    if (queues[incident?.queue] !== undefined) queues[incident.queue] += 1;
    if (risk[incident?.customerAttentionRisk] !== undefined) risk[incident.customerAttentionRisk] += 1;
    for (const entry of asArray(incident?.events)) {
      const family = text(entry?.family) || "unclassified";
      defectFamilies[family] = (defectFamilies[family] || 0) + 1;
    }
  }
  return deepFreeze({
    total: rows.length,
    queues,
    customerAttentionRisk: risk,
    defectFamilies: Object.entries(defectFamilies)
      .map(([family, count]) => ({ family, count }))
      .sort((a, b) => b.count - a.count || a.family.localeCompare(b.family)),
  });
}

export const REPORT_QUALITY_INCIDENT_PROJECTION_CONTRACT = deepFreeze({
  source: PROJECTION_SOURCE,
  version: 1,
  manifestSource: MANIFEST_SOURCE,
  deliverySource: DELIVERY_SOURCE,
  authorityCreating: false,
  receiptOnly: true,
  legacyAliasFallbackAllowed: false,
});
