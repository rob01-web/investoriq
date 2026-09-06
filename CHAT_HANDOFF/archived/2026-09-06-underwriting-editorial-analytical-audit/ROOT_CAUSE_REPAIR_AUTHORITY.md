# InvestorIQ Underwriting Editorial + Analytical Root-Cause Repair Authority

**Date:** 2026-09-06  
**Status:** GOVERNING NEXT-PHASE AUTHORITY  
**Scope:** Underwriting editorial, analytical, calculation-governance, and shared publication-system repair

## Non-negotiable owner doctrine

The audited Stonebridge DocRaptor TEST PDF is **diagnostic evidence, not the repair target**.

Do not repair the test artifact for the sake of making that artifact pass. Every accepted change must address a root cause in the actual reusable InvestorIQ system: shared renderers, shared publication components, source-normalization logic, calculation authority, analytical copy generation, pagination rules, evidence governance, or other production-code seams that affect real future reports.

Forbidden shortcuts include:

- property-name or fixture-name conditionals for Stonebridge;
- hardcoded Stonebridge amounts, unit counts, labels, page numbers, or source filenames merely to satisfy the audit;
- test-only CSS or HTML overrides that do not improve the real report system;
- manual editing of generated PDFs;
- changing source facts or calculations solely to make displayed numbers agree;
- suppressing unique evidence or sections merely to shorten the report;
- hard page caps, forced minimums, filler, truncation, or layout crushing;
- weakening tests so an unresolved defect appears green;
- treating HTTP 200, a successful build, or a smoke-test pass as customer acceptance.

Stonebridge may continue to be used as a reproducible regression fixture because it exposed real defects. After root-cause repairs, generate fresh artifacts through the real Screening and Underwriting pipelines to prove the fixes are generic.

## Current status split

### Provider/rendering foundation

The Visual ELITE publication engine is provider-certified in DocRaptor TEST mode at restore point:

`f6066397b623a35391765c17214000a7628a1615`

That certification proved Prince compatibility, approved embedded publication fonts, content-driven pagination, key layout geometry, provider rendering, and the absence of the earlier Prince-specific spacing/grid failures.

### Customer-facing acceptance

**Underwriting editorial + analytical acceptance is HOLD.**

The deeper 2026-09-06 review found objective factual-presentation defects, calculation-basis ambiguity, duplicated/system-facing prose, small essential text, redundant rule hierarchy, source-register/manifest layout defects, weak decision framing, and inconsistent cross-section language. Provider rendering success does not close those issues.

## Governing audit evidence

Full audit file uploaded on 2026-09-06:

`InvestorIQ_Underwriting_Editorial_Visual_Audit_2026-09-06(1).md`

Audited provider PDF SHA256:

`ebf59fbb538a2114fe543d839a3df93e283c33e2694f1d13d0bcc921453f620b`

The full audit is evidence of symptoms and recommended outcomes. It is **not automatic code authority**. Source-dependent and calculation-governance findings must be verified against canonical source documents and code before changing behavior.

## Audit register to carry forward

### P1 analytical / factual-presentation findings

- **A01:** 2BR rent precision differs across report surfaces; displayed rounded detail no longer reproduces annual totals. Fix shared precision/formatting authority while preserving source truth.
- **A02:** tied unit categories are incorrectly described as a single largest category. Fix generic tie-handling logic.
- **A03:** interest-rate stress is described as deferred even though the debt section includes it. Fix section-scope/cross-reference generation.
- **A04:** long source filenames collide with adjacent columns. Fix generic long-token wrapping and source-register geometry.
- **A05:** Quality Manifest columns/gutters collide. Fix shared manifest layout and readable spacing.
- **A06:** the $180,000 cross-basis rent comparison and separate $20,000 expense subtotal discrepancy are not clearly distinguished. Fix executive issue synthesis.
- **A07:** break-even occupancy and debt-inclusive coverage use labels that conceal differing revenue bases. Verify and govern formulas explicitly; never silently swap inputs.
- **A08:** document-count/coverage language can imply completeness beyond what was checked. Fix scope semantics.
- **A09:** environmental status wording is ambiguous. Verify source meaning before changing copy.
- **A10:** source periods, dates, and currency are insufficiently visible. Recover from actual source authority or mark unavailable.

### P2 editorial / visual findings

- **V01:** redundant stacked horizontal rules and mixed boundary hierarchy. Adopt **one boundary, one separator**.
- **V02:** KPI typography changes between modules. Establish one shared metric treatment.
- **V03:** essential notes/labels can fall near 5-6pt. Reflow for readable institutional print size; never shrink to hit a page target.
- **V04:** short fragments/continuations weaken page flow. Keep short schedules with headings and label true continuations.
- **E01:** repeated metrics, warnings, scope inventories, and process prose bury investment questions. Consolidate without losing unique evidence.
- **E02:** grammar, vague labels, and system-facing terminology need a complete customer-copy pass.
- **D01:** title and front-of-report decision framing need alignment with the actual product promise.

## Current editorial decisions to validate and implement systemically

- Remove the isolated gold dot after `INVESTORIQ` unless current brand authority explicitly requires it.
- Replace reader-facing `RECONCILIATION REQUIRED` with clearer language such as **Source differences require review**, followed by the actual issues, implications, and required evidence.
- Current product recommendation: **InvestorIQ Underwriting Report**, optionally **Prepared for investment review**, until the document genuinely earns an Investment Committee Memorandum title through stronger decision framing.
- Remove redundant `INVESTMENT COMMITTEE OVERVIEW` above `Investment Decision Snapshot`.
- Current PDF contains zero em dashes and zero en dashes in extracted customer text. The visual clutter concern is primarily horizontal-rule overuse, not punctuation.
- Preserve the earnings bridge; it remains one of the strongest decision-useful visuals.

## Root-cause repair classification

Before editing any audit finding, classify it as one of:

1. **Objective code/presentation defect:** repair reusable component/logic directly.
2. **Source-dependent finding:** inspect the actual uploaded source and extraction authority first; if the source does not establish the fact, keep it unknown.
3. **Calculation-governance finding:** document the governing formula/basis, add regression coverage, then update presentation. Never change math merely to harmonize displays.
4. **Shared publication-system finding:** evaluate both Screening and Underwriting for regression risk and continuity.

## Required acceptance gates

A future customer-facing close requires all of these, separately:

1. Source and calculation truth verified for changed analytical findings.
2. Meaningful regression tests proving the systemic repair, including non-Stonebridge/generalized cases where practical.
3. Production build and report-contract regressions green.
4. Fresh Screening and Underwriting artifacts generated through the real lanes with content-driven pagination.
5. Actual provider render proof when authorized.
6. Every page visually reviewed at full-page and reading scale.
7. Full editorial/investment-review acceptance, including grammar, hierarchy, duplication, labels, rules, tables, source register, methodology, and Quality Manifest.
8. No production action until separately and explicitly authorized by the owner.

## Production holds

No merge to `main`, deployment, migration, scheduler activation, Storage mutation, Stripe/pricing change, or other production mutation is authorized by this repair phase.
