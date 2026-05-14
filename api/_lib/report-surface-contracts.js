const HIDDEN_OUTPUT_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u200B\u200C\u200D\u2060\uFEFF\uFFFD\uFFFE\uFFFF]/g;

function latestArtifactPayload(artifacts, type) {
  return (Array.isArray(artifacts) ? artifacts : []).find((row) => row?.type === type)?.payload || null;
}

function coerceNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\u2060\ufeff\ufffe\uffff]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function displayLabelForDocType(value) {
  const normalized = normalizeText(value).replace(/[_/]+/g, " ");
  if (!normalized) return "";
  return normalized.replace(/\b([a-z])/g, (match) => match.toUpperCase()).replace(/\s+/g, " ").trim();
}

function positiveNumber(value) {
  const n = coerceNumber(value);
  return Number.isFinite(n) && n > 0;
}

function normalizeRateFraction(value) {
  const n = coerceNumber(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 1.5 ? n / 100 : n;
}

function mortgageConstant(rateFraction, amortYears) {
  const rate = coerceNumber(rateFraction);
  const years = coerceNumber(amortYears);
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(years) || years <= 0) return null;
  const monthlyRate = rate / 12;
  const months = Math.round(years * 12);
  if (months <= 0) return null;
  if (monthlyRate === 0) return 1 / months;
  const factor = Math.pow(1 + monthlyRate, months);
  const denominator = factor - 1;
  if (!Number.isFinite(factor) || denominator === 0) return null;
  return (monthlyRate * factor) / denominator;
}

function formatMultiple(value, decimals = 2) {
  const n = coerceNumber(value);
  if (!Number.isFinite(n)) return null;
  const fixed = Number.isFinite(decimals) ? Math.max(0, Math.min(6, Math.trunc(decimals))) : 2;
  return `${n.toFixed(fixed)}x`;
}

export function formatSourceReconciliationVariance(variancePct, decimals = 1) {
  const n = coerceNumber(variancePct);
  if (!Number.isFinite(n)) return null;
  const fixed = Number.isFinite(decimals) ? Math.max(0, Math.min(6, Math.trunc(decimals))) : 1;
  const magnitude = Math.abs(n * 100).toFixed(fixed);
  return `${n >= 0 ? "+" : "-"}${magnitude}%`;
}

export function buildSourceReconciliationRenderState({
  sourceReconciliationState = null,
  tolerancePct = 0.2,
} = {}) {
  const state = sourceReconciliationState && typeof sourceReconciliationState === "object"
    ? sourceReconciliationState
    : null;
  const variancePct = coerceNumber(state?.variance_pct);
  const rrAnnual = coerceNumber(state?.rr_annual_in_place);
  const t12Gpr = coerceNumber(state?.t12_gpr);
  const publishabilityBucket = normalizePublishabilityBucket(state?.publishability_bucket || state?.publishabilityBucket || null);
  const disclosure = String(state?.source_reconciliation_disclosure || "").trim() || null;
  const hasCanonicalValues = Number.isFinite(variancePct) && Number.isFinite(rrAnnual) && Number.isFinite(t12Gpr) && t12Gpr > 0;
  const canonicalVariancePct = hasCanonicalValues ? (rrAnnual - t12Gpr) / t12Gpr : null;
  const varianceMismatch =
    Number.isFinite(variancePct) &&
    Number.isFinite(canonicalVariancePct) &&
    Math.abs(variancePct - canonicalVariancePct) > Math.max(0.002, Number(tolerancePct) / 100);
  const renderable =
    publishabilityBucket === "disclose_only_publishable" &&
    hasCanonicalValues &&
    !varianceMismatch;
  return {
    renderable,
    publishability_bucket: publishabilityBucket,
    variance_pct: renderable ? variancePct : null,
    variance_display: renderable ? formatSourceReconciliationVariance(variancePct) : null,
    rr_annual_in_place: renderable ? rrAnnual : null,
    t12_gpr: renderable ? t12Gpr : null,
    source_reconciliation_disclosure: renderable ? disclosure : null,
    canonical_variance_pct: canonicalVariancePct,
    variance_mismatch: varianceMismatch,
    has_canonical_values: hasCanonicalValues,
    source_selection: state?.source_selection || null,
    rr_annual_in_place_source: state?.rr_annual_in_place_source || null,
    t12_gpr_source: state?.t12_gpr_source || null,
  };
}

function normalizePublishabilityBucket(value) {
  const normalized = normalizeText(value).replace(/[\s-]+/g, "_");
  const valid = new Set([
    "core_sufficient_publishable",
    "section_constrained_publishable",
    "disclose_only_publishable",
    "public_or_outreach_only_blocker",
    "user_needs_documents",
    "admin_review_required",
    "system_contract_failure",
  ]);
  return valid.has(normalized) ? normalized : "system_contract_failure";
}

function buildPublishabilityState({
  publishabilityBucket = "system_contract_failure",
  status = null,
  reasonCode = null,
  customerDeliveryImpact = "none",
  publicOutreachImpact = "none",
  requiredInputs = [],
  presentInputs = [],
  missingInputs = [],
  notes = [],
  evidence = {},
} = {}) {
  const bucket = normalizePublishabilityBucket(publishabilityBucket);
  return {
    publishability_bucket: bucket,
    core_sufficient_publishable: bucket === "core_sufficient_publishable",
    section_constrained_publishable: bucket === "section_constrained_publishable",
    disclose_only_publishable: bucket === "disclose_only_publishable",
    public_or_outreach_only_blocker: bucket === "public_or_outreach_only_blocker",
    user_needs_documents: bucket === "user_needs_documents",
    admin_review_required: bucket === "admin_review_required",
    system_contract_failure: bucket === "system_contract_failure",
    status,
    reason_code: reasonCode || null,
    customer_delivery_impact: customerDeliveryImpact,
    public_outreach_impact: publicOutreachImpact,
    required_inputs: Array.isArray(requiredInputs) ? requiredInputs : [],
    present_inputs: Array.isArray(presentInputs) ? presentInputs : [],
    missing_inputs: Array.isArray(missingInputs) ? missingInputs : [],
    notes: Array.isArray(notes) ? notes : [],
    evidence,
  };
}

export function buildT12SufficiencyState({
  t12Payload = null,
} = {}) {
  const effectiveGrossIncome = coerceNumber(t12Payload?.effective_gross_income ?? t12Payload?.gross_income);
  const totalOperatingExpenses = coerceNumber(t12Payload?.total_operating_expenses ?? t12Payload?.operating_expenses);
  const netOperatingIncome = coerceNumber(t12Payload?.net_operating_income ?? t12Payload?.noi);
  const grossPotentialRent = coerceNumber(t12Payload?.gross_potential_rent ?? t12Payload?.gross_scheduled_rent);
  const incomeLineCount = Array.isArray(t12Payload?.income_lines) ? t12Payload.income_lines.length : 0;
  const expenseLineCount = Array.isArray(t12Payload?.expense_lines) ? t12Payload.expense_lines.length : 0;
  const hasCoreTotals =
    Number.isFinite(effectiveGrossIncome) &&
    Number.isFinite(totalOperatingExpenses) &&
    Number.isFinite(netOperatingIncome);
  const equationDiff = hasCoreTotals ? effectiveGrossIncome - totalOperatingExpenses - netOperatingIncome : null;
  const reconciles = Number.isFinite(equationDiff)
    ? Math.abs(equationDiff) <= Math.max(1, Math.abs(netOperatingIncome || 0) * 0.01)
    : false;
  const hasUsefulDetail = incomeLineCount > 0 || expenseLineCount > 0;
  const missingInputs = [];
  if (!Number.isFinite(effectiveGrossIncome)) missingInputs.push("effective_gross_income");
  if (!Number.isFinite(totalOperatingExpenses)) missingInputs.push("total_operating_expenses");
  if (!Number.isFinite(netOperatingIncome)) missingInputs.push("net_operating_income");
  let publishabilityBucket = "user_needs_documents";
  let status = "insufficient_inputs";
  let reasonCode = "t12_core_structure_missing";
  let customerDeliveryImpact = "block";
  let publicOutreachImpact = "block_until_review";
  if (!hasCoreTotals) {
    publishabilityBucket = "user_needs_documents";
    reasonCode = "t12_core_structure_missing";
  } else if (hasCoreTotals && !reconciles) {
    publishabilityBucket = "admin_review_required";
    status = "contradiction";
    reasonCode = "t12_noi_equation_mismatch";
    customerDeliveryImpact = "block";
    publicOutreachImpact = "block_until_review";
  } else if (hasCoreTotals && !Number.isFinite(grossPotentialRent)) {
    publishabilityBucket = "section_constrained_publishable";
    status = "validated";
    reasonCode = "t12_gpr_missing";
    customerDeliveryImpact = "none";
    publicOutreachImpact = "block_until_review";
  } else if (hasCoreTotals && !hasUsefulDetail) {
    publishabilityBucket = "section_constrained_publishable";
    status = "validated";
    reasonCode = "t12_line_item_detail_missing";
    customerDeliveryImpact = "none";
    publicOutreachImpact = "block_until_review";
  } else {
    publishabilityBucket = "core_sufficient_publishable";
    status = "validated";
    reasonCode = null;
    customerDeliveryImpact = "none";
    publicOutreachImpact = "none";
  }
  return buildPublishabilityState({
    publishabilityBucket,
    status,
    reasonCode,
    customerDeliveryImpact,
    publicOutreachImpact,
    requiredInputs: ["effective_gross_income", "total_operating_expenses", "net_operating_income"],
    presentInputs: [
      Number.isFinite(effectiveGrossIncome) ? "effective_gross_income" : null,
      Number.isFinite(totalOperatingExpenses) ? "total_operating_expenses" : null,
      Number.isFinite(netOperatingIncome) ? "net_operating_income" : null,
      Number.isFinite(grossPotentialRent) ? "gross_potential_rent" : null,
    ].filter(Boolean),
    missingInputs,
    notes: [
      hasUsefulDetail ? "line_item_detail_present" : "line_item_detail_missing",
    ],
    evidence: {
      effective_gross_income: effectiveGrossIncome,
      total_operating_expenses: totalOperatingExpenses,
      net_operating_income: netOperatingIncome,
      gross_potential_rent: grossPotentialRent,
      equation_diff: equationDiff,
      reconciles,
      income_line_count: incomeLineCount,
      expense_line_count: expenseLineCount,
    },
  });
}

