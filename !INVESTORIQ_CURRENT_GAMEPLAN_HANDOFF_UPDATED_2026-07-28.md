# InvestorIQ Canonical Handoff and Playbook
## Updated July 29, 2026 - Canonical merged handoff/playbook

This is the canonical merged handoff/playbook, not merely a summary.

Use it together with:
- `docs/STATUS.md` for the live state snapshot.
- `docs/ROADMAP.md` for the phase-by-phase playbook.
- Deeper doctrine or audit files only when the next task explicitly needs them.

## 0. Current state of record

```text
Branch: investigation/full-repo-underwriting-audit
H0: complete
H0.5: complete
H0.75: complete
H1: complete
H2: complete
H3: complete
H4: complete
H5: complete
Latest closeout commit: bfc73f3 Harden worker claim lease and fencing
Working tree: clean
Remote: not updated because no push is authorized
Next boundary: H7 Core/support classification, taxonomy, and causal taxonomy
Next authorized packet: H7-A read-only core/support classification and causal-taxonomy map
Operating mode from H2 forward: bounded packet mode
```

Current forbidden actions remain:
- No deployment.
- No migration.
- No production data change.
- No Stripe configuration change.
- No Premium activation.
- No RETEST 39.

## 1. Canonical relationship

- The July 27 canonical Opus/Claude game plan remains the launch constitution and blocker map.
- The July 28 independent audit v3 is an amendment, not a replacement.
- ChatGPT Keeper recommendation remains: pass as an amendment, hold as a replacement.
- H0, H0.5, H0.75, H1, H2, H3, and H4 are complete.
- H5 is complete.
- H6 is complete.
- H7 is next.
- Operating mode from H2 forward is bounded packet mode.

## 2. Audit v3 preservation

### Five proven determinism claims
- Factual recovery calls were not pinned with explicit determinism controls.
- LLM QA output could suppress deterministic findings and create blockers.
- `@aws-sdk/client-textract` was imported but missing from `package.json`.
- No reproducibility harness existed for the same fixture run three times.
- The old delivery gate let non-core presentation findings block whole reports.

### Consolidated findings F1-F12
- F1: missing determinism controls on factual recovery paths.
- F2: LLM QA authority risk over deterministic findings and blockers.
- F3: whole-report blocking on non-core/presentation defects.
- F4: missing Textract dependency.
- F5: no reproducibility test in the QA suite.
- F6: Stripe webhook / entitlement atomicity risk.
- F7: bundle SKU gap.
- F8: inconsistent product identity terms in code and docs.
- F9: large report-generation surface area.
- F10: no repeatability assertion across QA scripts.
- F11: documentation sprawl, including 1,009,606 markdown lines across 102 tracked markdown files.
- F12: root temp/test artifact clutter and other cleanup candidates.

### H0.5 fixes completed
- Pinned deterministic recovery requests.
- Added a content-hash recovery cache.
- Demoted LLM QA from publish authority.
- Added the missing Textract client dependency.
- Added the 3x reproducibility smoke.

### H0.75 fixes completed
- Added the terminal failure tier map.
- Added the failure section state map.
- Routed Tier 2 failures to section states.
- Added Tier 3 bounded recovery state.
- Added publish-or-collapse outcome fixtures.

### H4 completion facts
- Bundle creates exactly 2 Screening entitlements and 1 Underwriting entitlement.
- Deterministic IDs are `sessionId`, `sessionId#2`, and `sessionId#3`.
- Bundle quantity is fixed to one.
- No `bundle` value is persisted as `report_purchases.product_type`.
- Duplicate, partial-existing, and concurrent recovery are verified.

