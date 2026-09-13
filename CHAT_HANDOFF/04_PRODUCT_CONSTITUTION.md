# InvestorIQ Product Constitution

**Authority date:** 2026-09-13  
**Status:** Governing owner doctrine. This file controls where older handoffs, tests, comments, archived notes, or implementation assumptions conflict.

## 1. Product admission

### Screening
A Screening Report requires both a usable T12 / operating statement and a usable Rent Roll before generation may begin.

Screening accepts only those two core document categories. Supporting or additional due-diligence documents must not be admitted for Screening.

### Underwriting
An Underwriting Report requires both a usable T12 / operating statement and a usable Rent Roll, plus at least one additional readable supporting due-diligence document before generation may begin.

The Generate action must remain unavailable until those requirements are satisfied.

### Admission is not downstream survivability
`dual_source_core`, `t12_minimum_core`, `rent_roll_minimum_core`, and `insufficient_core` describe downstream source-truth or publication-survivability states after a job has already been validly admitted. They do not weaken the customer upload requirements above.

## 2. Publication doctrine

InvestorIQ follows Core-Gated Publish-or-Collapse behavior. Once a job has been validly admitted, governed parsing or validation defects may cause affected analysis to qualify, collapse, omit, or fail according to publication doctrine. They do not retroactively redefine intake eligibility.

Every published report must preserve source traceability and its Quality Manifest.

Report length is content-driven. There are no hard page caps, forced minimum page counts, filler pages, or evidence deletion merely to hit a page count.

Stonebridge and other fixtures are diagnostic evidence, never production-specific repair targets.

## 3. Source and calculation doctrine

One business fact must have one canonical authority. A later renderer, polish pass, seal, manifest, or customer-surface adapter must not silently recompute the same fact with a competing formula.

Source Truth and accepted calculation authority control customer-facing values. Presentation code may format governed values but must not redefine them.

Screening and Underwriting must remain continuous where they share source facts, calculations, naming, typography, publication primitives, and evidence governance. Underwriting may add depth; it must not contradict Screening for the same governed fact.

## 4. Customer-facing standards

Customer-facing copy must not contain em dashes or en dashes.

No unsupported investment recommendation, invented source fact, unsupported forecast, or fabricated certainty may be introduced.

No hardcoded property-specific repair may exist solely to make a known fixture pass.

## 5. Commercial authority

Current product pricing authority remains:

- Screening: $199
- Underwriting: $499
- Bundle: 2 Screening + 1 Underwriting for $699

Any future pricing change is an explicit owner decision and must be changed canonically, not independently in UI copy.

## 6. Runtime deletion doctrine

Git history is the archive for obsolete runtime code.

If a production/runtime file, helper, compatibility pathway, duplicate calculation, obsolete pipeline, or stale customer-surface path is proven superseded and has no valid active role, it should be deleted from the active tree rather than merely labeled legacy, deprecated, archived, old, or v1.

Deletion requires dependency proof and relevant regression coverage. Historical handoff evidence and legally or operationally necessary records remain preserved.

A defect is not considered closed while an obsolete competing active pathway can still recreate it.

## 7. Documentation preservation doctrine

Canonical `CHAT_HANDOFF` files are cumulative authority. Do not replace them with shortened reconstructions.

New current-authority blocks are added at the top. Historical content remains intact below unless the owner explicitly authorizes removal.

Critical doctrine must live in this constitution and executable tests where practical. A model must not be expected to infer product rules from old chats.

## 8. Repository and branch doctrine

Until launch certification is complete, the single authoritative working branch is:

`launch-certification-20260913`

Do not create ad hoc private repair branches or leave material work only in a temporary model worktree. Every bounded work unit must be applied to the authoritative repository, reviewed, committed, and pushed before a chat handoff.

`main` is not the working branch during certification. It is reconciled only by a deliberate owner-approved launch operation after the certification branch is complete.

## 9. Repository certification doctrine

The next engineering phase is a deterministic line-by-line repository certification.

Every production-relevant file is inventoried and classified as one of:

- CURRENT AUTHORITY
- DELETE
- GENERATED / VENDOR / BUILD OUTPUT
- HISTORICAL EVIDENCE ONLY
- NON-PRODUCTION SUPPORT

For every CURRENT AUTHORITY file, record why it exists, what invariant it owns, what it imports and exports, whether it duplicates another responsibility, and what proof protects it.

Do not skip files because a prior audit called a subsystem closed.

Once this certification closes, do not restart another repository-wide audit without concrete new evidence that a certified invariant is violated.

## 10. Open owner-controlled conflicts

Older handoffs contain contradictory direction on the Underwriting product title and the cover gold dot.

Those items are not allowed to flip silently because an older test or polish layer says so. They remain explicit owner-controlled launch decisions that must be resolved once and then locked in this constitution plus tests before final launch certification.

## 11. Production hold

Repository certification does not itself authorize a production deployment, migration, scheduler activation, Supabase or Storage mutation, Stripe mutation, historical job replay, or DocRaptor production-mode change.

Production remains a separate explicit owner decision.
