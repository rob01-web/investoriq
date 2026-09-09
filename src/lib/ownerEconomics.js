export const OWNER_ECONOMICS_STORAGE_KEY = 'investoriq-owner-economics-v1';

export const DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS = Object.freeze({
  screeningPurchases: 0,
  underwritingPurchases: 0,
  bundlePurchases: 0,
  stripePercent: 2.9,
  stripeFixedPerCheckout: 0.30,
  screeningVariableCost: 0,
  underwritingVariableCost: 0,
  vercelMonthlyCost: 0,
  supabaseMonthlyCost: 0,
  docraptorMonthlyCost: 0,
  domainEmailMonthlyCost: 0,
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
    screeningVariableCost: finiteNonNegative(value.screeningVariableCost),
    underwritingVariableCost: finiteNonNegative(value.underwritingVariableCost),
    vercelMonthlyCost: finiteNonNegative(value.vercelMonthlyCost),
    supabaseMonthlyCost: finiteNonNegative(value.supabaseMonthlyCost),
    docraptorMonthlyCost: finiteNonNegative(value.docraptorMonthlyCost),
    domainEmailMonthlyCost: finiteNonNegative(value.domainEmailMonthlyCost),
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

  const stripePercentFees = grossRevenue * (a.stripePercent / 100);
  const stripeFixedFees = checkoutCount * a.stripeFixedPerCheckout;
  const stripeFees = stripePercentFees + stripeFixedFees;

  const variableReportCosts =
    (screeningReports * a.screeningVariableCost) +
    (underwritingReports * a.underwritingVariableCost);

  const fixedMonthlyCosts =
    a.vercelMonthlyCost +
    a.supabaseMonthlyCost +
    a.docraptorMonthlyCost +
    a.domainEmailMonthlyCost +
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
    stripePercentFees,
    stripeFixedFees,
    stripeFees,
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
