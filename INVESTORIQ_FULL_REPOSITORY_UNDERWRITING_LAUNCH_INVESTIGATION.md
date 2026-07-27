# INVESTORIQ FULL REPOSITORY UNDERWRITING LAUNCH INVESTIGATION

**Canonical investigation record.** This file, not chat memory, is the source of truth.
Append only. Completed sections are never rewritten or erased.

---

## 0. INVESTIGATION CONSTITUTION

| Rule | Status |
| --- | --- |
| Read this file before every stage | ENFORCED |
| Append after every bounded batch | ENFORCED |
| Never rely on chat memory | ENFORCED |
| Never rewrite/erase completed sections | ENFORCED |
| No production code edits | ENFORCED |
| No deploys | ENFORCED |
| No environment variable changes | ENFORCED |
| No live RETEST | ENFORCED |
| No customer data modification | ENFORCED |
| Read-only diagnostic scripts only, when necessary | ENFORCED |
| No commits beyond this record file without explicit authorization | ENFORCED |
| Scope: `rob01-web/investoriq` ONLY | ENFORCED |

**Deviation notice (must be reviewed by owner):** writing this record into the repository
necessarily produces a commit. To honour the no-deploy rule, this file is committed to the
branch `investigation/full-repo-underwriting-audit` and **not** to `main`, so no production
Vercel build is triggered. `main` is untouched.

---

## 1. STAGE 1 - REPOSITORY CENSUS

**Stage status:** COMPLETE (with one declared enumeration gap, see 1.6)

### 1.1 Repository state

| Field | Value |
| --- | --- |
| Repository root | `rob01-web/investoriq` |
| Visibility | public |
| Primary language | JavaScript |
| Default branch | `main` |
| HEAD (main) | `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d` |
| HEAD commit message | "Record RETEST 38 failure and deployed repairs" |
| HEAD author / date | Rob McCallum, 2026-07-26T17:31:58Z |
| Working tree | Not applicable - inspection performed against the remote git object store at the pinned HEAD SHA. No local checkout, no local mutations, no `git status` side effects. |
| Open issues | 2 |

**Recent commit lineage (main, newest first)**

| SHA | Message | Date |
| --- | --- | --- |
| `33dac6f` | Record RETEST 38 failure and deployed repairs | 2026-07-26 17:31Z |
| `2544969` | Refresh failed jobs in report history | 2026-07-26 17:27Z |
| `8545d69` | Recover RETEST 38 PDF composition incidents | 2026-07-26 17:23Z |
| `129c558` | Stage RETEST 38 premium canary boundary | 2026-07-26 14:27Z |
| `7e4a5dc` | Record repaired flag-off production deployment | 2026-07-26 14:22Z |

**Branches (11)**

`main`, `acq-memo-v2-source-package`, `conflict_240526_1709`,
`copilot/fix-doc-type-derivation`, `copilot/fix-double-click-report-button-issue`,
`copilot/fix-staged-files-payload`, `copilot/remove-entitlement-update-block`,
`copilot/rename-failure-event-type`, `copilot/rename-failure-event-type-again`,
`slice-2a-triage-workspace`, `slice-2a-triage-workspace-clean`,
plus (this investigation) `investigation/full-repo-underwriting-audit`.

### 1.2 Method note (replaces `git ls-files`)

No local clone exists and the analysis sandbox has no network access, so `git ls-files`
cannot be executed. The equivalent authoritative tracked-file listing was obtained by
walking the git tree objects at HEAD `33dac6f9` via the GitHub Git Trees / Contents APIs.
This returns exactly the tracked set - identical semantics to `git ls-files` - and every
path below is recorded with its blob SHA lineage available at that commit.

### 1.3 Classification summary

| Class | Count (tracked) |
| --- | --- |
| Human-authored source (JS/JSX) | ~164 |
| Tests / QA harnesses | ~95 (see gap in 1.6) |
| Configuration / build | 12 |
| Database migrations | 6 |
| Doctrine / docs (Markdown) | 13 active + large archive |
| Legacy / archive | `Very Old and Archived MD Files/` (50+ multi-hundred-KB ledgers) |
| Generated / vendor / binary / artifacts | 130+ (PDF, PNG, HTML dumps, tmp text, package-lock) |

### 1.4 Subsystem map (first-pass, structural)

