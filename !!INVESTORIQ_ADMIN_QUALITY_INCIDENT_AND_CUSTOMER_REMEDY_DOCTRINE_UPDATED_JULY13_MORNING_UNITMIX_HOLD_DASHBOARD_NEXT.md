# July 15, 2026 Active Status

The Admin Quality Incident and Customer Remedy Doctrine remains mandatory.

The Support Document Authority repair, P0-A through P0-D, controlled RETEST 27 publication proof, and Canonical Report Quality Manifest have passed. The Admin Quality Incident and Customer Remedy Dashboard now passes locally in the uncommitted Gate 3 working tree.

```text
Gate 1 controlled live Acquisition proof: PASS
Gate 2 Canonical Report Quality Manifest: PASS / committed at cde0b05
Gate 3 Admin Quality Incident and Customer Remedy Dashboard: PASS locally
Gate 3 commit: NO
Gate 3 deployment: NO
Gate 4 Institutional Financial Intelligence: NEXT after Gate 3 deployment verification
```

The dashboard must consume a canonical Report Quality Manifest. It must not infer truth independently from filenames, parser labels, raw file rows, HTML, or scattered logs.

Current next-project order:

```text
rest
-> review and commit the Gate 3 bundle
-> deploy Gate 3
-> verify Manifest-only production reads and signed report inspection links
-> begin Gate 4 Institutional Financial Intelligence
-> add proactive alert delivery only after the canonical incident queues are proven in production
```

---

# InvestorIQ Admin Quality Incident and Customer Remedy Doctrine

## Status

**MANDATORY LAUNCH-READINESS DOCTRINE**

This doctrine applies to every InvestorIQ report, including reports that successfully publish under Core-Gated Publish-or-Collapse.

---

## 1. Core Rule

A non-catastrophic support-document failure must not block a report when the core T12 and Rent Roll remain valid.

However:

> **Publish-or-Collapse must never make a quality failure invisible.**

Every collapse, omission, qualification, conflict, extraction warning, rejected fact, or customer-visible limitation must be recorded internally and surfaced through the InvestorIQ admin dashboard.

The system must support both:

- Safe customer delivery.
- Full internal accountability.

---

## 2. Mandatory Report Quality Manifest

Every generated report must persist an internal Report Quality Manifest, whether the report is blocked or published.

### Report-level fields

- report_id
- job_id
- user_id
- report_type
- generated_at
- core_publishable
- final_delivery_status
- overall_quality_state
- final Boss decision
- Delivery Seal decision
- credit restoration state
- customer remedy state

### Document-level fields

For every uploaded document:

- filename
- document identity
- extraction state
- extraction quality
- OCR warnings
- candidate semantic roles
- adjudicated role
- accepted facts
- rejected facts
- exact evidence references
- conflicts
- duplicate-group identity
- sourcePresent
- roleAccepted
- factAccepted
- sourceBacked
- sectionDisplayReady

### Section-level fields

For every report section:

- rendered
- collapsed
- omitted
- qualified
- disclosed
- reason code
- internal severity
- customer-visible impact
- expected or unexpected collapse
- requires admin review
- requires proactive customer contact

---

## 3. Admin Dashboard Queues

The admin dashboard must separate reports into three operational queues.

### A. Blocked Reports

Reserved for catastrophic failures, including:

- unusable or contradictory T12
- unusable or contradictory Rent Roll
- rendering failure
- storage failure
- PDF failure
- delivery failure
- malformed canonical authority contract
- other internal platform failures that prevent safe delivery

These reports require immediate attention and automatic credit restoration.

### B. Published With Limitations

Reports that delivered successfully but contain one or more quality events, including:

- support section collapsed
- support section qualified
- unreadable optional support
- conflicting optional sources
- low-confidence OCR
- complete-looking source rejected
- accepted facts missing from a rendered section
- Boss repair changed or removed customer-visible content
- unexpected omission or collapse

These reports must not disappear into ordinary logs.

The dashboard should display:

- PUBLISHED WITH LIMITATIONS
- number of quality events
- number of customer-visible limitations
- review required: yes/no
- proactive contact recommended: yes/no
- customer attention risk

