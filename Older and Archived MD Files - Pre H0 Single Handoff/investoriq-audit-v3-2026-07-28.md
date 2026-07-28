# InvestorIQ — Independent Repo Audit & Amended Plan
### Revision 3 · July 28, 2026

**Scope of this document:** read-only technical audit. No code was changed, no migration run, no deployment, no production data touched, no Premium activation, no RETEST 39, no commit, push, merge, or branch published.

**Status of this document:** an **amendment to** the canonical Opus/Claude game plan (July 27, 2026), not a replacement for it.

---

## 0. Owner decisions recorded

| Decision | Value |
|---|---|
| Launch model | Screening and Full Underwriting launch **simultaneously**, or neither |
| Screening price | **$199 USD** |
| Full Underwriting price | **$499 USD** |
| Bundle (2 Screening + 1 Underwriting) | **$699 USD** |
| Premium Acquisition Underwriting | Remains exactly `false` |
| Full Underwriting foundation | V2/base only; no legacy resurrection |
| Go-to-market | Single introduction to a ~500-member Canadian RE syndicate, including principals with $200M–$500M+ portfolios |
| `.md` consolidation | **Authorized in principle** — see §8 |

---

## 1. Reconciliation with the canonical game plan

A second review correctly characterised the relationship between the two documents. I accept that characterisation, and this revision adopts it.

**This audit is an amendment, not a replacement.** It is stronger on the immediate question *"why do identical runs behave differently?"*. The canonical plan is stronger on launch governance, product boundaries, entitlement atomicity, remedies, support gates, and certification. Neither displaces the other, and my findings do not disprove the canonical blocker map — in several places (missing bundle SKU, non-atomic Stripe webhook, inconsistent product naming, absent reproducibility tests) they independently confirm it.

### 1.1 Positions I withdraw or soften

| Rev. 1–2 position | Revised position |
|---|---|
| "Governance is the wrong problem; determinism is fixable in days, not months." | **Overstated.** Determinism is fixable in days. The *launch* is not. The canonical plan documents real, independent blockers that determinism work does not touch. Corrected framing: determinism is the missing **first proof layer**, not a substitute for the blocker program. |
| "Skip H0; start with determinism." | **Withdrawn.** H0 is documentation-only, fast, and prevents another "which product are we building?" loop. Keep it. Determinism moves to immediately after H0, not before it. |
| "Non-core failures — renderer, contract, PDF artifact, storage — should not kill the whole report." | **Too broad, and the objection is correct.** If storage fails, or no valid PDF artifact exists after bounded recovery, there is nothing safe to deliver. Corrected rule in §3.2. |
| "Ship Screening first, Underwriting behind it." | **Withdrawn** (rev. 2) at owner instruction. Simultaneous launch. |
| "6–8 weeks to launch." | **Withdrawn as a schedule.** See §7. Stages 1–2 are days-to-weeks and I stand behind those. Total launch duration depends on the canonical blocker program, which I have not independently estimated. |

### 1.2 Positions I maintain

1. Identical inputs must produce identical canonical outputs **before** any further certification work is meaningful. Anything certified against a moving pipeline may need re-certifying.
2. The determinism defects in §2 are real, specific, and proven below.
3. A probabilistic reviewer must not hold authority over whether a paid report publishes.
4. The volume of governance documentation is itself now a delivery cost (§8).

---

## 2. Formal determinism verification — PASS / HOLD

The following is the read-only verification requested, answered claim by claim.

**Files inspected:** `lib/ai-t12-recovery.js`, `lib/ai-rent-roll-recovery.js`, `lib/ai-support-doc-recovery.js`, `api/_lib/qa-action-plan.js`, `api/_lib/qa-review.js`, `api/_lib/qa-manager-review.js`, `api/_lib/source-package-qa.js`, `api/_lib/delivery-gate-constitution.js`, `lib/terminal-failure-taxonomy.js`, `lib/textractClient.js`, `api/admin-run-worker.js`, `api/webhook.js`, `api/create-checkout-session.js`, `package.json`, `tests/qa/` (145 scripts), `tests/e2e/`.

**Verdict: PASS on all five claims.** Every claim in the independent audit is proven true against the checked-out code.

### Claim 1 — Factual recovery model calls lack explicit determinism controls · **PROVEN**

