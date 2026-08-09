import assert from "node:assert/strict";
import fs from "node:fs";
import {
  attachDocRaptorProviderDiagnostic,
  buildDocRaptorProviderDiagnostic,
  DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH,
  DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_AGGREGATE_LENGTH,
  DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_ATTEMPTS,
  mergeDocRaptorProviderDiagnostics,
} from "../../api/_lib/docraptor-provider-diagnostics.js";
import { resolveDocRaptorModeGovernanceReceipt } from "../../api/_lib/docraptor-mode-governance.js";
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

const xmlError = new Error("Request failed with status code 422");
xmlError.response = {
  status: 422,
  data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
    <errors>
      <error>
        <type>validation_error</type>
        <code>invalid_document_option</code>
        <message>Production rendering is not available for this request.</message>
        <validation>
          <field>test</field>
          <name>test</name>
        </validation>
        <request-id>dr-request-xml</request-id>
        <correlation-id>dr-correlation-xml</correlation-id>
        <document_content><![CDATA[<html><body>${richHtml}</body></html>]]></document_content>
        <authorization>${authHeader}</authorization>
        <api_key>${apiKey}</api_key>
        <arbitrary>must not survive</arbitrary>
      </error>
    </errors>`),
  headers: { "content-type": "application/xml; charset=utf-8" },
};
const xmlDiagnostic = buildDocRaptorProviderDiagnostic(xmlError, { attempt: "initial" });
assert.equal(xmlDiagnostic.code, "invalid_document_option");
assert.equal(xmlDiagnostic.message, "Production rendering is not available for this request.");
assert.equal(xmlDiagnostic.type, "validation_error");
assert.equal(xmlDiagnostic.field, "test");
assert.equal(xmlDiagnostic.name, "test");
assert.equal(xmlDiagnostic.request_id, "dr-request-xml");
assert.equal(xmlDiagnostic.correlation_id, "dr-correlation-xml");
assert.equal(xmlDiagnostic.content_type, "application/xml; charset=utf-8");
assert.equal(xmlDiagnostic.response_data.arbitrary, undefined);
assert.equal(xmlDiagnostic.response_data.document_content, undefined);
assert.equal(JSON.stringify(xmlDiagnostic).includes(apiKey), false);
assert.equal(JSON.stringify(xmlDiagnostic).includes(authHeader), false);
assert.equal(JSON.stringify(xmlDiagnostic).includes(richHtml), false);
assert.equal(JSON.stringify(xmlDiagnostic).includes("<html>"), false);

const simpleXmlError = new Error("Request failed with status code 422");
simpleXmlError.response = {
  status: 422,
  data: "<?xml version=\"1.0\"?><errors><error>Document generation failed.</error></errors>",
  headers: {},
};
const simpleXmlDiagnostic = buildDocRaptorProviderDiagnostic(simpleXmlError);
assert.equal(simpleXmlDiagnostic.message, "Document generation failed.");
assert.deepEqual(simpleXmlDiagnostic.response_data, { error: "Document generation failed." });

const xmlOnlyEchoError = new Error("Request failed with status code 422");
xmlOnlyEchoError.response = {
  status: 422,
  data: "<request><document_content>&lt;html&gt;customer report&lt;/html&gt;</document_content></request>",
  headers: {},
};
assert.equal(
  buildDocRaptorProviderDiagnostic(xmlOnlyEchoError).response_data,
  "[REDACTED_REQUEST_ECHO]",
);

const xmlHtmlMessageError = new Error("Request failed with status code 422");
xmlHtmlMessageError.response = {
  status: 422,
  data: "<errors><message><![CDATA[<html><body>echoed report</body></html>]]></message></errors>",
  headers: {},
};
assert.equal(
  buildDocRaptorProviderDiagnostic(xmlHtmlMessageError).response_data,
  "[REDACTED_REQUEST_ECHO]",
);

const xmlSecretError = new Error("Request failed with status code 422");
xmlSecretError.response = {
  status: 422,
  data: `<errors><message>Validation failed; api_key=${apiKey}</message></errors>`,
  headers: {},
};
const xmlSecretDiagnostic = buildDocRaptorProviderDiagnostic(xmlSecretError);
assert.equal(JSON.stringify(xmlSecretDiagnostic).includes(apiKey), false);
assert.match(xmlSecretDiagnostic.message, /api_key=\[REDACTED\]/);

const malformedXmlError = new Error("Request failed with status code 422");
malformedXmlError.response = {
  status: 422,
  data: "<errors><error>Unsafe partial error</errors>",
  headers: {},
};
assert.equal(
  buildDocRaptorProviderDiagnostic(malformedXmlError).response_data,
  "[REDACTED_REQUEST_ECHO]",
);

const oversizedXmlError = new Error("Request failed with status code 422");
oversizedXmlError.response = {
  status: 422,
  data: `<errors><message>${"x".repeat(5000)}</message></errors>`,
  headers: {
    "x-docraptor-request-id": `dr-${"r".repeat(500)}`,
    "content-type": "application/xml; charset=utf-8",
  },
};
const oversizedXmlDiagnostic = buildDocRaptorProviderDiagnostic(oversizedXmlError);
assert.ok(
  JSON.stringify(oversizedXmlDiagnostic).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH,
);
assert.equal(oversizedXmlDiagnostic.request_id.endsWith("..."), true);

const networkError = new Error("socket hang up");
networkError.code = "ECONNRESET";
networkError.request = {
  method: "POST",
  headers: {
    Authorization: authHeader,
  },
  data: richHtml,
};
networkError.config = {
  headers: {
    Authorization: authHeader,
  },
  data: richHtml,
};
const networkDiagnostic = buildDocRaptorProviderDiagnostic(networkError, { attempt: "initial" });
assert.equal(networkDiagnostic.provider, "docraptor");
assert.equal(networkDiagnostic.status, null);
assert.equal(networkDiagnostic.error_class, "network_failure");
assert.equal(networkDiagnostic.retryable, true);
assert.equal(networkDiagnostic.has_response, false);
assert.equal(networkDiagnostic.has_request, true);
assert.equal(networkDiagnostic.response, undefined);
assert.equal(networkDiagnostic.request, undefined);
assert.equal(networkDiagnostic.config, undefined);
assert.equal(JSON.stringify(networkDiagnostic).includes(authHeader), false);
assert.equal(JSON.stringify(networkDiagnostic).includes(richHtml), false);
assert.ok(JSON.stringify(networkDiagnostic).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH);

const timeoutError = new Error("timeout of 15ms exceeded");
timeoutError.code = "ERR_CANCELED";
timeoutError.request = {
  method: "POST",
  headers: {
    Authorization: authHeader,
  },
  data: richHtml,
};
timeoutError.config = {
  headers: {
    Authorization: authHeader,
  },
  data: richHtml,
};
const timeoutDiagnostic = buildDocRaptorProviderDiagnostic(timeoutError, {
  attempt: "initial",
  timeoutMs: 15,
});
assert.equal(timeoutDiagnostic.provider, "docraptor");
assert.equal(timeoutDiagnostic.status, null);
assert.equal(timeoutDiagnostic.error_class, "timeout");
assert.equal(timeoutDiagnostic.retryable, true);
assert.equal(timeoutDiagnostic.has_response, false);
assert.equal(timeoutDiagnostic.has_request, true);
assert.equal(timeoutDiagnostic.timeout_ms, 15);
assert.equal(JSON.stringify(timeoutDiagnostic).includes(apiKey), false);
assert.equal(JSON.stringify(timeoutDiagnostic).includes(authHeader), false);
assert.equal(JSON.stringify(timeoutDiagnostic).includes(richHtml), false);
assert.ok(JSON.stringify(timeoutDiagnostic).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH);

const allFieldsOversizedXmlError = new Error("Request failed with status code 422");
allFieldsOversizedXmlError.response = {
  status: 422,
  data: `<errors>
    <code>${"c".repeat(500)}</code>
    <type>${"t".repeat(500)}</type>
    <message>${"m".repeat(500)}</message>
    <field>${"f".repeat(500)}</field>
    <name>${"n".repeat(500)}</name>
    <request-id>${"r".repeat(500)}</request-id>
    <correlation-id>${"i".repeat(500)}</correlation-id>
  </errors>`,
  headers: { "content-type": `application/xml; ${"x".repeat(500)}` },
};
assert.ok(
  JSON.stringify(buildDocRaptorProviderDiagnostic(allFieldsOversizedXmlError)).length <=
    DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH,
);

const longError = new Error("Request failed with status code 422");
longError.response = { status: 422, data: "x".repeat(1400), headers: {} };
const longDiagnostic = buildDocRaptorProviderDiagnostic(longError, { attempt: "core_safe" });
assert.ok(longDiagnostic.response_data.length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH);
assert.equal(longDiagnostic.response_data.endsWith("..."), true);

const semanticRecoveryError = new Error("Request failed with status code 422");
semanticRecoveryError.response = {
  status: 422,
  data: { error_code: "semantic_recovery_rejected", message: "Semantic recovery was rejected." },
  headers: { "x-docraptor-request-id": "dr-request-semantic" },
};
const semanticRecoveryDiagnostic = buildDocRaptorProviderDiagnostic(semanticRecoveryError, {
  attempt: "semantic_recovery",
});

const aggregateDiagnostics = mergeDocRaptorProviderDiagnostics(
  jsonDiagnostic,
  textDiagnostic,
  echoedHtmlDiagnostic,
  xmlDiagnostic,
  networkDiagnostic,
  longDiagnostic,
  semanticRecoveryDiagnostic,
);
assert.equal(Object.keys(aggregateDiagnostics).length, DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_ATTEMPTS);
assert.equal(aggregateDiagnostics.initial.request_id, "dr-request-123");
assert.equal(aggregateDiagnostics.emergency_core.request_id, "dr-request-text");
assert.equal(aggregateDiagnostics.css_recovery.response_data, "[REDACTED_REQUEST_ECHO]");
assert.equal(aggregateDiagnostics.semantic_recovery.request_id, "dr-request-semantic");
assert.ok(JSON.stringify(aggregateDiagnostics).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_AGGREGATE_LENGTH);

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

const governedReceipt = resolveDocRaptorModeGovernanceReceipt({
  reportDownloadArtifactMode: "production_pdf",
  allowProductionPdf: true,
  docraptorMode: "production",
  hasDocRaptorApiKey: true,
  productionOwnerAuthorized: false,
});
const governedReceiptJson = JSON.stringify(governedReceipt);
assert.equal(governedReceipt.resolved_docraptor_mode, "test");
assert.equal(governedReceipt.production_requested_but_not_authorized, true);
assert.equal(
  ["Authorization", "document_content", apiKey, authHeader, richHtml].some((needle) => governedReceiptJson.includes(needle)),
  false
);

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
assert.match(generatorSource, /requestDocRaptorPdf/);
assert.match(deliverySource, /requestDocRaptorPdf/);
assert.equal((generatorSource.match(/https:\/\/api\.docraptor\.com\/docs/g) || []).length, 0);
assert.equal((deliverySource.match(/https:\/\/api\.docraptor\.com\/docs/g) || []).length, 0);
assert.doesNotMatch(generatorSource, /["']https:\/\/docraptor\.com\/docs["']/);
assert.doesNotMatch(deliverySource, /["']https:\/\/docraptor\.com\/docs["']/);
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
