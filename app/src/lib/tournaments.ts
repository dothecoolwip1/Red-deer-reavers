import { kindOf, type Kind } from "./square";

// Money and stats for the tournaments the Reavers host (Money → Tournaments). Plain functions, tested in tournaments.test.ts.

export const METHODS = ["cash", "etransfer", "debit", "credit", "other"] as const;
export type Method = (typeof METHODS)[number];
export const METHOD_LABEL: Record<Method, string> = { cash: "Cash", etransfer: "E-transfer", debit: "Debit", credit: "Credit", other: "Other" };

export const STATUSES = ["paid", "owes", "waived", "not_needed"] as const;
export type FighterStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<FighterStatus, string> = { paid: "Paid", owes: "Owes", waived: "Waived", not_needed: "Not needed" };
/** Pill colours: paid green, owing red, free grey. */
export const STATUS_TONE: Record<FighterStatus, string> = { paid: "done", owes: "overdue", waived: "free", not_needed: "free" };

export const EXPENSE_CATEGORIES = ["venue", "gear", "prizes", "printing", "food", "other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export const EXPENSE_LABEL: Record<ExpenseCategory, string> = { venue: "Venue", gear: "Gear", prizes: "Prizes", printing: "Printing", food: "Food", other: "Other" };
/** The ledger category each kind of tournament money is booked under (from the app's category list). */
export const EXPENSE_LEDGER: Record<ExpenseCategory, string> = { venue: "Venue", gear: "Gear", prizes: "Event costs", printing: "Event costs", food: "Event costs", other: "Event costs" };

/** Bills and coins in the cash box, in cents, biggest first. */
export const DENOMS = [10000, 5000, 2000, 1000, 500, 200, 100, 25, 10, 5] as const;
export const denomLabel = (c: number) => (c >= 100 ? `$${c / 100}` : `${c}¢`);
export type Counts = Partial<Record<string, number>>;

/** The club's tournament price list (from Square). Monthly fighter fees are club dues, never tournament money. */
export const PRICE_LIST: { title: string; price_cents: number; kind: Kind }[] = [
  { title: "Event visitor fee", price_cents: 1000, kind: "visitor" },
  { title: "Under 10 visitor", price_cents: 0, kind: "visitor" },
  { title: "Tournament registration", price_cents: 4000, kind: "tournament" },
  { title: "Fighter trading cards", price_cents: 200, kind: "trading_card" },
  { title: "Complete set of cards", price_cents: 1000, kind: "trading_card" },
  { title: "Small sticker", price_cents: 100, kind: "sticker" },
  { title: "Medium sticker", price_cents: 200, kind: "sticker" },
  { title: "Large sticker", price_cents: 300, kind: "sticker" },
  { title: "Reavers stickers 2-pack", price_cents: 500, kind: "sticker" }
];

export type Tournament = {
  id: string; code: string; name: string; year: number; starts_on: string | null; ends_on: string | null; venue: string | null;
  fighter_fee_cents: number; notes: string | null;
  fighters_count: number | null; divisions: number | null; fights: number | null; rounds: number | null;
  spectators: { day: string; count: number }[]; stream_viewers: number | null; stream_minutes: number | null;
  clubs_attending: number | null; podiums: { division: string; first?: string; second?: string; third?: string }[];
  created_at?: string;
};
export type TournamentFighter = {
  id: string; tournament_id: string; name: string; club: string | null; divisions: string | null; fee_cents: number;
  method: Method | null; paid_cents: number; status: FighterStatus; square_payment_id: string | null; note: string | null;
};
export type TournamentSale = {
  id: string; tournament_id: string; item: string; quantity: number; price_cents: number; method: Method; sold_on: string | null;
  square_item_id: string | null; square_payment_id: string | null;
  /** Square transaction id when the line came from a Square CSV export. */
  square_ref?: string | null; note: string | null;
};
export type TournamentExpense = {
  id: string; tournament_id: string; category: ExpenseCategory; description: string | null; amount_cents: number; method: Method;
  spent_on: string | null; from_cash_box: boolean;
};
export type CashBox = {
  id: string; tournament_id: string; name: string; opening: Counts; closing: Counts; counted: boolean;
  keep_float_cents: number | null; counted_by: string | null; note: string | null;
};

/** A short ID for an edition: "Red Deer Rumble", 2026 → RUMBLE-2026 (the longest word that isn't the town). */
export function editionCode(name: string, year: number): string {
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(w => w && !["RED", "DEER", "THE", "OF", "AND"].includes(w));
  const word = words.sort((a, b) => b.length - a.length)[0] || "EVENT";
  return `${word.slice(0, 20)}-${year}`;
}

export const countTotal = (counts: Counts | null | undefined) =>
  DENOMS.reduce((s, d) => s + d * Math.max(0, Math.floor(Number(counts?.[String(d)] ?? 0)) || 0), 0);
const n = (counts: Counts, d: number) => Math.max(0, Math.floor(Number(counts[String(d)] ?? 0)) || 0);

export type FloatPlan = { target: number; keep: Counts; keepCents: number; deposit: Counts; depositCents: number; shortBy: number };

/**
 * Which notes and coins to leave in the box for next time's float, and what goes to the bank. It keeps the same mix as
 * this time's opening float where the closing count allows, then fills any gap with the smallest change left over (a
 * float needs change, not big bills). Everything else is deposited. shortBy > 0 means the box can't make the float exactly.
 */
export function floatPlan(closing: Counts, opening: Counts, targetCents?: number | null): FloatPlan {
  const total = countTotal(closing);
  const target = Math.min(targetCents ?? countTotal(opening), total);
  const keep: Counts = {};
  let left = target;
  const smallFirst = [...DENOMS].reverse();
  for (const d of smallFirst) {
    const k = Math.min(n(closing, d), n(opening, d), Math.floor(left / d));
    if (k) { keep[String(d)] = k; left -= k * d; }
  }
  for (const d of smallFirst) {
    if (left <= 0) break;
    const k = Math.min(n(closing, d) - n(keep, d), Math.floor(left / d));
    if (k > 0) { keep[String(d)] = n(keep, d) + k; left -= k * d; }
  }
  const deposit: Counts = {};
  for (const d of DENOMS) { const rest = n(closing, d) - n(keep, d); if (rest) deposit[String(d)] = rest; }
  const keepCents = countTotal(keep);
  return { target: targetCents ?? countTotal(opening), keep, keepCents, deposit, depositCents: total - keepCents, shortBy: (targetCents ?? countTotal(opening)) - keepCents };
}

/** What a sale line is: visitor fees, registrations, merch (stickers and cards) or other. */
export function saleKind(item: string): Kind {
  const hit = PRICE_LIST.find(p => p.title.toLowerCase() === item.trim().toLowerCase());
  if (hit) return hit.kind;
  if (/under ?10/i.test(item)) return "visitor";
  return kindOf(item);
}
export const isMerch = (k: Kind) => k === "sticker" || k === "trading_card";

/** The fee a fighter counts toward "expected": nothing for those who didn't have to pay. */
const owed = (f: TournamentFighter) => (f.status === "paid" || f.status === "owes" ? f.fee_cents : 0);

export type MethodRow = { method: Method; expected: number; collected: number };
export type Summary = {
  byMethod: MethodRow[];
  fees: { expected: number; collected: number; owing: number };
  /** square: what came through Square (imported from Square sales or a Square export). */
  sales: { total: number; visitors: number; merch: number; merchQty: number; other: number; card: number };
  fighters: { total: number; paid: number; owing: TournamentFighter[]; free: number; waived: number; notNeeded: number };
  totalIn: number; totalOut: number; net: number; expectedIn: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  cash: { expected: number; boxes: number; counted: boolean; taken: number; overShort: number; opening: number; closing: number };
};

export function summarize(fighters: TournamentFighter[], sales: TournamentSale[], expenses: TournamentExpense[], boxes: CashBox[]): Summary {
  const byMethod: Record<Method, MethodRow> = Object.fromEntries(METHODS.map(m => [m, { method: m, expected: 0, collected: 0 }])) as Record<Method, MethodRow>;
  for (const f of fighters) {
    const m = f.method ?? "other";
    byMethod[m].expected += owed(f);
    byMethod[m].collected += f.paid_cents;
  }
  let visitors = 0, merch = 0, merchQty = 0, other = 0, card = 0;
  for (const s of sales) {
    const amount = s.quantity * s.price_cents;
    byMethod[s.method].expected += amount;
    byMethod[s.method].collected += amount;
    const k = saleKind(s.item);
    if (k === "visitor") visitors += amount;
    else if (isMerch(k)) { merch += amount; merchQty += s.quantity; }
    else other += amount;
    if (s.square_payment_id || s.square_ref) card += amount;
  }
  const expensesByCategory = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c, 0])) as Record<ExpenseCategory, number>;
  for (const e of expenses) expensesByCategory[e.category] += e.amount_cents;
  const feesExpected = fighters.reduce((s, f) => s + owed(f), 0);
  const feesCollected = fighters.reduce((s, f) => s + f.paid_cents, 0);
  const salesTotal = sales.reduce((s, x) => s + x.quantity * x.price_cents, 0);
  const totalOut = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const totalIn = feesCollected + salesTotal;
  const cashExpected = fighters.filter(f => f.method === "cash").reduce((s, f) => s + f.paid_cents, 0)
    + sales.filter(s => s.method === "cash").reduce((s, x) => s + x.quantity * x.price_cents, 0)
    - expenses.filter(e => e.from_cash_box).reduce((s, e) => s + e.amount_cents, 0);
  const opening = boxes.reduce((s, b) => s + countTotal(b.opening), 0);
  const closing = boxes.reduce((s, b) => s + countTotal(b.closing), 0);
  const counted = boxes.length > 0 && boxes.every(b => b.counted);
  return {
    byMethod: METHODS.map(m => byMethod[m]),
    fees: { expected: feesExpected, collected: feesCollected, owing: Math.max(0, feesExpected - feesCollected) },
    sales: { total: salesTotal, visitors, merch, merchQty, other, card },
    fighters: {
      total: fighters.length, paid: fighters.filter(f => f.status === "paid").length,
      owing: fighters.filter(f => f.status === "owes" || (f.status === "paid" && f.paid_cents < f.fee_cents)),
      free: fighters.filter(f => f.status === "waived" || f.status === "not_needed").length,
      waived: fighters.filter(f => f.status === "waived").length, notNeeded: fighters.filter(f => f.status === "not_needed").length
    },
    totalIn, totalOut, net: totalIn - totalOut, expectedIn: feesExpected + salesTotal, expensesByCategory,
    cash: { expected: cashExpected, boxes: boxes.length, counted, opening, closing, taken: closing - opening, overShort: closing - opening - cashExpected }
  };
}

