# Stage 04: Underwriting Core Contract Layer

**Repository:** `rob01-web/investoriq`  
**Branch:** `investigation/full-repo-underwriting-audit`  
**Baseline:** `main` HEAD `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`  
**Scope:** read-only contract and authority audit. No production code, merge, deploy, live configuration, customer data, credits, jobs, or RETEST changed.

## Files inspected

- `api/_lib/report-request-context.js`
- `api/_lib/report-identity-authority.js`
- `api/_lib/report-surface-contracts.js`
- `api/_lib/acquisition-memo-v2-pipeline.js`
- `api/_lib/acquisition-memo-v2-customer-surface-model.js`
- `api/_lib/screening-report-pipeline.js`
- `api/_lib/source-report-coverage-qa.js`
- `api/_lib/institutional-financial-intelligence.js`
- `api/_lib/institutional-underwriting-input-contract.js`
- `api/_lib/premium-acquisition-underwriting-v1-model.js`
- `api/_lib/premium-acquisition-underwriting-v1-job-surface-authority.js`
- `api/_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js`
- `api/_lib/premium-acquisition-underwriting-v1-external-generation.js`
- `api/_lib/premium-acquisition-underwriting-v1-renderer.js`
- `api/_lib/premium-acquisition-underwriting-v1-validated-model.js`
- `api/_lib/premium-acquisition-underwriting-v1-internal-certification.js`
- `api/_lib/premium-acquisition-underwriting-v1-external-certification.js`
- `api/_lib/report-delivery-output.js`
- `api/admin-run-worker.js` and `api/admin/run-eligible-jobs-once.js` call sites for surface receipts
- repository-scoped call-site searches and the active QA smoke files for sealed-lane assertions

## Runtime path reconstruction

### 1. Screening

`resolveReportTypeAndTier` defaults to `screening`, tier 1, mode `screening_v1` only when neither request nor job has an explicit type. Explicit `screening` and `screening_report` resolve to the same canonical Screening identity. `runScreeningReportPipeline` requires a canonical Source Truth package when requested, rejects delivery that contradicts non-publishable source truth, requires a passing deterministic contract QA seal, then returns a sealed `screening_lane` output. Active production dispatch is in the large report implementation, not in the public shim; the sealed-lane smoke tests assert Screening does not call Acquisition Memo V2 or use Acquisition customer-surface authority.

**Classification:** active, canonical, tier 1. Screening cross-touch with Acquisition is guarded by source and smoke contracts, but the large implementation remains a separate authority surface to inspect in Stage 5.

### 2. Legacy Underwriting

`resolveReportTypeAndTier` maps `underwriting`, `full_underwriting`, `underwriting_report`, `underwriting_v1`, `tier_2`, and `tier2` to canonical `underwriting`, tier 2, mode `v1_core`. `report-identity-authority.js` additionally accepts `acquisition`, `acquisition_memo`, `underwriting_report`, and `underwriting_v1` as the same Underwriting identity. `UNDERWRITING_REPORT_IDENTITY` is therefore the compatibility identity for both legacy Underwriting and current Acquisition Memo. The active V1 core path uses the underwriting section blueprints, report-surface contracts, source coverage QA, and the V1-compatible rendering path.

**Classification:** active, canonical V1 core mode with compatibility aliases. Aliases are compatibility-only in doctrine, but remain accepted by the runtime identity resolver.

### 3. Current Acquisition Memo

The current Acquisition Memo is represented by `reportFamily: acquisition_memo`, `reportMode: v1_core`, and the `acquisition-memo-v2` pipeline. `runAcquisitionMemoV2Pipeline` requires a canonical Source Truth package when `sourceTruthRequired` is true and requires `core_publishable === true`; it then delegates final HTML ownership to `finalizeAcquisitionMemoV2Html`, returns `sealedCustomerOutput: true`, and marks the V2 lane as owning final HTML. The active report implementation's V2 branch is protected by mode checks and source-authority flags; smoke tests assert that the V2 slice calls `runAcquisitionMemoV2Pipeline` and does not run legacy treatment helpers after the V2 final-output boundary.

**Classification:** active for `v1_core` Acquisition Memo routing when the V2 bridge/source-authority conditions are satisfied. It is not a distinct identity from legacy Underwriting at `report-identity-authority.js` level.

### 4. Premium Acquisition Underwriting V1

Premium assignment begins at job start, not at render time. `resolvePremiumAcquisitionUnderwritingV1JobSurface` accepts only `screening` or `underwriting`, a known surface version, a valid job ID, and a valid start timestamp. Premium is assigned only when the requested version is premium, the capability flag is enabled, and the report type is `underwriting`. The persisted receipt is immutable and canonical. External assignment uses `assignmentScope: external_job_start`, establishes `externalPremiumPromiseEstablished: true`, and requires external certification. With the flag off, the helper assigns the base surface version.

