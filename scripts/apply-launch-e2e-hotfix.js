import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dashboardPath = path.join(root, 'src/pages/Dashboard.jsx');
const phase1Path = path.join(root, 'supabase/migrations/20260828233000_phase1_admission_core_modes_and_upload_policy.sql');
const phase2Path = path.join(root, 'supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql');
const phase3Path = path.join(root, 'supabase/migrations/20260830183000_phase3_worker_runtime_recovery_authority.sql');
const phase4Path = path.join(root, 'supabase/migrations/20260831100000_phase4_atomic_commerce_entitlement_authority.sql');
const reconciliationPath = path.join(root, 'supabase/migrations/20260910193000_launch_e2e_contract_reconciliation.sql');

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

function write(file, content) {
  fs.writeFileSync(file, content.replace(/\n/g, '\n'), 'utf8');
}

function replaceExact(source, before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Hotfix patch point missing: ${label}`);
  }
  const occurrences = source.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Hotfix patch point is not unique: ${label} (${occurrences})`);
  }
  return source.replace(before, after);
}

function stripTransaction(sql, label) {
  let body = sql.trim();
  if (!/^begin;\s*/i.test(body) || !/\s*commit;$/i.test(body)) {
    throw new Error(`${label} is not wrapped in BEGIN/COMMIT as expected`);
  }
  body = body.replace(/^begin;\s*/i, '').replace(/\s*commit;$/i, '').trim();
  return body;
}

let dashboard = read(dashboardPath);

dashboard = replaceExact(
  dashboard,
  `  const failedJobsForHistory = useMemo(() => (\n    recentJobs.filter((job) => job.status === 'failed')\n  ), [recentJobs]);`,
  `  const failedJobsForHistory = useMemo(() => (\n    recentJobs.filter((job) => {\n      const dismissed = dismissedJobIds.has(String(job.id));\n      return job.status === 'failed' && !dismissed;\n    })\n  ), [recentJobs, dismissedJobIds]);`,
  'failed report history must respect dismissed job ids'
);

const queueStartMarker = `      const { data: queueData, error: queueErr } = await supabase.rpc('queue_job_for_processing', { p_job_id: newJobId });`;
const queueEndMarker = `      toast({ title: 'Report queued', description: 'Your report has started. You may safely close this page and return later.' });`;
const queueStart = dashboard.indexOf(queueStartMarker);
const queueEnd = dashboard.indexOf(queueEndMarker, queueStart);
if (queueStart < 0 || queueEnd < 0 || queueEnd <= queueStart) {
  throw new Error('Hotfix patch point missing: retired queue_job_for_processing call');
}
dashboard = dashboard.slice(0, queueStart) + dashboard.slice(queueEnd);

const bundleStartMarker = `            <div style={{ marginBottom: 16 }}>\n              <button\n                type="button"\n                onClick={() => setSelectedPurchaseType('bundle')}`;
const step2Marker = `\n          {/* STEP 2 */}`;
const bundleStart = dashboard.indexOf(bundleStartMarker);
const step2Start = dashboard.indexOf(step2Marker, bundleStart);
if (bundleStart < 0 || step2Start < 0 || step2Start <= bundleStart) {
  throw new Error('Hotfix patch point missing: purchase option and entitlement block');
}

const purchaseAndEntitlementBlock = `            <div style={{ marginBottom: 16 }}>
              <div style={{ ...labelMono, marginBottom:8, color:T.ink4 }}>Purchase more credits</div>
              <button
                type="button"
                aria-pressed={selectedPurchaseType === 'bundle'}
                onClick={() => setSelectedPurchaseType((current) => current === 'bundle' ? selectedReportType : 'bundle')}
                style={{
                  fontFamily:   "'DM Mono', monospace",
                  fontSize:     10,
                  letterSpacing:'0.14em',
                  textTransform:'uppercase',
                  fontWeight:   500,
                  padding:      '9px 20px',
                  background:   T.white,
                  color:        selectedPurchaseType === 'bundle' ? T.goldDark : T.ink3,
                  border:       \`1px solid \${selectedPurchaseType === 'bundle' ? T.gold : T.hairlineMid}\`,
                  cursor:       'pointer',
                  transition:   'all 0.15s',
                }}
              >
                Buy Three-Report Bundle
              </button>
              {selectedPurchaseType === 'bundle' && (
                <div style={{ display:'flex', flexDirection:'column', gap:3, marginTop:12 }}>
                  <span style={{ ...bodySmall, fontSize:12 }}>Adds 2 Screening credits and 1 Underwriting credit.</span>
                  <span style={{ ...bodySmall, fontSize:12 }}>
                    Purchasing the bundle does not change the report type selected above.
                  </span>
                  <span style={{ ...bodySmall, fontSize:12 }}>
                    {commerceCatalog?.products?.bundle?.displayPrice || 'Pricing unavailable'} flat fee bundle.
                  </span>
                </div>
              )}
            </div>

            {/* Entitlement status */}
            {entitlements.error ? (
              <NoticeBox type="error">Unable to confirm report availability. Refresh to retry.</NoticeBox>
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:hasAvailableReport ? T.okBg : T.errorBg, border:\`1px solid \${hasAvailableReport ? T.okBorder : T.errorBorder}\`, flexWrap:'wrap', gap:10 }}>
                <div>
                  <span style={{ ...labelMono, color: hasAvailableReport ? T.okGreen : T.errorRed }}>
                    {selectedReportType === 'screening' ? 'Screening' : 'Underwriting'} credits available
                  </span>
                  <div style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:24, fontWeight:500, color: hasAvailableReport ? T.okGreen : T.errorRed, lineHeight:1, marginTop:4 }}>
                    {selectedReportType === 'screening' ? (entitlements.screening ?? 0) : (entitlements.underwriting ?? 0)}
                  </div>
                  <div style={{ ...bodySmall, fontSize:12, color:hasAvailableReport ? T.okGreen : T.errorRed, marginTop:4 }}>
                    Generating this report uses 1 {selectedReportType === 'screening' ? 'Screening' : 'Underwriting'} credit.
                  </div>
                </div>
                <PrimaryBtn
                  onClick={() => handleCheckout(selectedReportType)}
                  loading={checkoutLoading}
                  disabled={!commerceCatalog?.products?.[selectedReportType]}
                >
                  Purchase {selectedReportType === 'screening' ? 'Screening' : 'Underwriting'} Report
                </PrimaryBtn>
              </div>
            )}

            {selectedPurchaseType === 'bundle' && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:T.warm, border:\`1px solid \${T.hairlineMid}\`, flexWrap:'wrap', gap:10, marginTop:12 }}>
                <div>
                  <span style={{ ...labelMono, color:T.ink3 }}>Bundle purchase option</span>
                  <div style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:22, fontWeight:500, color:T.ink2, lineHeight:1.1, marginTop:4 }}>
                    2 Screening + 1 Underwriting
                  </div>
                  <div style={{ ...bodySmall, fontSize:12, color:T.ink3, marginTop:4 }}>
                    This purchase adds credits only. Your selected report remains {selectedReportType === 'screening' ? 'Screening' : 'Underwriting'}.
                  </div>
                </div>
                <PrimaryBtn
                  onClick={() => handleCheckout('bundle')}
                  loading={checkoutLoading}
                  disabled={!commerceCatalog?.products?.bundle}
                >
                  Purchase Bundle
                </PrimaryBtn>
              </div>
            )}
          </div>
`;

