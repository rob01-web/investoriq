# July 7, 2026 Final Checkpoint — Step 4 QA Gate PASS / Repair-Induced Truth Destruction Closed / Checkpoint Commit PASS / Step 5 Unlocked Next

### This addendum supersedes the prior “Step 4 checkpoint committed / repair-induced truth destruction HOLD next” handoff.

Current verified state:

```text
STEP 1:
PASS / protect.

STEP 2:
PASS / protect.

STEP 3A:
PASS / protect.

STEP 3B:
PASS.

STEP 3 OVERALL:
PASS.

STEP 4 PRODUCTION CONSTITUTIONAL WORK:
PASS / protect.

STEP 4 QA GATE:
PASS.

STEP 4 REPAIR-INDUCED TRUTH-DESTRUCTION DEFECT:
CLOSED.

STEP 4 FINAL CHECKPOINT COMMIT:
PASS.

STEP 5:
UNLOCKED NEXT.
NOT YET EXECUTED.
TARGET AUTH-078 THROUGH AUTH-091.
```

## Final Step 4 defect closure

The prior active HOLD was the Boss repair/enforcement path:

```text
clean compliant baseHtml
-> inject renovation-only collapseable surface
-> pre-enforcement fatal_core = []
-> repair rewrites HTML
-> unrelated source-backed Unit Mix and Proposed Financing evidence disappears
-> post-repair validation emits:
   UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS
   PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED
-> both route fatal_core
-> renovationEnforcement.ok = false
```

The exact production operation was isolated through 3–10 micro-micro prompts:

```text
enforceAcquisitionMemoBossContractOnHtml(...)
-> collapseAcquisitionMemoBossViolationsHtml(...)
-> collapseSectionByTitle(...)
```

The targeted collapse title was:

```text
Key Upside Drivers
```

but the old section regex began its match at:

```text
Executive Summary
```

and one replacement region swallowed:

```text
Executive Summary
Key Metrics Snapshot
Key Upside Drivers
```

The removed region also contained text globally required by post-render integrity validators, including:

```text
Unit Mix validator:
!/(1BR|2BR)/i.test(htmlString)

Proposed Financing validator:
!new RegExp(escapeRegExp(label), "i").test(htmlString)
```

Therefore the previously observed post-repair fatal pair was proven to be repair-induced collateral truth destruction.

## Production fix accepted

Changed production file:

```text
api/_lib/acquisition-memo-boss-contract.js
```

Old overbroad boundary removed:

```text
/<section\b[^>]*>[\s\S]*?<span[^>]*class="section-header-title"[^>]*>\s*${escapeRegExp(title)}\s*<\/span>[\s\S]*?<\/section>/i
```

New section-local behavior:

```text
1. locate exact section-header-title match;
2. find nearest prior <section;
3. scan <section> / </section> tags with depth tracking;
4. resolve the matching closing section boundary;
5. replace only that section-local region.
```

Final containment guard accepted after manual inspection:

```text
if (sectionEnd < 0 || !(sectionStart < titleMatch.index && titleMatch.index < sectionEnd)) return source;
```

Required invariant now enforced:

```text
sectionStart < titleMatch.index < sectionEnd
```

If the title is not inside the selected section boundary:

```text
return original source unchanged
```

## Manual changed-file inspection

ChatGPT manually inspected the actual changed production file after Codex's receipt.

Accepted result:

```text
OLD CROSS-SECTION REGEX:
REMOVED.

SECTION-LOCAL MATCHING:
PASS.

EXPLICIT TITLE CONTAINMENT GUARD:
PASS.

ROUTING TAXONOMY:
UNCHANGED.

SOURCE-BACKED INTEGRITY FENCE:
PRESERVED.

CUSTOMER SURFACE MODEL:
UNTOUCHED BY FINAL PATCH.

ORCHESTRATOR / FINAL DECISION:
UNTOUCHED BY FINAL PATCH.
```

## Stale debt QA assertion classification

After the section-boundary fix, the targeted Boss smoke advanced to a different assertion involving:

```text
Current Debt Maturity Not available
Maturity Date Not available
```

A same-call truth bundle proved:

```text
VALIDATION_OK=true
INITIAL_FATAL=NONE
INITIAL_COLLAPSE=NONE
EARLY_RETURN=true
COLLAPSE_HELPER_CALLED=false
REPAIRED_EQUALS_INPUT=true
BAD_SUBSTRING_PRESENT=true
```

The decisive provenance fact was:

```text
bossContract.sections.currentDebtContext.factAvailability.sourceBacked === false
```

Therefore the old expectation that enforcement must scrub that placeholder was stale/overbroad for a non-source-backed debt fixture.

Accepted QA-only refresh:

```text
Old:
assert.equal(
  /Current Debt Maturity Not available|Maturity Date Not available/i.test(debtEnforcement.repairedHtml),
  false
);

New:
assert.equal(
  /Current Debt Maturity Not available|Maturity Date Not available/i.test(debtEnforcement.repairedHtml),
  true
);
```

Changed QA file:

```text
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js
```

ChatGPT manually inspected the actual changed QA file.

Accepted conclusion:

```text
- non-source-backed ambiguous debt remains nonfatal;
- source-backed current-debt integrity was not weakened;
- Boss routing was not weakened;
- production was not changed to satisfy stale QA.
```

## Targeted verification

Passed:

```text
node --check api/_lib/acquisition-memo-boss-contract.js

node tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js
```

Targeted smoke result:

```text
acquisition-memo-v2 boss-violation-routing smoke PASS
```

The renovation path still requires:

```text
renovationEnforcement.ok === true
```

and still requires unsupported renovation language to be absent after repair.

## Step 4 final disposition

```text
STEP 4 QA GATE:
PASS.

REPAIR-INDUCED TRUTH-DESTRUCTION DEFECT:
CLOSED.

CURRENT DEFECT UNIT:
PASS.

CHECKPOINT COMMIT:
PASS.
```

Exact committed files for this final Step 4 closure checkpoint:

```text
api/_lib/acquisition-memo-boss-contract.js
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js
```

No temporary instrumentation is part of the accepted state.

## Permanent diagnostic doctrine preserved

The investigation repeatedly proved that detached probes can contradict the real path.

Permanent rule:

```text
SAME PROCESS
+
SAME OBJECT
+
SAME TEST PATH
>
DETACHED RECONSTRUCTION
```

When probe answers conflict, require one same-call truth bundle before editing production.

## Step 5 now unlocked

Formal next root family:

```text
STEP 5
Repair/orchestrator immutable-baseline provenance preservation
```

Target:

```text
AUTH-078 through AUTH-091
```

Do not treat the closed Step 4 regex seam as Step 5 completion.

Step 5 must now address the broader constitutional family already preserved in the AUTH ledger:

```text
- repair must not erase accepted source-backed truth;
- original pre-repair truth baseline must remain available;
- repaired CustomerSurfaceModel / Boss state must not become the only truth;
- orchestrator must preserve provenance across repair;
- pre/post truth regression must be detectable;
- source-backed provenance cannot be downgraded merely to make repaired state self-consistent.
```

## Step 5 execution method

Use the permanent micro-micro doctrine:

```text
3–10 MICRO-MICRO PROMPTS MAXIMUM PER UNIT OF WORK
```

Preferred accelerated pattern for Step 5:

```text
MICRO 1 -> literal repair owner fact
MICRO 2 -> immutable-baseline boundary fact
MICRO 3 -> exact mutation / handoff fact
MICRO 4 -> smallest safe edit
MICRO 5 -> Rob uploads every changed file
MICRO 6 -> ChatGPT manually inspects actual file(s)
MICRO 7 -> targeted verification
MICRO 8 -> focused same-path / integration proof if needed
MICRO 9 -> PASS / HOLD / BLOCKED
MICRO 10 -> commit only if explicitly authorized
```

Speed rule:

```text
Do not spend 8–10 micros by default.
Use the minimum number needed to establish the literal edit boundary.
The long Step 4 chain was exceptional because contradictory probe evidence had to be resolved.
```

## Fresh-chat continuation point

Do not restart the audit.
Do not rediscover AUTH-001 through AUTH-105.
Do not reopen Steps 1–4.
Do not repeat the Step 4 regex/debt diagnostic chain.
Do not run a live RETEST yet.

Start here:

```text
Steps 1–4:
PASS / protect.

Step 4 QA gate:
PASS.

Repair-induced truth destruction seam:
CLOSED.

Final Step 4 checkpoint commit:
PASS.

Step 5:
UNLOCKED NEXT.

Target:
AUTH-078 through AUTH-091.
```

First task in the fresh chat:

```text
Begin formal Step 5 in usage-preserving micro-micro mode.

Treat AUTH-078 through AUTH-091 as one root-family unit:
repair/orchestrator immutable-baseline provenance preservation.

Do not send a broad Codex investigation.
Do not ask Codex to rediscover architecture.
Use the preserved AUTH evidence map.
Aim for roughly 3–5 audit micros before one tiny edit prompt unless literal evidence requires more.
```

## Live-proof doctrine remains mandatory

Even after Step 5 eventually passes:

```text
smoke PASS
!=
live pipeline PASS
```

Final acceptance later remains:

```text
targeted smokes
-> manual changed-file inspection
-> focused integration/proof wall
-> coherent remaining AUTH family completion
-> one controlled live Acquisition Memo RETEST
-> inspect actual customer-facing PDF/report truth
```

Do not run the live RETEST yet.

---

## AUTH ledger status update

The closed Step 4 defect materially strengthens the evidence around:

```text
AUTH-078 through AUTH-091
```

but does not close that family.

What is now proven and closed:

```text
A concrete HTML repair operation could destroy unrelated validator-visible truth because section matching crossed sibling boundaries.
That concrete operation has been fixed and manually verified.
```

What remains for formal Step 5:

```text
the broader repair/orchestrator immutable-baseline provenance family:
original truth preservation,
repair mutation boundaries,
pre/post truth delta,
and prevention of provenance laundering across repaired model/Boss state.
```

