# Stage 11: Final Underwriting Launch Synthesis

**Repository:** `rob01-web/investoriq` only  
**Branch:** `investigation/full-repo-underwriting-audit`  
**Baseline:** `main` `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`  
**Inspection status:** complete repository evidence synthesis. No production code, merge, deploy, environment change, customer-data change, credit/job mutation, migration execution, or live RETEST.

## Deliverable 1: Executive verdict

**Screening launchable this week:** **No, not as an unqualified paid launch.** The Screening lane is the strongest candidate and is salvageable, but P0 identity/auth, worker claim/lease, ingest classification, schema, and customer-state blockers remain.

**Full Underwriting launchable this week:** **No.** The current V2/base lane is the recommended destination, not launch-approved. It still shares identity with Acquisition Memo/V1, carries legacy fallbacks, requires optional support at submission, lacks a faithful limited-publication state, and has unresolved publication/credit/history atomicity.

**Architecture salvageable:** **Yes.** The spine is salvageable. Source Truth, deterministic analysis, PDF Boss, Delivery Gate, and Premium isolation are valuable. The system needs authority consolidation and bounded state-contract repair, not a rewrite.

**Rewrite required:** **No.** A rewrite would multiply risk and destroy the strongest existing contracts. Use small, independently revertible boundary repairs.

**Lane:** launch Screening first after P0, then rename and launch the V2/base Underwriting lane as **Full Underwriting** only after its identity and submission contract are sealed. Do not launch V1 or Premium as the base lane.

**Remain feature-flagged off:** Premium Acquisition Underwriting V1 external assignment, external premium enforcement, any later refinance-stress phase, legacy V1 factual authority, and any ungoverned internal-test controls.

**Exact P0 blockers:** F-001, F-002, F-012, F-013, F-041, F-049, F-050, F-061, F-066, F-072. The broader P0 repair set also includes F-009, F-014, F-018, F-023, F-052, F-063, F-064, F-068, F-069, and F-070 because they can corrupt paid state, ownership, publication, or customer authorization even where not currently counted as BLOCKER severity.

**Shortest safe paid path:** first seal authenticated identity and legal acceptance, establish one claim/lease authority, make core classification fail closed, prove the deployed schema/storage/RLS contract, then run the minimum end-to-end Screening and base-Underwriting contract suite. Launch Screening only if those gates pass. Full Underwriting follows after optional support is made section-optional and the customer surface distinguishes clean, limited, blocked, and restored outcomes.

## Deliverable 2: Complete pipeline maps

### Screening

`/pricing` or `/dashboard` selector `screening` -> `/api/create-checkout-session` -> Stripe `checkout.session.completed` -> `api/webhook.js` writes `stripe_events` and `report_purchases` -> Dashboard reads unconsumed `report_purchases` -> `Dashboard.handleUpload` stages `staged_uploads/{user}/{batch}/...` -> `consume_purchase_and_create_job` -> `analysis_jobs` + `analysis_job_files` -> `queue_job_for_processing` -> `api/admin-run-worker.js` calls `claim_and_consume_job` -> `api/parse/extract-job-text.js` -> `api/parse/parse-doc.js` -> canonical `source-truth-package.js` and deterministic Screening contracts -> Screening renderer/pipeline -> `api/generate-client-report.js` -> PDF Boss/certification -> Delivery Gate -> `generated_reports` + `reports` -> Dashboard Report History -> signed download, failure artifact, or credit restoration.

### Legacy Underwriting

Same purchase/upload/worker spine, but legacy aliases and fallback reconstruction can enter the shared Underwriting path. Legacy renderer/projection helpers remain reachable in `api/_lib/acquisition-memo-renderer.js`, `acquisition-memo-projection.js`, and compatibility logic. This lane is not a safe launch identity because it can re-derive facts and share identity with V2.

### Acquisition Memo V1

`underwriting` request -> report-type/mode resolver -> V1 memo projection/renderer (`acquisition-memo-renderer.js`, `acquisition-memo-projection.js`) -> shared worker/PDF/publication path. V1 has a different section/schema contract from V2 but shares production identity, creating F-041/F-045. It is compatibility presentation only, not factual authority.

