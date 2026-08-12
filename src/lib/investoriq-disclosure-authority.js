export const INVESTORIQ_DISCLOSURE_KEY = 'analysis_disclosures';
export const INVESTORIQ_DISCLOSURE_VERSION = 'v2026-08-02';
export const INVESTORIQ_DISCLOSURE_TEXT =
  'InvestorIQ provides document-backed and framework-constrained analysis, uses no invented data, and discloses missing inputs as unavailable in the report. Monetary refunds are not available once report generation begins. If an InvestorIQ system failure prevents publication, the qualifying report credit is restored.';
export const INVESTORIQ_DISCLOSURE_TEXT_HASH =
  '7387d8b79ba2ee22147bcc22ce01c50bbc8fee1856a25c0c04baf4dc8f028340';

export const INVESTORIQ_DISCLOSURE_LABEL = `Disclosures ${INVESTORIQ_DISCLOSURE_VERSION}`;

function normalize(value) {
  return String(value || '').trim();
}

export function isCurrentInvestorIQDisclosureAcceptance({
  policyVersion = null,
  policyTextHash = null,
} = {}) {
  return (
    normalize(policyVersion) === INVESTORIQ_DISCLOSURE_VERSION &&
    normalize(policyTextHash) === INVESTORIQ_DISCLOSURE_TEXT_HASH
  );
}

export function buildInvestorIQDisclosureAcceptanceRecord({
  userId = null,
  userEmail = null,
  ip = null,
  userAgent = null,
} = {}) {
  return {
    user_id: userId,
    user_email: userEmail,
    policy_key: INVESTORIQ_DISCLOSURE_KEY,
    policy_version: INVESTORIQ_DISCLOSURE_VERSION,
    policy_text_hash: INVESTORIQ_DISCLOSURE_TEXT_HASH,
    ip,
    user_agent: userAgent,
  };
}
