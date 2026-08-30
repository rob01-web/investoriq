import axios from "axios";
import { sanitizeFinalCustomerHtml } from "./report-surface-contracts.js";
import {
  buildReportRevisionRequestKey,
  normalizeReportRevisionKind,
} from "../../src/lib/reportRevisionAuthority.js";
import {
  assertFinalPdfPublicationQuality,
  isFinalPdfCustomerDeliveryAllowed,
} from "./final-pdf-publication-quality-boss.js";
import { buildCanonicalReportIdentityReceipt } from "./report-identity-authority.js";
import {
  buildInstitutionalPdfRecoveryHtml,
  isInstitutionalPdfRecoveryEligible,
} from "./institutional-pdf-recovery.js";
import {
  isCollapseEligibleBossIssue,
  runSemanticRecompositionOnce,
} from "./section-disposition-runtime.js";
import {
  attachDocRaptorProviderDiagnostic,
  mergeDocRaptorProviderDiagnostics,
} from "./docraptor-provider-diagnostics.js";
import { resolveDocRaptorModeGovernanceReceipt } from "./docraptor-mode-governance.js";
import { DOCRAPTOR_REQUEST_TIMEOUT_MS, requestDocRaptorPdf } from "./docraptor-request.js";

export function sanitizeTypography(html) {
  return sanitizeFinalCustomerHtml(html);
}

function buildPdfBossFailureError(certification = null) {
  const error = new Error("Final PDF failed Publication Quality Boss certification");
  error.code = "PDF_ARTIFACT_FAILED";
  error.context = {
    failure_class: "internal_system_failure",
    customer_document_failure: false,
    final_pdf_publication_quality_boss: certification || null,
  };
  return error;
}

function buildCoreSafeFallbackRequiredError(certification = null, cause = null) {
  const error = new Error("Canonical core-safe PDF fallback is required for core display damage");
  error.code = "REPORT_GENERATION_FAILED";
  error.context = {
    failure_class: "internal_system_failure",
    customer_document_failure: false,
    core_publishable: true,
    core_display_fallback_required: true,
    core_display_fallback_available: false,
    final_pdf_publication_quality_boss: certification || null,
    cause: cause?.message || cause || "missing_core_safe_html",
    ...(cause?.context?.provider_diagnostics
      ? { provider_diagnostics: cause.context.provider_diagnostics }
      : {}),
    ...(cause?.context?.provider_diagnostics_by_attempt
      ? { provider_diagnostics_by_attempt: cause.context.provider_diagnostics_by_attempt }
      : {}),
  };
  return error;
}

function resolveBossCertificationFromError(error = null) {
  return error?.context?.final_pdf_publication_quality_boss || null;
}

function collectBossIssueCodes(certification = null) {
  return [
    ...(Array.isArray(certification?.blocking_issue_codes) ? certification.blocking_issue_codes : []),
    ...(Array.isArray(certification?.issues) ? certification.issues.map((issue) => issue?.code) : []),
  ].map((code) => String(code || "").trim()).filter(Boolean);
}

function hasCoreDisplayDamage(certification = null, sectionDispositionReceipts = {}) {
  const receipts = sectionDispositionReceipts && typeof sectionDispositionReceipts === "object"
    ? sectionDispositionReceipts
    : {};
  const coreSectionKeys = new Set(
    Object.entries(receipts)
      .filter(([, receipt]) => receipt?.classification === "core_required")
      .map(([sectionKey]) => sectionKey)
  );
  if (coreSectionKeys.size === 0) return false;

  return (Array.isArray(certification?.issues) ? certification.issues : []).some((issue) => {
    const evidence = issue?.evidence && typeof issue.evidence === "object" ? issue.evidence : {};
    const rows = [
      ...(Array.isArray(evidence.missing_rows) ? evidence.missing_rows : []),
      ...(Array.isArray(evidence.malformed_rows) ? evidence.malformed_rows : []),
      ...(Array.isArray(evidence.uncertified_rows) ? evidence.uncertified_rows : []),
    ];
    return rows.some((row) => coreSectionKeys.has(String(
      row?.sectionKey || row?.tableSectionKey || row?.section_key || ""
    ).trim()));
  });
}

function buildQualityIncidentCertification({
  certification = null,
  error = null,
  sectionDispositionReceipts = {},
  semanticRecompositionAttempted = false,
  semanticRecomposition = null,
  recoveryAttempted = false,
  coreDisplayFallbackUsed = false,
  coreSafeFallbackRequired = false,
} = {}) {
  const sourceCertification = certification || resolveBossCertificationFromError(error) || {};
  const sourceIssues = Array.isArray(sourceCertification.issues) ? sourceCertification.issues : [];
  const issueCodes = collectBossIssueCodes(sourceCertification);
  const issues = sourceIssues.length > 0
    ? sourceIssues
    : (issueCodes.length > 0 ? issueCodes : ["PDF_PUBLICATION_QUALITY_UNCERTIFIED"]).map((code) => ({
        code,
        message: "PDF publication quality remained uncertified after bounded recovery.",
      }));
  const receipts = sectionDispositionReceipts && typeof sectionDispositionReceipts === "object"
    ? sectionDispositionReceipts
    : {};

  return {
    ...sourceCertification,
    ok: false,
    status: "publishable_with_quality_incident",
    strict_institutional_certified: false,
    customer_delivery_allowed: true,
    external_publication_allowed: true,
    publication_disposition: "publish_with_quality_incident",
    blocking_issue_codes: [],
    issues: issues.map((issue) => ({
      ...issue,
      severity: "high",
      category: "internal_pdf_quality_incident",
      classification: "internal_quality_incident",
      failure_class: null,
      blocks_customer_delivery: false,
      publication_disposition: "publish_with_quality_incident",
    })),
    quality_incident: {
      source: "core_preserving_pdf_recovery",
      bounded_recovery_exhausted: true,
      css_recovery_attempted: recoveryAttempted,
      semantic_recomposition_attempted: semanticRecompositionAttempted,
      core_display_fallback_used: coreDisplayFallbackUsed,
      core_safe_fallback_required: coreSafeFallbackRequired,
      core_safe_fallback_diagnostic: error?.context?.core_display_fallback_required === true
        ? error.context
        : null,
      semantic_recomposition: semanticRecomposition || null,
      issue_codes: issueCodes,
      disposition: "publish_with_quality_incident",
      affected_section_dispositions: Object.fromEntries(
        Object.entries(receipts)
          .filter(([, receipt]) => ["include_qualified", "compact", "collapse", "omit"].includes(String(receipt?.disposition || "")))
          .map(([key, receipt]) => [key, receipt?.disposition || null])
      ),
    },
  };
}

export function finalizePdfBossFailure({
  certification = null,
  error = null,
  corePublishable = false,
  sectionDispositionReceipts = {},
  semanticRecompositionAttempted = false,
  semanticRecomposition = null,
  recoveryAttempted = false,
  coreDisplayFallbackUsed = false,
  coreSafeFallbackRequired = false,
} = {}) {
  const resolvedCertification = certification || resolveBossCertificationFromError(error) || null;
  if (corePublishable !== true) {
    return {
      publicationQualityBoss: resolvedCertification,
      terminalError: error || buildPdfBossFailureError(resolvedCertification),
      coreDisplayDamage: hasCoreDisplayDamage(resolvedCertification, sectionDispositionReceipts),
    };
  }

  const coreDisplayDamage = hasCoreDisplayDamage(resolvedCertification, sectionDispositionReceipts);
  return {
    publicationQualityBoss: buildQualityIncidentCertification({
      certification: resolvedCertification,
      error,
      sectionDispositionReceipts,
      semanticRecompositionAttempted,
      semanticRecomposition,
      recoveryAttempted,
      coreDisplayFallbackUsed,
      coreSafeFallbackRequired,
    }),
    terminalError: null,
    coreDisplayDamage,
  };
}

