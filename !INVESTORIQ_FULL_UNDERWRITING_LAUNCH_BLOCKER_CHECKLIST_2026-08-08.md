# InvestorIQ Full Underwriting Launch-Blocker Checklist
## 2026-08-08 - Post-Sol Comprehensive Audit

**Purpose:** This is the active working checklist for closing every material finding from the GPT-5.6 Sol Ultra Full Underwriting audit before another production canary or customer launch.

This file is intended to be updated continuously. Check items off only when the stated exit proof is actually satisfied.

---

# 0. Current Authority / Hard Stop

## Current status

- [x] Gate 1 - PASS / CLOSED
- [x] Gate 2 - PASS / CLOSED
- [x] Gate 3 - PASS / CLOSED at the prior certification boundary
- [x] Gate 4A Production Parity - PASS / CLOSED at the prior evidence boundary
- [x] Gate 4B Constitutional PDF Boss Repair - PASS / CLOSED at the prior repair boundary
- [x] Root publication-authority repair deployed: `3fab9bf9d4bef9f311b174b8fc71eb936ee1b38a`
- [x] DocRaptor observability repair deployed: `94fba3037a2fef76e97e24e15893008e05f8607d`
- [ ] Current Full Underwriting architecture launch-safe
- [ ] Current Full Underwriting final customer PDF certified
- [ ] DocRaptor provider path production-certified
- [ ] Screening production-certified
- [ ] Bundle pricing/configuration repaired and certified
- [ ] Joint commercial launch authorized

## Absolute prohibitions until this checklist reaches the appropriate exit gate

- [ ] **DO NOT create RETEST 43**
- [ ] **DO NOT run another Full Underwriting production canary**
- [ ] **DO NOT run Screening**
- [ ] **DO NOT activate Premium**
- [ ] **DO NOT dispatch the GitHub fallback**
- [ ] **DO NOT mutate scheduler, Supabase production state, Stripe, purchases, credits, reports, or artifacts outside a separately authorized packet**
- [ ] **DO NOT patch historical RETEST jobs**
- [ ] **DO NOT push/deploy local audit repairs until each repair packet is reviewed**
- [ ] **DO NOT treat historical page count as a certification standard**

---

# 1. NEW Governance Finding - DocRaptor Test Mode Was Violated

## Finding

The owner has confirmed that InvestorIQ doctrine required DocRaptor to remain in **testing mode until the reports were satisfactory and explicitly cleared for production mode**.

However, the authenticated production configuration previously documented:

`DOCRAPTOR_MODE=production`

and the DocRaptor account now shows:

- **Production Docs: 5 / 5 used**
- **Test Docs: 0 / unlimited**
- Billing period shown: **Aug 01, 2026 - Aug 31, 2026**

The owner did **not** authorize consuming the production-document quota for the recent report/debugging cycle.

### Classification

**P0 GOVERNANCE / LAUNCH-CONTROL DEFECT**

This is not merely a quota inconvenience. It proves configuration authority drifted away from the owner's testing doctrine.

### Required repair

- [ ] Trace exactly when and why `DOCRAPTOR_MODE` became `production`.
- [ ] Identify the commit, environment change, prompt, runbook, or manual action that authorized or caused the mode change.
- [ ] Verify whether `ALLOW_PRODUCTION_PDF=true` or another resolver can override/indirectly force production DocRaptor behavior.
- [ ] Restore DocRaptor to the owner-authorized **test mode** for all further report development/certification work.
- [ ] Verify test-mode requests do not consume the production quota.
- [x] Add a deterministic configuration guard/test so production DocRaptor mode cannot activate without explicit owner authorization.
- [x] Add an observable startup/request receipt showing the resolved DocRaptor mode without exposing secrets.
- [x] Ensure emergency/core-safe PDF paths use the same governed mode.
- [ ] Document the exhausted `5/5` production quota and its reset date in active authority docs.
- [ ] Do not attempt a production-mode DocRaptor certification request until the owner separately authorizes it and production quota is available.

### Exit proof

- [ ] Repository proof of the mode resolver.
- [ ] Environment proof of the intended test-mode value.
- [ ] Focused test proving test mode is honored.
- [ ] One controlled **test-mode** DocRaptor request succeeds using the real shared renderer.
- [ ] No production-doc quota consumption occurs during the test-mode proof.

---

# 2. DocRaptor Request Contract and Diagnostics

## 2.1 Proven wrong endpoint

### Finding

Both production-reachable PDF paths used the obsolete/non-API URL:

`https://docraptor.com/docs`

