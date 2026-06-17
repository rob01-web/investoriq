export function isNil(value) {
  return value === undefined || value === null;
}
export function formatCurrency(value, options = {}) {
  const { decimals = 0, prefix = "$", suffix = "" } = options;
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value);
  return (
    prefix +
    num.toLocaleString("en-CA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix
  );
}
export function formatPercent(value, decimals = 1) {
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value) * 100;
  return (
    num.toLocaleString("en-CA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + "%"
  );
}
export function formatPercent1(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = n > 1.5 ? n : n * 100;
  return `${pct.toFixed(1)}%`;
}
export function formatPercentExactDisplay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `${n.toFixed(1)}%`;
}
export function formatCapPercentExact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = n > 1.5 ? n : n * 100;
  return `${pct.toFixed(2)}%`;
}
export function formatInterestRatePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = n > 1.5 ? n : n * 100;
  return `${pct.toFixed(2)}%`;
}
export function formatMultiple(value, decimals = 2) {
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value);
  return (
    num.toLocaleString("en-CA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + "x"
  );
}
export function formatYears(value, decimals = 1) {
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value);
  return (
    num.toLocaleString("en-CA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + " yrs"
  );
}
export function formatDistanceKm(value) {
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value);
  return (
    num.toLocaleString("en-CA", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + " km"
  );
}
export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
export function replaceAll(str, token, value) {
  if (!str || !token) return str;
  return str.includes(token) ? str.split(token).join(value ?? "") : str;
}
export function sanitizeDisplayText(s) {
  if (!s) return s;
  return String(s)
    .replace(/\bUnderwritting\b/gi, "Underwriting")
    .replace(/\s+([,.])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}
export function sanitizePropertyNameDisplayText(s) {
  if (!s) return s;
  return sanitizeDisplayText(s)
    .replace(/\s*[-|:]\s*$/g, "")
    .replace(/^\s*[-|:]\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
