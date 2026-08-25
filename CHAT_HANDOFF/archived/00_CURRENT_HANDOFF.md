# INVESTORIQ — CURRENT CHAT HANDOFF

**Date:** 2026-08-18
**Status:** P1 REPOSITORY AUTHORITY CLEANUP + LAUNCH QA REBUILD COMPLETE LOCALLY — NOT PRODUCTION CERTIFIED
**Current operating mode:** LOCAL ONLY / VERCEL PRESERVATION
**Master plan:** `01_MASTER_PLAN.md`

> **THE FULL INVESTORIQ REPOSITORY / PIPELINE AUDIT IS COMPLETE. DO NOT START ANOTHER BROAD AUDIT IN A FRESH CHAT. CONTINUE DIRECTLY FROM THE RECORDED IMPLEMENTATION CHECKPOINT. TARGETED INVESTIGATION IS ALLOWED ONLY WHEN NEW CONTRADICTORY EVIDENCE REQUIRES IT.**

## CURRENT POSITION

P0 is complete and was production-verified before the temporary Vercel freeze.

P1 **Repository Authority Cleanup + Launch QA Rebuild** is now complete locally. This does **not** mean production or launch PASS.

Dominant architecture diagnosis remains resolved by design direction:

> **AUTHORITY ACCUMULATION** — newer authorities had been layered over stale, duplicate, historical, or future-product authorities without retiring the old ones.

## TEMPORARY HARD RULE — VERCEL PRESERVATION

Until explicitly lifted by the owner:

- no GitHub push that triggers Vercel
- no deploy
- no production RETEST
- no production worker invocation
- no Vercel CLI / production log inspection
- no Supabase Cron re-enable
- batch local work and proofs first

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

**Next = ELITE Full Underwriting report upgrade, LOCAL ONLY.**

Focus next on institutional-quality report information architecture, evidence-disciplined analysis, executive-grade visuals, section disposition/collapse behavior, polished Quality Manifest, and sharper Screening vs Full Underwriting differentiation.

Do not change Stripe pricing yet. Commerce/Bundle pricing activation remains intentionally deferred until report quality reaches the ELITE target and the owner chooses final pricing.

Do not deploy or begin fresh production certification until explicitly authorized.

## FRESH-CHAT RULE

For a normal fresh InvestorIQ chat upload only:

1. `CHAT_HANDOFF/00_CURRENT_HANDOFF.md`
2. `CHAT_HANDOFF/01_MASTER_PLAN.md`

The receiving chat must **continue implementation directly**. It must not restart the already completed repository/pipeline audit.
