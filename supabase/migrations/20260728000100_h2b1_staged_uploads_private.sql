-- H2-B1: staged uploads bucket privacy and upload boundary
-- Idempotent / repeatable: UPDATE is scoped by id; policy recreation uses DROP IF EXISTS.

update storage.buckets
set public = false
where id = 'staged_uploads';

drop policy if exists "InvestorIQ authenticated staged_uploads upload only"
on storage.objects;

drop policy if exists staged_uploads_insert_own on storage.objects;
create policy staged_uploads_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'staged_uploads'
  and name like ('staged/' || auth.uid()::text || '/%')
);
