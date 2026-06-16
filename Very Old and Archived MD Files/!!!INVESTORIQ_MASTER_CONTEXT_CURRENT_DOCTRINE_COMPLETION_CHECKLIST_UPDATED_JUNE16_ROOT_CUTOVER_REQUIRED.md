# June 16, 2026 Addendum — Owner Escalation / V2 Final Bridge Rejected / Real Root Cutover Required TODAY

## Current controlling status

Rob escalated after the June 16 local smoke loop continued to fail even after the Acquisition Memo V2 source-authority rebuild, V2 final assembly helper, and multiple tightly scoped bridge corrections.

This escalation is warranted.

The controlling conclusion is now:

```text
Acquisition Memo V2 has a cleaner upstream brain, but it still does not have a sovereign final report body.
The current bridge still depends on legacy generate-client-report.js HTML assembly, markers, tokens, fallbacks, and test-return paths.
Therefore the system is still structurally capable of whack-a-mole failures even after V2 source/projection/render modules are correct.
```

Product status:

```text
Screening Report:
Launchable / founder-beta ready. Protect and do not touch except regression.

Acquisition Memo:
Not launch-cleared. V2 source-authority foundation is conceptually strong, but final HTML ownership is not solved.
Acquisition Memo V2 must now hard-cut over to a complete V2-owned memo body/document path or equivalent sovereign final HTML owner.

Full Underwriting V2:
Still deferred.
```

## Rob's escalation / owner red-line

Rob's frustration must be preserved as project context because it is the correct product-owner signal.

Rob's substance, recorded plainly:

```text
For weeks Rob has been asking for the ROOT problem, not another small patch.
He repeatedly warned that the work was turning into whack-a-mole.
He asked whether rebuilding generate-client-report.js or the Acquisition Memo path would be faster/safer.
He was repeatedly advised to avoid a wholesale rebuild and keep doing bounded patches.
The June 16 smoke loop proved that this advice was incomplete for Acquisition Memo final assembly.
Rob is right to reject another tiny patch loop.
Rob needs Screening and Acquisition Memo operational urgently.
The next work must solve the ownership boundary TODAY, not move the smoke failure again.
```

Verbatim-style owner sentiment to preserve:

```text
"No more patching every single issue again."
"Get to the fucking ROOT of the issue."
"If V2 is supposed to be brand new, why is it still fighting generate-client-report?"
"If the final bridge is still contaminated, then V2 is not truly bypassing the monster file."
"One patch, rebuild, or whatever it takes today — no more fucking around."
```

Interpretation:

```text
This is not ordinary venting.
This is a valid project-management correction.
The active issue is no longer a row, regex, marker, or idempotency bug.
The active issue is that Acquisition Memo V2 final report ownership is still not properly separated from the legacy generator.
```

## June 16 smoke / patch-loop evidence

After the V2 final assembly helper was added:

```text
Files changed:
- api/generate-client-report.js
- api/_lib/acquisition-memo-v2-final-assembly.js
```

Codex reported:

```text
- New helper file created.
- generate-client-report.js calls one helper in harness/intermediate/final paths.
- old ad hoc row/marker replacements removed or bypassed.
- Current debt context uploaded now driven from acquisitionMemoProjection.financingReadinessSignals.hasCurrentDebtContext.
- helper inserts before </body> or before </html>, never after </html>.
```

Additional tiny correction followed:

```text
api/_lib/acquisition-memo-v2-final-assembly.js
- current-debt row regex corrected to include the opening first <td>.
```

Manual smoke then failed again:

```text
node tests/qa/generate-client-report-rent-roll-smoke.js 2>&1 | findstr "PASS ERR_ASSERTION"

AssertionError [ERR_ASSERTION]:
The input did not match the regular expression
/Current_Debt_Stonebridge\.pdf[\s\S]{0,2000}Debt Support Received \/ Contextual/i
```

Interpretation:

```text
The failure moved back to Document Treatment visibility.
This proves the V2 final assembly helper is still a patch layer operating on legacy-produced HTML, not a true sovereign V2 memo body.
```

## Corrected architecture diagnosis

The V2 source-authority rebuild is NOT the failed part:

```text
buildCanonicalSourcePackage(...)
buildAcquisitionMemoProjection(...)
renderAcquisitionMemo(...)
```

The failed part is Step 5:

```text
bridge into generate-client-report.js final HTML assembly
```

The current helper is not a true bypass.

It is:

```text
a centralized patch layer that inserts/replaces V2 fragments inside legacy htmlString/finalHtml.
```

That means it can still be defeated by:

```text
legacy marked sections,
legacy token timing,
legacy finalHtml/htmlString split paths,
test-return path,
late append fallbacks,
old preliminary financing builders,
old document treatment builders,
old strip/dedupe/sanitize passes,
old QA/source-coverage post-processing assumptions,
old report template structure.
```

## Required doctrine change

The prior doctrine:

```text
"Do not rewrite generate-client-report.js wholesale."
```

remains correct for Screening and whole-platform safety, but it is no longer sufficient for Acquisition Memo V2 final assembly.

New doctrine:

```text
Do not rewrite the entire platform generator.
Do hard-cut Acquisition Memo V2 to its own complete final HTML body/document owner under the V2 gate.
generate-client-report.js may remain request/data/PDF/storage/delivery plumbing only, but it must not own Acquisition Memo V2 customer-visible body sections.
```

This means the next patch must not continue:

```text
replace SECTION_0_8;
insert before </body>;
patch Document Treatment idempotency;
regex one row from No to Yes;
marker chase DOCUMENT_TREATMENT_SUMMARY;
append missing V2 block after legacy output.
```

## Required next root cutover

Implement a true V2 final document owner such as:

```text
api/_lib/acquisition-memo-v2-document.js
```

Required exported function:

```javascript
renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection,
  renderedAcquisitionMemo,
  coreMetrics,
  reportMeta,
  propertyProfile,
  sourcePackage,
})
```

Or adapt the current renderer so that it returns a complete document/body, not fragments.

Under the V2 gate:

```javascript
effectiveReportMode === "v1_core" &&
acqMemoV2SourceAuthorityEnabled &&
acquisitionMemoV2Bridge?.acquisitionMemoProjection
```

the generator must do conceptually:

```javascript
finalHtml = renderCompleteAcquisitionMemoV2Html(...);
```

and skip legacy Acquisition Memo body assembly.

Allowed generate-client-report.js responsibilities under V2 gate:

```text
request/job parsing
auth/user/job loading
core T12/Rent Roll deterministic data preparation
calling buildCanonicalSourcePackage
calling buildAcquisitionMemoProjection
calling renderCompleteAcquisitionMemoV2Html
PDF generation
storage
delivery state
artifact writing
error handling
```

Forbidden generate-client-report.js responsibilities under V2 gate:

```text
legacy Acquisition Memo section marker ownership
legacy preliminary financing readiness ownership
legacy document treatment ownership
legacy source-context/support-doc treatment ownership
late append-after-html fallback
row-level current debt regex mutation
fragment insertion / body insertion patching
legacy helper reclassification of support docs
```

## Acceptance criteria for the next patch

The next patch is not accepted because one assertion passes once.

It is accepted only if all of these hold:

```text
1. V2 gate on uses one complete V2-owned Acquisition Memo HTML body/document.
2. generate-client-report.js does not insert V2 Document Treatment or Financing blocks by marker/regex/body insertion.
3. SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY is no longer the authority for V2 output.
4. DOCUMENT_TREATMENT_SUMMARY marker is no longer the authority for V2 output.
5. Current_Debt_Stonebridge.pdf appears within valid body HTML as Debt Support Received / Contextual.
6. Current debt context uploaded appears and says Yes.
7. Lender Diligence Checklist appears.
8. Preliminary Financing Readiness Summary appears.
9. Document Treatment is inside <body>, not after </html>.
10. Stonebridge_Assumptions remains purchase/proposed acquisition context, not current debt.
11. Reno remains Structured Renovation / CapEx Plan.
12. Appraisal remains appraisal context.
13. Phase I remains environmental context.
14. T12/Rent Roll remain core quantitative sources, not Other Support Document.
15. No DSCR/refi/DCF/waterfall/equity return/deal score/final recommendation/BUY/SELL/HOLD/loan approval language appears.
16. Screening smoke remains protected.
17. V2 gate off behavior remains unchanged.
18. No production hardcoding of Stonebridge filenames except in tests.
```

## Working-tree caution

As of the June 16 escalation, the repo may contain uncommitted changes from:

```text
api/generate-client-report.js
api/_lib/acquisition-memo-v2-final-assembly.js
```

Previous temp/debug warning remains:

```text
Remove any temporary fs.writeFileSync("retest4-final-html.html", ...) test line before commit unless intentionally made into a named artifact-writing utility.
```

Do not commit the current bridge-helper patch series as final if the true root cutover replaces it.

The next patch should either:

```text
A. replace the helper-based bridge with a complete V2 final document owner; or
B. explicitly keep the helper only as an internal implementation inside the complete V2 document owner, no longer as a legacy-body patcher.
```

## Fresh continuation point

Resume from here:

```text
June 16 owner escalation.

The latest smoke still fails:
Current_Debt_Stonebridge.pdf ... Debt Support Received / Contextual not found in final_html.

The failure persists after:
- V2 final assembly helper creation,
- current debt checklist row ownership change,
- row regex correction,
- generate-client-report bridge cleanup attempts.

Conclusion:
The bridge-helper approach is still contaminated by legacy final assembly.
No more row/marker/body-insertion patches.

Next work:
Hard-cut Acquisition Memo V2 to a complete V2-owned final HTML body/document under the V2 gate.
generate-client-report.js may provide plumbing only.
Screening must remain untouched/protected.
One patch/rebuild today, not another micro-patch loop.
```

---


# June 15, 2026 Pause Addendum — Acquisition Memo V2 Bridge Whack-a-Mole / Final HTML Assembly Not Yet Sovereign

## Current controlling status

Rob paused the Acquisition Memo V2 bridge patch loop after the June 15 controlled local smoke/debug sequence.

This pause is intentional and correct.

The active issue is no longer treated as another Current Debt label patch, another Reno label patch, or another source-classification patch.

The controlling issue is now:

```text
Acquisition Memo V2 source authority exists upstream, but the bridge into legacy generate-client-report.js final HTML assembly is not yet sovereign.
```

Current product status remains:

```text
Screening Report:
Launchable / founder-beta ready. Untouched and protected.

Acquisition Memo:
Not launch-cleared.
V2 source-authority rebuild remains active, but the current bridge/integration path is paused because final HTML assembly is still being fought by legacy template/token/marked-section/test-return paths.

Full Underwriting V2:
Still deferred.
```

## Why the pause happened

Codex used substantial quota while repeatedly patching the same symptom family without proving the actual final HTML state first.

The loop pattern was:

```text
1. Patch current-debt checklist row.
2. Run smoke.
3. Fail.
4. Search/reason through many legacy paths.
5. Patch another row/bridge location.
6. Repeat.
7. Eventually introduce a new ReferenceError.
```

Rob manually took control and uploaded the relevant outputs/files.

## Local smoke/debug sequence results

### 1. ReferenceError introduced and fixed

A Codex patch introduced:

```text
ReferenceError: acquisitionMemoV2Projection is not defined
```

Root cause:

```text
The handler referenced acquisitionMemoV2Projection outside its scope.
The valid scoped path is acquisitionMemoV2Bridge?.acquisitionMemoProjection.
```

Surgical fix applied:

```javascript
acquisitionMemoV2Projection?.financingReadinessSignals?.hasCurrentDebtContext
```

was replaced with:

```javascript
acquisitionMemoV2Bridge?.acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext
```

This fixed the crash class and `api/generate-client-report.js` passed syntax check afterward.

### 2. Final HTML artifact proved the original row patch was aimed at a missing section

The local `retest4-final-html.html` showed:

```text
Current debt context uploaded: 0 occurrences
Lender Diligence Checklist: 0 occurrences
Preliminary Financing Readiness Summary: 0 occurrences
```

The final HTML still contained an empty marked section:

```html
<!-- BEGIN SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY -->

<!-- END SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY -->
```

Interpretation:

```text
There was no current-debt checklist row to rewrite.
The whole financing-readiness/checklist section was not being inserted into the final HTML.
```

### 3. Current Debt classification itself was correct in the appended Document Treatment Summary

The same final HTML showed:

```text
Current_Debt_Stonebridge.pdf
Debt Support Received / Contextual
Uploaded existing/current debt context only; not proposed acquisition financing.
```

Interpretation:

```text
The source authority / document-treatment role was no longer the primary blocker in this local smoke path.
The blocker was final HTML assembly placement.
```

### 4. Document Treatment Summary remained outside the actual HTML document

The final HTML still had:

```html
</body>
</html>

<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->...
```

Interpretation:

```text
DOCUMENT_TREATMENT_SUMMARY was still being appended after the closing HTML tag in at least one test-return/final assembly path.
This is invalid report assembly and proves the legacy final assembly pipeline is still not fully under V2 control.
```

### 5. Latest smoke moved to a new assertion but did not prove the report is fixed

After another bounded Codex final-assembly patch, the local smoke failed on:

```javascript
/Current_Debt_Stonebridge\.pdf[\s\S]{0,300}Debt Support Received \/ Contextual/i
```

But the uploaded `retest4-final-html.html` still proved:

```text
SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY remains empty.
Current debt context uploaded remains absent.
Lender Diligence Checklist remains absent.
Document Treatment Summary remains after </html>.
```

Interpretation:

```text
The latest patch did not fix the actual bridge/final assembly path returned by the test.
No commit, deploy, or UI retest should occur from this state.
```

## Sharpened root diagnosis

The V2 source-authority rebuild is conceptually correct:

```text
buildCanonicalSourcePackage(...)
-> buildAcquisitionMemoProjection(...)
-> renderAcquisitionMemo(...)
```

The problem is the current Step 5 bridge approach is still half-new / half-old:

```text
V2 modules produce source/projection/rendered memo data,
but generate-client-report.js still owns:
- legacy template tokens,
- marked sections,
- late replacement passes,
- test-return htmlString paths,
- Document Treatment harness fallbacks,
- legacy preliminary financing blocks,
- legacy source-context sections,
- late finalHtml overwrites.
```

This creates the same structural whack-a-mole the rebuild was supposed to eliminate.

The practical lesson:

```text
Do not keep row-patching legacy final assembly.
Acquisition Memo V2 needs one sovereign memo body / section-owner path.
generate-client-report.js should insert the finished V2 rendered body/block once, then stop legacy paths from overwriting or appending behind it.
```

## Current local files / working-tree caution

The current local repo may contain uncommitted changes from the debugging sequence:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

The smoke test also has a temporary manual debug line:

```javascript
fs.writeFileSync("retest4-final-html.html", retest4RenderHtml);
```

This temporary test-write line must be removed before any commit unless intentionally preserved as a named artifact-writing test utility.

Current status:

```text
Do not commit.
Do not deploy.
Do not run UI retest.
Do not ask Codex for broad investigation.
```

## Recommended next strategy

When work resumes in a fresh chat, do not continue the same micro-patch loop.

Choose one of two bounded paths:

### Option A — Final bridge ownership patch

Patch only the V2 gate path so that when:

```javascript
effectiveReportMode === "v1_core" &&
acqMemoV2SourceAuthorityEnabled &&
acquisitionMemoV2Bridge?.renderedAcquisitionMemo
```

then the final Acquisition Memo V2 financing/document-treatment/source-context surface is owned by V2 rendered output, and legacy template/token/test-return paths cannot append or overwrite those sections.

Acceptance:

```text
SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY is not empty.
It includes Preliminary Financing Readiness Summary.
It includes Lender Diligence Checklist.
It includes Current debt context uploaded = Yes.
DOCUMENT_TREATMENT_SUMMARY is inside <body>, not after </html>.
Current_Debt_Stonebridge.pdf appears as Debt Support Received / Contextual.
No duplicate/conflicting legacy row remains.
V2 gate off behavior remains unchanged.
```

### Option B — Stop bridge patching and render a complete V2 Acquisition Memo body

Instead of fighting legacy section-by-section replacements, make `renderAcquisitionMemo(projection)` produce a complete V2 memo body/block and insert it into one known Acquisition Memo container under the V2 feature gate.

Acceptance:

```text
Projection/renderer own all V2 Acquisition Memo customer-visible source surfaces.
generate-client-report.js is a thin shell only.
Legacy Document Treatment / Preliminary Financing / support-doc helpers do not run for V2-gated memo body.
```

Preferred direction:

```text
Option B is cleaner and more aligned with the original rebuild doctrine.
Option A may be faster, but risks continuing the same bridge whack-a-mole.
```

## Fresh continuation point

Resume from here:

```text
We paused on June 15 after local smoke/debug proved the current Acquisition Memo V2 bridge is still not sovereign.

Important latest evidence:
- ReferenceError from acquisitionMemoV2Projection was fixed by using acquisitionMemoV2Bridge?.acquisitionMemoProjection.
- Current debt role/classification appears correct in Document Treatment.
- However SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY is still empty in final HTML.
- Current debt context uploaded / Lender Diligence Checklist / Preliminary Financing Readiness Summary are absent.
- DOCUMENT_TREATMENT_SUMMARY is still appended after </html>.
- Latest smoke failure moved to a document-treatment assertion, but final HTML still proves bridge/final assembly is wrong.
- Do not commit/deploy/UI retest from current local state.
- Remove temporary fs.writeFileSync debug line before commit.
- Next decision: either one bounded V2 bridge ownership patch or pivot to a cleaner complete V2 memo-body insertion so generate-client-report.js stops fighting the new V2 modules.
```

## Permanent guardrails still active

```text
Do not touch Screening except protective regression.
Do not touch Stripe, SQL, Supabase, auth/upload gates, pricing, DocRaptor config, or Admin Dashboard.
Do not reopen DSCR/refi/DCF/waterfall/equity-return/deal-score/final-recommendation/BUY/SELL/HOLD in Acquisition Memo.
Do not hardcode Stonebridge production logic.
Do not treat support-doc ambiguity as a customer fail gate.
Do not let optional support docs override T12/Rent Roll core truth.
Do not continue broad Codex investigation loops.
Use get-in/get-out prompts only if Codex is used.
```

---

# June 14, 2026 Evening Addendum — V2 Source-Authority Rebuild Steps 1 and 2 Complete

## Current controlling status

Step 1 (inspection + scaffolding) and Step 2 (buildCanonicalSourcePackage implementation + smoke tests) of the Acquisition Memo V2 Source-Authority Rebuild are complete on branch `acq-memo-v2-source-package`.

Tag `pre-acq-memo-v2-rebuild` is set.

Controlling decision unchanged:

```text
Screening Report:
Launchable / founder-beta ready. Untouched. Protected.

Acquisition Memo:
Automation frozen / not launch-cleared.
Now in active V2 source-authority rebuild. Branch is live. Foundation is built.

Full Underwriting V2:
Still deferred. Will be built later on the same canonical source package foundation.
```

## Step 1 result — Call Site Inspection Complete

Codex produced a full inspection report identifying every competing document-role decision-maker in the codebase.

### Confirmed competing decision-makers (complete cut list)

```text
api/_lib/report-surface-contracts.js ~1544-1659
  buildSupportDocTaxonomyState
  PRIMARY decision-maker. Acquisition Memo + shared.
  Directly assigns purchase assumptions, current debt, renovation,
  market survey, appraisal, environmental, and property tax roles.

api/_lib/report-surface-contracts.js ~1706-1878
  resolveCanonicalSupportDocAuthority
  PRIMARY decision-maker. Acquisition Memo + shared.
  Resolves keyword, AI, parser, and fallback authority.
  Assigns role/display/treatment/use.

api/_lib/report-surface-contracts.js ~2610-2648
  Underwriting inventory acceptance checks against semantic_doc_role.
  Consumer/fallback validator. Shared path.

api/parse/parse-doc.js ~18-39, ~4916-4921, ~5254, ~5685
  Parser taxonomy attachment, extracted-text lookup, debt-basis normalization.
  Upstream decision-maker. Both Acquisition Memo and shared parser flow.

api/_lib/source-package-qa.js ~61-139, ~178-222
  Artifact inventory from document_text_extracted, semantic_doc_role,
  debt_basis, parse_error. Consumer that can duplicate role interpretation.

api/generate-client-report.js ~2994-3435
  buildCanonicalSupportDocAuthorityRows
  PRIMARY render-time authority builder. Acquisition Memo path.
  Contains own heuristics and explicit overrides. MAIN TARGET for quarantine.

api/generate-client-report.js ~3448-3670
  buildDocumentTreatmentSummaryHtml
  Consumer/fallback renderer. Acquisition Memo path.
  Canonical branch + legacy fallback both still exist.

api/generate-client-report.js ~4952-5010
  Preliminary Financing Readiness support-doc lookups.
  Consumer. Acquisition Memo path.

api/generate-client-report.js ~5228-5264
  buildLaunchSourceContextBlock
  Consumer/wrapper. Acquisition Memo path.

api/generate-client-report.js ~5734-5790
  Acquisition Financing Readiness / current debt separation logic.
  Consumer and secondary classifier. Acquisition Memo path.

api/generate-client-report.js ~6048-6294
  buildScreeningDataCoverageSummary
  Shared consumer. Can re-render Document Treatment using canonical map.

api/generate-client-report.js ~9708-9752
  render-time canonicalSupportDocMap construction + internal diagnostic.
  PRIMARY map build for Acquisition Memo render.

api/generate-client-report.js ~10511-10522
  Renovation authority fallback block.
  Consumer with fallback authority rebuild. Acquisition Memo path.

api/generate-client-report.js ~11949-11974
  Harness document-treatment replacement.
  Late overwrite consumer. Acquisition Memo path.

api/generate-client-report.js ~12696-12718
  Final HTML DOCUMENT_TREATMENT_SUMMARY overwrite.
  Late renderer replacement. Acquisition Memo path.

api/_lib/report-contract-qa.js ~1055-2262
  Support-doc QA checks, contradiction checks, checklist checks,
  financing-readiness checks. QA consumer, not sovereign.

api/_lib/qa-action-plan.js ~84
  debt_basis routing. Consumer / advisory gate.

api/_lib/qa-fix-routing.js ~73
  debt_basis routing. Consumer / advisory gate.
```

### Why this inspection was essential

The inspection confirmed there are at least 4 separate locations in `generate-client-report.js` alone
(~2994, ~9708, ~11949, ~12696) that can independently build or overwrite document treatment output.
This is why RETEST 5 still failed after Patch 4D improved some labels. Patching one of four
output paths left the other three running. The V2 architecture makes all four irrelevant.

## Step 1 result — Scaffold Files Created

```text
api/_lib/canonical-source-package.js       — stub only, Step 2 fills this
api/_lib/acquisition-memo-projection.js    — stub only, Step 3 will fill this
api/_lib/acquisition-memo-renderer.js      — stub only, Step 4 will fill this
tests/qa/acquisition-memo-source-package-smoke.js     — stub with 8 golden it() placeholders
tests/qa/acquisition-memo-authority-boundary-smoke.js — stub with boundary it() placeholder
```

No production logic was rewritten in Step 1. No live report generation was run.

## Step 2 result — buildCanonicalSourcePackage Implemented

`api/_lib/canonical-source-package.js` is now fully implemented.

### Canonical role enum (8 roles only, no others permitted)

```text
core_t12
core_rent_roll
purchase_assumptions
current_debt_context
structured_renovation_capex_plan
appraisal_context
market_survey_context
environmental_context
```

Files that cannot be confidently classified into one of the above 8 roles
receive role: "other_support".

### Classification priority order (enforced mechanically)

```text
1. T12 detection — filename "t12"/"trailing" OR spreadsheet + semantic_doc_role "t12"
2. Rent Roll detection — filename "rent_roll"/"rentroll" OR spreadsheet + semantic_doc_role "rent_roll"
3. Current debt detection — debt_basis "current_debt" OR semantic_doc_role "current_debt"
   CRITICAL: negative language ("not a current mortgage statement") must NEVER trigger current_debt_context.
   A file with "assumption" in the filename must NEVER be classified as current_debt_context.
4. Purchase assumptions detection — semantic_doc_role "purchase_assumptions" OR filename contains "assumption" OR debt_basis "proposed_acquisition"
   NOTE: purchase_assumptions wins over current_debt_context if both signals fire.
5. Renovation — semantic_doc_role "renovation_plan" OR filename "reno"/"renovation"/"capex"
6. Appraisal — semantic_doc_role "appraisal" OR filename "appraisal"
7. Market survey — semantic_doc_role "market_survey" OR filename "market"/"survey"
8. Environmental — semantic_doc_role "phase_i_esa"/"environmental" OR filename "esa"/"phase_i"/"phase"
   NOTE: environmental_context must NEVER be classified as property tax support.
9. Default → other_support
```

### Key architectural guarantee

`buildCanonicalSourcePackage` is the ONLY function in the codebase permitted to read:
- semantic_doc_role
- debt_basis
- doc_type
- parse_error
- document_text_extracted
- filename heuristics

`buildAcquisitionMemoProjection` and `renderAcquisitionMemo` are forbidden from reading these fields directly.
The authority boundary smoke test enforces this mechanically.

### Output contract

```javascript
{
  coreT12: { fileId, originalFilename, role: "core_t12" } | null,
  coreRentRoll: { fileId, originalFilename, role: "core_rent_roll" } | null,
  supportDocs: Map<fileId, CanonicalSupportDocEntry>,
  authorityVersion: "v2"
}
```

## Step 2 result — Smoke Tests Implemented

### acquisition-memo-source-package-smoke.js — 8 golden assertions + 1 negative assertion

```text
GOLDEN ASSERTIONS:
T12 file → coreT12 set AND role === "core_t12"
Rent Roll file → coreRentRoll set AND role === "core_rent_roll"
Stonebridge_Assumptions.pdf → role === "purchase_assumptions"
Current_Debt_Stonebridge.pdf → role === "current_debt_context"
Stonebridge_Reno_Plan.pdf → role === "structured_renovation_capex_plan"
Stonebridge_Appraisal_Summary.pdf → role === "appraisal_context"
Stonebridge_Market_Survey.pdf → role === "market_survey_context"
Stonebridge_Phase_I_ESA.pdf → role === "environmental_context"

NEGATIVE ASSERTION (critical contamination guard):
A file named "Stonebridge_Assumptions.pdf" with debt_basis "proposed_acquisition"
must NEVER resolve to role === "current_debt_context"
```

### acquisition-memo-authority-boundary-smoke.js

```text
Reads source text of acquisition-memo-projection.js and acquisition-memo-renderer.js.
Asserts neither file contains forbidden authority fields:
  semantic_doc_role, debt_basis, doc_type, parse_error, document_text_extracted,
  originalFilename.toLowerCase, filename.toLowerCase
Currently passes trivially because projection/renderer are still stubs.
Becomes enforcement gate as Steps 3 and 4 are implemented.
```

### Validation commands (all must pass before Step 2 is marked complete)

```text
node --check api/_lib/canonical-source-package.js
node --check tests/qa/acquisition-memo-source-package-smoke.js
node --check tests/qa/acquisition-memo-authority-boundary-smoke.js
node tests/qa/acquisition-memo-source-package-smoke.js
node tests/qa/acquisition-memo-authority-boundary-smoke.js
```

Awaiting Codex confirmation that all 5 pass.

## What was NOT touched in Steps 1 and 2

```text
generate-client-report.js — untouched
report-surface-contracts.js — untouched (read-only reference only)
Screening Report — untouched
T12/Rent Roll core math — untouched
Stripe, SQL, Supabase, DocRaptor, auth/upload gates, pricing, Admin Dashboard — untouched
DSCR, refi, DCF, waterfall, equity return, deal score, final recommendation — untouched
```

## Step 2 cut list (for future steps)

```text
buildCanonicalSupportDocAuthorityRows in generate-client-report.js
  → quarantine/replace in Step 3/4

resolveCanonicalSupportDocAuthority and buildSupportDocTaxonomyState in report-surface-contracts.js
  → convert to evidence extractors or move behind canonical source package

buildDocumentTreatmentSummaryHtml legacy fallback
  → remove for Acquisition Memo once canonical source package enforced

buildLaunchSourceContextBlock, buildScreeningDataCoverageSummary,
buildPreliminaryFinancingReadinessSummaryHtml, buildAcquisitionFinancingReadinessHtml,
renovation acknowledgement path
  → convert to dumb consumers only

report-contract-qa, qa-action-plan, qa-fix-routing, source-package-qa
  → stop independently re-deciding document roles; consume canonical authority only

parse-doc.js
  → remains upstream extractor; taxonomy attachment no longer treated as
    competing authority for Acquisition Memo render decisions
```

## Rebuild sequence status

```text
Step 1: Call site inspection + scaffold creation — COMPLETE
Step 2: buildCanonicalSourcePackage implementation + smoke tests — COMPLETE (awaiting Codex validation confirmation)
Step 3: buildAcquisitionMemoProjection implementation — PENDING
Step 4: renderAcquisitionMemo implementation — PENDING
Step 5: Thin bridge wiring into generate-client-report.js — PENDING
Step 6: Quarantine legacy competing decision-makers — PENDING
Step 7: Final Attack Test 8 golden replay — PENDING
```

## Fresh continuation point

```text
Resume here in next session:
Receive Codex Step 2 validation result (all 5 node commands).
If all 5 pass → proceed to Step 3 (buildAcquisitionMemoProjection).
If any fail → diagnose and fix before moving to Step 3.
Do not proceed to Step 3 until all 5 validation commands pass.
Do not touch generate-client-report.js until Step 5.
Do not run any live report generation until Step 7.
```

## Permanent guardrails (unchanged)

```text
Do not run another V1 RETEST as a tiny patch loop.
Do not write another one-off Current Debt / Reno / Assumptions label patch.
Do not rebuild Full Underwriting first.
Do not touch Screening except protective tests.
Do not touch Stripe, SQL, Supabase lifecycle, payment/access, auth/upload gates,
pricing, DocRaptor config, or Admin Dashboard.
Do not reopen DSCR/refi/DCF/waterfall/equity-return/deal-score/
final-recommendation/BUY/SELL/HOLD inside Acquisition Memo.
```

---

# June 14, 2026 Addendum - Acquisition Memo Automation Frozen / Source-Authority Rebuild Start / No More Tiny Patch Loop

## Current controlling decision

Final Attack Test 8 RETEST 5 confirmed the support-document authority family is not fully solved by the Patch 4B/4C/4D-style patch loop.

The project is now moving from incremental Acquisition Memo patching into a quarantined rebuild of the shared source-authority foundation.

Controlling decision:

```text
Screening Report:
Still launchable / founder-beta ready from current evidence. Keep it protected and do not let the Acquisition Memo rebuild destabilize it.

Acquisition Memo:
Automation is frozen / not launch-cleared. Do not run more tiny support-doc authority patches and live retests as a loop.

Full Underwriting V2.0:
Still deferred. Do not rebuild Full Underwriting first. Build the shared source-authority foundation first, then Acquisition Memo V2, then Full Underwriting V2 later on that same foundation.
```

This supersedes the prior posture of “one more Patch 4C/4D/RETEST.”

The issue is no longer treated as a one-document Current Debt or Reno label bug. The controlling root issue is now:

```text
The live Acquisition Memo path does not yet have a mechanically enforced single source-authority regime.
```

## RETEST 5 result - what improved

Final Attack Test 8 RETEST 5 showed real improvement in some visible surfaces:

```text
Report generated and published.
Core math held.
V2 forbidden surfaces stayed closed.
Current_Debt_Stonebridge.pdf now appeared in Document Treatment as Debt Support Received / Contextual.
Stonebridge_Reno_Plan.pdf now appeared in Document Treatment as Structured Renovation / CapEx Plan.
The visible report no longer said no verified current debt context was provided.
The visible report acknowledged the structured Reno / CapEx budget, rent-lift assumptions, and phasing as source-transparent context.
```

Core values that continued to hold:

```text
Units: 64
Occupancy: 93.8%
Annual In-Place Rent: $1,432,800
Annual Market Rent: $1,718,400
Annual Rent Upside: $285,600
Rent Gap: 19.9%
EGI: $1,500,000
OpEx: $555,000
NOI: $945,000
Expense Ratio: 37.0%
NOI Margin: 63.0%
Break-Even Occupancy: 37.0%
Purchase Price: $13,500,000
Going-In Cap Rate: 7.0%
```

Interpretation:

```text
The report engine, core math, publish path, and V2 containment remain strong.
Patch 4D improved the exact Current Debt and Reno treatment rows.
But the broader support-doc/source-authority system still leaks contradictions into final customer-visible output.
```

## RETEST 5 result - remaining customer-visible authority failures

### 1. Uploaded Existing Debt Context still contaminated by proposed acquisition terms

Visible PDF showed:

```text
Uploaded Existing Debt Context
Interest Rate: 5.95%
Amortization: 30 years
LTV: 70.0%
```

Those are not the current-debt document facts. They are proposed acquisition financing assumptions from `Stonebridge_Assumptions.pdf`.

The true `Current_Debt_Stonebridge.pdf` source facts were:

```text
Current Outstanding Balance: $6,800,000
Interest Rate: 4.85%
Amortization Remaining: 24 years
Monthly Payment: $39,250
Maturity Date: 2029-11-01
```

Interpretation:

```text
The label improved, but the facts feeding Uploaded Existing Debt Context were still wrong.
This proves the source-authority path remains fragmented: proposed acquisition financing can still contaminate current debt context.
```

### 2. Stonebridge_Assumptions.pdf was misclassified as current debt support

Document Treatment Summary showed:

```text
Stonebridge_Assumptions.pdf
Document Role: Debt Support Received / Contextual
Treatment: Debt support received / contextual or deferred
Use: Uploaded existing/current debt context only; not proposed acquisition financing.
```

Correct behavior:

```text
Stonebridge_Assumptions.pdf should be Purchase Assumptions / Proposed Acquisition Financing Context.
It must not be current debt or existing debt support.
```

### 3. Stonebridge_Phase_I_ESA.pdf was misclassified as Property Tax Support

Document Treatment Summary showed:

```text
Stonebridge_Phase_I_ESA.pdf
Document Role: Property Tax Support
Treatment: Corroborating support
Use: Corroborating property-tax support; does not override T12 totals.
```

Correct behavior:

```text
Stonebridge_Phase_I_ESA.pdf is Environmental / Phase I due diligence context only.
It must not become property tax support.
```

### 4. Stonebridge_Appraisal_Summary.pdf was still overpromoted

Document Treatment Summary showed:

```text
Stonebridge_Appraisal_Summary.pdf
Document Role: Purchase Assumptions / Acquisition Context
```

Correct behavior:

```text
Appraisal summary should be appraisal / valuation context only.
It must not override purchase assumptions, T12 NOI, Rent Roll market rent, or cap-rate value framework.
```

### 5. T12 and Rent Roll were listed as generic Other Support Document rows

Document Treatment Summary showed the core files as:

```text
T12_Stonebridge_Lofts_Attack_Test_8.xlsx - Other Support Document / Context only
Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx - Other Support Document / Context only
```

Correct behavior:

```text
T12 and Rent Roll are core quantitative sources, not generic support docs.
They may appear in a core source table, but not as context-only support documents that are “not used quantitatively.”
```

### 6. Internal QA still showed stale/contradictory authority noise

Artifacts still showed advisory/legacy fallback inconsistencies, including:

```text
UNSUPPORTED_RENOVATION_ANALYSIS_RENDERED
structured_renovation_present: false
readiness_source: legacy_action_plan_fallback
canonical_delivery_state_present: false
```

Interpretation:

```text
Internal QA is not the final customer delivery authority, but it still proves the old authority ecosystem has not been fully collapsed into one sovereign source package.
```

