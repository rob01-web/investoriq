import { visibleArtifactText } from './phase8-artifact-identity-fingerprint.js';

// Check the disclosure itself, not a matching phrase elsewhere in the report.
function classBlock(html, className) {
  const tags = /<\/?div\b[^>]*>/gi;
  let start = -1;
  let depth = 0;
  for (const match of html.matchAll(tags)) {
    const closing = /^<\//.test(match[0]);
    if (start < 0) {
      const classes = match[0].match(/\bclass=["']([^"']*)["']/i)?.[1].split(/\s+/) || [];
      if (!closing && classes.includes(className)) { start = match.index; depth = 1; }
    } else {
      depth += closing ? -1 : 1;
      if (depth === 0) return html.slice(start, match.index + match[0].length);
    }
  }
  return '';
}

export function assertScreeningReconciliationArtifact(html, { gross_potential_rent: gpr, annual_in_place_rent: rent }) {
  const clean = String(html).replace(/<!--[\s\S]*?-->|<style\b[^>]*>[\s\S]*?<\/style>|<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const block = classBlock(clean, 'phase8b-reconciliation-block');
  const fail = detail => { throw new Error(`PHASE8_SCREENING_RECONCILIATION_MISSING:${detail}`); };
  if (!block) fail('disclosure_block');
  if (!Number.isFinite(gpr) || gpr <= 0 || !Number.isFinite(rent)) fail('expected_source_bases');
  const title = visibleArtifactText(block.match(/<p\b[^>]*class="iq-callout-title"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
  if (!/^(?:Core )?Source Difference (?:Review|Requires Review)$/i.test(title)) fail('reader_facing_title');
  const copy = visibleArtifactText(block.match(/<p\b[^>]*class="iq-callout-copy"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
  const delta = rent - gpr;
  const variance = delta / gpr * 100;
  const money = value => `${value < 0 ? '(' : ''}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}${value < 0 ? ')' : ''}`;
  const expected = new Map([
    ['T12 Gross Potential Rent', money(gpr)],
    ['Rent Roll Annual In-Place', money(rent)],
    ['Difference', money(delta)],
    ['Variance', `${variance.toFixed(1)}%`],
  ]);
  const metrics = [...block.matchAll(/<div\b[^>]*class="iq-ic-reconciliation-metric"[^>]*>([\s\S]*?)<\/div>/gi)];
  if (metrics.length !== expected.size) fail('metric_count');
  for (const [, metric] of metrics) {
    const label = visibleArtifactText(metric.match(/<span\b[^>]*>([\s\S]*?)<\/span>/i)?.[1] || '');
    const value = visibleArtifactText(metric.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i)?.[1] || '');
    if (!expected.has(label) || expected.get(label) !== value) fail(`metric:${label}`);
    expected.delete(label);
  }
  // The certification fixture is materially discrepant: preserve both severity and next action.
  if (!copy.includes(`${Math.abs(variance).toFixed(1)}%`) || !/on hold until the difference is reconciled/i.test(copy)) fail('material_disclosure');
  return { disclosure_present: true, source_bases_and_signed_variance_verified: true, hold_and_follow_up_preserved: true };
}