The premium Phase 1 model is explicitly a disconnected skeleton. The validated expansion model is also explicitly disconnected from renderer/publication authority, but external generation can build a validated model from canonical Source Truth, canonical financial intelligence, the canonical Underwriting Input Contract, and deterministic source-case, valuation, and capital-structure analyses. The premium renderer is feature-flagged and surface-version-gated, consumes the validated model without recalculation, and emits only eligible source-backed sections. Internal certification is test-only. External certification is required for an external job-start promise and is enforced as a publication blocker by the worker.

**Classification:** feature-flagged and default-off by doctrine/configuration. The code has a reachable external generation/certification path when the flag and activation timestamp are enabled, but the current model contracts still describe the expansion as disconnected. This is a contract tension, not evidence that production is currently using Premium.

## Authority graph

`request body/job report_type` -> `resolveReportTypeAndTier` -> canonical `reportType/reportTier/effectiveReportMode` -> report implementation dispatch -> canonical Source Truth -> canonical Institutional Financial Intelligence + Underwriting Input Contract -> either Screening sealed lane or Acquisition Memo V2 sealed lane -> customer-surface model / renderer -> deterministic contract QA and delivery decision -> report identity receipt at PDF certification -> publication record/storage.

Premium is an overlay on the Underwriting branch: job-start surface receipt -> premium external generation -> validated model -> premium renderer/observation -> external certification -> worker publication enforcement. Premium does not own Source Truth, delivery, publication, billing, or remedy authority.

## Authority and compatibility conclusions

- **Report identity:** canonical identity is centralized in `report-identity-authority.js`, but `report-request-context.js` independently owns token normalization, tier, and mode. These contracts are not identical.
- **Screening vs Underwriting:** mode and tier gate most debt/underwriting behavior. Screening has its own pipeline and sealed lane. `buildCanonicalVisibleClassificationState` explicitly treats tier 2 as Underwriting, while Screening retains a separate classification branch.
- **Current debt vs proposed financing:** the core contracts strongly separate `current_debt_context` from `purchase_assumptions` / `proposed_acquisition_debt`; financial intelligence emits distinct currentDebt and proposedFinancing calculations and customer sections. Acquisition-only terms are explicitly excluded from current-debt DSCR/refinance basis.
- **Section eligibility:** `buildFullUnderwritingSectionEligibility` is the canonical eligibility computation when canonical state is present. `source-report-coverage-qa.js` also reconstructs fallback debt/acquisition/coverage states when canonical authority is absent and records that compatibility mode. Rendered headings are treated as conformance signals, not as the canonical eligibility source when canonical state exists.
- **Base fallback:** job-surface assignment has an explicit base fallback when Premium is off or not requested. The Premium external-generation function returns a base-surface result when no Premium receipt or a base receipt is supplied. However, a Premium generation exception is thrown as `REPORT_RENDER_FAILED`; no fallback-to-base is visible inside the Premium generation module itself. The worker's surrounding fallback behavior remains a Stage 5/6 dispatch question.

## Proven findings

### F-024 - HIGH - Report type resolver accepts `ic` but canonical report identity has no IC identity

`report-request-context.js` maps explicit `ic` to report type `ic`, tier 3, and mode `v1_core`. `report-identity-authority.js` recognizes only Screening and Underwriting identities and returns `null` for `ic`. Downstream identity, PDF, and publication contracts therefore receive a type/mode combination that the canonical identity authority cannot represent.

**Status:** PROVEN. **Owner:** report identity/routing. **Doctrine impact:** every promised customer surface needs one representable canonical identity. **Evidence:** the two resolver/identity files above.

### F-025 - HIGH - Acquisition and legacy Underwriting share one canonical identity

`UNDERWRITING_REPORT_IDENTITY` uses `identityKey: underwriting`, `reportFamily: acquisition_memo`, `reportMode: v1_core`, and accepts `acquisition`, `acquisition_memo`, `full_underwriting`, and multiple Underwriting aliases. This makes current Acquisition Memo and legacy Underwriting indistinguishable to the canonical identity receipt. The runtime lane may differ, but the identity receipt cannot prove which promised product surface was delivered.

**Status:** PROVEN. **Owner:** report identity/routing. **Doctrine impact:** Screening, base Acquisition, and Premium promises require non-drifting identity and explicit surface lineage.

### F-026 - HIGH - Multiple components can decide customer-surface identity and readiness

Identity/mode is resolved in `report-request-context.js`; canonical identity is rebuilt in `report-identity-authority.js`; customer surface identity fields are reconstructed in `acquisition-memo-v2-customer-surface-model.js`; visible classification is independently resolved in `report-surface-contracts.js`; delivery compatibility aliases are generated in `report-delivery-output.js`; and PDF publication re-derives identity from report metadata/type. Each component has guardrails, but there is no single immutable customer-surface receipt propagated through every boundary for the base V1 path.