The three recovery modules call `https://api.openai.com/v1/responses` with `model: OPENAI_MODEL`. Grepping the three files for `temperature` and `seed` returns **zero matches**. The OpenAI default temperature is `1.0`.

Model defaults are floating aliases, not pinned versions:
```
lib/ai-t12-recovery.js:1        process.env.OPENAI_T12_RECOVERY_MODEL || 'gpt-4o-mini'
lib/ai-support-doc-recovery.js:4 process.env.OPENAI_SUPPORT_DOC_RECOVERY_MODEL || 'gpt-4o-mini'
```
`gpt-4o-mini` is an alias that OpenAI repoints to new snapshots over time. Output can therefore change with no repo change at all.

A structured response schema *is* enforced (`buildResponseSchema()`), so the *shape* is stable. The *values* are not.

Consequence chain: value differs or returns `null` → `MIN_CONFIDENCE = 0.9` threshold flips → dependent sections collapse → the emitted failure code differs. This precisely reproduces the reported "same two test reports, different results or different errors."

**Contrast, same repo:** `qa-review.js:227`, `qa-manager-review.js:403`, `source-package-qa.js:555` all set `temperature: 0`. The discipline exists; it was applied to the review layer and missed on the three paths that touch customer facts.

### Claim 2 — LLM review output can suppress findings and create customer-delivery blockers · **PROVEN**

In `api/_lib/qa-action-plan.js`:
- `managerSuppressesRenderedFinding(qaManagerReview, finding)` (line 573) iterates `qaManagerReview.decisions[]` and **suppresses deterministic findings**.
- Line 2509: `if (managerSuppressesRenderedFinding(qaManagerReview, finding)) continue;`
- Line 2513 onward ingests `qaManagerReview.decisions` directly.
- `managerContradictionBlocksCustomer` (line 1976) feeds `adminReviewBlockingAction` and `customer_publish_blockers`.

Those blockers pass into `buildConstitutionalDeliveryGateDecision({ customerBlockers })`, which sets `customer_delivery_allowed`, `report_publishable`, and `report_blocked`.

Therefore a language model both suppresses deterministic findings *and* contributes to whole-report blocking. `temperature: 0` reduces but does not eliminate variance, and does not survive model-version repointing.

### Claim 3 — `@aws-sdk/client-textract` imported but missing from `package.json` · **PROVEN**

`lib/textractClient.js:1` imports `@aws-sdk/client-textract`. It appears nowhere in `package.json`. Empirically, on a clean checkout:

```
npm install && npm run qa:launch-core
→ Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@aws-sdk/client-textract'
  imported from lib/textractClient.js
  (fails at qa:support-docs)
```

Everything before that point passed. This is a live hazard: a clean CI or Vercel build has no guarantee of resolving it, and `qa:launch-core` — the gate the whole program relies on — **cannot currently complete on a fresh clone.** That single fact undercuts every "the suite passes" claim made from a warm working copy.

### Claim 4 — No existing test asserts repeatability · **PROVEN**

145 QA smoke scripts plus `tests/e2e/` were reviewed. They assert *contracts* (shape, presence, parity, non-reachability) — genuinely good discipline. **None runs the same fixture more than once and compares outputs.** There is no reproducibility assertion anywhere in the repository, which is why this class of defect has survived 38 retests.

### Claim 5 — Non-core presentation findings can block the entire report · **PROVEN (with the qualification in §3.2)**

`api/_lib/delivery-gate-constitution.js` requires all six checks true for `customer_delivery_allowed`:

| Check | Class |
|---|---|
| `source_truth_package_valid` | Core |
| `core_publishable` | Core |
| `pipeline_compliance_passed` | **Internal QA** |
| `html_safety_validation_passed` | **Presentation** |
| `renderer_completed` | **Presentation** |
| `no_true_customer_blocker` | Mixed — includes LLM-derived blockers (Claim 2) |

Any single failure sets `delivery_gate_status: "admin_review_required"` and `report_blocked: true`. There is **no intermediate "publish with collapsed sections" outcome in this function at all** — the publish-or-collapse doctrine is not represented in the gate that decides publication.

`lib/terminal-failure-taxonomy.js` agrees: of 8 terminal codes, 3 are customer-document failures and 5 are InvestorIQ-side (`SOURCE_TRUTH_PACKAGE_CONSTRUCTION_FAILED`, `REPORT_RENDER_FAILED`, `REPORT_CONTRACT_FAILED`, `PDF_ARTIFACT_FAILED`, `STORAGE_PUBLICATION_FAILED`) — all terminal for the customer today.

