# InvestorIQ Master Plan


## Customer admission constitution - GOVERNING OWNER AUTHORITY

This section is current owner authority and controls wherever older plans, tests, migrations, historical notes, or downstream source-mode language conflict.

### Screening admission

A Screening Report requires **both** a usable T12 / operating statement **and** a usable Rent Roll before generation may begin. Screening accepts only those two core document categories. Supporting or additional due-diligence documents are not part of the Screening upload package and must not be admitted for Screening.

### Underwriting admission

An Underwriting Report requires **both** a usable T12 / operating statement **and** a usable Rent Roll, **plus at least one additional readable supporting due-diligence document**, before generation may begin.

### Admission is not downstream survivability

`dual_source_core`, `t12_minimum_core`, `rent_roll_minimum_core`, and `insufficient_core` describe downstream source-truth / publication-survivability states **after a job has already been validly admitted**. They do not reduce or replace the customer upload requirements above.

If an admitted core source later becomes constrained or unusable during governed parsing/validation, downstream analysis may qualify, collapse, omit, or follow the applicable publication/failure doctrine. That downstream behavior does not make a one-core-document customer submission valid at intake.


**Updated:** 2026-09-08  
**Phase:** Underwriting Editorial + Analytical ELITE Closeout  
**Working branch:** `internal-underwriting-editorial-analytical-elite-20260906-r1`

## Closeout status

The September 6 Underwriting editorial and analytical repair sequence is closed on the isolated branch. Fresh certification run `34267290022` passed every executable gate and the reviewed release candidate was deployed to Vercel production as deployment `dpl_DYQ7rXuyb93SU17zp4X5899vuvzy`. Do not restart the audit. Any future work begins as a new bounded change against the live certified baseline.

## Mission

Take the provider-certified Visual ELITE publication foundation and finish the **actual reusable Underwriting product** to a premium institutional standard.

The September 6 Stonebridge audit is a defect-discovery instrument. It is not a request to hand-tune Stonebridge. The objective is to remove the underlying systemic causes so future properties with different facts, source packages, text lengths, document counts, and page counts render and read correctly.

## Permanent doctrine

- Decision first. Facts before prose.
- Root causes before fixture cosmetics.
- Source truth before copy.
- Calculation authority before harmonized display.
- Shared publication behavior before one-off page styling.
- Content-driven pagination only. No hard page caps.
- Preserve evidence, source identities, methodology, Quality Manifest, and historical authority.
- A test/build/provider PASS is necessary but not sufficient for customer acceptance.

## Phase A: Audit-to-code control matrix

Create one live matrix for A01-A10, V01-V04, E01-E02, and D01.

Required columns:

`Audit ID | Artifact symptom | Root-cause hypothesis | Source authority needed | Code owner/component | Shared Screening impact | Repair class | Regression proof | Fresh rendered proof | Status`

Do not change production code until each P1 item has an identified code/source owner or is explicitly marked source-verification pending.

## Phase B: P1 factual-presentation integrity

Repair reusable logic for:

- precision propagation from source/calculation layers to summaries, tables, and charts;
- generic tie-aware ranking/concentration language;
- scenario-section presence/cross-reference truth;
- robust long-filename/source-register wrapping;
- Quality Manifest gutter and readable block geometry;
- executive synthesis that separates cross-basis rent comparison from expense subtotal discrepancy;
- coverage/document-count semantics that do not overstate completeness;
- environmental wording only after source verification;
- explicit source period/as-of/currency handling.

No fixture-specific literals or conditionals.

## Phase C: Calculation-governance closeout

A07 is a calculation-governance task, not a copy-edit task.

Inspect canonical formulas and tests for:

- operating break-even occupancy;
- occupancy-stress revenue basis;
- current debt-inclusive occupancy coverage;
- proposed debt-inclusive occupancy coverage;
- displayed “occupancy above break-even/headroom” comparisons.

For each concept, document:

1. formula;
2. numerator/denominator;
3. source inputs;
4. whether the result is an operating ratio, modeled physical-occupancy threshold, or lender-style capacity reference;
5. exclusions and limitations;
6. display label.