Therefore:

```text
AUTH-078 through AUTH-091:
ACTIVE NEXT / FORMAL STEP 5.

AUTH-092 through AUTH-105:
LOCKED UNTIL STEP 5 FAMILY IS REVIEWED.
```

---

# InvestorIQ Semantic Authority Evidence Ledger

## July 7, 2026 Late-Night Checkpoint — Step 4 Checkpoint Committed / QA Investigation Proved Repair-Induced Truth Destruction / Step 5 Still Locked

### This addendum supersedes the prior “Step 4 PASS / stale QA refresh next” handoff.

Current verified state:

```text
STEP 1:
PASS / protect.

STEP 2:
PASS / protect.

STEP 3A:
PASS / protect.

STEP 3B:
PASS.

STEP 3 OVERALL:
PASS.

STEP 4 PRODUCTION CONSTITUTIONAL WORK:
PASS / protect.

STEP 4 CHECKPOINT COMMIT:
PASS / committed.

STEP 4 QA GATE:
HOLD.

STEP 5:
NOT STARTED AS FORMAL EXECUTION.
LOCKED UNTIL THE CURRENT BOSS REPAIR/ENFORCEMENT DEFECT IS RESOLVED AND REVIEWED.
```

### Committed checkpoint

Accepted commit:

```text
bc2eaf3
Step 4 provenance integrity checkpoint
```

Exact committed files reported and accepted:

```text
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js
tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js

!!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_UPDATED_JULY7_STEPS1_4_STEP4_PASS_STALE_QA_REFRESH_NEXT.md
!!!INVESTORIQ_MASTER_CONTEXT_CURRENT_DOCTRINE_COMPLETION_CHECKLIST_UPDATED_JULY7_STEPS1_4_STEP4_PASS_STALE_QA_REFRESH_NEXT.md
!!!INVESTORIQ_SEMANTIC_AUTHORITY_EVIDENCE_LEDGER_UPDATED_JULY7_STEPS1_4_STEP4_PASS_STALE_QA_REFRESH_NEXT.md

plus the prior Step 3 checkpoint ledgers moved into:
Very Old and Archived MD Files/
```

Commit receipt confirmed:

```text
- no temporary instrumentation included;
- no unauthorized files included;
- no production fix for the remaining Boss smoke HOLD was smuggled into the commit.
```

### Permanent Codex process doctrine tightened again

Rob explicitly directed that the remainder of Step 4 and all Step 5 work must be executed in:

```text
3–10 MICRO-MICRO PROMPTS PER UNIT OF WORK
```

Controlling pattern:

```text
MICRO 1 -> establish one literal fact
MICRO 2 -> establish adjacent fact
MICRO 3 -> prove exact boundary
MICRO 4 -> authorize one tiny edit
MICRO 5 -> upload actual changed file
MICRO 6 -> ChatGPT manually inspects actual file
MICRO 7 -> targeted verification
MICRO 8 -> focused integration/path proof if needed
MICRO 9 -> only then PASS / HOLD / BLOCKED
MICRO 10 -> commit checkpoint only if explicitly authorized
```

Hard rules:

```text
- one prompt = one question or one tiny edit;
- no broad causal narratives from Codex;
- no “investigate everything” prompts;
- no Codex PASS accepted at face value;
- after any real change, Rob uploads the actual changed file;
- ChatGPT inspects the file itself before PASS;
- smoke PASS alone is never launch proof;
- live pipeline proof remains required later;
- no Step 5 expansion until the current seam is closed.
```

### QA refresh result before the remaining HOLD

CustomerSurfaceModel stale expectations were refreshed and manually inspected.

Proven accepted expectations now include:

```text
partial current debt:
factAvailability.sourceBacked === true

partial Purchase Assumptions:
acquisitionRequestContext.status === "required"

partial Purchase Assumptions:
proposedFinancingContext.status === "required"
```

Targeted result:

```text
CustomerSurfaceModel smoke:
PASS
```

The actual changed test file was manually inspected before acceptance.

### Boss smoke remaining HOLD — exact stable failure

Repeated current-state runs proved:

```text
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js

stable first failure:
renovationEnforcement.ok

actual:
false

expected:
true
```

Two separate runs reproduced the same failure.

Temporary same-process instrumentation was used only for diagnosis, then fully reverted. Uploaded files were manually inspected to confirm no instrumentation remained.

### Critical diagnostic lesson

Detached/reconstructed probes repeatedly produced contradictory results and are no longer accepted as authoritative for this seam.

The decisive doctrine is:

```text
SAME PROCESS
+
SAME OBJECT
+
SAME TEST PATH
>
DETACHED RECONSTRUCTION
```

The actual return shape of:

```text
enforceAcquisitionMemoBossContractOnHtml(...)
```

was proven to be:

```text
ok: boolean
violations: array
routing: object
repairedHtml: string
```

Important correction:

```text
renovationEnforcement.routing
```

is the real returned routing object.

Do not probe nonexistent:

```text
renovationEnforcement.postRouting
```

### Evidence-complete current root chain

The following chain was proven with same-process before/after evidence.

#### Clean baseline

```text
validateAcquisitionMemoRenderAgainstBossContract(
  bossContract,
  baseHtml
).violations
=
[]
```

The test also independently asserts the clean baseline is Boss compliant.

#### Renovation-only injection

The smoke injects only:

```text
Renovation ROI
payback
NOI impact
value impact
refi impact
implementation modeling
```

into the Key Upside Drivers area.

Raw validation after injection:

```text
["NO_FORBIDDEN_SURFACES"]
```

Same-process pre-enforcement routing:

```text
fatal_core
=
[]

collapseable_surface
=
[
  "NO_FORBIDDEN_SURFACES",
  "UNSUPPORTED_RENOVATION_MODELING_SURFACE"
]
```

Therefore the injected condition is pre-enforcement collapseable-only and nonfatal.

#### Enforcement/repair result

Same-process enforcement result:

```text
renovationEnforcement.ok
=
false
```

Then the repaired HTML itself was revalidated.

Raw validation of:

```text
renovationEnforcement.repairedHtml
```

returned:

```text
[
  "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS",
  "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED"
]
```

Returned enforcement routing then contained:

```text
fatal_core
=
[
  "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS",
  "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED"
]

collapseable_surface
=
[]
```

Therefore the evidence-complete chain is:

```text
clean compliant baseHtml
-> inject one renovation-only collapseable forbidden surface
-> raw validation detects only NO_FORBIDDEN_SURFACES
-> pre-enforcement routing remains nonfatal and collapseable
-> enforcement/repair rewrites HTML
-> repaired HTML loses or makes unrecognizable unrelated source-backed Unit Mix and Proposed Financing evidence
-> post-repair validation emits two source-backed integrity violations
-> those violations route fatal_core
-> enforcement.ok becomes false
```

### AUTH mapping update

The newly proven runtime chain materially strengthens:

```text
AUTH-078 through AUTH-091
```

and specifically confirms that repair/enforcement can transform a nonfatal collapseable-only HTML state into repaired HTML that fails unrelated source-backed integrity checks.

### Current classification

```text
REPAIR-INDUCED TRUTH DESTRUCTION
+
POST-REPAIR SOURCE-BACKED INTEGRITY FAILURE
+
IMMUTABLE-BASELINE / PROVENANCE-PRESERVATION DEFECT
```

This is strongly aligned with the already-preserved Step 5 / AUTH-078 through AUTH-091 family.

However:

```text
Do not casually relabel this as “Step 5 PASS work started.”
Formal Step 5 execution remains locked until the current Step 4 QA gate is closed and the exact repair seam is patched/reviewed.
```

### Important correction to the prior stale-QA interpretation

The earlier ledger said the Boss routing smoke was merely stale at the known assertion.

That is no longer sufficient.

Current evidence proves:

```text
- the CustomerSurfaceModel stale expectations were real and refreshed;
- the remaining Boss smoke failure is a genuine production-path repair/enforcement defect;
- do not change the line expecting renovationEnforcement.ok === true merely to make the smoke green;
- do not bless the post-repair fatal pair as expected behavior.
```

### Current exact continuation point for the fresh chat

Do not restart the audit.
Do not rediscover AUTH-001 through AUTH-105.
Do not reopen Steps 1–3.
Do not re-run the long diagnostic chain.

Start from this exact proven seam:

```text
Clean baseHtml raw validation:
[]

Renovation-injected raw validation:
["NO_FORBIDDEN_SURFACES"]

Pre-enforcement routing:
fatal_core = []
collapseable_surface =
[
  "NO_FORBIDDEN_SURFACES",
  "UNSUPPORTED_RENOVATION_MODELING_SURFACE"
]

Post-repair raw validation:
[
  "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS",
  "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED"
]

Post-repair routing:
fatal_core =
same two codes

renovationEnforcement.ok:
false
```

First task in the fresh chat:

```text
Use 3–10 micro-micro prompts maximum to identify the exact repair function/operation that removes or invalidates the unrelated Unit Mix and Proposed Financing evidence.

Then authorize the smallest safe patch.

After any patch:
- Rob uploads every changed file;
- ChatGPT manually inspects the actual files;
- run targeted smoke(s);
- run focused integration/path proof;
- do not treat smoke PASS alone as launch proof.
```

Recommended first micro-question:

```text
AUDIT ONLY. NO EDITS.

Using the exact current failing Boss smoke path, return only:

the exact production function called inside
enforceAcquisitionMemoBossContractOnHtml(...)
that transforms the pre-enforcement HTML into
renovationEnforcement.repairedHtml.

No explanation.
No fixes.
No file changes.
No commit.
```

### Live-proof doctrine remains mandatory

Even after this repair is locally green:

```text
smoke PASS
!=
live pipeline PASS
```

Final acceptance later remains:

```text
targeted smokes
-> manual changed-file inspection
-> focused integration/proof wall
-> coherent Steps 4–7 completion
-> one controlled live Acquisition Memo RETEST
-> inspect actual customer-facing PDF/report truth
```

