# InvestorIQ Master Plan

**Updated:** 2026-09-04
**Current program state:** Phase 8 artifact integrity RECOVERED. Phase 8A Owner-Acceptance Recovery ACTIVE. Slices A and B CLOSED. Slice C IN PROGRESS.

## 1. Product mission

InvestorIQ is a document-driven real-estate decision-support system with two customer products:

- Screening
- Underwriting

The authority chain remains:

uploaded documents -> canonical Source Truth -> product analysis -> publication authority -> customer PDF -> exact-artifact validation -> delivery.

Do not create competing authority paths.

## 2. Immutable integrity authority

The exact Phase 8 artifact-integrity recovery is preserved at:

- branch: `internal-phase8-artifact-integrity-recovery-20260903`
- HEAD: `4e9d01648aeb7a0f0616f20d8a72264cbea13443`
- tree: `fa99e62e1e67fde1bb854e59f6cf0b46e142bec7`

Current owner-acceptance work occurs on:

`internal-phase8a-owner-acceptance-recovery-20260903-r1`

Never weaken the recovered property/source identity gates to make visual work pass.

## 3. Decision-first constitution

The first analytical page of each report must answer the report's primary customer decision immediately.

Permanent rules:

1. Decision first.
2. Facts before prose.
3. Prefer numbers, short labels, tables, matrices, compact charts, and one-line conclusions over paragraphs.
4. Never force a conclusion when evidence is insufficient.
5. Strategy classification is shown only to the precision supported by uploaded documents.
6. A material finding anywhere in the report must surface on the first analytical page if it could change the decision.
7. Investor-facing pages show the decision layer; detailed provenance remains available in the audit/source layer.

## 4. Screening mission

Screening answers:

> Is this property worth more of the investor's time and a full Underwriting review?

Its first analytical page is the `Screening Decision Snapshot`.

Permitted evidence-bound disposition states:

- `ADVANCE`
- `HOLD`
- `DO NOT ADVANCE`
- `INSUFFICIENT EVIDENCE`

Screening normally relies on T12 and/or Rent Roll core evidence. Therefore it must not infer purchase, rehab, financing, refinance, exit, or BRRRR strategy facts that are not present.

Where supported, Screening may classify the operating profile with concise labels such as:

- `STABILIZED`
- `LIGHT VALUE-ADD CANDIDATE`
- `INSUFFICIENT EVIDENCE`

A compact 2-3 analytical-page Screening report is desirable when the available evidence can be communicated without losing decision value. This is not a fixed page cap.

## 5. Underwriting mission

Underwriting answers:

> How should the investor pursue this property, on what basis, with what strategy, and what can kill the deal?

Its first analytical page is the `Investment Decision Snapshot`.

Where supported, it should surface transaction basis, operating economics, debt, value creation, capital plan, downside, negotiation leverage, closing conditions, and strategy fit.

Evidence-bound strategy classifications may include:

- `STABILIZED HOLD`
- `LIGHT VALUE-ADD HOLD`
- `MAJOR VALUE-ADD / REPOSITION`
- `REHAB / REFINANCE / HOLD`
- `SHORT-HOLD / RESALE`
- `INSUFFICIENT EVIDENCE`

Terms such as Buy & Hold or BRRRR may appear only as secondary comparable labels when uploaded transaction, capital, financing/refinance, and execution facts genuinely support them.

## 6. Source truth and non-invention

InvestorIQ may calculate deterministic arithmetic from accepted facts, but it may not create evidence.

Protected rules:

- T12 owns accepted operating-statement facts.
- Rent Roll owns accepted unit, occupancy, tenancy, in-place rent, and market-rent facts.
- Purchase/transaction assumptions remain distinct from operating source truth.
- Current debt remains distinct from proposed financing.
- Appraisal remains third-party valuation context unless a governed rule explicitly uses a stated appraisal fact.
- Market surveys remain context and do not silently override Rent Roll facts.
- Renovation plans remain source facts unless deterministic arithmetic is explicitly authorized.
- Scenario outputs never become source evidence.
- Missing facts are never gap-filled merely to complete a report surface.

## 7. Customer-facing information density

Customer-facing copy should be concise, financially literate, and immediately scannable.

Preferred order:

