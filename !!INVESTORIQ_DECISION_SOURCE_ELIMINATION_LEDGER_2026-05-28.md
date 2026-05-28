# InvestorIQ Decision-Source Elimination Ledger
## Controlling Status - May 28, 2026

Historical note: This file supersedes the prior Full Underwriting cleanup roadmap and is now the master decision-source elimination ledger for both Screening and Full Underwriting.

## DS Row Closure Standard
- A DS row may only be marked `CLOSED` if the old decision-maker can no longer override canonical truth.
- Every touched row must have one disposition:
- `DELETED`
- `NEUTERED / READ-ONLY CONSUMER`
- `CONVERTED TO QA CONTRACT`
- `LEGACY FALLBACK ONLY`
- `STILL OPEN`
- Rules:
- Adding a canonical helper is not enough to close a row.
- If legacy fallback remains, mark `PARTIAL`, not `CLOSED`.
- If renderer/worker/Dashboard can still override canonical state, row remains `OPEN` or `PARTIAL`.
- If QA still infers truth instead of canonical-vs-render conformance checking, row remains `OPEN` or `PARTIAL`.

## Section 1 - Executive Doctrine
- InvestorIQ must have ONE canonical decision authority per truth family.
- Renderer must become a read-only consumer.
- QA must become state-to-render conformance checking, not truth inference.
- Worker must consume canonical delivery/gate decisions, not reinterpret them.
- Dashboard must display canonical customer status/gate meaning, not recompute it from error codes.
- No tactical symptom patches.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off fixture values.
- Tests are required but are not substitutes for production root-cause fixes.
- Screening and Full Underwriting both share this cleanup.
- Full Underwriting public self-serve remains paused.
- Screening-first launch remains possible but must be protected from shared decision-sprawl.

## Section 2 - Current Root Diagnosis
- The primary defect class is duplicate truth-makers / decision-sprawl.
- Contract QA catches important drift after render, but does not fully prevent render-time drift.
- Canonical helpers are not sufficient unless every consumer surface is forced to obey canonical state.
- The old root-class patch sequence improved quality but did not eliminate competing authorities.
- Strategy is now strict: inventory -> assign authority -> migrate consumers -> quarantine/delete duplicates.

## Section 2A - Today DS Status Update (May 28, 2026)

