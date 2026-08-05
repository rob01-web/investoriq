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

## Remaining sequence

1. **Next packet:** Doctrine-compliant PDF recovery and collapse-path investigation for RETEST 39 attempt 3 (affected surfaces; core vs supplementary; why bounded recomposition failed; source-lineage placement; Debt Capacity table simplification; minimum surviving facts; Quality Manifest disclosure; why no collapse-and-publish executed; why worker remained in `rendering`; smallest doctrine-compliant implementation packet; no implementation until classification is proven).
2. Do not authorize another RETEST 39 requeue.
3. Do not authorize RETEST 40.
4. Do not permanently retire GitHub fallback yet.
5. Do not treat "terminalize all PDF Boss blocks" as the default or intended fix.
6. Continue launch hygiene under explicit packets only.
7. Premium remains off.

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
| Post-H10 | End-to-end publication proof | Live published underwriting PDF under controlled recovery; doctrine-compliant collapse path | HOLD — PDF Boss blocked artifact; no collapse-and-publish proven |
