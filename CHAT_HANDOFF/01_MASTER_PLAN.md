# InvestorIQ Master Plan

**Updated:** 2026-09-03
**Current program state:** Phase 8 CLOSED / CERTIFIED. Post-Phase-8 report acceptance audit NEXT.

## 1. Operating doctrine

InvestorIQ is a document-driven real-estate analysis product with two current customer lanes:

- Screening
- Underwriting

The project must preserve one authority chain from uploaded evidence through canonical Source Truth, product analysis, publication authority, generated PDF, Quality Manifest, and customer delivery.

Do not create competing authority paths for convenience.

## 2. Current safety locks

Unless the owner explicitly authorizes otherwise:

- do not merge to `main`;
- do not deploy production;
- do not apply Supabase migrations;
- do not activate or alter the scheduler;
- do not mutate production Storage;
- do not invoke production workers for exploratory validation;
- do not make Stripe or pricing changes during report-design work;
- keep DocRaptor production activation separate from design work.

## 3. Current branch authority

- Repository: `rob01-web/investoriq`
- Current isolated branch: `internal-phase8-elite-customer-facing-visual-authority-20260902`
- Final Phase 8 certified HEAD: `43731914702a34a13b7dd0ceabb3fdecae337f10`
- Final Phase 8 run: `33695177993`
- Final Phase 8 job: `100462403978`
- Result: PASS

## 4. Phase history doctrine

Earlier phases remain closed unless fresh contradictory evidence proves a real defect.

Do not restart broad repository or pipeline audits simply because a visual or wording issue appears.

Classify every new finding as one of:

1. real production or product defect;
2. stale test or stale presentation assumption;
3. design gap;
4. owner preference or product-positioning change;
5. evidence limitation that should be disclosed rather than repaired.

Then fix the smallest authoritative seam that actually owns the issue.

## 5. Canonical pricing

- Screening: $199
- Underwriting: $499
- Bundle: 2 Screening + 1 Underwriting for $699

Commerce authority previously established canonical server-side pricing, active Stripe prices, exact quantity and bundle allocation, idempotent entitlement grants, promotion handling, replay/race handling, verified success messaging, and server-sourced UI pricing.

Do not mix report-design work with commerce changes unless a real cross-boundary defect is proven.

## 6. Core-gated publication constitution

Canonical source modes:

- `dual_source_core`
- `t12_minimum_core`
- `rent_roll_minimum_core`
- `insufficient_core`

The first three may preserve a publication obligation when delivery authority permits it.

Optional source defects should:

- qualify a conclusion;
- collapse a section;
- omit an unsupported surface;
- or appear as a quality incident.

They should not destroy a valid-core report.

`insufficient_core` remains publication-ineligible.

## 7. Source truth doctrine

InvestorIQ may derive analysis from accepted canonical facts, but it may not pretend evidence is stronger than the uploaded and adjudicated source package supports.

Protected rules:

- T12 remains authoritative for supported operating-statement facts;
- Rent Roll remains authoritative for supported unit, occupancy, in-place-rent, market-rent, and tenancy facts;
- transaction assumptions remain distinct from operating source truth;
- current debt remains distinct from proposed financing;
- appraisal remains third-party valuation context unless specifically accepted for a governed purpose;
- market surveys remain context and must not silently override property Rent Roll facts;
- renovation plans remain source facts unless an authorized deterministic analysis is explicitly built from them;
- scenario outputs never become source evidence.

## 8. Screening product doctrine

Screening is a capital-triage product for comparing a shortlist of properties and deciding which deserve deeper Underwriting.

It must be:

- fast to scan;
- evidence-backed;
- comparison-friendly;
- concise without being thin;
- explicit about evidence gaps;
- useful enough to justify its $199 price.

Screening should surface stable comparable fields where evidence supports them, including operating metrics, rent-roll positioning, source reconciliation, upside drivers, constraints, and diligence priorities.

It must not manufacture a proprietary score simply to make the report feel more complete.

## 9. Underwriting product doctrine

Underwriting is the deeper institutional decision book.

It should provide materially more value than Screening through supported:

- executive decision framing;
- operating analysis;
- rent-roll analysis;
- source reconciliation;
- transaction context;
- debt and capital structure;
- scenario analysis;
- underwriting driver analysis;
- valuation and reconciliation;
- diligence context;
- Source Register;
- Methodology and Data Transparency;
- Quality Manifest.

No unsupported IRR, MOIC, DCF, waterfall, exit-cap, terminal-value, refinance, lender-decision, or BUY/SELL/HOLD output may be invented.

## 10. Report-length doctrine

There is no contractual page target for either product.

Evidence and decision usefulness determine length.

Forbidden shortcuts:

- filler to increase page count;
- deleting supported content to reduce page count;
- shrinking typography to force a page count;
- decorative charts with no decision value;
- duplicated narrative to create visual density;
- blank or near-empty pages created by rigid pagination.

## 11. Customer-facing writing doctrine

Customer-facing report prose should contain:

- no em dash punctuation;
- no en dash used as prose punctuation;
- no internal parser/runtime/worker language;
- no generic AI-sounding filler;
- no repetitive qualification language that adds no value;
- no engineering or governance jargon where natural customer language works better.

Normal hyphens, mathematical minus signs, ISO dates, and legitimate source-stated numeric ranges remain valid.

## 12. Shared visual family doctrine

Both reports must clearly belong to InvestorIQ.

Shared visual direction:

- white-first page surfaces;
- restrained forest green;
- restrained gold;
- dark readable text;
- institutional type hierarchy;
- disciplined spacing;
- consistent cards, tables, charts, evidence notes, headers, and footers;
- high print readability.

Product distinction remains intentional:

- Screening: tighter, faster, more comparative, more triage-oriented;
- Underwriting: deeper, more explanatory, more spacious, more scenario and reconciliation oriented.

## 13. Phase 8 closure authority

Phase 8 closed only after:

- focused authority tests;
- sealed-lane regressions;
- inherited Phase 7 design regressions;
- production build;
- real handler-driven HTML generation;
- customer-facing artifact validation;
- headless Chrome PDF generation;
- artifact hashing;
- artifact upload;
- page-by-page human visual inspection;
- cleanup of temporary repair machinery;
- one final permanent certification from the cleaned branch.

The final certified PDFs are 5 pages for Screening and 18 pages for Underwriting.

## 14. Next program gate

The next activity is not automatically Phase 9.

First conduct a post-Phase-8 owner acceptance audit of the actual final PDFs.

That audit should determine:

- whether Screening is sufficiently valuable and decision-dense;
- whether Underwriting is visually and analytically convincing enough;
- whether the reports truly feel like one premium family;
- whether any customer-facing copy still feels artificial or repetitive;
- whether tables, charts, spacing, hierarchy, and page rhythm meet launch expectations;
- whether any remaining issue warrants another implementation phase.

No code edits should begin until those findings are recorded and prioritized.

## 15. Historical preservation

The complete historical program record remains in `CHAT_HANDOFF/archived/`.

Current root files summarize present authority. They do not supersede or erase detailed historical records.

When uncertainty exists, consult the archived checkpoint that established the relevant authority rather than reconstructing it from memory.