### Claims NOT proven

- **Production runtime behaviour.** Everything above is proven against the checked-out code only. Deployed environment variables may set temperature or pin models; deployed schema/RLS is unverified. This remains the canonical plan's F-061 evidence gap and requires H2.
- **Relative frequency.** I have not measured how often each randomness source actually changes a customer outcome. The determinism harness (Stage 1.5) is what produces that number.
- **Textract/OCR contribution.** `lib/textractClient.js` and `tesseract.js` add run-to-run variance on scanned documents in principle; I did not execute them against fixtures.

### Compliance confirmation

No code, migration, deployment, production-data change, environment change, Premium activation, RETEST 39, commit, push, or merge occurred during this audit. The only actions taken were file reads, static searches, an `npm install` into a local working copy, and one local `npm run qa:launch-core` execution.

---

## 3. Publish-or-Collapse — corrected formulation

### 3.1 The defect

The gate is binary (`deliverable` / `admin_review_required`) with six equally-weighted kill switches, three of them non-core. Doctrine says most defects should degrade a section. The gate has no mechanism to express that.

### 3.2 The corrected rule (supersedes rev. 1–2)

My earlier phrasing — "the presentation gate can only degrade sections" — was wrong, and the objection to it is correct: a broken PDF cannot be published, and pretending otherwise would ship customers an empty deliverable. The correct rule is three-tier:

> **Tier 1 — Core evidence.** Missing or catastrophically unusable T12 or Rent Roll, or a fundamentally contradictory core package, blocks the report. Customer-document remedy path.
>
> **Tier 2 — Content and presentation.** Support-document defects, section-level content gaps, charts, layout, tables, continuation headers, pagination, and internal QA findings **must not block a whole report**. They degrade, collapse, qualify, or trigger **bounded repair**, and are disclosed in the manifest.
>
> **Tier 3 — Artifact and publication.** Renderer, PDF composition, storage, and publication failures **first trigger bounded recovery**. They block **only** when bounded recovery proves that no materially correct deliverable can exist. A block here is an InvestorIQ-caused system failure — corrected rerun first, exactly-once restoration if it cannot continue.

This preserves the doctrine without pretending a failed storage write is publishable. It also matches the canonical plan's permitted progression (publish → bounded repair → collapse → safe-base → fail) more faithfully than my rev. 1 wording did.

### 3.3 Implementation shape

Replace the implicit blocking logic with a declarative table — `code → tier → affected sections → customer message` — and make the gate return a *section-state map*, not a boolean. `qa-action-plan.js` is ~2,700 lines containing conditions of the form `!(a && b && !(c && !d))`; that complexity is itself a defect source and should be retired in favour of the table.

---

## 4. Consolidated findings

| # | Finding | Severity | Status |
|---|---|---|---|
| F1 | No `temperature`/`seed`/pinned-version controls on the three factual recovery paths | **Critical** | Proven §2.1 |
| F2 | LLM QA review suppresses findings and creates customer-delivery blockers | **Critical** | Proven §2.2 |
| F3 | Non-core defects block whole reports; gate has no collapse outcome | **Critical** | Proven §2.5 |
| F4 | `@aws-sdk/client-textract` imported but absent from `package.json`; `qa:launch-core` fails on a clean clone | **High** | Proven §2.3 |
| F5 | Stripe webhook non-atomic; "duplicate event, incomplete rows — continuing" path can over-grant | High | Confirms canonical F-009 |
| F6 | No bundle SKU exists — `create-checkout-session.js` supports only `screening` and `underwriting` | High | Blocks the $699 product |
| F7 | Inconsistent product identity in code (`underwriting`, `acquisition_memo`, `v1_core`, `screening_v1`, premium) | Medium | Confirms canonical F-041/043 |
| F8 | "AI" appears only in `src/pages/AdminDashboard.jsx` (internal). Customer surfaces and renderers are **clean**. | Low | Rename anyway — screenshots leak |
| F9 | 87,145 lines across `api/` + `lib/`; `generate-client-report-impl.js` alone is 9,231 lines | Medium | Velocity tax |
| F10 | No reproducibility test anywhere in 145 QA scripts | High | Proven §2.4 |
| F11 | **1,009,606 lines of markdown across 102 tracked files** | High | See §8 |
| F12 | Working files tracked at repo root: `tmp_*.txt` ×10, `smoke-output.txt`, `codex_write_test.txt`, `test-report.pdf`, `tatus`, `nce Vercel function env init fail-closed` | Low | Housekeeping |