| Subsystem | Location | Files |
| --- | --- | --- |
| S1 Entrypoints & routing | `api/*.js`, `vercel.json`, `.github/workflows/` | 7 |
| S2 Underwriting core library | `api/_lib/` | 90 |
| S3 Document ingest & parsing | `api/parse/`, `lib/ai-*`, `lib/textract*` | 8 |
| S4 Worker / queue / admin ops | `api/admin-run-worker.js`, `api/admin/`, `api/jobs/` | 4 |
| S5 Frontend app | `src/` | 49 |
| S6 Shared runtime lib | `lib/` | 10 |
| S7 Persistence | `supabase/migrations/` | 6 |
| S8 Test & QA harness | `tests/` | ~95 |
| S9 Build/config | root config files | 12 |
| S10 Doctrine & archive | root `*.md`, `docs/`, `Very Old and Archived MD Files/` | 13 + archive |

### 1.5 Notable structural observations (recorded, not yet proven findings)

- `api/_lib/generate-client-report-impl.js` is **428 KB** in a single file. `api/parse/parse-doc.js`
  is **254 KB**. `api/_lib/report-contract-qa.js` is **163 KB**. `api/_lib/acquisition-memo-v2-document.js`
  is **154 KB**. `api/admin-run-worker.js` is **132 KB**. These are the highest-risk
  concentration points for launch.
- `src/pages/Dashboard.jsx` (106 KB) and `src/pages/AdminDashboard.jsx` (100 KB) are
  comparably oversized on the frontend.
- Two parallel memo lanes exist in `api/_lib`: `acquisition-memo-*` (v1) and
  `acquisition-memo-v2-*`. Coexistence must be resolved as live vs dead before launch.
- Repository root contains stray/garbled tracked files: `tatus` (761 B),
  `nce Vercel function env init fail-closed` (1,973 B), `codex_write_test.txt` (5 B),
  and nine `tmp_*.txt` scratch files. These are tracked, not ignored.
- Root also tracks large binary artifacts (PDF/PNG report outputs, `Hero_Image.png` 1.5 MB,
  `public/assets/logo.png` 1.9 MB) plus `tmp/` regression PDFs and page renders.

### 1.6 Declared enumeration gap

`tests/qa/` was enumerated to 80 files before the listing response was truncated by the
retrieval layer. The directory also contains `tests/qa/fixtures/`. **Full enumeration of
`tests/qa/` beyond the 80 recorded entries is OUTSTANDING and is the first action of
Stage 3.** No conclusions about test coverage may be drawn until this is closed.

---

## 2. DURABLE FILE CHECKLIST

Legend: `[ ]` UNINSPECTED · `[x]` INSPECTED · `[~]` PARTIAL

### 2.1 S1 - Entrypoints & routing (7) - COMPLETE

- [x] `api/generate-client-report.js` (89 B) - Stage 2
- [x] `api/checkout-session.js` (933 B) - Stage 2
- [x] `api/create-checkout-session.js` (3,984 B) - Stage 2
- [x] `api/legal-acceptance.js` (3,402 B) - Stage 2
- [x] `api/webhook.js` (6,136 B) - Stage 2
- [x] `vercel.json` (464 B) - Stage 2
- [x] `.github/workflows/worker-kick.yml` (833 B) - Stage 2
- [x] `api/_lib/generate-client-report-handler.js` (145 B) - Stage 2 (dispatch shim, pulled forward from S2)

### 2.2 S2 - Underwriting core library `api/_lib/` (90)

