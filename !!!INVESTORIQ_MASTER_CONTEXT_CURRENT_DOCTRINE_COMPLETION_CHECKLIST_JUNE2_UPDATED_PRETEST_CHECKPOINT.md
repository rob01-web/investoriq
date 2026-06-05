# June 4, 2026 Addendum - Acquisition Memo Product Pivot / Memo Density / Renderer Runtime Stability Checkpoint

## Current controlling status

InvestorIQ is now continuing under the June 4 product ladder and Acquisition Memo launch pivot.

The current launch ladder is:

```text
1. InvestorIQ Screening Report
   - lower-priced stable first-pass report from T12 + Rent Roll
   - keep Screening stable and largely as-is

2. InvestorIQ Acquisition Memo
   - main launch product
   - built from the current Underwriting / v1_core path
   - document-driven acquisition and preliminary financing-readiness memo
   - not a loan approval
   - not final Full Underwriting V2.0

3. InvestorIQ Full Underwriting V2.0
   - coming later
   - advanced debt/refi, DCF, waterfall, capital stack, integrations, and full investor/lender package
```

## Acquisition Memo Slice 1 completed

Acquisition Memo Slice 1 isolated the launch memo from current-debt / DSCR Review-cap summary logic.

Completed behavior:

- launch Acquisition Memo no longer uses current-debt DSCR or debt-cap verdict logic for the Executive Summary / launch memo visible classification;
- the visible contradiction where the memo showed Stable but also said classification was capped at Review because current debt DSCR was below 1.25x was removed;
- `v1_core` launch memo classification now uses operating/acquisition memo logic, not current-debt verdict caps;
- Full Underwriting / future V2 debt logic remains preserved for the future V2 path.

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
tests/qa/report-contract-qa-smoke.js
```

Commit message used or recommended:

```text
isolate acquisition memo from debt verdict caps
```

## Acquisition Memo Slice 2 completed

Acquisition Memo Slice 2 expanded the memo structure so the Acquisition Memo no longer feels like a thin 7-page Screening-plus shell.

Added / promoted dedicated memo sections:

```text
Acquisition Memo Summary
Operating Snapshot
Rent Positioning Summary
Rent Upside / Value Sensitivity
Cap-Rate Value Indication
Source Context / Support Document Treatment
Data Coverage & Source Limitations
```

Additional behavior:

- Document Treatment now renders as a dedicated memo-grade source-context block instead of being buried only inside a coverage card;
- Data Coverage now renders as a dedicated memo-grade section and no longer depends on old stripped debt/refi/scenario artifacts to become substantial;
- rent-positioning title logic now uses summary-driven language when only summary totals drive the surface;
- `Unit-Level Rent Positioning & Value Sensitivity` is used only when true unit-level detail is actually rendered.

Files changed:

```text
api/generate-client-report.js
api/report-template-runtime.html
tests/qa/generate-client-report-rent-roll-smoke.js
tests/qa/report-contract-qa-smoke.js
```

Commit message used or recommended:

```text
expand acquisition memo section structure
```

## Runtime failures found during live Acquisition Memo testing

Two live Acquisition Memo runs failed during rendering after valid T12 + valid Rent Roll parsing.

Failures:

```text
Acquisition Memo 3:
Cannot access 'rrUnits' before initialization

Acquisition Memo 4:
hasForwardLookingRenovationInputs is not defined
```

Interpretation:

- these were renderer/runtime variable-scope bugs;
- these were not customer document failures;
- T12 and Rent Roll were valid/parseable;
- credit restore behavior correctly treated them as platform/render failures;
- the failures reinforced that unsupported support docs must collapse, qualify, or render context-only rather than kill a core-valid report.

Doctrine reaffirmed:

```text
Valid T12 + valid Rent Roll should publish unless true runtime/storage/PDF/catastrophic failure prevents safe generation.

Unsupported support docs should collapse, qualify, omit, or render context-only.

Renderer runtime defects are platform defects, not bad-upload failures.
```

## Emergency tiny fix completed

A focused runtime fix was completed for the `rrUnits` TDZ crash.

Completed behavior:

- Acquisition Memo cap-rate/value rendering now uses an initialized units value before rendering;
- the prior pre-initialization `rrUnits` usage was removed from the early memo assembly path.

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Commit message used or recommended:

```text
fix acquisition memo units initialization
```

## Root runtime audit completed

After the second runtime failure, whack-a-mole patching was stopped.

Codex ran an audit-only pass of its Acquisition Memo Slice 2 work.

Root cause class identified:

```text
Acquisition Memo renderer-scope TDZ / missing render-context initialization
```

Pattern identified:

```text
New Acquisition Memo sections reached sideways into scattered late-bound locals instead of consuming one early safe render context object.
```

Why existing tests missed this:

- tests were too source-regex/helper-level;
- they did not execute the actual `v1_core` final HTML assembly path;
- they did not exercise the realistic support-doc combination that failed in production.

## Root runtime stability patch completed

A system-level runtime stability patch was completed.

Completed behavior:

- one early Acquisition Memo render context now exists before section assembly;
- memo sections consume initialized/defaulted context rather than reaching sideways into late-bound locals;
- `rrUnits` / unit-count hazards were resolved;
- `hasForwardLookingRenovationInputs` is now defined before source-context and data-coverage assembly;
- unstructured renovation/CapEx support defaults to context-only / limited-use instead of creating runtime risk.

Early Acquisition Memo render context now includes safe/defaulted values for:

```text
units
occupiedUnits
vacantUnits
occupancy
annualInPlaceRent
annualMarketRent
annualRentUpside
rentGapPercent
egi
opEx
noi
expenseRatio
noiMargin
breakEvenOccupancy
purchasePrice
goingInCapRate
acquisitionNoiBasis
hasForwardLookingRenovationInputs
renovationDisplayMode
renovationPayload
propertyTaxPayload
propertyTaxBindingState
documentQuantitativeUsageMap
documentSources
```

A real `v1_core` full-render smoke was added using `__test_return_final_html` and a Harbourstone-style fixture package.

The smoke executes the real handler / final HTML assembly far enough to catch:

```text
ReferenceError
TDZ crash
undefined render variables
unresolved {{TOKEN}} placeholders
```

The fixture includes:

```text
valid T12
valid narrative / summary Rent Roll
current loan summary
purchase assumptions
property tax support
unstructured CapEx notes
market survey excerpt
broker email context
Phase I ESA context
unsupported appraisal excerpt
```

Support docs in the harness fail soft / context-only unless validated.

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Commit message used or recommended:

```text
stabilize acquisition memo render context
```

## Codex usage constraint

Rob is conserving Codex usage.

Current note:

```text
Codex usage is down to about 85% remaining.
Reset: Jun 11, 2026 8:38 AM.
```

Future Codex prompts should remain:

- tight;
- high-impact;
- no broad audits unless clearly necessary;
- no long receipts by default;
- no repeated verification passes unless a serious ambiguity or failure requires it.

## Current next action

Do not do more Codex patches tonight.

Next fresh-chat action:

```text
Run one controlled live Acquisition Memo test.
```

If it publishes, inspect:

- actual PDF page count;
- memo flow and density;
- Document Treatment;
- Data Coverage;
- source treatment;
- support-doc context-only handling;
- absence of V2 debt/refi/DCF/waterfall surfaces.

If it fails again with a renderer/runtime error, treat that as evidence the full-render harness is still missing a production branch.

Do not run multiple live tests in a row without reviewing artifacts.

## Current live-test acceptance checklist

The next controlled Acquisition Memo live test should prove:

```text
report publishes;
no renderer/runtime 500;
no entitlement restore unless true runtime fatal;
PDF is materially fuller than the old 7-page shell;
no Current Debt DSCR launch-memo leak;
no Debt Coverage Constraint launch-memo leak;
no refinance capacity/proceeds surface;
no DCF;
no waterfall;
no equity return;
no BUY / SELL / HOLD language;
Document Treatment is visible and source-bound;
Data Coverage is visible and not falsely severe when T12 + Rent Roll are clean;
support docs are context-only/limited-use unless validated;
no unresolved tokens;
no orphan headings;
no empty tables;
no public AI wording.
```

---

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

# June 2, 2026 Addendum - Pre-Test Checkpoint / Universal Report-Quality Cleanup Verified / Controlled Live Testing Next

## Current controlling status

InvestorIQ is now at a pre-test checkpoint.

Full Underwriting has already passed the core-valid customer-delivery doctrine live once: a valid core job published instead of failing closed because of optional/support/advisory issues. After that pass, red-pen review exposed report-surface root classes rather than delivery-gate failures. Codex has now patched those root classes and verified the patch as safe to commit.

The system should now proceed to controlled live validation after the patch is committed. DocRaptor production mode remains intentionally deferred until testing confidence is established.

## Universal report-quality cleanup completed and verified

Codex completed a root-invariant patch across renderer/canonical support-doc treatment/report-contract QA conformance surfaces.

Files changed:

- `api/generate-client-report.js`
- `api/_lib/report-surface-contracts.js`
- `api/_lib/report-contract-qa.js`
- `tests/qa/current-debt-support-routing-smoke.js`
- `tests/qa/generate-client-report-rent-roll-smoke.js`
- `tests/qa/report-contract-qa-smoke.js`

Codex validation run:

- `node --check api/generate-client-report.js`
- `node --check api/_lib/report-surface-contracts.js`
- `node --check api/_lib/report-contract-qa.js`
- `node tests/qa/current-debt-support-routing-smoke.js`
- `node tests/qa/generate-client-report-rent-roll-smoke.js`
- `node tests/qa/report-contract-qa-smoke.js`
- `npm.cmd run build`
- `git diff --check`

No-code verification result:

```text
1. Going-in cap rate binding: Verified
2. Summary-only rent roll unit-mix collapse: Verified
3. Generic orphan heading collapse: Verified
4. Property-tax corroborating support wording: Verified
5. Explicit current debt QA recognition / acquisition separation: Verified
Blocker found: None
Commit status: safe to commit
```

## What this cleanup means

This cleanup was not a patch to one test report. It addressed universal report-quality root invariants.

### Universal render eligibility

Now considered complete/safe to commit:

- no orphan headings;
- no empty tables;
- no unsupported rows;
- summary-only rent rolls should not render misleading unit-mix tables;
- representative observations must not be treated as full unit mix;
- empty intro/heading blocks should collapse generically.

### Field-source binding

Now considered complete/safe to commit:

- going-in cap rate cannot render as acquisition interest rate;
- acquisition interest rate renders only with explicit interest-rate support;
- acquisition fields render only under exact source meaning;
- property tax support that matches the T12 tax line is limited corroborating support;
- property tax support does not override T12 totals and does not become modeled input without a validated structured tax artifact.

### QA conformance alignment

Now considered complete/safe to commit:

- explicit current debt support is recognized by QA/conformance;
- explicit current debt should no longer be demoted to acquisition-only/not-assessed;
- acquisition/proposed financing stays separated from current debt.

## Screening vs Underwriting status at this checkpoint

### Screening

Status: `GREEN/YELLOW - ready for final controlled validation`

Screening remains the cleaner report type because it has fewer optional/support surfaces. It still requires final controlled live validation, PDF visual review, Dashboard card review, and website/distribution readiness before launch.

### Full Underwriting

Status: `YELLOW/GREEN - customer-delivery doctrine live-proven once; final controlled validation next`

Full Underwriting is no longer in the prior phase where valid core jobs were failing closed because of section/support/advisory issues. The immediate issue shifted to report-surface discipline, and the known root-class surface issues have now been patched and verified.

The next Full Underwriting step is not another broad audit. It is controlled live validation.

## Production/distribution readiness

### DocRaptor production mode

Status: `DEFERRED INTENTIONALLY`

Do not flip DocRaptor yet. The test watermark remains acceptable during controlled testing. DocRaptor production mode is a distribution/public-sample switch, not proof that report logic is correct.

Flip only after final controlled Screening and Underwriting outputs are trusted.

### Public sample files/assets

Status: `DEFER UNTIL FINAL TRUSTED OUTPUTS EXIST`

Do not create public samples from pre-final test reports. Sample links/assets can be audited later, but external distribution should wait until controlled report outputs pass.

### Website/pricing/checkout copy

Status: `OPEN BEFORE LAUNCH, NOT THE NEXT REPORT-ENGINE STEP`

Still required before launch:

- Landing/Pricing copy audit;
- checkout/report-type copy audit;
- Stripe/pricing alignment;
- sample link/assets check;
- no public AI wording;
- no BUY/SELL/HOLD;
- no admin-review/under-review/publication-held customer copy;
- no misleading Underwriting availability.

## Immediate next action

If not already committed, commit the universal report-quality cleanup patch.

Recommended commit message:

```text
universal report quality cleanup
```

Then proceed to controlled live testing.

## Controlled live testing sequence

Run:

1. final Screening live run;
2. final Full Underwriting live run;
3. Dashboard customer card review;
4. Admin artifacts/diagnostics review;
5. PDF visual review.

Capture for each:

- PDF;
- `analysis_artifacts_rows.json`;
- lifecycle events;
- delivery gate decision;
- report-contract QA;
- source-report coverage QA;
- QA action plan;
- Dashboard status/copy;
- Admin diagnostics if relevant.

## Acceptance criteria for live testing

Valid core jobs must show:

```text
- published status;
- customer delivery allowed;
- no needs_documents / user_needs_documents lifecycle for core-valid jobs;
- no publication_held lifecycle for core-valid jobs;
- no MISSING_REQUIRED_SOURCE_DATA for core-valid jobs;
- no entitlement/credit restore for section-only/support/advisory issues;
- unsupported sections collapse/omit/qualify/disclose instead of killing the report;
- no orphan headings;
- no empty tables;
- no unsupported rows;
- no cap-rate-as-interest-rate issue;
- property tax treatment matches source support;
- explicit current debt support aligns with QA/conformance;
- acquisition/proposed financing remains separate from current debt;
- Dashboard copy is ready/processing/fail-closed only, with no customer review limbo;
- DocRaptor watermark accepted during testing and treated as distribution-only.
```

## Do not do before testing

Do not:

- flip DocRaptor production mode;
- create public samples;
- change Pricing/Stripe;
- run broad repo audits;
- add routes/serverless functions;
- touch SQL/RPC lifecycle unless a new live blocker appears;
- change Dashboard lifecycle/copy unless live testing exposes a customer-facing issue.

## Fresh continuation point

Start the next chat from this checkpoint. Commit the universal report-quality cleanup patch if it has not already been committed, then run controlled live Screening and Full Underwriting tests.


---

# June 2, 2026 Addendum - Full Underwriting Live Pass / SQL Lifecycle Fixed / Ken Red-Pen Result

## Current controlling status

Full Underwriting finally produced a successful controlled live customer-deliverable report after the stop-the-line core-valid failure path campaign.

Report:

```text
Final Motherload underwriting 12
Result: published
Customer-deliverable: yes
Ken/public-sample ready: no, not yet
```

This supersedes prior notes saying no more live Underwriting retests should run. That restriction applied before the SQL lifecycle and legacy fallback fixes. The controlled retest has now run and passed.

## Critical production fix completed in Supabase

Production Supabase was still using old function definitions:

```text
consume_purchase_and_create_job created new jobs as needs_documents.
queue_job_for_processing only queued from needs_documents.
```

That was the last live lifecycle blocker.

The production SQL functions were manually updated so:

```text
consume_purchase_and_create_job creates new jobs as queued.
queue_job_for_processing only accepts queued.
```

A production verification query confirmed the active function definitions now use `queued`, and a status check confirmed there are no current `analysis_jobs` rows with a `needs` status.

Interpretation:

```text
The legacy needs_documents lifecycle is gone from the live/new-job path.
```

## Live Underwriting result

The successful job moved through:

```text
queued -> extracting -> underwriting -> scoring -> rendering -> pdf_generating -> publishing -> published
```

The report-published email artifact was created.

This confirms the core-valid job no longer gets forced into:

```text
user_needs_documents
publication_held
MISSING_REQUIRED_SOURCE_DATA
credit_restore_required
entitlement_restored
source-package / Rent Roll / T12 customer blame
```

## Math / source validation result

The Ken-style red-pen review checked the report against the uploaded source docs.

Core math passed:

```text
T12:
- EGI $1,036,800
- OpEx $425,000
- NOI $611,800
- Expense Ratio 41.0%
- NOI Margin 59.0%

