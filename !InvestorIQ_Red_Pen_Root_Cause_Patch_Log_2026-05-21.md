# InvestorIQ Red-Pen Root-Cause Patch Log

**Created:** May 21, 2026  
**Purpose:** Running root-cause issue log from the 6-report validation series.  
**Standard:** Every report must be elite for every user. There is no Ken Dunn tier, public-sample tier, high-value-outreach tier, or regular-customer tier. Ken-style review is only the review standard we apply to everyone.

---

## Operating Doctrine

- **One elite report-quality standard:** every InvestorIQ customer report must be good enough for sophisticated institutional scrutiny.
- **No “fixing reports”:** individual PDFs are evidence. We patch the root system class that produced the issue.
- **No one-off duct tape:** every issue must be classified into a reusable class/sub-class and patched at the source.
- **Canonical truth wins:** final report surfaces must consume canonical parsed/validated state, not stale local fallbacks.
- **Optional gaps collapse/disclose:** optional missing or unsupported sections should collapse or disclose cleanly, not create fake certainty.
- **True contradictions are surfaced institutionally:** material source contradictions should cap/qualify conclusions and avoid overconfident scoring or valuation presentation.
- **No broad refactors:** use small, tightly scoped patches with focused validation.
- **No root-class reopening without evidence:** only reopen a previously closed class when a live report exposes a concrete failure.

---

# Running Issue Classes and Patch Candidates

## 1. SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT

**Scope:** System-wide, mainly Full Underwriting first; Screening may need separate copy rules if source reconciliation appears there.  
**Triggered by:** Test 1 / FINAL TEST 1 / Maplewell Court.  
**Severity:** Ken/public blocker; customer-deliverable with disclosure.  
**Status:** Open.

### Root Issue

When rent roll and T12 are materially unreconciled, the system correctly detects the issue and caps the classification, but some report surfaces still present overconfident or misaligned conclusions.

### Observed Evidence from Test 1

- Cover classification correctly showed: `Review - Source Reconciliation Disclosure`.
- Rent Roll vs T12 GPR variance was material: `-48.0%`.
- Delivery gate correctly allowed customer delivery with `customer_delivery_impact = disclose_only`.
- But Deal Scorecard still displayed `Composite Score: 95 / 100`.
- Executive Summary primary constraint focused on current debt/source completeness rather than the actual rent-roll/T12 reconciliation issue.
- Generic refinance pressure language appeared even though current-debt DSCR was very strong at about `7.10x`.

### Sub-Classes

#### 1.1 Composite Score Overconfidence Under Reconciliation Cap

**Scope:** Full Underwriting; may also affect Screening if a score-like surface is later introduced.  
**Problem:** `Composite Score: 95 / 100` visually conflicts with `Review - Source Reconciliation Disclosure`.  
**Patch Direction:**
- When classification is capped by source reconciliation, qualify or subordinate the score.
- Possible label: `Operating Metrics Score` or `Source-Constrained Composite Score`.
- Add local note: score reflects available metrics only and is capped pending reconciliation.
- Do not change underlying deterministic row scores unless the scoring doctrine explicitly changes.

#### 1.2 Executive Summary Primary Constraint Misalignment

**Scope:** Full Underwriting; separate Screening wording if needed.  
**Problem:** Executive Summary names current debt/source completeness as primary constraint when actual constraint is rent-roll/T12 reconciliation.  
**Patch Direction:**
- If source reconciliation caps classification, Executive Summary primary constraint should say that directly.
- Candidate wording:
  `Primary Constraint: Rent roll and T12 income evidence remain materially unreconciled; classification is capped pending source reconciliation.`

#### 1.3 Generic Refinance-Pressure Copy Leakage

**Scope:** Full Underwriting.  
**Problem:** Report says refinance proceeds are constrained by declining coverage/reduced capital flexibility even when DSCR is strong and no refi stress math supports the claim.  
**Patch Direction:**
- Only render refinance-proceeds constraint language when refi/current-debt stress math supports it.
- For source-reconciliation caps, replace with source-reconciliation-specific limitation copy.

#### 1.4 Classification Phrase Drift

**Scope:** Full Underwriting, possibly system-wide classification surfaces.  
**Problem:** Report uses both `Review - Source Reconciliation Disclosure` and `Document-Constrained Review`.  
**Patch Direction:**
- Use one visible classification phrase consistently across cover, Executive Summary, capital risk profile, scorecard, and risk surfaces.
- For Test 1 class, preferred phrase:
  `Review - Source Reconciliation Disclosure`.

#### 1.5 DCF / Valuation Prominence Under Source Reconciliation Cap

**Scope:** Full Underwriting DCF/scenario/valuation surfaces.  
**Problem:** DCF and framework value outputs still render prominently even when T12/rent roll income evidence is materially unreconciled.  
**Patch Direction:**
- Keep framework valuation if mathematically supported by reported T12 NOI, but add a local limitation note near value outputs.
- Candidate wording:
  `Value sensitivity is based on reported T12 NOI and remains subject to the rent roll/T12 reconciliation disclosure in Data Coverage.`

#### 1.6 Reconciliation Warning Repetition

**Scope:** Full Underwriting report narrative.  
**Problem:** The same `Rent Roll vs T12 GPR variance: -48.0%. See Data Coverage.` note appears repeatedly.  
**Patch Direction:**
- Keep one strong disclosure in Data Coverage.
- Keep one or two low-prominence analytical references.
- Avoid repetitive bullet-style duplication across many sections.

#### 1.7 Field Completeness vs Source Reconciliation Confusion

