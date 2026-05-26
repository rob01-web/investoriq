# May 27, 2026 (Night) Addendum - Current Controlling Status (Supersedes Earlier Sequence Notes)

## A. Completed sequence now recorded as committed

- BLK-1: complete/committed. Scorecard current debt coverage no longer uses legacy/raw mortgage fallback when canonical current debt is not computed (`resolveCanonicalCurrentDebtScoreInputs(...)` returns null coverage and `usedCanonicalState: false`; scorecard entry treats null as not assessed).
- BLK-3 Part 1: complete/committed. Added `tests/qa/refi-gate-not-assessed-finalhtml-smoke.js` (finalHtml-like/helper-assembly coverage; not a true full `generateClientReport()` customer HTML invocation).
- BLK-3 Part 2: complete/committed. Added `tests/qa/acquisition-triangle-collapse-finalhtml-smoke.js` (finalHtml-like/helper-assembly coverage; not a true full `generateClientReport()` customer HTML invocation).
- BLK-3 Part 3: complete/committed. Added `tests/qa/property-tax-binding-finalhtml-smoke.js` (finalHtml-like/helper-assembly coverage; not a true full `generateClientReport()` customer HTML invocation).
- BLK-2: complete/committed. Acquisition financing artifact provenance pollution patched; parsed/source fields are no longer back-mutated by text-recovered/renderer-derived values, with recovered values separated under `_renderer_derived_fields`.

## B. Remaining caveats and tracked hardening work

- The three BLK-3 smokes are useful regression coverage but are helper-assembly/finalHtml-like, not true full-generator/full-render customer HTML coverage.
- Pre-launch hardening still required: a dedicated true full-generator/full-render regression harness proving no bypass of:
  1. refi/debt not-assessed gate
  2. acquisition triangle collapse gate
  3. property-tax source-binding/document-treatment gate
- Follow-up provenance cleanup: review whether `ltv`, `interest_rate`, and `amortization_years` should also be separated into explicit source fields vs `_renderer_derived_fields` when recovered only from free text. Do not patch ad hoc; handle under a future canonical acquisition/provenance cleanup pass.

## C. Controlling launch-hardening status

- Live testing remains paused.
- Do not mark Full Underwriting as launch-ready yet.
- Do not auto-start PR 5 / UnderwritingState; keep deferred unless final checkpoint says needed now.
- Immediate likely order:
  1. Documentation update (this addendum)
  2. Consider true full-generator/full-render regression harness PR
  3. Final Emergent repo-wide Full Underwriting audit
  4. Decide if PR 5 is needed before controlled live testing
  5. Resume controlled live testing only after that sequence

Older statements below indicating PR 1/2/3 are next, immediate live retesting, or implicit launch readiness are historical context and superseded by this May 27, 2026 controlling addendum.

---
# May 26, 2026 (Late Evening) Addendum - PR 1 + PR 4 Micro Completion Update

## Status update (controlling for this game-plan checkpoint)

- PR 1 - Property-tax per-file binding: complete.
- PR 4 micro - Renderer consumes support-doc taxonomy: complete.
- PR 2 - Acquisition triangle pre-render gate: next.
- PR 5 - UnderwritingState skeleton: explicitly deferred.

## What was proven tonight

- Canonical helpers must be consumed by the renderer, not merely exported.
- Property-tax treatment labels now remain bound to validated per-file identity, with fail-safe neutral treatment when binding is missing, unreliable, or mismatched.
- Support-doc taxonomy now drives primary role classification in renderer document treatment, with regex/filename logic retained as fallback.

## Launch-strategy clarification

- Launch strategy is currently undecided.
- Screening-only launch is not a final decision.
- Full Underwriting public self-serve is not permanently rejected.
- Cleanup work is preserving the option to launch Screening + Full Underwriting together if Full Underwriting reaches the universal quality bar.
- Pricing invite-only handling for Underwriting remains a fallback safety option, not an approved patch in this prompt.

## Sequence remains

1. PR 2 next.
2. PR 3 after PR 2.
3. PR 5 later, and only after PR 1 + PR 4 canonical-consumption pattern is proven in production code paths.