The documented API endpoint is:

`https://api.docraptor.com/docs`

This strongly explains why:
- rich Full Underwriting render returned HTTP 422;
- deterministic emergency-core render returned HTTP 422;
- minimal controlled probe also returned HTTP 422.

### Local repair

- [x] Local commit created: `db6f78b` - `fix: repair DocRaptor request diagnostics`
- [x] Endpoint corrected locally to `https://api.docraptor.com/docs`
- [x] Flat JSON body preserved
- [x] Basic authentication preserved
- [x] `document_type` behavior preserved
- [x] test-mode behavior preserved in code path
- [x] binary response handling preserved
- [ ] Commit reviewed
- [ ] Commit pushed
- [ ] Commit deployed
- [ ] Real provider acceptance proven

### Exit proof

- [ ] Review exact diff of `db6f78b`.
- [ ] Confirm no unrelated changes.
- [ ] Confirm mode remains governed by test/production authority.
- [ ] After the P0 publication repair and test-mode restoration, execute exactly one authorized provider test.
- [ ] Provider returns PDF bytes successfully.

---

## 2.2 Safe XML diagnostics

### Completed locally

- [x] Allow-listed XML extraction for provider error code/type/message/detail.
- [x] Allow-listed validation field.
- [x] Allow-listed request ID/correlation ID.
- [x] DTD/entity rejection.
- [x] malformed XML rejection.
- [x] HTML/request-echo/document-content/credential rejection.
- [x] JSON/plain-text handling preserved.

### Remaining defects

- [ ] Aggregate multi-attempt diagnostics can exceed intended 1,000-character ceiling.
- [ ] Network/no-response failures remain weakly diagnosed.
- [ ] Raw Axios/provider response data can still reach logs.
- [ ] Both provider calls lack explicit timeout/deadline controls.

### Exit proof

- [ ] Entire final serialized provider diagnostic is bounded to the approved ceiling.
- [ ] No raw response body is logged.
- [ ] No customer HTML/source content can enter logs.
- [ ] Network/no-response errors produce safe useful diagnostics.
- [ ] Explicit bounded timeout exists for each provider call.
- [ ] Timeout behavior is tested.

---

# 3. P0 - Publication Visibility Is Not Atomic

## Finding

PDF storage upload and `reports` insertion can occur **before canonical worker publication**.

Report History/customer access can expose an owned report row containing `storage_path` without requiring the canonical job/revision to be published/current.

### Customer risk

A job could:
1. generate/upload a PDF;
2. fail later;
3. restore the customer's entitlement/credit;
4. still leave a downloadable artifact visible.

### Required repair

- [ ] Define one canonical publication authority.
- [ ] Treat generated/uploaded PDF as a **candidate artifact**, not customer-visible publication.
- [ ] Prevent all customer download access before canonical publication.
- [ ] Require published/current revision state for Report History downloadability.
- [ ] Make job -> report -> current revision -> customer visibility one governed publication boundary.
- [ ] Ensure failed/dead-letter/restored jobs cannot expose candidate PDFs.

### Exit proof

- [ ] Real local-Supabase orchestration test proves pre-publication report/artifact is not downloadable.
- [ ] Same test proves publication atomically enables the correct current report.
- [ ] Same test proves failed/restored attempt cannot be downloaded.
- [ ] No source-string-only or mocked-only proof accepted.

---

# 4. P0 - Canonical Job -> Report -> Current Revision Linkage Is Broken

## Finding

`analysis_jobs.report_id` is not reliably persisted.

Revision promotion failure can be ignored.

### Required repair

- [ ] Persist the canonical `analysis_jobs.report_id` on successful publication.
- [ ] Make revision promotion a checked authoritative step.
- [ ] Do not mark the job published if canonical report/revision linkage fails.
- [ ] Preserve exactly one current revision.
- [ ] Preserve lineage for corrections/replacements.

### Exit proof

- [ ] Integration test proves job -> report -> current revision linkage.
- [ ] Integration test proves failed revision promotion cannot silently publish.
- [ ] Historical/failed candidate report rows cannot become current accidentally.

---

# 5. P0 - Generator Publication Is Not Attempt/Lease Fenced

## Finding

A stale worker attempt may continue through generator publication after its lease has expired and after failure/remedy logic has acted.

### Required repair

- [ ] Require active worker attempt identity at publication.
- [ ] Require valid lease/fencing token immediately before publication mutation.
- [ ] Reject stale attempts.
- [ ] Re-check fencing around report insertion/revision promotion/customer visibility.
- [ ] Ensure a refunded/restored stale attempt cannot later publish.