export function resolveCorePreservingPdfQualityIncident({
  certification = null,
  corePublishable = false,
  sectionDispositionReceipts = {},
  semanticRecompositionAttempted = false,
  semanticRecomposition = null,
  recoveryAttempted = false,
  coreDisplayFallbackUsed = false,
  coreSafeFallbackRequired = false,
} = {}) {
  if (
    !certification ||
    corePublishable !== true ||
    isFinalPdfCustomerDeliveryAllowed(certification)
  ) {
    return certification;
  }

  return buildQualityIncidentCertification({
    certification,
    sectionDispositionReceipts,
    semanticRecompositionAttempted,
    semanticRecomposition,
    recoveryAttempted,
    coreDisplayFallbackUsed,
    coreSafeFallbackRequired,
  });
}

export async function runBoundedPdfCertificationRecovery({
  initialPdfBuffer,
  finalHtml = "",
  coreSafeHtml = "",
  emergencyCoreHtml = "",
  coreSafeHtmlBuildError = null,
  buildEmergencyCoreHtml = null,
  initialArtifactIsEmergency = false,
  initialArtifactHtml = "",
  initialRenderError = null,
  renderPdfBuffer,
  renderContext = {},
  certifyPdf,
  sectionDispositionReceipts = {},
  corePublishable = false,
} = {}) {
  if (typeof renderPdfBuffer !== "function" || typeof certifyPdf !== "function") {
    throw new TypeError("Bounded PDF certification recovery requires render and certify functions");
  }

  const receipts = sectionDispositionReceipts && typeof sectionDispositionReceipts === "object"
    ? sectionDispositionReceipts
    : {};
  let pdfBuffer = initialPdfBuffer;
  let publicationState = corePublishable === true ? "published" : "failed";
  let publicationRetryRequired = false;
  let publicationRetryReason = null;
  let publicationQualityBoss = null;
  let institutionalPdfRecovery = null;
  let semanticRecomposition = null;
  let recoveryAttempted = false;
  let semanticRecompositionAttempted = false;
  let coreDisplayFallbackUsed = false;
  let coreSafeFallbackAttempted = false;
  let emergencyCoreFallbackUsed = false;
  let artifactReplacementRequired = false;
  let certificationHtml = initialArtifactHtml || finalHtml;
  const withRecoveryState = (result) => ({
    ...result,
    artifactReplacementRequired,
    emergencyCoreFallbackUsed,
    coreSafeFallbackAttempted,
    publicationState,
    publicationRetryRequired,
    publicationRetryReason,
  });

  const markRecoverablePublicationState = (reason = "publication_retry_required") => {
    publicationState = "recovery_required";
    publicationRetryRequired = true;
    publicationRetryReason = String(reason || "").trim() || "publication_retry_required";
  };

  const certify = async (buffer, options = {}) => {
    try {
      const result = await certifyPdf(buffer, {
        approvedHtmlForCertification: certificationHtml,
        sectionDispositionReceipts: receipts,
        semanticRecompositionReceipt: null,
        ...options,
      });
      return { result, error: null };
    } catch (error) {
      return {
        result: error?.context?.final_pdf_publication_quality_boss || null,
        error,
      };
    }
  };

  const render = (html, renderAttempt) => renderPdfBuffer({
    ...renderContext,
    finalHtml: html,
    renderAttempt,
  });
  const finalizeFailure = ({ certification, error }) => {
    const finalized = finalizePdfBossFailure({
      certification,
      error,
      corePublishable,
      sectionDispositionReceipts: receipts,
      semanticRecompositionAttempted,
      semanticRecomposition,
      recoveryAttempted,
      coreDisplayFallbackUsed,
      coreSafeFallbackRequired: hasCoreDisplayDamage(
        certification || resolveBossCertificationFromError(error),
        receipts
      ),
    });
    if (finalized.publicationQualityBoss?.quality_incident) {
      finalized.publicationQualityBoss = {
        ...finalized.publicationQualityBoss,
        quality_incident: {
          ...finalized.publicationQualityBoss.quality_incident,
          core_safe_fallback_attempted: coreSafeFallbackAttempted,
          emergency_core_fallback_used: emergencyCoreFallbackUsed,
        },
      };
    }
    return finalized;
  };

  const buildRecoveryDiagnostic = (priorCertification, cause, reason) => {
    const diagnostic = buildCoreSafeFallbackRequiredError(priorCertification, cause || reason);
    diagnostic.context.recovery_reason = reason || null;
    return diagnostic;
  };

  const resolveEmergencyCoreHtml = async () => {
    const providedHtml = String(emergencyCoreHtml || "").trim();
    if (providedHtml) return { html: providedHtml, error: null };
    if (typeof buildEmergencyCoreHtml !== "function") return { html: "", error: null };
    try {
      const builtHtml = await buildEmergencyCoreHtml();
      return { html: String(builtHtml || "").trim(), error: null };
    } catch (error) {
      return { html: "", error };
    }
  };

  const renderEmergencyCoreFallback = async ({
    priorCertification = null,
    cause = null,
    reason = "emergency_core_fallback",
  } = {}) => {
    if (corePublishable !== true) {
      const finalized = finalizeFailure({
        certification: priorCertification,
        error: cause || buildPdfBossFailureError(priorCertification),
      });
      return withRecoveryState({
        pdfBuffer,
        publicationQualityBoss: finalized.publicationQualityBoss,
        institutionalPdfRecovery,
        semanticRecomposition,
        recoveryAttempted,
        semanticRecompositionAttempted,
        terminalError: finalized.terminalError,
      });
    }

    const emergencyHtmlResult = await resolveEmergencyCoreHtml();
    const emergencyHtml = emergencyHtmlResult.html;
    if (!emergencyHtml) {
      const diagnostic = buildRecoveryDiagnostic(
        priorCertification,
        cause || emergencyHtmlResult.error || coreSafeHtmlBuildError,
        reason
      );
      markRecoverablePublicationState(reason);
      return withRecoveryState({
        pdfBuffer,
        publicationQualityBoss: priorCertification,
        institutionalPdfRecovery,
        semanticRecomposition,
        recoveryAttempted,
        semanticRecompositionAttempted,
        terminalError: null,
        publicationRecoveryError: diagnostic,
      });
    }

    let emergencyPdfBuffer;
    try {
      emergencyPdfBuffer = await render(emergencyHtml, "emergency_core");
    } catch (error) {
      const diagnostic = buildRecoveryDiagnostic(priorCertification, error, reason);
      markRecoverablePublicationState(reason);
      return withRecoveryState({
        pdfBuffer,
        publicationQualityBoss: priorCertification,
        institutionalPdfRecovery,
        semanticRecomposition,
        recoveryAttempted,
        semanticRecompositionAttempted,
        terminalError: null,
        publicationRecoveryError: diagnostic,
      });
    }

    pdfBuffer = emergencyPdfBuffer;
    artifactReplacementRequired = true;
    certificationHtml = emergencyHtml;
    coreDisplayFallbackUsed = true;
    emergencyCoreFallbackUsed = true;
    const emergencyCertification = await certify(emergencyPdfBuffer, {
      approvedHtmlForCertification: emergencyHtml,
    });
    const diagnostic = buildRecoveryDiagnostic(
      emergencyCertification.result || priorCertification,
      emergencyCertification.error || cause,
      reason
    );
    const finalized = finalizeFailure({
      certification: emergencyCertification.result || priorCertification,
      error: diagnostic,
    });
    return withRecoveryState({
      pdfBuffer: emergencyPdfBuffer,
      publicationQualityBoss: finalized.publicationQualityBoss,
      institutionalPdfRecovery,
      semanticRecomposition,
      recoveryAttempted,
      semanticRecompositionAttempted,
      terminalError: null,
    });
  };

  const renderCoreSafeFallbackIfRequired = async (certification) => {
    const issueCodes = collectBossIssueCodes(certification);
    const coreDamage = hasCoreDisplayDamage(certification, receipts);
    if (corePublishable !== true || !coreDamage || issueCodes.length === 0) {
      return { result: certification, error: null, used: false, coreDamage: false };
    }
    coreSafeFallbackAttempted = true;
    const fallbackHtml = String(coreSafeHtml || "").trim();
    if (!fallbackHtml) {
      return {
        result: certification,
        error: buildRecoveryDiagnostic(certification, coreSafeHtmlBuildError, "core_safe_fallback_unavailable"),
        used: false,
        coreDamage: true,
      };
    }
    let coreSafePdfBuffer;
    try {
      coreSafePdfBuffer = await render(fallbackHtml, "core_safe");
    } catch (error) {
      return {
        result: certification,
        error: buildRecoveryDiagnostic(certification, error, "core_safe_fallback_render_failed"),
        used: false,
        coreDamage: true,
      };
    }
    pdfBuffer = coreSafePdfBuffer;
    artifactReplacementRequired = true;
    certificationHtml = fallbackHtml;
    coreDisplayFallbackUsed = true;
    const fallbackCertification = await certify(coreSafePdfBuffer, {
      approvedHtmlForCertification: fallbackHtml,
    });
    return {
      result: fallbackCertification.result || certification,
      error: fallbackCertification.error,
      used: true,
      coreDamage: Boolean(fallbackCertification.error) || hasCoreDisplayDamage(fallbackCertification.result, receipts),
    };
  };

  const initial = await certify(pdfBuffer);
  publicationQualityBoss = initial.result;
  if (initialArtifactIsEmergency) {
    emergencyCoreFallbackUsed = true;
    coreDisplayFallbackUsed = true;
    const finalized = finalizeFailure({
      certification: publicationQualityBoss,
      error: buildRecoveryDiagnostic(
        publicationQualityBoss,
        initialRenderError || initial.error,
        "initial_rich_render_failed"
      ),
    });
    publicationQualityBoss = finalized.publicationQualityBoss;
    return withRecoveryState({
      pdfBuffer,
      publicationQualityBoss,
      institutionalPdfRecovery,
      semanticRecomposition,
      recoveryAttempted,
      semanticRecompositionAttempted,
      artifactReplacementRequired,
      emergencyCoreFallbackUsed,
      coreSafeFallbackAttempted,
      terminalError: finalized.terminalError,
    });
  }
  if (!initial.error && isFinalPdfCustomerDeliveryAllowed(publicationQualityBoss) && !isInstitutionalPdfRecoveryEligible(publicationQualityBoss)) {
    return withRecoveryState({
      pdfBuffer,
      publicationQualityBoss,
      institutionalPdfRecovery,
      semanticRecomposition,
      recoveryAttempted,
      semanticRecompositionAttempted,
      terminalError: null,
    });
  }

  if (!isInstitutionalPdfRecoveryEligible(publicationQualityBoss)) {
    const coreSafeFallback = await renderCoreSafeFallbackIfRequired(publicationQualityBoss);
    if (!coreSafeFallback.error && isFinalPdfCustomerDeliveryAllowed(coreSafeFallback.result)) {
      publicationQualityBoss = coreSafeFallback.result;
      return withRecoveryState({
        pdfBuffer,
        publicationQualityBoss,
        institutionalPdfRecovery,
        semanticRecomposition,
        recoveryAttempted,
        semanticRecompositionAttempted,
        terminalError: null,
      });
    }
    if (coreSafeFallback.coreDamage) {
      return renderEmergencyCoreFallback({
        priorCertification: coreSafeFallback.result || publicationQualityBoss,
        cause: coreSafeFallback.error || initial.error,
        reason: "core_safe_fallback_unavailable_or_damaged",
      });
    }
    if (coreSafeFallback.result) publicationQualityBoss = coreSafeFallback.result;
    const finalized = finalizeFailure({
      certification: publicationQualityBoss,
      error: coreSafeFallback.error || initial.error,
    });
    publicationQualityBoss = finalized.publicationQualityBoss;
    return withRecoveryState({
      pdfBuffer,
      publicationQualityBoss,
      institutionalPdfRecovery,
      semanticRecomposition,
      recoveryAttempted,
      semanticRecompositionAttempted,
      terminalError: finalized.terminalError,
    });
  }

  recoveryAttempted = true;
  const recovery = buildInstitutionalPdfRecoveryHtml({ approvedHtml: finalHtml, certification: publicationQualityBoss });
  let cssRecovery;
  let cssPdfBuffer;
  try {
    cssPdfBuffer = await render(recovery.html, "css_recovery");
  } catch (error) {
    if (corePublishable === true) {
      return renderEmergencyCoreFallback({
        priorCertification: publicationQualityBoss,
        cause: error,
        reason: "css_recovery_render_failed",
      });
    }
    const finalized = finalizeFailure({ certification: publicationQualityBoss, error });
    return withRecoveryState({
      pdfBuffer,
      publicationQualityBoss: finalized.publicationQualityBoss,
      institutionalPdfRecovery,
      semanticRecomposition,
      recoveryAttempted,
      semanticRecompositionAttempted,
      terminalError: finalized.terminalError,
    });
  }
  pdfBuffer = cssPdfBuffer;
  artifactReplacementRequired = true;
  certificationHtml = recovery.html;
  cssRecovery = await certify(cssPdfBuffer);
  publicationQualityBoss = cssRecovery.result;
  institutionalPdfRecovery = {
    ...recovery.receipt,
    initialCertificationStatus: initial.result?.status || null,
    finalCertificationStatus: publicationQualityBoss?.status || null,
    recovered: publicationQualityBoss?.ok === true,
    customerDeliveryPreserved: isFinalPdfCustomerDeliveryAllowed(publicationQualityBoss),
  };
  if (!cssRecovery.error && isFinalPdfCustomerDeliveryAllowed(publicationQualityBoss)) {
    return withRecoveryState({
      pdfBuffer,
      publicationQualityBoss,
      institutionalPdfRecovery,
      semanticRecomposition,
      recoveryAttempted,
      semanticRecompositionAttempted,
      terminalError: null,
    });
  }

  const codes = [
    ...(Array.isArray(publicationQualityBoss?.blocking_issue_codes) ? publicationQualityBoss.blocking_issue_codes : []),
    ...(Array.isArray(publicationQualityBoss?.issues) ? publicationQualityBoss.issues.map((issue) => issue?.code) : []),
  ].map((code) => String(code || "").trim()).filter(Boolean);
  const semanticEligible =
    !hasCoreDisplayDamage(publicationQualityBoss, receipts) &&
    codes.length > 0 &&
    codes.every((code) => isCollapseEligibleBossIssue(code));
  if (!semanticEligible) {
    const coreSafeFallback = await renderCoreSafeFallbackIfRequired(publicationQualityBoss);
    if (!coreSafeFallback.error && isFinalPdfCustomerDeliveryAllowed(coreSafeFallback.result)) {
      publicationQualityBoss = coreSafeFallback.result;
      return withRecoveryState({
        pdfBuffer,
        publicationQualityBoss,
        institutionalPdfRecovery,
        semanticRecomposition,
        recoveryAttempted,
        semanticRecompositionAttempted,
        terminalError: null,
      });
    }
    if (coreSafeFallback.coreDamage) {
      return renderEmergencyCoreFallback({
        priorCertification: coreSafeFallback.result || publicationQualityBoss,
        cause: coreSafeFallback.error || cssRecovery.error,
        reason: "core_safe_fallback_unavailable_or_damaged_after_css",
      });
    }
    if (coreSafeFallback.result) publicationQualityBoss = coreSafeFallback.result;
    const finalized = finalizeFailure({
      certification: publicationQualityBoss,
      error: coreSafeFallback.error || cssRecovery.error,
    });
    publicationQualityBoss = finalized.publicationQualityBoss;
    return withRecoveryState({
      pdfBuffer,
      publicationQualityBoss,
      institutionalPdfRecovery,
      semanticRecomposition,
      recoveryAttempted,
      semanticRecompositionAttempted,
      terminalError: finalized.terminalError,
    });
  }

  semanticRecompositionAttempted = true;
  const semantic = runSemanticRecompositionOnce(finalHtml);
  certificationHtml = semantic.html;
  semanticRecomposition = {
    ...semantic.receipt,
    initialCertificationStatus: publicationQualityBoss?.status || null,
    priorCssRecovery: institutionalPdfRecovery,
  };
  let semanticPdfBuffer;
  let semanticCertification;
  try {
    semanticPdfBuffer = await render(semantic.html, "semantic_recovery");
  } catch (error) {
    if (corePublishable === true) {
      return renderEmergencyCoreFallback({
        priorCertification: publicationQualityBoss,
        cause: error,
        reason: "semantic_recomposition_render_failed",
      });
    }
    const finalized = finalizeFailure({ certification: publicationQualityBoss, error });
    return withRecoveryState({
      pdfBuffer,
      publicationQualityBoss: finalized.publicationQualityBoss,
      institutionalPdfRecovery,
      semanticRecomposition,
      recoveryAttempted,
      semanticRecompositionAttempted,
      terminalError: finalized.terminalError,
    });
  }
  pdfBuffer = semanticPdfBuffer;
  artifactReplacementRequired = true;
  semanticCertification = await certify(semanticPdfBuffer, {
    approvedHtmlForCertification: semantic.html,
    semanticRecompositionReceipt: semantic.receipt,
  });
  publicationQualityBoss = semanticCertification.result;
  semanticRecomposition = {
    ...semanticRecomposition,
    finalCertificationStatus: publicationQualityBoss?.status || null,
    recovered: publicationQualityBoss?.ok === true,
    customerDeliveryPreserved: isFinalPdfCustomerDeliveryAllowed(publicationQualityBoss),
  };

  if (!isFinalPdfCustomerDeliveryAllowed(publicationQualityBoss)) {
    const coreSafeFallback = await renderCoreSafeFallbackIfRequired(publicationQualityBoss);
    if (!coreSafeFallback.error && isFinalPdfCustomerDeliveryAllowed(coreSafeFallback.result)) {
      publicationQualityBoss = coreSafeFallback.result;
      semanticRecomposition.customerDeliveryPreserved = true;
    } else if (coreSafeFallback.coreDamage) {
      return renderEmergencyCoreFallback({
        priorCertification: coreSafeFallback.result || publicationQualityBoss,
        cause: coreSafeFallback.error || semanticCertification.error,
        reason: "core_display_damage_after_semantic_recovery",
      });
    } else {
      if (coreSafeFallback.result) publicationQualityBoss = coreSafeFallback.result;
      const finalized = finalizeFailure({
        certification: publicationQualityBoss,
        error: coreSafeFallback.error || semanticCertification.error,
      });
      publicationQualityBoss = finalized.publicationQualityBoss;
      if (finalized.terminalError) {
        return withRecoveryState({
          pdfBuffer,
          publicationQualityBoss,
          institutionalPdfRecovery,
          semanticRecomposition,
          recoveryAttempted,
          semanticRecompositionAttempted,
          terminalError: finalized.terminalError,
        });
      }
      semanticRecomposition.customerDeliveryPreserved = true;
    }
  }

  return withRecoveryState({
    pdfBuffer,
    publicationQualityBoss,
    institutionalPdfRecovery,
    semanticRecomposition,
    recoveryAttempted,
    semanticRecompositionAttempted,
    artifactReplacementRequired,
    emergencyCoreFallbackUsed,
    coreSafeFallbackAttempted,
    terminalError: null,
  });
}

