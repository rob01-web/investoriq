# June 3, 2026 Addendum - Codex Usage Conservation / Slice 3 In Progress Checkpoint

## Current continuation point

Codex is currently working on:

```text
Slice 3 - Acquisition/current-debt/proposed-financing truth cleanup
```

This follows:

```text
Slice 0 - Documentation checkpoint: complete
Slice 1 - Delivery/artifact legacy alias cleanup: pass / safe to commit
Slice 2 - Advanced modeling / DCF / waterfall render gates: pass / safe to commit
Slice 3 - in progress with tightened prompt
```

## Codex usage constraint

Rob has limited Codex usage until June 8.

Current remaining usage at this checkpoint:

```text
62% remaining
```

Because usage is limited, future Codex work must conserve usage. Do not ask Codex for unnecessary long summaries, broad re-audits, repeated verification passes, or nonessential exploratory work.

## Prompt/receipt style change - controlling from this point forward

Codex prompts should remain:

- tightly scoped;
- tied to the committed `.MD` cleanup map;
- repo-wide by root family, not report-specific;
- limited to the mapped file cluster unless Codex proves the invariant cannot be enforced there;
- direct and short enough to avoid wasting usage.

Codex receipts should be concise. Do not ask Codex for long narrative summaries of every detail it changed unless a serious failure or ambiguous patch requires deeper explanation.

Use this compact receipt standard by default:

```text
A. Files changed
B. Audit IDs addressed
C. Exact production rule fixed
D. Tests run / pass
E. Anti-hardcode confirmation
F. Anything intentionally not touched
```

Request longer receipts only when:

- Codex changes files outside the requested scope;
- a test fails;
- a production invariant is unclear;
- a patch touches delivery/credit/SQL/lifecycle behavior;
- a patch risks weakening fail-closed behavior;
- the result is not obviously safe to commit.

## Slice 3 tightened scope

The active Slice 3 prompt was tightened to reduce Codex usage.

Controlling Slice 3 invariant:

```text
Proposed acquisition/refinance financing can be recognized as proposed/acquisition support without becoming true current debt.
```

Additional non-negotiable appraisal guard:

```text
Appraisal context may support valuation/comparable context only.
Appraisal context must never unlock current debt, current-debt DSCR, refinance, DCF, waterfall, debt-service mix, sale-proceeds, or equity-return surfaces.
```

Slice 3 scope:

```text
Audit IDs: L-18, L-21, L-22
Files:
- api/parse/parse-doc.js
- api/_lib/report-surface-contracts.js
- api/_lib/report-contract-qa.js
- api/_lib/source-report-coverage-qa.js
- related tests only
```

`api/generate-client-report.js` may be inspected only for the appraisal unlock guard and patched only if required to enforce the invariant.

## Current execution guardrails

Do not live retest yet.
Do not rerun the repo-wide audit.
Do not flip DocRaptor production mode.
Do not create public samples.
Do not change pricing/Stripe.
Do not casually patch SQL/RPC.
Do not add new API/serverless routes.
Do not hardcode 124 Richmond, filenames, job IDs, report IDs, or fixture-only values.
Do not ask Codex for broad summaries or broad audits while usage is constrained.

## Next sequence after Slice 3

After Codex returns the Slice 3 receipt:

1. Review whether Slice 3 passes using the compact receipt.
2. If pass, commit Slice 3.
3. Continue to Slice 4 - Property-tax corroborating support path.
4. Then Slice 5 - Dashboard/customer/Admin copy cleanup.
5. Then Slice 6 - Parser/source-coverage fallback rationalization.
6. Reassess before any live retest.

---

# June 2, 2026 Addendum - Repo-Wide Legacy Residue Audit Converted Into Cleanup Map

## Purpose

Record that the June 2 controlled 124 Richmond Screening + Underwriting test moved the project from "controlled live testing next" into a new cleanup-map checkpoint.

This does not mean the customer-delivery doctrine is broken. Both reports published and customer delivery was allowed. But the audit proved legacy residue still exists in live artifacts, PDF renderer/template paths, Dashboard/customer copy, worker/queue/admin metrics, parser/source coverage, tests, and sample/preview assets.

## Controlling interpretation

1. Customer-delivery doctrine:
   - materially working better;
   - valid core jobs published;
   - no needs_documents customer outcome;
   - no publication_held customer outcome;
   - no MISSING_REQUIRED_SOURCE_DATA customer failure;
   - no credit restore for section-only/support/advisory issues.

2. Remaining issue:
   - repo still contains active legacy residue and old template/render paths;
   - contradictions in artifacts are caused by legacy/fallback compatibility aliases and duplicate readiness fields still being emitted beside canonical delivery state;
   - advanced modeling / DCF / waterfall surfaces are caused by old reachable renderer/template sections and weak canonical render gates.

3. Do not run this broad audit again unless a future patch invalidates this map.
   This audit is now the working inventory.

## Cleanup map

### Slice 0 - Documentation checkpoint
- Files:
  - `!!!INVESTORIQ_MASTER_CONTEXT_CURRENT_DOCTRINE_COMPLETION_CHECKLIST_JUNE2_UPDATED_PRETEST_CHECKPOINT.md`
  - `!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_2026-06-02_UPDATED_PRETEST_CHECKPOINT.md`
- Purpose: lock this audit into docs before patching.
- Status: in progress / do first.

### Slice 1 - Delivery/artifact legacy alias cleanup
- Audit IDs: L-01, L-14, L-15, L-16, L-20, L-23, L-24, L-25 inspect-only.
- Files:
  - `api/generate-client-report.js`
  - `api/_lib/qa-action-plan.js`
  - `api/_lib/qa-fix-routing.js`
  - `api/_lib/report-contract-qa.js`
  - `api/admin-run-worker.js`
  - `api/admin/queue-metrics.js`
  - `supabase/migrations/20260214_0930_queue_job_for_processing.sql` inspect only
- Invariant:
  When canonical delivery state exists, live/new-job artifacts must not emit contradictory legacy/fallback fields as live authority.
- Target fields to remove/rename/isolate when canonical-present:
  - `readiness_source: legacy_publish_eligibility_fallback`
  - `readiness_fallback_used: true`
  - `report_blocked: true`
  - `report_publishable: false`
  - `customer_publish_eligible: false`
  - `customer_delivery_ready: false`
  - `launch_path_recommendation: user_needs_documents`
  - `customer_status_reason_code: customer_publish_not_ready`
- Disposition:
  historical compatibility may remain only if clearly isolated as non-authoritative.
- Priority: highest.

### Slice 2 - Advanced modeling / DCF / waterfall render gates
- Audit IDs: L-02, L-03, L-17, L-18, L-19.
- Files:
  - `api/generate-client-report.js`
  - `api/report-template-runtime.html`
  - `api/_lib/source-report-coverage-qa.js`
  - `api/_lib/report-surface-contracts.js`
  - `api/_lib/full-underwriting-state.js`
- Invariant:
  DCF, advanced modeling, debt-service mix, refinance, waterfall, comparables, and relative-positioning surfaces render only when canonical support exists.
- Surfaces:
  - Advanced Financial Modeling
  - Operating Expense, Debt Service, and Cash Flow Mix
  - Equity Cash Flow Waterfall
  - Initial Equity / Cash Flow / Refinance / Sale
  - DCF Framework Sensitivity Summary
  - Comparable Transaction Context
  - Relative Positioning
- Priority: highest after Slice 1.

### Slice 3 - Acquisition/current-debt/proposed-financing truth cleanup
- Audit IDs: L-18, L-21, L-22.
- Files:
  - `api/parse/parse-doc.js`
  - `api/_lib/report-surface-contracts.js`
  - `api/_lib/report-contract-qa.js`
  - `api/_lib/source-report-coverage-qa.js`
- Invariant:
  Proposed acquisition/refinance financing can be recognized as proposed/acquisition support without becoming true current debt.
- 124 Richmond source proof:
  Clean term sheet contains loan amount at purchase price, 5.85% rate, 30-year amortization, and 1.00% lender fee.
- Required behavior:
  recognize fields as proposed/acquisition support, not current outstanding debt.
- Priority: high.

### Slice 4 - Property-tax corroborating support path
- Audit IDs: L-18, L-22 support-doc/property-tax portions.
- Files:
  - `api/parse/parse-doc.js`
  - `api/_lib/report-surface-contracts.js`
  - `api/_lib/full-underwriting-state.js`
  - `api/generate-client-report.js`
  - `api/_lib/report-contract-qa.js`
- Invariant:
  A property tax document that matches the T12 tax line should render as limited corroborating support, not generic auditability-only and not modeled override.
- 124 Richmond source proof:
  Property tax bill contains 2025 Municipal Property Taxes $38,400, matching the T12 property tax line.
- Priority: high.

### Slice 5 - Dashboard/customer/Admin copy cleanup
- Audit IDs: L-10, L-11, L-12, L-24 if relevant.
- Files:
  - `src/lib/dashboardCustomerCopy.js`
  - `src/pages/Dashboard.jsx`
  - `src/pages/AdminDashboard.jsx`
  - `api/admin/queue-metrics.js`
- Invariant:
  Customer-facing status/copy must come from canonical customer state, not old job.status, old readiness aliases, needs-doc, or publication-held fallbacks.
- Must not show for core-valid jobs:
  - `needs_documents`
  - `user_needs_documents`
  - `publication_held`
  - `under_review`
  - `admin_review_required`
  - `upload more documents`
  - `source package blame`
  - `T12/Rent Roll blame when usable`
- Priority: high after Slice 1.

### Slice 6 - Parser/source-coverage fallback rationalization
- Audit IDs: L-17, L-18, L-22.
- Files:
  - `api/parse/parse-doc.js`
  - `api/_lib/source-report-coverage-qa.js`
  - `api/_lib/report-surface-contracts.js`
- Invariant:
  Parser fallback/recovery paths may recover usable deterministic core evidence, but fallback provenance cannot become live customer-blocking authority or silent financial truth.
- Nuance:
  Do not delete useful deterministic fallback blindly. Separate safe deterministic recovery from legacy fallback authority.
- Priority: medium-high.

### Slice 7 - Preview/sample/dead asset isolation
- Audit IDs: L-04, L-05, L-06, L-07, L-08, L-09, L-26, L-27, L-28.
- Files:
  - `api/report-template.html`
  - `api/html/sample-report.html`
  - `src/lib/pdfSections.js`
  - `src/lib/generatePDF.js`
  - `public/reports/sample-report.html`
  - `scripts/generate-sample-pdf.js`
  - `src/pages/SampleReport.jsx`
  - `src/components/UploadModal.jsx`
  - `src/lib/sampleReportPages.js`
- Invariant:
  Legacy sample/demo/preview paths must not feed live customer PDFs or public trust surfaces.
- Priority:
  medium/low unless proven reachable.

### Slice 8 - Test-suite doctrine split
- Files:
  - `tests/qa/qa-action-plan-smoke.js`
  - `tests/qa/delivery-decision-state-smoke.js`
  - `tests/qa/source-report-coverage-qa-smoke.js`
  - `tests/qa/admin-run-worker-gate-smoke.js`
  - `tests/qa/report-contract-qa-smoke.js`
  - `tests/qa/dashboard-customer-copy-smoke.js`
  - `tests/qa/job-failure-messaging-smoke.js`
  - `tests/qa/report-upload-gate-smoke.js`
  - `tests/qa/rent-roll-text-summary-fallback-smoke.js`
  - `tests/qa/rent-roll-alias-smoke.js`
  - `tests/qa/t12-core-summary-smoke.js`
- Invariant:
  Tests may preserve historical compatibility only when explicitly named as historical/read-only compatibility. No test should protect legacy fallback as expected live/new-job behavior.
- Priority:
  update alongside each slice, finalize after Slices 1-6.

### Slice 9 - SQL/RPC lifecycle review only
- Audit ID: L-25.
- File:
  - `supabase/migrations/20260214_0930_queue_job_for_processing.sql`
- Invariant:
  New jobs must not create or queue through needs_documents.
- Current note:
  Production Supabase was already manually fixed so active consume_purchase_and_create_job creates queued and queue_job_for_processing queues from queued.
- Disposition:
  inspect/document only unless repo source-of-truth would reintroduce old behavior.
- Priority:
  after code authority slices; no casual SQL patch.

## Recommended execution order

0. Update docs.
1. Slice 1 - Delivery/artifact legacy alias cleanup.
2. Slice 2 - Advanced modeling / DCF / waterfall render gates.
3. Slice 3 - Acquisition/current-debt/proposed-financing truth cleanup.
4. Slice 4 - Property-tax corroborating support rendering.
5. Slice 5 - Dashboard/customer/Admin copy cleanup.
6. Slice 6 - Parser/source-coverage fallback rationalization.
7. Slice 8 - Test-suite doctrine split finalization.
8. Slice 9 - SQL/RPC inspect-only source-of-truth check.
9. Slice 7 - dead/sample/preview cleanup later unless reachable sooner.

## Guardrails

- Do not patch yet from this documentation update.
- Do not run more live testing until the map is committed and the next patch slice is chosen.
- Do not flip DocRaptor.
- Do not create public samples.
- Do not change pricing/Stripe.
- Do not add new API/serverless routes.
- Do not hardcode 124 Richmond, filenames, job IDs, report IDs, or fixture-only values.
- Do not delete parser fallback blindly.
- Do not casually patch SQL/RPC.
- Do not treat customer-deliverable as Ken/public-sample ready.

## Required receipt

A. Files changed
B. Addendum title added to each file
C. Confirm all 10 slices/Slice 0-9 were recorded
D. Confirm execution order recorded
E. Confirm guardrails recorded
F. Confirm no code files changed
G. Validation: `git diff --check`

# June 2, 2026 Addendum - Pre-Test Checkpoint / Universal Report-Quality Cleanup Verified / Live Testing Next

## Current controlling status

InvestorIQ has reached the next pre-test checkpoint.

The prior live Full Underwriting run proved the core-valid customer-delivery doctrine: the job moved through the normal worker lifecycle and published instead of failing closed because of optional/support/advisory issues. The follow-up universal report-quality cleanup has now been completed and independently verified by Codex as safe to commit.

This addendum supersedes any older note saying the immediate next task is DocRaptor production mode, public sample work, or more launch-copy polishing before controlled validation. DocRaptor production mode remains intentionally deferred until after final testing confidence is established.

## Universal Report-Quality Cleanup 1 - verified complete

Codex completed the root-class patch and then ran a no-code verification. The verification returned:

```text
1. Going-in cap rate binding: Verified
2. Summary-only rent roll unit-mix collapse: Verified
3. Generic orphan heading collapse: Verified
4. Property-tax corroborating support wording: Verified
5. Explicit current debt QA recognition / acquisition separation: Verified
Blocker found: None
Commit status: safe to commit
```

This was a root-invariant cleanup, not a test-report patch.

## Root invariants now considered patched in this batch

### 1. Universal render eligibility

Status: `COMPLETE - SAFE TO COMMIT`

Rules now verified:

- no orphan headings;
- no empty tables;
- no unsupported rows;
- summary-only rent-roll evidence cannot render a misleading full unit-mix table;
- representative observations cannot become full unit-mix counts or averages;
- empty intro/heading blocks collapse generically.

### 2. Field-source binding

Status: `COMPLETE - SAFE TO COMMIT`

Rules now verified:

- going-in cap rate cannot render as acquisition interest rate;
- acquisition interest rate renders only from explicit interest-rate evidence;
- acquisition fields render only under exact source meaning;
- property-tax support that corroborates the T12 tax line renders as limited corroborating support;
- corroborating property-tax support does not override T12 totals and does not become modeled property-tax input unless a validated structured property-tax artifact exists.

### 3. QA conformance alignment

Status: `COMPLETE - SAFE TO COMMIT`

Rules now verified:

- explicit current debt support is recognized as current debt by QA/conformance;
- QA should no longer say current debt is not assessed when explicit current debt balance/rate/amortization support exists;
- acquisition/proposed financing remains separated and does not become current debt without explicit current outstanding debt evidence.

## Patch files from Codex receipt

Files changed in the universal report-quality cleanup:

- `api/generate-client-report.js`
- `api/_lib/report-surface-contracts.js`
- `api/_lib/report-contract-qa.js`
- `tests/qa/current-debt-support-routing-smoke.js`
- `tests/qa/generate-client-report-rent-roll-smoke.js`
- `tests/qa/report-contract-qa-smoke.js`

Validation reported by Codex:

- `node --check api/generate-client-report.js`
- `node --check api/_lib/report-surface-contracts.js`
- `node --check api/_lib/report-contract-qa.js`
- `node tests/qa/current-debt-support-routing-smoke.js`
- `node tests/qa/generate-client-report-rent-roll-smoke.js`
- `node tests/qa/report-contract-qa-smoke.js`
- `npm.cmd run build`
- `git diff --check`

## Production / distribution readiness status

### DocRaptor production mode

Status: `DEFERRED INTENTIONALLY`

Do not flip DocRaptor to production mode yet. The test watermark remains acceptable during controlled validation. Production mode is a distribution-readiness switch, not a report-engine correctness patch.

Flip DocRaptor only after final Screening and Underwriting controlled tests pass and the system is trusted for external/public distribution.

### Public sample files/assets

Status: `DEFER UNTIL AFTER CONTROLLED TEST OUTPUTS ARE TRUSTED`

Do not create or publish public samples from untrusted or pre-final test PDFs. Public sample assets remain a distribution task after controlled report validation.

### Website/pricing/final copy

Status: `STILL OPEN - DO AFTER CONTROLLED VALIDATION OR AS A SEPARATE LOW-RISK AUDIT`

Website/pricing copy must still be checked before launch for:

- stale pricing;
- public AI wording;
- BUY/SELL/HOLD language;
- admin-review / under-review / publication-held wording;
- misleading Underwriting availability;
- sample links/assets;
- doctrine-consistent document-driven positioning.

But this is not the next report-engine task.

## Current pre-test checklist status

```text
1. Universal render eligibility: COMPLETE / safe to commit
2. Field-source binding: COMPLETE / safe to commit
3. QA conformance alignment: COMPLETE / safe to commit
4. Production/distribution readiness: PARTIALLY DEFERRED
   - DocRaptor production mode deferred until after testing confidence
   - public samples deferred until final trusted outputs exist
   - website/pricing copy still open before launch
5. Launch smoke / controlled live testing: NEXT AFTER COMMIT
```

## Immediate next action

If the universal report-quality cleanup patch has not already been committed, commit it first.

Recommended commit message:

```text
universal report quality cleanup
```

After that, proceed to controlled live testing. Do not start DocRaptor production mode, public sample creation, pricing changes, or broad audits before the controlled tests.

## Next controlled validation sequence

Run live testing in this order:

1. one final Screening run;
2. one final Full Underwriting run;
3. Dashboard customer card review;
4. Admin artifacts/diagnostics review;
5. PDF visual review.

For each valid report, capture:

- PDF output;
- `analysis_artifacts_rows.json`;
- report lifecycle status;
- delivery gate decision;
- source-report coverage QA;
- report-contract QA;
- QA action plan;
- Dashboard customer state;
- Admin diagnostics state if relevant.

## Live testing acceptance criteria

A valid core report passes only if:

```text
- job reaches published;
- customer delivery is allowed;
- no core-valid job becomes needs_documents/user_needs_documents;
- no core-valid job becomes publication_held;
- no core-valid job produces MISSING_REQUIRED_SOURCE_DATA;
- no credit restore occurs for section-only/support/advisory issues;
- no source-package/T12/Rent Roll blame appears when core docs are valid;
- unsupported sections are omitted, collapsed, qualified, or disclosed;
- no orphan headings;
- no empty tables;
- no unsupported rows;
- no cap-rate-as-interest-rate mapping;
- property tax support is treated only according to source support;
- current debt QA aligns with explicit current debt evidence;
- acquisition/proposed financing remains separate from current debt;
- DocRaptor test watermark is accepted during testing and remains distribution-only.
```

## Do not do next

Do not:

- flip DocRaptor production mode yet;
- create public sample PDFs yet;
- patch public sample links before final trusted outputs exist unless the task is audit-only;
- do broad audits;
- touch SQL/RPC lifecycle again unless a live test exposes a new blocker;
- change pricing/Stripe before controlled validation;
- update website launch copy before the next testing checkpoint unless explicitly chosen.

## Fresh continuation point

Resume from here with controlled live testing after the universal report-quality cleanup patch is committed.


---

# June 2, 2026 Addendum - LIVE UNDERWRITING PASS / SQL Needs-Documents Extinction / Ken Red-Pen Follow-Up

## Current controlling status

The stop-the-line core-valid failure path campaign has produced the first successful controlled Full Underwriting live retest after the legacy fallback/`needs_documents` failure chain was fixed.

The live retest **Final Motherload underwriting 12** published successfully.

This supersedes the prior "do not live retest" checkpoint. The controlled live retest has now run and passed for ordinary customer delivery.

## What changed immediately before the live pass

The final blocker was not only JavaScript delivery/copy logic. Production Supabase still had the old lifecycle functions active:

```text
consume_purchase_and_create_job created new jobs as `needs_documents`.
queue_job_for_processing only allowed queueing from `needs_documents`.
```

Production SQL was manually updated in Supabase so that:

```text
consume_purchase_and_create_job now creates new jobs as `queued`.
queue_job_for_processing now accepts only `queued`.
```

Verification query confirmed the active production functions now contain:

```text
consume_purchase_and_create_job:
- inserts status = 'queued'
- no longer creates status = 'needs_documents'

queue_job_for_processing:
- requires v_prev_status = 'queued'
- updates only rows where status = 'queued'
- no longer depends on status = 'needs_documents'
```

A follow-up production check returned zero rows for `analysis_jobs` statuses containing `needs`.

## Live Underwriting retest result

Report:

```text
Final Motherload underwriting 12
Job ID: da6c521a-a986-48d1-ba2f-7b8e30d6dee4
Report ID: 82a5f30b-1649-4ec6-a931-7e40d7228067
Result: PUBLISHED
```

Observed status path:

```text
queued -> extracting -> underwriting -> scoring -> rendering -> pdf_generating -> publishing -> published
```

The report-published email artifact was created.

This proves the old live failure chain no longer forced this core-valid Underwriting job into:

```text
needs_documents
user_needs_documents
publication_held
MISSING_REQUIRED_SOURCE_DATA
credit_restore_required
entitlement_restored
source-package / Rent Roll / T12 customer blame
```

## Core source values confirmed in the live PDF

T12 source values:

```text
Effective Gross Income: $1,036,800
Operating Expenses: $425,000
NOI: $611,800
Expense Ratio: 41.0%
NOI Margin: 59.0%
```

Rent Roll source values:

```text
48 units
46 occupied
2 vacant
Occupancy: 95.83%
Annual In-Place Rent: $1,036,800
Annual Market Rent: $1,137,600
Annual Gross Rent Upside: $100,800
```

Debt source values:

```text
Outstanding Balance: $8,750,000
Interest Rate: 5.25%
Amortization: 30 years
LTV: 70%
```

Live PDF rendered:

```text
Review - Debt Coverage Constraint
DSCR: 1.06x
Outstanding Balance: $8,750,000
Interest Rate: 5.25%
Monthly P&I: $48,318
Amortization: 30 years
```

Math check:

```text
Monthly P&I on $8,750,000 at 5.25%, 30-year amortization ≈ $48,318
Annual debt service ≈ $579,814
DSCR = $611,800 / $579,814 ≈ 1.06x
```

The classification `Review - Debt Coverage Constraint` is directionally correct because current debt DSCR is below 1.25x.

## Data Coverage / support-doc treatment result

The report correctly displayed:

```text
CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Verified.
```

Document treatment was mostly correct:

```text
Modeled Inputs:
- T12
- Rent Roll
- Structured current debt input

Displayed / Limited Use:
- CapEx / renovation support displayed for context only
- Purchase assumptions context only

Listed but Not Quantitatively Modeled:
- Broker email
- Market survey
- Property tax bill
- Phase I ESA / environmental due diligence
- Unsupported appraisal summary
```

This confirms optional/support/advisory/distribution issues did not block ordinary customer delivery.

## Internal artifact caveat

The job published, but internal artifacts still contain stale/conflicting legacy metadata that must be cleaned later.

Examples observed:

```text
readiness_source: legacy_publish_eligibility_fallback
readiness_fallback_used: true
report_publishable: false
customer_publish_eligible: false
launch_path_recommendation: user_needs_documents
```

At the same time, the canonical customer state correctly said:

```text
delivery_gate_status: deliverable
customer_status_label: ready
customer_delivery_allowed: true
hold_delivery: false
credit_restore_required: false
fail_closed_reason_code: null
user_needs_documents: false
admin_review_required: false
```

Interpretation:

```text
Customer outcome path: PASS
Internal artifact hygiene: still needs cleanup
```

Do not treat contradictory legacy artifact aliases as customer-delivery authority if canonical state and real lifecycle prove publication.

## OpenAI/provider advisory result

OpenAI quota/provider failures still occurred:

```text
provider_error_class: insufficient_quota
provider_response_status: 429
```

They were correctly diagnostic/advisory only and did not block deterministic customer delivery because deterministic core artifacts validated.

Status:

```text
CVF-14: safe internal/distribution-only in this live test, but OpenAI quota remains a launch-readiness/config item.
```

## Ken Dunn red-pen result

A Ken Dunn / public-sample red-pen review was performed against the PDF and uploaded source documents.

Verdict:

```text
Customer-deliverable: YES
Ken/public-sample ready: NO, not yet
Math integrity: Mostly PASS
Report optics / QA artifacts: YELLOW
```

### Math pass items

- T12 EGI / OpEx / NOI reconcile.
- Expense ratio and NOI margin reconcile.
- Rent Roll occupancy and annual rent totals reconcile.
- Rent upside value sensitivity reconciles.
- Debt monthly P&I and DSCR reconcile.
- Cap-rate value indications reconcile.
- Purchase price / going-in cap math reconciles.

### Red-pen blockers before Ken/public-sample use

1. **DocRaptor test watermark**
   - PDF still shows test-mode watermark / test document marks.
   - This blocks public/Ken/sample distribution, not ordinary customer delivery.

2. **Acquisition section label error**
   - Source provides purchase price and going-in cap rate.
   - Report appears to display `Interest Rate 5.75%` in the acquisition context even though the source says `Going-In Cap Rate 5.75%`.
   - Fix: remove acquisition `Interest Rate` unless source explicitly provides an acquisition interest rate; keep `Going-In Cap Rate`.

3. **Internal QA current-debt canonical drift**
   - QA artifacts still say current debt was fallback/not-assessed/acquisition-only even though parsed debt artifact contains $8.75M true current debt and the PDF renders the correct debt math.
   - Fix internal canonical debt QA threading so it recognizes valid current debt.

4. **Empty / weak sections**
   - Some advanced modeling headings appear empty or underfilled.
   - Collapse headings when no meaningful content is rendered.

5. **Unit mix table under-rendering**
   - Source rent roll is summary/narrative with representative units, not a complete standard unit table.
   - Report should collapse or clearly qualify empty-looking unit mix surfaces instead of rendering weak/empty table framing.

6. **Property tax support treatment polish**
   - Property tax source supports the T12 tax line but is listed as not quantitatively modeled.
   - Better label: supports T12 property tax line; not used to override T12 totals.

## CVF status update after live pass

Update the Core-Valid Failure Path families as follows:

```text
CVF-01 Core T12 parse failure:
- legitimate fail path preserved
- live test confirmed valid T12 publishes

CVF-02 Core Rent Roll parse failure:
- legitimate fail path preserved
- live test confirmed valid Rent Roll publishes

CVF-03 Financial scale mismatch:
- no scale mismatch in this live test
- remains legitimate only if truly unreconcilable

CVF-04 Current-debt/refi render-contract drift:
- ordinary customer delivery no longer blocked
- live-confirmed publish
- still needs internal QA canonical debt cleanup before Ken/public-sample readiness

CVF-05 Report-type section leak:
- ordinary customer delivery no longer blocked
- remaining issue is internal/public-sample blocker cleanup if labels/headings are weak

CVF-06 Source reconciliation/rendered variance drift:
- ordinary customer delivery no longer blocked
- Data Coverage core headline passed

CVF-07 Optional/full-underwriting support constraints:
- live-confirmed ordinary customer delivery allowed
- optional support constraints stayed internal/distribution/section-level

CVF-08 Delivery-gate hold-chain / legacy needs-doc conversion:
- live-confirmed fixed for this path
- SQL active lifecycle no longer creates or queues new jobs through needs_documents

CVF-09 Generator publication-held shim:
- live-confirmed no publication_held customer failure

CVF-10 Worker terminal failure / credit restore misclassification:
- live-confirmed no MISSING_REQUIRED_SOURCE_DATA / no credit restore on core-valid job

CVF-11 Failure message builder source-package/rent-roll blame:
- live-confirmed no customer document-blame failure path in this retest

CVF-12 Dashboard customer status/copy fallback:
- live-confirmed report published; keep monitoring Dashboard display

CVF-13 Runtime/storage/PDF/catastrophic render failure:
- legitimate fail path preserved; not triggered

CVF-14 OpenAI/provider/advisory failures:
- live-confirmed diagnostic-only; quota issue did not block

CVF-15 Optional-support/source-package/admin ops paths:
- live-confirmed optional/support degradation did not block ordinary customer delivery
```

## Current launch-readiness interpretation

This live retest is a major breakthrough but does not make the PDF Ken/public-sample ready.

Correct interpretation:

```text
Underwriting engine customer-delivery pass: YES
Full Underwriting ordinary customer doctrine: materially live-confirmed for this scenario
Ken/public-sample readiness: one cleanup batch away
DocRaptor production mode: still required for external distribution
Internal artifact hygiene: still required
```

## Recommended next work after this documentation checkpoint

Do not start another broad hardening campaign immediately unless needed.

Next recommended sequence:

1. Commit/update this documentation checkpoint.
2. Take a short pause / fresh chat.
3. Run a focused Ken-readiness cleanup batch:
   - acquisition cap-rate vs interest-rate label fix;
   - collapse empty/weak advanced modeling headings;
   - summary-only unit mix table qualification/collapse;
   - property-tax support treatment wording polish;
   - internal current-debt canonical QA artifact cleanup;
   - DocRaptor production/public-sample config kept separate.
4. After cleanup, regenerate one Underwriting PDF and run Ken red-pen again.
5. Only then consider external/public/Ken sample distribution.

## Fresh continuation point

We resume after:

```text
Final Motherload underwriting 12 published successfully.
SQL needs_documents live lifecycle was removed.
Core-valid Underwriting doctrine passed live.
Ken red-pen found math mostly correct but public-sample blockers remain.
```

Next decision:

```text
Start focused Ken-readiness cleanup batch, not broad doctrine rework.
```

---

# June 2, 2026 Addendum - STOP-THE-LINE Legacy Fallback Extinction Plan / Exact Fix Sequence

## Current controlling status - audit failed

Codex's STOP-THE-LINE legacy fallback audit failed the repo.

This supersedes any prior comfort language that the Publish-or-Fail Doctrine Lock, G8, or doctrine-completion sequence was fully closed for Full Underwriting launch purposes.

The problem is now defined precisely:

```text
Legacy fallback is still capable of live/new-job delivery authority.
```

This is not a wording issue.
This is not a Dashboard-only issue.
This is not one more current-debt/refi rendering bug.

It is a live authority-chain failure where old fallback logic can still convert a core-valid Underwriting report into:

- `legacy_publish_eligibility_fallback`
- `user_needs_documents`
- `hold_delivery: true`
- `credit_restore_required: true`
- `publication_held`
- `MISSING_REQUIRED_SOURCE_DATA`
- entitlement restore / credit restore
- source-package / Rent Roll / additional-documents blame copy

## Live failure evidence that controls this ledger

The failed Full Underwriting job had valid required core evidence:

```text
Job ID: 2b7f6a46-c2f5-4c79-a023-90fd02201a51

T12:
- parsed/validated
- EGI: 1,036,800
- OpEx: 425,000
- NOI: 611,800
- core_t12_validation.ok: true

Rent Roll:
- parsed/validated
- 48 units
- 46 occupied
- 2 vacant
- occupancy: 95.83%
- in-place annual rent: 1,036,800
- market annual rent: 1,137,600
- validated: true
```

Yet the job failed through the old fallback chain:

```text
readiness_source: legacy_publish_eligibility_fallback
delivery_gate_status: user_needs_documents
hold_delivery: true
credit_restore_required: true
fail_closed_reason_code: CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT
error_code: MISSING_REQUIRED_SOURCE_DATA
```

Dashboard/customer copy then blamed source package / Rent Roll / `market_rent_survey_unstructured_source.txt`, even though the real required Rent Roll was valid.

This proves the launch blocker is:

```text
CORE-VALID DELIVERY AUTHORITY IS STILL NOT SINGLE-SOURCE.
```

## Non-negotiable doctrine from this point forward

There must be exactly one live customer delivery authority for new jobs:

```text
canonical delivery decision/state
```

Legacy fallback must not decide, override, synthesize, or influence any of the following for new/live jobs:

- generation response
- report artifact delivery status
- delivery gate status
- canonical delivery state
- hold/fail status
- worker terminal status
- credit restore / entitlement restore
- customer-facing status
- customer-facing failure copy
- Dashboard failed-state guidance
- SQL/RPC job lifecycle state
- test expectations for live delivery doctrine

Legacy compatibility may exist only as historical/read-only display support for old completed jobs, and only if it cannot affect new/live job delivery.

## Exact live failure chain from Codex audit

Codex mapped the live Underwriting failure chain as follows:

1. `api/generate-client-report.js`
   - around `10199`, `10561`, `10651`, `10710`
   - produces and threads:
     - `source_report_coverage_qa`
     - `report_contract_qa`
     - `qa_action_plan`
   - then calls `buildDeliveryGateDecision`.

2. `api/_lib/source-report-coverage-qa.js`
   - around `592`, `637`, `655`
   - can still mark `legacy_fallback_active: true` when canonical coverage/debt authority is incomplete.

3. `api/_lib/report-surface-contracts.js`
   - around `1286`, `1303`, `1312`, `1410`
   - can classify loan-term/current-debt evidence as:
     - `acquisition_only_not_current_debt`
     - `not_assessed`
   - instead of true current debt even when explicit current debt support exists.

4. `api/_lib/report-contract-qa.js`
   - around `1340`, `1831`, `2314`, `2397`, `2800`
   - can flag current-debt/refi drift and report-type leaks as customer-blocking violations.

5. `api/_lib/qa-action-plan.js`
   - around `1497`, `2194`, `2224`, `2339`, `2344`
   - falls back to `legacy_publish_eligibility_fallback`
   - produces:
     - `user_needs_documents`
     - `hold_delivery: true`
     - `credit_restore_required: true`.

6. `api/generate-client-report.js`
   - around `10745`, `10755`, `10776`
   - turns the hold into:
     - `publication_held`
     - compatibility aliases in the live response.

7. `api/admin-run-worker.js`
   - around `2333`, `2393`, `2402`, `2415`
   - maps the hold to:
     - `MISSING_REQUIRED_SOURCE_DATA`
     - entitlement restore / credit restore.

8. Customer copy surfaces:
   - `src/lib/jobFailureMessaging.js` around `37`, `86`, `95`
   - `src/lib/dashboardCustomerCopy.js` around `5`, `27`, `68`
   - `src/pages/Dashboard.jsx` around `1041`, `1130`
   - surface source-package / Rent Roll / additional-documents blame.

## STOP-THE-LINE rule

Do not run another live Underwriting retest until the live authority chain is fixed.

Do not patch Dashboard copy first.
Do not patch only current-debt/refi rendering first.
Do not patch only tests.
Do not accept "legacy fallback only" language unless Codex proves it is impossible for that fallback to affect new/live jobs.

The next work is deletion/demotion of live fallback authority.

## New active campaign name and filename

This ledger should now be treated as the active launch-blocker campaign file:

```text
!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_2026-06-02.md
```

The old longer filename with `DOCTRINE_COMPLETION_CHECKLIST` can remain historical, but going forward the shorter filename is the working ledger name.

## Exact fix sequence to finally fix the system

### Slice 1 - Delete legacy fallback live delivery authority for new jobs

**Purpose:** stop the delivery chain from turning core-valid section-only issues into whole-report failure.

**Files:**

- `api/_lib/qa-action-plan.js`
- `api/generate-client-report.js`
- `api/admin-run-worker.js`

**Audit-hit symbols / regions:**

- `legacy_publish_eligibility_fallback`
- `legacy_action_plan_fallback`
- `readiness_fallback_used`
- `readiness_source`
- `legacy_readiness_aliases`
- `hold_delivery`
- `holdDelivery`
- `credit_restore_required`
- `fail_closed_reason_code`
- `publication_held`
- `user_needs_documents`
- `MISSING_REQUIRED_SOURCE_DATA`
- `buildDeliveryResponseCompatibilityAliases`
- worker hold/fail/restore mapping

**Required production invariant:**

```text
For new/live jobs, if required core T12 + Rent Roll are valid, section-only or non-core issues cannot produce:
- user_needs_documents
- needs_documents
- publication_held
- MISSING_REQUIRED_SOURCE_DATA
- hold_delivery true
- credit_restore_required true
- entitlement_restored
```

**Allowed whole-report failures after Slice 1:**

- true missing/unusable/unvalidated required T12;
- true missing/unusable/unvalidated required Rent Roll;
- true runtime/storage/PDF/catastrophic generation failure.

**Tests to update/add:**

- `tests/qa/qa-action-plan-smoke.js`
- `tests/qa/delivery-decision-state-smoke.js`
- `tests/qa/admin-run-worker-gate-smoke.js`

**Required proof:**

1. Core-valid Underwriting + current-debt/refi drift remains customer-deliverable at the delivery layer.
2. Core-valid report-type section leak remains customer-deliverable at the delivery layer.
3. Core-valid source-reconciliation/rendered variance drift remains customer-deliverable at the delivery layer.
4. Missing/unusable T12 still fail-closes + restores credit.
5. Missing/unusable Rent Roll still fail-closes + restores credit.
6. Runtime/PDF/storage fatal still fail-closes + restores credit.
7. Legacy compatibility tests are split from live-job doctrine tests.

**Status:** `OPEN - DO FIRST`

---

### Slice 2 - Demote source coverage / surface-contract fallback catalysts

**Purpose:** stop fallback-backed coverage/debt state from feeding downstream live blocker decisions.

**Files:**

- `api/_lib/source-report-coverage-qa.js`
- `api/_lib/report-surface-contracts.js`

