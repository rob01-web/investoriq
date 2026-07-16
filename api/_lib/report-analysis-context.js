const CONTEXT_SOURCE = 'canonical_report_analysis_context';
const CONTEXT_VERSION = 1;

function text(value) {
  return String(value ?? '').trim();
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function isValidIsoDate(value) {
  const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isCanonicalReportAnalysisContext(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.source === CONTEXT_SOURCE &&
    value.contextVersion === CONTEXT_VERSION &&
    isValidIsoDate(value.asOfDate)
  );
}

export function buildCanonicalReportAnalysisContext({ jobId = null, asOfDate } = {}) {
  if (!isValidIsoDate(asOfDate)) {
    throw new Error('VALID_CANONICAL_REPORT_AS_OF_DATE_REQUIRED');
  }

  return deepFreeze({
    source: CONTEXT_SOURCE,
    contextVersion: CONTEXT_VERSION,
    jobId: text(jobId) || null,
    asOfDate: text(asOfDate),
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      systemClockFallbackAllowed: false,
      deterministicDateOnly: true,
      customerFacingCopyProduced: false,
      rendererBehaviorChanged: false,
    },
  });
}
