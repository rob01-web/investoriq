# InvestorIQ Pre-Launch Architecture, Contract, State-Machine, and Publication Audit

**Audit date:** 2026-09-12 UTC  
**Products:** Screening and Full Underwriting  
**Scope:** Source authority, calculations, terminology, admission, queue and worker execution, leases, retries, requeue and checkpoints, publication, PDF delivery, observability, tests, and launch blockers  
**Method:** Read-only repository inspection, live read-only Supabase queries, live Vercel deployment metadata and runtime-log inspection, local deterministic reproductions, local rendering fixtures, `npm run qa`, `npm run build`, and `npm run test:e2e`  
**Code changes:** None. No branch switch, merge, deployment, migration, scheduler activation, or production mutation was performed.

## A. Executive verdict

# LAUNCH HOLD

InvestorIQ is not ready for another customer-facing production test or launch.

The two live jobs supplied for this audit independently reached `dead_letter` after three attempts:

- Screening `3c8f9bc0-48c9-4174-94fb-5af0f7f8ecfb` (`Final Attack Test 8 RETEST 51`)
- Underwriting `b9bf0024-22cf-4b5f-aa75-c51534a07cd9` (`Final Attack Test 8 RETEST 52`)

Both had a valid canonical source package and both consumed their retry allowance without publishing. Screening repeatedly failed a deterministic customer-language contract. Underwriting was first deferred because only about 215 seconds remained when it reached rendering, then later encountered a contract failure and was eventually dead-lettered. Entitlement-restoration events were recorded for both jobs after bounded retry exhaustion.

The live scheduler is active every three minutes and invokes `/api/admin-run-worker` with a 50,000 ms caller timeout. During the audit window the endpoint returned eleven HTTP 500 responses. The exact gateway response was:

```json
{"error":"Failed to detect analysis_jobs columns","details":"Gateway Timeout"}
```

The later HTTP 200 responses reported `failedCount: 0` even while the live jobs were being requeued or dead-lettered. That makes the scheduler result an unreliable indicator of actual job disposition.

The standard local QA suite passed 38/38 checks and the production build passed. Those green results do not clear the hold because the suite uses simulators, source-text assertions, test hooks, and a full-render harness that can return HTML before the real worker PDF, storage, publication, and customer-visibility path completes. `npm run test:e2e` fails because it still asserts the superseded one-core admission doctrine.

The most urgent blockers are structural:

1. The worker can return generic 500s before doing useful work, with insufficient persistent correlation to invocation, job, stage, or SQL operation.
2. A lexical-scope error in the worker's late-error handler can replace the original error with `ReferenceError: verifiedPublicationCheckpoint is not defined`, bypassing the intended recovery path.
3. Expired publishable jobs are recovered with `claimedBy: 'admin-run-worker'` even though the database requires the original worker owner. This can leave expired jobs active indefinitely.
4. The 270-second worker budget, 210-second renderer timeout, 225-second minimum render-window rule, 50-second fetch timeout, and uncovered PDF/storage calls are incompatible for valid Underwriting jobs.
5. Deterministic publication-contract failures are treated as recoverable for publishable source packages, so a deterministic defect consumes retries until dead-letter rather than stopping safely with a repairable disposition.
6. Screening's renderer still emits the retired Break-Even Occupancy concept and its deterministic seal correctly fails it. Underwriting's renderer emits a limitation sentence containing “investment advice,” while the public-language validator rejects that sentence.
7. Delivery payloads contain contradictory aliases and stale downstream validators. A payload can simultaneously say `deliverable`, `customer_delivery_allowed: true`, and `customer_publish_eligible: true` while another alias says `admin_review_required`, `hold_delivery: true`, or `customer_status_reason_code: customer_publish_eligible`.

A production launch should remain blocked until the P0 and P1 items below are repaired and the certification plan passes against the deployed runtime.

### Authority snapshot

- **Expected branch:** `hotfix-worker-queue-starvation-20260911-r1`
- **Repository checkout used:** `/workspace/scratch/2f1237727131/investoriq`
- **Checkout branch:** `hotfix-worker-queue-starvation-20260911-r1`
- **Checkout HEAD:** `b2b27049509800ac0a6974fdd7a64d5a49530651`
- **Remote branch HEAD:** `67aa5004698953896f94183b0ec2c26ae550882b`
- **Live Vercel deployment:** `dpl_BkmA44RAR9aCJCE6EHEm2L5yhn9f`
- **Live alias:** `investoriq.tech`
- **Live runtime commit metadata:** `2005e6361e348b87a61d9470759819c5f000c5d3`
- **Source identity caveat:** the live deployment metadata reports `gitDirty: "1"`; the handoff references a shortened 39-character prefix in places. The full SHA above is the runtime metadata value. No evidence was found that the dirty flag alone changed application behavior, but release certification must record an immutable clean source SHA.
- **Live Supabase project:** `bcvuxtnuoidakzjqewfb` (`RE Property Analysis`)
- **Live scheduler:** singleton authority enabled, Supabase pg_cron, `*/3 * * * *`, endpoint `/api/admin-run-worker`
- **Production PDF mode:** DocRaptor test mode is still active by configuration. That is an intentional prelaunch hold, but production activation must remain gated.

## B. Root-cause architecture map

### 1. Semantic authority is duplicated

Financial truth is built in the source-truth package and deterministic contracts, then independently reconstructed in `generate-client-report-impl.js`, `*-base.js` contracts, wrappers, renderers, customer-surface models, report-contract QA, deterministic seals, and publication-quality checks. Wrappers repair or scrub some output after a base module has already manufactured obsolete concepts. This allows a label or formula to pass through one stage, be rewritten in another, and be rejected downstream.

The clearest example is Operating Cost Coverage Ratio. The governed formula is accepted operating expenses divided by accepted T12 Gross Potential Rent. The current Screening renderer and legacy/base underwriting contracts still construct and narrate `breakEvenOccupancy`, compare it to physical occupancy, and classify it with occupancy thresholds. A later deterministic seal knows the old wording is forbidden, but it cannot reliably prevent every earlier narrative from entering the final surface.

### 2. The worker has multiple recovery authorities

The JavaScript worker, the constitutional lifecycle helper, the queue scanner, and SQL RPCs each make decisions about ownership, state, retryability, lease expiry, terminal failure, and recovery episodes. Their rules do not fully agree:

- JavaScript timeout recovery uses a hard-coded owner that differs from the database owner fence.
- `recoverExpiredPublishableJob` may return `recoveryRequired` without changing the job state.
- The timeout sweep treats `recoveryRequired` as enough to skip `fail_expired_worker_job`.
- SQL retry ceilings include recovery-episode budgets, while the timeout failure RPC uses a simpler base-attempt rule.
- The scanner applies a per-pass limit while the worker describes the limit as per invocation.

### 3. Timeouts do not cover the real pipeline

The 270-second budget starts after configuration, authentication, and column probes. The renderer receives 210 seconds, but the worker insists on 225 seconds remaining before entering rendering. The PDF provider, storage, publication, and post-publication work are outside the renderer heartbeat timeout. The renderer timeout does not cancel the underlying operation. A valid job can therefore be handed back to the queue before its earlier invocation has actually stopped making mutations.

### 4. Publication has a strong final SQL gate but weak upstream agreement

`finalize_worker_publication_v2` checks report lineage, ownership, lease, admission receipt, storage object, delivery decision, core coverage, manifest state, receipt idempotency, and current-revision invariants. That is a sound final boundary. The problem is that the worker can reach this boundary with contradictory delivery aliases, stale QA findings, missing or stale manifest artifacts, and an artifact result that says publication retry is required while the worker continues into later states.

### 5. Tests prove contracts in isolation instead of the real lifecycle

The main QA runner's 38 checks are valuable component tests. They do not prove that two real jobs can be admitted, claimed, rendered, converted to PDF, stored, finalized, and made visible in successive scheduled invocations. The full-render harness can return successful HTML before PDF generation and publication. The Phase 6 test still enforces the old one-core admission rule and fails against current source. A green component suite therefore coexists with the exact production failures observed here.

## C. Complete finding register

Each finding includes the requested severity, product, subsystem, files/symbols, defect, root cause, consequence, reproduction, repair direction, and regression proof.

### P0 findings

#### AUDIT-001 — Screening publishes retired Break-Even Occupancy terminology