**Audit-hit symbols / regions:**

- `canonicalCoverageAuthorityPresent`
- `canonicalDebtAcquisitionAuthorityPresent`
- `legacy_fallback_active`
- `acquisition_only_not_current_debt`
- `current_debt_dscr_status`
- `validated_supported`
- current-debt/refi source gating
- debt/acquisition fallback authority paths

**Required production invariant:**

```text
For new/live jobs, source-report coverage and report-surface contracts may emit diagnostics/conformance findings, but fallback-backed or incomplete canonical evidence cannot become live customer-delivery authority.
```

**Specific live defect to address:**

The system had explicit current debt support:

```text
loan_terms_simple_source.txt
outstanding_balance: 8,750,000
interest_rate: 5.25%
amort_years: 30
debt_basis: existing_mortgage_debt
```

Yet downstream QA treated canonical current debt as fallback-inferred / not-assessed / acquisition-only-not-current-debt.

Slice 2 must prove that explicit current debt evidence is threaded as current debt where valid, and that fallback/incomplete state is not promoted into a customer blocker where core docs are valid.

**Tests to update/add:**

- `tests/qa/source-report-coverage-qa-smoke.js`
- current-debt/source-coverage smoke if existing
- focused regression for explicit non-acquisition current debt support

**Required proof:**

1. `legacy_fallback_active` may exist only as internal diagnostic/historical signal.
2. It cannot feed customer delivery, hold, fail-closed, or credit restore.
3. Explicit current debt support is not misrouted as acquisition-only.
4. Ambiguous debt still collapses/qualifies debt/refi sections rather than failing the report.
5. No report-specific filenames, property names, or job IDs are hardcoded.

**Status:** `OPEN - DO SECOND`

---

### Slice 3 - Convert report-contract QA blockers into section diagnostics for core-valid jobs

**Purpose:** stop rendered-section QA findings from killing core-valid reports.

**Files:**

- `api/_lib/report-contract-qa.js`
- possibly `api/generate-client-report.js` only where delivery consumption must ignore/demote section-only QA blockers

**Audit-hit symbols / regions:**

- `CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT`
- `CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT`
- `UNSUPPORTED_CURRENT_DEBT_RENDERED`
- `UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED`
- `REPORT_TYPE_SECTION_LEAK`
- `SCREENING_UNDERWRITING_SECTION_LEAK`
- `RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH`
- `legacy_fallback_only`

**Required production invariant:**

```text
For core-valid jobs, report-contract QA detects unsafe rendered surfaces, but section-contained/current-debt/refi/report-type/source-reconciliation findings must trigger collapse/omit/qualify/sanitize behavior or diagnostics - not whole-report failure.
```

**Important safety rule:**

Do not loosen QA so unsafe debt/refi surfaces publish.
The fix is not "ignore the violation."
The fix is:

```text
detect -> self-heal/collapse/omit/qualify -> publish safe core-valid report
```

**Tests to update/add:**

- `tests/qa/report-contract-qa-smoke.js`
- targeted rendered-contract smoke for:
  - current-debt/refi drift
  - report-type section leak
  - source reconciliation/rendered variance drift

**Required proof:**

1. Current-debt/refi QA drift does not block customer delivery when T12 + Rent Roll are valid.
2. Report-type section leak does not block customer delivery when T12 + Rent Roll are valid.
3. Source reconciliation/rendered variance drift does not block customer delivery when T12 + Rent Roll are valid.
4. Unsafe sections are not published as unsafe surfaces.
5. QA remains conformance/diagnostics, not primary business-truth authority.

**Status:** `OPEN - DO THIRD`

---

### Slice 4 - Customer copy and Dashboard fallback demotion

**Purpose:** stop legacy error-code/copy fallbacks from blaming usable documents.

**Files:**

- `src/lib/jobFailureMessaging.js`
- `src/lib/dashboardCustomerCopy.js`
- `src/pages/Dashboard.jsx`

**Audit-hit symbols / regions:**

- `classifyMissingDocumentCategory`
- `classifyFailure`
- `MISSING_REQUIRED_SOURCE_DATA`
- legacy document-blame regex
- status normalization
- failed guidance
- source-package / T12 / Rent Roll / additional-documents copy

**Required production invariant:**

```text
Customer copy can blame T12 or Rent Roll only when the required core document is truly missing/unusable/unvalidated.
```

For core-valid jobs, customer copy must never blame:

- T12;
- Rent Roll;
- source package;
- additional documents;
- market survey;
- support docs;
- source package insufficiency.

**Allowed historical behavior:**

Old completed reports may keep read-only legacy display compatibility, but only when there is no canonical customer message and no new/live delivery decision involved.

**Tests to update/add:**

- `tests/qa/dashboard-customer-copy-smoke.js`
- `tests/qa/job-failure-messaging-smoke.js`

**Required proof:**

1. `MISSING_REQUIRED_SOURCE_DATA` copy appears only for true core-invalid cases.
2. Core-valid section-only failures never display source-package/Rent Roll/additional-documents blame.
3. Dashboard uses canonical customer status/message for new jobs.
4. Historical fallback display is isolated and cannot become live authority.

**Status:** `OPEN - DO FOURTH`

---

### Slice 5 - SQL/RPC lifecycle legacy `needs_documents` removal for new jobs

**Purpose:** remove old lifecycle-state dependency from new job intake/queue functions.

**Files:**

- `supabase/migrations/20260210100140_consume_purchase_and_create_job.sql`
- `supabase/migrations/20260214_0930_queue_job_for_processing.sql`
- any current active SQL/RPC definition that still creates or queues new jobs through `needs_documents`

**Audit-hit states:**

- `needs_documents`
- legacy intake lifecycle
- legacy queue lifecycle

**Required production invariant:**

```text
New jobs must not enter or queue through a legacy needs_documents lifecycle state.
```

**Important caution:**

Do not casually break existing deployed Supabase functions.
Codex must first identify whether these migration files are historical-only or whether their function definitions are still active in production.

**Required proof:**

1. Active create-job / queue-job SQL paths do not require `needs_documents` for new jobs.
2. New jobs move through normal processing states or fail closed only for true invalid core/runtime failure.
3. If migration files are historical-only, document the active production function definition and patch the active source of truth if present.
4. No database destructive migration without explicit review.

**Status:** `OPEN - DO FIFTH AFTER CODE AUTHORITY SLICES`

---

### Slice 6 - Test-suite doctrine split: live behavior vs historical compatibility

**Purpose:** stop tests from preserving legacy fallback as expected live behavior.

**Files called out by audit:**

- `tests/qa/qa-action-plan-smoke.js`
- `tests/qa/delivery-decision-state-smoke.js`
- `tests/qa/source-report-coverage-qa-smoke.js`
- `tests/qa/admin-run-worker-gate-smoke.js`
- `tests/qa/report-contract-qa-smoke.js`
- `tests/qa/generate-client-report-rent-roll-smoke.js`
- `tests/qa/dashboard-customer-copy-smoke.js`
- `tests/qa/job-failure-messaging-smoke.js`

**Required production invariant:**

```text
No test may assert legacy fallback as the expected live/new-job delivery behavior.
```

**Allowed test category:**

Historical compatibility tests may remain only when explicitly named/scoped as old-report read-only compatibility and when they prove no live delivery authority.

**Required proof:**

1. Live/new-job tests assert canonical delivery authority only.
2. Historical compatibility tests are isolated and cannot be mistaken for live doctrine.
3. At least one end-to-end regression proves:
   - core-valid Underwriting + current-debt/refi drift + report-type leak => publishable;
   - no legacy fallback authority;
   - no `user_needs_documents`;
   - no `publication_held`;
   - no `MISSING_REQUIRED_SOURCE_DATA`;
   - no credit restore.

**Status:** `OPEN - DO ALONGSIDE SLICES 1-5, FINALIZE AFTER SLICE 5`

---

## Patch order is mandatory

Use this order:

1. Slice 1 - `qa-action-plan.js` / `generate-client-report.js` / `admin-run-worker.js`
2. Slice 2 - `source-report-coverage-qa.js` / `report-surface-contracts.js`
3. Slice 3 - `report-contract-qa.js` + section self-heal/demotion path
4. Slice 4 - customer copy / Dashboard fallback demotion
5. Slice 5 - SQL/RPC lifecycle cleanup
6. Slice 6 - test-suite doctrine split and final full audit

Do not reorder unless Codex proves a dependency requires it.

## Updated launch gate

Full Underwriting does not return to live retesting until all of the following are true:

```text
1. Legacy fallback cannot affect new/live job delivery.
2. Core-valid jobs cannot become user_needs_documents.
3. Core-valid jobs cannot become publication_held.
4. Core-valid jobs cannot become MISSING_REQUIRED_SOURCE_DATA.
5. Core-valid section-only issues cannot restore credit.
6. Dashboard/failure copy cannot blame usable T12 or Rent Roll.
7. Unsafe debt/refi/report-type/source-reconciliation surfaces are self-healed/collapsed/omitted/qualified.
8. Historical compatibility is isolated from live delivery doctrine.
9. Tests prove the above with at least one core-valid Underwriting regression.
```

## Codex receipt standard for every extinction slice

Every Codex receipt must include:

- A. Files changed
- B. Audit-hit symbols/line regions addressed
- C. Exact legacy live-authority path deleted/demoted
- D. How new/live jobs are distinguished from old historical compatibility
- E. Proof core-valid jobs cannot produce:
  - `user_needs_documents`
  - `publication_held`
  - `MISSING_REQUIRED_SOURCE_DATA`
  - `credit_restore_required`
  - entitlement restore
- F. Proof true core-invalid/runtime-fatal failures still fail closed + restore credit
- G. Tests updated/added
- H. Validation commands run
- I. Anti-hardcode proof
- J. Anything intentionally not touched
- K. Remaining fallback audit items

## Fresh continuation point

Next action: give Codex Slice 1 only.

Do not live retest.
Do not patch Dashboard first.
Do not patch current-debt rendering first.
Do not update pricing/launch copy.
Do not work on DocRaptor production mode.
Do not rotate secrets.
Do not start public sample work.

The only next goal is:

```text
DELETE / DEMOTE LEGACY FALLBACK LIVE DELIVERY AUTHORITY FOR NEW JOBS.
```

---

# June 2, 2026 Addendum - Doctrine Completion Checklist / Remaining Work To Make InvestorIQ Obey Doctrine End-to-End

## Current controlling decision

Yes: update the `.MD` files before this gets lost.

The P0 Core-Valid Failure Path families were closed by Slices 1-3, but InvestorIQ should not stop at "P0 closed" while known P1 doctrine edges remain mapped. The next work is doctrine-completion hardening, not random patching.

## Current doctrine target

InvestorIQ must obey this end-to-end:

```text
Bad uploads cannot generate.
Valid core jobs publish.
Unsupported sections self-heal.
Worker cannot resurrect old fail states.
Dashboard cannot blame usable docs.
Support/advisory/distribution issues stay internal.
Only true core failure or true runtime/PDF/storage failure can kill the report.
```

## Remaining work sequence from this checkpoint

### 1. Doctrine-completion patch: hard upload/server gate + P1 CVF cleanup

Patch before live retest:

- Screening Generate gate:
  - require valid/usable T12;
  - require valid/usable Rent Roll.
- Underwriting Generate gate:
  - require valid/usable T12;
  - require valid/usable Rent Roll;
  - require at least one supporting/deal document outside the required core docs.
- Server-side generate gate:
  - re-check the same rule so UI bypass cannot generate invalid jobs;
  - reject before report generation and before credit consumption wherever safely possible;
  - do not create failed-report lifecycle limbo for attempts that never satisfied the upload gate.
- CVF-07 cleanup:
  - optional/full-underwriting support-depth constraints must stay internal/distribution-only or section-level;
  - they must not block ordinary customer delivery when `core_valid_required_coverage === true`.
- CVF-15 cleanup:
  - optional-support/source-package/admin-op paths must stay diagnostic/internal/distribution-only;
  - they must not feed customer lifecycle, fail closed, or restore credit for core-valid jobs.

Important support-doc nuance:

```text
For Underwriting, at least one support doc is required to start generation.
But support docs are not quantitatively mandatory after that.
Bad or unsupported support docs after the gate is satisfied are section-level/internal/distribution-only issues.
They must not become required-core blockers once T12 + Rent Roll are valid.
```

### 2. Final no-code doctrine closure audit

After the doctrine-completion patch passes, run an audit-only confirmation.

Audit must prove:

- CVF-07 is closed or safe internal/distribution-only;
- CVF-15 is closed or safe internal/distribution-only;
- upload/server gate is enforced for Screening and Underwriting;
- `core_valid_required_coverage === true` cannot be overridden by optional/support/advisory/distribution issues;
- no known non-legitimate CVF remains open before live retest.

No code changes during this audit unless a real remaining P0/P1 doctrine edge is found.

### 3. Controlled live retests

Run in this order:

1. valid Screening job with T12 + Rent Roll;
2. valid Underwriting job with T12 + Rent Roll + support doc;
3. deliberate invalid-core case;
4. optional deliberate runtime/PDF/system failure case only if safe.

Live retest must prove:

- valid core jobs publish;
- invalid core docs fail closed or are blocked at the gate;
- runtime fatal shows neutral system-failure copy;
- no core-valid job shows source-package/rent-roll/missing-doc blame;
- no unsupported debt/refi/report-type surfaces leak into the PDF.

### 4. Artifact and PDF inspection after live tests

For valid Screening and Underwriting jobs, confirm artifacts show:

```text
core_valid_required_coverage: true
customer_delivery_allowed: true
hold_delivery: false
delivery_gate_status: deliverable / ready
no MISSING_REQUIRED_SOURCE_DATA
no entitlement_restored
no user_needs_documents customer lifecycle
no publication_held customer lifecycle
```

PDF inspection must confirm:

- no unsupported Current Debt DSCR leak;
- no unsupported refinance stress/proceeds table leak;
- no wrong report-type section leak;
- unsupported sections are omitted, qualified, disclosed, or Not Assessed.

### 5. Ledger/master-context update after live retest

If live retest passes, update statuses:

- `CVF-01`, `CVF-02`, `CVF-03`, `CVF-13` = legitimate failure paths preserved;
- `CVF-04`, `CVF-05`, `CVF-06` = closed + live-confirmed;
- `CVF-07` = closed or safe internal/distribution-only after doctrine-completion patch;
- `CVF-08`, `CVF-09`, `CVF-10` = closed + live-confirmed;
- `CVF-11`, `CVF-12` = closed + live-confirmed;
- `CVF-14` = safe internal/distribution-only;
- `CVF-15` = closed or safe internal/distribution-only after doctrine-completion patch.

### 6. Final public/customer polish sweep

Only after doctrine behavior is proven:

- replace contraction wording where touched, especially `You'll` -> `You will`;
- verify no customer-visible admin-review / under-review / publication-held wording;
- verify no stale upload-clearer-docs copy except true invalid core-doc cases;
- verify no weird report labels, unresolved tokens, mojibake, stale N/A blocks, public AI wording, or BUY/SELL/HOLD language;
- resolve DocRaptor production/public-sample distribution readiness separately from ordinary customer delivery.

### 7. Launch-readiness smoke

Final short run:

- `npm run build`;
- all targeted QA smokes touched by the doctrine-completion sequence;
- one Screening report;
- one Underwriting report;
- Dashboard customer card review;
- Admin artifacts/diagnostics review;
- PDF visual review.

## Definition of Done

InvestorIQ obeys doctrine when all of the following are true:

```text
1. Bad uploads cannot start generation.
2. Valid T12 + Rent Roll jobs publish.
3. Underwriting requires at least one support doc to start, but optional/support docs cannot later kill a core-valid report.
4. Unsupported current-debt/refi/report-type/support sections self-heal before delivery.
5. Worker cannot map core-valid section/support/advisory issues to MISSING_REQUIRED_SOURCE_DATA or entitlement restore.
6. Dashboard and failure-message copy cannot blame usable core docs.
7. Public-sample/high-value/DocRaptor/OpenAI/advisory issues stay internal or distribution-only.
8. Only true core failure or true runtime/storage/PDF/catastrophic failure can kill the whole report.
```

## Immediate next action

Give Codex the doctrine-completion patch prompt:

```text
Hard upload/server gate + remaining P1 CVF-07/CVF-15 cleanup.
```

Do not run controlled live retest until that patch and the follow-up no-code closure audit pass.

---

# June 2, 2026 Addendum - Core-Valid Failure Path Families Ledger / 15 P0-P1 Paths To Destroy

## Current controlling status

This addendum supersedes the earlier comfort language that the Publish-or-Fail Doctrine Lock was fully closed for launch purposes.

A live controlled Full Underwriting test proved that the system can still fail a whole report even after required core documents are valid:

- T12 parsed successfully.
- Rent Roll parsed successfully.
- Core T12 validation passed.
- Core Rent Roll validation passed.
- Additional support documents were available.
- The job still failed closed.
- Customer-facing copy incorrectly blamed source package / rent roll verification.
- Actual blocker class was section/render-contract drift, especially current-debt/refi surfaces.

Therefore the new controlling ledger target is:

```text
CORE-VALID REPORTS MUST PUBLISH.

If T12 + Rent Roll are parsed/validated, the report must publish unless there is:
1. true missing/unusable/unvalidated required T12;
2. true missing/unusable/unvalidated required Rent Roll;
3. true runtime/storage/PDF generation failure;
4. catastrophic render failure where no safe report shell can be produced.

Everything else must fail closed only at the section/line/surface level:
collapse, omit, qualify, mark Not Assessed, disclose, and emit diagnostics.
```

## New ledger name / working campaign name

Rename this active ledger/campaign from general Decision-Source Elimination to:

```text
InvestorIQ Core-Valid Failure Path Family Ledger
```

Suggested filename going forward:

```text
!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_2026-06-02.md
```

The original decision-source ledger remains historical/contextual, but the active launch blocker campaign is now the **15 Core-Valid Failure Path Families** below.

## Non-negotiable launch invariant

When `core_valid === true`:

- no customer-facing `user_needs_documents`;
- no customer-facing `needs_documents`;
- no customer-facing `publication_held`;
- no `MISSING_REQUIRED_SOURCE_DATA` for section-only/non-core issues;
- no whole-report fail for section-contained issues;
- no source-package/rent-roll/additional-documents blame copy;
- no entitlement restore for section-only/non-core/support-doc/public-sample/advisory issues;
- public-sample/high-value/DocRaptor/OpenAI/advisory blockers are distribution/internal metadata only;
- optional/support document parse failures cannot become failed required-core blockers;
- unsafe sections must not publish as unsafe surfaces; they must collapse/omit/qualify before delivery.

## 15 Core-Valid Failure Path Families