### H5 completion facts
- `H5-A` read-only mapping completed.
- `H5-B` staged-source registration hardening completed.
- The authoritative staged-source manifest is validated before entitlement selection or job/source creation.
- Every staged path uses the authenticated `staged/{auth.uid()}/` prefix, remains unique, and is matched against a locked `storage.objects` row in `staged_uploads`.
- `doc_type` is explicit and restricted to approved aliases.
- Missing, forged, duplicated, unsafe, cross-user, or materially mismatched staged sources fail closed.
- Entitlement selection still uses `FOR UPDATE SKIP LOCKED`.
- Job creation, source registration, and entitlement consumption remain atomic inside `consume_purchase_and_create_job`.
- No migration has been applied.
- No deployment occurred.
- No production data changed.
- No Stripe configuration changed.
- Premium remains false.
- RETEST 39 remains unauthorized.

### H6 completion facts
- `H6-A` read-only worker claim, lease, fencing, deadline, and dead-letter recovery map completed.
- `H6-B` implementation commit: `bfc73f3` - Harden worker claim lease and fencing.
- Explicit worker attempt identity is persisted and fenced on every worker-owned mutation.
- Lease expiry and deterministic reclaim behavior are persisted in the database.
- Stale worker writes cannot advance, publish, fail, restore entitlement, or overwrite a newer attempt.
- Entitlement restoration is fenced to the current authorized attempt.
- Retry exhaustion produces an explicit dead-letter terminal state.
- Repository-defined claim and requeue contracts replace the undefined split authority.
- No migration has been applied.
- No deployment occurred.
- No production data changed.
- No Stripe configuration changed.
- Premium remains false.
- RETEST 39 remains unauthorized.

### Still not proven until later
- Production runtime behavior.
- Deployed schema, RLS, and storage truth.
- Stripe and bundle atomicity.
- Full launch certification.

## 3. Full Underwriting launch content requirements

The $499 Full Underwriting report must survive analyst and credit-officer scrutiny, including principals with $200M-$500M+ portfolios.

### 90-second analyst credibility test
- Every material number ties back to a document, page, or label where available.
- The methodology is re-performable.
- Gaps and unknowns are explicit.
- Break-even and debt-service stress are visible.

### Credit officer questions the report must answer
1. What does it earn?
2. Can it service debt?
3. What if I am wrong?
4. What is the rent roll telling me?
5. What can I not see?

### Required lender and debt metrics
- DSCR.
- Debt yield promoted out of Premium-only logic.
- LTV.
- Mortgage constant.
- Annual debt service.
- Denominator and source basis for every metric.
- Break-even occupancy.
- Break-even rent.
- DSCR-constrained maximum proceeds, under approved policy.
- Rate, NOI, and value sensitivity grid, under approved policy.
- Rollover and expiry concentration where Rent Roll evidence supports it.

### Required credibility sections
- Source register.
- Calculation methodology appendix.
- Risk and diligence register.
- Unresolved questions.
- Explicit limitations.
- Evidence quality summary.
- Every gap disclosed.

### Exclusions unless separately authorized
- BUY/SELL language.
- Investment recommendations.
- Lender approval claims.
- IRR.
- Equity multiple.
- Exit projections.
- Unsupported appraisal, legal, or environmental certification claims.

## 4. Current completion progress

- H0 complete.
- H0.5 complete.
- H0.75 complete.
- H1 complete.
- H2 complete.
- H3 complete.
- H4 complete.
- H5 complete.
- H6 complete.
- H7 next.

## 5. Fresh-chat operating order

- Upload `docs/STATUS.md` first.
- Upload `docs/ROADMAP.md` when broader phase detail is needed.
- Upload this canonical handoff/playbook when deeper audit or product-doctrine context is needed.
- Do not use stale H5-next wording for the current next step. The current next packet is H6-A.

## 6. Keep the handoff short and useful

- Keep daily handoff work focused on the current packet only.
- Do not reintroduce archive cleanup, runtime code changes, deployment, migration, production data, Stripe configuration, Premium activation, or RETEST 39 unless explicitly authorized.
- Preserve historical evidence in git history and the canonical docs, not in extra daily chatter.
