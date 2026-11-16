// The Tournaments spreadsheets: one workbook per edition (Summary, Fighters, Sales, Expenses, Cash boxes, Stats), one per
// section, and "everything" (every edition side by side, then each edition's sheets). Money is real money, dates are
// real dates, and totals are formulas, so the numbers still add up after someone edits a cell.
import {
  DENOMS, EXPENSE_CATEGORIES, EXPENSE_LABEL, METHOD_LABEL, STATUS_LABEL, byEvent, countTotal, denomLabel, floatPlan, formatMinutes, summarize,
  type CashBox, type FighterStatus, type Summary, type Tournament, type TournamentExpense, type TournamentFighter, type TournamentSale
} from "./tournaments";
import { ref, type Sheet, type Style, type XCell } from "./xlsx";

export type EditionData = { fighters: TournamentFighter[]; sales: TournamentSale[]; expenses: TournamentExpense[]; boxes: CashBox[] };

const $ = (cents: number | null | undefined, s: Style = "money"): XCell => (cents === null || cents === undefined ? { v: null, s } : { v: cents / 100, s });
const n = (v: number | null | undefined, s: Style = "int"): XCell => ({ v: v ?? null, s });
const t = (v: string | null | undefined, s: Style = "text"): XCell => ({ v: v ?? "", s });
const head = (labels: string[], numeric: number[] = []): XCell[] => labels.map((l, i) => ({ v: l, s: numeric.includes(i) ? "headNum" : "head" }));
const sumF = (col: number, from: number, to: number) => `SUM(${ref(col, from)}:${ref(col, to)})`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (iso: string | null | undefined) => { const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}` : ""; };
const days = (e: Tournament) => {
  if (!e.starts_on) return "";
  if (!e.ends_on || e.ends_on === e.starts_on) return day(e.starts_on);
  const [a, b] = [e.starts_on, e.ends_on];
  return a.slice(0, 7) === b.slice(0, 7) ? `${MONTHS[+a.slice(5, 7) - 1]} ${+a.slice(8)} to ${+b.slice(8)}, ${a.slice(0, 4)}` : `${day(a)} to ${day(b)}`;
};
const visitors = (e: Tournament) => (e.spectators || []).reduce((s, d) => s + d.count, 0);
const STATUS_STYLE: Record<FighterStatus, Style> = { paid: "good", owes: "bad", waived: "free", not_needed: "free" };
const STATUS_ORDER: Record<FighterStatus, number> = { owes: 0, paid: 1, waived: 2, not_needed: 3 };

/** A dark banner (event and year, then what the sheet is and the edition's details), and a thin spacer row. */
function top(e: Tournament, what: string, width: number, today: string, lead?: string): { rows: XCell[][]; merges: string[] } {
  const about = [what.toUpperCase(), e.code, days(e), e.venue, lead, `Exported ${day(today)}`].filter(Boolean).join("   ·   ");
  const w = Math.max(width, 4) - 1;
  return { rows: [[{ v: `${e.name} ${e.year}`, s: "title" }], [{ v: about, s: "about" }], []], merges: [`A1:${ref(w, 1)}`, `A2:${ref(w, 2)}`] };
}
type Extra = Partial<Sheet> & { lead?: string };
const sheet = (name: string, e: Tournament, what: string, width: number, today: string, body: XCell[][], extra: Extra = {}): Sheet => {
  const { lead, ...rest } = extra;
  const { rows, merges } = top(e, what, width, today, lead);
  // Room to breathe: taller section titles and table headers.
  const auto: Record<number, number> = {};
  body.forEach((r, i) => { const c = r[0]; const st = c && typeof c === "object" ? c.s : undefined; if (st === "section") auto[i + 4] = 30; else if (st === "head" || st === "headNum") auto[i + 4] = 28; else if (st === "totalLabel") auto[i + 4] = 24; });
  rest.heights = { ...auto, ...(rest.heights || {}) };
  return { ...rest, name, rows: [...rows, ...body], merges: [...merges, ...(rest.merges || [])], heights: { 1: 42, 2: 24, 3: 12, ...(rest.freeze ? ({ 4: 30 } as Record<number, number>) : {}), ...(rest.heights || {}) } };
};
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ------------------------------------------------------------------ Summary

export function summarySheet(e: Tournament, d: EditionData, today: string, name = "Summary"): Sheet {
  const s = summarize(d.fighters, d.sales, d.expenses, d.boxes);
  const body: XCell[][] = [];
  const R = () => body.length + 4; // the 1-based row the next pushed row lands on (3 rows of title above)
  const heights: Record<number, number> = {};

  // Headline numbers
  heights[R()] = 26;
  body.push([t("Total in", "kpiLabel"), t("Total out", "kpiLabel"), t("Net", "kpiLabel"), t("Still owing", "kpiLabel"), t("Fighters", "kpiLabel")]);
  heights[R()] = 40;
  body.push([$(s.totalIn, "kpiMoney"), $(s.totalOut, "kpiMoney"), $(s.net, s.net < 0 ? "kpiMoneyBad" : "kpiMoneyGood"), $(s.fees.owing, s.fees.owing ? "kpiMoneyBad" : "kpiMoney"), n(s.fighters.total, "kpiInt")]);
  heights[R()] = 22;
  body.push([t(`of ${money(s.expectedIn)} expected`, "kpiNote"), t(plural(d.expenses.length, "expense"), "kpiNote"), t(s.net < 0 ? "loss" : "profit", "kpiNote"), t(plural(s.fighters.owing.length, "fighter"), "kpiNote"), t(`${s.fighters.paid} paid · ${s.fighters.free} free`, "kpiNote")]);
  body.push([]);

  // By payment method
  body.push([t("Expected and collected, by payment method", "section"), t("", "section"), t("", "section"), t("", "section")]);
  body.push(head(["Payment method", "Expected", "Collected", "Difference"], [1, 2, 3]));
  const methods = s.byMethod.filter(m => m.expected || m.collected);
  const first = R();
  for (const m of methods) { const r = R(); body.push([t(METHOD_LABEL[m.method], "label"), $(m.expected), $(m.collected), { f: `${ref(2, r)}-${ref(1, r)}`, v: (m.collected - m.expected) / 100, s: m.collected < m.expected ? "moneyBad" : "moneyGood" }]); }
  const last = R() - 1;
  { const r = R(); body.push([t("Total", "totalLabel"), { f: sumF(1, first, last), v: s.expectedIn / 100, s: "totalMoney" }, { f: sumF(2, first, last), v: s.totalIn / 100, s: "totalMoney" }, { f: `${ref(2, r)}-${ref(1, r)}`, v: (s.totalIn - s.expectedIn) / 100, s: "totalMoney" }]); }
  body.push([t("Fighter fees count toward expected; those who didn't have to pay don't. Sales count as collected when they're entered.", "subtitle")]);
  body.push([]);

  // Money in and out
  body.push([t("Where the money came from", "section"), t("", "section"), t("Where it went", "section"), t("", "section")]);
  body.push(head(["Line", "Amount", "Expense", "Amount"], [1, 3]));
  const inLines: [string, number][] = [["Fighter fees", s.fees.collected], ["Visitor fees", s.sales.visitors], [`Merch (${s.sales.merchQty} ${s.sales.merchQty === 1 ? "item" : "items"})`, s.sales.merch], ["Other sales", s.sales.other]];
  const outLines: [string, number][] = EXPENSE_CATEGORIES.map(c => [EXPENSE_LABEL[c], s.expensesByCategory[c]]);
  const rowsIO = Math.max(inLines.length, outLines.length);
  const ioFirst = R();
  for (let i = 0; i < rowsIO; i++) body.push([inLines[i] ? t(inLines[i][0], "label") : t(""), inLines[i] ? $(inLines[i][1]) : t(""), outLines[i] ? t(outLines[i][0], "label") : t(""), outLines[i] ? $(outLines[i][1]) : t("")]);
  const ioLast = R() - 1;
  const totalsRow = R();
  body.push([t("Total in", "totalLabel"), { f: sumF(1, ioFirst, ioLast), v: s.totalIn / 100, s: "totalMoney" }, t("Total out", "totalLabel"), { f: sumF(3, ioFirst, ioLast), v: s.totalOut / 100, s: "totalMoney" }]);
  body.push([t("Net (in minus out)", "label"), { f: `${ref(1, totalsRow)}-${ref(3, totalsRow)}`, v: s.net / 100, s: s.net < 0 ? "moneyBad" : "moneyGood" }, t("Through Square", "label"), $(s.sales.card)]);
  body.push([]);

  // Fighters and cash
  body.push([t("Fighters", "section"), t("", "section"), t("Cash boxes", "section"), t("", "section")]);
  body.push(head(["Status", "People", "Cash", "Amount"], [1, 3]));
  const cashRows: [string, number, Style][] = [["Opening floats", s.cash.opening, "money"], ["Closing count", s.cash.closing, "money"], ["Cash taken in", s.cash.taken, "money"], ["Expected cash", s.cash.expected, "money"]];
  const fRows: [string, number, Style][] = [["Paid", s.fighters.paid, "good"], ["Owe", s.fighters.owing.length, "bad"], ["Waived", s.fighters.waived, "free"], ["Not needed", s.fighters.notNeeded, "free"]];
  const fFirst = R();
  for (let i = 0; i < 4; i++) body.push([t(fRows[i][0], fRows[i][2]), n(fRows[i][1]), t(cashRows[i][0], "label"), $(cashRows[i][1], cashRows[i][2])]);
  body.push([t("Total", "totalLabel"), { f: sumF(1, fFirst, fFirst + 3), v: s.fighters.total, s: "totalInt" }, t(s.cash.boxes ? (s.cash.counted ? "Over (+) or short (-)" : "Over or short (not all counted)") : "No cash boxes yet", "totalLabel"), $(s.cash.boxes ? s.cash.overShort : null, "totalMoney")]);

  if (s.fighters.owing.length) {
    body.push([]);
    body.push([t("Still owes", "section"), t("", "section"), t("", "section"), t("", "section")]);
    body.push(head(["Name", "Owes", "Payment method", "Note"], [1]));
    const oFirst = R();
    for (const f of s.fighters.owing) body.push([t(f.name, "label"), $(Math.max(0, f.fee_cents - f.paid_cents), "moneyBad"), t(f.method ? METHOD_LABEL[f.method] : "-"), t(f.note, "muted")]);
    body.push([t("Total", "totalLabel"), { f: sumF(1, oFirst, R() - 1), v: s.fees.owing / 100, s: "totalMoney" }, t("", "totalLabel"), t("", "totalLabel")]);
  }

  return sheet(name, e, "Summary", 5, today, body, { cols: [30, 17, 30, 17, 16], heights, tab: "FF4F2382" });
}
const money = (c: number) => `$${(c / 100).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ------------------------------------------------------------------ Fighters

export function fighterSheet(e: Tournament, list: TournamentFighter[], today: string, name = "Fighters"): Sheet {
  const cols = ["Name", "Status", "Fee", "Paid", "Still owing", "Payment method", "Club", "Divisions", "Square", "Note"];
  const sorted = [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name));
  const body: XCell[][] = [head(cols, [2, 3, 4]).map((c, i) => (i === 1 ? { v: "Status", s: "headCenter" as Style } : c))];
  const first = 5;
  sorted.forEach((f, i) => {
    const r = first + i;
    const owing = f.status === "paid" || f.status === "owes" ? Math.max(0, f.fee_cents - f.paid_cents) : 0;
    body.push([t(f.name, "label"), t(STATUS_LABEL[f.status], STATUS_STYLE[f.status]), $(f.fee_cents), $(f.paid_cents),
      { f: `IF(OR(${ref(1, r)}="Paid",${ref(1, r)}="Owes"),MAX(0,${ref(2, r)}-${ref(3, r)}),0)`, v: owing / 100, s: owing ? "moneyBad" : "money" },
      t(f.method ? METHOD_LABEL[f.method] : "-"), t(f.club), t(f.divisions, "wrap"), t(f.square_payment_id ? "Yes" : ""), t(f.note, "muted")]);
  });
  const last = first + sorted.length - 1;
  const s = summarize(list, [], [], []);
  body.push([t(`${list.length} ${list.length === 1 ? "fighter" : "fighters"}`, "totalLabel"), t(`${s.fighters.paid} paid`, "totalLabel"),
    { f: sumF(2, first, Math.max(first, last)), v: sumC(list, f => f.fee_cents), s: "totalMoney" }, { f: sumF(3, first, Math.max(first, last)), v: sumC(list, f => f.paid_cents), s: "totalMoney" },
    { f: sumF(4, first, Math.max(first, last)), v: s.fees.owing / 100, s: "totalMoney" }, t("", "totalLabel"), t("", "totalLabel"), t("", "totalLabel"), t("", "totalLabel"), t("", "totalLabel")]);
  const lead = `${plural(list.length, "fighter")}: ${s.fighters.paid} paid, ${s.fighters.owing.length} owe, ${s.fighters.free} free`;
  return sheet(name, e, "Fighters", cols.length, today, body, { lead, freeze: 4, filter: { row: 4, cols: cols.length, last }, stripes: sorted.length ? [`A${first}:A${last}`, `C${first}:J${last}`] : [], cols: [26, 13, 11, 11, 12, 16, 18, 22, 9, 46], landscape: true, tab: "FF2E8B57" });
}
const sumC = <T,>(rows: T[], f: (r: T) => number) => rows.reduce((s, r) => s + f(r), 0) / 100;

