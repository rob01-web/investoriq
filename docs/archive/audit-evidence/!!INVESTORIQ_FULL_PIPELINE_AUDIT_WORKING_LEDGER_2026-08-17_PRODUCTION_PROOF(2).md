# INVESTORIQ FRESH-CHAT HANDOFF â€” FULL PIPELINE AUDIT
**Date:** 2026-08-17

## PRIMARY OBJECTIVE
Perform a **complete, read-only, end-to-end audit of the InvestorIQ production pipeline** before any further code changes, RETEST patches, or Codex prompts.

The purpose is to eliminate the recurring pattern of fixing one branch while stale/duplicate authorities remain elsewhere in the system.

**Do not patch RETEST 48.**
**Do not give Codex another repair prompt.**
**Do not treat smoke tests as constitutional authority.**
**Do not declare anything â€œfixedâ€ until the complete architecture has been mapped and repaired, then proven through fresh production evidence.**

The user will immediately upload:

`INVESTORIQ_AUDIT_BATCH_1_CORE_PIPELINE.zip`

This ZIP contains exactly:
- `api/`
- `src/`
- `supabase/`

Audit those folders directly and completely.

---

# CURRENT AUTHORITATIVE PRODUCTION COMMIT

`c9b89d36a22bbe7c2c3f891dcb808d824276ce8f`

Commit message:

`fix: preserve canonical core publication authority`

Production deployment was already visually proven in Vercel as:
- Ready
- Latest
- Production
- Current
- branch `main`
- abbreviated commit `c9b89d3`
- domain `investoriq.tech`

Do **not** confuse deployment readiness with pipeline correctness.

---

# RETEST STATUS

## RETEST 47
RETEST 47 was a stale queued zombie created under the old retry storm.

Exact job:

`113e1fec-5d0c-4f67-939a-5162c115575a`

Property:

`Final Attack Test 8 RETEST 47`

It had:
- `status = queued`
- no worker claim
- no lease
- no heartbeat
- `attempts = 0`
- `worker_attempt_count > 12,000`

It was manually quarantined safely with:
- `status = dead_letter`
- `dead_lettered_at` populated
- `error_code = RETEST47_MANUAL_QUARANTINE`

Do not rerun RETEST 47.

## RETEST 48
Fresh production RETEST 48 exists and exposed the remaining architectural failures.

Exact job:

`9d28b058-a6d4-4981-8b92-2b77bf3315a7`

Property:

`Final Attack Test 8 RETEST 48`

Important production facts already established:
- canonical source truth says core is publishable
- canonical delivery says customer delivery is allowed
- `delivery_gate_status = deliverable`
- `customer_delivery_allowed = true`
- `hold_delivery = false`
- constitutional terminal firewall correctly refuses to kill a valid-core report
- downstream PDF/publication failure occurs
- worker requeues and repeats

Do not patch RETEST 48 specifically. Use it as a production trace while auditing the whole system.

---

# PRODUCT DOCTRINE â€” IMPORTANT CORRECTION

## Screening
Screening is a current launch product.

Its exact minimum intake requirements must be established from current code/docs during this audit and kept distinct from downstream publication-survival doctrine.

## Full Underwriting
The intended launch product is **Full Underwriting**, not the smaller Acquisition Memo product.

The **customer intake requirement for Full Underwriting is intentionally strict**:

**T12 + Rent Roll + at least 1 additional supporting document are mandatory before Generate may be pressed.**

That means frontend and transactional intake gates requiring those documents are **not automatically defects**.

This is separate from the downstream Core-Gated Publish-or-Collapse survival doctrine.

Once a valid Full Underwriting package has been accepted, downstream processing should not unnecessarily destroy a report if one core lane later becomes unusable but sufficient canonical source truth survives.

Do not conflate:
- **intake requirements**, and
- **publication survival requirements**.

## Product evolution
InvestorIQ evolved roughly as:

Legacy Underwriting â†’ Acquisition Memo â†’ Full Underwriting

The Acquisition Memo was later judged too similar to Screening and should not remain the authoritative launch product if stale architecture still references it.

A major audit goal is to identify any current Full Underwriting execution path that is still named after, routed through, constrained by, or governed by stale Acquisition Memo / legacy Underwriting architecture.

## Premium
Premium is a **future product**, not todayâ€™s Full Underwriting.

Conceptually:
- Full Underwriting = deep institutional-style analysis based primarily on uploaded property documents.
- Future Premium = Full Underwriting plus external integrations, more data, substantially richer charts/visualizations, recommendations/decision support, and combined uploaded + integrated intelligence.

**Premium is OFF.**

Premium machinery must not govern whether current Screening or Full Underwriting reports publish.

If dormant Premium code complicates the current launch pipeline, determine whether it should be isolated or removed from the live execution path.

Do not turn Premium on.

## Bundle
Bundle is not merely a pricing-page idea.

Historical product doctrine defined it as approximately:

**2 Screening + 1 Full Underwriting**

at a prior price point of **$699**.

Historical work indicated Bundle entitlement creation had been structurally implemented, but complete customer purchasing/launch activation was not yet proven closed.

Audit the current code path:

pricing â†’ checkout product identifier â†’ Stripe session â†’ webhook â†’ entitlement creation â†’ dashboard consumption

and establish the exact current implementation status from code.

---

# NON-NEGOTIABLE OWNER DOCTRINE

## Core-Gated Publish-or-Collapse
The current report-publication doctrine is:
- Publish when canonical core truth is sufficiently valid.
- Optional/weak sections collapse, omit, or publish with quality incident.
- Whole-report failure is reserved for truly insufficient/invalid core or genuine infrastructure/customer-document failure.

Known source modes from prior constitutional work include:
- `dual_source_core`
- `t12_minimum_core`
- `rent_roll_minimum_core`
- `insufficient_core`

The first three can be constitutionally publishable downstream.

Again: Full Underwriting intake still intentionally requires T12 + Rent Roll + supporting document before Generate.

---

# WHY THIS AUDIT EXISTS

The project has repeatedly achieved branch-level PASS results while the full production pipeline remained broken.

The user explicitly does **not** want:
- another tiny fix
- another Codex prompt
- another RETEST-specific patch
- another claim that â€œitâ€™s fixedâ€ based on helper tests
- another smoke-test-led repair

The audit must establish **one coherent authority chain** from Generate to customer PDF.

---

# ALREADY DISCOVERED ARCHITECTURAL RISKS

These findings came from a preliminary read-only GitHub audit. They are hypotheses/confirmed risks to validate against the uploaded source tree before any repair plan is finalized.

## 1. Duplicate publication pipelines
The generator appears to perform substantial publication work itself:
- render
- PDF QA/recovery
- upload
- report DB creation
- signed URL
- quality-manifest candidate
- return report/storage information

Then `admin-run-worker.js` appears to perform another downstream publication/certification sequence.

Audit whether this creates competing authorities and determine the intended single authoritative publication boundary.

## 2. Revision promotion ordering contradiction
Preliminary audit found:
- worker links `report_id`
- worker calls `promoteReportRevisionToCurrent()`
- worker only later transitions job to `published`

But SQL `promote_report_revision_to_current()` appears to require an associated `analysis_jobs` row already in `status = published`.

If confirmed, this is an impossible ordering contract:

worker requires promotion before published; SQL requires published before promotion.

Validate from the uploaded files.

## 3. Requeue/retry exhaustion gap
SQL terminal failure paths have a max-attempt concept, but constitutionally publishable downstream failures can be intercepted and requeued instead of terminally failed.

This may bypass retry exhaustion and permit infinite/huge retry loops.

RETEST 47â€™s >12,000 worker attempts are evidence of the old failure class.

Audit every requeue path and establish one finite recovery policy.

## 4. Stale in-memory job state
Worker transitions return updated DB rows, but surrounding code may continue operating on older job objects.

Audit every transition consumer for stale status/lease/worker-attempt reasoning.

## 5. Structured-source gate return-contract mismatch
Preliminary audit found possible objects carrying contradictory fields such as an authoritative action equivalent to â€œcontinueâ€ while a legacy boolean equivalent to `shouldContinue = false` remains present.

Audit all gate result shapes and remove duplicate authority fields.

## 6. Broad `PDF_ARTIFACT_FAILED` error flattening
The generator appears to catch a broad class of PDF-stage failures and surface them through one generic `PDF_ARTIFACT_FAILED` code.

Audit whether materially different root causes are being collapsed into the same terminal/requeue signal.

Improve error taxonomy only after the pipeline authority map is complete.

## 7. PDF repair-plan nested contradiction
The final PDF boss appears capable of correctly classifying nonblocking defects as `publish_with_quality_incident`, while nested/raw repair-plan state may still contain `hold_for_internal_repair`.

Audit whether stale nested state is serialized into receipts/artifacts and whether any consumer mistakes it for authoritative state.

## 8. Generator â†’ worker artifact-contract mismatch
Preliminary audit suggests worker-side second-pass artifact verification may run without the original final HTML returned by the generator.

Audit the exact generator return contract and every worker consumer.

## 9. Dual entitlement concepts
Job creation consumes `report_purchases`; worker publication also contains legacy/secondary `profiles.report_credits` accounting.

Audit the complete entitlement lifecycle and determine whether there are duplicate accounting authorities.

## 10. Premium receipt dependency
Premium is OFF, but premium job-start/certification machinery exists.

Audit every production claim path to prove Premium OFF cannot block normal Screening/Full Underwriting publication.

---

# SMOKE TEST POLICY

Smoke tests have **zero constitutional authority during this audit**.

Do not begin by running or trusting them.

Production code and current product doctrine establish truth first.

Only after the executable production pipeline is fully mapped should tests be classified as:

- `KEEP â€” valid regression protection`
- `DIAGNOSTIC ONLY â€” useful but non-authoritative`
- `REWRITE â€” stale architecture/doctrine`
- `DELETE â€” obsolete/harmful`

Never modify production merely to satisfy a stale smoke test.

---

# AUDIT METHOD FOR BATCH 1

The user is uploading `INVESTORIQ_AUDIT_BATCH_1_CORE_PIPELINE.zip` containing `api/`, `src/`, and `supabase/`.

After receiving it:

1. **Extract it locally.**
2. **Enumerate every file in the archive.**
3. Produce a complete file inventory with sizes/hashes if practical.
4. Identify binary/generated/non-source files, but do not silently skip source files.
5. Build a dependency/import/RPC map.
6. Search mechanically for every occurrence of key authority terms before manual control-flow inspection.
7. Read every pipeline-relevant source file completely.
8. Do not stop when the first defect is found.
9. Keep a master defect/authority ledger.
10. Do not change source code until the audit is complete.

If a file is too large for one tool response, inspect it in contiguous ranges or with local code tools so no section is silently omitted.

The uploaded ZIP approach is being used specifically because the GitHub connector can truncate very large responses; do not falsely claim every character was inspected unless the local archive actually allowed that level of traversal.

---

# REQUIRED END-TO-END PIPELINE SCOPE

Audit all of the following:

1. product selection
2. pricing/product identifiers
3. Bundle behavior
4. entitlement availability
5. disclosure/session acknowledgement interaction with generation
6. upload UI/preflight
7. staged storage upload
8. transactional purchase consumption
9. job creation
10. queueing
11. scheduler/cron/manual worker invocation
12. worker claim
13. lease fencing
14. retry counters
15. state transitions
16. extraction
17. document classification
18. T12 parsing
19. Rent Roll parsing
20. supporting-document parsing
21. deterministic recovery
22. AI recovery
23. source truth
24. source reconciliation
25. Screening orchestration
26. Full Underwriting orchestration
27. stale Acquisition/legacy paths
28. Premium dormant paths
29. QA/action planning
30. delivery decision
31. customer surface construction
32. HTML/report contract QA
33. rendering
34. DocRaptor request/governance
35. PDF certification
36. PDF repair/recomposition
37. quality-boss authority
38. storage upload
39. `reports` row creation
40. report linkage
41. revision lineage
42. current revision promotion
43. quality manifest
44. final job publication
45. customer report visibility
46. signed download
47. failure taxonomy
48. terminal constitutional firewall
49. requeue/recovery
50. retry exhaustion
51. dead-letter behavior
52. entitlement/credit restoration
53. duplicate side effects/idempotency
54. admin/manual recovery paths
55. RLS/security boundaries relevant to the pipeline

---

# REQUIRED AUTHORITY LEDGER

For every relevant file/module/function/RPC, classify it as one of:

- `CURRENT AUTHORITATIVE`
- `CONFIRMED CORRECT SUPPORTING LOGIC`
- `DUPLICATE AUTHORITY`
- `STALE LEGACY`
- `ACQUISITION HISTORICAL`
- `PREMIUM FUTURE / MUST BE ISOLATED`
- `DEFECT`
- `AMBIGUOUS â€” NEEDS DB/PRODUCTION PROOF`
- `REMOVE / CONSOLIDATE CANDIDATE`

The goal is to converge on a simple chain conceptually like:

`customer intake authority â†’ job/state authority â†’ canonical source truth â†’ canonical delivery authority â†’ artifact existence/usability â†’ publication persistence â†’ published/current customer report`

Downstream layers should not reconstruct or override upstream canonical truth unless a genuine lower-level artifact/infrastructure failure requires it.

---

# SECURITY / FILE-HANDLING RULES

The user intentionally did **not** upload the whole repo because the root contains `.env`.

Do not ask for `.env`, secrets, API keys, Supabase service-role keys, Stripe secrets, Vercel tokens, GitHub tokens, certificates, or private keys.

The initial repo inventory also showed another nested app tree:

`InvestorIQ-Empire-v2-EMERGENT/`

Treat that as a separate historical/experimental tree unless later evidence proves otherwise. Do not mix it with the live production source during Batch 1.

Likewise, do not treat `dist/`, generated PDFs, or archived testing output as production source authority.

---

# LATER BATCHES â€” DO NOT REQUEST YET UNLESS NEEDED

After Batch 1 is fully audited, likely later batches include:

- `scripts/`
- `tests/`
- `lib/`
- `.github/`
- selected root configuration files
- authoritative current InvestorIQ Markdown doctrine/roadmap docs

But finish Batch 1 first unless a missing import or contract requires an additional file.

When requesting another file/folder, request only the smallest necessary sanitized scope.

---

# ROOT FILES KNOWN TO EXIST

The repo-root inventory showed files including:

- `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-08-11_INSTITUTIONAL_REDESIGN.md`
- `!INVESTORIQ_FULL_UNDERWRITING_LAUNCH_BLOCKER_CHECKLIST_2026-08-08.md`
- `INVESTORIQ_FULL_REPOSITORY_UNDERWRITING_LAUNCH_INVESTIGATION.md`
- `INVESTORIQ_SIMULTANEOUS_LAUNCH_MASTER_GAME_PLAN.md`
- `UNDERWRITING_GAMEPLAN_v2.md`
- `ELITE_ROADMAP.md`
- `PIPELINE_MAP.md`
- `package.json`
- `package-lock.json`
- `server.js`
- `vercel.json`
- `vite.config.js`

The root also contains `.env`; never request/upload it.

---

# WORKING STYLE

