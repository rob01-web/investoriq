# InvestorIQ Canonical Handoff

## 2026-08-06 Current Checkpoint — Gate 3 Active

### Authoritative repository state

- Authoritative branch: `main`
- Local `HEAD`, local `origin/main`, and remote `origin/main`: `c8a9f4f7f719fa1b34bf868a9bc8530213cfccd2`
- Working tree at the last owner proof: clean
- Latest merged commit: `c8a9f4f` — `test: validate full underwriting handler fixture`
- Previous merged Gate 3 implementation commit: `c6eb5bc` — `feat: add governed revenue expense NOI bridge`
- No deployment or production mutation has occurred for these Gate 3 changes.
- Premium remains `false`.
- RETEST 39 remains terminal `dead_letter` and must never be requeued.
- RETEST 40 must never be created.
- Screening and Full Underwriting launch together, or neither launches.

### Gate status

- Gate 1 — doctrine-compliant collapse-path and lifecycle investigation: **PASS / complete**
- Gate 2 — system-wide doctrine-aware section disposition and collapse: **PASS / accepted**
- Gate 3 — elite Full Underwriting output certification: **ACTIVE / implementation in progress**
- Gate 4 — controlled launch certification: **NOT AUTHORIZED**

### Gate 3 completed work

1. **Revenue / Expense / NOI bridge — PASS / merged**
   - Added inside the existing Operating Statement / TTM Summary surface.
   - Uses only governed, source-backed:
     - `effective_gross_income`
     - `total_operating_expenses`
     - `net_operating_income`
   - Requires a non-collapsed operating section, source-backed availability, no missing required facts, and finite values.
   - Omits only the bridge when its governed facts are incomplete.
   - Direct composer smoke passed.
   - Real handler-path proof now passes with validated core artifacts.

2. **Validated-core Full Underwriting handler fixture — PASS / merged**
   - The handler smoke now supplies real `t12_parsed` and `rent_roll_parsed` coverage artifacts.
   - Valid core fixture reaches HTTP 200 and returns final Full Underwriting HTML.
   - Invalid core fixture still fails closed with `ACQUISITION_MEMO_SOURCE_TRUTH_NOT_PUBLISHABLE`.
   - Core T12 and Rent Roll authority were not weakened or bypassed.

### Second Gate 3 slice selected

**Valuation / Appraisal Comparison**

Selection reasons:
- strongest incremental underwriting value among the remaining mapped candidates;
- all required comparison inputs already exist in governed customer-surface data;
- fits inside the existing Appraisal / Valuation Context section;
- requires no customer-surface-model, Boss-contract, parser, worker, schema, manifest, lane, or identity change;
- missing or incomplete appraisal support can omit only the new comparison subsection.

Required authority separation:
1. InvestorIQ deterministic T12-based indication
2. Purchase-assumption context
3. Uploaded appraisal context

No authority may overwrite another. No BUY, SELL, HOLD, recommendation, approval, deal-score, or invented qualitative language is permitted.

### Work currently delegated to Codex / Luna

Codex is running the authorized implementation packet for the Valuation / Appraisal Comparison slice.

Authorized files only:
- `api/_lib/acquisition-memo-v2-document.js`
- `tests/qa/acquisition-memo-v2-document-smoke.js`
- `tests/qa/full-underwriting-gates-full-render-smoke.js` only when narrowly needed for real-handler proof

Expected behavior:
- render the comparison only when all governed InvestorIQ and appraisal facts are finite and source-backed;
- preserve the existing appraisal table and Cap-Rate Value Indication;
- omit only the new comparison subsection when optional appraisal facts are absent or incomplete;
- preserve valid-core publication;
- prove direct composer behavior, customer-surface compatibility, real handler output, and invalid-core fail-closed behavior.

### Exact next decision point

**Review Codex’s Valuation / Appraisal Comparison implementation receipt.**

The next chat must:
1. verify exact file scope;
2. verify governed fields and authority labels;
3. verify deterministic dollar deltas;
4. verify omission behavior;
5. verify no recommendation language or authority overwrite;
6. verify focused test results;
7. verify durable commit/push or provide the smallest manual Git closeout;
8. merge only after a clean PASS;
9. not deploy or begin Gate 4.


Current date: August 6, 2026

## Current authority pointers