### Batch 1 / 1A Classification
- DS-004: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER` path not applicable (canonical helper retained), but family not fully closed until all renderer/QA override paths are eliminated.
- DS-005: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER` downstream migration in progress; canonical owner exists but not all consumers are hard-locked.
- DS-006: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; generator now routes toward canonical state, fallback path still exists.
- DS-007: `PARTIAL` - disposition `LEGACY FALLBACK ONLY`; scorecard HTML alignment remains adaptation path.
- DS-008: `PARTIAL` - disposition `CONVERTED TO QA CONTRACT`; conformance improved, regex fallback still present.
- DS-009: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; scoring remains mixed path where visible classification interactions are only partially neutralized.
- DS-010: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER` migration in progress; canonical metadata path exists, family still has fallback paths.

### Batch 2A Delivery Decision State Shape
- DS-047: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; mapped into canonical deliveryDecisionState, legacy readiness aliases still emitted for compatibility.
- DS-048: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; canonical gate owner retained, but downstream consumer lock-in not complete.
- DS-049: `CLOSED` - disposition `NEUTERED / READ-ONLY CONSUMER`; generator compatibility aliases are derived from canonical `deliveryDecisionState` and cannot independently recompute readiness when canonical state exists.

### Batch 2B / 2B.1 Worker Consumption
- DS-050: `CLOSED` (deliveryDecisionState consumption scope) - disposition `NEUTERED / READ-ONLY CONSUMER`; worker resolver enforces canonical-first precedence for gate status, customer delivery allowed, hold delivery, and credit restore. Legacy top-level fields are fallback-only when canonical state is absent.
- DS-068: `PARTIAL` - disposition `STILL OPEN`; only deliveryDecisionState consumption slice addressed, broader worker status-machine cluster remains.

### Batch 2C Dashboard Bridge
- DS-059: `CLOSED` - disposition `NEUTERED / READ-ONLY CONSUMER`; customer-facing status surfaces now prefer canonical `customer_status_label` when present, with legacy mapping fallback-only.
- DS-060: `CLOSED` - disposition `LEGACY FALLBACK ONLY`; canonical `customer_message` is authoritative when present, and needs-doc/message fallback is non-authoritative fallback-only.
- DS-061: `CLOSED` - disposition `LEGACY FALLBACK ONLY`; failed-file guidance is suppressed when canonical `customer_message` exists and remains fallback-only for older/non-canonical jobs.
- DS-069: `PARTIAL` - disposition `STILL OPEN`; canonical bridge exists, broader Dashboard/customer messaging consolidation remains open.

### Batch 2E / 2F Delivery Hard-Lock
- DS-052: `CLOSED` - disposition `CONVERTED TO QA CONTRACT`; report-contract QA resolves canonical delivery state first and treats legacy readiness aliases, `qaFixRouting`, and source coverage readiness payloads as conformance inputs only when canonical state exists. Closure proof: `report-contract-qa-smoke.js` canonical delivery conflict cases.
- DS-049: `CLOSED` - disposition `NEUTERED / READ-ONLY CONSUMER`; generator compatibility aliases are derived from canonical `deliveryDecisionState` through `buildDeliveryResponseCompatibilityAliases(...)`. Legacy aliases remain compatibility outputs and cannot independently recompute readiness when canonical state exists. Closure proof: `delivery-decision-state-smoke.js`.
- DS-050: `CLOSED` (deliveryDecisionState consumption scope) - disposition `NEUTERED / READ-ONLY CONSUMER`; worker resolver applies strict canonical-first precedence for delivery gate status, customer delivery allowed, hold delivery, and credit restore. Legacy top-level fields are used only when canonical state is absent and cannot override canonical state. Closure proof: `admin-run-worker-gate-smoke.js`.
- DS-068: `PARTIAL`; broader worker status-machine cluster is not fully closed, even though deliveryDecisionState consumption sub-scope is hard-locked.

### Batch 2 Consolidated Completion Update - Delivery / Readiness Authority
- Batch 2 materially hard-locked delivery/readiness propagation across generator, worker, contract QA, and Dashboard.
- `deliveryDecisionState` is the canonical delivery/customer state object for downstream consumers.
- Generator aliases are compatibility/read-only outputs derived from canonical `deliveryDecisionState`.
- Worker delivery gate consumption is canonical-first.
- Worker terminal fail/restore mechanics now route through `applyTerminalFailureOutcome(...)` and `restoreEntitlementForFailedJob(...)`.
- Dashboard customer status/message/guidance now uses canonical `customer_status_label`/`customer_message` when present.
- report-contract QA now treats delivery readiness as canonical-vs-render/payload conformance, not independent truth.
- Legacy fallback remains only for older/non-canonical jobs where explicitly retained.
- DS-049: `CLOSED`
- DS-050: `CLOSED`
- DS-051: `CLOSED`
- DS-052: `CLOSED`
- DS-059: `CLOSED`
- DS-060: `CLOSED`
- DS-061: `CLOSED`
- DS-068: `PARTIAL`
- DS-069: `PARTIAL`
- Broader cluster rows DS-068 and DS-069 remain `PARTIAL` because full worker lifecycle and Dashboard legacy fallback architecture are not completely eliminated.

## Remaining High-Risk Families
1. Broader Dashboard legacy fallback/messaging architecture for older/non-canonical jobs
2. Current debt / refinance authority
3. Acquisition vs current debt separation authority
4. Section eligibility / Data Coverage authority
5. QA rendered-text inference that should become conformance checks

Delivery/readiness note: Generator aliasing, worker delivery consumption, worker terminal failure/restore mechanics, Dashboard customer messaging, and report-contract QA delivery conformance are now hard-locked to canonical delivery decision state where canonical payload exists. Remaining Batch 2 risk is DS-068/DS-069 broader architecture only.
Batch 2 risk note: Batch 2 customer-facing override risk is materially reduced; DS-069 remains a broader fallback architecture cluster, not an active canonical override when `deliveryDecisionState`/`customer_message` exists.

## Section 3 - Master Decision-Maker Inventory

Coverage note: The completed audit estimated ~132 decision-makers. This ledger captures explicit rows plus grouped row-clusters for remaining call-site expansion. Grouped rows are marked `AUDIT EXPANSION REQUIRED` where individual call sites were not yet atomized.

| ID | Family | Report scope | File | Function or region | Current decision made | Current input source | Current output/surface affected | Current authority status | Risk | Target canonical owner | Required action | Migration batch | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DS-001 | report type/tier | Both | api/generate-client-report.js | effectiveReportMode branching | screening_v1 vs v1_core/underwriting paths | request/job fields + local branching | section inclusion, copy, calculations | duplicate | critical | Decision Canonical Layer | make read-only consumer | B5 | open | Core branch gate currently mixed with render logic |
| DS-002 | report type/tier | Both | api/_lib/source-report-coverage-qa.js | isFullUnderwriting | report type from reportType/reportTier | function args | QA depth/routing flags | QA-only | high | Decision Canonical Layer | convert to QA conformance only | B5 | open | Should consume canonical report-mode state |
| DS-003 | report type/tier | Both | api/_lib/report-contract-qa.js | reportTypeIsScreening | screening contract interpretation | reportType/reportTier | contract violations | QA-only | medium | Decision Canonical Layer | convert to QA conformance only | B5 | open | Keep as conformance only |
| DS-004 | classification/verdict | Both | api/_lib/report-surface-contracts.js | normalizeVerdictLabel | score->label mapping | computed score | canonical label seed | canonical | critical | Decision Canonical Layer | keep as canonical | B1 | open | Stable/Sensitized/Fragile mapping |
| DS-005 | classification/verdict | Both | api/_lib/report-surface-contracts.js | buildCanonicalDisplayVerdictState | cap application (source/debt/core support) | canonical states | canonical visible label/cap metadata | canonical | critical | Decision Canonical Layer | keep as canonical | B1 | open | Primary owner candidate |
| DS-006 | classification/verdict | Both | api/generate-client-report.js | normalizeVisibleReportClassification | visible label override chain | mixed state/local | cover/scorecard visible label | renderer-local | critical | Decision Canonical Layer | make read-only consumer | B1 | open | Must not override canonical verdict |
| DS-007 | classification/verdict | Both | api/generate-client-report.js | alignDealScorecardVisibleClassificationHtml | text replacement for scorecard label | rendered HTML text | scorecard label string | renderer-local | high | Decision Canonical Layer | make read-only consumer | B1 | open | Replace with direct canonical render token |
| DS-008 | classification/verdict | Both | api/_lib/report-contract-qa.js | visible label regex checks | infer rendered label set | rendered text | contradictions/violations | QA-only | high | Decision Canonical Layer | convert to QA conformance only | B1 | open | Keep only conformance to canonical |
| DS-009 | scoring | Both | api/generate-client-report.js | buildDealScorecardState | composite/factor scoring and cap interactions | mixed canonical + local fallbacks | score rows/labels/explanations | duplicate | critical | Financial Canonical Layer + Decision Canonical Layer | make read-only consumer | B1 | open | Canonical score object required |
| DS-010 | scoring | Both | api/_lib/report-surface-contracts.js | verdict cap metadata path | score_label vs cap_reason relationship | canonical state | risk profile labels | canonical | high | Decision Canonical Layer | keep as canonical | B1 | open | Should be single verdict authority |
| DS-011 | core sufficiency | Both | api/_lib/report-surface-contracts.js | buildT12SufficiencyState | T12 core sufficiency bucket | parser artifacts | publishability class | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | fail-closed logic root |
| DS-012 | core sufficiency | Both | api/_lib/report-surface-contracts.js | buildRentRollSufficiencyState | rent roll sufficiency bucket | parser artifacts | publishability class | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | includes occupancy basis reasoning |
| DS-013 | core sufficiency | Both | api/_lib/report-surface-contracts.js | buildCoreInputSufficiencyState | combined core sufficiency gate | T12/rent roll + reconciliation | user/admin/deliverability influence | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | top-level core gate owner |
| DS-014 | core sufficiency | Both | api/_lib/source-report-coverage-qa.js | deterministic flag translation | convert sufficiency into flags | canonical + rendered signals | QA routing and blockers | QA-only | high | Coverage/Eligibility Layer | convert to QA conformance only | B5 | open | Should not redefine sufficiency truth |
| DS-015 | T12 truth | Both | api/parse/parse-doc.js | t12 parser + core validation | accept/reject T12 totals/lines | extracted text/tables + AI recovery | t12_parsed artifact | canonical | critical | Parser Canonical Layer | keep as canonical | B5 | open | core_t12_validation already present |
| DS-016 | T12 truth | Both | api/_lib/report-surface-contracts.js | resolveCanonicalT12GprSource | choose authoritative GPR field | t12 payload fields | reconciliation and downstream metrics | canonical | high | Financial Canonical Layer | keep as canonical | B5 | open | explicit precedence list |
| DS-017 | rent roll truth | Both | api/_lib/report-surface-contracts.js | resolveCanonicalRentRollAnnualMetric | annual in-place/market truth selection | rent roll totals/rows/sample signals | rr annual totals | canonical | critical | Financial Canonical Layer | keep as canonical | B5 | open | key anti-drift authority |
| DS-018 | rent roll truth | Both | api/_lib/report-surface-contracts.js | resolveCanonicalRentRollAnnualTotals | combined in-place + market totals | canonical metric resolver | rent totals for reconciliation/rendering | canonical | critical | Financial Canonical Layer | keep as canonical | B5 | open | used by source reconciliation state |
| DS-019 | rent roll truth | Both | api/generate-client-report.js | resolveSafeAnnualRentTotal | alternate rent total fallback | local heuristic | displayed rent totals | legacy | critical | Financial Canonical Layer | quarantine | B5 | open | duplicate with canonical resolver |
| DS-020 | rent roll truth | Both | api/_lib/report-contract-qa.js | occupancy extraction regex | infer occupancy from rendered text | rendered text | violation findings | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B5 | open | false positive risk demonstrated |
| DS-021 | debt/refi truth | Both | api/_lib/report-surface-contracts.js | buildCurrentDebtAssessmentState | current debt assessed/not assessed + reason codes | mortgage/loan/t12 artifacts | debt status, DSCR state, explanations | canonical | critical | Financial Canonical Layer + Decision Canonical Layer | keep as canonical | B3 | open | central debt authority candidate |
| DS-022 | debt/refi truth | Both | api/generate-client-report.js | resolveCanonicalCurrentDebtScoreInputs | DSCR score input selection | canonical + legacy fallback | scorecard DSCR row | duplicate | critical | Financial Canonical Layer | make read-only consumer | B3 | open | must stop legacy fallback effects |
| DS-023 | debt/refi truth | Both | api/generate-client-report.js | resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback | fallback DSCR compute | mortgage payload + T12 NOI | debt metrics fallback | legacy | high | Financial Canonical Layer | quarantine | B3 | open | explicit legacy marker exists |
| DS-024 | debt/refi truth | Both | api/generate-client-report.js | resolveCanonicalRefiDebtBasis | determine refi debt basis and acquisition-only condition | currentDebtState + artifacts + financials | refi gates/copy/eligibility | duplicate | critical | Financial Canonical Layer | make read-only consumer | B3 | open | should consume canonical debt state only |
| DS-025 | debt/refi truth | Both | api/generate-client-report.js | buildRefiDebtRenderState | valid/source-limited/not-assessed gate | refi basis + debt signals | refi section render behavior | renderer-local | critical | Coverage/Eligibility Layer + Decision Layer | make read-only consumer | B3 | open | currently re-decides debt gate |
| DS-026 | debt/refi truth | Both | api/generate-client-report.js | resolveRefiNarrativeMode | explanatory mode classification | render state + booleans | narrative copy | renderer-local | high | Decision Canonical Layer | make read-only consumer | B3 | open | narrative must reflect canonical mode |
| DS-027 | debt/refi truth | Both | api/_lib/report-contract-qa.js | extractCurrentDebtDscrValues | parse rendered DSCR values | rendered text | QA blockers | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B3 | open | keep as comparison only |
| DS-028 | acquisition vs current debt | Underwriting | api/_lib/report-surface-contracts.js | buildAcquisitionAssumptionState | validated acquisition assumptions and separation semantics | loan terms + taxonomy + debt state | acquisition state | canonical | critical | Financial Canonical Layer | keep as canonical | B4 | open | must govern separation and render eligibility |
| DS-029 | acquisition vs current debt | Underwriting | api/_lib/source-report-coverage-qa.js | acquisition_financing_assumptions rendered signal logic | rendered evidence of acquisition section | rendered text signals | coverage flags | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B4 | open | should not define business truth |
| DS-030 | acquisition vs current debt | Underwriting | api/_lib/report-contract-qa.js | contamination checks | detect acquisition/current debt drift | rendered text + artifacts | blocking violations | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B4 | open | currently truth-inference heavy |
| DS-031 | DCF/cap-rate provenance | Underwriting | api/generate-client-report.js | cap-source label resolver | appraisal/support/framework defaults | cap-rate source labels | renderer-local | critical | Financial Canonical Layer | make read-only consumer | B5 | open | overclaim drift family |
| DS-032 | DCF/cap-rate provenance | Underwriting | api/_lib/report-contract-qa.js | exit-cap overclaim checks | rendered text regex | violations/public blockers | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B5 | open | validated in Slice 6 calibration |
| DS-033 | property tax truth | Underwriting | api/parse/parse-doc.js | property_tax parser/recovery | annual tax acceptance thresholds + AI validation | text/tables | property_tax_parsed artifact | canonical | critical | Parser Canonical Layer + Financial Layer | keep as canonical | B5 | open | includes implausible tax rejection |
| DS-034 | property tax truth | Underwriting | api/_lib/full-underwriting-state.js | buildPropertyTaxBindingState | tax binding reliability | propertyTaxPayload file id/name/tax | binding state used in docs/coverage | duplicate | medium | Parser Canonical Layer | make read-only consumer | B5 | open | keep if strictly derived from canonical payload |
| DS-035 | support-doc treatment | Both | api/_lib/report-surface-contracts.js | buildSupportDocTaxonomyState | semantic role/display label classification | payload + filename/text fallbacks | doc treatment summary and downstream gating | canonical | critical | Parser Canonical Layer | keep as canonical | B5 | open | must be sole semantic role authority |
| DS-036 | support-doc treatment | Both | api/parse/parse-doc.js | inferSupportingDocTypeFromText and related helpers | initial doc classification | extracted text + filename heuristics | parser artifact type selection | duplicate | high | Parser Canonical Layer | make read-only consumer | B5 | open | align with taxonomy contract |
| DS-037 | support-doc treatment | Both | api/generate-client-report.js | filename fallback document treatment paths | infer role from filename text | filename heuristic | treatment labels/context copy | legacy | high | Parser Canonical Layer | quarantine | B5 | open | multiple filename_fallback reason codes |
| DS-038 | renovation/CapEx truth | Underwriting | api/parse/parse-doc.js | renovation parsing/recovery | structured capex/forward assumptions extraction | text/tables + AI | renovation_parsed artifact | canonical | high | Parser Canonical Layer + Financial Layer | keep as canonical | B5 | open | forward-looking vs historical distinction |
| DS-039 | renovation/CapEx truth | Underwriting | api/generate-client-report.js | resolveRenovationDisplayMode / display copy builders | determine modeled vs display-only | mixed canonical + local checks | renovation sections/copy | renderer-local | high | Coverage/Eligibility Layer | make read-only consumer | B5 | open | should consume canonical renovation state |
| DS-040 | section eligibility/rendering | Underwriting | api/_lib/report-surface-contracts.js | UNDERWRITING_SECTION_BLUEPRINTS + buildFullUnderwritingSectionEligibility | eligible/omitted/constrained/underused decision | artifact inventory + debt + reconciliation | render/collapse/omission contract | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | section-level publishability owner |
| DS-041 | section eligibility/rendering | Both | api/_lib/source-report-coverage-qa.js | buildRenderedSections | infer section presence from HTML headings | rendered HTML | QA section-depth flags | QA-only | high | Coverage/Eligibility Layer | convert to QA conformance only | B5 | open | not source of eligibility truth |
| DS-042 | section eligibility/rendering | Both | api/generate-client-report.js | screening/underwriting section stripping/replacements | mode branches + local guards | final html surfaces | renderer-local | high | Coverage/Eligibility Layer | make read-only consumer | B5 | open | should apply canonical section state tokens only |
| DS-043 | Data Coverage | Both | api/generate-client-report.js | data coverage headline/severity assignment | mode + reconciliation + section counts | Data Coverage customer copy/headline | renderer-local | high | Coverage/Eligibility Layer + Decision Layer | make read-only consumer | B5 | open | duplicate with canonical coverage state |
| DS-044 | Data Coverage | Both | api/_lib/report-contract-qa.js | data coverage taxonomy drift checks | rendered text + coverage state | violations | QA-only | medium | Coverage/Eligibility Layer | convert to QA conformance only | B5 | open | retain as conformance check |
| DS-045 | QA systems | Both | api/generate-client-report.js | QA orchestration chain | rendered qa + source coverage + contract + director + action plan | analysis artifacts + gate seed | duplicate | critical | Decision Canonical Layer | make read-only consumer | B2 | open | orchestration should consume single decision_state |
| DS-046 | QA systems | Both | api/_lib/qa-action-plan.js | buildQaActionPlan | route actions + summary readiness | multiple QA artifacts | action plan/readiness summary | duplicate | critical | Decision Canonical Layer | make read-only consumer | B2 | open | currently secondary authority |
| DS-047 | delivery/readiness | Both | api/_lib/qa-action-plan.js | buildPublishEligibilitySummary | customer/public/outreach readiness + blockers | deterministic flags + violations + actions | publishability/readiness flags | canonical | critical | Decision Canonical Layer | keep as canonical | B2 | open | selected canonical readiness owner |
| DS-048 | delivery/readiness | Both | api/_lib/qa-action-plan.js | buildDeliveryGateDecision | deliverable/admin_review/user_needs_documents | canonical publish summary + sufficiency | delivery_gate_decision artifact | canonical | critical | Decision Canonical Layer | keep as canonical | B2 | open | selected canonical gate owner |
| DS-049 | delivery/readiness | Both | api/generate-client-report.js | gate response + hold delivery handling | delivery_gate_decision + local checks | API response, publication hold | duplicate | high | Decision Canonical Layer | make read-only consumer | B2 | closed | compatibility aliases derived from canonical deliveryDecisionState |
| DS-050 | delivery/readiness | Both | api/admin-run-worker.js | status transitions by generator response | reportData + statuses | analysis_jobs lifecycle | worker-local | critical | Decision Canonical Layer | make read-only consumer | B2 | closed | canonical-first resolver; legacy fields fallback-only when canonical absent |
| DS-051 | fail closed / restore credit | Both | api/admin-run-worker.js | restoreEntitlementForFailedJob / failure handling | worker events + status + purchase rows | credit restoration behavior | canonical | high | Worker Layer | keep as canonical | B2 | closed | `applyTerminalFailureOutcome(...)` centralizes terminal failure updates; `restoreEntitlementForFailedJob(...)` remains sole entitlement restore authority; `recordJobFailure(...)` routes through terminal helper. |
| DS-052 | delivery/readiness | Both | api/_lib/report-contract-qa.js | readiness payload checks | QA payload nesting/flags | blockers/public readiness findings | QA-only | medium | Decision Canonical Layer | convert to QA conformance only | B2 | closed | canonical-first precedence; legacy readiness inputs conformance-only when canonical exists |
| DS-053 | rendered-text parsing | Both | api/_lib/report-contract-qa.js | stripHtml + extract helpers | text parsing for DSCR/occupancy/variance | violations and blocker severities | QA-only | high | QA Layer | convert to QA conformance only | B1-B5 | open | remove truth inference intent |
| DS-054 | rendered-text parsing | Both | api/_lib/source-report-coverage-qa.js | findRenderedSignals | infer semantic report signals | rendered text regex | deterministic flags | QA-only | high | QA Layer | convert to QA conformance only | B1-B5 | open | replace signal truth with state checks |
| DS-055 | rendered-text parsing | Both | api/_lib/qa-manager-review.js | decision suppression heuristics | rendered text + artifact context | manager review classifications | QA-only | medium | QA Layer | convert to QA conformance only | B2 | open | preserve as advisory conformance |
| DS-056 | source reconciliation truth | Both | api/_lib/report-surface-contracts.js | buildSourceReconciliationState | variance status and bucket | canonical rent totals + T12 GPR + parser signals | reconciliation status/disclosure/publishability | canonical | critical | Coverage/Eligibility Layer + Financial Layer | keep as canonical | B5 | open | includes parser_suspected vs disclose_only |
| DS-057 | source reconciliation render guard | Both | api/generate-client-report.js | applyFinalSourceReconciliationRenderGuard | stale variance text cleanup | rendered HTML + canonical variance | final HTML sanitization | renderer-local | medium | Renderer Layer | quarantine | B5 | open | keep only as safety sanitizer |
| DS-058 | parser extraction state | Both | api/parse/extract-job-text.js | parse_status extracted/failed/skipped decisions | file type + parse success | job file parse status | canonical | medium | Parser Canonical Layer | keep as canonical | B5 | open | upstream pipeline authority |
| DS-059 | dashboard/customer status | Both | src/pages/Dashboard.jsx | getCustomerFacingJobStatus | map job status to user label | analysis_jobs status fields | customer-facing status labels | dashboard-local | critical | Dashboard Layer consuming Decision Layer | make read-only consumer | B2 | closed | Dashboard customer status labels use canonical `customer_status_label` when available; legacy status mapping is fallback-only. |
| DS-060 | dashboard/customer status | Both | src/pages/Dashboard.jsx | needsDocumentsMessage builder | infer missing docs from error_code/files | job + events + file parse statuses | failed-state copy | dashboard-local | high | Dashboard Layer consuming Decision Layer | make read-only consumer | B2 | closed | Canonical `customer_message` wins; needs-doc/message fallback is non-authoritative fallback-only. |
| DS-061 | dashboard/customer status | Both | src/pages/Dashboard.jsx | getFailedFileGuidance | generate failure guidance narratives | file metadata + status heuristics | customer failed-state guidance | dashboard-local | high | Dashboard Layer consuming Decision Layer | make read-only consumer | B2 | closed | Failed-file guidance is suppressed when canonical `customer_message` exists; legacy parse/file guidance is fallback-only. |
| DS-062 | dashboard/customer status | Both | src/pages/Dashboard.jsx | underwriting support-doc preflight checks | block submit on doc mix | client-side upload set | launch-time UX gate | dashboard-local | medium | Coverage/Eligibility Layer | make read-only consumer | B5 | open | should mirror server canonical requirements |
| DS-063 | launch positioning context | Both | src/pages/Pricing.jsx | static policy/pricing/disclaimer copy | hardcoded policy text | customer messaging | renderer-local | low | Product policy docs | make read-only consumer | N/A | open | no change approved in this ledger stage |
| DS-064 | AUDIT EXPANSION REQUIRED - generator decision cluster | Both | api/generate-client-report.js | multiple helpers exported in __test__ (state/render/math/copy gates) | mixed | many report surfaces | duplicate cluster | critical | Family-specific canonical owners | AUDIT EXPANSION REQUIRED - enumerate remaining individual call sites before migration | B1-B5 | open | Remaining generator decision points not atomized in this ledger |
| DS-065 | AUDIT EXPANSION REQUIRED - contract QA regex cluster | Both | api/_lib/report-contract-qa.js | additional regex-based inference sites | rendered text | violation severity/block flags | QA-only cluster | high | QA Layer | AUDIT EXPANSION REQUIRED - enumerate regex truth-inference call sites | B1-B5 | open | includes all non-row-level helpers beyond explicit entries |
| DS-066 | AUDIT EXPANSION REQUIRED - source coverage QA cluster | Both | api/_lib/source-report-coverage-qa.js | additional rendered depth and file-signal checks | files + rendered text | deterministic flags/routing | QA-only cluster | high | QA Layer | AUDIT EXPANSION REQUIRED - enumerate all flag producers by family | B1-B5 | open | needed before full migration sizing |
| DS-067 | AUDIT EXPANSION REQUIRED - parser recovery cluster | Both | api/parse/parse-doc.js | AI fallback + deterministic fallback branch points | extracted text/tables | parser artifacts and diagnostics | duplicate cluster | medium | Parser Canonical Layer | AUDIT EXPANSION REQUIRED - enumerate per-doc recovery authority points | B5 | open | include acquisition/property-tax/renovation fallback splits |
| DS-068 | AUDIT EXPANSION REQUIRED - worker status machine cluster | Both | api/admin-run-worker.js | repeated status transition paths and branch checks | job state + response payload | published/failed/publishing transitions | worker-local cluster | high | Worker Layer consuming Decision Layer | AUDIT EXPANSION REQUIRED - enumerate all status branch decision sites | B2 | partial | `deliveryDecisionState` consumption and terminal failure helper sub-scopes are hard-locked; broader worker status-machine lifecycle cluster remains partial. |
| DS-069 | AUDIT EXPANSION REQUIRED - dashboard messaging cluster | Both | src/pages/Dashboard.jsx | failed-state and guidance copy branches | error/status/events | customer messaging | dashboard-local cluster | high | Dashboard Layer consuming Decision Layer | AUDIT EXPANSION REQUIRED - enumerate all customer state recompute branches | B2 | partial | customer-facing canonical message/status hard-lock complete; broader Dashboard fallback/messaging cluster remains partial for older/non-canonical jobs. |
| DS-070 | AUDIT EXPANSION REQUIRED - test-driven implicit decision clusters | Both | tests/qa/* | invariant clusters implying production decisions | tests + fixture assumptions | regression expectations | legacy reference cluster | low | N/A (tests) | quarantine (reference-only) | N/A | open | Use as map only; not authority |

Inventory count note: Explicit rows above: 70 row entries/groups. Combined with grouped expansion clusters, this ledger currently maps the audit-estimated ~132 decision-makers at family and call-site-cluster level. Remaining atomization is explicitly tracked as `AUDIT EXPANSION REQUIRED` rows.
## Section 4 - Duplicate Truth-Maker Map

### 4.1 Classification / visible verdict
- Current duplicate authorities:
  - `buildCanonicalDisplayVerdictState`
  - `normalizeVisibleReportClassification`
  - HTML text replacement for scorecard label
  - regex-based label inference in contract QA
- Desired sole canonical owner: Decision Canonical Layer (`visible_classification_state`).
- Surfaces that must obey it: cover, executive summary, deal scorecard, risk register, Data Coverage severity language.
- QA role after migration: confirm rendered labels equal canonical labels and cap reasons.
- Migration risk: critical customer/public drift if partial migration only.
- First safe batch: Batch 1.

### 4.2 Delivery / readiness
- Current duplicate authorities:
  - `buildPublishEligibilitySummary`
  - `buildDeliveryGateDecision`
  - generator hold/publication checks
  - worker status reinterpretation
  - dashboard status/error-code message recompute
- Desired sole canonical owner: Decision Canonical Layer (`delivery_gate_decision`).
- Surfaces that must obey it: generator response, worker transitions, dashboard states/copy.
- QA role after migration: verify response/job/dashboard conformance to gate payload.
- Migration risk: critical publish/hold inconsistency.
- First safe batch: Batch 2.

### 4.3 Current debt / refi
- Current duplicate authorities:
  - `buildCurrentDebtAssessmentState`
  - generator refi render state helpers
  - legacy fallback DSCR function
  - regex-based DSCR truth inference in QA
- Desired sole canonical owner: Financial Canonical Layer (`current_debt_refi_state`).
- Surfaces that must obey it: debt header/body, DSCR rows, scorecard, sensitivity sections, limitation copy.
- QA role after migration: compare rendered DSCR/labels to canonical state only.
- Migration risk: critical contradiction between not-assessed and numeric DSCR display.
- First safe batch: Batch 3.

### 4.4 Acquisition vs current debt
- Current duplicate authorities:
  - acquisition assumption state
  - parser semantic role/fallback role logic
  - rendered-signal based QA checks
- Desired sole canonical owner: Financial Canonical Layer (`acquisition_financing_state` + separation flags).
- Surfaces that must obey it: acquisition table render/collapse, debt exclusion copy, refi exclusion logic.
- QA role after migration: conformance check for separation and table values.
- Migration risk: critical contamination of current debt truth.
- First safe batch: Batch 4.

### 4.5 Section eligibility
- Current duplicate authorities:
  - `buildFullUnderwritingSectionEligibility`
  - rendered heading detection in source coverage QA
  - renderer branch stripping/injection
- Desired sole canonical owner: Coverage/Eligibility Layer (`section_eligibility_state`).
- Surfaces that must obey it: render/collapse/omit decisions.
- QA role after migration: verify section presence matches eligibility contract.
- Migration risk: high underused/omitted surface drift.
- First safe batch: Batch 5.

### 4.6 Data Coverage
- Current duplicate authorities:
  - canonical coverage states
  - renderer-assigned headline/severity modes
  - QA regex taxonomy checks
- Desired sole canonical owner: Coverage/Eligibility Layer + Decision Layer (`data_coverage_state`).
- Surfaces that must obey it: data coverage headline, limitations body, severity badges.
- QA role after migration: conformance only.
- Migration risk: high customer trust language drift.
- First safe batch: Batch 5.

### 4.7 Support-doc treatment
- Current duplicate authorities:
  - taxonomy state builder
  - parser text-based inferred doc type fallbacks
  - renderer filename fallback reason-code labels
- Desired sole canonical owner: Parser Canonical Layer (`support_doc_taxonomy_state`).
- Surfaces that must obey it: document-treatment tables, modeled/limited/listed labels.
- QA role after migration: detect treatment drift from taxonomy.
- Migration risk: high contamination risk.
- First safe batch: Batch 5.

### 4.8 Rent roll annual totals
- Current duplicate authorities:
  - canonical rent-roll metric resolver
  - generator local safe-rent fallback resolver
- Desired sole canonical owner: Financial Canonical Layer (`rent_roll_annual_totals`).
- Surfaces that must obey it: reconciliation variance, scoring inputs, rent sections.
- QA role after migration: compare rendered totals with canonical totals.
- Migration risk: critical reconciliation drift.
- First safe batch: Batch 5.

### 4.9 T12 operating truth
- Current duplicate authorities:
  - parser accepted T12 values
  - renderer conditional/fallback math paths
  - QA rendered-text inferencing
- Desired sole canonical owner: Parser + Financial Canonical Layers (`t12_operating_state`).
- Surfaces that must obey it: operating statement, NOI/ratio metrics, score factors.
- QA role after migration: conformance against canonical T12 state.
- Migration risk: high model credibility drift.
- First safe batch: Batch 5.

### 4.10 DCF / cap-rate provenance
- Current duplicate authorities:
  - renderer cap-source logic and labels
  - contract QA overclaim detection regex
- Desired sole canonical owner: Financial Canonical Layer (`valuation_assumption_state`).
- Surfaces that must obey it: DCF section labels and cap provenance notes.
- QA role after migration: overclaim conformance check only.
- Migration risk: high public/sample blocker risk.
- First safe batch: Batch 5.

### 4.11 Property tax
- Current duplicate authorities:
  - property_tax parser acceptance
  - full-underwriting-state binding interpretation
  - renderer/document treatment fallback labels
- Desired sole canonical owner: Parser Canonical + Financial Layers (`property_tax_state` with source identity).
- Surfaces that must obey it: modeled tax rows, treatment labels, coverage notes.
- QA role after migration: source-binding conformance checks.
- Migration risk: medium/high contamination risk.
- First safe batch: Batch 5.

### 4.12 Renovation / CapEx
- Current duplicate authorities:
  - parser renovation artifact truth
  - renderer display-mode/collapse copy heuristics
- Desired sole canonical owner: Financial Canonical + Coverage/Eligibility Layers (`renovation_state`).
- Surfaces that must obey it: renovation section visibility and wording.
- QA role after migration: conformance only.
- Migration risk: medium/high false-modeling risk.
- First safe batch: Batch 5.

### 4.13 Dashboard customer status
- Current duplicate authorities:
  - worker status transitions
  - dashboard status/error message recompute
  - gate payload not consistently authoritative in UI
- Desired sole canonical owner: Decision Canonical Layer (`customer_status_state` derived from delivery gate).
- Surfaces that must obey it: status badge, failed-state guidance, needs-doc messaging.
- QA role after migration: UI conformance checks to canonical payload.
- Migration risk: critical customer-facing mismatch risk.
- First safe batch: Batch 2.

## Section 5 - Canonical Authority Target Model

### Parser Canonical Layer
- typed artifacts
- source file identity
- semantic role metadata
- validator outcomes

### Financial Canonical Layer
- operating/T12
- rent roll
- current debt
- acquisition
- property tax
- valuation/cap-rate
- renovation where supported

### Coverage / Eligibility Layer
- core sufficiency
- optional/support constraints
- section eligibility
- Data Coverage class

### Decision Canonical Layer
- visible classification
- score/risk profile
- delivery/readiness
- customer/public/high-value gates
- diagnostics

### Renderer Layer
- formatting only
- no independent classification
- no independent financial calculations
- no independent source labels
- no independent section eligibility

### QA Layer
- state-to-render conformance
- public language checks
- contradiction detection
- not primary truth authority

### Worker Layer
- executes canonical gate/status
- does not reinterpret business truth

### Dashboard Layer
- displays canonical customer status/guidance
- does not recompute business meaning from raw error codes
## Section 6 - Migration Batch Plan

### Batch 1 - Classification / Visible Verdict Authority
- Objective: One canonical classification/verdict decision consumed by cover, executive summary, scorecard, and risk surfaces, with QA expected labels aligned.
- Ledger rows affected: DS-004, DS-005, DS-006, DS-007, DS-008, DS-053, DS-064, DS-065.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/generate-client-report.js`, `api/_lib/report-contract-qa.js`, possibly `api/_lib/full-underwriting-state.js`.
- Production invariant: one `visible_classification_state` object drives all rendered labels.
- Must become non-authoritative: renderer label overrides, regex truth inference.
- Tests required: visible label cross-surface conformance, cap reason conformance, no conflicting labels.
- Anti-hardcode proof required: no property/report-id/file-name conditional label branching.
- Rollback/safety notes: if drift appears, fail closed to canonical `Review` class without local overrides.

