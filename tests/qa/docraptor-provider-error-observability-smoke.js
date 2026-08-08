import assert from "node:assert/strict";
import fs from "node:fs";
import {
  attachDocRaptorProviderDiagnostic,
  buildDocRaptorProviderDiagnostic,
  DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH,
  mergeDocRaptorProviderDiagnostics,
} from "../../api/_lib/docraptor-provider-diagnostics.js";
import {
  buildUnavailableReportQualityManifestCandidate,
  finalizeBlockedReportQualityManifest,
} from "../../api/_lib/report-quality-manifest.js";

const apiKey = "docraptor-secret-api-key";
const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
const richHtml = "<html><body>customer source content</body></html>";

const jsonError = new Error("Request failed with status code 422");
jsonError.code = "PDF_ARTIFACT_FAILED";
jsonError.response = {
  status: 422,
  data: Buffer.from(JSON.stringify({
    error: {
      code: "invalid_document",
      message: "The document could not be rendered.",
      document_content: richHtml,
      api_key: apiKey,
    },
  })),
  headers: {
    "x-docraptor-request-id": "dr-request-123",
    "content-type": "application/json",
  },
};
jsonError.config = {
  headers: {
    Authorization: authHeader,
  },
  data: JSON.stringify({ document_content: richHtml }),
};
attachDocRaptorProviderDiagnostic(jsonError, { attempt: "initial" });

const jsonDiagnostic = jsonError.context.provider_diagnostics;
assert.equal(jsonDiagnostic.provider, "docraptor");
assert.equal(jsonDiagnostic.status, 422);
assert.equal(jsonDiagnostic.attempt, "initial");
assert.equal(jsonDiagnostic.code, "invalid_document");
assert.equal(jsonDiagnostic.request_id, "dr-request-123");
assert.equal(jsonDiagnostic.content_type, "application/json");
assert.equal(JSON.stringify(jsonDiagnostic).includes(apiKey), false);
assert.equal(JSON.stringify(jsonDiagnostic).includes(authHeader), false);
assert.equal(JSON.stringify(jsonDiagnostic).includes(richHtml), false);

const textError = new Error("Request failed with status code 422");
textError.response = {
  status: 422,
  data: "DocRaptor rejected the requested document format.",
  headers: { "x-request-id": "dr-request-text" },
};
const textDiagnostic = buildDocRaptorProviderDiagnostic(textError, { attempt: "emergency_core" });
assert.equal(textDiagnostic.response_data, "DocRaptor rejected the requested document format.");
assert.equal(textDiagnostic.request_id, "dr-request-text");
assert.equal(textDiagnostic.attempt, "emergency_core");

const echoedHtmlError = new Error("Request failed with status code 422");
echoedHtmlError.response = { status: 422, data: "<div>echoed customer report HTML</div>", headers: {} };
const echoedHtmlDiagnostic = buildDocRaptorProviderDiagnostic(echoedHtmlError, { attempt: "css_recovery" });
assert.equal(echoedHtmlDiagnostic.response_data, "[REDACTED_REQUEST_ECHO]");

const longError = new Error("Request failed with status code 422");
longError.response = { status: 422, data: "x".repeat(1400), headers: {} };
const longDiagnostic = buildDocRaptorProviderDiagnostic(longError, { attempt: "core_safe" });
assert.ok(longDiagnostic.response_data.length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH);
assert.equal(longDiagnostic.response_data.endsWith("..."), true);

const emergencyError = new Error("Request failed with status code 422");
emergencyError.response = {
  status: 422,
  data: { error_code: "emergency_invalid_document", message: "Emergency document rejected." },
  headers: { "x-docraptor-request-id": "dr-request-emergency" },
};
attachDocRaptorProviderDiagnostic(emergencyError, { attempt: "emergency_core" });
const diagnosticsByAttempt = mergeDocRaptorProviderDiagnostics(
  jsonDiagnostic,
  emergencyError.context.provider_diagnostics,
);
assert.equal(diagnosticsByAttempt.initial.request_id, "dr-request-123");
assert.equal(diagnosticsByAttempt.emergency_core.request_id, "dr-request-emergency");
assert.notDeepEqual(diagnosticsByAttempt.initial, diagnosticsByAttempt.emergency_core);

const candidate = buildUnavailableReportQualityManifestCandidate({
  jobId: "job-observability-test",
  userId: "user-observability-test",
  reportFamily: "acquisition_memo",
  reportType: "underwriting",
  reportMode: "v1_core",
  propertyName: "Observability Fixture",
  blockerCode: "PDF_ARTIFACT_FAILED",
});
const finalManifest = finalizeBlockedReportQualityManifest({
  candidate,
  terminalOutcome: {
    code: "PDF_ARTIFACT_FAILED",
    failureClass: "internal_system_failure",
    message: "PDF artifact failed",
  },
  providerDiagnostics: {
    current: emergencyError.context.provider_diagnostics,
    byAttempt: diagnosticsByAttempt,
  },
});
assert.deepEqual(finalManifest.receipts.providerDiagnostics.byAttempt, diagnosticsByAttempt);

const generatorSource = fs.readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const deliverySource = fs.readFileSync("api/_lib/report-delivery-output.js", "utf8");
const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");
assert.match(generatorSource, /attachDocRaptorProviderDiagnostic/);
assert.match(generatorSource, /pdfResponse = await renderDocRaptorPdf\(emergencyHtml, "emergency_core"\);/);
assert.match(generatorSource, /if \(finalPdfCorePublishable !== true\) throw error;/);
assert.match(deliverySource, /render\(fallbackHtml, "core_safe"\)/);
assert.match(deliverySource, /render\(emergencyHtml, "emergency_core"\)/);
assert.match(workerSource, /provider_diagnostics_by_attempt/);
assert.match(workerSource, /providerDiagnostics: generatorFailurePayload/);

const unchangedTerminalError = new Error("Request failed with status code 422");
unchangedTerminalError.code = "PDF_ARTIFACT_FAILED";
attachDocRaptorProviderDiagnostic(unchangedTerminalError, { attempt: "initial" });
assert.equal(unchangedTerminalError.code, "PDF_ARTIFACT_FAILED");

console.log("DocRaptor provider error observability smoke PASS");
