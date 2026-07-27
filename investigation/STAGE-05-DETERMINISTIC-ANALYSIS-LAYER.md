# Stage 05: Deterministic Analysis Layer

**Repository:** `rob01-web/investoriq`  
**Branch:** `investigation/full-repo-underwriting-audit`  
**Baseline:** `main` HEAD `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`  
**Scope:** read-only. No production patch, merge, deploy, environment change, customer-data change, credit/job mutation, or live RETEST.

## Files inspected

`source-truth-package.js`, `support-document-authority-adjudicator.js`, `core-reconciliation-input-contract.js`, `deterministic-core-reconciliation-analysis.js`, `debt-service-input-contract.js`, `deterministic-debt-service-calculation.js`, `deterministic-dscr-analysis.js`, `institutional-underwriting-input-contract.js`, `institutional-financial-intelligence.js`, `deterministic-acquisition-valuation-analysis.js`, `deterministic-acquisition-capital-structure-analysis.js`, `capital-plan-input-contract.js`, `deterministic-capital-plan-analysis.js`, `report-surface-contracts.js`, `source-report-coverage-qa.js`, `acquisition-memo-v2-customer-surface-model.js`, `premium-acquisition-underwriting-v1-validated-model.js`, `premium-acquisition-underwriting-v1-renderer.js`, `premium-acquisition-underwriting-v1-external-generation.js`, `report-delivery-output.js`, plus the active call-site searches and relevant QA smoke references.

## Fact-lineage matrix

| Fact | Canonical source / binding | Deterministic consumer | Customer-surface handoff | Lineage result |
|---|---|---|---|---|
| Total units | accepted `core.rent_roll.accepted_facts.total_units`, file-level provenance | valuation/capital/reconciliation inputs | V2 model also reads core metrics/rent-roll facts | **Mixed handoff** |
| Occupancy | accepted core rent-roll fact/sufficiency state | not part of institutional financial-intelligence calculations | V2 model reads `coreMetrics` or rent-roll extracted facts | **No dedicated canonical calculation receipt** |
| Current rent | rent-roll accepted fact / reconciliation-selected annual measure | reconciliation | V2 model reads core metrics and rent-roll facts | **Mixed handoff** |
| Market rent | accepted rent-roll fact | acquisition input eligibility / surface | V2 model reads core metrics/rent-roll facts | **No dedicated canonical receipt** |
| Annual in-place rent | reconciliation state and source-selection path | core reconciliation | surface reconciliation plus core metrics | **Canonical only when selection contract survives** |
| Annual market rent | accepted rent-roll fact | rent bridge eligibility | surface reads core metrics/rent-roll facts | **No dedicated calculation receipt** |
| T12 GPR | reconciliation state bound back to accepted T12 fact | core reconciliation | surface T12 facts | **Canonical reconciliation-bound** |
| EGI | accepted T12 fact | underwriting input / sufficiency | surface core T12 facts | **File-level core provenance only** |
| Operating expenses | accepted T12 fact and expense lines | sufficiency, financial intelligence eligibility | surface core T12 facts | **File-level core provenance only** |
| NOI | accepted T12 fact | DSCR, valuation | surface core T12 facts | **Canonical calculation inputs, surface can also use core metrics** |
| Purchase price | accepted purchase-assumptions fact, cross-checked against valuation receipt | valuation/capital structure | V2 acquisition section | **Strong, identity-checked** |
| Appraisal value | accepted appraisal fact | valuation analysis | V2 appraisal section | **Strong support evidence binding** |
| Current debt balance | accepted current-debt support fact | current debt service/DSCR/risk | V2 current debt section | **Strong role separation** |
| Proposed loan amount | accepted purchase-assumptions fact | proposed debt service, capital structure | V2 proposed financing section | **Strong role separation** |
| Current/proposed interest rate | same field name, role-scoped contracts | role-specific debt-service calculations | role-specific surface sections | **Role separation holds** |
| Current monthly payment | accepted current-debt fact | source-stated current debt service | current debt section | **Exact support evidence required** |
| Proposed annual debt service | accepted proposed terms -> deterministic amortization | proposed DSCR | proposed financing/debt coverage | **Canonical modeled and qualified** |
| Current/proposed DSCR | accepted NOI + role-specific debt service | deterministic DSCR | financial-intelligence customer sections | **Canonical receipt-bound** |
| Maturity date | accepted support fact, role-scoped | debt risk / surface | V2 debt sections | **Support evidence bound** |
| Renovation budget | accepted renovation/property-condition fact | capital-plan analysis | V2 renovation/capital sections | **Support evidence bound** |
| Cost per unit | renovation row exact evidence binding | no broad downstream canonical calculation found | surface may render row facts | **Row-bound when accepted** |
| Expected rent lift | renovation row exact evidence binding | not promoted to return/ROI calculation | surface context only | **Bound but not modeled** |
| Capital-plan timing | deterministic month-range/explicit-duration binding | capital-plan timing analysis | surface capital plan | **Exact excerpt binding, but horizon ambiguity collapses all timing** |

