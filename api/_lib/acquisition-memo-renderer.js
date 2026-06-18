/**
 * Dumb renderer. Consumes the projection only.
 * Must not make any document-role or authority decisions.
 * Must not have fallback classification logic.
 */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '<table><tbody><tr><td colspan="4">No support documents provided.</td></tr></tbody></table>';
  }

  const renderFacts = (row) => {
    const facts = row?.extractedFacts && typeof row.extractedFacts === "object" ? row.extractedFacts : {};
    const role = String(row?.canonicalRole || row?.role || "").trim();
    const isCurrentDebt = role === "current_debt_context";
    const isPurchaseAssumptions = role === "purchase_assumptions";
    const isRenovation = role === "structured_renovation_capex_plan";
    const sourceText = `${row?.sourceEvidence?.textSnippet || ""} ${row?.sourceEvidence?.filename || ""}`;
    const findMoney = (patterns) => {
      for (const pattern of patterns) {
        const match = String(sourceText || "").match(pattern);
        if (!match) continue;
        const raw = String(match[1] ?? match[0]).replace(/[$,]/g, "").trim();
        const value = Number(raw);
        if (Number.isFinite(value)) return value;
      }
      return null;
    };
    const findPercentFraction = (patterns) => {
      const value = findMoney(patterns);
      return Number.isFinite(value) ? value / 100 : null;
    };
    const parts = [];
    const purchasePrice = Number.isFinite(facts.purchase_price) ? Number(facts.purchase_price) : findMoney([/\bpurchase price[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bproposed acquisition price[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i]);
    const noiBasis = Number.isFinite(facts.noi_basis) ? Number(facts.noi_basis) : findMoney([/\bnoi basis[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bnoi[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i]);
    const goingInCapRate = Number.isFinite(facts.going_in_cap_rate) ? Number(facts.going_in_cap_rate) : findPercentFraction([/\bgoing[-\s]*in cap(?: rate| reference)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i, /\bcap rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i]);
    const proposedLoanAmount = Number.isFinite(facts.proposed_loan_amount)
      ? Number(facts.proposed_loan_amount)
      : findMoney([/\bproposed loan amount[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bproposed acquisition loan[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bloan amount[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bloan[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i]);
    const ltv = Number.isFinite(facts.ltv) ? Number(facts.ltv) : findPercentFraction([/\bltv[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i, /\bloanto[-\s]*value[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i]);
    const interestRate = Number.isFinite(facts.interest_rate) ? Number(facts.interest_rate) : findPercentFraction([/\binterest rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i, /\brate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i]);
    const amortizationYears = Number.isFinite(facts.amortization_years) ? Number(facts.amortization_years) : null;
    const lenderFeePercent = Number.isFinite(facts.lender_fee_percent)
      ? Number(facts.lender_fee_percent)
      : findPercentFraction([/\blender fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i, /\bfinancing fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i, /\borigination fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i, /\bfee[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i]);
    const outstandingBalance = Number.isFinite(facts.current_outstanding_balance)
      ? Number(facts.current_outstanding_balance)
      : findMoney([/\bcurrent outstanding balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bcurrent debt balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\boutstanding balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bprincipal balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bbalance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i]);
    const amortRemaining = Number.isFinite(facts.amortization_remaining_years) ? Number(facts.amortization_remaining_years) : null;
    const monthlyPayment = Number.isFinite(facts.monthly_payment)
      ? Number(facts.monthly_payment)
      : findMoney([/\bmonthly payment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bmonthly debt service[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bpayment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i]);
    const maturityDate = facts.maturity_date || (String(sourceText).match(/\bmaturity date[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i)?.[1] || String(sourceText).match(/\bmatures?[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i)?.[1] || null);
    const totalRenovationBudget = Number.isFinite(facts.total_renovation_budget)
      ? Number(facts.total_renovation_budget)
      : findMoney([/\btotal renovation budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\breno budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\brenovation budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bcapex budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i, /\bbudget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i]);
    if (Number.isFinite(purchasePrice)) parts.push(`Purchase Price: $${Number(purchasePrice).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (Number.isFinite(noiBasis)) parts.push(`NOI Basis: $${Number(noiBasis).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (Number.isFinite(goingInCapRate)) parts.push(`Going-In Cap Rate: ${(Number(goingInCapRate) * 100).toFixed(1)}%`);
    if (Number.isFinite(proposedLoanAmount)) parts.push(`${isPurchaseAssumptions ? "Proposed Acquisition Loan" : "Proposed Loan Amount"}: $${Number(proposedLoanAmount).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (Number.isFinite(ltv)) parts.push(`LTV: ${(Number(ltv) * 100).toFixed(1)}%`);
    if (Number.isFinite(outstandingBalance)) parts.push(`Current Debt Balance: $${Number(outstandingBalance).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (Number.isFinite(interestRate)) parts.push(`${isCurrentDebt ? "Current Debt Rate" : isPurchaseAssumptions ? "Proposed Rate" : "Interest Rate"}: ${(Number(interestRate) * 100).toFixed(2)}%`);
    if (Number.isFinite(amortRemaining)) parts.push(`Current Debt Amortization Remaining: ${Number(amortRemaining).toFixed(0)} years`);
    if (Number.isFinite(monthlyPayment)) parts.push(`Current Debt Monthly Payment: $${Number(monthlyPayment).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (maturityDate) parts.push(`Current Debt Maturity: ${maturityDate}`);
    if (Number.isFinite(amortizationYears)) parts.push(`${isPurchaseAssumptions ? "Proposed Amortization" : "Amortization"}: ${Number(amortizationYears).toFixed(0)} years`);
    if (Number.isFinite(lenderFeePercent)) parts.push(`${isPurchaseAssumptions ? "Lender / Origination Fee" : "Lender Fee"}: ${(Number(lenderFeePercent) * 100).toFixed(2)}%`);
    if (Number.isFinite(totalRenovationBudget)) parts.push(`${isRenovation ? "Reno Budget" : "Total Renovation Budget"}: $${Number(totalRenovationBudget).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    if (facts.has_rent_lift) parts.push("Rent Lift: Yes");
    if (facts.has_phasing) parts.push("Phasing: Yes");
    if (Number.isFinite(facts.appraisal_value)) parts.push(`Appraisal Value: $${Number(facts.appraisal_value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
    return parts.length > 0 ? `<div style="margin-top:4px;color:#374151;font-size:11px;line-height:1.45;">${parts.map((part) => `<div>${escapeHtml(part)}</div>`).join("")}</div>` : "";
  };

  const body = rows
    .map((row) => {
      const filename = escapeHtml(row?.originalFilename || "");
      const label = escapeHtml(row?.roleLabel || "");
      const treatment = escapeHtml(row?.treatment || "");
      const use = escapeHtml(row?.use || "");
      const factsHtml = renderFacts(row);
      return `<tr><td>${filename}</td><td>${label}</td><td>${treatment}</td><td>${use}${factsHtml}</td></tr>`;
    })
    .join("");

  return `<table><thead><tr><th>Filename</th><th>Document Role</th><th>Treatment</th><th>Use</th></tr></thead><tbody>${body}</tbody></table>`;
}

function renderCoreSourceSummary(coreSourceSummary) {
  const t12 = coreSourceSummary?.t12;
  const rentRoll = coreSourceSummary?.rentRoll;
  const t12Line = t12
    ? `T12 confirmed as core quantitative source: ${escapeHtml(t12.originalFilename || "")}`
    : "No T12 provided — income/expense modeling requires T12 upload.";
  const rentRollLine = rentRoll
    ? `Rent Roll confirmed as core quantitative source: ${escapeHtml(rentRoll.originalFilename || "")}`
    : "No Rent Roll provided — occupancy and rent modeling requires Rent Roll upload.";
  return `<div><p>${t12Line}</p><p>${rentRollLine}</p></div>`;
}

function renderFinancingReadinessSummary(signals) {
  const lines = [
    signals?.hasPurchaseAssumptions
      ? "Purchase assumptions received."
      : "No purchase assumptions uploaded — proposed acquisition financing terms not available.",
    signals?.hasCurrentDebtContext
      ? "Existing debt context received."
      : "No existing debt context uploaded — current mortgage/debt terms not available.",
    signals?.hasStructuredRenovation
      ? "Structured renovation / CapEx plan received."
      : "No renovation plan uploaded.",
    signals?.hasAppraisalContext ? "Appraisal context received." : "No appraisal uploaded.",
    signals?.hasMarketSurveyContext ? "Market survey context received." : "No market survey uploaded.",
    signals?.hasEnvironmentalContext ? "Environmental / Phase I ESA context received." : "No Phase I ESA uploaded.",
  ];
  return `<div>${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>`;
}

export function renderAcquisitionMemo(acquisitionMemoProjection) {
  const documentTreatmentSummaryHtml = `<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->${renderTable(acquisitionMemoProjection?.documentTreatmentRows)}<!-- END DOCUMENT_TREATMENT_SUMMARY -->`;
  const coreSourceSummaryHtml = renderCoreSourceSummary(acquisitionMemoProjection?.coreSourceSummary);
  const financingReadinessSummaryHtml = renderFinancingReadinessSummary(acquisitionMemoProjection?.financingReadinessSignals);
  const sourceAuthorityDiagnosticHtml = `<!-- IQ_SOURCE_AUTHORITY: ${JSON.stringify({
    authorityVersion: acquisitionMemoProjection?.authorityVersion || "v2",
    competingDecisionMakersEliminated: Boolean(acquisitionMemoProjection?.sourceAuthorityDiagnostic?.competingDecisionMakersEliminated),
    classifiedBy: acquisitionMemoProjection?.sourceAuthorityDiagnostic?.classifiedBy || "buildCanonicalSourcePackage",
    projectedBy: acquisitionMemoProjection?.sourceAuthorityDiagnostic?.projectedBy || "buildAcquisitionMemoProjection",
    renderedBy: "renderAcquisitionMemo",
  })} -->`;

  return {
    documentTreatmentSummaryHtml,
    coreSourceSummaryHtml,
    financingReadinessSummaryHtml,
    sourceAuthorityDiagnosticHtml,
    authorityVersion: "v2",
  };
}
