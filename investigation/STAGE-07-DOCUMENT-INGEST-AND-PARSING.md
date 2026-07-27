# Stage 07: Document Ingest and Parsing

**Repository:** `rob01-web/investoriq`  
**Branch:** `investigation/full-repo-underwriting-audit`  
**Baseline:** `main` HEAD `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`  
**Scope:** read-only. No production code, merge, deploy, environment change, customer-data change, credit/job mutation, or live RETEST.

## Files inspected

`src/lib/reportUploadGate.js`, `src/components/UploadModal.jsx`, `api/parse/classify-documents.js`, `api/parse/extract-job-text.js`, `api/parse/parse-doc.js`, `lib/textractClient.js`, `lib/textractTablesToMatrix.js`, `lib/ai-t12-recovery.js`, `lib/ai-rent-roll-recovery.js`, `lib/ai-support-doc-recovery.js`, `supabase/migrations/20260302_0001_allow_multiple_files_per_doc_type.sql`, plus worker dispatch already inspected in Stage 3.

## Ingest authority map

`Dashboard upload chooser` -> staged object/file row -> `analysis_jobs` and `analysis_job_files` -> worker invokes `extract-job-text` -> PDF/image table extraction via AWS Textract, PDF text via `pdf-parse` with malformed-PDF fallback, Office XML/plain-text extraction, and table persistence -> worker invokes `parse-doc` -> deterministic spreadsheet/table/text parsers -> optional feature-flagged AI recovery -> candidate/diagnostic artifacts -> `Source Truth` selects validated core T12 and Rent Roll and adjudicates support documents -> core usability and true blockers.

Important boundary: parser outputs are candidate artifacts. They do not become authority merely because `validated`, confidence, or AI recovery fields exist. Source Truth admission is the authority boundary.

## Exact behavior by document class

| Class | Accepted path | Engines/fallbacks | Thresholds/timeouts | Persistence/blocking |
|---|---|---|---|---|
| Screening T12 | upload gate requires declared/filename-resolved T12; worker extracts then parses | XLSX/CSV matrices, PDF Textract tables/text, deterministic T12 parser, optional AI recovery | no upload max size found in inspected code; AI max 55s, min confidence .90; no parser retry count | `document_text_extracted`, table artifact, parsed artifact; missing/unusable T12 is constitutional core blocker |
| Screening Rent Roll | same core gate | spreadsheet matrices, Textract tables, deterministic row parser/text-summary fallback, optional AI recovery | no upload max size found; AI max 55s, min confidence .85; text summary requires totals/coherence | same; missing/unusable Rent Roll is constitutional core blocker |
| Underwriting T12/Rent Roll | same core parser and Source Truth path; UI additionally requires one support doc | same engines and thresholds as Screening | no class-specific timeout/retry found | core failure blocks report; support failure should not block valid core by doctrine |
| Optional support | declared/semantic type routes mortgage, purchase assumptions, appraisal, tax, renovation, market/environmental | deterministic text/table parsers, optional AI recovery with exact evidence checks | AI support min confidence .90, current mortgage .85; max 55s | candidate and diagnostics persist; authority adjudication can accept, constrain, reject, duplicate, or conflict; optional failure should collapse section, not block core |
| Legacy Underwriting | compatibility aliases and parser routes remain accepted | same parser plus legacy fallback paths in Boss/document/coverage code | no distinct legacy budget | can reach shared V2/base lane; compatibility reconstruction remains a second path |
| Public/internal fixtures | direct parser/renderer tests and fixture imports | tests frequently call parsers or V2 renderers directly | test-controlled env flags; not paid-path proof | test artifacts are not production evidence |

## Proven parser and persistence facts

- `classify-documents.js` is an admin-authenticated rules classifier using filename plus the latest `document_text_extracted` excerpt. It uses keyword counts and returns confidence, but has no tie handling. A tie is resolved by sort stability/order, and `rr` is an especially broad Rent Roll keyword.
- `parse-doc.js` contains deterministic spreadsheet/table/text parsers for T12 and Rent Roll, opposite-core tabular rescue, support-document text classification, and feature-flagged AI recovery. It explicitly strips authority fields from parser candidate payloads before taxonomy attachment, which is good boundary hygiene.
- `extract-job-text.js` accepts PDF, PNG/JPEG for Textract, plain text, and DOCX/ODT office text. It skips unsupported types rather than marking them as parse failures. It persists extracted text and tables as artifacts, but several status updates ignore their returned error and there is no durable write-before-status transaction.
- PDF extraction tries AWS Textract first for tables, then `pdf-parse` for text. On malformed PDF structure it falls back to Textract line text or a raw PDF string-literal extractor. It does not provide a page-level provenance map for extracted text or fallback strings.
- Textract table matrices preserve cell confidence values but downstream parsers do not consistently carry cell/page confidence into accepted fact evidence.
- XLSX parsing uses `sheet_to_json(..., { header: 1, blankrows: false })` and converts every cell to trimmed strings. Formula/display-value policy is not explicitly declared; the library's default workbook read behavior is the only observed basis.
- Existing extracted text artifacts are reused only when bucket, object path, filename, and nonempty text all match. More than one reusable artifact is treated as an error. Existing parsed artifacts are not generally deduped at this layer.
- Multiple same-doc-type files are permitted by migration, constrained only by unique `(job_id, object_path)`. Source Truth later chooses a primary core artifact and adjudicates support duplicates/conflicts.
- `parse-doc.js` writes parsed artifacts and updates `analysis_job_files.parse_status`, but several artifact/status operations are separate writes. A persistence failure can leave an artifact/status mismatch.
- AI recovery is feature-flagged and uses AbortController at up to 55 seconds, but no retry count is implemented. Validation requires confidence and evidence excerpts, but accepted AI payloads are still candidate-only until Source Truth admission.

