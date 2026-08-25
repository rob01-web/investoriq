# InvestorIQ — ELITE Full Underwriting Blueprint

**File:** `CHAT_HANDOFF/02_ELITE_FULL_UNDERWRITING_BLUEPRINT.md`  
**Created:** 2026-08-19
**Last checkpoint update:** 2026-08-19 20:37 EDT  
**Status:** ACTIVE PRODUCT-QUALITY WORKING AUTHORITY — ELITE-02 THROUGH ELITE-08 CLOSED LOCALLY — ELITE-09 NEXT
**Scope:** Full Underwriting report quality, analytical depth, report information architecture, scenario intelligence, decision usefulness, and eventual visual redesign  
**Relationship to other authority files:**  
- `00_CURRENT_HANDOFF.md` = current operational checkpoint  
- `01_MASTER_PLAN.md` = overall InvestorIQ architecture / launch program  
- `02_ELITE_FULL_UNDERWRITING_BLUEPRINT.md` = ELITE Full Underwriting product/report authority

> **DO NOT RESTART THE COMPLETED REPOSITORY / PIPELINE AUDIT.**
>
> The monster audit is complete. The P0/P1 authority repair batch is deployed. This file exists to evolve Full Underwriting into an institutional-grade decision document without reopening closed architecture work unless new contradictory evidence requires targeted investigation.

---

# 0. CURRENT IMPLEMENTATION CHECKPOINT — 2026-08-19 20:37 EDT

The ELITE report-brain program is now complete locally through **ELITE-08 — Valuation & Reconciliation Upgrade**.

## Closed locally

- ELITE-02 — Investment Committee Overview
- ELITE-03 — Operating Intelligence
- ELITE-04 — Scenario Engine v1
- ELITE-05 — Underwriting Driver Analysis
- ELITE-06 — Transaction / Diligence Intelligence
- ELITE-07 — Debt Intelligence
- ELITE-08 — Valuation & Reconciliation Upgrade

ELITE-06 through ELITE-08 were not accepted on smoke tests alone. Final closure required cumulative full-report / pipeline regression plus broader institutional and constitutional report-surface gates.

## ELITE-08 closure proof

- customer-visible language boundary 7/7 PASS
- appraisal customer-surface contract 9/9 PASS
- valuation engine 72/72 PASS
- valuation renderer 44/44 PASS
- document wiring 15/15 PASS
- valuation/reconciliation institutional regression 21/21 PASS
- real cumulative ELITE-02→08 pipeline regression PASS
- ELITE-07 debt institutional regression preserved 36/36 PASS
- ELITE-06 transaction/diligence institutional regression preserved 24/24 PASS
- institutional information architecture PASS
- customer-surface validation PASS
- boss-contract validation PASS
- Source Truth pipeline authority PASS
- final PDF handoff smoke `ok`
- Gate 10V PASS
- syntax / diff integrity PASS aside from expected CRLF warnings

## ELITE-08 analytical capability now locked

ELITE-08:
- anchors implied whole-property value to accepted T12 NOI and accepted going-in cap rate;
- calculates deterministic value per unit where supported;
- compares implied value to accepted purchase price;
- compares uploaded appraisal context without allowing appraisal to replace canonical operating truth;
- produces deterministic variance relationships;
- explains core source reconciliation differences without capitalizing gross-revenue differences;
- reuses ELITE-04 governed cap-rate sensitivity rather than introducing a second scenario authority;
- collapses unsupported valuation comparators;
- does not invent IRR, MOIC, hold period, exit cap, terminal value, rent growth, lender decisions, or investment recommendations.

## ELITE-08 closure lessons

### Appraisal provenance / display contract
The first cumulative veto caught a representation mismatch: ELITE-08 displayed appraisal cap rate as `7.40%` while canonical customer-surface formatting expected `7.4%`. This caused the customer-surface validator to treat an accepted appraisal fact as missing; repair attempted to collapse the appraisal section; the provenance firewall correctly vetoed loss of `sourceBacked`. The fix aligned display formatting with canonical customer-surface authority and added dedicated regression. The firewall was not weakened.

### Institutional customer-visible language
After cumulative ELITE-02→08 passed, institutional information architecture correctly rejected visible `source-backed` wording. Internal `source_backed` evidence classification remains preserved; visible wording was made institutional (`Accepted evidence`, `uploaded appraisal value`). A dedicated customer-language regression now protects both conditions.

### Packaging-only syntax defect
An intermediate V1 hotfix inserted a literal PowerShell backtick-n sequence into JavaScript. Syntax failed before behavioral testing. V2 corrected only that packaging defect; it was not a product-logic failure.

## QA rule for all remaining ELITE work

**Smoke tests are necessary but insufficient.**