Rent Roll:
- 48 units
- 46 occupied
- 2 vacant
- occupancy 95.83%
- in-place annual rent $1,036,800
- market annual rent $1,137,600
- annual rent upside $100,800

Debt:
- balance $8,750,000
- rate 5.25%
- amortization 30 years
- monthly P&I about $48,318
- DSCR about 1.06x
```

The visible classification `Review - Debt Coverage Constraint` is appropriate because current debt DSCR is below 1.25x.

## Report-quality result

The report is customer-deliverable, but it is not Ken/public-sample ready.

Ken/public-sample blockers:

1. DocRaptor test watermark / test-mode PDF output.
2. Acquisition section appears to show `Interest Rate 5.75%` where the source only supports `Going-In Cap Rate 5.75%`.
3. Internal QA artifacts still contain stale legacy/canonical current-debt contradictions even though the report rendered correct current debt math.
4. Advanced modeling page has empty/weak headings that should collapse when no meaningful content exists.
5. Unit mix table appears under-rendered for summary/narrative rent roll data; it should collapse or qualify summary-only mode.
6. Property tax document treatment should say it supports the T12 tax line and does not override T12 totals.

## Doctrine interpretation

This is the correct interpretation:

```text
Underwriting engine customer-delivery pass: YES
Core-valid publish doctrine live-confirmed: YES
Optional/support/advisory non-blocking doctrine live-confirmed: YES
OpenAI quota/advisory failures non-blocking: YES
Ken/public sample readiness: NO
DocRaptor production mode: still required before external distribution
```

Do not call Full Underwriting public/Ken/sample ready yet.

## Immediate next recommended work

Do not restart broad doctrine work.

Next recommended batch is a focused Ken-readiness cleanup:

```text
1. Fix acquisition cap-rate vs interest-rate label.
2. Collapse empty/weak advanced modeling headings.
3. Collapse or qualify summary-only unit mix table.
4. Polish property-tax support treatment wording.
5. Clean internal current-debt canonical QA artifact contradiction.
6. Keep DocRaptor production mode as distribution/config work, separate from ordinary customer delivery.
```

After that, regenerate one Underwriting report and run another Ken red-pen test.

## Fresh-chat continuation point

We resume after the breakthrough live pass:

```text
Final Motherload underwriting 12 published.
SQL needs_documents live lifecycle removed.
Core-valid Underwriting customer-delivery doctrine passed live.
Math mostly checks out.
Ken/public-sample readiness still blocked by polish/config/artifact issues.
```

Next likely action:

```text
Focused Ken-readiness cleanup batch.
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

# June 2, 2026 Addendum - 15 Core-Valid Failure Path Families Added / Full Underwriting Launch Gate Reopened

## Current controlling status

The Publish-or-Fail doctrine remains correct, but the prior “Doctrine Lock Closed” implementation status is no longer sufficient for launch confidence.

A controlled Full Underwriting live test proved that a report can still whole-report fail after required core documents are valid. The live package had a valid parsed T12 and valid parsed Rent Roll, but section/render-contract drift cascaded through legacy delivery/failure mapping into a whole-report fail and incorrect source-package/rent-roll blame copy.

## New controlling invariant

```text
Valid T12 + valid Rent Roll = publish the report.

If core docs are valid, non-core or section-level issues must collapse/omit/qualify/disclose the affected section, not fail the whole report.
```

Whole-report fail remains allowed only for:

1. missing/unusable/unvalidated required T12;
2. missing/unusable/unvalidated required Rent Roll;
3. true runtime/storage/PDF generation failure;
4. catastrophic render failure where no safe report shell can be produced.

## New active ledger/campaign

Active campaign name:

```text
InvestorIQ Core-Valid Failure Path Family Ledger
```

Suggested active ledger filename:

```text
!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_2026-06-02.md
```

This does not erase the original Decision-Source Elimination Ledger. It supersedes the launch-critical working focus.

## 15 Core-Valid Failure Path Families to track until destroyed

1. `CVF-01` Core T12 parse failure - legitimate fail-closed only when truly core-invalid.
2. `CVF-02` Core Rent Roll parse failure - legitimate fail-closed only when truly core-invalid.
3. `CVF-03` Financial scale mismatch after core parse - must disclose/qualify when defensible; only fail if truly unreconcilable.
4. `CVF-04` Current-debt/refi render-contract drift - collapse/omit/qualify debt/refi/DSCR surfaces; do not whole-report fail.
5. `CVF-05` Report-type section leak - strip/collapse leaked section; do not whole-report fail.
6. `CVF-06` Source reconciliation/rendered variance drift - disclose-only for core-valid jobs.
7. `CVF-07` Optional/full-underwriting support depth constraints - internal/distribution-only or section limitation; not ordinary customer block.
8. `CVF-08` Delivery-gate hold-chain / legacy needs-doc conversion - destroy customer-facing `user_needs_documents` / `needs_documents` / `publication_held` conversion for core-valid jobs.
9. `CVF-09` Generator publication-held shim - remove/bypass hold shim for core-valid section-only issues.
10. `CVF-10` Worker terminal failure / credit restore misclassification - no `MISSING_REQUIRED_SOURCE_DATA` or entitlement restore for core-valid section-only issues.
11. `CVF-11` Failure message builder source-package/rent-roll blame - never blame usable core docs.
12. `CVF-12` Dashboard customer status/copy fallback - no needs-doc/publication-held/additional-documents lifecycle for core-valid jobs.
13. `CVF-13` Runtime/storage/PDF/catastrophic render failure - legitimate fail-closed, system-failure copy only.
14. `CVF-14` OpenAI/provider/advisory failures - diagnostic only when deterministic core is valid.
15. `CVF-15` Optional-support/source-package/admin ops paths - internal/distribution/diagnostic only; cannot feed customer lifecycle.

## P0 patch order now controlling

1. Slice 1 - Core-valid delivery invariant.
   - Main files: `api/_lib/qa-action-plan.js`, `api/generate-client-report.js`, `api/admin-run-worker.js`.
   - Goal: core-valid jobs cannot become needs-doc/publication-held/MISSING_REQUIRED_SOURCE_DATA because of non-core/section-only issues.

2. Slice 2 - Section self-heal/collapse for render-contract violations.
   - Main files: `api/_lib/report-contract-qa.js`, `api/generate-client-report.js`, `api/_lib/report-surface-contracts.js`.
   - Goal: current-debt/refi/report-type/source-reconciliation issues collapse/omit/qualify affected sections before delivery.

3. Slice 3 - Dashboard/failure messaging final customer-copy lock.
   - Main files: `src/lib/jobFailureMessaging.js`, `src/pages/Dashboard.jsx`.
   - Goal: core-valid jobs never display source-package/rent-roll/additional-documents blame.

4. Slice 4 - Optional/support/distribution isolation sweep.
   - Main files: `api/_lib/source-report-coverage-qa.js`, `api/_lib/source-package-qa.js`, `api/_lib/qa-action-plan.js`.
   - Goal: optional support docs, public-sample/high-value blockers, DocRaptor test mode, and OpenAI/advisory issues cannot block ordinary customer delivery.


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

## Immediate instruction

Before any new Codex patch prompt, commit this documentation update so the 15 path families are not lost.

Then give Codex Slice 1 only.

Do not run more live tests until Slice 1 is complete and validated.
Do not patch only Dashboard copy first.
Do not patch only current-debt rendering first.
The core-valid delivery invariant must be patched before the next symptom class.


---

# June 2, 2026 Addendum - Publish-or-Fail Doctrine Lock Progress / `user_needs_documents` Demotion Doctrine Added

## Current controlling status

- Publish-or-Fail doctrine remains the controlling customer-outcome doctrine.
- Ordinary customer outcomes are only:
  1. **PUBLISH**
  2. **FAIL CLOSED + RESTORE CREDIT**
- There is no normal customer-facing admin-review outcome.
- There is no normal customer-facing under-review limbo.
- There is no normal customer-facing upload-more-documents loop for an active job.

## Slice 1 and Slice 1B completed in `api/_lib/qa-action-plan.js`

### Slice 1 - admin-review / under-review emitter demotion

Files changed:
- `api/_lib/qa-action-plan.js`
- `tests/qa/qa-action-plan-smoke.js`

Completed behavior:
- `qa-action-plan` no longer preserves `admin_review_required` as a canonical ordinary customer delivery state.
- `under_review` customer label/message path was removed from canonical delivery state construction.
- Customer-facing "under internal review" language was removed from this canonical/action-plan layer.
- `admin_review_required` output is forced false in publish-eligibility output.
- Canonical override paths normalize legacy review states before downstream delivery/readiness synthesis.

Important correction:
- Slice 1 initially risked over-demoting deprecated `admin_review_required` into `user_needs_documents`, which could have converted non-core/report-surface issues into fail-closed outcomes. That was not acceptable under current doctrine.

### Slice 1B - reason-aware deprecated-admin-review normalization

Files changed:
- `api/_lib/qa-action-plan.js`
- `tests/qa/qa-action-plan-smoke.js`

Completed behavior:
- Blanket `admin_review_required -> user_needs_documents` normalization was replaced with reason-aware classification.
- Deprecated `admin_review_required` now resolves by cause:
  - `core_fail` reasons -> fail-closed path / legacy `user_needs_documents` internal status.
  - known non-core/report-surface reasons -> `deliverable`.
  - unknown deprecated reasons -> `deliverable` plus diagnostic code `DEPRECATED_ADMIN_REVIEW_REASON_REQUIRES_CLASSIFICATION`.
- No `under_review` customer label/message path was reintroduced.

Examples now deliverable when core T12 + Rent Roll are usable:
- `REPORT_TYPE_SECTION_LEAK`
- `RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER`
- placeholder/render leak classes
- other known non-core/report-surface classes

Examples still fail-closed:
- `missing_required_t12`
- `missing_required_rent_roll`
- `missing_required_source_documents`
- `rent_roll_unusable`
- `t12_unusable`
- `core_input_verification_inconsistency`
- `system_contract_failure` only where it has true core-fail/generation-failure semantics

Validation reported:
- `node --check api/_lib/qa-action-plan.js`
- `node tests/qa/qa-action-plan-smoke.js`
- `git diff --check`
- All passed, with CRLF warnings only.

## New doctrine clarification - `user_needs_documents` is not a customer workflow state

`user_needs_documents` is legacy/internal terminology from an earlier product concept where a user might upload additional documents into the same active job.

That workflow does **not** currently exist.

Therefore:

- `user_needs_documents` must not be presented as a normal customer-facing "add more documents to this job" state.
- It may remain temporarily as an internal/legacy fail-closed alias for required-core-source failure.
- Customer-facing copy must describe the actual product outcome:
  - **Report could not be generated from the required uploaded documents.**
  - **Report credit has been restored.**
  - **User may start a new report with corrected source documents.**

Correct conceptual replacement:
- Internal old label: `user_needs_documents`
- Current meaning: `fail_closed_core_documents` / `required_source_data_unusable`
- Customer outcome: `FAIL CLOSED + RESTORE CREDIT`

Correct mapping:
- Missing/unusable T12 -> fail closed + restore credit.
- Missing/unusable Rent Roll -> fail closed + restore credit.
- Both required core docs unusable -> fail closed + restore credit.
- Parser/provider failure where required core docs cannot be validated -> fail closed + restore credit.
- Optional/support docs missing or ambiguous -> publish with affected section collapsed/omitted/qualified/disclosed.
- Report-surface/copy/rendering issue -> self-heal/sanitize/replace/collapse/omit/qualify, then publish.
- DocRaptor test mode -> customer delivery allowed if otherwise safe; external/public/sample/high-value distribution blocked only.
- OpenAI quota/advisory failure -> diagnostic only if deterministic core artifacts are valid.

Customer-facing language target:
```text
Report could not be generated.

InvestorIQ could not produce a defensible report from the required uploaded documents. Your report credit has been restored, and you may start a new report with corrected source documents.
```

Do not use customer-facing language implying:
- "under review"
- "internal review"
- "24 business hours review"
- "additional documents are needed before this report can be delivered"
- "upload more documents to this job"

unless/until the product actually supports adding documents to an active job.

## Current remaining Publish-or-Fail doctrine-lock work

Do not run more live Underwriting tests until the remaining downstream doctrine-lock slices are handled or intentionally deferred with a clear risk note.

Remaining slices:

1. **Generator hold branch demotion**
   - File likely: `api/generate-client-report.js`
   - Remove ordinary customer hold behavior keyed to `admin_review_required`.
   - Demote `user_needs_documents` customer wording into fail-closed/credit-restored semantics.
   - Preserve true fail-closed behavior for unusable required core docs and true system/runtime/storage failure.

2. **Worker lifecycle demotion**
   - File likely: `api/admin-run-worker.js`
   - Remove admin-review held transition as ordinary customer state.
   - Ensure publish path proceeds when canonical customer delivery is allowed.
   - Ensure true core fail/system fail restores credit.
   - Ensure legacy `user_needs_documents` maps to fail-closed/credit-restored, not upload-more-docs limbo.

3. **Dashboard customer display cleanup**
   - File likely: `src/pages/Dashboard.jsx`
   - Remove customer-visible `under_review` and upload-more-docs style messaging.
   - Display published/ready reports normally.
   - Display fail-closed reports with credit-restored language.
   - Avoid implying the user can add more documents to the same job.

4. **AdminDashboard display/diagnostics cleanup**
   - File likely: `src/pages/AdminDashboard.jsx`
   - Keep internal diagnostics/triage visible.
   - Ensure labels do not imply ordinary customer admin approval/review.
   - Preserve emergency/admin tooling as internal-only.

5. **Final doctrine-lock smoke/audit**
   - Add/maintain tests proving:
     - no customer-facing `under_review`;
     - no customer-facing `admin_review_required`;
     - no customer-facing "under internal review";
     - `user_needs_documents` is not a customer workflow state;
     - required-core failures fail closed + restore credit;
     - optional/support/render/copy issues publish with collapse/omit/qualify/self-heal/disclosure;
     - public/sample/high-value blockers cannot block ordinary customer delivery.

