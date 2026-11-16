import { describe, expect, it } from "vitest";
import {
  byEvent, countTotal, editionCode, floatPlan, ledgerLinesFor, parseDescription, parseMinutes, formatMinutes, registrationMatches, saleKind, squareCsvLines, squareSaleLines, summarize,
  type CashBox, type TournamentExpense, type TournamentFighter, type TournamentSale
} from "./tournaments";

const T = "t1";
let k = 0;
const fighter = (status: TournamentFighter["status"], method: TournamentFighter["method"], paid: number, fee = 4000): TournamentFighter =>
  ({ id: `f${k++}`, tournament_id: T, name: `F${k}`, club: null, divisions: null, fee_cents: status === "paid" || status === "owes" ? fee : 0, method, paid_cents: paid, status, square_payment_id: null, note: null });
const sale = (item: string, quantity: number, price: number, method: TournamentSale["method"], square?: string): TournamentSale =>
  ({ id: `s${k++}`, tournament_id: T, item, quantity, price_cents: price, method, sold_on: "2026-11-14", square_item_id: null, square_payment_id: square ?? null, note: null });
const expense = (category: TournamentExpense["category"], amount: number, method: TournamentExpense["method"], from_cash_box = false): TournamentExpense =>
  ({ id: `e${k++}`, tournament_id: T, category, description: null, amount_cents: amount, method, spent_on: null, from_cash_box });

/** RUMBLE-2026 fees: 18 by e-transfer ($720, 15 paid), 7 cash ($280, 6 paid), 31 who didn't have to pay. */
function rumble() {
  return [
    ...Array.from({ length: 15 }, () => fighter("paid", "etransfer", 4000)),
    ...Array.from({ length: 3 }, () => fighter("owes", "etransfer", 0)),
    ...Array.from({ length: 6 }, () => fighter("paid", "cash", 4000)),
    fighter("owes", "cash", 0),
    ...Array.from({ length: 22 }, () => fighter("not_needed", null, 0)),
    ...Array.from({ length: 9 }, () => fighter("waived", null, 0))
  ];
}

describe("editionCode", () => {
  it("makes RUMBLE-2026 from the event name and year", () => {
    expect(editionCode("Red Deer Rumble", 2026)).toBe("RUMBLE-2026");
    expect(editionCode("Winter Brawl", 2027)).toBe("WINTER-2027");
  });
});

describe("summarize", () => {
  it("adds up RUMBLE-2026's fighter fees by method, who owes and who didn't have to pay", () => {
    const s = summarize(rumble(), [sale("Event visitor fee", 52, 1000, "cash"), sale("Event visitor fee", 42, 1000, "cash")], [], []);
    const et = s.byMethod.find(m => m.method === "etransfer")!;
    const cash = s.byMethod.find(m => m.method === "cash")!;
    expect([et.expected, et.collected]).toEqual([72000, 60000]);
    expect([cash.expected, cash.collected]).toEqual([28000 + 94000, 24000 + 94000]);
    expect(s.fees).toEqual({ expected: 100000, collected: 84000, owing: 16000 });
    expect(s.fighters.owing).toHaveLength(4);
    expect([s.fighters.paid, s.fighters.free, s.fighters.waived, s.fighters.notNeeded]).toEqual([21, 31, 9, 22]);
    expect(s.sales.visitors).toBe(94000);
    expect(s.totalIn).toBe(84000 + 94000);
  });
  it("counts merch, expenses, net, and cash over or short", () => {
    const boxes: CashBox[] = [
      { id: "b1", tournament_id: T, name: "Door", opening: { "2000": 5 }, closing: { "2000": 5, "1000": 10, "500": 1 }, counted: true, keep_float_cents: null, counted_by: null, note: null },
      { id: "b2", tournament_id: T, name: "Merch", opening: { "500": 4 }, closing: { "500": 4, "200": 3, "25": 4 }, counted: true, keep_float_cents: null, counted_by: null, note: null }
    ];
    const s = summarize([fighter("paid", "cash", 4000)],
      [sale("Event visitor fee", 10, 1000, "cash"), sale("Small sticker", 3, 100, "cash"), sale("Complete set of cards", 1, 1000, "credit", "sq1")],
      [expense("food", 2000, "cash", true), expense("venue", 50000, "etransfer")], boxes);
    expect(s.sales.merch).toBe(1300);
    expect(s.sales.merchQty).toBe(4);
    expect(s.sales.card).toBe(1000);
    expect(s.totalOut).toBe(52000);
    expect(s.net).toBe(4000 + 10000 + 300 + 1000 - 52000);
    // Expected cash: 40 fee + 100 visitors + 3 stickers - 20 pizza from the box = 123. Taken: 105 + 7 = 112 → 11 short.
    expect(s.cash.expected).toBe(12300);
    expect(s.cash.taken).toBe(11200);
    expect(s.cash.overShort).toBe(-1100);
    expect(s.cash.counted).toBe(true);
  });
});

