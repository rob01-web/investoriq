# InvestorIQ CHAT_HANDOFF Folder

## START HERE

For a normal new chat, upload or paste **only**:

`03_FRESH_CHAT_PROMPT.md`

If the new chat is specifically performing owner visual acceptance, also upload the two exact Phase 8B PDFs named in that prompt. Do not upload the `archived/` folder, old prompts, ZIP files, recovery PDFs, or audit receipts unless the fresh chat identifies a specific historical question that requires them.

**Current state:** Phase 8B is locally closed and certified on its isolated branch. Production deployment is on HOLD pending exact-artifact owner acceptance and resolution of the repository's 15/12 Vercel Hobby function-budget gate.

The root of this folder must contain exactly the five files listed below plus the `archived/` directory. Everything else belongs in the archive, never in the live navigation layer.

This folder keeps the active authority simple without deleting historical information.

## Current root files

Use only these for normal continuation:

- `00_CURRENT_HANDOFF.md` - current state, Git authority, active phase, immediate next move
- `01_MASTER_PLAN.md` - current product/program doctrine and protected boundaries
- `02_ELITE_REPORT_BLUEPRINT.md` - current Screening and Underwriting information/visual authority
- `03_FRESH_CHAT_PROMPT.md` - copy/paste continuation prompt for the next chat
- `README.md` - folder rules

## Archive

`archived/` is the immutable historical record.

Superseded root authority must be copied into a dated archive snapshot before the root version is materially rewritten.

The 2026-09-03 authority files that preceded the Decision Snapshot doctrine are preserved verbatim under:

`archived/2026-09-04-pre-decision-snapshot-doctrine/`

The authority files that preceded the Phase 8B closeout consolidation are preserved byte-for-byte under:

`archived/2026-09-04-pre-phase8b-closeout-consolidation/`

Older August/September checkpoints remain under the existing archive hierarchy.

## Preservation rule

**Never clean this folder by deleting historical authority.**

Organization means:

1. keep only the five current navigation/authority files at root;
2. move or copy superseded authority into `archived/`;
3. keep evidence bundles, PDFs, ZIPs, audit receipts, and historical scratch material out of the root authority set;
4. consult archived checkpoints rather than reconstructing missing history from memory.

If a local working copy contains many extra handoff files, do not delete them blindly. Preserve the local folder first, then reconcile it to the clean remote authority structure.

For the cluttered Windows working copy shown on 2026-09-04, use `scripts/maintenance/consolidate-chat-handoff.ps1`. It creates a full ZIP backup first and moves every non-current root file into a timestamped archive. Its default mode is a dry run; `-Apply` is required to make changes.

From the repository root in PowerShell, after pulling the canonical branch:

```powershell
.\scripts\maintenance\consolidate-chat-handoff.ps1
.\scripts\maintenance\consolidate-chat-handoff.ps1 -Apply
```