### Acquisition Memo V2 / base Underwriting

`underwriting` -> same entitlement and ingest spine -> Source Truth -> deterministic core/reconciliation/debt/valuation/capital contracts -> `acquisition-memo-v2-orchestrator.js` and V2 customer-surface/document/final-assembly contracts -> final report renderer -> PDF Boss -> Delivery Gate -> publication/history/remedy. This is the recommended base lane, but it needs an immutable Full Underwriting identity and legacy firewall before launch.

### Premium Acquisition Underwriting V1

`underwriting` plus capability/timestamp -> `premium-acquisition-underwriting-v1-job-start-surface-receipt.js` persists immutable assignment -> canonical receipts -> Premium model/validated model/deterministic analysis -> Premium renderer -> external certification -> unchanged PDF Boss -> worker independently verifies certificate -> Delivery Gate/publication. Missing certificate must fail internally, never silently downgrade. Current capability is false and Premium remains off.

### Recommended launch Full Underwriting lane

`underwriting` -> one normalized `full_underwriting` product identity -> atomic purchase entitlement -> authenticated staged upload -> content-validated core classification -> one Source Truth package -> one deterministic calculation layer -> one Full Underwriting customer-surface contract with `clean`, `limited`, `blocked`, `failed_system`, `credit_restored` -> one renderer -> bounded PDF Boss repair/recertification -> one Delivery Authority -> one publication state machine -> one tenant-scoped Report History -> linked replacement or no-cost system rerun remedy. V2 is the implementation base; the public name should be Full Underwriting after identity normalization, not before.

## Deliverable 3: Authority graph

**Recommended hierarchy:** Product Doctrine -> Premium Doctrine for Premium-only expansion -> immutable report identity/surface receipt -> content-validated Source Truth -> deterministic calculation receipts -> section eligibility -> customer-surface projection -> renderer -> PDF Boss/certification -> Delivery Authority -> publication state machine -> Report History projection -> customer remedy projection.

- **Factual authority:** canonical Source Truth package and accepted document facts. Current competitors: parser candidates, filename/type hints, legacy fallback reconstruction, renderers, and customer copy.
- **Calculation authority:** deterministic financial-intelligence and acquisition-analysis contracts. Current competitors: renderer re-derivation, legacy memo helpers, monthly-to-annual variants, and Premium/base schemas.
- **Section eligibility:** canonical coverage/authority adjudication plus Publish-or-Collapse. Current competitor: UI support requirement and broad worker missing-artifact gates.
- **Surface assignment:** immutable job-start surface receipt. Current competitors: request type, mode aliases, feature flags, and legacy renderer selection.
- **Quality detection:** report quality manifest and QA/Boss contracts. Current competitor: admin dashboard heuristics.
- **PDF repair:** bounded institutional PDF recovery, then strict recertification. It must not become factual authority.
- **Delivery eligibility:** canonical Delivery Gate decision. Current competitors: worker-local flags, legacy aliases, Dashboard normalization.
- **Final publication authority:** worker publication enforcement after Delivery Gate and PDF certification. Current competitors: report-row heuristics, storage writes, and late status updates.
- **Billing/credit authority:** Stripe event/session identity -> atomic entitlement operation -> consume/create-job RPC -> terminal restoration operation. Current split: webhook marker/read/insert, purchase RPC, worker restoration, profile counter.
- **Customer-history authority:** `analysis_jobs` for all terminal outcomes plus `reports` for published artifacts, projected through one Dashboard history contract. Current split: Dashboard `reports` + recent jobs, dead `ReportHistory` `properties` table, local dismissal.

Competing authorities are the root of F-009, F-013, F-026, F-027, F-031, F-033, F-041, F-042, F-043, F-045, F-047, F-052, F-055, F-063, F-064, F-065, F-066, and F-075.

## Deliverable 4: Publication-blocker matrix

