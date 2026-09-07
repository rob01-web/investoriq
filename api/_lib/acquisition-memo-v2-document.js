import { renderCompleteAcquisitionMemoV2Html as renderBaseCompleteAcquisitionMemoV2Html } from "./acquisition-memo-v2-document-base.js";

export * from "./acquisition-memo-v2-document-base.js";

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/\s*[\u2014\u2013]\s*/g, " - ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unitCategory(row = {}) {
  return text(
    row.unit_type ?? row.unitType ?? row.label ?? row.unit_label ?? row.unitLabel ??
      row.type ?? row.bedroom_type ?? row.bedroomType ?? row.bedrooms ?? row.beds
  ).toLowerCase();
}

function preciseRentRollFacts(sourceTruthPackage = null) {
  const facts = sourceTruthPackage?.core?.rent_roll?.accepted_facts;
  if (!facts || typeof facts !== "object") return null;
  const unitMix = Array.isArray(facts.unit_mix) ? facts.unit_mix : [];
  const units = Array.isArray(facts.units) ? facts.units : [];
  if (!unitMix.length) return clone(facts);

  const preciseMix = unitMix.map((row) => {
    if (!row || typeof row !== "object") return row;
    const category = unitCategory(row);
    const count = finite(row.count ?? row.unit_count ?? row.units ?? row.quantity);
    if (!category || count === null || count <= 0 || units.length === 0) return clone(row);

    const categoryUnits = units.filter((unit) => unitCategory(unit) === category);
    if (categoryUnits.length !== count) return clone(row);

    const currentValues = categoryUnits.map((unit) => finite(unit.in_place_rent ?? unit.current_rent ?? unit.rent));
    const marketValues = categoryUnits.map((unit) => finite(unit.market_rent ?? unit.marketRent));
    const next = clone(row);

    if (currentValues.length === count && currentValues.every((value) => value !== null)) {
      next.current_rent = currentValues.reduce((sum, value) => sum + value, 0) / count;
      next.current_rent_count = count;
    }
    if (marketValues.length === count && marketValues.every((value) => value !== null)) {
      next.market_rent = marketValues.reduce((sum, value) => sum + value, 0) / count;
      next.market_rent_count = count;
    }
    return next;
  });

  return { ...clone(facts), unit_mix: preciseMix };
}

function withPrecisionAuthoritativeUnitMix(args = {}) {
  const preciseFacts = preciseRentRollFacts(args.sourceTruthPackage);
  if (!preciseFacts) return { ...args };
  const customerSurfaceModel = clone(args.customerSurfaceModel || {});
  customerSurfaceModel.sourceBackedFacts = {
    ...(customerSurfaceModel.sourceBackedFacts || {}),
    unitMix: preciseFacts,
  };
  return { ...args, customerSurfaceModel };
}

function firstText(object, keys = []) {
  for (const key of keys) {
    const value = text(object?.[key]);
    if (value) return value;
  }
  return "";
}

function sourcePeriod(facts = {}, role = "") {
  const start = firstText(facts, ["period_start", "periodStart", "start_date", "startDate"]);
  const end = firstText(facts, ["period_end", "periodEnd", "end_date", "endDate"]);
  if (start && end) return `${start} to ${end}`;
  if (role === "t12") {
    return firstText(facts, [
      "reporting_period",
      "reportingPeriod",
      "period_label",
      "periodLabel",
      "period",
      "trailing_period",
      "trailingPeriod",
      "as_of_date",
      "asOfDate",
      "period_end",
      "periodEnd",
    ]);
  }
  return firstText(facts, [
    "as_of_date",
    "asOfDate",
    "rent_roll_date",
    "rentRollDate",
    "effective_date",
    "effectiveDate",
    "reporting_date",
    "reportingDate",
    "period_end",
    "periodEnd",
  ]);
}

function sourceCurrency(facts = {}) {
  return firstText(facts, ["currency", "currency_code", "currencyCode", "reporting_currency", "reportingCurrency"]);
}

function sourceProvenanceHtml(sourceTruthPackage = null) {
  const rows = [];
  for (const [role, label] of [["t12", "Trailing 12-Month Operating Statement"], ["rent_roll", "Rent Roll"]]) {
    const entry = sourceTruthPackage?.core?.[role] || null;
    if (!entry?.accepted_facts) continue;
    const period = sourcePeriod(entry.accepted_facts, role) || "Not stated in accepted source facts";
    const currency = sourceCurrency(entry.accepted_facts) || "Not stated in accepted source facts";
    rows.push(`<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(period)}</td><td>${escapeHtml(currency)}</td></tr>`);
  }
  if (!rows.length) return "";
  return `<section class="section" data-iq-section="source-period-currency-provenance">
    <div class="section-header"><span class="section-header-title">Source Period &amp; Currency</span></div>
    <div class="card allow-break">
      <table class="detail-table"><thead><tr><th>Accepted Core Source</th><th>Period / As Of</th><th>Currency</th></tr></thead><tbody>${rows.join("")}</tbody></table>
      <p class="footer-note">Period and currency are shown only when explicitly established in accepted source facts. InvestorIQ does not infer a reporting date or currency from formatting, symbols, filenames, or geography.</p>
    </div>
  </section>`;
}

function injectSourceProvenance(html, sourceTruthPackage) {
  const provenance = sourceProvenanceHtml(sourceTruthPackage);
  if (!provenance || !html) return html;
  const marker = '<div class="chapter-heading">Source Appendix</div>';
  if (html.includes(marker)) return html.replace(marker, `${marker}\n      ${provenance}`);
  return html.replace(/<\/body>/i, `${provenance}\n</body>`);
}

function polishDirectCustomerBoundaryLanguage(html = "") {
  return String(html || "")
    .replace(/\bnot ROI,\s*IRR,\s*or a value-creation forecast\b/gi, "not a return metric or a value-creation forecast");
}

export function renderCompleteAcquisitionMemoV2Html(args = {}) {
  const enriched = withPrecisionAuthoritativeUnitMix(args);
  const html = renderBaseCompleteAcquisitionMemoV2Html(enriched);
  const withProvenance = injectSourceProvenance(html, args.sourceTruthPackage);
  return polishDirectCustomerBoundaryLanguage(withProvenance);
}
