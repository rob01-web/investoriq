# INVESTORIQ â€” FINAL PIPELINE REPAIR & ELITE GAME PLAN
**Date:** 2026-08-17
**Status:** ARCHITECTURE PLAN ONLY â€” NO PATCHES HAVE BEEN AUTHORIZED BY THIS DOCUMENT
**Primary source of truth:** Full Pipeline Audit Working Ledger through Finding 236, plus consolidated architecture findings 237â€“288 from the continuation chat.

---

# 1. PURPOSE

This document converts the completed InvestorIQ repository/config/test/doctrine/production audit into one implementation program.

The goal is not to repair RETEST 48 in isolation.

The goal is to produce one coherent launch architecture for:

- Screening
- Full Underwriting
- Bundle commerce
- future Premium isolation
- secure source ingestion
- bounded worker processing
- canonical source truth
- canonical publication authority
- idempotent PDF/report persistence
- revision promotion
- customer visibility
- recovery/remediation
- launch certification
- ELITE / institutional-quality report evolution

The dominant root cause established by the audit is:

> **AUTHORITY ACCUMULATION** â€” newer authorities were added without retiring stale, duplicate, historical, or future-product authorities.

InvestorIQ must be simplified into one explicit authority chain.

---

# 2. NON-NEGOTIABLE OWNER CONSTITUTION

## Current launch products

### Screening
Current launch product.

### Full Underwriting
Current launch product.

Full Underwriting admission requires, before entitlement consumption / Generate:

- accepted usable T12
- accepted usable Rent Roll
- at least one additional readable/adjudicable supporting document

### Bundle
Commerce construct only.

Target composition:

- 2 Screening entitlements
- 1 Full Underwriting entitlement

Bundle must **not** become a separate report-generation lane.

### Premium
Future product.

Premium is OFF.

When Premium is OFF, it must have **zero publication, worker, billing, delivery, source-truth, or remedy authority** over Screening or Full Underwriting.

---

# 3. CORE-GATED PUBLISH-OR-COLLAPSE CONSTITUTION

Strict Full Underwriting intake and downstream publication survival are different stages.

After a valid job has been admitted, canonical core truth may resolve to:

- `dual_source_core`
- `t12_minimum_core`
- `rent_roll_minimum_core`
- `insufficient_core`

The first three may require publication.

Only genuinely insufficient/invalid canonical core, valid customer-document insufficiency, or genuine internal/platform failure may prevent customer delivery.

Weak optional/supporting sections must:

- qualify
- collapse
- omit
- or publish with a quality incident

They must not independently destroy a valid-core report.

Technical failures must remain internal InvestorIQ failures and must not be converted into customer-document failures.

---

# 4. TARGET SINGLE AUTHORITY CHAIN

The repaired system should follow this exact conceptual flow:

`authenticated customer`
â†’ `governed disclosure acknowledgement`
â†’ `immutable staged source bytes`
â†’ `transactional entitlement + job admission`
â†’ `trusted job provenance`
â†’ `single worker lifecycle authority`
â†’ `trusted extraction/parsing evidence`
â†’ `canonical source truth`
â†’ `canonical publication obligation`
â†’ `product-specific analysis`
â†’ `canonical delivery decision`
â†’ `single publication service`
â†’ `certified PDF + immutable generated artifact`
â†’ `report row + Quality Manifest + publication receipt`
â†’ `job published`
â†’ `atomic current-revision promotion`
â†’ `customer-visible current report`
â†’ `signed download`

No downstream layer may reconstruct or override an upstream canonical decision unless it owns a genuinely lower-level infrastructure/artifact failure.

---

# 5. REPAIR PROGRAM â€” DEPENDENCY ORDER

# PHASE 0 â€” FREEZE THE IMPLEMENTATION CONSTITUTION

Before changing code, create one compact implementation contract defining:

- valid admitted job
- trusted producer
- trusted artifact
- permitted product identifiers
- canonical source-truth owner
- publication-obligation owner
- delivery-decision owner
- publication owner
- retry ceiling
- recovery episode
- report publication meaning
- current revision meaning
- customer visibility meaning
- Premium isolation rules