### Batch 2 - Delivery / Readiness Authority
- Objective: One `delivery_gate_decision` consumed by generator, qa_action_plan outputs, worker, and dashboard.
- Ledger rows affected: DS-045, DS-046, DS-047, DS-048, DS-049, DS-050, DS-052, DS-059, DS-060, DS-061, DS-068, DS-069.
- Files likely affected: `api/_lib/qa-action-plan.js`, `api/generate-client-report.js`, `api/admin-run-worker.js`, `src/pages/Dashboard.jsx`, `api/_lib/report-contract-qa.js`.
- Production invariant: `delivery_gate_status` and readiness flags are interpreted once.
- Must become non-authoritative: worker/dashboard reinterpretation from status/error-code fragments.
- Tests required: gate->worker->dashboard conformance matrix for deliverable/admin_review/user_needs_documents.
- Anti-hardcode proof required: no bespoke error-code message trees overriding canonical gate reason.
- Rollback/safety notes: preserve credit-restore safety path; do not loosen fail-closed blockers.

### Batch 3 - Current Debt / Refi Authority
- Objective: One current debt/refi state controls all headers, DSCR, debt body, scorecard, sensitivity, and QA.
- Ledger rows affected: DS-021, DS-022, DS-023, DS-024, DS-025, DS-026, DS-027.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/generate-client-report.js`, `api/_lib/report-contract-qa.js`, `api/_lib/source-report-coverage-qa.js`.
- Production invariant: no numeric current-debt DSCR surfaces when canonical status is not computed.
- Must become non-authoritative: `LEGACY_DO_NOT_USE` fallback and render-time debt reclassification.
- Tests required: assessed/not-assessed matrix across clean debt, no-debt, acquisition-only, partial terms.
- Anti-hardcode proof required: no property/document-specific debt exceptions.
- Rollback/safety notes: default to not-assessed with canonical limitation reason if state is uncertain.

### Batch 4 - Acquisition / Current Debt Separation Authority
- Objective: One acquisition/proposed financing state prevents acquisition terms becoming current debt and controls table render/collapse behavior.
- Ledger rows affected: DS-028, DS-029, DS-030, DS-036, DS-037, DS-067.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/parse/parse-doc.js`, `api/generate-client-report.js`, `api/_lib/report-contract-qa.js`, `api/_lib/source-report-coverage-qa.js`.
- Production invariant: acquisition assumptions never populate current debt balance/DSCR authority.
- Must become non-authoritative: rendered-text-based acquisition contamination truth logic.
- Tests required: acquisition-only, mixed docs, noisy text, contradictory loan text collapse behavior.
- Anti-hardcode proof required: no filename/property special-casing for acquisition promotion/suppression.
- Rollback/safety notes: collapse acquisition table to conservative limited disclosure on ambiguity.

