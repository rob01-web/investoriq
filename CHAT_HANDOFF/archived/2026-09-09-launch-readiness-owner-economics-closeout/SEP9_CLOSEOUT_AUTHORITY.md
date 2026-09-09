# InvestorIQ Sep 9, 2026 Launch Readiness + Owner Economics Closeout Authority

This archive is the complete Sep 9 closeout record. It supplements the five canonical `CHAT_HANDOFF` files and preserves the detailed authority for the customer-admission repair, pricing/customer-journey closeout, Owner Economics work, provider-cost research, and final production promotion.

## Current branch and production receipt

- Working branch: `internal-owner-economics-cost-model-20260909-r2`
- Production runtime SHA: `243159be4be0b34c613b51a4b00a098e75e14e31`
- Vercel deployment: `dpl_HXd4Z538RBG1xsexqTzG9gDbVpSa`
- Deployment target: production
- Deployment state: `READY`
- Production aliases verified: `investoriq.tech`, `www.investoriq.tech`, `investoriq.vercel.app`, and the project alias.
- Live `https://investoriq.tech/pricing` returned HTTP 200 after deployment.
- No error/fatal runtime logs were present on the exact production deployment during the first verification window.
- `main` was not merged.

The Sep 6 report-publication certification baseline remains preserved historical authority and must not be restarted merely because Sep 9 launch-readiness work followed it.

## Customer admission constitution and production enforcement

Owner clarified the governing customer admission rule:

- Screening requires BOTH a usable T12 / operating statement AND a usable Rent Roll before generation. Screening accepts only those two core document categories. Supporting due-diligence documents are not admitted for Screening.
- Underwriting requires BOTH a usable T12 / operating statement AND a usable Rent Roll, PLUS at least one readable supporting due-diligence document.
- `dual_source_core`, `t12_minimum_core`, `rent_roll_minimum_core`, and `insufficient_core` are downstream source-truth / publication-survivability states after valid admission. They do not relax customer intake.

Frontend report gating, dashboard preflight, customer-facing error handling, doctrine tests, and active doctrine documents were repaired to preserve that distinction.

Production Supabase migration applied:

`supabase/migrations/20260908233000_strict_customer_admission_doctrine.sql`

Migration name: `strict_customer_admission_doctrine`

Production Supabase project: `bcvuxtnuoidakzjqewfb` (`RE Property Analysis`). Post-apply verification confirmed Screening supporting-document rejection is present, filename-based fallback classification is removed, and the protected security-definer architecture remains. Do not re-apply this migration.

## Pricing and customer-journey closeout

Canonical commerce authority remains:

- Screening Report: $199 USD
- Underwriting Report: $499 USD
- Launch Bundle: $699 USD for 2 Screening credits + 1 Underwriting credit

No Stripe catalog or price mutation was performed during the Sep 9 pricing closeout.

Owner-approved pricing direction: **old confidence + new engineering**.

- Hero copy restored to: `Document-driven underwriting for real estate investors.`
- Redundant pricing-card eyebrow labels were removed. Keep only `Screening Report`, `Underwriting Report`, and `Launch Bundle` as the main card titles.
- Keep the useful `RECOMMENDED` tag on Underwriting.
- Bundle description restored to: `Screen two opportunities and take one finalist through full Underwriting for one fixed price.`
- Keep the new savings treatment and improved card geometry/alignment.
- Strict upload doctrine remains visible in customer-facing pricing copy.
- Login and Signup preserve the safe internal return path so `/pricing` purchase intent survives authentication.
- The stale 48-hour metadata timing promise was removed.
- Zero customer-facing em/en dashes remains a permanent standard.

The pricing/customer-journey presentation was owner-previewed before production promotion.

## Owner Economics dashboard

A planning-only Owner Economics panel was added to the existing authenticated Admin Dashboard at `/dashboard`. There is intentionally no `/admin` route; the authenticated account is resolved by the existing dashboard switch.

The panel is non-destructive:

- never changes Stripe, prices, customer credits, jobs, purchases, Supabase billing, or production configuration;
- scenario assumptions are saved only in the browser;
- reuses existing governed admin commerce data for actual settled MTD revenue / checkout context when available;
- separates checkout count from actual report workload.

Scenario math:

- Screening reports = standalone Screening purchases + `2 x Bundle purchases`
- Underwriting reports = standalone Underwriting purchases + `1 x Bundle purchases`
- Stripe fixed fees are based on checkout count, not report count.
- AI/Textract/report variable costs are based on actual report workload.

Default launch-planning assumptions are deliberately conservative and editable:

- Stripe base percentage: 2.9%
- Stripe fixed fee: $0.30 per checkout
- Stripe currency conversion: 0% default, editable
- Screening OpenAI/API allowance: $1.00/report
- Underwriting OpenAI/API allowance: $2.00/report
- Amazon Textract: $0.015 per analyzed page
- Screening Textract allowance: 34 pages, about $0.51/report
- Underwriting Textract allowance: 100 pages, $1.50/report
- Vercel Pro planning baseline: $20/month
- Supabase Pro planning baseline: $25/month
- DocRaptor Professional planning baseline: $29/month for 325 documents
- Hostinger domain/email normalized baseline: $8.33/month based on about $100/year
- Resend: $0/month initially
- Other fixed/variable costs: $0 until evidenced, editable
- CAD planning conversion: 1.40 CAD per USD, editable