This contract governs implementation and tests.

Do not let old smoke tests or stale documentation redefine the architecture.

---

# PHASE 1 â€” P0 SECURITY / TRUST BOUNDARY

This must happen before publication refactoring.

## 1.1 Lock down worker lifecycle RPC execution

Production proof established excessive EXECUTE grants, including anonymous access to claim RPCs.

Required state:

- claim RPCs: service/trusted worker only
- renew lease: service/trusted worker only
- transition: service/trusted worker only
- requeue: service/trusted worker only
- fail/dead-letter: service/trusted worker only
- entitlement restoration: governed trusted authority only
- revision promotion: trusted publication/finalization authority only

Caller-supplied `claimed_by` must never establish trust.

## 1.2 Make `analysis_artifacts` internal trusted evidence

Remove customer ability to:

- INSERT internal artifacts
- UPDATE internal artifacts
- DELETE internal artifacts
- generally SELECT internal diagnostics unless intentionally exposed through a shaped customer API/view

This closes:

- forged `source_truth_package`
- forged `document_text_extracted`
- recovery-cache poisoning
- Premium receipt poisoning
- QA/manifest poisoning
- operational dashboard contamination

Internal artifacts must be trusted-producer-only.

## 1.3 Remove direct customer job creation

Customers must not directly INSERT `analysis_jobs`.

Only the sanctioned transactional admission path may create customer generation jobs.

## 1.4 Remove direct customer job-file authority

Customers must not directly create or mutate authoritative `analysis_job_files` processing metadata.

Resolve competing permissive INSERT policies.

After registration, pipeline metadata must be immutable to customers.

## 1.5 Protect entitlement state

Remove direct authenticated mutation of `report_purchases` consumption/remedy state.

All consumption/restoration must occur through governed transactional RPC/API boundaries.

## 1.6 Make generated report Storage service-produced-only

`generated_reports` must be:

- service/trusted publication INSERT
- customer owned SELECT
- no customer INSERT
- no customer UPDATE
- no customer DELETE

This prevents pre-poisoning deterministic publication paths.

## 1.7 Replace direct report deletion

Customer and admin browser code must not directly delete authoritative `reports` rows or generated-report objects.

If deletion/archival is offered, it must be governed and revision-aware.

## 1.8 Harden revision promotion

`promote_report_revision_to_current()` must verify:

- trusted caller
- exact report
- exact published job
- same owner
- exact product/report family
- exact revision lineage
- exact publication receipt eligibility

A known report UUID must never permit cross-user promotion.

---

# PHASE 2 â€” P0 JOB PROVENANCE / LIFECYCLE

## 2.1 Make transactional admission the only job-creation authority

Required Full Underwriting admission transaction:

`owned staged objects`
â†’ verify object existence
â†’ verify actual byte/object metadata
â†’ validate declared/adjudicated document package
â†’ verify current disclosure acknowledgement
â†’ verify entitlement
â†’ consume entitlement
â†’ create job
â†’ register immutable job files
â†’ create durable admission/provenance receipt

The current transaction must be strengthened so it does not merely trust caller-supplied Storage metadata.

## 2.2 Add a pre-constitution terminal domain

Job-integrity failures must terminate before Core-Gated Publish-or-Collapse has jurisdiction.

Examples:

- no valid purchase lineage
- unsupported product
- invalid job provenance
- injected/malformed job
- impossible file registration
- unauthorized lifecycle mutation

These are not source-truth failures.

## 2.3 One claim authority

Retire competing claim behavior.

There should be one authoritative claim primitive.

Remove/disable stale claim paths such as legacy authenticated claim functions and the claim-only orchestration that can strand jobs.

## 2.4 One universal retry ceiling

Every worker claim/requeue episode must obey one retry budget.

No path may bypass exhaustion.

Production has already proven:

- 141 attempts on a queued job
- 12,377 attempts historically

This must become impossible.

## 2.5 One requeue / yield authority

All recoverable handoffs must call one primitive:

- timebox yield
- transient infrastructure failure
- recoverable publication failure
- controlled retry

