# InvestorIQ Roadmap

## 2026-08-14 Session Acknowledgement Audit Closeout

- Branch: `main`
- SOURCE / CODE status: PASS / UNCOMMITTED
- PRODUCTION status: PENDING
- P0 constitutional repository/source closure remains CLOSED.
- RETEST 44 worker continuation remains PASS / CLOSED.
- RETEST 45 remains historical production failure:
  - job `64e47d43-04bc-4b1d-9639-5bd9bcba25e7`
  - `REPORT_RENDER_FAILED`
  - exact blocker `finalPdfCorePublishable is not defined`
  - core was publishable
  - credit remedy PASS
- Constitutional dependency set later closed at commit `744cf0fd0dd7bb86a052618901b57da7c5e2327d`.
- Legal-page disclosure authority repair committed/pushed at `eaf68b06619fc349384c569c58a904e76c755c5d` with commit message `fix: align legal pages with disclosure authority`.
- Canonical disclosure version remains `v2026-08-02`.
- Production `/disclosures` and dashboard were visually observed using current `v2026-08-02` remedy copy.
- Historical permanent `accepted_at` was displayed when a user freshly clicked acknowledgement in a later login session; that defect is recorded and corrected in the current source/code implementation.
- Final agreed disclosure model:
  - permanent legal acceptance remains version/hash-bound and historical
  - every new authenticated login session requires fresh acknowledgement
  - same-session refresh/navigation preserves acknowledgement
  - logout/auth loss ends it
  - new disclosure version/hash invalidates it
  - UI says `ACKNOWLEDGED` with session acknowledgement timestamp
  - durable server-side session acknowledgement audit is required
- Current source/code implementation set:
  - `src/pages/Dashboard.jsx`
  - `src/lib/sessionDisclosureAck.js`
  - `src/contexts/SupabaseAuthContext.jsx`
  - `api/disclosure-session-ack.js`
  - `api/_lib/authenticated-actor.js`
  - `supabase/migrations/20260814000100_disclosure_session_ack_events.sql`
  - `supabase/local-bootstrap.sql`
- New durable table: `public.disclosure_session_ack_events`
  - `user_id`
  - disclosure key/version/hash
  - authenticated session identifier
  - `acknowledged_at`
  - `ip`
  - `user_agent`
- Session identity authority: Supabase authenticated JWT `session_id`, with `jti` fallback.
- Same-session duplicate prevention: unique `user_id` + disclosure version/hash + session identifier.
- Dashboard unlock order:
  - permanent legal acceptance succeeds
  - durable session acknowledgement succeeds
  - sessionStorage is written
  - checkbox becomes acknowledged
  - workflow unlocks
- Build PASS.
- `git diff --check` PASS.
- No commit, push, or deploy has occurred for this implementation yet.
- Migration has not yet been applied to production.
- Production runtime proof remains pending.
- RETEST 46 does not exist and remains forbidden until:
  - migration applied
  - implementation committed/pushed/deployed
  - production acknowledgement behavior verified
  - durable audit row verified

## 2026-08-14 Disclosure / Session Ack Production Closeout

- Initial session-ack implementation commit: `6ecdd9f1a902f0b9af77427f205730991d5401b7`.
- Hobby function-limit consolidation commit: `cb0d478e7a61d9f6e657349b70ca98dc829d3362`.
- Final session acknowledgement POST is consolidated into `POST /api/legal-acceptance` with `{ session_ack: true }`.
- `api/disclosure-session-ack.js` was deleted to remain within Vercel Hobby’s 12-function limit.
- Local `npm run build`: PASS.
- `git diff --check`: PASS.
- Production DB proof: `public.disclosure_session_ack_events` was applied manually in Supabase production from committed migration `20260814000100_disclosure_session_ack_events.sql`; expected columns were verified and RLS was verified enabled.
- Production DB housekeeping: the remote Supabase migration ledger is not aligned with repo migration history, so `supabase db push` remains unsafe until separately reconciled.
- Production deployment: commit `cb0d478e7a61d9f6e657349b70ca98dc829d3362` deployed successfully to Vercel Production and is `Ready / Latest / Current`.
- Production runtime proof: fresh authenticated-session behavior was manually proven end to end.
- Runtime lifecycle proof:
  - fresh login -> disclosure unchecked
  - acknowledge -> UI shows `ACKNOWLEDGED` with current session timestamp
  - refresh -> acknowledgement preserved for same session
  - logout + new login -> unchecked again
  - acknowledge again -> new session timestamp
