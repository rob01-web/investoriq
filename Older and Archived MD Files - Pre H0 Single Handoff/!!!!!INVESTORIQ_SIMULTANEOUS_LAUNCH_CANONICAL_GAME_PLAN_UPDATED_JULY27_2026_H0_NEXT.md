# InvestorIQ Simultaneous Screening and Full Underwriting Launch
## Canonical Game Plan, Implementation Roadmap, and H0 Continuation

**Recorded:** July 27, 2026

**Current state:** Planning complete; implementation not started

**Next authorized boundary:** H0, Owner and Authority Freeze

**Production Premium assignment:** `false`

**RETEST 39:** Not authorized
**Deployment, migration, production-data change, commit, push, or merge:** Not authorized by this document

---

# 1. Purpose and Controlling Verdict

This file consolidates the complete simultaneous-launch plan developed from:

- The full-repository Stage 03 through Stage 11 investigation.
- The original simultaneous-launch master game plan.
- The implementation-hardening addendum.
- The four current InvestorIQ doctrine and operational ledgers.
- Rob's controlling owner decisions.
- The independent review that identified H0, rather than H1, as the correct next phase.

This file is the single planning continuation point for the controlled implementation program. It does not itself modify production doctrine, code, schema, Stripe, data, feature flags, or deployed behaviour.

## Executive verdict

1. InvestorIQ can reach simultaneous paid Screening and Full Underwriting launch without a rewrite.
2. Screening and Full Underwriting launch together, or neither launches.
3. The V2/base Underwriting lane is the only permitted foundation for the launch Full Underwriting product.
4. Legacy Underwriting and Acquisition Memo V1 remain retired as factual authorities.
5. Premium Acquisition Underwriting remains exactly `false`, is not the launch lane, and is not a fallback.
6. InvestorIQ already has most of the required underwriting substance. Its principal deficiency is reliable canonical source-to-certified-PDF delivery.
7. Full Underwriting is commercially defensible at $499 only when the complete governed report contract in this file is delivered and certified.
8. A next-week launch is not credible.
9. Runtime implementation must not begin until H0 formally reconciles product name, pricing, bundle, support gate, and remedy doctrine.

## Current HOLD

InvestorIQ is not authorized for:

- Paid launch.
- RETEST 39.
- Premium activation.
- A production canary.
- A migration.
- A deployment.
- Broad code implementation.

The only next step is the bounded H0 owner and authority freeze.

---

# 2. Evidence and Authority Hierarchy

When sources disagree, use this precedence:

| Precedence | Authority | What it controls |
|---:|---|---|
| 1 | Protected owner decisions and formally amended Product Doctrine | Product purpose, names, prices, customer promises, launch constitution |
| 2 | Premium Doctrine | Premium-only additive expansion and certification; cannot override core doctrine |
| 3 | Four current ledgers | Operational history, authority decisions, failure families, remedies, current continuation |
| 4 | Read-only deployed production evidence | What schema, RLS, storage, Stripe, receipts, and runtime enforcement actually exist |
| 5 | Current repository code | What the checked-out implementation currently does |
| 6 | Stage 03 through Stage 11 investigation | Proven defects, evidence gaps, and repair boundaries |
| 7 | Tests, replays, PDFs, and receipts | Proof only for the exact path and assertions exercised |
| 8 | Original simultaneous-launch master plan | Direction retained where not corrected |
| 9 | Implementation-hardening addendum | Corrected implementation blueprint |
| 10 | This canonical game plan | Consolidated controlling implementation continuation |

## Four controlling ledger families

The July 27 successor files are the current operational versions of the four ledger families:

1. `!!INVESTORIQ_ADMIN_QUALITY_INCIDENT_AND_CUSTOMER_REMEDY_DOCTRINE_UPDATED_JULY27_RETEST38_UI_VERIFIED_FULL_REPO_AUDIT_HOLD_NEXT.md`
2. `!!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_UPDATED_JULY27_RETEST38_FULL_REPO_AUDIT_P0A_HOLD_NEXT.md`
3. `!!!INVESTORIQ_MASTER_CONTEXT_CURRENT_DOCTRINE_COMPLETION_CHECKLIST_UPDATED_JULY27_RETEST38_FULL_REPO_AUDIT_P0A_HOLD_NEXT.md`
4. `!!!INVESTORIQ_SEMANTIC_AUTHORITY_EVIDENCE_LEDGER_UPDATED_JULY27_RETEST38_FULL_REPO_AUDIT_P0A_HOLD_NEXT.md`

The July 13 and July 15 versions remain historical evidence. The latest dated addendum controls current operational status.

## Evidence discipline

- Protected owner doctrine controls product intent.
- Deployed read-only evidence controls claims about production state.
- Repository migrations do not prove deployed production schema.
- Repository code proves current code behaviour, not permission to contradict doctrine.
- Tests prove only the path and assertions actually exercised.
- A calculation is not delivered merely because it exists in code or JSON.
- A calculation is delivered only when the certified PDF presents it accurately, legibly, coherently, and with the required basis and provenance.
- Unknown schema, policy, constraint, or runtime facts must be recorded as `EVIDENCE GAP`.