| Family | Files / functions from audit | Trigger / reason class | Scope | Current risk | Correct doctrine outcome | Priority |
|---|---|---|---|---|---|---|
| CVF-01 Core T12 parse failure | `api/parse/parse-doc.js`, `api/admin-run-worker.js` | `t12_parse_error`, `insufficient_t12_text_coverage`, `invalid_core_t12_values:*` | Screening + Underwriting | Legitimate whole-report fail when T12 is truly invalid | Fail closed + restore credit only when required T12 is truly missing/unusable/invalid | P0 legitimate |
| CVF-02 Core Rent Roll parse failure | `api/parse/parse-doc.js`, `api/admin-run-worker.js` | `rent_roll_parse_error`, `insufficient_rent_roll_text_coverage`, `insufficient_rent_roll_structure` | Screening + Underwriting | Legitimate whole-report fail when Rent Roll is truly invalid | Fail closed + restore credit only when required Rent Roll is truly missing/unusable/invalid | P0 legitimate |
| CVF-03 Financial scale mismatch after core parse | `api/admin-run-worker.js` | `DOCUMENT_FINANCIAL_SCALE_MISMATCH` | Both | Can fail whole report even after parse/validation passes | Disclose/qualify when core is otherwise valid; fail only when truly unreconcilable/incoherent beyond defensible use | P0 |
| CVF-04 Current-debt/refi render-contract drift | `api/_lib/report-contract-qa.js` | `CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT`, `CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT`, `UNSUPPORTED_CURRENT_DEBT_RENDERED`, `UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED` | Underwriting | Customer delivery blocker / whole-report fail cascade | Collapse/omit/qualify current-debt/refi/DSCR surfaces; publish core-valid report | P0 |
| CVF-05 Report-type section leak | `api/_lib/report-contract-qa.js`, `api/_lib/qa-action-plan.js` | `REPORT_TYPE_SECTION_LEAK`, `SCREENING_UNDERWRITING_SECTION_LEAK` | Screening + Underwriting | Can become customer delivery blocker / regeneration hold | Strip/collapse leaked section; publish core-valid report | P0 |
| CVF-06 Source reconciliation / rendered variance drift | `api/_lib/report-contract-qa.js`, `api/_lib/source-report-coverage-qa.js` | `RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH`, `RENT_ROLL_T12_RECONCILIATION_REQUIRED` | Both | Can become customer-blocking if promoted beyond disclosure | Disclose-only when core-valid; no source-package blame | P0 |
| CVF-07 Optional/full-underwriting support depth constraints | `api/_lib/source-report-coverage-qa.js`, `api/_lib/qa-action-plan.js` | `FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED`, `FULL_UNDERWRITING_SUPPORT_UNDERUSED`, `PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT`, `ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT` | Underwriting | Public/high-value blocker can be mispromoted into customer block | Internal/distribution-only or section collapse/qualification; ordinary customer delivery allowed | P1 |
| CVF-08 Delivery-gate hold-chain / legacy needs-doc conversion | `api/_lib/qa-action-plan.js` | `buildDeliveryGateDecision`, `buildCanonicalDeliveryDecisionState`, `resolveNeedsDocumentsReasonCode` mapping section-only blockers to `user_needs_documents` / `needs_documents` / `publication_held` | Both | Primary whole-report fail cascade for core-valid reports | Only core-invalid/runtime-fatal can block ordinary delivery; remove customer-facing hold lifecycle | P0 |
| CVF-09 Generator publication-held shim | `api/generate-client-report.js` | `assertValidReportPublicationInsert`, `buildDeliveryResponseCompatibilityAliases`, `delivery_gate_status === "user_needs_documents"` shim | Both | Blocks storage insert / returns `publication_held` | Publish core-valid reports after section collapse/qualification; no hold shim for section-only issues | P0 |
| CVF-10 Worker terminal failure / credit restore misclassification | `api/admin-run-worker.js` | `resolveWorkerDeliveryDecision`, `applyTerminalFailureOutcome(... MISSING_REQUIRED_SOURCE_DATA ...)` | Both | Maps misclassified hold into whole-report fail + entitlement restore | Restore credit only for true core-invalid or true runtime/storage/PDF fatal failures | P0 |
| CVF-11 Failure message builder source-package/rent-roll blame | `src/lib/jobFailureMessaging.js` | `classifyFailure`, `classifyMissingDocumentCategory`, `buildCustomerFailureMessage` mapping `MISSING_REQUIRED_SOURCE_DATA` into source-package/rent-roll copy | Both | Customer trust-killer copy even when core docs parsed | Copy keys only off true core-invalid vs runtime-fatal; never blame usable core docs | P0 |
| CVF-12 Dashboard customer status/copy fallback | `src/pages/Dashboard.jsx` | `resolveDashboardCustomerStatus`, `resolveDoctrineCustomerMessage`, `getFailedFileGuidance`, `normalizeDashboardCustomerStatusLabel` | Both | Can surface `needs_documents`, `publication_held`, additional-documents/source-package/rent-roll guidance | Display only canonical publish/fail-closed/system-failure customer outcomes; suppress needs-doc/held lifecycle | P0 |
| CVF-13 Runtime/storage/PDF/catastrophic render failure | `api/generate-client-report.js` | source-reconciliation guard failure, DocRaptor errors, upload failure, DB insert failure, missing storage path/reportId | Both | Legitimate whole-report fail even after core-valid | Keep fail-closed if true runtime/storage/PDF/render fatal; use system-failure copy only, not docs blame | P0 legitimate |
| CVF-14 OpenAI/provider/advisory failures | `api/_lib/qa-review.js`, `api/_lib/source-package-qa.js`, `api/_lib/qa-manager-review.js`, `api/_lib/qa-director-review.js`, `lib/openai-error-classifier.js` | `insufficient_quota`, billing/rate-limit/timeout/missing key/provider outage | Both | Should be internal only but dangerous if mispromoted downstream | Diagnostic/advisory only when deterministic core is valid; cannot block ordinary delivery | Safe-internal / monitor |
| CVF-15 Optional-support/source-package/admin ops paths | `api/_lib/source-package-qa.js`, `api/admin-run-worker.js`, `api/_lib/source-report-coverage-qa.js`, `api/admin/queue-metrics.js` | market survey, appraisal, environmental, renovation, property tax, mortgage/loan support, `supporting_docs_degraded`, public-sample blocker, admin/ops labels | Underwriting mainly; admin internal | Optional/support docs or admin labels can be misread/mispromoted as customer blockers | Internal/distribution/diagnostic only; optional sections collapse/qualify; admin ops labels must not feed customer lifecycle | P1 / safe-internal |

## P0 launch blocker grouping

The active P0 work is not “one more Underwriting bug.” It is a core-valid delivery doctrine failure family.

P0 groups to destroy:

1. **Core-valid delivery invariant**
   - Files: `api/_lib/qa-action-plan.js`, `api/generate-client-report.js`, `api/admin-run-worker.js`
   - Destroy any path where section-only/non-core issues become whole-report fail, `user_needs_documents`, `publication_held`, or `MISSING_REQUIRED_SOURCE_DATA`.

2. **Section-contained render-contract handling**
   - Files: `api/_lib/report-contract-qa.js`, `api/generate-client-report.js`, `api/_lib/report-surface-contracts.js`
   - Debt/refi/report-type/source-reconciliation render problems must collapse/omit/qualify affected sections before delivery, not fail the report.

3. **Customer copy and Dashboard fallback correction**
   - Files: `src/lib/jobFailureMessaging.js`, `src/pages/Dashboard.jsx`
   - If core is valid, customer copy must never blame T12, Rent Roll, source package, missing documents, or additional documents.

4. **Optional/support/distribution blocker isolation**
   - Files: `api/_lib/source-report-coverage-qa.js`, `api/_lib/source-package-qa.js`, `api/_lib/qa-action-plan.js`
   - Optional support docs, public-sample readiness, high-value outreach readiness, DocRaptor test mode, and OpenAI/advisory failures must remain internal/distribution-only when deterministic core is valid.


## Execution rule - bundle path families by shared file cluster

When Codex begins implementation, do not patch one CVF row at a time if several rows share the same files, canonical owner, and invariant. To prevent this from taking the entire day, bundle **2-4 tightly related CVF families** per prompt only when they touch the same file cluster and share the same doctrine rule.

Approved grouping pattern:

1. **Delivery invariant cluster**
   - CVF-08, CVF-09, CVF-10
   - Files: `api/_lib/qa-action-plan.js`, `api/generate-client-report.js`, `api/admin-run-worker.js`
   - Shared invariant: core-valid jobs cannot become needs-doc/publication-held/MISSING_REQUIRED_SOURCE_DATA/credit-restored because of non-core or section-only issues.

2. **Rendered section self-heal cluster**
   - CVF-04, CVF-05, CVF-06
   - Files: `api/_lib/report-contract-qa.js`, `api/generate-client-report.js`, `api/_lib/report-surface-contracts.js`, `api/_lib/source-report-coverage-qa.js`
   - Shared invariant: section-contained render-contract issues collapse/omit/qualify affected sections and do not fail core-valid reports.

3. **Customer copy cluster**
   - CVF-11, CVF-12
   - Files: `src/lib/jobFailureMessaging.js`, `src/pages/Dashboard.jsx`
   - Shared invariant: customer copy cannot blame source package, T12, Rent Roll, missing documents, or additional documents when core-valid is true.

4. **Optional/support/distribution isolation cluster**
   - CVF-07, CVF-14, CVF-15 plus DocRaptor/public-sample/high-value metadata behavior where surfaced through CVF-08
   - Files: `api/_lib/source-report-coverage-qa.js`, `api/_lib/source-package-qa.js`, `api/_lib/qa-action-plan.js`, advisory QA helpers
   - Shared invariant: optional/support/advisory/distribution blockers remain diagnostic or distribution-only and cannot block ordinary customer delivery when deterministic core docs are valid.

Do not bundle unrelated parser, renderer, worker, Dashboard, and support-doc families just to move faster. Bundling is allowed only when the same patch can enforce one shared invariant without broad refactor or drift.

## Required patch sequence from this checkpoint

Do not prompt Codex for random symptom patches. Use this sequence:

1. **Slice 1 - Core-valid delivery invariant**
   - `qa-action-plan.js`, `generate-client-report.js`, `admin-run-worker.js`, plus minimal customer-copy guard if needed.
   - Goal: core-valid jobs cannot become needs-doc/publication-held/MISSING_REQUIRED_SOURCE_DATA because of non-core/section-only issues.

2. **Slice 2 - Section self-heal/collapse for render-contract violations**
   - current-debt/refi/report-type/source-reconciliation section issues collapse/omit/qualify before delivery.
   - No unsafe debt/refi surface may publish.

3. **Slice 3 - Dashboard/failure messaging final customer-copy lock**
   - no source-package/rent-roll/additional-documents copy for core-valid section-only failures.
   - true core-invalid and true runtime/storage/PDF failures keep accurate fail-closed/system copy.

4. **Slice 4 - Optional/support/distribution isolation sweep**
   - optional support doc failures, market survey parsing, public-sample/high-value blockers, DocRaptor mode, OpenAI advisory failures cannot block ordinary customer delivery.

## Required regression proof

Every slice must prove:

- valid T12 + valid Rent Roll cannot be blamed;
- core-valid section-only issues do not whole-report fail;
- unsafe sections are not published as unsafe surfaces;
- `user_needs_documents`, `needs_documents`, and `publication_held` do not reach customer lifecycle/copy;
- public-sample/high-value/DocRaptor/OpenAI/advisory issues cannot block ordinary customer delivery;
- optional/support docs cannot become failed required-core documents;
- missing/unusable required T12/Rent Roll still fail closed + restore credit;
- true runtime/storage/PDF/catastrophic render failure still fails closed with system-failure copy.

## Supersession note

Older notes claiming no clear P0 launch blocker after G8 or that live regression alone was the next launch gate are superseded by this live Underwriting failure and the repo-wide 15-family audit.

Current launch gate:

```text
All P0 Core-Valid Failure Path Families must be patched or explicitly proven safe before more launch-readiness claims for Full Underwriting.
```

Screening remains cleaner, but because these delivery/copy paths are shared, the P0 core-valid invariant should be fixed across both Screening and Underwriting before launch confidence is restored.

## Fresh continuation point

Next action: give Codex Slice 1 only after this addendum is committed.

Do not run more live tests yet.
Do not start debt/refi rendering before the core-valid delivery invariant is patched.
Do not patch customer copy only while the delivery chain can still fail core-valid reports.


---

# InvestorIQ Decision-Source Elimination Ledger
## Controlling Status - May 28, 2026

Historical note: This file supersedes the prior Full Underwriting cleanup roadmap and is now the master decision-source elimination ledger for both Screening and Full Underwriting.

## DS Row Closure Standard
- A DS row may only be marked `CLOSED` if the old decision-maker can no longer override canonical truth.
- Every touched row must have one disposition:
- `DELETED`
- `NEUTERED / READ-ONLY CONSUMER`
- `CONVERTED TO QA CONTRACT`
- `LEGACY FALLBACK ONLY`
- `STILL OPEN`
- Rules:
- Adding a canonical helper is not enough to close a row.
- If legacy fallback remains, mark `PARTIAL`, not `CLOSED`.
- If renderer/worker/Dashboard can still override canonical state, row remains `OPEN` or `PARTIAL`.
- If QA still infers truth instead of canonical-vs-render conformance checking, row remains `OPEN` or `PARTIAL`.

## Section 1 - Executive Doctrine
- InvestorIQ must have ONE canonical decision authority per truth family.
- Renderer must become a read-only consumer.
- QA must become state-to-render conformance checking, not truth inference.
- Worker must consume canonical delivery/gate decisions, not reinterpret them.
- Dashboard must display canonical customer status/gate meaning, not recompute it from error codes.
- No tactical symptom patches.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off fixture values.
- Tests are required but are not substitutes for production root-cause fixes.
- Screening and Full Underwriting both share this cleanup.
- Full Underwriting public self-serve remains paused.
- Screening-first launch remains possible but must be protected from shared decision-sprawl.

## Section 2 - Current Root Diagnosis
- The primary defect class is duplicate truth-makers / decision-sprawl.
- Contract QA catches important drift after render, but does not fully prevent render-time drift.
- Canonical helpers are not sufficient unless every consumer surface is forced to obey canonical state.
- The old root-class patch sequence improved quality but did not eliminate competing authorities.
- Strategy is now strict: inventory -> assign authority -> migrate consumers -> quarantine/delete duplicates.

## Section 2A - Today DS Status Update (May 28, 2026)

### June 1, 2026 Addendum - Clean Screening 7 Green Checkpoint / Live Validation Update
- Final Motherload Screening 7 (CLEAN) rerun passed and published.
- Clean Screening is GREEN for ordinary customer delivery.
- Report Contract QA passed with zero violations.

#### Live validation checkpoints recorded
1. Summary-only rent-roll surface behavior is validated live.
- `Summary Rent Positioning` no longer duplicates.
- Implied-average labels remain for summary-only mode.
- No weighted/rent-band row-level framing leaks in summary-only mode.
- `InvestorIQ estimates are document-backed...` wording is removed.

2. Deterministic text-summary rent-roll fallback validated live.
- `method: deterministic_text_summary`
- `total_units: 48`, `occupied_units: 46`, `vacant_units: 2`, `occupancy: 95.83%`
- `in_place_rent_annual: 1,036,800`, `market_rent_annual: 1,137,600`
- `ai_assisted: false`

3. T12 parsing validated live.
- `effective_gross_income: 1,036,800`
- `total_operating_expenses: 425,000`
- `net_operating_income: 611,800`
- `core_t12_validation.ok: true`

4. OpenAI/provider diagnostics taxonomy validated live.
- 429 quota failures normalize to `provider_error_class: insufficient_quota`.
- Validator rollup maps `insufficient_quota` under `platform_infrastructure_issue_codes`.
- Advisory/recovery provider failure does not block deterministic customer delivery when required core deterministic artifacts validate.

5. Delivery/readiness doctrine status unchanged.
- Customer delivery remains allowed for deliverable reports.
- DocRaptor test mode remains the current external/public/Ken/sample blocker only.
- `public_sample_ready` and `high_value_outreach_ready` remain blocked until DocRaptor production mode is enabled and verified.

#### DS sub-scope status notes (no broad over-closure)
- `DS-067`: deterministic rent-roll text-summary fallback sub-scope validated live; broader DS-067 remains `PARTIAL`.
- `DS-064`: Screening summary-only rent-roll render/surface sub-scope validated live; broader DS-064 remains `PARTIAL`.
- Delivery/readiness DocRaptor distribution-only behavior validated live as targeted sub-scope; broader delivery clusters remain governed by row closure standards.
- OpenAI/provider diagnostics taxonomy validated live as diagnostic/platform-infrastructure sub-scope; no broader DS-068/DS-069 over-closure implied.

#### Continuation point
1. Proceed to Messy Screening controlled live regression.
2. Handle DocRaptor production/public-sample config before external distribution readiness claims.

---

### June 1, 2026 Addendum - Clean Screening Regression Root Fixes / Parser Fallback / Delivery Gate Correction / Summary-Only Surface Patch / Core Parser Rejection Audit Installed
- Post-G8 controlled live regression surfaced a real parser->delivery->surface chain.
- Clean Screening initially failed closed because narrative rent-roll summary totals were usable but not accepted by deterministic non-tabular path; AI recovery returned non-OK/429.
- Worker fail-closed/credit-restore doctrine behaved correctly.

#### Completed June 1 root-fix sequence (post-G8 live-regression)
1. Deterministic rent-roll text-summary fallback added and hardened.
- Files: `api/parse/parse-doc.js`, `tests/qa/rent-roll-text-summary-fallback-smoke.js`
- Added deterministic summary-total acceptance for non-tabular rent roll text with strict coherence.
- Requires both rent-total families (in-place/current and market).
- Representative-only text rejects; no fabricated rows; no representative-row summation.
- Summary-total precedence fixed so controlling totals win over representative unit narrative values.

2. Delivery/readiness leakage correction.
- Files: `api/_lib/qa-action-plan.js`, `tests/qa/delivery-decision-state-smoke.js`
- Fixed canonical-vs-legacy alias precedence so `DOCRAPTOR_NOT_PRODUCTION_MODE` remains distribution-only.
- Ordinary customer delivery is not held when canonical gate says deliverable and no customer blockers exist.
- Public sample/high-value outreach can remain blocked in test mode.
- True customer blockers and typed gate holds remain unchanged.

3. Screening summary-only rent-roll surface eligibility/render patch.
- Files: `api/generate-client-report.js`, `tests/qa/generate-client-report-rent-roll-smoke.js`
- Summary-only rent roll (no verified unit rows/unit_mix) now suppresses empty unit-level framing.
- Replaced with summary-total positioning language and implied-average labels.
- Weighted labels/rent-band table preserved only for row-level support.
- Replaced stale heading `InvestorIQ Estimates` -> `Document-Backed Screening Outputs`.

4. Diagnostic safeguard in worker fail path.
- Files: `api/admin-run-worker.js`, `tests/qa/core-parser-rejection-audit-smoke.js`
- Added diagnostic-only `core_parser_rejection_audit` artifact when required core structured artifact is missing but extracted text exists.
- Deterministic text-signal findings identify likely parser miss vs insufficient evidence vs provider unavailable.
- No publish behavior change, no parsed artifact creation, no delivery doctrine change.

#### DS cluster status notes (closure nuance)
- `DS-067 parser recovery cluster`:
- Deterministic rent-roll text-summary fallback and summary-precedence sub-scopes are closed.
- Core parser rejection diagnostic safeguard sub-scope is closed.
- Broader DS-067 remains `PARTIAL` unless full cluster closure standard is met.

- `DS-068 worker status-machine cluster`:
- Diagnostic-only core parser rejection audit in fail path is added and closed as a sub-scope.
- No change to fail-closed doctrine, typed outcomes, or credit-restore semantics.
- Broader DS-068 remains governed by closure standard.