1. number or decision label;
2. short interpretation;
3. one-line implication if needed;
4. detailed explanation only when the reader genuinely needs it.

Avoid paragraphs when a table cell, badge, matrix, compact chart, or one-line observation communicates the same fact accurately.

Continue to prohibit customer-facing em dash punctuation, en dash prose punctuation, internal engineering jargon, repetitive caveats, generic AI filler, and fake certainty.

## 8. Page 2 visual doctrine

The first analytical page should look like an institutional editorial cockpit, not a SaaS dashboard and not one oversized card.

Use:

- a full-width decision band at the top;
- a dense but calm numeric grid/table in the middle;
- a small number of bottom decision panels for thesis, risks, conditions, negotiation leverage, or next action;
- strong typographic hierarchy;
- aligned financial figures;
- restrained forest green and gold;
- thin rules and subtle fills;
- almost no decorative chrome.

Avoid excessive rounded cards, shadows, pills, giant empty whitespace, and decorative charts.

## 9. DocRaptor / Prince publishing standard

DocRaptor must be treated as a professional publishing engine rather than a final conversion button.

Relevant Phase 8A capabilities to deliberately evaluate include:

- named pages;
- page-specific `@page` rules;
- running headers and footers;
- section-aware page furniture;
- widow/orphan control;
- deliberate break and keep behavior;
- page floats where useful;
- PDF bookmarks and internal navigation;
- page counters;
- full-bleed/specialty cover treatment;
- mixed orientation only for genuinely wide analytical content;
- vector SVG/chart output;
- professional table continuation behavior;
- print-quality typography and spacing.

The visual goal is an original InvestorIQ report family that exceeds a generic browser-printed memo and competes above the Blackstone benchmark on both appearance and decision usability.

## 10. Blackstone benchmark

Borrow institutional habits, not branding or proprietary content.

Key lesson:

> conclusion first, evidence second, explanation third.

Benchmark strengths to exceed:

- decision density;
- transaction tables;
- immediate key metrics;
- sensitivity matrices;
- charts that answer a decision question;
- professional restraint;
- page rhythm;
- investment-committee readability.

InvestorIQ should exceed Blackstone on source transparency, reconciliation, non-invention, and document-driven auditability.

## 11. Phase 8A current state

Slice A CLOSED:

- shared white-first cover family;
- forest-green Screening cover defect fixed;
- Underwriting gold-square collision fixed;
- Screening evidence-bound triage disposition introduced.

Slice B CLOSED:

- Underwriting executive page rebuilt into a decision-first investment summary;
- real Stonebridge artifact inspected and accepted as a materially stronger direction.

Slice C IN PROGRESS:

- capital-plan economics;
- market-survey synthesis;
- honest sensitivity framing;
- readiness/source wording;
- Screening decision-density repair;
- pagination/editorial compaction.

## 12. Report-length doctrine

No hard page count exists.

A shorter report is better when it communicates the same evidence and decision support more efficiently.

A longer report is acceptable when additional uploaded evidence and analysis earn the pages.

Forbidden:

- filler;
- duplicated narrative;
- shrinking typography to force page count;
- blank/near-empty pages;
- decorative charts without decision value;
- deleting supported analysis only to make a report shorter.

## 13. Production sequencing

The owner wants one deliberate synchronization to `main` and Vercel, not repeated production pushes.

GitHub already preserves current work. Do not use production deployment as a backup mechanism.

Preferred sequence:

1. finish Phase 8A;
2. generate the actual launch-path Screening and Underwriting PDFs;
3. validate exact property/source identity and exact hashes;
4. inspect every page at full resolution;
5. obtain owner acceptance of those exact files;
6. perform one deliberate `main` + Vercel production synchronization.

No migrations, scheduler changes, production Storage mutations, or Stripe changes belong to this report-design closeout.

## 14. Historical preservation

Root authority stays simple:

- `00_CURRENT_HANDOFF.md`
- `01_MASTER_PLAN.md`
- `02_ELITE_REPORT_BLUEPRINT.md`
- `03_FRESH_CHAT_PROMPT.md`
- `README.md`

Everything superseded is preserved under `CHAT_HANDOFF/archived/`. Never delete history merely to make the folder look cleaner.
