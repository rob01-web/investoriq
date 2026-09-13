# InvestorIQ Repository Certification Plan

**Started:** 2026-09-13  
**Authoritative branch:** `launch-certification-20260913`  
**Goal:** one final repository-wide certification before launch, with no skipped production-relevant files and no recurring patch loop.

## Why this exists

InvestorIQ has accumulated multiple generations of pipelines, helpers, tests, handoffs, compatibility logic, report surfaces, and publication authorities. Prior repairs often fixed a visible defect while leaving an older competing pathway intact.

This certification is not another cosmetic audit. Its purpose is to make the repository difficult to misunderstand and difficult to regress.

## Working method

Create a deterministic repository inventory sorted by path.

For every file, record:

`Path | Classification | Runtime role | Imports/dependencies | Exports/consumers | Business rules owned | Duplicate authority? | Delete candidate? | Required tests | Review status | Notes`

Read each production-relevant file line by line. Follow imported helpers and all downstream consumers before certifying a business-rule owner.

When obsolete runtime logic is proven superseded, delete it from the active tree. Do not preserve dead runtime merely by moving it into a `legacy`, `archive`, `old`, or `deprecated` folder.

Preserve historical documentation and evidence separately from active runtime code.

## Certification order

Audit the repository in deterministic path order, while following dependencies when a file cannot be understood in isolation.

Before leaving a subsystem, close its competing authorities, stale aliases, duplicate calculations, obsolete fallbacks, contradictory tests, and unreachable runtime files.

The eight prelaunch slices remain issue registers, but they no longer justify isolated patching. Findings from all slices are resolved inside the repository certification and mapped back to their slice IDs.

Slice 1 remains open until its operating-metric authority is fully certified. Slice 2 must not be treated as started merely because unrelated files are reviewed.

## Commit protocol

No material work may live only in a model-private worktree.

Use the authoritative branch for all certification work.

A bounded unit is:

`inspect -> decide -> edit/delete -> targeted tests -> diff review -> commit -> push -> handoff update`

Do not allow large uncommitted batches to span chats.

WIP recovery commits are allowed on this certification branch and must be labeled clearly. A WIP commit is not a production certification.

## Completion gates

Repository certification closes only when:

- every production-relevant file has a final classification;
- every DELETE item is removed with dependency proof;
- no known competing business-rule authority remains active;
- critical owner doctrines are represented in the Product Constitution and executable tests where practical;
- static residual scans for retired aliases and pathways are clean or intentionally classified;
- targeted regressions pass;
- canonical QA passes;
- production build passes;
- final repository diff is reviewed;
- local HEAD equals remote certification-branch HEAD;
- the working tree is clean;
- the final handoff records the exact certified commit.

Only after this gate closes should the owner decide whether to run fresh customer report tests and promote to production.
