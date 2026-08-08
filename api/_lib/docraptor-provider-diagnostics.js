export const DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH = 1000;
export const DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_FIELD_LENGTH = 256;
export const DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_ATTEMPTS = 5;
export const DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_AGGREGATE_LENGTH = 4096;

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
  "field",
  "name",
  "request_id",
  "correlation_id",
  "validation",
];

const REQUEST_ECHO_PATTERN = /(?:document_content|<!doctype|<\s*\/?\s*[a-z][^>]*>)/i;
const SECRET_PATTERN = /(authorization|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|password|secret)\s*[:=]\s*["']?[^,"'\s}]+/gi;
const SAFE_XML_FIELD_NAMES = new Map([
  ["code", "code"],
  ["error-code", "error_code"],
  ["error_code", "error_code"],
  ["type", "type"],
  ["message", "message"],
  ["error", "error"],
  ["detail", "detail"],
  ["title", "title"],
  ["field", "field"],
  ["name", "name"],
  ["request-id", "request_id"],
  ["request_id", "request_id"],
  ["requestid", "request_id"],
  ["correlation-id", "correlation_id"],
  ["correlation_id", "correlation_id"],
  ["correlationid", "correlation_id"],
]);
const MAX_XML_INPUT_LENGTH = 64 * 1024;

function truncate(value, maxLength = DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH) {
  const text = String(value || "");
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return text.slice(0, Math.max(0, maxLength));
  return `${text.slice(0, maxLength - 3)}...`;
}

function boundedText(value, maxLength = DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_FIELD_LENGTH) {
  const text = String(value || "").trim();
  if (!text) return null;
  return truncate(text, maxLength);
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

function decodeXmlScalar(value) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (match, encoded) => {
      const codePoint = Number.parseInt(encoded, 16);
      return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : match;
    })
    .replace(/&#([0-9]+);/g, (match, encoded) => {
      const codePoint = Number.parseInt(encoded, 10);
      return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : match;
    })
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function safeXmlFieldName(name) {
  const localName = String(name || "").split(":").pop().toLowerCase();
  return SAFE_XML_FIELD_NAMES.get(localName) || null;
}

function parseSafeXmlMetadata(value) {
  const text = String(value || "").trim();
  if (!text || text.length > MAX_XML_INPUT_LENGTH || !text.startsWith("<")) return null;
  if (/<!\s*(?:doctype|entity)\b/i.test(text)) return null;

  const output = {};
  const stack = [];
  let rootCount = 0;
  let cursor = 0;

  const appendText = (rawText) => {
    if (!rawText) return true;
    if (stack.length === 0) return !rawText.trim();
    const node = stack[stack.length - 1];
    node.text = truncate(`${node.text}${rawText}`, 4096);
    return true;
  };

  while (cursor < text.length) {
    const openingIndex = text.indexOf("<", cursor);
    if (openingIndex < 0) {
      if (!appendText(text.slice(cursor))) return null;
      cursor = text.length;
      break;
    }
    if (!appendText(text.slice(cursor, openingIndex))) return null;

    if (text.startsWith("<!--", openingIndex)) {
      const closingIndex = text.indexOf("-->", openingIndex + 4);
      if (closingIndex < 0) return null;
      cursor = closingIndex + 3;
      continue;
    }
    if (text.startsWith("<![CDATA[", openingIndex)) {
      const closingIndex = text.indexOf("]]>", openingIndex + 9);
      if (closingIndex < 0 || stack.length === 0) return null;
      if (!appendText(text.slice(openingIndex + 9, closingIndex))) return null;
      cursor = closingIndex + 3;
      continue;
    }
    if (text.startsWith("<?", openingIndex)) {
      const closingIndex = text.indexOf("?>", openingIndex + 2);
      if (closingIndex < 0 || stack.length > 0 || rootCount > 0) return null;
      cursor = closingIndex + 2;
      continue;
    }

    const closingIndex = text.indexOf(">", openingIndex + 1);
    if (closingIndex < 0) return null;
    const tag = text.slice(openingIndex + 1, closingIndex).trim();
    if (!tag || tag.startsWith("!")) return null;

    if (tag.startsWith("/")) {
      const match = tag.match(/^\/\s*([A-Za-z_][\w:.-]*)\s*$/);
      if (!match || stack.length === 0) return null;
      const node = stack.pop();
      if (node.name !== match[1].toLowerCase()) return null;
      if (node.childCount === 0) {
        const field = safeXmlFieldName(node.name);
        const sanitized = field ? sanitizeText(decodeXmlScalar(node.text)) : null;
        if (sanitized && sanitized !== "[REDACTED_REQUEST_ECHO]" && !(field in output)) {
          output[field] = sanitized;
        }
      }
      cursor = closingIndex + 1;
      continue;
    }

    const selfClosing = tag.endsWith("/");
    const openingTag = selfClosing ? tag.slice(0, -1).trim() : tag;
    const match = openingTag.match(/^([A-Za-z_][\w:.-]*)(?:\s+[\s\S]*)?$/);
    if (!match) return null;
    if (stack.length === 0) {
      rootCount += 1;
      if (rootCount > 1) return null;
    } else {
      stack[stack.length - 1].childCount += 1;
    }
    if (!selfClosing) {
      stack.push({ name: match[1].toLowerCase(), text: "", childCount: 0 });
    }
    cursor = closingIndex + 1;
  }

  if (stack.length > 0 || rootCount !== 1) return null;
  return Object.keys(output).length > 0 ? output : null;
}

