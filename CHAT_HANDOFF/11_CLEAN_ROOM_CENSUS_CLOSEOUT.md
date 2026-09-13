# InvestorIQ Clean-Room Legacy Census Closeout

**Date:** 2026-09-13
**Status:** LEGACY MIGRATION CENSUS COMPLETE
**Authoritative legacy branch:** `launch-certification-20260913`
**Source checkpoint reviewed:** `61659a2d512970da43e92e152ebea7d135a712f7`
**Clean repository:** `rob01-web/investoriq-clean-v1`

## 1. Scope and stopping rule

The migration census is complete for the current clean-room decision.

The entire legacy `api/` tree was already traversed before this closeout and its initial dispositions are recorded in `09_CLEAN_ROOM_MIGRATION_LEDGER.md`.

This closeout completed the remaining executable/current-tree families outside `api/`:

- root build and deployment configuration;
- `.github/workflows/`;
- `lib/`;
- `src/` customer/admin frontend;
- `supabase/` migration history and current admission/publication end-state evidence;
- `scripts/` and `tests/` as non-production support/evidence;
- public assets, fixtures, generated reports, design prototypes, investigation notes, temporary outputs, archived documentation, and other non-executable evidence families.

Risk-based review applies exactly as authorized by `08_CLEAN_ROOM_MIGRATION_AUTHORITY.md`: executable production code received implementation review; non-executable archives/support material received provenance and consumer classification rather than production-level line-by-line review.

The old `07_REPOSITORY_TRACKED_FILE_CENSUS.md` remains a preserved historical snapshot. It is not the exact current-tree inventory because governing files `08`, `09`, and `10` and later closeout material were added after that census was generated. Do not restart the old 1,028-file audit merely to regenerate that frozen snapshot.

## 2. Non-API executable dispositions

### `lib/`

| Legacy file | Legacy classification | Clean disposition | Clean responsibility / reason |
|---|---|---|---|
| `lib/ai-model-architecture.js` | CURRENT AUTHORITY | REWRITE | Provider/stage configuration only. Remove hard-coded analytical authority and stale model/pricing coupling. |
| `lib/ai-rent-roll-recovery.js` | CURRENT AUTHORITY | REWRITE | Parser recovery may emit evidence-backed candidates only, never Source Truth. Rebuild with explicit units and typed receipts. |
| `lib/ai-support-doc-recovery.js` | CURRENT AUTHORITY | REWRITE | Strong evidence matching pattern, but ratio/rate units and heuristic semantic authority are not clean-room safe. |
| `lib/ai-t12-recovery.js` | CURRENT AUTHORITY | REWRITE | Current validation compares NOI using absolute value and can mask sign. Clean parser must preserve exact sign and explicit units. |
| `lib/email-resend.js` | CURRENT AUTHORITY | MIGRATE AFTER REPAIR | Keep only as nonblocking post-publication notification adapter. Email failure must never become publication authority. |
| `lib/investoriqMasterPromptV71.js` | DELETE / historical runtime residue | DO NOT MIGRATE | Authorizes recommendations, HOLD/PASS, scoring, DCF, refinance/sensitivity and InvestorIQ estimates contrary to current constitution. |
| `lib/openai-error-classifier.js` | CURRENT AUTHORITY | MIGRATE AFTER REPAIR | Narrow provider diagnostics with secret redaction. Keep operational only; no business/publishability authority. |
| `lib/terminal-failure-taxonomy.js` | CURRENT AUTHORITY | REWRITE | Broad internal failure classes currently imply generic retry safety. Retry policy must be typed and owned by the clean worker state machine. |
| `lib/textractClient.js` | CURRENT AUTHORITY | MIGRATE AFTER REPAIR | Narrow extraction-provider adapter; preserve server-only credentials and typed provider failure receipts. |
| `lib/textractTablesToMatrix.js` | CURRENT AUTHORITY | MIGRATE | Deterministic TABLE/CELL-to-matrix conversion with confidence preservation and no financial authority. |

### `src/lib/` and frontend boundaries