## Updated root diagnosis after RETEST 5

The prior root diagnosis is confirmed and sharpened:

```text
InvestorIQ does not need one more support-doc label patch.
InvestorIQ needs a single mechanically enforced source-authority foundation.
```

The broken pattern is:

```text
raw uploaded files
+ parser semantic roles
+ AI recovery artifacts
+ document_text_extracted artifacts
+ filename heuristics
+ canonical support doc map
+ renderer fallbacks
+ QA/action-plan fallbacks
= competing decision makers
```

The rebuild target is:

```text
raw uploaded files + extracted text + parsed artifacts
-> buildCanonicalSourcePackage(...)
-> buildAcquisitionMemoProjection(...)
-> renderAcquisitionMemo(...)
```

No downstream renderer, financing section, checklist, Document Treatment table, or QA layer may independently reinterpret document roles after the canonical source package exists.

## New architecture decision - rebuild shared source-authority foundation, not Full Underwriting first

Do not rebuild Full Underwriting first.

Reason:

```text
Full Underwriting would multiply the same source-authority problem across DSCR, debt sizing, refinance, DCF, waterfall, equity returns, and final recommendation surfaces.
```

Correct sequence:

```text
1. Preserve / launch Screening first.
2. Build Canonical Source Package foundation.
3. Rebuild Acquisition Memo V2 on that foundation.
4. Build Full Underwriting V2 later on the same foundation.
```

This is a source-authority rebuild, not a whole InvestorIQ rewrite.

## Acquisition Memo V2 rebuild boundary

The rebuild must be quarantined and reversible.

Recommended branch:

```text
git checkout -b acq-memo-v2-source-package
```

Recommended tag before work:

```text
git tag pre-acq-memo-v2-rebuild
```

Recommended new files / modules:

```text
api/_lib/canonical-source-package.js
api/_lib/acquisition-memo-projection.js
api/_lib/acquisition-memo-renderer.js
tests/qa/acquisition-memo-source-package-smoke.js
tests/qa/acquisition-memo-final-render-smoke.js
tests/qa/acquisition-memo-authority-boundary-smoke.js
```

Do not rewrite `api/generate-client-report.js` wholesale.

Only add a thin bridge when ready:

```text
if report mode is Acquisition Memo V2:
  buildCanonicalSourcePackage(...)
  buildAcquisitionMemoProjection(...)
  renderAcquisitionMemo(...)
else:
  preserve current Screening / legacy paths
```

## Canonical Source Package contract

`buildCanonicalSourcePackage(...)` must return one canonical object per source file.

Minimum fields:

```text
fileId
originalFilename
sourceKind: core_t12 | core_rent_roll | support_doc
canonicalRole
canonicalLabel
allowedUses
forbiddenUses
extractedFacts
confidence
sourceEvidence
sourceAuthorityVersion
provenance
```

Required canonical roles:

```text
core_t12
core_rent_roll
purchase_assumptions
proposed_acquisition_financing
current_debt_context
structured_renovation_capex_plan
appraisal_context
market_survey_context
environmental_context
property_tax_support
zoning_or_compliance_context
broker_or_diligence_context
other_support_context
unclassified_support_context
```

Core source examples:

```text
T12_Stonebridge_Lofts_Attack_Test_8.xlsx -> core_t12
Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx -> core_rent_roll
```

Support-doc examples from RETEST 5:

```text
Stonebridge_Assumptions.pdf -> purchase_assumptions / proposed_acquisition_financing
Current_Debt_Stonebridge.pdf -> current_debt_context
Stonebridge_Reno_Plan.pdf -> structured_renovation_capex_plan
Stonebridge_Appraisal_Summary.pdf -> appraisal_context
Stonebridge_Market_Survey.pdf -> market_survey_context
Stonebridge_Phase_I_ESA.pdf -> environmental_context
```

## Acquisition Memo Projection contract

`buildAcquisitionMemoProjection(canonicalSourcePackage, coreMetrics)` must create the only object the Acquisition Memo renderer consumes.

Minimum projection fields:

```text
coreOperatingMetrics
rentPositioning
acquisitionContext
proposedFinancingContext
currentDebtContext
renovationContext
appraisalContext
marketSurveyContext
environmentalContext
propertyTaxContext
documentTreatmentRows
lenderDiligenceChecklist
omittedSections
disclosures
sourcePackageDiagnostics
```

The renderer must not read raw artifacts or parser roles. It must only render the projection.

## Mechanical enforcement requirements

The rebuild is not complete because the report looks right once.

It is complete only when bypassing the source package becomes mechanically detectable.

Required enforcement:

```text
1. Acquisition Memo renderer does not receive raw documentSources, coverageArtifacts, parser artifacts, or extracted text.
2. Acquisition Memo renderer consumes only acquisitionMemoProjection.
3. Forbidden-field/source-scan test fails if Acquisition Memo renderer/projection files directly read parser authority fields outside the source package builder.
4. Old support-doc authority helpers are deleted, quarantined, or converted into adapters that call buildCanonicalSourcePackage.
5. Final HTML tests assert source-package lineage for every support-doc row.
6. RETEST 5 artifact replay becomes a permanent golden regression.
7. Screening smoke must pass unchanged.
8. V2 forbidden surfaces must stay absent.
```

Forbidden direct authority fields outside `canonical-source-package.js` include:

```text
semantic_doc_role
semantic_doc_display_label
debt_basis
doc_type
parse_error
supporting_documents_unclassified
loan_term_sheet_parsed
rent_roll_parse_error
document_text_extracted
original_filename.includes(...)
filename.includes(...)
```

Nuance:

```text
The source-package builder may read these fields as evidence.
The Acquisition Memo projection/renderer may not use them as live authority.
```

## Old-path quarantine requirement

Old helpers cannot remain live independent decision makers for Acquisition Memo V2.

Relevant helpers to inspect and either delete, quarantine, or adapt:

```text
buildCanonicalSupportDocAuthorityRows(...)
resolveExplicitSupportDocAuthority(...)
buildSupportDocTaxonomyState(...)
buildDocumentTreatmentSummaryHtml(...) if it performs its own role decisions
buildPreliminaryFinancingReadinessSummaryHtml(...) if it performs its own role decisions
QA/action-plan support-doc role inference helpers
renderer filename/doc_type/debt_basis fallbacks
```

If kept, they must become wrappers/adapters around `buildCanonicalSourcePackage(...)` or V1 legacy-only paths not imported by Acquisition Memo V2.

## Production doctrine preserved

The rebuild must not violate Publish-or-Fail doctrine.

Production report generation should still only fail closed for:

```text
true missing/unusable required T12;
true missing/unusable required Rent Roll;
true runtime/storage/PDF/catastrophic render failure.
```

Optional/support document ambiguity should not kill a core-valid report.

Correct support-doc behavior remains:

```text
classify if source-bound;
render as context-only / limited-use if bounded;
collapse or disclose if incomplete;
never fabricate;
never override T12/Rent Roll core truth;
never unlock V2 surfaces in Acquisition Memo.
```

The source-authority contract is a developer/test/CI contract, not a customer fail gate for optional docs.

## Current business posture

```text
Do not use Acquisition Memo as an automated customer launch product until V2 source-package rebuild passes.
```

Recommended near-term business posture:

```text
1. Continue with Screening as the launchable/founder-beta product.
2. Keep Acquisition Memo manual/controlled/internal until the source-authority rebuild is complete.
3. Do not run more random live Acquisition Memo retests from the current V1 patch loop.
4. Do not open Full Underwriting V2 until the shared source-authority foundation exists.
```

## Acceptance criteria for Acquisition Memo V2 rebuild

Before Acquisition Memo V2 can be called certification-batch ready:

```text
1. Canonical source package correctly classifies RETEST 5 files.
2. Acquisition Memo projection correctly separates purchase assumptions, proposed acquisition financing, current debt, appraisal, market survey, environmental context, Reno, T12, and Rent Roll.
3. Final customer HTML renders Current Debt facts from Current_Debt_Stonebridge.pdf, not Stonebridge_Assumptions.pdf.
4. Final customer HTML renders proposed acquisition financing facts only as proposed/acquisition context.
5. Stonebridge_Assumptions.pdf never becomes current debt.
6. Phase I ESA never becomes property tax support.
7. Appraisal summary never becomes purchase assumptions unless a separate validated purchase-assumption source actually exists for that same file.
8. T12 and Rent Roll never appear as “Other Support Document / not used quantitatively.”
9. Reno plan renders as source-transparency context only and does not unlock ROI/payback/NOI impact/refi/DCF/waterfall/recommendation.
10. No DSCR/refi/DCF/waterfall/equity-return/deal-score/final-recommendation/BUY/SELL/HOLD surfaces render.
11. Screening regression remains unchanged.
12. Forbidden-field/source-scan tests prove Acquisition Memo renderer cannot bypass the projection.
13. Old support-doc authority paths are quarantined, deleted, or adapters only.
14. Final report artifacts include or can emit canonical_source_package.json and acquisition_memo_projection.json for auditability.
```

## Do not do next

Do not:

```text
write another tiny Current Debt or Reno patch;
run RETEST 6 against the same V1 patch loop;
rewrite generate-client-report.js wholesale;
rebuild Full Underwriting first;
touch Screening except protective regression;
touch Stripe, SQL, Supabase lifecycle, auth/upload gates, pricing, DocRaptor config, or Admin Dashboard as part of this rebuild;
reopen DSCR/refi/DCF/waterfall/deal-score/final-recommendation/V2 surfaces inside Acquisition Memo.
```

## Fresh continuation point

Resume from here:

```text
Final Attack Test 8 RETEST 5 confirmed the Patch 4 support-doc authority loop is not enough.
Core math, publish path, and V2 containment held.
Current Debt and Reno visible labels improved, but the system still contaminated Uploaded Existing Debt Context with proposed acquisition terms, misclassified Stonebridge_Assumptions as debt support, misclassified Phase I as property tax, overpromoted Appraisal as purchase assumptions, and listed T12/Rent Roll as generic Other Support Documents.
Acquisition Memo automation is frozen / not launch-cleared.
No more tiny patches or RETEST loop.
Next work is a quarantined Acquisition Memo V2 source-authority rebuild on a branch:
- buildCanonicalSourcePackage
- buildAcquisitionMemoProjection
- renderAcquisitionMemo
- source-scan/forbidden-field tests
- RETEST 5 golden replay
- Screening untouched.
Full Underwriting V2 remains deferred until the shared source-authority foundation is stable.
```

---

# June 12, 2026 Addendum - Final Attack Test 8 RETEST 2 / Patch 4 Still Not Launch-Cleared / Current Debt + Reno Authority Still Disobeying

## Current controlling status

Final Attack Test 8 RETEST 2 was run after the latest bounded support-doc authority patch was deployed.

Runtime marker confirmed the new deployment was active:

```text
git_commit_sha / build_marker: f88d9a9b6430a1af0043213a28b678d5e0c03819
```

This means the retest was valid. The observed failures are not a stale-deployment issue.

Current verdict:

```text
Screening Report:
Still launchable / founder-beta ready from current evidence.

Acquisition Memo:
NOT launch-cleared.
Patch 4 improved Purchase Assumptions, but support-doc authority is still not sovereign.
Current Debt and Structured Reno Plan still disobey the extracted source truth in visible customer output.

Full Underwriting V2.0:
Still deferred.
```

## What improved in RETEST 2

The Purchase Assumptions / Proposed Acquisition Financing source path improved materially.

Visible PDF now correctly includes:

```text
Purchase Price: $13,500,000
NOI Basis: $945,000
Going-In Cap Rate: 7.0%
Purchase assumptions provided: Yes
Proposed acquisition loan terms complete: Yes
Proposed Acquisition Financing: Source-complete inputs provided / available for future underwriting.
```

Document Treatment now renders `Stonebridge_Assumptions.pdf` as:

```text
Document Role: Purchase Assumptions / Acquisition Context
Treatment: Acquisition context / document-derived acquisition context
Use: Purchase price / going-in cap / NOI basis and proposed acquisition financing context; does not override T12/Rent Roll operating truth.
```

Interpretation:

```text
The purchase-assumptions side of Patch 4 is materially improved and should be preserved.
```

## What still failed

### 1. Current Debt still does not obey source truth

Extracted source text for `Current_Debt_Stonebridge.pdf` clearly states:

```text
Stonebridge Lofts - Existing Current Debt Statement
This is an existing/current debt context document.
Current Outstanding Balance: $6,800,000
Interest Rate: 4.85%
Amortization Remaining: 24 years
Monthly Payment: $39,250
Maturity Date: 2029-11-01
```

But the visible PDF still says:

```text
Uploaded Existing Debt Context
No verified current debt context was provided.

Current debt context uploaded: No
```

And Document Treatment still lists the file as:

```text
Current_Debt_Stonebridge.pdf
Document Role: Other Support Document
Treatment: Context only
Use: Listed for auditability only; not used quantitatively.
```

Artifact evidence shows the parser/authority route still misclassified this file:

```text
inferred_doc_type: loan_term_sheet
semantic_doc_role: purchase_assumptions
semantic_doc_display_label: Purchase Assumptions / Acquisition Context
explicit_current_debt_proof: false
mixed_financing_signals: true
```

Interpretation:

```text
Current Debt authority is still not obeying extracted source text.
The source text is clear; the system is still allowing stale/incorrect financing-role inference to outrank explicit current-debt proof.
```

### 2. Structured Reno Plan still does not obey source truth

Extracted source text for `Stonebridge_Reno_Plan.pdf` clearly states:

```text
Stonebridge Lofts - Structured Renovation / CapEx Plan
This is a structured forward-looking renovation / CapEx plan.
It provides budget, unit scope, stated rent lift, and phasing as source facts.
Total Renovation Budget: $1,280,000
1BR Interiors: 20 units x $18,500/unit; expected rent lift $225/month; Months 1-18
2BR Interiors: 18 units x $24,000/unit; expected rent lift $325/month; Months 1-24
Common Area Refresh: $210,000
Exterior / Security: $115,000
Contingency: $153,000
```

But the visible PDF still says:

```text
Uploaded Renovation / CapEx Document:
Renovation/CapEx support was received. No verified forward-looking renovation budget, rent-lift assumptions, ROI, payback, or implementation schedule was provided; therefore renovation returns were not assessed.
```

And Document Treatment still lists the file as:

```text
Stonebridge_Reno_Plan.pdf
Document Role: Other Support Document
Treatment: Context only
Use: Listed for auditability only; not used quantitatively.
```

Artifact evidence shows the file was still routed through rent-roll failure/recovery paths:

```text
rent_roll_parse_error for Stonebridge_Reno_Plan.pdf
ai_rent_roll_recovery_diagnostic attempted: true
final_outcome: validation_rejected
inferred_doc_type: rent_roll
```

Interpretation:

```text
Structured Reno Plan authority is still not sovereign.
The system correctly extracted the renovation text, but a rent-roll/recovery or generic-support path still bypassed the final structured renovation treatment.
```

### 3. Report-contract QA now sees a problem, but the authority system is still not hard enough

RETEST 2 artifacts show:

```text
report_contract_qa: warn
violations: ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT
severity: high
customer_delivery_ready: true
delivery_conformance_source: legacy_fallback_only
canonical_delivery_state_present: false
```

This is progress compared to prior zero-violation passes, but it is still not enough.

Current interpretation:

```text
QA is beginning to catch the debt-separation family, but visible authority contradictions still publish as advisory-only.
For Acquisition Memo launch quality, visible support-doc authority contradiction must not be treated as a harmless advisory.
```

## Updated root diagnosis

Patch 4 did not fail everywhere.

It fixed or improved:

```text
Purchase assumptions / proposed acquisition financing source recognition.
Purchase price / NOI basis / going-in cap acquisition context rendering.
Proposed acquisition financing checklist status.
```

But it did not finish:

```text
Current Debt source-text authority.
Structured Reno Plan source-text authority.
QA hard-fail / contract enforcement for visible authority contradiction.
```

Controlling root issue:

```text
InvestorIQ still has a support-doc authority helper, not a fully sovereign support-doc authority regime.
```

A true regime means:

```text
1. One uploaded support file receives one canonical role/treatment/use decision.
2. Explicit extracted source text can override polluted parser semantics.
3. Renderers consume only that canonical decision for visible Document Treatment / Financing Readiness / Reno acknowledgement.
4. Report-contract QA fails when visible output contradicts canonical support-doc authority.
5. Legacy/fallback paths cannot remain live authority when canonical authority exists.
```

## Updated launch posture

```text
Screening:
Launchable / founder-beta ready from current evidence.

Acquisition Memo:
Not launch-cleared.
Core math, publish path, V2 containment, and purchase assumptions have improved.
However, Current Debt and Structured Reno Plan authority failures remain customer-visible and launch-blocking for the Acquisition Memo product promise.

Full Underwriting V2:
Still deferred.
```

## Current safest interpretation for Rob

Do not treat this as the whole system collapsing.

The report still proved major strengths:

```text
Core math held.
T12/Rent Roll parsing held.
Report published.
Source Reconciliation Disclosure worked.
No DSCR/refi/DCF/waterfall/equity return/deal score/final recommendation leaked.
Purchase assumptions improved materially.
```

But do treat this as a real launch blocker for Acquisition Memo:

```text
The AI boss is not fully obeyed yet.
Current Debt and Reno Plan still have disobedient support-doc paths.
```

## Immediate next action after docs update

Do not issue another Codex prompt until Rob is ready.

When work resumes, the next patch must be strictly bounded to:

```text
1. Current_Debt_Stonebridge-style explicit current-debt source text outranking purchase/acquisition/loan-term fallback.
2. Stonebridge_Reno_Plan-style structured renovation source text outranking rent-roll recovery and generic support fallback.
3. Contract QA escalation when visible Document Treatment / Financing Readiness contradict canonical support-doc authority.
```

Do not broaden into:

```text
Screening
T12/Rent Roll core math
delivery gate doctrine except visible authority contradiction handling if truly necessary
credit/payment/access
pricing/Stripe
SQL/RPC/Supabase
Dashboard
DocRaptor config
auth/upload gates
Full Underwriting V2 surfaces
```

## Fresh continuation point

Resume from here:

```text
Final Attack Test 8 RETEST 2 was a valid retest on runtime SHA f88d9a9b6430a1af0043213a28b678d5e0c03819.
Purchase assumptions improved and should be preserved.
Current Debt still renders as Other Support / No verified current debt context despite explicit current-debt source text.
Structured Reno Plan still renders as Other Support / no verified forward-looking renovation budget despite explicit structured Reno/CapEx source text.
Report-contract QA now flags a high current-debt separation violation, but it remains advisory and legacy-fallback-sourced.
Acquisition Memo is not launch-cleared.
Next work should be a narrow Current Debt + Reno authority enforcement patch only, when Rob is ready.
```

---

# June 10, 2026 Session Closeout Addendum - Seven-Test Batch, Patches 1-3, Claude V2 Architecture Notes, and Final Attack Test 8

## Current emotional / execution context

Rob is stepping away after a long launch-hardening session.

Important context:

```text
The latest tests are still revealing issues, but the pattern is no longer "the whole system is collapsing."
The core T12/Rent Roll math, publish/fail behavior, V2 containment, and disclosure discipline are repeatedly holding.
The newly exposed issues are concentrated around support-document role routing, acquisition assumptions extraction, current debt extraction, structured renovation routing, and advisory/legacy artifact cleanliness.
```

Do not let the next session reopen broad panic-driven audits by default.

The correct interpretation is:

```text
InvestorIQ is in final root-hardening, not rebuild.
Each new test is exposing narrower edge seams because the core engine is now strong enough for deeper adversarial packages.
```

## Today’s 7-test batch final result

A seven-report live test batch was reviewed under the June 10 ELITE Launch Doctrine.

Final batch outcome:

```text
Tests 1-4: customer-facing PASS with disclosure; repeated internal rent-roll canonical QA drift found.
Test 5: correct fail-closed for unusable/bad rent roll.
Test 6: correct fail-closed for financially impossible 10x T12/Rent Roll mismatch.
Test 7: exact PASS against expected controlled source-reconciliation contract.
```

Batch-level interpretation:

```text
Core operating math generally held.
Valid messy reports published with disclosure.
True invalid-core cases failed closed with credit restoration.
No dangerous V2 leakage appeared.
Debt/proposed financing separation generally held in customer-facing PDFs.
The confirmed blocker was not visible rent math; it was internal QA/canonical source authority drift.
```

## Patch 1 completed - Rent-roll canonical QA drift

Codex patch receipt summary:

```text
Files changed:
- api/_lib/report-contract-qa.js
- tests/qa/report-contract-qa-smoke.js

Root cause:
- report-contract-qa had its own annual market rent selector that trusted summary totals first.
- Polluted canonical summary values could beat the row/unit-derived market rent used by the renderer.

Fix:
- Contract QA now uses shared resolveCanonicalRentRollAnnualTotals(...) authority from api/_lib/report-surface-contracts.js.
- Regression added for polluted summary total where row/unit-derived annual market rent is correct.
- True mismatch case still fails.

Tests run:
- node --check api/_lib/report-contract-qa.js
- node --check tests/qa/report-contract-qa-smoke.js
- node tests/qa/report-contract-qa-smoke.js
- node tests/qa/generate-client-report-rent-roll-smoke.js
- git diff --check

Safe to commit: yes.
```

Interpretation:

```text
This fixed the confirmed Tests 1-4 launch blocker without touching customer-facing renderer math.
```

## Patch 2 completed - Renovation / CapEx document treatment

Codex patch receipt summary:

```text
Files changed:
- api/generate-client-report.js
- tests/qa/generate-client-report-rent-roll-smoke.js

Root cause:
- Renovation / CapEx docs were detected but structured forward-looking cases fell through to generic acknowledgement copy and generic treatment labels.

Fix:
- Added differentiated renovation acknowledgement path in buildDocumentTreatmentSummaryHtml.
- Budget-only docs now acknowledge budget/scope while stating rent lift / ROI / payback / phasing were not provided.
- Structured forward-looking docs now say budget, rent-lift assumptions, and phasing were received and are displayed for source transparency only.
- Structured rows render as Structured Renovation / CapEx Plan with Structured renovation / CapEx context.
- No ROI, payback, NOI impact, valuation, refinance, DCF, waterfall, or final recommendation logic added.

Tests run:
- node --check api/generate-client-report.js
- node --check tests/qa/generate-client-report-rent-roll-smoke.js
- node tests/qa/generate-client-report-rent-roll-smoke.js
- git diff --check

Safe to commit: yes.
```

Interpretation:

```text
This fixed a bounded source-treatment miss from Tests 3-4, but Final Attack Test 8 later proved the live routing path can still misroute some Reno Plan PDFs into rent-roll/recovery handling before the new treatment display path gets authority.
```

## Patch 3 completed - QA advisory calibration / stale public-sample noise cleanup

Codex patch receipt summary:

```text
Files changed:
- api/_lib/source-report-coverage-qa.js
- api/_lib/qa-action-plan.js
- tests/qa/qa-action-plan-smoke.js

Root cause:
- Source coverage QA was still emitting public_sample_blocker for reconciliation and underwriting-depth noise.
- QA action-plan rollup still surfaced legacy public/high-value fields in ways that looked like active readiness authority.

Fix:
- Noisy source-coverage findings rerouted to advisory_only or render_gating_gap instead of public_sample_blocker.
- DocRaptor kept in distribution_config_blocked only.
- Legacy public/high-value fields preserved as compatibility metadata, while active routing now uses elite/distribution language.

Tests run:
- node --check api/_lib/source-report-coverage-qa.js
- node --check api/_lib/qa-action-plan.js
- node --check tests/qa/qa-action-plan-smoke.js
- node --check tests/qa/source-report-coverage-qa-smoke.js
- node tests/qa/source-report-coverage-qa-smoke.js
- node tests/qa/qa-action-plan-smoke.js
- node tests/qa/qa-fix-routing-smoke.js
- node tests/qa/report-contract-qa-smoke.js
- node tests/qa/acquisition-financing-field-limited-smoke.js
- node tests/qa/source-package-cap-rate-rounding-smoke.js
- git diff --check

Safe to commit: yes.
```

Interpretation:

```text
Patch 3 improved advisory/action-plan authority cleanliness without changing customer math, delivery doctrine, payment/access, or report rendering.
```

## Claude V2 architecture verdict recorded

Claude reviewed the codebase and gave a useful Full Underwriting V2 interpretation.

Key takeaway:

```text
The codebase is fundamentally well-designed and does not need a rewrite.
The remaining issues are source-authority alignment, support-doc routing, acquisition triangle hardening, and regression-suite coverage.
```

Claude’s specific V2 notes to preserve:

```text
1. RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT root cause:
   - resolveCanonicalRentRollAnnualMetric / resolveCanonicalRentRollAnnualTotals has multi-candidate selection.
   - QA and renderer can diverge if they independently recompute canonical values from artifacts captured at slightly different moments or with different summary-row trust flags.
   - Patch 1 addressed the launch problem by making contract QA use the shared canonical authority.
   - Future V2 strengthening: renderer should write selected canonical rent-roll values and selected_reason/provenance to the QA artifact, and QA should read the exact rendered authority instead of recomputing.

2. Section eligibility architecture is clean:
   - buildFullUnderwritingSectionEligibility and UNDERWRITING_SECTION_BLUEPRINTS are a good architecture.
   - DCF/advanced modeling often being source_constrained when verified current debt is absent is correct behavior, not a bug.
   - V2 should add fixture-based section eligibility tests, not rewrite the section architecture.

3. Current debt assessment copy is already canonicalized:
   - formatCurrentDebtAssessmentCopy uses reason-code switch behavior.
   - If phrase variants recur, likely QA is checking a different path rather than renderer creating new variants.

4. sanitizeFinalCustomerHtml is not missing logic:
   - Hidden-character sanitization exists.
   - Prior issue was stage order: QA could run before final HTML sanitization.

5. Acquisition triangle is the genuinely complex V2 path:
   - loan term sheet normalizer does regex extraction of purchase price, LTV, loan amount, rate, amortization, fees.
   - This is the most variant-prone path.
   - Acquisition Memo can stay conservative; Full Underwriting V2 needs deliberate acquisition-triangle fixtures.
```

Claude’s recommended V2 PRs:

```text
V2 PR A - Renderer-selected canonical rent-roll value/provenance write-through.
V2 PR B - Acquisition triangle text-extraction fixture suite and hardening.
V2 PR C - Section eligibility smoke-test suite covering source package shapes.
```

InvestorIQ interpretation:

```text
Do not reopen Full Underwriting V2 before launch.
Use Claude’s notes as V2 roadmap, not launch-blocking work unless the same family affects Acquisition Memo launch.
```

## Final Attack Test 8 - Stonebridge Lofts result

Rob ran a newly generated unseen attack package using XLSX T12/Rent Roll plus multiple support PDFs.

Package design:

```text
T12 + Rent Roll were valid XLSX files.
Support docs included purchase/proposed acquisition assumptions, appraisal summary, current debt statement, structured renovation plan, market survey, and Phase I ESA.
```

Customer-facing PDF result:

```text
PASS with disclosure / safe but incomplete.
```

What passed:

```text
Report published.
Core math passed.
XLSX T12 and XLSX Rent Roll parsing worked.
Rent-roll canonical drift did not recur.
Report contract QA passed with zero violations.
No DSCR/refi/DCF/waterfall/equity return/deal score/final recommendation leaked.
Appraisal did not override purchase price, T12 NOI, or Rent Roll market rent.
Market survey did not inflate rent roll market rents.
```

Expected rendered values that passed:

```text
Units: 64
Occupancy: 93.8%
Annual In-Place Rent: $1,432,800
Annual Market Rent: $1,718,400
Annual Rent Upside: $285,600
Rent Gap: 19.9%
EGI: $1,500,000
OpEx: $555,000
NOI: $945,000
Expense Ratio: 37.0%
NOI Margin: 63.0%
Break-Even Occupancy: 37.0%
```

Critical support-doc failures exposed:

```text
1. Purchase Assumptions / Proposed Acquisition Financing was not recognized correctly.
   Source included purchase price $13,500,000, NOI basis $945,000, going-in cap 7.00%, proposed acquisition loan $9,450,000, LTV 70.0%, rate 5.95%, amortization 30 years, lender fee 0.85%.
   PDF incorrectly said Purchase assumptions provided: No, Proposed acquisition loan terms complete: No, and Proposed Acquisition Financing: Not source-complete / not modeled.
   Artifact parsed Stonebridge_Assumptions.pdf as mortgage_statement_parsed with rate/amortization but no loan amount, and bizarre semantic_doc_role environmental_due_diligence.

2. Current Debt Statement was not recognized.
   Source included current outstanding balance $6,800,000, rate 4.85%, amortization remaining 24 years, monthly payment $39,250, maturity 2029-11-01.
   PDF incorrectly said No verified current debt context was provided and listed the file as Other Support Document / context only.

3. Structured Reno Plan treatment failed on the live route despite Patch 2.
   Source included total budget $1,280,000, 1BR and 2BR unit scopes, rent lifts, and phasing.
   PDF incorrectly said no verified forward-looking renovation budget/rent-lift/phasing was provided.
   Document Treatment labeled Stonebridge_Reno_Plan.pdf as Rent Roll / Context only, saying rent-roll support was displayed only.
```

Final Attack Test 8 verdict:

```text
Customer-facing PDF: PASS WITH DISCLOSURE / SAFE BUT INCOMPLETE.
Core math: PASS.
Publish/fail doctrine: PASS.
V2 containment: PASS.
Acquisition Memo product quality: FAIL / SUPPORT-DOC INTELLIGENCE BLOCKER.
System/QA trust: WATCHLIST.
```

## Why more issues keep appearing

Record this explanation for future emotional context:

```text
Every new attack test is not proving the whole system is broken.
It is expanding the source-package shape space.
Earlier tests were exposing core math, delivery, and V2 leakage.
Those are now mostly holding.
The new failures are concentrated in support-document role routing and acquisition-context intelligence, which only show up when a package includes overlapping debt, proposed financing, appraisal, market survey, renovation, and environmental documents.
```

Current root pattern:

```text
The core report engine is stronger than before.
The support-doc routing/classification layer still has too many competing interpretations before final Document Treatment / Financing Readiness consumes the docs.
```

## New Patch 4 needed - Support Document Role Routing / Acquisition Context / Reno Path Fix

Next Codex patch should be Patch 4, not a broad audit.

Patch 4 target:

```text
Support-document role routing and bounded acquisition-context extraction for Acquisition Memo.
```

Likely affected seams:

```text
support-doc classifier / role routing
support-doc parser dispatch
acquisition assumptions extraction / proposed acquisition financing extraction
current debt extraction and separation from proposed financing
renovation / CapEx plan routing into structured renovation treatment
Document Treatment Summary final row authority
Preliminary Financing Readiness Summary consumption of validated support-doc facts
QA/action-plan calibration for support-doc routing gaps
```

Patch 4 must not touch:

```text
core T12/Rent Roll math
rent-roll row-derived canonical math
delivery gate doctrine
credit/payment/access
DSCR/refi/DCF/waterfall/deal-score/final recommendation/V2 surfaces
pricing/Stripe/SQL/routes/DocRaptor production config
```

Patch 4 acceptance criteria:

```text
1. Purchase/proposed acquisition assumptions doc with explicit purchase price, proposed loan, LTV, rate, amortization, and fee routes as Purchase Assumptions / Proposed Acquisition Financing Context, not mortgage/current debt/environmental.
2. Current debt statement with explicit outstanding balance, rate, amortization/payment/maturity routes as Existing/Current Debt Context, not Other Support Document.
3. Structured renovation plan with budget/rent lift/phasing routes as Structured Renovation / CapEx Plan, not Rent Roll.
4. Support docs remain bounded/context-only or limited-use; no ROI/payback/NOI impact/value impact/refi/DCF/waterfall/recommendation unlocked.
5. Market survey remains context only and does not override Rent Roll.
6. Appraisal remains valuation context and does not override purchase price/T12 NOI/Rent Roll.
7. Preliminary Financing Readiness Summary reflects validated purchase assumptions/current debt/proposed acquisition terms where source-complete.
8. Incomplete support docs still collapse or qualify instead of blocking core-valid report.
9. Report contract QA or smoke tests catch wrong visible Document Treatment role for these source shapes.
10. Final Attack Test 8-style package becomes a regression fixture.
```

## Updated launch posture after Final Attack Test 8

```text
Screening Report: still launchable / founder-beta ready, subject to final launch smoke and website/checkout/DocRaptor/security/payment polish.

Acquisition Memo: not launch-cleared after Attack Test 8. Core math/delivery/V2 containment are strong, but support-doc role routing is not yet ELITE enough for the product promise.

Full Underwriting V2.0: still deferred. Claude’s PR A/B/C roadmap recorded for later.
```

## Immediate next-session continuation point

Resume from here:

```text
June 10 session closeout.
Patches 1-3 are safe to commit and should be committed separately if not already.
Final Attack Test 8 exposed Patch 4: support-document role routing / acquisition assumptions / current debt / structured Reno Plan path.
Do not run another random test before Patch 4.
Do not ask for a broad audit.
Use a targeted Patch 4 Codex prompt based on Attack Test 8.
After Patch 4, rerun Final Attack Test 8 package as regression.
Then update docs again and reassess Acquisition Memo launch readiness.
```

## Guardrails for next session

```text
Keep prompts compact.
Bundle only by same subsystem/file seam.
No broad repo audit unless Patch 4 reveals unknown authority conflict that cannot be scoped.
No report-specific hardcoding.
No new Vercel routes.
No SQL/Stripe/pricing changes.
No DocRaptor production flip yet.
Do not reopen Full Underwriting V2 surfaces.
Do not let support docs override T12/Rent Roll core truth.
Do not let proposed acquisition financing become current debt or refinance logic.
```

---

# June 10, 2026 Addendum - InvestorIQ Learning Loop Doctrine / No Silent Financial Mutation

## Current controlling decision

InvestorIQ should become more intelligent from every controlled test and every future live report, but it must not silently change customer-facing financial truth.

The learning system is allowed to improve diagnostics, issue clustering, QA calibration, source-package scoring, regression recommendations, and future patch proposals.

The learning system is not allowed to silently mutate deterministic financial outputs, source-bound values, delivery authority, credit/payment/access state, or customer-facing calculations.

Controlling rule:

```text
InvestorIQ may learn from test and live-report outcomes, but any learned rule that can affect customer-facing financial outputs must be promoted through human-approved deterministic code, regression tests, and commit review before it can affect production reports.
```

## Three-zone learning architecture

### 1. Locked deterministic calculation engine

This layer remains sacred and must not self-learn or self-mutate.

It owns:

```text
NOI
EGI
Gross rental income
Other income
Operating expenses
Expense ratio
NOI margin
Break-even occupancy
Occupancy
Annual in-place rent
Annual market rent
Annual rent upside
Rent gap %
Per-unit metrics
Cap-rate value math
Price per unit
NOI per unit
Current debt context values
Proposed acquisition financing values when explicitly source-complete
Delivery/fail-closed/customer-credit/payment/access authority
```

Permitted change path:

```text
human red-pen decision -> deterministic rule proposal -> Codex/code patch -> regression test -> review -> commit -> future reports
```

Forbidden change path:

```text
test observation -> AI silently changes numbers in a future report
```

### 2. Learning ledger / feedback memory

Every meaningful test and future live report should produce structured learning records.

Minimum learning event fields:

```text
report_id / job_id
report_type
source_package_family
issue_code
human_red_pen_decision
severity
launch_blocker: yes/no
customer_visible: yes/no
math_affected: yes/no
source_binding_affected: yes/no
root_cause_family
recommended_owner_area
patch_required: yes/no
regression_required: yes/no
final_disposition
notes
```