## Fresh-chat continuation prompt

We are continuing InvestorIQ immediately after updating the master context for Publish-or-Fail doctrine lock progress.

Current status:
- `.MD` doctrine has been updated again.
- Slice 1 and Slice 1B are complete/pass in `api/_lib/qa-action-plan.js`.
- Slice 1 removed/demoted admin-review and under-review emitters in qa-action-plan.
- Slice 1B fixed the over-demotion mistake by making deprecated `admin_review_required` reason-aware:
  - core-fail reasons -> fail-closed path / legacy internal `user_needs_documents`;
  - non-core/report-surface reasons -> deliverable;
  - unknown deprecated reasons -> deliverable + `DEPRECATED_ADMIN_REVIEW_REASON_REQUIRES_CLASSIFICATION` diagnostic.
- `user_needs_documents` doctrine is now clarified:
  - it is not a customer workflow state because InvestorIQ currently has no upload-more-documents flow for an active job;
  - it may remain temporarily as an internal/legacy fail-closed alias only;
  - customer-facing copy must say the report could not be generated from required uploaded documents and the credit was restored.

Next work:
1. Continue Publish-or-Fail doctrine-lock downstream slices.
2. Recommended next slice: `generate-client-report.js` hold-branch demotion and customer wording correction.
3. Then worker lifecycle.
4. Then Dashboard customer display.
5. Then AdminDashboard/internal diagnostics wording.
6. Then final doctrine-lock smoke/audit.

Guardrails:
- Do not run more live Underwriting tests yet.
- Do not loosen QA.
- Do not publish unsafe rendered surfaces.
- Do not fail whole reports for wording/render/optional-support issues.
- Fail closed only for unusable required core T12/Rent Roll or true generation failure.
- No normal admin review.
- No normal customer under-review.
- No customer upload-more-documents limbo.
- No broad refactors.
- No new Vercel/serverless routes casually.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off fixture values.
- Renderer consumes canonical state.
- QA is conformance/diagnostics only.
- Public/sample/high-value readiness remains distribution metadata, not ordinary customer delivery authority.

---

# June 1/2, 2026 Addendum - Publish-or-Fail Doctrine Locked / Admin Review Removed as Customer Outcome

## Current controlling doctrine - supersedes all older contradictory implementation notes

InvestorIQ has **no normal customer-facing admin-review outcome**.

The only ordinary customer outcomes are:

1. **PUBLISH**
   - Required core T12 + Rent Roll evidence is usable enough to produce a defensible, document-driven report.
   - Any non-core, optional, support-document, section-specific, wording, rendering, report-surface, DocRaptor/test-mode, OpenAI/advisory, acquisition-support, current-debt, property-tax, market-survey, appraisal, environmental, zoning, renovation/CapEx, or public-copy issue must be handled by deterministic self-heal, sanitize, collapse, omit, qualify, disclose, or render Not Assessed where appropriate.
   - These issues may emit internal diagnostics and may block external/public/sample/high-value distribution, but they must not create ordinary customer limbo.

2. **FAIL CLOSED + RESTORE CREDIT**
   - Only when required core T12 or Rent Roll evidence is missing, unreadable, unparseable, materially invalid, incoherent, contradictory beyond defensible use, or otherwise so unusable that producing any report would be dishonest.
   - True runtime/system/storage failure that prevents generation may also fail closed with credit restored.

There is no third ordinary outcome.

## Explicitly superseded / removed from active doctrine

Any older language in this file or the codebase implying ordinary customer outcomes such as:

- `admin_review_required`
- `under_review`
- "admin-held publishing"
- "send to review"
- "manual/operator-reviewed customer delivery"
- "24 business hours review"
- customer-facing "under internal review"

is superseded and must be treated as legacy/internal/emergency-only terminology, not a normal product state.

If code still emits those states for ordinary customer jobs, that code is out of alignment with doctrine and must be audited/demoted.

## Required system behavior by issue class

- Report-type wording leak, stale heading, wrong methodology label, public copy issue:
  - self-heal/sanitize/replace/collapse the affected text or block, then publish if core docs are usable.
  - Do not fail the whole report.
  - Do not send to review.

- Unsupported optional/support document:
  - omit, list as unmodeled context, or qualify affected section.
  - Do not block whole-report publication.

- Missing or ambiguous acquisition/proposed-financing support:
  - omit/qualify acquisition financing rows or show only verified fields.
  - Keep acquisition/proposed financing separate from current debt.
  - Do not block whole-report publication.

- Missing or ambiguous current-debt support:
  - mark current debt/refi/DSCR sections Not Assessed or collapse/omit them.
  - Do not block whole-report publication.

- Property-tax support missing/unverified:
  - omit/qualify property-tax modeling.
  - Do not allow unrelated support docs to become property-tax authority.
  - Do not block whole-report publication.

- DocRaptor test mode:
  - ordinary customer delivery blocker: no.
  - external/public/sample/high-value distribution blocker: yes until production mode is verified.

- OpenAI quota/advisory/QA failure:
  - ordinary customer delivery blocker: no, when deterministic core artifacts are valid.
  - diagnostic/platform-infrastructure issue only.

## Immediate architecture priority

Before more live Underwriting testing, run an **Admin Review Outcome Demotion Audit** across worker, delivery gate, QA/action-plan, report-contract QA, generator, Dashboard, and AdminDashboard paths.

Goal:
- find every remaining path that can turn an ordinary customer report into `admin_review_required`, `under_review`, admin-held, or review-limbo;
- classify whether it should become publish, self-heal/collapse/omit/qualify then publish, fail-closed + credit restored, or internal diagnostic only;
- patch in small slices until ordinary customer flow obeys Publish-or-Fail doctrine.

## Guardrail

Do not loosen QA to make unsafe reports publish. Instead:
- prevent unsafe surfaces before render,
- self-heal deterministic surface issues,
- collapse/omit/qualify unsupported sections,
- fail closed only for unusable core T12/Rent Roll or true generation failure.

---
﻿# June 1, 2026 Addendum - Clean Screening Regression Root Fixes / Parser Fallback / Delivery Gate Correction / Summary-Only Surface Patch / Core Parser Rejection Audit Installed

## Current controlling status
- Controlled live regression started after G8 material closure.
- Clean Screening pipeline materially improved, but one more red-pen PDF review is still required after the latest surface patch rerun.
- Do not claim all DS rows are globally closed.
- Do not claim Full Underwriting public self-serve launch-ready.
- Do not claim Ken/public samples are ready.

## Doctrine reaffirmed
- Whole-report fail-closed is only for unusable/missing/unreadable/materially invalid required core docs, severe core contradiction, or true runtime/system/storage failure.
- Messy but usable core T12/Rent Roll evidence should publish when defensible.
- Optional/support/section-specific issues must collapse/omit/qualify/disclose at section/line level, not fail the whole report.
- Admin review is not a normal customer outcome.
- AI is not the boss; deterministic validation remains authority.

## June 1 regression sequence
1. Clean Screening initially failed closed.
- Root cause: rent roll was plain-text narrative with explicit coherent summary totals.
- Deterministic rent-roll parsing was gated to tabular flows.
- AI recovery attempted; provider returned non-OK (429/openai_non_ok); no accepted candidate.
- Worker fail-closed/credit-restore behavior was correct.

2. Deterministic text-summary rent-roll fallback added.
- Files:
- `api/parse/parse-doc.js`
- `tests/qa/rent-roll-text-summary-fallback-smoke.js`
- Added `parseRentRollFromTextSummary(...)`.
- Non-tabular rent roll can now produce `rent_roll_parsed` when explicit coherent summary totals exist.
- Requires: total units, occupied, vacant, occupancy, in-place/current total family, market total family.
- Coherence checks added (occupied+vacant=total, occupancy approx occupied/total, monthly/annual consistency).
- No fabricated unit rows.
- No summing representative observations.
- Specific rejection diagnostics added.

3. Fallback tightened.
- Initial version was too permissive (accepted any one rent-total family).
- Fixed to require both in-place/current family and market family.
- Added in-place-only and market-only rejection tests.

4. Summary-total precedence fixed.
- Parser now prefers controlling summary-total semantics over representative unit narrative values.
- Representative-only observations reject.
- Trailing numeric extraction avoids “across all 48 units” collisions.
- No parser hardcoding.

5. Delivery leak fixed after parse succeeded.
- Root cause: `DOCRAPTOR_NOT_PRODUCTION_MODE` leaked from distribution readiness into ordinary customer delivery.
- Files:
- `api/_lib/qa-action-plan.js`
- `tests/qa/delivery-decision-state-smoke.js`
- Canonical `customer_delivery_allowed` now wins when present.
- Otherwise customer delivery derives from canonical delivery authority:
- `delivery_gate_status === "deliverable"`
- `customer_publish_blockers.length === 0`
- DocRaptor test mode still blocks `public_sample_ready` and `high_value_outreach_ready`.
- True holds/fails remain unchanged.

6. Post-publish red-pen found summary-only surface defects.
- Empty unit-level framing visible for summary-only rent roll.
- “Weighted Avg” labels shown without row-level support.
- Stale heading “InvestorIQ Estimates” remained.

7. Screening summary-only rent-roll surface patch completed.
- Files:
- `api/generate-client-report.js`
- `tests/qa/generate-client-report-rent-roll-smoke.js`
- Detects summary-only surface (`units/unit_mix/computed unit_mix` empty with verified totals).
- Collapses empty unit-level/unit-mix surface in Screening.
- Replaces with summary-positioning language.
- Uses implied-average labels for summary-only:
- `Implied Avg In-Place Rent`
- `Implied Avg Market Rent`
- Adds monthly/annual total metrics.
- Preserves weighted/rent-band row-level rendering when row support exists.
- Replaced stale heading with `Document-Backed Screening Outputs`.
- No parser/delivery/DocRaptor changes.

8. Core parser rejection audit layer installed (diagnostic-only safeguard).
- Files:
- `api/admin-run-worker.js`
- `tests/qa/core-parser-rejection-audit-smoke.js`
- New artifact type: `core_parser_rejection_audit`.
- Trigger: extracting-stage fail path before/around `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` when required core parsed artifact is missing, core file exists, and `document_text_extracted` exists.
- Deterministic-only signal findings include:
- `parser_rejection_confirmed`
- `parser_missed_usable_core_evidence`
- `representative_values_confused_with_summary_totals`
- `source_text_contains_core_summary_totals`
- `provider_unavailable`
- `deterministic_recovery_needed`
- `insufficient_readable_text`
- `core_evidence_incoherent`
- No publish effect, no parsed artifact creation, no AI value authority, no credit-restore behavior change, no Dashboard copy change.

## Validation receipts recorded
- `rent-roll-text-summary-fallback-smoke` passed.
- `t12-rent-roll-diagnostics-regression` passed when run.
- `delivery-decision-state-smoke` passed.
- `admin-run-worker-gate-smoke` passed.
- `generate-client-report-rent-roll-smoke` passed.
- `core-parser-rejection-audit-smoke` passed.
- `git diff --check` passed with CRLF warnings only.

## Immediate continuation point
- Pause live testing until this doc update checkpoint is committed and a fresh chat starts.
- Next:
1. Rerun the same Clean Screening and red-pen the new PDF surface.
2. Investigate OpenAI 429/insufficient_quota diagnostics as separate launch-readiness/config work.

## OpenAI quota/config investigation note
- Codex should inspect code-side OpenAI diagnostics capture only.
- Identify error-body capture gaps, model selection, retry/backoff behavior, and clarity of rate-limit vs quota vs billing/project/model-limit diagnostics.
- Do not print secrets or expose API keys.
- Account-side billing/project limits still require Rob dashboard verification.

## Guardrails unchanged
- micro-prompts
- no broad refactors
- no report-specific hacks
- no hardcoded property/job/file IDs
- no casual new API/serverless routes
- no public AI wording
- no BUY/SELL/HOLD
- renderer consumes canonical state
- QA/conformance/diagnostics only
- deterministic validation remains authority

---
# May 30, 2026 Addendum - G8 Delivery/UI Lifecycle Authority Materially Closed / Grouped Campaign Checkpoint

## Current controlling status
- InvestorIQ Decision-Source Elimination remains the controlling architecture cleanup track.
- G8 is materially closed after worker publish-path hold guard hardening and closure audit.
- Completed/materially closed grouped sequence: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7, G8.
- Remaining grouped batches in the current G1-G8 sequence: none.
- Do not claim all DS rows are globally closed unless row closure standards are satisfied.
- Do not claim Full Underwriting public self-serve launch-ready.
- Do not claim Ken/public samples are ready.

## G8 closure status
- G8A-02 seam in `api/admin-run-worker.js` is closed.
- Worker publish path now requires resolved delivery permission:
  - `holdDelivery === false`
  - `customerDeliveryAllowed === true`
- Typed outcomes remain preserved:
  - `user_needs_documents` fail-closed/restore path
  - Superseded legacy note: `admin_review_required` / admin-held publishing must not remain an ordinary customer outcome; remaining paths must be demoted to publish/self-heal/collapse/fail-closed according to Publish-or-Fail doctrine
- Fail-closed and credit-restore safety behavior remains preserved.

## Post-patch audit verdict
- Audit-only verification completed.
- No material remaining delivery/UI duplicate truth-maker was found across:
  - worker lifecycle
  - Dashboard customer status/message surfaces
  - AdminDashboard triage surfaces
  - generator delivery compatibility aliases
- Dashboard remains canonical-first for `customer_status_label`/`customer_message` when canonical state exists.
- Legacy display/copy fallback remains canonical-absent compatibility only.
- AdminDashboard remains display/diagnostic/emergency-action only, not customer delivery authority.
- `public_sample_ready` and `high_value_outreach_ready` remain distribution metadata, not ordinary customer delivery authority.

## Fresh-chat continuation prompt
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

---
# May 30, 2026 Addendum - G7 Action-Plan Consumer Demotion Materially Closed / G8 Remains Next

## Current controlling status
- InvestorIQ Decision-Source Elimination remains the controlling architecture cleanup track.
- Completed/materially closed grouped sequence: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7.
- G7 is materially closed after Slices 1, 2A, 2B, and the Slice 3 closure audit.
- Remaining grouped batch: `G8 - Delivery/UI Lifecycle Follow-up`.
- Do not claim all DS rows are closed.
- Do not claim Full Underwriting public self-serve launch-ready until controlled live regression passes.

## G7 completion record
- Slice 1:
  - `buildQaActionPlan(...)` now consumes canonical delivery state when present.
  - Legacy action-plan readiness synthesis is canonical-absent fallback only.
- Slice 2A:
  - `buildPublishEligibilitySummary(...)` now consumes canonical delivery state when present.
  - Local blockers/advisories/regeneration/source-limitation fields remain diagnostic metadata when canonical state is present.
- Slice 2B:
  - `buildDeliveryGateDecision(...)` now consumes canonical delivery state when present across accepted shapes:
    - `deliveryDecisionState`
    - `canonicalDeliveryDecisionState`
    - `delivery_gate_decision`
    - `deliveryGateDecision`
  - Canonical-present paths mirror canonical gate truth for delivery/readiness fields.
  - `public_sample_ready` and `high_value_outreach_ready` mirror canonical only when explicitly present; otherwise safe fallback metadata remains.
  - Legacy gate-owner behavior remains only for canonical-absent artifacts.
