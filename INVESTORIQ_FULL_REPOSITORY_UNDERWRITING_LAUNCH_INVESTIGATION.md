# INVESTORIQ FULL REPOSITORY UNDERWRITING LAUNCH INVESTIGATION

**Canonical index.** Scope: `rob01-web/investoriq` only. Branch: `investigation/full-repo-underwriting-audit`. Baseline: `main` at `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`. `main` remains untouched. No production code, live configuration, customer data, credits, jobs, deployments, or RETESTs changed.

## Investigation constitution

Read before every stage. Append bounded evidence. Never delete or renumber findings. Findings are `PROVEN`, `SUSPECTED`, or `CLEARED`. Detailed evidence is stored in linked stage files. No production patching during the audit.

## Repository census and checklist status

Remote Git tree enumeration is the authoritative tracked-file listing, equivalent to `git ls-files`; no local clone was available. The complete `tests/qa` inventory is closed at **151 tracked files**, 144 harness files plus 7 fixtures. The full path-level human-authored checklist remains controlling: `[ ]` uninspected, `[x]` inspected, `[~]` partial.

| Subsystem | Status | Behavior files inspected | Notes |
|---|---:|---:|---|
| S1 entrypoints/routing | `[x]` | 8 | Complete |
| S2 underwriting core | `[~]` | 50 | Contracts, deterministic layer, memo lanes |
| S3 ingest/parsing | `[~]` | 11 | Stage 7 bounded ingest batch; full parser tail remains |
| S4 worker/queue/revision | `[x]` | 7 | Complete for Stage 3 scope |
| S5 frontend | `[ ]` | 0 | Stage 9 |
| S6 shared runtime | `[~]` | 0 direct | Imported dependencies only |
| S7 migrations/RLS | `[~]` | 3 support migrations | Full stage pending |
| S8 tests/QA | `[~]` | inventory complete | Behavior not executed; 151 entries inventoried |
| S9 config/build | `[~]` | routing/timeouts | Full config stage pending |
| S10 doctrine/archive | `[ ]` | 0 | Stage 10 |

**Cumulative behavior files inspected: 76.** Census-only listings are not counted. Full path-level checklist remains controlling.

## Finding register

Severity: `BLOCKER`, `HIGH`, `MEDIUM`, `LOW`. Every finding has stable ID, status, owner, doctrine impact, and evidence link.