Every remaining ELITE packet must pass:
- targeted contract / renderer / wiring proof,
- cumulative real ELITE-stack pipeline regression,
- relevant institutional regression,
- institutional information architecture,
- customer-surface validation,
- boss-contract validation,
- Source Truth authority,
- final PDF handoff,
- Gate 10V,
- syntax and diff integrity.

**The full cumulative/institutional pipeline gets the veto.**

## Next

**ELITE-09 — Quality Manifest Redesign.**

Make the manifest investor-readable and polished while preserving its trust/certification role.

Required concepts remain:
- report identity,
- revision identity,
- generated / certified timestamp,
- product identity,
- source mode,
- accepted core evidence,
- support documents used,
- support documents excluded,
- core reconciliation status,
- collapsed / omitted sections,
- quality incidents,
- scenario-analysis basis,
- calculation authority version,
- report certification version,
- publication receipt identity.

The manifest should communicate confidence and limits without reading like an internal error log.

---
# 1. PURPOSE

InvestorIQ Full Underwriting must become a report that a serious investor, lender, acquisitions team, asset manager, or investment committee can use to understand:

1. what the property is,
2. what the uploaded evidence actually proves,
3. what the operating economics show,
4. what the transaction terms imply,
5. what the major risks and constraints are,
6. what variables matter most,
7. how sensitive value / NOI / DSCR / related outputs are to changes in supported inputs,
8. what remains unresolved,
9. what additional diligence would materially improve conviction,
10. and why the report deserves a materially higher price than Screening.

This is not a page-count exercise.

There is **no arbitrary 14-page cap**. A thinner evidence package may produce a shorter Full Underwriting report. A rich package may produce a substantially longer one. The correct length is the amount of space required to present the available evidence clearly, analytically, and without filler.

The guiding principle is:

> **Better analysis may derive more insight from canonical facts, but it may never pretend the evidence is stronger than the uploaded/adjudicated sources support.**

---

# 2. EXTERNAL BENCHMARK — BLACKSTONE DHL TSING YI INVESTMENT MEMORANDUM

Benchmark document reviewed:

**Blackstone — DHL Tsing Yi Investment Memorandum — May 2021 — 14 pages**

This document is a benchmark for institutional decision density and analytical discipline only.

InvestorIQ must **not copy Blackstone wording, layouts, branding, or proprietary analysis**. The objective is to understand what makes the memo effective and then build an original InvestorIQ report system that is better suited to automated, source-governed underwriting.

## 2.1 What the Blackstone memo actually contains

### Page 1 — Cover
- Extremely restrained.
- White background.
- Large serif title.
- Date.
- Small Blackstone mark.
- No decorative dashboard styling.

### Page 2 — Map
- Location and strategic context.
- Short thesis statement above the map.
- Immediate visual orientation.

### Page 3 — Situation Overview
Three high-value components:
- Background
- Investment Highlights
- BREP Basis / Returns

This page answers quickly:
- what the opportunity is,
- why it matters,
- what the key structure is,
- what the economic proposition is.

### Page 4 — Transaction Terms
Structured key terms include:
- consideration,
- land premium limit,
- additional consideration,
- conditions precedent,
- refundable earnest money,
- non-refundable deposit,
- interim costs.

### Page 5 — Indicative Timeline
A transaction-critical-path view:
- milestones,
- deposits,
- government approvals,
- signing,
- completion,
- major payments.

### Page 6 — JV Terms
Material contract / structural terms:
- shareholding,
- governance,
- ROFO / tag rights,
- fees,
- lease obligations,
- extension options.

### Pages 7–9 — Market Context
Includes:
- retail leasing context,
- e-commerce growth context,
- warehouse market trends.

The important lesson is not that InvestorIQ should fabricate external market research. The lesson is that **market evidence should be decision-linked when credible external or uploaded support exists**.

### Pages 10–12 — Sensitivity Analysis
This is one of the most important institutional features in the memo.

Blackstone tests combinations including:
- exit cap rate,
- all-in purchase price,
- LTC,
- construction cost,
- market rental growth,
- hold period,
- construction period,
- lease-up period.

The memo does not stop at a base case. It asks:

> **What changes the outcome?**

### Pages 13–14 — Tornado / Driver Analysis
The memo ranks factors according to their impact on returns.

This elevates the analysis from:
- “here are the assumptions”
to:
- “here are the assumptions that matter most.”

That is a major ELITE principle for InvestorIQ.

---

# 3. PRIMARY BLACKSTONE LESSONS FOR INVESTORIQ

## 3.1 Decision density beats page count

The Blackstone memo feels institutional because each page has a job.

InvestorIQ should avoid:
- repetitive prose,
- decorative filler,
- dashboards that do not change a decision,
- long disclosures in primary decision surfaces,
- charts that merely repeat a table.

Every major section should answer one of these questions:

- What happened?
- Why does it matter?
- What is supported?
- What is uncertain?
- What changes the outcome?
- What should the investor verify next?

## 3.2 The first pages must operate like an investment-committee interface

The current Full Underwriting Executive Summary should evolve beyond a property fact sheet.

It should communicate:
- asset identity,
- operating position,
- source-backed investment case,
- primary risk,
- valuation position,
- financing position where supported,
- major unresolved diligence,
- evidence confidence / limitations.

## 3.3 Institutional reports show terms explicitly

Material terms should not be buried in prose.

Where uploaded documents support them, InvestorIQ should structure:
- purchase price / basis,
- deposits,
- closing conditions,
- financing terms,
- major obligations,
- contingencies,
- dates,
- fees,
- lease obligations,
- governance / contractual provisions where relevant.

## 3.4 Institutional reports test downside and uncertainty

InvestorIQ’s largest current analytical gap is the absence of a broad governed sensitivity system comparable in spirit to institutional underwriting models.

The objective is not to manufacture assumptions.

The objective is to calculate transparent sensitivities where:
- an accepted base fact exists,
- the relevant formula is deterministic,
- the perturbation is clearly labeled as a scenario,
- the report never presents the scenario as a sourced fact.

## 3.5 Institutional reports identify the variables that matter most

InvestorIQ should evolve from:
- “here are the numbers”

to:
- “here are the numbers, here is what moves them, and here is what deserves the investor’s attention.”

---

# 4. CURRENT INVESTORIQ FULL UNDERWRITING STRUCTURE

The current Full Underwriting renderer already has a strong six-chapter skeleton.

## Chapter 1 — Investment Committee Overview
Current surfaces:
- Executive Summary
- Key Metrics Snapshot
- Underwriting Observations
- Primary Constraint / Review Disclosure

## Chapter 2 — Operating Performance
Current surfaces:
- Institutional Operating Visuals
- Unit Mix and Rent Positioning
- Market Rent Survey Context
- Operating Statement / TTM Summary
- Rent Position / Whole-Property Value Context

## Chapter 3 — Transaction Context
Current surfaces:
- Acquisition Request Context
- Preliminary Financing Readiness Summary
- Environmental Due Diligence Context

## Chapter 4 — Debt & Capital Structure
Current surfaces:
- Debt / Financing Context
- Debt Service and Coverage
- Debt Visuals
- Debt Term and Maturity Analysis
- Debt Capacity and Coverage
- Capital Plan and Reserve Position
- Renovation / CapEx Context

## Chapter 5 — Valuation & Reconciliation
Current surfaces:
- Cap-Rate Value Indication
- Appraisal / Valuation Context
- Core Source Reconciliation

## Chapter 6 — Source Appendix
Current surfaces:
- Data Coverage & Source Limitations
- Source Register & Document Treatment
- Methodology & Data Transparency

---

# 5. HIGH-LEVEL ELITE VERDICT ON CURRENT STRUCTURE

**Do not rebuild the report from scratch.**

The current structure is directionally strong.

Working estimate:

> **Preserve roughly 70% of the structural skeleton; transform roughly 30% through deeper analysis, better decision framing, new scenario intelligence, stronger interpretation, and more refined section behavior.**

The six-chapter architecture can remain unless implementation evidence shows a better arrangement.

The likely addition is a dedicated scenario/driver chapter or a major scenario/driver block within the existing chapter structure.

---

# 6. CURRENT SECTION → ELITE DIRECTION

## Executive Summary
**Current state:** property profile, evidence acceptance, core summary metrics.

**ELITE target:** **Executive Investment Summary**

Must answer:
- What is the asset?
- What is the source-backed investment case?
- What are the two or three strongest operating positives?
- What is the primary source-backed risk or constraint?
- What is the valuation position?
- What is the financing / coverage position if supported?
- What is still unknown?
- What should an investment committee focus on next?

No unsupported “BUY / SELL” recommendation.

## Key Metrics Snapshot
**Keep.**

Improve:
- metric hierarchy,
- grouping,
- clear “source-backed / calculated / scenario” distinction,
- prevent overload.

Potential metric families:
- units,
- occupancy,
- in-place rent,
- market rent where accepted,
- EGI,
- operating expenses,
- NOI,
- NOI margin,
- expense ratio,
- break-even occupancy,
- purchase price,
- price per unit,
- going-in cap rate,
- DSCR where supported,
- debt amount / LTV where supported.

## Underwriting Observations
**Keep but materially upgrade.**

Should become decision-oriented analysis, not merely a list of facts.

Potential structure:
- Positive operating signals
- Key risks / constraints
- Evidence conflicts
- Decision-sensitive variables
- Diligence priorities

## Primary Constraint / Review Disclosure
**Keep and elevate.**

