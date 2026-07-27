# Stage 10: Doctrine and Archive Reconciliation

**Repository:** `rob01-web/investoriq`  
**Branch:** `investigation/full-repo-underwriting-audit`  
**Baseline:** `main` HEAD `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`  
**Scope:** read-only. No production patch, merge, deploy, environment change, customer-data change, credit/job mutation, migration execution, or live RETEST.

## Inspection scope and classification

**Doctrine/archive files classified:** 84 human-authored Markdown/text records: current root guidance, `docs/`, `PIPELINE_MAP.md`, `ELITE_ROADMAP.md`, `UNDERWRITING_GAMEPLAN_v2.md`, `AGENTS.md`, `CLAUDE.md`, active investigation records, and the archived/legacy Markdown corpus under `Very Old and Archived MD Files/` plus root-level historical ledgers. Binary PDFs and generated HTML were treated as evidence artifacts, not doctrine.

Classification distribution: 2 CURRENT CONSTITUTIONAL, 6 CURRENT OPERATIONAL, 9 CURRENT HISTORICAL RECORD, 43 SUPERSEDED or ARCHIVED BUT STILL REFERENCED, 6 CONTRADICTORY, 18 DUPLICATE/MISLEADING or RUNTIME-AUTHORITY RISK. The archive is not executable by the build or runtime, but several current documents link to or enumerate archived records, so archive reachability is semantic rather than import reachability.

## Controlling doctrine hierarchy

1. **Core document requirements:** `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`, specifically Required Core Evidence and Core-Gated Publish-or-Collapse.
2. **Source Truth authority:** Product Doctrine Source and Delivery Authority; runtime `source-truth-package.js` and canonical source package contracts.
3. **Support Document Authority:** runtime support adjudicator/treatment contracts, constrained by Product Doctrine; no archived ledger may override them.
4. **Screening product contract:** Product Doctrine Screening vs Underwriting section; active `/pricing` and Dashboard copy are implementation surfaces, not authority.
5. **Underwriting product contract:** Product Doctrine Underwriting section, extended by locked Premium doctrine only for Premium V1.
6. **Report identity:** runtime report identity authority and Stage 4/6 findings; archived aliases are compatibility evidence, not authority.
7. **Premium assignment:** Premium doctrine plus activation runbook and immutable job-start receipt; default is false/not activated.
8. **Current/proposed debt separation:** Premium doctrine formula constitution and canonical debt/source contracts.
9. **Section collapse/qualification:** Product Doctrine Publish-or-Collapse and Premium doctrine section eligibility.
10. **Delivery Gate:** canonical delivery decision contracts in runtime, constrained by Product Doctrine; no customer surface may rediscover readiness.
11. **PDF certification:** unchanged PDF Boss and Premium certification doctrine/runbook.
12. **Final publication authority:** Delivery Gate plus PDF Boss and worker publication enforcement, not a renderer, archive, or customer label.
13. **Published-with-limitations:** Product Doctrine allows constrained publication; current frontend has no faithful distinct state, proving a runtime compliance gap.
14. **Complete failure rules:** Product Doctrine failure classification, worker terminal taxonomy, and Stage 8/9 evidence. Technical failures are internal, not customer-document failures.
15. **Credit restoration:** worker entitlement restoration authority and its artifact receipt; frontend is a read-only projection.
16. **Corrected reruns:** doctrine says system failures may be regenerated and customer-source failures need replacement, but no active customer implementation binds either path.
17. **Customer disclosure:** Product Doctrine and legal disclosure text, with server-side acceptance authority still unresolved by F-002/F-003.
18. **Admin quality observability:** current `AdminDashboard` and quality incident surfaces, constrained by the quality/remedy doctrine; not a publication approval authority.

## Current versus superseded doctrine

The current controlling set is coherent on the core constitution: T12 and Rent Roll are the only report-level required documents; optional evidence cannot independently block; unsupported sections collapse; technical delivery failures are internal; Screening and Underwriting are distinct; Premium is additive, default-off, surface-pinned, and cannot silently downgrade.

The current operational set is less coherent. `ELITE_ROADMAP.md` says the next boundary is still integration and external enforcement, while `UNDERWRITING_GAMEPLAN_v2.md` and the Premium doctrine implementation receipt describe the external enforcement boundary as repository-complete. The activation runbook is the most recent operational truth for activation safety, but its embedded historical receipt records prior live deployments and RETEST 37/38 outcomes. That receipt is historical evidence, not permission to activate or evidence of a clean launch.

The archived corpus contains many files named ACTIVE, FINAL, COMPLETE, PASS, or CURRENT. Those names are stale labels, not authority. The July 11 to July 15 ledgers repeat the same master context and semantic authority claims with changing status. They must be treated as historical records or superseded checkpoints, never as instructions.

