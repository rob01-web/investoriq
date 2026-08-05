# InvestorIQ Roadmap

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

Current state (August 5, 2026):
- H0 through H10 complete (including H6 correction `9950ab0`).
- Implementation HEAD before this docs closeout: `6c5c4e8` (dead_letter status constraint).
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

## Remaining sequence

1. **Gate 1 (next):** Doctrine-compliant collapse-path and lifecycle investigation — system-wide map; RETEST 39 forensic only; investigation only.
2. **Gate 2:** System-wide doctrine-aware section disposition and collapse (universal pre-render contract).
3. **Gate 3:** Elite Full Underwriting output certification.
4. **Gate 4:** Controlled launch certification (new canaries; Screening + Full Underwriting together or neither).
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
| Post-H10 | End-to-end publication proof | Live published underwriting PDF; doctrine-compliant collapse path; Gates 1–4 | HOLD — Gate 1 investigation next; systemic repair required |
| Post-H10 | Gate 1 collapse-path / lifecycle map | Module map; recovery semantics; Boss disposition consumption; stranding cause; implementation boundary | HOLD — next packet |
| Post-H10 | Gate 2 section disposition contract | Universal include/qualify/compact/collapse/omit for all future reports | Not started |
| Post-H10 | Gate 3 elite Full Underwriting | Institutional lender/IC-useful FU certified | Not started |
| Post-H10 | Gate 4 controlled launch certification | FU + Screening canaries; human PDF review; pricing/copy closeout; joint launch | Not started |