Potential evolution:
- Primary Constraint
- Material Reconciliation Issue
- Investor Impact
- Required Follow-up
- Whether it affects operating analysis / valuation / financing / execution

Could become part of an **Investment Risk & Diligence Matrix**.

## Unit Mix and Rent Positioning
**Keep and deepen.**

Potential analytical upgrades:
- unit concentration,
- occupancy concentration,
- weighted in-place rent,
- weighted market rent where supported,
- rent spread by unit type,
- largest rent gap category,
- lease status concentration where supported,
- top tenant / unit concentration where applicable.

## Market Rent Survey Context
**Keep conditional.**

Only render if uploaded evidence supports it.

Do not allow external / unsourced market ranges to override accepted Rent Roll rents.

## Operating Statement / TTM Summary
**Major ELITE upgrade target.**

Move from a number table toward:
- revenue composition,
- operating expense composition,
- NOI conversion,
- expense burden,
- NOI margin,
- per-unit normalization,
- material anomalies,
- source conflicts,
- investor interpretation.

Where historical periods exist in uploaded statements, allow trend analysis.

Do not imply history that is not actually present.

## Rent Position / Whole-Property Value Context
**Rework.**

Must clearly separate:
- gross rent evidence,
- NOI evidence,
- valuation evidence.

Never capitalize gross rent difference unless an authorized NOI conversion basis exists.

Potential future upgrade:
- rent stress impact,
- occupancy stress impact,
- rent + occupancy matrix where deterministic.

## Acquisition Request Context
**Keep, likely rename.**

Potential ELITE name:

**Transaction Terms & Acquisition Context**

Where supported, structure:
- purchase price,
- deposit,
- acquisition fee,
- target close,
- financing terms,
- LTV / LTC,
- interest rate,
- amortization,
- lender fee,
- contingencies,
- conditions precedent,
- transaction milestones.

## Preliminary Financing Readiness Summary
**Keep but reposition.**

Should become a true diligence/readiness view, not generic boilerplate.

Potential output:
- Provided
- Partially provided
- Missing
- Materiality
- Dependent analysis affected

## Environmental Due Diligence Context
**Keep conditional.**

Do not infer environmental legal conclusions.

## Debt / Financing Context
**Keep conditional.**

## Debt Service and Coverage
**Keep and deepen.**

Potential upgrades:
- annual debt service,
- DSCR,
- debt yield where deterministic and supported,
- break-even occupancy relationship,
- financing headroom,
- scenario stress.

## Debt Term and Maturity Analysis
**Keep conditional.**

Potential upgrades:
- maturity timing,
- amortization remaining,
- refinancing exposure,
- rate sensitivity where a supported debt basis exists.

Avoid unsupported “risk grade” classification unless policy is later authorized.

## Debt Capacity and Coverage
**Keep and deepen.**

This is a natural home for governed lender-style deterministic metrics.

## Capital Plan and Reserve Position
**Keep conditional.**

Potential upgrades:
- reserve contribution,
- deferred maintenance,
- CapEx schedule,
- per-unit CapEx,
- concentration of major projects.

## Renovation / CapEx Context
**Keep conditional.**

Where inputs support calculations, potentially add:
- total plan cost,
- cost per unit,
- rent lift by scope,
- timing,
- simple deterministic payback or yield-on-cost style calculations only if formula authority and source basis are explicitly approved.

## Cap-Rate Value Indication
**Keep and materially strengthen.**

Potential ELITE additions:
- base accepted cap-rate value,
- value per unit,
- purchase-price comparison,
- cap-rate sensitivity matrix,
- explicit separation between source-backed cap rate and scenario rates.

## Appraisal / Valuation Context
**Keep conditional.**

Third-party appraisal remains context, not source authority over canonical NOI.

## Core Source Reconciliation
**Absolutely keep and elevate.**

This is one of InvestorIQ’s strongest potential differentiators.

Should clearly show:
- which sources disagree,
- variance,
- likely explanation if evidence supports it,
- which source governs each calculation,
- what remains unresolved,
- whether the disagreement materially affects value / financing / operating interpretation.

## Data Coverage & Source Limitations
**Keep, polish heavily.**

Should be decision-useful rather than defensive.

## Source Register & Document Treatment
**Keep.**

This is institutional auditability.

## Methodology & Data Transparency
**Keep but compress.**

Primary report should not drown in methodology.

Longer formula/source lineage can live in appendix-style surfaces or the Quality Manifest.

---

# 7. NEW ELITE CAPABILITIES TO ADD

The following capabilities are not optional aspirations. They are the main Full Underwriting upgrade program.

## 7.1 Investment Case / Decision Frame

Create an institutional decision frame that communicates:

### Opportunity
What is attractive based on accepted evidence?