- Durable audit proof: `public.disclosure_session_ack_events` contains distinct acknowledgement rows for distinct authenticated sessions for the same user and current disclosure authority.
- Disclosure/session acknowledgement status: `PASS / CLOSED / PRODUCTION-PROVEN`.
- Permanent historical legal acceptance remains separate from per-login session acknowledgement.
- RETEST 46 is now AUTHORIZED but has not yet been run.

### Next boundary

1. Commit/push the three corrected authority Markdown files after owner authorization.
2. RETEST 46 is the next authorized production proof.
3. Do not claim RETEST 46 PASS until evidence exists.
4. After RETEST 46 successfully closes, freeze infrastructure and proceed to Institutional Report Product & Visual Redesign.

### Status labels

- SOURCE / CODE: PASS / COMMITTED / PUSHED
- Final consolidation commit: `cb0d478e7a61d9f6e657349b70ca98dc829d3362`
- PRODUCTION: PASS / DEPLOYED / CURRENT / PRODUCTION-PROVEN
- DISCLOSURE / SESSION ACKNOWLEDGEMENT: PASS / CLOSED / PRODUCTION-PROVEN
- RETEST 46: AUTHORIZED / NOT YET RUN
- Premium: OFF

## 2026-08-12 Core Publication Constitution + RETEST 45 Root-Cause Checkpoint

- Branch: `main`
- HEAD: `4756950e014097eb3486df3ccaa5a2585037be75`
- origin/main: `4756950e014097eb3486df3ccaa5a2585037be75`
- Production Vercel deployment: READY / LATEST / CURRENT
- Deployed commit: `4756950`
- Commit message: `fix: align disclosure acceptance and credit remedy`
- RETEST 44 worker continuation proof remains PASS / CLOSED.
- RETEST 45 production result:
  - property/report name: `Final Attack Test 8 RETEST 45`
  - job ID: `64e47d43-04bc-4b1d-9639-5bd9bcba25e7`
  - report type: `underwriting`
  - reached rendering / report generation
  - production POST `https://investoriq.tech/api/generate-client-report`
  - HTTP `500`
  - `error_code = REPORT_RENDER_FAILED`
  - `failure_class = internal_system_failure`
  - exact terminal runtime error: `finalPdfCorePublishable is not defined`
  - this proves the prior RETEST 44 blocker `finalPdfArtifactMode is not defined` was cleared
  - classify as renderer/publication implementation defect / publication-contract runtime failure
- Core Publication Constitution:
  - terminal non-publication only when canonical core evidence is insufficient enough that a truthful minimum-core report would materially mislead
  - `corePublishable === true` means the report-level terminal failure rate is `0.000%` and the publication rate is `100.000%`
  - non-core defects resolve at the narrowest truthful level via retry/recover/qualify/compact/collapse/omit/emergency minimum-core render/delayed publication
  - section-level collapse applies to unsupported optional/support evidence; the sufficient-core report must still publish
- CTSS:
  - range `0-100`
  - explanatory and governance-oriented only
  - terminal failure still depends on Minimum Truth Set failure
  - canonical T12 and Rent Roll minimum bases remain the governed core fields already represented by InvestorIQ
- RETEST 45 credit/remedy:
  - restored
  - `true`
  - error `null`
  - RETEST 45 CREDIT REMEDY = PASS
- Acknowledgement/version enforcement remains a separate customer-visible disclosure/version-enforcement defect.
- RETEST 46 does not yet exist and is not authorized.
- The next production report is not authorized until publication-contract drift is closed and constitutional failure containment is implemented.
- Current automatic worker scheduler remains Supabase Cron at `*/3 * * * *` for `investoriq-admin-run-worker`.
- GitHub `worker-kick.yml` remains manual fallback only.
- P0-A mutable-database distinction remains preserved.
- Docker/local Supabase replay remains non-active and is not the next action.
- Institutional redesign sequence remains preserved after true P0 publication architecture is closed.

## 2026-08-12 Documentation Checkpoint Before RETEST 45 Intake

- Branch: `main`
- HEAD: `4756950e014097eb3486df3ccaa5a2585037be75`
- origin/main: `4756950e014097eb3486df3ccaa5a2585037be75`
- Production Vercel deployment: READY / LATEST / CURRENT
- Deployed commit: `4756950`
- Commit message: `fix: align disclosure acceptance and credit remedy`
- RETEST 44 worker continuation proof is PASS / CLOSED.
- RETEST 44 final runtime failure remains a separate unresolved production evidence point:
  - exact blocker: `finalPdfArtifactMode is not defined`
  - error code: `REPORT_RENDER_FAILED`
  - failure class: `internal_system_failure`