### Exit proof

- [ ] Adversarial test: attempt A lease expires; attempt B or recovery wins; attempt A later tries to publish and is rejected.
- [ ] No duplicate report publication.
- [ ] No post-refund publication.
- [ ] No duplicate entitlement/remedy.

---

# 6. P0 - Generator Still Owns Terminal Job Failure

## Finding

The report generator directly writes terminal job failures in some paths.

This bypasses the intended worker authority for:
- lease fencing;
- failure classification;
- exactly-once remedy;
- entitlement restoration;
- terminal lifecycle ownership.

### Required repair

- [ ] Generator returns bounded typed outcomes only.
- [ ] Worker becomes sole owner of terminal job status changes.
- [ ] Worker becomes sole owner of commercial-remedy decisions.
- [ ] Remove direct terminal mutations from generator/report-delivery paths.
- [ ] Preserve valid-core `publish_required` authority.

### Exit proof

- [ ] Source audit finds no unauthorized generator terminal job writes.
- [ ] Focused orchestration tests prove worker-owned terminalization.
- [ ] Renderer/provider failure cannot independently write customer remedy.

---

# 7. P0 - Failure Classification Can Blame Customer Documents for Infrastructure Faults

## Finding

Parser, database, storage, code, and provider failures can be mapped into customer-document failure families.

### Required taxonomy

Customer/document failures must be distinct from:
- parser implementation failures;
- database failures;
- storage failures;
- provider failures;
- network timeouts;
- internal code failures;
- observability failures.

### Required repair

- [ ] Canonical source insufficiency remains document-owned only when actually proven.
- [ ] Parser crash/error != bad customer document.
- [ ] Provider 4xx/5xx != bad customer document unless provider proves document-specific invalidity.
- [ ] DB/storage failure != missing source.
- [ ] Internal exception != customer fault.
- [ ] Customer messaging follows failure class.
- [ ] Entitlement remedy follows failure class.

### Exit proof

- [ ] Adversarial matrix proves each infrastructure class gets correct system-failure handling.
- [ ] Canonically invalid T12/Rent Roll still fail closed correctly.
- [ ] Valid source documents survive downstream infrastructure faults without being reclassified as invalid.

---

# 8. P0 - Worker Re-derives Source Truth Contradictions

## Finding

The worker independently invents/recalculates a Rent Roll/T12 contradiction check after canonical Source Truth already owns that decision.

### Doctrine violation

Downstream systems must **consume Source Truth**, not rediscover it.

### Required repair

- [ ] Identify all downstream re-derived source contradiction logic.
- [ ] Remove/disable independent contradiction authority.
- [ ] Worker consumes canonical adjudication receipt only.
- [ ] Preserve disclose-only source-reconciliation issues such as the known GPR variance when canonical authority says publishable.
- [ ] Add contract test forbidding downstream source-authority re-derivation.

### Exit proof

- [ ] Only canonical Source Truth can establish core contradiction status.
- [ ] Worker cannot terminalize based on its own alternate formula.
- [ ] Valid-core publication remains stable.

---

# 9. P0 - Observability / Telemetry Can Terminalize or Strand Jobs

## Finding

Event or telemetry write failures can fail or strand otherwise valid jobs.

### Required repair

- [ ] Classify observability writes as non-authoritative unless the record is itself legally/constitutionally required.
- [ ] Fail open for ordinary telemetry.
- [ ] Preserve bounded best-effort diagnostics.
- [ ] Do not permit logging/event errors to trigger customer-document failures.
- [ ] Do not permit observability write failure to strand a job in a nonterminal lifecycle state.

### Exit proof

- [ ] Injected telemetry failure does not block valid publication.
- [ ] Injected telemetry failure does not create duplicate remedy.
- [ ] Core audit records that truly are mandatory are explicitly named and handled separately.

---

# 10. P0 - Raw Provider Response Data Can Reach Logs

## Finding

Raw Axios/DocRaptor provider response data may still be logged.

Provider errors can potentially echo submitted HTML/customer content.

### Required repair

- [ ] Remove raw `err.response.data` logging.
- [ ] Route all provider errors through bounded safe sanitizer.
- [ ] Prohibit full customer HTML/request payload logging.
- [ ] Prohibit credentials/API keys/auth headers.
- [ ] Add regression tests for request echo, HTML echo, XML entities, malformed provider bodies, and oversized responses.

### Exit proof