Allowed human red-pen dispositions:

```text
true_launch_blocker
true_bug_non_launch_blocker
qa_false_positive
correct_conservative_disclosure
source_limitation_correctly_handled
support_doc_containment_pass
v2_surface_leak
current_debt_proposed_financing_contamination
renderer_or_pdf_polish
admin_dashboard_diagnostic_polish
post_launch_backlog
ignore_for_now
```

### 3. Recommendation / QA intelligence layer

This layer may use prior learning records to make the system smarter without touching customer financial outputs.

Allowed uses:

```text
cluster repeated issue families;
identify repeated QA false positives;
recommend focused Codex prompts;
recommend regression tests;
rank issues as Tier 1, Tier 2, or Tier 3;
warn when a live report resembles a prior failure pattern;
recommend whether an issue is parser, renderer, QA contract, source limitation, distribution config, or admin diagnostic;
prepare V2 eligibility intelligence from Acquisition Memo patterns.
```

Forbidden uses:

```text
change NOI, rent, cap-rate value, debt, DSCR, financing, delivery, credit, payment, or access outputs without a deterministic patch;
override T12/Rent Roll/source-bound values because a prior test looked similar;
suppress a real customer-visible math issue because a previous issue was a false positive;
mark a report deliverable or failed based only on learned similarity;
create new modeled outputs from unsupported support documents.
```

## Test 1 / Test 2 learning signal recorded

The first two June 10 major tests created the first clear Learning Loop candidate.

Observed pattern:

```text
RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT fired in Test 1 and Test 2.
Customer-visible rendered annual market rent appeared mathematically correct from row/unit-mix rent-roll math.
Internal QA/canonical value appeared polluted by inflated summary totals.
```

Interpretation:

```text
This is not yet proof of wrong customer-facing math.
It is a repeated QA/canonical-source-selection trust issue.
Treat as a Critical Watchlist / potential launch blocker if repeated across the 7-test batch.
Likely owner area: QA contract / rent-roll canonical source selection, not report renderer, unless a later test proves customer-visible math is wrong.
```

Correct learning classification for now:

```text
issue_code: RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT
human_red_pen_decision: qa_false_positive_pattern_candidate
severity: critical_watchlist
customer_visible_math_wrong: not proven
system_trust_affected: yes
patch_now: no, wait for all 7 tests unless it escalates into visible math defect
regression_required_if_patched: yes
```

## Startup launch discipline

Learning Loop doctrine does not mean pausing launch for every imperfect artifact.

Launch-blocking learning families are only those that can create Tier 1 failures:

```text
wrong math;
wrong source binding;
fabricated/inferred unsupported values;
current debt / proposed financing / refi contamination;
unsafe V2 surface leakage;
customer lifecycle limbo;
false fail-closed or false publish;
credit/payment/access/security failure;
missing or misleading customer-facing limitations.
```

Tier 2 learning families can be captured for post-launch improvement:

```text
PDF spacing;
filename wrapping;
thin divider pages;
repetitive wording;
advisory QA noise;
admin diagnostic clarity;
optional support-doc summary depth;
public/sample/DocRaptor distribution polish.
```

## V2 Underwriting benefit

Acquisition Memo testing should become the training ground for Full Underwriting V2.0.

Every memo test can teach V2:

```text
which source packages are strong enough for debt sizing;
which fields are commonly missing for DSCR;
which support docs are safe context-only;
which support docs should never unlock modeled outputs;
which current-debt/proposed-financing combinations are dangerous;
which QA signals are reliable versus noisy;
which source gaps should create V2 eligibility constraints.
```

V2 should not inherit the old broad underwriting surfaces until the Learning Loop has enough source-package evidence and deterministic eligibility rules.

## Future implementation target

When launch pressure allows, add a persistent `learning_events` / `red_pen_review_events` table or artifact family.

Near-term manual version:

```text
During major test batches, record each issue in the docs as:
- Test number
- visible report issue
- artifact/QA issue
- launch-blocking status
- human decision
- owner area
- defer/patch decision
```

Longer-term product version:

```text
Every generated report creates structured diagnostics.
Human/Admin red-pen decisions attach dispositions.
Repeated patterns create recommended rules/regressions.
Only human-approved deterministic patches can affect financial outputs.
```

## Guardrail phrase

Use this phrase as the controlling shorthand:

```text
InvestorIQ learns for diagnostics and future rules; it does not silently learn new numbers.
```

---

# June 10, 2026 Addendum - Major Test Batch Running Log / Tests 1-2 Learning Notes

## Current batch status

Rob is running a 7-report major test batch under Ken Dunn red-pen review.

Instruction:

```text
Review all 7 tests first.
Do not patch after each individual report unless a catastrophic launch blocker appears.
Separate true launch blockers from Tier 2 polish.
Track repeated root patterns before asking Codex to patch.
```

## Test 1 - Maplewell Court

Customer-facing verdict:

```text
PASS with disclosure.
```

Key wins:

```text
Current debt was correctly treated as Uploaded Existing Debt Context.
Current debt did not become proposed acquisition financing.
Proposed Acquisition Financing correctly rendered as Not source-complete / not modeled.
Property tax support correctly corroborated the T12 property tax line and did not override T12 totals.
Source Reconciliation Disclosure was conservative and appropriate for the T12/Rent Roll income variance.
```

Critical watchlist:

```text
Internal QA/canonical rent-roll annual market rent drift fired with inflated canonical annual market rent while the rendered report appeared mathematically correct.
```

## Test 2 - Silvergate Manor

Customer-facing verdict:

```text
PASS with disclosure.
```

Key wins:

```text
Unsupported appraisal did not override cap-rate value framework.
Unsupported market survey did not override rent roll.
Unsupported Phase I ESA stayed environmental context-only and did not create modeled impact.
Historical CapEx stayed historical/context-only and did not create renovation ROI, payback, rent-lift, or forward budget outputs.
Broker email did not override structured T12/Rent Roll source authority.
No current debt and no proposed acquisition loan terms correctly rendered as no verified current debt context and Not source-complete / not modeled proposed acquisition financing.
```

Critical watchlist escalation:

```text
RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT repeated in Test 2.
Rendered annual market rent again appeared correct from row/unit-mix math.
Internal QA/canonical market rent again appeared inflated by bad summary-total acceptance.
This is now a pattern to evaluate after all 7 tests.
```

## Current master watchlist after Tests 1-2

```text
1. RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT repeated as likely QA/canonical-source-selection issue.
   Status: Critical Watchlist / potential launch blocker if repeated.
   Patch timing: wait for all 7 tests unless customer-visible math is proven wrong.
   Likely owner: report_contract_qa / rent-roll canonical source selection.
```

## Current non-blocking observations after Tests 1-2

```text
DocRaptor test mode remains distribution/public-sample config only.
Filename wrapping remains PDF polish.
Thin divider page before financing readiness remains polish.
Repetitive disclosure language remains polish unless it becomes misleading.
```

---

# June 10, 2026 Addendum - Launch Doctrine / ELITE vs Not-Yet-ELITE Checkpoint After Acquisition Memo 15/16 + 124 Richmond Clean/Messy Tests

## Current controlling interpretation

InvestorIQ is no longer trying to make every optional surface perfect before launch.

The controlling launch doctrine is now:

```text
InvestorIQ may launch when every published report is mathematically correct, source-bound, non-fabricated, properly qualified, and customer-deliverable.

InvestorIQ does not need every optional or advanced section to be complete before launch.

If an optional or advanced input is incomplete, unsupported, ambiguous, or unsafe, the correct behavior is to omit, collapse, qualify, disclose, or route it to admin diagnostics — not to block the entire report and not to invent a conclusion.
```

This checkpoint distinguishes between:

```text
Tier 1 = must be ELITE / launch-blocking if wrong.
Tier 2 = should be good, but can be patched post-launch if the report remains honest, conservative, and customer-deliverable.
Tier 3 = normal post-launch iteration.
```

## Report evidence behind this checkpoint

Recent tested reports / packages reviewed:

```text
Acquisition Memo 15 - CLEAN
Acquisition Memo 16 - CLEAN / swapped-slot stress test
124 Richmond - MESSY
124 Richmond - CLEAN
```

Current interpretation:

```text
Acquisition Memo 15 / 16:
- Customer-facing PDF passed core math, document treatment, financing-readiness limitation handling, and V2-leak prevention.
- Swapped-slot stress test confirmed content authority over upload-slot assumptions.
- Internal QA still had advisory/routing calibration work, which has since been patched in qa-fix-routing.

124 Richmond MESSY:
- Not a bust.
- Core parsing survived messy documents.
- Customer-facing PDF remained coherent and conservative.
- Unsupported support docs stayed context-only.

124 Richmond CLEAN:
- Not a bust.
- Core parsing and customer-facing operating math passed.
- Clean proposed acquisition financing was parsed/validated but not yet safely rendered as proposed-financing context.
- This exposed a generalized Acquisition Memo financing-context render contract gap, not a report-specific bug.
```

## Tier 1 launch-blocking doctrine

These items must be ELITE before launch because failures create legal, trust, refund, or customer-reliance risk.

### 1. Core math and calculations

Must be correct:

```text
EGI
Gross rental income
Other income
Operating expenses
NOI
Expense ratio
NOI margin
Break-even occupancy
Occupancy
Annual in-place rent
Annual market rent
Annual rent upside
Rent gap %
Per-unit metrics
Cap-rate value math
Price per unit
NOI per unit
```

Current status:

```text
ELITE / regression-watch.
```

Recent tests consistently carried core math through the report surfaces, including 124 Richmond CLEAN and MESSY.

### 2. T12 and Rent Roll core parsing

Must be correct:

```text
T12 parses to EGI / OpEx / NOI.
Rent Roll parses to units / occupancy / in-place rent / market rent.
Core valid documents must publish.
Core invalid/unusable documents must fail closed or be blocked at upload/server gate.
```

Current status:

```text
ELITE.
```

Validated across clean spreadsheets, messy packages, narrative/AI-recovery style tests, and swapped-slot stress testing.

### 3. Source-to-output binding

Must be perfect:

```text
T12 controls operating income / expenses / NOI.
Rent Roll controls units / occupancy / in-place rent / market rent.
Property tax support only corroborates tax support and must not override T12 totals.
Appraisal / market survey / offering summary / Phase I / zoning / CapEx must not override deterministic core values unless explicitly validated for a specific allowed use.
Debt terms must not become current debt unless they are true existing/current debt.
Proposed acquisition financing must not become refinance/current debt.
```

Current status:

```text
ELITE for T12/Rent Roll and support-doc containment.
Good / patch-in-progress for proposed acquisition financing render behavior.
```

### 4. No fabricated or inferred financial facts

Must never fabricate:

```text
purchase price
loan amount
interest rate
amortization
debt service
DSCR
market rent
cap rate
appraised value
renovation budget
rent lift
ROI
payback
current debt balance
NOI
expense totals
occupancy
```

Current status:

```text
Near ELITE.
```

Recent tests showed conservative omission/qualification rather than fabrication. The remaining clean-financing issue is over-omission, not hallucination.

### 5. Correct fail-closed behavior for core documents

Must be perfect:

```text
Missing/unusable T12 -> fail closed or blocked before generation.
Missing/unusable Rent Roll -> fail closed or blocked before generation.
Core-valid jobs publish unless true runtime/storage/PDF/catastrophic failure prevents safe generation.
No customer admin-review limbo.
No needs-documents loop for active jobs.
Credit restored only for true core failure or true platform/runtime fatal.
```

Current status:

```text
Mostly ELITE for valid-core publish path.
Continue invalid-core/server-gate regression before full launch.
```

### 6. No dangerous V2 leakage in launch products

Acquisition Memo must not render unsupported advanced underwriting surfaces:

```text
DSCR conclusions
current-debt DSCR
refinance proceeds
refinance sufficiency / stress
DCF
waterfall
equity return
deal score
BUY / SELL / HOLD
final recommendation
loan approval / lender commitment / credit decision language
```

Current status:

```text
ELITE in recent customer-facing PDFs.
```

### 7. Debt / proposed acquisition financing / current debt separation

Must be perfect:

```text
Current debt = actual existing/outstanding debt.
Proposed acquisition financing = proposed/acquisition terms only.
Refinance logic must not use proposed acquisition financing.
Acquisition loan amount must not become purchase price.
Purchase price must not become loan amount.
Indicative terms must remain indicative.
```

Current status:

```text
Good but not fully ELITE yet.
```

Customer-facing PDFs are no longer contaminating proposed financing into current debt/refi outputs. Remaining root work is the bounded Proposed Acquisition Financing Context render path and corresponding contract QA calibration.

### 8. Report classification must not mislead

Must be conservative and non-promotional:

```text
Stable
Sensitized
Fragile
Review - Source Reconciliation Disclosure
Review - Insufficient Core Support
Review - Debt Coverage Constraint, only where actually applicable
```

Must not imply:

```text
approved
safe deal
good investment
pass/fail investment recommendation
```

Current status:

```text
Good / launch-safe, keep regression tests.
```

### 9. Disclaimers and limitation language

Must be present and clear:

```text
document-backed
framework-constrained
not loan approval
not lender commitment
not investment / legal / tax advice
missing values omitted rather than inferred
unsupported docs context-only
advanced sections deferred unless verified and in scope
```

Current status:

```text
ELITE.
```

### 10. Delivery lifecycle / payment / access basics

Must be correct:

```text
Report publishes or fails closed with clear reason.
No admin-review customer limbo.
No report marked ready when PDF is missing.
Credits/payment must not double-spend or silently disappear.
Users must not access other users' reports.
Download/storage paths must remain owner/admin protected.
```

Current status:

```text
Valid-core publish path is ELITE in recent tests.
Security/payment/access must receive final launch smoke before public launch.
```

## Tier 2 important but not launch-blocking if Tier 1 remains true

These are important, but can be patched post-launch if the report remains honest, conservative, and customer-deliverable.

```text
PDF spacing / layout polish
long filename wrapping
thin pages / divider pages
some duplicate/awkward wording
conservative omission of optional support details
optional CapEx summary depth
optional appraisal / market survey summary depth
admin dashboard diagnostic polish
advisory QA false positives/noise
DocRaptor test-mode distribution configuration during internal/founder beta
```

Current Tier 2 status summary:

```text
PDF structure / report completeness: good, improving.
Document Treatment Summary: near ELITE from doctrine/safety standpoint; filename wrapping remains cosmetic.
Advisory QA diagnostics: useful but noisy; public/high-value/Ken vocabulary cleanup mostly patched but some old manager artifacts may still appear until fully refreshed.
Optional support-doc summaries: launch-safe, not elite.
CapEx / renovation handling: launch-safe and conservative.
Appraisal / market survey handling: ELITE for containment, optional summary polish later.
```

## Already ELITE list

The system is already ELITE or effectively ELITE in these areas based on recent tests:

```text
1. T12/Rent Roll core parsing across clean, messy, narrative/recovery, and swapped-slot tests.
2. Core operating math: EGI, OpEx, NOI, expense ratio, NOI margin, break-even occupancy.
3. Rent roll math: units, occupancy, in-place rent, market rent, rent upside, rent gap.
4. Core source binding: T12 and Rent Roll control modeled operating outputs.
5. Unsupported support-doc containment: Phase I, zoning, appraisal, market survey, offering summary, unsupported CapEx.
6. Property tax corroborating support treatment.
7. No dangerous V2 leakage in recent Acquisition Memo PDFs.
8. Conservative omission/qualification of missing or incomplete data.
9. Customer-facing limitation/disclaimer language.
10. Valid-core publish path.
```

## Not yet ELITE / bounded root work still open

These are the current bounded root issues, not proof that the system is broken:

```text
1. Proposed Acquisition Financing Context render path when clean proposed financing terms are validated.
2. Current debt vs proposed acquisition financing contract QA calibration after that render path is added.
3. REPORT_TYPE_SECTION_LEAK detector calibration for valid Acquisition Memo sections.
4. Advisory QA vocabulary/noise cleanup in all manager/action artifacts.
5. Admin dashboard diagnostic clarity.
6. Final invalid-core/server-gate/payment/access smoke before full public launch.
```

## Current Codex work in progress

Codex is currently working on the generalized root-contract patch:

```text
Acquisition Memo proposed-financing context render path + current-debt/proposed-financing separation + report-contract QA calibration.
```

This is not a 124 Richmond report patch.

124 Richmond CLEAN is regression evidence only. The production invariant is:

```text
If validated proposed/acquisition financing context exists, the Acquisition Memo should render a bounded Proposed Acquisition Financing Context block.

If proposed financing is incomplete, keep Not source-complete / not modeled.

In both cases, do not open DSCR/refi/DCF/waterfall/deal-score/final-recommendation/V2 surfaces.
```

## Launch discipline from this checkpoint

Do not ask Codex for broad audits by default.

If an audit is needed, it must be limited to Tier 1 doctrine:

```text
Find only paths that can violate launch-blocking Tier 1 doctrine.
Do not list cosmetic issues.
Do not suggest product expansion.
Do not patch.
Return only launch-blocking root risks with file/function owners.
```

The launch bar is not perfection everywhere. The launch bar is:

```text
Core financial truth = ELITE.
Source binding = ELITE.
No fabrication = ELITE.
Unsafe/V2 surfaces closed = ELITE.
Delivery lifecycle honest = ELITE.
Optional completeness and polish can be patched through admin diagnostics after launch.
```

---

# June 8, 2026 Night Addendum - Acquisition Memo 13 Financing-Ready Checkpoint / Final Polish + Advisory Rounding Root Fix

## Current controlling status

InvestorIQ ended June 8 with the Acquisition Memo product direction materially validated.

Current report/product status:

```text
Screening Report:
Launchable / founder-beta ready.

Acquisition Memo:
Founder-beta / customer-deliverable and now credible for 1-150/200 unit financing conversations, pending one final retest after the latest polish and advisory QA rounding patch.

Full Underwriting V2.0:
Still deferred. This remains the institutional lender-credit-committee package for 250+ unit assets, multi-building deals, family office / Ken Dunn type users, and roughly $50M-$500M transactions.
```

Controlling product distinction:

```text
Acquisition Memo = financing-ready acquisition memo for serious lender discussions and acquisition financing requests on approximately 1-150/200 unit properties.

Full Underwriting V2.0 = institutional credit-committee package with full DSCR stack, debt sizing, DCF, waterfall, capital stack, integrations, lender/investor package, and advanced sensitivity analysis.
```

Do not reopen Full Underwriting V2 surfaces inside the launch Acquisition Memo.

## Acquisition Memo 12 root-render confirmation

The repeated Document Treatment contradiction finally tested clean.

The old failure was:

```text
purchase_assumptions_source.txt used correctly in the Acquisition Memo Summary for:
- Purchase Price $10,640,000
- Going-In Cap Rate 5.8%
- NOI Basis $611,800

but rendered incorrectly in Document Treatment as:
- Appraisal Context
- Context only
- Listed for auditability only; not used quantitatively
- Listed but Not Quantitatively Modeled
```

Acquisition Memo 12 proved the root-render fix:

```text
purchase_assumptions_source.txt rendered as:
Purchase Assumptions / Acquisition Context

It did not render as:
Appraisal Context
Context only
Listed for auditability only
Listed but Not Quantitatively Modeled
```

Interpretation:

```text
Final Document Treatment Summary same-file artifact precedence family is fixed in the tested path.
Validated acquisition / purchase-assumptions authority now beats stale appraisal metadata for the same source identity.
The visible PDF contradiction is no longer present.
```

This root family should be treated as closed after the next final retest confirms it remains stable after the financing-section patches.

## Acquisition Memo 13 result - 100-unit / lender-conversation test

Acquisition Memo 13 reached 17 pages and passed the practical "Ken Dunn 100-unit property test" / smaller-deal lender-conversation test.

Clarified meaning of the test:

```text
This is not the full Ken Dunn institutional $50M-$500M / 250+ unit credit-committee test.
This is the 50-150-ish / 1-150/200 unit Acquisition Memo financing-conversation test.
```

Verdict:

```text
Acquisition Memo 13 = PASS for founder-beta / customer-deliverable / 1-150/200 unit lender-conversation use, with minor polish.
Full institutional Ken Dunn test = not applicable until Full Underwriting V2.0.
```

Acquisition Memo 13 now gives lenders and borrowers a coherent first-pass package:

```text
property size
occupancy
T12 income / expenses / NOI
rent roll support
rent upside
purchase price
going-in cap rate
cap-rate value indication
uploaded existing debt context
source coverage
document treatment
what is verified, context-only, and not modeled
```

## Preliminary Financing Readiness Summary implemented

The new Acquisition Memo financing section was implemented and refined.

New section:

```text
Preliminary Financing Readiness Summary
```

Purpose:

```text
Make Acquisition Memo useful for 1-150/200 unit acquisition borrowers preparing lender discussions and acquisition financing requests, without implying loan approval or reopening V2 debt/refi/DCF surfaces.
```

Section structure now includes:

```text
1. Acquisition Request Context
   - Purchase Price
   - NOI Basis
   - Going-In Cap Rate
   - Units
   - Price per Unit
   - NOI per Unit

2. Operating Support
   - Effective Gross Income
   - Operating Expenses
   - NOI
   - Expense Ratio
   - NOI Margin
   - Occupancy
   - Break-Even Occupancy

3. Rent / Value Support
   - Annual In-Place Rent
   - Annual Market Rent
   - Annual Rent Upside
   - Rent Gap %
   - Implied Value at 5.0%, 6.0%, 7.0% cap rates
   - Document-derived cap-rate reference, if available

4. Debt / Financing Context
   - Uploaded Existing Debt Context, when verified:
     - Outstanding Balance
     - Interest Rate
     - Amortization
     - LTV
   - Proposed Acquisition Financing:
     - shown only if explicitly source-complete
     - otherwise: Not source-complete / not modeled

5. Lender Diligence Checklist
   - T12 verified: Yes / No
   - Rent Roll verified: Yes / No
   - Purchase assumptions provided: Yes / No
   - Property tax support: Yes / No
   - Current debt context uploaded: Yes / No
   - Proposed acquisition loan terms complete: Yes / No
   - Environmental / Phase I support: Context only / not modeled, when present
   - Appraisal support: Context only unless structured value exists, when present
   - CapEx / renovation plan: Context only unless verified budget and rent-lift assumptions exist, when present
```

Required note/caution remains:

```text
Shown for lender discussion and acquisition diligence support only. This Acquisition Memo organizes verified operating evidence, rent-positioning support, acquisition context, and uploaded financing context. It does not represent loan approval, lender commitment, refinance proceeds, full debt sizing, DCF, equity waterfall, or institutional credit-committee underwriting.
```

## Financing-section implementation sequence completed

### Slice 1 - New Acquisition Memo-only section

Files changed:

```text
api/generate-client-report.js
api/report-template-runtime.html
tests/qa/generate-client-report-rent-roll-smoke.js
```

Completed behavior:

```text
Added buildPreliminaryFinancingReadinessSummaryHtml(...)
Added Acquisition Memo-only template block
Wired section into v1_core Acquisition Memo final render path
Kept Screening unchanged
Kept old V2 debt/refi sections collapsed
Current debt shown only as Uploaded Existing Debt Context
Proposed acquisition financing separate and not derived from current debt
```

### Slice 2 - Lender-facing section hardening

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Completed behavior:

```text
Strengthened the Preliminary Financing Readiness Summary without reopening V2 debt math.
Existing/current debt remains disclosure-only under Uploaded Existing Debt Context.
Proposed acquisition financing collapses to Not source-complete / not modeled unless explicit source-complete proposed-financing language exists.
No proposed loan amount, debt service, DSCR, or debt sizing rendered in this slice.
Forbidden V2 and loan-approval language confirmed absent from visible HTML.
Screening regression confirms the section does not render in Screening.
```

Forbidden surfaces kept closed:

```text
DSCR
Current Debt DSCR
refinance proceeds
refinance stability
DCF
waterfall
equity return
deal score
final recommendation
BUY / SELL / HOLD
loan approval
lender commitment
financing approval
credit approval
Proposed Acquisition Debt Sizing
```

### Slice 3 - Tiny visible polish

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Completed behavior:

```text
Added Annual Rent Upside to Rent / Value Support.
Added Rent Gap % to Rent / Value Support.
Fixed duplicate Proposed Acquisition Financing label.
Removed duplicate/wrong Property tax support: Context only / not modeled row.
Property tax support now appears once as Yes / No.
Kept Screening unchanged.
Kept forbidden V2 surfaces closed.
```

Interpretation:

```text
The financing section should now feel like a credible Acquisition Memo section rather than a tiny debt-context note.
```

## Cap-rate advisory QA false-positive root fix completed

A final advisory/root cleanup fixed the cap-rate rounding false-positive class.

Problem:

```text
Source value: 5.75%
Customer report display: 5.8%

This is normal display rounding, not a real source-report contradiction.
The live source-package advisory layer could still flag it as source_report_inconsistency.
```

Root issue:

```text
Production advisory QA treated normal rounded percentage displays as source/report contradictions.
```

Files changed:

```text
api/_lib/source-package-qa.js
tests/qa/source-package-cap-rate-rounding-smoke.js
```

Production path fixed:

```text
filterSourcePackageFalsePositives(review, compactPayload)
isCapRateRoundingFalsePositive(finding, compactPayload)
```

Rounding rule:

```text
Cap-rate / percentage comparisons normalize to percentage points.
Values within 0.1 percentage points are treated as equivalent.
The filter is narrowly scoped to cap-rate / percentage source-report inconsistency findings.
```

Regression proof:

```text
source 5.75% vs rendered 5.8% -> no source_report_inconsistency
source 5.75% vs rendered 5.75% -> no source_report_inconsistency
source 5.75% vs rendered 6.5% -> still source_report_inconsistency
non-cap contradictions remain unaffected
```

Interpretation:

```text
This is a root-class advisory QA fix, not a test-report hack.
Do not hardcode Acquisition Memo 13, Harbourstone, purchase_assumptions_source.txt, 5.75, or 5.8 in production logic.
```

## Current report readiness assessment

No-BS readiness assessment as of this checkpoint:

```text
Screening Report:
8.5/10 launch readiness.
Launchable/founder-beta ready.

Acquisition Memo:
Approximately 8+/10 if the next final retest confirms the new financing section polish and advisory rounding fix.
Founder-beta/customer-deliverable.
Financing-conversation ready for 1-150/200 unit properties.
Not a loan approval package.
Not a Full Underwriting V2 institutional package.

Full Underwriting V2.0:
Do not launch.
Future premium product.
```

Current strongest product point:

```text
InvestorIQ now has document-treatment discipline:
it clearly separates what was used quantitatively, what was context-only, what was deferred, and what was not modeled.
```

Current remaining risk:

```text
Trust polish.
No visible contradictions.
No stale document treatment.
No false QA panic.
No awkward duplicate labels.
No V2 leakage.
No Summary-vs-Data-Coverage contradictions.
```

## Next action after this checkpoint

Do not do more tonight after committing the final cap-rate advisory patch and updating docs.

Next work session:

```text
Run ONE controlled Acquisition Memo retest using the same/source-family package.
```

Retest acceptance checklist:

```text
1. Preliminary Financing Readiness Summary appears and looks substantial.
2. Rent / Value Support includes Annual Rent Upside and Rent Gap %.
3. Proposed Acquisition Financing appears once as Not source-complete / not modeled when incomplete.
4. Lender Diligence Checklist has no duplicate Property tax support context-only row.
5. Uploaded Existing Debt Context appears only as debt context, not proposed acquisition financing.
6. purchase_assumptions_source.txt still renders as Purchase Assumptions / Acquisition Context.
7. No Appraisal Context / Context only contradiction for validated purchase assumptions.
8. No Listed but Not Quantitatively Modeled leak for validated purchase assumptions.
9. No V2 surfaces leak:
   - DSCR
   - Current Debt DSCR
   - refinance proceeds
   - refinance stability
   - DCF
   - waterfall
   - equity return
   - deal score
   - final recommendation
   - BUY / SELL / HOLD
10. Advisory QA should not false-flag 5.75% vs 5.8% cap-rate rounding.
11. Screening remains unchanged/protected.
```

If this retest passes:

```text
Acquisition Memo can be treated as founder-beta / customer-deliverable and financing-conversation ready for 1-150/200 unit acquisitions.
Next remaining launch work moves to final website/pricing/checkout/sample/DocRaptor/distribution polish, not report-core rescue.
```

## Guardrails going forward

Continue to enforce:

```text
micro-prompts only
no broad audits unless a real new root class appears
no report-specific production hacks
no hardcoded production filenames, property names, report IDs, or fixture-only values outside tests
no new API/serverless routes casually due to Vercel Hobby constraints
no pricing / Stripe / SQL / RPC changes during report-core polish
no DocRaptor production flip until final report confidence is confirmed
no public/Ken/sample distribution until DocRaptor production mode and public sample readiness are addressed
no public AI wording
no BUY / SELL / HOLD
no loan approval / lender commitment / financing approval / credit approval language
no reopening V2 debt/refi/DCF/waterfall/full debt sizing inside Acquisition Memo
```

## Fresh continuation point

Resume from here:

```text
June 8 night checkpoint.

Completed:
- Screening Memo 7 is launchable/founder-beta ready.
- Acquisition Memo 12 fixed the purchase-assumptions Document Treatment contradiction.
- Acquisition Memo 13 reached 17 pages and passed the 100-unit/lender-conversation test with minor polish.
- Preliminary Financing Readiness Summary has been implemented and polished.
- Cap-rate advisory QA rounding false-positive root fix is complete.
- Latest patches were safe to commit.

Next:
- Run ONE controlled Acquisition Memo retest.
- Upload PDF + artifacts.
- Review only the financing summary polish, Document Treatment stability, V2 leakage absence, and cap-rate QA rounding behavior.
- If clean, mark Acquisition Memo founder-beta/customer-deliverable and financing-conversation ready for 1-150/200 unit deals.
```

---


# June 8, 2026 Addendum - Acquisition Memo Financing-Ready Product Doctrine / Preliminary Financing Readiness Summary Locked

## Current controlling clarification

InvestorIQ Acquisition Memo is not merely a light debt-context memo.

The controlling product ladder is now:

```text
1. InvestorIQ Screening Report
   Purpose: help investors narrow a broad property search down to a few deals worth deeper diligence.
   Scope: T12 + Rent Roll operating triage, rent upside, operating quality, and source coverage.
   Not a financing memo or lender approval package.

2. InvestorIQ Acquisition Memo
   Purpose: financing-ready acquisition memo for approximately 1-150/200 unit properties.
   User outcome: help smaller and mid-market property investors organize the property story, operating support, NOI, rent upside, purchase basis, value indication, debt context, source coverage, and lender diligence gaps well enough to approach lenders and support acquisition financing conversations.
   It should be strong enough for users to show a lender when pursuing financing for a 1-150/200 unit acquisition, while avoiding unsupported loan-approval claims.

3. InvestorIQ Full Underwriting V2.0
   Purpose: lender-credit-committee / institutional package for sophisticated users such as Ken Dunn, family offices, larger operators, brokers, and institutional users.
   Target use case: 250+ unit assets, multi-building deals, and approximately $50M-$500M transactions.
   Future scope: advanced debt/refi, full DSCR stack, DCF, waterfall, capital stack, sensitivity analysis, integrations, lender/investor package, and institutional credit-committee-ready outputs.
```

This supersedes any narrower language suggesting Acquisition Memo is only for under-50-unit properties or only for vague/simple financing discussions.

## Acquisition Memo financing-readiness standard

Acquisition Memo should support lender-facing preliminary financing conversations for 1-150/200 unit deals, but it must not claim loan approval, lender commitment, or institutional credit-committee completeness.

Correct positioning:

```text
Acquisition Memo = financing-ready for serious lender discussions and acquisition financing requests.
Full Underwriting V2.0 = institutional lender / credit-committee package for major assets and portfolios.
```

The Acquisition Memo should answer the lender's first-pass questions:

```text
What is the property?
What is the verified income and NOI?
What is the purchase basis?
What rent/value support exists?
What debt or financing context was uploaded?
What is verified, what is context-only, and what remains missing for full credit underwriting?
```

## Required new section: Preliminary Financing Readiness Summary

Add or upgrade the Acquisition Memo financing section to render as:

```text
Preliminary Financing Readiness Summary
```

The section should include the following structure when source-supported.

### 1. Acquisition Request Context

```text
- Purchase Price
- NOI Basis
- Going-In Cap Rate
- Units
- Price per Unit
- NOI per Unit
```

### 2. Operating Support

```text
- Effective Gross Income
- Operating Expenses
- NOI
- Expense Ratio
- NOI Margin
- Occupancy
- Break-Even Occupancy
```

### 3. Rent / Value Support

```text
- Annual In-Place Rent
- Annual Market Rent
- Annual Rent Upside
- Rent Gap %
- Implied Value at 5.0%, 6.0%, 7.0% cap rates
- Document-derived cap-rate reference, if available
```

### 4. Debt / Financing Context

```text
- Uploaded Existing Debt Context, if available:
  - Outstanding Balance
  - Interest Rate
  - Amortization
  - LTV
- Proposed Acquisition Financing:
  - Shown only if explicitly provided
  - Otherwise: "Not source-complete / not modeled"
```

### 5. Lender Diligence Checklist

```text
- T12 verified: Yes
- Rent Roll verified: Yes
- Purchase assumptions provided: Yes / No
- Property tax support: Yes / No
- Current debt context uploaded: Yes / No
- Proposed acquisition loan terms complete: Yes / No
- Environmental / Phase I support: Context only / not modeled
- Appraisal support: Context only unless structured value exists
- CapEx / renovation plan: Context only unless verified budget and rent-lift assumptions exist
```

## Safe boundaries for the financing-readiness section

Allowed in Acquisition Memo:

```text
Acquisition Request Context
Operating Support
Rent / Value Support
Uploaded Existing Debt Context
Proposed Acquisition Financing status, only if explicitly source-supported
Lender Diligence Checklist
Source-complete limitation notes
```

Do not reopen Full Underwriting V2.0 surfaces in Acquisition Memo:

```text
No refinance proceeds
No refinance stress
No full debt sizing unless proposed acquisition financing terms are explicitly source-complete and the output is bounded to the Acquisition Memo readiness section
No DCF
No waterfall
No equity returns
No full debt schedule
No final recommendation
No BUY / SELL / HOLD
No loan approval or lender commitment language
No institutional credit-committee claim
```

Current debt / existing debt context must remain separate from proposed acquisition financing.

```text
Existing/current debt may be shown as Uploaded Existing Debt Context when verified.
Existing/current debt must not be relabeled as Proposed Acquisition Financing unless the source explicitly says it is proposed acquisition financing.
```

## Source-gating rule

If proposed acquisition financing terms are incomplete, the memo should still render the lender-facing readiness summary using verified property-level and source-coverage inputs, but proposed acquisition debt sizing/math should say:

```text
Not source-complete / not modeled
```

This limitation is acceptable and should not block the report.

## Immediate next implementation slice

After the Document Treatment root-render family is confirmed fixed, the next Codex slice should be:

```text
Add Preliminary Financing Readiness Summary to Acquisition Memo.
```

It must be a bounded Acquisition Memo product-value slice, not a V2 debt/refi/DCF reopening.

Guardrails:

```text
Do not touch Screening except protective regression.
Do not change pricing, Stripe, SQL/RPC, Supabase schema, routes, Dashboard, DocRaptor config, OpenAI config, auth, or upload gates.
Do not add new API/serverless routes.
Do not re-enable Full Underwriting V2 surfaces.
Do not hardcode property names, report IDs, production filenames, or fixture values outside tests.
```

---

# June 7, 2026 Addendum - Screening Launchable / Acquisition Memo Final Source-Treatment Root Bug Still Open / Codex Emergency Patch In Progress