## Constitutionally valid core-blocker matrix

Only these families may prevent publication of an otherwise valid report:

| Core blocker family | Evidence/code | Customer meaning |
|---|---|---|
| Missing or unusable T12 | `CORE_T12_NOT_VALIDATED`, T12 insufficiency, no accepted EGI/OpEx/NOI bundle, or core equation failure | Required operating statement cannot support the report |
| Missing or unusable Rent Roll | `CORE_RENT_ROLL_NOT_VALIDATED`, rent-roll insufficiency, no accepted unit/rent structure | Required unit/rent source cannot support the report |
| Core contradiction/system integrity failure | core input state `admin_review_required` or `system_contract_failure`, including unreconciled T12 equation/structural contradiction | Core sources cannot be safely treated as a coherent package |

A Rent Roll/T12 reconciliation variance is **not automatically a publication blocker**. The deterministic reconciliation layer classifies it as source-limited/disclosure-only unless a separate canonical core usability state says otherwise. Optional support gaps, parser-provider outages, low confidence, missing appraisal, missing renovation, and missing current debt must remain section constraints or disclosures, not whole-report blockers.

## Proven findings

### F-049 - BLOCKER - Rules classifier can misclassify core/support documents and has no tie-safe outcome

`classify-documents.js` scores keyword families, includes broad tokens such as `rr` and `noi`, and sorts candidates by count without tie rejection. A support or mixed document can therefore be assigned `rent_roll` or `t12` based on keyword prevalence, and equal scores resolve by array order. The downstream worker trusts existing `doc_type` and may skip reclassification. This can route the wrong file into a constitutional core path.

**Status:** PROVEN. **Owner:** ingest/classification. **Doctrine impact:** core admission must be content-validated and ambiguity must fail closed to unclassified, not silently choose a type.

### F-050 - BLOCKER - Unsupported file types are skipped without a durable parse failure or customer-visible reason

`extract-job-text.js` increments `skippedCount` and returns `status: skipped` for unsupported MIME/extensions, without writing a parse-error artifact or updating `analysis_job_files.parse_status`. The worker can later see a missing structured artifact, but the original cause is not durably attached to the file. Customer-facing behavior becomes a generic missing-core failure instead of an actionable unsupported-file explanation.

**Status:** PROVEN. **Owner:** ingest/error classification. **Doctrine impact:** customer-caused source defects must be distinguished from system extraction defects.

### F-051 - HIGH - PDF extraction has no page-level provenance and raw-string fallback can accept ambiguous text

PDF text artifacts store aggregate text, page count, and a 1,200-character excerpt. The malformed-PDF fallback extracts PDF string literals without page mapping, layout, or cell evidence. Textract line text is also flattened into one string. A later parser can bind facts to aggregate text without proving the page or table origin.

**Status:** PROVEN. **Owner:** extraction/evidence. **Doctrine impact:** core and support facts need durable page/table provenance for auditability.

### F-052 - HIGH - Extraction persistence and parse-status updates are non-transactional

`extract-job-text.js` writes artifacts, then separately updates `analysis_job_files.parse_status`; several update errors are ignored. `parse-doc.js` follows the same separate artifact/status pattern. An artifact write can succeed while status remains pending, or status can advance after a partial artifact failure. Worker re-entry then sees inconsistent evidence and may retry, skip, or fail the job unpredictably.

**Status:** PROVEN. **Owner:** ingest/persistence. **Doctrine impact:** parsing success must not be recorded before durable evidence persistence.

### F-053 - HIGH - AI recovery has no retry count and can become the only remaining core path

