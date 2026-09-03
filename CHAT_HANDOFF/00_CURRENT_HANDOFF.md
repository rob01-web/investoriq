# InvestorIQ Current Handoff

**Updated:** 2026-09-03
**Status:** Phase 8 CLOSED / CERTIFIED. Post-Phase-8 owner acceptance and report deep dive NEXT.

## 1. Governing Git checkpoint

- Repository: `rob01-web/investoriq`
- Current isolated branch: `internal-phase8-elite-customer-facing-visual-authority-20260902`
- Final Phase 8 certified branch HEAD: `43731914702a34a13b7dd0ceabb3fdecae337f10`
- Phase 8 cleanup checkpoint: `0e1cdaf59a9875db7862948562118ee70c9dfa3c`
- Final permanent certification workflow run: `33695177993`
- Final certification job: `100462403978`
- Result: PASS
- `main`: untouched by Phase 8
- Production: untouched by Phase 8

Do not merge `main`, deploy production, apply migrations, activate the scheduler, mutate production Storage, or make other production changes without explicit owner authorization.

## 2. Phase 8 closure

Phase 8 ELITE Customer-Facing Visual Authority is CLOSED and CERTIFIED on the isolated branch.

The permanent final wall passed:

- Phase 8 source-reconciliation authority
- Phase 8 customer-facing authority
- Screening sealed-lane regressions
- Screening report regression
- Underwriting final-polish regression
- Phase 7 ELITE report design regression
- Phase 7 decision-support regression
- production build
- handler-driven authoritative HTML generation
- customer-facing HTML validation
- headless Chrome PDF rendering
- SHA-256 recording
- artifact upload
- page-by-page visual inspection

Final certified artifacts:

- Screening: 5 pages
- Underwriting: 18 pages

Final hashes:

- Screening HTML: `fd81cc6bddc6a39a3ff608fa27ab9916fd9c3b5d480acc7eedeeccc646e6c55d`
- Screening PDF: `b895f2a84c2fc66eeb1f500b51ea53ebf016995d951af9137d6d3a4d0f22fd80`
- Underwriting HTML: `c24d7001d5ad10114f6e8405810a0600e78524542e08345da20713c6c245065e`
- Underwriting PDF: `ae9cada885f4a5624b73ca897842542b156f4fb7647062467992ed66b959caa5`
- Phase 8 visual authority manifest: `5a682966242bb586cd2cd7793df87280d3fc46ddd22ada6c47fff5a85201ee63`

Important Phase 8 repairs proven by the final wall:

- partial visible rent-roll rows can no longer override a verified property-wide annual total;
- Screening is source-bound to validated T12 and Rent Roll artifacts;
- Screening includes source-backed `Operating Evidence & Diligence Priorities`;
- Underwriting reconciliation is validated against the actual bounded table row;
- Screening `Methodology & Data Transparency` is a deliberate final page rather than an orphaned subsection;
- the colliding legacy Screening fixed print footer is suppressed in print;
- temporary Phase 8 bootstrap and repair machinery was removed before final certification.

## 3. Immediate next move

Start a fresh chat with a READ-ONLY deep dive into the two final Phase 8 PDFs before changing any code.

The purpose of the deep dive is not to prove that the certification wall passed. It already did.

The purpose is owner-level product acceptance:

1. inspect every Screening page at full resolution;
2. inspect every Underwriting page at full resolution;
3. judge whether the reports are visually premium enough;
4. judge whether Screening provides enough decision value for its $199 role;
5. judge whether Underwriting feels like a true institutional decision book;
6. compare the two reports as one InvestorIQ family;
7. perform another human copy sweep for robotic or AI-associated language, including any dash punctuation that might somehow have escaped automated gates;
8. identify any remaining visual, wording, density, chart, table, hierarchy, or product-utility issues;
9. classify findings before deciding whether another implementation phase is warranted.

Do not edit code until the owner acceptance audit is complete and findings are ranked.

## 4. Screening mission

Screening is not a cheap short report and not a mini Underwriting report.

Its job is to help a user take a shortlist of candidate properties, quickly identify the strongest opportunities and biggest concerns, and decide which asset or assets deserve full Underwriting.

A good Screening report should answer:

- What is this property?
- What source evidence did InvestorIQ receive?
- What does the operating picture look like?
- What are the strongest supported signals?
- What are the primary constraints?
- Are T12 and Rent Roll evidence aligned or materially different?
- What could materially change the screening view?
- What evidence remains missing?
- Is deeper Underwriting attention justified?

There is no fixed Screening page count. Decision usefulness and evidence determine length.

## 5. Underwriting mission

Underwriting is the deeper institutional decision book.

It should provide materially greater decision value than Screening through supported operating analysis, reconciliation, transaction context, debt and capital structure, scenario analysis, valuation, diligence, source transparency, and quality-manifest authority.

There is no fixed Underwriting page count.

Do not add filler to make a report longer and do not suppress legitimate supported analysis to make it shorter.

## 6. Pricing authority

Current canonical pricing remains:

- Screening: $199
- Underwriting: $499
- Bundle: 2 Screening + 1 Underwriting for $699

Phase 4 commerce authority previously closed the canonical server catalog, Stripe price authority, quantity and bundle allocation, atomic/idempotent entitlement grants, promotion handling, server-verified success messaging, and server-sourced UI pricing. Do not casually reopen that work during report review.

## 7. Source and publication doctrine

Core-gated publication remains authoritative.

Canonical core modes:

- `dual_source_core`
- `t12_minimum_core`
- `rent_roll_minimum_core`
- `insufficient_core`

The first three may preserve a publication obligation when delivery authority permits it. Optional-document defects should qualify, collapse, omit, or create a quality incident rather than destroying a valid-core report.

Never invent facts, assumptions, market evidence, IRR, MOIC, DCF, waterfall returns, refinance conclusions, BUY/SELL/HOLD recommendations, or unsupported lender decisions.

## 8. Customer-facing writing doctrine

Customer-facing report copy should contain no em dash punctuation and no en dash used as prose punctuation.

Also remove or avoid:

- generic AI-sounding filler;
- robotic transitions;
- repetitive disclaimers;
- internal engineering terminology;
- internal governance language where a natural customer phrase exists;
- fake certainty;
- duplicated narrative that adds no decision value.

Preserve normal hyphens, mathematical negative signs, ISO dates, and legitimate source-stated ranges.

## 9. Visual family doctrine

Screening and Underwriting must look like siblings in one premium InvestorIQ report family.

Shared direction:

- crisp white-first surfaces;
- restrained forest green and gold accents;
- institutional typography;
- disciplined spacing;
- consistent tables and charts;
- consistent section hierarchy;
- consistent source transparency;
- print-safe pagination.

Screening should feel faster, tighter, more comparative, and more triage-oriented.

Underwriting should feel deeper, more explanatory, more scenario-oriented, and more like an institutional decision book.

## 10. Historical preservation

Do not delete historical handoff files.

`CHAT_HANDOFF/archived/` is the immutable history of prior checkpoints, including the detailed August ELITE work. The current root files are navigation and current authority, not replacements for the historical record.

If a current summary appears to omit an old detail, consult the archive rather than guessing.

BOOOOOOOOOOM.
