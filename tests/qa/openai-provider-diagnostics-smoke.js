import assert from "node:assert/strict";
import { classifyOpenAiError } from "../../lib/openai-error-classifier.js";

const quota = classifyOpenAiError(
  429,
  JSON.stringify({
    error: {
      type: "insufficient_quota",
      code: "insufficient_quota",
      message: "You exceeded your current quota. sk-test-secret-key-123",
    },
  }),
  null,
  { "x-request-id": "req_123" }
);
assert.equal(quota.provider_error_class, "insufficient_quota");
assert.equal(quota.provider_request_id, "req_123");
assert.equal(quota.provider_error_message.includes("sk-"), false);

const rateLimit = classifyOpenAiError(
  429,
  JSON.stringify({ error: { type: "rate_limit_error", code: "rate_limit_exceeded", message: "Rate limit reached" } }),
  null
);
assert.equal(rateLimit.provider_error_class, "rate_limit_exceeded");

const access = classifyOpenAiError(
  403,
  JSON.stringify({ error: { code: "model_not_found", message: "You do not have access to this model" } }),
  null
);
assert.equal(access.provider_error_class, "model_access_denied");

const malformed = classifyOpenAiError(
  400,
  JSON.stringify({ error: { type: "invalid_request_error", message: "Bad schema" } }),
  null
);
assert.equal(malformed.provider_error_class, "malformed_request");

const outage = classifyOpenAiError(500, "internal server error", null);
assert.equal(outage.provider_error_class, "provider_outage");

const timeout = classifyOpenAiError(null, null, "AbortError");
assert.equal(timeout.provider_error_class, "timeout");

const network = classifyOpenAiError(null, null, "TypeError");
assert.equal(network.provider_error_class, "network_error");

console.log("openai provider diagnostics smoke PASS");
