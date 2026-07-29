-- H2-B2: remove the broad owner UPDATE policy on report_purchases.
-- Idempotent / repeatable: the drop is guarded with IF EXISTS.

drop policy if exists "Users can update their own purchases" on public.report_purchases;