- **Severity:** P0
- **Product:** Screening (with shared semantic impact)
- **Subsystem:** Customer report rendering and deterministic publication seal
- **Files / symbols:** `api/_lib/screening-report-renderer.js` (narrative construction around the Screening executive classification); `api/_lib/generate-client-report-impl.js` (`buildScreeningExecClassificationRationale`, `breakEvenOccupancy`, `operatingCushionPct`); `api/_lib/deterministic-report-contract-qa-seal.js`; `api/_lib/full-underwriting-operating-intelligence-contract-base.js`
- **Observed defect:** Customer-facing Screening text still says `break-even occupancy` and describes physical occupancy relative to it. The live Screening artifact's deterministic seal reported `MISLEADING_BREAK_EVEN_OCCUPANCY_LABEL_VISIBLE` and `ok: false` on each rebuild.
- **Root cause:** The base calculation and narrative are still built around `breakEvenOccupancy`; wrappers and validators attempt to scrub or reject the result later. The retired concept remains an active upstream authority.
- **Customer consequence:** A valid paid Screening report can fail publication or present a physical-occupancy comparison that is mathematically and conceptually wrong.
- **Reproduction:** Run the live Screening job or render a Screening fixture with OPEX and T12 GPR. Inspect `report_contract_qa` and `deterministic_contract_qa_seal`; the old term is present and the seal fails.
- **Recommended repair:** Make Operating Cost Coverage Ratio the only public and contract concept. Calculate and carry one canonical ratio receipt from source truth through both products. Remove the occupancy comparison from public Screening prose and make every validator assert the same canonical label and formula.
- **Regression proof required:** A source-to-PDF test with occupancy materially different from OCCR; exact public-language scan for all legacy aliases; deterministic formula/value assertion; Screening end-to-end publication with a passing seal.

#### AUDIT-002 — Worker column-probe gateway timeout produces recurring opaque HTTP 500s

- **Severity:** P0
- **Product:** Shared
- **Subsystem:** Scheduler and worker bootstrap
- **Files / symbols:** `api/admin-run-worker.js` (`canUseColumn`, startup probes around lines 1072 and 1271–1277)
- **Observed defect:** The live endpoint returned eleven HTTP 500 responses. The exact response body was `Failed to detect analysis_jobs columns` with `details: Gateway Timeout`. The catch returns the response without durable invocation, query, column, timeout, or correlation evidence.
- **Root cause:** Five sequential schema probes issue a database query before queue processing. A gateway timeout is collapsed into one generic error. There is no bounded retry/backoff or startup health artifact that identifies which probe failed.
- **Customer consequence:** Jobs remain queued or stale while the scheduler appears to run. Operators cannot distinguish schema drift, gateway saturation, or a transient query timeout.
- **Reproduction:** Query live `net._http_response` for the audit window; every 500 response has the same JSON error. Invoke the route while the Supabase gateway is slow and inspect the response and artifacts.
- **Recommended repair:** Replace sequential per-column probes with one versioned capability query or migration-backed capability record. Add an invocation artifact before probes begin, record each probe name/duration/result, and return a structured retryable health result. Ensure the scheduler reports that no job work occurred.
- **Regression proof required:** Simulated gateway timeout for each probe; one structured artifact per invocation; no generic 500 without an invocation ID; scheduler success count must reflect zero work.

#### AUDIT-003 — Lexical-scope error masks the original worker failure

- **Severity:** P0
- **Product:** Shared
- **Subsystem:** Late rendering/publication error recovery
- **Files / symbols:** `api/admin-run-worker.js`; `verifiedPublicationCheckpoint` declared inside the rendering `try` block around line 3366 but referenced by the outer catch around lines 4168–4171
- **Observed defect:** Static AST binding inspection and ESLint `no-undef` show the outer catch references a variable outside its lexical scope. Any exception reaching that catch can throw `ReferenceError: verifiedPublicationCheckpoint is not defined` before the original error is classified or preserved.
- **Root cause:** The checkpoint declaration is scoped inside a nested block while the recovery handler was written at a wider scope.
- **Customer consequence:** A valid report can lose its original failure evidence, bypass late-publication preservation, take the generic worker failure path, consume retries, and appear as an unrelated internal 500.
- **Reproduction:** Run ESLint/no-undef on the worker or force an exception after the nested rendering block. The catch evaluates the out-of-scope identifier.
- **Recommended repair:** Declare the checkpoint in the same scope as the catch, initialize it explicitly, and add a test that forces an error after PDF/storage work and verifies the original error, checkpoint, and recovery disposition are retained.
- **Regression proof required:** Static binding check in CI; forced late-error test; artifact must contain original error code, stage, job ID, attempt ID, and recovery result.

#### AUDIT-004 — Expired publishable jobs cannot be requeued under the database owner fence

- **Severity:** P0
- **Product:** Shared
- **Subsystem:** Lease expiry and recovery
- **Files / symbols:** `api/_lib/worker-constitutional-lifecycle.js` (`recoverExpiredPublishableJob`); `api/admin-run-worker.js` timeout sweep; SQL `requeue_worker_job` in `supabase/migrations/20260910193000_launch_e2e_contract_reconciliation.sql`
- **Observed defect:** The JavaScript recovery helper defaults to or receives `claimedBy: 'admin-run-worker'`. The SQL function requires `p_claimed_by` to equal the job's original `worker_claimed_by`, even when the lease is expired. A local reproduction with an expired job owned by `worker-real-owner` resulted in `requeue_did_not_queue` and no queued state.
- **Root cause:** Application recovery authority and SQL ownership authority use different owner identities.
- **Customer consequence:** Expired jobs can remain in an active stage indefinitely. The timeout sweep records recovery-required evidence, skips the failure RPC, and leaves the customer without a report or a reliable terminal status.
- **Reproduction:** Call `recoverExpiredPublishableJob` with an expired job whose owner differs from `admin-run-worker`; the helper calls `requeue_worker_job` with the wrong owner and receives no queued row.
- **Recommended repair:** Define one owner-fenced recovery contract. Either pass the persisted owner through every recovery call or add a narrowly scoped SQL recovery operation that authorizes expired leases by job ID and attempt ID without impersonating a worker. Do not let `recoveryRequired` skip all terminal handling when no state mutation occurred.
- **Regression proof required:** Expired jobs for every active stage with matching and mismatching owners; assert exactly one of queued, failed, or dead-letter is persisted and that no expired active row remains.

#### AUDIT-005 — Worker time budget guarantees deferral for valid Underwriting jobs

- **Severity:** P0
- **Product:** Underwriting and Shared
- **Subsystem:** Runtime budget, renderer, PDF, and lease heartbeat
- **Files / symbols:** `api/admin-run-worker.js` constants and flow; `runWithWorkerLeaseHeartbeat`; `ensureReportDownloadArtifact` in `api/_lib/report-delivery-output.js`
- **Observed defect:** Runtime budget is 270 seconds, renderer timeout is 210 seconds, minimum render window is 225 seconds, and fetch timeout is 50 seconds. The minimum render check occurs after extraction and analysis. The live Underwriting job reached rendering with approximately 215 seconds remaining and was deliberately returned to `queued` with `worker_timebox_defer` / `insufficient_render_window`.
- **Root cause:** The time budget is split by incompatible fixed values. The heartbeat wraps only HTML rendering; PDF provider calls, storage operations, manifest work, publication, and post-publication operations are outside the renderer timeout. The renderer timeout does not cancel the underlying promise.
- **Customer consequence:** Valid Underwriting jobs repeatedly defer, consume attempts, hold leases, and can dead-letter without a source defect.
- **Reproduction:** Use the live Underwriting event chronology: first attempt reached rendering with 215.053 seconds remaining and deferred. Inspect the constants and the call boundaries in the worker.
- **Recommended repair:** Design one end-to-end deadline from invocation start. Reserve explicit budgets for extraction, analysis, HTML, PDF, storage, and publication. Pass an abort signal through all network/provider work, renew the lease against the same deadline, and resume at durable checkpoints rather than restarting the whole invocation.
- **Regression proof required:** Measured worst-case stage timings; two back-to-back live jobs; forced slow provider; no deferral when the planned critical path fits; cancellation proof; no mutation after lease expiry.

#### AUDIT-006 — Deterministic publication failures consume retries until dead-letter

- **Severity:** P0
- **Product:** Shared
- **Subsystem:** Failure classification and constitutional recovery
- **Files / symbols:** `api/_lib/worker-constitutional-lifecycle.js`; `api/admin-run-worker.js` (`recordJobFailure`, `applyTerminalFailureOutcome`); SQL `claim_worker_job` and `requeue_worker_job`
- **Observed defect:** For a canonical publishable source package, the constitutional lifecycle intentionally rejects terminal failure and requests recovery even when the failure is deterministic. A Screening contract failure was rebuilt three times, then the SQL retry ceiling produced `WORKER_RETRY_BUDGET_EXHAUSTED` and `dead_letter`.
- **Root cause:** “Publishable source truth” is treated as sufficient reason to retry every failure. Deterministic renderer or contract defects are not separated from transient provider and infrastructure failures.
- **Customer consequence:** A software defect consumes a customer's report credit and produces an avoidable dead-letter. The system retries a result that cannot change until code or data is repaired.
- **Reproduction:** Inspect the live Screening artifact sequence and `resolveConstitutionalTerminalFailureDisposition`; invoke a deterministic contract failure against a publishable package and observe recovery-required disposition on every attempt.
- **Recommended repair:** Classify deterministic contract and renderer errors as non-retryable internal release defects. Persist a blocked quality manifest and admin-visible incident, preserve the credit exactly once, and stop retrying. Reserve queue recovery for explicitly transient, idempotent errors.
- **Regression proof required:** Deterministic contract failure, provider timeout, source insufficiency, and storage outage must produce four distinct dispositions with exact attempt and credit behavior.