- Slice 3 closure audit:
  - Audit-only; no files changed.
  - No material duplicate-authority leak remains in G7 scope.
  - Optional future hardening (non-blocking): defensive overwrite-proofing in `buildDeliveryGateDecision(...)` return ordering.

## Remaining work and next task
- Remaining grouped batch: `G8 - Delivery/UI Lifecycle Follow-up`.
- Next recommended task: G8 audit only, unless Rob explicitly chooses controlled live regression first.
- G8 must remain micro-sliced due to worker/dashboard lifecycle risk and Vercel Hobby function-count constraints.

## Fresh-chat continuation prompt
We resume after G7 material closure.

Completed/materially closed: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7.

Remaining: G8 - Delivery/UI Lifecycle Follow-up.

Next recommended task: G8 audit only, unless Rob explicitly chooses controlled live regression first.

G8 must remain micro-sliced because it touches worker/dashboard lifecycle behavior and Vercel Hobby function-count constraints.

Guardrails:
- Do not start broad worker/dashboard refactors.
- Do not add new API/serverless routes.
- Do not alter customer delivery doctrine.
- Do not loosen fail-closed/credit-restore behavior.
- Audit first, patch only after the residual lifecycle/UI authority path is identified.
- micro-prompts
- no broad refactors
- no report-specific hacks
- no hardcoded property names/filenames/report IDs
- no public AI wording
- no BUY/SELL/HOLD
- renderer consumes canonical state
- QA is conformance only
- action plan consumers must not re-infer truth
- lifecycle/UI consumers in G8 must not reinterpret canonical delivery state

---
# May 30, 2026 Addendum - G1/G2/G5/G6 Materially Closed / Pause Before G7-G8

## Current controlling status
- InvestorIQ Decision-Source Elimination remains the controlling architecture cleanup track.
- The original audit estimated approximately 132 duplicate decision-making paths/truth-makers.
- The ledger tracks 70 explicit DS rows/groups plus grouped expansion clusters.
- We are not requiring closure of every DS row before controlled launch/regression decisions.
- Work is intentionally paused after G6 Final Sweep due to low Codex usage.
- Full Underwriting is not declared public self-serve ready until controlled live regression passes.

## Completed grouped sequence (committed)
- Patch 1/1B
  - Parser current-debt support routing and loan-term promotion aligned.
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
  - Full Underwriting depth conformance uses canonical section-family expectations, not raw page count.
- G1 materially closed
  - Slice 1: operating statement, renovation, document sources canonicalization.
  - Slice 2: debt tables, DCF table, risk matrix, DCF summary, narrative strip canonicalization.
  - Slice 3: late `reportTier === 1` strip cascade canonical guard.
  - Residual `G1C-02` early screening cascade is contained/watch-only unless live regression proves a real mismatch.
- G2 materially closed
  - Mode-aware visible classification/coverage consumers.
  - Screening cannot leak debt-coverage classification.
  - Screening stress-summary/framework/rationale now consume canonical/final visible label.
  - Deferred polish only: CSS stale aliases, Data Coverage wording nuance, historical Deal Scorecard threshold note.
- G5 materially closed
  - Report-contract QA provenance/conformance authority hardened.
  - `resolveCanonicalCurrentDebtStateForQa(...)` and `hasCanonicalCoverageAuthority(...)` provenance-locked.
  - `inferCanonicalVerdictCapState(...)` provenance-gated.
  - Remaining G5 scope is non-authority regex/taxonomy polish.
- G6 materially closed
  - `buildAcquisitionAssumptionState(...)` no longer uses rendered acquisition phrase as canonical support authority.
  - `buildFullUnderwritingSectionEligibility(...)` no longer uses rendered section headings as eligibility authority.
  - Final sweep removed QA inventory-boolean authority from debt truth, demoted deterministic-flag reconciliation escalation, and mode-gated debt-cap classification to underwriting/tier 2.

## Launch-risk compression status at this pause
- Major Full Underwriting collapse root families were materially compressed:
  - parser current-debt support routing
  - report-type downgrade
  - generator strip/mutation authority
  - visible classification leakage
  - QA provenance leaks
  - surface-contract canonical-owner rendered/inventory/flag authority leaks
- Do not overclaim all DS rows are closed.
- Do not overclaim Ken/public samples are ready.

## Remaining grouped batches
- `G7 - Action-Plan Consumer Demotion`
- `G8 - Delivery/UI Lifecycle Follow-up`
- G8 remains micro-sliced due to worker/dashboard lifecycle risk and Vercel Hobby constraints.
- Because this checkpoint is paused, do not start G7/G8 until resumed.

## Current next action when resumed
1. G7 audit only.
2. If Rob decides cleanup is sufficient for now, checkpoint and run controlled live regression.

## Fresh-chat continuation prompt
We resume after G6 Final Sweep.

Completed/materially closed: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6.

Remaining: G7 and G8.

Codex usage was low, so work paused intentionally.

Next recommended task: G7 audit only.

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
- action plan and lifecycle consumers must not re-infer truth

---
# May 30, 2026 Addendum - Batch 6 Decision-Source Compression Complete / Batch 6F Final Recommendation Guard Complete / Live Regression Next

## G. Fresh-chat continuation prompt

We are continuing InvestorIQ after Batch 6 Decision-Source Compression on May 30, 2026.

Current status:
- Batch 6B/6B-Proof/6C/6D/6E/6F are complete.
- DS-064/065/066 launch-risk compression is complete with known broader follow-up.
- Launch-Risk Compression Audit found no clear P0 canonical-present launch blocker.
- Controlled launch is acceptable with monitoring if live regression passes.
- Full ledger closure is no longer required before controlled launch.
- Next step is live regression set:
  1. Clean Screening
  2. Messy Screening
  3. Clean Underwriting
  4. Messy Underwriting
  5. Acquisition/current-debt edge case
- Do not start broad DS-065/066 cleanup before live regression unless a regression exposes a launch-blocking issue.
- Do not overclaim public self-serve readiness until live regression passes.

## A. Current controlling status

- InvestorIQ Decision-Source Elimination remains the controlling architecture cleanup track.
- The original audit estimated approximately 132 duplicate decision-making paths / truth-makers.
- The ledger tracks 70 explicit DS rows/groups plus grouped expansion clusters.
- We are no longer treating closure of every DS row as a pre-launch requirement.
- Latest launch-risk compression audit says: controlled launch acceptable now with monitoring.
- No clear P0 launch-blocking canonical-present risk was found.
- Live regression is now the launch gate.
- Full ledger closure is not required before controlled launch.
- Do not state Full Underwriting is fully public self-serve launch-ready until live regression passes.

## B. Today's completed Batch 6 work

Batch 6B - Canonical State Propagation + Provenance Guard Hard-Lock
- generator now passes canonical states into source-report-coverage QA.
- source-report-coverage QA emits authority_provenance and canonical/fallback state source markers.
- report-contract QA no longer treats fallback-derived current debt state as canonical authority.

Batch 6B-Proof - Runtime Behavioral Proof Hardening
- runtime behavioral proof now covers canonical-present, canonical-absent fallback, report-contract provenance behavior, and generator canonical-state helper propagation.
- source-level assertions reduced to backup where practical.

Batch 6C - DS-064 Residual Renderer Strip/Mutation Cleanup
- SECTION_4_NEIGHBORHOOD and SECTION_4_LOCATION_TABLE now obey canonical market_context visibility when canonical state exists.
- Data Coverage phrase-count stripping is legacy fallback only and cannot override canonical Data Coverage authority.

Batch 6D - Closure Audit
- audit-only.
- verdict: CLOSED WITH KNOWN BROADER FOLLOW-UP.
- found the remaining QA provenance tightening items and the final recommendation section guard.

Batch 6E - QA Provenance Guard Tightening
- report-contract QA provenance gates tightened.
- hasCanonicalCoverageAuthority(...) now requires explicit provenance authority flags.
- resolveCanonicalCurrentDebtStateForQa(...) no longer promotes fallback/unprovenanced current_debt_state to canonical truth.
- source-report-coverage QA treats explicit sectionEligibility as part of unified coverage/sufficiency authority.
- fallback_reconstructed current debt remains explicitly non-canonical.

Batch 6F - DS-064 Final Recommendation Canonical Guard
- SECTION_11_FINAL_RECS is now canonical-first.
- Added resolveFinalRecommendationSectionVisibility(...).
- Supports section eligibility keys:
  - final_recommendation
  - final_recommendations
  - final_recs
- canonical eligible/rendered keeps the section.
- canonical omitted/source_constrained strips the section.
- canonical absent preserves local narrative fallback.
- runtime helper-level tests added.

## C. Launch-risk compression result

- Controlled launch acceptable now with monitoring.
- No clear P0 remaining from the sweep.
- No current canonical-present path found that plausibly reintroduces false debt/refi math, acquisition-as-current-debt contamination, or wrong customer delivery decision.
- Remaining DS-064/065/066 work is P1/P2 hardening unless live regression proves otherwise.
- Live regression replaces full ledger closure as the next launch gate.

## D. Current next action

Current next action: run live regression set.

Regression set:
1. Clean Screening
2. Messy Screening
3. Clean Underwriting
4. Messy Underwriting
5. Acquisition/current-debt edge case

For each live regression, capture:
- PDF/report output
- analysis artifacts
- report_contract_qa
- source_report_coverage_qa
- qa_action_plan
- Dashboard/Admin Diagnostics evidence if relevant

Regression checklist:
- no false limitation headline
- Screening does not leak underwriting sections
- acquisition/proposed financing never treated as current debt
- DSCR/refi suppressed when current debt is not assessed
- current-debt/refi math only appears with verified current debt basis
- Data Coverage headline/severity obeys canonical state
- support docs are not used quantitatively unless canonical state supports it
- visible classification aligned across cover/executive/scorecard/risk surfaces
- no prohibited public language
- no internal parser/admin/vendor artifacts
- no unresolved tokens
- no DATA NOT AVAILABLE placeholders
- no mojibake
- no awkward N/A metric leaks

## E. Current working doctrine

- The launch goal is not a perfect codebase.
- The launch goal is safe, honest, deterministic, commercially credible reports.
- Launch-blocking risk means a plausible path to:
  - false financial conclusions
  - unsupported current debt / DSCR / refinance math
  - acquisition financing treated as current debt
  - wrong publish/fail/customer delivery decision
  - hidden material source limitation
  - visible trust-breaking contradictions
  - support-doc quantitative misuse
  - prohibited public/customer copy
- Launch-hardening/post-launch work can remain open if:
  - canonical authority wins
  - fallback is canonical-absent only
  - QA catches contradictions
  - unsafe sections collapse/omit/qualify
  - delivery gate prevents unsafe publication

## F. Supersession note

- Older notes saying Screening-first only or Full Underwriting must remain paused until full decision-source closure are superseded to the extent that the latest launch-risk compression audit says controlled launch is acceptable with monitoring if live regression passes.
- Historical caution remains relevant, but the current next step is live regression, not more blind patching.
- Do not state Full Underwriting public self-serve is approved until live regression passes.
- Do not state all decision-source rows are closed.
- Do not state Ken/public samples are ready.

---
# May 29, 2026 Addendum - Decision-Source Elimination Progress: Batch 2 Complete / Batch 3 Current Debt-Refi Complete Pending Ledger Update

## H. Fresh-chat continuation prompt update

We are continuing InvestorIQ after a long May 28/29 Decision-Source Elimination session.

Current state:
- Decision-source audit found ~132 duplicate decision-making paths; ledger tracks 70 explicit DS rows/groups.
- Batch 2 Delivery / Readiness Authority is completed and documented.
- Batch 3 Current Debt / Refi Authority is code-complete through Batch 3F and needs consolidated ledger update.
- Current strict Batch 3 status: DS-021 PARTIAL; DS-022 through DS-027 CLOSED.
- Immediate next step: update `!!INVESTORIQ_DECISION_SOURCE_ELIMINATION_LEDGER_2026-05-28.md` for Batch 3, then begin Batch 4 Acquisition / Current Debt Separation Authority.
- Do not start Batch 4 before Batch 3 ledger update.
- Keep prompts small, scope-locked, and strict about canonical authority vs duplicate decision-makers.

## A. Current controlling status

- The Decision-Source Elimination project is now the controlling architecture cleanup path.
- Original audit found approximately 132 decision-making paths / duplicate truth-makers across Screening + Full Underwriting.
- The ledger tracks 70 explicit DS rows/groups, with grouped rows representing clusters from the broader ~132-source audit.
- Closure standard remains strict:
  - CLOSED only when the old decision-maker can no longer override canonical truth.
  - PARTIAL when canonical authority exists but some broader/root/fallback architecture remains.
  - Legacy fallback is acceptable only when canonical truth cannot be overridden.
- The goal is not to add another helper layer; the goal is to retire, neutralize, quarantine, or convert duplicate authorities.

## B. Batch 2 - Delivery / Readiness Authority status

Batch 2 is consolidated and documented in the ledger.

Completed Batch 2 items:
- Stable canonical `deliveryDecisionState` shape created.
- Generator emits compatibility aliases derived from canonical delivery state.
- Worker consumes canonical delivery decision state.
- Worker credit-restore behavior respects canonical `credit_restore_required`.
- Worker terminal failure handling consolidated through `applyTerminalFailureOutcome(...)`.
- `restoreEntitlementForFailedJob(...)` remains the sole entitlement restore authority.
- `recordJobFailure(...)` routes through the terminal failure helper.
- Dashboard customer-facing status/message/guidance uses canonical customer status/message where present.
- Failed-file guidance is suppressed when canonical customer message exists.
- Report-contract QA treats delivery readiness as canonical-vs-render/payload conformance, not independent truth.

Batch 2 ledger result:
- CLOSED:
  - DS-049
  - DS-050
  - DS-051
  - DS-052
  - DS-059
  - DS-060
  - DS-061
- PARTIAL:
  - DS-068 broader worker lifecycle/status-machine cluster
  - DS-069 broader Dashboard fallback/messaging architecture for older/non-canonical jobs

Important interpretation:
- Batch 2 customer-facing delivery/readiness override risk is materially reduced.
- DS-068 and DS-069 remain broader architecture clusters, not active canonical override risks where canonical delivery/customer state exists.

## C. Batch 3 - Current Debt / Refi Authority status

Batch 3 code patches are complete through Batch 3F and now need a consolidated ledger update.

Completed Batch 3 sequence:
- Batch 3A audit-only mapped current debt/refi authority rows.
- Batch 3B standardized canonical current-debt field contract and scorecard DSCR consumption.
- Batch 3C hard-locked refi debt basis/render-state/narrative behavior to canonical current-debt state.
- Batch 3D converted debt/refi QA from rendered-text truth inference into canonical-vs-render conformance.
- Batch 3E closure audit found one final QA artifact/inventory inference blocker.
- Batch 3F locked QA canonical-present precedence so artifact/inventory debt heuristics are fallback-only when canonical current-debt payload is absent.

Batch 3 current strict status:
- PARTIAL:
  - DS-021
- CLOSED:
  - DS-022
  - DS-023
  - DS-024
  - DS-025
  - DS-026
  - DS-027

