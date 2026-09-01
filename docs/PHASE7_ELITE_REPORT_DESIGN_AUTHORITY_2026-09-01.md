# InvestorIQ Phase 7 ELITE Report Design Authority

Date: 2026-09-01
Branch: `internal-phase7-elite-report-redesign-20260901`
Base authority: Phase 6 closure checkpoint `cebc8f4ea256ca067bf271797a3d266ceb46c37d`
Certified implementation checkpoint: `fc0c82279e5dd4a48f68a259eebe5486acb03227`
Certification workflow run: `33569561301` (run 28)
Certification artifact: `phase7-visual-certification-fc0c82279e5dd4a48f68a259eebe5486acb03227`
Status: CLOSED / CERTIFIED

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

The Phase 7 shared presentation layer is semantics-preserving.

It may:

- add CSS;
- add HTML classes and non-customer data attributes;
- improve hierarchy, spacing, table treatment, chart framing, cover styling, metric density, and print readability;
- label an already-existing executive decision block visually through styling;
- collapse an empty optional presentation shell;
- release or protect page breaks to prevent blank, near-empty, or orphaned customer pages without deleting evidence;
- normalize obsolete Screening identity strings to the canonical `InvestorIQ Screening Report` identity;
- normalize customer-facing dash punctuation without changing meaning.

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

## 9. ELITE surfaces

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

Phase 7 certification did not authorize or perform:

- merge to `main`;
- production deployment;
- production migration;
- scheduler activation;
- production Storage cleanup.

DocRaptor remains test-only unless a separate explicit authority changes that state.

## 11. Closure certification

Phase 7 earned closure on the isolated branch after the real-artifact wall and direct page-by-page visual certification of the final authoritative PDFs.

Certified implementation checkpoint:

`fc0c82279e5dd4a48f68a259eebe5486acb03227`

GitHub Actions certification:

- workflow: `InvestorIQ Phase 7 ELITE Report Certification`;
- run number: `28`;
- run ID: `33569561301`;
- result: PASS;
- design authority: PASS;
- decision-support authority: PASS;
- Screening sealed-lane regression: PASS;
- Screening report regression: PASS;
- Underwriting final-polish regression: PASS;
- production build: PASS;
- current-branch real-render HTML artifacts: PASS;
- headless-Chrome PDF render: PASS;
- visual artifact upload: PASS.

Authoritative artifact set:

`phase7-visual-certification-fc0c82279e5dd4a48f68a259eebe5486acb03227`

Authoritative visual lanes:

- Screening: Harbourstone handler-driven Screening render;
- Underwriting: Stonebridge source-authority handler-driven Underwriting render.

Final evidence-driven PDFs inspected page by page:

- Screening: 4 pages;
- Underwriting: 18 pages.

The page counts are outcomes of the evidence and layout, not contractual targets.

Final visual certification confirmed:

- no blank pages;
- no near-empty pagination artifacts requiring repair;
- no orphan section headings;
- no clipped content;
- no overflowing tables or charts;
- Evidence Conviction Matrix present where source-domain evidence supports it;
- Matrix evidence gating remains strict and unchanged;
- What Changes the Decision remains absent when both governed driver inputs are not present;
- Screening and Underwriting remain visually and analytically distinct;
- canonical `InvestorIQ Screening Report` identity is used on the Screening customer surface;
- obsolete `Capital Intelligence Memorandum` Screening identity is absent from the authoritative Screening artifact;
- no unsupported Phase 7 analytical outputs were introduced;
- no customer-visible literal or encoded em dash or en dash punctuation is present in the authoritative artifacts;
- source transparency and Quality Manifest surfaces remain present;
- production remained untouched.

The original Stonebridge blocker `PHASE7_EVIDENCE_MATRIX_MISSING:underwritingStonebridge` was traced to the real V2 executive title `Executive Investment Summary`, which was not recognized by the fallback Matrix insertion seam. The fix expanded that insertion seam to recognize the governed V2 title while retaining the existing minimum-domain evidence gate. A negative regression proves that insufficient-domain reports still do not receive a Matrix.

Visual inspection found and repaired real PDF defects that static tests did not catch, including blank Screening pagination, an empty Screening support shell, Underwriting orphan headings, a duplicate nested cap-rate heading, and near-empty chapter-boundary pages. These repairs changed presentation flow only and did not remove supported evidence to force a page count.

A final independent visual pass after the earlier run 22 closure note identified two residual Stonebridge whitespace defects: a sparse page created by the Scenario chapter boundary after the whole-property value context, and a sparse source-appendix ending caused by a forced Quality Manifest page break. The final Phase 7 presentation guards now allow the Scenario chapter to flow after a short operating tail and allow Quality Manifest to use available source-appendix space. Both changes are presentation-only. The authoritative Stonebridge report naturally compacted from 20 pages to 18 pages with all supported evidence retained.

The final Screening pass identified a customer-facing identity and punctuation defect that the prior HTML gate did not catch: the browser/footer surface still used the obsolete `Capital Intelligence Memorandum` label and the cover footer rendered an HTML-encoded em dash. The Screening sealed lane now normalizes those strings to the canonical `InvestorIQ Screening Report` identity and ASCII-safe punctuation. The real-artifact wall was strengthened to reject both literal and HTML-encoded em dash/en dash punctuation and to require the canonical Screening identity while rejecting the obsolete label.

## 12. Exit criteria result

Phase 7 closure criteria are satisfied:

1. report-design contract QA passes;
2. inherited source/publication/customer-surface regression remains green within this wall;
3. production build passes;
4. real report artifacts were generated in non-production/test mode across the authoritative Screening and Underwriting lanes;
5. both final PDFs were visually inspected page by page for hierarchy, readability, natural pagination, evidence gating, blank pages, overflow, unsupported content, punctuation, identity, and report-family distinction;
6. no forbidden analytical outputs were introduced;
7. production remained untouched.

**Phase 7 is CLOSED / CERTIFIED.**