| ID | Trigger/current outcome | Core valid? | Safe report possible? | Constitutional? | Ownership/remedy | Repair/priority |
|---|---|---|---|---|---|---|
| F-001/F-002 | Unauthenticated checkout metadata and legal acceptance | Yes | Yes, but authorization is unsafe | No, security blocker | InvestorIQ auth flaw; route repair | P0 |
| F-005/F-012 | worker kick hides failures, scheduler/timebox/fetch stalls | Often yes | Yes | Technical failure only | InvestorIQ; durable terminal state | P0 |
| F-013/F-014/F-063 | competing claimers, no lease/fence/owner | Yes | Yes | Technical failure only | InvestorIQ; one claim RPC + lease | P0 |
| F-018/F-023 | failure restoration or receipt writes occur after non-atomic state changes | Yes | Yes | Technical failure only | InvestorIQ; atomic outcome/receipt | P0 |
| F-041/F-042/F-045 | V1/V2 identity and legacy fallback confusion | Yes | Yes | Contract blocker, not core | InvestorIQ; one launch identity | P0 |
| F-049 | ambiguous rules classification | Unknown | Sometimes | Valid only if resulting core is validated unusable; classifier itself is not | InvestorIQ ingest; fail closed/unclassified | P0 |
| F-050/F-059 | unsupported/provider/persistence failures collapse to generic missing-core | Often yes | Yes | Invalid as customer-document blocker | InvestorIQ; preserve causal taxonomy | P0 |
| F-052/F-055 | artifact/status mismatch and duplicate core candidates | Yes | Yes | Technical integrity blocker | InvestorIQ; durable versioned evidence | P1 |
| F-061 | base schema/storage/RLS cannot be proven from active migrations | Yes | Yes | Launch blocker, not core | InvestorIQ/deployment governance | P0 |
| F-064 | duplicate publication/history/object divergence | Yes | Yes | Technical publication blocker | InvestorIQ; idempotent publication | P0 |
| F-066 | limited/held/clean outcomes map to Ready/Failed | Yes | Yes | Product contract blocker | InvestorIQ frontend | P0 |
| F-071/F-076 | no corrected rerun/replacement/revision path | Yes | Yes | Remedy blocker | InvestorIQ; linked remedy | P1 |
| F-072 | duplicated contradictory doctrine | Yes | Yes | Governance blocker | InvestorIQ; one current authority | P0 |

**The only three valid whole-report core blocker families are:** (1) missing or unusable T12, (2) missing or unusable Rent Roll, (3) true catastrophic core contradiction or system contract failure. A reconciliation variance alone, optional support absence, missing debt/appraisal/renovation, provider outage, low AI confidence, or unsupported optional document must publish with collapse/qualification or classify as an internal system failure, not blame the customer.

## Deliverable 5: Legacy-versus-current feature matrix

| Capability | Legacy Underwriting | V1 | V2/base Underwriting | Premium |
|---|---|---|---|---|
| factual source authority | unsafe legacy fallback | requires canonical rewrite | current best candidate | consume-only canonical |
| presentation | safe pieces only | compatibility adapter | safe base renderer | additive certified renderer |
| deterministic core math | reuse only after receipt binding | unsafe if local | safe contracts, audit fallbacks | safe when validated |
| current/proposed debt | unsafe where mixed | requires canonical rewrite | reusable contracts with separation checks | explicitly governed |
| Source Truth | must not own | must not own | canonical consumer | canonical consumer |
| publish-or-collapse | duplicate/legacy | adapter only | base authority path | preserves base, adds certification |
| PDF Boss | safe shared infrastructure | safe shared infrastructure | safe shared infrastructure | unchanged authority |
| customer identity | duplicate/conflicting | duplicate/conflicting | needs normalized Full Underwriting identity | immutable Premium surface |
| QA/receipts | historical/partial | compatibility | current base artifacts | independent certificate/receipt |
| status | legacy/dead/duplicate | permanently retire as product identity | launch candidate | feature-flagged expansion |

Safe reusable presentation: table/layout helpers, evidence register rendering, PDF composition helpers, report formatting. Safe reusable deterministic calculations: only receipt-bound functions with explicit operands and lineage. Requires canonical rewrite: any V1/V2 identity bridge, legacy fallback fact reconstruction, debt role fallback, and publication/history resolver. Permanently retire: V1 as a customer product, legacy factual authority, dead `ReportHistory` properties path, ungoverned internal test branch, and duplicate master-context ledgers after historical preservation.

