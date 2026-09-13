# InvestorIQ ELITE Report Blueprint - 2026-09-13

Historical `02_ELITE_REPORT_BLUEPRINT.md` remains preserved. This file controls current Slice 1 operating-metric semantics where older OPEX / GPR `Break-Even Occupancy` language conflicts.

## Core doctrine

Screening and Underwriting are one publication family with different depth. Underwriting must continue Screening without contradicting shared facts, formulas, source precedence, terminology, formatting, or publication behavior.

Decision first. Facts before prose. No hard page caps. Stonebridge remains diagnostic evidence, never a patch target.

## Canonical Operating Cost Coverage Ratio

The accepted operating-expense-to-rent metric is `Operating Cost Coverage Ratio` (OCCR).

Formula: accepted total operating expenses divided by accepted T12 gross potential rent.

Required behavior:

- OCCR is not physical occupancy.
- Never subtract physical occupancy minus OCCR.
- Never describe that subtraction as operating cushion, occupancy headroom, or vacancy buffer.
- Never chart physical occupancy and OCCR as if they were like-for-like occupancy thresholds.
- OCCR uses explicit ratio formatting. `2.0` means `200.0%`.
- Negative operating expenses and non-positive GPR are invalid OCCR inputs.
- Current Screening thresholds are `>75%` Sensitized and `>85%` Fragile. Exactly 75% is Stable; exactly 85% is Sensitized.

Stonebridge diagnostic: `$555,000 / $1,612,800 = 34.41%` OCCR. Physical occupancy remains `93.75%` as a separate source fact.

## Retired operating terminology

For the OPEX / GPR metric, customer-facing `Break-Even Occupancy` is retired.

Temporary internal compatibility keys such as `breakEvenOccupancy` or `breakEvenOccR` may remain only while the same Slice 1 cutover is in progress. They must not remain independent calculation authority or leak retired customer terminology.

Underwriting base contracts must become correct themselves. A base contract must not construct obsolete operating Break-Even Occupancy semantics and rely on a wrapper to relabel, null, or remove them afterward.

## Separate debt-inclusive concepts carefully

Do not globally replace every `break-even` occurrence. A debt-inclusive metric can be a legitimate separate concept when debt service is actually included in its formula and the display label clearly states that basis.

Each active occurrence must be classified by formula and meaning before editing. The retired concept is specifically the OPEX / GPR operating ratio being presented as occupancy.

## Shared financial authority

Where supported, Screening and Underwriting should consume one governed authority for GPR, EGI, operating expenses, NOI, OCCR, physical occupancy, Rent Roll occupancy, annual in-place rent, annual market rent, rent-to-market gap, Rent Roll / T12 reconciliation, unit count, and provenance.

Underwriting must not manufacture a second OCCR from alternate inputs after canonical source truth has already been established.

## Receipt and provenance rules

OCCR receipts must reflect actual calculation inputs. Unrelated source identities should not appear merely because they are present elsewhere in the report model.

Missing inputs remain unavailable. They must not become zero through generic numeric coercion. Quality Manifest and deterministic seals consume calculation authority; they do not create a second formula.

The deterministic seal should verify OCCR when it is applicable and display-ready. It must not falsely fail solely because OCCR is legitimately unavailable, while still failing genuine label, formula, value, or rendered-output mismatches when the metric is required.

## Formatting and customer continuity

- Preserve canonical calculation precision.
- Use explicit OCCR ratio-to-percent formatting rather than magnitude inference.
- Do not weaken correct current formatting such as `7.00%` solely to satisfy a stale test expecting `7.0%`.
- Preserve zero customer-facing em/en dashes.
- Preserve approved fonts: Cormorant Garamond, DM Sans, DM Mono.
- Preserve Source Register and Quality Manifest substance.
- Reflow content instead of forcing page counts.

## Slice 1 acceptance gate

Slice 1 closes only after active operating-ratio authority is traced end to end, duplicate semantic owners are removed or reduced to explicit temporary aliases, focused regressions cover normal/high/unavailable OCCR and occupancy separation, Underwriting base contracts stop constructing the retired operating concept, customer-surface and manifest receipts consume canonical truth, stale-alias scans are reviewed, `git diff --check` passes, canonical `npm run qa` passes, production build passes, and the entire final diff is reviewed line by line.

Only then create one Slice 1 commit. No production deployment or Final Attack Test belongs to this local certification gate.
