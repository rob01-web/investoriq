# INVESTORIQ — CURRENT CHAT HANDOFF

**Date:** 2026-08-19
**Status:** ELITE-02 THROUGH ELITE-08 CLOSED LOCALLY — FULL CUMULATIVE + INSTITUTIONAL REGRESSION PROVEN — ELITE-09 NEXT — NOT DEPLOYED / NOT PRODUCTION CERTIFIED
**Current operating mode:** ELITE FULL UNDERWRITING UPGRADE / LOCAL ONLY / CRON PAUSED / NO PRODUCTION RETEST / NO WORKER INVOCATION / NO DEPLOY / NO PRICING CHANGE
**Master plan:** `01_MASTER_PLAN.md`

> **THE FULL INVESTORIQ REPOSITORY / PIPELINE AUDIT IS COMPLETE. DO NOT START ANOTHER BROAD AUDIT IN A FRESH CHAT. CONTINUE DIRECTLY FROM THE RECORDED IMPLEMENTATION CHECKPOINT. TARGETED INVESTIGATION IS ALLOWED ONLY WHEN NEW CONTRADICTORY EVIDENCE REQUIRES IT.**

## 2026-08-19 20:37 EDT — ELITE-08 CLOSED LOCALLY / EXACT FRESH-CHAT CHECKPOINT

**THIS SECTION SUPERSEDES ALL OLDER "NEXT ACTION" LANGUAGE BELOW WHEREVER THERE IS A CONFLICT.**

### Current ELITE implementation status

- ELITE-01 — baseline / contract: complete as prerequisite authority.
- ELITE-02 — Investment Committee Overview: **CLOSED LOCALLY**.
- ELITE-03 — Operating Intelligence: **CLOSED LOCALLY**.
- ELITE-04 — Scenario Engine v1: **CLOSED LOCALLY**.
- ELITE-05 — Driver Analysis: **CLOSED LOCALLY**.
- ELITE-06 — Transaction / Diligence Intelligence: **CLOSED LOCALLY WITH FULL REGRESSION PROOF**.
- ELITE-07 — Debt Intelligence: **CLOSED LOCALLY WITH FULL REGRESSION PROOF**.
- ELITE-08 — Valuation & Reconciliation Upgrade: **CLOSED LOCALLY WITH FULL CUMULATIVE + INSTITUTIONAL PROOF**.
- **NEXT = ELITE-09 — Quality Manifest Redesign.**

### ELITE-08 final proof — authoritative local checkpoint

Final V3 acceptance passed the complete local veto stack:

- `full-underwriting-valuation-reconciliation-customer-language-smoke`: **7/7 PASS**
- `full-underwriting-valuation-reconciliation-appraisal-surface-contract-smoke`: **9/9 PASS**
- `full-underwriting-valuation-reconciliation-v1-smoke`: **72/72 PASS**
- `full-underwriting-valuation-reconciliation-renderer-smoke`: **44/44 PASS**
- `full-underwriting-valuation-reconciliation-document-wiring-smoke`: **15/15 PASS**
- `full-underwriting-valuation-reconciliation-institutional-regression`: **21/21 PASS**
- real cumulative `full-underwriting-elite-02-08-pipeline-regression`: **PASS**
  - includes preserved real ELITE-02→07 cumulative stack
  - includes ELITE-08 institutional full-document proof
- preserved ELITE-07 `full-underwriting-debt-intelligence-institutional-regression`: **36/36 PASS**
- preserved ELITE-06 `full-underwriting-transaction-diligence-institutional-regression`: **24/24 PASS**
- `institutional-pdf-information-architecture-smoke`: **PASS**
- `acquisition-memo-v2-customer-surface-model-smoke`: **PASS**
- `acquisition-memo-boss-contract-smoke`: **PASS**
- `source-truth-pipeline-authority-smoke`: **PASS**
- `acquisition-memo-v2-final-pdf-handoff-smoke`: **ok**
- `gate10v-elite-underwriting-report-smoke`: **PASS**
- syntax checks: PASS
- `git diff --check`: no whitespace errors; expected LF→CRLF warnings only

The final-handoff smoke emitted expected local/offline advisory failures (`fetch failed`, missing `OPENAI_API_KEY`) while still ending `acquisition-memo-v2-final-pdf-handoff-smoke: ok`. These did not invalidate local closure.