- [ ] `acquisition-financing-display-contract.js` (688 B)
- [ ] `acquisition-memo-boss-contract.js` (108,641 B)
- [ ] `acquisition-memo-projection.js` (11,729 B)
- [ ] `acquisition-memo-renderer.js` (8,541 B)
- [ ] `acquisition-memo-v2-boss-repair.js` (26,212 B)
- [ ] `acquisition-memo-v2-customer-surface-model.js` (107,650 B)
- [ ] `acquisition-memo-v2-document.js` (153,694 B)
- [ ] `acquisition-memo-v2-final-assembly.js` (6,992 B)
- [ ] `acquisition-memo-v2-final-decision.js` (7,447 B)
- [ ] `acquisition-memo-v2-orchestrator.js` (25,043 B)
- [ ] `acquisition-memo-v2-pipeline.js` (1,516 B)
- [ ] `acquisition-memo-v2-role-reconciler.js` (52,614 B)
- [ ] `acquisition-memo-v2-surface-copy.js` (3,287 B)
- [ ] `admin-quality-incidents-handler.js` (9,472 B)
- [ ] `canonical-source-package.js` (55,443 B)
- [ ] `capital-plan-input-contract.js` (14,405 B)
- [ ] `core-reconciliation-input-contract.js` (10,433 B)
- [ ] `debt-service-input-contract.js` (14,335 B)
- [ ] `delivery-gate-constitution.js` (2,143 B)
- [ ] `deterministic-acquisition-capital-structure-analysis.js` (23,895 B)
- [ ] `deterministic-acquisition-valuation-analysis.js` (25,640 B)
- [ ] `deterministic-capital-plan-analysis.js` (12,502 B)
- [ ] `deterministic-core-reconciliation-analysis.js` (10,465 B)
- [ ] `deterministic-debt-risk-analysis.js` (15,353 B)
- [ ] `deterministic-debt-service-calculation.js` (10,910 B)
- [ ] `deterministic-dscr-analysis.js` (9,685 B)
- [ ] `deterministic-report-contract-qa-seal.js` (21,377 B)
- [ ] `deterministic-source-case-underwriting-analysis.js` (21,429 B)
- [ ] `document-treatment-authority.js` (33,245 B)
- [ ] `final-pdf-publication-quality-boss.js` (63,454 B)
- [ ] `full-underwriting-state.js` (4,666 B)
- [x] `generate-client-report-handler.js` (145 B) - Stage 2
- [ ] `generate-client-report-impl.js` (428,167 B)
- [ ] `institutional-due-diligence-completion-handoff-contract.js` (6,490 B)
- [ ] `institutional-due-diligence-coverage-classification-contract.js` (6,452 B)
- [ ] `institutional-due-diligence-evidence-inventory-contract.js` (11,610 B)
- [ ] `institutional-due-diligence-priority-eligibility-contract.js` (5,737 B)
- [ ] `institutional-financial-intelligence.js` (25,669 B)
- [ ] `institutional-investment-committee-memo-authority-contract.js` (9,869 B)
- [ ] `institutional-investment-committee-memo-component-evidence-contract.js` (11,476 B)
- [ ] `institutional-investment-committee-memo-dependency-sequencing-contract.js` (12,237 B)
- [ ] `institutional-investment-committee-memo-methodology-contract.js` (11,825 B)
- [ ] `institutional-pdf-constitution.js` (5,844 B)
- [ ] `institutional-pdf-recovery.js` (3,410 B)
- [ ] `institutional-pdf-repair-plan.js` (3,689 B)
- [ ] `institutional-scenario-engine-completion-handoff-contract.js` (5,369 B)
- [ ] `institutional-scenario-engine-execution-contract.js` (5,519 B)
- [ ] `institutional-scenario-engine-formula-eligibility-contract.js` (7,799 B)
- [ ] `institutional-scenario-engine-input-authority-contract.js` (12,667 B)
- [ ] `institutional-scenario-engine-stress-set-authority-contract.js` (9,218 B)
- [ ] `institutional-scoring-completion-handoff-contract.js` (6,306 B)
- [ ] `institutional-scoring-execution-contract.js` (5,723 B)
- [ ] `institutional-scoring-input-lineage-contract.js` (5,751 B)
- [ ] `institutional-scoring-methodology-authority-contract.js` (5,650 B)
- [ ] `institutional-underwriting-input-contract.js` (38,090 B)
- [ ] `institutional-underwriting-return-readiness-contract.js` (19,514 B)
- [ ] `institutional-underwriting-scenario-policy-contract.js` (15,763 B)
- [ ] `investoriq-qa-doctrine.js` (11,120 B)
- [ ] `premium-acquisition-underwriting-v1-deterministic-analysis.js` (23,421 B)
- [ ] `premium-acquisition-underwriting-v1-external-certification.js` (11,538 B)
- [ ] `premium-acquisition-underwriting-v1-external-generation.js` (4,992 B)
- [ ] `premium-acquisition-underwriting-v1-internal-certification.js` (8,113 B)
- [ ] `premium-acquisition-underwriting-v1-job-start-surface-receipt.js` (4,598 B)
- [ ] `premium-acquisition-underwriting-v1-job-surface-authority.js` (8,726 B)
- [ ] `premium-acquisition-underwriting-v1-model.js` (9,892 B)
- [ ] `premium-acquisition-underwriting-v1-quality-observer.js` (5,374 B)
- [ ] `premium-acquisition-underwriting-v1-receipt-map.js` (12,368 B)
- [ ] `premium-acquisition-underwriting-v1-renderer.js` (10,067 B)
- [ ] `premium-acquisition-underwriting-v1-validated-model.js` (24,876 B)
- [ ] `qa-action-plan.js` (121,227 B)
- [ ] `qa-director-review.js` (8,628 B)
- [ ] `qa-fix-routing.js` (17,110 B)
- [ ] `qa-manager-review.js` (22,118 B)
- [ ] `qa-review.js` (13,703 B)
- [ ] `report-analysis-context.js` (1,629 B)
- [ ] `report-contract-qa.js` (162,965 B)
- [ ] `report-delivery-output.js` (26,844 B)
- [ ] `report-formatting-helpers.js` (3,140 B)
- [ ] `report-html-helpers.js` (2,252 B)
- [ ] `report-identity-authority.js` (4,472 B)
- [ ] `report-number-helpers.js` (956 B)
- [ ] `report-quality-incident-projection.js` (21,514 B)
- [ ] `report-quality-manifest.js` (39,425 B)
- [ ] `report-request-context.js` (2,391 B)
- [ ] `report-surface-contracts.js` (85,102 B)
- [ ] `report-surface-render-helpers.js` (55,077 B)
- [ ] `screening-report-pipeline.js` (2,001 B)
- [ ] `screening-report-renderer.js` (74,799 B)
- [ ] `source-package-qa.js` (31,051 B)
- [ ] `source-report-coverage-qa.js` (54,560 B)
- [ ] `source-truth-package.js` (29,287 B)
- [ ] `support-doc-semantic-evidence.js` (8,219 B)
- [ ] `support-doc-taxonomy.js` (23,285 B)
- [ ] `support-document-authority-adjudicator.js` (52,203 B)
- [ ] `validator-diagnostics-rollup.js` (11,038 B)