The user wants factual, unsugarcoated analysis.

Do not agree merely to be reassuring.

If a prior assumption is disproven, retract it immediately.

Do not call anything PASS/fixed/closed prematurely.

The user is willing to hear disappointing conclusions if they are supported by evidence.

The aim is to finish InvestorIQ for launch, not to create another reassuring partial result.

---

# FIRST ACTION IN THE NEW CHAT

The user will upload:

`INVESTORIQ_AUDIT_BATCH_1_CORE_PIPELINE.zip`

Immediately:

- acknowledge receipt briefly
- extract/inventory it
- start the full read-only audit
- do **not** ask for Codex
- do **not** propose code patches yet
- do **not** start another production RETEST
- do **not** rely on smoke tests

The audit continues until Batch 1 has been fully mapped and the master authority/defect ledger is complete.

Then and only then design the architectural repair plan.

**Goal: this is the final full-pipeline audit before InvestorIQ launch stabilization.**

---

# BATCH 1 READ-ONLY AUDIT â€” PERSISTED WORKING LEDGER
**Audit status:** IN PROGRESS â€” DO NOT PATCH YET
**Source batch:** `INVESTORIQ_AUDIT_BATCH_1_CORE_PIPELINE.zip` (`api/`, `src/`, `supabase/`)
**Inventory:** 191 files total (122 `api/`, 53 `src/`, 16 `supabase/`)
**Rule:** These findings are architecture evidence, not repair instructions. Complete all audit batches before forming the final repair game plan.

## Persisted findings 1â€“50

### 1. Impossible revision-promotion ordering
**Classification:** `DEFECT` / `DUPLICATE AUTHORITY`
The worker links the report and manually calls `promoteReportRevisionToCurrent()` while the job is still in `rendering`. SQL `promote_report_revision_to_current()` requires an associated `analysis_jobs` row already in `status = 'published'`. The worker transitions to `published` only later. This is an impossible ordering contract.

### 2. Duplicate publication pipelines
**Classification:** `DUPLICATE AUTHORITY`
Full Underwriting publication work occurs substantially inside `generate-client-report-impl.js` (rendering, PDF QA/recovery, upload, reports-row persistence, signed URL / manifest work) and then the worker performs another artifact/publication/certification sequence. Publication authority is not single-lane.

### 3. Generator â†’ worker artifact-contract mismatch
**Classification:** `DEFECT`
The normal Full Underwriting generator success payload does not return the original approved `final_html`, while the worker later invokes second-pass artifact verification/recovery with `reportData?.final_html || ""`. Worker recovery/certification can therefore operate without the original approved HTML authority.

### 4. Full Underwriting currently routed through Acquisition Memo V2
**Classification:** `ACQUISITION HISTORICAL` / `STALE LEGACY` / `DUPLICATE AUTHORITY`
`full_underwriting` / `underwriting` resolves to the `v1_core` path, which enables the Acquisition Memo V2 source authority, builds the Acquisition Memo projection, renders/runs its boss/pipeline, and seals the lane as `acquisition_memo_v2`. This is substantive authority reuse, not cosmetic stale naming.

### 5. Structured-source gate result carries contradictory authorities
**Classification:** `DEFECT` / `DUPLICATE AUTHORITY`
A structured-source decision can carry an authoritative `action` equivalent to continue while retaining a stale legacy `shouldContinue = false`. Consumers still inspect the legacy boolean in places. Result shape contains competing authorities.

### 6. Retry exhaustion is bypassed by constitutional requeue paths
**Classification:** `DEFECT`
The SQL max-attempt concept is applied in terminal-failure functions, but constitutionally publishable internal failures can be intercepted and requeued instead. Those paths bypass terminal retry exhaustion.

### 7. Dual entitlement/accounting authorities
**Classification:** `DUPLICATE AUTHORITY` / `STALE LEGACY`
Transactional generation entitlement is `report_purchases`, while worker publication still contains secondary/legacy `profiles.report_credits` accounting. Two accounting models remain on the success path.

### 8. Bundle entitlement creation is structurally implemented
**Classification:** `CURRENT AUTHORITATIVE` for entitlement creation; launch status still requires later config/production proof
Checkout/webhook logic expands Bundle into approximately 2 Screening purchases plus 1 Underwriting purchase. Generation consumes the resulting individual Screening/Underwriting entitlements rather than a `bundle` job type.

### 9. Strict Full Underwriting intake gate matches current doctrine
**Classification:** `CONFIRMED CORRECT SUPPORTING LOGIC`
Current intake requires T12 + Rent Roll + at least one supporting document for Full Underwriting. This is distinct from downstream publication-survival doctrine and is not itself a defect.

### 10. Premium OFF is not fully isolated from ordinary publication
**Classification:** `PREMIUM FUTURE / MUST BE ISOLATED`
Premium job-start/certification machinery participates in normal jobs. A base/non-premium receipt can allow publication, but absent/invalid Premium receipt state can still surface as publication blocking. Dormant Premium machinery retains a veto surface over current products.

### 11. Broad PDF-stage failures are flattened to `PDF_ARTIFACT_FAILED`
**Classification:** `DEFECT`
Materially different root causes can converge on one generic error code across generator and worker artifact paths, degrading recovery policy and diagnosis.

### 12. PDF repair-plan nested authority contradiction
**Classification:** `DUPLICATE AUTHORITY` / `DEFECT` pending consumer cleanup
Nested/raw repair state can still say `hold_for_internal_repair` while the higher final PDF authority normalizes the same nonblocking condition to `publish_with_quality_incident`. Stale nested state remains serializable and can be misread by consumers.

### 13. â€œCore publish requiredâ€ and â€œartifact/customer delivery readyâ€ are conflated
**Classification:** `DEFECT`
Delivery-gate state can simultaneously say canonical core is deliverable/customer-delivery-allowed while representation is still required and not ready. The architecture needs distinct concepts for constitutional publish obligation, artifact readiness, and customer visibility.

### 14. Recoverable publication responses discard too much authoritative generator state
**Classification:** `DEFECT`
Recoverable Full Underwriting publication responses preserve only a narrow subset of state and requeue the whole job. They do not persist a clean resumable publication checkpoint containing the full canonical delivery/artifact identity needed for bounded recovery.

### 15. Worker claim itself has no retry ceiling
**Classification:** `DEFECT`
`claim_worker_job()` increments `worker_attempt_count` without enforcing the SQL max-attempt value. Thus a requeued job can be claimed indefinitely; the ceiling exists only in terminal-failure functions.

### 16. Multiple queue-yield/requeue implementations
**Classification:** `DUPLICATE AUTHORITY` / `REMOVE / CONSOLIDATE CANDIDATE`
At least `transition_worker_job(...â†’queued)`, `requeue_worker_job()`, governed requeue, and a direct timebox handoff implementation define what it means to yield/requeue a job.

### 17. Post-registration input metadata remains customer-mutable
**Classification:** `DEFECT` / security-integrity boundary
Modern transactional intake validates authoritative staged-file metadata, but older RLS still permits the authenticated job owner to UPDATE `analysis_job_files`. Validated pipeline input metadata therefore remains mutable after registration.

### 18. Initial staged Storage scoping is correctly private/user-bound
**Classification:** `CONFIRMED CORRECT SUPPORTING LOGIC`
Staged uploads are user-scoped and the transactional intake RPC re-validates object path/existence/size before consuming the entitlement.

### 19. Multiple document/support classification authorities exist
**Classification:** `DUPLICATE AUTHORITY` / consolidation candidate
Customer slot type, deterministic classifier, parser results, support taxonomy, support adjudicator, Acquisition Memo role reconciliation, and canonical source packaging overlap in assigning document roles. Core/support precedence requires one documented hierarchy.

### 20. Support documents do not override canonical core operating truth
**Classification:** `CONFIRMED CORRECT SUPPORTING LOGIC`
`source-truth-package.js` independently builds T12/Rent Roll core truth and treats support documents as separate authority/context; support defects are generally section-level rather than core-publish blockers.

### 21. Generator publication is not retry-idempotent after upload succeeds but reports insert fails
**Classification:** `DEFECT`
Full Underwriting uploads to a deterministic job-based path using `upsert:false`. If upload succeeds but reports-row creation fails, cleanup normally does not remove the object when a revision request key exists. Retry can then collide forever with the existing object while no report row exists.

### 22. Disclosure acknowledgement is enforced in UI, not in the authoritative generation transaction
**Classification:** `DEFECT` / authority-boundary gap
Dashboard requires acknowledgement before Generate, but `consume_purchase_and_create_job()` does not independently verify current acknowledgement as a transactional prerequisite.

### 23. Authenticated users retain direct `analysis_jobs` INSERT authority
**Classification:** `SECURITY / INTEGRITY DEFECT` / `DUPLICATE AUTHORITY`
Legacy RLS permits authenticated users to insert their own jobs directly, bypassing the intended atomic purchase-and-job-registration RPC.

### 24. Authenticated users retain direct `analysis_job_files` INSERT authority
**Classification:** `SECURITY / INTEGRITY DEFECT` / `DUPLICATE AUTHORITY`
Legacy RLS allows direct file-row creation outside the modern transactional Storage verification path, and UPDATE authority compounds the integrity weakness.

### 25. Purchase validation prevents a free report but can create queue-poison/stuck jobs
**Classification:** `DEFECT`
Worker checks for a consumed `report_purchases` binding. A directly injected purchase-less job is rejected, but the constitutional lifecycle can refuse terminal failure because source truth is absent, leaving an invalid job stuck rather than cleanly terminalized.

### 26. Core constitutional firewall has jurisdiction that is too broad
**Classification:** `DEFECT` / authority scope violation
Canonical source-truth publication protection is applied to pre-core failures such as missing purchase/job provenance. Job validity/entitlement failures need a separate pre-constitution terminal authority.

### 27. Legacy job INSERT policy does not constrain lifecycle status sufficiently
**Classification:** `SECURITY / INTEGRITY DEFECT`
The user-owned insert policy is based largely on `user_id = auth.uid()` and does not establish the modern transaction's provenance/initial-state invariants.

### 28. Report revision promotion RPC is `SECURITY DEFINER` without adequate ownership fencing visible in Batch 1
**Classification:** `SECURITY DEFECT` â€” high priority
`promote_report_revision_to_current()` trusts existence of a published job referencing the report and does not visibly enforce same-user report/job ownership. Batch 1 does not show explicit privilege lockdown sufficient to treat this RPC as safely exposed to all authenticated callers.

### 29. Revision promotion predicate is weaker than exact lineage authority
**Classification:** `DEFECT`
The DB predicate proves an associated published job references the report UUID, but does not visibly prove exact customer ownership and exact revision/job lineage in the predicate itself.

### 30. `reports.status = published` is not equivalent to â€œcustomer published/currentâ€
**Classification:** `DUPLICATE / AMBIGUOUS STATE AUTHORITY`
Report rows can be labelled published before the analysis job is published; customer visibility actually depends on `status = published` plus `is_current_revision = true`. Current-revision promotion is the stronger visibility authority.

### 31. Generated-report Storage download RLS cannot yet be fully certified from Batch 1
**Classification:** `AMBIGUOUS â€” NEEDS LATER DB/CONFIG PROOF`
Client-side signed URL generation depends on the `generated_reports` bucket policy. Batch 1 proves report-table ownership logic but does not contain enough authoritative bucket-policy evidence to certify the Storage boundary.

### 32. Entitlement restoration lineage is split across a DB RPC and a non-atomic worker event
**Classification:** `DEFECT`
The purchase can be safely restored/detached while the subsequent `entitlement_restored` event write fails. Later governed requeue may then be unable to recover the original purchase lineage even though the entitlement state itself is correct.

### 33. Governed terminal-job requeue is a strong recovery primitive
**Classification:** `CURRENT AUTHORITATIVE` / `CONFIRMED CORRECT SUPPORTING LOGIC`
`governed_requeue_worker_job()` verifies failed/dead-letter state, exact purchase lineage, product/owner compatibility, and avoids manufacturing credits/jobs. Preserve its governing intent while consolidating surrounding lifecycle paths.

### 34. Admin worker/recovery endpoint authentication is present
**Classification:** `CONFIRMED CORRECT SUPPORTING SECURITY LOGIC`
Batch 1 admin worker routes require Cron/admin key or the designated authenticated admin user as applicable; no anonymous worker-admin takeover was found in the inspected routes.

### 35. Parser endpoints are internal/admin protected
**Classification:** `CONFIRMED CORRECT SUPPORTING SECURITY LOGIC`
Parsing/classification/extraction endpoints require internal/admin authorization and use service-role access internally; ordinary customers cannot directly exercise the processing APIs.

### 36. Core parsing is deterministic-first and AI recovery is validated before acceptance
**Classification:** `CONFIRMED CORRECT SUPPORTING LOGIC` with later `lib/` helper audit required
T12/Rent Roll parsing attempts deterministic/structured recovery first, and AI-recovered core candidates are validated before acceptance. Exact AI helper internals live outside Batch 1 and must be audited in a later batch.

### 37. Required-slot misclassification has a deterministic rescue path
**Classification:** `CONFIRMED CORRECT SUPPORTING LOGIC`
Document content can rescue an incorrectly declared T12/Rent Roll slot, with artifacts recording declared/detected type and rescue stage.

### 38. `run-eligible-jobs-once` is source-confirmed as a claim-only endpoint
**Classification:** `REMOVE / CONSOLIDATE CANDIDATE`; production impact needs scheduler proof
It claims the next queued job into extracting and creates start receipt state, but does not then invoke the full worker. If used as an execution scheduler it can strand claims until another worker/lease recovery handles them.

### 39. Two competing eligible-job claim authorities exist
**Classification:** `DUPLICATE AUTHORITY`
SQL `claim_next_worker_job()` and the main worker's JS queue scan + `claim_worker_job(job.id)` both define job selection/claim behavior.

### 40. Core state-transition RPC is healthy, but recovery paths branch around it
**Classification:** `CONFIRMED CORRECT SUPPORTING LOGIC` for transition fencing; surrounding lifecycle remains duplicated
Normal state flow is queued â†’ extracting â†’ underwriting â†’ scoring â†’ rendering â†’ pdf_generating â†’ publishing â†’ published, with attempt/claim/lease fencing. Problems arise from alternate recovery/requeue implementations.

### 41. Worker timebox handoff is a separate lifecycle implementation
**Classification:** `DUPLICATE AUTHORITY` / `CONSOLIDATE CANDIDATE`
The 55-second worker timebox has its own queued handoff path instead of a single canonical lifecycle/requeue authority.

### 42. Governed-retry permission can become a permanent historical property of a job
**Classification:** `DEFECT`
Worker logic checks whether a job has ever received a `worker_admin_requeued` event. The permission is not visibly bound to one recovery episode/current attempt, so future attempts may inherit stale governed-retry behavior.

### 43. Admin control plane mixes modern governed actions with legacy browser-direct mutations
**Classification:** `STALE LEGACY` / `REMOVE OR REPLACE`
`AdminDashboard.jsx` still contains direct browser Supabase mutations for force-fail, report deletion, and purchase/credit adjustments alongside modern server-governed recovery APIs.