## Deliverable 6: Full Underwriting product gap analysis

| Capability | Status for recommended lane | Decision |
|---|---|---|
| executive summary, operating analysis, T12, Rent Roll | present in base contracts/surfaces | launch-required |
| occupancy, unit mix, rent positioning, expense composition | deterministic support exists, lineage/display gaps remain | launch-required |
| valuation, current debt, DSCR, debt yield, LTV, break-even | contracts exist; proposed/current separation and evidence binding need sealing | launch-required |
| proposed financing | Premium-side governed inputs exist; later stress policy is not authorized | launch-required only for accepted proposed terms, no speculative sizing |
| renovation/capital plan, market survey, appraisal comparison, environmental | supported as optional evidence/sections | launch-desirable, collapse when unsupported |
| risks and diligence, source reconciliation, methodology, source register | present across contracts and artifacts but customer projection incomplete | launch-required |
| appendices | available through evidence/document contracts | launch-desirable |
| refinance matrices, max proceeds, binding LTV/DSCR, stability tiers | explicitly deferred | post-launch expansion |

The lane is commercially credible only if it is sold as source-aware Full Underwriting, not as a guaranteed refinance model or Premium V1. It must show current debt separately from proposed financing, expose unavailable sections honestly, and retain source reconciliation disclosures.

## Deliverable 7: Root cause of whack-a-mole failures

The dominant cause is **duplicated authority**. Split claimers and missing leases allow two workers to act on one job. Non-atomic state transitions let purchase, job, artifact, PDF, report history, and credit state diverge. Identity ambiguity lets V1/V2/Acquisition Memo/Underwriting select different schemas. Active legacy fallbacks and re-derived facts create second truths. Schema divergence and missing deployed-schema proof make runtime callers assume contracts that may not exist. Parser inconsistency and overstrict support/core gates convert distinct failures into generic blockers. Fragmented frontend state then hides or mislabels the backend outcome. Contradictory doctrine and archive reachability feed stale instructions back into implementation. Inadequate end-to-end contract tests prove helpers, not paid production dispatch.

These causes interact: a duplicate claim can start a job without a surface receipt; a missing receipt causes a valid job to fail; terminal failure updates status, restoration, and artifacts separately; Dashboard polls only one state slice and maps the result to Ready/Failed; an archived ledger can then describe the repair as complete while the customer remedy is still absent. This is why unrelated defects recur after apparently successful local fixes.

## Deliverable 8: Recommended launch architecture

Use one Screening lane and one Full Underwriting lane over one canonical Source Truth and one deterministic calculation layer. Give each product one normalized customer-surface schema and one renderer. Use one Delivery Authority and one publication state machine with explicit `queued`, `processing`, `published_clean`, `published_limited`, `blocked_core`, `failed_system`, and `credit_restored` outcomes. Keep PDF Boss strict; allow only bounded repair followed by recertification. Add a governed safe-base fallback only for an unpromised optional expansion, never for an externally promised Premium job. Make Report History consume the terminal job state plus published artifact state from one projection. Give admins read-only quality/triage observability and controlled remediation actions. Expose customer remedies as linked replacement rerun for validated core failure and no-cost system rerun for InvestorIQ failure. Keep Premium off until assignment, certification, no-silent-downgrade, and rollback are revalidated.

**Rename decision:** yes, V2/base Underwriting should be renamed and launched as Full Underwriting only after the identity contract is normalized and legacy V1/V2 aliases are prevented from changing the lane.

## Deliverable 9: Prioritized implementation plan

### P0 before any paid launch

**P0-A identity and authorization:** resolve F-001, F-002, F-068, F-070. Files: `api/checkout-session.js`, `api/create-checkout-session.js`, `api/legal-acceptance.js`, `src/App.jsx`, `src/pages/Pricing.jsx`, `src/pages/Dashboard.jsx`. Invariant: server derives actor identity; customer routes cannot expose admin or other-user data. Migration impact: none initially; verify RLS. Tests: unauthenticated metadata, cross-user legal read/write, admin/customer route matrix. Rollback: route-only revert. Deployment: one server/frontend deploy. Live test: no live customer RETEST required; controlled auth contract only.