- [ ] Source scan finds no raw provider body logging.
- [ ] Tests prove only allow-listed bounded fields survive.
- [ ] Logs remain useful enough to identify provider request ID/status/error category.

---

# 11. P1 - No Explicit Timeout for DocRaptor / Internal HTTP

## Finding

DocRaptor and some internal fetch/self-HTTP paths lack explicit bounded timeouts.

### Risk

Hung calls can outlive worker leases or server runtimes.

### Required repair

- [ ] Define bounded provider timeout.
- [ ] Define bounded internal request timeout.
- [ ] Align timeout with worker lease/runtime budget.
- [ ] Abort cleanly on timeout.
- [ ] Classify timeout as infrastructure/provider failure, not customer-document failure.

### Exit proof

- [ ] Deterministic timeout tests.
- [ ] Lease remains governed.
- [ ] No stranded rendering/publishing state.

---

# 12. P1 - Test Realism Is Too Weak

## Finding

Many green tests:
- monkey-patch Axios;
- inspect source strings;
- use fake Supabase state;
- test pure helpers only.

They cannot prove:
- DNS/TLS;
- redirects;
- provider acceptance;
- real database linkage;
- customer visibility;
- transactional lifecycle.

### Required repair

- [ ] Keep focused pure unit tests.
- [ ] Add real local-Supabase orchestration test for publication authority.
- [ ] Add real shared-renderer provider test in DocRaptor test mode.
- [ ] Add attempt-fencing integration test.
- [ ] Add Report History/download visibility integration test.
- [ ] Add final PDF text reconciliation test.
- [ ] Add page-by-page visual certification after real PDF exists.

### Known stale tests to repair or retire

- [ ] RETEST 32 obsolete forced-recomposition expectation.
- [ ] Stale customer identity expectation for `Acquisition Memo`.
- [ ] Report-surface convergence stale/prohibited wording expectation.
- [ ] Full-render harness network mocking/unavailable writes must not be treated as production-contract proof.
- [ ] H6 dirty-worktree allowlist must not mask relevant integration evidence.

---

# 13. Modern Full Underwriting Product Depth - Current Verdict

## Audit conclusion

**Canonical modern V2 HTML/model is materially richer than legacy Underwriting.**

Representative current HTML contained approximately:
- 6 major chapters;
- 23 titled analytical surfaces;
- 28 tables;
- 24 substantive tables;
- 4 charts;
- ~1,617 visible words;
- 67 unique displayed numeric tokens.

## Modern chapters

- [x] Committee Overview
- [x] Operating Performance
- [x] Transaction Context
- [x] Debt & Capital Structure
- [x] Valuation & Reconciliation
- [x] Source Appendix

## Strong / currently satisfactory at HTML-model layer

- [x] T12 analysis
- [x] Rent Roll analysis
- [x] Unit mix and rent positioning
- [x] Revenue analysis
- [x] Expense analysis baseline
- [x] NOI and ratios
- [x] Current debt
- [x] Proposed acquisition financing
- [x] ADS
- [x] DSCR
- [x] LTV
- [x] Debt yield
- [x] Mortgage constant
- [x] Debt-inclusive break-even
- [x] Appraisal reconciliation
- [x] Renovation scope/budget/phasing/stated rent lift
- [x] Market support where source-backed
- [x] Environmental support where source-backed
- [x] Source register/document treatment
- [x] Unsupported DCF/waterfall/refi/equity-return modeling correctly absent
- [x] BUY/SELL/HOLD/speculative recommendation correctly absent

## Final PDF status

- [ ] Current production V2 PDF exists
- [ ] Current production V2 PDF customer-quality certified
- [ ] Full Underwriting materially exceeds Screening in final customer artifacts
- [ ] Page-by-page visual audit complete

**Do not infer report quality from historical 14-18 page counts.**

---

# 14. P1 - Customer-Safe Formula / Metric Lineage Is Too Thin

## Finding

Detailed calculation receipts and metric lineage exist internally but do not sufficiently reach customer output.

### Classification

`INTERNAL_INTELLIGENCE_NOT_REACHING_CUSTOMER_OUTPUT`

### Required repair

- [ ] Add restrained customer-safe formula/basis/source presentation.
- [ ] Preserve concise institutional tone.
- [ ] Do not expose raw UUIDs/machine lineage.
- [ ] Show source basis for material debt/valuation/operating metrics.
- [ ] Avoid turning report pages into audit logs.

### Exit proof

- [ ] Customer can understand how each material metric was derived.
- [ ] Source basis is visible without internal identifiers.
- [ ] No unsupported assumptions added.

