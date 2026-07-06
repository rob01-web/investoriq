# InvestorIQ Semantic Authority Evidence Ledger
## AUTH-001 through AUTH-105
### July 6, 2026 — Manual Production File-by-File Audit

---

# Purpose

This file preserves the detailed manual evidence audit performed across the live Acquisition Memo V2 production path before any new Codex execution prompts are written.

Controlling workflow:

> **We inspect the real production files ourselves, one by one, build the authority map from evidence, and only then write the Codex execution prompts.**

This ledger exists so a fresh chat can continue without losing the findings from the long-form audit.

Do **not** treat all entries as equal. Status language is intentional:

- **CONFIRMED** — directly proven by production code.
- **CONFIRMED RUNTIME** — execution path proven by orchestrator/finalization flow.
- **VERY HIGH LIVE CAUSATION** — code path strongly matches RETEST 20 live behavior.
- **OPEN / WATCH** — behavior exists but live causation is not yet proven.
- **NOT OWNER** — file inspected and ruled out as primary owner for that defect.

Allowed classifications:

- `DELETE`
- `STRIP_AUTHORITY`
- `CONSOLIDATE_DUPLICATE_AUTHORITY`
- `ORPHANED_AUTHORITY`
- `REPLACE`
- `KEEP`

---

# Live Context

RETEST 20 published end to end:

```text
queued
-> extracting
-> underwriting
-> scoring
-> rendering
-> pdf_generating
-> publishing
-> published
```

CVF-24 recurring final Boss-compliance / route-500 family was broken through.

However, RETEST 20 exposed CVF-25:

```text
SEMANTIC_AUTHORITY_POLLUTION_AND_FALSE_COLLAPSE
```

Observed launch-critical defects:

```text
- Unit Mix source-backed truth existed but section collapsed.
- Purchase Assumptions parsed but customer surface said none uploaded.
- Purchase Assumptions source mislabeled as Existing Debt.
- Current Debt facts appeared in Document Treatment but dedicated Debt section collapsed.
- Appraisal Stabilized Cap Rate 7.40% displayed as Interest Rate 7.40%.
- Break-Even Occupancy output 37.0%, incorrectly equal to Expense Ratio.
- QA oracle also expected wrong 37.0%.
- Rent-upside capitalization table label implied whole-property value semantics.
- Asset Class displayed 64-Unit.
```

---

# Files Manually Inspected for AUTH-001 through AUTH-105

1. `api/_lib/acquisition-memo-v2-customer-surface-model.js`
2. `api/_lib/acquisition-memo-v2-role-reconciler.js`
3. `api/_lib/canonical-source-package.js`
4. `api/_lib/acquisition-memo-projection.js`
5. `api/_lib/acquisition-memo-boss-contract.js`
6. `api/_lib/acquisition-memo-v2-boss-repair.js`
7. `api/_lib/acquisition-memo-v2-orchestrator.js`
8. `api/_lib/acquisition-memo-v2-final-decision.js`

The renderer file `api/_lib/acquisition-memo-v2-document.js` was uploaded at the end of the session but is **not** included in AUTH-001 through AUTH-105. Continue that file separately if needed.

---

# Root-Family Summary

## Root Family 1 — Duplicate Semantic Role Authority

Active semantic decision makers exist across:

```text
role-reconciler
canonical-source-package
Boss Contract
CustomerSurfaceModel
raw-payload repair/heal side doors
```

Key entries:

```text
AUTH-005, AUTH-006, AUTH-015, AUTH-016, AUTH-017,
AUTH-018, AUTH-021, AUTH-023, AUTH-030, AUTH-039,
AUTH-040, AUTH-043, AUTH-044, AUTH-057, AUTH-071
```

Target doctrine:

```text
one source identity
-> one accepted role
-> one canonical fact schema
-> immutable provenance
-> downstream consumers do not reclassify
```

## Root Family 2 — Duplicate Fact Extraction / Writer Authority

Same facts are independently extracted or supplemented in multiple layers:

```text
role-reconciler
canonical-source-package
Boss Contract
raw payload heal guards
```

Key entries:

```text
AUTH-001, AUTH-002, AUTH-019, AUTH-020, AUTH-022,
AUTH-028, AUTH-041, AUTH-042, AUTH-045
```

Target doctrine:

```text
normalize aliases once
write one canonical fact object
downstream reads canonical facts only
```

## Root Family 3 — No Immutable Accepted-Truth Provenance Lock

Key entries:

```text
AUTH-006, AUTH-017, AUTH-039, AUTH-046, AUTH-047,
AUTH-057, AUTH-059, AUTH-069, AUTH-075, AUTH-079,
AUTH-084, AUTH-086, AUTH-097, AUTH-105
```

Target invariant:

```text
raw accepted evidence
-> parsed artifact
-> canonical role
-> reconciled accepted truth
-> projection
-> CustomerSurfaceModel
-> Boss Contract
-> final delivery
```

## Root Family 4 — False-Collapse Compliance Laundering

Fully proven in code and runtime.

Key entries:

```text
AUTH-049, AUTH-050, AUTH-051, AUTH-052, AUTH-055,
AUTH-056, AUTH-059, AUTH-060, AUTH-061, AUTH-062,
AUTH-063, AUTH-064, AUTH-065, AUTH-066, AUTH-067,
AUTH-069, AUTH-078, AUTH-079, AUTH-080, AUTH-081,
AUTH-082, AUTH-083, AUTH-084, AUTH-085, AUTH-086,
AUTH-088, AUTH-089, AUTH-090, AUTH-096, AUTH-098,
AUTH-105
```

Confirmed forbidden runtime pattern:

```text
sourceBacked true
-> validation detects missing rendered truth
-> repair classifies as optional/support repairable
-> repair sets section.status = collapsed
-> repair clears available facts
-> repair clears missing facts
-> repair sets sourceBacked = false
-> model and Boss are both downgraded
-> rerender
-> revalidate repaired state
-> repaired state becomes final truth
-> final decision can deliver
```

## Root Family 5 — Final Gate Does Not Require Full Final Compliance

Key entries:

```text
AUTH-092, AUTH-093, AUTH-094, AUTH-095,
AUTH-099, AUTH-100, AUTH-103, AUTH-104
```

Critical finding:

```text
complianceOk is computed
but not required by publishable
```

---

# Detailed Authority Ledger

## AUTH-001 — Purchase Loan Alias Contract Mismatch
- **Status:** CONFIRMED cross-file mismatch; exact live propagation path still needed.
- **Files:** role reconciler, CustomerSurfaceModel.
- **Evidence:** reconciler recognizes/writes `derived_acquisition_loan_amount`, `stated_acquisition_loan_amount`, `loan_amount`; CustomerSurfaceModel purchase section requires `proposed_loan_amount`.
- **Effect:** accepted acquisition financing truth can exist while section collapses or reports unavailable.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY / CONTRACT_REPAIR`
- **CVF:** 25B

## AUTH-002 — Top-Level Facts vs `extractedFacts` Contract Mismatch
- **Status:** CONFIRMED.
- **Evidence:** role reconciler authority rows write many facts top-level; CustomerSurfaceModel normalization reads `extractedFacts` / `extracted_facts`.
- **Effect:** facts can survive in one surface but disappear in dedicated sections.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25B / 25D

## AUTH-003 — Role Vocabulary Contract Split
- **Status:** CONFIRMED.
- **Mismatches:** `appraisal_valuation_context` vs `appraisal_context`; `environmental_due_diligence_context` vs `environmental_context`; `renovation_capex_context` vs `structured_renovation_capex_plan`.
- **Effect:** valid context can disappear or collapse.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-004 — Current Debt Fixed Priority Can Beat Purchase Assumptions
- **Status:** STRONG CANDIDATE.
- **Evidence:** same-identity priority favors `current_debt_context` over `purchase_assumptions`.
- **Effect:** possible Purchase Assumptions -> Existing Debt mislabel.
- **Classification:** `STRIP_AUTHORITY / CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25C

## AUTH-005 — Semantic Metadata Reused as Evidence
- **Status:** CONFIRMED.
- **File:** role reconciler.
- **Reads into evidence:** `semantic_doc_role`, `semantic_doc_display_label`, `semantic_doc_role_reason`, `debt_basis`.
- **Effect:** prior classification can help prove itself.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-006 — Accepted Truth Is Not Provenance Locked
- **Status:** CONFIRMED.
- **Evidence:** `acceptedTruth` is one input among many; reconciler emits new accepted semantic fields.
- **Effect:** accepted truth is recomputed rather than preserved.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25I

## AUTH-007 — Parser Debt Basis Survives No-Evidence Fallback
- **Status:** CONFIRMED.
- **Evidence:** no best candidate -> `other_support_context`, but `acceptedDebtBasis = parserDebtBasis || null`.
- **Effect:** rejected parser semantics leak downstream.
- **Classification:** `ORPHANED_AUTHORITY`

## AUTH-008 — Appraisal Role Can Retain Generic `interest_rate`
- **Status:** STRONG CANDIDATE.
- **Evidence:** appraisal canonicalization spreads prior row fields.
- **Effect:** cap rate can survive under generic interest-rate alias.
- **Classification:** `STRIP_AUTHORITY / PROVENANCE_LOCK_REQUIRED`
- **CVF:** 25E

## AUTH-009 — CustomerSurfaceModel Merges Multiple Truth Stages
- **Status:** CONFIRMED.
- **Reads:** canonical package, projection buckets, Boss sourceTruth.
- **Effect:** contradictory semantic versions coexist in final model construction.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-010 — First-Writer-Wins Dedupe Can Preserve Stale Semantics
- **Status:** CONFIRMED.
- **Effect:** earlier canonical version can suppress later reconciled/Boss copy.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-011 — CustomerSurfaceModel Infers Accepted Truth from Display Labels
- **Status:** CONFIRMED.
- **Effect:** wrong labels can self-reinforce as accepted truth.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-012 — Local Completeness Can Rewrite `sourceBacked` False
- **Status:** CONFIRMED.
- **Evidence:** purchase/current debt sections recompute source-backed state from exact display-field completeness.
- **Effect:** accepted provenance can be downgraded because one alias/field is missing.
- **Classification:** `REPLACE_SOURCE_BACKED_SEMANTICS`
- **CVF:** 25J

