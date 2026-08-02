# InvestorIQ Canonical Handoff and Playbook
## Updated July 30, 2026 - Canonical merged handoff/playbook
## Aug 2, 2026 addendum (parser rescue + RETEST 39)

**This file is archived.** Prefer `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-07-31.md` plus `docs/STATUS.md` / `docs/ROADMAP.md` for live authority.

Aug 2 record (do not re-interpret as authorization to requeue or create RETEST 40):

- `origin/main` = `a06b897` — `fix(parser): hash spreadsheet T12 and rent-roll sources`.
- Full `api/parse/parse-doc.js` restored after temporary GitHub API placeholder corruption.
- Exactly three hash fixes applied: import of `buildSourceContentSha256`; definition in Rent Roll spreadsheet branch; definition in T12 spreadsheet branch. Textract path untouched.
- RETEST 39 job `084a982e-ff6e-49b0-a7f7-473ed314aada` reached worker after H6 production migration, then failed `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` because spreadsheet T12 referenced undefined `sourceContentSha256` and discarded a valid artifact (not a customer document defect).
- Credit/entitlement restored. **Do not requeue RETEST 39. Do not create RETEST 40.**
- Production retry only after Vercel deployment for `a06b897` is Ready.
- Future writes to `api/parse/parse-doc.js` must use local git commit/push only (no GitHub large-file API writes).

---

Historical body below (July 30 record; retained for continuity):

## 0. Current state of record

```text
Branch: investigation/full-repo-underwriting-audit
H0: complete
H0.5: complete
H0.75: complete
H1: complete
H2: complete
H3: complete
H4: complete
H5: complete
H6: complete
H7: complete
H8: complete
H9/H10 migration created but not applied: supabase/migrations/20260730000100_h9_h10_report_revision_lineage.sql
H11: complete
H12: complete
H13: complete
H14: complete
H15: complete
H16: complete
H17: complete
H18: complete
H19: complete
Latest implementation commit: 4e2c043 Prove governed canary and simultaneous launch certification
Latest documentation correction commit: 5906ae6 Correct launch migration readiness record
Latest documentation commit: Record launch deployment preparation
Migration classifications: 20260728000100_h2b1_staged_uploads_private.sql=already_proven_applied; 20260728000200_h2b2_report_purchases_update_policy_cleanup.sql=already_proven_applied; 20260730000100_h9_h10_report_revision_lineage.sql=required_before_deployment
Launch deployment preparation complete.
Working tree: clean
Remote: not updated because no push is authorized
Next boundary: Separately authorized launch execution: production-branch integration, required migration application, Stripe/Vercel reconciliation, deployment, and governed simultaneous canary
Next authorized packet: Launch execution packet - perform only explicitly authorized integration, migration, configuration, deployment, and governed canary steps with a stop gate before each production-changing action
Operating mode from H2 forward: bounded packet mode
```

Current forbidden actions remain:
- No deployment.
- No migration application.
- No production data change.
- No Stripe configuration change.
- Premium remains exactly false.
- RETEST 39 remains unauthorized.

## 1. Canonical relationship

- The July 27 canonical Opus/Claude game plan remains the launch constitution and blocker map.
- The July 28 independent audit v3 is an amendment, not a replacement.
- ChatGPT Keeper recommendation remains: pass as an amendment, hold as a replacement.
- H0, H0.5, H0.75, H1, H2, H3, and H4 are complete.
- H5 is complete.