**Scope:** Data Coverage; likely Full Underwriting and Screening.  
**Problem:** Data Coverage says T12 and Rent Roll are `4/4 100.0% None`, which is true for field extraction but can visually conflict with major source reconciliation disclosure.  
**Patch Direction:**
- Keep field extraction completeness.
- Add nearby distinction:
  `Field extraction completeness does not imply cross-source reconciliation.`

---

## 2. METHODOLOGY_INSTITUTIONAL_WORDING_CLEANUP

**Scope:** System-wide; both Screening and Full Underwriting.  
**Triggered by:** Test 1 page 16.  
**Severity:** Small polish; not customer blocker.  
**Status:** Open.

### Problem

Methodology still says:

`InvestorIQ does not invent missing data or fabricate market inputs.`

This is understandable but less institutional than desired.

### Patch Direction

Replace with:

`Unverified inputs are excluded; no synthetic values are introduced into deterministic outputs.`

---

## 3. ANCILLARY_INCOME_CONCENTRATION_LABEL_POLISH

**Scope:** Full Underwriting operating profile; possibly Screening if same metric appears.  
**Triggered by:** Test 1.  
**Severity:** Small/medium polish.  
**Status:** Open.

### Problem

`TOP INCOME LINE CONCENTRATION 1.5%` looks odd because base rent is not shown in that concentration calculation; it appears to be based only on ancillary positive income lines such as parking/laundry.

### Patch Direction

- Rename to `Largest Ancillary Income Line`, or
- Suppress when only ancillary income lines are being shown, or
- Include a more explicit basis label.

---

## 4. PUBLIC_SAMPLE_NAME_HYGIENE

**Scope:** Distribution/public sample workflow only; must not affect normal customer delivery.  
**Triggered by:** Test 1 cover using `FINAL TEST 1`.  
**Severity:** Public/Ken sample blocker only; not product-quality logic.  
**Status:** Open / operational.

### Problem

Test names like `FINAL TEST 1`, `RETEST`, `QA`, `TEST`, etc. are fine for internal validation but not for public/Ken/outreach samples.

### Patch Direction

- Do not sanitize or block customer reports based on names.
- For public/demo generation, use clean property names and clean filenames.
- Keep this as distribution hygiene, not report-quality gating.

---

# Confirmed Passes from Test 1

These should not be patched unless later tests expose a concrete regression:

- Cover pill removal: PASS.
- Current debt parsing and rendering: PASS.
- DSCR computed and rendered: PASS.
- Stale missing-debt contradiction removed: PASS.
- Property tax parsing and rendering: PASS.
- Customer delivery gate: PASS.
- Source reconciliation detection: PASS.
- Data Coverage heading: PASS.
- Document Treatment Summary: PASS.
- Report published: PASS.

---

# Test-by-Test Log

## Test 1 — FINAL TEST 1 / Maplewell Court

**Customer-deliverable:** Yes, with disclosure.  
**Ken/public/outreach-ready:** No.  
**Primary open class:** `SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT`.

### Issues Logged

1. Composite Score too loud under source reconciliation cap.
2. Executive Summary primary constraint names wrong issue.
3. Generic refinance-pressure language leaks despite strong DSCR.
4. Classification wording drift: `Review - Source Reconciliation Disclosure` vs `Document-Constrained Review`.
5. DCF/value outputs need local limitation when source reconciliation caps classification.
6. Reconciliation warning repeats across multiple surfaces.
7. Data Coverage field completeness could be confused with cross-source reconciliation.
8. Methodology wording still less institutional.
9. Top Income Line Concentration label feels odd.
10. Public sample property name hygiene: `FINAL TEST 1`.

---

# Parking Lot / Cross-Test Watchlist

Add items here if they repeat across tests before creating a patch prompt:

- Does source reconciliation overconfidence appear in multiple Underwriting reports?
- Does generic refinance-pressure copy appear outside true weak-DSCR/refi-stress cases?
- Does Composite Score need a universal cap/label strategy when classification is Review?
- Does DCF need a universal local limitation note when operating source truth is capped or constrained?
- Does Data Coverage need a clearer split between field extraction completeness and cross-document reconciliation?
- Do Screening reports need separate source-reconciliation treatment, or is this Underwriting-only for now?


---

# Test 2 Addendum — FINAL TEST 2 / Silvergate Manor

**Customer-deliverable:** Yes, with disclosure.  
**Elite-for-every-user ready:** No.  
**Primary repeated class:** `SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT`.  
**New/confirmed watch class:** `UNSUPPORTED_DOCUMENT_GATING_SURFACE_ALIGNMENT`.  
**Confirmed pass class:** `HISTORICAL_CAPEX_CONTEXT_ONLY_RENDERING`.

## Added / Repeated Issues

### SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT — Repeated / Systemic

- Report correctly classified as `Review - Source Reconciliation Disclosure`.
- Material rent roll vs T12 GPR variance repeated, this time around `-53.2%`.
- Composite Score still rendered prominently at `88 / 100`.
- Executive Summary still prioritized missing current debt as the primary constraint instead of the rent-roll/T12 reconciliation cap.
- DCF/value outputs still rendered prominently under a source-reconciliation cap.
- Data Coverage field completeness still showed `4/4 100% None`, which may be confused with cross-source reconciliation completeness.

### NO_CURRENT_DEBT_SECTION_SURFACE_COLLAPSE — New / Underwriting-only

- Full `Refinance Stress Test & Constraint Analysis` section rendered even though current debt was not assessed.
- Existing copy was accurate, but the section presence may overemphasize a non-assessed analysis.
- Patch direction: if no true current debt is verified, collapse full refi stress-test section and disclose limitation in Executive Summary / Data Coverage / Risk Register only.

### UNSUPPORTED_DOCUMENT_GATING_SURFACE_ALIGNMENT — Pass / Watch