/** Where tournament money sits in the ledger, by how it was paid. */
export const METHOD_ACCOUNT: Record<Method, string> = { cash: "Cash box", etransfer: "Chequing", debit: "Card (not Square)", credit: "Card (not Square)", other: "Other" };

export type LedgerLine = { date: string; description: string; amount_cents: number; category: string; account: string; notes: string | null; source: "tournament"; external_id: string };

/**
 * The ledger lines for an edition: fighter fees, sales and expenses, summed by method (and kind or category).
 * Anything linked to a Square payment is left out, because Square already put it in the ledger.
 */
export function ledgerLinesFor(t: Pick<Tournament, "code" | "starts_on" | "ends_on">, fighters: TournamentFighter[], sales: TournamentSale[], expenses: TournamentExpense[], today: string): LedgerLine[] {
  const date = t.ends_on || t.starts_on || today;
  const lines = new Map<string, LedgerLine>();
  const add = (key: string, amount: number, base: Omit<LedgerLine, "amount_cents" | "external_id" | "date" | "source" | "notes">) => {
    if (!amount) return;
    const id = `tournament-${t.code}-${key}`;
    const line = lines.get(id) ?? { ...base, date, amount_cents: 0, notes: `Posted from Tournaments (${t.code})`, source: "tournament" as const, external_id: id };
    line.amount_cents += amount;
    lines.set(id, line);
  };
  for (const f of fighters) {
    if (f.square_payment_id || !f.paid_cents) continue;
    const m = f.method ?? "other";
    add(`fees-${m}`, f.paid_cents, { description: `${t.code}: fighter fees (${METHOD_LABEL[m].toLowerCase()})`, category: "Event entry", account: METHOD_ACCOUNT[m] });
  }
  for (const s of sales) {
    if (s.square_payment_id) continue;
    const k = saleKind(s.item);
    // From a Square export but not in the app's Square sales: card money sits in the Square account.
    const account = s.square_ref && s.method !== "cash" ? "Square" : METHOD_ACCOUNT[s.method];
    const group = k === "visitor" ? "visitors" : k === "tournament" ? "registrations" : isMerch(k) ? "merch" : "other";
    const label = { visitors: "visitor fees", registrations: "registrations", merch: "merch", other: "other sales" }[group];
    const category = { visitors: "Admissions", registrations: "Event entry", merch: "Merch", other: "Other" }[group];
    add(`${group}-${s.method}${account === "Square" ? "-square" : ""}`, s.quantity * s.price_cents, { description: `${t.code}: ${label} (${METHOD_LABEL[s.method].toLowerCase()})`, category, account });
  }
  for (const e of expenses) {
    add(`expense-${e.category}-${e.method}`, -e.amount_cents, { description: `${t.code}: ${EXPENSE_LABEL[e.category].toLowerCase()} (${METHOD_LABEL[e.method].toLowerCase()})`, category: EXPENSE_LEDGER[e.category], account: e.from_cash_box ? "Cash box" : METHOD_ACCOUNT[e.method] });
  }
  return [...lines.values()];
}

