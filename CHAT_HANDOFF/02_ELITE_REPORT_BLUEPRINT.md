# InvestorIQ ELITE Report Blueprint

**Updated:** 2026-09-04
**Status:** Current report-design authority for Phase 8A Owner-Acceptance Recovery
**Scope:** Screening and Underwriting information architecture, decision density, source discipline, strategy classification, visual quality, DocRaptor publishing, and acceptance criteria

## 1. Product family purpose

InvestorIQ turns uploaded property documents into two related but distinct investor products:

- `InvestorIQ Screening Report`
- `InvestorIQ Underwriting Report`

They must share one premium visual family and one source-governance system while serving different decision depths.

The reports are decision-support products, not page-count products.

## 2. Core design doctrine

The first analytical page must answer the product's primary customer decision immediately.

Permanent hierarchy:

> conclusion first, evidence second, explanation third.

Permanent rules:

- decision first;
- facts before prose;
- no forced conclusions;
- strategy classifications are evidence-bound;
- material findings bubble upward to the first analytical page;
- detailed provenance remains available without dominating the investor-facing layer.

## 3. Screening mission

Screening helps an investor rapidly narrow a shortlist and decide whether a property deserves deeper Underwriting attention.

It should answer, in roughly 15-30 seconds on the first analytical page where evidence supports it:

- Should I advance this property?
- What is the single biggest reason?
- Is the property fundamentally healthy?
- Is there documented rent upside?
- Can I trust the operating story?
- What is most likely to waste my time?
- What exactly should happen next?

## 4. Screening Decision Snapshot

The first analytical page is the `Screening Decision Snapshot`.

Disposition values:

- `ADVANCE`
- `HOLD`
- `DO NOT ADVANCE`
- `INSUFFICIENT EVIDENCE`

If the source package does not safely support a disposition, show `INSUFFICIENT EVIDENCE`. Never manufacture a recommendation to avoid an empty field.

Where supported, the page should include:

### Decision band

- disposition;
- one-line primary reason;
- exact next action;
- Underwriting readiness.

### Operating snapshot

- units;
- occupancy;
- NOI;
- NOI margin;
- expense ratio;
- break-even occupancy / operating cushion.

### Rent and source snapshot

- annual in-place rent;
- annual market rent;
- gross rent gap dollars;
- gross rent gap percent;
- T12 versus Rent Roll consistency;
- material reconciliation variance.

### Bottom decision panels

Compact surfaces such as:

- `WHY IT MAY WORK`
- `WHAT CAN KILL IT`
- `NEXT ACTION`

Each should use bullets or one-line statements, not paragraphs.

## 5. Screening strategy boundary

Because Screening may be generated from only T12 and/or Rent Roll, it must not infer transaction strategies requiring facts that were not uploaded.

Permitted operating-profile labels, only when objectively supported, may include:

- `STABILIZED`
- `LIGHT VALUE-ADD CANDIDATE`
- `OPERATING PRESSURE`
- `INSUFFICIENT EVIDENCE`

Do not classify a Screening property as BRRRR, fix-and-flip, refinance, short-hold resale, or another transaction strategy unless the product requirements and source package are deliberately expanded in the future.

## 6. Screening report length

A high-quality Screening report may naturally compress to cover plus roughly 2-3 analytical pages if all material evidence is still represented.

This is not a contractual page cap.

Screening should be short because the decision is simple, not because evidence is hidden or deleted.

## 7. Underwriting mission

Underwriting helps the investor decide how to pursue the property, on what basis, with what strategy, and what can kill or materially reprice the deal.

The first analytical page should let an experienced investor understand the core transaction without hunting elsewhere in the memo.

## 8. Investment Decision Snapshot

The first analytical page is the `Investment Decision Snapshot`.

Where supported, it should surface 5-10 decision-critical items selected from:

### Current decision state

Examples:

- `PURSUE`
- `RECONCILIATION REQUIRED`
- `TERMS NEED REVISION`
- `MATERIAL DILIGENCE REQUIRED`
- `INSUFFICIENT EVIDENCE`

Avoid unsupported BUY/SELL/HOLD investment advice.

### Transaction / operating basis

- purchase price;
- price per unit;
- T12 NOI;
- occupancy;
- going-in cap rate;
- appraisal/valuation context where supported.

### Debt

- proposed loan;
- LTV;
- current DSCR;
- proposed DSCR;
- debt yield where supported;
- debt-service burden and material maturity/term issue where supported.

### Value creation

- documented rent gap;
- affected renovation units;
- stated capital plan;
- documented gross rent lift;
- capital timing;
- transparent simple arithmetic where useful and clearly labelled.

### Strategy fit

Evidence-bound classifications may include:

- `STABILIZED HOLD`
- `LIGHT VALUE-ADD HOLD`
- `MAJOR VALUE-ADD / REPOSITION`
- `REHAB / REFINANCE / HOLD`
- `SHORT-HOLD / RESALE`
- `INSUFFICIENT EVIDENCE`

Secondary shorthand such as Buy & Hold or BRRRR may be shown only when the uploaded purchase, capital, debt/refinance, and execution facts genuinely support that strategy.

### Decision panels

Compact surfaces such as:

- `INVESTMENT THESIS`
- `DEAL BREAKERS / NEGOTIATION LEVERS`
- `WHAT MUST BE TRUE`
- `NEXT ACTION`

## 9. Page 2 visual architecture

Do not place all meat-and-potatoes information inside one giant card.

Use a full-page institutional editorial composition:

1. **Top 15-20%:** full-width decision band.
2. **Middle 50-60%:** structured transaction/operating/debt/value-creation table or metric grid with strong numeric hierarchy.
3. **Bottom 20-30%:** two or three compact decision panels.

Visual rules:

- white / near-white page;
- restrained forest green and gold;
- thin rules rather than heavy boxes;
- subtle warm-gray or paper-toned fills;
- tabular numeric alignment;
- large key numbers, small labels;
- little or no paragraph prose;
- no oversized rounded SaaS cards;
- no drop-shadow dashboard chrome;
- no decorative pills or badges without meaning;
- no chart unless it answers a decision question;
- no empty whitespace that could carry important evidence.

The page should feel like a professionally typeset investment-committee memo, not a software dashboard printed to PDF.

## 10. Underwriting chapter architecture after the snapshot

The remainder of Underwriting exists to prove and deepen the Investment Decision Snapshot.

### Chapter 1 - Investment Committee Overview

- Investment Decision Snapshot;
- key metrics if not already represented;
- concise thesis / constraints;
- immediate diligence questions.

### Chapter 2 - Operating Performance

- operating visuals;
- unit mix and rent positioning;
- operating-statement analysis;
- revenue quality;
- expense structure;
- NOI and margin analysis;
- Rent Roll evidence;
- market-rent context;
- source reconciliation.

### Chapter 3 - Scenario & Underwriting Drivers

- base-case framing;
- occupancy stress;
- operating-expense stress;
- cap-rate / value sensitivity where authorized;
- compound downside context where supported.

Do not create a false #1/#2/#3 ranking across unlike shock magnitudes and unlike target outputs. Show comparable cases honestly and state the limits of comparison.

### Chapter 4 - Transaction Context

- acquisition context;
- supported transaction assumptions;
- diligence context;
- environmental context where supported.

### Chapter 5 - Debt & Capital Structure

- current debt;
- proposed financing;
- debt coverage;
- DSCR sensitivity where supported;
- maturity/term context;
- capital plan;
- renovation/CapEx economics from supported facts.

### Chapter 6 - Valuation & Reconciliation

- NOI/cap-rate consistency cross-check;
- purchase-price comparison;
- appraisal context;
- cap-rate sensitivity;
- source reconciliation.

If the going-in cap rate is itself a transaction input, do not present NOI divided by that cap rate as an independent valuation opinion. Label it as a consistency cross-check.