---

## 5. What the $499 report needs to survive analyst scrutiny

The launch audience includes principals with $200M–$500M+ portfolios who employ analysts. That reader forms a judgement in roughly ninety seconds, on four things:

1. **Does every number tie back to a page in *their* document?** Per-figure provenance — "$412,880 · T12 p.4 · line 'Total Operating Expenses'" — stops being a differentiator and becomes the price of entry.
2. **Is the methodology re-performable?** A sophisticated reader re-does two or three calculations by hand. If those tie, the rest of the report inherits the credibility. This is why the calculation-methodology appendix earns its pages.
3. **Does it state what it does *not* know?** Amateur tools hide gaps; institutional documents disclose them. The risk register and unresolved-questions sections should be prominent, not buried.
4. **Does it break-even test?** *"DSCR reaches 1.20x at 87% occupancy"* is the single sentence most likely to get a report passed to a credit officer.

A credit officer sizing a loan asks five questions, and the report must answer all five unaided:

| Question | Requirement | Status |
|---|---|---|
| What does it earn? | T12 normalization, expense composition, in-place → underwritten NOI bridge, every adjustment sourced | Mostly present; needs binding |
| Can it service debt? | DSCR, **debt yield**, LTV, **mortgage constant**, annual debt service, each with its denominator stated | Debt yield trapped in Premium lane — promote |
| What if I'm wrong? | **Break-even occupancy, break-even rent, DSCR-constrained maximum proceeds, rate/NOI/value sensitivity grid** | **Largest gap** |
| What is the rent roll telling me? | Unit mix, occupancy, rent gap where evidenced, **lease expiry / rollover concentration**, concessions, delinquency | Rollover concentration missing |
| What can't I see? | Risk and diligence register, unresolved questions, explicit limitations | Present — genuine differentiator |

Break-even and sensitivity analysis deserve emphasis because they are frequently misread as forecasting. They are not. They are arithmetic performed on accepted facts — *the point at which the deal stops working* — and are fully compatible with "never invent." Return projections, IRR, equity multiple, exit assumptions, and recommendations stay out, per doctrine.

**Positioning to keep:** *"A professional, evidence-backed investment and financing memorandum prepared entirely from your uploaded documents."* Every figure traceable, every gap disclosed.

---

## 6. Revised sequence

Adopting the amended ordering, with determinism inserted immediately after the authority freeze:

| Phase | Content | Source |
|---|---|---|
| **H0** | Owner and Authority Freeze — documentation only | Canonical plan, retained |
| **H0.5** | **Determinism Proof and Flakiness Containment** | This amendment |
| **H0.75** | **Publish-or-Collapse tiering** (§3.2) | This amendment, corrected |
| H1 | Authenticated identity and authorization | Canonical plan |
| H2 | Read-only deployed schema / RLS / storage verification | Canonical plan |
| H3–H4 | Stripe atomicity; bundle entitlement creation | Canonical plan |
| H5–H9 | Support gate, worker fencing, terminal outcome, remedies | Canonical plan |
| H10–H12 | Publication, history, state convergence, identity firewall | Canonical plan |
| H13–H16 | Full Underwriting model, calculations, renderer, certification | Canonical plan + §5 additions |
| H17–H19 | Controlled replays, governed canary, simultaneous launch certification | Canonical plan |

### H0.5 — step breakdown (each independently reversible)

| Step | Change | Revert impact if wrong |
|---|---|---|
| 1.1 | `temperature: 0` + `response_format` pinning + **pinned model snapshot versions** on the three recovery paths | Isolated to three files |
| 1.2 | Content-hash extraction cache: identical document bytes → identical stored extraction, no second model call | Cache is additive; disable by flag |
| 1.3 | Remove LLM QA review from the publish decision; demote to advisory admin telemetry | Reverts to current behaviour |
| 1.4 | Add `@aws-sdk/client-textract` to `package.json` | Trivial |
| 1.5 | **Determinism harness** — each fixture run 3×, assert byte-identical canonical output; wire into `qa:launch-core` | Test-only |