## Doctrine-to-runtime compliance matrix

| Doctrine statement | Controlling document | Runtime implementation | Test coverage | Compliance | Launch impact | Disposition |
|---|---|---|---|---|---|---|
| T12 + Rent Roll are report-level core | Product Doctrine | Upload gate/RPC/worker checks plus Source Truth | QA and parser suites inventoried, not executed | Partial | Core gate exists but content/causal failure distinctions remain weak | Retain doctrine; repair implementation later |
| Optional support cannot block whole report | Product Doctrine | UI and RPC currently require one support file for Underwriting | Direct route and QA evidence; no end-to-end proof | Contradictory | Valid core may be blocked by support absence | Consolidate product and submission contract |
| Publish constrained reports when core is accepted | Product Doctrine/Premium doctrine | Delivery decisions can allow limited output; Dashboard maps to Ready/Failed | Contract tests exist, customer mapping incomplete | Noncompliant | Limited publication can be mislabeled or hidden | F-066 remediation |
| Technical failures are internal | Product Doctrine | Worker taxonomy exists; some generic missing-core paths remain | Unit/QA coverage partial | Partial | Customer remedy and credit ownership can be wrong | Preserve taxonomy, close conversion paths |
| Screening and Underwriting are distinct | Product Doctrine/CLAUDE | Separate product types and branches; shared labels and legacy memo names remain | Type normalization tests | Partial | Product identity can drift in customer/admin surfaces | Consolidate terminology |
| Premium is default-off and cannot silently downgrade | Premium doctrine/runbook | Flag and job-start receipt plus worker enforcement | Premium tests and historical live receipts | Partial/unproven | External activation remains unsafe after failed certification history | Keep disabled pending revalidation |
| Current and proposed debt remain separate | Premium doctrine | Canonical contracts and deterministic calculators; legacy fallbacks remain in runtime | Financial intelligence tests | Partial | Debt conclusions can be authority-confused | Keep one debt authority |
| Delivery Gate is canonical | Product Doctrine | Canonical delivery decision and worker resolver | Contract QA | Partial | Frontend can still reinterpret state | Make customer surface projection-only |
| PDF Boss controls publication quality | Premium doctrine/runbook | PDF Boss and certification are in worker path | PDF QA inventory | Partial | Publication can fail after valid core and restore credit | Keep strict certification, expose outcome |
| Credit restoration is durable and visible | Product Doctrine/runbook | Worker clears entitlement and writes event; Dashboard discovers event separately | State scenario tests; no live run in audit | Partial | Restored credit may lag or be invisible | Add bounded receipt/projection contract |
| System failure has no-cost regeneration | Terms/Premium doctrine | Admin regeneration exists; customer revision endpoint is 403 | Route inventory | Noncompliant | Customers lack governed remedy | Add owned customer remedy flow |
| No 99.999% publication promise without enforceable SLO | No controlling implementation contract found | No measurable SLO, denominator, or error-budget enforcement found | No proof found | Absent | Marketing/launch claims would be unsupported | Do not state objective as achieved |

## Archive reachability matrix

| Archived family | Runtime reachability | Factual authority risk | Safe disposition |
|---|---|---|---|
| `!INVESTORIQ_MASTER_CONTEXT_ARCHIVED.md` and updated variants | No code import; referenced by later ledgers and agent discovery | High: stale master instructions | Keep historical record only; consolidate index references |
| Core Valid Failure Path Family ledgers, June 16 to June 28 | No runtime import; repeatedly referenced by later archive files | High: duplicate blocker and status authority | Mark superseded by canonical index and stages; remove after launch review |
| Semantic Authority Evidence ledgers, July 6 to July 13 | No runtime import; linked/enumerated by current-looking files | High: competing authority graphs | Preserve as historical receipts; one summary only |
| Master Context Completion Checklists, June 16 to July 15 | No runtime import; some root copies remain outside archive folder | High: ACTIVE/FINAL labels can mislead agents | Consolidate into current doctrine/index; remove stale root copies after launch |
| Admin Quality Incident and Customer Remedy doctrine variants | No code import; current admin runtime partially implements concepts | Medium/high: remedies appear complete when customer path is absent | Retain one current doctrine, mark variants historical |
| Acquisition Memo/V1/V2 checkpoint ledgers | Runtime concepts remain reachable, but files are not imports | High: V1/V2 and Full Underwriting terminology drift | Supersede with Stage 6 and Product Doctrine terminology |
| Premium July activation/retest ledgers | No runtime import; runbook embeds historical receipts | High: historical deployment can be mistaken for approval | Keep as historical operational record, never activation authority |