### 2.3 S3 - Document ingest & parsing (8)

- [ ] `api/parse/classify-documents.js` (8,379 B)
- [ ] `api/parse/extract-job-text.js` (18,385 B)
- [ ] `api/parse/parse-doc.js` (253,911 B)
- [ ] `lib/ai-rent-roll-recovery.js` (23,251 B)
- [ ] `lib/ai-support-doc-recovery.js` (85,726 B)
- [ ] `lib/ai-t12-recovery.js` (14,679 B)
- [ ] `lib/textractClient.js` (1,139 B)
- [ ] `lib/textractTablesToMatrix.js` (2,517 B)

### 2.4 S4 - Worker / queue / admin ops (4)

- [ ] `api/admin-run-worker.js` (131,631 B)
- [ ] `api/admin/queue-metrics.js` (51,581 B)
- [ ] `api/admin/run-eligible-jobs-once.js` (10,921 B)
- [ ] `api/jobs/request-revision.js` (1,439 B)

### 2.5 S5 - Frontend app `src/` (49)

- [ ] `src/App.jsx` (17,388 B)
- [ ] `src/main.jsx` (782 B)
- [ ] `src/index.css` (7,025 B)
- [ ] `src/postcss.config.js` (261 B)
- [ ] `src/components/Admin/DiagnosticsIntelligence.jsx` (16,937 B)
- [ ] `src/components/Admin/QualityIncidentDashboard.jsx` (21,914 B)
- [ ] `src/components/AnalysisScopePreview.jsx` (7,656 B)
- [ ] `src/components/BackButton.jsx` (2,237 B)
- [ ] `src/components/CallToAction.jsx` (4,001 B)
- [ ] `src/components/HeroImage.jsx` (2,736 B)
- [ ] `src/components/InvestorIQHeader.jsx` (10,681 B)
- [ ] `src/components/Modals/PDFPreviewModal.jsx` (4,577 B)
- [ ] `src/components/PageShell.jsx` (3,292 B)
- [ ] `src/components/PricingTiers.jsx` (11,664 B)
- [ ] `src/components/ReportPreviewButton.jsx` (4,643 B)
- [ ] `src/components/UploadModal.jsx` (342 B)
- [ ] `src/components/WelcomeMessage.jsx` (1,761 B)
- [ ] `src/components/ui/button.jsx` (2,801 B)
- [ ] `src/components/ui/calendar.jsx` (2,245 B)
- [ ] `src/components/ui/command.jsx` (4,215 B)
- [ ] `src/components/ui/dialog.jsx` (4,125 B)
- [ ] `src/components/ui/label.jsx` (805 B)
- [ ] `src/components/ui/popover.jsx` (1,326 B)
- [ ] `src/components/ui/toast.jsx` (3,844 B)
- [ ] `src/components/ui/toaster.jsx` (854 B)
- [ ] `src/components/ui/use-toast.js` (2,254 B)
- [ ] `src/contexts/SupabaseAuthContext.jsx` (5,683 B)
- [ ] `src/layouts/MainLayout.jsx` (5,337 B)
- [ ] `src/lib/customSupabaseClient.js` (864 B)
- [ ] `src/lib/dashboardCustomerCopy.js` (4,165 B)
- [ ] `src/lib/generatePDF.js` (5,725 B)
- [ ] `src/lib/jobFailureMessaging.js` (10,513 B)
- [ ] `src/lib/pdfSections.js` (52,810 B)
- [ ] `src/lib/pricingConfig.js` (1,402 B)
- [ ] `src/lib/reportUploadGate.js` (4,221 B)
- [ ] `src/lib/sampleReportPages.js` (196 B)
- [ ] `src/lib/sentenceIntegrity.js` (3,272 B)
- [ ] `src/lib/utils.js` (6,796 B)
- [ ] `src/pages/About.jsx` (14,514 B)
- [ ] `src/pages/AdminDashboard.jsx` (99,621 B)
- [ ] `src/pages/CheckoutSuccess.jsx` (12,696 B)
- [ ] `src/pages/Contact.jsx` (13,982 B)
- [ ] `src/pages/Dashboard.jsx` (105,804 B)
- [ ] `src/pages/LandingPage.jsx` (32,988 B)
- [ ] `src/pages/Login.jsx` (12,942 B)
- [ ] `src/pages/Pricing.jsx` (27,640 B)
- [ ] `src/pages/ReportHistory.jsx` (12,733 B)
- [ ] `src/pages/SampleReport.jsx` (3,740 B)
- [ ] `src/pages/SignUp.jsx` (14,239 B)