---

# 15. P1 - Accepted Unit-Row Detail Is Aggregated Away

## Finding

Accepted decision-useful Rent Roll row detail is not reaching the customer appendix/detail surface.

### Required repair

- [ ] Define the governed subset of accepted unit-row facts suitable for customer display.
- [ ] Add compact unit-level appendix/detail only when accepted rows exist.
- [ ] Preserve privacy/source rules.
- [ ] Avoid redundant giant raw-data dump.
- [ ] Ensure collapse/omit behavior for oversized/low-quality detail.

### Exit proof

- [ ] Representative accepted Rent Roll rows appear in a decision-useful appendix/detail.
- [ ] Aggregates reconcile to displayed totals.
- [ ] No fabricated/unsupported rows.

---

# 16. P1 - Expense Composition Is Present but Weak

### Required repair

- [ ] Identify governed expense-category composition already available.
- [ ] Add or strengthen deterministic expense-mix analysis where source-supported.
- [ ] Preserve NOI/expense total reconciliation.
- [ ] Do not invent benchmark conclusions or market norms without authority.

### Exit proof

- [ ] Customer can see meaningful expense drivers, not just total OpEx.
- [ ] Totals reconcile deterministically.

---

# 17. P1 - Appraisal-Basis Leverage Is Unwired

### Required repair

- [ ] Determine which appraisal-basis leverage operands are already canonical/source-backed.
- [ ] Add only deterministic ratios supported by governed operands.
- [ ] Keep appraisal authority separate from purchase/T12 authority.
- [ ] Do not overwrite one valuation authority with another.

### Exit proof

- [ ] Appraisal-basis leverage appears only when all required operands are governed.
- [ ] Missing support collapses/omits the subsection only.

---

# 18. P1 - Explicit Current vs Proposed Debt Comparison Is Weak

### Required repair

- [ ] Add concise current-vs-proposed financing comparison where both sides are governed.
- [ ] Include only source-safe fields such as balance, ADS, DSCR, LTV, debt yield, maturity/rate where governed.
- [ ] Avoid recommendation language.

### Exit proof

- [ ] Customer can immediately understand financing delta.
- [ ] No unsupported lender assumptions.

---

# 19. QA / Section Count Taxonomy Is Stale

## Finding

The reported:
- `8 sections`
- `13/14 sections`

are not authoritative.

### Why

- `8` derives from stale legacy heading regexes.
- `13/14` can infer "rendered" from "not source-constrained" rather than observing actual HTML.

### Required repair

- [ ] Retire legacy section-heading regex certification.
- [ ] Base certification on modern six-chapter rendered markers.
- [ ] Use actual CustomerSurface dispositions.
- [ ] Require observed rendered output, not inferred existence.
- [ ] Ensure QA cannot certify imaginary/obsolete surfaces.

### Exit proof

- [ ] Current QA counters reconcile exactly to actual rendered modern surfaces.
- [ ] No legacy heading dependency remains in launch certification.

---

# 20. Renovation Eligibility QA Is Stale

## Finding

Modern V2 renovation is correctly rendered from canonical renovation/CapEx roles.

Stale QA still expects a `renovation_parsed` artifact and can incorrectly report:

`no_structured_renovation_support`

### Required repair

- [ ] Replace stale eligibility source.
- [ ] QA consumes modern canonical renovation authority.
- [ ] Preserve source-constrained state when renovation evidence truly is absent.

### Exit proof

- [ ] Rendered renovation and QA metadata agree.
- [ ] Missing renovation support still qualifies/omits truthfully.

---

# 21. Legacy / Compatibility Lane Purity

## Audit verdict

**PARTIAL**

Modern sealed V2 owns final customer HTML, but legacy composition still executes earlier and can influence:
- HTML integrity failure decisions;
- section count taxonomy;
- renovation eligibility metadata;
- compatibility names such as `v1_core` / `acquisition_memo`;
- stale tests.

### Required repair

- [ ] Map every legacy execution that still has decision authority.
- [ ] Remove legacy authority over modern V2 publication/content decisions.
- [ ] Retain compatibility adapters only where harmless and explicitly bounded.
- [ ] Modern customer identity must not depend on `Acquisition Memo` naming.
- [ ] Premium remains OFF and must not be used as workaround.

### Exit proof

- [ ] Modern V2 can be reasoned about end-to-end without legacy certification logic controlling outcomes.
- [ ] Compatibility paths cannot terminalize or miscertify modern reports.

---

# 22. Textract Structural Extraction Limitation

## Finding