| ID | Status | Severity | Owner | Finding | Doctrine impact | Evidence |
|---|---|---|---|---|---|---|
| F-001 | PROVEN | BLOCKER | API/auth | Unauthenticated checkout-session metadata leaks internal user IDs | Customer identity must be private | Stage 2 |
| F-002 | PROVEN | BLOCKER | API/auth | Unauthenticated legal acceptance can be forged/read for arbitrary user IDs | Legal evidence must bind to authenticated actor | Stage 2 |
| F-003 | PROVEN | HIGH | legal | Client controls policy text hash | Acceptance must prove canonical text | Stage 2 |
| F-004 | PROVEN | HIGH | legal | Duplicate acceptance returns current time, not stored timestamp | Audit chronology must be truthful | Stage 2 |
| F-005 | PROVEN | HIGH | worker/ops | GitHub worker kick hides HTTP failures and times out at 2 minutes | Failed jobs cannot become invisible | Stage 2 |
| F-006 | PROVEN | HIGH | runtime | Full report path is capped at generic 60 seconds | Report generation needs an explicit budget | Stage 2 |
| F-007 | PROVEN | MEDIUM | billing | Checkout quantity metadata can diverge from line items | Entitlements need one source of truth | Stage 2 |
| F-008 | PROVEN | MEDIUM | billing | Synthetic Stripe session IDs are stored for quantity > 1 | Entitlement reconciliation must use real IDs | Stage 2 |
| F-009 | PROVEN | MEDIUM | billing/db | Webhook purchase completion is read-then-write | Idempotency must be atomic | Stage 2; DB pending |
| F-010 | PROVEN | LOW | runtime | Module-scope env initialization is inconsistent | Misconfiguration should fail closed clearly | Stage 2 |
| F-011 | PROVEN | LOW | routing/admin | Redundant API route plus multiplexed queue-metrics surface | Operational surfaces should be explicit | Stage 2 |
| F-012 | PROVEN | BLOCKER | worker/queue | Scheduler can kill invocation before downstream work finishes; fetches have no deadline | Valid paid jobs cannot be abandoned | Stage 3 |
| F-013 | PROVEN | BLOCKER | worker/queue | Two active claimers use incompatible claim-to-process contracts | One authoritative worker lane is required | Stage 3 |
| F-014 | PROVEN | HIGH | worker/queue | Atomic claim has no lease token, owner, expiry, or heartbeat | Exactly-once ownership is unproven | Stage 3 |
| F-015 | PROVEN | HIGH | worker/ingest | Internal fetch calls lack timeout/cancellation | Stalls must reach a durable terminal state | Stage 3 |
| F-016 | PROVEN | HIGH | ingest/worker | Parse dispatch failure can leave jobs extracting or support-degraded | Evidence degradation must be visible and bounded | Stage 3 |
| F-017 | PROVEN | HIGH | worker/queue | Coarse 60-minute sweep can fail legitimate still-running work | Timeout requires lease/heartbeat proof | Stage 3 |
| F-018 | PROVEN | HIGH | worker/entitlement | Failure status and entitlement restoration are non-transactional | Credit outcome must be durable and auditable | Stage 3 |
| F-019 | PROVEN | HIGH | revision/remediation | Customer revision endpoint always ends HTTP 403 and persists nothing | Remediation must be actionable and traceable | Stage 3 |
| F-020 | PROVEN | MEDIUM | worker/admin | Requeue paths have no attempt cap established in inspected code | Retry must be bounded and classified | Stage 3 |
| F-021 | PROVEN | MEDIUM | observability | Queue metrics convert query errors into zero/empty successful responses | Telemetry failure cannot look healthy | Stage 3 |
| F-022 | PROVEN | MEDIUM | worker/admin | Forced requeue delegates safety to uninspected RPC behavior | Admin actions need visible guardrails | Stage 3 |
| F-023 | PROVEN | HIGH | worker/surface | Start-surface receipt read-then-write can fail after claim | Metadata failure cannot strand paid work | Stage 3 |
| F-024 | PROVEN | HIGH | identity/routing | Resolver accepts `ic`, but canonical identity has no IC identity | Every promised surface needs one representable identity | Stage 4 |
| F-025 | PROVEN | HIGH | identity/routing | Acquisition Memo and legacy Underwriting share one canonical identity | Product surface lineage must not drift | Stage 4 |
| F-026 | PROVEN | HIGH | authority graph | Multiple components independently decide identity, mode, readiness, and aliases | One immutable surface receipt must cross boundaries | Stage 4 |
| F-027 | PROVEN | HIGH | coverage/eligibility | Legacy fallback reconstruction remains authoritative when canonical state is absent | Compatibility heuristics must not become second truth | Stage 4 |
| F-028 | PROVEN | HIGH | premium activation | Premium model is contractually disconnected but reachable code can render it when enabled | Activation state must distinguish staged vs promised surface | Stage 4 |
| F-029 | PROVEN | HIGH | premium/worker | Premium generation failure has no local base-surface fallback | Optional expansion failure must have explicit outcome | Stage 4 |
| F-030 | PROVEN | MEDIUM | identity/PDF | Legacy visible-title aliases remain accepted at PDF identity boundaries | Compatibility aliases should normalize output | Stage 4 |
| F-031 | PROVEN | MEDIUM | worker/surface | Premium receipt persistence is read-then-write | Surface assignment must be exactly once | Stage 4 |
| F-032 | PROVEN | HIGH | Source Truth/evidence | Core numeric facts lack exact excerpt-level evidence lineage | Every customer number should have exact source evidence | Stage 5 |
| F-033 | PROVEN | HIGH | customer surface | V2 surface directly re-derives core facts outside receipt-only financial intelligence | Renderers must consume canonical facts | Stage 5 |
| F-034 | PROVEN | HIGH | reconciliation/coverage | Annual in-place rent has different canonical and fallback authorities | One metric needs one authority/rule | Stage 5 |
| F-035 | PROVEN | HIGH | support authority | Legacy support acceptance and active adjudication can disagree | Compatibility cannot create second truth | Stage 5 |
| F-036 | PROVEN | MEDIUM | debt service/DSCR | Modeled debt service annualizes rounded monthly result | Debt service and DSCR need one annual result | Stage 5 |
| F-037 | PROVEN | MEDIUM | core parser/Source Truth | Aggregate completeness lacks field-level evidence binding | Structural validity is not field-level lineage | Stage 5 |
| F-038 | PROVEN | MEDIUM | capital plan/source binding | Timing ambiguity collapses the entire timing fact set | Optional ambiguity should constrain affected section | Stage 5 |
| F-039 | PROVEN | MEDIUM | Premium/customer surface | Premium renderer and validated model use separate renderability schemas | Surface mapping needs one explicit boundary | Stage 5 |
| F-040 | PROVEN | LOW | capital-plan policy | Objective capital comparisons expose no adequacy policy | Arithmetic and classification must stay separate | Stage 5 |
| F-041 | PROVEN | BLOCKER | lane identity/dispatch | V1 and V2 share production identity while owning different schemas/sections | Full Underwriting promise must be immutable and unambiguous | Stage 6 |
| F-042 | PROVEN | HIGH | V2 compatibility | V1 factual fallback logic remains reachable inside V2 contract path | Legacy facts must not override canonical Source Truth | Stage 6 |
| F-043 | PROVEN | HIGH | lane schema | V2 renderer, V1 projection, and Premium model use different renderability schemas | Producer/renderer/certifier need one explicit schema | Stage 6 |
| F-044 | PROVEN | HIGH | Premium activation/worker | Premium external failure has no governed base Full Underwriting fallback | Optional expansion must not erase valid base availability | Stage 6 |
| F-045 | PROVEN | HIGH | identity/routing | Legacy aliases enter same V2 lane without distinct product contract | Aliases must map to one explicit promised surface | Stage 6 |
| F-046 | PROVEN | MEDIUM | QA/sample parity | Public sample/internal tests exercise direct helpers, not paid production dispatch | Samples cannot substitute for production-path proof | Stage 6 |
| F-047 | PROVEN | MEDIUM | lane API | Similar `renderAcquisitionMemo` and `renderCompleteAcquisitionMemoV2Html` APIs invite wrong final-renderer use | One final renderer should be obvious | Stage 6 |
| F-048 | PROVEN | LOW | Premium product definition | Premium renderer section set is narrower than Full Underwriting universe | Premium promise must state expansion vs complete report | Stage 6 |
| F-049 | PROVEN | BLOCKER | ingest/classification | Rules classifier can misclassify core/support documents and has no tie-safe outcome | Ambiguity must fail closed to unclassified | [Stage 07](investigation/STAGE-07-DOCUMENT-INGEST-AND-PARSING.md) |
| F-050 | PROVEN | BLOCKER | ingest/error classification | Unsupported types are skipped without durable parse failure or customer reason | Source defects must be actionable and distinguishable | Stage 7 |
| F-051 | PROVEN | HIGH | extraction/evidence | PDF fallback has no page-level provenance and flattened text can be ambiguous | Audit facts need page/table lineage | Stage 7 |
| F-052 | PROVEN | HIGH | ingest/persistence | Artifact writes and parse-status updates are non-transactional | Success must follow durable evidence persistence | Stage 7 |
| F-053 | PROVEN | HIGH | ingest/provider | AI recovery has no retry count and can be the only remaining core path | Provider/system failure must be classified separately | Stage 7 |
| F-054 | PROVEN | HIGH | spreadsheet ingest | Formula/display-value policy is unspecified | Spreadsheet facts need explicit value policy and cell lineage | Stage 7 |
| F-055 | PROVEN | HIGH | ingest/Source Truth | Duplicate core uploads compete without source version/replacement semantics | Replacements need explicit deterministic authority | Stage 7 |
| F-056 | PROVEN | MEDIUM | upload/classification | Upload gate relies on filename and declared client type before content validation | Filename is a hint, never core authority | Stage 7 |
| F-057 | PROVEN | MEDIUM | support recovery | AI support candidate mixes source facts with derived fields | Derived values must remain visibly separate | Stage 7 |
| F-058 | PROVEN | MEDIUM | core parser/usability | Fallback order can reject partial usable Rent Roll because optional market totals are absent | Partial valid core should be constrained, not overblocked | Stage 7 |
| F-059 | PROVEN | MEDIUM | ingest/worker/remediation | Provider, unreadable-input, unsupported-type, and persistence failures collapse to generic missing-core outcomes | Remedy requires customer/system ownership distinction | Stage 7 |
| F-060 | PROVEN | LOW | upload UI | Legacy UploadModal is dead; active upload behavior is elsewhere | Test evidence must follow active Dashboard path | Stage 7 |