---

# 3. Frozen Launch Product Contract

## Screening Report

**Launch price:** $199

**Required input:** One accepted usable T12 and one accepted usable Rent Roll

**Purpose:** Rapid, evidence-backed triage of whether a property deserves deeper underwriting attention

**Output:** Concise, ranked, non-duplicative Screening Report

**Not permitted:** Full Underwriting identity, financing assumptions, loan sizing, sources and uses, scenario policy, or Full Underwriting-only appendices

## Full Underwriting Report

**Launch price:** $499

**Required input:**

- One accepted usable T12.
- One accepted usable Rent Roll.
- At least one additional supporting document readable enough for canonical adjudication.

**Purpose:** Professional, source-aware investment and financing memorandum for discussion with investors, brokers, and lenders

**Foundation:** V2/base only

**Not permitted:** Relabeled Screening, legacy Underwriting, Acquisition Memo V1, or Premium

## Launch Bundle

**Target price:** Approximately $699, subject to final Stripe configuration

**Composition:**

- Exactly two Screening entitlements.
- Exactly one Full Underwriting entitlement.

**Rules:**

- Each entitlement is independently consumed and restored.
- No cross-product substitution or conversion.
- Two Screening entitlements cannot become one Full Underwriting entitlement.
- One Full Underwriting entitlement cannot become Screening entitlements.
- Duplicate webhooks cannot over-grant.
- Partial usage preserves the remaining exact component balances.
- Premium remains false.

## Simultaneous-launch rule

The commercial launch event includes:

- Standalone Screening at $199.
- Standalone Full Underwriting at $499.
- The approximately $699 bundle with two Screening entitlements and one Full Underwriting entitlement.

If any mandatory shared, product, commerce, remedy, or certification gate remains unresolved, neither paid product launches.

---

# 4. Screening Versus Full Underwriting Boundary

| Dimension | Screening | Full Underwriting |
|---|---|---|
| Inputs | Accepted T12 + Rent Roll | Accepted T12 + Rent Roll + one readable support document |
| Adjudication | Core sufficiency and reconciliation | Core plus deeper support fact/conflict adjudication |
| T12 | Concise integrity, NOI, expenses, margin | Detailed line-item operating analysis and methodology |
| Rent Roll | Unit, rent, and occupancy triage | Unit economics, mix, rent gaps, and row coverage |
| Reconciliation | Concise disclosure | Detailed bridge and implications |
| Underwritten NOI | Not included | Only from governed accepted adjustments |
| Valuation | Limited source reference | Purchase, appraisal, and governed cap-rate analysis |
| Financing | Sourced context only | Current and proposed debt metrics |
| Loan sizing | No | Only with approved policy and complete operands |
| Sources and uses | No | Only with complete accepted inputs |
| Sensitivities | No | Only with approved versioned policy |
| Support analysis | Optional reference | Dedicated evidence-conditional analysis |
| Risk register | Ranked triage pressure points | Evidence and diligence register |
| Citations | Core sources | Field and receipt-level sources and methods |
| Appendices | Minimal | Evidence-driven detailed appendices |
| Manifest | All governed Screening sections | All 20 governed Full Underwriting section slots |
| Intended decision | Whether to allocate more underwriting attention | What accepted evidence establishes for investor/lender discussion |

## Technical enforcement

- Immutable normalized product identity: `screening` or `full_underwriting`.
- Compatibility input `underwriting` normalizes once at purchase or job creation.
- Distinct identity receipts and required PDF anchors.
- Screening cannot import the Full Underwriting view model or assumption policy.
- Full Underwriting certification cannot be satisfied by Screening output.
- Full Underwriting certification failure cannot call Screening as fallback.
- Premium requires a separate immutable surface receipt and remains false.
- Paid current jobs cannot dispatch to legacy factual renderers or fallbacks.
- Product-scoped assumption receipts prevent Screening from inheriting Full Underwriting assumptions.
- Permanent tests must prove non-reachability, not merely the absence of headings.

---

# 5. Corrected Supporting-Document Gate

## Before Full Underwriting generation

A Full Underwriting submission is eligible only after canonical adjudication establishes:

- Accepted usable T12.
- Accepted usable Rent Roll.
- At least one additional document readable enough to be classified as accepted, constrained, irrelevant, conflicting, or rejected.

An empty, corrupt, unreadable, or password-protected file does not satisfy the additional-document gate.

If it is the only additional file:

- Do not begin report generation.
- Do not create an `analysis_jobs` generation job.
- Do not consume or reserve the Full Underwriting entitlement.
- Do not create a misleading failed report.
- Keep the staged submission available.
- Tell the customer that a readable support document is required and the credit has not been used.

## After the gate is satisfied

If at least one readable support document qualifies the submission but another support file is unusable:

- Generation may continue.
- The unusable file is excluded.
- The manifest records the file, reason, affected sections, and customer impact.
- Dependent sections collapse, qualify, or omit as needed.

If readable support is weak, irrelevant, incomplete, contradictory, or unreconcilable:

- Do not block a valid-core report.
- Do not invent substitute facts.
- Collapse, qualify, or omit only dependent conclusions.
- Disclose what could not be established, why, and the effect.
- Never silently downgrade Full Underwriting to Screening.

## Required handoff

| Boundary | Only support is unusable | Readable support plus unusable file | Readable but weak/conflicting support |
|---|---|---|---|
| Submission | Precise gate failure; staged submission retained | Pass | Pass |
| Entitlement | Untouched | Consume exactly once at job creation | Consume exactly once |
| Job | None | One Full Underwriting job | One Full Underwriting job |
| Manifest | No report manifest; submission receipt only | Rejected file and impact recorded | Narrow conflict/limitation recorded |
| Report | None | Clean or limited | Normally limited |
| History | No failed-report row | Normal report entry | Normal limited report entry |
| Customer message | Readable support required; credit unused | File excluded; accepted evidence analyzed | What was unresolved and its effect |

The pre-job adjudication boundary must reuse the same parser candidates, Source Truth validators, and support adjudicator consumed by the report job. It must not create a second factual pipeline.

---

# 6. Core-Gated Publish-or-Collapse Constitution

The operational objective remains:

> 99.999% of reports with materially usable T12 and Rent Roll evidence publish.

The permitted progression is:

1. Publish the complete report.
2. Perform one bounded repair and strict recertification.
3. Publish with affected optional surfaces collapsed, omitted, or qualified.
4. Publish a materially correct safe-base report with explicit limitations and remedy.
5. Fail completely only when no materially correct report can exist.

Ordinary whole-report blocker families are limited to:

1. Missing or unusable T12.
2. Missing or unusable Rent Roll.
3. True catastrophic core contradiction or system-contract failure.
4. Fatal runtime, storage, composition, or publication failure after bounded recovery.

Optional support, AI recovery, Premium-only analysis, charts, pagination, layout, continuation headers, tables, and non-core certification defects must not automatically become complete customer failure when a materially correct report can still exist.

---

# 7. Customer and InvestorIQ Remedy State Machine

## Customer-caused source failure

Examples:

- Unusable T12.
- Unusable Rent Roll.
- Fundamental contradictory core evidence.
- A source that deeper extraction proves unusable.

Required outcome:

- Existing order enters `awaiting_replacement` or an equivalent governed state.
- Original order remains linked and traceable.
- Customer receives a replacement-document action.
- Accepted replacement evidence creates a linked child revision.
- No new charge.
- No additional spendable entitlement.
- The original entitlement remains attached to the same governed order.
- The system must not provide both a free replacement path and an extra spendable credit.

## InvestorIQ-caused defect

Examples:

- Incorrect extraction of readable evidence.
- Dropped canonical fact.
- Incorrect deterministic calculation.
- Renderer loss.
- PDF composition or extraction failure.
- Unsafe publication block.
- Runtime or storage failure.

Required outcome:

- No-cost corrected rerun first when correction is possible.
- Root report and original defect remain traceable.
- Corrected result is a linked revision.
- No entitlement restoration while a corrected rerun remains active.
- If InvestorIQ cannot safely continue, terminate the order and restore the entitlement exactly once, or apply the separately approved refund/account-credit remedy.
- Never grant a corrected rerun, restored entitlement, refund, and account credit automatically for the same failure.

## Canonical transitions

| Trigger | Governed result | Entitlement result | Prohibited duplicate |
|---|---|---|---|
| Only support unreadable before consumption | Submission needs readable support | Untouched | Failed job or restored credit |
| Catastrophic core source failure | Root order awaiting replacement | Remains attached/consumed | Free replacement plus spendable credit |
| Replacement accepted | Linked customer-replacement revision | No new entitlement | New charge |
| Correctable InvestorIQ defect | Linked corrected revision | No restoration while active | Rerun plus restored credit |
| Corrected revision publishes | Root closes as corrected | Consumed once | Original evidence overwritten |
| InvestorIQ cannot continue | Terminated system failure | Exactly-once restoration or separately selected commercial remedy | Multiple restorations or remedies |
| Expected disclosed limitation | Published limited | Remains consumed | Automatic credit for expected limitation |

---

# 8. Canonical Ownership and Atomicity

InvestorIQ must prevent jobs, reports, credits, receipts, history, manifests, and customer messaging from disagreeing.

