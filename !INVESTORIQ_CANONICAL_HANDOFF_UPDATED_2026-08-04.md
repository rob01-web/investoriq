# InvestorIQ Canonical Handoff

Current date: August 5, 2026

## Current authority pointers

- Branch: `main`
- Implementation HEAD / origin/main before this docs closeout: `6c5c4e8` — `fix(schema): add dead_letter to analysis_jobs_status_check`
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
- End-to-end publication proof (PDF Boss blocked artifact; no doctrine-compliant collapse-and-publish path proven)
- Legacy GitHub worker permanent retirement
- RETEST 40 (forbidden)
- Premium remains false

## Exact next packet

**Doctrine-compliant PDF recovery and collapse-path investigation for RETEST 39 attempt 3.**

It must determine:
1. Which exact approved surfaces caused the blocking defects.
2. Which affected surfaces are core-required versus supplementary/presentation-only.
3. Why the single bounded recomposition did not recover them.
4. Whether long source IDs and lineage strings caused page overflow and false number/table certification failures.
5. Whether approved-source lineage should remain in the manifest/appendix rather than dense customer-facing table cells.
6. Whether the Debt Capacity and Coverage table can be simplified while preserving exact core facts.
7. Whether the affected table, detailed numerator/denominator rows, or source-register rows can safely collapse.
8. What minimum facts must remain visible in the customer PDF.
9. What disclosure must enter the Quality Manifest.
10. Why no collapse-and-publish path executed after bounded repair failed.
11. Why the worker remained in `rendering`.
12. The smallest doctrine-compliant implementation packet.
13. No implementation until classification is proven.

Do **not** authorize another RETEST 39 requeue.
Do **not** authorize RETEST 40.
Do **not** permanently retire the GitHub fallback yet.
Do **not** treat "terminalize all PDF Boss blocks" as the default or intended fix.

## Forbidden until separately authorized

- No RETEST 39 requeue
- No RETEST 40
- No Premium activation
- No GitHub Contents API full-file writes to large worker/parser sources
- No scheduler, worker, RPC, credit, purchase, or deployment mutation outside an explicitly authorized packet

## Prior launch context (still true)

- H0–H10 complete at repository-proof level (including H6 correction).
- Bundle pricing still shows configuration/copy debt; do not change Stripe/Vercel bundle config until a governed Full Underwriting live PDF is proven.
- Full Underwriting production output quality is not yet proven by a reviewed live customer PDF.
