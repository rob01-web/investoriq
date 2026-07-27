# Stage 06: Memo V1 versus V2 Lane Resolution

**Repository:** `rob01-web/investoriq`  
**Branch:** `investigation/full-repo-underwriting-audit`  
**Baseline:** `main` HEAD `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`  
**Scope:** read-only lane audit. No production code, merge, deploy, environment change, customer-data change, credit/job mutation, or live RETEST.

## Files inspected

`api/_lib/acquisition-memo-projection.js`, `acquisition-memo-renderer.js`, `acquisition-memo-boss-contract.js`, `acquisition-memo-v2-pipeline.js`, `acquisition-memo-v2-orchestrator.js`, `acquisition-memo-v2-document.js`, `acquisition-memo-v2-customer-surface-model.js`, `acquisition-memo-v2-final-delivery-decision.js`, `acquisition-memo-v2-role-reconciler.js`, `acquisition-memo-v2-boss-repair.js`, `report-request-context.js`, `report-identity-authority.js`, `report-delivery-output.js`, `final-pdf-publication-quality-boss.js`, Premium model/validated-model/renderer/external-generation/internal-certification/external-certification/job-surface-authority/job-start-receipt files, `screening-report-pipeline.js`, `source-report-coverage-qa.js`, `admin-run-worker.js`, `api/admin/run-eligible-jobs-once.js`, active QA lane smoke files, and repository call-site searches.

## Lane comparison matrix

| Lane | Entrypoint | Identity | Schema / inputs | Renderer / sections | PDF + certification | Production status |
|---|---|---|---|---|---|---|
| Screening | report implementation branch -> `runScreeningReportPipeline` | screening / screening_v1 / tier 1 | canonical Source Truth, screening coverage, deterministic QA seal | Screening renderer and Screening sealed lane | common report-delivery PDF path, final PDF Boss | Active, no Premium flag; cross-touch guarded |
| Legacy Underwriting | report implementation `v1_core` branch | underwriting / acquisition_memo / v1_core / tier 2 | Source Truth or compatibility projection, Boss Contract, core metrics | legacy V1 helpers and document sections | common PDF path, Boss + deterministic QA + PDF Boss | Active compatibility path; not retired |
| Acquisition Memo V1 | `buildAcquisitionMemoProjection` -> `renderAcquisitionMemo` | same Underwriting identity | canonical source package projection, support-doc projection, financial intelligence | `acquisition-memo-renderer.js`, mainly treatment/readiness/source summaries | common PDF path when composed by V2 document/route | Real producer helper, but not a complete standalone final document |
| Acquisition Memo V2 | `runAcquisitionMemoV2Pipeline` -> orchestrator -> `renderCompleteAcquisitionMemoV2Html` | same Underwriting identity, report family acquisition_memo | canonical Source Truth, V2 projection, customer-surface model, Boss Contract, financial intelligence | V2 document renderer, Boss enforcement, V2 surface validation, repair plan, final delivery decision; full Underwriting section set | common PDF path; deterministic contract QA, final PDF Boss; Premium overlay may be inserted | Active primary Acquisition Memo lane under `v1_core` conditions |
| Premium Acquisition Underwriting | job-start receipt -> external generation -> validated model -> Premium renderer -> external cert/enforcer | underwriting identity plus premium surface version | canonical Source Truth, institutional financial intelligence, underwriting input contract, deterministic analyses | Premium renderer sections: operating, debt/valuation, evidence/methods; only eligible receipts | external certification requires generation receipt, model validation, observe-only completeness, strict production PDF Boss | Feature-flagged/default-off; staged, not safe as default base |
| Recommended launch Full Underwriting lane | preliminary only: V2/base Underwriting lane with canonical Source Truth and receipt-only calculations | should become a distinct explicit Full Underwriting identity before launch | canonical Source Truth + institutional financial intelligence + V2 surface model | V2 document owner, no legacy factual fallbacks | common PDF path with deterministic QA and PDF Boss | Preliminary recommendation, not implementation approval |

## Runtime answer: what V1 versus V2 actually is