DS-021:
- `buildCurrentDebtAssessmentState(...)` is now the canonical current-debt root authority / owner candidate with standardized field contract.
- Keep DS-021 PARTIAL because it is the family root authority, not a duplicate to delete.
- Downstream override risks are tracked and closed through DS-022 to DS-027.

Closed-row interpretation:
- DS-022: Scorecard DSCR consumes canonical current-debt state. If canonical debt exists and is not computed, no numeric DSCR is backfilled from legacy fallback.
- DS-023: `resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback(...)` is retained only as canonical-absent compatibility and cannot override canonical not-assessed state.
- DS-024: `resolveCanonicalRefiDebtBasis(...)` obeys canonical current-debt state. Non-computed canonical state returns no true debt balance, annual debt service, or DSCR; computed state uses canonical balance/service/DSCR.
- DS-025: `buildRefiDebtRenderState(...)` allows debt/refi math only when canonical debt is computed/eligible. Acquisition-only, source-limited, and not-assessed paths remain non-quantitative.
- DS-026: `resolveRefiNarrativeMode(...)` is now a read-only wording adapter and cannot upgrade not-assessed/source-limited states into assessed current-debt/refi messaging.
- DS-027: `extractCurrentDebtDscrValues(...)` is evidence-only. Report-contract QA resolves canonical current-debt state first, checks rendered DSCR/refi surfaces for conformance, and uses artifact/inventory debt heuristics only as canonical-absent fallback.

## D. Current scoreboard

- Total explicit DS rows/groups: 70
- Fully closed before Batch 3: 7
- Newly closed in Batch 3: 6
- Fully closed now: 13 / 70
- Partial/in progress includes at least:
  - Batch 1 classification rows
  - DS-021
  - DS-047 / DS-048 if still partial
  - DS-068 / DS-069
- Do not treat this as final unless the ledger says otherwise; ledger remains source of truth for row counts/statuses.

## E. Immediate next step

1. First, update the decision-source ledger for Batch 3 consolidated completion.
2. Then begin Batch 4.

Batch 4 expected focus:
- Acquisition / Current Debt Separation Authority.
- This should handle acquisition/current-debt separation issues, not reopen Batch 3 unless a regression proves canonical debt/refi gates were bypassed.

Do not start Batch 4 until the Batch 3 ledger update is done.

## F. Still active working rules

- Micro-prompts only.
- Audit before patch.
- No broad refactors.
- No tactical symptom patches.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off production values.
- Tests are not substitutes for production root-cause fixes.
- Renderer should consume canonical state, not re-decide truth.
- QA should be conformance/safety net, not primary truth-maker.
- Legacy fallback is allowed only when canonical payload is absent or cannot be overridden.
- Vercel Hobby constraint remains active; do not casually add new API/serverless routes.
- No public AI wording.
- No BUY/SELL/HOLD language.
- Customer-deliverable does not equal public/sample/high-value ready.
- Full Underwriting public self-serve remains paused until architecture consolidation and live retesting prove stability.

## G. Supersession note

- This May 29 addendum supersedes older "audit before further patches" language only to the extent that Batch 2 and Batch 3 have now been executed.
- The broader decision-source audit doctrine remains controlling.
- Older RF/PR/live-retest next-step notes remain historical unless reaffirmed later.
- Current next action is Batch 3 ledger update, then Batch 4.

---
# May 28, 2026 Addendum - Controlling Status: Decision-Source Audit Before Further Patches

## A. Recent completed work

1. PR5 enforcement sequence completed/committed.

2. Slice 6 completed/committed.
- `DCF_EXIT_CAP_SOURCE_OVERCLAIM` guard was calibrated.
- Root cause was guard matching `verified exit cap` inside conservative negated wording such as `not a verified exit cap`.
- Guard now catches true document-derived/verified exit-cap overclaims and does not flag conservative `not a verified exit cap` wording.

3. Full Underwriting launch-certification matrix smoke completed/committed.
- `tests/qa/full-underwriting-launch-certification-matrix-smoke.js`
- Test-only.
- Aggregates existing invariants across:
  - clean current debt
  - acquisition-only
  - current debt + acquisition context
  - messy support docs
  - property-tax binding contamination
  - DCF cap-rate provenance
  - readiness blocker hierarchy
- Does not replace live queue-to-published gauntlet testing.

## B. Latest live gauntlet result

- 124 Richmond MESSY Full Underwriting live report published and was customer-deliverable.
- It was not public/sample/Ken/high-value-outreach ready.
- Delivery gate correctly allowed customer delivery while blocking public/high-value readiness.
- Support-doc contamination fixes mostly held:
  - Phase I/environmental remained context-only.
  - Zoning/compliance remained context-only.
  - Market survey did not override rent roll.
  - DCF/cap-rate provenance used standardized/framework-style wording, not unsupported document-derived exit-cap wording.
- Recurring structural decision-sprawl still surfaced:
  - rendered classification showed `Review - Insufficient Core Support` while contract QA expected `Review - Debt Coverage Constraint`;
  - occupancy QA produced a likely false positive by treating a non-occupancy percentage as occupancy;
  - messy acquisition source text still under-recovered purchase price/lender fee fields despite source text such as `Price ref: 1,250,000 -> Loan $937,500` and `Fees 1% lender fee + legal.`

## C. Updated root diagnosis (controlling)

- This is no longer treated as one more underwriting report bug.
- Controlling diagnosis: duplicate truth-makers / decision-sprawl across report generation.
- Contract QA improved but still often catches drift after render rather than preventing renderer drift.
- Architecture must shift from contract-QA-after-render to contract-driven rendering with canonical decision authority.
- Renderer, QA, action plan, delivery gate, dashboard, parsers, and report surfaces may still contain duplicate decision-makers.

## D. New immediate next step (controlling)

- Codex is now running an audit-only task:
  - `InvestorIQ Report Decision-Source Audit - Screening + Underwriting`
- Audit scope must cover both report types and produce full decision-path inventory for:
  - report type/tier
  - visible classification/verdict/risk profile
  - scoring
  - core document sufficiency
  - T12 truth
  - rent roll truth
  - debt/refi truth
  - acquisition financing truth
  - DCF/cap-rate/valuation truth
  - property tax truth
  - support-doc treatment
  - renovation/CapEx truth
  - section eligibility/rendering
  - Data Coverage
  - QA systems
  - delivery/readiness decisions
  - dashboard/customer status decisions
- Audit-only constraints remain strict: no file changes during that audit.
- No new patches should start until that audit is reviewed.

## E. Launch strategy / pricing discussion status

- Screening-first launch remains a possible path.
- Positioning discussion remains open: whether `Screening Report` undersells the product versus a `Deal Intelligence Memo` / `Acquisition Review Memo` framing.
- Current honest pricing stance under discussion:
  - Screening/Deal Intelligence likely viable around `$199-$299` launch pricing.
  - `$499` Screening-only likely risky unless repositioned/bundled.
  - Full Underwriting `$1,499` remains aspirational until public self-serve Full Underwriting is certified.
- Full Underwriting public self-serve remains paused.
- Full Underwriting may remain controlled beta / not public self-serve while architecture consolidation proceeds; this must not create an ordinary customer admin-review/manual-review outcome.
- Do not change `src/pages/Pricing.jsx` from this documentation update alone.

## F. Superseded older next-step notes

- Older notes that state RF-5/RF-6/RF-7/RF-8 are next immediate build slices are superseded by this May 28 decision-source audit gate.
- Older language that implies PR5/RF completion means Full Underwriting is near launch-ready is superseded.
- Older language directing immediate continued controlled live retesting is superseded until audit review is complete.
- Historical context remains intentionally preserved below.

## G. Current working rules (controlling)

- No more tactical symptom patches.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off values.
- Audit before patch.
- Identify duplicate truth-makers before creating canonical architecture.
- Screening and Underwriting must both be audited.
- Tests are not substitutes for production root-cause fixes.
- Vercel Hobby constraint remains active; do not casually add new serverless/API route files.
- No public AI wording.
- No BUY/SELL/HOLD language.
- Customer-deliverable does not equal public/sample/high-value ready.

---
# May 27, 2026 (Late Night) Addendum - Full Underwriting Launch-Hardening Current Controlling Status

## A. Current committed status

1. PR5 complete/committed
- Full UnderwritingState/render-boundary hardening completed.
- Current debt/refi, acquisition/proposed financing, property-tax binding, visible classification, Data Coverage, and optional section eligibility are now centrally protected through the PR5 path.
- Full-render/customer HTML smoke coverage exists for major PR5 gates.

2. First controlled clean Full Underwriting live retest completed
- Published successfully through queued/extracting/underwriting/scoring/rendering/pdf_generating/publishing/published.
- Customer-deliverable result confirmed.
- Not yet external/public-sample/Ken-ready at that checkpoint because second-layer label/QA consistency issues were still being closed in RF slices.

3. RF-1 complete/committed
- RF-1A fixed support-role label alignment and acquisition QA calibration.
- Market/rent survey files render as market/rent context only (not rent-roll support).
- Accepted purchase assumptions used for acquisition context render as Displayed / Limited Use (not Listed but Not Quantitatively Modeled).
- `purchase_price_not_verified` no longer emits when acquisition triangle verification already verifies purchase price.
- RF-1B added targeted smoke/contract hardening for those exact regression paths (test-only).

4. RF-2 complete/committed (test-only)
- Worker/publication lifecycle publication-guard smoke expanded.
- Publish path now contract-locked to valid `.pdf` storage path + non-empty report type + deliverable gate + `holdDelivery=false`.
- Historical RF-2 note superseded in part: missing/invalid path and `user_needs_documents` remain blocked/fail-closed paths; legacy `admin_review_required` must be audited/demoted and must not remain an ordinary customer outcome.
- Worker source-contract assertions confirm typed-gate outcomes do not proceed into published transition and restore-entitlement routing remains centralized.
- Direct end-to-end Supabase credit-restoration replay intentionally deferred (would require broad mocking/refactor).

5. RF-3 complete/committed (test-only)
- Core document routing/content-rescue smoke added.
- Filename/upload slot are contract-locked as hints only, not modeled authority.
- Filename-only `Rent Roll.xlsx` / `T12.pdf` do not become Modeled Inputs.
- Parser source contracts confirm deterministic content-based rescue paths exist for `rent_roll <-> t12` where validation supports it.
- Unsafe rescue remains limited/fail-closed (market survey, broker email, Phase I/environmental/zoning do not contaminate modeled core surfaces).
- No AI expansion.

6. RF-4 complete/committed
- **Files changed:** `api/_lib/report-contract-qa.js`, `tests/qa/report-contract-qa-smoke.js`.
- **Production touched:** yes, tiny deterministic QA-contract addition only.
- **Added contract check:** `DOCUMENT_TREATMENT_DUPLICATE_CATEGORY_CONFLICT` catches same-file dual listing under Modeled Inputs and Listed but Not Quantitatively Modeled.
- **RF-4 invariant coverage strengthened:** classification consistency, debt/refi not-assessed consistency, acquisition/current-debt separation, Data Coverage/document-treatment consistency, source reconciliation consistency, and public/customer copy guardrails.
- **Validation passed:** `node --check api/_lib/report-contract-qa.js`, `node --check api/generate-client-report.js`, `node tests/qa/report-contract-qa-smoke.js`, `node tests/qa/full-underwriting-gates-full-render-smoke.js`, `node tests/qa/generate-client-report-rent-roll-smoke.js`, `node tests/qa/property-tax-binding-finalhtml-smoke.js`, `node tests/qa/refi-gate-not-assessed-finalhtml-smoke.js`, `node tests/qa/acquisition-triangle-collapse-finalhtml-smoke.js`, `node tests/qa/core-doc-routing-rescue-smoke.js`, `git diff --check` (CRLF warnings only).
- **Remaining RF-4 limitation:** still QA-contract/smoke-level hardening, not a full DB-backed publication workflow simulator.

## B. Remaining families after RF-4

- RF-5: Dashboard Delivery Visibility / Report History Assumption Check
- RF-6: Admin Diagnostics / Reason-Code Precision
- RF-7: Remaining UnderwritingState Fallback Cleanup Audit
- RF-8: Customer/Public Copy Doctrine Sweep

## C. Current guidance

- RF-4 was the last heavy report-quality/root-leak family in this sequence; RF-5..RF-8 should be smaller audit/smoke/copy/diagnostic slices unless a real issue is exposed.
- RF-4 is now committed; proceed to RF-5 by default unless there is a strong reason to run another controlled clean live retest first.
- Keep prompts small, direct, and scope-locked.
- Continue Vercel Hobby constraint discipline: do not add API/serverless route files casually.
- No broad refactors.
- No public AI wording.
- No BUY/SELL/HOLD recommendation language.
- Customer-deliverable does not equal external/public-sample-ready.
- Quality bar is universal: normal customers, Ken Dunn, and public samples require the same elite document-driven deterministic credibility.

## D. Superseded note

Older sections below that state PR5 is pending, RF slices are not started, or that next step is PR1/PR2/PR3/live retesting before RF closure are historical and superseded by this addendum.

---
# May 27, 2026 (Night) Addendum - Current Controlling Status (Supersedes Older Next-Step Notes)

## A. Completed launch-hardening sequence (committed)

1. BLK-1 completed/committed
- Scorecard-facing current debt coverage no longer falls back to legacy/raw mortgage values when canonical current debt status is not computed.
- `resolveCanonicalCurrentDebtScoreInputs(...)` returns `currentDebtCoverage: null` and `usedCanonicalState: false` when canonical current debt is not computed.
- `buildCurrentDebtScorecardEntry(...)` treats null coverage as not assessed and does not render DSCR score rows from raw mortgage fallback.
- This closes scorecard/body drift where body says current debt/refi is not assessed.

2. BLK-3 Part 1 completed/committed
- Added `tests/qa/refi-gate-not-assessed-finalhtml-smoke.js`.
- This is finalHtml-like/helper-assembly coverage, not a true full `generateClientReport()` customer HTML invocation.
- It proves not-assessed current debt/refi output does not include: Maximum Financing Envelope; Base Case Supportable Loan; Current loan balance / Interest rate / Amortization / Refinance cap rate rows; Refinance proceeds/debt-balance surfaces; Current Debt DSCR / DSCR (Current Debt) scorecard rows.

3. BLK-3 Part 2 completed/committed
- Added `tests/qa/acquisition-triangle-collapse-finalhtml-smoke.js`.
- This is finalHtml-like/helper-assembly coverage, not a true full `generateClientReport()` customer HTML invocation.
- It proves unsafe/inconsistent acquisition triangle output collapses to disclosure, contradictory Proposed Acquisition Debt Sizing rows do not render, lender fee/closing costs do not render as bogus `0.0%` when unverified, and proposed acquisition financing remains separate from current outstanding debt.

4. BLK-3 Part 3 completed/committed
- Added `tests/qa/property-tax-binding-finalhtml-smoke.js`.
- This is finalHtml-like/helper-assembly coverage, not a true full `generateClientReport()` customer HTML invocation.
- It proves only the validated/bound property-tax source receives `Structured property tax input`; unbound tax-like support, Phase I/environmental, and zoning/compliance remain non-modeled/context-only.