Do not run the live RETEST yet.

---

# July 7, 2026 Night Execution Addendum — Steps 1–4 PASS / Step 4 Production Completion Gate Verified / Stale QA Refresh Next

## Controlling checkpoint

This addendum supersedes the prior Step 3 Completion Gate checkpoint as the active execution handoff.

Current verified state:

```text
STEP 1:
PASS / protect.

STEP 2:
PASS / protect.

STEP 3A:
PASS / protect.

STEP 3B:
PASS.

STEP 3 OVERALL:
PASS.

STEP 4:
PASS.

STEP 5:
DO NOT BEGIN YET.
```

The operating method remains mandatory:

```text
AUTH evidence
-> surgical Codex prompt
-> Codex receipt
-> manual inspection of actual changed production files
-> PASS / HOLD / BLOCKED
-> next micro only after literal invariant proof
```

Never accept a Codex PASS receipt at face value.

## Step 4 target

Step 4 implemented Micro Family 3 constitutional protections:

```text
PROVENANCE != COMPLETENESS
```

and:

```text
SOURCE-BACKED TRUTH
CANNOT BE LAUNDERED INTO
ORDINARY COLLAPSEABLE ABSENCE
```

Target AUTH family:

```text
AUTH-049
AUTH-050
AUTH-051
AUTH-052
AUTH-055
AUTH-056
AUTH-059
AUTH-060
AUTH-061
AUTH-062
AUTH-063
AUTH-064
AUTH-065
AUTH-066
AUTH-067
AUTH-069
```

## Step 4 initial Codex result

Initial Step 4 receipt returned HOLD after production changes in:

```text
api/_lib/acquisition-memo-boss-contract.js
api/_lib/acquisition-memo-v2-customer-surface-model.js
```

Directionally correct improvements included:

```text
- financing/current-debt sourceBacked moved toward accepted provenance rather than completeness;
- Unit Mix provenance tied to core Rent Roll existence;
- mapped source-backed integrity violations fenced from ordinary collapseable_surface routing;
- non-source-backed legitimate collapse remained possible;
- missing[] remained visible.
```

Manual production-file inspection rejected closure because three contradictions remained.

### Step 4 blocker A — Boss normalization dropped accepted truth later read by sourceBacked

Boss later read:

```text
acceptedPurchaseAssumptionsTruth
acceptedCurrentDebtTruth
```

but normalized Boss support-doc records did not preserve those booleans.

Effect:

```text
accepted provenance exists
-> normalization drops accepted-truth boolean
-> later sourceBacked read can become false
```

### Step 4 blocker B — CustomerSurfaceModel validator still conflated provenance with completeness

The validator still contained the old fatal rule equivalent to:

```text
sourceBacked true
+
missing[] non-empty
->
fatal_core
```

including the stale message:

```text
cannot be source-backed with missing facts
```

This directly contradicted Step 4.

### Step 4 blocker C — CustomerSurfaceModel accepted authority fell back to generic parser fields

Accepted-role variables could still fall back to generic:

```text
semantic_doc_role
debt_basis
```

allowing parser/generic semantics to establish accepted purchase/current-debt truth.

This threatened the frozen Step 2 sovereignty fence.

Disposition:

```text
STEP 4 INITIAL RECEIPT:
HOLD
```

## Step 4 Completion Gate

A tightly scoped completion prompt allowed changes only in:

```text
api/_lib/acquisition-memo-boss-contract.js
api/_lib/acquisition-memo-v2-customer-surface-model.js
```

Tests remained read-only.

Required exact fixes:

```text
1. Preserve accepted purchase/current-debt truth through Boss normalization.

2. Make sourceBacked true + missing[] legal.

3. Remove generic semantic_doc_role / debt_basis fallback from accepted authority.

4. Preserve the good contextual source-backed routing fence.

5. Preserve Steps 1–3 exactly.

6. Do not begin Step 5.
```

## Manual inspection result — Step 4 PASS

ChatGPT manually inspected the actual changed production files after the Codex receipt.

### PASS A — Boss accepted truth survives normalization

`normalizeSupportDocRecord(...)` now preserves:

```text
acceptedSourceTruth
acceptedProvenance
acceptedPurchaseAssumptionsTruth
acceptedCurrentDebtTruth
```

The two accepted-truth booleans are derived from accepted fields / accepted provenance / accepted source-truth signals, not generic parser role or generic debt-basis fields.

Therefore:

```text
accepted purchase provenance
+
partial purchase facts
->
purchaseAssumptionsSourceBacked can remain true
```

and:

```text
accepted current-debt provenance
+
partial debt facts
->
currentDebtSourceBacked can remain true
```

### PASS B — sourceBacked true + missing[] is legal

The stale CustomerSurfaceModel fatal path was removed.

The production model no longer contains:

```text
SECTION_MISSING_FACTS_WITHOUT_COLLAPSE
```

or the old message:

```text
cannot be source-backed with missing facts
```

Therefore this is now legal:

```text
sourceBacked: true
available: [A]
missing: [B]
```

`missing[]` remains visible and is not cleared.

### PASS C — generic parser semantics no longer establish accepted authority

CustomerSurfaceModel accepted role now reads accepted-role fields only:

```text
acceptedSemanticDocRole
accepted_semantic_doc_role
payload.acceptedSemanticDocRole
payload.accepted_semantic_doc_role
```

Accepted debt basis now reads accepted-basis fields only:

```text
acceptedDebtBasis
accepted_debt_basis
payload.acceptedDebtBasis
payload.accepted_debt_basis
```

Generic parser fields:

```text
semantic_doc_role
debt_basis
payload.semantic_doc_role
payload.debt_basis
```

do not establish accepted purchase/current-debt truth in the touched accepted-authority path.

Note:

```text
generic semantic_doc_role may still exist in canonicalRole descriptive fallback;
that is not the acceptedSemanticDocRole authority variable and does not by itself set accepted truth.
```

### PASS D — contextual source-backed routing fence remains intact

Boss preserves the mapping for:

```text
UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT
UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS
CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED
PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED
ACQUISITION_REQUEST_FACTS_REQUIRED_WHEN_SOURCE_BACKED
```

Required contextual behavior remains:

```text
sourceBacked true
->
non-collapseable source-backed integrity failure
```

and:

```text
sourceBacked false
->
ordinary collapse may remain possible where otherwise legal
```

No fourth routing taxonomy was added.

## Step 4 stale QA status

Two existing QA smokes remain red because they encode the old contract.

Known stale expectations:

```text
tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js:786

Old expectation:
partial current-debt fixture
-> factAvailability.sourceBacked === false

Correct Step 4 production contract:
accepted provenance survives partial completeness
-> sourceBacked === true
```

and:

```text
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js:214

Old expectation:
source-backed current-debt integrity violation
-> collapseable_surface

Correct Step 4 production contract:
source-backed integrity failure
-> must not enter ordinary collapseable_surface
```

These tests were intentionally not edited during the production completion gate.

Current interpretation:

```text
PRODUCTION STEP 4:
PASS.

QA EXPECTATIONS:
STALE / REFRESH NEXT.

Do not treat the two stale assertions as production regressions.
Do not begin Step 5 until the stale QA expectations are refreshed and manually reviewed.
```

## Protected frozen contracts

Continue protecting:

```text
STEP 1:
accepted source identity;
accepted role/provenance;
Boss physical-source dedupe;
purchase assumptions cannot become current debt.

STEP 2:
accepted role sovereignty;
accepted provenance role reads accepted fields only;
exact approved projection role mappings.

STEP 3:
exact four-key acquisition-loan family;
exact precedence;
strict null/empty/whitespace handling;
canonical proposed_loan_amount;
no current-debt contamination;
exactly three approved Step 3A mappings.
```

## Tomorrow morning first task

Do not begin Step 5 immediately.

First:

```text
Refresh only the two stale Step 4 QA expectations.
```

Exact candidate tests:

```text
tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js
```

Required doctrine:

```text
- test-only changes;
- production files read-only;
- update only expectations proven stale by Step 4;
- no new production semantics;
- no fixture-specific hardcoding;
- no broad smoke wall;
- no live services;
- no RETEST;
- no commit unless explicitly requested;
- compact receipt;
- manual inspection before PASS.
```

After stale QA refresh passes and is manually accepted:

```text
STEP 5 NEXT:
Repair/orchestrator immutable-baseline provenance preservation.
```

Step 5 target remains:

```text
AUTH-078 through AUTH-091
```

Do not yet touch final delivery gate integrity; that remains later.

## Stop conditions tonight

Rob is stopping due to fatigue.

Do not run:

```text
Step 5;
repair/orchestrator changes;
final-decision changes;
live Acquisition Memo RETEST;
DocRaptor;
Supabase writes;
paid/API loops;
broad smoke wall;
Screening changes;
production commit without explicit request.
```

## Fresh-chat handoff

Rob will upload:

```text
1. Updated MASTER
2. Updated CVF
3. Updated AUTH evidence ledger
```

Fresh chat instruction:

```text
Do not restart the audit.
Do not rediscover AUTH-001 through AUTH-105.
Do not reopen Steps 1–4.

Current verified checkpoint:
Steps 1–4 PASS.

First task:
Write the smallest safe Codex prompt to refresh only the two stale Step 4 QA expectations.

Production files are read-only.
No Step 5 yet.

After Codex replies:
review receipt,
inspect actual changed test files,
return PASS / HOLD / BLOCKED.

Only after stale QA refresh is accepted may Step 5 begin.
```

---

---

# July 7, 2026 Execution Addendum — Surgical Codex Remediation Steps 1–3 / Step 3 Completion Gate Active

## Controlling workflow update

The AUTH-001 through AUTH-105 evidence audit is no longer merely awaiting prompt design.

Execution has begun under a new mandatory doctrine:

```text
CODEX SURGICAL LEASH MODE
```

Reason:

```text
Codex produced materially useful changes but declared PASS while an explicitly forbidden downstream authority path still existed.
Therefore:
Codex receipts are never accepted at face value.
ChatGPT manually inspects the actual changed production files after each receipt.
PASS requires literal production-code proof of the requested invariant.
```

Mandatory Codex controls now in force:

```text
- exact allowed production files;
- all other files read-only;
- exact target invariant;
- explicit frozen symbols/contracts;
- no substitute fixes;
- no compatibility shims;
- no speculative aliases;
- no opportunistic cleanup;
- no future-proofing;
- no new abstractions unless explicitly authorized;
- test files read-only unless explicitly allowed;
- stop on surprise;
- minimum diff;
- targeted checks only;
- no broad smoke wall;
- no live services;
- no DocRaptor;
- no Supabase writes;
- no paid/API loops;
- no commit unless explicitly requested;
- PASS only when literal code proof confirms the forbidden path is gone.
```

Compact receipt doctrine:

```text
1. Verdict PASS / HOLD / BLOCKED
2. Files changed
3. Exact invariant changed
4. Exact old path removed/fenced
5. Targeted checks/results
6. Unexpected condition
7. Confirm no out-of-scope changes / no live services / no commit
```


## Step 1 — Immutable accepted role/provenance foundation

### Initial Step 1 result

Codex changed:

```text
api/_lib/acquisition-memo-v2-role-reconciler.js
api/_lib/canonical-source-package.js
api/_lib/acquisition-memo-boss-contract.js
```

Material improvements manually confirmed:

```text
- acceptedSourceIdentityKey emitted;
- acceptedProvenance emitted;
- accepted role/basis preserved;
- canonical package preserves accepted fields;
- Boss dedupe prefers accepted physical-source identity;
- raw parser role fallback reduced;
- parser debt basis no longer accepted without same-source evidence in key fallback.
```

However ChatGPT manually inspected the real Boss file and rejected Codex PASS.

Exact remaining blocker:

```text
promoteCurrentDebtSupportDoc(
  findSupportDocByRole(supportDocs, "purchase_assumptions")
)

promoteCurrentDebtSupportDoc(
  acquisitionMemoProjection?.supportDocProjection?.purchaseAssumptions
)
```

Interpretation:

```text
purchase_assumptions
-> downstream Boss promotion
-> current_debt_context
```

Disposition:

```text
STEP 1 INITIAL RECEIPT: HOLD
AUTH-043 remained executable.
```

### Step 1 Completion Gate

A tighter one-file completion prompt allowed changes only in:

```text
api/_lib/acquisition-memo-boss-contract.js
```

Required:

```text
1. caller fence:
   accepted purchase assumptions must not enter current-debt promotion;

2. callee fence:
   promoteCurrentDebtSupportDoc(...) must reject incompatible accepted purchase provenance.
```

Manually confirmed actual code result:

```text
- purchase-assumptions promotion callers removed;
- only currentDebtContext promotion caller remains;
- defensive accepted purchase-role / acquisition-financing-basis rejection added;
- legitimate current-debt path preserved.
```

Final disposition:

```text
STEP 1: PASS
```

Current invariant materially established:

```text
physical source identity
-> reconciled accepted role
-> accepted provenance
-> canonical preservation
-> Boss preservation
-> physical-source dedupe
-> accepted purchase assumptions cannot be promoted to current debt
```

## Step 2 — Downstream role reclassification fences + tiny authority cleanup

Allowed production files:

```text
api/_lib/acquisition-memo-projection.js
api/_lib/acquisition-memo-boss-contract.js
```

### Initial Step 2 result

Codex reported PASS, but manual inspection found two blockers.

#### Blocker A — accepted-role taxonomy mismatch still caused downgrade

Projection preferred accepted role, but bucket vocabulary still differed:

```text
accepted renovation_capex_context
vs projection structured_renovation_capex_plan

accepted appraisal_valuation_context
vs projection appraisal_context

accepted environmental_due_diligence_context
vs projection environmental_context
```

Effect:

```text
valid accepted role
-> projection no-match
-> otherSupportDocs
```

#### Blocker B — Step 2A accepted provenance cleanup incomplete

Boss still derived:

```text
acceptedProvenanceRole
```

from broader fields:

```text
acceptedProvenance.canonicalRole
acceptedProvenance.role
```

Disposition:

```text
STEP 2 INITIAL RECEIPT: HOLD
```

### Step 2 Completion Gate

Manual inspection confirmed:

```text
- projection now recognizes the three established accepted-role mismatches;
- valid accepted roles no longer downgrade merely due legacy bucket names;
- acceptedProvenanceRole now reads accepted provenance role fields only;
- purchase_assumptions -> current_debt_context fence remains closed;
- Boss normalizer prefers accepted role;
- physical identity dedupe remains acceptedSourceIdentityKey-first.
```

Final disposition:

```text
STEP 2: PASS
```

### Important Step 2 WATCH

Codex added extra projection aliases beyond the three requested mappings, including examples such as:

```text
phase_i
phase_i_esa
mortgage_statement
current_debt
proposed_acquisition_financing
market_survey
```

Although Step 2 still passed because the known invariants were preserved, this was classified as unauthorized scope expansion.

New doctrine:

```text
Codex does not invent product authority.
We specify authority.
Codex executes authority.
Codex does not expand authority.
```

## Step 3 — Projection alias pruning + one canonical acquisition-loan fact family

Allowed production files:

```text
api/_lib/acquisition-memo-projection.js
api/_lib/acquisition-memo-boss-contract.js
```

### Step 3A — Unauthorized projection alias pruning

Actual code manually confirmed:

```text
Only three evidence-backed mappings remain:

renovation_capex_context
-> structured_renovation_capex_plan

appraisal_valuation_context
-> appraisal_context

environmental_due_diligence_context
-> environmental_context
```

Unauthorized speculative aliases were removed.

Disposition:

```text
STEP 3A: PASS
```

### Step 3B — Canonical acquisition-loan amount schema

Exact allowed input key family:

```text
proposed_loan_amount
stated_acquisition_loan_amount
derived_acquisition_loan_amount
loan_amount
```

Canonical downstream key:

```text
proposed_loan_amount
```

Required precedence:

```text
proposed_loan_amount
>
stated_acquisition_loan_amount
>
derived_acquisition_loan_amount
>
loan_amount
```

Codex added:

```text
normalizePurchaseAssumptionLoanAmountFacts(...)
```

and removed the synthetic write back to:

```text
loan_amount
```

inside purchase evidence supplementation.

However manual inspection rejected the PASS receipt.

#### Step 3 blocker 1 — empty/null coercion to zero

Current implementation used:

```text
Number(candidate)
Number.isFinite(...)
```

which means:

```text
Number(null) === 0
Number("") === 0
Number("   ") === 0
```

Forbidden example:

```text
proposed_loan_amount = null
stated_acquisition_loan_amount = 8500000

current implementation can resolve:
proposed_loan_amount = 0
```

This violates exact non-empty precedence and can suppress real higher-quality evidence.

#### Step 3 blocker 2 — projection checklist still sees false missing

Projection still reads only:

```text
purchaseAssumptions.extractedFacts.proposed_loan_amount
```

while alias normalization occurs later inside Boss construction.

Therefore:

```text
same accepted source
-> Projection checklist: missing
-> Boss purchase facts: available
```

This preserves cross-stage semantic inconsistency.

Disposition:

```text
STEP 3B: HOLD
STEP 3 OVERALL: HOLD
```

## Current active Codex task at handoff

A Step 3 Completion Gate prompt has been issued.

Exact required fixes:

```text
1. In Boss:
   null / undefined / empty string / whitespace-only string must be absent,
   never numeric zero.

2. In projection:
   cloned accepted purchase-assumption entry must expose
   extractedFacts.proposed_loan_amount
   before buildChecklist(...) consumes it.

3. Exact four-key family only.

4. Exact precedence only.

5. Preserve original fact keys.

6. Do not mutate upstream canonical source record.

7. Do not apply purchase-loan normalization to current debt.

8. Freeze Step 3A alias map at exactly the three approved mappings.

9. No new aliases.
10. No new modules.
11. No test edits.
12. No broad smoke wall.
13. No commit.
```

Current continuation point:

```text
Rob's first message in the fresh chat will be Codex's Step 3 Completion Gate reply.

Review that reply against the actual changed production files.

Do not trust PASS receipt alone.

First acceptance questions:

A. Can null/empty/whitespace still become 0?
B. Does projection expose canonical proposed_loan_amount before buildChecklist?
C. Is precedence exactly proposed > stated > derived > loan_amount?
D. Are original fact keys preserved?
E. Is current debt excluded?
F. Are exactly three approved role mappings still present?
G. Did Codex add anything not explicitly authorized?
```

# InvestorIQ Semantic Authority Evidence Ledger
## AUTH-001 through AUTH-105
### July 6, 2026 — Manual Production File-by-File Audit

---

# Purpose

This file preserves the detailed manual evidence audit performed across the live Acquisition Memo V2 production path before any new Codex execution prompts are written.

Controlling workflow:

> **We inspect the real production files ourselves, one by one, build the authority map from evidence, and only then write the Codex execution prompts.**

This ledger exists so a fresh chat can continue without losing the findings from the long-form audit.

Do **not** treat all entries as equal. Status language is intentional:

- **CONFIRMED** — directly proven by production code.
- **CONFIRMED RUNTIME** — execution path proven by orchestrator/finalization flow.
- **VERY HIGH LIVE CAUSATION** — code path strongly matches RETEST 20 live behavior.
- **OPEN / WATCH** — behavior exists but live causation is not yet proven.
- **NOT OWNER** — file inspected and ruled out as primary owner for that defect.

Allowed classifications:

- `DELETE`
- `STRIP_AUTHORITY`
- `CONSOLIDATE_DUPLICATE_AUTHORITY`
- `ORPHANED_AUTHORITY`
- `REPLACE`
- `KEEP`

---

# Live Context

RETEST 20 published end to end:

```text
queued
-> extracting
-> underwriting
-> scoring
-> rendering
-> pdf_generating
-> publishing
-> published
```

CVF-24 recurring final Boss-compliance / route-500 family was broken through.

However, RETEST 20 exposed CVF-25:

```text
SEMANTIC_AUTHORITY_POLLUTION_AND_FALSE_COLLAPSE
```

Observed launch-critical defects:

```text
- Unit Mix source-backed truth existed but section collapsed.
- Purchase Assumptions parsed but customer surface said none uploaded.
- Purchase Assumptions source mislabeled as Existing Debt.
- Current Debt facts appeared in Document Treatment but dedicated Debt section collapsed.
- Appraisal Stabilized Cap Rate 7.40% displayed as Interest Rate 7.40%.
- Break-Even Occupancy output 37.0%, incorrectly equal to Expense Ratio.
- QA oracle also expected wrong 37.0%.
- Rent-upside capitalization table label implied whole-property value semantics.
- Asset Class displayed 64-Unit.
```

---

# Files Manually Inspected for AUTH-001 through AUTH-105

1. `api/_lib/acquisition-memo-v2-customer-surface-model.js`
2. `api/_lib/acquisition-memo-v2-role-reconciler.js`
3. `api/_lib/canonical-source-package.js`
4. `api/_lib/acquisition-memo-projection.js`
5. `api/_lib/acquisition-memo-boss-contract.js`
6. `api/_lib/acquisition-memo-v2-boss-repair.js`
7. `api/_lib/acquisition-memo-v2-orchestrator.js`
8. `api/_lib/acquisition-memo-v2-final-decision.js`

The renderer file `api/_lib/acquisition-memo-v2-document.js` was uploaded at the end of the session but is **not** included in AUTH-001 through AUTH-105. Continue that file separately if needed.

---

# Root-Family Summary

## Root Family 1 — Duplicate Semantic Role Authority

Active semantic decision makers exist across:

```text
role-reconciler
canonical-source-package
Boss Contract
CustomerSurfaceModel
raw-payload repair/heal side doors
```

Key entries:

```text
AUTH-005, AUTH-006, AUTH-015, AUTH-016, AUTH-017,
AUTH-018, AUTH-021, AUTH-023, AUTH-030, AUTH-039,
AUTH-040, AUTH-043, AUTH-044, AUTH-057, AUTH-071
```

Target doctrine:

```text
one source identity
-> one accepted role
-> one canonical fact schema
-> immutable provenance
-> downstream consumers do not reclassify
```

## Root Family 2 — Duplicate Fact Extraction / Writer Authority

Same facts are independently extracted or supplemented in multiple layers:

```text
role-reconciler
canonical-source-package
Boss Contract
raw payload heal guards
```

Key entries:

```text
AUTH-001, AUTH-002, AUTH-019, AUTH-020, AUTH-022,
AUTH-028, AUTH-041, AUTH-042, AUTH-045
```

Target doctrine:

```text
normalize aliases once
write one canonical fact object
downstream reads canonical facts only
```

## Root Family 3 — No Immutable Accepted-Truth Provenance Lock

Key entries:

```text
AUTH-006, AUTH-017, AUTH-039, AUTH-046, AUTH-047,
AUTH-057, AUTH-059, AUTH-069, AUTH-075, AUTH-079,
AUTH-084, AUTH-086, AUTH-097, AUTH-105
```

Target invariant:

```text
raw accepted evidence
-> parsed artifact
-> canonical role
-> reconciled accepted truth
-> projection
-> CustomerSurfaceModel
-> Boss Contract
-> final delivery
```

## Root Family 4 — False-Collapse Compliance Laundering

Fully proven in code and runtime.

Key entries:

```text
AUTH-049, AUTH-050, AUTH-051, AUTH-052, AUTH-055,
AUTH-056, AUTH-059, AUTH-060, AUTH-061, AUTH-062,
AUTH-063, AUTH-064, AUTH-065, AUTH-066, AUTH-067,
AUTH-069, AUTH-078, AUTH-079, AUTH-080, AUTH-081,
AUTH-082, AUTH-083, AUTH-084, AUTH-085, AUTH-086,
AUTH-088, AUTH-089, AUTH-090, AUTH-096, AUTH-098,
AUTH-105
```

Confirmed forbidden runtime pattern:

```text
sourceBacked true
-> validation detects missing rendered truth
-> repair classifies as optional/support repairable
-> repair sets section.status = collapsed
-> repair clears available facts
-> repair clears missing facts
-> repair sets sourceBacked = false
-> model and Boss are both downgraded
-> rerender
-> revalidate repaired state
-> repaired state becomes final truth
-> final decision can deliver
```

## Root Family 5 — Final Gate Does Not Require Full Final Compliance

Key entries:

```text
AUTH-092, AUTH-093, AUTH-094, AUTH-095,
AUTH-099, AUTH-100, AUTH-103, AUTH-104
```

Critical finding:

```text
complianceOk is computed
but not required by publishable
```

---

# Detailed Authority Ledger

## AUTH-001 — Purchase Loan Alias Contract Mismatch
- **Status:** CONFIRMED cross-file mismatch; exact live propagation path still needed.
- **Files:** role reconciler, CustomerSurfaceModel.
- **Evidence:** reconciler recognizes/writes `derived_acquisition_loan_amount`, `stated_acquisition_loan_amount`, `loan_amount`; CustomerSurfaceModel purchase section requires `proposed_loan_amount`.
- **Effect:** accepted acquisition financing truth can exist while section collapses or reports unavailable.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY / CONTRACT_REPAIR`
- **CVF:** 25B

## AUTH-002 — Top-Level Facts vs `extractedFacts` Contract Mismatch
- **Status:** CONFIRMED.
- **Evidence:** role reconciler authority rows write many facts top-level; CustomerSurfaceModel normalization reads `extractedFacts` / `extracted_facts`.
- **Effect:** facts can survive in one surface but disappear in dedicated sections.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25B / 25D

## AUTH-003 — Role Vocabulary Contract Split
- **Status:** CONFIRMED.
- **Mismatches:** `appraisal_valuation_context` vs `appraisal_context`; `environmental_due_diligence_context` vs `environmental_context`; `renovation_capex_context` vs `structured_renovation_capex_plan`.
- **Effect:** valid context can disappear or collapse.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-004 — Current Debt Fixed Priority Can Beat Purchase Assumptions
- **Status:** STRONG CANDIDATE.
- **Evidence:** same-identity priority favors `current_debt_context` over `purchase_assumptions`.
- **Effect:** possible Purchase Assumptions -> Existing Debt mislabel.
- **Classification:** `STRIP_AUTHORITY / CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25C

## AUTH-005 — Semantic Metadata Reused as Evidence
- **Status:** CONFIRMED.
- **File:** role reconciler.
- **Reads into evidence:** `semantic_doc_role`, `semantic_doc_display_label`, `semantic_doc_role_reason`, `debt_basis`.
- **Effect:** prior classification can help prove itself.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-006 — Accepted Truth Is Not Provenance Locked
- **Status:** CONFIRMED.
- **Evidence:** `acceptedTruth` is one input among many; reconciler emits new accepted semantic fields.
- **Effect:** accepted truth is recomputed rather than preserved.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25I

## AUTH-007 — Parser Debt Basis Survives No-Evidence Fallback
- **Status:** CONFIRMED.
- **Evidence:** no best candidate -> `other_support_context`, but `acceptedDebtBasis = parserDebtBasis || null`.
- **Effect:** rejected parser semantics leak downstream.
- **Classification:** `ORPHANED_AUTHORITY`

## AUTH-008 — Appraisal Role Can Retain Generic `interest_rate`
- **Status:** STRONG CANDIDATE.
- **Evidence:** appraisal canonicalization spreads prior row fields.
- **Effect:** cap rate can survive under generic interest-rate alias.
- **Classification:** `STRIP_AUTHORITY / PROVENANCE_LOCK_REQUIRED`
- **CVF:** 25E

## AUTH-009 — CustomerSurfaceModel Merges Multiple Truth Stages
- **Status:** CONFIRMED.
- **Reads:** canonical package, projection buckets, Boss sourceTruth.
- **Effect:** contradictory semantic versions coexist in final model construction.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-010 — First-Writer-Wins Dedupe Can Preserve Stale Semantics
- **Status:** CONFIRMED.
- **Effect:** earlier canonical version can suppress later reconciled/Boss copy.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-011 — CustomerSurfaceModel Infers Accepted Truth from Display Labels
- **Status:** CONFIRMED.
- **Effect:** wrong labels can self-reinforce as accepted truth.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-012 — Local Completeness Can Rewrite `sourceBacked` False
- **Status:** CONFIRMED.
- **Evidence:** purchase/current debt sections recompute source-backed state from exact display-field completeness.
- **Effect:** accepted provenance can be downgraded because one alias/field is missing.
- **Classification:** `REPLACE_SOURCE_BACKED_SEMANTICS`
- **CVF:** 25J

## AUTH-013 — Unit Mix Source-Backed Test Is Internally Weak/Inconsistent
- **Status:** CONFIRMED.
- **Evidence:** total units alone can satisfy source-backed condition despite required `unit_mix` semantics.
- **Effect:** inconsistent model obligations.
- **Classification:** `CONTRACT_REPAIR`
- **CVF:** 25A

## AUTH-014 — First Role Document Wins in Customer Model
- **Status:** CONFIRMED.
- **Evidence:** first role mapping wins without provenance rank.
- **Effect:** stale/earlier same-role doc can own customer surface.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-015 — Reconciler + Canonical Package Are Two Active Role Authorities
- **Status:** CONFIRMED.
- **Evidence:** canonical package calls reconciler, then independently reclassifies.
- **Effect:** reconciled role can be overridden before immutable canonical output.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25C / 25I

## AUTH-016 — Canonical Current-Debt Branch Can Override Purchase Truth
- **Status:** CONFIRMED mechanism; VERY HIGH live-causation candidate.
- **Evidence:** current-debt branch runs before purchase branch and can fire on accepted/stale debt truth.
- **Effect:** purchase assumptions become existing debt.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25C