describe("floatPlan", () => {
  it("keeps the same mix as the opening float and deposits the rest", () => {
    const opening = { "2000": 2, "500": 4, "100": 10, "25": 20 };          // $40 + $20 + $10 + $5 = $75
    const closing = { "10000": 2, "2000": 9, "500": 6, "100": 12, "25": 30 };
    const p = floatPlan(closing, opening);
    expect(p.keepCents).toBe(7500);
    expect(p.keep).toEqual({ "2000": 2, "500": 4, "100": 10, "25": 20 });
    expect(p.depositCents).toBe(countTotal(closing) - 7500);
    expect(p.deposit).toEqual({ "10000": 2, "2000": 7, "500": 2, "100": 2, "25": 10 });
    expect(p.shortBy).toBe(0);
  });
  it("fills a gap with the smallest change left, and says when it can't make the float", () => {
    const p = floatPlan({ "2000": 3, "500": 1 }, { "1000": 5 }, 5000);
    expect(p.keep).toEqual({ "500": 1, "2000": 2 });
    expect(p.keepCents).toBe(4500);
    expect(p.shortBy).toBe(500);
    expect(floatPlan({}, { "500": 2 }).depositCents).toBe(0);
  });
});

describe("ledgerLinesFor", () => {
  it("posts fees, sales and expenses by method, and leaves Square sales out", () => {
    const lines = ledgerLinesFor({ code: "RUMBLE-2026", starts_on: "2026-11-14", ends_on: "2026-11-15" }, rumble(),
      [sale("Event visitor fee", 52, 1000, "cash"), sale("Small sticker", 2, 100, "credit", "sq1")], [expense("prizes", 15000, "etransfer")], "2026-11-16");
    const by = Object.fromEntries(lines.map(l => [l.external_id, l]));
    expect(by["tournament-RUMBLE-2026-fees-etransfer"].amount_cents).toBe(60000);
    expect(by["tournament-RUMBLE-2026-fees-etransfer"].account).toBe("Chequing");
    expect(by["tournament-RUMBLE-2026-fees-cash"].amount_cents).toBe(24000);
    expect(by["tournament-RUMBLE-2026-visitors-cash"]).toMatchObject({ amount_cents: 52000, category: "Admissions", account: "Cash box", date: "2026-11-15", source: "tournament" });
    expect(by["tournament-RUMBLE-2026-expense-prizes-etransfer"]).toMatchObject({ amount_cents: -15000, category: "Event costs" });
    expect(lines.some(l => l.external_id.includes("merch"))).toBe(false);
  });
});

describe("squareSaleLines", () => {
  it("imports the edition's Square sales once, skipping dues and registrations", () => {
    const pays = [
      { id: "p1", paid_at: "2026-11-14T19:00:00Z", amount_cents: 2500, fee_cents: 70, refunded_cents: 0, channel: "in_person" as const,
        items: [{ name: "Event visitor fee", quantity: 2, amount_cents: 2000, kind: "visitor" as const }, { name: "Reavers stickers 2-pack", quantity: 1, amount_cents: 500, kind: "sticker" as const }] },
      { id: "p2", paid_at: "2026-11-15T19:00:00Z", amount_cents: 1000, fee_cents: 0, refunded_cents: 0, channel: "in_person" as const, items: [{ name: "Event visitor fee", quantity: 1, amount_cents: 1000, kind: "visitor" as const }] },
      { id: "p3", paid_at: "2026-11-15T19:00:00Z", amount_cents: 5000, fee_cents: 145, refunded_cents: 0, channel: "online" as const, items: [{ name: "Monthly dues", quantity: 1, amount_cents: 5000, kind: "dues" as const }] },
      { id: "p4", paid_at: "2026-11-14T19:00:00Z", amount_cents: 4000, fee_cents: 116, refunded_cents: 0, channel: "online" as const, items: [{ name: "Tournament registration", quantity: 1, amount_cents: 4000, kind: "tournament" as const }] },
      { id: "p5", paid_at: "2026-11-20T19:00:00Z", amount_cents: 1000, fee_cents: 29, refunded_cents: 0, channel: "in_person" as const, items: [{ name: "Event visitor fee", quantity: 1, amount_cents: 1000, kind: "visitor" as const }] }
    ];
    const t = { id: T, starts_on: "2026-11-14", ends_on: "2026-11-15" };
    const lines = squareSaleLines(t, pays, [], [{ id: "item-v", title: "Event visitor fee" }]);
    expect(lines.map(l => [l.item, l.quantity, l.price_cents, l.method, l.square_item_id])).toEqual([
      ["Event visitor fee", 2, 1000, "credit", "item-v"], ["Reavers stickers 2-pack", 1, 500, "credit", null], ["Event visitor fee", 1, 1000, "cash", "item-v"]
    ]);
    const again = squareSaleLines(t, pays, lines.map((l, i) => ({ ...l, id: `x${i}` })), []);
    expect(again).toHaveLength(0);
  });
});