Fixed launch-planning baseline: **$82.33 USD/month** before transaction and per-report variable costs.

The dashboard reports gross monthly revenue, estimated Stripe fees, AI/API costs, Textract costs, other variable costs, total variable report costs, fixed monthly costs, projected net monthly contribution, contribution margin, annualized revenue, annualized net contribution, and CAD planning equivalents.

## Provider-cost evidence gathered

### DocRaptor

Current account was Free during testing. Owner chose Professional as the conservative launch-planning baseline: $29/month for 325 documents. Do not double-count a per-report DocRaptor fee while the monthly tier is already included.

### Vercel

InvestorIQ is currently on Hobby. Owner Economics intentionally plans on Pro at $20/month for launch.

### Supabase

InvestorIQ is currently on Free. Owner Economics intentionally plans on Pro at $25/month for launch.

### Hostinger

`investoriq.tech` domain/email is approximately $100/year, normalized to $8.33/month.

### Email providers

Stripe sends the customer payment receipt. InvestorIQ uses Resend for the `Your InvestorIQ report is ready` notification from `reports@investoriq.tech`. Resend remains $0/month in the initial planning baseline.

### Amazon Textract

InvestorIQ uses `AnalyzeDocument` with `TABLES`. Historical published/test evidence showed very low actual Textract spend. The Owner Economics defaults intentionally use padded page allowances rather than the lowest historical result.

### OpenAI

Historical successful Underwriting evidence indicated completed AI usage in the pennies for that old test-era report, while one successful Screening had no persisted OpenAI-call evidence. Those are not treated as current production averages. Owner deliberately locked much more conservative planning allowances of $1/report for Screening and $2/report for Underwriting.

Future model-selection work may intentionally use newer/stronger GPT models at decision-critical stages when report quality materially improves. Do not optimize blindly for the cheapest model. Quality-first model allocation must preserve evidence, deterministic math, and source governance.

## QA and implementation evidence

Sep 8-9 implementation history includes:

- strict frontend report admission gate restored;
- doctrine and launch-readiness tests made launch-critical;
- pricing/dashboard/customer-boundary copy aligned to strict admission doctrine;
- auth return-path preservation repaired;
- pricing card alignment and Bundle copy repaired;
- Owner Economics engine implemented as a pure calculation module with dedicated smoke coverage;
- Owner Economics UI wired into the existing Admin Dashboard without a new database table or billing mutation;
- conservative AI/Textract assumptions locked;
- DocRaptor Professional baseline locked;
- Resend given an explicit monthly-cost field.

Owner Economics changes repeatedly passed focused smoke coverage, the canonical InvestorIQ QA suite, and the production Vite build before final production promotion.

Important final runtime commits:

- `4f00c2282616cc427a2d0d6d8389efc7366b264e` - conservative variable baseline functional commit
- `243159be4be0b34c613b51a4b00a098e75e14e31` - clean runtime HEAD promoted to production

## Known observation that must not be misdiagnosed

During an earlier protected preview, `/api/admin/report-projection` logged `PGRST205` because `public.admin_report_projection` was not found in the schema cache. The grouped Vercel record pointed to preview deployment `dpl_6MaSAoGY1yweQxK72CgN89nPv6af`. No error/fatal runtime logs were present on the final production deployment during the first verification window.

Treat the preview report-projection observation as a bounded follow-up only if the same route is evidenced in production. Do not conflate it with the Owner Economics calculator or declare the Sep 9 production promotion failed because of that preview record.

## Production closeout and holds

Owner explicitly authorized the Sep 9 production promotion. It is complete.

After closeout, production mutation returns to HOLD. Do not perform another deployment, merge `main`, apply or re-apply migrations, activate the scheduler, mutate Supabase Storage, alter Stripe/pricing, or make another production write without new explicit Owner authorization.

Next work must begin as a new bounded owner-approved change against the live production runtime above. Do not restart completed Sep 6 report audit work, Sep 8 admission-doctrine repair, Sep 9 pricing closeout, or Sep 9 Owner Economics implementation unless a new defect requires reopening the relevant slice.

## Fresh-chat starting instruction

Read all five canonical files in `CHAT_HANDOFF/` completely, starting with `03_FRESH_CHAT_PROMPT.md`, then read this archive. Treat this Sep 9 closeout as the newest status authority and preserve all older material as historical evidence.

Verify the live runtime at:

- SHA `243159be4be0b34c613b51a4b00a098e75e14e31`
- deployment `dpl_HXd4Z538RBG1xsexqTzG9gDbVpSa`

before proposing any new production change.

Potential next bounded topics, only if the Owner chooses them:

1. verify actual Owner Economics MTD cards and admin projections on the live production origin;
2. revisit stage-by-stage GPT model selection for Screening and Underwriting with report quality as the primary criterion;
3. observe first real-customer unit economics and replace conservative AI/Textract planning allowances with measured averages when enough production data exists;
4. continue launch/commercial work without reopening already certified report-pipeline work.
