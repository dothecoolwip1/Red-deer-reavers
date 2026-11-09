import { describe, expect, it } from "vitest";
import { markDuplicates } from "./dedupe";

describe("markDuplicates", () => {
  it("flags rows already in the ledger by date, amount and description, ignoring case and spacing", () => {
    const existing = [{ date: "2026-11-01", description: "GYM  RENT", amount_cents: -40000 }];
    const incoming = [
      { date: "2026-11-01", description: "gym rent", amount_cents: -40000 },
      { date: "2026-11-01", description: "gym rent", amount_cents: -40001 }
    ];
    expect(markDuplicates(incoming, existing).map(r => r.duplicate)).toEqual([true, false]);
  });
  it("flags a repeat inside the same file", () => {
    const row = { date: "2026-11-01", description: "Dues", amount_cents: 6000 };
    expect(markDuplicates([row, { ...row }], []).map(r => r.duplicate)).toEqual([false, true]);
  });
});