### C. Published Cleanly

Reports where:

- core inputs are valid
- all displayed facts are supported
- no unresolved conflicts remain
- no unexpected collapses occurred
- no material customer-visible limitations exist

---

## 4. Expected Versus Unexpected Collapse

Not every collapse is an InvestorIQ defect.

### Expected Collapse

Examples:

- no current debt document supplied
- no lender fee supplied
- no renovation schedule supplied
- unreadable optional source
- incomplete financing bundle
- contradictory optional source documents

The report should publish with clear disclosure.

### Unexpected Collapse

Examples:

- a readable source explicitly contains 70% LTV but the report says LTV was unavailable
- a valid appraisal is misclassified
- accepted facts are lost downstream
- a complete section is collapsed despite complete accepted facts
- clear source evidence becomes a false zero
- a customer-visible section contradicts accepted Source Truth

Unexpected collapse is an InvestorIQ quality defect.

The dashboard must classify:

- collapse_expected
- collapse_unexpected
- collapse_requires_review

---

## 5. Customer Attention Risk

Every published report should receive an internal Customer Attention Risk rating.

### High Risk

- unexpected collapsed section
- accepted fact missing from final HTML
- Boss repair materially changed visible content
- OCR integrity warning near a required fact
- cross-file conflict affected a visible section
- rendered fact contradicts accepted Source Truth
- false-zero prevention event
- customer-visible output materially incomplete

### Medium Risk

- unreadable optional support
- incomplete financing bundle
- qualified appraisal or renovation context
- low-confidence optional extraction
- non-material optional omission

### Low Risk

- duplicate upload ignored
- unsupported optional document listed for auditability only
- expected optional collapse with clear disclosure
- no customer-visible quantitative impact

The dashboard must show:

- reports needing proactive review
- reports with unexpected collapse
- reports with automatic credit restoration
- reports eligible for free corrected rerun
- reports where replacement source evidence is required and customer contact may be needed

---

## 6. Responsibility Doctrine

### InvestorIQ Responsibility

InvestorIQ owns the failure when:

- the source was readable
- the fact was explicitly present
- the system assigned the wrong role
- the system dropped a supported fact
- the system rendered the wrong value
- the system produced a false zero
- the system contradicted uploaded evidence
- an internal failure caused an incomplete or misleading report

Required remedy:

- automatic free corrected rerun
- priority review
- credit restoration when a rerun is required
- refund or account credit when InvestorIQ cannot promptly provide a materially correct report

### Customer Source Limitation

The issue may originate with the uploaded source when:

- pages are missing
- the scan is unreadable
- the PDF is password protected
- documents contradict each other
- relevant content is covered or obscured
- the financing bundle is genuinely incomplete
- the source does not support the requested section

InvestorIQ must still:

- identify the limitation
- avoid guessing
- publish valid core analysis
- explain what was not used
- record that replacement source evidence is required and route any corrected rerun through InvestorIQ support

---

## 7. Customer Remedy Ladder

### Level 1: Minor Disclosed Limitation

- report remains delivered
- limitation is clearly disclosed
- the limitation remains documented and any corrected rerun is coordinated through InvestorIQ support

### Level 2: InvestorIQ Omitted or Misclassified Clear Optional Evidence

- automatic free corrected rerun
- priority review
- no additional charge

### Level 3: Material InvestorIQ Report Defect

- credit restored immediately
- priority corrected report
- proactive customer contact

### Level 4: InvestorIQ Cannot Produce a Materially Correct Report

- refund or customer-selected account credit
- documented incident review
- permanent regression case added

---

## 8. Proactive Customer Support

InvestorIQ should attempt to identify material quality issues before the customer submits a support request.

Recommended outreach:

> We identified an issue affecting one section of your report. Your core analysis remains valid, and we are preparing a corrected version at no charge.

The dashboard must support:

- mark for review
- mark as customer contacted
- request a free corrected rerun
- request or verify credit restoration through the protected credit workflow
- issue account credit
- record refund decision
- attach corrected report
- link incident to regression case

