import { describe, expect, it } from "vitest";
import { budgetActuals } from "./budget";

describe("budgetActuals", () => {
  it("adds up the year's ledger lines per category against the budget", () => {
    const rows = budgetActuals(
      [
        { category: "Gear", kind: "expense", amount_cents: 100000, year: 2026 },
        { category: "Sponsorship", kind: "income", amount_cents: 200000, year: 2026 }
      ],
      [
        { date: "2026-03-01", category: "Gear", amount_cents: -25000 },
        { date: "2026-04-01", category: "Gear", amount_cents: -50000 },
        { date: "2025-12-31", category: "Gear", amount_cents: -99999 },
        { date: "2026-05-01", category: "Sponsorship", amount_cents: 50000 }
      ],
      2026
    );
    expect(rows).toEqual([
      { category: "Gear", kind: "expense", budget_cents: 100000, actual_cents: 75000, percent: 75 },
      { category: "Sponsorship", kind: "income", budget_cents: 200000, actual_cents: 50000, percent: 25 }
    ]);
  });
});