export function buildDeliveryResponseCompatibilityAliases(deliveryDecisionState = null) {
  const state = deliveryDecisionState && typeof deliveryDecisionState === "object" ? deliveryDecisionState : {};
  const rawDeliveryGateStatus = String(state.delivery_gate_status || state.final_delivery_status || "blocked");
  const hasCanonicalDeliveryGateState =
    state.source === "canonical_delivery_decision" &&
    state.core_valid_required_coverage === true;
  const hasCanonicalCoreValidState = hasCanonicalDeliveryGateState;
  const deliveryGateStatus = hasCanonicalCoreValidState ? rawDeliveryGateStatus : "blocked";
  const customerDeliveryGateStatus =
    rawDeliveryGateStatus === "user_needs_documents"
      ? "replacement_source_required"
      : deliveryGateStatus;
  const customerBlockers = Array.isArray(state.customer_blockers)
    ? state.customer_blockers
    : Array.isArray(state.customer_publish_blockers)
      ? state.customer_publish_blockers
      : Array.isArray(state.blockingReasons)
        ? state.blockingReasons
        : [];
  const canonicalCustomerDeliveryAllowed = state.customer_delivery_allowed === true;
  const customerDeliveryAllowed =
    hasCanonicalCoreValidState &&
    canonicalCustomerDeliveryAllowed &&
    deliveryGateStatus === "deliverable" &&
    !Boolean(state.hold_delivery) &&
    customerBlockers.length === 0;
  const holdDelivery = Boolean(state.hold_delivery) || !customerDeliveryAllowed;
  const publicSampleReady = Boolean(state.public_sample_ready);
  const highValueOutreachReady = Boolean(state.high_value_outreach_ready);
  const launchPathRecommendation =
    customerDeliveryAllowed
      ? (publicSampleReady && highValueOutreachReady
        ? "customer_deliverable"
        : "customer_deliverable_with_internal_advisory")
      : (rawDeliveryGateStatus === "user_needs_documents" ? "replacement_source_required" : "customer_deliverable");
  const readinessHierarchy = {
    final_delivery_authority: "delivery_gate",
    final_delivery_status: customerDeliveryGateStatus,
    customer_delivery_ready: customerDeliveryAllowed,
    customer_publish_eligible: customerDeliveryAllowed,
    report_publishable: customerDeliveryAllowed,
    report_blocked: !customerDeliveryAllowed,
    public_sample_ready: publicSampleReady,
    high_value_outreach_ready: highValueOutreachReady,
    advisory_only_findings: Array.isArray(state.advisory_only_findings) ? state.advisory_only_findings.length : 0,
  };
  return {
    delivery_gate_status: customerDeliveryGateStatus,
    customer_delivery_allowed: customerDeliveryAllowed,
    hold_delivery: holdDelivery,
    holdDelivery,
    report_publishable: customerDeliveryAllowed,
    report_blocked: !customerDeliveryAllowed,
    customer_delivery_ready: customerDeliveryAllowed,
    customer_publish_eligible: customerDeliveryAllowed,
    launch_path_recommendation: launchPathRecommendation,
    readiness_hierarchy: readinessHierarchy,
    legacy_compatibility: {
      delivery_gate_status: customerDeliveryGateStatus,
      customer_delivery_ready: customerDeliveryAllowed,
      customer_publish_eligible: customerDeliveryAllowed,
      report_publishable: customerDeliveryAllowed,
      report_blocked: !customerDeliveryAllowed,
      launch_path_recommendation: launchPathRecommendation,
      hold_delivery: holdDelivery,
      holdDelivery,
      public_sample_ready: publicSampleReady,
      high_value_outreach_ready: highValueOutreachReady,
    },
  };
}

