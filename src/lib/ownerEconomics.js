export const OWNER_ECONOMICS_STORAGE_KEY = 'investoriq-owner-economics-v2';

export const DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS = Object.freeze({
  screeningPurchases: 0,
  underwritingPurchases: 0,
  bundlePurchases: 0,

  // Stripe Canada standard online-card baseline. Additional currency conversion,
  // international-card or negotiated-rate effects remain editable assumptions.
  stripePercent: 2.9,
  stripeFixedPerCheckout: 0.30,
  stripeCurrencyConversionPercent: 0,

  // AI cost remains report-level because actual token use varies materially with
  // source quality, recovery paths and QA. Replace these zeros with observed costs
  // from controlled Screening and Underwriting generations.
  screeningAiCost: 0,
  underwritingAiCost: 0,

  // InvestorIQ uses Amazon Textract AnalyzeDocument with TABLES. AWS charges per
  // analyzed page. Enter the average pages actually sent to Textract per report.
  textractPricePerPage: 0.015,
  screeningTextractPages: 0,
  underwritingTextractPages: 0,

  screeningOtherVariableCost: 0,
  underwritingOtherVariableCost: 0,

  // Launch-planning baseline rather than today's temporary free-tier state.
  vercelMonthlyCost: 20,
  supabaseMonthlyCost: 25,
  docraptorMonthlyCost: 29,
  domainEmailMonthlyCost: 8.33,
  resendMonthlyCost: 0,
  otherMonthlyCost: 0,

  cadPerUsd: 1.40,
});

const finiteNonNegative = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
};

const integerNonNegative = (value, fallback = 0) => {
  const numeric = Math.floor(finiteNonNegative(value, fallback));
  return Number.isSafeInteger(numeric) ? numeric : fallback;
};

export function normalizeOwnerEconomicsAssumptions(value = {}) {
  return {
    screeningPurchases: integerNonNegative(value.screeningPurchases),
    underwritingPurchases: integerNonNegative(value.underwritingPurchases),
    bundlePurchases: integerNonNegative(value.bundlePurchases),

    stripePercent: finiteNonNegative(value.stripePercent, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.stripePercent),
    stripeFixedPerCheckout: finiteNonNegative(value.stripeFixedPerCheckout, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.stripeFixedPerCheckout),
    stripeCurrencyConversionPercent: finiteNonNegative(value.stripeCurrencyConversionPercent, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.stripeCurrencyConversionPercent),

    screeningAiCost: finiteNonNegative(value.screeningAiCost),
    underwritingAiCost: finiteNonNegative(value.underwritingAiCost),
    textractPricePerPage: finiteNonNegative(value.textractPricePerPage, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.textractPricePerPage),
    screeningTextractPages: finiteNonNegative(value.screeningTextractPages),
    underwritingTextractPages: finiteNonNegative(value.underwritingTextractPages),
    screeningOtherVariableCost: finiteNonNegative(value.screeningOtherVariableCost),
    underwritingOtherVariableCost: finiteNonNegative(value.underwritingOtherVariableCost),

    vercelMonthlyCost: finiteNonNegative(value.vercelMonthlyCost, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.vercelMonthlyCost),
    supabaseMonthlyCost: finiteNonNegative(value.supabaseMonthlyCost, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.supabaseMonthlyCost),
    docraptorMonthlyCost: finiteNonNegative(value.docraptorMonthlyCost, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.docraptorMonthlyCost),
    domainEmailMonthlyCost: finiteNonNegative(value.domainEmailMonthlyCost, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.domainEmailMonthlyCost),
    resendMonthlyCost: finiteNonNegative(value.resendMonthlyCost, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.resendMonthlyCost),
    otherMonthlyCost: finiteNonNegative(value.otherMonthlyCost),
    cadPerUsd: finiteNonNegative(value.cadPerUsd, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.cadPerUsd),
  };
}

export function deriveOwnerEconomics({ assumptions = {}, prices = {} } = {}) {
  const a = normalizeOwnerEconomicsAssumptions(assumptions);
  const screeningPrice = finiteNonNegative(prices.screening);
  const underwritingPrice = finiteNonNegative(prices.underwriting);
  const bundlePrice = finiteNonNegative(prices.bundle);

  const checkoutCount = a.screeningPurchases + a.underwritingPurchases + a.bundlePurchases;
  const screeningReports = a.screeningPurchases + (a.bundlePurchases * 2);
  const underwritingReports = a.underwritingPurchases + a.bundlePurchases;
  const totalReports = screeningReports + underwritingReports;

  const grossRevenue =
    (a.screeningPurchases * screeningPrice) +
    (a.underwritingPurchases * underwritingPrice) +
    (a.bundlePurchases * bundlePrice);

  const stripeEffectivePercent = a.stripePercent + a.stripeCurrencyConversionPercent;
  const stripePercentFees = grossRevenue * (stripeEffectivePercent / 100);
  const stripeFixedFees = checkoutCount * a.stripeFixedPerCheckout;
  const stripeFees = stripePercentFees + stripeFixedFees;

  const aiCosts =
    (screeningReports * a.screeningAiCost) +
    (underwritingReports * a.underwritingAiCost);

  const screeningTextractPagesTotal = screeningReports * a.screeningTextractPages;
  const underwritingTextractPagesTotal = underwritingReports * a.underwritingTextractPages;
  const textractPagesTotal = screeningTextractPagesTotal + underwritingTextractPagesTotal;
  const textractCosts = textractPagesTotal * a.textractPricePerPage;

  const otherVariableCosts =
    (screeningReports * a.screeningOtherVariableCost) +
    (underwritingReports * a.underwritingOtherVariableCost);

  const variableReportCosts = aiCosts + textractCosts + otherVariableCosts;

  const fixedMonthlyCosts =
    a.vercelMonthlyCost +
    a.supabaseMonthlyCost +
    a.docraptorMonthlyCost +
    a.domainEmailMonthlyCost +
    a.resendMonthlyCost +
    a.otherMonthlyCost;

  const netMonthlyContribution = grossRevenue - stripeFees - variableReportCosts - fixedMonthlyCosts;
  const netMarginPercent = grossRevenue > 0 ? (netMonthlyContribution / grossRevenue) * 100 : null;
  const annualizedRevenue = grossRevenue * 12;
  const annualizedNetContribution = netMonthlyContribution * 12;
  const grossRevenueCad = grossRevenue * a.cadPerUsd;
  const netMonthlyContributionCad = netMonthlyContribution * a.cadPerUsd;

  return {
    assumptions: a,
    prices: { screening: screeningPrice, underwriting: underwritingPrice, bundle: bundlePrice },
    checkoutCount,
    screeningReports,
    underwritingReports,
    totalReports,
    grossRevenue,
    stripeEffectivePercent,
    stripePercentFees,
    stripeFixedFees,
    stripeFees,
    aiCosts,
    screeningTextractPagesTotal,
    underwritingTextractPagesTotal,
    textractPagesTotal,
    textractCosts,
    otherVariableCosts,
    variableReportCosts,
    fixedMonthlyCosts,
    netMonthlyContribution,
    netMarginPercent,
    annualizedRevenue,
    annualizedNetContribution,
    grossRevenueCad,
    netMonthlyContributionCad,
  };
}
