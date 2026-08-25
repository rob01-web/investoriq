# INVESTORIQ — CURRENT CHAT HANDOFF

**Date:** 2026-08-18
**Status:** P0/P1 MONSTER-AUDIT REPAIR BATCH DEPLOYED TO PRODUCTION — VERCEL READY — GITHUB CI LOCKFILE FOLLOW-UP PENDING — NOT YET PRODUCTION CERTIFIED
**Current operating mode:** DEPLOYMENT COMPLETE / CRON STILL PAUSED / NO PRODUCTION RETEST / MINIMAL CI FOLLOW-UP ONLY
**Master plan:** `01_MASTER_PLAN.md`

> **THE FULL INVESTORIQ REPOSITORY / PIPELINE AUDIT IS COMPLETE. DO NOT START ANOTHER BROAD AUDIT IN A FRESH CHAT. CONTINUE DIRECTLY FROM THE RECORDED IMPLEMENTATION CHECKPOINT. TARGETED INVESTIGATION IS ALLOWED ONLY WHEN NEW CONTRADICTORY EVIDENCE REQUIRES IT.**

## 2026-08-18 17:45 EDT — DEPLOYMENT WIN / EXACT FRESH-CHAT CHECKPOINT

**Monster-audit repair status:** the full repository/pipeline audit is complete and the resulting P0/P1 repair batch has now been committed and deployed. **DO NOT restart a broad audit.**

### Consolidated repair commit

- Commit: `9df57f0` — `fix: complete InvestorIQ P0 P1 pipeline authority repair`
- Scope: 73 files changed; 2,003 insertions; 5,165 deletions.
- Push to `origin/main`: PASS.
- Vercel production deployment: **READY / CURRENT** for commit `9df57f0`.
- Deployment duration observed in Vercel UI: ~33 seconds.
- No production report RETEST has been run after this deployment.
- No worker invocation has been performed after this deployment.
- Supabase Cron remains intentionally **PAUSED**.

### GitHub Actions follow-up — NOT a pipeline regression

The push-triggered `InvestorIQ Launch QA` workflow failed **before canonical QA ran**. Exact failure:

- step: `npm ci`
- reason: `package.json` and `package-lock.json` were out of sync
- exact missing lock entry: `yaml@2.9.0`
- `Run canonical launch QA` was **SKIPPED**
- Node 20 deprecation message was a warning, not the failure cause

Local repair already executed:

```powershell
npm install --package-lock-only
```

Result:

- command completed successfully
- `package-lock.json` is now modified locally and **not yet committed/pushed**
- npm reported 27 dependency vulnerabilities; **do not run `npm audit fix` or `npm audit fix --force` as part of this lockfile synchronization step**

### Exact next action in the fresh chat

1. Inspect the `package-lock.json` diff only and confirm it is the expected lock synchronization.
2. Commit only the lockfile follow-up.
3. Push once to clear GitHub Actions.
4. Do **not** run a production report, worker, Cron, or broad certification cycle merely to satisfy the CI workflow.
5. After the tiny CI housekeeping item is closed, continue directly into **ELITE Full Underwriting report upgrade**.

### Supporting local evidence already complete

- local production build: PASS
- `git diff --check`: PASS
- canonical local QA runner: **19/19 PASS**
- this QA result is regression evidence only; it has zero constitutional/production-certification authority

## CURRENT POSITION

P0 is complete and was production-verified before the temporary Vercel freeze.

P1 **Repository Authority Cleanup + Launch QA Rebuild** is now complete locally. This does **not** mean production or launch PASS.

Dominant architecture diagnosis remains resolved by design direction:

> **AUTHORITY ACCUMULATION** — newer authorities had been layered over stale, duplicate, historical, or future-product authorities without retiring the old ones.

## CURRENT POST-DEPLOYMENT PRESERVATION RULE

The one consolidated P0/P1 deployment has now been completed. From this checkpoint:

- one tiny GitHub CI lockfile follow-up push is permitted
- no production RETEST yet
- no production worker invocation
- no Supabase Cron re-enable
- no repeated Vercel/log/deploy loop
- continue report-quality work locally after CI housekeeping

Supabase Cron `investoriq-admin-run-worker` remains intentionally **PAUSED** (`active = false`).

## P1 LOCAL COMPLETION

### Canonical local QA authority

`tests/qa/run-all.js` (or `npm run qa`) is the single canonical **local launch-regression runner**.

Latest local result after the final stale Full Underwriting expectation reconciliation:

> **19 / 19 PASS**

This result is supporting regression evidence only. The suite has **zero constitutional authority** and cannot produce production/launch PASS.

Package-script taxonomy is now explicit:

- `qa` — canonical local launch-regression runner
- `qa:component:*` — focused supporting component/regression suites
- `qa:diagnostic:*` — historical, RETEST-specific, institutional/experimental, or future-product diagnostics; never launch authority
- `qa:utility:*` — local QA utilities