### Operating Strengths
Examples:
- strong occupancy,
- healthy NOI margin,
- documented rent spread,
- disciplined expense burden,
- favorable debt coverage.

Only when supported.

### Principal Risks
Examples:
- concentration,
- source conflicts,
- weak coverage,
- maturity exposure,
- significant deferred maintenance,
- large unsupported rent gap,
- environmental / transaction contingencies.

Only when supported.

### Value Position
What does current deterministic value analysis show?

### Financing Position
What does supported debt / coverage analysis show?

### Open Diligence
Which unanswered questions could materially change the underwriting conclusion?

This section should not become investment advice.

---

# 7.2 Structured Transaction & Material Terms

Create a generalized terms engine capable of presenting uploaded contractual / transaction evidence.

Possible inputs:
- purchase assumptions,
- LOI,
- PSA,
- financing term sheet,
- mortgage statement,
- lease,
- renovation agreement,
- appraisal,
- JV / partnership documents,
- other support documents.

Potential fields:
- purchase price,
- deposit,
- refundability,
- closing date,
- financing contingency,
- inspection period,
- due diligence deadline,
- financing amount,
- LTV / LTC,
- interest rate,
- amortization,
- maturity,
- lender fee,
- seller obligations,
- buyer obligations,
- material conditions precedent.

Never invent missing terms.

---

# 7.3 Transaction / Diligence Critical Path

Inspired by the usefulness of Blackstone’s timeline page, but generalized for InvestorIQ.

Render only when actual dated milestones exist.

Possible milestones:
- LOI signed,
- deposit due,
- due diligence expiry,
- financing commitment,
- appraisal deadline,
- environmental review,
- closing date,
- renovation milestones,
- loan maturity,
- lease expiry.

Potential output:
- timeline,
- upcoming critical dates,
- capital requirements,
- unresolved milestone dependencies.

No fake dates.

---

# 7.4 Governed Scenario & Sensitivity Analysis

This is the largest analytical upgrade.

InvestorIQ should generate scenario tables only when the base calculation is deterministic and sufficiently supported.

## Core scenario families

### A. Occupancy Stress
Potential outputs:
- EGI,
- NOI,
- NOI margin,
- DSCR if debt basis exists.

### B. Rent Stress
Potential outputs:
- annual rent,
- EGI,
- NOI if a governed conversion basis exists.

### C. Operating Expense Stress
Potential outputs:
- operating expenses,
- NOI,
- NOI margin,
- DSCR.

### D. Cap Rate Sensitivity
Potential outputs:
- implied value,
- value per unit,
- value delta vs purchase price.

### E. Interest Rate Sensitivity
Where debt terms permit deterministic debt-service recalculation:
- monthly debt service,
- annual debt service,
- DSCR.

### F. Purchase Price Sensitivity
Potential outputs:
- going-in cap rate,
- price per unit,
- equity requirement where supported,
- financing ratios where supported.

### G. Two-Dimensional Scenario Matrices
Examples:
- occupancy × expense level → NOI
- occupancy × rent → EGI / NOI
- cap rate × NOI → value
- interest rate × debt amount → DSCR
- cap rate × purchase price → value gap / basis comparison

## Scenario labeling rule

Every scenario output must be visibly distinguished from source facts.

Suggested labels:
- **Source-backed**
- **Deterministic calculated**
- **Scenario**
- **Unavailable / unsupported**

A scenario is not evidence.

---

# 7.5 Underwriting Driver Analysis

InvestorIQ should identify which supported variables have the largest impact on selected outputs.

This is conceptually similar to an institutional tornado analysis but should be uniquely designed for InvestorIQ.

Potential target outputs:
- NOI
- NOI margin
- DSCR
- implied value
- break-even occupancy
- annual cash burden where supported

Potential drivers:
- occupancy,
- rent,
- operating expenses,
- interest rate,
- debt amount,
- cap rate,
- purchase price,
- major CapEx,
- tax expense where supported.

Output concept:

| Driver | Base | Stress | Output Change | Relative Impact | Evidence Basis |
|---|---:|---:|---:|---|---|

Possible qualitative labels:
- Primary driver
- Material driver
- Secondary driver

Do not label “high / moderate / low risk” unless a governed policy is explicitly approved.

---

# 7.6 Investor Questions / Diligence Priorities

Create a short, high-value decision-support section.

Potential questions:
- What evidence would most change valuation?
- What explains the T12 / Rent Roll variance?
- Is the documented market rent actually achievable?
- Does current debt constrain refinancing or acquisition?
- Are large CapEx obligations fully quantified?
- Is occupancy concentrated?
- Are major lease expirations approaching?
- Is an appraisal materially different from InvestorIQ’s deterministic value?
- Are environmental / zoning / tax issues unresolved?
- Is the property dependent on one unsupported assumption?

