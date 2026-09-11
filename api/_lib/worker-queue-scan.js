// Selection only. This module must never establish claim or entitlement authority.
// Use a tuple cursor, not offsets: other workers remove rows while we scan.
export function applyWorkerQueueCursor(query, cursor) {
  if (!cursor) return query;
  if (!/^[0-9a-f-]{36}$/i.test(cursor.id) ||
      !/^\d{4}-\d\d-\d\d[T ][0-9:.]+(?:Z|[+-][0-9:]+)$/.test(cursor.created_at)) {
    throw new Error('Invalid worker queue cursor');
  }
  // Preserve database microseconds; Date.toISOString() would lose precision.
  const timestamp = `"${cursor.created_at}"`;
  return query.or(`created_at.gt.${timestamp},and(created_at.eq.${timestamp},id.gt.${cursor.id})`);
}

export function createWorkerQueueScan({ fetchPage, deadlineMs, now = Date.now, pageSize = 25, maxCandidates = 250 }) {
  let buffer = [];
  let cursor = null;
  let exhausted = false;
  const stats = { scanned: 0, pages: 0, skipped: 0, claimErrors: 0, claimed: 0, scanBudgetExhausted: false };
  return {
    stats,
    async next() {
      if (exhausted) return null;
      if (stats.scanned >= maxCandidates || now() >= deadlineMs) {
        stats.scanBudgetExhausted = true;
        return null;
      }
      if (!buffer.length) {
        const { data, error } = await fetchPage(cursor, Math.min(pageSize, maxCandidates - stats.scanned));
        stats.pages += 1;
        if (error) throw new Error(`Failed to fetch queued jobs: ${error.message || 'database error'}`);
        if (!Array.isArray(data)) throw new Error('Invalid worker queue response');
        buffer = data;
        if (!buffer.length) {
          exhausted = true;
          return null;
        }
      }
      if (now() >= deadlineMs) {
        stats.scanBudgetExhausted = true;
        return null;
      }
      const job = buffer.shift();
      // Advance before claiming, including on rejected/raced candidates.
      if (cursor && job.id === cursor.id) throw new Error('Worker queue cursor did not advance');
      cursor = { created_at: job.created_at, id: job.id };
      stats.scanned += 1;
      return job;
    },
  };
}