export function buildRentRollSufficiencyState({
  computedRentRoll = null,
  rentRollPayload = null,
} = {}) {
  const totalUnits = coerceNumber(
    computedRentRoll?.total_units ??
      rentRollPayload?.total_units ??
      rentRollPayload?.totals?.total_units
  );
  const annualRentCandidates = [
    computedRentRoll?.total_in_place_annual,
    computedRentRoll?.annual_in_place_rent,
    computedRentRoll?.total_annual_in_place,
    rentRollPayload?.total_in_place_annual,
    rentRollPayload?.totals?.in_place_rent_annual,
    rentRollPayload?.totals?.current_rent_annual,
  ];
  let annualInPlaceRent = annualRentCandidates.map(coerceNumber).find((value) => Number.isFinite(value) && value > 0) || null;
  if (!Number.isFinite(annualInPlaceRent)) {
    const monthlyCandidate = [
      rentRollPayload?.totals?.in_place_rent_monthly,
      rentRollPayload?.totals?.current_rent_monthly,
    ].map(coerceNumber).find((value) => Number.isFinite(value) && value > 0) || null;
    if (Number.isFinite(monthlyCandidate)) {
      annualInPlaceRent = monthlyCandidate * 12;
    }
  }
  const summaryOccupancy = coerceNumber(
    computedRentRoll?.occupancy ??
      rentRollPayload?.occupancy ??
      rentRollPayload?.totals?.occupancy ??
      rentRollPayload?.physical_occupancy
  );
  const summaryRowDetected = Boolean(rentRollPayload?.totals?.summary_row_detected);
  const unitRows = Array.isArray(rentRollPayload?.units)
    ? rentRollPayload.units
    : Array.isArray(computedRentRoll?.units)
    ? computedRentRoll.units
    : Array.isArray(rentRollPayload?.unit_mix)
    ? rentRollPayload.unit_mix
    : [];
  const hasUnitMix = Array.isArray(rentRollPayload?.unit_mix) && rentRollPayload.unit_mix.length > 0;
  const hasLeaseDates = unitRows.some((row) =>
    Boolean(row?.lease_start || row?.lease_end || row?.lease_start_date || row?.lease_end_date || row?.expiration_date)
  );
  const hasSquareFootage = unitRows.some((row) =>
    Number.isFinite(coerceNumber(row?.square_feet ?? row?.sqft ?? row?.area))
  );
  const hasMarketRent = Number.isFinite(
    coerceNumber(computedRentRoll?.total_market_annual ?? rentRollPayload?.totals?.market_rent_annual)
  ) || unitRows.some((row) => Number.isFinite(coerceNumber(row?.market_rent)));
  const occupancyFromRows = unitRows.length > 0
    ? unitRows.reduce((occupied, row) => {
        const statusText = normalizeText(row?.status ?? row?.lease_status ?? row?.unit_status ?? "");
        if (/\bvacan(?:t|cy)\b/.test(statusText)) return occupied;
        const rent = coerceNumber(row?.current_rent ?? row?.in_place_rent ?? row?.rent ?? row?.monthly_rent ?? row?.actual_rent);
        return Number.isFinite(rent) && rent > 0 ? occupied + 1 : occupied;
      }, 0) / unitRows.length
    : null;
  const derivedOccupancy = Number.isFinite(summaryOccupancy)
    ? summaryOccupancy
    : Number.isFinite(occupancyFromRows)
    ? occupancyFromRows
    : null;
  const hasCoreStructure =
    Number.isFinite(totalUnits) &&
    totalUnits > 0 &&
    Number.isFinite(annualInPlaceRent) &&
    annualInPlaceRent > 0 &&
    Number.isFinite(derivedOccupancy) &&
    derivedOccupancy >= 0 &&
    derivedOccupancy <= 1;
  const missingInputs = [];
  if (!Number.isFinite(totalUnits) || totalUnits <= 0) missingInputs.push("total_units");
  if (!Number.isFinite(annualInPlaceRent) || annualInPlaceRent <= 0) missingInputs.push("annual_in_place_rent");
  if (!Number.isFinite(derivedOccupancy) || derivedOccupancy < 0 || derivedOccupancy > 1) missingInputs.push("occupancy");
  const hasOptionalDetail = hasUnitMix || hasMarketRent || hasLeaseDates || hasSquareFootage || summaryRowDetected || unitRows.length > 0;
  let publishabilityBucket = "user_needs_documents";
  let status = "insufficient_inputs";
  let reasonCode = "rent_roll_core_structure_missing";
  let customerDeliveryImpact = "block";
  let publicOutreachImpact = "block_until_review";
  if (!hasCoreStructure) {
    publishabilityBucket = "user_needs_documents";
    reasonCode = "rent_roll_core_structure_missing";
  } else if (summaryRowDetected || !hasOptionalDetail) {
    publishabilityBucket = "section_constrained_publishable";
    status = "validated";
    reasonCode = summaryRowDetected ? "summary_only_rent_roll" : "rent_roll_detail_missing";
    customerDeliveryImpact = "none";
    publicOutreachImpact = "block_until_review";
  } else {
    publishabilityBucket = "core_sufficient_publishable";
    status = "validated";
    reasonCode = null;
    customerDeliveryImpact = "none";
    publicOutreachImpact = "none";
  }
  return buildPublishabilityState({
    publishabilityBucket,
    status,
    reasonCode,
    customerDeliveryImpact,
    publicOutreachImpact,
    requiredInputs: ["total_units", "annual_in_place_rent", "occupancy"],
    presentInputs: [
      Number.isFinite(totalUnits) && totalUnits > 0 ? "total_units" : null,
      Number.isFinite(annualInPlaceRent) && annualInPlaceRent > 0 ? "annual_in_place_rent" : null,
      Number.isFinite(derivedOccupancy) && derivedOccupancy >= 0 && derivedOccupancy <= 1 ? "occupancy" : null,
      hasUnitMix ? "unit_mix" : null,
      hasMarketRent ? "market_rent" : null,
      hasLeaseDates ? "lease_dates" : null,
      hasSquareFootage ? "square_footage" : null,
    ].filter(Boolean),
    missingInputs,
    notes: [
      summaryRowDetected ? "summary_totals_trusted" : null,
      hasOptionalDetail ? "optional_rent_roll_detail_present" : "optional_rent_roll_detail_missing",
    ].filter(Boolean),
    evidence: {
      total_units: totalUnits,
      annual_in_place_rent: annualInPlaceRent,
      occupancy: derivedOccupancy,
      optional_detail_present: hasOptionalDetail,
      summary_row_detected: summaryRowDetected,
      unit_row_count: unitRows.length,
    },
  });
}