| Legacy file / family | Legacy classification | Clean disposition | Clean responsibility / reason |
|---|---|---|---|
| `src/lib/authReturnPath.js` | CURRENT AUTHORITY | MIGRATE | Narrow internal return-path sanitization with no business authority. |
| `src/lib/customSupabaseClient.js` | CURRENT AUTHORITY | REWRITE | Clean browser client must use explicit APIs and explicit public config. |
| `src/lib/customerBoundarySupabase.js` | CURRENT AUTHORITY | REWRITE | Compatibility Proxy can fall through to direct Supabase table access. Replace with explicit allowlisted customer API methods. |
| `src/lib/dashboardCustomerCopy.js` | CURRENT AUTHORITY | REWRITE | Client currently reconstructs delivery/customer truth from multiple aliases. Clean UI renders one canonical server surface receipt. |
| `src/lib/investoriq-disclosure-authority.js` | CURRENT AUTHORITY | MIGRATE AFTER REPAIR | Version/hash pattern is strong; exact legal copy/version requires deliberate legal/current-policy review before crossing. |
| `src/lib/jobFailureMessaging.js` | CURRENT AUTHORITY | REWRITE | Heuristic regex failure classification and legacy taxonomy must be replaced by typed server failure receipts. |
| `src/lib/ownerEconomics.js` | NON-PRODUCTION SUPPORT | DO NOT MIGRATE | Owner planning tool is outside clean launch-critical runtime; rebuild separately later if still desired. |
| `src/lib/pricingConfig.js` | CURRENT AUTHORITY | MIGRATE AFTER REPAIR | Preserve server-catalog-only principle; reconcile final labels/currency with clean commerce authority. |
| `src/lib/reportRevisionAuthority.js` | CURRENT AUTHORITY | MIGRATE AFTER REPAIR | Useful deterministic revision lineage/display helper after clean publication schema is locked. |
| `src/lib/reportSurfaceState.js` | CURRENT AUTHORITY | REWRITE | Competing client surface-state synthesis and stale legacy statuses must not cross. |
| `src/lib/reportUploadGate.js` | CURRENT AUTHORITY | REWRITE | Filename hint can override core document type. Clean intake UI must not use filenames as admission authority. |
| `src/lib/sentenceIntegrity.js` | DELETE | DO NOT MIGRATE | Post-render text surgery/auto-punctuation is incompatible with receipt-driven publication. |
| `src/lib/sessionDisclosureAck.js` | CURRENT AUTHORITY | REWRITE | Session convenience may remain, but durable server acceptance receipt is authority. |
| `src/lib/utils.js` | DELETE | DO NOT MIGRATE | God helper mixes brand, PDF operations, formatting and duplicate cap-rate/DSCR/LTV calculations. Rebuild narrow utilities only where needed. |

### Frontend pages/components

- `src/pages/Dashboard.jsx`: **REWRITE**. It is a monolith combining upload staging, intake gating, legal acceptance, commerce verification, worker polling, failure interpretation, report history, download/delete actions and presentation.
- `src/pages/AdminDashboard.jsx` plus admin diagnostic panels: **REWRITE** as read-only clean observability surfaces after canonical worker/publication receipts exist.
- `src/pages/Pricing.jsx`: **REWRITE** customer surface while retaining server-catalog pattern. Current copy still uses `Underwriting Report` and advertises refinance/sensitivity concepts.
- `src/pages/LandingPage.jsx`: **REWRITE** customer copy/surface while preserving approved design direction. Current pipeline advertises `Score`.
- Login/SignUp/auth UI: **MIGRATE AFTER REPAIR** at responsibility level, using the clean explicit auth/client boundary.
- About/Contact/layout/header/brand presentation components: **MIGRATE AFTER REVIEW** for copy, accessibility and clean design-token consolidation.
- generic UI primitives: **MIGRATE AFTER REVIEW** or reinstall from their maintained source; they own no InvestorIQ business truth.
- `src/App.jsx`: **REWRITE**. Router, admin detection and embedded legal documents are currently mixed; admin routing even uses a checkout-session endpoint as an auth-context switch.
- `src/main.jsx`: **REWRITE** as a minimal clean entrypoint around the final auth/router architecture.
- `src/index.css` / design-only styles: **MIGRATE AFTER REVIEW**.

## 3. Database and migration disposition

The legacy `supabase/migrations/` directory is **HISTORICAL EVIDENCE ONLY as a migration chain**. Do not copy or replay it into the clean repository.

Every historical migration file receives `DO NOT MIGRATE` as a file. The responsibilities expressed by the proven final state receive `REWRITE` into a new clean baseline schema and a small forward-only migration history.

The clean database must intentionally reconstruct only the required current responsibilities, including:

- authenticated owner/profile boundary;
- private staged uploads and user ownership;
- strict Screening intake: usable T12 plus usable Rent Roll, no supporting documents;
- strict Underwriting intake: usable T12 plus usable Rent Roll plus at least one readable support document;
- immutable admission receipt/source manifest;
- purchase entitlement consumption and restoration with idempotency;
- analysis job state and durable worker fencing;
- report/revision lineage;
- source/quality/publication receipts;
- fail-closed artifact certification and atomic final publication;
- customer report listing/download ownership;
- admin/service boundaries and RLS;
- Stripe entitlement idempotency.

The September 8 strict-admission migration and September 10 launch reconciliation migration are strong end-state evidence, not clean migration files.

## 4. Workflows and build/deployment configuration