- Unsupported appraisal, market survey, broker email, and Phase I ESA were listed for auditability only.
- Unsupported documents did not override structured T12/rent roll outputs.
- Keep as pass/watch unless later tests show quantitative contamination.

### HISTORICAL_CAPEX_CONTEXT_ONLY_RENDERING — Pass / Watch

- Historical CapEx source was displayed for context only.
- No ROI, rent lift, payback, or forward-looking schedule was modeled.
- Keep as pass/watch.

### Repeated Small Polish

- `ANCILLARY_INCOME_CONCENTRATION_LABEL_POLISH` repeated.
- `METHODOLOGY_INSTITUTIONAL_WORDING_CLEANUP` repeated.
- `PUBLIC_SAMPLE_NAME_HYGIENE` repeated because report name remained `FINAL TEST 2`.

---

# Test 3 Addendum — FINAL TEST 3 / Northbank Terrace

**Customer-deliverable:** Yes, with disclosure.  
**Elite-for-every-user ready:** No.  
**Primary repeated class:** `SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT`.  
**Repeated underwriting-only class:** `NO_CURRENT_DEBT_SECTION_SURFACE_COLLAPSE`.  
**Confirmed pass class:** `RENOVATION_BUDGET_NO_ROI_RENDERING`.  
**Confirmed watch class:** `UNSUPPORTED_OFFERING_SUMMARY_GATING`.

## Added / Repeated Issues

### SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT — Repeated / Systemic

- Report correctly classified as `Review - Source Reconciliation Disclosure`.
- Material rent roll vs T12 GPR variance repeated, this time around `-51.4%`.
- Executive Summary still prioritizes missing current debt as primary constraint, even though the classification cap is source reconciliation.
- Composite Score still renders prominently at `94 / 100` despite source-reconciliation cap.
- DCF/framework value outputs still render prominently under a material source-reconciliation cap.
- Data Coverage field completeness still shows `T12 4/4 100% None` and `Rent Roll 4/4 100% None`, which needs clearer separation from cross-source reconciliation status.

### NO_CURRENT_DEBT_SECTION_SURFACE_COLLAPSE — Repeated / Underwriting-only

- Full refinance stress-test section rendered despite no verified current debt.
- Copy was accurate (`Not Assessed`), but the section feels too large for absent debt inputs.
- Patch direction remains: collapse the full section when no true current debt is verified; retain limitation in Executive Summary / Data Coverage / Risk Register.

### RENOVATION_BUDGET_NO_ROI_RENDERING — Pass / Watch

- Renovation source included budget categories and total budget but explicitly lacked rent lift, ROI, payback, phasing, cost recovery, and implementation schedule.
- Report correctly displayed budget/scope items and did not model ROI/payback/rent lift.
- Watch for duplication: the same “does not model renovation ROI...” language appears in both an InvestorIQ note and Interpretation.

### UNSUPPORTED_OFFERING_SUMMARY_GATING — Pass / Watch

- Offering summary included asking price, asset type, year built, and utilities.
- Report listed the offering summary for auditability only and did not use asking price as purchase price/acquisition debt/current debt.
- This is correct. Keep as pass/watch.

### Additional Small / Medium Polish

- `PRIMARY_CONSTRAINT_PRIORITY_ORDERING` is now clearly part of the source-reconciliation class: when source reconciliation caps the report, it should outrank missing current debt as the primary constraint.
- `RENOVATION_NOTE_DUPLICATION_POLISH`: Renovation section repeats essentially the same limitation language twice.
- `METHODOLOGY_INSTITUTIONAL_WORDING_CLEANUP` repeated.
- `PUBLIC_SAMPLE_NAME_HYGIENE` repeated because report name remained `FINAL TEST 3`.

---

# Updated Cross-Test Priority After Tests 1–3

## Confirmed Systemic / Patch Required

1. `SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT`
   - Repeated across Tests 1, 2, and 3.
   - System-wide logic concern, with Full Underwriting surfaces exposed first.
   - Includes Executive Summary constraint alignment, composite score qualification, DCF/value limitation notes, Data Coverage clarity, and classification consistency.

2. `NO_CURRENT_DEBT_SECTION_SURFACE_COLLAPSE`
   - Repeated in Tests 2 and 3.
   - Full Underwriting only.
   - Accurate copy is not enough; non-assessed refi analysis should not occupy a full standalone section.

## Confirmed Pass / Watch

3. `UNSUPPORTED_DOCUMENT_GATING_SURFACE_ALIGNMENT`
   - Passed in Test 2.
   - Unsupported appraisal, market survey, ESA, and broker note did not contaminate quantitative outputs.

4. `HISTORICAL_CAPEX_CONTEXT_ONLY_RENDERING`
   - Passed in Test 2.

5. `RENOVATION_BUDGET_NO_ROI_RENDERING`
   - Passed in Test 3.
   - Watch duplication only.

6. `UNSUPPORTED_OFFERING_SUMMARY_GATING`
   - Passed in Test 3.
   - Asking price was not incorrectly used as purchase/current debt.

## Repeated Polish

7. `METHODOLOGY_INSTITUTIONAL_WORDING_CLEANUP`
8. `PUBLIC_SAMPLE_NAME_HYGIENE`
9. `ANCILLARY_INCOME_CONCENTRATION_LABEL_POLISH`
10. `RENOVATION_NOTE_DUPLICATION_POLISH`


---

# Test 4 Addendum — FINAL TEST 4 / Willowmere Place

