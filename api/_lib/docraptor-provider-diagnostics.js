export const DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH = 1000;

const SAFE_ATTEMPTS = new Set([
  "initial",
  "css_recovery",
  "semantic_recovery",
  "core_safe",
  "emergency_core",
]);

const SAFE_BODY_FIELDS = [
  "code",
  "error_code",
  "type",
  "message",
  "error",
  "detail",
  "title",
];

const REQUEST_ECHO_PATTERN = /(?:document_content|<!doctype|<\s*\/?\s*[a-z][^>]*>)/i;
const SECRET_PATTERN = /(authorization|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|password|secret)\s*[:=]\s*["']?[^,"'\s}]+/gi;

function truncate(value) {
  const text = String(value || "");
  if (text.length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH) return text;
  return `${text.slice(0, DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH - 3)}...`;
}

function sanitizeText(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (REQUEST_ECHO_PATTERN.test(text)) return "[REDACTED_REQUEST_ECHO]";
  return truncate(
    text
      .replace(/Basic\s+[A-Za-z0-9+/=]+/gi, "Basic [REDACTED]")
      .replace(SECRET_PATTERN, "$1=[REDACTED]")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function safeBodyObject(value, depth = 0) {
  if (depth > 2 || !value || typeof value !== "object" || Array.isArray(value)) return null;
  const output = {};
  for (const field of SAFE_BODY_FIELDS) {
    if (!(field in value)) continue;
    const fieldValue = value[field];
    if (fieldValue && typeof fieldValue === "object") {
      const nested = safeBodyObject(fieldValue, depth + 1);
      if (nested && Object.keys(nested).length > 0) output[field] = nested;
    } else {
      const sanitized = sanitizeText(fieldValue);
      if (sanitized) output[field] = sanitized;
    }
  }
  return Object.keys(output).length > 0 ? output : null;
}

function parseResponseDataObject(value) {
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) return value;
  const text = Buffer.isBuffer(value) ? value.toString("utf8") : String(value || "");
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function sanitizeDocRaptorResponseData(value) {
  if (Buffer.isBuffer(value)) {
    return sanitizeDocRaptorResponseData(value.toString("utf8"));
  }
  if (value && typeof value === "object") {
    const safe = safeBodyObject(value);
    if (!safe) return "[REDACTED_PROVIDER_BODY]";
    return JSON.stringify(safe).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH
      ? safe
      : { message: truncate(JSON.stringify(safe)) };
  }
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      const safe = safeBodyObject(parsed);
      if (!safe) return "[REDACTED_PROVIDER_BODY]";
      return JSON.stringify(safe).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH
        ? safe
        : { message: truncate(JSON.stringify(safe)) };
    }
  } catch {
    // Preserve bounded non-HTML provider text below.
  }
  return sanitizeText(text) || "[REDACTED_PROVIDER_BODY]";
}

function readHeader(headers, names) {
  if (!headers) return null;
  for (const name of names) {
    const direct = typeof headers.get === "function" ? headers.get(name) : headers[name];
    if (direct !== undefined && direct !== null && String(direct).trim()) return String(direct).trim();
    const matchingKey = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
    if (matchingKey && String(headers[matchingKey]).trim()) return String(headers[matchingKey]).trim();
  }
  return null;
}

export function buildDocRaptorProviderDiagnostic(error, { attempt = "initial" } = {}) {
  const response = error?.response;
  if (!response) return null;
  const normalizedAttempt = SAFE_ATTEMPTS.has(attempt) ? attempt : "initial";
  const diagnostic = {
    provider: "docraptor",
    status: Number.isFinite(Number(response.status)) ? Number(response.status) : null,
    attempt: normalizedAttempt,
    response_data: sanitizeDocRaptorResponseData(response.data),
  };
  const responseDataObject = parseResponseDataObject(response.data);
  const responseCode = responseDataObject
    ? responseDataObject.code || responseDataObject.error_code || responseDataObject.error?.code
    : null;
  const responseMessage = responseDataObject
    ? responseDataObject.message || responseDataObject.error?.message || responseDataObject.detail || responseDataObject.title
    : null;
  const code = sanitizeText(responseCode);
  const message = sanitizeText(responseMessage);
  const requestId = readHeader(response.headers, [
    "x-docraptor-request-id",
    "x-request-id",
    "request-id",
  ]);
  const contentType = readHeader(response.headers, ["content-type"]);
  if (code) diagnostic.code = code;
  if (message) diagnostic.message = message;
  if (requestId) diagnostic.request_id = truncate(requestId);
  if (contentType) diagnostic.content_type = truncate(contentType);
  return diagnostic;
}

export function attachDocRaptorProviderDiagnostic(error, options = {}) {
  const diagnostic = buildDocRaptorProviderDiagnostic(error, options);
  if (!diagnostic) return error;
  error.context = {
    ...(error.context || {}),
    provider_diagnostics: diagnostic,
  };
  return error;
}

export function mergeDocRaptorProviderDiagnostics(...diagnostics) {
  return diagnostics.reduce((byAttempt, diagnostic) => {
    if (diagnostic?.attempt) byAttempt[diagnostic.attempt] = diagnostic;
    return byAttempt;
  }, {});
}
