# InvestorIQ Status

Current date: August 5, 2026

Current authority:
- Treat `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-08-04.md` as the practical daily handoff.
- Product and launch decisions remain governed by `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`.
- Product doctrine authority remains `docs/INVESTORIQ_PRODUCT_DOCTRINE.md` (Core-Gated Publish-or-Collapse).
- Premium assignment remains `false`.
- RETEST 39 is terminal `dead_letter` and is **not authorized for another requeue**.
- RETEST 40 must **not** be created.
- No broad tests, no source-code edits outside explicitly authorized packets.
- If STATUS, ROADMAP, a handoff, an implementation assumption, a test, a Codex prompt, or an investigation conclusion conflicts with Product Doctrine or H0 authority, **Product Doctrine and H0 authority win**.

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

## Current repository and deployment state

- Branch: `main`
- Implementation HEAD / origin/main before this docs closeout: `6c5c4e8` — `fix(schema): add dead_letter to analysis_jobs_status_check`
- Important ancestors: `087f97d` (`fail_exact_expired_worker_job`), `1bceb47` (governed-retry parser resume)
- Production domain: `investoriq.tech`
- Permanent boundary: never use GitHub Contents API replacement writes on `api/admin-run-worker.js` or `api/parse/parse-doc.js`. Edit large source files locally with surgical patches and push through normal Git.

## RETEST 39 final production result

- Job: `084a982e-ff6e-49b0-a7f7-473ed314aada`
- Purchase: `db421bc7-c850-4429-ab13-e1e53b6161a1` (remained bound)
- Final status: `dead_letter`
- Final error: `TIMEOUT` — Processing timed out. Please log in to your InvestorIQ dashboard to review the job status.
- Attempt count: `3`
- Final attempt ID: `6bc7f737-4e39-4ce8-b2dc-ed3836b1a294`
- Claimed by: `2026-08-04T22-03-00.204Z`
- Dead-lettered at: `2026-08-05 18:35:43.118214+00`
- Lease cleared: `worker_lease_expires_at = null`
- Report credits remained: `0`
- Event integrity:
  - `entitlement_restored` events: exactly 1
  - `worker_claimed` events: exactly 3
  - `worker_admin_requeued` events: exactly 2
  - no fourth attempt
  - no duplicate entitlement restoration
  - no duplicate credit
  - no RETEST 40

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

- **Governed parser-resume proof: PASS** — attempt 3 advanced `queued → extracting → underwriting → scoring → rendering`, clearing the prior stale failed-T12 state that caused `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`.
- **End-to-end publication proof: HOLD** — approved HTML and a valid 14-page PDF were produced; PDF Boss blocked customer delivery; no collapse-and-publish path executed; no `public.reports` row; job stranded in `rendering` until exact dead-letter recovery.
- **RETEST 39 lifecycle recovery and commercial integrity: PASS** — exact expired recovery, dead-letter terminal, exactly-once entitlement restoration preserved.

## Dead-letter contract repair

- Production previously rejected canonical H6 terminal status `dead_letter` because `analysis_jobs_status_check` omitted it.
- Repository migration `supabase/migrations/20260805000100_analysis_jobs_status_check_dead_letter.sql` committed at `6c5c4e8`.
- Production constraint was applied and verified to include `dead_letter` only; no existing status removed or renamed.

## Exact expired-job recovery

- Deployed action: `fail_exact_expired_worker_job` via `POST /api/admin-run-worker` (`087f97d`).
- Invoked exactly once after production constraint repair.
- Response proved: `previous_status: rendering` → `final_status: dead_letter`; attempt count 3; same attempt ID preserved; `entitlement_restored: false`; `entitlement_already_restored: true`; `credit_balance_changed: false`.
- Exact-job fencing worked; ordinary worker loop bypassed; no unrelated job processed; no fourth attempt; prior entitlement restoration recognized; no duplicate commercial remedy.