## AUTH-013 — Unit Mix Source-Backed Test Is Internally Weak/Inconsistent
- **Status:** CONFIRMED.
- **Evidence:** total units alone can satisfy source-backed condition despite required `unit_mix` semantics.
- **Effect:** inconsistent model obligations.
- **Classification:** `CONTRACT_REPAIR`
- **CVF:** 25A

## AUTH-014 — First Role Document Wins in Customer Model
- **Status:** CONFIRMED.
- **Evidence:** first role mapping wins without provenance rank.
- **Effect:** stale/earlier same-role doc can own customer surface.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-015 — Reconciler + Canonical Package Are Two Active Role Authorities
- **Status:** CONFIRMED.
- **Evidence:** canonical package calls reconciler, then independently reclassifies.
- **Effect:** reconciled role can be overridden before immutable canonical output.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25C / 25I

## AUTH-016 — Canonical Current-Debt Branch Can Override Purchase Truth
- **Status:** CONFIRMED mechanism; VERY HIGH live-causation candidate.
- **Evidence:** current-debt branch runs before purchase branch and can fire on accepted/stale debt truth.
- **Effect:** purchase assumptions become existing debt.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25C

## AUTH-017 — “Accepted Truth” Is First Artifact Metadata
- **Status:** CONFIRMED.
- **Evidence:** first non-empty artifact semantic role/basis/label wins.
- **Effect:** parser metadata promoted to accepted truth without rank/provenance.
- **Classification:** `STRIP_AUTHORITY`
- **CVF:** 25I

## AUTH-018 — Semantic Label Feedback Loop Across Three Files
- **Status:** CONFIRMED CATEGORY.
- **Files:** role reconciler, canonical source package, CustomerSurfaceModel.
- **Pattern:** semantic label -> evidence/truth -> semantic classification.
- **Classification:** `STRIP_AUTHORITY ACROSS PIPELINE`

## AUTH-019 — Canonical Package Re-Extracts Facts Instead of Preserving Structured Facts
- **Status:** CONFIRMED.
- **Effect:** structured accepted facts can disappear in text regex re-extraction.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-020 — Current Debt Structured Facts Can Be Lost in Text Re-Extraction
- **Status:** CONFIRMED architecture; VERY HIGH live candidate.
- **Effect:** one surface sees debt facts while canonical extractedFacts loses them.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25D

## AUTH-021 — Canonical Role Taxonomy Split Is Created by Active Writers
- **Status:** CONFIRMED.
- **Evidence:** role reconciler vocabulary A; canonical package vocabulary B.
- **Effect:** no single canonical role vocabulary.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-022 — Canonical Appraisal Extraction Omits Stabilized Cap Rate / NOI
- **Status:** CONFIRMED missing field contract.
- **Effect:** correct appraisal field absent while generic rate alias may survive elsewhere.
- **Classification:** `CONTRACT_REPAIR / PROVENANCE_LOCK`
- **CVF:** 25E

## AUTH-023 — Reconciled Purchase Role Is Not Sovereign
- **Status:** CONFIRMED.
- **Evidence:** stale/accepted current-debt truth can win before purchase branch despite reconciled purchase role.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-024 — Artifact-Text Helper Lacks Internal Identity Filtering
- **Status:** OPEN / WATCH.
- **Nuance:** main caller appears file-scoped, so no live defect claimed.
- **Classification:** `WATCH`

## AUTH-025 — Core T12/Rent Roll Filename-First Authority
- **Status:** CONFIRMED behavior; live defect link OPEN.
- **Classification:** `KEEP UNDER REVIEW`

## AUTH-026 — `other_support_context` vs `other_support`
- **Status:** CONFIRMED taxonomy split.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **Priority:** P1/P2 unless live impact proven.

## AUTH-027 — Projection Blindly Trusts `canonicalRole`
- **Status:** CONFIRMED propagation mechanism.
- **Effect:** upstream canonical misclassification becomes projection truth.
- **Classification:** `KEEP` with upstream fix.
- **CVF:** 25B / 25C

## AUTH-028 — Projection Checklist Requires Exact `proposed_loan_amount`
- **Status:** CONFIRMED.
- **Effect:** financing terms can exist under other aliases but checklist reports incomplete.
- **Classification:** `CONTRACT_REPAIR`
- **CVF:** 25B

## AUTH-029 — Property Tax Support Hardcoded False
- **Status:** CONFIRMED direct defect.
- **Effect:** valid property tax support can never be acknowledged by checklist.
- **Classification:** `CONTRACT_REPAIR`
- **Priority:** P1 unless visible launch impact.

## AUTH-030 — Projection Taxonomy Aligns With Canonical Package, Not Reconciler
- **Status:** CONFIRMED.
- **Conclusion:** canonical package reclassification is effective downstream taxonomy; reconciler is not sovereign.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-031 — Projection First Match Per Role Wins
- **Status:** CONFIRMED.
- **Evidence:** `Array.find(...)`.
- **Effect:** multiple same-role docs not merged/ranked.
- **Classification:** `KEEP / REVIEW`
- **Priority:** P1 unless live-linked.

