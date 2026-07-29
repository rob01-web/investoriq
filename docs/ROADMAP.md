# InvestorIQ Roadmap

Current authority:
- `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`
- `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
- `docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md`
- `!INVESTORIQ_CURRENT_GAMEPLAN_HANDOFF_UPDATED_2026-07-28.md`

Operating rules:
- Document-driven only.
- Fail-closed behavior.
- Deterministic math.
- Institutional tone.
- No hype.
- No BUY/SELL language.
- No fabricated narrative.
- No unnecessary duplication between Screening and Underwriting.
- Premium remains exactly false until separately authorized.

Current state:
- H0 complete.
- H0.5 complete.
- H0.75 complete.
- H1 complete.
- H2 complete.
- H3 complete.
- H4 next.
- Operating mode from H2 forward: bounded packet mode.

Phase playbook:

| Phase | Goal | Allowed scope | Forbidden scope | Recommended bounded packets | Proof required to close | Status |
|---|---|---|---|---|---|---|
| H0 | Owner and authority freeze plus handoff consolidation | Docs only: `docs/STATUS.md`, `docs/ROADMAP.md`, and the canonical handoff file | Runtime code, tests, deploy, migration, production data, Stripe, Premium, RETEST 39 | H0-A current authority docs; H0-B archive cleanup only after review | Live status, roadmap, and handoff are coherent and reviewable | Complete |
| H0.5 | Determinism proof and flakiness containment | Deterministic runtime/test patches only for factual recovery paths and proof harnesses | Broad audit, renderer, Stripe, deploy, migration, production data, Premium, RETEST 39 | H0.5-1.1 pin recovery requests; 1.2 content-hash cache; 1.3 demote LLM QA authority; 1.4 Textract dependency; 1.5 3x reproducibility harness | Identical fixture inputs produce identical canonical outputs, and the harness stays green on a clean checkout | Complete |
| H0.75 | Publish-or-Collapse tiering | Declarative failure-tier maps, section-state maps, and targeted proof fixtures | Delivery behavior changes beyond the new tier/state wiring, renderer changes, Stripe, deploy, migration, production data, Premium, RETEST 39 | 2.1 tier map; 2.2 section-state map; 2.3 Tier 2 routing; 2.4 Tier 3 bounded recovery; 2.5 outcome fixtures | Tier 1 still blocks core truth failures, Tier 2 collapses or qualifies sections, Tier 3 recovers before final block | Complete |
| H1 | Authenticated identity and authorization | Server-side ownership enforcement for report access and report start/generation authority | UI redesign, renderer, Stripe, deploy, migration, production data, Premium, RETEST 39 | H1-A read-only identity map; H1-B runtime hardening smoke | Owner access works, cross-user access fails, admin bypass stays on the intended path, and mismatched identity inputs are rejected | Complete |
| H2 | Read-only deployed schema, RLS, storage verification | Read-only inspection of deployed schema evidence, RLS policies, and storage path assumptions | Edits, migrations, production changes, runtime behavior changes, Premium, RETEST 39 | H2-A read-only map; H2-B smallest schema/RLS/storage repair plan only if H2-A finds a gap | Deployed schema, policy, and storage evidence either matches code assumptions or the gaps are documented | Complete |
| H3 | Stripe receipt and standalone entitlement atomicity | Read-only verification and smallest fixes around receipt creation, entitlement consumption, and idempotency | Bundle work, later launch phases, production data changes, Premium, RETEST 39 | H3-A receipt/entitlement map; H3-B smallest atomicity patch | Receipt and entitlement consumption are atomic, idempotent, and owner-bound | Complete |
| H4 | Bundle entitlement creation | Bundle SKU wiring, entitlement creation, and purchase-path checks | Later phase work, production changes, Premium, RETEST 39 | H4-A bundle map; H4-B smallest bundle creation patch | Bundle purchase creates exactly the required entitlements and nothing extra | Not started |
| H5 | Submission, adjudication, reservation, source registration | Intake, adjudication, reservation, and source-registration logic | Later phase work, production changes, Premium, RETEST 39 | H5-A flow map; H5-B smallest reservation/adjudication patch | Submission state, reservation, and source registration are deterministic and recoverable | Not started |
| H6 | Worker claim, lease, fencing, deadlines | Worker claim semantics, lease fencing, deadline handling, and dead-letter recovery | Later phase work, production changes, Premium, RETEST 39 | H6-A worker map; H6-B smallest fencing patch | One claim per job, leases expire safely, and stale work cannot win | Not started |
| H7 | Core/support classification and causal taxonomy | Source/evidence classification and failure taxonomy alignment | Later phase work, production changes, Premium, RETEST 39 | H7-A taxonomy map; H7-B smallest classifier patch | Core vs support taxonomy is stable, explicit, and testable | Not started |
| H8 | Terminal outcome, manifest, restoration | Terminal states, report manifesting, and exactly-once restoration behavior | Later phase work, production changes, Premium, RETEST 39 | H8-A terminal map; H8-B restoration patch | Terminal outcomes are explicit and restoration paths do not double-grant or duplicate work | Not started |
| H9 | Corrected and replacement revisions | Corrected reruns, replacement revisions, and lineage-preserving reroute logic | Later phase work, production changes, Premium, RETEST 39 | H9-A revision map; H9-B smallest correction patch | Corrected and replacement revisions preserve lineage and avoid duplicate charge or duplicate report state | Not started |
| H10 | Publication, artifacts, Report History | Publication persistence, artifact tracking, and report-history surfaces | Later phase work, production changes, Premium, RETEST 39 | H10-A publication map; H10-B smallest history/artifact patch | Published artifacts and report history match the actual delivery state | Not started |
| H11 | Customer/admin state convergence | Reconciliation between customer-visible and admin-visible state | Later phase work, production changes, Premium, RETEST 39 | H11-A convergence map; H11-B smallest reconciliation patch | Customer and admin surfaces agree on report state, blockers, and resolution status | Not started |
| H12 | Full Underwriting identity and legacy firewall | Full Underwriting identity boundaries and legacy-path exclusion | Legacy resurrection, later phase work, production changes, Premium, RETEST 39 | H12-A identity/firewall map; H12-B smallest firewall patch | Legacy paths cannot masquerade as current Full Underwriting authority | Not started |
| H13 | Full Underwriting view model and source binding | View-model assembly and source-truth binding | Legacy resurrection, later phase work, production changes, Premium, RETEST 39 | H13-A view-model map; H13-B smallest source-binding patch | Every displayed Full Underwriting value ties back to an approved source basis | Not started |
| H14 | Full Underwriting calculations and lender metrics | Calculation logic, lender metrics, and approved sensitivity analysis | Legacy resurrection, later phase work, production changes, Premium, RETEST 39 | H14-A metrics map; H14-B smallest calculation patch | Every financial metric is reproducible, labeled, and sourced | Not started |
| H15 | Full Underwriting renderer/content contract | Renderer contract, content boundaries, and section integrity | Legacy resurrection, later phase work, production changes, Premium, RETEST 39 | H15-A renderer contract map; H15-B smallest rendering patch | The renderer obeys the approved content contract without inventing unsupported narrative | Not started |
| H16 | Manifest/PDF certification | Manifest coupling, PDF certification, and bounded recovery | Legacy resurrection, later phase work, production changes, Premium, RETEST 39 | H16-A certification map; H16-B smallest certification patch | Manifest, PDF, and certification state agree before any customer release | Not started |
| H17 | Controlled replays | Deterministic replay harnesses and fixture control | Unsanctioned launch changes, production changes, Premium, RETEST 39 | H17-A replay map; H17-B smallest replay patch | Controlled replays remain stable and reproduce the same canonical outputs | Not started |
| H18 | Governed canary | Governed pilot launch control, rollback, and evidence logging | Uncontrolled launch, production changes, Premium, RETEST 39 | H18-A canary map; H18-B smallest pilot-control patch | Canary rules, rollback, and evidence logs are explicit and enforceable | Not started |
| H19 | Simultaneous launch certification | Final certification that Screening and Full Underwriting can launch together | Partial launch claims, production changes, Premium, RETEST 39 | H19-A certification map; H19-B smallest final certification patch | Screening and Full Underwriting both meet the governed launch bar together, or neither launches | Not started |

H2 packet details:
- H2-A is read-only only.
- Verify deployed schema expectations from migrations, types, and source code.
- Verify RLS assumptions from migration files and policies where available.
- Verify Supabase storage bucket and path assumptions from code and migrations.
- Identify gaps between code assumptions and deployed schema evidence.
- Make no edits and no production changes.
- H2-B exists only after H2-A.
- H2-B is the smallest schema, RLS, or storage verification/repair plan that follows from H2-A.
- Do not run a migration unless Rob explicitly authorizes it.

Full Underwriting Launch Content Requirements:

### 90-second analyst credibility test
- Every material number ties back to a document, page, or label where available.
- Methodology is re-performable.
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

Audit v3 preservation:
- Independent audit v3 is an amendment, not a replacement.
- All five determinism claims were proven against checked-out code.
- H0.5 fixes completed: pinned deterministic recovery requests, content-hash recovery cache, LLM QA demoted from publish authority, Textract dependency added, 3x reproducibility smoke.
- H0.75 fixes completed: terminal failure tier map, failure section state map, Tier 2 section-state routing, Tier 3 bounded recovery state, outcome fixtures.
- Still not proven until later: production runtime behavior, deployed schema/RLS/storage truth, Stripe/bundle atomicity, and full launch certification.
- Summary-level findings preserved: F1 deterministic recovery controls, F2 LLM authority risk, F3 whole-report blocking on non-core defects, F4 missing Textract dependency, F5 no reproducibility harness, F6 Stripe atomicity risk, F7 bundle SKU gap, F8 inconsistent product identity, F9 large report-generation surface, F10 no repeatability assertion in QA scripts, F11 markdown sprawl risk, F12 root temp/test artifact clutter risk.

Daily handoff instruction:
- In a fresh chat, upload `docs/STATUS.md` first.
- Upload `docs/ROADMAP.md` when broader phase detail is needed.
- Upload this canonical handoff/playbook when deeper audit or product-doctrine context is needed.
- Do not use the stale H0-A wording for the current next step; H2-A is now the next packet.