Questions must be generated from actual evidence gaps or conflicts.

---

# 8. PROPOSED ELITE REPORT INFORMATION ARCHITECTURE

The final architecture should preserve the current strength while adding decision intelligence.

## CHAPTER 1 — Investment Committee Overview

1. Executive Investment Summary
2. Key Metrics Snapshot
3. Investment Case / Decision Frame
4. Principal Risks & Constraints
5. Key Investor Questions
6. Primary Source Reconciliation Alert, if material

## CHAPTER 2 — Operating Performance

1. Operating Performance Overview
2. TTM / Historical Operating Statement
3. Revenue Quality
4. Expense Structure
5. NOI & Margin Analysis
6. Unit Mix & Rent Positioning
7. Occupancy / Concentration Analysis
8. Market Rent Survey Context, if supported
9. Operating Evidence Visuals

## CHAPTER 3 — Scenario & Underwriting Drivers

1. Scenario Basis
2. Occupancy / Rent Sensitivity
3. Expense / NOI Sensitivity
4. Cap Rate / Value Sensitivity
5. Debt-Service / Rate Sensitivity, if supported
6. Underwriting Driver Analysis
7. Decision Interpretation

This chapter must collapse or reduce intelligently if required data is unavailable.

## CHAPTER 4 — Transaction & Diligence Context

1. Transaction Terms & Acquisition Context
2. Material Contract / Structural Terms
3. Critical Path / Diligence Timeline
4. Financing Readiness
5. Environmental Context
6. Tax / zoning / other support context where provided

## CHAPTER 5 — Debt & Capital Structure

1. Current Debt Context
2. Proposed Financing Context
3. Debt Service & Coverage
4. Debt Capacity
5. Maturity / Refinance Context
6. Capital Plan & Reserve Position
7. Renovation / CapEx Context
8. Debt visuals / sensitivity

## CHAPTER 6 — Valuation & Reconciliation

1. Cap-Rate Value Indication
2. Value per Unit
3. Purchase Price / Basis Comparison
4. Appraisal Context, if provided
5. Valuation Sensitivity
6. Core Source Reconciliation
7. Material Valuation Constraints

## CHAPTER 7 — Evidence & Quality Appendix

1. Data Coverage
2. Source Register
3. Document Treatment
4. Reconciliation Summary
5. Collapsed / Omitted Sections
6. Quality Incidents
7. Methodology
8. Quality Manifest
9. Report / revision / certification identity

The existing six-chapter structure may remain if implementation shows the Scenario chapter fits better elsewhere, but the above is the leading ELITE target.

---

# 9. PUBLISH-OR-COLLAPSE AT THE REPORT SURFACE

Every evidence-dependent section should support explicit disposition.

## Full Render
Evidence is sufficient for normal institutional presentation.

## Qualified Render
Evidence is usable but requires visible qualification.

## Compact Render
Only a narrow set of facts is supported; present them concisely.

## Collapse / Omit
The section does not have enough defensible evidence.

## Quality Incident
A valid-core report publishes, but an internal or representational defect is recorded.

Weak optional evidence must not independently destroy a valid-core report.

The report should never appear “broken” merely because a support document was absent.

---

# 10. EVIDENCE DISCIPLINE

InvestorIQ must preserve clear evidence classes.

## Source-backed
Directly supported by accepted uploaded source evidence.

## Deterministic calculated
Calculated from accepted source-backed facts using an authorized formula.

## Scenario
A hypothetical perturbation of accepted facts for sensitivity purposes.

## Third-party context
Information from uploaded appraisal, market survey, environmental, tax, or similar support.

## Missing / unsupported
Not established.

The report must never allow:
- scenario → source-backed promotion,
- third-party context → canonical override without authority,
- inferred market conditions → accepted fact,
- unsupported model assumptions → hidden calculation basis.

---

# 11. PROHIBITED BLACKSTONE IMITATION

InvestorIQ must **not** add these simply because they appear in the benchmark:

- IRR without complete authorized cash-flow assumptions
- MOIC without complete authorized equity/cash-flow assumptions
- exit cap rates presented as source facts when not supplied
- hold periods invented by InvestorIQ
- market rental growth assumptions invented by InvestorIQ
- construction periods invented by InvestorIQ
- lease-up periods invented by InvestorIQ
- LTC assumptions invented by InvestorIQ
- external market statistics that were not sourced through an approved data authority
- investment recommendations pretending to have more evidence than supplied

Future Premium or separately authorized modeling products may eventually introduce governed external data and richer forward modeling.

That is outside the current Full Underwriting authority unless separately approved.

---

# 12. SCREENING VS FULL UNDERWRITING DIFFERENTIATION

## Screening

Purpose:
- fast,
- focused,
- core operating read,
- obvious risks,
- concise decision support.