export function buildCoreInputSufficiencyState({
  t12Payload = null,
  computedRentRoll = null,
  rentRollPayload = null,
  sourceReconciliationState = null,
} = {}) {
  const t12State = buildT12SufficiencyState({ t12Payload });
  const rentRollState = buildRentRollSufficiencyState({ computedRentRoll, rentRollPayload });
  const reconciliationStatus = String(sourceReconciliationState?.status || "").toLowerCase();
  const reconciliationCustomerImpact = String(sourceReconciliationState?.customer_delivery_impact || "").toLowerCase();
  const reconciliationPublicImpact = String(sourceReconciliationState?.public_outreach_impact || "").toLowerCase();
  const reconciliationBucket =
    reconciliationStatus === "parser_suspected"
      ? "admin_review_required"
      : reconciliationStatus === "source_reconciliation_required"
      ? "disclose_only_publishable"
      : reconciliationStatus === "aligned"
      ? "core_sufficient_publishable"
      : reconciliationStatus === "insufficient_inputs"
      ? "section_constrained_publishable"
      : "section_constrained_publishable";

  let publishabilityBucket = "core_sufficient_publishable";
  if (t12State.user_needs_documents || rentRollState.user_needs_documents) {
    publishabilityBucket = "user_needs_documents";
  } else if (t12State.admin_review_required || rentRollState.admin_review_required || reconciliationBucket === "admin_review_required") {
    publishabilityBucket = "admin_review_required";
  } else if (t12State.system_contract_failure || rentRollState.system_contract_failure) {
    publishabilityBucket = "system_contract_failure";
  } else if (reconciliationBucket === "disclose_only_publishable") {
    publishabilityBucket = "disclose_only_publishable";
  } else if (t12State.section_constrained_publishable || rentRollState.section_constrained_publishable || reconciliationBucket === "section_constrained_publishable") {
    publishabilityBucket = "section_constrained_publishable";
  }

  return buildPublishabilityState({
    publishabilityBucket,
    status:
      publishabilityBucket === "core_sufficient_publishable" ? "validated" :
      publishabilityBucket === "section_constrained_publishable" ? "validated" :
      publishabilityBucket === "disclose_only_publishable" ? "validated" :
      publishabilityBucket === "public_or_outreach_only_blocker" ? "validated" :
      publishabilityBucket === "user_needs_documents" ? "insufficient_inputs" :
      publishabilityBucket === "admin_review_required" ? "contradiction" :
      "system_failure",
    reasonCode:
      publishabilityBucket === "user_needs_documents"
        ? t12State.user_needs_documents ? t12State.reason_code : rentRollState.reason_code
        : publishabilityBucket === "admin_review_required"
        ? (t12State.admin_review_required ? t12State.reason_code : rentRollState.reason_code) || "source_reconciliation_required"
        : reconciliationBucket === "disclose_only_publishable"
        ? sourceReconciliationState?.source_reconciliation_disclosure ? "source_reconciliation_disclosed" : null
        : null,
    customerDeliveryImpact:
      publishabilityBucket === "disclose_only_publishable"
        ? "disclose_only"
        : publishabilityBucket === "admin_review_required" || publishabilityBucket === "system_contract_failure" || publishabilityBucket === "user_needs_documents"
        ? "block"
        : "none",
    publicOutreachImpact:
      publishabilityBucket === "disclose_only_publishable"
        ? "block_until_review"
        : publishabilityBucket === "admin_review_required" || publishabilityBucket === "system_contract_failure" || publishabilityBucket === "user_needs_documents"
        ? "block_until_review"
        : t12State.public_outreach_impact === "block_until_review" || rentRollState.public_outreach_impact === "block_until_review" || reconciliationPublicImpact === "block_until_review"
        ? "block_until_review"
        : "none",
    requiredInputs: ["t12_parsed", "rent_roll_parsed"],
    presentInputs: [t12State, rentRollState]
      .flatMap((state) => Array.isArray(state?.present_inputs) ? state.present_inputs : [])
      .filter(Boolean),
    missingInputs: [t12State, rentRollState]
      .flatMap((state) => Array.isArray(state?.missing_inputs) ? state.missing_inputs : [])
      .filter(Boolean),
    notes: [
      t12State.reason_code,
      rentRollState.reason_code,
      sourceReconciliationState?.source_reconciliation_disclosure ? "source_reconciliation_disclosed" : null,
    ].filter(Boolean),
    evidence: {
      t12_state: t12State,
      rent_roll_state: rentRollState,
      source_reconciliation_state: sourceReconciliationState || null,
    },
  });
}

export function sanitizeFinalCustomerHtml(html) {
  if (typeof html !== "string") return "";
  let out = html;
  out = out
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/&(?:ndash|mdash);/gi, "-")
    .replace(/\u00b7/g, " | ")
    .replace(/\u2212/g, "-")
    .replace(/\u00c2\u00b7/g, " | ")
    .replace(/\u00c3\u201a\u00c2\u00b7/g, " | ")
    .replace(/\u00e2\u20ac\u201d/g, "-")
    .replace(/\u00e2\u20ac\u201c/g, "-")
    .replace(/\u00e2\u02c6\u2019/g, "'")
    .replace(/\u00c3\u201a/g, "");
  out = out.replace(HIDDEN_OUTPUT_CHARACTERS, " ");
  out = out.replace(/[ \t]{2,}/g, " ");
  return out;
}

export function buildCurrentDebtAssessmentState({
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  sourceReportCoverageQa = null,
  artifacts = [],
  t12Noi = null,
} = {}) {
  const inventory = sourceReportCoverageQa?.artifact_inventory || {};
  const resolvedMortgage = mortgagePayload || latestArtifactPayload(artifacts, "mortgage_statement_parsed") || null;
  const resolvedLoan = loanTermSheetTermsPayload || latestArtifactPayload(artifacts, "loan_term_sheet_parsed") || null;
  const mortgageInventory = inventory?.mortgage_statement_parsed || {};
  const loanInventory = inventory?.loan_term_sheet_parsed || {};
  const normalizedNoi = coerceNumber(t12Noi);

  const hasMortgageDocument =
    Boolean(resolvedMortgage) ||
    Boolean(mortgageInventory.present) ||
    Boolean(mortgageInventory.has_balance) ||
    Boolean(mortgageInventory.has_payment) ||
    Boolean(mortgageInventory.has_rate) ||
    Boolean(mortgageInventory.has_amortization);
  const hasLoanDocument =
    Boolean(resolvedLoan) ||
    Boolean(loanInventory.present) ||
    Boolean(loanInventory.has_derived_acquisition_debt) ||
    Boolean(loanInventory.has_purchase_price) ||
    Boolean(loanInventory.has_rate) ||
    Boolean(loanInventory.has_amortization);

  const hasTrueCurrentDebtBalance =
    positiveNumber(resolvedMortgage?.outstanding_balance) ||
    Boolean(mortgageInventory.has_balance);

  const sourceMonthlyPayment = coerceNumber(
    resolvedMortgage?.monthly_payment ?? resolvedMortgage?.monthly_debt_service
  );
  const sourceAnnualDebtService = coerceNumber(resolvedMortgage?.annual_debt_service);
  const rateFraction = normalizeRateFraction(
    resolvedMortgage?.interest_rate ?? resolvedMortgage?.interestRate ?? resolvedMortgage?.rate
  );
  const amortYears = coerceNumber(
    resolvedMortgage?.amort_years ??
      resolvedMortgage?.amortization_years ??
      resolvedMortgage?.amortYears
  );
  const computedMonthlyPayment =
    hasTrueCurrentDebtBalance &&
    Number.isFinite(rateFraction) &&
    rateFraction > 0 &&
    Number.isFinite(amortYears) &&
    amortYears > 0
      ? coerceNumber(resolvedMortgage?.outstanding_balance) * (mortgageConstant(rateFraction, amortYears) || 0)
      : null;
  const annualDebtService = Number.isFinite(sourceAnnualDebtService) && sourceAnnualDebtService > 0
    ? sourceAnnualDebtService
    : Number.isFinite(sourceMonthlyPayment) && sourceMonthlyPayment > 0
    ? sourceMonthlyPayment * 12
    : Number.isFinite(computedMonthlyPayment) && computedMonthlyPayment > 0
    ? computedMonthlyPayment * 12
    : null;

  const hasCurrentDebtService =
    Number.isFinite(sourceAnnualDebtService) && sourceAnnualDebtService > 0 ||
    Number.isFinite(sourceMonthlyPayment) && sourceMonthlyPayment > 0 ||
    Number.isFinite(computedMonthlyPayment) && computedMonthlyPayment > 0 ||
    Boolean(mortgageInventory.has_payment);

  const hasProposedAcquisitionFinancing =
    (
      positiveNumber(resolvedLoan?.purchase_price) &&
      positiveNumber(resolvedLoan?.ltv) &&
      positiveNumber(resolvedLoan?.interest_rate) &&
      positiveNumber(resolvedLoan?.amortization_years ?? resolvedLoan?.amort_years) &&
      positiveNumber(resolvedLoan?.derived_acquisition_loan_amount)
    ) ||
    (
      Boolean(loanInventory.has_derived_acquisition_debt) &&
      Boolean(loanInventory.has_purchase_price) &&
      Boolean(loanInventory.has_rate) &&
      Boolean(loanInventory.has_amortization)
    );

  const currentDebtDscr =
    hasTrueCurrentDebtBalance &&
    Number.isFinite(normalizedNoi) &&
    normalizedNoi > 0 &&
    Number.isFinite(annualDebtService) &&
    annualDebtService > 0
      ? normalizedNoi / annualDebtService
      : null;

  let currentDebtLimitationReasonCode = null;
  if (!Number.isFinite(currentDebtDscr)) {
    if (hasProposedAcquisitionFinancing && !hasTrueCurrentDebtBalance) {
      currentDebtLimitationReasonCode = "acquisition_only_not_current_debt";
    } else if (hasMortgageDocument && !hasTrueCurrentDebtBalance && hasCurrentDebtService) {
      currentDebtLimitationReasonCode = "no_current_outstanding_balance";
    } else if (hasMortgageDocument && !hasTrueCurrentDebtBalance) {
      currentDebtLimitationReasonCode = "no_current_outstanding_balance";
    } else if (hasMortgageDocument && hasTrueCurrentDebtBalance && !hasCurrentDebtService) {
      currentDebtLimitationReasonCode = "incomplete_current_debt_terms";
    } else if (hasLoanDocument && !hasMortgageDocument && !hasTrueCurrentDebtBalance) {
      currentDebtLimitationReasonCode = "acquisition_only_not_current_debt";
    } else {
      currentDebtLimitationReasonCode = "no_current_debt_document";
    }
  }

  return {
    has_true_current_debt_balance: Boolean(hasTrueCurrentDebtBalance),
    has_current_debt_service: Boolean(hasCurrentDebtService),
    has_proposed_acquisition_financing: Boolean(hasProposedAcquisitionFinancing),
    has_current_debt_document: Boolean(hasMortgageDocument),
    current_debt_dscr_status: Number.isFinite(currentDebtDscr) && currentDebtDscr > 0 ? "computed" : "not_assessed",
    current_debt_dscr: Number.isFinite(currentDebtDscr) && currentDebtDscr > 0 ? currentDebtDscr : null,
    current_debt_limitation_reason_code: currentDebtLimitationReasonCode,
    current_debt_service: Number.isFinite(annualDebtService) && annualDebtService > 0 ? annualDebtService : null,
  };
}

