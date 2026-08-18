export const REPORT_IDENTITY_AUTHORITY_VERSION = "canonical_report_identity_v2";

function freezeIdentity(identity) {
  return Object.freeze({
    ...identity,
    acceptedReportTypes: Object.freeze([...identity.acceptedReportTypes]),
    acceptedVisibleTitles: Object.freeze([...identity.acceptedVisibleTitles]),
    requiredPdfTextAnchors: Object.freeze([...identity.requiredPdfTextAnchors]),
    prohibitedVisibleTitles: Object.freeze([...identity.prohibitedVisibleTitles]),
  });
}

export const SCREENING_REPORT_IDENTITY = freezeIdentity({
  identityKey: "screening",
  reportFamily: "screening",
  reportMode: "screening_v1",
  reportType: "screening",
  reportTier: 1,
  canonicalTitle: "Preliminary Investment Screening Memorandum",
  fullTitle: "InvestorIQ Preliminary Investment Screening Memorandum",
  acceptedReportTypes: ["screening", "screening_report"],
  acceptedVisibleTitles: [
    "Preliminary Investment Screening Memorandum",
    "Screening Signal",
    "Preliminary Screening",
    "Screening Report",
  ],
  requiredPdfTextAnchors: ["Preliminary Investment Screening Memorandum"],
  prohibitedVisibleTitles: ["Underwriting Report", "Acquisition Memo", "Acquisition Memorandum"],
});

export const UNDERWRITING_REPORT_IDENTITY = freezeIdentity({
  // `underwriting` remains the commerce/API compatibility value. The constitutional
  // product and revision family are explicitly Full Underwriting.
  identityKey: "full_underwriting",
  reportFamily: "full_underwriting",
  reportMode: "v1_core",
  reportType: "underwriting",
  reportTier: 2,
  canonicalTitle: "Underwriting Report",
  fullTitle: "InvestorIQ Underwriting Report",
  acceptedReportTypes: ["underwriting", "full_underwriting", "underwriting_report"],
  acceptedVisibleTitles: ["Underwriting Report"],
  requiredPdfTextAnchors: ["Underwriting Report"],
  prohibitedVisibleTitles: [
    "Preliminary Investment Screening Memorandum",
    "Screening Signal",
    "Acquisition Memo",
    "Acquisition Memorandum",
  ],
});

export const REPORT_IDENTITY_AUTHORITY = Object.freeze({
  source: "canonical_report_identity_authority",
  version: REPORT_IDENTITY_AUTHORITY_VERSION,
  screening: SCREENING_REPORT_IDENTITY,
  full_underwriting: UNDERWRITING_REPORT_IDENTITY,
  underwriting: UNDERWRITING_REPORT_IDENTITY,
});

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function resolveCanonicalReportIdentity(input = {}) {
  const { reportMode = null, reportType = null } =
    input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const mode = normalize(reportMode);
  const type = normalize(reportType);
  if (mode === SCREENING_REPORT_IDENTITY.reportMode) return SCREENING_REPORT_IDENTITY;
  if (mode === UNDERWRITING_REPORT_IDENTITY.reportMode) return UNDERWRITING_REPORT_IDENTITY;
  if (SCREENING_REPORT_IDENTITY.acceptedReportTypes.includes(type)) return SCREENING_REPORT_IDENTITY;
  if (UNDERWRITING_REPORT_IDENTITY.acceptedReportTypes.includes(type)) return UNDERWRITING_REPORT_IDENTITY;
  return null;
}

export function buildCanonicalReportIdentityReceipt(input = {}) {
  const identity = resolveCanonicalReportIdentity(input);
  if (!identity) return null;
  return Object.freeze({
    source: REPORT_IDENTITY_AUTHORITY.source,
    version: REPORT_IDENTITY_AUTHORITY.version,
    identityKey: identity.identityKey,
    reportFamily: identity.reportFamily,
    reportMode: identity.reportMode,
    reportType: identity.reportType,
    reportTier: identity.reportTier,
    canonicalTitle: identity.canonicalTitle,
    fullTitle: identity.fullTitle,
    requiredPdfTextAnchors: Object.freeze([...identity.requiredPdfTextAnchors]),
  });
}

export function isCanonicalReportIdentityReceipt(receipt = null) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return false;
  const canonical = buildCanonicalReportIdentityReceipt({
    reportMode: receipt.reportMode,
    reportType: receipt.reportType,
  });
  if (!canonical) return false;
  return (
    receipt.source === canonical.source &&
    receipt.version === canonical.version &&
    receipt.identityKey === canonical.identityKey &&
    receipt.reportFamily === canonical.reportFamily &&
    receipt.reportMode === canonical.reportMode &&
    receipt.reportType === canonical.reportType &&
    Number(receipt.reportTier) === canonical.reportTier &&
    receipt.canonicalTitle === canonical.canonicalTitle &&
    receipt.fullTitle === canonical.fullTitle &&
    JSON.stringify(receipt.requiredPdfTextAnchors || []) === JSON.stringify(canonical.requiredPdfTextAnchors)
  );
}
