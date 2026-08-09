import assert from "node:assert/strict";
import axios from "axios";
import { requestDocRaptorPdf } from "../../api/_lib/docraptor-request.js";
import { renderReportPdfBuffer } from "../../api/_lib/report-delivery-output.js";
import { resolveDocRaptorModeGovernanceReceipt } from "../../api/_lib/docraptor-mode-governance.js";

const envSnapshot = {
  REPORT_DOWNLOAD_ARTIFACT_MODE: process.env.REPORT_DOWNLOAD_ARTIFACT_MODE,
  ALLOW_PRODUCTION_PDF: process.env.ALLOW_PRODUCTION_PDF,
  DOCRAPTOR_MODE: process.env.DOCRAPTOR_MODE,
  DOCRAPTOR_API_KEY: process.env.DOCRAPTOR_API_KEY,
  DOCRAPTOR_PRODUCTION_OWNER_AUTHORIZED: process.env.DOCRAPTOR_PRODUCTION_OWNER_AUTHORIZED,
};

const restoreEnv = () => {
  for (const [key, value] of Object.entries(envSnapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

const richHtml = "<html><body>timed report body</body></html>";
const apiKey = "unit-test-key";
const expectedAuthHeader = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;

function makeHangingPost(expectedTimeoutMs, expectedBodyTest) {
  return async (url, body, options) => {
    assert.equal(url, "https://api.docraptor.com/docs");
    assert.equal(body.test, expectedBodyTest);
    assert.equal(body.document_type, "pdf");
    assert.equal(body.name, "InvestorIQ-ClientReport.pdf");
    assert.equal(typeof body.document_content, "string");
    assert.equal(options.timeout, expectedTimeoutMs);
    assert.equal(String(options.headers.Authorization || ""), expectedAuthHeader);
    return await new Promise((resolve, reject) => {
      options.signal.addEventListener(
        "abort",
        () => {
          const err = new Error(`timeout of ${expectedTimeoutMs}ms exceeded`);
          err.name = "AbortError";
          err.code = "ERR_CANCELED";
          err.request = {
            method: "POST",
            headers: {
              Authorization: expectedAuthHeader,
            },
            data: body.document_content,
          };
          reject(err);
        },
        { once: true }
      );
    });
  };
}

function makeSuccessPost(expectedTimeoutMs, expectedBodyTest) {
  return async (url, body, options) => {
    assert.equal(url, "https://api.docraptor.com/docs");
    assert.equal(body.test, expectedBodyTest);
    assert.equal(options.timeout, expectedTimeoutMs);
    assert.equal(String(options.headers.Authorization || ""), expectedAuthHeader);
    return { data: Buffer.from("%PDF-1.4\n%timeout-smoke\n%%EOF\n", "utf8") };
  };
}

const originalAxiosPost = axios.post;

try {
  process.env.REPORT_DOWNLOAD_ARTIFACT_MODE = "production_pdf";
  process.env.ALLOW_PRODUCTION_PDF = "true";
  process.env.DOCRAPTOR_MODE = "production";
  process.env.DOCRAPTOR_API_KEY = apiKey;
  delete process.env.DOCRAPTOR_PRODUCTION_OWNER_AUTHORIZED;

  const governedReceipt = resolveDocRaptorModeGovernanceReceipt();
  assert.equal(governedReceipt.production_requested, true);
  assert.equal(governedReceipt.production_requested_but_not_authorized, true);
  assert.equal(governedReceipt.resolved_docraptor_mode, "test");

  const timeoutMs = 15;
  const helperTimeoutPost = makeHangingPost(timeoutMs, true);
  await assert.rejects(
    requestDocRaptorPdf({
      documentContent: richHtml,
      apiKey,
      docraptorMode: "test",
      attempt: "initial",
      timeoutMs,
      post: helperTimeoutPost,
    }),
    (error) => {
      const diagnostic = error?.context?.provider_diagnostics;
      assert.equal(diagnostic.provider, "docraptor");
      assert.equal(diagnostic.error_class, "timeout");
      assert.equal(diagnostic.retryable, true);
      assert.equal(diagnostic.has_response, false);
      assert.equal(diagnostic.timeout_ms, timeoutMs);
      assert.equal(JSON.stringify(diagnostic).includes(apiKey), false);
      assert.equal(JSON.stringify(diagnostic).includes(expectedAuthHeader), false);
      assert.equal(JSON.stringify(diagnostic).includes(richHtml), false);
      return true;
    }
  );

  const successResponse = await requestDocRaptorPdf({
    documentContent: richHtml,
    apiKey,
    docraptorMode: "test",
    attempt: "css_recovery",
    timeoutMs,
    post: makeSuccessPost(timeoutMs, true),
  });
  assert.equal(Buffer.isBuffer(successResponse.data), true);
  assert.match(successResponse.data.toString("utf8"), /%PDF-1\.4/);

  axios.post = makeHangingPost(timeoutMs, true);
  for (const renderAttempt of ["initial", "emergency_core"]) {
    await assert.rejects(
      renderReportPdfBuffer({
        finalHtml: richHtml,
        reportType: "screening",
        renderAttempt,
        docraptorRequestTimeoutMs: timeoutMs,
      }),
      (error) => {
        const diagnostic = error?.context?.provider_diagnostics;
        assert.equal(diagnostic.provider, "docraptor");
        assert.equal(diagnostic.error_class, "timeout");
        assert.equal(diagnostic.retryable, true);
        assert.equal(diagnostic.timeout_ms, timeoutMs);
        assert.equal(JSON.stringify(diagnostic).includes(apiKey), false);
        assert.equal(JSON.stringify(diagnostic).includes(expectedAuthHeader), false);
        assert.equal(JSON.stringify(diagnostic).includes(richHtml), false);
        return true;
      }
    );
  }
  assert.equal(resolveDocRaptorModeGovernanceReceipt().resolved_docraptor_mode, "test");
} finally {
  axios.post = originalAxiosPost;
  restoreEnv();
}

console.log("DocRaptor request timeout smoke PASS");
