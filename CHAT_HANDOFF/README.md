# InvestorIQ CHAT_HANDOFF

## 2026-09-12 CURRENT AUTHORITY — post-deployment handoff

This is the controlling handoff state for the next chat. Preserve all historical sections below; this section supersedes stale deployment identifiers and pending-promotion instructions where they conflict.

- Current phase: post-deployment launch-readiness verification. The September audit, AI architecture work, and closed certification phases are complete; do not restart them.
- Certified production source: `2005e6361e348b87a61d9470759819c5f000c5d` on `hotfix-worker-queue-starvation-20260911-r1`.
- Production deployment: Vercel deployment `BkmA44RAR9aCJCE6EHEm2L5yhn9f`; live alias [investoriq.tech](https://investoriq.tech). The deployment completed successfully and is Ready.
- Verified local gates before promotion: canonical QA `38/38 PASS`, p0b deterministic smoke PASS, Dashboard customer-copy smoke PASS, and production build PASS. The final deployment also completed successfully after correcting the dashboard-copy syntax defect.
- Included repairs: governed Dashboard job-status boundary; worker queue starvation repair; deterministic legacy false-blocker normalization; screening financing-language leakage repair; visible dead-letter/paused customer status and explanation.
- No production migration, scheduler activation, main merge, historical replay, Supabase mutation, Stripe mutation, or other production change is authorized by this handoff.
- GPT-4o remains launch authority. AI architecture is closed; do not reopen model R&D. Advisory-model rate limits are not a reason to alter the core launch architecture.

### Next chat — first move

1. Verify the live alias and deployment identity, then run one fresh, controlled customer report flow end-to-end.
2. Confirm the new job is visible in Dashboard, advances through worker processing, and remains visible with an explicit terminal explanation if it blocks or dead-letters.
3. Capture the job status/event timeline and report-contract result before making any further code decision. Treat older queued/dead-letter jobs as historical evidence, not as a reason to replay or mutate data.
4. Only then address any newly reproduced runtime or report-contract defect. Keep all production changes separately approved.


## Customer admission constitution - GOVERNING OWNER AUTHORITY

This section is current owner authority and controls wherever older plans, tests, migrations, historical notes, or downstream source-mode language conflict.

### Screening admission

A Screening Report requires **both** a usable T12 / operating statement **and** a usable Rent Roll before generation may begin. Screening accepts only those two core document categories. Supporting or additional due-diligence documents are not part of the Screening upload package and must not be admitted for Screening.

### Underwriting admission

An Underwriting Report requires **both** a usable T12 / operating statement **and** a usable Rent Roll, **plus at least one additional readable supporting due-diligence document**, before generation may begin.

### Admission is not downstream survivability

`dual_source_core`, `t12_minimum_core`, `rent_roll_minimum_core`, and `insufficient_core` describe downstream source-truth / publication-survivability states **after a job has already been validly admitted**. They do not reduce or replace the customer upload requirements above.

If an admitted core source later becomes constrained or unusable during governed parsing/validation, downstream analysis may qualify, collapse, omit, or follow the applicable publication/failure doctrine. That downstream behavior does not make a one-core-document customer submission valid at intake.


**Current authority date:** 2026-09-08  
**Current phase:** Post-deployment Launch Readiness / Customer Journey Closeout

## Start here

For a fresh chat, read:

1. `03_FRESH_CHAT_PROMPT.md`
2. `00_CURRENT_HANDOFF.md`
3. `01_MASTER_PLAN.md`
4. `02_ELITE_REPORT_BLUEPRINT.md`
5. `archived/2026-09-06-underwriting-editorial-analytical-audit/ROOT_CAUSE_REPAIR_AUTHORITY.md`
6. `archived/2026-09-06-underwriting-editorial-analytical-audit/AUDIT_PRIORITY_REGISTER.md`

Historical material under `archived/` remains preserved evidence and should not be deleted or reconstructed.

## Current branch authority

Working repair branch:

`internal-underwriting-editorial-analytical-elite-20260906-r1`

Provider-certified Visual ELITE Step 6 checkpoint:

`f6066397b623a35391765c17214000a7628a1615`

Recovery checkpoint:

`c595fcaca1e8c23482c6fa527a798f5ee24881e6`

Certified deployed product checkpoint:

`c07c1da8cef64fab95f825746bddecb03c1b14e8`

Vercel production deployment:

`dpl_DYQ7rXuyb93SU17zp4X5899vuvzy` (`READY`)

## Status

- **Visual ELITE publication engine / DocRaptor rendering:** CERTIFIED in TEST mode.
- **Underwriting editorial + analytical customer acceptance:** CLOSED after final executable certification and page-by-page rendered-artifact review.
- **Screening and Underwriting shared publication continuity:** CERTIFIED at the deployed baseline; recheck only when a new shared change affects it.
- **Production:** DEPLOYED and READY at `https://investoriq.tech`.
- **Next work:** new bounded, owner-approved launch-readiness/customer-journey changes only. Do not restart the September 6 audit or completed certification chain.

## The central rule for future report changes

**Do not patch the Stonebridge test report. Fix the reusable system.**

The audited Stonebridge PDF is a regression fixture and diagnostic record. It exposed systemic problems. Repairs must live in shared production/report code, source normalization, calculation governance, analytical copy logic, or reusable publication components.

Fresh generated artifacts are evidence that the system was repaired. They are not manually curated targets.

## Detailed audit evidence

Full uploaded audit filename:

`InvestorIQ_Underwriting_Editorial_Visual_Audit_2026-09-06(1).md`

Audited provider PDF SHA256:

`ebf59fbb538a2114fe543d839a3df93e283c33e2694f1d13d0bcc921453f620b`

The detailed audit remains preserved evidence. Do not reopen it unless a newly evidenced defect requires relevant historical context.

## Permanent report doctrine

- Decision first. Facts before prose.
- No unsupported recommendations or invented assumptions.
- No hard page caps.
- Preserve unique evidence and source identities.
- Reflow rather than shrink.
- One boundary, one separator.
- Shared publication changes must be evaluated in Screening and Underwriting.
- Provider/render certification and editorial/investment-review acceptance are separate gates.
- Preserve zero customer-facing em/en dashes.
- No production action without separate explicit owner authorization.