export type SquareLike = {
  id: string; paid_at: string; amount_cents: number; fee_cents: number; refunded_cents: number; channel: "online" | "in_person";
  items: { name: string; quantity: number; amount_cents: number; kind: Kind }[];
};

/** The local calendar day of a timestamp (the event is in Alberta, and so is whoever runs the app). */
export const localDay = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/**
 * Square payments taken during an edition, as sale lines, so card-reader sales aren't typed in twice. Registrations are
 * fighter fees (tick them off on the fighter list) and dues are club money, so both stay out. A payment with no Square fee
 * taken at the table was rung up as cash.
 */
export function squareSaleLines(t: Pick<Tournament, "id" | "starts_on" | "ends_on">, payments: SquareLike[], existing: TournamentSale[], items: { id: string; title: string }[]): Omit<TournamentSale, "id">[] {
  if (!t.starts_on) return [];
  const end = t.ends_on || t.starts_on;
  const done = new Set(existing.filter(s => s.square_payment_id).map(s => `${s.square_payment_id}|${s.item}`));
  const out: Omit<TournamentSale, "id">[] = [];
  for (const p of payments) {
    const day = localDay(p.paid_at);
    if (day < t.starts_on || day > end || p.refunded_cents >= p.amount_cents) continue;
    const method: Method = p.channel === "in_person" && p.fee_cents === 0 ? "cash" : "credit";
    for (const l of p.items) {
      if (l.kind === "dues" || l.kind === "tournament") continue;
      if (done.has(`${p.id}|${l.name}`)) continue;
      const qty = Math.max(1, l.quantity);
      const item = items.find(i => i.title.trim().toLowerCase() === l.name.trim().toLowerCase());
      out.push({ tournament_id: t.id, item: l.name, quantity: qty, price_cents: Math.round(l.amount_cents / qty), method, sold_on: day, square_item_id: item?.id ?? null, square_payment_id: p.id, note: null });
      done.add(`${p.id}|${l.name}`);
    }
  }
  return out;
}