**Status:** PROVEN. **Owner:** cross-cutting authority graph. **Doctrine impact:** no component after identity assignment should be able to silently change the promised surface.

### F-027 - HIGH - Legacy fallback reconstruction remains authoritative when canonical authority is absent

`source-report-coverage-qa.js` explicitly falls back to reconstructed debt, acquisition, source-reconciliation, sufficiency, and section-eligibility states when canonical inputs are missing. It records `legacy_fallback_active`, but still uses those reconstructed states to drive coverage flags and eligibility output. This is compatibility behavior, not dead code, and it can produce a different answer from canonical Source Truth when upstream receipts are absent.

**Status:** PROVEN. **Owner:** coverage/eligibility. **Doctrine impact:** compatibility heuristics must not become a second truth authority for a valid-core report.

### F-028 - HIGH - Premium validated model is simultaneously disconnected by contract and renderable by reachable code

The Premium model and validated model set `integration.connected: false`, `rendererInsertionPresent: false`, `customerSurfaceEligible: false`, and no publication authority. Yet external generation builds the validated model for an external job-start receipt, and the Premium renderer emits customer-facing HTML when the flag and surface version are enabled. External certification then authorizes publication after observing the rendered surface. The architecture may be intentional staged rollout, but the disconnected status fields no longer describe the eventual enabled path accurately.

**Status:** PROVEN. **Owner:** Premium surface activation. **Doctrine impact:** activation state must unambiguously distinguish disconnected test model, enabled internal test surface, and externally promised customer surface.

### F-029 - HIGH - Premium failure has no local base-surface fallback

`buildPremiumAcquisitionUnderwritingV1ExternalGeneration` returns a base result only when there is no premium receipt or the receipt is already base. Once an external premium promise exists, any failure building the canonical input contract, deterministic analyses, or validated model is converted to `PREMIUM_UNDERWRITING_EXTERNAL_GENERATION_FAILED` with `REPORT_RENDER_FAILED` and thrown. The function does not invoke base Acquisition fallback. A valid base Acquisition report may therefore exist conceptually while the promised Premium job is failed rather than downgraded safely.

**Status:** PROVEN for the Premium generation module; worker-level fallback resolution remains open. **Owner:** Premium activation/worker. **Doctrine impact:** a valid base report must not disappear solely because an optional Premium expansion failed, unless the external promise explicitly requires fail-closed blocking.

### F-030 - MEDIUM - Legacy visible-title aliases remain accepted at PDF identity boundaries

Underwriting identity accepts visible titles `Underwriting Report`, `Acquisition Memo`, and `Acquisition Memorandum`, while Screening prohibits those titles. This preserves compatibility but permits multiple visible names for one identity and leaves title choice to downstream renderers/metadata. The canonical PDF anchor is only `Underwriting Report`, so an Acquisition Memo title can be accepted as identity input but fail or be normalized differently at PDF certification.

**Status:** PROVEN. **Owner:** identity/PDF publication. **Doctrine impact:** compatibility aliases should be input-only and must resolve to one explicit output title.

### F-031 - MEDIUM - Premium surface assignment is immutable only after the first successful receipt write

The receipt helper reads up to two existing receipts, rejects duplicates, and otherwise inserts a new receipt. Stage 3 already proved this read-then-write can fail after claim. Stage 4 confirms that all subsequent Premium generation and certification trusts this receipt. Until a unique constraint or atomic insert contract is proven in migrations, assignment can be absent, duplicated, or leave a claimed job stranded.

**Status:** PROVEN. **Owner:** worker/surface assignment. **Doctrine impact:** the promised surface must be durably assigned at job start exactly once.

## Path status matrix

| Path | Active? | Feature flag | Reachability | Surface authority |
|---|---|---|---|---|
| Screening | Yes | No | default when no explicit type; explicit Screening aliases | Screening pipeline + canonical identity |
| Legacy Underwriting | Yes | No | explicit Underwriting aliases | V1 core / underwriting identity |
| Current Acquisition Memo | Yes | No separate flag visible | `v1_core` with V2 source/bridge conditions | Acquisition Memo V2 sealed lane, but shared Underwriting identity |
| Premium Acquisition Underwriting V1 | Code-complete staged path | `PREMIUM_ACQUISITION_UNDERWRITING_V1` plus activation timestamp | only valid external job-start receipt and enabled capability | Premium receipt + external cert + worker enforcement |
| IC | Inconsistent | No | request resolver accepts `ic` | no canonical identity; treat as unsupported until resolved |

## Stage conclusion

The core contracts are materially better than the worker path: Source Truth, financial intelligence, current/proposed debt separation, and section eligibility have explicit receipt-style boundaries. The remaining launch risk is authority multiplication. The largest unresolved questions for later stages are whether the full report handler invokes a base fallback after Premium/V2 failures, and whether the V1 core renderer can emit an Acquisition Memo or legacy Underwriting title without a distinct output identity receipt.