- Branch: `main`
- Authoritative implementation HEAD / origin/main: `c8a9f4f7f719fa1b34bf868a9bc8530213cfccd2` — `test: validate full underwriting handler fixture`
- Important ancestors: `087f97d` (`fail_exact_expired_worker_job`), `1bceb47` (governed-retry parser resume)
- Active docs: `docs/STATUS.md`, `docs/ROADMAP.md`, this handoff, `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`, `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
- Premium: **false**
- RETEST 39 (`084a982e-ff6e-49b0-a7f7-473ed314aada`): terminal `dead_letter`; **not authorized for another requeue**
- RETEST 40: **must not be created**
- Production domain: https://investoriq.tech
- If STATUS, ROADMAP, this handoff, an implementation assumption, a test, a Codex prompt, or an investigation conclusion conflicts with Product Doctrine or H0 authority, **Product Doctrine and H0 authority win**.

## Core-Gated Publish-or-Collapse (non-negotiable)

InvestorIQ follows Core-Gated Publish-or-Collapse.

Operational meaning:
- Approximately 99.999% of reports with valid core evidence should publish.
- Valid T12 and Rent Roll authority governs whether the report has a publishable core.
- Optional, supplementary, analytical, layout, chart, table, appendix, and presentation defects must be handled at the narrowest defensible level.
- Preferred outcomes, in order:
  1. publish;
  2. publish with quality incident;
  3. bounded repair and publish;
  4. collapse/omit/qualify the defective surface and publish.
- Whole-report terminal failure is reserved for missing, invalid, corrupted, materially misleading, or irreconcilable core authority, or a genuinely unavoidable technical condition where no safe degraded report can be delivered.
- A PDF-quality gate may block one generated PDF artifact, but it must not automatically convert an otherwise valid-core report into a whole-report failure.
- After bounded repair is exhausted, the system must evaluate safe surface collapse before terminal failure.

## Doctrine gate for every future packet

Before any future InvestorIQ diagnosis or Codex repair prompt, answer:

1. Is core T12 authority valid?
2. Is core Rent Roll authority valid?
3. Is the defect core, analytical, optional, supplementary, certification-only, or presentation-only?
4. Can the surface publish unchanged?
5. Can it publish with a recorded quality incident?
6. Can it be repaired within a bounded attempt?
7. If repair fails, can it collapse or omit while preserving a truthful report?
8. What exact minimum core facts must survive?
9. Would the proposed fix increase or reduce valid-core publication?
10. Why is whole-report terminal failure permitted or forbidden under Product Doctrine?

No implementation packet should proceed without this classification.

## Gate 1 closeout and Gate 2 handoff

Product Doctrine and H0 authority remain controlling over STATUS, ROADMAP, this handoff, implementation assumptions, test expectations, prior chat conclusions, and convenience fixes.

Gate 1 - Doctrine-compliant collapse-path and lifecycle investigation: **PASS / complete**.

Gate 1 used RETEST 39 only as forensic evidence. No source, test, production, worker, scheduler, RPC, RETEST, Premium, pricing, credit, purchase, report, or artifact mutation occurred during Gate 1. No report-specific patching is permitted.

Gate 1 proved:
1. Existing institutional PDF recovery is presentation-only and CSS-only.
2. Recovery adjusts margins, typography, table layout, spacing, wrapping, and page-break behavior.
3. Recovery does not semantically compact, summarize, collapse, omit, or relocate report content.
4. Recovery recertifies against the original approved HTML.
5. PDF Boss top-level dispositions are: publish; publish_with_quality_incident; block.
6. No executable compact/collapse-and-publish disposition currently exists.
7. The repair-plan layer may describe collapse actions, but no runtime path executes them.
8. Approved financial-row certification currently treats all extracted financial table label/value pairs as required unless an approved disposition contract says otherwise.
9. Dense Debt Capacity and Coverage surfaces may include formula, numerator, denominator, and verbose source provenance in customer-facing cells.
10. Long source lineage can contribute to overflow and certification-parity failures.
11. A partial pre-render required/collapsed surface model already exists.
12. The earliest safe universal section-disposition point is before HTML composition, within the governed report/customer-surface model.
13. The missing architecture is a universal pre-render contract supporting: include; include_qualified; compact; collapse; omit.
14. PDF Boss must distinguish intentional approved collapse from accidental loss of mandatory facts.
15. The worker has no runtime route from unrecovered PDF Boss block to semantic recomposition and safe republication.
16. Worker lifecycle completion occurs only if the failure path finishes; otherwise the job can remain stranded in rendering.
17. "Terminalize all PDF Boss blocks" remains forbidden as the default fix.
18. Whole-report terminal failure remains forbidden unless catastrophic core invalidity, irreconcilable core authority, or inability to produce any safe degraded artifact is proven.

Gate 2 - System-wide doctrine-aware section disposition and collapse: **PASS / accepted**.

Gate 2 is the system-wide implementation of:
1. Universal pre-render section-disposition contract.
2. Compact Full Underwriting financial surfaces.
3. Separation of customer-facing source labels from raw machine lineage.
4. Intentional compact/collapse certification receipts.
5. One bounded semantic recomposition pass after CSS recovery fails.
6. Quality Manifest disclosure of compact/collapse/omit outcomes.
7. Worker lifecycle completion so jobs cannot remain stranded in rendering.
8. Screening compatibility with the shared contract.
9. Focused deterministic tests only.
10. No RETEST-specific logic or values.

No production deployment, live certification, worker invocation, scheduler change, RPC invocation, Premium activation, purchase mutation, credit mutation, report mutation, artifact mutation, RETEST 39 requeue, or RETEST 40 occurred in this documentation closeout.

Gate status:
- Gate 1: PASS / complete.
- Gate 2: PASS / accepted.
- Gate 3: ACTIVE / implementation in progress.
- Gate 4: not started; requires separately authorized canaries.

Hard boundaries remain:
- No RETEST 39 requeue.
- No RETEST 40.
- No report-specific patching.
- No Premium activation.
- No production mutation.
- No scheduler change.
- No worker invocation.
- No RPC invocation.
- Do not retire the GitHub fallback.
- No GitHub Contents API full-file replacement writes on `api/admin-run-worker.js` or `api/parse/parse-doc.js`.
- No broad audits.
- No broad test suites.
- Screening and Full Underwriting launch together, or neither launches.
- Launch target remains Monday, August 10, 2026, but doctrine and quality may not be sacrificed for the date.

Next decision point: **Review the Valuation / Appraisal Comparison implementation receipt.**

The review must determine:
1. Whether the implementation is truly system-wide.
2. Whether all five dispositions are implemented.
3. Whether core-required minimum facts are protected.
4. Whether Debt Capacity compact mode preserves lender-useful facts.
5. Whether raw UUIDs and verbose lineage leave primary customer-facing cells.
6. Whether PDF Boss distinguishes intentional collapse from accidental fact loss.
7. Whether semantic collapse is bounded.
8. Whether successful compact/collapse certification reaches publication.
9. Whether unrecoverable failure exits rendering safely.
10. Whether Screening remains compatible.
11. Whether focused tests passed.
12. Whether any schema change was introduced.
13. Whether the implementation is ready for Gate 3 or requires a smallest corrective packet.

## RETEST 39 final production result

- Purchase: `db421bc7-c850-4429-ab13-e1e53b6161a1` (remained bound)
- Final status: `dead_letter`
- Final error: `TIMEOUT` — Processing timed out. Please log in to your InvestorIQ dashboard to review the job status.
- Attempt count: `3`
- Final attempt ID: `6bc7f737-4e39-4ce8-b2dc-ed3836b1a294`
- Claimed by: `2026-08-04T22-03-00.204Z`
- Dead-lettered at: `2026-08-05 18:35:43.118214+00`
- Lease cleared: `worker_lease_expires_at = null`
- Report credits remained: `0`
- Event integrity: `entitlement_restored` ×1; `worker_claimed` ×3; `worker_admin_requeued` ×2; no fourth attempt; no duplicate entitlement or credit; no RETEST 40

## RETEST 39 attempt 3 — proven rendering / PDF evidence

Attempt 3 successfully completed:
- worker claim
- extraction
- underwriting
- scoring
- rendering entry
- report-generation logic
- approved customer HTML generation
- report QA
- PDF generation
- page-by-page PDF certification
- one bounded institutional PDF recovery attempt

The prior stale-parser defect did not recur.

Database artifacts prove:
- approved HTML length: approximately 50,990 characters
- valid production PDF created
- PDF page count: 14
- PDF byte length: 82,480
- all 14 page receipts present
- all four charts certified
- one bounded conservative recomposition/recovery attempt executed
- recovery result: not recovered
- no `public.reports` row was created
- no customer publication occurred
- customer delivery was correctly blocked for the defective PDF artifact

Final artifact: `final_pdf_publication_quality_boss`
Created: `2026-08-04 22:03:33.173055+00`
Final result:
- `status = internal_pdf_publication_quality_failure`
- `failure_class = internal_system_failure`
- `publication_disposition = block`
- `customer_delivery_allowed = false`
- `external_publication_allowed = false`
- `strict_institutional_certified = false`
- valid PDF: true
- page count: 14
- byte length: 82,480
- bounded recovery attempts: 1
- recovered: false

Blocking PDF issue codes:
- `PDF_PAGE_OVERFLOW`
- `PDF_REQUIRED_FINANCIAL_FACTS_MISSING`

Additional quality incidents:
- `PDF_TABLE_CONTINUATION_HEADER_MISSING`
- `PDF_NUMERIC_COLUMN_MISALIGNMENT`
- `PDF_APPROVED_TABLE_NOT_CERTIFIED`
- `PDF_APPROVED_NUMBER_NOT_CERTIFIED`

Important distinction:
These issue codes correctly blocked that exact defective PDF artifact from customer delivery.
They do **not**, by themselves, prove that the entire valid-core report should terminally fail under Core-Gated Publish-or-Collapse.

## Corrected RETEST 39 diagnosis

Do **not** treat RETEST 39 primarily as an unknown rendering timeout, an unbounded report-generation fetch, or merely a missing terminalization path.

Stronger current evidence:
1. Rendering and PDF generation substantially completed.
2. PDF Boss correctly rejected the final PDF artifact.
3. The approved HTML and core analysis existed.
4. One bounded PDF recomposition attempt failed.
5. No governed collapse-and-publish outcome was proven.
6. The job remained stranded in `rendering`.
7. It later expired and required exact dead-letter recovery.

Open architectural question:
Why did the system not safely collapse, omit, qualify, or recompose only the defective presentation/supplementary surfaces and publish the remaining valid-core report with an explicit Quality Manifest?

Lifecycle-stranding remains relevant but is secondary to determining the doctrine-compliant outcome.
Do **not** document "terminalize all PDF Boss blocks" as the intended fix.

### Defect classification

**Proven core status**
- Core T12/Rent Roll parser-resume: PASS
- Valid core analysis progressed through underwriting and scoring
- Approved HTML existed
- Report QA existed
- Valid PDF bytes existed
- No evidence yet proves catastrophic core invalidity or irreconcilable core evidence

**Presentation/layout defect**
- `PDF_PAGE_OVERFLOW` — primarily layout/pagination/composition.
- Expected doctrine outcome: bounded recomposition, narrower surface repair, identifier shortening/display transformation, or collapse of affected presentation surface — not automatic whole-report failure.

**Approved-surface parity defect**
- `PDF_REQUIRED_FINANCIAL_FACTS_MISSING` — serious delivery defect because approved facts did not survive into the final PDF.
- Evidence shows the facts existed on the approved surface.
- Next investigation must determine whether the affected debt-capacity table can be recomposed; long source lineage strings can move to footnotes/appendix/manifest; dense numerator/denominator/source rows can collapse; only affected supplementary rows/tables can be omitted or qualified; core metrics can remain safely visible; and the report can publish with explicit manifest disclosure.
- Do not classify this automatically as catastrophic core failure without that investigation.

**Nonblocking quality incidents** (remain quality incidents unless direct authority proves they corrupt required core meaning):
- continuation header missing
- numeric-column misalignment
- approved tables not fully certified
- approved numbers not fully certified

These should normally be repaired or collapsed at the affected surface.

## Parser-resume / publication verdict distinction

- **Governed parser-resume proof: PASS** — attempt 3 advanced `queued → extracting → underwriting → scoring → rendering`, clearing the prior stale failed-T12 `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` path.
- **End-to-end publication proof: HOLD** — approved HTML and a valid 14-page PDF were produced; PDF Boss blocked customer delivery; no collapse-and-publish path executed; no `public.reports` row; job stranded in `rendering` until exact dead-letter recovery.
- **Lifecycle recovery and commercial integrity: PASS** — exact expired recovery to `dead_letter`; exactly-once entitlement restoration preserved.

## Dead-letter contract + exact recovery

- Repository migration `20260805000100_analysis_jobs_status_check_dead_letter.sql` at `6c5c4e8` added only `dead_letter` to `analysis_jobs_status_check`.
- Production constraint applied and verified; no status removed or renamed.
- `fail_exact_expired_worker_job` (`087f97d`) invoked exactly once after constraint repair: `rendering` → `dead_letter`; attempt 3 preserved; `entitlement_already_restored: true`; `credit_balance_changed: false`; exact-job fencing held; no unrelated job processed.

## Two-worker / scheduler authority

### Production worker (active)
- Supabase `pg_cron` / `pg_net` → `POST https://investoriq.tech/api/admin-run-worker`
- jobid `1`, jobname `investoriq-admin-run-worker`, schedule `*/3 * * * *`
- User agent observed: `pg_net/0.19.5`
- Temporarily paused (`cron.alter_job(1, active := false)`) for controlled recovery; restored (`active := true`); cadence preserved; no further `worker_lease_expired` events for terminal RETEST 39 after more than two cycles.