### Chapter 7 - Source Appendix

- concise Source Register;
- document treatment;
- Methodology and Data Transparency;
- Quality Manifest / exact-artifact transparency where useful.

## 11. Source-boundary authority

### T12

Use for accepted operating-statement facts such as GPR, EGI, operating expenses, and NOI.

### Rent Roll

Use for accepted property-wide and unit-level facts such as units, occupancy, in-place rent, market rent, and unit mix.

### Purchase / transaction assumptions

Use only for transaction terms and proposed financing supported by the uploaded source.

### Current debt

Keep current debt separate from proposed financing.

### Appraisal

Third-party valuation context unless a stronger rule explicitly authorizes a specific appraisal fact for a calculation.

### Market survey

Use as external context. It may be compared with Rent Roll market rents but must not silently replace them.

### Renovation plan

Use source-stated budget, scope, timing, affected units, and rent lift. Deterministic arithmetic from these facts may be shown when labelled accurately. Do not invent NOI lift, ROI, IRR, value creation, or refinance proceeds without the necessary inputs and authorized method.

## 12. Customer-writing authority

If a fact can be communicated accurately in a number, short label, table cell, matrix, chart, or one-line observation, do not turn it into a paragraph.

Paragraphs are reserved for nuance that cannot be reduced without losing meaning.

Continue to avoid:

- em dash punctuation;
- en dash prose punctuation;
- generic AI filler;
- robotic transitions;
- repetitive caveats;
- internal engineering terms;
- internal governance language where customer language works;
- fake confidence;
- promotional copy.

## 13. Blackstone benchmark doctrine

Blackstone remains a benchmark for:

- decision density;
- information hierarchy;
- professional restraint;
- transaction tables;
- charts and timelines;
- sensitivity matrices;
- investment-committee readability;
- page rhythm.

Do not copy Blackstone branding, wording, proprietary analysis, or exact layouts.

InvestorIQ should exceed the benchmark by combining equally strong decision presentation with superior source truth, reconciliation, provenance, and non-invention.

## 14. DocRaptor / Prince ELITE publishing doctrine

The final customer PDF should intentionally exploit the publishing capabilities available through DocRaptor/Prince rather than merely converting browser HTML.

Evaluate and use, when they improve the report:

- named page classes;
- dedicated cover / snapshot / chapter / appendix page rules;
- CSS margin boxes;
- running chapter or section headers;
- controlled footers and page counters;
- widow and orphan controls;
- keep-with-next and break control;
- repeated table headers and clean table continuation;
- page floats for charts/source notes where useful;
- PDF bookmarks and internal navigation;
- cross-references where they add value;
- full-bleed cover treatment where appropriate;
- mixed portrait/landscape orientation only for genuinely wide matrices;
- vector SVG and print-safe chart assets;
- professional font embedding and numeric typography.

The goal is to look like a purpose-built institutional publication and materially exceed a generic HTML-to-PDF output.

Chrome/headless rendering can remain a CI sanity check. Final owner acceptance should inspect the customer rendering path intended for launch.

## 15. Visual family

Screening and Underwriting must look like siblings.

Shared:

- white-first surfaces;
- restrained forest green and gold;
- same typographic family;
- same table language;
- same numeric hierarchy;
- same header/footer DNA;
- same source-note treatment;
- same print quality.

Different emphasis:

- Screening is faster, tighter, comparative, and triage-oriented.
- Underwriting is deeper, more analytical, and transaction/strategy oriented.

## 16. Acceptance standard

No report improvement closes because source code looks right or a smoke test passes.

Closure requires:

- source truth preserved;
- artifact identity preserved;
- focused regressions;
- production build;
- real handler/source-bound artifact generation;
- customer-path PDF rendering;
- exact hashes;
- page-by-page visual inspection;
- owner acceptance of the exact files.

Historical detail remains preserved in `CHAT_HANDOFF/archived/`.