The primitive must:

- validate current attempt
- validate state
- record reason
- release lease
- enforce retry ceiling
- preserve resume checkpoint
- emit one recovery receipt

## 2.6 Explicit admin recovery episodes

Admin recovery must create a new bounded recovery episode.

Do not use historical "ever admin requeued" events as permanent retry permission.

Each episode should have:

- recovery episode ID
- authorized actor
- reason
- source terminal state
- resume checkpoint
- bounded retry budget
- exact purchase lineage

## 2.7 Atomic entitlement restoration lineage

Entitlement restoration and its authoritative lineage/audit receipt must occur atomically.

No restored purchase may exist without recoverable provenance.

---

# PHASE 3 â€” P0 PRODUCT / SOURCE AUTHORITY

## 3.1 Give Full Underwriting its own canonical identity

Current Full Underwriting must stop resolving through historical Acquisition Memo authority.

Target concept:

- `product = full_underwriting`
- `report_family = full_underwriting`
- explicit current mode/version

The exact naming can be chosen in implementation.

Do not continue using `acquisition_memo`, `acquisition_memo_v2`, or ambiguous `v1_core` as the constitutional product identity.

## 3.2 Demote Acquisition Memo

Classify Acquisition code into:

- reusable calculation/support component
- historical regression/reference
- removable dead authority

Acquisition Memo must not own:

- Full Underwriting identity
- source authority
- publication obligation
- delivery authority
- revision family
- current launch rendering constitution

## 3.3 Preserve one canonical source-truth package

Both Screening and Full Underwriting consume the same accepted source truth.

One constructor owns:

- T12 acceptance
- Rent Roll acceptance
- support-document context
- contradictions
- reconciliation
- source mode
- survivor-lane authority

Product pipelines may consume this truth but may not reinterpret it.

## 3.4 Preserve strict intake / survivor-lane distinction

Full Underwriting admission remains strict.

After admission, downstream source degradation may still produce a valid survivor-lane report.

Do not reintroduce the obsolete dual-core downstream hard gate.

## 3.5 Keep support documents contextual

Support evidence may enrich analysis.

It must not independently veto valid core unless it proves a genuine catastrophic contradiction that destroys the core truth itself.

## 3.6 Physically isolate Premium

When Premium is OFF:

- do not create Premium start receipts
- do not validate Premium publication receipts
- do not run Premium publication enforcers
- do not require Premium QA for launch
- do not allow Premium code to block current products

OFF must mean outside the active authority graph.

## 3.7 Remove stale executable product aliases

Current customer job products should be intentionally narrow:

- Screening
- Full Underwriting

Historical `ic` / Acquisition aliases must not silently enter current launch processing.

---

# PHASE 4 â€” P0 CANONICAL DELIVERY AUTHORITY

## 4.1 One typed authoritative action

Replace overlapping legacy booleans/flags with one authoritative outcome.

Target conceptual actions:

- `DELIVER`
- `DELIVER_WITH_QUALITY_INCIDENT`
- `INTERNAL_REPAIR_REQUIRED`
- `CORE_INSUFFICIENT`

Diagnostics may explain the result but may not override it.

Retire competing authority fields such as stale:

- `shouldContinue`
- conflicting `hold_delivery`
- conflicting nested repair-plan hold states
- duplicate publishable/eligible booleans

## 4.2 Delivery cannot rediscover source truth

Delivery may inspect:

- report representation
- section disposition
- HTML/report contract
- artifact readiness

Delivery may not reinterpret T12/Rent Roll/source-mode truth.

## 4.3 Quality incidents are nonblocking by definition

If an issue blocks publication, classify it as internal repair or core insufficiency.

Do not let stale nested state say "hold" under a final "publish with quality incident" outcome.

---

# PHASE 5 â€” P0 SINGLE PUBLICATION PIPELINE

This is the major structural repair.

## 5.1 Worker becomes orchestrator

Worker owns:

- lifecycle
- trusted stage execution
- checkpoint transitions
- failure/recovery routing
- finalization

Worker does not independently recreate publication logic.

## 5.2 Report constructor becomes deterministic content authority