## AUTH-032 — Reconciler-Valid Roles Can Be Downgraded to Other Support
- **Status:** CONFIRMED behavior.
- **Effect:** vocabulary A roles not recognized by projection vocabulary B.
- **Classification:** `CONSOLIDATE_ROLE_TAXONOMY`

## AUTH-033 — Projection Creates Duplicate Access Paths to Same Document
- **Status:** CONFIRMED.
- **Examples:** allSupportDocs, role bucket, top-level context aliases.
- **Effect:** downstream recollection/dedupe required.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-034 — Projection Cloning Is Shallow
- **Status:** CONFIRMED.
- **Effect:** nested truth objects can share references across duplicate surfaces.
- **Classification:** `KEEP / HARDEN`
- **Priority:** P1

## AUTH-035 — False Diagnostic: `competingDecisionMakersEliminated: true`
- **Status:** CONFIRMED.
- **Effect:** tests/diagnostics can claim authority cleanup while multiple decision makers remain.
- **Classification:** `REMOVE FALSE CLAIM / DERIVE REAL INVARIANT`

## AUTH-036 — Projection Is Not Primary Owner of Unit Mix Loss
- **Status:** NOT OWNER / HIGH confidence.
- **Effect:** narrows CVF-25A elsewhere.
- **Classification:** `NOT_OWNER`

## AUTH-037 — Projection Does Not Calculate Break-Even Occupancy
- **Status:** NOT OWNER.
- **Classification:** `NOT_OWNER`
- **CVF:** 25F

## AUTH-038 — Boss Re-Merges Canonical + Projection Support Docs
- **Status:** CONFIRMED.
- **Effect:** multiple truth stages re-enter final contract.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-039 — Same File Can Survive Twice Under Conflicting Roles
- **Status:** CONFIRMED.
- **Evidence:** Boss dedupe key includes role.
- **Effect:** same physical source can exist as purchase and debt simultaneously.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25B / 25C / 25I

## AUTH-040 — Boss Normalizer Falls Back to Raw `semantic_doc_role`
- **Status:** CONFIRMED.
- **Effect:** raw parser role leaks into final Boss truth.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-041 — Boss Re-Extracts Purchase Facts From Evidence Text
- **Status:** CONFIRMED.
- **Effect:** Boss becomes independent purchase-fact writer.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-042 — Boss Re-Extracts Current Debt Facts From Evidence Text
- **Status:** CONFIRMED.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-043 — Boss Can Promote Purchase Assumptions to Current Debt
- **Status:** CONFIRMED code path; EXTREMELY HIGH live-causation candidate.
- **Evidence:** purchase assumptions doc explicitly passed into `promoteCurrentDebtSupportDoc(...)`.
- **Effect:** Purchase Assumptions -> Existing Debt.
- **Classification:** `STRIP_AUTHORITY / REMOVE_PROMOTION_PATH`
- **CVF:** 25C

## AUTH-044 — Current Debt Evidence Detector Is Too Broad
- **Status:** CONFIRMED behavior.
- **Effect:** generic financing language can support current-debt promotion.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-045 — Boss Can Create Purchase Truth When Projection Facts Are Empty
- **Status:** CONFIRMED.
- **Effect:** Boss acts as fact extractor/writer, not only enforcer.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-046 — Boss `sourceTruth.supportDocs` Is Synthesized, Not Pure Source Truth
- **Status:** CONFIRMED.
- **Contains:** merged canonical docs, projection docs, supplemented facts, promoted docs.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-047 — Boss `sourceBacked` Means Availability, Not Provenance
- **Status:** CONFIRMED.
- **Effect:** accepted provenance, partial facts, supplemented facts, and promoted facts are conflated.
- **Classification:** `REPLACE_SOURCE_BACKED_SEMANTICS`
- **CVF:** 25J

## AUTH-048 — Boss Unit Mix Availability vs Required Facts Is Inconsistent
- **Status:** CONFIRMED.
- **Evidence:** availability can be `unit_mix OR units`; required list demands both plus total_units and occupancy.
- **Classification:** `CONTRACT_REPAIR`
- **CVF:** 25A

## AUTH-049 — Source-Backed Unit Mix Violation Is Collapseable
- **Status:** CONFIRMED P0.
- **Effect:** source-backed core Unit Mix can be erased to achieve compliance.
- **Classification:** `REPLACE_ROUTING_SEMANTICS`
- **CVF:** 25A / 25J

## AUTH-050 — Source-Backed Current Debt Violation Is Collapseable
- **Status:** CONFIRMED P0.
- **Effect:** dedicated debt section can collapse despite accepted facts.
- **Classification:** `REPLACE_ROUTING_SEMANTICS`
- **CVF:** 25D / 25J

## AUTH-051 — Source-Backed Purchase/Proposed Financing Violations Are Collapseable
- **Status:** CONFIRMED P0.
- **Effect:** accepted purchase assumptions can disappear through compliance repair.
- **Classification:** `REPLACE_ROUTING_SEMANTICS`
- **CVF:** 25B / 25J

## AUTH-052 — Collapse Text Can Make False Customer Claim
- **Status:** CONFIRMED.
- **Effect:** internal binding/render failure becomes “uploaded support did not provide detail.”
- **Classification:** `REPLACE_COLLAPSE_COPY_LOGIC`

