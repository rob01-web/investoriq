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