export const formatMinutes = (m: number | null | undefined) => (m ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : "");
/** "21h 50m", "21:50" or plain minutes → minutes. */
export function parseMinutes(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const hm = t.match(/^(\d+)\s*h(?:ours?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?$/i) || t.match(/^(\d+):(\d{1,2})$/);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2] || 0);
  return /^\d+$/.test(t) ? Number(t) : null;
}

/** Year-over-year: each event's editions oldest first, with the change from the year before. */
export function byEvent<T extends { name: string; year: number }>(editions: T[]): { name: string; editions: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const e of editions) groups.set(e.name, [...(groups.get(e.name) || []), e]);
  return [...groups.entries()].map(([name, list]) => ({ name, editions: list.sort((a, b) => a.year - b.year) })).sort((a, b) => a.name.localeCompare(b.name));
}
export const change = (now: number, before: number | null | undefined) => (before === null || before === undefined ? null : now - before);

// ------------------------------------------------------------------ Square CSV exports

const money = (v: string | undefined) => { const t = (v || "").replace(/[$,\s]/g, ""); const neg = /^\(.*\)$/.test(t) || t.startsWith("-"); const x = Number(t.replace(/[()-]/g, "")); return Number.isFinite(x) ? Math.round(x * 100) * (neg ? -1 : 1) : 0; };
const isoDay = (v: string | undefined) => {
  const t = (v || "").trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return null;
};
type Table = { head: string[]; rows: string[][] };
const col = (t: Table, ...names: string[]) => t.head.findIndex(h => names.includes(h.trim().toLowerCase()));