export function hasCurrentDebtSemanticState(currentDebtState = null) {
  return Boolean(
    currentDebtState &&
      (
        currentDebtState.current_debt_dscr_status !== undefined ||
        currentDebtState.current_debt_limitation_reason_code !== undefined ||
        currentDebtState.has_true_current_debt_balance !== undefined ||
        currentDebtState.has_current_debt_service !== undefined ||
        currentDebtState.has_proposed_acquisition_financing !== undefined ||
        currentDebtState.has_current_debt_document !== undefined
      )
  );
}

export function buildAcquisitionAssumptionState({
  loanTermSheetTermsPayload = null,
  sourceReportCoverageQa = null,
  currentDebtState = null,
  artifacts = [],
} = {}) {
  const inventory = sourceReportCoverageQa?.artifact_inventory || {};
  const resolvedLoan =
    loanTermSheetTermsPayload ||
    latestArtifactPayload(artifacts, "loan_term_sheet_parsed") ||
    inventory?.loan_term_sheet_parsed ||
    null;
  const loanInventory = inventory?.loan_term_sheet_parsed || {};
  const semanticDocRole = String(
    loanInventory?.semantic_doc_role || resolvedLoan?.semantic_doc_role || ""
  ).trim() || null;
  const semanticDocDisplayLabel = String(
    loanInventory?.semantic_doc_display_label || resolvedLoan?.semantic_doc_display_label || ""
  ).trim() || null;
  const validatedFields = {
    purchase_price: positiveNumber(resolvedLoan?.purchase_price),
    ltv: positiveNumber(resolvedLoan?.ltv),
    interest_rate: positiveNumber(resolvedLoan?.interest_rate),
    amortization_years: positiveNumber(resolvedLoan?.amortization_years ?? resolvedLoan?.amort_years),
    going_in_cap_rate: positiveNumber(resolvedLoan?.going_in_cap_rate),
    closing_costs_percent: Number.isFinite(coerceNumber(resolvedLoan?.closing_costs_percent)) &&
      coerceNumber(resolvedLoan?.closing_costs_percent) >= 0,
    derived_acquisition_loan_amount: positiveNumber(resolvedLoan?.derived_acquisition_loan_amount),
    debt_basis: String(resolvedLoan?.debt_basis || "").trim().length > 0,
  };
  const validatedFieldNames = Object.entries(validatedFields)
    .filter(([, present]) => Boolean(present))
    .map(([key]) => key);
  const coreValidatedFieldNames = [
    "purchase_price",
    "ltv",
    "interest_rate",
    "amortization_years",
    "derived_acquisition_loan_amount",
  ];
  const hasValidatedAcquisitionAssumptions = coreValidatedFieldNames.every((key) => Boolean(validatedFields[key]));
  const hasProposedAcquisitionFinancing =
    Boolean(currentDebtState?.has_proposed_acquisition_financing) ||
    Boolean(loanInventory?.has_derived_acquisition_debt) ||
    validatedFieldNames.some((key) => key === "derived_acquisition_loan_amount");
  const hasTrueCurrentDebtBalance = Boolean(currentDebtState?.has_true_current_debt_balance);
  const acquisitionFinancingRendered = Array.isArray(sourceReportCoverageQa?.rendered_text_signals)
    ? sourceReportCoverageQa.rendered_text_signals.includes("acquisition_financing_assumptions")
    : false;
  const currentDebtSeparated = hasProposedAcquisitionFinancing && !hasTrueCurrentDebtBalance;
  const semanticRoleSupported =
    semanticDocRole === "purchase_assumptions" ||
    semanticDocDisplayLabel === "purchase_assumptions";
  const acquisitionAssumptionsSupported =
    semanticRoleSupported &&
    hasValidatedAcquisitionAssumptions &&
    currentDebtSeparated &&
    acquisitionFinancingRendered;
  const acquisitionSupportStatus = acquisitionAssumptionsSupported
    ? "validated_supported"
    : hasValidatedAcquisitionAssumptions
    ? "validated_partial"
    : hasProposedAcquisitionFinancing
    ? "partial_or_unsupported"
    : "unsupported";
  return {
    semantic_doc_role: semanticDocRole,
    semantic_doc_display_label: semanticDocDisplayLabel,
    validated_fields: validatedFields,
    validated_field_names: validatedFieldNames,
    has_validated_acquisition_assumptions: hasValidatedAcquisitionAssumptions,
    has_proposed_acquisition_financing: hasProposedAcquisitionFinancing,
    has_true_current_debt_balance: hasTrueCurrentDebtBalance,
    current_debt_separated: currentDebtSeparated,
    acquisition_financing_rendered: acquisitionFinancingRendered,
    acquisition_assumptions_supported: acquisitionAssumptionsSupported,
    acquisition_support_status: acquisitionSupportStatus,
  };
}

export function formatCurrentDebtAssessmentCopy({
  currentDebtState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  t12Noi = null,
} = {}) {
  const state =
    currentDebtState ||
    buildCurrentDebtAssessmentState({
      mortgagePayload,
      loanTermSheetTermsPayload,
      t12Noi,
    });
  if (state?.current_debt_dscr_status === "computed" && Number.isFinite(state?.current_debt_dscr)) {
    return {
      value: formatMultiple(state.current_debt_dscr, 2),
      explanation: "Current debt DSCR computed from verified current debt balance and debt service.",
      band: "Verified current debt balance and debt service",
      detail: "Current debt DSCR is assessed from verified current debt balance and debt service.",
    };
  }
  const baseText =
    "Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified.";
  switch (state?.current_debt_limitation_reason_code) {
    case "acquisition_only_not_current_debt":
      return {
        value: "Not assessed",
        explanation: `Proposed acquisition financing is shown separately and is not treated as current outstanding debt. ${baseText}`,
        band: "Proposed acquisition financing is not current outstanding debt",
        detail: "Proposed acquisition financing is shown separately and is not treated as current outstanding debt.",
      };
    case "no_current_outstanding_balance":
      return {
        value: "Not assessed",
        explanation: baseText,
        band: "Current debt balance not provided",
        detail: baseText,
      };
    case "incomplete_current_debt_terms":
      return {
        value: "Not assessed",
        explanation: "Current debt terms were not fully provided. " + baseText,
        band: "Current debt balance, rate, and amortization not fully provided",
        detail: "Current debt terms were not fully provided.",
      };
    case "no_current_debt_document":
    default:
      return {
        value: "Not assessed",
        explanation: "No current debt document provided. " + baseText,
        band: "No current debt document provided",
        detail: "No current debt document provided.",
      };
  }
}