### Legacy worker
- `.github/workflows/worker-kick.yml`: automatic schedule remains paused; `workflow_dispatch` remains available.
- Not yet permanently retired.

## Sequence complete through RETEST 39 commercial closeout + PDF evidence

1. Parser rescue `a06b897` deployed.
2. Governed requeue production RPC installed and verified.
3. Exact-job isolation `05ccee4` deployed.
4. RETEST 39 attempt 2 failed `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` (stale failed T12).
5. Legacy GH schedule paused; production scheduler later identified as Supabase pg_cron `*/3`.
6. Governed-retry parser resume `1bceb47` deployed.
7. Exact expired recovery action `087f97d` added.
8. Dead-letter status constraint `6c5c4e8` committed; production applied.
9. RETEST 39 attempt 3 advanced through rendering, HTML, QA, PDF generation, and one bounded recovery; PDF Boss blocked the artifact; job stranded in `rendering`; exact recovery → `dead_letter` (commercial integrity PASS).

## Production gates

**Done:** parser fix; governed requeue; exact-job isolation; parser-resume deployed and proven on attempt 3; dead-letter constraint in production; exact expired recovery proven; RETEST 39 commercial closeout; production scheduler mapped (Supabase pg_cron job 1) and controlled (pause/restore); GH automatic schedule paused; Premium false; RETEST 39 PDF evidence documented (HTML + 14-page PDF + Boss block).

