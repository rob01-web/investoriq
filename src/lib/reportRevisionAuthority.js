const REPORT_REVISION_KIND_ORDER = new Map([
  ["original", 0],
  ["corrected", 1],
  ["replacement", 2],
]);

function normalizeRevisionText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeReportRevisionKind(value, fallback = "original") {
  const normalized = normalizeRevisionText(value);
  if (REPORT_REVISION_KIND_ORDER.has(normalized)) {
    return normalized;
  }
  const normalizedFallback = normalizeRevisionText(fallback);
  return REPORT_REVISION_KIND_ORDER.has(normalizedFallback) ? normalizedFallback : "original";
}

export function normalizeReportRevisionNumber(value, fallback = 1) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 1) {
    return parsed;
  }
  const fallbackParsed = Number(fallback);
  return Number.isInteger(fallbackParsed) && fallbackParsed >= 1 ? fallbackParsed : 1;
}

export function buildReportRevisionRequestKey({
  revisionKind = "original",
  revisionFamilyKey = null,
  revisionNumber = null,
  revisionParentReportId = null,
  revisionSourceJobId = null,
} = {}) {
  const kind = normalizeReportRevisionKind(revisionKind);
  const familyKey = String(revisionFamilyKey ?? "").trim();
  const sourceJobId = String(revisionSourceJobId ?? "").trim();
  const parentReportId = String(revisionParentReportId ?? "").trim() || "root";
  const number = Number(revisionNumber);
  const normalizedNumber = Number.isInteger(number) && number >= 1 ? number : null;
  const rootKey = familyKey || sourceJobId;

  if (kind === "original") {
    return rootKey ? `original:${rootKey}` : "";
  }
  if (!rootKey || !normalizedNumber) {
    return "";
  }
  return `${kind}:${rootKey}:${normalizedNumber}:${parentReportId}:${sourceJobId || "unknown"}`;
}

export function deriveReportRevisionFamilyKey(row = {}) {
  return String(row?.revision_family_key ?? row?.revision_root_report_id ?? row?.id ?? "").trim() || null;
}

export function isCurrentPublishedReportRevision(row = {}) {
  return String(row?.status ?? "") === "published" && row?.is_current_revision === true;
}

function compareRevisionRows(left, right) {
  const leftCurrent = isCurrentPublishedReportRevision(left) ? 1 : 0;
  const rightCurrent = isCurrentPublishedReportRevision(right) ? 1 : 0;
  if (leftCurrent !== rightCurrent) return rightCurrent - leftCurrent;

  const leftPublished = String(left?.status ?? "") === "published" ? 1 : 0;
  const rightPublished = String(right?.status ?? "") === "published" ? 1 : 0;
  if (leftPublished !== rightPublished) return rightPublished - leftPublished;

  const leftRevision = normalizeReportRevisionNumber(left?.revision_number, 0);
  const rightRevision = normalizeReportRevisionNumber(right?.revision_number, 0);
  if (leftRevision !== rightRevision) return rightRevision - leftRevision;

  const leftPublishedAt = Date.parse(left?.revision_published_at || left?.created_at || 0) || 0;
  const rightPublishedAt = Date.parse(right?.revision_published_at || right?.created_at || 0) || 0;
  if (leftPublishedAt !== rightPublishedAt) return rightPublishedAt - leftPublishedAt;

  return String(right?.id ?? "").localeCompare(String(left?.id ?? ""));
}

export function sortReportRevisions(rows = []) {
  return Array.isArray(rows) ? [...rows].filter(Boolean).sort(compareRevisionRows) : [];
}

export function selectCurrentPublishedReportRevision(rows = []) {
  const revisions = sortReportRevisions(rows);
  return revisions.find(isCurrentPublishedReportRevision) || revisions.find((row) => String(row?.status ?? "") === "published") || null;
}

export function getReportRevisionDisplayState(row = {}, currentRevision = null) {
  const revisionKind = normalizeReportRevisionKind(row?.revision_kind, "original");
  const revisionNumber = normalizeReportRevisionNumber(row?.revision_number, 1);
  const isPublished = String(row?.status ?? "") === "published";
  const isCurrent = Boolean(row?.is_current_revision) && isPublished;
  const matchesCurrentRevision = currentRevision ? String(row?.id ?? "") === String(currentRevision?.id ?? "") : isCurrent;
  const isHistoricalPublished = isPublished && !matchesCurrentRevision;
  const isVisibleRevision = isPublished || Boolean(row?.storage_path);

  let label = "Revision";
  if (matchesCurrentRevision) {
    label = "Current published revision";
  } else if (isHistoricalPublished) {
    label = "Historical published revision";
  } else if (!isPublished) {
    label = "Unpublished revision";
  }

  return {
    revisionKind,
    revisionNumber,
    isPublished,
    isCurrent: matchesCurrentRevision,
    isHistoricalPublished,
    isVisibleRevision,
    label,
    badge: `${revisionKind} v${revisionNumber}`,
    downloadLabel: matchesCurrentRevision ? "Download current" : isHistoricalPublished ? "Review historical" : "Review revision",
  };
}