## Ingest authority graph

`active Dashboard uploader` -> staged object + `analysis_job_files` -> server filename/type hint -> extraction engine (Textract, pdf-parse, Office XML, plain text) -> normalized text/table artifact -> deterministic T12/Rent Roll/support parser -> optional AI candidate recovery -> candidate diagnostics and parsed artifacts -> Source Truth core selection/support adjudication -> core usability state and constitutionally valid blockers -> downstream deterministic contracts.

AI confidence, parser `validated`, filename, and document classification confidence are not authority. Source Truth admission is authority.

## Core-blocker matrix

The constitutionally valid whole-report core blocker count is **3 families**:

1. **Missing or unusable T12**, including absence of an accepted EGI/OpEx/NOI bundle or a true T12 structural/equation failure.
2. **Missing or unusable Rent Roll**, including absence of accepted unit/rent structure.
3. **True core contradiction or system contract failure**, where the accepted T12/Rent Roll package cannot be treated as coherent or safely publishable.

A reconciliation variance alone, optional support failure, missing current debt, missing appraisal/renovation, low AI confidence, provider outage, or unsupported optional document is not independently a constitutional whole-report blocker. Provider/persistence failures may surface as one of the three technical blocker families operationally, but their ownership must remain distinct.

## Authority graph and lane status