## AUTH-017 — “Accepted Truth” Is First Artifact Metadata
- **Status:** CONFIRMED.
- **Evidence:** first non-empty artifact semantic role/basis/label wins.
- **Effect:** parser metadata promoted to accepted truth without rank/provenance.
- **Classification:** `STRIP_AUTHORITY`
- **CVF:** 25I

## AUTH-018 — Semantic Label Feedback Loop Across Three Files
- **Status:** CONFIRMED CATEGORY.
- **Files:** role reconciler, canonical source package, CustomerSurfaceModel.
- **Pattern:** semantic label -> evidence/truth -> semantic classification.
- **Classification:** `STRIP_AUTHORITY ACROSS PIPELINE`

## AUTH-019 — Canonical Package Re-Extracts Facts Instead of Preserving Structured Facts
- **Status:** CONFIRMED.
- **Effect:** structured accepted facts can disappear in text regex re-extraction.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-020 — Current Debt Structured Facts Can Be Lost in Text Re-Extraction
- **Status:** CONFIRMED architecture; VERY HIGH live candidate.
- **Effect:** one surface sees debt facts while canonical extractedFacts loses them.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25D

## AUTH-021 — Canonical Role Taxonomy Split Is Created by Active Writers
- **Status:** CONFIRMED.
- **Evidence:** role reconciler vocabulary A; canonical package vocabulary B.
- **Effect:** no single canonical role vocabulary.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-022 — Canonical Appraisal Extraction Omits Stabilized Cap Rate / NOI
- **Status:** CONFIRMED missing field contract.
- **Effect:** correct appraisal field absent while generic rate alias may survive elsewhere.
- **Classification:** `CONTRACT_REPAIR / PROVENANCE_LOCK`
- **CVF:** 25E

## AUTH-023 — Reconciled Purchase Role Is Not Sovereign
- **Status:** CONFIRMED.
- **Evidence:** stale/accepted current-debt truth can win before purchase branch despite reconciled purchase role.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-024 — Artifact-Text Helper Lacks Internal Identity Filtering
- **Status:** OPEN / WATCH.
- **Nuance:** main caller appears file-scoped, so no live defect claimed.
- **Classification:** `WATCH`

## AUTH-025 — Core T12/Rent Roll Filename-First Authority
- **Status:** CONFIRMED behavior; live defect link OPEN.
- **Classification:** `KEEP UNDER REVIEW`

## AUTH-026 — `other_support_context` vs `other_support`
- **Status:** CONFIRMED taxonomy split.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **Priority:** P1/P2 unless live impact proven.

## AUTH-027 — Projection Blindly Trusts `canonicalRole`
- **Status:** CONFIRMED propagation mechanism.
- **Effect:** upstream canonical misclassification becomes projection truth.
- **Classification:** `KEEP` with upstream fix.
- **CVF:** 25B / 25C

## AUTH-028 — Projection Checklist Requires Exact `proposed_loan_amount`
- **Status:** CONFIRMED.
- **Effect:** financing terms can exist under other aliases but checklist reports incomplete.
- **Classification:** `CONTRACT_REPAIR`
- **CVF:** 25B

## AUTH-029 — Property Tax Support Hardcoded False
- **Status:** CONFIRMED direct defect.
- **Effect:** valid property tax support can never be acknowledged by checklist.
- **Classification:** `CONTRACT_REPAIR`
- **Priority:** P1 unless visible launch impact.

## AUTH-030 — Projection Taxonomy Aligns With Canonical Package, Not Reconciler
- **Status:** CONFIRMED.
- **Conclusion:** canonical package reclassification is effective downstream taxonomy; reconciler is not sovereign.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-031 — Projection First Match Per Role Wins
- **Status:** CONFIRMED.
- **Evidence:** `Array.find(...)`.
- **Effect:** multiple same-role docs not merged/ranked.
- **Classification:** `KEEP / REVIEW`
- **Priority:** P1 unless live-linked.

## AUTH-032 — Reconciler-Valid Roles Can Be Downgraded to Other Support
- **Status:** CONFIRMED behavior.
- **Effect:** vocabulary A roles not recognized by projection vocabulary B.
- **Classification:** `CONSOLIDATE_ROLE_TAXONOMY`

## AUTH-033 — Projection Creates Duplicate Access Paths to Same Document
- **Status:** CONFIRMED.
- **Examples:** allSupportDocs, role bucket, top-level context aliases.
- **Effect:** downstream recollection/dedupe required.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-034 — Projection Cloning Is Shallow
- **Status:** CONFIRMED.
- **Effect:** nested truth objects can share references across duplicate surfaces.
- **Classification:** `KEEP / HARDEN`
- **Priority:** P1

## AUTH-035 — False Diagnostic: `competingDecisionMakersEliminated: true`
- **Status:** CONFIRMED.
- **Effect:** tests/diagnostics can claim authority cleanup while multiple decision makers remain.
- **Classification:** `REMOVE FALSE CLAIM / DERIVE REAL INVARIANT`

## AUTH-036 — Projection Is Not Primary Owner of Unit Mix Loss
- **Status:** NOT OWNER / HIGH confidence.
- **Effect:** narrows CVF-25A elsewhere.
- **Classification:** `NOT_OWNER`

## AUTH-037 — Projection Does Not Calculate Break-Even Occupancy
- **Status:** NOT OWNER.
- **Classification:** `NOT_OWNER`
- **CVF:** 25F

## AUTH-038 — Boss Re-Merges Canonical + Projection Support Docs
- **Status:** CONFIRMED.
- **Effect:** multiple truth stages re-enter final contract.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-039 — Same File Can Survive Twice Under Conflicting Roles
- **Status:** CONFIRMED.
- **Evidence:** Boss dedupe key includes role.
- **Effect:** same physical source can exist as purchase and debt simultaneously.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25B / 25C / 25I

## AUTH-040 — Boss Normalizer Falls Back to Raw `semantic_doc_role`
- **Status:** CONFIRMED.
- **Effect:** raw parser role leaks into final Boss truth.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-041 — Boss Re-Extracts Purchase Facts From Evidence Text
- **Status:** CONFIRMED.
- **Effect:** Boss becomes independent purchase-fact writer.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-042 — Boss Re-Extracts Current Debt Facts From Evidence Text
- **Status:** CONFIRMED.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-043 — Boss Can Promote Purchase Assumptions to Current Debt
- **Status:** CONFIRMED code path; EXTREMELY HIGH live-causation candidate.
- **Evidence:** purchase assumptions doc explicitly passed into `promoteCurrentDebtSupportDoc(...)`.
- **Effect:** Purchase Assumptions -> Existing Debt.
- **Classification:** `STRIP_AUTHORITY / REMOVE_PROMOTION_PATH`
- **CVF:** 25C

## AUTH-044 — Current Debt Evidence Detector Is Too Broad
- **Status:** CONFIRMED behavior.
- **Effect:** generic financing language can support current-debt promotion.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-045 — Boss Can Create Purchase Truth When Projection Facts Are Empty
- **Status:** CONFIRMED.
- **Effect:** Boss acts as fact extractor/writer, not only enforcer.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-046 — Boss `sourceTruth.supportDocs` Is Synthesized, Not Pure Source Truth
- **Status:** CONFIRMED.
- **Contains:** merged canonical docs, projection docs, supplemented facts, promoted docs.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-047 — Boss `sourceBacked` Means Availability, Not Provenance
- **Status:** CONFIRMED.
- **Effect:** accepted provenance, partial facts, supplemented facts, and promoted facts are conflated.
- **Classification:** `REPLACE_SOURCE_BACKED_SEMANTICS`
- **CVF:** 25J

## AUTH-048 — Boss Unit Mix Availability vs Required Facts Is Inconsistent
- **Status:** CONFIRMED.
- **Evidence:** availability can be `unit_mix OR units`; required list demands both plus total_units and occupancy.
- **Classification:** `CONTRACT_REPAIR`
- **CVF:** 25A

## AUTH-049 — Source-Backed Unit Mix Violation Is Collapseable
- **Status:** CONFIRMED P0.
- **Effect:** source-backed core Unit Mix can be erased to achieve compliance.
- **Classification:** `REPLACE_ROUTING_SEMANTICS`
- **CVF:** 25A / 25J

## AUTH-050 — Source-Backed Current Debt Violation Is Collapseable
- **Status:** CONFIRMED P0.
- **Effect:** dedicated debt section can collapse despite accepted facts.
- **Classification:** `REPLACE_ROUTING_SEMANTICS`
- **CVF:** 25D / 25J

## AUTH-051 — Source-Backed Purchase/Proposed Financing Violations Are Collapseable
- **Status:** CONFIRMED P0.
- **Effect:** accepted purchase assumptions can disappear through compliance repair.
- **Classification:** `REPLACE_ROUTING_SEMANTICS`
- **CVF:** 25B / 25J

## AUTH-052 — Collapse Text Can Make False Customer Claim
- **Status:** CONFIRMED.
- **Effect:** internal binding/render failure becomes “uploaded support did not provide detail.”
- **Classification:** `REPLACE_COLLAPSE_COPY_LOGIC`

## AUTH-053 — Boss HTML Repair Calculates Customer Values
- **Status:** CONFIRMED.
- **Evidence:** Boss computes implied/per-unit values and mutates HTML.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-054 — Boss Globally Scrubs Forbidden Words From HTML
- **Status:** CONFIRMED.
- **Effect:** blind HTML mutation.
- **Classification:** `STRIP_AUTHORITY / REPLACE_WITH_MODEL_REPAIR`

## AUTH-055 — Current Debt `sourceBacked` Can Be True With Incomplete Facts
- **Status:** CONFIRMED.
- **Effect:** source-backed provenance conflated with complete render schema.
- **Classification:** `SEPARATE_PROVENANCE_FROM_COMPLETENESS`

