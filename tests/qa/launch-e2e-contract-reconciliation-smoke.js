import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dashboard = fs.readFileSync(path.join(root, 'src/pages/Dashboard.jsx'), 'utf8');
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260910193000_launch_e2e_contract_reconciliation.sql'),
  'utf8'
);

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(
  !dashboard.includes("supabase.rpc('queue_job_for_processing'"),
  'Dashboard must not call retired queue_job_for_processing after governed admission'
);
expect(
  dashboard.includes("return job.status === 'failed' && !dismissed;"),
  'Report history must filter dismissed failed jobs'
);
expect(
  dashboard.includes('), [recentJobs, dismissedJobIds]);'),
  'Dismissed failed-job history must react to dismissedJobIds changes'
);
expect(
  dashboard.includes('Buy Three-Report Bundle'),
  'Bundle purchase option must be visually distinct from report type selection'
);
expect(
  dashboard.includes('Purchasing the bundle does not change the report type selected above.'),
  'Bundle UI must explain that purchase choice does not change report type'
);
expect(
  dashboard.includes("Generating this report uses 1 {selectedReportType === 'screening' ? 'Screening' : 'Underwriting'} credit."),
  'Dashboard must state exactly which credit report generation consumes'
);
expect(
  migration.includes('order by f.uploaded_at, f.id'),
  'Governed admission wrapper must use analysis_job_files.uploaded_at'
);
expect(
  !migration.includes('order by f.created_at, f.id'),
  'Reconciliation must not reference nonexistent analysis_job_files.created_at'
);
expect(
  !migration.includes('create or replace function public.consume_purchase_and_create_job_untrusted_legacy'),
  'Reconciliation must preserve the strict September 8 legacy admission primitive'
);
expect(
  migration.includes('create or replace function public.finalize_worker_publication_v2'),
  'Reconciliation must restore atomic publication finalizer'
);
expect(
  migration.includes('create or replace view public.customer_published_report_projection'),
  'Reconciliation must restore governed customer publication projection'
);
expect(
  migration.includes('create or replace function public.grant_checkout_entitlements_v1'),
  'Reconciliation must restore atomic Stripe entitlement grant'
);
expect(
  migration.includes('create table if not exists public.worker_scheduler_authority'),
  'Reconciliation must restore scheduler authority record'
);
expect(
  migration.includes('enabled boolean not null default false'),
  'Scheduler authority must default disabled during reconciliation'
);
expect(
  !/enabled\s*=\s*true/i.test(migration),
  'Reconciliation migration must not activate the scheduler'
);
expect(
  !migration.includes('20260901100000_phase5_security_data_hygiene_hardening'),
  'Phase 5 direct-browser-read lockdown must remain outside this launch reconciliation'
);

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  checks: 16,
  contract: 'launch_e2e_production_reconciliation',
}, null, 2));