**HOLD / not done:**
- Gate 2 implementation receipt review
- End-to-end publication proof (PDF Boss blocked artifact; no doctrine-compliant collapse-and-publish path has been accepted through Gate 2 review)
- Legacy GitHub worker permanent retirement
- RETEST 40 (forbidden)
- Premium remains false

## Launch-Critical System Repair and Certification Plan — Gates 1–4

RETEST 39 is forensic evidence used to repair the system **globally**.
InvestorIQ is **not** returning to report-specific patching.
No future packet may be framed as repairing RETEST 39 or making one failed PDF fit.
The repair must apply deterministically to **all future Screening and Full Underwriting reports**.

### Doctrine classification (from RETEST 39 evidence)

- Valid-core status is not disproven.
- Approved HTML and a valid PDF existed.
- PDF Boss correctly blocked the defective artifact.
- Artifact blocking did not automatically remove report-level publication authority.
- The missing system behavior is doctrine-aware surface collapse and publication.
- Worker lifecycle stranding is a separate defect.
- **"Terminalize all PDF Boss blocks" is forbidden as the default repair.**

### Launch priority

- Target: Monday, August 10, 2026 — launch quality and doctrine may **not** be sacrificed merely to meet the date.
- Critical sequence: Gate 1 map → Gate 2 systemic implementation → Gate 3 elite Full Underwriting certification → Gate 4 controlled launch certification.
- No unrelated feature work may interrupt this sequence without owner authorization.
- Premium remains **false**.
- Screening and Full Underwriting launch **together, or neither launches**.

### Gate 1 - Doctrine-compliant collapse-path and lifecycle investigation

**PASS / complete.** Gate 1 proved the architecture findings recorded above. RETEST 39 remains forensic evidence only. No source, test, production, worker, scheduler, RPC, RETEST, Premium, pricing, credit, purchase, report, or artifact mutation occurred during Gate 1.

### Gate 2 - System-wide doctrine-aware section disposition and collapse

**Authorized / implementation in progress.** Implement a **universal pre-render section-disposition contract**.
Each governed report surface must deterministically resolve to one of: include; include_qualified; compact; collapse; omit.

The contract must establish:
1. Whether the surface is core-required, analytical, supplementary, optional, certification-only, or presentation-only.
2. Which exact minimum facts must survive.
3. Whether detailed rows or tables may collapse.
4. Where source lineage belongs.
5. Which Quality Manifest disclosure is required.
6. Whether the final report remains safely publishable.

This must apply to **all future reports**, not RETEST 39 specifically.
Raw internal IDs, UUIDs, machine lineage, parser receipts, and verbose provenance must **not** crowd customer-facing analytical tables.
Customer-facing report tables should use concise human-readable source labels.
Detailed traceability should move, as appropriate, to footnotes, appendix, or Quality Manifest.
After bounded repair fails, safe collapse-and-publish must be evaluated **before** whole-report terminal failure.