### 2.6 S6 - Shared runtime lib `lib/` (remaining 5)

- [ ] `lib/email-resend.js` (1,709 B)
- [ ] `lib/email-ses.js` (1,863 B)
- [ ] `lib/investoriqMasterPromptV71.js` (4,856 B)
- [ ] `lib/openai-error-classifier.js` (4,950 B)
- [ ] `lib/terminal-failure-taxonomy.js` (1,935 B)

### 2.7 S7 - Migrations (6)

- [ ] `supabase/migrations/20260210100140_consume_purchase_and_create_job.sql` (5,043 B)
- [ ] `supabase/migrations/20260213XXXXXX_queue_job_for_processing.sql` (457 B)
- [ ] `supabase/migrations/20260214_0930_queue_job_for_processing.sql` (2,251 B)
- [ ] `supabase/migrations/20260216_0001_claim_and_consume_job.sql` (1,024 B)
- [ ] `supabase/migrations/20260302_0001_allow_multiple_files_per_doc_type.sql` (575 B)
- [ ] `supabase/migrations/20260328_0001_sync_rls_policies_for_analysis_and_reports.sql` (3,332 B)

### 2.8 S8 - Tests & QA harness

**tests/e2e (8 authored)**

- [ ] `tests/e2e/README.md`
- [ ] `tests/e2e/assert-report-output.js` (3,430 B)
- [ ] `tests/e2e/fake-supabase.js` (2,228 B)
- [ ] `tests/e2e/parser-adversarial.js` (7,033 B)
- [ ] `tests/e2e/run-e2e.js` (25,703 B)
- [ ] `tests/e2e/worker-state-scenarios.js` (10,359 B)
- [ ] `tests/e2e/fixtures/jobs/wave2-job-lifecycle.json` (9,318 B)
- [ ] `tests/e2e/fixtures/parser/wave4-parser-adversarial.json` (5,710 B)

**tests/qa - 80 enumerated, enumeration INCOMPLETE (see 1.6)**

- [ ] `tests/qa/*` - 80 smoke suites recorded at census time, including the highest-signal
  suites for launch: `admin-run-worker-publish-contract-smoke.js`,
  `generate-client-report-rent-roll-smoke.js` (276,201 B),
  `full-underwriting-launch-certification-matrix-smoke.js`,
  `acquisition-memo-v2-publish-or-collapse-smoke.js`,
  `institutional-pdf-*-smoke.js` (9 suites),
  `deterministic-*-smoke.js` (8 suites),
  `institutional-due-diligence-*-smoke.js` (4 suites),
  `institutional-scenario-engine-*-smoke.js`,
  `institutional-investment-committee-memo-*-smoke.js` (4 suites).
- [ ] `tests/qa/fixtures/` - not yet enumerated
- [ ] `tests/investoriq_validation_fixtures_UPLOADABLE/` - 8 scenario packs (fixtures, binary)

