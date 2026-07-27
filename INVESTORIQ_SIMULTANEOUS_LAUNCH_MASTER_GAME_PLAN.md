# InvestorIQ Simultaneous Screening + Full Underwriting Launch Master Game Plan

**Repository:** `rob01-web/investoriq`  
**Branch:** `investigation/full-repo-underwriting-audit`  
**Prepared:** July 27, 2026  
**Status:** Planning only. No production implementation, merge to `main`, deployment, migration, environment change, customer-data change, credit/job mutation, or RETEST performed.

## Decision in one page

InvestorIQ should launch **Screening ($199) and Full Underwriting ($499) together or launch neither**. The repository can reach that launch without a rewrite, but not safely in the next few business days. The fastest credible window is approximately **15 to 25 working days after implementation begins**, assuming dedicated engineering, immediate read-only production schema access, no new product scope, and green controlled certification. (Stages 8-11; F-061, F-064, F-072)

The eventual Full Underwriting foundation is the existing **V2/base Underwriting path**, renamed and sealed as Full Underwriting. Do not resurrect legacy Underwriting, do not make Acquisition Memo V1 the customer lane, and keep `PREMIUM_ACQUISITION_UNDERWRITING_V1=false`. Premium is an optional, separately certified expansion, never a fallback. (Stages 6, 10; F-041, F-044, F-072)

The architecture is salvageable. The dominant problem is duplicated authority at handoffs, not insufficient analytical code. Preserve Source Truth, deterministic calculations, V2 orchestration, PDF Boss, Delivery Gate, quality manifests, and Premium isolation. Repair ownership and state boundaries in small commits.

## 1. Executive verdict

**Can the existing repository reach simultaneous launch without a rewrite?** Yes, through bounded authority and lifecycle repairs.

**Is Full Underwriting defensible at $499?** Yes, if it delivers reconciled source evidence, current/proposed debt separation, defensible financing metrics, transparent limitations, professional tables, methodology, source register, and a certified PDF. It must not claim lender approval, appraisal, ARGUS equivalence, or ungoverned refinance certainty. (Product Doctrine; Premium Doctrine; Stages 5-6)

**Is next-week launch credible?** No, not from the current state. The date becomes conditionally credible only after the read-only schema inventory, identity boundary, one claimer with lease/fencing, atomic paid-state tests, core-admission matrix, customer outcome contract, remedies, and source-to-PDF certification all pass. A launch date should not be announced before those gates are green.

**Required launch decision:** simultaneous launch of both products after the shared P0 obligations and Full Underwriting-specific obligations pass. No Screening-only launch.

**Premium:** remain exactly false and unassigned. No Premium activation, no RETEST 39, and no silent Premium-to-base downgrade.

## 2. What InvestorIQ already has

InvestorIQ already has most of the analytical ingredients. The missing proof is that they survive one canonical source-to-PDF chain with correct ownership, status, provenance, and remedy.

| Capability | Existing evidence | Current delivery condition | Action |
|---|---|---|---|
| T12 extraction/normalization | `api/parse/extract-job-text.js`, `api/parse/parse-doc.js`, T12 recovery | Candidate and parsed artifacts exist; persistence/provenance can disagree | Bind accepted T12 receipt and lineage |
| Rent Roll extraction | `api/parse/parse-doc.js`, Textract/table helpers, spreadsheet paths | Multiple candidates allowed; source version is not explicit | Bind accepted rows and source version |
| Unit mix, occupancy, vacancy | deterministic acquisition/rent-roll contracts | Calculation exists; customer projection is partial | Reuse through canonical view model |
| Rent loss/concessions | Rent Roll/T12 analysis paths | Evidence binding and final rendering vary | Repair and bind |
| T12/Rent Roll reconciliation | `deterministic-core-reconciliation-analysis.js` and input contract | Canonical reconciliation exists; other paths can disagree | Make receipt sole authority |
| EGI, OpEx, expense ratio, NOI, NOI margin | T12 parser and Financial Intelligence contracts | Often available; renderer can re-derive or omit | Bind calculation receipts |
| NOI bridge | acquisition/Premium analysis paths | Not one customer-facing canonical bridge | Extend V2 view model |
| Purchase basis, appraisal, cap rates | valuation/source contracts | Conditional and evidence-sensitive | Reuse only accepted bases |
| Current debt | debt support routing and debt contracts | Current/proposed role separation is not universal | Preserve current-debt authority |
| Proposed financing | Premium/acquisition financing contracts | Must not invent terms or become second pipeline | Consume accepted inputs only |
| Debt service, mortgage constant, DSCR, debt yield, LTV | deterministic debt/DSCR/capital contracts | Existing math, incomplete lineage/display proof | Bind and certify |
| Loan sizing, financing fees, sources/uses, equity | partial acquisition/Premium contracts | Some formulas exceed launch doctrine | Use accepted inputs; collapse unsupported totals |
| Rate/value/scenario sensitivity | scenario/Premium contracts | Policy and inputs are not universally governed | Launch only explicit governed cases; defer broad stress engine |
| Maturity/refinancing risk | debt/support evidence paths | Qualitative treatment possible; full stress policy deferred | Launch evidence-based treatment |
| Renovation, market, appraisal, environmental | support authority and Premium components | Conditional sections exist | Reuse accepted evidence; collapse otherwise |
| Risk/diligence and source register | institutional diligence/source contracts and artifacts | Exists internally; customer projection incomplete | Bind to view model |
| Methodology and limitations | doctrine, methodology contracts, Dashboard copy | Customer state normalization is incomplete | Repair and certify |
| Report Quality Manifest | `lib/report-quality-manifest.js` and worker persistence | Exists, but not every customer outcome is coherently projected | Make required for every outcome |
| PDF QA/certification | PDF Boss, institutional certification/recovery, QA inventory | Strong primitives; paid path not fully proven | Preserve strict certification and bounded repair |