### Gate 3 — Elite Full Underwriting output certification

Restore and verify the intended institutional Full Underwriting product.
Full Underwriting must **not** be a weak Acquisition Memo, a stretched Screening report, or filler added to achieve a page count.
It must provide source-aware, deterministic, lender- and investment-committee-useful analysis, including where governed inputs exist:
- property and transaction overview;
- accepted-source and evidence-status summary;
- T12 and Rent Roll reconciliation;
- unit mix and rent economics;
- operating revenue;
- operating expenses;
- NOI and operating bridge;
- current debt;
- proposed acquisition financing when sourced;
- mortgage constant;
- debt yield;
- DSCR and other governed coverage metrics;
- LTV when governed operands exist;
- debt-capacity and binding-constraint analysis where authorized;
- sources and uses only when source-complete;
- valuation and appraisal reconciliation;
- property-tax analysis;
- renovation and capital-plan evidence;
- environmental and diligence evidence;
- risk register;
- unresolved questions;
- methodology, formulas, assumptions boundary, sources, limitations, and Quality Manifest.

Missing governed inputs must cause honest qualification, collapse, or omission.
InvestorIQ must never invent financing assumptions, unsupported values, market conclusions, or substitute facts.
The report must be dense, legible, institutional, source-aware, and useful to sophisticated owners, lenders, and investment committees, including customers with portfolios in the approximate $200M–$500M range.
**Page count is not the governing quality standard.**

### Gate 4 — Controlled launch certification

After the systemic repair and elite-report verification:
1. Run only focused deterministic tests.
2. Run one newly authorized Full Underwriting launch-certification canary using strong representative documents.
3. Perform human review of the actual customer PDF against the elite institutional standard.
4. Run one newly authorized Screening canary.
5. Verify purchase, entitlement consumption, generation, publication, Report History, artifact delivery, Quality Manifest, and governed remedies.
6. Close remaining bundle pricing/configuration and public-copy debt.
7. Approve customer-facing sample reports.
8. Launch Screening and Full Underwriting together, or neither launches.

Do **not** use RETEST 39 as the canary.
Do **not** create RETEST 40.
A future canary requires separate owner authorization.

## Exact next packet

**Review the Valuation / Appraisal Comparison implementation receipt.**

The review must determine whether the implementation is truly system-wide; whether all five dispositions are implemented; whether core-required minimum facts are protected; whether Debt Capacity compact mode preserves lender-useful facts; whether raw UUIDs and verbose lineage leave primary customer-facing cells; whether PDF Boss distinguishes intentional collapse from accidental fact loss; whether semantic collapse is bounded; whether successful compact/collapse certification reaches publication; whether unrecoverable failure exits rendering safely; whether Screening remains compatible; whether focused tests passed; whether any schema change was introduced; and whether the implementation is ready for Gate 3 or requires a smallest corrective packet.

Do **not** frame any packet as repairing RETEST 39 or one failed PDF.
Do **not** authorize another RETEST 39 requeue.
Do **not** authorize RETEST 40.
Do **not** permanently retire the GitHub fallback yet.
Do **not** treat "terminalize all PDF Boss blocks" as the default or intended fix.
Premium remains false.
Screening and Full Underwriting launch together, or neither launches.
Launch target Monday, August 10, 2026 - quality and doctrine may not be sacrificed for the date.

## Gate 3 Certification Complete - PASS

This closeout supersedes the prior Gate 3 active/pending decision language above without rewriting the historical record.

- Gate 3 status: **PASS / CLOSED**.
- Certified implementation SHA: `32e566136bd77afd6e2b41a2c516e1adc8a61fa9`.
- Focused certification tests: `acquisition-memo-v2-document smoke PASS`; `full-underwriting-gates-full-render smoke PASS`.
- Valid core: HTTP 200 with `final_html`.
- Invalid core: HTTP 500 with `ACQUISITION_MEMO_SOURCE_TRUTH_NOT_PUBLISHABLE`; no `final_html`.

### Final Gate 3 institutional matrix

1. Property / Transaction Overview - **PASS**.
2. Source / Evidence Summary - **PASS**.
3. T12 / Rent Roll Reconciliation - **PASS**.
4. Unit Mix / Rent Economics - **PASS**.
5. Revenue / Expense / NOI Analysis - **PASS**.
6. Property Tax Analysis - **PASS**.
7. Current Debt where sourced - **PASS**.
8. Proposed Acquisition Financing where sourced - **PASS**.
9. Debt Service / Coverage / Capacity where source-ready - **PASS**.
10. Valuation / Appraisal Reconciliation - **PASS**.
11. Renovation / Capital Plan where source-backed - **PASS**.
12. Environmental / Diligence where source-backed - **PASS**.
13. Data Coverage / Limitations / Methodology - **PASS**.
14. Quality / Publication Semantics - **PASS**.

### Completed Gate 3 slices

- Revenue / Expense / NOI Bridge
- Validated-core Full Underwriting handler fixture
- Valuation / Appraisal Comparison
- Property Tax Analysis

### Candidate decisions

**Sources and Uses - intentionally omitted under doctrine.** The repository does not prove a complete governed, source-backed set of all required operands, including equity requirement, complete lender-fee dollars, closing costs, reserves, renovation/CapEx uses, and other balancing uses. InvestorIQ must not invent or derive unsupported operands merely to produce a balanced table. This is not a Gate 3 deficiency.