## AUTH-053 — Boss HTML Repair Calculates Customer Values
- **Status:** CONFIRMED.
- **Evidence:** Boss computes implied/per-unit values and mutates HTML.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-054 — Boss Globally Scrubs Forbidden Words From HTML
- **Status:** CONFIRMED.
- **Effect:** blind HTML mutation.
- **Classification:** `STRIP_AUTHORITY / REPLACE_WITH_MODEL_REPAIR`

## AUTH-055 — Current Debt `sourceBacked` Can Be True With Incomplete Facts
- **Status:** CONFIRMED.
- **Effect:** source-backed provenance conflated with complete render schema.
- **Classification:** `SEPARATE_PROVENANCE_FROM_COMPLETENESS`

## AUTH-056 — Purchase `sourceBacked` Can Be True With Partial Facts
- **Status:** CONFIRMED.
- **Effect:** partial facts -> sourceBacked true -> missing required fields -> collapse path.
- **Classification:** `SEPARATE_PROVENANCE_FROM_COMPLETENESS`

## AUTH-057 — Boss Normalization Drops Accepted Provenance Fields
- **Status:** CONFIRMED.
- **Dropped:** accepted semantic role/basis/display/provenance fields.
- **Effect:** provenance metadata disappears before Boss reconstructs role/facts.
- **Classification:** `PROVENANCE_CONTRACT_REPAIR`
- **CVF:** 25I

## AUTH-058 — Boss Core Validity Check Is Too Shallow
- **Status:** CONFIRMED.
- **Evidence:** role/label/sourceKind can make core doc “valid.”
- **Classification:** `HARDEN_CORE_GATE`
- **Priority:** P1

## AUTH-059 — Boss Repair Explicitly Flips `sourceBacked` False
- **Status:** CONFIRMED DIRECT CODE, P0.
- **Mutation:** status collapsed; available []; missing []; sourceBacked false.
- **Classification:** `REPLACE_CORE_REPAIR_SEMANTICS`
- **CVF:** 25J

## AUTH-060 — Unit Mix False Collapse Is Explicitly Repairable
- **Status:** CONFIRMED mechanism; VERY HIGH live causation.
- **Effect:** Unit Mix violation -> collapse -> provenance erasure.
- **Classification:** `REPLACE_REPAIR_POLICY`
- **CVF:** 25A / 25J

## AUTH-061 — Current Debt False Collapse Is Explicitly Repairable
- **Status:** CONFIRMED P0.
- **Mapped codes:** source-backed debt missing, false missing, accepted debt lost, HTML false missing.
- **Classification:** `REPLACE_REPAIR_POLICY`
- **CVF:** 25D / 25J

## AUTH-062 — Purchase Assumptions Loss Is Repaired by Collapsing Acquisition Context
- **Status:** CONFIRMED P0.
- **Effect:** accepted purchase truth loss triggers further suppression.
- **Classification:** `REPLACE_REPAIR_POLICY`
- **CVF:** 25B / 25J

## AUTH-063 — HTML Missing-Fact Violations Mutate Model Provenance
- **Status:** CONFIRMED P0.
- **Effect:** renderer/output failure becomes source-truth downgrade.
- **Classification:** `REPLACE_REPAIR_ARCHITECTURE`

## AUTH-064 — Unit Mix HTML Failures Erase Model Provenance
- **Status:** CONFIRMED P0.
- **Effect:** missing label/count/rents/spread -> unitMix collapsed and sourceBacked false.
- **Classification:** `REPLACE_REPAIR_ARCHITECTURE`
- **CVF:** 25A / 25J

## AUTH-065 — Accepted-Truth Loss Misclassified as Optional Support Repair
- **Status:** CONFIRMED P0.
- **Effect:** `ACCEPTED_*_LOST` treated as `repairableOptionalSupport`.
- **Classification:** `REPLACE_ROUTING_TAXONOMY`

## AUTH-066 — `shouldRetry` Enables Compliance Laundering
- **Status:** CONFIRMED P0.
- **Chain:** no core fatal + repairable section -> retry -> provenance downgrade -> rerender.
- **Classification:** `REPLACE_RETRY_POLICY`

## AUTH-067 — False-Missing Detection Exists but Recovery Policy Is Collapse
- **Status:** CONFIRMED P0.
- **Effect:** system detects false missing but does not restore truth.
- **Classification:** `REPLACE_REPAIR_POLICY`

## AUTH-068 — Generic Section Failure Can Become Core Fatal
- **Status:** CONFIRMED behavior; exact live path OPEN.
- **Classification:** `REPLACE_ROUTING_TAXONOMY`

## AUTH-069 — Repair Destroys Diagnostic State
- **Status:** CONFIRMED P0.
- **Effect:** available/missing/sourceBacked history erased.
- **Classification:** `REPLACE_REPAIR_STATE_MODEL`

## AUTH-070 — Boss Repair Mixes V2 Repair With Legacy HTML Quarantine
- **Status:** CONFIRMED.
- **Effect:** separate responsibilities mixed.
- **Classification:** `CONSOLIDATE / POSSIBLE_EXTRACTION`
- **Priority:** P1 after truth fixes.