It is **not two clean, independent production pipelines**. It is a **partially merged architecture**:

- V1 means the projection and “dumb” renderer helpers, especially document-treatment and readiness summaries.
- V2 means the orchestrator, customer-surface model, full document renderer, Boss repair/validation, deterministic QA seal, and final delivery decision.
- V2 still calls V1 projection/renderer helpers as inputs for selected summaries, while explicitly owning the final HTML boundary.
- Both are reachable through direct imports in tests and helper code. Production route dispatch is mode/flag gated, but V1 helpers remain live compatibility components rather than genuinely retired code.
- Legacy Underwriting and current Acquisition Memo normalize to the same `underwriting` / `v1_core` identity, so runtime lane distinction is stronger than persisted product identity.

## Exact authority and publication path

Paid job -> worker calls generation route -> report implementation resolves report type/mode -> canonical Source Truth and financial intelligence -> V2 bridge/projection -> V2 customer-surface model -> V2 document renderer -> Boss enforcement/repair -> customer-surface HTML validation -> deterministic contract QA seal -> final delivery decision -> `resolveOrCreateReportPublicationRecord` -> `ensureReportDownloadArtifact` -> PDF artifact mode resolution -> DocRaptor or stub/test PDF -> final PDF publication Boss -> storage upload and verification -> published job.

Premium overlays the Underwriting path at job start. Its external generation and certification are only valid after an immutable external Premium receipt. The Premium renderer has a distinct section schema and does not own base delivery or publication authority.

## Reuse classification

| Capability | Classification |
|---|---|
| Canonical Source Truth and receipt-only financial intelligence | Safe reusable deterministic foundation |
| V2 Boss validation, repair routing, surface validation, final delivery decision | Safe reusable presentation/control boundary, subject to Stage 7/8 verification |
| V1 projection normalization of accepted support roles | Safe reusable presentation adapter, not factual authority |
| V1 `renderAcquisitionMemo` treatment/readiness/source summaries | Safe reusable presentation component only |
| V1 factual supplementation/parsing helpers inside Boss contract | Requires rewrite against canonical Source Truth; unsafe as authority |
| Legacy core metrics / raw text / filename fallback branches | Unsafe legacy factual authority; do not reactivate |
| Premium validated deterministic calculations | Safe reusable deterministic calculations once activation/certification contract is complete |
| Premium model’s disconnected status fields | Requires contract cleanup before external base use |
| Duplicate V1/V2 title and identity aliases | Duplicate / compatibility-only; normalize output identity |
| Old archive docs and test fixtures | Documentation/test provenance only; permanently retire as runtime authority |

## Proven findings

### F-041 - BLOCKER - V1 and V2 share a production identity while owning different schemas and sections

`report-request-context.js` and `report-identity-authority.js` normalize legacy Underwriting and current Acquisition Memo to `underwriting`, tier 2, `v1_core`, with `reportFamily: acquisition_memo`. V1 projection/renderer and V2 customer-surface/document renderer consume different shapes and expose different section ownership, but the persisted/report-level identity does not distinguish them. A report can therefore be operationally V1 or V2 while the customer and publication records say the same thing.

**Status:** PROVEN. **Severity:** BLOCKER. **Owner:** lane identity/dispatch. **Doctrine impact:** the promised Full Underwriting surface must be immutable and unambiguous.

### F-042 - HIGH - V1 factual fallback logic remains reachable inside the V2 contract path

The V2 document and Boss contract are designed to consume canonical models, but the inspected code retains non-canonical fallbacks for core metrics, source snippets, purchase terms, current debt terms, and text extraction when canonical mode is false or when sections are incomplete. V1 projection is source-package-only, but Boss/document helpers still contain legacy supplementation and raw-text fallback branches. V2 is therefore a governed lane with residual V1 factual escape hatches.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** V2 renderer/compatibility. **Doctrine impact:** no legacy fact reconstruction may override canonical Source Truth.

### F-043 - HIGH - V2 renderer expects a different schema from the V1 projection and Premium model

