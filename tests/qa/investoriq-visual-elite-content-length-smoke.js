import assert from "node:assert/strict";
import { applyPhase8BCrossProductPublicationAuthority } from "../../api/_lib/phase8b-cross-product-publication-authority.js";

function fixture(rowCount) {
  const rows = Array.from({ length: rowCount }, (_, index) =>
    `<tr data-iq-long-row="${index + 1}"><td>Expense line ${index + 1}</td><td>$${(1000 + index).toLocaleString("en-US")}</td></tr>`
  ).join("");
  return `<!doctype html><html><head><title>Length fixture</title></head><body><div class="report-container"><section class="section"><div class="section-header"><span class="section-header-title">Long Content Fixture</span></div><div class="card allow-break"><table class="detail-table"><thead><tr><th>Line</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table></div></section></div></body></html>`;
}

for (const rowCount of [2, 24, 120]) {
  const output = applyPhase8BCrossProductPublicationAuthority(fixture(rowCount), { lane: "underwriting" });
  const survivingRows = [...output.matchAll(/data-iq-long-row=/g)].length;
  assert.equal(survivingRows, rowCount, `publication authority truncated ${rowCount}-row fixture`);
  assert.ok(output.includes("investoriq-phase8b-cross-product-publication-authority"));
  assert.ok(output.includes("table-header-group"));
}

console.log("InvestorIQ Visual ELITE short/rich/long content smoke: PASS");