- `DS-047/DS-048/DS-050 delivery/readiness`:
- Canonical-over-legacy precedence fix for DocRaptor distribution-only blocker leakage is completed.
- Do not auto-mark broader rows `CLOSED` unless all row closure criteria are met; treat as targeted sub-scope closure where applicable.

- `DS-064 generator/render cluster`:
- Screening summary-only rent-roll surface eligibility/render sub-scope is closed.
- Broader DS-064 remains `PARTIAL` unless complete closure standard is satisfied.

#### Validation receipts (June 1)
- `rent-roll-text-summary-fallback-smoke` passed.
- `t12-rent-roll-diagnostics-regression` passed where run.
- `delivery-decision-state-smoke` passed.
- `admin-run-worker-gate-smoke` passed.
- `generate-client-report-rent-roll-smoke` passed.
- `core-parser-rejection-audit-smoke` passed.
- `git diff --check` passed with CRLF warnings only.

#### Immediate continuation point
- Pause live testing until doc checkpoint + fresh chat reset.
- Next:
1. rerun same Clean Screening and red-pen latest PDF surface;
2. separate OpenAI 429/insufficient_quota diagnostics readiness pass (error-body capture clarity, model/retry/backoff diagnostics, no secret exposure).

#### Do not overclaim
- Do not claim all DS rows globally closed.
- Do not claim Full Underwriting public self-serve launch-ready.
- Do not claim Ken/public sample readiness.

### May 30, 2026 Addendum - G8 Delivery/UI Lifecycle Authority Materially Closed / Grouped Campaign Checkpoint
- G8 is materially closed.
- G8A-02 seam in `api/admin-run-worker.js` is closed.
- Worker publish path now requires resolved delivery permission:
  - `holdDelivery === false`
  - `customerDeliveryAllowed === true`
- Typed outcomes remain preserved:
  - `user_needs_documents` fail-closed/restore path
  - `admin_review_required` held publishing/admin-held path
- Fail-closed and credit-restore safety behavior remains preserved.

#### Post-patch audit verdict
- Audit-only verification completed.
- No material remaining delivery/UI duplicate truth-maker was found across worker lifecycle, Dashboard customer status/message surfaces, AdminDashboard triage surfaces, and generator delivery compatibility aliases.
- Dashboard remains canonical-first for `customer_status_label`/`customer_message` when canonical state exists.
- Legacy display/copy fallback remains canonical-absent compatibility only.
- AdminDashboard remains display/diagnostic/emergency-action only, not customer delivery authority.
- `public_sample_ready` and `high_value_outreach_ready` remain distribution metadata, not ordinary customer delivery authority.

#### Grouped campaign status update
- Completed/materially closed:
  - Patch 1/1B
  - Patch 2
  - G4
  - G1
  - G2
  - G5
  - G6
  - G7
  - G8
- Remaining grouped batches in current G1-G8 sequence:
  - None

#### Fresh-Chat Continuation Prompt
We resume after G8 material closure.

Completed/materially closed: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7, G8.

Next step: either controlled live regression checkpoint or targeted post-launch polish selection.

Guardrails unchanged:
- micro-prompts
- no broad refactors
- no report-specific hacks
- no hardcoded IDs/filenames
- no new API/serverless routes casually
- renderer consumes canonical state
- QA conformance only

#### Do not overclaim
- Do not claim all DS rows globally closed unless row closure standards are satisfied.
- Do not claim Full Underwriting public self-serve launch-ready.
- Do not claim Ken/public samples are ready.
### May 30, 2026 Addendum - G7 Action-Plan Consumer Demotion Materially Closed / G8 Remains Next
- Campaign status update: G7 is now materially closed after Slices 1, 2A, 2B, and Slice 3 closure audit.
- Completed/materially closed grouped sequence:
  - Patch 1/1B
  - Patch 2
  - G4
  - G1
  - G2
  - G5
  - G6
  - G7
- G7 closure details:
  - Slice 1: `buildQaActionPlan(...)` now consumes canonical delivery state when present; legacy synthesis is canonical-absent fallback only.
  - Slice 2A: `buildPublishEligibilitySummary(...)` now consumes canonical delivery state when present; local blockers/advisories/regeneration/source-limitation fields remain diagnostic metadata under canonical-present authority.
  - Slice 2B: `buildDeliveryGateDecision(...)` now accepts `deliveryDecisionState`, `canonicalDeliveryDecisionState`, `delivery_gate_decision`, and `deliveryGateDecision`; canonical-present paths mirror canonical truth for delivery/readiness fields.
  - `public_sample_ready` and `high_value_outreach_ready` mirror canonical only when explicitly present; otherwise safe distribution metadata fallback remains.
  - Legacy gate-owner behavior remains only when canonical delivery state is absent.
  - Slice 3 closure audit: audit-only, no files changed, no material residual duplicate-authority leak in G7 scope.
- Remaining grouped batch:
  - `G8 - Delivery/UI Lifecycle Follow-up`
- Next recommended task:
  - G8 audit only, unless Rob explicitly chooses controlled live regression first.
- G8 must remain micro-sliced due to worker/dashboard lifecycle risk and Vercel Hobby constraints.
- Supersession note: prior top-note guidance that G7 remained next/open is superseded by this G7 closure update.
- Do not claim all DS rows are closed.
- Do not claim Full Underwriting public self-serve launch-ready.
### May 30, 2026 Addendum - G1/G2/G5/G6 Materially Closed / Pause Before G7-G8
- Campaign checkpoint status: grouped cleanup is paused intentionally due to low Codex usage.
- Completed/materially closed sequence in this campaign:
  - Patch 1/1B
  - Patch 2
  - G4
  - G1
  - G2
  - G5
  - G6
- Remaining grouped batches:
  - `G7 - Action-Plan Consumer Demotion`
  - `G8 - Delivery/UI Lifecycle Follow-up`
- Do not start G7/G8 in this paused checkpoint.
- Next recommended task on resume: G7 audit only, unless Rob explicitly chooses controlled live regression first.

#### Sequence Recorded As Completed/Committed
- Patch 1/1B
  - Parser current-debt support routing and downstream loan-term promotion aligned.
  - Explicit non-acquisition current-debt terms route/promote as current debt.
  - Acquisition/proposed financing remains separated.
  - Standalone LTV no longer creates acquisition/proposed classification by itself.
- Patch 2
  - `resolveReportTypeAndTier(...)` added.
  - Explicit unknown `report_type` fails closed with `400 Invalid report_type`.
  - Underwriting aliases normalize to underwriting/tier 2/v1_core.
  - Screening default remains only when no explicit type is provided.
- G4
  - Source-report-coverage QA canonical-first depth/signal guard sweep completed.
  - Rendered/file/artifact signals are conformance/evidence only when canonical state exists.
  - Full Underwriting depth conformance is based on canonical section-family expectations, not raw page count.
- G1 materially closed
  - Slice 1: operating statement, renovation, document sources canonicalization.
  - Slice 2: debt tables, DCF table, risk matrix, DCF summary, narrative strip canonicalization.
  - Slice 3: late `reportTier === 1` strip cascade guarded by canonical report intent.
  - Closure audit: early `effectiveReportMode === "screening_v1"` cascade remains residual/contained (`G1C-02` watch item only).
  - Do not patch `G1C-02` unless future live regression proves actual mode mismatch.
- G2 materially closed
  - Slice 1: `normalizeVisibleReportClassification(...)` is mode-aware; screening debt-cap leakage blocked; underwriting canonical caps preserved.
  - Slice 2: Screening stress-summary/framework/rationale consumers now use canonical/final visible label.
  - `screeningClass` remains fallback/evidence only, not final visible authority.
  - Deferred polish only: CSS stale aliases, Data Coverage wording nuance, historical Deal Scorecard threshold note.
- G5 materially closed
  - Slice 1: `resolveCanonicalCurrentDebtStateForQa(...)` provenance-locked; `hasCanonicalCoverageAuthority(...)` explicit-provenance only.
  - Slice 2: `inferCanonicalVerdictCapState(...)` provenance-gated.
  - Explicit verdict/classification state remains highest authority.
  - Remaining G5 scope is regex/taxonomy wording polish and non-authority conformance tuning only.
- G6 materially closed
  - Slice 1: rendered acquisition phrase removed as canonical acquisition authority; rendered section heading removed as canonical section-eligibility authority.
  - Final sweep:
    - `buildCurrentDebtAssessmentState(...)` no longer allows QA inventory booleans to create debt truth, DSCR, or refi eligibility.
    - `normalizeReconciliationVariance(...)` no longer lets deterministic parser/artifact flags escalate material variance to parser/admin/customer-blocking status.
    - `buildCanonicalVisibleClassificationState(...)` gates debt-coverage caps to Underwriting/tier 2 mode.
    - Screening cannot emit `Review - Debt Coverage Constraint` from debt flags or not-assessed debt.
  - No new G6 authority leak surfaced in final sweep scope.

#### Grouped Batch Map Update
- `G1` status: materially closed, with residual `G1C-02` watch item only.
- `G2` status: materially closed; polish deferred.
- `G5` status: materially closed; non-authority polish deferred.
- `G6` status: materially closed.
- `G7` status: materially closed after Slices 1, 2A, 2B, and Slice 3 closure audit.
- `G8` remains.
- `G8` must remain micro-sliced due to worker/dashboard lifecycle risk and Vercel Hobby constraints.

#### Fresh-Chat Continuation Prompt
We resume after G7 material closure.

Completed/materially closed: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7.

Remaining: G8 - Delivery/UI Lifecycle Follow-up.

Codex usage was low, so work paused intentionally.

Next recommended task: G8 audit only, unless Rob explicitly chooses controlled live regression first.

Guardrails remain:
- micro-prompts
- no broad refactors
- no report-specific hacks
- no hardcoded property names/filenames/report IDs
- no public AI wording
- no BUY/SELL/HOLD
- no new Vercel API/serverless routes casually
- renderer consumes canonical state
- QA is conformance only
- action plan consumers must not re-infer truth
- lifecycle/UI consumers in G8 must not reinterpret canonical delivery state

### May 30, 2026 Addendum - Grouped Decision-Source Elimination Process Adopted / Patch 1B + Patch 2 + G4 Complete
- InvestorIQ is no longer patching individual test reports or isolated symptoms.
- Live report failures identify root families, then fixes remove or demote the repo-wide decision-source class.
- The ~132 decision-source findings now run through controlled grouped batches.
- Larger grouped patches are allowed only when findings share:
  - same file or very small file cluster
  - same canonical owner
  - same invariant
  - same failure mode
  - same regression strategy
- Random cross-family 15-20 item patches remain prohibited.
- Tests must prove generalized invariants, not one fixture.
- Renderer must consume canonical truth.
- QA may detect canonical-vs-render mismatch but must not create financial/report truth.
- Parser/canonical-owner slices remain smaller where acquisition/current-debt or semantic-classification risk is high.

#### Grouped Batch Map (Controlling Next-Work Map)
- `G1 - Generator Section Strip Canonicalization`
  - Findings: generator strip/mutation authority leaks.
  - Files: primarily `api/generate-client-report.js`.
  - Invariant: when canonical section/data coverage state exists, renderer cannot override via local strip/phrase heuristics.
  - Next after G4.
- `G2 - Generator Classification/Coverage Consumer Cleanup`
  - Files: primarily `api/generate-client-report.js`.
  - Invariant: headline/classification labels consume canonical state; fallback only when canonical absent.
- `G3 - Parser Financing Route & Promotion Consistency Sweep`
  - Files: primarily `api/parse/parse-doc.js`.
  - Invariant: explicit non-acquisition current-debt terms stay debt-eligible; acquisition/proposed never promotes to current debt.
  - Note: Patch 1/1B completed the immediate current-debt support routing/promotion sub-scope.
- `G4 - Source-Coverage QA Canonical-First Depth/Signal Guard Sweep`
  - Files: `api/_lib/source-report-coverage-qa.js`.
  - Invariant: rendered/file/artifact signals are conformance/fallback-only under canonical-present authority.
  - Status: completed and committed.
- `G5 - Report-Contract QA Provenance + Conformance Sweep`
  - Files: `api/_lib/report-contract-qa.js`.
  - Invariant: regex/html evidence detects drift only; canonical/provenanced state defines truth.
- `G6 - Surface-Contracts Canonical Owner Hardening`
  - Files: `api/_lib/report-surface-contracts.js`, `api/_lib/full-underwriting-state.js`.
  - Invariant: single owner for debt/eligibility/reconciliation/full-underwriting composite state.
- `G7 - Action-Plan Consumer Demotion`
  - Files: `api/_lib/qa-action-plan.js`.
  - Invariant: action plan consumes canonical/QA findings and does not re-infer truth.
- `G8 - Delivery/UI Lifecycle Follow-up`
  - Files: `api/admin-run-worker.js`, `src/pages/Dashboard.jsx`.
  - Invariant: lifecycle/status consumers honor canonical delivery decision.
  - Must stay micro-sliced.

#### Patch 1 / 1B Completed (Committed)
- Files:
  - `api/parse/parse-doc.js`
  - `tests/qa/current-debt-support-routing-smoke.js`
- Fixed current-debt support routing and downstream loan-term promotion.
- Added/used `resolveLoanTermCurrentDebtPromotion(...)`.
- Explicit non-acquisition debt terms now route to `loan_term_sheet` and promote current-debt aliases.
- Current-debt aliases include:
  - `current_outstanding_balance`
  - `current_loan_balance`
  - `debt_basis: existing_mortgage_debt`
- Acquisition/proposed financing remains separated and does not promote current-debt aliases.
- Standalone LTV no longer creates acquisition/proposed classification by itself.
- Scope remained parser-only plus focused smoke test.

#### Patch 2 Completed (Committed)
- Files:
  - `api/generate-client-report.js`
  - `tests/qa/report-type-normalization-smoke.js`
- Added `resolveReportTypeAndTier(...)`.
- Closed silent explicit-unknown report-type downgrade path.
- Explicit unknown `report_type` now fails closed with `400 Invalid report_type` instead of defaulting to Screening/tier 1.
- Valid underwriting aliases normalize to underwriting/tier 2/v1_core:
  - `full_underwriting`
  - `full-underwriting`
  - `underwriting_report`
  - `underwriting_v1`
  - `tier_2`
  - `tier2`
- Screening default remains only when no explicit type is provided.

#### G4 Completed (Committed)
- Batch: `G4 - Source-Coverage QA Canonical-First Depth/Signal Guard Sweep`
- Files:
  - `api/_lib/source-report-coverage-qa.js`
  - `tests/qa/source-report-coverage-qa-smoke.js`
- Added/strengthened:
  - `CURRENT_DEBT_CANONICAL_RENDER_STATE_DRIFT`
  - `ACQUISITION_CURRENT_DEBT_CANONICAL_CONFORMANCE_DRIFT`
  - `UNDERWRITING_RENDERED_DEPTH_CONFORMANCE_FAILURE`
- Canonical-present underwriting paths now treat rendered debt/acquisition signals as conformance evidence only.
- Rendered "not assessed" debt wording can flag drift but cannot downgrade canonical computed debt.
- Rendered debt/acquisition phrasing can flag drift but cannot promote/redefine acquisition/current-debt truth.
- Fallback artifact/rendered truth-making remains only in canonical-absent branches.
- Full Underwriting thin-depth detection uses canonical section-family expectations plus rendered section-family evidence, not raw page count.
- Debt omission is allowed when canonically source-constrained and clear limitation disclosure is rendered.
- No fake DSCR/refi math is required when current debt is not assessed.
- Screening does not trigger Full Underwriting depth mismatch.

#### Current Next Step
- Next batch: `G1 - Generator Section Strip Canonicalization`.
- Reason: G4 installed the alarm/conformance layer; G1 now addresses the generator strip/mutation machinery that can still physically collapse/remove sections despite canonical state.

#### Supersession / Launch Gate Note
- The prior "live regression is next" note is superseded by the grouped decision-source process until at least G1 is addressed.
- Live regression remains required before Full Underwriting launch readiness.
- Immediate next step is G1 because grouped audit sequencing identified generator strip/mutation authority as the next safest/highest-impact batch.
- Full Underwriting public self-serve remains paused.
- Controlled regeneration should wait until grouped sequencing reaches the agreed checkpoint.

### May 30, 2026 Addendum - Batch 6 DS-064/065/066 Launch-Risk Compression Complete / Controlled Launch Acceptable With Monitoring
- Batch 6 status: `CLOSED WITH KNOWN BROADER FOLLOW-UP`.
- Batch 6 materially hardened the DS-064 / DS-065 / DS-066 generator/rendered-regex/QA provenance cluster.
- Full DS-064/DS-065/DS-066 ledger closure is not required before controlled launch.
- Remaining DS-064/DS-065/DS-066 work is P1/P2 hardening unless live regression exposes a launch-blocking issue.
- The next launch gate is live regression, not full ledger closure.

#### Batch 6B - Canonical State Propagation + Provenance Guard Hard-Lock
- Addressed: `B6A-064-03`, `B6A-066-01`, `B6A-066-02`, and partially tightened `B6A-065-01` / `B6A-065-02`.
- Files changed:
  - `api/generate-client-report.js`
  - `api/_lib/source-report-coverage-qa.js`
  - `api/_lib/report-contract-qa.js`
  - `tests/qa/source-report-coverage-qa-smoke.js`
  - `tests/qa/report-contract-qa-smoke.js`
  - `tests/qa/generate-client-report-rent-roll-smoke.js`
- Result:
  - generator now passes canonical states into source-report-coverage QA.
  - source-report-coverage QA now emits `authority_provenance` and canonical/fallback state source markers.
  - report-contract QA no longer treats fallback-derived current debt state as canonical authority.

#### Batch 6B-Proof - Runtime Behavioral Proof Hardening
- Source-level assertions were supplemented with runtime behavioral proof.
- Proven:
  - canonical-present source coverage behavior.
  - canonical-absent fallback behavior.
  - report-contract canonical/fallback current-debt DSCR provenance behavior.
  - generator canonical-state helper propagation behavior.
- Note: one lightweight generator source-level backup assertion remains acceptable because full runtime interception of the internal call path would require broader harness instrumentation.

#### Batch 6C - DS-064 Residual Renderer Strip/Mutation Cleanup
- Addressed: `B6A-064-01`, `B6A-064-02`.
- Files changed:
  - `api/generate-client-report.js`
  - `tests/qa/generate-client-report-rent-roll-smoke.js`
- Result:
  - `SECTION_4_NEIGHBORHOOD` and `SECTION_4_LOCATION_TABLE` now route through canonical `market_context` section visibility when canonical state exists.
  - Data Coverage `DATA NOT AVAILABLE` phrase-count suppression is now legacy fallback only and cannot override canonical Data Coverage authority.
  - Runtime/helper behavioral proof was added.

#### Batch 6D - Closure Audit
- Audit-only.
- Verdict: `CLOSED WITH KNOWN BROADER FOLLOW-UP`.
- Found:
  - `B6D-065-01`: report-contract QA coverage authority could still be object-presence based.
  - `B6D-065-02`: report-contract QA current_debt_state promotion still needed stricter provenance.
  - `B6D-066-01`: source-report-coverage QA sufficiency authority needed to include explicit sectionEligibility.
  - `B6D-064-01`: `SECTION_11_FINAL_RECS` final recommendation section was still local-narrative gated.
- Recommendation: split QA provenance hardening from final recommendation section guard.

