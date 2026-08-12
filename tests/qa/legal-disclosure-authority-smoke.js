import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  INVESTORIQ_DISCLOSURE_KEY,
  INVESTORIQ_DISCLOSURE_LABEL,
  INVESTORIQ_DISCLOSURE_TEXT,
  INVESTORIQ_DISCLOSURE_TEXT_HASH,
  INVESTORIQ_DISCLOSURE_VERSION,
  buildInvestorIQDisclosureAcceptanceRecord,
  isCurrentInvestorIQDisclosureAcceptance,
} from '../../src/lib/investoriq-disclosure-authority.js';

const canonicalText =
  'InvestorIQ provides document-backed and framework-constrained analysis, uses no invented data, and discloses missing inputs as unavailable in the report. Monetary refunds are not available once report generation begins. If an InvestorIQ system failure prevents publication, the qualifying report credit is restored.';

assert.equal(INVESTORIQ_DISCLOSURE_KEY, 'analysis_disclosures');
assert.equal(INVESTORIQ_DISCLOSURE_VERSION, 'v2026-08-02');
assert.equal(INVESTORIQ_DISCLOSURE_TEXT, canonicalText);
assert.equal(INVESTORIQ_DISCLOSURE_LABEL, 'Disclosures v2026-08-02');
assert.match(INVESTORIQ_DISCLOSURE_TEXT, /Monetary refunds are not available once report generation begins\./);
assert.match(INVESTORIQ_DISCLOSURE_TEXT, /If an InvestorIQ system failure prevents publication, the qualifying report credit is restored\./);
assert.doesNotMatch(INVESTORIQ_DISCLOSURE_TEXT, /Refunds are not available once report generation begins\./);

assert.equal(INVESTORIQ_DISCLOSURE_TEXT_HASH, '7387d8b79ba2ee22147bcc22ce01c50bbc8fee1856a25c0c04baf4dc8f028340');

assert.equal(
  isCurrentInvestorIQDisclosureAcceptance({
    policyVersion: 'v2026-01-14',
    policyTextHash: INVESTORIQ_DISCLOSURE_TEXT_HASH,
  }),
  false,
);
assert.equal(
  isCurrentInvestorIQDisclosureAcceptance({
    policyVersion: 'v2026-08-02',
    policyTextHash: INVESTORIQ_DISCLOSURE_TEXT_HASH,
  }),
  true,
);

const acceptanceRecord = buildInvestorIQDisclosureAcceptanceRecord({
  userId: 'user-123',
  userEmail: 'customer@example.com',
  ip: '203.0.113.7',
  userAgent: 'Codex QA',
});
assert.deepEqual(acceptanceRecord, {
  user_id: 'user-123',
  user_email: 'customer@example.com',
  policy_key: 'analysis_disclosures',
  policy_version: 'v2026-08-02',
  policy_text_hash: '7387d8b79ba2ee22147bcc22ce01c50bbc8fee1856a25c0c04baf4dc8f028340',
  ip: '203.0.113.7',
  user_agent: 'Codex QA',
});

const dashboard = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
assert.match(dashboard, /INVESTORIQ_DISCLOSURE_TEXT/);
assert.match(dashboard, /INVESTORIQ_DISCLOSURE_LABEL/);
assert.match(dashboard, /fetchLegalAcceptance\(\)/);

const app = fs.readFileSync('src/App.jsx', 'utf8');
assert.match(app, /INVESTORIQ_DISCLOSURE_LABEL/);
assert.match(app, /Analysis Disclosures" effectiveLabel=\{INVESTORIQ_DISCLOSURE_LABEL\}/);
assert.match(app, /Once report generation begins, monetary refunds are not available\./);
assert.match(app, /If an InvestorIQ system failure prevents publication, the qualifying report credit is restored to the customer's account\./);

const legalRoute = fs.readFileSync('api/legal-acceptance.js', 'utf8');
assert.match(legalRoute, /INVESTORIQ_DISCLOSURE_VERSION/);
assert.match(legalRoute, /buildInvestorIQDisclosureAcceptanceRecord/);
assert.doesNotMatch(legalRoute, /v2026-01-14/);

console.log('legal-disclosure-authority-smoke: PASS');
