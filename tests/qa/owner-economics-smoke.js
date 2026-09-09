import assert from 'node:assert/strict';
import {
  DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS,
  deriveOwnerEconomics,
  normalizeOwnerEconomicsAssumptions,
} from '../../src/lib/ownerEconomics.js';

const prices = {
  screening: 199,
  underwriting: 499,
  bundle: 699,
};

const scenario = deriveOwnerEconomics({
  prices,
  assumptions: {
    ...DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS,
    screeningPurchases: 3,
    underwritingPurchases: 2,
    bundlePurchases: 1,
    stripePercent: 2.9,
    stripeFixedPerCheckout: 0.30,
    stripeCurrencyConversionPercent: 2,
    screeningAiCost: 1.25,
    underwritingAiCost: 3.75,
    textractPricePerPage: 0.015,
    screeningTextractPages: 20,
    underwritingTextractPages: 30,
    screeningOtherVariableCost: 0.25,
    underwritingOtherVariableCost: 0.50,
    vercelMonthlyCost: 20,
    supabaseMonthlyCost: 25,
    docraptorMonthlyCost: 15,
    domainEmailMonthlyCost: 8.33,
    resendMonthlyCost: 4,
    otherMonthlyCost: 10,
    cadPerUsd: 1.40,
  },
});

assert.equal(scenario.checkoutCount, 6);
assert.equal(scenario.screeningReports, 5);
assert.equal(scenario.underwritingReports, 3);
assert.equal(scenario.totalReports, 8);
assert.equal(scenario.grossRevenue, 2294);
assert.equal(scenario.stripeEffectivePercent, 4.9);
assert.ok(Math.abs(scenario.stripePercentFees - 112.406) < 1e-9);
assert.ok(Math.abs(scenario.stripeFixedFees - 1.8) < 1e-9);
assert.ok(Math.abs(scenario.stripeFees - 114.206) < 1e-9);
assert.equal(scenario.aiCosts, 17.5);
assert.equal(scenario.screeningTextractPagesTotal, 100);
assert.equal(scenario.underwritingTextractPagesTotal, 90);
assert.equal(scenario.textractPagesTotal, 190);
assert.ok(Math.abs(scenario.textractCosts - 2.85) < 1e-9);
assert.equal(scenario.otherVariableCosts, 2.75);
assert.ok(Math.abs(scenario.variableReportCosts - 23.10) < 1e-9);
assert.ok(Math.abs(scenario.fixedMonthlyCosts - 82.33) < 1e-9);
assert.ok(Math.abs(scenario.netMonthlyContribution - 2074.364) < 1e-9);
assert.ok(Math.abs(scenario.annualizedRevenue - 27528) < 1e-9);
assert.ok(Math.abs(scenario.annualizedNetContribution - 24892.368) < 1e-9);
assert.ok(Math.abs(scenario.grossRevenueCad - 3211.6) < 1e-9);
assert.ok(Math.abs(scenario.netMonthlyContributionCad - 2904.1096) < 1e-9);

const normalized = normalizeOwnerEconomicsAssumptions({
  screeningPurchases: -1,
  underwritingPurchases: '2.9',
  bundlePurchases: '3',
  stripePercent: 'bad',
  textractPricePerPage: 'bad',
  cadPerUsd: -5,
});
assert.equal(normalized.screeningPurchases, 0);
assert.equal(normalized.underwritingPurchases, 2);
assert.equal(normalized.bundlePurchases, 3);
assert.equal(normalized.stripePercent, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.stripePercent);
assert.equal(normalized.textractPricePerPage, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.textractPricePerPage);
assert.equal(normalized.cadPerUsd, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.cadPerUsd);

const empty = deriveOwnerEconomics({ prices, assumptions: {} });
assert.equal(empty.grossRevenue, 0);
assert.equal(empty.checkoutCount, 0);
assert.equal(empty.netMarginPercent, null);
assert.ok(Math.abs(empty.fixedMonthlyCosts - 82.33) < 1e-9);

console.log('owner-economics-smoke: ok');