V1 projection emits support-doc rows and readiness signals. V2 customer-surface sections use `status`, `factAvailability`, `sourceBacked`, and role-specific `facts`. Premium uses `status: eligible`, `customerSurfaceEligible`, and calculation receipts with `sourceBound`. The V2 orchestrator maps among these schemas but no single typed contract proves the mapping is lossless for every section. Schema mismatch can collapse or omit a valid section without a source-truth failure.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** lane schema boundary. **Doctrine impact:** producer, renderer, and certification must share one explicit surface schema.

### F-044 - HIGH - Premium failure is fail-closed without a governed fallback to base Full Underwriting

Once an external Premium promise is assigned, Premium external generation throws on canonical-input/model failure. The Premium module itself does not call the base V2 pipeline. External certification also blocks publication when Premium certification is missing. There is no inspected governed rule that preserves a valid base report while transparently recording Premium expansion failure. This is a deliberate fail-closed posture, but it creates a full-report availability risk if Premium is ever used as the base lane.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** Premium activation/worker. **Doctrine impact:** optional expansion failure must have an explicit customer and entitlement outcome.

### F-045 - HIGH - Legacy Underwriting aliases can enter the same V2 lane without a distinct product contract

Aliases `full_underwriting`, `underwriting_report`, `underwriting_v1`, `tier_2`, `tier2`, `acquisition`, and `acquisition_memo` all resolve to the same canonical type/mode. The runtime may choose V2 based on `v1_core` and bridge conditions, but the alias itself does not establish whether the customer purchased legacy Underwriting, Acquisition Memo, or Premium. This makes accidental lane entry possible through compatibility inputs.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** identity/routing. **Doctrine impact:** aliases must normalize to one explicit promised surface, not several.

### F-046 - MEDIUM - Public sample and internal test paths exercise renderer helpers directly rather than paid production dispatch

The repository contains direct V1/V2 renderer fixtures, sample report generation scripts, `SampleReport` page references, and Premium internal-test assignment paths. These paths validate useful components but do not prove parity with the paid worker -> report route -> PDF artifact -> publication path. The test-only Premium path can render a surface that is not externally promised, while the public sample can differ from paid production mode.

**Status:** PROVEN. **Severity:** MEDIUM. **Owner:** QA/sample parity. **Doctrine impact:** sample and test outputs must declare their lane and cannot be treated as production evidence.

### F-047 - MEDIUM - V2 document code still exposes a legacy `renderAcquisitionMemo` helper alongside the complete V2 renderer

`acquisition-memo-v2-document.js` exports both `renderAcquisitionMemo` and `renderCompleteAcquisitionMemoV2Html`. The former is a lightweight treatment-summary producer and the latter owns the complete HTML document. The names are close enough to invite accidental use of the incomplete helper as a final renderer, especially because tests and fixtures call both.

**Status:** PROVEN. **Severity:** MEDIUM. **Owner:** lane API surface. **Doctrine impact:** one final renderer should be obvious and unambiguous.

### F-048 - LOW - Premium renderer section set is narrower than the promised Full Underwriting section universe

Premium renderer defines three chapters and ten rendered section keys, while the Premium model declares fifteen section keys and the V2/Boss surface contains additional operating, source, capital, methodology, diligence, and support sections. Premium can be certified with only its eligible subset, so “Premium Underwriting” does not necessarily mean the complete Full Underwriting surface.

**Status:** PROVEN. **Severity:** LOW. **Owner:** Premium product definition. **Doctrine impact:** product promise must specify whether Premium is an expansion, a complete report, or an overlay.

## Preliminary launch decision

**Do not make Premium Acquisition Underwriting V1 the base Full Underwriting lane yet.** The safer preliminary base is the existing **V2/base Underwriting lane**, after the remaining dispatch, parser, migration, and PDF stages prove it end-to-end. Premium should remain an explicitly feature-flagged, externally certified overlay/expansion until its product identity, section completeness, and governed fallback behavior are resolved.

This is a preliminary lane decision only, not an implementation recommendation.