export function isValidReportStoragePath(storagePath) {
  const normalized = typeof storagePath === "string" ? storagePath.trim() : "";
  return normalized.length > 0 && normalized.includes("/") && normalized.toLowerCase().endsWith(".pdf");
}

export function buildReportStoragePath({ effectiveUserId, reportSeed } = {}) {
  const userPart = String(effectiveUserId ?? "").trim();
  const seedPart = String(reportSeed ?? "").trim();
  if (!userPart || !seedPart) return "";
  return `${userPart}/${seedPart}.pdf`;
}

function buildReportRevisionInsertValues({
  job = {},
  reportData = {},
  revision = null,
  existingReportId = null,
} = {}) {
  const explicitRevision =
    revision && typeof revision === "object" ? revision :
    reportData?.revision && typeof reportData.revision === "object" ? reportData.revision :
    {};
  const effectiveJobId = String(job?.id ?? reportData?.jobId ?? reportData?.job_id ?? "").trim() || null;
  const revisionKind = normalizeReportRevisionKind(
    explicitRevision.revision_kind ??
      explicitRevision.kind ??
      reportData?.revision_kind ??
      reportData?.revision?.kind ??
      "original",
    "original",
  );
  const revisionRootReportId = String(
    explicitRevision.revision_root_report_id ??
      reportData?.revision_root_report_id ??
      reportData?.revision?.root_report_id ??
      "",
  ).trim() || null;
  const revisionParentReportId = String(
    explicitRevision.revision_parent_report_id ??
      reportData?.revision_parent_report_id ??
      reportData?.revision?.parent_report_id ??
      "",
  ).trim() || null;
  const explicitRevisionNumber = Number(
    explicitRevision.revision_number ??
      reportData?.revision_number ??
      reportData?.revision?.number ??
      NaN,
  );
  const revisionNumber =
    Number.isInteger(explicitRevisionNumber) && explicitRevisionNumber >= 1
      ? explicitRevisionNumber
      : revisionKind === "original"
        ? 1
        : null;
  const revisionFamilyKey = String(
    explicitRevision.revision_family_key ??
      reportData?.revision_family_key ??
      reportData?.revision?.family_key ??
      revisionRootReportId ??
      "",
  ).trim() || null;
  const revisionSourceJobId = String(
    explicitRevision.revision_source_job_id ??
      reportData?.revision_source_job_id ??
      effectiveJobId ??
      "",
  ).trim() || null;
  const revisionRequestKey = String(
    explicitRevision.revision_request_key ??
      reportData?.revision_request_key ??
      buildReportRevisionRequestKey({
        revisionKind,
        revisionFamilyKey: revisionFamilyKey || revisionRootReportId || existingReportId,
        revisionNumber,
        revisionParentReportId,
        revisionSourceJobId,
      }),
  ).trim() || null;

  if (revisionKind !== "original") {
    if (!revisionRootReportId) {
      const err = new Error(`Missing revision root report id for ${revisionKind} report publication`);
      err.code = "REPORT_GENERATION_FAILED";
      err.context = { revisionKind };
      throw err;
    }
    if (!revisionNumber) {
      const err = new Error(`Missing revision number for ${revisionKind} report publication`);
      err.code = "REPORT_GENERATION_FAILED";
      err.context = { revisionKind, revisionRootReportId };
      throw err;
    }
  }

  return {
    revision_kind: revisionKind,
    revision_family_key: revisionFamilyKey,
    revision_root_report_id: revisionRootReportId,
    revision_parent_report_id: revisionParentReportId,
    revision_number: revisionNumber,
    revision_request_key: revisionRequestKey,
    revision_source_job_id: revisionSourceJobId,
    is_current_revision: false,
    revision_published_at: null,
  };
}

