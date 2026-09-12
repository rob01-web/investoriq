# InvestorIQ Current Handoff


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
**Current phase:** Underwriting Editorial + Analytical ELITE Closeout  
**Working branch:** `internal-underwriting-editorial-analytical-elite-20260906-r1`

Current handoff documentation commit: `d7b6965214729dc3434cc095861d4d1f168659bf`  
Certified deployed product commit: `c07c1da8cef64fab95f825746bddecb03c1b14e8`

## 1. Governing Git authority

Provider-certified Visual ELITE Step 6 restore point:

`f6066397b623a35391765c17214000a7628a1615`

Recovery checkpoint:

`c595fcaca1e8c23482c6fa527a798f5ee24881e6`

The current repair branch is isolated from `main` and begins from the provider-certified Visual ELITE authority plus the September 6 editorial/analytical handoff archive.

## 2. Current status

### CLOSED / final Underwriting certification

Fresh certification commit `94dc287ca56f4b7239658407c119bd2123140050` passed GitHub Actions run `34267290022` (job `102199741543`). Canonical QA, all Underwriting regressions, institutional PDF diagnostics, production build, fresh HTML generation, deterministic HTML validation, Chromium rendering, rendered-PDF validation, metadata, and evidence upload all passed.

Fresh artifact: `underwriting-final-certification-94dc287ca56f4b7239658407c119bd2123140050` (artifact `10072396447`, digest `sha256:604f4c0279ca4e39b20f44a3ea71b3db36fbee28ce25b3233a45611ba66a5c45`). The rendered Screening (5 pages) and Underwriting (23 pages) PDFs were inspected page by page and at normal reading scale. The final review confirmed the gold brand dot, clear source-variance wording, `Underwriting Report` title, readable pagination, consistent KPI typography, source-register wrapping, Quality Manifest layout, and zero customer-facing em/en dashes.

The only validator repair was legitimate: the final-publication smoke test had a stale expectation that the approved gold brand dot remained suppressed. It now asserts the reusable gold-dot invariant.

### CLOSED / production deployment

The certified release candidate was deployed to Vercel production from a clean worktree at `c07c1da8cef64fab95f825746bddecb03c1b14e8` using prebuilt output. Deployment `dpl_DYQ7rXuyb93SU17zp4X5899vuvzy` is `READY` and aliases `investoriq.tech`, `www.investoriq.tech`, `investoriq.vercel.app`, and the project alias. The live site returned HTTP 200, and no runtime errors were found in the first-hour check.

### CLOSED / certified foundation

- Visual ELITE publication engine and provider rendering are certified in DocRaptor TEST mode.
- Screening and Underwriting use the approved publication font families: Cormorant Garamond, DM Sans, and DM Mono.
- Prince-specific grid, typography-spacing, pagination, and NOI page-balance defects discovered during Step 6 were repaired and provider-proven.
- The final Step 6 proof produced a 5-page Screening report and 21-page Underwriting report with content-driven pagination. Those page counts are evidence from that fixture, not product limits.

### OPEN / post-deployment closeout

**Underwriting editorial + analytical customer acceptance and the authorized Vercel production deployment are complete.**

The deeper 21-page September 6 audit found material issues that were outside the earlier provider-render certification scope: factual-presentation inconsistencies, calculation-basis ambiguity, source/context wording, duplicated system-facing prose, small essential text, redundant line hierarchy, source-register and Quality Manifest crowding, and weak decision framing.

Future work should be limited to post-deployment observation, owner-approved product improvements, and any newly evidenced defects. Do not restart the completed audit or certification chain.

## 3. Non-negotiable root-cause doctrine

**The Stonebridge test PDF is diagnostic evidence. It is not the repair target.**

Do not patch a fixture to make its audit pass. Repairs must address reusable InvestorIQ code and authority: shared renderers, source-normalization logic, calculation governance, copy-generation logic, report components, typography/rule systems, pagination, evidence treatment, and cross-product publication behavior.

Forbidden shortcuts:

- no `if property === Stonebridge` or fixture-name branches;
- no hardcoded Stonebridge values, filenames, page numbers, or copy solely to satisfy the test;
- no test-only CSS that hides a production defect;
- no manual PDF editing;
- no changing calculations merely to make two displays agree;
- no deleting unique evidence to shorten the report;
- no hard page caps, fixed minimum page counts, filler, truncation, or layout crushing;
- no weakening tests to manufacture a pass;
- no treating a successful build, HTTP 200, or provider render as editorial acceptance.

Stonebridge may remain a regression fixture because it exposed real defects. The proof of repair is a correct reusable system plus fresh generated artifacts.

## 4. Governing audit evidence

Read:

`CHAT_HANDOFF/archived/2026-09-06-underwriting-editorial-analytical-audit/ROOT_CAUSE_REPAIR_AUTHORITY.md`

`CHAT_HANDOFF/archived/2026-09-06-underwriting-editorial-analytical-audit/AUDIT_PRIORITY_REGISTER.md`

Full audit supplied by the owner:

`InvestorIQ_Underwriting_Editorial_Visual_Audit_2026-09-06(1).md`

Audited Underwriting PDF SHA256:

`ebf59fbb538a2114fe543d839a3df93e283c33e2694f1d13d0bcc921453f620b`