| Authority | Intended sole owner | Required atomic boundary |
|---|---|---|
| Authenticated actor | Verified server session | Reject arbitrary browser actor/user IDs |
| Tenant/account | Server authorization plus RLS | Deny cross-tenant access |
| Product identity | Immutable job/purchase receipt | Normalize once; fail closed on mismatch |
| Stripe completion | One database completion operation | Event receipt plus complete entitlement set |
| Entitlement | Product-specific component state machine | Create, consume, restore exactly once |
| Submission | One adjudicated-submission operation | Receipt, entitlement, job, files, immutable identity |
| Worker claim | One claim RPC | Owner token, lease expiry, fencing token, attempt |
| Active execution | Lease owner and fenced state machine | Reject stale writes |
| Source acceptance | Canonical Source Truth | Unsupported facts collapse |
| Calculations | Deterministic calculation receipts | No renderer re-derivation |
| Terminal outcome | One finalization operation | Outcome, manifest, remedy, restoration receipt |
| Revision | One governed revision operation | Root/revision link, source version, remedy reason, no charge |
| Publication | One idempotent publication operation | Artifact, report row, job outcome, manifest receipt |
| History | Projection over canonical receipts | No hidden failures or duplicate current reports |
| Premium assignment | Immutable job-start receipt | False unless separately activated |

The proposed database operation names in the hardening addendum are design candidates, not proven deployed objects:

- `complete_purchase_event_v1`
- `consume_adjudicated_submission_and_create_job_v1`
- `finalize_job_outcome_v1`
- `create_governed_revision_v1`
- `publish_report_once_v1`

H2 must confirm whether equivalent deployed functions, constraints, or columns already exist before a migration is designed.

---

# 9. Normalized Launch-Blocker Ledger

| # | Launch obligation | Findings | Phase |
|---:|---|---|---|
| 1 | Server-derived identity and tenant authorization | F-001, F-002, F-068, F-070 | H1 |
| 2 | Read-only proof of deployed schema, RLS, and storage | F-061 evidence gap | H2 |
| 3 | Atomic Stripe receipt and standalone entitlement | F-009, F-062 | H3 |
| 4 | Exact launch-bundle entitlement creation | F-007, F-008, F-009 | H4 |
| 5 | Adjudicated submission and readable-support gate | F-049, F-050, F-052, F-056 | H5/H7 |
| 6 | One worker claimer, lease, fencing, and bounded calls | F-012, F-013, F-014, F-015, F-017, F-063 | H6 |
| 7 | Safe classification and causal failure taxonomy | F-049, F-050, F-052, F-059 | H7 |
| 8 | Atomic terminal outcome and restoration | F-018, F-023 | H8 |
| 9 | Executable replacement and corrected-rerun remedies | F-019, F-071, F-076 | H9 |
| 10 | Idempotent publication and Report History | F-064 | H10 |
| 11 | Faithful clean/limited/blocked/system/restored state projection | F-066, F-067, F-069 | H11 |
| 12 | One Full Underwriting identity and legacy firewall | F-041, F-042, F-043, F-045, F-075 | H12 |
| 13 | Evidence-based calculation and report delivery | F-032, F-033, F-034, F-039, F-051 | H13-H16 |
| 14 | One doctrine and operational authority | F-072, F-073, F-074, F-076 | H0 |

F-061 remains an evidence gap. No migration recommendation becomes authoritative until deployed tables, columns, constraints, RPCs, triggers, RLS policies, and storage policies are inspected read-only.

---

# 10. Existing Capability Position

The hardening audit mapped 38 capabilities:

- 25 already have meaningful canonical logic.
- 16 primarily require binding, view-model projection, or rendering.
- 9 require meaningful new calculation or policy work.
- 5 retain material evidence gaps.

## Preserve and bind

- T12 extraction and normalization.
- Rent Roll extraction.
- Unit mix.
- Occupancy and vacancy.
- T12-to-Rent-Roll reconciliation.
- EGI.
- Operating expenses.
- Expense ratio.
- NOI and NOI margin.
- Purchase price and acquisition basis.
- Appraisal and valuation evidence.
- Current debt.
- Proposed financing.
- Annual debt service.
- DSCR.
- Purchase-price LTV.
- Financing fees.
- Minimum purchase-price equity.
- Maturity facts and debt risk.
- Renovation and capital-plan evidence.
- Market evidence.
- Environmental and support findings.
- Source register.
- Report Quality Manifest.
- PDF QA and certification.

## New governed work or policy required

- Mortgage constant in the shared base deterministic layer.
- Debt yield promoted out of Premium-only logic.
- Governed in-place to underwritten NOI bridge.
- Complete sources and uses only when all operands exist.
- Loan sizing only under an approved policy.
- Rate, NOI, and value sensitivities only under a versioned policy.
- Base/downside/upside cases only under an approved policy.
- Clear rent-loss and concession lineage.
- Complete risk/diligence presentation without unsupported severity scoring.

## Never invent

- Unsupported return projections.
- IRR or equity multiple.
- Maximum proceeds.
- Refinance stress.
- Borrower credit conclusions.
- Environmental certification.
- Appraisal conclusions.
- Lender approval.
- Risk score or recommendation without approved policy.

---

# 11. Frozen Full Underwriting Report Contract

## Common section rules