**Root-level test scripts**

- [ ] `test-sentence-integrity.js` (1,396 B)
- [ ] `scripts/generateCharts.js` (22,777 B)
- [ ] `scripts/generate-sample-pdf.js` (2,317 B)

### 2.9 S9 - Configuration / build (12)

- [ ] `package.json` (9,232 B)
- [ ] `vite.config.js` (2,154 B)
- [ ] `tailwind.config.js` (2,768 B)
- [ ] `postcss.config.js` (74 B)
- [ ] `eslint.renderer-scope.cjs` (198 B)
- [ ] `index.html` (2,691 B)
- [ ] `server.js` (2,274 B)
- [ ] `.gitignore` (540 B)
- [ ] `.gitconfig` (61 B)
- [ ] `workspace.code-workspace` (60 B)
- [ ] `.claude/settings.local.json` (1,262 B)
- [ ] `.emergent/emergent.yml` (108 B)

### 2.10 S10 - Doctrine & docs (13 active)

- [ ] `AGENTS.md` (1,174 B)
- [ ] `CLAUDE.md` (4,101 B)
- [ ] `ELITE_ROADMAP.md` (5,882 B)
- [ ] `PIPELINE_MAP.md` (5,272 B)
- [ ] `UNDERWRITING_GAMEPLAN_v2.md` (11,374 B)
- [ ] `!!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_...JULY13...ADMIN_DASHBOARD_NEXT.md` (645,892 B)
- [ ] `!!!INVESTORIQ_MASTER_CONTEXT_CURRENT_DOCTRINE_COMPLETION_CHECKLIST_...JULY15_RETEST24...md` (170,154 B)
- [ ] `!!!INVESTORIQ_SEMANTIC_AUTHORITY_EVIDENCE_LEDGER_...JULY13...md` (271,806 B)
- [ ] `!!INVESTORIQ_ADMIN_QUALITY_INCIDENT_AND_CUSTOMER_REMEDY_DOCTRINE_...JULY13...md` (79,929 B)
- [ ] `docs/INVESTORIQ_PRODUCT_DOCTRINE.md` (14,138 B)
- [ ] `docs/LEVEL_UP_EXECUTION_SUMMARY.md` (8,252 B)
- [ ] `docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATION_RUNBOOK.md` (9,283 B)
- [ ] `docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md` (21,657 B)

### 2.11 Legacy / archive - NOT on the inspection path

- `Very Old and Archived MD Files/` - 50+ ledger/checklist snapshots, 245 KB to 705 KB each.
  Superseded by the four active root ledgers. Excluded from inspection; retained for provenance.

### 2.12 Generated / vendor / binary / artifacts - NOT on the inspection path

- `package-lock.json` (427,519 B)
- Root report artifacts: `124 Richmond Clean Underwriting 5.pdf`, `124 Richmond Messy Underwriting 5.pdf`,
  `124 Richmond Street (MESSY Underwriting Test 32).pdf`, `124 Richmond Street Screening 5.pdf`,
  `Final Attack Test 8 RETEST 5.pdf`, `InvestorIQ-Sample-IRR-FIXED-v25.pdf`, `test-report.pdf`,
  `Hero_Image.png`, `retest4-final-html.html`, `sentence-integrity-output.html`,
  `test-download.html`, `test-pdf.html`, `smoke-output.txt`, `artifact-list.txt`
- Root scratch (tracked, should not be): `codex_write_test.txt`, `tmp_clean_test11.txt`,
  `tmp_debt_terms32.txt`, `tmp_messy32.txt`, `tmp_mojibake_test.txt`, `tmp_offer32.txt`,
  `tmp_segment.txt`, `tmp_tax32.txt`, `tmp_unsup_app32.txt`, `tmp_unsup_esa32.txt`,
  `tmp_unsup_rent32.txt`, `tmp_unsup_zone32.txt`
- Root garbled filenames (tracked): `tatus`, `nce Vercel function env init fail-closed`
- `tmp/` - regression PDF/TXT pairs and `motherload_pdf_pages/page-01..13.png`
- `public/` - brand assets, `charts/` (28 PNGs), favicons, `hero-*.{png,jpg}`,
  `reports/{print.css,screen.css,sample-report.html}`, `test-checkout.html`, `llms.txt`.
  Note: `public/hero-sample-report.jpg` is **0 bytes**.
- `api/report-template.html`, `api/report-template-runtime.html`, `api/html/sample-report.html`,
  `api/data/riverbend_dataset.json`
