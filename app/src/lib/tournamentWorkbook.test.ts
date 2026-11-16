import { describe, expect, it } from "vitest";
import { editionSheets, fighterSheet, overviewSheet } from "./tournamentWorkbook";
import type { CashBox, Tournament, TournamentExpense, TournamentFighter, TournamentSale } from "./tournaments";
import { crc32, excelDate, sheetNames, workbook, workbookFiles } from "./xlsx";

const T: Tournament = { id: "t1", code: "RUMBLE-2026", name: "Red Deer Rumble", year: 2026, starts_on: "2026-11-14", ends_on: "2026-11-15", venue: "Westerner Park", fighter_fee_cents: 4000, notes: null,
  fighters_count: null, divisions: 4, fights: 120, rounds: 300, spectators: [{ day: "2026-11-14", count: 150 }, { day: "2026-11-15", count: 90 }], stream_viewers: 800, stream_minutes: 600, clubs_attending: 9,
  podiums: [{ division: "Longsword", first: "A", second: "B", third: "C" }] };
let k = 0;
const f = (name: string, status: TournamentFighter["status"], paid: number, method: TournamentFighter["method"] = "etransfer"): TournamentFighter =>
  ({ id: `f${k++}`, tournament_id: "t1", name, club: "Reavers", divisions: "Longsword, 5v5", fee_cents: status === "paid" || status === "owes" ? 4000 : 0, method, paid_cents: paid, status, square_payment_id: null, note: null });
const fighters = [f("Zed", "paid", 4000), f("Amy", "owes", 0), f("Bo & Co <x>", "waived", 0, null), f("Cy", "not_needed", 0, null), f("Di", "paid", 4000, "cash")];
const sales: TournamentSale[] = [{ id: "s1", tournament_id: "t1", item: "Event visitor fee", quantity: 3, price_cents: 1000, method: "cash", sold_on: "2026-11-14", square_item_id: null, square_payment_id: null, note: null }];
const expenses: TournamentExpense[] = [{ id: "e1", tournament_id: "t1", category: "venue", description: "Hall", amount_cents: 25000, method: "etransfer", spent_on: "2026-11-01", from_cash_box: false }];
const boxes: CashBox[] = [{ id: "b1", tournament_id: "t1", name: "Front desk", opening: { "2000": 5, "500": 10 }, closing: { "2000": 8, "500": 10, "1000": 1 }, counted: true, keep_float_cents: null, counted_by: "Sam", note: null }];
const d = { fighters, sales, expenses, boxes };

describe("xlsx", () => {
  it("dates are days since 1899-12-30", () => { expect(excelDate("1900-01-01")).toBe(2); expect(excelDate("2026-11-14")).toBe(46340); expect(excelDate("nope")).toBeNull(); });
  it("crc32 matches the standard check value", () => expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926));
  it("keeps sheet names legal and unique", () => expect(sheetNames(["A/B", "x".repeat(40), "Sales", "sales"])).toEqual(["A-B", "x".repeat(31), "Sales", "sales 2"]));
  it("writes a zip with every part", () => {
    const bytes = workbook(editionSheets(T, d, "2026-11-16"), "Rumble");
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const files = workbookFiles(editionSheets(T, d, "2026-11-16"));
    expect(Object.keys(files)).toContain("xl/worksheets/sheet6.xml");
    expect(files["xl/workbook.xml"]).toContain('name="Cash boxes"');
  });
});

describe("tournament workbook", () => {
  it("lists fighters who owe first, with money as numbers and live totals", () => {
    const xml = workbookFiles([fighterSheet(T, fighters, "2026-11-16")])["xl/worksheets/sheet1.xml"];
    expect(xml.indexOf("Amy")).toBeLessThan(xml.indexOf("Zed"));
    expect(xml).toContain("<f>SUM(C5:C9)</f><v>120</v>");
    expect(xml).toContain("Bo &amp; Co &lt;x&gt;");
    expect(xml).toContain('<autoFilter ref="A4:J9"/>');
  });
  it("puts every edition on the overview", () => {
    const sh = overviewSheet([{ t: T, d }, { t: { ...T, id: "t2", code: "RUMBLE-2025", year: 2025 }, d: { fighters: [], sales: [], expenses: [], boxes: [] } }], "2026-11-16");
    expect(sh.rows[4][0]).toEqual({ v: "RUMBLE-2025", s: "label" });
    expect(sh.rows[5][0]).toEqual({ v: "RUMBLE-2026", s: "label" });
  });
});