- P0 `finalPdfArtifactMode` repair is PASS / TEST PASS / COMMITTED / DEPLOYED.
  - commit: `26e8d4bee2140f3f54f5fb2444950b77a0effbdd`
  - commit message: `fix: remove undefined final pdf artifact alias`
  - fresh production runtime publication proof after the repair is still PENDING RETEST 45.
- Acknowledgement / disclosure repair is PASS / COMMITTED / DEPLOYED / CURRENT.
  - commit: `4756950e014097eb3486df3ccaa5a2585037be75`
  - canonical disclosure version: `v2026-08-02`
  - canonical acknowledgement text/hash/reacceptance behavior recorded
- Terms commercial remedy alignment is recorded and the Terms version remains `v2026-01-14`.
- RETEST 45 status: RESULTS PENDING OWNER-SUPPLIED EVIDENCE.
  - It is not another worker-handoff test.
  - It must prove current acknowledgement/reacceptance, `v2026-08-02` customer-visible disclosure, fresh acceptance rather than stale `v2026-01-14`, and truthful final publication if no new independent runtime blocker exists.
- Current automatic worker scheduler remains Supabase Cron at `*/3 * * * *` for `investoriq-admin-run-worker`.
- GitHub `worker-kick.yml` remains manual fallback only.
- P0-A mutable-database distinction remains preserved.
- Docker/local Supabase replay remains non-active and is not the next action.
- After RETEST 45 evidence is adjudicated, proceed with the institutional redesign sequence only if the production proof warrants it.

## 2026-08-12 Documentation Checkpoint After P0 Worker Handoff Deployment

- Branch: `main`
- HEAD: `a91149d6868301499c88a2bfc1c3044850391bdc`
- origin/main: `a91149d6868301499c88a2bfc1c3044850391bdc`
- Production Vercel deployment: READY / LATEST / CURRENT
- Deployed commit: `a91149d`
- Commit message: `fix: hand off deferred worker leases`
- Current automatic worker scheduler: Supabase Cron at `*/3 * * * *` for `investoriq-admin-run-worker`.
- GitHub `worker-kick.yml` remains manual fallback only.
- RETEST 43 remains historical forensic evidence of the controlled timebox-defer/lease-fencing defect, not a parser failure.
- P0 worker continuation repair is deployed, but production runtime continuation proof is still pending.
- Next step: one fresh production runtime proof that a deferred job returns to `queued` and the next cron resumes it immediately.
- After that proof, freeze infrastructure.
- Then proceed into the institutional underwriting / visual redesign workstream.
- Then real PDF generation review and the preserved Sol Gold audit.
- Do not make Docker/local Supabase the next action.

## 2026-08-08 Fresh Handoff Checkpoint

- Current local HEAD: `f844b9a480a67e01e1e08ba1ca2dd12783cfae97`
- origin/main remains: `94fba3037a2fef76e97e24e15893008e05f8607d`
- Five local commits are ahead of origin and unpushed/un-deployed: `db6f78b`, `b4cc594`, `eaabf09`, `b674a0e`, `f844b9a`
- P0-A publication authority/customer visibility repair exists locally as `eaabf09`
- P0-A helper/mocked tests passed, but real local-Supabase proof remains blocked
- Docker works, but `npx supabase start` is blocked because local migrations assume baseline tables exist before they are created
- Missing/assumed baseline tables include `analysis_jobs`, `analysis_job_files`, and likely `reports`
- DocRaptor endpoint/diagnostics repair exists locally as `db6f78b`; provider acceptance remains unproven
- DocRaptor production-mode governance repair exists locally as `b674a0e`
- Owner authorization flag is `DOCRAPTOR_PRODUCTION_OWNER_AUTHORIZED=true`
- Production DocRaptor mode must not activate from `DOCRAPTOR_MODE=production`, `ALLOW_PRODUCTION_PDF=true`, or `REPORT_DOWNLOAD_ARTIFACT_MODE=production_pdf` alone
- DocRaptor diagnostic safety/raw provider logging cleanup exists locally as `f844b9a`
- `f844b9a` bounded network/no-response diagnostics and aggregate provider diagnostics
- Remaining diagnostics risk: explicit DocRaptor/internal HTTP timeout/deadline handling still open
- Production DocRaptor quota remains exhausted: Production Docs 5/5 used; Test Docs 0/unlimited; billing period Aug 01, 2026 - Aug 31, 2026
- DocRaptor production mode remains not owner-authorized
- Provider acceptance remains unproven
- No production canary is authorized
- RETEST 43 does not exist and is not authorized
- Next intended code packet: explicit timeout/deadline handling for DocRaptor/provider/internal HTTP paths

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

## Gate 4A Evidence Collection — Active

