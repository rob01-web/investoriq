# Stage 09: Frontend and Active Customer Surfaces

**Repository:** `rob01-web/investoriq`  
**Branch:** `investigation/full-repo-underwriting-audit`  
**Baseline:** `main` HEAD `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`  
**Scope:** read-only. No production patch, merge, deploy, environment change, customer-data change, credit/job mutation, migration execution, or live RETEST.

## Files inspected

`src/App.jsx`, `src/contexts/SupabaseAuthContext.jsx`, `src/lib/customSupabaseClient.js`, `src/pages/Dashboard.jsx`, `src/pages/Pricing.jsx`, `src/pages/CheckoutSuccess.jsx`, `src/pages/ReportHistory.jsx`, `src/pages/AdminDashboard.jsx`, `src/lib/reportUploadGate.js`, `src/lib/dashboardCustomerCopy.js`, `src/lib/jobFailureMessaging.js`, plus active dashboard/admin child surfaces referenced by those pages.

## Active route and surface map

`/pricing` renders Screening and Underwriting purchase tiles and calls `/api/create-checkout-session`. `/dashboard` renders `DashboardSwitch`; the admin email is routed to `AdminDashboard`, every other authenticated or unauthenticated session falls through to `Dashboard`. There is no route guard or loading/redirect branch that prevents an unauthenticated user from reaching the dashboard component. `CheckoutSuccess` and `ReportHistory` are present files but are not routed by `src/App.jsx`, so they are not active customer journey surfaces in the current router.

The active paid submission surface is `Dashboard.jsx`. It selects `screening` or `underwriting`, displays entitlement counts from `report_purchases`, requires a property name, computes a client-side policy hash, POSTs legal acceptance using a client-supplied profile ID, uploads to `staged_uploads`, calls `consume_purchase_and_create_job`, then calls `queue_job_for_processing`. The backend remains authoritative for consumption and queueing, but the browser may leave staged objects behind if a later RPC fails.

## Customer journey matrix