#### AUDIT-007 — Queue cursor and retry ordering permit starvation

- **Severity:** P0
- **Product:** Shared
- **Subsystem:** Queue scanner, fairness, and invocation limits
- **Files / symbols:** `api/_lib/worker-queue-scan.js`; `api/admin-run-worker.js` queue scanner and `claimedThisPass` / `maxPasses`
- **Observed defect:** The scanner cursor resets each invocation and admits up to 250 candidates before attempting claims. The worker's configured job limit is one to three, but `claimedThisPass` resets inside each pass and up to ten passes can run. There is no rotating fairness or retry-after priority. An old requeued job can be selected ahead of fresh work on every invocation; 251st eligible rows can be hidden behind the candidate cap.
- **Root cause:** Candidate discovery, claim limit, cursor lifetime, and fairness policy are separate local mechanisms with no durable queue position or starvation proof.
- **Customer consequence:** Screening can delay Underwriting, or Underwriting can delay Screening. A single repeatedly failing job can monopolize scheduled invocations while newer customers remain queued.
- **Reproduction:** The queue scanner source shows the 250-candidate cap and per-pass reset. The regression fixture proves candidate exhaustion but does not prove recovery across real invocations or renderer progress.
- **Recommended repair:** Use a database claim query with `FOR UPDATE SKIP LOCKED`, explicit `retry_after`, bounded per-invocation claims, and product/family fairness. Persist a scan cursor or use a fair priority key. Ensure every admitted candidate is either claimed, explicitly rejected with a durable reason, or revisited next invocation.
- **Regression proof required:** Two Screening and two Underwriting jobs, one repeatedly deferred job, candidate counts above 250, and successive scheduler invocations. Every eligible job must eventually claim and progress without cross-product starvation.

#### AUDIT-008 — Underwriting renderer and public-language validator reject one another

- **Severity:** P0
- **Product:** Underwriting
- **Subsystem:** Customer-language compliance and report contract QA
- **Files / symbols:** `api/_lib/full-underwriting-debt-intelligence-renderer.js`; `api/_lib/investoriq-qa-doctrine.js`; `api/_lib/report-contract-qa.js`
- **Observed defect:** The debt renderer always emits a footer containing “investment advice.” The validator's prohibited-language regex rejects that phrase without understanding that it is a limitation disclosure. Local rendering reproduced `containsProhibitedPublicLanguage: true`; the exact excerpt came from the renderer's own footer.
- **Root cause:** Public-language policy is implemented as a raw token scan while a renderer independently hard-codes a sentence containing a prohibited token.
- **Customer consequence:** A valid Underwriting report can fail QA or consume retries solely because the product emits a sentence its validator forbids.
- **Reproduction:** Render the local Underwriting fixture, strip HTML, and scan with `containsProhibitedPublicLanguage`; the footer is matched.
- **Recommended repair:** Establish a shared approved-language catalog and use a safe limitation sentence that contains no prohibited token. Validators should inspect actual prohibited assertions, retain excerpts, and distinguish approved methodology/limitation language.
- **Regression proof required:** Exact HTML text scan for all prohibited tokens, approved limitation fixtures, and a full Underwriting publication test.

### P1 findings

#### AUDIT-009 — Stale report-contract QA rules block or misclassify current reports

- **Severity:** P1
- **Product:** Screening and Underwriting
- **Subsystem:** Downstream contract QA
- **Files / symbols:** `api/_lib/report-contract-qa.js` (`SECTION_ELIGIBILITY_DEBT_HEADING_MISSING`, renovation checks, verdict/classification checks, financing readiness checks)
- **Observed defect:** Underwriting QA still expects old debt headings, old `Review - Source Reconciliation Disclosure` classification text, old renovation eligibility shapes, and a generic Quality Manifest row containing transaction/financing support to also contain Purchase Price, Proposed Loan Amount, LTV, Interest Rate, and Amortization. Live QA produced high or medium findings while the deterministic seal and canonical renderer passed.
- **Root cause:** Validator schemas and wording were not migrated with the current customer-surface and delivery contracts.
- **Customer consequence:** Valid Underwriting output is held or marked internally defective after passing canonical analysis.
- **Reproduction:** Inspect the live Underwriting `report_contract_qa` artifact and compare each violation to the rendered output and canonical section eligibility. The financing issue is a generic-row false positive.
- **Recommended repair:** Make report-contract QA consume canonical receipts and section eligibility rather than infer truth from headings or broad regexes. Delete obsolete rules and version the validator contract with the renderer.
- **Regression proof required:** Current Stonebridge fixture with canonical section receipts; stale labels must not be required; generic manifest rows must not satisfy or fail financing checks by accident.

#### AUDIT-010 — Admission tests and doctrine disagree with runtime admission

- **Severity:** P1
- **Product:** Shared
- **Subsystem:** Admission contract and test trust
- **Files / symbols:** `src/lib/reportUploadGate.js`; `tests/qa/phase6-lifecycle-certification-contract-smoke.js`; Phase 1 doctrine files
- **Observed defect:** Current runtime admission requires both Rent Roll and T12 plus product-specific supporting-document rules, while the Phase 1 test still expects one usable core source and asserts `canGenerate: hasCoreDocs`. `npm run test:e2e` fails on the obsolete assertion.
- **Root cause:** The admission doctrine was revised but the lifecycle certification test was not updated or retired.
- **Customer consequence:** Certification cannot provide a trustworthy release signal. A future repair may accidentally reintroduce the old one-core path to make the test green.
- **Reproduction:** Run `npm run test:e2e`; it fails at the stale `/canGenerate: hasCoreDocs/` assertion.
- **Recommended repair:** Choose and document one admission authority. Based on the current handoff, keep strict BOTH core admission for launch and update or remove the obsolete one-core lifecycle test. Test the exact Screening and Underwriting rules.
- **Regression proof required:** Admission matrix for both products, missing-core/support cases, and a passing certification test whose assertions match current doctrine.

#### AUDIT-011 — Base modules manufacture obsolete concepts before wrappers repair them

- **Severity:** P1
- **Product:** Screening and Underwriting
- **Subsystem:** Calculation and contract layering
- **Files / symbols:** `api/_lib/full-underwriting-chapter1-elite-contract-base.js`; `api/_lib/full-underwriting-operating-intelligence-contract-base.js`; `api/_lib/full-underwriting-*` wrappers; `api/_lib/generate-client-report-impl.js`
- **Observed defect:** Base contracts independently calculate expense ratio, NOI margin, OCCR/break-even values, rent gaps, DSCR, cap rates, and classification bands. Wrappers remove or rename some fields later. The base Underwriting operating contract still emits occupancy-break-even language and spread calculations.
- **Root cause:** A wrapper-repair architecture leaves obsolete calculations active and influential.
- **Customer consequence:** A future path, fallback, QA payload, or diagnostic can re-expose the retired metric or use a different formula.
- **Reproduction:** Build a contract directly from the base modules and inspect the receipts and narrative fields before wrapper normalization.
- **Recommended repair:** Move shared facts and formulas into one canonical calculation package. Wrappers should select product scope, not repair financial truth or customer vocabulary.
- **Regression proof required:** Static dependency graph disallows direct public rendering from base modules; identical fixture values and receipts across products.

#### AUDIT-012 — Screening and Underwriting can diverge on shared metrics

- **Severity:** P1
- **Product:** Shared continuity
- **Subsystem:** Cross-product source truth and calculations
- **Files / symbols:** `api/_lib/generate-client-report-impl.js`; `api/_lib/source-truth-package.js`; Screening renderer; Full Underwriting contracts and financial-intelligence modules
- **Observed defect:** Screening reconstructs values from `t12Payload` and `computedRentRoll`, while Underwriting resolves values through source package, customer-surface, boss contract, acquisition projection, and support-document precedence. Identical uploaded documents can therefore yield different accepted GPR, rent-roll annuals, expense ratio, NOI margin, rent-to-market gap, and classification inputs.
- **Root cause:** Product-specific fallback chains duplicate source selection and normalization.
- **Customer consequence:** A customer who buys Screening then Underwriting can receive different answers from the same documents without an intentional scope reason.
- **Reproduction:** Compare the canonical source package and final report JSON for the same fixture through both handlers; trace the separate candidate lists and fallback paths.
- **Recommended repair:** Persist one canonical source package and calculation receipt set on admission. Both products consume it; Underwriting adds optional scope only.
- **Regression proof required:** Same source hashes through both products; shared concept values, units, and provenance must match exactly.

#### AUDIT-013 — Parser recovery path references out-of-scope source hash