The report constructor receives:

- canonical source truth
- product identity
- accepted supporting context

It returns:

- report model
- approved final HTML
- section dispositions
- delivery inputs

It does not independently own customer publication persistence.

## 5.3 One publication service

Exactly one publication service owns:

`approved report`
â†’ final HTML
â†’ DocRaptor/PDF render
â†’ PDF certification
â†’ bounded PDF recovery
â†’ immutable Storage object
â†’ reports persistence
â†’ Quality Manifest
â†’ publication receipt

Delete/consolidate the current generator + worker double-publication/certification authority.

## 5.4 One exact publication input contract

Publication receives explicit:

- job ID
- owner ID
- product identity
- revision request key
- canonical source-truth receipt
- canonical delivery decision
- approved report model
- approved final HTML
- required manifest inputs

No property-name/time heuristic identity.

## 5.5 One durable publication receipt

A completed publication should produce one authoritative receipt including:

- exact job
- exact report
- exact revision identity
- Storage object
- checksum
- PDF certification state
- Quality Manifest identity
- publication status/timestamp

Worker success should rely on this receipt, not scattered "latest" lookups.

## 5.6 Exact idempotency by `revision_request_key`

Retry answers only:

- exact publication absent â†’ create
- exact publication complete â†’ reuse
- exact publication incomplete/corrupt â†’ governed reconciliation

Never reuse "most recent report with same property name/type".

## 5.7 Repair partial-commit behavior

The publication service must recover from:

`Storage succeeded`
â†’ `DB report insert failed`

without becoming permanently poisoned by `upsert:false`.

On retry, reconcile existing artifact by:

- exact revision identity
- checksum
- trusted metadata

Then safely adopt, clean up, or classify conflict.

## 5.8 Quality Manifest is part of publication completion

A job must not become authoritatively published before the required manifest is persisted.

Required order:

`PDF certified`
â†’ `artifact stored`
â†’ `report persisted`
â†’ `manifest persisted`
â†’ `publication receipt complete`
â†’ `job published`

Manifest failure is internal publication failure.

---

# PHASE 6 â€” P0 FINALIZATION / REVISION / CUSTOMER VISIBILITY

## 6.1 Fix publication ordering

Correct order:

1. complete artifact/report/manifest persistence
2. transition job to `published`
3. run exact lineage-fenced current-revision promotion
4. expose current report to customer

This resolves the current impossible promotion-before-published contradiction.

## 6.2 Make `is_current_revision` the only current-revision authority

Do not fallback-label arbitrary published rows as "current".

`reports.status = published` does not mean current.

Customer download must require exact current-revision state.

## 6.3 Customer visibility is a final authority

Download eligibility requires:

- correct customer
- complete publication receipt
- required manifest
- published job
- published report
- current revision
- valid generated object
- exact lineage match

Then issue signed download access.

---

# PHASE 7 â€” P0 FAILURE TAXONOMY / BOUNDED RECOVERY

## 7.1 Split failure jurisdictions

### A. Admission/job-integrity
Examples:

- missing/invalid entitlement
- unsupported product
- invalid provenance
- invalid lifecycle

### B. Canonical source/core insufficiency
Examples:

- truly insufficient core
- catastrophic contradiction with no survivor lane

### C. Internal delivery/platform
Examples:

- source-truth construction exception
- renderer failure
- contract failure
- DocRaptor failure
- PDF certification failure
- Storage failure
- report persistence failure
- manifest failure

Domain C must never become a customer-document message.

## 7.2 Replace broad `PDF_ARTIFACT_FAILED`

Internally distinguish:

- renderer request failure
- renderer response failure
- PDF structural failure
- PDF content-contract failure
- recovery exhausted
- Storage publication failure
- report persistence failure
- manifest persistence failure

Customer-facing copy may still be simplified.

## 7.3 Persist safe stage checkpoints

Useful conceptual checkpoints:

- source truth complete
- report constructed
- delivery approved
- artifact rendered
- publication persisted
- job published

A late Storage/DB failure should not force complete reparsing unless upstream truth was invalidated.