This section supersedes earlier Gate 3 active/pending roadmap language above without rewriting history. Packet 4A is documentation of owner-authenticated read-only production-parity evidence. Gate 4 execution remains separately authorized and **NOT AUTHORIZED**.

### Production parity — PASS

Vercel CLI `48.10.3` and Dashboard evidence identify the current production deployment as project `investoriq`, deployment ID `dpl_6Um9BXvEKLer9AqYdeoZgxaW8U5S`, URL `https://investoriq-gra6pwyr1-rob-mccallums-projects.vercel.app`, target `production`, status `Ready`, created `Fri Aug 07 2026 10:37:37 GMT-0400`, primary domain `investoriq.tech`, branch `main`, and source commit `779c6b4 — docs: close Gate 3 certification`. Production aliases include `investoriq.tech`, `www.investoriq.tech`, `investoriq.vercel.app`, and the documented Vercel aliases.

Certified implementation `32e566136bd77afd6e2b41a2c516e1adc8a61fa9` is an ancestor of deployed `779c6b49711278f9e6b763202213245e82d75cde`. The only intervening commit is documentation-only `779c6b4`, changing only the three active authority Markdown files. No unauthorized post-certification application changes were found.

### Environment review — PARTIAL

Authenticated Production environment listing proved major PDF, Premium, AI, Stripe, CRON, admin, public-site, Supabase, webhook, AWS, and DocRaptor names without exposing secret values. Not shown were `SUPABASE_ANON_KEY`, `STRIPE_PRICE_BUNDLE`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_STRIPE_PRICE_ID_BUNDLE`, and `REPORT_PUBLICATION_TARGET`.

The worker/parser fallback generally permits `VITE_SUPABASE_ANON_KEY` where `SUPABASE_ANON_KEY` is absent, so the ordinary first canary path is not proven blocked. The revision workflow still directly requires `SUPABASE_ANON_KEY`; review that separately. `REPORT_PUBLICATION_TARGET` is not independently blocking because the certified production PDF resolver defaults to `external_customer` when `production_pdf` is active.

### Bundle debt — later commercial closeout

Production Pricing visibly shows Launch Bundle `$699` with `PRICING UNAVAILABLE`. Frontend `pricingConfig.js` requires absent `VITE_STRIPE_PRICE_ID_BUNDLE`; server checkout requires absent `STRIPE_PRICE_BUNDLE`. This is not a Packet 4A parity blocker and does not block standalone Screening or Full Underwriting canaries. It is a HOLD for later joint commercial launch until both mappings are corrected and verified. The current customer-facing effect is that the visible bundle cannot be purchased. No pricing or copy repair is authorized here.

### Premium proof pending

Production contains both Premium variable names, but exact values have not been owner-proven. Required safe state remains:

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1=false
PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT=
```

Do not claim exact false/blank proof or change either value.

### Remaining evidence before canary authorization

1. Exact non-secret values for public URL, DocRaptor mode, production PDF allowance, artifact mode, and Premium.
2. Supabase lifecycle table/column compatibility.
3. `dead_letter` status constraint.
4. Required lifecycle RPC metadata.
5. Required storage buckets and policies.
6. Exactly one active automatic production worker.
7. Expected pg_cron mapping: `investoriq-admin-run-worker`, `*/3 * * * *`, `POST https://investoriq.tech/api/admin-run-worker`.
8. No active legacy automatic worker race.

Repository evidence proves the GitHub automatic schedule is commented out and manual `workflow_dispatch` remains available as fallback. Do not dispatch it during canary execution without separate authorization.

### Elite report red-team plan — preserved

Preserve `INVESTORIQ_SOL_ELITE_REPORT_RED_TEAM_GOLD_2026-08-07.md`. Execute only after real production Screening and Full Underwriting PDFs exist. The audit compares them against elite institutional underwriting, lender, IC, valuation, and professionally typeset financial materials; inspects language, typography, layout, tables, charts, source presentation, repetition, AI tone, differentiation, commercial credibility, DocRaptor, Textract, HTML/CSS paged media, PDF Boss, extraction, and evidence preservation; provides precise improvements; and says **LEAVE IT ALONE** where justified. Do not execute it during Packet 4A.

No application, test, configuration, migration, worker, parser, schema, manifest, lane, identity, Premium, scheduler, Supabase, Stripe, purchase, credit, report, artifact, deployment, or production state was changed.

## Gate 4A Production-Parity Closeout — PASS / CLOSED

This closeout supersedes earlier Packet 4A pending-evidence roadmap language above without rewriting history. It records owner-authenticated evidence only. Gate 4 remains controlled and **NOT AUTHORIZED**.

### Completed parity proof