| Journey | Route/API/data/status | Refresh/message/CTA | Entitlement/history/admin alignment |
|---|---|---|---|
| 1. Buy Screening | `/pricing` -> `/api/create-checkout-session`; Stripe metadata selects `screening` | Redirect to Stripe; checkout success polling is in `CheckoutSuccess` only if separately routed, otherwise `/dashboard?checkout=success` toast | Backend webhook creates entitlement; dashboard count reads unconsumed purchase; admin sees purchase-derived credits. Client sends user ID to checkout API. |
| 2. Submit Screening | `/dashboard` -> staged upload -> `consume_purchase_and_create_job` -> `queue_job_for_processing` | Upload gate requires T12 + Rent Roll; CTA is `Generate screening report` | Purchase consumed and job/files created atomically by RPC; history is later read from `reports` plus recent jobs. |
| 3. Screening queued | Dashboard reads `analysis_jobs.status = queued` | 60-second polling while any active job exists; message says up to 24 business hours; dismiss CTA hides active row locally | Job remains visible in recent jobs, but stale polling can delay transition; admin worker/queue surfaces are separate. |
| 4. Screening success | Worker reaches `published`; dashboard reads `reports` with `storage_path` | Status maps to Ready; Download creates a signed URL from `generated_reports` | Report history row is visible if publication row exists; publication/object/status are not one transaction. |
| 5. Screening unusable core | Worker fails with missing/unusable T12 or Rent Roll; dashboard reads failed job and worker artifacts | Failure copy distinguishes T12/Rent Roll/source package when codes match; CTA is effectively dismiss or start a new report, not a corrected rerun | Entitlement restoration is discovered by artifact event and shown only after refresh/state propagation; failed job remains in recent history unless locally dismissed from the failure surface. |
| 6. Buy Underwriting | `/pricing` or dashboard purchase CTA -> `/api/create-checkout-session` with `underwriting` | Checkout redirect; no separate active success route in App router | Webhook entitlement is underwriting; client selector and backend RPC both use `underwriting`. |
| 7. Submit Underwriting | Dashboard -> staged files -> same RPCs | Gate requires T12, Rent Roll, and at least one support file; supporting labels include debt, appraisal, tax, inspection, environmental, lease, other | Backend RPC also requires support presence, but both rely on client doc labels/filename fallback; no content validation at submission. |
| 8. Underwriting queued | `analysis_jobs` queued and active-status list | Same 60-second interval and generic processing message | No distinct Underwriting queue surface; report type appears as a small label. |
| 9. Underwriting success | Worker published; `reports` row and signed storage object | Dashboard says Report complete/Ready and exposes Download | Clean publication is represented; no explicit customer quality-manifest read is performed. |
| 10. Underwriting published with limitations | Backend canonical delivery decision may allow publication with diagnostics/limitations | Frontend status normalization only recognizes Ready or Failed; no distinct limited/publication-with-limitations customer state | A limited publication can be shown as Ready or collapsed into Failed depending on canonical label, so surface can disagree with backend doctrine. |
| 11. Underwriting total failure | Failed job plus terminal code/artifacts | Failure copy may say system or document failure; CTA is dismiss and generic retry/contact guidance | No active customer-facing corrected rerun or replacement-document action bound to the failed job. |
| 12. Credit restoration | Worker clears `consumed_at` and writes `entitlement_restored` artifact | Dashboard derives restoration from worker artifact and recent failed jobs; explicit entitlement count refresh is manual, transition-triggered, or post-failure refresh | Backend restoration can succeed while artifact write or dashboard refresh fails; message may lag until Refresh. |
| 13. Corrected rerun | No active customer rerun handler found in Dashboard or App routes | Customer is told to start a new report; no prefilled property/job/document replacement CTA | A new purchase is required by visible Terms copy for user upload issues; no explicit linkage to the failed job. |
| 14. Revision request | `api/jobs/request-revision.js` is backend fail-closed 403; no active Dashboard CTA found | No customer revision surface | No persisted revision request or owned remediation job; backend and frontend both lack an actionable revision path. |
| 15. Replacement-document rerun | No active frontend replacement flow; upload form creates a new submission only | Existing staged files and failed job are not presented as replaceable package | No explicit replacement relation, source version, or report-history linkage; customer remedy is a new generation path. |

## Proven frontend findings

### F-066 - BLOCKER - Frontend collapses published-with-limitations, publication hold, and clean publication into Ready/Failed

`dashboardCustomerCopy.js` normalizes `under_review`, `needs_documents`, `publication_held`, and `admin_review_required` to `failed`, while the active Dashboard status badge only renders canonical `ready` or `failed` and otherwise falls back to raw processing statuses. No customer surface renders a distinct published-with-limitations state, quality-manifest summary, or clean-versus-limited publication explanation. A backend decision can therefore be customer-visible as the wrong outcome.

**Status:** PROVEN. **Owner:** frontend/customer-surface. **Doctrine impact:** blocked catastrophic reports, limited publications, and clean publications must be separate customer contracts.

### F-067 - HIGH - Active report history is split from the dead ReportHistory page and the dead page cannot download reports

The active Dashboard reads `reports` and signs `generated_reports` objects, but `ReportHistory.jsx` reads an unrelated `properties` table, is not routed, and its Download button only shows an alert. This creates two incompatible history authorities and leaves the apparent dedicated history surface nonfunctional.

**Status:** PROVEN. **Owner:** frontend/history. **Doctrine impact:** completed, failed, and limited report history must have one active source and working tenant-bound download behavior.

### F-068 - HIGH - `/dashboard` has no explicit authentication route guard and admin routing depends on a client-visible email comparison

`DashboardSwitch` calls `auth.getUser()` and chooses AdminDashboard only when the email equals `hello@investoriq.tech`; otherwise it renders the customer Dashboard, including when no user is returned. AdminDashboard separately accepts a locally stored admin run key and queries service-role-backed admin endpoints. The route does not establish a customer authorization boundary before rendering.