## 7.4 Checkpoints must be immutable lineage receipts

Do not use generic "latest matching artifact" as stage authority.

Each checkpoint should bind:

- job
- stage
- upstream receipt IDs/hashes
- product/version
- output checksum
- authoritative result

---

# PHASE 8 â€” ADMIN / OBSERVABILITY / LEGACY PRODUCTION HYGIENE

## 8.1 Admin UI must use governed server actions

Remove direct browser mutations for:

- force fail
- report deletion
- purchase/credit edits
- lifecycle mutation

Admin actions must preserve audit/lineage.

## 8.2 Modernize operational metrics

Track actual states:

- queued
- extracting
- underwriting
- scoring
- rendering
- pdf_generating
- publishing
- published
- failed
- dead_letter

Also expose:

- lease owner
- lease expiry
- attempt
- max attempts
- recovery episode
- last transition
- checkpoint
- terminal classification

## 8.3 Separate legacy stranded jobs

The 23 historical `publishing` rows from Mayâ€“June 2026 must not be fed blindly into the modern worker.

Create a deliberate one-time reconciliation/remedy plan after the new lifecycle is in place.

## 8.4 Quarantine legacy Storage residue

`analysis-uploads` contains only four old March objects.

After launch authorities are stable, classify/archive/delete through an explicit historical cleanup process.

Do not let this legacy bucket remain an active source authority.

---

# PHASE 9 â€” P1 COMMERCE / STRIPE

## 9.1 Do not change launch pricing yet

Confirmed production mismatch:

- live server Screening Stripe price: $499 USD
- live server Underwriting Stripe price: $1,499 USD
- current doctrine/site: $199 / $499 / $699 Bundle
- Bundle server price missing

Repair is intentionally deferred until:

1. pipeline repair is complete
2. report quality reaches ELITE target
3. owner chooses final pricing

## 9.2 Finish Bundle after final pricing decision

Required proof:

`pricing`
â†’ `checkout product`
â†’ `live Stripe price`
â†’ `checkout session`
â†’ `webhook`
â†’ `2 Screening + 1 Full Underwriting entitlements`
â†’ `dashboard consumption`

## 9.3 Harden webhook fulfillment

Do not rely forever on current payment-method behavior.

Explicitly require successful payment state and handle asynchronous payment semantics if supported in future.

The recent 25-session production sample showed all sessions complete + paid, so no current unpaid-entitlement impact was demonstrated.

---

# PHASE 10 â€” P1 REPOSITORY AUTHORITY CLEANUP

After the active architecture is stable:

## Remove/archive/isolate stale authority

Candidates already identified include:

- historical Acquisition product wrappers
- old canonical-source package claiming "single source of truth"
- orphan rendering helpers
- orphan terminal-failure maps
- dead client-side PDF generation stack
- obsolete PricingTiers component
- duplicate report template
- old sample dataset
- stale local `server.js`
- dead SES helper
- dormant institutional/IC/scenario chains
- dormant Premium launch machinery
- historical `ic` product lane
- legacy claim RPCs
- duplicate requeue/yield implementations
- direct browser mutation paths

A production-looking file should not remain beside current authorities unless it has an explicit supported role.

---

# PHASE 11 â€” P1 TEST / QA REBUILD

Tests follow architecture. Architecture does not bend to stale tests.

## Launch-critical suite

Build tests for the actual repaired chain:

1. RLS / RPC adversarial security
2. immutable staged upload boundary
3. transactional admission
4. disclosure enforcement
5. entitlement consumption
6. worker claim/lease
7. retry exhaustion
8. one requeue authority
9. deterministic parsing
10. trusted artifact provenance
11. canonical source truth
12. one-source survivor matrix
13. Screening construction
14. Full Underwriting construction
15. canonical delivery
16. single publication path
17. partial-commit/idempotency recovery
18. mandatory Quality Manifest
19. published-job transition
20. revision promotion
21. customer visibility/download
22. atomic entitlement restoration
23. governed admin recovery

## Component suites

Preserve/rehome:

- parser adversarial fixtures
- deterministic calculations
- AI recovery validation
- DocRaptor/PDF contract tests
- source reconciliation fixtures
- support-precedence fixtures

