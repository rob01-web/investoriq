/**
 * Single source of truth for all document role and authority decisions.
 * Raw files, extracted text, parser artifacts, and filename heuristics may only be read here.
 * All downstream consumers must treat this output as immutable authority.
 */

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\u2060\ufeff\ufffe\uffff]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getFileId(file) {
  return String(file?.fileId ?? file?.file_id ?? file?.id ?? "").trim();
}

function getOriginalFilename(file, artifactsByFileId) {
  const fileId = getFileId(file);
  const artifact = artifactsByFileId.get(fileId)?.[0] || null;
  return String(
    file?.originalFilename ||
      file?.original_filename ||
      artifact?.originalFilename ||
      artifact?.original_filename ||
      artifact?.payload?.originalFilename ||
      artifact?.payload?.original_filename ||
      ""
  ).trim();
}

function getMimeType(file, artifactsByFileId) {
  const fileId = getFileId(file);
  const artifact = artifactsByFileId.get(fileId)?.[0] || null;
  return String(
    file?.mimeType ||
      file?.mime_type ||
      artifact?.mimeType ||
      artifact?.mime_type ||
      artifact?.payload?.mimeType ||
      artifact?.payload?.mime_type ||
      ""
  ).trim().toLowerCase();
}

function getArtifactOriginalFilename(artifact) {
  return String(
    artifact?.originalFilename ||
      artifact?.original_filename ||
      artifact?.filename ||
      artifact?.fileName ||
      artifact?.document_name ||
      artifact?.documentName ||
      artifact?.name ||
      artifact?.payload?.originalFilename ||
      artifact?.payload?.original_filename ||
      artifact?.payload?.source_original_filename ||
      artifact?.payload?.sourceOriginalFilename ||
      artifact?.payload?.filename ||
      artifact?.payload?.fileName ||
      artifact?.payload?.document_name ||
      artifact?.payload?.documentName ||
      artifact?.payload?.name ||
      ""
  ).trim();
}

function getArtifactFileId(artifact) {
  return String(
    artifact?.fileId ??
      artifact?.file_id ??
      artifact?.uploadedFileId ??
      artifact?.uploaded_file_id ??
      artifact?.payload?.fileId ??
      artifact?.payload?.file_id ??
      artifact?.payload?.uploadedFileId ??
      artifact?.payload?.uploaded_file_id ??
      artifact?.payload?.source_file_id ??
      artifact?.payload?.sourceFileId ??
      artifact?.payload?.source_fileId ??
      artifact?.id ??
      ""
  ).trim();
}

function getArtifactMimeType(artifact) {
  return String(
    artifact?.mimeType ||
      artifact?.mime_type ||
      artifact?.mime ||
      artifact?.payload?.mimeType ||
      artifact?.payload?.mime_type ||
      artifact?.payload?.mime ||
      ""
  ).trim().toLowerCase();
}

function isSpreadsheetMimeType(mimeType) {
  const normalized = String(mimeType || "").trim().toLowerCase();
  return (
    normalized.includes("spreadsheet") ||
    normalized.includes("excel") ||
    normalized.includes("sheet") ||
    normalized.includes("xls")
  );
}

function collectArtifactTexts(file, artifacts) {
  const texts = [];
  const push = (value) => {
    const text = String(value ?? "").trim();
    if (text) texts.push(text);
  };

  push(file?.source_text);
  push(file?.raw_text);
  push(file?.notes);
  push(file?.loan_terms_text);
  push(file?.extracted_text);
  push(file?.text);
  push(file?.excerpt);
  push(file?.document_text_extracted);
  push(file?.payload?.text);
  push(file?.payload?.excerpt);
  push(file?.payload?.document_text_extracted);

  for (const artifact of artifacts) {
    push(artifact?.source_text);
    push(artifact?.raw_text);
    push(artifact?.notes);
    push(artifact?.loan_terms_text);
    push(artifact?.extracted_text);
    push(artifact?.text);
    push(artifact?.excerpt);
    push(artifact?.document_text_extracted);
    push(artifact?.payload?.source_text);
    push(artifact?.payload?.raw_text);
    push(artifact?.payload?.notes);
    push(artifact?.payload?.loan_terms_text);
    push(artifact?.payload?.extracted_text);
    push(artifact?.payload?.text);
    push(artifact?.payload?.excerpt);
    push(artifact?.payload?.document_text_extracted);
  }

  return texts.join("\n");
}

function extractEvidenceText(file, artifacts) {
  return normalizeText(collectArtifactTexts(file, artifacts));
}

function extractFirstMatchNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (!match) continue;
    const raw = match[1] ?? match[0];
    const normalized = String(raw).replace(/[$,]/g, "").trim();
    const value = Number(normalized);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function extractMoney(text, patterns) {
  const value = extractFirstMatchNumber(text, patterns);
  return Number.isFinite(value) ? value : null;
}

function extractPercentFraction(text, patterns) {
  const value = extractFirstMatchNumber(text, patterns);
  if (!Number.isFinite(value)) return null;
  return value / 100;
}

function extractYears(text, patterns) {
  const value = extractFirstMatchNumber(text, patterns);
  return Number.isFinite(value) ? value : null;
}

function extractDate(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (match && match[1]) return String(match[1]).trim();
  }
  return null;
}

function collectAcceptedSupportDocTruth(artifacts = []) {
  const truth = {
    semanticDocRole: null,
    debtBasis: null,
    semanticDocDisplayLabel: null,
    hasPurchaseAssumptions: false,
    hasCurrentDebt: false,
  };
  for (const artifact of toArray(artifacts)) {
    if (!artifact || typeof artifact !== "object") continue;
    const semanticDocRole = String(artifact?.semantic_doc_role ?? artifact?.payload?.semantic_doc_role ?? "").trim().toLowerCase();
    const debtBasis = String(artifact?.debt_basis ?? artifact?.payload?.debt_basis ?? "").trim().toLowerCase();
    const semanticDocDisplayLabel = String(
      artifact?.semantic_doc_display_label ??
        artifact?.payload?.semantic_doc_display_label ??
        artifact?.document_role_label ??
        artifact?.payload?.document_role_label ??
        ""
    ).trim();
    if (!truth.semanticDocRole && semanticDocRole) truth.semanticDocRole = semanticDocRole;
    if (!truth.debtBasis && debtBasis) truth.debtBasis = debtBasis;
    if (!truth.semanticDocDisplayLabel && semanticDocDisplayLabel) truth.semanticDocDisplayLabel = semanticDocDisplayLabel;
    if (
      semanticDocRole === "purchase_assumptions" ||
      debtBasis === "acquisition_financing_assumption" ||
      /purchase assumptions|proposed acquisition financing/i.test(semanticDocDisplayLabel)
    ) {
      truth.hasPurchaseAssumptions = true;
    }
    if (
      semanticDocRole === "current_debt" ||
      semanticDocRole === "current_debt_context" ||
      semanticDocRole === "current_mortgage_statement" ||
      semanticDocRole === "current_debt_terms" ||
      semanticDocRole === "mortgage_statement" ||
      debtBasis === "current_debt" ||
      debtBasis === "current_debt_context" ||
      /current debt|current mortgage|debt statement/i.test(semanticDocDisplayLabel)
    ) {
      truth.hasCurrentDebt = true;
    }
  }
  return truth;
}

