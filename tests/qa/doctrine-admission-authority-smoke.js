import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(qaDir, '../..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const canonicalHandoffFiles = [
  'CHAT_HANDOFF/03_FRESH_CHAT_PROMPT.md',
  'CHAT_HANDOFF/00_CURRENT_HANDOFF.md',
  'CHAT_HANDOFF/01_MASTER_PLAN.md',
  'CHAT_HANDOFF/02_ELITE_REPORT_BLUEPRINT.md',
  'CHAT_HANDOFF/README.md',
];

for (const relativePath of canonicalHandoffFiles) {
  const text = read(relativePath);
  assert.match(text, /Customer admission constitution - GOVERNING OWNER AUTHORITY/);
  assert.match(text, /Screening Report requires \*\*both\*\* a usable T12 \/ operating statement \*\*and\*\* a usable Rent Roll/i);
  assert.match(text, /Supporting or additional due-diligence documents are not part of the Screening upload package and must not be admitted for Screening/i);
  assert.match(text, /Underwriting Report requires \*\*both\*\* a usable T12 \/ operating statement \*\*and\*\* a usable Rent Roll, \*\*plus at least one additional readable supporting due-diligence document\*\*/i);
  assert.match(text, /after a job has already been validly admitted/i);
  assert.match(text, /do not reduce or replace the customer upload requirements above/i);
}

const productDoctrine = read('docs/INVESTORIQ_PRODUCT_DOCTRINE.md');
assert.match(productDoctrine, /September 8, 2026 owner admission clarification - CURRENT AUTHORITY/);
assert.match(productDoctrine, /Screening admission.*both a usable T12 \/ operating statement and a usable Rent Roll are required/is);
assert.match(productDoctrine, /Supporting or additional due-diligence documents are not admitted for Screening/i);
assert.match(productDoctrine, /Underwriting admission.*both a usable T12 \/ operating statement and a usable Rent Roll are required, plus at least one additional readable supporting due-diligence document/is);
assert.match(productDoctrine, /after a job has already been validly admitted/i);
assert.match(productDoctrine, /do not reduce or replace the customer upload requirements above/i);

const architecture = read('docs/PRODUCTION_PIPELINE_ARCHITECTURE.md');
assert.match(architecture, /September 8, 2026 admission authority clarification/);
assert.match(architecture, /Screening.*both a usable T12 \/ operating statement and a usable Rent Roll are required/is);
assert.match(architecture, /Screening admits no supporting or additional due-diligence documents/i);
assert.match(architecture, /Underwriting.*both a usable T12 \/ operating statement and a usable Rent Roll are required, plus at least one additional readable supporting due-diligence document/is);
assert.match(architecture, /t12_minimum_core.*rent_roll_minimum_core.*downstream source-truth \/ publication-survivability states after valid admission/is);
assert.match(architecture, /do not authorize customer intake with one core document/i);

// Historical files may preserve older wording. The current authority surfaces may not
// present a minimum-core survivor mode as a customer intake permission.
for (const relativePath of [...canonicalHandoffFiles, 'docs/PRODUCTION_PIPELINE_ARCHITECTURE.md']) {
  const text = read(relativePath);
  assert.equal(/customer(?: intake| admission).*Rent Roll or (?:a )?T12/i.test(text), false, `${relativePath} reintroduced one-core customer admission`);
}

console.log('doctrine-admission-authority-smoke: PASS');