export async function promoteReportRevisionToCurrent({
  supabaseAdmin,
  reportId = null,
} = {}) {
  if (!supabaseAdmin?.rpc) {
    throw new Error("Missing report promotion database client");
  }
  const trimmedReportId = String(reportId ?? "").trim();
  if (!trimmedReportId) {
    throw new Error("Missing report id for revision promotion");
  }
  const { data, error } = await supabaseAdmin.rpc("promote_report_revision_to_current", {
    p_report_id: trimmedReportId,
  });
  if (error) {
    throw error;
  }
  const resolved = Array.isArray(data) ? data[0] : data;
  return {
    promoted: Boolean(resolved?.promoted),
    stale: Boolean(resolved?.stale),
    reportId: String(resolved?.report_id ?? trimmedReportId).trim() || trimmedReportId,
    demotedReportId: String(resolved?.demoted_report_id ?? "").trim() || null,
    revisionFamilyKey: String(resolved?.revision_family_key ?? "").trim() || null,
    revisionNumber: Number.isInteger(Number(resolved?.revision_number)) ? Number(resolved.revision_number) : null,
  };
}

function normalizeReportDownloadArtifactMode(reportDownloadArtifactMode = "") {
  const normalized = String(reportDownloadArtifactMode || "").trim().toLowerCase();
  if (!normalized) return "";
  if (["production", "production_pdf", "prod", "launch"].includes(normalized)) return "production_pdf";
  if (["docraptor_test_pdf", "docraptor_test", "watermarked_pdf", "watermarked"].includes(normalized)) {
    return "docraptor_test_pdf";
  }
  if (["test", "test_pdf", "stub", "stub_pdf", "prelaunch"].includes(normalized)) return "stub_pdf";
  return normalized;
}