### 44. Legacy Admin Force Fail bypasses lifecycle/failure governance conceptually
**Classification:** `STALE LEGACY`
The direct status update does not preserve exact attempt fencing, failure taxonomy, constitutional jurisdiction, transactional restoration, failed-vs-dead-letter policy, or authoritative failure lineage.

### 45. Legacy Admin Delete Report bypasses revision lineage and artifact cleanup governance
**Classification:** `DEFECT` / `STALE LEGACY`
Direct row deletion does not visibly coordinate current revision, family lineage, job linkage, Storage object, quality manifest, or customer-history integrity.

### 46. Admin â€œstuck jobsâ€ metric uses stale lifecycle state
**Classification:** `STALE LEGACY`
Admin UI checks `status = in_progress`, while the current worker lifecycle uses extracting/underwriting/scoring/rendering/pdf_generating/publishing. Operational visibility is therefore stale.

### 47. Admin revenue assumptions are stale relative to current launch pricing
**Classification:** `STALE LEGACY` / non-authoritative reporting
Admin MTD revenue logic uses historical per-product amounts inconsistent with the current launch pricing doctrine.

### 48. Worker existing-report discovery uses heuristic identity instead of exact revision lineage
**Classification:** `DEFECT`
Worker looks up existing reports using same-user + property name + report type + creation-time heuristics rather than exact `revision_source_job_id` / `revision_request_key` identity.

### 49. Heuristic existing-report lookup can reuse the wrong same-user report revision
**Classification:** `DEFECT`
Repeated jobs for the same property/report type can create ambiguity even without cross-user leakage. Exact job â†’ exact report revision identity is not guaranteed by this lookup.

### 50. Generator-side exact revision idempotency is stronger than worker lookup
**Classification:** `CURRENT AUTHORITATIVE` / consolidation signal
Generator/report persistence uses `revision_request_key` and exact conflict reload behavior. The correct identity primitive already exists; the worker's weaker parallel discovery should not be a second authority.

## Batch 1 architecture thesis â€” provisional, not yet final
The repeated production failures increasingly trace to **authority accumulation** rather than a fundamentally broken canonical underwriting core. Newer authorities were layered on without fully retiring older ones: transactional intake beside direct RLS insertion; Full Underwriting on top of Acquisition Memo; Premium publication machinery around current products; generator publication beside worker publication; worker revision promotion beside DB promotion; governed recovery beside raw/manual mutations.

## Preserve-versus-consolidate direction â€” provisional only
**Likely preserve:** transactional `report_purchases` intake/job creation, user-scoped staged upload verification, lease/attempt fenced state-transition primitives, deterministic-first core parsing, canonical source truth, core publication constitution, exact revision request identity, post-publication DB current-revision promotion, governed terminal-job requeue intent.
**Likely consolidate/remove from live authority:** Acquisition Memo ownership of Full Underwriting, Premium veto surfaces for non-premium products, duplicate worker publication, worker pre-publication revision promotion, heuristic report lookup, duplicate requeue implementations, direct user/admin table mutation paths, legacy credits authority, contradictory gate fields.

**STOP CONDITION:** Do not convert this ledger into patches until Batch 1 and all necessary later batches/config/doctrine evidence are complete.

## Persisted findings 51â€“60

### 51. Internal constitutional evidence store is customer-writable
**Classification:** `SECURITY / INTEGRITY DEFECT` â€” high priority
RLS permits authenticated INSERT into `analysis_artifacts` when `user_id = auth.uid()`. The same table stores authoritative parser, source-truth, worker-event, QA, recovery, manifest, and delivery artifacts. Worker/generator consumers generally query by `job_id` + `type` and freshness without a trusted-producer/origin signature. A customer can therefore manufacture artifact types that the internal pipeline later treats as evidence.

### 52. `analysis_artifacts` INSERT policy does not prove ownership of the referenced job
**Classification:** `SECURITY / CROSS-JOB INTEGRITY DEFECT`
The artifact INSERT policy constrains `user_id`, not the ownership relationship between `analysis_artifacts.job_id` and `analysis_jobs.user_id`. The FK proves only that the job exists. A caller who knows another job UUID can therefore attempt to attach a self-owned artifact to another customer's job; service-role worker reads by job/type can then ingest it. Exact production table grants/RLS should still be verified later, but the committed policy contract is unsafe.

### 53. AI content-hash recovery cache is globally scoped and lacks trusted-producer provenance
**Classification:** `SECURITY / INTEGRITY DEFECT`
`loadCachedRecoveryPayload()` queries `analysis_artifacts` by parsed artifact type + `payload.source_content_sha256` + recovery kind, with no job/user/producer scope. Because customers can insert artifacts, a crafted parsed artifact for a known content hash can be selected as the newest recovery cache entry. This creates cache poisoning and potential cross-job/cross-user contamination when identical source content is reused.

### 54. Weaker permissive `analysis_job_files` policy defeats the stronger job-ownership policy
**Classification:** `SECURITY / CROSS-JOB INTEGRITY DEFECT`
Batch 1 defines both an INSERT policy that checks referenced-job ownership and a separate authenticated INSERT policy that checks only `analysis_job_files.user_id = auth.uid()`. PostgreSQL permissive policies combine with OR semantics, so the weaker policy provides an alternate path. A known foreign job UUID can therefore be targeted with a self-owned file row unless later DB policy state removes this path.

### 55. Customer-facing Dashboard exposes live direct report/Storage deletion
**Classification:** `DEFECT` / `STALE LEGACY`
Current report cards contain a customer `Delete` action that directly removes `generated_reports/{storage_path}` and then deletes the `reports` row. Reports RLS explicitly permits users to delete their own reports. This bypasses revision-family integrity, linked-job lineage, current-revision rules, manifest/incident retention, and coordinated artifact cleanup. This is a live customer path, distinct from the stale Admin delete path already recorded.

### 56. `PricingTiers.jsx` is orphaned historical commerce code
**Classification:** `STALE LEGACY` / `REMOVE CANDIDATE`
The component contains obsolete `$499 / $1,499` pricing and an old `supabase.functions.invoke('stripe-checkout')` commerce path. Mechanical import search found no consumer in the Batch 1 source tree. It is therefore historical/dead code rather than current pricing authority, but should be removed or archived to prevent future accidental reuse.

### 57. Current live pricing/product identifiers are internally aligned in Batch 1
**Classification:** `CURRENT AUTHORITATIVE` / `CONFIRMED CORRECT SUPPORTING LOGIC`
The routed `Pricing.jsx` presents Screening `$199`, Full Underwriting `$499`, Bundle `$699`; current Dashboard uses the same Bundle composition; current checkout normalizes only `screening`, `underwriting`, `bundle`; webhook expands those identifiers into Screening/Underwriting entitlements. This code-level product identifier chain is coherent.

### 58. Pricing-page availability and server checkout use separate environment-variable contracts
**Classification:** `AMBIGUOUS â€” NEEDS DEPLOYMENT CONFIG PROOF`
Client pricing availability checks `VITE_STRIPE_PRICE_ID_SCREENING`, `VITE_STRIPE_PRICE_ID_UNDERWRITING`, and `VITE_STRIPE_PRICE_ID_BUNDLE`, while server checkout uses `STRIPE_PRICE_SCREENING`, `STRIPE_PRICE_UNDERWRITING`, and `STRIPE_PRICE_BUNDLE`. This separation is legitimate if deployment config supplies both sets, but Batch 1 cannot prove that. Missing Vite variables can disable purchase buttons even when server Stripe config is valid.

### 59. Webhook entitlement idempotency relies on a uniqueness guarantee not visible in Batch 1 schema
**Classification:** `AMBIGUOUS â€” NEEDS LIVE DB/SCHEMA PROOF`; `DEFECT` if no uniqueness exists
Webhook records `stripe_events.id` first and handles duplicate deliveries by verifying/creating missing `report_purchases`. It also expects entitlement-row unique violations as a race recovery mechanism. Batch 1 does not show a unique constraint/index on `report_purchases.stripe_session_id`. Without one, concurrent duplicate webhook deliveries can both observe missing rows and insert duplicate entitlements. Verify the production schema before classifying closed.

### 60. `analysis_job_events` security boundary is not established in Batch 1 while governed recovery trusts it
**Classification:** `AMBIGUOUS â€” HIGH-RISK DB POLICY PROOF REQUIRED`
`analysis_job_events` participates in authoritative recovery lineage, including `entitlement_restored` purchase identification used by `governed_requeue_worker_job()`. Batch 1 does not contain RLS enablement/policies or explicit grant lockdown for this table. If normal Supabase client roles retain DML access, event spoofing could influence governed recovery. Production privileges/RLS must be proven before launch.

## Persisted findings 61â€“67

### 61. Legacy `claim_and_consume_job()` remains remotely executable by authenticated users without ownership fencing
**Classification:** `SECURITY DEFECT` â€” high priority / `STALE LEGACY`
Migration `20260216_0001_claim_and_consume_job.sql` creates a `SECURITY DEFINER` RPC, revokes PUBLIC, then explicitly grants EXECUTE to `authenticated`. The function updates any supplied queued job UUID to `extracting` and does not check `auth.uid()`, job ownership, purchase lineage, worker attempt fencing, or lease state. Current application code does not call it, but it remains an executable stale authority and can be used against any known queued job UUID.

### 62. Historical `ic` report type remains executable in core request/schema contracts
**Classification:** `STALE LEGACY` / `REMOVE OR ISOLATE CANDIDATE`
`analysis_jobs` still permits `report_type = 'ic'`; `resolveReportTypeAndTier()` accepts `ic`, assigns tier 3, and routes it to the same `v1_core` mode as Underwriting. Current checkout/entitlements do not sell an `ic` product, and `reports.report_type` permits only Screening/Underwriting. This stale product lane can therefore create contradictory downstream state and should not remain executable in the launch constitution.

### 63. `analysis_jobs.report_id` has no report foreign-key lineage in Batch 1 schema
**Classification:** `DEFECT` / integrity weakness
No Batch 1 migration/bootstrap constraint links `analysis_jobs.report_id` to `reports.id`. This permits dangling or arbitrary report UUID references at the database level, magnifies the risk from direct job insertion and customer report deletion, and weakens the revision-promotion ownership chain.

### 64. Migration history contains an unresolved placeholder migration
**Classification:** `STALE LEGACY` / migration-reproducibility defect
`20260213XXXXXX_queue_job_for_processing.sql` is explicitly a TODO placeholder containing no function body and instructing maintainers to fetch the function from Supabase. A later dated migration defines the function, so current production behavior can still be correct, but the committed migration history is not a clean self-contained constitutional record and should not be considered reproducible until normalized.

### 65. Worker H6 privileged lifecycle RPCs are correctly restricted to `service_role`
**Classification:** `CONFIRMED CORRECT SUPPORTING SECURITY LOGIC`
The H6 migration explicitly revokes PUBLIC execution and grants `service_role` only for claim, lease renewal, transition, terminal failure, requeue, and entitlement restoration functions. The later `CREATE OR REPLACE` of `transition_worker_job()` does not inherently create a second customer-facing lifecycle API because existing function privileges are preserved by PostgreSQL replacement semantics.

### 66. Staged Storage source objects are intentionally immutable through the customer policy surface
**Classification:** `CONFIRMED CORRECT SUPPORTING SECURITY LOGIC`
Committed staged-upload Storage policy grants authenticated INSERT only under `staged/{auth.uid()}/...`; Dashboard uploads with `upsert:false`. Batch 1 does not grant customer UPDATE/overwrite of those Storage objects. Thus the stronger source byte object is materially safer than the mutable `analysis_job_files` metadata row representing it.

### 67. Customer revision request endpoint is intentionally disabled in the current launch path
**Classification:** `CONFIRMED CORRECT SUPPORTING LOGIC`
`api/jobs/request-revision.js` authenticates the caller and then returns HTTP 403 stating regeneration is admin-controlled. Customer self-service revision generation is therefore not a hidden competing live authority in Batch 1.

## Persisted findings 68â€“75

### 68. Legacy `canonical-source-package.js` still claims â€œsingle source of truthâ€ but is no longer imported by the live pipeline
**Classification:** `STALE LEGACY` / `DUPLICATE AUTHORITY` / `REMOVE OR ARCHIVE CANDIDATE`
`api/_lib/canonical-source-package.js` explicitly declares itself the â€œSingle source of truth for all document role and authority decisions,â€ yet mechanical dependency tracing found no live importer in Batch 1. Current generation instead imports `buildCanonicalSourceTruthPackage()` from `source-truth-package.js`. Leaving an unused file that self-identifies as the canonical authority is dangerous architectural residue and creates a high risk of future accidental reuse.

### 69. Most institutional IC/scenario/due-diligence/scoring contract chains are disconnected from the current launch execution path
**Classification:** `PREMIUM FUTURE / MUST BE ISOLATED` plus several `REMOVE/ARCHIVE CANDIDATE` modules
The institutional investment-committee, scenario-engine, due-diligence, and scoring contract files form internally chained contract graphs but have no live entry from the current generator/worker path. The active launch generator directly uses `institutional-financial-intelligence.js`; Premium external generation uses underwriting/scenario input machinery; the broader IC â†’ scenario â†’ diligence â†’ scoring chain is not presently reached by the launch product. It should not be allowed to acquire launch publication authority accidentally. Exact future-product retention/removal should be decided only after later-batch doctrine/config review.

### 70. Customer-writable artifacts can pre-poison the immutable Premium job-start surface receipt and block a worker attempt
**Classification:** `SECURITY / AVAILABILITY DEFECT` â€” high priority
`resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt()` first loads `analysis_artifacts` rows of type `premium_acquisition_underwriting_v1_job_start_surface_receipt`. More than one row causes an immediate error; one invalid existing receipt is passed to canonical validation and also errors. Because Batch 1 RLS permits authenticated users to insert `analysis_artifacts` and does not prove ownership of the referenced job, a caller who can target a job UUID can manufacture one or multiple receipt rows before worker processing and force the workerâ€™s job-start receipt step to fail. This converts the artifact-RLS weakness into a direct queue/worker denial-of-service class.

### 71. Customer-writable `source_truth_package` artifacts can be mistaken for canonical constitutional evidence by the worker
**Classification:** `SECURITY / CONSTITUTIONAL-INTEGRITY DEFECT` â€” critical priority
`admin-run-worker.js` uses a generic `loadLatestArtifactPayload(jobId, type)` that selects the newest matching artifact solely by `job_id`, `type`, and `created_at`. Multiple worker branches accept a payload as canonical when `payload.source === 'canonical_source_truth_package'`. There is no trusted-producer signature/origin field enforced at read time. Since customers can insert artifact rows, a forged newer `source_truth_package` can influence constitutional terminal-firewall decisions, structured-source gate behavior, manifest reconstruction, and recovery classification. This is a stronger execution impact than the previously recorded cache-poisoning risk.

