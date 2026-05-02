import { parseT12FromExtractedTables } from "../../api/parse/parse-doc.js";

function numberFrom(value) {
  const parsed = Number(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function extractDollarNear(text, labels, min = 500) {
  const lower = text.toLowerCase();
  for (const label of labels) {
    const idx = lower.indexOf(label);
    if (idx === -1) continue;
    const snippet = text.slice(idx, idx + 120);
    const match = snippet.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/);
    const value = match ? numberFrom(match[1]) : null;
    if (Number.isFinite(value) && value > min) return value;
  }
  return null;
}

function extractPercentNear(text, labels) {
  const lower = text.toLowerCase();
  for (const label of labels) {
    const idx = lower.indexOf(label);
    if (idx === -1) continue;
    const snippet = text.slice(idx, idx + 80);
    const match = snippet.match(/([\d]+(?:\.\d{1,4})?)\s*%/);
    const value = match ? Number(match[1]) : null;
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function parseLoanTermContract(text, docType) {
  if (docType !== "loan_term_sheet") return { accepted: false };
  const loanAmount = extractDollarNear(text, [
    "loan amount",
    "mortgage amount",
    "principal amount",
    "total loan",
    "facility amount",
    "outstanding loan balance",
    "outstanding balance",
    "current loan balance",
    "current mortgage balance",
  ], 10000);
  const beforeLabel = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:interest\s*rate|note\s*rate|coupon\s*rate)\b/i);
  const afterLabel = text.match(/\b(?:interest\s*rate|note\s*rate|coupon\s*rate)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%/i);
  const genericDebtRate = text.match(/\b(?:fixed\s+rate|loan\s+rate|rate)\s*[:\-]\s*(\d+(?:\.\d+)?)\s*%\s*(?:fixed|floating|variable)?(?=\s|$|[.;,)])/i);
  const interestRate = beforeLabel
    ? Number(beforeLabel[1])
    : afterLabel
    ? Number(afterLabel[1])
    : genericDebtRate
    ? Number(genericDebtRate[1])
    : null;
  const ltv = (() => {
    const parseCandidate = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 && parsed <= 100 ? parsed : null;
    };
    const lines = text.split(/\r?\n/).filter((line) =>
      /\b(?:loan\s*to\s*value|loan-to-value|ltv)\b/i.test(line)
    );
    for (const line of lines) {
      const afterLabel = line.match(/\b(?:loan\s*to\s*value|loan-to-value|ltv)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:%|percent)(?=\s|$|[.;,)])/i);
      const afterValue = parseCandidate(afterLabel?.[1]);
      if (afterValue !== null) return afterValue;

      const beforeLabel = line.match(/\b(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:loan\s*to\s*value|loan-to-value|ltv)\b/i);
      const beforeValue = parseCandidate(beforeLabel?.[1]);
      if (beforeValue !== null) return beforeValue;
    }
    return null;
  })();
  const amortMatch =
    text.match(/\bAM\s*[:\-]?\s*(\d+)\s*(?:years?|yrs?|yr)\b/i) ||
    text.match(/\b(?:amortization|amortization period|amort period)\s*[:\-]?\s*(\d+)\s*(?:years?|yrs?|yr)?\b/i) ||
    text.match(/\b(\d+)\s*-?\s*(?:years?|yrs?|yr)\s+amort(?:ization)?\b/i);
  const refiCap = extractPercentNear(text, ["exit cap", "refi cap", "cap rate", "exit cap rate", "refi cap rate"]);
  return {
    accepted: true,
    loan_amount: loanAmount,
    interest_rate: interestRate,
    ltv,
    amort_years: amortMatch ? Number(amortMatch[1]) : null,
    refi_cap_rate: refiCap,
  };
}

function parsePropertyTaxContract(text, docType) {
  if (docType !== "property_tax") return { accepted: false };
  const candidate = extractDollarNear(text, ["annual property tax", "total property tax", "total taxes", "tax amount due", "amount due", "municipal taxes"], 0);
  const annualTax = Number.isFinite(candidate) && candidate > 5000 && !(candidate >= 1900 && candidate <= 2100) ? candidate : null;
  return { accepted: true, annual_tax: annualTax };
}

function parseRentRollContract(text, docType) {
  if (docType !== "rent_roll") return { accepted: false };
  const unitRows = (text.match(/\bunit\s+\w+/gi) || []).length;
  const summaryUnits = text.match(/\btotal\s+units\s*[:\-]?\s*(\d+)/i);
  const monthlyInPlace = text.match(/\bmonthly\s+in-place\s+rent\s+total\s*[:\-]?\s*\$?\s*([\d,]+)/i);
  const monthlyMarket = text.match(/\bmonthly\s+market\s+rent\s+total\s*[:\-]?\s*\$?\s*([\d,]+)/i);
  const summaryRowDetected = Boolean(summaryUnits && monthlyInPlace && monthlyMarket);
  return {
    accepted: summaryRowDetected,
    is_partial_sample: unitRows > 0 && unitRows < Number(summaryUnits?.[1] || Infinity),
    summary_row_detected: summaryRowDetected,
    total_units: summaryUnits ? Number(summaryUnits[1]) : null,
    monthly_in_place_total: summaryRowDetected ? numberFrom(monthlyInPlace[1]) : null,
    monthly_market_total: summaryRowDetected ? numberFrom(monthlyMarket[1]) : null,
    annual_in_place_rent: summaryRowDetected ? numberFrom(monthlyInPlace[1]) * 12 : null,
    annual_market_rent: summaryRowDetected ? numberFrom(monthlyMarket[1]) * 12 : null,
    detail_rows_used_as_full_distribution: false,
  };
}

function parseCapexContract(docType) {
  if (docType !== "supporting_documents_unclassified") return { accepted: false };
  return { accepted: false };
}

function validateT12Result(payload, expected) {
  const values = [
    payload.effective_gross_income,
    payload.total_operating_expenses,
    payload.net_operating_income,
  ].filter(Number.isFinite);
  const noAbsurdValues = values.every((value) => value < expected.absurd_value_max);
  if (values.length < 3) return { accepted: false, noAbsurdValues, coreEquationOk: false };
  const coreEquationOk = Math.abs(payload.effective_gross_income - payload.total_operating_expenses - payload.net_operating_income) <= 2;
  return { accepted: coreEquationOk && noAbsurdValues, noAbsurdValues, coreEquationOk };
}

export function evaluateParserScenario(scenario) {
  if (scenario.doc_type === "loan_term_sheet") return parseLoanTermContract(scenario.text || "", scenario.doc_type);
  if (scenario.doc_type === "property_tax") return parsePropertyTaxContract(scenario.text || "", scenario.doc_type);
  if (scenario.doc_type === "rent_roll") return parseRentRollContract(scenario.text || "", scenario.doc_type);
  if (scenario.doc_type === "supporting_documents_unclassified") return parseCapexContract(scenario.doc_type);
  if (scenario.doc_type === "t12") {
    try {
      const payload = parseT12FromExtractedTables(scenario.tables || []);
      return { ...validateT12Result(payload, scenario.expected || {}), payload };
    } catch (err) {
      return { accepted: false, fail_closed: true, error: err.message };
    }
  }
  return { accepted: false };
}