**Status:** PROVEN. **Owner:** frontend/auth/admin. **Doctrine impact:** admin-only data and customer surfaces need explicit server-backed authorization boundaries.

### F-069 - HIGH - Customer state is refresh-driven and can remain stale across purchase, failure, restoration, and publication transitions

The Dashboard polls active jobs every 60 seconds only while its local active-job predicate is true. Entitlements, recent jobs, reports, failure artifacts, and restoration artifacts are fetched in separate calls. Checkout success uses a query-string toast and does not itself guarantee webhook completion. A backend restoration or publication can therefore exist while the visible count/history/message remains stale until manual Refresh or a later transition.

**Status:** PROVEN. **Owner:** frontend/state synchronization. **Doctrine impact:** paid state and credit state must converge visibly without requiring a second refresh path.

### F-070 - HIGH - Purchase and legal-acceptance UI sends user-controlled identity fields

`Pricing.jsx` sends `userId` and `userEmail` from the browser to checkout creation. `Dashboard.jsx` sends `profile.id` and a browser-computed policy hash to `/api/legal-acceptance`. The Stage 8 route findings prove the server accepts these identifiers through service-role paths. Frontend behavior therefore participates directly in the cross-account billing/legal authorization boundary.

**Status:** PROVEN. **Owner:** frontend/auth/billing/legal. **Doctrine impact:** user identity and legal acceptance must derive from the authenticated actor, not browser payloads.

### F-071 - HIGH - No active corrected-rerun, replacement-document, or revision-request customer path exists

The active Dashboard can dismiss failed jobs and start a fresh report, but it does not bind a failed job to a corrected upload, replacement source version, or revision request. `request-revision.js` remains a fail-closed 403 and no active route or CTA invokes it. Customer remedies are therefore generic and cannot distinguish customer document replacement from InvestorIQ regeneration.

**Status:** PROVEN. **Owner:** frontend/remediation. **Doctrine impact:** every terminal failure needs an owned remedy and durable relation to the affected job/report.

## Cross-surface risks confirmed

The frontend gate prevents submission without client-labeled core documents and Underwriting support, but it does not prove content usability. Screening and Underwriting are distinct selector values, yet many status and failure surfaces show only generic labels. Failed jobs can be locally hidden from active/failure cards through `localStorage` dismissal, while active processing can be missed if legacy `in_progress` rows are used. Customer-facing quality manifests, proactive review state, internal test assignment, and Premium assignment are not exposed as governed customer states. Mobile uses responsive flex/grid patterns and overflow tables in admin/history, but no dedicated mobile error boundary or stale-client repair mechanism is present. `DASHBOARD_DIAG_MINIMAL` is a source-controlled internal bypass branch, currently false, that remains reachable in the customer bundle and can omit upload persistence behavior when enabled.

## Remedy matrix

| Backend outcome | Current customer surface | Required governed remedy boundary |
|---|---|---|
| Customer document failure | Generic or category-specific failure; new report guidance | Replacement-document rerun linked to failed job, with restored credit state explicit |
| InvestorIQ/system failure | Generic failure and contact email | No-cost regeneration/retry path tied to same property/job and terminal ownership |
| Core contradiction | Failure/source-package copy | Preserve contradiction evidence and distinguish from parser/provider failure |
| Published clean | Ready + Download | Show canonical clean publication and report identity |
| Published with limitations | Ready or failed normalization | Distinct limited publication state with affected sections and disclosures |
| Credit restored | Artifact-derived message and count after refresh | Atomic restoration receipt plus visible entitlement refresh |
| Revision request | No active CTA; backend 403 | Authenticated request creation, ownership, status, and worker/remediation handoff |

## Stage conclusion

The active Dashboard is the real customer surface, not the legacy `ReportHistory` or `CheckoutSuccess` files. It covers basic purchase, upload, queue, failure, and publication flows, but it does not provide a governed customer contract for limited publication, corrected reruns, revisions, or immediate credit convergence. Next stage is doctrine/archive reconciliation and final evidence closure.