### 72. Quality-incident and diagnostics admin surfaces also ingest customer-writable artifact evidence
**Classification:** `SECURITY / OPERATIONAL-INTEGRITY DEFECT`
`admin-quality-incidents-handler.js` and `api/admin/queue-metrics.js` query `analysis_artifacts` as their evidence store and validate mainly artifact type plus payload `source`/shape. They do not have a database-backed trusted-producer guarantee. Consequently the customer-writable artifact policy can poison internal operational dashboards, quality-incident projections, diagnostic counts, blocker statistics, and apparent report-quality state even when publication itself is not changed.

### 73. Premium model design is internally explicit that disconnected Premium holds no launch authority, but the live worker still grants its receipt/enforcer machinery an operational veto
**Classification:** `PREMIUM FUTURE / MUST BE ISOLATED` / confirms earlier live-veto defect
`premium-acquisition-underwriting-v1-model.js` explicitly states disconnected Premium may not hold source, delivery, publication, worker, billing, or remedy authority. Nevertheless the current worker always resolves/persists the Premium job-start surface receipt and the external enforcer returns `publicationBlocked: true` when that receipt is invalid. Thus the intended Premium doctrine and actual worker jurisdiction are inconsistent: the model says Premium OFF/disconnected has no worker/publication authority, while missing/corrupted Premium receipt state can still stop ordinary publication.

### 74. Orphaned terminal-failure tier/section maps remain beside the current terminal-failure taxonomy
**Classification:** `STALE LEGACY` / `REMOVE OR CONSOLIDATE CANDIDATE`
`terminal-failure-tier-map.js` and `terminal-failure-section-state-map.js` are not imported by the Batch 1 launch execution path. The main worker instead imports `classifyTerminalFailureCode` from root `lib/terminal-failure-taxonomy.js`. The orphan maps still encode materially important concepts such as Tier 1/2/3 behavior, so keeping them executable-looking but unused creates another conflicting failure-doctrine surface. Their historical intent should be compared against the root taxonomy in a later batch, then either merged or removed.

### 75. Several institutional/Premium modules are mechanically orphaned even inside their own subsystem
**Classification:** `STALE LEGACY` or `PREMIUM FUTURE / ARCHIVE CANDIDATE` pending later doctrine review
Mechanical import tracing found no Batch 1 consumers for modules including `acquisition-memo-v2-final-assembly.js`, `institutional-scoring-completion-handoff-contract.js`, and `premium-acquisition-underwriting-v1-internal-certification.js`. These should not be treated as live launch authorities merely because they remain in `api/_lib`; their future value must be established before retention.

## Persisted findings 76â€“80

### 76. Customer-writable `document_text_extracted` artifacts can alter parser classification and parsed source outputs
**Classification:** `SECURITY / SOURCE-INTEGRITY DEFECT` â€” critical priority
`parse-doc.js` repeatedly loads the newest `document_text_extracted` artifact for a file by `job_id`, artifact type, and `payload.file_id`, then uses that text for required-slot rescue, support-document classification, and text-based parsing of PDF core/support documents. Because authenticated customers can insert `analysis_artifacts` and the read path does not verify a trusted producer, forged extracted-text artifacts can become parser inputs. For PDF documents this can affect detected document type and downstream parsed financial/support facts, eventually contaminating canonical source truth. The underlying staged Storage object is immutable, but the parser can be steered by a forged database artifact that purports to represent its extracted text.

### 77. Live Pricing/Terms copy still contains product-evolution drift
**Classification:** `STALE PRODUCT COPY` / launch cleanup required
The routed Pricing page describes the Screening Report as a â€œdocument-driven acquisition memorandum,â€ despite the current product doctrine separating Screening from the historical Acquisition Memo product. Current Terms also generically instruct customers to upload the correct â€œT12 + Rent Roll before generating,â€ while the authoritative Full Underwriting transaction additionally requires at least one supporting document. This does not cause the worker failure, but the customer contract/copy should match the launch intake constitution before release.

### 78. `report-contract-qa.js` retains active legacy artifact fallbacks when canonical acquisition state is absent
**Classification:** `DIAGNOSTIC ONLY â€” LEGACY COMPATIBILITY` / `REWRITE OR ISOLATE CANDIDATE`
The QA layer explicitly resolves acquisition values from a `legacy_artifact_fallback` when canonical acquisition state/values are unavailable. The file documents these as compatibility-only inputs and many resulting violations are nonblocking, which is materially safer than treating them as source truth. Nevertheless an active launch QA module still reads legacy acquisition artifacts, so the final repair architecture should ensure such fallbacks cannot regain delivery/publication authority and should remove them when canonical coverage is complete.

### 79. Public processing API routes are generally protected at the HTTP boundary
**Classification:** `CONFIRMED CORRECT SUPPORTING SECURITY LOGIC`
The live generator requires the admin/internal key; parser/extraction/classification routes require internal/admin authorization; worker/admin diagnostics require admin/Cron credentials as applicable; checkout endpoints require authenticated actor/ownership; customer revision generation is disabled; Stripe webhook verifies the raw-body Stripe signature. No anonymous HTTP route was found in Batch 1 that directly executes report generation or parser/worker processing. The more serious security defects are therefore database/RPC/RLS authority leaks rather than obvious unauthenticated HTTP endpoints.

### 80. Batch 1 has a finite, mechanically proven set of unresolved production imports that must be included in the next audit scope
**Classification:** `AUDIT DEPENDENCY â€” BATCH 2 REQUIRED`
Relative-import resolution across all Batch 1 JS/JSX found unresolved dependencies only in root `lib/`: `investoriqMasterPromptV71.js`, `terminal-failure-taxonomy.js`, `openai-error-classifier.js`, `email-resend.js`, `textractClient.js`, `textractTablesToMatrix.js`, `ai-rent-roll-recovery.js`, `ai-support-doc-recovery.js`, and `ai-t12-recovery.js`. These files materially govern AI recovery, extraction, terminal failure policy, customer failure messaging, email delivery, and report prompt behavior, so Batch 1 cannot be declared globally sufficient without auditing them in the next sanitized batch.

## Persisted findings 81â€“82

### 81. The canonical report identity authority itself still defines Full Underwriting as the `acquisition_memo` family
**Classification:** `ACQUISITION HISTORICAL` embedded in `CURRENT AUTHORITATIVE` identity logic / must be corrected during architectural consolidation
`report-identity-authority.js` defines the Underwriting identity with `reportFamily: "acquisition_memo"`, `reportMode: "v1_core"`, and accepts `acquisition` / `acquisition_memo` report-type aliases plus visible titles â€œAcquisition Memoâ€ and â€œAcquisition Memorandum.â€ This confirms stale Acquisition Memo identity is not limited to renderer/file names: it is encoded in the module explicitly claiming canonical report identity authority. Current Full Underwriting needs its own canonical family/identity rather than inheriting historical Acquisition identity.

### 82. Revision UI helper can label a merely published, non-current revision as â€œcurrentâ€ when no DB-current row exists
**Classification:** `DEFECT` / customer-state authority ambiguity
`selectCurrentPublishedReportRevision()` first seeks `status='published' && is_current_revision=true`, but falls back to any published revision when none is current. `resolveReportSurfaceState()` uses that fallback as `currentPublishedReport`, and `getReportRevisionDisplayState()` treats matching that selected row as current even if its DB `is_current_revision` flag is false. The final `isDownloadable` flag remains correctly fenced by `isCurrentPublishedReportRevision(report)`, so this does not by itself authorize a download, but UI/customer status can mislabel an unpromoted published row as the current published revision. Database `is_current_revision` should remain the only current-revision authority.

## Persisted findings 83â€“85

### 83. Static entrypoint reachability proves a substantial orphaned API `_lib` subsystem remains in the production source tree
**Classification:** `STALE LEGACY` / `PREMIUM FUTURE` / `REMOVE OR ARCHIVE CANDIDATE` by module
A mechanical ES-module reachability pass starting from every Batch 1 API route found 24 `api/_lib` modules with no path from any production API entrypoint. The unreachable set includes the entire institutional IC/scenario/due-diligence/scoring chain, `canonical-source-package.js`, `acquisition-memo-v2-final-assembly.js`, `premium-acquisition-underwriting-v1-internal-certification.js`, `report-surface-render-helpers.js`, and both terminal-failure tier/section maps. These files cannot currently explain RETEST execution directly, but their presence materially increases authority ambiguity and future regression risk. They require explicit retain/archive/remove classification in the final repair plan.

### 84. Customers can SELECT their own internal `analysis_artifacts`, not only insert them
**Classification:** `SECURITY / INFORMATION-BOUNDARY DEFECT`
The committed RLS policy `analysis_artifacts_select_own` permits authenticated users to read every artifact row whose `user_id = auth.uid()`. The table contains parser diagnostics, source-truth packages, QA/action plans, worker events, Premium receipts, repair/certification state, and other records labeled internally as `bucket='internal'` or `bucket='system'`. Even after write authority is removed, customer read access should be reviewed because internal diagnostic/contracts are not the same product surface as customer reports and can expose implementation details or sensitive operational metadata unnecessarily.

### 85. `report-surface-render-helpers.js` is a dead duplicate rendering helper module
**Classification:** `STALE LEGACY` / `REMOVE OR CONSOLIDATE CANDIDATE`
Mechanical import tracing found no production consumer for `api/_lib/report-surface-render-helpers.js`, despite it containing report rendering helpers and importing live Full Underwriting state/contract logic. Rendering helpers with no executable owner should not remain adjacent to live renderer modules because they create another apparent surface authority and maintenance target.

## Persisted findings 92â€“95

### 92. A substantial dead customer-side legacy surface remains outside the routed application
**Classification:** `STALE LEGACY` / `REMOVE OR ARCHIVE CANDIDATE`
Static reachability from `src/main.jsx` shows multiple source files are not reachable from the current React router/component graph, including `PricingTiers.jsx`, `UploadModal.jsx`, `PDFPreviewModal.jsx`, `CheckoutSuccess.jsx`, `ReportHistory.jsx`, `SampleReport.jsx`, `generatePDF.js`, `pdfSections.js`, `sampleReportPages.js`, and several old presentation/components. In particular, the client-side PDF generation stack (`generatePDF.js` + `pdfSections.js`) is no longer the launch publication authority and should not remain adjacent to the server DocRaptor pipeline without an explicit archival reason. These files cannot directly explain current production worker failures but materially increase product/pipeline ambiguity and accidental-regression risk.

### 93. Duplicate/dead report template and sample-data artifacts remain in the live API tree
**Classification:** `STALE LEGACY` / `REMOVE OR ARCHIVE CANDIDATE`
The active generator reads `api/report-template-runtime.html`. Batch 1 also contains `api/report-template.html`, but no production code references it. Likewise `api/data/riverbend_dataset.json` is not imported by the Batch 1 execution graph. Keeping alternate production-looking templates and sample underwriting datasets inside the live API source tree creates another false-authority surface and should be explicitly archived/removed after later doctrine/test review confirms they are not needed.

### 94. The committed database security constitution is incomplete for `report_purchases` and `analysis_job_events`
**Classification:** `AMBIGUOUS â€” NEEDS DB/PRODUCTION PROOF` / migration-reproducibility defect
Batch 1's bootstrap defines both `report_purchases` and `analysis_job_events`, but the committed migrations explicitly enable RLS only for `analysis_jobs`, `analysis_job_files`, `analysis_artifacts`, `reports`, and `disclosure_session_ack_events`. No Batch 1 migration enables RLS or creates the complete current SELECT/INSERT policy set for `report_purchases` or `analysis_job_events`. A cleanup migration does drop a historical broad owner-UPDATE policy on `report_purchases`, proving policy state existed historically outside the self-contained migration chain, but the surviving authoritative policy state is not reconstructible from Batch 1. Because Dashboard reads `report_purchases` directly and governed recovery reads `analysis_job_events`, exact production grants/RLS must be proven with read-only DB inspection before launch. Supabase's own security guidance states that exposed Data API tables without RLS can be accessed by roles that have matching grants, so this omission cannot be treated as harmless merely because the application intends ownership filtering.

### 95. `analysis_job_events` is a trusted entitlement-recovery lineage store without committed row-security proof
**Classification:** `SECURITY / RECOVERY-INTEGRITY RISK â€” NEEDS PRODUCTION PRIVILEGE PROOF`
`governed_requeue_worker_job()` treats `analysis_job_events.event_type = 'entitlement_restored'` and its `meta.purchase_id` as authoritative lineage when reattaching a restored purchase. The worker also writes lifecycle events into this table. Yet Batch 1 contains no RLS enablement/policies or explicit role revocation for `analysis_job_events`. If the project's exposed-schema table grants permit authenticated INSERT, a caller could forge entitlement-restoration lineage that the `SECURITY DEFINER` governed-requeue RPC later trusts. The committed source is insufficient to prove exploitability because current table grants are not included, so this remains a high-priority production DB proof item rather than a claimed confirmed exploit.

# BATCH 1 CLOSURE â€” 2026-08-17

## Batch 1 verdict
**BATCH 1 SOURCE AUDIT: COMPLETE WITH EXTERNAL DEPENDENCIES IDENTIFIED.**

This is **not** a production PASS and **not** a full-repository audit completion. It means the uploaded Batch 1 scope (`api/`, `src/`, `supabase/`) has been inventoried, mechanically dependency-mapped, and audited deeply enough to establish the active launch authority chain, duplicate/stale authorities, material defects, security/integrity risks, and the exact evidence that cannot be resolved from this batch alone.

**Persisted findings at Batch 1 closure: 95.**

## Batch 1 principal architectural conclusion
The dominant launch-stabilization problem is **authority accumulation** rather than a single malformed RETEST branch. InvestorIQ contains multiple generations of intake, product, lifecycle, publication, revision, recovery, admin, and evidence authorities that overlap or contradict one another. The core deterministic parsing/source-truth/publication-constitution foundation is materially stronger than the surrounding orchestration and persistence layers.

## Batch 1 preserve candidates
- Transactional `consume_purchase_and_create_job()` staged-object validation and entitlement consumption intent.
- Immutable user-scoped staged Storage object path authority.
- H6 worker attempt/lease-fenced claim/transition primitives.
- Deterministic-first parser acceptance boundary with validation before AI recovery acceptance.
- `source-truth-package.js` as the intended canonical source-truth constructor, after trusted-producer evidence is fixed.
- Core-Gated Publish-or-Collapse constitution.
- Exact `revision_request_key` revision identity/idempotency pattern.
- Database post-`published` revision promotion concept.
- Governed terminal-job requeue concept, after recovery lineage is made fully trustworthy/atomic.

## Batch 1 consolidation/removal candidates
- Acquisition Memo ownership/identity of current Full Underwriting.
- Premium receipt/enforcement vetoes on non-Premium launch jobs.
- Generator publication plus worker second publication/certification authority.
- Worker pre-publication revision promotion.
- Heuristic existing-report lookup in worker.
- Multiple queue/requeue/yield implementations.
- Legacy `profiles.report_credits` publication accounting.
- Customer/admin direct table mutation paths that bypass governed transactions.
- Customer-writable internal evidence/artifact store.
- Stale `claim_and_consume_job()` RPC.
- Historical `ic` product lane.
- Orphaned institutional/Premium/terminal-failure modules after later doctrine review.
- Dead customer-side PDF/report-history/checkout/sample components and duplicate report template/data fixtures where no later dependency requires them.