## Current controlling status

InvestorIQ has completed the June 7 clean retest batch.

Results:

```text
Screening Memo 7 - CLEAN: launchable / founder-beta ready.
Acquisition Memo 10 - CLEAN: not launchable yet.
```

The remaining Acquisition Memo issue is narrow but serious:

```text
The final Document Treatment Summary still renders purchase_assumptions_source.txt as Appraisal Context / Context only / Listed for auditability only; not used quantitatively, even though the same report uses that source for purchase price and going-in cap rate.
```

This is a visible credibility contradiction and must be fixed before Acquisition Memo launch or Ken/public/founder outreach.

## OpenAI API credits restored

Rob restored OpenAI API credits before the latest retest.

The prior `insufficient_quota` issue is no longer the blocker. OpenAI/advisory/recovery calls are working again and artifacts show successful responses.

Important interpretation:

```text
AI did recover the relevant acquisition fields.
The deterministic final renderer failed to consume the validated acquisition artifact correctly.
Therefore the issue is not OpenAI failing; it is final renderer artifact precedence and QA blind spot.
```

## Product ladder remains controlling

Current launch ladder:

```text
1. InvestorIQ Screening Report
   - lower-priced first-pass document-based triage from T12 + Rent Roll
   - launchable now based on Screening Memo 7

2. InvestorIQ Acquisition Memo
   - main launch product
   - investor-ready acquisition and preliminary financing-readiness memo
   - should support financing-ready lender conversations and acquisition financing requests for approximately 1-150/200 unit properties when source-complete inputs are available, while avoiding unsupported loan-approval claims
   - not launchable until final source-treatment contradiction is fixed

3. InvestorIQ Full Underwriting V2.0
   - deferred / coming later
   - advanced current debt/refi, DCF, waterfall, capital stack, integrations, full lender/investor package
```

## Screening Memo 7 conclusion

Screening Memo 7 does what the Screening product is meant to do.

It gives a fast document-based triage answer:

```text
Is this property obviously worth more attention,
or should it be passed / placed in the maybe pile?
```

Visible metrics reviewed:

```text
Stable classification
48 units
95.8% occupancy
Annual in-place rent: $1,036,800
Annual market rent: $1,137,600
Annual gross rent upside: $100,800
Rent gap: 9.7%
Effective gross income: $1,036,800
Operating expenses: $425,000
NOI: $611,800
Expense ratio: 41.0%
NOI margin: 59.0%
Break-even occupancy: 41.0%
T12 coverage: 4/4
Rent Roll coverage: 4/4
```

Artifacts showed:

```text
report_contract_qa: pass
violations: []
report_quality_ready: true
customer_delivery_ready: true
```

Screening launch decision:

```text
Screening Report at founder pricing around $199 is launchable.
```

Commercial framing:

```text
Screening is not competing with free calculators on raw arithmetic alone.
It beats free calculators by extracting, validating, organizing, and presenting T12 + Rent Roll evidence into a consistent memo.
For high-volume users who screen dozens of deals/month, future bundles/subscription/custom pricing will likely be needed.
```

## Acquisition Memo 10 conclusion

Acquisition Memo 10 improved but still failed the launch bar.

What passed:

```text
Core math remained correct.
Purchase Price $10,640,000 displayed in the Acquisition Memo Summary.
Going-In Cap Rate 5.8% displayed in the Acquisition Memo Summary.
NOI Basis $611,800 displayed.
Duplicate Rent Positioning Evidence appears fixed.
V2 forbidden surfaces remained deferred/collapsed.
```

What failed:

```text
Document Treatment Summary still rendered purchase_assumptions_source.txt as:
- Appraisal Context
- Context only
- Listed for auditability only; not used quantitatively

The same file also appeared under:
- Listed but Not Quantitatively Modeled
```

This is a visible contradiction because the report used that file for acquisition summary values earlier.

Acquisition Memo launch decision:

```text
Do not launch Acquisition Memo until this final source-treatment contradiction is fixed and proven in the regenerated PDF.
```

## Root cause diagnosis

Artifacts show two competing same-file artifact paths for `purchase_assumptions_source.txt`:

```text
1. stale appraisal_parsed artifact:
   semantic_doc_role: appraisal
   cap_rate: 5.75
   missing_appraised_value

2. validated acquisition artifact:
   artifact type: loan_term_sheet_parsed acquisition artifact
   semantic_doc_role: purchase_assumptions
   validated: true
   purchase_price: 10640000
   going_in_cap_rate: 5.75
   accepted_fields: purchase_price, going_in_cap_rate
```

The final Document Treatment Summary renderer is still letting the stale appraisal artifact win for the visible source-treatment row.

Correct root rule:

```text
When duplicate artifacts exist for the same source file, validated acquisition-support truth must outrank stale appraisal metadata for final Document Treatment Summary rendering.
```

## QA blind spot diagnosis

`report_contract_qa` passed despite the visible PDF contradiction.

This means the contract QA is not checking final rendered Document Treatment Summary text/rows strongly enough.

The patch must fix both:

```text
1. production final renderer artifact precedence
2. final rendered contract QA blind spot
```

Do not accept another receipt that only says internal artifacts are correct. The regenerated PDF must prove the visible output is correct.

## Correct Acquisition Memo source-treatment invariant

In Acquisition Memo mode, if a source file has any validated acquisition fields such as:

```text
purchase_price
going_in_cap_rate
noi_basis
semantic_doc_role: purchase_assumptions
```

then the visible Document Treatment Summary must render it as:

```text
Document Role: Purchase Assumptions / Acquisition Context
Treatment: Acquisition context / document-derived acquisition context
Use: Purchase price / going-in cap / NOI basis support; does not override T12/Rent Roll operating truth
```

It must not render as:

```text
Appraisal Context
Context only / not used quantitatively
Listed for auditability only; not used quantitatively
Listed but Not Quantitatively Modeled
```

Unsupported appraisal files without validated acquisition fields still remain Appraisal Context / context only.

Debt/current loan support such as `loan_terms_simple_source.txt` remains Debt Support Received / contextual or deferred unless explicitly identified as proposed acquisition financing and source-complete for the mini financing section.

## Mini Acquisition Financing Readiness section doctrine

Rob clarified that Acquisition Memo should be strong enough to support financing-ready lender conversations and acquisition financing requests for approximately 1-150/200 unit properties when the required source inputs are available, while avoiding unsupported loan-approval claims.

Current doctrine:

```text
Acquisition Memo may include a small controlled financing-readiness section.
It must not reopen Full Underwriting V2 surfaces.
```

Required source-gated inputs for financing math:

```text
purchase_price
NOI basis
proposed acquisition loan amount OR LTV
interest rate
amortization years
```

Allowed calculations:

```text
Proposed Loan Amount
Estimated Annual Debt Service
Going-In DSCR
Going-In LTV
```

Required collapse behavior:

```text
If required financing inputs are incomplete, do not render partial debt math.
Show a compact limitation note or omit the math.
```

Do not render before V2:

```text
refinance proceeds
refinance stress
current-debt DSCR unless explicitly in scope and source-supported
full debt schedule
DCF
waterfall
equity returns
final recommendation
BUY / SELL / HOLD
```

For Acquisition Memo 10, financing fields were incomplete, so the absence/collapse of financing math is acceptable. The launch blocker is the purchase-assumptions document-treatment contradiction.

## Current Codex task in progress

Codex is working on emergency root fix:

```text
Final Document Treatment Summary same-file artifact precedence and contract QA blind spot.
```

Acceptance requirements for Codex receipt:

```text
A. Exact final renderer function that produced the bad row
B. Why report_contract_qa passed despite the bad PDF
C. Production precedence fix implemented
D. Final rendered contract check added
E. Regression with same filename producing stale appraisal + validated acquisition artifacts
F. Safe to commit yes/no
```

## No-more-testing rule until patch lands

Do not run a different test package now.

Reason:

```text
A different test might pass by accident if it does not create both a stale appraisal artifact and a validated acquisition artifact for the same file.
That would not prove the root bug is fixed.
```

After Codex patches, rerun the same Acquisition Memo source package.

## Next retest acceptance checklist

After Codex patch and commit, run one Acquisition Memo retest using the same source family.

Pass only if:

```text
purchase_assumptions_source.txt renders as Purchase Assumptions / Acquisition Context.
purchase_assumptions_source.txt does not render as Appraisal Context.
purchase_assumptions_source.txt does not render as Context only / not used quantitatively.
purchase_assumptions_source.txt does not appear under Listed but Not Quantitatively Modeled.
Only one Rent Positioning Evidence/Summary block appears.
No V2 debt/refi/DCF/waterfall/deal-score/final-recommendation leak appears.
Core operating and acquisition math remains correct.
```

## Launch posture after this update

```text
Screening: launchable.
Acquisition Memo: one visible final-render/source-treatment root bug away, not launchable yet.
Full Underwriting V2.0: deferred.
DocRaptor production mode: still distribution/public-sample switch, not ordinary customer delivery logic.
```

## Immediate continuation point

Continue from here:

```text
Codex is patching the final Document Treatment Summary artifact precedence issue.
Do not run more live tests until Codex returns.
When Codex returns, review root-path receipt, commit if safe, then run one same-package Acquisition Memo retest.
```



---

# June 5/6, 2026 Addendum - Pre-Retest Checkpoint After Elite Report Fullness / Source Treatment / Readiness Cleanup

## Current controlling status

InvestorIQ is now ready for the next clean live retest batch after a major June 5/6 cleanup sequence.

The working product ladder remains:

```text
1. InvestorIQ Screening Report
   - lower-priced, stable first-pass report from T12 + Rent Roll

2. InvestorIQ Acquisition Memo
   - main launch product
   - document-driven acquisition and preliminary financing-readiness memo
   - built from the former Underwriting / v1_core path
   - not Full Underwriting V2.0

3. InvestorIQ Full Underwriting V2.0
   - deferred / coming later
   - advanced debt/refi, DCF, waterfall, capital stack, integrations, and full investor/lender package
```

The latest live reports showed strong directional improvement:

```text
Screening Memo 3: 7 pages
Acquisition Memo 6: 14 pages
```

However, red-pen review still found known root-level issues. Those issues have now been patched in two focused batches. The next step is not another Codex audit. The next step is one fresh clean Screening and one fresh clean Acquisition Memo retest.

## Work completed today

### 1. Report fullness / source-bound section assembly direction validated

The report-fullness effort materially improved page count and report feel:

```text
Screening moved to 7 pages.
Acquisition Memo moved to 14 pages.
```

This confirmed that the pivot from thin shell to source-bound memo/report structure is working.

The quality bar remains universal:

```text
There is no customer-vs-Ken-vs-public-sample quality tier.
Every report should be document-driven, deterministic, source-bound, and credible enough for sophisticated review.
```

Use distribution labels only for operational/config readiness, such as DocRaptor production mode or public sample publishing.

### 2. Ken-style red-pen review findings from live Screening Memo 3 / Acquisition Memo 6

Known issues identified before patching:

```text
Screening still risked thin pages / thin final assembly.
Screening used customer-visible advanced-module/exclusion wording.
Acquisition Memo duplicated Rent Positioning Summary.
Acquisition Memo support-treatment table needed clean semantic role/treatment labels while preserving filename transparency.
Debt support was too close to modeled current-debt treatment.
Purchase assumptions treatment could contradict document-derived purchase/cap-rate context.
Deferred-analysis wording listed forbidden advanced module names too explicitly.
Artifacts still showed legacy readiness alias contradictions beside canonical deliverability.
Provider/advisory quota failures needed to remain diagnostic-only.
DocRaptor test mode needed to remain distribution metadata only.
Purchase assumptions/acquisition context still needed classification/treatment follow-through.
```

Important correction recorded during review:

```text
Uploaded filenames should remain visible for transparency.
Do not blank customer filenames.
Do not remove file-level auditability.
Clean the semantic role/treatment labels beside filenames instead.
```

This filename-transparency rule is now controlling.

## Patch batch 1 - source treatment, filename transparency, duplicate rent-positioning cleanup

Files changed:

```text
api/generate-client-report.js
api/_lib/report-contract-qa.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Completed behavior:

```text
Duplicate Acquisition Memo rent-positioning presentation corrected.
Summary-only rent-roll branch now emits Rent Positioning Evidence rather than a second Rent Positioning Summary.
Uploaded filenames remain visible for auditability.
Support-treatment table separates Filename, Document Role, and Treatment.
Semantic labels are clean/customer-facing and based on document role/treatment, not raw filename wording.
Loan/current-debt support is disclosed as debt support received with launch memo analysis deferred.
Purchase assumptions render as acquisition context / document-derived purchase-price or cap-rate reference when supported.
Property tax, market survey, CapEx, appraisal, environmental, broker/email, and unclassified support render with explicit source-bound treatment.
Customer-facing deferred/excluded wording no longer lists exact advanced module names.
Screening no longer mentions launch memo.
QA false-positive risks around support-doc proximity and occupancy drift were reduced.
```

Validation:

```text
node --check api/generate-client-report.js
node --check api/_lib/report-contract-qa.js
node tests/qa/generate-client-report-rent-roll-smoke.js
git diff --check
```

Status:

```text
Safe to commit / committed before continuing.
```

## Patch batch 2 - final assembly depth, visual/output polish, readiness alias alignment

Files changed:

```text
api/generate-client-report.js
api/_lib/qa-action-plan.js
api/_lib/report-contract-qa.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Completed behavior:

```text
Screening final assembly keeps full source-bound T12/Rent Roll operating depth when valid T12 + Rent Roll exist.
Screening preserves income reconstruction, expense structure, NOI stability, rent-roll distribution, and Data Coverage / Source Reliability.
Screening visible output no longer uses launch memo, DCF, waterfall, equity return, deal score, final recommendation, current-debt DSCR, refinance proceeds, or refinance stability language.
Screening scope wording is generic and safe.
Acquisition Memo wrapper churn / duplicate rent-positioning presentation was reduced.
Smoke verifies one visible rent-positioning path.
Canonical deliverability now drives legacy compatibility/readiness aliases.
Canonical deliverable jobs should no longer emit contradictory report_blocked/report_publishable/customer_delivery_ready/customer_publish_eligible/user_needs_documents-style aliases.
Provider/advisory failures remain diagnostic-only when deterministic core parsing succeeds.
DocRaptor test mode remains distribution/public-sample metadata only and is not ordinary customer delivery authority.
Purchase assumptions classify as purchase-context/acquisition-context support when supported, otherwise context-only.
Purchase assumptions do not become appraisal, appraised value, T12 override, Rent Roll override, or current debt override.
Forbidden V2/full-underwriting surfaces remain collapsed/deferred.
```

Validation:

```text
node --check api/generate-client-report.js
node --check api/_lib/qa-action-plan.js
node --check api/_lib/report-contract-qa.js
node tests/qa/generate-client-report-rent-roll-smoke.js
git diff --check
```

Status:

```text
Safe to commit / committed before retest.
```

## Codex usage conservation note

Rob is conserving Codex usage.

Controlling workflow from this checkpoint:

```text
Do not run another Codex audit before the clean retest batch.
Do not start another patch just because an issue might exist.
Do not ask Codex for broad summaries or broad audits.
Use Codex only for a targeted patch if the next clean live PDFs/artifacts reveal a real blocker.
```

Preferred prompt style remains:

```text
small, direct, scope-locked micro-prompts;
patch exact known defects;
no broad exploration unless genuinely necessary;
compact receipt only.
```

## Next action

Run only this clean live retest batch:

```text
1. One fresh Screening Report using valid T12 + Rent Roll.
2. One fresh Acquisition Memo using valid T12 + Rent Roll + support docs.
```

Use the same document family as the last tests unless intentionally changing the source package.

Do not run messy variants or edge cases until the clean retest batch is reviewed.

## What to upload after retesting

For each clean retest, upload:

```text
PDF
analysis_artifacts_rows.json
report_contract_qa artifact if separate
source_report_coverage_qa artifact if separate
qa_action_plan artifact if separate
delivery_gate_decision / deliveryDecisionState evidence if visible
Dashboard/Admin screenshots only if the lifecycle/display looks wrong
```

## Retest review checklist - Screening

Screening must show:

```text
substantial report feel for the product tier;
valid T12 + Rent Roll operating depth survives final PDF assembly;
Income Reconstruction / Operating Expenses / NOI / rent-roll analysis where source-supported;
Data Coverage / Source Reliability visible;
no launch memo wording;
no DCF / Discounted Cash Flow / waterfall / equity return / deal score / final recommendation / current-debt DSCR / refinance wording;
no unresolved tokens;
no orphan headings;
no empty tables;
no one-card pages that feel unfinished unless unavoidable from source limitation;
no public AI wording;
no BUY / SELL / HOLD.
```

## Retest review checklist - Acquisition Memo

Acquisition Memo must show:

```text
fuller memo presentation;
one rent-positioning path only;
source-bound operating, rent, cap-rate/value indication, acquisition context, Data Coverage, Source Treatment, and deferred advanced-module language;
filenames preserved for transparency;
clean document role/treatment labels beside filenames;
debt support disclosed as received/contextual/deferred, not modeled current-debt analysis;
purchase assumptions treated as acquisition context when supported;
property tax, environmental, market survey, CapEx, appraisal, broker/email roles clearly separated;
advanced financing/refinance/return-projection/recommendation modules deferred in customer-safe language;
no current-debt DSCR;
no refinance proceeds/stability;
no DCF;
no waterfall;
no equity return;
no deal score;
no final recommendation;
no BUY / SELL / HOLD;
no unresolved tokens;
no orphan headings;
no empty tables;
no internal parser/admin/vendor artifacts in customer-facing copy.
```

## Retest review checklist - artifacts

Artifacts should show:

```text
customer_delivery_allowed: true
hold_delivery: false
delivery_gate_status: deliverable / ready
canonical delivery state controls compatibility aliases
no contradictory legacy aliases on deliverable jobs
no customer-lifecycle needs_documents/publication_held/admin_review_required for core-valid jobs
no entitlement_restored for section-only/support/advisory/distribution issues
provider/advisory failures diagnostic-only when deterministic core parsing succeeds
DocRaptor test mode distribution-only, not ordinary customer delivery blocker
```

## Do not do yet

Do not:

```text
flip DocRaptor production mode;
create public sample links;
send anything to Ken/public distribution;
run messy/edge variants before reviewing the clean retest;
run another Codex audit before the retest;
patch Dashboard/Admin unless the next artifacts or screenshots show a real customer/admin lifecycle issue;
change pricing/Stripe;
add routes/serverless functions;
patch SQL/RPC casually.
```

## Fresh chat continuation prompt

Use this if starting a new chat after this checkpoint:

```text
We are continuing InvestorIQ after the June 5/6 Elite Report Fullness / Source Treatment / Readiness Alias cleanup.

Completed today:
- Screening Memo 3 reached 7 pages and Acquisition Memo 6 reached 14 pages, confirming fullness direction.
- Patch 1 cleaned Acquisition Memo source treatment, filename transparency, duplicate rent-positioning, purchase assumptions consistency, debt-support deferred/contextual treatment, and QA false positives.
- Patch 2 preserved Screening final-assembly operating depth, cleaned Screening advanced/exclusion wording, improved Acquisition Memo wrapper/page composition, aligned legacy readiness aliases with canonical delivery, kept provider/DocRaptor diagnostic-only, and fixed purchase-assumptions acquisition-context follow-through.
- Files touched across both patches: api/generate-client-report.js, api/_lib/qa-action-plan.js, api/_lib/report-contract-qa.js, tests/qa/generate-client-report-rent-roll-smoke.js.
- Validation passed and patches were safe to commit.

Next action:
Run one fresh clean Screening Report and one fresh clean Acquisition Memo using the same source family as the last tests. Upload PDFs and analysis artifacts for Ken-style red-pen review.

Guardrails:
No more Codex audits before retest. No messy/edge variants yet. Do not flip DocRaptor. Do not create public samples. Do not change pricing/Stripe. Preserve filename transparency. Do not re-enable current-debt DSCR/refi/DCF/waterfall/equity-return/deal-score/final-recommendation/BUY/SELL/HOLD surfaces.
```

---

# June 4, 2026 Addendum - Acquisition Memo Product Pivot / Memo Density / Renderer Runtime Stability Checkpoint

## Current controlling status

InvestorIQ is now continuing under the June 4 product ladder and Acquisition Memo launch pivot.

The current launch ladder is:

```text
1. InvestorIQ Screening Report
   - lower-priced stable first-pass report from T12 + Rent Roll
   - keep Screening stable and largely as-is

2. InvestorIQ Acquisition Memo
   - main launch product
   - built from the current Underwriting / v1_core path
   - document-driven acquisition and preliminary financing-readiness memo
   - not a loan approval
   - not final Full Underwriting V2.0

3. InvestorIQ Full Underwriting V2.0
   - coming later
   - advanced debt/refi, DCF, waterfall, capital stack, integrations, and full investor/lender package
```

## Acquisition Memo Slice 1 completed

Acquisition Memo Slice 1 isolated the launch memo from current-debt / DSCR Review-cap summary logic.

Completed behavior:

- launch Acquisition Memo no longer uses current-debt DSCR or debt-cap verdict logic for the Executive Summary / launch memo visible classification;
- the visible contradiction where the memo showed Stable but also said classification was capped at Review because current debt DSCR was below 1.25x was removed;
- `v1_core` launch memo classification now uses operating/acquisition memo logic, not current-debt verdict caps;
- Full Underwriting / future V2 debt logic remains preserved for the future V2 path.

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
tests/qa/report-contract-qa-smoke.js
```

Commit message used or recommended:

```text
isolate acquisition memo from debt verdict caps
```

## Acquisition Memo Slice 2 completed

Acquisition Memo Slice 2 expanded the memo structure so the Acquisition Memo no longer feels like a thin 7-page Screening-plus shell.

Added / promoted dedicated memo sections:

```text
Acquisition Memo Summary
Operating Snapshot
Rent Positioning Summary
Rent Upside / Value Sensitivity
Cap-Rate Value Indication
Source Context / Support Document Treatment
Data Coverage & Source Limitations
```

Additional behavior:

- Document Treatment now renders as a dedicated memo-grade source-context block instead of being buried only inside a coverage card;
- Data Coverage now renders as a dedicated memo-grade section and no longer depends on old stripped debt/refi/scenario artifacts to become substantial;
- rent-positioning title logic now uses summary-driven language when only summary totals drive the surface;
- `Unit-Level Rent Positioning & Value Sensitivity` is used only when true unit-level detail is actually rendered.

Files changed:

```text
api/generate-client-report.js
api/report-template-runtime.html
tests/qa/generate-client-report-rent-roll-smoke.js
tests/qa/report-contract-qa-smoke.js
```

Commit message used or recommended:

```text
expand acquisition memo section structure
```

## Runtime failures found during live Acquisition Memo testing

Two live Acquisition Memo runs failed during rendering after valid T12 + valid Rent Roll parsing.

Failures:

```text
Acquisition Memo 3:
Cannot access 'rrUnits' before initialization

Acquisition Memo 4:
hasForwardLookingRenovationInputs is not defined
```

Interpretation:

- these were renderer/runtime variable-scope bugs;
- these were not customer document failures;
- T12 and Rent Roll were valid/parseable;
- credit restore behavior correctly treated them as platform/render failures;
- the failures reinforced that unsupported support docs must collapse, qualify, or render context-only rather than kill a core-valid report.

Doctrine reaffirmed:

```text
Valid T12 + valid Rent Roll should publish unless true runtime/storage/PDF/catastrophic failure prevents safe generation.

Unsupported support docs should collapse, qualify, omit, or render context-only.