The audit is evidence of symptoms and recommended outcomes. It is not automatic source/calculation authority. Source-dependent findings and formula changes must be verified against repository/source authority before implementation.

## 5. Highest-priority findings

P1 register:

- A01: inconsistent 2BR precision across report surfaces; shared precision/format authority must preserve reproducible totals.
- A02: tied unit categories are incorrectly reduced to one “largest” category; generic tie handling required.
- A03: stale scenario-scope language says interest-rate stress is deferred even though it appears later.
- A04: long source filenames collide with adjacent source-register columns.
- A05: Quality Manifest gutters/columns crowd or run together.
- A06: the $180,000 cross-basis rent comparison and $20,000 expense subtotal discrepancy must be explained as distinct issues.
- A07: operating break-even and debt-inclusive coverage use labels that conceal differing revenue bases; governing formulas must be verified and disclosed precisely.
- A08: coverage/document-count wording can imply broader diligence completeness than was actually checked.
- A09: environmental wording is ambiguous and must be verified against source meaning.
- A10: source periods, as-of dates, and currency are not sufficiently visible.

P2 system findings:

- V01: one boundary, one separator; eliminate stacked decorative rule systems.
- V02: one approved KPI/metric hierarchy across report modules.
- V03: essential meaning must not depend on ~5-6pt text; reflow instead of shrinking.
- V04: repair continuations and short stranded schedules systemically.
- E01: consolidate duplicate metrics, warnings, inventories, and governance prose without deleting unique evidence.
- E02: replace vague/system-facing language with finding -> meaning -> unresolved -> next action.
- D01: align title and front-of-report decision framing with the actual Underwriting product promise.

## 6. Current editorial direction

These are current owner/audit directions to validate against code/brand authority and implement systemically:

- Preserve the approved gold dot after `INVESTORIQ` across the shared Screening and Underwriting cover system.
- Replace unexplained reader-facing `RECONCILIATION REQUIRED` with clearer wording such as **Source differences require review**, followed by the actual issues and required evidence.
- Current title recommendation: **InvestorIQ Underwriting Report**. Optional subtitle: **Prepared for investment review**. Do not call it an Investment Committee Memorandum merely because the name sounds more premium.
- Remove redundant `INVESTMENT COMMITTEE OVERVIEW` above `Investment Decision Snapshot`.
- The audited PDF contains zero em dashes and zero en dashes in customer-facing extracted text. The owner’s visual concern is primarily excessive horizontal rules/separators.
- Preserve the earnings bridge; it remains one of the strongest visuals.

## 7. Required first action in the next chat

Do **not** start by editing the Stonebridge renderer output.

First build an implementation matrix:

`Audit ID | Artifact symptom | Root-cause hypothesis | Source authority needed | Code owner/component | Shared Screening impact | Repair class | Regression proof | Fresh rendered proof | Status`

Then inspect the actual repository/source authority for P1 findings before changing behavior.

Start with A01-A10 and D01. Visual/editorial polish follows once analytical truth and system ownership are clear.

## 8. Acceptance gates

Customer-facing acceptance requires all of the following separately:

1. Source and calculation truth verified for changed analytical findings.
2. Root-cause repairs implemented in reusable code.
3. Meaningful regressions, including generalized/non-fixture cases where practical.
4. Production build/report-contract regressions green.
5. Fresh Screening and Underwriting artifacts generated through the real lanes.
6. Actual provider render proof when authorized.
7. Every page visually reviewed at full-page and normal reading scale.
8. Full editorial/investment-review acceptance.

A provider-render PASS alone is not enough.

## 9. Remaining production holds

No merge to `main`, migration, scheduler activation, Storage mutation, Stripe/pricing change, or other production mutation is authorized without a new explicit owner decision. The single authorized deployment recorded above is complete.
## 2026-09-12 CURRENT AUTHORITY — final deployment checkpoint

- The final repaired production deployment is complete. Certified source is commit `2005e6361e348b87a61d9470759819c5f000c5d` on `hotfix-worker-queue-starvation-20260911-r1`.
- Vercel deployment `BkmA44RAR9aCJCE6EHEm2L5yhn9f` is Ready and aliased to [https://investoriq.tech](https://investoriq.tech).
- Verified gates: canonical QA `38/38 PASS`, p0b deterministic smoke PASS, Dashboard customer-copy smoke PASS, local production build PASS, and successful production deployment.
- The deployed repairs cover queue starvation, deterministic legacy QA false-blocking, screening financing-language leakage, and customer-visible dead-letter/paused status messaging. Raw browser access to governed data remains forbidden.
- This is a handoff checkpoint, not a reopening of the audit or AI architecture. GPT-4o remains launch authority; closed phases stay closed.
- Tomorrow’s first action is a fresh controlled customer E2E verification against the live alias. Verify job admission, Dashboard visibility, worker progression, event timeline, and terminal explanation. Do not replay old jobs or infer current behavior from historical queued/dead-letter rows.
- No further production change is authorized by this note: do not merge main, apply migrations, activate schedulers, mutate Supabase/Stripe, or redeploy unless separately approved after fresh evidence.

## 2026-09-11 production promotion continuation - HISTORICAL RECORD