---

## 9. Permanent Regression Doctrine

Every confirmed InvestorIQ-caused failure must become a permanent regression case.

> A failure happens once. It must never happen the same way twice.

The regression record should include:

- anonymized source pattern
- exact root cause
- affected authority layer
- affected customer surface
- expected safe behavior
- test fixture or generated scenario
- fix commit
- deployment date
- recurrence status

---

## 10. Launch-Readiness Requirement

The Admin Quality Incident Dashboard is a mandatory post-adjudicator launch-readiness feature.

It must be documented in:

- InvestorIQ Master Context
- Core Valid Failure Path Family Ledger
- Semantic Authority Evidence Ledger
- launch-readiness checklist
- customer remedy policy
- admin dashboard roadmap

This work must not weaken:

- Core-Gated Publish-or-Collapse
- canonical Source Truth
- Support Document Authority Adjudicator
- Boss authority
- Delivery Seal
- terminal failure taxonomy
- worker publication lock
- automatic credit restoration for blocked reports

---

# Historical July 15, 2026 P0 Completion and Dashboard Continuation Addendum

This section records the pre-RETEST 27 and pre-Gate 3 checkpoint. The Gate 3 Local Completion and Night Close-Out addendum is controlling.

The prerequisite P0-A through P0-D local program is complete.

```text
P0-A Financial Truth and Reconciliation Egress Seal: PASS locally
P0-B Deterministic Contract QA Seal: PASS locally
P0-C Final PDF Publication Quality Boss: PASS locally
P0-D RETEST 24 Permanent Regression Replay: PASS locally
PRODUCTION CERTIFICATION: HOLD pending one controlled live Acquisition retest
```

The permanent replay also caught and closed a false delivery-alias regression in which a valid sealed Acquisition decision could be represented as blocked by a legacy compatibility adapter. That incident family must be represented in the future Report Quality Manifest as canonical-decision disagreement, even if a later layer prevents customer harm.

## Updated immediate execution order

```text
1. commit and deploy the accepted P0-A through P0-D bundle
2. run one controlled live Acquisition retest in DocRaptor test mode
3. inspect the complete PDF and canonical artifact chain
4. verify customer state, job state, worker state, publication state, and credit state agree
5. keep production certification HOLD if any P0/P1 trust defect remains
6. implement the Canonical Report Quality Manifest
7. implement the Admin Quality Incident and Customer Remedy Dashboard
8. begin institutional ELITE expansion only through the protected bounded stages
```

## Report Quality Manifest additions proved necessary by P0

In addition to the existing mandatory fields, persist:

```text
deterministic_contract_qa_seal_version
deterministic_contract_qa_status
deterministic_contract_issue_codes
final_pdf_publication_boss_version
final_pdf_publication_status
final_pdf_issue_codes
pdf_page_count
pdf_artifact_mode
pdf_publication_target
approved_surface_financial_row_count
approved_surface_reconciliation_required
canonical_delivery_decision_version
canonical_delivery_authority
compatibility_alias_agreement
compatibility_alias_disagreement_codes
source_reconciliation_status
source_reconciliation_difference
source_reconciliation_variance
source_reconciliation_disclosure_rendered
optional_support_collapse_count
optional_support_conflict_count
permanent_regression_fixture_id
```

## Required dashboard queues after the live proof

```text
Canonical decision disagreement
Contract QA internal render failure
Final PDF publication failure
Source reconciliation disclosure review
Optional support collapsed or rejected
Support role/fact conflict
Core catastrophic failure
Storage/publication failure
Credit restoration and remedy audit
Permanent regression recurrence
```

## ELITE roadmap dependency

The dashboard and Manifest are Gate 2 and Gate 3 of ELITE readiness, after the controlled live proof and before advanced institutional modeling. Subsequent stages remain:

```text
institutional composition and distribution hygiene
deterministic visual system
role-specific support fact bundles
debt and lender analytics
renovation and value-creation underwriting
valuation and scenario analysis
returns engine
risk register and diligence tracker
Elite certification
```