function buildPrelaunchTestPdfBuffer({
  finalHtml = "",
  reportType = "",
  reportSeed = null,
  propertyName = "",
  storagePath = "",
} = {}) {
  const escapePdfText = (value) =>
    String(value ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r?\n/g, " ");

  const bodyLines = [
    "InvestorIQ prelaunch test artifact. Production PDF generation disabled.",
    `Report type: ${String(reportType || "").trim() || "unknown"}`,
    reportSeed ? `Report seed: ${String(reportSeed || "").trim()}` : "",
    propertyName ? `Property: ${String(propertyName || "").trim()}` : "",
    storagePath ? `Storage path: ${String(storagePath || "").trim()}` : "",
    String(finalHtml || "").trim() ? "Sealed customer HTML captured for prelaunch delivery proof." : "",
  ].filter(Boolean);

  const contentLines = bodyLines.length
    ? bodyLines.map((line, index) => `${index === 0 ? "" : "0 -18 Td\n"}(${escapePdfText(line)}) Tj`).join("\n")
    : "(InvestorIQ prelaunch test artifact.) Tj";
  const contentStream = `BT\n/F1 12 Tf\n72 740 Td\n${contentLines}\nET\n`;

  const header = "%PDF-1.4\n";
  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}endstream\nendobj\n`,
  ];

  const offsets = [0];
  let currentOffset = Buffer.byteLength(header, "utf8");
  for (const object of objects) {
    offsets.push(currentOffset);
    currentOffset += Buffer.byteLength(object, "utf8");
  }

  const xrefEntries = offsets
    .map((offset, index) => (index === 0 ? "0000000000 65535 f \n" : `${String(offset).padStart(10, "0")} 00000 n \n`))
    .join("");
  const xref = `xref\n0 ${offsets.length}\n${xrefEntries}trailer\n<< /Root 1 0 R /Size ${offsets.length} >>\nstartxref\n${currentOffset}\n%%EOF\n`;

  return Buffer.from(`${header}${objects.join("")}${xref}`, "utf8");
}

export function resolveReportDownloadArtifactMode({
  reportDownloadArtifactMode = process.env.REPORT_DOWNLOAD_ARTIFACT_MODE || "",
  allowProductionPdf = process.env.ALLOW_PRODUCTION_PDF === "true",
  docraptorMode = process.env.DOCRAPTOR_MODE === "production" ? "production" : "test",
  hasDocRaptorApiKey = Boolean(String(process.env.DOCRAPTOR_API_KEY || "").trim()),
  productionOwnerAuthorized = process.env.DOCRAPTOR_PRODUCTION_OWNER_AUTHORIZED === "true",
} = {}) {
  return resolveDocRaptorModeGovernanceReceipt({
    reportDownloadArtifactMode,
    allowProductionPdf,
    docraptorMode,
    hasDocRaptorApiKey,
    productionOwnerAuthorized,
  }).resolved_report_download_artifact_mode;
}

export async function renderReportPdfBuffer({
  finalHtml,
  reportType = "",
  allowProductionPdf = process.env.ALLOW_PRODUCTION_PDF === "true",
  docraptorMode = process.env.DOCRAPTOR_MODE === "production" ? "production" : "test",
  reportDownloadArtifactMode = process.env.REPORT_DOWNLOAD_ARTIFACT_MODE || "",
  productionOwnerAuthorized = process.env.DOCRAPTOR_PRODUCTION_OWNER_AUTHORIZED === "true",
  reportSeed = null,
  propertyName = "",
  storagePath = "",
  renderAttempt = "initial",
  docraptorRequestTimeoutMs = DOCRAPTOR_REQUEST_TIMEOUT_MS,
} = {}) {
  const docraptorGovernanceReceipt = resolveDocRaptorModeGovernanceReceipt({
    reportDownloadArtifactMode,
    allowProductionPdf,
    docraptorMode,
    productionOwnerAuthorized,
  });
  const artifactMode = docraptorGovernanceReceipt.resolved_report_download_artifact_mode;
  const governedDocraptorMode = docraptorGovernanceReceipt.resolved_docraptor_mode;
  if (artifactMode === "stub_pdf") {
    return buildPrelaunchTestPdfBuffer({
      finalHtml,
      reportType,
      reportSeed,
      propertyName,
      storagePath,
    });
  }

  const apiKey = String(process.env.DOCRAPTOR_API_KEY || "").trim();
  try {
    const pdfResponse = await requestDocRaptorPdf({
      documentContent: String(finalHtml || ""),
      apiKey,
      docraptorMode: governedDocraptorMode,
      attempt: renderAttempt,
      timeoutMs: docraptorRequestTimeoutMs,
    });

    return Buffer.isBuffer(pdfResponse.data) ? pdfResponse.data : Buffer.from(pdfResponse.data);
  } catch (error) {
    attachDocRaptorProviderDiagnostic(error, { attempt: renderAttempt, timeoutMs: docraptorRequestTimeoutMs });
    throw error;
  }
}

export async function ensureReportDownloadArtifact({
  supabaseAdmin,
  job = {},
  reportId = null,
  storagePath = null,
  finalHtml = "",
  reportType = "",
  reportSeed = null,
  propertyName = "",
  allowProductionPdf = process.env.ALLOW_PRODUCTION_PDF === "true",
  docraptorMode = process.env.DOCRAPTOR_MODE === "production" ? "production" : "test",
  reportDownloadArtifactMode = process.env.REPORT_DOWNLOAD_ARTIFACT_MODE || "",
  productionOwnerAuthorized = process.env.DOCRAPTOR_PRODUCTION_OWNER_AUTHORIZED === "true",
  renderPdfBuffer = renderReportPdfBuffer,
  createdReportRecord = false,
  bucketName = "generated_reports",
  deliveryGateStatus = null,
  holdDelivery = false,
  deterministicContractQaSeal = null,
  sectionDispositionReceipts = null,
  corePublishable = false,
  coreSafeHtml = "",
  emergencyCoreHtml = "",
  buildEmergencyCoreHtml = null,
  sourceReconciliation = null,
  reportIdentity = null,
  publicationTarget = process.env.REPORT_PUBLICATION_TARGET || "",
  runFinalPdfPublicationQualityBoss = assertFinalPdfPublicationQuality,
  docraptorRequestTimeoutMs = DOCRAPTOR_REQUEST_TIMEOUT_MS,
} = {}) {
  if (deliveryGateStatus !== "deliverable" || holdDelivery === true) {
    const err = new Error("Report download artifact blocked before resolution");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      deliveryGateStatus: deliveryGateStatus || null,
      holdDelivery: Boolean(holdDelivery),
    };
    throw err;
  }
  const normalizedStoragePath = typeof storagePath === "string" ? storagePath.trim() : "";
  const resolvedCorePublishable =
    corePublishable === true || deterministicContractQaSeal?.corePublishable === true;
  const buildRecoverableArtifactResult = ({
    publicationRetryReason = "publication_retry_required",
    publicationQualityBoss = null,
    institutionalPdfRecovery = null,
    semanticRecomposition = null,
    artifactReplacementRequired = false,
    publicationRecoveryError = null,
  } = {}) => ({
    reportId: reportId || null,
    storagePath: normalizedStoragePath,
    artifactSource: "publication_retry_required",
    verifiedDownloadArtifact: false,
    createdDownloadArtifact: false,
    publicationState: "recovery_required",
    publicationRetryRequired: true,
    publicationRetryReason: String(publicationRetryReason || "").trim() || "publication_retry_required",
    publicationQualityBoss,
    institutionalPdfRecovery,
    semanticRecomposition,
    artifactReplacementRequired: Boolean(artifactReplacementRequired),
    publicationRecoveryError: publicationRecoveryError || null,
  });
  if (!normalizedStoragePath) {
    const err = new Error("Missing valid report storage path before download artifact");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: reportId || null,
      storagePath: normalizedStoragePath || null,
      reportType: String(reportType || "").trim() || null,
      reportSeed: String(reportSeed || "").trim() || null,
    };
    if (resolvedCorePublishable === true) {
      return buildRecoverableArtifactResult({
        publicationRetryReason: "missing_valid_storage_path",
        publicationRecoveryError: err,
      });
    }
    throw err;
  }

  const storageBucket = supabaseAdmin?.storage?.from?.(bucketName);
  if (!storageBucket) {
    const err = new Error("Missing report storage client");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      bucketName,
    };
    if (resolvedCorePublishable === true) {
      return buildRecoverableArtifactResult({
        publicationRetryReason: "missing_report_storage_client",
        publicationRecoveryError: err,
      });
    }
    throw err;
  }

  const docraptorGovernanceReceipt = resolveDocRaptorModeGovernanceReceipt({
    reportDownloadArtifactMode,
    allowProductionPdf,
    docraptorMode,
    productionOwnerAuthorized,
  });
  const artifactMode = docraptorGovernanceReceipt.resolved_report_download_artifact_mode;
  const governedDocraptorMode = docraptorGovernanceReceipt.resolved_docraptor_mode;
  const resolvedPublicationTarget = String(publicationTarget || "").trim() ||
    (artifactMode === "production_pdf" ? "external_customer" : "internal_test");
  const canonicalReportIdentity = buildCanonicalReportIdentityReceipt({
    reportMode: reportIdentity?.reportMode || null,
    reportType: reportIdentity?.reportType || reportType || null,
  });
  const baseSectionDispositionReceipts =
    sectionDispositionReceipts && typeof sectionDispositionReceipts === "object"
      ? sectionDispositionReceipts
      : deterministicContractQaSeal?.sectionDispositionReceipts ||
        deterministicContractQaSeal?.section_disposition_receipts ||
        deterministicContractQaSeal?.qualityManifest?.sectionDispositionReceipts ||
        {};
  const certifyPdf = async (
    pdfBytes,
    {
      approvedHtmlForCertification = finalHtml,
      sectionDispositionReceipts = baseSectionDispositionReceipts,
      semanticRecompositionReceipt = null,
    } = {}
  ) => runFinalPdfPublicationQualityBoss({
    pdfBytes,
    approvedHtml: approvedHtmlForCertification,
    deterministicContractQaSeal,
    sourceReconciliation,
    reportIdentity: canonicalReportIdentity,
    artifactMode,
    publicationTarget: resolvedPublicationTarget,
    sectionDispositionReceipts,
    semanticRecompositionReceipt,
  });
  const cleanupCreatedReportRecord = async (logContext) => {
    if (!createdReportRecord || !reportId) return { removed: false, skipped: true, error: null };
    try {
      const { error: cleanupError } = await supabaseAdmin.from("reports").delete().eq("id", reportId);
      if (cleanupError) {
        console.error(`Failed to cleanup report record after ${logContext}:`, cleanupError);
        return { removed: false, skipped: false, error: cleanupError };
      }
      return { removed: true, skipped: false, error: null };
    } catch (cleanupErr) {
      console.error(`Failed to cleanup report record after ${logContext}:`, cleanupErr);
      return { removed: false, skipped: false, error: cleanupErr };
    }
  };

  const existingCheck = await storageBucket.download(normalizedStoragePath);
  if (!existingCheck?.error && existingCheck?.data) {
    const existingRecovery = await runBoundedPdfCertificationRecovery({
      initialPdfBuffer: existingCheck.data,
      finalHtml,
      coreSafeHtml,
      emergencyCoreHtml,
      renderPdfBuffer,
      renderContext: {
        reportType,
        allowProductionPdf,
        docraptorMode: governedDocraptorMode,
        reportDownloadArtifactMode: artifactMode,
        docraptorGovernanceReceipt,
        job,
        reportSeed,
        propertyName,
        storagePath: normalizedStoragePath,
      },
      certifyPdf,
      sectionDispositionReceipts: baseSectionDispositionReceipts,
      corePublishable: resolvedCorePublishable,
    });
    if (existingRecovery.terminalError) {
      await cleanupCreatedReportRecord("existing PDF publication quality failure");
      if (resolvedCorePublishable === true) {
        return buildRecoverableArtifactResult({
          publicationRetryReason: "existing_pdf_recovery_failed",
          publicationQualityBoss: existingRecovery.publicationQualityBoss || null,
          institutionalPdfRecovery: existingRecovery.institutionalPdfRecovery || null,
          semanticRecomposition: existingRecovery.semanticRecomposition || null,
          artifactReplacementRequired: existingRecovery.artifactReplacementRequired === true,
          publicationRecoveryError: existingRecovery.terminalError,
        });
      }
      throw existingRecovery.terminalError;
    }
    if (existingRecovery.artifactReplacementRequired) {
      const { error: replacementUploadError } = await storageBucket.upload(normalizedStoragePath, existingRecovery.pdfBuffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      });
      if (replacementUploadError) {
        await cleanupCreatedReportRecord("existing PDF recovery upload failure");
        const error = new Error(`Failed to upload recovered report artifact: ${replacementUploadError.message}`);
        error.code = "PDF_ARTIFACT_FAILED";
        if (resolvedCorePublishable === true) {
          return buildRecoverableArtifactResult({
            publicationRetryReason: "existing_pdf_recovery_upload_failed",
            publicationQualityBoss: existingRecovery.publicationQualityBoss || null,
            institutionalPdfRecovery: existingRecovery.institutionalPdfRecovery || null,
            semanticRecomposition: existingRecovery.semanticRecomposition || null,
            artifactReplacementRequired: true,
            publicationRecoveryError: error,
          });
        }
        throw error;
      }
    }
    return {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      artifactSource: existingRecovery.artifactReplacementRequired ? "recovered_existing_download" : "existing_download",
      verifiedDownloadArtifact: true,
      createdDownloadArtifact: false,
      publicationState: "published",
      publicationRetryRequired: false,
      publicationRetryReason: null,
      publicationQualityBoss: existingRecovery.publicationQualityBoss,
      institutionalPdfRecovery: existingRecovery.institutionalPdfRecovery,
      semanticRecomposition: existingRecovery.semanticRecomposition,
      artifactReplacementRequired: existingRecovery.artifactReplacementRequired === true,
    };
  }

  if (!String(finalHtml || "").trim()) {
    const err = new Error("Missing final HTML before download artifact");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      reportType: String(reportType || "").trim() || null,
    };
    if (resolvedCorePublishable === true) {
      return buildRecoverableArtifactResult({
        publicationRetryReason: "missing_final_html",
        publicationRecoveryError: err,
      });
    }
    throw err;
  }

  const initialRenderContext = {
    reportType,
    allowProductionPdf,
    docraptorMode: governedDocraptorMode,
    reportDownloadArtifactMode: artifactMode,
    docraptorGovernanceReceipt,
    docraptorRequestTimeoutMs,
    job,
    reportSeed,
    propertyName,
    storagePath: normalizedStoragePath,
  };
  let initialPdfBuffer;
  let initialArtifactIsEmergency = false;
  let initialRenderError = null;
  let resolvedInitialEmergencyCoreHtml = "";
  const resolveInitialEmergencyCoreHtml = async () => {
    const providedHtml = String(emergencyCoreHtml || "").trim();
    if (providedHtml) return providedHtml;
    if (typeof buildEmergencyCoreHtml !== "function") return "";
    return String((await buildEmergencyCoreHtml()) || "").trim();
  };
  try {
    initialPdfBuffer = await renderPdfBuffer({
      ...initialRenderContext,
      finalHtml,
      renderAttempt: "initial",
    });
  } catch (error) {
    if (resolvedCorePublishable !== true) throw error;
    const emergencyHtml = await resolveInitialEmergencyCoreHtml();
    if (!emergencyHtml) {
      return buildRecoverableArtifactResult({
        publicationRetryReason: "initial_emergency_core_html_unavailable",
        publicationRecoveryError: error,
      });
    }
    resolvedInitialEmergencyCoreHtml = emergencyHtml;
    try {
      initialPdfBuffer = await renderPdfBuffer({
        ...initialRenderContext,
        finalHtml: emergencyHtml,
        renderAttempt: "emergency_core",
      });
    } catch (emergencyError) {
      emergencyError.context = {
        ...(emergencyError.context || {}),
        initial_render_error: error?.message || String(error),
        emergency_core_render_error: emergencyError?.message || String(emergencyError),
        provider_diagnostics_by_attempt: mergeDocRaptorProviderDiagnostics(
          error?.context?.provider_diagnostics,
          emergencyError?.context?.provider_diagnostics,
        ),
      };
      return buildRecoverableArtifactResult({
        publicationRetryReason: "initial_emergency_core_render_failed",
        publicationRecoveryError: emergencyError,
      });
    }
    initialArtifactIsEmergency = true;
    initialRenderError = error;
  }
  const boundedRecovery = await runBoundedPdfCertificationRecovery({
    initialPdfBuffer,
    finalHtml,
    coreSafeHtml,
    emergencyCoreHtml,
    buildEmergencyCoreHtml,
    initialArtifactIsEmergency,
    initialArtifactHtml: initialArtifactIsEmergency ? resolvedInitialEmergencyCoreHtml : "",
    initialRenderError,
    renderPdfBuffer,
    renderContext: initialRenderContext,
    certifyPdf,
    sectionDispositionReceipts: baseSectionDispositionReceipts,
    corePublishable: resolvedCorePublishable,
  });
  if (boundedRecovery.terminalError) {
    await cleanupCreatedReportRecord("PDF publication safety failure");
    throw boundedRecovery.terminalError;
  }
  const pdfBuffer = boundedRecovery.pdfBuffer;
  const publicationQualityBoss = boundedRecovery.publicationQualityBoss;
  const institutionalPdfRecovery = boundedRecovery.institutionalPdfRecovery;
  const semanticRecomposition = boundedRecovery.semanticRecomposition;

  const { error: uploadError } = await storageBucket.upload(normalizedStoragePath, pdfBuffer, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    const reportCleanup = await cleanupCreatedReportRecord("storage upload failure");
    const err = new Error(`Failed to upload report to storage: ${uploadError.message}`);
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      bucketName,
      createdReportRecord: Boolean(createdReportRecord),
      reportCleanup,
    };
    if (resolvedCorePublishable === true) {
      return buildRecoverableArtifactResult({
        publicationRetryReason: "storage_upload_failed",
        publicationQualityBoss,
        institutionalPdfRecovery,
        semanticRecomposition,
        artifactReplacementRequired: boundedRecovery.artifactReplacementRequired === true,
        publicationRecoveryError: err,
      });
    }
    throw err;
  }

  const verifyResult = await storageBucket.download(normalizedStoragePath);
  if (verifyResult?.error || !verifyResult?.data) {
    let storageCleanup = { removed: false, error: null };
    try {
      const { error: storageCleanupError } = await storageBucket.remove([normalizedStoragePath]);
      storageCleanup = { removed: !storageCleanupError, error: storageCleanupError || null };
      if (storageCleanupError) {
        console.error("Failed to cleanup fresh report object after storage verification failure:", storageCleanupError);
      }
    } catch (storageCleanupErr) {
      storageCleanup = { removed: false, error: storageCleanupErr };
      console.error("Failed to cleanup fresh report object after storage verification failure:", storageCleanupErr);
    }

    const reportCleanup = storageCleanup.removed
      ? await cleanupCreatedReportRecord("storage verification failure")
      : { removed: false, skipped: true, retainedToPreserveObjectReference: true, error: null };

    const err = new Error("Failed to verify report download artifact");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: reportId || null,
      storagePath: normalizedStoragePath,
      bucketName,
      createdReportRecord: Boolean(createdReportRecord),
      storageCleanup: { removed: storageCleanup.removed, error: storageCleanup.error?.message || null },
      reportCleanup: {
        removed: reportCleanup.removed === true,
        skipped: reportCleanup.skipped === true,
        retainedToPreserveObjectReference: reportCleanup.retainedToPreserveObjectReference === true,
        error: reportCleanup.error?.message || null,
      },
    };
    if (resolvedCorePublishable === true) {
      return buildRecoverableArtifactResult({
        publicationRetryReason: "storage_verification_failed",
        publicationQualityBoss,
        institutionalPdfRecovery,
        semanticRecomposition,
        artifactReplacementRequired: boundedRecovery.artifactReplacementRequired === true,
        publicationRecoveryError: err,
      });
    }
    throw err;
  }

  return {
    reportId: reportId || null,
    storagePath: normalizedStoragePath,
    artifactSource: "created_download",
    verifiedDownloadArtifact: true,
    createdDownloadArtifact: true,
    publicationState: "published",
    publicationRetryRequired: false,
    publicationRetryReason: null,
    publicationQualityBoss,
    institutionalPdfRecovery,
    semanticRecomposition,
    artifactReplacementRequired: boundedRecovery.artifactReplacementRequired === true,
  };
}

export async function resolveOrCreateReportPublicationRecord({
  supabaseAdmin,
  job = {},
  reportData = {},
  existingReportId = null,
  existingStoragePath = null,
  revision = null,
  allowCreate = true,
  deliveryGateStatus = null,
  holdDelivery = false,
} = {}) {
  if (deliveryGateStatus !== "deliverable" || holdDelivery === true) {
    const err = new Error("Report publication record blocked before resolution");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      deliveryGateStatus: deliveryGateStatus || null,
      holdDelivery: Boolean(holdDelivery),
    };
    throw err;
  }
  const effectiveUserId = String(job?.user_id ?? "").trim();
  const reportType = String(reportData?.report_type ?? job?.report_type ?? "").trim();
  const reportSeed = String(job?.id ?? reportData?.jobId ?? "").trim();
  const resolvedReportId = String(reportData?.reportId ?? existingReportId ?? "").trim() || null;
  const resolvedStoragePath = String(reportData?.storagePath ?? existingStoragePath ?? "").trim() || null;

  if (reportData?.reportId && !resolvedStoragePath) {
    const err = new Error("Generator response omitted authoritative storage path");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      reportId: resolvedReportId,
      reportType: reportType || null,
      responseContract: "published_report_requires_reportId_and_storagePath",
    };
    throw err;
  }

  if (resolvedReportId && resolvedStoragePath) {
    return {
      reportId: resolvedReportId,
      storagePath: resolvedStoragePath,
      publicationSource: reportData?.reportId ? "route_response" : existingReportId ? "existing_report" : "resolved_report",
      createdReportRecord: false,
    };
  }

  const derivedStoragePath =
    effectiveUserId && (resolvedReportId || reportSeed)
      ? buildReportStoragePath({
          effectiveUserId,
          reportSeed: resolvedReportId || reportSeed,
        })
      : "";

  if (resolvedReportId) {
    return {
      reportId: resolvedReportId,
      storagePath: derivedStoragePath || resolvedStoragePath || null,
      publicationSource: reportData?.reportId ? "route_response" : "resolved_report",
      createdReportRecord: false,
    };
  }

  if (!allowCreate) {
    return {
      reportId: null,
      storagePath: null,
      publicationSource: "creation_disabled",
      createdReportRecord: false,
    };
  }

  if (!effectiveUserId || !reportType || !reportSeed || !reportData?.final_html) {
    return {
      reportId: null,
      storagePath: null,
      publicationSource: "missing_publication_prereqs",
      createdReportRecord: false,
    };
  }

  if (!supabaseAdmin?.from) {
    throw new Error("Missing report publication database client");
  }

  const storagePath = buildReportStoragePath({ effectiveUserId, reportSeed });
  const propertyName = String(job?.property_name ?? "").trim() || "Property";
  const revisionValues = buildReportRevisionInsertValues({
    job,
    reportData,
    revision,
    existingReportId,
  });
  const selectedColumns = [
    "id",
    "storage_path",
    "revision_kind",
    "revision_family_key",
    "revision_root_report_id",
    "revision_parent_report_id",
    "revision_number",
    "revision_request_key",
    "revision_source_job_id",
    "is_current_revision",
    "revision_published_at",
  ].join(", ");

  if (revisionValues.revision_request_key) {
    const { data: existingRevisionRow, error: existingRevisionError } = await supabaseAdmin
      .from("reports")
      .select(selectedColumns)
      .eq("revision_request_key", revisionValues.revision_request_key)
      .maybeSingle();
    if (existingRevisionError) {
      throw existingRevisionError;
    }
    if (existingRevisionRow?.id) {
      return {
        reportId: existingRevisionRow.id,
        storagePath: existingRevisionRow.storage_path || storagePath || null,
        publicationSource: revisionValues.revision_kind === "original" ? "existing_report" : "existing_revision",
        createdReportRecord: false,
        revision: existingRevisionRow,
      };
    }
  }

  const { data: reportRow, error: reportCreateError } = await supabaseAdmin
    .from("reports")
    .insert([
      {
        user_id: effectiveUserId,
        property_name: propertyName,
        report_type: reportType,
        storage_path: storagePath,
        ...revisionValues,
      },
    ])
    .select(selectedColumns)
    .single();

  if (reportCreateError || !reportRow?.id) {
    const duplicateKeyHints = [
      "duplicate key value violates unique constraint",
      "23505",
    ];
    const isPotentialDuplicate = duplicateKeyHints.some((hint) =>
      String(reportCreateError?.message || "").toLowerCase().includes(String(hint).toLowerCase()) ||
      String(reportCreateError?.code || "").includes(hint)
    );
    if (isPotentialDuplicate && revisionValues.revision_request_key) {
      const { data: conflictingReportRow, error: conflictingLookupError } = await supabaseAdmin
        .from("reports")
        .select(selectedColumns)
        .eq("revision_request_key", revisionValues.revision_request_key)
        .maybeSingle();
      if (!conflictingLookupError && conflictingReportRow?.id) {
        return {
          reportId: conflictingReportRow.id,
          storagePath: conflictingReportRow.storage_path || storagePath || null,
          publicationSource: revisionValues.revision_kind === "original" ? "conflicting_report" : "conflicting_revision",
          createdReportRecord: false,
          revision: conflictingReportRow,
        };
      }
    }
    const err = new Error(`Failed to create report record: ${reportCreateError?.message || "unknown error"}`);
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      user_id: effectiveUserId || null,
      property_name: propertyName,
      report_type: reportType || null,
      storage_path: storagePath || null,
      report_seed: reportSeed || null,
      revision_kind: revisionValues.revision_kind || null,
      revision_request_key: revisionValues.revision_request_key || null,
      revision_number: revisionValues.revision_number || null,
    };
    throw err;
  }

  return {
    reportId: reportRow.id,
    storagePath: reportRow.storage_path || storagePath,
    publicationSource: revisionValues.revision_kind === "original" ? "created_report" : "created_revision",
    createdReportRecord: true,
    revision: reportRow,
  };
}

export function assertValidReportPublicationInsert({
  storagePath,
  reportType,
  deliveryGateStatus = null,
  holdDelivery = false,
  coreValidRequiredCoverage = false,
  context = {},
} = {}) {
  const normalizedStoragePath = typeof storagePath === "string" ? storagePath.trim() : "";
  const normalizedDeliveryGateStatus = deliveryGateStatus;
  if (
    holdDelivery ||
    normalizedDeliveryGateStatus !== "deliverable"
  ) {
    const err = new Error("Report publication blocked before storage insert");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      ...context,
      storagePath: normalizedStoragePath || null,
      deliveryGateStatus: normalizedDeliveryGateStatus || null,
      holdDelivery: Boolean(holdDelivery),
      coreValidRequiredCoverage: Boolean(coreValidRequiredCoverage),
    };
    throw err;
  }
  if (!isValidReportStoragePath(normalizedStoragePath)) {
    const err = new Error("Missing valid report storage path before report insert");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      ...context,
      storagePath: normalizedStoragePath || null,
      deliveryGateStatus: normalizedDeliveryGateStatus || null,
      holdDelivery: Boolean(holdDelivery),
    };
    throw err;
  }
  if (!String(reportType ?? "").trim()) {
    const err = new Error("Missing report type before report insert");
    err.code = "REPORT_GENERATION_FAILED";
    err.context = {
      ...context,
      storagePath: normalizedStoragePath,
      deliveryGateStatus: normalizedDeliveryGateStatus || null,
      holdDelivery: Boolean(holdDelivery),
    };
    throw err;
  }
  return normalizedStoragePath;
}