Step 1.5 is what *proves* 1.1–1.3 worked and prevents regression; it lands last and stays permanently. Each step is a separate commit with its own verification, so any single one can be reverted without unwinding the others.

Note that 1.2 also reduces unit cost: reruns, corrected reruns, and replays stop re-paying for extraction. At roughly $25/report today, margins at $199/$499/$699 are sound, and the cache improves them.

### H0.75 — step breakdown

| Step | Change |
|---|---|
| 2.1 | Introduce the three-tier classification table (§3.2) — no behaviour change, table only |
| 2.2 | Gate returns a section-state map instead of a boolean |
| 2.3 | Route Tier 2 findings to collapse/qualify instead of block |
| 2.4 | Bounded-recovery path for Tier 3 before any block |
| 2.5 | Fixtures: corrupt support doc, contradictory support, renderer failure, PDF defect — assert publish-with-collapse, not fail |

---

## 7. On schedule

I withdraw the "6–8 weeks to launch" figure. It described the work in §6 phases H0.5, H0.75, and the §5 content additions — not the full canonical blocker program, which I have not independently estimated and which includes deployed-schema verification I cannot perform read-only from here.

What I will commit to:
- **H0.5 (determinism): 3–5 working days**, harness included.
- **H0.75 (tiering): approximately one week.**
- **§5 content additions: approximately two weeks** once the model binding from H13 exists.

Everything else remains on the canonical plan's estimate until H2 closes the evidence gap. Announcing a launch date before H17 passes remains unwise, and I agree with the canonical plan on that point.

---

## 8. Documentation consolidation (authorized in principle)

Measured, not estimated:

```
Tracked .md files:            102
Total markdown lines:   1,009,606
Largest single file:       23,622 lines
Root-level doctrine files:      9
"Very Old and Archived MD Files": 86 files
```

**One million lines of markdown for a single product.** The `Very Old and Archived MD Files` directory alone holds 86 near-duplicate snapshots of the same evolving checklist — eight versions of `MASTER_CONTEXT_CURRENT_DOCTRINE_COMPLETION_CHECKLIST` at 18k–23k lines each.

This is now a direct delivery cost. Every AI agent that opens this repository spends the bulk of its context window reading governance before it can write a line of code — which is a plausible contributing factor to inconsistent agent behaviour across sessions, independent of the runtime defects in §2.

### Proposed structure

| Path | Contents |
|---|---|
| `docs/DOCTRINE.md` | The single controlling doctrine — product identity, pricing, publish-or-collapse, never-invent, remedy state machine, 20-section contract |
| `docs/STATUS.md` | Current phase, open blockers, last certification result. The only file that changes routinely |
| `docs/ROADMAP.md` | The canonical phase plan (H0 → H19) as amended by this document |
| `docs/decisions/NNNN-*.md` | One short record per owner decision, append-only, dated, never rewritten |
| `AGENTS.md` | Trimmed to a pointer plus hard rules |
| `archive/` (git history only) | The 86 archived files removed from the working tree, recoverable from git forever |

**Nothing is deleted.** Removing files from the working tree leaves them permanently retrievable in git history — the audit trail survives intact while agents and humans stop paying to read it.

**Suggested sequencing:** do this during H0, since H0 is already the documentation-only authority phase and consolidation is precisely a "one current authority" activity. It requires no runtime change and is fully reversible.

Housekeeping to fold in (F12): untrack the `tmp_*.txt` working files, `smoke-output.txt`, `codex_write_test.txt`, `test-report.pdf`, and the two malformed filenames (`tatus`, `nce Vercel function env init fail-closed`) at repo root.

---

## 9. Summary verdict

**On the independent audit's own claims: PASS.** All five determinism claims are proven true against the checked-out code.

**On its standing relative to the canonical plan: amendment, not replacement.** Adopt the determinism-first proof layer, the extraction cache, advisory-only LLM QA, the missing dependency fix, and the reproducibility harness. Preserve H0, simultaneous launch, V2/base only, Premium false, bundle atomicity, the remedy state machine, the 20-section contract, and the launch certification matrix. Reject the rev. 1 schedule and the rev. 1 blanket "presentation defects never block" wording, both corrected here.

**Recommended next action:** H0 (authority freeze + documentation consolidation), then H0.5 step 1.1.

---

*Prepared by Devin · read-only audit · no repository changes made.*