| Legacy file | Legacy classification | Clean disposition | Reason |
|---|---|---|---|
| `.github/workflows/launch-qa.yml` | NON-PRODUCTION SUPPORT | REWRITE | Rebuild around the clean test/build/certification inventory. |
| `.github/workflows/worker-kick.yml` | NON-PRODUCTION SUPPORT | DO NOT MIGRATE | Hardwired legacy production worker emergency trigger. No clean scheduler/trigger before worker certification. |
| `package.json` / `package-lock.json` | BUILD SUPPORT | REWRITE | Build a minimal dependency graph from admitted clean responsibilities only. |
| `vercel.json` | DEPLOYMENT CONFIG | REWRITE | Legacy route multiplexing and worker timing assumptions must not cross. |
| `vite.config.js` | BUILD CONFIG | REWRITE | Current config defines the entire `process.env` object for browser build code. Clean config may expose only explicit public `VITE_*` values. |
| `tailwind.config.js` | DESIGN CONFIG | MIGRATE AFTER REPAIR | Keep approved visual tokens after removing legacy aliases and consolidating one design-token authority. |
| PostCSS/HTML/lint/editor config | BUILD SUPPORT | REWRITE / MIGRATE AFTER REVIEW | Recreate minimal required toolchain; no business authority. |

## 5. Tests, scripts, fixtures and generated evidence

### `tests/`

Legacy tests are **NON-PRODUCTION SUPPORT**. Do not bulk-copy the suite.

- acquisition-memo repair-stack, Phase-era and legacy-surface smoke tests: **DO NOT MIGRATE**;
- reusable invariant intent such as strict intake, OCCR, explicit debt math, source lineage, publication fail-closed, worker state transitions, entitlement idempotency and customer ownership: **REWRITE as clean tests**;
- `tests/e2e/` simulator harness: **DO NOT MIGRATE as executable authority**; rewrite a real clean lifecycle harness;
- synthetic/adversarial upload fixtures under `tests/investoriq_validation_fixtures_UPLOADABLE/`: **MIGRATE AFTER REVIEW as test fixtures only**. Expected results must be re-authored from the clean constitution rather than copied as oracle truth.

### `scripts/`

All legacy Phase repair/apply/finalize/diagnostic/visual-generation scripts are **NON-PRODUCTION SUPPORT / DO NOT MIGRATE** unless a future clean responsibility explicitly needs a new equivalent. No patch-application or repair-stack script crosses the border.

### Evidence and temporary families

The following are preserved in the legacy repository but do not enter the clean runtime:

- `CHAT_HANDOFF/archived/**` and superseded handoffs;
- `docs/**` Phase-era doctrine, audit evidence and historical runbooks except current clean-room governance extracted into clean docs;
- `investigation/**`;
- `Older and Archived MD Files/**`;
- `PHASE8A_DIAGNOSTICS/**`;
- `tmp/**` and root `tmp_*` files;
- generated PDFs/TXT outputs and report snapshots;
- root smoke outputs/status/debug artifacts;
- design prototypes as executable code;
- sample/test checkout HTML;
- fixture-specific expected-output artifacts.

Classification: **HISTORICAL EVIDENCE ONLY** or **NON-PRODUCTION SUPPORT**. Clean disposition: **DO NOT MIGRATE**, except explicitly reviewed synthetic source fixtures or approved design assets.

## 6. Brand/static assets

- `public/brand/**` logos/wordmarks/icons: **MIGRATE AFTER REVIEW** for current approved brand identity and asset duplication.
- favicons and approved non-generated site imagery: **MIGRATE AFTER REVIEW**.
- `public/charts/**`, generated report previews/samples and legacy report artifacts: **DO NOT MIGRATE** as runtime truth; regenerate from the clean pipeline if needed.
- empty/stale/test assets such as the zero-byte sample image and `public/test-checkout.html`: **DO NOT MIGRATE**.

## 7. Material non-API findings added by this census

1. T12 AI recovery can hide NOI sign errors by comparing against `abs(NOI)`.
2. Support-document AI recovery validates percentage/rate magnitudes without an explicit fraction-versus-percent unit contract.
3. The client upload gate can let a filename override the selected core document role.
4. The customer Supabase compatibility layer has a generic fallback to direct table access instead of a closed explicit customer boundary.
5. Dashboard/customer helpers reconstruct customer-delivery state from multiple aliases rather than rendering one canonical surface receipt.
6. The v7.1 master prompt contains unsupported recommendation, scoring, DCF, refinance and estimate authority.
7. `src/lib/utils.js` duplicates cap-rate, DSCR and LTV formulas outside canonical financial calculations.
8. `vite.config.js` exposes `process.env` wholesale to build-time browser configuration.
9. Landing/pricing copy still contains stale `Score`, `Underwriting Report`, refinance and sensitivity language.
10. The accumulated SQL migration history must not become the clean schema by replay; the desired end state should be rewritten as a fresh baseline.

## 8. Census close verdict

**PASS for migration decision purposes.**

Every current executable family has an explicit clean-room disposition, and every remaining non-executable family is governed by a deterministic provenance classification above. The completed `api/` audit remains authoritative and is not restarted.

The next permitted step is to populate the clean repository migration ledger from the combined `09` ledger plus this closeout, then admit only the first tiny dependency-safe cluster.

No production deployment, production mutation, scheduler activation, Supabase mutation, Stripe mutation, historical replay or DocRaptor production-mode change is authorized by this closeout.