Likely surfaces:
- property snapshot,
- core metrics,
- T12 / Rent Roll reconciliation,
- basic operating risk,
- limited valuation context,
- compact Quality Manifest.

## Full Underwriting

Must materially add:
- deeper operating decomposition,
- richer source reconciliation,
- support-document incorporation,
- transaction terms,
- debt analysis,
- capital plan context,
- scenario analysis,
- driver analysis,
- diligence priorities,
- broader valuation context,
- more institutional visuals,
- stronger evidence appendix.

The difference must be obvious to a paying customer.

Full Underwriting must never feel like Screening with extra pages.

---

# 13. QUALITY MANIFEST — ELITE TARGET

The Quality Manifest should become a polished institutional trust layer.

Required concepts:
- report identity,
- revision identity,
- generated / certified timestamp,
- product identity,
- source mode,
- accepted core evidence,
- support documents used,
- support documents excluded,
- core reconciliation status,
- collapsed / omitted sections,
- quality incidents,
- scenario-analysis basis,
- calculation authority version,
- report certification version,
- publication receipt identity.

The manifest should communicate confidence and limits without reading like an error log.

---

# 14. VISUAL DIRECTION — DEFER FINAL DESIGN UNTIL ANALYTICS ARE LOCKED

Visual polish comes **after** content and analysis architecture.

However, the leading hypothesis should be recorded now.

## Current observation

The current InvestorIQ Full Underwriting uses:
- dark forest-green cover,
- gold,
- Cormorant Garamond,
- DM Sans / DM Mono,
- institutional chapter system,
- charts and summary cards.

This is attractive, but may feel more like a branded premium report than a restrained institutional investment memo.

## Leading ELITE visual hypothesis

Potential future direction:
- warm white / cream-white primary canvas,
- white interior pages,
- very dark charcoal / near-black text,
- sparse gold accents,
- forest green demoted from dominant background to selective brand accent,
- thin rules,
- generous whitespace,
- strong numeric tables,
- simple evidence charts,
- no decorative dashboard chrome.

This is **not final**.

The final visual system should be chosen only after:
- report sections,
- sensitivity outputs,
- decision surfaces,
- tables,
- charts,
- collapse behavior

are implemented and understood.

---

# 15. MAPS / EXTERNAL MARKET INTELLIGENCE

The Blackstone memo uses:
- a map,
- external market data,
- market forecasts,
- third-party research.

InvestorIQ should not force these into current Full Underwriting unless governed evidence exists.

## Current Full Underwriting
Use:
- uploaded market surveys,
- uploaded appraisal,
- uploaded environmental,
- uploaded tax evidence,
- uploaded contractual / financing evidence.

## Future possibility
A separately governed enrichment layer may add:
- maps,
- demographics,
- external rent comps,
- market vacancy,
- cap-rate data,
- debt-market data,
- sale comps,
- economic trends.

This is a likely future Premium capability.

---

# 16. ELITE IMPLEMENTATION ORDER

Do not attempt everything in one patch.

## ELITE-01 — Current Report Baseline / Contract
- Preserve current six-chapter inventory.
- Record exact current section inputs.
- Record section dispositions.
- Lock source-backed / calculated / scenario labels.

## ELITE-02 — Investment Committee Overview Upgrade — CLOSED LOCALLY
Implement:
- Executive Investment Summary
- Investment Case / Decision Frame
- Principal Risks
- Key Investor Questions
- Primary Reconciliation Alert

## ELITE-03 — Operating Intelligence Upgrade — CLOSED LOCALLY
Implement:
- revenue quality,
- expense structure,
- NOI analysis,
- unit / rent concentration,
- operating interpretation.

## ELITE-04 — Scenario Engine v1 — CLOSED LOCALLY
Implement governed:
- occupancy stress,
- expense stress,
- cap-rate value sensitivity,
- simple combinations.

No IRR/MOIC.

## ELITE-05 — Underwriting Driver Analysis — CLOSED LOCALLY
Rank supported drivers by deterministic output impact.

## ELITE-06 — Transaction Terms & Diligence — CLOSED LOCALLY
Implement:
- structured terms,
- conditions,
- milestone extraction,
- critical-path timeline.

## ELITE-07 — Debt Intelligence Upgrade — CLOSED LOCALLY
Implement:
- DSCR sensitivity,
- rate sensitivity,
- maturity context,
- debt-capacity interpretation.

## ELITE-08 — Valuation & Reconciliation Upgrade — CLOSED LOCALLY
Implement:
- better value framing,
- purchase-price comparison,
- appraisal comparison,
- reconciliation interpretation,
- value sensitivity.

## ELITE-09 — Quality Manifest Redesign
Make the manifest investor-readable and polished.