describe("small helpers", () => {
  it("reads stream time and sorts editions by event and year", () => {
    expect(parseMinutes("21h 50m")).toBe(1310);
    expect(parseMinutes("21:50")).toBe(1310);
    expect(formatMinutes(1310)).toBe("21h 50m");
    expect(saleKind("Under 10 visitor")).toBe("visitor");
    expect(saleKind("Complete set of cards")).toBe("trading_card");
    const g = byEvent([{ name: "Red Deer Rumble", year: 2026 }, { name: "Red Deer Rumble", year: 2025 }, { name: "Brawl", year: 2026 }]);
    expect(g.map(x => [x.name, x.editions.map(e => e.year)])).toEqual([["Brawl", [2026]], ["Red Deer Rumble", [2025, 2026]]]);
  });
});

describe("Square exports and registrations", () => {
  const t = { id: T, starts_on: "2026-11-14", ends_on: "2026-11-15" };
  it("reads the item sales export, with cash or card from the transactions export", () => {
    const items = [
      ["Date", "Time", "Category", "Item", "Qty", "Price Point Name", "Gross Sales", "Transaction ID", "Event Type"],
      ["2026-11-14", "10:00", "", "Event visitor fee", "3", "Regular", "$30.00", "T1", "Payment"],
      ["2026-11-14", "10:05", "", "Small sticker", "2", "Regular", "$2.00", "T2", "Payment"],
      ["2026-11-14", "10:06", "", "Tournament registration", "1", "Regular", "$40.00", "T3", "Payment"],
      ["2026-11-15", "11:00", "", "Event visitor fee", "1", "Regular", "($10.00)", "T4", "Refund"],
      ["2026-11-20", "11:00", "", "Event visitor fee", "1", "Regular", "$10.00", "T5", "Payment"]
    ];
    const tx = [["Date", "Time", "Gross Sales", "Card", "Cash", "Description", "Transaction ID"], ["2026-11-14", "10:00", "$30.00", "$30.00", "$0.00", "", "T1"], ["2026-11-14", "10:05", "$2.00", "$0.00", "$2.00", "", "T2"]];
    const r = squareCsvLines(t, [items, tx], []);
    expect(r.kind).toBe("items");
    expect(r.lines.map(l => [l.item, l.quantity, l.price_cents, l.method, l.square_ref])).toEqual([["Event visitor fee", 3, 1000, "credit", "T1"], ["Small sticker", 2, 100, "cash", "T2"]]);
    expect(r.skipped).toMatchObject({ registrations: 1, refunds: 1, outside: 1 });
    const again = squareCsvLines(t, [items, tx], r.lines.map((l, i) => ({ ...l, id: `x${i}` })));
    expect(again.lines).toHaveLength(0);
    expect(again.skipped.already).toBe(2);
  });
  it("reads the transactions export alone by splitting its descriptions", () => {
    const tx = [["Date", "Time", "Gross Sales", "Card", "Cash", "Description", "Transaction ID"],
      ["11/14/2026", "10:00", "$25.00", "$0.00", "$25.00", "Event visitor fee x 2, Reavers stickers 2-pack", "T1"],
      ["11/15/2026", "10:00", "$7.00", "$7.00", "$0.00", "Custom Amount", "T2"]];
    const r = squareCsvLines(t, [tx], []);
    expect(r.lines.map(l => [l.item, l.quantity, l.price_cents, l.method, l.sold_on])).toEqual([
      ["Event visitor fee", 2, 1000, "cash", "2026-11-14"], ["Reavers stickers 2-pack", 1, 500, "cash", "2026-11-14"], ["Custom Amount", 1, 700, "credit", "2026-11-15"]]);
    expect(parseDescription("2 x Small sticker, Large sticker")).toEqual([["Small sticker", 2], ["Large sticker", 1]]);
  });
  it("books export card sales to the Square account", () => {
    const s = { ...sale("Small sticker", 2, 100, "credit"), square_ref: "T9" };
    expect(ledgerLinesFor({ code: "X-2026", starts_on: "2026-11-14", ends_on: null }, [], [s], [], "2026-11-16")[0]).toMatchObject({ account: "Square", amount_cents: 200 });
  });
  it("ticks off fighters who registered through Square", () => {
    const f = [{ ...fighter("owes", "etransfer", 0), name: "Colt Spencer" }, { ...fighter("owes", "cash", 0), name: "Gage Cutler" }];
    const pays = [{ id: "p1", paid_at: "2026-10-20T19:00:00Z", amount_cents: 4000, fee_cents: 116, refunded_cents: 0, channel: "online" as const, buyer_name: "colt spencer", items: [{ name: "Tournament registration", quantity: 1, amount_cents: 4000, kind: "tournament" as const }] }];
    const m = registrationMatches(t, f, pays);
    expect(m).toHaveLength(1);
    expect(m[0].fighter.name).toBe("Colt Spencer");
    expect(m[0].patch).toMatchObject({ status: "paid", method: "credit", paid_cents: 4000, square_payment_id: "p1" });
  });
});
