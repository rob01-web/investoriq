## September 9, 2026 launch closeout - CURRENT STATUS AUTHORITY

This is the newest current-status authority. It supersedes older branch, deployment, launch-readiness, pricing-closeout, and Owner Economics status below only where they conflict. **Preserve all historical material below.**

Current working branch:

`internal-owner-economics-cost-model-20260909-r2`

Current production runtime SHA:

`243159be4be0b34c613b51a4b00a098e75e14e31`

Current Vercel production deployment:

`dpl_HXd4Z538RBG1xsexqTzG9gDbVpSa` (`READY`)

Detailed Sep 9 closeout authority:

`CHAT_HANDOFF/archived/2026-09-09-launch-readiness-owner-economics-closeout/SEP9_CLOSEOUT_AUTHORITY.md`

The certified report-publication doctrine below remains governing. Sep 9 added strict customer admission enforcement, final pricing/customer-journey polish, and the planning-only Owner Economics dashboard without changing report math, evidence doctrine, page doctrine, or the Sep 6 rendered-report certification history.

Docs-only commits made after deployment do not change the live runtime SHA above.

# InvestorIQ ELITE Report Blueprint


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
**Status:** Governing blueprint for Underwriting Editorial + Analytical ELITE Closeout  
**Scope:** Certified reusable Screening/Underwriting reporting behavior and post-deployment change control

## 0. Certification and deployment baseline

The current baseline is the certified isolated branch commit `c07c1da8cef64fab95f825746bddecb03c1b14e8`, deployed to Vercel production as `dpl_DYQ7rXuyb93SU17zp4X5899vuvzy`. Future changes must preserve the completed executable gates, fresh-artifact evidence, and page-by-page visual acceptance recorded in the current handoff.

## 1. Product identity

InvestorIQ produces related but distinct institutional decision-support products:

- `InvestorIQ Screening Report`
- `InvestorIQ Underwriting Report`

They share one premium publication family and one evidence/calculation governance system while serving different decision depths.

The products are **not page-count products**.

## 2. Root-cause publication doctrine

A generated test PDF is evidence. It is never the code target.

Every repair must remain correct when:

- the property changes;
- source documents change;
- amounts and precision change;
- the number of support documents changes;
- text becomes longer or shorter;
- a data field is missing;
- a ranking contains a tie;
- a table gains more rows;
- the final page count changes.

The system must not contain customer-output logic whose purpose is merely to make one known fixture look correct.

## 3. Core information hierarchy

Permanent hierarchy:

**Decision first. Facts before prose.**

Customer-facing sections should prefer:

1. fact;
2. decision relevance / interpretation;
3. unresolved issue or limitation;
4. required next evidence/action;
5. supporting source traceability.

Internal governance language should remain in code, tests, methodology records, or audit evidence unless a reader truly needs it to understand the conclusion.

## 4. Current Underwriting product title

Current editorial recommendation:

# InvestorIQ Underwriting Report

Optional subtitle:

**Prepared for investment review**

Do not use `Investment Committee Memorandum` as the primary title merely because it sounds more premium. The report may earn that title later if the opening genuinely operates as a committee decision brief: clear decision requested, supported rationale, material risks, funding/capital picture where supported, unresolved conditions, and evidence needed before the next decision.

No arbitrary page length or single metric determines whether a report qualifies as an IC memorandum.

## 5. Underwriting opening

The first analytical page remains `Investment Decision Snapshot`.

Remove redundant competing introduction labels. One quiet running header plus one main page title is sufficient.

The opening should prioritize the most decision-critical supported facts, not every available metric.

For the audited class of issue, distinguish clearly between:

- cross-basis/source-period differences that require explanation; and
- true subtotal/total reconciliation gaps that require supporting schedules.

A plain-language reader-facing status such as **Source differences require review** is preferred to unexplained process terminology such as `RECONCILIATION REQUIRED`.

Never infer the cause of a source difference without evidence.

## 6. Screening continuity

Screening remains the faster triage product and must not inherit Underwriting-only analysis merely because a shared visual component changes.

However, shared publication rules should remain visibly continuous across both products, including:

- wordmark;
- type hierarchy;
- metric styling;
- rule/separator system;
- source-status language;
- numeric-format policy;
- footers/running furniture;
- source-register behavior where applicable;
- pagination primitives.

Every shared change must be evaluated against both lanes.

## 7. Typography and readability

Approved publication families remain:

- Cormorant Garamond;
- DM Sans;
- DM Mono.

Use them consistently by semantic role.

Design targets at intended print size:

- body copy approximately 10-11pt where practical;
- table text approximately 9-10pt where practical;
- notes approximately 8-9pt where practical.

These are readability targets, not hard constants. Essential meaning must not depend on ~5pt text.

Reflow content. Do not shrink text simply to preserve a historical page count.

Executive KPIs should use the approved proportional-numeral treatment where visual density benefits. Technical tabular data may use tabular figures where alignment genuinely helps.

## 8. Rule and border system

Permanent doctrine:

# One boundary, one separator.

Do not stack a heading accent, another section rule, a container border, and a heavy table top border at the same visual boundary.