Renderer runtime defects are platform defects, not bad-upload failures.
```

## Emergency tiny fix completed

A focused runtime fix was completed for the `rrUnits` TDZ crash.

Completed behavior:

- Acquisition Memo cap-rate/value rendering now uses an initialized units value before rendering;
- the prior pre-initialization `rrUnits` usage was removed from the early memo assembly path.

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Commit message used or recommended:

```text
fix acquisition memo units initialization
```

## Root runtime audit completed

After the second runtime failure, whack-a-mole patching was stopped.

Codex ran an audit-only pass of its Acquisition Memo Slice 2 work.

Root cause class identified:

```text
Acquisition Memo renderer-scope TDZ / missing render-context initialization
```

Pattern identified:

```text
New Acquisition Memo sections reached sideways into scattered late-bound locals instead of consuming one early safe render context object.
```

Why existing tests missed this:

- tests were too source-regex/helper-level;
- they did not execute the actual `v1_core` final HTML assembly path;
- they did not exercise the realistic support-doc combination that failed in production.

## Root runtime stability patch completed

A system-level runtime stability patch was completed.

Completed behavior:

- one early Acquisition Memo render context now exists before section assembly;
- memo sections consume initialized/defaulted context rather than reaching sideways into late-bound locals;
- `rrUnits` / unit-count hazards were resolved;
- `hasForwardLookingRenovationInputs` is now defined before source-context and data-coverage assembly;
- unstructured renovation/CapEx support defaults to context-only / limited-use instead of creating runtime risk.

Early Acquisition Memo render context now includes safe/defaulted values for:

```text
units
occupiedUnits
vacantUnits
occupancy
annualInPlaceRent
annualMarketRent
annualRentUpside
rentGapPercent
egi
opEx
noi
expenseRatio
noiMargin
breakEvenOccupancy
purchasePrice
goingInCapRate
acquisitionNoiBasis
hasForwardLookingRenovationInputs
renovationDisplayMode
renovationPayload
propertyTaxPayload
propertyTaxBindingState
documentQuantitativeUsageMap
documentSources
```

A real `v1_core` full-render smoke was added using `__test_return_final_html` and a Harbourstone-style fixture package.

The smoke executes the real handler / final HTML assembly far enough to catch:

```text
ReferenceError
TDZ crash
undefined render variables
unresolved {{TOKEN}} placeholders
```

The fixture includes:

```text
valid T12
valid narrative / summary Rent Roll
current loan summary
purchase assumptions
property tax support
unstructured CapEx notes
market survey excerpt
broker email context
Phase I ESA context
unsupported appraisal excerpt
```

Support docs in the harness fail soft / context-only unless validated.

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Commit message used or recommended:

```text
stabilize acquisition memo render context
```

## Codex usage constraint

Rob is conserving Codex usage.

Current note:

```text
Codex usage is down to about 85% remaining.
Reset: Jun 11, 2026 8:38 AM.
```

Future Codex prompts should remain:

- tight;
- high-impact;
- no broad audits unless clearly necessary;
- no long receipts by default;
- no repeated verification passes unless a serious ambiguity or failure requires it.

## Current next action

Do not do more Codex patches tonight.

Next fresh-chat action:

```text
Run one controlled live Acquisition Memo test.
```

If it publishes, inspect:

- actual PDF page count;
- memo flow and density;
- Document Treatment;
- Data Coverage;
- source treatment;
- support-doc context-only handling;
- absence of V2 debt/refi/DCF/waterfall surfaces.

If it fails again with a renderer/runtime error, treat that as evidence the full-render harness is still missing a production branch.

Do not run multiple live tests in a row without reviewing artifacts.

## Current live-test acceptance checklist

The next controlled Acquisition Memo live test should prove:

```text
report publishes;
no renderer/runtime 500;
no entitlement restore unless true runtime fatal;
PDF is materially fuller than the old 7-page shell;
no Current Debt DSCR launch-memo leak;
no Debt Coverage Constraint launch-memo leak;
no refinance capacity/proceeds surface;
no DCF;
no waterfall;
no equity return;
no BUY / SELL / HOLD language;
Document Treatment is visible and source-bound;
Data Coverage is visible and not falsely severe when T12 + Rent Roll are clean;
support docs are context-only/limited-use unless validated;
no unresolved tokens;
no orphan headings;
no empty tables;
no public AI wording.
```

---

# June 3, 2026 Addendum - Codex Usage Conservation / Slice 3 In Progress Checkpoint

## Current continuation point

Codex is currently working on:

```text
Slice 3 - Acquisition/current-debt/proposed-financing truth cleanup
```

This follows:

```text
Slice 0 - Documentation checkpoint: complete
Slice 1 - Delivery/artifact legacy alias cleanup: pass / safe to commit
Slice 2 - Advanced modeling / DCF / waterfall render gates: pass / safe to commit
Slice 3 - in progress with tightened prompt
```

## Codex usage constraint

Rob has limited Codex usage until June 8.

Current remaining usage at this checkpoint:

```text
62% remaining
```

Because usage is limited, future Codex work must conserve usage. Do not ask Codex for unnecessary long summaries, broad re-audits, repeated verification passes, or nonessential exploratory work.

## Prompt/receipt style change - controlling from this point forward

Codex prompts should remain:

- tightly scoped;
- tied to the committed `.MD` cleanup map;
- repo-wide by root family, not report-specific;
- limited to the mapped file cluster unless Codex proves the invariant cannot be enforced there;
- direct and short enough to avoid wasting usage.

Codex receipts should be concise. Do not ask Codex for long narrative summaries of every detail it changed unless a serious failure or ambiguous patch requires deeper explanation.

Use this compact receipt standard by default:

```text
A. Files changed
B. Audit IDs addressed
C. Exact production rule fixed
D. Tests run / pass
E. Anti-hardcode confirmation
F. Anything intentionally not touched
```

Request longer receipts only when:

- Codex changes files outside the requested scope;
- a test fails;
- a production invariant is unclear;
- a patch touches delivery/credit/SQL/lifecycle behavior;
- a patch risks weakening fail-closed behavior;
- the result is not obviously safe to commit.

## Slice 3 tightened scope

The active Slice 3 prompt was tightened to reduce Codex usage.

Controlling Slice 3 invariant:

```text
Proposed acquisition/refinance financing can be recognized as proposed/acquisition support without becoming true current debt.
```

Additional non-negotiable appraisal guard:

```text
Appraisal context may support valuation/comparable context only.
Appraisal context must never unlock current debt, current-debt DSCR, refinance, DCF, waterfall, debt-service mix, sale-proceeds, or equity-return surfaces.
```

Slice 3 scope:

```text
Audit IDs: L-18, L-21, L-22
Files:
- api/parse/parse-doc.js
- api/_lib/report-surface-contracts.js
- api/_lib/report-contract-qa.js
- api/_lib/source-report-coverage-qa.js
- related tests only
```

`api/generate-client-report.js` may be inspected only for the appraisal unlock guard and patched only if required to enforce the invariant.

## Current execution guardrails

Do not live retest yet.
Do not rerun the repo-wide audit.
Do not flip DocRaptor production mode.
Do not create public samples.
Do not change pricing/Stripe.
Do not casually patch SQL/RPC.
Do not add new API/serverless routes.
Do not hardcode 124 Richmond, filenames, job IDs, report IDs, or fixture-only values.
Do not ask Codex for broad summaries or broad audits while usage is constrained.

## Next sequence after Slice 3

After Codex returns the Slice 3 receipt:

1. Review whether Slice 3 passes using the compact receipt.
2. If pass, commit Slice 3.
3. Continue to Slice 4 - Property-tax corroborating support path.
4. Then Slice 5 - Dashboard/customer/Admin copy cleanup.
5. Then Slice 6 - Parser/source-coverage fallback rationalization.
6. Reassess before any live retest.

---

# June 2, 2026 Addendum - Repo-Wide Legacy Residue Audit Converted Into Cleanup Map

## Purpose

Record that the June 2 controlled 124 Richmond Screening + Underwriting test moved the project from "controlled live testing next" into a new cleanup-map checkpoint.

This does not mean the customer-delivery doctrine is broken. Both reports published and customer delivery was allowed. But the audit proved legacy residue still exists in live artifacts, PDF renderer/template paths, Dashboard/customer copy, worker/queue/admin metrics, parser/source coverage, tests, and sample/preview assets.

## Controlling interpretation

1. Customer-delivery doctrine:
   - materially working better;
   - valid core jobs published;
   - no needs_documents customer outcome;
   - no publication_held customer outcome;
   - no MISSING_REQUIRED_SOURCE_DATA customer failure;
   - no credit restore for section-only/support/advisory issues.

2. Remaining issue:
   - repo still contains active legacy residue and old template/render paths;
   - contradictions in artifacts are caused by legacy/fallback compatibility aliases and duplicate readiness fields still being emitted beside canonical delivery state;
   - advanced modeling / DCF / waterfall surfaces are caused by old reachable renderer/template sections and weak canonical render gates.

3. Do not run this broad audit again unless a future patch invalidates this map.
   This audit is now the working inventory.

## Cleanup map

### Slice 0 - Documentation checkpoint
- Files:
  - `!!!INVESTORIQ_MASTER_CONTEXT_CURRENT_DOCTRINE_COMPLETION_CHECKLIST_JUNE2_UPDATED_PRETEST_CHECKPOINT.md`
  - `!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_2026-06-02_UPDATED_PRETEST_CHECKPOINT.md`
- Purpose: lock this audit into docs before patching.
- Status: in progress / do first.

### Slice 1 - Delivery/artifact legacy alias cleanup
- Audit IDs: L-01, L-14, L-15, L-16, L-20, L-23, L-24, L-25 inspect-only.
- Files:
  - `api/generate-client-report.js`
  - `api/_lib/qa-action-plan.js`
  - `api/_lib/qa-fix-routing.js`
  - `api/_lib/report-contract-qa.js`
  - `api/admin-run-worker.js`
  - `api/admin/queue-metrics.js`
  - `supabase/migrations/20260214_0930_queue_job_for_processing.sql` inspect only
- Invariant:
  When canonical delivery state exists, live/new-job artifacts must not emit contradictory legacy/fallback fields as live authority.
- Target fields to remove/rename/isolate when canonical-present:
  - `readiness_source: legacy_publish_eligibility_fallback`
  - `readiness_fallback_used: true`
  - `report_blocked: true`
  - `report_publishable: false`
  - `customer_publish_eligible: false`
  - `customer_delivery_ready: false`
  - `launch_path_recommendation: user_needs_documents`
  - `customer_status_reason_code: customer_publish_not_ready`
- Disposition:
  historical compatibility may remain only if clearly isolated as non-authoritative.
- Priority: highest.

### Slice 2 - Advanced modeling / DCF / waterfall render gates
- Audit IDs: L-02, L-03, L-17, L-18, L-19.
- Files:
  - `api/generate-client-report.js`
  - `api/report-template-runtime.html`
  - `api/_lib/source-report-coverage-qa.js`
  - `api/_lib/report-surface-contracts.js`
  - `api/_lib/full-underwriting-state.js`
- Invariant:
  DCF, advanced modeling, debt-service mix, refinance, waterfall, comparables, and relative-positioning surfaces render only when canonical support exists.
- Surfaces:
  - Advanced Financial Modeling
  - Operating Expense, Debt Service, and Cash Flow Mix
  - Equity Cash Flow Waterfall
  - Initial Equity / Cash Flow / Refinance / Sale
  - DCF Framework Sensitivity Summary
  - Comparable Transaction Context
  - Relative Positioning
- Priority: highest after Slice 1.

### Slice 3 - Acquisition/current-debt/proposed-financing truth cleanup
- Audit IDs: L-18, L-21, L-22.
- Files:
  - `api/parse/parse-doc.js`
  - `api/_lib/report-surface-contracts.js`
  - `api/_lib/report-contract-qa.js`
  - `api/_lib/source-report-coverage-qa.js`
- Invariant:
  Proposed acquisition/refinance financing can be recognized as proposed/acquisition support without becoming true current debt.
- 124 Richmond source proof:
  Clean term sheet contains loan amount at purchase price, 5.85% rate, 30-year amortization, and 1.00% lender fee.
- Required behavior:
  recognize fields as proposed/acquisition support, not current outstanding debt.
- Priority: high.

### Slice 4 - Property-tax corroborating support path
- Audit IDs: L-18, L-22 support-doc/property-tax portions.
- Files:
  - `api/parse/parse-doc.js`
  - `api/_lib/report-surface-contracts.js`
  - `api/_lib/full-underwriting-state.js`
  - `api/generate-client-report.js`
  - `api/_lib/report-contract-qa.js`
- Invariant:
  A property tax document that matches the T12 tax line should render as limited corroborating support, not generic auditability-only and not modeled override.
- 124 Richmond source proof:
  Property tax bill contains 2025 Municipal Property Taxes $38,400, matching the T12 property tax line.
- Priority: high.

### Slice 5 - Dashboard/customer/Admin copy cleanup
- Audit IDs: L-10, L-11, L-12, L-24 if relevant.
- Files:
  - `src/lib/dashboardCustomerCopy.js`
  - `src/pages/Dashboard.jsx`
  - `src/pages/AdminDashboard.jsx`
  - `api/admin/queue-metrics.js`
- Invariant:
  Customer-facing status/copy must come from canonical customer state, not old job.status, old readiness aliases, needs-doc, or publication-held fallbacks.
- Must not show for core-valid jobs:
  - `needs_documents`
  - `user_needs_documents`
  - `publication_held`
  - `under_review`
  - `admin_review_required`
  - `upload more documents`
  - `source package blame`
  - `T12/Rent Roll blame when usable`
- Priority: high after Slice 1.

### Slice 6 - Parser/source-coverage fallback rationalization
- Audit IDs: L-17, L-18, L-22.
- Files:
  - `api/parse/parse-doc.js`
  - `api/_lib/source-report-coverage-qa.js`
  - `api/_lib/report-surface-contracts.js`
- Invariant:
  Parser fallback/recovery paths may recover usable deterministic core evidence, but fallback provenance cannot become live customer-blocking authority or silent financial truth.
- Nuance:
  Do not delete useful deterministic fallback blindly. Separate safe deterministic recovery from legacy fallback authority.
- Priority: medium-high.

### Slice 7 - Preview/sample/dead asset isolation
- Audit IDs: L-04, L-05, L-06, L-07, L-08, L-09, L-26, L-27, L-28.
- Files:
  - `api/report-template.html`
  - `api/html/sample-report.html`
  - `src/lib/pdfSections.js`
  - `src/lib/generatePDF.js`
  - `public/reports/sample-report.html`
  - `scripts/generate-sample-pdf.js`
  - `src/pages/SampleReport.jsx`
  - `src/components/UploadModal.jsx`
  - `src/lib/sampleReportPages.js`
- Invariant:
  Legacy sample/demo/preview paths must not feed live customer PDFs or public trust surfaces.
- Priority:
  medium/low unless proven reachable.

### Slice 8 - Test-suite doctrine split
- Files:
  - `tests/qa/qa-action-plan-smoke.js`
  - `tests/qa/delivery-decision-state-smoke.js`
  - `tests/qa/source-report-coverage-qa-smoke.js`
  - `tests/qa/admin-run-worker-gate-smoke.js`
  - `tests/qa/report-contract-qa-smoke.js`
  - `tests/qa/dashboard-customer-copy-smoke.js`
  - `tests/qa/job-failure-messaging-smoke.js`
  - `tests/qa/report-upload-gate-smoke.js`
  - `tests/qa/rent-roll-text-summary-fallback-smoke.js`
  - `tests/qa/rent-roll-alias-smoke.js`
  - `tests/qa/t12-core-summary-smoke.js`
- Invariant:
  Tests may preserve historical compatibility only when explicitly named as historical/read-only compatibility. No test should protect legacy fallback as expected live/new-job behavior.
- Priority:
  update alongside each slice, finalize after Slices 1-6.

### Slice 9 - SQL/RPC lifecycle review only
- Audit ID: L-25.
- File:
  - `supabase/migrations/20260214_0930_queue_job_for_processing.sql`
- Invariant:
  New jobs must not create or queue through needs_documents.
- Current note:
  Production Supabase was already manually fixed so active consume_purchase_and_create_job creates queued and queue_job_for_processing queues from queued.
- Disposition:
  inspect/document only unless repo source-of-truth would reintroduce old behavior.
- Priority:
  after code authority slices; no casual SQL patch.

## Recommended execution order

0. Update docs.
1. Slice 1 - Delivery/artifact legacy alias cleanup.
2. Slice 2 - Advanced modeling / DCF / waterfall render gates.
3. Slice 3 - Acquisition/current-debt/proposed-financing truth cleanup.
4. Slice 4 - Property-tax corroborating support rendering.
5. Slice 5 - Dashboard/customer/Admin copy cleanup.
6. Slice 6 - Parser/source-coverage fallback rationalization.
7. Slice 8 - Test-suite doctrine split finalization.
8. Slice 9 - SQL/RPC inspect-only source-of-truth check.
9. Slice 7 - dead/sample/preview cleanup later unless reachable sooner.

## Guardrails

- Do not patch yet from this documentation update.
- Do not run more live testing until the map is committed and the next patch slice is chosen.
- Do not flip DocRaptor.
- Do not create public samples.
- Do not change pricing/Stripe.
- Do not add new API/serverless routes.
- Do not hardcode 124 Richmond, filenames, job IDs, report IDs, or fixture-only values.
- Do not delete parser fallback blindly.
- Do not casually patch SQL/RPC.
- Do not treat customer-deliverable as Ken/public-sample ready.

## Required receipt

A. Files changed
B. Addendum title added to each file
C. Confirm all 10 slices/Slice 0-9 were recorded
D. Confirm execution order recorded
E. Confirm guardrails recorded
F. Confirm no code files changed
G. Validation: `git diff --check`

# June 2, 2026 Addendum - Pre-Test Checkpoint / Universal Report-Quality Cleanup Verified / Controlled Live Testing Next

## Current controlling status

InvestorIQ is now at a pre-test checkpoint.

Full Underwriting has already passed the core-valid customer-delivery doctrine live once: a valid core job published instead of failing closed because of optional/support/advisory issues. After that pass, red-pen review exposed report-surface root classes rather than delivery-gate failures. Codex has now patched those root classes and verified the patch as safe to commit.

The system should now proceed to controlled live validation after the patch is committed. DocRaptor production mode remains intentionally deferred until testing confidence is established.

## Universal report-quality cleanup completed and verified

Codex completed a root-invariant patch across renderer/canonical support-doc treatment/report-contract QA conformance surfaces.

Files changed:

- `api/generate-client-report.js`
- `api/_lib/report-surface-contracts.js`
- `api/_lib/report-contract-qa.js`
- `tests/qa/current-debt-support-routing-smoke.js`
- `tests/qa/generate-client-report-rent-roll-smoke.js`
- `tests/qa/report-contract-qa-smoke.js`

Codex validation run:

- `node --check api/generate-client-report.js`
- `node --check api/_lib/report-surface-contracts.js`
- `node --check api/_lib/report-contract-qa.js`
- `node tests/qa/current-debt-support-routing-smoke.js`
- `node tests/qa/generate-client-report-rent-roll-smoke.js`
- `node tests/qa/report-contract-qa-smoke.js`
- `npm.cmd run build`
- `git diff --check`

No-code verification result:

```text
1. Going-in cap rate binding: Verified
2. Summary-only rent roll unit-mix collapse: Verified
3. Generic orphan heading collapse: Verified
4. Property-tax corroborating support wording: Verified
5. Explicit current debt QA recognition / acquisition separation: Verified
Blocker found: None
Commit status: safe to commit
```

## What this cleanup means

This cleanup was not a patch to one test report. It addressed universal report-quality root invariants.

### Universal render eligibility

Now considered complete/safe to commit:

- no orphan headings;
- no empty tables;
- no unsupported rows;
- summary-only rent rolls should not render misleading unit-mix tables;
- representative observations must not be treated as full unit mix;
- empty intro/heading blocks should collapse generically.

### Field-source binding

Now considered complete/safe to commit:

- going-in cap rate cannot render as acquisition interest rate;
- acquisition interest rate renders only with explicit interest-rate support;
- acquisition fields render only under exact source meaning;
- property tax support that matches the T12 tax line is limited corroborating support;
- property tax support does not override T12 totals and does not become modeled input without a validated structured tax artifact.

### QA conformance alignment

Now considered complete/safe to commit:

- explicit current debt support is recognized by QA/conformance;
- explicit current debt should no longer be demoted to acquisition-only/not-assessed;
- acquisition/proposed financing stays separated from current debt.

## Screening vs Underwriting status at this checkpoint

### Screening

Status: `GREEN/YELLOW - ready for final controlled validation`

Screening remains the cleaner report type because it has fewer optional/support surfaces. It still requires final controlled live validation, PDF visual review, Dashboard card review, and website/distribution readiness before launch.

### Full Underwriting

Status: `YELLOW/GREEN - customer-delivery doctrine live-proven once; final controlled validation next`

Full Underwriting is no longer in the prior phase where valid core jobs were failing closed because of section/support/advisory issues. The immediate issue shifted to report-surface discipline, and the known root-class surface issues have now been patched and verified.

The next Full Underwriting step is not another broad audit. It is controlled live validation.

## Production/distribution readiness

### DocRaptor production mode

Status: `DEFERRED INTENTIONALLY`

Do not flip DocRaptor yet. The test watermark remains acceptable during controlled testing. DocRaptor production mode is a distribution/public-sample switch, not proof that report logic is correct.

Flip only after final controlled Screening and Underwriting outputs are trusted.

### Public sample files/assets

Status: `DEFER UNTIL FINAL TRUSTED OUTPUTS EXIST`

Do not create public samples from pre-final test reports. Sample links/assets can be audited later, but external distribution should wait until controlled report outputs pass.

### Website/pricing/checkout copy

Status: `OPEN BEFORE LAUNCH, NOT THE NEXT REPORT-ENGINE STEP`

Still required before launch:

- Landing/Pricing copy audit;
- checkout/report-type copy audit;
- Stripe/pricing alignment;
- sample link/assets check;
- no public AI wording;
- no BUY/SELL/HOLD;
- no admin-review/under-review/publication-held customer copy;
- no misleading Underwriting availability.

## Immediate next action

If not already committed, commit the universal report-quality cleanup patch.

Recommended commit message:

```text
universal report quality cleanup
```

Then proceed to controlled live testing.

## Controlled live testing sequence

Run:

1. final Screening live run;
2. final Full Underwriting live run;
3. Dashboard customer card review;
4. Admin artifacts/diagnostics review;
5. PDF visual review.

Capture for each:

- PDF;
- `analysis_artifacts_rows.json`;
- lifecycle events;
- delivery gate decision;
- report-contract QA;
- source-report coverage QA;
- QA action plan;
- Dashboard status/copy;
- Admin diagnostics if relevant.

## Acceptance criteria for live testing

Valid core jobs must show:

```text
- published status;
- customer delivery allowed;
- no needs_documents / user_needs_documents lifecycle for core-valid jobs;
- no publication_held lifecycle for core-valid jobs;
- no MISSING_REQUIRED_SOURCE_DATA for core-valid jobs;
- no entitlement/credit restore for section-only/support/advisory issues;
- unsupported sections collapse/omit/qualify/disclose instead of killing the report;
- no orphan headings;
- no empty tables;
- no unsupported rows;
- no cap-rate-as-interest-rate issue;
- property tax treatment matches source support;
- explicit current debt support aligns with QA/conformance;
- acquisition/proposed financing remains separate from current debt;
- Dashboard copy is ready/processing/fail-closed only, with no customer review limbo;
- DocRaptor watermark accepted during testing and treated as distribution-only.
```

## Do not do before testing

Do not:

- flip DocRaptor production mode;
- create public samples;
- change Pricing/Stripe;
- run broad repo audits;
- add routes/serverless functions;
- touch SQL/RPC lifecycle unless a new live blocker appears;
- change Dashboard lifecycle/copy unless live testing exposes a customer-facing issue.

## Fresh continuation point

Start the next chat from this checkpoint. Commit the universal report-quality cleanup patch if it has not already been committed, then run controlled live Screening and Full Underwriting tests.


---

# June 2, 2026 Addendum - Full Underwriting Live Pass / SQL Lifecycle Fixed / Ken Red-Pen Result

## Current controlling status

Full Underwriting finally produced a successful controlled live customer-deliverable report after the stop-the-line core-valid failure path campaign.

Report:

```text
Final Motherload underwriting 12
Result: published
Customer-deliverable: yes
Ken/public-sample ready: no, not yet
```

This supersedes prior notes saying no more live Underwriting retests should run. That restriction applied before the SQL lifecycle and legacy fallback fixes. The controlled retest has now run and passed.

## Critical production fix completed in Supabase

Production Supabase was still using old function definitions:

```text
consume_purchase_and_create_job created new jobs as needs_documents.
queue_job_for_processing only queued from needs_documents.
```

That was the last live lifecycle blocker.

The production SQL functions were manually updated so:

```text
consume_purchase_and_create_job creates new jobs as queued.
queue_job_for_processing only accepts queued.
```

A production verification query confirmed the active function definitions now use `queued`, and a status check confirmed there are no current `analysis_jobs` rows with a `needs` status.

Interpretation:

```text
The legacy needs_documents lifecycle is gone from the live/new-job path.
```

## Live Underwriting result

The successful job moved through:

```text
queued -> extracting -> underwriting -> scoring -> rendering -> pdf_generating -> publishing -> published
```

The report-published email artifact was created.

This confirms the core-valid job no longer gets forced into:

```text
user_needs_documents
publication_held
MISSING_REQUIRED_SOURCE_DATA
credit_restore_required
entitlement_restored
source-package / Rent Roll / T12 customer blame
```

## Math / source validation result

The Ken-style red-pen review checked the report against the uploaded source docs.

Core math passed:

```text
T12:
- EGI $1,036,800
- OpEx $425,000
- NOI $611,800
- Expense Ratio 41.0%
- NOI Margin 59.0%

Rent Roll:
- 48 units
- 46 occupied
- 2 vacant
- occupancy 95.83%
- in-place annual rent $1,036,800
- market annual rent $1,137,600
- annual rent upside $100,800

Debt:
- balance $8,750,000
- rate 5.25%
- amortization 30 years
- monthly P&I about $48,318
- DSCR about 1.06x
```

The visible classification `Review - Debt Coverage Constraint` is appropriate because current debt DSCR is below 1.25x.

## Report-quality result

The report is customer-deliverable, but it is not Ken/public-sample ready.

Ken/public-sample blockers:

1. DocRaptor test watermark / test-mode PDF output.
2. Acquisition section appears to show `Interest Rate 5.75%` where the source only supports `Going-In Cap Rate 5.75%`.
3. Internal QA artifacts still contain stale legacy/canonical current-debt contradictions even though the report rendered correct current debt math.
4. Advanced modeling page has empty/weak headings that should collapse when no meaningful content exists.
5. Unit mix table appears under-rendered for summary/narrative rent roll data; it should collapse or qualify summary-only mode.
6. Property tax document treatment should say it supports the T12 tax line and does not override T12 totals.

## Doctrine interpretation

This is the correct interpretation:

```text
Underwriting engine customer-delivery pass: YES
Core-valid publish doctrine live-confirmed: YES
Optional/support/advisory non-blocking doctrine live-confirmed: YES
OpenAI quota/advisory failures non-blocking: YES
Ken/public sample readiness: NO
DocRaptor production mode: still required before external distribution
```

Do not call Full Underwriting public/Ken/sample ready yet.

## Immediate next recommended work

Do not restart broad doctrine work.

Next recommended batch is a focused Ken-readiness cleanup:

```text
1. Fix acquisition cap-rate vs interest-rate label.
2. Collapse empty/weak advanced modeling headings.
3. Collapse or qualify summary-only unit mix table.
4. Polish property-tax support treatment wording.
5. Clean internal current-debt canonical QA artifact contradiction.
6. Keep DocRaptor production mode as distribution/config work, separate from ordinary customer delivery.
```

After that, regenerate one Underwriting report and run another Ken red-pen test.

## Fresh-chat continuation point

We resume after the breakthrough live pass:

```text
Final Motherload underwriting 12 published.
SQL needs_documents live lifecycle removed.
Core-valid Underwriting customer-delivery doctrine passed live.
Math mostly checks out.
Ken/public-sample readiness still blocked by polish/config/artifact issues.
```

Next likely action:

```text
Focused Ken-readiness cleanup batch.
```

---

# June 2, 2026 Addendum - Doctrine Completion Checklist / Remaining Work To Make InvestorIQ Obey Doctrine End-to-End

## Current controlling decision

Yes: update the `.MD` files before this gets lost.

The P0 Core-Valid Failure Path families were closed by Slices 1-3, but InvestorIQ should not stop at "P0 closed" while known P1 doctrine edges remain mapped. The next work is doctrine-completion hardening, not random patching.

## Current doctrine target

InvestorIQ must obey this end-to-end:

```text
Bad uploads cannot generate.
Valid core jobs publish.
Unsupported sections self-heal.
Worker cannot resurrect old fail states.
Dashboard cannot blame usable docs.
Support/advisory/distribution issues stay internal.
Only true core failure or true runtime/PDF/storage failure can kill the report.
```

## Remaining work sequence from this checkpoint

### 1. Doctrine-completion patch: hard upload/server gate + P1 CVF cleanup

Patch before live retest:

- Screening Generate gate:
  - require valid/usable T12;
  - require valid/usable Rent Roll.
- Underwriting Generate gate:
  - require valid/usable T12;
  - require valid/usable Rent Roll;
  - require at least one supporting/deal document outside the required core docs.
- Server-side generate gate:
  - re-check the same rule so UI bypass cannot generate invalid jobs;
  - reject before report generation and before credit consumption wherever safely possible;
  - do not create failed-report lifecycle limbo for attempts that never satisfied the upload gate.
- CVF-07 cleanup:
  - optional/full-underwriting support-depth constraints must stay internal/distribution-only or section-level;
  - they must not block ordinary customer delivery when `core_valid_required_coverage === true`.
- CVF-15 cleanup:
  - optional-support/source-package/admin-op paths must stay diagnostic/internal/distribution-only;
  - they must not feed customer lifecycle, fail closed, or restore credit for core-valid jobs.

Important support-doc nuance:

```text
For Underwriting, at least one support doc is required to start generation.
But support docs are not quantitatively mandatory after that.
Bad or unsupported support docs after the gate is satisfied are section-level/internal/distribution-only issues.
They must not become required-core blockers once T12 + Rent Roll are valid.
```

### 2. Final no-code doctrine closure audit

After the doctrine-completion patch passes, run an audit-only confirmation.

Audit must prove:

- CVF-07 is closed or safe internal/distribution-only;
- CVF-15 is closed or safe internal/distribution-only;
- upload/server gate is enforced for Screening and Underwriting;
- `core_valid_required_coverage === true` cannot be overridden by optional/support/advisory/distribution issues;
- no known non-legitimate CVF remains open before live retest.

No code changes during this audit unless a real remaining P0/P1 doctrine edge is found.

### 3. Controlled live retests

Run in this order:

1. valid Screening job with T12 + Rent Roll;
2. valid Underwriting job with T12 + Rent Roll + support doc;
3. deliberate invalid-core case;
4. optional deliberate runtime/PDF/system failure case only if safe.

Live retest must prove:

- valid core jobs publish;
- invalid core docs fail closed or are blocked at the gate;
- runtime fatal shows neutral system-failure copy;
- no core-valid job shows source-package/rent-roll/missing-doc blame;
- no unsupported debt/refi/report-type surfaces leak into the PDF.

### 4. Artifact and PDF inspection after live tests

For valid Screening and Underwriting jobs, confirm artifacts show:

```text
core_valid_required_coverage: true
customer_delivery_allowed: true
hold_delivery: false
delivery_gate_status: deliverable / ready
no MISSING_REQUIRED_SOURCE_DATA
no entitlement_restored
no user_needs_documents customer lifecycle
no publication_held customer lifecycle
```

PDF inspection must confirm:

- no unsupported Current Debt DSCR leak;
- no unsupported refinance stress/proceeds table leak;
- no wrong report-type section leak;
- unsupported sections are omitted, qualified, disclosed, or Not Assessed.

### 5. Ledger/master-context update after live retest

If live retest passes, update statuses:

- `CVF-01`, `CVF-02`, `CVF-03`, `CVF-13` = legitimate failure paths preserved;
- `CVF-04`, `CVF-05`, `CVF-06` = closed + live-confirmed;
- `CVF-07` = closed or safe internal/distribution-only after doctrine-completion patch;
- `CVF-08`, `CVF-09`, `CVF-10` = closed + live-confirmed;
- `CVF-11`, `CVF-12` = closed + live-confirmed;
- `CVF-14` = safe internal/distribution-only;
- `CVF-15` = closed or safe internal/distribution-only after doctrine-completion patch.

### 6. Final public/customer polish sweep

Only after doctrine behavior is proven:

- replace contraction wording where touched, especially `You'll` -> `You will`;
- verify no customer-visible admin-review / under-review / publication-held wording;
- verify no stale upload-clearer-docs copy except true invalid core-doc cases;
- verify no weird report labels, unresolved tokens, mojibake, stale N/A blocks, public AI wording, or BUY/SELL/HOLD language;
- resolve DocRaptor production/public-sample distribution readiness separately from ordinary customer delivery.

### 7. Launch-readiness smoke

Final short run:

- `npm run build`;
- all targeted QA smokes touched by the doctrine-completion sequence;
- one Screening report;
- one Underwriting report;
- Dashboard customer card review;
- Admin artifacts/diagnostics review;
- PDF visual review.

## Definition of Done

InvestorIQ obeys doctrine when all of the following are true:

```text
1. Bad uploads cannot start generation.
2. Valid T12 + Rent Roll jobs publish.
3. Underwriting requires at least one support doc to start, but optional/support docs cannot later kill a core-valid report.
4. Unsupported current-debt/refi/report-type/support sections self-heal before delivery.
5. Worker cannot map core-valid section/support/advisory issues to MISSING_REQUIRED_SOURCE_DATA or entitlement restore.
6. Dashboard and failure-message copy cannot blame usable core docs.
7. Public-sample/high-value/DocRaptor/OpenAI/advisory issues stay internal or distribution-only.
8. Only true core failure or true runtime/storage/PDF/catastrophic failure can kill the whole report.
```

## Immediate next action

Give Codex the doctrine-completion patch prompt:

```text
Hard upload/server gate + remaining P1 CVF-07/CVF-15 cleanup.
```

Do not run controlled live retest until that patch and the follow-up no-code closure audit pass.

---

# June 2, 2026 Addendum - 15 Core-Valid Failure Path Families Added / Full Underwriting Launch Gate Reopened

## Current controlling status

The Publish-or-Fail doctrine remains correct, but the prior “Doctrine Lock Closed” implementation status is no longer sufficient for launch confidence.

A controlled Full Underwriting live test proved that a report can still whole-report fail after required core documents are valid. The live package had a valid parsed T12 and valid parsed Rent Roll, but section/render-contract drift cascaded through legacy delivery/failure mapping into a whole-report fail and incorrect source-package/rent-roll blame copy.

## New controlling invariant

```text
Valid T12 + valid Rent Roll = publish the report.

If core docs are valid, non-core or section-level issues must collapse/omit/qualify/disclose the affected section, not fail the whole report.
```

Whole-report fail remains allowed only for:

1. missing/unusable/unvalidated required T12;
2. missing/unusable/unvalidated required Rent Roll;
3. true runtime/storage/PDF generation failure;
4. catastrophic render failure where no safe report shell can be produced.

## New active ledger/campaign

Active campaign name:

```text
InvestorIQ Core-Valid Failure Path Family Ledger
```

Suggested active ledger filename:

```text
!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_2026-06-02.md
```

This does not erase the original Decision-Source Elimination Ledger. It supersedes the launch-critical working focus.

## 15 Core-Valid Failure Path Families to track until destroyed

1. `CVF-01` Core T12 parse failure - legitimate fail-closed only when truly core-invalid.
2. `CVF-02` Core Rent Roll parse failure - legitimate fail-closed only when truly core-invalid.
3. `CVF-03` Financial scale mismatch after core parse - must disclose/qualify when defensible; only fail if truly unreconcilable.
4. `CVF-04` Current-debt/refi render-contract drift - collapse/omit/qualify debt/refi/DSCR surfaces; do not whole-report fail.
5. `CVF-05` Report-type section leak - strip/collapse leaked section; do not whole-report fail.
6. `CVF-06` Source reconciliation/rendered variance drift - disclose-only for core-valid jobs.
7. `CVF-07` Optional/full-underwriting support depth constraints - internal/distribution-only or section limitation; not ordinary customer block.
8. `CVF-08` Delivery-gate hold-chain / legacy needs-doc conversion - destroy customer-facing `user_needs_documents` / `needs_documents` / `publication_held` conversion for core-valid jobs.
9. `CVF-09` Generator publication-held shim - remove/bypass hold shim for core-valid section-only issues.
10. `CVF-10` Worker terminal failure / credit restore misclassification - no `MISSING_REQUIRED_SOURCE_DATA` or entitlement restore for core-valid section-only issues.
11. `CVF-11` Failure message builder source-package/rent-roll blame - never blame usable core docs.
12. `CVF-12` Dashboard customer status/copy fallback - no needs-doc/publication-held/additional-documents lifecycle for core-valid jobs.
13. `CVF-13` Runtime/storage/PDF/catastrophic render failure - legitimate fail-closed, system-failure copy only.
14. `CVF-14` OpenAI/provider/advisory failures - diagnostic only when deterministic core is valid.
15. `CVF-15` Optional-support/source-package/admin ops paths - internal/distribution/diagnostic only; cannot feed customer lifecycle.

## P0 patch order now controlling

1. Slice 1 - Core-valid delivery invariant.
   - Main files: `api/_lib/qa-action-plan.js`, `api/generate-client-report.js`, `api/admin-run-worker.js`.
   - Goal: core-valid jobs cannot become needs-doc/publication-held/MISSING_REQUIRED_SOURCE_DATA because of non-core/section-only issues.

2. Slice 2 - Section self-heal/collapse for render-contract violations.
   - Main files: `api/_lib/report-contract-qa.js`, `api/generate-client-report.js`, `api/_lib/report-surface-contracts.js`.
   - Goal: current-debt/refi/report-type/source-reconciliation issues collapse/omit/qualify affected sections before delivery.

3. Slice 3 - Dashboard/failure messaging final customer-copy lock.
   - Main files: `src/lib/jobFailureMessaging.js`, `src/pages/Dashboard.jsx`.
   - Goal: core-valid jobs never display source-package/rent-roll/additional-documents blame.

4. Slice 4 - Optional/support/distribution isolation sweep.
   - Main files: `api/_lib/source-report-coverage-qa.js`, `api/_lib/source-package-qa.js`, `api/_lib/qa-action-plan.js`.
   - Goal: optional support docs, public-sample/high-value blockers, DocRaptor test mode, and OpenAI/advisory issues cannot block ordinary customer delivery.


## Execution rule - bundle path families by shared file cluster

When Codex begins implementation, do not patch one CVF row at a time if several rows share the same files, canonical owner, and invariant. To prevent this from taking the entire day, bundle **2-4 tightly related CVF families** per prompt only when they touch the same file cluster and share the same doctrine rule.

Approved grouping pattern:

1. **Delivery invariant cluster**
   - CVF-08, CVF-09, CVF-10
   - Files: `api/_lib/qa-action-plan.js`, `api/generate-client-report.js`, `api/admin-run-worker.js`
   - Shared invariant: core-valid jobs cannot become needs-doc/publication-held/MISSING_REQUIRED_SOURCE_DATA/credit-restored because of non-core or section-only issues.

2. **Rendered section self-heal cluster**
   - CVF-04, CVF-05, CVF-06
   - Files: `api/_lib/report-contract-qa.js`, `api/generate-client-report.js`, `api/_lib/report-surface-contracts.js`, `api/_lib/source-report-coverage-qa.js`
   - Shared invariant: section-contained render-contract issues collapse/omit/qualify affected sections and do not fail core-valid reports.

3. **Customer copy cluster**
   - CVF-11, CVF-12
   - Files: `src/lib/jobFailureMessaging.js`, `src/pages/Dashboard.jsx`
   - Shared invariant: customer copy cannot blame source package, T12, Rent Roll, missing documents, or additional documents when core-valid is true.

4. **Optional/support/distribution isolation cluster**
   - CVF-07, CVF-14, CVF-15 plus DocRaptor/public-sample/high-value metadata behavior where surfaced through CVF-08
   - Files: `api/_lib/source-report-coverage-qa.js`, `api/_lib/source-package-qa.js`, `api/_lib/qa-action-plan.js`, advisory QA helpers
   - Shared invariant: optional/support/advisory/distribution blockers remain diagnostic or distribution-only and cannot block ordinary customer delivery when deterministic core docs are valid.

Do not bundle unrelated parser, renderer, worker, Dashboard, and support-doc families just to move faster. Bundling is allowed only when the same patch can enforce one shared invariant without broad refactor or drift.

## Immediate instruction

Before any new Codex patch prompt, commit this documentation update so the 15 path families are not lost.

Then give Codex Slice 1 only.

Do not run more live tests until Slice 1 is complete and validated.
Do not patch only Dashboard copy first.
Do not patch only current-debt rendering first.
The core-valid delivery invariant must be patched before the next symptom class.


---

# June 2, 2026 Addendum - Publish-or-Fail Doctrine Lock Progress / `user_needs_documents` Demotion Doctrine Added

## Current controlling status

- Publish-or-Fail doctrine remains the controlling customer-outcome doctrine.
- Ordinary customer outcomes are only:
  1. **PUBLISH**
  2. **FAIL CLOSED + RESTORE CREDIT**
- There is no normal customer-facing admin-review outcome.
- There is no normal customer-facing under-review limbo.
- There is no normal customer-facing upload-more-documents loop for an active job.

## Slice 1 and Slice 1B completed in `api/_lib/qa-action-plan.js`

### Slice 1 - admin-review / under-review emitter demotion

Files changed:
- `api/_lib/qa-action-plan.js`
- `tests/qa/qa-action-plan-smoke.js`

Completed behavior:
- `qa-action-plan` no longer preserves `admin_review_required` as a canonical ordinary customer delivery state.
- `under_review` customer label/message path was removed from canonical delivery state construction.
- Customer-facing "under internal review" language was removed from this canonical/action-plan layer.
- `admin_review_required` output is forced false in publish-eligibility output.
- Canonical override paths normalize legacy review states before downstream delivery/readiness synthesis.

Important correction:
- Slice 1 initially risked over-demoting deprecated `admin_review_required` into `user_needs_documents`, which could have converted non-core/report-surface issues into fail-closed outcomes. That was not acceptable under current doctrine.

### Slice 1B - reason-aware deprecated-admin-review normalization

Files changed:
- `api/_lib/qa-action-plan.js`
- `tests/qa/qa-action-plan-smoke.js`

Completed behavior:
- Blanket `admin_review_required -> user_needs_documents` normalization was replaced with reason-aware classification.
- Deprecated `admin_review_required` now resolves by cause:
  - `core_fail` reasons -> fail-closed path / legacy `user_needs_documents` internal status.
  - known non-core/report-surface reasons -> `deliverable`.
  - unknown deprecated reasons -> `deliverable` plus diagnostic code `DEPRECATED_ADMIN_REVIEW_REASON_REQUIRES_CLASSIFICATION`.
- No `under_review` customer label/message path was reintroduced.

Examples now deliverable when core T12 + Rent Roll are usable:
- `REPORT_TYPE_SECTION_LEAK`
- `RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER`
- placeholder/render leak classes
- other known non-core/report-surface classes

Examples still fail-closed:
- `missing_required_t12`
- `missing_required_rent_roll`
- `missing_required_source_documents`
- `rent_roll_unusable`
- `t12_unusable`
- `core_input_verification_inconsistency`
- `system_contract_failure` only where it has true core-fail/generation-failure semantics

Validation reported:
- `node --check api/_lib/qa-action-plan.js`
- `node tests/qa/qa-action-plan-smoke.js`
- `git diff --check`
- All passed, with CRLF warnings only.

## New doctrine clarification - `user_needs_documents` is not a customer workflow state

`user_needs_documents` is legacy/internal terminology from an earlier product concept where a user might upload additional documents into the same active job.

That workflow does **not** currently exist.

Therefore:

- `user_needs_documents` must not be presented as a normal customer-facing "add more documents to this job" state.
- It may remain temporarily as an internal/legacy fail-closed alias for required-core-source failure.
- Customer-facing copy must describe the actual product outcome:
  - **Report could not be generated from the required uploaded documents.**
  - **Report credit has been restored.**
  - **User may start a new report with corrected source documents.**

Correct conceptual replacement:
- Internal old label: `user_needs_documents`
- Current meaning: `fail_closed_core_documents` / `required_source_data_unusable`
- Customer outcome: `FAIL CLOSED + RESTORE CREDIT`

Correct mapping:
- Missing/unusable T12 -> fail closed + restore credit.
- Missing/unusable Rent Roll -> fail closed + restore credit.
- Both required core docs unusable -> fail closed + restore credit.
- Parser/provider failure where required core docs cannot be validated -> fail closed + restore credit.
- Optional/support docs missing or ambiguous -> publish with affected section collapsed/omitted/qualified/disclosed.
- Report-surface/copy/rendering issue -> self-heal/sanitize/replace/collapse/omit/qualify, then publish.
- DocRaptor test mode -> customer delivery allowed if otherwise safe; external/public/sample/high-value distribution blocked only.
- OpenAI quota/advisory failure -> diagnostic only if deterministic core artifacts are valid.

Customer-facing language target:
```text
Report could not be generated.

InvestorIQ could not produce a defensible report from the required uploaded documents. Your report credit has been restored, and you may start a new report with corrected source documents.
```

Do not use customer-facing language implying:
- "under review"
- "internal review"
- "24 business hours review"
- "additional documents are needed before this report can be delivered"
- "upload more documents to this job"

unless/until the product actually supports adding documents to an active job.

## Current remaining Publish-or-Fail doctrine-lock work

Do not run more live Underwriting tests until the remaining downstream doctrine-lock slices are handled or intentionally deferred with a clear risk note.

Remaining slices:

1. **Generator hold branch demotion**
   - File likely: `api/generate-client-report.js`
   - Remove ordinary customer hold behavior keyed to `admin_review_required`.
   - Demote `user_needs_documents` customer wording into fail-closed/credit-restored semantics.
   - Preserve true fail-closed behavior for unusable required core docs and true system/runtime/storage failure.

2. **Worker lifecycle demotion**
   - File likely: `api/admin-run-worker.js`
   - Remove admin-review held transition as ordinary customer state.
   - Ensure publish path proceeds when canonical customer delivery is allowed.
   - Ensure true core fail/system fail restores credit.
   - Ensure legacy `user_needs_documents` maps to fail-closed/credit-restored, not upload-more-docs limbo.

3. **Dashboard customer display cleanup**
   - File likely: `src/pages/Dashboard.jsx`
   - Remove customer-visible `under_review` and upload-more-docs style messaging.
   - Display published/ready reports normally.
   - Display fail-closed reports with credit-restored language.
   - Avoid implying the user can add more documents to the same job.

4. **AdminDashboard display/diagnostics cleanup**
   - File likely: `src/pages/AdminDashboard.jsx`
   - Keep internal diagnostics/triage visible.
   - Ensure labels do not imply ordinary customer admin approval/review.
   - Preserve emergency/admin tooling as internal-only.

5. **Final doctrine-lock smoke/audit**
   - Add/maintain tests proving:
     - no customer-facing `under_review`;
     - no customer-facing `admin_review_required`;
     - no customer-facing "under internal review";
     - `user_needs_documents` is not a customer workflow state;
     - required-core failures fail closed + restore credit;
     - optional/support/render/copy issues publish with collapse/omit/qualify/self-heal/disclosure;
     - public/sample/high-value blockers cannot block ordinary customer delivery.