**Answer to the key distinction:** InvestorIQ mostly has the analysis. It does not yet safely deliver all of it. The main work is **bind, repair, and certify**, not rewrite.

## 3. Why duplicated authority returned

### Historical leftovers

Retiring the former Underwriting path removed the old product as an intended lane, but left compatibility code, aliases, test fixtures, documentation, and callers:

- `api/_lib/acquisition-memo-renderer.js`
- `api/_lib/acquisition-memo-projection.js`
- legacy V1/V2 aliases and fallback reconstruction
- `api/admin/run-eligible-jobs-once.js` calling legacy `claim_next_job`
- dead `src/pages/ReportHistory.jsx` using `properties` and a fake download
- archived Master Context, Core Valid Failure, and Semantic Authority ledgers

These are historical leftovers. They become dangerous when still reachable, imported, searched, or described as current. (Stages 6, 8-10; F-027, F-042, F-063, F-067, F-073)

### Duplications recreated in the newer pipeline

The newer pipeline reintroduced second truths at boundaries:

- **Identity:** request type, mode resolver, V1/V2 aliases, Premium assignment, renderer selection. (F-026, F-041, F-043)
- **Facts:** Source Truth, V2 customer-surface derivation, legacy fallback fields, renderer calculations. (F-032, F-033, F-037)
- **Claiming:** `claim_and_consume_job` versus `claim_next_job`; neither has proven lease/fencing. (F-013, F-014, F-063)
- **Billing:** `stripe_events` marker, purchase lookup, purchase insert are separate. (F-009, F-062)
- **Publication:** storage, report row, job status, quality manifest, and credit reconciliation are separate. (F-018, F-064)
- **Customer state:** Dashboard reports, jobs, artifacts, local dismissal, and dead ReportHistory split truth. (F-067, F-069)
- **Outcome labels:** canonical Delivery Gate state becomes Ready/Failed in `dashboardCustomerCopy.js`. (F-066)
- **Premium receipt:** read-then-write assignment without a proven uniqueness guard. (F-031, F-065)

### Current and required owners

| Decision | Current writers/readers | Required sole authority |
|---|---|---|
| Authenticated identity | Supabase session plus browser IDs in checkout/legal | Server-derived authenticated actor |
| Tenant ownership | RLS where present, service-role routes, client filters | Server authorization plus tenant-scoped policies |
| Product identity | selector, Stripe metadata, RPC, aliases | One normalized product/surface identity |
| Entitlement | webhook and `report_purchases` | Atomic purchase-completion operation |
| Credit consumption/restoration | `consumed_at`, worker, restoration artifact, profile counter | Entitlement state machine and terminal outcome |
| Stripe receipt | `api/webhook.js` insert | Unique event receipt |
| Worker claim | two RPC paths and direct updates | One claim RPC with lease/fence |
| Source facts | parser candidates, Source Truth, fallbacks | Canonical Source Truth package |
| Metrics | deterministic contracts plus renderer derivation | Calculation receipts |
| Delivery | Delivery Gate, worker flags, Dashboard mapping | Delivery Authority |
| Publication | storage/report/status/manifest writes | Idempotent publication operation |
| History | Dashboard jobs/reports plus dead page | One terminal-job/history projection |
| Remedy | admin regeneration and generic UI | Durable linked remedy state |
| Premium | flag, timestamp, receipt helper | Immutable job-start receipt, default false |