**Customer-deliverable:** Yes, with disclosure.  
**Elite-for-every-user ready:** No.  
**Primary repeated class:** `SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT`.  
**Repeated underwriting-only class:** `NO_CURRENT_DEBT_SECTION_SURFACE_COLLAPSE`.  
**Confirmed pass class:** `FORWARD_RENOVATION_RENT_LIFT_TRANSPARENCY_RENDERING`.  
**Repeated polish class:** `ANCILLARY_INCOME_CONCENTRATION_LABEL_POLISH`.

## Added / Repeated Issues

### SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT — Repeated / Systemic

- Report correctly classified as `Review - Source Reconciliation Disclosure`.
- Material rent roll vs T12 GPR variance repeated, this time around `-48.9%`.
- Executive Summary still prioritizes missing current debt as primary constraint, even though the classification cap is source reconciliation.
- Composite Score still renders prominently at `94 / 100` despite source-reconciliation cap.
- DCF/framework value outputs still render prominently under a material source-reconciliation cap.
- Data Coverage field completeness still shows `T12 4/4 100% None` and `Rent Roll 4/4 100% None`, which needs clearer separation from cross-source reconciliation status.
- Local QA advisory confirms significant variance needs clearer explanation or reconciliation.

### NO_CURRENT_DEBT_SECTION_SURFACE_COLLAPSE — Repeated / Underwriting-only

- Full `Refinance Stress Test & Constraint Analysis` section rendered despite no verified current debt.
- Copy was accurate (`Not Assessed`), but the section still feels too large for absent debt inputs.
- Patch direction remains: collapse the full section when no true current debt is verified; retain limitation in Executive Summary / Data Coverage / Risk Register.

### FORWARD_RENOVATION_RENT_LIFT_TRANSPARENCY_RENDERING — Pass / Watch

- Renovation source included supported rent-lift assumptions, unit counts, cost per unit, phase timing, and total forward-looking budget.
- Report correctly displayed document-stated rent-lift assumptions by row.
- Report correctly stated that ROI, payback, and cost recovery were not modeled.
- This is a good pass: supported rent lift can be displayed, but not converted into unsupported ROI/payback/valuation unless those assumptions are document-supported.
- Watch item: section title says `Renovation Budget Breakdown`, which was previously flagged as a possible hardcoded label. Consider whether `Renovation Strategy & Capital Plan` or `Document-Stated Renovation Plan` is more institutional.

### ANCILLARY_INCOME_CONCENTRATION_LABEL_POLISH — Repeated

- `TOP INCOME LINE CONCENTRATION 1.2%` repeated with only Laundry Income shown.
- This confirms the label is awkward across multiple reports where only ancillary income appears.

### Additional Small / Medium Polish

- `METHODOLOGY_INSTITUTIONAL_WORDING_CLEANUP` repeated.
- `PUBLIC_SAMPLE_NAME_HYGIENE` repeated because report name remained `FINAL TEST 4`.
- `RENOVATION_RENT_LIFT_NOT_NOMODEL_COPY_POLISH`: wording is mostly good, but may need a smoother distinction between document-stated gross annual rent-lift potential and non-modeled ROI/payback/NOI/valuation impact.

---

# Updated Cross-Test Priority After Tests 1–4

## Confirmed Systemic / Patch Required

1. `SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT`
   - Repeated across Tests 1, 2, 3, and 4.
   - System-wide logic concern, Full Underwriting surfaces exposed first.
   - Includes Executive Summary constraint alignment, composite score qualification, DCF/value limitation notes, Data Coverage clarity, and classification consistency.

2. `NO_CURRENT_DEBT_SECTION_SURFACE_COLLAPSE`
   - Repeated in Tests 2, 3, and 4.
   - Full Underwriting only.
   - Accurate copy is not enough; non-assessed refi analysis should not occupy a full standalone section.

## Confirmed Pass / Watch

3. `UNSUPPORTED_DOCUMENT_GATING_SURFACE_ALIGNMENT`
   - Passed in Test 2.

4. `HISTORICAL_CAPEX_CONTEXT_ONLY_RENDERING`
   - Passed in Test 2.

5. `RENOVATION_BUDGET_NO_ROI_RENDERING`
   - Passed in Test 3.

6. `UNSUPPORTED_OFFERING_SUMMARY_GATING`
   - Passed in Test 3.

7. `FORWARD_RENOVATION_RENT_LIFT_TRANSPARENCY_RENDERING`
   - Passed in Test 4.
   - Watch only for wording/label polish.

## Repeated Polish

8. `METHODOLOGY_INSTITUTIONAL_WORDING_CLEANUP`
9. `PUBLIC_SAMPLE_NAME_HYGIENE`
10. `ANCILLARY_INCOME_CONCENTRATION_LABEL_POLISH`
11. `RENOVATION_NOTE_DUPLICATION_POLISH`
12. `RENOVATION_RENT_LIFT_NOT_NOMODEL_COPY_POLISH`


---

# Test 5 Addendum — FINAL TEST 5 / Riverside WalkUp

**Outcome:** Failed before report publication.  
**Report type:** Screening.  
**Customer-facing result:** Source package could not be verified.  
**Elite-for-every-user ready:** Pass for fail-closed behavior, watch for copy/diagnostics.  
**Primary confirmed pass class:** `SCREENING_BAD_RENT_ROLL_FAIL_CLOSED`.  
**New/confirmed operational class:** `FAILED_STATE_COPY_AND_DIAGNOSTIC_CLARITY`.  
**Open infrastructure watch:** `WORKER_CONTINUATION_RELIABILITY`.

## What Happened

- T12 parsed successfully.
- Rent roll did not produce a valid structured rent-roll artifact.
- AI rent-roll recovery attempted but was rejected by deterministic validation.
- Job failed at extracting before report publication.
- Entitlement was restored.
- Customer-facing failed state displayed: `FAILED - SCREENING - MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`.

