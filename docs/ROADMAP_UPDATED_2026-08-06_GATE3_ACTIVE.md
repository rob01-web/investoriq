# InvestorIQ Roadmap

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


Current authority:
- `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`
- `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
- `docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md`
- `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-08-04.md`

Operating rules:
- Document-driven only.
- Fail-closed behavior at the narrowest defensible level (Core-Gated Publish-or-Collapse).
- Deterministic math.
- Institutional tone.
- No hype.
- No BUY/SELL language.
- No fabricated narrative.
- No unnecessary duplication between Screening and Underwriting.
- Premium remains exactly false until separately authorized.
- If ROADMAP, STATUS, a handoff, an implementation assumption, a test, a Codex prompt, or an investigation conclusion conflicts with Product Doctrine or H0 authority, **Product Doctrine and H0 authority win**.

## Core-Gated Publish-or-Collapse (non-negotiable)

- Approximately 99.999% of reports with valid core evidence should publish.
- Valid T12 and Rent Roll authority governs whether the report has a publishable core.
- Optional, supplementary, analytical, layout, chart, table, appendix, and presentation defects must be handled at the narrowest defensible level.
- Preferred outcomes: publish → publish with quality incident → bounded repair and publish → collapse/omit/qualify defective surface and publish.
- Whole-report terminal failure is reserved for missing, invalid, corrupted, materially misleading, or irreconcilable core authority, or a genuinely unavoidable technical condition where no safe degraded report can be delivered.
- A PDF-quality gate may block one generated PDF artifact; it must not automatically convert an otherwise valid-core report into a whole-report failure.
- After bounded repair is exhausted, evaluate safe surface collapse before terminal failure.

## Doctrine gate for every future packet

Before any diagnosis or Codex repair prompt, classify:
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

Current state (August 6, 2026):
- H0 through H10 complete (including H6 correction `9950ab0`).
- Authoritative implementation HEAD: `c8a9f4f7f719fa1b34bf868a9bc8530213cfccd2` (validated-core Full Underwriting handler fixture).
- Ancestors: `087f97d` (fail_exact_expired_worker_job), `1bceb47` (governed-retry parser resume), `a06b897` (parser rescue).
- RETEST 39 terminal `dead_letter` (attempt 3); commercial integrity PASS.
- Governed parser-resume proof: PASS.
- Attempt 3 produced approved HTML (~50,990 chars), valid 14-page PDF (82,480 bytes), page receipts, chart certification, and one bounded institutional PDF recovery that did not recover.
- PDF Boss blocked customer delivery (`internal_pdf_publication_quality_failure`; blocking codes `PDF_PAGE_OVERFLOW`, `PDF_REQUIRED_FINANCIAL_FACTS_MISSING`).
- No `public.reports` row; no customer publication; job stranded in `rendering` until exact dead-letter recovery.
- End-to-end publication: HOLD — doctrine-compliant collapse-and-publish path not proven.
- Production worker: Supabase pg_cron job 1 (`investoriq-admin-run-worker`, `*/3 * * * *`) active again.
- Legacy GitHub automatic schedule remains paused; `workflow_dispatch` retained.
- RETEST 40 must not be created.
- Premium remains false.
- Gate 1 collapse-path and lifecycle investigation: PASS / complete.
- Gate 2 systemic implementation: PASS / accepted.
- Next decision point: review the Valuation / Appraisal Comparison implementation receipt.

## Completed recent sequence

| Item | Commit / proof | Status |
|------|----------------|--------|
| Parser rescue (`sourceContentSha256`) | `a06b897` | Deployed |
| Governed requeue RPC | production verified | Complete |
| Exact-job isolation | `05ccee4` | Deployed |
| RETEST 39 attempt 2 diagnosis | MISSING_STRUCTURED_FINANCIAL_ARTIFACTS / failed T12 not reparsed | Complete |
| Legacy GH schedule pause | `worker-kick.yml` schedule commented; dispatch kept | Complete |
| Governed-retry parser resume | `1bceb47` | Deployed; attempt 3 advanced through rendering (PASS) |
| Exact expired recovery action | `087f97d` | Deployed; invoked once → dead_letter |
| Dead-letter status constraint | `6c5c4e8` + production apply | Complete |
| RETEST 39 terminal recovery | exact recovery; entitlement_restored ×1; no 4th attempt | Complete |
| Production scheduler mapping | Supabase pg_cron job 1 `*/3` via pg_net | Mapped; active |
| RETEST 39 PDF evidence closeout | approved HTML + 14-page PDF + Boss block + no collapse-and-publish | Documented |

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
- Critical sequence: Gate 1 PASS → Gate 2 systemic implementation and receipt review → Gate 3 elite Full Underwriting certification → Gate 4 controlled launch certification.
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

## Remaining sequence

1. **Gate 1:** PASS / complete.
2. **Gate 2:** Authorized / implementation in progress; next decision is review of the Gate 2 implementation receipt.
3. **Gate 3:** Not started; begins only after Gate 2 review and acceptance.
4. **Gate 4:** Not started; requires separately authorized canaries.
5. Do not authorize another RETEST 39 requeue.
6. Do not authorize RETEST 40.
7. Do not permanently retire GitHub fallback yet.
8. Do not treat "terminalize all PDF Boss blocks" as the default or intended fix.
9. No report-specific patching.
10. Premium remains off.
11. Launch target Monday, August 10, 2026 — quality and doctrine may not be sacrificed for the date.

## Horizon checklist

| Horizon | Focus | Exit criteria | Status |
|---------|-------|---------------|--------|
| H0 | Owner and authority freeze | Authority docs frozen and operable | Complete |
| H1–H2 | Doctrine and product boundaries | Product doctrine stable | Complete |
| H3 | Receipt and entitlement binding | Atomic, idempotent, owner-bound | Complete |
| H4 | Bundle entitlement creation | Exact entitlements only | Complete |
| H5 | Submission, adjudication, reservation, source registration | Deterministic and recoverable | Complete |
| H6 | Worker claim, lease, fencing, deadlines | One claim per job; safe lease expiry | Complete |
| H7 | Core/support classification and causal taxonomy | Stable and testable | Complete |
| H8 | Terminal outcome, manifest, restoration | Explicit terminals; no double-grant | Complete |
| H9 | Corrected and replacement revisions | Lineage-preserving | Complete |
| H10 | Publication, artifacts, Report History | Delivery state matches artifacts | Complete |
| Post-H10 | Governed admin retry | Production RPC verified; parser-resume deployed | Complete |
| Post-H10 | Exact-job isolation | `process_exact_queued_job` + `fail_exact_expired_worker_job` deployed | Complete |
| Post-H10 | Dead-letter status constraint | Production CHECK includes `dead_letter` | Complete |
| Post-H10 | Two-worker isolation | GH schedule paused; Supabase pg_cron mapped and controlled | Complete (mapping + pause/restore proven) |
| Post-H10 | RETEST 39 commercial closeout | dead_letter; exactly-once entitlement; no 4th attempt | Complete |
| Post-H10 | End-to-end publication proof | Live published underwriting PDF; doctrine-compliant collapse path; Gates 1–4 | HOLD - Gate 2 receipt review next |
| Post-H10 | Gate 1 collapse-path / lifecycle map | Module map; recovery semantics; Boss disposition consumption; stranding cause; implementation boundary | PASS / complete |
| Post-H10 | Gate 2 section disposition contract | Universal include/include_qualified/compact/collapse/omit for all future reports | PASS / accepted |
| Post-H10 | Gate 3 elite Full Underwriting | Institutional lender/IC-useful FU certified | ACTIVE — NOI bridge and handler proof merged; valuation/appraisal comparison pending |
| Post-H10 | Gate 4 controlled launch certification | FU + Screening canaries; human PDF review; pricing/copy closeout; joint launch | Not started; requires separately authorized canaries |

## Current Gate 3 Next Packet - August 6, 2026

Review the pending Codex receipt for the **Valuation / Appraisal Comparison** slice. Do not authorize deployment, production mutation, Gate 4, another Gate 3 slice, RETEST 39, RETEST 40, Premium, or any internal identity/manifest/lane change until this slice is reviewed, durably persisted, and cleanly merged.

## Gate 3 Closed - Gate 4 Authorization Pending

This closeout supersedes the prior Gate 3 active/pending roadmap language above without rewriting the historical record.

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