5. BLK-2 completed/committed
- Patched acquisition financing artifact provenance pollution.
- `normalizeAcquisitionFinancingArtifactPayload` no longer back-mutates parsed/source fields with recovered/derived renderer values.
- `purchase_price`, `stated_acquisition_loan_amount`, `loan_amount`, `lender_fee_percent`, and `derived_acquisition_loan_amount` are populated only from explicit payload/source fields/aliases.
- Recovered/derived values are separated under `_renderer_derived_fields` (including `purchase_price_from_text`, `stated_acquisition_loan_amount_from_text`, `lender_fee_percent_from_text`, `derived_acquisition_loan_amount_from_purchase_ltv`).
- Existing acquisition collapse finalHtml-like smoke still passes.

## B. Critical caveats / tracked follow-up

- BLK-3 caveat remains: the three finalHtml-like smokes are helper-assembly coverage, not true full-generator/full-render customer HTML regression coverage.
- Required pre-launch hardening item: add a dedicated true full-generator/full-render regression harness proving the actual customer-report path cannot bypass:
  1. refi/debt not-assessed gate
  2. acquisition triangle collapse gate
  3. property-tax source-binding/document-treatment gate
- Follow-up provenance cleanup: review whether `ltv`, `interest_rate`, and `amortization_years` should also be separated into explicit source fields vs `_renderer_derived_fields` when recovered only from free text. Do not patch ad hoc; handle under a future canonical acquisition/provenance cleanup pass.

## C. Doctrine clarification (controlling)

- Goal is not zero bugs forever; goal is to stop recurring root-class/sub-class contradictions from escaping into live testing.
- Customer outcome model remains:
  1. Whole report fails closed only when required core evidence is unusable/unreadable/unverifiable enough that no defensible report can be published.
  2. Otherwise, report publishes and unsupported/missing/contradictory section-level inputs collapse/omit/qualify/disclose affected sections/lines.
  3. Admin diagnostics capture recurring section-level limitations/bugs for product intelligence and deterministic follow-up patches.
- Admin review is not a normal customer outcome. Diagnostics are product-learning intelligence, not routine manual review.

## D. Current status and next likely steps

- BLK-1: done/committed.
- BLK-3 Part 1: done/committed.
- BLK-3 Part 2: done/committed.
- BLK-3 Part 3: done/committed.
- BLK-2: done/committed.
- Live testing: still paused.
- PR 5 / UnderwritingState: deferred unless the final checkpoint says it is needed now.

Likely sequence:
1. Documentation update now (this addendum).
2. Consider a true full-generator/full-render regression harness PR.
3. Final Emergent repo-wide Full Underwriting audit.
4. Decide whether PR 5 is required before controlled live testing.
5. Only then resume controlled live testing.

Older references below that say PR 1/2/3 are next, that live retesting resumes immediately, or that launch-readiness is already confirmed are historical context and superseded by this May 27, 2026 controlling addendum.

---
# May 26, 2026 (Late Evening) Addendum - PR 1 + PR 4 Micro Completed / Launch Path Still Open

## A. Architecture cleanup completed tonight

1. PR 1 - Property-tax per-file binding
Status: completed and committed.
Outcome: Renderer document-treatment property-tax modeled/support labels are now bound to the validated property-tax source file identity. Missing, unreliable, or mismatched binding fails safe to neutral non-modeled treatment. This prevents Phase I ESA, environmental, zoning/compliance, appraisal, market survey, or generic support docs from being labeled as property-tax support solely because propertyTaxPayload exists elsewhere.

2. PR 4 micro - Renderer consumes support-doc taxonomy
Status: completed and committed.
Outcome: generate-client-report.js now imports uildSupportDocTaxonomyState, and uildDocumentTreatmentSummaryHtml uses canonical taxonomy semantic_doc_role as primary authority for support-doc role classification. Existing semantic_doc_role is fallback only when taxonomy role is absent/non-useful. Inline regex/filename logic remains fallback only. PR 1 property-tax per-file binding remains intact.

## B. Launch-strategy clarification (current)

- Rob has not made a final decision to launch Screening-only.
- Current launch strategy is still undecided.
- Full Underwriting cleanup is being executed now to preserve the option of launching Screening + Full Underwriting together if Full Underwriting reaches the universal quality bar.
- Do not automatically convert Pricing Underwriting to invite-only unless Rob explicitly decides Full Underwriting will not be public self-serve at launch.
- Emergent's Pricing invite-only recommendation remains a fallback launch-safety option, not an approved patch.

## C. Next architecture sequence

1. PR 2 - Acquisition triangle pre-render gate (next).
2. PR 3 - Refi / Debt state machine.
3. PR 5 - UnderwritingState skeleton (explicitly deferred until after PR 1 + PR 4 canonical consumption proof).

## D. Proven pattern from tonight

- Canonical helper logic must be consumed by the renderer to matter; exported-only canonical helpers do not prevent rendered drift.

---
# May 25/26, 2026 Addendum - Full Underwriting Architecture Audit / Whack-a-Mole Freeze / Screening-First Launch Path

## A. New current status

- The May 24/25 root-class patches were completed/deployed/pass, but controlled live underwriting retests proved Full Underwriting still has structural report-quality drift.
- The issue is not one remaining bug; it is fragmented underwriting truth architecture.
- Full Underwriting is not public self-serve launch-ready.
- Screening remains the safer public launch path.
- Full Underwriting should be beta/invite-only/not public self-serve until canonical-state consolidation is completed; this must not create an ordinary customer admin-review/manual-review outcome.

## B. Safe UI/customer/admin patches completed

- AdminDashboard.jsx Slice 2A.2 completed/pass:
  - undefined `ai` expanded-row reference removed
  - AI Recovery fallback now deterministic: `None - deterministic only`
  - compact Triage empty state: `{title} - 0 jobs - all clear`
  - roadmap leak copy replaced with `No items today.`
  - Force-Fail confirmation modal added before executing existing forceFailJob call
  - no backend/API/doctrine/gating changes

- Dashboard.jsx customer launch copy cleanup completed/pass:
  - historical note: internal status labels were collapsed to customer labels; current doctrine should avoid customer review-limbo language and use Ready or Fail Closed/Unable to Publish as appropriate
  - historical note: failed-job header cleanup reduced raw error-code leakage; current doctrine should use fail-closed/credit-restored copy, not review-limbo copy
  - muted reference code remains for support
  - upload overlay changed to Submitting your documents
  - checkout toast changed to Your report credit has been added
  - Dashboard.jsx DATA NOT AVAILABLE copy replaced with sentence-case prose
  - no API/admin/report-engine/lifecycle changes

## C. Customer Launch Audit results

- Journey mostly safe, doctrine/copy/fail-closed handling unusually disciplined.
- Main customer trust risk was internal pipeline jargon/raw error-code leakage during waiting/failure; Dashboard copy cleanup addressed the highest-value items.
- Remaining launch blocker: public sample assets are broken/missing because LandingPage references public/samples paths that do not exist.
- Do not generate underwriting sample assets from current flawed underwriting PDFs.
- STRONG BUY remains in dead/orphan chain; verify build/dist grep before public launch, but do not edit dead chain unless it reaches dist or active routes.
- Recommended current stance: do not touch orphan/dead-code cleanup pre-launch unless proven reachable.

## D. Live underwriting retest findings

1. Final Motherload underwriting 2:
- Published successfully and was likely customer-deliverable.
- Core T12/Rent Roll/current debt values mostly rendered correctly.
- Support-doc treatment mostly worked: Phase I/ESA was listed as not quantitatively modeled.
- But visible contradiction remained:
  - Refinance Stability header said refinance stability was not assessed due to missing current debt/refi inputs.
  - Later debt sections rendered current debt balance, rate, amortization, DSCR, and DSCR sensitivity.
- Root symptom: refinance header and debt body read different state/authority.

2. 124 Richmond CLEAN underwriting 2:
- Published, but not public-sample/high-value-ready.
- Visible failures persisted:
  - Phase I ESA rendered as Structured property tax input in Data Coverage.
  - Acquisition financing table rendered purchase price and stated acquisition loan amount both as $937,500, despite source language indicating loan amount at a higher purchase price.
  - Closing costs rendered 0.0% despite source lender fee evidence.
  - QA artifacts detected high-severity rendered-contract issues only after PDF rendering.
- Root symptom: renderer still bypasses canonical/QA-supported state and reads raw/fallback/local classification paths.

## E. Emergent Full Underwriting Architecture Audit - controlling diagnosis

- Root cause is architectural, not one more parser/label bug.
- There is no complete canonical UnderwritingState object.
- Existing `buildRendererCanonicalState` is partial and does not own all 18 critical underwriting truth families.
- The renderer is still acting as classifier/calculator/label generator/template engine.
- `buildDocumentTreatmentSummaryHtml` has its own inline regex/classification chain.
- `buildSupportDocTaxonomyState` exists, but renderer does not consistently consume it; QA consumes it.
- QA runs after finalHtml exists, so it detects contradictions too late to prevent customer-visible PDF issues.
- Root-class patches have been fixing individual authority paths, not replacing the authority model.
- Architecture risk: fragmented truth model; Full Underwriting is too fragile for public self-serve launch without canonical-state consolidation.

## F. Strategic decision / doctrine update

- Freeze tactical one-off Full Underwriting patches unless they are part of the canonical-state roadmap.
- Stop prompts like:
  - add one more regex
  - add one keyword to classifier
  - patch this exact refinance permutation
  - patch this exact visible label
  - add another post-render QA detector as primary fix
- Screening-first public launch is the recommended path.
- Full Underwriting may remain visible only as invite-only/beta/not public self-serve or unavailable for self-serve until consolidation; this must not create an ordinary customer admin-review/manual-review outcome.
- Public sample assets should use Screening first unless/until Full Underwriting passes sample-grade QA.
- Do not flip DocRaptor production mode or create underwriting sample assets from flawed PDFs.

## G. 99.999% Full Underwriting reliability requirements

1. Complete immutable UnderwritingState owning operating, rent roll, current debt, acquisition financing, refinance, valuation, property tax, support docs, data coverage, classification, section eligibility, diagnostics.
2. Renderer must consume UnderwritingState, not raw parser payloads.
3. Pre-render contract gates must collapse/qualify/omit before HTML is assembled.
4. Section-level narrative state machines so header/body cannot disagree.
5. Rendered QA becomes safety net, not primary authority.
6. Per-file binding for modeled support docs, especially property tax/appraisal/mortgage.
7. Acquisition triangle validation before render.
8. Refi/current-debt narrative state machine.
9. 120-ish fixture matrix / snapshot harness or equivalent broad regression coverage.
10. Separate customer-delivery gate from public-sample/high-value-outreach gate.

## H. Current active next step

- Emergent is running/should run Underwriting Renderer Canonical Consumption Audit.
- Goal: map every non-canonical/raw/fallback read in api/generate-client-report.js across the 18 underwriting truth families.
- No code edits during this audit.
- Do not run another Full Underwriting patch until the canonical consumption map is reviewed.

After that:
1. Decide Screening-first launch implementation steps.
2. Use Codex for the first implementation PR only after the consumption audit identifies the highest-leverage architectural patch.
3. Likely first candidates:
   - renderer consumes canonical support-doc taxonomy
   - acquisition triangle pre-render gate
   - refi/current-debt narrative state machine
   - UnderwritingState skeleton

## I. Current working rules

- Micro-prompts only.
- One task at a time.
- Audit before patch.
- No broad refactor unless explicitly scoped.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off values in production logic.
- No more whack-a-mole renderer regex patches.
- Screening public launch path is allowed to move forward while Full Underwriting consolidation continues.
- Full Underwriting public self-serve is paused pending architecture consolidation.

## J. Fresh-Chat Continuation Prompt

We are continuing InvestorIQ after the May 25/26 Full Underwriting Architecture Audit.

Current controlling status:
- May 24/25 root-class patches were completed/deployed/pass but live underwriting retests proved Full Underwriting still has structural fragmented-truth failures.
- Full Underwriting is not public self-serve launch-ready.
- Screening is the recommended public launch path.
- Full Underwriting should be invite-only/beta/not public self-serve until canonical-state consolidation; this must not create an ordinary customer admin-review/manual-review outcome.
- AdminDashboard Slice 2A.2 and Dashboard.jsx launch-copy cleanup are safe/pass.
- Customer launch audit found missing sample assets as the remaining major public launch blocker.
- Do not create underwriting sample assets from flawed underwriting PDFs.
- Emergent is running the Underwriting Renderer Canonical Consumption Audit.
- Do not run another tactical underwriting patch until the canonical consumption map is reviewed.

Immediate next work:
1. Complete/review Emergent canonical consumption audit.
2. Decide Screening-first public launch implementation.
3. Then scope first architectural Full Underwriting PR.

Do not:
- start Admin Slice 2B
- patch another one-off underwriting renderer symptom
- add classifier keywords/regex branches
- rotate secrets mid-debug
- flip DocRaptor production mode yet
- disable GitHub worker yet
- generate public underwriting samples from current flawed PDFs

---
# May 24/25, 2026 Addendum - Canonical Render Parity Contracts Completed / Admin Diagnostics Slice 2A Deployed / Next Step Retest

## A. Completed Root-Class + Admin Diagnostics Status (May 24/25)

1. SUPPORT_DOC_TREATMENT_CONTRACT_GAP
Status: patched, committed, deployed/pass.
Outcome: Environmental / Phase I / ESA / zoning / compliance docs cannot be rendered as property-tax support or structured property-tax inputs. Deterministic contract enforcement exists; advisory AI is not the authority.

2. ACQUISITION_FINANCING_CANONICALIZATION_GAP
Status: patched, committed, deployed/pass.
Outcome: Acquisition/proposed financing canonicalization now handles clean/messy/shorthand term-sheet formats generally, including purchase price, stated acquisition loan amount, derived acquisition loan amount, LTV/rate/amortization, lender/origination/financing fees, and unquantified legal/appraisal/closing notes. Acquisition/proposed financing remains separate from current outstanding debt unless true current debt balance evidence exists.

3. UNDERWRITING_DATA_COVERAGE_HEADLINE_OPTIONAL_LIMITATION_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Clean core T12 + Rent Roll coverage should not be mislabeled as severe source limitation just because optional/support sections are constrained. Optional underwriting constraints should be disclosed separately from core input sufficiency.

4. RENDERED_QA_CONTRACT_EXPANSION_FINAL_SWEEP
Status: completed, committed, deployed/pass.
Outcome: Final sweep expanded rendered contract coverage using tests-only/generalized coverage where appropriate. This was not a renderer rewrite.

5. ROOT-FAMILY_TAXONOMY_AUDIT
Status: completed audit-only.
Outcome: Audit identified canonical-value/rendered-value drift as the next root family and recommended targeted QA contracts instead of broad refactors.

6. SECTION_ELIGIBILITY_RENDER_DRIFT
Status: patched, committed, deployed/pass.
Outcome: If canonical section eligibility says current debt/refi/renovation sections are source-constrained, rendered output should not show computed/numeric modeled surfaces for those sections. Unsupported optional sections should collapse/qualify/omit instead of inventing outputs.

