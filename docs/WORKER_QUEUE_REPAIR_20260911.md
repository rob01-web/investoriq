# Worker queue blockage repair

Base: `8e4c1c1c2aa4a7a1946fe25648a17502fffaece3`.
Repair branch: `hotfix-worker-queue-starvation-20260911-r1`.

## Incident evidence

The owner's September 11 cron response evidence proves authenticated worker calls
returned HTTP 200 with no transitions while an August 17 queued row was repeatedly
recorded as `already_claimed_or_unavailable`. Selection ordered all queued rows
oldest first and limited candidates to one before attempting the governed claim.
The unclaimable oldest row occupied that window on every invocation. September 11
Screening and Underwriting jobs remained queued without claim attempts.

Production source was deployed by the owner at the base SHA above. The existing
Supabase cron and scheduler authority are enabled per owner evidence. Older
handoff notes describing promotion pending and scheduler disabled are historical.
The new repair is NOT deployed merely by committing these files.

## Change and security boundary

- Filter missing admission receipts and unsupported product/family values before
  applying the candidate page limit. Preserve legacy records without mutation.
- Scan in `(created_at, id)` order with a forward-only cursor retained throughout
  each invocation; preserve timestamp microseconds and avoid offset pagination.
- Rejected/raced/error candidates do not consume the successful-claim batch limit.
- Every candidate still passes through `claim_worker_job`; no new claim function,
  RLS grant, migration, scheduler authority, purchase consumption or model change.
- Exact-job execution does not scan or claim unrelated jobs.
- Include scan/claim counters and `needsAttention` in the authenticated worker
  response and emit `queue_requires_attention` in server logs when appropriate.
- H8's test loader maps the new helper import to a file URL; no entitlement
  assertion is removed or relaxed.

## Verification and limits

The executable regression runs the actual worker selection and claim block using
the installed Supabase client against a local HTTP adapter. Scenarios cover legacy
rows, 1,000 receipt-less rows, 71 rejected/error candidates ahead of valid jobs,
equal timestamps across pages, queue shrinkage, simulated overlapping claims,
exact-mode isolation, query failure and bounded exhaustion.

This is NOT a real PostgreSQL concurrency test, PDF delivery test or throughput
benchmark. The database claim function, entitlement behavior and publication path
are unchanged. Existing canonical checks remain required. The new isolated CI
workflow runs regressions, reconciliation, canonical QA and build without changing
source or generating migrations.

Each invocation scans at most 250 candidates within the existing worker runtime
budget. If more than 250 receipt-bearing but unclaimable jobs accumulate at the
front, later jobs can still wait across invocations because the cursor is not
persisted. `scanBudgetExhausted` and `needsAttention` expose this limit; they are
diagnostics, not a configured notification service. Receipt-less legacy backlog
does not consume this window. No claim of unrestricted scalability is made.

## Remaining production acceptance

1. Complete certification at the exact repair SHA before promotion.
2. After an authorized deployment, observe existing queued jobs through actual
   claim, processing and valid publication or a governed failure/remedy outcome.
   Do not resubmit purchases or manufacture admission receipts.
3. Investigate observed intermittent Supabase Gateway Timeout responses if they
   continue. This repair does not fix infrastructure timeouts.
4. Establish real database concurrency and workload throughput/queue-age evidence
   before claiming high-volume launch readiness. A backlog exceeding the bounded
   scan limit requires a separately verified durable fairness strategy.
5. Rotate the cron credential disclosed in chat through the normal secure workflow;
   never copy that credential into code, documentation or chat output.

Public launch remains on hold until live acceptance and capacity are established.
Closed AI architecture/report design phases stay closed; GPT-4o stays launch authority.
