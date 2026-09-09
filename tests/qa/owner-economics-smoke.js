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
    screeningVariableCost: 2,
    underwritingVariableCost: 7,
    vercelMonthlyCost: 20,
    supabaseMonthlyCost: 25,
    docraptorMonthlyCost: 15,
    domainEmailMonthlyCost: 5,
    otherMonthlyCost: 10,
    cadPerUsd: 1.40,
  },
});

assert.equal(scenario.checkoutCount, 6);
assert.equal(scenario.screeningReports, 5);
assert.equal(scenario.underwritingReports, 3);
assert.equal(scenario.totalReports, 8);
assert.equal(scenario.grossRevenue, 2294);
assert.equal(scenario.fixedMonthlyCosts, 75);
assert.equal(scenario.variableReportCosts, 31);
assert.ok(Math.abs(scenario.stripePercentFees - 66.526) < 1e-9);
assert.ok(Math.abs(scenario.stripeFixedFees - 1.8) < 1e-9);
assert.ok(Math.abs(scenario.stripeFees - 68.326) < 1e-9);
assert.ok(Math.abs(scenario.netMonthlyContribution - 2119.674) < 1e-9);
assert.ok(Math.abs(scenario.annualizedRevenue - 27528) < 1e-9);
assert.ok(Math.abs(scenario.annualizedNetContribution - 25436.088) < 1e-9);
assert.ok(Math.abs(scenario.grossRevenueCad - 3211.6) < 1e-9);
assert.ok(Math.abs(scenario.netMonthlyContributionCad - 2967.5436) < 1e-9);

const normalized = normalizeOwnerEconomicsAssumptions({
  screeningPurchases: -1,
  underwritingPurchases: '2.9',
  bundlePurchases: '3',
  stripePercent: 'bad',
  cadPerUsd: -5,
});
assert.equal(normalized.screeningPurchases, 0);
assert.equal(normalized.underwritingPurchases, 2);
assert.equal(normalized.bundlePurchases, 3);
assert.equal(normalized.stripePercent, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.stripePercent);
assert.equal(normalized.cadPerUsd, DEFAULT_OWNER_ECONOMICS_ASSUMPTIONS.cadPerUsd);

const empty = deriveOwnerEconomics({ prices, assumptions: {} });
assert.equal(empty.grossRevenue, 0);
assert.equal(empty.checkoutCount, 0);
assert.equal(empty.netMarginPercent, null);

console.log('owner-economics-smoke: ok');