function cloneStructuredValue(value) {
  if (Array.isArray(value)) return value.map((item) => cloneStructuredValue(item));
  if (value && typeof value === "object") {
    const cloned = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      cloned[key] = cloneStructuredValue(nestedValue);
    }
    return cloned;
  }
  return value;
}

function readStructuredValueFromRoots(roots, path) {
  for (const root of roots) {
    let current = root;
    let matched = true;
    for (const segment of path) {
      if (current == null || typeof current !== "object" || !(segment in current)) {
        matched = false;
        break;
      }
      current = current[segment];
    }
    if (matched && current !== undefined && current !== null) return cloneStructuredValue(current);
  }
  return null;
}

function readStructuredArtifactValue(artifacts, pathOptions) {
  for (const artifact of artifacts) {
    const roots = [artifact, artifact?.payload];
    for (const path of pathOptions) {
      const value = readStructuredValueFromRoots(roots, path);
      if (value !== null) return value;
    }
  }
  return null;
}

function toFiniteNumber(value) {
  const normalized = String(value ?? "").replace(/[$,\s]/g, "").trim();
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function normalizeStructuredLineItem(entry) {
  if (!entry || typeof entry !== "object") return null;
  const label = String(
    entry.label ??
      entry.line_label ??
      entry.lineLabel ??
      entry.name ??
      entry.description ??
      entry.category ??
      ""
  ).trim();
  const amount = toFiniteNumber(
    entry.amount ??
      entry.value ??
      entry.total ??
      entry.annual_amount ??
      entry.annualAmount ??
      entry.monthly_amount ??
      entry.monthlyAmount
  );
  if (!label || !Number.isFinite(amount)) return null;
  return { label, amount };
}

function normalizeStructuredUnitMixRow(entry) {
  if (!entry || typeof entry !== "object") return null;
  const rawLabel = String(
    entry.label ??
      entry.unit_label ??
      entry.unitLabel ??
      entry.unit_type ??
      entry.unitType ??
      entry.type ??
      entry.bedroom_type ??
      entry.bedroomType ??
      entry.bedrooms ??
      entry.bedroom_count ??
      ""
  ).trim();
  const label = rawLabel
    ? /^\d+$/.test(rawLabel)
      ? `${rawLabel}BR`
      : rawLabel
    : "";
  const count = toFiniteNumber(entry.count ?? entry.unit_count ?? entry.units ?? entry.quantity);
  const inPlace = toFiniteNumber(
    entry.current_rent ??
      entry.currentRent ??
      entry.in_place_rent ??
      entry.inPlaceRent ??
      entry.inplace_rent ??
      entry.inPlace ??
      entry.rent
  );
  const market = toFiniteNumber(entry.market_rent ?? entry.marketRent ?? entry.market_rent_monthly ?? entry.marketRentMonthly);
  const gap = toFiniteNumber(entry.gap ?? entry.rent_gap ?? entry.monthly_rent_gap ?? entry.monthlyRentGap);
  if (!label && !Number.isFinite(count) && !Number.isFinite(inPlace) && !Number.isFinite(market) && !Number.isFinite(gap)) return null;
  const normalizedGap = Number.isFinite(gap) ? gap : Number.isFinite(inPlace) && Number.isFinite(market) ? market - inPlace : null;
  return {
    label: label || "Unit Mix",
    count: Number.isFinite(count) ? count : null,
    inPlace: Number.isFinite(inPlace) ? inPlace : null,
    market: Number.isFinite(market) ? market : null,
    gap: Number.isFinite(normalizedGap) ? normalizedGap : null,
  };
}

function deriveStructuredUnitMixRowsFromUnits(units) {
  const rows = [];
  const groups = new Map();
  for (const unit of toArray(units)) {
    if (!unit || typeof unit !== "object") continue;
    const rawLabel = String(
      unit.label ??
        unit.unit_label ??
        unit.unitLabel ??
        unit.unit_type ??
        unit.unitType ??
        unit.type ??
        unit.bedroom_type ??
        unit.bedroomType ??
        unit.bedrooms ??
        unit.bedroom_count ??
        ""
    ).trim();
    const label = rawLabel
      ? /^\d+$/.test(rawLabel)
        ? `${rawLabel}BR`
        : rawLabel
      : "";
    const key = label || String(unit.unit_number ?? unit.unitNumber ?? unit.id ?? groups.size);
    const group = groups.get(key) || { label: label || "Unit Mix", count: 0, inPlace: null, market: null, gap: null };
    group.count += 1;
    const inPlace = toFiniteNumber(
      unit.current_rent ??
        unit.currentRent ??
        unit.in_place_rent ??
        unit.inPlaceRent ??
        unit.inplace_rent ??
        unit.rent
    );
    const market = toFiniteNumber(unit.market_rent ?? unit.marketRent ?? unit.market_rent_monthly ?? unit.marketRentMonthly);
    const gap = toFiniteNumber(unit.gap ?? unit.rent_gap ?? unit.monthly_rent_gap ?? unit.monthlyRentGap);
    if (!Number.isFinite(group.inPlace) && Number.isFinite(inPlace)) group.inPlace = inPlace;
    if (!Number.isFinite(group.market) && Number.isFinite(market)) group.market = market;
    if (!Number.isFinite(group.gap) && Number.isFinite(gap)) group.gap = gap;
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    if (!Number.isFinite(group.gap) && Number.isFinite(group.inPlace) && Number.isFinite(group.market)) {
      group.gap = group.market - group.inPlace;
    }
    rows.push({
      label: group.label,
      count: Number.isFinite(group.count) ? group.count : null,
      inPlace: Number.isFinite(group.inPlace) ? group.inPlace : null,
      market: Number.isFinite(group.market) ? group.market : null,
      gap: Number.isFinite(group.gap) ? group.gap : null,
    });
  }
  return rows;
}

function buildStructuredT12Facts(artifacts) {
  const facts = {};
  const incomeLines = readStructuredArtifactValue(artifacts, [
    ["income_lines"],
    ["t12_parsed", "income_lines"],
    ["payload", "income_lines"],
    ["payload", "t12_parsed", "income_lines"],
  ]);
  const expenseLines = readStructuredArtifactValue(artifacts, [
    ["expense_lines"],
    ["t12_parsed", "expense_lines"],
    ["payload", "expense_lines"],
    ["payload", "t12_parsed", "expense_lines"],
  ]);
  const egi = readStructuredArtifactValue(artifacts, [
    ["effective_gross_income"],
    ["effectiveGrossIncome"],
    ["egi"],
    ["payload", "effective_gross_income"],
    ["payload", "effectiveGrossIncome"],
    ["payload", "egi"],
    ["t12_parsed", "effective_gross_income"],
    ["t12_parsed", "effectiveGrossIncome"],
    ["t12_parsed", "egi"],
    ["payload", "t12_parsed", "effective_gross_income"],
    ["payload", "t12_parsed", "effectiveGrossIncome"],
    ["payload", "t12_parsed", "egi"],
  ]);
  const totalExpenses = readStructuredArtifactValue(artifacts, [
    ["total_operating_expenses"],
    ["totalOperatingExpenses"],
    ["opEx"],
    ["opex"],
    ["payload", "total_operating_expenses"],
    ["payload", "totalOperatingExpenses"],
    ["payload", "opEx"],
    ["payload", "opex"],
    ["t12_parsed", "total_operating_expenses"],
    ["t12_parsed", "totalOperatingExpenses"],
    ["t12_parsed", "opEx"],
    ["t12_parsed", "opex"],
    ["payload", "t12_parsed", "total_operating_expenses"],
    ["payload", "t12_parsed", "totalOperatingExpenses"],
    ["payload", "t12_parsed", "opEx"],
    ["payload", "t12_parsed", "opex"],
  ]);
  const noi = readStructuredArtifactValue(artifacts, [
    ["net_operating_income"],
    ["netOperatingIncome"],
    ["noi"],
    ["payload", "net_operating_income"],
    ["payload", "netOperatingIncome"],
    ["payload", "noi"],
    ["t12_parsed", "net_operating_income"],
    ["t12_parsed", "netOperatingIncome"],
    ["t12_parsed", "noi"],
    ["payload", "t12_parsed", "net_operating_income"],
    ["payload", "t12_parsed", "netOperatingIncome"],
    ["payload", "t12_parsed", "noi"],
  ]);
  const gpr = readStructuredArtifactValue(artifacts, [
    ["gross_potential_rent"],
    ["grossPotentialRent"],
    ["gpr"],
    ["payload", "gross_potential_rent"],
    ["payload", "grossPotentialRent"],
    ["payload", "gpr"],
    ["t12_parsed", "gross_potential_rent"],
    ["t12_parsed", "grossPotentialRent"],
    ["t12_parsed", "gpr"],
    ["payload", "t12_parsed", "gross_potential_rent"],
    ["payload", "t12_parsed", "grossPotentialRent"],
    ["payload", "t12_parsed", "gpr"],
  ]);
  if (Array.isArray(incomeLines) && incomeLines.length) facts.income_lines = incomeLines.map(normalizeStructuredLineItem).filter(Boolean);
  if (Array.isArray(expenseLines) && expenseLines.length) facts.expense_lines = expenseLines.map(normalizeStructuredLineItem).filter(Boolean);
  if (Number.isFinite(toFiniteNumber(egi))) facts.effective_gross_income = toFiniteNumber(egi);
  if (Number.isFinite(toFiniteNumber(totalExpenses))) facts.total_operating_expenses = toFiniteNumber(totalExpenses);
  if (Number.isFinite(toFiniteNumber(noi))) facts.net_operating_income = toFiniteNumber(noi);
  if (Number.isFinite(toFiniteNumber(gpr))) facts.gross_potential_rent = toFiniteNumber(gpr);
  return facts;
}

function buildStructuredRentRollFacts(artifacts) {
  const facts = {};
  const unitMix = readStructuredArtifactValue(artifacts, [
    ["unit_mix"],
    ["unitMix"],
    ["rent_roll_parsed", "unit_mix"],
    ["rent_roll_parsed", "unitMix"],
    ["payload", "unit_mix"],
    ["payload", "unitMix"],
    ["payload", "rent_roll_parsed", "unit_mix"],
    ["payload", "rent_roll_parsed", "unitMix"],
  ]);
  const units = readStructuredArtifactValue(artifacts, [
    ["units"],
    ["rent_roll_parsed", "units"],
    ["rent_roll_parsed", "unit_rows"],
    ["rent_roll_parsed", "unitRows"],
    ["payload", "units"],
    ["payload", "rent_roll_parsed", "units"],
    ["payload", "rent_roll_parsed", "unit_rows"],
    ["payload", "rent_roll_parsed", "unitRows"],
  ]);
  const totalUnits = readStructuredArtifactValue(artifacts, [
    ["total_units"],
    ["totalUnits"],
    ["rent_roll_parsed", "total_units"],
    ["rent_roll_parsed", "totalUnits"],
    ["payload", "total_units"],
    ["payload", "totalUnits"],
    ["payload", "rent_roll_parsed", "total_units"],
    ["payload", "rent_roll_parsed", "totalUnits"],
  ]);
  const occupancy = readStructuredArtifactValue(artifacts, [
    ["occupancy"],
    ["occupancy_rate"],
    ["occupancyRate"],
    ["rent_roll_parsed", "occupancy"],
    ["rent_roll_parsed", "occupancy_rate"],
    ["rent_roll_parsed", "occupancyRate"],
    ["payload", "occupancy"],
    ["payload", "occupancy_rate"],
    ["payload", "occupancyRate"],
    ["payload", "rent_roll_parsed", "occupancy"],
    ["payload", "rent_roll_parsed", "occupancy_rate"],
    ["payload", "rent_roll_parsed", "occupancyRate"],
  ]);
  const annualInPlaceRent = readStructuredArtifactValue(artifacts, [
    ["annual_in_place_rent"],
    ["annualInPlaceRent"],
    ["in_place_rent_total"],
    ["inPlaceRentTotal"],
    ["rent_roll_parsed", "annual_in_place_rent"],
    ["rent_roll_parsed", "annualInPlaceRent"],
    ["rent_roll_parsed", "in_place_rent_total"],
    ["rent_roll_parsed", "inPlaceRentTotal"],
    ["payload", "annual_in_place_rent"],
    ["payload", "annualInPlaceRent"],
    ["payload", "in_place_rent_total"],
    ["payload", "inPlaceRentTotal"],
    ["payload", "rent_roll_parsed", "annual_in_place_rent"],
    ["payload", "rent_roll_parsed", "annualInPlaceRent"],
    ["payload", "rent_roll_parsed", "in_place_rent_total"],
    ["payload", "rent_roll_parsed", "inPlaceRentTotal"],
  ]);
  const annualMarketRent = readStructuredArtifactValue(artifacts, [
    ["annual_market_rent"],
    ["annualMarketRent"],
    ["market_rent_total"],
    ["marketRentTotal"],
    ["rent_roll_parsed", "annual_market_rent"],
    ["rent_roll_parsed", "annualMarketRent"],
    ["rent_roll_parsed", "market_rent_total"],
    ["rent_roll_parsed", "marketRentTotal"],
    ["payload", "annual_market_rent"],
    ["payload", "annualMarketRent"],
    ["payload", "market_rent_total"],
    ["payload", "marketRentTotal"],
    ["payload", "rent_roll_parsed", "annual_market_rent"],
    ["payload", "rent_roll_parsed", "annualMarketRent"],
    ["payload", "rent_roll_parsed", "market_rent_total"],
    ["payload", "rent_roll_parsed", "marketRentTotal"],
  ]);
  const normalizedUnitMix = Array.isArray(unitMix) ? unitMix.map(normalizeStructuredUnitMixRow).filter(Boolean) : [];
  const normalizedUnits = Array.isArray(units) ? deriveStructuredUnitMixRowsFromUnits(units) : [];
  if (normalizedUnitMix.length) facts.unit_mix = normalizedUnitMix;
  if (normalizedUnits.length) facts.units = cloneStructuredValue(units);
  if (Number.isFinite(toFiniteNumber(totalUnits))) facts.total_units = toFiniteNumber(totalUnits);
  else if (Array.isArray(units) && units.length) facts.total_units = units.length;
  if (Number.isFinite(toFiniteNumber(occupancy))) facts.occupancy = toFiniteNumber(occupancy);
  if (Number.isFinite(toFiniteNumber(annualInPlaceRent))) facts.annual_in_place_rent = toFiniteNumber(annualInPlaceRent);
  if (Number.isFinite(toFiniteNumber(annualMarketRent))) facts.annual_market_rent = toFiniteNumber(annualMarketRent);
  return facts;
}

function buildProvenance(file, authorityBasis, text) {
  return {
    authorityBasis,
    sourceTextPresent: Boolean(text),
    sourceTextSnippet: text ? text.slice(0, 500) : null,
    sourceAuthorityVersion: "v2",
    extractedAt: new Date().toISOString(),
  };
}

function buildExtractedFacts(role, text, artifacts = []) {
  const facts = {};
  if (role === "core_t12") {
    const structuredFacts = buildStructuredT12Facts(artifacts);
    return structuredFacts;
  }
  if (role === "core_rent_roll") {
    const structuredFacts = buildStructuredRentRollFacts(artifacts);
    return structuredFacts;
  }
  if (role === "purchase_assumptions") {
    const purchasePrice = extractMoney(text, [
      /\bpurchase price[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bproposed acquisition price[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    const noiBasis = extractMoney(text, [
      /\bnoi basis[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bnoi[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    const goingInCapRate = extractPercentFraction(text, [
      /\bgoing[-\s]*in cap(?: rate| reference)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bcap rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    const goingInCapRateFallback = extractPercentFraction(text, [
      /\bgoing[-\s]*in cap(?: rate| reference)?\s*([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bgoing[-\s]*cap(?: rate| reference)?\s*([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bgoing[-\s]*in\s*cap\s*([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bgoing[-\s]*cap\s*([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    const proposedLoanAmount = extractMoney(text, [
      /\bproposed loan amount[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bproposed acquisition loan[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bloan amount[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bloan[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    const ltv = extractPercentFraction(text, [
      /\bltv[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bloanto[-\s]*value[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    const interestRate = extractPercentFraction(text, [
      /\binterest rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\brate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    const amortizationYears = extractYears(text, [
      /\bamortization(?: years?| remaining years?)?[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
      /\bamort(?: years?)?[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
    ]);
    const lenderFeePercent = extractPercentFraction(text, [
      /\blender fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bfinancing fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\borigination fee(?: percent)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bfee[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\blender fee(?: percent)?\s+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bfinancing fee(?: percent)?\s+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\borigination fee(?: percent)?\s+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    if (purchasePrice != null) facts.purchase_price = purchasePrice;
    if (noiBasis != null) facts.noi_basis = noiBasis;
    if (goingInCapRate != null || goingInCapRateFallback != null) facts.going_in_cap_rate = goingInCapRate ?? goingInCapRateFallback;
    if (proposedLoanAmount != null) facts.proposed_loan_amount = proposedLoanAmount;
    if (ltv != null) facts.ltv = ltv;
    if (interestRate != null) facts.interest_rate = interestRate;
    if (amortizationYears != null) facts.amortization_years = amortizationYears;
    if (lenderFeePercent != null) facts.lender_fee_percent = lenderFeePercent;
    facts.has_proposed_acquisition_financing = true;
  } else if (role === "current_debt_context") {
    const outstandingBalance = extractMoney(text, [
      /\bcurrent outstanding balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bcurrent debt balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\boutstanding balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bprincipal balance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bbalance[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    const interestRate = extractPercentFraction(text, [
      /\binterest rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bnote rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
      /\bcoupon rate[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?/i,
    ]);
    const amortYears = extractYears(text, [
      /\bamortization remaining[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
      /\bamortization remaining years[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
      /\bamortization[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
    ]);
    const monthlyPayment = extractMoney(text, [
      /\bmonthly payment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bmonthly debt service[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bpayment[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    const maturityDate = extractDate(text, [
      /\bmaturity date[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
      /\bmatures?[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
    ]);
    if (outstandingBalance != null) facts.current_outstanding_balance = outstandingBalance;
    if (interestRate != null) facts.interest_rate = interestRate;
    if (amortYears != null) facts.amortization_remaining_years = amortYears;
    if (monthlyPayment != null) facts.monthly_payment = monthlyPayment;
    if (maturityDate != null) facts.maturity_date = maturityDate;
    facts.has_current_debt_context = true;
  } else if (role === "structured_renovation_capex_plan") {
    const totalRenovationBudget = extractMoney(text, [
      /\btotal renovation budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\breno budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\brenovation budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bcapex budget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bbudget[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    if (totalRenovationBudget != null) facts.total_renovation_budget = totalRenovationBudget;
    facts.has_rent_lift = /(rent lift|expected rent lift|expected monthly rent lift|monthly rent lift)/i.test(text);
    facts.has_phasing = /(phasing|implementation schedule|months?\s+\d+\s*[-–]\s*\d+)/i.test(text);
    facts.context_only = true;
  } else if (role === "appraisal_context") {
    const appraisalValue = extractMoney(text, [
      /\bappraisal value[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /\bvalue[:\s]+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ]);
    if (appraisalValue != null) facts.appraisal_value = appraisalValue;
  } else if (role === "market_survey_context") {
    facts.context_only = true;
  } else if (role === "environmental_context") {
    facts.context_only = true;
  }
  return facts;
}

function hasPositiveCurrentDebtEvidence(text) {
  if (!text) return false;
  const hasDebtContext = /(existing current debt statement|current debt context|current debt terms|current mortgage|existing mortgage|current outstanding balance|outstanding balance|principal balance|monthly payment|maturity date|amortization remaining|amortization remaining years)/i.test(text);
  const hasDebtFinanceTerms = /(interest rate|note rate|coupon rate)/i.test(text);
  return hasDebtContext && hasDebtFinanceTerms;
}

function hasStructuredRenovationEvidence(text) {
  if (!text) return false;
  const hasPlan = /(structured renovation \/ capex plan|structured forward-looking renovation|total renovation budget|renovation budget|capex plan)/i.test(text);
  const hasLift = /(rent lift|expected rent lift|expected monthly rent lift|monthly rent lift)/i.test(text);
  const hasPhasing = /(phasing|implementation schedule|months?\s+\d+\s*[-–]\s*\d+|months?\b)/i.test(text);
  return hasPlan && hasLift && hasPhasing;
}

function classifySupportDoc(file, artifacts, artifactsByFileId) {
  const fileId = getFileId(file);
  const originalFilename = getOriginalFilename(file, artifactsByFileId);
  const mimeType = getMimeType(file, artifactsByFileId);
  const text = extractEvidenceText(file, artifacts);
  const semanticRoles = toArray(artifacts)
    .map((artifact) => artifact?.semantic_doc_role ?? artifact?.payload?.semantic_doc_role ?? null)
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
  const debtBases = toArray(artifacts)
    .map((artifact) => artifact?.debt_basis ?? artifact?.payload?.debt_basis ?? null)
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  const filename = normalizeText(originalFilename).replace(/[_-]+/g, " ");
  const hasAssumptionFilename = /\bassumption(s)?\b/.test(filename);
  const hasCurrentDebtFilename = /\bcurrent[_\s-]?debt\b|\bcurrent[_\s-]?loan\b|\bmortgage\b|\bdebt statement\b/.test(filename);
  const hasT12Filename = /\bt12\b|\btrailing\b/.test(filename);
  const hasRentRollFilename = /\brent[_\s-]?roll\b|\brentroll\b/.test(filename);
  const hasRenovationFilename = /\breno\b|\brenovation\b|\bcapex\b/.test(filename);
  const hasAppraisalFilename = /\bappraisal\b/.test(filename);
  const hasMarketSurveyFilename = /\bmarket\b|\bsurvey\b/.test(filename);
  const hasEnvironmentalFilename = /(esa|phase[_\s-]?i|environmental|\bphase\b)/i.test(filename);

  const explicitSemanticRole = semanticRoles[0] || "";
  const explicitDebtBasis = debtBases[0] || "";
  const positiveCurrentDebtEvidence = hasPositiveCurrentDebtEvidence(text);
  const structuredRenovationEvidence = hasStructuredRenovationEvidence(text);
  const explicitPurchaseAssumptionsText = /(purchase assumptions|proposed acquisition financing|going[-\s]*in cap reference|proposed loan amount|lender fee)/i.test(text);
  const explicitPhaseIText = /(phase i esa|phase i environmental site assessment|environmental due diligence|phase i)/i.test(text);
  const explicitAppraisalText = /(appraisal summary|valuation context|appraisal \/ valuation|appraisal)/i.test(text);
  const explicitMarketSurveyText = /(market survey|rent survey|market rent survey)/i.test(text);
  const acceptedTruth = collectAcceptedSupportDocTruth(artifacts);
  const acceptedPurchaseAssumptionsTruth = Boolean(
    acceptedTruth.hasPurchaseAssumptions ||
    acceptedTruth.semanticDocRole === "purchase_assumptions" ||
    acceptedTruth.debtBasis === "acquisition_financing_assumption" ||
    /purchase assumptions|proposed acquisition financing/i.test(acceptedTruth.semanticDocDisplayLabel)
  );
  const acceptedCurrentDebtTruth = Boolean(
    acceptedTruth.hasCurrentDebt ||
    acceptedTruth.semanticDocRole === "current_debt" ||
    acceptedTruth.semanticDocRole === "current_debt_context" ||
    acceptedTruth.semanticDocRole === "current_mortgage_statement" ||
    acceptedTruth.semanticDocRole === "current_debt_terms" ||
    acceptedTruth.semanticDocRole === "mortgage_statement" ||
    acceptedTruth.debtBasis === "current_debt" ||
    acceptedTruth.debtBasis === "current_debt_context" ||
    /current debt|current mortgage|debt statement/i.test(acceptedTruth.semanticDocDisplayLabel)
  );
  if (hasT12Filename || (isSpreadsheetMimeType(mimeType) && explicitSemanticRole === "t12")) {
    const extractedFacts = buildExtractedFacts("core_t12", text, artifacts);
    return {
      role: "core_t12",
      roleLabel: "Core Quantitative Source — Trailing 12-Month Income Statement",
      treatment: "Primary quantitative input",
      use: "Core quantitative source; drives EGI, OpEx, NOI, and all income/expense modeling.",
      category: "Core Quantitative Input",
      authorityBasis: hasT12Filename ? "filename_heuristic" : "parser_semantic",
      sourceKind: "core_t12",
      canonicalLabel: "Core Quantitative Source — Trailing 12-Month Income Statement",
      allowedUses: ["core_quantitative_input"],
      forbiddenUses: ["support_doc"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, hasT12Filename ? "filename_heuristic" : "parser_semantic", text),
    };
  }

  if (hasRentRollFilename || (isSpreadsheetMimeType(mimeType) && explicitSemanticRole === "rent_roll")) {
    const extractedFacts = buildExtractedFacts("core_rent_roll", text, artifacts);
    return {
      role: "core_rent_roll",
      roleLabel: "Core Quantitative Source — Rent Roll",
      treatment: "Primary quantitative input",
      use: "Core quantitative source; drives unit count, occupancy, in-place rent, and market rent gap.",
      category: "Core Quantitative Input",
      authorityBasis: hasRentRollFilename ? "filename_heuristic" : "parser_semantic",
      sourceKind: "core_rent_roll",
      canonicalLabel: "Core Quantitative Source — Rent Roll",
      allowedUses: ["core_quantitative_input"],
      forbiddenUses: ["support_doc"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, hasRentRollFilename ? "filename_heuristic" : "parser_semantic", text),
    };
  }

  if (
    acceptedCurrentDebtTruth ||
    (positiveCurrentDebtEvidence && !acceptedPurchaseAssumptionsTruth) ||
    (hasCurrentDebtFilename && !acceptedPurchaseAssumptionsTruth) ||
    ((explicitSemanticRole === "current_debt" || explicitSemanticRole === "current_debt_context" || explicitDebtBasis === "current_debt" || explicitDebtBasis === "current_debt_context") && !acceptedPurchaseAssumptionsTruth)
  ) {
    const extractedFacts = buildExtractedFacts("current_debt_context", text);
    return {
      role: "current_debt_context",
      roleLabel: "Existing Debt Context — Current Mortgage / Debt Statement",
      treatment: "Debt support received / contextual",
      use: "Uploaded existing/current debt context only; not proposed acquisition financing.",
      category: "Existing Debt — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Existing Debt Context — Current Mortgage / Debt Statement",
      allowedUses: ["current_debt_context"],
      forbiddenUses: ["purchase_assumptions", "proposed_acquisition_financing_context"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      acceptedSemanticDocRole: acceptedTruth.semanticDocRole || explicitSemanticRole || "current_debt_context",
      acceptedDebtBasis: acceptedTruth.debtBasis || explicitDebtBasis || "current_debt_context",
      acceptedSemanticDocDisplayLabel: acceptedTruth.semanticDocDisplayLabel || "Existing Debt Context / Current Mortgage / Debt Statement",
      acceptedSourceTruth: {
        hasPurchaseAssumptions: acceptedPurchaseAssumptionsTruth,
        hasCurrentDebt: true,
      },
      provenance: buildProvenance(
        file,
        acceptedTruth.semanticDocRole === "current_debt" || acceptedTruth.semanticDocRole === "current_debt_context"
          ? "parser_semantic"
          : acceptedTruth.debtBasis === "current_debt" || acceptedTruth.debtBasis === "current_debt_context"
            ? "debt_basis_signal"
            : hasCurrentDebtFilename
              ? "filename_heuristic"
              : positiveCurrentDebtEvidence
                ? "keyword_match"
                : "parser_semantic",
        text
      ),
      authorityBasis:
        acceptedTruth.semanticDocRole === "current_debt" || acceptedTruth.semanticDocRole === "current_debt_context"
          ? "parser_semantic"
          : acceptedTruth.debtBasis === "current_debt" || acceptedTruth.debtBasis === "current_debt_context"
            ? "debt_basis_signal"
            : hasCurrentDebtFilename
              ? "filename_heuristic"
              : explicitSemanticRole === "current_debt" || explicitSemanticRole === "current_debt_context"
                ? "parser_semantic"
                : "keyword_match",
    };
  }

  if (
    acceptedPurchaseAssumptionsTruth ||
    ((explicitSemanticRole === "purchase_assumptions" || explicitDebtBasis === "acquisition_financing_assumption" || explicitDebtBasis === "proposed_acquisition") &&
      !acceptedCurrentDebtTruth &&
      !explicitAppraisalText &&
      !explicitMarketSurveyText &&
      !explicitPhaseIText) ||
    (hasAssumptionFilename && !acceptedCurrentDebtTruth) ||
    (explicitPurchaseAssumptionsText && !explicitAppraisalText && !explicitMarketSurveyText && !explicitPhaseIText && !acceptedCurrentDebtTruth)
  ) {
    const extractedFacts = buildExtractedFacts("purchase_assumptions", text);
    return {
      role: "purchase_assumptions",
      roleLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
      treatment: "Acquisition context received",
      use: "Proposed acquisition financing terms and purchase assumptions; not existing/current debt.",
      category: "Acquisition Assumptions — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Purchase Assumptions / Proposed Acquisition Financing Context",
      allowedUses: ["purchase_assumptions", "proposed_acquisition_financing_context"],
      forbiddenUses: ["current_debt_context"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      acceptedSemanticDocRole: acceptedTruth.semanticDocRole || explicitSemanticRole || "purchase_assumptions",
      acceptedDebtBasis: acceptedTruth.debtBasis || explicitDebtBasis || "acquisition_financing_assumption",
      acceptedSemanticDocDisplayLabel: acceptedTruth.semanticDocDisplayLabel || "Purchase Assumptions / Proposed Acquisition Financing Context",
      acceptedSourceTruth: {
        hasPurchaseAssumptions: true,
        hasCurrentDebt: acceptedCurrentDebtTruth,
      },
      provenance: buildProvenance(
        file,
        acceptedTruth.semanticDocRole === "purchase_assumptions"
          ? "parser_semantic"
          : acceptedTruth.debtBasis === "acquisition_financing_assumption"
            ? "debt_basis_signal"
            : explicitDebtBasis === "proposed_acquisition"
              ? "debt_basis_signal"
              : hasAssumptionFilename
                ? "filename_heuristic"
                : "keyword_match",
        text
      ),
      authorityBasis:
        acceptedTruth.semanticDocRole === "purchase_assumptions"
          ? "parser_semantic"
          : acceptedTruth.debtBasis === "acquisition_financing_assumption"
            ? "debt_basis_signal"
            : explicitSemanticRole === "purchase_assumptions"
              ? "parser_semantic"
              : explicitDebtBasis === "proposed_acquisition"
                ? "debt_basis_signal"
                : hasAssumptionFilename
                  ? "filename_heuristic"
                  : "keyword_match",
    };
  }

  if (
    explicitSemanticRole === "renovation_plan" ||
    hasRenovationFilename ||
    structuredRenovationEvidence
  ) {
    const extractedFacts = buildExtractedFacts("structured_renovation_capex_plan", text);
    return {
      role: "structured_renovation_capex_plan",
      roleLabel: "Structured Renovation / CapEx Plan",
      treatment: "Renovation / CapEx context received",
      use: "Structured renovation scope, CapEx budget, rent-lift assumptions, and phasing acknowledged as source-transparent context.",
      category: "Renovation / CapEx — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Structured Renovation / CapEx Plan",
      allowedUses: ["structured_renovation_capex_plan"],
      forbiddenUses: ["roi_modeling", "payback_modeling", "value_modeling", "advanced_underwriting_returns"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, explicitSemanticRole === "renovation_plan" ? "parser_semantic" : hasRenovationFilename ? "filename_heuristic" : "keyword_match", text),
      authorityBasis: explicitSemanticRole === "renovation_plan" ? "parser_semantic" : hasRenovationFilename ? "filename_heuristic" : "keyword_match",
    };
  }

  if (explicitSemanticRole === "appraisal" || hasAppraisalFilename || explicitAppraisalText) {
    const extractedFacts = buildExtractedFacts("appraisal_context", text);
    return {
      role: "appraisal_context",
      roleLabel: "Appraisal / Valuation Context",
      treatment: "Appraisal context received",
      use: "Third-party appraisal or valuation context; does not override T12 NOI, Rent Roll market rent, or cap-rate value framework.",
      category: "Appraisal — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Appraisal / Valuation Context",
      allowedUses: ["appraisal_context"],
      forbiddenUses: ["purchase_assumptions", "t12_override", "rent_roll_override"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, explicitSemanticRole === "appraisal" ? "parser_semantic" : "filename_heuristic", text),
      authorityBasis: explicitSemanticRole === "appraisal" ? "parser_semantic" : "filename_heuristic",
    };
  }

  if (explicitSemanticRole === "market_survey" || hasMarketSurveyFilename || explicitMarketSurveyText) {
    const extractedFacts = buildExtractedFacts("market_survey_context", text);
    return {
      role: "market_survey_context",
      roleLabel: "Market Rent Survey Context",
      treatment: "Market context received",
      use: "Market rent survey context; corroborates or informs rent gap analysis but does not override Rent Roll market rent inputs.",
      category: "Market Survey — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Market Rent Survey Context",
      allowedUses: ["market_survey_context"],
      forbiddenUses: ["rent_roll_override"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, explicitSemanticRole === "market_survey" ? "parser_semantic" : "filename_heuristic", text),
      authorityBasis: explicitSemanticRole === "market_survey" ? "parser_semantic" : "filename_heuristic",
    };
  }

  if (
    explicitSemanticRole === "phase_i_esa" ||
    explicitSemanticRole === "environmental" ||
    hasEnvironmentalFilename ||
    explicitPhaseIText
  ) {
    const extractedFacts = buildExtractedFacts("environmental_context", text);
    return {
      role: "environmental_context",
      roleLabel: "Environmental Due Diligence / Phase I ESA Context",
      treatment: "Environmental context received",
      use: "Phase I Environmental Site Assessment or environmental due diligence context; not a property tax document.",
      category: "Environmental — Contextual",
      sourceKind: "support_doc",
      canonicalLabel: "Environmental Due Diligence / Phase I ESA Context",
      allowedUses: ["environmental_context"],
      forbiddenUses: ["property_tax_support", "quantitative_model_input"],
      extractedFacts,
      sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
      sourceAuthorityVersion: "v2",
      provenance: buildProvenance(file, explicitSemanticRole === "phase_i_esa" || explicitSemanticRole === "environmental" ? "parser_semantic" : "filename_heuristic", text),
      authorityBasis: explicitSemanticRole === "phase_i_esa" || explicitSemanticRole === "environmental" ? "parser_semantic" : "filename_heuristic",
    };
  }

  return {
    role: "other_support",
    roleLabel: "Other Support Document",
    treatment: "Context only",
    use: "Listed for auditability only; not used quantitatively.",
    category: "Listed but Not Quantitatively Modeled",
    sourceKind: "support_doc",
    canonicalLabel: "Other Support Document",
    allowedUses: [],
    forbiddenUses: ["quantitative_model_input"],
    extractedFacts: {},
    sourceEvidence: { filename: originalFilename || null, textSnippet: text ? text.slice(0, 500) : null },
    sourceAuthorityVersion: "v2",
    provenance: buildProvenance(file, "filename_heuristic", text),
    authorityBasis: "filename_heuristic",
  };
}

export function buildCanonicalSourcePackage(uploadedFiles, parsedArtifacts) {
  const files = toArray(uploadedFiles).filter((file) => file && typeof file === "object");
  const artifacts = toArray(parsedArtifacts).filter((artifact) => artifact && typeof artifact === "object");
  const artifactsByFileId = new Map();
  const seenFileIds = new Set();

  for (const artifact of artifacts) {
    const fileId = getArtifactFileId(artifact);
    if (!fileId) continue;
    const bucket = artifactsByFileId.get(fileId) || [];
    bucket.push(artifact);
    artifactsByFileId.set(fileId, bucket);
  }

  const supportDocs = new Map();
  let coreT12 = null;
  let coreRentRoll = null;

  for (const file of files) {
    const fileId = getFileId(file);
    if (!fileId) continue;
    seenFileIds.add(fileId);
    const fileArtifacts = artifactsByFileId.get(fileId) || [];
    const authority = classifySupportDoc(file, fileArtifacts, artifactsByFileId);
    const originalFilename = getOriginalFilename(file, artifactsByFileId);

    if (authority.role === "core_t12") {
      coreT12 = {
        fileId,
        originalFilename,
        sourceKind: "core_t12",
        canonicalRole: "core_t12",
        canonicalLabel: authority.canonicalLabel,
        roleLabel: authority.roleLabel,
        treatment: authority.treatment,
        use: authority.use,
        category: authority.category,
        allowedUses: authority.allowedUses,
        forbiddenUses: authority.forbiddenUses,
        extractedFacts: authority.extractedFacts || {},
        sourceEvidence: authority.sourceEvidence || null,
        sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
        provenance: authority.provenance || null,
        role: "core_t12",
      };
      continue;
    }

    if (authority.role === "core_rent_roll") {
      coreRentRoll = {
        fileId,
        originalFilename,
        sourceKind: "core_rent_roll",
        canonicalRole: "core_rent_roll",
        canonicalLabel: authority.canonicalLabel,
        roleLabel: authority.roleLabel,
        treatment: authority.treatment,
        use: authority.use,
        category: authority.category,
        allowedUses: authority.allowedUses,
        forbiddenUses: authority.forbiddenUses,
        extractedFacts: authority.extractedFacts || {},
        sourceEvidence: authority.sourceEvidence || null,
        sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
        provenance: authority.provenance || null,
        role: "core_rent_roll",
      };
      continue;
    }

    supportDocs.set(fileId, {
      fileId,
      originalFilename,
      sourceKind: authority.sourceKind || "support_doc",
      canonicalRole: authority.role,
      canonicalLabel: authority.canonicalLabel || authority.roleLabel,
      roleLabel: authority.roleLabel,
      treatment: authority.treatment,
      use: authority.use,
      category: authority.category,
      allowedUses: authority.allowedUses || [],
      forbiddenUses: authority.forbiddenUses || [],
      extractedFacts: authority.extractedFacts || {},
      sourceEvidence: authority.sourceEvidence || null,
      sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
      provenance: authority.provenance || null,
      authorityBasis: authority.authorityBasis,
      acceptedSemanticDocRole: authority.acceptedSemanticDocRole || null,
      acceptedDebtBasis: authority.acceptedDebtBasis || null,
      acceptedSemanticDocDisplayLabel: authority.acceptedSemanticDocDisplayLabel || null,
      acceptedSourceTruth: authority.acceptedSourceTruth || null,
    });
  }

  for (const [fileId, fileArtifacts] of artifactsByFileId.entries()) {
    if (!fileId || seenFileIds.has(fileId)) continue;
    const primaryArtifact = fileArtifacts[0] || null;
    const originalFilename = getArtifactOriginalFilename(primaryArtifact);
    if (!originalFilename) continue;
    const syntheticFile = {
      fileId,
      id: fileId,
      originalFilename,
      mimeType: getArtifactMimeType(primaryArtifact),
      source_text: primaryArtifact?.source_text || primaryArtifact?.sourceText || primaryArtifact?.payload?.source_text || primaryArtifact?.payload?.sourceText || "",
      raw_text: primaryArtifact?.raw_text || primaryArtifact?.rawText || primaryArtifact?.payload?.raw_text || primaryArtifact?.payload?.rawText || "",
      notes: primaryArtifact?.notes || primaryArtifact?.payload?.notes || "",
      loan_terms_text: primaryArtifact?.loan_terms_text || primaryArtifact?.loanTermsText || primaryArtifact?.payload?.loan_terms_text || primaryArtifact?.payload?.loanTermsText || "",
      extracted_text: primaryArtifact?.extracted_text || primaryArtifact?.extractedText || primaryArtifact?.payload?.extracted_text || primaryArtifact?.payload?.extractedText || "",
      text: primaryArtifact?.text || primaryArtifact?.payload?.text || "",
      excerpt: primaryArtifact?.excerpt || primaryArtifact?.payload?.excerpt || "",
      document_text_extracted:
        primaryArtifact?.document_text_extracted ||
        primaryArtifact?.documentTextExtracted ||
        primaryArtifact?.payload?.document_text_extracted ||
        primaryArtifact?.payload?.documentTextExtracted ||
        "",
    };
    const authority = classifySupportDoc(syntheticFile, fileArtifacts, artifactsByFileId);
    if (authority.role === "core_t12") {
      if (!coreT12) {
        coreT12 = {
          fileId,
          originalFilename,
          sourceKind: "core_t12",
          canonicalRole: "core_t12",
          canonicalLabel: authority.canonicalLabel,
          roleLabel: authority.roleLabel,
          treatment: authority.treatment,
          use: authority.use,
          category: authority.category,
          allowedUses: authority.allowedUses,
          forbiddenUses: authority.forbiddenUses,
          extractedFacts: authority.extractedFacts || {},
          sourceEvidence: authority.sourceEvidence || null,
          sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
          provenance: authority.provenance || null,
          role: "core_t12",
        };
      }
      continue;
    }
    if (authority.role === "core_rent_roll") {
      if (!coreRentRoll) {
        coreRentRoll = {
          fileId,
          originalFilename,
          sourceKind: "core_rent_roll",
          canonicalRole: "core_rent_roll",
          canonicalLabel: authority.canonicalLabel,
          roleLabel: authority.roleLabel,
          treatment: authority.treatment,
          use: authority.use,
          category: authority.category,
          allowedUses: authority.allowedUses,
          forbiddenUses: authority.forbiddenUses,
          extractedFacts: authority.extractedFacts || {},
          sourceEvidence: authority.sourceEvidence || null,
          sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
          provenance: authority.provenance || null,
          role: "core_rent_roll",
        };
      }
      continue;
    }
    if (!supportDocs.has(fileId)) {
        supportDocs.set(fileId, {
          fileId,
          originalFilename,
          sourceKind: authority.sourceKind || "support_doc",
          canonicalRole: authority.role,
        canonicalLabel: authority.canonicalLabel || authority.roleLabel,
        roleLabel: authority.roleLabel,
        treatment: authority.treatment,
        use: authority.use,
        category: authority.category,
        allowedUses: authority.allowedUses || [],
        forbiddenUses: authority.forbiddenUses || [],
          extractedFacts: authority.extractedFacts || {},
          sourceEvidence: authority.sourceEvidence || null,
          sourceAuthorityVersion: authority.sourceAuthorityVersion || "v2",
          provenance: authority.provenance || null,
          authorityBasis: authority.authorityBasis,
          acceptedSemanticDocRole: authority.acceptedSemanticDocRole || null,
          acceptedDebtBasis: authority.acceptedDebtBasis || null,
          acceptedSemanticDocDisplayLabel: authority.acceptedSemanticDocDisplayLabel || null,
          acceptedSourceTruth: authority.acceptedSourceTruth || null,
        });
      }
  }

  return {
    coreT12,
    coreRentRoll,
    supportDocs,
    authorityVersion: "v2",
  };
}