### Batch 5 - Section Eligibility + Data Coverage Authority
- Objective: One section/data coverage decision layer controls render/collapse/omit and headline/severity, with QA conformance-only checks.
- Ledger rows affected: DS-001, DS-011..DS-020, DS-031..DS-044, DS-056..DS-058, DS-062, DS-064..DS-066.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/generate-client-report.js`, `api/_lib/source-report-coverage-qa.js`, `api/_lib/report-contract-qa.js`, `api/_lib/full-underwriting-state.js`.
- Production invariant: renderer does not independently decide section eligibility or data coverage severity.
- Must become non-authoritative: rendered-section regex inference and local section headline computation.
- Tests required: section eligibility matrix for Screening + Underwriting across core/optional/reconciliation/parser_suspected conditions.
- Anti-hardcode proof required: no per-report/per-property section force-show/hide logic.
- Rollback/safety notes: on uncertainty, prefer canonical constrained/omitted with explicit limitation disclosure.

## Section 7 - Screening Launch Protection Track
- Screening remains possible as first public launch path.
- Screening does not need completion of every Full Underwriting family, but shared decision-sprawl must be controlled.
- Screening-specific required checks:
  1. classification has one authority
  2. data coverage headline has one authority
  3. section eligibility is canonical/pre-render
  4. dashboard copy uses canonical gate/status payload
  5. underwriting debt/refi/acquisition language cannot leak into Screening
  6. public sample paths are fixed before launch
- No `Pricing.jsx` change is approved from this ledger alone.

## Section 8 - Full Underwriting Pause Doctrine
- Full Underwriting public self-serve remains paused.
- Full Underwriting may remain controlled beta/invite-only/operator-reviewed while architecture consolidation proceeds.
- Customer-deliverable does not equal public/sample/high-value ready.
- Do not create public underwriting sample PDFs from flawed reports.

## Section 9 - Working Rules for Every Future Patch
- micro-scoped
- one batch or sub-batch at a time
- audit-backed
- production root cause first
- tests after production fix
- no report-specific hacks
- no hardcoded property names / filenames / report IDs / one-off fixture values
- no public AI wording
- no BUY/SELL/HOLD language
- no broad refactor unless explicitly approved
- no casual new serverless/API route files because of Vercel Hobby function-count constraint
- receipt required every time

## Section 10 - Receipt Template for Future Codex Patches
- A. Files changed
- B. Ledger rows addressed
- C. Canonical authority selected/created
- D. Duplicate authority removed/quarantined/made read-only
- E. Renderer consumption proof
- F. QA changed from truth inference to conformance check, if applicable
- G. Tests added/updated
- H. Validation commands run
- I. Anti-hardcode proof
- J. Anything intentionally not touched
- K. Remaining ledger rows in this family
