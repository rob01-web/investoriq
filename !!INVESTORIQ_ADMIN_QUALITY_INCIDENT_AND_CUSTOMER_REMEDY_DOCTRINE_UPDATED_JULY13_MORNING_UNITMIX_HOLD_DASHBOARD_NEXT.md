# July 15, 2026 Active Status

The Admin Quality Incident and Customer Remedy Doctrine remains mandatory.

The Support Document Authority repair and P0-A through P0-D now pass locally. Implementation is intentionally queued after:

```text
1. the accepted local bundle is committed and deployed;
2. one controlled live Acquisition proof passes;
3. the Canonical Report Quality Manifest contract is implemented.
```

The dashboard must consume a canonical Report Quality Manifest. It must not infer truth independently from filenames, parser labels, raw file rows, HTML, or scattered logs.

Current next-project order:

```text
commit and deploy P0-A through P0-D
-> one controlled live Acquisition proof
-> canonical Report Quality Manifest
-> bounded audit of existing admin architecture against the Manifest
-> persistence and quality-event capture
-> dashboard queues
-> incident detail
-> customer remedy controls
-> proactive alerts
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
- reports awaiting customer replacement documents

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
- offer a replacement-document rerun path

---

## 7. Customer Remedy Ladder

### Level 1: Minor Disclosed Limitation

- report remains delivered
- limitation is clearly disclosed
- customer may upload replacement support and rerun

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
- issue free rerun
- restore credit
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

# July 15, 2026 P0 Completion and Dashboard Continuation Addendum

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