// ------------------------------------------------------------------ Sales

export function saleSheet(e: Tournament, list: TournamentSale[], today: string, name = "Sales"): Sheet {
  const cols = ["Day", "Item", "Quantity", "Price", "Total", "Payment method", "From", "Note"];
  const sorted = [...list].sort((a, b) => (a.sold_on || "").localeCompare(b.sold_on || "") || a.item.localeCompare(b.item));
  const body: XCell[][] = [head(cols, [2, 3, 4])];
  const first = 5;
  sorted.forEach((x, i) => {
    const r = first + i;
    body.push([{ date: x.sold_on, s: "date" }, t(x.item, "label"), n(x.quantity), $(x.price_cents), { f: `${ref(2, r)}*${ref(3, r)}`, v: (x.quantity * x.price_cents) / 100, s: "money" },
      t(METHOD_LABEL[x.method]), t(x.square_payment_id ? "Square sales" : x.square_ref ? "Square export" : "Entered by hand"), t(x.note && x.note !== "From a Square export" ? x.note : "", "muted")]);
  });
  const last = Math.max(first, first + sorted.length - 1);
  body.push([t(`${list.length} ${list.length === 1 ? "line" : "lines"}`, "totalLabel"), t("", "totalLabel"), { f: sumF(2, first, last), v: list.reduce((s, x) => s + x.quantity, 0), s: "totalInt" }, t("", "totalLabel"),
    { f: sumF(4, first, last), v: sumC(list, x => x.quantity * x.price_cents), s: "totalMoney" }, t("", "totalLabel"), t("", "totalLabel"), t("", "totalLabel")]);
  return sheet(name, e, "Sales", cols.length, today, body, { lead: plural(list.length, "sale line"), freeze: 4, filter: { row: 4, cols: cols.length, last: first + sorted.length - 1 }, stripes: sorted.length ? [`A${first}:H${first + sorted.length - 1}`] : [], cols: [17, 30, 10, 11, 12, 16, 16, 36], landscape: true, tab: "FFD6A84C" });
}