**Archived-but-reachable count:** 12 semantic archive families have current references or discovery visibility. No archived Markdown file was found imported by runtime/build code in the inspected searches. This distinction matters: semantic reachability is still enough to pollute future agent decisions.

## Contradictions and runtime mismatches

1. **Premium readiness contradiction:** roadmap says external enforcement is next; gameplan/doctrine say implementation is complete; runbook says repairs deployed, revalidation pending, and capability false. The only safe interpretation is repository implementation complete, live activation not approved.
2. **Live-state contradiction in historical receipt:** the runbook records `live_environment_changed: true` and live RETEST outcomes inside a document whose safe default is false. These are historical facts, not current state proof.
3. **Optional support contradiction:** doctrine says optional/supporting evidence cannot independently block report-level publication, while active Underwriting UI and `consume_purchase_and_create_job` require at least one support document.
4. **Publish-with-limitations contradiction:** doctrine allows constrained publication, while frontend normalization collapses publication-held/limited states into failed or ready.
5. **Product terminology contradiction:** Product Doctrine distinguishes Screening, Underwriting, Premium Acquisition Underwriting V1, and later Full Underwriting; legacy docs and runtime names continue to use Acquisition Memo/V1/V2/Underwriting interchangeably.
6. **Remedy contradiction:** terms/runbooks describe system regeneration and customer replacement remedies, while active customer UI has only dismiss/new submission and revision API returns 403.

## Proven findings

### F-072 - BLOCKER - Doctrine authority is duplicated and current operational status contradicts itself

The repository has two current-looking roadmaps, two execution-status narratives, multiple root copies, and a large archived corpus whose filenames claim ACTIVE, FINAL, COMPLETE, or CURRENT. `ELITE_ROADMAP.md`, `UNDERWRITING_GAMEPLAN_v2.md`, the Premium doctrine implementation receipt, and the activation runbook disagree on whether the external Premium boundary is pending, complete, or revalidation-pending. Without one machine-obvious current authority, future changes can follow stale launch instructions.

**Status:** PROVEN. **Owner:** doctrine/launch governance. **Doctrine impact:** one current doctrine hierarchy and explicit status receipt are required.

### F-073 - HIGH - Archived doctrine remains semantically reachable and can pollute future authority decisions

No archived Markdown was found imported by runtime or build code, but current-looking root and archive records reference one another and are visible to repository-wide discovery. Their repeated ACTIVE/FINAL/CURRENT labels and duplicated ledgers can cause future agents or operators to select stale behavior claims.

**Status:** PROVEN. **Owner:** doctrine/archive hygiene. **Doctrine impact:** archive reachability must be explicit and stale records must be marked non-authoritative.

### F-074 - HIGH - The 99.999% publication objective has no enforceable implementation contract

No controlling document/runtime contract was found defining the denominator, eligible-job population, measurement window, exclusions, error budget, or alert/rollback behavior needed to claim 99.999% publication. The current system has best-effort retries, non-transactional publication, and known certification failures, so the objective is not proven.

**Status:** PROVEN. **Owner:** launch/SRE governance. **Doctrine impact:** reliability objectives need measurable acceptance and operational enforcement.

### F-075 - HIGH - Doctrine and runtime do not share one terminology contract for report identity

Current doctrine cleanly separates Screening, Underwriting, Premium V1, and later Full Underwriting, but legacy runtime and archive terminology still exposes Acquisition Memo, V1/V2, and Underwriting aliases across routes, renderers, tests, and ledgers. This invites wrong lane selection and customer identity drift.

**Status:** PROVEN. **Owner:** product identity/architecture. **Doctrine impact:** one normalized report identity must cross checkout, job, renderer, PDF, history, and admin surfaces.

### F-076 - HIGH - Remedy doctrine is ahead of executable customer remediation

Terms and current doctrine describe system regeneration, customer document replacement, credit restoration, and revision concepts, but active UI has no linked corrected rerun/replacement flow and revision requests are explicitly rejected. The remedy matrix is therefore aspirational in part, not an executable contract.

**Status:** PROVEN. **Owner:** customer remediation. **Doctrine impact:** every terminal state needs an owned customer or internal remedy path.

## Launch interpretation

The doctrine set supports the V2/base Underwriting lane only as a provisional candidate. Premium remains default-off and not launch-approved. The 99.999% objective is unproven and must not be represented as an achieved guarantee. Archive cleanup is itself a launch-hygiene requirement because stale “current” records remain discoverable.

Next stage is Stage 11 final 12-deliverable synthesis. No production patch or archive deletion was performed in Stage 10.