- **Severity:** P1 — **Additional Finding**
- **Product:** Shared, especially Rent Roll recovery
- **Subsystem:** Document extraction and AI recovery fallback
- **Files / symbols:** `api/parse/parse-doc.js` around the rent-roll and T12 recovery branches; `sourceContentSha256` declarations inside nested `try` blocks and later artifact writes
- **Observed defect:** `sourceContentSha256` is declared inside a nested recovery `try` and used outside that lexical scope in accepted fallback artifact construction. The accepted fallback path can throw a `ReferenceError` even when deterministic text or cached AI recovery produced usable data.
- **Root cause:** Recovery variables are scoped narrower than the artifact-writing code.
- **Customer consequence:** A valid uploaded document can fail parsing after successful recovery, causing the worker to retry or mark the source unusable.
- **Reproduction:** Static AST/no-undef inspection shows the later references have no binding; exercise a text-summary fallback without the table artifact.
- **Recommended repair:** Declare the source hash at the recovery-branch scope and preserve a null value when no text artifact exists. Add a fallback parse test that writes the artifact successfully.
- **Regression proof required:** Rent Roll and T12 fallback fixtures with missing tables, cached AI recovery, and no text artifact.

#### AUDIT-014 — Canonical GPR can be an undefined-symbol crash

- **Severity:** P1 — **Additional Finding**
- **Product:** Shared
- **Subsystem:** Report generation fallback metrics
- **Files / symbols:** `api/_lib/generate-client-report-impl.js` around the `hasT12Data` check and `canonicalGpr` use
- **Observed defect:** `canonicalGpr` is referenced in a branch that can be reached when accepted T12 totals are absent. The identifier is not bound in that scope.
- **Root cause:** Legacy financial summary logic was retained after the canonical GPR refactor.
- **Customer consequence:** Rent-Roll-only or partially parsed jobs can fail report generation instead of producing a constrained report.
- **Reproduction:** Static no-undef inspection plus a fixture without finite accepted T12 totals; the branch evaluates the undefined identifier.
- **Recommended repair:** Read GPR exclusively from the canonical source receipt and use a null-safe local binding. Do not infer T12 availability from an undefined fallback.
- **Regression proof required:** Rent-Roll-only, T12-only, both-source, and missing-GPR fixtures.

#### AUDIT-015 — Acquisition valuation can substitute a positive assumption for invalid canonical NOI

- **Severity:** P1 — **Additional Finding**
- **Product:** Underwriting
- **Subsystem:** Valuation and source precedence
- **Files / symbols:** `api/_lib/full-underwriting-valuation-reconciliation-v1.js` (`resolveCanonicalInputs`, `firstPositiveMoney`)
- **Observed defect:** `firstPositiveMoney` rejects a negative accepted NOI, then falls through to a positive acquisition `noi_basis` assumption. A local reproduction with canonical NOI `-50,000` and acquisition NOI basis `500,000` produced a valuation based on `500,000` while the evidence source was the acquisition assumption.
- **Root cause:** The helper conflates “positive value required for this calculation” with “source value is invalid and may be replaced by a different source.”
- **Customer consequence:** Valuation can silently use a different NOI basis than the accepted operating truth.
- **Reproduction:** Local call to `buildFullUnderwritingValuationReconciliationV1` with negative canonical NOI and positive acquisition assumption returned `baseValue.supported: true` and `noi: 500000`.
- **Recommended repair:** Preserve invalid canonical evidence as an explicit invalid/negative state. Suppress the dependent valuation or require a deliberate, source-backed acquisition basis with a visible label and provenance.
- **Regression proof required:** Negative, zero, missing, and positive NOI precedence cases with expected suppression and source receipt assertions.

#### AUDIT-016 — Ratio normalization uses an unsafe 1.5 boundary

- **Severity:** P1 — **Additional Finding**
- **Product:** Shared
- **Subsystem:** Financial units and rate normalization
- **Files / symbols:** `api/_lib/report-number-helpers.js` (`toRateRatio`, `toCapRatio`); duplicated `toRatioMetric` helpers in `generate-client-report-impl.js` and base contracts
- **Observed defect:** Values greater than 1.5 are divided by 100. A calculated ratio of 1.60 is therefore interpreted as 1.60%, not 160%, while a value of 1.5 remains 150% as a ratio. The same heuristic is used for user-entered rates, cap rates, and calculated metrics with different unit semantics.
- **Root cause:** One heuristic attempts to distinguish decimal ratios and percentage points without carrying units in the value receipt.
- **Customer consequence:** Edge-case operating ratios, rates, or cap rates can be converted to the wrong magnitude and classified incorrectly.
- **Reproduction:** Local helper call: `toCapRatio(1.5) === 1.5`, `toCapRatio(1.6) === 0.016`; the same boundary exists in the report implementation.
- **Recommended repair:** Store units explicitly and normalize at ingress by field contract. Never infer units from magnitude for calculated values.
- **Regression proof required:** Boundary table for 0.015, 0.016, 1, 1.5, 1.6, 5.25, 7, and 160 across every metric family.

#### AUDIT-017 — Additional acquisition-state fallbacks reference undefined state

- **Severity:** P1 — **Additional Finding**
- **Product:** Underwriting
- **Subsystem:** Acquisition assumptions and downstream report context
- **Files / symbols:** `api/_lib/generate-client-report-impl.js` around lines 7977 and 8045 (`acquisitionAssumptionState`)
- **Observed defect:** Fallback expressions reference `acquisitionAssumptionState` outside the declaration scope. The common branch may be masked when a nested underwriting state exists, but constrained or partial-support paths can throw or lose acquisition completeness information.
- **Root cause:** State assembly was moved into a nested finalization object without updating all fallback references.
- **Customer consequence:** Underwriting reports with partial acquisition support can fail or silently omit a section that should be constrained and disclosed.
- **Reproduction:** Static no-undef inspection and a fixture with no nested acquisition assumption state.
- **Recommended repair:** Pass one explicit acquisition state object through every renderer and validator; replace free-variable fallbacks with null-safe parameters.
- **Regression proof required:** No-support, partial-support, and full-support acquisition fixtures.

#### AUDIT-018 — Checkpoint reuse can falsely claim both core parsers are complete

- **Severity:** P1
- **Product:** Shared
- **Subsystem:** Extraction checkpoint and retry behavior
- **Files / symbols:** `api/admin-run-worker.js` extraction branch around `extractionAlreadySatisfied` and skip event construction
- **Observed defect:** The worker may reuse parsed checkpoints when either core parsed artifact exists and no pending core is detected. The skip event hard-codes `has_rent_roll_parsed: true` and `has_t12_parsed: true` even when only one was actually present.
- **Root cause:** A one-core survivability path was merged with a both-core admission path; evidence fields were written as a convenience rather than from the actual artifact inventory.
- **Customer consequence:** A retry can skip a missing parser, then downstream code sees a false complete inventory and produces an inconsistent report or hides the real missing source.
- **Reproduction:** Create one parsed core artifact and one missing core artifact; inspect the worker's extraction skip event and the next stage inputs.
- **Recommended repair:** Record each parser state independently. Reuse only the exact completed checkpoint, and require downstream source truth to decide whether the report is admissible or constrained.
- **Regression proof required:** Four inventory cases: neither, T12 only, Rent Roll only, both; event fields must match reality.

#### AUDIT-019 — Live scheduler authority differs from handoff authority

- **Severity:** P1
- **Product:** Shared
- **Subsystem:** Scheduler governance and release configuration
- **Files / symbols:** Live `worker_scheduler_authority` row; `CHAT_HANDOFF` authority files; Supabase pg_cron configuration
- **Observed defect:** Local handoff documentation describes scheduler-disabled production holds, while live SQL shows the singleton scheduler enabled on `*/3 * * * *`. The live scheduler was executing during the audit and produced the observed 500s.
- **Root cause:** Operational state is not reconciled with the written release authority.
- **Customer consequence:** A supposedly held system can continue consuming credits, retries, and worker capacity while defects are under investigation.
- **Reproduction:** Read the live singleton row and compare `enabled: true` and schedule `*/3 * * * *` to the handoff hold language.
- **Recommended repair:** Make scheduler enablement a deployment-certified setting with an immutable release record. A hold must disable the live singleton or route it to a no-op health mode; documentation must be generated from live state.
- **Regression proof required:** Scheduler-disabled hold test, controlled enablement test, and deployment metadata comparison.

#### AUDIT-020 — PDF and publication work are outside the worker's bounded heartbeat

- **Severity:** P1
- **Product:** Shared
- **Subsystem:** PDF generation, storage, and publication
- **Files / symbols:** `api/admin-run-worker.js` (`runWithWorkerLeaseHeartbeat`, `ensureReportDownloadArtifact` call); `api/_lib/report-delivery-output.js`
- **Observed defect:** The heartbeat/210-second race wraps HTML rendering only. PDF provider calls, object storage, report link persistence, manifest operations, and publication finalization can run after the renderer timer or near lease expiry. A timeout does not cancel the underlying renderer/provider work.
- **Root cause:** “Rendering” is treated as the critical path while the actual customer artifact pipeline is longer.
- **Customer consequence:** Duplicate artifacts, late mutations after requeue, publication races, or a job that is queued while an earlier invocation continues.
- **Reproduction:** Trace the worker call boundaries and force a slow provider or delayed storage response.
- **Recommended repair:** Put one cancellable deadline around the complete attempt, or split stages into independently leased queue states with durable idempotency keys.
- **Regression proof required:** Slow HTML, slow PDF, slow storage, lease-expiry race, and duplicate invocation tests.

