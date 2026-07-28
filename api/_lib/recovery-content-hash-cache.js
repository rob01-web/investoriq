import { createHash } from 'node:crypto';

const CONTENT_HASH_CACHE_ENABLED = process.env.ENABLE_AI_CONTENT_HASH_CACHE !== 'false';

const normalizeText = (value) => String(value || '').trim().toLowerCase();

export const CONTENT_HASH_CACHE_ARTIFACT_FIELD = 'source_content_sha256';

export function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeContentHash(value) {
  const text = normalizeText(value);
  return text ? text : null;
}

export function buildSourceContentSha256(buffer) {
  if (!buffer) return null;
  return sha256Hex(buffer);
}

export function buildCacheKey({ artifactType, recoveryKind, sourceContentSha256 }) {
  const hash = normalizeContentHash(sourceContentSha256);
  if (!hash) return null;
  return [
    normalizeText(artifactType || ''),
    normalizeText(recoveryKind || ''),
    hash,
  ].filter(Boolean).join(':');
}

export function buildCacheDiagnostics({
  artifactType = null,
  recoveryKind = null,
  sourceContentSha256 = null,
  cacheHit = false,
}) {
  const normalizedHash = normalizeContentHash(sourceContentSha256);
  return {
    attempted: true,
    cache_enabled: CONTENT_HASH_CACHE_ENABLED,
    cache_hit: cacheHit === true,
    cache_key: buildCacheKey({
      artifactType,
      recoveryKind,
      sourceContentSha256: normalizedHash,
    }),
    source_content_sha256: normalizedHash,
    recovery_kind: recoveryKind || null,
    openai_request_attempted: false,
    openai_response_status: null,
    provider_error_class: null,
    provider_error_code: null,
    provider_error_type: null,
    provider_error_message: null,
    provider_response_status: null,
    provider_request_id: null,
    provider_error_body: null,
    json_parse_success: true,
    candidate_present: true,
    validation_accepted: true,
    validation_reasons: [],
    rejection_reasons: [],
    accepted_fields: [],
    derived_fields: [],
    rejection_reason: null,
    final_outcome: cacheHit === true ? 'cache_hit' : 'cache_miss',
  };
}

export function decorateCachedPayload(payload, {
  artifactType = null,
  recoveryKind = null,
  sourceContentSha256 = null,
}) {
  return {
    ...(payload && typeof payload === 'object' ? payload : {}),
    source_content_sha256: normalizeContentHash(sourceContentSha256),
    recovery_kind: recoveryKind || null,
    recovery_cache_key: buildCacheKey({
      artifactType,
      recoveryKind,
      sourceContentSha256,
    }),
    recovery_cache_hit: true,
    recovery_cache_enabled: CONTENT_HASH_CACHE_ENABLED,
  };
}

export async function loadCachedRecoveryPayload({
  supabaseAdmin,
  artifactType,
  recoveryKind,
  sourceContentSha256,
} = {}) {
  if (!CONTENT_HASH_CACHE_ENABLED) return null;
  const normalizedHash = normalizeContentHash(sourceContentSha256);
  if (!supabaseAdmin?.from || !artifactType || !normalizedHash) return null;

  let query = supabaseAdmin
    .from('analysis_artifacts')
    .select('payload, created_at')
    .eq('type', artifactType)
    .eq(`payload->>${CONTENT_HASH_CACHE_ARTIFACT_FIELD}`, normalizedHash);

  if (recoveryKind) {
    query = query.eq('payload->>recovery_kind', recoveryKind);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  const cachedPayload = data?.payload && typeof data.payload === 'object' ? data.payload : null;
  if (!cachedPayload) return null;
  return decorateCachedPayload(cachedPayload, {
    artifactType,
    recoveryKind,
    sourceContentSha256: normalizedHash,
  });
}

export {
  CONTENT_HASH_CACHE_ENABLED,
};
