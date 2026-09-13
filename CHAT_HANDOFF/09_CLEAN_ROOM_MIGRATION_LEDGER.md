# InvestorIQ Clean-Room Migration Ledger

**Started:** 2026-09-13
**Status:** ACTIVE
**Legacy branch:** `launch-certification-20260913`
**Rule:** Nothing enters the clean runtime without an explicit disposition and proof.

## Disposition values

- `MIGRATE`
- `MIGRATE AFTER REPAIR`
- `REWRITE`
- `DO NOT MIGRATE`

## Migration status values

- `AUDITED - DISPOSITION PROVISIONAL`
- `READY FOR CLEAN MIGRATION`
- `MIGRATED - TESTS PENDING`
- `MIGRATED - CERTIFIED`
- `REJECTED FROM CLEAN ROOM`

## Initial audited runtime disposition map

This ledger captures the current audit findings already established before the clean-room decision. Dispositions remain provisional until dependency and receiving-architecture proof is complete.

| Legacy responsibility / file | Clean-room disposition | Clean canonical responsibility | Key reason | Status |
|---|---|---|---|---|
| `api/lib/canonical-operating-metrics.js` | MIGRATE | Canonical OCCR / operating metrics | Strong single-purpose deterministic authority | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/core-publication-constitution.js` | MIGRATE | Publication constitution receipt | Strong product-doctrine authority | AUDITED - DISPOSITION PROVISIONAL |
| deterministic debt-service / DSCR modules | MIGRATE | Canonical debt math | Strong deterministic math, explicit receipts | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/institutional-financial-intelligence.js` | MIGRATE | Canonical financial composition | Clean composition pattern, avoids duplicate math | AUDITED - DISPOSITION PROVISIONAL |
| institutional due-diligence contracts | MIGRATE | DD evidence / coverage receipts | Non-authority-creating evidence contracts | AUDITED - DISPOSITION PROVISIONAL |
| institutional scenario contracts | MIGRATE | Scenario authorization policy | Correctly authorizes zero unsupported scenarios | AUDITED - DISPOSITION PROVISIONAL |
| institutional scoring contracts | MIGRATE | Scoring authorization policy | Correctly authorizes no unsupported score/classification | AUDITED - DISPOSITION PROVISIONAL |
| institutional underwriting return-readiness contracts | MIGRATE | Return-analysis authorization | Correctly blocks unsupported IRR/EM/CoC | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/support-document-authority-adjudicator.js` | MIGRATE AFTER REPAIR | Support-document evidence adjudication | Strong raw-evidence design; explicit-unit repair required | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/source-truth-package.js` | REWRITE | Canonical Source Truth package | Keep architecture, remove legacy surface dependency and silent multi-core ranking | AUDITED - DISPOSITION PROVISIONAL |
| `api/report-formatting-helpers.js` | REWRITE | Explicit-unit formatting helpers | Magnitude inference cannot cross border | AUDITED - DISPOSITION PROVISIONAL |
| `api/report-number-helpers.js` | REWRITE | Explicit-unit numeric helpers | Magnitude inference and universal tolerance policy | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/report-surface-contracts.js` | DO NOT MIGRATE | None | Competing financial engine disguised as surface contract | REJECTED FROM CLEAN ROOM |
| `api/lib/legacy-report-surface-render-helpers.js` | DO NOT MIGRATE | None | Duplicate DSCR, scoring, refi, source reconstruction | REJECTED FROM CLEAN ROOM |
| `api/lib/legacy-source-package-fixture.js` | DO NOT MIGRATE | None | Legacy competing source truth and filename inference | REJECTED FROM CLEAN ROOM |
| `api/lib/support-doc-taxonomy.js` | REWRITE | Parser-routing hint taxonomy only | Filename/keyword authority must be removed | AUDITED - DISPOSITION PROVISIONAL |
| `api/parse/classify-documents.js` | REWRITE | Parser-routing hints only | Filename/excerpt classification cannot become semantic authority | AUDITED - DISPOSITION PROVISIONAL |
| `api/parse/extract-job-text.js` | MIGRATE AFTER REPAIR | Text/table extraction | Remove customer-text log leak; fix image extraction persistence | AUDITED - DISPOSITION PROVISIONAL |
| `api/parse/parse-doc.js` | REWRITE | Parser candidate generation + acceptance receipt | Live NOI sign bug, role persistence bug, scattered tolerances | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/report-analysis-context.js` | MIGRATE | Canonical report as-of context | Explicit date authority, no system-clock fallback | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/publication-format.js` | MIGRATE AFTER REPAIR | Presentation formatting only | Clean overall; remove stale generic break-even helper | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/report-identity-authority.js` | REWRITE | Single report identity authority | Legacy title conflict must not cross border | AUDITED - DISPOSITION PROVISIONAL |
| acquisition memo V2 base/wrapper/boss/repair stack | DO NOT MIGRATE | None | Repair-on-repair architecture and duplicate financial authority | REJECTED FROM CLEAN ROOM |
| `api/lib/acquisition-financing-display-contract.js` | MIGRATE AFTER REPAIR | Presentation labels if still needed | Narrow display responsibility only | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/acquisition-memo-projection.js` | DO NOT MIGRATE | None | Legacy projection/reconciliation fallback | REJECTED FROM CLEAN ROOM |
| Full Underwriting chapter/base/wrapper repair stack | DO NOT MIGRATE | None | Duplicate math and post-render repair architecture | REJECTED FROM CLEAN ROOM |
| legacy Full Underwriting debt intelligence | DO NOT MIGRATE | None | Competing scenario/debt authority and retired break-even semantics | REJECTED FROM CLEAN ROOM |
| legacy Full Underwriting valuation reconciliation | DO NOT MIGRATE | None | Raw-source search and duplicate valuation calculation | REJECTED FROM CLEAN ROOM |
| legacy Full Underwriting scenario engine | DO NOT MIGRATE | None | Competes with institutional scenario authorization | REJECTED FROM CLEAN ROOM |
| legacy Full Underwriting driver ranking | DO NOT MIGRATE | None | Unsupported cross-output ranking semantics | REJECTED FROM CLEAN ROOM |
| Phase 7 presentation compatibility | DO NOT MIGRATE | None | Legacy compatibility layer not needed in clean architecture | REJECTED FROM CLEAN ROOM |
| Phase 8A analytical authority | DO NOT MIGRATE | None | Unauthorized dispositions, thresholds, strategy profiles | REJECTED FROM CLEAN ROOM |
| Phase 8B analytical authority | DO NOT MIGRATE | None | Republishes unauthorized Phase 8A semantics | REJECTED FROM CLEAN ROOM |
| Phase 8 customer-facing visual authority | DO NOT MIGRATE | None | Competing title, recomputation, materiality, diligence logic | REJECTED FROM CLEAN ROOM |
| final human publication authority | DO NOT MIGRATE | None | Post-render title, gold-dot, OCCR rewrites | REJECTED FROM CLEAN ROOM |
| `api/lib/investoriq-publication-base-css.js` and base | MIGRATE AFTER REPAIR | Shared publication CSS | Presentation-only; stale internal naming cleanup | AUDITED - DISPOSITION PROVISIONAL |
| Prince layout / typography CSS | MIGRATE | Provider publication CSS | Presentation-only and reusable | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/investoriq-publication-design-system.js` | MIGRATE AFTER REPAIR | Shared design tokens/components | Remove stale reconciliation default copy | AUDITED - DISPOSITION PROVISIONAL |
| visual elite CSS | MIGRATE AFTER REPAIR | Shared visual primitives | Remove owner-rejected gold-dot injection | AUDITED - DISPOSITION PROVISIONAL |
| visual elite exhibits | REWRITE | Exhibit rendering only | Chart layer must consume canonical receipts, not recompute | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/report-html-helpers.js` | MIGRATE AFTER REPAIR | Structural HTML helper only | Keep deterministic section operations with governed consumers | AUDITED - DISPOSITION PROVISIONAL |
| `api/report-template-runtime.html` | REWRITE | Minimal canonical report template | Current template structurally authorizes unsupported scoring/scenarios/DCF/refi analysis | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/screening-report-renderer.js` | REWRITE | Receipt-only Screening renderer | Current renderer owns classifications, thresholds, scenarios, favorable defaults | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/screening-report-pipeline.js` | REWRITE | Thin Screening orchestrator | Remove Phase 7/8/final-human analytical dependencies | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/generate-client-report-impl.js` | REWRITE | Thin report orchestrator | Current live generator is a second financial/strategy engine | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/generate-client-report-handler.js` | MIGRATE AFTER REPAIR | Customer report request boundary | Thin delegation pattern may be retained | AUDITED - DISPOSITION PROVISIONAL |
| `api/generate-client-report.js` | MIGRATE | Route shim | Thin route delegation | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/report-contract-qa.js` | REWRITE | Canonical receipt/render validator | Current QA adjudicates raw financial authority and legacy policies | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/qa-action-plan.js` | DO NOT MIGRATE | None | Advisory layer creates delivery/publication truth | REJECTED FROM CLEAN ROOM |
| `api/lib/qa-manager-review.js` | REWRITE | Optional advisory AI review | Must not whitelist unauthorized classifications or reconstruct truth | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/qa-review.js` | MIGRATE AFTER REPAIR | Advisory QA review | Good advisory boundary; doctrine dependencies must be clean | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/qa-director-review.js` | REWRITE | Optional advisory review | Hard-coded DSCR prominence/classification threshold | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/qa-fix-routing.js` | MIGRATE AFTER REPAIR | Advisory fix routing | Remove stale refi/debt taxonomy | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/report-quality-manifest.js` | REWRITE | Immutable canonical Quality Manifest | Keep receipt structure, remove failed-PDF waiver and legacy truth dependencies | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/report-quality-incident-projection.js` | MIGRATE AFTER REPAIR | Read-only incident projection | Good receipt-only pattern; legacy receipt cleanup | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/report-delivery-output.js` | REWRITE | Fail-closed artifact certification + delivery preparation | Current quality-incident waiver can publish uncertified PDFs | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/delivery-gate-constitution.js` | REWRITE | Single delivery-decision authority | Must separate financial publishability from safe artifact certification | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/canonical-delivery-action.js` | MIGRATE AFTER REPAIR | Canonical delivery action receipt | Strong narrow responsibility, verify against new gate | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/section-disposition-contract.js` | REWRITE | Section collapse/omit policy | Missing required financial facts are not layout-recoverable | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/section-disposition-runtime.js` | REWRITE | Receipt-driven section disposition | Retired break-even semantics and optional valuation elevation | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/recovery-content-hash-cache.js` | REWRITE | Scoped recovery cache | Current cache lacks tenant/job/parser-version scope | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/worker-queue-scan.js` | MIGRATE | Deterministic queue scan | Strong tuple-cursor infrastructure | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/worker-constitutional-lifecycle.js` | REWRITE | Durable worker state machine | Current expired/nonterminal limbo paths | AUDITED - DISPOSITION PROVISIONAL |
| `api/admin-run-worker.js` | REWRITE | Worker orchestrator | Keep fencing/heartbeat ideas; remove limbo, financial checks, quality waiver, dead paths | AUDITED - DISPOSITION PROVISIONAL |
| `api/admin/run-eligible-jobs-once.js` | MIGRATE AFTER REPAIR | Governed exact-job recovery | Strong bounded recovery pattern | AUDITED - DISPOSITION PROVISIONAL |
| `api/admin/queue-metrics.js` | REWRITE | Admin observability only | Current payload-shape drift hides diagnostics | AUDITED - DISPOSITION PROVISIONAL |
| `api/admin/report-projection.js` | MIGRATE AFTER REPAIR | Read-only admin projection | Minor auth helper hygiene | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/terminal-failure-section-state-map.js` | REWRITE | Failure policy input | Single-source failure mapping conflicts with downstream survivability | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/terminal-failure-tier-map.js` | REWRITE | Typed terminal policy | Generic report-contract failure is too permissive | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/validator-diagnostics-rollup.js` | MIGRATE AFTER REPAIR | Observability rollup | Non-authoritative; clarify taxonomy semantics | AUDITED - DISPOSITION PROVISIONAL |
| `api/checkout-session.js` | MIGRATE AFTER REPAIR | Checkout completion verification | Strong commerce authority; minor module/env hardening | AUDITED - DISPOSITION PROVISIONAL |
| `api/create-checkout-session.js` | MIGRATE AFTER REPAIR | Checkout creation | Strong catalog/identity validation; minor module/env hardening | AUDITED - DISPOSITION PROVISIONAL |
| `api/webhook.js` | MIGRATE AFTER REPAIR | Atomic Stripe entitlement grant | Strong mutation authority; minor env hardening | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/commerce-catalog.js` | MIGRATE AFTER REPAIR | Single pricing/catalog authority | Pricing correct; customer label/title doctrine cleanup | AUDITED - DISPOSITION PROVISIONAL |
| `api/legal-acceptance.js` | MIGRATE AFTER REPAIR | Authenticated legal acceptance boundary | Strong acceptance behavior; route consolidation later | AUDITED - DISPOSITION PROVISIONAL |
| `api/request-revision-handler.js` | REWRITE | Disabled revision response or remove route | Irrelevant service-role dependency and pre-auth env disclosure | AUDITED - DISPOSITION PROVISIONAL |
| `api/lib/report-request-context.js` | REWRITE | Authenticated report/job context | Must prove actor-to-job owner fence | AUDITED - DISPOSITION PROVISIONAL |
| `api/customer-report-download-handler.js` | MIGRATE AFTER REPAIR | Authenticated report download | Narrow customer boundary; verify new publication receipt | AUDITED - DISPOSITION PROVISIONAL |
| `api/customer-reports-handler.js` | MIGRATE AFTER REPAIR | Authenticated report listing | Narrow boundary; verify SQL/view ownership | AUDITED - DISPOSITION PROVISIONAL |
| `api/customer-boundary-handler.js` | REWRITE | Unified authenticated customer boundary if retained | Generic 500 behavior and multiplexing need simplification | AUDITED - DISPOSITION PROVISIONAL |
| `api/html/sample-report.html` | DO NOT MIGRATE | None | Stale non-production sample under runtime tree | REJECTED FROM CLEAN ROOM |
| Premium Acquisition Underwriting job-surface authority | MIGRATE AFTER REPAIR | Feature-off job surface receipt | Clean fail-closed pattern; do not activate premium feature | AUDITED - DISPOSITION PROVISIONAL |
| Premium model / quality observer / receipt map | MIGRATE AFTER REPAIR | Optional future clean pattern | Useful architecture reference; feature remains OFF | AUDITED - DISPOSITION PROVISIONAL |
| Premium validated model | MIGRATE AFTER REPAIR | Future feature validation | Fix stale title and retired debt-coverage naming; keep OFF | AUDITED - DISPOSITION PROVISIONAL |
| Premium renderer | MIGRATE AFTER REPAIR | Future feature renderer | Presentation-only after terminology cleanup; keep OFF | AUDITED - DISPOSITION PROVISIONAL |

## Root responsibilities to build cleanly

The currently known clean-system work collapses into these bounded responsibility families:

1. intake and parser role identity;
2. Source Truth and support adjudication;
3. deterministic calculations with explicit units;
4. Screening and Underwriting analytical composition with no unsupported scenario/scoring authority;
5. receipt-only renderers and clean report template;
6. QA, Quality Manifest, artifact certification, and one delivery gate;
7. durable worker lifecycle and bounded recovery;
8. commerce, authenticated customer boundaries, and security fencing.

The legacy audit continues from the existing deterministic census. New findings are added here as dispositions rather than automatically triggering repairs inside obsolete legacy layers.