## Required evidence outside Batch 1 before any repair plan is final
1. Root `lib/` implementations imported by production Batch 1 code:
   - `investoriqMasterPromptV71.js`
   - `terminal-failure-taxonomy.js`
   - `openai-error-classifier.js`
   - `email-resend.js`
   - `textractClient.js`
   - `textractTablesToMatrix.js`
   - `ai-rent-roll-recovery.js`
   - `ai-support-doc-recovery.js`
   - `ai-t12-recovery.js`
2. Runtime/scheduler configuration:
   - `vercel.json`
   - `server.js`
   - `package.json`
   - `package-lock.json`
   - `.github/` workflows relevant to worker execution/manual fallback
   - `vite.config.js`
3. Exact production DB grants/RLS/policies for at minimum:
   - `report_purchases`
   - `analysis_job_events`
   - `analysis_artifacts`
   - `analysis_job_files`
   - `analysis_jobs`
   - `reports`
   - `generated_reports` Storage bucket/object policies
   - relevant `SECURITY DEFINER` function EXECUTE privileges
4. Stripe production payment-method/config proof for delayed payment behavior and fulfillment assumptions.
5. Later scripts/tests audit only after production architecture truth is complete; tests retain zero constitutional authority until then.
6. Current Markdown doctrine/roadmap/checklist reconciliation after executable architecture has been fully audited.

## Patch prohibition remains active
No source repair should begin yet. Batch 2 and subsequent necessary batches must be audited and appended to this ledger first. Only after the repository/config/doctrine evidence base is complete should a single architectural repair plan be formed and implemented.

# BATCH 2 AUDIT â€” RUNTIME / CONFIG / ROOT LIB â€” 2026-08-17

Batch 2 scope received and inventoried: root `lib/`, `.github/workflows/worker-kick.yml`, `package.json`, `package-lock.json`, `server.js`, `vercel.json`, and `vite.config.js`. This batch is being audited read-only against the Batch 1 authority ledger. No repair work has begun.

## Persisted findings 96â€“103

### 96. GitHub worker workflow actively strands the first claimed queued job for the full worker lease window
**Classification:** `DEFECT â€” ACTIVE MANUAL FALLBACK ORCHESTRATION` / `DUPLICATE CLAIM AUTHORITY`
`.github/workflows/worker-kick.yml` calls `/api/admin/run-eligible-jobs-once` first and `/api/admin-run-worker` second. The first endpoint calls `claim_next_worker_job(p_claimed_by='admin-run-eligible-jobs-once')`, moving the oldest queued job into `extracting` with a 30-minute lease owned by that literal claimant. The subsequent `admin-run-worker` invocation creates a different `workerInvocationId`; its extracting-stage query explicitly requires `worker_claimed_by = workerInvocationId`. Therefore the job preclaimed by `run-eligible-jobs-once` is invisible to the real worker and cannot be continued by that invocation. The worker then scans the remaining queued jobs and may process a later job, leaving the oldest preclaimed job stranded in `extracting` until lease recovery. This is a direct, source-proven orchestration defect and validates the earlier Batch 1 warning about the claim-only endpoint.

### 97. The GitHub workflow's automatic schedule is disabled; it is currently a manual emergency fallback by source
**Classification:** `CONFIRMED CURRENT CONFIGURATION` / production scheduler authority still requires separate proof
`worker-kick.yml` has its `schedule:` block commented out and retains only `workflow_dispatch`. The comment states automatic scheduling is paused and the workflow is retained as a manual emergency fallback. Therefore GitHub Actions is not, from committed source, the current automatic worker scheduler. This is consistent with the project doctrine that GitHub worker execution is a manual fallback. The exact current automatic scheduler (historically Supabase Cron) remains outside Batch 2 and still needs production/config proof.

### 98. Root terminal-failure taxonomy and API terminal-failure tier map contradict each other for source-truth construction failure
**Classification:** `DUPLICATE AUTHORITY / DEFECT â€” FAILURE TAXONOMY`
`lib/terminal-failure-taxonomy.js` classifies `SOURCE_TRUTH_PACKAGE_CONSTRUCTION_FAILED` as `internal_system_failure`, with `customer_document_replacement_required=false` and `retry_safe=true`. But `api/_lib/terminal-failure-tier-map.js` assigns the same code a Tier 1 customer message category of `customer_document_replacement_required`. These two supposedly authoritative maps disagree on whether the failure is InvestorIQ's internal fault or a customer-document problem. Customer messaging, entitlement remedy, and retry policy cannot safely depend on two conflicting taxonomies.

### 99. The root terminal-failure taxonomy recognizes only eight terminal codes while the worker proposes additional lifecycle failures such as `PURCHASE_NOT_CONSUMED`
**Classification:** `DEFECT â€” INCOMPLETE FAILURE TAXONOMY`
`lib/terminal-failure-taxonomy.js` enumerates only eight codes: three catastrophic core failures plus source-truth construction, report render/contract, PDF artifact, and storage publication failures. The worker also proposes terminal/lifecycle conditions such as `PURCHASE_NOT_CONSUMED`. Any unlisted code is normalized to `unclassified_internal_failure`, `retry_safe=false`. Because these unclassified codes still pass through the constitutional terminal firewall, job-integrity failures are being forced through a taxonomy designed mainly around report publication. This reinforces Batch 1 finding 26: job validity/entitlement failures and report-core publication failures need separate authoritative domains.

### 100. `INVESTORIQ_MASTER_PROMPT_V71` is imported and logged as "applied" but is not actually used to generate report content in the current generator
**Classification:** `STALE LEGACY / FALSE AUDIT TELEMETRY`
`generate-client-report-impl.js` constructs `promptInstructions = [INVESTORIQ_MASTER_PROMPT_V71, ...body.instructions]` and writes a `worker_event` artifact claiming `prompt_version_applied` with version `v7.1`. Mechanical use tracing shows `promptInstructions` is never consumed afterward. Therefore the system records that the master prompt was applied even though the current generator path does not send or otherwise execute that prompt. This is false provenance/audit telemetry and another example of historical AI architecture surviving beside the deterministic report pipeline.

### 101. The v7.1 master prompt itself contains stale product doctrine and should not be treated as current Full Underwriting authority
**Classification:** `STALE LEGACY`
The prompt describes mandatory Full Underwriting inputs as only Rent Roll + T12, whereas current transactional Full Underwriting intake requires T12 + Rent Roll + at least one supporting document. It also defines a rigid ten-section output and a degraded-analysis recommendation policy inherited from an earlier institutional analyst design. Since finding 100 proves the prompt is not actually consumed by the current generator, this currently manifests as stale/false authority rather than direct report-generation control. It should not be revived during repair without explicit doctrine reconciliation.

### 102. AI T12 and Rent Roll recovery implementations are materially better fenced than the artifact store that feeds them
**Classification:** `CONFIRMED CORRECT SUPPORTING LOGIC`, dependent on trusted input provenance repair
`ai-t12-recovery.js` and `ai-rent-roll-recovery.js` are feature-flagged, require an API key, use deterministic temperature 0, strict JSON-schema output on the OpenAI Responses API, enforce confidence thresholds, validate numeric ranges/consistency, require evidence for supported fields, and return null rather than accepting malformed or low-confidence candidates. They do not directly persist canonical truth. This supports the Batch 1 conclusion that the AI recovery acceptance layer is not the primary source of constitutional corruption. However, their correctness still depends on the extracted text/tables being trusted; Batch 1 already proved the `analysis_artifacts` provenance boundary is customer-writable.

### 103. AI support-document recovery performs explicit source-span/evidence matching before accepting recovered facts
**Classification:** `CONFIRMED CORRECT SUPPORTING LOGIC`, dependent on trusted input provenance repair
`ai-support-doc-recovery.js` validates candidate evidence excerpts against normalized source text, checks numeric candidates against evidence spans, enforces confidence/range rules, and returns evidence-checked payloads for acquisition assumptions, mortgage, renovation, property tax, appraisal, and related support facts. The implementation is designed as bounded extraction/recovery rather than free-form analysis. This strengthens the preserve-candidate case for the validation logic itself while separating it from the stale Acquisition naming and the unsafe artifact-store provenance around its inputs/outputs.

## Persisted findings 104â€“109

### 104. No automatic worker schedule exists in the audited repository configuration
**Classification:** `AMBIGUOUS â€” PRODUCTION SCHEDULER MUST BE PROVEN OUTSIDE REPO`
The GitHub worker schedule is commented out and `vercel.json` contains no `crons` configuration. Therefore neither GitHub Actions nor Vercel Cron is the automatic scheduler in the audited committed runtime configuration. If production is being driven by Supabase Cron as intended historically, that schedule is an external database/platform object and must be included in the read-only production proof batch. The repository alone cannot reconstruct the current automatic invocation cadence or endpoint.

### 105. `qa:launch-core` still makes Premium QA mandatory even though Premium is OFF
**Classification:** `STALE QA GOVERNANCE / NON-AUTHORITATIVE TEST CONFIGURATION`
`package.json` defines `qa:launch-core` to execute `qa:premium-underwriting` as a mandatory step, and also executes large institutional financial-intelligence suites whose corresponding runtime modules include unreachable/orphaned architecture from Batch 1. This does not make Premium live in production, but it means the nominal launch QA command structurally pressures developers to preserve and satisfy future/stale Premium architecture. This directly supports the audit rule that smoke/tests have zero constitutional authority until the executable architecture is simplified and tests are later reclassified.

### 106. Vite config contains a latent environment-secret exposure footgun by defining the entire `process.env` object into client builds
**Classification:** `SECURITY CONFIGURATION DEFECT / LATENT HIGH-SEVERITY RISK`
`vite.config.js` contains `define: { 'process.env': process.env }`. Vite's documented `define` behavior statically replaces defined globals during build and automatically JSON-serializes object values; Vite's normal security model intentionally exposes only `VITE_`-prefixed variables to client code. Replacing the whole `process.env` object bypasses that safety boundary for any reachable client code that references `process.env`. In the current Batch 1 routed client graph, the only discovered `src/` references to `process.env` are in the dead/unreachable legacy `generatePDF.js`, so this audit does **not** claim that production secrets are currently present in the live bundle. It is nevertheless an unacceptable latent configuration because a future/client import using `process.env` could serialize server build-time environment values into browser JavaScript. A later built-artifact scan should verify no secret values have actually been emitted.

### 107. `server.js` is a stale partial local server, not the production API authority
**Classification:** `STALE LEGACY / REMOVE OR EXPLICITLY MARK LOCAL-ONLY`
`server.js` mounts only the generator, checkout, and local webhook routes; it omits the current worker, parser, legal acknowledgement, revision, admin/quality, and other serverless API routes. It explicitly disables its webhook in production, and `package.json` defines no `start` script that makes this Express server the deployment entrypoint. Vercel instead deploys root `api/` functions. Therefore this file is a historical/local convenience server and should not remain described as "Local + Production API server" because that label falsely suggests architectural authority it no longer has.

### 108. `lib/email-ses.js` is dead and currently non-runnable provider residue
**Classification:** `STALE LEGACY / DELETE OR ARCHIVE CANDIDATE`
No Batch 1 or Batch 2 production module imports `email-ses.js`; the live worker uses `email-resend.js`. Additionally, `email-ses.js` imports `@aws-sdk/client-ses`, but that package is not declared in `package.json` or `package-lock.json`. The file is therefore not merely unused but would fail dependency resolution if accidentally activated. It should not remain beside the live Resend provider as an apparent alternative email authority.

### 109. Current report-ready email delivery is a nonblocking side effect, not a publication authority
**Classification:** `CONFIRMED CORRECT SUPPORTING LOGIC`
The live worker uses `sendEmailResend()` only after the report publication flow and catches/logs failures to send the `report_published` email rather than rolling back report publication. This is the correct authority relationship: customer email notification may fail without invalidating a successfully persisted/customer-visible report. The Resend helper itself validates required environment/config fields and surfaces provider failures to the caller.


## Persisted findings 110â€“115

### 110. GitHub manual worker fallback can report success on HTTP 4xx/5xx responses
**Classification:** `DEFECT â€” FALSE OPERATIONAL PROOF / RECOVERY OBSERVABILITY`
`.github/workflows/worker-kick.yml` invokes both production endpoints with `curl -sS` only. It does not use `--fail` / `--fail-with-body`, capture the HTTP status, validate a response field, or otherwise make a non-2xx application response fail the GitHub step. Therefore a workflow run can appear green even when either `run-eligible-jobs-once` or `admin-run-worker` returns an HTTP error. Combined with finding 96, the manual fallback can both strand the first claimed job and still present misleading success evidence. GitHub workflow success must not be treated as worker-success proof until the HTTP/application outcome is explicitly asserted.

### 111. Production Node.js runtime is not pinned in repository source
**Classification:** `AMBIGUOUS RUNTIME AUTHORITY / REPRODUCIBILITY GAP`
`package.json` contains no `engines.node`, and `vercel.json` does not specify a Node runtime version. Vercel allows the project-selected Node major to be overridden by `package.json#engines.node`; because InvestorIQ does not do so, the exact production Node major depends on Vercel project/runtime configuration outside the audited repository. This is not evidence of a current runtime failure, but it means the repository alone cannot reproduce/certify the exact server runtime used in production. Later production-config proof should record the selected Node major before launch stabilization.

### 112. `vercel.json` contains overlapping function-duration patterns whose effective precedence must be deployment-verified
**Classification:** `AMBIGUOUS RUNTIME CONFIGURATION â€” PRODUCTION PROOF REQUIRED`
`vercel.json` assigns `api/admin-run-worker.js` a `maxDuration` of 300 seconds and also assigns the broader `api/**/*.js` pattern a `maxDuration` of 60 seconds. The worker matches both patterns. Vercel documentation explicitly notes that file-pattern order matters for function-duration configuration, but Batch 2 source alone does not prove the effective deployed duration for this overlapping configuration or whether project Fluid Compute/runtime settings alter the permitted maximum. The worker currently has an internal ~55-second timebox, reducing immediate exposure, but the exact deployed timeout should be read from production deployment/function settings rather than assumed from this file.

### 113. AI recovery production behavior is partially controlled by deployment-only environment flags
**Classification:** `AMBIGUOUS PRODUCTION CONFIGURATION / LATER PROOF REQUIRED`
The three AI recovery implementations are gated by `ENABLE_AI_T12_RECOVERY`, `ENABLE_AI_RENT_ROLL_RECOVERY`, and `ENABLE_AI_SUPPORT_DOC_RECOVERY`; model names and timeout values are also environment-overridable. Source code therefore proves the recovery logic and safe acceptance behavior, but cannot prove whether each AI fallback is currently enabled in production or which model/timeout override is active. The audit should later verify only the relevant configuration names/states through a safe production configuration surface; secrets themselves must never be requested or copied into the audit.