export function buildSupportDocTaxonomyState({
  declaredDocType = null,
  detectedDocType = null,
  originalFilename = null,
  rawText = null,
  payload = null,
} = {}) {
  const text = normalizeText([
    declaredDocType,
    detectedDocType,
    originalFilename,
    rawText,
    payload?.original_filename,
    payload?.semantic_doc_role,
  ].filter(Boolean).join(" "));

  const hasText = (terms = []) => terms.some((term) => text.includes(normalizeText(term)));
  const countText = (terms = []) => terms.filter((term) => text.includes(normalizeText(term))).length;
  const hasCurrentDebtSignals =
    [
      payload?.outstanding_balance,
    ].some((value) => positiveNumber(value)) ||
    hasText([
      "current mortgage statement",
      "existing mortgage",
      "true current debt",
      "current debt",
      "current outstanding balance",
      "outstanding principal",
      "unpaid principal",
      "mortgage balance",
      "current loan balance",
      "current outstanding principal balance",
    ]);
  const acquisitionPayloadSignalCount = [
    payload?.ltv,
    payload?.interest_rate,
    payload?.amortization_years ?? payload?.amort_years,
    payload?.closing_costs_percent,
    payload?.derived_acquisition_loan_amount,
    payload?.loan_amount,
  ].filter((value) => positiveNumber(value)).length;
  const hasPurchaseAssumptionSignals =
    positiveNumber(payload?.purchase_price) &&
    (
      acquisitionPayloadSignalCount >= 2 ||
      (
        acquisitionPayloadSignalCount >= 1 &&
        positiveNumber(payload?.going_in_cap_rate)
      ) ||
      (
        acquisitionPayloadSignalCount >= 1 &&
        (
          hasText(["purchase price", "purchase assumptions", "acquisition financing", "going-in cap", "ltv", "loan-to-value", "closing costs", "amortization"]) ||
          countText(["purchase", "assumption", "financ", "loan", "ltv", "amort", "rate", "closing"]) >= 1
        )
      )
    ) &&
    (
      hasText(["purchase price", "purchase assumptions", "acquisition financing", "going-in cap", "ltv", "loan-to-value", "closing costs", "amortization"]) ||
      countText(["purchase", "assumption", "financ", "loan", "ltv", "amort", "rate", "closing"]) >= 1 ||
      acquisitionPayloadSignalCount >= 2 ||
      positiveNumber(payload?.going_in_cap_rate)
    );
  const hasRenovationSignals =
    positiveNumber(payload?.total_budget) ||
    positiveNumber(payload?.total_capex) ||
    positiveNumber(payload?.renovation_budget) ||
    (Array.isArray(payload?.budget_rows) && payload.budget_rows.length > 0) ||
    (Array.isArray(payload?.execution_rows) && payload.execution_rows.length > 0) ||
    hasText(["renovation", "capex", "cap ex", "capital budget", "capital expenditure", "scope of work", "unit turn", "phasing", "rent lift", "roi", "payback"]);
  const hasPropertyTaxSignals =
    positiveNumber(payload?.annual_tax) ||
    hasText(["property tax", "tax bill", "assessment notice", "assessment", "roll number", "municipal tax"]);
  const hasAppraisalSignals =
    positiveNumber(payload?.appraised_value) ||
    positiveNumber(payload?.cap_rate) ||
    hasText(["appraisal", "appraised value", "as-is value", "stabilized value", "value conclusion", "opinion of value", "valuation report", "market survey", "broker opinion"]);
  const hasStrongLoanTermSignals =
    [
      payload?.loan_amount,
      payload?.interest_rate,
      payload?.amort_years,
      payload?.monthly_payment,
      payload?.annual_debt_service,
      payload?.lender_name,
      payload?.maturity_date,
    ].filter((value) => Boolean(value)).length >= 2 ||
    countText(["interest rate", "amortization", "loan amount", "lender", "maturity", "debt service", "financing terms", "refi terms"]) >= 2 ||
    (hasText(["term sheet", "loan terms"]) &&
      countText(["interest rate", "amortization", "loan amount", "lender", "maturity", "debt service", "financing terms", "refi terms"]) >= 1);
  const hasBrokerEmailSignals =
    hasText(["broker", "email", "from:", "re:", "subject:", "sent:", "@"]) &&
    !hasPurchaseAssumptionSignals &&
    !hasCurrentDebtSignals &&
    !hasStrongLoanTermSignals;

  let semanticDocRole = "other_support";
  let semanticDocRoleReason = "fallback_other_support";
  let confidence = 0.5;

  if (hasCurrentDebtSignals) {
    semanticDocRole = "current_mortgage_statement";
    semanticDocRoleReason = "current_debt_support_signals";
    confidence = 0.98;
  } else if (hasPurchaseAssumptionSignals) {
    semanticDocRole = "purchase_assumptions";
    semanticDocRoleReason = "purchase_assumption_support_signals";
    confidence = 0.96;
  } else if (hasRenovationSignals) {
    semanticDocRole = "renovation_budget";
    semanticDocRoleReason = "renovation_support_signals";
    confidence = 0.93;
  } else if (hasPropertyTaxSignals) {
    semanticDocRole = "property_tax";
    semanticDocRoleReason = "property_tax_support_signals";
    confidence = 0.93;
  } else if (hasBrokerEmailSignals && !hasStrongLoanTermSignals) {
    semanticDocRole = "broker_email";
    semanticDocRoleReason = "broker_email_support_signals";
    confidence = 0.8;
  } else if (hasAppraisalSignals) {
    semanticDocRole = "appraisal";
    semanticDocRoleReason = "appraisal_support_signals";
    confidence = 0.9;
  } else if (hasStrongLoanTermSignals) {
    semanticDocRole = "loan_term_sheet";
    semanticDocRoleReason = "loan_term_support_signals";
    confidence = 0.88;
  } else {
    const fallbackDocType = normalizeText(detectedDocType || declaredDocType || payload?.doc_type || "");
    if (fallbackDocType === "mortgage_statement") {
      semanticDocRole = "current_mortgage_statement";
      semanticDocRoleReason = "fallback_doc_type_mortgage_statement";
      confidence = 0.7;
    } else if (fallbackDocType === "loan_term_sheet") {
      semanticDocRole = "loan_term_sheet";
      semanticDocRoleReason = "fallback_doc_type_loan_term_sheet";
      confidence = 0.7;
    } else if (fallbackDocType === "renovation") {
      semanticDocRole = "renovation_budget";
      semanticDocRoleReason = "fallback_doc_type_renovation";
      confidence = 0.7;
    } else if (fallbackDocType === "property_tax") {
      semanticDocRole = "property_tax";
      semanticDocRoleReason = "fallback_doc_type_property_tax";
      confidence = 0.7;
    } else if (fallbackDocType === "appraisal") {
      semanticDocRole = "appraisal";
      semanticDocRoleReason = "fallback_doc_type_appraisal";
      confidence = 0.7;
    }
  }

  const fallbackDisplayLabel = displayLabelForDocType(
    detectedDocType || declaredDocType || payload?.doc_type || ""
  ) || displayLabelForDocType(semanticDocRole);
  const semanticDocDisplayLabel =
    confidence >= 0.75
      ? semanticDocRole
      : fallbackDisplayLabel || semanticDocRole;

  return {
    semantic_doc_role: semanticDocRole,
    semantic_doc_role_confidence: confidence,
    semantic_doc_role_reason: semanticDocRoleReason,
    semantic_doc_family: "support_doc",
    semantic_doc_display_label: semanticDocDisplayLabel,
  };
}

export function resolveSupportDocDisplayLabel({
  semanticDocRole = null,
  semanticDocRoleConfidence = null,
  originalFilename = null,
  declaredDocType = null,
  detectedDocType = null,
  docType = null,
} = {}) {
  const confidence = Number(semanticDocRoleConfidence);
  if (semanticDocRole && Number.isFinite(confidence) && confidence >= 0.75) {
    return semanticDocRole;
  }
  const filenameText = normalizeText(originalFilename);
  const fallbackDocType = normalizeText(declaredDocType || detectedDocType || docType || "");
  if (
    /broker/.test(filenameText) &&
    /email/.test(filenameText) &&
    /loan[\s_-]*term[\s_-]*sheet|loan_term_sheet/.test(fallbackDocType)
  ) {
    return "broker_email";
  }
  if (
    /purchase[\s_-]*assumptions|acquisition[\s_-]*assumptions|acquisition support/.test(filenameText) &&
    /appraisal|valuation/.test(fallbackDocType)
  ) {
    return "purchase_assumptions";
  }
  if (/renov|capex|capital budget|capital expenditure/.test(filenameText)) {
    return "renovation_budget";
  }
  if (
    /(current|existing|outstanding).*(mortgage|debt)|mortgage|debt/.test(filenameText) &&
    /loan[\s_-]*term[\s_-]*sheet|loan_term_sheet|mortgage_statement/.test(fallbackDocType)
  ) {
    return "current_mortgage_statement";
  }
  if (semanticDocRole) {
    return semanticDocRole;
  }
  return displayLabelForDocType(fallbackDocType || "");
}

export function buildAssumptionAttributionState({
  sourceProvided = false,
  userProvided = false,
  frameworkProvided = false,
} = {}) {
  const attribution = sourceProvided
    ? "document_derived"
    : userProvided
    ? "user_provided"
    : frameworkProvided
    ? "standardized_framework"
    : "unavailable";
  return {
    attribution,
    attribution_label: formatAssumptionAttributionLabel(attribution),
  };
}

