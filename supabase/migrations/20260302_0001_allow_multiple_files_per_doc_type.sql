-- Allow multiple files of the same doc_type per job.
-- Drops the unique(job_id, doc_type) constraint and replaces it
-- with unique(job_id, object_path) so the same logical doc_type
-- (e.g. 'supporting_documents') can appear more than once per job
-- as long as each file has a distinct storage path.
-- No rows are deleted. Fully non-destructive.

ALTER TABLE analysis_job_files
  DROP CONSTRAINT IF EXISTS analysis_job_files_job_id_doc_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS analysis_job_files_job_id_object_path_key
  ON analysis_job_files (job_id, object_path);