#### Batch 6E - QA Provenance Guard Tightening
- Addressed: `B6D-065-01`, `B6D-065-02`, `B6D-066-01`.
- Files changed:
  - `api/_lib/report-contract-qa.js`
  - `api/_lib/source-report-coverage-qa.js`
  - `tests/qa/report-contract-qa-smoke.js`
  - `tests/qa/source-report-coverage-qa-smoke.js`
- Result:
  - `hasCanonicalCoverageAuthority(...)` now requires explicit provenance authority flags.
  - `resolveCanonicalCurrentDebtStateForQa(...)` no longer promotes fallback/unprovenanced `current_debt_state` to canonical truth.
  - `fallback_reconstructed` current debt is explicitly non-canonical.
  - explicit `sectionEligibility` now participates in source-report-coverage canonical coverage/sufficiency authority.
  - Runtime behavioral tests prove canonical/provenanced vs fallback/unprovenanced behavior.

#### Batch 6F - DS-064 Final Recommendation Canonical Guard
- Addressed: `B6D-064-01` and DS-064 residual renderer mutation hardening sub-scope for `SECTION_11_FINAL_RECS`.
- Files changed:
  - `api/generate-client-report.js`
  - `tests/qa/generate-client-report-rent-roll-smoke.js`
- Result:
  - `SECTION_11_FINAL_RECS` is no longer gated only by local `finalRecommendation` narrative presence.
  - Added canonical-first resolver `resolveFinalRecommendationSectionVisibility(...)`.
  - Supported canonical keys: `final_recommendation`, `final_recommendations`, `final_recs`.
  - Canonical eligible/rendered keeps the section even when local fallback would strip.
  - Canonical omitted/source_constrained strips the section even when local fallback would keep.
  - Canonical absent preserves legacy local narrative fallback.
  - Runtime helper-level behavioral tests were added.

#### Launch-Risk Compression Audit
- Current launch-readiness summary: `Controlled launch acceptable now with monitoring`.
- No clear P0 remaining from the sweep.
- No current canonical-present path was found that plausibly reintroduces false debt/refi math, acquisition-as-current-debt contamination, or wrong customer delivery decision.
- Full ledger closure is no longer required before controlled launch.
- Remaining DS-064/DS-065/DS-066 work is P1/P2 hardening unless live regression proves otherwise.
- Live regression is now the launch gate.

#### Supersession Note
- Older notes saying Full Underwriting must wait for full decision-source closure are superseded to the extent that the latest launch-risk compression audit says controlled launch is acceptable with monitoring if live regression passes.
- This does not mean Full Underwriting is fully public self-serve launch-ready before live regression passes.
- This does not mean all DS rows are closed.
- Historical caution remains preserved as history.

#### Current Next Step
- Run live regression set:
  1. Clean Screening
  2. Messy Screening
  3. Clean Underwriting
  4. Messy Underwriting
  5. Acquisition/current-debt edge case
- For each regression, capture:
  - PDF/report output
  - analysis artifacts
  - report_contract_qa
  - source_report_coverage_qa
  - qa_action_plan
  - Dashboard/Admin Diagnostics evidence if relevant
- Validation checklist:
  - no false limitation headline
  - Screening does not leak underwriting sections
  - acquisition/proposed financing never treated as current debt
  - DSCR/refi suppressed when current debt is not assessed
  - current-debt/refi math only appears with verified current debt basis
  - Data Coverage headline/severity obeys canonical state
  - support docs are not used quantitatively unless canonical state supports it
  - visible classification aligned across surfaces
  - no prohibited public language
  - no internal parser/admin/vendor artifacts
  - no unresolved tokens, `DATA NOT AVAILABLE` placeholders, mojibake, or awkward N/A metric leaks

### May 29, 2026 Addendum - Batch 5 Section Eligibility / Data Coverage / QA Conformance Authority Closed With Broader Cluster Follow-Up
- Batch 5 status: `CLOSED WITH KNOWN BROADER CLUSTER FOLLOW-UP`.
- Batch 5B hard-locked generator rendering to canonical-first authority for Data Coverage headline/severity and section eligibility gating.
- Batch 5C hard-locked source-report-coverage QA to canonical-first conformance behavior when canonical state exists; rendered sections/signals are evidence-only in canonical-present paths.
- Batch 5D hard-locked report-contract QA to canonical-first conformance behavior for coverage/section/debt/acquisition checks while preserving real contradiction detection.
- Batch 5E closure audit found final renderer leak `F-5E-01`: unconditional `SECTION_4_NEIGHBORHOOD` strip could bypass canonical section eligibility.
- Batch 5F fixed `F-5E-01` by replacing unconditional neighborhood strip with canonical-guarded `market_context` decision via `shouldRenderCanonicalSection(...)`, preserving canonical-absent fallback behavior.
- Behavioral proof standard was enforced across Batch 5 sub-batches: production authority fix plus runtime behavioral proof in the same PR scope.
- Batch 4 DS-029 acquisition/current-debt separation invariant remained preserved during Batch 5C/5D (and was not reopened).
- Family-level follow-up remains: broader DS-064/DS-065/DS-066 rendered/regex/generator mutation cluster closure sweep.

