import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath =
  'supabase/migrations/20260805000100_analysis_jobs_status_check_dead_letter.sql';
const migrationSource = fs.readFileSync(migrationPath, 'utf8');

const h6Path = 'supabase/migrations/20260729000200_h6_worker_claim_lease_fencing.sql';
const h6Source = fs.readFileSync(h6Path, 'utf8');

// 1) Drops only analysis_jobs_status_check
assert.match(
  migrationSource,
  /drop constraint if exists analysis_jobs_status_check/i
);
assert.equal(
  /drop constraint if exists analysis_jobs_dead_letter_terminal_state/i.test(
    migrationSource
  ),
  false
);
assert.equal(/drop constraint if exists (?!analysis_jobs_status_check)/i.test(migrationSource), false);

// 2) Recreates the same constraint name
assert.match(
  migrationSource,
  /add constraint analysis_jobs_status_check/i
);

// 3–6) Allowed set: all ten existing statuses remain; dead_letter added; dead_lettered not a status
const requiredStatuses = [
  'needs_documents',
  'queued',
  'extracting',
  'underwriting',
  'scoring',
  'rendering',
  'pdf_generating',
  'publishing',
  'published',
  'failed',
  'dead_letter',
];
for (const status of requiredStatuses) {
  assert.match(
    migrationSource,
    new RegExp(`'${status}'::text`, 'i'),
    `status ${status} must appear in constraint`
  );
}
assert.equal(
  /'dead_lettered'::text/i.test(migrationSource),
  false,
  'dead_lettered must not be used as a status value'
);

// Exactly eleven status literals (no extras removed or renamed)
const statusLiterals = migrationSource.match(/'([a-z_]+)'::text/gi) || [];
assert.equal(statusLiterals.length, 11, `expected 11 status literals, got ${statusLiterals.length}`);
const statusValues = statusLiterals.map((s) => s.replace(/'::text/i, '').replace(/'/g, ''));
assert.deepEqual(
  [...statusValues].sort(),
  [...requiredStatuses].sort(),
  'status set must match required set exactly'
);

// 7) No row mutation, RPC invocation, trigger change
assert.equal(/\bupdate\b/i.test(migrationSource), false);
assert.equal(/\binsert\b/i.test(migrationSource), false);
assert.equal(/\bdelete\b/i.test(migrationSource), false);
assert.equal(/\bcreate\s+or\s+replace\s+function\b/i.test(migrationSource), false);
assert.equal(/\bcreate\s+trigger\b/i.test(migrationSource), false);
assert.equal(/\bdrop\s+trigger\b/i.test(migrationSource), false);
assert.equal(/\bselect\b/i.test(migrationSource), false);

// 8) No unrelated table or constraint altered
assert.match(migrationSource, /alter table public\.analysis_jobs/i);
assert.equal(
  /alter table public\.(?!analysis_jobs\b)/i.test(migrationSource),
  false
);
assert.equal(/analysis_jobs_worker_attempt_count/i.test(migrationSource), false);
assert.equal(/analysis_jobs_dead_letter_terminal_state/i.test(migrationSource), false);

// 9) H6 max-attempt recovery still resolves to dead_letter
assert.match(
  h6Source,
  /when coalesce\(j\.worker_attempt_count, 0\) >= v_retry_limit then 'dead_letter'/i
);
assert.match(h6Source, /fail_expired_worker_job/i);
assert.match(
  h6Source,
  /check \(dead_lettered_at is null or status = 'dead_letter'\)/i
);

// 10) Constraint-only migration
assert.match(migrationSource, /analysis_jobs_status_check/);
assert.equal(/create table/i.test(migrationSource), false);
assert.equal(/create index/i.test(migrationSource), false);
assert.equal(/grant /i.test(migrationSource), false);
assert.equal(/revoke /i.test(migrationSource), false);

console.log('dead-letter-status-constraint-smoke: PASS');