// ------------------------------------------------------------------ Expenses

export function expenseSheet(e: Tournament, list: TournamentExpense[], today: string, name = "Expenses"): Sheet {
  const cols = ["Day", "Category", "Description", "Amount", "Payment method", "From the cash box"];
  const sorted = [...list].sort((a, b) => (a.spent_on || "").localeCompare(b.spent_on || "") || a.category.localeCompare(b.category));
  const body: XCell[][] = [head(cols, [3])];
  const first = 5;
  for (const x of sorted) body.push([{ date: x.spent_on, s: "date" }, t(EXPENSE_LABEL[x.category], "label"), t(x.description, "wrap"), $(x.amount_cents), t(METHOD_LABEL[x.method]), t(x.from_cash_box ? "Yes" : "")]);
  const last = Math.max(first, first + sorted.length - 1);
  body.push([t(`${list.length} ${list.length === 1 ? "expense" : "expenses"}`, "totalLabel"), t("", "totalLabel"), t("", "totalLabel"), { f: sumF(3, first, last), v: sumC(list, x => x.amount_cents), s: "totalMoney" }, t("", "totalLabel"), t("", "totalLabel")]);
  return sheet(name, e, "Expenses", cols.length, today, body, { lead: plural(list.length, "expense"), freeze: 4, filter: { row: 4, cols: cols.length, last: first + sorted.length - 1 }, stripes: sorted.length ? [`A${first}:F${first + sorted.length - 1}`] : [], cols: [17, 14, 40, 12, 16, 17], tab: "FFC8463D" });
}