## AUTH-071 — Final Heal Guard Re-Reads Raw Payload Semantics
- **Status:** CONFIRMED.
- **Reads:** raw `debt_basis`, `semantic_doc_role`, financing aliases.
- **Effect:** side-door semantic authority after canonical/Boss/model chain.
- **Classification:** `STRIP_AUTHORITY`
- **Priority:** P0/P1 depending reachability.

## AUTH-072 — Raw Payload Gate Can Strip Debt Marked Section
- **Status:** CONFIRMED behavior; live V2 relevance OPEN.
- **Classification:** `WATCH / TRACE`

## AUTH-073 — Specific `-48.0%` Stale Variance HTML Guard
- **Status:** CONFIRMED.
- **Concern:** report/history-specific hardcoded stale-value guard.
- **Classification:** `POSSIBLE_REPORT_SPECIFIC_PATCH / INVESTIGATE`
- **Priority:** P1

## AUTH-074 — Duplicate Global HTML Scrub Authority
- **Status:** CONFIRMED.
- **Files:** Boss Contract and Boss Repair.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-075 — Runtime Confirms Customer Model Receives Three Truth Stages
- **Status:** CONFIRMED RUNTIME.
- **Inputs:** canonical package + projection + Boss Contract.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-076 — Dual Customer Model Entry Path
- **Status:** CONFIRMED.
- **Paths:** caller-supplied prebuilt model OR locally built model.
- **Classification:** `TRACE / POSSIBLE_DUPLICATE_AUTHORITY`

## AUTH-077 — Compliance Assesses Already-Mutated HTML
- **Status:** CONFIRMED RUNTIME.
- **Chain:** render -> Boss enforcement mutation -> repair mutation -> compliance.
- **Classification:** `REVIEW_FINAL_AUTHORITY`

## AUTH-078 — Pre-Render Provenance Erasure Path
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** model validation issue can trigger repair before first render.
- **Classification:** `REPLACE_REPAIR_EXECUTION_POLICY`
- **CVF:** 25A / 25B / 25D / 25J

## AUTH-079 — Same Repair Plan Downgrades Customer Model and Boss Contract
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** validator and validated truth contract can be changed together.
- **Classification:** `REPLACE_REPAIR_EXECUTION_POLICY`

## AUTH-080 — Mutated Model Is Revalidated, Not Original Truth
- **Status:** CONFIRMED P0.
- **Effect:** original source-backed obligation disappears before revalidation.
- **Classification:** `REPLACE_REVALIDATION_POLICY`

## AUTH-081 — Second Post-Render Truth-Downgrade Pass Exists
- **Status:** CONFIRMED P0.
- **Effect:** pre-render and post-render repair waves can both mutate truth.
- **Classification:** `REPLACE_RETRY_POLICY`

## AUTH-082 — HTML Failure Can Mutate Boss Truth
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** missing HTML fact -> repaired Boss section sourceBacked false.
- **Classification:** `REPLACE_REPAIR_ARCHITECTURE`

## AUTH-083 — Retry Allowed With Invalid Repaired Model
- **Status:** CONFIRMED P0.
- **Evidence:** retry allowed when validation OK OR repairableSectionKeys non-empty.
- **Classification:** `REPLACE_RETRY_GATE`

## AUTH-084 — Repaired Truth Becomes Final Truth
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** successful retry returns repaired model/Boss/HTML without provenance comparison.
- **Classification:** `ADD_PROVENANCE_DELTA_GUARD`
- **CVF:** 25J

## AUTH-085 — Final Decision Consumes Repaired State
- **Status:** CONFIRMED.
- **Effect:** final gate sees repaired finalization and repaired Boss coreGate.
- **Classification:** `PROTECT_FINAL_DECISION_WITH_ORIGINAL_PROVENANCE`

## AUTH-086 — No Pre/Post Provenance Delta Validation
- **Status:** CONFIRMED ABSENCE, P0.
- **Missing invariant:** forbid unexplained `sourceBacked true -> false`.
- **Classification:** `ADD_CONSTITUTIONAL_GUARD`

## AUTH-087 — Boss Contract Validation Is Not Primary Initial Gate
- **Status:** CONFIRMED FLOW.
- **Effect:** invalid Boss contract may be diagnosed but not immediately gate execution.
- **Classification:** `REVIEW`
- **Priority:** P1

## AUTH-088 — Mutated Boss Used as Render Authority
- **Status:** CONFIRMED P0.
- **Effect:** Boss is directly repaired, not rebuilt from immutable source truth.
- **Classification:** `REBUILD_OR_PRESERVE_IMMUTABLE_BOSS`

## AUTH-089 — Repair Mutates Already-Mutated State Cumulatively
- **Status:** CONFIRMED P0.
- **Effect:** pass 2 starts from pass-1 state, not immutable baseline.
- **Classification:** `REPLACE_RETRY_STATE_MANAGEMENT`

## AUTH-090 — Repaired Model + Boss + HTML Can Self-Validate
- **Status:** CONFIRMED architectural effect, P0.
- **Effect:** synchronized erasure creates internal consistency.
- **Classification:** `ADD_IMMUTABLE_PROVENANCE_BASELINE`

## AUTH-091 — Diagnostics Lack Provenance Delta
- **Status:** CONFIRMED.
- **Effect:** diagnostics record repair happened but not what truth was erased.
- **Classification:** `ADD_PROVENANCE_AUDIT_TRAIL`
- **Priority:** P0/P1