**Risk Register / Unresolved Questions - intentionally not added.** Existing customer-safe surfaces already provide Primary Constraint / Review Disclosure, Preliminary Financing Readiness, Data Coverage & Source Limitations, Source Register, and Methodology / assumptions boundaries. A separate register would duplicate existing content or risk subjective language and internal machine-state exposure. This is not a Gate 3 deficiency.

### Doctrine closeout

- Valid T12 authority: certified.
- Valid Rent Roll authority: certified.
- Valid-core publication: certified.
- Invalid-core fail-closed behavior: certified.
- Optional/support-section collapse behavior: certified.
- Whole-report failure remains forbidden for optional analytical defects.
- Whole-report failure remains reserved for invalid or unsafe core publication.
- No additional Gate 3 implementation slice is justified.

Gate 1: **PASS / CLOSED**.
Gate 2: **PASS / CLOSED**.
Gate 3: **PASS / CLOSED**.
Gate 4: **NOT AUTHORIZED**.

No deployment or production mutation occurred. Premium remains false, RETEST 39 remains terminal `dead_letter`, RETEST 40 must not be created, Screening and Full Underwriting launch together or neither launches, and the GitHub fallback remains active.

### Next phase

Prepare a separately authorized Gate 4 launch-certification packet. Do not execute Gate 4, deploy, create production canaries, create new reports, or alter pricing/configuration.

## Forbidden until separately authorized

- No RETEST 39 requeue
- No RETEST 40
- No report-specific patching (systemic repair only)
- No Premium activation
- No GitHub Contents API full-file writes to large worker/parser sources (`api/admin-run-worker.js`, `api/parse/parse-doc.js`)
- No scheduler, worker, RPC, credit, purchase, or deployment mutation outside an explicitly authorized packet

## Prior launch context (still true)

- H0–H10 complete at repository-proof level (including H6 correction).
- Bundle pricing still shows configuration/copy debt; do not change Stripe/Vercel bundle config until a governed Full Underwriting live PDF is proven.
- Full Underwriting production output quality is not yet proven by a reviewed live customer PDF.

## Current Gate 3 Next Packet — August 6, 2026

Review the pending Codex receipt for the **Valuation / Appraisal Comparison** slice. Do not authorize deployment, production mutation, Gate 4, another Gate 3 slice, RETEST 39, RETEST 40, Premium, or any internal identity/manifest/lane change until this slice is reviewed, durably persisted, and cleanly merged.

## Gate 4A Production Parity Checkpoint — Active

This current checkpoint supersedes earlier Gate 3 “next packet” and launch-preparation language above without rewriting history. Packet 4A is read-only production-parity preparation. Gate 4 remains **NOT AUTHORIZED**.

### Vercel production deployment parity — PASS

- Vercel CLI: `48.10.3`.
- Project: `investoriq`.
- Deployment: `https://investoriq-gra6pwyr1-rob-mccallums-projects.vercel.app`.
- Deployment ID: `dpl_6Um9BXvEKLer9AqYdeoZgxaW8U5S`.
- Target/status: `production` / `Ready`.
- Created: `Fri Aug 07 2026 10:37:37 GMT-0400`.
- Production aliases include `https://investoriq.tech`, `https://www.investoriq.tech`, `https://investoriq.vercel.app`, and the documented Vercel project aliases.
- Dashboard independently showed Ready/Latest, Production/Current, branch `main`, source commit `779c6b4 — docs: close Gate 3 certification`, and primary domain `investoriq.tech`.
- Certified implementation `32e566136bd77afd6e2b41a2c516e1adc8a61fa9` is an ancestor of deployed `779c6b49711278f9e6b763202213245e82d75cde`.
- Only intervening commit: documentation-only `779c6b4`; only the three active authority Markdown files changed.
- Unauthorized post-certification application changes: none found.

### Production environment presence — PARTIAL REVIEW

Authenticated Production environment listing proved major PDF, Premium, AI, frontend/server Stripe, CRON, admin, public-site, Supabase, webhook, AWS, and DocRaptor variable names without exposing secret values.

Names not shown in Production were `SUPABASE_ANON_KEY`, `STRIPE_PRICE_BUNDLE`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_STRIPE_PRICE_ID_BUNDLE`, and `REPORT_PUBLICATION_TARGET`.

`SUPABASE_ANON_KEY` is generally covered for worker/parser paths by `SUPABASE_ANON_KEY || VITE_SUPABASE_ANON_KEY`; `VITE_SUPABASE_ANON_KEY` is present. `api/jobs/request-revision.js` directly requires the standalone name, so that remains a later revision-workflow review item, not a proven first-canary blocker.

`REPORT_PUBLICATION_TARGET` is optional under the certified resolver: `production_pdf` defaults to `external_customer`, while non-production PDF defaults to `internal_test`. Its absence does not independently block publication when certified production DocRaptor mode is active. Exact non-secret PDF mode values remain pending.

### Bundle configuration defect — PROVEN

The live Pricing page displays Launch Bundle `$699`, but the CTA visibly shows `PRICING UNAVAILABLE`. `pricingConfig.js` requires absent `VITE_STRIPE_PRICE_ID_BUNDLE`; `api/create-checkout-session.js` requires absent `STRIPE_PRICE_BUNDLE` for `bundle`.

This is not a Packet 4A parity blocker and does not block standalone Full Underwriting or Screening canaries. It is a later joint commercial-launch blocker until both mappings are separately corrected and verified. The current customer-facing effect is that the visible `$699` bundle cannot be purchased. Do not fix pricing or copy in this documentation packet.

### Premium status — exact value proof pending

Both Premium variable names exist in Production, but exact values have not yet been owner-proven. Required safe state remains:

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1=false
PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT=
```

