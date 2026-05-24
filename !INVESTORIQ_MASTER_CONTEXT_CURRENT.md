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
- "admin_review_required" display renamed to "Fail-Closed Core" only in UI
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
8. NEXT: controlled live retest batch

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
Run controlled live retests and inspect PDFs + artifacts before deciding any further patches.

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

Every future “root-class” patch must prove it is system-level, not report-specific.

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
8. NEXT: controlled live retest batch

## Fresh-Chat Continuation Prompt

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
Run controlled live retests and inspect PDFs + artifacts before deciding any further patches.

Do not start Slice 2B yet.
Do not do broad refactors.
Do not rotate secrets mid-debug.
Do not flip DocRaptor production mode yet.
Do not disable GitHub worker yet.