## Fresh-chat continuation prompt

We are continuing InvestorIQ immediately after updating the master context for Publish-or-Fail doctrine lock progress.

Current status:
- `.MD` doctrine has been updated again.
- Slice 1 and Slice 1B are complete/pass in `api/_lib/qa-action-plan.js`.
- Slice 1 removed/demoted admin-review and under-review emitters in qa-action-plan.
- Slice 1B fixed the over-demotion mistake by making deprecated `admin_review_required` reason-aware:
  - core-fail reasons -> fail-closed path / legacy internal `user_needs_documents`;
  - non-core/report-surface reasons -> deliverable;
  - unknown deprecated reasons -> deliverable + `DEPRECATED_ADMIN_REVIEW_REASON_REQUIRES_CLASSIFICATION` diagnostic.
- `user_needs_documents` doctrine is now clarified:
  - it is not a customer workflow state because InvestorIQ currently has no upload-more-documents flow for an active job;
  - it may remain temporarily as an internal/legacy fail-closed alias only;
  - customer-facing copy must say the report could not be generated from required uploaded documents and the credit was restored.

Next work:
1. Continue Publish-or-Fail doctrine-lock downstream slices.
2. Recommended next slice: `generate-client-report.js` hold-branch demotion and customer wording correction.
3. Then worker lifecycle.
4. Then Dashboard customer display.
5. Then AdminDashboard/internal diagnostics wording.
6. Then final doctrine-lock smoke/audit.

Guardrails:
- Do not run more live Underwriting tests yet.
- Do not loosen QA.
- Do not publish unsafe rendered surfaces.
- Do not fail whole reports for wording/render/optional-support issues.
- Fail closed only for unusable required core T12/Rent Roll or true generation failure.
- No normal admin review.
- No normal customer under-review.
- No customer upload-more-documents limbo.
- No broad refactors.
- No new Vercel/serverless routes casually.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off fixture values.
- Renderer consumes canonical state.
- QA is conformance/diagnostics only.
- Public/sample/high-value readiness remains distribution metadata, not ordinary customer delivery authority.

---

# June 1/2, 2026 Addendum - Publish-or-Fail Doctrine Locked / Admin Review Removed as Customer Outcome

## Current controlling doctrine - supersedes all older contradictory implementation notes

InvestorIQ has **no normal customer-facing admin-review outcome**.

The only ordinary customer outcomes are:

1. **PUBLISH**
   - Required core T12 + Rent Roll evidence is usable enough to produce a defensible, document-driven report.
   - Any non-core, optional, support-document, section-specific, wording, rendering, report-surface, DocRaptor/test-mode, OpenAI/advisory, acquisition-support, current-debt, property-tax, market-survey, appraisal, environmental, zoning, renovation/CapEx, or public-copy issue must be handled by deterministic self-heal, sanitize, collapse, omit, qualify, disclose, or render Not Assessed where appropriate.
   - These issues may emit internal diagnostics and may block external/public/sample/high-value distribution, but they must not create ordinary customer limbo.

2. **FAIL CLOSED + RESTORE CREDIT**
   - Only when required core T12 or Rent Roll evidence is missing, unreadable, unparseable, materially invalid, incoherent, contradictory beyond defensible use, or otherwise so unusable that producing any report would be dishonest.
   - True runtime/system/storage failure that prevents generation may also fail closed with credit restored.

There is no third ordinary outcome.

## Explicitly superseded / removed from active doctrine

Any older language in this file or the codebase implying ordinary customer outcomes such as:

- `admin_review_required`
- `under_review`
- "admin-held publishing"
- "send to review"
- "manual/operator-reviewed customer delivery"
- "24 business hours review"
- customer-facing "under internal review"

is superseded and must be treated as legacy/internal/emergency-only terminology, not a normal product state.

If code still emits those states for ordinary customer jobs, that code is out of alignment with doctrine and must be audited/demoted.

## Required system behavior by issue class

- Report-type wording leak, stale heading, wrong methodology label, public copy issue:
  - self-heal/sanitize/replace/collapse the affected text or block, then publish if core docs are usable.
  - Do not fail the whole report.
  - Do not send to review.

- Unsupported optional/support document:
  - omit, list as unmodeled context, or qualify affected section.
  - Do not block whole-report publication.

- Missing or ambiguous acquisition/proposed-financing support:
  - omit/qualify acquisition financing rows or show only verified fields.
  - Keep acquisition/proposed financing separate from current debt.
  - Do not block whole-report publication.

- Missing or ambiguous current-debt support:
  - mark current debt/refi/DSCR sections Not Assessed or collapse/omit them.
  - Do not block whole-report publication.

- Property-tax support missing/unverified:
  - omit/qualify property-tax modeling.
  - Do not allow unrelated support docs to become property-tax authority.
  - Do not block whole-report publication.

- DocRaptor test mode:
  - ordinary customer delivery blocker: no.
  - external/public/sample/high-value distribution blocker: yes until production mode is verified.

- OpenAI quota/advisory/QA failure:
  - ordinary customer delivery blocker: no, when deterministic core artifacts are valid.
  - diagnostic/platform-infrastructure issue only.

## Immediate architecture priority

Before more live Underwriting testing, run an **Admin Review Outcome Demotion Audit** across worker, delivery gate, QA/action-plan, report-contract QA, generator, Dashboard, and AdminDashboard paths.

Goal:
- find every remaining path that can turn an ordinary customer report into `admin_review_required`, `under_review`, admin-held, or review-limbo;
- classify whether it should become publish, self-heal/collapse/omit/qualify then publish, fail-closed + credit restored, or internal diagnostic only;
- patch in small slices until ordinary customer flow obeys Publish-or-Fail doctrine.

## Guardrail

Do not loosen QA to make unsafe reports publish. Instead:
- prevent unsafe surfaces before render,
- self-heal deterministic surface issues,
- collapse/omit/qualify unsupported sections,
- fail closed only for unusable core T12/Rent Roll or true generation failure.

---
﻿# June 1, 2026 Addendum - Clean Screening Regression Root Fixes / Parser Fallback / Delivery Gate Correction / Summary-Only Surface Patch / Core Parser Rejection Audit Installed

## Current controlling status
- Controlled live regression started after G8 material closure.
- Clean Screening pipeline materially improved, but one more red-pen PDF review is still required after the latest surface patch rerun.
- Do not claim all DS rows are globally closed.
- Do not claim Full Underwriting public self-serve launch-ready.
- Do not claim Ken/public samples are ready.

## Doctrine reaffirmed
- Whole-report fail-closed is only for unusable/missing/unreadable/materially invalid required core docs, severe core contradiction, or true runtime/system/storage failure.
- Messy but usable core T12/Rent Roll evidence should publish when defensible.
- Optional/support/section-specific issues must collapse/omit/qualify/disclose at section/line level, not fail the whole report.
- Admin review is not a normal customer outcome.
- AI is not the boss; deterministic validation remains authority.

## June 1 regression sequence
1. Clean Screening initially failed closed.
- Root cause: rent roll was plain-text narrative with explicit coherent summary totals.
- Deterministic rent-roll parsing was gated to tabular flows.
- AI recovery attempted; provider returned non-OK (429/openai_non_ok); no accepted candidate.
- Worker fail-closed/credit-restore behavior was correct.

2. Deterministic text-summary rent-roll fallback added.
- Files:
- `api/parse/parse-doc.js`
- `tests/qa/rent-roll-text-summary-fallback-smoke.js`
- Added `parseRentRollFromTextSummary(...)`.
- Non-tabular rent roll can now produce `rent_roll_parsed` when explicit coherent summary totals exist.
- Requires: total units, occupied, vacant, occupancy, in-place/current total family, market total family.
- Coherence checks added (occupied+vacant=total, occupancy approx occupied/total, monthly/annual consistency).
- No fabricated unit rows.
- No summing representative observations.
- Specific rejection diagnostics added.

3. Fallback tightened.
- Initial version was too permissive (accepted any one rent-total family).
- Fixed to require both in-place/current family and market family.
- Added in-place-only and market-only rejection tests.

4. Summary-total precedence fixed.
- Parser now prefers controlling summary-total semantics over representative unit narrative values.
- Representative-only observations reject.
- Trailing numeric extraction avoids “across all 48 units” collisions.
- No parser hardcoding.

5. Delivery leak fixed after parse succeeded.
- Root cause: `DOCRAPTOR_NOT_PRODUCTION_MODE` leaked from distribution readiness into ordinary customer delivery.
- Files:
- `api/_lib/qa-action-plan.js`
- `tests/qa/delivery-decision-state-smoke.js`
- Canonical `customer_delivery_allowed` now wins when present.
- Otherwise customer delivery derives from canonical delivery authority:
- `delivery_gate_status === "deliverable"`
- `customer_publish_blockers.length === 0`
- DocRaptor test mode still blocks `public_sample_ready` and `high_value_outreach_ready`.
- True holds/fails remain unchanged.

6. Post-publish red-pen found summary-only surface defects.
- Empty unit-level framing visible for summary-only rent roll.
- “Weighted Avg” labels shown without row-level support.
- Stale heading “InvestorIQ Estimates” remained.

7. Screening summary-only rent-roll surface patch completed.
- Files:
- `api/generate-client-report.js`
- `tests/qa/generate-client-report-rent-roll-smoke.js`
- Detects summary-only surface (`units/unit_mix/computed unit_mix` empty with verified totals).
- Collapses empty unit-level/unit-mix surface in Screening.
- Replaces with summary-positioning language.
- Uses implied-average labels for summary-only:
- `Implied Avg In-Place Rent`
- `Implied Avg Market Rent`
- Adds monthly/annual total metrics.
- Preserves weighted/rent-band row-level rendering when row support exists.
- Replaced stale heading with `Document-Backed Screening Outputs`.
- No parser/delivery/DocRaptor changes.

8. Core parser rejection audit layer installed (diagnostic-only safeguard).
- Files:
- `api/admin-run-worker.js`
- `tests/qa/core-parser-rejection-audit-smoke.js`
- New artifact type: `core_parser_rejection_audit`.
- Trigger: extracting-stage fail path before/around `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` when required core parsed artifact is missing, core file exists, and `document_text_extracted` exists.
- Deterministic-only signal findings include:
- `parser_rejection_confirmed`
- `parser_missed_usable_core_evidence`
- `representative_values_confused_with_summary_totals`
- `source_text_contains_core_summary_totals`
- `provider_unavailable`
- `deterministic_recovery_needed`
- `insufficient_readable_text`
- `core_evidence_incoherent`
- No publish effect, no parsed artifact creation, no AI value authority, no credit-restore behavior change, no Dashboard copy change.

## Validation receipts recorded
- `rent-roll-text-summary-fallback-smoke` passed.
- `t12-rent-roll-diagnostics-regression` passed when run.
- `delivery-decision-state-smoke` passed.
- `admin-run-worker-gate-smoke` passed.
- `generate-client-report-rent-roll-smoke` passed.
- `core-parser-rejection-audit-smoke` passed.
- `git diff --check` passed with CRLF warnings only.

## Immediate continuation point
- Pause live testing until this doc update checkpoint is committed and a fresh chat starts.
- Next:
1. Rerun the same Clean Screening and red-pen the new PDF surface.
2. Investigate OpenAI 429/insufficient_quota diagnostics as separate launch-readiness/config work.

## OpenAI quota/config investigation note
- Codex should inspect code-side OpenAI diagnostics capture only.
- Identify error-body capture gaps, model selection, retry/backoff behavior, and clarity of rate-limit vs quota vs billing/project/model-limit diagnostics.
- Do not print secrets or expose API keys.
- Account-side billing/project limits still require Rob dashboard verification.

## Guardrails unchanged
- micro-prompts
- no broad refactors
- no report-specific hacks
- no hardcoded property/job/file IDs
- no casual new API/serverless routes
- no public AI wording
- no BUY/SELL/HOLD
- renderer consumes canonical state
- QA/conformance/diagnostics only
- deterministic validation remains authority

---
# May 30, 2026 Addendum - G8 Delivery/UI Lifecycle Authority Materially Closed / Grouped Campaign Checkpoint

## Current controlling status
- InvestorIQ Decision-Source Elimination remains the controlling architecture cleanup track.
- G8 is materially closed after worker publish-path hold guard hardening and closure audit.
- Completed/materially closed grouped sequence: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7, G8.
- Remaining grouped batches in the current G1-G8 sequence: none.
- Do not claim all DS rows are globally closed unless row closure standards are satisfied.
- Do not claim Full Underwriting public self-serve launch-ready.
- Do not claim Ken/public samples are ready.

## G8 closure status
- G8A-02 seam in `api/admin-run-worker.js` is closed.
- Worker publish path now requires resolved delivery permission:
  - `holdDelivery === false`
  - `customerDeliveryAllowed === true`
- Typed outcomes remain preserved:
  - `user_needs_documents` fail-closed/restore path
  - Superseded legacy note: `admin_review_required` / admin-held publishing must not remain an ordinary customer outcome; remaining paths must be demoted to publish/self-heal/collapse/fail-closed according to Publish-or-Fail doctrine
- Fail-closed and credit-restore safety behavior remains preserved.

## Post-patch audit verdict
- Audit-only verification completed.
- No material remaining delivery/UI duplicate truth-maker was found across:
  - worker lifecycle
  - Dashboard customer status/message surfaces
  - AdminDashboard triage surfaces
  - generator delivery compatibility aliases
- Dashboard remains canonical-first for `customer_status_label`/`customer_message` when canonical state exists.
- Legacy display/copy fallback remains canonical-absent compatibility only.
- AdminDashboard remains display/diagnostic/emergency-action only, not customer delivery authority.
- `public_sample_ready` and `high_value_outreach_ready` remain distribution metadata, not ordinary customer delivery authority.

## Fresh-chat continuation prompt
We resume after G8 material closure.

Completed/materially closed: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7, G8.

Next step: either controlled live regression checkpoint or targeted post-launch polish selection.

Guardrails unchanged:
- micro-prompts
- no broad refactors
- no report-specific hacks
- no hardcoded IDs/filenames
- no new API/serverless routes casually
- renderer consumes canonical state
- QA conformance only

---
# May 30, 2026 Addendum - G7 Action-Plan Consumer Demotion Materially Closed / G8 Remains Next

## Current controlling status
- InvestorIQ Decision-Source Elimination remains the controlling architecture cleanup track.
- Completed/materially closed grouped sequence: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7.
- G7 is materially closed after Slices 1, 2A, 2B, and the Slice 3 closure audit.
- Remaining grouped batch: `G8 - Delivery/UI Lifecycle Follow-up`.
- Do not claim all DS rows are closed.
- Do not claim Full Underwriting public self-serve launch-ready until controlled live regression passes.

## G7 completion record
- Slice 1:
  - `buildQaActionPlan(...)` now consumes canonical delivery state when present.
  - Legacy action-plan readiness synthesis is canonical-absent fallback only.
- Slice 2A:
  - `buildPublishEligibilitySummary(...)` now consumes canonical delivery state when present.
  - Local blockers/advisories/regeneration/source-limitation fields remain diagnostic metadata when canonical state is present.
- Slice 2B:
  - `buildDeliveryGateDecision(...)` now consumes canonical delivery state when present across accepted shapes:
    - `deliveryDecisionState`
    - `canonicalDeliveryDecisionState`
    - `delivery_gate_decision`
    - `deliveryGateDecision`
  - Canonical-present paths mirror canonical gate truth for delivery/readiness fields.
  - `public_sample_ready` and `high_value_outreach_ready` mirror canonical only when explicitly present; otherwise safe fallback metadata remains.
  - Legacy gate-owner behavior remains only for canonical-absent artifacts.
- Slice 3 closure audit:
  - Audit-only; no files changed.
  - No material duplicate-authority leak remains in G7 scope.
  - Optional future hardening (non-blocking): defensive overwrite-proofing in `buildDeliveryGateDecision(...)` return ordering.

## Remaining work and next task
- Remaining grouped batch: `G8 - Delivery/UI Lifecycle Follow-up`.
- Next recommended task: G8 audit only, unless Rob explicitly chooses controlled live regression first.
- G8 must remain micro-sliced due to worker/dashboard lifecycle risk and Vercel Hobby function-count constraints.

## Fresh-chat continuation prompt
We resume after G7 material closure.

Completed/materially closed: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7.

Remaining: G8 - Delivery/UI Lifecycle Follow-up.

Next recommended task: G8 audit only, unless Rob explicitly chooses controlled live regression first.

G8 must remain micro-sliced because it touches worker/dashboard lifecycle behavior and Vercel Hobby function-count constraints.

Guardrails:
- Do not start broad worker/dashboard refactors.
- Do not add new API/serverless routes.
- Do not alter customer delivery doctrine.
- Do not loosen fail-closed/credit-restore behavior.
- Audit first, patch only after the residual lifecycle/UI authority path is identified.
- micro-prompts
- no broad refactors
- no report-specific hacks
- no hardcoded property names/filenames/report IDs
- no public AI wording
- no BUY/SELL/HOLD
- renderer consumes canonical state
- QA is conformance only
- action plan consumers must not re-infer truth
- lifecycle/UI consumers in G8 must not reinterpret canonical delivery state

---
# May 30, 2026 Addendum - G1/G2/G5/G6 Materially Closed / Pause Before G7-G8

## Current controlling status
- InvestorIQ Decision-Source Elimination remains the controlling architecture cleanup track.
- The original audit estimated approximately 132 duplicate decision-making paths/truth-makers.
- The ledger tracks 70 explicit DS rows/groups plus grouped expansion clusters.
- We are not requiring closure of every DS row before controlled launch/regression decisions.
- Work is intentionally paused after G6 Final Sweep due to low Codex usage.
- Full Underwriting is not declared public self-serve ready until controlled live regression passes.

## Completed grouped sequence (committed)
- Patch 1/1B
  - Parser current-debt support routing and loan-term promotion aligned.
  - Explicit non-acquisition current-debt terms route/promote as current debt.
  - Acquisition/proposed financing remains separated.
  - Standalone LTV no longer creates acquisition/proposed classification by itself.
- Patch 2
  - `resolveReportTypeAndTier(...)` added.
  - Explicit unknown `report_type` fails closed with `400 Invalid report_type`.
  - Underwriting aliases normalize to underwriting/tier 2/v1_core.
  - Screening default remains only when no explicit type is provided.
- G4
  - Source-report-coverage QA canonical-first depth/signal guard sweep completed.
  - Rendered/file/artifact signals are conformance/evidence only when canonical state exists.
  - Full Underwriting depth conformance uses canonical section-family expectations, not raw page count.
- G1 materially closed
  - Slice 1: operating statement, renovation, document sources canonicalization.
  - Slice 2: debt tables, DCF table, risk matrix, DCF summary, narrative strip canonicalization.
  - Slice 3: late `reportTier === 1` strip cascade canonical guard.
  - Residual `G1C-02` early screening cascade is contained/watch-only unless live regression proves a real mismatch.
- G2 materially closed
  - Mode-aware visible classification/coverage consumers.
  - Screening cannot leak debt-coverage classification.
  - Screening stress-summary/framework/rationale now consume canonical/final visible label.
  - Deferred polish only: CSS stale aliases, Data Coverage wording nuance, historical Deal Scorecard threshold note.
- G5 materially closed
  - Report-contract QA provenance/conformance authority hardened.
  - `resolveCanonicalCurrentDebtStateForQa(...)` and `hasCanonicalCoverageAuthority(...)` provenance-locked.
  - `inferCanonicalVerdictCapState(...)` provenance-gated.
  - Remaining G5 scope is non-authority regex/taxonomy polish.
- G6 materially closed
  - `buildAcquisitionAssumptionState(...)` no longer uses rendered acquisition phrase as canonical support authority.
  - `buildFullUnderwritingSectionEligibility(...)` no longer uses rendered section headings as eligibility authority.
  - Final sweep removed QA inventory-boolean authority from debt truth, demoted deterministic-flag reconciliation escalation, and mode-gated debt-cap classification to underwriting/tier 2.

## Launch-risk compression status at this pause
- Major Full Underwriting collapse root families were materially compressed:
  - parser current-debt support routing
  - report-type downgrade
  - generator strip/mutation authority
  - visible classification leakage
  - QA provenance leaks
  - surface-contract canonical-owner rendered/inventory/flag authority leaks
- Do not overclaim all DS rows are closed.
- Do not overclaim Ken/public samples are ready.

## Remaining grouped batches
- `G7 - Action-Plan Consumer Demotion`
- `G8 - Delivery/UI Lifecycle Follow-up`
- G8 remains micro-sliced due to worker/dashboard lifecycle risk and Vercel Hobby constraints.
- Because this checkpoint is paused, do not start G7/G8 until resumed.

## Current next action when resumed
1. G7 audit only.
2. If Rob decides cleanup is sufficient for now, checkpoint and run controlled live regression.

## Fresh-chat continuation prompt
We resume after G6 Final Sweep.

Completed/materially closed: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6.

Remaining: G7 and G8.

Codex usage was low, so work paused intentionally.

Next recommended task: G7 audit only.

Guardrails remain:
- micro-prompts
- no broad refactors
- no report-specific hacks
- no hardcoded property names/filenames/report IDs
- no public AI wording
- no BUY/SELL/HOLD
- no new Vercel API/serverless routes casually
- renderer consumes canonical state
- QA is conformance only
- action plan and lifecycle consumers must not re-infer truth

---
# May 30, 2026 Addendum - Batch 6 Decision-Source Compression Complete / Batch 6F Final Recommendation Guard Complete / Live Regression Next

## G. Fresh-chat continuation prompt

We are continuing InvestorIQ after Batch 6 Decision-Source Compression on May 30, 2026.

Current status:
- Batch 6B/6B-Proof/6C/6D/6E/6F are complete.
- DS-064/065/066 launch-risk compression is complete with known broader follow-up.
- Launch-Risk Compression Audit found no clear P0 canonical-present launch blocker.
- Controlled launch is acceptable with monitoring if live regression passes.
- Full ledger closure is no longer required before controlled launch.
- Next step is live regression set:
  1. Clean Screening
  2. Messy Screening
  3. Clean Underwriting
  4. Messy Underwriting
  5. Acquisition/current-debt edge case
- Do not start broad DS-065/066 cleanup before live regression unless a regression exposes a launch-blocking issue.
- Do not overclaim public self-serve readiness until live regression passes.

## A. Current controlling status

- InvestorIQ Decision-Source Elimination remains the controlling architecture cleanup track.
- The original audit estimated approximately 132 duplicate decision-making paths / truth-makers.
- The ledger tracks 70 explicit DS rows/groups plus grouped expansion clusters.
- We are no longer treating closure of every DS row as a pre-launch requirement.
- Latest launch-risk compression audit says: controlled launch acceptable now with monitoring.
- No clear P0 launch-blocking canonical-present risk was found.
- Live regression is now the launch gate.
- Full ledger closure is not required before controlled launch.
- Do not state Full Underwriting is fully public self-serve launch-ready until live regression passes.

## B. Today's completed Batch 6 work

Batch 6B - Canonical State Propagation + Provenance Guard Hard-Lock
- generator now passes canonical states into source-report-coverage QA.
- source-report-coverage QA emits authority_provenance and canonical/fallback state source markers.
- report-contract QA no longer treats fallback-derived current debt state as canonical authority.

Batch 6B-Proof - Runtime Behavioral Proof Hardening
- runtime behavioral proof now covers canonical-present, canonical-absent fallback, report-contract provenance behavior, and generator canonical-state helper propagation.
- source-level assertions reduced to backup where practical.

Batch 6C - DS-064 Residual Renderer Strip/Mutation Cleanup
- SECTION_4_NEIGHBORHOOD and SECTION_4_LOCATION_TABLE now obey canonical market_context visibility when canonical state exists.
- Data Coverage phrase-count stripping is legacy fallback only and cannot override canonical Data Coverage authority.

Batch 6D - Closure Audit
- audit-only.
- verdict: CLOSED WITH KNOWN BROADER FOLLOW-UP.
- found the remaining QA provenance tightening items and the final recommendation section guard.

Batch 6E - QA Provenance Guard Tightening
- report-contract QA provenance gates tightened.
- hasCanonicalCoverageAuthority(...) now requires explicit provenance authority flags.
- resolveCanonicalCurrentDebtStateForQa(...) no longer promotes fallback/unprovenanced current_debt_state to canonical truth.
- source-report-coverage QA treats explicit sectionEligibility as part of unified coverage/sufficiency authority.
- fallback_reconstructed current debt remains explicitly non-canonical.

Batch 6F - DS-064 Final Recommendation Canonical Guard
- SECTION_11_FINAL_RECS is now canonical-first.
- Added resolveFinalRecommendationSectionVisibility(...).
- Supports section eligibility keys:
  - final_recommendation
  - final_recommendations
  - final_recs
- canonical eligible/rendered keeps the section.
- canonical omitted/source_constrained strips the section.
- canonical absent preserves local narrative fallback.
- runtime helper-level tests added.

## C. Launch-risk compression result

- Controlled launch acceptable now with monitoring.
- No clear P0 remaining from the sweep.
- No current canonical-present path found that plausibly reintroduces false debt/refi math, acquisition-as-current-debt contamination, or wrong customer delivery decision.
- Remaining DS-064/065/066 work is P1/P2 hardening unless live regression proves otherwise.
- Live regression replaces full ledger closure as the next launch gate.

## D. Current next action

Current next action: run live regression set.

Regression set:
1. Clean Screening
2. Messy Screening
3. Clean Underwriting
4. Messy Underwriting
5. Acquisition/current-debt edge case

For each live regression, capture:
- PDF/report output
- analysis artifacts
- report_contract_qa
- source_report_coverage_qa
- qa_action_plan
- Dashboard/Admin Diagnostics evidence if relevant

Regression checklist:
- no false limitation headline
- Screening does not leak underwriting sections
- acquisition/proposed financing never treated as current debt
- DSCR/refi suppressed when current debt is not assessed
- current-debt/refi math only appears with verified current debt basis
- Data Coverage headline/severity obeys canonical state
- support docs are not used quantitatively unless canonical state supports it
- visible classification aligned across cover/executive/scorecard/risk surfaces
- no prohibited public language
- no internal parser/admin/vendor artifacts
- no unresolved tokens
- no DATA NOT AVAILABLE placeholders
- no mojibake
- no awkward N/A metric leaks

## E. Current working doctrine

- The launch goal is not a perfect codebase.
- The launch goal is safe, honest, deterministic, commercially credible reports.
- Launch-blocking risk means a plausible path to:
  - false financial conclusions
  - unsupported current debt / DSCR / refinance math
  - acquisition financing treated as current debt
  - wrong publish/fail/customer delivery decision
  - hidden material source limitation
  - visible trust-breaking contradictions
  - support-doc quantitative misuse
  - prohibited public/customer copy
- Launch-hardening/post-launch work can remain open if:
  - canonical authority wins
  - fallback is canonical-absent only
  - QA catches contradictions
  - unsafe sections collapse/omit/qualify
  - delivery gate prevents unsafe publication

## F. Supersession note

- Older notes saying Screening-first only or Full Underwriting must remain paused until full decision-source closure are superseded to the extent that the latest launch-risk compression audit says controlled launch is acceptable with monitoring if live regression passes.
- Historical caution remains relevant, but the current next step is live regression, not more blind patching.
- Do not state Full Underwriting public self-serve is approved until live regression passes.
- Do not state all decision-source rows are closed.
- Do not state Ken/public samples are ready.

---
# May 29, 2026 Addendum - Decision-Source Elimination Progress: Batch 2 Complete / Batch 3 Current Debt-Refi Complete Pending Ledger Update

## H. Fresh-chat continuation prompt update

We are continuing InvestorIQ after a long May 28/29 Decision-Source Elimination session.

Current state:
- Decision-source audit found ~132 duplicate decision-making paths; ledger tracks 70 explicit DS rows/groups.
- Batch 2 Delivery / Readiness Authority is completed and documented.
- Batch 3 Current Debt / Refi Authority is code-complete through Batch 3F and needs consolidated ledger update.
- Current strict Batch 3 status: DS-021 PARTIAL; DS-022 through DS-027 CLOSED.
- Immediate next step: update `!!INVESTORIQ_DECISION_SOURCE_ELIMINATION_LEDGER_2026-05-28.md` for Batch 3, then begin Batch 4 Acquisition / Current Debt Separation Authority.
- Do not start Batch 4 before Batch 3 ledger update.
- Keep prompts small, scope-locked, and strict about canonical authority vs duplicate decision-makers.

## A. Current controlling status

- The Decision-Source Elimination project is now the controlling architecture cleanup path.
- Original audit found approximately 132 decision-making paths / duplicate truth-makers across Screening + Full Underwriting.
- The ledger tracks 70 explicit DS rows/groups, with grouped rows representing clusters from the broader ~132-source audit.
- Closure standard remains strict:
  - CLOSED only when the old decision-maker can no longer override canonical truth.
  - PARTIAL when canonical authority exists but some broader/root/fallback architecture remains.
  - Legacy fallback is acceptable only when canonical truth cannot be overridden.
- The goal is not to add another helper layer; the goal is to retire, neutralize, quarantine, or convert duplicate authorities.

## B. Batch 2 - Delivery / Readiness Authority status

Batch 2 is consolidated and documented in the ledger.

Completed Batch 2 items:
- Stable canonical `deliveryDecisionState` shape created.
- Generator emits compatibility aliases derived from canonical delivery state.
- Worker consumes canonical delivery decision state.
- Worker credit-restore behavior respects canonical `credit_restore_required`.
- Worker terminal failure handling consolidated through `applyTerminalFailureOutcome(...)`.
- `restoreEntitlementForFailedJob(...)` remains the sole entitlement restore authority.
- `recordJobFailure(...)` routes through the terminal failure helper.
- Dashboard customer-facing status/message/guidance uses canonical customer status/message where present.
- Failed-file guidance is suppressed when canonical customer message exists.
- Report-contract QA treats delivery readiness as canonical-vs-render/payload conformance, not independent truth.

Batch 2 ledger result:
- CLOSED:
  - DS-049
  - DS-050
  - DS-051
  - DS-052
  - DS-059
  - DS-060
  - DS-061
- PARTIAL:
  - DS-068 broader worker lifecycle/status-machine cluster
  - DS-069 broader Dashboard fallback/messaging architecture for older/non-canonical jobs

Important interpretation:
- Batch 2 customer-facing delivery/readiness override risk is materially reduced.
- DS-068 and DS-069 remain broader architecture clusters, not active canonical override risks where canonical delivery/customer state exists.

## C. Batch 3 - Current Debt / Refi Authority status

Batch 3 code patches are complete through Batch 3F and now need a consolidated ledger update.

Completed Batch 3 sequence:
- Batch 3A audit-only mapped current debt/refi authority rows.
- Batch 3B standardized canonical current-debt field contract and scorecard DSCR consumption.
- Batch 3C hard-locked refi debt basis/render-state/narrative behavior to canonical current-debt state.
- Batch 3D converted debt/refi QA from rendered-text truth inference into canonical-vs-render conformance.
- Batch 3E closure audit found one final QA artifact/inventory inference blocker.
- Batch 3F locked QA canonical-present precedence so artifact/inventory debt heuristics are fallback-only when canonical current-debt payload is absent.

Batch 3 current strict status:
- PARTIAL:
  - DS-021
- CLOSED:
  - DS-022
  - DS-023
  - DS-024
  - DS-025
  - DS-026
  - DS-027

DS-021:
- `buildCurrentDebtAssessmentState(...)` is now the canonical current-debt root authority / owner candidate with standardized field contract.
- Keep DS-021 PARTIAL because it is the family root authority, not a duplicate to delete.
- Downstream override risks are tracked and closed through DS-022 to DS-027.

Closed-row interpretation:
- DS-022: Scorecard DSCR consumes canonical current-debt state. If canonical debt exists and is not computed, no numeric DSCR is backfilled from legacy fallback.
- DS-023: `resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback(...)` is retained only as canonical-absent compatibility and cannot override canonical not-assessed state.
- DS-024: `resolveCanonicalRefiDebtBasis(...)` obeys canonical current-debt state. Non-computed canonical state returns no true debt balance, annual debt service, or DSCR; computed state uses canonical balance/service/DSCR.
- DS-025: `buildRefiDebtRenderState(...)` allows debt/refi math only when canonical debt is computed/eligible. Acquisition-only, source-limited, and not-assessed paths remain non-quantitative.
- DS-026: `resolveRefiNarrativeMode(...)` is now a read-only wording adapter and cannot upgrade not-assessed/source-limited states into assessed current-debt/refi messaging.
- DS-027: `extractCurrentDebtDscrValues(...)` is evidence-only. Report-contract QA resolves canonical current-debt state first, checks rendered DSCR/refi surfaces for conformance, and uses artifact/inventory debt heuristics only as canonical-absent fallback.

## D. Current scoreboard

- Total explicit DS rows/groups: 70
- Fully closed before Batch 3: 7
- Newly closed in Batch 3: 6
- Fully closed now: 13 / 70
- Partial/in progress includes at least:
  - Batch 1 classification rows
  - DS-021
  - DS-047 / DS-048 if still partial
  - DS-068 / DS-069
- Do not treat this as final unless the ledger says otherwise; ledger remains source of truth for row counts/statuses.

## E. Immediate next step

1. First, update the decision-source ledger for Batch 3 consolidated completion.
2. Then begin Batch 4.

Batch 4 expected focus:
- Acquisition / Current Debt Separation Authority.
- This should handle acquisition/current-debt separation issues, not reopen Batch 3 unless a regression proves canonical debt/refi gates were bypassed.

Do not start Batch 4 until the Batch 3 ledger update is done.

## F. Still active working rules

- Micro-prompts only.
- Audit before patch.
- No broad refactors.
- No tactical symptom patches.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off production values.
- Tests are not substitutes for production root-cause fixes.
- Renderer should consume canonical state, not re-decide truth.
- QA should be conformance/safety net, not primary truth-maker.
- Legacy fallback is allowed only when canonical payload is absent or cannot be overridden.
- Vercel Hobby constraint remains active; do not casually add new API/serverless routes.
- No public AI wording.
- No BUY/SELL/HOLD language.
- Customer-deliverable does not equal public/sample/high-value ready.
- Full Underwriting public self-serve remains paused until architecture consolidation and live retesting prove stability.

## G. Supersession note

- This May 29 addendum supersedes older "audit before further patches" language only to the extent that Batch 2 and Batch 3 have now been executed.
- The broader decision-source audit doctrine remains controlling.
- Older RF/PR/live-retest next-step notes remain historical unless reaffirmed later.
- Current next action is Batch 3 ledger update, then Batch 4.

---
# May 28, 2026 Addendum - Controlling Status: Decision-Source Audit Before Further Patches

## A. Recent completed work

1. PR5 enforcement sequence completed/committed.

2. Slice 6 completed/committed.
- `DCF_EXIT_CAP_SOURCE_OVERCLAIM` guard was calibrated.
- Root cause was guard matching `verified exit cap` inside conservative negated wording such as `not a verified exit cap`.
- Guard now catches true document-derived/verified exit-cap overclaims and does not flag conservative `not a verified exit cap` wording.

3. Full Underwriting launch-certification matrix smoke completed/committed.
- `tests/qa/full-underwriting-launch-certification-matrix-smoke.js`
- Test-only.
- Aggregates existing invariants across:
  - clean current debt
  - acquisition-only
  - current debt + acquisition context
  - messy support docs
  - property-tax binding contamination
  - DCF cap-rate provenance
  - readiness blocker hierarchy
