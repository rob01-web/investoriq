import buildBaseFullUnderwritingChapter1EliteContract, {
  FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION,
  FULL_UNDERWRITING_CHAPTER1_ELITE_EVIDENCE_CLASSES,
} from "./full-underwriting-chapter1-elite-contract-base.js";
import { reconcileExpenseSource } from "./expense-source-reconciliation.js";

export {
  FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION,
  FULL_UNDERWRITING_CHAPTER1_ELITE_EVIDENCE_CLASSES,
} from "./full-underwriting-chapter1-elite-contract-base.js";

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Not available";
  return `$${Math.abs(Math.round(number)).toLocaleString("en-US")}`;
}

function normalizeDecisionLanguage(result) {
  if (String(result?.decisionSnapshotContext?.strategyFit || "").trim().toUpperCase() === "LIGHT VALUE-ADD HOLD") {
    result.decisionSnapshotContext.strategyFit = "LIGHT VALUE-ADD";
  }
}

function buildExpenseLineReconciliationIssue(sourceTruthPackage = null) {
  const facts = sourceTruthPackage?.core?.t12?.accepted_facts || {};
  const reconciliation = reconcileExpenseSource(facts);
  if (!reconciliation.requiresReconciliation) return null;

  const absoluteDifference = Math.abs(reconciliation.difference);
  const provenance = [
    "sourceTruthPackage.core.t12.accepted_facts.total_operating_expenses",
    "sourceTruthPackage.core.t12.accepted_facts.expense_lines",
  ];
  const statement = `The accepted T12 operating-expense total is ${money(reconciliation.statedTotal)} while the listed expense lines sum to ${money(reconciliation.lineTotal)}, a ${money(absoluteDifference)} difference.`;
  const followUp = "Reconcile the listed T12 expense lines to the accepted operating-expense total. InvestorIQ does not infer the cause of the difference.";

  return {
    reconciliation,
    risk: {
      code: "T12_EXPENSE_LINE_RECONCILIATION_REQUIRED",
      title: "T12 expense-line reconciliation required",
      evidenceClass: FULL_UNDERWRITING_CHAPTER1_ELITE_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
      statement,
      investorImpact: "The accepted T12 total remains the calculation basis for NOI and operating ratios, but expense composition and category-share interpretation are constrained until the line-item difference is reconciled.",
      affectedDomains: ["operations", "cash_flow", "expense_structure"],
      followUp,
      metrics: ["operatingExpenses"],
      provenance,
    },
    signal: {
      code: "T12_EXPENSE_LINE_RECONCILIATION_REQUIRED",
      category: "constraint",
      statement,
      evidenceClass: FULL_UNDERWRITING_CHAPTER1_ELITE_EVIDENCE_CLASSES.DETERMINISTIC_CALCULATED,
      metrics: ["operatingExpenses"],
      provenance,
      qualification: followUp,
    },
    question: {
      code: "RECONCILE_T12_EXPENSE_LINES",
      question: "What explains the difference between the listed T12 expense lines and the accepted T12 operating-expense total?",
      whyItMatters: "InvestorIQ preserves the accepted T12 total for NOI and operating-ratio calculations but does not infer the cause of the line-item difference.",
      affectedDomains: ["operations", "cash_flow", "expense_structure"],
      trigger: "t12_expense_lines_do_not_reconcile_to_stated_total",
      provenance,
    },
  };
}

