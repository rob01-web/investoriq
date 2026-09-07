import { validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel as validateBaseAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel } from "./acquisition-memo-v2-customer-surface-model-base.js";

export * from "./acquisition-memo-v2-customer-surface-model-base.js";

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function visibleText(html = "") {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function unitLabel(row = {}) {
  return String(
    row?.label ?? row?.unit_type ?? row?.unitType ?? row?.unit_label ?? row?.unitLabel ?? row?.name ?? ""
  ).replace(/\s+/g, " ").trim();
}

function unitCurrentRent(row = {}) {
  return finite(
    row?.current_rent ?? row?.currentRent ?? row?.in_place_rent ?? row?.inPlaceRent ?? row?.inplace_rent ?? row?.rent
  );
}

function unitMarketRent(row = {}) {
  return finite(row?.market_rent ?? row?.marketRent ?? row?.market_rent_monthly ?? row?.marketRentMonthly ?? row?.market);
}

function moneyValues(text = "") {
  const values = [];
  const pattern = /\$\s*([0-9][0-9,]*(?:\.\d{1,2})?)/g;
  let match;
  while ((match = pattern.exec(String(text || ""))) !== null) {
    const value = Number(String(match[1]).replace(/,/g, ""));
    if (Number.isFinite(value)) values.push(value);
  }
  return values;
}

function rowHasPrecisionCompatibleSpread(htmlText, row = {}) {
  const label = unitLabel(row);
  const currentRent = unitCurrentRent(row);
  const marketRent = unitMarketRent(row);
  if (!label || !Number.isFinite(currentRent) || !Number.isFinite(marketRent)) return false;

  const normalized = String(htmlText || "");
  const index = normalized.toLowerCase().indexOf(label.toLowerCase());
  if (index < 0) return false;
  const segment = normalized.slice(index, index + 360);
  const expectedSpread = marketRent - currentRent;
  return moneyValues(segment).some((value) => Math.abs(value - expectedSpread) <= 0.51);
}

function allUnitMixSpreadsRemainRepresented(html = "", model = null) {
  const rows = Array.isArray(model?.sections?.unitMix?.facts?.unit_mix)
    ? model.sections.unitMix.facts.unit_mix
    : [];
  if (!rows.length) return false;
  const text = visibleText(html);
  const comparableRows = rows.filter((row) => Number.isFinite(unitCurrentRent(row)) && Number.isFinite(unitMarketRent(row)));
  return comparableRows.length > 0 && comparableRows.every((row) => rowHasPrecisionCompatibleSpread(text, row));
}

export function validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, model) {
  const base = validateBaseAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, model);
  const issues = Array.isArray(base?.issues) ? base.issues : [];
  if (!issues.some((entry) => entry?.code === "HTML_UNIT_MIX_SPREAD_MISSING")) return base;

  const precisionCompatible = allUnitMixSpreadsRemainRepresented(html, model);
  if (!precisionCompatible) return base;

  const retainedIssues = issues.filter((entry) => entry?.code !== "HTML_UNIT_MIX_SPREAD_MISSING");
  return {
    ...base,
    ok: retainedIssues.length === 0,
    issues: retainedIssues,
  };
}