- `Final_Testing/SYNTH-QA-MOTHERLOAD-UNDERWRITING-01/`,
  `124 Richmond Street, London, ON/`, `!Fictitious Property Documents to Upload/` - test input corpora

---

## 3. PROVEN FINDINGS LEDGER

Every finding below is derived from source read at HEAD `33dac6f9`. Nothing is inferred
from chat memory. Severity: **BLOCKER** = must fix before launch, **HIGH** = fix before
charging customers at volume, **MEDIUM** = fix soon, **LOW** = hygiene.

### Stage 2 findings (S1 Entrypoints & routing)

#### F-001 - BLOCKER - `api/checkout-session.js` is unauthenticated and leaks user IDs

`api/checkout-session.js` exposes a public GET endpoint that accepts any `session_id` and
returns `session.metadata` verbatim, plus `productType`. There is no auth check, no
ownership check, and no allow-listing of returned metadata fields. `create-checkout-session.js`
writes `metadata.userId` into every Stripe session. Therefore any party holding or guessing
a Stripe checkout session id can retrieve the internal Supabase `userId` and purchase type
of another customer.

**Evidence:** `api/checkout-session.js` returns `metadata: session.metadata || {}`;
`api/create-checkout-session.js` sets `metadata: { userId, productType, quantity }`.

#### F-002 - BLOCKER - `api/legal-acceptance.js` accepts unauthenticated identity claims

Both the GET and POST paths take `userId` straight from the request (`req.query` / `req.body`)
with no bearer-token verification. On POST the server then calls
`supabase.auth.admin.getUserById(userId)` and stamps the **real** user email, IP and user agent
onto a `legal_acceptances` row. An unauthenticated caller can therefore forge a legally
meaningful disclosure acceptance on behalf of any user, correctly attributed to that user's
email. GET similarly discloses whether an arbitrary user has accepted.

**Evidence:** `const params = req.method === 'GET' ? (req.query || {}) : (req.body || {}); const { userId, policyTextHash } = params;`
followed by an unconditional insert. No session/JWT validation anywhere in the file.

#### F-003 - HIGH - Legal acceptance trusts the client-supplied policy hash

The file's own comment states the server "should compute POLICY_TEXT_HASH from the canonical
disclosures text" and that accepting `policyTextHash` from the client is a "compatibility
bridge". It is still the live behaviour. `policy_text_hash` is written from client input, so
the stored hash does not prove what text the user actually saw. That defeats the evidentiary
purpose of the record.

**Evidence:** `api/legal-acceptance.js`, POLICY_KEY/POLICY_VERSION are server constants but
`policy_text_hash: policyTextHash` comes from the request.

#### F-004 - HIGH - Legal acceptance returns a fabricated timestamp on duplicate

On unique-violation (`error.code === '23505'`) the handler returns
`accepted_at: new Date().toISOString()` - the current time - rather than reading the stored
acceptance timestamp. The API reports a false acceptance date for every repeat acceptance.

**Evidence:** `api/legal-acceptance.js`, duplicate branch.

#### F-005 - HIGH - `worker-kick.yml` masks worker failures and truncates long runs

The scheduled workflow runs every 5 minutes with `timeout-minutes: 2` and calls two endpoints
with `curl -sS` (no `-f`, no `--max-time`).

1. `curl -sS` exits 0 on HTTP 500. Any worker failure returns a green workflow run, so the
   scheduler provides zero failure signal.
2. `api/admin-run-worker.js` is configured with `maxDuration: 300` in `vercel.json`, but the
   GitHub job is killed at 120 seconds. Whenever the worker legitimately runs past two
   minutes, GitHub terminates the step and the connection, while the Vercel function keeps
   executing. This is precisely the failure shape that produces "job ran but the result was
   never recorded".

**Evidence:** `.github/workflows/worker-kick.yml` vs `vercel.json` `functions` block.

#### F-006 - HIGH - Function duration budget contradicts the worker design

`vercel.json` grants `api/admin-run-worker.js` 300 s but caps every other function, including
`api/admin/run-eligible-jobs-once.js` and the entire report generation path
(`api/generate-client-report.js` -> `_lib/generate-client-report-handler.js` ->
`_lib/generate-client-report-impl.js`, 428 KB), at 60 s. The full underwriting report path is
the most expensive operation in the product and has the tighter budget.

**Evidence:** `vercel.json` `"api/**/*.js": { "maxDuration": 60 }`; three-hop dispatch chain
confirmed by reading all three files (the first two are pure re-export shims with no logic).

