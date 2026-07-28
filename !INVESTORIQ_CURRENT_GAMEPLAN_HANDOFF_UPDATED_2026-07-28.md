# InvestorIQ Current Game Plan and Fresh-Chat Handoff
## Updated July 28, 2026 — Canonical Opus Plan + Independent Determinism Amendment + ChatGPT Keeper Recommendations

**Purpose:** This is the single practical handoff file to give to ChatGPT, Codex, Sol, Devin, or another VS Code AI when beginning or continuing InvestorIQ work.

**Status:** Current working game plan. This file consolidates the July 27 canonical Opus/Claude launch plan, the July 28 independent audit v3, and ChatGPT Keeper recommendations.

**Rule:** In normal daily work, hand off this file first. Upload deeper doctrine ledgers or stage audit files only when the next task explicitly requires evidence from them.

---

## 0. Non-negotiable current state

```text
Premium assignment: false
RETEST 39: not authorized
Implementation: not begun from this merged plan
Audit work: not merged to main
Production migration: not authorized
Deployment: not authorized
Production data change: not authorized
Stripe configuration change: not authorized
Live canary: not authorized
Live retest: not authorized
```

RETEST 37 and RETEST 38 failed without publication, and credits were restored. RETEST 38's bounded PDF recomposition eligibility defect was repaired in `8545d69`. Report History was repaired in `2544969`; the top Reload button is gone; RETEST 38 appears directly in Report History with failed/restored-credit messaging.

Claude/Opus completed the full-repository launch investigation. It inspected 193 repository records, inventoried 151 QA files, proved 76 findings, and identified launch blockers. Screening is the shortest path after P0 repairs but is not launch-approved. Full Underwriting is not launchable this week. No rewrite is required.

---

## 1. Owner decisions currently frozen

| Decision | Current authority |
|---|---|
| Launch model | Screening and Full Underwriting launch simultaneously, or neither launches |
| Screening price | $199 USD |
| Full Underwriting price | $499 USD |
| Bundle | $699 USD for exactly 2 Screening entitlements + 1 Full Underwriting entitlement |
| Premium | Remains exactly `false`; not a launch lane; not a fallback |
| Full Underwriting foundation | V2/base only |
| Legacy Underwriting / Acquisition Memo V1 | Not factual authority |
| Full Underwriting input gate | Accepted usable T12 + accepted usable Rent Roll + at least one readable adjudicable support document before entitlement consumption |
| Weak or contradictory support after generation starts | Cannot block valid-core publication; may qualify, collapse, or omit dependent analysis |
| Customer-source failure remedy | Same governed order, linked replacement-document revision, no extra charge, no extra spendable entitlement |
| InvestorIQ-caused defect remedy | Corrected rerun first; exactly-once restoration/refund/account credit only if the order cannot safely continue |
| Launch positioning | Professional, evidence-backed investment and financing memorandum prepared from uploaded documents; every figure traceable; every gap disclosed |

---

## 2. Relationship between the plans

The July 27 Opus/Claude canonical plan remains the **launch constitution and blocker map**.

The July 28 independent audit v3 is accepted as an **amendment, not a replacement**. It adds the missing first technical proof layer: deterministic repeatability.

ChatGPT Keeper recommendation:

```text
PASS as an amendment.
HOLD as a replacement.
```

Adopt:

- determinism-first proof layer;
- explicit model determinism controls on factual recovery paths;
- content-hash extraction cache;
- LLM QA demoted out of publish authority;
- missing Textract dependency fix;
- 3x reproducibility harness;
- three-tier Publish-or-Collapse gate reform.

Preserve:

- H0 first;
- simultaneous launch;
- V2/base Full Underwriting only;
- Premium false;
- no legacy resurrection;
- bundle atomicity;
- remedy state machine;
- 20-section Full Underwriting contract;
- launch certification matrix;
- no RETEST 39 without explicit later authorization.

Reject or qualify:

- any claim that determinism replaces the blocker program;
- any launch schedule not grounded in the full canonical blocker program;
- any rule saying PDF/storage/publication failures can always degrade instead of block.

---

## 3. Corrected three-tier Publish-or-Collapse rule

### Tier 1 — Core evidence

Blocks the report only when:

- T12 is missing or catastrophically unusable;
- Rent Roll is missing or catastrophically unusable;
- core package is fundamentally contradictory;
- canonical Source Truth cannot establish a materially usable core.

Customer-document remedy path applies.

### Tier 2 — Content and presentation

Must not block a whole valid-core report. These issues degrade, collapse, qualify, omit, or trigger bounded repair:

- support-document defects;
- optional evidence gaps;
- section-level content gaps;
- charts;
- layout;
- tables;
- continuation headers;
- pagination;
- internal QA findings that do not make the artifact unsafe.

All Tier 2 outcomes must be recorded in the Report Quality Manifest and visible to admin quality review.

### Tier 3 — Artifact and publication