### ELITE-08 capability now present

Valuation & Reconciliation is now a downstream-only, evidence-governed analytical surface that:

- anchors whole-property implied value to accepted T12 NOI and accepted going-in cap rate,
- calculates deterministic value per unit where units are supported,
- compares implied value with accepted purchase price,
- compares source-backed uploaded appraisal context without allowing appraisal to overwrite canonical operating truth,
- provides deterministic purchase-price and appraisal variance relationships,
- translates core T12 / Rent Roll reconciliation differences into decision-readable context without capitalizing gross-revenue differences,
- reuses governed ELITE-04 cap-rate sensitivity rather than creating a second scenario authority,
- collapses unsupported valuation comparators cleanly,
- does not invent IRR, MOIC, hold period, exit cap rate, terminal value, rent growth, lender decisions, BUY/SELL/HOLD, or recommendation authority.

### ELITE-08 veto catches and permanent lessons

The cumulative/institutional gates caught two real representation-boundary defects before closure:

1. **Appraisal provenance repair regression**
   - Initial targeted ELITE-08 tests passed.
   - Cumulative regression vetoed because `appraisalContext.factAvailability.sourceBacked` would be lost during repair.
   - Exact trigger: ELITE-08 rendered accepted appraisal cap rate as `7.40%` while the canonical customer-surface formatter expected `7.4%`.
   - The customer-surface validator treated the accepted appraisal fact as missing, repair attempted to collapse the section, and the existing provenance firewall correctly blocked the regression.
   - Fix: align ELITE-08 appraisal display with the canonical formatter.
   - Added dedicated appraisal customer-surface contract regression.
   - **The provenance firewall was not weakened.**

2. **Institutional customer-language leak**
   - After cumulative ELITE-02→08 passed, institutional information architecture vetoed visible `source-backed` wording.
   - Internal evidence class `source_backed` remains valid and preserved.
   - Customer-facing wording was changed to institutional language such as `Accepted evidence` / `uploaded appraisal value`.
   - Added a customer-language regression proving internal provenance remains while forbidden internal-language leakage is absent.
   - **No evidence authority or provenance semantics changed.**

A V1 hotfix packaging defect also inserted a literal PowerShell backtick-n sequence into JavaScript and failed syntax before behavioral tests. V2 repaired only that packaging defect. It did not expose a product-logic regression.

### QA doctrine remains locked

Targeted smoke tests are necessary but insufficient.

For ELITE-09 and later:
1. inspect exact current inputs and authority before modifying a surface,
2. run targeted contract / renderer / wiring proof,
3. run cumulative real ELITE stack / institutional regression,
4. run broader institutional IA / customer surface / boss / Source Truth / final handoff / Gate 10V,
5. syntax / diff integrity gets the final local veto.

**The full cumulative/institutional pipeline gets the veto.**

### Current local repository state

ELITE-02 through ELITE-08 remain local and uncommitted/unpushed. Preserve the accumulated working tree.

Primary new ELITE-08 files include:

- `api/_lib/full-underwriting-valuation-reconciliation-v1.js`
- `api/_lib/full-underwriting-valuation-reconciliation-renderer.js`
- `tests/qa/full-underwriting-valuation-reconciliation-v1-smoke.js`
- `tests/qa/full-underwriting-valuation-reconciliation-renderer-smoke.js`
- `tests/qa/full-underwriting-valuation-reconciliation-document-wiring-smoke.js`
- `tests/qa/full-underwriting-valuation-reconciliation-institutional-regression.js`
- `tests/qa/full-underwriting-valuation-reconciliation-appraisal-surface-contract-smoke.js`
- `tests/qa/full-underwriting-valuation-reconciliation-customer-language-smoke.js`
- `tests/qa/full-underwriting-elite-02-08-pipeline-regression.js`
- modified `api/_lib/acquisition-memo-v2-document.js`

Do not clean, reset, discard, commit, push, deploy, invoke the worker, re-enable Cron, run a production RETEST, or change pricing unless explicitly authorized.

### NEXT — ELITE-09 Quality Manifest Redesign

Begin with read-only inspection of the exact current Quality Manifest construction, inputs, source/certification authority, and customer-visible placement.