/** "Event visitor fee x 2, Small sticker" or "2 x Event visitor fee" → [name, qty]. */
export function parseDescription(text: string): [string, number][] {
  return text.split(/,(?![^(]*\))/).map(p => p.trim()).filter(Boolean).map(p => {
    const after = p.match(/^(.*?)\s*[x×]\s*(\d+)$/i);
    if (after) return [after[1].trim(), Number(after[2])] as [string, number];
    const before = p.match(/^(\d+)\s*[x×]\s*(.*)$/i);
    if (before) return [before[2].trim(), Number(before[1])] as [string, number];
    return [p, 1] as [string, number];
  });
}

export type SquareCsvResult = { lines: Omit<TournamentSale, "id">[]; skipped: { registrations: number; dues: number; refunds: number; outside: number; already: number }; kind: "items" | "transactions" | "none" };

/**
 * Sale lines from Square Dashboard exports for the edition's days. Give it the "Item sales" (item details) export, the
 * "Transactions" export, or both: items give exact item counts, transactions say whether each sale was cash or card.
 * Registrations (fighter fees, ticked off on the fighter list) and dues (club money) are left out.
 */
export function squareCsvLines(t: Pick<Tournament, "id" | "starts_on" | "ends_on">, tables: string[][][], existing: TournamentSale[], items: { id: string; title: string }[] = []): SquareCsvResult {
  const parsed: Table[] = tables.filter(r => r.length > 1).map(r => ({ head: r[0].map(h => h.trim().toLowerCase()), rows: r.slice(1) }));
  const itemsTable = parsed.find(p => col(p, "item") >= 0 && col(p, "qty", "quantity") >= 0);
  const txTable = parsed.find(p => col(p, "card") >= 0 && col(p, "cash") >= 0);
  const skipped = { registrations: 0, dues: 0, refunds: 0, outside: 0, already: 0 };
  const start = t.starts_on || "0000-00-00", end = t.ends_on || t.starts_on || "9999-12-31";
  const method = new Map<string, Method>();
  if (txTable) {
    const id = col(txTable, "transaction id"), card = col(txTable, "card"), cash = col(txTable, "cash");
    for (const r of txTable.rows) if (r[id]) method.set(r[id].trim(), money(r[card]) > 0 ? "credit" : money(r[cash]) > 0 ? "cash" : "other");
  }
  const done = new Set(existing.filter(s => s.square_ref).map(s => `${s.square_ref}|${s.item.toLowerCase()}`));
  const lines: Omit<TournamentSale, "id">[] = [];
  const push = (day: string, ref: string, name: string, qty: number, amount: number, m: Method) => {
    const k = saleKind(name);
    if (/\bdues\b|monthly/i.test(name) || k === "dues") { skipped.dues++; return; }
    if (k === "tournament") { skipped.registrations++; return; }
    if (day < start || day > end) { skipped.outside++; return; }
    const key = `${ref}|${name.toLowerCase()}`;
    if (done.has(key)) { skipped.already++; return; }
    done.add(key);
    const q = Math.max(1, qty);
    const known = items.find(i => i.title.trim().toLowerCase() === name.trim().toLowerCase());
    const listed = PRICE_LIST.find(p => p.title.toLowerCase() === name.trim().toLowerCase());
    lines.push({ tournament_id: t.id, item: name, quantity: q, price_cents: amount ? Math.round(amount / q) : listed?.price_cents ?? 0, method: m, sold_on: day, square_item_id: known?.id ?? null, square_payment_id: null, square_ref: ref || null, note: "From a Square export" });
  };
  if (itemsTable) {
    const c = { date: col(itemsTable, "date"), item: col(itemsTable, "item"), qty: col(itemsTable, "qty", "quantity"), price: col(itemsTable, "price point name"), gross: col(itemsTable, "gross sales"), id: col(itemsTable, "transaction id"), type: col(itemsTable, "event type") };
    for (const r of itemsTable.rows) {
      if (c.type >= 0 && /refund/i.test(r[c.type] || "")) { skipped.refunds++; continue; }
      const day = isoDay(r[c.date]);
      if (!day || !r[c.item]) continue;
      const variation = c.price >= 0 && r[c.price] && !/^regular$/i.test(r[c.price].trim()) ? ` (${r[c.price].trim()})` : "";
      const ref = (r[c.id] || "").trim();
      push(day, ref, `${r[c.item].trim()}${variation}`, Math.round(Number(r[c.qty]) || 1), money(r[c.gross]), method.get(ref) ?? (txTable ? "other" : "cash"));
    }
    return { lines, skipped, kind: "items" };
  }
  if (txTable) {
    const c = { date: col(txTable, "date"), desc: col(txTable, "description"), gross: col(txTable, "gross sales", "total collected"), id: col(txTable, "transaction id"), type: col(txTable, "event type", "transaction status") };
    for (const r of txTable.rows) {
      if (c.type >= 0 && /refund/i.test(r[c.type] || "")) { skipped.refunds++; continue; }
      const day = isoDay(r[c.date]);
      if (!day) continue;
      const ref = (r[c.id] || "").trim();
      const parts = parseDescription(c.desc >= 0 ? r[c.desc] || "" : "");
      const gross = money(r[c.gross]);
      const listed = parts.map(([name, q]) => (PRICE_LIST.find(p => p.title.toLowerCase() === name.toLowerCase())?.price_cents ?? null) === null ? null : q * PRICE_LIST.find(p => p.title.toLowerCase() === name.toLowerCase())!.price_cents);
      const allPriced = listed.every(x => x !== null) && listed.reduce<number>((s, x) => s + (x ?? 0), 0) === gross;
      if (!parts.length || (!allPriced && parts.length > 1)) push(day, ref, parts.length ? parts.map(([n, q]) => (q > 1 ? `${n} x ${q}` : n)).join(", ") : "Square sale", 1, gross, method.get(ref) ?? "other");
      else parts.forEach(([name, q], i) => push(day, ref, name, q, parts.length === 1 ? gross : listed[i] ?? 0, method.get(ref) ?? "other"));
    }
    return { lines, skipped, kind: "transactions" };
  }
  return { lines, skipped, kind: "none" };
}