export function formatAssumptionAttributionLabel(value) {
  switch (String(value || "").trim().toLowerCase()) {
    case "document_derived":
      return "document-derived";
    case "user_provided":
      return "user-provided";
    case "standardized_framework":
      return "standardized framework assumption";
    case "unavailable":
    default:
      return "unavailable";
  }
}

export function normalizeRenovationMetricKind(row = {}) {
  const raw = normalizeText([
    row?.metric_kind,
    row?.kind,
    row?.metric,
    row?.label,
    row?.item,
    row?.category,
    row?.scope_of_work,
  ].filter(Boolean).join(" ")).replace(/[_/]+/g, " ");
  if (!raw) return "unknown";
  if (/(per[\s-]*unit[\s-]*cost|cost[\s-]*per[\s-]*unit|unit[\s-]*cost)/i.test(raw)) return "per_unit_cost";
  if (/(total budget|budget total|total capex|total renovation|capital budget|renovation budget)/i.test(raw)) return "total_budget";
  if (/(percent of budget|pct of budget|percentage of budget|budget share)/i.test(raw)) return "percent_of_budget";
  if (/(scope|category|objective|line item|description|text)/i.test(raw)) return "scope_category";
  if (/\b(unit count|units?|count)\b/i.test(raw)) return "unit_count";
  return "unknown";
}

export function dedupeRenovationMetricRows(rows = []) {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (!row || typeof row !== "object") return false;
    const metricKind = normalizeRenovationMetricKind(row);
    const rawValue =
      row?.value ??
      row?.amount ??
      row?.estimated_cost ??
      row?.scope_of_work ??
      row?.metric ??
      row?.label ??
      row?.item ??
      "";
    const normalizedValue = Number.isFinite(coerceNumber(rawValue))
      ? String(coerceNumber(rawValue))
      : normalizeText(rawValue);
    const rowKey = `${metricKind}::${normalizedValue}`;
    if (seen.has(rowKey)) return false;
    seen.add(rowKey);
    return true;
  });
}

export function formatRenovationMetricValue({
  metricKind = "unknown",
  value = null,
  formatCurrency = null,
} = {}) {
  const numericValue = coerceNumber(value);
  const textValue = String(value ?? "").trim();
  switch (String(metricKind || "").trim()) {
    case "unit_count":
      return Number.isFinite(numericValue) ? String(Math.round(numericValue)) : textValue;
    case "per_unit_cost":
    case "total_budget":
      return Number.isFinite(numericValue) && typeof formatCurrency === "function"
        ? formatCurrency(numericValue)
        : textValue;
    case "percent_of_budget":
      if (!Number.isFinite(numericValue)) return textValue;
      if (numericValue <= 1) return `${(numericValue * 100).toFixed(1)}%`;
      return `${numericValue.toFixed(1)}%`;
    case "scope_category":
      return textValue;
    default:
      return textValue;
  }
}

function latestArtifactInventory(sourceReportCoverageQa = null, artifacts = []) {
  if (sourceReportCoverageQa?.artifact_inventory && typeof sourceReportCoverageQa.artifact_inventory === "object") {
    return sourceReportCoverageQa.artifact_inventory;
  }
  return {
    rent_roll_parsed: latestArtifactPayload(artifacts, "rent_roll_parsed") ? { present: true } : { present: false },
    t12_parsed: latestArtifactPayload(artifacts, "t12_parsed") ? { present: true } : { present: false },
    loan_term_sheet_parsed: latestArtifactPayload(artifacts, "loan_term_sheet_parsed") ? { present: true } : { present: false },
    mortgage_statement_parsed: latestArtifactPayload(artifacts, "mortgage_statement_parsed") ? { present: true } : { present: false },
    renovation_parsed: latestArtifactPayload(artifacts, "renovation_parsed") ? { present: true } : { present: false },
    appraisal_parsed: latestArtifactPayload(artifacts, "appraisal_parsed") ? { present: true } : { present: false },
    property_tax_parsed: latestArtifactPayload(artifacts, "property_tax_parsed") ? { present: true } : { present: false },
  };
}

function presenceFromInventory(inventory, key, predicate = null) {
  const row = inventory?.[key];
  if (!row) return false;
  if (!predicate) return Boolean(row.present);
  return Boolean(row.present) && Boolean(predicate(row));
}

function toRenderedSections(sourceReportCoverageQa = null) {
  return sourceReportCoverageQa?.rendered_sections && typeof sourceReportCoverageQa.rendered_sections === "object"
    ? sourceReportCoverageQa.rendered_sections
    : {};
}

function normalizeReconciliationVariance(rrAnnual, gpr, sourceReportCoverageQa = null) {
  const variancePct = Number.isFinite(rrAnnual) && Number.isFinite(gpr) && gpr > 0 ? (rrAnnual - gpr) / gpr : null;
  const materialVariance = Number.isFinite(variancePct) && Math.abs(variancePct) >= 0.05;
  const flags = Array.isArray(sourceReportCoverageQa?.deterministic_flags) ? sourceReportCoverageQa.deterministic_flags : [];
  const parserSignals = flags.some((flag) => {
    const code = String(flag?.code || "").toLowerCase();
    const routing = String(flag?.routing || "");
    return (
      materialVariance &&
      /rent.*roll|t12|gpr|reconcil|discrep|contradict|variance/.test(code) &&
      ["parser_gap", "artifact_gap"].includes(routing)
    );
  });
  const status = !Number.isFinite(rrAnnual) || !Number.isFinite(gpr)
    ? "insufficient_inputs"
    : materialVariance
    ? (parserSignals ? "parser_suspected" : "source_reconciliation_required")
    : "aligned";
  const customerDeliveryImpact =
    status === "aligned" || status === "insufficient_inputs"
      ? "none"
      : status === "parser_suspected"
      ? "block"
      : "disclose_only";
  const publicOutreachImpact =
    status === "aligned" || status === "insufficient_inputs" ? "none" : "block_until_review";
  return {
    rr_annual_in_place: rrAnnual,
    t12_gpr: gpr,
    variance_pct: variancePct,
    status,
    customer_delivery_impact: customerDeliveryImpact,
    public_outreach_impact: publicOutreachImpact,
    parser_suspected: status === "parser_suspected",
    source_reconciliation_required: status === "source_reconciliation_required",
    has_material_variance: materialVariance,
  };
}

function resolveCanonicalRentRollAnnualInPlace({
  computedRentRoll = null,
  rentRollPayload = null,
} = {}) {
  const rentRollTotals = rentRollPayload && typeof rentRollPayload.totals === "object" ? rentRollPayload.totals : null;
  const trustedSummaryTotals = Boolean(
    rentRollTotals?.summary_row_detected === true ||
    rentRollPayload?.summary_row_detected === true ||
    computedRentRoll?.summary_row_detected === true
  );
  const summaryCandidates = [
    { value: rentRollTotals?.in_place_rent_annual, source_path: "rentRollPayload.totals.in_place_rent_annual" },
    { value: rentRollTotals?.current_rent_annual, source_path: "rentRollPayload.totals.current_rent_annual" },
    { value: rentRollPayload?.total_in_place_annual, source_path: "rentRollPayload.total_in_place_annual" },
    { value: rentRollPayload?.annual_in_place_rent, source_path: "rentRollPayload.annual_in_place_rent" },
    { value: computedRentRoll?.total_in_place_annual, source_path: "computedRentRoll.total_in_place_annual" },
    { value: computedRentRoll?.annual_in_place_rent, source_path: "computedRentRoll.annual_in_place_rent" },
    { value: computedRentRoll?.total_annual_in_place, source_path: "computedRentRoll.total_annual_in_place" },
  ];
  const fallbackCandidates = [
    { value: computedRentRoll?.total_in_place_annual, source_path: "computedRentRoll.total_in_place_annual" },
    { value: computedRentRoll?.annual_in_place_rent, source_path: "computedRentRoll.annual_in_place_rent" },
    { value: computedRentRoll?.total_annual_in_place, source_path: "computedRentRoll.total_annual_in_place" },
    { value: rentRollPayload?.total_in_place_annual, source_path: "rentRollPayload.total_in_place_annual" },
    { value: rentRollTotals?.in_place_rent_annual, source_path: "rentRollPayload.totals.in_place_rent_annual" },
    { value: rentRollTotals?.current_rent_annual, source_path: "rentRollPayload.totals.current_rent_annual" },
    { value: rentRollPayload?.annual_in_place_rent, source_path: "rentRollPayload.annual_in_place_rent" },
  ];
  const chosenCandidates = trustedSummaryTotals ? [...summaryCandidates, ...fallbackCandidates] : fallbackCandidates;
  let selectedValue = null;
  let selectedSourcePath = null;
  for (const candidate of chosenCandidates) {
    const value = coerceNumber(candidate?.value);
    if (Number.isFinite(value) && value > 0) {
      selectedValue = value;
      selectedSourcePath = candidate?.source_path || null;
      break;
    }
  }
  if (Number.isFinite(selectedValue) && selectedValue > 0 && selectedValue < 1000) {
    const monthlyCandidate = trustedSummaryTotals
      ? coerceNumber(rentRollTotals?.in_place_rent_monthly ?? rentRollTotals?.current_rent_monthly)
      : coerceNumber(rentRollPayload?.totals?.in_place_rent_monthly ?? rentRollPayload?.totals?.current_rent_monthly);
    if (Number.isFinite(monthlyCandidate) && monthlyCandidate > 0) {
      selectedValue = monthlyCandidate * 12;
      selectedSourcePath = selectedSourcePath ? `${selectedSourcePath} * 12` : "monthly_x_12";
    }
  }
  if (!Number.isFinite(selectedValue)) {
    const rowSources = [];
    if (Array.isArray(computedRentRoll?.units)) rowSources.push(...computedRentRoll.units);
    if (Array.isArray(rentRollPayload?.units)) rowSources.push(...rentRollPayload.units);
    if (Array.isArray(rentRollPayload?.unit_mix)) rowSources.push(...rentRollPayload.unit_mix);
    if (rowSources.length > 0) {
      const rowAnnual = rowSources.reduce((sum, row) => {
        const rent = coerceNumber(row?.in_place_rent ?? row?.current_rent ?? row?.rent);
        return Number.isFinite(rent) && rent > 0 ? sum + (rent * 12) : sum;
      }, 0);
      if (Number.isFinite(rowAnnual) && rowAnnual > 0) {
        selectedValue = rowAnnual;
        selectedSourcePath = "row_derived_units.in_place_rent";
      }
    }
  }
  return {
    value: Number.isFinite(selectedValue) && selectedValue > 0 ? selectedValue : null,
    source_path: selectedSourcePath,
    trusted_summary_totals: trustedSummaryTotals,
  };
}