The ELITE-09 target is to make the Quality Manifest investor-readable and polished while preserving:
- report identity,
- revision identity,
- generated/certified timestamp,
- product identity,
- source mode,
- accepted core evidence,
- supporting documents used/excluded,
- core reconciliation status,
- collapsed/omitted sections,
- quality incidents,
- scenario-analysis basis,
- calculation authority version,
- report certification version,
- publication receipt identity.

The manifest must communicate confidence and limits without reading like an internal error log.

---
## 2026-08-19 16:53 EDT — ELITE-07 CLOSED LOCALLY / EXACT FRESH-CHAT CHECKPOINT

**This section supersedes older “next action” language below wherever there is a conflict.**

### ELITE implementation status

- ELITE-01 — baseline / contract: complete as prerequisite authority.
- ELITE-02 — Investment Committee Overview: **CLOSED LOCALLY**.
- ELITE-03 — Operating Intelligence: **CLOSED LOCALLY**.
- ELITE-04 — Scenario Engine v1: **CLOSED LOCALLY**.
- ELITE-05 — Driver Analysis: **CLOSED LOCALLY**.
- ELITE-06 — Transaction / Diligence Intelligence: **CLOSED LOCALLY WITH FULL REGRESSION PROOF**.
- ELITE-07 — Debt Intelligence: **CLOSED LOCALLY WITH FULL REGRESSION PROOF**.
- **NEXT = ELITE-08 — Valuation & Reconciliation Upgrade.**

### ELITE-07 final proof — authoritative local checkpoint

The final ELITE-07 boundary-corrected run passed:

- `full-underwriting-debt-intelligence-v1-smoke`: **116/116 PASS**
- `full-underwriting-debt-intelligence-renderer-smoke`: **36/36 PASS**
- `full-underwriting-debt-intelligence-document-wiring-smoke`: **15/15 PASS**
- cumulative `full-underwriting-elite-stack-pipeline-regression`: **PASS**
- `full-underwriting-debt-intelligence-institutional-regression`: **36/36 PASS**
- preserved ELITE-06 `full-underwriting-transaction-diligence-institutional-regression`: **24/24 PASS**
- `institutional-pdf-information-architecture-smoke`: **PASS**
- `acquisition-memo-v2-customer-surface-model-smoke`: **PASS**
- `acquisition-memo-boss-contract-smoke`: **PASS**
- `source-truth-pipeline-authority-smoke`: **PASS**
- `acquisition-memo-v2-final-pdf-handoff-smoke`: **ok**
- `gate10v-elite-underwriting-report-smoke`: **PASS**
- syntax checks: PASS
- `git diff --check`: no whitespace errors; only expected LF→CRLF warnings

The local final-handoff smoke emitted expected offline/advisory write failures (`fetch failed`, missing `OPENAI_API_KEY`) while still ending `acquisition-memo-v2-final-pdf-handoff-smoke: ok`. These messages did not invalidate the local regression result.

### ELITE-07 customer/report capability now present

Debt Intelligence now provides evidence-governed, downstream-only analysis including:

- current versus proposed debt-service / DSCR context where supported,
- current/proposed coverage headroom,
- proposed interest-rate sensitivity at governed scenario points,
- current-debt maturity context when source-backed,
- proposed debt yield,
- proposed mortgage constant,
- debt-inclusive occupancy coverage point,
- debt-inclusive monthly rent-per-unit coverage point,
- decision-useful debt observations without creating lender, credit, publication, or recommendation authority.

No invented lender covenant, arbitrary risk grade, unsupported refinance model, BUY/SELL/HOLD authority, or source-truth mutation is permitted.

### Two ELITE-07 namespace rules permanently learned

1. **`Break-Even Occupancy` is a reserved canonical operating metric** equal to accepted OpEx divided by accepted T12 Gross Potential Rent. Debt-inclusive occupancy metrics must not reuse that label. ELITE-07 uses **Debt-Inclusive Occupancy Coverage Point** instead.
2. Customer-visible `refinance` / `refi` surfaces remain forbidden by the existing boss contract. Internal authority flags may preserve the boundary, but customer-visible wording must not create that prohibited surface.

### QA doctrine strengthened after ELITE-06 / ELITE-07

Targeted smoke tests are supporting evidence only.