Do not claim exact Premium value proof or toggle either variable.

### Remaining Packet 4A evidence

Pending read-only owner proof covers exact non-secret values for `PUBLIC_SITE_URL`, `DOCRAPTOR_MODE`, `ALLOW_PRODUCTION_PDF`, `REPORT_DOWNLOAD_ARTIFACT_MODE`, and Premium; Supabase lifecycle schema; the `dead_letter` constraint; required RPC metadata; storage buckets/policies; exactly one active `investoriq-admin-run-worker` authority at `*/3 * * * *` targeting `https://investoriq.tech/api/admin-run-worker`; and absence of an active legacy automatic worker race.

Repository evidence already proves the GitHub automatic schedule is commented out and `workflow_dispatch` remains retained as fallback. Do not dispatch the fallback during canary execution without separate authorization.

### Elite report red-team plan — preserved

Preserve `INVESTORIQ_SOL_ELITE_REPORT_RED_TEAM_GOLD_2026-08-07.md`. After real production Screening and Full Underwriting PDFs exist, GPT-5.6 Sol will compare them against elite institutional underwriting, lender, IC, valuation, and professionally typeset financial materials. The audit covers wording, punctuation, terminology, typography, spacing, alignment, page composition, margins, tables, charts, hierarchy, source presentation, repetition, AI-sounding copy, product differentiation, commercial credibility, DocRaptor, Textract, HTML/CSS paged media, PDF Boss, extraction structure, and evidence preservation. It must explain precise improvements and say **LEAVE IT ALONE** where warranted. Do not execute it during Packet 4A.

No application, test, configuration, migration, worker, parser, schema, manifest, lane, identity, Premium, scheduler, Supabase, Stripe, purchase, credit, report, artifact, deployment, or production state was changed by this checkpoint.

## Gate 4A Production Parity Closeout — PASS / CLOSED

This closeout supersedes earlier Packet 4A pending-evidence language above without rewriting history. It records owner-authenticated production-parity evidence only. Gate 4 remains controlled and **NOT AUTHORIZED**.

### Production and PDF configuration

- Production environment: `Production`.
- Status: `Ready / Latest`.
- Production state: `Current`.
- Branch: `main`.
- Source commit: `779c6b4 — docs: close Gate 3 certification`.
- Primary domain: `investoriq.tech`.
- Certified implementation `32e566136bd77afd6e2b41a2c516e1adc8a61fa9` remains an ancestor.
- No application or configuration commit intervened after Gate 3 certification.
- `PUBLIC_SITE_URL=https://investoriq.tech`.
- `DOCRAPTOR_MODE=production`.
- `ALLOW_PRODUCTION_PDF=true`.
- `REPORT_DOWNLOAD_ARTIFACT_MODE=production_pdf`.
- `REPORT_PUBLICATION_TARGET` remains absent; certified production resolution defaults to `external_customer`.

### Premium safe state — PASS / CLOSED

The stale activation timestamp was removed from Production while the capability remained false. Final verified state:

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1=false
PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT=ABSENT
```

The issue is **CLOSED / PASS**, not deferred configuration debt. With capability false, new Underwriting jobs resolve to the base surface.

### Production lifecycle schema — PASS

Owner-authenticated metadata proved `analysis_jobs` contains:

`id uuid NOT NULL`; `user_id uuid NOT NULL`; `status text NOT NULL DEFAULT 'queued'`; `error_code text`; `error_message text`; `report_id uuid`; `report_type text NOT NULL DEFAULT 'screening'`; `failure_reason text`; `purchase_id uuid`; `worker_attempt_id uuid`; `worker_attempt_count integer NOT NULL DEFAULT 0`; `worker_lease_expires_at timestamptz`; `worker_claimed_at timestamptz`; `worker_last_heartbeat_at timestamptz`; `worker_claimed_by text`; and `dead_lettered_at timestamptz`.

### Status and lifecycle RPCs — PASS

Production `analysis_jobs_status_check` accepts exactly:

`needs_documents`, `queued`, `extracting`, `underwriting`, `scoring`, `rendering`, `pdf_generating`, `publishing`, `published`, `failed`, `dead_letter`.

Additional constraints proved: `dead_lettered_at IS NULL OR status = 'dead_letter'`, `worker_attempt_count >= 0`, and report types `screening`, `underwriting`, `ic`.

Owner-authenticated metadata proved public SECURITY DEFINER functions:

- `claim_next_worker_job(text)`
- `claim_worker_job(uuid, text)`
- `renew_worker_lease(uuid, uuid, text)`
- `transition_worker_job(uuid, uuid, text, text, text)`
- `fail_worker_job(uuid, uuid, text, text, text, text, text)`
- `fail_expired_worker_job(uuid, uuid, text, text, text, text, text)`
- `restore_failed_worker_entitlement(uuid, uuid, text, text, text, text)`
- `governed_requeue_worker_job(uuid, text)`

`process_exact_queued_job` and `fail_exact_expired_worker_job` are worker actions, not missing RPCs. Production `dead_letter` compatibility: **PASS**.

### Storage — PASS

All expected private buckets exist:

- `staged_uploads`
- `generated_reports`
- `report-issues`

Observed policy families include `staged_uploads_insert_own`, generated-report own-folder INSERT/SELECT, report-issue own-file INSERT/SELECT, and tenant-folder authenticated policies. No first-canary storage incompatibility was found.

### Single-worker authority — PASS

Owner-authenticated pg_cron evidence proved exactly one active InvestorIQ automatic worker:

- jobid `1`
- jobname `investoriq-admin-run-worker`
- schedule `*/3 * * * *`
- active `true`
- mechanism `net.http_post`
- method `POST`
- target `https://investoriq.tech/api/admin-run-worker`