dashboard = dashboard.slice(0, bundleStart) + purchaseAndEntitlementBlock + dashboard.slice(step2Start);

if (dashboard.includes("supabase.rpc('queue_job_for_processing'")) {
  throw new Error('Retired queue_job_for_processing browser call remains after patch');
}
if (!dashboard.includes("Generating this report uses 1 {selectedReportType === 'screening' ? 'Screening' : 'Underwriting'} credit.")) {
  throw new Error('Explicit report credit consumption copy missing after patch');
}
write(dashboardPath, dashboard);

const phase1 = read(phase1Path);
const wrapperStart = phase1.indexOf('create or replace function public.consume_purchase_and_create_job(\n');
const wrapperEndMarker = '-- Enforce the same customer upload envelope at the Storage bucket boundary.';
const wrapperEnd = phase1.indexOf(wrapperEndMarker, wrapperStart);
if (wrapperStart < 0 || wrapperEnd < 0 || wrapperEnd <= wrapperStart) {
  throw new Error('Unable to extract certified Phase 1 governed admission wrapper');
}
const admissionWrapper = phase1.slice(wrapperStart, wrapperEnd).trim();
if (!admissionWrapper.includes('order by f.uploaded_at, f.id')) {
  throw new Error('Certified admission wrapper does not use analysis_job_files.uploaded_at');
}
if (admissionWrapper.includes('order by f.created_at, f.id')) {
  throw new Error('Certified admission wrapper still references nonexistent analysis_job_files.created_at');
}

const phase2Body = stripTransaction(read(phase2Path), 'Phase 2 migration');
const phase3Body = stripTransaction(read(phase3Path), 'Phase 3 migration');
const phase4Body = stripTransaction(read(phase4Path), 'Phase 4 migration');

const reconciliation = `begin;

-- InvestorIQ launch E2E production contract reconciliation.
-- Generated from already-certified Phase 1 through Phase 4 authorities.
-- This migration intentionally DOES NOT recreate the Phase 1 legacy admission primitive.
-- The strict September 8 consume_purchase_and_create_job_untrusted_legacy authority remains intact.
-- Phase 5 browser-read lockdown remains intentionally deferred because the current Dashboard
-- still reads customer-owned pipeline state directly under existing RLS policies.
-- Scheduler authority is restored in disabled state only. Activation is a separate owner action.

-- Restore only the corrected governed outer admission wrapper from Phase 1.
${admissionWrapper}

-- Restore atomic publication and customer publication projection from Phase 2.
${phase2Body}

-- Restore current bounded worker recovery contracts and scheduler authority from Phase 3.
${phase3Body}

-- Restore atomic Stripe entitlement grant and receipt authority from Phase 4.
${phase4Body}

commit;
`;

if (reconciliation.includes('create or replace function public.consume_purchase_and_create_job_untrusted_legacy')) {
  throw new Error('Reconciliation must not recreate or weaken the strict legacy admission primitive');
}
if (!reconciliation.includes('create or replace function public.finalize_worker_publication_v2')) {
  throw new Error('Atomic publication finalizer missing from reconciliation');
}
if (!reconciliation.includes('create or replace view public.customer_published_report_projection')) {
  throw new Error('Customer publication projection missing from reconciliation');
}
if (!reconciliation.includes('create or replace function public.grant_checkout_entitlements_v1')) {
  throw new Error('Atomic commerce entitlement grant missing from reconciliation');
}
if (!reconciliation.includes('enabled boolean not null default false')) {
  throw new Error('Scheduler authority must be restored disabled by default');
}
if (/enabled\s*=\s*true/i.test(reconciliation)) {
  throw new Error('Reconciliation must not activate the scheduler');
}

write(reconciliationPath, reconciliation);

console.log(JSON.stringify({
  ok: true,
  dashboard: 'patched',
  migration: path.relative(root, reconciliationPath).replaceAll('\\\\', '/'),
  protections: {
    strictAdmissionPrimitivePreserved: true,
    schedulerActivated: false,
    phase5Deferred: true,
  },
}, null, 2));
