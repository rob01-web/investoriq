export const PHASE8_ARTIFACT_IDENTITY_FINGERPRINTS = Object.freeze({
  screening: Object.freeze({
    identity: "InvestorIQ Screening Report",
    brand: "INVESTORIQ",
    report_title: "Screening Report",
    property_name: "Harbourstone",
    total_units: 48,
    occupied_units: 46,
    vacant_units: 2,
    occupancy: 0.9583333333,
    gross_potential_rent: 1850000,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
    annual_in_place_rent: 1036800,
    annual_market_rent: 1137600,
    core_source_files: Object.freeze([
      "Full_Render_T12.xlsx",
      "Full_Render_Rent_Roll.xlsx",
    ]),
  }),
  underwriting: Object.freeze({
    identity: "InvestorIQ Underwriting Report",
    brand: "INVESTORIQ",
    report_title: "Underwriting Report",
    property_name: "Stonebridge Lofts",
    total_units: 64,
    occupied_units: 60,
    vacant_units: 4,
    occupancy: 0.9375,
    gross_potential_rent: 1612800,
    effective_gross_income: 1500000,
    total_operating_expenses: 555000,
    net_operating_income: 945000,
    annual_in_place_rent: 1432800,
    annual_market_rent: 1718400,
    core_source_files: Object.freeze([
      "T12_Stonebridge_Lofts_Attack_Test_8.xlsx",
      "Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx",
    ]),
    forbidden_contamination: Object.freeze([
      Object.freeze({ field: "net_operating_income", token: "$650,000" }),
      Object.freeze({ field: "annual_in_place_rent", token: "$1,036,800" }),
      Object.freeze({ field: "annual_market_rent", token: "$1,137,600" }),
      Object.freeze({ field: "t12_source", token: "Full_Render_T12.xlsx" }),
      Object.freeze({ field: "rent_roll_source", token: "Full_Render_Rent_Roll.xlsx" }),
    ]),
  }),
});