- Canonical root contract: `full_underwriting_v1`.
- Each field is classified as source fact, deterministic derivation, customer input, or governed assumption.
- Each displayed material value includes lineage, basis, period, units, status, and collapse reason.
- The renderer cannot calculate, choose a new basis, or invent a substitute fact.
- Governed section states are `rendered`, `qualified`, `collapsed`, `omitted_not_applicable`, and `blocked`.
- The manifest records all 20 section slots.
- The PDF does not render empty filler sections.
- Material omissions are disclosed coherently in the evidence summary, affected analysis, risk/diligence register, and unresolved-questions section.
- Every table must pass number parity, table parity, extracted-text verification, page rendering, repeated-header rules, and clipping/overlap checks.

## Twenty-section contract

| # | Section | Class | Required outcome |
|---:|---|---|---|
| 1 | Cover and Report Identity | Structurally mandatory | Product, property, job, date, version, source period |
| 2 | Executive Investment and Financing Summary | Structurally mandatory | Concise operating, valuation, financing, and limitation orientation |
| 3 | Property, Transaction and Document Overview | Structurally mandatory | Property, transaction, and evidence population |
| 4 | Source Register and Evidence-Quality Summary | Structurally mandatory | Every file represented once with accepted/constrained/rejected state |
| 5 | T12 Operating-Performance Analysis | Mandatory with accepted T12 | Income, expense, NOI, ratios, periods |
| 6 | Rent Roll and Unit-Mix Analysis | Mandatory with accepted Rent Roll | Units, occupancy, vacancy, mix, rents, row coverage |
| 7 | T12-to-Rent-Roll Reconciliation | Mandatory when operands exist | Canonical bridge and objective variance |
| 8 | In-Place Versus Underwritten NOI Bridge | Evidence-conditional | Only governed accepted adjustments; never gross rent gap as NOI |
| 9 | Expense Composition and Material Variances | Evidence-conditional | Objective expense composition and governed variance classification |
| 10 | Valuation and Cap-Rate Scenarios | Evidence-conditional | Accepted purchase/appraisal/cap-rate bases |
| 11 | Proposed Financing and Debt Sizing | Evidence-conditional | Accepted financing; sizing only with approved policy |
| 12 | LTV, DSCR, Debt Yield, Mortgage Constant and Debt Service | Evidence-conditional | Role-separated deterministic metrics and denominators |
| 13 | Sources, Uses and Estimated Equity | Evidence-conditional | Complete only with accepted operands; otherwise minimum purchase-price equity |
| 14 | Base, Downside and Upside Scenarios | Not applicable until policy exists | Omit unless a versioned owner-approved policy exists |
| 15 | Interest-Rate, NOI and Value Sensitivities | Evidence-conditional after policy approval | Governed grids with explicit assumptions |
| 16 | Support-Document-Specific Analysis | Evidence-conditional | Separate analysis by accepted evidence family |
| 17 | Risk and Due-Diligence Register | Structurally mandatory | Evidence status, conflicts, missing items, affected analysis, follow-up |
| 18 | Unresolved Questions and Missing Evidence | Mandatory when material unresolved items exist | Honest incompleteness and required follow-up evidence |
| 19 | Calculation Methodology | Structurally mandatory | Actual formulas, versions, operands, bases, rounding |
| 20 | Appendices and Detailed Source Register | Evidence-conditional; manifest-mandatory | Detailed accepted rows, documents, receipts, reconciliations |

## Presentation reuse

Safe V2/base presentation components may be reused only after consuming the single canonical Full Underwriting view model.

Permitted candidates after rebinding include:

- Brand cover.
- Institutional operating visuals.
- Institutional debt visuals.
- Evidence bar chart.
- Core reconciliation section.
- Capital-plan section.
- Support-context renderers.

The Premium renderer and Premium model are not permitted for base Full Underwriting. Geometry or styling may be extracted into neutral presentation helpers only if no Premium receipt, model, flag, or factual authority is imported.

---

# 12. Revised Bounded Phase Roadmap

## H0: Owner and Authority Freeze

**Purpose:** Resolve product name, prices, bundle, support gate, remedies, and doctrine precedence before runtime code.

**Customer change:** None.

**Exit:** Formal owner-decision and authority receipt; doctrine/status edit only if separately authorized.

**Non-goals:** No runtime, database, Stripe, worker, parser, renderer, Premium, deployment, migration, RETEST, `AGENTS.md`, or `CLAUDE.md` work.

## H1: Authenticated Identity and Authorization

Server-derive actor identity for checkout, legal acceptance, dashboard, and admin/customer boundaries. Close F-001, F-002, F-068, and F-070.

## H2: Read-Only Deployed Schema, RLS, and Storage Verification

Inventory actual deployed tables, columns, keys, functions, triggers, policies, and buckets. Classify F-061 without changing production.

## H3: Stripe Receipt and Standalone Entitlement

Make Stripe completion and one standalone product entitlement atomic and idempotent.

