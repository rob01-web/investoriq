import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildAuthRoute,
  resolveAuthReturnPath,
  sanitizeAuthReturnPath,
} from '../../src/lib/authReturnPath.js';

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(qaDir, '../..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

// Purchase intent survives authentication, but external/open-redirect targets never do.
assert.equal(sanitizeAuthReturnPath('/pricing'), '/pricing');
assert.equal(resolveAuthReturnPath('?next=%2Fpricing'), '/pricing');
assert.equal(buildAuthRoute('/login', '/pricing'), '/login?next=%2Fpricing');
assert.equal(buildAuthRoute('/signup', '/pricing'), '/signup?next=%2Fpricing');
for (const unsafe of [
  'https://example.com',
  '//example.com',
  '/\\example.com',
  'javascript:alert(1)',
]) {
  assert.equal(sanitizeAuthReturnPath(unsafe), '/dashboard');
}

const pricing = read('src/pages/Pricing.jsx');
const dashboard = read('src/pages/Dashboard.jsx');
const login = read('src/pages/Login.jsx');
const signup = read('src/pages/SignUp.jsx');
const failureMessaging = read('src/lib/jobFailureMessaging.js');
const uploadGate = read('src/lib/reportUploadGate.js');
const customerBoundary = read('src/lib/customerBoundarySupabase.js');
const strictMigration = read('supabase/migrations/20260908233000_strict_customer_admission_doctrine.sql');
const indexHtml = read('index.html');

// Customer intake doctrine is strict and separate from downstream survivor modes.
assert.match(pricing, /Requires both a Rent Roll and T12; no additional documents accepted/i);
assert.match(pricing, /Requires both a Rent Roll and T12 plus at least one supporting document/i);
assert.match(pricing, /Screening requires both a Rent Roll and T12\. Underwriting requires both core documents plus at least one supporting due diligence document\./i);
assert.match(pricing, /Both Rent Roll and T12 required/i);
assert.match(pricing, /At least one supporting document required/i);
assert.equal(/Start with a Rent Roll or T12/i.test(pricing), false);
assert.equal(/Provide both when available/i.test(pricing), false);
assert.equal(/supporting diligence when available/i.test(pricing), false);

assert.match(dashboard, /Requires T12 \+ Rent Roll\. No additional documents\./);
assert.match(dashboard, /Requires T12 \+ Rent Roll \+ at least 1 supporting document\./);
assert.match(dashboard, /Screening accepts only the Rent Roll and T12/i);
assert.match(dashboard, /add at least one supporting due diligence document/i);
assert.match(dashboard, /Upload both a Rent Roll and a T12 to unlock supporting documents/i);
assert.match(dashboard, /At least one supporting document is required for Underwriting/i);
assert.equal(/upload at least one core document/i.test(dashboard), false);
assert.equal(/Supporting documents are optional/i.test(dashboard), false);

assert.match(uploadGate, /const hasRequiredCoreDocs = hasRentRoll && hasT12/);
assert.match(uploadGate, /SCREENING_SUPPORTING_DOCUMENTS_NOT_ALLOWED/);
assert.match(uploadGate, /MISSING_REQUIRED_SUPPORTING_DOCUMENT/);
assert.match(customerBoundary, /MISSING_REQUIRED_SUPPORTING_DOCUMENT/);
assert.match(customerBoundary, /SCREENING_SUPPORTING_DOCUMENTS_NOT_ALLOWED/);
assert.match(strictMigration, /not v_has_t12 or not v_has_rent_roll/i);
assert.match(strictMigration, /p_report_type\s*=\s*'screening'\s+and\s+v_has_supporting_docs/i);
assert.match(strictMigration, /p_report_type\s*=\s*'underwriting'\s+and\s+not\s+v_has_supporting_docs/i);

// Bundle copy must sell the customer outcome instead of leaking commerce implementation details.
assert.match(pricing, /Screening \+ Underwriting/);
assert.match(pricing, /Two Screening Reports plus one Underwriting Report at a lower combined price/i);
assert.match(pricing, /Save \$\$\{Math\.round\(savings \/ 100\)/);
for (const forbidden of [
  'Frozen Launch Bundle',
  'one authenticated owner',
  'fixed server-side',
  'framework-constrained outputs',
  'Investment Committee Underwriting',
  'Full underwriting memorandum',
]) {
  assert.equal(pricing.includes(forbidden), false, `pricing leaked stale/system-facing copy: ${forbidden}`);
}

// All desktop cards use the same semantic geometry instead of tier-specific offsets.
assert.match(pricing, /\.pricing-note\s*\{[\s\S]*min-height:\s*32px/);
assert.match(pricing, /\.pricing-card-header\s*\{/);
assert.match(pricing, /\.pricing-card-price\s*\{/);
assert.match(pricing, /\.pricing-card-description\s*\{/);
assert.match(pricing, /@media \(max-width: 760px\)/);

// Pricing and adjacent account surfaces must present both launch report products.
assert.match(pricing, /Document-driven real estate analysis for investment decisions\./);
assert.match(pricing, /required document package is incomplete or cannot be verified/i);
assert.equal(/no usable core source can be verified/i.test(pricing), false);
assert.match(dashboard, /Upload property documents to generate a Screening or Underwriting Report\./);
assert.match(dashboard, /Three-report bundle selected/);
assert.match(login, /generate Screening and Underwriting Reports/);
assert.match(signup, /generate Screening and Underwriting Reports/);

// Pricing -> login/signup -> pricing continuity must be wired on both auth surfaces.
assert.match(pricing, /buildAuthRoute\('\/login', '\/pricing'\)/);
assert.match(pricing, /buildAuthRoute\('\/signup', '\/pricing'\)/);
assert.match(login, /navigate\(returnPath\)/);
assert.match(login, /buildAuthRoute\('\/signup', returnPath\)/);
assert.match(signup, /navigate\(returnPath\)/);
assert.match(signup, /buildAuthRoute\('\/login', returnPath\)/);

// Required-document failures must tell the truth; system failures remain neutral.
assert.match(failureMessaging, /Supporting document required for Underwriting/);
assert.match(failureMessaging, /required T12 and Rent Roll/i);
assert.match(failureMessaging, /uploaded documents do not need to be changed/i);

// Site metadata must not drift from the currently governed delivery promise.
assert.equal(/within 48 hours|under 48 hours/i.test(indexHtml), false);
assert.match(indexHtml, /Screening and Underwriting Reports/);

// Guard new customer-facing copy against prohibited dash punctuation.
const customerPhrases = [
  'Fast, document-driven screening for early deal triage and acquisition decisions.',
  'Deeper document-driven underwriting for investment review, financing analysis, and downside testing.',
  'Two Screening Reports plus one Underwriting Report at a lower combined price.',
  'Screening requires both a Rent Roll and T12. Underwriting requires both core documents plus at least one supporting due diligence document.',
  'Screening accepts only the Rent Roll and T12.',
  'At least one supporting document is required for Underwriting.',
];
for (const phrase of customerPhrases) {
  assert.equal(/[–—]/.test(phrase), false, `customer-facing dash punctuation found: ${phrase}`);
}

console.log('launch-readiness-customer-journey-smoke: ok');