The dashboard is operational accountability, not a new truth authority. It must consume canonical decisions and persisted evidence and must never infer customer truth independently.

---

# July 15, 2026 Gate 3 Local Completion and Night Close-Out

This addendum is the controlling continuation point for the Admin Quality Incident and Customer Remedy program.

## Current exact state

```text
HEAD: cde0b05
ORIGIN/MAIN: cde0b05
Gate 2 Manifest: committed
Gate 3 Dashboard: PASS locally / uncommitted / not deployed
Gate 3 live services: not run
Gate 3 live retest: not run
DocRaptor external production mode: intentionally OFF
```

## Implemented canonical data flow

```text
finalized Report Quality Manifest
+ exact canonical delivery decision
+ append-only quality incident action receipts
-> receipt-only incident projection
-> Admin Quality Incident and Customer Remedy Dashboard
```

The endpoint queries only these artifact types:

```text
report_quality_manifest
delivery_gate_decision
quality_incident_action
```

It does not query or reconstruct incident truth from:

```text
analysis_job_files
reports table metadata
filenames
parser labels
raw upload rows
HTML
worker events
legacy compatibility aliases
```

The report inspection link is generated only from the finalized Manifest's published storage path.

## Implemented queues and classifications

Mandatory queues:

```text
BLOCKED
PUBLISHED WITH LIMITATIONS
PUBLISHED CLEAN
```

Collapse state:

```text
collapse_expected
collapse_unexpected
collapse_requires_review
```

Operational classification:

```text
Customer Attention Risk: HIGH / MEDIUM / LOW
responsibility: InvestorIQ defect / customer source limitation / mixed
owner routing
recurring defect-family counts
section decisions
support authority receipts
calculation eligibility
terminal failure and credit state
```

## Implemented remedy controls

Current controls record append-only operational receipts for:

```text
mark for review
mark customer contacted
request free corrected rerun
request credit restoration review
record replacement source required
record account-credit review
record refund review
attach corrected-report reference
link permanent regression case
close incident
```

These controls do not yet execute financial or constitutional mutations. Every action receipt explicitly records:

```text
authorityCreating false
sourceTruthChanged false
deliveryChanged false
publicationChanged false
creditMutationPerformed false
financialMutationPerformed false
```

Direct credit changes, refunds, billing changes, report replacement, or publication changes require their own protected execution workflow and audit receipt. They must never be smuggled into the quality projection endpoint.

## Current customer terminology rule

InvestorIQ currently has no post-submission customer upload workflow. Therefore no dashboard, customer message, remedy recommendation, or compatibility alias may tell the customer to upload additional or replacement documents.

Allowed current wording includes:

```text
core evidence unusable
replacement source required
customer contact needed
contact InvestorIQ support
support-coordinated corrected rerun
```

## Terminal Manifest completion

Published and blocked outcomes now receive separate terminal Manifest treatment:

```text
published:
  canonical delivery decision required
  report and storage identity required
  certified PDF receipt required

blocked:
  terminal code required
  failure class required
  credit/remedy state recorded
  canonical delivery decision retained when available
  no report publication is implied
```

If a report was content-eligible but later failed PDF or storage, the Manifest preserves the deliverable content decision and separately records blocked publication. The dashboard must display the internal platform failure without misclassifying the customer's documents.

## Gate 3 production files

```text
api/_lib/report-quality-manifest.js
api/_lib/report-quality-incident-projection.js
api/admin/quality-incidents.js
api/admin-run-worker.js
api/_lib/generate-client-report-impl.js
src/components/Admin/QualityIncidentDashboard.jsx
src/pages/AdminDashboard.jsx
package.json
```

## Permanent local acceptance

```text
tests/qa/report-quality-manifest-smoke.js: PASS
tests/qa/report-quality-incident-projection-smoke.js: PASS
tests/qa/admin-quality-incidents-smoke.js: PASS
npm.cmd run qa:quality-ops: PASS
npm.cmd run qa:full: PASS
npm.cmd run build: PASS
P0-A through P0-D: PASS
Source Truth constitutional matrix: PASS
Support Document Authority adversarial matrix: PASS, 24 scenarios
git diff --check: PASS
```