## H4: Bundle Entitlement Creation

Create exactly two Screening and one Full Underwriting component from one bundle receipt. Prove duplicate-webhook and partial-use safety.

## H5: Submission, Adjudication, Reservation, and Source Registration

Implement the readable-support pre-consumption gate and one atomic job-creation boundary without a second Source Truth.

## H6: Worker Claim, Lease, Fencing, and Deadlines

Establish one claimer, lease expiry, owner token, fencing token, attempt identity, bounded downstream calls, and safe timeout behaviour.

## H7: Core/Support Classification and Causal Taxonomy

Repair classification ties, unsupported files, artifact/status disagreement, source ownership, and customer-versus-system causal attribution.

## H8: Terminal Outcome, Manifest, and Restoration

Atomically bind terminal outcome, Report Quality Manifest, remedy state, and exactly-once restoration decision.

## H9: Corrected and Replacement Revisions

Create linked, no-charge customer replacement and InvestorIQ correction revisions with exact root ownership.

## H10: Publication, Artifacts, and Report History

Make publication idempotent and converge artifact, report record, terminal job, manifest, and history.

## H11: Customer and Admin State Convergence

Project clean, limited, blocked, system-failed, restored, corrected, and awaiting-replacement states truthfully.

## H12: Full Underwriting Identity and Legacy Firewall

Seal V2/base as the single Full Underwriting lane. Prove paid jobs cannot select legacy, V1, or Premium factual authority.

## H13: Canonical Full Underwriting View Model and Existing Bindings

Bind accepted Source Truth and existing deterministic receipts into one render-ready Full Underwriting model. Preserve Screening isolation.

## H14: Governed New Calculations and Section Policy

Add only owner-approved formulas and policies, including mortgage constant, shared debt yield, and authorized bridge/sizing/scenario logic. Unsupported outputs remain null.

## H15: Renderer and Appendices

Implement the content-aware 20-slot report without renderer math, filler pages, or unsupported claims.

## H16: Manifest and PDF Certification

Bind all section states and source-to-PDF assertions to the existing Manifest and PDF Boss. Require text extraction and visual page proof.

## H17: Controlled Replays

Run the complete local/staging certification matrix with permanent fixtures and receipts. No live RETEST.

## H18: Governed Production Canary

Only after explicit owner authorization, H17 PASS, production migration/deployment approvals, and rollback rehearsal.

## H19: Simultaneous Launch Certification

Issue one signed launch or HOLD receipt for standalone Screening, standalone Full Underwriting, and the bundle.

## Phase discipline

Every phase must:

- Be independently reviewable and testable.
- End with PASS or HOLD.
- Have one recommended primary commit boundary.
- Separate database/RPC changes from runtime callers where rollback order matters.
- State exact non-goals.
- Identify a rollback boundary.
- Preserve Premium as false.
- Forbid unrelated cleanup.
- Require Rob's authorization before the dependent protected phase.

---

# 13. Migration and Production Rules

No migration may be proposed as authoritative until H2 is complete.

Any later migration requires:

1. Read-only production proof.
2. Exact object-by-object mismatch report.
3. Additive SQL with forward and rollback strategy.
4. Local or staging migration test.
5. Rob's explicit approval.
6. Separate migration and runtime commits.
7. Separate authorization for production execution.

No normal implementation prompt authorizes:

- Production migration.
- Deployment.
- Production-data changes.
- Environment-variable changes.
- Stripe product or price creation.
- RETEST 39.
- Premium activation.

---

# 14. Launch Certification Matrix

Each scenario must prove:

- Upload/adjudication result.
- Entitlement result.
- Job/revision and pipeline state.
- Publication decision.
- Customer-visible state.
- Report History state.
- Credit/restoration result.
- Manifest fields and section states.
- Database rows and uniqueness.
- Extracted-PDF text and numeric parity.
- Visual-page rendering.
- Required negative assertions.

## Mandatory scenarios

1. Valid T12 plus valid Rent Roll for Screening.
2. Valid core plus strong support for Full Underwriting.
3. Valid core plus weak or irrelevant support.
4. Valid core plus contradictory support.
5. Only support file is corrupt or password-protected.
6. One accepted support file plus another unusable file.
7. Unusable T12.
8. Unusable Rent Roll.
9. Contradictory core evidence.
10. Extraction artifact and parse-status disagreement.
11. Duplicate Stripe webhook.
12. Duplicate worker attempt.
13. Worker crash and lease expiry.
14. Slow downstream call.
15. Timeout sweep during active work.
16. Duplicate publication attempt.
17. PDF composition or extraction-loss defect.
18. Published-with-limitations Quality Manifest.
19. InvestorIQ-caused corrected rerun.
20. Customer replacement-document rerun.
21. Durable exactly-once entitlement restoration.
22. Report History after failure and retry.
23. Bundle creates exactly two Screening plus one Full Underwriting entitlement.
24. Partial bundle use and independent restoration.
25. Premium remains exactly false.
26. No legacy factual-authority path remains reachable.
27. Screening regression after Full Underwriting changes.
28. Full Underwriting cannot silently degrade into Screening.

