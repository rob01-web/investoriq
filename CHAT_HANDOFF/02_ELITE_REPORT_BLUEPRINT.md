# InvestorIQ ELITE Report Blueprint

**Updated:** 2026-09-03
**Status:** Current report-design authority after Phase 8 certification
**Scope:** Screening and Underwriting product mission, information architecture, source discipline, visual quality, and acceptance criteria

## 1. Product family purpose

InvestorIQ turns uploaded property documents into two distinct but related investor products:

- `InvestorIQ Screening Report`
- `InvestorIQ Underwriting Report`

They must look like siblings, rely on the same source-governance system, and serve different decision depths.

The reports are not page-count products.

They are decision-support products whose length and content depend on available evidence.

## 2. Screening mission

Screening helps an investor narrow a shortlist.

The user should be able to review several Screening reports and quickly understand which properties deserve deeper attention and which asset or assets should advance to Underwriting.

A strong Screening report should make these questions easy to answer:

1. What property am I looking at?
2. What source documents support this report?
3. What does the operating picture show?
4. What are the strongest supported signals?
5. What are the biggest constraints?
6. Are T12 and Rent Roll evidence aligned?
7. Is there a meaningful rent-positioning opportunity?
8. What evidence gaps could materially change the screening view?
9. What should be investigated next?
10. Does this property warrant full Underwriting attention?

Screening should not provide unsupported investment advice or pretend that a missing Underwriting-level analysis exists.

## 3. Recommended Screening information architecture

Where supported by evidence, Screening should follow a stable decision path:

### A. Property and Evidence Orientation

- property identity
- as-of date
- source coverage
- evidence basis

### B. Screening Decision Cockpit

- strongest comparable operating metrics
- concise operating classification
- primary supported pressure point
- evidence quality signal

### C. Operating Evidence

- T12 gross potential rent where supported
- effective gross income where supported
- operating expenses where supported
- NOI where supported
- expense ratio where supported
- NOI margin where supported

### D. Rent Roll Evidence

- unit count
- occupied units
- occupancy
- annual in-place rent
- annual market rent
- gross rent gap

### E. Source Reconciliation

- T12 income scale versus Rent Roll income scale
- material variance where supported
- no inferred explanation when source evidence does not establish one

### F. Primary Upside Drivers

- supported only by accepted evidence
- ranked by decision relevance, not visual drama

### G. Primary Constraints

- supported only by accepted evidence
- focused on what could change the screening view

### H. Diligence Priorities

- concise list of the highest-value next questions
- explicit evidence gaps
- no fake completeness

### I. Source Transparency

- concise Source Register / Quality Manifest treatment appropriate to Screening
- Methodology and Data Transparency retained where useful

The current Phase 8 final Screening artifact includes a source-backed `Operating Evidence & Diligence Priorities` section and deliberate Methodology and Data Transparency end page.

## 4. Screening comparison doctrine

Separately generated Screening reports should be naturally comparable side by side.

Stable comparable fields should appear in predictable locations when evidence supports them.

Potential comparison fields include:

- property identity
- units
- occupancy
- T12 revenue
- EGI
- operating expenses
- NOI
- expense ratio
- in-place annual rent
- market annual rent
- rent gap
- source reconciliation status
- debt coverage when genuinely supported and appropriate to Screening
- primary upside drivers
- primary constraints
- material evidence gaps

Missing evidence should collapse cleanly.

Do not invent a numerical score merely to create a ranking surface.

## 5. Underwriting mission

Underwriting is the deeper institutional decision book.

It should help a serious investor, lender, acquisitions team, asset manager, or investment committee understand:

1. what the property is;
2. what the evidence proves;
3. what the operating economics show;
4. what transaction and debt terms imply;
5. what the major risks and constraints are;
6. which variables matter most;
7. how supported sensitivities change outcomes;
8. what remains unresolved;
9. what diligence would improve conviction;
10. why Underwriting provides materially more decision value than Screening.

## 6. Underwriting institutional architecture

The certified Underwriting architecture remains seven chapters.

### Chapter 1 - Investment Committee Overview

- executive investment summary
- key metrics
- committee overview
- underwriting observations
- primary constraint / review disclosure
- Evidence Conviction Matrix where evidence supports it

### Chapter 2 - Operating Performance

- institutional operating visuals
- unit mix and rent positioning
- operating-statement analysis
- revenue quality
- expense structure
- NOI and margin analysis
- rent-roll evidence
- market-rent context where supported
- source reconciliation

### Chapter 3 - Scenario & Underwriting Drivers

- base-case framing
- occupancy stress
- operating-expense stress
- cap-rate / value sensitivity where authorized
- combined driver views where supported
- underwriting driver analysis
- compound downside context
- scenario assumptions and evidence-class labels

Scenario outputs must never become source evidence.

### Chapter 4 - Transaction Context

- acquisition context
- supported transaction assumptions
- diligence context
- environmental context where supported
- no duplication with stronger ELITE surfaces