---
# InvestorIQ Full Underwriting Cleanup Game Plan
## Canonical Consumption / UnderwritingState Migration Roadmap

**Status date:** May 25/26, 2026  
**Purpose:** Convert Full Underwriting from a fragile renderer-monolith into a reliable, canonical-state-driven underwriting engine.  
**Controlling audit:** Emergent Canonical Consumption Audit (`CANONICAL_CONSUMPTION_AUDIT.md`)  
**Operating doctrine:** No more whack-a-mole renderer patches. Audit before patch. Canonical truth before render. No report-specific hacks.

---

## 1. Executive Decision

Full Underwriting is not currently ready for public self-serve launch.

The problem is not one more parser bug, label bug, regex gap, or QA detector gap. The core issue is architectural:

```text
api/generate-client-report.js is still acting as:
- parser
- classifier
- calculator
- fallback resolver
- state machine
- template engine
- renderer
```

The required destination is:

```text
api/generate-client-report.js becomes a thin renderer.

Full Underwriting truth is owned by canonical state builders before HTML generation.

Unsafe, unsupported, contradictory, or incomplete sections are collapsed / qualified / omitted before render.

Rendered QA becomes the safety net, not the main authority.
```

Until that migration is complete, Full Underwriting should remain:

```text
Curated beta / strategic partner access only.
Operator-reviewed where needed.
Not public self-serve.
Not used for public sample PDFs unless it passes external-distribution-grade QA.
```

Public launch path remains:

```text
Screening-first public launch.
Full Underwriting strategic beta.
```

---

## 2. Controlling Diagnosis

Emergent’s audit found that `api/generate-client-report.js` still consumes raw payloads far more often than canonical state.

### Raw bypass counts in `api/generate-client-report.js`

| Symbol | References |
|---|---:|
| `t12Payload` | 177 |
| `computedRentRoll` | 101 |
| `rentRollPayload` | 95 |
| `loanTermSheetTermsPayload` | 78 |
| `mortgagePayload` | 64 |
| `renovationPayload` | 45 |
| `propertyTaxPayload` | 15 |
| `appraisalPayload` | 8 |
| **Total raw-payload reads** | **583** |
| Inline regex extractor calls inside renderer | 15 |
| `DATA_NOT_AVAILABLE` fallback expressions | 74 |
| Visible classification hardcodes | 5+ sites |

### Meaning

The renderer reads raw parser payloads roughly four times more often than it reads canonical state.

Only these are currently close to canonical end-to-end consumption:

```text
- currentDebtAssessmentState
- sourceReconciliationState
```

Everything else remains partly or heavily bypassed.

---

## 3. The Core Rule Going Forward

```text
The existence of a canonical builder does not matter unless the renderer is forced to consume it.
```

A canonical object that exists but is ignored is worse than no canonical object, because it creates false confidence while the renderer continues to bypass it.

This is exactly what happened with support-document taxonomy:

```text
buildSupportDocTaxonomyState exists,
but generate-client-report.js did not import/consume it consistently.
```

---

## 4. Do-Not-Patch List

The following tactical patch types are now rejected unless they are part of a scoped canonical-state migration PR.

Do not ask Codex or Emergent to:

```text
1. Add one more keyword to a regex list.
2. Add one more token to environmental/zoning/appraisal classifiers.
3. Patch closing-costs regex to catch one more phrase.
4. Update one isolated verdict-label hardcode.
5. Add another post-render QA violation as the primary fix.
6. Patch one exact Refi Stability header permutation.
7. Add another field resolver to normalizeAcquisitionFinancingArtifactPayload.
8. Fix null -> 0.0% one field at a time.
9. Add one filename pattern to classifier keywords.
10. Patch resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback.
11. Tighten one material-difference heuristic.
12. Hardcode property names, filenames, report IDs, or fixture values.
```

Correct model:

```text
Specific report exposed the hole.
Patch the fence, not the dog.
```

---

## 5. Target Architecture

### Desired end state

Full Underwriting should be driven by a complete immutable `UnderwritingState`.

Proposed top-level shape:

```text
UnderwritingState
├── property
├── operating
├── rentRoll
├── currentDebt
├── acquisition
├── refinance
├── valuation
├── propertyTax
├── renovation
├── supportDocs[]
├── dataCoverage
├── classification
├── sectionEligibility
└── diagnostics
```