#### F-007 - MEDIUM - Two competing sources of truth for purchase quantity

`create-checkout-session.js` writes `metadata.quantity` AND enables
`adjustable_quantity { minimum: 1, maximum: 5 }`, so the customer can change quantity after
the metadata is written. `webhook.js` ignores `metadata.quantity` entirely and instead calls
`stripe.checkout.sessions.listLineItems(sessionId, { limit: 10 })`, then reads only
`data[0].quantity`. The webhook's choice is the safer one, but the stale `metadata.quantity`
remains written and any future consumer of it will be wrong. Additionally, only the first
line item is counted; a multi-line-item session would silently under-grant entitlements.

**Evidence:** `api/create-checkout-session.js` metadata block; `api/webhook.js` line-item lookup.

#### F-008 - MEDIUM - Synthetic Stripe session ids are written into `report_purchases`

For quantity N > 1 the webhook fabricates ids of the form `${sessionId}#2`, `${sessionId}#3`,
etc. and stores them in `report_purchases.stripe_session_id`. Those values do not exist in
Stripe. Any reconciliation, refund matching, or support lookup that joins that column back to
Stripe will fail for every entitlement after the first.

**Evidence:** `api/webhook.js`,
`expectedSessionIds = Array.from({ length: quantity }, (_v, i) => i === 0 ? sessionId : `+"`${sessionId}#${i + 1}`"+`)`.

#### F-009 - MEDIUM - Webhook idempotency is read-then-write, not atomic

Idempotency relies on inserting `event.id` into `stripe_events`. On duplicate the handler
deliberately continues if `existingRows.length < quantity`, then re-reads and inserts the
missing `report_purchases` rows. There is no transaction and no advisory lock between the
read and the write, so two concurrent Stripe retries of the same event can both observe an
incomplete row set and both insert. Whether this actually double-grants depends on a unique
constraint on `report_purchases.stripe_session_id`, which is **not** established by any of the
six migrations enumerated in 2.7 by filename alone.

**Status:** partially proven. The race is proven from application code; the mitigating DB
constraint is unverified. **Resolution deferred to Stage 8 (migrations & RLS).**

**Evidence:** `api/webhook.js`, `loadExistingPurchases()` then `.insert(purchaseRows)`.

#### F-010 - LOW - Inconsistent environment-variable initialisation discipline

`api/create-checkout-session.js` validates its Stripe and Supabase env vars and returns a
structured `{ error, missing: [...] }`. `api/webhook.js`, `api/checkout-session.js` and
`api/legal-acceptance.js` instantiate their Stripe/Supabase clients at module scope with no
validation, so a missing variable surfaces as an opaque cold-start crash. Note the tracked
root file literally named `nce Vercel function env init fail-closed`, which appears to be the
truncated remains of an abandoned attempt to standardise exactly this.

#### F-011 - LOW - `vercel.json` route table contains a redundant rule

After `{ "handle": "filesystem" }`, the rule `{ "src": "^/api/(.*)$", "dest": "/api/$1" }` is a
no-op for real function files. The only meaningful custom rule is the
`/api/admin/quality-incidents` rewrite onto `queue-metrics?admin_route=quality_incidents`,
which means the 51 KB `queue-metrics.js` is multiplexing two distinct admin surfaces behind
one function. Flagged for Stage 3.

---

## 4. STAGE LOG

| Stage | Scope | Status | Files inspected | Cumulative |
| --- | --- | --- | --- | --- |
| 1 | Repository census, classification, checklist | COMPLETE | 0 (listing only) | 0 |
| 2 | S1 Entrypoints & routing + dispatch shims | COMPLETE | 8 | 8 |
| 3 | Close `tests/qa` enumeration gap, then S4 worker/queue (`admin-run-worker.js`, `queue-metrics.js`, `run-eligible-jobs-once.js`, `jobs/request-revision.js`) | NEXT | - | - |
| 4 | S2 underwriting core - contract layer | PLANNED | - | - |
| 5 | S2 underwriting core - deterministic analysis layer | PLANNED | - | - |
| 6 | S2 - memo v1 vs v2 lane resolution | PLANNED | - | - |
| 7 | S3 ingest & parsing | PLANNED | - | - |
| 8 | S7 migrations & RLS (also resolves F-009) | PLANNED | - | - |
| 9 | S5 frontend surfaces | PLANNED | - | - |
| 10 | S10 doctrine reconciliation vs code reality | PLANNED | - | - |
| 11 | Synthesis - 12-deliverable launch report | PLANNED | - | - |