AI T12 and Rent Roll recovery are feature-flagged with a 55-second timeout and validation thresholds, but no retry policy or bounded attempt count exists. If deterministic extraction fails and AI recovery is the only candidate path, provider timeout/non-OK/JSON failure leads to core non-validation and eventual report failure. The failure is not classified as provider/system versus customer source defect in the core outcome.

**Status:** PROVEN. **Owner:** ingest/provider. **Doctrine impact:** extraction failure classification must distinguish source unusable from InvestorIQ/provider failure.

### F-054 - HIGH - Spreadsheet formulas versus displayed values have no explicit policy

XLSX ingestion converts sheet cells to strings using `sheet_to_json` and does not declare whether formulas, cached displayed values, hidden sheets, or selected sheets are authoritative. The parser then chooses sheets/tables by header heuristics. A workbook whose formula cache is stale or whose relevant data is on another sheet can produce a plausible but wrong core artifact without a durable workbook/sheet/cell provenance record.

**Status:** PROVEN. **Owner:** spreadsheet ingest/evidence. **Doctrine impact:** spreadsheet-derived facts need explicit displayed/formula value policy and sheet/cell lineage.

### F-055 - HIGH - Duplicate core uploads can create competing candidates and selection is not source-version explicit

The schema permits multiple same-doc-type files. Source Truth selects one validated T12/Rent Roll by validation/completeness/timestamp/artifact ID, but there is no explicit user-selected primary, source version, or replacement relationship. A newer but less authoritative upload can win over an older complete source, or a duplicate can create conflicting downstream artifacts before selection.

**Status:** PROVEN. **Owner:** ingest/Source Truth. **Doctrine impact:** duplicate uploads need explicit deterministic authority and replacement semantics.

### F-056 - MEDIUM - Upload gate relies on filename hints and declared client type before content validation

`resolveCoreUploadDocType` uses the filename to resolve a client-declared `t12_or_operating_statement` or core type, and the UI gate decides whether generation is allowed based on those labels. The server later performs content parsing, but the client can show a green gate for a wrongly labeled file, while a correctly structured file with a neutral filename can be blocked before parsing.

**Status:** PROVEN. **Owner:** upload intake/classification. **Doctrine impact:** filename is a hint, never core authority.

### F-057 - MEDIUM - Optional AI support extraction can accept derived fields that are not directly stated

Support recovery validators bind fields to evidence, but explicitly derive acquisition loan amount from purchase price x LTV and annual debt service from monthly payment x 12. These are deterministic derivations and flagged, but the resulting candidate payload is mixed with extracted facts. Downstream consumers must preserve the distinction or a derived value can be mistaken for source-stated authority.

**Status:** PROVEN. **Owner:** support recovery/evidence. **Doctrine impact:** derived calculations must remain visibly separate from source facts.

### F-058 - MEDIUM - Core parser fallback order varies by document and can reject partial usable data

T12 parsing can derive NOI from EGI minus OpEx and accept core summary rows, while Rent Roll text-summary fallback requires total units, occupied/vacant counts, occupancy, and both in-place and market totals. A partially usable Rent Roll with valid unit rows but no market totals can be rejected even when core operating/rent analysis could proceed with constrained sections. The opposite-core rescue is also declaration-sensitive.

**Status:** PROVEN. **Owner:** core parser/usability policy. **Doctrine impact:** partial valid core evidence should be constrained where constitution permits, not rejected by a stricter unrelated optional field.

### F-059 - MEDIUM - Parser/provider failure can be converted into generic missing-core failure

The worker treats non-2xx extraction/parse dispatch as events or file failures, then later maps missing parsed artifacts to `MISSING_STRUCTURED_FINANCIALS` or `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`. This collapses customer-caused unreadable input, unsupported type, provider timeout, and internal persistence failure into similar core outcomes. The constitutionally valid blocker may be correct, but failure ownership and remedy are not.

**Status:** PROVEN. **Owner:** ingest/worker/remediation. **Doctrine impact:** customer source replacement and InvestorIQ system recovery require different paths.

### F-060 - LOW - Legacy upload modal is dead, but upload behavior is split between UI and server paths

`src/components/UploadModal.jsx` is disabled and renders null. The active Dashboard chooser is outside this file, while server upload/staging and parser routes remain elsewhere. This is not itself a data bug, but it confirms the legacy upload surface is compatibility/dead code and cannot be used as evidence of current paid upload behavior.

**Status:** PROVEN. **Owner:** upload UI. **Doctrine impact:** test/public upload evidence must follow the active Dashboard path.

## Core usability conclusion

The constitutional core-blocker set is narrow: missing/unusable T12, missing/unusable Rent Roll, or a true core contradiction/system contract failure. The current ingest implementation can reach those outcomes for many distinct technical reasons, but it does not preserve the causal distinction needed for remedy. Optional support and reconciliation variance are not valid whole-report blockers by themselves.