Production is `Ready / Latest` and `Current` on branch `main`, sourced from `779c6b4 — docs: close Gate 3 certification`, with primary domain `investoriq.tech`. Certified implementation `32e566136bd77afd6e2b41a2c516e1adc8a61fa9` remains an ancestor and no application/configuration commit intervened.

Verified Production PDF configuration:

```text
PUBLIC_SITE_URL=https://investoriq.tech
DOCRAPTOR_MODE=production
ALLOW_PRODUCTION_PDF=true
REPORT_DOWNLOAD_ARTIFACT_MODE=production_pdf
```

`REPORT_PUBLICATION_TARGET` remains absent and non-blocking because certified production resolution defaults to `external_customer`.

### Premium safe state — PASS / CLOSED

The stale Premium activation timestamp was removed while the capability remained false. Final verified state:

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1=false
PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT=ABSENT
```

This issue is closed and is not deferred configuration debt.

### Lifecycle, status, RPC, and storage proof — PASS

Production `analysis_jobs` metadata proved the required UUID, status, error, report, purchase, worker-attempt, lease, claim, and dead-letter fields with the owner-provided types and nullability. The status check accepts exactly:

`needs_documents`, `queued`, `extracting`, `underwriting`, `scoring`, `rendering`, `pdf_generating`, `publishing`, `published`, `failed`, `dead_letter`.

Additional constraints proved `dead_lettered_at IS NULL OR status = 'dead_letter'`, `worker_attempt_count >= 0`, and report types `screening`, `underwriting`, `ic`.

Production public SECURITY DEFINER lifecycle functions proved present:

- `claim_next_worker_job(text)`
- `claim_worker_job(uuid, text)`
- `renew_worker_lease(uuid, uuid, text)`
- `transition_worker_job(uuid, uuid, text, text, text)`
- `fail_worker_job(uuid, uuid, text, text, text, text, text)`
- `fail_expired_worker_job(uuid, uuid, text, text, text, text, text)`
- `restore_failed_worker_entitlement(uuid, uuid, text, text, text, text)`
- `governed_requeue_worker_job(uuid, text)`

`process_exact_queued_job` and `fail_exact_expired_worker_job` are worker actions, not missing RPCs.

Private buckets `staged_uploads`, `generated_reports`, and `report-issues` exist with compatible own-folder/tenant-folder policy families. No storage incompatibility was found.

### Single-worker proof — PASS

Exactly one active InvestorIQ pg_cron worker was proven: jobid `1`, jobname `investoriq-admin-run-worker`, schedule `*/3 * * * *`, active `true`, mechanism `net.http_post`, method `POST`, target `https://investoriq.tech/api/admin-run-worker`.

The GitHub automatic schedule remains commented out and manual `workflow_dispatch` remains available. Worker-race verdict: **PASS — no active legacy automatic GitHub race identified**. Do not retire or dispatch the fallback here.

### Open launch-boundary items

The cron credential observed during owner SQL collection is not reproduced. A separately authorized launch-hardening packet must rotate Vercel `CRON_SECRET` and the Supabase pg_cron request header atomically and verify the match. This rotation is deferred and was not performed here.

Bundle mappings remain absent: `STRIPE_PRICE_BUNDLE` and `VITE_STRIPE_PRICE_ID_BUNDLE`. The visible `$699` Launch Bundle remains `PRICING UNAVAILABLE`; this does not block standalone canaries but blocks joint commercial launch.

Standalone `SUPABASE_ANON_KEY` remains absent while `VITE_SUPABASE_ANON_KEY` is present; this remains later revision-workflow debt and is non-blocking for first canaries.

### Gate 4A verdict and next decision point

**Gate 4A Production Parity — PASS / CLOSED.** Production infrastructure is sufficiently proven for a separately authorized first controlled Full Underwriting canary.

Prepare and execute exactly one controlled live Full Underwriting launch-certification canary under a separate authorization. Do not authorize Screening, bundle sales, joint commercial launch, or broader Gate 4 execution in this closeout.

Preserve `INVESTORIQ_SOL_ELITE_REPORT_RED_TEAM_GOLD_2026-08-07.md`. After the real production Full Underwriting PDF exists, provide it to GPT-5.6 Sol with the PDF and useful source documents. Do not execute the audit in this packet.

## Gate 4B Full Underwriting Constitutional PDF Boss Repair - PASS / CLOSED

This section moves Gate 4B into completed work and supersedes earlier Gate 4 launch-boundary language without rewriting roadmap history.

### Completed Gate 4B work