### Batch 1 / 1A Classification
- DS-004: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER` path not applicable (canonical helper retained), but family not fully closed until all renderer/QA override paths are eliminated.
- DS-005: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER` downstream migration in progress; canonical owner exists but not all consumers are hard-locked.
- DS-006: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; generator now routes toward canonical state, fallback path still exists.
- DS-007: `PARTIAL` - disposition `LEGACY FALLBACK ONLY`; scorecard HTML alignment remains adaptation path.
- DS-008: `PARTIAL` - disposition `CONVERTED TO QA CONTRACT`; conformance improved, regex fallback still present.
- DS-009: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; scoring remains mixed path where visible classification interactions are only partially neutralized.
- DS-010: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER` migration in progress; canonical metadata path exists, family still has fallback paths.

### Batch 2A Delivery Decision State Shape
- DS-047: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; mapped into canonical deliveryDecisionState, legacy readiness aliases still emitted for compatibility.
- DS-048: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; canonical gate owner retained, but downstream consumer lock-in not complete.
- DS-049: `CLOSED` - disposition `NEUTERED / READ-ONLY CONSUMER`; generator compatibility aliases are derived from canonical `deliveryDecisionState` and cannot independently recompute readiness when canonical state exists.

### Batch 2B / 2B.1 Worker Consumption
- DS-050: `CLOSED` (deliveryDecisionState consumption scope) - disposition `NEUTERED / READ-ONLY CONSUMER`; worker resolver enforces canonical-first precedence for gate status, customer delivery allowed, hold delivery, and credit restore. Legacy top-level fields are fallback-only when canonical state is absent.
- DS-068: `PARTIAL` - disposition `STILL OPEN`; only deliveryDecisionState consumption slice addressed, broader worker status-machine cluster remains.

### Batch 2C Dashboard Bridge
- DS-059: `CLOSED` - disposition `NEUTERED / READ-ONLY CONSUMER`; customer-facing status surfaces now prefer canonical `customer_status_label` when present, with legacy mapping fallback-only.
- DS-060: `CLOSED` - disposition `LEGACY FALLBACK ONLY`; canonical `customer_message` is authoritative when present, and needs-doc/message fallback is non-authoritative fallback-only.
- DS-061: `CLOSED` - disposition `LEGACY FALLBACK ONLY`; failed-file guidance is suppressed when canonical `customer_message` exists and remains fallback-only for older/non-canonical jobs.
- DS-069: `PARTIAL` - disposition `STILL OPEN`; canonical bridge exists, broader Dashboard/customer messaging consolidation remains open.

### Batch 2E / 2F Delivery Hard-Lock
- DS-052: `CLOSED` - disposition `CONVERTED TO QA CONTRACT`; report-contract QA resolves canonical delivery state first and treats legacy readiness aliases, `qaFixRouting`, and source coverage readiness payloads as conformance inputs only when canonical state exists. Closure proof: `report-contract-qa-smoke.js` canonical delivery conflict cases.
- DS-049: `CLOSED` - disposition `NEUTERED / READ-ONLY CONSUMER`; generator compatibility aliases are derived from canonical `deliveryDecisionState` through `buildDeliveryResponseCompatibilityAliases(...)`. Legacy aliases remain compatibility outputs and cannot independently recompute readiness when canonical state exists. Closure proof: `delivery-decision-state-smoke.js`.
- DS-050: `CLOSED` (deliveryDecisionState consumption scope) - disposition `NEUTERED / READ-ONLY CONSUMER`; worker resolver applies strict canonical-first precedence for delivery gate status, customer delivery allowed, hold delivery, and credit restore. Legacy top-level fields are used only when canonical state is absent and cannot override canonical state. Closure proof: `admin-run-worker-gate-smoke.js`.
- DS-068: `PARTIAL`; broader worker status-machine cluster is not fully closed, even though deliveryDecisionState consumption sub-scope is hard-locked.

### Batch 2 Consolidated Completion Update - Delivery / Readiness Authority
- Batch 2 materially hard-locked delivery/readiness propagation across generator, worker, contract QA, and Dashboard.
- `deliveryDecisionState` is the canonical delivery/customer state object for downstream consumers.
- Generator aliases are compatibility/read-only outputs derived from canonical `deliveryDecisionState`.
- Worker delivery gate consumption is canonical-first.
- Worker terminal fail/restore mechanics now route through `applyTerminalFailureOutcome(...)` and `restoreEntitlementForFailedJob(...)`.
- Dashboard customer status/message/guidance now uses canonical `customer_status_label`/`customer_message` when present.
- report-contract QA now treats delivery readiness as canonical-vs-render/payload conformance, not independent truth.
- Legacy fallback remains only for older/non-canonical jobs where explicitly retained.
- DS-049: `CLOSED`
- DS-050: `CLOSED`
- DS-051: `CLOSED`
- DS-052: `CLOSED`
- DS-059: `CLOSED`
- DS-060: `CLOSED`
- DS-061: `CLOSED`
- DS-068: `PARTIAL`
- DS-069: `PARTIAL`
- Broader cluster rows DS-068 and DS-069 remain `PARTIAL` because full worker lifecycle and Dashboard legacy fallback architecture are not completely eliminated.

### Batch 3 Consolidated Completion Update - Current Debt / Refi Authority
- Current debt/refi customer-facing truth is now controlled by canonical current-debt state and canonical refi render/basis state where canonical payload exists.
- Scorecard DSCR no longer backfills numeric DSCR from legacy mortgage/debt fallback when canonical current debt is not computed.
- Legacy mortgage fallback is retained only as canonical-absent compatibility.
- Refi basis/render-state/narrative mode are canonical-gated and cannot upgrade not-assessed/source-limited/acquisition-only state into quantitative refi/current-debt math.
- Report-contract QA now treats rendered DSCR extraction as evidence-only and compares rendered debt/refi surfaces against canonical state.
- QA artifact/inventory debt heuristics are retained only for canonical-absent fallback and cannot override canonical current-debt payload.
- DS-021 remains `PARTIAL` as canonical owner/root authority, while downstream override rows DS-022 through DS-027 are closed.
- DS-021: `PARTIAL`
- DS-022: `CLOSED`
- DS-023: `CLOSED`
- DS-024: `CLOSED`
- DS-025: `CLOSED`
- DS-026: `CLOSED`
- DS-027: `CLOSED`

### Batch 4 Consolidated Completion Update - Acquisition / Current Debt Separation Authority
- Batch 4 status: `CLOSED WITH KNOWN BROADER DS-067 FOLLOW-UP`.
- No single remaining Batch 4 acquisition/current-debt authority leak was found in closure audit.
- Residual risk belongs to broader DS-067 parser-cluster cleanup, not an immediate Batch 4 authority regression.
- DS-021 was not reopened.
- DS-029: `CLOSED` (acquisition/current-debt authority in source-report-coverage QA sub-scope).
- DS-030: `CLOSED` (report-contract QA acquisition/current-debt authority and acquisition value/fee conformance sub-scope).
- DS-067: `PARTIAL` (loan-term financing-route and alias-gating sub-scopes closed; broader parser-cluster semantic/fallback consistency remains open).

## Remaining High-Risk Families
1. Broader Dashboard legacy fallback/messaging architecture for older/non-canonical jobs
2. Acquisition vs current debt separation authority
3. Broader DS-064/DS-065/DS-066 rendered/regex/generator mutation cluster closure sweep
4. QA rendered-text inference that should become conformance checks
5. Broader parser-cluster fallback/semantic consistency follow-up (DS-067)

Delivery/readiness note: Generator aliasing, worker delivery consumption, worker terminal failure/restore mechanics, Dashboard customer messaging, and report-contract QA delivery conformance are now hard-locked to canonical delivery decision state where canonical payload exists. Remaining Batch 2 risk is DS-068/DS-069 broader architecture only.
Batch 2 risk note: Batch 2 customer-facing override risk is materially reduced; DS-069 remains a broader fallback architecture cluster, not an active canonical override when `deliveryDecisionState`/`customer_message` exists.
Batch 3 risk note: Batch 3 customer-facing current-debt/refi override risk is materially reduced. Remaining acquisition/current-debt separation issues should be handled in Batch 4, not reopened under Batch 3 unless a regression proves the Batch 3 canonical gate was bypassed.
Launch-risk note: The latest launch-risk compression audit found no clear P0 launch-blocking canonical-present risk. Remaining DS-064/DS-065/DS-066 work is mostly P1/P2 hardening unless live regression proves otherwise. The next launch gate is live regression, not full decision-source ledger closure.

## Section 3 - Master Decision-Maker Inventory

Coverage note: The completed audit estimated ~132 decision-makers. This ledger captures explicit rows plus grouped row-clusters for remaining call-site expansion. Grouped rows are marked `AUDIT EXPANSION REQUIRED` where individual call sites were not yet atomized.

| ID | Family | Report scope | File | Function or region | Current decision made | Current input source | Current output/surface affected | Current authority status | Risk | Target canonical owner | Required action | Migration batch | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DS-001 | report type/tier | Both | api/generate-client-report.js | effectiveReportMode branching | screening_v1 vs v1_core/underwriting paths | request/job fields + local branching | section inclusion, copy, calculations | duplicate | critical | Decision Canonical Layer | make read-only consumer | B5 | partial | Patch 2 closed the silent explicit-unknown report_type downgrade path via `resolveReportTypeAndTier(...)` and fail-closed `400 Invalid report_type`. Underwriting aliases now normalize explicitly. Broader report type/tier branch cleanup remains partial. |
| DS-002 | report type/tier | Both | api/_lib/source-report-coverage-qa.js | isFullUnderwriting | report type from reportType/reportTier | function args | QA depth/routing flags | QA-only | high | Decision Canonical Layer | convert to QA conformance only | B5 | open | Should consume canonical report-mode state |
| DS-003 | report type/tier | Both | api/_lib/report-contract-qa.js | reportTypeIsScreening | screening contract interpretation | reportType/reportTier | contract violations | QA-only | medium | Decision Canonical Layer | convert to QA conformance only | B5 | open | Keep as conformance only |
| DS-004 | classification/verdict | Both | api/_lib/report-surface-contracts.js | normalizeVerdictLabel | score->label mapping | computed score | canonical label seed | canonical | critical | Decision Canonical Layer | keep as canonical | B1 | open | G2 materially closed visible-label consumer hardening in generator; canonical label family consumption is now mode-aware. Keep row open until broader classification family atomization is complete. |
| DS-005 | classification/verdict | Both | api/_lib/report-surface-contracts.js | buildCanonicalDisplayVerdictState | cap application (source/debt/core support) | canonical states | canonical visible label/cap metadata | canonical | critical | Decision Canonical Layer | keep as canonical | B1 | open | Primary owner candidate; G2/G6 materially hardened downstream consumers and mode-gating, but owner-row remains open pending broader row-family closure standard. |
| DS-006 | classification/verdict | Both | api/generate-client-report.js | normalizeVisibleReportClassification | visible label override chain | mixed state/local | cover/scorecard visible label | renderer-local | critical | Decision Canonical Layer | make read-only consumer | B1 | open | G2 materially closed this consumer class: mode-aware canonical label consumption, screening debt-cap leakage blocked, and source/core cap precedence preserved. |
| DS-007 | classification/verdict | Both | api/generate-client-report.js | alignDealScorecardVisibleClassificationHtml | text replacement for scorecard label | rendered HTML text | scorecard label string | renderer-local | high | Decision Canonical Layer | make read-only consumer | B1 | open | G2 materially closed cross-surface label alignment in completed scope; remaining work is wording/polish, not known authority leak. |
| DS-008 | classification/verdict | Both | api/_lib/report-contract-qa.js | visible label regex checks | infer rendered label set | rendered text | contradictions/violations | QA-only | high | Decision Canonical Layer | convert to QA conformance only | B1 | open | G5 materially closed provenance/cap authority in report-contract QA; remaining row scope is conformance taxonomy/wording polish. |
| DS-009 | scoring | Both | api/generate-client-report.js | buildDealScorecardState | composite/factor scoring and cap interactions | mixed canonical + local fallbacks | score rows/labels/explanations | duplicate | critical | Financial Canonical Layer + Decision Canonical Layer | make read-only consumer | B1 | open | Canonical score object required |
| DS-010 | scoring | Both | api/_lib/report-surface-contracts.js | verdict cap metadata path | score_label vs cap_reason relationship | canonical state | risk profile labels | canonical | high | Decision Canonical Layer | keep as canonical | B1 | open | Should be single verdict authority |
| DS-011 | core sufficiency | Both | api/_lib/report-surface-contracts.js | buildT12SufficiencyState | T12 core sufficiency bucket | parser artifacts | publishability class | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | fail-closed logic root |
| DS-012 | core sufficiency | Both | api/_lib/report-surface-contracts.js | buildRentRollSufficiencyState | rent roll sufficiency bucket | parser artifacts | publishability class | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | includes occupancy basis reasoning |
| DS-013 | core sufficiency | Both | api/_lib/report-surface-contracts.js | buildCoreInputSufficiencyState | combined core sufficiency gate | T12/rent roll + reconciliation | user/admin/deliverability influence | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | top-level core gate owner |
| DS-014 | core sufficiency | Both | api/_lib/source-report-coverage-qa.js | deterministic flag translation | convert sufficiency into flags | canonical + rendered signals | QA routing and blockers | QA-only | high | Coverage/Eligibility Layer | convert to QA conformance only | B5 | partial | Canonical guards now reduce non-canonical authority in deterministic flag translation paths; broader flag/routing family remains partial. |
| DS-015 | T12 truth | Both | api/parse/parse-doc.js | t12 parser + core validation | accept/reject T12 totals/lines | extracted text/tables + AI recovery | t12_parsed artifact | canonical | critical | Parser Canonical Layer | keep as canonical | B5 | open | core_t12_validation already present |
| DS-016 | T12 truth | Both | api/_lib/report-surface-contracts.js | resolveCanonicalT12GprSource | choose authoritative GPR field | t12 payload fields | reconciliation and downstream metrics | canonical | high | Financial Canonical Layer | keep as canonical | B5 | open | explicit precedence list |
| DS-017 | rent roll truth | Both | api/_lib/report-surface-contracts.js | resolveCanonicalRentRollAnnualMetric | annual in-place/market truth selection | rent roll totals/rows/sample signals | rr annual totals | canonical | critical | Financial Canonical Layer | keep as canonical | B5 | open | key anti-drift authority |
| DS-018 | rent roll truth | Both | api/_lib/report-surface-contracts.js | resolveCanonicalRentRollAnnualTotals | combined in-place + market totals | canonical metric resolver | rent totals for reconciliation/rendering | canonical | critical | Financial Canonical Layer | keep as canonical | B5 | open | used by source reconciliation state |
| DS-019 | rent roll truth | Both | api/generate-client-report.js | resolveSafeAnnualRentTotal | alternate rent total fallback | local heuristic | displayed rent totals | legacy | critical | Financial Canonical Layer | quarantine | B5 | open | duplicate with canonical resolver |
| DS-020 | rent roll truth | Both | api/_lib/report-contract-qa.js | occupancy extraction regex | infer occupancy from rendered text | rendered text | violation findings | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B5 | open | false positive risk demonstrated |
| DS-021 | debt/refi truth | Both | api/_lib/report-surface-contracts.js | buildCurrentDebtAssessmentState | current debt assessed/not assessed + reason codes | mortgage/loan/t12 artifacts | debt status, DSCR state, explanations | canonical | critical | Financial Canonical Layer + Decision Canonical Layer | keep as canonical | B3 | partial | Canonical owner remains PARTIAL by design. G6 Final Sweep demoted QA inventory booleans so inventory-only evidence cannot create computed current debt, DSCR, or refi eligibility; payload-backed explicit current-debt evidence is required. |
| DS-022 | debt/refi truth | Both | api/generate-client-report.js | resolveCanonicalCurrentDebtScoreInputs | DSCR score input selection | canonical + legacy fallback | scorecard DSCR row | duplicate | critical | Financial Canonical Layer | make read-only consumer | B3 | closed | Scorecard DSCR consumes canonical current-debt state. If canonical debt exists and is not computed, no numeric DSCR is backfilled from legacy fallback. |
| DS-023 | debt/refi truth | Both | api/generate-client-report.js | resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback | fallback DSCR compute | mortgage payload + T12 NOI | debt metrics fallback | legacy | high | Financial Canonical Layer | quarantine | B3 | closed | resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback(...) retained only for canonical-absent compatibility through score-input bridge; cannot override canonical not-assessed state. |
| DS-024 | debt/refi truth | Both | api/generate-client-report.js | resolveCanonicalRefiDebtBasis | determine refi debt basis and acquisition-only condition | currentDebtState + artifacts + financials | refi gates/copy/eligibility | duplicate | critical | Financial Canonical Layer | make read-only consumer | B3 | closed | resolveCanonicalRefiDebtBasis(...) obeys canonical current-debt state. Non-computed canonical state returns no true debt balance, annual debt service, or DSCR; computed state uses canonical balance/service/DSCR. |
| DS-025 | debt/refi truth | Both | api/generate-client-report.js | buildRefiDebtRenderState | valid/source-limited/not-assessed gate | refi basis + debt signals | refi section render behavior | renderer-local | critical | Coverage/Eligibility Layer + Decision Layer | make read-only consumer | B3 | closed | buildRefiDebtRenderState(...) allows debt/refi math only when canonical debt is computed/eligible. Acquisition-only, source-limited, and not-assessed paths remain non-quantitative. |
| DS-026 | debt/refi truth | Both | api/generate-client-report.js | resolveRefiNarrativeMode | explanatory mode classification | render state + booleans | narrative copy | renderer-local | high | Decision Canonical Layer | make read-only consumer | B3 | closed | resolveRefiNarrativeMode(...) cannot independently upgrade not-assessed/source-limited state into assessed-style current-debt/refi messaging; assessed narrative requires valid canonical render state. |
| DS-027 | debt/refi truth | Both | api/_lib/report-contract-qa.js | extractCurrentDebtDscrValues | parse rendered DSCR values | rendered text | QA blockers | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B3 | closed | extractCurrentDebtDscrValues(...) is evidence-only. report-contract QA resolves canonical current-debt state first, checks rendered DSCR/refi surfaces for conformance, and uses artifact/inventory debt heuristics only as canonical-absent fallback. |
| DS-028 | acquisition vs current debt | Underwriting | api/_lib/report-surface-contracts.js | buildAcquisitionAssumptionState | validated acquisition assumptions and separation semantics | loan terms + taxonomy + debt state | acquisition state | canonical | critical | Financial Canonical Layer | keep as canonical | B4 | open | G6 Slice 1 removed rendered acquisition signals as support authority; `acquisition_financing_rendered` is metadata only. Canonical acquisition support/separation now derives from semantics + validated fields + debt separation state. |
| DS-029 | acquisition vs current debt | Underwriting | api/_lib/source-report-coverage-qa.js | acquisition_financing_assumptions rendered signal logic | rendered evidence of acquisition section | rendered text signals | coverage flags | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B4 | closed | Source-coverage QA is canonical-first when `currentDebtState`/`acquisitionAssumptionState` exists; rendered text and filename/doc_type cues are evidence/conformance only; local heuristics are legacy fallback only when canonical state is absent; no report-specific hardcoding. |
| DS-030 | acquisition vs current debt | Underwriting | api/_lib/report-contract-qa.js | contamination checks | detect acquisition/current debt drift | rendered text + artifacts | blocking violations | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B4 | closed | QA uses canonical acquisition/current-debt state first; acquisition/current-debt separation, acquisition value drift, purchase price/loan mismatch, and lender-fee omission checks are canonical-first; closing-cost notes remain fallback-only until canonical closing-cost fields exist; rendered text is conformance evidence only; artifact fallback is allowed only when canonical state is absent. |
| DS-031 | DCF/cap-rate provenance | Underwriting | api/generate-client-report.js | cap-source label resolver | appraisal/support/framework defaults | cap-rate source labels | renderer-local | critical | Financial Canonical Layer | make read-only consumer | B5 | open | overclaim drift family |
| DS-032 | DCF/cap-rate provenance | Underwriting | api/_lib/report-contract-qa.js | exit-cap overclaim checks | rendered text regex | violations/public blockers | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B5 | open | validated in Slice 6 calibration |
| DS-033 | property tax truth | Underwriting | api/parse/parse-doc.js | property_tax parser/recovery | annual tax acceptance thresholds + AI validation | text/tables | property_tax_parsed artifact | canonical | critical | Parser Canonical Layer + Financial Layer | keep as canonical | B5 | open | includes implausible tax rejection |
| DS-034 | property tax truth | Underwriting | api/_lib/full-underwriting-state.js | buildPropertyTaxBindingState | tax binding reliability | propertyTaxPayload file id/name/tax | binding state used in docs/coverage | duplicate | medium | Parser Canonical Layer | make read-only consumer | B5 | open | keep if strictly derived from canonical payload |
| DS-035 | support-doc treatment | Both | api/_lib/report-surface-contracts.js | buildSupportDocTaxonomyState | semantic role/display label classification | payload + filename/text fallbacks | doc treatment summary and downstream gating | canonical | critical | Parser Canonical Layer | keep as canonical | B5 | open | must be sole semantic role authority |
| DS-036 | support-doc treatment | Both | api/parse/parse-doc.js | inferSupportingDocTypeFromText and related helpers | initial doc classification | extracted text + filename heuristics | parser artifact type selection | duplicate | high | Parser Canonical Layer | make read-only consumer | B5 | open | align with taxonomy contract |
| DS-037 | support-doc treatment | Both | api/generate-client-report.js | filename fallback document treatment paths | infer role from filename text | filename heuristic | treatment labels/context copy | legacy | high | Parser Canonical Layer | quarantine | B5 | open | multiple filename_fallback reason codes |
| DS-038 | renovation/CapEx truth | Underwriting | api/parse/parse-doc.js | renovation parsing/recovery | structured capex/forward assumptions extraction | text/tables + AI | renovation_parsed artifact | canonical | high | Parser Canonical Layer + Financial Layer | keep as canonical | B5 | open | forward-looking vs historical distinction |
| DS-039 | renovation/CapEx truth | Underwriting | api/generate-client-report.js | resolveRenovationDisplayMode / display copy builders | determine modeled vs display-only | mixed canonical + local checks | renovation sections/copy | renderer-local | high | Coverage/Eligibility Layer | make read-only consumer | B5 | open | should consume canonical renovation state |
| DS-040 | section eligibility/rendering | Underwriting | api/_lib/report-surface-contracts.js | UNDERWRITING_SECTION_BLUEPRINTS + buildFullUnderwritingSectionEligibility | eligible/omitted/constrained/underused decision | artifact inventory + debt + reconciliation | render/collapse/omission contract | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | G6 Slice 1 removed rendered headings as section-eligibility authority; `rendered_observed` is now observational/conformance metadata only. |
| DS-041 | section eligibility/rendering | Both | api/_lib/source-report-coverage-qa.js | buildRenderedSections | infer section presence from HTML headings | rendered HTML | QA section-depth flags | QA-only | high | Coverage/Eligibility Layer | convert to QA conformance only | B5 | closed | Canonical section eligibility is authoritative when present; rendered section presence is conformance/evidence only. Behavioral tests cover canonical omitted/eligible and heading present/missing paths. |
| DS-042 | section eligibility/rendering | Both | api/generate-client-report.js | screening/underwriting section stripping/replacements | mode branches + local guards | final html surfaces | renderer-local | high | Coverage/Eligibility Layer | make read-only consumer | B5 | closed | Generator section gating is canonical-first for patched section family; final `SECTION_4_NEIGHBORHOOD` unconditional strip leak was fixed via canonical `market_context` guard with behavioral proof and canonical-absent fallback preservation. |
| DS-043 | Data Coverage | Both | api/generate-client-report.js | data coverage headline/severity assignment | mode + reconciliation + section counts | Data Coverage customer copy/headline | renderer-local | high | Coverage/Eligibility Layer + Decision Layer | make read-only consumer | B5 | closed | Data Coverage headline/severity uses canonical-first bridge; behavioral tests prove canonical beats fallback and fallback applies only when canonical is absent. |
| DS-044 | Data Coverage | Both | api/_lib/report-contract-qa.js | data coverage taxonomy drift checks | rendered text + coverage state | violations | QA-only | medium | Coverage/Eligibility Layer | convert to QA conformance only | B5 | open | retain as conformance check |
| DS-045 | QA systems | Both | api/generate-client-report.js | QA orchestration chain | rendered qa + source coverage + contract + director + action plan | analysis artifacts + gate seed | duplicate | critical | Decision Canonical Layer | make read-only consumer | B2 | open | orchestration should consume single decision_state |
| DS-046 | QA systems | Both | api/_lib/qa-action-plan.js | buildQaActionPlan | route actions + summary readiness | multiple QA artifacts | action plan/readiness summary | duplicate | critical | Decision Canonical Layer | make read-only consumer | B2 | partial | G7 Slice 1 materially closed consumer demotion: canonical-present paths now mirror canonical delivery state; local readiness synthesis is canonical-absent fallback only. |
| DS-047 | delivery/readiness | Both | api/_lib/qa-action-plan.js | buildPublishEligibilitySummary | customer/public/outreach readiness + blockers | deterministic flags + violations + actions | publishability/readiness flags | canonical | critical | Decision Canonical Layer | keep as canonical | B2 | partial | G7 Slice 2A materially closed canonical-consumer boundary: canonical-present readiness mirrors canonical delivery state; blocker/advisory/regeneration/source-limitation outputs remain diagnostic metadata under canonical-present authority. |
| DS-048 | delivery/readiness | Both | api/_lib/qa-action-plan.js | buildDeliveryGateDecision | deliverable/admin_review/user_needs_documents | canonical publish summary + sufficiency | delivery_gate_decision artifact | canonical | critical | Decision Canonical Layer | keep as canonical | B2 | partial | G7 Slice 2B + Slice 3 audit materially closed canonical-present consumer boundary: accepts canonical delivery state shapes and mirrors canonical gate truth fields when present; legacy gate-owner behavior is preserved only for canonical-absent artifacts. |
| DS-049 | delivery/readiness | Both | api/generate-client-report.js | gate response + hold delivery handling | delivery_gate_decision + local checks | API response, publication hold | duplicate | high | Decision Canonical Layer | make read-only consumer | B2 | closed | compatibility aliases derived from canonical deliveryDecisionState |
| DS-050 | delivery/readiness | Both | api/admin-run-worker.js | status transitions by generator response | reportData + statuses | analysis_jobs lifecycle | worker-local | critical | Decision Canonical Layer | make read-only consumer | B2 | closed | canonical-first resolver; legacy fields fallback-only when canonical absent |
| DS-051 | fail closed / restore credit | Both | api/admin-run-worker.js | restoreEntitlementForFailedJob / failure handling | worker events + status + purchase rows | credit restoration behavior | canonical | high | Worker Layer | keep as canonical | B2 | closed | `applyTerminalFailureOutcome(...)` centralizes terminal failure updates; `restoreEntitlementForFailedJob(...)` remains sole entitlement restore authority; `recordJobFailure(...)` routes through terminal helper. |
| DS-052 | delivery/readiness | Both | api/_lib/report-contract-qa.js | readiness payload checks | QA payload nesting/flags | blockers/public readiness findings | QA-only | medium | Decision Canonical Layer | convert to QA conformance only | B2 | closed | canonical-first precedence; legacy readiness inputs conformance-only when canonical exists |
| DS-053 | rendered-text parsing | Both | api/_lib/report-contract-qa.js | stripHtml + extract helpers | text parsing for DSCR/occupancy/variance | violations and blocker severities | QA-only | high | QA Layer | convert to QA conformance only | B1-B5 | open | remove truth inference intent |
| DS-054 | rendered-text parsing | Both | api/_lib/source-report-coverage-qa.js | findRenderedSignals | infer semantic report signals | rendered text regex | deterministic flags | QA-only | high | QA Layer | convert to QA conformance only | B1-B5 | open | replace signal truth with state checks |
| DS-055 | rendered-text parsing | Both | api/_lib/qa-manager-review.js | decision suppression heuristics | rendered text + artifact context | manager review classifications | QA-only | medium | QA Layer | convert to QA conformance only | B2 | open | preserve as advisory conformance |
| DS-056 | source reconciliation truth | Both | api/_lib/report-surface-contracts.js | buildSourceReconciliationState | variance status and bucket | canonical rent totals + T12 GPR + parser signals | reconciliation status/disclosure/publishability | canonical | critical | Coverage/Eligibility Layer + Financial Layer | keep as canonical | B5 | open | G6 Final Sweep demoted deterministic flag escalation: material RR/T12 variance stays `source_reconciliation_required` disclose-only unless core sufficiency fails elsewhere; parser/artifact flags remain diagnostic metadata. |
| DS-057 | source reconciliation render guard | Both | api/generate-client-report.js | applyFinalSourceReconciliationRenderGuard | stale variance text cleanup | rendered HTML + canonical variance | final HTML sanitization | renderer-local | medium | Renderer Layer | quarantine | B5 | open | keep only as safety sanitizer |
| DS-058 | parser extraction state | Both | api/parse/extract-job-text.js | parse_status extracted/failed/skipped decisions | file type + parse success | job file parse status | canonical | medium | Parser Canonical Layer | keep as canonical | B5 | open | upstream pipeline authority |
| DS-059 | dashboard/customer status | Both | src/pages/Dashboard.jsx | getCustomerFacingJobStatus | map job status to user label | analysis_jobs status fields | customer-facing status labels | dashboard-local | critical | Dashboard Layer consuming Decision Layer | make read-only consumer | B2 | closed | Dashboard customer status labels use canonical `customer_status_label` when available; legacy status mapping is fallback-only. |
| DS-060 | dashboard/customer status | Both | src/pages/Dashboard.jsx | needsDocumentsMessage builder | infer missing docs from error_code/files | job + events + file parse statuses | failed-state copy | dashboard-local | high | Dashboard Layer consuming Decision Layer | make read-only consumer | B2 | closed | Canonical `customer_message` wins; needs-doc/message fallback is non-authoritative fallback-only. |
| DS-061 | dashboard/customer status | Both | src/pages/Dashboard.jsx | getFailedFileGuidance | generate failure guidance narratives | file metadata + status heuristics | customer failed-state guidance | dashboard-local | high | Dashboard Layer consuming Decision Layer | make read-only consumer | B2 | closed | Failed-file guidance is suppressed when canonical `customer_message` exists; legacy parse/file guidance is fallback-only. |
| DS-062 | dashboard/customer status | Both | src/pages/Dashboard.jsx | underwriting support-doc preflight checks | block submit on doc mix | client-side upload set | launch-time UX gate | dashboard-local | medium | Coverage/Eligibility Layer | make read-only consumer | B5 | open | should mirror server canonical requirements |
| DS-063 | launch positioning context | Both | src/pages/Pricing.jsx | static policy/pricing/disclaimer copy | hardcoded policy text | customer messaging | renderer-local | low | Product policy docs | make read-only consumer | N/A | open | no change approved in this ledger stage |
| DS-064 | AUDIT EXPANSION REQUIRED - generator decision cluster | Both | api/generate-client-report.js | multiple helpers exported in __test__ (state/render/math/copy gates) | mixed | many report surfaces | duplicate cluster | critical | Family-specific canonical owners | AUDIT EXPANSION REQUIRED - enumerate remaining individual call sites before migration | B1-B5 | partial | G1/G2 materially closed generator strip/classification consumer authority in the current grouped campaign. Residual broader generator mutation family remains partial as future/post-launch hardening unless live regression exposes a blocker. |
| DS-065 | AUDIT EXPANSION REQUIRED - contract QA regex cluster | Both | api/_lib/report-contract-qa.js | additional regex-based inference sites | rendered text | violation severity/block flags | QA-only cluster | high | QA Layer | AUDIT EXPANSION REQUIRED - enumerate regex truth-inference call sites | B1-B5 | partial | G5 materially closed provenance/cap authority: coverage/current-debt/verdict-cap inference requires explicit provenance, and fallback/unprovenanced states no longer force canonical expected caps. Broader regex/taxonomy polish remains partial. |
| DS-066 | AUDIT EXPANSION REQUIRED - source coverage QA cluster | Both | api/_lib/source-report-coverage-qa.js | additional rendered depth and file-signal checks | files + rendered text | deterministic flags/routing | QA-only cluster | high | QA Layer | AUDIT EXPANSION REQUIRED - enumerate all flag producers by family | B1-B5 | partial | Batch 6E tightened provenance authority. G4 materially hardened canonical-first depth/signal behavior with `CURRENT_DEBT_CANONICAL_RENDER_STATE_DRIFT`, `ACQUISITION_CURRENT_DEBT_CANONICAL_CONFORMANCE_DRIFT`, and `UNDERWRITING_RENDERED_DEPTH_CONFORMANCE_FAILURE`. Rendered/file/artifact signals are conformance/evidence when canonical authority exists, with legacy fallback retained for canonical-absent paths. Broader deterministic-flag cluster remains partial. |
| DS-067 | AUDIT EXPANSION REQUIRED - parser recovery cluster | Both | api/parse/parse-doc.js | AI fallback + deterministic fallback branch points | extracted text/tables | parser artifacts and diagnostics | duplicate cluster | medium | Parser Canonical Layer | AUDIT EXPANSION REQUIRED - enumerate per-doc recovery authority points | B5 | partial | Closed sub-scopes include prior Batch 4 hardening plus Patch 1/1B current-debt support routing/promotion alignment: explicit non-acquisition debt terms route to `loan_term_sheet` and promote current-debt aliases via `resolveLoanTermCurrentDebtPromotion(...)`, while acquisition/proposed support remains separated. Broader parser-cluster fallback/semantic consistency remains open. |
| DS-068 | AUDIT EXPANSION REQUIRED - worker status machine cluster | Both | api/admin-run-worker.js | repeated status transition paths and branch checks | job state + response payload | published/failed/publishing transitions | worker-local cluster | high | Worker Layer consuming Decision Layer | AUDIT EXPANSION REQUIRED - enumerate all status branch decision sites | B2 | partial | G8 materially closed delivery authority sub-scope: publish path now requires resolved permission (`holdDelivery === false` and `customerDeliveryAllowed === true`), typed hold outcomes remain preserved, and fail-closed/credit-restore safety remains intact. Broader worker lifecycle architecture remains partial. |
| DS-069 | AUDIT EXPANSION REQUIRED - dashboard messaging cluster | Both | src/pages/Dashboard.jsx | failed-state and guidance copy branches | error/status/events | customer messaging | dashboard-local cluster | high | Dashboard Layer consuming Decision Layer | AUDIT EXPANSION REQUIRED - enumerate all customer state recompute branches | B2 | partial | G8 closure audit confirmed canonical-first customer status/message behavior where canonical state exists. Legacy dashboard fallback remains canonical-absent compatibility for older jobs. Broader dashboard messaging architecture remains partial. |
| DS-070 | AUDIT EXPANSION REQUIRED - test-driven implicit decision clusters | Both | tests/qa/* | invariant clusters implying production decisions | tests + fixture assumptions | regression expectations | legacy reference cluster | low | N/A (tests) | quarantine (reference-only) | N/A | open | Use as map only; not authority |

Inventory count note: Explicit rows above: 70 row entries/groups. Combined with grouped expansion clusters, this ledger currently maps the audit-estimated ~132 decision-makers at family and call-site-cluster level. Remaining atomization is explicitly tracked as `AUDIT EXPANSION REQUIRED` rows.
## Section 4 - Duplicate Truth-Maker Map

### 4.1 Classification / visible verdict
- Current duplicate authorities:
  - `buildCanonicalDisplayVerdictState`
  - `normalizeVisibleReportClassification`
  - HTML text replacement for scorecard label
  - regex-based label inference in contract QA
- Desired sole canonical owner: Decision Canonical Layer (`visible_classification_state`).
- Surfaces that must obey it: cover, executive summary, deal scorecard, risk register, Data Coverage severity language.
- QA role after migration: confirm rendered labels equal canonical labels and cap reasons.
- Migration risk: critical customer/public drift if partial migration only.
- First safe batch: Batch 1.

### 4.2 Delivery / readiness
- Current duplicate authorities:
  - `buildPublishEligibilitySummary`
  - `buildDeliveryGateDecision`
  - generator hold/publication checks
  - worker status reinterpretation
  - dashboard status/error-code message recompute
- Desired sole canonical owner: Decision Canonical Layer (`delivery_gate_decision`).
- Surfaces that must obey it: generator response, worker transitions, dashboard states/copy.
- QA role after migration: verify response/job/dashboard conformance to gate payload.
- Migration risk: critical publish/hold inconsistency.
- First safe batch: Batch 2.

### 4.3 Current debt / refi
- Current duplicate authorities:
  - `buildCurrentDebtAssessmentState`
  - generator refi render state helpers
  - legacy fallback DSCR function
  - regex-based DSCR truth inference in QA
- Desired sole canonical owner: Financial Canonical Layer (`current_debt_refi_state`).
- Surfaces that must obey it: debt header/body, DSCR rows, scorecard, sensitivity sections, limitation copy.
- QA role after migration: compare rendered DSCR/labels to canonical state only.
- Migration risk: critical contradiction between not-assessed and numeric DSCR display.
- First safe batch: Batch 3.

### 4.4 Acquisition vs current debt
- Current duplicate authorities:
  - acquisition assumption state
  - parser semantic role/fallback role logic
  - rendered-signal based QA checks
- Desired sole canonical owner: Financial Canonical Layer (`acquisition_financing_state` + separation flags).
- Surfaces that must obey it: acquisition table render/collapse, debt exclusion copy, refi exclusion logic.
- QA role after migration: conformance check for separation and table values.
- Migration risk: critical contamination of current debt truth.
- First safe batch: Batch 4.

### 4.5 Section eligibility
- Current duplicate authorities:
  - `buildFullUnderwritingSectionEligibility`
  - rendered heading detection in source coverage QA
  - renderer branch stripping/injection
- Desired sole canonical owner: Coverage/Eligibility Layer (`section_eligibility_state`).
- Surfaces that must obey it: render/collapse/omit decisions.
- QA role after migration: verify section presence matches eligibility contract.
- Migration risk: high underused/omitted surface drift.
- First safe batch: Batch 5.

### 4.6 Data Coverage
- Current duplicate authorities:
  - canonical coverage states
  - renderer-assigned headline/severity modes
  - QA regex taxonomy checks
- Desired sole canonical owner: Coverage/Eligibility Layer + Decision Layer (`data_coverage_state`).
- Surfaces that must obey it: data coverage headline, limitations body, severity badges.
- QA role after migration: conformance only.
- Migration risk: high customer trust language drift.
- First safe batch: Batch 5.

### 4.7 Support-doc treatment
- Current duplicate authorities:
  - taxonomy state builder
  - parser text-based inferred doc type fallbacks
  - renderer filename fallback reason-code labels
- Desired sole canonical owner: Parser Canonical Layer (`support_doc_taxonomy_state`).
- Surfaces that must obey it: document-treatment tables, modeled/limited/listed labels.
- QA role after migration: detect treatment drift from taxonomy.
- Migration risk: high contamination risk.
- First safe batch: Batch 5.

### 4.8 Rent roll annual totals
- Current duplicate authorities:
  - canonical rent-roll metric resolver
  - generator local safe-rent fallback resolver
- Desired sole canonical owner: Financial Canonical Layer (`rent_roll_annual_totals`).
- Surfaces that must obey it: reconciliation variance, scoring inputs, rent sections.
- QA role after migration: compare rendered totals with canonical totals.
- Migration risk: critical reconciliation drift.
- First safe batch: Batch 5.

### 4.9 T12 operating truth
- Current duplicate authorities:
  - parser accepted T12 values
  - renderer conditional/fallback math paths
  - QA rendered-text inferencing
- Desired sole canonical owner: Parser + Financial Canonical Layers (`t12_operating_state`).
- Surfaces that must obey it: operating statement, NOI/ratio metrics, score factors.
- QA role after migration: conformance against canonical T12 state.
- Migration risk: high model credibility drift.
- First safe batch: Batch 5.

### 4.10 DCF / cap-rate provenance
- Current duplicate authorities:
  - renderer cap-source logic and labels
  - contract QA overclaim detection regex
- Desired sole canonical owner: Financial Canonical Layer (`valuation_assumption_state`).
- Surfaces that must obey it: DCF section labels and cap provenance notes.
- QA role after migration: overclaim conformance check only.
- Migration risk: high public/sample blocker risk.
- First safe batch: Batch 5.

### 4.11 Property tax
- Current duplicate authorities:
  - property_tax parser acceptance
  - full-underwriting-state binding interpretation
  - renderer/document treatment fallback labels
- Desired sole canonical owner: Parser Canonical + Financial Layers (`property_tax_state` with source identity).
- Surfaces that must obey it: modeled tax rows, treatment labels, coverage notes.
- QA role after migration: source-binding conformance checks.
- Migration risk: medium/high contamination risk.
- First safe batch: Batch 5.

### 4.12 Renovation / CapEx
- Current duplicate authorities:
  - parser renovation artifact truth
  - renderer display-mode/collapse copy heuristics
- Desired sole canonical owner: Financial Canonical + Coverage/Eligibility Layers (`renovation_state`).
- Surfaces that must obey it: renovation section visibility and wording.
- QA role after migration: conformance only.
- Migration risk: medium/high false-modeling risk.
- First safe batch: Batch 5.

### 4.13 Dashboard customer status
- Current duplicate authorities:
  - worker status transitions
  - dashboard status/error message recompute
  - gate payload not consistently authoritative in UI
- Desired sole canonical owner: Decision Canonical Layer (`customer_status_state` derived from delivery gate).
- Surfaces that must obey it: status badge, failed-state guidance, needs-doc messaging.
- QA role after migration: UI conformance checks to canonical payload.
- Migration risk: critical customer-facing mismatch risk.
- First safe batch: Batch 2.

## Section 5 - Canonical Authority Target Model

### Parser Canonical Layer
- typed artifacts
- source file identity
- semantic role metadata
- validator outcomes

### Financial Canonical Layer
- operating/T12
- rent roll
- current debt
- acquisition
- property tax
- valuation/cap-rate
- renovation where supported

### Coverage / Eligibility Layer
- core sufficiency
- optional/support constraints
- section eligibility
- Data Coverage class

### Decision Canonical Layer
- visible classification
- score/risk profile
- delivery/readiness
- customer/public/high-value gates
- diagnostics

### Renderer Layer
- formatting only
- no independent classification
- no independent financial calculations
- no independent source labels
- no independent section eligibility

### QA Layer
- state-to-render conformance
- public language checks
- contradiction detection
- not primary truth authority

### Worker Layer
- executes canonical gate/status
- does not reinterpret business truth

### Dashboard Layer
- displays canonical customer status/guidance
- does not recompute business meaning from raw error codes
## Section 6 - Migration Batch Plan

### Batch 1 - Classification / Visible Verdict Authority
- Objective: One canonical classification/verdict decision consumed by cover, executive summary, scorecard, and risk surfaces, with QA expected labels aligned.
- Ledger rows affected: DS-004, DS-005, DS-006, DS-007, DS-008, DS-053, DS-064, DS-065.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/generate-client-report.js`, `api/_lib/report-contract-qa.js`, possibly `api/_lib/full-underwriting-state.js`.
- Production invariant: one `visible_classification_state` object drives all rendered labels.
- Must become non-authoritative: renderer label overrides, regex truth inference.
- Tests required: visible label cross-surface conformance, cap reason conformance, no conflicting labels.
- Anti-hardcode proof required: no property/report-id/file-name conditional label branching.
- Rollback/safety notes: if drift appears, fail closed to canonical `Review` class without local overrides.