export function visibleArtifactText(html = "") {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .replace(/_\s+/g, "_")
    .trim();
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function moneyPattern(value) {
  const formatted = Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return new RegExp(`\\$${escapeRegex(formatted)}\\b`, "i");
}

function percentPatterns(value) {
  const raw = Number(value) * 100;
  const values = new Set([
    raw.toFixed(0),
    raw.toFixed(1),
    raw.toFixed(2),
  ]);
  return [...values].map((formatted) => new RegExp(`${escapeRegex(formatted)}%`, "i"));
}

function fail(report, field, detail) {
  throw new Error(`PHASE8_ARTIFACT_IDENTITY_MISMATCH:${report}:${field}:${detail}`);
}

function requirePattern(text, pattern, report, field, detail) {
  if (!pattern.test(text)) fail(report, field, detail);
}

function requireAnyPattern(text, patterns, report, field, detail) {
  if (!patterns.some((pattern) => pattern.test(text))) fail(report, field, detail);
}

function requireLabelValue(text, labels, valuePattern, report, field, detail, maxDistance = 180) {
  const labelPattern = labels.map(escapeRegex).join("|");
  const valueSource = valuePattern.source.replace(/^\^|\$$/g, "");
  const forwardValueSource = valueSource.replace(/^\\b/, "");
  const reverseValueSource = valueSource.replace(/\\b$/, "");
  const forward = new RegExp(`(?:${labelPattern})[\\s\\S]{0,${maxDistance}}${forwardValueSource}`, "i");
  const reverse = new RegExp(`${reverseValueSource}[\\s\\S]{0,${maxDistance}}(?:${labelPattern})`, "i");
  if (!forward.test(text) && !reverse.test(text)) fail(report, field, detail);
}

function validateCoreFingerprint({ text: inputText, report, fingerprint }) {
  const text = String(inputText || "").replace(/\s+/g, " ").trim();
  requirePattern(text, new RegExp(`\\b${escapeRegex(fingerprint.brand)}\\b`, "i"), report, "report_brand", fingerprint.brand);
  requirePattern(text, new RegExp(`\\b${escapeRegex(fingerprint.report_title)}\\b`, "i"), report, "report_title", fingerprint.report_title);
  requirePattern(text, new RegExp(`\\b${escapeRegex(fingerprint.property_name)}\\b`, "i"), report, "property_name", fingerprint.property_name);

  requireLabelValue(text, ["Units", "Total Units"], new RegExp(`\\b${fingerprint.total_units}\\b`), report, "total_units", String(fingerprint.total_units));
  if (report === "screening") {
    requireLabelValue(text, ["Occupied", "Occupied Units"], new RegExp(`\\b${fingerprint.occupied_units}\\b`), report, "occupied_units", String(fingerprint.occupied_units));
  }
  requireAnyPattern(text, percentPatterns(fingerprint.occupancy), report, "occupancy", String(fingerprint.occupancy));

  requireLabelValue(text, ["Gross Potential Rent", "T12 Gross Potential Rent", "Gross Scheduled Rent"], moneyPattern(fingerprint.gross_potential_rent), report, "gross_potential_rent", String(fingerprint.gross_potential_rent));
  requireLabelValue(text, ["Effective Gross Income", "EGI"], moneyPattern(fingerprint.effective_gross_income), report, "effective_gross_income", String(fingerprint.effective_gross_income));
  requireLabelValue(text, ["Operating Expenses", "Total Operating Expenses", "OpEx"], moneyPattern(fingerprint.total_operating_expenses), report, "total_operating_expenses", String(fingerprint.total_operating_expenses));
  requireLabelValue(text, ["Net Operating Income", "NOI"], moneyPattern(fingerprint.net_operating_income), report, "net_operating_income", String(fingerprint.net_operating_income));
  requireLabelValue(text, ["Annual In-Place Rent", "Rent Roll Annual In-Place Rent"], moneyPattern(fingerprint.annual_in_place_rent), report, "annual_in_place_rent", String(fingerprint.annual_in_place_rent));
  requireLabelValue(text, ["Annual Market Rent", "Rent Roll Annual Market Rent"], moneyPattern(fingerprint.annual_market_rent), report, "annual_market_rent", String(fingerprint.annual_market_rent));

  for (const filename of fingerprint.core_source_files) {
    requirePattern(text, new RegExp(escapeRegex(filename), "i"), report, "core_source_file", filename);
  }

  return {
    report,
    property_name: fingerprint.property_name,
    core_facts_verified: true,
    core_source_files_verified: [...fingerprint.core_source_files],
  };
}

export function assertPhase8ArtifactIdentity({ report, html }) {
  const fingerprint = PHASE8_ARTIFACT_IDENTITY_FINGERPRINTS[report];
  if (!fingerprint) throw new Error(`PHASE8_ARTIFACT_IDENTITY_UNKNOWN_REPORT:${report}`);
  if (!/<!DOCTYPE html>/i.test(String(html || ""))) fail(report, "document", "complete_html_required");

  const text = visibleArtifactText(html);
  requirePattern(text, new RegExp(escapeRegex(fingerprint.identity), "i"), report, "report_identity", fingerprint.identity);
  return assertPhase8ArtifactTextIdentity({ report, text });
}

export function assertPhase8ArtifactTextIdentity({ report, text }) {
  const fingerprint = PHASE8_ARTIFACT_IDENTITY_FINGERPRINTS[report];
  if (!fingerprint) throw new Error(`PHASE8_ARTIFACT_IDENTITY_UNKNOWN_REPORT:${report}`);
  const normalizedText = String(text || "")
    .replace(/_\s+/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalizedText) fail(report, "document", "visible_text_required");

  const result = validateCoreFingerprint({ text: normalizedText, report, fingerprint });
  for (const forbidden of fingerprint.forbidden_contamination || []) {
    if (normalizedText.includes(forbidden.token)) {
      fail(report, `forbidden_${forbidden.field}`, forbidden.token);
    }
  }
  return result;
}

function requireExactNumber(actual, expected, report, field) {
  if (!Number.isFinite(Number(actual)) || Number(actual) !== Number(expected)) {
    fail(report, `source_binding_${field}`, `${actual ?? "missing"}!=${expected}`);
  }
}

export function assertPhase8SourceBindingIdentity({ report, request }) {
  const fingerprint = PHASE8_ARTIFACT_IDENTITY_FINGERPRINTS[report];
  if (!fingerprint) throw new Error(`PHASE8_ARTIFACT_IDENTITY_UNKNOWN_REPORT:${report}`);
  const body = request?.body || {};
  const payloads = body.__test_payloads || {};
  const t12 = payloads.t12Payload || {};
  const rentRoll = payloads.rentRollPayload || {};

  if (String(body.property_name || "") !== fingerprint.property_name) {
    fail(report, "source_binding_property_name", `${body.property_name || "missing"}!=${fingerprint.property_name}`);
  }
  requireExactNumber(t12.gross_potential_rent, fingerprint.gross_potential_rent, report, "gross_potential_rent");
  requireExactNumber(t12.effective_gross_income, fingerprint.effective_gross_income, report, "effective_gross_income");
  requireExactNumber(t12.total_operating_expenses, fingerprint.total_operating_expenses, report, "total_operating_expenses");
  requireExactNumber(t12.net_operating_income, fingerprint.net_operating_income, report, "net_operating_income");
  requireExactNumber(rentRoll.total_units, fingerprint.total_units, report, "total_units");
  requireExactNumber(rentRoll.occupied_units, fingerprint.occupied_units, report, "occupied_units");
  requireExactNumber(rentRoll.vacant_units, fingerprint.vacant_units, report, "vacant_units");
  requireExactNumber(rentRoll.occupancy, fingerprint.occupancy, report, "occupancy");
  requireExactNumber(rentRoll.annual_in_place_rent ?? rentRoll.total_in_place_annual, fingerprint.annual_in_place_rent, report, "annual_in_place_rent");
  requireExactNumber(rentRoll.annual_market_rent ?? rentRoll.total_market_annual, fingerprint.annual_market_rent, report, "annual_market_rent");

  const filenames = new Set(
    (Array.isArray(payloads.documentSources) ? payloads.documentSources : [])
      .map((source) => String(source?.original_filename || source?.originalFilename || ""))
      .filter(Boolean)
  );
  for (const filename of fingerprint.core_source_files) {
    if (!filenames.has(filename)) fail(report, "source_binding_core_source_file", filename);
  }

  return {
    report,
    property_name: fingerprint.property_name,
    all_core_facts_verified: true,
    occupied_units: fingerprint.occupied_units,
    vacant_units: fingerprint.vacant_units,
    core_source_files_verified: [...fingerprint.core_source_files],
  };
}
