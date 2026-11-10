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
  it("keeps two identical lines in one export (two members paying the same dues the same day)", () => {
    const row = { date: "2026-11-01", description: "e-Transfer", amount_cents: 6000 };
    expect(markDuplicates([row, { ...row }], []).map(r => r.duplicate)).toEqual([false, false]);
  });
  it("matches each ledger line once, so re-importing the same export adds nothing and an extra copy is new", () => {
    const row = { date: "2026-11-01", description: "e-Transfer", amount_cents: 6000 };
    expect(markDuplicates([row, { ...row }], [row, row]).map(r => r.duplicate)).toEqual([true, true]);
    expect(markDuplicates([row, { ...row }], [row]).map(r => r.duplicate)).toEqual([true, false]);
  });
});
