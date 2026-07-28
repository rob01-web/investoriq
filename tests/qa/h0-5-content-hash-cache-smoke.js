import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  buildCacheDiagnostics,
  buildSourceContentSha256,
  loadCachedRecoveryPayload,
} from '../../api/_lib/recovery-content-hash-cache.js';

const buffer = Buffer.from('InvestorIQ cache smoke', 'utf8');
const expectedHash = createHash('sha256').update(buffer).digest('hex');

assert.equal(buildSourceContentSha256(buffer), expectedHash);
assert.equal(buildSourceContentSha256(Buffer.from(buffer)), expectedHash);

const diagnostics = buildCacheDiagnostics({
  artifactType: 't12_parsed',
  recoveryKind: 't12',
  sourceContentSha256: expectedHash,
  cacheHit: true,
});

assert.equal(diagnostics.cache_hit, true);
assert.equal(diagnostics.final_outcome, 'cache_hit');
assert.equal(diagnostics.cache_key, `t12_parsed:t12:${expectedHash}`);
assert.equal(diagnostics.source_content_sha256, expectedHash);

const queryLog = [];
const supabaseAdmin = {
  from(table) {
    queryLog.push(['from', table]);
    const chain = {
      select(columns) {
        queryLog.push(['select', columns]);
        return chain;
      },
      eq(column, value) {
        queryLog.push(['eq', column, value]);
        return chain;
      },
      order(column, options) {
        queryLog.push(['order', column, options]);
        return chain;
      },
      limit(value) {
        queryLog.push(['limit', value]);
        return chain;
      },
      maybeSingle: async () => ({
        data: {
          payload: {
            source_content_sha256: expectedHash,
            recovery_kind: 't12',
            accepted: true,
          },
        },
        error: null,
      }),
    };
    return chain;
  },
};

const cachedPayload = await loadCachedRecoveryPayload({
  supabaseAdmin,
  artifactType: 't12_parsed',
  recoveryKind: 't12',
  sourceContentSha256: expectedHash,
});

assert.equal(cachedPayload.source_content_sha256, expectedHash);
assert.equal(cachedPayload.recovery_kind, 't12');
assert.equal(cachedPayload.recovery_cache_hit, true);
assert.equal(cachedPayload.recovery_cache_key, `t12_parsed:t12:${expectedHash}`);
assert.equal(cachedPayload.accepted, true);
assert.deepEqual(queryLog.slice(0, 4), [
  ['from', 'analysis_artifacts'],
  ['select', 'payload, created_at'],
  ['eq', 'type', 't12_parsed'],
  ['eq', 'payload->>source_content_sha256', expectedHash],
]);

console.log('h0-5 content hash cache smoke PASS');