- Does not replace live queue-to-published gauntlet testing.

## B. Latest live gauntlet result

- 124 Richmond MESSY Full Underwriting live report published and was customer-deliverable.
- It was not public/sample/Ken/high-value-outreach ready.
- Delivery gate correctly allowed customer delivery while blocking public/high-value readiness.
- Support-doc contamination fixes mostly held:
  - Phase I/environmental remained context-only.
  - Zoning/compliance remained context-only.
  - Market survey did not override rent roll.
  - DCF/cap-rate provenance used standardized/framework-style wording, not unsupported document-derived exit-cap wording.
- Recurring structural decision-sprawl still surfaced:
  - rendered classification showed `Review - Insufficient Core Support` while contract QA expected `Review - Debt Coverage Constraint`;
  - occupancy QA produced a likely false positive by treating a non-occupancy percentage as occupancy;
  - messy acquisition source text still under-recovered purchase price/lender fee fields despite source text such as `Price ref: 1,250,000 -> Loan $937,500` and `Fees 1% lender fee + legal.`

## C. Updated root diagnosis (controlling)

- This is no longer treated as one more underwriting report bug.
- Controlling diagnosis: duplicate truth-makers / decision-sprawl across report generation.
- Contract QA improved but still often catches drift after render rather than preventing renderer drift.
- Architecture must shift from contract-QA-after-render to contract-driven rendering with canonical decision authority.
- Renderer, QA, action plan, delivery gate, dashboard, parsers, and report surfaces may still contain duplicate decision-makers.

## D. New immediate next step (controlling)

- Codex is now running an audit-only task:
  - `InvestorIQ Report Decision-Source Audit - Screening + Underwriting`
- Audit scope must cover both report types and produce full decision-path inventory for:
  - report type/tier
  - visible classification/verdict/risk profile
  - scoring
  - core document sufficiency
  - T12 truth
  - rent roll truth
  - debt/refi truth
  - acquisition financing truth
  - DCF/cap-rate/valuation truth
  - property tax truth
  - support-doc treatment
  - renovation/CapEx truth
  - section eligibility/rendering
  - Data Coverage
  - QA systems
  - delivery/readiness decisions
  - dashboard/customer status decisions
- Audit-only constraints remain strict: no file changes during that audit.
- No new patches should start until that audit is reviewed.

## E. Launch strategy / pricing discussion status

- Screening-first launch remains a possible path.
- Positioning discussion remains open: whether `Screening Report` undersells the product versus a `Deal Intelligence Memo` / `Acquisition Review Memo` framing.
- Current honest pricing stance under discussion:
  - Screening/Deal Intelligence likely viable around `$199-$299` launch pricing.
  - `$499` Screening-only likely risky unless repositioned/bundled.
  - Full Underwriting `$1,499` remains aspirational until public self-serve Full Underwriting is certified.
- Full Underwriting public self-serve remains paused.
- Full Underwriting may remain controlled beta / not public self-serve while architecture consolidation proceeds; this must not create an ordinary customer admin-review/manual-review outcome.
- Do not change `src/pages/Pricing.jsx` from this documentation update alone.

## F. Superseded older next-step notes

- Older notes that state RF-5/RF-6/RF-7/RF-8 are next immediate build slices are superseded by this May 28 decision-source audit gate.
- Older language that implies PR5/RF completion means Full Underwriting is near launch-ready is superseded.
- Older language directing immediate continued controlled live retesting is superseded until audit review is complete.
- Historical context remains intentionally preserved below.

## G. Current working rules (controlling)

- No more tactical symptom patches.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off values.
- Audit before patch.
- Identify duplicate truth-makers before creating canonical architecture.
- Screening and Underwriting must both be audited.
- Tests are not substitutes for production root-cause fixes.
- Vercel Hobby constraint remains active; do not casually add new serverless/API route files.
- No public AI wording.
- No BUY/SELL/HOLD language.
- Customer-deliverable does not equal public/sample/high-value ready.

---
# May 27, 2026 (Late Night) Addendum - Full Underwriting Launch-Hardening Current Controlling Status

## A. Current committed status

1. PR5 complete/committed
- Full UnderwritingState/render-boundary hardening completed.
- Current debt/refi, acquisition/proposed financing, property-tax binding, visible classification, Data Coverage, and optional section eligibility are now centrally protected through the PR5 path.
- Full-render/customer HTML smoke coverage exists for major PR5 gates.

2. First controlled clean Full Underwriting live retest completed
- Published successfully through queued/extracting/underwriting/scoring/rendering/pdf_generating/publishing/published.
- Customer-deliverable result confirmed.
- Not yet external/public-sample/Ken-ready at that checkpoint because second-layer label/QA consistency issues were still being closed in RF slices.

3. RF-1 complete/committed
- RF-1A fixed support-role label alignment and acquisition QA calibration.
- Market/rent survey files render as market/rent context only (not rent-roll support).
- Accepted purchase assumptions used for acquisition context render as Displayed / Limited Use (not Listed but Not Quantitatively Modeled).
- `purchase_price_not_verified` no longer emits when acquisition triangle verification already verifies purchase price.
- RF-1B added targeted smoke/contract hardening for those exact regression paths (test-only).

4. RF-2 complete/committed (test-only)
- Worker/publication lifecycle publication-guard smoke expanded.
- Publish path now contract-locked to valid `.pdf` storage path + non-empty report type + deliverable gate + `holdDelivery=false`.
- Historical RF-2 note superseded in part: missing/invalid path and `user_needs_documents` remain blocked/fail-closed paths; legacy `admin_review_required` must be audited/demoted and must not remain an ordinary customer outcome.
- Worker source-contract assertions confirm typed-gate outcomes do not proceed into published transition and restore-entitlement routing remains centralized.
- Direct end-to-end Supabase credit-restoration replay intentionally deferred (would require broad mocking/refactor).

5. RF-3 complete/committed (test-only)
- Core document routing/content-rescue smoke added.
- Filename/upload slot are contract-locked as hints only, not modeled authority.
- Filename-only `Rent Roll.xlsx` / `T12.pdf` do not become Modeled Inputs.
- Parser source contracts confirm deterministic content-based rescue paths exist for `rent_roll <-> t12` where validation supports it.
- Unsafe rescue remains limited/fail-closed (market survey, broker email, Phase I/environmental/zoning do not contaminate modeled core surfaces).
- No AI expansion.

6. RF-4 complete/committed
- **Files changed:** `api/_lib/report-contract-qa.js`, `tests/qa/report-contract-qa-smoke.js`.
- **Production touched:** yes, tiny deterministic QA-contract addition only.
- **Added contract check:** `DOCUMENT_TREATMENT_DUPLICATE_CATEGORY_CONFLICT` catches same-file dual listing under Modeled Inputs and Listed but Not Quantitatively Modeled.
- **RF-4 invariant coverage strengthened:** classification consistency, debt/refi not-assessed consistency, acquisition/current-debt separation, Data Coverage/document-treatment consistency, source reconciliation consistency, and public/customer copy guardrails.
- **Validation passed:** `node --check api/_lib/report-contract-qa.js`, `node --check api/generate-client-report.js`, `node tests/qa/report-contract-qa-smoke.js`, `node tests/qa/full-underwriting-gates-full-render-smoke.js`, `node tests/qa/generate-client-report-rent-roll-smoke.js`, `node tests/qa/property-tax-binding-finalhtml-smoke.js`, `node tests/qa/refi-gate-not-assessed-finalhtml-smoke.js`, `node tests/qa/acquisition-triangle-collapse-finalhtml-smoke.js`, `node tests/qa/core-doc-routing-rescue-smoke.js`, `git diff --check` (CRLF warnings only).
- **Remaining RF-4 limitation:** still QA-contract/smoke-level hardening, not a full DB-backed publication workflow simulator.

## B. Remaining families after RF-4

- RF-5: Dashboard Delivery Visibility / Report History Assumption Check
- RF-6: Admin Diagnostics / Reason-Code Precision
- RF-7: Remaining UnderwritingState Fallback Cleanup Audit
- RF-8: Customer/Public Copy Doctrine Sweep

## C. Current guidance

- RF-4 was the last heavy report-quality/root-leak family in this sequence; RF-5..RF-8 should be smaller audit/smoke/copy/diagnostic slices unless a real issue is exposed.
- RF-4 is now committed; proceed to RF-5 by default unless there is a strong reason to run another controlled clean live retest first.
- Keep prompts small, direct, and scope-locked.
- Continue Vercel Hobby constraint discipline: do not add API/serverless route files casually.
- No broad refactors.
- No public AI wording.
- No BUY/SELL/HOLD recommendation language.
- Customer-deliverable does not equal external/public-sample-ready.
- Quality bar is universal: normal customers, Ken Dunn, and public samples require the same elite document-driven deterministic credibility.

## D. Superseded note

Older sections below that state PR5 is pending, RF slices are not started, or that next step is PR1/PR2/PR3/live retesting before RF closure are historical and superseded by this addendum.

---
# May 27, 2026 (Night) Addendum - Current Controlling Status (Supersedes Older Next-Step Notes)

## A. Completed launch-hardening sequence (committed)

1. BLK-1 completed/committed
- Scorecard-facing current debt coverage no longer falls back to legacy/raw mortgage values when canonical current debt status is not computed.
- `resolveCanonicalCurrentDebtScoreInputs(...)` returns `currentDebtCoverage: null` and `usedCanonicalState: false` when canonical current debt is not computed.
- `buildCurrentDebtScorecardEntry(...)` treats null coverage as not assessed and does not render DSCR score rows from raw mortgage fallback.
- This closes scorecard/body drift where body says current debt/refi is not assessed.

2. BLK-3 Part 1 completed/committed
- Added `tests/qa/refi-gate-not-assessed-finalhtml-smoke.js`.
- This is finalHtml-like/helper-assembly coverage, not a true full `generateClientReport()` customer HTML invocation.
- It proves not-assessed current debt/refi output does not include: Maximum Financing Envelope; Base Case Supportable Loan; Current loan balance / Interest rate / Amortization / Refinance cap rate rows; Refinance proceeds/debt-balance surfaces; Current Debt DSCR / DSCR (Current Debt) scorecard rows.

3. BLK-3 Part 2 completed/committed
- Added `tests/qa/acquisition-triangle-collapse-finalhtml-smoke.js`.
- This is finalHtml-like/helper-assembly coverage, not a true full `generateClientReport()` customer HTML invocation.
- It proves unsafe/inconsistent acquisition triangle output collapses to disclosure, contradictory Proposed Acquisition Debt Sizing rows do not render, lender fee/closing costs do not render as bogus `0.0%` when unverified, and proposed acquisition financing remains separate from current outstanding debt.

4. BLK-3 Part 3 completed/committed
- Added `tests/qa/property-tax-binding-finalhtml-smoke.js`.
- This is finalHtml-like/helper-assembly coverage, not a true full `generateClientReport()` customer HTML invocation.
- It proves only the validated/bound property-tax source receives `Structured property tax input`; unbound tax-like support, Phase I/environmental, and zoning/compliance remain non-modeled/context-only.

5. BLK-2 completed/committed
- Patched acquisition financing artifact provenance pollution.
- `normalizeAcquisitionFinancingArtifactPayload` no longer back-mutates parsed/source fields with recovered/derived renderer values.
- `purchase_price`, `stated_acquisition_loan_amount`, `loan_amount`, `lender_fee_percent`, and `derived_acquisition_loan_amount` are populated only from explicit payload/source fields/aliases.
- Recovered/derived values are separated under `_renderer_derived_fields` (including `purchase_price_from_text`, `stated_acquisition_loan_amount_from_text`, `lender_fee_percent_from_text`, `derived_acquisition_loan_amount_from_purchase_ltv`).
- Existing acquisition collapse finalHtml-like smoke still passes.

## B. Critical caveats / tracked follow-up

- BLK-3 caveat remains: the three finalHtml-like smokes are helper-assembly coverage, not true full-generator/full-render customer HTML regression coverage.
- Required pre-launch hardening item: add a dedicated true full-generator/full-render regression harness proving the actual customer-report path cannot bypass:
  1. refi/debt not-assessed gate
  2. acquisition triangle collapse gate
  3. property-tax source-binding/document-treatment gate
- Follow-up provenance cleanup: review whether `ltv`, `interest_rate`, and `amortization_years` should also be separated into explicit source fields vs `_renderer_derived_fields` when recovered only from free text. Do not patch ad hoc; handle under a future canonical acquisition/provenance cleanup pass.

## C. Doctrine clarification (controlling)

- Goal is not zero bugs forever; goal is to stop recurring root-class/sub-class contradictions from escaping into live testing.
- Customer outcome model remains:
  1. Whole report fails closed only when required core evidence is unusable/unreadable/unverifiable enough that no defensible report can be published.
  2. Otherwise, report publishes and unsupported/missing/contradictory section-level inputs collapse/omit/qualify/disclose affected sections/lines.
  3. Admin diagnostics capture recurring section-level limitations/bugs for product intelligence and deterministic follow-up patches.
- Admin review is not a normal customer outcome. Diagnostics are product-learning intelligence, not routine manual review.

## D. Current status and next likely steps

- BLK-1: done/committed.
- BLK-3 Part 1: done/committed.
- BLK-3 Part 2: done/committed.
- BLK-3 Part 3: done/committed.
- BLK-2: done/committed.
- Live testing: still paused.
- PR 5 / UnderwritingState: deferred unless the final checkpoint says it is needed now.

Likely sequence:
1. Documentation update now (this addendum).
2. Consider a true full-generator/full-render regression harness PR.
3. Final Emergent repo-wide Full Underwriting audit.
4. Decide whether PR 5 is required before controlled live testing.
5. Only then resume controlled live testing.

Older references below that say PR 1/2/3 are next, that live retesting resumes immediately, or that launch-readiness is already confirmed are historical context and superseded by this May 27, 2026 controlling addendum.

---
# May 26, 2026 (Late Evening) Addendum - PR 1 + PR 4 Micro Completed / Launch Path Still Open

## A. Architecture cleanup completed tonight

1. PR 1 - Property-tax per-file binding
Status: completed and committed.
Outcome: Renderer document-treatment property-tax modeled/support labels are now bound to the validated property-tax source file identity. Missing, unreliable, or mismatched binding fails safe to neutral non-modeled treatment. This prevents Phase I ESA, environmental, zoning/compliance, appraisal, market survey, or generic support docs from being labeled as property-tax support solely because propertyTaxPayload exists elsewhere.

2. PR 4 micro - Renderer consumes support-doc taxonomy
Status: completed and committed.
Outcome: generate-client-report.js now imports uildSupportDocTaxonomyState, and uildDocumentTreatmentSummaryHtml uses canonical taxonomy semantic_doc_role as primary authority for support-doc role classification. Existing semantic_doc_role is fallback only when taxonomy role is absent/non-useful. Inline regex/filename logic remains fallback only. PR 1 property-tax per-file binding remains intact.

## B. Launch-strategy clarification (current)

- Rob has not made a final decision to launch Screening-only.
- Current launch strategy is still undecided.
- Full Underwriting cleanup is being executed now to preserve the option of launching Screening + Full Underwriting together if Full Underwriting reaches the universal quality bar.
- Do not automatically convert Pricing Underwriting to invite-only unless Rob explicitly decides Full Underwriting will not be public self-serve at launch.
- Emergent's Pricing invite-only recommendation remains a fallback launch-safety option, not an approved patch.

## C. Next architecture sequence

1. PR 2 - Acquisition triangle pre-render gate (next).
2. PR 3 - Refi / Debt state machine.
3. PR 5 - UnderwritingState skeleton (explicitly deferred until after PR 1 + PR 4 canonical consumption proof).

## D. Proven pattern from tonight

- Canonical helper logic must be consumed by the renderer to matter; exported-only canonical helpers do not prevent rendered drift.

---
# May 25/26, 2026 Addendum - Full Underwriting Architecture Audit / Whack-a-Mole Freeze / Screening-First Launch Path

## A. New current status

- The May 24/25 root-class patches were completed/deployed/pass, but controlled live underwriting retests proved Full Underwriting still has structural report-quality drift.
- The issue is not one remaining bug; it is fragmented underwriting truth architecture.
- Full Underwriting is not public self-serve launch-ready.
- Screening remains the safer public launch path.
- Full Underwriting should be beta/invite-only/not public self-serve until canonical-state consolidation is completed; this must not create an ordinary customer admin-review/manual-review outcome.

## B. Safe UI/customer/admin patches completed

- AdminDashboard.jsx Slice 2A.2 completed/pass:
  - undefined `ai` expanded-row reference removed
  - AI Recovery fallback now deterministic: `None - deterministic only`
  - compact Triage empty state: `{title} - 0 jobs - all clear`
  - roadmap leak copy replaced with `No items today.`
  - Force-Fail confirmation modal added before executing existing forceFailJob call
  - no backend/API/doctrine/gating changes

- Dashboard.jsx customer launch copy cleanup completed/pass:
  - historical note: internal status labels were collapsed to customer labels; current doctrine should avoid customer review-limbo language and use Ready or Fail Closed/Unable to Publish as appropriate
  - historical note: failed-job header cleanup reduced raw error-code leakage; current doctrine should use fail-closed/credit-restored copy, not review-limbo copy
  - muted reference code remains for support
  - upload overlay changed to Submitting your documents
  - checkout toast changed to Your report credit has been added
  - Dashboard.jsx DATA NOT AVAILABLE copy replaced with sentence-case prose
  - no API/admin/report-engine/lifecycle changes

## C. Customer Launch Audit results

- Journey mostly safe, doctrine/copy/fail-closed handling unusually disciplined.
- Main customer trust risk was internal pipeline jargon/raw error-code leakage during waiting/failure; Dashboard copy cleanup addressed the highest-value items.
- Remaining launch blocker: public sample assets are broken/missing because LandingPage references public/samples paths that do not exist.
- Do not generate underwriting sample assets from current flawed underwriting PDFs.
- STRONG BUY remains in dead/orphan chain; verify build/dist grep before public launch, but do not edit dead chain unless it reaches dist or active routes.
- Recommended current stance: do not touch orphan/dead-code cleanup pre-launch unless proven reachable.

## D. Live underwriting retest findings

1. Final Motherload underwriting 2:
- Published successfully and was likely customer-deliverable.
- Core T12/Rent Roll/current debt values mostly rendered correctly.
- Support-doc treatment mostly worked: Phase I/ESA was listed as not quantitatively modeled.
- But visible contradiction remained:
  - Refinance Stability header said refinance stability was not assessed due to missing current debt/refi inputs.
  - Later debt sections rendered current debt balance, rate, amortization, DSCR, and DSCR sensitivity.
- Root symptom: refinance header and debt body read different state/authority.

2. 124 Richmond CLEAN underwriting 2:
- Published, but not public-sample/high-value-ready.
- Visible failures persisted:
  - Phase I ESA rendered as Structured property tax input in Data Coverage.
  - Acquisition financing table rendered purchase price and stated acquisition loan amount both as $937,500, despite source language indicating loan amount at a higher purchase price.
  - Closing costs rendered 0.0% despite source lender fee evidence.
  - QA artifacts detected high-severity rendered-contract issues only after PDF rendering.
- Root symptom: renderer still bypasses canonical/QA-supported state and reads raw/fallback/local classification paths.

## E. Emergent Full Underwriting Architecture Audit - controlling diagnosis

- Root cause is architectural, not one more parser/label bug.
- There is no complete canonical UnderwritingState object.
- Existing `buildRendererCanonicalState` is partial and does not own all 18 critical underwriting truth families.
- The renderer is still acting as classifier/calculator/label generator/template engine.
- `buildDocumentTreatmentSummaryHtml` has its own inline regex/classification chain.
- `buildSupportDocTaxonomyState` exists, but renderer does not consistently consume it; QA consumes it.
- QA runs after finalHtml exists, so it detects contradictions too late to prevent customer-visible PDF issues.
- Root-class patches have been fixing individual authority paths, not replacing the authority model.
- Architecture risk: fragmented truth model; Full Underwriting is too fragile for public self-serve launch without canonical-state consolidation.

## F. Strategic decision / doctrine update

- Freeze tactical one-off Full Underwriting patches unless they are part of the canonical-state roadmap.
- Stop prompts like:
  - add one more regex
  - add one keyword to classifier
  - patch this exact refinance permutation
  - patch this exact visible label
  - add another post-render QA detector as primary fix
- Screening-first public launch is the recommended path.
- Full Underwriting may remain visible only as invite-only/beta/not public self-serve or unavailable for self-serve until consolidation; this must not create an ordinary customer admin-review/manual-review outcome.
- Public sample assets should use Screening first unless/until Full Underwriting passes sample-grade QA.
- Do not flip DocRaptor production mode or create underwriting sample assets from flawed PDFs.

## G. 99.999% Full Underwriting reliability requirements

1. Complete immutable UnderwritingState owning operating, rent roll, current debt, acquisition financing, refinance, valuation, property tax, support docs, data coverage, classification, section eligibility, diagnostics.
2. Renderer must consume UnderwritingState, not raw parser payloads.
3. Pre-render contract gates must collapse/qualify/omit before HTML is assembled.
4. Section-level narrative state machines so header/body cannot disagree.
5. Rendered QA becomes safety net, not primary authority.
6. Per-file binding for modeled support docs, especially property tax/appraisal/mortgage.
7. Acquisition triangle validation before render.
8. Refi/current-debt narrative state machine.
9. 120-ish fixture matrix / snapshot harness or equivalent broad regression coverage.
10. Separate customer-delivery gate from public-sample/high-value-outreach gate.

## H. Current active next step

- Emergent is running/should run Underwriting Renderer Canonical Consumption Audit.
- Goal: map every non-canonical/raw/fallback read in api/generate-client-report.js across the 18 underwriting truth families.
- No code edits during this audit.
- Do not run another Full Underwriting patch until the canonical consumption map is reviewed.

After that:
1. Decide Screening-first launch implementation steps.
2. Use Codex for the first implementation PR only after the consumption audit identifies the highest-leverage architectural patch.
3. Likely first candidates:
   - renderer consumes canonical support-doc taxonomy
   - acquisition triangle pre-render gate
   - refi/current-debt narrative state machine
   - UnderwritingState skeleton

## I. Current working rules

- Micro-prompts only.
- One task at a time.
- Audit before patch.
- No broad refactor unless explicitly scoped.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off values in production logic.
- No more whack-a-mole renderer regex patches.
- Screening public launch path is allowed to move forward while Full Underwriting consolidation continues.
- Full Underwriting public self-serve is paused pending architecture consolidation.

## J. Fresh-Chat Continuation Prompt

We are continuing InvestorIQ after the May 25/26 Full Underwriting Architecture Audit.

Current controlling status:
- May 24/25 root-class patches were completed/deployed/pass but live underwriting retests proved Full Underwriting still has structural fragmented-truth failures.
- Full Underwriting is not public self-serve launch-ready.
- Screening is the recommended public launch path.
- Full Underwriting should be invite-only/beta/not public self-serve until canonical-state consolidation; this must not create an ordinary customer admin-review/manual-review outcome.
- AdminDashboard Slice 2A.2 and Dashboard.jsx launch-copy cleanup are safe/pass.
- Customer launch audit found missing sample assets as the remaining major public launch blocker.
- Do not create underwriting sample assets from flawed underwriting PDFs.
- Emergent is running the Underwriting Renderer Canonical Consumption Audit.
- Do not run another tactical underwriting patch until the canonical consumption map is reviewed.

Immediate next work:
1. Complete/review Emergent canonical consumption audit.
2. Decide Screening-first public launch implementation.
3. Then scope first architectural Full Underwriting PR.

Do not:
- start Admin Slice 2B
- patch another one-off underwriting renderer symptom
- add classifier keywords/regex branches
- rotate secrets mid-debug
- flip DocRaptor production mode yet
- disable GitHub worker yet
- generate public underwriting samples from current flawed PDFs

---
# May 24/25, 2026 Addendum - Canonical Render Parity Contracts Completed / Admin Diagnostics Slice 2A Deployed / Next Step Retest

## A. Completed Root-Class + Admin Diagnostics Status (May 24/25)

1. SUPPORT_DOC_TREATMENT_CONTRACT_GAP
Status: patched, committed, deployed/pass.
Outcome: Environmental / Phase I / ESA / zoning / compliance docs cannot be rendered as property-tax support or structured property-tax inputs. Deterministic contract enforcement exists; advisory AI is not the authority.

2. ACQUISITION_FINANCING_CANONICALIZATION_GAP
Status: patched, committed, deployed/pass.
Outcome: Acquisition/proposed financing canonicalization now handles clean/messy/shorthand term-sheet formats generally, including purchase price, stated acquisition loan amount, derived acquisition loan amount, LTV/rate/amortization, lender/origination/financing fees, and unquantified legal/appraisal/closing notes. Acquisition/proposed financing remains separate from current outstanding debt unless true current debt balance evidence exists.

3. UNDERWRITING_DATA_COVERAGE_HEADLINE_OPTIONAL_LIMITATION_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Clean core T12 + Rent Roll coverage should not be mislabeled as severe source limitation just because optional/support sections are constrained. Optional underwriting constraints should be disclosed separately from core input sufficiency.

4. RENDERED_QA_CONTRACT_EXPANSION_FINAL_SWEEP
Status: completed, committed, deployed/pass.
Outcome: Final sweep expanded rendered contract coverage using tests-only/generalized coverage where appropriate. This was not a renderer rewrite.

5. ROOT-FAMILY_TAXONOMY_AUDIT
Status: completed audit-only.
Outcome: Audit identified canonical-value/rendered-value drift as the next root family and recommended targeted QA contracts instead of broad refactors.

6. SECTION_ELIGIBILITY_RENDER_DRIFT
Status: patched, committed, deployed/pass.
Outcome: If canonical section eligibility says current debt/refi/renovation sections are source-constrained, rendered output should not show computed/numeric modeled surfaces for those sections. Unsupported optional sections should collapse/qualify/omit instead of inventing outputs.

7. VERDICT_CAP_EXPLANATION_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Visible classification and explanation language must align with canonical verdict caps. Stable language cannot appear when source reconciliation, insufficient core support, or debt coverage constraints cap the report to Review-class labels.

8. CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Rendered current-debt DSCR values across customer-facing surfaces must match canonical computed current-debt DSCR within tolerance. Proposed/acquisition DSCR is excluded from current-debt DSCR parity.

9. RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Rendered Annual In-Place Rent and Annual Market Rent totals must match canonical rent-roll annual totals when canonical trusted totals exist. Partial-sample rent rolls without trusted summary totals are skipped.

10. OCCUPANCY_CANONICAL_VALUE_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Rendered current/rent-roll/physical occupancy must match canonical trusted occupancy within tolerance. Break-even, buffer, stress, sensitized, vacancy, and market occupancy contexts are excluded.

11. ACQUISITION_CANONICAL_VALUE_DRIFT
Status: patched, committed, deployed/pass.
Outcome: Rendered Proposed Acquisition Debt Sizing values must match same-label canonical acquisition payload values when both exist, including purchase price, stated acquisition loan amount, derived acquisition loan amount, and lender/origination/financing fee. Contract is scoped only to Proposed Acquisition Debt Sizing, not current debt/refi/scorecard/risk register.

12. SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT
Status: patched, committed, deployed/pass.
Outcome: When canonical support-document role/treatment metadata exists, rendered document-treatment labels must not contradict canonical support role. Environmental, zoning/compliance, market survey, appraisal/background, qualitative, unmodeled, or limited-support docs cannot be rendered as property-tax support or modeled/structured underwriting inputs unless canonical metadata explicitly supports that class. Existing SUPPORT_DOC_TREATMENT_LABEL_CONTRACT remains active for obvious text leaks when canonical metadata is absent.

13. Admin Diagnostics Intelligence Layer Slice 1
Status: patched, committed, deployed/pass.
Outcome: Admin dashboard now has a read-only diagnostics intelligence rollup using existing QA artifacts. Explicit blocker booleans from report_contract_qa and source_report_coverage_qa take precedence over severity-derived fallback, so high-severity disclose-only diagnostics are not mislabeled as customer blockers.

14. Admin Diagnostics Slice 2A - Triage Workspace
Status: clean PR merged to main and Vercel production deployed green.
Outcome: AdminDashboard.jsx frontend-only restructure:
- "Admin Review / Fix Queue" renamed to "Triage Workspace"
- rows bucketed into Published With Diagnostics, Fail-Closed Core, and Operational Health
- delivery_gate_status underlying values unchanged
- Historical UI note superseded in part: legacy `admin_review_required` display work must not imply a normal customer review state; current doctrine requires Publish or Fail Closed + Restore Credit.
- operational recovery controls remain scoped
- emergency override controls remain locked and reframed as emergency-only, not report approval
- no backend/API/schema/customer-dashboard/package/env changes

All known May 24 root-class blocker patches from the active patch order have now been completed and deployed/pass. The current active next step is not another blind patch. The next step is a controlled live retest batch.

## B. Current Recommended Next Action

Run controlled live retests:
1. Clean Screening
2. Clean Full Underwriting
3. Messy Full Underwriting / acquisition-financing scenario
4. One fail-closed core-doc test if needed

For each retest, capture:
- PDF
- analysis_artifacts_rows.json
- any report_contract_qa / source_report_coverage_qa / qa_action_plan artifacts
- Admin Diagnostics view if relevant

Retest checklist:
- no Phase I / ESA / environmental / zoning / compliance doc appears as property-tax support
- Data Coverage headline distinguishes clean core coverage from optional/support constraints
- acquisition/proposed financing purchase price, stated loan, derived loan, fee, and closing notes render correctly
- acquisition/proposed financing is not treated as current debt
- current-debt DSCR/refi sections collapse/qualify when true current debt balance is absent
- canonical DSCR/rent-roll/occupancy/acquisition values match rendered values
- visible classification is aligned across cover/executive/scorecard/risk surfaces
- unsupported renovation/CapEx does not produce ROI/payback/rent-lift/NOI impact
- Screening does not leak underwriting sections
- no DATA NOT AVAILABLE / N/A metric placeholders / unresolved tokens / internal QA/admin/parser/artifact language / public AI language / mojibake
- Admin Diagnostics Triage Workspace appears as expected

## C. Active Patch Order (Current Checkpoint)

0. SUPPORT_DOC_TREATMENT_CONTRACT_GAP - done/deployed/pass
1. ACQUISITION_FINANCING_CANONICALIZATION_GAP - done/deployed/pass
2. UNDERWRITING_DATA_COVERAGE_HEADLINE_OPTIONAL_LIMITATION_DRIFT - done/deployed/pass
3. RENDERED_QA_CONTRACT_EXPANSION_FINAL_SWEEP - done/deployed/pass
4. ROOT-FAMILY_TAXONOMY_AUDIT - done audit-only
5. CANONICAL VALUE / RENDERED VALUE DRIFT CONTRACTS:
   - CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT - done/deployed/pass
   - OCCUPANCY_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - ACQUISITION_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT - done/deployed/pass
6. Admin Diagnostics Slice 1 - done/deployed/pass
7. Admin Diagnostics Slice 2A - done/merged/deployed/pass
8. NEXT: canonical consumption audit + Screening-first launch decision. (supersedes controlled live retest batch)

## D. Doctrine (Unchanged)

- Publish vs fail-closed remains the operating model.
- Admin review is not a normal customer outcome.
- Entire-report fail-closed only when core T12/Rent Roll are unusable/missing/unreadable/materially invalid or true system/runtime/storage failure blocks generation.
- Optional/support/section-specific limitations should collapse, omit, qualify, disclose, or render Not Assessed where appropriate.
- Unsupported optional/support issues should emit structured diagnostics.
- Diagnostics are product intelligence, not routine manual review.
- Universal report-quality standard for customers, public samples, and high-value outreach.
- No Ken/public/customer quality-tier distinction.
- Root-class patches must be generalized with anti-hardcode proof/tests.
- No report-specific hacks.

## E. Fresh-Chat Continuation Prompt (Updated)

We are continuing InvestorIQ after the May 24/25 root-class hardening sprint.

Completed/deployed/pass:
- SUPPORT_DOC_TREATMENT_CONTRACT_GAP
- ACQUISITION_FINANCING_CANONICALIZATION_GAP
- UNDERWRITING_DATA_COVERAGE_HEADLINE_OPTIONAL_LIMITATION_DRIFT
- RENDERED_QA_CONTRACT_EXPANSION_FINAL_SWEEP
- ROOT-FAMILY_TAXONOMY_AUDIT audit-only
- SECTION_ELIGIBILITY_RENDER_DRIFT
- VERDICT_CAP_EXPLANATION_DRIFT
- CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT
- RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT
- OCCUPANCY_CANONICAL_VALUE_DRIFT
- ACQUISITION_CANONICAL_VALUE_DRIFT
- SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT
- Admin Diagnostics Slice 1
- Admin Diagnostics Slice 2A Triage Workspace

Current next step:
Superseded: canonical consumption audit + Screening-first launch decision.

Do not start Slice 2B yet.
Do not do broad refactors.
Do not rotate secrets mid-debug.
Do not flip DocRaptor production mode yet.
Do not disable GitHub worker yet.

---
# May 24, 2026 Addendum - Publish-vs-Fail Doctrine Refined / Section Diagnostics Strategy Locked / Support-Doc Contract Gap Patched / Next Root-Family Work

## A) New practical customer outcome doctrine

InvestorIQ should no longer treat admin review as a normal customer outcome.

Practical customer outcomes are:

```text
1. PUBLISH
2. FAIL CLOSED + RESTORE CREDIT

Entire-report fail-closed should occur only when required core evidence is unusable:

- T12 missing / unreadable / unparseable / materially invalid
- Rent Roll missing / unreadable / unparseable / materially invalid
- T12 or Rent Roll so contradictory or structurally unusable that InvestorIQ cannot justify publishing any defensible report
- true runtime/system/storage failure that prevents generation

If core T12 + Rent Roll are usable, the report should normally publish.

Non-core, optional, support-document, or section-specific issues should not fail the entire report.

Instead, the affected line/metric/section should:

- omit
- collapse
- qualify
- disclose
- render Not Assessed only where appropriate
- never fabricate missing values

Examples:

Missing current debt -> report publishes; current-debt DSCR/refi sections omitted or marked not assessed.
Unsupported appraisal -> report publishes; appraisal not used quantitatively.
Unsupported Phase I / Zoning -> report publishes; listed as non-modeled context or omitted.
Incomplete renovation budget -> report publishes; ROI/rent-lift/payback omitted unless source-supported.
Messy acquisition financing -> report publishes; only verified fields shown; unsupported fields omitted.
```

## B) Section-level fail-close diagnostics strategy

The most important new launch-confidence doctrine:

Unknown optional/support data should not block publication.
Unknown optional/support data should create diagnostics.
Unknown core data should fail closed.

Every time InvestorIQ omits, collapses, qualifies, or limits a section/line because source support is missing, ambiguous, unsupported, or failed validation, the system should emit structured internal diagnostics.

Purpose:

Turn real customer document messiness into product intelligence.
Use recurring diagnostics to identify sub-classes for future patches.
Do not use diagnostics as routine manual admin review.

Suggested diagnostic shape:

```json
{
  "event": "section_fail_closed",
  "job_id": "...",
  "report_type": "underwriting",
  "section": "acquisition_financing",
  "status": "omitted_or_qualified",
  "reason_code": "purchase_price_not_verified",
  "source_family": "loan_term_sheet",
  "customer_delivery_impact": "none",
  "report_quality_impact": "advisory_or_external_distribution_blocker",
  "input_fields_missing": ["purchase_price"],
  "input_fields_present": ["ltv", "interest_rate", "loan_amount"],
  "recommended_admin_bucket": "possible_parser_subclass",
  "rendered_behavior": "section qualified; no fabricated purchase price",
  "needs_code_patch": "unknown_until_recurs"
}
```