## Exact runtime lineage

1. Parser artifacts and extracted text enter `buildCanonicalSourceTruthPackage`.
2. The package selects one validated T12 and one validated Rent Roll using sufficiency state, explicit validation, completeness, timestamp, and artifact ID ordering.
3. Core facts are accepted as a package entry. Core fact provenance identifies file/artifact and fact path, but does not carry an exact source excerpt per numeric field.
4. Support documents are adjudicated by semantic family, raw-text anchors, evidence binding, role ambiguity, disclaimer detection, and exact labeled-value excerpts. Duplicate fingerprints, conflicts, and narrow fact conflicts are retained as advisory/conflict structures rather than customer blockers.
5. Core reconciliation binds T12 GPR and Rent Roll annual in-place values to the package's source-selection path before deterministic comparison. It calculates difference, variance, direction, and per-unit-month difference, with no cause inference or publication block.
6. Debt input contracts construct role-specific current-debt and purchase-assumptions bundles. Current debt allows source monthly payment or deterministic amortization; proposed financing allows deterministic amortization only.
7. Debt service rounds modeled monthly debt service to cents, then annualizes the rounded monthly amount by 12. DSCR divides accepted annual NOI by that annual result and stores numerator/denominator provenance.
8. Institutional financial intelligence consumes debt, reconciliation, and capital-plan contracts and emits receipt-only calculations and customer sections. It does not create source authority or publication authority.
9. Valuation and capital-structure analyses consume the institutional underwriting input contract, require source identity/role matches, and emit formula receipts with input provenance. They explicitly do not infer future value, returns, recommendations, refinance proceeds, or total equity.
10. Capital-plan analysis binds renovation/property-condition facts, timing, reserve comparisons, and per-unit reserve contribution. It does not infer missing buckets as zero or classify adequacy without policy authority.
11. The V2 customer-surface model consumes canonical financial intelligence when present, but also directly derives units, occupancy, annual rents, EGI, OpEx, NOI, break-even occupancy, purchase price, and cap-rate values from `coreMetrics`, `coreSources`, and projection objects. PDF publication re-derives identity and certifies the resulting artifact.

## Proven findings

### F-032 - HIGH - Core numeric facts lack exact excerpt-level evidence lineage

`buildCanonicalSourceTruthPackage` accepts T12 and Rent Roll facts from validated parser artifacts and records file/artifact/fact-path provenance, but `buildCoreEntry` does not attach per-fact source excerpts or exact binding methods. Support facts do require exact evidence in the support authority path. Therefore core numbers such as total units, occupancy, EGI, OpEx, NOI, annual rent, and market rent can be source-file-bound without the same exact evidence lineage demanded of support facts.

**Status:** PROVEN. **Owner:** Source Truth/evidence binding. **Doctrine impact:** every customer-facing financial number should be traceable to an accepted fact and exact source evidence.

### F-033 - HIGH - Customer surface directly re-derives core facts outside receipt-only financial intelligence

`acquisition-memo-v2-customer-surface-model.js` derives units, occupancy, annual in-place rent, annual market rent, EGI, OpEx, NOI, gross potential rent, break-even occupancy, purchase price, and going-in cap rate from `coreMetrics`, `coreSources`, and projection values, while `institutional-financial-intelligence.js` separately emits canonical receipt sections and calculations. The surface model can therefore disagree with receipt values without a single calculation receipt being the sole binding source for those facts.

**Status:** PROVEN. **Owner:** customer-surface binding. **Doctrine impact:** renderers must consume canonical facts and receipts, not recreate financial truth.

### F-034 - HIGH - Same annual in-place rent metric has materially different selection authorities

The canonical reconciliation path uses `resolveCanonicalRentRollAnnualMetric`, which compares summary totals, row-derived annual rent, weighted averages, partial-sample signals, contradictions, and source-selection preference. The fallback `buildRentRollSufficiencyState` independently chooses the first available annual rent candidate from a simpler ordered list, then may derive from rows. `source-report-coverage-qa.js` can use the fallback state when canonical sufficiency/coverage authority is absent. The same annual in-place rent can therefore differ between canonical reconciliation and compatibility coverage.