## Confirmed Pass

### SCREENING_BAD_RENT_ROLL_FAIL_CLOSED — Pass / Screening

- Bad or vague rent roll did not produce a report.
- The system did not hallucinate rent-roll totals or publish a misleading Screening report.
- AI recovery was attempted but rejected for valid reasons:
  - `candidate_not_rent_roll`
  - `candidate_below_confidence`
  - `missing_unit_rows`
  - `missing_total_units`
  - `missing_occupied_units`
  - `missing_occupancy`
  - `missing_in_place_rent`
  - `vague_rent_roll_no_reliable_totals`
- This confirms the intake doctrine: uploaded slot/filename is not enough; validated document content is authority.

## Watch / Polish

### FAILED_STATE_COPY_AND_DIAGNOSTIC_CLARITY — New / System-wide failed-state UX

- Customer-facing copy is generally acceptable and says the source package could not be verified.
- However, the visible code `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` is technical.
- Patch direction:
  - Keep internal error code for diagnostics.
  - Consider a more customer-facing headline/body:
    `The uploaded rent roll could not be verified as a usable rent roll.`
    `A report credit was restored. Please start a new report with a clearer rent roll for the same property and period.`
  - For admin/internal diagnostics, preserve exact reason codes.

### MISSING_STRUCTURED_FINANCIAL_ARTIFACTS_DIAGNOSTIC_PRECISION — Watch / Worker validation

- Worker event reported missing `rent_roll` and `t12_or_operating_statement` even though T12 parsed successfully.
- Need verify whether this is just generic copy/list construction or a diagnostic bug.
- Patch direction:
  - If T12 parsed and rent roll failed, internal missing list should identify only the missing/invalid artifact: `rent_roll`.
  - Do not weaken fail-closed behavior.

### WORKER_CONTINUATION_RELIABILITY — Repeated operational watch

- Test 5 participated in the broader batch where some reports needed GitHub worker intervention to leave extracting.
- This is separate from report-quality patching but remains a workflow reliability issue.

## Confirmed Non-Issue

- This is not a report-surface failure because no report was published.
- This is not a source-reconciliation issue.
- This is not a parser hallucination issue; parser/AI recovery failed closed correctly.

---

# Updated Cross-Test Priority After Tests 1–5

## Confirmed Systemic / Patch Required

1. `SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT`
   - Repeated across Tests 1, 2, 3, and 4.
   - System-wide logic concern, Full Underwriting surfaces exposed first.

2. `NO_CURRENT_DEBT_SECTION_SURFACE_COLLAPSE`
   - Repeated in Tests 2, 3, and 4.
   - Full Underwriting only.

## Confirmed Pass / Watch

3. `SCREENING_BAD_RENT_ROLL_FAIL_CLOSED`
   - Passed in Test 5.
   - Bad rent roll did not publish a Screening report.

4. `UNSUPPORTED_DOCUMENT_GATING_SURFACE_ALIGNMENT`
   - Passed in Test 2.

5. `HISTORICAL_CAPEX_CONTEXT_ONLY_RENDERING`
   - Passed in Test 2.

6. `RENOVATION_BUDGET_NO_ROI_RENDERING`
   - Passed in Test 3.

7. `UNSUPPORTED_OFFERING_SUMMARY_GATING`
   - Passed in Test 3.

8. `FORWARD_RENOVATION_RENT_LIFT_TRANSPARENCY_RENDERING`
   - Passed in Test 4.

## Repeated Polish / Operational

9. `FAILED_STATE_COPY_AND_DIAGNOSTIC_CLARITY`
10. `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS_DIAGNOSTIC_PRECISION`
11. `WORKER_CONTINUATION_RELIABILITY`
12. `METHODOLOGY_INSTITUTIONAL_WORDING_CLEANUP`
13. `PUBLIC_SAMPLE_NAME_HYGIENE`
14. `ANCILLARY_INCOME_CONCENTRATION_LABEL_POLISH`
15. `RENOVATION_NOTE_DUPLICATION_POLISH`
16. `RENOVATION_RENT_LIFT_NOT_NOMODEL_COPY_POLISH`


---

# Test 6 Addendum — FINAL TEST 6 / Elmstone Gardens

**Outcome:** Failed before report publication.  
**Report type:** Screening.  
**Customer-facing result:** Source package could not be reconciled.  
**Elite-for-every-user ready:** Pass for fail-closed behavior, with minor diagnostic/copy watch.  
**Primary confirmed pass class:** `SCREENING_FINANCIAL_SCALE_MISMATCH_FAIL_CLOSED`.  
**Repeated operational watch:** `WORKER_CONTINUATION_RELIABILITY`.

## What Happened

- T12 parsed successfully.
- Rent roll parsed successfully.
- The system then compared the T12 and rent roll and detected a material financial scale mismatch.
- Job failed before publication.
- Entitlement was restored.
- Customer-facing failed state displayed: `FAILED - SCREENING - DOCUMENT_FINANCIAL_SCALE_MISMATCH`.

## Confirmed Pass

### SCREENING_FINANCIAL_SCALE_MISMATCH_FAIL_CLOSED — Pass / Screening

- The system did not publish a Screening report when T12 and rent roll scale were irreconcilable.
- The mismatch was extreme:
  - T12 effective gross income: `$1,200,000`
  - Rent roll annual in-place rent: `$120,000`
  - Ratio: `10x`
- The system halted publication and restored the report credit.
- This confirms the cross-document scale gate is working for Screening.

## Watch / Polish

### FAILED_STATE_COPY_AND_DIAGNOSTIC_CLARITY — Repeated / System-wide failed-state UX