`request/job type` -> type/mode resolver -> report dispatch -> Source Truth -> deterministic receipt contracts -> V2 customer-surface/orchestrator -> QA/delivery -> PDF identity/certification -> publication/storage. Premium overlays Underwriting with a job-start receipt, validated model, renderer, observer, external certification, and worker enforcement. Legacy V1 remains a compatibility/presentation adapter, not factual authority.

## Launch-blocker summary

**Current blocker count: 7:** F-001, F-002, F-012, F-013, F-041, F-049, F-050. This is not launch approval. F-009 and full migrations/RLS remain open for Stage 8.

## Stage log

| Stage | Scope | Status | New behavior files/entries | Cumulative behavior files |
|---|---|---:|---:|---:|
| 1 | Census/checklist | COMPLETE | 0 behavior files; full tree census | 0 |
| 2 | S1 entrypoints/routing | COMPLETE | 8 | 8 |
| 3 | QA inventory + S4 worker/queue/revision | COMPLETE | 7 target + 2 migration-support; 151 QA entries | 17 |
| 4 | S2 contract layer | COMPLETE | 18 | 35 |
| 5 | S2 deterministic analysis | COMPLETE | 20 | 55 |
| 6 | Memo V1 vs V2 lane resolution | COMPLETE | 10 | 65 |
| 7 | S3 ingest/parsing | COMPLETE | 11 | 76 |
| 8 | S7 migrations/RLS, including F-009 | NEXT | - | - |
| 9 | S5 frontend | PLANNED | - | - |
| 10 | S10 doctrine/archive | PLANNED | - | - |
| 11 | Final 12-deliverable synthesis | PLANNED | - | - |

## Preliminary launch lane

**Do not make Premium Acquisition Underwriting V1 the base Full Underwriting lane yet.** Preliminary base remains the existing **V2/base Underwriting lane**, pending Stage 8 migrations/RLS and later frontend/doctrine proof. Premium remains feature-flagged and externally certified.

## Final conclusions

Not yet available. Do not produce the final 12-deliverable report until all scheduled stages are complete and findings are classified.
