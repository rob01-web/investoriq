const MAX_SAFE_MESSAGE_CHARS = 500;
const MAX_SAFE_BODY_CHARS = 1000;

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const redactSecrets = (input) => {
  const text = String(input || "");
  if (!text) return "";
  return text
    .replace(/sk-[A-Za-z0-9_-]{10,}/g, "[REDACTED_API_KEY]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/"api[_-]?key"\s*:\s*"[^"]+"/gi, '"api_key":"[REDACTED]"')
    .replace(/"authorization"\s*:\s*"[^"]+"/gi, '"authorization":"[REDACTED]"');
};

const truncateSafe = (value, maxChars) => {
  const normalized = normalizeText(redactSecrets(value));
  if (!normalized) return null;
  return normalized.length > maxChars ? normalized.slice(0, maxChars) : normalized;
};

const tryParseBody = (body) => {
  if (body && typeof body === "object") return body;
  const text = String(body || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_err) {
    return null;
  }
};

const extractBodyFields = (body) => {
  const parsed = tryParseBody(body);
  const errorNode = parsed?.error && typeof parsed.error === "object" ? parsed.error : null;
  const providerErrorCode = errorNode?.code || parsed?.code || null;
  const providerErrorType = errorNode?.type || parsed?.type || null;
  const providerErrorMessage = errorNode?.message || parsed?.message || (typeof body === "string" ? body : null);
  return {
    provider_error_code: providerErrorCode ? String(providerErrorCode) : null,
    provider_error_type: providerErrorType ? String(providerErrorType) : null,
    provider_error_message: truncateSafe(providerErrorMessage, MAX_SAFE_MESSAGE_CHARS),
    provider_error_body: truncateSafe(typeof body === "string" ? body : JSON.stringify(parsed || body || {}), MAX_SAFE_BODY_CHARS),
  };
};

const headerValue = (headers, key) => {
  if (!headers) return null;
  if (typeof headers.get === "function") {
    return headers.get(key) || headers.get(key.toLowerCase()) || null;
  }
  const direct = headers[key] || headers[key.toLowerCase()];
  if (Array.isArray(direct)) return direct[0] || null;
  return direct || null;
};

const classifyFromStatusAndBody = ({ status, providerErrorCode, providerErrorType, providerErrorMessage }) => {
  const code = String(providerErrorCode || "").toLowerCase();
  const type = String(providerErrorType || "").toLowerCase();
  const message = String(providerErrorMessage || "").toLowerCase();

  if (code.includes("insufficient_quota") || message.includes("insufficient_quota")) return "insufficient_quota";
  if (code.includes("billing") || message.includes("billing hard limit") || message.includes("hard limit")) return "billing_limit";
  if (code.includes("rate_limit") || type.includes("rate_limit") || message.includes("rate limit")) return "rate_limit_exceeded";
  if (
    status === 401 ||
    status === 403 ||
    code.includes("model_not_found") ||
    code.includes("access_denied") ||
    type.includes("invalid_api_key") ||
    message.includes("does not have access") ||
    message.includes("not permitted")
  ) {
    return "model_access_denied";
  }
  if (status === 404 || code.includes("model_unavailable") || message.includes("model unavailable")) {
    return "model_unavailable";
  }
  if (status === 400 || code.includes("invalid_request") || type.includes("invalid_request_error")) {
    return "malformed_request";
  }
  if (status >= 500 && status <= 599) return "provider_outage";
  if (status && status >= 400) return "unknown_non_ok";
  return "unknown_exception";
};

export function classifyOpenAiError(status, body, errName, headers) {
  const provider_response_status = Number.isFinite(status) ? status : null;
  const provider_request_id = truncateSafe(
    headerValue(headers, "x-request-id") || headerValue(headers, "request-id"),
    120
  );
  const base = extractBodyFields(body);
  const errLabel = String(errName || "").toLowerCase();

  let provider_error_class = classifyFromStatusAndBody({
    status: provider_response_status,
    providerErrorCode: base.provider_error_code,
    providerErrorType: base.provider_error_type,
    providerErrorMessage: base.provider_error_message,
  });

  if (!provider_response_status) {
    if (errLabel === "aborterror") provider_error_class = "timeout";
    else if (errLabel.includes("timeout")) provider_error_class = "timeout";
    else if (errLabel.includes("typeerror") || errLabel.includes("fetcherror")) provider_error_class = "network_error";
    else provider_error_class = "unknown_exception";
  }

  return {
    provider_error_class,
    provider_error_code: base.provider_error_code,
    provider_error_type: base.provider_error_type,
    provider_error_message: base.provider_error_message,
    provider_response_status,
    provider_request_id,
    provider_error_body: base.provider_error_body,
  };
}

export const __test__ = {
  redactSecrets,
  truncateSafe,
  extractBodyFields,
};