### 114. AI recovery intentionally truncates source context and therefore cannot be treated as complete-document authority
**Classification:** `DIAGNOSTIC LIMITATION â€” ACCEPTABLE ONLY AS BOUNDED RECOVERY`
`ai-t12-recovery.js` clamps extracted text to the first 12,000 characters. `ai-rent-roll-recovery.js` clamps text to 12,000 characters and rendered table context to 18,000 characters, with at most 80 rows and 16 columns per rendered table slice. `ai-support-doc-recovery.js` clamps text to 16,000 characters. These limits are reasonable safeguards for a fallback extractor, but they mean the AI layer can miss relevant facts located later in large documents. This reinforces the correct architecture: deterministic extraction/canonical evidence must remain primary, and AI recovery must remain bounded/non-authoritative rather than becoming a whole-document truth engine.

### 115. Batch 2 source/config files are syntactically valid; live Textract dependency is declared while dead SES dependency is not
**Classification:** `AUDIT CLOSURE EVIDENCE`
A mechanical `node --check` pass succeeded for every Batch 2 JavaScript source/config file. Dependency inspection confirmed `@aws-sdk/client-textract` is declared in both `package.json` and `package-lock.json`, matching the live Textract helpers. `@aws-sdk/client-ses` is absent from both, confirming finding 108 that the unimported SES helper is dead/non-runnable residue rather than a live provider path. This finding does not certify behavior; it closes syntax/dependency ambiguity for the audited Batch 2 files.


### 116. Combined Batch 1 + Batch 2 production source graph has no unresolved relative imports
**Classification:** `BATCH 2 CLOSURE EVIDENCE`
A mechanical module-resolution pass across the combined audited tree (`api/`, `src/`, `supabase/`, root `lib/`, `.github/`, and audited root runtime/config files) resolved all 259 relative JavaScript/JSX/TS-style imports with zero unresolved local modules. This closes the Batch 1 unresolved-import dependency list: the previously missing AI recovery, failure-taxonomy, email, and Textract modules are now present and mapped. Remaining audit gaps are no longer hidden relative imports in the live Batch 1/2 execution tree; they are later-scope operational scripts/tests/docs and external production configuration/state.

# BATCH 2 CLOSURE â€” 2026-08-17

**Audit status:** `CLOSED AS A SOURCE/RUNTIME-CONFIG AUDIT SCOPE â€” NOT A PASS, NOT FIXED, NOT LAUNCH-READY`

Batch 2 audited the root runtime/config and previously unresolved production dependencies supplied in `INVESTORIQ_AUDIT_BATCH_2_RUNTIME_CONFIG.zip`:
- root `lib/` recovery/extraction/failure/email helpers,
- `.github/workflows/worker-kick.yml`,
- `package.json` / `package-lock.json`,
- `server.js`,
- `vercel.json`,
- `vite.config.js`.

Batch 2 resolved the remaining production imports from Batch 1 and added findings 96â€“116. Major conclusions include:
1. the GitHub manual fallback performs a claim-first call followed by a differently owned worker call, creating a stranded-first-job defect;
2. the same workflow can appear green on HTTP application failures because it does not fail on non-2xx status;
3. automatic scheduling is not present in GitHub or `vercel.json`, so the true production scheduler must be proven externally;
4. root/API failure taxonomies conflict and are incomplete for job-integrity failures;
5. the v7.1 master prompt is stale and falsely logged as applied despite not governing the current generator;
6. AI T12/Rent Roll/support recovery validation is a preserve candidate, but remains dependent on trusted artifact provenance and environment-controlled enablement;
7. Premium QA remains embedded in the nominal launch QA command despite Premium being OFF;
8. Vite's whole-`process.env` define is a latent client-secret exposure configuration and requires later built-output verification/removal;
9. current Vercel runtime version/effective function timeout/scheduler state are not fully reproducible from repository source alone;
10. combined Batch 1 + 2 relative-module resolution is complete (259/259 resolved).

**No production source was modified during Batch 2. No RETEST was started. No repair prompt was issued.**

## Remaining evidence domains after Batch 2
The next audit scopes should cover, in order:
1. `scripts/` and `tests/` â€” classify operational/admin scripts and every smoke/regression/e2e test against the now-mapped production constitution; identify scripts that can mutate production or encode stale authority.
2. Authoritative current root Markdown doctrine/roadmap/launch-checklist documents â€” reconcile documented product doctrine against the actual source findings without letting old docs override live code truth.
3. External production proof â€” Supabase Cron schedule, current production DB RLS/grants/function EXECUTE state, generated_reports Storage policies, safe environment feature-flag/runtime state, Vercel effective runtime/function settings, and Stripe payment-method/webhook configuration. Do not request secrets.

Repair architecture remains explicitly blocked until these audit scopes are documented.

# BATCH 3 AUDIT â€” SCRIPTS / TESTS â€” 2026-08-17 (IN PROGRESS)

### 117. Batch 3 inventory is test-heavy; operational script surface is tiny
**Classification:** `BATCH 3 INVENTORY`
`INVESTORIQ_AUDIT_BATCH_3_SCRIPTS_TESTS.zip` contains 233 entries: 231 under `tests/` and only 2 under `scripts/`. The source-like test inventory includes 177 QA JavaScript smoke/regression files and 5 E2E JavaScript files; the remainder is fixtures/results/data including PDFs, CSVs, JSON, XLSX, TXT, and one E2E README. The two scripts are `scripts/generate-sample-pdf.js` and `scripts/generateCharts.js`. This means Batch 3 is principally an audit of regression doctrine, not an operational/admin-script control plane.

### 118. The E2E worker lifecycle simulator encodes the obsolete dual-core hard-failure constitution
**Classification:** `REWRITE â€” STALE ARCHITECTURE/DOCTRINE`
`tests/e2e/worker-state-scenarios.js` requires both parsed T12 and Rent Roll artifacts. If either is absent it directly calls a helper that sets the job to `failed`, restores entitlement, and emits `MISSING_REQUIRED_DOCUMENTS`. Its `happy-underwriting` scenario likewise supplies only T12 + Rent Roll and does not model the current Full Underwriting intake support-document requirement. This simulator therefore conflates intake requirements with downstream survival and contradicts the current Core-Gated Publish-or-Collapse doctrine established from production code. It must not be treated as constitutional evidence and should be rewritten around the eventual single authoritative lifecycle.

### 119. The top-level E2E runner is dominated by source-string assertions and stale branch-level expectations
**Classification:** `DIAGNOSTIC ONLY / REWRITE`
`tests/e2e/run-e2e.js` performs extensive `readFileSync()`/regex/`includes()` checks against production source text and contains Wave 1 assertions such as â€œmissing rent roll fails closedâ€ and â€œmissing T12 fails closed.â€ These checks can pass because a string/branch exists while the actual end-to-end authority chain remains contradictory, exactly matching the historical failure mode that motivated this audit. Source-text tests may remain useful as diagnostics for selected invariants but cannot govern architecture or launch certification.

### 120. Premium has a large active QA footprint despite Premium being OFF
**Classification:** `PREMIUM FUTURE / REMOVE FROM CURRENT LAUNCH GATE`
There are 13 QA files whose filenames are explicitly Premium-specific, and at least 15 QA files that reference `PREMIUM_ACQUISITION_UNDERWRITING_V1` machinery. These tests exercise Premium assignment, model, rendering, certification, worker generation, PDF composition, job-start receipts, and related behavior. Because Premium is a future product and must not govern current Screening/Full Underwriting publication, these tests must be isolated into a future-product suite and removed from any current launch-critical aggregate command. They are not evidence that current Full Underwriting is correct.

### 121. Acquisition Memo regression doctrine is deeply embedded throughout the QA suite
**Classification:** `REWRITE / ACQUISITION HISTORICAL`
At least 26 QA filenames are explicitly Acquisition-Memo-oriented, and at least 21 QA JavaScript files directly reference Acquisition Memo authority/constants/contracts. Several tests deliberately prove `acquisition_memo_v2` sealed-lane behavior for Underwriting. Because Batch 1 established that current Full Underwriting is incorrectly governed by Acquisition Memo V2, these tests currently protect the stale architecture rather than the intended launch product. They must be rewritten around a canonical Full Underwriting identity/orchestration after repair architecture is finalized.

### 122. Historical RETEST-specific regression files cannot be launch constitutional authority
**Classification:** `DIAGNOSTIC ONLY / REWRITE`
Batch 3 contains multiple RETEST-specific regression/replay tests (including RETEST 15/18/19/21/24/29/32/34 families and permanent replay fixtures). These are valuable forensic regression assets for bugs already encountered, but they bind behavior to historical implementation shapes and snapshots. They should be retained only where their business invariant remains valid, rewritten against the future canonical authority chain, and never used to force production back toward superseded architecture.

### 123. `h18-h19-governed-canary-simultaneous-launch-smoke.js` is a stale launch-certification gate pinned to an obsolete commit
**Classification:** `DELETE OR REWRITE`
The test hard-codes `certifiedLaunchCommit = "6b02c29c8730dfdce7df79b6f5051b3f4c268b31"` and allows only a tiny hard-coded set of post-baseline file changes. The current authoritative production commit is far newer and this audit itself has identified broad architecture requiring future changes. A test that defines launch validity by ancestry/change-set relative to a historical commit is stale by construction and cannot certify the repaired launch system. The valid product/pricing assertions inside it should be separated into ordinary regression tests.

### 124. The two Batch 3 scripts are dev/sample tooling, not production pipeline authorities
**Classification:** `STALE/DEV SUPPORT â€” ISOLATE`
`generate-sample-pdf.js` explicitly throws when `NODE_ENV === "production"`, uses DocRaptor TEST mode, fetches the public sample HTML at `investoriq.tech`, and returns a sample PDF. `generateCharts.js` likewise throws in production and generates static Riverbend sample/institutional PNGs from a local fixture dataset. Neither belongs in the customer production authority chain. They should remain clearly isolated dev/sample tooling or be archived if no longer needed.

### 125. Batch 3 tests overwhelmingly exercise local/imported logic rather than intentionally calling production HTTP
**Classification:** `BATCH 3 SAFETY OBSERVATION â€” CONTINUE AUDIT`
A mechanical scan found no direct `fetch()` calls anywhere in the QA/E2E JavaScript suite; the only `fetch()` calls in Batch 3 are inside the dev-only `generate-sample-pdf.js` script. Many QA tests seed fake environment variables such as `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_RUN_KEY`, and Stripe test identifiers before importing production modules. This lowers accidental production-mutation risk, but does not by itself certify that every imported module is side-effect free; tests that construct Supabase clients/RPC paths are being reviewed individually before Batch 3 closure.

### 126. The nominal launch-core suite intentionally executes dormant institutional and Premium architecture
**Classification:** `REWRITE â€” LAUNCH QA AGGREGATION`
`package.json` defines `qa:launch-core` as a chain that includes both `qa:financial-intelligence` and `qa:premium-underwriting`. The financial-intelligence suite executes numerous institutional Investment Committee / scenario / scoring tests for modules Batch 1 proved unreachable from the live API graph, while `qa:premium-underwriting` executes the full 13-test Premium suite although Premium is OFF. Therefore a green `qa:launch-core` is partly evidence about dormant/future architecture and cannot be treated as current launch certification. The repaired suite must contain only tests for reachable Screening/Full Underwriting launch authorities; dormant/future suites should be separately callable.

### 127. The current QA corpus has no dedicated RLS/security-policy regression for the critical database authority defects found in Batch 1
**Classification:** `MISSING REGRESSION COVERAGE â€” REWRITE/ADD AFTER ARCHITECTURE REPAIR`
A filename/content inventory found no dedicated RLS/security-policy suite covering customer INSERT/UPDATE authority on `analysis_jobs`, `analysis_job_files`, or `analysis_artifacts`; no regression around the stale authenticated `claim_and_consume_job()` SECURITY DEFINER RPC; and no direct Storage-policy test for `generated_reports`. There is an authenticated-identity boundary smoke, but that is not equivalent to database-policy/adversarial authorization testing. The highest-severity integrity findings from Batch 1 therefore have little or no explicit regression protection in the current test corpus.

### 128. The checked-in â€œlatest E2E resultsâ€ are stale static evidence, not current pipeline proof
**Classification:** `DIAGNOSTIC ONLY / STALE RESULT ARTIFACT`
`tests/e2e/results/latest-e2e-results.json` was generated on `2026-05-02T23:02:03.780Z` in `mode: "static"` with profile `wave4-parser-adversarial`, reporting 85 PASS / 0 FAIL / 8 SKIP. This predates the August architecture and does not exercise the current production pipeline. It must not be cited as current E2E or launch evidence.

### 129. `full-underwriting-gates-full-render-smoke.js` bypasses the real intake/worker/publication pipeline through synthetic test hooks
**Classification:** `KEEP AS COMPONENT/RENDER REGRESSION â€” NOT E2E AUTHORITY`
The test enables `INVESTORIQ_ENABLE_TEST_HOOKS`, injects synthetic validated core payloads/artifacts directly into the generator request, calls the generator handler with an admin test key, and requests `__test_return_final_html`. This is useful for deterministic HTML/render contract regression, but it bypasses purchase consumption, staged Storage validation, job creation, worker claim/lease, artifact provenance, generatorâ†’worker handoff, report persistence, revision promotion, and customer visibility. It therefore cannot certify Full Underwriting end-to-end correctness despite its broad name.

### 130. Existing tests are strongest as component/regression assets; the suite lacks a single faithful simulation of the actual authority chain
**Classification:** `BATCH 3 ARCHITECTURAL TEST CONCLUSION â€” IN PROGRESS`
The current test estate contains many valuable component tests for parsers, source truth, support-document rules, deterministic calculations, revision visibility, Bundle entitlement shaping, DocRaptor governance, and PDF contracts. But the top-level E2E simulator implements a simplified/stale lifecycle, generator tests use synthetic hooks, and launch aggregates include dormant/future authorities. There is no single test in the audited Batch 3 corpus that faithfully traverses the intended chain `transactional intake â†’ authoritative job provenance â†’ worker lease/state â†’ trusted parsing artifacts â†’ canonical source truth â†’ canonical delivery â†’ one publication authority â†’ mandatory manifest â†’ published/current revision â†’ customer download` using the same authority boundaries as production. The future regression strategy should be rebuilt around that chain after consolidation.

## Persisted findings 131â€“138 â€” Batch 3 full-corpus test classification

### 131. All 177 QA JavaScript files have now been individually classified against the audited production constitution
**Classification:** `BATCH 3 QA CLASSIFICATION COMPLETE â€” FILE LEVEL`
A file-by-file classification pass was completed for every JavaScript file under `tests/qa`. The resulting ledger artifact is `INVESTORIQ_BATCH3_QA_FINAL_CLASSIFICATION.tsv`. Counts: 30 `KEEP`; 9 `KEEP / REHOME`; 4 fixture modules retained only as fixtures; 61 `REWRITE`; 32 `REWRITE â€” ACQUISITION HISTORICAL`; 20 `DIAGNOSTIC ONLY â€” DORMANT INSTITUTIONAL`; 13 `DIAGNOSTIC ONLY â€” FUTURE PREMIUM`; 4 `DIAGNOSTIC ONLY â€” HISTORICAL REGRESSION`; 3 general `DIAGNOSTIC ONLY`; and 1 `DELETE / REWRITE` obsolete commit-pinned launch test. These classifications are architectural, not pass/fail results: no test was permitted to override production doctrine discovered in Batches 1â€“2.