## Universal PDF PASS requirements

- Exact identity and report-family anchor.
- Exact database outcome.
- Exact material number parity.
- Exact label, basis, period, units, and provenance.
- Extracted-text verification.
- Page-by-page visual rendering.
- No clipped or overlapping content.
- Repeated table headers where required.
- No predominantly empty analytical pages.
- No internal machinery language.
- No unsupported recommendation or assumption.
- No false completeness.
- One canonical identity and artifact.

---

# 15. Commercial Credibility

## Screening at $199

The value is evidence-backed T12 and Rent Roll triage, reconciliation, and ranked attention signals beyond a free calculator.

## Full Underwriting at $499

The value requires:

- Detailed T12 and Rent Roll analysis.
- Canonical reconciliation.
- Current and proposed debt separation.
- DSCR, debt yield, LTV, mortgage constant, and debt service.
- Accepted valuation and transaction evidence.
- Governed sources/uses or honest collapse.
- Evidence-aware support analysis.
- Risk and diligence register.
- Explicit limitations.
- Source register.
- Calculation methodology.
- Appendices.
- Certified professional PDF.

Honest positioning:

> A professional early-stage investment and financing memorandum for discussion with investors, brokers, and lenders.

InvestorIQ must not claim:

- Formal lender approval.
- Appraisal.
- Legal opinion.
- Environmental certification.
- Borrower credit review.
- ARGUS equivalence.
- Enterprise underwriting automation.
- Guaranteed 99.999% publication without a governed denominator, window, error budget, and rollback threshold.

---

# 16. Credible Schedule

The earlier 15-to-25-working-day estimate is withdrawn.

For one principal implementation lane with bounded Rob review:

- Minimum technical effort: approximately 54.5 engineer-days.
- Likely effort: approximately 92 engineer-days.
- High case: approximately 144 engineer-days.

Starting July 27, 2026, the hardening addendum estimated:

- Optimistic technical floor through H17: approximately October 9, 2026.
- Likely controlled-replay completion: approximately November 20 to 25, 2026.
- Earliest credible governed canary: approximately November 30 to December 4, 2026.
- Earliest credible simultaneous paid-launch window: approximately December 7 to 18, 2026.
- High case: February to early March 2027.

These are planning ranges, not commitments.

The date can move earlier only with:

- Immediate H0 decisions.
- Immediate H2 read-only access.
- Proven compatible production authority structures.
- Truly independent additional implementation capacity.
- No added scenario, return, refinance, Premium, or marketing scope.

The date moves later with:

- Missing or incompatible production schema authority.
- Migration/RPC incompatibility.
- New owner-policy requirements.
- Worker/generator file collisions.
- PDF engine defects.
- Failed replay, canary, or rollback rehearsal.
- Delayed protected-phase review.

Rob can responsibly announce a launch date only after H17 passes, H18's canary and rollback are approved, and no mandatory blocker remains.

---

# 17. H0 Owner Decisions

These decisions are already the recommended controlling direction and must be formally recorded in H0:

1. Screening launch price is $199.
2. Full Underwriting launch price is $499.
3. The launch bundle is approximately $699 and contains exactly two Screening entitlements and one Full Underwriting entitlement.
4. Screening and Full Underwriting launch simultaneously, or neither launches.
5. V2/base is the only public Full Underwriting foundation.
6. Legacy Underwriting and Acquisition Memo V1 cannot return as factual authority.
7. Premium remains exactly false and cannot act as launch lane or fallback.
8. Full Underwriting requires accepted T12, accepted Rent Roll, and one readable additional support document before entitlement consumption.
9. After generation begins, weak, irrelevant, incomplete, or contradictory support cannot block a valid-core report. It may only qualify, collapse, or omit dependent analysis.
10. Customer-source failure uses the same governed order and a free replacement-document revision, not an additional spendable entitlement.
11. InvestorIQ-caused defects receive a corrected rerun first.
12. If InvestorIQ cannot safely deliver, the order terminates and exactly one separately governed restoration, refund, or account-credit remedy applies.
13. Mortgage constant and debt yield are launch requirements.
14. Sources and uses, loan sizing, and scenario/sensitivity outputs render only when governed inputs and owner-approved policies exist.
15. Missing governed inputs must produce honest collapse, never invented assumptions.
16. Read-only deployed Supabase schema, RLS, and storage verification is authorized as H2 only after H1 or in a separately approved non-mutating lane.
17. Stripe product and price identifiers are deployment configuration and must not be invented.
18. Production migration, deployment, canary, RETEST, and Premium activation each require separate owner authorization.

---

# 18. Exact Next Protected Task: H0 Only

