# Slice 1 active-path audit, September 13

Status: pre-edit active-path inspection complete; repair and certification remain open.

Baseline: runtime parent `811af341f481b55e24803c2a8c296686669630af`, documentation HEAD `cd2a293ddadd48d2a4d1f61713a138b28c153f54`, plus the owner's uploaded v5 pre-run backup. All seven tracked modified files match the Git blob hashes in `InvestorIQ_Slice1A_REVIEW_v5.txt` after CRLF normalization. The two new files come from the saved backup. The original backup remains unchanged. This is an isolated Linux copy, not the owner's Windows worktree.

## Required repair inventory

1. Operating Intelligence base independently divides OPEX/GPR, creates occupancy spread and interpretation, then its wrapper deletes the interpretation and clears the receipt. Replace construction with shared accepted receipts and remove wrapper repair.
2. Chapter 1 base independently selects/derives shared facts and creates occupancy spread, opportunities and constraints. Its wrapper clears them after construction. Make the base correct and retain unrelated expense reconciliation and tied-unit handling.
3. CustomerSurfaceModel chooses coreMetrics before accepted T12 and normalizes upstream OCCR with a cap-rate magnitude heuristic. Pass Source Truth explicitly through the orchestrator, consume its shared metrics, preserve unavailable values and operand provenance.
4. `acquisition-memo-v2-document.js` delegates to the active base renderer, including exported snapshot helpers and complete-document fallback sections. The base emits three retired rows and projects financialTruth into coreMetrics without respecting displayReady. One row uses Number(null), allowing a missing ratio to render as zero. Cut over all direct and fallback routes, not just the elite opening.
5. Quality Manifest coerces null numerator, denominator and result through Number(), attaches both core document identities to every receipt, and validates only the retired calculation key. Preserve absence, bind OCCR to the actual T12 operand source only, and validate the canonical formula and key.
6. Deterministic seal currently treats a displayReady:false unavailable OCCR receipt as invalid. Reproduction: missing GPR and result produce OPERATING_COST_COVERAGE_INPUTS_INVALID. Permit legitimate unavailable receipts while rejecting fabricated numeric output, valid-input suppression, incorrect units, labels, math, and displayed values.
7. Generator, template token, orchestrator and QA consumer retain compatibility names. Finish the canonical key cutover and use Source Truth instead of creating another operating basis.
8. H14/H15 requires 7.0% although the current cap-rate renderer emits 7.00%. Correct the expectation, not the renderer. Institutional integration uses a market-rent GPR denominator; fixture inputs and expectations must describe the same accepted T12 basis.
9. QA advisory instructions still encourage an occupancy cushion. Update only the operating-metric instructions and related regressions; retain the separate later-slice validator work.

## Additional Findings

- **Active Phase 8 reintroduction:** Screening pipeline calls Phase 8A and 8B after its existing seal check. These modules independently compute OPEX/GPR, use >=85%/95% thresholds, generate occupancy subtraction, and format calculated OCCR through magnitude inference. Reproduced 2.0 as 2.0%, with a 110.0 pp below-break-even cushion; 0.750001 is treated as Strong and 0.850001 remains Caution. Both modules must consume shared receipts and exact >75%/>85% classification boundaries.
- **Final polish masks semantics:** final-human-publication-authority independently divides OPEX/GPR and rewrites above-break-even text, but does not repair every below-break-even path or the underlying classification. Remove this competing calculation/semantic repair after fixing producers.
- **Seal ordering:** Screening's presentation transformations happen after its seal check. Add a final OCCR validation at that boundary, with a regression proving final output matches accepted receipts.
- **Numeric input type hole:** v5's finite helper accepts blank whitespace, booleans and arrays through Number(). Shared numeric authority must reject those inputs rather than publish financial zero or one.
- **Separate later-slice editorial conflict:** final-human-publication-authority changes the approved Investment Committee Memorandum cover subtitle to Underwriting Report and re-adds the gold brand dot. Record under Slice 6/customer language, without silently mixing a broad visual redesign into Slice 1.

## Hit classifications and scope

`pre-edit-hit-register.json` records each matched path, line, text and classification before edits. Active runtime imports were traced through Screening pipeline, Phase 8 presentation, final polish, acquisition orchestrator/document/base, both underwriting base/wrapper contracts, manifest and deterministic QA consumers.

- Pure OPEX/GPR aliases are migration targets; no independent active compatibility calculation may survive.
- Debt-inclusive current/proposed calculations are distinct: they add annual debt service. Preserve their formula, role separation and machine keys. Display aliases may align to existing approved debt renderer terminology.
- `legacy-report-surface-render-helpers.js` has only test imports. Old patch scripts, static sample/report-generation material and original uploadable/replay facts are preserved historical evidence. Positive tests exercising current exported renderers must migrate; rejection tests retain retired strings deliberately.
- Base deterministic seal's retired validator is suppressed by the sole active wrapper passing null. Historical adapter vocabulary is not customer authority; callers must use the canonical external OCCR receipt.
- CSS opacity, parser confidence, LTV, capital-plan proportions, physical-occupancy and income-concentration thresholds are separate concepts and remain unchanged.
- Report QA exclusion patterns, broader public-language/admission failures, scheduler/worker issues and other audit slices remain governed by the seven-slice plan.

## Closure gates still required

One uncommitted whole-Slice-1 candidate from verified v5; focused regressions including final presentation and unavailable/high OCCR; classified residual alias scan; git diff --check; canonical npm run qa; production build; complete line-by-line review. One commit only after all pass. No production action, Slice 2, scheduler, data, payment or PDF-mode change.
