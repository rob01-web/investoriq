import { publicationNumber } from './publication-format.js';

export function reconcileExpenseSource(facts = {}) {
  const statedTotal = publicationNumber(facts.total_operating_expenses);
  const lines = (Array.isArray(facts.expense_lines) ? facts.expense_lines : [])
    .filter((row) => !/^total\s+(operating\s+)?expenses?$/i.test(String(row.label || '').trim()));
  const values = lines.map((row) => publicationNumber(row.amount ?? row.value ?? row.total));
  const lineTotal = values.length && values.every((value) => value !== null)
    ? values.reduce((sum, value) => sum + value, 0) : null;
  const difference = statedTotal !== null && lineTotal !== null ? statedTotal - lineTotal : null;
  return { statedTotal, lineTotal, difference, requiresReconciliation: difference !== null && Math.abs(difference) > 1 };
}
