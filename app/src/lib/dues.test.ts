import { describe, expect, it } from "vitest";
import type { Dues, SquarePaymentRow } from "../data/types";
import { covers, duesGrid, lastMonths, settled, unassignedDues } from "./dues";

const due = (member_key: string, member_name: string, month: string, extra: Partial<Dues> = {}): Dues =>
  ({ id: `${member_key}-${month}`, member_key, member_name, member_user: null, month, amount_cents: 3000, method: "cash", paid_on: month, square_payment_id: null, note: null, ...extra });

describe("lastMonths", () => {
  it("counts back across a year end", () => expect(lastMonths("2026-01-20", 3)).toEqual(["2025-11-01", "2025-12-01", "2026-01-01"]));
});

describe("duesGrid", () => {
  it("lists the roster first, then people who paid but aren't matched yet", () => {
    const grid = duesGrid([{ key: "membership:1", name: "Zed" }, { key: "membership:2", name: "Amy" }],
      [due("membership:1", "Zed", "2026-11-01"), due("user:u9", "Sam", "2026-11-01", { member_user: "u9" }), due("membership:1", "Zed", "2025-01-01")],
      ["2026-10-01", "2026-11-01"]);
    expect(grid.map(r => [r.name, r.onRoster, Object.keys(r.cells)])).toEqual([
      ["Amy", true, []], ["Zed", true, ["2026-11-01"]], ["Sam", false, ["2026-11-01"]]
    ]);
    expect(grid[2].user).toBe("u9");
  });
});

describe("exemptions", () => {
  it("cover their months, open-ended or not", () => {
    expect(covers({ starts_month: "2026-09-01", ends_month: null }, "2027-03-01")).toBe(true);
    expect(covers({ starts_month: "2026-09-01", ends_month: "2026-10-01" }, "2026-11-01")).toBe(false);
    expect(covers({ starts_month: "2026-09-01", ends_month: null }, "2026-08-01")).toBe(false);
  });
  it("mark exempt months as settled without a dues record", () => {
    const [row] = duesGrid([{ key: "membership:1", name: "Coach" }], [],
      ["2026-09-01", "2026-10-01", "2026-11-01"], [{ id: "e", member_key: "membership:1", member_name: "Coach", reason: "Volunteer coach", starts_month: "2026-10-01", ends_month: null }]);
    expect(["2026-09-01", "2026-10-01", "2026-11-01"].map(m => settled(row, m))).toEqual([false, true, true]);
    expect(row.exemption?.reason).toBe("Volunteer coach");
  });
});

describe("unassignedDues", () => {
  const pay = (id: string, kind: SquarePaymentRow["kind"], refunded = 0) => ({ id, square_payment_id: id, kind, items: [], amount_cents: 3000, refunded_cents: refunded }) as unknown as SquarePaymentRow;
  it("finds dues payments nobody is filed under, skipping refunded ones", () => {
    const out = unassignedDues([pay("A", "dues"), pay("B", "dues"), pay("C", "sticker"), pay("D", "dues", 3000)], [due("x", "X", "2026-11-01", { square_payment_id: "A" })]);
    expect(out.map(p => p.id)).toEqual(["B"]);
  });
});