Repository evidence proves the GitHub automatic schedule remains commented out and `workflow_dispatch` remains available as manual fallback. Worker-race verdict: **PASS — no active legacy automatic GitHub race identified**. Do not retire or dispatch the fallback here.

### Open pre-launch items

The cron authentication credential appeared during owner SQL evidence collection and is not reproduced here. It must be rotated in a separately authorized launch-hardening packet by atomically rotating Vercel `CRON_SECRET` and the Supabase pg_cron request header, then verifying they match. Rotation is deferred and was not performed here.

The bundle defect remains open: `STRIPE_PRICE_BUNDLE` and `VITE_STRIPE_PRICE_ID_BUNDLE` are absent, and the visible `$699` Launch Bundle shows `PRICING UNAVAILABLE`. Classification: **does not block standalone canaries but blocks joint commercial launch**.

Standalone `SUPABASE_ANON_KEY` remains absent while `VITE_SUPABASE_ANON_KEY` is present. Classification: **later revision-workflow debt / non-blocking for first canaries**.

### Gate 4A verdict and next boundary

**Gate 4A Production Parity — PASS / CLOSED.** Production infrastructure is sufficiently proven for a separately authorized first controlled Full Underwriting canary.

The next authorized decision point is to prepare and execute exactly one controlled live Full Underwriting launch-certification canary. Screening is not authorized by this closeout. Bundle sales, joint commercial launch, and broader Gate 4 execution remain unauthorized.

Preserve `INVESTORIQ_SOL_ELITE_REPORT_RED_TEAM_GOLD_2026-08-07.md`; provide it to GPT-5.6 Sol with the real production Full Underwriting PDF and, when useful, source documents only after that PDF exists. Do not execute the audit here.

## Gate 4B Full Underwriting Constitutional PDF Boss Repair - PASS / CLOSED

This section supersedes earlier Gate 4 launch-boundary language above without rewriting the historical record. Gate 4B is complete and durably persisted to `origin/main`.

### Current durable state

- Gate 1: **PASS / CLOSED**.
- Gate 2: **PASS / CLOSED**.
- Gate 3: **PASS / CLOSED**.
- Gate 4A: **PASS / CLOSED**.
- Gate 4B: **PASS / CLOSED**.
- Final Gate 4B commit: `54a085198152fc4887b89c27d6618a3c742536fd`.
- Commit message: `fix: preserve publishable core through PDF recovery`.
- `HEAD == origin/main == 54a085198152fc4887b89c27d6618a3c742536fd`.

### Core-Gated Publish-or-Collapse doctrine

InvestorIQ uses Core-Gated Publish-or-Collapse.

If the available canonical T12 and/or Rent Roll provides sufficient truthful core authority to produce a defensible report, the report **MUST publish**. Missing minor core details and optional, analytical, certification, PDF Boss, layout, chart, table, appendix, punctuation, presentation, or other non-core defects must be handled by qualification, bounded repair, compaction, collapse, omission, deterministic emergency minimum-core presentation, or publication with a quality incident at the narrowest possible level.

Whole-report failure and credit restoration are permitted only when core financial evidence is genuinely missing, corrupted, invalid, irreconcilable, or otherwise insufficient for a truthful report, or when a genuine infrastructure failure makes it physically impossible to produce any truthful PDF bytes. PDF Boss must never independently terminal-fail a sufficient-core report.

### Gate 4B runtime scope

Runtime files:

- `api/_lib/report-delivery-output.js`
- `api/_lib/generate-client-report-impl.js`

Adversarial test files:

- `tests/qa/section-disposition-contract-smoke.js`
- `tests/qa/p0c-final-pdf-publication-quality-boss-smoke.js`

Proven behavior includes healthy existing artifacts remaining authoritative without replacement upload; CSS and semantic recovery replacing damaged stored PDFs with `upsert: true`; canonical core-safe fallback preserving mandatory core display; deterministic emergency minimum-core fallback preserving sufficient-core publication with `publishable_with_quality_incident`; insufficient-core initial render failure remaining fail-closed; total renderer outage remaining genuine infrastructure failure; original render diagnostics remaining observable; initial emergency artifacts bypassing inappropriate rich CSS/semantic recovery; and the final bounded recovery buffer owning the production generator PDF output.

### Gate 4B proof and launch boundary

- `node tests/qa/section-disposition-contract-smoke.js` - **35/35 PASS**.
- `node tests/qa/p0c-final-pdf-publication-quality-boss-smoke.js` - **PASS**.
- `node --check` on both runtime files - **PASS**.
- `node --check` on both test files - **PASS**.
- `git diff --check` - **PASS**.
- Commit push to `origin/main` - **PASS**.

Screening has **not** been run as part of this certification sequence. No post-Gate-4B production canary or report generation has occurred. Premium remains **OFF**. Bundle pricing remains separately open and untouched. RETEST 39 remains terminal `dead_letter` and must not be requeued. RETEST 40 must not be created. Do not create another report or patch an individual historical failed report; systemic fixes only.

InvestorIQ still has the Vercel worker and the legacy GitHub worker/fallback. The legacy GitHub worker is **not retired**; retain it until the Vercel worker is proven operational under the agreed certification path. Do not dispatch it here.

The next step is the smallest separately authorized post-Gate-4B launch-certification step, using existing roadmap language: determine and, only when authorized, execute exactly one controlled live Full Underwriting launch-certification canary. This documentation closeout authorizes no production canary, Screening run, Full Underwriting generation, worker action, or new report. Do not invent Gate 4C.