Current Textract use relies on synchronous `AnalyzeDocument` with `TABLES`, while useful structure is discarded:
- geometry;
- merged cells;
- table titles/footers;
- spans/relationships;
- richer layout structure.

The audit also flagged the synchronous PDF/TIFF page-limit concern.

### Required repair

- [ ] Confirm current AWS Textract contract against actual accepted document types/pages.
- [ ] Determine whether multi-page PDFs require async processing in the current lane.
- [ ] Preserve useful table/geometry relationships needed for decision-useful extraction.
- [ ] Do not allow Textract confidence/structure to grant canonical source authority by itself.
- [ ] Prioritize only structures that materially improve governed analysis.

### Exit proof

- [ ] Representative multi-page source package is processed through the intended supported Textract path.
- [ ] Important table structure survives to canonical parsing where useful.
- [ ] No unsupported extraction-derived facts become authoritative.

---

# 23. PDF / Representation Verification Outstanding

## Code-level state

- [x] Paged-media CSS exists.
- [x] `@page`, counters, running strings and break controls exist.
- [x] Four deterministic charts exist.
- [x] Modern report hierarchy exists.

## Still unproven in actual current PDF

- [ ] Typography
- [ ] Margins
- [ ] Page breaks
- [ ] Blank-space discipline
- [ ] Table splits
- [ ] Repeating headers
- [ ] Numeric alignment
- [ ] Chart scale/readability
- [ ] Header/footer placement
- [ ] Final-page composition
- [ ] External font behavior
- [ ] Pixel-level visual quality
- [ ] Text/calculation parity with approved HTML

### Exit proof

After architecture and DocRaptor test-mode repair:
- [ ] Generate current Full Underwriting PDF.
- [ ] Extract final PDF text.
- [ ] Reconcile every material number/label/qualification.
- [ ] Perform page-by-page human visual review.
- [ ] Perform independent Sol red-team review when usage budget permits.

---

# 24. Sol Red-Team Crosswalk - Working Checklist

## REQUIRED AND SOURCE-SAFE

- [ ] Actual Full Underwriting PDF review.
- [ ] Actual Screening PDF review.
- [ ] Side-by-side product differentiation review.
- [ ] Page-level editorial/visual audit.
- [ ] Final PDF number/label/qualification reconciliation.
- [ ] Structured Textract lineage audit.

## REQUIRED BUT CURRENTLY UNWIRED

- [ ] Accepted unit-detail appendix.
- [ ] Restrained customer-safe formula/source basis.
- [ ] Governed appraisal-basis leverage where operands exist.

## SOURCE-CONSTRAINED

Leave omitted/qualified unless canonical operands exist:
- [ ] Rent PSF analysis where unsupported.
- [ ] Rollover analysis where unsupported.
- [ ] Property-tax analysis where unsupported.
- [ ] Other unsupported optional analytics.

## OUTSIDE CURRENT PRODUCT DOCTRINE - LEAVE ABSENT

- [x] Unsupported DCF
- [x] Waterfall
- [x] Equity returns
- [x] Refinance projections
- [x] Speculative ROI
- [x] BUY/SELL/HOLD
- [x] Unsupported recommendations

## PRESENT BUT WEAK

- [ ] Methodology.
- [ ] Expense composition.
- [ ] Final PDF tables.
- [ ] Final PDF charts.
- [ ] Final PDF typography.
- [ ] Lender/IC visual credibility.
- [ ] Risk/limitations prioritization.

## ALREADY SATISFIED - PRESERVE

- [x] Modern six-chapter HTML.
- [x] Deterministic debt calculations.
- [x] Source register.
- [x] Source-safe renovation surface.
- [x] Unsupported-model exclusions.
- [x] Institutional HTML hierarchy.

## OBSOLETE / SUPERSEDED - DO NOT USE FOR CERTIFICATION

- [x] Legacy page-count comparisons.
- [x] `8 section` counter.
- [x] `13/14 section` inferred counter.
- [x] `renovation_parsed` eligibility requirement.
- [x] Legacy customer naming as report identity.

---

# 25. Deterministic Stonebridge Calculations - Preserve / Regression Protect

Audit-confirmed values:

- [x] Occupancy: `93.75%`
- [x] Annual rent upside: `$285,600`
- [x] Expense ratio: `37.0%`
- [x] NOI margin: `63.0%`
- [x] Operating break-even: `34.41%`
- [x] Going-in cap: `7.00%`
- [x] Current ADS: `$471,000`
- [x] Current DSCR: `2.006x`
- [x] Proposed ADS: `$676,249.20`
- [x] Proposed DSCR: `1.397x`
- [x] Mortgage constant: `7.156%`
- [x] Debt yield: `10.0%`
- [x] Appraisal premium: `$700,000`