### Chapter 5 - Debt & Capital Structure

- current debt context
- proposed financing context
- current versus proposed debt coverage
- debt-service analysis
- DSCR sensitivity where supported
- maturity context
- debt-capacity interpretation
- capital-plan / reserve context
- renovation / CapEx source facts where supported

Current debt and proposed financing must remain clearly separate.

### Chapter 6 - Valuation & Reconciliation

- accepted-basis value indication
- purchase-price reconciliation
- accepted NOI and going-in cap-rate value framing
- appraisal context where supported
- cap-rate value sensitivity where authorized
- source reconciliation

Appraisal context must not silently override accepted operating or transaction facts.

### Chapter 7 - Source Appendix

- source limitations
- Source Register and document treatment
- Methodology and Data Transparency
- investor-facing Quality Manifest
- machine-readable authority where required by publication systems

## 7. Protected analysis boundaries

InvestorIQ may perform deterministic analysis from accepted facts when that analysis is explicitly authorized.

InvestorIQ may not invent:

- IRR
- MOIC
- DCF
- waterfall returns
- unsupported exit assumptions
- unsupported hold periods
- unsupported refinance analysis
- unsupported terminal values
- lender decisions
- BUY / SELL / HOLD recommendations
- market evidence not present in accepted sources

## 8. Source-boundary examples

### T12

Use for accepted operating-statement facts such as:

- GPR
- EGI
- operating expenses
- NOI

### Rent Roll

Use for accepted property-wide and unit-level facts such as:

- total units
- occupied / vacant units
- occupancy
- in-place rents
- market rents
- unit mix

A partial visible row excerpt must never override a verified property-wide total.

### Purchase / transaction assumptions

Use for transaction terms and proposed financing only where supported.

### Current debt

Use for existing debt facts and current coverage.

### Appraisal

Use as third-party valuation context unless a stronger authority explicitly adopts a specific appraisal fact for a governed calculation.

### Market survey

Use as market context only. Do not override Rent Roll market rents unless explicit source authority changes.

### Renovation plan

Use source-stated budget, scope, timing, and stated lifts as source facts. Do not invent ROI or value creation.

## 9. Visual system

The report family uses a white-first institutional visual direction.

Shared design principles:

- crisp white or near-white page surfaces
- restrained forest green accents
- restrained gold accents
- dark readable text
- strong but calm hierarchy
- generous yet efficient whitespace
- disciplined section headers
- compact tables
- charts only when they add decision value
- consistent numeric alignment
- consistent source notes
- print-safe page breaks

The old dark forest-green full-page Screening cover is not the current visual authority.

## 10. Product distinction

### Screening should feel

- faster
- tighter
- more comparative
- more scannable
- more triage-oriented
- decision-dense without becoming overwhelming

### Underwriting should feel

- deeper
- more spacious
- more explanatory
- more reconciliatory
- more scenario-oriented
- more like an institutional decision book

## 11. Customer-writing authority

Customer-facing prose should be concise, financially literate, natural, and evidence-specific.

Avoid:

- em dash punctuation
- en dash prose punctuation
- generic AI filler
- robotic transitions
- repetitive caveats
- internal engineering terms
- internal governance terms where customer language is available
- duplicated source limitations
- fake confidence
- promotional language

Preserve normal hyphens, mathematical negatives, ISO dates, and legitimate source-stated ranges.

## 12. Pagination doctrine

There is no fixed page count.

A shorter report can pass if it performs its job.

A longer report can pass if the evidence and analysis justify it.

A report fails visual acceptance if it contains:

- blank pages
- orphan headings
- near-empty pages caused by rigid layout
- excessive unused space without purpose
- clipped tables or charts
- tiny typography used to force pagination
- duplicated content used as filler

## 13. Blackstone benchmark doctrine

Blackstone remains a benchmark for:

- hierarchy
- information density
- professional restraint
- table discipline
- chart discipline
- transaction presentation
- sensitivity presentation
- decision orientation
- page rhythm

InvestorIQ must remain original.

Do not copy Blackstone branding, wording, proprietary analysis, or exact layouts.

InvestorIQ should ultimately be more transparent about evidence and better suited to document-driven underwriting workflows.

## 14. Phase 8 final artifact baseline

Certified final Phase 8 artifacts:

- Screening: 5 pages
- Underwriting: 18 pages

These are baselines for the next owner acceptance review, not permanent page targets.

The next chat should inspect these exact PDFs page by page before any new implementation is authorized.

## 15. Acceptance standard going forward

Do not call a report improvement complete because source code looks right or tests pass.

Relevant closure requires:

- source-truth preservation
- product-specific authority preservation
- focused regressions
- production build
- real handler-driven artifact generation
- real PDF rendering
- page-by-page visual inspection
- owner-level product acceptance

Historical detail remains preserved in `CHAT_HANDOFF/archived/` and should be consulted whenever this blueprint intentionally summarizes older work.