## Historical diagnostics

Retain only as non-authoritative diagnostics:

- RETEST-specific reproductions
- historical bug replay fixtures

## Acquisition historical

Rewrite useful invariants against Full Underwriting or archive.

## Premium

Separate future-product suite.

Premium must not block current launch certification.

---

# PHASE 12 â€” P1 DOCUMENTATION CLEANUP

Create one small documentation authority hierarchy.

## Document 1 â€” Owner / Product Constitution

Defines:

- products
- pricing
- Bundle
- Premium OFF
- intake requirements
- publish-or-collapse doctrine

## Document 2 â€” Production Pipeline Architecture

Defines the single authority chain and exact module/RPC ownership.

## Document 3 â€” Operations / Recovery Runbook

Defines:

- scheduler
- worker
- retry policy
- dead-letter
- admin recovery
- production diagnostics

## Document 4 â€” Launch Certification Checklist

Contains only real launch-critical proof.

Everything else becomes clearly:

- historical
- archived
- future Premium
- diagnostic

No contradictory files should continue advertising themselves as simultaneously current/active.

---

# 6. ELITE / BLACKSTONE-LEVEL REPORT UPGRADE

Do this **after the pipeline constitution is stable enough that report-output work will not be invalidated by another orchestration rewrite**.

The report upgrade should improve analysis quality without creating new source authorities.

# ELITE PRINCIPLE

> Better analysis may derive more insight from canonical facts, but it may never invent stronger evidence than the uploaded/adjudicated sources support.

## 6.1 Full Underwriting product identity

Build a true institutional Full Underwriting report rather than an Acquisition Memo rebrand.

## 6.2 Institutional information hierarchy

Target a professional decision document with sections such as:

- Executive Investment Summary
- Asset / Property Overview
- Source & Evidence Summary
- Historical Operating Performance
- Rent Roll / Occupancy Analysis
- Revenue Quality
- Expense Structure
- NOI / Margin Analysis
- Unit / Tenant concentration where relevant
- Debt / Financing Context where evidenced
- Capital / Renovation Context where evidenced
- Tax / Appraisal / Environmental Context where evidenced
- Source Reconciliation & Contradictions
- Risk Matrix
- Key Investor Questions
- Underwriting Constraints / Unavailable Evidence
- Decision-useful observations
- Quality Manifest

Exact section set should be driven by evidence availability and product doctrine.

## 6.3 Executive-grade visuals

Add only visuals supported by canonical data, such as:

- revenue/expense/NOI trend
- expense composition
- rent distribution
- occupancy/lease status
- unit mix
- concentration charts
- source reconciliation flags
- risk heatmap
- debt/capital context where supported

Do not create charts that imply nonexistent data completeness.

## 6.4 Institutional writing standard

The report should be:

- concise
- analytical
- evidence-linked
- explicit about missing evidence
- free of unsupported recommendations
- free of fake certainty
- clear about source conflicts
- decision-oriented
- visually consistent

## 6.5 Section disposition

Every optional/dependent section should support:

- full render
- qualified render
- compact render
- omitted/collapsed

This is the report-surface manifestation of Publish-or-Collapse.

## 6.6 Quality Manifest

The manifest should clearly communicate:

- source modes
- accepted core evidence
- support documents used
- material exclusions
- reconciliation issues
- collapsed/omitted sections
- quality incidents
- certification version
- report/revision identity

## 6.7 Screening vs Full Underwriting differentiation

Screening should be fast, focused, decision-useful.

Full Underwriting should clearly justify its higher price through:

- deeper operating analysis
- stronger reconciliation
- broader support-document incorporation
- more sophisticated risk analysis
- institutional visuals
- more decision context
- stronger evidence/quality disclosure

The two products must not feel like the same report with a few extra pages.

## 6.8 Future Premium boundary

Premium may later add:

- external integrations
- market feeds
- richer comparable data
- external debt/financing intelligence
- more scenario modeling
- richer visuals
- combined uploaded + integrated intelligence
- advanced recommendations/decision support