### Rule

These are representative deterministic audit fixtures, **not RETEST-specific production patches**.

- [ ] Preserve regression coverage.
- [ ] Do not hard-code Stonebridge values into production logic.

---

# 26. Existing Local Audit Commits - DO NOT LOSE

## Commit 1

`db6f78b` - `fix: repair DocRaptor request diagnostics`

Status:
- [x] Local commit exists.
- [ ] Diff reviewed.
- [ ] Push authorized.
- [ ] Pushed.
- [ ] Deployed.

## Commit 2

`b4cc594` - nullable report-identity handling in deterministic QA

Status:
- [x] Local commit exists.
- [ ] Diff reviewed.
- [ ] Confirm exact necessity/scope.
- [ ] Push authorized.
- [ ] Pushed.
- [ ] Deployed.

### Durability rule

Before any future ephemeral AI workspace can be lost:
- [ ] ensure work exists in the owner's local repository, durable patch artifact, remote branch/PR, or `origin/main` as explicitly authorized;
- [ ] never assume an AI sandbox-only commit is durable.

---

# 27. Recommended Repair Order

## Packet P0-A - Publication Authority / Visibility

**NEXT**

- [ ] Make job -> report -> current revision -> customer download one attempt-fenced publication authority.
- [ ] Prevent all pre-publication downloads.
- [ ] Add real local-Supabase orchestration proof.

**STOP and review before continuing.**

## Packet P0-B - Attempt / Lease Fencing

- [ ] Fence all final publication mutations.
- [ ] Reject stale attempts.

## Packet P0-C - Worker Sole Terminal / Remedy Authority

- [ ] Remove generator terminal lifecycle ownership.
- [ ] Worker owns commercial remedy.

## Packet P0-D - Failure Taxonomy

- [ ] Separate customer source failures from infrastructure/provider/code failures.

## Packet P0-E - Source Truth Consume-Only

- [ ] Remove worker re-derived contradiction authority.

## Packet P0-F - Observability Safety

- [ ] Telemetry fail-open where non-authoritative.
- [ ] Remove raw provider body logging.
- [ ] Bound diagnostics.
- [ ] Add timeouts.

## Packet P1-A - QA Modernization

- [ ] Replace stale section counts.
- [ ] Replace renovation eligibility logic.
- [ ] Remove obsolete Acquisition Memo test identity.
- [ ] Retire misleading mocks as production-certification proof.

## Packet P1-B - Institutional Content Enrichment

- [ ] Accepted unit-row appendix/detail.
- [ ] Customer-safe formula/source basis.
- [ ] Expense composition.
- [ ] Appraisal-basis leverage.
- [ ] Current-vs-proposed debt comparison.

## Packet P1-C - Extraction Structure

- [ ] Textract path/structure upgrade where evidence proves material value.

## Packet CERT-A - DocRaptor TEST-MODE Certification

- [ ] Restore/verify test mode first.
- [ ] Deploy reviewed DocRaptor request repair only after the architectural packet sequence says it is safe.
- [ ] Execute one controlled real test-mode provider request.
- [ ] Confirm PDF bytes.
- [ ] Confirm no production-doc quota consumed.

## Packet CERT-B - Full Underwriting Artifact Certification

- [ ] Generate one representative Full Underwriting artifact through the real pipeline in approved test mode.
- [ ] Text/math reconciliation.
- [ ] Page-by-page visual review.
- [ ] Sol red-team when budget permits.

## Packet CERT-C - Screening Artifact Certification

- [ ] Only after Full Underwriting architecture/artifact proof is accepted.
- [ ] Generate Screening.
- [ ] Side-by-side product differentiation.

## Packet COMMERCIAL - Final Launch Closeout

- [ ] Production DocRaptor quota available / production mode explicitly authorized.
- [ ] Bundle frontend mapping.
- [ ] Bundle server Stripe mapping.
- [ ] Cron credential rotation.
- [ ] Revision-workflow anon-key debt.
- [ ] Customer-facing samples approved.
- [ ] Screening + Full Underwriting launch together.

---

# 28. Current Launch Readiness Dashboard

