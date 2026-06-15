/**
 * Single source of truth for all document role and authority decisions.
 * Raw files, extracted text, parser artifacts, and filename heuristics may only be read here.
 * All downstream consumers must treat this output as immutable authority.
 */
export function buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts) {
  void uploadedFiles;
  void parsedArtifacts;
  return null;
}