**P0-B one claim and paid-state authority:** resolve F-009, F-012, F-013, F-014, F-018, F-023, F-063, F-064. Files: webhook, queue migrations/RPCs, `api/admin-run-worker.js`, `api/admin/run-eligible-jobs-once.js`, `api/_lib/report-delivery-output.js`. Invariant: one idempotent entitlement operation, one claim with owner/lease/fence, one terminal outcome, one idempotent publication. Migration impact: required deployed schema/RPC/unique/index proof and likely additive migration. Tests: duplicate webhook, duplicate claim, timeout fencing, publication replay, restoration replay. Rollback: separate DB/RPC and worker commits, no mixed deploy. Deployment: coordinated server plus migration only after explicit authorization. Live test: prohibited under current user instruction.

**P0-C core admission and blocker taxonomy:** resolve F-049, F-050, F-059 and constrain F-058. Files: `api/parse/classify-documents.js`, `api/parse/extract-job-text.js`, `api/parse/parse-doc.js`, worker, Source Truth contracts. Invariant: ambiguity/unreadable/provider/persistence defects retain ownership; only validated catastrophic core evidence blocks. Migration impact: artifact schema may need version/provenance fields. Tests: tie classification, unsupported type, provider outage, partial constrained core, true contradiction. Rollback: parser/worker boundary commit.

**P0-D customer outcome contract:** resolve F-066 and the customer-facing portion of F-069. Files: `src/lib/dashboardCustomerCopy.js`, `src/pages/Dashboard.jsx`, report delivery/history helpers. Invariant: clean, limited, blocked, system-failed, and restored outcomes are distinct and history never hides terminal failures. Migration impact: none if projected from existing artifacts; otherwise additive status/receipt fields. Tests: all state projections, refresh convergence, signed tenant download. Rollback: frontend-only contract commit.

**P0-E schema and doctrine gate:** resolve F-061 and F-072. Files: six active migrations plus deployment schema inventory, `docs/*`, `AGENTS.md`, `CLAUDE.md`, roadmap/index records. Invariant: one current doctrine and proven production schema/RLS/storage contract. Migration impact: schema inspection first; no migration execution in audit. Tests: schema compatibility query in a controlled environment. Rollback: documentation commit separate from any schema change.

### P1 immediately after launch

F-015, F-016, F-017, F-019, F-020, F-021, F-022, F-031, F-032, F-033, F-034, F-035, F-037, F-038, F-039, F-042, F-043, F-044, F-045, F-047, F-051, F-052, F-053, F-054, F-055, F-057, F-058, F-067, F-069, F-071, F-073, F-075, F-076. Focus on provenance, retries, complete customer remedy, history consolidation, and terminology.

### P2 hardening

F-003, F-004, F-007, F-008, F-010, F-011, F-036, F-040, F-046, F-056, F-060, F-074 and remaining quality/observability hardening.

### Safe deferred

Premium external activation, full refinance stress/scenario policy, max proceeds, binding constraints, stability tiers, and any 99.999% claim until an enforceable SLO exists.

### Dead-code cleanup and doctrine consolidation

Retire dead `ReportHistory` path, legacy V1 customer identity, duplicate archive master contexts, stale root ledgers, and internal diagnostic branches after historical preservation and explicit review. Do not delete historical evidence during the audit.

## Deliverable 10: This-week launch plan

**Mon Jul 27:** freeze the audit record, approve P0-A through P0-E as separate commits, build the minimum contract-test harness, and obtain the missing deployed schema/RLS/storage inventory. No production change yet.

**Tue Jul 28:** implement and test P0-A identity/auth and P0-B claim/idempotency in isolated commits. If schema or RPC proof fails, stop. Do not deploy.

**Wed Jul 29:** implement P0-C core admission taxonomy and P0-D customer outcome projection. Run focused suites, full build, and controlled artifact replays. Screening and Underwriting remain off the public launch decision.

**Thu Jul 30:** deploy only after all P0 tests pass and rollback points are recorded. Run controlled internal validation without customer credits or live RETEST. Validate Screening path first, then base Underwriting with optional support collapse and failure cases.