Renderer, PDF composition, storage, and publication failures first trigger bounded recovery. They block only when bounded recovery proves that no materially correct deliverable can safely exist.

If Tier 3 blocks, it is an InvestorIQ-caused system failure: corrected rerun first; exactly-once restoration/refund/account-credit only if the order cannot safely continue.

---

## 4. Merged roadmap

| Phase | Purpose | Source |
|---|---|---|
| H0 | Owner and Authority Freeze + current handoff/doc consolidation | Canonical plan retained + Keeper refinement |
| H0.5 | Determinism Proof and Flakiness Containment | Independent audit amendment |
| H0.75 | Publish-or-Collapse tiering | Independent audit amendment, corrected |
| H1 | Authenticated identity and authorization | Canonical plan |
| H2 | Read-only deployed schema, RLS, storage verification | Canonical plan |
| H3 | Stripe receipt and standalone entitlement atomicity | Canonical plan |
| H4 | Bundle entitlement creation | Canonical plan |
| H5 | Submission, adjudication, reservation, source registration | Canonical plan |
| H6 | Worker claim, lease, fencing, deadlines | Canonical plan |
| H7 | Core/support classification and causal taxonomy | Canonical plan |
| H8 | Terminal outcome, Manifest, restoration | Canonical plan |
| H9 | Corrected and replacement revisions | Canonical plan |
| H10 | Publication, artifacts, Report History | Canonical plan |
| H11 | Customer/admin state convergence | Canonical plan |
| H12 | Full Underwriting identity and legacy firewall | Canonical plan |
| H13-H16 | Full Underwriting view model, calculations, renderer, Manifest/PDF certification | Canonical plan + lender-grade content requirements |
| H17-H19 | Controlled replays, governed canary, simultaneous launch certification | Canonical plan |

No later phase is authorized merely because it appears in this roadmap. Each phase requires a bounded prompt, PASS/HOLD receipt, and owner authorization to proceed.

---

## 5. H0 scope — next authorized phase

H0 is documentation-only. No runtime code.

### H0 goals

1. Record the owner decisions in one current authority.
2. Create a simple handoff structure that avoids daily confusion.
3. Preserve historical evidence without forcing every agent to read one million lines of markdown.
4. Prepare the next technical phase, H0.5, but do not implement it.

### H0 Keeper refinement

Split documentation consolidation into three substeps:

```text
H0-A: Create the new controlling docs and update pointers.
H0-B: After review, remove/archive old tracked duplicate markdown snapshots from the working tree.
H0-C: Housekeeping for tmp files, smoke output, test PDFs, and malformed root files.
```

Do **not** combine H0-A with a giant deletion/untracking diff. Owner-authority receipt and markdown cleanup must be independently reviewable and reversible.

### Recommended long-term docs

At most two files should be needed for routine handoff:

1. `docs/STATUS.md` — current state, current phase, last PASS/HOLD, next task, forbidden actions.
2. `docs/ROADMAP.md` — stable plan, doctrine summary, phases, certification map.

Optionally, `docs/DOCTRINE.md` may exist as the deeper constitution. But for daily fresh chats, upload `docs/STATUS.md` first and `docs/ROADMAP.md` only if needed.

For the current transition period, this file acts as both STATUS and ROADMAP until the repo creates the final two-doc structure.

---

## 6. H0.5 determinism amendment

### H0.5 step breakdown

| Step | Change | Commit boundary |
|---|---|---|
| 1.1 | Add `temperature: 0`, response-format pinning, and pinned model snapshot versions to the three factual recovery paths | One small runtime patch |
| 1.2 | Add content-hash extraction cache: identical document bytes produce identical stored extraction and no second model call | Additive cache patch, flag-disableable |
| 1.3 | Remove LLM QA review from publish authority; keep as advisory admin telemetry only | Gate-authority patch |
| 1.4 | Add missing `@aws-sdk/client-textract` dependency to `package.json` | Dependency-only patch |
| 1.5 | Add 3x determinism harness: run each fixture three times and assert byte-identical canonical output; wire into `qa:launch-core` | Test-only permanent proof |

### H0.5 must prove

- same fixture + same source bytes = identical canonical output;
- factual recovery output is stable or cached;
- LLM review cannot suppress deterministic findings;
- LLM review cannot create customer-delivery blockers;
- clean clone can run launch QA without missing dependencies;
- reproducibility failure becomes a permanent blocker.

---

## 7. H0.75 Publish-or-Collapse tiering amendment

### H0.75 step breakdown

| Step | Change |
|---|---|
| 2.1 | Introduce declarative table: `code -> tier -> affected sections -> customer message`; no behavior change first |
| 2.2 | Gate returns section-state map instead of only binary deliverable/admin-review |
| 2.3 | Route Tier 2 findings to collapse/qualify/omit instead of whole-report block |
| 2.4 | Add bounded recovery path for Tier 3 before any block |
| 2.5 | Add fixtures: corrupt support doc, contradictory support, renderer failure, PDF defect; assert correct publish/collapse/recovery/block outcomes |