### Required state rules

Every modeled metric must include:

```text
- status
- value, if verified
- sourceArtifactId, where applicable
- sourceFileId, where applicable
- confidence / reliability class, where applicable
- diagnostic reason code when omitted / qualified / collapsed
```

Hard rules:

```text
- null must never silently become 0 or 0.0%.
- every modeled input must know where it came from.
- acquisition tables render only if the acquisition triangle is consistent.
- refinance header and body must read from the same refi state machine.
- supportDocs[i].treatment is the only source for Data Coverage row labels.
- classification.verdict.label is the only source for visible verdict labels.
- section eligibility must decide render/collapse/omit before HTML exists.
```

---

## 6. Game Plan Overview

The cleanup should be staged.

### Phase 1 — Stop the highest-risk visible contradictions

Goal:

```text
Close the worst customer-visible / strategic-outreach contradictions using small canonical-consumption PRs.
```

PRs:

```text
PR 1. Property-tax per-file binding
PR 2. Acquisition triangle pre-render gate
PR 3. Refi / Debt state machine
PR 4. Renderer consumes support-doc taxonomy
```

These are not the full rebuild. They are the proof that the renderer can be forced to consume canonical truth.

---

### Phase 2 — Build the actual canonical UnderwritingState

Goal:

```text
Create api/_lib/underwriting-state.js and begin migrating truth families out of generate-client-report.js.
```

Start only after at least PR 1 and PR 4 prove canonical consumption can be enforced.

Initial migration candidates:

```text
- T12 NOI / EGI / OpEx / GPR
- Rent roll totals / occupancy / unit count
- Property tax
- Visible classification
- Section eligibility
```

---

### Phase 3 — Remove duplicated calculations and fallback authorities

Goal:

```text
Delete or retire duplicated calculations, local fallback chains, local thresholds, and renderer-derived truth.
```

Priority removals:

```text
- inline refiFinancials literal
- risk register inline thresholds
- acquisition purchase/loan/LTV fallback chain
- normalizeAcquisitionFinancingArtifactPayload back-mutation behavior
- visible classification hardcodes
- global property-tax labeling
- DATA_NOT_AVAILABLE fallback surfaces
- legacy mortgage fallback path
```

---

### Phase 4 — Lock with regression matrix and rendered-contract QA

Goal:

```text
Make every root family testable before public Full Underwriting release.
```

Needed coverage:

```text
- fixture matrix / snapshot harness
- canonical-state tests
- rendered contract QA tests
- anti-hardcode proof
- public-sample / high-value-outreach gate tests
- customer-delivery gate tests
```

Target fixture breadth:

```text
Approximately 120 scenario fixtures over time, or an equivalent broad regression matrix.
```

---

## 7. Detailed PR Roadmap

---

# PR 1 — Property-Tax Per-File Binding

## Objective

Prevent the renderer from labeling any uploaded/support file as property-tax support unless that exact file is the validated property-tax source file.

## Problem

The current renderer can globally label documents as:

```text
- Structured property tax input
- property tax support
- modeled property tax input
- limited property tax support
```

even when the visible document is actually:

```text
- Phase I ESA
- environmental
- zoning
- compliance
- appraisal
- market survey
- unsupported support context
```

This happens because the renderer can treat the existence of `propertyTaxPayload` or property-tax-ish metadata as globally available, instead of requiring per-file identity binding.

## Required invariant

```text
A document row may show a modeled/structured property-tax label only when its file identity matches the validated property-tax source file identity.
```

## Required behavior

```text
1. Identify validated property-tax source file identity, if available.
2. Only that matching file may render as structured/modeled property-tax support.
3. If no reliable sourceFileId/file_id exists, fail safe.
4. Fail safe means:
   - do not show Structured property tax input
   - do not show modeled property tax input
   - do not show limited property tax support
   - show neutral/non-modeled support wording instead
5. Preserve customer delivery behavior.
6. Do not fail the whole report for this.
```

## Test requirements

At least 3 varied fixtures:

```text
A. True property-tax document with matching file identity may render structured/modeled property-tax support.
B. Phase I ESA / environmental support document present alongside propertyTaxPayload must not render as property-tax support unless file identity matches.
C. propertyTaxPayload exists but no reliable sourceFileId/file_id binding exists -> fail safe and avoid structured property-tax label.
```

## Scope boundaries

```text
- Prefer generate-client-report.js only if possible.
- Do not modify AdminDashboard.jsx.
- Do not modify Dashboard.jsx.
- Do not start UnderwritingState.
- Do not rewrite buildDocumentTreatmentSummaryHtml.
- Do not patch acquisition/refi.
- Do not add classifier keywords as the main fix.
```

## Why first

This is the smallest credible architecture fix.

It proves the per-file binding model before attempting broader canonical-state migration.

---

# PR 2 — Acquisition Triangle Pre-Render Gate

## Objective

Prevent contradictory acquisition financing tables from rendering when purchase price, stated loan amount, derived loan amount, LTV, and fees do not form a coherent verified triangle.

## Problem

The renderer currently resolves acquisition values using raw payload reads, fallback chains, inline extractors, and heuristic corrections.

Observed failure:

```text
Purchase price / loan amount / LTV / closing costs can render incorrectly or contradict source terms.
```

## Required invariant

```text
Acquisition/proposed financing tables render only when the acquisition triangle is verified and internally consistent.
```

## Proposed validator

```text
validateAcquisitionTriangle(acquisitionState)
```

Returns:

```text
{
  status: "valid" | "incomplete" | "inconsistent" | "unsupported",
  triangleConsistent: boolean,
  verifiedFields: [...],
  missingFields: [...],
  inconsistentFields: [...],
  disclosureReasonCode: "...",
  renderedBehavior: "render_table" | "collapse_to_disclosure"
}
```

## Required behavior

If triangle is valid:

```text
Render acquisition/proposed financing table.
```

If triangle is incomplete/inconsistent/unsupported:

```text
Do not render contradictory table.
Collapse to a disclosure paragraph.
Show only verified fields if safe.
Emit diagnostic.
```

## Required source distinction

```text
Acquisition/proposed financing must never become current outstanding debt unless the source explicitly states:
- current outstanding balance
- existing mortgage
- current principal balance
- current debt balance
```

## Scope boundaries

```text
- Do not patch one 124 Richmond pattern.
- Do not add a new regex branch as the main fix.
- Do not mutate raw payload into apparent parsed truth.
- Do not make null fees render as 0.0%.
```

## Test fixture examples

```text
- Loan Amount (at $X purchase price) $Y
- Price ref: X -> Loan Y
- Purchase Price: X / Loan Amount: Y
- Asking Price: X / Proposed Loan: Y
- X purchase price, Y loan, Z% LTV
- Fees 1% lender fee + legal
```

---

# PR 3 — Refi / Debt State Machine

## Objective

Make refinance headers, debt body, DSCR, sensitivity, and refi capacity all consume one canonical refinance/debt state.

## Problem

The renderer currently has multiple authorities:

```text
- currentDebtAssessmentState
- inline refiFinancials literal
- buildRefiStabilityModel
- local header booleans
- raw mortgage payload reads
```

Observed failure:

```text
Refi header said refinance was not assessed,
while the debt body rendered current debt balance, rate, amortization, DSCR, and sensitivity.
```

## Required invariant

```text
Refinance header and refinance body must never disagree.
They must consume the same canonical refinance state.
```

## Proposed state builder

```text
buildRefinanceCanonicalState(...)
```

Returns:

```text
{
  status: "assessed" | "not_assessed" | "source_constrained" | "not_applicable",
  tier: "...",
  headerCopy: "ASSESSED" | "NOT_ASSESSED_MISSING_CURRENT_DEBT" | "SOURCE_CONSTRAINED" | "NOT_APPLICABLE",
  currentDebtStatus: "...",
  dscrStatus: "...",
  refiCapacityStatus: "...",
  canRenderDebtBody: boolean,
  canRenderRefiHeader: boolean,
  canRenderSensitivity: boolean,
  diagnostics: [...]
}
```

## Required behavior

```text
- Header reads headerCopy enum.
- Body reads same state.
- Sensitivity reads same state.
- If state says not assessed, numeric modeled surfaces do not render.
- If state says assessed, header cannot say missing inputs.
```