**Fri Jul 31:** launch/no-launch gate. Launch Screening only if auth, claim, schema, core admission, publication idempotency, history, restoration, and rollback checks pass. Launch Full Underwriting only if identity normalization, optional-support behavior, limited-publication projection, and remedy checks also pass. Otherwise launch neither. Premium stays off.

Rollback criteria: any cross-user read/write, duplicate claim/publication, credit mismatch, hidden failed job, customer-blamed system error, unverified schema/RLS contract, or PDF certification bypass means immediate no-launch/rollback.

## Deliverable 11: Files inspected

**Stage evidence files:** `investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md`, `STAGE-04-UNDERWRITING-CORE-CONTRACT-LAYER.md`, `STAGE-05-DETERMINISTIC-ANALYSIS-LAYER.md`, `STAGE-06-MEMO-V1-V2-LANE-RESOLUTION.md`, `STAGE-07-DOCUMENT-INGEST-AND-PARSING.md`, `STAGE-08-DATABASE-MIGRATIONS-RLS-AND-STORAGE.md`, `STAGE-09-FRONTEND-AND-CUSTOMER-SURFACES.md`, `STAGE-10-DOCTRINE-AND-ARCHIVE-RECONCILIATION.md`, plus the Stage 1/2 census and routing records represented in the canonical index.

**Behavior-file inventory by inspected stage:** S1 routing/entrypoints 8; S4 worker/queue/revision 9 target/support entries; S2 contract layer 18; S2 deterministic analysis 20; V1/V2 lane resolution 10; ingest/parsing 11; database-facing Stage 8 19; frontend/shared auth Stage 9 14. Cumulative behavior count is 109, with duplicates/import-only listings excluded from the cumulative count.

**Tests inventoried:** 151 tracked `tests/qa` files, comprising 144 harness files and 7 fixtures. The inventory includes acquisition memo/V2, admin worker, Source Truth, deterministic financial intelligence, institutional PDF, Premium V1, report contract, dashboard copy, upload gate, failure messaging, and parser/support suites. Tests were inventoried, not executed, and direct helper coverage is not paid-path proof.

**Migrations inspected:** `20260210100140_consume_purchase_and_create_job.sql`; `20260213XXXXXX_queue_job_for_processing.sql`; `20260214_0930_queue_job_for_processing.sql`; `20260216_0001_claim_and_consume_job.sql`; `20260302_0001_allow_multiple_files_per_doc_type.sql`; `20260328_0001_sync_rls_policies_for_analysis_and_reports.sql`.

**Doctrine/archive files classified:** 84 Markdown/text records: `AGENTS.md`, `CLAUDE.md`, `ELITE_ROADMAP.md`, `UNDERWRITING_GAMEPLAN_v2.md`, `PIPELINE_MAP.md`, `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`, `docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md`, `docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATION_RUNBOOK.md`, `docs/LEVEL_UP_EXECUTION_SUMMARY.md`, active/root ledgers, and archived Core Valid Failure, Master Context, Semantic Authority, Admin Remedy, product one-pager, roadmap, handoff, and launch records. Full classifications and archive families are in Stage 10.

**Excluded:** generated HTML, PDFs, binary upload fixtures, package/vendor content, lockfile/build output, and runtime data. They were not treated as doctrine or behavior files except where named as artifacts in stage evidence.

## Deliverable 12: Uncertainties