Use:

- restrained gold only for deliberate accent/meaning;
- quiet green/neutral rules for structure;
- stronger rules for totals or major chapter transitions only;
- meaningful chart connectors where they convey data relationships.

The owner’s September 6 concern was not em-dash punctuation. The audited PDF contained zero em dashes and zero en dashes in searchable customer-facing text. Preserve that customer-copy standard while treating visual rules separately.

## 9. Numeric precision and ranking semantics

Calculation precision and display precision are separate concerns.

Rules:

- calculations use canonical source/derived precision;
- display formatting must not alter the value used in related totals/charts;
- if visible rounded rows can no longer reproduce a displayed total, provide a consistent rounding policy or retain sufficient precision;
- charts, tables, summaries, and narrative must draw from one governed value source;
- tie-aware rankings must describe ties as ties rather than silently selecting the first matching row;
- percentage-point and basis-point labels must be explicit where relevant.

No fixture-specific rounding logic.

## 10. Calculation-basis transparency

Terms such as `break-even occupancy`, `debt-inclusive occupancy coverage`, `NOI margin`, and scenario outputs must disclose enough basis that a sophisticated reader can understand what is being measured.

If two valid metrics use different revenue bases, they must be named as different concepts rather than made numerically identical.

For any changed calculation concept, the engineering record must identify:

- formula;
- source inputs;
- numerator/denominator;
- exclusions;
- display label;
- test coverage.

Never change a formula only because another page uses a different model.

## 11. Source differences and unresolved evidence

Customer-facing status language must state what differs and why it matters.

Do not collapse unlike issues into one generic warning.

For example, a T12 GPR versus annualized Rent Roll in-place comparison is a cross-basis comparison unless source authority proves otherwise. A listed-expense subtotal that is below stated operating expenses is a different type of reconciliation issue.

The report should identify each issue, preserve accepted source facts, state what conclusions are affected, and request the required evidence without inventing a cause.

## 12. Source periods, currency, and context

Where available from canonical source authority, make visible:

- T12 reporting period;
- Rent Roll as-of date;
- appraisal date;
- market-survey date/period;
- report generation date;
- currency designation.

Do not use report-generation date as a substitute for source currency/currentness. If a source date or currency is unavailable, disclose that accurately.

## 13. Charts and visuals

Keep visuals only when they answer a real investment question.

The source-backed earnings bridge is approved as a useful pattern.

Charts must preserve:

- source precision;
- stable semantic colors;
- readable labels;
- no unsupported forecasts or probabilities;
- no arbitrary decorative graphics;
- no mismatch between chart values and governing tables.

## 14. Page flow

No hard page caps.

Use content-driven pagination:

- heading with first meaningful content;
- short schedules kept intact when practical;
- totals kept with the schedule they summarize;
- long tables may continue with repeated headers;
- continuations should be recognizable where context would otherwise be lost;
- long sections may break naturally;
- avoid whole-section no-break rules that create large dead zones;
- do not remove evidence to make a page look fuller or shorter.

The prior 5-page Screening / 21-page Underwriting Stonebridge proof is not a page-count authority.

## 15. Source register and Quality Manifest

Source identity must remain auditable.

Rules:

- never silently truncate filenames in a way that destroys source identity;
- long filenames/tokens must wrap safely;
- clear columns/gutters must prevent collisions;
- distinguish `available/received` from `reliable/verified`;
- explain source role, report use, and limitations concisely;
- preserve methodology and Quality Manifest substance;
- customer-facing labels should explain actual unresolved status rather than merely state that a disclosure exists;
- technical publication receipts/certification should be shown to the reader only where useful and genuinely available.

## 16. System-facing language

Remove or relocate customer copy that describes implementation mechanics instead of the investment.

Examples of language to scrutinize:

- “may establish this label”;
- “integrated replacement surface”;
- “current sensitivity set” when the reader only needs scope;
- “InvestorIQ source-bound calculation framework” when a plain methodology statement would do;
- feature-roadmap language such as analyses that “do not exist yet.”

Translate into actual report scope, limitation, and next action.

## 17. Accessibility and navigation

Preserve useful PDF bookmarks and searchable text.

Where the publication system supports it, improve tagged reading order/table structure as a usability enhancement. This must not compromise visual rendering or source integrity.

## 18. Two-gate acceptance model

A report is not customer-accepted merely because the PDF provider rendered it correctly.

Separate gates:

### Gate A: provider/render certification

- valid PDF;
- correct fonts;
- no clipping/overlap;
- correct pagination geometry;
- correct provider behavior.

### Gate B: editorial/investment-review acceptance

- facts and calculations internally governed;
- copy grammatically clean and useful;
- no contradictions;
- no unnecessary duplication;
- decision framing strong;
- visual hierarchy disciplined;
- tables/charts readable;
- source/register/methodology ending deliberate;
- every page reviewed at normal reading scale.

Both gates must pass before calling the product customer-ready.

## 19. Production hold

This blueprint authorizes no production mutation.

No `main` merge, deployment, migration, scheduler activation, Storage mutation, Stripe/pricing change, or other production change without separate owner authorization.