#### AUDIT-021 — Artifact retry result is not consistently honored

- **Severity:** P1
- **Product:** Shared
- **Subsystem:** PDF artifact resolution and publication handoff
- **Files / symbols:** `api/admin-run-worker.js` around `publicationRetryRequired`; `api/_lib/report-delivery-output.js` (`ensureReportDownloadArtifact`)
- **Observed defect:** The worker checks a snake-case `publication_retry_required` value before the artifact call. The artifact helper returns `publicationRetryRequired` camel case and `publicationState: recovery_required`. The worker can persist report linkage and continue stage transitions without a single authoritative check of the returned recovery state.
- **Root cause:** Return-shape aliases were added without a typed handoff contract.
- **Customer consequence:** A failed or unverified PDF can advance to `pdf_generating`/`publishing`, where later publication errors appear unrelated.
- **Reproduction:** Inspect the helper return object and the worker's post-call checks; force a recoverable artifact result.
- **Recommended repair:** Define one immutable artifact-resolution contract, validate it immediately, and make `recovery_required` a hard branch that records evidence and requeues/blocks without later-stage transitions.
- **Regression proof required:** Missing path, provider failure, unverified artifact, and successful artifact cases with exact state transitions.

#### AUDIT-022 — Section disposition receipts are vulnerable to omission at the worker boundary

- **Severity:** P1
- **Product:** Shared
- **Subsystem:** PDF quality manifest and section gating
- **Files / symbols:** `api/admin-run-worker.js` call to `ensureReportDownloadArtifact`; `api/_lib/report-delivery-output.js`; `api/_lib/final-pdf-publication-quality-boss.js`
- **Observed defect:** The renderer returns `section_disposition_receipts`, while the worker's artifact call path does not consistently pass that receipt object. The artifact helper can fall back to a deterministic seal or an empty object. A missing receipt set can weaken evidence for omitted or constrained sections.
- **Root cause:** Snake-case and camel-case receipt names are resolved opportunistically instead of through a required manifest contract.
- **Customer consequence:** A PDF may be visually safe while its manifest cannot prove why optional sections were omitted or shown.
- **Reproduction:** Trace the worker artifact call and helper fallback; force a renderer response without a seal receipt and inspect manifest count.
- **Recommended repair:** Make section receipts required for every generated artifact, validate count and keys before PDF generation, and persist them unchanged in the final manifest.
- **Regression proof required:** Missing optional sections, source-limited sections, full-support sections, and manifest receipt equality tests.

#### AUDIT-023 — Report identity resolves contradictory mode/type inputs by precedence

- **Severity:** P1
- **Product:** Shared
- **Subsystem:** Report identity and publication lineage
- **Files / symbols:** `api/_lib/report-identity-authority.js`; callers in Screening and Underwriting renderers and publication code
- **Observed defect:** The identity resolver gives mode precedence over type when both are supplied, rather than rejecting a contradictory pair. The receipt may be internally canonical while the caller's product identity and report type disagree.
- **Root cause:** Identity normalization is permissive at the boundary.
- **Customer consequence:** Wrong title, PDF anchor, report family, or publication lineage can be associated with a valid report.
- **Reproduction:** Call the resolver with `reportMode: screening_v1` and `reportType: underwriting`; inspect the returned canonical identity and caller payload.
- **Recommended repair:** Reject contradictory inputs before rendering. Require one canonical identity receipt to be passed to every stage and SQL finalizer.
- **Regression proof required:** All valid identities plus every contradictory mode/type combination.

#### AUDIT-024 — Source selection has competing debt and acquisition precedence heuristics

- **Severity:** P1
- **Product:** Underwriting
- **Subsystem:** Source reconciliation and optional support authority
- **Files / symbols:** `api/_lib/full-underwriting-valuation-reconciliation-v1.js`; `api/_lib/institutional-financial-intelligence.js`; source/support adjudicator modules
- **Observed defect:** Several modules independently choose the first acceptable NOI, cap rate, purchase price, debt, appraisal, and support document. Candidate order differs across customer-surface, boss contract, source package, core metrics, acquisition projection, and support documents.
- **Root cause:** Source precedence is encoded in arrays in multiple modules rather than one adjudication receipt.
- **Customer consequence:** The same support package can produce different valuation, debt, or acquisition outputs depending on the entry point.
- **Reproduction:** Trace `resolveCanonicalInputs` and institutional financial intelligence candidate lists; compare selected source paths in artifacts.
- **Recommended repair:** Persist one source-adjudication result with candidate list, selected value, suppressed alternatives, and reason. All consumers must use it.
- **Regression proof required:** Conflicting support documents with deterministic selected source and identical output across entry points.

### P2 findings

#### AUDIT-025 — Generic report-contract financing regex creates false positives

- **Severity:** P2
- **Product:** Underwriting
- **Subsystem:** QA diagnostics
- **Files / symbols:** `api/_lib/report-contract-qa.js` financing-readiness checks around lines 2292–2326
- **Observed defect:** A Quality Manifest row mentioning “Transaction / proposed financing support” is treated as though it must contain every financing field. This creates an `ACQUISITION_FINANCING_READINESS_INCOMPLETE` finding even when canonical acquisition support and fields are present elsewhere.
- **Root cause:** Broad row-level text matching replaces structured receipt validation.
- **Customer consequence:** Noisy internal QA and unnecessary admin review.
- **Reproduction:** Use the live Underwriting manifest and inspect the finding against the canonical support-document artifact.
- **Recommended repair:** Validate the structured acquisition financing receipt and its source-backed field availability.
- **Regression proof required:** Full and partial financing fixtures with no false positives.

#### AUDIT-026 — Renovation eligibility validator is behind the renderer's current schema

- **Severity:** P2
- **Product:** Underwriting
- **Subsystem:** Optional section eligibility and QA
- **Files / symbols:** `api/_lib/report-contract-qa.js`; `api/_lib/report-surface-contracts.js`; renovation renderers
- **Observed defect:** QA expects older eligibility fields and reports render drift where the canonical state says the section is eligible but the rendered section uses a constrained source-supported capital program.
- **Root cause:** Section eligibility schema evolved without a versioned validator contract.
- **Customer consequence:** Optional renovation analysis is flagged or suppressed unnecessarily.
- **Reproduction:** Live Underwriting QA showed a high advisory for renovation drift while the source manifest contained accepted support and the report rendered the capital program.
- **Recommended repair:** Version section eligibility and validate the canonical receipt plus visible disposition, not old field names.
- **Regression proof required:** No renovation, structured renovation, and partial renovation fixtures.

#### AUDIT-027 — Report generation exposes broad generic 500 paths that lose context

- **Severity:** P2
- **Product:** Shared
- **Subsystem:** API error handling and observability
- **Files / symbols:** `api/admin-run-worker.js`; `api/_lib/generate-client-report-impl.js`; `api/parse/extract-job-text.js`; `api/parse/parse-doc.js`; `api/parse/classify-documents.js`; customer boundary/download handlers; `api/legal-acceptance.js`
- **Observed defect:** Many paths return a status 500 with a short string or `Unexpected server error`. Some include a database message, but most do not include invocation/job/stage/attempt IDs or a persisted error event.
- **Root cause:** Route-level response handling evolved independently from worker diagnostics.
- **Customer consequence:** Operators cannot tell whether a failure is recoverable, whether a credit was restored, or whether a report artifact exists.
- **Reproduction:** Static inventory below; force representative database, storage, parser, and provider errors.
- **Recommended repair:** Use a shared structured error envelope and an event-first policy. Persist the detailed internal error, return a safe correlation ID, and classify retryability explicitly.
- **Regression proof required:** Every 500 path has an inventory entry, structured event, correlation ID, and retry disposition.

#### AUDIT-028 — Test hooks bypass the real publication lifecycle

- **Severity:** P2
- **Product:** Shared
- **Subsystem:** Test trust
- **Files / symbols:** `api/_lib/generate-client-report-impl.js` (`__test_return_final_html` / `isFullRenderHarness`); `scripts/phase8-visual-certification-fixtures.js`; `tests/qa/full-underwriting-gates-full-render-smoke.js`; `tests/qa/run-all.js`
- **Observed defect:** Full-render tests return successful HTML before PDF storage and atomic publication. Phase 8 fixtures assert HTTP 200, `success: true`, and `<!DOCTYPE html>`, but not customer-visible published state.
- **Root cause:** Renderer certification and lifecycle certification share a harness without a hard boundary.
- **Customer consequence:** Green tests can coexist with queued or dead-lettered live jobs.
- **Reproduction:** Run the fixture renderer and inspect its response; `reportId`, storage, and publication are intentionally bypassed.
- **Recommended repair:** Keep renderer tests separate and add a real service-level lifecycle test using a disposable database/storage namespace and the same worker route.
- **Regression proof required:** Both harness and true lifecycle suites; no launch certification may pass on HTML alone.