Those capabilities must remain future-only until separately authorized.

---

# 7. PRODUCTION CLEANUP / MIGRATION WORK AFTER REPAIR

After the new architecture is deployed and proven:

- classify/reconcile 23 legacy `publishing` jobs
- reconcile old dead-letter/retry-storm jobs
- remove/disable stale privileged RPCs
- remove obsolete RLS policies
- migrate/lock trusted artifact model
- reconcile report/job FK lineage as needed
- review report deletion/retention policy
- clean legacy Storage bucket residue
- remove stale product aliases
- archive old documentation
- rebuild current pipeline map

Historical data must not be silently forced through modern state transitions without an explicit migration policy.

---

# 8. DEPLOYMENT / MIGRATION ORDER

When implementation begins, deploy in a way that does not create a mixed unsafe state.

Recommended conceptual order:

1. add new trusted/governed primitives
2. add new constraints/receipts/checkpoints
3. migrate current application callers to them
4. verify callers no longer use legacy paths
5. revoke legacy/public privileges
6. disable/remove stale authorities
7. migrate publication pipeline
8. migrate revision finalization
9. clean customer/admin UI direct mutations
10. deploy new tests
11. reconcile legacy rows
12. clean documentation/code residue

Security changes that can safely be tightened immediately should not be delayed merely to preserve an obsolete bypass path.

Exact migration sequencing must be designed against current DB dependencies before execution.

---

# 9. RETEST POLICY

Do not use RETEST 48 as the repair plan.

RETEST 48 becomes one regression case for the repaired system.

Do not start another production RETEST until:

- security/RLS/RPC boundaries are repaired
- single lifecycle authority is active
- retry exhaustion is enforced
- Full Underwriting has canonical identity
- Premium is isolated
- canonical delivery is typed/single
- one publication authority exists
- Quality Manifest is mandatory
- revision ordering is corrected
- customer visibility is lineage-fenced

Then execute a fresh numbered production certification job.

---

# 10. FINAL PRODUCTION CERTIFICATION

The repaired system is not launch-ready until fresh production evidence proves the real chain.

Required fresh proof:

## Security / admission
- customer cannot directly insert internal jobs/artifacts
- customer cannot mutate authoritative file metadata
- customer cannot execute worker lifecycle RPCs
- customer cannot write generated-report Storage
- customer cannot promote foreign reports
- disclosure enforced transactionally
- staged-object bytes/metadata validated

## Worker
- Supabase Cron invokes sanctioned worker
- one claim authority
- lease/attempt identity correct
- retry ceiling enforced
- timebox yield uses canonical requeue
- exhausted job cannot be re-claimed indefinitely

## Source
- deterministic parsing
- trusted derived artifacts only
- canonical T12/Rent Roll/support truth
- one-source survivor behavior
- catastrophic contradiction behavior

## Screening
- complete real Screening publication

## Full Underwriting
- strict intake
- canonical Full Underwriting identity
- no Acquisition Memo authority
- no Premium veto
- institutional report construction

## Publication
- one publication lane
- approved HTML retained
- PDF generated
- PDF certified
- partial-commit recovery/idempotency proven
- generated object service-produced
- reports row exact
- Quality Manifest exact

## Revision / visibility
- job published before promotion
- exact lineage promotion
- only current revision downloadable
- signed download succeeds

## Failure/recovery
- internal renderer/PDF/storage failure remains internal
- customer entitlement remedy correct
- retry bounded
- governed admin recovery works
- no infinite loop

Only then should InvestorIQ receive a launch PASS.

---

# 11. DEFINITION OF DONE

InvestorIQ is technically stabilized when all of the following are true:

- no customer-writable internal constitutional evidence
- no direct customer job/lifecycle authority
- no anonymous worker lifecycle authority
- no cross-user revision-promotion surface
- no customer-writable publication Storage
- one entitlement authority
- one job-admission authority
- one claim authority
- one retry/requeue authority
- bounded retry exhaustion
- one trusted source-truth authority
- explicit Full Underwriting identity
- no Acquisition product authority over current Underwriting
- Premium physically isolated
- one canonical delivery action
- one PDF/publication authority
- exact revision idempotency
- mandatory Quality Manifest
- published-before-promotion ordering
- one current-revision authority
- customer download lineage-fenced
- atomic entitlement/recovery lineage
- governed admin control plane
- modern observability
- launch tests represent actual production architecture
- stale authority removed/archived
- fresh production certification passes