## Updated ELITE roadmap checkpoint

```text
Gate 1: controlled live Acquisition proof - PASS
Gate 2: Canonical Report Quality Manifest - PASS / committed
Gate 3: Admin Quality Incident and Customer Remedy Dashboard - PASS locally
Gate 4: Institutional Financial Intelligence - NEXT after Gate 3 deployment verification
Gate 5: Institutional Underwriting
Gate 6: Investment Committee Memo
Gate 7: Scenario Engine
Gate 8: Due Diligence Engine
Gate 9: Institutional Scoring
Gate 10: ELITE Presentation and PDF system
Gate 11: Launch operations, monitoring, analytics, and certification
```

Gate 4 begins with new deterministic, source-bound debt-service and DSCR contracts. Legacy underwriting code remains quarantined and must not be reused if it can weaken the current authority chain.

---

## July 16 deployed Gate 3 verification and Gate 4A checkpoint

```text
Gate 1: controlled live Acquisition proof - PASS
Gate 2: Canonical Report Quality Manifest - PASS / committed
Gate 3: Admin Quality Incident and Customer Remedy Dashboard - PASS / deployed / production route verified
Gate 4A: Canonical debt-service input contract - PASS locally / uncommitted / undeployed
Gate 4B: Deterministic annual and monthly debt-service math - NEXT
```

The deployed Admin Dashboard loaded `BLOCKED`, `PUBLISHED WITH LIMITATIONS`, and `PUBLISHED CLEAN`, plus the required receipt-only projection and no-legacy-alias signals. Its empty state is valid because no finalized post-Gate-3 Manifest has yet populated the queues.

The Vercel Hobby ceiling is protected at 12 / 12 deployable functions by `tests/qa/vercel-function-budget-smoke.js`. Future API additions must consolidate behind existing entrypoints or intentionally change hosting architecture; they may not silently exceed the deployment budget.

Gate 4A is not an admin remedy or authority surface. It consumes canonical Source Truth, records calculation eligibility, preserves exact provenance, and never mutates Source Truth, Delivery Gate, publication, credits, billing, or customer lifecycle. Optional debt ambiguity remains a narrow analysis collapse and never becomes a core-valid report blocker.

## July 16 Gate 4B checkpoint

```text
Gate 3: PASS / deployed / production route verified
Gate 4A: PASS locally / canonical debt-service input contract
Gate 4B: PASS locally / deterministic monthly and annual debt-service math
Gate 4C: NEXT / DSCR eligibility and deterministic coverage calculation
```

Gate 4B is not yet connected to the Admin Dashboard or customer report. It creates immutable calculation receipts only. Modeled results require qualification and cannot be presented as source-stated payments. Collapsed calculations remain null and non-blocking.

The permanent Gate 4B proof includes source-stated annualization, modeled current debt, modeled proposed financing, zero and near-zero rates, incomplete inputs, evidence gaps, conflicts, unsafe payment periods, deterministic rounding, immutability, no em dash characters, and no customer-visible implementation terminology.

## July 16 Gate 4C checkpoint

```text
Gate 3: PASS / deployed / production route verified
Gate 4A: PASS / committed and deployed at e3e080e
Gate 4B: PASS / committed and deployed at e3e080e
Gate 4C: PASS locally / deterministic current and proposed coverage
Gate 4D: NEXT / maturity, fixed/floating, refinancing, and lender-fee risk
```

Gate 4C is not yet connected to the Admin Dashboard or customer report. It creates immutable current and proposed coverage receipts only. Bridge, exit, and stress remain not calculated until canonical scenario inputs exist.

The future Quality Manifest can distinguish calculated coverage, collapsed coverage, missing numerator, missing denominator, evidence gap, authority conflict, modeled-denominator qualification, and scenario-contract absence without reconstructing facts from raw artifacts.

Gate 4C does not infer covenant thresholds, pass/fail labels, risk tiers, scenarios, or customer recommendations. It does not mutate Source Truth, delivery, publication, credits, billing, or customer lifecycle.