**Permanent prevention rule:** a writer creates a canonical receipt once. Downstream readers may project it, validate it, or certify it, but may not reinterpret factual authority, product identity, delivery eligibility, or failure ownership. Every new field must name its owner, writers, readers, idempotency key, and rollback behavior before implementation.

## 4. Frozen product contracts

### Screening, $199

Purpose: rapid capital triage across several candidate acquisitions.

- Required: valid T12 and valid Rent Roll.
- Core output: NOI integrity, OpEx, expense ratio, unit mix, occupancy/vacancy, break-even, reconciliation, ranked pressure points, data sufficiency, concise triage signal.
- Support documents: not required for submission and must not be implied as necessary.
- Financing: only sourced/current terms if available; no full refinance model.
- Report identity: Screening Report, not Acquisition Memo or Underwriting.
- Whole-report blockers: unusable T12, unusable Rent Roll, catastrophic core contradiction/system failure, fatal delivery failure.
- Weak optional evidence: collapse or qualify dependent content.

### Full Underwriting, $499

Purpose: professional property-level investment and financing memorandum for an initial investor, broker, or lender discussion.

- Required: valid T12, valid Rent Roll, and at least one additional non-empty, readable, non-password-protected support document.
- Weak, irrelevant, contradictory, or incomplete support after upload gate: do not fail the order; collapse/qualify dependent sections and disclose the impact.
- Must be materially deeper than Screening, not merely longer.
- Must distinguish sourced facts, calculated results, customer inputs, and governed assumptions.
- Must show current debt separately from proposed financing.
- Must never invent acquisition terms, loan terms, rates, values, or returns.
- Must not silently become Screening or silently fall back from a promised Premium surface.

### Required Full Underwriting sections

1. Cover and report identity.
2. Executive investment and financing summary.
3. Property, transaction, and document overview.
4. Source register and evidence-quality summary.
5. T12 operating performance.
6. Rent Roll and unit mix.
7. T12-to-Rent-Roll reconciliation.
8. In-place versus underwritten NOI bridge.
9. Expense composition and material variances.
10. Valuation and accepted cap-rate scenarios.
11. Proposed financing and accepted debt sizing.
12. LTV, DSCR, debt yield, mortgage constant, and debt service.
13. Sources, uses, and estimated equity with explicit exclusions.
14. Base/downside/upside only where assumptions are governed and labeled.
15. Interest-rate, NOI, and value sensitivities only where inputs are governed.
16. Support-document-specific analysis.
17. Risk and diligence register.
18. Unresolved questions and missing evidence.
19. Calculation methodology.
20. Appendices and detailed source register.

Every section is mandatory in the contract, but its content is conditional on accepted evidence. A missing section must show a limitation, reason code, and customer impact in the manifest and PDF. A report-level core failure blocks; a support-specific failure collapses only the dependent section. (Product Doctrine; Premium Doctrine; Stages 5-7)

## 5. Normalized launch-blocker ledger

The correct unit is a launch obligation, not a raw finding count.

