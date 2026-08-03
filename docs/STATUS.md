# InvestorIQ Status

Current date: August 2, 2026

Current authority:
- Treat `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-07-31.md` as the practical daily handoff (with Aug 2 addendum below).
- Product and launch decisions remain governed by `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`.
- Premium assignment remains `false`.
- RETEST 39 has executed once after H6 production migration; it is **not authorized for requeue**.
- RETEST 40 must **not** be created.
- Production retry / live retest must wait until Vercel deployment for `a06b897` is Ready.
- No broad tests, no manual deploy, no source-code edits outside explicitly authorized packets.

## Aug 2, 2026 — Parser rescue and RETEST 39 record

Repository state (verified):
- Branch: `main`
- HEAD / origin/main: `a3dfb5f` (docs authority cleanup lineage; includes parser fix `a06b897`)
- Parser fix commit: `a06b897` — `fix(parser): hash spreadsheet T12 and rent-roll sources`
- Docs record commits: `9e12f88`, `a3dfb5f`
- Working tree: clean after this packet
- `api/parse/parse-doc.js` restored and verified (~259 KB, exactly three `buildSourceContentSha256` sites: import + Rent Roll spreadsheet branch + T12 spreadsheet branch; Textract path untouched)
- Active authority docs: `docs/STATUS.md`, `docs/ROADMAP.md`, `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-07-31.md`, `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`, `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
- Superseded duplicates archived: `Older and Archived MD Files/STATUS_UPDATED_2026-07-31_SUPERSEDED.md`, `Older and Archived MD Files/ROADMAP_UPDATED_2026-07-31_SUPERSEDED.md`

RETEST 39 incident:
- Job `084a982e-ff6e-49b0-a7f7-473ed314aada` reached worker execution after H6 production migration was applied.
- H6 production schema verified: 7 worker columns, 2 worker constraints, 10 H6 functions, service_role EXECUTE true for all 10.
- Failure outcome: `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`.
- Root cause was **not** a customer bad-document issue.
- Root cause: spreadsheet T12 / Rent Roll parse path referenced undefined `sourceContentSha256` (hash helper import and two spreadsheet-branch definitions were missing after earlier partial restores).
- Fix: restore full intact `api/parse/parse-doc.js` and add exactly three lines — import `buildSourceContentSha256` from `../_lib/recovery-content-hash-cache.js`, then define `sourceContentSha256` after each `Buffer.from(arrayBuffer)` in the Rent Roll and T12 spreadsheet branches. Textract path left untouched.
- Credit restored for the failed run; customer path remains fail-closed and recoverable.
- **RETEST 39 is not requeued.**
- **RETEST 40 must not be created.**
- Next governed action: confirm Vercel Production deployment for commit `a06b897` is Ready, then decide whether a single governed RETEST 39 retry is authorized. No automatic retry.

Authority cleanup (this packet):
- Single active `docs/STATUS.md` and single active `docs/ROADMAP.md`.
- July 31 duplicate copies moved to archive as `*_SUPERSEDED.md`.
- Canonical handoff HEAD pointer refreshed to `a3dfb5f` with parser fix noted.
- Historical archived handoff body remains intact under Pre-H0 archive.

Do not treat this status note as authorization to requeue RETEST 39, create RETEST 40, edit parser source, or run broad tests.