function parseResponseDataObject(value) {
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) return value;
  const text = Buffer.isBuffer(value) ? value.toString("utf8") : String(value || "");
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return parseSafeXmlMetadata(text);
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
    const safeXml = parseSafeXmlMetadata(text);
    if (safeXml) return safeXml;
    // Preserve bounded non-HTML provider text below.
  }
  return sanitizeText(text) || "[REDACTED_PROVIDER_BODY]";
}

function boundProviderDiagnostic(diagnostic) {
  if (JSON.stringify(diagnostic).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH) {
    return diagnostic;
  }

  const bounded = { ...diagnostic };
  const responseData = bounded.response_data;
  delete bounded.response_data;
  if (responseData !== undefined && responseData !== null) {
    const source = typeof responseData === "string" ? responseData : JSON.stringify(responseData);
    let low = 0;
    let high = source.length;
    let best = null;
    while (low <= high) {
      const midpoint = Math.floor((low + high) / 2);
      const candidateValue = truncate(source, midpoint);
      const candidate = { ...bounded, response_data: candidateValue };
      if (JSON.stringify(candidate).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH) {
        best = candidateValue;
        low = midpoint + 1;
      } else {
        high = midpoint - 1;
      }
    }
    if (best) bounded.response_data = best;
  }
  for (const field of [
    "content_type",
    "name",
    "field",
    "type",
    "correlation_id",
    "message",
    "request_id",
    "code",
  ]) {
    if (JSON.stringify(bounded).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH) break;
    if (!(field in bounded)) continue;
    const source = typeof bounded[field] === "string" ? bounded[field] : JSON.stringify(bounded[field]);
    delete bounded[field];
    let low = 0;
    let high = source.length;
    let best = null;
    while (low <= high) {
      const midpoint = Math.floor((low + high) / 2);
      const candidateValue = truncate(source, midpoint);
      const candidate = { ...bounded, [field]: candidateValue };
      if (JSON.stringify(candidate).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_BODY_LENGTH) {
        best = candidateValue;
        low = midpoint + 1;
      } else {
        high = midpoint - 1;
      }
    }
    if (best) bounded[field] = best;
  }
  return bounded;
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

function isRetryableDocRaptorFailure(error = null, status = null) {
  if (Number.isFinite(Number(status)) && (Number(status) >= 500 || Number(status) === 429)) {
    return true;
  }
  const normalizedCode = String(error?.code || "").trim().toUpperCase();
  return new Set([
    "ECONNRESET",
    "ECONNABORTED",
    "ETIMEDOUT",
    "EAI_AGAIN",
    "ENOTFOUND",
    "ESOCKETTIMEDOUT",
  ]).has(normalizedCode);
}

function buildDocRaptorNetworkDiagnostic(error, attempt) {
  return boundProviderDiagnostic({
    provider: "docraptor",
    status: null,
    attempt,
    error_class: "network_failure",
    code: boundedText(error?.code, 64),
    message: boundedText(
      error?.message ||
        "DocRaptor request failed without an HTTP response.",
      400
    ),
    retryable: isRetryableDocRaptorFailure(error, null),
    has_response: false,
    has_request: Boolean(error?.request),
  });
}

export function buildDocRaptorProviderDiagnostic(error, { attempt = "initial" } = {}) {
  const response = error?.response;
  const normalizedAttempt = SAFE_ATTEMPTS.has(attempt) ? attempt : "initial";
  if (!response) {
    return buildDocRaptorNetworkDiagnostic(error, normalizedAttempt);
  }
  const diagnostic = {
    provider: "docraptor",
    status: Number.isFinite(Number(response.status)) ? Number(response.status) : null,
    attempt: normalizedAttempt,
    response_data: sanitizeDocRaptorResponseData(response.data),
    error_class: "http_error",
    retryable: isRetryableDocRaptorFailure(error, response.status),
  };
  const responseDataObject = parseResponseDataObject(response.data);
  const responseCode = responseDataObject
    ? responseDataObject.code || responseDataObject.error_code || responseDataObject.error?.code
    : null;
  const responseMessage = responseDataObject
    ? responseDataObject.message ||
      (typeof responseDataObject.error === "string"
        ? responseDataObject.error
        : responseDataObject.error?.message) ||
      responseDataObject.detail ||
      responseDataObject.title
    : null;
  const responseType = responseDataObject
    ? responseDataObject.type || responseDataObject.error?.type
    : null;
  const responseField = responseDataObject
    ? responseDataObject.field || responseDataObject.validation?.field || responseDataObject.error?.field
    : null;
  const responseName = responseDataObject
    ? responseDataObject.name || responseDataObject.validation?.name || responseDataObject.error?.name
    : null;
  const responseRequestId = responseDataObject
    ? responseDataObject.request_id || responseDataObject.error?.request_id
    : null;
  const responseCorrelationId = responseDataObject
    ? responseDataObject.correlation_id || responseDataObject.error?.correlation_id
    : null;
  const code = sanitizeText(responseCode);
  const message = sanitizeText(responseMessage);
  const type = sanitizeText(responseType);
  const field = sanitizeText(responseField);
  const name = sanitizeText(responseName);
  const requestId = readHeader(response.headers, [
    "x-docraptor-request-id",
    "x-request-id",
    "request-id",
  ]) || sanitizeText(responseRequestId);
  const correlationId = sanitizeText(responseCorrelationId);
  const contentType = readHeader(response.headers, ["content-type"]);
  if (code) diagnostic.code = boundedText(code, 128);
  if (message) diagnostic.message = boundedText(message, 400);
  if (type) diagnostic.type = boundedText(type, 128);
  if (field) diagnostic.field = boundedText(field, 128);
  if (name) diagnostic.name = boundedText(name, 128);
  if (requestId) diagnostic.request_id = boundedText(requestId, 128);
  if (correlationId) diagnostic.correlation_id = boundedText(correlationId, 128);
  if (contentType) diagnostic.content_type = boundedText(contentType, 128);
  return boundProviderDiagnostic(diagnostic);
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
    if (!diagnostic?.attempt) return byAttempt;
    if (Object.keys(byAttempt).length >= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_ATTEMPTS) return byAttempt;
    if (byAttempt[diagnostic.attempt]) return byAttempt;
    const candidate = { ...byAttempt, [diagnostic.attempt]: diagnostic };
    if (JSON.stringify(candidate).length <= DOCRAPTOR_PROVIDER_DIAGNOSTIC_MAX_AGGREGATE_LENGTH) {
      return candidate;
    }
    return byAttempt;
  }, {});
}