| Launch obligation | Findings | Product | Why it blocks paid launch | Resolution phase | Closure evidence |
|---|---|---|---|---|---|
| Actor identity and tenant authorization | F-001, F-002, F-068, F-070 | All | Browser-controlled user IDs and weak customer/admin boundary can expose or bind another account | P1 | Server-derived actor tests, cross-user legal/checkout tests, authenticated route matrix |
| Production schema/RLS/storage contract | F-061 | All | Repository migrations do not prove deployed schema, policies, RPCs, buckets, or uniqueness | P0 | Read-only deployed Supabase inventory and compatibility report; no assumed migrations |
| One worker claim/lease/execution authority | F-012, F-013, F-014, F-015, F-017, F-020, F-063 | All | Jobs can duplicate, stall, be reclaimed while active, or fail invisibly | P2 | One claimer, lease/fence, bounded calls, crash/expiry/timeout tests |
| Atomic paid lifecycle | F-009, F-018, F-023, F-031, F-062, F-064, F-065 | All | Entitlements, receipts, credits, reports, and history can disagree | P3 | Duplicate webhook/claim/publication/restoration tests and state reconciliation |
| Core admission and causal failure taxonomy | F-049, F-050, F-052, F-053, F-054, F-055, F-058, F-059 | All | Ambiguous or unsupported inputs can become wrong core facts or generic customer blame | P4 | Content classifier matrix, unsupported/password file handling, provider/persistence taxonomy, constrained-core tests |
| Single Full Underwriting identity | F-024, F-025, F-026, F-041, F-042, F-043, F-045, F-047, F-075 | Underwriting | V1/V2/Acquisition Memo aliases can select different schemas under one paid identity | P5 | Paid jobs resolve only sealed Full Underwriting identity; legacy factual path unreachable |
| Customer outcome/history truth | F-066, F-067, F-069 | All | Clean, limited, blocked, failed, restored, and terminal history states can be hidden or mislabeled | P6 | State projection, refresh convergence, terminal history, tenant download, mobile checks |
| Executable remedies | F-019, F-071, F-076 | All | Customers lack linked replacement and corrected-rerun paths | P7 | Replacement/system rerun state machine, no duplicate charge, history linkage, restoration assertions |
| Source-to-PDF integrity | F-032, F-033, F-037, F-039, F-051, F-064 | Underwriting primarily | Existing analysis can be omitted, re-derived, mislabeled, or published without certified evidence | P8 | View-model/PDF/manifest parity, extracted text, visual PDF, bounded repair and recertification |
| Doctrine and archive authority | F-072, F-073 | All | Conflicting current-looking ledgers can redirect future implementation | P0 | One controlling hierarchy, explicit archive non-authority, no stale “current” instructions |
| Reliability objective governance | F-074 | All | 99.999% cannot be claimed or operated without SLO/error-budget machinery | P9 | Formal denominator, telemetry, error budget, alert and rollback threshold |

F-061 is an evidence gap until read-only production inspection proves otherwise. It must not trigger speculative migrations.

## 6. Canonical end-state authority chain

```text
authenticated actor + tenant
 -> atomic Stripe receipt and entitlement
 -> atomic entitlement consumption + job/files
 -> immutable product/surface identity
 -> one leased worker claim
 -> extraction artifacts
 -> content-validated document roles
 -> canonical Source Truth
 -> deterministic calculation receipts
 -> section eligibility/limitation receipts
 -> canonical Screening or Full Underwriting view model
 -> product renderer
 -> PDF artifact
 -> strict PDF Boss certification
 -> Delivery Authority
 -> atomic publication/customer outcome
 -> Report History projection
 -> remedy projection
```

Required atomic boundaries:

1. Stripe event receipt and entitlement creation.
2. Entitlement consumption, job creation, and file registration.
3. Claim ownership with lease expiry and fencing.
4. Terminal job outcome, credit restoration result, manifest reference, and customer outcome.
5. Publication report/object identity and idempotency.
6. History projection that never removes terminal failures.

## 7. Phased implementation plan

### P0. Product and authority freeze

- **Objective:** lock prices, product names, support doctrine, Full Underwriting identity, Premium false, and one authority hierarchy.
- **Findings:** F-041, F-045, F-072, F-075.
- **Files:** `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`, `docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md`, `ELITE_ROADMAP.md`, `UNDERWRITING_GAMEPLAN_v2.md`, `AGENTS.md`, `CLAUDE.md`.
- **Database/storage:** none.
- **Dependencies:** none.
- **Non-goals:** no runtime changes, no archive deletion.
- **Customer change:** none.
- **Tests:** product identity/terminology assertions.
- **Exit:** one machine-obvious current doctrine and no unresolved contract contradiction.
- **Rollback:** documentation-only commit.
- **Critical path:** yes for product/view-model work; can run parallel with P1.

### P1. Read-only deployed schema/RLS/storage verification

- **Objective:** compare deployed Supabase tables, columns, keys, constraints, RPC signatures, policies, triggers, and buckets with runtime callers.
- **Findings:** F-061.
- **Files:** six active migrations; `api/webhook.js`; consume/queue RPC migrations; worker; parser; report/storage callers.
- **Database/storage:** read-only only. No migration proposal until inventory completes.
- **Dependencies:** none.
- **Non-goals:** no data changes, no migration execution.
- **Customer change:** none.
- **Tests:** compatibility report and controlled schema query.
- **Exit:** production contract classified as compatible, incompatible, or unknown by object.
- **Rollback:** none.
- **Critical path:** yes.

### P2. Authenticated identity and tenant boundary

