# InvestorIQ Master Context - May 2026

# May 15, 2026 Night Update - Supabase Worker Automation Phase 1 / No Manual Worker Babysitting

## Critical operational context remains locked
- Codex usage remains limited until May 19 at 9:53am.
- Continue Codex conservation mode:
  - no broad tests;
  - no smoke-test theatre;
  - no broad repo rewrites;
  - no live tests as discovery;
  - one narrow investigation or patch at a time;
  - minimum validation only on touched files.
- Patch standard remains class-level, not one-report duct tape.
- Do not expose secrets in chat, screenshots, prompts, docs, or logs.

## Worker automation objective
Rob wanted to get away from manually checking the computer every hour and manually kicking the worker when reports were queued.

Correct operational goal:
```text
Customer clicks Generate Report
-> job is queued
-> system wakes worker automatically
-> worker scans queued jobs
-> worker atomically claims any eligible job
-> dashboard observes status
-> Rob only intervenes for real exceptions
```

Manual babysitting should no longer be required for normal queued jobs.

## Architecture decision
We discussed several options:
- Supabase-native full processing
- Supabase Cron / pg_cron wake-up
- Supabase Queues / pgmq
- Supabase DB webhook on `analysis_jobs.status = queued`
- QStash
- Inngest
- dedicated worker server
- Vercel/GitHub-style worker kicking

Decision for now:
```text
Use Supabase as the wake-up/dispatcher layer only.
Keep existing `api/admin-run-worker.js` as the heavy processor.
Do not move report generation into Supabase Edge Functions.
Do not use a queued-status DB webhook yet.
```

Reason:
- The current worker performs heavy multi-stage work:
  - extraction;
  - parsing;
  - report generation;
  - DocRaptor call;
  - email;
  - many artifact writes;
  - delivery gate handling;
  - entitlement restore.
- Supabase Edge Functions are not the right place to move the entire processor right now.
- Supabase Cron can safely wake the existing worker without changing Dashboard, credits, parser, report generation, DocRaptor, or QA.

## Worker claim-contention safety patch completed
Before enabling automation, Codex investigated the current worker flow and found an important safety risk:
- duplicate worker invocations were not necessarily harmless;
- one worker could win the `claim_and_consume_job` claim while another loser invocation might fall into failure handling;
- this could potentially mark a live job failed or restore entitlement incorrectly.

Patch completed by Codex:
- file: `api/admin-run-worker.js`
- area: queued-job claim branch in the worker loop.

New behavior:
```text
If claim_and_consume_job returns no claim row because another worker already claimed the job:
-> skip quietly
-> do not mark failed
-> do not restore entitlement
-> do not clear purchase_id
-> do not write REPORT_GENERATION_FAILED
```

Validation:
- `node --check api/admin-run-worker.js` passed.

Important note:
- Real failures after a successful claim still use existing failure handling.
- Credits, schema, dashboard, parser, report generation, DocRaptor, QA, and worker lifecycle were not changed.

This was the required safety prerequisite before any automated scheduled wake-up.

## Supabase Cron automation enabled
Supabase setup completed manually with baby-step guidance.

Enabled extensions:
- `pg_net`
  - enabled under the default `extensions` schema.
- `pg_cron`
  - enabled under required `pg_catalog` schema.

Created Supabase Cron job:
```text
Name: investoriq-admin-run-worker
Schedule: */5 * * * *
Active: on
```

The job uses a SQL snippet calling `net.http_post`, not the Supabase HTTP Request UI.

Reason:
- Supabase HTTP Request UI only allowed a short timeout/max 5000ms in the visible form.
- SQL snippet with `net.http_post(...)` is the safer async HTTP-dispatch pattern for this job.

Scheduled command shape:
```sql
select
  net.http_post(
    url := 'https://investoriq.tech/api/admin-run-worker',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 50000
  );
```

Important:
- The real `CRON_SECRET` was not pasted into chat.
- The secret stays server-side in Vercel and Supabase Cron configuration only.
- `admin-run-worker.js` requires `POST`; it does not accept `GET`.
- Header used:
  - `x-cron-secret: <CRON_SECRET>`
  - `Content-Type: application/json`
- Body:
  - `{}`

First run result:
```text
Last run: 15 May 2026 19:50:00 (-0400) - Succeeded
Next run: 15 May 2026 19:55:00 (-0400)
Active: on
```

Meaning:
```text
Every 5 minutes
-> Supabase calls https://investoriq.tech/api/admin-run-worker
-> worker scans queued jobs
-> worker claims anything eligible
-> if no queued jobs, it exits
```

This is Phase 1 automation and should eliminate routine manual worker babysitting.

## GitHub worker / old worker-kick decision
Do not immediately turn off the GitHub/manual worker until the Supabase Cron automation is observed over at least a few cycles and ideally one real queued-job processing event.

Near-term rule:
```text
Do not disable GitHub Actions/manual fallback yet.
Let Supabase Cron run and prove stability first.
```

Recommended next decision:
1. Confirm Supabase Cron continues to succeed for several cycles.
2. Confirm no queued jobs are getting stuck.
3. Confirm one queued job is picked up automatically without manual kick.
4. Then decide whether to disable GitHub scheduled worker while preserving manual dispatch as emergency fallback.

Reason:
- Supabase Cron is now the preferred automatic wake-up layer.
- But until observed on a real queued job, GitHub/manual kick should remain as a temporary fallback.
- Duplicate wake-ups are safer after the claim-loser patch, but redundant triggers still add noise and DB scans.
- Eventually there should be one primary automated scheduler, plus an emergency manual/admin kick path.

## Immediate automation status
Completed:
- Worker duplicate-wake safety patched.
- Supabase `pg_net` enabled.
- Supabase `pg_cron` enabled.
- Supabase scheduled worker wake-up created.
- First scheduled run succeeded.

Current expected behavior:
- No more routine manual checking/kicking every hour.
- Queued reports should be picked up within 0-5 minutes.
- Customer-facing 24-business-hour delivery promise remains intact.
- Immediate generate-click wake-up is still a future enhancement, not implemented today.

## Why immediate wake-up was not implemented today
Codex investigated immediate wake-up after `queue_job_for_processing`.

Finding:
```text
No-go under current constraints.
```

Reason:
- Dashboard-side worker call would require exposing a secret in browser code, which is not acceptable.
- Current `queue_job_for_processing` RPC only transitions `needs_documents -> queued` and writes an event.
- No safe server-side post-queue wake hook exists today.
- No `pg_net`/HTTP trigger wiring exists inside the RPC.
- A generic DB webhook on `analysis_jobs.status = queued` is still considered too risky for now because `queued` is a handoff state and timing/readiness must be handled carefully.
- A safe immediate wake-up would require a controlled backend hook or SQL/RPC-side async HTTP trigger with secret handled server-side.

Decision:
```text
Do not implement immediate wake-up yet.
Use 5-minute Supabase Cron as safe Phase 1.
Revisit immediate backend wake hook after May 19 / after launch blockers are cleared.
```

Future immediate-wake options:
- server-side queue wrapper route;
- RPC-side `pg_net` wake-up after safe queueing;
- Supabase Queue/pgmq with job_id pointer only;
- QStash/Inngest if richer orchestration/retries become worth it.

## Vercel environment secrets follow-up
Vercel showed several environment variables marked `Needs Attention`, including:
- `CRON_SECRET`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCESS_KEY_ID`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- other sensitive variables.

Follow-up added:
```text
Rotate important Vercel environment secrets/variables after launch blockers are handled, especially ones marked "Needs Attention". Do this carefully with service-specific rotation steps and redeploy verification. Do not expose secrets in chat.
```

Do not rotate these during the automation setup unless there is a confirmed security incident. Rotation is a controlled follow-up task.

## Updated current status
Completed / accepted today:
- Renovation budget card-title leak fixed.
- Source-of-truth audits completed.
- Partial rent roll sample class patch completed.
- Final report public wording patch completed.
- Core Input Sufficiency Contract audited and found already mostly wired.
- Worker claim-loser/no-op safety patch completed.
- Supabase Cron worker wake-up enabled and first run succeeded.

Current automation state:
```text
Phase 1 automatic worker wake-up is live.
InvestorIQ should now check for queued report jobs every 5 minutes.
Manual worker babysitting should no longer be routine.
```

Still not done:
- immediate wake-up on Generate Report click;
- full Supabase Queue/pgmq migration;
- Inngest/QStash orchestration;
- GitHub worker disable decision;
- Vercel secret rotation;
- DocRaptor production flip;
- final public/Ken validation.

## Immediate next steps
1. Do not create duplicate Supabase Cron jobs.
2. Let the current cron job run.
3. Monitor:
   - Supabase Cron `Last run` and `Succeeded`;
   - Vercel logs for `/api/admin-run-worker`;
   - queued jobs in Supabase/Admin Dashboard;
   - `advancedCount` / `failedCount` response where visible;
   - `analysis_job_events`;
   - `worker_event` artifacts.
4. Keep GitHub/manual worker fallback temporarily.
5. After a real queued job is automatically picked up by Supabase Cron, decide whether to disable GitHub scheduled worker.

## Fresh chat prompt - May 15 night continuation

```text
We are continuing InvestorIQ from the May 15 night master context.

Critical operating rule:
Codex usage remains limited until May 19 at 9:53am. Continue Codex conservation mode. No broad tests. No smoke-test theatre. No broad repo rewrites. Use Codex only for narrow, high-leverage investigation/patches with minimum validation. If ChatGPT/Rob can reason through a task manually, do that first.

Work completed in the prior chat:
1. Fixed the renovation budget card-title leak:
   - `buildRenovationBudgetCardHtml()` now accepts optional `title`;
   - live render passes `renovationDisplayCopy.budget_card_title`;
   - budget-only/no-ROI reports should show `Renovation Budget Items`, not leaked `Renovation Budget Breakdown`.

2. Completed three compressed source-of-truth audits:
   - Rent Roll / T12 / Occupancy found only partial-rent-roll sample leaks.
   - Debt / Property Tax / Cap Rate-Valuation found no launch/Ken blockers.
   - Renovation / Delivery QA Gate alignment found no launch/Ken blockers.

3. Patched the partial rent roll sample class:
   - partial samples no longer allow row-derived annual totals to feed full-property reconciliation unless a trusted summary total exists;
   - partial samples no longer derive QA/source-coverage occupancy from sample rows unless trusted summary exists;
   - validation passed: `node --check api/generate-client-report.js` and `node --check api/_lib/source-report-coverage-qa.js`.

4. Ran final report language consistency sweep:
   - patched remaining public-facing appraisal-like DCF/exit-cap labels;
   - removed stale `Full` prefix from `Full Refinance Sufficiency (Deterministic)`;
   - validation passed: `node --check api/generate-client-report.js`; `git diff --check` passed with CRLF warning only.

5. Ran Core Input Sufficiency Contract read-only audit:
   - status: already mostly wired;
   - no launch blocker found;
   - delivery gate already keys off sufficiency contract and customer delivery impact;
   - remaining cleanup should wait until May 19.

6. Worker automation Phase 1 was completed:
   - Codex patched `api/admin-run-worker.js` so claim losers/no longer claimable queued jobs skip quietly instead of falling into failure/restore paths;
   - validation passed: `node --check api/admin-run-worker.js`;
   - Supabase `pg_net` was enabled;
   - Supabase `pg_cron` was enabled;
   - Supabase Cron job `investoriq-admin-run-worker` was created;
   - schedule: `*/5 * * * *`;
   - it calls `https://investoriq.tech/api/admin-run-worker` with `POST`, `Content-Type: application/json`, `x-cron-secret`, and `{}` body through `net.http_post`;
   - first run succeeded at 15 May 2026 19:50 (-0400);
   - next run scheduled correctly;
   - Active is on.

Automation doctrine:
- Supabase is only the wake-up/dispatcher layer right now.
- Existing `api/admin-run-worker.js` remains the heavy processor.
- Do not move full report generation into Supabase Edge Functions.
- Do not use a generic DB webhook on `analysis_jobs.status = queued` yet.
- Immediate wake-up after Generate Report was investigated and is no-go under current constraints because browser-side calls would expose secrets and no safe server-side hook exists today.
- Phase 1 outcome: no more routine manual worker babysitting; queued jobs should be picked up within 0-5 minutes.

Important next decision:
Do not immediately disable the GitHub worker/manual fallback until Supabase Cron has been observed over a few cycles and ideally one real queued-job pickup. After that, decide whether to disable GitHub scheduled worker while preserving manual dispatch/emergency admin kick.

Immediate next actions:
1. Commit today's accepted repo changes if not already committed:
   - `git add api/generate-client-report.js api/_lib/source-report-coverage-qa.js api/admin-run-worker.js`
   - `git commit -m "Harden source truth and automate worker wakeup"`
2. Monitor Supabase Cron and Vercel logs.
3. Confirm one real queued job is picked up automatically by Supabase Cron.
4. Then decide whether to disable GitHub scheduled worker.
5. Do not run a live report test unless Rob explicitly chooses it.
6. Preserve follow-up to rotate important Vercel secrets later, especially variables marked `Needs Attention`.

Backlog to preserve:
- After May 19: QA consumer cleanup so downstream consumers rely more directly on `publishability_bucket` and `customer_delivery_impact` rather than coarse `qa_status` / review labels.
- Immediate Generate Report wake hook after safe queueing.
- Worker automation Phase 2 / possible Supabase Queue, QStash, or Inngest after volume or launch-readiness demands it.
- Admin Dashboard clarity and QA Manager calibration.
- Before Ken/public samples: clean names/files, DocRaptor production verification, no public blockers, no test watermark, `qa_action_plan.requires_code_patch = 0`, public/high-value ready.
```

---

# May 15, 2026 Evening Update - Post Source-Truth Audit / Partial Sample Class Patch / Public Wording Patch / Core Sufficiency Audit

## Critical operational context remains locked
- Codex usage remains limited until May 19 at 9:53am.
- Continue Codex conservation mode:
  - no broad tests;
  - no smoke-test theatre;
  - no broad repo rewrites;
  - no live tests as discovery;
  - one narrow investigation or patch at a time;
  - minimum validation only on touched files.
- If ChatGPT/Rob can reason through or patch manually, do that before spending Codex.
- Patch standard remains class-level, not one-report duct tape.

## Work completed in this chat

### 1. Renovation budget card title leak fixed
Problem:
- `buildRenovationBudgetCardHtml()` still had a hardcoded visible card heading: `Renovation Budget Breakdown`.
- This could leak into `budget_only_no_roi` reports even after the new renovation display modes were added.

Patch completed manually / verified:
- `buildRenovationBudgetCardHtml()` now accepts an optional final `title` parameter, defaulting to `Renovation Budget Breakdown` for backward compatibility.
- The hardcoded card heading was replaced with escaped dynamic title output.
- Live renovation render path now passes `renovationDisplayCopy.budget_card_title`.
- Old string-replace workaround was reduced/removed so the resolved display copy is the source of truth.

Expected behavior now:
- `historical_only` -> `Historical Capital Items`
- `budget_only_no_roi` -> `Renovation Budget Items`
- `forward_looking_modelable` -> `Renovation Budget Breakdown`

Validation:
- `node --check api/generate-client-report.js` passed.

### 2. Three Codex source-of-truth audits completed
The repo-wide launch-readiness backlog began with three compressed Codex audits.

#### Prompt 1 - Rent Roll / T12 / Occupancy
Findings:
- Two partial-rent-roll sample blockers were found.
- `api/generate-client-report.js` still allowed partial rent roll samples to carry row-derived annual totals through canonical annual total handling into full-property totals.
- `api/_lib/source-report-coverage-qa.js` derived occupancy in `deriveRentRollInventoryOccupancy()` without a partial-sample guard, creating QA/source-coverage divergence risk.

#### Prompt 2 - Debt / Property Tax / Cap Rate-Valuation
Findings:
- No launch/Ken blockers found.
- No patch made.

#### Prompt 3 - Renovation / Delivery QA Gate Alignment
Findings:
- No launch/Ken blockers found.
- Renovation display mode, document treatment, and QA/delivery gate paths were aligned.
- `DOCRAPTOR_NOT_PRODUCTION_MODE` remains advisory/public-sample related and does not override deliverable gate by itself.
- Section-constrained publishable states flow through delivery as publishable classifications rather than blanket review blockers.
- No patch made.

### 3. Partial rent roll sample class patch completed
Patch target:
- This is a class fix, not a one-report fix.

Locked class rule:
```text
If a rent roll is only a sample, row-derived totals and occupancy must not be treated as full-property truth unless a trusted summary row exists.
```

Files/functions changed by Codex:
- `api/generate-client-report.js`
  - `buildRendererCanonicalState` / rent-roll annual total suppression branch
- `api/_lib/source-report-coverage-qa.js`
  - `deriveRentRollInventoryOccupancy`

Behavior now:
- Partial rent roll samples stop row-derived annual totals from feeding full-property reconciliation unless a trusted summary total exists.
- Partial rent roll samples return occupancy `null` in QA/source-coverage unless a trusted summary row exists.
- Full rent rolls and trusted summary totals preserve existing behavior.

Validation:
- `node --check api/generate-client-report.js` passed.
- `node --check api/_lib/source-report-coverage-qa.js` passed.

### 4. Final report language consistency sweep completed
Codex ran a focused public/Ken wording sweep.

Findings:
- No launch-blocking language issues beyond appraisal-like valuation wording in the DCF / exit-cap surface.
- `Intrinsic Value: Exit Cap Rate Sensitivity` and `Implied Intrinsic Value` remained public-facing appraisal-like phrases.
- `Full Refinance Sufficiency (Deterministic)` remained a visible headline and the `Full` prefix was stale for public samples.

Patch completed:
- `api/generate-client-report.js`
  - DCF / refinance section labels

Expected wording direction now:
- Framework value / framework sensitivity / present value sensitivity wording instead of appraisal-like intrinsic-value wording.
- `Refinance Sufficiency (Deterministic)` instead of stale `Full Refinance Sufficiency (Deterministic)`.

Validation:
- `node --check api/generate-client-report.js` passed.
- `git diff --check` passed with CRLF warning only.

### 5. Core Input Sufficiency Contract read-only audit completed
Codex ran a read-only audit.

Result:
```text
CONTRACT STATUS: already mostly wired
```

Findings:
- Core sufficiency is already machine-readable enough to separate:
  - `core_sufficient_publishable`
  - `section_constrained_publishable`
  - `disclose_only_publishable`
- Delivery gate already keys off the sufficiency contract and `customer_delivery_impact`.
- No launch blocker was found where optional missing sections alone force a publishable report into hard review.
- Public/Ken blockers are already separated from customer delivery in `buildQaActionPlan`.
- Remaining risk is downstream consumers over-reading coarse `qa_status` / review wording rather than `publishability_bucket` and `customer_delivery_impact`.

Decision:
- Do not patch this now while Codex is limited.
- Wait until May 19 for lower-value cleanup wiring.

## Current status after this chat
Completed / accepted:
- Renovation card-title leak fixed.
- Source-of-truth audit completed across the listed risk areas.
- Partial rent roll sample suppression class fixed.
- Final report public wording sweep patched.
- Core Input Sufficiency Contract audited and found already mostly wired.

No further Codex should be spent today on:
- debt;
- property tax;
- cap-rate / valuation logic;
- renovation display mode alignment;
- DocRaptor / delivery gate;
- Core Input Sufficiency implementation wiring.

Recommended immediate action:
- Commit today's accepted safe changes before any live test.

Suggested commit:
```bash
git add api/generate-client-report.js api/_lib/source-report-coverage-qa.js
git commit -m "Harden source truth and public report wording"
```

## Remaining backlog after this update

### Keep for after May 19 / when Codex resets
1. QA consumer cleanup:
   - make downstream QA consumers rely more directly on `publishability_bucket` and `customer_delivery_impact`;
   - reduce reliance on coarse `qa_status` / review wording.

2. Worker automation / eliminate manual worker kick:
   - Generate Report should queue/lock `analysis_jobs` and return quickly;
   - worker should run independently;
   - Dashboard should observe lightweight status without waiting/freezing;
   - keep this backlog only while Codex is limited.

3. Broader source-of-truth cleanup / repo hygiene audit before Ken:
   - now partially completed by the targeted audits;
   - any remaining work should be narrow and based on blockers, not broad rewrites.

4. Admin Dashboard clarity / QA Manager calibration:
   - simplify admin queue information hierarchy later;
   - unsupported-doc disclosure + no numeric contamination should not become a public blocker.

### Before Ken/public samples
- Commit accepted patches.
- Use clean property names and clean filenames.
- DocRaptor production mode must be enabled and verified.
- No test watermark.
- No test/sample/internal names.
- No public sample blockers.
- `qa_action_plan.requires_code_patch = 0`.
- Customer delivery ready.
- Public sample ready.
- High-value outreach ready.
- Source reconciliation either clean/aligned or intentionally disclosed in a selected sample.

## Fresh chat prompt - May 15 evening continuation

```text
We are continuing InvestorIQ from the May 15 evening master context.

Critical operating rule:
Codex usage is limited until May 19 at 9:53am. We are still in Codex conservation mode. Do not use Codex for anything we can reason through manually. No broad tests. No smoke-test theatre. No live tests as QA discovery. Use Codex only for narrow, high-leverage investigation/patches with minimum validation.

Work completed in the prior chat:
1. Fixed the renovation budget card-title leak:
   - `buildRenovationBudgetCardHtml()` now accepts optional `title`;
   - live render passes `renovationDisplayCopy.budget_card_title`;
   - budget-only/no-ROI reports should show `Renovation Budget Items`, not leaked `Renovation Budget Breakdown`.

2. Completed three compressed source-of-truth audits:
   - Rent Roll / T12 / Occupancy found only partial-rent-roll sample leaks.
   - Debt / Property Tax / Cap Rate-Valuation found no launch/Ken blockers.
   - Renovation / Delivery QA Gate alignment found no launch/Ken blockers.

3. Patched the partial rent roll sample class:
   - partial samples no longer allow row-derived annual totals to feed full-property reconciliation unless a trusted summary total exists;
   - partial samples no longer derive QA/source-coverage occupancy from sample rows unless trusted summary exists;
   - validation passed: `node --check api/generate-client-report.js` and `node --check api/_lib/source-report-coverage-qa.js`.

4. Ran final report language consistency sweep:
   - patched remaining public-facing appraisal-like DCF/exit-cap labels;
   - removed stale `Full` prefix from `Full Refinance Sufficiency (Deterministic)`;
   - validation passed: `node --check api/generate-client-report.js`; `git diff --check` passed with CRLF warning only.

5. Ran Core Input Sufficiency Contract read-only audit:
   - status: already mostly wired;
   - no launch blocker found;
   - delivery gate already keys off sufficiency contract and customer delivery impact;
   - remaining cleanup should wait until May 19.

Immediate next action:
Do not patch more first. Commit the accepted safe changes if not already committed:

`git add api/generate-client-report.js api/_lib/source-report-coverage-qa.js`
`git commit -m "Harden source truth and public report wording"`

After commit, decide whether to update docs again, pause, or run the next carefully selected validation. Do not run a live test until Rob explicitly chooses it.

Backlog to preserve:
- After May 19: QA consumer cleanup so downstream consumers rely more directly on `publishability_bucket` and `customer_delivery_impact` rather than coarse `qa_status` / review labels.
- Worker automation / manual kick elimination remains backlog only.
- Admin Dashboard clarity and QA Manager calibration remain later items.
- Before Ken/public samples: clean names/files, DocRaptor production verification, no public blockers, no test watermark, `qa_action_plan.requires_code_patch = 0`, public/high-value ready.
```

---

# May 15, 2026 Late-Day Update - Maplewell/Silvergate/Northbank Class Fixes / Codex Conservation Mode / Next Repo-Wide Polish

## Critical operational context
- Rob is down to roughly 52% Codex usage and quota will not reset until May 19 at 9:53am.
- Codex must be used surgically from here:
  - no broad test runs unless absolutely necessary;
  - no smoke-test theatre;
  - no extra validation beyond touched files;
  - no broad repo rewrites;
  - investigation-first when uncertain;
  - one narrow patch at a time.
- If a patch is easy enough for ChatGPT/Rob to do manually, prefer that over burning Codex.
- Recommended Codex validation language:
  - `Run only the minimum validation required for touched files. Do not run broad smoke/e2e/test suites unless the touched code directly affects that suite or Rob explicitly asks.`

## May 15 overall status
May 15 converted the late-night Maplewell crisis into a set of real class fixes. The key outcome is that the system is no longer just duct-taping one report:
- rent-roll total source selection was hardened;
- impossible annual rent totals are suppressed;
- delivery gate overblocking was reduced;
- private customer delivery vs public/Ken readiness is now better separated;
- score/verdict display is now capped consistently when source reconciliation is unresolved;
- messy support-doc reports now include a Document Treatment Summary;
- historical CapEx vs budget-only renovation docs are now separated;
- DCF/value language is moving toward framework sensitivity instead of appraisal-like wording.

## Maplewell RETEST 8/9/10 - rent-roll source truth and delivery gate loop closed
### Problem
Maplewell true-current-debt package kept looping into Admin Review / Needs Documents even after earlier source-reconciliation patches.
Observed failures included:
- impossible annual market rent totals such as `$21,744,000`;
- weighted average market rent around `$1,888/month`;
- total units `48`;
- implied average market rent from bad annual total around `$37,750/month/unit`;
- delivery gate overpromoting advisory/public-only issues into customer blockers;
- Deal Scorecard and cover verdict mismatch.

### Class fixes completed
1. Canonical rent-roll annual resolver:
   - added/used shared canonical annual total selection;
   - prefers internally coherent row-derived or weighted-average-derived annual totals over incoherent summary totals;
   - `trusted_summary_totals` now means "summary row exists," not "summary automatically wins";
   - bad summary totals are recorded as suppressed values.

2. Impossible market annual rent suppression:
   - bad annual market total `$21,744,000` is suppressed;
   - coherent annual market total around `$1.087M` renders instead;
   - annual in-place rent `$961,200` remains selected when row-derived values are coherent.

3. Delivery gate overblocking fix:
   - `INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION` no longer becomes a blanket customer blocker when contract says `blocks_customer_delivery: false`;
   - `RENT_ROLL_T12_RECONCILIATION_REQUIRED` no longer forces `user_needs_documents` when state is explicitly disclose-only publishable;
   - public sample / high-value outreach blockers remain separate from private customer delivery blockers.

4. Verdict alignment fix:
   - added canonical display verdict state;
   - cover / capital-risk / Deal Scorecard now share capped display verdict logic;
   - unresolved source reconciliation caps displayed headline to:
     - `Review - Source Reconciliation Disclosure`
   - underlying numerical score remains intact;
   - clean strong reports can still show `Within Underwriting Parameters`.

### RETEST 10 outcome
- Published.
- Delivery gate remained deliverable.
- No Admin Review.
- No Needs Documents.
- Customer blockers empty.
- Report Contract QA passed.
- QA Director found no missed issue.
- Cover, Capital Risk Profile, and Deal Scorecard now align on:
  - `Review - Source Reconciliation Disclosure`.
- Public/Ken blockers remained appropriate:
  - DocRaptor test mode;
  - unresolved source reconciliation;
  - public sample readiness.

## Silvergate messy support-doc class - private delivery passed, public polish improved
### Test class
Silvergate messy/unsupported support-doc underwriting package:
- T12;
- Rent Roll;
- Historical CapEx note;
- Broker email/background;
- Unsupported appraisal summary;
- Unsupported market survey;
- Unsupported Phase I ESA;
- no true current debt.

### Findings
Initial published Silvergate report was customer-deliverable but not Ken/public-ready:
- uploaded files were listed but not clearly separated by use;
- historical CapEx displayed under renovation strategy language;
- reconciliation warning repeated too heavily;
- scorecard needed stronger source-constrained note;
- customer-facing tier label `Full Underwriting` overpromised;
- DCF/scenario valuation surfaces still sounded too appraisal-like;
- QA Manager remained noisy on unsupported-doc disclosure.

### Class fixes completed
1. Document Treatment Summary added:
   - `Modeled Inputs`
   - `Displayed / Limited Use`
   - `Listed but Not Quantitatively Modeled`
   - Preserves uploaded-file auditability while clarifying what actually drives modeled outputs.

2. Metadata-first treatment classification:
   - classification now prefers:
     - `semantic_doc_role`
     - `semantic_doc_display_label`
     - `display_doc_type`
     - `doc_type`
     - `parse_status`
     - `parse_error`
     - structured/validated state
   - filename regex is last-resort fallback only.
   - rows now carry testable:
     - `data-treatment-source`
     - `data-treatment-code`.

3. Current-debt treatment wiring:
   - live render path now passes `currentDebtAssessmentState` into Document Treatment Summary helper;
   - true current-debt docs with computed DSCR can render as modeled inputs;
   - debt-like docs without verified current balance are not promoted to modeled current debt;
   - proposed/acquisition debt remains separate and is not labeled as current debt.

4. Historical CapEx handling:
   - historical-only CapEx now renders as:
     - `Historical Capital Expenditure Summary`
     - `Historical Capital Items`
   - no ROI/payback/rent-lift/timing/schedule is modeled.

5. Tier label/display polish:
   - customer-facing label changed from `Full Underwriting` to `Underwriting`;
   - source badges added where applicable:
     - `Source-Constrained`
     - `Debt Not Provided`
     - `Disclosure Required`.

6. Scorecard note:
   - score remains numerical;
   - note now clarifies score is source-constrained and should not be read as refinance-ready or unconstrained when current debt is missing or reconciliation remains unresolved.

7. DCF/value optics:
   - DCF/scenario surfaces now use framework-sensitivity language;
   - `Estimated Intrinsic Value` softened to `Framework-Indicated Present Value (Sum of PVs)`;
   - explicit note: framework sensitivity, not appraisal, and unsupported appraisal/market survey files are not relied on.

### Silvergate retest result
- Published cleanly.
- Delivery gate deliverable.
- Customer blockers empty.
- No Admin Review.
- No Needs Documents.
- Document Treatment Summary rendered correctly.
- Historical CapEx rendered correctly.
- DCF framework/not-appraisal note rendered correctly.
- Public/Ken readiness still appropriately blocked by DocRaptor test mode, unresolved source variance, and test/sample naming.

## Northbank structured renovation budget - missing middle category fixed
### Problem
Northbank `structured_reno_no_roi_inputs` exposed a nearby class not covered by the Silvergate historical-CapEx patch:
- the renovation source was not historical-only;
- it was a structured renovation budget with scope/cost rows and total budget;
- it explicitly lacked ROI, rent lift, payback, phasing, cost recovery, and implementation schedule.
The report safely avoided inventing ROI/payback/rent lift, but wrongly rendered the source as historical-only.

### Root cause
Renovation rendering was still effectively binary:
- forward-looking/modelable;
- historical-only.

It lacked the middle state:
- structured budget/scope only, no ROI inputs.

### Class fix completed
Added/implemented renovation display modes:
- `historical_only`
- `budget_only_no_roi`
- `forward_looking_modelable`

Required behavior now:
1. Historical-only CapEx:
   - title: `Historical Capital Expenditure Summary`
   - card: `Historical Capital Items`
   - note: historical items displayed for context only.

2. Budget/scope-only renovation docs with no ROI inputs:
   - title: `Renovation Budget Summary - No ROI Inputs Provided`
   - card: `Renovation Budget Items`
   - note:
     - budget and scope items are displayed from uploaded renovation budget;
     - no ROI, rent lift, payback, phasing, cost recovery, or implementation schedule is modeled because those assumptions were not provided.
   - Document Treatment Summary note:
     - `Budget/scope only; no ROI/payback/rent-lift modeling`.

3. Fully supported forward-looking renovation plan:
   - title may remain `Renovation Strategy & Capital Plan`;
   - ROI/payback/rent-lift/timing only when document-backed.

### Reconciliation repetition reduction
The remaining repeated analytical bullets were shortened:
- Operating Profile / Income Forensics now uses:
  - `Rent Roll vs T12 GPR variance: X%. See Data Coverage.`
- NOI Stability now uses the same short reference.
- Full disclosure remains in Data Coverage.

## Immediate next issue for fresh chat
Before more testing, first deal with this known code polish issue:
- `buildRenovationBudgetCardHtml()` still has hardcoded card heading:
  - `Renovation Budget Breakdown`
- That may bypass the new `budget_card_title` display copy in some render surfaces.
- First task in new chat:
  - inspect the actual call path;
  - determine whether the hardcoded title can leak into budget-only/no-ROI reports;
  - patch manually or with a tiny Codex prompt only if needed;
  - no broad testing.

Preferred patch if confirmed:
- change `buildRenovationBudgetCardHtml(rows, formatValue, note, columnVisibility)` to accept an optional `title` argument, defaulting to `Renovation Budget Breakdown` for backward compatibility;
- pass `renovationDisplayCopy.budget_card_title` from live render path;
- focused `node --check api/generate-client-report.js`;
- no broad tests unless the touched existing smoke directly covers it.

## Repo-wide fixes / backlog to begin after the hardcoded renovation title
### 1. Focused repo-wide source-of-truth audit before Ken/public samples
This remains required before messaging Ken Dunn or publishing public samples.

Goal:
- find financial metrics calculated in more than one place;
- find renderer paths that recompute values instead of using canonical state;
- find QA paths that rebuild state differently than renderer paths;
- find summary-total vs row-derived conflicts;
- add source-selection metadata where missing;
- add conflict fixtures only where two plausible values exist but only one is allowed to control.

Risk areas:
- Rent roll totals:
  - summary totals vs row-derived totals vs computedRentRoll vs weighted-average-derived totals.
- T12 totals:
  - GPR vs EGI vs total income vs line-item sums.
- Debt:
  - true current debt vs acquisition/proposed financing vs loan-term fallback.
- Property tax:
  - T12 tax line vs property tax bill vs parsed support doc.
- Cap rate / valuation:
  - document-derived cap rate vs standardized framework sensitivity assumptions.
- Renovation:
  - actual budget/scope vs filename hints vs partial support docs.
- Occupancy:
  - rent roll summary occupancy vs row-derived occupied/vacant status.
- Report delivery:
  - QA/source coverage state vs rendered HTML vs DocRaptor HTML vs delivery gate.

This audit is not a broad refactor. It is a launch-readiness control.

### 2. Core Input Sufficiency Contract
Still required / partially implemented conceptually.

Objective:
- make T12 core sufficiency, rent roll core sufficiency, and optional section sufficiency explicit machine-readable contracts;
- ensure delivery gates read those contracts rather than scattered warnings, missing-detail flags, or section-depth heuristics;
- ensure clean-ish packages publish autonomously with collapsed sections/disclosures instead of Admin Review.

Required buckets:
- `core_sufficient_publishable`
- `section_constrained_publishable`
- `disclose_only_publishable`
- `public_or_outreach_only_blocker`
- `user_needs_documents`
- `admin_review_required`
- `system_contract_failure`

### 3. Final report language consistency sweep
Before Ken/public samples:
- remove remaining `Intrinsic Value` / `Implied Intrinsic Value` wording:
  - replace with `Framework Value`, `Implied Framework Value`, or `Present Value Sensitivity by Exit Cap Rate`;
- eliminate awkward trailing periods in headings/metric cards;
- ensure no stale `Full Underwriting` public-facing labels remain;
- ensure no `DATA NOT AVAILABLE` spam returns;
- ensure no public `AI`, model, vendor, or internal QA language appears;
- ensure no BUY/SELL/HOLD or investment recommendation language appears;
- ensure valuation/refi/cap-rate sections consistently say framework / deterministic / not appraisal where applicable.

### 4. QA Manager calibration
Still needed later:
- QA Manager can remain noisy on unsupported-doc issues even when the report clearly says files are not quantitatively modeled and no unsupported values contaminate report math.
- Desired state:
  - unsupported-doc disclosure present + no unsupported numeric contamination = no public blocker from unsupported-doc issue;
  - low advisory only if wording is unclear.

### 5. Worker automation / manual kick elimination
Keep in backlog, not immediate while Codex is limited.
Investigation already found current queue flow happens via frontend Supabase RPC, not a server-side queue wrapper.
Under constraints:
- no new `/api` files;
- no frontend calling worker;
- no Dashboard wait/poll rewrite;
- no Vercel Hobby function-count risk;
there is no clean patch right now.

Future clean fix requires one of:
- server-side queue wrapper route;
- API consolidation to free Vercel Hobby function capacity;
- Pro/server-side architecture;
- or deliberate server-side worker trigger architecture.

Correct future architecture:
- Generate Report queues/locks `analysis_jobs` and returns quickly;
- worker runs independently;
- Dashboard observes lightweight status without waiting/freezing;
- use `analysis_jobs`, not generic `report_jobs`;
- avoid raw INSERT webhook if files/artifacts may not be ready;
- prefer generate-click fire-and-forget after safe queueing or Supabase webhook on `analysis_jobs` transition to `queued`.

### 6. Dashboard freeze caution
Dashboard freeze remains monitored.
Do not add:
- aggressive polling;
- broad `useEffect` dependencies;
- artifact-heavy fetches;
- full-page reloads;
- worker wait behavior.
Existing dashboard guard posture remains:
- capped;
- lazy;
- equality-guarded;
- manual-refresh oriented.

### 7. Public/Ken sample readiness checklist
Before Ken:
- clean property name and clean filenames;
- DocRaptor production mode enabled and verified;
- no test watermark;
- no test property names;
- no public sample blockers;
- `qa_action_plan.requires_code_patch = 0`;
- customer delivery ready;
- public sample ready;
- high-value outreach ready;
- source reconciliation either clean/aligned or intentionally disclosed in a sample selected for that purpose;
- run focused repo-wide source-of-truth audit first.

## Fresh chat prompt - May 15 late-day continuation

```text
We are continuing InvestorIQ from the updated May 15 master context.

Critical operational context:
Rob is at roughly 52% Codex usage and quota does not reset until May 19 at 9:53am. Use Codex very carefully. No broad tests. No smoke-test theatre. No broad repo rewrites. If ChatGPT/Rob can patch a tiny issue manually, prefer that over burning Codex. If Codex is used, use one narrow prompt and minimum validation only.

Current state:
- Maplewell RETEST 10 proved the rent-roll source-truth and delivery-gate class fixes:
  - published;
  - delivery gate deliverable;
  - no Admin Review;
  - no Needs Documents;
  - no customer blockers;
  - verdict aligned as `Review - Source Reconciliation Disclosure`;
  - bad annual market rent suppressed.
- Silvergate messy support-doc retest proved:
  - Document Treatment Summary renders;
  - metadata-first classification works;
  - unsupported docs are listed but not quantitatively modeled;
  - Historical CapEx renders as historical-only;
  - DCF surfaces now say framework sensitivity / not appraisal;
  - private delivery works while public/Ken blockers remain separate.
- Northbank exposed and then patched a missing renovation display category:
  - historical-only CapEx;
  - budget/scope-only renovation with no ROI inputs;
  - forward-looking/modelable renovation.
- Latest patch added `resolveRenovationDisplayMode()` and budget-only no-ROI display copy:
  - `Renovation Budget Summary - No ROI Inputs Provided`
  - `Renovation Budget Items`
  - no ROI/payback/rent-lift/phasing/cost-recovery/schedule modeling.
- Reconciliation repetition was reduced in Operating Profile and NOI Stability to:
  - `Rent Roll vs T12 GPR variance: X%. See Data Coverage.`

First task in this fresh chat:
Do not run a live test first.
Do not use Codex first unless needed.

Inspect the current `api/generate-client-report.js` issue:
- `buildRenovationBudgetCardHtml()` still has hardcoded heading `Renovation Budget Breakdown`.
- Determine whether that hardcoded card title can leak into budget-only/no-ROI Northbank reports despite the new `budget_card_title` display copy.
- If patchable manually, patch it with minimal change:
  - add optional title parameter with default `Renovation Budget Breakdown`;
  - pass `renovationDisplayCopy.budget_card_title` from the live render path;
  - run only `node --check api/generate-client-report.js`.
- If Codex is needed, create a tiny prompt only for that.
- Do not run broad tests.

After that, begin the repo-wide fixes/backlog carefully:
1. focused source-of-truth audit before Ken/public samples;
2. Core Input Sufficiency Contract explicit machine-readable tiers;
3. final report language consistency sweep:
   - remove remaining `Intrinsic Value` wording;
   - no stale `Full Underwriting`;
   - no `DATA NOT AVAILABLE` spam;
   - no public AI/model/vendor language;
   - consistent framework/not-appraisal valuation language;
4. QA Manager calibration for unsupported-doc false positives;
5. worker automation remains backlog only because current flow queues via frontend RPC and no safe no-new-API patch exists under Vercel Hobby constraints.

Codex conservation rule:
If a task is not launch-blocking, batch it into backlog. If a task is one-line/manual-safe, do it without Codex. If Codex is used, demand a compressed receipt and minimum validation only.
```

---

# May 14, 2026 Late Night Update - Maplewell RETEST 7 / Internal Rent Roll Total Contradiction / Source-of-Truth Audit Required

## Immediate live result - Maplewell true-current-debt RETEST 7
- Latest live test name shown in Dashboard: `01_true_current_debt_underwriting_RETEST 7`.
- The report returned to `UNDER REVIEW`.
- This is no longer the exact same old `RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH` gate loop from earlier Test 4/Test 5.
- Runtime marker confirms the deployed runtime was the intended commit:
  - `git_commit_sha: ee7b636c37adb46461949b5e86377b7fc6a8a894`
  - `marker_version: source-reconciliation-final-guard-v3`
- The final guard is running live and the deployed code path is being executed.

## Skinny on why RETEST 7 went back to review
The current hold reason is:

```text
INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION
```

The artifact evidence shows a rent-roll internal total contradiction:
- total units: `48`
- weighted average market rent: about `$1,888/month`
- rendered / artifact annual market rent total: `$21,744,000`
- implied average market rent from that annual total:
  - `$21,744,000 / 12 / 48 = $37,750/month/unit`
- weighted average in-place rent: about `$1,669/month`
- annual in-place rent total: `$961,200`
- implied average in-place rent from that annual total:
  - `$961,200 / 12 / 48 = $1,668.75/month/unit`

Interpretation:
- The in-place rent basis is internally coherent with the weighted average.
- The market rent annual total is obviously impossible against the weighted average market rent.
- The system correctly detected an internal rent-roll total contradiction.
- However, the delivery behavior still needs investigation because the report-contract artifact says this contradiction was not customer-delivery blocking, but the final `delivery_gate_decision` promoted it into a customer publish blocker / Admin Review.
- That may be a valid conservative hold for a system-generated report-contract failure, or it may be a delivery-gate overpromotion depending on whether the bad annual market total actually reached customer-facing output.

## Important source-selection truth from RETEST 7
- The source reconciliation state still selected:
  - `rr_annual_in_place = 961200`
  - `rr_annual_in_place_source = computedRentRoll.total_in_place_annual`
  - `t12_gpr = 1850000`
  - `variance_pct = -0.48043243243243244`
- The metadata oddly says `trusted_summary_totals: true` while still selecting `computedRentRoll.total_in_place_annual`.
- This means Codex's previous intent to make `rentRollPayload.totals.in_place_rent_annual = 1,962,456` win did not fully land in the live path, or the parsed artifact / computed rent-roll normalization is more nuanced than expected.
- The next fix must be file-truth-based. Do not assume the summary total is always correct. The key is to determine which totals are internally coherent and which are summary-row / annualized / row-derived / market-rent artifacts.

## Next morning investigation target
Do not run more live tests first.

Use Codex to investigate the current RETEST 7 hold as a class-level issue:

1. Determine whether `INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION` is a true customer-delivery blocker or a public/sample-only blocker.
2. Determine whether the bad `$21,744,000` annual market rent total still renders anywhere in customer-facing HTML/PDF.
3. Trace how `annual_market_rent_total = 21,744,000` is selected despite weighted avg market rent around `$1,888`.
4. Trace why source reconciliation still selected `computedRentRoll.total_in_place_annual = 961,200` while metadata says trusted summary totals existed.
5. Decide the correct hierarchy for rent roll totals:
   - internally coherent unit rows;
   - trusted summary totals;
   - weighted average × units × 12;
   - parser/summary-row annual totals.
6. Fix the class so impossible annual totals are suppressed/normalized and delivery-gate impact is consistent with the contract.
7. Add tests for:
   - annual market rent summary contradiction;
   - in-place rent source-selection conflict;
   - delivery-gate handling when contract marks public/high-value blocker but not customer blocker.

## New source-of-truth doctrine from tonight
The recurring failure class is now explicit:

```text
Two different parts of the pipeline must not be allowed to choose their own source of truth.
```

Locked rule:
- Build one canonical state per major financial concept.
- Attach source-selection metadata.
- Pass that state everywhere.
- Downstream renderer, QA, report contract, final guard, and delivery gate must not casually rebuild from different inputs.
- If multiple plausible source values exist, deterministic source-selection must explain which one won and why.
- Rendered PDF must match canonical state.

Risk areas for a focused repo-wide source-of-truth audit before Ken/public samples:
- Rent roll totals:
  - summary totals vs row-derived totals vs computedRentRoll vs weighted-average-derived totals.
- T12 totals:
  - GPR vs EGI vs total income vs line-item sums.
- Debt:
  - true current debt vs acquisition/proposed financing vs loan-term fallback.
- Property tax:
  - T12 tax line vs property tax bill vs parsed support doc.
- Cap rate / valuation:
  - document-derived cap rate vs standardized framework sensitivity assumptions.
- Renovation:
  - actual budget/scope vs filename hints vs partial support docs.
- Occupancy:
  - rent roll summary occupancy vs row-derived occupied/vacant status.
- Report delivery:
  - QA/source coverage state vs rendered HTML vs DocRaptor HTML vs delivery gate.

## Required repo-wide audit before Ken/public samples
Before messaging Ken Dunn or using public samples, run a focused repo-wide source-of-truth audit.

Goal:
- find financial metrics calculated in more than one place;
- find renderer paths that recompute values instead of using canonical state;
- find QA paths that rebuild state differently than renderer paths;
- find summary-total vs row-derived conflicts;
- add source-selection metadata where missing;
- add conflict fixtures where two plausible values exist but only one is allowed to control.

This audit is not a broad refactor. It is a launch-readiness control to stop hidden duplicate-source bugs from leaking into public/high-value reports.

## Future automation to-do - eliminate manual worker kick
Add this to the post-launch / launch-hardening backlog, but do not work on it before the current report-blocker is resolved.

Correct InvestorIQ architecture:
- Generate Report queues/locks the `analysis_jobs` row and returns quickly.
- Worker runs independently.
- Dashboard observes/polls job status without waiting for report generation.
- Frontend never waits synchronously for the worker and never freezes because of worker runtime.

Important InvestorIQ-specific constraints:
- Use `analysis_jobs`, not generic `report_jobs`.
- Use actual InvestorIQ statuses:
  - `queued`
  - `extracting`
  - `underwriting`
  - `scoring`
  - `rendering`
  - `pdf_generating`
  - `publishing`
  - `published`
  - `failed`
  - `under review` / `ADMIN_REVIEW_REQUIRED` where applicable.
- Avoid raw INSERT webhook if files/artifacts may not be ready.
- Safer options:
  1. Generate-click fire-and-forget trigger after the job is safely queued.
  2. Supabase webhook on `analysis_jobs` transition to `queued`, not raw row insert.
- Status endpoint should be auth/ownership-aware; do not rely on UUID-only access for sensitive report status.
- Dashboard should poll a lightweight status endpoint every 5-6 seconds, update React state, and never reload the page.

## Fresh chat brief - May 15 morning resume

```text
We are continuing InvestorIQ from the May 14 late-night master context.

Critical emotional/operational context:
Rob had to stop for the night because fatigue was high after repeated Maplewell retests kept surfacing report-review/failure loops. Start calmly. Do not jump into another blind patch. First classify the latest RETEST 7 artifact.

Latest live result:
- Maplewell true-current-debt package / `01_true_current_debt_underwriting_RETEST 7`
- Deployed runtime marker confirmed commit `ee7b636c37adb46461949b5e86377b7fc6a8a894`
- Final guard v3 is running live.
- Report still went to `UNDER REVIEW`.

Current hold reason:
- `INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION`
- Delivery gate reason:
  - `admin_review_required:INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION`

Evidence:
- total_units: 48
- annual_market_rent_total: 21,744,000
- weighted_avg_market_rent: 1,888
- implied_avg_market_rent: 37,750/month/unit
- annual_in_place_rent_total: 961,200
- weighted_avg_in_place_rent: 1,669
- implied_avg_in_place_rent: 1,668.75/month/unit
- source reconciliation still selected `computedRentRoll.total_in_place_annual = 961,200`
- metadata says trusted summary totals existed but the selected source path is still computedRentRoll.

Interpretation:
- This is not the old deployment problem.
- This is not browser cache.
- This is not primarily AI QA.
- The system is detecting an internal rent-roll total contradiction.
- The immediate question is whether the contradiction is truly customer-blocking, whether the impossible annual market total reaches customer-facing output, and why delivery gate promoted it even though the report-contract violation itself listed `blocks_customer_delivery: false`.

First task:
Prepare a Codex investigation-first prompt, not a broad patch, to trace `INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION` and rent-roll source selection:
1. where `$21,744,000` comes from;
2. whether it renders in customer HTML/PDF;
3. why source reconciliation still chooses `computedRentRoll.total_in_place_annual = 961,200`;
4. whether trusted summary total `1,962,456` should actually win or whether row-derived in-place is the coherent source;
5. why delivery gate makes `INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION` a customer blocker;
6. what class-level fix/tests are needed.

Do not run another live test first.
Do not weaken deterministic QA.
Do not remove the rent-roll contradiction contract.
Do not turn public-sample blockers into customer blockers.
Do not let Codex make a fixture-only Maplewell patch.

Also remember two backlog items to preserve:
- Run a focused repo-wide source-of-truth audit before Ken/public samples.
- Later eliminate manual worker kick using `analysis_jobs` and non-blocking dashboard polling; avoid generic `report_jobs` and avoid raw INSERT webhook if files/artifacts may not be ready.
```

---

# May 14, 2026 Critical Doctrine Update 2 - Core Input Sufficiency Contract / Publish, Collapse, Disclose

## Why this update matters
- This doctrine was locked immediately after the May 14 autonomous publication doctrine update.
- The user clarified a launch-critical product rule: InvestorIQ must not fail or route 99.999% of reports to Admin Review just because a few inputs are missing.
- The system must work backwards from the minimum verified data needed to produce a defensible paid report.
- The correct question is not: `Is the source package perfect?`
- The correct question is: `Do we have enough verified core data to produce a defensible report, while collapsing or disclosing unsupported sections?`
- This is critical because InvestorIQ is a SaaS underwriting product, not a manual underwriting service disguised as software.

## Locked operating rule

```text
If required core docs are usable, the report publishes.
If a specific section lacks required inputs, that section collapses or renders clean limitation language.
If source docs contain minor or explainable variance, the report publishes with disclosure.
If optional or enrichment data is missing, the report does not fail.
If core docs are missing, unreadable, non-validated, or violently contradictory beyond safe disclosure, the report fails closed / asks for new documents / routes to rare review.
Manual review must remain the exception, not the operating model.
```

## Three-tier data model
InvestorIQ V1 should classify input sufficiency into three tiers:

### 1. Must-have core data
Without this, the report is not defensible and should not publish.

### 2. Section-required data
Without this, only the affected section collapses or renders a clean source limitation.

### 3. Optional / enrichment data
Without this, nothing fails. The report is simply less deep.

This prevents both failure modes:
- publishing garbage from unusable documents;
- failing or reviewing nearly every report because one optional field is missing.

## T12 Core Sufficiency Contract
For Screening and Full Underwriting, the T12 must support a defensible core income statement.

### Absolute must-have T12 values
A T12 is sufficient for core report publication when it supports:
- Effective Gross Income, or enough income lines to derive it;
- Total Operating Expenses, or enough expense lines to derive it;
- Net Operating Income, or enough values to validate the equation:
  - `Effective Gross Income - Operating Expenses = NOI`.

### Preferred but not whole-report-failing T12 values
These enrich the report but should not fail the whole report if missing:
- Gross Potential Rent / Gross Scheduled Rent;
- vacancy / concessions / credit loss;
- other income;
- expense line-item detail;
- property taxes;
- insurance;
- utilities;
- repairs and maintenance;
- management / payroll / admin.

### T12 publish / collapse rules
- If EGI, OpEx, and NOI validate, the report can publish.
- If detailed expense lines are missing, do not fail the report. Collapse detailed expense-driver sections or disclose lump-sum / limited-detail T12.
- If GPR is missing but EGI/OpEx/NOI validate, do not fail the report. Collapse or disclose T12-GPR reconciliation where required.
- If property taxes are missing as a line item, do not fail the report. Suppress property-tax-specific insight unless another validated property-tax source exists.

### T12 fail-closed / intervention rules
A T12 should fail only when:
- no usable income / expense / NOI structure exists;
- NOI equation does not reconcile within tolerance;
- values are impossible or nonsensical;
- the file is unreadable or unparseable;
- the T12 appears to belong to a different asset or wildly different scale than the rent roll and cannot be safely disclosed.

## Rent Roll Core Sufficiency Contract
For Screening and Full Underwriting, the rent roll must support the property rent base.

### Absolute must-have rent roll values
A rent roll is sufficient for core report publication when it supports:
- total units;
- in-place rent, either by unit rows or trusted summary total;
- occupancy, either by unit status, occupied/vacant counts, or trusted summary;
- enough unit or summary structure to establish annual in-place rent.

### Preferred but not whole-report-failing rent roll values
These enrich the report but should not fail the whole report if missing:
- unit type / bedroom mix;
- market rent;
- unit status detail;
- vacant unit detail;
- square footage;
- lease dates;
- tenant names, though not necessary for V1;
- summary totals.

### Rent roll publish / collapse rules
- If total units, occupancy, and annual in-place rent can be verified, the report can publish.
- If unit mix is missing, collapse Unit Mix.
- If market rent is missing, collapse rent-gap / value-add analysis.
- If lease dates are missing, collapse rollover / lease-expiry analysis.
- If square footage is missing, collapse rent-per-square-foot analysis.
- If only summary totals exist, publish a summary-driven report and disclose limited unit-level detail.
- If only partial unit rows exist but trusted summary totals exist, suppress full-property metrics derived only from sample rows and use validated summary totals where safe.

### Rent roll fail-closed / intervention rules
A rent roll should fail only when:
- no usable unit count or trusted summary unit count exists;
- no usable in-place rent total or unit-level rent base exists;
- occupancy cannot be inferred at all;
- the file is unreadable or unparseable;
- the rent roll clearly belongs to a different property or wildly different scale than the T12;
- the data is so sparse that publishing would create fake confidence.

## Underwriting Section Sufficiency Contract
Full Underwriting should not fail just because optional underwriting support is incomplete.

### Current debt / refinance
- No true current debt balance: do not fail report. Current Debt DSCR is `Not assessed` with clean limitation language.
- No current debt service: do not fail report. Current Debt DSCR collapses or renders `Not assessed`.
- No current debt support: do not render refinance proceeds, refinance stability, shortfall, stress, or sufficiency as if true current debt exists.
- True current debt exists and validates: render current debt DSCR and related sections consistently.

### Acquisition financing
- No acquisition loan term sheet / purchase assumptions: do not fail report. Proposed Acquisition Debt Sizing collapses.
- Proposed/acquisition debt must not be treated as current outstanding debt.

### Cap rate / valuation / appraisal
- Missing cap rate or appraisal support should not fail report.
- Use framework sensitivity where safe or disclose missing valuation/refinance inputs.
- Do not claim appraised value unless validated appraisal evidence exists.

### Renovation / CapEx
- Missing structured renovation budget: do not fail report. Renovation Strategy collapses or renders source-constrained note.
- Renovation budget exists but no rent lift / timing / ROI support: show budget/scope only; do not model ROI, payback, timing, or rent lift.

### Property tax / insurance / other support
- Missing property tax support should not fail report.
- Do not render tax-specific variance insight unless validated source value exists.

## Customer delivery decision tree

```text
Step 1: Are required core docs present?
Screening: T12 + Rent Roll.
Full Underwriting: T12 + Rent Roll + at least one supporting doc.
If no: user_needs_documents / fail closed / credit restored.

Step 2: Are required core docs usable?
T12 must validate core income statement.
Rent Roll must validate unit/rent/occupancy base.
If no: fail closed / credit restored.

Step 3: Do core docs violently contradict each other?
If severe and unsafe to disclose: admin review or fail closed.
If moderate/minor and document-supported: publish with disclosure.

Step 4: For each optional section, are section-specific inputs present?
If yes: render.
If no: collapse or disclose.

Step 5: Did the renderer create a contradiction, stale value, placeholder, internal language, or unsupported claim?
If yes: admin review / system bug / code fix. This should be rare and fixed as a class.

Step 6: Is this only a public/Ken/sample issue?
If yes: customer delivery still publishes. Public/high-value outreach remains blocked.
```

## What must never happen
- Missing one optional number must not fail the whole report.
- Missing one optional document must not create Admin Review.
- Minor source variance must not create Admin Review when it can be safely disclosed.
- Public sample blocker must not become customer blocker.
- DocRaptor test mode must not become customer blocker.
- Missing optional section inputs must not become `admin_review_required`.
- Generic source limitation wording must not become `admin_review_required` without explicit customer-delivery impact.

## Correct output behavior examples
- Missing refinance cap rate: collapse/refuse refinance classification; disclose missing refinance inputs.
- Missing structured renovation budget: collapse Renovation Strategy or disclose no structured CapEx.
- Missing acquisition financing terms: do not model acquisition financing.
- Missing debt balance with usable T12/Rent Roll: Current Debt DSCR is `Not assessed`.
- Minor rent roll vs T12 variance: publish with disclosure unless severe or renderer contradicts canonical value.
- Missing market rent: collapse rent gap / value-add analysis.
- Missing unit mix: collapse unit mix analysis.
- Missing lease dates: collapse rollover analysis.

## Implementation doctrine for Codex
Codex should implement a formal Core Input Sufficiency Contract, not another report-specific patch.

Required classification buckets:
- `core_sufficient_publishable`
- `section_constrained_publishable`
- `disclose_only_publishable`
- `public_or_outreach_only_blocker`
- `user_needs_documents`
- `admin_review_required`
- `system_contract_failure`

Critical principle:
- Customer delivery should be blocked only by explicit customer-delivery blockers.
- Missing optional section data should affect only that section.
- Admin Review must remain rare.

## Latest Codex receipt from renderer/admin-review audit
Codex reported the following after the latest renderer/admin-review prompt:
- No additional code files changed in that pass.
- The current branch already contains the renderer/QA updates; Codex audited and re-validated them.
- The live `-48.0%` issue was classified as a renderer wiring issue, and the current branch now centralizes the display through `formatSourceReconciliationVariance(...)`.
- `buildScreeningIncomeForensicsHtml(...)` and `buildScreeningNoiStabilityHtml(...)` now use canonical reconciliation state.
- The live handler passes `sourceReconciliationState` into both builders and the coverage summary path.
- `buildDeliveryGateDecision()` is the only final gate that emits `admin_review_required`.
- Codex reported current delivery doctrine compliance:
  - ordinary source limitations do not become admin review;
  - section-level missing optional inputs collapse or disclose instead of creating a customer hold;
  - customer blockers remain limited to explicit high-risk or system-failure classes;
  - public/high-value outreach can be stricter without blocking private customer delivery.
- Live PDF verification remains the last end-to-end check.

## Next Codex task - Core Input Sufficiency Contract implementation
Use Codex to audit and implement the formal sufficiency tiers across source coverage, report contract, QA action plan, and delivery gate.

First-priority implementation target:
- Make T12 core sufficiency, Rent Roll core sufficiency, and optional section sufficiency explicit machine-readable contracts.
- Ensure delivery gates read those contracts rather than scattered warnings, missing-detail flags, or section-depth heuristics.
- Ensure clean-ish packages publish autonomously with collapsed sections/disclosures instead of Admin Review.

## Fresh chat brief - May 14 Core Sufficiency Doctrine Locked

```text
We are continuing InvestorIQ from the May 14 master-context update.

Critical doctrine now locked:
InvestorIQ must not become a manual-review factory and must not fail/review 99.999% of reports just because some optional inputs are missing.

Core operating rule:
- If required core docs are usable, the report publishes.
- If a specific section lacks required inputs, that section collapses or renders a clean limitation.
- If source docs contain minor/explainable variance, the report publishes with disclosure.
- If optional/enrichment data is missing, nothing fails; the report is simply less deep.
- Customer delivery should be blocked only by missing/unusable required core docs, severe source contradiction beyond safe disclosure, or system/report-contract failure.

T12 must-have:
- Effective Gross Income or enough income lines to derive it.
- Total Operating Expenses or enough expense lines to derive it.
- NOI or enough values to validate EGI - OpEx = NOI.

Rent Roll must-have:
- total units;
- in-place rent by unit rows or trusted summary;
- occupancy by status/counts/summary;
- enough structure to establish annual in-place rent.

Missing optional detail should collapse/disclose, not fail:
- missing expense line items;
- missing market rent;
- missing unit mix;
- missing lease dates;
- missing cap rate/appraisal support;
- missing renovation budget;
- missing current debt balance;
- missing acquisition financing.

Latest Codex audit says:
- current branch already contains the source-reconciliation renderer/QA updates;
- the live handler passes `sourceReconciliationState` into the audited builders;
- `buildDeliveryGateDecision()` is the only final gate emitting `admin_review_required`;
- ordinary source limitations and section-level optional missing inputs are not currently supposed to become customer holds;
- live PDF verification remains the final check.

Next task:
Prepare and run a Codex prompt to implement a formal Core Input Sufficiency Contract across source coverage, QA action plan, and delivery gate. The goal is to make T12/Rent Roll core sufficiency and section-level sufficiency explicit so reports publish autonomously whenever core data is defensible, while optional missing details collapse/disclose.
```

---

# May 14, 2026 Critical Doctrine Update - Autonomous Customer Publication / Manual Review Must Be Exception Only

## Why this update matters
- This doctrine was locked after the true-current-debt Maplewell / `01_true_current_debt_underwriting` hardcore testing lane repeatedly exposed the same business-critical risk: source limitations and renderer bugs can drift into Admin Review too easily if delivery gates are not explicitly classified.
- The user made the operating requirement explicit: InvestorIQ cannot require Rob to manually review dozens of reports per day. That would destroy the business model.
- Manual review must be the exception, not the operating model.
- Codex must not keep turning every source limitation into `admin_review_required`.
- The product standard is autonomous publication for reasonably complete, defensible customer packages, with clean disclosures and section collapse where appropriate.

## Locked customer-publication doctrine
InvestorIQ V1 must follow this rule:

```text
If core docs are usable, the report publishes.
If a specific section lacks required inputs, that section collapses or renders a clean limitation.
If source docs contain a minor or explainable variance, the report publishes with disclosure.
If the system itself creates a contradiction, stale value, placeholder, broken table, wrong math, or renderer mismatch, that is a system bug and deterministic QA should catch it before production.
Manual review should be rare.
```

## What should publish
- Clean Screening packages with usable T12 and Rent Roll should publish.
- Clean Full Underwriting packages with usable T12, Rent Roll, and at least one support document should publish.
- True-current-debt underwriting packages should publish when true current balance/service/rate/amortization are verified and the rendered report is internally consistent.
- Acquisition-financing-only underwriting packages should publish with current-debt/refi limitation language and separate Proposed Acquisition Debt Sizing.
- Minor rent roll vs T12 variance should publish with clear disclosure, not Admin Review, unless the variance is severe enough to suggest wrong-file / wrong-property / parser-integrity risk.
- Missing optional inputs should collapse only the affected section or render a clear limitation.

## What should collapse or disclose instead of failing the report
- Missing refinance cap rate / valuation support:
  - Do not fail the report.
  - Collapse or constrain refinance classification / valuation sensitivity as needed.
  - Disclose missing refinance inputs.
- Missing structured renovation budget:
  - Do not fail the report.
  - Collapse Renovation Strategy or render source-constrained note.
  - Do not model rent lift, ROI, payback, scope, or timing without structured support.
- Missing acquisition loan term sheet:
  - Do not fail the report.
  - Do not model acquisition financing.
- Missing true current debt balance while T12/Rent Roll are usable:
  - Do not fail the report.
  - Current-debt DSCR is `Not assessed` with clean limitation language.
  - No refinance proceeds/stress/classification output should render as if true current debt exists.
- Missing line-item detail within an otherwise valid core T12:
  - Do not fail the report.
  - Render lump-sum / limited-detail T12 disclosure and suppress line-item detail sections as needed.
- Missing source fields for a specific table/card:
  - Do not fail the report.
  - Suppress that card/table/section or disclose the limitation.

## What should fail closed or require intervention
Customer delivery should be blocked only by true customer-delivery blockers:

1. Missing required core source package
   - Example: no usable T12 for a report requiring T12.
   - Example: no usable Rent Roll for a report requiring Rent Roll.

2. Core docs are unreadable or essentially unusable
   - Example: ripped/scanned/garbled documents where the system cannot verify required core values.
   - Example: parser confidence/validation cannot establish defensible T12 or rent-roll artifacts.

3. Severe source-package contradiction beyond safe disclosure
   - Example: T12 and Rent Roll appear to describe materially different properties.
   - Example: 48-unit rent roll paired with a T12 scale that implies a totally different asset class and cannot be institutionally disclosed as ordinary variance.

4. System-generated report contract failure
   - Example: canonical artifact says +6.1% but rendered PDF says -48.0%.
   - Example: stale placeholder in Deal Scorecard when computed DSCR exists.
   - Example: current-debt/refi analysis rendered without true current-debt support.
   - Example: broken table, internal/debug language, public AI/vendor language, template token, mojibake, `DATA NOT AVAILABLE`, `undefined`, `NaN`, or inconsistent DSCR values across sections.

5. Public/Ken/high-value sample readiness blocker
   - These may block public sample / Ken outreach without blocking private customer delivery.
   - Examples: DocRaptor test mode, public-sample polish issue, high-value outreach review, unresolved but disclosed source variance.

## Delivery-gate hierarchy doctrine
- Private customer delivery, public sample readiness, and high-value outreach readiness are separate decisions.
- Public/high-value standards can be stricter than private customer delivery.
- A public-sample blocker must not automatically become a customer-delivery blocker.
- A source limitation must not automatically become `admin_review_required`.
- `admin_review_required` should be reserved for real customer-delivery blockers or system/report-contract failures.
- `user_needs_documents` should be reserved for explicitly missing/unusable required core documents or explicit customer-blocking source status.
- Disclose-only source reconciliation should remain customer-deliverable.

## Important May 14 class fixes already completed or in progress
1. `formatMultiple is not defined` true-current-debt runtime crash
   - Root cause: `report-surface-contracts.js` called `formatMultiple()` without local definition/import.
   - Fixed with local helper and true-current-debt regression.

2. Report publication storage-path invariant
   - Root cause: `reports.insert()` could run with `storage_path = null` / placeholder before a real storage path existed.
   - Fixed by computing and validating storage path before upload/insert.
   - `reports` row cannot be created without valid non-empty PDF storage path.

3. Delivery Gate keyword-guessing removal
   - Root cause: codes containing words like `REQUIRED`, `MISSING`, or `FAILED` were being overclassified as customer blockers.
   - Fixed with explicit delivery-impact classifier.
   - Customer delivery now depends on explicit fields such as `blocks_customer_delivery`, `customer_delivery_blocker`, `classification: missing_required_source`, `customer_delivery_impact: block`, or `qa_status: needs_documents/failed`.
   - Disclose-only and public-only flags remain customer-deliverable.

4. Delivery-impact normalization
   - `customer_delivery_impact` is normalized for values such as `BLOCK`, `blocked`, `customer_blocked`, `customer_delivery_blocked`, and `customer_delivery_blocker`.
   - Non-blocking values such as `disclose_only`, `public_only`, `review_only`, `advisory_only`, `none`, empty, or null remain non-blocking.

5. Rendered source-reconciliation variance contract
   - Root issue: canonical source reconciliation could say +6.08% while rendered PDF showed -48.0%.
   - Report Contract QA now deterministically flags `RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH` when rendered Rent Roll vs T12 variance does not match canonical `sourceReconciliationState.variance_pct`.
   - This contract must remain customer-blocking because it is a system-generated numeric contradiction, not an ordinary source limitation.
   - Current live retest showed the contract worked and blocked the bad render before customer delivery, but the renderer live callsite still needs to be fixed so the PDF emits +6.1%, not -48.0%.

## Current immediate live issue after May 14 retest
- `01_true_current_debt_underwriting_RETEST 2` is Under Review because Report Contract QA correctly found:
  - `RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH`
- Canonical truth:
  - `rr_annual_in_place = 1,962,456`
  - `t12_gpr = 1,850,000`
  - `variance_pct = 0.06078702702702703` / approximately `+6.1%`
- Rendered bad output still contains:
  - `Rent Roll vs T12 GPR Variance -48.0%`
  - `Rent roll annualized rent is -48.0% vs T12 GPR`
- Interpretation:
  - The QA contract is working.
  - The delivery gate is working.
  - The remaining problem is a renderer live-path wiring gap: some production callsite still calculates/prints the old `-48.0%` value instead of using canonical `sourceReconciliationState.variance_pct`.
- Next Codex task should fix the renderer wiring, not weaken QA or Delivery Gate.

## Codex / assistant operating rule going forward
- Do not patch one report.
- Patch failure classes.
- Do not weaken deterministic QA to make reports publish.
- Make the renderer/parser/gate produce the correct customer-deliverable outcome.
- Never allow Codex to solve review floods by simply lowering severity or removing blockers.
- If a report goes to Admin Review, first classify:
  1. true missing/unusable core docs
  2. severe source contradiction
  3. system/render/contract bug
  4. public-only blocker
  5. gate overpromotion
  6. valid disclose-only source limitation
- If it is a public-only blocker or disclose-only limitation, customer delivery should remain eligible.
- If it is a renderer/system bug, fix the code/test class so it does not hit customer jobs again.

## Fresh chat brief - May 14 publication doctrine locked

```text
We are continuing InvestorIQ from the May 14 master-context update.

Critical doctrine now locked:
InvestorIQ must not become a manual-review factory. Manual review must be the exception, not the operating model. Codex must not keep turning every source limitation into `admin_review_required`, because that would destroy the business model.

Customer-publication doctrine:
- If core docs are usable, the report publishes.
- If a specific section lacks required inputs, that section collapses or renders a clean limitation.
- If source docs contain a minor/explainable variance, the report publishes with disclosure.
- If optional inputs are missing, only the affected section collapses.
- Missing true current debt does not fail the report; current-debt DSCR is Not assessed with clean limitation language.
- Missing renovation detail does not fail the report; Renovation Strategy collapses or discloses no structured CapEx.
- Missing refinance inputs do not fail the report; refinance classification/capacity collapses or discloses missing inputs.
- Public/Ken/high-value sample readiness can be stricter than private customer delivery.

Customer delivery should be blocked only by:
1. missing/unusable required core docs,
2. severe source-package contradiction beyond safe disclosure,
3. system-generated report-contract failure,
4. prohibited/internal/public-language/template/placeholder/math/render contradiction.

Recent May 14 class fixes:
- `formatMultiple is not defined` true-current-debt crash fixed.
- report publication storage-path invariant fixed.
- Delivery Gate keyword guessing removed.
- Delivery-impact normalization added.
- deterministic rendered source-reconciliation variance contract added.

Current immediate issue:
`01_true_current_debt_underwriting_RETEST 2` is Under Review because the new Report Contract QA correctly caught `RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH`.
Canonical source reconciliation says approximately `+6.1%`, but the live rendered report still says `-48.0%`.
This is not a source-doc issue and not a reason to weaken the gate. It is a renderer live-path wiring bug.

Next task:
Use Codex to fix the renderer wiring so every live rendered Rent Roll vs T12 variance surface uses canonical `sourceReconciliationState.variance_pct`, not stale local math. Keep the deterministic QA mismatch contract customer-blocking. After patch, run `qa:launch-core`, deploy, and rerun only the true-current-debt test.
```

---

# May 13, 2026 Final Late Update - Forest City FINAL 6 Published / Launch Gates Added / Canonical Contracts Mostly Validated

## Summary
- Forest City Manor FINAL 6 successfully published as a 16-page Full Underwriting report after the May 13 canonical-contract hardening and system-wide QA/preflight work.
- This was a major breakthrough after repeated whack-a-mole failures.
- The system no longer failed at renderer/runtime scope level during this validation.
- Core underwriting logic held.
- The PDF is private-beta customer deliverable.
- It is not yet Ken/public-sample ready because remaining blockers are QA false-positive/report-contract calibration and DocRaptor production mode.

## Live validation result - Forest City Manor FINAL 6
- Report type: Full Underwriting.
- Uploaded package:
  - T12
  - Rent Roll
  - BrokerEmail
  - PurchaseAssumptions
  - RenovationBudget
- Result: published.
- PDF length: 16 pages.
- Cover metrics:
  - 144 units
  - NOI $1,723,435
  - Expense Ratio 31.5%
  - NOI Margin 68.5%
  - Classification: Review
- T12 / Rent Roll reconciliation was aligned:
  - Rent Roll vs T12 GPR variance: 0.0%
- No renderer crash occurred.
- No `Current￾debt DSCR` hidden/control/mojibake issue appeared in the PDF.

## Canonical contracts validated by Forest City FINAL 6
1. Current debt / acquisition financing separation:
   - Proposed acquisition financing rendered separately.
   - Derived acquisition loan amount was not treated as current outstanding debt.
   - Current Debt DSCR remained Not assessed.
   - Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified.
   - No constrained/stressed/insufficient/shortfall refinance proceeds language rendered when refinance was not assessed.
2. Refinance Stability:
   - Rendered as Not Assessed.
   - Limitation language was clean and institutional.
   - Double-period bug was removed.
3. Debt Structure:
   - Proposed Acquisition Debt Sizing rendered clearly:
     - Purchase Price $34,500,000
     - Documented LTV 85.0%
     - Derived Acquisition Loan Amount $29,325,000
     - Interest Rate 3.80%
     - Amortization 40 years
     - Going-In Cap Rate 5.0%
     - Closing Costs 1.5%
     - Estimated Annual Debt Service $1,427,259
     - Proposed Acquisition DSCR 1.21x
   - Section correctly states this is not current outstanding debt and not used as a current refinance balance.
4. Empty table collapse:
   - Prior empty Top Positive Income Lines table no longer renders.
   - Operating Profile now shows only populated Top Expense Drivers.
5. Renovation rendering:
   - No `Unit Count $40`.
   - Unit Count renders as integer.
   - Per Unit Cost renders as currency.
   - Blank all-empty renovation columns are removed.
   - Return impact is not calculated without document-supported rent lift, timing, and cost recovery assumptions.
6. DCF/scenario attribution:
   - Scenario and DCF use clean attribution labels.
   - Exit cap is document-derived.
   - NOI growth and discount rate are standardized framework assumptions.
   - Unsupported “stated” language did not appear.
7. Support-doc taxonomy:
   - Source Coverage QA now shows semantic/display labels:
     - BrokerEmail.pdf -> display_doc_type broker_email
     - PurchaseAssumptions.pdf -> display_doc_type purchase_assumptions
     - RenovationBudget.docx -> display_doc_type renovation_budget
   - Raw doc_type residue may still exist internally for traceability, but downstream semantic/display labels are correct.
8. Source Coverage QA:
   - Passed.
   - T12 and rent roll core coverage were 100%.
   - Acquisition assumptions were validated/supported and separated from current debt.
9. QA Manager:
   - No longer blocks supported acquisition assumptions.
   - Proposed Acquisition DSCR concern is now correctly treated as false positive / no-action.
10. Delivery gate:
   - Customer delivery is eligible.
   - Customer publish blockers are empty.
   - Public sample and high-value outreach remain blocked by public-sample blockers only.

## Remaining issues after Forest City FINAL 6
1. Report Contract QA false positive:
   - Artifact flagged `TOP_EXPENSE_DRIVERS_EMPTY_TABLE`.
   - The PDF visibly contains populated Top Expense Drivers rows, so this appears to be a report-contract QA regex / excerpt false positive, not an actual PDF rendering failure.
   - Classification: QA false positive / report-contract calibration issue.
   - Customer delivery: not blocked.
   - Public sample/high-value outreach: blocked until fixed.
2. DocRaptor production mode:
   - `DOCRAPTOR_NOT_PRODUCTION_MODE` remains expected while DocRaptor is in test mode.
   - Classification: production config only.
   - Customer/private beta: acceptable.
   - Public/Ken sample: blocked until production PDF mode is enabled and verified.
3. Upstream diagnostic residue:
   - AI support-doc diagnostics may still show PurchaseAssumptions initially/detected as appraisal before semantic correction.
   - Downstream semantic/display role is correct, so this is not currently a customer-facing blocker.
   - Watch later, but do not reopen broad taxonomy unless it leaks into customer/public output or QA false blockers.

## Runtime / whack-a-mole hardening completed today
The repeated live renderer ReferenceErrors were recognized as one systemic class, not isolated bugs:
- `rrVsGprPct is not defined`
- `sourceReportCoverageQa is not defined`
- `mortgagePayload is not defined`

Fixes completed:
- Added ordered renderer canonical-state helper:
  - `buildRendererCanonicalState(...)`
- Helper now builds:
  - currentDebtAssessmentState
  - sourceReportCoverageQa
  - sourceReconciliationState
  - sectionEligibility
- Added/extended focused renderer smoke tests to execute canonical state and helper paths.
- `buildScreeningDataCoverageSummary()` was made explicit-input safe by passing `mortgagePayload` and `loanTermSheetTermsPayload` instead of relying on hidden outer scope.
- Added ESLint no-undef renderer scope guard:
  - `eslint.renderer-scope.cjs`
  - package script: `qa:renderer-scope`
- `qa:renderer-scope` catches the repeated ReferenceError class before live testing.

## System-wide QA/preflight gates added
New package scripts added:
- `qa:renderer`
- `qa:contracts`
- `qa:sources`
- `qa:support-docs`
- `qa:renovation`
- `qa:messaging`
- `qa:diff-check`
- `qa:launch-core`
- `qa:parsers`
- `qa:recovery`
- `qa:routing`
- `qa:full`

New rule:
- Before routine live regeneration:
  - `npm run qa:launch-core`
  - `git status`
- Before Ken Dunn, public samples, or release-candidate validation:
  - `npm run qa:full`
  - `git status`

`qa:launch-core` includes:
- renderer scope/runtime checks
- report contract checks
- source coverage checks
- QA action / manager checks
- support-doc taxonomy checks
- renovation rendering checks
- failed-state messaging checks
- frontend build
- diff check

`qa:full` includes `qa:launch-core` plus:
- parser tests
- recovery tests
- routing tests

Doctrine:
- No more live tests as QA discovery.
- Live tests are validation only.
- Local contract gates catch preventable failures first.

## Latest product-readiness classification
- Private beta customer deliverable: YES.
- Full Underwriting core logic: materially green for acquisition-only/no-true-current-debt lane.
- Canonical contracts: mostly validated.
- Ken/public-sample ready: NO.
- Remaining blockers before Ken/public sample:
  1. Fix `TOP_EXPENSE_DRIVERS_EMPTY_TABLE` QA false positive / report-contract calibration.
  2. Flip and verify DocRaptor production mode.
  3. Regenerate a clean public-candidate sample with clean property name and clean filenames.
  4. Run `npm run qa:full` before final Ken/public sample validation.

## Next immediate action
Do not run another broad test batch.
Do not reopen whack-a-mole patching.
The next likely Codex task should be a narrow report-contract QA calibration for the `TOP_EXPENSE_DRIVERS_EMPTY_TABLE` false positive:
- The PDF visibly contains populated Top Expense Drivers.
- Report Contract QA evidence excerpt was only `Top `.
- Fix should target QA detection/excerpt scoping, not renderer output, unless file truth proves otherwise.
- Then run `npm run qa:launch-core`.
- After that, one regeneration only if needed.

## Fresh chat brief to include
Add this fresh chat prompt after the update:

```text
We are continuing InvestorIQ from the May 13 final late master context.

Current state:
- Forest City Manor FINAL 6 published as a 16-page Full Underwriting report.
- Core canonical contracts mostly validated.
- Acquisition financing stayed separate from current debt.
- Current Debt DSCR remained Not assessed.
- No fake refinance stress/proceeds language appeared.
- Empty Top Positive Income Lines table was gone.
- Renovation formatting improved.
- DCF/scenario attribution labels were clean.
- Support-doc semantic display labels worked.
- Source Coverage QA passed.
- QA Manager no longer blocked supported acquisition assumptions.
- Delivery gate marked customer delivery eligible.

Major system-wide guardrails added:
- `qa:renderer-scope`
- `qa:launch-core`
- `qa:full`
- New rule: live tests are validation only, not QA discovery.

Remaining blockers:
1. Report Contract QA false positive:
   - `TOP_EXPENSE_DRIVERS_EMPTY_TABLE`
   - PDF visibly contains populated Top Expense Drivers rows, so likely QA regex/excerpt false positive.
   - Customer delivery is not blocked.
   - Public/Ken/high-value outreach remains blocked.
2. DocRaptor production mode:
   - still in test mode.
   - production config only.
   - public/Ken sample blocked until enabled and verified.

First task in the new chat:
Do not run a live test first.
Do not patch broadly.
Prepare a narrow Codex prompt to investigate and fix the `TOP_EXPENSE_DRIVERS_EMPTY_TABLE` false positive system-wide in Report Contract QA. It should inspect whether the QA table detector is overmatching `Top Expense Drivers` despite populated rows, fix the detection/excerpt scoping, and add a focused regression test. It should not change renderer output unless investigation proves the PDF actually contains a header-only table.
```

# May 13, 2026 Late Update - Canonical Contract Batch Committed / Ready for One Live Underwriting Validation

## Fresh Chat Brief - May 13 Canonical Contracts Complete

Use this prompt to start the next chat:

```text
We are continuing InvestorIQ from the updated May 13 master context. The first action in this chat is a single live Full Underwriting validation test. Do not patch first. Do not run multiple tests. Do not start with new Codex prompts unless the live test result gives us a specific failure class.

Current checkpoint:
- The systemic reliability / whack-a-mole crisis was investigated at repo level.
- Codex identified the recurring failure mechanism as insufficient canonical contracts, not isolated report bugs.
- We stopped smoke-test theatre and implemented canonical contracts in four controlled batches, then committed them.
- Commit checkpoint: `02942c3 updates` on `main`.
- Working tree is clean.
- Final static audit found the canonical contracts wired through the main paths and no obvious new `ReferenceError` class.
- Decision from final audit: ready for one live Full Underwriting validation.

Canonical contract work completed:
1. Final customer-output sanitation contract
   - `sanitizeFinalCustomerHtml()` is used at the customer HTML boundary.
   - Final HTML going into QA / DocRaptor is sanitized for hidden/control characters, zero-width chars, replacement chars, U+FFFE/U+FFFF, soft hyphen, C0/C1 controls, and common mojibake sequences.
   - Report Contract QA now inspects the same sanitized HTML surface.
   - Purpose: stop `Current￾debt DSCR` / hidden-character variants from bypassing QA.

2. Current debt / acquisition debt semantic state
   - `buildCurrentDebtAssessmentState()` now drives current-debt state.
   - State distinguishes true current debt, current debt service, proposed acquisition financing, current debt DSCR computed vs not assessed, and reason codes.
   - Reason codes include `no_current_debt_document`, `no_current_outstanding_balance`, `incomplete_current_debt_terms`, and `acquisition_only_not_current_debt`.
   - Renderer and QA now use semantic state for Current Debt DSCR, Data Coverage, Deal Scorecard, Risk Register, Debt Structure, and acquisition financing separation.
   - Phrase checks still exist only as legacy fallback when semantic state is absent.
   - Purpose: stop fixing current-debt/refi wording variants one phrase at a time.

3. Source reconciliation semantic state
   - `buildSourceReconciliationState()` now governs rent-roll vs T12 GPR/in-place rent variance.
   - State includes annual rent, T12 GPR, variance pct, status, customer delivery impact, public/outreach impact, and disclosure language.
   - Statuses include `aligned`, `source_reconciliation_required`, `parser_suspected`, and `insufficient_inputs`.
   - Customer language must remain institutional: `InvestorIQ has not reconciled this variance and does not infer the cause.`
   - Purpose: stop local rent-roll/T12 variance math and inconsistent reconciliation wording.

4. Full Underwriting section eligibility contract
   - `buildFullUnderwritingSectionEligibility()` now centralizes major section eligibility and source-constrained / rendered / underused state.
   - Used by renderer and Source Coverage QA.
   - Missing debt/refi sections should be source-constrained when no true current debt source exists, not treated as report underdevelopment.
   - Purpose: stop inconsistent Full Underwriting depth warnings based on scattered section heuristics.

5. Support-doc taxonomy contract
   - `parse-doc.js` now attaches semantic metadata to support-doc payloads:
     - `semantic_doc_role`
     - `semantic_doc_role_confidence`
     - `semantic_doc_role_reason`
     - `semantic_doc_family`
   - Roles include `purchase_assumptions`, `appraisal`, `current_mortgage_statement`, `loan_term_sheet`, `broker_email`, `renovation_budget`, `property_tax`, and `other_support`.
   - Source Coverage QA and Source Package QA read semantic roles.
   - Purchase assumptions should support acquisition financing without masquerading as appraisal unless actual appraisal evidence exists.
   - Broker emails should not become loan term sheets unless actual loan-term signals exist.

6. DCF/scenario assumption attribution contract
   - Added canonical attribution labels:
     - `document_derived`
     - `user_provided`
     - `standardized_framework`
     - `unavailable`
   - Renderer should no longer label framework defaults as `stated` unless explicitly source-provided.

7. Renovation metric formatting contract
   - Renovation execution rows now use metric-kind-aware formatting.
   - `unit_count` renders as integer, not currency.
   - `per_unit_cost` and `total_budget` render as currency.
   - Rows are deduped by metric kind plus value.
   - Purpose: stop `Unit Count $40` and duplicate Unit Count / Per Unit Cost rows.

8. System failure entitlement restore guarantee
   - `REPORT_GENERATION_FAILED` now routes through a shared restore helper in `api/admin-run-worker.js`.
   - Restore writes Dashboard-compatible `worker_event` with `payload.event = entitlement_restored`.
   - Helper is idempotent and checks existing `entitlement_restored` before restoring.
   - If purchase is already restored/unconsumed but signal is missing, the worker writes the signal without double-crediting.
   - If event write fails, it retries once.
   - `analysis_jobs.purchase_id` is cleared only after the restore signal is successfully written.
   - Purpose: Dashboard can confidently show `Generation failed - credit restored` when backend restoration actually occurred.

Important recent runtime truth:
- A previous live Forest City test failed with `ReferenceError: rrVsGprPct is not defined` in `api/generate-client-report.js`.
- Vercel logs proved this was a renderer runtime bug, not source documents, DocRaptor, or Supabase.
- Codex fixed the scope issue by defining `rrVsGprPct` in the correct outer scope.
- A later Forest City FINAL 2 test published, but still exposed systemic report-quality issues before the canonical contract batches:
  - hidden/control character path
  - unsupported refi-constrained wording when current refi was not assessed
  - support-doc classification confusion
  - renovation Unit Count formatting/duplication
  - DCF assumptions labelled `stated` when likely framework assumptions
- Those classes are exactly what the canonical contract batches were designed to fix.

Current no-test / test rule:
- The user explicitly does not want more smoke-test theatre.
- Do not ask Codex to run broad smoke tests.
- Do not run multiple live tests.
- The next action is exactly one controlled live Full Underwriting validation.

First live test to run:
- Full Underwriting
- Same strong package: Forest City Manor FINAL / Forest City Manor FINAL 3 or similar clean new name
- Include:
  - T12
  - Rent Roll
  - Purchase assumptions / acquisition financing support
  - Renovation budget
  - Broker/supporting document

After it finishes, inspect only these things first:
1. Did it publish?
2. Does the PDF contain `Current￾debt DSCR` or any hidden/mojibake/control characters?
3. Does Current Debt DSCR show Not Assessed cleanly when no true current debt balance exists?
4. Does proposed acquisition financing stay separate from current debt/refi?
5. Does the report avoid saying refinance proceeds are constrained/stressed/insufficient when refinance was not assessed?
6. Does rent-roll/T12 reconciliation wording look institutional and source-constrained if applicable?
7. Does support-doc classification look sane, especially PurchaseAssumptions and BrokerEmail?
8. Does renovation formatting avoid `Unit Count $40` and duplicate execution rows?
9. Do DCF/scenario assumptions avoid unsupported `stated` labels?
10. If it fails, does Dashboard show the customer-safe failure UX and credit-restored line when `entitlement_restored` exists?

After the test, do not immediately patch. Classify any issue first as:
- canonical contract failed
- old bypass path still exists
- PDF/DocRaptor surface issue
- source-document issue
- public/Ken polish only
- customer blocker
- production config only

Current product readiness posture:
- Not Ken/public-ready until one live post-contract Full Underwriting validation is inspected.
- Screening still appears more stable, but the immediate plan is not to abandon Underwriting yet.
- If the live post-contract Underwriting report is materially clean, continue toward Ken/public sample readiness.
- If the same classes recur after canonical contracts, we must honestly reassess whether Full Underwriting should remain private beta while Screening launches first.
```

## May 13 Late Context Update - Canonical Contracts Replaced Whack-a-Mole Patching

### Why this update matters
- May 13 started as a systemic reliability crisis. The user was done with patch/test/patch/test loops and explicitly rejected more tiny report-specific fixes.
- The core diagnosis became clear: old issues kept returning because the repo lacked enough canonical contracts. Too many report concepts still lived as duplicated renderer strings, phrase-based QA checks, heuristic source classifications, or scattered section gates.
- The repair strategy shifted from report-specific fixes to canonical contracts that define the source-of-truth state for recurring classes.
- Broad smoke tests were intentionally avoided because they were burning Codex quota without proving the live renderer paths.
- Codex was instructed to use minimal validation only: `node --check` on changed files and `git diff --check`, unless a tiny helper test was absolutely necessary.

### Full repo-wide reliability investigation findings
- Codex investigated why repeated safeguards still allowed old issue classes to recur.
- Top recurrence mechanisms identified:
  1. duplicate renderer copy paths
  2. phrase-based QA fallbacks acting as authority
  3. support-doc artifact type being treated as truth
  4. QA checking a different surface than the final customer/PDF output
  5. scattered Full Underwriting depth/section gating
  6. live renderer paths not covered by cheap smoke tests
- The user rejected continuing to test until the repo’s canonical contracts were fixed.
- The next work was split into four smaller Codex batches to reduce risk and preserve quota.

### Canonical Contract Batch 1 - Output sanitation + current debt state
- Files changed:
  - `api/_lib/report-surface-contracts.js`
  - `api/generate-client-report.js`
  - `api/_lib/report-contract-qa.js`
  - `api/_lib/source-report-coverage-qa.js`
  - `api/_lib/qa-action-plan.js`
  - `api/_lib/qa-manager-review.js`
  - `api/_lib/source-package-qa.js`
- Added shared final-output sanitizer and applied it before QA/render handoff and the DocRaptor boundary.
- Sanitizer strips U+FFFE/U+FFFF, zero-width chars, soft hyphen, replacement chars, C0/C1 controls, and common mojibake sequences.
- Final customer HTML now goes through the same sanitized surface that QA inspects.
- Added shared current-debt semantic state helper.
- Debt state now distinguishes computed vs not assessed and carries a limitation reason code.
- Renderer now uses debt state for current-debt DSCR, limitation copy, Deal Scorecard, Risk Register, and Data Coverage wording.
- QA layers now read the debt state where available rather than relying only on phrase variants.

### Canonical Contract Batch 2 - Source reconciliation + section eligibility
- Files changed:
  - `api/_lib/report-surface-contracts.js`
  - `api/generate-client-report.js`
  - `api/_lib/source-report-coverage-qa.js`
  - `api/_lib/qa-action-plan.js`
- Added `buildSourceReconciliationState()` for rent-roll vs T12 variance with status, customer/public impact, and disclosure text.
- Renderer now uses the reconciliation state for operating bullets, NOI stability, executive pressure point, and data coverage copy.
- Added `buildFullUnderwritingSectionEligibility()` as a shared section-state contract for major Full Underwriting sections.
- Source Coverage QA now emits `source_reconciliation_state` and `section_eligibility` in its artifact payload.
- Full Underwriting depth flags now key off section eligibility rather than raw section count only.
- Missing debt/refi sections are treated as source-constrained when no true current debt exists.
- QA Action Plan routes reconciliation review as `source_document_limitation` under `owner_area: source_reconciliation`, with public/outreach blocking when appropriate.

### Canonical Contract Batch 3 - Support-doc taxonomy + attribution + renovation formatting
- Files changed:
  - `api/_lib/report-surface-contracts.js`
  - `api/parse/parse-doc.js`
  - `api/generate-client-report.js`
  - `api/_lib/source-report-coverage-qa.js`
  - `api/_lib/source-package-qa.js`
- Added shared support-doc taxonomy helper with semantic roles:
  - `purchase_assumptions`
  - `appraisal`
  - `current_mortgage_statement`
  - `loan_term_sheet`
  - `broker_email`
  - `renovation_budget`
  - `property_tax`
  - `other_support`
- Parser payloads now carry:
  - `semantic_doc_role`
  - `semantic_doc_role_confidence`
  - `semantic_doc_role_reason`
  - `semantic_doc_family`
- Source Coverage QA and Source Package QA now surface semantic roles instead of relying only on raw `doc_type`.
- Appraisal-vs-purchase-assumptions ambiguity now resolves by semantic role.
- Broker email no longer upgrades to loan-term-sheet unless actual loan-term signals are present.
- Added canonical assumption-attribution contract: `document_derived`, `user_provided`, `standardized_framework`, `unavailable`.
- DCF/scenario copy now uses canonical attribution labels instead of unsupported `stated` language.
- Renovation execution rows now dedupe by metric kind plus value.
- Renovation metric formatting is kind-aware: unit count renders as integer, per-unit cost and total budget render as currency, percentage renders as percent.

### Canonical Contract Batch 4 - System failure entitlement restore guarantee
- File changed:
  - `api/admin-run-worker.js`
- Added idempotent `restoreEntitlementForFailedJob()` helper for hard failures.
- `REPORT_GENERATION_FAILED` now carries `error_code: REPORT_GENERATION_FAILED` in the failure worker event.
- Restore attempt no longer depends on the `report_generation_failed` artifact insert succeeding.
- Worker checks existing `entitlement_restored` before restoring, so it stays idempotent.
- Restoration clears `consumed_at`, clears `job_id`, clears `analysis_jobs.purchase_id`, and writes Dashboard-compatible signal.
- Existing document-failure restore branches were left intact.

### Final wiring patch after integration audit
- Integration audit status after the four batches was `concern`, not `fail`.
- Contracts were wired, but two gaps remained:
  1. phrase fallbacks still had too much authority in QA layers
  2. entitlement restore could succeed while Dashboard did not see the `entitlement_restored` signal if event insert failed
- Files changed:
  - `api/_lib/report-surface-contracts.js`
  - `api/_lib/report-contract-qa.js`
  - `api/_lib/qa-manager-review.js`
  - `api/_lib/source-package-qa.js`
  - `api/_lib/source-report-coverage-qa.js`
  - `api/admin-run-worker.js`
- Added `hasCurrentDebtSemanticState()` as the shared semantic guard.
- `report-contract-qa` treats current-debt phrase checks as fallback only when semantic state is absent.
- `qa-manager-review` short-circuits current-debt limitation disclosure on semantic state instead of phrase matching first.
- `source-package-qa` and `source-report-coverage-qa` demote phrase-based false-positive handling behind semantic current-debt state.
- Acquisition-only / not-assessed state wins over phrase variants like `No current debt document provided`.
- Entitlement signal reliability improved:
  - if purchase is already restored/unconsumed but signal is missing, worker writes `entitlement_restored` without re-crediting
  - if first insert fails, helper retries once
  - if retry still fails, server logs job_id, purchase_id, and error_code
  - job `purchase_id` is only cleared after restore signal is successfully written

### Commit checkpoint
- Codex committed the canonical contract work.
- Current clean checkpoint:
  - branch: `main`
  - HEAD: `02942c3 updates`
  - working tree: clean
- Final static audit of committed state:
  - `sanitizeFinalCustomerHtml()` is wired at customer HTML boundary
  - `buildCurrentDebtAssessmentState()` drives current-debt paths
  - `buildSourceReconciliationState()` and `buildFullUnderwritingSectionEligibility()` are consumed by renderer and QA
  - support-doc taxonomy metadata is attached in `parse-doc.js`
  - `REPORT_GENERATION_FAILED` routes through shared restore helper with `entitlement_restored` signal writing
  - no obvious new runtime `ReferenceError` class found
- Audit conclusion:
  - ready for a single live Full Underwriting validation
  - legacy phrase fallbacks remain, but are demoted behind semantic state and should be watched rather than treated as a stop sign

### Next immediate action
- Run exactly one live Full Underwriting validation.
- Recommended package: Forest City Manor FINAL / equivalent strong package with T12, Rent Roll, purchase assumptions, renovation budget, and broker/supporting document.
- Do not run multiple tests.
- Do not patch first.
- Do not ask Codex for more work before the live result.
- Inspect the published PDF/artifacts carefully before classifying readiness.

---


# May 13, 2026 Morning Update - Systemic Reliability Crisis / Stop Whack-a-Mole

## Fresh Chat Brief - May 13 Systemic Investigation

Use this prompt to start the next chat:

```text
We are continuing InvestorIQ from the updated master context. The current state is no longer “patch the next report bug.” The user is extremely frustrated because repeated Full Underwriting tests keep revealing either old issues coming back or new ones emerging, despite Report Contract QA, Source Coverage QA, Rendered Report QA, QA Manager, QA Director, delivery gate logic, AI recovery helpers, support-doc recovery, and many deterministic guardrails.

Priority #1 in this chat is to talk through the system-level failure before writing any Codex prompts. Do not immediately propose another tiny patch. Do not treat Northbank, Forest City, or 124 Richmond as isolated one-off report bugs.

Current recent test truth:
- Forest City RETEST 9 became customer-deliverable and confirmed support-doc acquisition + renovation recovery working, but remained thinner than expected at 15 pages and still exposed polish/noise issues.
- 124 Richmond Current Build RETEST 2 generated 17 pages and confirmed acquisition support-doc recovery, property tax recovery, renovation recovery, report contract pass, and customer publish eligibility. It also proved current build can produce richer rent-roll/unit-mix sections when data shape lines up.
- Northbank Final Test 3 generated 17 pages from 4 files and exposed recurring/still-unresolved systemic issues: `DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER` came back on a safe “No current debt document provided” row, the `Current￾debt DSCR` hidden-character/mojibake path is still present, and a major Rent Roll vs T12 discrepancy (-51.4%) is flagged. Northbank also shows Offering Summary fields are underused.
- Delivery gate / QA artifacts now sometimes disagree: delivery gate may say customer blocked by contract, QA action plan may say advisory/customer ready, QA Director may identify action-plan mismatch, and admin/public/outreach/customer classifications are not consistently aligned.

The user’s concern:
- We have implemented too many layers and still every test finds something.
- Old issues return in variant form.
- The AI/QA layers are not reliably catching or preventing embarrassing issues before publication.
- We cannot keep fixing report-specific symptoms forever.
- If InvestorIQ cannot be ready for Ken Dunn/outreach by the end of this week, the project may need to be stopped because of time and family financial pressure.

Immediate objective:
1. Diagnose WHY old issue classes keep returning despite guardrails.
2. Identify whether the problem is duplicate logic, multiple copy/wording paths, inconsistent renderer state, stale QA evidence, overly brittle regex contracts, test fixture/data-shape inconsistency, artifact/renderer field mismatch, QA layer authority confusion, or a combination.
3. Decide what kind of repo-wide investigation is required before any more implementation.
4. Produce one investigation-first Codex prompt only after the discussion is complete.

Do not start by patching. The next Codex task, when we create it, must be a repo-wide audit/investigation focused on failure recurrence, duplicate logic, QA blind spots, and policy/authority conflicts. It must not patch until root causes are classified.

Key recent artifacts/issues to include in the investigation scope:
- `DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER` was fixed for “Current debt balance not provided” but returned for “No current debt document provided.” This suggests copy-variant brittle matching, not a solved class.
- `Current￾debt DSCR` hidden character appeared in Forest City / 124 / Northbank paths after attempted wording cleanup. This suggests duplicate wording constants or multiple renderer text paths.
- Northbank source coverage flagged `FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED` and `RENT_ROLL_T12_DISCREPANCY`. Need distinguish true source mismatch from parser/fixture issue.
- Delivery gate decision for Northbank says customer_publish_eligible false due to stale DSCR placeholder, while QA artifacts also show conflicting advisory/customer-ready language. Need trace authority hierarchy.
- AI/QA layers flagged some items but still did not prevent recurrence or align decisions cleanly.
- Full Underwriting depth is inconsistent: Forest City 15 pages, 124 and Northbank 17 pages, with sections appearing or disappearing based on data shape and gating.

Likely investigation files:
- `api/generate-client-report.js`
- `api/_lib/report-contract-qa.js`
- `api/_lib/qa-action-plan.js`
- `api/_lib/qa-director-review.js`
- `api/_lib/source-report-coverage-qa.js`
- `api/_lib/source-package-qa.js`
- `api/_lib/qa-manager-review.js`
- `api/_lib/qa-fix-routing.js`
- `api/parse/parse-doc.js`
- `lib/ai-support-doc-recovery.js`
- relevant smoke tests for report contract, support-doc recovery/classification, source coverage, and QA action plan

Working rule for this chat:
- No more tiny patches first.
- Talk through the systemic failure.
- Then prepare one elite, investigation-only Codex prompt for a repo-wide reliability audit.
```

## May 13 Context Update

### Current emotional / operational truth
- The user is beyond frustrated because the project is again showing the pattern he explicitly wanted to escape: run a test, find old or new issues, patch, retest, find another issue.
- The user does not want any more tiny report-specific Codex patch prompts until the system-level cause is understood.
- This is now a systemic reliability / launch-readiness crisis, not a normal feature-polish session.
- The user’s hard constraint is real: if InvestorIQ is not ready for launch/Ken Dunn outreach by the end of this week, the project may need to be abandoned because continued development is creating financial and emotional pressure.
- The correct assistant posture is: calm, direct, no defensiveness, no “just one more patch” reflex, and no pretending the current system is launch-ready when repeated tests still surface recurring issues.

### Product/pricing discussion from night before
- User raised a serious positioning concern: Screening at $499 and Underwriting at $1,499 may create perceived-value backlash if Screening generates 9-10 pages and Underwriting generates 14-17 pages.
- Assistant’s no-BS recommendation was to consider one unified product for launch:
  - `InvestorIQ Underwriting Report`
  - possible launch price: `$499 USD`
  - rationale: lower buyer friction, high gross margin if approx. `$30` cost/report, less page-count resentment, more testing volume, more testimonials, and less Day-1 perfection pressure.
- This pricing/product-structure decision remains open, but user paused it to continue testing first.
- Pricing discussion should remain priority #1 after reliability testing, but should not distract from the immediate systemic QA failure investigation.

### Support-doc recovery expansion milestone completed May 12
- Support-doc recovery was expanded beyond acquisition/purchase assumptions into:
  - current mortgage / true current debt
  - renovation / CapEx
  - property tax
  - appraisal / cap-rate support
- Existing acquisition support-doc recovery was fixed and proven live:
  - OpenAI 400 was traced to strict JSON schema required-list mismatch.
  - Schema was patched so nullable top-level fields are also listed as required.
  - Support-doc recovery diagnostics now capture non-secret OpenAI error message/body.
  - Acquisition recovery now accepts purchase price, LTV, rate, amortization, closing costs, going-in cap rate, and derived acquisition loan amount when evidence validates.
- Current mortgage recovery was added with strict rule:
  - current debt/refi requires true current/existing/outstanding balance language.
  - proposed/acquisition/indicative financing must not become current debt.
- Renovation/property tax recovery added:
  - renovation accepts verified total budget, budget rows, unit/per-unit info where explicit, but does not invent rent lift/ROI/payback/timing.
  - property tax accepts annual tax/tax year/roll number where verified and rejects year-like tax values.
- Appraisal/cap-rate recovery added:
  - purchase price is not appraised value.
  - cap-rate-only support can be support, not appraised value.
  - unsupported/purchase-assumption docs should not generate formal appraisal claims.

### Forest City RETEST 9 summary
- Forest City RETEST 9 became materially better and customer-deliverable.
- Delivery gate indicated:
  - `customer_publish_eligible: true`
  - `customer_publish_blockers: []`
  - `delivery_gate_status: deliverable`
  - only DocRaptor test mode remained as public/high-value outreach blocker.
- Report Contract QA passed with zero violations.
- Acquisition section rendered correctly:
  - Purchase Price `$34,500,000`
  - LTV `85%`
  - Derived Acquisition Loan Amount `$29,325,000`
  - Interest Rate `3.80%`
  - Amortization `40 years`
  - Closing Costs `1.5%`
  - Proposed Acquisition DSCR `1.21x`
- Renovation recovery accepted fields, but PDF had ugly/duplicated unit-count/per-unit rows.
- Remaining Forest City issues after RETEST 9:
  - renovation row formatting/de-dupe issue
  - `Current￾debt DSCR` hidden/nonstandard character still present in Data Coverage path
  - `missing_appraised_value` advisory on purchase assumptions file, even though file was accepted as acquisition support rather than formal appraisal.
- Page count was still 15, which triggered concern that Full Underwriting is still too thin or section-gated inconsistently.

### 124 Richmond Current Build RETEST 2 summary
- User ran 124 Richmond on current build as a comparison.
- Result: 17 pages.
- 124 package included 10 uploaded files:
  - T12 XLSX
  - Rent Roll XLSX
  - CapEx Schedule PDF/XLSX
  - Debt Term Sheet PDF
  - Offering Summary PDF
  - Property Tax Bill PDF
  - Unsupported Appraisal Summary PDF
  - Unsupported Market Rent Survey PDF
  - Unsupported Phase I ESA PDF
- Report generated 17 pages and confirmed richer rendering:
  - Proposed Acquisition Debt Sizing rendered.
  - Unit-Level Rent Positioning rendered.
  - Rent Roll Distribution rendered.
  - Renovation section rendered.
  - Property tax recovery accepted annual tax/tax year/roll number.
  - Report Contract QA passed.
  - Delivery gate marked customer-publish eligible.
- 124 proved current build can produce more depth than Forest City when data shape and support package are richer.
- 124 also showed the `Current￾debt DSCR` hidden-character issue remained in at least one wording path.
- 124 proved unsupported inputs can remain advisory/no-action, but uploaded unsupported files in report list can still trigger language/support advisories.

### Northbank Final Test 3 summary
- User ran Final Test 3 / Northbank with 4 uploaded files:
  - T12 CSV
  - Rent Roll CSV
  - Offering Summary PDF
  - Renovation Budget PDF
- Source documents:
  - Offering Summary includes 30-unit asset type, asking price `$8,750,000`, year built `1982`, utilities, and validation-only note.
  - Renovation Budget includes total budget `$291,500`, category rows, and explicitly states no rent lift, ROI, payback, phasing, cost recovery, or implementation schedule.
- Report generated 17 pages.
- Good behavior:
  - Unit-Level Rent Positioning rendered.
  - Rent Roll Distribution rendered.
  - Renovation section rendered from verified budget data.
  - No debt/refi was modeled because no debt term sheet/current mortgage was uploaded.
- Major issues surfaced:
  1. `DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER` returned as a customer blocker even though rendered row was a safe limitation shape: `Current Debt DSCR / Not assessed / No current debt document provided / 0/10`. This appears to be the same issue class previously patched only for another phrase variant.
  2. `Current￾debt DSCR` hidden/nonstandard character still appears in Data Coverage.
  3. `RENT_ROLL_T12_DISCREPANCY` flagged annualized rent as `-51.4% vs T12 GPR`; needs classification as parser bug, fixture/source mismatch, or real source limitation.
  4. Offering Summary fields are underused: asking price, year built, utilities, asset type could support a concise Property Facts / Acquisition Basis / Offering Summary section, without inventing debt or appraised value.
  5. Delivery gate / action plan / director artifacts show authority confusion: one layer treats customer delivery as blocked by contract, other layers still describe some items as advisory/no-action or customer-ready.

### Current systemic diagnosis hypothesis
- Repeated old issues returning means the system likely has one or more architecture problems:
  1. Duplicate renderer wording/copy paths where only one path gets patched.
  2. Brittle regex/phrase-based QA contracts instead of normalized semantic categories for safe limitation rows.
  3. Multiple sources of truth for customer/public/outreach readiness.
  4. QA Director, QA Action Plan, Report Contract QA, Source Package QA, and Delivery Gate do not share a single authority hierarchy.
  5. Support-doc and renderer data shapes vary across CSV/XLSX/PDF/text and cause section gating inconsistencies.
  6. “Fix class once” attempts are still being implemented as phrase-specific patches.
  7. AI QA layers are mostly advisory/reporting and may not reliably prevent old issues if deterministic contracts/renderer paths are fragmented.
  8. Existing smoke tests may cover exact phrases/fixtures but not variant phrase classes or all renderer paths.
- This is why another narrow patch is not enough. The next step should be a repo-wide reliability audit focused on recurrence mechanics, duplicate logic, and QA authority conflicts.

### Immediate next move
- Do not produce another narrow Codex patch prompt first.
- Talk through the failure architecture with the user.
- Then create one investigation-only Codex prompt that asks Codex to audit why issues recur, where duplicate paths exist, why QA layers disagree, and what class-level fixes are needed.
- The investigation must return file-truth classification before any patch.

---



## Fresh Chat Brief - May 12 Morning

Use this prompt to start the next chat:

```text
We are continuing InvestorIQ from the updated master context. The current launch-critical issue is that Full Underwriting tests are repeatedly routing to Admin Review / Fix Queue instead of publishing. Forest City Final Test 3 is held with `UNSUPPORTED_CURRENT_DEBT_RENDERED` / `qa_contract`, severity critical, customer hold, public blocked, outreach blocked, patch required, regeneration required.

This is now an underwriting overblocking crisis, not a one-off report bug. We must stop whack-a-mole. The goal this morning is to make clean Full Underwriting reports publish autonomously while true contradictions and truly unsupported current-debt/refi output still hold.

Do not start by patching. First, prepare an investigation-only Codex prompt. Codex must trace the full path for Forest City Final Test 3:
1. What exact rendered HTML/text triggered `UNSUPPORTED_CURRENT_DEBT_RENDERED`.
2. Whether the report actually rendered unsupported current-debt/refi/DSCR analysis, or only safe limitation/acquisition-financing language.
3. Whether parsed artifacts contain true current debt, proposed acquisition financing only, or both.
4. How `report_contract_qa` classified the violation.
5. How `qa_action_plan.buildDeliveryGateDecision()` promoted it into customer hold/admin review.
6. Whether `qa_manager_review` or source coverage is amplifying source limitations into contradictions.
7. Whether Admin Dashboard is making the hold harder to interpret because of information overload.

Files to investigate first:
- `api/generate-client-report.js`
- `api/_lib/report-contract-qa.js`
- `api/_lib/qa-action-plan.js`
- `api/_lib/source-report-coverage-qa.js`
- `api/_lib/qa-manager-review.js`
- `api/admin/queue-metrics.js`
- `src/pages/AdminDashboard.jsx`

Do not touch `api/admin-run-worker.js`, parser files, Stripe, Supabase schema, DocRaptor, email, public copy, or customer Dashboard unless investigation proves they are relevant.

After Codex returns file truth, classify the issue as renderer leak, contract false positive, gate overpromotion, QA manager source-context drift, admin dashboard display confusion, or combination. Then patch the failure class once, not Forest City only.
```


**Last updated:** May 12, 2026 morning - Admin Delivery Gate v1 correctly prevents unsafe customer delivery, but live validation has exposed a new launch-critical overblocking problem: multiple Full Underwriting jobs are now being routed to Admin Review / Fix Queue instead of publishing. Forest City Final Test 3 is currently held with `UNSUPPORTED_CURRENT_DEBT_RENDERED` / `qa_contract`, even though Forest City is expected to be an acquisition-financing / no-true-current-debt lane and should publish when current-debt sections are safely constrained. The immediate priority is no longer adding more admin dashboard features or patching individual report examples. The priority is a repo-wide, file-truth investigation of the underwriting delivery gate, current-debt/acquisition-debt separation, QA contract promotion logic, and admin dashboard information design so clean underwriting reports can publish autonomously while true contradictions still hold.

## 1. Current Product State
- InvestorIQ is in final validation and outreach-prep for Ken Dunn.


### May 12 Morning - Launch-Critical Underwriting Overblocking / Admin Review Flood

#### Current observed problem
- User restarted testing after the May 11 Admin Delivery Gate / Command Centre work.
- Forest City Final Test 3 is currently held in Admin Review / Fix Queue instead of publishing.
- Admin queue visible state from screenshots:
  - Property: `Forest City Final RE TEST 3`
  - Report: `underwriting`
  - Severity: `CRITICAL`
  - Status/Priority: `ADMIN REVIEW REQUIRED`
  - Stage/source: `qa_contract`
  - Issue: `Current debt analysis rendered without true current debt balance support`
  - Code: `UNSUPPORTED_CURRENT_DEBT_RENDERED`
  - Reason column: `-`
  - Next step: `Patch deterministic renderer gating so the unsupported table, section, label, or report-type content cannot render.`
  - Badges shown: `CUSTOMER HOLD`, `PUBLIC BLOCKED`, `OUTREACH BLOCKED`, `PATCH REQUIRED`, `REGENERATION REQUIRED`.
- Selected detail panel remains overwhelming:
  - controlled admin actions
  - delivery gate actions
  - automation recommendations
  - automation simulation
  - job details
  - action plan details
  - many sections are visible at once.
- User finds the Admin Dashboard confusing / information-overload-heavy.
- Delivery Gate actions remain locked:
  - `Approve for customer delivery`
  - `Regenerate report`
  - `Override public sample block`
  - `Override outreach block`.
- Automation recommendations correctly say no automatic action has been taken, but they add more visual complexity.
- Automation simulation classifies the selected item as human review because admin review hold is active.
- User is highly frustrated because every Full Underwriting test appears to route to review.
- This is not acceptable for launch or for Ken Dunn.
- InvestorIQ cannot require Rob to manually review dozens of reports per day.

#### Why this is launch-critical
- Admin Review / Fix Queue is valuable only for true exceptions:
  - deterministic source contradiction
  - unsupported rendered current debt/refi claims
  - hard public/internal/debug language
  - placeholder/mojibake/template leakage
  - true missing required core source documents
  - real source/report reconciliation mismatch.
- Admin Review becomes a product failure if normal Full Underwriting packages repeatedly land there.
- Correct launch behavior:
  - clean Screening publishes
  - clean Full Underwriting publishes
  - acquisition-financing-only underwriting publishes with current-debt/refi limitation and separate proposed acquisition debt sizing
  - true-current-debt underwriting publishes when true balance/service/rate/amortization are present and reconcile
  - true source contradictions hold
  - missing required docs fail closed / credit restored
  - public/Ken sample readiness can be stricter than customer delivery, but should not block normal customer delivery without a true customer-delivery blocker.

#### Current suspected failure class
- This is no longer a one-off Forest City bug.
- The likely systemic class is one or more of:
  1. Renderer still emits a current-debt/refi table, label, metric, scorecard row, sensitivity row, or section heading when only acquisition/proposed debt exists.
  2. `report_contract_qa` is correctly detecting unsupported current-debt rendering, but the renderer contract needs to make that output impossible.
  3. `report_contract_qa` is over-detecting safe limitation language as unsupported current debt.
  4. `qa_action_plan` / `buildDeliveryGateDecision()` is still too eager in promoting public-sample or outreach blockers into customer holds.
  5. Acquisition-financing terms are still leaking into `mortgagePayload`, `refiFinancials`, scorecard, current-debt sensitivity, or report-contract evidence paths.
  6. AI/QA review layers are still largely judging final rendered output instead of grounding decisions in actual uploaded files and accepted parsed artifacts.
- Do not assume the right fix is another one-off Forest City patch.
- Do not patch individual symptoms until Codex investigates the full current-debt/acquisition-debt render + contract + gate path.

#### Important distinction to preserve
- `UNSUPPORTED_CURRENT_DEBT_RENDERED` can be a correct hard customer blocker if the PDF actually renders current-debt/refi/DSCR analysis without true current debt.
- It should not block if the PDF only renders safe limitation language such as:
  - current outstanding debt balance not provided
  - current debt service not assessed
  - proposed acquisition debt sizing rendered separately
  - acquisition debt is not current outstanding debt and is not used as refinance balance.
- The investigation must distinguish:
  - actual unsupported current-debt output
  - safe limitation/disclosure output
  - proposed acquisition debt output
  - public-sample-depth polish
  - customer-delivery safety.

#### Current admin dashboard UX issue
- Admin Dashboard is now functionally useful but visually overwhelming.
- Fix Queue selected-item detail should move toward a simpler operator model:
  - `Why is this held?`
  - `Is customer delivery blocked?`
  - `Is this only public/sample/outreach blocked?`
  - `What exact rendered excerpt or artifact caused the hold?`
  - `What should I do next?`
  - `What action is allowed now?`
- Hide or collapse lower-priority panels by default:
  - automation recommendations
  - automation simulation
  - raw QA action plan
  - raw artifact details
  - verbose job details.
- Keep read-only safety for now; do not add risky mutation buttons until delivery rules are fixed.

#### Files most likely involved
- `api/generate-client-report.js`
  - current debt/refi rendering
  - acquisition financing rendering
  - `mortgagePayload` / `loanTermSheetTermsPayload`
  - current debt DSCR fallback wording
  - Deal Scorecard DSCR/current-debt rows
  - Refinance Stability section gating
  - risk register / sensitivity current-debt rows.
- `api/_lib/report-contract-qa.js`
  - `UNSUPPORTED_CURRENT_DEBT_RENDERED`
  - `UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED`
  - `ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT`
  - safe limitation language allowances.
- `api/_lib/qa-action-plan.js`
  - `classifyActionDeliveryImpact()`
  - `actionForReportContractViolation()`
  - `buildDeliveryGateDecision()`
  - `buildPublishEligibilitySummary()`.
- `api/_lib/source-report-coverage-qa.js`
  - source/debt/acquisition inventory interpretation
  - depth/completeness warnings.
- `api/_lib/qa-manager-review.js`
  - possible source-context drift / contradiction overcalling.
- `api/admin/queue-metrics.js`
  - Fix Queue display reason / selected-detail payload.
- `src/pages/AdminDashboard.jsx`
  - information overload / panel hierarchy / selected-item detail UX.

#### Files not to touch first
- Do not start with `api/admin-run-worker.js`.
  - Worker persists delivery gate results; it is likely not the policy source.
- Do not start with parser patches.
  - Forest City and related tests generally parse enough to render.
  - This problem is downstream gate/render/contract behavior unless file-truth proves otherwise.
- Do not touch Stripe, Supabase schema, email, DocRaptor, public copy, or customer Dashboard for this issue.
- Do not patch single test fixtures.

#### Codex investigation directive for next chat
- First task in the fresh chat is a file-truth investigation, not a patch.
- Inspect exact evidence for Forest City Final Test 3:
  - rendered HTML excerpts that triggered `UNSUPPORTED_CURRENT_DEBT_RENDERED`
  - report contract violation evidence
  - qa action plan blockers
  - delivery gate decision
  - parsed debt/acquisition artifacts
  - whether true current debt balance exists
  - whether current-debt/refi sections actually rendered or only safe limitation language rendered.
- Then classify the problem:
  - renderer leak
  - contract false positive
  - gate overpromotion
  - QA manager source-context drift
  - admin display confusion
  - combination.
- Only after that, patch the failure class once.

#### Stop / go rule for this morning
- Stop if Codex proposes another narrow report-specific patch without tracing the whole failure path.
- Go only after we can state:
  - why Forest City is held
  - whether the hold is legitimate
  - what exact code path produced the hold
  - what category of future reports would be affected
  - how to prevent repeated clean Underwriting holds.
- The goal this morning:
  - clean underwriting reports publish autonomously
  - true contradictions still hold
  - Admin Queue becomes exception management, not daily report triage.

### May 9-11 Maplewell Admin Delivery Gate / Command Centre Milestone
- Maplewell Full Underwriting true-current-debt lane became the primary live validation fixture after the May 8 parser/QA hardening milestone.
- Uploaded Maplewell files:
  - `T12_Maplewell_Court.csv`
  - `Rent_Roll_Maplewell_Court.csv`
  - `Debt_Summary_Maplewell_Court.pdf`
  - `Property_Tax_Bill_Maplewell.pdf`
- The debt document was confirmed as true current debt:
  - outstanding balance `$2,100,000`
  - monthly debt service `$13,625`
  - interest rate `4.25%`
  - amortization remaining `23 years`
  - explicitly not proposed acquisition financing.
- Property tax document was confirmed as `$186,000` annual property tax.
- Maplewell exposed the exact failure class we were trying to eliminate:
  - source documents parsed/published far enough to render the report
  - but report output/QA did not initially enforce source-to-report consistency strongly enough before customer delivery.

#### Property Name Display Fix
- `api/generate-client-report.js`
- Removed broad standalone `clean|messy|qa|test` stripping from `sanitizePropertyNameDisplayText()`.
- User-entered property names like `FINAL TEST 1` must be preserved.
- Production property name doctrine remains locked:
  - preserve user-entered display name as source-of-truth
  - light HTML/safety cleanup only
  - do not globally remove words/numbers such as Test, Final, Clean, Messy, QA, Screening, Underwriting, or trailing numbers
  - final public samples should be generated with clean intentional property names rather than relying on sanitizer tricks.

#### Maplewell Current-Debt DSCR Fix
- Files touched:
  - `api/generate-client-report.js`
  - `api/_lib/report-contract-qa.js`
  - `api/_lib/qa-action-plan.js`
  - `api/_lib/qa-director-review.js`
  - `tests/qa/report-contract-qa-smoke.js`
  - `tests/qa/qa-director-review-smoke.js`
- Problem:
  - Executive / Debt Summary / Sensitivity / Deal Scorecard DSCR showed about `7.10x`
  - Risk Register still showed stale `8.10x`.
- Root cause:
  - Risk Register used a different DSCR source path than the current-debt source-of-truth helper.
- Fix:
  - Risk Register `DSCR (Current Debt)` now uses the same current-debt DSCR helper/source path as the rest of the report.
  - For true current debt:
    - source `monthly_payment` / `monthly_debt_service` is preferred when present
    - amortized payment from balance/rate/amortization is fallback only.
- Added deterministic `CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH` in `report_contract_qa`.
- The DSCR contract compares rendered current-debt DSCR values across:
  - `DSCR (Computed)`
  - `DSCR (T12 NOI)`
  - current-debt sensitivity base row
  - Deal Scorecard
  - Risk Register.
- If rendered DSCR values differ materially, the contract emits a high-severity mismatch with rendered value evidence.
- `qa_action_plan` routes the mismatch to admin review / report renderer.
- `qa_director_review` can no longer return `no_missed_issue_detected` when this mismatch exists.

#### Maplewell Rent Roll Annual Rent Normalization Fix
- Files touched:
  - `api/generate-client-report.js`
  - `tests/qa/generate-client-report-rent-roll-smoke.js`
- Problem:
  - PDF rendered impossible annual market rent `$21,744,000`.
  - The same report also showed Weighted Avg Market Rent around `$1,888/month` and `48` units.
- Root cause:
  - `rentRollSummaryTotals.market_rent_annual` was trusted into `computedRentRoll.total_market_annual` even when internally contradictory.
- Fix:
  - Added deterministic annual-rent resolver.
  - Validates `annual_market_rent_total / 12 / total_units` against weighted average market rent.
  - Falls back to `weighted_avg_market_rent x total_units x 12` when summary annual total contradicts weighted average.
  - Correct Maplewell annual market rent is roughly `$1.087M`, not `$21.744M`.
  - Source data is not mutated; only computed/rendered annual total selection is normalized.

#### Top Positive Income Lines False Positive / DSCR Alignment
- Files touched:
  - `api/generate-client-report.js`
  - `api/_lib/report-contract-qa.js`
  - `api/admin/queue-metrics.js`
  - `src/pages/AdminDashboard.jsx`
  - `tests/qa/report-contract-qa-smoke.js`
- `TOP_POSITIVE_INCOME_LINES_CONTRACT` was narrowed to inspect only the actual first rendered income table under the heading.
- Current-debt DSCR source path was centralized so executive KPI, underwriting pressure point text, Deal Scorecard, and sensitivity base row stay aligned.
- This reduced false-positive QA and DSCR display contradiction risk.

#### Admin Delivery Gate v1 Implemented
- Files touched:
  - `api/generate-client-report.js`
  - `api/admin-run-worker.js`
  - `api/_lib/qa-action-plan.js`
  - `api/admin/queue-metrics.js`
  - `src/pages/AdminDashboard.jsx`
  - `tests/qa/qa-action-plan-smoke.js`
- Delivery doctrine is now implemented as a real gate:
  1. Clean source package + clean parsing + clean reconciliation
     - publish/customer-deliver normally.
  2. Parser miss / mismatched number / report contradiction / source-report contradiction
     - route to Admin Review / Fix Queue.
     - do not mark customer-ready.
     - do not send report-ready email.
     - do not expose a downloadable report.
  3. Legitimately missing required source data
     - route to existing needs-documents / failed-with-clear-reason style lifecycle.
     - do not invent or gap-fill.
- Added deterministic `delivery_gate_status` values:
  - `deliverable`
  - `admin_review_required`
  - `user_needs_documents`.
- `generate-client-report.js` now writes `delivery_gate_decision` artifacts.
- `admin-run-worker.js` consumes the gate result:
  - deliverable continues to published/email path
  - admin_review_required holds before publish/email
  - user_needs_documents uses existing fail/needs-documents handling.
- Important lifecycle fix:
  - admin-review holds originally tried to create a report row with null/invalid storage path and returned 500.
  - fixed so `delivery_gate_status === "admin_review_required"` returns clean HTTP 200 with:
    - `ok: true`
    - `reportId: null`
    - `storagePath: null`
    - `customer_delivery_ready: false`.
  - Worker now accepts that as a held state, not a generation failure.
- Admin-held jobs are currently stored as:
  - `analysis_jobs.status = publishing`
  - `error_code = ADMIN_REVIEW_REQUIRED`
  - `error_message = Report held for admin review before delivery.`
- Timeout safety patch:
  - `api/admin-run-worker.js`
  - timeout guard now selects `error_code`
  - excludes `ADMIN_REVIEW_REQUIRED` jobs from stuck-job timeout failure.
- This prevents admin-held jobs from later being treated as stuck publishing jobs.

#### Customer Dashboard Under Review State
- File touched:
  - `src/pages/Dashboard.jsx`
- Active jobs fetch now selects:
  - `error_code`
  - `error_message`
- React serialize/equality guard includes those fields so status updates are detected.
- Customer-facing display override:
  - if `status === "publishing"` and `error_code === "ADMIN_REVIEW_REQUIRED"`, show badge/status as `UNDER REVIEW`, not `PUBLISHING`.
- Customer-facing copy:
  - `InvestorIQ is verifying the uploaded source documents before delivery. This can take up to 24 business hours.`
- The copy appears under the Active Jobs row where users are looking after report generation.
- Step 03 timing copy was darkened/readability-improved:
  - `Reports are typically delivered within 1 business day. Submissions received after business hours, on weekends, or on holidays begin processing on the next business day.`
- Do not expose internal QA, parser, AI, vendor, delivery-gate, or error-code language to customers.

#### Maplewell Source-Level Hold Correctness
- Maplewell RETEST 3 correctly entered admin review instead of publishing.
- Backend truth:
  - `status = publishing`
  - `error_code = ADMIN_REVIEW_REQUIRED`
  - `error_message = Report held for admin review before delivery.`
  - purchase remains linked.
- The admin hold was correct because uploaded source docs are internally inconsistent:
  - rent roll unit rows support:
    - 48 units
    - 46 occupied
    - 2 vacant
    - annual in-place rent around `$961,200`
    - annual market rent around `$1,087,200`
  - rent roll summary row and T12 GPR indicate materially different source totals:
    - T12 Gross Potential Rent around `$1,850,000`
    - rent roll summary annual totals around `$1.8M+`
  - this is a real source-verification issue, not a debt or property tax issue.
- Correct Admin Review reason:
  - `Rent roll source totals require verification`
- Correct admin reason text:
  - `The unit-level rent roll totals do not reconcile cleanly against the rent roll summary totals and T12 gross potential rent. Admin review is required before delivery.`
- Correct next step:
  - `Review rent roll unit rows, rent roll summary totals, and T12 GPR. Confirm which source total should control before regenerating.`
- This is now the proof case for the new doctrine:
  - Clean = publish.
  - Mismatch = Admin Review / Fix Queue.
  - Missing required docs = needs documents / failed-with-clear-reason.

#### Admin Review / Fix Queue / Command Centre v1
- Files touched:
  - `api/admin/queue-metrics.js`
  - `src/pages/AdminDashboard.jsx`
- Fix Queue remains lazy/deferred behind Refresh/Load Fix Queue.
- Freeze-safety rules remain locked:
  - no eager artifact loading
  - no polling
  - no raw artifact payloads in browser
  - no increased row limit
  - no new API files
  - no new large scans.
- Earlier admin dashboard freeze was caused by eager Fix Queue artifact loading / expensive artifact reads.
- Patch changed `queue-metrics` so default admin dashboard load does not query `analysis_artifacts`.
- Fix Queue only loads when explicitly requested with `include_fix_queue=true`.
- Fix Queue artifact query remains capped and compact.
- Admin Dashboard Users & Credits RPC 403 issue:
  - direct frontend RPC `get_all_profiles_for_admin` caused 403.
  - Users & Credits loading was folded into existing protected `api/admin/queue-metrics?include_users=true`.
  - deleted extra `api/admin/users-credits.js` to avoid Vercel Hobby serverless function limit.
- Vercel Hobby function-count blocker:
  - build failed because more than 12 serverless functions would be added.
  - resolved by not adding the extra admin API file and reusing `queue-metrics`.
- AdminDashboard blank page crash:
  - latest Command Centre UI patch added `useMemo` but React import did not include it.
  - fixed import to include `useMemo`:
    - `import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";`
- Command Centre display upgrade:
  - Fix Queue now prefers read-time `display_*` fields.
  - Existing old/stored artifacts are normalized at read time without rewriting artifacts.
  - Known `rent_roll_vs_t12_gpr_discrepancy` maps to:
    - `display_title: Rent roll source totals require verification`
    - `display_reason: The unit-level rent roll totals do not reconcile cleanly against the rent roll summary totals and T12 gross potential rent. Admin review is required before delivery.`
    - `display_next_step: Review rent roll unit rows, rent roll summary totals, and T12 GPR. Confirm which source total should control before regenerating.`
    - `display_category: Source verification`
    - `display_priority: Admin review required`
  - Fix Queue table now sorts visible rows with admin-review-required first, then severity, then newest.
  - Replaced raw true/false display with readable chips for:
    - customer hold/ready
    - public blocked/ready
    - outreach blocked/ready
    - patch required
    - regeneration required.
  - Raw codes remain muted/debug only where useful.
- Current Command Centre is still v1/read-only:
  - no active Review Docs button yet
  - no manual override field yet
  - no Regenerate action yet
  - no Notify User action yet.
- Future Admin Command Centre v2 should add:
  - View uploaded docs
  - View parsed artifacts
  - View internal held PDF if safely generated
  - source-backed admin correction/override
  - Regenerate
  - Approve Delivery
  - Notify User
  - audit trail for admin-approved values.

- Admin Dashboard Freeze / React Stability
- Admin Dashboard memory spike occurred after initial Fix Queue eager-loading patch:
  - Chrome memory jumped from around `1.8GB` to almost `6GB`.
- Root cause was likely eager/large analysis_artifacts loading and React render pressure.
- Fix:
  - deferred Fix Queue loading
  - capped artifact rows
  - compact API response
  - no raw payloads client-side.
- After patch, admin dashboard loaded around `1.5GB` memory in observed Task Manager state.
- Current freeze doctrine:
  - React is not the problem by itself.
  - The issue was data volume, eager loading, and render churn.
  - Do not change stack.
  - Keep admin/customer dashboards lazy, capped, equality-guarded, and manual-refresh oriented.
- No external "make site faster" service is needed for this specific issue.
- Continue to avoid broad dashboard rewrites.

- Current Launch Truth as of May 11 Morning
- Admin Delivery Gate v1 is now real.
- Admin Command Centre / Fix Queue v1 is now real but read-only.
- Maplewell source contradiction correctly held.
- Customer Dashboard now shows Under Review for admin-held jobs.
- Admin Dashboard still requires careful monitoring after the `useMemo` import fix and Command Centre display patch deploy.
- DocRaptor production still not flipped.
- Next immediate task is confirming Command Centre display after deploy, not more math patches.

### May 9 Maplewell True-Current-Debt Validation / Admin Review Doctrine Update
- Maplewell FINAL TEST 1 was run one step at a time.
  - Product: Full Underwriting.
  - Files:
    - `T12_Maplewell_Court.csv`
    - `Rent_Roll_Maplewell_Court.csv`
    - `Debt_Summary_Maplewell_Court.pdf`
    - `Property_Tax_Bill_Maplewell.pdf`
- Property-name display bug:
  - User entered `FINAL TEST 1` and later clean `Maplewell`.
  - The PDF initially rendered `FINAL 1` because `sanitizePropertyNameDisplayText()` removed standalone `test`.
  - Patch removed broad standalone `clean|messy|qa|test` stripping from `api/generate-client-report.js`.
  - Doctrine reinforced:
    - production property-name display must preserve user-entered property names as source-of-truth.
    - do not globally strip or flag words or numbers like Test, Final, Clean, Messy, QA, Screening, Underwriting, or trailing numbers.
- Debt parser/current mortgage issue:
  - Maplewell debt PDF explicitly stated:
    - Current Mortgage Statement
    - Existing mortgage / true current debt
    - Current outstanding principal balance: `$2,100,000`
    - Current monthly debt service: `$13,625`
    - Interest rate: `4.25%` fixed
    - Amortization remaining: `23 years`
    - not proposed acquisition financing.
  - Initial parser incorrectly treated it as `loan_term_sheet` / missing balance, causing current DSCR/refi not assessed.
  - Patch completed:
    - `api/parse/parse-doc.js`
    - `api/_lib/qa-director-review.js`
    - `tests/qa/supporting-doc-classification-smoke.js`
    - `tests/qa/qa-director-review-smoke.js`
  - Strong current mortgage/current balance language now routes to `mortgage_statement` before acquisition/term-sheet routing.
  - Current-debt aliases now extract:
    - `outstanding_balance = 2100000`
    - `monthly_payment/monthly_debt_service = 13625`
    - `interest_rate = 4.25`
    - `amort_years = 23`
  - QA Director no longer returns `no_missed_issue_detected` when high-severity public/high-value blockers exist in `qa_action_plan`.
  - Retest passed:
    - debt file parsed as `mortgage_statement`
    - current debt DSCR rendered
    - Debt Structure Summary showed balance, rate, monthly P&I, DSCR, amortization.
  - Preserve doctrine:
    - proposed/acquisition financing remains separate.
    - explicit current debt wins only with strong current/existing mortgage/current balance language.
- Rent-roll annual market rent contradiction:
  - Maplewell PDF rendered internally contradictory values:
    - Weighted Avg Market Rent: `$1,888/month`
    - Total Units: `48`
    - Annual Market Rent (Total): `$21,744,000`
    - implied average market rent = `$21,744,000 / 12 / 48 = $37,750/month/unit`.
  - This was not acceptable and should have been caught by QA as a named internal contradiction.
  - Patch completed:
    - `api/_lib/report-contract-qa.js`
    - `api/_lib/qa-action-plan.js`
    - `tests/qa/report-contract-qa-smoke.js`
  - Added deterministic `INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION`.
  - It compares:
    - `annual_market_rent_total / 12 / total_units` against `weighted_avg_market_rent / avg_market_rent`
    - `annual_in_place_rent_total / 12 / total_units` against `weighted_avg_in_place_rent / avg_in_place_rent`.
  - If materially different, it emits high-severity evidence including:
    - `total_units`
    - `annual_market_rent_total`
    - `weighted_avg_market_rent`
    - `implied_avg_market_rent`
    - `annual_in_place_rent_total`
    - `weighted_avg_in_place_rent`
    - `implied_avg_in_place_rent`.
  - Routed in QA Action Plan to:
    - `owner_area: rent_roll_normalizer`
    - `action_type: render_gating_fix_required`
    - `requires_code_patch: true`
    - `requires_regeneration: true`
    - `blocks_public_sample: true`
    - `blocks_high_value_outreach: true`
    - `blocks_customer_delivery: false` for now because QA remains advisory-only.
  - Retest confirmed the flag fires correctly on Maplewell.
  - Current issue still open:
    - bad `$21,744,000` annual market rent value still renders.
    - next patch must fix actual rent roll annual market rent normalization in generator/parser path.
    - expected annual market rent should reconcile to roughly `48 x $1,888 x 12 = $1.087M`.
- New Admin Review / Fix Queue doctrine:
  - User wants early-stage InvestorIQ to slow down operationally and use the 24-business-hour delivery window for quality review when needed.
  - Correct workflow:
    - Parser extracts values.
    - Deterministic validation/normalization builds source-of-truth artifacts.
    - Report renders internally.
    - QA detects parser misses, math contradictions, source/report inconsistencies, public-output issues, or high-severity render problems.
    - If high-severity issue exists, route to Admin Review / Fix Queue before customer notification.
    - Admin sees exact reason, source evidence, parsed artifact state, recommended fix owner area, and whether a code patch or structured override is needed.
    - Admin may manually enter or approve missing source-backed structured values only when supported by uploaded documents.
    - System regenerates deterministically.
    - Admin reviews final PDF.
    - Admin clicks `Notify User`.
    - Only then does the published report appear in the user dashboard and send report-ready email.
  - AI/QA may not silently change financial values.
  - AI/QA may challenge the classification of a flag and identify parser/render misses.
  - Admin-approved overrides must be structured, auditable, source-backed, and logged.
  - Future dashboard enhancement:
    - Add Admin Review Queue / Fix Queue to Admin Dashboard.
    - Cards should show:
      - report/property
      - severity
      - reason
      - owner area
      - source file/evidence
      - parsed artifact issue
      - recommended next step
      - buttons later: View Artifacts, View PDF, Apply Override / Confirm Source Value, Regenerate, Approve Delivery, Notify User.
  - Future statuses/lifecycle concepts to consider:
    - `generated_internal`
    - `admin_review_required`
    - `approved_for_delivery`
    - `published_to_customer`.
  - Launch doctrine:
    - fast when clean, reviewed when required.
    - customer-facing copy still says reports may take up to 24 business hours.
    - do not expose AI/model/vendor language publicly.

### May 8 Autonomous Publication Reliability Doctrine / 99.999% Target
- Strategic shift:
  - InvestorIQ must stop walking from roughly 85% to 89% to 91% to 92% to 93% by patching one report defect at a time.
  - The target is a major jump toward 99.999% autonomous report publication reliability this morning.
  - Public/high-value outputs must not depend on Rob manually reading every PDF to catch avoidable renderer, parser, source-treatment, or presentation defects.
- Reasonable-package standard:
  - Screening users must upload meaningful T12 and Rent Roll support.
  - Underwriting users must upload meaningful T12, Rent Roll, and supporting documents.
  - InvestorIQ is not expected to generate a defensible report from documents containing only 1-3 meaningless numbers.
  - For plausible real investor packages, InvestorIQ should recover, route, constrain, disclose, or fail closed intelligently instead of requiring repeated manual patching.
- Current QA stack already exists:
  - Rendered Report QA Advisory
  - Source-to-Report Coverage QA
  - Source Package QA
  - QA Manager Review
  - QA Action Plan
  - shared InvestorIQ QA Doctrine
  - shared InvestorIQ Institutional Report QA Checklist
- Recent defects that triggered the doctrine shift:
  - Top Positive Income Lines included EGI/subtotals/negative/zero rows.
  - Forest City showed a stable Expense Ratio as Primary Pressure Point.
  - Proposed acquisition financing vs current debt/refi display can still be confusing.
  - Empty or misleading current-debt/refi blocks can render when true current debt is missing.
  - AI QA and QA Manager improved the system, but advisory review does not make bad renderer output impossible by itself.
- Reliability principles:
  1. Stop patching examples; patch failure classes.
  2. Every recurring issue must become one of:
     - deterministic prevention rule
     - deterministic QA detection rule
     - AI analyst checklist item
     - AI Manager/Director escalation rule
     - customer-safe fail-closed rule
  3. AI QA is not enough by itself. Renderer/parser paths must make known-bad outputs impossible where possible.
  4. The QA checklist improves AI review, but hard Report Contract QA is needed to catch structural, renderer, and presentation defects deterministically.
  5. Add a top-level AI Director concept:
     - AI QA Analyst finds issues.
     - Source Package QA reviews document/artifact treatment.
     - QA Manager classifies/routes issues.
     - AI Director audits the QA stack itself and asks: "Did QA miss anything that would embarrass InvestorIQ or prevent safe publication?"
  6. AI Director must remain internal/advisory at first.
  7. AI Director may not mutate financial values, parser artifacts, reports, jobs, worker state, scores, DSCR, NOI, cap rates, valuations, refinance outputs, or publication state.
  8. Deterministic validation remains financial truth.
  9. AI Director's mission is to prevent missed QA, not to author reports.
  10. Ultimate product standard:
      - 99.999% of reasonably complete packages publish defensibly.
      - incomplete/contradictory/unusable packages fail closed with credit restored.
      - public/high-value outputs should not depend on Rob manually reading every PDF.
- Immediate next conversation agenda:
  - Do not immediately give Codex a broad implementation prompt.
  - First, in the fresh chat, reason through the complete universe of failure classes needed for 99.999% reliability.
  - Build a full elite guardrail taxonomy covering:
    - intake/doc-type routing
    - required-doc completeness
    - parser extraction
    - cross-document consistency
    - T12/rent-roll/debt/refi/cap-rate/math reconciliation
    - support-doc contamination
    - acquisition vs current debt separation
    - section gating
    - table integrity
    - classification/pressure-point coherence
    - public sample hygiene
    - final rendered report/presentation polish
    - QA false positives / false negatives
    - AI QA blind spots
    - AI Manager blind spots
    - AI Director oversight
    - customer-safe fail-closed behavior
    - publication reliability vs public/high-value readiness
  - Then decide the smallest high-leverage implementation plan that can jump the system toward 99.999% without burning Codex quota or destabilizing launch.
  - Preserve Codex usage discipline: 47% weekly remaining, must last until May 12.
  - No broad repo audit unless the fresh chat explicitly decides it is worth it.
  - No worker lifecycle changes unless absolutely required.
  - No parser/renderer refactors unless directly tied to a failure-class guardrail.
  - Keep DocRaptor in test mode until final outputs are clean.
- Current unresolved pre-Ken decision:
  - Whether to implement one broad deterministic Rendered Report Contract QA layer now.
  - Whether to add AI Director now or after one deterministic contract pass.
  - Whether AI Director should be a new artifact type, likely `qa_director_review`, feeding into `qa_action_plan`.
  - Whether public/high-value readiness should become stricter than customer delivery readiness while still aiming for nearly all customer reports to publish defensibly.

### May 8 99.999% QA Architecture / Report Contract / AI Director / Parser Hardening Milestone
- May 8 became the major anti-whack-a-mole implementation day.
- Strategic goal was to move InvestorIQ from approximately 85% manual QA confidence toward system-level autonomous publication reliability.
- Definition remains:
  - for reasonably complete real-world packages, InvestorIQ should either publish a defensible institutional document-driven report, or fail closed for a real source/document reason with credit restored.
  - InvestorIQ is not expected to publish from garbage, meaningless T12s, meaningless rent rolls, or documents with only 1-3 random numbers.
- Customer standard:
  - users are grown investors/operators, not children.
  - missing optional numbers should suppress or constrain affected sections, not necessarily fail the entire report.
  - missing/invalid core docs like unusable T12 or unusable rent roll may still fail closed.
  - reports should explain excluded or missing inputs where appropriate, without flooding raw `DATA NOT AVAILABLE` blocks.

#### Implemented Patch 1 - Report Contract QA
- Added deterministic internal `report_contract_qa` artifact.
- Files included:
  - `api/_lib/report-contract-qa.js`
  - `api/_lib/qa-action-plan.js`
  - `api/generate-client-report.js`
  - `tests/qa/report-contract-qa-smoke.js`
- Contract checks include:
  - public-language prohibitions
  - report-type leakage
  - income/expense table contracts
  - current debt vs acquisition financing separation
  - section gating
  - classification / pressure-point coherence.
- Wired `report_contract_qa` into report generation before `qa_action_plan`.
- `qa_action_plan` now routes contract violations without changing publication flow.
- This is internal/advisory/deterministic and does not mutate report values.

#### Implemented Patch 2 - Renderer Prevention For Known Visible Failure Classes
- File:
  - `api/generate-client-report.js`
- Added deterministic income-driver eligibility filtering.
- Added deterministic expense-driver eligibility filtering.
- Top Positive Income Lines now excludes:
  - totals/subtotals
  - EGI/GPR/NOI
  - vacancy/loss/concession/bad debt
  - zero/negative/non-finite rows.
- Top Expense Drivers now excludes:
  - totals/subtotals
  - income/NOI labels
  - zero/negative/non-finite rows.
- Primary Pressure Point now requires severity greater than zero.
- Stable metrics no longer become pressure points.
- DSCR >= `1.35x` no longer overrides as a pressure point.

#### Implemented Patch 3 / 3A - Stability Driver Suppression, Contract QA Calibration, And AI Director
- Files included:
  - `api/generate-client-report.js`
  - `api/_lib/report-contract-qa.js`
  - `api/_lib/qa-director-review.js`
  - `tests/qa/report-contract-qa-smoke.js`
  - `tests/qa/qa-director-review-smoke.js`
- Suppressed `Stability Drivers (Worst 3)` when all severities are zero.
- Calibrated `TOP_EXPENSE_DRIVERS_CONTRACT` to evaluate only the actual expense-driver subsection.
- Calibrated `PRIMARY_PRESSURE_POINT_STABLE_METRIC_CONTRACT` to inspect only the pressure-point line and allow constraining DSCR below `1.25x`.
- Added deterministic internal `qa_director_review` artifact after `qa_action_plan`.
- Director v1 checks for:
  - QA false positives
  - action-plan / contract mismatch
  - missed hard public-language blockers.
- AI Director / Director layer is internal and supervisory:
  - audits the QA stack itself
  - asks whether QA missed anything embarrassing or unsafe
  - does not mutate financial values
  - does not mutate report content
  - does not alter worker/publication state.

#### Implemented Patch 4 - Acquisition-Only Debt Render Path And Advisory Calibration
- Files included:
  - `api/generate-client-report.js`
  - `api/_lib/report-contract-qa.js`
  - `api/_lib/qa-review.js`
  - `api/_lib/source-package-qa.js`
  - `api/_lib/qa-manager-review.js`
  - `tests/qa/report-contract-qa-smoke.js`
- Acquisition-only debt now replaces the Debt Structure section with:
  - clean current-debt/refi limitation
  - separate Proposed Acquisition Debt Sizing.
- Current/refi headings and sensitivity blocks are suppressed when no true current outstanding debt balance exists.
- `report_contract_qa` allows clean acquisition-only limitation language but still flags current/refi headings or current DSCR/refi output without true current debt.
- Rendered QA, Source Package QA, and QA Manager now filter narrow false positives for:
  - clear break-even language
  - unsupported-doc disclosure
  - current-debt limitation
  - `Document-Constrained Review`
  - `Constrained`
  - methodology-language cases.
- Added smoke coverage for acquisition-only pass/fail and true-current-debt allowance.

#### Implemented Patch 5 - Current-Debt Limitation Contract QA Calibration
- Purpose:
  - Forest City PDF was visibly correct, but `report_contract_qa` still falsely blocked safe limitation language around Current Debt DSCR / `NOT ASSESSED`.
- Files:
  - `api/_lib/report-contract-qa.js`
  - `tests/qa/report-contract-qa-smoke.js`
- Updated contract QA to treat safe limitation shape as allowed when report states:
  - Current outstanding debt balance not provided
  - `NOT ASSESSED`
  - current debt service not assessed.
- Preserved hard failure for real contamination:
  - `Current Debt DSCR: 1.20x`
  - DSCR/refi output using proposed acquisition debt
  - refinance proceeds/debt balance output without true current debt
  - Refinance Stability Classification with no true current outstanding debt.

#### Validation Results From Live Reports
- Harbourstone Screening:
  - PASS
  - Screening stayed in scope
  - no underwriting/debt/refi/DCF/deal-score leakage
  - `report_contract_qa.contract_status = pass`
  - `qa_director_review.overall_director_decision = no_missed_issue_detected`
  - `qa_action_plan.customer_delivery_ready = true`
  - only expected public/high-value blocker was DocRaptor test mode.
- Forest City Full Underwriting acquisition-only / no true current debt:
  - PASS
  - visible PDF correctly shows Current Debt / Refinance Limitation first, then Proposed Acquisition Debt Sizing separately
  - no current DSCR/refi classification is rendered as if true current debt exists
  - `report_contract_qa.contract_status = pass`
  - `report_contract_qa.violations = []`
  - `qa_director_review.overall_director_decision = no_missed_issue_detected`
  - `qa_action_plan.customer_delivery_ready = true`
  - only expected public/high-value blocker was DocRaptor test mode.
- Mixed-slot upload test:
  - T12 and Rent Roll slot mixup succeeded where content was obvious and deterministic validation passed.
  - Confirms content authority / upload slot as hint doctrine.

#### Important Current QA Doctrine After May 8
- Whack-a-mole should now be treated as failure-class hardening, not report-example patching.
- Final confidence still requires running representative lane tests:
  - clean Screening
  - Full Underwriting with acquisition-only debt
  - Full Underwriting with true current debt
  - messy support docs / unsupported docs
  - renovation budget without ROI/rent lift
  - renovation plan with rent lift inputs
  - missing/bad core fail-closed
  - cross-document financial mismatch fail-closed.
- Report Contract QA + AI Director do not guarantee that garbage docs publish.
- They are designed to catch/prevent visible embarrassing report-structure failures and QA false-negative gaps.

#### Synthetic Validation Fixture Issue
- Gemini/Codex-style synthetic validation packages were created for six remaining lanes:
  1. true current debt underwriting
  2. messy unsupported support docs
  3. structured renovation with no ROI inputs
  4. structured renovation with rent lift
  5. bad core missing rent roll
  6. cross-document financial mismatch.
- Initial uploadable fixture package used T12/Rent Roll CSV and support-doc PDFs.
- All six failed initially.
- Investigation of TEST 1 / Maplewell showed:
  - Rent Roll parsed
  - Debt Summary parsed
  - Property Tax parsed
  - T12 failed with `invalid_core_t12_values:invalid_effective_gross_income`.
- This was not a QA architecture failure.
- It exposed a real parser robustness gap:
  - T12 CSV visibly contained core line items and values.
  - Parser still failed because the T12 path was too narrow around headers/coverage.
  - Example T12 had header `Line Item,TTM Amount`.
  - System should not fail merely because value column is named `TTM Amount` instead of `Annual Total`.

#### Implemented Patch 6A - T12 Parser Core-Value Acceptance And Alias Maps
- Files:
  - `api/parse/parse-doc.js`
  - `tests/qa/t12-core-summary-smoke.js`
- Added centralized T12 alias maps for:
  - Effective Gross Income
  - Gross Potential Rent
  - Vacancy/Loss
  - Total Operating Expenses
  - NOI
  - Other Income
  - expense lines
  - value columns.
- Added value-column support for labels including:
  - Annual Total
  - Annual Amount
  - Annual
  - T12
  - T-12
  - TTM
  - TTM Amount
  - TTM Total
  - Trailing 12
  - Trailing Twelve
  - Trailing Twelve Months
  - Last Twelve Months
  - LTM
  - LTM Amount
  - T-12 Total
  - Total
  - Amount
  - Value
  - Actual / Actuals
  - Current Year
  - Year End / Year-End
  - Fiscal Year
  - FY / FY Total
  - CY / CY Total
  - Current Period / Period Total
  - Year to Date / YTD / YTD Actual / YTD Total.
- Preserved valid EGI/OpEx/NOI summary rows when deterministic core equation validation passes.
- Added warnings for:
  - `t12_core_values_accepted_from_summary_rows`
  - `limited_t12_line_item_detail`.
- Confidence is capped lower for summary-only acceptance.
- Fail-closed behavior preserved for:
  - bad NOI equations
  - sparse random values
  - invalid EGI/OpEx/NOI
  - non-reconciling T12 core values.
- Smoke test proves:
  - Maplewell-style `Line Item, TTM Amount` now parses
  - alias summary rows parse
  - bad NOI equation fails
  - random sparse values fail.

#### Implemented Patch 6B - Rent Roll Parser Alias Hardening
- Files:
  - `api/parse/parse-doc.js`
  - `tests/qa/rent-roll-alias-smoke.js`
- Added centralized Rent Roll alias maps for:
  - Unit / Suite / Unit Number / Unit # / Apt / Apartment / Door / Premises
  - Unit Type / Bedroom Type / Beds / BR / Floor Plan / Model / Configuration
  - Status / Occupancy Status / Lease Status / Occupied / Vacant / Available
  - In-Place Rent / Current Rent / Rent / Monthly Rent / Contract Rent / Actual Rent / Tenant Rent
  - Market Rent / Asking Rent / Legal Rent / Target Rent / Pro Forma Rent / Stabilized Rent / Projected Rent / Post-Reno Rent / Renovated Rent
  - Sq Ft / SQFT / SF / Area / Square Feet / Rentable SF / RSF / Unit Area
  - lease date helper aliases
  - summary aliases for total units, occupied units, vacant units, and occupancy.
- Wired aliases into rent roll header detection.
- Preserved existing unit-row validation and market-vs-in-place rent separation.
- Added status occupancy handling for leased/current/tenant vs vacant/available.
- Smoke tests prove:
  - `Suite, Bedroom Type, Occupancy Status, Current Rent, Asking Rent, SF` parses
  - `Unit #, BR, Status, Monthly Rent, Target Rent, Area` parses
  - `Apt, Layout, Lease Status, Contract Rent, Pro Forma Rent, SqFt` parses
  - vague totals with no credible unit/rent structure still fail.

#### Implemented Patch 6C - Supporting Document Classification Aliases
- Files:
  - `api/parse/parse-doc.js`
  - `tests/qa/supporting-doc-classification-smoke.js`
- Added centralized supporting-doc classification aliases.
- Hardened current mortgage vs proposed acquisition financing separation.
- Expanded property tax and renovation/CapEx content signatures.
- Unsupported market/appraisal/ESA docs remain unclassified.
- No parser modeling/math/output changes beyond routing classification.
- Smoke tests prove:
  - existing mortgage/current balance classifies as `mortgage_statement`
  - proposed acquisition financing with borrower TBD classifies as `loan_term_sheet`
  - property tax notice classifies as `property_tax`
  - historical CapEx note classifies as `renovation`
  - unsupported market/appraisal/ESA remains `supporting_documents_unclassified`.

#### May 8 Parser Doctrine
- Alias matching identifies candidate fields.
- Deterministic validation decides acceptance.
- Core T12 rows with EGI/OpEx/NOI should parse if the accounting equation validates.
- T12/Rent Roll should not fail because of normal real-world label variation.
- Do not loosen validation to accept garbage.
- Do not use market/target/pro forma rent as in-place rent.
- Do not use proposed/acquisition financing as true current debt.
- Do not use unsupported market/appraisal/ESA docs as controlling modeled inputs.
- Textract helps with PDF/image extraction, but CSV/XLSX parsing still needs robust deterministic header/label handling.

#### Current Immediate Next Step After May 8
- Patch the actual Maplewell annual market rent normalization bug next.
- Do not rerun all six synthetic packages at once.
- Keep Maplewell as the only immediate visible math regression.
- Expected Maplewell result:
  - debt/current-mortgage parser lane passes
  - current debt DSCR renders
  - Report Contract QA flags the rent-roll contradiction
  - annual market rent normalizes to the weighted-average source of truth
  - the PDF no longer renders an impossible annual market rent value.

### May 7 Security, Dashboard Freeze, Intake Rescue, and QA Occupancy Calibration
- Supabase Security Advisor triage:
  - Supabase Security Advisor was reduced from launch-critical errors/warnings to only two accepted warnings.
  - Security Patch 1:
    - RLS enabled on `public.stripe_events`
    - RLS enabled on `public.credit_transactions`
    - RLS enabled on `public.report_credits`
    - `public.view_user_dashboard` changed to `security_invoker`
    - `public.view_user_dashboard` revoked from anon/authenticated
    - Dashboard smoke passed afterward.
  - Function EXECUTE hardening:
    - anon execute removed from inspected functions
    - authenticated execute preserved only for customer Dashboard RPCs:
      - `consume_purchase_and_create_job(text, jsonb, jsonb)`
      - `queue_job_for_processing(uuid)`
    - `service_role` retained for server/internal functions.
  - Function `search_path` hardening:
    - fixed `search_path=public` on linted functions including:
      - `__handle_new_user_old`
      - `add_credit`
      - `add_report_credits`
      - `nullify_empty_property_name`
      - `set_updated_at`
      - `consume_revision_slot`
      - `consume_purchase_and_create_job`
      - `get_all_profiles_for_admin`
      - `get_all_purchases_for_admin`
  - Storage hardening:
    - removed broad `staged_uploads` ALL policy
    - replaced with authenticated INSERT-only `staged_uploads` policy
    - removed universal authenticated storage upload policy with `check_expression=true`
    - Dashboard upload smoke passed.
  - Remaining accepted warnings:
    1. `public.queue_job_for_processing(p_job_id uuid)` remains SECURITY DEFINER and executable by authenticated users temporarily. Generate Report depends on this RPC. Inspection showed `analysis_jobs` has select/insert-own policies but no narrow authenticated UPDATE policy, and `analysis_job_events` insert is service-role-only. Switching to SECURITY INVOKER now could break queueing/report generation. The function is internally `auth.uid()` / `user_id` ownership-guarded and only queues eligible jobs. Later hardening must add narrow RLS policies, convert to SECURITY INVOKER if safe, and retest Dashboard upload/generate/worker/publish/failure behavior.
    2. Leaked Password Protection remains disabled because Supabase requires Pro Plan for HaveIBeenPwned protection. Other password rules were strengthened where available.
- Dashboard freeze / root-cause work:
  - Uploaded/reference file `INVESTORIQ_DASHBOARD_FREEZE_RCA.md` was reviewed.
  - V2/Emergent RCA identified three applied fixes:
    - `SupabaseAuthContext` auth-event short-circuit
    - `Dashboard.jsx` fetch in-flight/equality guards
    - dead Dashboard `useEffect` cleanup
  - `Dashboard.jsx` guards had already been applied earlier.
  - May 7 Codex investigation confirmed remaining render-storm source was `SupabaseAuthContext` auth/profile churn:
    - `handleSession` reprocessed every auth event
    - `fetchProfile` wrote `setProfile(data || null)` every time, even for identical profile rows
    - Dashboard guards were already present.
  - Patch applied in `src/contexts/SupabaseAuthContext.jsx`:
    - added last token/user tracking refs
    - short-circuits repeated auth events when access token and user id are unchanged
    - added shallow profile equality helper
    - skips `setProfile` when incoming profile row is identical
    - preserves sign-in, sign-out, token refresh, user-change, profile error, and loading behavior
    - clears refs on sign-out.
  - Validation:
    - `npm run build` passed
    - `git diff --check` passed.
  - Manual early retest:
    - Dashboard upload/property typing/navigation/Stripe checkout return worked
    - no obvious profiles request spam seen
    - Dashboard freeze status is improved but still monitored, not declared permanently solved.
  - If freezing still occurs after this patch, next steps are the RCA's optional long-term items:
    - split `Dashboard.jsx` into memoized zones
    - move polling/fetching into custom `useDashboardData(profileId)`
    - consider Supabase Realtime later
    - do not jump to those unless freeze persists.
- Intake-rescue Patch 2:
  - Forest City MIXUP retest used:
    - Rent Roll XLSX uploaded normally
    - `RenovationBudget.docx` uploaded into T12 slot
    - T12 PDF uploaded as Supporting.
  - Patch applied in `api/parse/parse-doc.js`:
    - required-slot rescue now detects strong supporting-doc types when declared `doc_type` is `t12` or `rent_roll`
    - supports reroute to `loan_term_sheet`, `mortgage_statement`, `renovation`, `appraisal`, `property_tax`, `insurance_policy`, `bank_statement`
    - filename-assisted renovation detection is disabled in required-slot rescue
    - `parser_doc_type_rescue` remains pending-validation style, not pre-accepted.
  - Forest City MIXUP result:
    - `ForestCityManor_RentRoll.xlsx` final `doc_type=rent_roll`, parsed
    - `ForestCityManor_RenovationBudget.docx` final `doc_type=renovation`, parsed
    - `ForestCityManor_T12_2024-2025.pdf` final `doc_type=t12`, parsed
    - report published
    - no `insufficient_t12_text_coverage` confusion from renovation file
    - renovation section rendered structured budget rows with total budget `$1,850,000`.
  - Intake-rescue Patch 2 status: PASS.
- Source-to-Report Coverage QA occupancy calibration:
  - Forest City MIXUP exposed an internal QA artifact mismatch:
    - PDF rendered occupancy correctly as `96.0%`
    - `source_report_coverage_qa` initially showed `rent_roll_parsed.occupancy = 0.75`.
  - Codex investigation confirmed:
    - renderer uses trusted `rentRollPayload.totals.occupancy` for partial/sample rent rolls when summary totals exist
    - `source_report_coverage_qa` inventory was reading top-level/detail-derived occupancy first.
  - Patch applied:
    - `api/_lib/source-report-coverage-qa.js`
    - `tests/qa/source-report-coverage-qa-smoke.js`.
  - New QA inventory hierarchy:
    1. `rentRoll.totals.occupancy` when finite and `0 <= value <= 1`
    2. `totals.occupied_units / totals.total_units` when valid
    3. existing top-level `occupancy` / `occupancy_rate` / `physical_occupancy` fallback.
  - Smoke test added for top-level `0.75` vs trusted totals `0.96`; expected QA inventory occupancy `0.96`.
  - Forest City MIXUP retest after patch:
    - PDF occupancy still `96.0%`
    - `source_report_coverage_qa.artifact_inventory.rent_roll_parsed.occupancy` now `0.96`
    - old `0.75` mismatch fixed.
  - This was internal QA calibration only; parser output, report rendering, report math, worker lifecycle, Dashboard, and QA blocking behavior were not changed.
- Current state / next testing:
  - Supabase security triage effectively complete with two accepted warnings documented.
  - Dashboard root-cause auth-context patch deployed/tested early, still monitoring.
  - Forest City MIXUP intake rescue passed.
  - QA occupancy mismatch fixed and retested.
  - Next Ken-readiness work should be one thing at a time.
  - Recommended next single test:
    - continue Dashboard idle stability monitoring first
    - then run one clean Full Underwriting with debt/current-loan support when ready.
  - Do not close user's Chrome tab group as part of testing; user relies on grouped tabs reopening daily.
  - Continue one-step-at-a-time workflow.

### May 7 AI QA Doctrine / Source Package QA / QA Manager Milestone
- Shared launch doctrine module created:
  - `api/_lib/investoriq-qa-doctrine.js`.
- Doctrine locks:
  - uploaded documents are the universe
  - filename and upload slot are hints only
  - document content is authority
  - deterministic parsers and validated artifacts are modeled truth
  - deterministic calculations are financial truth
  - AI QA may challenge but may not override accepted values
  - any financial value affecting rent, occupancy, income, expenses, NOI, debt, DSCR, cap rate, valuation, refinance, score, or classification must be document-supported and deterministically validated or admin-approved
  - no BUY / SELL / HOLD
  - no public AI/model/vendor language
  - no guarantees/risk-free/error-free/fabricated certainty
  - missing/unusable data must be suppressed, section-gated, or disclosed
  - unsupported/unstructured uploads may be listed and explicitly excluded from modeled outputs
  - clean limitation disclosure is acceptable
  - raw `DATA NOT AVAILABLE` flooding should be avoided where V1 safely collapses sections.
- Files now wired to shared doctrine:
  - `api/_lib/qa-review.js`
  - `api/_lib/source-package-qa.js`
  - `api/_lib/qa-manager-review.js`
  - `api/_lib/qa-action-plan.js`
  - `tests/qa/qa-doctrine-smoke.js`.
- Source Package QA:
  - `source_package_qa_advisory` now exists and runs on `gpt-4o-2024-08-06` when env is set to:
    - `QA_SOURCE_PACKAGE_MODEL=gpt-4o`
    - `QA_REVIEW_MODEL=gpt-4o`
  - Reviews uploaded file inventory, parse statuses/errors, parsed artifact summaries, source coverage QA, rendered QA, and rendered report text.
  - Internal/advisory-only and cannot mutate report values, artifacts, parser output, worker state, or publication state.
  - May challenge parser misses, ignored docs, false unsupported classifications, source/report inconsistencies, and likely QA false positives.
- QA Manager Review:
  - added `api/_lib/qa-manager-review.js`
  - artifact type: `qa_manager_review`
  - model fallback:
    - `QA_MANAGER_MODEL`
    - then `QA_SOURCE_PACKAGE_MODEL`
    - then `QA_REVIEW_MODEL`
    - then `OPENAI_REPORT_QA_MODEL`
    - then safe default
  - recommended explicit launch env:
    - `QA_MANAGER_MODEL=gpt-4o`
    - `QA_SOURCE_PACKAGE_MODEL=gpt-4o`
    - `QA_REVIEW_MODEL=gpt-4o`
  - reviews:
    - `rendered_report_qa_advisory`
    - `source_package_qa_advisory`
    - `source_report_coverage_qa`
    - `qa_fix_routing`
    - `report_qa_flags`
    - rendered report text
  - classifies decisions into:
    - `real_parser_or_artifact_risk`
    - `real_source_report_contradiction`
    - `real_public_language_risk`
    - `source_document_limitation`
    - `production_config_only`
    - `false_positive`
    - `admin_review_optional`
    - `no_action`
  - Advisory-only and cannot output replacement financial values or mutated report copy.
- QA Action Plan integration:
  - `qa_action_plan` now optionally consumes `qaManagerReview`.
  - QA Manager decisions can suppress rendered/source-package false positives.
  - Deterministic hard rules still win.
  - Actual rendered excerpts are the source for public-language escalation, not speculative AI suggestions.
  - Customer delivery must not be blocked unless there is actual prohibited public language or deterministic evidence confirms a source/report contradiction or parser/artifact defect.
  - QA Manager decisions are advisory and cannot change deterministic financial values.
- Latest 124 Richmond validation after QA Manager calibration:
  - Latest Full Underwriting PDF remained materially strong:
    - `100.0%` occupancy
    - NOI `$72,170`
    - DSCR `1.09x`
    - Refinance Shortfall Under Stress
    - detailed T12 line items
    - rent roll distribution
    - scorecard capped at `Review - Debt Coverage Constraint`
    - clear methodology and data transparency language
    - unsupported/unstructured uploads explicitly excluded from modeled outputs.
  - Latest artifacts:
    - `source_report_coverage_qa = pass`
    - `deterministic_flags = []`
    - `source_package_qa_advisory` exists
    - `qa_manager_review` exists and used `gpt-4o-2024-08-06`
    - `qa_action_plan.customer_delivery_ready = true`
    - `qa_action_plan.requires_code_patch = 0`
    - `qa_action_plan.safe_to_regenerate_now = true`.
  - `qa_action_plan` now contains only:
    - `DOCRAPTOR_NOT_PRODUCTION_MODE` as the public/high-value blocker
    - `MARKET_SURVEY_CLASSIFICATION_REVIEW` downgraded to `no_action_false_positive`.
  - Prior noisy items were correctly classified by QA Manager as false positives and did not become action-plan blockers:
    - unsupported document reference
    - Sensitized term usage.
- Current launch implication:
  - AI QA architecture is no longer just a smoke alarm.
  - Current architecture:
    - AI QA Analyst finds issues.
    - AI QA Manager judges issues.
    - deterministic `qa_action_plan` routes only valid actions.
    - AI cannot mutate financial truth.
  - This is the major anti-whack-a-mole milestone.
  - The only current public/Ken blocker for the latest 124 Richmond test is DocRaptor production mode / watermark.
  - Do not flip DocRaptor production until final clean public-candidate package is selected and test-mode output is clean.
  - Continue one thing at a time.

### May 6 Intake Resilience / Reversed-Document Hardening
- Launch-critical intake doctrine is now explicit:
  - Upload slot is a hint.
  - Filename is a hint.
  - Document content is the authority.
  - Deterministic validation is the gatekeeper.
  - Users may upload documents into the wrong slots, especially real-world customers who are busy, rushed, non-technical, or dyslexic.
  - InvestorIQ must safely inspect content and reroute obvious mismatches where possible.
  - Rerouting is allowed only when downstream deterministic validation passes.
  - If validation fails, fail closed with clear report-type-specific messaging.
  - Do not fabricate values.
  - Do not loosen validation.
  - Do not use filename as primary truth.
  - Do not expose AI/model/vendor/internal parser language publicly.
  - No BUY/SELL/HOLD.
  - No worker lifecycle redesign unless separately justified.
- This doctrine is required before Ken Dunn, syndicate members, public samples, or broader early-user exposure. The standard is not "hope users upload perfectly." The standard is "recover when content is obvious, fail closed when not defensible, and explain clearly."

### May 6 Validation Scoreboard
- 124 Richmond Clean 3: PASS.
- 124 Richmond Messy 3: PASS.
- 124 Richmond Messy Screening: PASS.
- Harbourstone reversed-doc Underwriting before T12 line-item patch: published, but QA correctly found missing T12 line-item detail.
- Harbourstone reversed-doc Underwriting after line-item patch: PASS, source coverage pass, `requires_code_patch: 0`.
- Forest City Underwriting correct-slot: PASS / customer-deliverable, with current-debt/acquisition-financing wording polish only.
- Forest City Screening reversed-doc: PASS after PDF T12 rescue-signature and Dashboard failed-state patches.

### May 6 124 Richmond Validation Results
- Renovation Strategy collapse/polish patch completed in `api/generate-client-report.js`.
- Root issue:
  - `renovation_parsed` existed for 124 Richmond but no verified total budget, no budget rows, no scope rows, and no structured CapEx amount existed.
  - The report was rendering weak/empty institutional-looking renovation scaffolding.
- Implemented behavior:
  - no empty Renovation Strategy budget/execution tables when no structured CapEx exists
  - concise limitation wording: "Uploaded renovation support was identified, but no verified structured CapEx budget was extracted. No renovation return, rent lift, ROI, or payback analysis is modeled."
  - no parser, worker, QA blocking, lifecycle, or financial logic changed.
- 124 Richmond Clean 3 passed:
  - `source_report_coverage_qa: pass`
  - `qa_action_plan.requires_code_patch: 0`
  - `customer_delivery_ready: true`
  - `deterministic_flags: []`
  - T12 line items rendered
  - current debt/refi/DSCR rendered
  - renovation empty table removed.
- 124 Richmond Messy 3 passed:
  - `source_report_coverage_qa: pass`
  - `qa_action_plan.requires_code_patch: 0`
  - `customer_delivery_ready: true`
  - `deterministic_flags: []`
  - messy T12 line items rendered, including vacancy allowance
  - current debt/refi/DSCR rendered
  - renovation empty table removed.
- 124 Richmond Messy Screening passed:
  - Screening compression held
  - no underwriting/debt/refi/DCF/deal-score bloat
  - T12 and rent roll verified
  - `customer_delivery_ready: true`
  - only DocRaptor test mode / sample packaging remained as public blockers.

### May 6 Harbourstone Reversed-Document Rescue
- User intentionally uploaded the T12 file into the Rent Roll slot and the rent roll file into the T12 slot.
- Before rescue, Harbourstone failed and Dashboard blamed `rent_roll_ai_recovery_source.txt` as the T12, exposing both doc-type routing weakness and misleading failed-state guidance.
- Patch B implemented in `api/parse/parse-doc.js`:
  - strict content-signature detection for non-tabular required financial docs
  - reroutes declared `rent_roll` to `t12` when T12 anchors are strong
  - reroutes declared `t12` to `rent_roll` when rent-roll anchors are strong
  - deterministic parser/recovery validation still controls artifact acceptance
  - writes internal `parser_doc_type_rescue` worker event with declared/detected doc type and rescue fields.
- Follow-up truth patch:
  - `parser_doc_type_rescue` no longer claims `rescue_accepted: true` before validation
  - now uses `rescue_accepted: null`, `rescue_stage: "rerouted_before_validation"`, and `rescue_validation_status: "pending_parser_validation"`
  - actual accepted artifacts remain the proof of acceptance.
- Harbourstone reversed-doc retest passed:
  - report published
  - `t12_ai_recovery_source.txt` final doc_type became `t12`
  - `rent_roll_ai_recovery_source.txt` final doc_type became `rent_roll`
  - AI rent-roll recovery accepted
  - T12 parsed
  - `source_report_coverage_qa` passed
  - `qa_action_plan.requires_code_patch` became `0` after later T12 line-item patch
  - `customer_delivery_ready: true`.
- Product conclusion:
  - content-based doc-type rescue works for TXT reversed T12/Rent Roll packages.

### May 6 Harbourstone T12 Line-Item Extraction Patch
- Harbourstone initially published safely after reversed-doc rescue but rendered lump-sum T12 because T12 expense line items did not reconcile.
- QA correctly flagged:
  - `T12_LINE_ITEM_DETAIL_MISSING`
  - `FULL_UNDERWRITING_SUPPORT_UNDERUSED`.
- Root cause:
  - `extractT12LineItemsFromText` did not recognize Harbourstone-style labels:
    - `Real estate taxes`
    - `Payroll / admin`
    - `Garbage / misc`
  - and needed support for `other income / laundry / parking`.
- Patch completed in:
  - `api/parse/parse-doc.js`
  - `tests/qa/t12-line-items-smoke.js`.
- Added deterministic line-label support only.
- No core T12 extraction, validation, worker lifecycle, QA blocking, or report generation changed.
- Retest passed:
  - Harbourstone Apartments 2 published
  - T12 `income_line_count: 3`
  - T12 `expense_line_count: 7`
  - expense rows sum to `$425,000`
  - lump-sum T12 fallback disappeared
  - `source_report_coverage_qa: pass`
  - `deterministic_flags: []`
  - `qa_action_plan.requires_code_patch: 0`
  - `customer_delivery_ready: true`
  - only DocRaptor test mode and low market-survey no-action note remained.
- Rendered expense rows included:
  - Property Taxes `$124,000`
  - Insurance `$42,500`
  - Utilities `$82,000`
  - Repairs & Maintenance `$78,000`
  - Management Fee `$36,000`
  - Payroll / Admin `$44,500`
  - Garbage / Miscellaneous `$18,000`.

### May 6 Forest City Reversed Screening Issue and Patch
- User intentionally reversed Forest City Screening docs:
  - T12 PDF uploaded through Rent Roll slot
  - Rent Roll XLSX uploaded through T12 slot.
- Forest City Underwriting passed when docs were not reversed.
- Forest City Screening failed with `MISSING_STRUCTURED_FINANCIALS`, missing `["t12"]`.
- Artifact truth:
  - Forest City Rent Roll XLSX uploaded into T12 slot was correctly detected as `rent_roll` and parsed.
  - Forest City T12 PDF uploaded into Rent Roll slot had extracted text with clear T12 anchors:
    - Gross Potential Rent
    - Vacancy Loss
    - Effective Gross Income
    - Expenses
    - Total Expenses
    - Net Operating Income.
  - No `parser_doc_type_rescue` event appeared.
- Codex investigation found:
  - rescue did run for non-tabular/PDF-capable files, but content signature was too strict
  - detection counted `Total Operating Expenses` / `Operating Expenses`, but not `Total Expenses` or `Vacancy Loss`
  - therefore detected type remained `unknown` and the PDF stayed in the rent-roll path.
- Patch applied:
  - `api/parse/parse-doc.js` added `VACANCY LOSS` and `TOTAL EXPENSES` to strong T12 text rescue signature.
- Separate Dashboard bug found:
  - `failedJobsForDisplay` was built from `inProgressJobs`
  - `fetchInProgressJobs` excludes `failed`
  - therefore failed job notices could disappear from the main list
  - `fetchLatestFailedJob` also omitted `report_type`.
- Dashboard patch applied:
  - failed-job notices now come from `recentJobs`, which includes `failed`
  - latest failed job query includes `report_type`
  - failed-state labels now show report type, so Screening vs Underwriting failures are clear.
- Validation passed:
  - `node --check api/parse/parse-doc.js`
  - `node tests/qa/t12-line-items-smoke.js`
  - `git diff --check -- api/parse/parse-doc.js src/pages/Dashboard.jsx`
  - `npm run build`.
- Retest after patch:
  - T12 PDF intentionally uploaded through Rent Roll slot.
  - Rent Roll XLSX intentionally uploaded through T12 slot.
  - Result: PASS.
  - Screening published.
  - `ForestCityManor_T12_2024-2025.pdf` ended as `doc_type: t12` and parsed.
  - `ForestCityManor_RentRoll.xlsx` ended as `doc_type: rent_roll` and parsed.
  - `t12_parsed` exists.
  - `rent_roll_parsed` exists.
  - `source_report_coverage_qa: pass`.
  - `deterministic_flags: []`.
  - `qa_action_plan.requires_code_patch: 0`.
  - `customer_delivery_ready: true`.
  - `safe_to_regenerate_now: true`.
  - Only remaining blocker was `DOCRAPTOR_NOT_PRODUCTION_MODE` for public/Ken sample use.

### May 6 Intake-Resilience Audit Findings
- Files inspected:
  - `api/parse/parse-doc.js`
  - `api/parse/extract-job-text.js`
  - `api/admin-run-worker.js`
  - `src/pages/Dashboard.jsx`
  - `api/parse/classify-documents.js`.
- Current intake-rescue coverage:
  - `rent_roll` vs `t12`:
    - Tabular XLSX/CSV: content classifier can detect `rent_roll` vs `t12` and update `analysis_job_files.doc_type`.
    - Non-tabular PDF/TXT/DOC text: required-doc rescue can detect strong `rent_roll` vs `t12` mismatch and reroute before parser validation.
  - Supporting docs uploaded as `supporting_documents`:
    - text inference can classify `loan_term_sheet`, `mortgage_statement`, `appraisal`, `property_tax`, `insurance_policy`, `bank_statement`, `renovation`.
  - Supporting docs uploaded as `loan_terms`:
    - worker normalizes to `loan_term_sheet`.
  - Debt/acquisition/renovation uploaded into wrong supporting slot:
    - mostly covered if routed through `supporting_documents`.
- Known gaps:
  - P0: Core docs in supporting slot are not rescued. A clear T12/rent roll uploaded as supporting may remain unclassified or wrong supporting type, so worker may fail missing required artifacts.
  - P0: Supporting docs in required slots are not rescued to supporting types. A loan term sheet, mortgage statement, renovation budget, appraisal, or tax bill uploaded into T12/rent-roll slot may be forced through required parser logic and fail.
  - P1: Worker uses jobFiles fetched before `extract-job-text`; later doc-type changes rely on subsequent worker passes. Refreshing file rows after extraction/classification would be cleaner.
  - P1: Dashboard guidance still infers failed file cause from current `analysis_job_files.doc_type`; better source is `worker_event` `missing_structured_financials.missing` plus report type.
  - P2: `classify-documents.js` is separate from parse-time inference and may not reflect newer parser rescue rules.
- Smallest safe patch plan:
  1. Extend `inferDocTypeFromText` for supporting docs to return `t12` and `rent_roll` when strong required-doc content is present.
  2. Extend required-doc text rescue to detect strong supporting-doc types (`loan_term_sheet`, `mortgage_statement`, `renovation`, `appraisal`, `property_tax`) when uploaded into `rent_roll` or `t12`, and reroute only when content is strong.
  3. Refresh `analysis_job_files` after `extract-job-text` before worker decides missing structured docs.
  4. Dashboard guidance should prefer `worker_event` `missing_structured_financials.missing` plus report type over guessing from one failed file row.
- What not to patch before Ken:
  - no broad new upload classifier service
  - no validation loosening
  - no AI as authoritative
  - no worker lifecycle redesign
  - no QA blocking
  - no Dashboard polling/refresh redesign.
- Patch 1 completed:
  - file: `api/parse/parse-doc.js`
  - root cause: supporting-doc inference did not consider strong required-financial content
  - patch reused `detectRequiredFinancialDocTypeFromText(text)` inside `inferDocTypeFromText`
  - strong T12 content uploaded as Supporting can now infer `t12`
  - strong rent-roll content uploaded as Supporting can now infer `rent_roll`
  - existing deterministic parser branches remain the acceptance gate.
- Patch 1 validation passed:
  - `node --check api/parse/parse-doc.js`
  - `node tests/qa/t12-line-items-smoke.js`
  - `git diff --check -- api/parse/parse-doc.js`.

### May 6 Evening Immediate Resume Point
- Immediate next task:
  - Run support-slot rescue tests after Patch 1.
- Retest 1:
  - Forest City Screening: T12 PDF uploaded as Supporting, Rent Roll XLSX uploaded normally.
- Retest 2:
  - Forest City Screening: Rent Roll XLSX uploaded as Supporting, T12 PDF uploaded normally.
- Pass criteria:
  - final `doc_type` becomes `t12` or `rent_roll` as appropriate
  - `t12_parsed` exists
  - `rent_roll_parsed` exists
  - Screening publishes
  - `source_report_coverage_qa: pass`
  - `deterministic_flags: []`
  - `qa_action_plan.requires_code_patch: 0`
  - if anything fails, Dashboard visibly shows failed Screening job with report type.
- After that:
  - run/review the next smallest intake-rescue patch from the audit:
    - Patch 2: supporting-doc-in-required-slot rescue
    - then refresh `analysis_job_files` after extraction only if stale file-row behavior is proven to cause a real issue
  - keep patching one small validated intake-rescue gap at a time
  - do not build a broad classifier service before Ken
  - do not change worker lifecycle unless stale file-row behavior is proven to cause a real issue.

### Ken / External-User Intake Readiness Warning
- Before opening InvestorIQ to Ken Dunn, syndicate members, or dozens of early users, intake resilience must be treated as launch-critical.
- Required pre-Ken test matrix:
  - clean Screening correct slots
  - clean Underwriting correct slots
  - messy Screening correct slots
  - messy Underwriting correct slots
  - T12/Rent Roll reversed Screening
  - T12/Rent Roll reversed Underwriting
  - T12 uploaded as Supporting
  - Rent Roll uploaded as Supporting
  - obvious loan/debt/renovation/tax/appraisal uploaded into wrong required slot
  - missing required document fail-closed
  - Dashboard visibly shows failed job with report type
  - credit restored on pre-publication platform failure
  - `qa_action_plan.requires_code_patch = 0` for public candidate reports.
- Clean final public/Ken samples should use clean property names and clean filenames manually.
- DocRaptor production mode remains required before public/Ken sample sharing.

### May 6 Night Supabase Security Advisor Update
- Supabase Security Advisor flagged launch-critical security lints:
  - `public.view_user_dashboard` SECURITY DEFINER
  - RLS disabled on `public.stripe_events`, `public.credit_transactions`, `public.report_credits`
  - SECURITY DEFINER functions executable by anon/public
  - `staged_uploads` bucket listing policy too broad.
- Codex security audit found:
  - `view_user_dashboard` has no repo references
  - `stripe_events` is server-only in `api/webhook.js` using service role
  - `credit_transactions` has no repo references
  - `report_credits` table has no repo references and is separate from `profiles.report_credits` column
  - `legal_acceptances` is server-only in `api/legal-acceptance.js` using service role
  - `staged_uploads` upload is needed, but listing/download is not used by frontend
  - `consume_purchase_and_create_job` and `queue_job_for_processing` are active authenticated Dashboard RPCs
  - worker/admin RPCs are server-only and should not be anon callable
  - admin dashboard RPCs must enforce admin server-side.
- Security Patch 1 was applied manually in Supabase SQL:
  - enabled RLS on `public.stripe_events`
  - enabled RLS on `public.credit_transactions`
  - enabled RLS on `public.report_credits`
  - set `public.view_user_dashboard` to `security_invoker`
  - revoked `public.view_user_dashboard` access from anon and authenticated.
- Immediate smoke result after Security Patch 1:
  - Dashboard still loads
  - credits still display
  - Report History still loads
  - upload UI still appears
  - no immediate visible Dashboard break
  - rollback not needed.
- Superseded by May 7 security triage:
  - Supabase Advisor is now down to two accepted warnings documented above.
  - Function grants, `search_path`, and `staged_uploads` policy hardening were completed and smoke-tested.
  - Remaining security follow-up is controlled later hardening of `queue_job_for_processing` after narrow RLS policies are designed and retested.

### May 5 Evening QA Volcano / Final Validation Update
- Major strategic shift completed today: InvestorIQ moved from passive QA smoke alarms to an internal QA Action Layer / "volcano" that turns report QA artifacts into operational command intelligence across all reports.
- New artifact implemented:
  - `qa_action_plan`
  - bucket: `internal`
  - advisory-only
  - no public surface
  - no worker lifecycle changes
  - no publication blocking
  - no `qa_blocked`
  - no `qa_review_required`
  - no financial value changes
  - no report rewriting
- `qa_action_plan` consumes/rolls up:
  - `report_qa_flags`
  - `rendered_report_qa_advisory`
  - `source_report_coverage_qa`
  - `qa_fix_routing`
  - `qa_review_summary`
- Output fields include:
  - `delivery_recommendation`
  - `customer_delivery_ready`
  - `public_sample_ready`
  - `high_value_outreach_ready`
  - `regenerate_recommended`
  - `safe_to_regenerate_now`
  - `prioritized_actions`
  - `action_counts`
  - `root_cause_summary`
  - `requires_code_patch`
  - `requires_regeneration`
  - public/high-value/customer block flags
- Doctrine remains locked:
  - QA Action Layer is internal only.
  - Users must never see wording like "not sample-ready," QA scores, QA blockers, AI QA, model names, or internal action-plan labels.
  - AI/QA may flag issues but must not write accepted report values or override deterministic financial logic.

### May 5 Rollback Checkpoint
- Pre-volcano rollback checkpoint captured before major QA Action Layer work:
  - commit: `b3fc6d2`
  - branch: `main`
  - remote state: `origin/main`, `origin/HEAD`
  - commit message: `updates`
  - captured around May 5, 2026 at roughly 3:00 PM America/Toronto.
- If the QA Action Layer work badly breaks the repo, rollback command is:
  - `git reset --hard b3fc6d2`
- Treat all May 5 QA Action Layer / volcano patches as reversible against that checkpoint.

### May 5 QA Action Layer Hardening Completed
- QA model configuration is environment-configurable:
  - rendered QA reads `QA_REVIEW_MODEL`, falls back to `OPENAI_REPORT_QA_MODEL`, then falls back to current default model
  - source-package QA reads `QA_SOURCE_PACKAGE_MODEL`, falls back to `QA_REVIEW_MODEL`, then `OPENAI_REPORT_QA_MODEL`, then current default model.
- Recommended launch-readiness QA model settings locally and in Vercel:
  - `QA_SOURCE_PACKAGE_MODEL=gpt-4o`
  - `QA_REVIEW_MODEL=gpt-4o`
  - do not hardcode GPT-5.x strings without endpoint/structured-output validation.
- Source Coverage QA now recognizes proposed acquisition financing separately from current debt when rendered text includes signals such as:
  - `Proposed Acquisition Debt Sizing`
  - `Derived Acquisition Loan Amount`
  - `Proposed Acquisition DSCR`
  - acquisition purchase-assumption disclosure.
- Deterministic QA guard added for contradictory `Insufficient Data` classification:
  - if Full Underwriting has core operating metrics but rendered cover/executive classification says `Insufficient Data`, flag as internal render-gating issue.
- Deterministic QA guard added for acquisition financing render gaps:
  - if parsed acquisition financing inputs exist but final HTML lacks `Proposed Acquisition Debt Sizing` / `Derived Acquisition Loan Amount`, flag as internal render issue.
- QA routing calibrated so derived acquisition debt is not treated as missing current debt when acquisition financing is rendered separately and no true current debt balance exists.
- `FULL_UNDERWRITING_SUPPORT_UNDERUSED` calibrated so it does not duplicate a T12-only parser-depth gap when acquisition financing, renovation parsing, and minimum section depth are present.
- Soft rendered QA compliance notes are no longer escalated to critical blockers unless actual prohibited public language exists.
- Critical public-language compliance now requires actual prohibited patterns, such as:
  - BUY / SELL / HOLD
  - explicit investment recommendation/advice language
  - public AI/model/vendor claims
  - AI-assisted/IQ-assisted style language
  - guarantees or fabricated certainty.
- Soft language such as `InvestorIQ deal score components`, factual DSCR constraint language, Review/Sensitized labels, and lender-threshold risk statements should route as low/medium language review or false positive, not critical customer-delivery blockers.
- Market-survey classification review now downgrades to low `no_action_false_positive` when:
  - source coverage passes
  - real rent roll artifact exists
  - deterministic flags are empty
  - the market survey did not contaminate core rent-roll values.
- Stronger market-survey routing remains available if source coverage fails, rent roll is absent, or market survey values contaminate core modeled data.

### May 5 Forest City Manor 8 Validation Result
- Forest City Manor 8 is the first materially clean acquisition-financing-only Full Underwriting validation after QA volcano work.
- Report quality materially improved:
  - 15 pages
  - cover classification: `Document-Constrained Review`
  - no `Insufficient Data` cover/executive failure
  - core metrics render: 144 units, NOI `$1,723,435`, expense ratio `31.5%`, NOI margin `68.5%`
  - `Proposed Acquisition Debt Sizing` renders
  - `Derived Acquisition Loan Amount` renders as `$29,325,000`
  - `Proposed Acquisition DSCR` renders as `1.21x`
  - current debt/refi DSCR remains correctly not assessed because no true current outstanding debt balance exists
  - disclosure correctly states derived acquisition debt is not current outstanding debt and is not used as current refinance debt balance.
- T12 parser fix landed:
  - `income_line_count: 3`
  - `expense_line_count: 5`
  - expense sum reconciles to OpEx `$793,685`
  - report now renders Income Reconstruction and Operating Expenses instead of lump-sum T12 fallback.
- Source Coverage QA result:
  - `qa_status: pass`
  - deterministic flags empty
  - artifact inventory confirms T12 line detail, rent roll, loan term sheet/acquisition assumptions, and renovation artifact presence.
- QA Action Plan for Forest City 8 is now quiet where it should be:
  - no parser work needed
  - no render-gating work needed
  - no artifact-mapping work needed
  - requires_code_patch: `0`
  - customer_delivery_ready: `true`
  - safe_to_regenerate_now: `true`
- Remaining Forest City 8 items:
  - `DOCRAPTOR_NOT_PRODUCTION_MODE` until production PDF mode is enabled
  - `DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT` remains a source-document limitation for current debt/refi only, not a system failure.
- Current-debt limitation wording polish was given to Codex at end of day:
  - target copy should avoid repetition and say debt terms were identified from purchase-assumption support while current debt service is not assessed because no current outstanding debt balance was provided.
  - if Codex returns a receipt next session, review it before rerunning tests.

### May 5 124 Richmond Clean 2 and Messy 2 Regression Results
- 124 Richmond Clean 2 and Messy 2 were run after Forest City 8 and proved the volcano/generalized parser fixes were not Forest City-specific.
- Clean 2 report:
  - 18 pages
  - capital risk profile: `Sensitized`
  - NOI `$72,170`
  - DSCR `1.09x`
  - T12 line items rendered: 3 income rows and 8 expense rows
  - current debt/refi logic rendered with outstanding balance `$937,500`, interest `5.85%`, amortization `30 years`
  - refinance shortfall/stress analysis rendered
  - source coverage QA passed
  - deterministic flags empty.
- Messy 2 report:
  - 18 pages
  - capital risk profile: `Sensitized`
  - NOI `$66,382`
  - DSCR `1.00x`
  - T12 line items rendered: 4 income rows including vacancy allowance, 8 expense rows
  - current debt/refi logic rendered with outstanding balance `$937,500`, interest `5.85%`, amortization `30 years`
  - refinance shortfall/stress analysis rendered
  - source coverage QA passed
  - deterministic flags empty.
- The T12 line-item parser hardening generalized:
  - Forest City PDF T12: 3 income / 5 expense rows
  - 124 Richmond clean XLSX T12: 3 income / 8 expense rows
  - 124 Richmond messy XLSX T12: 4 income / 8 expense rows
- 124 Richmond exposed QA calibration rather than report-core failure:
  - rendered AI QA soft compliance/language comments were initially over-escalated to critical public-language blockers
  - patch completed to split actual prohibited language from soft cautionary notes.
- Remaining 124 Richmond visible polish:
  - property names intentionally include `CLEAN`, `MESSY`, and trailing test numbers during internal testing.
  - do not globally sanitize or flag words/numbers in user-entered property names because real streets or property names may contain words like Clean, Messy, Test, Final, or numbers.
  - final public/Ken samples should be generated with clean intentional property names rather than relying on sanitizer behavior.
  - property name input must preserve user-entered names as source of truth; do not add broad word/number restrictions or global test-token warnings.
- Renovation section still looks weak for 124 Richmond because structured CapEx/budget rows were not extracted from the uploaded CapEx support:
  - section says renovation budget was identified but no verified total budget was extracted
  - this is not a core underwriting blocker, but it is visible sample-polish work if 124 is used as public/Ken sample.
- Optional later patch:
  - collapse/polish Renovation Strategy section when `renovation_parsed` exists but no verified budget amount or scope rows exist.
  - preferred wording: `Uploaded renovation support was identified, but no verified structured CapEx budget was extracted. No renovation return, rent lift, ROI, or payback analysis is modeled.`
  - do not fabricate CapEx, rent lift, timing, ROI, payback, or scope.

### May 5 T12 Line-Item Extraction Fix
- Forest City T12 PDF source line items were confirmed to exist:
  - 3 income rows
  - 5 expense rows
  - expense rows reconcile exactly to OpEx `$793,685`.
- Root cause:
  - `pdf-parse` glued amount and percent columns together, e.g. `$310,00012.30%`
  - old regex parsed that as `31000012.3`
  - OpEx reconciliation failed and all expense lines were dropped.
- Patch completed in `api/parse/parse-doc.js`:
  - T12 text line-item extraction moved to reusable exported helper `extractT12LineItemsFromText`
  - currency parsing now stops before glued percent columns
  - line matching skips header false matches with no amount
  - OpEx reconciliation preserved before accepting expense lines.
- Focused smoke test added:
  - `tests/qa/t12-line-items-smoke.js`
  - validates Forest City-style glued amount/percent PDF text produces 3 income rows, 5 expense rows, and expense sum `$793,685`.
- New Codex validation rule after quota pressure:
  - ask Codex to run only minimum validation required for touched files
  - avoid broad smoke/e2e/test suites unless touched code directly requires it
  - prefer `node --check` touched files plus one focused test.

### May 5 Codex Quota / Workflow Update
- Codex 5-hour window was nearly exhausted during QA volcano work; user later ran out of Codex messages until evening.
- Updated operating posture:
  - ChatGPT should do prioritization, prompt shaping, and file-based reasoning where possible.
  - Codex should be used as a surgical patcher, not a broad researcher.
  - Keep Codex prompts shorter and narrower.
  - Use investigation-only Codex prompts when uncertain, then patch-only prompts after root cause is known.
  - Do not ask Codex to run broad test suites by default.
  - Minimum validation only unless user explicitly asks for more.
- Preferred Codex validation language going forward:
  - `Run only the minimum validation required for the touched file(s). Do not run broad smoke/e2e/test suites unless the touched code directly affects that suite or the prompt explicitly asks for it.`

### Current Confidence / Ken Dunn Readiness as of May 5 Night
- InvestorIQ is no longer in "prove the system works at all" mode.
- Current state is final sample-readiness validation.
- Confidence before final reruns: roughly high but not final Ken-ready until a couple of clean post-calibration samples are generated and visually checked.
- Recommended remaining test count before Ken outreach:
  - 1 clean 124 Richmond rerun after QA language calibration / market survey downgrade deploy
  - 1 Forest City rerun only if the current-debt wording patch or acquisition/current debt calibration needs confirmation
  - optionally 1 constrained/messy package only if time allows, to verify source limitation handling.
- Ken outreach threshold:
  - at least one clean current-debt/refi Full Underwriting public-candidate sample
  - optionally one acquisition-financing Full Underwriting sample
  - source coverage QA pass
  - `qa_action_plan.requires_code_patch = 0`
  - no critical/high action items except DocRaptor test mode before production flip
  - clean cover classification
  - T12 line items rendered when source supports them
  - no public AI/model/vendor language
  - no BUY/SELL/HOLD
  - no dangling `DATA NOT AVAILABLE`
  - no obvious test/internal filenames or property-name suffixes in final public/Ken sample package
  - production DocRaptor PDF before sharing externally.

### Property Name Doctrine - Locked May 5 Night
- Do not globally ban, strip, or flag words/numbers entered in the property name box.
- Rationale: real addresses or property names may legitimately include words such as Clean, Messy, Test, Final, QA, Screening, Underwriting, or trailing numbers.
- During internal testing, user will continue using `Clean`, `Messy`, and numbered suffixes intentionally.
- Production property-name behavior must preserve user-entered property names as source-of-truth display names, with only light safety/HTML cleanup and natural wrapping.
- Final public/Ken samples should simply be generated with clean names and clean filenames after testing is complete.
- Do not add broad sample-hygiene warnings based solely on property-name words or trailing numbers.
- If future admin/demo mode exists, test-token cleanup may be gated explicitly behind admin/demo mode only, never default production behavior.

### May 5 QA Phase 1A / 1B / 1C Implemented
- Phase 1A: Rendered Report QA Advisory:
  - artifact type: `rendered_report_qa_advisory`
  - helper: `api/_lib/qa-review.js`
  - called from `api/generate-client-report.js`
  - advisory-only, internal-only, no blocking, no worker lifecycle changes, no report rewriting, and no financial value changes
  - default timeout is `15000` ms via `QA_REVIEW_TIMEOUT_MS`
  - kill switch: `QA_REVIEW_ENABLED=false`
  - deterministic false-positive post-filter removes:
    - break-even occupancy vs current occupancy false contradiction
    - absence of BUY / SELL / HOLD or investment recommendation language
  - artifact includes `raw_model_score`, adjusted `score`, `removed_false_positive_count`, `findings`, `counts`, `qa_status`, `model_status`, `summary`, `model`, `usage`, `version`, and `timeout_ms`
  - adjusted `score` is deterministically increased by `+10` per removed false positive, capped at `100`
- Phase 1B: Source-to-Report Coverage QA:
  - artifact type: `source_report_coverage_qa`
  - helper: `api/_lib/source-report-coverage-qa.js`
  - deterministic checks only; no AI call
  - advisory-only and internal-only
  - compares uploaded files, artifact inventory, rendered section/depth signals, report type/tier, and expected depth
  - designed to catch: "This report is materially underdeveloped relative to its uploaded documents and report tier."
  - Full Underwriting flags implemented: `FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED`, `T12_LINE_ITEM_DETAIL_MISSING`, `RENOVATION_DOC_NOT_STRUCTURED`, `PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT`, `FULL_UNDERWRITING_SUPPORT_UNDERUSED`, and `PUBLIC_SAMPLE_NOT_READY`
  - shallow rendered-text signals include no line-item detail available, lump-sum T12, no structured CapEx modeling, DSCR/current debt not assessed, debt sizing balance not provided, refinance stability not produced, and acquisition financing assumptions when rendered
  - smoke test: `tests/qa/source-report-coverage-qa-smoke.js`
- Phase 1C: QA Fix Routing:
  - artifact type: `qa_fix_routing`
  - helper: `api/_lib/qa-fix-routing.js`
  - advisory-only, internal-only, no blocking, no `qa_blocked`, no `qa_review_required`, and no worker lifecycle changes
  - classifies QA findings into `display_fix`, `parser_gap`, `artifact_gap`, `render_gating_gap`, `source_insufficient`, and `public_sample_blocker`
  - output includes `routes`, `route_counts`, `highest_severity`, `public_sample_ready`, `customer_delivery_action`, `admin_action_required`, `deterministic_auto_fix_available`, and `regenerate_recommended`
  - `customer_delivery_action` currently remains `advisory_only_no_delivery_block`
  - adds `PUBLIC_SAMPLE_REVIEW_HOLD` when medium/high parser, artifact, or render-gating routes exist
  - smoke test: `tests/qa/qa-fix-routing-smoke.js`
- QA rollup:
  - `qa_review_summary` now summarizes rendered QA, coverage QA, fix routing, highest severity, public-sample readiness, regeneration recommendation, and admin-action signals.

### May 5 Forest City Full Underwriting QA Breakthrough
- Forest City Manor had 144 units and 5 uploaded docs but produced a constrained 13-page memo.
- QA correctly identified that the report was underdeveloped relative to its uploaded package and Full Underwriting tier.
- `source_report_coverage_qa` flagged:
  - `T12_LINE_ITEM_DETAIL_MISSING`
  - `RENOVATION_DOC_NOT_STRUCTURED`
  - `PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT`
  - `FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED`
  - `FULL_UNDERWRITING_SUPPORT_UNDERUSED`
  - `PUBLIC_SAMPLE_NOT_READY`
- `qa_fix_routing` indicated:
  - `public_sample_ready = false`
  - `admin_action_required = true`
  - `regenerate_recommended = true`
  - `customer_delivery_action = advisory_only_no_delivery_block`
- This proves the anti-whack-a-mole QA architecture is working: QA now diagnoses underdeveloped Full Underwriting outputs rather than silently treating them as sample-ready.

### May 5 Forest City Root-Cause Parser / Extraction Fixes
- Files patched:
  - `api/parse/extract-job-text.js`
  - `api/parse/parse-doc.js`
- T12:
  - root cause: text-based T12 branch extracted core totals but wrote `income_lines: []` and `expense_lines: []`
  - fix: deterministic text-line extraction for `income_lines` and `expense_lines` when core T12 totals validate
  - expense rows are kept only when they reconcile to total OpEx within tolerance
  - expected next retest: lump-sum T12 fallback should clear if line items parse
- Renovation:
  - root cause: uploaded "docx" was actually ODT-style zipped XML, and Office text files were skipped by extraction
  - fix: Office XML text extraction added for `.docx` / `.odt` style uploads using `word/document.xml` or `content.xml`
  - supporting-doc classification now recognizes renovation / CapEx / budget docs
  - `renovation_parsed` extraction added for total budget, budget rows/categories, budget note, execution note, and interpretation
  - do not invent rent lift, ROI, payback, or per-unit assumptions unless explicitly present
- Purchase assumptions:
  - purchase price, LTV, rate, amortization, and cap/refi assumptions can now be extracted
  - `derived_acquisition_loan_amount = purchase price x LTV` can be produced
  - derived acquisition loan amount is tagged as an acquisition financing assumption and is **not** current outstanding debt

### May 5 Derived Acquisition Debt / Acquisition Financing Doctrine
- Separate acquisition-financing assumptions render path is implemented in `api/generate-client-report.js` and `api/report-template-runtime.html`.
- Current locked doctrine:
  - do not wire `derived_acquisition_loan_amount` into current debt/refi path
  - do not use it as `mortgagePayload.outstanding_balance`
  - do not label it current debt balance
  - do not make Refinance Stability Classification use derived acquisition debt yet
  - keep current DSCR/refi/current debt logic unchanged unless true current debt balance exists
- Implemented Full Underwriting render path:
  - `Proposed Acquisition Debt Sizing`
  - labels: `Purchase Price`, `Documented LTV`, `Derived Acquisition Loan Amount`, `Interest Rate`, `Amortization`, `Estimated Annual Debt Service`, and `Acquisition DSCR`
  - required wording: "Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance."
  - if NOI, derived acquisition loan amount, rate, and amortization are available, the report calculates estimated annual debt service using mortgage constant and calculates `Acquisition DSCR`

### Immediate Resume Point - Superseded by May 7 Evening Work
- The older fresh Forest City Full Underwriting retest plan was completed/superseded by May 6 validation and intake-resilience work.
- The May 6 Forest City reversed Screening and May 7 Forest City MIXUP intake-rescue work both passed.
- Current immediate task is now Dashboard idle stability monitoring, then one clean Full Underwriting with debt/current-loan support.
- Preserve this historical block only as context for the May 5/May 6/May 7 Forest City QA progression.

### Later Screening-Specific QA To-Do
- Do not work on this now.
- Add Screening-specific Source-to-Report Coverage QA later.
- Screening contract should check:
  - T12 and rent roll fully used
  - unsupported underwriting/debt/refi language did not leak into Screening
  - raw data-gap language avoided
  - Screening public-sample readiness assessed separately from Full Underwriting

### May 5 V2 EMERGENT Audit Decision + Safe Adoption Roadmap
- Decision:
  - V2 is not wholesale mergeable.
  - V2 is reference/blueprint only.
  - Current deterministic pipeline remains the source of truth.
- High-value V2 concepts to adopt manually after current-file review:
  - Rendered Report QA / Editorial QA
  - Final Review Queue
  - Admin Command Centre
  - User Drilldown
  - Bulk Credit Grant
  - Dashboard freeze fixes
- Must-not-merge areas:
  - wholesale admin router
  - wholesale worker changes
  - direct admin publish/revision shortcuts
  - unsafe credit restoration
  - hardcoded model strings
  - aggressive QA threshold `80`
  - fake schema assumptions
  - BUY/SELL or public AI language
- Safe roadmap:
  - Phase 0: stabilize current launch repo.
  - Phase 1: advisory-only rendered-report QA artifact.
  - Phase 1.5: deterministic critical kill flags.
  - Phase 2: Final Review Queue read-only/display-first.
  - Phase 3: controlled QA hold/admin review only after advisory proof.
  - Phase 4: Admin Command Centre features after schema validation.
  - Phase 5: post-launch expansion.
- Explicitly locked:
  - no QA blocking yet
  - no `qa_review_required` yet
  - no worker lifecycle changes yet
  - no report content rewriting
  - no financial value changes
  - no AI public language
  - current deterministic pipeline remains source of truth

- **May 5 status update - V2 audit, Dashboard monitoring, Stripe webhook/domain fix:**
  - V2 EMERGENT audit result:
    - V2 is **not** wholesale mergeable.
    - V2 remains valuable as blueprint/reference material and for selective manual cherry-picks only.
    - High-value concepts: Rendered Report QA / Editorial QA, Final Review Queue, Admin Command Centre concepts, User Drilldown, Bulk Credit Grant, and Dashboard freeze fixes.
    - Must-not-merge / high-risk areas: wholesale `api/admin/run-eligible-jobs-once.js`, wholesale worker lifecycle changes, direct admin publish/revision shortcuts, unsafe credit restoration that clears only `consumed_at`, hardcoded/unverified model strings such as `gpt-5.1`, aggressive default QA blocking threshold such as `80`, any `reports.status` assumptions, fake `report_purchases.report_type` or `report_purchases.consumed` assumptions, BUY/SELL sample language, and public AI / AI-assisted / IQ-assisted language.
    - Safe V2 adoption doctrine: current repo remains the foundation; V2 is blueprint/reference only; rebuild useful pieces manually into current architecture; no blind file swaps; no broad merges; no worker/publication changes until separately audited.
  - Rendered Report QA direction refined:
    - InvestorIQ still wants Rendered Report QA / Editorial QA.
    - First safe implementation should be advisory-only: inspect final rendered HTML/text after token replacement and section stripping; write internal `analysis_artifacts` QA artifact only; do not block publication in Phase 1; do not add `qa_review_required`; do not alter worker lifecycle; do not rewrite report content; do not change financial values; do not override deterministic parsers; do not expose AI publicly.
    - Future blocking can be considered only after advisory data is reviewed.
    - Recommended future blocking threshold posture remains permissive, e.g. `QA_BLOCK_BELOW_SCORE=60` plus critical kill flags, not aggressive default `80`.
    - DocRaptor watermark and `Test` / `CLEAN` / `MESSY` / `Underwritting` naming are acceptable during intentional internal testing but are blockers for final public/Ken samples.
  - Codex quota / workflow update:
    - Codex usage was unavailable for roughly 3 days due to weekly quota.
    - New operating rule: use ChatGPT plus uploaded current files for most investigation; use Codex mainly for narrow anchor-locked patches; Codex should run in Compressed Receipt Mode by default; one Codex task at a time; avoid broad audits unless necessary; investigation-first, no diff unless needed.
    - Typical future flow: upload current file to ChatGPT, optionally upload V2/reference file, have ChatGPT compare and prepare a tiny Codex patch prompt, then Codex applies exact patch only.
  - Dashboard freeze / lag May 5 update:
    - Codex classified V2 dashboard freeze fixes as PARTIAL: Dashboard fetch guards / state equality guards were safe low-risk cherry-picks; `src/contexts/SupabaseAuthContext.jsx` auth-event short-circuit is valuable but medium risk and deferred unless needed.
    - Patch applied only to `src/pages/Dashboard.jsx`: added in-flight guards for `fetchInProgressJobs`, `fetchRecentJobs`, and `fetchLatestFailedJob`; added equality guards for entitlements and latest failed-job state writes; removed dead/no-op effects while preserving `rentRollCoverage` clearing when `jobId` becomes null.
    - No auth, worker, parser, report generation, Stripe, DocRaptor, polling, or auto-refresh behavior changed.
    - Validation passed: `npm run build`; `git diff --check -- src/pages/Dashboard.jsx`.
    - Manual post-patch testing: user typed in property-name box, clicked around, refreshed Dashboard, and observed no freeze for several minutes.
    - `Dashboard.jsx` guard patch was applied and initially tested.
    - Status remains **OPEN / MONITORED**, not solved. Manual-refresh/cautious Dashboard posture remains locked. Defer the V2 `SupabaseAuthContext.jsx` auth-event short-circuit unless freeze/flicker returns.
  - Stripe/webhook entitlement incident May 5:
    - User purchased 5 Underwriting credits with a 100% coupon. Stripe Checkout completed successfully with correct `productType=underwriting`, correct `userId`, and line item quantity 5.
    - `metadata.quantity` displayed 1 because quantity can be adjusted inside Stripe Checkout after initial metadata is set; webhook correctly fetches actual line-item quantity and should not rely on metadata quantity.
    - `report_purchases` initially showed 0 rows because Stripe webhook delivery failed with `307 Temporary Redirect` at `https://investoriq.tech/api/webhook`; webhook function did not appear in Vercel logs, so no `stripe_events` or entitlement rows were created.
    - Root cause was domain configuration, not Dashboard or checkout-session code: Vercel Domains had `www.investoriq.tech` and `investoriq.vercel.app`, but apex `investoriq.tech` had disappeared from the current production project after V2/Vercel experimentation.
    - The Stripe webhook got `307 Temporary Redirect` and never reached `/api/webhook`.
    - Fix: re-added `investoriq.tech` to the current Vercel production project without redirect, kept it connected to Production, resent failed Stripe `checkout.session.completed`, and Stripe returned 200 OK with `{ received: true }`.
    - Dashboard credits updated. Five webhook-created rows were present; Dashboard showed 10 underwriting credits because 5 manual SQL credits had also been inserted while webhook delivery was broken. No evidence of duplicate webhook processing.
    - Current status: Stripe/webhook entitlement issue is **FIXED**. Domain configuration must remain part of launch checklist.
  - Locked domain / webhook checklist:
    - Vercel Domains must show valid production configuration for `investoriq.tech`, `www.investoriq.tech`, and `investoriq.vercel.app`.
    - Launch checklist must include both apex and www domains attached directly to the current production Vercel project.
    - `investoriq.tech` must not be redirect-only if Stripe webhook endpoint uses `https://investoriq.tech/api/webhook`.
    - Stripe webhook delivery should show 200 OK for `checkout.session.completed`.
    - If Stripe shows 307 Temporary Redirect, check Vercel Domains before patching code.
    - Vercel logs should show `POST /api/webhook` when webhook reaches the function.
    - Missing `POST /api/webhook` in Vercel logs plus Stripe 307 means request redirected before function invocation.
  - Quantity metadata clarification:
    - `api/create-checkout-session.js` sets line item quantity from request body and allows adjustable quantity 1-5 in Stripe Checkout.
    - `metadata.quantity` may remain the original quantity if the user adjusts quantity in Stripe Checkout.
    - `api/webhook.js` correctly fetches actual line-item quantity using Stripe line items and should not rely on `metadata.quantity`.
    - Optional future improvement: log/artifact actual line-item quantity inserted by webhook.
- **May 4 strategic update - Rendered Report QA / V2 audit direction:**
  - User is frustrated by the recurring late-stage loop: run a new property/report, discover another small QA/rendering/sample-readiness issue, patch, then discover different issues in the next report.
  - Root distinction is now explicit:
    - current deterministic pipeline/math/extraction is materially stronger and increasingly reliable
    - remaining pain is final rendered-report QA, public/sample readiness, support visibility, stale wording, thin sections, section presence, and institutional polish
  - Current AI extraction scope remains useful but insufficient for this issue:
    - AI T12 Recovery and AI Rent Roll Recovery help recover structured source data
    - they do not review the final PDF/report for sample-readiness, visible support, public optics, section completeness, or institutional credibility
  - Strategic decision: InvestorIQ should expand AI into a Rendered Report QA / Editorial QA layer, while preserving doctrine:
    - AI must not write the report
    - AI must not invent or override financial values
    - deterministic parsers/calculations remain source of truth
    - AI QA should inspect final rendered output and flag readiness/support/polish/compliance issues
  - User tested a local V2 showroom generated by Emergent and liked the concept, especially Final Review Queue / QA layer / Admin Command Centre ideas.
  - Current stance before Codex audit:
    - do not merge V2 wholesale blindly
    - V2 may be legitimate and may be worth adopting if it survives repo-truth audit
    - use Codex at 9:33am to compare every V2 file against current InvestorIQ files apples-to-apples
    - if a new V2 file is clean and standalone, it may be added directly
    - if a current file was changed/tweaked in V2, Codex must compare current-vs-V2 carefully before any swap
  - V2 adoption questions for Codex:
    - does V2 include the latest report-type scoped existing-report reuse fix in `api/admin-run-worker.js`?
    - does V2 preserve the Screening-only Section 04 wording token patch?
    - does V2 respect current `reports` and `report_purchases` schema reality?
    - does V2 expose any AI language publicly?
    - does V2 preserve no BUY / SELL / recommendation language?
    - does V2 preserve DSCR below-1.25x verdict cap behavior?
    - does V2 preserve DocRaptor production guard behavior?
    - does V2 change worker lifecycle, Dashboard stability, or entitlement restoration unsafely?
  - Model posture for QA layer:
    - OpenAI access was already checked previously; account has access to models including `gpt-4o`, `gpt-4.1`, `gpt-5`, and newer GPT-5.x models including `gpt-5.5`
    - still do not blindly rely on a hardcoded V2 model such as `gpt-5.1` until Codex verifies current code/env/model compatibility
    - likely first safe QA model should be a verified production-available model; exact string to be decided after Codex audit
  - QA threshold posture:
    - user and assistant agree with starting permissive rather than overblocking mathematically valid reports
    - a launch-learning threshold around `QA_BLOCK_BELOW_SCORE=60` is reasonable if V2 gate is adopted
    - critical kill flags such as BUY/SELL, public AI language, raw token leaks, wrong report type, missing DSCR cap, or public-trust violations should still be treated more seriously than ordinary prose nits
  - Universal quality doctrine is locked:
    - InvestorIQ does not create separate quality tiers by user
    - Ken Dunn, public samples, and standard customers should be held to the same report-quality standard
    - high-value outreach may receive additional human attention, but the product standard remains universal
    - every report should be document-driven, deterministic, internally QA-reviewed, and classified honestly against an elite institutional-readiness bar
  - Website/legal copy direction added:
    - report quality depends on quality, completeness, readability, and consistency of uploaded source documents
    - unclear, incomplete, inconsistent, scanned, damaged, handwritten, or poorly formatted documents may limit analysis or prevent generation
    - avoid measurable promises like `99.9% accuracy`
    - reinforce no investment/legal/tax/accounting/valuation/lending/brokerage advice
    - user remains responsible for independent review, professional advice, and final investment decisions
- **May 3 live validation status - SAME-NAME REPORT-REUSE P0 CLOSED:**
  - Public legacy sample route P0 is closed: `/reports/sample-report.html` is neutral in repo truth and live deployment truth.
  - During live DocRaptor test-mode validation, a P0 was discovered before production PDF smoke:
    - user submitted one Screening and one Underwriting report with the exact same property name: `124 Richmond Street, London, ON`
    - Screening job `84ee5e37-437a-4bfe-a2af-43a4cdd0e7b5` published and created report `6fc4589f-cb80-4bb3-a01d-8501aae8dc24`
    - Underwriting job `d56329cd-1fc8-4bf2-9141-42bb4d914300` reached `published` but reused the Screening report via `source: existing_report`
    - no Underwriting `reports` row or Underwriting PDF was created
    - Underwriting purchase `c161f73c-b8e5-4f2d-83d2-159420334bc0` was manually restored by clearing `job_id` and `consumed_at`
  - Root cause found in `api/admin-run-worker.js`:
    - the worker looked for an existing report by `user_id`, `property_name`, and `created_at >= job.created_at`
    - it did not scope existing-report reuse by `report_type`
    - this allowed an Underwriting job to reuse a Screening report artifact when property names matched
  - Manual patch applied:
    - scoring job query now selects `report_type`
    - existing report lookup now selects and filters by `report_type`
    - Screening and Underwriting can no longer reuse each other's report artifacts through that path
  - Live same-name retest passed after deploy:
    - same property name: `124 Richmond Street, London, ON`
    - Screening job `62c045cc-498f-418d-8c54-65a83557b5e5` published
    - Screening report `7417c32a-55bc-4fec-a0a6-457114acb5ef`
    - Screening `report_generation.source = generate-client-report`
    - Underwriting job `c5d2c693-003f-46c4-9936-b4a2d0d30a14` published
    - Underwriting report `a62410ff-a367-4453-966b-6ec7a2de286e`
    - Underwriting `report_generation.source = generate-client-report`
    - two distinct `reports` rows exist
    - two distinct PDF storage paths exist
    - Dashboard Report History showed both reports after manual refresh
  - May 3 Section 04 wording polish:
    - `api/report-template-runtime.html` now tokenizes Section 04 title/subtitle
    - `api/generate-client-report.js` now fills the tokens by report mode
    - Screening renders `Unit-Level Rent Positioning` and `Market-rent gap based on uploaded rent roll`
    - Underwriting keeps `Unit-Level Rent Positioning & Value Sensitivity` and `Market-rent gap and implied value sensitivity`
    - `node --check api/generate-client-report.js` passed
    - `npm run build` passed
    - committed files: `api/report-template-runtime.html`, `api/generate-client-report.js`
  - Post-polish live test-mode PDFs validated:
    - `124 Richmond Street, London, ON - Screening 2.pdf` = PASS for Screening-only wording
    - `124 Richmond Street, London, ON - 2.pdf` = PASS for Underwriting wording preservation
    - `124 Richmond Street, London, ON (MESSY) - 2.pdf` = PASS for Underwriting wording preservation and messy stress evidence
    - no raw `{{UNIT_POSITIONING_SECTION_TITLE}}` or `{{UNIT_POSITIONING_SECTION_SUBTITLE}}` tokens appeared in parsed report text
  - Worker-kick observation:
    - one manual worker kick was not enough to complete all three queued live test reports
    - a second worker kick completed the set
    - treat as current operator behavior / monitored ops limitation, not a launch blocker unless jobs remain stuck indefinitely
  - Intentional test-mode/public-sample hygiene items remain:
    - report titles may include testing suffixes such as `- 2`
    - uploaded filenames may include internal QA terms such as `Test`, `CLEAN`, `MESSY`, and `UNSUPPORTED`
    - DocRaptor remains in test mode until controlled production smoke
    - these are known presentation/sample-package issues, not engine-trust failures
  - Current conclusion:
    - same-name Screening/Underwriting cross-type report reuse P0 is patched, deployed, and live-validated closed
    - Screening-only wording polish is patched, deployed, and live-validated closed
    - DocRaptor production smoke may resume only after final test-mode public-candidate checks and clean sample package selection
  - Tomorrow morning resume note:
    - user wants to begin the next session with more testing
    - start with test-mode validation / report-path checks before DocRaptor production smoke
- Latest status through May 2, 2026:
  - 124 Richmond Screening, Clean Underwriting, and Messy Underwriting were regenerated and validated against the current report checks
  - Screening passed current report checks
  - Clean Underwriting passed current report checks
  - Messy Underwriting passed current report checks
  - rent-gap basis is standardized to in-place denominator: `($219,240 - $186,780) / $186,780 = 17.4%`
  - `Market Rent Premium (Avg)` is now `Market Rent Gap (Avg)`
  - unsupported renovation / CapEx documents remain acknowledged but are not modeled quantitatively
- Screening is the compressed, decision-grade memorandum; Underwriting retains deterministic debt, refinance, valuation, and scenario depth.
- Live generation remains deterministic and document-driven:
  - Supabase document pipeline
  - Stripe entitlements / checkout
  - admin-style worker for job progression
  - AWS Textract plus `pdf-parse`
  - deterministic structured parsers
  - tokenized HTML renderer
  - DocRaptor PDF generation
- No live LLM generation path exists in the report runtime.
- Strategic direction is now explicit:
  - repeated synthetic tests exposed real parser / file-format edge-case risk
  - do not pivot InvestorIQ toward AI-written underwriting or AI-generated report narrative
  - safe direction is narrow AI extraction recovery only
  - AI may help InvestorIQ read documents; AI may not become the source of financial truth
  - deterministic validation remains the gate before any AI-recovered values enter `analysis_artifacts`
  - P10 validated this doctrine in a production-like live flow: AI recovered a parser-unfriendly rent roll, but deterministic validation controlled acceptance and report math
  - P08 validated the same doctrine on T12-side document integrity: readable T12 values can be recovered or processed, but materially inconsistent T12 vs rent-roll scale must fail closed before publication
- April 30 strategic checkpoint:
  - today was the AI QA / failed-report prevention crossroads
  - decision: do not build concierge hold, Stripe promo-code tagging, report visibility suppression, RLS changes, or admin approval workflow yet
  - chosen path: QA safeguard first, then hard validation; full concierge hold deferred
  - old question: "Can InvestorIQ publish a report?"
  - new question: "Can InvestorIQ recognize whether a published report is actually investor-ready?"
  - this direction is validated as launch-hardening, not scope creep
- Public-positioning rule is locked:
  - any AI, AI-assisted QA, AI fallback, or AI red-team language is founder/internal only
  - public/customer/website copy must say document-driven, document-backed, deterministic validation, internal quality safeguards, source-verification controls, or proprietary document-driven underwriting infrastructure
  - do not publish copy saying AI QA, AI-assisted, or AI extraction
- Batch 6A.2 explicit rent-roll summary totals is CLOSED:
  - parser now writes `rent_roll_parsed.payload.totals` from explicit totals / summary rows
  - generator trusts verified explicit summary totals during partial-sample mode
  - detail-row-derived full-property metrics remain suppressed when rows are partial
  - Forest City validated state:
    - Units `144`
    - Occupancy `96.0%`
    - Annual In-Place Rent `$2,622,000`
    - Annual Market Rent `$3,148,800`
    - Rent-to-Market Gap `16.7%`
    - Rent Roll Distribution remains suppressed for the 4-row partial sample
  - Executive Snapshot annual in-place rent now correctly shows `$2,622,000`
- Exact document-derived cap-rate consistency is CLOSED:
  - Forest City shows `4.99% (document derived)` in basis and sensitivity base rows
  - 124 Richmond shows `6.25% (document derived)` in basis and sensitivity base rows
  - exact base cap rows are inserted when document-derived caps fall between benchmark rows
- CapEx / renovation disclosure validation is CLOSED:
  - uploaded-but-unstructured CapEx / renovation files are acknowledged by filename
  - no CapEx amount, scope, ROI, payback, rent lift, or modeled CapEx values are created unless structured inputs exist
  - Forest City acknowledged `ForestCityManor_RenovationBudget.docx`
  - 124 Richmond acknowledged `CapEx_Schedule_124_Richmond_Test.pdf`
- Final regression suite passed after the Richmond cap-rate follow-up.
- Layout polish is CLOSED:
  - cover page now shows a compact document count instead of a white documents box
  - full `Uploaded Files` list still appears later in the report
  - `Key Upside Drivers` and `Primary Constraints` stay with their bullets
  - redundant `NOI Breakdown` block is removed
  - `Deal Scorecard & Radar` no longer orphans from `Factor-Level Scores`
  - Refi / Debt template no-break wrappers are balanced
- Latest clean proof points:
  - `124 Richmond Street Underwriting Test 22` passed layout and financial regression
  - `Forest City Manor Underwriting Test 27` passed layout and financial regression
- Final repo-wide Codex red-team audit is complete:
  - no new report-core, parser, worker, or Dashboard blocker beyond the known monitored Dashboard risk
  - true blocker found and closed in `api/webhook.js`: duplicate Stripe event IDs are no longer treated as complete until expected `report_purchases` rows are confirmed
  - public-copy / mojibake launch-risk cleanup completed in:
    - `src/pages/CheckoutSuccess.jsx`
    - `src/pages/Pricing.jsx`
    - `src/App.jsx`
- `Final_Testing/` local-only synthetic QA fixture library now exists:
  - 11 fictional packages: P01 clean Screening, P02 clean Underwriting, P03 messy Underwriting, P04 partial rent roll with summary, P05 missing rent roll, P06 unsupported CapEx only, P07 conflicting documents, P08 glued-number T12, P09 overcomplete Underwriting, P10 AI rent-roll recovery, and the dedicated `SYNTH-QA-AI-UNDERWRITING-CONTROL` pack
  - fixtures are deterministic `.csv`, `.txt`, `.md` plus `MANUAL_EXPORT.md` notes only
  - no existing safe local/batch runner reads these folders directly; honest end-to-end testing remains manual Dashboard upload unless a future staging harness is built
- Dedicated AI Underwriting validation pack now exists at:
  - `Final_Testing/SYNTH-QA-AI-UNDERWRITING-CONTROL/`
  - subtests:
    - `01_positive_ai_rent_roll_underwriting`
    - `02_positive_ai_t12_underwriting`
    - `03_positive_dual_ai_recovery_underwriting`
    - `04_long_ai_rent_roll_stress_underwriting`
  - goal is clean Underwriting validation of AI-assisted extraction recovery without reusing confusing mixed legacy packages
  - doctrine remains locked:
    - AI extraction only
    - no AI-written underwriting
    - no AI as financial source of truth
    - deterministic validation remains the gate
    - no financial value accepted unless validation passes
    - fail closed on missing, inconsistent, or unverified artifacts
- AI Rent Roll Recovery v0.1 is now implemented as a feature-flagged extraction fallback:
  - helper lives in `lib/ai-rent-roll-recovery.js`
  - `api/parse/parse-doc.js` uses it behind `ENABLE_AI_RENT_ROLL_RECOVERY=true`
  - helper uses `OPENAI_API_KEY` plus OpenAI Responses API through native `fetch`
  - AI output is candidate extraction only and is accepted only after deterministic validation
  - accepted AI recovery artifacts carry:
    - `method: ai_rent_roll_recovery_validated`
    - `ai_assisted: true`
    - `validated: true`
- AI T12 Recovery v0.1 is now implemented as a stricter feature-flagged extraction fallback:
  - helper lives in `lib/ai-t12-recovery.js`
  - `api/parse/parse-doc.js` uses it behind `ENABLE_AI_T12_RECOVERY=true`
  - helper uses `OPENAI_API_KEY` plus OpenAI Responses API through native `fetch`
  - scope is parser-unfriendly T12 / operating statement recovery only
  - it is not report generation, not narrative, and not underwriting conclusions
  - accepted AI recovery artifacts carry:
    - `method: ai_t12_recovery_validated`
    - `ai_assisted: true`
    - `validated: true`
  - deterministic T12 validation still gates acceptance:
    - finite EGI / OpEx / NOI
    - `EGI > 0`
    - `OpEx >= 0`
    - NOI finite
    - `EGI - OpEx ~= NOI`
  - T12 recovery is intentionally stricter than rent-roll recovery because it directly controls NOI
- Deployment / secret hygiene completed today:
  - initial AI helper location under `/api` triggered Vercel Hobby function-count failure
  - helper was moved out of `/api` into `lib/`, deploy returned green/current
  - initial live P10 failure after the `.txt` extraction patch was caused by missing `OPENAI_API_KEY` in Vercel Production while `ENABLE_AI_RENT_ROLL_RECOVERY=true` was already set
  - after adding `OPENAI_API_KEY` in Vercel Production and redeploying, P10 passed
  - first successful OpenAI usage was confirmed in the OpenAI dashboard at very low cost / token volume
  - narrow AI extraction fallback appears low-cost at current scale; material cost risk is still more likely in Textract, DocRaptor, Stripe fees, infrastructure, and support / admin time than in this AI layer
  - `RESEND_API_KEY` was rotated and marked Sensitive in Vercel after the Vercel security notice
  - old Resend key was revoked after the new production key was installed
  - do not rotate Stripe / Supabase / OpenAI / AWS / DocRaptor blindly mid-launch; one secret at a time only
- End-of-night May 2 / early May 3 OpenAI secret update:
  - OpenAI API key was exposed during local model-list checking
  - safe rotation completed:
    - new OpenAI API key created
    - Vercel Production `OPENAI_API_KEY` updated
    - production redeployed
    - old exposed key ending `...4v0A` revoked / deleted
    - local PowerShell `OPENAI_API_KEY` cleared with `Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue`
  - never paste API keys into chat, Codex, logs, or screenshots
- End-of-night May 2 / early May 3 AI model posture:
  - local `/v1/models` check confirmed access to `gpt-4o`, `gpt-4.1`, `gpt-5`, and newer listed GPT-5.x models including `gpt-5.5`
  - production env model settings:
    - `OPENAI_T12_RECOVERY_MODEL=gpt-4o`
    - `OPENAI_RENT_ROLL_RECOVERY_MODEL=gpt-4o-mini`
  - rationale:
    - T12 controls EGI, OpEx, NOI, DSCR, refinance, valuation, and score optics, so T12 recovery uses a stronger model than mini
    - compact rent roll recovery can remain on `gpt-4o-mini` unless failures appear
    - model output remains candidate extraction only
    - deterministic validation and cross-document gates remain source of truth
    - public / customer copy must still not mention AI
  - future optional test: evaluate newer models such as `gpt-5.5` for T12 recovery only after controlled structured-output and latency validation
- Naming convention is now locked:
  - use `SYNTH-QA-P## ...` for synthetic tests
  - reserve Richmond / Forest / Final Regression names for real proof assets only
- Dashboard failed-job guidance is now improved:
  - for visible failed jobs with `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`, Dashboard performs a narrow read-only `analysis_job_files` lookup
  - friendly file-specific guidance is shown for T12, rent roll, or unknown core-document verification failures
  - raw parser codes are not exposed to users
- Current synthetic QA proof points:
  - `SYNTH-QA-P01 Clean Screening RETEST 1` = PASS
    - 6 units, `100.0%` occupancy, Annual In-Place Rent `$111,180`, EGI `$186,780`, OpEx `$69,907`, NOI `$116,873`
    - T12 and Rent Roll both fully verified
    - no underwriting-only leakage observed
  - `SYNTH-QA-P04 Partial Summary Rent Roll RETEST 2` = PASS
    - 144 units, `96.0%` occupancy, Annual In-Place Rent `$2,622,000`, EGI `$2,622,000`, OpEx `$898,000`, NOI `$1,724,000`, Rent-to-Market Gap `16.7%`
    - trusted summary totals remain intact
    - Unit-Level Value Add / Unit Mix Rent Lift suppressed
    - Rent Roll Distribution suppressed
  - `SYNTH-QA-P08 Glued Number T12 / Scale Mismatch` = PASS as fail-closed integrity test
    - T12 text explicitly contained EGI `$2,517,120`, OpEx `$1,246,880`, NOI `$1,270,240`
    - paired rent roll supported only 4 units and annual in-place rent `$73,260`
    - root issue discovered: coverage had been treated like consistency
    - correct fix was fail-closed document-consistency validation, not changing the numbers
    - final behavior after redeploy:
      - T12 values can be recovered / processed
      - worker cross-document gate catches the T12-vs-rent-roll scale mismatch
      - job fails closed with `DOCUMENT_FINANCIAL_SCALE_MISMATCH`
      - no new PDF is published
      - credit is restored
      - Dashboard shows a readable fail-closed message
  - `SYNTH-QA-P10 RETEST` = PASS
    - uploaded files:
      - `t12_clean_source.csv`
      - `rent_roll_parser_unfriendly_source.txt`
    - published successfully with stable classification
    - Units `8`, Occupancy `87.5%`, Annual In-Place Rent `$111,180`, Annual Market Rent `$122,160`
    - EGI `$111,180`, OpEx `$41,250`, NOI `$69,930`
    - Expense Ratio `37.1%`, NOI Margin `62.9%`
    - `CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Fully Verified`
    - T12 Operating Statement coverage `4/4`, `100.0%`
    - Rent Roll coverage `4/4`, `100.0%`
    - proved the live chain:
      - `.txt extraction -> document_text_extracted -> AI rent-roll recovery -> deterministic validation -> rent_roll_parsed -> published Screening report`
    - confirms AI is correctly limited to extraction recovery and did not become the source of underwriting truth
  - `02_positive_ai_t12_underwriting` = PASS / published / AI T12 Recovery proven live in Underwriting
    - job `8cf09b74-0a5b-4fb4-be65-c01e578f4fb7`
    - report `7df1f2bc-fd38-45c3-93a3-f9d55f93e5d7`
    - uploaded files:
      - `rent_roll_clean_control.csv` -> `rent_roll` -> `parsed`
      - `t12_ai_recovery_source.txt` -> `t12` -> `parsed`
      - `loan_terms_simple_source.txt` -> `loan_term_sheet` -> `parsed`
    - T12 artifact:
      - `method: ai_t12_recovery_validated`
      - `ai_assisted: true`
      - `validated: true`
    - validated report values:
      - EGI `$475,200`
      - OpEx `$181,500`
      - NOI `$293,700`
      - Units `24`
      - Occupancy `95.8%`
      - Loan amount `$4,200,000`
      - Interest rate `5.10%`
      - Amortization `30 years`
      - DSCR `1.07x`
    - conclusion:
      - AI T12 Recovery is now proven live in Underwriting
    - minor fixture mismatch noted, not a launch blocker:
      - published annual in-place rent showed `$476,100` while T12 EGI was `$475,200`
      - investigation conclusion: fixture variance only; rent roll sums to `$39,675/month` while T12 states `$39,600/month`
      - treat as later fixture cleanup or explicit documented variance, not parser / generator / AI bug
  - AI Rent Roll Recovery Underwriting debugging path is now closed enough for launch confidence:
    - root cause 1: `api/admin-run-worker.js` only dispatched rent-roll parse-doc for `parse_status === 'pending'`, while `.txt` extraction sets rent roll files to `parse_status = 'extracted'`
    - worker patch applied in `api/admin-run-worker.js`: `anyPending`, `hasPendingRentRoll`, and rent-roll parse dispatch now include extracted rent-roll files
    - `node --check api/admin-run-worker.js` passed
    - root cause 2: AI rent-roll helper returned `null` opaquely after dispatch reached `parse-doc`
    - diagnostic patch applied in `lib/ai-rent-roll-recovery.js` and `api/parse/parse-doc.js`
    - `ai_rent_roll_recovery_diagnostic` now records attempted, feature flag, API key presence, source text length, request attempted, response status, JSON parse success, candidate presence, validation result, rejection reason, and final outcome
    - diagnostics do not persist raw document text, API keys, or full OpenAI responses
    - diagnostic retest showed `AbortError`: OpenAI request attempted, feature flag enabled, API key present, but no response returned before abort
  - AI helper timeout config patch applied:
    - files: `lib/ai-rent-roll-recovery.js`, `lib/ai-t12-recovery.js`
    - `OPENAI_RENT_ROLL_RECOVERY_TIMEOUT_MS` and `OPENAI_T12_RECOVERY_TIMEOUT_MS`
    - default `55000ms`, clamped from `10000ms` to `55000ms`
    - no models, prompts, schemas, validation, accepted artifact shapes, parser, worker, Dashboard, generator, or report logic changed
    - `node --check lib/ai-rent-roll-recovery.js` passed
    - `node --check lib/ai-t12-recovery.js` passed
  - `01_positive_ai_rent_roll_underwriting TIMEOUT RETEST` = PASS / published / AI Rent Roll Recovery proven live in Underwriting for compact parser-unfriendly `.txt`
    - validated anchors:
      - Units `18`
      - Occupancy `94.4%`
      - Annual In-Place Rent `$346,800`
      - Annual Market Rent `$387,000`
      - EGI `$346,800`
      - OpEx `$132,000`
      - NOI `$214,800`
      - Loan amount `$2,900,000`
      - Interest rate `4.85%`
      - Amortization `30 years`
      - DSCR `1.17x`
      - Rent Roll vs T12 variance `0.0%`
  - `03_positive_dual_ai_recovery_underwriting CONTROL RETEST` = PASS / published / dual AI recovery proven live in Underwriting
    - job `711787db-0fb7-4750-aadf-cafbe805cfbf`
    - report `82bd665b-fdb2-4d39-90e2-ab9ea2b220b0`
    - T12 artifact: `method: ai_t12_recovery_validated`, `ai_assisted: true`, `validated: true`
    - rent roll artifact: `method: ai_rent_roll_recovery_validated`, `ai_assisted: true`, `validated: true`
    - validated anchors:
      - Units `32`
      - Occupancy `93.8%` rounded from `93.75%`
      - Annual In-Place Rent `$648,000`
      - Annual Market Rent `$710,400`
      - EGI `$648,000`
      - OpEx `$246,000`
      - NOI `$402,000`
      - Loan amount `$5,950,000`
      - Interest rate `4.95%`
      - Amortization `35 years`
      - DSCR `1.12x`
      - Rent Roll vs T12 variance `0.0%`
    - report quality note:
      - technical validation evidence, not a showcase report
      - shorter 15-page output is expected because T12 has only core totals and the rent roll uses representative unit observations with trusted summary totals
      - unit mix / rent-distribution quality is less showcase-ready because only 12 representative rows were listed for a 32-unit property
  - Cover page long property-name overflow fix applied:
    - file: `api/report-template-runtime.html`
    - CSS target: `.cover-prop-name`
    - added `max-width: 100%`, `white-space: normal`, `overflow-wrap: anywhere`, and `hyphens: auto`
    - retained existing `word-break: break-word`
    - CSS/layout only; no report math, parser, worker, Dashboard, AI, generator, or value logic changed
    - pending visual retest with a long-name report
  - Dashboard failed-credit copy improvement is now applied:
    - failed pre-publication structured-financial jobs now explain that generation halted, no report was published, and 1 report credit was returned
    - file-specific rent roll / T12 guidance still appears after the customer-safe lead message
    - internal diagnostic terms like `AbortError` remain engineering-only; user-facing copy says InvestorIQ could not verify the uploaded rent roll as valid structured source data
    - optional later copy improvement: steer large rent rolls toward CSV/XLSX format
  - `04_long_ai_rent_roll_stress_underwriting` = ACCEPTABLE FAIL-CLOSED stress result
    - job `037a2a7c-b50b-4d2d-9e90-574d73ee9272`
    - report type/status: `underwriting` / `failed`
    - error `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`
    - report row: none
    - entitlement restored
    - uploaded files:
      - `t12_clean_control.csv`
      - `loan_terms_simple_source.txt`
      - `rent_roll_long_ai_recovery_source.txt`
    - T12 parsed by `csv`
    - loan terms parsed by `text_excerpt`
    - rent roll `.txt` failed with `unsupported_file_type_for_structured_parsing`
    - no `rent_roll_parsed`
    - AI diagnostic: attempted `true`, feature enabled `true`, OpenAI key present `true`, source text length `6787`, request attempted `true`, response status `null`, JSON parse success `null`, candidate present `false`, validation accepted `false`, rejection reason `AbortError`, final outcome `exception`
    - 04 rent roll listed all 64 unit lines
    - safety result: fail-closed worked, no report published, credit restored, no invalid rent-roll artifact accepted
    - V1 conclusion: large full-unit narrative `.txt` rent rolls are not scale-proven for AI recovery; compact `.txt` recovery is validated; CSV/XLSX remains preferred for large detailed rent rolls
  - `SYNTH-QA-MOTHERLOAD-UNDERWRITING-01` / `Harbourstone Apartments - Underwriting` = PUBLISHED but NOT website-sample ready and NOT Ken Dunn ready
    - treat as successful QA / stress discovery, not a public showcase asset
    - proved core AI T12 / AI rent-roll recovery and base math can publish:
      - T12 artifact: `method: ai_t12_recovery_validated`, `ai_assisted: true`, `validated: true`
      - rent roll artifact: `method: ai_rent_roll_recovery_validated`, `ai_assisted: true`, `validated: true`
      - core anchors landed: Units `48`, Occupancy `95.8%`, Annual In-Place Rent `$1,036,800`, EGI `$1,036,800`, OpEx `$425,000`, NOI `$611,800`
    - exposed support-doc / document-boundary gaps:
      - P0: DocRaptor test watermark still appears; no public PDF can ship with test bands
      - P0: loan balance miss; expected `$8,750,000`, but `loan_term_sheet_parsed.loan_amount = null`; interest `5.25%`, amortization `30`, and LTV `70` parsed; report said debt sizing balance was not provided and DSCR/current-debt service were not assessed
      - P0: property tax false positive; `property_tax_parsed.annual_tax = 2025`, expected `$124,000`; value did not appear to surface in report, but this is a parser/data-integrity issue
      - P1: purchase/cap-rate support; purchase assumptions produced usable cap-rate support around `5.75%`, but a later null appraisal artifact effectively masked it and report used default/stated `5.50%`
      - P1: cover title hyphenated `Harbourstone Apartments - Underwriting` awkwardly as `Un-/derwriting`; immediate sample workaround is clean property name only, such as `Harbourstone Apartments`
      - P1: AI T12 helper recovered core totals only; expense line items from the source did not populate, leaving lump-sum T12 detail too thin for a flagship sample
      - P2: market rent survey was misclassified as `rent_roll` and failed noisily
      - P2: 13-page output was thin because debt/refi sections, DSCR, T12 line-item detail, and support sections did not land
    - product lesson:
      - these are different edge cases at the document-ingestion / support-doc boundary, not one recurring bug
      - core underwriting math is materially strong once structured artifacts are clean
      - remaining launch risk is source-document classification / extraction / QA, especially support docs
      - stress packages and public showcase packages must be separated: stress packages expose failures and fail-closed behavior; showcase packages demonstrate the strongest supported path
      - do not try to make one synthetic package both the harshest stress test and the public website sample
  - Harbourstone Motherload / Test 5 validation arc, April 30:
    - Motherload / Harbourstone remains a stress-test package, not a public sample
    - earlier Harbourstone exposed DocRaptor test watermark, missed `$8,750,000` loan balance, property tax year `2025` parsed as annual tax, usable `5.75%` cap-rate support masked by later null appraisal artifact, cover `Un-derwriting` hyphenation, totals-only T12 recovery, market survey classification noise, and thin 13-page output
    - QA artifact correctly flagged `PROPERTY_TAX_AMOUNT_IMPLAUSIBLE`, `DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT`, `T12_TOTALS_ONLY`, `MARKET_SURVEY_CLASSIFICATION_REVIEW`, `CAP_RATE_SUPPORT_NOT_USED`, and `DOCRAPTOR_NOT_PRODUCTION_MODE`
    - Phase 1.1 added direct debt flag `DEBT_FILE_WITH_MISSING_BALANCE` for debt artifacts with meaningful terms but missing balance / loan amount
    - `Harbourstone Test 5` is current stress-test proof:
      - job `f5855655-150d-4f47-b7dc-71c18ea5ec89`
      - report `1cbf7fc6-99f7-4e8d-af53-9f727b3c8cf6`
      - status `published`, page count `15`
      - cover no longer hyphenates Underwriting
      - `loan_term_sheet_parsed.loan_amount = 8750000`
      - DSCR rendered `1.06x`
      - T12 parsed with GPR / EGI `$1,036,800`, OpEx `$425,000`, NOI `$611,800`
      - property tax parsed `$124,000`, not `2025`
      - refinance classification rendered `Refinance Shortfall Under Stress`
      - cap-rate basis `Exit cap: 5.75% (document derived)`
      - `DEBT_FILE_WITH_MISSING_BALANCE` and `DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT` absent
      - QA status `warn`, severity `medium`; remaining flags: `T12_TOTALS_ONLY`, `MARKET_SURVEY_CLASSIFICATION_REVIEW`, `DOCRAPTOR_NOT_PRODUCTION_MODE`
    - conclusion: Harbourstone is clean enough as stress-test proof only; not a public sample / Ken Dunn candidate
  - `SYNTH-QA-P01 Clean Screening RETEST` after AI helper install and Resend rotation = PASS
    - Units `6`, Occupancy `100.0%`, Annual In-Place Rent `$111,180`, EGI `$186,780`, OpEx `$69,907`, NOI `$116,873`
    - confirms AI helper install did not break deterministic Screening
    - confirms Resend rotation did not destabilize deployment
- Website positioning, pricing copy, contact routing, and report wording are materially aligned with proprietary, document-driven positioning.
- Dashboard freeze / lag remains a monitored launch-risk item, not a solved issue.
- Dashboard Step 03 failed-state readability polish is closed:
  - `src/pages/Dashboard.jsx`
  - failure messaging now renders as readable, brand-consistent dashboard body/status text
  - no backend / parser / worker / generator logic changed
- Worker remains frozen at the last known-good rollback; do not touch worker success flow unless a brand-new blocker appears.
- Manual Refresh remains the locked pre-launch Dashboard posture.
- Resend is live and validated for launch-critical report-ready email delivery.
## 2. Locked Product Positioning
- InvestorIQ is a document-driven real estate decision engine for investors.
- Every conclusion must be traceable to uploaded documents.
- No BUY/SELL language.
- No speculation.
- No fabricated narrative.
- Deterministic math only.
- Fail closed when required inputs are missing.

## 3. Current Pricing
- Screening Report: $499
- Underwriting Report: $1,499
- Quantity purchase supported at checkout for both report types.
- One purchased report = one report credit.
- No subscription.

## 4. Core System Architecture
- Node-based backend/API layer drives parsing, report generation, admin actions, and payment flow.
- Supabase is the system of record for auth, database tables, storage, and generated report artifacts.
- Stripe handles checkout and report purchase entitlements.
- DocRaptor renders final HTML into production PDFs.
- Textract plus `pdf-parse` handle document text extraction and fallback parsing paths.
- Current extraction contract reality:
  - PDF = text + tables extracted
  - PNG / JPG / JPEG = tables extracted only, no `document_text_extracted`
  - CSV / XLSX = no extraction artifact, but direct structured parsers consume them
  - TXT is now validated for the P10 AI rent-roll recovery path:
    - `api/parse/extract-job-text.js` writes `document_text_extracted` for `text/plain` / `.txt`
    - non-spreadsheet rent-roll parsing can now reach AI recovery with real extracted text
  - DOC / DOCX and PPT / PPTX are accepted by Dashboard but still have no extraction path
  - XLS is accepted by Dashboard but parser eligibility remains weak / inconsistent
- AI-assisted structured recovery now exists only as validation-gated parser fallback:
  - rent roll:
    - `.txt extraction -> document_text_extracted -> AI rent-roll recovery -> deterministic validation -> rent_roll_parsed`
    - Screening proven live by `SYNTH-QA-P10 RETEST`
    - Underwriting compact `.txt` rent-roll recovery proven live by `01_positive_ai_rent_roll_underwriting TIMEOUT RETEST`
    - Underwriting dual AI recovery proven live by `03_positive_dual_ai_recovery_underwriting CONTROL RETEST`
    - long full-unit `.txt` rent rolls are not V1 scale-proven; `04_long_ai_rent_roll_stress_underwriting` failed closed safely with credit restored
    - CSV/XLSX remains the preferred V1 path for large detailed rent rolls
  - T12:
    - `document_text_extracted -> AI T12 recovery -> deterministic validation -> t12_parsed`
    - Screening is proven far enough through P08 to recover/process values and trigger the worker fail-closed scale-mismatch gate
    - Underwriting is now proven live through `02_positive_ai_t12_underwriting`
- Current live stack definitely includes:
  - Supabase
  - Stripe
  - DocRaptor
  - AWS Textract
  - `pdf-parse`
  - `api/admin-run-worker.js`
  - `api/parse/extract-job-text.js`
  - `api/parse/parse-doc.js`
  - `api/report-template-runtime.html`
  - `api/generate-client-report.js`
- Report generation in the confirmed live path is deterministic first, with optional narrative slots present in the renderer but not populated by the live worker path.
- `api/generate-client-report.js` supports optional narrative `sections`, but the production worker call does not populate them.
- File-type support reality should be tightened or expanded after Ken Dunn:
  - preferred direction is real extraction support or narrower upload acceptance for `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, and image text extraction
  - do not keep inviting uploads the backend cannot actually read
- End-to-end live report flow:
  - user purchases report entitlement via Stripe
  - webhook inserts unconsumed `report_purchases`
  - dashboard uploads files to `staged_uploads`
  - dashboard calls `consume_purchase_and_create_job`
  - dashboard calls `queue_job_for_processing`
  - worker claims queued jobs
  - extraction pass runs
  - structured parsers create artifacts in `analysis_artifacts`
  - worker advances statuses through rendering
  - `generate-client-report.js` reads artifacts, computes metrics, assembles HTML, and sends to DocRaptor
  - PDF is uploaded to `generated_reports`
  - `reports` row powers Report History
- Cross-document integrity gate now exists in the worker before report generation:
  - `api/admin-run-worker.js`
  - compares `t12_parsed.payload.effective_gross_income` against trusted rent-roll annual in-place rent
  - trusted annual rent derivation uses:
    1. explicit summary annual totals
    2. explicit summary monthly totals x 12
    3. full non-partial unit rows only
  - does not use partial sample rows, average rent alone, market rent, or extrapolated values
  - if the ratio exceeds `5x`, the worker fails closed with `DOCUMENT_FINANCIAL_SCALE_MISMATCH`
  - failure uses existing entitlement restoration / no-publication pattern
- AI Underwriting validation truth after the April 30 checkpoint:
  - AI T12 Recovery = proven live in Underwriting
  - AI Rent Roll Recovery = proven live in Screening and in Underwriting for compact `.txt`
  - dual AI recovery = proven live in Underwriting
  - long full-unit narrative `.txt` rent rolls = acceptable fail-closed stress result, not scale-proven for V1

## 5. Current Report Rules
- Screening and Underwriting are separate report products, not layered versions of the same memo.
- Screening is a concise acquisition screening memorandum built from T12 and Rent Roll inputs.
- Screening currently:
  - requires T12 + Rent Roll
  - uses `screening_v1`
  - strips most underwriting-only sections
  - is primarily deterministic and compressed
- Underwriting is the full capital-risk report with debt structure, refinance capacity, valuation, and scenario depth when supporting documents exist.
- Underwriting currently:
  - requires T12 + Rent Roll + at least one supporting document
  - uses `v1_core`
  - can incorporate mortgage statement / loan term sheet / appraisal / property tax artifacts when parsed
  - uses active debt normalization / fallback between mortgage statement and loan term sheet
- Underwriting intake acceptance investigation is complete, and the ranked patch wave was executed in sequence with anchor-locked, minimal-diff changes only.
- Forest City Manor was the real-world proof case that exposed the underwriting intake contract mismatch and is now materially green after the parser / status-sync fixes:
  - readable PDF T12
  - XLSX rent roll
  - debt-style purchase assumptions PDF
  - broker email
  - renovation budget
  - failure was treated as a product-contract mismatch, not simply bad user documents
  - current locked truth now confirms:
    - Forest City Manor Underwriting Test 1 = `published`
    - Forest City Manor Screening Test 1 = `published`
    - latest `analysis_job_files` rows confirm:
      - T12 = `parsed`
      - Rent Roll = `parsed`
      - `loan_term_sheet` = `parsed` for the underwriting package
      - supporting unclassified docs remain `parsed_with_warnings` where appropriate
    - worker lifecycle advanced fully through:
      - `extracting`
      - `underwriting`
      - `scoring`
      - `rendering`
      - `pdf_generating`
      - `publishing`
      - `published`
    - generated PDFs exist for both reports
    - reports explicitly confirm T12 and Rent Roll coverage in output
- Final underwriting acceptance patch wave status:
  - Patch 1 passed: worker-side user-facing failure message precision in `api/admin-run-worker.js`
  - Patch 2 passed: live `loan_terms` routing normalized into `loan_term_sheet`
  - Patch 3 passed: dead core-doc fallback references removed from `api/parse/extract-job-text.js`
  - Patch 4 passed: T12 acceptance widened in the live path, after repeated correction when earlier attempts placed fallback logic in the wrong parser branch
  - Patch 5 passed: rent roll acceptance widened in the live path with strict fail-closed table-based parsing for non-spreadsheet rent rolls
  - Patch 6 passed: support-doc extraction contract mismatch corrected by storing full extracted text and using full text first in support-doc parsing / classification
- Implementation discipline for the underwriting patch wave:
  - pre-patch planning completed first
  - report-core remained materially green throughout
  - worker stayed frozen in the last known-good rollback state
  - no Dashboard sync experiments were performed during the underwriting acceptance patch wave
  - no refactors
  - one step at a time
  - failed patches were cleaned up before moving on
  - repo hygiene check was run before Patch 5 and came back clean
- Patch-review lesson from this wave:
  - multiple Patch 4 attempts produced false-positive summaries where the claimed fix did not match the actual saved file
  - final review discipline was pass / fail based on the real uploaded file, not the summary
- InvestorIQ does not "use only 3 documents."
- T12 and Rent Roll are the core required structured inputs.
- Debt terms / mortgage documents are incorporated when they are successfully parsed into structured fields.
- Additional supporting documents may be uploaded, but only recognized and structured inputs are incorporated into quantitative underwriting.
- Unsupported or unstructured documents are excluded from modeling rather than guessed from.
- One-and-done entitlement rule applies unless regeneration is triggered for system/support reasons.
- One-and-done product rule is now explicitly confirmed:
  - users do not upload additional documents after report generation begins as part of the normal product flow
  - the old missing-doc continuation / reminder workflow is legacy behavior and is no longer part of the intended launch model
  - if InvestorIQ cannot verify enough required source data to produce a defensible report, no report publishes and the report credit is automatically restored
  - if a defensible report is successfully generated and published from the submitted package, the credit is consumed
  - if a user later realizes they forgot optional documents after publication, that is not a system failure and requires a new report request
  - to retry after failed generation, the user must start a new report request and upload the complete document package again, including all required and supporting documents
  - V1 does not support supplementing a failed job with only selected replacement documents
- Refund / regeneration policy is now locked more explicitly:
  - InvestorIQ does not offer refunds once generation begins
  - if InvestorIQ fails due to a system-side issue, the remedy is credit restoration or report regeneration, not a cash refund
  - if a user uploads the wrong or incomplete package and InvestorIQ generates a defensible report from it, that requires a new report request
- Preferred failed-generation copy:
  - `Generation halted due to document verification limits. InvestorIQ could not verify enough required source data from the uploaded documents to produce a defensible report. No report was published, and 1 report credit has been returned to your account. To try again, please start a new report request and upload the complete document package again, including all required and supporting documents. Do not upload only the documents you believe were unclear or unreadable, because each report is generated from a single complete upload package.`
- Narrative must be document-derived and supportable from parsed inputs.
- No fabricated data, no silent fallback assumptions, and no decorative filler sections.

## 6. Current Engine State
- Worker loop, extraction reuse, and parallel execution have been validated previously.
- Coverage-vs-consistency lesson is now explicit:
  - coverage confirmation is not sufficient document integrity
  - cross-document financial scale mismatch must fail closed before report generation
- Screening vs underwriting separation has been materially improved.
- Wrong report-type leakage in the executive summary was fixed and hardened.
- Screening compression removed valuation and refinance depth that belonged only in underwriting.
- Report wording across generator, runtime template, and PDF sections was tightened toward institutional, document-driven language.
- Pricing updated to $499 for Screening and aligned across frontend and Stripe.
- Website copy fully cleaned of legacy automation terminology and standardized to proprietary-system language.
- Em dash usage removed from all user-facing copy to maintain institutional tone.
- Public-facing contact routing has been migrated away from `hello@investoriq.tech` to department addresses.
- Test 9 failure was confirmed as a backend persistence issue, not a parsing, classification, or rendering failure.
- May 3 same-name Screening/Underwriting report-reuse P0 is CLOSED:
  - Original bug: same user/property name across Screening and Underwriting could trigger unsafe existing-report reuse.
  - Bad Underwriting job `d56329cd-1fc8-4bf2-9141-42bb4d914300` reached `published` but reused Screening report `6fc4589f-cb80-4bb3-a01d-8501aae8dc24`.
  - This was confirmed as backend publication/reuse logic, not a Dashboard render issue.
  - Underwriting credit was restored manually by clearing the affected `report_purchases.job_id` and `consumed_at`.
  - Patch applied in `api/admin-run-worker.js`: existing-report lookup is now scoped by `report_type`.
  - Live same-name retest passed:
    - Screening job `62c045cc-498f-418d-8c54-65a83557b5e5` -> report `7417c32a-55bc-4fec-a0a6-457114acb5ef`
    - Underwriting job `c5d2c693-003f-46c4-9936-b4a2d0d30a14` -> report `a62410ff-a367-4453-966b-6ec7a2de286e`
    - both `report_generation` events used `source: generate-client-report`
    - Dashboard Report History showed both reports
- Live pipeline persistence was restored by adding the missing `report_type text` column to `public.reports`.
- Admin dashboard blank-screen crash was fixed by restoring local `loading` state in `src/pages/AdminDashboard.jsx`.
- Dashboard disclosure acceptance timestamp duplicate-response behavior now returns a fresh UI timestamp without altering stored `legal_acceptances` history.
- Dashboard auto-refresh polling has been removed in favor of manual refresh/reload actions.
- Analysis Scope Preview has been removed from the user dashboard UI.
- Failed Step 03 dashboard state now supports UI-only dismissal through local storage, with no report, job, or credit changes.
- Underwriting capability has been reconfirmed: refinance stress testing, DSCR, and cap-rate / valuation sensitivity are already present.
- Underwriting cap-rate consistency is now unified across refinance, debt structure, scenario analysis, and DCF.
- Latest narrow worker change validated:
  - `api/admin-run-worker.js` now treats extracted `rent_roll` files as dispatchable into `parse-doc`
  - change was limited to:
    - `anyPending`
    - `hasPendingRentRoll`
    - rent-roll parse dispatch filter
  - parser logic, AI helper validation, publication flow, and Dashboard behavior remained unchanged
- Current AI Underwriting scoreboard:
  - `SYNTH-QA-P10` Screening AI Rent Roll Recovery = PASS
  - `SYNTH-QA-P08` AI/T12 + scale mismatch fail-closed = PASS
  - `01_positive_ai_rent_roll_underwriting` = PASS
  - `02_positive_ai_t12_underwriting` = PASS
  - `03_positive_dual_ai_recovery_underwriting` = PASS
  - `04_long_ai_rent_roll_stress_underwriting` = ACCEPTABLE FAIL-CLOSED stress result
  - AI Rent Roll Recovery is proven in Screening and in Underwriting for compact `.txt`; it is not scale-proven for long full-unit `.txt`
  - AI T12 Recovery is proven in Underwriting
  - dual AI recovery is proven in Underwriting
  - large rent roll preferred V1 path remains CSV/XLSX
- Current AI recovery scope clarification:
  - AI is not a universal document-understanding agent
  - current AI is narrow extraction fallback only:
    - AI Rent Roll Recovery
    - AI T12 Recovery
  - AI does not currently QA loan terms, property taxes, appraisal/cap-rate artifact selection, market survey classification, or final report output
  - AI did not catch the Motherload missed loan balance, tax year mistaken for tax amount, null appraisal masking usable cap rate, or market survey misclassification
  - broader AI QA requires a separate safeguard layer that can flag issues without writing accepted financial values
- April 30 QA-driven hardening completed:
  - `api/parse/parse-doc.js` loan-term parser recognizes `outstanding loan balance`, `outstanding balance`, `current loan balance`, and `current mortgage balance`
    - validated: `Outstanding loan balance: $8,750,000` -> `loan_amount = 8750000`
  - `api/parse/parse-doc.js` T12 text parser accepts `Gross Rental Income`, `gross rental revenue`, and `rental income` as GPR synonyms while preserving `validateCoreT12Payload`
    - validated: `Gross Rental Income: $1,036,800` -> `gross_potential_rent = 1036800`
  - `api/generate-client-report.js` refinance cap-rate selection now chooses the latest usable positive appraisal cap rate instead of allowing later null `appraisal_parsed` artifacts to mask support; explicit `refi_cap_rate` still wins
  - `api/generate-client-report.js` tightened `DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT` so rendered DSCR suppresses the flag, and improved Not Produced copy when debt terms are complete but refinance cap-rate / value support is incomplete
  - `api/report-template-runtime.html` cover title CSS now uses `hyphens: none`, `overflow-wrap: break-word`, `word-break: normal`, preventing `Un-derwriting`
  - `api/parse/parse-doc.js` property tax parser rejects year-like annual-tax values `1900-2100`, requires annual tax candidates `> 5000`, and emits `implausible_annual_tax` or `missing_annual_tax`
    - validated: `Tax Year: 2025` does not produce annual tax; `Annual Property Tax: $124,000` -> `124000`
  - `api/report-template-runtime.html` static Methodology headings are unnumbered: `InvestorIQ Estimates`, `Methodology Notes`, `Data Limitations & Missing Inputs`
  - `api/generate-client-report.js` whole-property rent-to-market gap basis standardized to in-place rent denominator
    - validation wording: `($219,240 - $186,780) / $186,780 = 17.4%`
- May 3 Section 04 wording polish completed:
  - `api/report-template-runtime.html` uses Section 04 title/subtitle tokens
  - `api/generate-client-report.js` populates tokens by report mode
  - Screening now renders `Unit-Level Rent Positioning` / `Market-rent gap based on uploaded rent roll`
  - Underwriting preserves `Unit-Level Rent Positioning & Value Sensitivity` / `Market-rent gap and implied value sensitivity`
  - post-deploy validation PDFs confirmed Screening and both Underwriting variants render correctly
  - no unresolved unit-positioning tokens appeared in parsed report text
  - item is CLOSED

- May 2 report polish / validation completed:
  - `Target Rent (Post-Reno)` and `Monthly Lift` wording replaced with neutral rent-positioning language:
    - `Documented Market Rent`
    - `Monthly Rent Gap`
    - `Unit-Level Rent Positioning & Value Sensitivity`
    - `Market-rent gap and implied value sensitivity`
  - Screening-style cover layout is now standard for Screening and Underwriting
  - Underwriting shows the cover metric strip when core metrics exist
  - extra divider above `ASSET CLASS / DOCUMENTS / REPORT TIER` was removed
  - cover metadata rows remain `ASSET CLASS`, `DOCUMENTS`, and `REPORT TIER`
  - final public samples should still use clean property names
  - `dedupeDataNotAvailableBySection()` no longer injects a section-level `data-gap-note` for `SECTION_8_DEAL_SCORE`
  - legitimate DSCR unavailable table-cell disclosure remains
  - misplaced Deal Scorecard `DATA NOT AVAILABLE` note no longer lands visually on the prior Scenario page
  - heading / metric-card punctuation cleaned:
    - `Full Refinance Sufficiency (Deterministic)`
    - `IMPLIED VALUE SENSITIVITY AT STABILIZATION`
    - `TOP INCOME LINE CONCENTRATION`
  - top income line concentration value renders as a standalone metric, e.g. `95.8%` or `98.8%`
- May 2 Deal Scorecard / DSCR verdict cap completed:
  - Underwriting Deal Scorecard caps displayed verdict when computed DSCR is below `1.25x`
  - if composite score is `>= 70` but computed DSCR is below `1.25x`, displayed verdict becomes `Review - Debt Coverage Constraint`
  - existing DSCR-not-assessed cap remains
  - Composite Score and DSCR factor row remain visible
  - Deal Scorecard note now clarifies that composite score is calculated from reported metrics only, base score thresholds are shown before mandatory DSCR verdict caps, and DSCR below `1.25x` or not assessed applies a mandatory Review verdict cap
  - Clean Underwriting validated: DSCR `1.09x`, Composite Score `75/100`, verdict `Review - Debt Coverage Constraint`
  - Messy Underwriting validated: DSCR `1.00x`, Composite Score `75/100`, verdict `Review - Debt Coverage Constraint`
- May 2 property-name sanitizer posture:
  - light `sanitizeDisplayText()` applies typo / spacing cleanup to property address and title, and remains the base cleanup step
  - aggressive `sanitizePropertyNameDisplayText()` affects PDF/report property name display only
  - raw DB `reports.property_name` is not sanitized
  - uploaded filenames / document sources are not destructively sanitized
  - production posture: preserve user-entered property names as source-of-truth display names; allow long names to wrap naturally; do not globally remove words like `Test`, `Final`, `Screening`, `Underwriting`, `Clean`, `Messy`, or `QA` from production names
  - final public samples should use clean names rather than relying on aggressive sanitizer expansion
  - later cleanup: remove aggressive sample/test cleanup from normal generation or gate it behind explicit admin/demo mode
- May 2 pricing page polish completed:
  - `/pricing` Report Comparison table now shows clear `Included` / `Not included` cells
  - first visible fix used boxed badges, then final polish replaced them with plain styled table text using page typography
  - file touched: `src/pages/Pricing.jsx`
  - no Stripe, checkout, entitlement, API, Dashboard, or report logic changed
  - `npm run build` passed; existing unrelated `AdminDashboard.jsx` warnings remain
- May 2 E2E / break-test harness added:
  - Node-based harness files:
    - `tests/e2e/run-e2e.js`
    - `tests/e2e/assert-report-output.js`
    - `tests/e2e/README.md`
    - `tests/e2e/results/latest-e2e-results.json`
  - package scripts:
    - `test:e2e`
    - `test:e2e:report`
  - harness supports static/default checks, report-path PDF/HTML/TXT assertions, `--profile underwriting-dscr-constrained`, and Wave 2/3/4 profiles
  - report assertions cover:
    - no `14.8%` rent-gap regression
    - `Market Rent Gap (Avg)` present
    - no `Market Rent Premium (Avg)`
    - no `Target Rent (Post-Reno)`
    - no `Monthly Lift`
    - no BUY/SELL language
    - no public AI terminology
    - no dangling `DATA NOT AVAILABLE` block
    - DSCR-constrained Underwriting shows `Review - Debt Coverage Constraint`
    - Composite Score and DSCR row remain visible
    - Deal Scorecard note includes base thresholds and mandatory Review verdict cap wording
  - latest report-output validation:
    - Screening PDF run: `37 PASS / 0 FAIL / 7 SKIP`
    - Clean + Messy Underwriting PDF run: `57 PASS / 0 FAIL / 7 SKIP`
    - regenerated underwriting combined JSON was superseded by later Wave profiles
- May 2 hardcore break-testing status:
  - Wave 1 report/static/output checks passed
  - Wave 2 mock lifecycle fail-closed fixtures added in `tests/e2e/fixtures/jobs/wave2-job-lifecycle.json`
    - scenarios: missing-rent-roll, missing-t12, unsupported-capex-only, scale-mismatch, partial-rent-roll-sample, incomplete-debt
    - result: `98 PASS / 0 FAIL / 8 SKIP`
  - Wave 3 fake Supabase / worker-state simulator added:
    - `tests/e2e/fake-supabase.js`
    - `tests/e2e/worker-state-scenarios.js`
    - result: `83 PASS / 0 FAIL / 8 SKIP`
    - no live Supabase, DocRaptor, Stripe, Resend, storage, emails, credits, or reports touched
    - remaining gap: simulator mirrors worker terminal behavior but does not execute `api/admin-run-worker.js` directly
  - Wave 4 parser-level adversarial fixtures added:
    - `tests/e2e/fixtures/parser/wave4-parser-adversarial.json`
    - `tests/e2e/parser-adversarial.js`
    - scenarios: loan rate / cap rate / LTV collision, generic rate outside loan context, tax-year collision, glued-number T12, malformed glued rent roll, partial rent roll with / without summary, unsupported CapEx prose
    - real parser bug found: LTV parser captured `Exit cap 6.25%` as LTV when `LTV 75%` followed
    - `api/parse/parse-doc.js` patch applied: same-line / LTV-label scoped parsing, preserves valid LTV formats, finite range guard `> 0 && <= 100`, prevents cap/refi/vacancy/tax percentages from becoming LTV
    - Wave 4 after patch: `78 PASS / 0 FAIL / 8 SKIP`
  - End-of-night May 2 / early May 3 Wave 4 expansion:
    - Claude review / follow-up investigation confirmed active columnar T12 parser risk:
      - row-label T12 table parsing selected first numeric cells
      - table detection could reject monthly-column row-label T12 layouts unless metric labels appeared in headers
      - no fixture previously proved Jan-Dec plus TTM / Annual Total selection
    - added adversarial fixture `columnar-monthly-t12-total-selection`
      - Jan-Dec plus `TTM Total`
      - expected GRI / EGI `192,960`, OpEx `120,790`, NOI `72,170`
    - fixture initially failed as expected, confirming active product bug
    - `api/parse/parse-doc.js` patch applied:
      - total-column detection for `TTM`, `T12`, `Trailing 12`, `Trailing Twelve`, `Annual`, `Annual Total`, and `Total`
      - prefers rightmost valid total-like numeric cell before first-numeric / monthly fallback
      - applied to row matrices, extracted tables, and CSV row-label fallback
      - added `Gross Rental Income` synonyms to shared T12 label rules
      - preserved percent-skip, `>$1B` rejection, coverage requirements, and core T12 validation
    - validation:
      - `node --check api/parse/parse-doc.js`: PASS
      - `node tests/e2e/run-e2e.js --profile wave4-parser-adversarial`: PASS including `columnar-monthly-t12-total-selection`
      - `npm run test:e2e`: `156 PASS / 0 FAIL / 8 SKIP`
  - Wave 5 launch-readiness red-team sweep completed:
    - repo-wide public-output sweep checked public AI terminology, BUY/SELL language, stale labels, mojibake, sanitizer risk, pricing / checkout / Dashboard launch blockers, and E2E harness health
    - no confirmed live public-output blocker found
    - legacy/unused risk remains in `api/html/sample-report.html` and `src/lib/pdfSections.js`; archive or clean before any public demo exposure
    - latest default `npm run test:e2e`: `156 PASS / 0 FAIL / 8 SKIP`
- April 30 validation notes:
  - 124 Richmond Screening Test:
    - engine / math passed, 9 pages, T12 and Rent Roll fully verified
    - issues: rent-gap basis inconsistency `17.4%` vs `14.8%`, `Target Rent (Post-Reno)` too strong without structured renovation input, Unit-Level Value Add / renovation wording may overstate Screening scope, public sample name must remove `Test`, and Methodology numbering fix requires regeneration
  - 124 Richmond CLEAN Underwriting:
    - engine / math passed, 17 pages, debt / DSCR / refi stress / T12 line items / expense drivers / rent roll / scenario / DCF rendered
    - DSCR `1.09x`; `Refinance Shortfall Under Stress`; cap-rate basis `6.25% (document derived)`
    - issues: sample name included `CLEAN`, `Underwritting`, `Test`; regenerate with clean property name; Methodology numbering fix requires regeneration; Target Rent / value-add labels need polish; review verdict optics where weak DSCR/refi shortfall conflicts with `Within Underwriting Parameters`
  - 124 Richmond MESSY Underwriting:
    - good stress test, not public/Ken sample
    - T12 line items rendered despite messy input; vacancy allowance lowered EGI/NOI as expected; core T12 and rent roll verified
    - DSCR not assessed because debt sizing balance was not parsed; scorecard correctly capped verdict at `Review`
    - issues: name included `MESSY`, `Underwritting`, `Test`; Methodology numbering fix requires regeneration; investigate messy debt parsing / QA artifact; collapse dangling `DATA NOT AVAILABLE`; same Target Rent / value-add wording concern
- Messy Underwriting Test 32 reached production-pass status after:
  - unifying cap-rate source to the document-derived path
  - removing the invalid cap-rate dimension from the DSCR sensitivity grid
  - renaming misleading refinance "Coverage" labels to proceeds-vs-debt-balance language
  - correcting overstated coverage disclosure
  - adding unsupported / excluded input disclosure
  - removing recommendation-style "PROCEED" language in favor of neutral underwriting framing
- Worker loop / double-trigger behavior has been re-verified as fixed in the live path:
  - `api/admin-run-worker.js` uses `maxSeconds = 55`
  - single-run publish path is confirmed through `pdf_generating` -> `publishing` -> `published`
- Forest City Manor acceptance investigation remains the key real-world underwriting proof case:
  - package included a PDF T12 / operating statement, XLSX rent roll, purchase assumptions PDF with debt-style terms, broker email, and renovation budget
  - this package should feel acceptable to a serious investor / user
  - Textract / text readability was not the main issue
  - the underwriting failure exposed downstream acceptance / gating narrowness rather than simple user-error or unreadable source documents
- User-facing failure-message interpretation from the acceptance investigation:
  - `Missing structured financials: t12` is only partially accurate and materially misleading for packages like Forest City Manor
  - it hides the narrower truth that a readable PDF T12 was uploaded, but the live underwriting gate only trusts spreadsheet-format structured T12
- Stripe purchase flow is architecturally imperfect in code review but functionally validated in real-world usage:
  - 30+ live end-to-end checkout tests have already been completed through the real pricing page using 100% coupon flow
  - Screening and Underwriting entitlements have both been repeatedly confirmed working in practice
  - Stripe is not a pre-launch patch target unless a real bug is reproduced
- Dashboard Report History now uses a lightweight stacked list/card layout instead of the prior table-based render path.
- This Report History render-path replacement is a production stabilization fix applied after controlled freeze isolation, not a temporary diagnostic patch.
- Worker single-run timeout issue was reproduced live, and a route-specific `maxDuration` override for `api/admin-run-worker.js` in `vercel.json` remains in place.
- Single worker kick was previously thought fixed, but later live retesting disproved that and the failed worker experiments were rolled back.
- Current worker posture is intentionally frozen at the last known-good rollback state, even if that still means 2 manual runs in some cases.
- Dashboard completion auto-reload experiments were attempted and then fully reverted after regression risk / freeze return.
- Reverted manual-refresh Dashboard state is the locked V1.0 posture.
- The narrow completion-hook experiment in `Dashboard.jsx` was also tried and reverted:
  - tracked `hasActiveProcessingJob`
  - detected `true -> false`
  - fired one isolated `fetchReports()` call
  - initially appeared to work
  - freeze signs then returned
  - experiment was fully removed
- Launch-safe Dashboard containment now favors the centered Report History helper note over further sync logic.
- Deterministic vs narrative layer is now confirmed more precisely:
  - pure deterministic layer includes parsing, T12 / rent roll rollups, occupancy, NOI, expense ratio, NOI margin, DSCR, refinance stress, and scenario / deal-score / risk-register math
  - template replacement layer is `api/report-template-runtime.html` plus token replacement / section stripping in `api/generate-client-report.js`
  - narrative slots exist in the renderer but are mostly inactive in the live worker path because `body.sections` is not populated by production worker calls
  - true LLM-generated narrative is not active in the current live production path
- Cost / OpenAI clarification:
  - despite earlier assumptions, current codebase inspection indicates the live report path is not actively using OpenAI API
  - this matters for real variable-cost assumptions and future pricing analysis
  - current live variable cost is more likely concentrated in Stripe, Textract, DocRaptor, and infrastructure / storage
  - OpenAI API cost should not currently be treated as a confirmed live per-report cost unless a new active path is later introduced
  - this improves expected margins and makes modest transactional email spend acceptable if needed for reliable launch notifications
- Notifications / provider status:
  - report-published email path remains wired in code through the worker publish flow
  - Amazon SES production access was denied and the account remains in sandbox
  - scope of the provider cutover was intentionally kept narrow
  - `lib/email-ses.js` was not globally replaced
  - new helper `lib/email-resend.js` was added
  - the helper uses native `fetch` to call Resend
  - only the `report_published` send call in `api/admin-run-worker.js` was changed from `sendEmailSES(...)` to `sendEmailResend(...)`
  - obsolete missing-doc SES sends in `api/admin-run-worker.js` were later retired because that workflow no longer matches the live product model
  - the top-level worker import of `sendEmailSES` was removed from `api/admin-run-worker.js`
  - worker no longer imports `sendEmailSES`
  - current live `report_published` email wording was updated and validated live
  - subject remains `Your InvestorIQ report is ready`
  - sender remains `InvestorIQ <reports@investoriq.tech>`
  - Resend is now the preferred launch notification provider for report-published emails
  - launch-critical report-ready notifications are materially de-risked
  - obsolete SES worker exposure has been removed from the active publish path
  - `lib/email-ses.js` may still remain in the repo for now as legacy leftover code, but it is no longer part of the active worker path
  - broader final SES cleanup / deletion can happen later and is no longer a launch blocker
  - this removes SES sandbox / approval risk from the primary user-facing publish-notification flow
- Pricing page and Checkout Success page now include the business-day turnaround disclosure:
  - "InvestorIQ reports are typically delivered within 1 business day. Submissions received after business hours, on weekends, or on holidays begin processing on the next business day."
- Multi-quantity Stripe checkout now supports quantity selection for Screening and Underwriting.
- `api/create-checkout-session.js` now passes quantity into Stripe line items and metadata.
- Stripe webhook entitlement creation now writes one `report_purchases` row per purchased credit.
- Rare Stripe partial-failure path is now closed:
  - duplicate webhook event IDs no longer short-circuit as complete until expected entitlement rows are confirmed
  - if `stripe_events` exists but some `report_purchases` rows are missing, webhook inserts only the missing rows
  - quantity behavior and deterministic suffixed `stripe_session_id` pattern were preserved
- Dashboard checkout-success banner copy is now quantity-neutral.
- Dashboard purchase flow now again supports quantity selection while the public Pricing page remains quantity-free.
- Screening heading leak is now fixed in the true live generation path.
- PDF brand spacing / kerning fix was applied through CSS letter-spacing adjustment only.
- Break-even occupancy investigation confirmed the formula itself can remain, while shared operating cushion logic was the actual bug.
- Shared operating cushion calculation now uses current occupancy minus break-even occupancy when current occupancy is available.
- Latest Doberman validation found NOI breakdown numeric wrapping is still a live launch-fix candidate.

### Prompt / Hallucination Risk Clarification (April 2026)

- Locked v7.1 master prompt policy exists and remains the governing prompt standard.
- Current system strength comes from structured-input-first generation, deterministic math, and fail-closed handling.
- Pre-launch risk is not classic hallucination inside the model logic.
- The larger risk is accidental late-stage wording edits introducing unsupported claims.
- Pre-launch patch style therefore remains:
  - anchor-locked
  - minimal diff
  - no broad narrative rewrites
  - deterministic only

### Recent Parsing & Underwriting Hardening (April 2026)

- Microscope review completed:
  - clean Screening
  - clean Underwriting
  - messy Underwriting
- Microscope review findings:
  - clean Screening math checked out against source documents
  - clean Screening surfaced wrong-report-type leakage in the heading: `Data Coverage & Underwriting Gaps`
  - clean Underwriting surfaced a real debt parsing bug where purchase price was being used as current debt balance instead of the parsed loan amount
  - messy Underwriting debt parsing and core math looked materially correct
  - underwriting PDFs surfaced a presentation issue in NOI breakdown numeric wrapping
- Debt document routing hardened:
  - Normalized `debt_term_sheet` -> `loan_term_sheet` in `parse-doc.js` to ensure consistent extraction path and artifact generation.
- Loan term sheet inference expanded:
  - `inferDocTypeFromText(...)` now supports compact lender-style debt summaries (e.g., "REFI TERMS", "Rate", "AM", "LTV") using signal-count + financing-pattern gating.
  - Prevents valid debt documents from falling into `supporting_documents_unclassified`.
- Loan amount extraction hardened:
  - `api/parse/parse-doc.js` fixed the clean underwriting loan amount parsing bug.
  - Fallback loan amount candidate now only applies when no explicit / compact loan match exists.
- Result:
  - Messy debt documents now correctly produce `loan_term_sheet_parsed` artifacts.
  - Clean underwriting debt balance no longer substitutes purchase price when an explicit loan amount is present.
  - Underwriting debt inputs (loan balance, rate, amortization, LTV) now route correctly from both clean and messy lender formats.
  - Screening heading was corrected from `Data Coverage & Underwriting Gaps` to `Data Coverage & Screening Notes`.
  - Underwriting NOI breakdown presentation was patched with nowrap on values / percentages to stop ugly numeric wrapping.
  - Header mobile-menu visibility was corrected by moving hamburger flex behavior into `className`, preventing desktop visibility.
  - Public pricing page cleanup completed:
    - removed quantity selector from the public pricing page
    - public pricing page checkout now hard-calls quantity `1`
    - copy changed to `Portfolio pricing available on request.`
- Final T12 numeric extraction hardening completed across ALL parsing layers:
  - Layer 1: `parseMoneyLike` fixed to ignore `%` tokens and adjacent numeric bleed
  - Layer 2: table parsing guarded with:
    - percent-column skip logic
    - >$1B sanity bounds to reject malformed concatenations
  - Layer 3: text extraction regex hardened in `api/parse/parse-doc.js`:
    - updated currency match to prevent trailing numeric capture bleed
    - new regex:
      `/\(?-?\$?\s*([\d,]+(?:\.\d{1,2})?)\)?(?!\s*\d)/`
    - ensures extraction stops before adjacent numeric tokens (e.g. `100%`)
- Result:
  - prevents concatenation bugs such as:
    - `$2,517,120 100%` -> `2,517,120,100` (now eliminated)
  - ensures clean isolation of financial values from mixed-format T12 rows
- Parsing system classification:
  - now considered **multi-layer hardened**
  - both text-based and table-based extraction paths are aligned and safe

### Latest Live Validation Status (April 2026)

- Screening Test 7 = GREEN
  - Screening remains green
  - heading correctly shows `Data Coverage & Screening Notes`
  - report remains materially document-driven and deterministic

- CLEAN Underwriting Test 7 = GREEN
  - clean Underwriting remains green
  - clean underwriting path remains materially document-driven and deterministic
  - underwriting reports now display `6.25%` consistently where the document-derived exit / refi cap is shown

- MESSY Underwriting Test 7 = GREEN
  - messy Underwriting remains green
  - messy Underwriting remains strong validation evidence of deterministic messy-doc handling
  - underwriting reports now display `6.25%` consistently where the document-derived exit / refi cap is shown

- Practical review conclusion
  - Screening Test 7 is showcase-ready
  - CLEAN Underwriting Test 7 is showcase-ready
  - MESSY Underwriting Test 7 is strong validation evidence of deterministic messy-doc handling
  - report-core quality is not the immediate concern right now
  - dashboard reliability has re-emerged as the bigger pre-outreach concern

- Vacancy investigation conclusion
  - clean-vs-messy underwriting difference was investigated
  - conclusion:
    - not a parser bug
    - not a hallucination issue
    - not a clean-path math bug
  - clean T12 simply did not contain a vacancy row
  - messy T12 did contain a vacancy row
  - InvestorIQ correctly did not invent vacancy for the clean file
  - this is working as intended under the document-driven / fail-closed doctrine

### Dashboard Current Truth (April 2026)

- Dashboard freeze / lag remains a monitored launch-risk item and is not declared solved.
- Current working interpretation:
  - catastrophic full-freeze behavior was materially reduced
  - remaining risk is broader Dashboard render pressure / coupling rather than one isolated bad line
  - manual Refresh remains the locked pre-launch posture
- Durable Dashboard hardening already in place:
  - property-input churn and polling pressure were reduced
  - the old Report History table/rows subtree was replaced with a lightweight stacked list/card layout
  - equality guards were added to reduce unchanged state commits for active jobs, recent jobs, and reports
  - the real 4-section Dashboard branch was restored
  - completed-report visibility remains manual-first
- Current launch posture:
  - do not treat Dashboard as solved
  - do not resume Dashboard sync experiments before launch unless a brand-new blocker appears
  - no auto completion reload before launch
  - Report History remains manual refresh for V1.0
  - keep the existing helper note that completed reports may take a moment to appear
- Worker / Dashboard coordination truth:
  - worker remains frozen at the last known-good rollback after failed worker experiments
  - customer-facing `needs_documents` is not a valid V1 endpoint
  - report and job visibility still require caution, but current launch work is report/red-team/readiness first

### Stripe Quantity Checkout and Entitlements (April 12, 2026)

- Quantity selector (1-5) added to Pricing cards for both Screening and Underwriting.
- `api/create-checkout-session.js` now passes quantity into Stripe line items and session metadata.
- Webhook now creates one `report_purchases` row per purchased credit.

- Live bug investigation path:
  - Stripe metadata confirmed `productType=underwriting`, `quantity=5`, and valid `userId`
  - `report_purchases` initially showed 0 matching rows for the exact session
  - Vercel webhook logs exposed false-success behavior, then a NOT NULL constraint issue (`23502`)
  - first webhook fix removed false-success logging and stopped the null session-id strategy
  - final fix:
    - first entitlement row keeps exact `stripe_session_id`
    - rows 2..N use deterministic suffixed ids such as `sessionId#2`, `sessionId#3`, etc.

- Final live validation result:
  - 5 underwriting credits successfully created
  - Dashboard underwriting count updated correctly

- Business note:
  - when creating a coupon for Ken Dunn, quantity / offer behavior should be considered carefully so he cannot accidentally run more reports than intended

### Reports Query Schema Fix (April 2026)

- Dashboard reports were failing to load and causing UI freeze.
- Supabase error identified:
  - `column reports.status does not exist`

- Root cause:
  - Frontend query in `Dashboard.jsx` requested a non-existent `status` column from `public.reports`.

- Fix applied:
  - Removed `status` from all `.select(...)` calls on `reports`.

- Final query:

```js
.select('id, property_name, report_type, created_at, storage_path')
```

- Result:
  - reports load successfully
  - Supabase queries execute cleanly
  - this fixed one concrete query failure, but it did not permanently close the broader Dashboard freeze issue

### Dashboard Historical Investigation Note (Compressed)

- Earlier April diagnostics confirmed the freeze/lag issue was real, involved Dashboard-local render/state churn, and was materially improved by the Report History render-path replacement plus later equality-guard hardening.
- Current operational truth is the `Dashboard Current Truth` section above; do not treat older diagnostic branches as active work.
## 7. Current Remaining Issues / Immediate Next Work
### Completed recent fixes
- Batch 1 Critical Math Integrity: completed / verified pass.
- Batch 2 Rendering / Presentation Integrity: closed.
- Batch 3 public-language, disclosure, ASCII, mojibake, and score-label cleanup: materially completed.
- Batch 4 score / disclosure / footer / value-add polish: completed.
- Batch 5 Step 03 / rendering-stage `needs_documents` cleanup: completed.
- Batch 6A / 6A.2 explicit rent-roll summary totals trust path: completed and validated.
- Batch 6B CapEx / renovation disclosure: completed and validated.
- DCF exact document-derived cap-rate consistency: completed and validated.
- Final Richmond / Forest regression suite: passed.
- Final layout polish pass: closed.
- May 3 Screening-only Section 04 wording polish: closed and live-validated.

- Purchase-assumption DSCR note:
  - current engine correctly refuses to use purchase assumption terms as current-debt DSCR when no debt balance is provided
  - future enhancement: optional Acquisition DSCR / Pro Forma Debt Coverage metric from purchase assumptions, separate from current debt assessment

### Immediate agenda - May 1, 2026 - superseded by May 2 validation
- CLOSED / superseded:
  - rent-gap basis standardized to in-place denominator
  - reports regenerated and validated after Methodology numbering patch
  - messy underwriting debt parsing investigated; narrow loan-rate parser gap patched
  - dangling Deal Scorecard `DATA NOT AVAILABLE` note fixed
  - `Target Rent (Post-Reno)` / `Monthly Lift` wording replaced with neutral rent-positioning labels
  - verdict optics fixed with DSCR below-threshold Review cap
  - pricing comparison table visibility / premium styling fixed
  - E2E harness and Waves 1-5 validation added
- STILL OPEN from that agenda:
  - use clean public sample property names only: no `Test`, no `CLEAN`, no `MESSY`, no typo `Underwritting`
  - decide final public / Ken sample candidate
  - DocRaptor production mode before any public sample PDF
  - consider small deterministic final-render QA artifact only after sample selection
  - remove or admin/demo-gate aggressive property-name sample sanitizer in normal generation

- STILL OPEN
  - **P0 closed:** existing-report reuse is patched/deployed/live-retested; preserve this fix during any V2 audit/merge.
  - AI recovery Underwriting control is complete enough for launch confidence:
    - AI T12 Underwriting = PASS
    - compact AI Rent Roll Underwriting = PASS
    - dual AI Underwriting recovery = PASS
    - long full-unit `.txt` rent-roll stress = acceptable fail-closed limitation evidence
  - Optional: run `SYNTH-QA-P05 Missing Rent Roll`.
  - Verify next Stripe checkout creates entitlements automatically with 200 webhook delivery after the May 5 domain fix.
  - Optional cleanup: decide whether to keep or delete the extra 5 manually inserted underwriting credits from the May 5 webhook outage workaround.
  - Ken Dunn sample package review.
  - Final readiness check / sample package selection.
  - Dashboard freeze / lag remains a monitored launch-risk item, not solved; May 7 `SupabaseAuthContext` auth/profile-churn patch is applied and early manual testing improved behavior, but continue monitoring.
  - Worker remains frozen at the last known-good rollback unless a brand-new blocker appears.
  - Do not build a `Final_Testing` batch harness before Ken Dunn.
  - Broader accepted-file-type hardening remains open for `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, and image text extraction.
  - If unsupported types remain unsupported pre-launch, tighten upload acceptance rather than pretending support exists.
  - QA Phase 1A/1B/1C is implemented: rendered-report advisory QA, source-to-report coverage QA, QA fix routing, and QA rollup are now internal advisory artifacts.
  - Future AI work also includes chunking / large-text rent-roll recovery and clearer large-rent-roll CSV/XLSX guidance.
  - Optional later cleanup: SES helper cleanup, entitlement source-of-truth cleanup, Dashboard auto-visibility hardening, and broader table / schema hygiene.

### Before Ken Dunn outreach
- Universal report-quality doctrine:
  - InvestorIQ does not create separate quality tiers by user. Ken Dunn, public samples, and standard customers are held to the same report-quality standard. High-value outreach may receive additional human attention, but the product standard remains universal: every report should be document-driven, deterministic, internally QA-reviewed, and classified honestly against an elite institutional-readiness bar.
- Keep launch doctrine locked:
  - document-driven
  - deterministic
  - fail closed
  - no BUY / SELL language
  - no fabricated narrative
  - one generation per purchased report
  - Codex-first / micro-patch workflow

### Exact next task / resume point

- **Immediate resume point - May 12 morning underwriting overblocking crisis:**
  - Start a fresh chat from this point.
  - Do not run more live tests until the current Forest City Final Test 3 Admin Review hold is explained from file truth.
  - Do not patch more one-off symptoms.
  - First Codex task must be investigation-only.
  - Investigate why `UNSUPPORTED_CURRENT_DEBT_RENDERED` is triggering on Forest City acquisition/no-true-current-debt underwriting.
  - Inspect:
    - `api/generate-client-report.js`
    - `api/_lib/report-contract-qa.js`
    - `api/_lib/qa-action-plan.js`
    - `api/_lib/source-report-coverage-qa.js`
    - `api/_lib/qa-manager-review.js`
    - `api/admin/queue-metrics.js`
    - `src/pages/AdminDashboard.jsx`
    - current job artifacts for Forest City Final Test 3 if available.
  - Required classification before any patch:
    - renderer leak
    - contract false positive
    - gate overpromotion
    - QA manager source-context drift
    - admin dashboard display confusion
    - combination.
  - Required outcome:
    - customer-delivery blockers are limited to true unsafe/unsupported output or true source contradictions.
    - public/outreach/sample blockers do not prevent normal customer delivery.
    - acquisition-only underwriting renders proposed acquisition debt separately and safe current-debt limitation language without being falsely held.
    - true-current-debt underwriting still renders DSCR/refi only when true balance/service/rate/amortization are present.
    - Admin Dashboard selected detail becomes simpler and less overwhelming after core gate behavior is fixed.

- **Immediate resume point - May 8 evening after Report Contract QA / AI Director / parser alias hardening:**
  - Deploy the parser alias patches if not already deployed.
  - Rerun Maplewell FINAL TEST 1 only.
  - Do not run all six synthetic validation packages simultaneously.
  - Inspect:
    - `analysis_job_files` parse statuses
    - generated PDF
    - `report_contract_qa`
    - `qa_director_review`
    - `qa_action_plan`.
  - Expected Maplewell result:
    - T12 parsed
    - Rent Roll parsed
    - Debt Summary parsed
    - Property Tax parsed
    - report publishes
    - current-debt/DSCR/refi logic renders because true current debt is provided
    - `report_contract_qa.contract_status = pass`
    - `qa_director_review.overall_director_decision = no_missed_issue_detected`
    - `qa_action_plan.customer_delivery_ready = true`
    - only acceptable public/high-value blocker remains `DOCRAPTOR_NOT_PRODUCTION_MODE`.
  - If failure occurs, inspect `analysis_job_files` and artifacts for that single job before patching.
  - If Maplewell passes, continue the remaining synthetic packages one at a time.
  - Continue one-step-at-a-time workflow.
  - Preserve Codex usage discipline through May 12; use Codex for surgical changes only.
  - ChatGPT should reason from uploaded files/artifacts first where possible.
  - Do not close the user's Chrome tab group as part of testing; grouped tabs are intentionally reopened daily.
  - Do not flip DocRaptor production until final test-mode public-candidate outputs are clean.

- **Immediate resume point - May 5 current state after QA/Forest City hardening:**
  - Dashboard freeze is open/monitored but not today's active blocker.
  - Stripe webhook/domain issue is fixed and must be added to launch checklist.
  - Immediate next task is one fresh Forest City Full Underwriting job from scratch, followed by QA artifact and final PDF inspection.
  - Optional operational cleanup remains: decide whether to keep/delete the extra 5 manually inserted underwriting credits.
  - Keep `investoriq.tech` and `www.investoriq.tech` attached to the current production Vercel project; confirm next Stripe checkout creates entitlements automatically with webhook 200.
  - Continue Dashboard freeze monitoring; `src/contexts/SupabaseAuthContext.jsx` auth/profile-churn fix is now applied as of May 7.
  - Resume V2 adoption carefully: V2 remains reference/blueprint only; useful ideas must continue to be manually rebuilt against current repo truth.
  - Continue final public/Ken sample path: clean public sample package selection; no test suffixes / testing filenames for final samples; DocRaptor production smoke only after test-mode public-candidate outputs are clean.
  - Preserve current closed fixes:
    - report_type-scoped existing-report reuse
    - Screening-only Section 04 wording
    - DSCR below 1.25x verdict cap
    - no `reports.status` queries
    - `report_purchases` schema truth
    - credit restoration clears both `job_id` and `consumed_at`
    - no public AI language
    - no BUY / SELL language
    - DocRaptor production guard

- **Historical May 4 V2 audit task - completed May 5 / superseded:**
  - V2 audit found V2 is not wholesale mergeable.
  - V2 should remain blueprint/reference material with selective manual cherry-picks only.
  - Do not blind-swap any V2 file into current repo.
  - High-value V2 concepts remain candidates after redesign/manual integration: advisory Rendered Report QA, Final Review Queue, User Drilldown, Bulk Credit Grant, and narrow Dashboard guard ideas.

- **Immediate resume point - May 4 more testing before DocRaptor production smoke:**
  - Same-name Screening/Underwriting report-reuse P0 is patched, deployed, and live-retested closed.
  - Screening-only Section 04 wording polish is patched, deployed, and live-validated closed.
  - Begin tomorrow morning with more testing as requested by the user.
  - Do **not** proceed directly to public sample publication.
  - Do **not** flip DocRaptor production mode until final test-mode public-candidate Screening and Underwriting outputs are clean.
  - Recommended next test sequence:
    - run or review one more clean Screening public-candidate sample in test mode
    - run or review one more clean Underwriting public-candidate sample in test mode
    - if available, run a T12-columnar live sample to validate the Jan-Dec plus total-column parser patch in the live flow
    - optionally run one fail-closed case to verify no report row is created and credit is restored
    - run report-path E2E assertions against downloaded PDFs/text outputs where possible
  - Known remaining non-engine blockers:
    - DocRaptor watermark/test bands remain until controlled production smoke
    - final public/Ken sample titles must be clean, with no testing suffixes such as `- 2`
    - final public/Ken Uploaded Files must use clean filenames, with no `Test`, `CLEAN`, `MESSY`, or `UNSUPPORTED`
    - final public sample package must be separate from stress-test packages
  - Live validation results after P0 closure:
    - Screening `124 Richmond Street, London, ON` = PASS
    - Clean Underwriting `124 Richmond Street, London, ON` = PASS as validation proof
    - Messy Underwriting `124 Richmond Street, London, ON (MESSY)` = PASS as stress proof, not public/Ken sample
    - post-polish Screening `124 Richmond Street, London, ON - Screening 2.pdf` = PASS for Screening-only Section 04 wording
    - post-polish Clean Underwriting `124 Richmond Street, London, ON - 2.pdf` = PASS for Underwriting Section 04 wording preservation
    - post-polish Messy Underwriting `124 Richmond Street, London, ON (MESSY) - 2.pdf` = PASS for Underwriting Section 04 wording preservation
  - Report content checks passed in parsed text:
    - no BUY / SELL
    - no AI / AI-assisted / IQ-assisted public wording
    - no Riverbend leakage
    - no stale `12.1 / 12.2 / 12.3` Methodology headings
    - no `Target Rent (Post-Reno)`
    - no `Monthly Lift`
    - no dangling `DATA NOT AVAILABLE`
    - DSCR below `1.25x` correctly caps displayed verdict at `Review - Debt Coverage Constraint`
    - no raw unit-positioning title/subtitle tokens appeared after the May 3 template/generator polish patch
  - Clean and messy underwriting prove the engine is materially stable:
    - Clean Underwriting DSCR `1.09x`, composite `75/100`, verdict `Review - Debt Coverage Constraint`
    - Messy Underwriting DSCR `1.00x`, composite `75/100`, verdict `Review - Debt Coverage Constraint`
    - messy vacancy allowance correctly reduced EGI/NOI by `$5,788`
  - Worker-kick note:
    - one manual worker kick was not enough to complete all three queued live test reports
    - second worker kick completed the set
    - monitor only; do not treat as a report-core blocker unless jobs become stuck
  - Controlled DocRaptor production smoke remains later:
    - set `DOCRAPTOR_MODE=production`
    - set `ALLOW_PRODUCTION_PDF=true`
    - redeploy
    - admin-regenerate one already-validated clean job
    - confirm no `DOCRAPTOR_NOT_PRODUCTION_MODE` QA flag
    - confirm no watermark/test bands
    - run report-path E2E assertions
  - Stop/go rule:
    - GO to DocRaptor production smoke only after final test-mode public-candidate Screening and Underwriting publish cleanly with no public-output defects.
    - STOP if any report reuses another report artifact, fabricates core metrics, silently accepts missing required docs, emits public AI / BUY / SELL language, fails DSCR verdict cap, or produces test/internal filenames in final public sample output.

- Use anchor-locked minimal diffs only.
- No refactors.
- No random patching.
- Codex-first investigation before worker / Dashboard / parser patches when Codex is available; while Codex is unavailable, manual patches must remain file-upload verified and anchor-locked.
- Worker success flow remains protected.
- Dashboard remains manual-refresh / cautious posture.
- Patch only real regressions found.
- No Dashboard changes until report blockers are resolved.
## 7.1 Reports Table Schema (Locked)

```text
id
user_id
property_name
storage_path
created_at
report_type
```

Notes:

- `report_type` is the only classification field (`screening`, `underwriting`)
- No `status` column exists in `public.reports`
- Any future queries must NOT reference `status`

## 7.2 Report Purchases Schema Reality (Locked)

```text
id
user_id
product_type
stripe_session_id
job_id
consumed_at
created_at
```

Notes:

- `product_type` is the purchase classification field (`screening`, `underwriting`).
- There is no `report_type` column in `public.report_purchases`.
- There is no `consumed` boolean in `public.report_purchases`.
- A purchase is considered consumed when `job_id` and `consumed_at` are populated.
- To restore a credit manually after a system-side failed/bad publication, clear only the affected purchase row's `job_id` and `consumed_at`, using `product_type` and the specific bad `job_id` as safeguards.

## 8. Key Files
- V2 / QA audit reference files uploaded May 4:
  - `InvestorIQ-Empire-v2` folder / zip
  - `INVESTORIQ_ADMIN_RECOMMENDATIONS.md`
  - `INVESTORIQ_DASHBOARD_FREEZE_RCA.md`
  - `INVESTORIQ_MASTER_DOCUMENT.md`
  - `INVESTORIQ_QA_CHANGES.md`
  - `README_QA.md`
  - `UNDERWRITING_GAMEPLAN_v2.md`
  - `ELITE_ROADMAP.md`
- `api/generate-client-report.js`
- `api/report-template-runtime.html`
- `api/parse/parse-doc.js`
- `src/lib/pdfSections.js`
- `src/pages/Dashboard.jsx`
- `src/pages/AdminDashboard.jsx`
- `api/admin/queue-metrics.js`
- `api/admin/run-eligible-jobs-once.js`
- `api/legal-acceptance.js`
- `api/admin-run-worker.js`
- `src/pages/Pricing.jsx`
- `lib/ai-rent-roll-recovery.js`
- `lib/ai-t12-recovery.js`
- `api/parse/extract-job-text.js`
- `tests/e2e/run-e2e.js`
- `tests/e2e/assert-report-output.js`
- `tests/e2e/fake-supabase.js`
- `tests/e2e/worker-state-scenarios.js`
- `tests/e2e/parser-adversarial.js`
- `tests/e2e/fixtures/jobs/wave2-job-lifecycle.json`
- `tests/e2e/fixtures/parser/wave4-parser-adversarial.json`

## 9. Working Style / Patch Rules
- Anchor-locked patches only when possible.
- No refactors unless explicitly approved.
- Minimal diffs only.
- Fail on anchor mismatch rather than guessing.
- Deterministic changes only.
- No broad narrative rewrites in the final validation window.
- Preserve institutional tone and document-driven logic.
- We are too close to launch day to allow uncontrolled code churn.
- Minimal reversible changes only.
- One step at a time.
- No guessing.
- Anchor-based reasoning only.
- Token discipline applies: prefer compressed patch receipts over verbose Codex summaries.

## 10. Codex-First Workflow (Locked)

  - All investigation and code extraction should be performed by Codex first.
  - ChatGPT acts as:
  - verifier
  - reasoning layer
  - patch planner

  - Standard flow:
  1. ChatGPT provides micro-prompt
  2. Codex returns exact file-truth code
  3. ChatGPT analyzes and determines next step
  4. Only then propose anchor-locked patch (if needed)

  - Never skip Codex investigation for:
  - Dashboard logic
  - Worker logic
  - Parser logic

  - No direct guessing or speculative patches without Codex-backed file truth.
  
  ## 10.1 Codex Token Discipline / Compressed Patch Receipts (Locked)
  Status: Governing default protocol unless explicitly overridden.

  ## Purpose
  - GPT-5.5 Codex usage must conserve tokens aggressively.
  - Default operating mode is compressed patch receipts, not verbose patch explanations.

  ## Default Codex Return Format (Required Unless Explicitly Overridden)

  Codex should return SHORT FORM RECEIPT ONLY:

  A. Files changed
  - file path(s) only

  B. Patch summary (max 5 bullets)
  - grouped changes only
  - what changed, not full diff restatement
  - no repeated old/new snippets
  - no code blocks unless anchor mismatch occurred

C. Safety note
- one sentence only

D. Validation (if applicable)
- `node --check` pass/fail only

E. Retest checklist
- max 5 bullets
- concise verification only

### Prohibited by Default
Do NOT return:
- long explanations
- rationale essays
- repeated old/new snippets
- duplicate anchor restatements
- giant diff summaries
- unnecessary blast-radius prose
- token-heavy narrative explanations
- do not echo entire old/new snippets unless specifically requested

### Rule
- Default to compressed patch receipts unless FULL DIFF MODE is explicitly requested.
- Assume ChatGPT maintains master context and acts as:
  - verifier
  - reasoning layer
  - patch planner

### Standard Codex footer instruction
Use this in patch prompts by default:

Return SHORT FORM RECEIPT ONLY.
Do not restate code unless anchor mismatch occurred.
Optimize for token conservation.

### Reason
- Preserve GPT-5.5 usage budget
- Reduce Codex token burn
- Keep more budget available for audits and actual code investigation
- Prioritize file truth over verbose reporting

### Trigger Phrase
If prompt includes:
"Compressed Receipt Mode"

Codex should automatically use Section 10.1 format.

## 10.2 Repo-Wide Audit Mode (Locked)
Status: Governing escalation protocol when repeated failures indicate systemic risk.

Principles
- audit entire file before patching when repeated failures occur
- prefer bundled patch sets over drip patches when bug class is systemic
- repo hygiene / duplicate logic scan before launch outreach
- red-team audit before messaging Ken Dunn

Trigger condition:
Use Repo-Wide Audit Mode after two failed surgical patches in the same bug class.

## 10.3 AI/Admin QA Safeguard Layer / Rendered Report QA Direction
- May 5 implementation status:
  - Rendered Report QA Advisory is implemented as `rendered_report_qa_advisory`.
  - Source-to-Report Coverage QA is implemented as `source_report_coverage_qa`.
  - QA Fix Routing is implemented as `qa_fix_routing`.
  - QA rollup is implemented as `qa_review_summary`.
  - All remain advisory-only and internal-only. No QA blocking, no `qa_review_required`, no worker lifecycle change, no report rewriting, and no financial value changes.
  - The next validation action is a fresh Forest City Full Underwriting retest from scratch, not more QA planning.
- May 5 V2 audit refinement:
  - V2 QA architecture is conceptually valuable but not safely implemented for wholesale merge.
  - First safe Rendered Report QA implementation was built as advisory-only:
    - inspect final rendered HTML/text after token replacement and section stripping
    - write internal `analysis_artifacts` QA artifact only
    - do not block publication in Phase 1
    - do not add `qa_review_required`
    - do not alter worker lifecycle
    - do not rewrite report content
    - do not change financial values
    - do not override deterministic parsers
    - do not expose AI publicly
  - Future blocking may be considered only after advisory data is reviewed.
  - If future blocking is adopted, threshold posture should stay permissive, e.g. `QA_BLOCK_BELOW_SCORE=60` plus critical kill flags; do not copy V2's aggressive default `80`.
  - V2 Final Review Queue / Admin Command Centre / User Drilldown / Bulk Credit Grant concepts are reference material only until manually rebuilt against current repo truth.
- May 4 direction changed after repeated rendered-report QA findings and V2 showroom review:
  - user wants to move beyond narrow AI extraction and add a final rendered-report QA / Editorial QA layer
  - purpose is to stop the manual whack-a-mole loop of running new properties and discovering small-but-publicly-damaging issues one report at a time
  - Codex must audit V2 before adoption; do not assume V2 docs or showroom equal current repo truth
  - desired standard is universal: elite QA for every report, not special handling by user tier
  - preferred initial posture after audit: adopt QA layer only if it preserves deterministic source-of-truth rules and current production safeguards
  - if blocking gate is adopted, start with permissive threshold and critical-flag awareness; do not let prose nits silently halt otherwise-defensible reports
- Status changed after Motherload QA:
  - Phase 1 internal deterministic QA safeguard is implemented as launch hardening
  - concierge hold, Stripe promo-code tagging, report visibility suppression, RLS changes, and admin approval workflow were deliberately deferred
  - user concern remains high-value users, especially `$100M+` portfolio prospects, hitting failed reports or weak sample reports
  - question has shifted from "Can the report engine publish?" to "Can InvestorIQ recognize whether a published report is actually investor-ready?"
- Public-positioning constraint:
  - this layer is founder/internal only
  - public language should use internal quality safeguards, source-verification controls, deterministic validation, document-driven / document-backed, and proprietary document-driven underwriting infrastructure
  - do not expose AI QA / AI-assisted QA / AI fallback language in customer or website copy
- Locked doctrine:
  - InvestorIQ is document-driven
  - deterministic parsers and calculations remain the source of truth
  - AI may help read / extract documents, but may not become the source of financial truth
  - AI must not write or override NOI, rent, occupancy, debt, DSCR, cap rate, valuation, refinance, or deal score
  - no BUY / SELL language
  - no fabricated values
  - fail closed when documents are missing, unsupported, or materially inconsistent
- Implemented Phase 1:
  - `api/generate-client-report.js` builds deterministic, internal, non-blocking QA flags
  - writes `analysis_artifacts.type = report_qa_flags`
  - bucket `internal`
  - payload includes `qa_status`, `severity`, `flags`, report type/tier, and HTML length
  - if QA artifact insert fails, report generation should not fail
  - no report visibility changes, email suppression, RLS changes, Stripe/promo changes, worker state machine changes, parser-output changes from QA itself, or customer-facing copy
- Initial QA flags cover / validate:
  - missing debt balance where debt context exists
  - DSCR not assessed despite debt context
  - property tax amount implausible / year-like
  - T12 totals-only / no meaningful line detail
  - market survey / support-doc classification review
  - cap-rate / appraisal support not used or masked
  - DocRaptor non-production mode as internal QA flag
- Earlier Phase 1 lesson, now superseded by Phase 1A/1B/1C:
  - original deterministic `report_qa_flags` worked for artifact / document-integrity risks
  - rendered-output and sample-readiness gaps are now addressed by `rendered_report_qa_advisory`, `source_report_coverage_qa`, `qa_fix_routing`, and `qa_review_summary`
  - these artifacts remain advisory-only and must be reviewed against live retest evidence before any future hold/block behavior is considered
- Rendered/report-readiness QA examples now covered or candidates for continued advisory monitoring:
  - `Underwritting`
  - `CLEAN`, `MESSY`, or `Test` in public sample property name
  - old `12.1 / 12.2 / 12.3` methodology headings
  - rendered `DATA NOT AVAILABLE`
  - `Target Rent (Post-Reno)` when no structured renovation artifact exists
  - mixed rent-gap basis if both `17.4%` and `14.8%` appear
- Current priority is fresh Forest City validation and artifact inspection, not additional broad QA architecture work.
- Future / deferred direction:
  - optional manual approval gate for initial high-value / concierge workflows
  - deterministic parser / calculation layer remains the source of truth
  - AI QA may flag issues but must not inject financial values
- AI QA may inspect:
  - uploaded file list
  - extracted text metadata
  - parsed artifacts
  - generated report HTML / PDF text
  - missing / failed artifacts
  - contradictions across artifacts
- AI QA may flag:
  - loan file appears to contain a balance but artifact has `loan_amount = null`
  - property tax amount looks like a year / invalid amount
  - appraisal or cap-rate support conflicts, or a null artifact masks a valid artifact
  - market survey misclassified as rent roll
  - uploaded-but-unused docs that may matter
  - T12 has expense lines but report shows lump-sum only
  - report says DSCR not assessed despite debt-looking support file
  - CapEx / support docs acknowledged but not modeled, where that restraint should be explicitly reviewed
  - long narrative rent roll likely to fail and should use CSV/XLSX
- AI QA must NOT:
  - write accepted financial values directly
  - override deterministic parsers
  - change NOI, rent, occupancy, debt, DSCR, cap rate, valuation, refinance, or deal score
  - publish unsupported assumptions
- Possible future outputs after advisory evidence is reviewed:
  - internal QA warnings
  - admin review status
  - block publication pending review
  - customer-safe failed / needs-review message
  - support checklist for manual repair / retry
- Rendered Report QA insertion-point investigation is complete for Phase 1A/1B/1C. The May 5 V2 audit still does not authorize wholesale merge.
- Manual Admin QA Gate:
  - now a candidate pre-Ken Dunn / high-value concierge hardening option
  - reports may remain private until admin approval if this mode is adopted
- Later cleanup themes:
  - SES helper cleanup
  - entitlement / schema cleanup
  - Dashboard auto-visibility hardening
  - large-text rent-roll AI recovery: chunking, shorter prompt construction, CSV/XLSX steering, and clearer large-rent-roll fallback guidance
## 11. Launch Readiness Snapshot
- **May 8 launch snapshot:**
  - Report QA architecture is materially upgraded:
    - deterministic Report Contract QA
    - deterministic QA Director
    - acquisition/current debt separation
    - QA advisory calibration
    - T12/Rent Roll/supporting-doc alias hardening.
  - Current launch status:
    - not yet DocRaptor-production-ready
    - not yet Ken-ready until final clean samples are regenerated and checked
    - anti-whack-a-mole architecture is materially stronger than the May 7 state, but Maplewell still has one visible math contradiction.
  - Remaining public/high-value blocker still includes DocRaptor test mode.
  - Maplewell debt/current-mortgage parser lane is now passing, but the annual market rent normalization bug remains OPEN.
  - Immediate next validation is the Maplewell annual market rent fix, then continue remaining synthetic lanes one at a time.
- **May 7 launch snapshot:**
  - Supabase Security Advisor triage is effectively complete with two accepted warnings documented: `queue_job_for_processing` remains temporarily SECURITY DEFINER/authenticated for Generate Report safety, and leaked password protection requires Supabase Pro.
  - Dashboard freeze / lag is improved after Dashboard fetch guards plus May 7 `SupabaseAuthContext` auth/profile-churn patch, but remains OPEN / MONITORED.
  - Intake-rescue Patch 2 passed on Forest City MIXUP: supporting docs uploaded into required slots can reroute when content signature is strong and downstream parser validation passes.
  - Source-to-Report Coverage QA occupancy inventory now follows trusted rent-roll summary totals before top-level/detail-derived occupancy.
  - Next likely work is Dashboard idle stability monitoring, then one clean Full Underwriting with debt/current-loan support.
- **May 5 launch snapshot:**
  - V2 is not wholesale mergeable; selective manual cherry-picks only.
  - Stripe webhook/domain entitlement incident is fixed; launch checklist must include Vercel domain verification and Stripe webhook 200 checks.
  - Dashboard freeze / lag was improved after Dashboard-only guard patch; May 7 later added the `SupabaseAuthContext` auth/profile-churn patch.
  - QA Phase 1A/1B/1C is implemented and advisory-only.
  - Forest City parser/extraction hardening is implemented.
  - Separate proposed acquisition debt sizing render path is implemented.
  - Next likely work is one fresh Forest City Full Underwriting retest from scratch, then artifact/PDF inspection before public/Ken sample validation.
- **May 4 QA/V2 strategy snapshot:**
  - Launch-readiness focus has shifted from core math/pipeline repair to rendered-report QA and institutional-readiness classification.
  - User wants a QA layer because each new property package can reveal new rendered-output / sample-readiness issues that manual review cannot scale against.
  - V2 showroom is promising, but must be audited against current repo truth before adoption.
  - V2 file-by-file audit is complete; V2 remains reference/blueprint only.
  - If V2 is legitimate, user is open to adopting it, including QA layer / Final Review Queue concepts, but only after current fixes and schema realities are confirmed preserved.
  - Do not proceed to DocRaptor production smoke before the V2/QA audit decision is made, unless user explicitly chooses to defer V2.
- **Current launch status as of May 3: UNPAUSED from report-reuse P0; final validation continues before DocRaptor production smoke and public sample generation.**
- Previous scenario coverage audit recommendation remains Launch this week = CONDITIONAL. The May 3 same-name Screening/Underwriting hard stop was patched and live-retested closed, but DocRaptor production smoke and final public sample selection still remain before outreach.
- Launch conditions:
  - low-dollar live Stripe payment test if still outstanding
  - final Ken Dunn sample package review
  - final readiness check / sample package selection
  - stop only if a new report-core math or document-integrity regression appears
- May 3 end-of-day validation update:
  - report-reuse P0 remains closed after live same-name retest
  - Screening-only Section 04 wording polish is live-validated
  - three fresh test-mode PDFs were reviewed after the polish patch
  - clean/messy/test filename optics are known and intentional during testing only
  - tomorrow morning should begin with more testing, not DocRaptor production smoke
- May 3 live validation blocker status:
  - Public legacy sample route remains closed; `/reports/sample-report.html` is neutral live.
  - Same-name Screening/Underwriting existing-report reuse blocker was reproduced, diagnosed, patched in `api/admin-run-worker.js`, deployed, and live-retested closed.
  - Bad Underwriting purchase remediation was completed by clearing the affected `report_purchases.job_id` and `consumed_at`; Screening purchase remained correctly consumed.
  - Latest same-name retest produced separate Screening and Underwriting report rows/PDFs with `report_generation.source = generate-client-report` for both.
  - Current sequence is no longer blocked by report reuse; it remains gated by final test-mode content checks, clean public-candidate package selection, and DocRaptor production smoke.
- May 2 launch-readiness update:
  - harness layers are materially stronger after report assertions, mock lifecycle fixtures, worker-state simulation, parser-adversarial fixtures, and repo-wide public-output sweep
  - no product bugs remain from Waves 1-4 after the LTV parser patch and columnar T12 total-selection patch
  - Wave 5 found no confirmed live public-output blocker
  - Wave 4 parser adversarial now includes and passes Jan-Dec plus TTM / Annual Total T12 selection
  - no remaining E2E failures after T12 total-selection patch: `156 PASS / 0 FAIL / 8 SKIP`
  - current harness is still non-live for:
    - real worker execution
    - real Supabase writes
    - real DocRaptor generation
    - real credit restoration
    - real Dashboard upload flow
  - live flow has still been manually validated through prior report generation; harness is the non-live safety net
- May 3 end-of-night launch-path update:
  - `npm run test:e2e`: `156 PASS / 0 FAIL / 8 SKIP`
  - direct Wave 4: `85 PASS / 0 FAIL / 8 SKIP`
  - direct Wave 4 overwrote `tests/e2e/results/latest-e2e-results.json`
  - previous intended sequence was:
    - live test-mode report validation first
    - DocRaptor production-mode smoke second
    - final public sample generation only after report-path assertions pass
  - current sequence resumed after the May 3 existing-report reuse blocker was patched and same-name Screening/Underwriting retest passed; DocRaptor production smoke is still deferred until final test-mode public-candidate checks pass.
  - confirmed remaining test gaps:
    - default E2E run has no final PDFs configured
    - report-path assertions exist through `--report` / `test:e2e:report`
    - parser coverage includes one Jan-Dec plus `TTM Total` case
    - T12 variants not separately covered: `Annual`, `Annual Total`, `T12`, `Trailing 12`, and monthly dollar columns with adjacent percent columns
    - appraisal later-null artifact masking earlier valid cap-rate support is not covered as an E2E fixture
    - worker-state simulator does not execute `api/admin-run-worker.js` directly
    - report generation failure before publish remains mostly static / simulator-level
    - `needs_documents` remains in Dashboard display / query code as legacy-row display risk, but current worker path does not appear to set it
  - DocRaptor production path truth:
    - live generator requires both `DOCRAPTOR_MODE=production` and `ALLOW_PRODUCTION_PDF=true`
    - `DOCRAPTOR_API_KEY` supplies auth
    - `DOCRAPTOR_TEST_MODE` is only used in admin regeneration event logging and does not control actual generator output
    - `scripts/generate-sample-pdf.js` is hardcoded `TEST_MODE = true` and must not be used for public samples
  - production smoke sequence:
    - create / validate a clean-name public-candidate job while still in test mode
    - flip only `DOCRAPTOR_MODE=production` and `ALLOW_PRODUCTION_PDF=true`
    - redeploy production
    - admin-regenerate that already-validated clean job
    - do not publicly link or share the smoke PDF
    - confirm latest `report_qa_flags` does not include `DOCRAPTOR_NOT_PRODUCTION_MODE`
    - confirm no DocRaptor watermark / test bands
    - run report-path E2E assertions on downloaded PDF / text output
  - rollback if smoke fails:
    - set `DOCRAPTOR_MODE=test` or remove it
    - set `ALLOW_PRODUCTION_PDF=false` or remove it
    - redeploy required
  - live test-mode checklist before DocRaptor production, after P0 reuse fix:
    - same-name Screening + Underwriting retest produced two distinct report rows/PDFs; repeat only if new evidence requires it
    - T12-columnar live sample if available
    - clean Screening public-candidate sample
    - clean Underwriting public-candidate sample
    - optional fail-closed test
  - stop / go rule:
    - GO to DocRaptor production smoke only if the May 3 report-reuse P0 is patched/retested, live parser proof passes, clean Screening and clean Underwriting publish with distinct report rows/PDFs and no public-output defects, and any fail-closed test restores credit with no report row
    - STOP if any live report fabricates core metrics, silently accepts missing required docs, emits public AI / BUY / SELL language, has stale sample naming, fails DSCR verdict cap, creates a report on required-doc failure, or reuses a report artifact across report types
  - public legacy sample route:
    - `public/reports/sample-report.html` was patched locally to a neutral placeholder and production hard-refresh / reset confirmed `https://investoriq.tech/reports/sample-report.html` now renders the neutral InvestorIQ Sample Materials placeholder
    - old Riverbend Heights static sample with BUY / IQ-assisted wording is no longer visible at that route
    - treat `public/reports/sample-report.html` P0 as production-verified closed
    - `src/lib/pdfSections.js` still contains legacy `STRONG BUY` but is P1 unless reintroduced into active routes
    - do not use `public/reports/sample-report.html`, `api/html/sample-report.html`, or `scripts/generate-sample-pdf.js` for public samples
    - current sample PDFs must come only from the approved live generation path after DocRaptor production smoke passes
- Current covered scenarios:
  - clean Screening
  - clean Underwriting
  - messy T12 extraction with fail-closed validation
  - full rent roll
  - partial rent roll sample with explicit total units
  - partial rent roll sample with trusted explicit summary totals
  - missing / partial debt terms
  - DSCR not assessed
  - rendering-stage failure remap to failed
  - Stripe quantity entitlement path
  - Dashboard visibility with caution
- Launch-ready areas after active P0 closure:
  - pricing and positioning are aligned with institutional positioning and proprietary-system messaging
  - screening vs underwriting separation is materially clean
  - dashboard / admin support workflow is operational
  - multi-quantity Stripe checkout and entitlement creation are working
  - launch-critical `report_published` email notifications are live on Resend and validated
  - underwriting exact document-derived exit / refi cap labels now display exact parsed precision consistently, including `4.99%` and `6.25%`
  - rent roll hardening is validated through explicit summary-totals trust plus partial-sample suppression
  - Forest City latest validated underwriting proof point: `Forest City Manor Underwriting Test 27`
    - Units `144`, Occupancy `96.0%`, Annual In-Place Rent `$2,622,000`, Annual Market Rent `$3,148,800`, Rent-to-Market Gap `16.7%`
    - partial-sample detail rows remain suppressed as full-property metrics
    - `ForestCityManor_RenovationBudget.docx` is acknowledged without unsupported CapEx modeling
    - Scenario and DCF basis / sensitivity base rows use `4.99% (document derived)`
  - 124 Richmond latest validated underwriting proof point: `124 Richmond Street Underwriting Test 22`
    - Units `12`, Occupancy `100.0%`, Annual In-Place Rent `$186,780`, Annual Market Rent `$219,240`, Rent-to-Market Gap `17.4%`, DSCR `1.09x`
    - `CapEx_Schedule_124_Richmond_Test.pdf` is acknowledged without unsupported CapEx modeling
    - Scenario and DCF basis / sensitivity base rows use `6.25% (document derived)`
  - final regression suite and final layout-polish pass are complete
  - AI Rent Roll Recovery is proven live for Screening through `SYNTH-QA-P10 RETEST`
  - AI T12 Recovery is proven live in Underwriting through `02_positive_ai_t12_underwriting`
  - compact AI Rent Roll Recovery is proven live in Underwriting through `01_positive_ai_rent_roll_underwriting TIMEOUT RETEST`
  - dual AI recovery is proven live in Underwriting through `03_positive_dual_ai_recovery_underwriting CONTROL RETEST`
  - long full-unit narrative `.txt` rent roll recovery failed closed safely through `04_long_ai_rent_roll_stress_underwriting`; treat as known V1 scale limitation, not a launch blocker
  - failed pre-publication Dashboard copy now states no report was published and 1 report credit was returned before file-specific guidance
  - Motherload Underwriting published but is not website-sample ready; it exposed support-doc classification / extraction / QA gaps that should be handled before high-value public samples
  - Harbourstone Test 5 is now clean enough as stress-test proof only:
    - published 15-page report
    - DSCR rendered `1.06x`
    - property tax parsed `$124,000`, not `2025`
    - refinance classification rendered `Refinance Shortfall Under Stress`
    - cap-rate basis `5.75% (document derived)`
    - remaining QA flags are `T12_TOTALS_ONLY`, `MARKET_SURVEY_CLASSIFICATION_REVIEW`, and `DOCRAPTOR_NOT_PRODUCTION_MODE`
    - not public sample / Ken Dunn candidate
  - rendering-stage / pre-generation cross-document scale mismatch protection is now in place and validated
- Still needed before Ken Dunn outreach:
  - Keep the May 3 existing-report reuse P0 closed; do not reopen unless new evidence appears. Continue final test-mode public-candidate validation before DocRaptor production smoke or public sample generation.
  - QA safeguard Phase 1 is implemented; do not build concierge hold/admin approval until after current cleanup unless a new blocker appears
  - create or select a clean Showcase package separate from Motherload stress testing
  - if available, regenerate / validate one T12-columnar sample after the parser total-selection patch
  - resolve DocRaptor production mode before any public sample PDF
  - run final E2E report-path assertions against selected public sample PDFs
  - complete low-dollar live Stripe payment test if still outstanding
  - complete Ken Dunn sample package review
  - complete final readiness check / sample package selection
  - visually retest long cover-title wrapping when a long-name report is regenerated
  - patch only real regressions found in the synthetic validation / final readiness pass
  - do not claim AI handles all long / large narrative `.txt` rent rolls; CSV/XLSX remains preferred for large rent rolls in V1
  - broader accepted-file-type hardening remains post-launch unless support needs to be tightened pre-launch
- Ken Dunn read:
  - Clean underwriting is closest to Ken-ready after regeneration and copy polish
  - Messy underwriting is stress-test proof only
  - Screening is close but needs rent-gap consistency and label polish
  - Harbourstone is stress-test proof only
  - do not show any report to Ken with DocRaptor test watermark, `Test`, `CLEAN`, `MESSY`, typo `Underwritting`, stale Methodology numbering, inconsistent rent-gap percentages, unsupported post-reno wording, or dangling `DATA NOT AVAILABLE`