function resolveCanonicalT12GprSource(t12Payload = null) {
  const candidates = [
    { value: t12Payload?.gross_potential_rent, source_path: "t12Payload.gross_potential_rent" },
    { value: t12Payload?.gross_scheduled_rent, source_path: "t12Payload.gross_scheduled_rent" },
    { value: t12Payload?.gross_income, source_path: "t12Payload.gross_income" },
    { value: t12Payload?.total_income, source_path: "t12Payload.total_income" },
  ];
  for (const candidate of candidates) {
    const value = coerceNumber(candidate?.value);
    if (Number.isFinite(value) && value > 0) {
      return {
        value,
        source_path: candidate?.source_path || null,
      };
    }
  }
  return {
    value: null,
    source_path: null,
  };
}

export function buildSourceReconciliationState({
  computedRentRoll = null,
  rentRollPayload = null,
  t12Payload = null,
  sourceReportCoverageQa = null,
  artifacts = [],
} = {}) {
  const resolvedInventory = latestArtifactInventory(sourceReportCoverageQa, artifacts);
  const rrSelection = resolveCanonicalRentRollAnnualInPlace({ computedRentRoll, rentRollPayload });
  const gprSelection = resolveCanonicalT12GprSource(t12Payload);
  const rrAnnual = rrSelection.value;
  const gpr = gprSelection.value;
  const state = normalizeReconciliationVariance(rrAnnual, gpr, sourceReportCoverageQa);
  const publishabilityBucket =
    state.status === "parser_suspected"
      ? "admin_review_required"
      : state.status === "source_reconciliation_required"
      ? "disclose_only_publishable"
      : state.status === "insufficient_inputs"
      ? "section_constrained_publishable"
      : "core_sufficient_publishable";
  return {
    ...state,
    publishability_bucket: publishabilityBucket,
    customer_delivery_impact:
      publishabilityBucket === "disclose_only_publishable" ? "disclose_only" :
      publishabilityBucket === "admin_review_required" || publishabilityBucket === "section_constrained_publishable" ? "none" :
      state.customer_delivery_impact,
    public_outreach_impact:
      publishabilityBucket === "disclose_only_publishable"
        ? "block_until_review"
        : state.public_outreach_impact,
    evidence: {
      rr_annual_in_place: state.rr_annual_in_place,
      t12_gpr: state.t12_gpr,
      rendered_signals: Array.isArray(sourceReportCoverageQa?.rendered_text_signals)
        ? sourceReportCoverageQa.rendered_text_signals
        : [],
    },
    source_selection: {
      rr_annual_in_place: {
        source_path: rrSelection.source_path,
        trusted_summary_totals: rrSelection.trusted_summary_totals,
        value: state.rr_annual_in_place,
      },
      t12_gpr: {
        source_path: gprSelection.source_path,
        value: state.t12_gpr,
      },
    },
    rr_annual_in_place_source: rrSelection.source_path,
    t12_gpr_source: gprSelection.source_path,
    source_reconciliation_disclosure:
      state.status === "source_reconciliation_required" || state.status === "parser_suspected"
        ? "InvestorIQ has not reconciled this variance and does not infer the cause."
        : null,
  };
}

function rolePresent(role, inventory, currentDebtState) {
  switch (role) {
    case "t12_parsed":
      return Boolean(inventory?.t12_parsed?.present && inventory?.t12_parsed?.has_core_totals);
    case "rent_roll_parsed":
      return Boolean(inventory?.rent_roll_parsed?.present);
    case "mortgage_statement_parsed":
      return Boolean(
        inventory?.mortgage_statement_parsed?.present &&
          (
            !inventory?.mortgage_statement_parsed?.semantic_doc_role ||
            inventory?.mortgage_statement_parsed?.semantic_doc_role === "current_mortgage_statement" ||
            inventory?.mortgage_statement_parsed?.semantic_doc_role === "mortgage_statement"
          )
      );
    case "loan_term_sheet_parsed":
      return Boolean(
        inventory?.loan_term_sheet_parsed?.present &&
          (
            !inventory?.loan_term_sheet_parsed?.semantic_doc_role ||
            inventory?.loan_term_sheet_parsed?.semantic_doc_role === "loan_term_sheet" ||
            inventory?.loan_term_sheet_parsed?.semantic_doc_role === "purchase_assumptions"
          )
      );
    case "renovation_parsed":
      return Boolean(
        inventory?.renovation_parsed?.present &&
          (
            !inventory?.renovation_parsed?.semantic_doc_role ||
            inventory?.renovation_parsed?.semantic_doc_role === "renovation_budget" ||
            inventory?.renovation_parsed?.semantic_doc_role === "renovation"
          ) &&
          (inventory?.renovation_parsed?.has_capex_amount || inventory?.renovation_parsed?.has_scope)
      );
    case "appraisal_parsed":
      return Boolean(
        inventory?.appraisal_parsed?.present &&
          (
            !inventory?.appraisal_parsed?.semantic_doc_role ||
            inventory?.appraisal_parsed?.semantic_doc_role === "appraisal"
          ) &&
          (inventory?.appraisal_parsed?.has_appraised_value || inventory?.appraisal_parsed?.has_cap_rate)
      );
    case "property_tax_parsed":
      return Boolean(
        inventory?.property_tax_parsed?.present &&
          (
            !inventory?.property_tax_parsed?.semantic_doc_role ||
            inventory?.property_tax_parsed?.semantic_doc_role === "property_tax"
          ) &&
          inventory?.property_tax_parsed?.has_annual_tax
      );
    case "current_debt_verified":
      return Boolean(currentDebtState?.has_true_current_debt_balance);
    case "acquisition_financing":
      return Boolean(currentDebtState?.has_proposed_acquisition_financing);
    default:
      return false;
  }
}

function anyRolePresent(roles = [], inventory, currentDebtState) {
  return (Array.isArray(roles) ? roles : []).some((role) => rolePresent(role, inventory, currentDebtState));
}

function allRolesPresent(roles = [], inventory, currentDebtState) {
  return (Array.isArray(roles) ? roles : []).every((role) => rolePresent(role, inventory, currentDebtState));
}