For every remaining ELITE packet:
1. run targeted contract / renderer / wiring proof,
2. run the cumulative real ELITE stack / institutional fixture,
3. run broader customer-surface / boss / Source Truth / final-handoff / Gate 10V gates,
4. only then call the packet CLOSED LOCALLY.

**The full pipeline regression gets the veto.**

### Current local repository state

The ELITE-02 through ELITE-07 work is still local and uncommitted/unpushed. The working tree contains the accumulated ELITE contract, renderer, wiring, regression, fixture-hardening, and report-document changes. GitHub/production must not be treated as containing these ELITE upgrades yet.

Do not clean, reset, discard, commit, push, deploy, invoke the worker, re-enable Cron, or run a production RETEST unless explicitly authorized.

### Accumulated local ELITE file set

Primary local report modules now include:

- `api/_lib/full-underwriting-chapter1-elite-contract.js`
- `api/_lib/full-underwriting-chapter1-elite-renderer.js`
- `api/_lib/full-underwriting-operating-intelligence-contract.js`
- `api/_lib/full-underwriting-operating-intelligence-renderer.js`
- `api/_lib/full-underwriting-scenario-engine-v1.js`
- `api/_lib/full-underwriting-scenario-renderer.js`
- `api/_lib/full-underwriting-driver-analysis-v1.js`
- `api/_lib/full-underwriting-driver-analysis-renderer.js`
- `api/_lib/full-underwriting-transaction-diligence-v1.js`
- `api/_lib/full-underwriting-transaction-diligence-renderer.js`
- `api/_lib/full-underwriting-debt-intelligence-v1.js`
- `api/_lib/full-underwriting-debt-intelligence-renderer.js`
- modified `api/_lib/acquisition-memo-v2-document.js`

Regression-hardened local QA now also includes the ELITE section tests plus:

- `tests/qa/full-underwriting-elite-stack-pipeline-regression.js`
- `tests/qa/full-underwriting-transaction-diligence-institutional-regression.js`
- `tests/qa/full-underwriting-debt-intelligence-institutional-regression.js`
- modified `tests/qa/fixtures/institutional-gate-10-report.js`
- modified `tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js`
- modified `tests/qa/acquisition-memo-v2-final-pdf-handoff-smoke.js`
- modified `tests/qa/source-truth-pipeline-authority-smoke.js`

These local changes must be preserved when ELITE-08 is added.

## HISTORICAL — 2026-08-18 17:45 EDT — DEPLOYMENT WIN / SUPERSEDED CHECKPOINT

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

**NEXT = ELITE-08 — Valuation & Reconciliation Upgrade, LOCAL ONLY.**

ELITE-08 should improve:
- purchase-price / implied-value framing,
- source-backed appraisal comparison,
- cap-rate value reconciliation,
- reconciliation interpretation,
- valuation bridge / variance explanation,
- governed value sensitivity using already-authorized scenario inputs,
- transparent missing-data collapse behavior.

Do not invent exit cap rates, hold periods, IRR, MOIC, terminal value, rent growth, or other unsupported investment assumptions.

Use the ELITE-06/07 acceptance doctrine from the start: targeted tests are necessary but insufficient; cumulative pipeline / institutional regression and broader authority/delivery gates must pass before ELITE-08 can be called CLOSED LOCALLY.

No pricing change, deploy, production RETEST, worker invocation, or Cron re-enable is authorized.

## FRESH-CHAT RULE

For the next InvestorIQ chat upload these **three files**:

1. `00_CURRENT_HANDOFF_UPDATED_2026-08-19_ELITE07_CLOSED_LOCAL.md`
2. `01_MASTER_PLAN_UPDATED_2026-08-19_ELITE07_CLOSED_LOCAL.md`
3. `02_ELITE_FULL_UNDERWRITING_BLUEPRINT_UPDATED_2026-08-19_ELITE07_CLOSED_LOCAL.md`

The receiving chat must:

- treat these as the current working authority,
- **not restart the completed repository/pipeline audit**,
- **not re-open ELITE-02 through ELITE-07 absent contradictory evidence**,
- preserve the local-only / Cron-paused / no-deploy operating doctrine,
- continue directly with **ELITE-08 — Valuation & Reconciliation Upgrade**,
- use full cumulative regression proof rather than smoke tests alone before closing ELITE-08.