// ------------------------------------------------------------------ Cash boxes

export function cashBoxSheet(e: Tournament, list: CashBox[], today: string, name = "Cash boxes"): Sheet {
  const cols = ["Note or coin", "Opening", "Closing", "Keep for next float", "Deposit", "Opening value", "Closing value", "Keep value", "Deposit value"];
  const body: XCell[][] = [];
  const R = () => body.length + 4;
  const heights: Record<number, number> = {};
  if (!list.length) body.push([t("No cash boxes yet.", "subtitle")]);
  list.forEach((b, bi) => {
    if (bi) body.push([]);
    const plan = floatPlan(b.closing, b.opening, b.keep_float_cents);
    const about = [b.counted ? "Counted" : "Not counted yet", b.counted_by ? `by ${b.counted_by}` : "", b.keep_float_cents ? `float target ${money(b.keep_float_cents)}` : ""].filter(Boolean).join(" ");
    heights[R()] = 22;
    body.push([t(b.name, "section"), ...Array.from({ length: cols.length - 1 }, () => t("", "section"))]);
    body.push([t(about + (b.note ? `. ${b.note}` : ""), "subtitle")]);
    body.push(head(cols, [1, 2, 3, 4, 5, 6, 7, 8]));
    const first = R();
    for (const d of DENOMS) {
      const r = R(), k = String(d), face = d / 100;
      const c = (x: Record<string, number | undefined>) => x[k] ?? 0;
      body.push([t(denomLabel(d), "label"), n(c(b.opening)), n(c(b.closing)), n(c(plan.keep)), n(c(plan.deposit)),
        ...[1, 2, 3, 4].map((ci, j) => ({ f: `${ref(ci, r)}*${face}`, v: [c(b.opening), c(b.closing), c(plan.keep), c(plan.deposit)][j] * face, s: "money" as Style }))]);
    }
    const last = R() - 1;
    const sets = [b.opening, b.closing, plan.keep, plan.deposit];
    body.push([t("Total", "totalLabel"),
      ...sets.map((c, j) => ({ f: sumF(1 + j, first, last), v: countPieces(c), s: "totalInt" as Style })),
      ...sets.map((c, j) => ({ f: sumF(5 + j, first, last), v: countTotal(c) / 100, s: "totalMoney" as Style }))]);
    if (plan.shortBy > 0) body.push([t(`The box can only keep ${money(plan.keepCents)} toward the ${money(plan.target)} float, ${money(plan.shortBy)} short.`, "subtitle")]);
  });
  return sheet(name, e, "Cash boxes", cols.length, today, body, { cols: [16, 10, 10, 12, 10, 13, 13, 13, 13], heights, landscape: true, tab: "FF9FB7FF" });
}
const countPieces = (c: Record<string, number | undefined> | null | undefined) => Object.values(c || {}).reduce<number>((s, v) => s + (v ?? 0), 0);

