# InvestorIQ Phase 7 ELITE Report Design Authority

Date: 2026-09-01
Branch: `internal-phase7-elite-report-redesign-20260901`
Base authority: Phase 6 closure checkpoint `cebc8f4ea256ca067bf271797a3d266ceb46c37d`
Status: IN PROGRESS

## 1. Purpose

Phase 7 upgrades the customer-facing Screening and Underwriting reports to an institutional decision-document standard without weakening the source-truth, publication, security, commerce, worker, or lifecycle authorities closed in Phases 1 through 6.

The redesign is a presentation and evidence-composition upgrade. It is not authority to invent new underwriting facts or unsupported financial modeling.

## 2. Dynamic evidence-driven pagination

InvestorIQ does not hardcode page counts.

The commonly discussed 4 to 6 page Screening range and 15 to 20 page Underwriting range are design reference ranges only. They are not minimums, maximums, caps, truncation rules, padding targets, or pagination formulas.

The uploaded evidence determines the report. The page count does not determine the evidence.

Therefore:

- strong core-only reports may be shorter;
- optional-rich reports may be longer;
- supported analysis is never removed merely to meet a page target;
- filler is never generated merely to reach a page target;
- unsupported optional sections are omitted or collapsed according to existing source authority;
- tables and charts are never compressed beyond readability to force a page target;
- blank or near-empty pages are not intentionally manufactured.

## 3. Canonical report identities

Customer-facing identities remain:

- `InvestorIQ Screening Report`
- `InvestorIQ Underwriting Report`

Phase 7 may use decision-document language for section architecture, such as Decision Cockpit, Evidence Conviction Matrix, What Changes the Decision, and Trust Ledger. It does not rename the canonical products.

## 4. Screening design doctrine

Screening is a fast institutional decision brief. It should answer the first-pass capital triage question with unusually high signal density.

Its design priorities are:

- immediate property and source orientation;
- clear operating classification and primary pressure point;
- compact Decision Cockpit treatment of already-authorized metrics;
- ranked deterministic drivers;
- source reconciliation where material;
- concise evidence coverage and limitations;
- visually strong but restrained charts and tables;
- minimal repetition.

Screening remains distinct from Underwriting. It is not a shortened Underwriting report.

## 5. Underwriting design doctrine

Underwriting is an institutional decision book. Its design priorities are:

- strong opening decision orientation;
- clear separation of operating, transaction, debt, valuation, scenario, diligence, and source-trust evidence;
- visual reconciliation where competing source values require explanation;
- evidence-weighted scenario and sensitivity displays only where already authorized by the analytical contract;
- capital and debt context timelines only when source-backed dates and terms exist;
- source-backed asset/location context only when provided evidence supports it;
- a premium Trust Ledger / source transparency ending rather than engineering-language disclosure;
- generous hierarchy and visual rhythm without unnecessary whitespace or forced page breaks.

## 6. Blackstone benchmark doctrine

The Blackstone DHL Tsing Yi Investment Memorandum is a communication and design benchmark, not an analytical authority.

Phase 7 may learn from its:

- immediate visual orientation;
- map/location framing;
- concise situation overview;
- transaction-term presentation;
- milestone timeline;
- market charts;
- sensitivity presentation;
- visual hierarchy;
- section pacing;
- whitespace discipline.

InvestorIQ does not copy Blackstone branding, layouts, proprietary language, assumptions, or unsupported metrics.

Blackstone sample content does not authorize InvestorIQ to produce IRR, MOIC, DCF, waterfall returns, exit-cap analysis, terminal value, hold-period returns, renovation ROI/payback, lender approval, or unsupported recommendations.

## 7. Source-truth supremacy

All Phase 7 surfaces remain subordinate to the existing source-truth and customer-surface authorities.

A design surface may only display information that the existing report contract has already authorized for customer display.

Optional evidence surfaces are evidence-gated. Missing optional evidence does not create invented substitute assumptions.

The minimum-core survival doctrine remains unchanged: a sufficient T12 or a sufficient Rent Roll can support publication according to the closed Phase 1 through Phase 6 authority.

## 8. Presentation-layer safety

The initial Phase 7 shared presentation layer is intentionally semantics-preserving.

It may:

- add CSS;
- add HTML classes and non-customer data attributes;
- improve hierarchy, spacing, table treatment, chart framing, cover styling, metric density, and print readability;
- label an already-existing executive decision block visually through styling.

It may not:

- add facts;
- add financial values;
- add unsupported sections;
- calculate new metrics;
- change source precedence;
- change customer-visible numerical values;
- change core validity;
- alter publication authority;
- create a hardcoded page-count target.

## 9. Planned ELITE surfaces

Phase 7 targets, subject to evidence and analytical authority, include:

- Decision Cockpit;
- Breakpoint Engine;
- source reconciliation waterfall;
- resilience heatmaps;
- evidence-weighted sensitivity / tornado views;
- Evidence Conviction Matrix;
- What Changes the Decision;
- source-backed asset/location spread;
- capital/debt timeline;
- Trust Ledger;
- stronger visual rhythm and premium institutional tables/charts.

A named target is not authorization to fabricate the underlying data required to render it.

## 10. Production freeze

During Phase 7 certification:

- no merge to `main`;
- no production deployment;
- no production migration;
- no scheduler activation;
- no production Storage cleanup;
- DocRaptor remains test-only unless a separate explicit authority changes that state.

## 11. Exit criteria

Phase 7 is not closed merely because static tests pass.

Closure requires:

1. report-design contract QA passes;
2. inherited source/publication/customer-surface regression remains green except already-governed launch blockers;
3. production build passes;
4. real report artifacts are generated in non-production/test mode across materially different evidence shapes;
5. PDFs are visually inspected for hierarchy, readability, natural pagination, evidence gating, blank pages, overflow, unsupported content, and report-family distinction;
6. no forbidden analytical outputs are introduced;
7. production remains untouched.

Until those conditions are satisfied, Phase 7 remains open.