- Test 6 customer-facing copy is better than Test 5 because it explains the T12 and rent roll could not be reconciled.
- The visible code `DOCUMENT_FINANCIAL_SCALE_MISMATCH` is still technical but acceptable for now.
- Consider softer customer-facing copy later while preserving internal exact error code.

### WORKER_CONTINUATION_RELIABILITY — Repeated operational watch

- Test 6 was part of the same 6-report batch where some jobs required GitHub worker intervention to leave extracting.
- Separate operational issue from report quality.

## Confirmed Non-Issue

- This is not a report-surface failure because no report was published.
- This is not a parser miss: both structured artifacts parsed, then the scale gate correctly blocked publication.
- This is not a source-reconciliation disclosure case; the mismatch was severe enough to fail closed rather than publish with disclosure.

---

# Updated Cross-Test Priority After Tests 1–6

## Confirmed Systemic / Patch Required

1. `SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT`
   - Repeated across Tests 1, 2, 3, and 4.
   - System-wide logic concern, Full Underwriting surfaces exposed first.
   - Primary patch family after the 6-test review.

2. `NO_CURRENT_DEBT_SECTION_SURFACE_COLLAPSE`
   - Repeated in Tests 2, 3, and 4.
   - Full Underwriting only.
   - Accurate copy is not enough; non-assessed refi analysis should not occupy a full standalone section.

## Confirmed Fail-Closed Passes

3. `SCREENING_BAD_RENT_ROLL_FAIL_CLOSED`
   - Passed in Test 5.
   - Bad/vague rent roll did not publish a Screening report.

4. `SCREENING_FINANCIAL_SCALE_MISMATCH_FAIL_CLOSED`
   - Passed in Test 6.
   - Parsed but financially irreconcilable T12/rent-roll package did not publish a Screening report.

## Confirmed Pass / Watch

5. `UNSUPPORTED_DOCUMENT_GATING_SURFACE_ALIGNMENT`
   - Passed in Test 2.

6. `HISTORICAL_CAPEX_CONTEXT_ONLY_RENDERING`
   - Passed in Test 2.

7. `RENOVATION_BUDGET_NO_ROI_RENDERING`
   - Passed in Test 3.

8. `UNSUPPORTED_OFFERING_SUMMARY_GATING`
   - Passed in Test 3.

9. `FORWARD_RENOVATION_RENT_LIFT_TRANSPARENCY_RENDERING`
   - Passed in Test 4.

## Repeated Polish / Operational

10. `FAILED_STATE_COPY_AND_DIAGNOSTIC_CLARITY`
11. `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS_DIAGNOSTIC_PRECISION`
12. `WORKER_CONTINUATION_RELIABILITY`
13. `METHODOLOGY_INSTITUTIONAL_WORDING_CLEANUP`
14. `PUBLIC_SAMPLE_NAME_HYGIENE`
15. `ANCILLARY_INCOME_CONCENTRATION_LABEL_POLISH`
16. `RENOVATION_NOTE_DUPLICATION_POLISH`
17. `RENOVATION_RENT_LIFT_NOT_NOMODEL_COPY_POLISH`

---

# Six-Test Series Rollup

## Passed as Designed

- Screening wrong/bad rent roll failed closed.
- Screening T12/rent-roll financial scale mismatch failed closed.
- Entitlements restored on fail-closed document/package failures.
- Renovation budget with no ROI inputs displayed budget/scope only and did not model ROI/payback.
- Renovation plan with explicit rent-lift inputs displayed document-stated rent-lift assumptions without unsupported ROI/payback/valuation modeling.
- Unsupported appraisal/market survey/ESA/broker support did not contaminate modeled outputs.
- Offering summary asking price did not become current debt or acquisition debt.
- Cover pill removal held across reports.

## Needs Root-Class Patch

- Source-reconciliation-capped Underwriting reports still present optimistic score/value surfaces too loudly and choose missing current debt as primary constraint.
- No-current-debt underwriting reports still render a full refi section instead of collapsing to a disclosure/limitation.
- Small repeated polish classes should be handled after the root-class patches.


---

# Final Six-Test Review Addendum — Patch Planning Snapshot

**Added:** May 21, 2026  
**Status:** Six-test validation series complete.  
**Overall result:** BOOOOOOOOM with focused homework.

## Final Doctrine From This Test Series

- Every report must meet the same elite standard for every user.
- There is no Ken Dunn version, public-sample version, or regular-customer version of quality.
- Reports are not being manually fixed; reports are evidence used to identify root system classes.
- Tests 5 and 6 failing is not a product failure. They are proof that fail-closed gates worked.
- The main issue is now narrow and repeated, not chaotic: source-reconciliation-capped reports need better surface alignment.

---

# Final Six-Test Outcome Table

| Test | Type | Outcome | Root Result |
|---|---:|---|---|
| Test 1 | Underwriting | Published with disclosure | Exposed source-reconciliation surface misalignment |
| Test 2 | Underwriting | Published with disclosure | Repeated source-reconciliation misalignment and no-current-debt refi section issue |
| Test 3 | Underwriting | Published with disclosure | Repeated same classes; renovation no-ROI handling passed |
| Test 4 | Underwriting | Published with disclosure | Repeated same classes; document-stated rent-lift display passed |
| Test 5 | Screening | Failed closed | Bad/vague rent roll rejected; no report published; entitlement restored |
| Test 6 | Screening | Failed closed | Extreme T12/rent-roll scale mismatch blocked; entitlement restored |

---

# Final Patch Priority Plan

## Priority 1 — SOURCE_RECONCILIATION_REVIEW_SURFACE_ALIGNMENT