## Scope boundaries

```text
- Do not patch one exact header permutation.
- Do not add another post-render QA code as the main fix.
- Do not leave inline refiFinancials as a competing authority.
```

---

# PR 4 — Renderer Consumes Support-Doc Taxonomy

## Objective

Retire the 280-line inline regex classifier in `buildDocumentTreatmentSummaryHtml` as a source of truth and make the renderer consume canonical support-document taxonomy.

## Problem

`buildSupportDocTaxonomyState` exists, but the renderer does not consistently consume it.

This means:

```text
QA/canonical support-doc logic can know the right role,
while the PDF renderer still prints the wrong role.
```

## Required invariant

```text
supportDocs[i].treatment is the only source for Data Coverage / document-treatment row labels.
```

## Required behavior

```text
- Import/consume buildSupportDocTaxonomyState in generate-client-report.js.
- Use canonical role/treatment for rendered document-treatment rows.
- Environmental / Phase I / ESA = environmental due-diligence context only.
- Zoning/compliance = zoning/compliance context only.
- Market survey/rent comps = market/rent context only; not rent roll override.
- Unsupported appraisal/background docs = auditability/context only unless modeled support is verified.
- True property-tax support only when per-file binding proves it.
```

## Scope boundaries

```text
- Do not rewrite the whole renderer.
- Do not add more regex branches to the old chain.
- Do not change customer-dashboard/admin-dashboard code.
- Do not make support docs customer blockers by default.
```

---

# PR 5 — UnderwritingState Skeleton

## Objective

Create the real canonical ownership layer for Full Underwriting.

## File

```text
api/_lib/underwriting-state.js
```

## Important sequencing rule

Do not start PR 5 until at least PR 1 and PR 4 prove the renderer can be forced to consume canonical state.

Otherwise, PR 5 risks creating another canonical owner that the renderer ignores.

## Initial scope

Keep PR 5 narrow.

Start with:

```text
- operating
- rentRoll
- propertyTax
- supportDocs
- sectionEligibility
- classification shell
- diagnostics shell
```

Do not migrate all 583 raw reads at once.

## Required invariant

```text
UnderwritingState is the source of truth for migrated families.
generate-client-report.js may render those families but may not recalculate or reclassify them.
```

## Migration strategy

```text
1. Build state object.
2. Migrate one truth family.
3. Add tests proving rendered output remains stable or improves safely.
4. Delete / bypass raw renderer reads for that family.
5. Repeat.
```

## Snapshot requirement

Where possible:

```text
snapshot-diff must be byte-identical for unaffected reports
```

This proves canonicalization is not changing outputs accidentally.

---

## 8. Truth Families to Consolidate

The following truth families need canonical ownership and forced renderer consumption.

| Truth family | Current state | Target |
|---|---|---|
| T12 NOI / EGI / OpEx / GPR | partial | canonical operating state |
| Rent roll totals | partial | canonical rentRoll state |
| Occupancy | partial/local | canonical rentRoll.occupancy |
| Unit count | no owner | canonical rentRoll.unitCount |
| Current debt | mostly canonical | remove legacy bypasses |
| Refinance capacity | no owner | canonical refinance state |
| Acquisition financing | no owner | canonical acquisition state |
| Property tax | no per-file owner | source-bound propertyTax state |
| Support-doc treatment | owner exists but not consumed | renderer consumes taxonomy |
| Visible classification | partial | classification.verdict sole authority |
| Risk register thresholds | local duplicated | classification.riskFlags sole authority |
| Section eligibility | partial | sectionEligibility sole authority |
| Data Coverage grouping | local renderer logic | canonical dataCoverage |
| Valuation / DCF | fragmented | canonical valuation state |
| Renovation / CapEx | partial | canonical renovation state |
| Diagnostics | partial | structured diagnostics owned pre-render |

---

## 9. Launch Strategy While Cleanup Proceeds

## Public

```text
Launch Screening first.
```

Requirements before public launch:

```text
- public sample asset paths fixed
- no flawed underwriting public sample PDFs
- dist/build grep confirms no reachable STRONG BUY / BUY/SELL / public AI language
- Dashboard customer copy remains cleaned up
- DocRaptor production mode only when intentionally flipped
```

