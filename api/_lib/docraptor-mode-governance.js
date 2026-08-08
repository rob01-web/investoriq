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

function isTruthyString(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

export function resolveDocRaptorModeGovernanceReceipt({
  reportDownloadArtifactMode = process.env.REPORT_DOWNLOAD_ARTIFACT_MODE || "",
  allowProductionPdf = process.env.ALLOW_PRODUCTION_PDF === "true",
  docraptorMode = process.env.DOCRAPTOR_MODE === "production" ? "production" : "test",
  hasDocRaptorApiKey = Boolean(String(process.env.DOCRAPTOR_API_KEY || "").trim()),
  productionOwnerAuthorized = isTruthyString(process.env.DOCRAPTOR_PRODUCTION_OWNER_AUTHORIZED),
} = {}) {
  const normalizedReportDownloadArtifactMode = normalizeReportDownloadArtifactMode(reportDownloadArtifactMode);
  const productionArtifactRequested = normalizedReportDownloadArtifactMode === "production_pdf";
  const docRaptorTestRequested = normalizedReportDownloadArtifactMode === "docraptor_test_pdf";
  const stubRequested = normalizedReportDownloadArtifactMode === "stub_pdf";
  const productionProviderRequested = docraptorMode === "production";
  const productionConfigured = Boolean(allowProductionPdf);
  const productionOwnerAuthorizedBool = Boolean(productionOwnerAuthorized);
  const productionProviderAllowed =
    productionProviderRequested &&
    productionConfigured &&
    productionOwnerAuthorizedBool &&
    Boolean(hasDocRaptorApiKey);

  let resolvedReportDownloadArtifactMode = "stub_pdf";
  if (stubRequested) {
    resolvedReportDownloadArtifactMode = "stub_pdf";
  } else if (docRaptorTestRequested) {
    if (!hasDocRaptorApiKey) {
      const err = new Error("DOCRAPTOR_API_KEY_REQUIRED");
      err.code = "DOCRAPTOR_API_KEY_REQUIRED";
      err.context = {
        report_download_artifact_mode: normalizedReportDownloadArtifactMode,
        has_docraptor_api_key: Boolean(hasDocRaptorApiKey),
      };
      throw err;
    }
    resolvedReportDownloadArtifactMode = "docraptor_test_pdf";
  } else if (productionArtifactRequested) {
    resolvedReportDownloadArtifactMode = productionProviderAllowed
      ? "production_pdf"
      : hasDocRaptorApiKey
        ? "docraptor_test_pdf"
        : "stub_pdf";
  } else if (productionProviderRequested) {
    resolvedReportDownloadArtifactMode = hasDocRaptorApiKey ? "docraptor_test_pdf" : "stub_pdf";
  }

  return {
    requested_docraptor_mode: productionProviderRequested ? "production" : "test",
    requested_report_download_artifact_mode: normalizedReportDownloadArtifactMode || "",
    allow_production_pdf: productionConfigured,
    has_docraptor_api_key: Boolean(hasDocRaptorApiKey),
    production_owner_authorized: productionOwnerAuthorizedBool,
    production_requested: productionProviderRequested || productionArtifactRequested,
    production_configuration_present: productionConfigured,
    production_requested_but_not_authorized:
      (productionProviderRequested || productionArtifactRequested) && !productionProviderAllowed,
    production_provider_allowed: productionProviderAllowed,
    resolved_docraptor_mode: productionProviderAllowed ? "production" : "test",
    resolved_report_download_artifact_mode: resolvedReportDownloadArtifactMode,
  };
}