**Scope:** System-wide classification/display doctrine, but patch should start in Full Underwriting surfaces because Tests 1–4 exposed it there.  
**Severity:** Highest.  
**Why first:** Repeated across four published reports. This is the only clearly systemic report-surface class from the six-test batch.

### Required Behavioral Outcome

When source reconciliation materially caps the report classification:

- Executive Summary primary constraint must name source reconciliation first.
- Missing current debt must not outrank source reconciliation when source reconciliation is the classification cap.
- Composite Score must be visibly qualified/subordinated.
- DCF/framework value outputs must carry a local source-reconciliation limitation note or be visually qualified.
- Data Coverage must distinguish field extraction completeness from cross-source reconciliation.
- Visible classification language should stay consistent.
- Generic refinance/debt pressure copy must not render unless debt/refi math actually supports it.

### Sub-Patches

#### 1A. Primary Constraint Priority Ordering

**Scope:** Full Underwriting first.  
**Patch:** If source reconciliation caps classification, Executive Summary `Primary Constraint` should state that rent roll/T12 income evidence is materially unreconciled.

Candidate copy:

`Primary Constraint: Rent roll and T12 income evidence remain materially unreconciled; classification is capped pending source reconciliation.`

#### 1B. Composite Score Qualification Under Reconciliation Cap

**Scope:** Full Underwriting Deal Scorecard.  
**Patch:** If source reconciliation caps classification, avoid presenting `Composite Score: XX / 100` as an unconstrained headline.

Possible approaches:

- Rename to `Operating Metrics Score`.
- Add a stronger immediate note directly beside/under score:
  `Classification is capped by source reconciliation. This score reflects available operating metrics only and should not be read as an unconstrained investment score.`
- Do not change deterministic scoring math unless deliberately chosen later.

#### 1C. DCF / Framework Value Limitation Note

**Scope:** Full Underwriting DCF/scenario/value surfaces.  
**Patch:** If source reconciliation caps classification, add a local note near DCF/value outputs.

Candidate copy:

`Framework value sensitivity is based on reported T12 NOI and remains subject to the rent roll/T12 reconciliation disclosure in Data Coverage.`

#### 1D. Data Coverage Reconciliation Clarity

**Scope:** Data Coverage; Full Underwriting first, possible Screening later if comparable table renders.  
**Patch:** Keep field completeness table but add distinction:

`Field extraction completeness does not imply cross-source reconciliation. The T12 and rent roll fields were extracted, but the income scale variance remains unresolved.`

#### 1E. Classification Phrase Consistency

**Scope:** Visible classification strings in report surfaces.  
**Patch:** Use the same external-facing phrase consistently:

`Review - Source Reconciliation Disclosure`

Avoid drifting to `Document-Constrained Review` for the same condition unless intentionally mapped.

#### 1F. Generic Refinance Pressure Leakage Guard

**Scope:** Full Underwriting narrative/capital risk surfaces.  
**Patch:** Do not render debt/refi pressure language unless current-debt/refi stress math supports it. In source-reconciliation cases, use reconciliation-specific limitation copy.

---

## Priority 2 — NO_CURRENT_DEBT_SECTION_SURFACE_COLLAPSE

**Scope:** Full Underwriting only.  
**Severity:** High-medium.  
**Why second:** Repeated in Tests 2, 3, and 4.

### Required Behavioral Outcome

If no true current debt document/balance is verified:

- Do not render a full standalone `Refinance Stress Test & Constraint Analysis` section.
- Keep the limitation in Executive Summary, Risk Register, and/or Data Coverage.
- Keep `Current Debt DSCR Not assessed` in risk surfaces if useful.
- Do not imply refinance analysis was performed.
- Do not add debt/refi content to Screening.

### Candidate Copy

`Current debt and refinance sizing were not assessed because no verified current-debt balance or debt-service document was provided.`

---

## Priority 3 — FAILED_STATE_COPY_AND_DIAGNOSTIC_CLARITY

**Scope:** Dashboard/customer failed-state UX; system-wide.  
**Severity:** Medium-low.  
**Why third:** Tests 5 and 6 behaved correctly, but copy can be more user-friendly.

### Required Behavioral Outcome

- Preserve internal error codes.
- Make customer-facing copy plain-English.
- Explicitly mention credit restore where applicable.
- Keep exact diagnostic reason codes available internally/admin-side.

### Test 5 Better Copy

`The uploaded rent roll could not be verified as a usable rent roll. No report was published and your report credit was restored. Please start a new report with a clearer rent roll for the same property and reporting period.`

### Test 6 Better Copy

`The uploaded T12 and rent roll could not be reconciled as a consistent source package. No report was published and your report credit was restored. Please start a new report with documents for the same property and reporting period.`

---

## Priority 4 — MISSING_STRUCTURED_FINANCIAL_ARTIFACTS_DIAGNOSTIC_PRECISION

**Scope:** Worker/internal diagnostics.  
**Severity:** Low-medium.  
**Why fourth:** Test 5 may have reported both rent roll and T12 missing even though T12 parsed.

### Required Behavioral Outcome

- If T12 parsed and rent roll failed, internal missing list should identify only missing/invalid `rent_roll`.
- Preserve fail-closed behavior.
- Do not change customer delivery or entitlement logic unless needed for clarity.

---

## Priority 5 — WORKER_CONTINUATION_RELIABILITY

**Scope:** Pipeline infrastructure/worker lifecycle.  
**Severity:** Operational high, report-surface separate.  
**Why separate:** Some reports required GitHub worker intervention to leave extracting.

### Required Behavioral Outcome