## ELITE-10 — Visual System Redesign
Only after analysis is stable.

Test:
- white / warm-white institutional direction,
- restrained gold,
- reduced forest-green dominance,
- sharper tables and charts,
- decision-density-first page composition.

---

# 17. QA / ACCEPTANCE STANDARD

A Full Underwriting ELITE upgrade is not accepted merely because the HTML renders.

Each implemented section should be tested for:

## Evidence correctness
- every displayed fact has source or deterministic lineage,
- scenario outputs cannot masquerade as source facts.

## Collapse correctness
- missing support does not create an empty or broken page,
- section disposition follows Publish-or-Collapse.

## Analytical correctness
- formulas are deterministic,
- calculations are internally consistent,
- no duplicated decision authority.

## Decision usefulness
A reviewer should be able to answer:
- what matters,
- why it matters,
- what could change the result,
- what remains unknown.

## Differentiation
The section must contribute something materially beyond Screening.

## Representation
- tables fit,
- charts are legible,
- no dense UI-card appearance,
- no unnecessary repetition,
- no verbose legalistic filler in primary decision pages.

---

# 18. CURRENT NON-NEGOTIABLE OPERATING BOUNDARIES

At the creation of this file:

- P0/P1 monster-audit repair batch is already deployed.
- The broad repository/pipeline audit must not be restarted.
- Supabase Cron remains paused.
- No production RETEST is authorized.
- No worker invocation is authorized.
- No pricing changes are authorized.
- Premium remains future-only and OFF.
- ELITE report work should proceed locally until deployment is explicitly authorized.
- Current pricing remains unchanged during ELITE work.
- Launch PASS still requires fresh production certification later.

---

# 19. PRODUCT VISION

InvestorIQ should not attempt to beat an institutional investment memo by adding more decoration or more pages.

The target is to beat ordinary automated property reports by combining:

> **institutional decision density**
>
> + **document-level auditability**
>
> + **deterministic financial intelligence**
>
> + **governed scenario analysis**
>
> + **source reconciliation**
>
> + **transparent missing-data handling**
>
> + **clean investment-committee presentation**

The long-term advantage is that a human institutional team may spend days assembling and reconciling a memo.

InvestorIQ’s ambition is to produce a defensible, source-grounded decision document rapidly and repeatably from the uploaded evidence.

---

# 20. DEFINITION OF ELITE

InvestorIQ Full Underwriting becomes ELITE when:

- the first pages clearly frame the investment case,
- strengths and risks are evidence-linked,
- operating economics are interpreted, not merely copied,
- transaction terms are structured,
- debt analysis is decision-useful,
- valuation is reconciled across evidence sources,
- scenario tables explain downside / upside mechanics without inventing facts,
- driver analysis identifies what moves the outcome,
- missing evidence creates transparent limitations rather than fake certainty,
- optional sections collapse cleanly,
- the Quality Manifest establishes trust,
- the report looks institutional without unnecessary decoration,
- Screening and Full Underwriting are unmistakably different products,
- no historical Acquisition terminology leaks into customer-facing output,
- no unsupported Blackstone-style assumption is added merely for sophistication,
- the final product feels like an investment-committee tool rather than an automated summary.

---

# 21. NEXT ACTION

**Next implementation task: ELITE-08 — Valuation & Reconciliation Upgrade.**

Build locally and preserve the already-proven ELITE stack.

Primary ELITE-08 objectives:
1. improve whole-property value framing using accepted T12 NOI and governed going-in cap rate,
2. compare implied value against accepted purchase price when both are available,
3. compare against source-backed appraisal value without allowing appraisal context to overwrite canonical operating truth,
4. make reconciliation differences decision-readable,
5. surface value/unit and material variance relationships where deterministic,
6. reuse governed ELITE-04 cap-rate sensitivity rather than inventing a second scenario authority,
7. collapse unsupported valuation surfaces cleanly,
8. do not add IRR, MOIC, hold-period, exit-cap, terminal-value, rent-growth, or other unsupported assumptions.

Acceptance must include:
- targeted ELITE-08 contract / renderer / wiring tests,
- cumulative ELITE-02→08 pipeline regression,
- valuation/reconciliation institutional regression,
- preservation of ELITE-06 and ELITE-07 regressions,
- institutional architecture,
- customer surface,
- boss contract,
- Source Truth authority,
- final PDF handoff,
- Gate 10V,
- syntax / diff integrity.

Do not deploy, push, invoke the worker, re-enable Cron, run a production RETEST, or change pricing unless separately authorized.

---

# 22. FINAL PRINCIPLE

The ELITE upgrade should make the reader feel:

> “I understand this property, I understand the evidence, I understand the numbers, I understand the uncertainty, and I know exactly what deserves my attention next.”

That is the standard.

**Build the report brain first. Dress it last.**
