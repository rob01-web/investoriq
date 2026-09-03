# InvestorIQ Fresh-Chat Continuation - 2026-09-03

Treat the following files in `CHAT_HANDOFF/` as the current authority:

1. `00_CURRENT_HANDOFF.md`
2. `01_MASTER_PLAN.md`
3. `02_ELITE_REPORT_BLUEPRINT.md`

Historical detail is preserved under `CHAT_HANDOFF/archived/`. Do not delete or overwrite historical handoffs.

## Current Git authority

- Repository: `rob01-web/investoriq`
- Working branch: `internal-phase8-elite-customer-facing-visual-authority-20260902`
- Final Phase 8 certified HEAD: `43731914702a34a13b7dd0ceabb3fdecae337f10`
- Final permanent certification run: `33695177993`
- Final job: `100462403978`
- Result: PASS

Phase 8 is CLOSED / CERTIFIED.

Do not merge `main`, deploy production, apply migrations, activate the scheduler, mutate production Storage, or make other production changes unless Rob explicitly authorizes them.

## Final Phase 8 artifact baseline

The final certified PDFs are:

- Screening: 5 pages
- Underwriting: 18 pages

Final PDF hashes:

- Screening: `b895f2a84c2fc66eeb1f500b51ea53ebf016995d951af9137d6d3a4d0f22fd80`
- Underwriting: `ae9cada885f4a5624b73ca897842542b156f4fb7647062467992ed66b959caa5`

Phase 8 certification passed source-reconciliation authority, customer-facing authority, Screening sealed-lane regressions, Underwriting final-polish regression, Phase 7 design regressions, production build, real handler-driven HTML generation, real customer-surface validation, Chrome PDF rendering, artifact hashes, upload, cleanup, and page-by-page visual inspection.

## FIRST TASK IN THIS CHAT

Do not edit code yet.

Start with a deep, owner-level review of the two newly generated Phase 8 PDFs.

Rob will upload:

1. the final Phase 8 Screening PDF;
2. the final Phase 8 Underwriting PDF.

Review BOTH reports page by page and then compare them against each other as one product family.

### Screening deep dive

Remember the product mission:

Screening costs $199 and is meant to help an investor take a shortlist of candidate properties, quickly identify the strongest and weakest opportunities, and decide which property or properties deserve a full $499 Underwriting report.

Ask:

- Does the report contain enough useful decision information?
- Is it too sparse anywhere?
- Does it make the operating picture easy to understand?
- Are the T12 and Rent Roll signals clear?
- Is source reconciliation useful and understandable?
- Are upside drivers and constraints obvious?
- Are the diligence priorities actually helpful?
- Could a user compare several Screening reports side by side?
- Does the report feel worth $199?
- Does any section feel like filler or methodology overhead?
- Are charts or tables missing where a visual would materially improve triage?
- Does the white-first Phase 8 visual system feel premium?

### Underwriting deep dive

Ask:

- Does this genuinely feel like an institutional decision book?
- Is the information hierarchy strong enough?
- Is every page earning its place?
- Are any pages too sparse or too dense?
- Are charts and tables visually useful and correctly placed?
- Is source reconciliation clear?
- Are current debt and proposed financing clearly separate?
- Are scenarios clearly distinguished from source evidence?
- Is valuation context clear and appropriately qualified?
- Are the Source Register, Methodology, and Quality Manifest polished enough?
- Is there repetitive qualification language that could be simplified?
- Does anything still look like a technical validation packet rather than an investor report?

### Full anti-AI / customer-copy sweep

Perform a HUMAN review even though automated Phase 8 gates passed.

Look for:

- em dash punctuation;
- en dash prose punctuation;
- robotic phrasing;
- generic AI-sounding filler;
- repetitive disclaimers;
- internal engineering terminology;
- internal governance terminology;
- awkward transitions;
- duplicated caveats;
- wording that does not sound like a premium institutional report.

Do not modify source-stated mathematics, ISO dates, valid hyphens, or legitimate negative signs.

### Visual family comparison

The two products should clearly feel like siblings.

Shared direction:

- crisp white-first surfaces;
- restrained forest green and gold;
- consistent typography;
- consistent tables and charts;
- consistent section hierarchy;
- consistent page furniture and source transparency.

Screening should feel faster and more comparative.

Underwriting should feel deeper and more explanatory.

### Blackstone benchmark

Where useful, compare the reports against the Blackstone-style institutional qualities we have been targeting:

- decision density;
- hierarchy;
- restraint;
- chart/table discipline;
- page rhythm;
- investment-committee readability.

Do not copy Blackstone branding or proprietary content.

## Required output from the first review

Before proposing implementation, produce:

1. an overall verdict for Screening;
2. an overall verdict for Underwriting;
3. a page-by-page defect / opportunity register for Screening;
4. a page-by-page defect / opportunity register for Underwriting;
5. a cross-product visual-family comparison;
6. a complete customer-copy / anti-AI findings list;
7. a prioritized list of MUST FIX, SHOULD FIX, and OPTIONAL enhancements;
8. a recommendation on whether a new implementation phase is actually warranted.

Do not call the reports launch-ready simply because Phase 8 certification passed. Phase 8 proves the implemented authority and artifact wall. This fresh-chat review is the owner acceptance and product-quality deep dive.

BOOOOOOOOOOOOOOOOOOM.