### 132. Nearly half of the QA JavaScript corpus performs source-text/implementation-shape assertions
**Classification:** `TEST ARCHITECTURE DEFECT â€” OVERRELIANCE ON SOURCE STRING PROOF`
85 of 177 QA JavaScript files contain direct source-file reads such as `readFileSync`/`readFile` and often regex/string assertions against production implementation. Such tests can be useful for narrow invariants, but they are inherently weak evidence for runtime authority behavior. This quantitatively confirms the historical pattern in which tests could remain green while runtime control flow, database contracts, or cross-module ordering were broken. The repaired launch suite should prefer executable behavior/state assertions and reserve source-shape assertions for narrow diagnostics only.

### 133. `source-truth-constitutional-matrix-smoke.js` mixes a durable core matrix with the stale Acquisition Memo authority
**Classification:** `REWRITE â€” PRESERVE CORE MATRIX, REMOVE ACQUISITION GOVERNANCE`
The test correctly exercises canonical source truth and one-source-survival publication doctrine, but then proves publishability in the Underwriting lane by constructing an Acquisition Memo boss contract. Because Batch 1 proved Full Underwriting is wrongly governed by Acquisition Memo V2, this test cannot remain authoritative as written. Its source-truth matrix is high-value and should be retained in a rewritten canonical Full Underwriting matrix after product-authority consolidation.

### 134. `h5-staged-source-registration-guard-smoke.js` validates migration source text rather than the effective database security constitution
**Classification:** `REWRITE â€” SECURITY REGRESSION MUST EXECUTE POLICY/RPC BEHAVIOR`
The H5 guard test reads specific migration files and asserts exact SQL strings for `consume_purchase_and_create_job`, staged Storage paths, and related protections. Batch 1 proved that stronger modern RPC logic coexists with weaker legacy table RLS paths; therefore proving that secure SQL text exists does not prove it is exclusive or effective. This test should be replaced by adversarial DB/RLS tests that attempt unauthorized direct job/file/artifact inserts/updates and verify the authoritative RPC path is the only permitted creation path.

### 135. `h8-entitlement-restoration-event-smoke.js` deeply monkey-patches worker source and misses the atomic-lineage defect found in the audit
**Classification:** `REWRITE â€” PRESERVE RESTORATION INVARIANTS, TEST TRANSACTIONAL LINEAGE`
The test rewrites/import-patches `admin-run-worker.js` source to expose private helpers and simulates restoration/event behavior. The audit found that purchase restoration and the `entitlement_restored` lineage event are separate operations, so restoration can succeed while the event write fails and later governed requeue loses lineage. The repaired test must exercise the eventual single transactional restoration/requeue authority and explicitly prove there is no state in which entitlement restoration succeeds while authoritative recovery lineage is lost.

### 136. The deterministic parser/adversarial test assets are among the strongest preserve candidates in Batch 3
**Classification:** `KEEP / REHOME â€” PARSER REGRESSION FOUNDATION`
The parser-focused tests and adversarial fixtures exercise numeric collisions, document-type context, T12/Rent Roll aliases, required-slot rescue, evidence binding, and deterministic extraction behavior without depending on Acquisition Memo or Premium orchestration. These should form part of the repaired parser/source-ingress regression suite, after trusted artifact provenance and DB security boundaries are repaired. Their value is component correctness, not end-to-end publication proof.

### 137. The E2E harness should be decomposed rather than treated as one launch-certification system
**Classification:** `REWRITE E2E HARNESS`
`assert-report-output.js` contains useful post-render/PDF text assertions and can be retained as an output-inspection helper. `parser-adversarial.js` and its fixtures are useful parser regressions. `fake-supabase.js` is a reasonable local simulation utility but currently supports a stale worker model. `worker-state-scenarios.js`, the Wave 2 lifecycle fixture, and large portions of `run-e2e.js` encode obsolete dual-core hard failure and source-string branch assertions and therefore require rewrite. The checked-in latest result artifact remains diagnostic-only and stale. The future E2E runner should execute the repaired authority chain rather than reimplement a simplified alternate worker constitution.

### 138. Batch 3 now has an explicit regression-governance rule for the eventual repair
**Classification:** `AUDIT DOCTRINE â€” TESTS FOLLOW ARCHITECTURE, NOT VICE VERSA`
During repair, production code must not be changed merely to make a stale Batch 3 test green. Each failing test must first be checked against the per-file classification. `KEEP` tests protect durable invariants but may still require mechanical updates when interfaces are consolidated; `KEEP / REHOME` tests retain mathematical/provider invariants but move out of stale product lanes; `REWRITE` tests must be rebuilt around the new single authority chain; `DIAGNOSTIC ONLY` suites cannot block launch; Premium remains isolated; Acquisition historical tests cannot force current Full Underwriting back into Acquisition Memo V2; obsolete commit-pinned gates are removed/replaced.

## Persisted findings 139â€“145 â€” Batch 3 fixture and closure audit

### 139. Manual upload fixture `05_bad_core_missing_rent_roll` encodes the obsolete downstream dual-core hard-failure rule
**Classification:** `REWRITE â€” STALE FIXTURE DOCTRINE`
The fixture README says a valid T12 plus a missing/meaningless Rent Roll should cause the system to â€œfail closed or refuse to publish due to invalid/missing core rent roll.â€ That is inconsistent with the current downstream Core-Gated Publish-or-Collapse doctrine after a Full Underwriting package has already passed strict intake: if the T12 lane remains canonically sufficient and the Rent Roll lane later becomes unusable, `t12_minimum_core` can remain publication-required. The fixture may still be valuable as a parser/input-degradation test, but its expected report outcome must be rewritten to distinguish strict intake from downstream survival.

### 140. Manual upload fixture `06_cross_document_financial_mismatch` oversimplifies contradiction handling into an unconditional mismatch fail-close
**Classification:** `REWRITE â€” CANONICAL CONTRADICTION RECEIPTS REQUIRED`
The fixture README expects an approximately 10x T12/Rent Roll scale mismatch to fail closed categorically. Current doctrine does permit truly catastrophic contradiction to produce `insufficient_core`, but the decision must arise from canonical evidence/receipts and lane-survival rules rather than a raw ratio alone. This fixture should survive as an adversarial contradiction test, but its expected outcome must be expressed in terms of the repaired canonical contradiction constitution, including proof that neither core lane remains safely usable if whole-report failure is expected.

### 141. `FINAL TEST 7 - CONTROLLED SOURCE RECONCILIATION DISCLOSURE` is a strong preserve candidate
**Classification:** `KEEP / REHOME â€” FUTURE PRODUCTION CANARY`
The fixture intentionally creates a material but non-catastrophic T12/Rent Roll variance and expects publication with explicit source-reconciliation disclosure, no inferred cause, no admin review, and no unsupported current-debt/refinance conclusions. This aligns closely with the current publish-or-collapse doctrine. The stale visible-classification wording can be reconciled later, but the business invariant is valuable and should become one of the repaired end-to-end production certification cases.

### 142. `Final Attack Test 8` remains a high-value adversarial support-precedence fixture but carries stale Acquisition naming
**Classification:** `KEEP / REHOME â€” REWRITE PRODUCT IDENTITY`
Its substantive expectations are valuable: T12/Rent Roll operating truth remains authoritative; current debt stays separate from proposed acquisition financing; appraisal does not become purchase price; stabilized NOI does not replace T12 NOI; market survey does not override Rent Roll market rent; renovation facts remain bounded; environmental context cannot masquerade as property-tax evidence; and unsupported recommendations/modeling must not be invented. Those invariants should survive. However, the fixture uses â€œAcquisition supportâ€ terminology and was historically tied to the Acquisition Memo era, so it should be renamed/reframed as a canonical Full Underwriting adversarial fixture after product-authority repair.

### 143. The uploadable fixture documentation itself contains minor stale file-format references
**Classification:** `STALE FIXTURE DOCUMENTATION`
Several README PDFs list supporting files with `.md` extensions while the actual uploadable fixture package contains `.pdf` versions, and `UPLOAD_GUIDE.txt` explains that conversion was done because the Dashboard does not accept Markdown. This is not a pipeline defect, but the future fixture pack should have internally consistent names so manual certification evidence is unambiguous.

### 144. No direct production HTTP or ordinary Supabase mutation client was found in the Batch 3 QA/E2E executables
**Classification:** `BATCH 3 SAFETY CLOSURE`
The final scan found no direct `fetch()` calls in QA/E2E JavaScript and no ordinary `createClient(...).from(...).insert/update/delete` or `.rpc(...)` mutation path in the test corpus. Tests that exercise worker/database behavior use source inspection, mocks, fake state, or monkey-patched clients. This means Batch 3 is primarily a regression/doctrine corpus rather than a hidden production mutation suite. The dev sample PDF script remains the only Batch 3 executable with a network fetch and explicitly refuses production mode.

### 145. Batch 3 is complete as a scripts/tests audit scope
**Classification:** `BATCH 3 CLOSED â€” NOT PASS / NOT LAUNCH CERTIFICATION`
All 233 Batch 3 archive entries have been inventoried and classified by role: QA JavaScript, E2E helpers/fixtures/results, uploadable validation fixtures, and the two dev scripts. All 177 QA JavaScript files have an explicit per-file architecture classification. The test estate is confirmed to contain substantial valuable regression logic, but it cannot be used unchanged as constitutional launch authority because large portions protect Acquisition Memo V2, Premium, dormant institutional chains, historical RETEST shapes, source-code strings, and stale dual-core failure doctrine. The next audit batch should reconcile authoritative Markdown product/doctrine/roadmap documents against the executable architecture before any repair plan is finalized.


---

# BATCH 4 â€” DOCTRINE / ROADMAP / LAUNCH DOCUMENTATION AUDIT
## Scope opened: 2026-08-17

Batch 4 contains 18 doctrine, roadmap, status, launch-planning, Premium, and pipeline-map documents. This batch is documentary evidence only. It does not override the executable findings from Batches 1â€“3 unless the controlling owner authority explicitly says it does.

## Finding 146 â€” CURRENT AUTHORITATIVE: H0 owner receipt cleanly freezes the present launch constitution
`docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md` is the strongest current written authority in Batch 4.

It explicitly freezes:
- Screening = $199.
- Full Underwriting = $499.
- target Bundle â‰ˆ $699 for exactly 2 Screening + 1 Full Underwriting.
- simultaneous launch of Screening + Full Underwriting, or neither.
- V2/base as the only public Full Underwriting launch foundation.
- Legacy Underwriting and Acquisition Memo V1 as historical only.
- Premium Acquisition Underwriting exactly false, not the launch lane, and not a fallback.
- Full Underwriting admission only after accepted usable T12 + accepted usable Rent Roll + at least one additional readable adjudicable support document before entitlement consumption.
- After generation begins, weak/irrelevant/incomplete/contradictory/unusable optional support cannot block a valid-core report; dependent analysis must qualify/collapse/omit instead.

Classification: `CURRENT AUTHORITATIVE`.

## Finding 147 â€” CURRENT AUTHORITATIVE: Product Doctrine correctly subordinates itself to H0
The top of `docs/INVESTORIQ_PRODUCT_DOCTRINE.md` explicitly says H0 controls current product name, pricing, launch composition, lane authority, supporting-document admission, remedies, and doctrine precedence.

It repeats the current $199 / $499 / â‰ˆ$699 launch constitution and explicitly says older $299 Screening, $999 Underwriting, Premium-launch-bridge, Screening-first, and later-Full-Underwriting statements are historical context only.

Classification: `CURRENT AUTHORITATIVE` for the H0 precedence header and constitutional rules.

## Finding 148 â€” DEFECT / DOCUMENTATION CONTRADICTION: Product Doctrine still contains stale body text after the H0 override
Despite its correct H0 precedence header, the same Product Doctrine later still contains:
- `### Screening Report ($299)`
- `### Underwriting Report ($999)`
- `Premium Acquisition Underwriting V1 is the governed launch bridge`
- language treating broader capital-risk/refinance underwriting as a later governed phase.

These statements directly conflict with the H0 owner freeze that the same file says controls.

The precedence rule resolves the legal/architectural authority, but leaving contradictory product definitions inside the canonical doctrine file is dangerous for humans, tests, AI coding agents, and future maintenance.

Classification: `REWRITE â€” stale doctrine embedded inside current doctrine`.

## Finding 149 â€” CURRENT AUTHORITATIVE: intake requirements and downstream publication survival are explicitly separate
H0 and Product Doctrine together resolve an ambiguity that has repeatedly caused implementation confusion:
- Full Underwriting intake is intentionally strict: accepted usable T12 + accepted usable Rent Roll + at least one adjudicable support document before entitlement consumption.
- After generation begins, optional/supporting-document weakness cannot independently revoke a valid-core report.
- Report-level source publication authority is governed by the accepted core evidence.

This is not a contradiction. It is a two-stage constitution:
`strict customer admission` â†’ `core-gated downstream survival`.

Classification: `CURRENT AUTHORITATIVE`.

## Finding 150 â€” CURRENT AUTHORITATIVE / CODE VIOLATION CORROBORATION: downstream layers may only mirror canonical source authority
Product Doctrine says:
- Screening and Underwriting must consume the same accepted core facts and publication decision.
- pipeline-specific report logic may not reinterpret source authority.
- Delivery Gate may enforce canonical publication authority but may not rediscover document truth or manufacture deliverability.
- workers, publication helpers, artifact helpers, compatibility aliases, legacy fields, and customer messaging may only mirror canonical authority.

This independently corroborates the Batch 1 findings that duplicate delivery/publication authority, stale structured gate fields, Acquisition Memo reconstruction, and worker-side reinterpretation violate owner doctrine.

Classification: `CURRENT AUTHORITATIVE`.

## Finding 151 â€” CURRENT AUTHORITATIVE / TAXONOMY CORROBORATION: internal system failures must not become customer-document failures
Product Doctrine explicitly requires source-authority construction failures, unhandled exceptions, rendering failures, contract failures, PDF failures, storage failures, and platform failures to be classified as internal system failures and not converted into missing-document/customer-replacement messages.

This directly confirms the Batch 2 taxonomy conflict around `SOURCE_TRUTH_PACKAGE_CONSTRUCTION_FAILED`.

Classification: `CURRENT AUTHORITATIVE`.

## Finding 152 â€” CURRENT AUTHORITATIVE / CODE VIOLATION CORROBORATION: Quality Manifest is a required launch artifact
Multiple current launch documents require Quality Manifest disclosure and treat the manifest as part of the source-to-PDF/customer certification chain.

This corroborates Batch 1 Finding 88: the current code reaching `published` before final manifest persistence violates the documented launch constitution.

Classification: `CURRENT AUTHORITATIVE`.