#### AUDIT-029 — DocRaptor test mode is a launch configuration gate

- **Severity:** P2 before launch, P1 before production activation
- **Product:** Shared
- **Subsystem:** PDF provider governance
- **Files / symbols:** `api/_lib/report-delivery-output.js`; `api/_lib/docraptor-mode-governance.js`; live deployment environment
- **Observed defect:** Live report artifacts are governed as test-mode PDFs. Production ownership authorization and production artifact mode are not active.
- **Root cause:** Intentional prelaunch safety configuration remains in the release path.
- **Customer consequence:** A nominally published report may not be a production-certified customer PDF, and switching modes without a controlled gate could create a new untested path.
- **Reproduction:** Inspect live manifest `DOCRAPTOR_NOT_PRODUCTION_MODE` and deployment configuration.
- **Recommended repair:** Keep test mode while repairing the pipeline. Before launch, run one owner-authorized production-mode certification with cost, storage, and PDF validation recorded.
- **Regression proof required:** Test-mode hold, authorized production-mode run, and unauthorized activation rejection.

## D. Canonical-concept divergence matrix

The intended canonical authority is the source-truth package plus deterministic calculation receipts. Product scope may change which optional sections appear, but it must not change shared source values, units, formulas, or terminology.

| Concept | Canonical authority / formula | Competing implementation | Conflict | Customer-visible? | Severity |
|---|---|---|---|---|---|
| GPR | Accepted T12 Gross Potential Rent from `sourceTruthPackage.core.t12`; annual currency | `generate-client-report-impl.js` `execGpr`, base contract fallbacks, T12 aliases | Candidate and fallback paths differ; undefined `canonicalGpr` path exists | Yes | P1 |
| EGI | Accepted T12 Effective Gross Income | `t12Payload`, core metrics, base contracts | Product entry points can select different fallback values | Yes | P1 |
| Operating expenses | Accepted T12 total operating expenses | `execOpex`, expense reconciliation, base contracts | Different source and denominator fallback chains | Yes | P1 |
| NOI | Accepted T12 NOI | Valuation `firstPositiveMoney`, acquisition NOI basis fallback | Negative canonical NOI can be replaced by positive assumption | Yes | P1 Additional |
| Expense ratio | OPEX / EGI, ratio units | `generate-client-report-impl.js`, chapter and operating base contracts | Recomputed independently; rate heuristic can alter units | Yes | P1 |
| NOI margin | NOI / EGI, ratio units | `generate-client-report-impl.js`, chapter/operating contracts | Repeated formulas and thresholds | Yes | P1 |
| Operating Cost Coverage Ratio | OPEX / T12 GPR; never physical occupancy | `breakEvenOccupancy`, `operatingCushionPct`, base narratives | Retired term and occupancy comparison remain active | Yes | P0 |
| Physical occupancy | Occupied units / total units from Rent Roll | Screening executive prose compares it to OCCR/break-even | Different concept used as denominator/threshold comparator | Yes | P0 |
| Rent Roll occupancy | Rent Roll occupied / total units, point-in-time | Parser payload, `execOccupancy`, customer surface | Multiple aliases and partial-sample behavior | Yes | P1 |
| Rent-to-market gap | Market annual rent minus in-place annual rent divided by in-place annual rent | `marketRentPremiumPct`, base annual gross rent gap | Source and denominator vary between paths | Yes | P1 |
| Rent Roll vs T12 variance | RR annual in-place minus T12 GPR divided by T12 GPR | `normalizeReconciliationVariance`, deterministic core reconciliation | Thresholds and public classification wording differ | Yes | P1 |
| DSCR | NOI / annual debt service | Deterministic DSCR, debt base current/proposed paths | Debt-source selection and role labels can differ | Yes | P1 |
| Current debt | Existing debt evidence and current annual debt service | Mortgage payload, loan term sheet, institutional financial intelligence | Candidate order and role aliases differ | Yes | P1 |
| Proposed debt | Source-backed acquisition financing terms | Acquisition assumptions, proposed financing context, debt intelligence | Optional support and fallback precedence differ | Yes | P1 |
| Cap rate | NOI / value or accepted source-backed going-in cap rate, explicit ratio units | `toCapRatio`, valuation reconciliation, base contract | Magnitude heuristic and source precedence vary | Yes | P1 Additional |
| Valuation | NOI / accepted going-in cap rate; scenario engine for sensitivities | Valuation v1, base chapter calculations, acquisition projection | Multiple candidate inputs and repeated computations | Yes | P1 |
| Purchase price | Source-backed acquisition assumption | Customer surface, core metrics, purchase assumptions, valuation | First-positive fallback can select a different source | Yes | P1 |
| Price per unit | Purchase price / accepted units | Chapter base and valuation v1 | Unit source can differ | Yes | P1 |
| Debt service | Amortization formula from role-specific principal/rate/term | Debt base, deterministic debt-service helper, institutional intelligence | Repeated payment formulas and inputs | Yes | P1 |
| Refinance capacity | Role-specific debt capacity analysis from accepted NOI and debt | Debt risk and intelligence modules | Separate candidate and maturity rules | Yes | P1 |
| Capital plan | Source-backed renovation/capital documents, constrained if partial | Capital plan analysis, renovation renderer, QA eligibility | Validator schema lags current renderer | Yes | P2 |
| Scenario / sensitivity outputs | Governed scenario engine with explicit assumptions and no source-evidence status | Full underwriting scenario engine, valuation reconciliation, narrative renderers | Scenario authority is repeated and downstream labels vary | Yes | P1 |
| Report classification | Canonical visible classification state and source-reconciliation cap | Screening bands, Underwriting classification, stale QA expected labels | Thresholds/labels differ; obsolete Review label survives | Yes | P1 |
| Source reconciliation | Canonical RR/T12 comparison and disclosure | `report-surface-contracts.js`, deterministic core reconciliation, report QA | Competing thresholds, disclosure and classification rules | Yes | P0/P1 |
| Data sufficiency | Core source states plus support-document authority | Admission gate, source package, section eligibility, constitutional lifecycle | Admission, source package, and retry rules disagree | Yes | P1 |
| Report identity | `canonical_report_identity_v3` | Caller `report_type`, `report_mode`, legacy aliases | Contradictory inputs resolve by precedence | Yes, PDF title/metadata | P1 |
| Report family | Screening or full_underwriting family tied to product identity | Legacy `underwriting`, `v1_core`, acquisition-memo adapters | Adapters can carry old family names | Yes, publication lineage | P1 |

## E. State-machine and retry matrix

| From | To | Trigger | Attempt consumed? | Resume / restart | Bounded? | Defect |
|---|---|---|---|---|---|---|
| `needs_documents` | `queued` | Admission receipt and purchase entitlement | No worker attempt | Starts extraction | Yes if admission is canonical | Admission/test doctrine mismatch (AUDIT-010) |
| `needs_documents` | `needs_documents` | Missing core/support or invalid staged files | No | User must repair/upload | Yes | Current customer copy may not clearly state next action; keep product-specific rules explicit |
| `queued` | `extracting` | `claim_worker_job` | Yes, increments attempt | Extraction from durable artifacts | SQL ceiling | Claim and scanner fairness issues (AUDIT-007) |
| `extracting` | `underwriting` | Core extraction accepted | Same attempt | Continues current attempt | Only if all calls fit budget | Sequential parser calls consume budget |
| `extracting` | `queued` | Parser/provider timeout or worker defer | Usually yes on next claim | Parsed artifacts may be reused; failed parser may restart | Retry ceiling | Retry classification and checkpoint inventory can be wrong (AUDIT-005, 018) |
| `underwriting` | `scoring` | Underwriting analysis complete | Same attempt | Continues | Budget-dependent | Shared metric/source precedence can drift (AUDIT-012, 024) |
| `scoring` | `rendering` | Scoring handoff | Same attempt | Re-enters renderer | Requires 225 seconds left | Valid Underwriting job deferred at ~215 seconds (AUDIT-005) |
| `rendering` | `queued` | Insufficient render window | Yes on future claim | Reuses some artifacts but can redo analysis | Nominally bounded; can starve | Timebox incompatibility and queue monopoly (AUDIT-005, 007) |
| `rendering` | `pdf_generating` | HTML/report artifact accepted | Same attempt | Uses report ID/storage path | Only if provider path fits | Artifact retry result not consistently honored (AUDIT-021) |
| `pdf_generating` | `publishing` | PDF verified and delivery allowed | Same attempt | Uses storage/report linkage | Depends on uncovered calls | Heartbeat does not cover PDF/storage (AUDIT-020) |
| `publishing` | `published` | `finalize_worker_publication_v2` | No new attempt | Atomic receipt and current revision | Yes at SQL boundary | Strong final gate; upstream aliases/manifest can block it |
| `publishing` | `queued` | Manifest lookup/artifact/publication retry | Yes on next claim | Should resume at publication checkpoint | Retry ceiling | Camel/snake return mismatch and deterministic retries (AUDIT-006, 021) |
| Any active stage | `failed` | `fail_expired_worker_job` or non-terminal failure | Usually no new claim yet | Customer sees failure; credit restoration policy applies | SQL base limit | Timeout sweep may skip failure after recovery-required result (AUDIT-004) |
| Any active stage | `dead_letter` | Retry ceiling or terminal insufficiency | No further claim | Entitlement restore event | Yes | Valid deterministic contract failures dead-letter (AUDIT-006) |
| Any active stage | Same active stage | Lease expires while recovery is rejected | No | Remains active | **No** | Owner mismatch can leave expired rows active (AUDIT-004) |
| `failed` | `queued` | Admin/recovery requeue with open episode | New attempt on claim | Retains checkpoint fields; claim resets extracting | Episode budget | Recovery owner and terminal policy must agree |
| `dead_letter` | `queued` | Admin requeue with recovery budget | New attempt | Recovery episode rules | Yes if SQL episode ceiling works | Timeout/failure ceilings are not fully aligned |
| `published` | `published` | Idempotent finalizer replay | No | Returns existing receipt if all lineage checks pass | Yes | This is the strongest lifecycle path |