- Supabase Cron / worker continuation should reliably progress queued/extracting jobs without manual GitHub worker intervention.
- Do not disable GitHub worker fallback until Supabase Cron reliability is proven.
- Do not change cron cadence or secrets during report-surface patching.
- Keep this out of report-quality patches.

---

# Later Polish Queue

These are real but should not jump ahead of the root-class patches.

## A. METHODOLOGY_INSTITUTIONAL_WORDING_CLEANUP

Replace:

`InvestorIQ does not invent missing data or fabricate market inputs.`

With:

`Unverified inputs are excluded; no synthetic values are introduced into deterministic outputs.`

## B. ANCILLARY_INCOME_CONCENTRATION_LABEL_POLISH

Problem:

`TOP INCOME LINE CONCENTRATION 1.2%`

looks awkward when only ancillary income lines such as Laundry Income or Other Income are listed.

Possible fix:

- Rename to `Largest Ancillary Income Line`, or
- Suppress when base rent is excluded and only ancillary lines are available.

## C. RENOVATION_NOTE_DUPLICATION_POLISH

Problem:

Some renovation sections repeat the same “does not model ROI/payback/rent lift” style limitation twice.

Fix:

- Keep one clear InvestorIQ note.
- Keep one interpretation paragraph only if it adds distinct meaning.

## D. RENOVATION_RENT_LIFT_NOT_NOMODEL_COPY_POLISH

Problem:

Forward renovation source with document-stated rent lift is handled correctly, but copy should distinguish more elegantly between:

- document-stated gross rent-lift potential, and
- non-modeled ROI/payback/NOI/valuation impact.

## E. RENOVATION_TITLE_POLISH

Problem:

`Renovation Budget Breakdown` may be less institutional than the newer heading direction.

Possible replacements:

- `Document-Stated Renovation Plan`
- `Renovation Strategy & Capital Plan`
- `Renovation Budget and Scope Summary`

## F. PUBLIC_SAMPLE_NAME_HYGIENE

Distribution-only.

- Internal test names like `FINAL TEST 1` are fine for QA.
- Public samples and outreach samples need clean names.
- Do not globally sanitize customer property names.
- Do not block reports because property names include words like test, final, screening, underwriting, QA, clean, or messy.

---

# Confirmed Pass Classes From Six-Test Series

Do not patch these unless later evidence proves a concrete failure.

## SCREENING_BAD_RENT_ROLL_FAIL_CLOSED

- Test 5.
- Bad/vague rent roll did not publish.
- AI recovery attempted and deterministic validation rejected.
- Entitlement restored.

## SCREENING_FINANCIAL_SCALE_MISMATCH_FAIL_CLOSED

- Test 6.
- T12 and rent roll parsed but were financially irreconcilable at 10x scale mismatch.
- Report did not publish.
- Entitlement restored.

## UNSUPPORTED_DOCUMENT_GATING_SURFACE_ALIGNMENT

- Test 2.
- Unsupported appraisal, market survey, ESA, and broker note did not contaminate quantitative outputs.

## HISTORICAL_CAPEX_CONTEXT_ONLY_RENDERING

- Test 2.
- Historical CapEx displayed for context only.
- No forward-looking ROI/payback/rent lift modeled.

## RENOVATION_BUDGET_NO_ROI_RENDERING

- Test 3.
- Renovation budget displayed scope/cost only.
- No unsupported ROI/payback/rent lift modeled.

## UNSUPPORTED_OFFERING_SUMMARY_GATING

- Test 3.
- Offering summary asking price did not become current debt, acquisition debt, or modeled purchase assumptions.

## FORWARD_RENOVATION_RENT_LIFT_TRANSPARENCY_RENDERING

- Test 4.
- Document-stated rent-lift assumptions displayed by row.
- No unsupported ROI/payback/cost recovery/valuation model was created.

## COVER_PILL_REMOVAL

- Held across retests.
- Cover hierarchy is cleaner and more institutional.

---

# Recommended Codex Patch Order

Use micro-prompts only.

1. `SOURCE_RECONCILIATION_PRIMARY_CONSTRAINT_AND_SCORE_QUALIFICATION`
2. `SOURCE_RECONCILIATION_DCF_AND_DATA_COVERAGE_LIMITATION_NOTE`
3. `NO_CURRENT_DEBT_REFI_SECTION_COLLAPSE`
4. `FAILED_STATE_COPY_CLARITY`
5. `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS_DIAGNOSTIC_PRECISION`
6. Later polish queue, one item at a time.

---

# Retest Plan After Patch Family

Do not rerun all tests after every tiny patch.

## After Priority 1 patch

Run one source-reconciliation Underwriting retest from Tests 1–4.

Win condition:

- Primary Constraint names source reconciliation.
- Composite Score is qualified/subordinated.
- DCF has local reconciliation limitation.
- Data Coverage clarifies field extraction vs reconciliation.
- Classification phrase remains consistent.
- No new debt/refi hallucination.

## After Priority 2 patch

Run one no-current-debt Underwriting retest from Tests 2–4.

Win condition:

- Full refi stress-test section collapses when no current debt exists.
- Limitation remains visible in appropriate sections.
- Screening unaffected.

## After Priority 3/4 patch

Run Test 5-style fail case and Test 6-style fail case only if needed.

Win condition:

- Fail closed still happens.
- Credit restore still happens.
- Customer copy is clearer.
- Internal diagnostics are more precise.

---

# Current Strategic Conclusion

The six-test series was a positive validation event.

InvestorIQ showed institutional discipline by:
- publishing source-supported reports with disclosures,
- failing closed on unusable or irreconcilable packages,
- restoring entitlements,
- avoiding unsupported document contamination,
- and preserving deterministic boundaries.

The remaining work is not broad panic. It is a focused report-surface alignment and failed-state clarity pass.
