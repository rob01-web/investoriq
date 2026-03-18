INVESTORIQ — MASTER CONTEXT (PRE-LAUNCH)
0. SYSTEM IDENTITY

InvestorIQ = Document-Driven, Deterministic Real Estate Underwriting Engine

Positioning:

Institutional-grade (Blackstone / Brookfield quality bar)

No AI fluff

No speculation

No BUY/SELL language

Fail-closed system

Every output must be traceable to documents

Core Differentiator:
👉 Refinance Collapse Risk Modeling (deterministic, document-derived)

1. PRODUCT STRUCTURE
1. Screening Report (~$299)

Decision memo style

Ranked deterministic drivers

No empty sections

No filler text

Fail-closed gating

Fast insight layer

2. Underwriting Report (~$999)

Lender-grade analysis

Full financial reconstruction

Refinance Stability Classification:

Stable

Sensitized

Fragile

Refinance Failure Under Stress

Rules:

ONE purchase = ONE generation

No reruns unless system fault

Deterministic math only

Document-backed only

2. CORE SYSTEM ARCHITECTURE

Pipeline:

Upload → Parse → Classify → Extract → Analyze → Score → Render → PDF

Statuses:

needs_documents
→ queued
→ extracting
→ underwriting
→ scoring
→ rendering
→ pdf_generating
→ publishing
→ published
Key Backend Files

api/generate-client-report.js → MAIN ENGINE

report-template-runtime.html → HTML → PDF template

Dashboard.jsx → upload + trigger UI

Supabase → storage + job state + artifacts

Critical Tables

analysis_jobs

analysis_job_files

analysis_artifacts

Key Artifact Types

rent_roll_parsed

t12_parsed

mortgage_statement_parsed

loan_term_sheet_parsed

3. CURRENT CRITICAL ISSUE (DO NOT FORGET)
🚨 Debt / Refinance Bridge Issue

Problem:

Mortgage / debt data not reliably flowing into underwriting

Term sheets not always becoming mortgage_statement_parsed

Fallback logic inconsistent

Location:

api/generate-client-report.js

~lines 2332–2398

Behavior:

Tries:

mortgage_statement_parsed

fallback → loan_term_sheet_parsed

If classification fails upstream → report behaves as if NO debt exists

🔥 THIS IS WHAT WE RETURN TO AFTER DESIGN
4. REPORT ENGINE RULES

ASCII only

No mojibake (Â· etc.)

No fabricated narrative

Collapse sections with no data

No "DATA NOT AVAILABLE" spam

Deterministic outputs only

Fail closed if missing critical inputs

5. DESIGN TRANSFORMATION (CURRENT PHASE)
❌ OLD PROBLEM

Too dark (navy heavy)

Feels heavy / dated

Not “institutional luxury”

Not crisp or breathable

✅ NEW DESIGN DIRECTION (LOCKED)
🎯 FEELING

Glossy white paper

Black ink authority

Editorial / annual report quality

Minimal, restrained luxury

🎨 COLOR SYSTEM (LOCKED)
White:        #FFFFFF
Paper Warm:   #FAFAF8

Primary Ink:  #111111 / #0C0C0C
Secondary:    #4A4A4A
Tertiary:     #6F6F6F
Light:        #9A9A9A

Hairline:     #E8E5DF
Hairline Mid: #D0CCC4

Gold:         #C9A84C
Gold Dark:    #9A7A2C
✍️ TYPOGRAPHY (LOCKED)
Display: Cormorant Garamond → authority / editorial
Body:    DM Sans → clean / modern
Mono:    DM Mono → labels / metadata

Tone:
👉 “Written with authority”

6. DESIGN SYSTEM PRINCIPLES

Typography > color

Minimal color usage

Gold = accent only (never dominant)

Thin rules > boxes

Air > density

No heavy fills

No dark backgrounds inside report body

7. CURRENT TEMPLATE STATUS
✅ Completed

Font system replaced

Root variables replaced

Header strip redesigned

Footer cleaned

Section header system being redesigned (Patch 3)

⚠️ NOT YET UPDATED

Still using old system:

KPI cards

Tables

Verdict blocks

Section interiors

Cover page

Remaining navy / teal usage

8. NEXT DESIGN PATCHES (ORDER MATTERS)

✅ Patch 2 — base layout (DONE)

🔄 Patch 3 — section headers (IN PROGRESS)

⏭ Patch 4 — Executive Summary redesign

⏭ Patch 5 — KPI system (critical)

⏭ Patch 6 — tables (major visual impact)

⏭ Patch 7 — verdict blocks

⏭ Patch 8 — cover page (LAST)

9. PRODUCT PHILOSOPHY

InvestorIQ is NOT:

AI-generated narrative fluff

Pretty dashboards

Opinion-based

InvestorIQ IS:

Document truth → structured → modeled → scored

Deterministic underwriting engine

Institutional decision support

10. BRAND POSITIONING (FOR SITE + REPORTS)

Primary message:
👉 “The only document-driven underwriting system that models refinance collapse risk.”

Tone:

Institutional

Precise

Calm authority

No hype

11. UX / SYSTEM BEHAVIOR RULES

Upload does NOT imply processing

User must click Generate

Clear states:

Upload received

Processing started

No ambiguity

12. ENTITLEMENT LOGIC

1 purchase = 1 report

No reruns

Exception:

system failure → auto restore credit

13. KNOWN UX ISSUES

Upload toast implies auto-processing (misleading)

Jobs sometimes stuck in "queued"

Need better failure messaging (partially fixed)

14. IMMEDIATE PRIORITIES (IN ORDER)
1. Finish report redesign (CURRENT)

Section headers → KPI → tables → cover

2. RETURN TO:

🚨 Debt / refinance bridge fix

3. Then:

Stabilize pipeline (no stuck jobs)

Improve UX clarity

Final polish

4. Then:

🚀 LAUNCH

15. CODING RULES (CRITICAL)

Anchor-locked patches ONLY

Replace EXACT blocks only

If mismatch → STOP

No global replace

No regex across file

No refactors

One file at a time

Must pass:

node --check api/generate-client-report.js
16. FINAL NOTE

We are in final pre-launch phase.

DO NOT:

introduce new features

refactor core engine

change logic unnecessarily

FOCUS:
👉 visual authority + pipeline reliability