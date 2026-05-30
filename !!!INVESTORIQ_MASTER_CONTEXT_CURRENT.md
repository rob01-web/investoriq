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
- Full Underwriting may remain controlled beta / invite-only / operator-reviewed while architecture consolidation proceeds.
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
- Missing/invalid path, missing report type, `admin_review_required`, `user_needs_documents`, and `holdDelivery=true` are contract-locked as blocked-before-publication.
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
- Full Underwriting should be beta/invite-only/operator-reviewed until canonical-state consolidation is completed.

## B. Safe UI/customer/admin patches completed

- AdminDashboard.jsx Slice 2A.2 completed/pass:
  - undefined `ai` expanded-row reference removed
  - AI Recovery fallback now deterministic: `None - deterministic only`
  - compact Triage empty state: `{title} - 0 jobs - all clear`
  - roadmap leak copy replaced with `No items today.`
  - Force-Fail confirmation modal added before executing existing forceFailJob call
  - no backend/API/doctrine/gating changes

- Dashboard.jsx customer launch copy cleanup completed/pass:
  - internal status labels collapsed to customer labels: Preparing, Ready, Publication held
  - failed-job header changed from raw FAILED / ERROR_CODE style to Publication held - Screening/Underwriting
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
- Full Underwriting may remain visible only as invite-only/beta/operator-reviewed or unavailable for self-serve until consolidation.
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
- Full Underwriting should be invite-only/beta/operator-reviewed until canonical-state consolidation.
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
- Full Underwriting should be invite-only/beta/operator-reviewed until canonical-state consolidation.
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