- Gates 1, 2, 3, 4A, and 4B are **PASS / CLOSED**.
- Durable commit: `54a085198152fc4887b89c27d6618a3c742536fd`.
- Commit message: `fix: preserve publishable core through PDF recovery`.
- Push: **PASS** to `origin/main`; `HEAD == origin/main`.
- Runtime files: `api/_lib/report-delivery-output.js`, `api/_lib/generate-client-report-impl.js`.
- Adversarial test files: `tests/qa/section-disposition-contract-smoke.js`, `tests/qa/p0c-final-pdf-publication-quality-boss-smoke.js`.

Gate 4B proved that healthy existing PDFs remain authoritative without replacement upload; CSS, semantic, core-safe, and emergency replacement buffers overwrite damaged stored artifacts with `upsert: true`; mandatory core display survives through canonical core-safe or deterministic emergency minimum-core rendering; sufficient-core presentation failure publishes with a quality incident; insufficient-core failure remains fail-closed; total renderer outage produces no fabricated PDF; original render diagnostics remain observable; initial emergency artifacts do not rerun rich CSS/semantic recovery; and the final bounded recovery buffer owns production generator output.

### Doctrine and launch constraints

InvestorIQ uses Core-Gated Publish-or-Collapse. If canonical T12 and/or Rent Roll source truth is sufficient to produce a truthful defensible report, the report **MUST publish**. PDF Boss, layout, certification, optional analysis, charts, tables, appendices, punctuation, presentation, and other non-core defects must be handled by qualification, bounded repair, compaction, collapse, omission, emergency minimum-core presentation, or publication with a quality incident. Whole-report failure is reserved for genuinely insufficient core evidence or genuine infrastructure failure where no truthful PDF bytes can physically be produced. PDF Boss must never independently terminal-fail sufficient core.

Screening has **NOT** been run as part of this certification sequence. No post-Gate-4B production canary or report generation has occurred. Premium remains **OFF**. Bundle pricing remains separately open and untouched. RETEST 39 remains terminal `dead_letter` and must not be requeued. RETEST 40 must not be created. No historical failed report may be patched; systemic fixes only.

The Vercel worker and legacy GitHub worker/fallback both remain part of the operating context. The legacy GitHub worker is not retired and must remain retained until the Vercel worker is proven operational under the agreed certification path. Do not dispatch it here.

### Next bounded launch-certification phase

No Gate 4C is created by this closeout. The next step is to determine and, only under separate authorization, execute exactly one controlled live Full Underwriting launch-certification canary using the existing Gate 4A boundary language. This documentation task authorizes no production canary, Screening run, Full Underwriting generation, worker action, or new report. Bundle pricing remains a separate later joint-commercial-launch item and is not moved into the Gate sequence.

## 2026-08-11 Institutional Product Redesign / Market-Enrichment Strategic Checkpoint

This checkpoint **supersedes earlier launch-urgency language as the current strategic planning direction without rewriting historical records**.

### Current strategic posture

InvestorIQ is no longer being optimized solely for the smallest possible path to an immediate launch. The owner is evaluating a deliberate multi-week launch pause so the remaining work can be used to increase the product's institutional decision value, not merely finish infrastructure and visual polish.

This does **not** authorize production deployment, a new canary, Screening, Premium, RETEST 43, production DocRaptor mode, production Supabase mutation, pricing/bundle changes, or external data-vendor integration work.

The governing objective becomes:

> Finish the true launch-critical architecture blockers, freeze infrastructure when safe, then elevate InvestorIQ from an automated property-report generator into a governed institutional underwriting intelligence and decision-support product.

Core-Gated Publish-or-Collapse remains controlling. External enrichment, scenario analysis, visual redesign, charts, or integrations may add decision value, but none may weaken canonical T12/Rent Roll authority, fabricate unsupported facts, or turn optional enrichment absence into whole-report failure.

### Current local engineering state to preserve

The latest owner/Codex receipt before this strategic checkpoint reported:

- branch: `main`
- local HEAD: `9276a8f6e3f68f40c59ad7549ce5cb47fcb25eb2`
- origin/main: `94fba3037a2fef76e97e24e15893008e05f8607d`
- seven local commits ahead of origin/main and unpushed/undeployed:
  - `db6f78b`
  - `b4cc594`
  - `eaabf09`
  - `b674a0e`
  - `f844b9a`
  - `df43bb2`
  - `9276a8f`
- `9276a8f` adds bounded DocRaptor/provider timeout handling with a shared 45-second deadline, timeout-safe diagnostics, and focused no-provider-call tests.
- Real provider acceptance remains unproven.
- Production DocRaptor quota remains exhausted.
- Production DocRaptor owner authorization remains absent.
- P0-A real local-Supabase orchestration proof remains blocked by incomplete local baseline migration history.
- A read-only forensic Codex packet is currently investigating the local Supabase bootstrap/baseline defect.
- `!INVESTORIQ_SOL_ELITE_REPORT_RED_TEAM_GOLD_2026-08-07.md` remains future elite PDF audit guidance only.

