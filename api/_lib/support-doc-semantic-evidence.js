function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeEvidenceText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\u2060\ufeff\ufffe\uffff]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r\n?/g, "\n")
    .trim();
}

function isNegatedReference(source, index, matchLength) {
  const start = Math.max(
    source.lastIndexOf(".", index - 1),
    source.lastIndexOf(";", index - 1),
    source.lastIndexOf("\n", index - 1)
  ) + 1;
  const periodEnd = source.indexOf(".", index);
  const semicolonEnd = source.indexOf(";", index);
  const newlineEnd = source.indexOf("\n", index);
  const ends = [periodEnd, semicolonEnd, newlineEnd].filter((value) => value >= 0);
  const end = ends.length > 0 ? Math.min(...ends) : source.length;
  const prefix = source.slice(Math.max(start, index - 100), index).toLowerCase();
  const crossPunctuationPrefix = source.slice(Math.max(0, index - 160), index).toLowerCase();
  const full = source.slice(start, end).toLowerCase();
  const matchedText = source.slice(index, index + matchLength).toLowerCase();
  return (
    /(?:\bnot\b|\bno\b|\bnever\b|\bwithout\b|\bseparate\s+from\b|\bdo\s+not\b|\bdoes\s+not\b|\bshould\s+not\b|\bcannot\b|\bcan\s+not\b)[^.;\n]{0,100}$/.test(prefix) ||
    /(?:separate\s+from|do\s+not|does\s+not|should\s+not|not\s+to\s+be\s+used\s+as)[^\n]{0,140}$/.test(crossPunctuationPrefix) ||
    new RegExp(`(?:do\\s+not|does\\s+not|should\\s+not|not|never|separate\\s+from)[^.;\\n]{0,80}${matchedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(full)
  );
}

export function hasAffirmativeSemanticPhrase(value, patterns = []) {
  const source = normalizeEvidenceText(value);
  if (!source) return false;
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    for (const match of source.matchAll(matcher)) {
      if (!isNegatedReference(source, match.index || 0, match[0].length)) return true;
    }
  }
  return false;
}

function collectSemanticMatches(value, patterns = []) {
  const source = normalizeEvidenceText(value);
  const matches = [];
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    for (const match of source.matchAll(matcher)) {
      const index = match.index || 0;
      const negated = isNegatedReference(source, index, match[0].length);
      matches.push({
        text: match[0],
        index,
        negated,
        excerpt: source.slice(Math.max(0, index - 80), Math.min(source.length, index + match[0].length + 120)).trim(),
      });
    }
  }
  return matches;
}

const SUPPORT_FAMILY_PATTERNS = Object.freeze({
  acquisition_financing: [
    /purchase assumptions/i,
    /proposed acquisition financing/i,
    /proposed acquisition loan/i,
    /proposed loan(?: amount)?/i,
    /purchase price/i,
    /loan[-\s]*to[-\s]*value/i,
    /\bltv\b/i,
  ],
  current_debt: [
    /existing current debt/i,
    /current mortgage/i,
    /current outstanding balance/i,
    /current loan balance/i,
    /unpaid principal balance/i,
    /monthly debt service/i,
  ],
  appraisal: [
    /appraisal(?: summary| report| context)?/i,
    /appraised value/i,
    /opinion of value/i,
    /valuation report/i,
  ],
  market_survey: [
    /market rent survey/i,
    /market survey/i,
    /rent survey/i,
    /rent comparables?/i,
  ],
  property_condition: [
    /property condition assessment/i,
    /physical needs assessment/i,
    /capital needs assessment/i,
    /building condition assessment/i,
    /building condition report/i,
    /replacement reserve study/i,
    /capital reserve study/i,
  ],
  historical_capital: [
    /historical capex/i,
    /historical capital expenditures?/i,
    /completed capital improvements?/i,
    /completed repairs?/i,
    /prior capital improvements?/i,
  ],
  renovation: [
    /renovation(?: plan| budget| scope)?/i,
    /\bcapex\b/i,
    /capital expenditure/i,
    /scope of work/i,
    /unit turns?/i,
  ],
  environmental: [
    /phase\s*(?:i|1)\s*(?:esa|environmental site assessment)?/i,
    /environmental due diligence/i,
    /recognized environmental condition/i,
    /site assessment/i,
  ],
  property_tax: [
    /property tax/i,
    /tax bill/i,
    /tax notice/i,
    /assessment roll/i,
    /roll number/i,
  ],
  historical_debt: [
    /discharged mortgage/i,
    /paid[-\s]*off (?:loan|mortgage|debt)/i,
    /historical debt/i,
    /former mortgage/i,
  ],
});

export function evaluateSupportDocumentSemanticFamilies(value) {
  const source = normalizeEvidenceText(value);
  const families = {};
  for (const [family, patterns] of Object.entries(SUPPORT_FAMILY_PATTERNS)) {
    const matches = collectSemanticMatches(source, patterns);
    const affirmative = matches.filter((match) => !match.negated);
    const negated = matches.filter((match) => match.negated);
    families[family] = {
      family,
      score: affirmative.length,
      affirmative,
      negated,
      hasAffirmativeEvidence: affirmative.length > 0,
      hasOnlyNegatedEvidence: affirmative.length === 0 && negated.length > 0,
    };
  }
  const rankedFamilies = Object.values(families)
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.family.localeCompare(right.family));
  return {
    sourceTextLength: source.length,
    families,
    rankedFamilies,
    affirmativeFamilyCount: rankedFamilies.length,
    isMixedFamily: rankedFamilies.length > 1,
  };
}

export function evaluateFinancingSemanticEvidence(value) {
  const source = normalizeText(value);
  const acquisitionTitle = hasAffirmativeSemanticPhrase(source, [
    /purchase assumptions\s*\/\s*proposed acquisition financing/i,
    /purchase assumptions document role/i,
    /proposed acquisition financing document role/i,
    /purchase assumptions/i,
  ]);
  const currentDebtTitle = hasAffirmativeSemanticPhrase(source, [
    /existing current debt statement/i,
    /current mortgage statement document role/i,
    /current debt context document role/i,
  ]);
  const purchasePrice = hasAffirmativeSemanticPhrase(source, [/(?:asking\s*\/\s*)?purchase price/i, /acquisition price/i]);
  const proposedLoan = hasAffirmativeSemanticPhrase(source, [/proposed acquisition loan/i, /proposed loan amount/i, /proposed loan\b/i]);
  const proposedLtv = hasAffirmativeSemanticPhrase(source, [/proposed ltv/i, /\bltv\b/i, /loan[-\s]*to[-\s]*value/i]);
  const proposedTerms = hasAffirmativeSemanticPhrase(source, [
    /proposed interest rate/i,
    /proposed amortization/i,
    /estimated interest rate/i,
    /\bamortization\b/i,
    /closing costs/i,
    /lender\s*\/\s*origination fee/i,
    /lender fee/i,
  ]);
  const currentBalance = hasAffirmativeSemanticPhrase(source, [
    /current outstanding balance/i,
    /current loan balance/i,
    /unpaid principal balance/i,
    /outstanding principal balance/i,
  ]);
  const currentTerms = hasAffirmativeSemanticPhrase(source, [
    /monthly payment/i,
    /amortization remaining/i,
    /maturity date/i,
  ]);

  const acquisitionScore =
    (acquisitionTitle ? 8 : 0) +
    (purchasePrice ? 3 : 0) +
    (proposedLoan ? 3 : 0) +
    (proposedLtv ? 2 : 0) +
    (proposedTerms ? 2 : 0);
  const currentDebtScore =
    (currentDebtTitle ? 8 : 0) +
    (currentBalance ? 4 : 0) +
    (currentTerms ? 2 : 0);

  return {
    acquisitionScore,
    currentDebtScore,
    hasAffirmativeAcquisitionEvidence: acquisitionScore >= 5,
    hasAffirmativeCurrentDebtEvidence: currentDebtScore >= 5,
    acquisitionTitle,
    currentDebtTitle,
    purchasePrice,
    proposedLoan,
    proposedLtv,
    proposedTerms,
    currentBalance,
    currentTerms,
  };
}

export function resolveFinancingParserRoute(value) {
  const evidence = evaluateFinancingSemanticEvidence(value);
  if (
    evidence.hasAffirmativeAcquisitionEvidence &&
    evidence.acquisitionScore > evidence.currentDebtScore
  ) {
    return "loan_term_sheet";
  }
  if (
    evidence.hasAffirmativeCurrentDebtEvidence &&
    evidence.currentDebtScore > evidence.acquisitionScore
  ) {
    return "mortgage_statement";
  }
  return null;
}