## Full Underwriting

```text
Curated beta / invite-only / strategic access.
```

Allowed:

```text
- strategic conversations
- operator-reviewed beta reports
- selected screenshots/excerpts only if individually accurate
- clearly framed partner-access workflow
```

Not allowed yet:

```text
- public self-serve Full Underwriting checkout
- public underwriting sample PDFs from current flawed reports
- Ken/public outreach using visibly contradictory PDFs
```

## Ken Dunn framing

Use this:

```text
InvestorIQ is launching Screening publicly first because it is ready for open self-serve use.

Full Underwriting is the larger strategic product and is being released more carefully through selected partner workflows because it covers more complex debt, refinance, acquisition-financing, valuation, and source-reconciliation logic.
```

---

## 10. Codex Prompt Standards for This Cleanup

Every prompt must be:

```text
- micro-scoped
- one PR only
- audit-backed
- no report-specific hacks
- no hardcoded property names / filenames / report IDs
- no broad refactor unless explicitly scoped
- tests required
- anti-hardcode proof required
- short receipt required
```

Every receipt must include:

```text
A. Files changed
B. Generalized invariant fixed
C. Exact behavior before vs after
D. Tests added/updated
E. Validation commands run
F. Anti-hardcode proof
G. Anything intentionally not touched
```

---

## 11. Definition of Done for Full Underwriting Public Self-Serve

Full Underwriting can be reconsidered for public self-serve only when:

```text
1. UnderwritingState exists and owns critical truth families.
2. Renderer consumes canonical state for migrated families.
3. Acquisition triangle cannot render contradictory tables.
4. Refi header/body cannot disagree.
5. Support-doc/Data Coverage labels come from canonical taxonomy.
6. Property-tax modeled labels are source-file bound.
7. Visible classification label has one authority.
8. Risk register uses canonical risk flags, not duplicated thresholds.
9. Null values cannot render as 0.0%.
10. Section eligibility gates before render.
11. Rendered QA is safety net, not primary authority.
12. Public-sample/high-value-outreach gate passes.
13. Broad regression/snapshot harness passes.
14. No public BUY/SELL / AI / internal QA / parser language leaks.
```

---

## 12. Immediate Next Action

Do not start a broad rewrite.

Next patch should be:

```text
PR 1 — Property-tax per-file binding.
```

Only after PR 1 is reviewed:

```text
PR 4 — Renderer consumes support-doc taxonomy.
```

Then:

```text
PR 2 — Acquisition triangle pre-render gate.
PR 3 — Refi / Debt state machine.
```

Then:

```text
PR 5 — UnderwritingState skeleton.
```

---

## 13. North Star

The goal is not to make one report pass.

The goal is:

```text
Full Underwriting becomes boringly reliable.
```

Meaning:

```text
- no contradictory surfaces
- no raw payload truth leaks
- no renderer-side financial invention
- no support-doc contamination
- no hidden fallback authorities
- no post-render QA as primary defense
- no customer-visible confusion
```

Final destination:

```text
Documents -> parsers/extractors -> deterministic validators -> UnderwritingState -> pre-render gates -> thin renderer -> rendered QA safety net -> PDF.
```

That is the architecture that gets InvestorIQ Full Underwriting to institutional quality.

## 14. May 27, 2026 Addendum - Cleanup Sequence Checkpoint

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

Planning sequence update:
- Do not return to live testing yet.
- Finish the PR cleanup sequence checkpoint first.
- Then run one final Emergent repo-wide Full Underwriting audit before live testing resumes.
- Emergent has roughly 40 credits left and should be used strategically for that final underwriting/report-surface audit.
- Final Emergent audit objective: determine whether Full Underwriting is truly elite/launch-ready and catch remaining repo-wide/report-surface issues before additional testing.

Current next-step status:
- PR 1, PR 4, PR 2, PR 3 are complete.
- PR 5 / UnderwritingState remains deferred unless the final checkpoint indicates it is necessary now.
- Next likely step after this markdown update: small audit-only checkpoint to decide whether remaining micro patches are needed before the final Emergent audit.