### New institutional benchmark lesson — Blackstone/DHL work sample

The uploaded 14-page Blackstone `DHL Tsing Yi Investment Memorandum` is now an important **visual and decision-density benchmark**, not a template to copy blindly and not authority to introduce unsupported modeling.

Key lessons to carry into InvestorIQ:

1. **Decision density beats page count.**
   - The Blackstone memo reaches situation, transaction logic, basis, leverage, IRR and MOIC quickly.
   - A short institutional memo can carry more decision value than a longer prose-heavy report.

2. **Tables, matrices and charts should carry analytical weight.**
   - The Blackstone sample uses market charts, sensitivity matrices and tornado charts rather than narrating every result in paragraphs.
   - InvestorIQ should reduce unnecessary explanatory prose where a well-designed table/chart communicates the governed fact more effectively.

3. **The first pages should function as an IC decision interface.**
   - InvestorIQ should evaluate a concise executive/IC decision summary containing only source-backed or deterministic governed metrics such as purchase/basis, NOI, occupancy, cap rate, LTV, DSCR, debt yield, rent upside, evidence status and primary constraints.

4. **Scenario/sensitivity intelligence is a major potential product upgrade.**
   - Candidate governed sensitivities include interest rate/debt-service stress, occupancy/vacancy stress, rent stress, expense stress, cap-rate/value sensitivity and other deterministic scenarios for which the required operands are actually governed.
   - InvestorIQ must not invent hold periods, exit caps, growth assumptions, levered IRR, MOIC, DCF, equity returns, or other speculative assumptions merely to imitate an institutional memo.
   - Unsupported scenario families remain omitted unless the user supplies or a future governed external source supplies the required assumptions.

5. **Institutional visual design is restrained, crisp and information-first.**
   - Re-evaluate InvestorIQ's cover page and full report treatment against the Blackstone sample.
   - Specifically assess a cleaner white/light institutional cover, typography, whitespace, page hierarchy, rule lines, table density, chart language, numeric alignment, headers/footers and the balance between brand identity and analytical credibility.
   - Do not assume the current InvestorIQ cover should survive unchanged.

### Mandatory visual re-audit before launch

Before final customer-report certification, InvestorIQ must perform a fresh visual comparison between the actual current InvestorIQ Screening and Full Underwriting PDFs and credible institutional materials, beginning with the Blackstone/DHL memo.

The review must inspect at minimum:

- cover page composition and whether the current cover is too decorative/dark relative to an institutional white-paper aesthetic;
- white-space discipline;
- typography and font hierarchy;
- page margins;
- headers/footers and page numbering;
- section-title treatment;
- table styling;
- numeric alignment;
- chart quality and chart-to-prose ratio;
- visual hierarchy of key metrics;
- sensitivity/scenario presentation;
- source/evidence presentation;
- repetition and unnecessary prose;
- page-break quality;
- whether important pages feel like an investment-committee decision surface rather than an AI-generated narrative;
- whether Screening and Full Underwriting are clearly differentiated;
- whether InvestorIQ can adopt useful institutional conventions without imitating Blackstone branding or unsupported deal-model assumptions.

The Blackstone benchmark is evidence that **14 highly decision-dense pages can be institutionally strong**. Page count itself remains non-authoritative.

### Proposed Full Underwriting information hierarchy

Subject to a future source-safe product-design audit, the intended direction is:

1. **IC / Executive Decision Summary**
   - property / transaction identity
   - purchase / basis where governed
   - operating metrics
   - debt metrics
   - valuation context
   - evidence status
   - primary constraints / unresolved material items

2. **Deal Drivers / What Matters**
   - concise deterministic, evidence-backed drivers
   - no generic AI narrative

3. **Risk / Failure Vectors**
   - source-supported risks and constraints
   - no invented mitigants

4. **Sensitivity / Stress**
   - only governed scenario families with explicit assumptions and calculation receipts

5. **Detailed Underwriting**
   - T12 / Rent Roll reconciliation
   - operating performance
   - debt and capital structure
   - valuation / appraisal reconciliation
   - renovation / diligence where supported
   - other governed analytical surfaces

6. **Evidence / Methodology / Quality Manifest**
   - source register
   - source treatment
   - formula/basis presentation
   - limitations
   - section disposition / quality incidents where applicable

### External enrichment strategy

Future integrations are divided into two distinct classes.