Admin dashboard / diagnostics rollup target:

Recurring diagnostics this week:
- purchase_price_not_verified: 7 reports
- market_survey_not_modeled: 12 reports
- renovation_roi_missing: 9 reports
- current_debt_not_assessed: 5 reports
- support_doc_unclassified: 14 reports

Interpretation:

This is how InvestorIQ can launch responsibly while continuing to improve.
Reports publish safely.
Unsupported sections fail closed at section level.
Diagnostics reveal recurring sub-classes that can be patched into stronger deterministic support over time.

## C) Root-class patch standard tightened

Every future "root-class" patch must prove it is system-level, not report-specific.

Required proof in Codex receipts:

1. Generalized invariant fixed
2. Anti-hardcode proof/tests
3. Multiple varied fixtures
4. Rendered contract QA coverage where applicable

Every root-class prompt should explicitly prohibit:

- hardcoding property names
- hardcoding filenames
- hardcoding report IDs
- hardcoding exact one-off fixture values outside tests
- patching only one PDF/report symptom

Use test reports only as regression evidence, not as the patch target.

Correct model:

Specific report exposed the hole.
Patch the fence, not the dog.

## D) SUPPORT_DOC_TREATMENT_CONTRACT_GAP patched

Confirmed Codex patch completed for:

SUPPORT_DOC_TREATMENT_CONTRACT_GAP

Problem:

Phase I ESA / environmental and Zoning / compliance documents could render in Data Coverage as property-tax support or Structured property tax input.

Files changed:

api/_lib/report-surface-contracts.js
api/generate-client-report.js
api/_lib/report-contract-qa.js
tests/qa/supporting-doc-classification-smoke.js
tests/qa/report-contract-qa-smoke.js
tests/qa/generate-client-report-rent-roll-smoke.js

Deterministic guard added:

buildSupportDocTaxonomyState(...)
- hasEnvironmentalSignals
- hasZoningComplianceSignals
- environmental/zoning role precedence before property-tax role selection
- even if declared/detected doc_type is property_tax, Phase I/ESA/environmental/REC signals force environmental_due_diligence
- zoning/compliance/permitted use/municipal zoning signals force zoning_compliance_context

Rendered label behavior:

Environmental / Phase I / ESA / REC:
Environmental due-diligence context only; not used quantitatively.

Zoning / compliance / permitted use:
Zoning/compliance context only; not used quantitatively.

Market survey / rent comps:
Market survey / rent context only; not used to override rent roll.

Unsupported appraisal:
Listed for auditability only; not used quantitatively.

True property-tax support:
Allowed only when property-tax semantics are present and validated annual-tax logic passes.

Hard report contract QA added:

code: SUPPORT_DOC_TREATMENT_LABEL_CONTRACT
severity: high
blocks_customer_delivery: false
blocks_public_sample: true
blocks_high_value_outreach: true

Trigger:

Rendered text shows Phase I / ESA / environmental / zoning / compliance near:
- property tax support
- structured property tax input
- modeled property tax input

Important interpretation:

This is deterministic contract enforcement, not advisory AI.
Advisory AI may still flag, but deterministic contract must enforce.

Validation reported:

node --check api/_lib/report-contract-qa.js
node --check api/_lib/report-surface-contracts.js
node --check api/_lib/source-report-coverage-qa.js
node --check api/generate-client-report.js
node tests/qa/report-contract-qa-smoke.js
node tests/qa/source-report-coverage-qa-smoke.js
node tests/qa/supporting-doc-classification-smoke.js
node tests/qa/generate-client-report-rent-roll-smoke.js
git diff --check

Status:

Pass to commit if not already committed.

## E) Current known blocker patch order

Next work should patch known confirmed blockers first, then run the broader root-family taxonomy audit.

Order:

0. SUPPORT_DOC_TREATMENT_CONTRACT_GAP
   Status: patched by Codex; commit if not already committed.

1. ACQUISITION_FINANCING_CANONICALIZATION_GAP
   Patch next.
   Must be a GENERAL acquisition/proposed-financing parser/canonicalization contract, not a 124 Richmond fix.

2. UNDERWRITING_DATA_COVERAGE_HEADLINE_OPTIONAL_LIMITATION_DRIFT
   Patch after acquisition.
   General rule:
   clean core T12 + Rent Roll coverage must remain CORE INPUT COVERAGE CONFIRMED;
   optional/support-section constraints get secondary disclosure only.

3. RENDERED_QA_CONTRACT_EXPANSION
   Build hard rendered checks into each patch where possible.
   Then do one final explicit rendered-contract sweep after acquisition and Data Coverage headline patches.

4. ROOT-FAMILY TAXONOMY AUDIT
   After known blockers are patched, have Codex map all root families, sub-classes, coverage, hardcode risks, and remaining gaps.

## F) Acquisition financing patch must be generalized

Do not patch only 124 Richmond.

Root family:

ACQUISITION_FINANCING_CANONICALIZATION_GAP

General invariant:

InvestorIQ must consistently canonicalize acquisition/proposed-financing evidence across clean, messy, shorthand, and table-style term sheets before render and QA consumption.

General field mapping:

Purchase price / asking price / acquisition price / price ref
-> purchase_price

Loan amount / proposed loan / acquisition loan / mortgage amount
-> stated_acquisition_loan_amount

LTV / loan-to-value
-> ltv

Interest rate / rate
-> interest_rate

Amortization / AM / amort
-> amortization_years

Lender fee / origination fee / financing fee
-> lender_fee_percent

Legal/appraisal/closing costs mentioned without amount
-> notes only, not 0.0%

Acquisition/proposed financing
-> never current outstanding debt unless document explicitly says current outstanding balance / existing mortgage / current principal balance.

Regression fixture examples may include, but must not be limited to:

Loan Amount (at $X purchase price) $Y
Price ref: X -> Loan Y
Purchase Price: X / Loan Amount: Y
Asking Price: X / Proposed Loan: Y
X purchase price, Y loan, Z% LTV
Fees 1% lender fee + legal

124 Richmond values are evidence/regression examples only, not production logic.

## G) Root-family taxonomy audit later

After the known blocker patches, run a repo-wide Root-Family Taxonomy Audit.

Purpose:

Stop patching isolated symptoms.
Map current root families, sub-classes, deterministic enforcement, rendered contract coverage, test coverage, anti-hardcode risks, and foreseeable adjacent gaps.

Expected families likely include:

1. Classification / visible verdict alignment
2. Current debt vs acquisition/proposed financing
3. Source reconciliation / canonical truth
4. Support-document treatment
5. Data Coverage / limitation taxonomy
6. Parser / extraction / recovery validation
7. Optional section rendering / collapse behavior
8. Report surface integrity / public language
9. Delivery gate / QA authority / readiness routing
10. Pipeline / dashboard / worker / entitlement operations

Audit should not patch at first.
Audit should return:

- root-family inventory
- known sub-classes
- current enforcement files/functions
- tests proving coverage
- rendered contract QA coverage: YES / PARTIAL / NO
- anti-hardcode audit
- missing rendered-contract coverage
- adjacent foreseeable sub-classes
- recommended patch order

## H) Updated launch confidence framing

InvestorIQ is launch-justifiable only if the operating model is:

Known root-class blockers patched.
Core docs either validate or fail closed.
Optional/support docs cannot contaminate modeled outputs.
Unsupported/missing optional inputs omit/collapse/qualify/disclose affected sections.
Every section-level omission/qualification emits diagnostics.
Diagnostics roll up recurring sub-classes for future patching.
Reports publish safely while the system keeps learning.

This is the product-learning loop:

Customer docs expose messy real-world cases.
InvestorIQ publishes safely using only verified support.
Unsupported parts fail closed at section level.
Diagnostics tell Rob what happened.
Recurring diagnostic sub-classes become future deterministic patches.

That is how InvestorIQ becomes stronger and smarter after launch without turning into a manual-review factory.

## I) Working rules still active

- Micro-prompts only.
- One task at a time.
- No broad refactors.
- No unrelated cleanup.
- SHORT FORM RECEIPT ONLY.
- No report-specific patches.
- Root-class patches require generalized invariant + anti-hardcode proof.
- Do not flip DocRaptor production mode yet.
- Do not disable GitHub worker yet.
- Do not rotate secrets mid-debug.
- Do not change Supabase Cron cadence unless explicitly chosen.
- Admin review should not be treated as a normal customer outcome.
- Publish if usable T12 + Rent Roll support a defensible report.
- Fail entire report only if core T12/Rent Roll cannot support a defensible report.
- Optional/support sections fail closed at section level, not whole-report level.

## J) Current status supersession note

As of May 24, new controlled batch retesting exposed new confirmed root-class blockers:
- support-doc treatment contract gap, now patched/pass-to-commit;
- acquisition financing canonicalization gap, next patch;
- underwriting Data Coverage headline optional-limitation drift, patch after acquisition;
- final rendered QA contract sweep, then root-family taxonomy audit.

This May 24 status supersedes earlier May 23 language that stated no active report-quality patch remained open.

---
---

## Quick Current Doctrine Summary

- Publish vs fail-closed remains the operating model.
- Admin review is not a normal customer outcome.
- Entire-report fail-closed only when core T12/Rent Roll are unusable, contradictory beyond defensible use, or true runtime/system/storage failure blocks generation.
- Optional/support issues fail closed at section/line level (omit/collapse/qualify/disclose; no fabrication).
- Diagnostics convert recurring limitations into deterministic patch intelligence.
- One elite report-quality standard.
- No Ken/public/customer report-quality tiers.
- No report-specific patches.
- Root-class patches require generalized invariant plus anti-hardcode proof/tests.

## Active Patch Order

Current checkpoint:
0. SUPPORT_DOC_TREATMENT_CONTRACT_GAP - done/deployed/pass
1. ACQUISITION_FINANCING_CANONICALIZATION_GAP - done/deployed/pass
2. UNDERWRITING_DATA_COVERAGE_HEADLINE_OPTIONAL_LIMITATION_DRIFT - done/deployed/pass
3. RENDERED_QA_CONTRACT_EXPANSION_FINAL_SWEEP - done/deployed/pass
4. ROOT-FAMILY_TAXONOMY_AUDIT - done audit-only
5. CANONICAL VALUE / RENDERED VALUE DRIFT CONTRACTS:
   - CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT - done/deployed/pass
   - OCCUPANCY_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - ACQUISITION_CANONICAL_VALUE_DRIFT - done/deployed/pass
   - SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT - done/deployed/pass
6. Admin Diagnostics Slice 1 - done/deployed/pass
7. Admin Diagnostics Slice 2A - done/merged/deployed/pass
8. NEXT: canonical consumption audit + Screening-first launch decision. (supersedes controlled live retest batch)

## Fresh-Chat Continuation Prompt

We are continuing InvestorIQ after the May 25/26 Full Underwriting Architecture Audit.

Current controlling status:
- May 24/25 root-class patches were completed/deployed/pass but live underwriting retests proved Full Underwriting still has structural fragmented-truth failures.
- Full Underwriting is not public self-serve launch-ready.
- Screening is the recommended public launch path.
- Full Underwriting should be invite-only/beta/not public self-serve until canonical-state consolidation; this must not create an ordinary customer admin-review/manual-review outcome.
- AdminDashboard Slice 2A.2 and Dashboard.jsx launch-copy cleanup are safe/pass.
- Customer launch audit found missing sample assets as the remaining major public launch blocker.
- Do not create underwriting sample assets from flawed underwriting PDFs.
- Emergent is running the Underwriting Renderer Canonical Consumption Audit.
- Do not run another tactical underwriting patch until the canonical consumption map is reviewed.

Immediate next work:
1. Complete/review Emergent canonical consumption audit.
2. Decide Screening-first public launch implementation.
3. Then scope first architectural Full Underwriting PR.

Do not:
- start Admin Slice 2B
- patch another one-off underwriting renderer symptom
- add classifier keywords/regex branches
- rotate secrets mid-debug
- flip DocRaptor production mode yet
- disable GitHub worker yet
- generate public underwriting samples from current flawed PDFs

## May 27, 2026 Addendum - Full Underwriting Cleanup Sequence Status

Completed and committed cleanup sequence:
1. PR 1 - Property-tax per-file binding.
2. PR 4 - Renderer consumes support-doc taxonomy authority.
3. PR 2 - Acquisition Triangle Pre-Render Gate.
4. PR 3 - Refi / Debt Render-State Gate.

PR 2 status summary:
- Full Proposed Acquisition Debt Sizing table renders only when acquisition triangle is valid/safe.
- Incomplete, inconsistent, or unsupported acquisition evidence collapses to disclosure.
- Contradictory purchase price / LTV / stated loan / derived loan fields are suppressed in collapsed mode.
- Missing/null fees no longer render as 0.0%.
- Text-derived lender fee does not render unless explicitly structured/verified.
- Acquisition/proposed financing remains separate from current outstanding debt.

PR 3 status summary:
- Added refi/debt render-state gate.
- Refinance/current-debt/DSCR/debt-capacity math surfaces render only when verified current debt basis exists.
- Source-limited or not-assessed current debt states collapse to disclosure.
- SCREENING_REFI_DATA_SUFFICIENCY_BLOCK no longer appends financing envelope/debt-capacity math unless debt math is valid.
- Acquisition-only proposed financing maps to not_assessed for current debt/refi math.
- Valid verified-current-debt cases preserve existing refi/debt math.

Testing and final-audit sequence update:
- Do not return to live testing yet.
- Finish the cleanup-sequence checkpoint first.
- Then run one final Emergent repo-wide Full Underwriting audit before live testing resumes.
- Emergent remaining credits are limited (roughly 40) and should be used strategically for that final underwriting/report-surface audit.
- Final Emergent audit objective: determine whether Full Underwriting is truly elite/launch-ready and catch remaining repo-wide/report-surface issues before additional testing.

Next-step status:
- PR 1, PR 4, PR 2, PR 3 are complete.
- PR 5 / UnderwritingState remains deferred unless the final checkpoint indicates it is necessary now.
- Next likely step after this context update: small audit-only checkpoint to decide whether any remaining micro patches are needed before the final Emergent audit.
# June 2, 2026 Addendum - Publish-or-Fail Doctrine Lock Completed (Closed)

## Status
- Publish-or-Fail Doctrine Lock: `CLOSED / PASS WITH KNOWN SAFE INTERNAL LEGACY`.
- Ordinary customer outcomes are now locked to:
1. `PUBLISH / READY`
2. `FAIL CLOSED + CREDIT RESTORED`
3. Normal processing states while running: `queued`, `extracting`, `underwriting`, `scoring`, `rendering`, `pdf_generating`, `publishing`

## Completed Slices
1. `qa-action-plan` Slice 1: ordinary `admin_review_required` / `under_review` customer emitters removed/demoted.
2. `qa-action-plan` Slice 1B: deprecated `admin_review_required` made reason-aware:
   - core-fail reasons -> fail-closed / legacy internal `user_needs_documents`
   - known non-core/report-surface reasons -> deliverable
   - unknown deprecated reasons -> deliverable + `DEPRECATED_ADMIN_REVIEW_REASON_REQUIRES_CLASSIFICATION`
3. `generate-client-report` Slice 2: hold-return now only for `delivery_gate_status === user_needs_documents`; deprecated `admin_review_required` treated as deliverable for ordinary generator behavior; fail-closed copy aligned.
4. `admin-run-worker` Slice 3: deprecated `admin_review_required` normalized to deliverable lifecycle behavior; admin-held publishing path removed; non-deliverable required-core/source outcomes fail closed via `applyTerminalFailureOutcome`; entitlement restore preserved.
5. `Dashboard` Slice 4/4B: customer-visible review/held/needs-doc/publication-held lifecycle labels removed; customer labels now `Ready`, `Failed`, or processing states; fail-closed wording aligned.
6. `AdminDashboard` Slice 5: legacy review/held semantics relabeled as internal/legacy diagnostics; admin emergency/diagnostic controls preserved.
7. Final repo search audit: remaining terms classified as safe internal/backend, admin-only legacy, tests, or docs; one unsafe Dashboard review-language leak removed.
8. Dashboard timing correction: restored acceptable processing-only timing copy:
   - `Report generation may take up to 24 business hours. You'll be notified when your report is ready.`
   - no review/held/needs-doc/manual-review framing reintroduced.

## Doctrine Clarifications
- `user_needs_documents` may remain only as internal/legacy fail-closed alias for required core-document failure.
- `admin_review_required` may remain only as deprecated/internal/legacy/admin diagnostic metadata.
- Public/sample/high-value blockers remain distribution metadata and must not block ordinary customer delivery.

## Next Step (Controlled Live Retesting)
1. Clean Screening lifecycle retest.
2. Confirm Dashboard processing copy/status behavior.
3. Confirm published report appears and downloads normally.
4. Confirm no customer-facing review/hold/needs-doc limbo wording.
5. Then run controlled Underwriting lifecycle retest.

If live retesting reveals a new issue, start the next hardening family from evidence only.
## June 3, 2026 Addendum

- Legacy Kill Slice A/A2 complete: `qa-action-plan` delivery authority cleaned, `generate-client-report` delivery aliases cleaned, and `admin-run-worker` canonical worker delivery gate cleaned.
- Canonical `deliveryDecisionState` is the live authority when present; legacy aliases and compatibility mirrors cannot decide publish, hold, fail-closed, or credit restore.
- Legacy Kill Slice B complete: support-doc and filename fallback authority demoted to diagnostic/display-only.
- Filename/doc-type fallback cannot create modeled property-tax support, current-debt truth, section unlocks, DCF/refi/waterfall/advanced modeling, or renovation/acquisition modeled authority.
- Validated parsed payload and canonical taxonomy remain controlling authority.
- Legacy Kill Slice C complete: `AdminDashboard` and `queue-metrics` lifecycle wording cleaned; remaining admin review and needs-documents terms are internal triage/diagnostic wording only, not customer lifecycle authority.
- Final no-change verification audit complete: no decision-capable legacy fallback remnants found in live paths reviewed.
- Remaining legacy/compatibility strings are inert diagnostics, compatibility mirrors, historical compatibility, or internal triage labels only.
- Doctrine preserved: normal customer outcome is publish or fail-closed with credit restored; fail-closed only for unusable, missing, contradictory core T12 or Rent Roll, or catastrophic system, storage, or PDF failure.
- Optional or support issues collapse, omit, qualify, or disclose; admin review is not a normal customer outcome.
- Proposed or acquisition financing cannot become current debt; appraisal is valuation/context only.
- Property-tax support can corroborate the T12 tax line only when validated and bound, and must not override modeled T12 values.
- Codex usage remains limited until June 8; future prompts should stay tight.
- No DocRaptor flip.
- No public samples created.
- No pricing or Stripe changes.
- No SQL or RPC changes.
- No new API or serverless routes.
- Next step after docs update: controlled live retesting from the clean legacy-fallback checkpoint.
## June 3/4, 2026 Addendum - Strategic Launch Pivot: Enhanced Screening / Acquisition Memo First, Full Underwriting V2 Deferred

- InvestorIQ should launch soon with an enhanced Screening product.
- Screening should no longer be positioned as a thin or basic screening report.
- Screening should become the front-line investor-ready memo product by opening only the stable and proven Underwriting sections that are already working reliably.
- Full Underwriting public launch is temporarily deferred.
- Underwriting should remain visible on the website as V2.0, coming later, or an integrations-enabled premium product.
- Product positioning direction: InvestorIQ Acquisition Memo, InvestorIQ Deal Intelligence Memo, InvestorIQ Investment Screening Memo, or InvestorIQ Preliminary Underwriting Memo.
- Final naming is not yet locked, but the direction is to make Screening feel like a credible investor-facing acquisition memo.
- Enhanced Screening / Acquisition Memo may justify a higher launch price around $399-$499, while Full Underwriting V2 may later justify a higher premium price point around $1,499 when integrations and deeper underwriting workflows are added.
- Do not change Stripe or pricing code from this documentation update alone.
- Stable Underwriting candidate sections for enhanced Screening: cap-rate value indication using T12 NOI; rent upside or mark-to-market summary; implied value sensitivity from rent gap; property-tax corroborating support if provided and validated or bound; document treatment summary; data coverage or source limitations; basic operating-risk scorecard using operating metrics only.
- Sections that must stay out of enhanced Screening for now: current debt DSCR; refinance stress; acquisition financing debt sizing; proposed or current debt modeling; DCF; equity waterfall; five-year outlook; advanced return projections; complex chart pages; any section requiring debt, refinance, acquisition financing, or future projection assumptions.
- Enhanced Screening must preserve the reliability advantage of Screening: T12 and Rent Roll remain the core required documents; open only deterministic, source-bound, low-risk sections; do not require current debt, acquisition financing, refinance assumptions, or future projections; unsupported optional or support inputs must collapse, omit, qualify, or disclose; no synthetic values; no public AI wording; no BUY, SELL, or HOLD labels; no admin-review or customer limbo; normal customer outcomes remain publish or fail-closed with credit restored.
- Full Underwriting should be temporarily closed or deferred from immediate public launch and remain on the website as a future V2.0 premium product positioned around integrations, deeper underwriting workflows, debt and refinance modeling, acquisition financing, DCF and scenarios, a richer investor or lender package, higher-confidence structured source ingestion, and a higher price point.
- The current live-test interpretation that caused this pivot is recorded as follows: Screening Test 1 passed strongly and looked customer-deliverable; Underwriting Test 2 proved many core sections work, including T12, Rent Roll, current debt recognition, DSCR classification, property-tax support, environmental containment, market survey containment, appraisal containment, and renovation collapse; however, Underwriting still exposes too many advanced-surface, public-sample, and Ken-readiness issues, especially purchase-assumption, acquisition, cap-rate, and document-treatment consistency; rather than hold the business hostage to full Underwriting perfection, launch the reliable product first and move only proven low-risk value into it.
- Next implementation direction after this documentation checkpoint: a small planning or audit slice, not a broad rewrite; identify exactly which existing collapsed or hidden Underwriting sections can safely be enabled for Screening; map which files control those Screening section gates; recommend the smallest implementation slice to create enhanced Screening or Acquisition Memo; no code changes during that planning or audit unless Rob explicitly asks.
- Guardrails: no code changes in this docs update; no Stripe or pricing changes; no DocRaptor flip; no public samples; no new API or serverless routes; no SQL or RPC changes; no broad repo audit; preserve limited Codex usage discipline; keep future Codex prompts tight and receipt-only.

---

# June 11, 2026 Addendum - Support-Doc Authority Enforcement Audit Started Before Patch 4

## Current controlling update

After further discussion, the team clarified that Patch 4 must not become another symptom patch.

The next Codex task is now an **audit-only support-document authority enforcement pass** before Patch 4.

Reason:

```text
InvestorIQ already has canonical / AI-assisted / deterministic support-doc logic in several places.

The issue is not that no canonical support-doc system exists.

The issue is that some downstream consumers still appear able to bypass, duplicate, reinterpret, or ignore canonical support-doc decisions when rendering the Acquisition Memo or building QA/advisory artifacts.
```

Rob's controlling concern:

```text
If Ken Dunn ordered 5 Acquisition Memos and each report surfaced 1-3 visible support-doc treatment issues, that would destroy trust in InvestorIQ.

Therefore the system must be forced to obey canonical authority, or every remaining bypass must be destroyed/demoted.
```

## Revised root interpretation

Do not frame the issue as:

```text
"we need to invent canonical support-doc authority"
```

Frame it as:

```text
"we need to verify where canonical support-doc authority exists, then identify every downstream escape hatch that can still make its own document-role, treatment, allowed-use, financing-context, current-debt, or renovation-context decision."
```

## Active Codex task now running

Codex is running this audit-only task:

```text
Support-doc authority enforcement audit for Acquisition Memo launch behavior.
```

Audit target:

```text
Find every remaining path where Acquisition Memo support-document role, treatment, allowed use, financing context, current-debt context, renovation/CapEx context, appraisal context, market-survey context, environmental context, or Document Treatment Summary rows can be decided independently of final canonical support-doc authority.
```

Do not patch during this audit.

## Audit scope

Inspect only the support-doc authority enforcement seam, especially:

```text
api/generate-client-report.js
api/_lib/report-surface-contracts.js
api/_lib/source-report-coverage-qa.js
api/_lib/report-contract-qa.js
api/_lib/qa-action-plan.js
parser/support-doc routing helpers if they feed the above
helpers that build Document Treatment Summary
helpers that build Source Context / Support Document Treatment
helpers that build Preliminary Financing Readiness Summary
helpers that build Current Debt Context
helpers that build Proposed Acquisition Financing Context
helpers that build Renovation / CapEx context
support-doc role labels / treatment labels / quantitative-use rows
```

## Audit questions to answer

Codex must identify:

```text
1. Current highest-authority support-doc role object/function, if any.
2. Whether that authority produces one canonical role per uploaded file.
3. Whether it includes allowed uses and forbidden uses.
4. Every downstream consumer still making its own support-doc role/treatment decision.
5. Whether each consumer is a bypass, duplicate, reinterpretation risk, or diagnostic-only path.
6. Whether the bypass can explain Attack Test 8:
   - purchase assumptions misrouted;
   - current debt statement missed;
   - structured Reno Plan treated as Rent Roll.
7. Minimum Patch 4 file/function set.
8. Required regression fixtures.
```

## Required fix classification for each bypass

Codex should classify each bypass as one of:

```text
DELETE duplicate decision-maker
DEMOTE to display-only consumer
FORCE to consume canonical support-doc authority
KEEP as diagnostic-only, clearly non-authoritative
NEEDS new canonical support-doc authority if none exists
```

## Patch 4 remains next

Patch 4 is still required, but it must be based on the audit inventory.

Patch 4 invariant:

```text
One uploaded support file -> one canonical support-doc role/treatment/allowed-use decision before final render.

All customer-visible Acquisition Memo surfaces consume that decision.

QA checks conformance to that decision instead of re-deciding document role.
```

Patch 4 must enforce:

```text
purchase assumptions cannot become current debt, environmental, mortgage-only, or generic support;
current debt cannot become proposed acquisition financing;
structured renovation / CapEx plan cannot become Rent Roll;
appraisal cannot override purchase price, T12 NOI, or Rent Roll values;
market survey cannot override Rent Roll market rents;
Phase I cannot become quantitative financial support.
```

## Do not touch list

The audit and Patch 4 must not touch:

```text
Screening core behavior
T12/Rent Roll core math
delivery gate doctrine
credit/payment/access
DSCR/refi/DCF/waterfall/equity-return/deal-score/final-recommendation/V2 surfaces
pricing/Stripe/SQL/routes/DocRaptor production config/auth/upload gates
```

## Updated next sequence

```text
1. Wait for Codex audit receipt.
2. Review audit receipt for exact bypass inventory.
3. Create Patch 4 prompt based on audit findings.
4. Patch only the support-doc authority enforcement seam.
5. Add regression fixtures, including Final Attack Test 8 support-doc package shape.
6. Rerun Final Attack Test 8.
7. Only after Attack Test 8 passes, run a small Acquisition Memo certification batch.
```

## Fresh-chat continuation note

The next chat should begin with Codex's support-doc authority enforcement audit receipt if available.

Do not start another random test and do not launch Acquisition Memo before Patch 4 + Attack Test 8 rerun.



---

# June 13, 2026 Addendum - Patch 4C Investigation / Render-Time Canonical Map Wiring Improved But Final Live Render Still Diverges

## Current controlling status

InvestorIQ is still in narrow Acquisition Memo support-doc authority hardening.

Current product posture remains:

```text
Screening Report:
Launchable / founder-beta ready from current evidence.
Do not reopen Screening while fixing Acquisition Memo support-doc authority.

Acquisition Memo:
NOT launch-cleared.
Core math, publish path, source-reconciliation disclosure, V2 containment, and purchase assumptions are strong.
However, support-doc canonical authority is still not sovereign in the live Acquisition Memo HTML/PDF path.

Full Underwriting V2.0:
Still deferred.
Do not reopen DSCR/refi/DCF/waterfall/deal-score/final-recommendation surfaces inside Acquisition Memo.
```

## Patch 4C investigation result

Codex completed a root-cause investigation into why the new canonical support-doc authority / “AI Boss” did not control the live report output.

The important finding:

```text
The break is not the helper authority path itself.
The helper path can classify the Stonebridge support docs correctly.
The break is in api/generate-client-report.js at the live render-time canonical support-doc assembly and final render consumption.
```

The earlier render-time map was still being built from a weak source selection:

```text
documentSources + first _parsed artifact per fileId
```

This allowed stale or incomplete parser artifacts to win before render. The stronger authority rows were being built later for QA/diagnostics, but the visible PDF did not necessarily consume that stronger authority.

Current conclusion:

```text
The system did not fail because support-doc authority is impossible.
It failed because the visible Acquisition Memo render path still had at least one weaker/older authority branch or incompatible map-shape branch in control.
```

## Patch 4C partial implementation status

Codex then began the systemic Patch 4C wiring fix.

Reported changes so far:

```text
Files changed:
- api/generate-client-report.js
- tests/qa/generate-client-report-rent-roll-smoke.js

Validation passed:
- node --check api/generate-client-report.js
- node --check tests/qa/generate-client-report-rent-roll-smoke.js

Validation still failing:
- node tests/qa/generate-client-report-rent-roll-smoke.js
```

Current smoke failure:

```text
The live Stonebridge full-render assertion still fails for current debt label propagation.
Current_Debt_Stonebridge.pdf is present in final HTML, but the visible Debt Support Received / Contextual label is still not making it into the final Acquisition Memo output.
```

Interpretation:

```text
Patch 4C is not done yet.
The helper classification path works.
The direct Document Treatment helper call works when passed the right canonical rows/map.
The end-to-end generateClientReport(...) path still diverges from that helper result.
```

## Newly identified likely downstream gap

After reviewing the uploaded `generate-client-report.js`, the likely remaining bug is a canonical map value-shape mismatch or final call-site overwrite.

Observed field-shape issue:

```text
buildDocumentTreatmentSummaryHtml canonical-map branch expects resolver-style fields:
- displayLabel
- treatment
- use
- role
- authoritySource
- originalFilename

buildCanonicalSupportDocAuthorityRows emits authority-row-style fields:
- document_role_label
- treatment_label
- use_label
- canonical_support_doc_role
- semantic_doc_display_label
- authority_source / authoritySource
- original_filename
```

If the live canonicalSupportDocMap now contains correct authority-row objects, but the renderer reads only resolver-style field names, the renderer can still default to:

```text
Other Support Document
Context only
Listed for auditability only; not used quantitatively.
```

This explains why:

```text
1. helper authority rows classify the file correctly;
2. a direct helper call can render correctly;
3. full generateClientReport(...) still loses the current-debt label in visible final HTML.
```

The next patch should normalize both supported field shapes at the consumer boundary instead of adding another authority layer.

## Current suspected exact fix

The next Codex patch should continue Patch 4C and focus only on:

```text
Canonical map value-shape normalization and final live render consumption.
```

Specifically:

```text
In buildDocumentTreatmentSummaryHtml, canonicalSupportDocMap entries must accept both:

Resolver-style object fields:
- role
- displayLabel
- treatment
- use
- authoritySource
- originalFilename

Authority-row-style object fields:
- canonical_support_doc_role
- semantic_doc_role
- document_role_label
- semantic_doc_display_label
- treatment_label
- treatment
- use_label
- use
- treatment_category
- original_filename
```

Required local normalization:

```text
canonicalRole = authority.role || authority.canonical_support_doc_role || authority.semantic_doc_role || "other_support"
roleLabel = authority.displayLabel || authority.document_role_label || authority.semantic_doc_display_label || "Other Support Document"
treatmentLabel = authority.treatment || authority.treatment_label || "Context only"
useLabel = authority.use || authority.use_label || "Listed for auditability only; not used quantitatively."
category = authority.category || authority.treatment_category || "Listed but Not Quantitatively Modeled"
originalFilename = authority.originalFilename || authority.original_filename || authority.file_name || authority.filename || fileId
sourceBasis = authority.authoritySource || authority.authority_source || "canonical_support_doc_authority"
```

Also inspect active Acquisition Memo call sites for `buildDocumentTreatmentSummaryHtml(...)`:

```text
1. buildLaunchSourceContextBlock(...) path.
2. Late DOCUMENT_TREATMENT_SUMMARY replacement path after sourceCoverageQa.
3. Any Data Coverage / Source Treatment path that can render inside v1_core.
```

If a v1_core/Acquisition Memo call site still invokes `buildDocumentTreatmentSummaryHtml(...)` without `canonicalSupportDocMap`, patch that call site to pass the same map or prove its output is replaced before final HTML returns.

## Do not broaden the patch

The next Codex prompt must not broaden into:

```text
Screening
T12/Rent Roll core math
rent-roll canonical math
delivery gate
credit restore
pricing / Stripe
SQL / RPC / Supabase
Dashboard
DocRaptor config
auth / upload gates
Full Underwriting V2
DSCR / refi / DCF / waterfall / equity return / deal score / final recommendation
```

Do not patch test reports.
Do not hardcode Final Attack Test 8 filenames in production behavior.
Do not add a new canonical authority architecture.
Do not add another “AI Boss.”

## Current next Codex prompt status

A tight continuation prompt is ready:

```text
Patch 4C continuation - Fix live canonical map value shape / final render consumption.
```

Rob should give Codex that prompt next.

Acceptance for the continuation patch:

```text
1. node --check api/generate-client-report.js passes.
2. node --check tests/qa/generate-client-report-rent-roll-smoke.js passes.
3. node tests/qa/generate-client-report-rent-roll-smoke.js passes.
4. git diff --check passes.
5. Full-render smoke shows current debt label propagation:
   Current_Debt_Stonebridge.pdf / current-debt fixture renders Debt Support Received / Contextual, not Other Support Document.
6. Structured Reno still renders Structured Renovation / CapEx Plan when source facts support it.
7. Purchase assumptions remain Purchase Assumptions / Acquisition Context.
8. No V2 forbidden surfaces appear.
```

## Current launch posture after this handoff

```text
Screening:
Still launchable / founder-beta ready.

Acquisition Memo:
Still not launch-cleared.
The current blocker is no longer broad support-doc intelligence generally; it is specifically live canonical authority propagation into final Acquisition Memo render output.

Full Underwriting V2:
Deferred.
```

## Current safe sequence

```text
1. Update MD files with this checkpoint.
2. Give Codex the Patch 4C continuation prompt.
3. Require the full-render smoke to pass locally before any live retest.
4. After local smoke passes, rerun Final Attack Test 8 once.
5. If live retest passes, stop coding Acquisition Memo and move to launch/outreach/cash motion.
```

## Emotional / execution context

Rob is under severe time and cash pressure and cannot keep spending days on InvestorIQ.

The controlling discipline from here:

```text
No more broad audits.
No more “while we are here.”
No more adding another boss.
No more random tests before the smoke passes.
Find the exact live render propagation gap, patch it, run one regression, then move to launch/outreach/cash.
```

## Fresh continuation point

Resume from here:

```text
June 13 Patch 4C handoff.
Codex improved render-time canonical map wiring but hit usage limit before finishing the final live render gap.
Helper authority rows classify Stonebridge support docs correctly.
Direct Document Treatment helper call works.
End-to-end generateClientReport still fails current debt visible label propagation.
Likely cause is canonical map value-shape mismatch: Document Treatment expects displayLabel/treatment/use/role, while authority rows provide document_role_label/treatment_label/use_label/canonical_support_doc_role.
Next Codex prompt should normalize canonical map values at buildDocumentTreatmentSummaryHtml consumer boundary and inspect remaining v1_core call sites.
Do not broaden scope.
Do not retest live until node tests/qa/generate-client-report-rent-roll-smoke.js passes.
```