**Status:** PROVEN. **Owner:** source reconciliation/coverage QA. **Doctrine impact:** one metric needs one authority and one annualization rule.

### F-035 - HIGH - Canonical Source Truth can silently reject a valid-looking support artifact before active adjudication

`source-truth-package.js`'s legacy helper `isAcceptedSupportArtifact` requires `payload.validated === true` and coherent facts, while the active adjudicator can accept a role from exact text evidence and semantic-family evidence even when the parser payload does not carry that boolean. The legacy result is used for `acceptedArtifact` in shadow comparison and the active decision is separately used for authoritative accepted entries. This split is proven compatibility drift: shadow/legacy and active authority can disagree about the same file.

**Status:** PROVEN. **Owner:** support authority. **Doctrine impact:** legacy compatibility must not create a second accepted/rejected truth path.

### F-036 - MEDIUM - Modeled debt service annualization is based on rounded monthly service

`deterministic-debt-service-calculation.js` rounds modeled monthly debt service to cents and then multiplies that rounded value by 12. A direct annual amortization calculation would generally differ by a small amount. DSCR consumes the rounded annual result, while other renderers or legacy helpers may annualize or recompute independently. The method is documented, but the rounding boundary is a proven drift risk.

**Status:** PROVEN. **Owner:** debt-service/DSCR. **Doctrine impact:** displayed debt service and DSCR must share one canonical annual result.

### F-037 - MEDIUM - Core validation accepts completeness without field-level evidence binding

T12/Rent Roll sufficiency validates aggregate structure and equations, and Source Truth selects the best validated artifact. It does not require exact evidence objects for each accepted core field before the field is copied into `accepted_facts`. This is distinct from support facts, which require matching evidence excerpts. A structurally valid artifact can therefore supply multiple customer-facing core numbers with weaker evidence semantics than support numbers.

**Status:** PROVEN. **Owner:** core parser/Source Truth. **Doctrine impact:** valid structure is not the same as field-level evidence lineage.

### F-038 - MEDIUM - Capital-plan timing ambiguity collapses the entire timing fact set

`capitalPlanTimingFromSource` returns no accepted timing facts when it finds more than one duration/horizon value, even if one range and one explicit duration could be reconciled. The downstream capital-plan analysis then treats timing as unavailable. This is fail-closed, but optional timing ambiguity can remove the whole capital-plan timing surface while the plan amount remains otherwise valid.

**Status:** PROVEN. **Owner:** capital-plan/source binding. **Doctrine impact:** optional support ambiguity should constrain the affected section, not erase unrelated accepted facts.

### F-039 - MEDIUM - Premium renderer and validated model use separate fact/calculation shapes

The validated model stores section `facts` and calculation receipts with `status`, `sourceBound`, and provenance. The Premium renderer expects `section.status === 'eligible'` and filters `section.calculations` by `status === 'calculated'`, `sourceBound === true`, and finite result. The model finalizer supplies those shapes, but the base V2 customer-surface model uses different section/status/factAvailability shapes. Premium and base surfaces therefore have separate binding contracts and can drift in which facts are considered renderable.

**Status:** PROVEN. **Owner:** Premium/customer surface. **Doctrine impact:** surface-specific schemas need one explicit mapping boundary.

### F-040 - LOW - Capital-plan analysis deliberately exposes objective comparisons without adequacy policy

Capital-plan calculations produce reserve-minus-requirement and reserve-coverage ratios, but classification remains `not_classified` with no threshold authority. This is correctly fail-closed, but any downstream surface that labels the position as adequate, inadequate, high risk, or low risk would be creating a new authority outside the deterministic layer.

**Status:** PROVEN. **Owner:** capital-plan policy. **Doctrine impact:** objective arithmetic and investment classification must remain separate.

## Deterministic authority map

`validated parser artifacts + extracted text` -> `buildCanonicalSourceTruthPackage` -> core/support accepted facts and evidence -> role-specific input contracts -> deterministic reconciliation/debt/DSCR/valuation/capital analyses -> receipt-only Institutional Financial Intelligence -> V2/Premium customer-surface binding -> deterministic QA/PDF certification. Fallback compatibility path: `source-report-coverage-qa.js` reconstructs states when canonical receipts are absent and must remain visibly non-canonical.

## Stage conclusion

The deterministic layer is mostly disciplined: it is receipt-only, avoids unsupported recommendations, preserves current/proposed debt roles, and fails closed on missing evidence. The launch risk is at the handoff: core facts have weaker excerpt lineage than support facts, fallback coverage can select different rent totals, and the V2 surface can re-derive numbers outside the canonical receipt path. Parser implementation and full report dispatch remain scheduled for later stages.