| Area | Status |
|---|---|
| Core T12 / Rent Roll authority | PASS |
| Deterministic financial math | PASS |
| Modern V2 HTML architecture | PASS |
| Full Underwriting HTML depth | PASS / good foundation |
| Unsupported-model protection | PASS |
| Source register / document treatment | PASS |
| Renovation customer surface | PASS |
| QA renovation metadata | HOLD - stale |
| QA section counters | HOLD - stale |
| DocRaptor endpoint | REPAIRED LOCALLY / NOT DEPLOYED |
| DocRaptor mode governance | **P0 HOLD - production mode used without owner authorization** |
| DocRaptor production quota | **5/5 consumed until account reset period** |
| DocRaptor provider acceptance | HOLD |
| Provider diagnostic safety | HOLD |
| Provider/internal timeouts | HOLD |
| Publication atomicity | **P0 HOLD** |
| Customer download authority | **P0 HOLD** |
| Job -> report -> revision linkage | **P0 HOLD** |
| Attempt/lease fencing | **P0 HOLD** |
| Worker sole terminal authority | **P0 HOLD** |
| Failure taxonomy | **P0 HOLD** |
| Source Truth consume-only | **P0 HOLD** |
| Observability fail-open | **P0 HOLD** |
| Final Full Underwriting PDF | NOT CERTIFIED |
| Screening final PDF | NOT CERTIFIED |
| RETEST 43 | **NOT AUTHORIZED** |
| Commercial launch | **HOLD** |

---

# 29. Definition of Ready for Another Production Canary

A production canary is **NOT** authorized merely because DocRaptor accepts a request.

Before another production canary, all of the following must be true:

- [ ] P0 publication visibility repaired.
- [ ] Job -> report -> current revision linkage repaired.
- [ ] Attempt/lease fencing repaired.
- [ ] Worker sole terminal/remedy authority repaired.
- [ ] Infrastructure-vs-document failure taxonomy repaired.
- [ ] Worker Source Truth re-derivation removed.
- [ ] Observability cannot terminalize valid jobs.
- [ ] Raw provider body logging removed.
- [ ] HTTP/provider timeouts bounded.
- [ ] Stale QA counters/renovation eligibility no longer used for certification.
- [ ] Real local-Supabase orchestration test passes.
- [ ] DocRaptor test-mode shared-renderer proof passes.
- [ ] Full Underwriting test-mode PDF exists and passes text/math/visual review.
- [ ] Owner explicitly authorizes production DocRaptor mode.
- [ ] Production DocRaptor quota is available.
- [ ] Owner separately authorizes the next canary.

Only then may a new production canary be considered.

---

# 30. Current Exact Next Action

**Authorize one bounded P0 repair packet only:**

> Make `job -> report -> current revision -> customer download` a single attempt-fenced publication authority and prevent every pre-publication download.

That packet should also inspect the exact publication/read paths required to prove this boundary, but it should **not** simultaneously attempt to fix every other P0/P1 finding.

After that packet returns:
1. review the diff and tests;
2. update this checklist;
3. authorize the next smallest bounded repair.

---

# 31. Usage-Conservation Strategy for Codex

Because the comprehensive Sol audit consumed substantial weekly usage, future repair work should be narrowly packetized.

Recommended model strategy:
- **GPT-5.4 mini:** suitable for tightly bounded, mechanically specified repairs when the prompt gives exact authority, files/areas to inspect, invariants, required tests, prohibitions, and PASS/HOLD receipt.
- **GPT-5.6 Luna:** preferred for architecture-sensitive packets, lifecycle/transaction ownership, concurrency/fencing, or when the correct change boundary is not already known.
- **GPT-5.6 Sol Ultra:** reserve for final independent red-team/certification or genuinely unresolved cross-system architecture, not routine implementation.

Every Codex packet must include:
- authority;
- exact problem statement;
- doctrine classification;
- narrow scope;
- prohibited changes;
- required adversarial proof;
- usage-conservation rule;
- durability/persistence rule;
- exact PASS/HOLD receipt format.

---

# 32. Owner Doctrine Reminder

**Core-Gated Publish-or-Collapse remains controlling.**

If canonical T12 and/or Rent Roll evidence is sufficient for a truthful defensible report, downstream representation defects may degrade only representation.

Whole-report failure is reserved for:
1. genuinely insufficient/invalid/irreconcilable core authority; or
2. genuine infrastructure failure where no authorized mechanism can produce truthful PDF bytes.

No optional analysis, QA counter, telemetry write, legacy compatibility check, PDF Boss defect, layout issue, or provider diagnostic may independently revoke valid-core publication authority.

**DocRaptor must remain in owner-authorized testing mode until the owner explicitly authorizes production mode.**