---

## 8. Lender-grade Full Underwriting requirements to preserve

The $499 report must withstand analyst-level scrutiny.

Required credibility features:

- every material number ties to a document/page/label where available;
- calculation methodology appendix with formulas, operands, bases, units, rounding;
- explicit limitations and unresolved questions;
- risk and diligence register prominent, not buried;
- source register and evidence-quality summary;
- no invented facts, no hidden defaults, no unsupported recommendations.

Required debt/lender content:

- DSCR;
- debt yield promoted out of Premium-only logic;
- LTV;
- mortgage constant;
- annual debt service;
- denominator and basis for every metric;
- break-even occupancy/rent when formula and operands are approved;
- DSCR-constrained maximum proceeds only under approved policy;
- rate/NOI/value sensitivity grid only under approved policy;
- rollover/expiry concentration when Rent Roll evidence supports it.

Deliberately excluded for launch unless separately authorized:

- IRR;
- equity multiple;
- exit projections;
- investment recommendations;
- lender approval claims;
- appraisal/legal/environmental certification claims.

---

## 9. Daily fresh-chat handoff instruction

When starting a fresh chat, paste or upload this file and begin with:

```text
We are continuing InvestorIQ from the current game-plan handoff.
Treat the uploaded handoff file as the current practical authority.
Do not implement, migrate, deploy, activate Premium, run RETEST 39, change production data, commit, push, merge, or clean archives unless the current phase explicitly authorizes it.

Current next phase: H0-A documentation-only owner and authority freeze.
Give me one tiny protected prompt for that phase only.
```

If the AI needs deeper proof, then upload the relevant supporting source only:

- July 27 canonical Opus/Claude game plan;
- July 28 independent audit v3;
- the four July 27 doctrine ledgers;
- Stage 1 through Stage 11 audit files;
- current repo diff or Codex/Sol receipt.

Do not upload all doctrine and audit files by default. That creates confusion and burns context.

---

## 10. Exact next protected implementation prompt

Use this prompt for Codex/Sol/VS Code AI when ready to start H0-A.

```text
InvestorIQ H0-A: Current Authority Handoff Setup Only

Scope: documentation-only. Do not change runtime code.

Goal:
Create the minimal current-authority documentation structure so InvestorIQ has one practical daily handoff and one stable roadmap.

Use as controlling input:
- current uploaded game-plan handoff file;
- July 27 canonical Opus/Claude game plan if available;
- July 28 independent audit v3 if available;
- current four July 27 doctrine ledgers if needed for conflict checks.

Permitted:
- create or update docs/STATUS.md;
- create or update docs/ROADMAP.md;
- optionally create docs/DOCTRINE.md only if needed to avoid overloading STATUS/ROADMAP;
- add short pointers from AGENTS.md or existing root doctrine files only if already present and safe;
- prepare a list of old markdown files that can later be archived/untracked, but do not remove them in this step.

Required content:
- Premium remains false;
- RETEST 39 not authorized;
- no migration/deployment/production-data/Stripe/Premium/live-retest authority;
- owner decisions: $199 Screening, $499 Full Underwriting, $699 bundle, simultaneous launch, V2/base only;
- merged roadmap: H0, H0.5, H0.75, H1-H19;
- H0.5 determinism amendment;
- H0.75 three-tier Publish-or-Collapse amendment;
- current exact next step after H0-A;
- daily fresh-chat handoff instructions.

Forbidden:
- no runtime code;
- no database or migration work;
- no Stripe configuration;
- no worker/parser/renderer/publication/credit/remedy/frontend/PDF changes;
- no Premium activation;
- no deployment;
- no environment or production-data changes;
- no RETEST 39;
- no commit, push, merge, branch publication, or archive deletion unless Rob separately authorizes it;
- no giant deletion/untracking diff.

Validation:
- run documentation/terminology checks relevant to changed files if available;
- run git diff --check if files change.

Return only:
- PASS or HOLD;
- exact files changed;
- exact owner decisions recorded;
- exact checks run and results;
- exact old-file archive candidates listed but not removed;
- remaining blocker;
- confirmation that no runtime, deployment, migration, production-data, environment, Stripe, Premium, RETEST 39, commit, push, merge, or archive deletion occurred.

A PASS closes only H0-A. It does not authorize H0-B, H0.5, implementation, production access, migration, deployment, or live testing.
```

---

## 11. Current answer to Rob's handoff question

**Use one file for daily handoff.** This file is the current practical handoff until the repo has `docs/STATUS.md` and `docs/ROADMAP.md`.

After H0-A, use at most two files:

1. `docs/STATUS.md` — always upload first.
2. `docs/ROADMAP.md` — upload when the AI needs the broader plan.

Do not keep handing off four ledgers plus eleven audit stages every day. Those are supporting evidence, not the daily operating plan.