// ------------------------------------------------------------------ Stats

export function statSheet(e: Tournament, d: EditionData, today: string, name = "Stats"): Sheet {
  const body: XCell[][] = [head(["Stat", "Value"], [1])];
  const line = (label: string, v: number | string | null | undefined) => body.push([t(label, "label"), typeof v === "number" ? n(v) : v ? { v, s: "text" } : t("")]);
  line("Fighters", e.fighters_count ?? d.fighters.length);
  line("Divisions", e.divisions);
  line("Fights", e.fights);
  line("Rounds", e.rounds);
  for (const s of e.spectators || []) line(`Spectators, ${day(s.day) || s.day}`, s.count);
  if ((e.spectators || []).length) body.push([t("Spectators, total", "totalLabel"), n(visitors(e), "totalInt")]);
  line("Stream viewers", e.stream_viewers);
  line("Stream time", formatMinutes(e.stream_minutes));
  line("Clubs attending", e.clubs_attending);
  if ((e.podiums || []).length) {
    body.push([]);
    body.push([t("Podiums", "section"), t("", "section"), t("", "section"), t("", "section")]);
    body.push(head(["Division", "First", "Second", "Third"]));
    for (const p of e.podiums) body.push([t(p.division, "label"), t(p.first), t(p.second), t(p.third)]);
  }
  return sheet(name, e, "Stats", 4, today, body, { cols: [28, 22, 22, 22], tab: "FF7442B4" });
}