- **Objective:** server-derive checkout/legal actors and prevent unauthenticated/customer/admin boundary leaks.
- **Findings:** F-001, F-002, F-068, F-070.
- **Files:** `api/create-checkout-session.js`, `api/checkout-session.js`, `api/legal-acceptance.js`, `src/App.jsx`, `src/pages/Pricing.jsx`, `src/pages/Dashboard.jsx`.
- **Database/storage:** verify RLS; no migration assumed.
- **Dependencies:** P1 for policy confirmation.
- **Non-goals:** no billing redesign.
- **Customer change:** safe account-bound checkout and legal acceptance.
- **Tests:** unauthenticated dashboard, cross-user IDs, legal read/write, admin/customer route matrix.
- **Exit:** browser cannot choose actor or tenant.
- **Rollback:** route/frontend commit.
- **Critical path:** yes.

### P3. Single worker claimer and bounded execution

- **Objective:** remove competing claimers; add owner, lease, fencing, bounded fetches, and safe timeout behavior.
- **Findings:** F-012, F-013, F-014, F-015, F-017, F-020, F-063.
- **Files:** `api/admin-run-worker.js`, `api/admin/run-eligible-jobs-once.js`, queue RPC migrations, `.github/workflows/worker-kick.yml`.
- **Database/storage:** likely additive lease/fence contract, only after P1.
- **Dependencies:** P1.
- **Non-goals:** no report rendering changes.
- **Customer change:** fewer duplicate, abandoned, or falsely failed jobs.
- **Tests:** concurrency, crash, lease expiry, fencing, slow call, timeout sweep.
- **Exit:** one active owner and no false reclaim.
- **Rollback:** RPC and worker commits separate.
- **Critical path:** yes.

### P4. Atomic entitlement, terminal outcome, restoration, publication

- **Objective:** ensure paid state has one idempotent outcome.
- **Findings:** F-009, F-018, F-023, F-031, F-062, F-064, F-065.
- **Files:** `api/webhook.js`, consume RPC, worker terminal helpers, `api/_lib/report-delivery-output.js`, Premium receipt helper.
- **Database/storage:** likely required after P1, not assumed now.
- **Dependencies:** P1, P3 claim contract.
- **Non-goals:** no Premium activation.
- **Customer change:** duplicate events/publications stop creating inconsistent state; restoration converges.
- **Tests:** duplicate webhook, retry after partial success, duplicate receipt, publication replay, restoration replay.
- **Exit:** one entitlement/job/report outcome per operation key.
- **Rollback:** database and runtime commits separately.
- **Critical path:** yes.

### P5. Core admission and causal failure taxonomy

- **Objective:** validate content, fail closed on ambiguity, and preserve customer/system ownership.
- **Findings:** F-049, F-050, F-052, F-053, F-054, F-055, F-058, F-059.
- **Files:** `api/parse/classify-documents.js`, `api/parse/extract-job-text.js`, `api/parse/parse-doc.js`, worker, Source Truth contracts.
- **Dependencies:** P4 outcome boundary; can design in parallel.
- **Non-goals:** no AI expansion, no new factual authority.
- **Customer change:** useful documents publish with constrained sections; true core failures explain themselves.
- **Tests:** ties, wrong labels, unsupported/password files, provider failure, persistence mismatch, constrained core, contradiction.
- **Exit:** only three constitutional core blocker families remain.
- **Rollback:** parser/worker boundary.
- **Critical path:** yes.

### P6. Customer outcome and history contract

- **Objective:** distinguish clean, limited, blocked, system-failed, restored, and replacement-awaiting states.
- **Findings:** F-066, F-067, F-069.
- **Files:** `src/lib/dashboardCustomerCopy.js`, `src/lib/jobFailureMessaging.js`, `src/pages/Dashboard.jsx`, `src/pages/ReportHistory.jsx`, delivery/history helpers.
- **Dependencies:** P4/P5 canonical outcomes.
- **Non-goals:** no new backend authority.
- **Customer change:** truthful status and complete history without second refresh.
- **Tests:** all state projections, refresh convergence, tenant-bound signed download, mobile/browser checks.
- **Exit:** one active history authority and no local dismissal hiding terminal truth.
- **Rollback:** frontend-only.
- **Critical path:** yes.

### P7. Executable customer remedies