const UNDERWRITING_SECTION_BLUEPRINTS = {
  executive_summary: {
    rendered_keys: ["has_executive_summary_section", "has_operating_profile_section"],
    required_source_roles: ["t12_parsed", "rent_roll_parsed"],
    optional_source_roles: ["mortgage_statement_parsed", "loan_term_sheet_parsed", "renovation_parsed", "appraisal_parsed", "property_tax_parsed"],
    omission_reason_code: "source_constrained_executive_summary",
  },
  debt_structure: {
    rendered_keys: ["has_debt_section"],
    required_source_roles: ["t12_parsed"],
    optional_source_roles: ["mortgage_statement_parsed", "loan_term_sheet_parsed", "current_debt_verified", "acquisition_financing"],
    omission_reason_code: "source_constrained_debt_structure",
  },
  operating_statement: {
    rendered_keys: ["has_operating_statement_section"],
    required_source_roles: ["t12_parsed"],
    optional_source_roles: ["rent_roll_parsed"],
    omission_reason_code: "source_constrained_operating_statement",
  },
  operating_profile: {
    rendered_keys: ["has_operating_profile_section"],
    required_source_roles: ["t12_parsed", "rent_roll_parsed"],
    optional_source_roles: ["mortgage_statement_parsed"],
    omission_reason_code: "source_constrained_operating_profile",
  },
  expense_structure: {
    rendered_keys: ["has_expense_structure_section"],
    required_source_roles: ["t12_parsed"],
    optional_source_roles: ["rent_roll_parsed"],
    omission_reason_code: "source_constrained_expense_structure",
  },
  noi_stability: {
    rendered_keys: ["has_noi_stability_section"],
    required_source_roles: ["t12_parsed"],
    optional_source_roles: ["rent_roll_parsed", "mortgage_statement_parsed"],
    omission_reason_code: "source_constrained_noi_stability",
  },
  data_coverage: {
    rendered_keys: ["has_data_coverage_section"],
    required_source_roles: ["t12_parsed", "rent_roll_parsed"],
    optional_source_roles: ["mortgage_statement_parsed", "loan_term_sheet_parsed", "renovation_parsed", "appraisal_parsed", "property_tax_parsed"],
    omission_reason_code: "source_constrained_data_coverage",
  },
  scenario_analysis: {
    rendered_keys: ["has_scenario_section"],
    required_source_roles: ["t12_parsed"],
    optional_source_roles: ["rent_roll_parsed", "mortgage_statement_parsed", "loan_term_sheet_parsed"],
    omission_reason_code: "source_constrained_scenario_analysis",
  },
  renovation_strategy: {
    rendered_keys: ["has_renovation_section"],
    required_source_roles: ["t12_parsed"],
    optional_source_roles: ["renovation_parsed"],
    omission_reason_code: "no_structured_renovation_support",
  },
  deal_scorecard: {
    rendered_keys: ["has_deal_score_section"],
    required_source_roles: ["t12_parsed", "rent_roll_parsed"],
    optional_source_roles: ["mortgage_statement_parsed", "loan_term_sheet_parsed"],
    omission_reason_code: "source_constrained_deal_scorecard",
  },
  risk_register: {
    rendered_keys: ["has_risk_section"],
    required_source_roles: ["t12_parsed", "rent_roll_parsed"],
    optional_source_roles: ["mortgage_statement_parsed", "loan_term_sheet_parsed"],
    omission_reason_code: "source_constrained_risk_register",
  },
  dcf: {
    rendered_keys: ["has_dcf_section"],
    required_source_roles: ["t12_parsed"],
    optional_source_roles: ["appraisal_parsed", "mortgage_statement_parsed", "loan_term_sheet_parsed"],
    omission_reason_code: "source_constrained_dcf",
  },
  advanced_modeling: {
    rendered_keys: ["has_advanced_modeling_section"],
    required_source_roles: ["t12_parsed", "rent_roll_parsed"],
    optional_source_roles: ["mortgage_statement_parsed", "loan_term_sheet_parsed", "renovation_parsed", "appraisal_parsed"],
    omission_reason_code: "source_constrained_advanced_modeling",
  },
  methodology: {
    rendered_keys: ["has_methodology_section"],
    required_source_roles: ["t12_parsed"],
    optional_source_roles: [],
    omission_reason_code: "source_constrained_methodology",
  },
};

function sectionRendered(renderedSections, renderedKeys = []) {
  return (Array.isArray(renderedKeys) ? renderedKeys : []).some((key) => Boolean(renderedSections?.[key]));
}

export function buildFullUnderwritingSectionEligibility({
  sourceReportCoverageQa = null,
  artifacts = [],
  currentDebtState = null,
  sourceReconciliationState = null,
} = {}) {
  const inventory = latestArtifactInventory(sourceReportCoverageQa, artifacts);
  const renderedSections = toRenderedSections(sourceReportCoverageQa);
  const sections = {};

  for (const [sectionKey, blueprint] of Object.entries(UNDERWRITING_SECTION_BLUEPRINTS)) {
    const rendered = sectionRendered(renderedSections, blueprint.rendered_keys);
    const requiredSourceRoles = Array.isArray(blueprint.required_source_roles) ? blueprint.required_source_roles : [];
    const optionalSourceRoles = Array.isArray(blueprint.optional_source_roles) ? blueprint.optional_source_roles : [];
    const requiredSourcesPresent = allRolesPresent(requiredSourceRoles, inventory, currentDebtState);
    const optionalSourcesPresent = anyRolePresent(optionalSourceRoles, inventory, currentDebtState);
    const sourceReconciliationStatus = String(sourceReconciliationState?.status || "").toLowerCase();
    const currentDebtSourceConstrained =
      sectionKey === "debt_structure" &&
      currentDebtState?.current_debt_dscr_status !== "computed" &&
      !currentDebtState?.has_true_current_debt_balance;
    const sourceConstrained =
      !requiredSourcesPresent ||
      currentDebtSourceConstrained ||
      (sectionKey === "renovation_strategy" && !optionalSourcesPresent && !rendered);
    let publishabilityBucket =
      !requiredSourcesPresent
        ? "user_needs_documents"
        : sourceConstrained
        ? "section_constrained_publishable"
        : rendered
        ? "core_sufficient_publishable"
        : optionalSourcesPresent
        ? "section_constrained_publishable"
        : "section_constrained_publishable";
    if (sectionKey === "data_coverage" && sourceReconciliationStatus === "source_reconciliation_required") {
      publishabilityBucket = "disclose_only_publishable";
    } else if (
      ["operating_profile", "noi_stability"].includes(sectionKey) &&
      sourceReconciliationStatus === "source_reconciliation_required"
    ) {
      publishabilityBucket = "disclose_only_publishable";
    } else if (
      ["data_coverage", "operating_profile", "noi_stability"].includes(sectionKey) &&
      sourceReconciliationStatus === "parser_suspected"
    ) {
      publishabilityBucket = "admin_review_required";
    }
    const publicPublishabilityBucket =
      publishabilityBucket === "core_sufficient_publishable"
        ? "core_sufficient_publishable"
        : "public_or_outreach_only_blocker";
    const underused =
      !rendered &&
      (
        (sectionKey === "renovation_strategy" && Boolean(inventory?.renovation_parsed?.present)) ||
        (sectionKey === "debt_structure" && (Boolean(inventory?.mortgage_statement_parsed?.present) || Boolean(inventory?.loan_term_sheet_parsed?.present) || Boolean(currentDebtState?.has_proposed_acquisition_financing))) ||
        (sectionKey === "dcf" && Boolean(inventory?.appraisal_parsed?.present)) ||
        (sectionKey === "data_coverage" && Boolean(sourceReconciliationState?.has_material_variance)) ||
        (sectionKey === "operating_profile" && (Boolean(inventory?.t12_parsed?.present) || Boolean(inventory?.rent_roll_parsed?.present))) ||
        (sectionKey === "noi_stability" && (Boolean(inventory?.t12_parsed?.present) || Boolean(inventory?.rent_roll_parsed?.present)))
      );
    sections[sectionKey] = {
      eligible: Boolean(requiredSourcesPresent || optionalSourcesPresent || rendered || sourceConstrained),
      omitted: !rendered,
      source_constrained: Boolean(sourceConstrained),
      rendered,
      underused: Boolean(underused && !sourceConstrained),
      publishability_bucket: publishabilityBucket,
      public_publishability_bucket: publicPublishabilityBucket,
      customer_delivery_impact:
        publishabilityBucket === "disclose_only_publishable"
          ? "disclose_only"
          : publishabilityBucket === "core_sufficient_publishable" || publishabilityBucket === "section_constrained_publishable"
          ? "none"
          : publishabilityBucket === "user_needs_documents" || publishabilityBucket === "admin_review_required"
          ? "block"
          : "block",
      public_outreach_impact:
        publicPublishabilityBucket === "core_sufficient_publishable"
          ? "none"
          : "block_until_review",
      required_source_roles: requiredSourceRoles,
      optional_source_roles: optionalSourceRoles,
      omission_reason_code: rendered
        ? null
        : sourceConstrained
        ? (sectionKey === "debt_structure" && !currentDebtState?.has_true_current_debt_balance
          ? "no_true_current_debt_source"
          : blueprint.omission_reason_code)
        : optionalSourcesPresent
        ? "support_doc_unused"
        : blueprint.omission_reason_code,
    };
  }

  const sectionValues = Object.values(sections);
  return {
    sections,
    eligible_section_count: sectionValues.filter((entry) => entry.eligible).length,
    rendered_section_count: sectionValues.filter((entry) => entry.rendered).length,
    source_constrained_section_count: sectionValues.filter((entry) => entry.source_constrained).length,
    underused_section_count: sectionValues.filter((entry) => entry.underused).length,
    required_source_roles: [
      "t12_parsed",
      "rent_roll_parsed",
    ],
    source_constrained: sectionValues.some((entry) => entry.source_constrained),
  };
}