### Full Underwriting authority cleanup

Current Full Underwriting construction is routed through `api/_lib/full-underwriting-pipeline.js`.

Historical Acquisition-named implementation may remain only as reusable lower-level components or legacy fixtures. It does not own current Full Underwriting product identity or launch certification.

The stale `hasCanonicalAcquisitionFinalDecision` runtime compatibility reference was repaired, and the final FU smoke expectation was reconciled to the current representation-compliance classification without weakening production behavior.

### Historical Acquisition / `ic`

Historical Acquisition QA remains diagnostic/reference only. Legacy source-package and render-helper fixtures were renamed to make their role explicit:

- `api/_lib/legacy-source-package-fixture.js`
- `api/_lib/legacy-report-surface-render-helpers.js`

Acquisition/`ic` cannot override current source truth, publication obligation, delivery authority, revision authority, or launch QA.

### Premium

Premium remains future-only and OFF.

Premium package authority is diagnostic only. Premium documentation is physically isolated under `docs/future-premium/` and is explicitly non-launch authority.

Premium cannot control or block Screening or Full Underwriting source truth, delivery, publication, worker lifecycle, billing/remedy, launch QA, or launch certification.

### Dead / duplicate authority retired

P1 retired or isolated stale active-looking paths including:

- `api/_lib/canonical-source-package.js`
- `api/_lib/report-surface-render-helpers.js`
- `api/_lib/acquisition-memo-v2-final-assembly.js`
- `api/report-template.html`
- `api/data/riverbend_dataset.json`
- `src/components/UploadModal.jsx`
- `src/pages/CheckoutSuccess.jsx`
- `src/pages/ReportHistory.jsx`
- `src/pages/SampleReport.jsx`
- stale local generated/output artifacts used during previous debugging

The current runtime template remains `api/report-template-runtime.html`.

### Documentation authority cleanup

Current documentation hierarchy is now declared in `docs/README.md`:

1. Owner / Product Constitution
2. Production Pipeline Architecture
3. Operations / Recovery Runbook
4. Launch Certification Checklist

Historical active-looking root plans/maps are archived. Future Premium documentation is separated from current launch authority.

## EXACT P1 FILE SCOPE

Primary production / authority files changed or added during this local P1 packet include:

- `api/_lib/acquisition-memo-v2-document.js`
- `api/_lib/acquisition-memo-v2-final-decision.js`
- `api/_lib/full-underwriting-pipeline.js`
- `api/_lib/generate-client-report-impl.js`
- `api/_lib/legacy-report-surface-render-helpers.js`
- `api/_lib/legacy-source-package-fixture.js`
- `api/_lib/report-delivery-output.js`
- `api/_lib/report-request-context.js`
- `api/_lib/source-report-coverage-qa.js`
- `api/admin-run-worker.js`
- `package.json`
- `tests/qa/run-all.js`
- `tests/qa/README.md`
- targeted QA fixtures reconciled to current authority boundaries

Repository cleanup also deletes/archives the dead/duplicate files listed above and removes temporary P1 helper/output files.

## NON-NEGOTIABLE DOCTRINE

- Current launch products: Screening + Full Underwriting.
- Bundle is commerce only.
- Premium is future-only and OFF.
- Full Underwriting admission remains strict: usable T12 + usable Rent Roll + at least one additional readable/adjudicable support document.
- Downstream Core-Gated Publish-or-Collapse remains separate from intake.
- Canonical downstream modes: `dual_source_core`, `t12_minimum_core`, `rent_roll_minimum_core`, `insufficient_core`.
- The first three are publish-capable states.
- Optional/support weakness must qualify, compact, collapse, omit, or create a quality incident rather than independently destroy valid core.
- Internal failures remain InvestorIQ internal failures and must not be converted into customer-document blame.
- Smoke/QA tests are supporting evidence only and have zero constitutional authority.
- Fresh production certification is mandatory before launch PASS.

## NEXT IMPLEMENTATION PHASE

**Next = close the tiny `package-lock.json` GitHub CI synchronization, then ELITE Full Underwriting report upgrade, LOCAL ONLY.**

Focus next on institutional-quality report information architecture, evidence-disciplined analysis, executive-grade visuals, section disposition/collapse behavior, polished Quality Manifest, and sharper Screening vs Full Underwriting differentiation.

Do not change Stripe pricing yet. Commerce/Bundle pricing activation remains intentionally deferred until report quality reaches the ELITE target and the owner chooses final pricing.

Do not deploy or begin fresh production certification until explicitly authorized.

## FRESH-CHAT RULE

For a normal fresh InvestorIQ chat upload only:

1. `CHAT_HANDOFF/00_CURRENT_HANDOFF.md`
2. `CHAT_HANDOFF/01_MASTER_PLAN.md`

The receiving chat must **continue implementation directly**. It must not restart the already completed repository/pipeline audit.