InvestorIQ is **ELITE** when, in addition:

- Full Underwriting is institutionally differentiated from Screening
- report writing is evidence-disciplined and decision-useful
- visuals materially improve investor comprehension
- reconciliation is explicit
- missing data is transparent
- optional weakness collapses cleanly
- Quality Manifest is polished and trustworthy
- report identity/branding is consistent
- no historical Acquisition terminology leaks into customer output
- production reliability is boring, bounded, observable, and recoverable

---

# 12. MASTER PRIORITY ORDER

## P0 â€” MUST FIX BEFORE LAUNCH

1. DB/RLS/RPC/Storage trust boundary
2. transactional job provenance
3. pre-constitution failure jurisdiction
4. single claim/requeue/retry authority
5. bounded retry exhaustion
6. atomic entitlement recovery
7. explicit Full Underwriting identity
8. retire Acquisition authority
9. isolate Premium
10. canonical source truth
11. canonical publication obligation
12. one typed delivery authority
13. one publication service
14. exact publication idempotency
15. Quality Manifest atomicity
16. published-before-promotion ordering
17. ownership/lineage-fenced revision promotion
18. customer visibility/download authority
19. governed admin recovery
20. production observability
21. legacy production-row reconciliation policy

## P1 â€” REQUIRED FOR CLEAN LAUNCH OPERATIONS

22. final Stripe pricing decision
23. Bundle price/config activation
24. explicit successful-payment webhook fulfillment
25. repository dead-authority cleanup
26. launch QA rebuild
27. documentation consolidation

## ELITE â€” PRODUCT QUALITY UPGRADE

28. institutional Full Underwriting information architecture
29. executive-grade visual system
30. stronger investor analysis
31. robust section collapse/qualification behavior
32. polished Quality Manifest
33. sharp Screening vs Full Underwriting differentiation
34. future Premium boundary preserved

---

# 13. STOP-LOSS RULE FOR IMPLEMENTATION

Do not return to the old pattern of:

`production symptom`
â†’ `tiny patch`
â†’ `smoke PASS`
â†’ `new symptom`
â†’ `tiny patch`

Every implementation change must answer:

1. Which authority owns this decision?
2. Is another authority making the same decision?
3. Can this change retire one duplicate authority?
4. Does the change preserve upstream canonical truth?
5. Is recovery bounded?
6. Is the state idempotent?
7. Can an untrusted caller manufacture this state?
8. Does the test verify behavior rather than implementation-string shape?

If a patch cannot answer those questions, stop and redesign the patch.

---

# 14. CURRENT STATUS AT CREATION OF THIS GAME PLAN

- Repository/source audit Batches 1â€“4: closed as audit scopes.
- Production proof: substantially complete through Finding 236.
- Consolidated repair architecture: defined through Finding 288.
- No new patch authorized by this file.
- No fresh RETEST authorized by this file.
- No launch PASS.
- No pricing change authorized.
- Premium remains OFF.
- Supabase Cron remains the confirmed automatic scheduler at every 3 minutes.
- Current production commit at time of proof: `c9b89d36a22bbe7c2c3f891dcb808d824276ce8f`.
- Current architecture diagnosis: authority accumulation.
- Next execution milestone: convert this plan into controlled implementation packets beginning with P0 security/trust boundary.

---

# 15. FINAL PRINCIPLE

The repair is complete only when InvestorIQ no longer needs humans to reason across five overlapping interpretations of the same state.

The desired end state is deliberately boring:

> one trusted input path
> one job
> one lifecycle
> one source truth
> one publication obligation
> one product analysis lane
> one delivery decision
> one PDF publication authority
> one revision authority
> one customer-visible result
> bounded recovery when anything fails

That is the foundation required to make InvestorIQ both reliable and ELITE.
