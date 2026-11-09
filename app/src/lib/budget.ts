export type BudgetLine = { category: string; kind: "income" | "expense"; amount_cents: number; year: number };
type Line = { date: string; category: string | null; amount_cents: number };
export type BudgetRow = { category: string; kind: "income" | "expense"; budget_cents: number; actual_cents: number; percent: number };

/** Actuals per budget line for one year: expenses count money out, income counts money in. */
export function budgetActuals(budgets: BudgetLine[], lines: Line[], year: number): BudgetRow[] {
  return budgets.filter(b => b.year === year).map(b => {
    const actual = lines
      .filter(l => l.category === b.category && l.date.startsWith(`${year}-`))
      .reduce((sum, l) => sum + (b.kind === "expense" ? -l.amount_cents : l.amount_cents), 0);
    return {
      category: b.category,
      kind: b.kind,
      budget_cents: b.amount_cents,
      actual_cents: actual,
      percent: b.amount_cents ? Math.round((actual / b.amount_cents) * 100) : 0
    };
  });
}