Do not silently replace GPR with EGI, or vice versa, to force two numbers to match. If two valid concepts use different bases, label them as different concepts.

## Phase D: Shared editorial + visual system repair

Apply the September 6 design findings through reusable publication authority where shared:

- **one boundary, one separator**;
- consistent KPI number family, weight, color, and spacing;
- readable minimum text targets; reflow rather than shrink;
- stable current/market and income/expense color semantics;
- real gutters in tables, source registers, two-column blocks, and manifests;
- headings kept with first meaningful content;
- short tables kept intact where practical;
- long tables flow with repeated headers and useful continuation titles;
- full filenames preserved and safely wrapped;
- bookmarks/navigation preserved;
- no unnecessary decorative line stacks.

Review every shared change against both Screening and Underwriting.

## Phase E: Decision opening + product language

Rebuild the opening as an investor decision brief, not a system-status dashboard.

Current direction:

- title: `InvestorIQ Underwriting Report`;
- optional subtitle: `Prepared for investment review`;
- cover status: plain-language source-review status, not unexplained `RECONCILIATION REQUIRED`;
- page 2: one `Investment Decision Snapshot` title; remove redundant `INVESTMENT COMMITTEE OVERVIEW`;
- executive status must distinguish the $180,000 cross-basis rent comparison from the separate $20,000 expense subtotal difference;
- findings should read as **fact -> meaning -> unresolved issue -> required next evidence/action**;
- remove system-governance language that belongs in code/tests/internal methodology rather than the investment narrative;
- do not invent a BUY/SELL grade, IRR, equity multiple, forecast, strategy, or unsupported recommendation.

Only reconsider `Investment Committee Memorandum` after the finished opening genuinely earns that title.

## Phase F: Duplication and analytical communication

Perform a complete cross-section copy/logic pass to remove contradictions and repeated process language while preserving unique evidence.

Examples from the audit that must be solved generically:

- stale “interest-rate stress deferred” wording despite rate sensitivity later;
- duplicate KPI blocks with conflicting visual hierarchy;
- repeated reconciliation warnings that do not add information;
- repeated source-coverage inventories in body and appendix;
- “availability” language presented as “reliability”;
- internal implementation/scope roadmap language exposed to customers;
- precision changes between analytical table and chart surfaces.

## Phase G: Appendix, source register, methodology, Quality Manifest

The ending must feel intentional and institutionally readable.

Required outcomes:

- long source identities never collide or truncate evidence;
- source role/use/limitations are concise and distinct;
- source dates/periods/currency appear where authority provides them;
- methodology language distinguishes source acceptance/validation from independent verification;
- Quality Manifest states unresolved issues and actual scope plainly;
- technical traceability is preserved without crowding customer-facing text;
- report identity/revision/publication evidence is shown only where genuinely available.

## Phase H: Fresh cross-product regeneration and acceptance

Do not validate by manually editing the audited PDF.

After root-cause fixes:

1. run meaningful regressions;
2. build production code locally/CI without production deployment;
3. generate fresh Underwriting and Screening artifacts through the real lanes;
4. use Stonebridge only as one regression fixture, not the only evidence;
5. include generalized fixtures/tests for tie handling, long filenames, precision, missing data, and pagination where practical;
6. inspect every page at full-page and reading scale;
7. verify calculations, source references, copy, rules, typography, continuations, navigation, source register, methodology, and Quality Manifest;
8. run actual DocRaptor/Prince proof only when authorized;
9. close editorial acceptance separately from provider acceptance.

Page counts are whatever supported content and readable pagination require.

## Phase I: Production decision

Production remains a separate owner decision after all acceptance gates close.

Do not merge `main`, deploy, migrate, activate scheduler, mutate Storage, or change Stripe/pricing during Phases A-H without explicit owner authorization.

## Forbidden shortcuts

Never:

- hardcode Stonebridge values to satisfy the audit;
- add fixture-specific CSS;
- hide a failing section;
- change a formula because a screenshot looks inconsistent;
- delete evidence to reduce pages;
- force reports to 5, 21, 25, 30, or any other page count;
- treat DocRaptor TEST watermarks as a product defect;
- loosen regression tests merely to accommodate broken behavior;
- call the product accepted without the final editorial gate.