// ------------------------------------------------------------------ workbooks

export function editionSheets(e: Tournament, d: EditionData, today: string, prefix = ""): Sheet[] {
  const p = (s: string) => (prefix ? `${prefix} ${s}` : s);
  return [summarySheet(e, d, today, p("Summary")), fighterSheet(e, d.fighters, today, p("Fighters")), saleSheet(e, d.sales, today, p("Sales")),
    expenseSheet(e, d.expenses, today, p("Expenses")), cashBoxSheet(e, d.boxes, today, p("Cash boxes")), statSheet(e, d, today, p("Stats"))];
}

/** Every edition side by side, grouped by event, with the change in net from the year before. */
export function overviewSheet(all: { t: Tournament; d: EditionData }[], today: string): Sheet {
  const cols = ["Edition", "Event", "Year", "Dates", "Venue", "Fighters", "Fights", "Spectators", "Fees expected", "Fees collected", "Still owing", "Sales", "Merch", "Total in", "Total out", "Net", "Net vs year before"];
  const rows = all.map(r => ({ ...r, s: summarize(r.d.fighters, r.d.sales, r.d.expenses, r.d.boxes), name: r.t.name, year: r.t.year }));
  const body: XCell[][] = [[{ v: "Red Deer Reavers tournaments", s: "title" }], [{ v: `EVERY EDITION   ·   ${plural(all.length, "edition")}   ·   Exported ${day(today)}`, s: "about" }], [], head(cols, [2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])];
  const first = 5;
  for (const g of byEvent(rows)) g.editions.forEach((r, i) => {
    const s: Summary = r.s, prev = i ? g.editions[i - 1].s : null;
    body.push([t(r.t.code, "label"), t(r.t.name), { v: r.t.year, s: "text" }, t(days(r.t)), t(r.t.venue), n(r.t.fighters_count ?? r.d.fighters.length), n(r.t.fights), n(visitors(r.t) || null),
      $(s.fees.expected), $(s.fees.collected), $(s.fees.owing, s.fees.owing ? "moneyBad" : "money"), $(s.sales.total), $(s.sales.merch), $(s.totalIn), $(s.totalOut), $(s.net, s.net < 0 ? "moneyBad" : "moneyGood"),
      prev ? $(s.net - prev.net, s.net < prev.net ? "moneyBad" : "moneyGood") : t("First year", "muted")]);
  });
  const last = Math.max(first, body.length);
  const all$ = (f: (s: Summary) => number) => rows.reduce((a, r) => a + f(r.s), 0) / 100;
  body.push([t("All editions", "totalLabel"), ...Array.from({ length: 4 }, () => t("", "totalLabel")),
    { f: sumF(5, first, last), v: rows.reduce((a, r) => a + (r.t.fighters_count ?? r.d.fighters.length), 0), s: "totalInt" }, { f: sumF(6, first, last), v: rows.reduce((a, r) => a + (r.t.fights ?? 0), 0), s: "totalInt" }, { f: sumF(7, first, last), v: rows.reduce((a, r) => a + visitors(r.t), 0), s: "totalInt" },
    ...([s => s.fees.expected, s => s.fees.collected, s => s.fees.owing, s => s.sales.total, s => s.sales.merch, s => s.totalIn, s => s.totalOut, s => s.net] as ((s: Summary) => number)[])
      .map((f, j) => ({ f: sumF(8 + j, first, last), v: all$(f), s: "totalMoney" as Style })), t("", "totalLabel")]);
  return { name: "All editions", rows: body, freeze: 4, filter: { row: 4, cols: cols.length, last: body.length - 1 }, merges: [`A1:${ref(cols.length - 1, 1)}`, `A2:${ref(cols.length - 1, 2)}`], heights: { 1: 42, 2: 24, 3: 12, 4: 30 }, stripes: body.length > 5 ? [`A5:Q${body.length - 1}`] : [], cols: [14, 20, 7, 18, 18, 9, 8, 11, 13, 13, 12, 11, 11, 12, 12, 12, 15], landscape: true, tab: "FF4F2382" };
}