## AUTH-092 — `publishable` Ignores `complianceOk`
- **Status:** CONFIRMED P0.
- **Evidence:** `complianceOk` computed but absent from publishable formula.
- **Classification:** `REPLACE_PUBLISHABLE_LOGIC`

## AUTH-093 — Final Delivery Does Not Require `bossOk`
- **Status:** CONFIRMED P0.
- **Effect:** Boss compliance may fail while final delivery still passes loose gate.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-094 — Final Delivery Does Not Require `htmlOk`
- **Status:** CONFIRMED P0.
- **Effect:** customer-surface HTML validation failure may not block.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-095 — Unsafe HTML Blocker Covers Only Narrow Failure Set
- **Status:** CONFIRMED P0.
- **Effect:** ordinary critical truth-display failures may not count unsafe.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-096 — Final Gate Can Rubber-Stamp Repaired/Truth-Erased State
- **Status:** CONFIRMED architectural effect, P0.
- **Classification:** `ADD_IMMUTABLE_PRE_POST_PROVENANCE_GATE`
- **CVF:** 25J

## AUTH-097 — Final Gate Has No Immutable Baseline Input
- **Status:** CONFIRMED P0.
- **Missing:** initial model, original Boss, original source truth, pre-repair provenance.
- **Classification:** `ADD_PROVENANCE_BASELINE_INPUT`

## AUTH-098 — Repair Success Defined Without Truth Preservation
- **Status:** CONFIRMED P0.
- **Evidence:** success = publishable after attempted repair.
- **Classification:** `REPLACE_REPAIR_SUCCESS_SEMANTICS`

## AUTH-099 — Repairable Optional Signal Does Not Block Delivery
- **Status:** CONFIRMED.
- **Effect:** repairable issues can remain while delivery passes.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-100 — `fatalCategory` Can Be Null While Compliance Is False
- **Status:** CONFIRMED.
- **Cause:** fatalCategory derives from loose publishable.
- **Classification:** `REPLACE_FINAL_DECISION_ORDER`

## AUTH-101 — `finalBossCompliance.ok` Is Misnamed
- **Status:** CONFIRMED.
- **Evidence:** field reflects combined `final.compliance.ok`, not Boss-only status.
- **Classification:** `DIAGNOSTIC_REPAIR`
- **Priority:** P1

## AUTH-102 — Upstream Readiness Signals Recorded but Not Gating
- **Status:** CONFIRMED behavior.
- **Classification:** `WATCH / DESIGN REVIEW`
- **No patch yet.**

## AUTH-103 — Computed `complianceOk` Is Dead Decision Data
- **Status:** CONFIRMED P0.
- **Effect:** intended final-compliance concept exists but is unused.
- **Classification:** `ORPHANED_AUTHORITY / LOGIC_REPAIR`

## AUTH-104 — No Final Blocking Category for Truth Regression
- **Status:** CONFIRMED ABSENCE, P0.
- **Needed category:** unresolved source-truth regression / provenance loss.
- **Classification:** `ADD_FINAL_DECISION_CLASSIFICATION`

## AUTH-105 — No Distinction Between Legitimate Collapse and False Collapse
- **Status:** CONFIRMED P0.
- **Effect:** optional source absent and accepted source lost can look identical by final decision time.
- **Classification:** `ADD_PROVENANCE_DELTA_GATE`
- **CVF:** 25J

---

# RETEST 20 Defect Mapping

## CVF-25A — Unit Mix False Collapse

High-confidence chain:

```text
structured Rent Roll unit_mix exists
-> model/HTML mismatch
-> UNIT_MIX_* violation
-> repairable section = unitMix
-> model + Boss set collapsed
-> sourceBacked false
-> rerender
-> compliant publish
```

Relevant entries:

```text
AUTH-049, AUTH-059, AUTH-060, AUTH-064,
AUTH-078, AUTH-079, AUTH-080, AUTH-081,
AUTH-082, AUTH-084, AUTH-090
```

## CVF-25B — Purchase Assumptions False Missing

Likely combined chain:

```text
role conflict and/or field schema loss
-> accepted purchase truth lost / HTML missing
-> acquisitionRequestContext repairable
-> model + Boss collapse
-> rerender
-> publish
```

Relevant entries:

```text
AUTH-001, AUTH-016, AUTH-017, AUTH-023, AUTH-028,
AUTH-043, AUTH-051, AUTH-056, AUTH-062, AUTH-063,
AUTH-065, AUTH-078, AUTH-079, AUTH-084
```

## CVF-25C — Purchase Assumptions Mislabeled Existing Debt

Strong candidate chain:

```text
stale debt semantics
-> canonical current-debt branch precedence
and/or Boss purchase-doc promotion
-> current debt bucket
-> customer treatment label
```

Relevant entries:

```text
AUTH-004, AUTH-016, AUTH-023, AUTH-039,
AUTH-043, AUTH-044
```

## CVF-25D — Current Debt Facts Visible but Dedicated Section Collapsed

Extremely strong chain:

