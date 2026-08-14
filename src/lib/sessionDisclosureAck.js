import {
  INVESTORIQ_DISCLOSURE_TEXT_HASH,
  INVESTORIQ_DISCLOSURE_VERSION,
} from '@/lib/investoriq-disclosure-authority';

const SESSION_DISCLOSURE_ACK_KEY = 'investoriq_disclosure_session_ack_v1';

export function readSessionDisclosureAck() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_DISCLOSURE_ACK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const acknowledgedAt = String(parsed.acknowledgedAt || '').trim();
    const userId = String(parsed.userId || '').trim();
    const disclosureVersion = String(parsed.disclosureVersion || '').trim();
    const disclosureTextHash = String(parsed.disclosureTextHash || '').trim();
    if (!acknowledgedAt || !userId) return null;
    if (disclosureVersion !== INVESTORIQ_DISCLOSURE_VERSION) return null;
    if (disclosureTextHash !== INVESTORIQ_DISCLOSURE_TEXT_HASH) return null;
    return {
      userId,
      disclosureVersion,
      disclosureTextHash,
      acknowledgedAt,
    };
  } catch (err) {
    return null;
  }
}

export function writeSessionDisclosureAck({ userId, acknowledgedAt }) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      SESSION_DISCLOSURE_ACK_KEY,
      JSON.stringify({
        userId,
        disclosureVersion: INVESTORIQ_DISCLOSURE_VERSION,
        disclosureTextHash: INVESTORIQ_DISCLOSURE_TEXT_HASH,
        acknowledgedAt,
      })
    );
    return true;
  } catch (err) {}
  return false;
}

export function clearSessionDisclosureAck() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SESSION_DISCLOSURE_ACK_KEY);
  } catch (err) {}
}
