// Local HTML proof: real XLSX parsers + real report handler. Supporting artifacts
// use the preserved Stonebridge fixture. This is not a live publication receipt.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import XLSX from 'xlsx';
import { parseRentRollFromRowMatrices, parseT12FromRowMatrices } from '../api/parse/parse-doc.js';
import { resolveCanonicalRentRollAnnualTotals } from '../api/_lib/report-surface-contracts.js';
import { buildPhase8CertificationRequests, renderPhase8CertificationArtifacts } from './phase8-visual-certification-fixtures.js';
Object.assign(process.env, { NODE_ENV: 'test', INVESTORIQ_ENABLE_TEST_HOOKS: 'true', SUPABASE_URL: 'http://127.0.0.1', SUPABASE_SERVICE_ROLE_KEY: 'test-key', ADMIN_RUN_KEY: 'test-admin-run-key', DOCRAPTOR_API_KEY: 'test-key', QA_REVIEW_ENABLED: 'false' });
const { default: handler } = await import('../api/generate-client-report.js');
const underwriting = buildPhase8CertificationRequests().underwriting;
const p = underwriting.body.__test_payloads;
function parsed(filename, parser) {
  const book = XLSX.readFile(path.join('tests/investoriq_validation_fixtures_UPLOADABLE/Final Attack Test 8', filename));
  return parser(book.SheetNames.map((n) => ({ rows: XLSX.utils.sheet_to_json(book.Sheets[n], { header: 1, defval: null }) })));
}
p.t12Payload = { ...p.t12Payload, ...parsed(p.t12Payload.original_filename, parseT12FromRowMatrices) };
p.rentRollPayload = { ...p.rentRollPayload, ...parsed(p.rentRollPayload.original_filename, parseRentRollFromRowMatrices) };
const rr = p.rentRollPayload;
const totals = resolveCanonicalRentRollAnnualTotals({ rentRollPayload: rr });
p.computedRentRoll = { ...rr, total_in_place_annual: totals.in_place.value, total_market_annual: totals.market.value,
  avg_in_place_rent: totals.in_place.value / 12 / rr.total_units, avg_market_rent: totals.market.value / 12 / rr.total_units };
p.coverageArtifacts = p.coverageArtifacts.map((a) => a.type === 't12_parsed' ? { ...a, payload: p.t12Payload } : a.type === 'rent_roll_parsed' ? { ...a, payload: rr } : a);
const screening = structuredClone(underwriting);
screening.body.report_type = 'screening';
screening.body.userId = 'same-property-screening';
delete screening.body.__test_acq_memo_v2_render_context;
const sp = screening.body.__test_payloads;
for (const key of ['acquisitionTermsPayload', 'loanTermSheetTermsPayload', 'mortgagePayload']) delete sp[key];
sp.documentSources = sp.documentSources.filter((f) => ['t12', 'rent_roll'].includes(f.doc_type));
const coreFiles = new Set(sp.documentSources.map((f) => f.id));
sp.coverageArtifacts = sp.coverageArtifacts.filter((a) => coreFiles.has(a.file_id));
const results = await renderPhase8CertificationArtifacts(handler, { screening, underwriting });
const output = path.resolve(process.env.PUBLICATION_REVIEW_DIR || 'tmp/publication-same-property-review');
fs.mkdirSync(output, { recursive: true });
for (const [lane, result] of Object.entries(results)) {
  for (const fact of ['Stonebridge Lofts', '$945,000', '$1,432,800', '$1,718,400', '$285,600', '$20,000']) assert.ok(result.html.includes(fact), `${lane}: missing shared fact ${fact}`);
  assert.ok(result.html.includes('id="investoriq-publication-parity"'));
  fs.writeFileSync(path.join(output, `stonebridge-${lane}.html`), result.html);
}
const style = (html) => html.match(/<style id="investoriq-publication-parity">([\s\S]*?)<\/style>/)[1];
assert.equal(style(results.screening.html), style(results.underwriting.html));
console.log('same-property review: PASS (same actual XLSX parsers, shared displayed core facts and identical final presentation CSS)');