## Finding 153 â€” STALE LEGACY: `ELITE_ROADMAP.md` still calls Premium the current priority
`ELITE_ROADMAP.md` is marked `Status: Active` but states:
- `The immediate product objective is Premium Acquisition Underwriting V1`.
- `Current Priority: Premium Acquisition Underwriting V1`.

H0 says Premium is exactly false, not the launch lane, and not a fallback.

Classification: `STALE LEGACY / MUST BE RETIRED OR REWRITTEN`.

## Finding 154 â€” PREMIUM FUTURE / MUST BE ISOLATED: `UNDERWRITING_GAMEPLAN_v2.md`
`UNDERWRITING_GAMEPLAN_v2.md` is titled `Premium Acquisition Underwriting V1 Execution Plan` and marked `Status: Active execution plan`.

Its protected-foundation principles remain useful, but it is not the current launch plan under H0.

Classification: `PREMIUM FUTURE / MUST BE ISOLATED`.

## Finding 155 â€” PREMIUM FUTURE / MUST BE ISOLATED: Premium doctrine and activation runbook
`docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md` correctly declares itself subordinate to H0 and applicable only to historical or future separately authorized Premium expansion work.

`docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATION_RUNBOOK.md` is similarly a Premium-specific activation artifact.

These must not participate in current Full Underwriting launch authority.

Classification: `PREMIUM FUTURE / MUST BE ISOLATED`.

## Finding 156 â€” DIAGNOSTIC ONLY: Simultaneous Launch Master Game Plan contains valuable architecture diagnosis but is planning evidence, not current executable truth
`INVESTORIQ_SIMULTANEOUS_LAUNCH_MASTER_GAME_PLAN.md` explicitly says it was planning-only and made no production changes.

Its central diagnosis is strongly validated by this audit:
- V2/base should be the Full Underwriting foundation.
- Acquisition Memo V1 should not be the customer lane.
- Premium should remain false.
- duplicated authority at handoffs is the dominant architectural problem.
- the Quality Manifest should be required for every outcome.

Classification: `DIAGNOSTIC ONLY â€” high-value historical architecture analysis`.

## Finding 157 â€” STALE LEGACY: `PIPELINE_MAP.md` is no longer a reliable current pipeline inventory
`PIPELINE_MAP.md` calls itself a deterministic current inventory but contains stale behavior, including:
- GitHub worker kick described as automatically running every 5 minutes.
- job creation described through an older `needs_documents` model.
- older claim/requeue descriptions.
- older generator/publication descriptions that no longer match the Batch 1â€“2 live source.

Classification: `STALE LEGACY / REWRITE FROM THE COMPLETED AUDIT`.

## Finding 158 â€” DOCUMENTATION STATE DEFECT: current STATUS/ROADMAP/HANDOFF files contain PASS/CLOSED claims contradicted by this full audit
The August 11 status/roadmap/handoff files contain statements such as:
- `SOURCE / CODE status: PASS`
- `P0 constitutional repository/source closure remains CLOSED`
- Gate 1 PASS
- Gate 2 PASS

Batches 1â€“3 have now proven live duplicate authorities, security/integrity gaps, retry-exhaustion defects, stale product identity, publication duplication, revision-ordering contradictions, and test-doctrine failures.

Those older PASS/CLOSED claims cannot remain the current source of truth after this audit.

Classification: `STALE STATUS â€” MUST BE SUPERSEDED BY THIS AUDIT LEDGER`.

## Finding 159 â€” AMBIGUOUS / REQUIRES PRODUCTION PROOF: Supabase Cron scheduling claims are documentary, not yet independently proven
Current August 11 documents repeatedly say:
- Supabase Cron is the scheduler authority.
- `investoriq-admin-run-worker` runs on `*/3 * * * *`.
- GitHub worker kick is manual fallback only.

Batch 2 independently confirmed the GitHub workflow has no automatic schedule, which supports the documentary claim.

However, Batch 1â€“4 repository files do not themselves prove the current production Supabase Cron job definition.

Classification: `AMBIGUOUS â€” NEEDS READ-ONLY PRODUCTION PROOF`.

## Finding 160 â€” DOCUMENTATION GOVERNANCE DEFECT: contradictory â€œactiveâ€ documents coexist without a physically clean authority surface
The repository simultaneously contains:
- H0 saying Premium OFF and V2/base Full Underwriting launch.
- Product Doctrine with a correct H0 override at the top but stale $299/$999/Premium-launch-bridge body text.
- `ELITE_ROADMAP.md` marked Active and prioritizing Premium.
- `UNDERWRITING_GAMEPLAN_v2.md` marked Active execution plan for Premium.
- newer August status/roadmap/handoff documents describing Full Underwriting launch stabilization.
- archived status/roadmap files with historical operational claims.

Although H0 formally resolves precedence, the documentary surface is still unsafe for maintainers and coding agents because multiple contradictory files advertise themselves as active/current.

Classification: `DEFECT â€” documentation authority accumulation`.

## Batch 4 provisional thesis
The written owner constitution is substantially clearer than the executable system:
`H0 owner freeze` â†’ `Product Doctrine constitutional rules` is the correct documentary authority chain.

The documentation problem mirrors the code problem: newer authority was added without fully retiring or rewriting older â€œactiveâ€ plans.

Batch 4 remains OPEN pending a final per-document classification and reconciliation pass.


## Finding 161 â€” DOCTRINE CONTRADICTION: older Product Doctrine still encodes the retired dual-core downstream hard gate
The Product Doctrine body says:
- the only report-level core documents are T12 and Rent Roll; and
- if a core document is `rejected_catastrophic`, the report is blocked.

The newer August 11 Handoff/Status/Roadmap instead says that if canonical `T12 and/or Rent Roll` evidence is sufficient for a truthful defensible report, the report MUST publish.

That newer survivor-lane doctrine is also the doctrine governing this audit:
- `dual_source_core`
- `t12_minimum_core`
- `rent_roll_minimum_core`
- `insufficient_core`

with the first three potentially publishable downstream.

The H0 receipt requires both T12 and Rent Roll plus support at intake but does not explicitly adjudicate a later one-core-lane-loss scenario. Therefore the documentation must be rewritten so no maintainer can confuse:
`strict intake admission` with `downstream survivor-lane publication`.

Classification: `REWRITE â€” constitutional ambiguity / stale dual-core downstream rule`.

## Finding 162 â€” DIAGNOSTIC CONFLICT: older launch investigation recommends Screening-first despite H0 simultaneous-launch freeze
`INVESTORIQ_FULL_REPOSITORY_UNDERWRITING_LAUNCH_INVESTIGATION.md` recommends Screening launch after P0 with Full Underwriting later.

H0 explicitly freezes simultaneous Screening + Full Underwriting launch, or neither.

Classification: `DIAGNOSTIC ONLY â€” historical recommendation superseded by H0`.

## Finding 163 â€” DOCUMENTATION IDENTITY AMBIGUITY: â€œV2/baseâ€ is not concretely defined enough to prevent Acquisition architecture from masquerading as Full Underwriting
H0 and the simultaneous-launch plan repeatedly identify `V2/base` as the only Full Underwriting launch foundation and prohibit Legacy Underwriting / Acquisition Memo V1 authority.

However, the documents do not provide one concrete canonical module/lane identifier that unambiguously distinguishes:
- `V2/base Full Underwriting`, from
- the live `acquisition_memo_v2` execution authority found in Batch 1.

Because the executable code currently labels the active Underwriting lane as `acquisition_memo_v2`, documentation that bans only `Acquisition Memo V1` leaves room for a false interpretation that Acquisition Memo V2 is the intended V2/base.

The current owner handoff for this audit removes that ambiguity: the launch product is Full Underwriting, and stale Acquisition Memo architecture must not govern it.

Classification: `DEFECT â€” identity authority must be made explicit in final consolidated doctrine`.

## Finding 164 â€” SUPERSEDED STATUS: old Gate/P0 PASS labels must not survive as current launch certification
The August 11 status, roadmap, canonical handoff, and launch-blocker checklist contain historical Gate/P0 PASS/CLOSED labels. Those were valid snapshots of narrower work packets, not full-pipeline certification.

The present full audit has disproven any interpretation of those labels as system-wide launch readiness.

Classification: `SUPERSEDED STATUS / HISTORICAL EVIDENCE ONLY`.

## Finding 165 â€” CURRENT AUTHORITATIVE: technical-delivery failure is fail-safe, not customer-document failure
Current doctrine consistently distinguishes:
- core/source insufficiency, from
- renderer/PDF/storage/platform failure.

A technical delivery failure must not publish unsafe/incomplete bytes, but it must remain an internal system failure and must not revoke the underlying truthful source authority.

This distinction is required in the final repair state machine:
`core publication authority` â†’ `artifact readiness` â†’ `customer visibility`.

Classification: `CURRENT AUTHORITATIVE`.

## Finding 166 â€” BATCH 4 DOCUMENTARY ROOT CAUSE: documentation has the same authority-accumulation disease as the code
The repository contains a correct H0 freeze and useful modern constitutional language, but older pricing, Premium priorities, launch sequencing, pipeline maps, RETEST state, and status labels remain in files that still advertise themselves as active/current.

The documentation therefore reproduces the same architectural failure pattern:
`new authority added` + `old authority not retired`.

Final documentation repair must create one small explicit authority hierarchy and archive/label everything else so neither humans nor coding agents can infer stale doctrine as current.

Classification: `DEFECT â€” documentation authority accumulation`.

# BATCH 4 CLOSURE

Batch 4 is CLOSED as a doctrine/documentation audit scope.

This does NOT mean the documentation is correct or launch-ready. It means all 18 provided doctrine/status/roadmap/pipeline documents have been classified and reconciled against the controlling owner intent and the executable findings from Batches 1â€“3.

## Controlling documentary chain after audit
1. `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
2. The H0-consistent constitutional portions of `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`
3. The current audit handoff / owner instructions, where they explicitly refine later downstream survival doctrine
4. This full-pipeline audit ledger as the current factual architecture/defect record

Everything else in Batch 4 is supporting evidence, future Premium material, stale status, planning history, or a rewrite/archive candidate.

## Batch 4 exit boundary
The repository/document audit is now sufficiently mapped to proceed to read-only production-state proof before any repair plan is finalized.

Required production proof domains:
- Supabase Cron scheduler definition.
- exact production table RLS and grants.
- exact function EXECUTE grants / SECURITY DEFINER exposure.
- Storage bucket policies for `generated_reports`, staged uploads, and relevant artifacts.
- production database triggers/functions where repository migrations are incomplete.
- Vercel effective Node/runtime/function-duration/environment configuration relevant to the worker.
- Stripe active payment methods and entitlement-fulfillment configuration.
- production confirmation of Premium flag state and any scheduler/admin secrets only as boolean/config-state evidence; secrets themselves must never be requested or exposed.

No production mutation is authorized by this closure.


---

# FINAL PHASE â€” READ-ONLY PRODUCTION-STATE PROOF

Opened 2026-08-17. Repository/source/document audit is complete through Batch 4. No repair plan is authorized until live production state is reconciled against the audited source. Required proof domains: Supabase Cron; exact RLS/table grants/function EXECUTE grants/SECURITY DEFINER exposure; relevant triggers/functions; Storage policies; Vercel effective runtime/duration; Premium flag state; Stripe payment-method/fulfillment configuration. Read-only only. Never request or expose secrets.


## Production Proof Finding 167 â€” CONFIRMED LIVE: retry exhaustion is not a global production safety boundary
Read-only production job-state output on 2026-08-17 shows:
- `dead_letter`: 3 jobs, maximum `worker_attempt_count = 12377`
- `failed`: 66 jobs, maximum `worker_attempt_count = 2`
- `published`: 213 jobs, maximum `worker_attempt_count = 0`
- `publishing`: 23 jobs, maximum `worker_attempt_count = 0`
- `queued`: 1 job, `worker_attempt_count = 141`

This independently proves that the repository-level `worker_max_attempt_count() = 3` concept is not functioning as a global claim/requeue ceiling in live production. At least one dead-letter job accumulated 12,377 worker attempts, and the currently queued job has already accumulated 141 attempts.

Classification: `CONFIRMED LIVE DEFECT â€” retry exhaustion / requeue authority bypass`.

## Production Proof Finding 168 â€” CONFIRMED LIVE: a queued job can remain eligible after extreme worker-attempt accumulation
The production state contains exactly one queued job whose `worker_attempt_count = 141`.

A queued job above the nominal max-attempt doctrine proves that queue eligibility itself is not prevented by attempt exhaustion. This directly corroborates the source finding that claim/requeue paths do not enforce the same terminal-attempt ceiling as failure RPCs.

Classification: `CONFIRMED LIVE DEFECT â€” queue admission ignores exhausted attempts`.

## Production Proof Finding 169 â€” CONFIRMED LIVE: historical retry storm reached five-digit attempts
Production contains a dead-letter job with `worker_attempt_count = 12377`.

This is direct database evidence of the previously observed retry-storm class and validates that the issue was not merely a UI counter or RETEST-specific interpretation.

Classification: `CONFIRMED LIVE HISTORICAL IMPACT â€” five-digit retry storm`.

## Production Proof Finding 170 â€” AMBIGUOUS / REQUIRES ROW-LEVEL TRACE: 23 jobs are in `publishing` with `worker_attempt_count = 0`
Production currently reports 23 jobs in `publishing`, all with maximum `worker_attempt_count = 0`.

That combination is inconsistent with the modern worker model where worker claims increment `worker_attempt_count`. Possible explanations include:
- legacy pre-H6 jobs/states,
- direct/manual status mutation,
- older publication architecture,
- migrated historical rows,
- a current path that reaches `publishing` without the modern claim primitive.

The aggregate result alone cannot distinguish these possibilities.

Classification: `AMBIGUOUS â€” NEEDS READ-ONLY ROW/DATE/LEASE TRACE`.

## Production Proof Finding 171 â€” PRODUCTION STATE DOES NOT MATCH A CLEAN TERMINAL MODEL
Current aggregate state contains 23 `publishing` jobs and one `queued` job with extreme attempt accumulation alongside 66 failed and 3 dead-letter jobs.

This means production is not presently in a clean state where all non-published historical work is either terminalized or actively progressing under bounded attempts. Before launch stabilization, non-published legacy/stuck rows must be classified by provenance and safely reconciled under an explicit cleanup policy.

Classification: `PRODUCTION HYGIENE / RECOVERY REQUIREMENT`.


## Production Proof Finding 172 â€” CONFIRMED LIVE: Supabase Cron is the active production scheduler
Read-only production query on 2026-08-17 returned exactly one cron job:
- `jobid = 1`
- `jobname = investoriq-admin-run-worker`
- `schedule = */3 * * * *`
- `active = true`
- `database = postgres`
- `username = postgres`

This independently confirms the current documentary claim that Supabase Cron is the production scheduler authority and that it runs every three minutes.

Batch 2 already proved the GitHub workflow has no automatic schedule and is manual fallback only. Together, repository + production evidence now establish:
`Supabase Cron every 3 minutes = active automatic scheduler`
`GitHub worker kick = manual fallback`

Classification: `CONFIRMED LIVE / CURRENT AUTHORITATIVE SCHEDULER`.