- **Objective:** link customer replacement reruns and InvestorIQ corrected reruns to the original job/report.
- **Findings:** F-019, F-071, F-076.
- **Files:** `api/jobs/request-revision.js`, Dashboard remedy UI, worker/admin remediation helpers, history projection.
- **Dependencies:** P5/P6.
- **Database/storage:** likely additive remedy relation/status after P1.
- **Non-goals:** no silent retry or automatic customer charge.
- **Customer change:** every terminal outcome has an owned next action.
- **Tests:** replacement source version, system rerun, restoration, no duplicate charge, history link.
- **Exit:** remedy state durable and customer-visible.
- **Rollback:** remedy API/UI commit separate from worker.
- **Critical path:** yes.

### P8. Full Underwriting contract and canonical view model

- **Objective:** seal V2/base as Full Underwriting without resurrecting V1/legacy.
- **Findings:** F-033, F-039, F-041, F-042, F-043, F-045, F-047, F-075.
- **Files:** V2 orchestrator, document/final assembly/customer-surface contracts, Source Truth and deterministic contracts.
- **Dependencies:** P0, P5, P6.
- **Non-goals:** no Premium lane, no full refinance stress product.
- **Customer change:** clear Full Underwriting identity and materially deeper report.
- **Tests:** legacy non-reachability, Screening isolation, view-model contract.
- **Exit:** one identity, one view model, one renderer path.
- **Rollback:** view-model/renderer commit.
- **Critical path:** yes.

### P9. Bind existing calculations and support evidence

- **Objective:** bring existing metrics into the Full Underwriting view model with lineage and limitation states.
- **Findings:** F-032, F-034, F-035, F-036, F-037, F-038, F-039, F-051, F-054, F-057, F-058.
- **Files:** deterministic debt/DSCR/valuation/capital/reconciliation contracts, support authority, Financial Intelligence.
- **Dependencies:** P8.
- **Non-goals:** no unsupported loan sizing, return, or refinance assumptions.
- **Customer change:** financing tables, source register, methodology, explicit limitations.
- **Tests:** metric lineage, current/proposed debt, source register, section collapse.
- **Exit:** every displayed material metric has source, formula, basis, status, and collapse reason.
- **Rollback:** calculation-binding commit.
- **Critical path:** yes.

### P10. Professional renderer, manifest, and PDF certification

- **Objective:** deliver a professional source-to-PDF Full Underwriting report and preserve Screening separately.
- **Findings:** F-032, F-033, F-039, F-051, F-064, F-066.
- **Files:** V2 renderer/final assembly, `lib/report-quality-manifest.js`, PDF Boss/recovery helpers, `api/generate-client-report.js`.
- **Dependencies:** P6, P8, P9.
- **Non-goals:** no page padding, no Premium activation.
- **Customer change:** credible financing memorandum with tables, appendices, limitations, and source register.
- **Tests:** extracted text, visual page rendering, bounded repair, recertification, manifest parity.
- **Exit:** failed certification never publishes; final PDF matches canonical view model.
- **Rollback:** renderer-only commit.
- **Critical path:** yes.

### P11. Controlled simultaneous launch certification

- **Objective:** prove both products together before paid launch.
- **Findings:** closure evidence for all launch obligations.
- **Files:** `tests/qa`, fake Supabase harness, deployment receipts, frontend/browser checks.
- **Dependencies:** P1-P10.
- **Non-goals:** no RETEST 39 unless separately authorized after pre-canary approval.
- **Customer change:** none until explicit go decision.
- **Tests:** certification matrix below, build, browser/mobile, rollback rehearsal.
- **Exit:** all mandatory gates green, no unresolved P0/P1 launch obligation, explicit canary approval.
- **Rollback:** deployment boundary.
- **Critical path:** yes.

## 8. Atomic ownership table