## Two-worker / scheduler authority

### Production worker (active)
- Supabase `pg_cron` / `pg_net` invokes `POST https://investoriq.tech/api/admin-run-worker`
- Cron job: jobid `1`, jobname `investoriq-admin-run-worker`, schedule `*/3 * * * *`
- Mechanism: `pg_net`; observed user agent in Vercel logs: `pg_net/0.19.5`
- Temporarily paused with `cron.alter_job(1, active := false)` for controlled recovery; pause proof: active = false and no new `worker_lease_expired` events across more than two cadence windows.
- Restored with `cron.alter_job(1, active := true)`; final proof: active = true, cadence preserved, no further `worker_lease_expired` events for terminal RETEST 39 after more than two scheduler cycles.

### Legacy worker
- Workflow: `.github/workflows/worker-kick.yml`
- Automatic GitHub schedule remains paused (commented out).
- `workflow_dispatch` remains available as manual fallback.
- Legacy worker is not yet permanently retired.

## Completed sequence (Aug 2–5, 2026) — summary

1. Parser rescue `a06b897` deployed.
2. Governed requeue production RPC installed and verified.
3. Exact-job isolation `05ccee4` / `process_exact_queued_job` deployed.
4. RETEST 39 attempt 2 failed with `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` (stale failed T12).
5. Legacy GH schedule paused; production worker later identified as Supabase pg_cron `*/3`.
6. Governed-retry parser resume `1bceb47` deployed.
7. Exact expired recovery action `087f97d` added.
8. Dead-letter status constraint repair `6c5c4e8` committed; production constraint applied.
9. RETEST 39 attempt 3 advanced through rendering, HTML, QA, PDF generation, and one bounded recovery; PDF Boss blocked the artifact; job stranded in `rendering`; exact recovery → `dead_letter` (commercial integrity PASS).

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

### Gate 1 — Doctrine-compliant collapse-path and lifecycle investigation

**Investigation only.** No source edits, production mutation, worker invocation, scheduler change, RPC call, RETEST, deployment, broad audit, or broad test suite.

Prove:
1. Which module builds the dense debt-capacity, coverage, calculation-detail, source-ID, and lineage surfaces.
2. What the existing bounded PDF recovery actually changes.
3. Whether recovery only adjusts composition/style or can semantically compact, collapse, omit, or replace sections.
4. Where PDF Boss returns its final artifact disposition.
5. Which worker branch consumes that disposition.
6. Why no governed collapse-and-publish path executed.
7. Why the job remained stranded in `rendering`.
8. The smallest safe system-wide implementation boundary.

### Gate 2 — System-wide doctrine-aware section disposition and collapse

After Gate 1 classification is accepted, implement a **universal pre-render section-disposition contract**.
Each governed report surface must deterministically resolve to an outcome such as: include; include qualified; compact; collapse; omit.

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

## Current HOLD / next packet

**Exact next packet: Gate 1 — Doctrine-compliant collapse-path and lifecycle investigation (system-wide; RETEST 39 is forensic evidence only).**

Gate 1 is investigation only. No source implementation until Gate 1 classification is accepted.
Do **not** frame any packet as repairing RETEST 39 or one failed PDF.
Do **not** authorize another RETEST 39 requeue.
Do **not** authorize RETEST 40.
Do **not** permanently retire the GitHub fallback yet.
Do **not** treat "terminalize all PDF Boss blocks" as the default or intended fix.
Premium remains false.
Screening and Full Underwriting launch together, or neither launches.

## Permanent prohibitions

- No RETEST 39 requeue
- No RETEST 40
- No report-specific patching (systemic repair only)
- No Premium activation
- No GitHub Contents API full-file write to protected large source files (`api/admin-run-worker.js`, `api/parse/parse-doc.js`)
- No broad audits
- No scheduler, worker, RPC, credit, purchase, or deployment mutation outside an explicitly authorized packet