#### A. Underwriting-intelligence enrichment — investigate first

Potentially high-value sources:

- **CompStak** — lease comps / transaction or property-level market evidence where coverage fits the target asset class.
- **MSCI Real Capital Analytics (RCA)** — transaction/sales comparable evidence and market valuation context.
- **Esri** — demographic/geospatial context where genuinely decision-useful.

Strategic purpose:

> Add governed external evidence to InvestorIQ's underwriting brain so the product can compare uploaded property evidence against independent market evidence without fabricating facts.

Candidate future outputs, only where supported, include:

- subject rent vs observed comparable rent;
- transaction / valuation comparable ranges;
- subject basis vs observed market transaction basis;
- supported demographic/location context;
- evidence date, source, geography, comparability filters and confidence/authority receipts.

No vendor is selected or authorized yet. Coverage, licensing, API terms, pricing, permitted derived outputs and data-provenance obligations must be investigated before implementation.

#### B. Workflow / enterprise integrations — later, customer-led

Potential systems:

- **Dealpath**
- **MRI**
- **Cherre**
- **NavigatorCRE**

Dealpath is currently understood as a future **workflow/distribution integration**, not the mechanism that makes InvestorIQ's underwriting engine smarter.

Potential later Dealpath flow:

`Dealpath deal / documents -> InvestorIQ governed underwriting -> structured metrics + evidence receipts + PDF -> Dealpath deal record`

Do **not** build Dealpath now merely because it is strategically interesting. Build it when enterprise demand or a design-partner requirement justifies it.

MRI / NavigatorCRE may later help compare proposed acquisitions against a customer's owned portfolio.

Cherre may later function as enterprise data-integration infrastructure, but is likely unnecessary for the current product stage.

### Long-term product position

The intended moat is not:

> upload a T12 and receive a pretty PDF.

The stronger product position is:

> Give InvestorIQ messy property evidence and receive a governed, source-aware, deterministic institutional underwriting intelligence package that explains what is known, what matters, what can break, how the deal behaves under supported stress, and where every material conclusion came from.

Future output surfaces may include:

- customer PDF;
- structured data / API;
- Excel or model export where appropriate;
- Dealpath or other workflow-system delivery.

The underwriting intelligence engine remains the product core. Integrations should strengthen evidence or distribution, not replace that core.

### Proposed strategic sequence

1. Complete the current read-only local-Supabase baseline investigation.
2. Repair only the minimum true P0 architecture blockers required for trustworthy local proof.
3. Re-establish real P0-A publication orchestration proof.
4. Freeze infrastructure except for launch-critical defects.
5. Conduct a dedicated **Institutional Report Product & Visual Redesign Audit** using the Blackstone/DHL work sample and other credible institutional references.
6. Define the source-safe scenario/sensitivity layer and exact allowed operands.
7. Investigate CompStak and MSCI/RCA first for external market-evidence enrichment; evaluate Esri second.
8. Redesign the Full Underwriting decision hierarchy and visual system.
9. Revisit the Screening / Full Underwriting differentiation under the redesigned system.
10. Generate local/test-mode artifacts and perform human page-by-page comparison.
11. Use the preserved Sol elite audit only after representative redesigned PDFs exist.
12. Only after the product and architecture are certified, return to controlled canaries, bundle closeout and joint commercial launch.

### Important non-goals

Do not turn InvestorIQ into:

- Dealpath;
- MRI;
- Cherre;
- a generic CRM;
- a giant portfolio-management platform;
- an unsupported DCF/IRR/returns simulator;
- a Blackstone visual clone.

InvestorIQ should remain a governed underwriting intelligence engine and customer decision package.

### Roadmap impact — new product-quality workstream

Add a new pre-launch workstream without inventing a new Gate number:

**Institutional Product & Evidence Enrichment Workstream**

Exit criteria:

- current InvestorIQ report visuals compared page-by-page against credible institutional references;
- cover-page direction explicitly decided;
- executive/IC decision hierarchy specified;
- chart/table/prose standards specified;
- source-safe sensitivity families and operands specified;
- unsupported IRR/MOIC/DCF/exit assumptions remain excluded unless governed inputs exist;
- CompStak and MSCI/RCA feasibility, coverage, licensing and economics investigated;
- Esri evaluated where demographic evidence materially improves underwriting;
- Dealpath/MRI/Cherre/NavigatorCRE classified as later workflow/portfolio/data-platform integrations unless customer demand changes priority;
- redesigned representative Screening and Full Underwriting PDFs reviewed before launch certification resumes.

This workstream is intended to improve **decision value and institutional credibility**, not simply add pages or decorative graphics.