| Entity | Current writers | Current readers | Conflict | Intended authority/boundary | Failure behavior |
|---|---|---|---|---|---|
| Authenticated user | Supabase auth; browser payloads | checkout/legal/Dashboard | IDs can be spoofed | Auth session/server actor | Reject mismatch |
| Tenant/account | RLS plus service-role routes | all data routes | service-role bypass | Server authorization + RLS | deny cross-tenant |
| Report/job ownership | consume RPC, client filters, worker | worker/Dashboard | partial ownership proof | job row with immutable user/product | reject orphan |
| Product type | selector, metadata, resolver, aliases | all lanes | V1/V2 drift | normalized product identity | fail closed |
| Entitlement | webhook, admin credit UI | Dashboard/RPC/worker | read-then-write | atomic entitlement operation | idempotent retry |
| Credit consumption | `consumed_at`, job creation | worker/Dashboard | split state | entitlement state machine | no double consume |
| Credit restoration | worker purchase update, event | Dashboard/admin | event after update | terminal outcome receipt | durable retry |
| Stripe receipt | `stripe_events` insert | webhook | marker can commit alone | unique event receipt | safe replay |
| Worker claim | two RPCs/direct updates | worker/admin | no lease/fence | one claim RPC | one owner |
| Lease/fence | none proven | timeout/admin | active reclaim risk | lease token + expiry + fencing | stale writes rejected |
| Active state | worker direct updates | Dashboard/admin | events separate | state machine transition | atomic/eventual reconciliation |
| Timeout | 60-minute sweep | worker | no heartbeat | lease expiry authority | reclaim only expired |
| Accepted doc status | extractor/parser/worker | Source Truth | status/artifact mismatch | Source Truth admission | preserve cause |
| Source Truth | canonical package plus fallbacks | calculations/renderers | second factual paths | one accepted package | unsupported field collapses |
| Metrics | deterministic contracts/renderers | report/PDF | re-derivation | calculation receipt | no render-time math |
| Terminal outcome | worker status/artifacts/restoration | Dashboard/history | non-atomic | terminal outcome operation | durable reconciliation |
| Publication eligibility | Delivery Gate/PDF Boss/worker flags | publisher/UI | local reinterpretation | Delivery Authority | no unsafe publish |
| Published report | storage/report row/status | history/download | duplicates | idempotent publication | one artifact identity |
| Report History | Dashboard jobs/reports/dead page | customer | split truth | one projection | terminal jobs retained |
| Quality Manifest | worker/admin QA | customer/admin | not always outcome-bound | required per outcome | publish only with required manifest |
| Remedy | admin regeneration/403 revision route | Dashboard/admin | no customer path | linked remedy state | owned next action |
| Premium assignment | flag/timestamp/receipt | worker/renderer | read-then-write | immutable job receipt | no silent downgrade |

## 9. Launch certification matrix

Every test must assert pipeline state, customer result, publication permission, credit result, manifest state, PDF content, and database state.

| Case | Expected outcome |
|---|---|
| Valid core Screening | `published_clean`, one tenant-bound report, Screening identity |
| Valid core + strong support Underwriting | `published_clean`, Full Underwriting identity, financing tables |
| Weak/irrelevant support | `published_limited`, dependent sections collapsed/qualified, no whole-report failure |
| Contradictory support | `published_limited`, conflict and customer impact disclosed |
| Corrupt/password support | upload rejection or `published_limited` if core valid; no support facts accepted |
| Unusable T12 | `blocked_core`, exact T12 reason, restored entitlement, replacement CTA |
| Unusable Rent Roll | `blocked_core`, exact Rent Roll reason, restored entitlement, replacement CTA |
| Contradictory core | `blocked_core`, contradiction evidence, restored entitlement |
| Artifact/status disagreement | `failed_system` or bounded recovery, never unsafe publication |
| Duplicate Stripe webhook | one event receipt and one entitlement result |
| Duplicate worker attempt | one lease owner, stale writer rejected |
| Worker crash/lease expiry | reclaim only after expiry, no double consumption |
| Slow downstream call | bounded timeout and durable terminal outcome |
| Timeout during active work | active lease protected from false failure |
| Duplicate publication | one report/object/history record |
| PDF composition defect | one bounded repair, strict recertification, no bypass |
| Published with limitations | manifest and customer state both `published_limited` |
| InvestorIQ corrected rerun | linked no-cost rerun, original history retained |
| Customer replacement rerun | linked replacement job, no duplicate charge |
| Credit restoration | durable receipt and immediate customer-visible entitlement |
| Failure/retry history | failed job remains visible through retry and publication |
| Premium | exact false, no new Premium assignment |
| Legacy reachability | paid current job cannot select V1/legacy factual authority |
| Screening regression | no Underwriting identity/sections in Screening output |

Final PDF gates require both machine extraction and visual rendering. A calculation in source code is not delivered until the certified PDF preserves its value, label, basis, provenance, and limitation state.

## 10. Critical path and credible window

**Critical path:** schema inventory -> identity -> claim/lease -> paid lifecycle -> core taxonomy -> customer states/history -> remedies -> Full Underwriting view model -> calculation binding -> renderer/PDF certification -> simultaneous launch certification.

**Safe parallel work:** doctrine freeze, schema inventory, fixture preparation, customer-state projection against mocked canonical outcomes, Full Underwriting view-model design, and calculation coverage mapping.

Assuming one strong full-stack engineer plus focused review:

- Freeze/contract: 1-2 days.
- Schema inventory: 1-2 days.
- Identity boundary: 2-4 days.
- Claimer/lease: 4-7 days.
- Paid-state atomicity: 4-7 days.
- Core taxonomy: 3-5 days.
- Customer states/history: 3-5 days.
- Remedies: 3-5 days.
- Full Underwriting binding/view model: 7-12 days.
- Renderer/PDF/manifest: 5-8 days.
- Certification: 3-5 days.

With parallel work, the credible total is **15-25 working days after implementation begins**. Next-week simultaneous launch is **not credible today**. A launch date can responsibly be announced only after the production schema inventory, claim/lease tests, paid lifecycle tests, core matrix, outcome projection, remedies, and source-to-PDF gates are green.

## 11. Commercial and lender-discussion readiness

Screening is worth $199 because it reconciles T12/Rent Roll evidence and ranks attention better than a calculator. Full Underwriting is worth $499 when it adds evidence-backed current/proposed debt separation, DSCR/debt yield/LTV/mortgage constant, valuation bridge, support-specific diligence, limitations, source register, methodology, appendices, and certified PDF presentation.

The bundle is commercially coherent because it follows the investor workflow: multiple Screening decisions followed by one finalist Full Underwriting report. Implement it as explicit entitlements and a clear bundle receipt, not synthetic Stripe session IDs or browser-controlled quantity metadata. (F-007, F-008, F-009)

Honest positioning: professional early-stage investment and financing memorandum for discussion with investors, brokers, and lenders. Not formal loan approval, appraisal, legal opinion, environmental certification, borrower-credit review, ARGUS, or enterprise underwriting automation.

## 12. Irreducible owner decisions

1. Approve simultaneous launch-or-neither: **recommend yes**.
2. Approve V2/base public rename to Full Underwriting after identity sealing: **recommend yes**.
3. Approve one-readable-support-file submission gate with nonblocking support failure: **recommend yes**.
4. Approve restored-credit plus linked replacement rerun and no-cost system rerun: **recommend yes**.
5. Approve immediate read-only production Supabase schema/RLS/storage inventory: **recommend yes**.
6. Keep Premium false and prohibit RETEST 39 during planning: **recommend yes**.
7. Approve controlled staging/canary only after P0/P1 gates and rollback proof: **recommend yes**.

## 13. First protected implementation prompt

```text
You are implementing Phase 0 only on branch investigation/full-repo-underwriting-audit.

Do not deploy, merge to main, run migrations, change production data, alter credits/jobs, activate Premium, or run RETEST 39.

Create a planning-only product and authority freeze for the simultaneous launch of:
- Screening Report: $199
- Full Underwriting Report: $499
- Launch bundle: approximately $699

Use only the current Product Doctrine, Premium Doctrine, Activation Runbook, and Stage 03-11 evidence.

Record these invariants:
1. Screening requires valid T12 + valid Rent Roll and remains a narrower triage product.
2. Full Underwriting is the sealed V2/base foundation, not legacy Underwriting, Acquisition Memo V1, or Premium.
3. Full Underwriting requires one non-empty, readable support file at submission, but weak or contradictory support never blocks valid core publication.
4. Whole-report blockers are limited to unusable T12, unusable Rent Roll, catastrophic core contradiction/system failure, or fatal delivery failure.
5. Clean, limited, blocked, system-failed, credit-restored, and replacement-awaiting outcomes are distinct.
6. Premium remains exactly false and is not a fallback.
7. One intended authority is named for product identity, Source Truth, deterministic calculations, section eligibility, Delivery Authority, PDF certification, publication, Report History, and remedies.
8. Known competing authorities are recorded: claim_and_consume_job versus claim_next_job, webhook read-then-write purchase completion, V1/V2 identity overlap, Dashboard Ready/Failed normalization, dead ReportHistory properties path, and current-looking archive ledgers.

Do not change runtime behavior, delete archive files, propose migrations, or implement auth, worker, database, rendering, billing, or remedy repairs in this phase.

Return a minimal receipt:
- exact files changed
- invariants recorded
- tests run, if any
- PASS or HOLD
- HOLD if any doctrine conflict remains unresolved

A PASS receipt does not authorize deployment or the next phase.
```

## Final recommendation

The shortest defensible simultaneous path is not a Screening-first launch and not a rewrite. It is a sealed shared platform followed by two product projections: Screening for triage and V2/base Full Underwriting for professional financing discussion. Start with the planning freeze, then obtain the read-only deployed schema/RLS/storage inventory before touching migrations or worker contracts.