7. VERDICT_CAP_EXPLANATION_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Visible classification and explanation language must align with canonical verdict caps. Stable language cannot appear when source reconciliation, insufficient core support, or debt coverage constraints cap the report to Review-class labels.

8. CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Rendered current-debt DSCR values across customer-facing surfaces must match canonical computed current-debt DSCR within tolerance. Proposed/acquisition DSCR is excluded from current-debt DSCR parity.

9. RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Rendered Annual In-Place Rent and Annual Market Rent totals must match canonical rent-roll annual totals when canonical trusted totals exist. Partial-sample rent rolls without trusted summary totals are skipped.

10. OCCUPANCY_CANONICAL_VALUE_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Rendered current/rent-roll/physical occupancy must match canonical trusted occupancy within tolerance. Break-even, buffer, stress, sensitized, vacancy, and market occupancy contexts are excluded.

11. ACQUISITION_CANONICAL_VALUE_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Rendered Proposed Acquisition Debt Sizing values must match same-label canonical acquisition payload values when both exist, including purchase price, stated acquisition loan amount, derived acquisition loan amount, and lender/origination/financing fee. Contract is scoped only to Proposed Acquisition Debt Sizing, not current debt/refi/scorecard/risk register.

12. SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT
Status: patched, committed, deployed/pass.
Outcome: When canonical support-document role/treatment metadata exists, rendered document-treatment labels must not contradict canonical support role. Environmental, zoning/compliance, market survey, appraisal/background, qualitative, unmodeled, or limited-support docs cannot be rendered as property-tax support or modeled/structured underwriting inputs unless canonical metadata explicitly supports that class. Existing SUPPORT_DOC_TREATMENT_LABEL_CONTRACT remains active for obvious text leaks when canonical metadata is absent.

13. Admin Diagnostics Intelligence Layer Slice 1
Status: patched, committed, deployed/pass.
Outcome: Admin dashboard now has a read-only diagnostics intelligence rollup using existing QA artifacts. Explicit blocker booleans from report_contract_qa and source_report_coverage_qa take precedence over severity-derived fallback, so high-severity disclose-only diagnostics are not mislabeled as customer blockers.

14. Admin Diagnostics Slice 2A - Triage Workspace
Status: clean PR merged to main and Vercel production deployed green.
Outcome: AdminDashboard.jsx frontend-only restructure:
- "Admin Review / Fix Queue" renamed to "Triage Workspace"
- rows bucketed into Published With Diagnostics, Fail-Closed Core, and Operational Health
- delivery_gate_status underlying values unchanged
- Historical UI note superseded in part: legacy `admin_review_required` display work must not imply a normal customer review state; current doctrine requires Publish or Fail Closed + Restore Credit.
- operational recovery controls remain scoped
- emergency override controls remain locked and reframed as emergency-only, not report approval
- no backend/API/schema/customer-dashboard/package/env changes

All known May 24 root-class blocker patches from the active patch order have now been completed and deployed/pass. The current active next step is not another blind patch. The next step is a controlled live retest batch.

## B. Current Recommended Next Action

Run controlled live retests:
1. Clean Screening
2. Clean Full Underwriting
3. Messy Full Underwriting / acquisition-financing scenario
4. One fail-closed core-doc test if needed

For each retest, capture:
- PDF
- analysis_artifacts_rows.json
- any report_contract_qa / source_report_coverage_qa / qa_action_plan artifacts
- Admin Diagnostics view if relevant

Retest checklist:
- no Phase I / ESA / environmental / zoning / compliance doc appears as property-tax support
- Data Coverage headline distinguishes clean core coverage from optional/support constraints
- acquisition/proposed financing purchase price, stated loan, derived loan, fee, and closing notes render correctly
- acquisition/proposed financing is not treated as current debt
- current-debt DSCR/refi sections collapse/qualify when true current debt balance is absent
- canonical DSCR/rent-roll/occupancy/acquisition values match rendered values
- visible classification is aligned across cover/executive/scorecard/risk surfaces
- unsupported renovation/CapEx does not produce ROI/payback/rent-lift/NOI impact
- Screening does not leak underwriting sections
- no DATA NOT AVAILABLE / N/A metric placeholders / unresolved tokens / internal QA/admin/parser/artifact language / public AI language / mojibake
- Admin Diagnostics Triage Workspace appears as expected

## C. Active Patch Order (Current Checkpoint)

0. SUPPORT_DOC_TREATMENT_CONTRACT_GAP - done/deployed/pass
1. ACQUISITION_FINANCING_CANONICALIZATION_GAP - done/deployed/pass
2. UNDERWRITING_DATA_COVERAGE_HEADLINE_OPTIONAL_LIMITATION_DRIFT - done/deployed/pass
3. RENDERED_QA_CONTRACT_EXPANSION_FINAL_SWEEP - done/deployed/pass
4. ROOT-FAMILY_TAXONOMY_AUDIT - done audit-only
5. CANONICAL VALUE / RENDERED VALUE DRIFT CONTRACTS:
   - CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT - done/deployed/pass
   - OCCUPANCY_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - ACQUISITION_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT - done/deployed/pass
6. Admin Diagnostics Slice 1 - done/deployed/pass
7. Admin Diagnostics Slice 2A - done/merged/deployed/pass
8. NEXT: canonical consumption audit + Screening-first launch decision. (supersedes controlled live retest batch)

## D. Doctrine (Unchanged)

- Publish vs fail-closed remains the operating model.
- Admin review is not a normal customer outcome.
- Entire-report fail-closed only when core T12/Rent Roll are unusable/missing/unreadable/materially invalid or true system/runtime/storage failure blocks generation.
- Optional/support/section-specific limitations should collapse, omit, qualify, disclose, or render Not Assessed where appropriate.
- Unsupported optional/support issues should emit structured diagnostics.
- Diagnostics are product intelligence, not routine manual review.
- Universal report-quality standard for customers, public samples, and high-value outreach.
- No Ken/public/customer quality-tier distinction.
- Root-class patches must be generalized with anti-hardcode proof/tests.
- No report-specific hacks.

## E. Fresh-Chat Continuation Prompt (Updated)

We are continuing InvestorIQ after the May 24/25 root-class hardening sprint.

Completed/deployed/pass:
- SUPPORT_DOC_TREATMENT_CONTRACT_GAP
- ACQUISITION_FINANCING_CANONICALIZATION_GAP
- UNDERWRITING_DATA_COVERAGE_HEADLINE_OPTIONAL_LIMITATION_DRIFT
- RENDERED_QA_CONTRACT_EXPANSION_FINAL_SWEEP
- ROOT-FAMILY_TAXONOMY_AUDIT audit-only
- SECTION_ELIGIBILITY_RENDER_DRIFT
- VERDICT_CAP_EXPLANATION_DRIFT
- CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT
- RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT
- OCCUPANCY_CANONICAL_VALUE_DRIFT
- ACQUISITION_CANONICAL_VALUE_DRIFT
- SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT
- Admin Diagnostics Slice 1
- Admin Diagnostics Slice 2A Triage Workspace

Current next step:
Superseded: canonical consumption audit + Screening-first launch decision.

Do not start Slice 2B yet.
Do not do broad refactors.
Do not rotate secrets mid-debug.
Do not flip DocRaptor production mode yet.
Do not disable GitHub worker yet.

---
# May 24, 2026 Addendum - Publish-vs-Fail Doctrine Refined / Section Diagnostics Strategy Locked / Support-Doc Contract Gap Patched / Next Root-Family Work

## A) New practical customer outcome doctrine

InvestorIQ should no longer treat admin review as a normal customer outcome.

Practical customer outcomes are:

```text
1. PUBLISH
2. FAIL CLOSED + RESTORE CREDIT

Entire-report fail-closed should occur only when required core evidence is unusable:

- T12 missing / unreadable / unparseable / materially invalid
- Rent Roll missing / unreadable / unparseable / materially invalid
- T12 or Rent Roll so contradictory or structurally unusable that InvestorIQ cannot justify publishing any defensible report
- true runtime/system/storage failure that prevents generation

If core T12 + Rent Roll are usable, the report should normally publish.

Non-core, optional, support-document, or section-specific issues should not fail the entire report.

Instead, the affected line/metric/section should:

- omit
- collapse
- qualify
- disclose
- render Not Assessed only where appropriate
- never fabricate missing values

Examples:

Missing current debt -> report publishes; current-debt DSCR/refi sections omitted or marked not assessed.
Unsupported appraisal -> report publishes; appraisal not used quantitatively.
Unsupported Phase I / Zoning -> report publishes; listed as non-modeled context or omitted.
Incomplete renovation budget -> report publishes; ROI/rent-lift/payback omitted unless source-supported.
Messy acquisition financing -> report publishes; only verified fields shown; unsupported fields omitted.
```

## B) Section-level fail-close diagnostics strategy

The most important new launch-confidence doctrine:

Unknown optional/support data should not block publication.
Unknown optional/support data should create diagnostics.
Unknown core data should fail closed.

Every time InvestorIQ omits, collapses, qualifies, or limits a section/line because source support is missing, ambiguous, unsupported, or failed validation, the system should emit structured internal diagnostics.

Purpose:

Turn real customer document messiness into product intelligence.
Use recurring diagnostics to identify sub-classes for future patches.
Do not use diagnostics as routine manual admin review.

Suggested diagnostic shape:

```json
{
  "event": "section_fail_closed",
  "job_id": "...",
  "report_type": "underwriting",
  "section": "acquisition_financing",
  "status": "omitted_or_qualified",
  "reason_code": "purchase_price_not_verified",
  "source_family": "loan_term_sheet",
  "customer_delivery_impact": "none",
  "report_quality_impact": "advisory_or_external_distribution_blocker",
  "input_fields_missing": ["purchase_price"],
  "input_fields_present": ["ltv", "interest_rate", "loan_amount"],
  "recommended_admin_bucket": "possible_parser_subclass",
  "rendered_behavior": "section qualified; no fabricated purchase price",
  "needs_code_patch": "unknown_until_recurs"
}
```

Admin dashboard / diagnostics rollup target:

Recurring diagnostics this week:
- purchase_price_not_verified: 7 reports
- market_survey_not_modeled: 12 reports
- renovation_roi_missing: 9 reports
- current_debt_not_assessed: 5 reports
- support_doc_unclassified: 14 reports

Interpretation:

This is how InvestorIQ can launch responsibly while continuing to improve.
Reports publish safely.
Unsupported sections fail closed at section level.
Diagnostics reveal recurring sub-classes that can be patched into stronger deterministic support over time.

## C) Root-class patch standard tightened

Every future "root-class" patch must prove it is system-level, not report-specific.

Required proof in Codex receipts:

1. Generalized invariant fixed
2. Anti-hardcode proof/tests
3. Multiple varied fixtures
4. Rendered contract QA coverage where applicable

Every root-class prompt should explicitly prohibit:

- hardcoding property names
- hardcoding filenames
- hardcoding report IDs
- hardcoding exact one-off fixture values outside tests
- patching only one PDF/report symptom

Use test reports only as regression evidence, not as the patch target.

Correct model:

Specific report exposed the hole.
Patch the fence, not the dog.

## D) SUPPORT_DOC_TREATMENT_CONTRACT_GAP patched

Confirmed Codex patch completed for:

SUPPORT_DOC_TREATMENT_CONTRACT_GAP

Problem:

Phase I ESA / environmental and Zoning / compliance documents could render in Data Coverage as property-tax support or Structured property tax input.

Files changed:

api/_lib/report-surface-contracts.js
api/generate-client-report.js
api/_lib/report-contract-qa.js
tests/qa/supporting-doc-classification-smoke.js
tests/qa/report-contract-qa-smoke.js
tests/qa/generate-client-report-rent-roll-smoke.js

Deterministic guard added:

buildSupportDocTaxonomyState(...)
- hasEnvironmentalSignals
- hasZoningComplianceSignals
- environmental/zoning role precedence before property-tax role selection
- even if declared/detected doc_type is property_tax, Phase I/ESA/environmental/REC signals force environmental_due_diligence
- zoning/compliance/permitted use/municipal zoning signals force zoning_compliance_context

Rendered label behavior:

Environmental / Phase I / ESA / REC:
Environmental due-diligence context only; not used quantitatively.

Zoning / compliance / permitted use:
Zoning/compliance context only; not used quantitatively.

Market survey / rent comps:
Market survey / rent context only; not used to override rent roll.

Unsupported appraisal:
Listed for auditability only; not used quantitatively.

True property-tax support:
Allowed only when property-tax semantics are present and validated annual-tax logic passes.

Hard report contract QA added:

code: SUPPORT_DOC_TREATMENT_LABEL_CONTRACT
severity: high
blocks_customer_delivery: false
blocks_public_sample: true
blocks_high_value_outreach: true

Trigger:

Rendered text shows Phase I / ESA / environmental / zoning / compliance near:
- property tax support
- structured property tax input
- modeled property tax input

Important interpretation:

This is deterministic contract enforcement, not advisory AI.
Advisory AI may still flag, but deterministic contract must enforce.

Validation reported:

node --check api/_lib/report-contract-qa.js
node --check api/_lib/report-surface-contracts.js
node --check api/_lib/source-report-coverage-qa.js
node --check api/generate-client-report.js
node tests/qa/report-contract-qa-smoke.js
node tests/qa/source-report-coverage-qa-smoke.js
node tests/qa/supporting-doc-classification-smoke.js
node tests/qa/generate-client-report-rent-roll-smoke.js
git diff --check

Status:

Pass to commit if not already committed.

## E) Current known blocker patch order

Next work should patch known confirmed blockers first, then run the broader root-family taxonomy audit.

Order:

0. SUPPORT_DOC_TREATMENT_CONTRACT_GAP
   Status: patched by Codex; commit if not already committed.

1. ACQUISITION_FINANCING_CANONICALIZATION_GAP
   Patch next.
   Must be a GENERAL acquisition/proposed-financing parser/canonicalization contract, not a 124 Richmond fix.

2. UNDERWRITING_DATA_COVERAGE_HEADLINE_OPTIONAL_LIMITATION_DRIFT
   Patch after acquisition.
   General rule:
   clean core T12 + Rent Roll coverage must remain CORE INPUT COVERAGE CONFIRMED;
   optional/support-section constraints get secondary disclosure only.

3. RENDERED_QA_CONTRACT_EXPANSION
   Build hard rendered checks into each patch where possible.
   Then do one final explicit rendered-contract sweep after acquisition and Data Coverage headline patches.

4. ROOT-FAMILY TAXONOMY AUDIT
   After known blockers are patched, have Codex map all root families, sub-classes, coverage, hardcode risks, and remaining gaps.

## F) Acquisition financing patch must be generalized

Do not patch only 124 Richmond.

Root family:

ACQUISITION_FINANCING_CANONICALIZATION_GAP

General invariant:

InvestorIQ must consistently canonicalize acquisition/proposed-financing evidence across clean, messy, shorthand, and table-style term sheets before render and QA consumption.

General field mapping:

Purchase price / asking price / acquisition price / price ref
-> purchase_price

Loan amount / proposed loan / acquisition loan / mortgage amount
-> stated_acquisition_loan_amount

LTV / loan-to-value
-> ltv

Interest rate / rate
-> interest_rate

Amortization / AM / amort
-> amortization_years

