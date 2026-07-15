export const ACQUISITION_FINANCING_DISPLAY_LABELS = Object.freeze({
  purchasePrice: "Purchase Price",
  noiBasis: "NOI Basis",
  goingInCapRate: "Going-In Cap Rate",
  proposedLoanAmount: "Proposed Loan Amount",
  ltv: "LTV",
  interestRate: "Interest Rate",
  amortization: "Amortization",
  lenderFee: "Lender / Origination Fee",
});

export const REQUIRED_ACQUISITION_FINANCING_DISPLAY_KEYS = Object.freeze([
  "purchasePrice",
  "proposedLoanAmount",
  "ltv",
  "interestRate",
  "amortization",
]);

export function requiredAcquisitionFinancingDisplayLabels() {
  return REQUIRED_ACQUISITION_FINANCING_DISPLAY_KEYS.map(
    (key) => ACQUISITION_FINANCING_DISPLAY_LABELS[key]
  );
}