## AUTH-056 — Purchase `sourceBacked` Can Be True With Partial Facts
- **Status:** CONFIRMED.
- **Effect:** partial facts -> sourceBacked true -> missing required fields -> collapse path.
- **Classification:** `SEPARATE_PROVENANCE_FROM_COMPLETENESS`

## AUTH-057 — Boss Normalization Drops Accepted Provenance Fields
- **Status:** CONFIRMED.
- **Dropped:** accepted semantic role/basis/display/provenance fields.
- **Effect:** provenance metadata disappears before Boss reconstructs role/facts.
- **Classification:** `PROVENANCE_CONTRACT_REPAIR`
- **CVF:** 25I

## AUTH-058 — Boss Core Validity Check Is Too Shallow
- **Status:** CONFIRMED.
- **Evidence:** role/label/sourceKind can make core doc “valid.”
- **Classification:** `HARDEN_CORE_GATE`
- **Priority:** P1

## AUTH-059 — Boss Repair Explicitly Flips `sourceBacked` False
- **Status:** CONFIRMED DIRECT CODE, P0.
- **Mutation:** status collapsed; available []; missing []; sourceBacked false.
- **Classification:** `REPLACE_CORE_REPAIR_SEMANTICS`
- **CVF:** 25J

## AUTH-060 — Unit Mix False Collapse Is Explicitly Repairable
- **Status:** CONFIRMED mechanism; VERY HIGH live causation.
- **Effect:** Unit Mix violation -> collapse -> provenance erasure.
- **Classification:** `REPLACE_REPAIR_POLICY`
- **CVF:** 25A / 25J

## AUTH-061 — Current Debt False Collapse Is Explicitly Repairable
- **Status:** CONFIRMED P0.
- **Mapped codes:** source-backed debt missing, false missing, accepted debt lost, HTML false missing.
- **Classification:** `REPLACE_REPAIR_POLICY`
- **CVF:** 25D / 25J

## AUTH-062 — Purchase Assumptions Loss Is Repaired by Collapsing Acquisition Context
- **Status:** CONFIRMED P0.
- **Effect:** accepted purchase truth loss triggers further suppression.
- **Classification:** `REPLACE_REPAIR_POLICY`
- **CVF:** 25B / 25J

## AUTH-063 — HTML Missing-Fact Violations Mutate Model Provenance
- **Status:** CONFIRMED P0.
- **Effect:** renderer/output failure becomes source-truth downgrade.
- **Classification:** `REPLACE_REPAIR_ARCHITECTURE`

## AUTH-064 — Unit Mix HTML Failures Erase Model Provenance
- **Status:** CONFIRMED P0.
- **Effect:** missing label/count/rents/spread -> unitMix collapsed and sourceBacked false.
- **Classification:** `REPLACE_REPAIR_ARCHITECTURE`
- **CVF:** 25A / 25J

## AUTH-065 — Accepted-Truth Loss Misclassified as Optional Support Repair
- **Status:** CONFIRMED P0.
- **Effect:** `ACCEPTED_*_LOST` treated as `repairableOptionalSupport`.
- **Classification:** `REPLACE_ROUTING_TAXONOMY`

## AUTH-066 — `shouldRetry` Enables Compliance Laundering
- **Status:** CONFIRMED P0.
- **Chain:** no core fatal + repairable section -> retry -> provenance downgrade -> rerender.
- **Classification:** `REPLACE_RETRY_POLICY`

## AUTH-067 — False-Missing Detection Exists but Recovery Policy Is Collapse
- **Status:** CONFIRMED P0.
- **Effect:** system detects false missing but does not restore truth.
- **Classification:** `REPLACE_REPAIR_POLICY`

## AUTH-068 — Generic Section Failure Can Become Core Fatal
- **Status:** CONFIRMED behavior; exact live path OPEN.
- **Classification:** `REPLACE_ROUTING_TAXONOMY`

## AUTH-069 — Repair Destroys Diagnostic State
- **Status:** CONFIRMED P0.
- **Effect:** available/missing/sourceBacked history erased.
- **Classification:** `REPLACE_REPAIR_STATE_MODEL`

## AUTH-070 — Boss Repair Mixes V2 Repair With Legacy HTML Quarantine
- **Status:** CONFIRMED.
- **Effect:** separate responsibilities mixed.
- **Classification:** `CONSOLIDATE / POSSIBLE_EXTRACTION`
- **Priority:** P1 after truth fixes.

## AUTH-071 — Final Heal Guard Re-Reads Raw Payload Semantics
- **Status:** CONFIRMED.
- **Reads:** raw `debt_basis`, `semantic_doc_role`, financing aliases.
- **Effect:** side-door semantic authority after canonical/Boss/model chain.
- **Classification:** `STRIP_AUTHORITY`
- **Priority:** P0/P1 depending reachability.

## AUTH-072 — Raw Payload Gate Can Strip Debt Marked Section
- **Status:** CONFIRMED behavior; live V2 relevance OPEN.
- **Classification:** `WATCH / TRACE`

## AUTH-073 — Specific `-48.0%` Stale Variance HTML Guard
- **Status:** CONFIRMED.
- **Concern:** report/history-specific hardcoded stale-value guard.
- **Classification:** `POSSIBLE_REPORT_SPECIFIC_PATCH / INVESTIGATE`
- **Priority:** P1

## AUTH-074 — Duplicate Global HTML Scrub Authority
- **Status:** CONFIRMED.
- **Files:** Boss Contract and Boss Repair.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-075 — Runtime Confirms Customer Model Receives Three Truth Stages
- **Status:** CONFIRMED RUNTIME.
- **Inputs:** canonical package + projection + Boss Contract.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-076 — Dual Customer Model Entry Path
- **Status:** CONFIRMED.
- **Paths:** caller-supplied prebuilt model OR locally built model.
- **Classification:** `TRACE / POSSIBLE_DUPLICATE_AUTHORITY`

## AUTH-077 — Compliance Assesses Already-Mutated HTML
- **Status:** CONFIRMED RUNTIME.
- **Chain:** render -> Boss enforcement mutation -> repair mutation -> compliance.
- **Classification:** `REVIEW_FINAL_AUTHORITY`

## AUTH-078 — Pre-Render Provenance Erasure Path
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** model validation issue can trigger repair before first render.
- **Classification:** `REPLACE_REPAIR_EXECUTION_POLICY`
- **CVF:** 25A / 25B / 25D / 25J

## AUTH-079 — Same Repair Plan Downgrades Customer Model and Boss Contract
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** validator and validated truth contract can be changed together.
- **Classification:** `REPLACE_REPAIR_EXECUTION_POLICY`

## AUTH-080 — Mutated Model Is Revalidated, Not Original Truth
- **Status:** CONFIRMED P0.
- **Effect:** original source-backed obligation disappears before revalidation.
- **Classification:** `REPLACE_REVALIDATION_POLICY`

## AUTH-081 — Second Post-Render Truth-Downgrade Pass Exists
- **Status:** CONFIRMED P0.
- **Effect:** pre-render and post-render repair waves can both mutate truth.
- **Classification:** `REPLACE_RETRY_POLICY`

## AUTH-082 — HTML Failure Can Mutate Boss Truth
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** missing HTML fact -> repaired Boss section sourceBacked false.
- **Classification:** `REPLACE_REPAIR_ARCHITECTURE`

## AUTH-083 — Retry Allowed With Invalid Repaired Model
- **Status:** CONFIRMED P0.
- **Evidence:** retry allowed when validation OK OR repairableSectionKeys non-empty.
- **Classification:** `REPLACE_RETRY_GATE`

## AUTH-084 — Repaired Truth Becomes Final Truth
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** successful retry returns repaired model/Boss/HTML without provenance comparison.
- **Classification:** `ADD_PROVENANCE_DELTA_GUARD`
- **CVF:** 25J

## AUTH-085 — Final Decision Consumes Repaired State
- **Status:** CONFIRMED.
- **Effect:** final gate sees repaired finalization and repaired Boss coreGate.
- **Classification:** `PROTECT_FINAL_DECISION_WITH_ORIGINAL_PROVENANCE`

## AUTH-086 — No Pre/Post Provenance Delta Validation
- **Status:** CONFIRMED ABSENCE, P0.
- **Missing invariant:** forbid unexplained `sourceBacked true -> false`.
- **Classification:** `ADD_CONSTITUTIONAL_GUARD`

## AUTH-087 — Boss Contract Validation Is Not Primary Initial Gate
- **Status:** CONFIRMED FLOW.
- **Effect:** invalid Boss contract may be diagnosed but not immediately gate execution.
- **Classification:** `REVIEW`
- **Priority:** P1

## AUTH-088 — Mutated Boss Used as Render Authority
- **Status:** CONFIRMED P0.
- **Effect:** Boss is directly repaired, not rebuilt from immutable source truth.
- **Classification:** `REBUILD_OR_PRESERVE_IMMUTABLE_BOSS`

## AUTH-089 — Repair Mutates Already-Mutated State Cumulatively
- **Status:** CONFIRMED P0.
- **Effect:** pass 2 starts from pass-1 state, not immutable baseline.
- **Classification:** `REPLACE_RETRY_STATE_MANAGEMENT`

## AUTH-090 — Repaired Model + Boss + HTML Can Self-Validate
- **Status:** CONFIRMED architectural effect, P0.
- **Effect:** synchronized erasure creates internal consistency.
- **Classification:** `ADD_IMMUTABLE_PROVENANCE_BASELINE`

## AUTH-091 — Diagnostics Lack Provenance Delta
- **Status:** CONFIRMED.
- **Effect:** diagnostics record repair happened but not what truth was erased.
- **Classification:** `ADD_PROVENANCE_AUDIT_TRAIL`
- **Priority:** P0/P1

## AUTH-092 — `publishable` Ignores `complianceOk`
- **Status:** CONFIRMED P0.
- **Evidence:** `complianceOk` computed but absent from publishable formula.
- **Classification:** `REPLACE_PUBLISHABLE_LOGIC`

