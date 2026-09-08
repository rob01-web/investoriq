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
const login = read('src/pages/Login.jsx');
const signup = read('src/pages/SignUp.jsx');
const failureMessaging = read('src/lib/jobFailureMessaging.js');
const indexHtml = read('index.html');

// Pricing must reflect the canonical one-core-source admission contract.
assert.match(pricing, /Start with a Rent Roll or T12/);
assert.match(pricing, /supporting diligence when available/i);
assert.match(pricing, /If no usable core source can be verified, no report is published and the report credit is restored/i);

// Bundle copy must sell the customer outcome instead of leaking commerce implementation details.
assert.match(pricing, /Three-Report Bundle/);
assert.match(pricing, /Screen two opportunities and take one finalist through full Underwriting/i);
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
assert.match(pricing, /\.pricing-card-header\s*\{/);
assert.match(pricing, /\.pricing-card-price\s*\{/);
assert.match(pricing, /\.pricing-card-description\s*\{/);
assert.match(pricing, /@media \(max-width: 760px\)/);

// Pricing -> login/signup -> pricing continuity must be wired on both auth surfaces.
assert.match(pricing, /buildAuthRoute\('\/login', '\/pricing'\)/);
assert.match(pricing, /buildAuthRoute\('\/signup', '\/pricing'\)/);
assert.match(login, /navigate\(returnPath\)/);
assert.match(login, /buildAuthRoute\('\/signup', returnPath\)/);
assert.match(signup, /navigate\(returnPath\)/);
assert.match(signup, /buildAuthRoute\('\/login', returnPath\)/);

// Legacy support-document admission language must never reach customer failure messaging.
assert.equal(
  failureMessaging.includes('requires at least one usable supporting document in addition to the T12 and rent roll'),
  false
);
assert.match(failureMessaging, /readable Rent Roll or T12/);
assert.match(failureMessaging, /supporting diligence when available/);

// Site metadata must not drift from the currently governed delivery promise.
assert.equal(/within 48 hours|under 48 hours/i.test(indexHtml), false);
assert.match(indexHtml, /Screening and Underwriting Reports/);

// Guard the customer-facing Pricing rewrite against prohibited dash punctuation.
const pricingCustomerPhrases = [
  'Fast, document-driven screening for early deal triage and acquisition decisions.',
  'Deeper document-driven underwriting for investment review, financing analysis, and downside testing.',
  'Screen two opportunities and take one finalist through full Underwriting for one fixed price.',
  'Start with a Rent Roll or T12. Provide both when available, and add supporting deal documents to deepen the analysis where the evidence supports it.',
];
for (const phrase of pricingCustomerPhrases) {
  assert.equal(/[–—]/.test(phrase), false, `customer-facing dash punctuation found: ${phrase}`);
}

console.log('launch-readiness-customer-journey-smoke: ok');