```text
InvestorIQ Phase H0: Owner and Authority Freeze

This is a documentation-only authority phase. Do not implement runtime code.

Controlling evidence:

1. docs/INVESTORIQ_PRODUCT_DOCTRINE.md
2. docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md
3. The four current July 27 InvestorIQ doctrine and operational ledgers.
4. investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md
5. investigation/STAGE-04-UNDERWRITING-CORE-CONTRACT-LAYER.md
6. investigation/STAGE-05-DETERMINISTIC-ANALYSIS-LAYER.md
7. investigation/STAGE-06-MEMO-V1-V2-LANE-RESOLUTION.md
8. investigation/STAGE-07-DOCUMENT-INGEST-AND-PARSING.md
9. investigation/STAGE-08-DATABASE-MIGRATIONS-RLS-AND-STORAGE.md
10. investigation/STAGE-09-FRONTEND-AND-CUSTOMER-SURFACES.md
11. investigation/STAGE-10-DOCTRINE-AND-ARCHIVE-RECONCILIATION.md
12. investigation/STAGE-11-FINAL-UNDERWRITING-LAUNCH-SYNTHESIS.md
13. This canonical simultaneous-launch game plan.

Record Rob's controlling owner decisions:

- Screening price: $199.
- Full Underwriting price: $499.
- Launch bundle: approximately $699 for exactly two Screening entitlements and one Full Underwriting entitlement.
- Screening and Full Underwriting launch together or neither launches.
- V2/base is the only launch Full Underwriting foundation.
- Premium remains exactly false and is not a fallback.
- Legacy Underwriting and Acquisition Memo V1 remain non-authoritative.
- Full Underwriting requires accepted T12, accepted Rent Roll, and at least one additional readable adjudicable support document before entitlement consumption.
- Once generation begins, weak, irrelevant, incomplete, or contradictory support cannot block valid-core publication; it may only qualify, collapse, or omit dependent analysis.
- Customer-source failure uses a linked replacement-document revision on the same governed order without another charge or another spendable entitlement.
- InvestorIQ defects receive a corrected rerun first. Exactly-once restoration, refund, or account credit applies only when the order cannot safely continue under the separately approved remedy.
- Mortgage constant and debt yield are launch requirements.
- Sources and uses, loan sizing, and scenarios/sensitivities render only when complete governed inputs and approved policies exist.

Exact permitted scope:

- Inspect the evidence listed above.
- Identify the exact doctrine/status files that conflict with these owner decisions.
- Prepare the smallest documentation-only amendments required to establish one current authority.
- Update the current ledgers only if explicitly authorized within this H0 task.

Explicitly forbidden:

- No runtime code.
- No database or migration work.
- No Stripe configuration.
- No worker, parser, renderer, publication, credit, remedy, frontend, or PDF changes.
- No edits to AGENTS.md or CLAUDE.md.
- No archive deletion or historical rewriting.
- No Premium activation or assignment.
- No deployment.
- No environment or production-data changes.
- No RETEST 39.
- No commit, push, merge, or branch publication unless Rob separately authorizes it.
- No unrelated cleanup.

Validation:

- Confirm every amended doctrine statement agrees with Rob's decisions above.
- Confirm historical evidence remains historical and is not presented as current authority.
- Confirm Premium remains false.
- Run documentation/terminology checks relevant to changed files.
- Run git diff --check if files change.

Return only a minimal receipt:

- PASS or HOLD.
- Exact files changed.
- Exact owner decisions recorded.
- Exact checks run and results.
- Exact doctrine conflicts closed.
- Remaining blocker.
- Confirmation that no runtime, deployment, migration, production-data, environment, RETEST 39, Premium, commit, push, or merge action occurred.

A PASS closes only H0. It does not authorize H1, H2, implementation, production access, migration, deployment, or live testing.
```

---

# 19. Final Continuation Status

```text
MASTER GAME PLAN: RECORDED
FULL-REPOSITORY AUDIT: COMPLETE
IMPLEMENTATION-HARDENING ADDENDUM: INCORPORATED
H0-FIRST CORRECTION: INCORPORATED
SIMULTANEOUS-LAUNCH RULE: PROTECTED
V2/BASE FULL UNDERWRITING FOUNDATION: PROTECTED
LEGACY FACTUAL AUTHORITY: FORBIDDEN
PREMIUM ASSIGNMENT: FALSE
RETEST 39: NOT AUTHORIZED
RUNTIME IMPLEMENTATION: NOT STARTED
DEPLOYMENT: NOT AUTHORIZED
MIGRATION: NOT AUTHORIZED
PRODUCTION-DATA CHANGE: NOT AUTHORIZED
NEXT PHASE: H0 OWNER AND AUTHORITY FREEZE ONLY
```

The shortest defensible path is not a rewrite, a Screening-first launch, a Premium activation, or another giant investigation. It is one protected phase at a time, beginning with H0, followed by authority repair, atomic paid-state ownership, source adjudication, worker safety, remedies, one Full Underwriting view model, professional rendering, complete certification, one governed canary, and one simultaneous-launch decision.