## AUTH-093 — Final Delivery Does Not Require `bossOk`
- **Status:** CONFIRMED P0.
- **Effect:** Boss compliance may fail while final delivery still passes loose gate.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-094 — Final Delivery Does Not Require `htmlOk`
- **Status:** CONFIRMED P0.
- **Effect:** customer-surface HTML validation failure may not block.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-095 — Unsafe HTML Blocker Covers Only Narrow Failure Set
- **Status:** CONFIRMED P0.
- **Effect:** ordinary critical truth-display failures may not count unsafe.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-096 — Final Gate Can Rubber-Stamp Repaired/Truth-Erased State
- **Status:** CONFIRMED architectural effect, P0.
- **Classification:** `ADD_IMMUTABLE_PRE_POST_PROVENANCE_GATE`
- **CVF:** 25J

## AUTH-097 — Final Gate Has No Immutable Baseline Input
- **Status:** CONFIRMED P0.
- **Missing:** initial model, original Boss, original source truth, pre-repair provenance.
- **Classification:** `ADD_PROVENANCE_BASELINE_INPUT`

## AUTH-098 — Repair Success Defined Without Truth Preservation
- **Status:** CONFIRMED P0.
- **Evidence:** success = publishable after attempted repair.
- **Classification:** `REPLACE_REPAIR_SUCCESS_SEMANTICS`

## AUTH-099 — Repairable Optional Signal Does Not Block Delivery
- **Status:** CONFIRMED.
- **Effect:** repairable issues can remain while delivery passes.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-100 — `fatalCategory` Can Be Null While Compliance Is False
- **Status:** CONFIRMED.
- **Cause:** fatalCategory derives from loose publishable.
- **Classification:** `REPLACE_FINAL_DECISION_ORDER`

## AUTH-101 — `finalBossCompliance.ok` Is Misnamed
- **Status:** CONFIRMED.
- **Evidence:** field reflects combined `final.compliance.ok`, not Boss-only status.
- **Classification:** `DIAGNOSTIC_REPAIR`
- **Priority:** P1

## AUTH-102 — Upstream Readiness Signals Recorded but Not Gating
- **Status:** CONFIRMED behavior.
- **Classification:** `WATCH / DESIGN REVIEW`
- **No patch yet.**

## AUTH-103 — Computed `complianceOk` Is Dead Decision Data
- **Status:** CONFIRMED P0.
- **Effect:** intended final-compliance concept exists but is unused.
- **Classification:** `ORPHANED_AUTHORITY / LOGIC_REPAIR`

## AUTH-104 — No Final Blocking Category for Truth Regression
- **Status:** CONFIRMED ABSENCE, P0.
- **Needed category:** unresolved source-truth regression / provenance loss.
- **Classification:** `ADD_FINAL_DECISION_CLASSIFICATION`

## AUTH-105 — No Distinction Between Legitimate Collapse and False Collapse
- **Status:** CONFIRMED P0.
- **Effect:** optional source absent and accepted source lost can look identical by final decision time.
- **Classification:** `ADD_PROVENANCE_DELTA_GATE`
- **CVF:** 25J

---

# RETEST 20 Defect Mapping

## CVF-25A — Unit Mix False Collapse

High-confidence chain:

```text
structured Rent Roll unit_mix exists
-> model/HTML mismatch
-> UNIT_MIX_* violation
-> repairable section = unitMix
-> model + Boss set collapsed
-> sourceBacked false
-> rerender
-> compliant publish
```

Relevant entries:

```text
AUTH-049, AUTH-059, AUTH-060, AUTH-064,
AUTH-078, AUTH-079, AUTH-080, AUTH-081,
AUTH-082, AUTH-084, AUTH-090
```

## CVF-25B — Purchase Assumptions False Missing

Likely combined chain:

```text
role conflict and/or field schema loss
-> accepted purchase truth lost / HTML missing
-> acquisitionRequestContext repairable
-> model + Boss collapse
-> rerender
-> publish
```

Relevant entries:

```text
AUTH-001, AUTH-016, AUTH-017, AUTH-023, AUTH-028,
AUTH-043, AUTH-051, AUTH-056, AUTH-062, AUTH-063,
AUTH-065, AUTH-078, AUTH-079, AUTH-084
```

## CVF-25C — Purchase Assumptions Mislabeled Existing Debt

Strong candidate chain:

```text
stale debt semantics
-> canonical current-debt branch precedence
and/or Boss purchase-doc promotion
-> current debt bucket
-> customer treatment label
```

Relevant entries:

```text
AUTH-004, AUTH-016, AUTH-023, AUTH-039,
AUTH-043, AUTH-044
```

## CVF-25D — Current Debt Facts Visible but Dedicated Section Collapsed

Extremely strong chain:

```text
facts survive one surface
-> dedicated HTML fails completeness
-> CURRENT_DEBT_* violation
-> currentDebtContext repairable
-> model + Boss collapse
-> rerender
-> Document Treatment retains separate copy
```

Relevant entries:

```text
AUTH-002, AUTH-020, AUTH-033, AUTH-050, AUTH-055,
AUTH-061, AUTH-063, AUTH-079, AUTH-082, AUTH-084
```

## CVF-25E — Appraisal Cap Rate -> Interest Rate

Relevant entries:

```text
AUTH-008, AUTH-022
```

Confirmed missing correct appraisal fact contract plus strong candidate stale generic alias survival.

## CVF-25F — Break-Even Occupancy

No owner confirmed in AUTH-001 through AUTH-105.

Known:

```text
Projection is NOT owner.
CustomerSurfaceModel reads coreMetrics.breakEvenOccupancy rather than calculating.
```

Continue upstream metric-owner trace separately.

## CVF-25G — Rent-Upside Value Semantics

Not resolved in AUTH-001 through AUTH-105.

Continue renderer/document audit separately.

## CVF-25H — Asset Class / Identity Alias

Not resolved in AUTH-001 through AUTH-105.

Known:

```text
CustomerSurfaceModel reads propertyProfile.assetClass / asset_class.
Projection not owner.
```

Continue upstream profile/renderer trace separately.

---

# Codex Usage Doctrine for the Next Fresh Chat

The user explicitly wants Codex usage preserved.

Do **not** start with another broad audit.

Do **not** ask Codex to rediscover the architecture.

Use ChatGPT’s evidence ledger to write a sequence of **small root-family execution prompts**.

Preferred sequencing:

## Micro Prompt Family 1 — Immutable source provenance / one accepted role

Target:

```text
AUTH-005, 006, 015, 016, 017, 018, 021, 023,
039, 040, 043, 044, 057, 071
```

Goal:

```text
one identity
one accepted role
no display-label truth inference
no Boss role promotion
no same-file conflicting role duplicates
```

## Micro Prompt Family 2 — One canonical fact schema

Target:

```text
AUTH-001, 002, 019, 020, 022, 028, 041, 042, 045
```

Goal:

```text
normalize aliases once
downstream reads canonical facts only
no Boss regex fact extraction
```

## Micro Prompt Family 3 — No false collapse of source-backed truth

Target:

```text
AUTH-049, 050, 051, 052, 055, 056,
059, 060, 061, 062, 063, 064, 065,
066, 067, 069
```

Goal:

```text
sourceBacked true
must not become false merely to pass validation
```

## Micro Prompt Family 4 — Repair/orchestrator provenance preservation

Target:

```text
AUTH-078 through AUTH-091
```

Goal:

```text
immutable original provenance baseline
repair may change renderability
repair may not rewrite accepted truth
pre/post delta guard required
```

## Micro Prompt Family 5 — Final delivery gate integrity

Target:

```text
AUTH-092 through AUTH-105
```

Goal:

```text
publishability requires full final compliance
Boss OK
model OK
HTML OK
no unresolved provenance regression
legitimate collapse distinguished from false collapse
```

---

# Codex Leash / Usage Preservation

For every future Codex prompt:

```text
- narrow scope;
- one root family at a time;
- no broad repo audit;
- no live services;
- no DocRaptor;
- no Supabase writes;
- no paid/API loops;
- no broad smoke wall by default;
- no RETEST until coherent category fix is complete;
- no test-report hardcoding;
- no Stonebridge/RETEST/Attack fixture values in production;
- preserve Screening;
- compact receipt only.
```

Preferred compact receipt:

```text
1. Verdict PASS / HOLD / BLOCKED
2. Files changed
3. Exact authority contract changed
4. Targeted checks run/results
5. Exact blocker if HOLD/BLOCKED
6. Confirm no live services
7. Confirm no commit unless explicitly requested
```

Testing discipline:

```text
Start with:
- node --check
- targeted rg
- smallest relevant smoke/test

Escalate only if necessary.
Do not spend Codex usage on broad smoke walls unless the change genuinely requires them.
```

---

# Fresh Chat Start Instruction

Upload these three files first:

```text
1. Updated MASTER context/checklist
2. Updated CVF ledger
3. This AUTH-001 through AUTH-105 Semantic Authority Evidence Ledger
```

Then instruct the next chat:

```text
Do not restart the audit.
Do not ask for a broad Codex investigation.
Treat the AUTH ledger as the preserved evidence map.

First task:
Consolidate AUTH-001 through AUTH-105 into the smallest safe sequence of Codex micro-prompts.

Preserve Codex usage:
- one root family at a time;
- compact receipts;
- targeted checks;
- no broad smoke wall;
- no live services;
- no Screening changes unless strictly required;
- no RETEST until coherent category fixes are complete.

The prompts must implement the evidence-backed authority purge.
Codex is not being asked to rediscover the architecture.
```

---

# Controlling Conclusion

The manual audit proved that the Acquisition Memo problem is not one renderer bug, one parser bug, one stale helper, or one bad test.

It is:

```text
duplicate semantic authority
+
duplicate fact authority
+
no immutable provenance lock
+
false-collapse compliance laundering
+
a final gate that does not require full final compliance
```

That is the root evidence base for the next Codex execution phase.