### Retry and entitlement conclusions

- A normal claim increments `worker_attempt_count`; a requeue itself usually does not increment until the next claim, but it still causes another attempt and can consume the bounded budget.
- Requeue retains some checkpoint fields, but the next claim resets `last_checkpoint` to `extracting`; stage-specific resumption is therefore incomplete.
- A deterministic contract failure is retried as though it were transient.
- SQL claim exhaustion atomically dead-letters and restores entitlement, but JavaScript may report `failedCount: 0` or `creditRestoration: null` when the SQL row has already become `dead_letter`.
- The live jobs' entitlement-restored events prove the restoration path executed, but the worker response did not consistently expose that final disposition.

## F. Customer-surface terminology matrix

| Current or observed term | Intended status | Where observed | Risk / required action |
|---|---|---|---|
| `Break-Even Occupancy` / `break-even occupancy` | Prohibited retired public term | Screening renderer, base operating contract, legacy narrative helpers | Replace with Operating Cost Coverage Ratio and remove physical-occupancy comparison (P0) |
| `Operating Cost Coverage Ratio` | Canonical public term | Current contract rows and selected render paths | Make the sole vocabulary and receipt key |
| `Occupancy less Break-Even Occupancy` | Prohibited semantic framing | Legacy Screening/Underwriting narrative paths | Replace with separate physical occupancy and OCCR facts |
| `RECONCILIATION REQUIRED` | Internal shorthand that needs plain-language explanation | Source reconciliation / readiness surfaces | Pair with “Rent Roll and T12 totals differ; InvestorIQ discloses the variance and does not infer the cause.” |
| `Review - Source Reconciliation Disclosure` | Stale classification label | Report QA expectations and rationale helper | Use canonical visible classification state and current disclosure copy |
| `BUY`, `SELL`, `HOLD` | Prohibited public language | QA doctrine regex; `HOLD` also matches ordinary hold-period text | Token scan must distinguish prohibited recommendation from factual hold period; renderer must avoid recommendation language |
| `investment advice` / `investment recommendation` | Prohibited public language | Underwriting debt footer and QA regex | Use approved limitation wording without the prohibited token |
| `Underwriting Report` | Legacy/ambiguous title in parts of the system | Report identity aliases and older copy | Use the approved customer title consistently; identity authority must reject contradictory type/mode inputs |
| `Investment Committee Memorandum` | Approved Underwriting customer title | Current editorial doctrine and identity expectations | Ensure PDF title, metadata, cover, and anchors agree |
| `Full Underwriting` | Internal product/family term | Cover, report family, adapters, QA | Keep internal where required; do not leak as a contradictory customer title |
| `T12 totals only` | Source limitation/disclosure | Screening live delivery blockers and source coverage QA | Explain what is omitted and why; do not let stale QA turn it into a generic failure |
| `customer_publish_eligible` | Legacy delivery alias | Live Screening payload | Remove or derive from one canonical delivery decision |
| `admin_review_required` | Internal disposition | Live Underwriting aliases and QA | Must not coexist with `deliverable` without an explicit advisory-only meaning |
| `needs_documents` / “Needs attention” | Customer status | Failure/blocked surfaces | Provide a concrete next action and preserve whether the report was never published |

## G. 500 and failure-path register

This is the worker and worker-adjacent inventory of paths that can return HTTP 500 or produce an equivalent opaque failure. The issue is not that every 500 is wrong; the issue is that each must be classified, correlated, and tested.

| Route / path | Trigger | Current response / evidence | Observable enough? | Customer / retry effect |
|---|---|---|---|---|
| `/api/admin-run-worker` bootstrap | Missing Supabase/admin configuration | 500 misconfiguration response around line 274 | Partly; no invocation artifact | Scheduler cannot work |
| `/api/admin-run-worker` column probes | Supabase gateway timeout or schema probe error | 500 `Failed to detect analysis_jobs columns`; live 11 occurrences | **No** job/stage/query correlation | Queued jobs remain; scheduler falsely appears active |
| Worker audit-event writes | Insert failure in control/recovery paths | Many `Failed to write audit event` 500 returns | Partly; often only database message | Original failure may be masked |
| Worker requeue writes | Requeue RPC error | 500 `Failed to requeue job` | Partly | Retry/recovery path stops ambiguously |
| Worker timeout artifact writes | Artifact insert failure | 500 `Failed to write timeout artifacts` | Partly | Timeout disposition unclear |
| Worker queue fetch | Queue query error | 500 `Failed to fetch queued jobs` | Partly | No jobs claimed |
| Worker extracting/underwriting/scoring fetches | Stage query error | 500 stage-specific fetch messages | Partly | Existing work may be left active |
| Worker late catch | Any unclassified exception, including lexical-scope error | 500 `Unexpected server error` at outer handler | **No** reliable original error | Retry classification lost |
| `/api/generate-client-report` admin configuration | Missing `INTERNAL_REGEN_KEY` or `ADMIN_RUN_KEY` | 500 server misconfigured | Yes for config, no deployment correlation | Request blocked |
| Report generator HTML truncation | Incomplete HTML / missing closing tags | 500 `REPORT_HTML_TRUNCATED` | Partly; artifact attempted | Worker may treat as renderer failure |
| Report generator incomplete HTML | Missing Section 12 / incomplete template | 500 `REPORT_HTML_INCOMPLETE` | Partly | Retry can repeat deterministic defect |
| Report generator outer catch | Any unclassified render exception | 500 with error code classified as report-render failure | Better than worker, still no invocation/attempt | Retry may be wrong |
| `/api/parse/extract-job-text` configuration | Missing service key | 500 configuration response | Partly | Extraction cannot begin |
| Extract job files | Database query failure | 500 `Failed to fetch job files` | Partly | Job remains blocked |
| Extract outer catch | Any unclassified extraction error | 500 `Unexpected server error` | **No** structured source/file context | Parser retry ambiguity |
| `/api/parse/parse-doc` parser/write paths | Table/artifact/status update failures | Several 500s include database message | Partly | Valid fallback can be lost |
| Parse outer catch | Any unclassified parse error | 500 `Unexpected server error` | **No** source hash/file context | Retry and source sufficiency unclear |
| `/api/parse/classify-documents` config/query/update/artifact paths | Configuration, files query, type update, artifact insert | 500 messages with limited context | Partly | Admission/source package may not form |
| Customer boundary handlers | Job, entitlement, report, family, removal lookup failures | Named 500 codes such as `JOB_LOOKUP_FAILED` | Better, but no correlation ID | Dashboard/download unavailable |
| Customer report download | Missing configuration or report lookup failure | `SERVER_MISCONFIGURED` / `DOWNLOAD_REPORT_LOOKUP_FAILED` | Partly | Published report may be inaccessible |
| Legal acceptance | Read/write/record errors | Several named and generic 500s | Partly | Admission disclosure cannot complete |
| Admin quality incidents | Manifest/read/insert/dashboard failures | Named or generic 500 | Partly | Incident evidence can be lost |

**Required standard:** Every 500 path must persist a structured event before responding where possible, containing `invocation_id`, `job_id`, `worker_attempt_id`, `worker_claimed_by`, `stage`, operation, elapsed milliseconds, error code, safe message, retryability, and final disposition. The HTTP response should return only a safe correlation ID and a stable public error code.

## H. Launch blocker list

### P0 — must fix before another production test