Lender fee / origination fee / financing fee
-> lender_fee_percent

Legal/appraisal/closing costs mentioned without amount
-> notes only, not 0.0%

Acquisition/proposed financing
-> never current outstanding debt unless document explicitly says current outstanding balance / existing mortgage / current principal balance.

Regression fixture examples may include, but must not be limited to:

Loan Amount (at $X purchase price) $Y
Price ref: X -> Loan Y
Purchase Price: X / Loan Amount: Y
Asking Price: X / Proposed Loan: Y
X purchase price, Y loan, Z% LTV
Fees 1% lender fee + legal

124 Richmond values are evidence/regression examples only, not production logic.

## G) Root-family taxonomy audit later

After the known blocker patches, run a repo-wide Root-Family Taxonomy Audit.

Purpose:

Stop patching isolated symptoms.
Map current root families, sub-classes, deterministic enforcement, rendered contract coverage, test coverage, anti-hardcode risks, and foreseeable adjacent gaps.

Expected families likely include:

1. Classification / visible verdict alignment
2. Current debt vs acquisition/proposed financing
3. Source reconciliation / canonical truth
4. Support-document treatment
5. Data Coverage / limitation taxonomy
6. Parser / extraction / recovery validation
7. Optional section rendering / collapse behavior
8. Report surface integrity / public language
9. Delivery gate / QA authority / readiness routing
10. Pipeline / dashboard / worker / entitlement operations

Audit should not patch at first.
Audit should return:

- root-family inventory
- known sub-classes
- current enforcement files/functions
- tests proving coverage
- rendered contract QA coverage: YES / PARTIAL / NO
- anti-hardcode audit
- missing rendered-contract coverage
- adjacent foreseeable sub-classes
- recommended patch order

## H) Updated launch confidence framing

InvestorIQ is launch-justifiable only if the operating model is:

Known root-class blockers patched.
Core docs either validate or fail closed.
Optional/support docs cannot contaminate modeled outputs.
Unsupported/missing optional inputs omit/collapse/qualify/disclose affected sections.
Every section-level omission/qualification emits diagnostics.
Diagnostics roll up recurring sub-classes for future patching.
Reports publish safely while the system keeps learning.

This is the product-learning loop:

Customer docs expose messy real-world cases.
InvestorIQ publishes safely using only verified support.
Unsupported parts fail closed at section level.
Diagnostics tell Rob what happened.
Recurring diagnostic sub-classes become future deterministic patches.

That is how InvestorIQ becomes stronger and smarter after launch without turning into a manual-review factory.

## I) Working rules still active

- Micro-prompts only.
- One task at a time.
- No broad refactors.
- No unrelated cleanup.
- SHORT FORM RECEIPT ONLY.
- No report-specific patches.
- Root-class patches require generalized invariant + anti-hardcode proof.
- Do not flip DocRaptor production mode yet.
- Do not disable GitHub worker yet.
- Do not rotate secrets mid-debug.
- Do not change Supabase Cron cadence unless explicitly chosen.
- Admin review should not be treated as a normal customer outcome.
- Publish if usable T12 + Rent Roll support a defensible report.
- Fail entire report only if core T12/Rent Roll cannot support a defensible report.
- Optional/support sections fail closed at section level, not whole-report level.

## J) Current status supersession note

As of May 24, new controlled batch retesting exposed new confirmed root-class blockers:
- support-doc treatment contract gap, now patched/pass-to-commit;
- acquisition financing canonicalization gap, next patch;
- underwriting Data Coverage headline optional-limitation drift, patch after acquisition;
- final rendered QA contract sweep, then root-family taxonomy audit.

This May 24 status supersedes earlier May 23 language that stated no active report-quality patch remained open.

---
---

## Quick Current Doctrine Summary

- Publish vs fail-closed remains the operating model.
- Admin review is not a normal customer outcome.
- Entire-report fail-closed only when core T12/Rent Roll are unusable, contradictory beyond defensible use, or true runtime/system/storage failure blocks generation.
- Optional/support issues fail closed at section/line level (omit/collapse/qualify/disclose; no fabrication).
- Diagnostics convert recurring limitations into deterministic patch intelligence.
- One elite report-quality standard.
- No Ken/public/customer report-quality tiers.
- No report-specific patches.
- Root-class patches require generalized invariant plus anti-hardcode proof/tests.

## Active Patch Order

Current checkpoint:
0. SUPPORT_DOC_TREATMENT_CONTRACT_GAP - done/deployed/pass
1. ACQUISITION_FINANCING_CANONICALIZATION_GAP - done/deployed/pass
2. UNDERWRITING_DATA_COVERAGE_HEADLINE_OPTIONAL_LIMITATION_DRIFT - done/deployed/pass
3. RENDERED_QA_CONTRACT_EXPANSION_FINAL_SWEEP - done/deployed/pass
4. ROOT-FAMILY_TAXONOMY_AUDIT - done audit-only
5. CANONICAL VALUE / RENDERED VALUE DRIFT CONTRACTS:
   - CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT - done/deployed/pass
   - OCCUPANCY_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - ACQUISITION_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT - done/deployed/pass
6. Admin Diagnostics Slice 1 - done/deployed/pass
7. Admin Diagnostics Slice 2A - done/merged/deployed/pass
8. NEXT: canonical consumption audit + Screening-first launch decision. (supersedes controlled live retest batch)

## Fresh-Chat Continuation Prompt

We are continuing InvestorIQ after the May 25/26 Full Underwriting Architecture Audit.

Current controlling status:
- May 24/25 root-class patches were completed/deployed/pass but live underwriting retests proved Full Underwriting still has structural fragmented-truth failures.
- Full Underwriting is not public self-serve launch-ready.
- Screening is the recommended public launch path.
- Full Underwriting should be invite-only/beta/not public self-serve until canonical-state consolidation; this must not create an ordinary customer admin-review/manual-review outcome.
- AdminDashboard Slice 2A.2 and Dashboard.jsx launch-copy cleanup are safe/pass.
- Customer launch audit found missing sample assets as the remaining major public launch blocker.
- Do not create underwriting sample assets from flawed underwriting PDFs.
- Emergent is running the Underwriting Renderer Canonical Consumption Audit.
- Do not run another tactical underwriting patch until the canonical consumption map is reviewed.

Immediate next work:
1. Complete/review Emergent canonical consumption audit.
2. Decide Screening-first public launch implementation.
3. Then scope first architectural Full Underwriting PR.

Do not:
- start Admin Slice 2B
- patch another one-off underwriting renderer symptom
- add classifier keywords/regex branches
- rotate secrets mid-debug
- flip DocRaptor production mode yet
- disable GitHub worker yet
- generate public underwriting samples from current flawed PDFs

## May 27, 2026 Addendum - Full Underwriting Cleanup Sequence Status

Completed and committed cleanup sequence:
1. PR 1 - Property-tax per-file binding.
2. PR 4 - Renderer consumes support-doc taxonomy authority.
3. PR 2 - Acquisition Triangle Pre-Render Gate.
4. PR 3 - Refi / Debt Render-State Gate.

PR 2 status summary:
- Full Proposed Acquisition Debt Sizing table renders only when acquisition triangle is valid/safe.
- Incomplete, inconsistent, or unsupported acquisition evidence collapses to disclosure.
- Contradictory purchase price / LTV / stated loan / derived loan fields are suppressed in collapsed mode.
- Missing/null fees no longer render as 0.0%.
- Text-derived lender fee does not render unless explicitly structured/verified.
- Acquisition/proposed financing remains separate from current outstanding debt.

PR 3 status summary:
- Added refi/debt render-state gate.
- Refinance/current-debt/DSCR/debt-capacity math surfaces render only when verified current debt basis exists.
- Source-limited or not-assessed current debt states collapse to disclosure.
- SCREENING_REFI_DATA_SUFFICIENCY_BLOCK no longer appends financing envelope/debt-capacity math unless debt math is valid.
- Acquisition-only proposed financing maps to not_assessed for current debt/refi math.
- Valid verified-current-debt cases preserve existing refi/debt math.

Testing and final-audit sequence update:
- Do not return to live testing yet.
- Finish the cleanup-sequence checkpoint first.
- Then run one final Emergent repo-wide Full Underwriting audit before live testing resumes.
- Emergent remaining credits are limited (roughly 40) and should be used strategically for that final underwriting/report-surface audit.
- Final Emergent audit objective: determine whether Full Underwriting is truly elite/launch-ready and catch remaining repo-wide/report-surface issues before additional testing.

Next-step status:
- PR 1, PR 4, PR 2, PR 3 are complete.
- PR 5 / UnderwritingState remains deferred unless the final checkpoint indicates it is necessary now.
- Next likely step after this context update: small audit-only checkpoint to decide whether any remaining micro patches are needed before the final Emergent audit.
# June 2, 2026 Addendum - Publish-or-Fail Doctrine Lock Completed (Closed)

## Status
- Publish-or-Fail Doctrine Lock: `CLOSED / PASS WITH KNOWN SAFE INTERNAL LEGACY`.
- Ordinary customer outcomes are now locked to:
1. `PUBLISH / READY`
2. `FAIL CLOSED + CREDIT RESTORED`
3. Normal processing states while running: `queued`, `extracting`, `underwriting`, `scoring`, `rendering`, `pdf_generating`, `publishing`

## Completed Slices
1. `qa-action-plan` Slice 1: ordinary `admin_review_required` / `under_review` customer emitters removed/demoted.
2. `qa-action-plan` Slice 1B: deprecated `admin_review_required` made reason-aware:
   - core-fail reasons -> fail-closed / legacy internal `user_needs_documents`
   - known non-core/report-surface reasons -> deliverable
   - unknown deprecated reasons -> deliverable + `DEPRECATED_ADMIN_REVIEW_REASON_REQUIRES_CLASSIFICATION`
3. `generate-client-report` Slice 2: hold-return now only for `delivery_gate_status === user_needs_documents`; deprecated `admin_review_required` treated as deliverable for ordinary generator behavior; fail-closed copy aligned.
4. `admin-run-worker` Slice 3: deprecated `admin_review_required` normalized to deliverable lifecycle behavior; admin-held publishing path removed; non-deliverable required-core/source outcomes fail closed via `applyTerminalFailureOutcome`; entitlement restore preserved.
5. `Dashboard` Slice 4/4B: customer-visible review/held/needs-doc/publication-held lifecycle labels removed; customer labels now `Ready`, `Failed`, or processing states; fail-closed wording aligned.
6. `AdminDashboard` Slice 5: legacy review/held semantics relabeled as internal/legacy diagnostics; admin emergency/diagnostic controls preserved.
7. Final repo search audit: remaining terms classified as safe internal/backend, admin-only legacy, tests, or docs; one unsafe Dashboard review-language leak removed.
8. Dashboard timing correction: restored acceptable processing-only timing copy:
   - `Report generation may take up to 24 business hours. You'll be notified when your report is ready.`
   - no review/held/needs-doc/manual-review framing reintroduced.

## Doctrine Clarifications
- `user_needs_documents` may remain only as internal/legacy fail-closed alias for required core-document failure.
- `admin_review_required` may remain only as deprecated/internal/legacy/admin diagnostic metadata.
- Public/sample/high-value blockers remain distribution metadata and must not block ordinary customer delivery.

## Next Step (Controlled Live Retesting)
1. Clean Screening lifecycle retest.
2. Confirm Dashboard processing copy/status behavior.
3. Confirm published report appears and downloads normally.
4. Confirm no customer-facing review/hold/needs-doc limbo wording.
5. Then run controlled Underwriting lifecycle retest.

If live retesting reveals a new issue, start the next hardening family from evidence only.
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
## June 3/4, 2026 Addendum - Strategic Launch Pivot: Enhanced Screening / Acquisition Memo First, Full Underwriting V2 Deferred

- InvestorIQ should launch soon with an enhanced Screening product.
- Screening should no longer be positioned as a thin or basic screening report.
- Screening should become the front-line investor-ready memo product by opening only the stable and proven Underwriting sections that are already working reliably.
- Full Underwriting public launch is temporarily deferred.
- Underwriting should remain visible on the website as V2.0, coming later, or an integrations-enabled premium product.
- Product positioning direction: InvestorIQ Acquisition Memo, InvestorIQ Deal Intelligence Memo, InvestorIQ Investment Screening Memo, or InvestorIQ Preliminary Underwriting Memo.
- Final naming is not yet locked, but the direction is to make Screening feel like a credible investor-facing acquisition memo.
- Enhanced Screening / Acquisition Memo may justify a higher launch price around $399-$499, while Full Underwriting V2 may later justify a higher premium price point around $1,499 when integrations and deeper underwriting workflows are added.
- Do not change Stripe or pricing code from this documentation update alone.
- Stable Underwriting candidate sections for enhanced Screening: cap-rate value indication using T12 NOI; rent upside or mark-to-market summary; implied value sensitivity from rent gap; property-tax corroborating support if provided and validated or bound; document treatment summary; data coverage or source limitations; basic operating-risk scorecard using operating metrics only.
- Sections that must stay out of enhanced Screening for now: current debt DSCR; refinance stress; acquisition financing debt sizing; proposed or current debt modeling; DCF; equity waterfall; five-year outlook; advanced return projections; complex chart pages; any section requiring debt, refinance, acquisition financing, or future projection assumptions.
- Enhanced Screening must preserve the reliability advantage of Screening: T12 and Rent Roll remain the core required documents; open only deterministic, source-bound, low-risk sections; do not require current debt, acquisition financing, refinance assumptions, or future projections; unsupported optional or support inputs must collapse, omit, qualify, or disclose; no synthetic values; no public AI wording; no BUY, SELL, or HOLD labels; no admin-review or customer limbo; normal customer outcomes remain publish or fail-closed with credit restored.
- Full Underwriting should be temporarily closed or deferred from immediate public launch and remain on the website as a future V2.0 premium product positioned around integrations, deeper underwriting workflows, debt and refinance modeling, acquisition financing, DCF and scenarios, a richer investor or lender package, higher-confidence structured source ingestion, and a higher price point.
- The current live-test interpretation that caused this pivot is recorded as follows: Screening Test 1 passed strongly and looked customer-deliverable; Underwriting Test 2 proved many core sections work, including T12, Rent Roll, current debt recognition, DSCR classification, property-tax support, environmental containment, market survey containment, appraisal containment, and renovation collapse; however, Underwriting still exposes too many advanced-surface, public-sample, and Ken-readiness issues, especially purchase-assumption, acquisition, cap-rate, and document-treatment consistency; rather than hold the business hostage to full Underwriting perfection, launch the reliable product first and move only proven low-risk value into it.
- Next implementation direction after this documentation checkpoint: a small planning or audit slice, not a broad rewrite; identify exactly which existing collapsed or hidden Underwriting sections can safely be enabled for Screening; map which files control those Screening section gates; recommend the smallest implementation slice to create enhanced Screening or Acquisition Memo; no code changes during that planning or audit unless Rob explicitly asks.
- Guardrails: no code changes in this docs update; no Stripe or pricing changes; no DocRaptor flip; no public samples; no new API or serverless routes; no SQL or RPC changes; no broad repo audit; preserve limited Codex usage discipline; keep future Codex prompts tight and receipt-only.