- Deployed base table schemas, foreign keys, checks, unique indexes, triggers, RPC signatures, and storage policies are not proven by the six repository migrations. Evidence needed: controlled schema/RLS/storage inventory. Live customer RETEST not necessary; rollback boundary is schema/RPC migration commit.
- Production environment values and current deployed commit are not proven by repository inspection. Evidence needed: authorized deployment receipt. No live RETEST necessary for static verification; rollback is deployment revert.
- Actual Stripe event races, worker concurrency, and publication duplicates are not proven by static code. Evidence needed: isolated contract simulation or staging harness. Live customer RETEST not necessary.
- Current production frontend bundle/cache behavior is not proven. Evidence needed: controlled deployment asset/version check. No live customer RETEST necessary.
- PDF engine behavior, external DocRaptor availability, and real storage ACL behavior are not fully proven locally. Evidence needed: approved non-customer staging validation. Live RETEST not necessary under current authorization.
- Whether current deployed doctrine matches the repository is not proven. Evidence needed: deployment SHA and documentation receipt.
- Customer-facing mobile layout and browser-specific polling behavior were inspected statically, not rendered across devices. Evidence needed: controlled browser matrix.
- Exact production publication rate and any 99.999% denominator are absent. Evidence needed: SLO definition plus historical telemetry. No live RETEST necessary; do not claim the objective.
- Existing customer jobs, entitlements, reports, and storage objects were not queried or mutated. Evidence needed: authorized read-only audit. No live RETEST necessary.
- Full end-to-end paid-path test execution was prohibited by the no-credit/no-live-RETEST constraint. Evidence needed: isolated fake/staging contract harness first; live canary only with separate authorization and rollback.

## A. Top 10 launch blockers

1. **F-001/F-002:** unauthenticated metadata and legal-acceptance authorization.
2. **F-012/F-013:** worker timebox and competing claim lanes.
3. **F-061:** deployed schema/RLS/storage contract unproven.
4. **F-066:** customer outcome collapse between clean, limited, and blocked.
5. **F-072:** duplicated contradictory doctrine authority.
6. **F-049:** ambiguous core/support classification.
7. **F-050:** unsupported types disappear into generic failure.
8. **F-041:** V1/V2 shared identity and lane ambiguity.
9. **F-018/F-064:** non-atomic restoration/publication/history state.
10. **F-009/F-014:** split purchase idempotency and missing lease/fencing.

## B. 99.999% publication compliance verdict

**Not compliant.** The code does not enforce a 99.999% publication objective. There is no denominator, eligible-job definition, measurement window, error budget, alert, or rollback threshold. Existing non-atomic publication, worker failure, certification failure, and restoration paths make the claim unsupported.

## C. Recommended product decision

**Launch Screening only**, after P0 gates pass. Do not launch Full Underwriting this week unless the additional identity, optional-support, limited-publication, and remedy gates pass independently. The current V2/base lane is the right eventual Full Underwriting base, but it is not yet an honest, single-contract product.

## D. Premium decision

Keep Premium off. The implementation is largely complete and isolated, but the activation runbook records failed live certification history and revalidation pending. Before activation: capability false by default, valid timestamp, immutable receipt on every eligible job, strict certificate after unchanged PDF Boss, worker no-silent-downgrade enforcement, protected replay pass, rollback proof, and explicit deployment approval. Premium must never be the base Full Underwriting fallback.

## E. Minimum end-to-end test set

1. Valid-core Screening publishes a tenant-bound report.
2. Valid-core base Underwriting publishes with no optional support dependency.
3. Missing optional support collapses dependent sections and still publishes.
4. Unusable T12 blocks with exact customer-source reason and restoration.
5. Unusable Rent Roll blocks with exact customer-source reason and restoration.
6. True core contradiction blocks with contradiction evidence and restoration.
7. Optional expansion failure uses governed safe-base fallback only when not promised.
8. PDF composition repair runs once, then strict recertification decides publication.
9. Failed recertification never publishes.
10. Failed jobs remain in customer history with status and remedy.
11. Credit restoration is atomic/idempotent and visible without a second refresh.
12. Concurrent claim attempts produce one owner, lease, and fencing token.
13. Duplicate publication attempts produce one report/object/history record.
14. Current and proposed debt remain separate in calculations and rendered labels.
15. Legacy V1/Acquisition Memo paths cannot be selected by a current paid job.

## F. Exact first implementation phase

**Do not implement it in this audit.** The first repair phase should be **P0-A: authenticated identity and authorization boundary**. It must server-derive checkout and legal actors, block unauthenticated `/dashboard`, separate admin routing from customer routing, and add cross-user tests before any worker, schema, or customer-surface repair is deployed.

## Final synthesis

The current product is not launch-approved, but it is salvageable. Screening is the shortest eventual paid path. V2/base Underwriting is the only credible eventual Full Underwriting base. Premium is an optional expansion, not the launch lane. The system's repeated failures are authority failures, not evidence that the entire architecture must be rewritten.