const normName = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z]/g, "");

/**
 * Tournament registrations paid through Square during the edition's sign-up window (the 60 days before it, through its
 * last day), matched to fighters on the list by name. Returns the fighter updates to make: paid by credit, linked.
 */
export function registrationMatches(t: Pick<Tournament, "starts_on" | "ends_on">, fighters: TournamentFighter[], payments: (SquareLike & { buyer_name: string | null })[]): { fighter: TournamentFighter; patch: Partial<TournamentFighter> }[] {
  if (!t.starts_on) return [];
  const from = new Date(`${t.starts_on}T12:00:00`); from.setDate(from.getDate() - 60);
  const start = localDay(from.toISOString()), end = t.ends_on || t.starts_on;
  const used = new Set(fighters.map(f => f.square_payment_id).filter(Boolean));
  const out: { fighter: TournamentFighter; patch: Partial<TournamentFighter> }[] = [];
  for (const p of payments) {
    const day = localDay(p.paid_at);
    if (day < start || day > end || used.has(p.id) || !p.buyer_name || p.refunded_cents >= p.amount_cents) continue;
    const reg = p.items.filter(i => i.kind === "tournament").reduce((s, i) => s + i.amount_cents, 0);
    if (!reg) continue;
    const f = fighters.find(x => !x.square_payment_id && !out.some(o => o.fighter.id === x.id) && normName(x.name) === normName(p.buyer_name!));
    if (!f) continue;
    used.add(p.id);
    out.push({ fighter: f, patch: { status: "paid", method: "credit", paid_cents: reg, fee_cents: Math.max(f.fee_cents, reg), square_payment_id: p.id } });
  }
  return out;
}