function removeCrossBasisOccupancyComparison(result) {
  if (result?.metrics?.breakEvenOccupancy?.displayReady === true) {
    result.metrics.breakEvenOccupancy.label = "Operating Cost Coverage Ratio";
    result.metrics.breakEvenOccupancy.qualification = "Formula: accepted operating expenses / accepted T12 gross potential rent. This is a GPR-basis operating-cost ratio, not a physical occupancy threshold.";
  }
  if (result?.metrics?.occupancyBreakEvenSpread) {
    result.metrics.occupancyBreakEvenSpread = {
      ...result.metrics.occupancyBreakEvenSpread,
      label: "Physical Occupancy Comparison Not Applicable",
      value: null,
      displayReady: false,
      evidenceClass: FULL_UNDERWRITING_CHAPTER1_ELITE_EVIDENCE_CLASSES.MISSING_UNSUPPORTED,
      authorityPath: null,
      calculationReceiptKey: null,
      provenance: [],
      formula: null,
      inputs: null,
      qualification: "Physical occupancy is not subtracted from a GPR-basis operating-cost ratio.",
    };
  }

  const removedCodes = new Set(["OCCUPANCY_ABOVE_BREAK_EVEN", "OCCUPANCY_BELOW_BREAK_EVEN"]);
  if (Array.isArray(result?.investmentCase?.opportunitySignals)) {
    result.investmentCase.opportunitySignals = result.investmentCase.opportunitySignals.filter((item) => !removedCodes.has(item?.code));
  }
  if (Array.isArray(result?.investmentCase?.constraintSignals)) {
    result.investmentCase.constraintSignals = result.investmentCase.constraintSignals.filter((item) => !removedCodes.has(item?.code));
  }
  if (Array.isArray(result?.principalRisksAndConstraints?.items)) {
    result.principalRisksAndConstraints.items = result.principalRisksAndConstraints.items.filter((item) => !removedCodes.has(item?.code));
  }
  if (removedCodes.has(result?.executiveInvestmentSummary?.primaryConstraint?.code)) {
    result.executiveInvestmentSummary.primaryConstraint = result.principalRisksAndConstraints.items?.[0] || null;
  }
}

function forceIncludedDisposition(result, key) {
  if (result?.[key] && typeof result[key] === "object") result[key].disposition = "include";
  if (result?.sectionDispositions?.[key] && typeof result.sectionDispositions[key] === "object") {
    result.sectionDispositions[key].disposition = "include";
  }
}

function addExpenseLineReconciliationIssue(result, issue) {
  if (!issue) return;

  const riskItems = Array.isArray(result?.principalRisksAndConstraints?.items)
    ? result.principalRisksAndConstraints.items
    : [];
  if (!riskItems.some((item) => item?.code === issue.risk.code)) riskItems.push(issue.risk);
  result.principalRisksAndConstraints.items = riskItems;
  forceIncludedDisposition(result, "principalRisksAndConstraints");

  const constraintSignals = Array.isArray(result?.investmentCase?.constraintSignals)
    ? result.investmentCase.constraintSignals
    : [];
  if (!constraintSignals.some((item) => item?.code === issue.signal.code)) constraintSignals.push(issue.signal);
  result.investmentCase.constraintSignals = constraintSignals;
  forceIncludedDisposition(result, "investmentCase");

  const investorQuestions = Array.isArray(result?.investorQuestions?.items)
    ? result.investorQuestions.items
    : [];
  if (!investorQuestions.some((item) => item?.code === issue.question.code)) investorQuestions.push(issue.question);
  result.investorQuestions.items = investorQuestions;
  forceIncludedDisposition(result, "investorQuestions");

  const unresolved = Array.isArray(result?.executiveInvestmentSummary?.unresolvedDiligence)
    ? result.executiveInvestmentSummary.unresolvedDiligence
    : [];
  if (!unresolved.some((item) => item?.code === issue.question.code)) {
    const sourceReconciliationIndex = unresolved.findIndex((item) => item?.code === "RECONCILE_T12_RENT_ROLL_VARIANCE");
    const insertAt = sourceReconciliationIndex >= 0 ? sourceReconciliationIndex + 1 : 0;
    unresolved.splice(insertAt, 0, issue.question);
  }
  result.executiveInvestmentSummary.unresolvedDiligence = unresolved.slice(0, 4);

  if (!result.executiveInvestmentSummary.primaryConstraint) {
    result.executiveInvestmentSummary.primaryConstraint = issue.risk;
  }

  const fields = Array.isArray(result?.provenance?.sourceTruthFieldsUsed)
    ? result.provenance.sourceTruthFieldsUsed
    : [];
  for (const field of issue.risk.provenance) {
    if (!fields.includes(field)) fields.push(field);
  }
  result.provenance.sourceTruthFieldsUsed = fields;
}

export function buildFullUnderwritingChapter1EliteContract(args = {}) {
  const result = clone(buildBaseFullUnderwritingChapter1EliteContract(args));
  normalizeDecisionLanguage(result);
  removeCrossBasisOccupancyComparison(result);
  addExpenseLineReconciliationIssue(result, buildExpenseLineReconciliationIssue(args.sourceTruthPackage));
  return deepFreeze(result);
}

export default buildFullUnderwritingChapter1EliteContract;