### Batch 2 - Delivery / Readiness Authority
- Objective: One `delivery_gate_decision` consumed by generator, qa_action_plan outputs, worker, and dashboard.
- Ledger rows affected: DS-045, DS-046, DS-047, DS-048, DS-049, DS-050, DS-052, DS-059, DS-060, DS-061, DS-068, DS-069.
- Files likely affected: `api/_lib/qa-action-plan.js`, `api/generate-client-report.js`, `api/admin-run-worker.js`, `src/pages/Dashboard.jsx`, `api/_lib/report-contract-qa.js`.
- Production invariant: `delivery_gate_status` and readiness flags are interpreted once.
- Must become non-authoritative: worker/dashboard reinterpretation from status/error-code fragments.
- Tests required: gate->worker->dashboard conformance matrix for deliverable/admin_review/user_needs_documents.
- Anti-hardcode proof required: no bespoke error-code message trees overriding canonical gate reason.
- Rollback/safety notes: preserve credit-restore safety path; do not loosen fail-closed blockers.

### Batch 3 - Current Debt / Refi Authority
- Objective: One current debt/refi state controls all headers, DSCR, debt body, scorecard, sensitivity, and QA.
- Ledger rows affected: DS-021, DS-022, DS-023, DS-024, DS-025, DS-026, DS-027.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/generate-client-report.js`, `api/_lib/report-contract-qa.js`, `api/_lib/source-report-coverage-qa.js`.
- Production invariant: no numeric current-debt DSCR surfaces when canonical status is not computed.
- Must become non-authoritative: `LEGACY_DO_NOT_USE` fallback and render-time debt reclassification.
- Tests required: assessed/not-assessed matrix across clean debt, no-debt, acquisition-only, partial terms.
- Anti-hardcode proof required: no property/document-specific debt exceptions.
- Rollback/safety notes: default to not-assessed with canonical limitation reason if state is uncertain.

### Batch 4 - Acquisition / Current Debt Separation Authority
- Objective: One acquisition/proposed financing state prevents acquisition terms becoming current debt and controls table render/collapse behavior.
- Ledger rows affected: DS-028, DS-029, DS-030, DS-036, DS-037, DS-067.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/parse/parse-doc.js`, `api/generate-client-report.js`, `api/_lib/report-contract-qa.js`, `api/_lib/source-report-coverage-qa.js`.
- Production invariant: acquisition assumptions never populate current debt balance/DSCR authority.
- Must become non-authoritative: rendered-text-based acquisition contamination truth logic.
- Tests required: acquisition-only, mixed docs, noisy text, contradictory loan text collapse behavior.
- Anti-hardcode proof required: no filename/property special-casing for acquisition promotion/suppression.
- Rollback/safety notes: collapse acquisition table to conservative limited disclosure on ambiguity.

### Batch 5 - Section Eligibility + Data Coverage Authority
- Objective: One section/data coverage decision layer controls render/collapse/omit and headline/severity, with QA conformance-only checks.
- Ledger rows affected: DS-001, DS-011..DS-020, DS-031..DS-044, DS-056..DS-058, DS-062, DS-064..DS-066.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/generate-client-report.js`, `api/_lib/source-report-coverage-qa.js`, `api/_lib/report-contract-qa.js`, `api/_lib/full-underwriting-state.js`.
- Production invariant: renderer does not independently decide section eligibility or data coverage severity.
- Must become non-authoritative: rendered-section regex inference and local section headline computation.
- Tests required: section eligibility matrix for Screening + Underwriting across core/optional/reconciliation/parser_suspected conditions.
- Anti-hardcode proof required: no per-report/per-property section force-show/hide logic.
- Rollback/safety notes: on uncertainty, prefer canonical constrained/omitted with explicit limitation disclosure.

## Section 7 - Screening Launch Protection Track
- Screening remains possible as first public launch path.
- Screening does not need completion of every Full Underwriting family, but shared decision-sprawl must be controlled.
- Screening-specific required checks:
  1. classification has one authority
  2. data coverage headline has one authority
  3. section eligibility is canonical/pre-render
  4. dashboard copy uses canonical gate/status payload
  5. underwriting debt/refi/acquisition language cannot leak into Screening
  6. public sample paths are fixed before launch
- No `Pricing.jsx` change is approved from this ledger alone.

## Section 8 - Full Underwriting Pause Doctrine
- Full Underwriting public self-serve remains paused.
- Full Underwriting may remain controlled beta/invite-only/operator-reviewed while architecture consolidation proceeds.
- Customer-deliverable does not equal public/sample/high-value ready.
- Do not create public underwriting sample PDFs from flawed reports.

## Section 9 - Working Rules for Every Future Patch
- micro-scoped
- one batch or sub-batch at a time
- audit-backed
- production root cause first
- tests after production fix
- no report-specific hacks
- no hardcoded property names / filenames / report IDs / one-off fixture values
- no public AI wording
- no BUY/SELL/HOLD language
- no broad refactor unless explicitly approved
- no casual new serverless/API route files because of Vercel Hobby function-count constraint
- receipt required every time

## Section 10 - Receipt Template for Future Codex Patches
- A. Files changed
- B. Ledger rows addressed
- C. Canonical authority selected/created
- D. Duplicate authority removed/quarantined/made read-only
- E. Renderer consumption proof
- F. QA changed from truth inference to conformance check, if applicable
- G. Tests added/updated
- H. Validation commands run
- I. Anti-hardcode proof
- J. Anything intentionally not touched
- K. Remaining ledger rows in this family
# June 2, 2026 Addendum - Publish-or-Fail Doctrine Lock Completed

## Checkpoint
- Batch status: `CLOSED / PASS WITH KNOWN SAFE INTERNAL LEGACY`.
- Scope completed: qa-action-plan (Slice 1/1B), generate-client-report (Slice 2), admin-run-worker (Slice 3), Dashboard (Slice 4/4B), AdminDashboard (Slice 5), final repo-search audit.

## Locked Customer Outcome Doctrine
- Ordinary customer outcomes only:
1. `PUBLISH / READY`
2. `FAIL CLOSED + CREDIT RESTORED`
3. Normal processing lifecycle states while generation runs (`queued`, `extracting`, `underwriting`, `scoring`, `rendering`, `pdf_generating`, `publishing`)
- Forbidden as ordinary customer lifecycle outcomes:
  - admin/under/internal review
  - held/review limbo
  - needs-documents limbo
  - publication-held lifecycle framing
  - upload-more-documents/resume messaging on active jobs

## Sub-scope Validation Notes
- Deprecated `admin_review_required` is no longer an ordinary customer lifecycle endpoint; normalization is reason-aware.
- `user_needs_documents` retained only as internal legacy fail-closed alias for required core-document failures.
- Generator/worker/dashboard/admin surfaces now align to publish-or-fail for ordinary customer-facing lifecycle behavior.
- One late Dashboard review-language leak (`24 business hours` framed as review) was removed and replaced with processing-only timing copy.

## Next Recommended Action
1. Controlled clean Screening live lifecycle retest.
2. Verify Dashboard processing copy and statuses.
3. Verify published report appears and downloads normally.
4. Verify no customer-facing review/hold/needs-doc limbo wording.
5. Then controlled Underwriting lifecycle retest.

If new issues appear, open the next hardening family from concrete evidence only.
## June 3, 2026 Addendum

- Legacy Kill Slice A/A2 complete: `qa-action-plan` delivery authority cleaned, `generate-client-report` delivery aliases cleaned, and `admin-run-worker` canonical worker delivery gate cleaned.
- Canonical `deliveryDecisionState` is the live authority when present; legacy aliases and compatibility mirrors cannot decide publish, hold, fail-closed, or credit restore.
- Legacy Kill Slice B complete: support-doc and filename fallback authority demoted to diagnostic/display-only.
- Filename/doc-type fallback cannot create modeled property-tax support, current-debt truth, section unlocks, DCF/refi/waterfall/advanced modeling, or renovation/acquisition modeled authority.
- Validated parsed payload and canonical taxonomy remain controlling authority.
- Legacy Kill Slice C complete: `AdminDashboard` and `queue-metrics` lifecycle wording cleaned; remaining admin review and needs-documents terms are internal triage/diagnostic wording only, not customer lifecycle authority.
- Final no-change verification audit complete: no decision-capable legacy fallback remnants found in live paths reviewed.
- Remaining legacy/compatibility strings are inert diagnostics, compatibility mirrors, historical compatibility, or internal triage labels only.
- Doctrine preserved: normal customer outcome is publish or fail-closed with credit restored; fail-closed only for unusable, missing, contradictory core T12 or Rent Roll, or catastrophic system, storage, or PDF failure.
- Optional or support issues collapse, omit, qualify, or disclose; admin review is not a normal customer outcome.
- Proposed or acquisition financing cannot become current debt; appraisal is valuation/context only.
- Property-tax support can corroborate the T12 tax line only when validated and bound, and must not override modeled T12 values.
- Codex usage remains limited until June 8; future prompts should stay tight.
- No DocRaptor flip.
- No public samples created.
- No pricing or Stripe changes.
- No SQL or RPC changes.
- No new API or serverless routes.
- Next step after docs update: controlled live retesting from the clean legacy-fallback checkpoint.