```text
facts survive one surface
-> dedicated HTML fails completeness
-> CURRENT_DEBT_* violation
-> currentDebtContext repairable
-> model + Boss collapse
-> rerender
-> Document Treatment retains separate copy
```

Relevant entries:

```text
AUTH-002, AUTH-020, AUTH-033, AUTH-050, AUTH-055,
AUTH-061, AUTH-063, AUTH-079, AUTH-082, AUTH-084
```

## CVF-25E — Appraisal Cap Rate -> Interest Rate

Relevant entries:

```text
AUTH-008, AUTH-022
```

Confirmed missing correct appraisal fact contract plus strong candidate stale generic alias survival.

## CVF-25F — Break-Even Occupancy

No owner confirmed in AUTH-001 through AUTH-105.

Known:

```text
Projection is NOT owner.
CustomerSurfaceModel reads coreMetrics.breakEvenOccupancy rather than calculating.
```

Continue upstream metric-owner trace separately.

## CVF-25G — Rent-Upside Value Semantics

Not resolved in AUTH-001 through AUTH-105.

Continue renderer/document audit separately.

## CVF-25H — Asset Class / Identity Alias

Not resolved in AUTH-001 through AUTH-105.

Known:

```text
CustomerSurfaceModel reads propertyProfile.assetClass / asset_class.
Projection not owner.
```

Continue upstream profile/renderer trace separately.

---

# Codex Usage Doctrine for the Next Fresh Chat

The user explicitly wants Codex usage preserved.

Do **not** start with another broad audit.

Do **not** ask Codex to rediscover the architecture.

Use ChatGPT’s evidence ledger to write a sequence of **small root-family execution prompts**.

Preferred sequencing:

## Micro Prompt Family 1 — Immutable source provenance / one accepted role

Target:

```text
AUTH-005, 006, 015, 016, 017, 018, 021, 023,
039, 040, 043, 044, 057, 071
```

Goal:

```text
one identity
one accepted role
no display-label truth inference
no Boss role promotion
no same-file conflicting role duplicates
```

## Micro Prompt Family 2 — One canonical fact schema

Target:

```text
AUTH-001, 002, 019, 020, 022, 028, 041, 042, 045
```

Goal:

```text
normalize aliases once
downstream reads canonical facts only
no Boss regex fact extraction
```

## Micro Prompt Family 3 — No false collapse of source-backed truth

Target:

```text
AUTH-049, 050, 051, 052, 055, 056,
059, 060, 061, 062, 063, 064, 065,
066, 067, 069
```

Goal:

```text
sourceBacked true
must not become false merely to pass validation
```

## Micro Prompt Family 4 — Repair/orchestrator provenance preservation

Target:

```text
AUTH-078 through AUTH-091
```

Goal:

```text
immutable original provenance baseline
repair may change renderability
repair may not rewrite accepted truth
pre/post delta guard required
```

## Micro Prompt Family 5 — Final delivery gate integrity

Target:

```text
AUTH-092 through AUTH-105
```

Goal:

```text
publishability requires full final compliance
Boss OK
model OK
HTML OK
no unresolved provenance regression
legitimate collapse distinguished from false collapse
```

---

# Codex Leash / Usage Preservation

For every future Codex prompt:

```text
- narrow scope;
- one root family at a time;
- no broad repo audit;
- no live services;
- no DocRaptor;
- no Supabase writes;
- no paid/API loops;
- no broad smoke wall by default;
- no RETEST until coherent category fix is complete;
- no test-report hardcoding;
- no Stonebridge/RETEST/Attack fixture values in production;
- preserve Screening;
- compact receipt only.
```

Preferred compact receipt:

```text
1. Verdict PASS / HOLD / BLOCKED
2. Files changed
3. Exact authority contract changed
4. Targeted checks run/results
5. Exact blocker if HOLD/BLOCKED
6. Confirm no live services
7. Confirm no commit unless explicitly requested
```

Testing discipline:

```text
Start with:
- node --check
- targeted rg
- smallest relevant smoke/test

Escalate only if necessary.
Do not spend Codex usage on broad smoke walls unless the change genuinely requires them.
```

---

# Fresh Chat Start Instruction

Upload these three files first:

```text
1. Updated MASTER context/checklist
2. Updated CVF ledger
3. This AUTH-001 through AUTH-105 Semantic Authority Evidence Ledger
```

Then instruct the next chat:

```text
Do not restart the audit.
Do not ask for a broad Codex investigation.
Treat the AUTH ledger as the preserved evidence map.

First task:
Consolidate AUTH-001 through AUTH-105 into the smallest safe sequence of Codex micro-prompts.

Preserve Codex usage:
- one root family at a time;
- compact receipts;
- targeted checks;
- no broad smoke wall;
- no live services;
- no Screening changes unless strictly required;
- no RETEST until coherent category fixes are complete.

The prompts must implement the evidence-backed authority purge.
Codex is not being asked to rediscover the architecture.
```

---

# Controlling Conclusion

The manual audit proved that the Acquisition Memo problem is not one renderer bug, one parser bug, one stale helper, or one bad test.

It is:

```text
duplicate semantic authority
+
duplicate fact authority
+
no immutable provenance lock
+
false-collapse compliance laundering
+
a final gate that does not require full final compliance
```

That is the root evidence base for the next Codex execution phase.