1. **AUDIT-001:** Remove retired Break-Even Occupancy semantics and pass Screening's deterministic seal.
2. **AUDIT-002:** Repair worker bootstrap timeout handling and observability; no recurring unexplained worker 500s.
3. **AUDIT-003:** Fix the out-of-scope `verifiedPublicationCheckpoint` reference and prove late-error preservation.
4. **AUDIT-004:** Repair expired-job owner fencing so no expired active job can remain stranded.
5. **AUDIT-005:** Replace incompatible worker/render/PDF timeboxes with one cancellable end-to-end deadline and durable stage checkpoints.
6. **AUDIT-006:** Stop retrying deterministic publication-contract failures; classify them as internal release defects and preserve the customer/credit disposition.
7. **AUDIT-007:** Fix queue fairness and candidate exhaustion so two legitimate products make progress across successive invocations.
8. **AUDIT-008:** Resolve the Underwriting renderer/validator public-language contradiction.

### P1 — must fix before launch

1. AUDIT-009 stale report-contract QA rules.
2. AUDIT-010 obsolete lifecycle/admission test doctrine.
3. AUDIT-011 duplicated base/wrapper semantic authority.
4. AUDIT-012 Screening/Underwriting shared-metric continuity.
5. AUDIT-013 parser recovery out-of-scope hash.
6. AUDIT-014 undefined `canonicalGpr` fallback.
7. AUDIT-015 invalid NOI precedence in valuation.
8. AUDIT-016 unsafe ratio-unit normalization.
9. AUDIT-017 undefined acquisition-state fallbacks.
10. AUDIT-018 incorrect parsed-checkpoint inventory.
11. AUDIT-019 scheduler live-state versus handoff authority.
12. AUDIT-020 PDF/storage outside bounded heartbeat.
13. AUDIT-021 artifact retry handoff shape and state transition.
14. AUDIT-022 required section-disposition receipts.
15. AUDIT-023 strict report identity validation.
16. AUDIT-024 one source-adjudication precedence receipt.

### P2 — may follow launch only after P0/P1 certification

1. AUDIT-025 financing QA false positive.
2. AUDIT-026 renovation eligibility validator drift.
3. AUDIT-027 shared error envelope and full 500 inventory implementation if not already included in P0 bootstrap work.
4. AUDIT-028 separation of renderer harness from true lifecycle tests.
5. AUDIT-029 controlled DocRaptor production-mode activation. This is a launch gate, not a reason to activate production mode during repair.

## I. Dependency-aware repair order

1. **Freeze operational exposure.** Keep the live scheduler and customer generation path on hold until the P0 fixes are staged. Record live scheduler state and do not rely on handoff text alone.
2. **Create one contract vocabulary package.** Define canonical source facts, units, formulas, public labels, prohibited aliases, classification thresholds, and provenance receipts. Start with GPR, EGI, OPEX, NOI, OCCR, physical occupancy, Rent Roll occupancy, rent-to-market gap, and RR/T12 reconciliation.
3. **Remove semantic repair layers.** Make Screening and Underwriting consume the same canonical shared receipts. Keep product-specific scope and optional sections in wrappers; remove base-module construction of retired terms.
4. **Repair failure classification and lexical safety.** Fix the checkpoint scope bug, classify deterministic contract failures as non-retryable, and create structured error events before response handling.
5. **Redesign the worker deadline.** Set one end-to-end deadline, pass cancellation through renderer/PDF/storage calls, renew leases against it, and persist stage checkpoints. Do not tune only the 210/225 values.
6. **Unify ownership and timeout recovery.** Use the persisted worker owner and attempt ID, or introduce a narrowly scoped SQL recovery operation. Ensure every expired active job reaches a persisted disposition.
7. **Repair queue fairness.** Use durable retry timing, database-level locking, bounded claims, product/family fairness, and no candidate window that permanently hides eligible jobs.
8. **Unify artifact/publication handoff.** Require one typed artifact result, one naming convention, complete section receipts, one delivery decision, and immediate recovery branching. Retain the strong `finalize_worker_publication_v2` SQL gate.
9. **Migrate downstream QA.** Delete stale heading, classification, renovation, and financing regex rules. QA should validate canonical receipts and actual rendered excerpts.
10. **Reconcile tests and live configuration.** Update/remove obsolete Phase 6 tests, add true lifecycle tests, and make scheduler and DocRaptor mode part of release metadata.
11. **Run certification in test mode first.** Prove both products, then simultaneous/back-to-back jobs, then a controlled authorized production-mode PDF test. No launch declaration before all gates pass.

## J. Final certification plan

Certification must be run against a clean, immutable source SHA and the actual deployed runtime. Renderer-only test hooks cannot satisfy lifecycle certification.

### 1. Static authority checks

- One canonical source-truth and calculation package owns every shared metric.
- No public surface contains `break-even occupancy`, `Break-Even Occupancy`, `occupancy less break-even`, or equivalent retired aliases.
- No public surface contains recommendation language or the renderer's prohibited limitation tokens.
- No `no-undef` diagnostics in worker, parser, report generator, or publication modules.
- Every report identity input pair is either canonical or rejected.
- Every artifact handoff has one versioned schema and one naming convention.
- Every retryable error code is explicitly listed; deterministic contract failures are excluded from automatic retry.

### 2. Deterministic calculation and terminology tests

For one fixed source fixture, assert exact values, units, and provenance for:

- GPR, EGI, operating expenses, NOI
- expense ratio and NOI margin
- OCCR = accepted OPEX / accepted T12 GPR
- physical and Rent Roll occupancy as separate metrics
- rent-to-market gap
- RR/T12 variance and disclosure
- current and proposed debt, debt service, and DSCR
- cap rate, valuation, purchase price, price per unit, refinance capacity
- capital plan and scenario outputs
- classification, data sufficiency, report identity, and family

Run boundary tests for missing, zero, negative, decimal-ratio, percentage-point, and conflicting-source inputs. The 1.5 normalization boundary must disappear or be governed by field units.

### 3. State-machine tests

For every row in the state matrix:

- assert legal owner, lease, attempt, checkpoint, and artifact requirements;
- assert the exact persisted transition and event;
- assert stale owner and stale attempt responses;
- assert an expired job always reaches queued, failed, or dead-letter;
- assert published replay is idempotent and cannot create a second receipt;
- assert publication cannot occur without the canonical delivery decision, storage object, manifest, and lineage.

### 4. Queue and retry tests

Use a disposable namespace with:

- two Screening and two Underwriting jobs admitted at the same time;
- one old repeatedly deferred job;
- more than 250 eligible queue rows;
- a transient provider timeout;
- a deterministic contract failure;
- a missing optional document;
- a lease-expiry race;
- a duplicate scheduler invocation.

Required results:

- both products claim and progress in successive invocations;
- no job remains active after its lease expires;
- deterministic failure stops without retry exhaustion;
- transient failure is retried within the declared budget;
- checkpoints resume the correct stage;
- no credit is consumed twice and no credit is restored twice;
- queue response counts match actual persisted job dispositions.

### 5. Production build and configuration

- `npm run qa` passes with no obsolete-contract assertions.
- `npm run test:e2e` passes against current doctrine.
- `npm run build` passes.
- Deployment is from a clean, recorded commit SHA.
- Scheduler state, worker key, PDF mode, storage bucket, and database migrations are recorded and match the release authority.
- DocRaptor production mode is enabled only in a deliberate owner-authorized certification run.

### 6. Screening end-to-end proof

With valid T12 and Rent Roll documents:

1. admit and purchase the Screening job;
2. claim it through the real worker;
3. record source extraction and canonical receipts;
4. render HTML and generate the PDF;
5. store the PDF and manifest;
6. finalize through `finalize_worker_publication_v2`;
7. verify `analysis_jobs.status = published`, one current report revision, one complete publication receipt, and customer download visibility;
8. verify the PDF contains canonical Screening identity and OCCR language with no retired terminology;
9. verify no unexplained 500, requeue loop, or credit restoration.

### 7. Underwriting end-to-end proof

With the same core documents and at least one valid support document:

1. repeat the full real lifecycle;
2. verify current versus proposed debt roles and DSCR provenance;
3. verify valuation, capital plan, scenario, and optional-section receipts;
4. verify the public-language validator and renderer agree;
5. verify the PDF, manifest, identity, report family, and customer download;
6. verify no stale QA finding blocks a canonical report;
7. verify no unexplained 500 or retry loop.

### 8. Simultaneous/back-to-back proof

Submit Screening and Underwriting jobs back-to-back and run at least three scheduled worker invocations. Both must reach `published`, each must have a PDF and complete receipt, neither may starve the other, and the scheduler's reported counts must match the database.

### 9. Final release acceptance

Launch is permitted only when all of the following are true:

- P0 and P1 findings are closed with linked regression evidence.
- Both products publish from valid source documents.
- PDFs are generated, stored, finalized, and customer-visible.
- No repeated worker 500s remain unexplained.
- No job repeatedly cycles through `queued` and a later stage.
- No stale customer terminology remains.
- No contradictory delivery aliases remain; one canonical decision is exposed.
- No unexpected credit restoration or consumption occurs.
- The scheduler, deployment SHA, database schema, and PDF mode match the release record.

**Audit conclusion:** the product has a strong intended publication constitution and several good deterministic components, but the live worker, semantic authority, validator, and test boundaries are not yet coherent enough for launch. Keep the launch hold until the dependency order above is completed and the full lifecycle certification passes.
