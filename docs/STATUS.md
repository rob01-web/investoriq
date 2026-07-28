# InvestorIQ Status

Current date: July 28, 2026

Current authority:
- Treat the uploaded `!INVESTORIQ_CURRENT_GAMEPLAN_HANDOFF_UPDATED_2026-07-28.md` file as the practical daily handoff until this structure is fully established.
- Product and launch decisions remain governed by `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`.
- Premium assignment remains `false`.
- RETEST 39 is not authorized.
- Implementation has not begun from the merged plan.
- Audit work is not merged to main.
- Production migration is not authorized.
- Deployment is not authorized.
- Production data change is not authorized.
- Stripe configuration change is not authorized.
- Live canary is not authorized.
- Live retest is not authorized.

Current phase:
- H0.5 deterministic recovery and QA authority hardening complete.

Local completion status:
- Branch: `investigation/full-repo-underwriting-audit`
- H0.5 commit: `d78c7bb` - pin deterministic recovery requests
- H0.5 commit: `eb3284c` - add content hash recovery cache
- H0.5 commit: `85da832` - demote LLM QA from publish authority
- H0.5 commit: `d47eb97` - add Textract client dependency
- H0.5 commit: `35d34fc` - add deterministic recovery reproducibility smoke
- Working tree: clean
- Remote: up to date
- No runtime code changed
- No deployment
- No migration
- No production data change
- No Premium activation
- No RETEST 39

Next boundary:
- H0.75 Publish-or-Collapse tiering

Next authorized step:
- Establish `docs/ROADMAP.md` as the stable companion roadmap for daily handoff use.
- After H0-A review and explicit authorization, continue only with the next bounded phase.

Daily handoff instruction:
- Use this status file first in fresh chats.
- Do not implement, migrate, deploy, activate Premium, run RETEST 39, change production data, commit, push, merge, or clean archives unless the current phase explicitly authorizes it.

Frozen owner decisions:
- Screening launch price is $199.
- Full Underwriting launch price is $499.
- The launch bundle is approximately $699 for exactly two Screening entitlements and one Full Underwriting entitlement.
- Screening and Full Underwriting launch simultaneously, or neither launches.
- V2/base is the only public Full Underwriting launch foundation.
- Premium Acquisition Underwriting remains false.
